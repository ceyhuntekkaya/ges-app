import Link from "next/link";
import { getLang, t } from "@/lib/i18n";
import { formatDateTime } from "@/lib/i18n/labels";
import { getMyUniversityApplication } from "@/lib/api/portalServer";
import { UniversityApplicationDocumentsClient } from "@/components/applications/UniversityApplicationDocumentsClient";
import { UniversityApplicationPortfolioSection } from "@/components/applications/UniversityApplicationPortfolioSection";

export default async function UniversityApplicationDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const lang = await getLang();
  const { id } = await params;
  const res = await getMyUniversityApplication(id);

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
              {t("details", lang)} • {t("university", lang)}
            </h1>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              {t("status", lang)}: {res.status === 200 ? (res.data?.status ?? "-") : `HTTP ${res.status}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/applications" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
              {t("back", lang)}
            </Link>
            <Link
              href={`/applications/university/${id}/edit`}
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
            >
              {t("editDraft", lang)}
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
          <div className="grid gap-6">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold text-zinc-500">{t("status", lang)}</dt>
                <dd className="mt-1 text-sm font-medium text-zinc-900">{res.data?.status ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-zinc-500">ID</dt>
                <dd className="mt-1 text-sm font-mono text-zinc-900">{res.data?.id ?? id}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-zinc-500">{t("updated", lang)}</dt>
                <dd className="mt-1 text-sm text-zinc-900">{formatDateTime(lang, res.data?.updatedAt)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-zinc-500">{t("created", lang)}</dt>
                <dd className="mt-1 text-sm text-zinc-900">{formatDateTime(lang, res.data?.createdAt)}</dd>
              </div>
            </dl>

            <div className="border-t border-zinc-100 pt-6">
              <div className="mb-3 text-base font-semibold tracking-tight text-zinc-900">
                {t("applicationDocuments", lang)}
              </div>
              <UniversityApplicationDocumentsClient
                applicationId={res.data?.id ?? id}
                lang={lang}
                initialLegacyDocuments={res.data?.documents}
              />
            </div>

            <div className="border-t border-zinc-100 pt-6">
              <UniversityApplicationPortfolioSection
                applicationId={res.data?.id ?? id}
                lang={lang}
                initialSections={res.data?.portfolioSections}
                initialStatus={res.data?.status}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

