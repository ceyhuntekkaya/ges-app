import { NextResponse } from "next/server";
import { setSessionCookies } from "@/lib/session";
import { getBackendBaseUrl } from "@/lib/api/baseUrl";

type LoginRequest = { email: string; password: string };
type LoginResponse = { accessToken?: string; tokenType?: string; refreshToken?: string };
type MeResponse = { role?: "ADMIN" | "USER" };

async function readErrorPayload(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await res.json().catch(() => null)) as unknown;
  }
  return { message: await res.text().catch(() => "") };
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as LoginRequest | null;
  if (!body?.email || !body?.password) {
    return NextResponse.json({ message: "E-posta ve şifre zorunlu." }, { status: 400 });
  }

  let baseUrl: string;
  try {
    baseUrl = await getBackendBaseUrl();
  } catch (e) {
    return NextResponse.json(
      {
        message: "API config okunamadı.",
        detail: process.env.NODE_ENV === "development" ? String(e) : undefined,
      },
      { status: 500 },
    );
  }

  let loginRes: Response;
  try {
    loginRes = await fetch(`${baseUrl}/v1/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: body.email, password: body.password }),
      cache: "no-store",
    });
  } catch (e) {
    return NextResponse.json(
      {
        message: "API'ye bağlanılamadı.",
        detail: process.env.NODE_ENV === "development" ? String(e) : undefined,
      },
      { status: 502 },
    );
  }

  if (!loginRes.ok) {
    const payload = await readErrorPayload(loginRes);
    const status = loginRes.status || 502;
    return NextResponse.json(
      {
        message:
          status === 401 || status === 403
            ? "Giriş bilgileri hatalı."
            : "Giriş başarısız (backend hata verdi).",
        backendStatus: status,
        backend: process.env.NODE_ENV === "development" ? payload : undefined,
      },
      { status },
    );
  }

  const tokens = (await loginRes.json()) as LoginResponse;
  if (!tokens.accessToken) {
    return NextResponse.json({ message: "Giriş başarısız (token alınamadı)." }, { status: 502 });
  }

  // Role bilgisini server-side alıp cookie'ye yazıyoruz (F5 sonrası korumak için).
  const meRes = await fetch(`${baseUrl}/v1/auth/me`, {
    method: "GET",
    headers: { authorization: `Bearer ${tokens.accessToken}` },
    cache: "no-store",
  });

  const me = (await meRes.json().catch(() => null)) as MeResponse | null;
  const role = me?.role;
  if (role !== "ADMIN" && role !== "USER") {
    return NextResponse.json({ message: "Giriş başarısız (rol alınamadı)." }, { status: 502 });
  }

  await setSessionCookies({ accessToken: tokens.accessToken, role });
  return NextResponse.json({ ok: true, role });
}
