import { IStorageAdapter } from '@bermuda/shared';

/**
 * Web Storage Adapter
 *
 * Implements IStorageAdapter using browser localStorage.
 * All methods are async to match the interface, even though localStorage is synchronous.
 */
export class WebStorageAdapter implements IStorageAdapter {
  async getItem(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('[WebStorageAdapter] getItem error:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('[WebStorageAdapter] setItem error:', error);
      // Check if quota exceeded
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('[WebStorageAdapter] Storage quota exceeded');
        // Optionally: implement cleanup strategy here
      }
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('[WebStorageAdapter] removeItem error:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('[WebStorageAdapter] clear error:', error);
      throw error;
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error('[WebStorageAdapter] getAllKeys error:', error);
      return [];
    }
  }

  async multiGet(keys: string[]): Promise<Array<[string, string | null]>> {
    try {
      return keys.map(key => [key, localStorage.getItem(key)]);
    } catch (error) {
      console.error('[WebStorageAdapter] multiGet error:', error);
      return keys.map(key => [key, null]);
    }
  }

  async multiSet(keyValuePairs: Array<[string, string]>): Promise<void> {
    try {
      keyValuePairs.forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
    } catch (error) {
      console.error('[WebStorageAdapter] multiSet error:', error);
      throw error;
    }
  }
}
