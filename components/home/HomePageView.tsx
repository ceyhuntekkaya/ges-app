import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import {
  HOME_PAGE_FALLBACK,
  type PortalHomePageContent,
  toProxyMediaUrl,
} from "@/lib/portal/homePage";

function MediaSlot({
  url,
  className,
  placeholder,
}: {
  url?: string | null;
  className: string;
  placeholder: string;
}) {
  const src = toProxyMediaUrl(url);
  if (src) {
    return (
      <div className={className}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div className={className}>
      <div className="flex h-full items-center justify-center text-xs text-[var(--text-tertiary)] sm:text-sm">
        {placeholder}
      </div>
    </div>
  );
}

function resolveContent(content: PortalHomePageContent | null): PortalHomePageContent {
  if (!content) return HOME_PAGE_FALLBACK;
  return { ...HOME_PAGE_FALLBACK, ...content };
}

export function HomePageView({ content }: { content: PortalHomePageContent | null }) {
  const c = resolveContent(content);
  const galleryUrls = [
    c.galleryImage1Url,
    c.galleryImage2Url,
    c.galleryImage3Url,
    c.galleryImage4Url,
    c.galleryImage5Url,
    c.galleryImage6Url,
  ];

  return (
    <div className="min-h-[100svh] bg-[var(--background)]">
      <AppHeader variant="marketing" />

      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10">
        <section className="grid items-start gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--surface-0)] px-3 py-1 text-xs text-[var(--text-secondary)] shadow-[var(--shadow-xs)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-600)]" />
              {c.badgeText}
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">
              {c.heroTitle}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--text-tertiary)]">{c.heroDescription}</p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/apply"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-[var(--accent-600)] px-5 text-sm font-medium text-white shadow-[var(--shadow-xs)] transition-[background,color,box-shadow,transform] duration-150 hover:bg-[var(--accent-700)] active:bg-[var(--accent-800)] focus-visible:shadow-[var(--ring-accent)]"
              >
                {c.heroPrimaryCtaText}
                <span aria-hidden className="text-white/90">
                  →
                </span>
              </Link>
              <a
                href="#detaylar"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] px-5 text-sm font-medium text-[var(--text-primary)] shadow-[var(--shadow-xs)] transition-[background,color,box-shadow,transform] duration-150 hover:bg-[var(--surface-2)] hover:border-[var(--border-strong)] focus-visible:shadow-[var(--ring-neutral)]"
              >
                {c.heroSecondaryCtaText}
              </a>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { title: c.feature1Title, desc: c.feature1Description },
                { title: c.feature2Title, desc: c.feature2Description },
                { title: c.feature3Title, desc: c.feature3Description },
              ].map((f) => (
                <div
                  key={f.title}
                  className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-0)] p-4 shadow-[var(--shadow-xs)]"
                >
                  <div className="text-sm font-semibold text-[var(--text-primary)]">{f.title}</div>
                  <div className="mt-1 text-xs leading-5 text-[var(--text-tertiary)]">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--surface-0)] p-4 shadow-[var(--shadow-md)]">
              <div className="grid gap-4">
                <MediaSlot
                  url={c.heroImageUrl}
                  className="aspect-[16/10] w-full overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-gradient-to-br from-[var(--accent-50)] via-white to-[var(--surface-2)]"
                  placeholder="Görsel Alanı (Hero)"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <MediaSlot
                    url={c.sidebarImage1Url}
                    className="aspect-[4/3] overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-2)]"
                    placeholder="Görsel (1)"
                  />
                  <MediaSlot
                    url={c.sidebarImage2Url}
                    className="aspect-[4/3] overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-2)]"
                    placeholder="Görsel (2)"
                  />
                </div>
                <div className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-1)] p-4">
                  <div className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
                    {c.sidebarCardTitle}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[var(--text-tertiary)]">{c.sidebarCardDescription}</p>
                  <div className="mt-4 flex gap-2">
                    <Link
                      href="/apply"
                      className="inline-flex h-9 flex-1 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-600)] px-3.5 text-sm font-medium text-white shadow-[var(--shadow-xs)] transition-[background,color,box-shadow,transform] duration-150 hover:bg-[var(--accent-700)] active:bg-[var(--accent-800)] focus-visible:shadow-[var(--ring-accent)]"
                    >
                      {c.sidebarCardPrimaryCtaText}
                    </Link>
                    <Link
                      href="/login"
                      className="inline-flex h-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-0)] px-3.5 text-sm font-medium text-[var(--text-primary)] shadow-[var(--shadow-xs)] transition-[background,color,box-shadow,transform] duration-150 hover:bg-[var(--surface-2)] hover:border-[var(--border-strong)] focus-visible:shadow-[var(--ring-neutral)]"
                    >
                      {c.sidebarCardSecondaryCtaText}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="detaylar" className="mt-14">
          <div className="rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--surface-0)] p-7 shadow-[var(--shadow-xs)]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                  {c.aboutSectionLabel}
                </div>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-2xl">
                  {c.aboutSectionTitle}
                </h2>
              </div>
              <Link
                href="/apply"
                className="inline-flex h-9 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent-600)] px-3.5 text-sm font-medium text-white shadow-[var(--shadow-xs)] transition-[background,color,box-shadow,transform] duration-150 hover:bg-[var(--accent-700)] active:bg-[var(--accent-800)] focus-visible:shadow-[var(--ring-accent)]"
              >
                {c.aboutSectionCtaText}
                <span aria-hidden className="text-white/90">
                  →
                </span>
              </Link>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                { title: c.aboutFeature1Title, desc: c.aboutFeature1Description },
                { title: c.aboutFeature2Title, desc: c.aboutFeature2Description },
                { title: c.aboutFeature3Title, desc: c.aboutFeature3Description },
              ].map((f) => (
                <div
                  key={f.title}
                  className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-1)] p-5"
                >
                  <div className="text-sm font-semibold text-[var(--text-primary)]">{f.title}</div>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-tertiary)]">{f.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <h3 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">
                  {c.processSectionTitle}
                </h3>
                <ol className="mt-3 grid gap-3">
                  {[
                    { title: c.processStep1Title, desc: c.processStep1Description },
                    { title: c.processStep2Title, desc: c.processStep2Description },
                    { title: c.processStep3Title, desc: c.processStep3Description },
                  ].map((step) => (
                    <li
                      key={step.title}
                      className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-0)] p-4"
                    >
                      <div className="text-sm font-semibold text-[var(--text-primary)]">{step.title}</div>
                      <div className="mt-1 text-sm leading-6 text-[var(--text-tertiary)]">{step.desc}</div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="lg:col-span-5">
                <MediaSlot
                  url={c.processImageUrl}
                  className="aspect-[16/11] overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--surface-2)]"
                  placeholder="Görsel Alanı (Süreç / Kamp)"
                />
                {c.processImageCaption ? (
                  <p className="mt-3 text-xs leading-5 text-[var(--text-tertiary)]">{c.processImageCaption}</p>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--surface-0)] p-7 shadow-[var(--shadow-xs)]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                  {c.gallerySectionLabel}
                </div>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-2xl">
                  {c.gallerySectionTitle}
                </h2>
              </div>
              <Link
                href="/apply"
                className="inline-flex h-9 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-0)] px-3.5 text-sm font-medium text-[var(--text-primary)] shadow-[var(--shadow-xs)] transition-[background,color,box-shadow,transform] duration-150 hover:bg-[var(--surface-2)] hover:border-[var(--border-strong)] focus-visible:shadow-[var(--ring-neutral)]"
              >
                {c.gallerySectionCtaText}
              </Link>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {galleryUrls.map((url, i) => (
                <MediaSlot
                  key={i}
                  url={url}
                  className="aspect-[4/3] overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--surface-2)]"
                  placeholder={`Görsel (${i + 1})`}
                />
              ))}
            </div>
          </div>
        </section>

        <footer className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-8 text-xs text-[var(--text-tertiary)] sm:flex-row">
          <div>© {new Date().getFullYear()} GES</div>
          <div className="flex items-center gap-4">
            <Link className="hover:text-[var(--text-secondary)]" href="/login">
              Giriş
            </Link>
            <Link className="hover:text-[var(--text-secondary)]" href="/apply">
              Başvur
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
