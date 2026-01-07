import { Grid, Loader, OrbitControls, PerspectiveCamera, Stage } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { z } from "zod";

import { Input } from "@ui/input";

import { EditorBlock } from "./parts/EditorBlock";
import { EditorContainer } from "./parts/EditorContainer";
import { EditorSwitchBlock } from "./parts/EditorSwitchBlock";
import { Robot3d } from "./parts/Robot3d";

import type { WidgetComponentProps, WidgetDescriptor, WidgetEditorProps } from "./types";

const gridDimensions = [2.5, 2.5] as [number, number];
const gridConfig = {
  cellSize: 0.5,
  cellThickness: 0.5,
  cellColor: "#64748B",
  sectionSize: 2,
  sectionThickness: 0.5,
  sectionColor: "#0EA5E9",
  fadeDistance: 8,
  fadeStrength: 1,
  followCamera: false,
  infiniteGrid: true,
};

const Ground = () => (
  <Grid
    args={gridDimensions}
    {...gridConfig}
  />
);

const propsSchema = z.object({
  wireframe: z.boolean(),
  modelPath: z.string(),
});

type PropsType = z.infer<typeof propsSchema>;

const Component = ({ props, mode }: WidgetComponentProps<PropsType>) => {
  const path = props?.modelPath;
  return mode ? null : (
    <>
      <Canvas>
        <PerspectiveCamera
          makeDefault
          fov={45}
          position={[1, 0.5, 1]}
        />
        <Stage>
          <Ground />
          {path && (
            <Suspense fallback={null}>
              <Robot3d path={path} />
            </Suspense>
          )}
        </Stage>
        <OrbitControls
          makeDefault
          enableZoom={false}
        />
      </Canvas>
      <Loader />
    </>
  );
};

const Editor = ({ props, onPropsChange }: WidgetEditorProps<PropsType>) => {
  return (
    <EditorContainer>
      <EditorBlock label="Path to the model file">
        <Input
          value={props.modelPath ?? ""}
          onChange={(ev) =>
            onPropsChange({
              ...props,
              modelPath: ev.currentTarget.value,
            })
          }
          placeholder="Path to the 3D model (GLTF binary format *.glb)"
        />
      </EditorBlock>
      <EditorSwitchBlock
        label="Wireframe"
        checked={props.wireframe}
        onCheckedChange={(v) =>
          onPropsChange({
            ...props,
            wireframe: v,
          })
        }
      />
    </EditorContainer>
  );
};

export const WidgetRobot3dDescriptor: WidgetDescriptor<PropsType> = {
  type: "robot3d",
  name: "Robot 3D",
  icon: "square-box",
  description: "Robot 3D model (experimental)",
  width: 10,
  height: 10,
  constraints: {
    width: { min: 6 },
    height: { min: 6 },
  },
  slot: {
    lookback: 5,
  },
  component: (props) => <Component {...props} />,
  props: {
    schema: propsSchema,
    defaultValue: {
      wireframe: false,
      modelPath: "",
    },
    editor: (props) => <Editor {...props} />,
  },
  spotlight: false,
};
