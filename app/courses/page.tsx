import { ChevronDown, Search } from "lucide-react";
import { CourseCard } from "@/components/Courses";
import { getCatalog } from "@/lib/catalog";
import { getLocale } from "@/lib/i18n";
import { messages } from "@/lib/messages";

export default async function Courses({ searchParams }: { searchParams: Promise<{ q?: string | string[]; category?: string | string[] }> }) {
  const [locale, { courses, categories }, params] = await Promise.all([getLocale(), getCatalog(), searchParams]);
  const t = messages[locale];
  const query = typeof params.q === "string" ? params.q.slice(0, 120).trim() : "";
  const category = categories.find(item => item.id === params.category)?.id ?? "";
  const normalized = query.toLocaleLowerCase(locale);
  const results = courses.filter(course => (!category || course.category_id === category) && [
    course.title, course.title_ar, course.description, course.description_ar, course.instructor_name, course.instructor_name_ar,
  ].some(value => value.toLocaleLowerCase(locale).includes(normalized)));
  return <section className="wrap section page">
    <div className="page-head"><h1>{t.courses}</h1><p>{t.catalogDesc}</p></div>
    <form className="filters" action="/courses" key={JSON.stringify([query, category])}>
      <label className="search-field"><Search size={18} aria-hidden="true"/><span className="sr-only">{t.search}</span><input name="q" defaultValue={query} placeholder={t.search} maxLength={120} type="search"/></label>
      <label className="select-field"><span className="sr-only">{t.filter}</span><select name="category" defaultValue={category}><option value="">{t.allCategories}</option>{categories.map(item => <option value={item.id} key={item.id}>{locale === "ar" ? item.name_ar : item.name}</option>)}</select><ChevronDown size={16} aria-hidden="true"/></label>
      <button className="button primary">{t.search}</button>
    </form>
    {results.length ? <div className="course-grid">{results.map(course => <CourseCard key={course.slug} course={course} locale={locale} category={categories.find(c => c.id === course.category_id)}/>)}</div> : <p className="empty">{t.noCourses}</p>}
  </section>;
}