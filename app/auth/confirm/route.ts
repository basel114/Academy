import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
import { safeNext } from "@/lib/navigation";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const token_hash = params.get("token_hash");
  const type = params.get("type");
  const code = params.get("code");
  const recovery = type === "recovery" || params.get("flow") === "recovery";
  const client = await supabase();
  const result = client && token_hash && (type === "email" || type === "signup" || type === "recovery")
    ? await client.auth.verifyOtp({ token_hash, type })
    : client && code ? await client.auth.exchangeCodeForSession(code) : null;
  const path = result && !result.error
    ? recovery ? "/forgot-password?reset=1" : safeNext(params.get("next"))
    : "/forgot-password?invalid=1";
  const response = NextResponse.redirect(new URL(path, request.url));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}