"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export function LanguageSwitcher({ lang }: { lang: "tr" | "en" }) {
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

  return (
    <div className="inline-flex items-center rounded-lg border border-zinc-200 bg-white p-0.5 shadow-sm">
      <button
        type="button"
        disabled={pending}
        onClick={() => setLang("tr")}
        className={[
          "rounded-md px-2.5 py-1 text-xs font-semibold",
          lang === "tr" ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-50",
        ].join(" ")}
      >
        TR
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => setLang("en")}
        className={[
          "rounded-md px-2.5 py-1 text-xs font-semibold",
          lang === "en" ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-50",
        ].join(" ")}
      >
        EN
      </button>
    </div>
  );
}

