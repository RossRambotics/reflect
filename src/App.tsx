import "@fontsource-variable/figtree";
import "@fontsource-variable/kode-mono";

import { useEffect } from "react";

import { Toaster } from "@ui/sonner";
import { ThemeProvider } from "@ui/theme-provider";

import { Dashboard } from "./parts/Dashboard";
import { ModalManager } from "./parts/ModalManager";
import { NavBar } from "./parts/NavBar";
import { SettingsModal } from "./parts/Settings";
import { WidgetPropsEditorModal } from "./parts/WidgetPropsEditor";
import { dataActions, useBackgroundTasks } from "./stores/Data";
import { useDashboard, useWorkspaceStore } from "./stores/Workspace";

import "./global.css";

import { useIcons } from "./hooks/useIcons";
import { useRobotNetworkAddress, useRobotPingTimeoutMilliseconds } from "./hooks/useRobotSettings";
import { useSyncWindowTitle } from "./hooks/useSyncWindowTitle";

const { connect, disconnect, subscribe, setPingTimeoutMilliseconds } = dataActions;

export const App = () => {
  useIcons();
  useSyncWindowTitle();

  useBackgroundTasks();

  const address = useRobotNetworkAddress();
  useEffect(() => {
    if (address) {
      connect(address);
      subscribe(useWorkspaceStore.getState().slots);
    }
    return () => disconnect();
  }, [address]);

  const pingTimeoutMilliseconds = useRobotPingTimeoutMilliseconds();
  useEffect(() => {
    setPingTimeoutMilliseconds(pingTimeoutMilliseconds);
  }, [pingTimeoutMilliseconds]);

  const slots = useWorkspaceStore((store) => store.slots);
  useEffect(() => {
    subscribe(slots);
  }, [slots]);

  const dashboard = useDashboard();
  return (
    <ThemeProvider defaultTheme="dark">
      <ModalManager
        slot="default"
        side="right"
      />
      <SettingsModal />
      <WidgetPropsEditorModal />
      <div className="min-h-screen w-full bg-background">
        <div className="overflow-none relative z-0 flex h-screen w-full">
          <aside className="w-14 flex-none border-r bg-background">
            <NavBar />
          </aside>
          {dashboard && <Dashboard dashboard={dashboard} />}
        </div>
      </div>
      <Toaster position="bottom-right" />
    </ThemeProvider>
  );
};
