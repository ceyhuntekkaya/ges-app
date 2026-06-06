"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, EmptyState, Icon, Modal, Skeleton } from "@/components/ui";
import { humanizeApiError, humanizeStatus } from "@/lib/api/errors";
import { publicLanguageCampProjectsGetActive, type LanguageCampProjectDetailDto } from "@/lib/api/generated/index";
import {
  applicationsUrlForProject,
  useMyAppliedLanguageCampProjectIds,
} from "@/lib/applications/useMyAppliedLanguageCampProjectIds";
import { LoginForm } from "@/components/login/LoginForm";

function formatMoney(price?: number, currency?: string) {
  if (price === undefined || price === null) return null;
  const cur = currency?.trim() || "TRY";
  try {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: cur }).format(price);
  } catch {
    return `${price} ${cur}`;
  }
}

function formatDate(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", year: "numeric" }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

function stripHtml(s?: string) {
  if (!s) return "";
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function firstImage(p?: LanguageCampProjectDetailDto) {
  return p?.banner || p?.smallBanner || (p?.images && p.images[0]) || undefined;
}

function categoryFromProject(p: LanguageCampProjectDetailDto): "INDIVIDUAL" | "CORPORATE" {
  return p.individual === false ? "CORPORATE" : "INDIVIDUAL";
}

function kvList(xs?: string[] | null) {
  const items = (xs ?? []).filter(Boolean);
  if (items.length === 0) return null;
  return (
    <ul className="mt-3 grid gap-2 text-sm text-[var(--text-secondary)]">
      {items.map((x, i) => (
        <li key={`${x}-${i}`} className="flex gap-2">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent-600)]" />
          <span className="min-w-0">{x}</span>
        </li>
      ))}
    </ul>
  );
}

export function ApplyProjectDetailClient({
  id,
  isAuthenticated,
}: {
  id: string;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const { appliedProjectIds, loading: appliedLoading } = useMyAppliedLanguageCampProjectIds();
  const hasApplied = appliedProjectIds.has(id);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [p, setP] = React.useState<LanguageCampProjectDetailDto | null>(null);

  const [startOpen, setStartOpen] = React.useState(false);
  const [startStep, setStartStep] = React.useState<"choice" | "login">("choice");
  const [soonMessage, setSoonMessage] = React.useState<string | null>(null);
  const [starting, setStarting] = React.useState(false);
  const [startError, setStartError] = React.useState<string | null>(null);

  const startLoggedInApplication = React.useCallback(async () => {
    if (!p) return;
    setStarting(true);
    setStartError(null);
    try {
      const res = await fetch("/api/proxy/v1/portal/language-camp-applications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          category: categoryFromProject(p),
          languageCampProjectId: id,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { id?: string };
      if (res.ok && data?.id) {
        router.push(`/applications/language-camp/${data.id}/edit`);
        return;
      }
      setStartError(humanizeStatus(res.status));
    } catch (e) {
      setStartError(humanizeApiError(e));
    } finally {
      setStarting(false);
    }
  }, [id, p, router]);

  const onStartApplication = React.useCallback(() => {
    setStartError(null);
    if (isAuthenticated) {
      void startLoggedInApplication();
      return;
    }
    setStartStep("choice");
    setStartOpen(true);
  }, [isAuthenticated, startLoggedInApplication]);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    setP(null);

    (async () => {
      try {
        const res = await publicLanguageCampProjectsGetActive(id);
        if (!alive) return;
        setP(res.data ?? null);
      } catch (e) {
        if (!alive) return;
        setError(humanizeApiError(e));
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10">
        <EmptyState
          icon={<Icon name="warning" size={18} />}
          title="Program yüklenemedi"
          description={error}
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button variant="secondary" onClick={() => router.push("/apply")}>
                Listeye dön
              </Button>
              <Button variant="secondary" onClick={() => router.refresh()}>
                Tekrar dene
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  if (loading || !p) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10">
        <div className="rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--surface-0)] p-7 shadow-[var(--shadow-xs)]">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-9 w-32" />
          </div>
          <Skeleton className="mt-5 aspect-[16/8] w-full rounded-[var(--radius-2xl)]" />
          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            <Skeleton className="h-24 w-full rounded-[var(--radius-xl)]" />
            <Skeleton className="h-24 w-full rounded-[var(--radius-xl)]" />
            <Skeleton className="h-24 w-full rounded-[var(--radius-xl)]" />
          </div>
        </div>
      </div>
    );
  }

  const hero = firstImage(p);
  const price = formatMoney(p.price, p.currency);
  const original = formatMoney(p.originalPrice, p.currency);

  const appWindow = [formatDate(p.applicationStartAt), formatDate(p.applicationEndAt)].filter(Boolean).join(" – ");
  const projWindow = [formatDate(p.projectStartAt), formatDate(p.projectEndAt)].filter(Boolean).join(" – ");

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10">
      <div className="rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--surface-0)] p-7 shadow-[var(--shadow-xs)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Program</div>
            <h1 className="mt-1 truncate text-xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-2xl">
              {p.title ?? "Program"}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--text-tertiary)]">
              <Badge variant="outline" size="sm">
                {p.individual ? "Bireysel" : "Kurumsal"}
              </Badge>
              {p.projectType ? (
                <Badge variant="outline" size="sm">
                  {String(p.projectType)}
                </Badge>
              ) : null}
              {p.location ? (
                <span className="inline-flex items-center gap-1">
                  <Icon name="map-pin" size={14} />
                  {p.location}
                </span>
              ) : null}
              {p.duration ? (
                <span className="inline-flex items-center gap-1">
                  <Icon name="clock" size={14} />
                  {p.duration}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => router.push("/apply")} leftIcon={<Icon name="arrow-left" size={16} />}>
              Liste
            </Button>
            {hasApplied ? (
              <button
                type="button"
                onClick={() => router.push(applicationsUrlForProject(id))}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent-600)] px-4 text-sm font-medium text-white shadow-[var(--shadow-xs)] transition-[background,color,box-shadow,transform] duration-150 hover:bg-[var(--accent-700)] active:bg-[var(--accent-800)] focus-visible:shadow-[var(--ring-accent)]"
              >
                Başvuruyu Görüntüle
                <span aria-hidden className="text-white/90">
                  →
                </span>
              </button>
            ) : (
              <button
                type="button"
                disabled={appliedLoading || starting}
                onClick={onStartApplication}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent-600)] px-4 text-sm font-medium text-white shadow-[var(--shadow-xs)] transition-[background,color,box-shadow,transform] duration-150 hover:bg-[var(--accent-700)] active:bg-[var(--accent-800)] focus-visible:shadow-[var(--ring-accent)] disabled:cursor-wait disabled:opacity-70"
              >
                {starting ? "Başlatılıyor..." : "Başvuruyu Başlat"}
                <span aria-hidden className="text-white/90">
                  →
                </span>
              </button>
            )}
          </div>
        </div>

        {startError ? (
          <div className="mt-4 rounded-[var(--radius-lg)] border border-[var(--danger-100)] bg-[var(--danger-50)] px-3.5 py-3 text-sm text-[var(--danger-700)]">
            {startError}
          </div>
        ) : null}

        <Modal
          open={startOpen}
          onClose={() => {
            setStartOpen(false);
            setStartStep("choice");
            setSoonMessage(null);
          }}
          title={startStep === "choice" ? "Başvuruya Başla" : "Giriş Yap"}
          description={
            startStep === "choice"
              ? "Devam etmek için hesabınız olup olmadığını seçin."
              : "Devam edebilmek için hesabınızla giriş yapın."
          }
          size="sm"
        >
          {startStep === "choice" ? (
            <div className="space-y-3">
              <Button
                fullWidth
                size="lg"
                onClick={() => {
                  setSoonMessage(null);
                  setStartStep("login");
                }}
                leftIcon={<Icon name="users" size={16} />}
              >
                Hesabım var
              </Button>
              <Button
                fullWidth
                size="lg"
                variant="secondary"
                onClick={() => {
                  setStartOpen(false);
                  setStartStep("choice");
                  setSoonMessage(null);
                  router.push(`/apply/${id}/start`);
                }}
                leftIcon={<Icon name="plus" size={16} />}
              >
                Hesabın yok
              </Button>
              {soonMessage ? (
                <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] px-3.5 py-3 text-sm text-[var(--text-secondary)]">
                  {soonMessage}
                </div>
              ) : (
                <div className="pt-1 text-xs text-[var(--text-tertiary)]">
                  “Hesabın yok” seçeneğinin devam adımlarını daha sonra ekleyeceğiz.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <LoginForm
                nextPath={`/apply/${id}`}
                onSuccess={() => {
                  setStartOpen(false);
                  setStartStep("choice");
                  void startLoggedInApplication();
                }}
                title={null}
                description={null}
              />
              <Button
                variant="ghost"
                fullWidth
                onClick={() => setStartStep("choice")}
                leftIcon={<Icon name="arrow-left" size={16} />}
              >
                Geri
              </Button>
            </div>
          )}
        </Modal>

        <div className="mt-6 overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--border-subtle)] bg-[var(--surface-2)]">
          {hero ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero} alt={p.title ?? "Program"} className="h-[260px] w-full object-cover sm:h-[320px]" />
          ) : (
            <div className="h-[260px] w-full bg-gradient-to-br from-[var(--accent-50)] via-white to-[var(--surface-2)] sm:h-[320px]" />
          )}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--surface-0)] p-6">
              <h2 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">Genel Bilgi</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                {stripHtml(p.description) || "Açıklama yakında."}
              </p>

              {p.highlights?.length ? (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Öne Çıkanlar</h3>
                  {kvList(p.highlights)}
                </div>
              ) : null}

              {p.itinerary?.length ? (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Program Akışı</h3>
                  <div className="mt-3 grid gap-3">
                    {p.itinerary.map((it, i) => (
                      <div
                        key={i}
                        className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-1)] p-4"
                      >
                        <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                          Gün {i + 1}
                        </div>
                        <div className="mt-1 text-sm text-[var(--text-secondary)]">
                          {Object.values(it as Record<string, unknown>)
                            .filter((v) => typeof v === "string" && v)
                            .slice(0, 2)
                            .join(" • ") || "Detay yakında."}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="sticky top-6 space-y-4">
              <div className="rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--surface-0)] p-6 shadow-[var(--shadow-xs)]">
                <div className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">Fiyat</div>
                <div className="mt-2 flex items-baseline justify-between gap-3">
                  <div className="text-xl font-semibold text-[var(--text-primary)]">{price ?? "Bilgi al"}</div>
                  {original && original !== price ? (
                    <div className="text-sm text-[var(--text-tertiary)] line-through">{original}</div>
                  ) : null}
                </div>
                <div className="mt-4 grid gap-2 text-sm text-[var(--text-secondary)]">
                  {appWindow ? (
                    <div className="flex items-start gap-2">
                      <Icon name="calendar" size={16} />
                      <div>
                        <div className="font-medium text-[var(--text-primary)]">Başvuru Aralığı</div>
                        <div className="text-[var(--text-tertiary)]">{appWindow}</div>
                      </div>
                    </div>
                  ) : null}
                  {projWindow ? (
                    <div className="flex items-start gap-2">
                      <Icon name="route" size={16} />
                      <div>
                        <div className="font-medium text-[var(--text-primary)]">Proje Tarihleri</div>
                        <div className="text-[var(--text-tertiary)]">{projWindow}</div>
                      </div>
                    </div>
                  ) : null}
                  {p.quota !== undefined && p.quota !== null ? (
                    <div className="flex items-start gap-2">
                      <Icon name="users" size={16} />
                      <div>
                        <div className="font-medium text-[var(--text-primary)]">Kontenjan</div>
                        <div className="text-[var(--text-tertiary)]">{p.quota}</div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {p.included?.length || p.excluded?.length ? (
                <div className="rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--surface-0)] p-6 shadow-[var(--shadow-xs)]">
                  <div className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
                    Dahil / Hariç
                  </div>
                  {p.included?.length ? (
                    <div className="mt-4">
                      <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                        Dahil
                      </div>
                      {kvList(p.included)}
                    </div>
                  ) : null}
                  {p.excluded?.length ? (
                    <div className="mt-4">
                      <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                        Hariç
                      </div>
                      {kvList(p.excluded)}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

