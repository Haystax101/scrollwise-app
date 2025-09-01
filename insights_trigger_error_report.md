# Post-Mortem: Insight Publishing Error

## Problem

On September 1, 2025, we encountered a critical error when attempting to publish insights:

```
ERROR: record "new" has no field "user_id" (code: 42703)
```

This prevented any new insights from being created.

## Root Cause Analysis

The investigation determined the error was caused by an outdated and incorrect database trigger attached to the `insights` table.

1.  **Incorrect Trigger:** A trigger, likely named `trigger_update_profile_completion_insights`, was active on the `insights` table.
2.  **Schema Mismatch:** This trigger was designed to update a user's profile completion percentage. It incorrectly attempted to access the `user_id` from the newly inserted insight record (`NEW.user_id`).
3.  **Correct Schema:** The `insights` table does not have a `user_id` column; it correctly uses `author_id` to reference the creator of the insight.

The trigger was a remnant of a previous schema and was not updated to reflect the change from `user_id` to `author_id`, causing the database to throw an error on every new insight insertion.

## Resolution

The issue was resolved by removing the faulty trigger from the database.

-   **Attempted Fix:** We first tried running `fix_profile_completion_trigger.sql`, but this did not resolve the issue, likely because other legacy triggers were also interfering.
-   **Successful Fix:** Running the `clean_triggers.sql` script successfully removed all old and problematic triggers from the `insights` table, immediately resolving the publishing error.

## Prevention

To prevent this issue from recurring, all developers should:

1.  **Run `clean_triggers.sql`:** Before deploying new trigger-related logic or running any new trigger scripts, always run `clean_triggers.sql` in a development environment to ensure a clean state.
2.  **Verify Trigger Logic:** When creating or modifying triggers, always verify that the column names (e.g., `user_id` vs. `author_id`) match the schema of the target table.
