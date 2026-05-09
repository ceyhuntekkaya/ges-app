"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

type LoginState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string };

export interface LoginFormProps {
  /** If provided, redirect to this path after successful login. */
  nextPath?: string;
  /** Called after successful login (before navigation). */
  onSuccess?: () => void;
  /** Optional heading shown above the form. */
  title?: React.ReactNode;
  /** Optional subtext shown under the title. */
  description?: React.ReactNode;
  className?: string;
}

export function LoginForm({
  nextPath,
  onSuccess,
  title = "Giriş Yap",
  description = "Hesabınızla giriş yapın.",
  className,
}: LoginFormProps) {
  const router = useRouter();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [state, setState] = React.useState<LoginState>({ status: "idle" });

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

      onSuccess?.();
      router.replace(nextPath || fallback);
      router.refresh();
    } catch {
      setState({ status: "error", message: "Bağlantı hatası. Tekrar deneyin." });
    }
  }

  return (
    <div className={className}>
      <div className="mb-5">
        <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-[var(--text-tertiary)]">{description}</p>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--text-secondary)]">E-posta</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            required
            placeholder="ornek@site.com"
            className="w-full rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] px-3.5 py-3 text-sm text-[var(--text-primary)] shadow-[var(--shadow-xs)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--border-strong)] focus:outline-none focus:ring-4 focus:ring-[var(--ring-neutral)]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--text-secondary)]">Şifre</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="w-full rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] px-3.5 py-3 text-sm text-[var(--text-primary)] shadow-[var(--shadow-xs)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--border-strong)] focus:outline-none focus:ring-4 focus:ring-[var(--ring-neutral)]"
          />
        </div>

        {state.status === "error" ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--danger-100)] bg-[var(--danger-50)] px-3.5 py-3 text-sm text-[var(--danger-700)]">
            {state.message}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={state.status === "loading"}
          className="inline-flex h-10 w-full items-center justify-center rounded-[var(--radius-lg)] bg-[var(--accent-600)] px-4 text-sm font-medium text-white shadow-[var(--shadow-xs)] transition-[background,color,box-shadow,transform] duration-150 hover:bg-[var(--accent-700)] active:bg-[var(--accent-800)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state.status === "loading" ? "Giriş yapılıyor..." : "Giriş Yap"}
        </button>
      </form>
    </div>
  );
}

