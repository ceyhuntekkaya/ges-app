import { NextResponse } from "next/server";
import { updateMyUniversityApplicationDraft } from "@/lib/api/portalServer";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const res = await updateMyUniversityApplicationDraft(id, body);
  return NextResponse.json(res.data ?? {}, { status: res.status });
}

