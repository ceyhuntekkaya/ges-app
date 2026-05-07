import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AdminShell } from "@/components/admin/AdminShell";
import { ToastProvider } from "@/components/ui";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  return (
    <ToastProvider>
      <AdminShell
        brand={
          <Link href="/admin" className="font-semibold tracking-tight">
            GES Admin
          </Link>
        }
      >
        {children}
      </AdminShell>
    </ToastProvider>
  );
}
