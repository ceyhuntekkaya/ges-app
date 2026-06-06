import { AppHeader } from "@/components/layout/AppHeader";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100svh] bg-[var(--background)]">
      <AppHeader variant="marketing" />
      {children}
    </div>
  );
}
