import { ConfigContext, ExpoConfig } from "expo/config";

const APP_VARIANT = process.env.APP_VARIANT ?? "production";
const IS_PROD = APP_VARIANT === "production";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: IS_PROD ? "Legacy Made" : "Legacy Made (Dev)",
  slug: "legacy-made",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "legacymade",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: IS_PROD
      ? "com.mylegacymade.legacymade"
      : "com.gibsonops.legacymade.dev1",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSPhotoLibraryUsageDescription: "Select a photo for your profile picture",
    },
    appleTeamId: "LQ7UL43SY2",
    associatedDomains: ["applinks:app.mylegacymade.com"],
  },
  android: {
    versionCode: 5,
    adaptiveIcon: {
      backgroundColor: "#8a9785",
      foregroundImage: "./assets/images/android-icon-foreground.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: "com.legacymade.LegacyMade",
    permissions: ["android.permission.RECORD_AUDIO"],
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
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
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
    "expo-document-picker",
    ["./plugins/withGradleMemory", { maxMetaspaceSize: "1024m" }],
    [
      "expo-build-properties",
      {
        ios: {
          deploymentTarget: "16.0",
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
  },
  runtimeVersion: {
    policy: "appVersion",
  },
  updates: {
    url: "https://u.expo.dev/65cd629d-438d-43f7-a917-46670f9f1b95",
  },
});
