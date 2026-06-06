import Link from "next/link";
import { applicationsUrlForProject } from "@/lib/applications/languageCampUrls";
import { getMyLanguageCampApplication } from "@/lib/api/portalServer";
import { getLang, t } from "@/lib/i18n";
import { LanguageCampApplicationEditClient } from "@/components/applications/LanguageCampApplicationEditClient";

export default async function LanguageCampApplicationEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const lang = await getLang();
  const { id } = await params;
  const res = await getMyLanguageCampApplication(id);
  const backHref =
    res.status === 200 && res.data?.languageCampProjectId
      ? applicationsUrlForProject(res.data.languageCampProjectId, id)
      : "/applications";

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
              {t("applicationForm", lang)} • {t("languageCamp", lang)}
            </h1>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              ID: <span className="font-mono">{id}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={backHref} className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
              {t("back", lang)}
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        {res.status !== 200 ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-900">
            {t("failedToLoad", lang)} (HTTP {res.status})
          </div>
        ) : (
          <LanguageCampApplicationEditClient lang={lang} initial={{ ...res.data, id: res.data?.id ?? id }} />
        )}
      </div>
    </div>
  );
}

