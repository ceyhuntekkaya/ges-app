import type { UniversityApplicationPortfolioFileUpsertRequestDtoType } from "@/lib/api/generated/index";

export function inferPortfolioFileType(params: {
  contentType?: string | null;
  filename?: string | null;
  url?: string | null;
}): UniversityApplicationPortfolioFileUpsertRequestDtoType {
  const ct = (params.contentType ?? "").trim().toLowerCase();
  if (ct.startsWith("image/")) return "IMAGE";
  if (ct.startsWith("video/")) return "VIDEO";
  if (ct.startsWith("audio/")) return "AUDIO";
  if (ct === "application/pdf") return "PDF";

  const source = (params.filename ?? params.url ?? "").trim().toLowerCase();
  const base = source.split("?")[0] ?? source;
  const ext = (base.split(".").pop() ?? "").toLowerCase();

  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "avif", "heic", "heif"].includes(ext)) {
    return "IMAGE";
  }
  if (["mp4", "webm", "ogg", "mov", "avi", "m4v", "mkv"].includes(ext)) {
    return "VIDEO";
  }
  if (["mp3", "wav", "m4a", "aac", "flac", "oga", "opus"].includes(ext)) {
    return "AUDIO";
  }
  if (ext === "pdf") return "PDF";

  return "OTHER";
}

export function portfolioFileTypeLabelTr(type?: string | null) {
  switch (type) {
    case "IMAGE":
      return "Resim";
    case "VIDEO":
      return "Video";
    case "AUDIO":
      return "Ses";
    case "PDF":
      return "PDF";
    case "LINK":
      return "Bağlantı";
    default:
      return "Diğer";
  }
}
