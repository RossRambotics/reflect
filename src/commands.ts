import { isTauri } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { parse, stringify } from "yaml";

import { Logger } from "@2702rebels/logger";
import { getErrorMessage } from "@2702rebels/shared/error";
import { toast } from "@ui/sonner";

import { openFile, saveFile } from "./lib/storage";

import type { DialogFilter } from "@tauri-apps/plugin-dialog";
import type { WorkspaceDocument } from "./specs";

const dialogFilters: Array<DialogFilter> = [
  {
    name: "Workspace (*.json, *.yaml, *.yml)",
    extensions: ["json", "yaml", "yml"],
  },
];

function getFileExtension(path: string) {
  const index = path.lastIndexOf(".");
  return index >= 0 ? path.substring(index + 1) : undefined;
}

/**
 * Prompts file selection via system "open file" dialog,
 * and attempts to read the file contents.
 */
export async function openWorkspaceFile() {
  try {
    if (isTauri()) {
      const file = await open({
        multiple: false,
        directory: false,
        filters: dialogFilters,
      });

      if (file) {
        const contents = await readTextFile(file);
        switch (getFileExtension(file)?.toLocaleLowerCase()) {
          case "yaml":
          case "yml":
            return parse(contents);
          default:
            return JSON.parse(contents);
        }
      }
    } else {
      const file = await openFile({
        types: [{ description: "Workspace (*.json)", accept: { "application/json": [".json"] } }],
      });

      if (file) {
        const response = new Response(file);
        response.headers.set("content-type", "application/json");
        return await response.json();
      }
    }
  } catch (exception) {
    const message = getErrorMessage(exception);
    toast.error("Failed to open workspace file", { description: message });
    Logger.Default.error(`Failed to open workspace file [${message}]`);
  }

  return undefined;
}

/**
 * Prompts file selection via system "save file" dialog,
 * and attempts to overwrite the selected file.
 */
export async function saveWorkspaceFile(workspace: WorkspaceDocument) {
  try {
    if (isTauri()) {
      const file = await save({
        filters: dialogFilters,
      });

      if (file) {
        let contents: string;
        switch (getFileExtension(file)?.toLocaleLowerCase()) {
          case "yaml":
          case "yml":
            contents = stringify(workspace);
            break;
          default:
            contents = JSON.stringify(workspace, undefined, 2);
            break;
        }

        await writeTextFile(file, contents);
        toast.success("Workspace saved", {
          description: file,
        });
      }
    } else {
      const blob = new Blob([JSON.stringify(workspace, undefined, 2)], { type: "application/json" });
      const file = await saveFile(blob, "workspace.json", {
        types: [{ description: "Workspace (*.json)", accept: { "application/json": [".json"] } }],
      });

      if (file) {
        toast.success("Workspace saved", {
          description: file,
        });
      }
    }
  } catch (exception) {
    const message = getErrorMessage(exception);
    toast.error("Failed to save workspace file", { description: message });
    Logger.Default.error(`Failed to save workspace file [${message}]`);
  }
}
