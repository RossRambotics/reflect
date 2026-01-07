import { Square, SquareCheck } from "lucide-react";
import { useCallback, useState } from "react";

import { Badge } from "@ui/badge";
import { Tooltip } from "@ui/tooltip";

import { useSettingsStore } from "../stores/Settings";
import { useAnimationLoop } from "./AnimationLoop";
import { TopicIcon } from "./TopicIcon";

import type { DataChannel, DataTypeImpl, StructuredTypeDescriptor } from "@2702rebels/wpidata/abstractions";

/**
 * Returns display-friendly name of the protobuf serialized types.
 * Unwraps names like `wpi.proto.ProtobufPose3d` to `Pose3d`
 */
const formatTypeName = (type: StructuredTypeDescriptor) =>
  type.name.startsWith("wpi.proto.Protobuf") ? type.name.slice(18) : type.isArray ? `${type.name}[]` : type.name;

const getStructuredType = (channel: DataChannel | undefined) => {
  if (channel?.structuredType) {
    return (
      <Badge
        variant="outline"
        className="ml-auto">
        {formatTypeName(channel.structuredType)}
      </Badge>
    );
  }

  return null;
};

const TopicValue = ({ channel }: Pick<TopicEntryProps, "channel">) => {
  const [value, setValue] = useState<DataTypeImpl | undefined>(undefined);
  const update = useCallback(() => setValue(channel?.records?.at(-1)?.value), [channel]);

  const animationFps = useSettingsStore.use.animationFps();
  useAnimationLoop(update, animationFps);

  if (value == null) {
    return getStructuredType(channel);
  }

  // boolean indicator
  if (typeof value === "boolean") {
    return value ? (
      <SquareCheck className="ml-auto size-4 fill-green-500/60 text-accent-foreground" />
    ) : (
      <Square className="ml-auto size-4 fill-destructive/60 text-accent-foreground" />
    );
  }

  // primitive value
  if (typeof value !== "object") {
    return <span className="ml-auto truncate font-mono text-xs">{value.toLocaleString()}</span>;
  }

  // TODO: currently used for debugging (may want to rethink this approach)
  return (
    <Tooltip anchor={getStructuredType(channel)}>
      <Tooltip.Content side="right">
        <pre className="text-xs">{JSON.stringify(value, undefined, 2)}</pre>
      </Tooltip.Content>
    </Tooltip>
  );
};

export type TopicEntryProps = {
  id: string;
  name: string;
  channel?: DataChannel;
  leaf?: boolean;
  inert?: boolean;
};

export const TopicEntry = ({ name, channel, leaf, inert }: TopicEntryProps) => {
  const hasIcon = channel != null || leaf;
  return (
    <div className="flex grow flex-row items-center gap-2 overflow-hidden select-none">
      {hasIcon && (
        <TopicIcon
          type={channel?.dataType}
          className="size-4 flex-none text-accent-foreground/50"
        />
      )}
      <span className="my-px truncate text-sm">{name}</span>
      {!inert && <TopicValue channel={channel} />}
    </div>
  );
};
