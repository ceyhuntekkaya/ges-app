"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

type Kind = "image" | "video" | "audio" | "pdf" | "other";

function kindFrom(
  contentType?: string | null,
  filename?: string | null,
  fileType?: string | null,
): Kind {
  const ft = (fileType ?? "").trim().toUpperCase();
  if (ft === "IMAGE") return "image";
  if (ft === "VIDEO") return "video";
  if (ft === "AUDIO") return "audio";
  if (ft === "PDF") return "pdf";

  const ct = (contentType ?? "").toLowerCase().trim();
  if (ct.startsWith("image/")) return "image";
  if (ct.startsWith("video/")) return "video";
  if (ct.startsWith("audio/")) return "audio";
  if (ct === "application/pdf") return "pdf";

  const name = (filename ?? "").trim().toLowerCase();
  const ext = (name.split("?")[0]?.split(".").pop() ?? "").toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "avif", "heic", "heif"].includes(ext)) return "image";
  if (["mp4", "webm", "ogg", "mov", "avi", "m4v", "mkv"].includes(ext)) return "video";
  if (["mp3", "wav", "m4a", "aac", "flac", "oga", "opus"].includes(ext)) return "audio";
  if (ext === "pdf") return "pdf";
  return "other";
}

function needsContentTypeInference(kind: Kind, contentType?: string | null, fileType?: string | null) {
  if (kind !== "other") return false;
  if (contentType?.trim()) return false;
  if (fileType?.trim()) return false;
  return true;
}

export type FilePreviewProps = {
  url: string;
  contentType?: string | null;
  filename?: string | null;
  /** Portfolio file type: IMAGE, VIDEO, AUDIO, PDF, etc. */
  fileType?: string | null;
  className?: string;
  /** For pdf/other: show a new-tab link */
  openInNewTabLabel?: React.ReactNode;
};

export function FilePreview({
  url,
  contentType,
  filename,
  fileType,
  className,
  openInNewTabLabel = "Yeni sekmede aç",
}: FilePreviewProps) {
  const safeUrl = (url ?? "").trim();
  const [inferredContentType, setInferredContentType] = React.useState<string | null>(null);

  const effectiveContentType = contentType ?? inferredContentType;
  const kind = kindFrom(effectiveContentType, filename || safeUrl, fileType);

  React.useEffect(() => {
    if (!safeUrl || !needsContentTypeInference(kind, contentType, fileType)) return;

    let cancelled = false;
    async function infer() {
      try {
        const res = await fetch(safeUrl, { method: "HEAD" });
        if (!res.ok || cancelled) return;
        const ct = res.headers.get("content-type");
        if (ct && !cancelled) setInferredContentType(ct);
      } catch {
        // ignore
      }
    }

    void infer();
    return () => {
      cancelled = true;
    };
  }, [safeUrl, kind, contentType, fileType]);

  if (!safeUrl) return null;

  if (kind === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={safeUrl} alt={filename ?? "File"} className={cn("h-full w-full object-contain", className)} />;
  }

  if (kind === "video") {
    return (
      <video src={safeUrl} className={cn("h-full w-full object-contain", className)} controls preload="metadata" />
    );
  }

  if (kind === "audio") {
    return (
      <div className={cn("flex h-full w-full items-center justify-center p-3", className)}>
        <audio src={safeUrl} className="w-full" controls preload="metadata" />
      </div>
    );
  }

  if (kind === "pdf") {
    return (
      <iframe
        src={safeUrl}
        title={filename ?? "PDF"}
        className={cn("h-full w-full border-0", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center",
        className,
      )}
    >
      <a
        href={safeUrl}
        target="_blank"
        rel="noreferrer"
        className="text-sm font-medium text-[var(--accent-700)] underline underline-offset-2"
      >
        {openInNewTabLabel}
      </a>
    </div>
  );
}
