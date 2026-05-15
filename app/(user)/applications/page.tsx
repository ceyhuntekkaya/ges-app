import Link from "next/link";
import { Suspense } from "react";
import { MyApplicationsClient, type MyApplicationTab } from "@/components/applications/MyApplicationsClient";
import {
  getMyLanguageCampApplication,
  getMyUniversityApplication,
  listMyLanguageCampApplications,
  listMyUniversityApplications,
} from "@/lib/api/portalServer";
import { getLang, t } from "@/lib/i18n";
import { tf } from "@/lib/i18n/dict";
import { labelEducationLevel, labelLanguageCampCategory } from "@/lib/i18n/labels";

type ListEntry = {
  key: string;
  kind: "university" | "language-camp";
  id: string;
  title: string;
  status?: string;
  sortAt: string;
};

function sortKey(updatedAt?: string, createdAt?: string) {
  return updatedAt ?? createdAt ?? "";
}

async function buildApplicationTabs(
  lang: Awaited<ReturnType<typeof getLang>>,
  uniItems: { id?: string; status?: string; educationLevel?: string; createdAt?: string; updatedAt?: string }[],
  campItems: { id?: string; status?: string; category?: string; createdAt?: string; updatedAt?: string }[],
): Promise<MyApplicationTab[]> {
  const listEntries: ListEntry[] = [
    ...uniItems
      .filter((it) => it.id)
      .map((it) => ({
        key: `uni-${it.id}`,
        kind: "university" as const,
        id: it.id!,
        title: labelEducationLevel(it.educationLevel, lang),
        status: it.status,
        sortAt: sortKey(it.updatedAt, it.createdAt),
      })),
    ...campItems
      .filter((it) => it.id)
      .map((it) => ({
        key: `camp-${it.id}`,
        kind: "language-camp" as const,
        id: it.id!,
        title: labelLanguageCampCategory(it.category, lang),
        status: it.status,
        sortAt: sortKey(it.updatedAt, it.createdAt),
      })),
  ].sort((a, b) => b.sortAt.localeCompare(a.sortAt));

  const details = await Promise.all(
    listEntries.map(async (entry) => {
      if (entry.kind === "university") {
        const res = await getMyUniversityApplication(entry.id);
        return {
          ...entry,
          university: res.status === 200 ? res.data : undefined,
          loadError: res.status !== 200 ? res.status : undefined,
        } satisfies MyApplicationTab;
      }
      const res = await getMyLanguageCampApplication(entry.id);
      return {
        ...entry,
        languageCamp: res.status === 200 ? res.data : undefined,
        loadError: res.status !== 200 ? res.status : undefined,
      } satisfies MyApplicationTab;
    }),
  );

  return details;
}

export default async function ApplicationsPage() {
  const lang = await getLang();
  const [uniRes, campRes] = await Promise.all([
    listMyUniversityApplications({ page: 0, size: 50 }),
    listMyLanguageCampApplications({ page: 0, size: 50 }),
  ]);

  const loadFailed = uniRes.status !== 200 || campRes.status !== 200;
  const uniItems = uniRes.status === 200 ? (uniRes.data?.items ?? []) : [];
  const campItems = campRes.status === 200 ? (campRes.data?.items ?? []) : [];
  const tabs = loadFailed ? [] : await buildApplicationTabs(lang, uniItems, campItems);
  const hasApplications = tabs.length > 0;

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

      {loadFailed ? (
        <div className="grid gap-3">
          {uniRes.status !== 200 ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-900">
              {t("university", lang)}: {tf("failedToLoadHttp", lang, { status: uniRes.status })}
            </div>
          ) : null}
          {campRes.status !== 200 ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-900">
              {t("languageCamp", lang)}: {tf("failedToLoadHttp", lang, { status: campRes.status })}
            </div>
          ) : null}
        </div>
      ) : !hasApplications ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 px-5 py-10 text-center">
          <p className="text-sm text-zinc-600">{t("noApplicationsYet", lang)}</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
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
      ) : (
        <Suspense fallback={<p className="text-sm text-zinc-500">{t("loading", lang)}</p>}>
          <MyApplicationsClient lang={lang} tabs={tabs} />
        </Suspense>
      )}
    </div>
  );
}
