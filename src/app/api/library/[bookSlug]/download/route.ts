import {NextResponse} from "next/server";
import {createSupabaseServerClient} from "@/lib/supabase/server";

export async function GET(_request:Request,{params}:{params:Promise<{bookSlug:string}>}){
  const supabase=await createSupabaseServerClient();
  if(!supabase)return NextResponse.json({error:"Library access is not configured."},{status:503});
  const{data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:"Sign in to access this book."},{status:401});
  const{bookSlug}=await params;
  const{data:book}=await supabase.from("books").select("id,file_path,price_minor,is_published").eq("slug",bookSlug).maybeSingle();
  if(!book||!book.is_published)return NextResponse.json({error:"Book not found."},{status:404});
  if(book.price_minor>0){
    const{data:purchase}=await supabase.from("purchases").select("id").eq("book_id",book.id).eq("user_id",user.id).eq("status","paid").maybeSingle();
    if(!purchase)return NextResponse.json({error:"A verified purchase is required."},{status:403});
  }
  if(!book.file_path)return NextResponse.json({error:"The book file is not available yet."},{status:404});
  const{data:signed,error}=await supabase.storage.from("library-private").createSignedUrl(book.file_path,60);
  if(error||!signed)return NextResponse.json({error:"The book could not be opened."},{status:403});
  return NextResponse.redirect(signed.signedUrl,{headers:{"Cache-Control":"private, no-store"}});
}
