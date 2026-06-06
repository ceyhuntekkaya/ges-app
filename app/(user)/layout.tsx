import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AppHeader } from "@/components/layout/AppHeader";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "USER") redirect("/admin");

  return (
    <div className="min-h-[100svh] bg-[var(--background)]">
      <AppHeader variant="portal" />
      <main className="mx-auto w-full max-w-6xl px-6 py-6">{children}</main>
    </div>
  );
}
