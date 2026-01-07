import { X } from "lucide-react";
import { useCallback } from "react";

import { Button } from "@ui/button";
import { FocusScope } from "@ui/focus-scope";
import { PanelSlider } from "@ui/panel-slider";

import { cn } from "../lib/utils";
import { modalActions, useModalStore } from "./Modal";

import type { PanelSliderProps } from "@ui/panel-slider";
import type { Modal, ModalDescriptor } from "./Modal";

const EMPTY: ReadonlyArray<Modal> = [];

type ModalSlotProps = {
  modal: Modal;
  template: ModalDescriptor;
  current: boolean;
};

const ModalSlot = ({ modal, template, current }: ModalSlotProps) => (
  <div className="relative flex h-full flex-1 basis-full flex-col overflow-hidden rounded-md border bg-card">
    <FocusScope shouldCaptureFocus>
      {current && template.closeButtonVisible && (
        <div className="absolute top-2.5 right-2.5 z-20">
          <Button
            onClick={modal.close}
            aria-label="Close"
            variant="ghost"
            className="rounded"
            size="icon">
            <X className="h-6 w-6 text-muted-foreground" />
          </Button>
        </div>
      )}
      {template.render({
        ...modal.props,
        close: modal.close,
        disabled: !current,
      })}
    </FocusScope>
  </div>
);

export type ModalManagerProps = {
  slot: string;
  side?: PanelSliderProps["side"];
};

export const ModalManager = ({ slot, side = "right" }: ModalManagerProps) => {
  const { describe } = modalActions;
  const entries = useModalStore((state) => (state.slot === slot ? state.modals : EMPTY));

  // close the last opened panel
  const onClosing = useCallback(() => {
    if (entries.length > 0) {
      const entry = entries[entries.length - 1]!;
      entry.close();
    }
  }, [entries]);

  return (
    <PanelSlider
      className={cn("my-4", side === "right" && "mr-4", side === "left" && "ml-4")}
      side={side}
      animation="anticipate"
      overhang={20}
      backdrop="blur"
      shouldPreventBodyScroll
      shouldCloseOnOutsideInteraction
      shouldCloseOnEsc
      shouldCloseOnBlur={false}
      shouldCaptureFocus={false}
      visible={entries.length > 0}
      onClosing={onClosing}>
      {entries.map((modal, index) => {
        const template = describe(modal.id);
        return (
          <div
            key={modal.id}
            className={cn("h-full overflow-hidden", modal.className)}>
            {template && (
              <ModalSlot
                modal={modal}
                template={template}
                current={index === entries.length - 1}
              />
            )}
          </div>
        );
      })}
    </PanelSlider>
  );
};
