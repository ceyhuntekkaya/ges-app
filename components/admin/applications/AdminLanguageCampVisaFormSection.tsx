"use client";

import * as React from "react";
import {
  adminLanguageCampVisaFormsGet,
  adminLanguageCampVisaFormsListByApplication,
  type LanguageCampVisaFormDto,
} from "@/lib/api/generated/index";
import { AddVisaDocumentModal } from "@/components/applications/AddVisaDocumentModal";
import { labelStoredFilePurpose } from "@/lib/applications/storedFilePurpose";
import { Button, FilePreview } from "@/components/ui";
import { formatTrLocalDate } from "@/lib/dates/formatTr";
import { labelPassportType } from "@/lib/i18n/labels";

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

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <div className="text-xs font-medium text-[var(--text-tertiary)]">{label}</div>
      <div className="text-sm whitespace-pre-wrap text-[var(--text-primary)]">{value}</div>
    </div>
  );
}

export function AdminLanguageCampVisaFormSection({
  applicationId,
  initialVisaForm,
  onChanged,
}: {
  applicationId: string;
  initialVisaForm?: LanguageCampVisaFormDto;
  onChanged?: () => void;
}) {
  const [visaForm, setVisaForm] = React.useState<LanguageCampVisaFormDto | undefined>(initialVisaForm);
  const [loading, setLoading] = React.useState(!initialVisaForm?.id);
  const [busyDocId, setBusyDocId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [docModalOpen, setDocModalOpen] = React.useState(false);

  const visaFormId = visaForm?.id;
  const documents = visaForm?.documents ?? [];

  const reloadVisaForm = React.useCallback(async () => {
    if (initialVisaForm?.id) {
      const res = await adminLanguageCampVisaFormsGet(initialVisaForm.id).catch(() => null);
      if (res && res.status >= 200 && res.status < 300 && res.data) {
        setVisaForm(res.data);
        return;
      }
    }

    const listRes = await adminLanguageCampVisaFormsListByApplication({ applicationId, page: 0, size: 1 }).catch(
      () => null,
    );
    if (listRes && listRes.status >= 200 && listRes.status < 300) {
      const first = listRes.data?.items?.[0];
      if (first?.id) {
        const detail = await adminLanguageCampVisaFormsGet(first.id).catch(() => null);
        if (detail && detail.status >= 200 && detail.status < 300 && detail.data) {
          setVisaForm(detail.data);
          return;
        }
        setVisaForm(first);
        return;
      }
    }
    setVisaForm(undefined);
  }, [applicationId, initialVisaForm?.id]);

  React.useEffect(() => {
    setVisaForm(initialVisaForm);
  }, [initialVisaForm]);

  React.useEffect(() => {
    if (initialVisaForm?.id) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        await reloadVisaForm();
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Vize formu yüklenemedi");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [initialVisaForm?.id, reloadVisaForm]);

  async function removeDocument(documentId: string) {
    if (!visaFormId) return;
    setBusyDocId(documentId);
    setError(null);
    try {
      const res = await fetch(
        `/api/proxy/v1/admin/language-camp-visa-forms/${encodeURIComponent(visaFormId)}/documents/${encodeURIComponent(documentId)}`,
        { method: "DELETE" },
      );
      const data = (await res.json().catch(() => ({}))) as LanguageCampVisaFormDto;
      if (!res.ok) throw new Error(`Silinemedi (HTTP ${res.status})`);
      setVisaForm(data);
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Silinemedi");
    } finally {
      setBusyDocId(null);
    }
  }

  async function onDocumentAdded() {
    await reloadVisaForm();
    onChanged?.();
  }

  if (loading) {
    return <p className="text-sm text-[var(--text-tertiary)]">Yükleniyor…</p>;
  }

  if (!visaFormId) {
    return (
      <p className="text-sm text-[var(--text-tertiary)]">
        Başvuru sahibi henüz vize formu oluşturmamış.
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Pasaport no" value={visaForm?.passportNumber ?? "-"} />
        <Field
          label="Pasaport tipi"
          value={visaForm?.passportType ? labelPassportType(visaForm.passportType, "tr") : "-"}
        />
        <Field
          label="Pasaport geçerlilik"
          value={visaForm?.passportValidUntil ? formatTrLocalDate(visaForm.passportValidUntil) : "-"}
        />
        <Field label="Vize veren ülke" value={visaForm?.visaIssuingCountry ?? "-"} />
        <Field label="Vize tipi" value={visaForm?.visaType ?? "-"} />
        <Field
          label="Vize başlangıç"
          value={visaForm?.visaValidFrom ? formatTrLocalDate(visaForm.visaValidFrom) : "-"}
        />
        <Field
          label="Vize bitiş"
          value={visaForm?.visaValidUntil ? formatTrLocalDate(visaForm.visaValidUntil) : "-"}
        />
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-[var(--text-primary)]">Vize evrakları</h4>
          <Button type="button" variant="secondary" size="sm" onClick={() => setDocModalOpen(true)}>
            Evrak ekle
          </Button>
        </div>

        {error ? <div className="mb-3 text-sm text-[var(--danger-600)]">{error}</div> : null}

        {documents.length === 0 ? (
          <p className="text-sm text-[var(--text-tertiary)]">Henüz evrak yok.</p>
        ) : (
          <ul className="divide-y divide-[var(--border-subtle)]">
            {documents.map((doc) => {
              const file = doc.file;
              const fileId = file?.id;
              const docId = doc.id;
              const busy = busyDocId === docId;
              const downloadUrl = fileId
                ? `/api/proxy/v1/admin/files/${encodeURIComponent(fileId)}/download`
                : null;

              return (
                <li key={docId ?? fileId} className="py-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-[var(--text-primary)]">
                        {file?.originalFilename ?? "-"}
                      </div>
                      <div className="mt-1 text-xs text-[var(--text-tertiary)]">
                        {file?.purpose ? labelStoredFilePurpose(file.purpose, "tr") : "-"}
                        {" · "}
                        {formatBytes(file?.sizeBytes)}
                      </div>

                      {downloadUrl ? (
                        <div className="mt-3 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-2">
                          <div className="aspect-[16/9] w-full max-w-md">
                            <FilePreview
                              url={downloadUrl}
                              contentType={file?.contentType ?? null}
                              filename={file?.originalFilename ?? null}
                              className="rounded-md"
                              openInNewTabLabel="Dosyayı yeni sekmede aç"
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {downloadUrl ? (
                        <a
                          href={downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-1)]"
                        >
                          İndir
                        </a>
                      ) : null}
                      {docId ? (
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={busy}
                          onClick={() => void removeDocument(docId)}
                        >
                          {busy ? "Siliniyor…" : "Sil"}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <AddVisaDocumentModal
        open={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        visaFormId={visaFormId}
        lang="tr"
        apiScope="admin"
        onAdded={() => void onDocumentAdded()}
      />
    </div>
  );
}
