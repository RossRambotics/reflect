import { z } from "zod";

import { EditorContainer } from "./parts/EditorContainer";
import { ReefAlgae, toggleBit } from "./parts/Reef";
import { transform } from "./parts/ReefStateStruct";

import type { WidgetComponentProps, WidgetDescriptor } from "./types";

const publishOptions = {
  structuredType: {
    name: "ReefState",
    format: "struct",
  },
} as const;

const propsSchema = z.object({});

type PropsType = z.infer<typeof propsSchema>;

const Component = ({ data, publish }: WidgetComponentProps<PropsType>) => {
  const d = data as ReturnType<typeof transform>;
  const robot = d?.robot;

  const toggleAlgae = publish
    ? (index: number) =>
        publish(
          {
            ...robot,
            algae: toggleBit(robot?.algae ?? 0, index),
          },
          ["operator"],
          publishOptions
        )
    : undefined;

  return (
    <div className="flex h-full w-full px-3 py-3 select-none">
      <ReefAlgae
        className="h-full w-auto"
        radius={100}
        value={robot?.algae ?? 0} // DEBUG: parseInt("010011", 2)
        onClick={toggleAlgae}
      />
    </div>
  );
};

const Editor = () => {
  return <EditorContainer />;
};

export const WidgetReefAlgaeDescriptor: WidgetDescriptor<PropsType> = {
  type: "2025.reef.algae",
  name: "2025 Reef Algae",
  icon: "square-box",
  description: "Reef algae placements",
  width: 16,
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
    defaultValue: {},
    editor: () => <Editor />,
  },
  spotlight: false,
  season: 2025,
};
