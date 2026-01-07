import { EllipsisVertical, Pencil, Trash2, Unplug } from "lucide-react";
import { useCallback } from "react";

import { Button } from "@ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@ui/dropdown-menu";
import { TruncateText } from "@ui/truncate-text";

import { useDataChannel } from "../stores/Data";
import { Slot } from "../widgets/slot";
import { useModal } from "./Modal";
import { TopicIcon } from "./TopicIcon";

import type { RuntimeWidget } from "../stores/Workspace";

const SlotInfo = ({ slot }: { slot: string }) => {
  const channel = useDataChannel(slot);
  return (
    <div className="flex h-7 items-center gap-1.5 overflow-hidden px-1">
      <TopicIcon
        type={channel?.dataType}
        className="h-5 w-5 flex-none rounded-sm bg-secondary p-1"
      />
      <TruncateText
        variant="head"
        className="text-xs">
        {Slot.formatAsRef(slot)}
      </TruncateText>
    </div>
  );
};

export const WidgetEditableAdorner = ({
  widget,
  onWidgetRemove,
  onWidgetUpdateProps,
}: {
  widget: RuntimeWidget;
  onWidgetRemove: (id: string) => void;
  onWidgetUpdateProps: (id: string, props: unknown) => void;
}) => {
  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      onWidgetRemove(widget.id);
    },
    [widget.id, onWidgetRemove]
  );

  const showEditor = useModal(
    "widget-props-editor",
    {
      widgetId: widget.id,
    },
    {
      className: "w-[40rem]",
    }
  );

  return (
    <div className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-accent">
      <div className="pointer-events-auto absolute top-0 right-0 flex rounded-tr-lg rounded-bl-lg bg-accent/80 backdrop-blur-sm">
        {widget.descriptor.props?.menu && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="size-8">
                <EllipsisVertical className="size-4 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            {widget.descriptor.props.menu({
              props: widget.props,
              onPropsChange: (v) => onWidgetUpdateProps(widget.id, v),
            })}
          </DropdownMenu>
        )}
        <Button
          onClick={showEditor}
          variant="ghost"
          className="size-8">
          <Pencil className="size-4 shrink-0" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="size-8">
              <Trash2 className="size-4 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="focus:bg-destructive"
              onClick={handleDelete}>
              Delete
            </DropdownMenuItem>
            <DropdownMenuItem>Cancel</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="absolute right-0 bottom-0 left-0 flex flex-col rounded-t-sm rounded-b-lg bg-accent/80 backdrop-blur-sm">
        {widget.slot ? (
          <SlotInfo slot={widget.slot} />
        ) : (
          <div className="overflow-none flex h-7 items-center gap-1.5 px-2 text-xs">
            <Unplug className="size-4 flex-none" />
            <span className="truncate">No slot bindings</span>
          </div>
        )}
      </div>
    </div>
  );
};
