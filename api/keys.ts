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
  createdAt: string;
  updatedAt: string;
}

/** Public key record for another user */
export interface PublicKeyRecord {
  userId: string;
  publicKey: string;
  keyVersion: number;
  keyType: "device" | "recovery";
  deviceLabel: string | null;
}

// ============================================================================
// DEK records
// ============================================================================

/** Request to store an encrypted DEK copy */
export interface StoreDekRequest {
  planId: string;
  recipientId: string;
  dekType: "device" | "contact" | "recovery" | "escrow";
  encryptedDek: string;
  keyVersion: number;
}

/** DEK types managed via rotate/delete (escrow is managed separately) */
export type ManagedDekType = "device" | "contact" | "recovery";

/** Request to rotate (replace) DEK copies for a plan */
export interface RotateDekRequest {
  planId: string;
  newDeks: {
    recipientId: string;
    dekType: ManagedDekType;
    encryptedDek: string;
    keyVersion: number;
  }[];
}

/** DEK record returned from the server */
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

/** Request to enable KMS escrow for a plan */
export interface EnableEscrowRequest {
  planId: string;
  dekPlaintext: string;
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
     */
    getMyKeys: async (): Promise<UserKeyRecord[]> => {
      return client.get<UserKeyRecord[]>("/encryption/keys/me");
    },

    /**
     * Get all public keys for another user.
     */
    getPublicKeys: async (userId: string): Promise<PublicKeyRecord[]> => {
      return client.get<PublicKeyRecord[]>(`/encryption/keys/${userId}`);
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

    /**
     * Check DEK sharing status between an owner and recipient for a plan.
     */
    getDekStatus: async (
      ownerId: string,
      recipientId: string,
      planId: string,
    ): Promise<DekStatusResponse> => {
      return client.get<DekStatusResponse>(
        `/encryption/deks/status/${ownerId}/${recipientId}?planId=${encodeURIComponent(planId)}`,
      );
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
     * Enable KMS escrow for a plan. Server encrypts the DEK with AWS KMS.
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
