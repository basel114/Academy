import { cookies } from "next/headers";
import type { Locale } from "./messages";
export const getLocale = async (): Promise<Locale> => (await cookies()).get("locale")?.value === "ar" ? "ar" : "en";
export const getTheme = async () => (await cookies()).get("theme")?.value === "dark" ? "dark" : "light";
