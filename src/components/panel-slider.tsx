import { AnimatePresence, motion } from "motion/react";
import { isValidElement, useMemo } from "react";
import flattenChildren from "react-keyed-flatten-children";

import { cn } from "../lib/utils";
import { Overlay } from "./overlay";

import type { OverlayProps } from "./overlay";

export interface PanelSliderProps extends OverlayProps {
  className?: string;
  /** Side to display the panels on. */
  side: "top" | "right" | "bottom" | "left";
  /** Size in pixels of the "hidden" panel to be visible. @default 60 */
  overhang?: number;
  /** Animation transition type. @default "anticipate" */
  animation?: "spring" | "linear" | "easeIn" | "easeInOut" | "easeOut" | "anticipate";
}

/** A slide-out animated panels manager. */
export const PanelSlider = ({
  children,
  side,
  backdrop,
  shouldPreventBodyScroll,
  transitionDuration = 500,
  overhang = 60,
  animation = "anticipate",
  className,
  ...props
}: React.PropsWithChildren<PanelSliderProps>) => {
  const horizontal = side === "top" || side === "bottom";

  const transition = useMemo(
    () =>
      ({
        duration: transitionDuration / 1000,
        type: animation === "spring" ? "spring" : "tween",
        ease: animation !== "spring" ? animation : undefined,
      }) as const,
    [animation, transitionDuration]
  );

  const s = side === "left" || side === "top" ? -1 : 1;
  const offset = (v: string) => (horizontal ? { y: v } : { x: v });

  // determine number of visible panels
  const flattenedChildren = flattenChildren(children);
  let count = 0;
  flattenedChildren.forEach((child) => {
    if (child && isValidElement(child)) {
      count++;
    }
  });

  // the first panel must be rendered outside of the AnimatePresence component,
  // since it is part of the parent AnimatePresence component from the Overlay;
  // otherwise, it won't "animate out" when the overlay becomes hidden
  let panelFirst: React.JSX.Element | undefined;
  const panelsRest: Array<React.JSX.Element> = [];

  let i = 0;
  flattenedChildren.forEach((child) => {
    if (child && isValidElement(child)) {
      // determine initial and current (final) position of the panel based
      // on its index and number of panels to display
      const _initial = offset(
        i === 0
          ? `${s * 100}%`
          : i === 1
            ? `${-s * 100}%`
            : s > 0
              ? `calc(-100% - ${overhang}px)`
              : `calc(100% + ${overhang}px)`
      );

      const _current = offset(
        i === count - 1
          ? count === 1
            ? "0"
            : `${-s * overhang}px`
          : i === count - 2
            ? s > 0
              ? `calc(100% - ${overhang}px)`
              : `calc(${overhang}px - 100%)`
            : `${s * 100}%`
      );

      // only apply opacity transition to the subsequent panels
      const initial = i === 0 ? _initial : { opacity: 0, ..._initial };
      const current = i === 0 ? _current : { opacity: 1, ..._current };

      const panel = (
        <motion.div
          className={cn(
            "pointer-events-auto absolute z-10 flex flex-col items-stretch justify-stretch overflow-hidden",
            side === "top" && "top-0 w-full",
            side === "right" && "right-0 h-full",
            side === "bottom" && "bottom-0 w-full",
            side === "left" && "left-0 h-full"
          )}
          key={`panel-${i}`}
          initial={initial}
          animate={current}
          exit={initial}
          transition={transition}>
          <div className={cn("flex h-full flex-auto basis-full overflow-hidden", className)}>{child}</div>
        </motion.div>
      );

      if (i === 0) {
        panelFirst = panel;
      } else {
        panelsRest.push(panel);
      }
      i++;
    }
  });

  return (
    <Overlay
      {...props}
      backdrop={backdrop}
      shouldPreventBodyScroll={shouldPreventBodyScroll || (backdrop != null && backdrop != "none")}
      transitionDuration={transitionDuration}>
      <div className="pointer-events-none fixed inset-0">
        {panelFirst}
        <AnimatePresence>{panelsRest}</AnimatePresence>
      </div>
    </Overlay>
  );
};

PanelSlider.displayName = "PanelSlider";
