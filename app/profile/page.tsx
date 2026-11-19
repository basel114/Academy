import { redirect } from "next/navigation";
import { UserRound } from "lucide-react";
import { currentUser, supabase } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n";
import { messages } from "@/lib/messages";

export default async function Profile() {
  const [locale, client, user] = await Promise.all([getLocale(), supabase(), currentUser()]);
  if (!user || !client) redirect("/login?next=%2Fprofile");
  const { data, error } = await client.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  if (error) throw new Error("Profile unavailable");
  const t = messages[locale];
  return <section className="wrap section page"><div className="page-head"><h1>{t.profile}</h1></div>
    <div className="profile-card stack"><UserRound size={28} aria-hidden="true"/><dl className="stack"><div><dt>{t.name}</dt><dd>{data?.full_name || "—"}</dd></div><div><dt>{t.email}</dt><dd><bdi>{user.email}</bdi></dd></div></dl></div>
  </section>;
}