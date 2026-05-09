"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Icon, IconButton } from "@/components/ui";
import type { IconName } from "@/components/ui";

type NavItem = { href: string; label: string; icon: IconName };

const navItems: NavItem[] = [
  { href: "/admin", label: "Genel", icon: "info" },
  { href: "/admin/catalog", label: "Katalog", icon: "school" },
  { href: "/admin/university-applications", label: "Üniversite Başvuruları", icon: "book" },
  { href: "/admin/language-camp-applications", label: "Dil Kampı Başvuruları", icon: "globe" },
  { href: "/admin/language-camp-projects", label: "Dil Kampı Projeleri", icon: "globe" },
  { href: "/admin/companies", label: "Şirketler", icon: "copy" },
  { href: "/admin/document-requirements", label: "Evrak Gereksinimleri", icon: "filter" },
  { href: "/admin/files", label: "Dosyalar", icon: "save" },
  { href: "/admin/reports", label: "Raporlar", icon: "arrow-up-down" },
  { href: "/admin/legal-documents", label: "Hukuki Belgeler", icon: "info" },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({
  children,
  brand,
}: {
  children: React.ReactNode;
  brand: React.ReactNode;
}) {
  const pathname = usePathname() || "/admin";
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const breadcrumb = useMemo(() => {
    const active = navItems.find((x) => isActive(pathname, x.href));
    if (!active || active.href === "/admin") return "Genel";
    return active.label;
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-[100svh] bg-[var(--surface-1)]">
      <div className="sticky top-0 z-30 border-b border-[var(--border-default)] bg-[var(--surface-0)]/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-3 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <IconButton
              aria-label="Menü"
              variant="secondary"
              size="md"
              icon={<Icon name="filter" size={16} />}
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden"
            />
            <div className="flex items-center gap-2 text-xs">
              <span className="hidden font-medium text-[var(--text-tertiary)] sm:inline">
                Yönetim
              </span>
              <span className="hidden text-[var(--text-muted)] sm:inline">/</span>
              <span className="font-medium text-[var(--text-primary)]">{breadcrumb}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-0)] px-3 text-xs font-medium text-[var(--text-secondary)] shadow-[var(--shadow-xs)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
          >
            <Icon name="external" size={14} />
            Çıkış
          </button>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-5 px-4 py-5 lg:grid-cols-[260px_1fr] lg:px-6">
        <aside
          className={[
            "rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-0)] p-3 shadow-[var(--shadow-xs)] lg:sticky lg:top-[5.25rem] lg:h-[calc(100svh-7rem)]",
            mobileOpen ? "block" : "hidden lg:block",
          ].join(" ")}
        >
          <div className="px-2 pb-2 pt-1 text-sm text-[var(--text-primary)]">{brand}</div>
          <nav className="mt-2 space-y-0.5">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={[
                    "group flex items-center gap-2.5 rounded-[var(--radius-md)] px-2.5 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-[var(--text-primary)] text-white"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-5 w-5 shrink-0 items-center justify-center transition-colors",
                      active ? "text-white" : "text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]",
                    ].join(" ")}
                  >
                    <Icon name={item.icon} size={15} />
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
