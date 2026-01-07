import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { Logger } from "@2702rebels/logger";

import { createPersistentStorage } from "../lib/storage";
import { createSelectors } from "./helpers";

import type { Optional } from "@2702rebels/shared/utility";

export type SettingsStore = {
  /** Hydration state */
  hasHydrated: boolean;
  /** Team number */
  teamNumber: number | null;
  /** Network discovery method */
  networkDiscoveryMethod: "ds" | "team" | "localhost" | "dns" | "custom";
  /** Network IP address for `custom` network discovery method */
  networkIpAddress: string | null;
  /** Ping timeout override */
  pingTimeoutOverride: boolean;
  /** Ping timeout in milliseconds */
  pingTimeoutMilliseconds: number;
  /** LiveWindow section visibility in topics explorer */
  topicsVisibleLW: boolean;
  /** Shuffleboard section visibility in topics explorer */
  topicsVisibleSB: boolean;
  /** Metadata visibility in topics explorer */
  topicsVisibleMetadata: boolean;
  /** Grid grain size */
  grain: number;
  /** Snap panning operation to grid grain */
  panSnapToGrid: boolean;
  /** Animation frames-per-second */
  animationFps: number;
};

export type SettingsStoreActions = {
  /** Sets hydration state to `true` */
  markHydrated: () => void;
};

const defaultState: SettingsStore = {
  hasHydrated: false,
  teamNumber: null,
  networkDiscoveryMethod: "localhost",
  networkIpAddress: null,
  pingTimeoutOverride: false,
  pingTimeoutMilliseconds: 1000,
  topicsVisibleLW: false,
  topicsVisibleSB: false,
  topicsVisibleMetadata: false,
  grain: 24,
  panSnapToGrid: true,
  animationFps: 10,
};

/** Converts runtime state to persistent */
function persistState(state: SettingsStore) {
  const _state: Optional<SettingsStore, "hasHydrated"> = { ...state };
  delete _state.hasHydrated;
  return _state;
}

export const useSettingsStore = createSelectors(
  create(
    persist(
      immer<SettingsStore & SettingsStoreActions>((set) => ({
        ...defaultState,

        markHydrated: () =>
          set({
            hasHydrated: true,
          }),
      })),
      {
        name: "settings",
        storage: createPersistentStorage(".settings.json"),
        partialize: persistState,
        onRehydrateStorage: (state) => (_, error) => {
          if (error) {
            Logger.Default.error(`Failed to rehydrate settings from the persistent storage [${error}]`);
          } else {
            state.markHydrated();
          }
        },
        // must be bumped on non-backward-compatible schema changes and
        // appropriate migration strategy implemented via `migrate` option
        // https://zustand.docs.pmnd.rs/integrations/persisting-store-data#migrate
        version: 0,
      }
    )
  )
);
