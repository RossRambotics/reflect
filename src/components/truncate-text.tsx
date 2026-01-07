import { memo } from "react";

import { cn } from "../lib/utils";

export interface TruncateTextProps extends React.ComponentProps<"div"> {
  variant?: "head" | "tail";
}

/** A truncated text with head or tail truncation. */
export const TruncateText = memo(({ className, variant = "tail", children, ...props }: TruncateTextProps) => (
  <div
    className={cn("truncate", variant === "head" && "[direction:rtl]", className)}
    {...props}>
    {variant === "head" ? <bdi>{children}</bdi> : <>{children}</>}
  </div>
));

TruncateText.displayName = "TruncateText";
