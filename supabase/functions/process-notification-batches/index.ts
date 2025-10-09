// Notification Batch Processing Edge Function
// Handles digest notifications and batched delivery for better user experience

import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const FUNCTION_SECRET = Deno.env.get("FUNCTION_SECRET");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing required environment variables");
}

serve(async (req: Request) => {
  try {
    // Security checks
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const authHeader = req.headers.get("authorization");
    if (FUNCTION_SECRET && !authHeader?.includes(FUNCTION_SECRET)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log("Starting notification batch processing...");

    // Call the database function to process batches
    const { data: processedCount, error: processError } = await supabase
      .rpc("process_notification_batches");

    if (processError) {
      console.error("Error processing batches:", processError);
      throw processError;
    }

    console.log(`Processed ${processedCount || 0} notification batches`);

    // Also process any hourly digest users
    await processHourlyDigests(supabase);

    return new Response(
      JSON.stringify({
        success: true,
        batches_processed: processedCount || 0,
        timestamp: new Date().toISOString()
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Batch processing failed:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});

async function processHourlyDigests(supabase: any): Promise<void> {
  try {
    console.log("Processing hourly digests...");

    // Get users who want hourly digests and have unread notifications
    const { data: digestUsers, error } = await supabase
      .from("user_notification_preferences")
      .select(`
        user_id,
        timezone,
        quiet_hours_enabled,
        quiet_hours_start,
        quiet_hours_end
      `)
      .eq("digest_frequency", "hourly");

    if (error || !digestUsers?.length) {
      console.log("No users configured for hourly digests");
      return;
    }

    for (const user of digestUsers) {
      // Skip if in quiet hours
      if (user.quiet_hours_enabled && isQuietHours(user)) {
        continue;
      }

      // Get unread notifications from the last hour
      const { data: unreadNotifications } = await supabase
        .from("notifications")
        .select("id, type, message, created_at")
        .eq("user_id", user.user_id)
        .eq("is_read", false)
        .eq("push_sent", false)
        .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());

      if (!unreadNotifications?.length) {
        continue;
      }

      // Group notifications by type
      const groupedNotifications = unreadNotifications.reduce((acc: any, notification: any) => {
        if (!acc[notification.type]) {
          acc[notification.type] = [];
        }
        acc[notification.type].push(notification);
        return acc;
      }, {});

      // Create digest message
      const digestParts = [];
      for (const [type, notifications] of Object.entries(groupedNotifications)) {
        const count = (notifications as any[]).length;
        switch (type) {
          case "like":
            digestParts.push(`${count} new likes`);
            break;
          case "comment":
            digestParts.push(`${count} new comments`);
            break;
          case "save":
            digestParts.push(`${count} saves`);
            break;
          case "friend_request":
            digestParts.push(`${count} friend requests`);
            break;
          default:
            digestParts.push(`${count} ${type} notifications`);
        }
      }

      if (digestParts.length > 0) {
        const digestMessage = `Your hourly update: ${digestParts.join(", ")}`;

        // Create digest notification
        await supabase.rpc("create_notification_secure", {
          recipient_id: user.user_id,
          source_user_id: user.user_id,
          notification_type: "digest",
          custom_message: digestMessage,
          action_url: "/notifications",
          additional_data: {
            digest_type: "hourly",
            notification_count: unreadNotifications.length,
            types_included: Object.keys(groupedNotifications)
          }
        });

        // Mark original notifications as processed (but keep them for history)
        await supabase
          .from("notifications")
          .update({ push_sent: true, push_sent_at: new Date().toISOString() })
          .in("id", unreadNotifications.map((n: any) => n.id));

        console.log(`Created hourly digest for user ${user.user_id} with ${unreadNotifications.length} notifications`);
      }
    }

  } catch (error) {
    console.error("Error processing hourly digests:", error);
  }
}

function isQuietHours(prefs: any): boolean {
  try {
    if (!prefs.quiet_hours_enabled) return false;

    const now = new Date();
    const userTime = new Date(
      now.toLocaleString("en-US", { timeZone: prefs.timezone || "GMT" })
    );
    const currentHour = userTime.getHours();

    const startHour = parseInt(prefs.quiet_hours_start?.split(":")[0] || "22");
    const endHour = parseInt(prefs.quiet_hours_end?.split(":")[0] || "8");

    if (startHour > endHour) {
      return currentHour >= startHour || currentHour < endHour;
    } else {
      return currentHour >= startHour && currentHour < endHour;
    }
  } catch (error) {
    console.error("Error calculating quiet hours:", error);
    return false;
  }
}