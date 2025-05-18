# Google OAuth Setup Guide for SIGNAL

This guide walks you through setting up Google OAuth credentials for your SIGNAL application.

## Steps to Set Up Google OAuth

1. **Go to Google Cloud Console**

   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Sign in with your Google account

2. **Create a New Project**

   - Click on the project dropdown at the top of the page
   - Click "New Project"
   - Enter "SIGNAL" as the project name
   - Click "Create"

3. **Configure OAuth Consent Screen**

   - From the left sidebar, navigate to "APIs & Services" > "OAuth consent screen"
   - Select "External" as the user type (unless you have a Google Workspace organization)
   - Click "Create"
   - Fill in required information:
     - App name: SIGNAL
     - User support email: [your email]
     - Developer contact information: [your email]
   - Click "Save and Continue"
   - Skip "Scopes" section by clicking "Save and Continue"
   - Add test users (including your own email) if you selected External
   - Click "Save and Continue"
   - Review your app information and click "Back to Dashboard"

4. **Create OAuth Credentials**

   - From the left sidebar, navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application" as the application type
   - Name: "SIGNAL Web Client"
   - Add Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - Add your production URL when ready to deploy
   - Add Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - Add your production callback URL when ready to deploy
   - Click "Create"
   - You'll see a popup with your client ID and client secret

5. **Add Credentials to Your .env File**

   - Copy the generated client ID and client secret
   - Open your project's `.env` file
   - Add or update the following variables:
     ```
     GOOGLE_CLIENT_ID=your_client_id_here
     GOOGLE_CLIENT_SECRET=your_client_secret_here
     NEXTAUTH_URL=http://localhost:3000
     NEXTAUTH_SECRET=your_nextauth_secret_here
     ```
   - For NEXTAUTH_SECRET, you can use your existing JWT_SECRET or generate a new random string

6. **Restart Your Development Server**
   - After updating the .env file, restart your Next.js development server to apply the changes

## Important Notes

- For production, be sure to update the authorized origins and redirect URIs with your actual domain
- The consent screen starts in "Testing" mode, which limits the number of users who can access it
- To publish your app for all users, you'll need to go through verification if you selected "External" user type

## Troubleshooting

- If you encounter errors about "invalid_client", double-check your client ID and client secret
- If redirect URIs aren't working, ensure you've added the exact callback URL including the `/api/auth/callback/google` path
- For "redirect_uri_mismatch" errors, verify that the callback URL in your code exactly matches what you registered in Google Cloud Console
