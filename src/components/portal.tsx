import { createPortal } from "react-dom";

import { getGlobalRoot } from "../hooks/useGlobalRoot";

// [!] be aware of possible unexpected interactions related
// to the way bubbled up events are handled
// see: https://github.com/facebook/react/issues/19637

export interface PortalProps {
  /** Element where portal should be rendered. Default is to create new <div> element within a global root. */
  target?: HTMLElement | string;
  /** Portal type (for debugging purposes). */
  type?: string;
  /** Component reference. */
  ref?: React.Ref<HTMLDivElement | null>;
}

export const Portal = ({ ref, children, target, type }: React.PropsWithChildren<PortalProps>) => {
  const container = (typeof target === "string" ? document.querySelector(target) : target) ?? getGlobalRoot("portal");
  return createPortal(
    <div
      ref={ref}
      data-portal={type}>
      {children}
    </div>,
    container
  );
};

Portal.displayName = "Portal";
