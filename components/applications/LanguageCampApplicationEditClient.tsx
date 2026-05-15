"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { LanguageCampApplicationDto, LanguageCampApplicationUpdateDraft } from "@/lib/api/portalServer";
import { t } from "@/lib/i18n/dict";

export function LanguageCampApplicationEditClient({
  initial,
  lang,
}: {
  initial: LanguageCampApplicationDto;
  lang: "tr" | "en";
}) {
  const router = useRouter();
  const [draft, setDraft] = React.useState<LanguageCampApplicationUpdateDraft>({
    category: initial.category,
    languageCampProjectId: initial.languageCampProjectId,
    accommodationType: initial.accommodationType,
    visaNeeded: initial.visaNeeded,
    visaFollowByGes: initial.visaFollowByGes,
    paymentPreference: initial.paymentPreference,
    userNotes: initial.userNotes,
  });
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const id = initial.id!;

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const res = await fetch(`/api/portal/language-camp-applications/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(draft),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 1500);
    }
  }

  return (
    <form onSubmit={onSave} className="grid gap-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-zinc-600">{t("category", lang)}</span>
          <select
            className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm"
            value={draft.category ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value || undefined }))}
          >
            <option value="">-</option>
            <option value="INDIVIDUAL">{t("individual", lang)}</option>
            <option value="CORPORATE">{t("corporate", lang)}</option>
            <option value="FAMILY">{t("family", lang)}</option>
          </select>
        </label>

        <label className="grid gap-1 sm:col-span-2">
          <span className="text-xs font-semibold text-zinc-600">{t("languageCampProjectId", lang)}</span>
          <input
            className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-mono"
            value={draft.languageCampProjectId ?? ""}
            onChange={(e) =>
              setDraft((d) => ({ ...d, languageCampProjectId: e.target.value || undefined }))
            }
            readOnly={!!initial.languageCampProjectId}
          />
          {initial.languageCampProjectTitle ? (
            <span className="text-xs text-zinc-500">{initial.languageCampProjectTitle}</span>
          ) : null}
        </label>

        <label className="grid gap-1 sm:col-span-2">
          <span className="text-xs font-semibold text-zinc-600">{t("notes", lang)}</span>
          <textarea
            className="min-h-24 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
            value={draft.userNotes ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, userNotes: e.target.value || undefined }))}
          />
        </label>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:opacity-60"
        >
          {saving ? t("saving", lang) : t("save", lang)}
        </button>
        {saved ? <div className="text-sm font-medium text-emerald-700">{t("saved", lang)}</div> : null}
      </div>
    </form>
  );
}

