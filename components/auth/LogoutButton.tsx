"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onLogout() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore network errors; still force UI to login
    } finally {
      router.replace("/");
      router.refresh();
    }
  }

  return (
    <button type="button" className={className} onClick={onLogout} disabled={busy}>
      {children}
    </button>
  );
}

