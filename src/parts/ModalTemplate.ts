import { useEffect } from "react";

import { modalActions } from "./Modal";

import type { ModalComponentProps, ModalDescriptor } from "./Modal";

export type ModalProps<P extends Record<string, unknown> = Record<string, unknown>> = P & ModalComponentProps;

export type ModalTemplateProps<P extends Record<string, unknown>> = {
  id: string;
  render: (props: ModalProps<P>) => React.ReactNode;
  closeButtonVisible?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export const ModalTemplate = <P extends Record<string, unknown> = {}>({ id, ...other }: ModalTemplateProps<P>) => {
  const { register } = modalActions;

  useEffect(() => {
    register(id, {
      closeButtonVisible: other.closeButtonVisible,
      render: other.render as ModalDescriptor["render"],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // this component is only needed to register the modal
  return null;
};
