import {I18nProvider} from "@/i18n/provider";
import {notFound} from "next/navigation";
import {routing} from "@/i18n/routing";
export function generateStaticParams(){return routing.locales.map((locale: (typeof routing.locales)[number])=>({locale}));}
export default async function LocaleLayout({children,params}:{children:React.ReactNode;params:Promise<{locale:string}>}){const {locale}=await params;if(!routing.locales.includes(locale as "ar"|"nl"|"en"))notFound();return <I18nProvider locale={locale as "ar"|"nl"|"en"}><div lang={locale} dir={locale==="ar"?"rtl":"ltr"}>{children}</div></I18nProvider>;}
