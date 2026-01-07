import { getVersion } from "@tauri-apps/api/app";
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect } from "react";

import { Logger } from "@2702rebels/logger";

import { useDashboard } from "../stores/Workspace";

/**
 * Hook that synchronizes window title with the current UI state, e.g. dashboard name.
 */
export function useSyncWindowTitle() {
  const dashboard = useDashboard();
  const name = dashboard?.name;

  useEffect(() => {
    (async () => {
      try {
        if (isTauri()) {
          const version = await getVersion();
          const title = `Reflect ${version}`;
          await getCurrentWindow().setTitle(name ? `${title} — ${name}` : title);
        } else {
          const version = __APP_VERSION__;
          const title = `Reflect ${version}`;
          document.title = name ? `${title} — ${name}` : title;
        }
      } catch (exception) {
        Logger.Default.error("Failed to update window title", exception);
      }
    })();
  }, [name]);
}
