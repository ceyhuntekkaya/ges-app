"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";

export type ToastTone = "success" | "error" | "info" | "warning";

export interface ToastInput {
  title: React.ReactNode;
  description?: React.ReactNode;
  tone?: ToastTone;
  /** Auto-dismiss duration in ms. 0 disables auto-dismiss. */
  duration?: number;
}

interface ToastItem extends ToastInput {
  id: string;
}

interface ToastContextValue {
  push: (input: ToastInput) => string;
  success: (input: Omit<ToastInput, "tone">) => string;
  error: (input: Omit<ToastInput, "tone">) => string;
  info: (input: Omit<ToastInput, "tone">) => string;
  warning: (input: Omit<ToastInput, "tone">) => string;
  dismiss: (id: string) => void;
}

const Ctx = React.createContext<ToastContextValue | null>(null);

const TONE_ICON: Record<ToastTone, IconName> = {
  success: "success",
  error: "alert",
  info: "info",
  warning: "warning",
};

const TONE_STYLE: Record<ToastTone, { bar: string; iconBg: string; iconColor: string }> = {
  success: {
    bar: "bg-[var(--success-500)]",
    iconBg: "bg-[var(--success-50)]",
    iconColor: "text-[var(--success-700)]",
  },
  error: {
    bar: "bg-[var(--danger-500)]",
    iconBg: "bg-[var(--danger-50)]",
    iconColor: "text-[var(--danger-600)]",
  },
  info: {
    bar: "bg-[var(--info-500)]",
    iconBg: "bg-[var(--info-50)]",
    iconColor: "text-[var(--info-700)]",
  },
  warning: {
    bar: "bg-[var(--warning-500)]",
    iconBg: "bg-[var(--warning-50)]",
    iconColor: "text-[var(--warning-700)]",
  },
};

let counter = 0;
const nextId = () => `t_${Date.now()}_${++counter}`;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const [mounted, setMounted] = React.useState(false);

  // SSR guard: portal mount; intentional one-shot setState on mount.
  React.useEffect(() => setMounted(true), []);

  const dismiss = React.useCallback((id: string) => {
    setItems((arr) => arr.filter((t) => t.id !== id));
  }, []);

  const push = React.useCallback(
    (input: ToastInput) => {
      const id = nextId();
      const item: ToastItem = {
        id,
        tone: "info",
        duration: 4000,
        ...input,
      };
      setItems((arr) => [...arr, item]);
      if (item.duration && item.duration > 0) {
        setTimeout(() => dismiss(id), item.duration);
      }
      return id;
    },
    [dismiss],
  );

  const value = React.useMemo<ToastContextValue>(
    () => ({
      push,
      dismiss,
      success: (i) => push({ ...i, tone: "success" }),
      error: (i) => push({ ...i, tone: "error" }),
      info: (i) => push({ ...i, tone: "info" }),
      warning: (i) => push({ ...i, tone: "warning" }),
    }),
    [push, dismiss],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {mounted
        ? createPortal(
            <div
              aria-live="polite"
              aria-atomic="false"
              className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2"
            >
              {items.map((t) => {
                const tone = t.tone ?? "info";
                const style = TONE_STYLE[tone];
                return (
                  <div
                    key={t.id}
                    role="status"
                    className={cn(
                      "pointer-events-auto relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] shadow-[var(--shadow-md)]",
                    )}
                    style={{ animation: "ges-slide-up 180ms ease-out" }}
                  >
                    <span
                      aria-hidden
                      className={cn("absolute left-0 top-0 h-full w-1", style.bar)}
                    />
                    <div className="flex items-start gap-3 px-4 py-3 pl-5">
                      <span
                        className={cn(
                          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                          style.iconBg,
                          style.iconColor,
                        )}
                      >
                        <Icon name={TONE_ICON[tone]} size={14} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {t.title}
                        </p>
                        {t.description ? (
                          <p className="mt-0.5 text-xs leading-5 text-[var(--text-tertiary)]">
                            {t.description}
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        aria-label="Kapat"
                        onClick={() => dismiss(t.id)}
                        className="ml-1 mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-secondary)]"
                      >
                        <Icon name="x" size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </Ctx.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = React.useContext(Ctx);
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return ctx;
}
