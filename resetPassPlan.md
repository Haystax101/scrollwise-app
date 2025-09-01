# Password Reset Implementation Plan

This document outlines the plan to add a password reset feature to the onboarding flow, using Supabase Authentication.

## 1. Overview

The password reset process will consist of three main parts:
1.  **Initiate Reset:** A user provides their email address to request a password reset link.
2.  **Email Confirmation:** Supabase sends an email to the user with a link to a password update page.
3.  **Update Password:** The user clicks the link, is redirected back to the app, and provides a new password.

## 2. UI/UX Flow

### 2.1. Login Screen (`onboarding.tsx`)

*   Add a "Forgot Password?" button below the "Sign In" button.
*   When tapped, this button will navigate the user to a new "Reset Password Request" screen.

### 2.2. Reset Password Request Screen

*   This new screen will have a simple UI:
    *   A title: "Reset Password"
    *   An email input field.
    *   A "Send Reset Link" button.
    *   A "Back to Login" button.
*   When the user enters their email and taps the button, we will call the `supabase.auth.resetPasswordForEmail` function.
*   After the button is tapped, a confirmation message will be shown (e.g., "If an account with that email exists, a password reset link has been sent.").

### 2.3. Update Password Screen

*   This new screen will be the destination for the deep link from the password reset email.
*   It will contain:
    *   A title: "Update Your Password"
    *   A new password input field.
    *   A "Confirm New Password" input field.
    *   An "Update Password" button.
*   When the user lands on this screen, we will use Supabase's `onAuthStateChange` to listen for the `PASSWORD_RECOVERY` event. This will confirm that the user has a valid session to update their password.
*   Upon form submission, we will call `supabase.auth.updateUser` with the new password.
*   After a successful password update, the user will be shown a success message and then navigated to the login screen.

## 3. Technical Implementation

### 3.1. Supabase Configuration

*   In the Supabase Dashboard, under "Authentication" -> "URL Configuration", we need to add the deep link URL for the "Update Password" screen to the list of allowed redirect URLs. This will likely be something like `exp://<your-expo-project-id>/--/update-password`.

### 3.2. Code Changes

*   **`app/onboarding.tsx`**:
    *   Add the "Forgot Password?" button.
    *   Add navigation logic to the new reset password request screen.

*   **`app/reset-password-request.tsx` (New File)**:
    *   Implement the UI as described above.
    *   Implement the call to `supabase.auth.resetPasswordForEmail`.
    *   Handle loading and success/error states.

*   **`app/update-password.tsx` (New File)**:
    *   Implement the UI for updating the password.
    *   Use `useEffect` and `supabase.auth.onAuthStateChange` to handle the `PASSWORD_RECOVERY` event.
    *   Implement the call to `supabase.auth.updateUser`.
    *   Handle form validation (e.g., passwords match).
    *   Handle loading and success/error states.

### 3.3. Deep Linking

*   We will need to configure deep linking in the Expo app to handle the redirect from the Supabase email. This will involve adding a `scheme` to `app.json` and handling the incoming URL to navigate to the `update-password` screen.

## 4. Security Considerations

*   The `redirectTo` URL in the `resetPasswordForEmail` call is critical for security and must be correctly configured in the Supabase dashboard.
*   We will not reveal whether an email address is registered with our service on the reset password request screen to prevent user enumeration attacks. The confirmation message will be generic.
