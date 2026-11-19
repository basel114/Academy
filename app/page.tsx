import Link from "next/link";
import { BookOpenCheck, Clock3, Compass } from "lucide-react";
import { CourseCard, icons } from "@/components/Courses";
import HeroArt from "@/components/HeroArt";
import { getCatalog } from "@/lib/catalog";
import { getLocale } from "@/lib/i18n";
import { messages } from "@/lib/messages";

export default async function Home() {
  const [locale, { courses, categories }] = await Promise.all([getLocale(), getCatalog()]);
  const t = messages[locale];
  return <>
    <div className="hero-shell"><section className="wrap hero">
      <div><h1>{t.heroA}<br/><em>{t.heroB}</em></h1><p>{t.heroDesc}</p><Link className="button hero-button" href="/courses">{t.browse}</Link></div>
      <HeroArt/>
    </section></div>
    <section className="wrap section">
      <div className="section-head"><div><h2>{t.featured}</h2><p>{t.featuredDesc}</p></div><Link className="text-link" href="/courses">{t.all}</Link></div>
      <div className="course-grid">{courses.filter(course => course.is_featured).slice(0, 3).map(course => <CourseCard key={course.slug} course={course} locale={locale} category={categories.find(c => c.id === course.category_id)}/>)}</div>
    </section>
    <section className="category-band"><div className="wrap section">
      <h2>{t.categories}</h2><div className="category-grid">{categories.map(category => {
        const Icon = icons[category.id as keyof typeof icons] ?? Compass;
        return <Link className="category-link" key={category.id} href={`/courses?category=${encodeURIComponent(category.id)}`}><span><Icon size={22}/></span>{locale === "ar" ? category.name_ar : category.name}</Link>;
      })}</div>
    </div></section>
    <section className="wrap section why"><h2>{t.why}</h2><div className="why-grid">{([
      [BookOpenCheck, t.practical, t.practicalDesc],
      [Clock3, t.pace, t.paceDesc],
      [Compass, t.range, t.rangeDesc],
    ] as const).map(([Icon, name, description]) => <article key={String(name)}><Icon size={25}/><h3>{name}</h3><p>{description}</p></article>)}</div></section>
  </>;
}