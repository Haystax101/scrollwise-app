// Daily Streak Reminders Edge Function
// Modern implementation with 2025 security practices and performance optimizations

import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface StreakUser {
  user_id: string;
  current_streak: number;
  target_days: number;
  full_name: string;
  timezone: string;
  streak_reminders: boolean;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const FUNCTION_SECRET = Deno.env.get("FUNCTION_SECRET"); // Additional security

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing required environment variables");
}

serve(async (req: Request) => {
  try {
    // Security: Validate request method and authorization
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // Additional security: Check for function secret in production
    const authHeader = req.headers.get("authorization");
    if (FUNCTION_SECRET && !authHeader?.includes(FUNCTION_SECRET)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log("Starting daily streak reminders job...");

    // Find users who need streak reminders with optimized query
    // Using explicit joins for better performance and to avoid RLS issues
    const { data: usersToRemind, error: queryError } = await supabase
      .from("user_streaks")
      .select(`
        user_id,
        current_streak,
        target_days,
        profiles!inner(
          full_name
        ),
        user_notification_preferences!inner(
          streak_reminders,
          timezone,
          quiet_hours_enabled,
          quiet_hours_start,
          quiet_hours_end
        )
      `)
      .eq("streak_type", "daily_learning")
      .eq("is_active", true)
      .eq("user_notification_preferences.streak_reminders", true)
      .not("user_id", "in", `(
        SELECT DISTINCT user_id
        FROM user_daily_activities
        WHERE activity_date = CURRENT_DATE
      )`);

    if (queryError) {
      console.error("Database query error:", queryError);
      throw queryError;
    }

    if (!usersToRemind || usersToRemind.length === 0) {
      console.log("No users need streak reminders today");
      return new Response(
        JSON.stringify({
          success: true,
          reminders_sent: 0,
          message: "No users need reminders"
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${usersToRemind.length} users who need streak reminders`);

    let remindersCreated = 0;
    let remindersFailed = 0;
    const batchSize = 50; // Process in batches to avoid overwhelming the system

    // Process users in batches for better performance
    for (let i = 0; i < usersToRemind.length; i += batchSize) {
      const batch = usersToRemind.slice(i, i + batchSize);

      await Promise.allSettled(
        batch.map(async (user: any) => {
          try {
            const userPrefs = user.user_notification_preferences;
            const profile = user.profiles;

            // Skip if user has quiet hours enabled and it's currently quiet time
            if (userPrefs.quiet_hours_enabled && isQuietHours(userPrefs)) {
              console.log(`Skipping reminder for user ${user.user_id} due to quiet hours`);
              return;
            }

            // Create personalized, motivational message
            const message = generateStreakMessage(user.current_streak, user.target_days);

            // Create notification record using the secure function
            const { data: notification, error: notificationError } = await supabase
              .rpc("create_notification_secure", {
                recipient_id: user.user_id,
                source_user_id: user.user_id, // System notification
                notification_type: "streak_reminder",
                content_type: null,
                content_id: null,
                custom_message: message,
                action_url: "/learning",
                additional_data: {
                  current_streak: user.current_streak,
                  target_days: user.target_days,
                  reminder_type: "daily",
                  generated_at: new Date().toISOString()
                },
                channel_override: "learning"
              });

            if (notificationError) {
              console.error(`Failed to create notification for user ${user.user_id}:`, notificationError);
              remindersFailed++;
              return;
            }

            if (notification) {
              console.log(`Created streak reminder notification for user ${user.user_id}`);
              remindersCreated++;
            } else {
              console.log(`Notification skipped for user ${user.user_id} (likely due to preferences)`);
            }

          } catch (error) {
            console.error(`Error processing reminder for user ${user.user_id}:`, error);
            remindersFailed++;
          }
        })
      );

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < usersToRemind.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Process any pending notification batches
    console.log("Processing pending notification batches...");
    const { data: batchResult } = await supabase
      .rpc("process_notification_batches");

    const batchesProcessed = batchResult || 0;

    // Clean up old notifications and batches
    console.log("Running cleanup tasks...");
    await supabase.rpc("cleanup_notifications");

    const result = {
      success: true,
      total_candidates: usersToRemind.length,
      reminders_created: remindersCreated,
      reminders_failed: remindersFailed,
      batches_processed: batchesProcessed,
      execution_time: new Date().toISOString()
    };

    console.log("Streak reminders job completed:", result);

    return new Response(
      JSON.stringify(result),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Streak reminder job failed:", error);

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

function generateStreakMessage(currentStreak: number, targetDays: number): string {
  const messages = [
    // For new streaks (1-3 days)
    ...(currentStreak <= 3 ? [
      "You're building momentum! Keep your learning streak alive today 🔥",
      "Every expert was once a beginner. Continue your journey today!",
      "Your future self will thank you for learning today ✨"
    ] : []),

    // For established streaks (4-14 days)
    ...(currentStreak >= 4 && currentStreak <= 14 ? [
      `${currentStreak} days strong! Don't break the chain now 💪`,
      `You're on a roll with ${currentStreak} days! Keep the momentum going`,
      `${currentStreak}-day streak is impressive! Let's make it ${currentStreak + 1} 🚀`
    ] : []),

    // For long streaks (15+ days)
    ...(currentStreak >= 15 ? [
      `Amazing ${currentStreak}-day streak! You're unstoppable 🏆`,
      `${currentStreak} days of consistent learning! This is how champions are made`,
      `Your ${currentStreak}-day streak is inspiring! Keep leading by example 🌟`
    ] : []),

    // Goal-oriented messages
    ...(targetDays && currentStreak < targetDays ? [
      `${targetDays - currentStreak} days to your ${targetDays}-day goal! You've got this 🎯`,
      `Only ${targetDays - currentStreak} more days to reach your target! Stay focused 💎`
    ] : []),

    // Milestone messages
    ...(currentStreak === 6 ? ["One week streak incoming! Just one more day 📅"] : []),
    ...(currentStreak === 13 ? ["Two weeks of learning! You're building an incredible habit 🌱"] : []),
    ...(currentStreak === 29 ? ["30-day milestone tomorrow! This is legendary territory 👑"] : [])
  ];

  // Fallback message if no specific message matches
  if (messages.length === 0) {
    return `Keep your ${currentStreak}-day learning streak going! 🔥`;
  }

  // Return a random appropriate message
  return messages[Math.floor(Math.random() * messages.length)];
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
      // Quiet hours span midnight
      return currentHour >= startHour || currentHour < endHour;
    } else {
      // Quiet hours within same day
      return currentHour >= startHour && currentHour < endHour;
    }
  } catch (error) {
    console.error("Error calculating quiet hours:", error);
    return false;
  }
}