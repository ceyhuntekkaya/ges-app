import Link from "next/link";
import { getLang, t } from "@/lib/i18n";
import { CreateLanguageCampDraftClient } from "@/components/applications/CreateLanguageCampDraftClient";

export default async function NewLanguageCampApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const lang = await getLang();
  const { projectId } = await searchParams;

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
              {t("applicationForm", lang)} • {t("languageCamp", lang)}
            </h1>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{t("selectCategoryToStart", lang)}</p>
          </div>
          <Link href="/applications/language-camp" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
            {t("back", lang)}
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <CreateLanguageCampDraftClient lang={lang} projectId={projectId} />
      </div>
    </div>
  );
}

