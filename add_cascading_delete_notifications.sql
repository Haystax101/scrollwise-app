-- Add Cascading Delete for Notifications Table
-- This allows profiles to be deleted without being blocked by notifications

-- Step 1: Drop existing foreign key constraints on notifications table
ALTER TABLE public.notifications
DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

ALTER TABLE public.notifications
DROP CONSTRAINT IF EXISTS notifications_source_user_id_fkey;

-- Step 2: Add new foreign key constraints with CASCADE delete
-- When a user is deleted, all notifications TO that user will be deleted
ALTER TABLE public.notifications
ADD CONSTRAINT notifications_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- When a user is deleted, all notifications FROM that user will be deleted
ALTER TABLE public.notifications
ADD CONSTRAINT notifications_source_user_id_fkey
FOREIGN KEY (source_user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Step 3: Also add cascading delete for notification_batches table
ALTER TABLE public.notification_batches
DROP CONSTRAINT IF EXISTS notification_batches_user_id_fkey;

ALTER TABLE public.notification_batches
ADD CONSTRAINT notification_batches_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Step 4: Add cascading delete for profile_passions table
ALTER TABLE public.profile_passions
DROP CONSTRAINT IF EXISTS profile_passions_user_id_fkey;

ALTER TABLE public.profile_passions
ADD CONSTRAINT profile_passions_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Verify the constraints
SELECT
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as foreign_table,
  confdeltype as on_delete_action,
  CASE confdeltype
    WHEN 'c' THEN 'CASCADE'
    WHEN 'r' THEN 'RESTRICT'
    WHEN 'n' THEN 'SET NULL'
    WHEN 'a' THEN 'NO ACTION'
    WHEN 'd' THEN 'SET DEFAULT'
    ELSE 'UNKNOWN'
  END as delete_action_name
FROM pg_constraint
WHERE conrelid IN ('notifications'::regclass, 'notification_batches'::regclass, 'profile_passions'::regclass)
AND contype = 'f'
ORDER BY conrelid::regclass::text, conname;

-- Test summary
SELECT
  '✅ Cascading delete enabled for notifications' as status,
  'Deleting a profile will now automatically delete all related notifications' as description
UNION ALL
SELECT
  '✅ Cascading delete enabled for notification_batches' as status,
  'Deleting a profile will now automatically delete all related notification batches' as description
UNION ALL
SELECT
  '✅ Cascading delete enabled for profile_passions' as status,
  'Deleting a profile will now automatically delete all related profile passions (passionate_about, working_on)' as description;
