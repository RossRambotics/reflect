import { z } from "zod";

import { cn } from "../lib/utils";
import { EditorContainer } from "./parts/EditorContainer";
import { EditorSwitchBlock } from "./parts/EditorSwitchBlock";
import { ReefLevel, toggleBit } from "./parts/Reef";
import { transform } from "./parts/ReefStateStruct";

import type { WidgetComponentProps, WidgetDescriptor, WidgetEditorProps } from "./types";

const publishOptions = {
  structuredType: {
    name: "ReefState",
    format: "struct",
  },
} as const;

const propsSchema = z.object({
  vertical: z.boolean(),
  letters: z.boolean(),
  ignoreTarget: z.boolean(),
});

type PropsType = z.infer<typeof propsSchema>;

const Component = ({ data, props, publish }: WidgetComponentProps<PropsType>) => {
  const d = data as ReturnType<typeof transform>;
  const robot = d?.robot;

  const target = robot?.target ?? -1;

  const setTarget = publish
    ? (index: number) =>
        publish(
          {
            ...robot,
            target: index,
            locked: true,
          },
          ["operator"],
          publishOptions
        )
    : undefined;

  const toggleCoral = publish
    ? (index: number, level: 2 | 3 | 4) =>
        publish(
          {
            ...robot,
            [`coralsL${level}`]: toggleBit(robot ? robot[`coralsL${level}`] : 0, index),
          },
          ["operator"],
          publishOptions
        )
    : undefined;

  const selectLevel = publish
    ? (level: 0 | 1 | 2 | 3 | 4) =>
        publish(
          {
            ...robot,
            level,
          },
          ["operator"],
          publishOptions
        )
    : undefined;

  const toggleLevel = (level: 2 | 3 | 4) => {
    if (level !== robot?.level) {
      selectLevel?.(level);
    } else {
      selectLevel?.(0);
    }
  };

  const letterVisible = props.letters === true;
  const withTarget = !props.ignoreTarget;
  return (
    <div
      className={cn(
        "flex h-full w-full px-3 py-3 select-none",
        props.vertical ? "flex-col-reverse" : "flex-row gap-6"
      )}>
      <ReefLevel
        className={props.vertical ? "h-auto w-full" : "h-full w-auto"}
        caption="Level 2"
        radius={100}
        letterVisible={letterVisible}
        value={robot?.coralsL2 ?? 0} // DEBUG: parseInt("100011011000", 2)
        target={withTarget && target >= 12 && target < 24 ? target % 12 : undefined}
        locked={robot?.locked}
        selected={robot?.level == 2}
        barrier={(robot?.algae ?? 0) & 42} // CD/HG/LK
        onClick={(i, m) => (m && withTarget ? setTarget?.(12 + i) : toggleCoral?.(i, 2))}
        onSelect={() => toggleLevel?.(2)}
      />
      <ReefLevel
        className={props.vertical ? "h-auto w-full" : "h-full w-auto"}
        caption="Level 3"
        radius={100}
        letterVisible={letterVisible}
        value={robot?.coralsL3 ?? 0} // DEBUG: parseInt("100010000000", 2)
        target={withTarget && target >= 24 && target < 36 ? target % 12 : undefined}
        locked={robot?.locked}
        selected={robot?.level == 3}
        barrier={(robot?.algae ?? 0) & 21} // AB/EF/IJ
        onClick={(i, m) => (m && withTarget ? setTarget?.(24 + i) : toggleCoral?.(i, 3))}
        onSelect={() => toggleLevel?.(3)}
      />
      <ReefLevel
        className={props.vertical ? "h-auto w-full" : "h-full w-auto"}
        caption="Level 4"
        radius={100}
        letterVisible={letterVisible}
        value={robot?.coralsL4 ?? 0} // DEBUG: parseInt("000000000000", 2)
        target={withTarget && target >= 36 && target < 48 ? target % 12 : undefined}
        locked={robot?.locked}
        selected={robot?.level == 4}
        onClick={(i, m) => (m && withTarget ? setTarget?.(36 + i) : toggleCoral?.(i, 4))}
        onSelect={() => toggleLevel?.(4)}
      />
    </div>
  );
};

const Editor = ({ props, onPropsChange }: WidgetEditorProps<PropsType>) => {
  return (
    <EditorContainer>
      <EditorSwitchBlock
        label="Letters visible"
        checked={props.letters}
        onCheckedChange={(v) =>
          onPropsChange({
            ...props,
            letters: v,
          })
        }
      />
      <EditorSwitchBlock
        label="Portrait orientation"
        checked={props.vertical}
        onCheckedChange={(v) =>
          onPropsChange({
            ...props,
            vertical: v,
          })
        }
      />
      <EditorSwitchBlock
        label="Ignore target selection"
        checked={props.ignoreTarget}
        onCheckedChange={(v) =>
          onPropsChange({
            ...props,
            ignoreTarget: v,
          })
        }
      />
    </EditorContainer>
  );
};

export const WidgetReefCoralDescriptor: WidgetDescriptor<PropsType> = {
  type: "2025.reef.coral",
  name: "2025 Reef Corals",
  icon: "square-box",
  description: "Reef scoring targets",
  width: 48,
  height: 16,
  constraints: {
    width: { min: 12 },
    height: { min: 12 },
  },
  slot: {
    lookback: 5,
    transform: transform,
    accepts: {
      composite: ["ReefState"],
    },
  },
  component: (props) => <Component {...props} />,
  props: {
    schema: propsSchema,
    defaultValue: {
      vertical: false,
      letters: true,
      ignoreTarget: true,
    },
    editor: (props) => <Editor {...props} />,
  },
  spotlight: false,
  season: 2025,
};
