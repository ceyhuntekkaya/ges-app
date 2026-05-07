"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

export type InputSize = "sm" | "md" | "lg";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "prefix"> {
  /** Visual size of the field. */
  inputSize?: InputSize;
  /** Optional label rendered above the input. */
  label?: React.ReactNode;
  /** Helper / hint text rendered below the input. */
  hint?: React.ReactNode;
  /** Error message; when set the field renders in error state and replaces hint. */
  error?: React.ReactNode;
  /** Element rendered inside the field on the left (e.g. an icon). */
  leftIcon?: React.ReactNode;
  /** Element rendered inside the field on the right (e.g. an icon). */
  rightIcon?: React.ReactNode;
  /** Static prefix label (e.g. "https://"). */
  prefix?: React.ReactNode;
  /** Static suffix label (e.g. ".com"). */
  suffix?: React.ReactNode;
  /** Render a small "x" button when the field has a value. */
  clearable?: boolean;
  /** Called when the user clicks the clear button. */
  onClear?: () => void;
  /** Wrap the field with extra classes (e.g. width). */
  containerClassName?: string;
  /** Required indicator next to label. */
  required?: boolean;
}

const SIZES: Record<InputSize, { wrap: string; input: string; icon: number }> = {
  sm: {
    wrap: "h-8 rounded-[var(--radius-md)] text-xs",
    input: "px-2.5",
    icon: 14,
  },
  md: {
    wrap: "h-9 rounded-[var(--radius-md)] text-sm",
    input: "px-3",
    icon: 16,
  },
  lg: {
    wrap: "h-11 rounded-[var(--radius-lg)] text-sm",
    input: "px-3.5",
    icon: 18,
  },
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    inputSize = "md",
    label,
    hint,
    error,
    leftIcon,
    rightIcon,
    prefix,
    suffix,
    clearable,
    onClear,
    containerClassName,
    className,
    disabled,
    required,
    id,
    value,
    defaultValue,
    onChange,
    ...rest
  },
  ref,
) {
  const generatedId = React.useId();
  const inputId = id || generatedId;

  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "");
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) setInternalValue(e.target.value);
    onChange?.(e);
  };

  const showClear =
    clearable &&
    !disabled &&
    currentValue !== undefined &&
    currentValue !== null &&
    String(currentValue).length > 0;

  const sizeCfg = SIZES[inputSize];

  return (
    <div className={cn("flex w-full flex-col gap-1.5", containerClassName)}>
      {label ? (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-[var(--text-secondary)]"
        >
          {label}
          {required ? <span className="ml-1 text-[var(--danger-500)]">*</span> : null}
        </label>
      ) : null}

      <div
        className={cn(
          "group flex w-full items-stretch overflow-hidden bg-[var(--surface-0)] transition-[box-shadow,border-color]",
          "border",
          error
            ? "border-[var(--danger-500)] focus-within:border-[var(--danger-500)] focus-within:shadow-[var(--ring-danger)]"
            : "border-[var(--border-default)] focus-within:border-[var(--accent-600)] focus-within:shadow-[var(--ring-accent)]",
          disabled && "bg-[var(--surface-2)] text-[var(--text-muted)] cursor-not-allowed",
          sizeCfg.wrap,
        )}
      >
        {prefix ? (
          <span className="flex items-center border-r border-[var(--border-default)] bg-[var(--surface-2)] px-2.5 text-[var(--text-tertiary)]">
            {prefix}
          </span>
        ) : null}

        {leftIcon ? (
          <span
            className="flex shrink-0 items-center pl-3 text-[var(--text-tertiary)]"
            aria-hidden
          >
            {leftIcon}
          </span>
        ) : null}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          required={required}
          value={isControlled ? value : undefined}
          defaultValue={isControlled ? undefined : defaultValue}
          onChange={handleChange}
          className={cn(
            "flex-1 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
            "outline-none disabled:cursor-not-allowed",
            "min-w-0",
            sizeCfg.input,
            !!leftIcon && "pl-2",
            !!(rightIcon || showClear) && "pr-2",
            className,
          )}
          {...rest}
        />

        {showClear ? (
          <button
            type="button"
            tabIndex={-1}
            aria-label="Temizle"
            onClick={() => {
              if (!isControlled) setInternalValue("");
              onClear?.();
            }}
            className="mr-1 flex h-6 w-6 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-secondary)]"
          >
            <Icon name="x" size={12} />
          </button>
        ) : null}

        {rightIcon ? (
          <span
            className="flex shrink-0 items-center pr-3 text-[var(--text-tertiary)]"
            aria-hidden
          >
            {rightIcon}
          </span>
        ) : null}

        {suffix ? (
          <span className="flex items-center border-l border-[var(--border-default)] bg-[var(--surface-2)] px-2.5 text-[var(--text-tertiary)]">
            {suffix}
          </span>
        ) : null}
      </div>

      {error ? (
        <p className="text-xs leading-5 text-[var(--danger-600)]">{error}</p>
      ) : hint ? (
        <p className="text-xs leading-5 text-[var(--text-tertiary)]">{hint}</p>
      ) : null}
    </div>
  );
});
