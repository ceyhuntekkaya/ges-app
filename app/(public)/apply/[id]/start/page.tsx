import { ApplyStartNoAccountClient } from "@/components/public/ApplyStartNoAccountClient";

type Props = { params: Promise<{ id: string }> };

export default async function ApplyStartNoAccountPage(props: Props) {
  const { id } = await props.params;
  return <ApplyStartNoAccountClient projectId={id} />;
}

