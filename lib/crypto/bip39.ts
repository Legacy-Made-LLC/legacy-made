/**
 * BIP-39 Mnemonic
 *
 * Converts entropy (private key bytes) to a 24-word recovery phrase and back.
 * Uses the standard BIP-39 English wordlist (2048 words).
 *
 * Note: The wordlist is bundled inline (~15KB) to avoid external dependencies.
 * Only the first 2048 words are used per the BIP-39 specification.
 */

import QuickCrypto from "react-native-quick-crypto";

import BIP39_WORDLIST from "./bip39-wordlist.json";

const subtle = QuickCrypto.subtle;

/**
 * Compute SHA-256 hash for BIP-39 checksum.
 */
async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const hash = await subtle.digest("SHA-256", data);
  return new Uint8Array(hash);
}

/**
 * Convert 32 bytes of entropy to a 24-word BIP-39 mnemonic.
 *
 * Process:
 * 1. Take 256 bits of entropy
 * 2. SHA-256 hash -> take first 8 bits as checksum
 * 3. Combine: 256 + 8 = 264 bits
 * 4. Split into 24 groups of 11 bits -> 24 word indices
 */
export async function entropyToMnemonic(
  entropy: Uint8Array,
): Promise<string[]> {
  if (entropy.length !== 32) {
    throw new Error("BIP-39 mnemonic requires exactly 32 bytes of entropy");
  }

  const hash = await sha256(entropy);

  // Convert entropy + checksum byte to binary string
  let bits = "";
  for (let i = 0; i < entropy.length; i++) {
    bits += entropy[i].toString(2).padStart(8, "0");
  }
  // Append 8 checksum bits (first byte of SHA-256)
  bits += hash[0].toString(2).padStart(8, "0");

  // Split into 24 groups of 11 bits
  const result: string[] = [];
  for (let i = 0; i < 24; i++) {
    const index = parseInt(bits.slice(i * 11, (i + 1) * 11), 2);
    result.push(BIP39_WORDLIST[index]);
  }

  return result;
}

/**
 * Convert a 24-word BIP-39 mnemonic back to 32 bytes of entropy.
 *
 * Validates the checksum before returning.
 */
export async function mnemonicToEntropy(
  words: string[],
): Promise<Uint8Array> {
  if (words.length !== 24) {
    throw new Error("BIP-39 mnemonic must be exactly 24 words");
  }

  // Convert words to binary string
  let bits = "";
  for (const word of words) {
    const index = BIP39_WORDLIST.indexOf(word.toLowerCase().trim());
    if (index === -1) {
      throw new Error(`Invalid BIP-39 word: ${word}`);
    }
    bits += index.toString(2).padStart(11, "0");
  }

  // 264 bits total: 256 entropy + 8 checksum
  const entropyBits = bits.slice(0, 256);
  const checksumBits = bits.slice(256, 264);

  // Convert entropy bits to bytes
  const entropy = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    entropy[i] = parseInt(entropyBits.slice(i * 8, (i + 1) * 8), 2);
  }

  // Validate checksum
  const hash = await sha256(entropy);
  const expectedChecksum = hash[0].toString(2).padStart(8, "0");
  if (checksumBits !== expectedChecksum) {
    throw new Error(
      "Invalid BIP-39 checksum — recovery phrase may be incorrect",
    );
  }

  return entropy;
}
