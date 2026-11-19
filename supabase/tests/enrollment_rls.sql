-- Run as the database owner after the migration and seed.
-- Fixtures and all changes are rolled back.
begin;
insert into auth.users (id, email, raw_user_meta_data) values
  ('73251506-97dd-4c93-8399-79547d1fe001', 'basel-rls-a@example.invalid', '{"full_name":"Learner A"}'),
  ('73251506-97dd-4c93-8399-79547d1fe002', 'basel-rls-b@example.invalid', '{"full_name":"Learner B"}');

set local role authenticated;
select set_config('request.jwt.claim.sub', '73251506-97dd-4c93-8399-79547d1fe001', true);
insert into public.enrollments (user_id, course_id)
select auth.uid(), id from public.courses where slug = 'ai-essentials';

do $$
begin
  if (select count(*) from public.enrollments) <> 1 then
    raise exception 'Learner A cannot read own booking or can read third-party data';
  end if;
  if (select full_name from public.profiles where id = auth.uid()) is distinct from 'Learner A' then
    raise exception 'Profile trigger did not create the profile';
  end if;
  begin
    insert into public.enrollments (user_id, course_id)
    select auth.uid(), id from public.courses where slug = 'ai-essentials';
    raise exception 'Duplicate enrollment was accepted';
  exception when unique_violation then null;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', '73251506-97dd-4c93-8399-79547d1fe002', true);
do $$
declare
  other_user uuid := '73251506-97dd-4c93-8399-79547d1fe001';
  course uuid := (select id from public.courses where slug = 'ai-essentials');
begin
  if exists (select 1 from public.enrollments where user_id = other_user) then
    raise exception 'Cross-account select succeeded';
  end if;
  update public.enrollments set status = 'enrolled' where user_id = other_user;
  if found then raise exception 'Cross-account update succeeded'; end if;
  delete from public.enrollments where user_id = other_user;
  if found then raise exception 'Cross-account delete succeeded'; end if;
  begin
    insert into public.enrollments (user_id, course_id) values (other_user, course);
    raise exception 'Cross-account insert succeeded';
  exception when insufficient_privilege then null;
  end;

  insert into public.enrollments (user_id, course_id) values (auth.uid(), course);
  begin
    update public.enrollments set user_id = other_user where user_id = auth.uid();
    raise exception 'Cross-account ownership transfer succeeded';
  exception when insufficient_privilege then null;
  end;
  delete from public.enrollments where user_id = auth.uid();
  if not found then raise exception 'Learner B could not cancel own booking'; end if;
end;
$$;

select set_config('request.jwt.claim.sub', '73251506-97dd-4c93-8399-79547d1fe001', true);
do $$
begin
  if not exists (select 1 from public.enrollments where user_id = auth.uid()) then
    raise exception 'Learner A booking is missing after Learner B actions';
  end if;
end;
$$;

reset role;
rollback;
