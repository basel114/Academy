import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen } from "lucide-react";
import { Cover } from "@/components/Courses";
import { CancelBooking } from "@/components/Forms";
import { currentUser, supabase } from "@/lib/supabase/server";
import type { Course } from "@/lib/catalog";
import { getLocale } from "@/lib/i18n";
import { messages } from "@/lib/messages";

type Enrollment = { id: string; created_at: string; status: "enrolled"; course: Course | null };

export default async function MyCourses() {
  const [locale, client, user] = await Promise.all([getLocale(), supabase(), currentUser()]);
  if (!user || !client) redirect("/login?next=%2Fmy-courses");
  const { data, error } = await client.from("enrollments").select("id, created_at, status, course:courses(*)")
    .eq("user_id", user.id).order("created_at", { ascending: false }).returns<Enrollment[]>();
  if (error) throw new Error("Bookings unavailable");
  const t = messages[locale];
  const ar = locale === "ar";
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" });
  return <section className="wrap section page">
    <div className="page-head"><h1>{t.my}</h1><p>{t.myDesc}</p></div>
    {!data.length ? <div className="empty"><BookOpen size={30} aria-hidden="true"/><h2>{t.empty}</h2><Link className="button primary" href="/courses">{t.browseMy}</Link></div>
      : <div className="stack">{data.map(({ id, course, created_at, status }) => course && <article className="enrollment" key={id}>
        <Link href={`/courses/${course.slug}`} aria-label={ar ? course.title_ar : course.title}><Cover course={course}/></Link>
        <div><span className="status">{t[status]}</span><h2><Link href={`/courses/${course.slug}`}>{ar ? course.title_ar : course.title}</Link></h2><p>{ar ? course.instructor_name_ar : course.instructor_name}</p><p>{t.bookedOn} · <time dateTime={created_at}>{date.format(new Date(created_at))}</time></p></div>
        <CancelBooking id={id} locale={locale}/>
      </article>)}</div>}
  </section>;
}