"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "prefix"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--accent-600)] text-white shadow-[var(--shadow-xs)] hover:bg-[var(--accent-700)] active:bg-[var(--accent-800)] disabled:bg-[var(--accent-600)]/40",
  secondary:
    "bg-[var(--surface-0)] text-[var(--text-primary)] border border-[var(--border-default)] shadow-[var(--shadow-xs)] hover:bg-[var(--surface-2)] hover:border-[var(--border-strong)] disabled:text-[var(--text-muted)]",
  outline:
    "bg-transparent text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-[var(--surface-2)] hover:border-[var(--border-strong)] disabled:text-[var(--text-muted)]",
  ghost:
    "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] disabled:text-[var(--text-muted)]",
  danger:
    "bg-[var(--danger-600)] text-white shadow-[var(--shadow-xs)] hover:bg-[var(--danger-700)] disabled:bg-[var(--danger-600)]/40",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-[var(--radius-md)]",
  md: "h-9 px-3.5 text-sm gap-2 rounded-[var(--radius-md)]",
  lg: "h-11 px-5 text-sm gap-2 rounded-[var(--radius-lg)]",
};

const FOCUS_RING: Record<ButtonVariant, string> = {
  primary: "focus-visible:shadow-[var(--ring-accent)]",
  secondary: "focus-visible:shadow-[var(--ring-neutral)]",
  outline: "focus-visible:shadow-[var(--ring-neutral)]",
  ghost: "focus-visible:shadow-[var(--ring-neutral)]",
  danger: "focus-visible:shadow-[var(--ring-danger)]",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    className,
    children,
    disabled,
    type = "button",
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;
  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        "relative inline-flex items-center justify-center font-medium select-none whitespace-nowrap",
        "transition-[background,color,box-shadow,transform] duration-150",
        "outline-none focus-visible:outline-none",
        "disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        FOCUS_RING[variant],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Icon name="loader" size={size === "sm" ? 14 : 16} />
      ) : leftIcon ? (
        <span className="inline-flex shrink-0 items-center">{leftIcon}</span>
      ) : null}
      {children}
      {!loading && rightIcon ? (
        <span className="inline-flex shrink-0 items-center">{rightIcon}</span>
      ) : null}
    </button>
  );
});
