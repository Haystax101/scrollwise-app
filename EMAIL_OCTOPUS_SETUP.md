# Email Octopus Integration Setup Guide

This guide will help you set up automatic email list subscriptions for new user signups using Email Octopus.

## Overview

When a user signs up to your app:
1. A new profile is created in the `profiles` table
2. A database trigger automatically calls the `add-to-email-list` Edge Function
3. The Edge Function adds the user to your Email Octopus list
4. Email Octopus handles the welcome email and ongoing drip campaign

## Prerequisites

- Email Octopus account (free or paid)
- Email Octopus API key
- Email Octopus List ID (from the list you want to add users to)
- Supabase CLI installed (`npm install -g supabase`)

## Setup Steps

### 1. Get Your Email Octopus Credentials

1. Log in to your Email Octopus account
2. Go to Settings → API
3. Copy your API key
4. Navigate to your Lists page
5. Click on the list you want to use
6. Copy the List ID from the URL (it looks like: `00000000-0000-0000-0000-000000000000`)

### 2. Set Up Email Octopus Drip Campaign

1. In Email Octopus, go to your list
2. Click on "Automations" or "Campaigns"
3. Create a new automation with:
   - **Trigger**: When contact is added to list
   - **Email 1**: Welcome email (sends immediately)
   - **Email 2**: Follow-up email (wait 14 days)
   - **Email 3**: Next follow-up (wait another 14 days)
   - Continue as needed for your drip campaign

4. Make sure the automation is set to "Active"

### 3. Configure Supabase Secrets

Add your Email Octopus credentials to Supabase:

```bash
# Set Email Octopus API Key
supabase secrets set EMAIL_OCTOPUS_API_KEY=your_api_key_here

# Set Email Octopus List ID
supabase secrets set EMAIL_OCTOPUS_LIST_ID=your_list_id_here
```

For local development, create a `.env` file in `supabase/functions/`:

```bash
EMAIL_OCTOPUS_API_KEY=your_api_key_here
EMAIL_OCTOPUS_LIST_ID=your_list_id_here
```

### 4. Deploy the Edge Function

Deploy the new Edge Function to Supabase:

```bash
supabase functions deploy add-to-email-list
```

### 5. Run the Database Migration

Apply the database migration to create the trigger:

```bash
supabase db push
```

Or manually run the SQL in `supabase/migrations/add_email_list_webhook.sql` via the Supabase Dashboard SQL Editor.

**Important Note**: The migration uses `pg_net` extension to call the Edge Function. If you encounter issues, you may need to:

1. Enable the `pg_net` extension in your Supabase project:
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_net;
   ```

2. Set the required configuration parameters:
   ```sql
   -- In Supabase Dashboard → Database → Configuration
   ALTER DATABASE postgres SET app.settings.supabase_url TO 'https://YOUR_PROJECT_REF.supabase.co';
   ALTER DATABASE postgres SET app.settings.service_role_key TO 'YOUR_SERVICE_ROLE_KEY';
   ```

### 6. Alternative Setup (Using Supabase Webhooks)

If `pg_net` doesn't work or you prefer a simpler setup, you can use Supabase Database Webhooks instead:

1. Go to Supabase Dashboard → Database → Webhooks
2. Click "Create a new hook"
3. Configure:
   - **Name**: Add to Email List
   - **Table**: public.profiles
   - **Events**: INSERT
   - **Type**: HTTP Request
   - **Method**: POST
   - **URL**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/add-to-email-list`
   - **Headers**:
     - `Authorization`: `Bearer YOUR_SERVICE_ROLE_KEY`
     - `Content-Type`: `application/json`
4. Click "Create webhook"

This approach doesn't require the SQL migration and is easier to set up.

## Testing

### Test the Edge Function Directly

```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/add-to-email-list' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "record": {
      "email": "test@example.com",
      "full_name": "Test User"
    }
  }'
```

### Test with a Real Signup

1. Create a new user account in your app
2. Check the Edge Function logs in Supabase Dashboard → Edge Functions → Logs
3. Verify the user appears in your Email Octopus list
4. Confirm they receive the welcome email

## Email Octopus List Configuration

### Recommended Custom Fields

In your Email Octopus list, add these custom fields:
- `FirstName` - For personalization
- `FullName` - Full user name

### Recommended Tags

The integration automatically adds these tags:
- `new_signup` - Identifies users who came from app signup
- `app_user` - Distinguishes app users from other list sources

You can use these tags to segment your campaigns.

## Troubleshooting

### Function not triggering
- Check the trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_profile_created_add_to_email_list';`
- Check Edge Function logs in Supabase Dashboard
- Verify webhook is active (if using webhook approach)

### User not added to Email Octopus
- Check Email Octopus API credentials are correct
- Verify List ID is correct
- Check Edge Function logs for API errors
- Ensure user has a valid email address

### Duplicate email errors
- The function handles `MEMBER_EXISTS_WITH_EMAIL_ADDRESS` errors gracefully
- Check if user already exists in your Email Octopus list

### Welcome email not sending
- Verify automation is active in Email Octopus
- Check if email is in spam folder
- Verify contact status is "SUBSCRIBED" in Email Octopus

## Cost Considerations

### Email Octopus Free Tier
- 2,500 subscribers
- Unlimited emails
- Perfect for getting started

### SendGrid (Alternative)
Since you have SendGrid, you could alternatively:
1. Use this Edge Function to add to Email Octopus for drip campaigns
2. Use SendGrid for transactional emails (password resets, notifications)
3. Keep both services for their strengths

## Customization

### Modify Welcome Email Content
Edit your Email Octopus automation emails directly in the Email Octopus dashboard.

### Change Drip Campaign Frequency
In Email Octopus automation, adjust the "wait" periods between emails.

### Add More User Data
Edit `/supabase/functions/add-to-email-list/index.ts` to include more fields:

```typescript
fields: {
  FirstName: userFullName.split(' ')[0] || '',
  FullName: userFullName,
  SignupDate: new Date().toISOString(),
  // Add more custom fields here
},
```

### Additional Tags
Modify the tags array in the Edge Function:

```typescript
tags: ['new_signup', 'app_user', 'mobile_user'], // Add more tags
```

## Support

- Email Octopus API Docs: https://emailoctopus.com/api-documentation
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Supabase Webhooks: https://supabase.com/docs/guides/database/webhooks

## Files Created

- `/supabase/functions/add-to-email-list/index.ts` - Edge Function code
- `/supabase/migrations/add_email_list_webhook.sql` - Database trigger migration
- `EMAIL_OCTOPUS_SETUP.md` - This setup guide
