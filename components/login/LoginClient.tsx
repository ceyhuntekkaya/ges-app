"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { LoginForm } from "./LoginForm";

export function LoginClient() {
  const params = useSearchParams();
  const nextPath = useMemo(() => params.get("next"), [params]);

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

            <LoginForm
              nextPath={nextPath ?? undefined}
              title={null}
              description={null}
              className="[&_*]:!text-white [&_label]:!text-white/75 [&_input]:!border-white/10 [&_input]:!bg-white/5 [&_input]:!placeholder:text-white/35 [&_input]:focus:!border-white/20 [&_input]:focus:!ring-white/10"
            />
          </div>

          <p className="mt-4 text-center text-xs text-white/45">
            Bu alan sadece yetkili kullanıcılar içindir.
          </p>
        </div>
      </div>
    </div>
  );
}

