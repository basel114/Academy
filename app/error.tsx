"use client";
import { useEffect, useState } from "react";
import { messages, type Locale } from "@/lib/messages";
export default function ErrorPage({ reset }: { reset: () => void }) {
  const [locale, setLocale] = useState<Locale>("en");
  useEffect(() => {
    const observer = new MutationObserver(() => setLocale(document.documentElement.lang === "ar" ? "ar" : "en"));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    const frame = requestAnimationFrame(() => setLocale(document.documentElement.lang === "ar" ? "ar" : "en"));
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, []);
  const t = messages[locale];
  return <section className="wrap section page"><div className="empty"><h1>{t.error}</h1><button className="button primary" onClick={reset}>{t.retry}</button></div></section>;
}