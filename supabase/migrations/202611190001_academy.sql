begin;
create table public.categories (
  id text primary key,
  name text not null,
  name_ar text not null
);
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  title_ar text not null,
  description text not null,
  description_ar text not null,
  category_id text not null references public.categories(id),
  instructor_name text not null,
  instructor_name_ar text not null,
  level text not null check (level in ('beginner', 'intermediate', 'advanced')),
  duration_hours integer not null check (duration_hours > 0),
  price numeric(10,2) not null check (price >= 0),
  cover_image text not null,
  curriculum jsonb not null check (jsonb_typeof(curriculum) = 'array'),
  curriculum_ar jsonb not null check (jsonb_typeof(curriculum_ar) = 'array'),
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  status text not null default 'enrolled' check (status = 'enrolled'),
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);
alter table public.categories enable row level security;
alter table public.courses enable row level security;
alter table public.profiles enable row level security;
alter table public.enrollments enable row level security;
revoke all on public.categories, public.courses, public.profiles, public.enrollments from anon, authenticated;
grant select on public.categories, public.courses to anon, authenticated;
grant select, insert, update, delete on public.profiles, public.enrollments to authenticated;
create policy "Public categories" on public.categories for select to anon, authenticated using (true);
create policy "Public courses" on public.courses for select to anon, authenticated using (true);
create policy "Own profile" on public.profiles for all to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "Own enrollments" on public.enrollments for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create function public.create_academy_profile()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;
revoke all on function public.create_academy_profile() from public;
create trigger create_academy_profile after insert on auth.users
for each row execute function public.create_academy_profile();
commit;
