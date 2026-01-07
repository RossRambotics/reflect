import useResizeObserver from "use-resize-observer";

/** Rounds pixel value based on the device-pixel ratio */
function roundDPR(v: number) {
  const unit = typeof window !== "undefined" ? (window.devicePixelRatio ?? 1) : 1;
  return unit === 1 ? Math.round(v) : Math.round(v / unit) * unit;
}

export type BoxOptions = "border-box" | "content-box" | "device-pixel-content-box";

/**
 * Hook that tracks element size.
 *
 * @param ref element reference
 */
export function useElementSize<T extends Element>(
  ref?: React.RefObject<T | null> | T | null | undefined,
  box?: BoxOptions,
  onResize?: ({ width, height }: { width: number | undefined; height: number | undefined }) => void
) {
  const {
    ref: callbackRef,
    width = 0,
    height = 0,
  } = useResizeObserver<T>({
    ref: ref as React.RefObject<T> | T | null | undefined,
    box,
    onResize,
    round: roundDPR,
  });

  return { ref: callbackRef, width, height };
}
