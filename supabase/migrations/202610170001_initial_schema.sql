-- Samen Learning MVP schema. Apply with `supabase db push` after linking a project.
create extension if not exists pgcrypto;
create schema if not exists app_private;

create type public.app_role as enum ('student','instructor','admin');
create type public.course_type as enum ('recorded','live');
create type public.order_status as enum ('pending','paid','failed','refunded','cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '', role public.app_role not null default 'student',
  preferred_locale text not null default 'en' check (preferred_locale in ('ar','nl','en')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create function app_private.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'::public.app_role);
$$;
revoke all on function app_private.is_admin() from public;
grant usage on schema app_private to authenticated;
grant execute on function app_private.is_admin() to authenticated;
create function public.protect_profile_role() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 -- A trusted SQL Editor operator can bootstrap the first administrator; signed-in users cannot self-promote.
 if new.role is distinct from old.role and (select auth.uid()) is not null and not app_private.is_admin() then raise exception 'Only an administrator can change account roles'; end if;
 new.updated_at=now(); return new;
end; $$;
create trigger profiles_role_guard before update on public.profiles for each row execute function public.protect_profile_role();
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin insert into public.profiles(id,full_name) values(new.id,coalesce(new.raw_user_meta_data->>'full_name','')); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.instructor_profiles (
 user_id uuid primary key references public.profiles(id) on delete cascade, bio text not null default '',
 photo_path text, public_name text not null, created_at timestamptz not null default now()
);
create table public.courses (
 id uuid primary key default gen_random_uuid(), slug text unique not null, instructor_id uuid references public.instructor_profiles(user_id) on delete set null,
 course_type public.course_type not null default 'recorded', category text not null check(category in ('arabic_for_dutch_speakers','parenting_child_development','language_learning','free_courses')),
 level text not null default 'all', price_minor integer not null default 0 check(price_minor>=0), currency char(3) not null default 'EUR',
 thumbnail_path text, is_published boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.course_translations (
 course_id uuid not null references public.courses(id) on delete cascade, locale text not null check(locale in ('ar','nl','en')),
 title text not null, description text not null default '', primary key(course_id,locale)
);
create table public.lessons (
 id uuid primary key default gen_random_uuid(), course_id uuid not null references public.courses(id) on delete cascade,
 sort_order integer not null, video_url text, duration_seconds integer check(duration_seconds>=0), is_preview boolean not null default false,
 created_at timestamptz not null default now(), unique(course_id,sort_order)
);
create table public.lesson_translations (
 lesson_id uuid not null references public.lessons(id) on delete cascade, locale text not null check(locale in ('ar','nl','en')),
 title text not null, body text not null default '', primary key(lesson_id,locale)
);
create table public.enrollments (
 id uuid primary key default gen_random_uuid(), student_id uuid not null references public.profiles(id) on delete cascade,
 course_id uuid not null references public.courses(id) on delete cascade, status text not null default 'active' check(status in ('active','completed','cancelled')),
 enrolled_at timestamptz not null default now(), unique(student_id,course_id)
);
create table public.lesson_progress (
 student_id uuid not null references public.profiles(id) on delete cascade, lesson_id uuid not null references public.lessons(id) on delete cascade,
 completed_at timestamptz, updated_at timestamptz not null default now(), primary key(student_id,lesson_id)
);
create table public.live_sessions (
 id uuid primary key default gen_random_uuid(), course_id uuid not null references public.courses(id) on delete cascade,
 starts_at timestamptz not null, timezone text not null default 'Europe/Amsterdam', capacity integer not null check(capacity>0),
 cancellation_deadline timestamptz, created_at timestamptz not null default now()
);
create table public.live_session_private (
 session_id uuid primary key references public.live_sessions(id) on delete cascade,
 meeting_url text not null check(meeting_url ~* '^https://'), created_at timestamptz not null default now()
);
create table public.bookings (
 id uuid primary key default gen_random_uuid(), session_id uuid not null references public.live_sessions(id) on delete cascade,
 student_id uuid not null references public.profiles(id) on delete cascade,
 status text not null default 'booked' check(status in ('booked','cancelled','attended','no_show')),
 created_at timestamptz not null default now(), unique(session_id,student_id)
);
create function public.book_live_session(p_session uuid) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_user uuid:=(select auth.uid()); v_capacity integer; v_starts_at timestamptz; v_price integer; v_booking uuid;
begin
 if v_user is null then raise exception 'Authentication required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_session::text,10));
 select s.capacity,s.starts_at,c.price_minor into v_capacity,v_starts_at,v_price from public.live_sessions s join public.courses c on c.id=s.course_id where s.id=p_session and c.is_published;
 if not found or v_starts_at<=now() then raise exception 'Session is unavailable'; end if;
 if v_price>0 and not exists(select 1 from public.purchases p join public.live_sessions s on s.course_id=p.course_id where s.id=p_session and p.user_id=v_user and p.status='paid') then raise exception 'Verified purchase required'; end if;
 select b.id into v_booking from public.bookings b where b.session_id=p_session and b.student_id=v_user and b.status<>'cancelled';
 if v_booking is not null then return v_booking; end if;
 if (select count(*) from public.bookings b where b.session_id=p_session and b.status<>'cancelled')>=v_capacity then raise exception 'Session is full'; end if;
 insert into public.bookings(session_id,student_id,status) values(p_session,v_user,'booked') on conflict(session_id,student_id) do update set status='booked' where public.bookings.status='cancelled' returning id into v_booking;
 return v_booking;
end; $$;
create function public.cancel_live_booking(p_session uuid) returns boolean language plpgsql security definer set search_path = '' as $$
declare v_user uuid:=(select auth.uid()); v_deadline timestamptz;
begin
 if v_user is null then raise exception 'Authentication required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_session::text,10));
 select s.cancellation_deadline into v_deadline from public.live_sessions s where s.id=p_session and s.starts_at>now();
 if not found or (v_deadline is not null and now()>v_deadline) then raise exception 'Cancellation deadline passed'; end if;
 update public.bookings set status='cancelled' where session_id=p_session and student_id=v_user and status='booked';
 return found;
end; $$;
create function public.get_live_meeting_link(p_session uuid) returns text language plpgsql stable security definer set search_path = '' as $$
declare v_user uuid:=(select auth.uid()); v_url text;
begin
 if v_user is null then return null; end if;
 select d.meeting_url into v_url from public.live_session_private d where d.session_id=p_session and (
  app_private.is_admin() or exists(select 1 from public.bookings b where b.session_id=p_session and b.student_id=v_user and b.status in ('booked','attended'))
 );
 return v_url;
end; $$;
revoke all on function public.book_live_session(uuid) from public;
revoke all on function public.cancel_live_booking(uuid) from public;
revoke all on function public.get_live_meeting_link(uuid) from public;
grant execute on function public.book_live_session(uuid) to authenticated;
grant execute on function public.cancel_live_booking(uuid) to authenticated;
grant execute on function public.get_live_meeting_link(uuid) to authenticated;
create table public.books (
 id uuid primary key default gen_random_uuid(), slug text unique not null, author text not null default '', category text not null default 'general',
 file_path text, preview_path text, price_minor integer not null default 0 check(price_minor>=0), currency char(3) not null default 'EUR',
 is_published boolean not null default false, created_at timestamptz not null default now()
);
create table public.book_translations (
 book_id uuid not null references public.books(id) on delete cascade, locale text not null check(locale in ('ar','nl','en')),
 title text not null, description text not null default '', primary key(book_id,locale)
);
create table public.purchases (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
 item_type text not null check(item_type in ('course','book')), course_id uuid references public.courses(id), book_id uuid references public.books(id),
 amount_minor integer not null check(amount_minor>=0), currency char(3) not null default 'EUR', status public.order_status not null default 'pending',
 provider text check(provider in ('stripe','mollie')), provider_reference text, paid_at timestamptz, created_at timestamptz not null default now(),
 check ((item_type='course' and course_id is not null and book_id is null) or (item_type='book' and book_id is not null and course_id is null)),
 unique(provider,provider_reference)
);
create function public.create_pending_purchase(p_item_type text,p_slug text,p_provider text) returns table(purchase_id uuid,amount_minor integer,currency char(3)) language plpgsql security definer set search_path = '' as $$
declare v_user uuid:=(select auth.uid()); v_item uuid; v_amount integer; v_currency char(3); v_purchase uuid;
begin
 if v_user is null then raise exception 'Authentication required'; end if;
 if p_provider not in ('stripe','mollie') then raise exception 'Unsupported payment provider'; end if;
 if p_item_type='course' then
  select c.id,c.price_minor,c.currency into v_item,v_amount,v_currency from public.courses c where c.slug=p_slug and c.is_published;
 elsif p_item_type='book' then
  select b.id,b.price_minor,b.currency into v_item,v_amount,v_currency from public.books b where b.slug=p_slug and b.is_published;
 else raise exception 'Unsupported item type'; end if;
 if not found or v_amount is null or v_amount<=0 then raise exception 'Item is unavailable for purchase'; end if;
 perform pg_advisory_xact_lock(hashtextextended(v_user::text||':'||p_item_type||':'||p_slug,11));
 if p_item_type='course' then select p.id into v_purchase from public.purchases p where p.user_id=v_user and p.course_id=v_item and p.provider=p_provider and p.provider_reference is null and p.status='pending' order by p.created_at desc limit 1;
 else select p.id into v_purchase from public.purchases p where p.user_id=v_user and p.book_id=v_item and p.provider=p_provider and p.provider_reference is null and p.status='pending' order by p.created_at desc limit 1; end if;
 if v_purchase is null then
  insert into public.purchases(user_id,item_type,course_id,book_id,amount_minor,currency,provider,status)
  values(v_user,p_item_type,case when p_item_type='course' then v_item end,case when p_item_type='book' then v_item end,v_amount,v_currency,p_provider,'pending') returning id into v_purchase;
 end if;
 return query select v_purchase,v_amount,v_currency;
end; $$;
create function public.set_purchase_provider_reference(p_purchase uuid,p_provider text,p_reference text) returns boolean language plpgsql security definer set search_path = '' as $$
declare v_user uuid:=(select auth.uid()); v_updated integer;
begin
 if v_user is null or p_provider not in ('stripe','mollie') or length(p_reference)>200 then return false; end if;
 update public.purchases set provider=p_provider,provider_reference=p_reference where id=p_purchase and user_id=v_user and status='pending' and (provider_reference is null or provider_reference=p_reference);
 get diagnostics v_updated = row_count;
 return v_updated=1;
end; $$;
revoke all on function public.create_pending_purchase(text,text,text) from public;
revoke all on function public.set_purchase_provider_reference(uuid,text,text) from public;
grant execute on function public.create_pending_purchase(text,text,text) to authenticated;
grant execute on function public.set_purchase_provider_reference(uuid,text,text) to authenticated;
create table public.refund_requests (
 id uuid primary key default gen_random_uuid(), purchase_id uuid not null references public.purchases(id), user_id uuid not null references public.profiles(id),
 reason text not null check(length(reason) between 10 and 2000), status text not null default 'requested' check(status in ('requested','approved','rejected','processed')),
 provider_refund_id text, reviewed_by uuid references public.profiles(id), reviewed_at timestamptz, created_at timestamptz not null default now()
);
create function public.finalize_verified_refund(p_refund_id uuid,p_provider_refund_id text) returns boolean language plpgsql security definer set search_path = '' as $$
declare v_purchase public.purchases%rowtype; v_uid uuid:=(select auth.uid());
begin
 if v_uid is null or not app_private.is_admin() or p_provider_refund_id is null then return false; end if;
 select p.* into v_purchase from public.purchases p join public.refund_requests r on r.purchase_id=p.id where r.id=p_refund_id and r.status in ('requested','approved') and p.status='paid' for update of p;
 if not found then return false; end if;
 update public.purchases set status='refunded' where id=v_purchase.id and status='paid';
 if v_purchase.item_type='course' and v_purchase.course_id is not null then
  update public.enrollments set status='cancelled' where student_id=v_purchase.user_id and course_id=v_purchase.course_id;
  update public.bookings set status='cancelled' where student_id=v_purchase.user_id and status='booked' and session_id in(select s.id from public.live_sessions s where s.course_id=v_purchase.course_id);
 end if;
 update public.refund_requests set status='processed',provider_refund_id=p_provider_refund_id,reviewed_by=v_uid,reviewed_at=now() where id=p_refund_id and status in ('requested','approved');
 return true;
end; $$;
revoke all on function public.finalize_verified_refund(uuid,text) from public;
grant execute on function public.finalize_verified_refund(uuid,text) to authenticated;
create table public.reviews (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
 course_id uuid not null references public.courses(id) on delete cascade, rating smallint not null check(rating between 1 and 5), body text not null default '', is_published boolean not null default false, created_at timestamptz not null default now(), unique(user_id,course_id)
);
create table public.newsletter_subscribers (
 id uuid primary key default gen_random_uuid(), email text unique not null check(email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
 locale text not null default 'en' check(locale in ('ar','nl','en')), confirmed_at timestamptz, created_at timestamptz not null default now()
);
create table public.blog_posts (
 id uuid primary key default gen_random_uuid(), slug text unique not null, author_id uuid references public.profiles(id) on delete set null,
 is_published boolean not null default false, published_at timestamptz, created_at timestamptz not null default now()
);
create table public.blog_post_translations (
 post_id uuid not null references public.blog_posts(id) on delete cascade, locale text not null check(locale in ('ar','nl','en')),
 title text not null, excerpt text not null default '', body text not null default '', primary key(post_id,locale)
);

create index courses_published_idx on public.courses(is_published,category);
create index lessons_course_order_idx on public.lessons(course_id,sort_order);
create index enrollments_student_idx on public.enrollments(student_id,status);
create index sessions_start_idx on public.live_sessions(starts_at);
create index bookings_student_idx on public.bookings(student_id,status);
create index purchases_user_status_idx on public.purchases(user_id,status);
create index reviews_course_published_idx on public.reviews(course_id,is_published);
create index blog_posts_published_idx on public.blog_posts(is_published,published_at desc);

-- All exposed tables use RLS. Public access is limited to published catalog content.
do $$ declare t text; begin foreach t in array array['profiles','instructor_profiles','courses','course_translations','lessons','lesson_translations','enrollments','lesson_progress','live_sessions','live_session_private','bookings','books','book_translations','purchases','refund_requests','reviews','newsletter_subscribers','blog_posts','blog_post_translations'] loop execute format('alter table public.%I enable row level security',t); end loop; end $$;
create policy profiles_read_self on public.profiles for select to authenticated using(id=(select auth.uid()) or app_private.is_admin());
create policy profiles_update_self on public.profiles for update to authenticated using(id=(select auth.uid()) or app_private.is_admin()) with check(id=(select auth.uid()) or app_private.is_admin());
create policy instructor_public on public.instructor_profiles for select to anon,authenticated using(exists(select 1 from public.courses c where c.instructor_id=user_id and c.is_published));
create policy instructor_admin on public.instructor_profiles for all to authenticated using(app_private.is_admin()) with check(app_private.is_admin());
create policy courses_public_read on public.courses for select to anon,authenticated using(is_published or app_private.is_admin());
create policy courses_admin_manage on public.courses for all to authenticated using(app_private.is_admin()) with check(app_private.is_admin());
create policy course_translations_read on public.course_translations for select to anon,authenticated using(exists(select 1 from public.courses c where c.id=course_id and (c.is_published or app_private.is_admin())));
create policy course_translations_admin on public.course_translations for all to authenticated using(app_private.is_admin()) with check(app_private.is_admin());
create policy lessons_public_preview on public.lessons for select to anon,authenticated using((is_preview and exists(select 1 from public.courses c where c.id=lessons.course_id and c.is_published)) or app_private.is_admin() or exists(select 1 from public.enrollments e where e.course_id=lessons.course_id and e.student_id=(select auth.uid()) and e.status='active'));
create policy lessons_instructors on public.lessons for all to authenticated using(app_private.is_admin() or exists(select 1 from public.courses c where c.id=course_id and c.instructor_id=(select auth.uid()))) with check(app_private.is_admin() or exists(select 1 from public.courses c where c.id=course_id and c.instructor_id=(select auth.uid())));
create policy lesson_translations_read on public.lesson_translations for select to anon,authenticated using(exists(select 1 from public.lessons l join public.courses c on c.id=l.course_id where l.id=lesson_id and ((l.is_preview and c.is_published) or app_private.is_admin() or exists(select 1 from public.enrollments e where e.course_id=l.course_id and e.student_id=(select auth.uid()) and e.status='active'))));
create policy lesson_translations_admin on public.lesson_translations for all to authenticated using(app_private.is_admin()) with check(app_private.is_admin());
create policy enrollments_read_own on public.enrollments for select to authenticated using(student_id=(select auth.uid()) or app_private.is_admin());
create policy enroll_free_course on public.enrollments for insert to authenticated with check(student_id=(select auth.uid()) and exists(select 1 from public.courses c where c.id=course_id and c.is_published and c.price_minor=0));
create policy enrollments_admin on public.enrollments for all to authenticated using(app_private.is_admin()) with check(app_private.is_admin());
create policy progress_own on public.lesson_progress for select to authenticated using(student_id=(select auth.uid()) or app_private.is_admin());
create policy progress_update_own on public.lesson_progress for insert to authenticated with check(student_id=(select auth.uid()) and exists(select 1 from public.lessons l join public.enrollments e on e.course_id=l.course_id where l.id=lesson_id and e.student_id=(select auth.uid()) and e.status='active'));
create policy progress_modify_own on public.lesson_progress for update to authenticated using(student_id=(select auth.uid())) with check(student_id=(select auth.uid()));
create policy progress_delete_own on public.lesson_progress for delete to authenticated using(student_id=(select auth.uid()));
create policy sessions_public_read on public.live_sessions for select to anon,authenticated using(exists(select 1 from public.courses c where c.id=course_id and c.is_published));
create policy sessions_admin_manage on public.live_sessions for all to authenticated using(app_private.is_admin()) with check(app_private.is_admin());
create policy session_private_authorized_read on public.live_session_private for select to authenticated using(app_private.is_admin() or exists(select 1 from public.bookings b where b.session_id=live_session_private.session_id and b.student_id=(select auth.uid()) and b.status in ('booked','attended')));
create policy session_private_admin_manage on public.live_session_private for all to authenticated using(app_private.is_admin()) with check(app_private.is_admin());
create policy bookings_read_own on public.bookings for select to authenticated using(student_id=(select auth.uid()) or app_private.is_admin());
-- Student bookings and cancellations go through capacity-checked security-definer functions above.
create policy bookings_admin on public.bookings for all to authenticated using(app_private.is_admin()) with check(app_private.is_admin());
create policy books_public_read on public.books for select to anon,authenticated using(is_published or app_private.is_admin());
create policy books_admin_manage on public.books for all to authenticated using(app_private.is_admin()) with check(app_private.is_admin());
create policy book_translations_read on public.book_translations for select to anon,authenticated using(exists(select 1 from public.books b where b.id=book_id and (b.is_published or app_private.is_admin())));
create policy book_translations_admin on public.book_translations for all to authenticated using(app_private.is_admin()) with check(app_private.is_admin());
create policy purchases_read_own on public.purchases for select to authenticated using(user_id=(select auth.uid()) or app_private.is_admin());
create policy purchases_admin on public.purchases for all to authenticated using(app_private.is_admin()) with check(app_private.is_admin());
create policy refund_requests_read_own on public.refund_requests for select to authenticated using(user_id=(select auth.uid()) or app_private.is_admin());
create policy refund_requests_own on public.refund_requests for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.purchases p where p.id=purchase_id and p.user_id=(select auth.uid()) and p.status='paid'));
create policy refund_requests_admin on public.refund_requests for update to authenticated using(app_private.is_admin()) with check(app_private.is_admin());
create policy reviews_public_read on public.reviews for select to anon,authenticated using(is_published or user_id=(select auth.uid()) or app_private.is_admin());
create policy reviews_write_enrolled on public.reviews for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.enrollments e where e.student_id=(select auth.uid()) and e.course_id=reviews.course_id and e.status in ('active','completed')));
create policy reviews_admin_manage on public.reviews for all to authenticated using(app_private.is_admin()) with check(app_private.is_admin());
create policy newsletter_subscribe on public.newsletter_subscribers for insert to anon,authenticated with check(true);
create policy newsletter_admin_read on public.newsletter_subscribers for select to authenticated using(app_private.is_admin());
create policy blog_public_read on public.blog_posts for select to anon,authenticated using(is_published or app_private.is_admin());
create policy blog_admin_manage on public.blog_posts for all to authenticated using(app_private.is_admin()) with check(app_private.is_admin());
create policy blog_translation_read on public.blog_post_translations for select to anon,authenticated using(exists(select 1 from public.blog_posts b where b.id=post_id and (b.is_published or app_private.is_admin())));
create policy blog_translation_admin on public.blog_post_translations for all to authenticated using(app_private.is_admin()) with check(app_private.is_admin());

-- The books bucket is private. Do not create public SELECT policies for paid source files.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('library-private','library-private',false,52428800,array['application/pdf','application/epub+zip']) on conflict(id) do nothing;
create policy library_files_admin_upload on storage.objects for insert to authenticated with check(bucket_id='library-private' and app_private.is_admin());
create policy library_files_admin_read on storage.objects for select to authenticated using(bucket_id='library-private' and app_private.is_admin());
create policy library_files_entitled_read on storage.objects for select to authenticated using(
 bucket_id='library-private' and exists(
  select 1 from public.books b where b.file_path=name and b.is_published and (
   b.price_minor=0 or exists(select 1 from public.purchases p where p.book_id=b.id and p.user_id=(select auth.uid()) and p.status='paid')
  )
 )
);
