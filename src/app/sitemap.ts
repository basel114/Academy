import type {MetadataRoute} from "next";
import {createSupabaseServerClient} from "@/lib/supabase/server";

const locales=["ar","nl","en"] as const;
const pages=["","about","courses","library","parenting","events","resources","blog","contact","privacy","terms","refunds"];
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
  const base=process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000";const now=new Date();const rows:MetadataRoute.Sitemap=[];
  for(const page of pages)for(const locale of locales){const url=`${base}/${locale}${page?`/${page}`:""}`;rows.push({url,lastModified:now,changeFrequency:page===""?"weekly":"monthly",priority:page===""?1:page==="courses"||page==="library"?0.8:0.5,alternates:{languages:Object.fromEntries(locales.map(code=>[code,`${base}/${code}${page?`/${page}`:""}`]))}});}
  const supabase=await createSupabaseServerClient();if(supabase){const[{data:courses},{data:books},{data:posts}]=await Promise.all([supabase.from("courses").select("slug").eq("is_published",true),supabase.from("books").select("slug").eq("is_published",true),supabase.from("blog_posts").select("slug").eq("is_published",true)]);for(const item of courses||[])for(const locale of locales)rows.push({url:`${base}/${locale}/courses/${item.slug}`,lastModified:now,changeFrequency:"monthly",priority:0.7});for(const item of books||[])for(const locale of locales)rows.push({url:`${base}/${locale}/library/${item.slug}`,lastModified:now,changeFrequency:"monthly",priority:0.6});for(const item of posts||[])for(const locale of locales)rows.push({url:`${base}/${locale}/blog/${item.slug}`,lastModified:now,changeFrequency:"monthly",priority:0.6});}
  return rows;
}
