"use client";

import * as React from "react";
import {
  StoredFileDtoPurpose,
  type StoredFileDtoPurpose as StoredFilePurposeType,
} from "@/lib/api/generated/index";
import { labelStoredFilePurpose, VISA_DOCUMENT_PURPOSE_OPTIONS } from "@/lib/applications/storedFilePurpose";
import { Button, Modal } from "@/components/ui";
import type { Lang } from "@/lib/i18n/dict";
import { t } from "@/lib/i18n/dict";

const selectCls =
  "h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20";

export function AddVisaDocumentModal({
  open,
  onClose,
  visaFormId,
  lang,
  onAdded,
  apiScope = "portal",
}: {
  open: boolean;
  onClose: () => void;
  visaFormId: string;
  lang: Lang;
  onAdded: () => void;
  /** Admin detayında admin dosya ve vize form uçları kullanılır. */
  apiScope?: "portal" | "admin";
}) {
  const [purpose, setPurpose] = React.useState<StoredFilePurposeType>(
    StoredFileDtoPurpose.LANGUAGE_CAMP_VISA_DOCUMENT,
  );
  const [file, setFile] = React.useState<File | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setPurpose(StoredFileDtoPurpose.LANGUAGE_CAMP_VISA_DOCUMENT);
      setFile(null);
      setError(null);
      setBusy(false);
    }
  }, [open]);

  async function submit() {
    if (!file) {
      setError(lang === "tr" ? "Dosya seçin." : "Select a file.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("purpose", purpose);
      const filesBase = apiScope === "admin" ? "/api/proxy/v1/admin/files" : "/api/proxy/v1/portal/files";
      const visaFormsBase =
        apiScope === "admin"
          ? "/api/proxy/v1/admin/language-camp-visa-forms"
          : "/api/proxy/v1/portal/language-camp-visa-forms";

      const upRes = await fetch(filesBase, { method: "POST", body: fd });
      const upData = (await upRes.json().catch(() => ({}))) as { id?: string };
      if (!upRes.ok || !upData.id) throw new Error(`upload failed (HTTP ${upRes.status})`);

      const attachRes = await fetch(`${visaFormsBase}/${visaFormId}/documents`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fileId: upData.id }),
      });
      if (!attachRes.ok) throw new Error(`attach failed (HTTP ${attachRes.status})`);

      onAdded();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("addVisaDocument", lang)}
      description={t("addVisaDocumentDescription", lang)}
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {t("cancel", lang)}
          </Button>
          <Button variant="primary" onClick={() => void submit()} disabled={busy || !file}>
            {busy ? t("creating", lang) : t("upload", lang)}
          </Button>
        </div>
      }
    >
      <div className="grid gap-4">
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-zinc-700">{t("documentPurpose", lang)}</span>
          <select
            className={selectCls}
            value={purpose}
            onChange={(e) => setPurpose(e.target.value as StoredFilePurposeType)}
          >
            {VISA_DOCUMENT_PURPOSE_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {labelStoredFilePurpose(p, lang)}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-zinc-700">{t("documents", lang)}</span>
          <input
            type="file"
            className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-teal-800 hover:file:bg-teal-100"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setError(null);
            }}
          />
          {file ? (
            <span className="text-xs text-zinc-500">
              {file.name} ({Math.round(file.size / 1024)} KB)
            </span>
          ) : null}
        </label>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-900">
            {error}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
