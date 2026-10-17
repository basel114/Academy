"use server";
import {z} from "zod";
import {redirect} from "next/navigation";
import {createSupabaseServerClient} from "@/lib/supabase/server";

const schema=z.object({locale:z.enum(["ar","nl","en"]),itemType:z.enum(["course","book"]),slug:z.string().min(1).max(180),provider:z.enum(["stripe","mollie"])});
function siteOrigin(){const origin=process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000";const url=new URL(origin);if(url.protocol!=="https:"&&url.hostname!=="localhost")throw new Error("NEXT_PUBLIC_SITE_URL must use HTTPS");return url.origin;}

export async function startCheckoutAction(formData:FormData){
  const input=schema.safeParse(Object.fromEntries(formData));if(!input.success)redirect("/en/courses?notice=checkout-error");
  const supabase=await createSupabaseServerClient();if(!supabase)redirect(`/${input.data.locale}/${input.data.itemType==="course"?"courses":"library"}/${input.data.slug}?notice=checkout-error`);
  const{data:{user}}=await supabase.auth.getUser();if(!user)redirect(`/${input.data.locale}/login`);
  const apiKey=input.data.provider==="stripe"?process.env.STRIPE_SECRET_KEY:process.env.MOLLIE_API_KEY;
  if(!apiKey)redirect(`/${input.data.locale}/${input.data.itemType==="course"?"courses":"library"}/${input.data.slug}?notice=payments-not-configured`);
  const{data:orders,error:orderError}=await supabase.rpc("create_pending_purchase",{p_item_type:input.data.itemType,p_slug:input.data.slug,p_provider:input.data.provider});
  const order=Array.isArray(orders)?orders[0]:orders;if(orderError||!order)redirect(`/${input.data.locale}/${input.data.itemType==="course"?"courses":"library"}/${input.data.slug}?notice=checkout-error`);
  const amount=Number(order.amount_minor),currency=String(order.currency).trim().toUpperCase();if(!Number.isInteger(amount)||amount<=0||!/^[A-Z]{3}$/.test(currency))redirect(`/${input.data.locale}/${input.data.itemType==="course"?"courses":"library"}/${input.data.slug}?notice=checkout-error`);
  const origin=siteOrigin(),successUrl=`${origin}/${input.data.locale}/checkout/success?purchase=${order.purchase_id}`,cancelUrl=`${origin}/${input.data.locale}/${input.data.itemType==="course"?"courses":"library"}/${input.data.slug}?notice=payment-cancelled`;
  let providerId="",checkoutUrl="";
  try{
    if(input.data.provider==="stripe"){
      const params=new URLSearchParams({mode:"payment",success_url:successUrl,cancel_url:cancelUrl,client_reference_id:order.purchase_id,"metadata[purchaseId]":order.purchase_id,"line_items[0][quantity]":"1","line_items[0][price_data][currency]":currency.toLowerCase(),"line_items[0][price_data][unit_amount]":String(amount),"line_items[0][price_data][product_data][name]":input.data.slug});
      const response=await fetch("https://api.stripe.com/v1/checkout/sessions",{method:"POST",headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/x-www-form-urlencoded","Idempotency-Key":order.purchase_id},body:params});
      if(!response.ok)throw new Error("Payment provider unavailable");const payload=await response.json() as {id?:string;url?:string};providerId=payload.id||"";checkoutUrl=payload.url||"";
      if(!providerId||!checkoutUrl||new URL(checkoutUrl).hostname!=="checkout.stripe.com")throw new Error("Invalid checkout response");
    }else{
      const response=await fetch("https://api.mollie.com/v2/payments",{method:"POST",headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json","Idempotency-Key":order.purchase_id},body:JSON.stringify({amount:{currency,value:(amount/100).toFixed(2)},description:`Samen Learning ${input.data.itemType} ${input.data.slug}`,redirectUrl:successUrl,cancelUrl,webhookUrl:`${origin}/api/payments/webhook/mollie`,metadata:{purchaseId:order.purchase_id}})});
      if(!response.ok)throw new Error("Payment provider unavailable");const payload=await response.json() as {id?:string;_links?:{checkout?:{href?:string}}};providerId=payload.id||"";checkoutUrl=payload._links?.checkout?.href||"";
      const checkoutHost=new URL(checkoutUrl).hostname;if(!providerId||!checkoutHost.endsWith("mollie.com"))throw new Error("Invalid checkout response");
    }
  }catch{redirect(`/${input.data.locale}/${input.data.itemType==="course"?"courses":"library"}/${input.data.slug}?notice=checkout-error`);}
  const{data:referenceSaved,error:referenceError}=await supabase.rpc("set_purchase_provider_reference",{p_purchase:order.purchase_id,p_provider:input.data.provider,p_reference:providerId});
  if(referenceError||referenceSaved!==true)redirect(`/${input.data.locale}/${input.data.itemType==="course"?"courses":"library"}/${input.data.slug}?notice=checkout-error`);
  redirect(checkoutUrl);
}
