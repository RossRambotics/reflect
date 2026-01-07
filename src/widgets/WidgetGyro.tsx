import { range } from "d3-array";
import { scaleLinear } from "d3-scale";
import { useMemo } from "react";
import { z } from "zod";

import { Format } from "@2702rebels/shared/format";
import { DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@ui/dropdown-menu";

import { cn } from "../lib/utils";
import { EditorContainer } from "./parts/EditorContainer";
import { EditorSwitchBlock } from "./parts/EditorSwitchBlock";
import { RobotFront } from "./parts/RobotFront";
import { RobotSide } from "./parts/RobotSide";
import { RobotTop } from "./parts/RobotTop";
import { toDegrees, toRotation3d } from "./utils";

import type { DataChannelRecord, DataType, StructuredTypeDescriptor } from "@2702rebels/wpidata/abstractions";
import type { WidgetComponentProps, WidgetDescriptor, WidgetEditorProps } from "./types";

const ticks = scaleLinear().range([0, 360]).domain([0, 72]);
const tickLabelsPitchRoll = [
  [9, "-45"],
  [18, "0"],
  [27, "+45"],
  [45, "-45"],
  [54, "0"],
  [63, "+45"],
] as const;

const tickLabelsYaw = (clockwise: boolean, symmetric: boolean) =>
  [
    [0, "0"],
    [18, clockwise ? "90" : symmetric ? "-90" : "270"],
    [36, "180"],
    [54, clockwise ? (symmetric ? "-90" : "270") : "90"],
  ] as const;

const radians = (v: number) => (v * Math.PI) / 180;

const propsSchema = z.object({
  variant: z.enum(["yaw", "pitch", "roll"]),
  yawClockwise: z.boolean(),
  yawSymmetric: z.boolean(),
});

type PropsType = z.infer<typeof propsSchema>;

const transform = (
  dataType: DataType,
  records: ReadonlyArray<DataChannelRecord>,
  structuredType: StructuredTypeDescriptor | undefined,
  props: PropsType
) => {
  if (records.length === 0) {
    return undefined;
  }

  const value = records.at(-1)?.value;

  // when single value is provided use it directly
  if (typeof value === "number") {
    return toDegrees(value);
  }

  const r = toRotation3d(value, structuredType);
  switch (props.variant) {
    case "roll":
      return r.x;
    case "pitch":
      return r.y;
    case "yaw":
      return r.z;
  }
};

const title = (variant: PropsType["variant"]) => {
  switch (variant) {
    case "yaw":
      return "Yaw";
    case "pitch":
      return "Pitch";
    case "roll":
      return "Roll";
  }
};

const ComponentCore = ({
  value,
  radius,
  variant,
  yawClockwise,
  yawSymmetric,
  className,
}: {
  value: number;
  radius: number;
  variant: PropsType["variant"];
  yawClockwise: PropsType["yawClockwise"];
  yawSymmetric: PropsType["yawSymmetric"];
  className?: string;
}) => {
  const gTicks = useMemo(
    () => (
      <>
        <g strokeLinecap="round">
          {range(0, 72).map((v) => (
            <line
              key={`_${v}`}
              className={
                variant === "yaw" || (v >= 9 && v <= 27) || (v >= 45 && v <= 63) ? "stroke-sky-200" : "stroke-slate-600"
              }
              x1={0}
              x2={0}
              y1={radius}
              y2={radius - (v % 9 === 0 ? 4 : 2)}
              transform={`rotate(${ticks(v)})`}
            />
          ))}
        </g>
        <g
          className="fill-foreground font-mono"
          fontSize={4}
          textAnchor="middle">
          {(variant === "yaw" ? tickLabelsYaw(yawClockwise, yawSymmetric) : tickLabelsPitchRoll).map(([v, d]) => (
            <text
              key={`_${v}`}
              x={
                0.83 * radius * Math.sin(radians(ticks(v))) +
                (variant === "yaw" && v === (yawClockwise ? 54 : 18) ? (yawClockwise ? 1 : -1) : 0)
              }
              y={-0.83 * radius * Math.cos(radians(ticks(v))) + 1.5}>
              {d}
            </text>
          ))}
        </g>
      </>
    ),
    [radius, variant, yawClockwise, yawSymmetric]
  );

  return (
    <div className={cn("relative aspect-square", className)}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${radius * 2} ${radius * 2}`}
        className="absolute inset-0 stroke-1">
        <g transform={`translate(${radius}, ${radius})`}>
          {gTicks}
          {variant === "yaw" ? (
            <line
              className="stroke-amber-500"
              x1={0}
              x2={0}
              y1={-0.55 * radius}
              y2={-(0.7 + Math.abs(Math.sin(radians(yawClockwise ? value : -value) * 2)) * 0.15) * radius}
              transform={`rotate(${yawClockwise ? value : -value})`}
              strokeLinecap="round"
            />
          ) : (
            <line
              className="stroke-amber-500"
              x1={-0.75 * radius}
              x2={0.75 * radius}
              y1={0}
              y2={0}
              transform={`rotate(${value})`}
              strokeLinecap="round"
            />
          )}
        </g>
      </svg>
      {variant === "yaw" && (
        <RobotTop
          className="absolute inset-0 m-auto size-1/2 fill-gray-800 stroke-gray-100"
          style={{ transform: `rotate(${yawClockwise ? value : -value}deg)` }}
        />
      )}
      {variant === "pitch" && (
        <RobotSide
          className="absolute inset-0 m-auto w-1/2 fill-gray-800 stroke-gray-100"
          style={{ transform: `rotate(${value}deg) translate(0, -50%)` }}
        />
      )}
      {variant === "roll" && (
        <RobotFront
          className="absolute inset-0 m-auto w-1/2 fill-gray-800 stroke-gray-100"
          style={{ transform: `rotate(${value}deg) translate(0, -50%)` }}
        />
      )}
    </div>
  );
};

const Component = ({ data, props }: WidgetComponentProps<PropsType>) => {
  const { variant, yawClockwise, yawSymmetric } = props;
  const value = data as ReturnType<typeof transform>;

  return (
    <div className="h-full w-full px-3 py-2 select-none">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-sm font-bold">{title(variant)}</h1>
        <div className="font-mono text-sm font-bold">
          {Format.default.number(value, {
            maximumFractionDigits: 1,
          })}
          &deg;
        </div>
      </div>
      {value != null && (
        <ComponentCore
          className="h-auto w-full"
          value={value}
          radius={50}
          variant={variant}
          yawClockwise={yawClockwise}
          yawSymmetric={yawSymmetric}
        />
      )}
    </div>
  );
};

const Editor = ({ props, onPropsChange }: WidgetEditorProps<PropsType>) => {
  const componentProps = {
    value: 0,
    radius: 50,
    yawClockwise: props.yawClockwise,
    yawSymmetric: props.yawSymmetric,
  } as const;

  const selectVariant = (variant: PropsType["variant"]) =>
    onPropsChange({
      ...props,
      variant,
    });

  return (
    <EditorContainer>
      <div className="mx-4 grid grid-cols-3 overflow-hidden rounded-md border">
        <button
          className="space-y-3 px-6 pt-4 pb-2 outline-none hover:bg-secondary/40 focus:bg-secondary/40 disabled:bg-secondary/80"
          disabled={props.variant === "yaw"}
          onClick={() => selectVariant("yaw")}>
          <ComponentCore
            variant="yaw"
            {...componentProps}
          />
          <div className="text-sm">Yaw</div>
        </button>
        <button
          className="space-y-3 border-x px-6 pt-4 pb-2 outline-none hover:bg-secondary/40 focus:bg-secondary/40 disabled:bg-secondary/80"
          disabled={props.variant === "pitch"}
          onClick={() => selectVariant("pitch")}>
          <ComponentCore
            variant="pitch"
            {...componentProps}
          />
          <div className="text-sm">Pitch</div>
        </button>
        <button
          className="space-y-3 px-6 pt-4 pb-2 outline-none hover:bg-secondary/40 focus:bg-secondary/40 disabled:bg-secondary/80"
          disabled={props.variant === "roll"}
          onClick={() => selectVariant("roll")}>
          <ComponentCore
            variant="roll"
            {...componentProps}
          />
          <div className="text-sm">Roll</div>
        </button>
      </div>
      {props.variant === "yaw" && (
        <>
          <EditorSwitchBlock
            label={<>Symmetric dial (-90&deg;&hellip;90&deg;)</>}
            checked={props.yawSymmetric}
            onCheckedChange={(v) =>
              onPropsChange({
                ...props,
                yawSymmetric: v,
              })
            }
          />
          <EditorSwitchBlock
            label="Clockwise orientation"
            checked={props.yawClockwise}
            onCheckedChange={(v) =>
              onPropsChange({
                ...props,
                yawClockwise: v,
              })
            }
          />
        </>
      )}
    </EditorContainer>
  );
};

const QuickMenu = ({ props, onPropsChange }: WidgetEditorProps<PropsType>) => {
  return (
    <DropdownMenuContent align="end">
      <DropdownMenuRadioGroup
        value={props.variant}
        onValueChange={(v) =>
          onPropsChange({
            ...props,
            variant: v as PropsType["variant"],
          })
        }>
        <DropdownMenuRadioItem value="yaw">Yaw</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="pitch">Pitch</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="roll">Roll</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  );
};

export const WidgetGyroDescriptor: WidgetDescriptor<PropsType> = {
  type: "gyro",
  name: "Gyro",
  icon: "square-route",
  description: "Robot orientation (yaw), pitch or roll",
  width: 10,
  height: 11,
  constraints: {
    width: { min: 5 },
    height: { min: 6 },
  },
  slot: {
    transform: transform,
    accepts: {
      primitive: ["number", "numberArray"],
      json: ["Pose2d", "Pose3d", "Rotation2d", "Rotation3d", "Quaternion"],
      composite: ["Gyro", "ADIS16448 IMU", "ADIS16470 IMU", "Field2d"],
    },
  },
  component: (props) => <Component {...props} />,
  props: {
    schema: propsSchema,
    defaultValue: {
      variant: "yaw",
      yawClockwise: false,
      yawSymmetric: false,
    },
    editor: (props) => <Editor {...props} />,
    menu: (props) => <QuickMenu {...props} />,
  },
};
