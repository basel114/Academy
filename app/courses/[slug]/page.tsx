import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Download, Lock } from "lucide-react";
import { lessonsByCourse } from "@/lib/lessons";
import { Cover, Metadata } from "@/components/Courses";
import { Booking } from "@/components/Forms";
import { getCatalog } from "@/lib/catalog";
import { getLocale } from "@/lib/i18n";
import { formatPrice, messages } from "@/lib/messages";
import { currentUser, supabase } from "@/lib/supabase/server";

export default async function CourseDetails({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, { courses, categories }, locale, user, client] = await Promise.all([params, getCatalog(), getLocale(), currentUser(), supabase()]);
  const course = courses.find(item => item.slug === slug);
  if (!course) notFound();
  const t = messages[locale];
  const ar = locale === "ar";
  const category = categories.find(item => item.id === course.category_id);
  const modules = lessonsByCourse[course.slug];
  const enrollment = client && user && course.id
    ? await client.from("enrollments").select("id").eq("user_id", user.id).eq("course_id", course.id).maybeSingle()
    : null;
  if (enrollment?.error) throw new Error("Booking status unavailable");
  return <section className="wrap section page">
    <Link href="/courses" className="text-link">{t.courses}</Link>
    <div className="detail-grid">
      <div>
        {category && <p className="course-category">{ar ? category.name_ar : category.name}</p>}
        <h1>{ar ? course.title_ar : course.title}</h1>
        <p className="intro">{ar ? course.description_ar : course.description}</p>
        <p className="instructor"><strong>{t.instructor}</strong> · {ar ? course.instructor_name_ar : course.instructor_name}</p>
        <Metadata course={course} locale={locale}/>
        <div className="curriculum"><h2>{t.curriculum}</h2><ul>{(ar ? course.curriculum_ar : course.curriculum).map(item => <li key={item}><CheckCircle2 size={19} aria-hidden="true"/>{item}</li>)}</ul></div>
        {modules && <div className="lessons">
          <h2>{t.lessonsTitle}</h2>
          {modules.map(module => <section className="lesson-module" key={module.title}>
            <h3>{ar ? module.title_ar : module.title}</h3>
            <ul className="lesson-grid">{module.lessons.map(lesson => <li className="lesson" key={lesson.id}>
              <Image src={lesson.thumbnail} alt="" width={480} height={270} unoptimized/>
              <div className="lesson-body">
                <p className="lesson-number">{lesson.id}</p>
                <h4>{ar ? lesson.title_ar : lesson.title}</h4>
                {lesson.free
                  ? <><span className="lesson-badge">{t.freePreview}</span><div className="lesson-links">
                      <a href={lesson.free.slides} download><Download size={16} aria-hidden="true"/>{t.slidesPdf}</a>
                      <a href={lesson.free.worksheet} download><Download size={16} aria-hidden="true"/>{t.worksheetPdf}</a>
                    </div></>
                  : <p className="lesson-locked"><Lock size={15} aria-hidden="true"/>{t.includedWithBooking}</p>}
              </div>
            </li>)}</ul>
          </section>)}
          <p className="lesson-more">{t.moreModules}</p>
        </div>}
      </div>
      <aside className="booking-card"><Cover course={course} priority/><div className="stack booking-body"><strong className="price">{formatPrice(course.price, locale)}</strong><p>{t.demo}</p><Booking slug={slug} enrolled={!!enrollment?.data} locale={locale}/></div></aside>
    </div>
  </section>;
}