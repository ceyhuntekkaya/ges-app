import * as React from "react";
import { cn } from "@/lib/cn";

export type BadgeVariant =
  | "neutral"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "outline";

export type BadgeSize = "sm" | "md";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Render a leading dot indicator. */
  dot?: boolean;
}

const VARIANTS: Record<BadgeVariant, string> = {
  neutral: "bg-[var(--surface-2)] text-[var(--text-secondary)] border-[var(--border-default)]",
  accent: "bg-[var(--accent-50)] text-[var(--accent-700)] border-[var(--accent-100)]",
  success: "bg-[var(--success-50)] text-[var(--success-700)] border-[var(--accent-100)]",
  warning: "bg-[var(--warning-50)] text-[var(--warning-700)] border-[var(--warning-500)]/20",
  danger: "bg-[var(--danger-50)] text-[var(--danger-700)] border-[var(--danger-100)]",
  info: "bg-[var(--info-50)] text-[var(--info-700)] border-[var(--info-500)]/20",
  outline: "bg-transparent text-[var(--text-secondary)] border-[var(--border-default)]",
};

const DOT: Record<BadgeVariant, string> = {
  neutral: "bg-[var(--text-tertiary)]",
  accent: "bg-[var(--accent-600)]",
  success: "bg-[var(--success-500)]",
  warning: "bg-[var(--warning-500)]",
  danger: "bg-[var(--danger-500)]",
  info: "bg-[var(--info-500)]",
  outline: "bg-[var(--text-tertiary)]",
};

const SIZES: Record<BadgeSize, string> = {
  sm: "text-[11px] leading-none px-2 py-0.5 gap-1",
  md: "text-xs leading-none px-2.5 py-1 gap-1.5",
};

export function Badge({
  variant = "neutral",
  size = "md",
  dot = false,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium tabular-nums",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {dot ? <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", DOT[variant])} /> : null}
      {children}
    </span>
  );
}
