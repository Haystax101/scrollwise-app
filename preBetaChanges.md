# PRE BETA LAUNCH CHANGES

**Launch Date:** Tomorrow  
**Priority:** Critical - All items must be completed before beta launch

---

## 📋 PHASE 1: CRITICAL UI/UX FIXES (HIGH PRIORITY)

### 1.1 Insights Feed Improvements

**Remove 3 dots from insights in feed**
```tsx
// File: components/InsightCard.tsx
// Remove the three-dot menu/options button
// Users can still access user info by tapping the name
```

**Fix insights showing "Anonymous" instead of user name**
```tsx
// File: components/InsightCard.tsx or wherever insights display user info
// Current: Shows "Anonymous" 
// Fix: Show actual user.full_name since we have user data for modal
```

### 1.2 Book Card Readability
```tsx
// File: components/BookCard.tsx - styles object
// Changes needed:
bookTitle: {
  fontSize: 20, // Reduce from 24
  fontWeight: '500', // Reduce from '700' 
  color: '#FFFFFF', // Ensure white text
},
bookSummary: {
  fontSize: 13, // Reduce from 14
  color: '#FFFFFF', // Ensure white text
},
// Reduce horizontal padding from 24 to 20
bookContentSimple: {
  padding: 20, // Reduce from 24
}
```

### 1.3 Comments System Fixes

**Fix keyboard/send button interaction**
```tsx
// File: components/CommentsModal.tsx
// Problem: Tapping send dismisses keyboard first, requires double-tap
// Solution: Include send button in keyboard-safe area/touchable area
// Prevent keyboard dismissal when tapping send button specifically
```

**Fix comments count not updating on book cards**
```tsx
// File: components/BookCard.tsx
// Ensure comments count updates when comment is added
// May need to add callback prop or state management
```

---

## 📋 PHASE 2: CONTENT & DATA FIXES (MEDIUM-HIGH PRIORITY)

### 2.1 Article Expanded Modal
```tsx
// File: components/ExpandedTextModal.tsx or ArticleCard.tsx
// Current: Uses article.summary for both card and expanded view
// Fix: Use article.longer_summary in expanded modal for more detail
// Fallback to summary if longer_summary doesn't exist
```

### 2.2 Paper Card "Read Full Paper" Button
```tsx
// File: components/PaperCard.tsx - dynamicStyles
readMoreButton: {
  backgroundColor: 'transparent', // Remove fill
  borderColor: colors.primary, // Yellow border
  borderWidth: 1,
  color: colors.primary, // Yellow text
}
// Future: Add hold-to-charge interaction (not for beta)
```

### 2.3 Insights Tab Content Display
```tsx
// Files: Need to create/update insights tab components
// Display "My Insights" and "Saved Insights" 
// Use same visual style as main feed insights
// Remove interaction buttons, keep visual consistency
```

---

## 📋 PHASE 3: AUTHENTICATION & VALIDATION (MEDIUM PRIORITY)

### 3.1 Password Reset Validation
```tsx
// File: components/auth/PasswordReset.tsx (or similar)
// Add same password validation as onboarding:
// - Minimum length
// - Complexity requirements  
// - Real-time validation feedback
// Copy validation logic from onboarding password input
```

---

## 📋 PHASE 4: PUBLISH INSIGHT IMPROVEMENTS (MEDIUM PRIORITY)

### 4.1 Publish Insight Preview
```tsx
// File: components/insights/PublishInsightPreview.tsx (or similar)
// Current: Shows dummy data ("Your name", etc.)
// Fix: Show actual user.full_name and real data
// Alternative: Use actual InsightCard component as preview (no functionality)
```

---

## 📋 PHASE 5: TECHNICAL OPTIMIZATIONS (LOW-MEDIUM PRIORITY)

### 5.1 Profile Photo Compression
```tsx
// File: services/profileImageService.ts
// Add image compression before upload to save bucket space
// Use React Native image compression library
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const compressImage = async (uri: string) => {
  return await manipulateAsync(
    uri,
    [{ resize: { width: 400 } }], // Max width 400px
    { compress: 0.7, format: SaveFormat.JPEG }
  );
};
```

### 5.2 Insight Likes Count Fix
```tsx
// File: components/InsightCard.tsx
// Debug and fix likes count not updating properly
// Ensure state management works correctly for insight likes
```

---

## 🎯 IMPLEMENTATION ORDER

**Day 1 (Today - Critical)**
1. ✅ Remove 3 dots from insights ⚡
2. ✅ Fix anonymous user names on insights ⚡  
3. ✅ Fix keyboard/send button interaction ⚡
4. ✅ Book card text improvements ⚡

**Day 1 (Today - Important)**  
5. ✅ Article longer_summary in expanded modal
6. ✅ Comments count updates on book cards
7. ✅ Paper "read full paper" button styling

**Day 1 (Today - If Time)**
8. Password reset validation
9. Publish insight preview improvements
10. Profile photo compression
11. Insight likes count fix

---

## ⚠️ CRITICAL SUCCESS METRICS

- **All Phase 1 items completed** - Essential for user experience
- **Phase 2 items completed** - Important for content consumption  
- **No breaking bugs introduced** - Stability is key for beta
- **Quick verification testing** - Test each fix after implementation

---

## 🔧 FILES TO MODIFY

```
High Priority:
- components/InsightCard.tsx (anonymous name, 3 dots, likes)
- components/BookCard.tsx (text styling, comments count)
- components/CommentsModal.tsx (keyboard interaction)

Medium Priority:  
- components/ExpandedTextModal.tsx (longer_summary)
- components/PaperCard.tsx (button styling)
- components/insights/* (tab display, preview)
- services/profileImageService.ts (compression)
- auth components (password validation)
```

---

**🚀 Ready for beta launch once all Phase 1 & 2 items are complete!**