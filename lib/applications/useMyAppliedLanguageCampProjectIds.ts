"use client";

import * as React from "react";
import { applicationsUrlForProject } from "@/lib/applications/languageCampUrls";

export { applicationsUrlForProject };

export async function fetchMyAppliedLanguageCampProjectIds(): Promise<Set<string>> {
  const res = await fetch("/api/proxy/v1/portal/language-camp-application-groups", { cache: "no-store" });
  if (res.status !== 200) return new Set();
  const data = (await res.json().catch(() => [])) as { projectId?: string }[];
  const list = Array.isArray(data) ? data : [];
  return new Set(list.map((g) => g.projectId).filter((id): id is string => Boolean(id)));
}

export function useMyAppliedLanguageCampProjectIds() {
  const [appliedProjectIds, setAppliedProjectIds] = React.useState<Set<string>>(() => new Set());
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    void fetchMyAppliedLanguageCampProjectIds().then((ids) => {
      if (!alive) return;
      setAppliedProjectIds(ids);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  return { appliedProjectIds, loading };
}
