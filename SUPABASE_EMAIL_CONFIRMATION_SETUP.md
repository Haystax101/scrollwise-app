# Supabase Email Confirmation Setup Guide

## Required Configuration in Supabase Dashboard

To complete the email confirmation signup flow, you need to configure the following in your Supabase dashboard:

### 1. URL Configuration (CRITICAL)

Go to **Authentication → URL Configuration** in your Supabase dashboard:

## For Expo Go Development (Current Setup)

#### Site URL
- **Site URL**: `exp://192.168.1.XXX:8081` 
- Replace `192.168.1.XXX` with your actual development server IP
- Replace `8081` with your Metro bundler port (check `expo start` output)

#### Additional Redirect URLs
Add these redirect URLs for Expo Go:

```
exp://192.168.1.XXX:8081
exp://192.168.1.XXX:8081/--/
exp://192.168.1.XXX:8081/--/auth/callback
exp://192.168.1.XXX:8081/--/email-verification
```

**How to find your Expo Go URL:**
1. Run `expo start` in your terminal
2. Look for the Metro bundler address (e.g., "Metro waiting on exp://192.168.1.100:8081")
3. Use that exact URL format

**Important for email verification:**
- The email links will redirect to `exp://192.168.1.XXX:8081/--/` (note the `/--/` path)
- This is how Expo Go handles deep links to your app
- The AuthContext will automatically capture the verification tokens from the URL

## For Production/Development Build (Future Setup)

When you switch to `expo-dev-client` or standalone build:

#### Site URL
- **Site URL**: `scrollwise://` (your custom scheme)

#### Additional Redirect URLs
```
scrollwise://
scrollwise://**
scrollwise://auth/callback
scrollwise://email-verification
```

### 2. Auth Providers Configuration

Go to **Authentication → Providers** in your Supabase dashboard:

#### Email Provider Settings
- **Email Provider**: ✅ Enabled
- **Confirm Email**: ✅ **MUST BE ENABLED** 
- **Secure Email Change**: ✅ Enabled (recommended)
- **Double Confirm Email Change**: ✅ Enabled (recommended)

### 3. Email Templates (Optional but Recommended)

Go to **Authentication → Email Templates**:

#### Confirm Signup Template
You can customize the email template to match your brand. Key requirements:

- **Action URL**: Must point to your app scheme
- **Template variables**: Use `{{ .SiteURL }}` for the redirect URL

Example custom template:
```html
<h2>Welcome to ScrollWise!</h2>
<p>Click the link below to verify your email and complete your account setup:</p>
<p><a href="{{ .ConfirmationURL }}">Verify Email Address</a></p>
<p>If the button doesn't work, copy and paste this link into your browser:</p>
<p>{{ .ConfirmationURL }}</p>
```

### 4. Testing Configuration

#### Development Testing
During development, you can temporarily disable email confirmation:
1. Go to **Authentication → Providers**
2. Toggle **"Confirm Email"** to **OFF**
3. Users will be automatically signed in without email verification
4. **Remember to re-enable for production!**

#### Production Testing
1. Test with a real email address you can access
2. Check email delivery (including spam folders)
3. Verify deep links open your app correctly
4. Test the complete signup → verify → onboarding flow

---

## Verification Checklist

### For Expo Go Development:
- [ ] **Site URL** is set to your Expo development server (e.g., `exp://192.168.1.100:8081`)
- [ ] **Additional Redirect URLs** include all Expo Go paths with `/--/` prefix
- [ ] **Confirm Email** is **ENABLED**
- [ ] **Email template** is configured and tested
- [ ] **SMTP settings** are configured (SendGrid in your case)
- [ ] **Deep linking** works in Expo Go app
- [ ] **Complete flow** tested: signup → email → verify → onboarding → feed

### For Production/Development Build:
- [ ] **Site URL** is set to `scrollwise://`
- [ ] **Additional Redirect URLs** include the custom scheme paths
- [ ] **Development build** created with `expo-dev-client`
- [ ] **Deep linking** works on physical devices
- [ ] **Complete flow** tested on production-like environment

---

## Common Issues and Solutions

### Issue: "Invalid Redirect URL"
**Solution**: Ensure all redirect URLs are added to the "Additional Redirect URLs" field

### Issue: Email links don't open the app
**Solution for Expo Go**: 
1. Verify your Expo development server URL is correct in Supabase
2. Ensure Expo Go app is installed and running on your device
3. Check that the Metro bundler is running (`expo start`)
4. Test on the same network (both computer and phone)

**Solution for Development Build**: 
1. Check that the custom scheme `scrollwise://` matches your app.json
2. Ensure you've rebuilt your development build after adding the scheme
3. Test on physical device, not simulator (deep links work better on real devices)

### Issue: User gets logged out after email verification
**Solution**: Check that your AuthContext is properly handling the `setSession` call with tokens from the deep link

### Issue: Infinite loading on email verification screen
**Solution**: Verify that the deep link handler is properly parsing the URL fragments and creating sessions

---

## Next Steps

Once configuration is complete:

1. **Test the flow** with a real email address
2. **Monitor logs** in the React Native debugger for any errors
3. **Check Supabase logs** in the dashboard for authentication events
4. **Deploy and test** on actual devices (iOS/Android)

## Support

If you encounter issues:

1. Check the browser console and React Native logs for errors
2. Verify all URLs in Supabase dashboard match exactly
3. Test email delivery independently of the app
4. Ensure your app scheme is correctly configured and the app is rebuilt