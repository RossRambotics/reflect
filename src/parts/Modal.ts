import { useCallback } from "react";
import { create } from "zustand";

import { Logger } from "@2702rebels/logger";

export type Modal = {
  id: string;
  close: () => void;
  className?: string;
  props?: Record<string, unknown>;
};

export type ModalComponentProps = {
  /**
   * Closes the modal programmatically. You may want to invoke this once the user finishes
   * interacting with the modal, e.g. pressing `Cancel` or `Submit` button.
   */
  close?: () => void;

  /**
   * Indicates that modal must be rendered in the disabled state. Typically the modal is
   * rendered partially off-screen as non-current instance.
   */
  disabled?: boolean;
};

export type ModalDescriptor = {
  /** Renders the modal component. */
  render: (props: ModalComponentProps) => React.ReactNode;

  /** Display close button in the top-right corner. */
  closeButtonVisible?: boolean;
};

export type ModalOptions = {
  /** Name of the slot to render the modal to. */
  slot?: string;
  /** Callback invoked when the modal is closing. */
  onClose?: () => void;
  /** CSS class overrides. */
  className?: string;
};

type Store = {
  slot?: string;
  modals: Array<Modal>;
  templates: Record<string, ModalDescriptor>;
};

type StoreActions = {
  enqueue: (slot: string, modal: Modal) => void;
  dequeue: () => void;
  reset: () => void;
  register: (id: string, template: ModalDescriptor) => void;
  describe: (id: string) => ModalDescriptor | undefined;
};

export const useModalStore = create<Store & StoreActions>((set, get) => ({
  modals: [],
  templates: {},
  enqueue: (slot, modal) =>
    set((state) => {
      if (!state.templates[modal.id]) {
        Logger.Default.error(`No template registered for modal '${modal.id}'`);
      }

      const modals = [...state.modals];
      modals.push(modal);

      // ignore slot if at least one modal is already enqueued
      return {
        slot: modals.length === 1 ? slot : state.slot,
        modals,
      };
    }),
  dequeue: () =>
    set((state) => {
      const modals = [...state.modals];
      modals.pop();

      return {
        modals,
      };
    }),
  reset: () => set({ modals: [] }),
  register: (id: string, template: ModalDescriptor) =>
    set((state) => ({
      templates: {
        ...state.templates,
        [id]: template,
      },
    })),
  describe: (id: string) => get().templates[id],
}));

const selectActions = (state: StoreActions) => ({
  enqueue: state.enqueue,
  dequeue: state.dequeue,
  reset: state.reset,
  register: state.register,
  describe: state.describe,
});

/**
 * Modal API (actions).
 */
export const modalActions = selectActions(useModalStore.getState());

/**
 * Returns the identifier and the slot reference of the current modal.
 * This hook causes a re-render when the underlying value changes.
 */
export function useCurrentModal() {
  return useModalStore((state) => (state.modals.length > 0 ? state.modals[state.modals.length - 1] : undefined));
}

/**
 * Returns the visibility state of the specified modal.
 * This hook causes a re-render when the underlying value changes.
 */
export function useIsCurrentModal(id: string) {
  return useModalStore((state) => state.modals.length > 0 && state.modals[state.modals.length - 1]?.id === id);
}

/**
 * Returns the method to show the modal with the specified parameters.
 */
export function useModal<P extends Record<string, unknown> = Record<string, unknown>>(
  id: string,
  props?: P,
  options?: ModalOptions
) {
  const { open } = useModalActions();
  return () => open<P>(id, props, options);
}

/**
 * Returns methods to open or reset modals.
 */
export function useModalActions() {
  const { enqueue, dequeue, reset } = modalActions;
  const open = useCallback(
    <P extends Record<string, unknown> = Record<string, unknown>>(id: string, props?: P, options?: ModalOptions) => {
      const close = () => {
        if (options?.onClose) {
          options.onClose();
        }
        dequeue();
      };

      enqueue(options?.slot ?? "default", {
        id,
        close,
        className: options?.className,
        props,
      });
    },
    [enqueue, dequeue]
  );

  return { open, reset };
}
