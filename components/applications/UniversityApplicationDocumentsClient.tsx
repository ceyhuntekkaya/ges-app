"use client";

import * as React from "react";
import { t } from "@/lib/i18n/dict";

type ChecklistItem = {
  requirement: {
    id?: string;
    scope?: string;
    category?: string | null;
    key?: string;
    required?: boolean;
    allowedContentTypes?: string | null;
    maxSizeBytes?: number;
    title?: string | null;
    description?: string | null;
  };
  uploaded?: boolean;
  applicationDocumentId?: string | null;
  reviewNote?: string | null;
  file?: { id?: string; originalFilename?: string; contentType?: string; sizeBytes?: number } | null;
  downloadUrl?: string | null;
};

function formatBytes(n?: number) {
  if (!n || n <= 0) return "-";
  const units = ["B", "KB", "MB", "GB"] as const;
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export function UniversityApplicationDocumentsClient({
  applicationId,
  lang,
}: {
  applicationId: string;
  lang: "tr" | "en";
}) {
  const [items, setItems] = React.useState<ChecklistItem[]>([]);
  const [missing, setMissing] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busyKey, setBusyKey] = React.useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams({ scope: "UNIVERSITY_APPLICATION", applicationId }).toString();
    const res = await fetch(`/api/proxy/v1/portal/application-document-checklist?${qs}`, { cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as { items?: ChecklistItem[]; missingRequiredKeys?: string[] };
    if (!res.ok) {
      setLoading(false);
      setError(`HTTP ${res.status}`);
      return;
    }
    setItems(data.items ?? []);
    setMissing(data.missingRequiredKeys ?? []);
    setLoading(false);
  }

  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  async function uploadFor(item: ChecklistItem, file: File) {
    const key = item.requirement?.key ?? "";
    if (!key) return;

    setBusyKey(key);
    setError(null);
    try {
      // 1) upload file -> fileId
      const fd = new FormData();
      fd.append("file", file);
      fd.append("purpose", "OTHER");
      const upRes = await fetch("/api/proxy/v1/portal/files", { method: "POST", body: fd });
      const upData = (await upRes.json().catch(() => ({}))) as { id?: string };
      if (!upRes.ok || !upData?.id) throw new Error(`upload failed (HTTP ${upRes.status})`);

      // 2) attach to requirement
      const attachRes = await fetch("/api/proxy/v1/portal/application-documents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          scope: "UNIVERSITY_APPLICATION",
          applicationId,
          requirementId: item.requirement?.id ?? null,
          requirementKey: key,
          fileId: upData.id,
        }),
      });
      if (!attachRes.ok) throw new Error(`attach failed (HTTP ${attachRes.status})`);

      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusyKey(null);
    }
  }

  async function removeDocument(applicationDocumentId: string) {
    setBusyKey(applicationDocumentId);
    setError(null);
    try {
      const res = await fetch(`/api/proxy/v1/portal/application-documents/${applicationDocumentId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`delete failed (HTTP ${res.status})`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusyKey(null);
    }
  }

  const grouped = React.useMemo(() => {
    const m = new Map<string, ChecklistItem[]>();
    for (const it of items) {
      const cat = (it.requirement?.category || "GENERAL").toUpperCase();
      m.set(cat, [...(m.get(cat) ?? []), it]);
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold text-zinc-900">
          {t("documents", lang)} {missing.length ? <span className="text-rose-700">({missing.length})</span> : null}
        </div>
        <button
          type="button"
          onClick={() => load()}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          {t("refresh", lang)}
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-900">{error}</div>
      ) : null}

      {loading ? (
        <div className="text-sm text-zinc-600">{t("loading", lang)}</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-zinc-600">
          Bu başvuru için belge gereksinimi tanımlı değil. (Backend `document_requirements` boş olabilir.)
        </div>
      ) : (
        <div className="grid gap-4">
          {grouped.map(([cat, list]) => (
            <section key={cat} className="rounded-xl border border-zinc-200 bg-white">
              <div className="border-b border-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-900">{cat}</div>
              <ul className="divide-y divide-zinc-100">
                {list.map((it) => {
                  const key = it.requirement?.key ?? crypto.randomUUID();
                  const busy = busyKey === (it.requirement?.key ?? "") || busyKey === (it.applicationDocumentId ?? "");
                  const accept = it.requirement?.allowedContentTypes ?? undefined;
                  return (
                    <li key={key} className="px-4 py-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-sm font-medium text-zinc-900">
                              {it.requirement?.title || it.requirement?.key}
                            </div>
                            <span
                              className={[
                                "rounded-full border px-2 py-0.5 text-xs font-semibold",
                                it.requirement?.required
                                  ? "border-rose-200 bg-rose-50 text-rose-800"
                                  : "border-zinc-200 bg-zinc-50 text-zinc-700",
                              ].join(" ")}
                            >
                              {it.requirement?.required ? t("required", lang) : t("optional", lang)}
                            </span>
                            <span
                              className={[
                                "rounded-full border px-2 py-0.5 text-xs font-semibold",
                                it.uploaded ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-zinc-200 bg-white text-zinc-700",
                              ].join(" ")}
                            >
                              {it.uploaded ? t("uploaded", lang) : t("notUploaded", lang)}
                            </span>
                          </div>
                          {it.requirement?.description ? (
                            <div className="mt-1 text-xs text-zinc-600">{it.requirement.description}</div>
                          ) : null}
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-500">
                            <div>
                              {t("allowedTypes", lang)}: {accept || "-"}
                            </div>
                            <div>
                              {t("maxFileSize", lang)}: {formatBytes(it.requirement?.maxSizeBytes)}
                            </div>
                          </div>
                          {it.reviewNote ? (
                            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                              {it.reviewNote}
                            </div>
                          ) : null}
                          {it.file?.originalFilename ? (
                            <div className="mt-2 text-xs text-zinc-600">
                              {it.file.originalFilename} ({formatBytes(it.file.sizeBytes)})
                            </div>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-2">
                          {it.applicationDocumentId ? (
                            <>
                              <a
                                href={`/api/proxy/v1/portal/application-documents/${it.applicationDocumentId}/file`}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                              >
                                {t("download", lang)}
                              </a>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => removeDocument(it.applicationDocumentId!)}
                                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-900 hover:bg-rose-100 disabled:opacity-60"
                              >
                                {busy ? t("deleting", lang) : t("delete", lang)}
                              </button>
                            </>
                          ) : null}

                          <label className="cursor-pointer rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800">
                            <input
                              type="file"
                              className="hidden"
                              accept={accept || undefined}
                              disabled={busy}
                              onChange={(e) => {
                                const f = e.currentTarget.files?.[0];
                                e.currentTarget.value = "";
                                if (f) void uploadFor(it, f);
                              }}
                            />
                            {busy ? t("creating", lang) : it.uploaded ? t("replace", lang) : t("upload", lang)}
                          </label>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

