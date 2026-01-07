import { Icon } from "@ui/icon";

import type { WidgetDescriptor } from "../widgets/types";

export type WidgetGalleryItemProps = { descriptor: WidgetDescriptor };

export const WidgetGalleryItem = ({ descriptor }: WidgetGalleryItemProps) => {
  return (
    <div className="flex flex-auto items-center gap-3 rounded-md border border-muted-foreground/20 bg-muted p-2">
      {descriptor.icon && (
        <Icon
          name={`i:${descriptor.icon}`}
          size="default"
          className="text-foreground/80"
        />
      )}
      <div className="flex flex-col gap-1">
        <div className="text-sm font-semibold select-none">{descriptor.name}</div>
        <div className="text-xs text-muted-foreground select-none">{descriptor.description}</div>
      </div>
    </div>
  );
};
