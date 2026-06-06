import { redirect } from "next/navigation";
import { applicationsUrlForProject } from "@/lib/applications/languageCampUrls";
import { getMyLanguageCampApplication } from "@/lib/api/portalServer";

export default async function LanguageCampApplicationDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await getMyLanguageCampApplication(id);

  if (res.status === 200 && res.data?.languageCampProjectId) {
    redirect(applicationsUrlForProject(res.data.languageCampProjectId, id));
  }

  redirect("/applications");
}
