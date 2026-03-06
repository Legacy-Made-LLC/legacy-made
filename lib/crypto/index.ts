/**
 * E2EE Crypto Module
 *
 * End-to-end encryption utilities for Legacy Made.
 * Uses react-native-quick-crypto (SubtleCrypto) for all cryptographic operations.
 */

// Types
export type {
  EncryptedEntryMetadata,
  EncryptedPayload,
  KeyBackupStatus,
} from "./types";
export { ALGORITHM_ID } from "./types";

// AES-256-GCM
export {
  decryptBuffer,
  decryptString,
  encryptBuffer,
  encryptString,
} from "./aes";

// Key Management
export {
  clearEncryptionKeys,
  exportDEK,
  exportPrivateKey,
  exportPublicKey,
  generateDEK,
  generateKeyPair,
  getDEK,
  getKeyId,
  getPrivateKey,
  hasEncryptionKeys,
  importDEK,
  importPrivateKey,
  importPublicKey,
  storeDEK,
  storeKeyId,
  storePrivateKey,
  unwrapDEK,
  wrapDEK,
} from "./keys";

// File Encryption
export { decryptDownloadedFile, encryptFileForUpload } from "./fileEncryption";

// Entry/Wish Encryption
export {
  decryptEntry,
  decryptSensitiveFields,
  encryptForCreate,
  encryptForUpdate,
  isEncryptedEntry,
} from "./entryEncryption";

// BIP-39 Recovery Phrase
export { entropyToMnemonic, mnemonicToEntropy } from "./bip39";

// CryptoProvider
export { CryptoProvider, useCrypto, useOptionalCrypto } from "./CryptoProvider";
