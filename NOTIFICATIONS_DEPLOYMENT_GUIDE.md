# 🔔 Notifications System Deployment Guide

## Overview
This guide deploys a production-ready notification system with 2025 security best practices, modern Expo conventions, and comprehensive monitoring.

## ✅ What's Been Implemented

### 🗄️ Database Infrastructure
- **Enhanced schema** with RLS policies and performance indexes
- **Secure functions** with input validation and rate limiting
- **Batching system** to prevent notification fatigue
- **Analytics views** for performance monitoring
- **Automated cleanup** and maintenance

### ⚡ Edge Functions (Supabase Functions)
- **Modern push notification handler** with retry logic and receipt tracking
- **Daily streak reminders** with personalized messages
- **Batch processing** for digest notifications
- **Security features**: rate limiting, PII protection, error handling

### 📱 Frontend Integration
- **Updated notification service** with deprecated API fixes
- **Android notification channels** (required for Android 13+)
- **Enhanced permission handling** with modern Expo APIs
- **Push token refresh** handling for reliability

### 📊 Monitoring & Analytics
- **Real-time health monitoring** with automated alerts
- **Performance analytics** for open rates and delivery metrics
- **User engagement tracking** and batch efficiency analysis
- **Automated maintenance** and optimization

## 🚀 Deployment Steps

### Step 1: Database Setup

**Deploy Enhanced Schema:**
```bash
psql -h [your-supabase-host] -U postgres -d postgres -f database/notifications_schema_enhanced.sql
```

**Deploy Secure Functions:**
```bash
psql -h [your-supabase-host] -U postgres -d postgres -f database/notifications_functions_secure.sql
```

**Deploy Monitoring:**
```bash
psql -h [your-supabase-host] -U postgres -d postgres -f database/notifications_monitoring.sql
```

**Deploy Cron Jobs:**
```bash
psql -h [your-supabase-host] -U postgres -d postgres -f database/notifications_cron_jobs.sql
```

### Step 2: Environment Variables

**Set required environment variables in Supabase Dashboard:**

```bash
# Edge Functions Secrets
EXPO_ACCESS_TOKEN=your_expo_access_token
FUNCTION_SECRET=your_function_secret_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App Environment Variables
EXPO_PUBLIC_PROJECT_ID=your_expo_project_id
EXPO_PUBLIC_APP_VERSION=1.0.0
```

### Step 3: Deploy Edge Functions

**Send Push Notification Function:**
```bash
supabase functions deploy send-push-notification --project-ref your-project-id
```

**Daily Streak Reminders:**
```bash
supabase functions deploy daily-streak-reminders --project-ref your-project-id
```

**Batch Processing:**
```bash
supabase functions deploy process-notification-batches --project-ref your-project-id
```

### Step 4: Configure Cron Jobs

Update the cron job URLs in `notifications_cron_jobs.sql` to match your project:

```sql
-- Replace 'your-project.supabase.co' with your actual URL
SELECT cron.schedule(
  'daily-streak-reminders',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/daily-streak-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);
```

**Set service role key:**
```sql
SELECT set_config('app.supabase_service_role_key', 'your-service-role-key', false);
```

### Step 5: Frontend Integration

The notification service has been updated with modern conventions. No additional deployment needed for frontend files.

## 🧪 Testing & Verification

### Database Functions Test
```sql
-- Test notification creation
SELECT create_notification_secure(
  'user-id'::UUID,
  'source-user-id'::UUID,
  'like',
  'insight',
  'content-id',
  'Test notification',
  '/content/insight/123',
  '{"test": true}'::JSONB
);

-- Check system health
SELECT * FROM check_notification_health();

-- View performance metrics
SELECT * FROM get_notification_performance(7);
```

### Edge Functions Test
```bash
# Test push notification function
curl -X POST 'https://your-project.supabase.co/functions/v1/send-push-notification' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "notification_id": "test-id",
    "user_id": "user-id",
    "type": "test",
    "message": "Test notification"
  }'

# Test streak reminders
curl -X POST 'https://your-project.supabase.co/functions/v1/daily-streak-reminders' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

### Frontend Test
```javascript
// Initialize notifications in your app
import { useNotifications } from './hooks/useNotifications';

function App() {
  const {
    isInitialized,
    permissionsGranted,
    unreadCount,
    initializeNotifications
  } = useNotifications();

  useEffect(() => {
    if (user) {
      initializeNotifications();
    }
  }, [user]);

  return (
    // Your app content
  );
}
```

## 📊 Monitoring Dashboard

### Key Metrics to Monitor

1. **Delivery Rate**: Should be >95%
   ```sql
   SELECT * FROM notification_analytics WHERE date >= CURRENT_DATE - 7;
   ```

2. **Open Rate**: Target >25%
   ```sql
   SELECT * FROM daily_notification_metrics ORDER BY date DESC LIMIT 7;
   ```

3. **System Health**: Check for alerts
   ```sql
   SELECT * FROM check_notification_health();
   ```

4. **User Engagement**: Top performers
   ```sql
   SELECT * FROM user_notification_engagement ORDER BY personal_open_rate DESC LIMIT 10;
   ```

### Automated Monitoring

The system includes automated health checks every 10 minutes that will:
- ✅ Monitor delivery rates
- ✅ Detect high failure rates
- ✅ Identify stale notifications
- ✅ Alert on system issues

## 🔧 Maintenance

### Daily Tasks (Automated)
- **2 AM GMT**: System maintenance and cleanup
- **10 AM GMT**: Daily streak reminders
- **Every 5 minutes**: Batch processing
- **Every 10 minutes**: Health monitoring

### Weekly Tasks (Automated)
- **Sunday 3 AM**: Analytics refresh
- **Saturday 4 AM**: Performance optimization

### Monthly Tasks (Automated)
- **1st day 5 AM**: Monthly reporting

### Manual Tasks
- **Monitor system logs**: Check `system_logs` table for alerts
- **Review analytics**: Use monitoring views for insights
- **Update token cleanup**: Adjust thresholds as needed

## 🛠️ Troubleshooting

### Common Issues

1. **Push notifications not sending**
   ```sql
   -- Check for delivery failures
   SELECT * FROM notifications WHERE push_sent = false AND created_at > NOW() - INTERVAL '1 hour';

   -- Check push tokens
   SELECT COUNT(*) FROM user_push_tokens WHERE is_active = true;
   ```

2. **High failure rates**
   ```sql
   -- Check system health
   SELECT * FROM check_notification_health();

   -- Analyze failure patterns
   SELECT type, COUNT(*) FROM notifications
   WHERE push_sent = false AND created_at > CURRENT_DATE - 1
   GROUP BY type;
   ```

3. **Cron jobs not running**
   ```sql
   -- Check job status
   SELECT * FROM get_cron_job_status();

   -- View recent logs
   SELECT * FROM system_logs WHERE log_type LIKE '%cron%' ORDER BY created_at DESC;
   ```

### Performance Optimization

1. **Database indexes**: Already optimized for common queries
2. **Batch processing**: Configured to reduce notification spam
3. **Rate limiting**: Prevents overwhelming users
4. **Cleanup**: Automated to maintain performance

## 📈 Success Metrics

### Target KPIs
- **Delivery Rate**: >95%
- **Open Rate**: >25%
- **User Engagement**: >80% users enable notifications
- **System Uptime**: >99.9%
- **Average Open Time**: <5 minutes

### Analytics Available
- ✅ **Real-time delivery tracking**
- ✅ **User engagement metrics**
- ✅ **Batch efficiency analysis**
- ✅ **System health monitoring**
- ✅ **Performance trend analysis**

## 🔐 Security Features

### Implemented Protections
- ✅ **PII sanitization** in push payloads
- ✅ **Rate limiting** per user and type
- ✅ **Input validation** and SQL injection prevention
- ✅ **RLS policies** for data access control
- ✅ **Secret management** via environment variables
- ✅ **Token refresh** handling for security

### Best Practices Applied
- ✅ **Generic lock screen messages** to prevent data exposure
- ✅ **Least privilege access** for database functions
- ✅ **Secure Edge Function** authentication
- ✅ **Token deactivation** for failed deliveries
- ✅ **Audit logging** for system events

## 🎯 Next Steps

Once deployed and tested:

1. **Monitor performance** for first week
2. **Adjust batching thresholds** based on user feedback
3. **Implement A/B testing** for notification copy
4. **Add custom notification sounds** per channel
5. **Extend to web push** notifications if needed

The notification system is now production-ready with enterprise-grade security, performance, and monitoring!