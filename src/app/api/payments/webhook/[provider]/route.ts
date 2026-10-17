import {createHmac,timingSafeEqual} from "node:crypto";
import {createSupabaseAdminClient} from "@/lib/supabase/admin";

export const runtime="nodejs";
type PaymentRecord={id:string;user_id:string;item_type:"course"|"book";course_id:string|null;book_id:string|null;amount_minor:number;currency:string;status:string;provider:string;provider_reference:string|null};
type MolliePayment={id:string;status:string;amount:{currency:string;value:string};metadata?:{purchaseId?:string}|string|null};
type StripeCheckout={id:string;payment_status:string;amount_total:number;currency:string;metadata?:{purchaseId?:string};client_reference_id?:string|null};

function validStripeSignature(payload:string,header:string,secret:string){
  const parts=header.split(","),timestampValue=parts.find(part=>part.startsWith("t="))?.slice(2),signatures=parts.filter(part=>part.startsWith("v1=")).map(part=>part.slice(3));const timestamp=Number(timestampValue);if(!Number.isFinite(timestamp)||Math.abs(Date.now()/1000-timestamp)>300||!signatures.length)return false;
  const expected=createHmac("sha256",secret).update(`${timestampValue}.${payload}`).digest();return signatures.some(signature=>{try{const actual=Buffer.from(signature,"hex");return actual.length===expected.length&&timingSafeEqual(actual,expected)}catch{return false}});
}
function amountToMinor(value:string){const match=value.match(/^(\d+)\.(\d{2})$/);return match?Number(match[1])*100+Number(match[2]):NaN;}
function mollieMetadata(value:MolliePayment["metadata"]){if(typeof value!=="string")return value;try{return JSON.parse(value) as {purchaseId?:string}}catch{return null}}

export async function POST(request:Request,{params}:{params:Promise<{provider:string}>}){
  const{provider}=await params;if(provider!=="stripe"&&provider!=="mollie")return Response.json({error:"Unknown payment provider."},{status:404});
  const admin=createSupabaseAdminClient();if(!admin)return Response.json({error:"Payment webhook is not configured."},{status:503});
  let paymentId="",purchaseId="",amountMinor=0,currency="",paid=false,failed=false;
  if(provider==="mollie"){
    const apiKey=process.env.MOLLIE_API_KEY;if(!apiKey)return Response.json({error:"Payment verification is not configured."},{status:503});
    const form=await request.formData();paymentId=String(form.get("id")||"");if(!/^tr_[A-Za-z0-9]+$/.test(paymentId))return new Response("",{status:400});
    const response=await fetch(`https://api.mollie.com/v2/payments/${encodeURIComponent(paymentId)}`,{headers:{Authorization:`Bearer ${apiKey}`},cache:"no-store"});if(!response.ok)return new Response("Unable to verify payment",{status:502});
    const payment=await response.json() as MolliePayment;const metadata=mollieMetadata(payment.metadata);purchaseId=metadata?.purchaseId||"";amountMinor=amountToMinor(payment.amount.value);currency=payment.amount.currency.toUpperCase();paid=payment.status==="paid";failed=["failed","canceled","expired"].includes(payment.status);
  }else{
    const webhookSecret=process.env.STRIPE_WEBHOOK_SECRET,apiKey=process.env.STRIPE_SECRET_KEY;if(!webhookSecret||!apiKey)return Response.json({error:"Payment verification is not configured."},{status:503});
    const rawBody=await request.text(),signature=request.headers.get("stripe-signature")||"";if(!validStripeSignature(rawBody,signature,webhookSecret))return new Response("Invalid signature",{status:400});
    let event:{type:string;data:{object:{id?:string}}};try{event=JSON.parse(rawBody) as typeof event}catch{return new Response("Invalid payload",{status:400});}
    const objectId=event.data.object.id;if(!objectId)return new Response("",{status:400});paymentId=objectId;
    if(event.type==="checkout.session.expired"){const{data:order}=await admin.from("purchases").select("id,status").eq("provider","stripe").eq("provider_reference",paymentId).maybeSingle();if(order?.status==="pending")await admin.from("purchases").update({status:"failed"}).eq("id",order.id).eq("status","pending");return new Response("",{status:200});}
    if(!["checkout.session.completed","checkout.session.async_payment_succeeded"].includes(event.type))return new Response("",{status:200});
    const response=await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(paymentId)}`,{headers:{Authorization:`Bearer ${apiKey}`},cache:"no-store"});if(!response.ok)return new Response("Unable to verify payment",{status:502});const checkout=await response.json() as StripeCheckout;
    purchaseId=checkout.metadata?.purchaseId||"";paid=checkout.payment_status==="paid";amountMinor=checkout.amount_total;currency=checkout.currency.toUpperCase();if(!purchaseId||checkout.client_reference_id!==purchaseId)return new Response("",{status:400});
  }
  if(!purchaseId)return new Response("",{status:400});
  const{data:purchase,error}=await admin.from("purchases").select("id,user_id,item_type,course_id,book_id,amount_minor,currency,status,provider,provider_reference").eq("id",purchaseId).maybeSingle() as {data:PaymentRecord|null;error:unknown};
  if(error)return new Response("Unable to load purchase",{status:500});if(!purchase||purchase.provider!==provider||(purchase.provider_reference&&purchase.provider_reference!==paymentId))return new Response("",{status:200});
  if(failed){if(purchase.status==="pending")await admin.from("purchases").update({status:"failed",provider_reference:paymentId}).eq("id",purchase.id).eq("status","pending");return new Response("",{status:200});}
  if(!paid)return new Response("",{status:200});
  if(amountMinor!==purchase.amount_minor||currency!==purchase.currency.trim().toUpperCase())return new Response("Payment does not match purchase",{status:400});
  if(purchase.status==="failed"||purchase.status==="refunded"||purchase.status==="cancelled")return new Response("",{status:200});
  const{error:updateError}=await admin.from("purchases").update({status:"paid",paid_at:new Date().toISOString(),provider_reference:paymentId}).eq("id",purchase.id).in("status",["pending","paid"]);
  if(updateError)return new Response("Unable to update purchase",{status:500});
  if(purchase.item_type==="course"&&purchase.course_id){const{error:enrollmentError}=await admin.from("enrollments").upsert({student_id:purchase.user_id,course_id:purchase.course_id,status:"active"},{onConflict:"student_id,course_id"});if(enrollmentError)return new Response("Unable to grant course access",{status:500});}
  return new Response("",{status:200});
}
