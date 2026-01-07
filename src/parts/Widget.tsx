import { useCallback, useState } from "react";

import { useDataChannel } from "../stores/Data";
import { useSettingsStore } from "../stores/Settings";
import { WidgetNoSlotOverlay } from "../widgets/parts/WidgetNoSlotOverlay";
import { useAnimationLoop } from "./AnimationLoop";

import type { DataChannelPublisherOptions, DataChannelRecord } from "@2702rebels/wpidata/abstractions";
import type { RuntimeWidget } from "../stores/Workspace";

type TimestampedData = {
  timestamp: number;
  value: unknown;
};

const noData = {
  timestamp: -1,
  value: undefined,
} satisfies TimestampedData;

const getRecentRecords = (records: ReadonlyArray<DataChannelRecord>, lookback: number) => {
  const result = [];
  let timestamp: number | undefined;

  // TODO: should we use global recent timestamp for consistent lookback behavior across data channels?

  for (let i = records.length - 1; i >= 0; --i) {
    const record = records[i];
    if (record == null) {
      continue;
    }

    if (timestamp == null) {
      timestamp = record.timestamp;
    }

    if (timestamp - record.timestamp > lookback) {
      break;
    }

    result.unshift(record);
  }

  return result;
};

export type WidgetProps = React.ComponentProps<"div"> & {
  widget: RuntimeWidget;
  mode?: "template" | "design";
};

export const Widget = ({ widget, mode, ...props }: WidgetProps) => {
  const { descriptor, slot, lookback, props: widgetProps } = widget;
  const channel = useDataChannel(slot);

  const [data, setData] = useState<TimestampedData>(noData);

  const update = useCallback(() => {
    if (channel?.records && channel.records.length > 0) {
      const records =
        lookback == null || lookback <= 0
          ? [channel.records.at(-1)!]
          : getRecentRecords(channel.records, lookback * 1e6);

      if (records.length === 0) {
        setData(noData);
        return;
      }

      const timestamp = records.at(-1)!.timestamp;
      setData((prevData) => {
        if (prevData.timestamp < timestamp) {
          return {
            timestamp,
            value: descriptor.slot?.transform
              ? descriptor.slot.transform(channel.dataType, records, channel.structuredType, widgetProps)
              : records,
          };
        } else {
          return prevData;
        }
      });
    } else {
      setData(noData);
    }
  }, [channel, descriptor.slot, lookback, widgetProps]);

  const publish = useCallback(
    (value: unknown, path?: ReadonlyArray<string>, options?: DataChannelPublisherOptions) => {
      if (channel && channel.publish) {
        switch (channel.dataType) {
          case "boolean":
            if (typeof value === "boolean") {
              channel.publish(value);
            }
            break;
          case "number":
            if (typeof value === "number") {
              channel.publish(value);
            }
            break;
          case "string":
            if (typeof value === "string") {
              channel.publish(value);
            }
            break;
          case "booleanArray":
            if (Array.isArray(value)) {
              channel.publish(value.map(Boolean));
            }
            break;
          case "numberArray":
            if (Array.isArray(value)) {
              channel.publish(value.map(Number));
            }
            break;
          case "stringArray":
            if (Array.isArray(value)) {
              channel.publish(value.map(String));
            }
            break;
          case "json":
            if (value != null && typeof value === "object") {
              channel.publish(value as Record<string, unknown>);
            }
            break;
          case "binary":
            channel.publish(value);
            break;
          case "composite":
            channel.publish(value, path, options);
            break;
        }
      }
    },
    [channel]
  );

  const animationFps = useSettingsStore.use.animationFps();
  useAnimationLoop(update, animationFps);

  const slotBindingRequired = descriptor.slot?.accepts != null;
  return (
    <div
      {...props}
      className="relative flex h-full w-full flex-col overflow-hidden rounded-lg border border-muted-foreground/20 bg-muted">
      {descriptor.spotlight !== false && <div className="absolute inset-0 bg-spotlight" />}
      {descriptor.component({ mode, slot, data: data.value, props: widgetProps, publish })}
      {!mode && !slot && slotBindingRequired && <WidgetNoSlotOverlay />}
    </div>
  );
};

Widget.displayName = "Widget";
