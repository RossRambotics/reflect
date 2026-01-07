import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "../lib/utils";

const TooltipContent = ({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) => (
  <TooltipPrimitive.Content
    sideOffset={sideOffset}
    className={cn(
      "z-50 animate-in overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md fade-in-0 select-none zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
      className
    )}
    {...props}
  />
);

TooltipContent.displayName = "TooltipContent";

interface TooltipProps extends TooltipPrimitive.TooltipProps {
  children: React.ReactNode;
  anchor: React.ReactNode;
}

/** Tooltip component, wraps anchor trigger and content. */
export const Tooltip = ({ children, anchor, ...other }: TooltipProps) => (
  <TooltipPrimitive.Provider>
    <TooltipPrimitive.Root {...other}>
      <TooltipPrimitive.TooltipTrigger asChild>{anchor}</TooltipPrimitive.TooltipTrigger>
      <TooltipPrimitive.Portal>{children}</TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  </TooltipPrimitive.Provider>
);

Tooltip.displayName = "Tooltip";

/** Tooltip content. */
Tooltip.Content = TooltipContent;
