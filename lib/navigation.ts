export function safeNext(value: unknown, fallback = "/my-courses") {
  if (typeof value !== "string" || !value.startsWith("/") || value.includes("\\") || Array.from(value).some(character => character.charCodeAt(0) < 32)) return fallback;
  const origin = "https://academy.invalid";
  try {
    const url = new URL(value, origin);
    const authPages = ["/login", "/signup", "/forgot-password", "/auth/confirm"];
    if (url.origin !== origin || url.pathname.startsWith("//") || authPages.includes(url.pathname.replace(/\/$/, ""))) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
