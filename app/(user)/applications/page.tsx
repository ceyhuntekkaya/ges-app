import Link from "next/link";
import { listMyLanguageCampApplications, listMyUniversityApplications } from "@/lib/api/portalServer";
import { getLang, t } from "@/lib/i18n";
import { tf } from "@/lib/i18n/dict";
import {
  labelApplicationStatus,
  labelEducationLevel,
  labelLanguageCampCategory,
  labelUpdatedAt,
} from "@/lib/i18n/labels";

function badgeVariant(status?: string) {
  switch (status) {
    case "DRAFT":
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
    case "SUBMITTED":
      return "bg-sky-50 text-sky-800 border-sky-200";
    case "IN_REVIEW":
      return "bg-amber-50 text-amber-900 border-amber-200";
    case "MISSING_DOCUMENTS":
      return "bg-rose-50 text-rose-900 border-rose-200";
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-900 border-emerald-200";
    case "REJECTED":
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
    default:
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
  }
}

export default async function ApplicationsPage() {
  const lang = await getLang();
  const [uniRes, campRes] = await Promise.all([
    listMyUniversityApplications({ page: 0, size: 5 }),
    listMyLanguageCampApplications({ page: 0, size: 5 }),
  ]);

  const uniItems = uniRes.status === 200 ? (uniRes.data?.items ?? []) : [];
  const campItems = campRes.status === 200 ? (campRes.data?.items ?? []) : [];
  const uniTotal = uniRes.status === 200 ? (uniRes.data?.totalItems ?? uniItems.length) : 0;
  const campTotal = campRes.status === 200 ? (campRes.data?.totalItems ?? campItems.length) : 0;

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900">{t("myApplications", lang)}</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{t("intro", lang)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/applications/university/new"
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
            >
              {t("createUniversityDraft", lang)}
            </Link>
            <Link
              href="/applications/language-camp/new"
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
            >
              {t("createLanguageCampDraft", lang)}
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/applications/university"
          className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-[1px] hover:border-zinc-300 hover:shadow"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-zinc-500">{t("application", lang)}</div>
              <div className="mt-1 text-lg font-semibold tracking-tight text-zinc-900">
                {t("university", lang)}
              </div>
            </div>
            <div className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm font-semibold text-zinc-800">
              {uniTotal}
            </div>
          </div>
          <div className="mt-3 text-sm text-zinc-600">
            {t("universityCardDesc", lang)}
          </div>
          <div className="mt-4 text-sm font-medium text-zinc-900 underline-offset-4 group-hover:underline">
            {t("view", lang)}
          </div>
        </Link>

        <Link
          href="/applications/language-camp"
          className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-[1px] hover:border-zinc-300 hover:shadow"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-zinc-500">{t("application", lang)}</div>
              <div className="mt-1 text-lg font-semibold tracking-tight text-zinc-900">
                {t("languageCamp", lang)}
              </div>
            </div>
            <div className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm font-semibold text-zinc-800">
              {campTotal}
            </div>
          </div>
          <div className="mt-3 text-sm text-zinc-600">
            {t("languageCampCardDesc", lang)}
          </div>
          <div className="mt-4 text-sm font-medium text-zinc-900 underline-offset-4 group-hover:underline">
            {t("view", lang)}
          </div>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold tracking-tight text-zinc-900">
              {t("recentUniversity", lang)}
            </h2>
            <Link
              href="/applications/university"
              className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
            >
              {t("all", lang)}
            </Link>
          </div>

          {uniRes.status !== 200 ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-900">
              {tf("failedToLoadHttp", lang, { status: uniRes.status })}
              {process.env.NODE_ENV === "development" && uniRes.errorText ? (
                <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg border border-rose-200 bg-white/50 p-2 text-xs text-rose-950">
                  {uniRes.errorText}
                </pre>
              ) : null}
            </div>
          ) : uniItems.length === 0 ? (
            <div className="mt-4 text-sm text-zinc-600">{t("noApplicationsYet", lang)}</div>
          ) : (
            <ul className="mt-4 divide-y divide-zinc-100">
              {uniItems.map((it) => (
                <li key={it.id ?? crypto.randomUUID()} className="py-3">
                  <Link
                    href={it.id ? `/applications/university/${it.id}` : "/applications/university"}
                    className="flex items-center justify-between gap-3 rounded-lg px-1 py-1 hover:bg-zinc-50"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-zinc-900">
                        {labelEducationLevel(it.educationLevel, lang)} {it.id ? `• ${it.id}` : ""}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {labelUpdatedAt(lang)}: {it.updatedAt ?? it.createdAt ?? "-"}
                      </div>
                    </div>
                    <div
                      className={[
                        "shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold",
                        badgeVariant(it.status),
                      ].join(" ")}
                    >
                      {labelApplicationStatus(it.status, lang)}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold tracking-tight text-zinc-900">
              {t("recentLanguageCamp", lang)}
            </h2>
            <Link
              href="/applications/language-camp"
              className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
            >
              {t("all", lang)}
            </Link>
          </div>

          {campRes.status !== 200 ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-900">
              {tf("failedToLoadHttp", lang, { status: campRes.status })}
              {process.env.NODE_ENV === "development" && campRes.errorText ? (
                <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg border border-rose-200 bg-white/50 p-2 text-xs text-rose-950">
                  {campRes.errorText}
                </pre>
              ) : null}
            </div>
          ) : campItems.length === 0 ? (
            <div className="mt-4 text-sm text-zinc-600">{t("noApplicationsYet", lang)}</div>
          ) : (
            <ul className="mt-4 divide-y divide-zinc-100">
              {campItems.map((it) => (
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
                        {labelUpdatedAt(lang)}: {it.updatedAt ?? it.createdAt ?? "-"}
                      </div>
                    </div>
                    <div
                      className={[
                        "shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold",
                        badgeVariant(it.status),
                      ].join(" ")}
                    >
                      {labelApplicationStatus(it.status, lang)}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

