// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RenderFunction<P = {}> {
  (props: P): React.ReactNode;
  displayName?: string | undefined;
}

/** Properties excluded from React.ComponentProps<> imports. */
export type CommonComponentExcludedProps = "value" | "onChange";

/** Properties applicable to all styled components. */
export interface StyledComponentProps {
  style?: React.CSSProperties | undefined;
  className?: string | undefined;
}

/**
 * Base properties shared by controlled components,
 * i.e. those bound to a specific value and supporting
 * `onValueChange` callback to observe value changes.
 */
export interface ValueComponentProps<T, U = T> {
  /** Bound (controlled) value. */
  value?: T | null;
  /** Invoked when the `value` changes. */
  onValueChange?: (value: U) => void;
  /** Indicates readonly state. */
  readOnly?: boolean;
  /** Indicates disabled (non-interactive) state. */
  disabled?: boolean;
}

export interface RequiredValueComponentProps<T, U = T> {
  /** Bound (controlled) value. */
  value: T;
  /** Invoked when the `value` changes. */
  onValueChange: (value: U) => void;
  /** Indicates readonly state. */
  readOnly?: boolean;
  /** Indicates disabled (non-interactive) state. */
  disabled?: boolean;
}

export type ComponentValue = string | number | ReadonlyArray<string>;

/**
 * Base properties shared by actionable components,
 * typically buttons or button-like components.
 */
export interface ActionableComponentProps {
  /** Associated value. */
  value?: ComponentValue;
  /** Invoked when component action is triggered with the associated `value`. */
  onAction?: (value?: ComponentValue) => void;
  /** Indicates disabled (non-interactive) state. */
  disabled?: boolean;
}
