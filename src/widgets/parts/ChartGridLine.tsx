import { Format } from "@2702rebels/shared/format";

import type { ScaleLinear } from "d3-scale";

export type ChartGridLineProps = {
  value: number;
  scale: ScaleLinear<number, number>;
  width: number;
  maximumFractionDigits?: number;
};

export const ChartGridLine = ({ value, scale, width, maximumFractionDigits }: ChartGridLineProps) => {
  const y = scale(value);
  return (
    <>
      <line
        x1={0}
        x2={4}
        y1={y}
        y2={y}
      />
      <line
        className="opacity-10"
        x1={0}
        x2={width}
        y1={y}
        y2={y}
      />
      <text
        y={y}
        dx={8}
        dy={0.5}
        className="stroke-none font-mono opacity-50"
        textAnchor="start"
        dominantBaseline="middle">
        {Format.default.number(value, {
          maximumFractionDigits,
        })}
      </text>
    </>
  );
};
