import { memo, useId } from "react";

import { DotPattern, LinePattern } from "./pattern";

export interface BackgroundProps extends React.ComponentProps<"svg"> {
  /** Visual variant. @default `dots` */
  variant?: "dots" | "lines";
  /** Gap between repeating pattern elements. @default 24 */
  gap?: number;
  /** Pattern offset. @default 0 */
  offset?: number;
  /** Pattern weight (dot radius, line stroke). @default 1 */
  weight?: number;
  /** Scale factor. @default 1 */
  scale?: number;
  /** Nudge in X direction @default 0 */
  nudgeX?: number;
  /** Nudge in Y direction. @default 0 */
  nudgeY?: number;
}

/** Pattern background component. */
export const Background = memo(
  ({
    className,
    variant = "dots",
    gap = 24,
    offset = 0,
    weight = 1,
    scale = 1,
    nudgeX = 0,
    nudgeY = 0,
    ...props
  }: BackgroundProps) => {
    const patternId = `bg-${useId()}`;
    const _gap = gap * scale;
    const _offset = offset * scale;
    const _weight = weight * scale;

    return (
      <svg
        className="absolute inset-0 h-full w-full fill-muted"
        {...props}>
        <pattern
          id={patternId}
          x={nudgeX}
          y={nudgeY}
          width={_gap}
          height={_gap}
          patternUnits="userSpaceOnUse"
          patternTransform={`translate(${_offset},${_offset})`}>
          {variant === "dots" ? (
            <DotPattern
              size={_gap}
              weight={_weight}
              className={className}
            />
          ) : (
            <LinePattern
              size={_gap}
              weight={_weight}
              className={className}
            />
          )}
        </pattern>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill={`url(#${patternId})`}
        />
      </svg>
    );
  }
);

Background.displayName = "Background";
