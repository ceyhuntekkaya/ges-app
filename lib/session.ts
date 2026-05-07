import { cookies } from "next/headers";

export type AppRole = "ADMIN" | "USER";

export type AppSession = {
  accessToken: string;
  role: AppRole;
};

const ACCESS_TOKEN_COOKIE = "ges_access_token";
const ROLE_COOKIE = "ges_role";

export async function getSession(): Promise<AppSession | null> {
  const jar = await cookies();
  const accessToken = jar.get(ACCESS_TOKEN_COOKIE)?.value;
  const role = jar.get(ROLE_COOKIE)?.value as AppRole | undefined;
  if (!accessToken || !role) return null;
  if (role !== "ADMIN" && role !== "USER") return null;
  return { accessToken, role };
}

export async function clearSessionCookies() {
  const jar = await cookies();
  jar.delete(ACCESS_TOKEN_COOKIE);
  jar.delete(ROLE_COOKIE);
}

export async function setSessionCookies(input: { accessToken: string; role: AppRole }) {
  const jar = await cookies();
  jar.set(ACCESS_TOKEN_COOKIE, input.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  jar.set(ROLE_COOKIE, input.role, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

