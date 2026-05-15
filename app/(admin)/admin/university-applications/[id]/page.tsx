import { AdminUniversityApplicationDetailClient } from "@/components/admin/applications/AdminUniversityApplicationDetailClient";

export default async function AdminUniversityApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminUniversityApplicationDetailClient id={id} />;
}

