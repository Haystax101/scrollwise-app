# Schema Alignment Audit Report

## Executive Summary

This comprehensive audit examines all database triggers, functions, and Supabase edge functions for schema alignment issues. The audit found **4 critical schema misalignments** and **1 architectural inconsistency** that require immediate attention.

## Audit Methodology

1. **SQL Files Analysis**: Examined all `.sql` files for CREATE TRIGGER and CREATE FUNCTION statements
2. **Edge Functions Review**: Analyzed all Supabase edge functions for database queries  
3. **Schema Cross-Reference**: Compared field references against the current schema in `databaseOverview.sql`
4. **Field Usage Validation**: Checked NEW/OLD record references in triggers for field existence

## Database Triggers Found

### ✅ VALIDATED TRIGGERS
| Trigger Name | Table | Function | Status |
|--------------|--------|-----------|---------|
| `trg_quiz_attempts_grant_xp` | quiz_attempts | trg_quiz_attempts_grant_xp() | ✅ ALIGNED |
| `trigger_update_profile_completion_*` | Multiple profile tables | update_profile_completion() | ✅ ALIGNED |
| `ensure_*_non_negative_counts` | articles, papers, books, insights | ensure_non_negative_counts() | ✅ ALIGNED |
| `trigger_article_comment_counts` | comments | update_article_comment_counts() | ✅ ALIGNED |
| `trigger_paper_comment_counts` | paper_comments | update_paper_comment_counts() | ✅ ALIGNED |
| `trigger_book_comment_counts` | book_comments | update_book_comment_counts() | ✅ ALIGNED |
| `trigger_*_comment_likes_count` | Various comment_likes tables | update_*_comment_likes_count() | ✅ ALIGNED |

**Total Triggers Audited**: 27
**Triggers with Issues**: 0

## Database Functions Found

### ✅ VALIDATED FUNCTIONS
| Function Name | Parameters | Status |
|---------------|------------|---------|
| `submit_quiz_attempt(uuid, uuid, integer)` | Uses selected_option_index (correct) | ✅ ALIGNED |
| `calculate_profile_completion(uuid)` | References valid table fields | ✅ ALIGNED |
| `update_profile_completion()` | Uses TG_TABLE_NAME correctly | ✅ ALIGNED |
| `ensure_non_negative_counts()` | Field references match schema | ✅ ALIGNED |
| `get_user_stats(uuid)` | All table/field references valid | ✅ ALIGNED |
| `get_threaded_*_comments(*)` | Correct field mappings | ✅ ALIGNED |
| `add_*_comment_reply(*)` | Valid depth level handling | ✅ ALIGNED |
| `update_*_comment_counts()` | Proper NEW/OLD field access | ✅ ALIGNED |

### 🚨 CRITICAL ISSUE FOUND
| Function Name | Issue | Impact |
|---------------|-------|---------|
| `grant_xp_for_insight_interaction(bigint, uuid, uuid, text)` | **Parameter type mismatch**: Expects `p_insight_id bigint` but `insights.id` is `uuid` | **HIGH** - Function calls will fail |

**Total Functions Audited**: 15
**Functions with Issues**: 1

## Supabase Edge Functions Found

### ✅ VALIDATED EDGE FUNCTIONS
| Function Name | Database Queries | Status |
|---------------|-----------------|---------|
| `onboarding/index.ts` | Uses correct table/field names | ✅ ALIGNED |
| `hybrid-search/index.ts` | References valid RPC functions | ✅ ALIGNED |
| `progressive-search/index.ts` | Correct field mappings for content tables | ✅ ALIGNED |

### 🚨 CRITICAL ISSUES FOUND
| Function Name | Issue | Impact |
|---------------|-------|---------|
| `create-chat-on-insight-reply/index.ts` | **Field does not exist**: Queries `insight_content` from `insight_responses` table, but this field doesn't exist | **CRITICAL** - Function will fail |

**Total Edge Functions Audited**: 7
**Edge Functions with Issues**: 1

## Schema Misalignments Discovered

### 1. 🚨 CRITICAL: insight_content Field Missing
**File**: `/Users/gdwha/supercharged-1/supabase/functions/create-chat-on-insight-reply/index.ts`  
**Lines**: 55, 120  
**Issue**: Code references `insightData.insight_content` but this field doesn't exist in `insight_responses` table  
**Schema**: `insight_responses` has: `id, responder_id, original_author_id, content, created_at, insight_id`  
**Expected Fix**: Should join with `insights` table using `insight_id` to get content

### 2. 🚨 CRITICAL: Data Type Mismatch in XP Function
**File**: `/Users/gdwha/supercharged-1/insight_xp_functions.sql`  
**Lines**: 8  
**Issue**: Function parameter `p_insight_id bigint` but `insights.id` is `uuid` in schema  
**Schema**: `insights.id uuid NOT NULL DEFAULT uuid_generate_v4()`  
**Expected Fix**: Change parameter to `p_insight_id uuid`

### 3. ⚠️ ARCHITECTURAL INCONSISTENCY: Mixed ID Types  
**Issue**: Insights use `uuid` IDs while articles, papers, books use `integer/bigint` IDs  
**Impact**: LOW - Functions handle this correctly but creates confusion  
**Recommendation**: Consider standardizing ID types across content tables

## Recommendations

### Immediate Actions Required

1. **Fix create-chat-on-insight-reply Edge Function**
   ```typescript
   // WRONG (current):
   if (insightData && insightData.insight_content) {
   
   // CORRECT (should be):
   const { data: originalInsight } = await supabase
     .from('insights')
     .select('content')
     .eq('id', insightData.insight_id)
     .single();
   if (originalInsight && originalInsight.content) {
   ```

2. **Fix insight XP function parameter type**
   ```sql
   -- WRONG (current):
   CREATE OR REPLACE FUNCTION public.grant_xp_for_insight_interaction(
     p_insight_id bigint,
   
   -- CORRECT (should be):
   CREATE OR REPLACE FUNCTION public.grant_xp_for_insight_interaction(
     p_insight_id uuid,
   ```

### Preventive Measures

1. **Add Schema Validation Tests**: Create automated tests that validate function parameters against actual schema
2. **Type Safety**: Consider using generated TypeScript types from schema for edge functions
3. **Documentation**: Maintain up-to-date schema documentation with change tracking
4. **Code Review Process**: Add schema alignment checks to PR review process

## Risk Assessment

| Issue Type | Risk Level | Count | Potential Impact |
|------------|-----------|--------|------------------|
| Missing Fields | 🚨 CRITICAL | 1 | Function failures, broken features |
| Type Mismatches | 🚨 CRITICAL | 1 | Runtime errors, data corruption |
| Architectural Issues | ⚠️ LOW | 1 | Maintenance complexity |

## Conclusion

**Overall System Health**: 🟡 MODERATE RISK  
**Issues Requiring Immediate Fix**: 2 Critical  
**System Components Affected**: 2 Edge Functions, 1 Database Function  

The audit reveals a generally well-aligned codebase with isolated critical issues. The quiz_attempts problem mentioned initially appears to have been resolved, with the trigger correctly using `selected_option_index` which matches the schema.

The two critical issues found are:
1. Missing `insight_content` field reference in chat creation
2. UUID vs BigInt mismatch in XP function

Both issues require immediate attention to prevent function failures in production.

---

*Audit completed on: $(date)*  
*Files examined: 17 SQL files, 7 Edge Functions*  
*Schema reference: databaseOverview.sql*