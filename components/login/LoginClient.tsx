"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui";
import { t, type Lang } from "@/lib/i18n/dict";
import { LoginForm } from "./LoginForm";

export function LoginClient({ lang }: { lang: Lang }) {
  const params = useSearchParams();
  const nextPath = useMemo(() => params.get("next"), [params]);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10">
      <div className="mx-auto w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        >
          <Icon name="arrow-left" size={16} />
          {t("backToHome", lang)}
        </Link>

        <div className="mt-6 rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--surface-0)] p-7 shadow-[var(--shadow-xs)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-1 text-xs text-[var(--text-secondary)]">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-50)] text-[var(--accent-700)]">
              <span className="text-[10px] font-semibold">GES</span>
            </span>
            {t("languageCampBrand", lang)}
          </div>

          <h1 className="mt-4 text-xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-2xl">
            {t("signInTitle", lang)}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{t("signInDescription", lang)}</p>

          <div className="mt-6">
            <LoginForm nextPath={nextPath ?? undefined} title={null} description={null} />
          </div>
        </div>
      </div>
    </main>
  );
}
