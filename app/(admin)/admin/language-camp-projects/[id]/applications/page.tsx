import { AdminLanguageCampProjectApplicationsClient } from "@/components/admin/projects/AdminLanguageCampProjectApplicationsClient";

export default async function AdminLanguageCampProjectApplicationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminLanguageCampProjectApplicationsClient projectId={id} />;
}
