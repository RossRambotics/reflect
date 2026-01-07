import { load } from "@tauri-apps/plugin-store";

import type { Store } from "@tauri-apps/plugin-store";
import type { PersistStorage, StorageValue } from "zustand/middleware";

class TauriStorage<S> implements PersistStorage<S> {
  private store: Promise<Store>;
  private persist: (store: Store) => void;

  constructor(name: string) {
    this.store = load(name, {
      defaults: {},
      autoSave: 5000, // auto-save with debouncing of 5s
    });

    this.persist = (_) => _.save();
  }

  /** Gets the item value. */
  public getItem = async (name: string) => {
    const store = await this.store;
    return (await store.get<StorageValue<S>>(name)) ?? null;
  };

  /** Sets the item value. */
  public setItem = async (name: string, value: StorageValue<S>) => {
    const store = await this.store;
    await store.set(name, value);
    this.persist(store);
  };

  /** Removes the item. */
  public removeItem = async (name: string) => {
    const store = await this.store;
    await store.delete(name);
    this.persist(store);
  };
}

/**
 * This middleware provides persistence mechanism for a `zustand` store based on
 * [tauri-store-plugin](https://tauri.app/plugin/store/).
 */
export function createTauriStorage<S>(name: string): PersistStorage<S> | undefined {
  return new TauriStorage(name);
}
