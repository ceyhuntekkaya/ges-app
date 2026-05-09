"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export type TextareaSize = "sm" | "md" | "lg";

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
  textareaSize?: TextareaSize;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  containerClassName?: string;
  required?: boolean;
}

const SIZES: Record<TextareaSize, { wrap: string; textarea: string }> = {
  sm: { wrap: "rounded-[var(--radius-md)] text-xs", textarea: "min-h-[84px] px-2.5 py-2" },
  md: { wrap: "rounded-[var(--radius-md)] text-sm", textarea: "min-h-[96px] px-3 py-2.5" },
  lg: { wrap: "rounded-[var(--radius-lg)] text-sm", textarea: "min-h-[120px] px-3.5 py-3" },
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { textareaSize = "md", label, hint, error, containerClassName, className, disabled, required, id, ...rest },
  ref,
) {
  const generatedId = React.useId();
  const textareaId = id || generatedId;
  const sizeCfg = SIZES[textareaSize];

  return (
    <div className={cn("flex w-full flex-col gap-1.5", containerClassName)}>
      {label ? (
        <label htmlFor={textareaId} className="text-xs font-medium text-[var(--text-secondary)]">
          {label}
          {required ? <span className="ml-1 text-[var(--danger-500)]">*</span> : null}
        </label>
      ) : null}

      <div
        className={cn(
          "group flex w-full overflow-hidden bg-[var(--surface-0)] transition-[box-shadow,border-color]",
          "border",
          error
            ? "border-[var(--danger-500)] focus-within:border-[var(--danger-500)] focus-within:shadow-[var(--ring-danger)]"
            : "border-[var(--border-default)] focus-within:border-[var(--accent-600)] focus-within:shadow-[var(--ring-accent)]",
          disabled && "bg-[var(--surface-2)] text-[var(--text-muted)] cursor-not-allowed",
          sizeCfg.wrap,
        )}
      >
        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          required={required}
          className={cn(
            "w-full resize-y bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
            "outline-none disabled:cursor-not-allowed",
            sizeCfg.textarea,
            className,
          )}
          {...rest}
        />
      </div>

      {error ? (
        <p className="text-xs leading-5 text-[var(--danger-600)]">{error}</p>
      ) : hint ? (
        <p className="text-xs leading-5 text-[var(--text-tertiary)]">{hint}</p>
      ) : null}
    </div>
  );
});

