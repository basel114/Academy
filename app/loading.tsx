import { getLocale } from "@/lib/i18n";
import { messages } from "@/lib/messages";
export default async function Loading() {
  return <section className="wrap section page" role="status" aria-busy="true">
    <span className="sr-only">{messages[await getLocale()].loading}</span><div className="skeleton skeleton-heading"/>
    <div className="course-grid">{[0, 1, 2].map(i => <div className="skeleton skeleton-card" key={i}/>)}</div>
  </section>;
}