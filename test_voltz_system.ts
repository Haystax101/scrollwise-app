// Test script for the new Voltz system
// Run this after applying the database migration to verify everything works

import { supabase } from './lib/supabase';
import { voltzService } from './lib/voltzService';

export async function testVoltzSystem() {
  console.log('🔋 Testing Voltz System...\n');
  
  try {
    // Test user ID - replace with a real user ID from your database
    const testUserId = 'your-test-user-id-here';
    
    console.log('1. Testing Voltz Stats Retrieval...');
    const stats = await voltzService.getVoltzStats(testUserId);
    console.log('   Stats:', stats);
    
    console.log('\n2. Testing Direct Database Query...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('total_voltz_earned, spendable_voltz, level')
      .eq('id', testUserId)
      .single();
    
    if (profileError) {
      console.error('   Error:', profileError);
    } else {
      console.log('   Profile Data:', profileData);
    }
    
    console.log('\n3. Testing Voltz Functions...');
    const { data: functionResult, error: functionError } = await supabase
      .rpc('get_user_voltz_stats', { p_user_id: testUserId });
    
    if (functionError) {
      console.error('   Function Error:', functionError);
    } else {
      console.log('   Function Result:', functionResult);
    }
    
    console.log('\n4. Testing Earn Voltz (dry run - uncomment to actually earn)...');
    // Uncomment the next line to actually test earning voltz
    // const earnResult = await voltzService.earnVoltz(testUserId, 5, 'system_test');
    // console.log('   Earn Result:', earnResult);
    
    console.log('\n5. Testing Transaction History...');
    const history = await voltzService.getTransactionHistory(testUserId, 5);
    console.log('   Recent Transactions:', history);
    
    console.log('\n✅ Voltz System Test Complete!');
    
    return {
      success: true,
      stats,
      profileData,
      functionResult,
      history
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error
    };
  }
}

// Helper function to test the migration
export async function verifyMigration() {
  console.log('🔍 Verifying Migration...\n');
  
  try {
    // Check if new fields exist
    console.log('1. Checking table structure...');
    const { data: columns, error } = await supabase.rpc('get_table_columns', {
      table_name: 'profiles'
    });
    
    if (error) {
      console.log('   Using alternative method to check columns...');
      
      // Try to select the new fields
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('total_voltz_earned, spendable_voltz')
        .limit(1);
        
      if (testError) {
        console.error('   ❌ New fields not found:', testError);
        return false;
      } else {
        console.log('   ✅ New fields exist and are accessible');
      }
    } else {
      const hasNewFields = columns.some((col: any) => 
        ['total_voltz_earned', 'spendable_voltz'].includes(col.column_name)
      );
      console.log('   New fields present:', hasNewFields);
    }
    
    // Check if functions exist
    console.log('\n2. Checking Voltz functions...');
    const functions = ['update_user_voltz', 'get_user_voltz_stats'];
    
    for (const funcName of functions) {
      try {
        // This will fail gracefully if function doesn't exist
        const { error: funcError } = await supabase.rpc(funcName, {});
        if (funcError && !funcError.message.includes('missing arguments')) {
          console.log(`   ⚠️  Function ${funcName} may not exist:`, funcError.message);
        } else {
          console.log(`   ✅ Function ${funcName} exists`);
        }
      } catch (err) {
        console.log(`   ❌ Function ${funcName} not accessible`);
      }
    }
    
    console.log('\n✅ Migration verification complete!');
    return true;
    
  } catch (error) {
    console.error('❌ Migration verification failed:', error);
    return false;
  }
}

// Usage:
// import { testVoltzSystem, verifyMigration } from './test_voltz_system';
// 
// // First verify the migration worked
// verifyMigration().then(success => {
//   if (success) {
//     // Then test the system with a real user ID
//     testVoltzSystem();
//   }
// });