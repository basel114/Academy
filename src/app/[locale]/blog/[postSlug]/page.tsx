import {notFound} from "next/navigation";
import {Link} from "@/i18n/navigation";
import {SiteHeader} from "@/components/site-header";
import {createSupabaseServerClient} from "@/lib/supabase/server";
import {ArrowLeft} from "lucide-react";

export async function generateMetadata({params}:{params:Promise<{locale:"en"|"nl"|"ar";postSlug:string}>}){const{locale,postSlug}=await params;const supabase=await createSupabaseServerClient();const{data}=await supabase?.from("blog_posts").select("blog_post_translations(locale,title,excerpt)").eq("slug",postSlug).eq("is_published",true).maybeSingle()||{data:null};const translation=data?.blog_post_translations.find(item=>item.locale===locale)||data?.blog_post_translations.find(item=>item.locale==="en");return{title:translation?.title||"Article | Samen Learning",description:translation?.excerpt||"Ideas and useful guidance from Samen Learning."};}

export default async function BlogArticle({params}:{params:Promise<{locale:"en"|"nl"|"ar";postSlug:string}>}){
  const{locale,postSlug}=await params;const supabase=await createSupabaseServerClient();const{data:post}=await supabase?.from("blog_posts").select("slug,published_at,blog_post_translations(locale,title,excerpt,body)").eq("slug",postSlug).eq("is_published",true).maybeSingle()||{data:null};if(!post)return notFound();const translation=post.blog_post_translations.find(item=>item.locale===locale)||post.blog_post_translations.find(item=>item.locale==="en");if(!translation)return notFound();const back={en:"All articles",nl:"Alle artikelen",ar:"كل المقالات"}[locale];
  return <><SiteHeader/><main className="container section"><article className="mx-auto max-w-3xl"><Link href="/blog" className="quiet"><ArrowLeft className="inline" size={16}/> {back}</Link><p className="eyebrow mt-8">Samen Learning</p><h1 className="serif mt-3 text-5xl leading-tight">{translation.title}</h1>{post.published_at&&<p className="quiet mt-4 text-sm">{new Intl.DateTimeFormat(locale,{dateStyle:"long"}).format(new Date(post.published_at))}</p>}<p className="mt-8 text-xl leading-8">{translation.excerpt}</p><div className="mt-8 grid gap-5 text-base leading-8">{translation.body.split(/\n\s*\n/).filter(Boolean).map((paragraph:string,index:number)=><p key={index} className="whitespace-pre-wrap">{paragraph}</p>)}</div></article></main></>;
}
