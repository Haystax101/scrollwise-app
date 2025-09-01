-- Simple diagnostic query to identify triggers on insights table
-- Run this FIRST to see exactly what triggers exist

SELECT 
  t.tgname AS trigger_name,
  p.proname AS function_name,
  CASE t.tgtype & 66
    WHEN 2 THEN 'BEFORE'
    WHEN 64 THEN 'INSTEAD OF'
    ELSE 'AFTER'
  END AS timing,
  CASE t.tgtype & 28
    WHEN 4 THEN 'INSERT'
    WHEN 8 THEN 'DELETE' 
    WHEN 16 THEN 'UPDATE'
    WHEN 28 THEN 'INSERT OR DELETE OR UPDATE'
  END AS events,
  t.tgenabled AS enabled
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'insights'
AND t.tgname NOT LIKE 'RI_%'
ORDER BY t.tgname;