import AsyncStorage from "@react-native-async-storage/async-storage";
import { createMMKV, type MMKV } from "react-native-mmkv";

const MMKV_MIGRATION_COMPLETED_KEY =
  "async-storage-to-mmkv-migration-completed";

const storageRegistry = new Map<string, MMKV>();

export const globalStorage = createMMKV();

export const getStorageForUser = (userId: string | undefined | null) => {
  const storageId = `user-storage.${userId ?? "anonymous"}`;
  if (storageRegistry.has(storageId)) {
    return storageRegistry.get(storageId)!;
  }
  const storage = createMMKV({
    id: storageId,
  });
  storageRegistry.set(storageId, storage);
  return storage;
};

/** Migrates previous global-scoped AsyncStorage to user-scoped MMKV. Global scope
 * was previously assumed to be user-scoped but wasn't.
 * Returns true if migration was successful.
 */
export const migrateAsyncStorageToMMKV = async (storage: MMKV) => {
  if (storage.getBoolean(MMKV_MIGRATION_COMPLETED_KEY)) {
    return false;
  }

  const keys = await AsyncStorage.getAllKeys();

  for (const key of keys) {
    const value = await AsyncStorage.getItem(key);
    if (value) {
      if (value === "true") {
        storage.set(key, true);
      } else if (value === "false") {
        storage.set(key, false);
      } else {
        storage.set(key, value);
      }
    }
  }

  storage.set(MMKV_MIGRATION_COMPLETED_KEY, true);
  return true;
};
