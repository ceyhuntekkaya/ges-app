"use client";

import * as React from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";

export type ConfirmTone = "danger" | "warning" | "info";

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  loading?: boolean;
}

const TONE_ICON: Record<ConfirmTone, IconName> = {
  danger: "alert",
  warning: "warning",
  info: "info",
};

const TONE_BG: Record<ConfirmTone, string> = {
  danger: "bg-[var(--danger-50)] text-[var(--danger-600)]",
  warning: "bg-[var(--warning-50)] text-[var(--warning-700)]",
  info: "bg-[var(--info-50)] text-[var(--info-700)]",
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Onayla",
  cancelLabel = "Vazgeç",
  tone = "danger",
  loading = false,
}: ConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = React.useState(false);
  const isLoading = loading || internalLoading;

  const handleConfirm = async () => {
    try {
      setInternalLoading(true);
      await onConfirm();
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={isLoading ? () => {} : onClose}
      size="sm"
      hideCloseButton
      closeOnOverlay={!isLoading}
      closeOnEsc={!isLoading}
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            size="md"
            onClick={handleConfirm}
            loading={isLoading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${TONE_BG[tone]}`}
        >
          <Icon name={TONE_ICON[tone]} size={20} />
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-[var(--text-tertiary)]">{description}</p>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
