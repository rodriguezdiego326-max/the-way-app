import { SecureStorage, KeychainAccess } from '@aparajita/capacitor-secure-storage';

const AUTH_PREFIX = 'solapath_auth_';

let initError: string | null = null;

const secureStorageReady = (async () => {
  try {
    await SecureStorage.setKeyPrefix(AUTH_PREFIX);
    await SecureStorage.setDefaultKeychainAccess(
      KeychainAccess.whenUnlockedThisDeviceOnly,
    );
    await SecureStorage.setSynchronize(false);
  } catch (err) {
    initError = err instanceof Error ? err.message : 'initialization failed';
  }
})();

export const secureStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    await secureStorageReady;
    if (initError) return null;
    try {
      return await SecureStorage.getItem(key);
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    await secureStorageReady;
    if (initError) {
      throw new Error(`Auth session could not be persisted: ${initError}`);
    }
    try {
      await SecureStorage.setItem(key, value);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'secure storage write failed';
      throw new Error(`Auth session could not be persisted: ${msg}`);
    }
  },

  async removeItem(key: string): Promise<void> {
    await secureStorageReady;
    if (initError) return;
    try {
      await SecureStorage.removeItem(key);
    } catch {
      try {
        await SecureStorage.clear();
      } catch (fallbackErr) {
        const msg =
          fallbackErr instanceof Error ? fallbackErr.message : 'unknown error';
        throw new Error(`Auth session could not be removed: ${msg}`);
      }
    }
  },
};
