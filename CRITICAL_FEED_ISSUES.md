# Critical Feed Issues - December 2024

## 🚨 Immediate Issues Requiring Fixes

### 1. Quiz System Broken
- **Status**: ❌ **Quizzes are not appearing in the feed**
- **Root Cause**: Insights integration likely broke existing quiz logic in feed algorithm
- **Impact**: Users not seeing quiz questions between content items
- **Location**: Quiz logic exists in `lib/feedAlgorithm.ts` but needs investigation
- **Fix Required**: Debug quiz insertion logic and restore quiz functionality

### 2. Article Summary System Update
- **Status**: 📋 **Two-tier summary system needs implementation**
- **Database Changes**: 
  - `articles` table now has two fields: `summary` and `longer_summary`
  - Need to update display logic to use appropriate summary based on context
- **Implementation Required**:
  - **Card Preview**: Use `summary` field for standard article cards
  - **Expanded Modal**: Use `longer_summary` field for "read more" expanded view
  - **Legacy Support**: If `longer_summary` is null, fall back to `summary` field
  - **UI Change**: **Remove "Simplify" button from articles** (keep for papers only)

### 3. Current Feed Algorithm Status
- ✅ Time-based decay scoring
- ✅ Industry filtering 
- ✅ User interaction tracking (likes, saves, views)
- ✅ Content diversity (articles, papers, books, insights)
- ✅ Insights scoring with voltz_spent integration
- ❌ **Quiz insertion broken by insights integration**
- ❌ **Article summary logic needs two-tier implementation**

## 🔧 Technical Implementation Details

### Quiz System Investigation
```javascript
// In lib/feedAlgorithm.ts - Need to verify this logic still works
const getQuizForContent = async (contentItem: FeedItem): Promise<QuizQuestion | null> => {
  // This function exists but quizzes aren't appearing
  // Likely broken by insights integration in feed mixing logic
}
```

### Article Summary Implementation
```javascript
// Current: Articles use same summary field for both states
// Required: 
// - Card display: item.summary
// - Expanded modal: item.longer_summary || item.summary (fallback)
```

### Database Schema Updates
```sql
-- Articles table now has:
-- summary TEXT (short preview for cards)
-- longer_summary TEXT (detailed summary for expanded view, nullable for legacy)
```

## 🎯 Priority Order
1. **Quiz System**: Restore quiz functionality in feed (high user impact)
2. **Article Summary**: Implement two-tier summary system (content quality)
3. **UI Cleanup**: Remove "Simplify" button from articles (consistency)

## 🧪 Testing Required
- Verify quizzes appear between feed content items
- Test article cards show `summary` field
- Test expanded articles show `longer_summary` or fallback to `summary`
- Confirm "Simplify" button removed from articles but kept for papers
- Verify insights integration doesn't break other functionality