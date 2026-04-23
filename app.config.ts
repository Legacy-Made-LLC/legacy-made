import { ConfigContext, ExpoConfig } from "expo/config";

const APP_VARIANT = process.env.APP_VARIANT ?? "production";
const IS_PROD = APP_VARIANT === "production";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: IS_PROD ? "Legacy Made" : "Legacy Made (Dev)",
  slug: "legacy-made",
  version: "1.3.2",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "legacymade",
  userInterfaceStyle: "automatic",
  ios: {
    supportsTablet: true,
    bundleIdentifier: IS_PROD
      ? "com.mylegacymade.legacymade"
      : "com.mylegacymade.legacymadedev",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSPhotoLibraryUsageDescription: "Select a photo for your profile picture",
      NSCameraUsageDescription: "Record video messages for your loved ones",
      NSMicrophoneUsageDescription: "Record audio with your video messages",
    },
    appleTeamId: "LQ7UL43SY2",
    associatedDomains: ["applinks:app.mylegacymade.com"],
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#8a9785",
      foregroundImage: "./assets/images/android-icon-foreground.png",
    },
    predictiveBackGestureEnabled: false,
    package: "com.legacymade.LegacyMade",
    permissions: [
      "android.permission.RECORD_AUDIO",
      "android.permission.CAMERA",
    ],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: "https",
            host: "app.mylegacymade.com",
            pathPrefix: "/invitations",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {},
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#8a9785",
      },
    ],
    "expo-font",
    "expo-secure-store",
    "expo-image-picker",
    "expo-video",
    [
      "expo-camera",
      {
        cameraPermission: "Record video messages for your loved ones",
        microphonePermission: "Record audio with your video messages",
        recordAudioAndroid: {
          audioEncoder: "aac",
          outputFormat: "mpeg4",
        },
      },
    ],
    "expo-document-picker",
    "expo-localization",
    "@react-native-community/datetimepicker",
    [
      "expo-notifications",
      {
        icon: "./assets/images/notification-icon.png",
        color: "#8a9785",
      },
    ],
    // Super overrides react-native-quick-crypto's override, which manually pins
    // the deployment target to 16.1. MUST APPEAR BEFORE "react-native-quick-crypto"!
    "./plugins/withIOSDeploymentTarget",
    "react-native-quick-crypto",
    // Increases memory allowance for local builds.
    ["./plugins/withGradleMemory", { maxMetaspaceSize: "1024m" }],
    "expo-apple-authentication",
    "@clerk/expo",
    // Removes AD_ID permission injected transitively by Clerk's credential library.
    "./plugins/withRemoveAdId",
    [
      "expo-build-properties",
      {
        ios: {
          deploymentTarget: "17.0",
        },
        android: {
          // Optional: Additional memory optimizations
          kotlinOptions: {
            jvmTarget: "17",
          },
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: "65cd629d-438d-43f7-a917-46670f9f1b95",
    },
    apiUrl: IS_PROD
      ? process.env.EXPO_PUBLIC_API_URL
      : process.env.EXPO_PUBLIC_API_URL_DEV,
    clerkPublishableKey: IS_PROD
      ? process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
      : process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY_DEV,
    // CLERK looks for these variables at runtime. Relying on build time environment
    // variables alone will not work, so they need to be declared here as well.
    EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID:
      process.env.EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID,
    EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID:
      process.env.EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID,
    EXPO_PUBLIC_CLERK_GOOGLE_ANDROID_CLIENT_ID:
      process.env.EXPO_PUBLIC_CLERK_GOOGLE_ANDROID_CLIENT_ID,
    EXPO_PUBLIC_CLERK_GOOGLE_IOS_URL_SCHEME:
      process.env.EXPO_PUBLIC_CLERK_GOOGLE_IOS_URL_SCHEME,
    // RevenueCat public API keys (per-platform). Configure in the RC
    // dashboard under Project settings → API keys. Safe to expose in the
    // app bundle — RC's server-side writes are protected separately.
    rcIosApiKey: process.env.EXPO_PUBLIC_RC_IOS_API_KEY,
    rcAndroidApiKey: process.env.EXPO_PUBLIC_RC_ANDROID_API_KEY,
    // RC entitlement identifier for the paid tier. Must match the
    // identifier configured in the RC dashboard exactly (case-sensitive).
    // Defaults to 'individual'; override if your RC entitlement uses a
    // different slug (e.g. 'legacy_made_individual' or 'Legacy Made Individual').
    rcEntitlementIndividual:
      process.env.EXPO_PUBLIC_RC_ENTITLEMENT_INDIVIDUAL ?? "individual",
  },
  runtimeVersion: {
    policy: "appVersion",
  },
  updates: {
    url: "https://u.expo.dev/65cd629d-438d-43f7-a917-46670f9f1b95",
  },
});
