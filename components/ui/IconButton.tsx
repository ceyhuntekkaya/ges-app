"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

export type IconButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type IconButtonSize = "sm" | "md" | "lg";

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Required for accessibility. */
  "aria-label": string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  loading?: boolean;
  icon: React.ReactNode;
}

const VARIANTS: Record<IconButtonVariant, string> = {
  primary:
    "bg-[var(--accent-600)] text-white hover:bg-[var(--accent-700)] focus-visible:shadow-[var(--ring-accent)]",
  secondary:
    "bg-[var(--surface-0)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] focus-visible:shadow-[var(--ring-neutral)]",
  ghost:
    "bg-transparent text-[var(--text-tertiary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] focus-visible:shadow-[var(--ring-neutral)]",
  danger:
    "bg-transparent text-[var(--danger-600)] hover:bg-[var(--danger-50)] focus-visible:shadow-[var(--ring-danger)]",
};

const SIZES: Record<IconButtonSize, string> = {
  sm: "h-7 w-7 rounded-[var(--radius-sm)]",
  md: "h-9 w-9 rounded-[var(--radius-md)]",
  lg: "h-10 w-10 rounded-[var(--radius-md)]",
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { variant = "ghost", size = "md", loading, icon, disabled, className, type = "button", ...rest },
  ref,
) {
  const isDisabled = disabled || loading;
  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={cn(
        "inline-flex items-center justify-center transition-[background,color,box-shadow] duration-150 outline-none focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {loading ? <Icon name="loader" size={16} /> : icon}
    </button>
  );
});
