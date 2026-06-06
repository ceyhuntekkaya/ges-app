"use client";

import * as React from "react";
import { t } from "@/lib/i18n/dict";
import type { UniversityApplicationPortfolioSectionDto } from "@/lib/api/generated/index";
import { UniversityApplicationPortfolioClient } from "./UniversityApplicationPortfolioClient";

export function UniversityApplicationPortfolioSection({
  applicationId,
  lang,
  initialSections,
  initialStatus,
}: {
  applicationId: string;
  lang: "tr" | "en";
  initialSections?: UniversityApplicationPortfolioSectionDto[];
  initialStatus?: string;
}) {
  const [sections, setSections] = React.useState(initialSections ?? []);
  const [status, setStatus] = React.useState(initialStatus);

  const reload = React.useCallback(async () => {
    const res = await fetch(`/api/proxy/v1/portal/university-applications/${encodeURIComponent(applicationId)}`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    const data = (await res.json()) as {
      portfolioSections?: UniversityApplicationPortfolioSectionDto[];
      status?: string;
    };
    setSections(data.portfolioSections ?? []);
    setStatus(data.status);
  }, [applicationId]);

  React.useEffect(() => {
    setSections(initialSections ?? []);
    setStatus(initialStatus);
  }, [initialSections, initialStatus]);

  return (
    <div>
      <div className="mb-3 text-base font-semibold tracking-tight text-zinc-900">
        {t("supplementaryMaterials", lang)}
      </div>
      <UniversityApplicationPortfolioClient
        applicationId={applicationId}
        lang={lang}
        sections={sections}
        editable={status === "DRAFT"}
        onChanged={reload}
      />
    </div>
  );
}
