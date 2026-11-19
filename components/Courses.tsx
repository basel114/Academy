import Image from "next/image";
import Link from "next/link";
import { Clock3, Gauge, Sparkles, Code2, PanelsTopLeft, Palette, MessagesSquare, BookOpen } from "lucide-react";
import type { Course, Category } from "@/lib/catalog";
import { messages, formatPrice, type Locale } from "@/lib/messages";
export const icons = { ai: Sparkles, programming: Code2, web: PanelsTopLeft, graphic: Palette, english: MessagesSquare, italian: BookOpen };

export function Cover({ course, priority }: { course: Course; priority?: boolean }) {
  return <Image src={course.cover_image} alt="" width={640} height={320} preload={priority} unoptimized className="cover"/>;
}

export function Metadata({ course, locale }: { course: Course; locale: Locale }) {
  const t = messages[locale];
  const level = course.level === "advanced" || course.level === "intermediate" ? course.level : "beginner";
  return <div className="metadata"><span><Clock3 size={16}/>{new Intl.NumberFormat(locale).format(course.duration_hours)} {t.hours}</span><span><Gauge size={16}/>{t[level]}</span></div>;
}

export function CourseCard({ course, category, locale }: { course: Course; category?: Category; locale: Locale }) {
  const ar = locale === "ar";
  return <article className="course-card">
    <Link href={`/courses/${course.slug}`} className="course-link">
      <Cover course={course}/>
      <div className="course-body">
        {category && <p className="course-category">{ar ? category.name_ar : category.name}</p>}
        <h3>{ar ? course.title_ar : course.title}</h3>
        <p>{ar ? course.instructor_name_ar : course.instructor_name}</p>
        <div className="course-foot"><Metadata course={course} locale={locale}/><strong>{formatPrice(course.price, locale)}</strong></div>
      </div>
    </Link>
  </article>;
}