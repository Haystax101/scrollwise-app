# Flag Button Implementation Plan

This document outlines the necessary steps to add a "flag" or "report" button to all content types (articles, papers, books, insights) within the application.

## 1. Objective

The goal is to provide users with a simple mechanism to flag content they deem inappropriate or problematic. This action will increment a counter in the database for the specific content item, allowing for administrative review of frequently flagged content.

## 2. Database Schema

As per the request, a new integer column named `flag_count` (or simply `flag`) will be added to the following tables. This plan assumes it will be `flag_count`.

-   `articles`
-   `papers`
-   `books`
-   `insights`

**Required Schema (SQL Example):**

```sql
ALTER TABLE articles ADD COLUMN flag_count INT NOT-NULL DEFAULT 0;
ALTER TABLE papers ADD COLUMN flag_count INT NOT-NULL DEFAULT 0;
ALTER TABLE books ADD COLUMN flag_count INT NOT-NULL DEFAULT 0;
ALTER TABLE insights ADD COLUMN flag_count INT NOT-NULL DEFAULT 0;
```

## 3. Backend (Supabase RPC Function)

To securely and efficiently handle the incrementing logic, a single PostgreSQL function in Supabase is the recommended approach. This prevents having to write duplicate logic on the client-side and keeps database operations centralized.

**Function Name:** `increment_flag_count`

**Arguments:**
*   `content_id_param` (UUID or INT, depending on the table's primary key type)
*   `content_type_param` (TEXT, e.g., 'article', 'paper', 'book', 'insight')

**SQL Implementation:**

```sql
CREATE OR REPLACE FUNCTION increment_flag_count(content_id_param UUID, content_type_param TEXT)
RETURNS VOID AS $$
BEGIN
  CASE content_type_param
    WHEN 'article' THEN
      UPDATE articles SET flag_count = flag_count + 1 WHERE id = content_id_param;
    WHEN 'paper' THEN
      UPDATE papers SET flag_count = flag_count + 1 WHERE id = content_id_param;
    WHEN 'book' THEN
      UPDATE books SET flag_count = flag_count + 1 WHERE id = content_id_param;
    WHEN 'insight' THEN
      UPDATE insights SET flag_count = flag_count + 1 WHERE id = content_id_param;
    ELSE
      -- Do nothing or raise an exception for unknown types
  END CASE;
END;
$$ LANGUAGE plpgsql;
```
This function will be called from the client-side when a user taps the flag button.

## 4. Frontend Implementation

### Step 1: Create a Reusable `FlagButton` Component

To maintain consistency and avoid code duplication, we will create a new component: `components/common/FlagButton.tsx`.

**Props:**
*   `contentId`: The ID of the content item.
*   `contentType`: The type of content ('article', 'paper', 'book', 'insight').
*   `size` (optional): The size of the button/icon.
*   `style` (optional): Custom styles for positioning.

**State:**
*   `isFlagged` (boolean): Tracks if the user has flagged the item during the current session to provide instant feedback and prevent multiple clicks.
*   `isLoading` (boolean): Tracks the loading state while the database call is in progress.

**Logic:**
1.  The component will render a circular `TouchableOpacity`.
2.  Inside, it will display a `Feather` icon (e.g., `alert-circle`).
3.  On press (`onPress`), it will:
    a. Set `isLoading` to `true`.
    b. Call the Supabase RPC function: `supabase.rpc('increment_flag_count', { content_id_param: contentId, content_type_param: contentType })`.
    c. On success, set `isFlagged` to `true` and `isLoading` to `false`.
    d. On error, log the error and set `isLoading` to `false`.
4.  The button's style will change based on the `isFlagged` state (e.g., the icon color could change to the primary theme color).

### Step 2: Integrate `FlagButton` into Content Cards

The new `FlagButton` will be added to each of the relevant card components.

**File Locations:**
*   `components/ArticleCard.tsx`
*   `components/PaperCard.tsx`
*   `components/BookCard.tsx`
*   `components/InsightCard.tsx`

**Implementation Details:**
1.  The parent container of each card (the one that holds the image or animation) must have `position: 'relative'` in its style.
2.  The `FlagButton` will be placed inside this container.
3.  The `FlagButton` will be styled with `position: 'absolute'`, `top: 10`, `right: 10`, and a `zIndex: 10` to ensure it appears on top of other elements.

**Example for `ArticleCard.tsx`:**

```tsx
// ... imports
import { FlagButton } from '../common/FlagButton';

// ... component definition
const ArticleCard = ({ article }) => {
  // ... existing code

  return (
    <View style={styles.container}> // This view should have position: 'relative'
      {/* ... other card content ... */}
      
      <FlagButton
        contentId={article.id}
        contentType="article"
        style={styles.flagButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // ... existing styles
  container: {
    // ...
    position: 'relative',
  },
  flagButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    // Add a subtle background for better visibility over complex images/animations
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 16,
  },
});
```
This same pattern will be applied to the other three card components.
