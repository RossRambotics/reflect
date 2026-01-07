export interface DataSource {
  /** Connects the source to the provided address. */
  connect: (serverAddress: string) => void;
  /** Disconnects the source. */
  disconnect: () => void;
  /** Updates subscriptions. Passing `null` subscribes to everything. */
  subscribe: (slots: Iterable<string> | null) => void;
  /** Sets ping timeout. */
  setPingTimeoutMilliseconds: (value: number | undefined) => void;
  /** Returns current connection state. */
  readonly state: "disconnected" | "connecting" | "connected";
  /** Returns current network latency in microseconds if known. */
  readonly networkLatencyMicroseconds: number | null;
  /** Returns current server time in microseconds if known. */
  readonly serverTimeMicroseconds: number | null;
}
