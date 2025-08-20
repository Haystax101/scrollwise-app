-- Verify the Voltz system is working correctly

-- 1. Check that the new fields exist and have data
SELECT 
    id,
    full_name,
    total_voltz_earned,
    spendable_voltz,
    level,
    CASE 
        WHEN total_voltz_earned IS NULL THEN 'Missing total_voltz_earned'
        WHEN spendable_voltz IS NULL THEN 'Missing spendable_voltz'
        ELSE 'OK'
    END as status
FROM profiles 
LIMIT 5;

-- 2. Test the Voltz function with a small earn operation
-- Replace 'your-user-id' with a real user ID from your profiles table
DO $$
DECLARE
    test_user_id UUID;
    before_total INTEGER;
    before_spendable INTEGER;
    after_total INTEGER;
    after_spendable INTEGER;
BEGIN
    -- Get a test user ID
    SELECT id INTO test_user_id FROM profiles LIMIT 1;
    
    -- Record before values
    SELECT total_voltz_earned, spendable_voltz 
    INTO before_total, before_spendable
    FROM profiles WHERE id = test_user_id;
    
    -- Test earning 10 Voltz
    PERFORM update_user_voltz(test_user_id, 10, 'earned', 'system_test');
    
    -- Check after values
    SELECT total_voltz_earned, spendable_voltz 
    INTO after_total, after_spendable
    FROM profiles WHERE id = test_user_id;
    
    -- Display results
    RAISE NOTICE 'Test User ID: %', test_user_id;
    RAISE NOTICE 'Before: Total=%, Spendable=%', before_total, before_spendable;
    RAISE NOTICE 'After earning 10: Total=%, Spendable=%', after_total, after_spendable;
    
    IF after_total = before_total + 10 AND after_spendable = before_spendable + 10 THEN
        RAISE NOTICE 'SUCCESS: Voltz earning works correctly!';
    ELSE
        RAISE NOTICE 'ERROR: Voltz earning did not work as expected';
    END IF;
END $$;