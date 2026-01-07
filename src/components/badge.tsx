import { cva } from "class-variance-authority";
import { memo } from "react";

import { cn } from "../lib/utils";

import type { VariantProps } from "class-variance-authority";

const variants = cva(
  "inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-semibold transition-colors select-none focus:ring-1 focus:ring-ring focus:ring-offset-0 focus:outline-hidden",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps extends React.ComponentProps<"div">, VariantProps<typeof variants> {}

export const Badge = memo(({ className, variant, ...props }: BadgeProps) => (
  <div
    className={cn(variants({ variant }), className)}
    {...props}
  />
));

Badge.displayName = "Badge";
