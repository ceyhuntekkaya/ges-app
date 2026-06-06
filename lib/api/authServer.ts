import type { MeDto } from "@/lib/api/generated/index";
import { cookies } from "next/headers";
import { getBackendBaseUrl } from "./baseUrl";

const ACCESS_TOKEN_COOKIE = "ges_access_token";

export type AuthMeResult = {
  status: number;
  data?: MeDto;
};

export async function getCurrentUser(): Promise<AuthMeResult> {
  const jar = await cookies();
  const token = jar.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) return { status: 401 };

  const base = await getBackendBaseUrl();
  let res: Response;
  try {
    res = await fetch(`${base}/v1/auth/me`, {
      method: "GET",
      headers: { accept: "application/json", authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return { status: 502 };
  }

  if (!res.ok) return { status: res.status };
  const data = (await res.json().catch(() => null)) as MeDto | null;
  if (!data) return { status: 502 };
  return { status: res.status, data };
}
