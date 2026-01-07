import { useSettingsStore } from "../stores/Settings";

/**
 * Hook that returns robot network address to connect to.
 */
export function useRobotNetworkAddress() {
  const networkDiscoveryMethod = useSettingsStore.use.networkDiscoveryMethod();
  const networkIpAddress = useSettingsStore.use.networkIpAddress();
  const teamNumber = useSettingsStore.use.teamNumber();

  switch (networkDiscoveryMethod) {
    case "ds":
      // TODO: implement sourcing of network address from the local DS
      return undefined;
    case "team":
      return teamNumber ? `10.${Math.floor(teamNumber / 100)}.${teamNumber % 100}.2` : "10.TE.AM.2";
    case "dns":
      return teamNumber ? `roboRIO-${teamNumber}-FRC.local` : `roboRIO-####-FRC.local`;
    case "localhost":
      return "127.0.0.1";
    case "custom":
      return networkIpAddress;
  }
}

/**
 * Hook that returns effective ping timeout override in milliseconds.
 */
export function useRobotPingTimeoutMilliseconds() {
  const pingTimeoutOverride = useSettingsStore.use.pingTimeoutOverride();
  const pingTimeoutMilliseconds = useSettingsStore.use.pingTimeoutMilliseconds();
  return pingTimeoutOverride ? pingTimeoutMilliseconds : undefined;
}
