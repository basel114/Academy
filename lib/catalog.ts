import { cache } from "react";
import demo from "./demo.json";
import { supabase } from "./supabase/server";

export type Category = typeof demo.categories[number];
export type Course = typeof demo.courses[number] & { id?: string };

export const getCatalog = cache(async (): Promise<{ courses: Course[]; categories: Category[] }> => {
  const client = await supabase();
  if (!client) return demo;
  const [courses, categories] = await Promise.all([
    client.from("courses").select("*").order("title"),
    client.from("categories").select("*").order("name"),
  ]);
  if (courses.error || categories.error) throw new Error("Catalog unavailable");
  return { courses: courses.data, categories: categories.data };
});