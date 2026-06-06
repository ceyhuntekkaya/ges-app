import Link from "next/link";
import { getMyUniversityApplication } from "@/lib/api/portalServer";
import { getLang, t } from "@/lib/i18n";
import { UniversityApplicationEditClient } from "@/components/applications/UniversityApplicationEditClient";
import { UniversityApplicationDocumentsClient } from "@/components/applications/UniversityApplicationDocumentsClient";
import { UniversityApplicationPortfolioSection } from "@/components/applications/UniversityApplicationPortfolioSection";

export default async function UniversityApplicationEditPage({
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
              {t("applicationForm", lang)} • {t("university", lang)}
            </h1>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              ID: <span className="font-mono">{id}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/applications/university/${id}`}
              className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
            >
              {t("details", lang)}
            </Link>
            <Link href="/applications/university" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
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
          <div className="grid gap-6">
            <UniversityApplicationEditClient lang={lang} initial={{ ...res.data, id: res.data?.id ?? id }} />

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

