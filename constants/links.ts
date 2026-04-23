/**
 * External URLs for Legacy Made
 *
 * All URLs use environment variables with hardcoded defaults.
 * Set EXPO_PUBLIC_* env vars to override in different environments.
 */

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL ?? "https://mylegacymade.com";
const APP_BASE_URL =
  process.env.EXPO_PUBLIC_APP_BASE_URL ?? "https://app.mylegacymade.com";

export const EXTERNAL_LINKS = {
  // Single Help & Support surface — covers cancel, restore, refunds,
  // account deletion, and a contact form. Lives on the SSR web app
  // (app.mylegacymade.com), not the marketing site.
  support: process.env.EXPO_PUBLIC_SUPPORT_URL ?? `${APP_BASE_URL}/support`,

  // Legal
  privacyPolicy:
    process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL ?? `${BASE_URL}/privacy-policy`,
  termsOfService:
    process.env.EXPO_PUBLIC_TERMS_URL ?? `${BASE_URL}/terms-of-service`,

  // Upgrade
  upgrade: process.env.EXPO_PUBLIC_UPGRADE_URL ?? `${BASE_URL}/upgrade`,
} as const;

/**
 * @deprecated Use EXTERNAL_LINKS instead
 */
export const SUPPORT_LINKS = EXTERNAL_LINKS;
