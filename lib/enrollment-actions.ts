"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUser, supabase } from "./supabase/server";
import type { ActionState } from "./action-state";

// Payment authorization can be added here before the enrollment write.
export async function bookCourse(slug: string): Promise<ActionState> {
  const [client, user] = await Promise.all([supabase(), currentUser()]);
  const path = `/courses/${encodeURIComponent(slug)}`;
  if (!user) redirect(`/login?next=${encodeURIComponent(path)}`);
  if (!client) return { error: "unconfigured" };
  const { data, error } = await client.from("courses").select("id").eq("slug", slug).single();
  if (error) return { error: "error" };
  const { error: bookingError } = await client.from("enrollments").upsert(
    { user_id: user.id, course_id: data.id },
    { onConflict: "user_id,course_id", ignoreDuplicates: true },
  );
  if (bookingError) return { error: "error" };
  revalidatePath(path);
  revalidatePath("/my-courses");
  return { notice: "success" };
}

export async function cancelCourse(id: string): Promise<ActionState> {
  const [client, user] = await Promise.all([supabase(), currentUser()]);
  if (!user || !client) redirect("/login?next=%2Fmy-courses");
  const { error } = await client.from("enrollments").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: "error" };
  revalidatePath("/courses/[slug]", "page");
  revalidatePath("/my-courses");
  return { notice: "cancelled" };
}