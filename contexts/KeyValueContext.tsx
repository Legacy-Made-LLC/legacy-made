import Loader from "@/components/ui/Loader";
import {
  getStorageForUser,
  globalStorage,
  migrateAsyncStorageToMMKV,
} from "@/lib/kv";
import { useAuth } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useSyncExternalStore,
} from "react";
import type { MMKV } from "react-native-mmkv";

interface KeyValueContextValue {
  userStorage: MMKV;
  globalStorage: MMKV;
}

const KeyValueContext = createContext<KeyValueContextValue | undefined>(
  undefined,
);

export function KeyValueProvider({ children }: PropsWithChildren) {
  const { userId } = useAuth();

  // This will run for both anonymous and signed-in users. This is intentional as the
  // existing AsyncStorage was not scoped, so we just migrate to both. This is a heuristic
  // approach – it doesn't need to (and can't) be perfect.
  const { isLoading: isMigrating } = useQuery({
    queryKey: ["key-store-migration", userId],
    queryFn: ({ queryKey: [, id] }) =>
      migrateAsyncStorageToMMKV(getStorageForUser(id)),
    staleTime: Infinity,
  });

  if (isMigrating) {
    return <Loader branded />;
  }

  return (
    <KeyValueContext.Provider
      value={{ userStorage: getStorageForUser(userId), globalStorage }}
    >
      {children}
    </KeyValueContext.Provider>
  );
}

export function useKeyValue() {
  const context = useContext(KeyValueContext);
  if (!context) {
    throw new Error("useKeyValue must be used within a KeyValueProvider");
  }
  return context;
}

interface UseUserStorageValueOptions<T> {
  key: string;
  get: (storage: MMKV) => T;
}

export function useUserStorageValue<T>(options: UseUserStorageValueOptions<T>) {
  const { userStorage } = useKeyValue();
  return useSyncExternalStore<T>(
    (cb) => {
      const listener = userStorage.addOnValueChangedListener(
        (key) => key === options.key && cb(),
      );
      return () => listener.remove();
    },
    // For backwards compatibility, use getString instead of getBoolean.
    () => options.get(userStorage),
  );
}

export function useGlobalStorageValue<T>(
  options: UseUserStorageValueOptions<T>,
) {
  const { globalStorage: storage } = useKeyValue();
  return useSyncExternalStore<T>(
    (cb) => {
      const listener = storage.addOnValueChangedListener(
        (key) => key === options.key && cb(),
      );
      return () => listener.remove();
    },
    () => options.get(storage),
  );
}
