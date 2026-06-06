import { AdminLanguageCampApplicationDetailClient } from "@/components/admin/applications/AdminLanguageCampApplicationDetailClient";

export default async function AdminLanguageCampApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminLanguageCampApplicationDetailClient id={id} />;
}
