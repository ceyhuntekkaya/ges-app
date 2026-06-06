"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, EmptyState, Skeleton, Icon, Badge, Button, Input } from "@/components/ui";
import { humanizeApiError } from "@/lib/api/errors";
import {
  publicLanguageCampProjectsListActive,
  type LanguageCampProjectPublicListItemDto,
  type PageDtoLanguageCampProjectPublicListItemDto,
} from "@/lib/api/generated/index";
import { useMyAppliedLanguageCampProjectIds } from "@/lib/applications/useMyAppliedLanguageCampProjectIds";

type TabKey = "individual" | "corporate";

function tabToIndividual(tab: TabKey) {
  return tab === "individual";
}

function formatMoney(price?: number, currency?: string) {
  if (price === undefined || price === null) return null;
  const cur = currency?.trim() || "TRY";
  try {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: cur }).format(price);
  } catch {
    return `${price} ${cur}`;
  }
}

function projectTypeLabel(t?: string) {
  switch (t) {
    case "INTERNATIONAL_TRIP":
      return "Yurt Dışı Gezi";
    case "LOCAL_TRIP":
      return "Yurt İçi Gezi";
    case "INTERNATIONAL_SUMMER_SCHOOL":
      return "Yaz Okulu";
    case "INTERNATIONAL_EDUCATION":
      return "Eğitim";
    case "INTERNATIONAL_HIGH_SCHOOL":
      return "Lise";
    case "INTERNATIONAL_UNIVERSITY":
      return "Üniversite";
    case "INTERNATIONAL_TRAVEL_INSURANCE":
      return "Seyahat Sigortası";
    default:
      return t ?? "Program";
  }
}

function CardImage({ src, alt }: { src?: string; alt: string }) {
  if (!src) {
    return (
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--border-subtle)] bg-gradient-to-br from-[var(--accent-50)] via-white to-[var(--surface-2)]">
        <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.18),transparent_55%),radial-gradient(circle_at_70%_65%,rgba(16,185,129,0.18),transparent_55%)]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/35 to-transparent" />
        <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-[var(--text-secondary)] shadow-[var(--shadow-xs)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-600)]" />
          Yeni dönem
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--border-subtle)] bg-[var(--surface-2)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/55 to-transparent" />
    </div>
  );
}

function ProjectCard({
  p,
  alreadyApplied,
}: {
  p: LanguageCampProjectPublicListItemDto;
  alreadyApplied?: boolean;
}) {
  const price = formatMoney(p.price, p.currency);
  const original = formatMoney(p.originalPrice, p.currency);

  return (
    <div className="group rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--surface-0)] shadow-[var(--shadow-xs)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]">
      <Link href={`/apply/${encodeURIComponent(p.id ?? "")}`} className="block p-3">
        <CardImage src={p.smallBanner} alt={p.title ?? "Program"} />
        <div className="mt-3 space-y-2 px-1 pb-1">
          {alreadyApplied ? (
            <div className="rounded-[var(--radius-lg)] border border-[var(--accent-200)] bg-[var(--accent-50)] px-2.5 py-1.5 text-xs font-medium text-[var(--accent-800)]">
              Daha önce bu programa başvuru yapıldı
            </div>
          ) : null}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold tracking-tight text-[var(--text-primary)]">
                {p.title ?? "Program"}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--text-tertiary)]">
                <span className="inline-flex items-center gap-1">
                  <Icon name="map-pin" size={14} />
                  {p.location || "Konum yakında"}
                </span>
                {p.duration ? (
                  <span className="inline-flex items-center gap-1">
                    <Icon name="clock" size={14} />
                    {p.duration}
                  </span>
                ) : null}
              </div>
            </div>
            <Badge variant="outline" size="sm">
              {projectTypeLabel(p.projectType)}
            </Badge>
          </div>

          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              {price ? (
                <div className="text-sm font-semibold text-[var(--text-primary)]">{price}</div>
              ) : (
                <div className="text-sm font-semibold text-[var(--text-primary)]">Fiyat sorunuz</div>
              )}
              {original && original !== price ? (
                <div className="text-xs text-[var(--text-tertiary)] line-through">{original}</div>
              ) : (
                <div className="text-xs text-[var(--text-tertiary)]">Kontenjan & tarih bilgisi detayda</div>
              )}
            </div>
            <div className="inline-flex items-center gap-2 text-xs font-medium text-[var(--accent-700)]">
              Detay
              <span aria-hidden className="transition-transform duration-150 group-hover:translate-x-0.5">
                →
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

export function ApplyProjectsClient() {
  const router = useRouter();
  const { appliedProjectIds } = useMyAppliedLanguageCampProjectIds();
  const sp = useSearchParams();
  const type = (sp.get("type") || "individual") as TabKey;
  const activeTab: TabKey = type === "corporate" ? "corporate" : "individual";
  const companyCodeFromUrl = (sp.get("companyCode") || "").trim();
  const isCorporate = activeTab === "corporate";
  const corporateReady = !isCorporate || companyCodeFromUrl.length > 0;

  const [companyCodeInput, setCompanyCodeInput] = React.useState(companyCodeFromUrl);
  const [loading, setLoading] = React.useState(corporateReady);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(0);
  const [data, setData] = React.useState<PageDtoLanguageCampProjectPublicListItemDto | null>(null);

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 0;

  React.useEffect(() => {
    setCompanyCodeInput(companyCodeFromUrl);
  }, [companyCodeFromUrl]);

  const load = React.useCallback(
    async (nextPage: number, mode: "replace" | "append") => {
      if (!corporateReady) {
        setLoading(false);
        setError(null);
        setData(null);
        setPage(0);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await publicLanguageCampProjectsListActive({
          page: nextPage,
          size: 24,
          individual: tabToIndividual(activeTab),
          companyCode: isCorporate ? companyCodeFromUrl : undefined,
        });
        const payload = res.data ?? {};
        setData((prev) => {
          if (mode === "append") {
            return { ...payload, items: [...(prev?.items ?? []), ...(payload.items ?? [])] };
          }
          return payload;
        });
        setPage(nextPage);
      } catch (e) {
        setData(mode === "append" ? data : null);
        setError(humanizeApiError(e));
      } finally {
        setLoading(false);
      }
    },
    [activeTab, companyCodeFromUrl, corporateReady, data, isCorporate],
  );

  React.useEffect(() => {
    void load(0, "replace");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, companyCodeFromUrl]);

  const submitCompanyCode = React.useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const code = companyCodeInput.trim();
      if (!code) return;
      const next = new URLSearchParams(sp.toString());
      next.set("type", "corporate");
      next.set("companyCode", code);
      router.push(`/apply?${next.toString()}`);
    },
    [companyCodeInput, router, sp],
  );

  const clearCompanyCode = React.useCallback(() => {
    const next = new URLSearchParams(sp.toString());
    next.set("type", "corporate");
    next.delete("companyCode");
    router.push(`/apply?${next.toString()}`);
  }, [router, sp]);

  const tabs = React.useMemo(
    () => [
      { value: "individual" as const, label: "BİREYSEL ORGANİZASYONLAR" },
      { value: "corporate" as const, label: "KURUMSAL ORGANİZASYONLAR" },
    ],
    [],
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10">
      <div className="rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--surface-0)] p-7 shadow-[var(--shadow-xs)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
              Başvuru
            </div>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-2xl">
              Programını seç, başvurunu başlat
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-tertiary)]">
              Bireysel veya kurumsal seçeneklerden birini seçip aktif projeleri inceleyebilirsin.
            </p>
          </div>
          <Button variant="secondary" onClick={() => router.push("/")} leftIcon={<Icon name="arrow-left" size={16} />}>
            Ana sayfa
          </Button>
        </div>

        <div className="mt-6">
          <Tabs
            items={tabs}
            value={activeTab}
            onChange={(v) => {
              const next = new URLSearchParams(sp.toString());
              next.set("type", v);
              if (v !== "corporate") {
                next.delete("companyCode");
              }
              router.push(`/apply?${next.toString()}`);
            }}
            variant="pill"
            fullWidth
          />
        </div>
      </div>

      <div className="mt-6">
        {isCorporate && !corporateReady ? (
          <div className="rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--surface-0)] p-7 shadow-[var(--shadow-xs)]">
            <div className="mx-auto max-w-md">
              <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                Kurumsal erişim
              </div>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-[var(--text-primary)]">
                Şirket kodunuzu girin
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-tertiary)]">
                Kurumsal organizasyonları görmek için okul veya kurumunuzun size verdiği şirket kodunu girin.
              </p>
              <form className="mt-5 space-y-4" onSubmit={submitCompanyCode}>
                <Input
                  label="Şirket kodu"
                  value={companyCodeInput}
                  onChange={(e) => setCompanyCodeInput(e.target.value)}
                  placeholder="Örn. OKUL2026"
                  autoComplete="off"
                />
                <Button type="submit" disabled={!companyCodeInput.trim()} leftIcon={<Icon name="chevron-right" size={16} />}>
                  Organizasyonları göster
                </Button>
              </form>
            </div>
          </div>
        ) : null}

        {corporateReady && isCorporate ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3">
            <div className="text-sm text-[var(--text-secondary)]">
              Şirket kodu: <span className="font-semibold text-[var(--text-primary)]">{companyCodeFromUrl}</span>
            </div>
            <Button variant="secondary" size="sm" onClick={clearCompanyCode}>
              Kodu değiştir
            </Button>
          </div>
        ) : null}

        {error ? (
          <EmptyState
            icon={<Icon name="warning" size={18} />}
            title="Projeler yüklenemedi"
            description={error}
            action={
              <Button variant="secondary" onClick={() => void load(0, "replace")}>
                Tekrar dene
              </Button>
            }
          />
        ) : null}

        {!error && loading && items.length === 0 && corporateReady ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--surface-0)] p-3 shadow-[var(--shadow-xs)]"
              >
                <Skeleton className="aspect-[16/10] w-full rounded-[var(--radius-2xl)]" />
                <div className="mt-3 space-y-2 px-1">
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-3 w-3/5" />
                  <Skeleton className="h-4 w-2/5" />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!error && !loading && items.length === 0 && corporateReady ? (
          <EmptyState
            icon={<Icon name="globe" size={18} />}
            title={isCorporate ? "Bu şirket için organizasyon bulunamadı" : "Aktif proje bulunamadı"}
            description={
              isCorporate
                ? "Girdiğiniz şirket koduna bağlı aktif bir kurumsal organizasyon bulunamadı."
                : "Başvuruya açık bireysel proje bulunamadı. Yeni projeler eklendiğinde burada görünecek."
            }
          />
        ) : null}

        {items.length > 0 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p) => (
                <ProjectCard
                  key={p.id ?? crypto.randomUUID()}
                  p={p}
                  alreadyApplied={p.id ? appliedProjectIds.has(p.id) : false}
                />
              ))}
            </div>

            <div className="mt-8 flex items-center justify-center">
              {totalPages > 0 && page + 1 < totalPages ? (
                <Button
                  variant="secondary"
                  onClick={() => void load(page + 1, "append")}
                  disabled={loading}
                  leftIcon={<Icon name="plus" size={16} />}
                >
                  Daha fazla göster
                </Button>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

