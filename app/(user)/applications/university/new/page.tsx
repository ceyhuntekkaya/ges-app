import Link from "next/link";
import { getLang, t } from "@/lib/i18n";
import { CreateUniversityDraftClient } from "@/components/applications/CreateUniversityDraftClient";

export default async function NewUniversityApplicationPage() {
  const lang = await getLang();

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
              {t("applicationForm", lang)} • {t("university", lang)}
            </h1>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{t("selectEducationLevelToStart", lang)}</p>
          </div>
          <Link href="/applications/university" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
            {t("back", lang)}
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <CreateUniversityDraftClient lang={lang} />
      </div>
    </div>
  );
}

