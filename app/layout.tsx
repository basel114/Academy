import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/cairo";
import "./globals.css";
import { getLocale, getTheme } from "@/lib/i18n";
import { messages } from "@/lib/messages";
import { Footer, Navbar } from "@/components/Shell";

export const metadata: Metadata = {
  title: { default: "Basel Academy", template: "%s | Basel Academy" },
  description: "Practical courses in technology, design, and languages.",
  icons: { icon: "/favicon.svg" },
};

export default async function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [locale, theme] = await Promise.all([getLocale(), getTheme()]);
  return <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className={theme}>
    <body>
      <a className="skip" href="#main">{messages[locale].skip}</a>
      <Navbar locale={locale} theme={theme}/>
      <main id="main">{children}</main>
      <Footer locale={locale}/>
    </body>
  </html>;
}