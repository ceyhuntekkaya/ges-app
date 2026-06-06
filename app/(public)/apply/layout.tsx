import { AppHeader } from "@/components/layout/AppHeader";

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100svh] bg-[var(--background)]">
      <AppHeader variant="marketing" />
      {children}
    </div>
  );
}
