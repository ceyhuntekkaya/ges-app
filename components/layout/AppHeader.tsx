import Link from "next/link";
import { getSession } from "@/lib/session";
import { getCurrentUser } from "@/lib/api/authServer";
import { getLang, t } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { LogoutButton } from "@/components/auth/LogoutButton";

const btnSecondary =
  "inline-flex h-9 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-0)] px-3.5 text-sm font-medium text-[var(--text-primary)] shadow-[var(--shadow-xs)] transition-[background,color,box-shadow,transform] duration-150 hover:bg-[var(--surface-2)] hover:border-[var(--border-strong)] focus-visible:shadow-[var(--ring-neutral)] disabled:cursor-not-allowed disabled:opacity-60";

const btnPrimary =
  "inline-flex h-9 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent-600)] px-3.5 text-sm font-medium text-white shadow-[var(--shadow-xs)] transition-[background,color,box-shadow,transform] duration-150 hover:bg-[var(--accent-700)] active:bg-[var(--accent-800)] focus-visible:shadow-[var(--ring-accent)]";

type AppHeaderProps = {
  /** marketing: ana sayfa / başvuru; portal: giriş sonrası panel */
  variant?: "marketing" | "portal";
};

export async function AppHeader({ variant = "marketing" }: AppHeaderProps) {
  const lang = await getLang();
  const session = await getSession();

  let displayName: string | null = null;
  let dashboardHref: string | null = null;

  if (session) {
    const me = await getCurrentUser();
    displayName = me.data?.displayName?.trim() || me.data?.email?.trim() || null;
    dashboardHref = session.role === "ADMIN" ? "/admin" : "/applications";
  }

  const isAuthenticated = Boolean(session);

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[var(--surface-0)]/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--accent-50)] text-[var(--accent-700)]">
            <span className="text-sm font-semibold">GES</span>
          </span>
          <span className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
            {t("languageCampBrand", lang)}
          </span>
        </Link>

        <nav className="flex min-w-0 items-center gap-2">
          {variant === "portal" && isAuthenticated ? (
            <>
              {displayName ? (
                <span
                  className="hidden max-w-[10rem] truncate text-sm text-[var(--text-secondary)] sm:inline md:max-w-[14rem]"
                  title={displayName}
                >
                  {displayName}
                </span>
              ) : null}
              <LanguageSwitcher lang={lang} tone="app" />
              <LogoutButton className={btnSecondary}>{t("logout", lang)}</LogoutButton>
            </>
          ) : variant === "marketing" && isAuthenticated ? (
            <>
              {displayName ? (
                <span
                  className="hidden max-w-[10rem] truncate text-sm text-[var(--text-secondary)] sm:inline md:max-w-[14rem]"
                  title={displayName}
                >
                  {displayName}
                </span>
              ) : null}
              <Link href={dashboardHref!} className={btnSecondary}>
                {t("dashboard", lang)}
              </Link>
              <Link href="/apply" className={btnPrimary}>
                {t("apply", lang)}
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className={btnSecondary}>
                {t("signIn", lang)}
              </Link>
              <Link href="/apply" className={btnPrimary}>
                {t("apply", lang)}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
