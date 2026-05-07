"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  label?: React.ReactNode;
  description?: React.ReactNode;
  /** Place the label/description on the left side. */
  reverse?: boolean;
  id?: string;
  name?: string;
  className?: string;
  "aria-label"?: string;
}

const TRACK_SIZES = {
  sm: "h-4 w-7",
  md: "h-5 w-9",
} as const;

const THUMB_SIZES = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
} as const;

const THUMB_TRANSLATE = {
  sm: "translate-x-3",
  md: "translate-x-4",
} as const;

export function Switch({
  checked,
  onChange,
  disabled,
  size = "md",
  label,
  description,
  reverse = false,
  id,
  name,
  className,
  "aria-label": ariaLabel,
}: SwitchProps) {
  const inputId = React.useId();
  const reactiveId = id || inputId;

  const control = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      id={reactiveId}
      name={name}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors",
        "outline-none focus-visible:shadow-[var(--ring-accent)]",
        TRACK_SIZES[size],
        checked ? "bg-[var(--accent-600)]" : "bg-[var(--surface-3)]",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span
        className={cn(
          "inline-block translate-x-0.5 rounded-full bg-white shadow-[var(--shadow-xs)] transition-transform",
          THUMB_SIZES[size],
          checked && THUMB_TRANSLATE[size],
        )}
      />
    </button>
  );

  if (!label && !description) {
    return <div className={cn("inline-flex", className)}>{control}</div>;
  }

  return (
    <label
      htmlFor={reactiveId}
      className={cn(
        "inline-flex select-none items-start gap-3",
        reverse && "flex-row-reverse",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        className,
      )}
    >
      {control}
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
