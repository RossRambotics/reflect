/**
 * Attribution:
 * https://github.com/xyflow/xyflow/blob/main/packages/react/src/hooks/useKeyPress.ts
 *
 * Copyright (c) 2019-2024 webkid GmbH / MIT LICENSE
 */

import { useEffect, useMemo, useRef, useState } from "react";

type Keys = Array<string>;
type PressedKeys = Set<string>;
type KeyOrCode = "key" | "code";

export type UseKeyPressOptions = {
  target?: Window | Document | HTMLElement | ShadowRoot | null;
  actInsideInputWithModifier?: boolean;
};

const defaultDoc = typeof document !== "undefined" ? document : null;

/**
 * @public
 * Hook that detects key press for a specific key combination.
 *
 * The `keyCode` can be a string 'a' or an array of strings ['a', 'a+d'].
 * A string means a single key 'a' or a combination 'a+d' is tracked,
 * an array means any one of the entries is tracked.
 *
 * @param keyCode the key code (string or array of strings) to use
 * @param options options
 * @returns boolean indicating whether the key code is pressed
 */
export function useKeyPress(
  keyCode: string | Array<string> | null = null,
  options: UseKeyPressOptions = { target: defaultDoc, actInsideInputWithModifier: true }
): boolean {
  const [keyPressed, setKeyPressed] = useState(false);

  // we need to remember if a modifier key is pressed in order to track it
  const modifierPressed = useRef(false);

  // we need to remember the pressed keys in order to support combinations
  const pressedKeys = useRef<PressedKeys>(new Set([]));

  // keyCodes = array with single keys [['a']] or key combinations [['a', 's']]
  // keysToWatch = array with all keys flattened ['a', 'd', 'ShiftLeft']
  //
  // used to check if we store event.code or event.key; when the code is in `keysToWatch`
  // list we use the code, otherwise we use the key
  //
  // when you press the left "command" key, the code is "MetaLeft" and the key is "Meta"
  // we want users to be able to pass keys and codes so we assume that the key is meant
  // when we can't find it in the list of keysToWatch
  const [keyCodes, keysToWatch] = useMemo(() => {
    if (keyCode !== null) {
      const keyCodeArr = Array.isArray(keyCode) ? keyCode : [keyCode];
      const keys = keyCodeArr.filter((kc) => typeof kc === "string").map((kc) => kc.split("+"));
      const keysFlat = keys.reduce((res: Keys, item) => res.concat(...item), []);

      return [keys, keysFlat] as const;
    }

    return [[], []] as const;
  }, [keyCode]);

  useEffect(() => {
    const target = options?.target ?? defaultDoc;

    if (keyCode !== null) {
      const onKeyDown = (event: KeyboardEvent) => {
        modifierPressed.current = event.ctrlKey || event.metaKey || event.shiftKey;
        const preventAction =
          (!modifierPressed.current || (modifierPressed.current && !options.actInsideInputWithModifier)) &&
          isInputDOMNode(event);

        if (preventAction) {
          return;
        }

        pressedKeys.current.add(event[getKeyOrCode(event.code, keysToWatch)]);

        if (isMatchingKey(keyCodes, pressedKeys.current, false)) {
          event.preventDefault();
          setKeyPressed(true);
        }
      };

      const onKeyUp = (event: KeyboardEvent) => {
        const preventAction =
          (!modifierPressed.current || (modifierPressed.current && !options.actInsideInputWithModifier)) &&
          isInputDOMNode(event);

        if (preventAction) {
          return;
        }

        if (isMatchingKey(keyCodes, pressedKeys.current, true)) {
          setKeyPressed(false);
          pressedKeys.current.clear();
        } else {
          pressedKeys.current.delete(event[getKeyOrCode(event.code, keysToWatch)]);
        }

        // fix for Mac: when cmd key is pressed, keyup is not triggered for any other key,
        // see: https://stackoverflow.com/questions/27380018/when-cmd-key-is-kept-pressed-keyup-is-not-triggered-for-any-other-key
        if (event.key === "Meta") {
          pressedKeys.current.clear();
        }

        modifierPressed.current = false;
      };

      const reset = () => {
        pressedKeys.current.clear();
        setKeyPressed(false);
      };

      target?.addEventListener("keydown", onKeyDown as EventListenerOrEventListenerObject);
      target?.addEventListener("keyup", onKeyUp as EventListenerOrEventListenerObject);
      window.addEventListener("blur", reset);
      window.addEventListener("contextmenu", reset);

      return () => {
        target?.removeEventListener("keydown", onKeyDown as EventListenerOrEventListenerObject);
        target?.removeEventListener("keyup", onKeyUp as EventListenerOrEventListenerObject);
        window.removeEventListener("blur", reset);
        window.removeEventListener("contextmenu", reset);
      };
    }
  }, [keyCode, keyCodes, keysToWatch, setKeyPressed, options]);

  return keyPressed;
}

const inputTags = ["INPUT", "SELECT", "TEXTAREA"];

function isInputDOMNode(event: KeyboardEvent): boolean {
  // using composed path for handling shadow dom
  const target = (event.composedPath?.()?.[0] || event.target) as HTMLElement;
  const isInput = inputTags.includes(target?.nodeName?.toLocaleUpperCase()) || target?.hasAttribute("contenteditable");

  // when an input field is focused we don't want to trigger deletion or movement
  return isInput || !!target?.closest(".nokey");
}

function isMatchingKey(keyCodes: ReadonlyArray<Keys>, pressedKeys: PressedKeys, isUp: boolean): boolean {
  return (
    keyCodes
      // we only want to compare same sizes of keyCode definitions
      // and pressed keys. When the user specified 'Meta' as a key somewhere
      // this would also be truthy without this filter when user presses 'Meta' + 'r'
      .filter((keys) => isUp || keys.length === pressedKeys.size)
      // since we want to support multiple possibilities only one of the
      // combinations need to be part of the pressed keys
      .some((keys) => keys.every((k) => pressedKeys.has(k)))
  );
}

function getKeyOrCode(eventCode: string, keysToWatch: string | ReadonlyArray<string>): KeyOrCode {
  return keysToWatch.includes(eventCode) ? "code" : "key";
}
