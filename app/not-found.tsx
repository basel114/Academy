import Link from "next/link";
import { getLocale } from "@/lib/i18n";
import { messages } from "@/lib/messages";
export default async function NotFound() {
  const t = messages[await getLocale()];
  return <section className="wrap section page"><div className="empty"><h1>{t.missing}</h1><Link className="button primary" href="/courses">{t.browseMy}</Link></div></section>;
}