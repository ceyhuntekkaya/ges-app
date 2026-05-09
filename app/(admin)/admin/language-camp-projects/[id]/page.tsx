import { AdminLanguageCampProjectEditClient } from "@/components/admin/projects/AdminLanguageCampProjectEditClient";

export default async function AdminLanguageCampProjectEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminLanguageCampProjectEditClient id={id} />;
}

