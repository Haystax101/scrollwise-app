-- Check current push tokens and when they were registered
SELECT
  user_id,
  LEFT(push_token, 40) || '...' as token_preview,
  device_type,
  is_active,
  created_at,
  updated_at,
  CASE
    WHEN created_at > NOW() - INTERVAL '1 hour' THEN '🆕 NEW TOKEN (within last hour)'
    WHEN created_at > NOW() - INTERVAL '24 hours' THEN '⏰ Recent (within 24h)'
    ELSE '⚠️ OLD TOKEN (may not work with new build)'
  END as token_age
FROM user_push_tokens
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 10;
