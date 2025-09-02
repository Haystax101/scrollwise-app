# PostHog Analytics & Crash Tracking Setup

This app is configured to use PostHog for comprehensive analytics, crash tracking, and error monitoring.

## Quick Setup

1. **Create PostHog Account**

   - Sign up at [posthog.com](https://posthog.com)
   - Create a new project for your mobile app
   - Note your Project API Key from the settings

2. **Update Configuration**
   - Open `lib/posthog.ts`
   - Replace `'YOUR_POSTHOG_PROJECT_API_KEY'` with your actual API key
   - Choose the correct host (US: `https://us.i.posthog.com` or EU: `https://eu.i.posthog.com`)

## 📱 Expo Go vs Development Build

### Works in Expo Go ✅
- Basic event tracking (`analytics.track()`)
- User identification and properties
- Screen views and navigation tracking
- Custom events and user actions
- Feature flags
- Basic error tracking (JS exceptions)

### Requires Development Build 📦
- **Session recordings** (visual debugging)
- **Native crash reporting** (native code crashes)
- **App lifecycle events** (app open/close)
- **Advanced error tracking** (native stack traces)

The app is configured to automatically detect Expo Go and disable features that require native modules.

## Features Implemented

### 📊 Analytics Tracking

- **User Authentication**: Sign up, sign in, sign out events
- **Screen Views**: Automatic screen tracking for all major screens
- **User Actions**: Profile views, content engagement, achievements
- **Onboarding Progress**: Track completion of getting started steps

### 🚨 Error Tracking & Crash Monitoring

- **Error Boundary**: Catches and reports React component crashes
- **JavaScript Exceptions**: Automatic capture of unhandled errors
- **Console Errors**: Tracks console.error calls as events
- **Session Recordings**: Visual debugging with masked sensitive inputs

### 🏆 User Engagement

- **Achievement Tracking**: When users earn new achievements
- **Level Up Events**: Track user progression and gamification
- **Profile Updates**: Track when users update their profiles
- **Password Resets**: Track password reset flow completion

### 🔒 Privacy & Security

- **Data Sanitization**: Removes sensitive data (passwords, emails) from events
- **Masked Inputs**: Session recordings mask all text inputs by default
- **User Consent**: Respects user privacy preferences

## Cost Breakdown (2025)

### Free Tier Includes:

- **1,000,000 events** per month
- **15,000 session recordings** per month
- **Unlimited users** and team members
- **All features** (no feature restrictions)
- **Data retention** for 1 year

### When You Might Need to Upgrade:

- High-traffic apps (>1M events/month)
- Enterprise features (SAML SSO, advanced permissions)
- Longer data retention (>1 year)
- Dedicated support

### Estimated Costs:

- **90%+ of apps**: $0/month (free tier is very generous)
- **Growing apps**: ~$20-50/month when you exceed free limits
- **Scale-up apps**: Usage-based pricing scales with your growth

## Usage Examples

```typescript
import { analytics, ANALYTICS_EVENTS } from "../lib/posthog";

// Track custom events
analytics.track(ANALYTICS_EVENTS.CONTENT_LIKED, {
  content_id: "article_123",
  content_type: "article",
  user_id: userId,
});

// Track screen views
analytics.screen("Home Feed", {
  user_id: userId,
  tab_name: "discover",
});

// Identify users
analytics.identify(userId, {
  email: userEmail,
  subscription_plan: "free",
  signup_date: signupDate,
});

// Track errors
analytics.captureException(error, {
  context: "profile_update",
  user_id: userId,
});
```

## Monitoring Dashboard

Once configured, you can monitor:

- **Real-time events** as they happen
- **User retention** and engagement metrics
- **Error rates** and crash reports
- **Session recordings** for debugging
- **Feature usage** and conversion funnels

## Next Steps

1. Replace the API key in `lib/posthog.ts`
2. Test the integration in development
3. Deploy to production
4. Set up alerts in PostHog dashboard
5. Create custom dashboards for key metrics

## Support

- [PostHog Documentation](https://posthog.com/docs)
- [React Native Guide](https://posthog.com/docs/libraries/react-native)
- [Expo Integration](https://posthog.com/tutorials/react-native-analytics)
