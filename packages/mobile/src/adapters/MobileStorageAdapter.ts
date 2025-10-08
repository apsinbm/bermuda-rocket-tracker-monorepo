import AsyncStorage from '@react-native-async-storage/async-storage';
import { IStorageAdapter } from '@bermuda/shared';

export class MobileStorageAdapter implements IStorageAdapter {
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('[MobileStorageAdapter] getItem error:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('[MobileStorageAdapter] setItem error:', error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('[MobileStorageAdapter] removeItem error:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('[MobileStorageAdapter] clear error:', error);
      throw error;
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return [...keys]; // Convert readonly to mutable array
    } catch (error) {
      console.error('[MobileStorageAdapter] getAllKeys error:', error);
      return [];
    }
  }

  async multiGet(keys: string[]): Promise<Array<[string, string | null]>> {
    try {
      const results = await AsyncStorage.multiGet(keys);
      return results.map(([key, value]) => [key, value]); // Convert readonly to mutable array
    } catch (error) {
      console.error('[MobileStorageAdapter] multiGet error:', error);
      return [];
    }
  }

  async multiSet(keyValuePairs: Array<[string, string]>): Promise<void> {
    try {
      await AsyncStorage.multiSet(keyValuePairs);
    } catch (error) {
      console.error('[MobileStorageAdapter] multiSet error:', error);
      throw error;
    }
  }
}
