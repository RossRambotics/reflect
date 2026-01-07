import { Children, isValidElement } from "react";

import type { ReactElement } from "react";

/** Determines whether children array has at least one non empty child. */
export function hasChildContent(children: React.ReactNode) {
  if (typeof children === "string" || typeof children === "number") {
    return true;
  }

  let hasContent = false;
  Children.forEach(children, (element) => {
    hasContent = hasContent || element != null;
  });

  return hasContent;
}

/** Determines whether an argument is a valid React element of the specified internal type. */
export const isElementOfType = <P>(element: React.ReactNode, typeName: string): element is ReactElement<P> =>
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  isValidElement(element) && element.type && element.type.__typeName__ === typeName;
