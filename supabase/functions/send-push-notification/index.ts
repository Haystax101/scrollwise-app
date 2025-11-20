// Modern Push Notification Edge Function
// Updated with 2025 security best practices and latest Deno conventions

import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface NotificationRequest {
  notification_id: string;
  user_id: string;
  type: string;
  message?: string;
  channel?: string;
  batch_id?: string;
  count?: number;
}

interface PushToken {
  push_token: string;
  device_type: string;
  app_version?: string;
  os_version?: string;
}

interface UserPreferences {
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
  high_priority_override: boolean;
  android_social_channel_id: string;
  android_learning_channel_id: string;
  android_system_channel_id: string;
}

const EXPO_ACCESS_TOKEN = Deno.env.get("EXPO_ACCESS_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const FUNCTION_SECRET = Deno.env.get("FUNCTION_SECRET");

if (!EXPO_ACCESS_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing required environment variables");
}

serve(async (req: Request) => {
  // Security: Only allow POST requests
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Security: Validate content type
  if (!req.headers.get("content-type")?.includes("application/json")) {
    return new Response("Invalid content type", { status: 400 });
  }

  // Security: Validate function secret (for database trigger calls)
  // This replaces JWT verification when using --no-verify-jwt
  if (FUNCTION_SECRET) {
    const providedSecret = req.headers.get("x-function-secret");
    if (providedSecret !== FUNCTION_SECRET) {
      console.error("Invalid or missing function secret");
      return new Response("Unauthorized", { status: 401 });
    }
  }

  try {
    const payload: NotificationRequest = await req.json();

    // Input validation
    if (!payload.notification_id || !payload.user_id || !payload.type) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get user's active push tokens with retry logic
    let tokens: PushToken[] = [];
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        const { data, error } = await supabase
          .from("user_push_tokens")
          .select("push_token, device_type, app_version, os_version")
          .eq("user_id", payload.user_id)
          .eq("is_active", true);

        if (error) throw error;
        tokens = data || [];
        break;
      } catch (error) {
        retryCount++;
        if (retryCount >= maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    if (tokens.length === 0) {
      console.log(`No active push tokens for user: ${payload.user_id}`);
      return new Response(
        JSON.stringify({ success: false, reason: "no_tokens" }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Get notification preferences with fallback defaults
    const { data: prefs } = await supabase
      .from("user_notification_preferences")
      .select("*")
      .eq("user_id", payload.user_id)
      .single();

    const userPrefs: UserPreferences = prefs || {
      quiet_hours_enabled: true,
      quiet_hours_start: "22:00",
      quiet_hours_end: "08:00",
      timezone: "GMT",
      high_priority_override: true,
      android_social_channel_id: "social",
      android_learning_channel_id: "learning",
      android_system_channel_id: "system",
    };

    // Check quiet hours (with high priority override)
    const isHighPriority = payload.type === "friend_request" && userPrefs.high_priority_override;
    if (!isHighPriority && userPrefs.quiet_hours_enabled && isQuietHours(userPrefs)) {
      console.log(`Skipping notification due to quiet hours for user: ${payload.user_id}`);

      // Track as deferred, not failed
      await trackNotificationEvent(supabase, payload.notification_id, "deferred", {
        reason: "quiet_hours",
        will_retry: true
      });

      return new Response(
        JSON.stringify({ success: false, reason: "quiet_hours" }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Prepare notification message with generic content for security
    const notificationTitle = "Supercharged";
    let notificationBody = payload.message || "You have a new notification";

    // Use generic messages to prevent PII exposure on lock screen
    if (!payload.message) {
      switch (payload.type) {
        case "like":
          notificationBody = payload.count > 1
            ? `${payload.count} people liked your content`
            : "Someone liked your content";
          break;
        case "comment":
          notificationBody = "New comment on your content";
          break;
        case "friend_request":
          notificationBody = "New friend request";
          break;
        case "streak_reminder":
          notificationBody = "Keep your learning streak going!";
          break;
        default:
          notificationBody = "New notification";
      }
    }

    // Get Android channel ID based on notification type
    const getChannelId = (type: string, channel: string): string => {
      switch (channel || type) {
        case "social":
        case "like":
        case "comment":
        case "friend_request":
          return userPrefs.android_social_channel_id;
        case "learning":
        case "streak_reminder":
        case "goal_achievement":
          return userPrefs.android_learning_channel_id;
        default:
          return userPrefs.android_system_channel_id;
      }
    };

    // Create Expo push messages with enhanced security
    const messages = tokens.map((token) => ({
      to: token.push_token,
      sound: "default",
      title: notificationTitle,
      body: notificationBody,
      data: {
        notification_id: payload.notification_id,
        type: payload.type,
        // Don't include user_id in push payload for security
        ...(payload.batch_id && { batch_id: payload.batch_id }),
      },
      badge: 1,
      priority: isHighPriority ? "high" : "default",
      // Android-specific settings
      channelId: getChannelId(payload.type, payload.channel || ""),
    }));

    // Send to Expo Push API with retry logic
    let expoResponse;
    retryCount = 0;

    console.log(`📤 Sending ${messages.length} push notification(s) to Expo...`);
    console.log(`📱 Tokens: ${tokens.map(t => t.push_token.substring(0, 20) + '...').join(', ')}`);
    console.log(`🔔 Notification: "${notificationTitle}" - "${notificationBody}"`);
    console.log(`⏰ Priority: ${isHighPriority ? 'high' : 'default'}, Type: ${payload.type}`);

    while (retryCount < maxRetries) {
      try {
        const response = await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${EXPO_ACCESS_TOKEN}`,
            "Accept-Encoding": "gzip, deflate",
          },
          body: JSON.stringify(messages),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Expo API error ${response.status}: ${errorText}`);
          throw new Error(`Expo API returned ${response.status}: ${response.statusText}`);
        }

        expoResponse = await response.json();
        console.log(`✅ Expo API response:`, JSON.stringify(expoResponse, null, 2));
        break;
      } catch (error) {
        retryCount++;
        console.error(`⚠️ Attempt ${retryCount}/${maxRetries} failed:`, error);
        if (retryCount >= maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    // Process Expo response and handle token cleanup
    const failedTokens: string[] = [];
    if (Array.isArray(expoResponse.data)) {
      console.log(`📊 Processing ${expoResponse.data.length} ticket(s)...`);
      for (let i = 0; i < expoResponse.data.length; i++) {
        const result = expoResponse.data[i];
        console.log(`Ticket ${i + 1}: status=${result.status}, id=${result.id || 'N/A'}, message=${result.message || 'N/A'}`);

        if (result.status === "error") {
          console.error(`❌ Ticket ${i + 1} failed:`, result.details || result.message);
          const token = tokens[i];
          if (result.details?.error === "DeviceNotRegistered" ||
              result.details?.error === "InvalidCredentials") {
            console.log(`🗑️ Marking token as inactive: ${token.push_token.substring(0, 20)}...`);
            failedTokens.push(token.push_token);
          }
        } else if (result.status === "ok") {
          console.log(`✅ Ticket ${i + 1} accepted by Expo (will be delivered to APNs/FCM)`);
        }
      }
    }

    // Deactivate failed tokens
    if (failedTokens.length > 0) {
      await supabase
        .from("user_push_tokens")
        .update({ is_active: false })
        .in("push_token", failedTokens);
    }

    // Track notification as delivered
    await trackNotificationEvent(supabase, payload.notification_id, "delivered", {
      sent_count: tokens.length - failedTokens.length,
      failed_count: failedTokens.length,
      expo_tickets: expoResponse.data || [],
    });

    // Check receipts immediately (they may not be ready yet, but worth trying)
    if (expoResponse.data && Array.isArray(expoResponse.data)) {
      const tickets = expoResponse.data
        .filter((result: any) => result.status === "ok" && result.id)
        .map((result: any) => result.id);

      if (tickets.length > 0) {
        console.log(`📋 Generated ${tickets.length} push ticket(s) for notification ${payload.notification_id}`);
        console.log(`🎫 Ticket IDs: ${tickets.join(", ")}`);

        // Wait a moment then check receipts
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
          console.log(`🔍 Checking receipts for tickets...`);
          const receiptResponse = await fetch("https://exp.host/--/api/v2/push/getReceipts", {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${EXPO_ACCESS_TOKEN}`,
            },
            body: JSON.stringify({ ids: tickets }),
          });

          if (receiptResponse.ok) {
            const receipts = await receiptResponse.json();
            console.log(`📨 Push Receipts:`, JSON.stringify(receipts, null, 2));

            // Check each receipt for errors
            for (const ticketId of tickets) {
              const receipt = receipts.data?.[ticketId];
              if (receipt) {
                if (receipt.status === "ok") {
                  console.log(`✅ Receipt ${ticketId}: Successfully delivered to APNs/FCM`);
                } else if (receipt.status === "error") {
                  console.error(`❌ Receipt ${ticketId}: DELIVERY FAILED`);
                  console.error(`   Error: ${receipt.message}`);
                  console.error(`   Details:`, JSON.stringify(receipt.details, null, 2));
                }
              } else {
                console.log(`⏳ Receipt ${ticketId}: Not yet available (check again in a few minutes)`);
              }
            }
          } else {
            console.error(`❌ Failed to fetch receipts: ${receiptResponse.status}`);
          }
        } catch (receiptError) {
          console.error(`⚠️ Error checking receipts:`, receiptError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent_count: tokens.length - failedTokens.length,
        failed_count: failedTokens.length,
        deactivated_tokens: failedTokens.length,
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Push notification error:", error);

    // Track notification failure
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const payload: NotificationRequest = await req.clone().json();
      await trackNotificationEvent(supabase, payload.notification_id, "failed", {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
    } catch (trackingError) {
      console.error("Failed to track notification error:", trackingError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});

function isQuietHours(prefs: UserPreferences): boolean {
  try {
    const now = new Date();
    const userTime = new Date(
      now.toLocaleString("en-US", { timeZone: prefs.timezone || "GMT" })
    );
    const currentHour = userTime.getHours();

    const startHour = parseInt(prefs.quiet_hours_start?.split(":")[0] || "22");
    const endHour = parseInt(prefs.quiet_hours_end?.split(":")[0] || "8");

    if (startHour > endHour) {
      // Quiet hours span midnight (e.g., 22:00 to 08:00)
      return currentHour >= startHour || currentHour < endHour;
    } else {
      // Quiet hours within same day
      return currentHour >= startHour && currentHour < endHour;
    }
  } catch (error) {
    console.error("Error calculating quiet hours:", error);
    // Fail safe: assume not quiet hours if calculation fails
    return false;
  }
}

async function trackNotificationEvent(
  supabase: any,
  notificationId: string,
  eventType: string,
  additionalInfo: any
): Promise<void> {
  try {
    await supabase.rpc("track_notification_event", {
      notification_id_param: notificationId,
      event_type: eventType,
      additional_info: additionalInfo,
    });
  } catch (error) {
    console.error("Failed to track notification event:", error);
    // Don't fail the main operation if tracking fails
  }
}