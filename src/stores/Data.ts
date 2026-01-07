import { useEffect } from "react";
import { create } from "zustand";

import { binarySearch } from "@2702rebels/shared/binarySearch";
import { Collator } from "@2702rebels/shared/collator";
import { DataSink } from "@2702rebels/wpidata/sink";

import { MockNetworkTablesSource } from "../data/MockNetworkTablesSource";
import { NetworkTablesSource } from "../data/NetworkTablesSource";
import { Slot } from "../widgets/slot";

import type { DataChannel } from "@2702rebels/wpidata/abstractions";
import type { DataSource } from "../data/DataSource";

/**
 * Separates path into tokens, normalize individual tokens by
 * trimming ornamental whitespace and drop empty ones.
 **/
function splitPath(path: string) {
  return path
    .split(/\/|:/)
    .map((_) => _.trim())
    .filter((_) => _.length > 0);
}

/**
 * Returns a node corresponding to the `path`, creating one if necessary.
 *
 * @param root tree root
 * @param path slash or colon separated path
 * @returns A {@link DataNode} instance or `null` if the path is trivially empty.
 */
function getNode(root: DataNode, path: string, collator?: Collator) {
  collator ??= Collator.default;

  const tokens = splitPath(path);
  if (tokens.length === 0) {
    return null;
  }

  let current = root;
  for (const token of tokens) {
    const index = binarySearch(current.nodes, token, collator.string, (_) => _.name);

    let node: DataNode;
    if (index < 0) {
      node = {
        id: `${current.id}/${token}`,
        name: token,
        nodes: [],
      };
      current.nodes.splice(~index, 0, node);
    } else {
      node = current.nodes[index]!;
    }

    current = node;
  }

  return current;
}

/**
 * Removes a node corresponding to the `path`.
 *
 * @param root tree root
 * @param path slash or colon separated path
 */
function removeNode(root: DataNode, path: string, collator?: Collator) {
  collator ??= Collator.default;

  const tokens = splitPath(path);
  if (tokens.length === 0) {
    return null;
  }

  let parent = root;
  let index = -1;
  let current = root;
  for (const token of tokens) {
    index = binarySearch(current.nodes, token, collator.string, (_) => _.name);

    if (index < 0) {
      return false;
    }

    parent = current;
    current = current.nodes[index]!;
  }

  parent.nodes.splice(index, 1);
  current.channel = undefined;
  return true;
}

export type DataSupplier = {
  /** Supplier identifier, e.g. `nt` or `wpilog` */
  readonly id: string;
  /** Virtual root node */
  readonly root: DataNode;
  /** State revision */
  revision: 0;
};

export type DataNode = {
  /** Node identifier */
  id: string;
  /** Display name */
  readonly name: string;
  /** Nested nodes */
  readonly nodes: Array<DataNode>;
  /** Data channel mounted at the node */
  channel?: DataChannel;
};

type DataStore = {
  /** Connection status */
  status: "disconnected" | "connecting" | "connected";
  /** Data source (NetworkTables) */
  source: DataSource;
  /** Data sink */
  sink: DataSink;
  /** Data channels organized into a forest */
  suppliers: Array<DataSupplier>;
  /** Robot time (in microseconds) */
  robotTime: number;
};

type DataStoreActions = {
  /** Attempts to establish live connection to the robot */
  connect: (serverAddress: string) => void;
  /** Disconnects and pauses connection attempts */
  disconnect: () => void;
  /** Updates channel subscriptions. Passing `null` subscribes to everything. */
  subscribe: (slots: Iterable<string> | null) => void;
  /** Sets ping timeout override. */
  setPingTimeoutMilliseconds: (value: number | undefined) => void;
  /** Invoked periodically on the background thread */
  periodic: () => void;
};

const useDataStore = create<DataStore & DataStoreActions>((set, get) => {
  const sink = new DataSink({
    retention: {
      maxSize: 3000,
      maxTimeSeconds: 60,
    },
    onDataChannelAdded: (channel) =>
      set((state) => {
        const suppliers = state.suppliers;

        let supplier = suppliers.find((_) => _.id === channel.source);
        if (supplier == null) {
          supplier = {
            id: channel.source,
            root: {
              id: channel.source,
              name: "",
              nodes: [],
            },
            revision: 0,
          };
          suppliers.push(supplier);
        }

        const node = getNode(supplier.root, channel.id);
        if (node != null) {
          node.id = `${channel.source}:${channel.id}`; // rewrite id to match the channel
          node.channel = channel;
          supplier.revision++;
        }

        return { suppliers: [...suppliers] };
      }),
    onDataChannelRemoved: (channel: DataChannel) =>
      set((state) => {
        const suppliers = state.suppliers;

        const supplier = suppliers.find((_) => _.id === channel.source);
        if (supplier != null) {
          removeNode(supplier.root, channel.id);
          supplier.revision++;
        }

        return { suppliers: [...suppliers] };
      }),
  });

  // replace `NetworkTableSource` with `MockNetworkTablesSource` if you want
  // to test with mock data without a live connection to the robot;
  //
  // you can also supply `capture` argument like so
  // `new MockNetworkTablesSource(this.sink, true)`
  // to turn the source into an events recorder once a live connection has
  // been established; use this to capture some events for offline testing,
  // call `serialize` function to extract the captured data
  const nt = import.meta.env.VITE_MOCK_MODE ? new MockNetworkTablesSource(sink) : new NetworkTablesSource(sink);

  return {
    status: "disconnected",
    sink,
    source: nt,
    suppliers: [],
    robotTime: 0,
    connect: (serverAddress) => get().source.connect(serverAddress),
    disconnect: () => get().source.disconnect(),
    subscribe: (slots) => get().source.subscribe(slots),
    setPingTimeoutMilliseconds: (value) => get().source.setPingTimeoutMilliseconds(value),
    periodic: () => {
      const { source } = get();
      set({
        status: source.state,
        robotTime: source.serverTimeMicroseconds ?? 0,
      });
    },
  };
});

/** Periodic background task */
const periodic = () => {
  useDataStore.getState().periodic();
};

/** Cleanup background task */
const cleanup = () => {
  const { sink, robotTime } = useDataStore.getState();
  sink.enforceRetention(robotTime);
};

/**
 * Hook that schedules periodic execution of background tasks.
 */
export function useBackgroundTasks(options?: {
  /** Interval in milliseconds between default periodic callbacks */
  periodicInterval?: number;
  /** Interval in milliseconds between periodic (retention) cleanup callbacks */
  cleanupInterval?: number;
}) {
  const periodicInterval = options?.periodicInterval ?? 1000;
  const cleanupInterval = options?.cleanupInterval ?? 30000;

  useEffect(() => {
    const periodicId = setInterval(periodic, periodicInterval);
    const cleanupId = setInterval(cleanup, cleanupInterval);
    return () => {
      clearInterval(periodicId);
      clearInterval(cleanupId);
    };
  }, [periodicInterval, cleanupInterval]);
}

const selectActions = (state: DataStoreActions) => ({
  connect: state.connect,
  disconnect: state.disconnect,
  subscribe: state.subscribe,
  setPingTimeoutMilliseconds: state.setPingTimeoutMilliseconds,
});

/**
 * Data API (actions).
 */
export const dataActions = selectActions(useDataStore.getState());

/**
 * Hook that returns connection status.
 */
export function useConnectionStatus() {
  return useDataStore((state) => state.status);
}

/**
 * Hook that returns available suppliers.
 */
export function useSuppliers() {
  return useDataStore((state) => state.suppliers);
}

/**
 * Hook that returns the named channel.
 *
 * This hook creates store subscription that refreshes the caller component
 * should the underlying channel definition change.
 */
export function useDataChannel(slot: string | undefined) {
  return useDataStore((state) => {
    if (slot) {
      const channelRef = Slot.toChannel(slot);
      return channelRef ? state.sink.get(channelRef.source, channelRef.id) : undefined;
    }
    return undefined;
  });
}
