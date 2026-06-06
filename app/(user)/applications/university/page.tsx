import Link from "next/link";
import { listMyUniversityApplications } from "@/lib/api/portalServer";
import { getLang, t } from "@/lib/i18n";
import { tf } from "@/lib/i18n/dict";
import { labelApplicationStatus, labelEducationLevel, labelUpdatedAt, formatDateTime } from "@/lib/i18n/labels";

export default async function UniversityApplicationsPage() {
  const lang = await getLang();
  const res = await listMyUniversityApplications({ page: 0, size: 25 });
  const items = res.status === 200 ? (res.data?.items ?? []) : [];

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
              {t("universityApplications", lang)}
            </h1>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{t("allUniversityApplicationsDesc", lang)}</p>
          </div>
          <Link href="/applications" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
            {t("back", lang)}
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        {res.status !== 200 ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-900">
            {tf("failedToLoadHttp", lang, { status: res.status })}
          </div>
        ) : items.length === 0 ? (
          <div className="text-sm text-zinc-600">{t("noApplicationsYet", lang)}</div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {items.map((it) => (
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
                      {t("status", lang)}: {labelApplicationStatus(it.status, lang)} • {labelUpdatedAt(lang)}:{" "}
                      {formatDateTime(lang, it.updatedAt ?? it.createdAt)}
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

