"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { LanguageCampVisaFormDto } from "@/lib/api/generated/index";
import {
  LanguageCampVisaFormDtoPassportType,
  type LanguageCampVisaFormDtoPassportType as PassportType,
} from "@/lib/api/generated/index";
import { AddVisaDocumentModal } from "@/components/applications/AddVisaDocumentModal";
import { labelStoredFilePurpose } from "@/lib/applications/storedFilePurpose";
import { Button, FilePreview, Input } from "@/components/ui";
import type { Lang } from "@/lib/i18n/dict";
import { t } from "@/lib/i18n/dict";
import { labelPassportType } from "@/lib/i18n/labels";

const selectCls =
  "h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20";

const PASSPORT_TYPES = Object.values(
  LanguageCampVisaFormDtoPassportType,
) as PassportType[];

type VisaFormState = {
  passportNumber: string;
  passportValidUntil: string;
  passportType: string;
  visaValidFrom: string;
  visaValidUntil: string;
  visaIssuingCountry: string;
  visaType: string;
};

function stateFromDto(vf?: LanguageCampVisaFormDto): VisaFormState {
  return {
    passportNumber: vf?.passportNumber ?? "",
    passportValidUntil: vf?.passportValidUntil ?? "",
    passportType: vf?.passportType ?? "",
    visaValidFrom: vf?.visaValidFrom ?? "",
    visaValidUntil: vf?.visaValidUntil ?? "",
    visaIssuingCountry: vf?.visaIssuingCountry ?? "",
    visaType: vf?.visaType ?? "",
  };
}

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

export function LanguageCampVisaFormSection({
  applicationId,
  visaForm: initialVisaForm,
  lang,
}: {
  applicationId: string;
  visaForm?: LanguageCampVisaFormDto;
  lang: Lang;
}) {
  const router = useRouter();
  const [visaForm, setVisaForm] = React.useState<LanguageCampVisaFormDto | undefined>(initialVisaForm);
  const [form, setForm] = React.useState<VisaFormState>(() => stateFromDto(initialVisaForm));
  const [loading, setLoading] = React.useState(!initialVisaForm?.id);
  const [saving, setSaving] = React.useState(false);
  const [busyDocId, setBusyDocId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [saveMessage, setSaveMessage] = React.useState<string | null>(null);
  const [docModalOpen, setDocModalOpen] = React.useState(false);

  const visaFormId = visaForm?.id;
  const documents = visaForm?.documents ?? [];

  React.useEffect(() => {
    setVisaForm(initialVisaForm);
    setForm(stateFromDto(initialVisaForm));
  }, [initialVisaForm]);

  React.useEffect(() => {
    if (initialVisaForm?.id) return;
    let cancelled = false;

    async function ensure() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/proxy/v1/portal/language-camp-visa-forms/ensure?applicationId=${encodeURIComponent(applicationId)}`,
          { method: "POST" },
        );
        const data = (await res.json().catch(() => ({}))) as LanguageCampVisaFormDto;
        if (!res.ok) throw new Error(`ensure failed (HTTP ${res.status})`);
        if (!cancelled) {
          setVisaForm(data);
          setForm(stateFromDto(data));
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load visa form");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void ensure();
    return () => {
      cancelled = true;
    };
  }, [applicationId, initialVisaForm?.id]);

  function patch<K extends keyof VisaFormState>(key: K, value: VisaFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaveMessage(null);
  }

  async function saveForm() {
    if (!visaFormId) return;
    setSaving(true);
    setError(null);
    setSaveMessage(null);
    try {
      const payload = {
        passportNumber: form.passportNumber.trim() || null,
        passportValidUntil: form.passportValidUntil || null,
        passportType: form.passportType || null,
        visaValidFrom: form.visaValidFrom || null,
        visaValidUntil: form.visaValidUntil || null,
        visaIssuingCountry: form.visaIssuingCountry.trim() || null,
        visaType: form.visaType.trim() || null,
      };

      const res = await fetch(`/api/proxy/v1/portal/language-camp-visa-forms/${visaFormId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as LanguageCampVisaFormDto;
      if (!res.ok) throw new Error(`save failed (HTTP ${res.status})`);

      setVisaForm((prev) => ({ ...prev, ...data, documents: prev?.documents ?? data.documents }));
      setForm(stateFromDto(data));
      setSaveMessage(t("saved", lang));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function removeDocument(documentId: string) {
    if (!visaFormId) return;
    setBusyDocId(documentId);
    setError(null);
    try {
      const res = await fetch(
        `/api/proxy/v1/portal/language-camp-visa-forms/${visaFormId}/documents/${documentId}`,
        { method: "DELETE" },
      );
      const data = (await res.json().catch(() => ({}))) as LanguageCampVisaFormDto;
      if (!res.ok) throw new Error(`delete failed (HTTP ${res.status})`);
      setVisaForm(data);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusyDocId(null);
    }
  }

  function onDocumentAdded() {
    if (!visaFormId) return;
    void (async () => {
      const res = await fetch(`/api/proxy/v1/portal/language-camp-visa-forms/${visaFormId}`);
      const data = (await res.json().catch(() => ({}))) as LanguageCampVisaFormDto;
      if (res.ok) {
        setVisaForm(data);
        router.refresh();
      }
    })();
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">{t("loading", lang)}</p>;
  }

  if (!visaFormId) {
    return <p className="text-sm text-zinc-500">{t("visaFormUnavailable", lang)}</p>;
  }

  return (
    <div className="grid gap-8">
      <form
        className="grid gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          void saveForm();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t("passportNumber", lang)}
            value={form.passportNumber}
            onChange={(e) => patch("passportNumber", e.target.value)}
          />
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-zinc-700">{t("passportType", lang)}</label>
            <select
              className={selectCls}
              value={form.passportType}
              onChange={(e) => patch("passportType", e.target.value)}
            >
              <option value="">{t("selectOption", lang)}</option>
              {PASSPORT_TYPES.map((pt) => (
                <option key={pt} value={pt}>
                  {labelPassportType(pt, lang)}
                </option>
              ))}
            </select>
          </div>
          <Input
            label={t("passportValidUntil", lang)}
            type="date"
            value={form.passportValidUntil}
            onChange={(e) => patch("passportValidUntil", e.target.value)}
          />
          <Input
            label={t("visaIssuingCountry", lang)}
            value={form.visaIssuingCountry}
            onChange={(e) => patch("visaIssuingCountry", e.target.value)}
          />
          <Input
            label={t("visaType", lang)}
            value={form.visaType}
            onChange={(e) => patch("visaType", e.target.value)}
          />
          <Input
            label={t("visaValidFrom", lang)}
            type="date"
            value={form.visaValidFrom}
            onChange={(e) => patch("visaValidFrom", e.target.value)}
          />
          <Input
            label={t("visaValidUntil", lang)}
            type="date"
            value={form.visaValidUntil}
            onChange={(e) => patch("visaValidUntil", e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? t("saving", lang) : t("save", lang)}
          </Button>
          {saveMessage ? <span className="text-sm font-medium text-emerald-700">{saveMessage}</span> : null}
        </div>
      </form>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-zinc-900">{t("visaDocuments", lang)}</h4>
          <Button type="button" variant="primary" size="sm" onClick={() => setDocModalOpen(true)}>
            {t("addVisaDocument", lang)}
          </Button>
        </div>

        {error ? (
          <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-900">
            {error}
          </div>
        ) : null}

        {documents.length === 0 ? (
          <p className="text-sm text-zinc-500">{t("noVisaDocuments", lang)}</p>
        ) : (
          <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
            {documents.map((doc) => {
              const file = doc.file;
              const fileId = file?.id;
              const docId = doc.id;
              const busy = busyDocId === docId;
              const downloadUrl = fileId
                ? `/api/proxy/v1/portal/files/${encodeURIComponent(fileId)}/download`
                : null;

              return (
                <li key={docId ?? fileId} className="px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-zinc-900">{file?.originalFilename ?? "-"}</div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {file?.purpose ? labelStoredFilePurpose(file.purpose, lang) : "-"}
                        {" · "}
                        {formatBytes(file?.sizeBytes)}
                      </div>

                      {downloadUrl ? (
                        <div className="mt-3 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 p-2">
                          <div className="aspect-[16/9] w-full max-w-md">
                            <FilePreview
                              url={downloadUrl}
                              contentType={file?.contentType ?? null}
                              filename={file?.originalFilename ?? null}
                              className="rounded-md"
                              openInNewTabLabel={
                                lang === "tr" ? "Dosyayı yeni sekmede aç" : "Open in new tab"
                              }
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
                          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                        >
                          {t("download", lang)}
                        </a>
                      ) : null}
                      {docId ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => removeDocument(docId)}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-900 hover:bg-rose-100 disabled:opacity-60"
                        >
                          {busy ? t("deleting", lang) : t("delete", lang)}
                        </button>
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
        lang={lang}
        onAdded={onDocumentAdded}
      />
    </div>
  );
}