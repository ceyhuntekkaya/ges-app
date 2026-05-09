import * as React from "react";
import { cn } from "@/lib/cn";

type Kind = "image" | "video" | "audio" | "pdf" | "other";

function kindFrom(contentType?: string | null, filename?: string | null): Kind {
  const ct = (contentType ?? "").toLowerCase().trim();
  if (ct.startsWith("image/")) return "image";
  if (ct.startsWith("video/")) return "video";
  if (ct.startsWith("audio/")) return "audio";
  if (ct === "application/pdf") return "pdf";

  const name = (filename ?? "").trim().toLowerCase();
  const ext = (name.split("?")[0]?.split(".").pop() ?? "").toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext)) return "image";
  if (["mp4", "webm", "ogg", "mov", "avi", "m4v"].includes(ext)) return "video";
  if (["mp3", "wav", "m4a", "aac", "flac", "oga", "opus"].includes(ext)) return "audio";
  if (["pdf"].includes(ext)) return "pdf";
  return "other";
}

export type FilePreviewProps = {
  url: string;
  contentType?: string | null;
  filename?: string | null;
  className?: string;
  /** For pdf/other: show a new-tab link */
  openInNewTabLabel?: React.ReactNode;
};

export function FilePreview({ url, contentType, filename, className, openInNewTabLabel = "Yeni sekmede aç" }: FilePreviewProps) {
  const kind = kindFrom(contentType, filename || url);
  const safeUrl = (url ?? "").trim();
  if (!safeUrl) return null;

  if (kind === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={safeUrl} alt={filename ?? "File"} className={cn("h-full w-full object-contain", className)} />;
  }

  if (kind === "video") {
    return <video src={safeUrl} className={cn("h-full w-full", className)} controls preload="metadata" />;
  }

  if (kind === "audio") {
    return <audio src={safeUrl} className={cn("w-full", className)} controls preload="metadata" />;
  }

  return (
    <a
      href={safeUrl}
      target="_blank"
      rel="noreferrer"
      className={cn("inline-flex text-xs text-[var(--accent-700)] underline underline-offset-2", className)}
    >
      {openInNewTabLabel}
    </a>
  );
}

