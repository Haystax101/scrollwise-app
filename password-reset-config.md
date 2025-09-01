# Password Reset Configuration

## Supabase Dashboard Setup

To complete the password reset functionality, add the following URL to your Supabase project's "Authentication" > "URL Configuration" > "Redirect URLs":

```
supercharged://update-password
```

## How It Works

1. User clicks "Forgot Password?" on login screen
2. User enters email on reset-password-request screen
3. Supabase sends password reset email with deep link
4. User clicks link in email, which opens the app at update-password screen
5. User enters new password and confirms
6. Password is updated via Supabase auth.updateUser()
7. User is redirected back to login

## Development Testing

For development/testing, you may also want to add:
```
exp://127.0.0.1:19000/--/update-password
```

## Security Notes

- The redirect URL must be added to Supabase allowed redirect URLs
- Password reset tokens are handled securely by Supabase
- The app validates password requirements (6+ characters)
- Generic success message prevents email enumeration attacks