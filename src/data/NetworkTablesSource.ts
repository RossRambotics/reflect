import { NT4Client } from "@2702rebels/ntcore";

import { Slot } from "../widgets/slot";

import type { NT4ClientOptions, NT4Subscription, NT4Topic } from "@2702rebels/ntcore";
import type { DataSink } from "@2702rebels/wpidata/sink";
import type { DataSource } from "./DataSource";

export type NetworkTablesSourceOptions = {
  /** Transport client options */
  clientOptions?: NT4ClientOptions;
};

/**
 * NetworkTables live data source.
 */
export class NetworkTablesSource implements DataSource {
  private client: NT4Client | null = null;
  private sink: DataSink;
  private options?: NetworkTablesSourceOptions;
  private subscriptions: Array<NT4Subscription> = [];
  private topics: Array<NT4Topic> = [];

  constructor(sink: DataSink, options?: NetworkTablesSourceOptions) {
    this.sink = sink;
    this.options = options;
  }

  private onConnect = () => {
    // purge any previously preexisting records in the sink on the (re)connect
    this.sink.purge();
    // console.log("Client connected");
  };

  private onDisconnect = () => {
    // console.log("Client disconnected");
  };

  private publish = (topic: string, type: string, value: unknown) => {
    if (this.client) {
      if (!this.client.isTopicPublished(topic)) {
        this.topics.push(this.client.publishTopic(topic, type));
      }

      this.client.setValue(topic, value);
    }
  };

  /** Connects the source to the provided address. */
  public connect(serverAddress: string) {
    // reuse existing client
    if (this.client != null && this.client.serverAddress === serverAddress) {
      this.client.connect();
      return;
    }

    // disconnect current client
    if (this.client != null) {
      this.disconnect();
    }

    // create new client and connect
    this.client = new NT4Client(serverAddress, "Reflect", {
      onConnect: () => {
        this.options?.clientOptions?.onConnect?.();
        this.onConnect();
      },
      onDisconnect: () => {
        this.options?.clientOptions?.onDisconnect?.();
        this.onDisconnect();
      },
      onTopicAnnounced: (topic) => {
        this.options?.clientOptions?.onTopicAnnounced?.(topic);
        this.sink.add("nt", topic.name, topic.type, topic.properties, this.publish);
      },
      onTopicRemoved: (topic) => {
        this.options?.clientOptions?.onTopicRemoved?.(topic);
      },
      onTopicUpdated: (topic) => {
        this.options?.clientOptions?.onTopicUpdated?.(topic);
      },
      onDataReceived: (topic, value, timestamp) => {
        this.options?.clientOptions?.onDataReceived?.(topic, value, timestamp);
        this.sink.enqueue("nt", topic.name, timestamp, value);
      },
      retryPolicy: this.options?.clientOptions?.retryPolicy,
      pingTimeoutMilliseconds: this.options?.clientOptions?.pingTimeoutMilliseconds,
      secure: this.options?.clientOptions?.secure,
    });

    this.client.connect();

    // subscribe to receive the list of all topics
    this.client.subscribe([""], {
      topicsonly: true,
      prefix: true,
      periodic: 0.5,
    });

    // subscribe to receive schema updates
    this.client.subscribe(["/.schema/"], {
      prefix: true,
      periodic: 0.5,
    });
  }

  /** Disconnects the source and disposes the client. */
  public disconnect() {
    this.client?.disconnect();
    this.client = null;
    this.subscriptions = [];
  }

  /** Updates subscriptions. Passing `null` subscribes to everything. */
  public subscribe(slots: Iterable<string> | null) {
    if (this.client == null) {
      return;
    }

    for (const subscription of this.subscriptions) {
      this.client.unsubscribe(subscription);
    }

    this.subscriptions = [];

    // drop previously published topics, they will be published
    // again automatically, when the user interacts with the widget
    // that embeds the corresponding slot
    for (const topic of this.topics) {
      this.client.unpublishTopic(topic.name);
    }

    this.topics = [];

    if (slots == null) {
      // subscribe to receive all values (expensive)
      this.subscriptions.push(
        this.client.subscribe([""], {
          prefix: true,
          periodic: 0.1,
        })
      );
    } else {
      // split slots into two groups: exact and prefixed topics;
      // in theory it may be possible to further optimize things by pruning
      // topics that may fall within a shorter existing prefix, but since
      // we are using composite channels this should not arise in practice
      const prefixed = new Set<string>();
      const exact = new Set<string>();

      for (const slot of slots) {
        const channelRef = Slot.toChannel(slot);
        if (channelRef == null || channelRef.source !== "nt" || channelRef.id == null) {
          continue;
        }

        if (channelRef.composite) {
          prefixed.add(channelRef.id);
        } else {
          exact.add(channelRef.id);
        }
      }

      if (exact.size > 0) {
        this.subscriptions.push(
          this.client.subscribe(Array.from(exact), {
            prefix: false,
            periodic: 0.1,
          })
        );
      }

      if (prefixed.size > 0) {
        this.subscriptions.push(
          this.client.subscribe(Array.from(prefixed), {
            prefix: true,
            periodic: 0.1,
          })
        );
      }
    }
  }

  /** Sets ping timeout. */
  public setPingTimeoutMilliseconds(value: number | undefined) {
    this.options = {
      ...this.options,
      clientOptions: {
        ...this.options?.clientOptions,
        pingTimeoutMilliseconds: value,
      },
    };

    this.client?.setPingTimeoutMilliseconds(value);
  }

  /** Returns current connection state. */
  public get state() {
    return this.client?.state ?? "disconnected";
  }

  /** Returns current network latency in microseconds if known. */
  public get networkLatencyMicroseconds() {
    return this.client?.networkLatencyMicroseconds ?? null;
  }

  /** Returns current server time in microseconds if known. */
  public get serverTimeMicroseconds() {
    return this.client?.serverTimeMicroseconds() ?? null;
  }
}
