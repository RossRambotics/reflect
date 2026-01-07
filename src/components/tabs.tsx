import { createContext, isValidElement, use, useCallback, useMemo } from "react";
import flattenChildren from "react-keyed-flatten-children";

import { warning } from "@2702rebels/logger";

import { isElementOfType } from "../lib/react";
import { cn } from "../lib/utils";
import { TruncateText } from "./truncate-text";

import type { ValueComponentProps } from "../lib/types";

const TabsContextDefaultValue: {
  select: (v: string, event?: React.SyntheticEvent) => void;
  selected?: string | null;
  disabled: boolean;
} = {
  select: () => {},
  selected: undefined,
  disabled: false,
};

const TabsContext = createContext(TabsContextDefaultValue);

/** An item within `Tabs`. */
export const TabItem = ({
  className,
  value,
  children,
  disabled,
}: React.ComponentProps<"button"> & {
  value?: string | null;
}) => {
  const cx = use(TabsContext);
  warning(cx != null, "<Tabs.Item /> must be used within <Tabs />");

  const { select, selected, disabled: parentDisabled } = cx;
  const onClick = useCallback(
    (event: React.SyntheticEvent) => {
      if (value != null) {
        select(value, event);
      }
    },
    [select, value]
  );

  disabled = disabled || parentDisabled;
  return (
    <button
      className={cn(
        "relative flex cursor-pointer flex-nowrap items-center justify-center px-3 text-center font-medium text-muted-foreground outline-none select-none hover:not-disabled:text-accent-foreground focus-visible:text-accent-foreground disabled:pointer-events-none disabled:cursor-default disabled:opacity-60 aria-selected:text-accent-foreground",
        className
      )}
      type="button"
      role="tab"
      aria-selected={value === selected}
      onClick={!disabled && value != null ? onClick : undefined}
      disabled={disabled}>
      {isValidElement(children) ? children : <TruncateText>{children}</TruncateText>}
    </button>
  );
};

TabItem.displayName = "TabItem";
TabItem.__typeName__ = "TabItem";

export interface TabsProps extends React.ComponentProps<"div">, ValueComponentProps<string> {
  /** Variant. @default "default" */
  variant?: "default" | "compact";
  /** Indicates disabled (non-interactive) state. */
  disabled?: boolean;
  /** Placement of the current tab selector. @default "bottom" */
  placement?: "top" | "bottom";
  /** Indicates borderless style. */
  borderless?: boolean;
}

/** A container of `Tab` items. */
export const Tabs = ({
  children,
  className,
  variant = "default",
  disabled,
  value,
  onValueChange,
  placement = "bottom",
  borderless,
  ...props
}: TabsProps) => {
  const indices = useMemo(() => {
    const map = new Map<string, number>();
    flattenChildren(children).forEach((child) => {
      if (isElementOfType<React.ComponentProps<typeof TabItem>>(child, TabItem.__typeName__)) {
        if (child.props.value != null) {
          if (map.has(child.props.value)) {
            warning(false, "Duplicate `key` in two or more <Tabs.Item /> components");
          } else {
            map.set(child.props.value, map.size);
          }
        }
      } else if (child != null) {
        warning(false, "Only <Tabs.Item /> components are allowed as children of <Tabs />");
      }
    });
    return map;
  }, [children]);

  const selectedIndex = value != null ? indices.get(value) : undefined;
  const factor = indices.size > 0 ? 1 / indices.size : 0;

  const contextValue = useMemo(
    () =>
      ({
        select: (key) => onValueChange?.(key),
        selected: value,
        disabled: disabled ?? false,
      }) satisfies typeof TabsContextDefaultValue,
    [value, onValueChange, disabled]
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <div
        className={cn("flex h-9 flex-none flex-row justify-stretch", className)}
        role="tablist"
        {...props}>
        <div className="relative grid flex-auto auto-cols-fr grid-flow-col">
          {children}
          {factor > 0 && (
            <div
              className={cn(
                "absolute h-0.5 transition-[left] duration-200 after:block after:h-full after:w-full after:rounded-full after:bg-accent",
                borderless
                  ? placement === "top"
                    ? "top-0"
                    : "bottom-0"
                  : placement === "top"
                    ? "-top-px"
                    : "-bottom-px",
                variant === "compact" && "h-1 after:mx-auto after:my-0 after:max-w-7.5"
              )}
              aria-hidden
              style={{
                opacity: selectedIndex != null ? 1 : 0,
                width: `${factor * 100}%`,
                left: selectedIndex != null ? `${factor * 100 * selectedIndex}%` : 0,
              }}
            />
          )}
        </div>
      </div>
    </TabsContext.Provider>
  );
};

Tabs.displayName = "Tabs";

/** An item within `Tabs`. */
Tabs.Item = TabItem;
