# Core Purpose

A contained ecosystem where group owners can share resources, track progress, and build engaged micro-communities around specific work/projects. Members consume content, contribute updates, and maintain accountability through social interaction.

## Key Functionality

### For Group Owners/Admins:

- Post content: photos, text updates, resources, milestones
- Share articles, podcasts, documents relevant to group goals
- Pin important posts/resources to top
- Track member engagement and contributions
- Set group visibility (public, private, invite-only)

### For Members/Followers:

- React to posts (likes, "cheers" quick reactions)
- Comment on owner posts and other members' comments
- Post their own updates/progress (if permissions allow)
- View project timeline/progress string
- Access shared resources library

## Design Requirements

### Visual Hierarchy:

- **Feed-style layout** (Instagram influence) - primary content display
- **Chat-style comment threads** (WhatsApp influence) - nested under posts
- **Project tracking sidebar** (GitHub influence) - progress indicators, milestones
- **Channel-style organization** (Discord influence) - separate sections for different content types

### Feed Section:

- Single-column scrollable feed for mobile
- Owner posts prominently displayed with larger cards
- Member comments/posts slightly smaller, differentiated visually
- Rich media support: images, embedded articles, podcast players
- Time-stamped with "posted 2h ago" styling
- Engagement metrics visible: reactions count, comments count

### Content Types to Design For:

1. **Owner Posts**: Project updates, achievements, resources, announcements
2. **Member Comments**: Text responses, questions, supportive reactions
3. **Shared Resources**: Articles, documents, links (with preview cards)
4. **Check-ins**: Daily/weekly progress updates from members
5. **Pinned Content**: Highlighted important information at top

### Interaction Elements:

- Quick reaction bar (heart, fire, clap, thinking emojis - keep minimal)
- Comment button that expands thread
- Share button (within app to friends)
- Bookmark/save for later
- Three-dot menu for: Report, Mute, Pin (if admin)

### Organization Features:

- Tabs/filters at top: "All", "Resources", "Updates", "Discussions"
- Search bar for group content
- Member list accessible via sidebar/modal
- Notification bell for group activity

### Mobile-First Design Considerations:

- Thumb-friendly navigation at bottom
- Swipe gestures: left to see member list, right to go back
- Pull to refresh
- Smooth scroll with content preview
- Easy toggle between reading mode and interaction mode

### Visual Style:

- Clean, minimal, professional but warm
- White/light background with colored accent for group identity
- Card-based layout with subtle shadows
- Clear typography hierarchy (headlines, body, timestamps)
- Ample whitespace to reduce cognitive load
- Consistent with main Supercharged app aesthetic

### Key Differentiators from Generic Social Feeds:

- **Progress-oriented**: Visual progress bars, milestone markers, streak indicators
- **Resource-focused**: Prominent library section for saved materials
- **Productivity-driven**: Check-in prompts, contribution tracking visible
- **Intimate community scale**: Designed for 10-100 members max, not thousands

### Specific UI Components Needed:

**Group Header:**

- Group name + tagline
- Member count
- Join/Follow button (if not member)
- Group avatar/cover image
- Navigation tabs

**Post Card:**

- User avatar + name + timestamp
- Content (text/image/embedded media)
- Reaction bar at bottom
- Comment count + preview of top comment
- Expand/collapse thread button

**Comment Thread:**

- Nested slightly indented from main post
- Smaller font size than main post
- Reply-to functionality
- Collapsible after 3 comments

**Resource Library Card:**

- Thumbnail/icon for content type
- Title + brief description
- "Saved by X members" indicator
- Quick access to open/download

**Member Contribution Sidebar:**

- Leaderboard-style (but non-competitive tone)
- "Most active this week" with avatars
- Contribution types: posts, comments, resources shared

**Progress Tracker:**

- Timeline view of group milestones
- Completion percentage for group goals
- Visual markers for key achievements

### Accessibility & UX:

- High contrast text
- Large tap targets (minimum 44x44px)
- Loading states with skeleton screens
- Error states with helpful messages
- Empty states with prompts to post/invite

### Animation/Interactions:

- Smooth transitions between feed and detail views
- Satisfying reaction animations (subtle particle effects)
- Pull-to-refresh with branded animation
- Haptic feedback on key interactions
- Smooth comment thread expansion

## User Flows to Design:

1. **Entering a group**: Header → Feed scroll → Interact with post → Comment thread → Return to feed
2. **Posting as owner**: Create button → Content input → Media attachment → Post confirmation → Appears in feed
3. **Member engagement**: See post → React → Write comment → See notification of reply → Continue conversation
4. **Resource discovery**: Filter to "Resources" → Browse cards → Save to personal library → Access from profile

## Edge Cases to Consider:

- Very long posts (read more/collapse)
- No posts yet (empty state with prompt)
- High engagement posts (hundreds of comments - pagination)
- Offline mode (show cached content)
- Blocked/muted users (hide their content gracefully)

## Success Metrics Visible in UI:

- Group activity level (badge: "Very active" / "Moderate" / "Quiet")
- Member retention (show tenure badges)
- Engagement rate per post
- Resource utilization (how many members saved/accessed)

# Supercharged Groups v1.0 - CORE Features (Launch-Ready)

## Posting & Content (CORE)

- Post photos
- Post text updates
- Post resources
- Share docs
- Pin important posts/resources to top
- Rich text formatting (headers, lists, bold, italic)
- Multi-image posts (up to 5 images)

## Engagement & Interaction (CORE)

- React to posts (❤️ 🔥 👏 🤔)
- Comment on posts
- Reply to comments
- Nested comment threads (collapse/expand)
- @ mentions to tag members
- Share posts within app

## Organization & Filtering (CORE)

- Filter by: All, Resources, Updates, Discussions
- Search bar for group content
- View pinned content at top
- Sort by: Most recent, Most engaged
- Filter by author

## Branding & Customization (CORE)

- Custom group URL/handle (@LSEConsulting)
- Upload banner/cover image
- Upload group avatar/logo
- Custom group bio with external links
- Accent color for group identity
- Custom welcome message for new members

## Member Management (CORE)

- Set group visibility (public, private, invite-only)
- View member list
- Join/Follow group
- Member roles: Admin, Member, Follower
- Member directory with basic profiles (name, year, course, bio)
- Remove/ban members
- Mute users
- Bulk invite via link

## Progress & Tracking (CORE)

- Group stats dashboard (total posts, engagement rate, active members)
- Individual member stats (contributions, streak)
- Member activity tracking ("Most active this week")
- Basic analytics export (CSV)

## Calendar & Events (CORE)

- **Integrated calendar view (month view)**
- **Create events (date, time, location)**
- **RSVP tracking (Going, Maybe, Can't Go)**
- **Event reminders (1 day before, 1 hour before)**
- **Event categories (Social, Professional, Workshop)**
- **RSVP list visible to admins**

## Resource Library (CORE)

- Access shared resources library
- Upload/download resources
- See "Saved by X members"
- Resource search
- Organize into folders (basic)
- Pin essential resources

## Notifications & Activity (CORE)

- Notification bell for group activity
- Get notified of: replies, mentions, new posts
- @ mention notifications (priority)
- Customizable notification preferences (all, mentions only, off)
- Event reminders

## Administrative (CORE)

- Pin posts (admin only)
- Content moderation (three-dot menu: edit, delete)
- Transfer ownership

## Discovery & Growth (CORE)

- Public group directory (searchable by university, keyword)
- Group invite links
- QR codes for in-person recruitment
- Group preview for non-members
- "Invite friends" flow
- Social proof display ("X students at LSE are members")

## Visual Elements (CORE)

- Group name, tagline, member count display
- Group avatar/cover image
- Timestamps ("2h ago", "yesterday")
- User avatars
- Reaction animations
- Basic badge system (admin, member)
- Confetti animation for milestones

## University Integration (CORE)

- University email verification (@lse.ac.uk)
- Course/program tagging
- Graduation year badges

## Security & Privacy (CORE)

- Block and report functionality
- Privacy controls (profile visibility)