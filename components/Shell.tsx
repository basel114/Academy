import Link from "next/link";
import Image from "next/image";
import { BookOpen, Globe2, Moon, Sun, UserRound } from "lucide-react";
import Logo from "./Logo";
import { Logout } from "./Forms";
import { messages, type Locale } from "@/lib/messages";
import { setPreference } from "@/lib/preferences";
import { currentUser, supabase } from "@/lib/supabase/server";

export async function Navbar({ locale, theme }: { locale: Locale; theme: "dark" | "light" }) {
  const t = messages[locale];
  const user = await currentUser();
  const client = user && await supabase();
  const profile = client && user ? (await client.from("profiles").select("full_name, avatar_url").eq("id", user.id).maybeSingle()).data : null;
  const initial = (profile?.full_name || user?.email)?.trim().slice(0, 1).toUpperCase();
  const localAvatar = profile?.avatar_url?.startsWith("/covers/") ? profile.avatar_url : null;
  return <header className="navbar"><div className="wrap nav-inner">
    <Logo/>
    <nav className="nav-links" aria-label={t.courses}><Link href="/courses">{t.courses}</Link></nav>
    <div className="nav-controls">
      <form action={setPreference}><button className="icon-button" name="theme" value={theme === "light" ? "dark" : "light"} aria-label={t.theme}>{theme === "light" ? <Moon size={18}/> : <Sun size={18}/>}</button></form>
      <form action={setPreference}><button className="language" name="locale" value={locale === "en" ? "ar" : "en"} lang={locale === "en" ? "ar" : "en"}><Globe2 size={17}/>{t.language}</button></form>
      {user ? <details className="account">
        <summary className="avatar" aria-label={t.menu}>{localAvatar ? <Image src={localAvatar} alt="" width={36} height={36}/> : initial || <UserRound size={18}/>}</summary>
        <div className="dropdown">
          <Link href="/my-courses">{t.my}</Link><Link href="/profile">{t.profile}</Link><Logout locale={locale}/>
        </div>
      </details> : <><Link href="/login" className="nav-login">{t.login}</Link><Link href="/signup" className="button primary nav-join">{t.signup}</Link></>}
    </div>
  </div></header>;
}

export function Footer({ locale }: { locale: Locale }) {
  const t = messages[locale];
  return <footer className="footer"><div className="wrap footer-inner">
    <div><Logo/><p>{t.footer}</p></div>
    <Link href="/courses"><BookOpen size={18}/>{t.courses}</Link>
  </div></footer>;
}