"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface TabItem<TValue extends string = string> {
  value: TValue;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps<TValue extends string = string> {
  items: TabItem<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  variant?: "underline" | "pill";
  size?: "sm" | "md";
  className?: string;
  /** Stretch each tab to fill available space. */
  fullWidth?: boolean;
}

export function Tabs<TValue extends string = string>({
  items,
  value,
  onChange,
  variant = "underline",
  size = "md",
  className,
  fullWidth = false,
}: TabsProps<TValue>) {
  const heightCls = size === "sm" ? "h-9" : "h-10";
  const textCls = size === "sm" ? "text-xs" : "text-sm";

  if (variant === "pill") {
    return (
      <div
        role="tablist"
        className={cn(
          "inline-flex items-center gap-1 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-1)] p-1",
          className,
        )}
      >
        {items.map((it) => {
          const active = it.value === value;
          return (
            <button
              key={it.value}
              role="tab"
              type="button"
              aria-selected={active}
              disabled={it.disabled}
              onClick={() => onChange(it.value)}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] px-3 font-medium transition-colors",
                heightCls,
                textCls,
                active
                  ? "bg-[var(--surface-0)] text-[var(--text-primary)] shadow-[var(--shadow-xs)]"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]",
                it.disabled && "cursor-not-allowed opacity-50",
                fullWidth && "flex-1",
              )}
            >
              {it.icon}
              {it.label}
              {it.badge}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      className={cn(
        "flex items-end gap-1 border-b border-[var(--border-default)]",
        className,
      )}
    >
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            role="tab"
            type="button"
            aria-selected={active}
            disabled={it.disabled}
            onClick={() => onChange(it.value)}
            className={cn(
              "relative inline-flex items-center justify-center gap-2 px-4 font-medium transition-colors",
              heightCls,
              textCls,
              active
                ? "text-[var(--text-primary)]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]",
              it.disabled && "cursor-not-allowed opacity-50",
              fullWidth && "flex-1",
            )}
          >
            {it.icon}
            {it.label}
            {it.badge}
            {active ? (
              <span
                aria-hidden
                className="absolute inset-x-2 -bottom-px h-[2px] rounded-t-full bg-[var(--accent-600)]"
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
