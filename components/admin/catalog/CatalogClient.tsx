"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon, PageHeader, Tabs } from "@/components/ui";
import { UniversitiesPanel } from "./UniversitiesPanel";
import { DepartmentsPanel } from "./DepartmentsPanel";
import { CountriesPanel } from "./CountriesPanel";
import { PortfolioSectionsPanel } from "./PortfolioSectionsPanel";

type CatalogTab = "universities" | "departments" | "countries" | "portfolio-sections";
const VALID_TABS: CatalogTab[] = ["universities", "departments", "countries", "portfolio-sections"];

const TAB_LABELS: Record<CatalogTab, string> = {
  universities: "Üniversiteler",
  departments: "Bölümler",
  countries: "Ülkeler",
  "portfolio-sections": "Ek Materyal Şablonları",
};

export function CatalogClient() {
  const router = useRouter();
  const params = useSearchParams();
  const tabParam = params.get("tab");
  const initial: CatalogTab = (VALID_TABS as string[]).includes(tabParam ?? "")
    ? (tabParam as CatalogTab)
    : "universities";

  const [tab, setTab] = React.useState<CatalogTab>(initial);

  // Sync URL ?tab=...
  React.useEffect(() => {
    const sp = new URLSearchParams(params.toString());
    if (sp.get("tab") !== tab) {
      sp.set("tab", tab);
      router.replace(`?${sp.toString()}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Katalog"
        title="Katalog Yönetimi"
        description="Üniversite, bölüm, ülke ve ek materyal şablonlarını bu ekrandan yönetin."
      />

      <Tabs<CatalogTab>
        variant="underline"
        value={tab}
        onChange={setTab}
        items={[
          {
            value: "universities",
            label: TAB_LABELS.universities,
            icon: <Icon name="school" size={14} />,
          },
          {
            value: "departments",
            label: TAB_LABELS.departments,
            icon: <Icon name="book" size={14} />,
          },
          {
            value: "countries",
            label: TAB_LABELS.countries,
            icon: <Icon name="globe" size={14} />,
          },
          {
            value: "portfolio-sections",
            label: TAB_LABELS["portfolio-sections"],
            icon: <Icon name="book" size={14} />,
          },
        ]}
      />

      <div className="pt-1">
        {tab === "universities" ? <UniversitiesPanel /> : null}
        {tab === "departments" ? <DepartmentsPanel /> : null}
        {tab === "countries" ? <CountriesPanel /> : null}
        {tab === "portfolio-sections" ? <PortfolioSectionsPanel /> : null}
      </div>
    </div>
  );
}
