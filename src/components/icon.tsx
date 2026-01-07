import { cva } from "class-variance-authority";
import { memo } from "react";

import { cn } from "../lib/utils";

import type { VariantProps } from "class-variance-authority";

const variants = cva(
  "block flex-none fill-current stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round] [stroke-miterlimit:10]",
  {
    variants: {
      variant: {
        default: "text-primary-foreground",
        accent: "text-accent-foreground",
      },
      size: {
        default: "size-8",
        sm: "size-6",
        lg: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface IconProps extends React.ComponentProps<"svg">, VariantProps<typeof variants> {
  /**
   * Name of the icon referencing SVG symbol with the same identifier
   * in the document context.
   */
  name?: string;
}

/** An icon via named SVG symbols, supports sizes, tones. */
export const Icon = memo(({ name, className, variant, size, ...props }: IconProps) => {
  return name != null ? (
    <svg
      {...props}
      role="img"
      className={cn(variants({ variant, size }), className)}>
      <use href={`#${name}`} />
    </svg>
  ) : null;
});

Icon.displayName = "Icon";
