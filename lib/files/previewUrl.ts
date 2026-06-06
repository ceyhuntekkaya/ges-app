const STORED_FILE_ID_RE = /\/files\/([0-9a-fA-F-]{36})\/download/i;

/** Normalize backend or relative URLs to the Next.js API proxy path. */
export function toProxyMediaUrl(url: string): string {
  const u = url.trim();
  if (!u) return u;
  if (u.startsWith("/api/proxy/")) return u;

  const apiV1 = u.match(/\/api\/v1\/(.+?)(?:\?.*)?$/);
  if (apiV1) return `/api/proxy/v1/${apiV1[1]}`;

  if (u.startsWith("/v1/")) return `/api/proxy${u}`;
  return u;
}

export function extractStoredFileId(url: string): string | null {
  const m = url.trim().match(STORED_FILE_ID_RE);
  return m?.[1] ?? null;
}

export function portalApplicationDocumentFileUrl(applicationDocumentId: string): string {
  return `/api/proxy/v1/portal/application-documents/${encodeURIComponent(applicationDocumentId)}/file`;
}

export function portalUniversityApplicationFileUrl(applicationId: string, storedFileId: string): string {
  return `/api/proxy/v1/portal/university-applications/${encodeURIComponent(applicationId)}/files/${encodeURIComponent(storedFileId)}/download`;
}

function isExternalLink(url: string): boolean {
  return /^https?:\/\//i.test(url) && !STORED_FILE_ID_RE.test(url);
}

/**
 * Resolve a portal-safe preview URL for university application files.
 * Avoids /admin/files and /portal/files endpoints that return 403 for applicants.
 */
export function resolvePortalFilePreviewUrl(params: {
  applicationId?: string | null;
  applicationDocumentId?: string | null;
  downloadUrl?: string | null;
  fileUrl?: string | null;
  documentUrl?: string | null;
}): string | null {
  if (params.applicationDocumentId) {
    return portalApplicationDocumentFileUrl(params.applicationDocumentId);
  }

  const mediaUrl = params.fileUrl ?? params.documentUrl ?? params.downloadUrl;
  if (!mediaUrl) return null;

  const trimmed = mediaUrl.trim();
  if (isExternalLink(trimmed)) return trimmed;

  const fileId = extractStoredFileId(trimmed);
  if (fileId && params.applicationId) {
    return portalUniversityApplicationFileUrl(params.applicationId, fileId);
  }

  const proxied = toProxyMediaUrl(trimmed);
  if (proxied.includes("/v1/admin/")) return null;
  return proxied;
}
