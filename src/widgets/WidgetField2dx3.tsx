import { useCallback, useRef, useState } from "react";
import { z } from "zod";

import { DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@ui/dropdown-menu";
import { Input } from "@ui/input";
import { InputNumber } from "@ui/input-number";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui/select";

import field2024choreo from "../assets/field-2024-choreo.svg";
import field2024 from "../assets/field-2024.webp";
import field2025 from "../assets/field-2025.webp";
import field2026empty from "../assets/field-2026-empty.webp";
import field2026 from "../assets/field-2026.webp";
import { useElementSize } from "../hooks/useElementSize";
import { cn } from "../lib/utils";
import { useAnimationLoop } from "../parts/AnimationLoop";
import { useDataChannel } from "../stores/Data";
import { useSettingsStore } from "../stores/Settings";
import { EditorBlock } from "./parts/EditorBlock";
import { EditorContainer } from "./parts/EditorContainer";
import { RobotTop } from "./parts/RobotTop";
import { toPose2d } from "./utils";

import type { DataChannelRecord, DataType, StructuredTypeDescriptor } from "@2702rebels/wpidata/abstractions";
import type { WidgetComponentProps, WidgetDescriptor, WidgetEditorProps } from "./types";

const propsSchema = z.object({
  aimingSpotPath: z.string(),
  targetPath: z.string(),
  style: z.enum(["default", "2026", "2026-empty", "2025", "2024", "2024-choreo"]),
  orientation: z.enum(["0", "90", "180", "270"]),
  bumperSizeInch: z.number().positive().lte(35),
});

type PropsType = z.infer<typeof propsSchema>;

type FieldSpec = {
  url: string;
  w: number;
  h: number;
  image: {
    bbox: readonly [number, number];
    rect: readonly [number, number, number, number, number, number];
    aspect: number;
  };
  translate: {
    x: number;
    y: number;
  };
};

const createField = (
  url: string,
  w: number,
  h: number,
  bbox: readonly [number, number],
  rect: readonly [number, number, number, number]
) => ({
  url,
  image: {
    bbox,
    rect: [rect[2] - rect[0] + 1, rect[3] - rect[1] + 1, ...rect] as const,
    aspect: bbox[0] / bbox[1],
  },
  w,
  h,
  translate: {
    x: (rect[2] - rect[0] + 1) / w,
    y: (rect[3] - rect[1] + 1) / h,
  },
});

const ZERO = [0, 0, 0] as const;
const FIELDS: Record<Exclude<PropsType["style"], "default">, FieldSpec> = {
  "2026": createField(field2026, 16.541, 8.0692, [4196, 2035], [256, 118, 3939, 1914]),
  "2026-empty": createField(field2026empty, 16.541, 8.0692, [4196, 2035], [256, 118, 3939, 1914]),
  "2025": createField(field2025, 17.5482, 8.0519, [3172, 1527], [120, 91, 3052, 1438]),
  "2024": createField(field2024, 16.54175, 8.21055, [3112, 1556], [150, 79, 2961, 1476]),
  "2024-choreo": createField(field2024choreo, 16.54175, 8.21055, [2812, 1398], [0, 0, 2811, 1397]),
} as const;

const getField = (style: PropsType["style"]) => FIELDS[style === "default" ? "2026-empty" : style];

/**
 * Converts robot position (in meters) to field offsets in pixels
 *
 * Robot frame of reference is (0, 0) at (left, bottom) with +Y -> up, +X -> left
 * Field frame of reference is (0, 0) at (left, top) with +Y -> down, +X -> left
 */
const toField = (x: number, y: number, theta: number, field: FieldSpec, orientation: PropsType["orientation"]) => {
  const [rw, rh, rx, ry] = field.image.rect;
  const { x: tx, y: ty } = field.translate;
  const fx = tx * x;
  const fy = ty * y;

  switch (orientation) {
    case "0":
      return [rx + fx, ry + rh - fy, 90 - theta] as const;
    case "180":
      return [rx + rw - fx, ry + fy, -90 - theta] as const;
    case "90":
      return [ry + fy, rx + fx, 180 - theta] as const;
    case "270":
      return [ry + rh - fy, rx + rw - fx, -theta] as const;
  }
};

const transform = (
  dataType: DataType,
  records: ReadonlyArray<DataChannelRecord>,
  structuredType: StructuredTypeDescriptor | undefined
) => {
  if (records.length === 0) {
    return undefined;
  }
  return {
    pose: toPose2d(records.at(-1)?.value, structuredType),
  };
};

/** Normalizes a slot string: lowercases the source prefix and returns undefined for empty strings. */
const normalizeSlot = (slot: string): string | undefined => {
  if (!slot) return undefined;
  const idx = slot.indexOf(":");
  if (idx > 0) {
    return slot.substring(0, idx).toLowerCase() + slot.substring(idx);
  }
  return slot;
};

const Component = ({ data, props }: WidgetComponentProps<PropsType>) => {
  const field = getField(props.style);

  const fieldRef = useRef<HTMLDivElement>(null);
  const { width, height } = useElementSize(fieldRef);
  const initialized = width > 0 && height > 0;

  // Robot pose from primary slot (same as Field2D)
  const d = data as ReturnType<typeof transform>;

  // Aiming spot and target from user-configured NT paths
  // Normalize source prefix to lowercase (user may type "NT:" but internal format is "nt:")
  const ch2 = useDataChannel(normalizeSlot(props.aimingSpotPath));
  const ch3 = useDataChannel(normalizeSlot(props.targetPath));

  const [pose2, setPose2] = useState<ReturnType<typeof toPose2d> | null>(null);
  const [pose3, setPose3] = useState<ReturnType<typeof toPose2d> | null>(null);

  const animationFps = useSettingsStore.use.animationFps();

  const updatePoses = useCallback(() => {
    setPose2(ch2?.records?.length ? toPose2d(ch2.records.at(-1)?.value, ch2.structuredType) : null);
    setPose3(ch3?.records?.length ? toPose2d(ch3.records.at(-1)?.value, ch3.structuredType) : null);
  }, [ch2, ch3]);

  useAnimationLoop(updatePoses, animationFps);

  const [rx1, ry1, rtheta1] = d != null ? toField(d.pose.x, d.pose.y, d.pose.theta, field, props.orientation) : ZERO;
  const [rx2, ry2, rtheta2] = pose2 != null ? toField(pose2.x, pose2.y, pose2.theta, field, props.orientation) : ZERO;
  const [rx3, ry3, rtheta3] = pose3 != null ? toField(pose3.x, pose3.y, pose3.theta, field, props.orientation) : ZERO;

  const portrait = props.orientation === "90" || props.orientation === "270";
  const aspectRatio = portrait ? 1 / field.image.aspect : field.image.aspect;

  // scale factor
  const sx = (portrait ? height : width) / field.image.bbox[0];
  const sy = (portrait ? width : height) / field.image.bbox[1];

  // robot bumper size in pixels
  const rb = props.bumperSizeInch * 0.0254;
  const robotW = field.translate.x * rb * sx;
  const robotH = field.translate.y * rb * sy;

  return (
    <div className="grid h-full w-full place-items-center select-none">
      <div
        ref={fieldRef}
        className="relative max-h-full max-w-full overflow-hidden"
        style={{ aspectRatio }}>
        {field.url && (
          <img
            style={portrait ? { minWidth: height } : { minWidth: width }}
            className={cn(
              "block",
              props.orientation === "90" && "origin-bottom-left -translate-y-full rotate-90",
              props.orientation === "270" && "origin-top-right -translate-x-full -rotate-90",
              props.orientation === "180" && "rotate-180"
            )}
            src={field.url}
            alt="Field"
          />
        )}
        {initialized && (
          <>
            <canvas className={cn("absolute inset-0")} width={width} height={height} />

            {/* Pose 2: Aiming spot */}
            {pose2 != null && (
              <div
                className="absolute"
                style={{
                  left: -robotW / 2,
                  top: -robotH / 2,
                  width: robotW,
                  height: robotH,
                  transform: `translate(${rx2 * sx}px, ${ry2 * sy}px)`,
                }}>
                <RobotTop
                  bumperColor="#0000ff"
                  className="fill-gray-800/80 stroke-gray-100/80"
                  style={{ transform: `rotate(${rtheta2}deg)` }}
                />
              </div>
            )}

            {/* Pose 3: Autodrive target */}
            {pose3 != null && (
              <div
                className="absolute"
                style={{
                  left: -robotW / 2,
                  top: -robotH / 2,
                  width: robotW,
                  height: robotH,
                  transform: `translate(${rx3 * sx}px, ${ry3 * sy}px)`,
                }}>
                <RobotTop
                  bumperColor="#00aa00"
                  className="fill-gray-800/80 stroke-gray-100/80"
                  style={{ transform: `rotate(${rtheta3}deg)` }}
                />
              </div>
            )}

            {/* Pose 1: Robot — RobotTop icon (from primary slot) */}
            {d != null && (
              <div
                className="absolute"
                style={{
                  left: -robotW / 2,
                  top: -robotH / 2,
                  width: robotW,
                  height: robotH,
                  transform: `translate(${rx1 * sx}px, ${ry1 * sy}px)`,
                }}>
                <RobotTop
                  bumperColor="#a1000f"
                  className="fill-gray-800/80 stroke-gray-100/80"
                  style={{ transform: `rotate(${rtheta1}deg)` }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const Editor = ({ props, onPropsChange }: WidgetEditorProps<PropsType>) => {
  return (
    <EditorContainer>
      <EditorBlock label="Aiming spot path">
        <Input
          value={props.aimingSpotPath}
          placeholder="e.g. nt:/SmartDashboard/Pose or NT:/SmartDashboard/Pose"
          onChange={(e) => onPropsChange({ ...props, aimingSpotPath: e.target.value })}
        />
      </EditorBlock>
      <EditorBlock label="Autodrive target path">
        <Input
          value={props.targetPath}
          placeholder="e.g. nt:/SmartDashboard/Pose or NT:/SmartDashboard/Pose"
          onChange={(e) => onPropsChange({ ...props, targetPath: e.target.value })}
        />
      </EditorBlock>
      <EditorBlock label="Style">
        <Select
          value={props.style}
          onValueChange={(v) => onPropsChange({ ...props, style: v as PropsType["style"] })}>
          <SelectTrigger>
            <SelectValue placeholder="Select field style" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="2026-empty">2026 (No Fuel)</SelectItem>
            <SelectItem value="2026">2026 (With Fuel)</SelectItem>
            <SelectItem value="2025">2025 (Default)</SelectItem>
            <SelectItem value="2024">2024 (Default)</SelectItem>
            <SelectItem value="2024-choreo">2024 (Choreo version)</SelectItem>
          </SelectContent>
        </Select>
      </EditorBlock>
      <EditorBlock label="Orientation">
        <Select
          value={props.orientation}
          onValueChange={(v) => onPropsChange({ ...props, orientation: v as PropsType["orientation"] })}>
          <SelectTrigger>
            <SelectValue placeholder="Select orientation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Landscape (0&deg;)</SelectItem>
            <SelectItem value="180">Landscape (180&deg;)</SelectItem>
            <SelectItem value="90">Portrait (90&deg;)</SelectItem>
            <SelectItem value="270">Portrait (270&deg;)</SelectItem>
          </SelectContent>
        </Select>
      </EditorBlock>
      <EditorBlock label="Bumper size (inches)">
        <InputNumber
          value={props.bumperSizeInch}
          aria-label="Bumper size (inches)"
          minValue={0}
          maxValue={35}
          formatOptions={{
            style: "unit",
            unit: "inch",
            unitDisplay: "short",
            maximumFractionDigits: 1,
          }}
          onChange={(v) => onPropsChange({ ...props, bumperSizeInch: v })}
        />
      </EditorBlock>
    </EditorContainer>
  );
};

const QuickMenu = ({ props, onPropsChange }: WidgetEditorProps<PropsType>) => {
  return (
    <DropdownMenuContent align="end">
      <DropdownMenuRadioGroup
        value={props.orientation}
        onValueChange={(v) => onPropsChange({ ...props, orientation: v as PropsType["orientation"] })}>
        <DropdownMenuRadioItem value="0">Landscape (0&deg;)</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="180">Landscape (180&deg;)</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="90">Portrait (90&deg;)</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="270">Portrait (270&deg;)</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  );
};

export const WidgetField2dx3Descriptor: WidgetDescriptor<PropsType> = {
  type: "field2dx3",
  name: "Field 2D x3",
  icon: "square-route",
  description: "Robot pose, aiming spot, and autodrive target on the 2D field",
  width: 40,
  height: 20,
  constraints: {
    width: { min: 6 },
    height: { min: 11 },
  },
  slot: {
    lookback: 5,
    transform: transform,
    accepts: {
      primitive: ["numberArray"],
      json: ["Pose2d", "Pose3d"],
      composite: ["Field2d"],
    },
  },
  extraSlots: (props) =>
    [props.aimingSpotPath, props.targetPath].map((s) => normalizeSlot(s)).filter((s): s is string => s != null),
  component: (props) => <Component {...props} />,
  props: {
    schema: propsSchema,
    defaultValue: {
      aimingSpotPath: "",
      targetPath: "",
      style: "default",
      orientation: "0",
      bumperSizeInch: 32,
    },
    editor: (props) => <Editor {...props} />,
    menu: (props) => <QuickMenu {...props} />,
  },
};
