import { Unplug } from "lucide-react";
import { useRef } from "react";

import { useElementSize } from "../../hooks/useElementSize";

export type WidgetNoSlotOverlayProps = {
  compact?: boolean;
};

export const WidgetNoSlotOverlay = ({ compact }: WidgetNoSlotOverlayProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { width } = useElementSize(ref);
  return (
    <div
      ref={ref}
      className="absolute inset-0">
      <div className="grid h-full w-full place-items-center overflow-hidden rounded-lg bg-secondary/60 p-4 backdrop-blur-sm select-none">
        <div className="flex items-center gap-2">
          <Unplug className="flex-none" />
          {!compact && width >= 150 && <span className="truncate">Not bound</span>}
        </div>
      </div>
    </div>
  );
};
