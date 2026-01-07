import * as SwitchPrimitives from "@radix-ui/react-switch";
import { memo } from "react";

import { cn } from "../lib/utils";

export const Toggle = memo(({ className, ...props }: React.ComponentProps<typeof SwitchPrimitives.Root>) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-16 w-32 shrink-0 cursor-pointer items-center rounded-md border-4 border-transparent transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 focus-visible:ring-offset-background focus-visible:outline-hidden disabled:cursor-not-allowed data-[state=checked]:bg-green-500/60 data-[state=unchecked]:bg-background/50",
      className
    )}
    {...props}>
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none grid size-14 place-items-center rounded bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-16 data-[state=unchecked]:translate-x-0"
      )}>
      {props.checked ? "ON" : "OFF"}
    </SwitchPrimitives.Thumb>
  </SwitchPrimitives.Root>
));

Toggle.displayName = "Toggle";
