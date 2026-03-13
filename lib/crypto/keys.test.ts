/**
 * Snapshot test for SecureStore alias constants.
 *
 * These strings are persisted in the iOS Keychain / Android Keystore.
 * If any value changes, existing users will lose access to their encryption
 * keys. This test ensures alias renames are a deliberate, reviewed decision
 * rather than an accidental refactor.
 */
import {
  PRIVATE_KEY_PREFIX,
  PUBLIC_KEY_PREFIX,
  DEK_PREFIX,
  KEY_ID_PREFIX,
  KEY_VERSION_PREFIX,
} from "./keys";

describe("SecureStore key aliases are stable", () => {
  it("PRIVATE_KEY_PREFIX has not changed", () => {
    expect(PRIVATE_KEY_PREFIX).toBe("e2ee_private_key");
  });

  it("PUBLIC_KEY_PREFIX has not changed", () => {
    expect(PUBLIC_KEY_PREFIX).toBe("e2ee_public_key");
  });

  it("DEK_PREFIX has not changed", () => {
    expect(DEK_PREFIX).toBe("e2ee_dek");
  });

  it("KEY_ID_PREFIX has not changed", () => {
    expect(KEY_ID_PREFIX).toBe("e2ee_key_id");
  });

  it("KEY_VERSION_PREFIX has not changed", () => {
    expect(KEY_VERSION_PREFIX).toBe("e2ee_key_version");
  });
});
