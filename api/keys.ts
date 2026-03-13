/**
 * Keys API Service - E2EE key management, DEKs, device linking, escrow, and plan encryption
 *
 * All endpoints use the /encryption/* path prefix.
 * Supports multiple keys per user (one per device + recovery keys).
 */

import type { ApiClient } from "./client";

// ============================================================================
// Setup (first-time init)
// ============================================================================

/** Combined setup request: register key + store owner DEK in one transaction */
export interface SetupRequest {
  publicKey: string;
  planId: string;
  encryptedDek: string;
  deviceLabel?: string;
}

/** Response from combined setup */
export interface SetupResponse {
  keyVersion: number;
  dekId: string;
}

// ============================================================================
// Key records
// ============================================================================

/** Full key record for the current user (includes all fields) */
export interface UserKeyRecord {
  id: string;
  userId: string;
  publicKey: string;
  keyVersion: number;
  deviceLabel: string | null;
  keyType: "device" | "recovery";
  isActive: boolean;
  deactivatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Public key record for another user */
export interface PublicKeyRecord {
  userId: string;
  publicKey: string;
  keyVersion: number;
  keyType: "device" | "recovery";
  isActive: boolean;
}

// ============================================================================
// DEK records
// ============================================================================

/**
 * Request to store an encrypted DEK copy.
 *
 * The `encryptedDek` format depends on `dekType`:
 *
 * - **device / contact / escrow**: Base64 RSA-OAEP ciphertext (no IV needed —
 *   RSA-OAEP handles randomization internally).
 *
 * - **recovery**: JSON string with PBKDF2 + AES-256-GCM parameters:
 *   `{ v: number, iv: string, data: string, salt: string, kdf: "pbkdf2", iterations: number }`
 *   All binary values are base64-encoded. Required because the wrapping key is
 *   derived from a mnemonic via PBKDF2, and AES-GCM decryption needs the IV and salt.
 */
export interface StoreDekRequest {
  planId: string;
  recipientId: string;
  dekType: "device" | "contact" | "recovery" | "escrow";
  encryptedDek: string;
  keyVersion: number;
}

/** DEK types managed via rotate/delete (escrow is managed separately) */
export type ManagedDekType = "device" | "contact" | "recovery";

/**
 * Request to rotate (replace) DEK copies for a plan.
 *
 * See {@link StoreDekRequest} for the `encryptedDek` format per `dekType`.
 */
export interface RotateDekRequest {
  planId: string;
  newDeks: {
    recipientId: string;
    dekType: ManagedDekType;
    encryptedDek: string;
    keyVersion: number;
  }[];
}

/**
 * DEK record returned from the server.
 *
 * See {@link StoreDekRequest} for the `encryptedDek` format per `dekType`.
 */
export interface DekRecord {
  id: string;
  planId: string;
  ownerId: string;
  recipientId: string;
  dekType: "device" | "contact" | "recovery" | "escrow";
  encryptedDek: string;
  keyVersion: number;
  createdAt: string;
  updatedAt: string;
}

/** DEK status check response */
export interface DekStatusResponse {
  exists: boolean;
  deks: {
    dekType: "device" | "contact" | "recovery" | "escrow";
    keyVersion: number;
  }[];
}

// ============================================================================
// Device linking
// ============================================================================

/** Response from creating a device link session */
export interface DeviceLinkSessionResponse {
  sessionCode: string;
  expiresAt: string;
}

/** Request to deposit identity into a device link session */
export interface DeviceLinkDepositRequest {
  sessionCode: string;
  encryptedPayload: string;
}

/** Response from claiming a device link session */
export interface DeviceLinkClaimResponse {
  payload: string;
}

// ============================================================================
// Escrow & recovery
// ============================================================================

/** Response from fetching the escrow public key */
export interface EscrowPublicKeyResponse {
  publicKey: string;
}

/** Request to enable KMS escrow for a plan */
export interface EnableEscrowRequest {
  planId: string;
  encryptedDek: string;
}

/** Response from enabling escrow */
export interface EnableEscrowResponse {
  id: string;
  enabled: boolean;
}

/** Request to recover from escrow */
export interface RecoverRequest {
  planId: string;
  newPublicKey: string;
  deviceLabel?: string;
}

/** Response from escrow recovery */
export interface RecoverResponse {
  dekPlaintext: string;
}

// ============================================================================
// Recovery events
// ============================================================================

/** Audit log entry for recovery-related actions */
export interface RecoveryEvent {
  id: string;
  userId: string;
  eventType: string;
  ipAddress: string | null;
  userAgent: string | null;
  details: unknown;
  createdAt: string;
}

// ============================================================================
// Plan E2EE
// ============================================================================

/** Plan E2EE status */
export interface PlanE2EEStatus {
  planId: string;
  e2eeEnabled: boolean;
}

// ============================================================================
// Public key lookup by email
// ============================================================================

/** Response when a user with the given email has registered encryption keys */
export interface PublicKeyByEmailResponse {
  found: true;
  userId: string;
  /** All active device keys for this user */
  keys: PublicKeyRecord[];
}

/** Response when no user with encryption keys is found for the email */
export interface PublicKeyByEmailNotFoundResponse {
  found: false;
}

/** Union result for email-based public key lookup */
export type PublicKeyByEmailResult =
  | PublicKeyByEmailResponse
  | PublicKeyByEmailNotFoundResponse;

// ============================================================================
// Service
// ============================================================================

/**
 * Create keys service bound to an API client.
 * All endpoints use /encryption/* paths.
 */
export function createKeysService(client: ApiClient) {
  return {
    // --- Setup (combined first-time init) ---

    /**
     * Register public key + store owner DEK copy in one transaction.
     * Used on first app launch. Server assigns keyVersion.
     */
    setup: async (data: SetupRequest): Promise<SetupResponse> => {
      return client.post<SetupResponse>("/encryption/setup", data);
    },

    // --- Keys ---

    /**
     * Get all key records for the current user (multiple devices/recovery).
     * @param includeInactive - If true, include deactivated keys (for device management UI)
     */
    getMyKeys: async (includeInactive?: boolean): Promise<UserKeyRecord[]> => {
      const query = includeInactive ? "?includeInactive=true" : "";
      return client.get<UserKeyRecord[]>(`/encryption/keys/me${query}`);
    },

    /**
     * Get public keys for another user. Defaults to active keys only.
     * @param includeInactive - If true, include deactivated keys
     */
    getPublicKeys: async (
      userId: string,
      includeInactive?: boolean,
    ): Promise<PublicKeyRecord[]> => {
      const query = includeInactive ? "?includeInactive=true" : "";
      return client.get<PublicKeyRecord[]>(
        `/encryption/keys/${userId}${query}`,
      );
    },

    /**
     * Look up a user's public key by email address.
     * Returns the user's info and primary public key if found,
     * or { found: false } if no user with encryption keys exists.
     */
    getPublicKeyByEmail: async (
      email: string,
    ): Promise<PublicKeyByEmailResult> => {
      return client.get<PublicKeyByEmailResult>(
        `/encryption/keys/by-email?email=${encodeURIComponent(email)}`,
      );
    },

    /**
     * Register a new key (additional device or recovery key).
     * Server assigns keyVersion.
     */
    registerKey: async (data: {
      publicKey: string;
      keyType: "device" | "recovery";
      deviceLabel?: string;
    }): Promise<UserKeyRecord> => {
      return client.post<UserKeyRecord>("/encryption/keys", data);
    },

    /**
     * Delete a key by its version number.
     */
    deleteKey: async (keyVersion: number): Promise<void> => {
      await client.delete(`/encryption/keys/${keyVersion}`);
    },

    /**
     * Deactivate a key (report as lost). Sets is_active = false,
     * deletes DEK records for that keyVersion.
     * Returns the updated key record.
     */
    deactivateKey: async (keyVersion: number): Promise<UserKeyRecord> => {
      return client.patch<UserKeyRecord>(
        `/encryption/keys/${keyVersion}/deactivate`,
        {},
      );
    },

    // --- DEKs ---

    /**
     * Store an encrypted DEK copy (for owner, contact, or escrow).
     */
    storeDek: async (data: StoreDekRequest): Promise<DekRecord> => {
      return client.post<DekRecord>("/encryption/deks", data);
    },

    /**
     * Get DEK copies for a plan where the current user is the recipient.
     */
    getMyDeks: async (
      planId: string,
      ownerId: string,
    ): Promise<DekRecord[]> => {
      return client.get<DekRecord[]>(
        `/encryption/deks/mine/${ownerId}?planId=${encodeURIComponent(planId)}`,
      );
    },

    /**
     * List all DEK copies, optionally filtered by plan.
     */
    listDeks: async (planId?: string): Promise<DekRecord[]> => {
      const query = planId ? `?planId=${encodeURIComponent(planId)}` : "";
      return client.get<DekRecord[]>(`/encryption/deks${query}`);
    },

    // --- Device Linking (3-step session/deposit/claim) ---

    /**
     * Create a device link session (called by the new device).
     */
    createDeviceLinkSession: async (): Promise<DeviceLinkSessionResponse> => {
      return client.post<DeviceLinkSessionResponse>(
        "/encryption/device-link/session",
        {},
      );
    },

    /**
     * Deposit identity info into a device link session (called by the new device).
     */
    depositDeviceLink: async (
      data: DeviceLinkDepositRequest,
    ): Promise<void> => {
      await client.post("/encryption/device-link/deposit", data);
    },

    /**
     * Claim a device link session (called by the source device).
     * Returns the new device's identity info.
     */
    claimDeviceLink: async (
      sessionCode: string,
    ): Promise<DeviceLinkClaimResponse> => {
      return client.post<DeviceLinkClaimResponse>(
        "/encryption/device-link/claim",
        { sessionCode },
      );
    },

    /**
     * Rotate (replace) DEK copies for a plan. Atomically deletes existing
     * DEK records matching each entry's planId + dekType, then stores the
     * new ones.
     *
     * Backend: PUT /encryption/deks
     */
    rotateDek: async (data: RotateDekRequest): Promise<DekRecord[]> => {
      return client.put<DekRecord[]>("/encryption/deks", data);
    },

    /**
     * Delete DEK records by type for a plan, optionally filtered by keyVersion.
     *
     * Backend: DELETE /encryption/deks?planId=X&dekType=Y[&keyVersion=Z]
     */
    deleteDek: async (
      planId: string,
      dekType: ManagedDekType,
      keyVersion?: number,
      recipientId?: string,
    ): Promise<void> => {
      let url = `/encryption/deks?planId=${encodeURIComponent(planId)}&dekType=${encodeURIComponent(dekType)}`;
      if (keyVersion !== undefined) {
        url += `&keyVersion=${keyVersion}`;
      }
      if (recipientId !== undefined) {
        url += `&recipientId=${recipientId}`;
      }
      await client.delete(url);
    },

    // --- Escrow ---

    /**
     * Fetch the escrow RSA public key (SPKI/DER, base64-encoded).
     * The key rarely rotates — callers should cache it for the session.
     */
    getEscrowPublicKey: async (): Promise<EscrowPublicKeyResponse> => {
      return client.get<EscrowPublicKeyResponse>(
        "/encryption/escrow/public-key",
      );
    },

    /**
     * Enable KMS escrow for a plan.
     * Client encrypts the DEK with the escrow public key before sending.
     * Server stores the ciphertext directly — never sees the plaintext.
     */
    enableEscrow: async (
      data: EnableEscrowRequest,
    ): Promise<EnableEscrowResponse> => {
      return client.post<EnableEscrowResponse>("/encryption/escrow", data);
    },

    /**
     * Revoke KMS escrow for a plan. Server deletes the escrowed DEK.
     */
    revokeEscrow: async (planId: string): Promise<void> => {
      await client.delete<void>(`/encryption/escrow?planId=${planId}`);
    },

    /**
     * Recover DEK from escrow. Generates new key pair first, sends new public key.
     * Server returns the plaintext DEK (decrypted via KMS) over TLS.
     */
    recoverFromEscrow: async (
      data: RecoverRequest,
    ): Promise<RecoverResponse> => {
      return client.post<RecoverResponse>("/encryption/recovery", data);
    },

    // --- Recovery events ---

    /**
     * List recovery audit events for the current user.
     */
    listRecoveryEvents: async (): Promise<RecoveryEvent[]> => {
      return client.get<RecoveryEvent[]>("/encryption/recovery/events");
    },

    // --- Plan E2EE ---

    /**
     * Enable E2EE for a plan.
     */
    enablePlanE2EE: async (planId: string): Promise<PlanE2EEStatus> => {
      return client.post<PlanE2EEStatus>(
        `/encryption/plans/${planId}/enable`,
        {},
      );
    },

    /**
     * Get E2EE status for a plan.
     */
    getPlanE2EEStatus: async (planId: string): Promise<PlanE2EEStatus> => {
      return client.get<PlanE2EEStatus>(`/encryption/plans/${planId}/status`);
    },
  };
}

export type KeysService = ReturnType<typeof createKeysService>;
