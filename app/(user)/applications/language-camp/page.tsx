import Link from "next/link";
import { listMyLanguageCampApplications } from "@/lib/api/portalServer";
import { getLang, t } from "@/lib/i18n";
import { tf } from "@/lib/i18n/dict";
import { labelApplicationStatus, labelLanguageCampCategory, labelUpdatedAt } from "@/lib/i18n/labels";

export default async function LanguageCampApplicationsPage() {
  const lang = await getLang();
  const res = await listMyLanguageCampApplications({ page: 0, size: 25 });
  const items = res.status === 200 ? (res.data?.items ?? []) : [];

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
              {t("languageCampApplications", lang)}
            </h1>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              {t("allLanguageCampApplicationsDesc", lang)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/applications/language-camp/new"
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
            >
              {t("new", lang)}
            </Link>
            <Link href="/applications" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
              {t("back", lang)}
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        {res.status !== 200 ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-900">
            {tf("failedToLoadHttp", lang, { status: res.status })}
            {process.env.NODE_ENV === "development" && res.errorText ? (
              <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap rounded-lg border border-rose-200 bg-white/50 p-2 text-xs text-rose-950">
                {res.errorText}
              </pre>
            ) : null}
          </div>
        ) : items.length === 0 ? (
          <div className="text-sm text-zinc-600">{t("noApplicationsYet", lang)}</div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {items.map((it) => (
              <li key={it.id ?? crypto.randomUUID()} className="py-3">
                <Link
                  href={it.id ? `/applications/language-camp/${it.id}` : "/applications/language-camp"}
                  className="flex items-center justify-between gap-3 rounded-lg px-1 py-1 hover:bg-zinc-50"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-zinc-900">
                      {labelLanguageCampCategory(it.category, lang)} {it.id ? `• ${it.id}` : ""}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {t("status", lang)}: {labelApplicationStatus(it.status, lang)} • {labelUpdatedAt(lang)}:{" "}
                      {it.updatedAt ?? it.createdAt ?? "-"}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

