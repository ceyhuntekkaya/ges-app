import { Suspense } from "react";
import { LoginClient } from "@/components/login/LoginClient";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100svh] flex items-center justify-center bg-zinc-950 px-4 py-10">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-7 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.7)]">
            <div className="h-5 w-24 rounded bg-white/10" />
            <div className="mt-3 h-8 w-64 rounded bg-white/10" />
            <div className="mt-6 space-y-3">
              <div className="h-11 w-full rounded-2xl bg-white/10" />
              <div className="h-11 w-full rounded-2xl bg-white/10" />
              <div className="h-11 w-full rounded-2xl bg-white/10" />
            </div>
          </div>
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}

