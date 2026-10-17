import {startCheckoutAction} from "@/app/[locale]/payments/actions";

export function CheckoutButtons({locale,itemType,slug}:{locale:"ar"|"nl"|"en";itemType:"course"|"book";slug:string}){
  const providers=[...(process.env.STRIPE_SECRET_KEY?["stripe" as const]:[]),...(process.env.MOLLIE_API_KEY?["mollie" as const]:[])];if(!providers.length)return null;
  const labels={en:{stripe:"Pay securely with Stripe",mollie:"Pay securely with Mollie"},nl:{stripe:"Veilig betalen met Stripe",mollie:"Veilig betalen met Mollie"},ar:{stripe:"ادفع بأمان عبر Stripe",mollie:"ادفع بأمان عبر Mollie"}}[locale];
  return <div className="mt-4 grid gap-3">{providers.map(provider=><form action={startCheckoutAction} key={provider}><input type="hidden" name="locale" value={locale}/><input type="hidden" name="itemType" value={itemType}/><input type="hidden" name="slug" value={slug}/><input type="hidden" name="provider" value={provider}/><button className="pill pill-dark w-full justify-center">{labels[provider]}</button></form>)}</div>;
}
