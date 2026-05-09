import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-[100svh] bg-[var(--background)]">
      <header className="sticky top-0 z-10 border-b border-[var(--border-subtle)] bg-[var(--surface-0)]/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--accent-50)] text-[var(--accent-700)]">
              <span className="text-sm font-semibold">GES</span>
            </span>
            <span className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">Dil Kampı</span>
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-0)] px-3.5 text-sm font-medium text-[var(--text-primary)] shadow-[var(--shadow-xs)] transition-[background,color,box-shadow,transform] duration-150 hover:bg-[var(--surface-2)] hover:border-[var(--border-strong)] focus-visible:shadow-[var(--ring-neutral)]"
            >
              Giriş
            </Link>
            <Link
              href="/apply"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent-600)] px-3.5 text-sm font-medium text-white shadow-[var(--shadow-xs)] transition-[background,color,box-shadow,transform] duration-150 hover:bg-[var(--accent-700)] active:bg-[var(--accent-800)] focus-visible:shadow-[var(--ring-accent)]"
            >
              Başvur
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10">
        <section className="grid items-start gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--surface-0)] px-3 py-1 text-xs text-[var(--text-secondary)] shadow-[var(--shadow-xs)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-600)]" />
              2026 Dönemi Başvuruları Açık
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">
              Yurt dışı dil kampına başvurunu kolayca tamamla.
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--text-tertiary)]">
              GES ile program seçimi, evrak hazırlığı ve başvuru sürecini tek ekrandan yönet.
              Başvurunu oluştur, gerekli belgeleri yükle, durumunu adım adım takip et.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/apply"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-[var(--accent-600)] px-5 text-sm font-medium text-white shadow-[var(--shadow-xs)] transition-[background,color,box-shadow,transform] duration-150 hover:bg-[var(--accent-700)] active:bg-[var(--accent-800)] focus-visible:shadow-[var(--ring-accent)]"
              >
                Başvuruyu Başlat
                <span aria-hidden className="text-white/90">
                  →
                </span>
              </Link>
              <a
                href="#detaylar"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] px-5 text-sm font-medium text-[var(--text-primary)] shadow-[var(--shadow-xs)] transition-[background,color,box-shadow,transform] duration-150 hover:bg-[var(--surface-2)] hover:border-[var(--border-strong)] focus-visible:shadow-[var(--ring-neutral)]"
              >
                Programı İncele
              </a>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-0)] p-4 shadow-[var(--shadow-xs)]">
                <div className="text-sm font-semibold text-[var(--text-primary)]">Hızlı Başvuru</div>
                <div className="mt-1 text-xs leading-5 text-[var(--text-tertiary)]">
                  Dakikalar içinde formu tamamla, süreci başlat.
                </div>
              </div>
              <div className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-0)] p-4 shadow-[var(--shadow-xs)]">
                <div className="text-sm font-semibold text-[var(--text-primary)]">Evrak Yönetimi</div>
                <div className="mt-1 text-xs leading-5 text-[var(--text-tertiary)]">
                  Gerekli belgeleri tek yerden yükle ve takip et.
                </div>
              </div>
              <div className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-0)] p-4 shadow-[var(--shadow-xs)]">
                <div className="text-sm font-semibold text-[var(--text-primary)]">Durum Takibi</div>
                <div className="mt-1 text-xs leading-5 text-[var(--text-tertiary)]">
                  Başvurunun hangi aşamada olduğunu anlık gör.
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--surface-0)] p-4 shadow-[var(--shadow-md)]">
              <div className="grid gap-4">
                <div className="aspect-[16/10] w-full overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-gradient-to-br from-[var(--accent-50)] via-white to-[var(--surface-2)]">
                  <div className="flex h-full items-center justify-center text-sm text-[var(--text-tertiary)]">
                    Görsel Alanı (Hero)
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="aspect-[4/3] overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-2)]">
                    <div className="flex h-full items-center justify-center text-xs text-[var(--text-tertiary)]">
                      Görsel (1)
                    </div>
                  </div>
                  <div className="aspect-[4/3] overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-2)]">
                    <div className="flex h-full items-center justify-center text-xs text-[var(--text-tertiary)]">
                      Görsel (2)
                    </div>
                  </div>
                </div>
                <div className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-1)] p-4">
                  <div className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
                    Dil Kampı Başvurusu
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[var(--text-tertiary)]">
                    Başvuru oluşturduktan sonra evraklarını yükleyebilir ve değerlendirme sürecini
                    panelden takip edebilirsin.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Link
                      href="/apply"
                      className="inline-flex h-9 flex-1 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-600)] px-3.5 text-sm font-medium text-white shadow-[var(--shadow-xs)] transition-[background,color,box-shadow,transform] duration-150 hover:bg-[var(--accent-700)] active:bg-[var(--accent-800)] focus-visible:shadow-[var(--ring-accent)]"
                    >
                      Başvur
                    </Link>
                    <Link
                      href="/login"
                      className="inline-flex h-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-0)] px-3.5 text-sm font-medium text-[var(--text-primary)] shadow-[var(--shadow-xs)] transition-[background,color,box-shadow,transform] duration-150 hover:bg-[var(--surface-2)] hover:border-[var(--border-strong)] focus-visible:shadow-[var(--ring-neutral)]"
                    >
                      Giriş
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
                  Program Hakkında
                </div>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-2xl">
                  Neler sunuyoruz?
                </h2>
              </div>
              <Link
                href="/apply"
                className="inline-flex h-9 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent-600)] px-3.5 text-sm font-medium text-white shadow-[var(--shadow-xs)] transition-[background,color,box-shadow,transform] duration-150 hover:bg-[var(--accent-700)] active:bg-[var(--accent-800)] focus-visible:shadow-[var(--ring-accent)]"
              >
                Başvuru Formu
                <span aria-hidden className="text-white/90">
                  →
                </span>
              </Link>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-1)] p-5">
                <div className="text-sm font-semibold text-[var(--text-primary)]">Program Seçimi</div>
                <p className="mt-2 text-sm leading-6 text-[var(--text-tertiary)]">
                  Hedef ülke ve kamp seçeneklerini incele, sana en uygun programı belirle.
                </p>
              </div>
              <div className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-1)] p-5">
                <div className="text-sm font-semibold text-[var(--text-primary)]">Evrak Kontrolü</div>
                <p className="mt-2 text-sm leading-6 text-[var(--text-tertiary)]">
                  Belgeleri doğru formatta topla, eksik/yanlışları hızlıca tamamla.
                </p>
              </div>
              <div className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-1)] p-5">
                <div className="text-sm font-semibold text-[var(--text-primary)]">Şeffaf Süreç</div>
                <p className="mt-2 text-sm leading-6 text-[var(--text-tertiary)]">
                  Başvurunun durumunu ve sonraki adımı panelde net şekilde gör.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <h3 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">
                  Süreç nasıl ilerliyor?
                </h3>
                <ol className="mt-3 grid gap-3">
                  <li className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-0)] p-4">
                    <div className="text-sm font-semibold text-[var(--text-primary)]">1) Başvuru Oluştur</div>
                    <div className="mt-1 text-sm leading-6 text-[var(--text-tertiary)]">
                      Kısa formu doldur ve başvurunu başlat.
                    </div>
                  </li>
                  <li className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-0)] p-4">
                    <div className="text-sm font-semibold text-[var(--text-primary)]">
                      2) Belgeleri Yükle
                    </div>
                    <div className="mt-1 text-sm leading-6 text-[var(--text-tertiary)]">
                      Gerekli evrakları yükle, eksikleri tamamla.
                    </div>
                  </li>
                  <li className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-0)] p-4">
                    <div className="text-sm font-semibold text-[var(--text-primary)]">
                      3) Değerlendirme & Bilgilendirme
                    </div>
                    <div className="mt-1 text-sm leading-6 text-[var(--text-tertiary)]">
                      Başvurun incelenir; durum güncellemelerini panelden takip edersin.
                    </div>
                  </li>
                </ol>
              </div>

              <div className="lg:col-span-5">
                <div className="aspect-[16/11] overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--surface-2)]">
                  <div className="flex h-full items-center justify-center text-sm text-[var(--text-tertiary)]">
                    Görsel Alanı (Süreç / Kamp)
                  </div>
                </div>
                <p className="mt-3 text-xs leading-5 text-[var(--text-tertiary)]">
                  Not: Görselleri daha sonra buraya ekleyebiliriz (kamp fotoğrafları, etkinlikler,
                  sınıf ortamı, şehir/ülke).
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--surface-0)] p-7 shadow-[var(--shadow-xs)]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                  Görsel Galeri
                </div>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-2xl">
                  Atmosferi hisset
                </h2>
              </div>
              <Link
                href="/apply"
                className="inline-flex h-9 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-0)] px-3.5 text-sm font-medium text-[var(--text-primary)] shadow-[var(--shadow-xs)] transition-[background,color,box-shadow,transform] duration-150 hover:bg-[var(--surface-2)] hover:border-[var(--border-strong)] focus-visible:shadow-[var(--ring-neutral)]"
              >
                Hemen Başvur
              </Link>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[4/3] overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--surface-2)]"
                >
                  <div className="flex h-full items-center justify-center text-xs text-[var(--text-tertiary)]">
                    Görsel ({i + 1})
                  </div>
                </div>
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
