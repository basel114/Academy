"use client";
import { useActionState } from "react";
import Link from "next/link";
import { authenticate, logout } from "@/lib/auth-actions";
import { bookCourse, cancelCourse } from "@/lib/enrollment-actions";
import { messages, type Locale } from "@/lib/messages";
import type { ActionState } from "@/lib/action-state";

export function Feedback({ state, locale }: { state: ActionState; locale: Locale }) {
  const t = messages[locale];
  if (state.error) return <p role="alert" className="feedback danger">{t[state.error]}</p>;
  if (state.notice) return <p role="status" className="feedback success">{t[state.notice]}</p>;
  return null;
}

export function AuthForm({ mode, locale, next, initial }: {
  mode: "signup" | "login" | "forgot" | "reset"; locale: Locale; next: string; initial: ActionState;
}) {
  const t = messages[locale];
  const [state, action, pending] = useActionState(authenticate.bind(null, mode, next), initial);
  const button = { signup: t.signup, login: t.login, forgot: t.reset, reset: t.save }[mode];
  return <form action={action} className="stack">
    {mode === "signup" && <label>{t.name}<input name="name" autoComplete="name" required minLength={2} maxLength={100}/></label>}
    {mode !== "reset" && <label>{t.email}<input name="email" type="email" autoComplete="email" dir="ltr" required/></label>}
    {mode !== "forgot" && <label>{mode === "reset" ? t.newPassword : t.password}<input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "login" ? undefined : 8} maxLength={256} dir="ltr" required/></label>}
    {mode === "login" && <Link className="text-link" href="/forgot-password">{t.forgot}</Link>}
    <Feedback state={state} locale={locale}/>
    <button className="button primary" disabled={pending}>{pending ? t.loading : button}</button>
  </form>;
}

export function Booking({ slug, enrolled, locale }: { slug: string; enrolled: boolean; locale: Locale }) {
  const t = messages[locale];
  const [state, action, pending] = useActionState(bookCourse.bind(null, slug), {});
  return <>
    {enrolled || state.notice
      ? <Link className="button primary" href="/my-courses">{t.booked}</Link>
      : <form action={action}><button className="button primary w-full" disabled={pending}>{pending ? t.loading : t.book}</button></form>}
    <div className={state.notice ? "toast" : ""}><Feedback state={state} locale={locale}/></div>
  </>;
}

export function CancelBooking({ id, locale }: { id: string; locale: Locale }) {
  const t = messages[locale];
  const [state, action, pending] = useActionState(cancelCourse.bind(null, id), {});
  return <form action={action} onSubmit={event => { if (!window.confirm(t.cancelConfirm)) event.preventDefault(); }}>
    <button className="button outline" disabled={pending}>{pending ? t.loading : t.cancel}</button>
    <Feedback state={state} locale={locale}/>
  </form>;
}

export function Logout({ locale }: { locale: Locale }) {
  return <form action={logout}><button type="submit">{messages[locale].logout}</button></form>;
}