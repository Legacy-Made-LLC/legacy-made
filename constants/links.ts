/**
 * External URLs for Legacy Made
 *
 * All URLs use environment variables with hardcoded defaults.
 * Set EXPO_PUBLIC_* env vars to override in different environments.
 */

const BASE_URL =
  process.env.EXPO_PUBLIC_BASE_URL ?? "https://mylegacymade.com";

export const EXTERNAL_LINKS = {
  // Support & Help
  helpFaq: process.env.EXPO_PUBLIC_HELP_URL ?? `${BASE_URL}/help`,
  contactSupport: process.env.EXPO_PUBLIC_SUPPORT_URL ?? `${BASE_URL}/support`,

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
