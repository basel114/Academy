import en from "@/locales/en.json";
import ar from "@/locales/ar.json";
export type Locale = "en" | "ar";
export const messages = { en, ar };
export type Message = keyof typeof en;
export const formatPrice = (price: number, locale: Locale) => new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(price);
