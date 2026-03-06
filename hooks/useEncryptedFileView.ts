/**
 * useEncryptedFileView Hook
 *
 * Downloads an encrypted file from R2, decrypts it, writes to cache, and
 * returns a local file:// URI for display/playback.
 *
 * Manages cache cleanup when the component unmounts or the app backgrounds.
 */

import { useApi } from "@/api";
import { useOptionalCrypto } from "@/lib/crypto/CryptoProvider";
import { decryptDownloadedFile } from "@/lib/crypto/fileEncryption";
import { logger } from "@/lib/logger";
import { File, Paths } from "expo-file-system";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

interface EncryptedFileViewResult {
  /** Local file URI after decryption (null if loading or error) */
  localUri: string | null;
  /** Whether the file is being downloaded/decrypted */
  isLoading: boolean;
  /** Error message if download/decryption failed */
  error: string | null;
  /** Retry the download */
  retry: () => void;
}

/**
 * Hook to download, decrypt, and cache an encrypted file for local viewing.
 *
 * @param fileId - Backend file ID to download
 * @param mimeType - MIME type for determining file extension
 * @returns Local URI, loading state, and error info
 */
export function useEncryptedFileView(
  fileId: string | undefined,
  mimeType?: string,
): EncryptedFileViewResult {
  const { files } = useApi();
  const crypto = useOptionalCrypto();

  const [localUri, setLocalUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cachedFileRef = useRef<string | null>(null);

  /**
   * Clean up cached decrypted file
   */
  const cleanupCache = useCallback(() => {
    if (cachedFileRef.current) {
      const file = new File(cachedFileRef.current);
      file.delete().catch(() => {
        // Silently ignore cleanup errors
      });
      cachedFileRef.current = null;
      setLocalUri(null);
    }
  }, []);

  /**
   * Download and decrypt the file
   */
  const loadFile = useCallback(async () => {
    if (!fileId) return;

    setIsLoading(true);
    setError(null);

    try {
      // 1. Get download URL from API
      const downloadInfo = await files.getDownloadUrl(fileId);
      const url = downloadInfo.downloadUrl;
      if (!url) {
        throw new Error("No download URL available");
      }

      // 2. Download the encrypted file
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }

      const encryptedData = await response.arrayBuffer();

      // 3. Decrypt if crypto is available (file may be unencrypted for pre-E2EE files)
      let decryptedData: ArrayBuffer;
      if (crypto?.dekCryptoKey) {
        try {
          decryptedData = await decryptDownloadedFile(
            encryptedData,
            crypto.dekCryptoKey,
          );
        } catch {
          // If decryption fails, the file might be unencrypted (pre-migration)
          // Fall back to using the raw data
          logger.warn("E2EE: File decryption failed, using raw data (may be pre-migration file)");
          decryptedData = encryptedData;
        }
      } else {
        decryptedData = encryptedData;
      }

      // 4. Write to cache directory
      const extension = getExtensionFromMimeType(mimeType);
      const cacheFileName = `decrypted_${fileId}_${Date.now()}.${extension}`;
      const cacheFile = new File(Paths.cache, cacheFileName);

      // Write the decrypted ArrayBuffer as base64
      const uint8 = new Uint8Array(decryptedData);
      let binary = "";
      for (let i = 0; i < uint8.length; i++) {
        binary += String.fromCharCode(uint8[i]);
      }
      await cacheFile.write(btoa(binary), { encoding: "base64" });

      cachedFileRef.current = cacheFile.uri;
      setLocalUri(cacheFile.uri);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load file";
      logger.error("E2EE: Failed to load encrypted file", err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [fileId, files, crypto, mimeType]);

  // Load file on mount / fileId change
  useEffect(() => {
    if (fileId) {
      loadFile();
    }
    return () => cleanupCache();
  }, [fileId, loadFile, cleanupCache]);

  // Clean up cache when app goes to background
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === "background" || nextState === "inactive") {
        cleanupCache();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );
    return () => subscription.remove();
  }, [cleanupCache]);

  const retry = useCallback(() => {
    cleanupCache();
    loadFile();
  }, [cleanupCache, loadFile]);

  return { localUri, isLoading, error, retry };
}

/**
 * Get file extension from MIME type
 */
function getExtensionFromMimeType(mimeType?: string): string {
  if (!mimeType) return "bin";

  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/heic": "heic",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/x-m4v": "m4v",
    "audio/mpeg": "mp3",
    "audio/mp4": "m4a",
    "audio/wav": "wav",
    "application/pdf": "pdf",
  };

  return map[mimeType] ?? mimeType.split("/").pop() ?? "bin";
}
