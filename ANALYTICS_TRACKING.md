# 📊 Comprehensive Analytics Tracking System

Your app now has detailed screen time and engagement tracking using PostHog, focusing on the most important metrics for user retention and engagement.

## 🎯 Key Metrics Being Tracked

### **1. Main Feed Time Spent (Critical Metric)**
```typescript
// Tracks time spent in main feed per session
main_feed_session_completed: {
  duration_seconds: 45,      // How long they spent
  duration_minutes: 0.75,    // Same in minutes  
  scroll_depth_percent: 85,  // How far they scrolled
  interactions_count: 3,     // Likes, saves, comments
  engagement_rate: 0.067     // Interactions per second
}
```

### **2. Screen Navigation & Time**
```typescript
// Tracks every screen view with time spent
screen_exited: {
  screen_name: "MainFeed",
  time_spent_seconds: 120,
  active_time_ms: 118000,    // Time actively scrolling/interacting
  scroll_depth: 75,          // Max scroll depth reached
  interactions: 5            // Total interactions on screen
}
```

### **3. Content Engagement Quality**
```typescript
// Tracks every content interaction
content_engagement: {
  content_type: "article",   // article, paper, book, insight
  content_id: "123",
  engagement_type: "like",   // like, save, comment, view, share
  content_title: "AI in Healthcare",
  scroll_position: 3,        // Position in feed when engaged
  current_position: 5        // Where they were when they interacted
}
```

### **4. Scroll Behavior & Discovery**
```typescript
// Tracks scroll patterns
scroll_activity: {
  from_index: 2,            // Previous content position
  to_index: 3,              // New content position  
  scroll_direction: "forward",
  total_scrolls: 15,        // Cumulative scrolls this session
  content_type: "article"   // What they scrolled to
}
```

## 📱 Screens Being Tracked

### **Main Feed (Most Important)**
- ✅ **Session duration** - How long users spend in feed
- ✅ **Scroll depth** - How much content they consume
- ✅ **Engagement rate** - Interactions per minute
- ✅ **Content views** - What content they actually see
- ✅ **Like/Save patterns** - What content resonates

### **Profile**
- ✅ **Profile views** - Time spent on profile
- ✅ **Achievement interactions** - Which achievements they engage with
- ✅ **Profile updates** - When they update their info

### **Other Screens**
- ✅ **Discovery/Search** - Add tracking when implemented
- ✅ **Chat/Messages** - Add tracking when implemented
- ✅ **Settings** - Add tracking when implemented

## 🔍 Key Questions This Answers

### **Engagement Quality:**
1. **"How long do users stay engaged in the main feed?"**
   - Look for `main_feed_session_completed` events
   - Average `duration_minutes` tells you session length
   - `engagement_rate` shows quality of engagement

2. **"What content keeps users scrolling?"**
   - Track `content_engagement` with `engagement_type: "view"`
   - Look at `scroll_depth_percent` to see consumption patterns
   - Analyze which `content_type` gets most engagement

3. **"Are users finding content they want to save/like?"**
   - `content_engagement` events with `engagement_type: "like|save"`
   - `interactions_count` per session shows engagement quality
   - Track which content gets most interactions

### **User Behavior:**
4. **"How many pieces of content do users consume per session?"**
   - `total_scrolls` in scroll events
   - `scroll_depth_percent` shows depth of consumption
   - `content_engagement` views show actual content seen

5. **"When do users drop off?"**
   - `screen_exited` shows when they leave main feed
   - Short `duration_seconds` with low `scroll_depth` = quick dropoff
   - Long sessions with high engagement = sticky content

## 📈 PostHog Dashboard Setup

### **Key Funnels to Create:**
```sql
1. App Open → Main Feed View → Content Engagement → Return Visit
2. Main Feed View → Scroll → Like/Save → Comment
3. Profile View → Achievement View → Content Creation
```

### **Important Cohorts:**
```sql
- High Engagement Users: Users with avg feed session > 2 minutes
- Content Consumers: Users with scroll_depth > 50%
- Active Users: Users with interactions_count > 5 per session
```

### **Critical Alerts:**
```sql
- Feed session time drops below 1 minute average
- Engagement rate drops below 0.05 interactions/second  
- Scroll depth drops below 30%
```

## 🚀 Usage Examples

### **Track Custom Events:**
```typescript
import { screenTracker } from '../lib/screenTracking';

// Track when user shares content
screenTracker.trackContentEngagement('article', '123', 'share', {
  share_method: 'copy_link',
  content_title: 'AI in Healthcare'
});
```

### **Track Screen Time:**
```typescript
import { useScreenTime } from '../hooks/useScreenTime';

const MyScreen = () => {
  const { trackInteraction } = useScreenTime({
    screenName: 'CustomScreen',
    trackScrollDepth: true
  });
  
  return <YourComponent />;
};
```

## 🎯 Success Metrics to Watch

### **Daily Active Usage:**
- **Main Feed session time** > 2 minutes average
- **Scroll depth** > 50% average  
- **Engagement rate** > 0.05 interactions/second
- **Content views per session** > 8 pieces

### **Weekly Retention:**
- **Return users** engaging with feed multiple times
- **Progressive scroll depth** (users going deeper over time)
- **Increased interaction rates** (users engaging more over time)

Your app now captures comprehensive user behavior data that will help you optimize for engagement and retention! 🎉