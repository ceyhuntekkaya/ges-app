"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export function LanguageSwitcher({
  lang,
  tone = "zinc",
}: {
  lang: "tr" | "en";
  tone?: "zinc" | "app";
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  async function setLang(next: "tr" | "en") {
    await fetch("/api/i18n/lang", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lang: next }),
    });
    startTransition(() => router.refresh());
  }

  const shell =
    tone === "app"
      ? "inline-flex items-center rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-0)] p-0.5 shadow-[var(--shadow-xs)]"
      : "inline-flex items-center rounded-lg border border-zinc-200 bg-white p-0.5 shadow-sm";

  const active =
    tone === "app"
      ? "bg-[var(--text-primary)] text-[var(--text-inverse)]"
      : "bg-zinc-900 text-white";

  const idle =
    tone === "app"
      ? "text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
      : "text-zinc-700 hover:bg-zinc-50";

  return (
    <div className={shell}>
      <button
        type="button"
        disabled={pending}
        onClick={() => setLang("tr")}
        className={["rounded-md px-2.5 py-1 text-xs font-semibold", lang === "tr" ? active : idle].join(
          " ",
        )}
      >
        TR
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => setLang("en")}
        className={["rounded-md px-2.5 py-1 text-xs font-semibold", lang === "en" ? active : idle].join(
          " ",
        )}
      >
        EN
      </button>
    </div>
  );
}
