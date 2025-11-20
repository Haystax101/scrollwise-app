-- User Reporting and Blocking System
-- For App Store compliance: allows users to report content and block other users

-- =====================================================
-- TABLE: user_reports
-- Tracks content reports with reasons
-- =====================================================
CREATE TABLE IF NOT EXISTS user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('insight', 'comment', 'profile')),
  content_id TEXT, -- Can be NULL for profile reports
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'misinformation', 'other')),
  details TEXT, -- Optional additional details from reporter
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicate reports for same content
  CONSTRAINT unique_report UNIQUE (reporter_id, reported_user_id, content_type, content_id)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_reports_reporter ON user_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_reported ON user_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports(status);
CREATE INDEX IF NOT EXISTS idx_user_reports_created ON user_reports(created_at DESC);

-- RLS Policies
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

-- Users can create their own reports
CREATE POLICY "Users can create reports"
  ON user_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON user_reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- =====================================================
-- TABLE: user_blocks
-- Tracks user-to-user blocks
-- =====================================================
CREATE TABLE IF NOT EXISTS user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicate blocks and self-blocks
  CONSTRAINT unique_block UNIQUE (blocker_id, blocked_id),
  CONSTRAINT no_self_block CHECK (blocker_id != blocked_id)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks(blocked_id);

-- RLS Policies
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

-- Users can manage their own blocks
CREATE POLICY "Users can create blocks"
  ON user_blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can view own blocks"
  ON user_blocks FOR SELECT
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can delete own blocks"
  ON user_blocks FOR DELETE
  USING (auth.uid() = blocker_id);

-- =====================================================
-- FUNCTION: report_user_content
-- Creates a report and optionally blocks the user
-- =====================================================
CREATE OR REPLACE FUNCTION report_user_content(
  p_reported_user_id UUID,
  p_content_type TEXT,
  p_content_id TEXT,
  p_reason TEXT,
  p_details TEXT DEFAULT NULL,
  p_also_block BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reporter_id UUID;
  v_report_id UUID;
  v_block_id UUID;
BEGIN
  -- Get current user
  v_reporter_id := auth.uid();

  IF v_reporter_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Prevent self-reporting
  IF v_reporter_id = p_reported_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot report yourself');
  END IF;

  -- Create the report
  INSERT INTO user_reports (
    reporter_id,
    reported_user_id,
    content_type,
    content_id,
    reason,
    details
  ) VALUES (
    v_reporter_id,
    p_reported_user_id,
    p_content_type,
    p_content_id,
    p_reason,
    p_details
  )
  ON CONFLICT (reporter_id, reported_user_id, content_type, content_id)
  DO UPDATE SET
    reason = EXCLUDED.reason,
    details = EXCLUDED.details,
    updated_at = NOW()
  RETURNING id INTO v_report_id;

  -- Optionally block the user
  IF p_also_block THEN
    INSERT INTO user_blocks (blocker_id, blocked_id)
    VALUES (v_reporter_id, p_reported_user_id)
    ON CONFLICT (blocker_id, blocked_id) DO NOTHING
    RETURNING id INTO v_block_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'report_id', v_report_id,
    'blocked', p_also_block AND v_block_id IS NOT NULL
  );
END;
$$;

-- =====================================================
-- FUNCTION: toggle_user_block
-- Blocks or unblocks a user
-- =====================================================
CREATE OR REPLACE FUNCTION toggle_user_block(
  p_blocked_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_blocker_id UUID;
  v_existing_block UUID;
  v_is_blocked BOOLEAN;
BEGIN
  -- Get current user
  v_blocker_id := auth.uid();

  IF v_blocker_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Prevent self-blocking
  IF v_blocker_id = p_blocked_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot block yourself');
  END IF;

  -- Check if already blocked
  SELECT id INTO v_existing_block
  FROM user_blocks
  WHERE blocker_id = v_blocker_id AND blocked_id = p_blocked_id;

  IF v_existing_block IS NOT NULL THEN
    -- Unblock
    DELETE FROM user_blocks WHERE id = v_existing_block;
    v_is_blocked := FALSE;
  ELSE
    -- Block
    INSERT INTO user_blocks (blocker_id, blocked_id)
    VALUES (v_blocker_id, p_blocked_id);
    v_is_blocked := TRUE;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'is_blocked', v_is_blocked
  );
END;
$$;

-- =====================================================
-- FUNCTION: get_blocked_user_ids
-- Returns array of user IDs that the current user has blocked
-- =====================================================
CREATE OR REPLACE FUNCTION get_blocked_user_ids()
RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_blocked_ids UUID[];
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN ARRAY[]::UUID[];
  END IF;

  SELECT ARRAY_AGG(blocked_id) INTO v_blocked_ids
  FROM user_blocks
  WHERE blocker_id = v_user_id;

  RETURN COALESCE(v_blocked_ids, ARRAY[]::UUID[]);
END;
$$;

-- =====================================================
-- FUNCTION: is_user_blocked
-- Checks if a specific user is blocked by the current user
-- =====================================================
CREATE OR REPLACE FUNCTION is_user_blocked(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_blocker_id UUID;
BEGIN
  v_blocker_id := auth.uid();

  IF v_blocker_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM user_blocks
    WHERE blocker_id = v_blocker_id AND blocked_id = p_user_id
  );
END;
$$;

-- =====================================================
-- Verification
-- =====================================================
SELECT
  'USER REPORTING AND BLOCKING SYSTEM DEPLOYED' as status,
  'Tables: user_reports, user_blocks' as tables,
  'Functions: report_user_content, toggle_user_block, get_blocked_user_ids, is_user_blocked' as functions;
