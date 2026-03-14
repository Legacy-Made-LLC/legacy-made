/**
 * Shared Crypto Utilities
 *
 * Helpers for bridging the standard WebCrypto CryptoKey type with
 * react-native-quick-crypto's CryptoKey type.
 */

import type { CryptoKey as QCCryptoKey } from "react-native-quick-crypto";

/**
 * Cast a standard CryptoKey to the react-native-quick-crypto CryptoKey type.
 * The two types are structurally compatible at runtime but TypeScript sees them
 * as distinct because quick-crypto adds extra internal properties.
 */
export function toQC(key: CryptoKey): QCCryptoKey {
  return key as unknown as QCCryptoKey;
}

/**
 * Cast a react-native-quick-crypto CryptoKey back to the standard CryptoKey type.
 */
export function fromQC(key: QCCryptoKey): CryptoKey {
  return key as unknown as CryptoKey;
}
