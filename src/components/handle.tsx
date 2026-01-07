import { GripHorizontal, GripVertical } from "lucide-react";

import { cn } from "../lib/utils";
import { Button } from "./button";

export interface DragHandleProps extends React.ComponentProps<"button"> {
  orientation?: "vertical" | "horizontal";
}

export const DragHandle = ({ orientation = "vertical", className, ...props }: DragHandleProps) => (
  <Button
    variant="ghost"
    className={cn("h-8 w-6 cursor-grab p-0 text-foreground hover:bg-background/40", className)}
    {...props}>
    {orientation === "horizontal" ? <GripHorizontal className="size-4" /> : <GripVertical className="size-4" />}
  </Button>
);

DragHandle.displayName = "DragHandle";
