import * as React from "react";
import { cn } from "@/lib/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
  bordered?: boolean;
  /** Apply soft shadow. */
  elevated?: boolean;
  /** Decorative emerald gradient halo on top. */
  highlighted?: boolean;
}

const PADDING: Record<NonNullable<CardProps["padding"]>, string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-5",
  lg: "p-7",
};

export function Card({
  padding = "md",
  bordered = true,
  elevated = false,
  highlighted = false,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        "relative bg-[var(--surface-0)] rounded-[var(--radius-xl)]",
        bordered && "border border-[var(--border-default)]",
        elevated ? "shadow-[var(--shadow-md)]" : "shadow-[var(--shadow-xs)]",
        PADDING[padding],
        className,
      )}
      {...rest}
    >
      {highlighted ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[var(--accent-500)]/40 to-transparent"
        />
      ) : null}
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...rest }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-base font-semibold tracking-tight text-[var(--text-primary)]", className)}
      {...rest}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...rest }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm leading-6 text-[var(--text-tertiary)]", className)} {...rest}>
      {children}
    </p>
  );
}

export function CardFooter({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mt-5 flex items-center justify-end gap-2 border-t border-[var(--border-subtle)] pt-4",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
