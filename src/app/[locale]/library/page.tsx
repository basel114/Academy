import {Link} from "@/i18n/navigation";
import {SiteHeader} from "@/components/site-header";
import {books as demoBooks} from "@/lib/demo";
import {createSupabaseServerClient} from "@/lib/supabase/server";
import {BookOpen} from "lucide-react";

export default async function LibraryCatalog({params}:{params:Promise<{locale:"ar"|"nl"|"en"}>}){
  const{locale}=await params;const supabase=await createSupabaseServerClient();
  const{data}=await supabase?.from("books").select("id,slug,author,category,price_minor,currency,book_translations(locale,title,description)").eq("is_published",true).order("created_at",{ascending:false})||{data:null};
  const dbItems=(data||[]).map(book=>({slug:book.slug,title:book.book_translations.find(item=>item.locale===locale)?.title||book.book_translations.find(item=>item.locale==="en")?.title||"Book",author:book.author,category:book.category,price:book.price_minor===0?"Free":new Intl.NumberFormat(locale,{style:"currency",currency:book.currency}).format(book.price_minor/100)}));
  const sample=demoBooks.map(book=>({slug:book.id,title:book.title[locale],author:book.author,category:book.kind,price:book.price}));const items=dbItems.length?dbItems:sample;
  const labels={en:{title:"Digital library",lead:"Books and resources selected for curious readers.",demo:"These sample titles are for preview. Published books from your library will appear here.",open:"View book"},nl:{title:"Digitale bibliotheek",lead:"Boeken en materialen voor nieuwsgierige lezers.",demo:"Voorbeeldtitels voor een eerste indruk. Gepubliceerde boeken verschijnen hier.",open:"Bekijk boek"},ar:{title:"المكتبة الرقمية",lead:"كتب وموارد مختارة للقراء الفضوليين.",demo:"هذه عناوين تجريبية للمعاينة. ستظهر الكتب المنشورة هنا.",open:"عرض الكتاب"}}[locale];
  return <><SiteHeader/><main className="container section"><p className="eyebrow">Samen Learning</p><h1 className="serif mt-3 text-5xl">{labels.title}</h1><p className="quiet mt-4 text-lg">{labels.lead}</p>{(!supabase||!data?.length)&&<p className="mt-6 rounded-xl bg-white p-4 text-sm">{labels.demo}</p>}<div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{items.map((book,index)=><article key={book.slug} className="card p-5"><div className="mb-5 grid h-48 place-items-center rounded-2xl text-5xl" style={{background:demoBooks[index%demoBooks.length].color}}><BookOpen size={54}/></div><p className="eyebrow">{book.category}</p><h2 className="serif mt-2 text-2xl">{book.title}</h2><p className="quiet mt-2">{book.author}</p><div className="mt-5 flex items-center justify-between"><strong>{book.price}</strong><Link className="pill pill-light" href={`/library/${book.slug}`}>{labels.open}</Link></div></article>)}</div></main></>;
}
