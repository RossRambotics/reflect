import { base64decode, base64encode } from "@2702rebels/shared/base64";

import MockEventsData from "../mock/nt4.json";
import { NetworkTablesSource } from "./NetworkTablesSource";

import type { NT4Topic } from "@2702rebels/ntcore";
import type { DataSink } from "@2702rebels/wpidata/sink";
import type { DataSource } from "./DataSource";
import type { NetworkTablesSourceOptions } from "./NetworkTablesSource";

type MockNetworkTablesEventOfState = {
  type: "connected" | "disconnected";
};

type MockNetworkTablesEventOfTopic = {
  type: "topicAnnounced" | "topicRemoved" | "topicUpdated";
  topic: {
    uid: number;
    name: string;
    type: string;
    properties: Record<string, unknown>;
  };
};

type MockNetworkTablesEventOfData = {
  type: "dataReceived";
  topic: MockNetworkTablesEventOfTopic["topic"];
  value: unknown;
  timestamp: number;
};

export type MockNetworkTablesEvent =
  | MockNetworkTablesEventOfState
  | MockNetworkTablesEventOfTopic
  | MockNetworkTablesEventOfData;

function mock(type: MockNetworkTablesEvent["type"], topic?: NT4Topic, value?: unknown, timestamp?: number) {
  return {
    type,
    topic: topic
      ? {
          uid: topic.uid,
          name: topic.name,
          type: topic.type,
          properties: topic.properties,
        }
      : undefined,
    value,
    timestamp,
  } as MockNetworkTablesEvent;
}

/**
 * A wrapper of {@link NetworkTablesSource} that can act as either
 * a mock source or a recorder of NetworkTables events.
 *
 * In the recorder mode captured events are serialized into JSON format
 * for future use in the mock source mode, e.g. when testing offline.
 */
export class MockNetworkTablesSource implements DataSource {
  private sink: DataSink;
  private events: Array<MockNetworkTablesEvent>;
  private source?: NetworkTablesSource;

  constructor(sink: DataSink, options?: NetworkTablesSourceOptions, capture?: boolean) {
    this.sink = sink;

    if (capture) {
      this.events = [];
      this.source = new NetworkTablesSource(sink, {
        ...options,
        clientOptions: {
          onConnect: () => this.events.push(mock("connected")),
          onDisconnect: () => this.events.push(mock("disconnected")),
          onTopicAnnounced: (topic) => this.events.push(mock("topicAnnounced", topic)),
          onTopicRemoved: (topic) => this.events.push(mock("topicRemoved", topic)),
          onTopicUpdated: (topic) => this.events.push(mock("topicUpdated", topic)),
          onDataReceived: (topic, value, timestamp) => this.events.push(mock("dataReceived", topic, value, timestamp)),
        },
      });
    } else {
      this.events = MockEventsData as Array<MockNetworkTablesEvent>;
      this.source = undefined;
    }
  }

  public connect(serverAddress: string) {
    if (this.source) {
      this.source.connect(serverAddress);
    } else {
      for (const e of this.events) {
        switch (e.type) {
          case "topicAnnounced":
            this.sink.add("nt", e.topic.name, e.topic.type, e.topic.properties);
            break;
          case "topicUpdated":
            break;
          case "topicRemoved":
            break;
          case "dataReceived": {
            let value = e.value;

            // decode binary data from base64 representation (see `serialize` below)
            if (
              typeof value === "object" &&
              value &&
              "type" in value &&
              value.type === "base64" &&
              "data" in value &&
              typeof value.data === "string"
            ) {
              value = base64decode(value.data);
            }

            this.sink.enqueue("nt", e.topic.name, e.timestamp, value);
            break;
          }
        }
      }
    }
  }

  public disconnect() {
    if (this.source) {
      this.source.disconnect();
    }
  }

  public subscribe(slots: Iterable<string> | null) {
    if (this.source) {
      this.source.subscribe(slots);
    }
  }

  public setPingTimeoutMilliseconds() {}

  public get state() {
    return this.source?.state ?? "connected";
  }

  public get networkLatencyMicroseconds() {
    return this.source?.networkLatencyMicroseconds ?? null;
  }

  public get serverTimeMicroseconds() {
    return this.source?.serverTimeMicroseconds ?? null;
  }

  public serialize() {
    return JSON.stringify(this.events, (_, value) => {
      if (value instanceof Uint8Array) {
        return {
          data: base64encode(value),
          type: "base64",
        };
      }
      return value;
    });
  }
}
