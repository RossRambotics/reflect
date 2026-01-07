import { FocusScope } from "@radix-ui/react-focus-scope";
import { AnimatePresence, motion } from "motion/react";
import { createContext, use, useCallback, useEffect, useMemo } from "react";
import { useFocusWithin, usePreventScroll } from "react-aria";

import { cn } from "../lib/utils";
import { Portal } from "./portal";

export type OverlayContextValue = {
  close: () => void;
};

export const OverlayContext = createContext<OverlayContextValue | null>(null);

/** Hook that returns current overlay context value. */
export function useOverlayContext() {
  const cx = use(OverlayContext);
  if (cx == null) {
    throw new Error("useOverlayContext must be used within <Overlay />");
  }
  return cx;
}

const animate = {
  from: { opacity: 0 },
  to: { opacity: 1 },
};

type OverlayWrapperProps = Pick<
  OverlayProps,
  "shouldCloseOnBlur" | "shouldCaptureFocus" | "shouldPreventBodyScroll"
> & {
  close: () => void;
};

const OverlayWrapper = ({
  children,
  shouldCloseOnBlur,
  shouldCaptureFocus,
  shouldPreventBodyScroll,
  close,
}: React.PropsWithChildren<OverlayWrapperProps>) => {
  usePreventScroll({ isDisabled: !shouldPreventBodyScroll });

  const { focusWithinProps } = useFocusWithin({
    isDisabled: !shouldCloseOnBlur,
    onBlurWithin: close,
  });

  return (
    <FocusScope
      loop={true}
      trapped={shouldCaptureFocus}
      {...focusWithinProps}>
      {children}
    </FocusScope>
  );
};

export interface OverlayProps {
  className?: string;
  /** Controls overlay visibility. */
  visible?: boolean;
  /** Backdrop style. Focus is automatically trapped when backdrop is used. */
  backdrop?: "none" | "default" | "blur";
  /** Capture focus when visible and revert on close. */
  shouldCaptureFocus?: boolean;
  /** Close when focus leaves the component. */
  shouldCloseOnBlur?: boolean;
  /** Close when user presses `Esc` key. @default `true` */
  shouldCloseOnEsc?: boolean;
  /** Close when user interacts outside of the component. @default `true` */
  shouldCloseOnOutsideInteraction?: boolean;
  /** Disable body scrolling when overlay is visible. */
  shouldPreventBodyScroll?: boolean;
  /** Invoked when user presses `Esc` key and {@link shouldCloseOnEsc} is `true`. */
  onCloseOnEsc?: (close: () => void) => void;
  /** Invoked when overlay requests to close itself. */
  onClosing?: () => void;
  /** Duration of the animated transition in milliseconds. */
  transitionDuration?: number;
}

/** Behavior managing components residing in the modal overlay layer, e.g. dialogs. */
export const Overlay = ({
  children,
  className,
  visible,
  backdrop,
  shouldCaptureFocus,
  shouldCloseOnBlur,
  shouldCloseOnEsc = true,
  shouldPreventBodyScroll,
  shouldCloseOnOutsideInteraction = true,
  onCloseOnEsc,
  onClosing,
  transitionDuration = 200,
}: React.PropsWithChildren<OverlayProps>) => {
  // allows component to close itself
  const close = useCallback(() => {
    if (visible && typeof onClosing === "function") {
      onClosing();
    }
  }, [visible, onClosing]);

  const contextValue = useMemo(
    () => ({
      close,
    }),
    [close]
  );

  // close on Escape key
  // if the onCloseOnEsc callback is defined then invoke it and let
  // it deal with hiding via `close` argument, otherwise just try to
  // forcibly close the overlay
  useEffect(() => {
    if (shouldCloseOnEsc && visible) {
      const onKeyUp = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          if (typeof onCloseOnEsc === "function") {
            onCloseOnEsc(close);
          } else {
            close();
          }
        }
      };

      document.addEventListener("keyup", onKeyUp, { capture: true });
      return () => document.removeEventListener("keyup", onKeyUp, { capture: true });
    }
  }, [shouldCloseOnEsc, onCloseOnEsc, close, visible]);

  const transition = useMemo(() => ({ duration: transitionDuration / 1000 }), [transitionDuration]);
  const hasBackdrop = backdrop != null && backdrop !== "none";

  return (
    <Portal type="overlay">
      <AnimatePresence>
        {visible && (
          <motion.div
            key="overlay"
            initial={animate.from}
            animate={animate.to}
            exit={animate.from}
            transition={transition}
            className={cn("fixed inset-0 z-overlay", className)}>
            <OverlayContext.Provider value={contextValue}>
              <>
                {(hasBackdrop || shouldCloseOnOutsideInteraction) && (
                  <div
                    className={cn(
                      "pointer-events-auto fixed inset-0 overflow-hidden",
                      backdrop === "default" && "bg-background/80",
                      backdrop === "blur" && "bg-background/80 backdrop-blur-sm"
                    )}
                    onClick={shouldCloseOnOutsideInteraction ? close : undefined}
                  />
                )}
                <OverlayWrapper
                  shouldCloseOnBlur={shouldCloseOnBlur}
                  shouldPreventBodyScroll={shouldPreventBodyScroll}
                  shouldCaptureFocus={hasBackdrop || shouldCaptureFocus}
                  close={close}>
                  {children}
                </OverlayWrapper>
              </>
            </OverlayContext.Provider>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
};

Overlay.displayName = "Overlay";
