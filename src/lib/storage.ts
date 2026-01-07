import { isTauri } from "@tauri-apps/api/core";
import { createJSONStorage } from "zustand/middleware";

import { createTauriStorage } from "../stores/TauriStoreStorage";

import type { PersistStorage } from "zustand/middleware";

/**
 * Creates a named persistent storage for a `zustand` store
 * based on either TauriStorage or localStorage when running under browser.
 *
 * @param name name of the file backing TauriStorage, ignored for localStorage.
 */
export function createPersistentStorage<S>(name: string): PersistStorage<S> | undefined {
  return isTauri() ? createTauriStorage(name) : createJSONStorage(() => localStorage);
}

// verify that we are not running in iframe
const notIFrame = (() => {
  try {
    return window.self === window.top;
  } catch {
    return false;
  }
})();

/** Determines whether error indicates user's cancellation. */
function isAbortError(error: unknown): error is { name: "AbortError" } {
  return typeof error === "object" && error !== null && "name" in error && error.name === "AbortError";
}

/**
 * Saves blob to a file using modern File System Access API,
 * with a fallback to a classic approach via invisible <a> tag.
 *
 * @param blob blob to save
 * @param name suggested file name
 * @param options options to pass to the SaveFilePicker dialog
 * @returns filename or undefined
 */
export async function saveFile(blob: Blob, name: string, options: SaveFilePickerOptions) {
  if ("showSaveFilePicker" in window && notIFrame) {
    try {
      const handle = await showSaveFilePicker({
        ...options,
        suggestedName: name,
      });

      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();

      return handle.name;
    } catch (exception) {
      if (!isAbortError(exception)) {
        throw exception;
      }
    }

    return;
  }

  // fallback via <a> tag
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.style.display = "none";
  a.click();

  // cleanup
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 1000);

  return name;
}

/**
 * Opens file using modern File System Access API,
 * with a fallback to a classic approach via invisible <input> tag.
 *
 * @param options options to pass to the OpenFilePicker dialog
 * @returns file opened or undefined
 */
export async function openFile(options: OpenFilePickerOptions) {
  if ("showOpenFilePicker" in window && notIFrame) {
    try {
      const handles = await showOpenFilePicker({ ...options, multiple: false });
      return await handles[0]?.getFile();
    } catch (exception) {
      if (!isAbortError(exception)) {
        throw exception;
      }
    }

    return undefined;
  }

  // fallback via <input> tag
  return new Promise<File | undefined>((resolve) => {
    const input = document.createElement("input");
    input.style.display = "none";
    input.type = "file";
    input.multiple = false;

    // `change` event fires when the user interacts with the dialog
    input.addEventListener("change", () => {
      input.remove();

      if (!input.files) {
        resolve(undefined);
      } else {
        resolve(input.files[0]);
      }
    });

    if ("showPicker" in HTMLInputElement.prototype) {
      input.showPicker();
    } else {
      input.click();
    }
  });
}
