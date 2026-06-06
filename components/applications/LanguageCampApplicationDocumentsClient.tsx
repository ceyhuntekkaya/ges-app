"use client";

import * as React from "react";
import type { UniversityApplicationDocumentDto } from "@/lib/api/generated/index";
import type { LanguageCampApplicationDocumentDto } from "@/lib/applications/languageCampCrmTypes";
import {
  countMissingRequiredDocuments,
  mergeChecklistWithLegacyDocuments,
  type MergedApplicationDocumentItem,
} from "@/lib/applications/mergeApplicationDocuments";
import { t } from "@/lib/i18n/dict";
import type { Lang } from "@/lib/i18n/dict";
import { FilePreview } from "@/components/ui";
import { resolvePortalFilePreviewUrl } from "@/lib/files/previewUrl";

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

export function LanguageCampApplicationDocumentsClient({
  applicationId,
  lang,
  initialLegacyDocuments,
}: {
  applicationId: string;
  lang: Lang;
  initialLegacyDocuments?: LanguageCampApplicationDocumentDto[];
}) {
  const [items, setItems] = React.useState<MergedApplicationDocumentItem[]>([]);
  const [missingCount, setMissingCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busyKey, setBusyKey] = React.useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    const checklistQs = new URLSearchParams({
      scope: "LANGUAGE_CAMP_APPLICATION",
      applicationId,
    }).toString();

    const [checklistRes, appRes] = await Promise.all([
      fetch(`/api/proxy/v1/portal/application-document-checklist?${checklistQs}`, { cache: "no-store" }),
      fetch(`/api/proxy/v1/portal/language-camp-applications/${encodeURIComponent(applicationId)}`, {
        cache: "no-store",
      }),
    ]);

    const checklistData = (await checklistRes.json().catch(() => ({}))) as {
      items?: MergedApplicationDocumentItem[];
    };
    const appData = (await appRes.json().catch(() => ({}))) as {
      documents?: LanguageCampApplicationDocumentDto[];
    };

    if (!checklistRes.ok) {
      setLoading(false);
      setError(`HTTP ${checklistRes.status}`);
      return;
    }

    const legacyDocuments =
      appRes.ok && appData.documents ? appData.documents : (initialLegacyDocuments ?? []);

    const merged = mergeChecklistWithLegacyDocuments(
      checklistData.items ?? [],
      legacyDocuments as UniversityApplicationDocumentDto[],
    );
    setItems(merged);
    setMissingCount(countMissingRequiredDocuments(merged));
    setLoading(false);
  }

  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  async function uploadFor(item: MergedApplicationDocumentItem, file: File) {
    if (item.isChecklistRequirement === false) return;
    const key = item.requirement?.key ?? "";
    if (!key) return;

    setBusyKey(key);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("purpose", "LANGUAGE_CAMP_VISA_DOCUMENT");
      const upRes = await fetch("/api/proxy/v1/portal/files", { method: "POST", body: fd });
      const upData = (await upRes.json().catch(() => ({}))) as { id?: string };
      if (!upRes.ok || !upData?.id) throw new Error(`upload failed (HTTP ${upRes.status})`);

      const attachRes = await fetch("/api/proxy/v1/portal/application-documents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          scope: "LANGUAGE_CAMP_APPLICATION",
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
    const m = new Map<string, MergedApplicationDocumentItem[]>();
    for (const it of items) {
      const cat = (it.requirement?.category || "GENERAL").toUpperCase();
      m.set(cat, [...(m.get(cat) ?? []), it]);
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {missingCount > 0 ? (
          <span className="text-sm font-semibold text-rose-700">({missingCount})</span>
        ) : null}
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
        <div className="text-sm text-zinc-600">{t("noItems", lang)}</div>
      ) : (
        <div className="grid gap-4">
          {grouped.map(([cat, list]) => (
            <section key={cat} className="rounded-xl border border-zinc-200 bg-white">
              <div className="border-b border-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-900">{cat}</div>
              <ul className="divide-y divide-zinc-100">
                {list.map((it) => {
                  const key = it.requirement?.key ?? crypto.randomUUID();
                  const busy =
                    busyKey === (it.requirement?.key ?? "") || busyKey === (it.applicationDocumentId ?? "");
                  const accept = it.requirement?.allowedContentTypes ?? undefined;
                  const previewUrl = resolvePortalFilePreviewUrl({
                    applicationId,
                    applicationDocumentId: it.applicationDocumentId,
                    downloadUrl: it.downloadUrl,
                    documentUrl: it.legacyDocument?.documentUrl,
                  });
                  const displayFilename =
                    it.file?.originalFilename ?? it.legacyDocument?.documentName ?? null;

                  return (
                    <li key={key} className="px-4 py-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-zinc-900">
                              {it.requirement?.title ?? it.legacyDocument?.documentName ?? key}
                            </span>
                            {it.requirement?.required ? (
                              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-800">
                                {t("required", lang)}
                              </span>
                            ) : null}
                          </div>
                          {it.requirement?.description ? (
                            <p className="mt-1 text-xs text-zinc-500">{it.requirement.description}</p>
                          ) : null}
                          {previewUrl ? (
                            <div className="mt-3 max-w-md overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 p-2">
                              <FilePreview
                                url={previewUrl}
                                contentType={it.file?.contentType ?? null}
                                filename={displayFilename}
                                className="aspect-[16/9] w-full rounded-md"
                              />
                              {it.file?.sizeBytes ? (
                                <p className="mt-1 text-xs text-zinc-500">{formatBytes(it.file.sizeBytes)}</p>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 flex-col gap-2">
                          {it.isChecklistRequirement !== false ? (
                            <label className="cursor-pointer rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-sm font-semibold text-teal-900 hover:bg-teal-100">
                              {busy ? t("uploading", lang) : t("upload", lang)}
                              <input
                                type="file"
                                className="hidden"
                                accept={accept}
                                disabled={busy}
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) void uploadFor(it, f);
                                  e.target.value = "";
                                }}
                              />
                            </label>
                          ) : null}
                          {it.applicationDocumentId ? (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void removeDocument(it.applicationDocumentId!)}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-900 hover:bg-rose-100 disabled:opacity-60"
                            >
                              {t("delete", lang)}
                            </button>
                          ) : null}
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
