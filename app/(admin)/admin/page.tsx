import { AdminApplicationsByStatusClient } from "@/components/admin/dashboard/AdminApplicationsByStatusClient";
import { AdminPendingTasksClient } from "@/components/admin/dashboard/AdminPendingTasksClient";

export default function AdminHomePage() {
  return (
    <div className="space-y-8">
      {/* Sayfa başlığı */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-[var(--text-tertiary)]">
          Bekleyen işler ve özet bilgiler.
        </p>
      </div>

      {/* Listeler */}
      <div className="space-y-6">
        <AdminPendingTasksClient />
        <AdminApplicationsByStatusClient />
      </div>
    </div>
  );
}
