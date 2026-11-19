"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { supabase, currentUser } from "./supabase/server";
import { safeNext } from "./navigation";
import type { ActionState } from "./action-state";

export async function authenticate(mode: "login" | "signup" | "forgot" | "reset", next: string, _: ActionState, form: FormData): Promise<ActionState> {
  const client = await supabase();
  if (!client) return { error: "unconfigured" };
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const name = String(form.get("name") ?? "").trim();
  if (mode !== "reset" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "invalidEmail" };
  if (mode !== "forgot" && (password.length < (mode === "login" ? 1 : 8) || password.length > 256)) {
    return { error: mode === "login" ? "credentials" : "invalidPassword" };
  }
  if (mode === "login") {
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) return { error: "credentials" };
    redirect(safeNext(next));
  }
  if (mode === "reset") {
    if (!await currentUser()) return { error: "linkError" };
    const { error } = await client.auth.updateUser({ password });
    if (error) return { error: "error" };
    const { error: signOutError } = await client.auth.signOut({ scope: "local" });
    if (signOutError) redirect("/profile");
    redirect("/login?updated=1");
  }
  const origin = (await headers()).get("origin");
  const confirmation = origin ? new URL("/auth/confirm", origin) : null;
  if (mode === "forgot") {
    confirmation?.searchParams.set("flow", "recovery");
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: confirmation?.href });
    return error ? { error: "error" } : { notice: "resetSent" };
  }
  if (name.length < 2 || name.length > 100) return { error: "invalidName" };
  confirmation?.searchParams.set("next", safeNext(next));
  const { data, error } = await client.auth.signUp({
    email, password,
    options: { data: { full_name: name }, emailRedirectTo: confirmation?.href },
  });
  if (error) return { error: "error" };
  if (data.session) redirect(safeNext(next));
  return { notice: "confirmEmail" };
}

export async function logout() {
  const client = await supabase();
  if (client) {
    const { error } = await client.auth.signOut({ scope: "local" });
    if (error) throw new Error("Could not sign out");
  }
  redirect("/");
}