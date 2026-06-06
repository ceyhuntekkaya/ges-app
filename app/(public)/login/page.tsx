import { Suspense } from "react";
import { LoginClient } from "@/components/login/LoginClient";
import { getLang } from "@/lib/i18n";

export default async function LoginPage() {
  const lang = await getLang();

  return (
    <Suspense
      fallback={
        <div className="min-h-[100svh] bg-[var(--background)]">
          <div className="mx-auto w-full max-w-6xl px-6 pb-16 pt-24">
            <div className="mx-auto w-full max-w-md">
              <div className="h-4 w-32 animate-pulse rounded bg-[var(--surface-2)]" />
              <div className="mt-6 rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--surface-0)] p-7 shadow-[var(--shadow-xs)]">
                <div className="h-6 w-40 animate-pulse rounded-full bg-[var(--surface-2)]" />
                <div className="mt-4 h-8 w-48 animate-pulse rounded bg-[var(--surface-2)]" />
                <div className="mt-6 space-y-3">
                  <div className="h-11 w-full animate-pulse rounded-[var(--radius-lg)] bg-[var(--surface-2)]" />
                  <div className="h-11 w-full animate-pulse rounded-[var(--radius-lg)] bg-[var(--surface-2)]" />
                  <div className="h-10 w-full animate-pulse rounded-[var(--radius-lg)] bg-[var(--surface-2)]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <LoginClient lang={lang} />
    </Suspense>
  );
}
