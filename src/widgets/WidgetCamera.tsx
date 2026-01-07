import { Video, VideoOff } from "lucide-react";
import { useCallback, useState } from "react";
import { z } from "zod";

import { Input } from "@ui/input";
import { InputNumber } from "@ui/input-number";

import { EditorBlock } from "./parts/EditorBlock";
import { EditorContainer } from "./parts/EditorContainer";

import type { WidgetComponentProps, WidgetDescriptor, WidgetEditorProps } from "./types";

const propsSchema = z.object({
  address: z.string(),
  port: z.number(),
});

const Placeholder = ({ state }: { state?: boolean }) =>
  state ? (
    <Video className="absolute inset-1/2 size-24 -translate-1/2 stroke-1 text-muted-foreground" />
  ) : (
    <VideoOff className="absolute inset-1/2 size-24 -translate-1/2 stroke-1 text-muted-foreground" />
  );

type PropsType = z.infer<typeof propsSchema>;

const Component = ({ props, mode }: WidgetComponentProps<PropsType>) => {
  const address = props?.address;
  const port = props?.port;
  const configured = !!address && port > 0;

  const [error, setError] = useState(false);
  const handleError = useCallback(() => setError(true), []);
  const handleLoad = useCallback(() => setError(false), []);

  return (
    <div className="grid h-full w-full place-items-center select-none">
      {mode ? (
        <Placeholder state={configured} />
      ) : configured ? (
        <>
          <img
            alt=""
            className="object-cover"
            src={`http://${address}:${port}/stream.mjpg`}
            onError={handleError}
            onLoad={handleLoad}
          />
          {error && <Placeholder state={false} />}
        </>
      ) : (
        <Placeholder state={false} />
      )}
    </div>
  );
};

const Editor = ({ props, onPropsChange }: WidgetEditorProps<PropsType>) => {
  return (
    <EditorContainer>
      <EditorBlock label="Network address (IP or hostname)">
        <Input
          value={props.address ?? ""}
          onChange={(ev) =>
            onPropsChange({
              ...props,
              address: ev.currentTarget.value,
            })
          }
        />
      </EditorBlock>
      <EditorBlock label="Port number">
        <InputNumber
          aria-label="Port"
          value={props.port}
          onChange={(v) =>
            onPropsChange({
              ...props,
              port: v,
            })
          }
          minValue={1024}
          maxValue={65535}
          step={1}
        />
      </EditorBlock>
    </EditorContainer>
  );
};

export const WidgetCameraDescriptor: WidgetDescriptor<PropsType> = {
  type: "camera",
  name: "Camera",
  icon: "square-camera",
  description: "Camera stream",
  width: 33,
  height: 25,
  constraints: {
    width: { min: 12 },
    height: { min: 9 },
  },
  slot: {
    lookback: 5,
  },
  component: (props) => <Component {...props} />,
  props: {
    schema: propsSchema,
    defaultValue: {
      address: "",
      port: 1181,
    },
    editor: (props) => <Editor {...props} />,
  },
  spotlight: false,
};
