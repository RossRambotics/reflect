import { cn } from "../lib/utils";

export interface LinePatternProps extends React.ComponentProps<"path"> {
  size: number;
  weight?: number;
}

/** Line pattern that can be used to create "infinite" backgrounds. */
export const LinePattern = ({ className, size, weight, ...props }: LinePatternProps) => (
  <path
    d={`M${size / 2} 0 V${size} M0 ${size / 2} H${size}`}
    strokeWidth={weight}
    className={cn("fill-none stroke-muted", className)}
    {...props}
  />
);

LinePattern.displayName = "LinePattern";

export interface DotPatternProps extends React.ComponentProps<"circle"> {
  size: number;
  weight?: number;
}

/** Dot pattern that can be used to create "infinite" backgrounds. */
export const DotPattern = ({ className, size, weight, ...props }: DotPatternProps) => (
  <circle
    cx={size / 2}
    cy={size / 2}
    r={weight}
    className={cn("fill-muted stroke-none", className)}
    {...props}
  />
);

DotPattern.displayName = "DotPattern";
