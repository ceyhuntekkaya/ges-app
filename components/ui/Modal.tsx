"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";
import { IconButton } from "./IconButton";

export type ModalSize = "sm" | "md" | "lg" | "xl";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  size?: ModalSize;
  /** Footer (typically action buttons). */
  footer?: React.ReactNode;
  /** Close when clicking the backdrop. */
  closeOnOverlay?: boolean;
  /** Close on Escape. */
  closeOnEsc?: boolean;
  /** Hide the X button in the header. */
  hideCloseButton?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const SIZES: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  footer,
  closeOnOverlay = true,
  closeOnEsc = true,
  hideCloseButton = false,
  className,
  children,
}: ModalProps) {
  const [mounted, setMounted] = React.useState(false);

  // SSR guard: portal mount; intentional one-shot setState on mount.
  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!open || !closeOnEsc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeOnEsc, onClose]);

  // Lock body scroll while open.
  React.useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "ges-modal-title" : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div
        className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px]"
        style={{ animation: "ges-fade-in 150ms ease-out" }}
        onClick={() => closeOnOverlay && onClose()}
      />
      <div
        className={cn(
          "relative flex max-h-[min(85vh,900px)] w-full flex-col overflow-hidden rounded-[var(--radius-2xl)] bg-[var(--surface-0)] shadow-[var(--shadow-lg)]",
          SIZES[size],
          className,
        )}
        style={{ animation: "ges-scale-in 160ms ease-out" }}
      >
        {(title || !hideCloseButton) && (
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--border-subtle)] px-6 py-4">
            <div className="min-w-0 flex-1">
              {title ? (
                <h2
                  id="ges-modal-title"
                  className="text-base font-semibold tracking-tight text-[var(--text-primary)]"
                >
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p className="mt-1 text-sm leading-6 text-[var(--text-tertiary)]">
                  {description}
                </p>
              ) : null}
            </div>
            {!hideCloseButton ? (
              <IconButton
                aria-label="Kapat"
                size="sm"
                variant="ghost"
                icon={<Icon name="x" size={16} />}
                onClick={onClose}
              />
            ) : null}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">{children}</div>

        {footer ? (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[var(--border-subtle)] bg-[var(--surface-1)] px-6 py-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
