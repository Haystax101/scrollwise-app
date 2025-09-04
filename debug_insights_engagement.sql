-- Debug insights engagement counts - PostgreSQL compatible
-- Compare stored counts vs actual record counts

SELECT 
  i.id,
  i.title,
  i.likes_count as stored_likes,
  i.comments_count as stored_comments,
  i.saves_count as stored_saves,
  COALESCE(actual_likes.count, 0) as actual_likes,
  COALESCE(actual_comments.count, 0) as actual_comments,
  COALESCE(actual_saves.count, 0) as actual_saves,
  CASE 
    WHEN i.likes_count != COALESCE(actual_likes.count, 0) THEN 'MISMATCH'
    ELSE 'OK'
  END as likes_status,
  CASE 
    WHEN i.comments_count != COALESCE(actual_comments.count, 0) THEN 'MISMATCH'
    ELSE 'OK'
  END as comments_status
FROM insights i
LEFT JOIN (
  SELECT insight_id, COUNT(*) as count
  FROM insight_likes 
  GROUP BY insight_id
) actual_likes ON i.id = actual_likes.insight_id
LEFT JOIN (
  SELECT insight_id, COUNT(*) as count
  FROM insight_comments 
  GROUP BY insight_id
) actual_comments ON i.id = actual_comments.insight_id
LEFT JOIN (
  SELECT insight_id, COUNT(*) as count
  FROM insight_saves 
  GROUP BY insight_id
) actual_saves ON i.id = actual_saves.insight_id
WHERE (
  i.likes_count != COALESCE(actual_likes.count, 0) OR
  i.comments_count != COALESCE(actual_comments.count, 0) OR
  i.saves_count != COALESCE(actual_saves.count, 0)
)
ORDER BY i.created_at DESC
LIMIT 20;