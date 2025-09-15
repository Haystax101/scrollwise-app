# Priority Changes for App Launch

## UI/UX Fixes

### Onboarding & Authentication
- **Get Started Page**: Change image on second slide and update text to focus on user interaction aspects
- **Password Creation**: Fix errorText positioning - create dedicated space instead of overlaying continue button
- **Step 1 Onboarding**: Align 'steps to complete' text to centre-top of page
- **Industry Selection**: Replace onboarding industry selection with profile version (better design)
- **Final Onboarding Screen**: Add more app screenshots to tutorial

### Profile & Achievements
- **Industry Pills**: Update discover page pill colours to match profile industry selection colours (make global)
- **Achievements**: Remove translucent effect on unachieved achievements (grey is clear enough)
- **See All Achievements**: Add "see all" button next to achievements title → opens dedicated vertical scrollview page
- **Post-Onboarding Steps**: Add "collect voltz" button for completed steps before section disappears

### Feed & Content
- **Main Feed Persistence**: Prevent reload when switching tabs - only reload between sessions/days or manual refresh
- **Discover Page Ordering**: Display content by time (recent first) + popularity ranking
- **Article Display**: Show `longer_summary` in expanded modal, `summary` on card view
- **Supercharging Insight**: Merge "voltz balance" and "after spending" into single line

### Interactive Elements
- **Tutorial Text**: Fix tapping behavior - end typing effect then advance to next text
- **Low Power Mode**: Research and implement better responsiveness in low power mode

## Feature Additions

### Notifications & Engagement
- **NotificationCard Component**: Pop-down notification for completed steps/achievements
  - 8 second display duration
  - Shows criterion met, step/achievement earned, voltz gained
  - Tap to navigate to related content
- **Push Notifications**:
  - Likes/comments on user insights
  - Daily streak maintenance reminders
- **Streak System**: Implement proper daily login tracking using `user_streaks` table and `days_streak` field

### Social & Sharing
- **Content Sharing**: Add share button to content cards
  - Link format: "Check out this interesting post I found on Supercharged"
  - Deep linking to specific content after signup
- **Friend Invites**: Shareable invitation links
  - Link format: "Join me on Supercharged to keep tabs on your industry"
  - Track successful signups for achievement rewards
- **People Tab**: New tab between Discover and Insights
  - Move leaderboard here
  - Display friends list
  - Friend invitation functionality
  - Implement friendsPlan.md features

## Technical Priorities

### Quiz System
- **Disconnect Quiz Logic**: Detach all quiz spawning from feed (keep code for potential future use)
- **Preserve Codebase**: Do NOT delete quiz-related code

### Data & Tracking
- **Invite Tracking**: Monitor successful signups from shared links for achievement system
- **Content Fetching**: Leverage existing `fetchSpecificContent` for deep linking

## Implementation Notes
- Research best practices for streak handling
- Investigate deep linking solutions for content sharing
- Study other apps' sharing mechanisms
- Ensure proper voltz collection flow for post-onboarding steps