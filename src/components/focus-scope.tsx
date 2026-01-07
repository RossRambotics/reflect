import { FocusScope as RadixFocusScope } from "@radix-ui/react-focus-scope";

import { cn } from "../lib/utils";

interface FocusScopeProps {
  className?: string;
  /** Capture focus when visible and revert on close. */
  shouldCaptureFocus?: boolean;
}

/** A boundary for focus capturing. */
export const FocusScope = ({ children, className, shouldCaptureFocus }: React.PropsWithChildren<FocusScopeProps>) => (
  <RadixFocusScope
    trapped={shouldCaptureFocus}
    className={cn("flex flex-col overflow-hidden", className)}>
    {children}
  </RadixFocusScope>
);

FocusScope.displayName = "FocusScope";
