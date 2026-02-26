/**
 * App Store Review Authentication
 *
 * Apple requires a username + password for review. Since the app uses OTP,
 * we detect reviewer email addresses and present a password field instead.
 *
 * Reviewer accounts must be pre-created in Clerk with password auth enabled.
 * Provide Apple with credentials like:
 *   Username: appreview@legacymade.com
 *   Password: <set in Clerk dashboard>
 */

const REVIEWER_EMAIL_PATTERN = /^appreview\d{3}@mylegacymade\.com$/i;

/**
 * Returns true if the email matches the App Store reviewer pattern.
 * These accounts use password auth instead of OTP.
 */
export function isReviewerEmail(email: string): boolean {
  return REVIEWER_EMAIL_PATTERN.test(email.trim());
}
