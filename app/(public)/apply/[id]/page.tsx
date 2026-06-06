import { ApplyProjectDetailClient } from "@/components/public/ApplyProjectDetailClient";
import { getSession } from "@/lib/session";

type Props = { params: Promise<{ id: string }> };

export default async function ApplyProjectDetailPage(props: Props) {
  const { id } = await props.params;
  const session = await getSession();
  return <ApplyProjectDetailClient id={id} isAuthenticated={Boolean(session)} />;
}

