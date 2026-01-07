import { ChevronDown, ChevronUp } from "lucide-react";
import { useRef } from "react";
import { useButton, useLocale, useNumberField } from "react-aria";
import { useNumberFieldState } from "react-stately";

import { Input } from "./input";

import type { AriaButtonProps, AriaNumberFieldProps } from "react-aria";

const StepButton = ({
  direction,
  ...props
}: AriaButtonProps & {
  direction: "up" | "down";
}) => {
  const ref = useRef<HTMLButtonElement>(null);
  const { buttonProps } = useButton(props, ref);

  return (
    <button
      {...buttonProps}
      className="flex items-center px-1 outline-hidden enabled:hover:bg-secondary enabled:focus:bg-secondary disabled:text-muted">
      {direction === "up" ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
    </button>
  );
};

export interface InputNumberProps extends AriaNumberFieldProps {
  /** Step up/down button visibility. */
  stepperVisible?: boolean;
  /** Component reference. */
  ref?: React.Ref<HTMLInputElement | null>;
}

export const InputNumber = ({ stepperVisible = true, ...props }: InputNumberProps) => {
  const { locale } = useLocale();
  const state = useNumberFieldState({ ...props, locale });
  const inputRef = useRef<HTMLInputElement>(null);
  const { groupProps, inputProps, incrementButtonProps, decrementButtonProps } = useNumberField(props, state, inputRef);

  return (
    <div
      className="relative"
      {...groupProps}>
      <Input
        ref={inputRef}
        {...inputProps}
      />
      {stepperVisible && (
        <div className="absolute top-0 right-0 bottom-0 m-px grid grid-rows-2 overflow-hidden rounded-r-md border-l border-input bg-background">
          <StepButton
            direction="up"
            {...incrementButtonProps}
          />
          <StepButton
            direction="down"
            {...decrementButtonProps}
          />
        </div>
      )}
    </div>
  );
};

InputNumber.displayName = "InputNumber";
