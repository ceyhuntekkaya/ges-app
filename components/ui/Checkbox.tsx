"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

export interface CheckboxProps {
  checked: boolean;
  onChange?: (next: boolean) => void;
  indeterminate?: boolean;
  disabled?: boolean;
  size?: "sm" | "md";
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: boolean;
  id?: string;
  name?: string;
  className?: string;
  "aria-label"?: string;
}

const SIZES = {
  sm: "h-4 w-4 rounded-[5px]",
  md: "h-[18px] w-[18px] rounded-[6px]",
} as const;

export function Checkbox({
  checked,
  onChange,
  indeterminate,
  disabled,
  size = "md",
  label,
  description,
  error,
  id,
  name,
  className,
  "aria-label": ariaLabel,
}: CheckboxProps) {
  const ref = React.useRef<HTMLInputElement>(null);
  const inputId = React.useId();
  const reactiveId = id || inputId;

  React.useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = !!indeterminate && !checked;
    }
  }, [indeterminate, checked]);

  const visual = (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center border transition-colors",
        SIZES[size],
        checked || indeterminate
          ? "bg-[var(--accent-600)] border-[var(--accent-600)] text-white"
          : "bg-[var(--surface-0)] border-[var(--border-strong)]",
        error && !(checked || indeterminate) && "border-[var(--danger-500)]",
        disabled && "opacity-50",
      )}
    >
      {indeterminate && !checked ? (
        <span className="block h-[2px] w-[10px] rounded-full bg-white" />
      ) : checked ? (
        <Icon name="check" size={size === "sm" ? 12 : 14} strokeWidth={2.4} />
      ) : null}
    </span>
  );

  const inputEl = (
    <input
      ref={ref}
      type="checkbox"
      id={reactiveId}
      name={name}
      disabled={disabled}
      checked={checked}
      onChange={(e) => onChange?.(e.target.checked)}
      aria-label={ariaLabel}
      aria-checked={indeterminate ? "mixed" : checked}
      className="absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 opacity-0"
    />
  );

  if (!label && !description) {
    return (
      <span className={cn("relative inline-flex items-center", className)}>
        {inputEl}
        {visual}
      </span>
    );
  }

  return (
    <label
      htmlFor={reactiveId}
      className={cn(
        "inline-flex select-none items-start gap-2.5",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        className,
      )}
    >
      {inputEl}
      <span className="mt-0.5">{visual}</span>
      <span className="flex flex-col">
        {label ? (
          <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
        ) : null}
        {description ? (
          <span className="text-xs leading-5 text-[var(--text-tertiary)]">{description}</span>
        ) : null}
      </span>
    </label>
  );
}
