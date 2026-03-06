/**
 * Keys API Service - Manage E2EE public keys, wrapped DEKs, shared DEKs, and key transfers
 */

import type { ApiClient } from "./client";

/** Request to upload public key + wrapped DEK */
export interface UploadKeysRequest {
  publicKey: string;
  wrappedDEK: string;
  keyId: string;
}

/** Response from key upload/retrieval */
export interface UserKeyResponse {
  publicKey: string;
  wrappedDEK: string;
  keyId: string;
  createdAt: string;
}

/** Public key for another user */
export interface PublicKeyResponse {
  publicKey: string;
  keyId: string;
}

/** Request to share a DEK with a trusted contact */
export interface ShareDEKRequest {
  trustedContactId: string;
  recipientUserId: string;
  encryptedDek: string;
  recipientKeyId: string;
}

/** Response for a shared DEK */
export interface SharedDEKResponse {
  id: string;
  planId: string;
  trustedContactId: string;
  recipientUserId: string;
  encryptedDek: string;
  recipientKeyId: string;
  grantedAt: string;
}

/** Request to create a key transfer (QR device linking) */
export interface CreateKeyTransferRequest {
  payload: string;
}

/** Response from creating a key transfer */
export interface KeyTransferResponse {
  token: string;
  expiresAt: string;
}

/** Response from claiming a key transfer */
export interface KeyTransferPayload {
  payload: string;
}

/** Request to recover keys from escrow */
export interface EscrowRecoverResponse {
  dekB64: string;
}

/**
 * Create keys service bound to an API client
 */
export function createKeysService(client: ApiClient) {
  return {
    /**
     * Upload public key and wrapped DEK for the current user
     */
    upload: async (data: UploadKeysRequest): Promise<UserKeyResponse> => {
      return client.post<UserKeyResponse>("/users/keys", data);
    },

    /**
     * Get the current user's key info
     */
    getMyKeys: async (): Promise<UserKeyResponse | null> => {
      try {
        return await client.get<UserKeyResponse>("/users/keys");
      } catch {
        // 404 means no keys uploaded yet
        return null;
      }
    },

    /**
     * Get another user's public key
     */
    getPublicKey: async (userId: string): Promise<PublicKeyResponse> => {
      return client.get<PublicKeyResponse>(`/users/${userId}/public-key`);
    },

    // --- Shared DEKs (Trusted Contact Key Exchange) ---

    /**
     * Share DEK with a trusted contact by wrapping with their public key
     */
    shareDEK: async (
      planId: string,
      data: ShareDEKRequest,
    ): Promise<SharedDEKResponse> => {
      return client.post<SharedDEKResponse>(
        `/plans/${planId}/shared-deks`,
        data,
      );
    },

    /**
     * Get the shared DEK for a plan (as a trusted contact recipient)
     */
    getSharedDEK: async (planId: string): Promise<SharedDEKResponse | null> => {
      try {
        return await client.get<SharedDEKResponse>(
          `/plans/${planId}/shared-deks/mine`,
        );
      } catch {
        return null;
      }
    },

    /**
     * Revoke a shared DEK (plan owner removes contact's key access)
     */
    revokeSharedDEK: async (
      planId: string,
      trustedContactId: string,
    ): Promise<void> => {
      await client.delete(`/plans/${planId}/shared-deks/${trustedContactId}`);
    },

    // --- Key Transfers (QR Device Linking) ---

    /**
     * Create a key transfer token for QR-based device linking
     */
    createTransfer: async (
      data: CreateKeyTransferRequest,
    ): Promise<KeyTransferResponse> => {
      return client.post<KeyTransferResponse>("/users/keys/transfer", data);
    },

    /**
     * Claim a key transfer using the token from QR code
     */
    claimTransfer: async (token: string): Promise<KeyTransferPayload> => {
      return client.post<KeyTransferPayload>(
        `/users/keys/transfer/${token}/claim`,
        {},
      );
    },

    // --- Escrow Recovery ---

    /**
     * Recover DEK from escrow (for new device without local keys)
     */
    recoverFromEscrow: async (): Promise<EscrowRecoverResponse> => {
      return client.post<EscrowRecoverResponse>(
        "/users/keys/recover",
        {},
      );
    },
  };
}

export type KeysService = ReturnType<typeof createKeysService>;
