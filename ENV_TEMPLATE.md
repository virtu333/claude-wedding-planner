# Environment Variables Template

Copy this to `.env.local` and fill in your values.

```bash
# Firebase Configuration
# Get these from Firebase Console > Project Settings > Your Apps > Config
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Optional: Simple password protection
# If set, users must enter this password to access the app
# Leave empty or remove to disable password protection
# Note: This is client-side only - suitable for casual privacy, not high security
VITE_APP_PASSWORD=your_shared_password_here
```

## Getting Firebase Config

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click the gear icon > Project Settings
4. Scroll down to "Your apps"
5. If no web app exists, click "Add app" and select Web
6. Copy the config values from the `firebaseConfig` object

## Firestore Setup

1. In Firebase Console, go to Firestore Database
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location close to you
5. The app will create the necessary collections automatically

## Vercel Deployment

When deploying to Vercel, add these same environment variables in:
- Vercel Dashboard > Your Project > Settings > Environment Variables

Remember to prefix each variable with `VITE_` for Vite to expose them to the client.

## Password Protection

The `VITE_APP_PASSWORD` variable enables simple password protection:

- **If set**: Users see a password prompt before accessing the app
- **If empty/missing**: App loads without any password requirement
- **Session persistence**: Authenticated state lasts until browser closes
- **Security note**: This is client-side validation only. Suitable for casual privacy (keeping the board from casual visitors), but not a substitute for proper authentication if you need high security.
