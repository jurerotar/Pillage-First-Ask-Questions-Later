import { LocalForageKey } from 'interfaces/models/storage/storage';
import localforage from 'localforage';

export class StorageService {
  public static get = async <T>(key: LocalForageKey): Promise<T | null> => {
    return localforage.getItem<T>(key);
  };

  public static set = async <T>(key: LocalForageKey, data: T): Promise<void> => {
    await localforage.setItem<T>(key, data);
  };
}
