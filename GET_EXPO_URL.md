# How to Find Your Expo Go Development URL

## Quick Steps:

1. **Run Expo Start:**
   ```bash
   expo start
   ```

2. **Look for the Metro URL in the terminal output:**
   - You'll see something like: `Metro waiting on exp://192.168.1.100:8081`
   - Or: `exp://192.168.1.XXX:8081`

3. **Copy the exact URL** (including the `exp://` part)

4. **Use this URL in Supabase Dashboard:**
   - **Site URL:** `exp://192.168.1.XXX:8081`
   - **Additional Redirect URLs:**
     ```
     exp://192.168.1.XXX:8081
     exp://192.168.1.XXX:8081/--/
     exp://192.168.1.XXX:8081/--/auth/callback
     exp://192.168.1.XXX:8081/--/email-verification
     ```

## Alternative Methods:

### Method 1: Check Expo Dashboard
- Open the Expo dashboard in your browser when running `expo start`
- The URL will be displayed at the top

### Method 2: QR Code Scanner
- Scan the QR code with your phone's camera
- The URL format will be visible before opening Expo Go

### Method 3: Network Interface Check
```bash
# Find your local IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# Default port is usually 8081
# So your URL would be: exp://[YOUR_IP]:8081
```

## Important Notes:

- **Different Networks:** If your phone and computer are on different networks, this won't work
- **Port Changes:** The port might be different (8082, 8083) if 8081 is busy
- **IP Changes:** Your IP might change if you restart your router or move networks
- **Update Supabase:** You'll need to update the URLs in Supabase if your IP/port changes

## Ready to Test?

Once you've updated Supabase with your Expo Go URLs:

1. ✅ Start your Expo development server
2. ✅ Update Supabase URLs
3. ✅ Test the signup flow with a real email
4. ✅ Check that email verification links open your app