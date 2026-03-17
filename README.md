# Welcome to Legacy Made 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Set up environment variables

   Copy `.env.example` to `.env` and fill in the required values:

   ```bash
   cp .env.example .env
   ```

3. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Environment Variables

Create a `.env` file in the project root with the following variables:

### Required

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key for authentication. Get this from your [Clerk Dashboard](https://dashboard.clerk.com/). |
| `EXPO_PUBLIC_API_URL` | Base URL for the Legacy Made API server. Use `http://localhost:3000` for local development. |

### Optional (External Links)

These variables configure the external website URLs used throughout the app. All have sensible defaults pointing to `https://mylegacymade.com`.

| Variable | Default | Description |
|----------|---------|-------------|
| `EXPO_PUBLIC_BASE_URL` | `https://mylegacymade.com` | Base URL used to construct other link defaults. Only needed if hosting on a different domain. |
| `EXPO_PUBLIC_HELP_URL` | `{BASE_URL}/help` | URL for the help/FAQ page. |
| `EXPO_PUBLIC_SUPPORT_URL` | `{BASE_URL}/support` | URL for the contact support page. |
| `EXPO_PUBLIC_PRIVACY_POLICY_URL` | `{BASE_URL}/privacy-policy` | URL for the privacy policy page. |
| `EXPO_PUBLIC_TERMS_URL` | `{BASE_URL}/terms-of-service` | URL for the terms of service page. |
| `EXPO_PUBLIC_UPGRADE_URL` | `{BASE_URL}/upgrade` | URL for the subscription upgrade page. |

### Example `.env` file

```bash
# Required
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
EXPO_PUBLIC_API_URL=http://localhost:3000

# Optional - uncomment to override defaults
# EXPO_PUBLIC_BASE_URL=https://mylegacymade.com
# EXPO_PUBLIC_HELP_URL=https://mylegacymade.com/help
# EXPO_PUBLIC_SUPPORT_URL=https://mylegacymade.com/support
# EXPO_PUBLIC_PRIVACY_POLICY_URL=https://mylegacymade.com/privacy-policy
# EXPO_PUBLIC_TERMS_URL=https://mylegacymade.com/terms-of-service
# EXPO_PUBLIC_UPGRADE_URL=https://mylegacymade.com/upgrade
```

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
