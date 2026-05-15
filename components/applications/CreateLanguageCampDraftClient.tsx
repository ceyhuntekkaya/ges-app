"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n/dict";

export function CreateLanguageCampDraftClient({
  lang,
  projectId,
}: {
  lang: "tr" | "en";
  projectId?: string;
}) {
  const router = useRouter();
  const [category, setCategory] = React.useState<"INDIVIDUAL" | "CORPORATE" | "FAMILY">("INDIVIDUAL");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId) {
      setError(lang === "tr" ? "Proje seçilmedi." : "No project selected.");
      return;
    }

    setPending(true);
    setError(null);

    const res = await fetch("/api/proxy/v1/portal/language-camp-applications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ category, languageCampProjectId: projectId }),
    });

    const data = (await res.json().catch(() => ({}))) as { id?: string };
    if (res.ok && data?.id) {
      router.push(`/applications/language-camp/${data.id}/edit`);
      return;
    }

    setPending(false);
    setError(`HTTP ${res.status}`);
  }

  if (!projectId) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-900">
        {lang === "tr"
          ? "Taslak oluşturmak için önce bir dil kampı projesi seçin."
          : "Select a language camp project before creating a draft."}
      </div>
    );
  }

  return (
    <form onSubmit={onCreate} className="grid gap-4">
      <label className="grid gap-1">
        <span className="text-xs font-semibold text-zinc-600">{t("category", lang)}</span>
        <select
          className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value as "INDIVIDUAL" | "CORPORATE" | "FAMILY")}
        >
          <option value="INDIVIDUAL">{t("individual", lang)}</option>
          <option value="CORPORATE">{t("corporate", lang)}</option>
          <option value="FAMILY">{t("family", lang)}</option>
        </select>
      </label>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:opacity-60"
        >
          {pending ? t("creating", lang) : t("create", lang)}
        </button>
        {error ? <div className="text-sm font-medium text-rose-700">{error}</div> : null}
      </div>
    </form>
  );
}
