"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";
import { FilePreview } from "./FilePreview";

export interface FileUploadInputProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  containerClassName?: string;

  value: string;
  onChange: (next: string) => void;

  accept?: string;
  purpose?: string;
  uploadUrl?: string;
  getDownloadUrl?: (fileId: string) => string;
}

async function uploadFile(params: { uploadUrl: string; purpose?: string; file: File }) {
  const fd = new FormData();
  fd.append("file", params.file);
  if (params.purpose) fd.append("purpose", params.purpose);

  const res = await fetch(params.uploadUrl, { method: "POST", body: fd });
  const data = (await res.json().catch(() => ({}))) as { id?: string; contentType?: string; originalFilename?: string };
  if (!res.ok || !data?.id) {
    const msg = (data as unknown as { message?: string })?.message;
    throw new Error(msg || `Upload failed (HTTP ${res.status})`);
  }
  return { id: data.id, contentType: data.contentType ?? null, originalFilename: data.originalFilename ?? null };
}

function fileKindFromUrl(url?: string | null) {
  const u = (url ?? "").trim();
  if (!u) return "none" as const;
  const base = u.split("?")[0] ?? "";
  const ext = (base.split(".").pop() ?? "").toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext)) return "image" as const;
  if (["mp4", "webm", "ogg", "mov", "avi", "m4v"].includes(ext)) return "video" as const;
  if (["mp3", "wav", "m4a", "aac", "flac", "oga", "opus"].includes(ext)) return "audio" as const;
  if (["pdf"].includes(ext)) return "pdf" as const;
  return "document" as const;
}

function filenameFromUrl(url?: string | null) {
  const u = (url ?? "").trim();
  if (!u) return null;
  const base = u.split("?")[0] ?? u;
  const last = base.split("/").pop() ?? base;
  return decodeURIComponent(last) || last || null;
}

export function FileUploadInput({
  label,
  hint,
  error,
  required,
  disabled,
  containerClassName,
  value,
  onChange,
  accept,
  purpose = "OTHER",
  uploadUrl = "/api/proxy/v1/portal/files",
  getDownloadUrl = (id) => `/api/proxy/v1/portal/files/${encodeURIComponent(id)}/download`,
}: FileUploadInputProps) {
  const generatedId = React.useId();

  const [busy, setBusy] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const [meta, setMeta] = React.useState<{ contentType: string | null; filename: string | null }>({ contentType: null, filename: null });

  const effectiveError = error ?? localError;
  const kind = fileKindFromUrl(value);
  const name = filenameFromUrl(value);

  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const doUpload = React.useCallback(
    async (f: File) => {
      setLocalError(null);
      setBusy(true);
      try {
        const up = await uploadFile({ uploadUrl, purpose, file: f });
        const url = getDownloadUrl(up.id);
        setMeta({ contentType: up.contentType, filename: up.originalFilename });
        onChange(url);
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setBusy(false);
      }
    },
    [getDownloadUrl, onChange, purpose, uploadUrl],
  );

  React.useEffect(() => {
    let cancelled = false;
    async function inferContentType() {
      const u = (value ?? "").trim();
      if (!u) {
        setMeta({ contentType: null, filename: null });
        return;
      }
      // If URL has a hint (ext), we can skip HEAD; otherwise try to infer via HEAD.
      if (fileKindFromUrl(u) !== "document") return;
      try {
        const res = await fetch(u, { method: "HEAD" });
        if (!res.ok) return;
        const ct = res.headers.get("content-type");
        if (!ct) return;
        if (!cancelled) setMeta((m) => ({ ...m, contentType: m.contentType ?? ct }));
      } catch {
        // ignore
      }
    }
    void inferContentType();
    return () => {
      cancelled = true;
    };
  }, [value]);

  return (
    <div className={cn("flex w-full flex-col gap-1.5", containerClassName)}>
      {label ? (
        <label htmlFor={generatedId} className="text-xs font-medium text-[var(--text-secondary)]">
          {label}
          {required ? <span className="ml-1 text-[var(--danger-500)]">*</span> : null}
        </label>
      ) : null}

      <div
        className={cn(
          "group flex w-full flex-col overflow-hidden bg-[var(--surface-0)] transition-[box-shadow,border-color]",
          "border rounded-[var(--radius-md)]",
          effectiveError
            ? "border-[var(--danger-500)] focus-within:border-[var(--danger-500)] focus-within:shadow-[var(--ring-danger)]"
            : "border-[var(--border-default)] focus-within:border-[var(--accent-600)] focus-within:shadow-[var(--ring-accent)]",
          disabled && "bg-[var(--surface-2)] text-[var(--text-muted)] cursor-not-allowed",
        )}
      >
        <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] bg-[var(--surface-1)] px-2 py-1.5">
          <label
            className={cn(
              "inline-flex cursor-pointer items-center rounded-md border border-[var(--border-subtle)] bg-[var(--surface-0)] px-2 py-1 text-xs font-medium text-[var(--text-primary)]",
              (disabled || busy) && "cursor-not-allowed opacity-50",
            )}
          >
            <input
              id={generatedId}
              type="file"
              className="hidden"
              accept={accept}
              disabled={disabled || busy}
              ref={inputRef}
              onChange={async (e) => {
                const f = e.currentTarget.files?.[0];
                e.currentTarget.value = "";
                if (!f) return;
                await doUpload(f);
              }}
            />
            {busy ? "Yükleniyor…" : value ? "Değiştir" : "Yükle"}
          </label>

          {value ? (
            <>
              <a
                href={value}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  "text-xs text-[var(--accent-700)] underline underline-offset-2",
                  disabled && "pointer-events-none opacity-50",
                )}
              >
                Aç
              </a>
              <button
                type="button"
                disabled={disabled || busy}
                onClick={() => onChange("")}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50"
              >
                Temizle
              </button>
            </>
          ) : (
            <span className="text-xs text-[var(--text-tertiary)]">Dosya seçerek URL oluştur</span>
          )}
        </div>

        <div
          className={cn(
            "px-3 py-3",
            !disabled && !busy && "cursor-pointer",
            dragging ? "bg-[var(--accent-50)]" : "bg-transparent",
          )}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={() => {
            if (disabled || busy) return;
            inputRef.current?.click();
          }}
          onKeyDown={(e) => {
            if (disabled || busy) return;
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (disabled || busy) return;
            setDragging(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (disabled || busy) return;
            setDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragging(false);
          }}
          onDrop={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragging(false);
            if (disabled || busy) return;
            const f = e.dataTransfer.files?.[0];
            if (!f) return;
            await doUpload(f);
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border",
                dragging ? "border-[var(--accent-400)] bg-[var(--accent-100)]" : "border-[var(--border-subtle)] bg-[var(--surface-1)]",
              )}
            >
              <Icon name={busy ? "loader" : "save"} size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-[var(--text-primary)]">
                {busy ? "Yükleniyor…" : value ? "Dosya yüklü" : dragging ? "Bırakın" : "Dosyayı sürükleyin veya tıklayın"}
              </div>
              <div className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                {accept ? `Kabul: ${accept}` : "PNG/JPG/PDF gibi dosyaları yükleyebilirsiniz."}
              </div>

              {value ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-[140px_1fr]">
                  <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-1)]">
                    <div className="flex h-24 w-full items-center justify-center">
                      <FilePreview
                        url={value}
                        contentType={meta.contentType}
                        filename={meta.filename ?? name}
                        className={kind === "image" || kind === "video" ? "h-24 w-full object-cover" : "h-24 w-full"}
                      />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium text-[var(--text-secondary)]">{name ?? "Dosya"}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <a
                        href={value}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(
                          "text-xs text-[var(--accent-700)] underline underline-offset-2",
                          disabled && "pointer-events-none opacity-50",
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Yeni sekmede aç
                      </a>
                      <button
                        type="button"
                        disabled={disabled || busy}
                        className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          onChange("");
                        }}
                      >
                        Kaldır
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="https://..."
          className={cn(
            "w-full bg-transparent px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
            "outline-none disabled:cursor-not-allowed",
          )}
        />
      </div>

      {effectiveError ? (
        <p className="text-xs leading-5 text-[var(--danger-600)]">{effectiveError}</p>
      ) : hint ? (
        <p className="text-xs leading-5 text-[var(--text-tertiary)]">{hint}</p>
      ) : null}
    </div>
  );
}

