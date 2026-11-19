import Link from "next/link";
import { redirect } from "next/navigation";
import Logo from "./Logo";
import { AuthForm } from "./Forms";
import { getLocale } from "@/lib/i18n";
import { messages } from "@/lib/messages";
import { safeNext } from "@/lib/navigation";
import { currentUser } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/action-state";

export type AuthParams = Promise<{ next?: string; reset?: string; invalid?: string; updated?: string }>;
export default async function AuthPage({ kind, searchParams }: { kind: "signup" | "login" | "forgot"; searchParams: AuthParams }) {
  const [locale, params, user] = await Promise.all([getLocale(), searchParams, currentUser()]);
  const t = messages[locale];
  const next = safeNext(params.next);
  if (kind !== "forgot" && user) redirect(next);
  const mode = kind === "forgot" && params.reset === "1" && user ? "reset" : kind;
  const title = { signup: t.signup, login: t.login, forgot: t.forgotTitle, reset: t.newPassword }[mode];
  const description = { signup: t.signupDesc, login: t.loginDesc, forgot: t.forgotDesc, reset: "" }[mode];
  const initial: ActionState = {};
  if (kind === "login" && params.updated === "1") initial.notice = "passwordSaved";
  if (kind === "forgot" && (params.invalid === "1" || (params.reset === "1" && !user))) initial.error = "linkError";
  return <section className="auth-area"><div className="auth-card">
    <Logo variant="icon"/>
    <h1>{title}</h1>
    {description && <p>{description}</p>}
    <AuthForm mode={mode} locale={locale} next={next} initial={initial}/>
    <div className="auth-alt">{kind === "login" ? <>{t.noAccount} <Link href={`/signup?next=${encodeURIComponent(next)}`}>{t.signup}</Link></>
      : kind === "signup" ? <>{t.haveAccount} <Link href={`/login?next=${encodeURIComponent(next)}`}>{t.login}</Link></>
      : <Link href="/login">{t.backLogin}</Link>}</div>
  </div></section>;
}