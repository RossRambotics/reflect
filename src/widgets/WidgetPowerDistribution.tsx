import { Fragment } from "react/jsx-runtime";
import { z } from "zod";

import { InputNumber } from "@ui/input-number";

import { cn } from "../lib/utils";
import { EditorBlock } from "./parts/EditorBlock";
import { EditorContainer } from "./parts/EditorContainer";

import type { DataChannelRecord, DataType, StructuredTypeDescriptor } from "@2702rebels/wpidata/abstractions";
import type { PowerDistributionSendable } from "@2702rebels/wpidata/types/sendable";
import type { WidgetComponentProps, WidgetDescriptor, WidgetEditorProps } from "./types";

const propsSchema = z.object({
  thresholdLoCurrent: z.number(),
  thresholdHiCurrent: z.number(),
});

type PropsType = z.infer<typeof propsSchema>;

type PowerDistribution = {
  readonly voltage: number;
  readonly current: number;
  readonly channels: ReadonlyArray<number>;
};

const transform = (
  dataType: DataType,
  records: ReadonlyArray<DataChannelRecord>,
  structuredType: StructuredTypeDescriptor | undefined
): PowerDistribution | undefined => {
  if (records.length === 0) {
    return undefined;
  }

  const record = records.at(-1);
  if (
    record?.value != null &&
    typeof record.value === "object" &&
    structuredType &&
    structuredType.format === "composite" &&
    structuredType.name === "PowerDistribution"
  ) {
    const v = record.value as unknown as PowerDistributionSendable;
    return {
      voltage: v.Voltage,
      current: v.TotalCurrent,
      channels: [
        v.Chan0,
        v.Chan1,
        v.Chan2,
        v.Chan3,
        v.Chan4,
        v.Chan5,
        v.Chan6,
        v.Chan7,
        v.Chan8,
        v.Chan9,
        v.Chan10,
        v.Chan11,
        v.Chan12,
        v.Chan13,
        v.Chan14,
        v.Chan15,
        v.Chan16,
        v.Chan17,
        v.Chan18,
        v.Chan19,
        v.Chan20,
        v.Chan21,
        v.Chan22,
        v.Chan23,
      ],
    } as const;
  }

  return undefined;
};

const formatValue = (value: number | undefined) => {
  if (value == null) {
    return "--.-";
  }

  return value.toFixed(1);
};

const hasAlert = (value: number | undefined, threshold?: number) =>
  value != null && threshold != null && threshold >= 0 && value >= threshold;

type PowerChannelProps = {
  side: "left" | "right";
  variant: "pdp-40A" | "pdp-30A" | "pdh-40A" | "pdh-15A" | "current" | "voltage";
  label: string;
  value?: number;
  threshold?: number;
  className?: string;
};

const PowerChannel = ({ side, variant, value, label, threshold, className }: PowerChannelProps) => {
  const alert = hasAlert(value, threshold);
  return variant === "current" || variant === "voltage" ? (
    <div className={cn("flex items-center", side === "right" && "flex-row-reverse", className)}>
      <div
        className={cn(
          "w-16 border-y border-muted-foreground/40 bg-background/60 px-2 py-1.5",
          side === "left" && "rounded-r-md border-r",
          side === "right" && "rounded-l-md border-l"
        )}>
        <div className="text-right font-mono text-xs font-bold select-none">
          {formatValue(value)}
          {variant === "voltage" ? "V" : "A"}
        </div>
      </div>
      <div className={cn("px-2 py-1 text-right text-sm font-medium select-none", side === "right" && "text-right")}>
        {label}
      </div>
    </div>
  ) : (
    <div className={cn("flex items-center", side === "right" && "flex-row-reverse", className)}>
      <div
        className={cn(
          "w-15 border-y border-muted-foreground/40 bg-background/60 px-2 py-1.5",
          side === "left" && "rounded-r-md border-r",
          side === "right" && "rounded-l-md border-l"
        )}>
        <div className="text-right font-mono text-xs font-bold select-none">{formatValue(value)}A</div>
      </div>
      <div
        className={cn(
          "relative w-8 bg-slate-700 px-2 py-1 text-[0.625rem] font-normal select-none",
          side === "left" && "rounded-br-xs",
          side === "right" && "rounded-tl-xs text-right",
          side === "left" && variant === "pdh-15A" && "w-10 rounded-r-xs py-0.5",
          side === "right" && variant === "pdh-15A" && "w-10 rounded-l-xs py-0.5",
          side === "left" && variant === "pdp-30A" && "w-12 rounded-r-xs py-0.5",
          side === "right" && variant === "pdp-30A" && "w-12 rounded-l-xs py-0.5",
          side === "left" && variant === "pdp-40A" && "w-12 rounded-br-xs py-0.5",
          side === "right" && variant === "pdp-40A" && "w-12 rounded-bl-xs py-0.5",
          alert && "bg-red-800"
        )}>
        •&nbsp;{label}
        {variant === "pdh-40A" && (
          <div
            className={cn(
              "absolute size-4 bg-slate-700",
              side === "left" && "top-0 left-8 rounded-r-xs",
              side === "right" && "right-8 bottom-0 rounded-l-xs",
              alert && "bg-red-800"
            )}
          />
        )}
        {variant === "pdp-40A" && (
          <div
            className={cn(
              "absolute h-1.5 w-4 bg-slate-700",
              side === "left" && "-top-1 right-0 rounded-t-xs",
              side === "right" && "-top-1 left-0 rounded-t-xs",
              alert && "bg-red-800"
            )}
          />
        )}
      </div>
    </div>
  );
};

const PDH = [
  [10, 9],
  [11, 8],
  [12, 7],
  [13, 6],
  [14, 5],
  [15, 4],
  [16, 3],
  [17, 2],
  [18, 1],
  [19, 0],
] as const;

const PDP_40 = [
  [8, 7],
  [9, 6],
  [10, 5],
  [11, 4],
] as const;

const PDP_30 = [
  [12, 3],
  [13, 2],
  [14, 1],
  [15, 0],
] as const;

const Component = ({
  variant,
  data,
  props,
}: WidgetComponentProps<PropsType> & {
  variant: "pdh" | "pdp";
}) => {
  const d = data as ReturnType<typeof transform>;
  return (
    <>
      <h1 className="px-3 py-2 text-sm font-bold select-none">
        {variant === "pdh" ? "Power Distribution Hub" : "Power Distribution Panel"}
      </h1>
      {variant === "pdh" ? (
        <>
          <div className="grid grid-cols-2 gap-0.5">
            {PDH.map(([l, r], index) => (
              <Fragment key={`_${index}`}>
                <PowerChannel
                  key={l}
                  label={l.toString()}
                  side="left"
                  variant="pdh-40A"
                  value={d?.channels?.[l]}
                  threshold={props.thresholdHiCurrent}
                />
                <PowerChannel
                  key={r}
                  label={r.toString()}
                  variant="pdh-40A"
                  side="right"
                  value={d?.channels?.[r]}
                  threshold={props.thresholdHiCurrent}
                />
              </Fragment>
            ))}
          </div>
          <div className="mt-0.5 flex justify-between">
            <div className="flex flex-col gap-0.5">
              <PowerChannel
                label="20"
                variant="pdh-15A"
                side="left"
                value={d?.channels?.[20]}
                threshold={props.thresholdLoCurrent}
              />
              <PowerChannel
                label="21"
                variant="pdh-15A"
                side="left"
                value={d?.channels?.[21]}
                threshold={props.thresholdLoCurrent}
              />
              <PowerChannel
                label="22"
                variant="pdh-15A"
                side="left"
                value={d?.channels?.[22]}
                threshold={props.thresholdLoCurrent}
              />
              <PowerChannel
                label="23"
                variant="pdh-15A"
                side="left"
                value={d?.channels?.[23]}
                threshold={props.thresholdLoCurrent}
              />
            </div>
            <div className="mt-3.5 flex flex-col gap-1.5">
              <PowerChannel
                label="Current"
                variant="current"
                side="right"
                value={d?.current}
              />
              <PowerChannel
                label="Voltage"
                variant="voltage"
                side="right"
                value={d?.voltage}
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-0.5">
            {PDP_40.map(([l, r], index) => (
              <Fragment key={`_${index}`}>
                <PowerChannel
                  key={l}
                  label={l.toString()}
                  side="left"
                  variant="pdp-40A"
                  value={d?.channels?.[l]}
                  threshold={props.thresholdHiCurrent}
                />
                <PowerChannel
                  key={r}
                  label={r.toString()}
                  variant="pdp-40A"
                  side="right"
                  value={d?.channels?.[r]}
                  threshold={props.thresholdHiCurrent}
                />
              </Fragment>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-0.5">
            {PDP_30.map(([l, r], index) => (
              <Fragment key={`_${index}`}>
                <PowerChannel
                  key={l}
                  label={l.toString()}
                  side="left"
                  variant="pdp-30A"
                  value={d?.channels?.[l]}
                  threshold={props.thresholdLoCurrent}
                />
                <PowerChannel
                  key={r}
                  label={r.toString()}
                  variant="pdp-30A"
                  side="right"
                  value={d?.channels?.[r]}
                  threshold={props.thresholdLoCurrent}
                />
              </Fragment>
            ))}
          </div>
          <div className="mt-3.5 flex flex-col gap-1.5">
            <PowerChannel
              label="Current"
              variant="current"
              side="right"
              value={d?.current}
            />
            <PowerChannel
              label="Voltage"
              variant="voltage"
              side="right"
              value={d?.voltage}
            />
          </div>
        </>
      )}
    </>
  );
};

const Editor = ({
  variant,
  props,
  onPropsChange,
}: WidgetEditorProps<PropsType> & {
  variant: "pdh" | "pdp";
}) => {
  return (
    <EditorContainer>
      <EditorBlock label="High-current channel alert threshold (A)">
        <InputNumber
          aria-label="High-current channel alert threshold"
          value={props.thresholdHiCurrent}
          onChange={(v) =>
            onPropsChange({
              ...props,
              thresholdHiCurrent: v,
            })
          }
          minValue={0}
          maxValue={40}
          step={1}
        />
      </EditorBlock>
      <EditorBlock label="Low-current channel alert threshold (A)">
        <InputNumber
          aria-label="Low-current channel alert threshold"
          value={props.thresholdLoCurrent}
          onChange={(v) =>
            onPropsChange({
              ...props,
              thresholdLoCurrent: v,
            })
          }
          minValue={0}
          maxValue={variant === "pdh" ? 15 : 30}
          step={1}
        />
      </EditorBlock>
    </EditorContainer>
  );
};

export const WidgetPowerPdhDescriptor: WidgetDescriptor<PropsType> = {
  type: "power.pdh",
  name: "Power PDH",
  icon: "square-power",
  description: "REV Power Distribution Hub (PDH)",
  width: 10,
  height: 20,
  constraints: {
    width: { fixed: true },
    height: { fixed: true },
  },
  slot: {
    transform: transform,
    accepts: {
      composite: ["PowerDistribution"],
    },
  },
  component: (props) => (
    <Component
      variant="pdh"
      {...props}
    />
  ),
  props: {
    schema: propsSchema,
    defaultValue: {
      thresholdHiCurrent: 35,
      thresholdLoCurrent: 10,
    },
    editor: (props) => (
      <Editor
        variant="pdh"
        {...props}
      />
    ),
  },
};

export const WidgetPowerPdpDescriptor: WidgetDescriptor<PropsType> = {
  type: "power.pdp",
  name: "Power PDP",
  icon: "square-power",
  description: "CTRE Power Distribution Panel (PDP)",
  width: 10,
  height: 16,
  constraints: {
    width: { fixed: true },
    height: { fixed: true },
  },
  slot: {
    accepts: {
      composite: ["PowerDistribution"],
    },
  },
  component: (props) => (
    <Component
      variant="pdp"
      {...props}
    />
  ),
  props: {
    schema: propsSchema,
    defaultValue: {
      thresholdHiCurrent: 35,
      thresholdLoCurrent: 20,
    },
    editor: (props) => (
      <Editor
        variant="pdh"
        {...props}
      />
    ),
  },
};
