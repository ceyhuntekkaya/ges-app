import { ApplyProjectDetailClient } from "@/components/public/ApplyProjectDetailClient";

type Props = { params: Promise<{ id: string }> };

export default async function ApplyProjectDetailPage(props: Props) {
  const { id } = await props.params;
  return <ApplyProjectDetailClient id={id} />;
}

