# Expo Router Architecture & Layout Principles

## Key Learnings:

### 1. Global Navigation Overlay

- **Problem:** The bottom navigation bar, rendered by `AppHeader.tsx`, repeatedly disappeared.
- **Root Cause:** I was incorrectly placing the `<AppHeader />` component inside nested layout files (e.g., `app/(app)/_layout.tsx`). This treated it as a standard component within a subsection of the app, breaking its global overlay behavior.
- **Correct Architecture:** A persistent global UI element like a bottom tab bar must be placed in the root layout file (`app/_layout.tsx`). It should be a **sibling** to the main `Stack` navigator, not a child of it or part of a different layout file. This ensures it renders on top of all screens and has access to the global context.

### 2. Layout File Responsibilities

- **Root Layout (`app/_layout.tsx`):** This file is for top-level setup. Its primary responsibilities are:
  - Initializing global context providers (`ThemeProvider`, `AuthProvider`, etc.).
  - Defining the root `Stack` or `Tabs` navigator for the entire app.
  - Rendering persistent, global UI overlays like the main navigation header/footer.
- **Group Layouts (`app/(group)/_layout.tsx`):** These files define the navigation structure for a specific _group_ of routes. Their sole purpose should be to return a navigator component (e.g., `<Stack />`). They should **not** contain global UI elements.

### 3. Full-Screen Backgrounds & Safe Areas

- **Problem:** A gradient background on the `Profile` screen was not extending to the top edge of the device screen.
- **Root Cause:** Using a `<SafeAreaView>` as the root container for the screen automatically applies padding, which prevents child elements from rendering into the status bar area.
- **Solution:** For full-bleed backgrounds, the root element should be a standard `<View style={{ flex: 1 }}>`. The content _within_ that view (e.g., a `<ScrollView>`) should then have its padding managed manually (e.g., `paddingTop`, `paddingBottom`) to avoid being obscured by the status bar or the bottom navigation bar.

### 4. Modal Implementation and Context

- **Problem:** The `SettingsModal` crashed due to a `useTheme` error when opened.
- **Root Cause:** Using a global `BottomSheetModalProvider` can be complex. If the modal is rendered in a part of the React tree that is not a descendant of the required context providers (`ThemeProvider` in this case), it will not have access to that context.
- **Robust Solution:** Encapsulate modal logic within the component that triggers it. By using React Native's built-in `<Modal>` component directly inside the `Profile` screen, the modal's content (`SettingsModal`) is guaranteed to be a child of the `Profile` screen and will therefore correctly inherit all necessary contexts (`ThemeContext`, `AuthContext`, etc.). This is a more reliable and decoupled pattern.
