import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getBackendBaseUrl } from "@/lib/api/baseUrl";

const ACCESS_TOKEN_COOKIE = "ges_access_token";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

async function buildTargetUrl(req: NextRequest, segments: string[]) {
  const base = await getBackendBaseUrl();
  const subPath = segments.join("/");
  const search = req.nextUrl.search ?? "";
  return `${base}/${subPath}${search}`;
}

async function forward(req: NextRequest, segments: string[]) {
  let target: string;
  try {
    target = await buildTargetUrl(req, segments);
  } catch (e) {
    return NextResponse.json(
      {
        message: "API config okunamadı.",
        detail: process.env.NODE_ENV === "development" ? String(e) : undefined,
      },
      { status: 500 },
    );
  }

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const jar = await cookies();
  const token = jar.get(ACCESS_TOKEN_COOKIE)?.value;
  if (token) headers.set("authorization", `Bearer ${token}`);
  headers.delete("cookie");
  // Generated ORVAL client does JSON.parse() unconditionally for non-empty bodies.
  // Some backends may content-negotiate to HTML (or redirect to an HTML login page)
  // when Accept is missing or prefers text/html. Force JSON to avoid "<!doctype" bodies.
  // File download/stream routes must keep the browser's Accept header so media previews work.
  const subPath = segments.join("/");
  const isBinaryRoute = /\/(?:download|file)$/.test(subPath);
  if (!isBinaryRoute) {
    headers.set("accept", "application/json");
  }
  headers.set("x-requested-with", "XMLHttpRequest");

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: "manual",
    cache: "no-store",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = req.body;
    // Web fetch streaming bodies require this on Node runtime.
    (init as unknown as { duplex?: string }).duplex = "half";
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch (e) {
    return NextResponse.json(
      {
        message: "Backend'e ulaşılamadı.",
        detail: process.env.NODE_ENV === "development" ? String(e) : undefined,
      },
      { status: 502 },
    );
  }

  const respHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      respHeaders.set(key, value);
    }
  });

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: respHeaders,
  });
}

type RouteCtx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function POST(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function PUT(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function HEAD(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function OPTIONS(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  return forward(req, path);
}
