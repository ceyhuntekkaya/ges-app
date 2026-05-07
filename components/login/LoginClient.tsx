"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type LoginState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string };

export function LoginClient() {
  const router = useRouter();
  const params = useSearchParams();
  const nextPath = useMemo(() => params.get("next"), [params]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<LoginState>({ status: "idle" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { message?: string } | null;
        setState({
          status: "error",
          message: data?.message || "Giriş yapılamadı. Bilgileri kontrol edin.",
        });
        return;
      }

      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; role?: "ADMIN" | "USER" }
        | null;

      const fallback =
        data?.role === "ADMIN" ? "/admin" : data?.role === "USER" ? "/applications" : "/login";

      router.replace(nextPath || fallback);
      router.refresh();
    } catch {
      setState({ status: "error", message: "Bağlantı hatası. Tekrar deneyin." });
    }
  }

  return (
    <div className="relative min-h-[100svh] overflow-hidden bg-zinc-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-emerald-500/25 via-sky-500/20 to-fuchsia-500/20 blur-3xl" />
        <div className="absolute bottom-[-180px] right-[-160px] h-[520px] w-[520px] rounded-full bg-gradient-to-tr from-zinc-200/10 via-white/5 to-zinc-200/10 blur-3xl" />
      </div>

      <div className="relative flex min-h-[100svh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-7 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.7)] backdrop-blur">
          <div className="mb-6">
            <div className="text-sm font-medium text-white/70">GES</div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
              Yönetim Paneli Girişi
            </h1>
            <p className="mt-2 text-sm leading-6 text-white/65">Hesabınızla giriş yapın.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/75">E-posta</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                required
                placeholder="admin@genixo.ai"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm text-white shadow-sm outline-none placeholder:text-white/35 focus:border-white/20 focus:outline-none focus:ring-4 focus:ring-white/10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/75">Şifre</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm text-white shadow-sm outline-none placeholder:text-white/35 focus:border-white/20 focus:outline-none focus:ring-4 focus:ring-white/10"
              />
            </div>

            {state.status === "error" ? (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-3 text-sm text-rose-200">
                {state.message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={state.status === "loading"}
              className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-medium text-zinc-950 shadow-sm transition-transform hover:-translate-y-[1px] hover:bg-white/90 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {state.status === "loading" ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-white/45">
          Bu alan sadece yetkili kullanıcılar içindir.
        </p>
      </div>
    </div>
    </div>
  );
}

