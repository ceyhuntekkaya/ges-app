"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { UniversityApplicationDto, UniversityApplicationUpdateDraft } from "@/lib/api/portalServer";
import { t } from "@/lib/i18n/dict";

export function UniversityApplicationEditClient({
  initial,
  lang,
}: {
  initial: UniversityApplicationDto;
  lang: "tr" | "en";
}) {
  const router = useRouter();
  const [draft, setDraft] = React.useState<UniversityApplicationUpdateDraft>({
    educationLevel: initial.educationLevel,
    startTermSeason: initial.startTermSeason,
    startYear: initial.startYear,
    yearlyBudgetMin: initial.yearlyBudgetMin,
    yearlyBudgetMax: initial.yearlyBudgetMax,
    scholarshipRequested: initial.scholarshipRequested,
    scholarshipType: initial.scholarshipType,
    accommodationType: initial.accommodationType,
    notes: initial.notes,
  });
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const id = initial.id!;

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const res = await fetch(`/api/portal/university-applications/${id}`, {
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
          <span className="text-xs font-semibold text-zinc-600">{t("educationLevel", lang)}</span>
          <select
            className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm"
            value={draft.educationLevel ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, educationLevel: e.target.value || undefined }))}
          >
            <option value="">-</option>
            <option value="BACHELOR">{t("bachelor", lang)}</option>
            <option value="MASTER">{t("master", lang)}</option>
            <option value="PHD">{t("phd", lang)}</option>
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-semibold text-zinc-600">{t("startTerm", lang)}</span>
          <select
            className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm"
            value={draft.startTermSeason ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, startTermSeason: e.target.value || undefined }))}
          >
            <option value="">-</option>
            <option value="FALL">{t("fall", lang)}</option>
            <option value="SPRING">{t("spring", lang)}</option>
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-semibold text-zinc-600">{t("startYear", lang)}</span>
          <input
            className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm"
            type="number"
            value={draft.startYear ?? ""}
            onChange={(e) =>
              setDraft((d) => ({ ...d, startYear: e.target.value ? Number(e.target.value) : undefined }))
            }
          />
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-semibold text-zinc-600">{t("scholarshipRequested", lang)}</span>
          <select
            className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm"
            value={draft.scholarshipRequested === undefined ? "" : draft.scholarshipRequested ? "yes" : "no"}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                scholarshipRequested:
                  e.target.value === "" ? undefined : e.target.value === "yes" ? true : false,
              }))
            }
          >
            <option value="">-</option>
            <option value="yes">{t("yes", lang)}</option>
            <option value="no">{t("no", lang)}</option>
          </select>
        </label>

        <label className="grid gap-1 sm:col-span-2">
          <span className="text-xs font-semibold text-zinc-600">{t("notes", lang)}</span>
          <textarea
            className="min-h-24 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
            value={draft.notes ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value || undefined }))}
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

