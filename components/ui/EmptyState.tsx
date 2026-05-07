import * as React from "react";
import { cn } from "@/lib/cn";

export interface EmptyStateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: "py-8",
  md: "py-12",
  lg: "py-16",
} as const;

export function EmptyState({
  icon,
  title,
  description,
  action,
  size = "md",
  className,
  ...rest
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center px-6 text-center",
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {icon ? (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--text-tertiary)]">
          {icon}
        </div>
      ) : null}
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-xs leading-5 text-[var(--text-tertiary)]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
