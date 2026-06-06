import Link from "next/link";
import { Suspense } from "react";
import { MyApplicationsClient, type MyApplicationTab } from "@/components/applications/MyApplicationsClient";
import { groupSortKey } from "@/lib/applications/languageCampDisplay";
import type { PortalResult } from "@/lib/api/portalServer";
import {
  getMyUniversityApplication,
  listMyLanguageCampApplicationGroups,
  listMyUniversityApplications,
  type LanguageCampApplicationGroupDto,
} from "@/lib/api/portalServer";
import { getLang, t } from "@/lib/i18n";
import { tf } from "@/lib/i18n/dict";
import { labelEducationLevel } from "@/lib/i18n/labels";

function sortKey(updatedAt?: string, createdAt?: string) {
  return updatedAt ?? createdAt ?? "";
}

async function buildApplicationTabs(
  lang: Awaited<ReturnType<typeof getLang>>,
  uniRes: PortalResult<{ items?: { id?: string; status?: string; educationLevel?: string; createdAt?: string; updatedAt?: string }[] }>,
  groupsRes: PortalResult<LanguageCampApplicationGroupDto[]>,
): Promise<MyApplicationTab[]> {
  const uniEntries = (uniRes.status === 200 ? (uniRes.data?.items ?? []) : [])
    .filter((it) => it.id)
    .map((it) => ({
      key: `uni-${it.id}`,
      kind: "university" as const,
      id: it.id!,
      title: labelEducationLevel(it.educationLevel, lang),
      status: it.status,
      sortAt: sortKey(it.updatedAt, it.createdAt),
    }));

  const campEntries =
    groupsRes.status === 200
      ? (groupsRes.data ?? [])
          .filter((g) => g.projectId)
          .map((g) => ({
            key: `camp-proj-${g.projectId}`,
            kind: "language-camp-group" as const,
            projectId: g.projectId!,
            title: g.project?.title ?? t("languageCamp", lang),
            group: g,
            sortAt: groupSortKey(g.participants),
          }))
      : [];

  const merged = [...uniEntries, ...campEntries].sort((a, b) => b.sortAt.localeCompare(a.sortAt));

  const uniDetails = await Promise.all(
    merged
      .filter((e) => e.kind === "university")
      .map(async (entry) => {
        const res = await getMyUniversityApplication(entry.id);
        return {
          ...entry,
          university: res.status === 200 ? res.data : undefined,
          loadError: res.status !== 200 ? res.status : undefined,
        };
      }),
  );

  const uniByKey = new Map(uniDetails.map((u) => [u.key, u]));

  return merged.map((entry) => {
    if (entry.kind === "university") {
      return uniByKey.get(entry.key) ?? { ...entry, loadError: 404 };
    }
    if (groupsRes.status !== 200) {
      return { ...entry, loadError: groupsRes.status };
    }
    return entry;
  });
}

export default async function ApplicationsPage() {
  const lang = await getLang();
  const [uniRes, groupsRes] = await Promise.all([
    listMyUniversityApplications({ page: 0, size: 50 }),
    listMyLanguageCampApplicationGroups(),
  ]);

  const loadFailed = uniRes.status !== 200 || groupsRes.status !== 200;
  const tabs = loadFailed ? [] : await buildApplicationTabs(lang, uniRes, groupsRes);
  const hasApplications = tabs.length > 0;

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900">{t("myApplications", lang)}</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{t("intro", lang)}</p>
          </div>
          <Link
            href="/apply"
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
          >
            {t("createLanguageCampDraft", lang)}
          </Link>
        </div>
      </div>

      {loadFailed ? (
        <div className="grid gap-3">
          {uniRes.status !== 200 ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-900">
              {t("university", lang)}: {tf("failedToLoadHttp", lang, { status: uniRes.status })}
            </div>
          ) : null}
          {groupsRes.status !== 200 ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-900">
              {t("languageCamp", lang)}: {tf("failedToLoadHttp", lang, { status: groupsRes.status })}
            </div>
          ) : null}
        </div>
      ) : !hasApplications ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 px-5 py-10 text-center">
          <p className="text-sm text-zinc-600">{t("noApplicationsYet", lang)}</p>
          <div className="mt-4">
            <Link
              href="/apply"
              className="inline-flex rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
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
