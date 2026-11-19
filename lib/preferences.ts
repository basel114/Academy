"use server";
import { cookies } from "next/headers";
export async function setPreference(form: FormData) {
  const locale = form.get("locale");
  const theme = form.get("theme");
  const jar = await cookies();
  const options = { path: "/", sameSite: "lax" as const, maxAge: 31536000 };
  if (locale === "en" || locale === "ar") jar.set("locale", locale, options);
  if (theme === "light" || theme === "dark") jar.set("theme", theme, options);
}