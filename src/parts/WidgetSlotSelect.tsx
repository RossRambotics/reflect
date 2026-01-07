import { ChevronsUpDown } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@ui/popover";

import { useDataChannel } from "../stores/Data";
import { Slot } from "../widgets/slot";
import { canAccept } from "../widgets/utils";
import { TopicEntry } from "./TopicEntry";
import { TopicsExplorer } from "./TopicsExplorer";

import type { DataNode } from "../stores/Data";
import type { WidgetDescriptor } from "../widgets/types";

export type WidgetSlotSelectProps = {
  descriptor: WidgetDescriptor;
  value?: string;
  onChange?: (value: string | undefined) => void;
};

export const WidgetSlotSelect = ({ descriptor, value, onChange }: WidgetSlotSelectProps) => {
  const [open, setOpen] = useState(false);

  const channel = useDataChannel(value);
  const filter = useCallback(
    (node: DataNode) => node.channel != null && canAccept(descriptor, node.channel),
    [descriptor]
  );

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between px-3">
          {value && channel ? (
            <TopicEntry
              id={value}
              name={Slot.formatAsRef(value)}
              channel={channel}
              inert
              leaf
            />
          ) : (
            <>Select channel&hellip;</>
          )}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex max-h-[calc(var(--radix-popover-content-available-height)-32px)] w-(--radix-popover-trigger-width) overflow-hidden p-0">
        <TopicsExplorer
          className="bg-secondary/20"
          value={value}
          onChange={onChange}
          filter={filter}
        />
      </PopoverContent>
    </Popover>
  );
};
