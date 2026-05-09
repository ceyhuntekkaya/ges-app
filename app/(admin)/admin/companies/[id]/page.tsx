import { AdminCompanyEditClient } from "@/components/admin/companies/AdminCompanyEditClient";

export default async function AdminCompanyEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminCompanyEditClient id={id} />;
}

