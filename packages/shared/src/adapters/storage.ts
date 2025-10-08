/**
 * Storage Adapter Interface
 *
 * Provides a platform-agnostic interface for key-value storage.
 * - Web: Implemented using localStorage
 * - Mobile: Implemented using AsyncStorage
 *
 * All methods are async to support both synchronous (localStorage) and
 * asynchronous (AsyncStorage) storage mechanisms.
 */

export interface IStorageAdapter {
  /**
   * Get a value from storage
   * @param key Storage key
   * @returns Value or null if not found
   */
  getItem(key: string): Promise<string | null>;

  /**
   * Set a value in storage
   * @param key Storage key
   * @param value Value to store (must be a string)
   */
  setItem(key: string, value: string): Promise<void>;

  /**
   * Remove a value from storage
   * @param key Storage key to remove
   */
  removeItem(key: string): Promise<void>;

  /**
   * Clear all values from storage
   */
  clear(): Promise<void>;

  /**
   * Get all keys in storage
   */
  getAllKeys?(): Promise<string[]>;

  /**
   * Get multiple values at once (optional optimization)
   * @param keys Array of keys to retrieve
   */
  multiGet?(keys: string[]): Promise<Array<[string, string | null]>>;

  /**
   * Set multiple values at once (optional optimization)
   * @param keyValuePairs Array of [key, value] pairs
   */
  multiSet?(keyValuePairs: Array<[string, string]>): Promise<void>;
}

/**
 * Helper functions for common storage operations
 */
export class StorageHelper {
  /**
   * Store a JSON object
   */
  static async setJSON(adapter: IStorageAdapter, key: string, value: any): Promise<void> {
    const jsonString = JSON.stringify(value);
    await adapter.setItem(key, jsonString);
  }

  /**
   * Retrieve a JSON object
   */
  static async getJSON<T = any>(adapter: IStorageAdapter, key: string): Promise<T | null> {
    const jsonString = await adapter.getItem(key);
    if (jsonString === null) {
      return null;
    }
    try {
      return JSON.parse(jsonString) as T;
    } catch (error) {
      console.error(`[StorageHelper] Failed to parse JSON for key "${key}":`, error);
      return null;
    }
  }

  /**
   * Check if a key exists
   */
  static async hasKey(adapter: IStorageAdapter, key: string): Promise<boolean> {
    const value = await adapter.getItem(key);
    return value !== null;
  }

  /**
   * Get value with default fallback
   */
  static async getWithDefault(
    adapter: IStorageAdapter,
    key: string,
    defaultValue: string
  ): Promise<string> {
    const value = await adapter.getItem(key);
    return value !== null ? value : defaultValue;
  }

  /**
   * Get JSON with default fallback
   */
  static async getJSONWithDefault<T>(
    adapter: IStorageAdapter,
    key: string,
    defaultValue: T
  ): Promise<T> {
    const value = await this.getJSON<T>(adapter, key);
    return value !== null ? value : defaultValue;
  }
}
