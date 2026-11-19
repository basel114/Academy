import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import { config } from "./config";

export const supabase = cache(async () => {
  const settings = config();
  if (!settings) return null;
  const jar = await cookies();
  return createServerClient(settings.url, settings.key, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll(values) {
        try {
          values.forEach(({ name, value, options }) => jar.set(name, value, options));
        } catch {
          // Server Components are read-only. The request proxy refreshes their sessions.
        }
      },
    },
  });
});

export const currentUser = cache(async () => {
  const client = await supabase();
  if (!client) return null;
  const { data } = await client.auth.getUser();
  return data.user;
});