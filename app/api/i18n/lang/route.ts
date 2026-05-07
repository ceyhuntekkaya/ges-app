import { NextResponse } from "next/server";

const LANG_COOKIE = "ges_lang";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { lang?: "tr" | "en" };
  const lang = body.lang === "en" ? "en" : "tr";

  const res = NextResponse.json({ ok: true, lang });
  res.cookies.set(LANG_COOKIE, lang, { path: "/", sameSite: "lax" });
  return res;
}

