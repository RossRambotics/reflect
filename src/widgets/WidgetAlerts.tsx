import { CircleX, Info, TriangleAlert } from "lucide-react";
import { Fragment } from "react";
import { z } from "zod";

import { Input } from "@ui/input";
import { TruncateText } from "@ui/truncate-text";

import { EditorBlock } from "./parts/EditorBlock";
import { EditorContainer } from "./parts/EditorContainer";
import { EditorSwitchBlock } from "./parts/EditorSwitchBlock";
import { Slot } from "./slot";

import type { DataChannelRecord, DataType, StructuredTypeDescriptor } from "@2702rebels/wpidata/abstractions";
import type { WidgetComponentProps, WidgetDescriptor, WidgetEditorProps } from "./types";

const previewData = {
  errors: ["Error..."],
  warnings: ["Warning..."],
  infos: ["Info..."],
};

const propsSchema = z.object({
  title: z.string().optional(),
  errorsVisible: z.boolean().default(true),
  warningsVisible: z.boolean().default(true),
  infosVisible: z.boolean().default(true),
});

type PropsType = z.infer<typeof propsSchema>;

const transform = (
  dataType: DataType,
  records: ReadonlyArray<DataChannelRecord>,
  structuredType: StructuredTypeDescriptor | undefined
) => {
  if (records.length === 0) {
    return undefined;
  }

  const value = records.at(-1)?.value;

  if (structuredType != null && structuredType.format === "composite" && structuredType.name === "Alerts") {
    const v = value as {
      errors?: Array<string>;
      warnings?: Array<string>;
      infos?: Array<string>;
    };

    return {
      errors: v.errors,
      warnings: v.warnings,
      infos: v.infos,
    } as const;
  }
};

const Block = ({ items, icon }: { items: Array<string>; icon: React.ReactNode }) => (
  <>
    {items.map((item, index) => (
      <Fragment key={`_${index}`}>
        {icon}
        {item}
      </Fragment>
    ))}
  </>
);

const Component = ({ mode, slot, data, props }: WidgetComponentProps<PropsType>) => {
  const d = mode === "template" ? previewData : (data as ReturnType<typeof transform>);
  return (
    <div className="flex h-full w-full flex-col py-2 select-none">
      <div className="mb-1 flex items-center justify-between gap-2 px-3">
        <TruncateText
          variant="head"
          className="text-sm font-bold">
          {mode === "template" ? "Preview" : props.title || Slot.formatAsTitle(slot)}
        </TruncateText>
      </div>
      {d != null && (
        <div className="mt-2 mb-1 grid grid-cols-[24px_1fr] gap-x-2 gap-y-1.5 px-3 text-sm">
          {props.errorsVisible && d.errors != null && d.errors.length > 0 && (
            <Block
              items={d.errors}
              icon={<CircleX className="text-red-600" />}
            />
          )}
          {props.warningsVisible && d.warnings != null && d.warnings.length > 0 && (
            <Block
              items={d.warnings}
              icon={<TriangleAlert className="text-amber-600" />}
            />
          )}
          {props.infosVisible && d.infos != null && d.infos.length > 0 && (
            <Block
              items={d.infos}
              icon={<Info className="text-sky-600" />}
            />
          )}
        </div>
      )}
    </div>
  );
};

const Editor = ({ props, onPropsChange }: WidgetEditorProps<PropsType>) => {
  return (
    <EditorContainer>
      <EditorBlock label="Title">
        <Input
          value={props.title ?? ""}
          onChange={(ev) =>
            onPropsChange({
              ...props,
              title: ev.currentTarget.value,
            })
          }
          placeholder="Optional widget title"
        />
      </EditorBlock>
      <EditorSwitchBlock
        label="Show error alerts"
        checked={props.errorsVisible}
        onCheckedChange={(v) =>
          onPropsChange({
            ...props,
            errorsVisible: v,
          })
        }
      />
      <EditorSwitchBlock
        label="Show warning alerts"
        checked={props.warningsVisible}
        onCheckedChange={(v) =>
          onPropsChange({
            ...props,
            warningsVisible: v,
          })
        }
      />
      <EditorSwitchBlock
        label="Show informational alerts"
        checked={props.infosVisible}
        onCheckedChange={(v) =>
          onPropsChange({
            ...props,
            infosVisible: v,
          })
        }
      />
    </EditorContainer>
  );
};

export const WidgetAlertsDescriptor: WidgetDescriptor<PropsType> = {
  type: "alerts",
  name: "Alerts",
  icon: "square-alerts",
  description: "WPILIB Network Alerts",
  width: 10,
  height: 9,
  constraints: {
    width: { min: 5 },
    height: { min: 3 },
  },
  slot: {
    transform: transform,
    accepts: {
      composite: ["Alerts"],
    },
    defaultChannel: "nt:/SmartDashboard/Alerts/*",
  },
  component: (props) => <Component {...props} />,
  props: {
    schema: propsSchema,
    defaultValue: {
      errorsVisible: propsSchema.shape.errorsVisible.def.defaultValue,
      warningsVisible: propsSchema.shape.warningsVisible.def.defaultValue,
      infosVisible: propsSchema.shape.infosVisible.def.defaultValue,
    },
    editor: (props) => <Editor {...props} />,
  },
};
