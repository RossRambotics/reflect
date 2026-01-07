import { buildGraph } from "@react-three/fiber";
import { readFile } from "@tauri-apps/plugin-fs";
import { useEffect, useRef, useState } from "react";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import { Logger } from "@2702rebels/logger";
import { getErrorMessage } from "@2702rebels/shared/error";

import type { Group, Object3DEventMap } from "three";

const loader = new GLTFLoader();
const draco = new DRACOLoader();
draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.5/");
loader.setDRACOLoader(draco);

async function loadAsync(path: string) {
  let url: ReturnType<typeof URL.createObjectURL> | undefined;
  try {
    const data = await readFile(path);
    const blob = new Blob([data]);

    url = URL.createObjectURL(blob);
    const result = await loader.loadAsync(url);
    return { ...result, ...buildGraph(result.scene) };
  } catch (exception) {
    const message = getErrorMessage(exception);
    Logger.Default.error(`Failed to load model file [${message}]`);
  } finally {
    if (url) {
      URL.revokeObjectURL(url);
    }
  }

  return undefined;
}

function useModel(path: string) {
  const [model, setModel] = useState<Awaited<ReturnType<typeof loadAsync>> | undefined>(undefined);

  useEffect(() => {
    (async () => {
      const model = await loadAsync(path);
      if (model) {
        setModel(model);
      }
    })();
  }, [path]);

  return model;
}

export type Robot3dProps = {
  scale?: number;
  path: string;
};

export const Robot3d = ({ path, scale = 1.0, ...props }: Robot3dProps) => {
  const groupRef = useRef<Group<Object3DEventMap>>(null);
  const model = useModel(path);

  return model ? (
    <group
      ref={groupRef}
      scale={scale}
      {...props}>
      <primitive object={model.scene} />
    </group>
  ) : null;
};
