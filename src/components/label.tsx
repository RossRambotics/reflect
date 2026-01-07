import * as LabelPrimitive from "@radix-ui/react-label";
import { cva } from "class-variance-authority";
import { memo } from "react";

import { cn } from "../lib/utils";

import type { VariantProps } from "class-variance-authority";

const variants = cva(
  "text-sm leading-none font-medium select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

export const Label = memo(
  ({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root> & VariantProps<typeof variants>) => (
    <LabelPrimitive.Root
      className={cn(variants(), className)}
      {...props}
    />
  )
);

Label.displayName = "Label";
