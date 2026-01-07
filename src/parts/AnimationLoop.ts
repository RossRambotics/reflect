import { useEffect } from "react";

export type AnimationFrameCallback = (deltaMilliseconds: number) => void;

type Interval = {
  /** Duration in milliseconds */
  duration: number;
  /** Timestamp of previous frame */
  previousTimestamp: number;
};

const observers = new Map<AnimationFrameCallback, Interval | undefined>();

let raf: ReturnType<typeof requestAnimationFrame> | undefined;
let previousTimestamp = 0;

const handleFrame: FrameRequestCallback = (timestamp) => {
  timestamp ??= 0; // first frame

  const globalDelta = timestamp - previousTimestamp;
  previousTimestamp = timestamp;

  for (const [callback, interval] of observers) {
    if (interval == null) {
      callback(globalDelta);
    } else {
      const observerDelta = timestamp - interval.previousTimestamp;
      if (observerDelta >= interval.duration) {
        callback(observerDelta);
        interval.previousTimestamp = timestamp - (observerDelta % interval.duration);
      }
    }
  }

  requestFrame();
};

const requestFrame = (initial?: boolean): void => {
  if (initial && raf != null) {
    return;
  }

  raf = requestAnimationFrame(handleFrame);
};

const stopRequestingFrames = (): void => {
  if (raf == null) {
    return;
  }

  cancelAnimationFrame(raf);
  raf = undefined;
  previousTimestamp = 0;
};

const register = (callback: AnimationFrameCallback, interval: Interval | undefined) => {
  observers.set(callback, interval);

  // start the loop once we have the first observer added
  if (observers.size === 1) {
    requestFrame(true);
  }
};

const unregister = (callback: AnimationFrameCallback) => {
  observers.delete(callback);

  // stop the loop once we have all observers removed
  if (observers.size === 0) {
    stopRequestingFrames();
  }
};

const createInterval = (fps: number): Interval => ({
  duration: 1000 / fps,
  previousTimestamp: 0,
});

/**
 * A hook that runs an animation loop shared by multiple observers.
 *
 * Calling this hook installs an observer `callback` to be invoked at
 * every animation frame. Default invocation rate is 60 fps unless
 * overridden by the `fps` parameter.
 *
 * The callback must be a stable reference. Subscription is established
 * for each unique callback value.
 *
 * @param callback Callback invoked on each animation frame
 * @param fps Frames per second
 */
export function useAnimationLoop(callback: AnimationFrameCallback, fps?: number): void {
  useEffect(() => {
    register(callback, fps ? createInterval(fps) : undefined);
    callback(0); // invoke once immediately
    return () => unregister(callback);
  }, [callback, fps]);
}
