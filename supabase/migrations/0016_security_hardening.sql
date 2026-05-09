-- ============================================================
-- 0016_security_hardening.sql
-- 権限昇格・不正所属・通知なりすましの防止
-- ============================================================

-- ------------------------------------------------------------
-- profiles helpers / policies
-- ------------------------------------------------------------

create or replace function public.can_claim_parent_role()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.parent_child_links pcl
    where pcl.status = 'pending'
      and pcl.parent_id is null
      and lower(pcl.invited_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function public.can_access_profile(_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select
       auth.uid() = _profile_id
    or public.current_user_role() = 'admin'
    or exists (
      select 1
      from public.team_members self_tm
      join public.team_members other_tm on self_tm.team_id = other_tm.team_id
      where self_tm.user_id = auth.uid()
        and other_tm.user_id = _profile_id
    )
    or exists (
      select 1
      from public.parent_child_links pcl
      where pcl.parent_id = auth.uid()
        and pcl.student_id = _profile_id
        and pcl.status in ('pending', 'active')
    )
    or exists (
      select 1
      from public.parent_child_links pcl
      where pcl.student_id = auth.uid()
        and pcl.parent_id = _profile_id
        and pcl.status in ('pending', 'active')
    )
    or exists (
      select 1
      from public.parent_child_links pcl
      where pcl.student_id = _profile_id
        and pcl.parent_id is null
        and pcl.status = 'pending'
        and lower(pcl.invited_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    );
$$;

create or replace function public.prevent_profile_role_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    raise exception 'profile_role_change_not_allowed' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_role_change on public.profiles;
create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_profile_role_change();

drop policy if exists profiles_select_authenticated on public.profiles;
drop policy if exists profiles_insert_self on public.profiles;
drop policy if exists profiles_update_self on public.profiles;

create policy profiles_select_related
  on public.profiles for select to authenticated
  using (public.can_access_profile(id));

create policy profiles_insert_self
  on public.profiles for insert to authenticated
  with check (
    auth.uid() = id
    and (
      role in ('student', 'coach')
      or (role = 'parent' and public.can_claim_parent_role())
    )
  );

create policy profiles_update_self
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ------------------------------------------------------------
-- team members hardening
-- ------------------------------------------------------------

create or replace function public.can_insert_coach_team_member(_team_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.uid() = _user_id
    and public.current_user_role() = 'coach'
    and exists (
      select 1
      from public.teams t
      where t.id = _team_id
        and t.created_by = auth.uid()
    );
$$;

create or replace function public.find_team_by_code(_team_code text)
returns table(id uuid, name text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if public.current_user_role() is distinct from 'student' then
    raise exception 'only_students_can_find_team_by_code' using errcode = '42501';
  end if;

  return query
    select t.id, t.name
    from public.teams t
    where t.team_code = _team_code
    limit 1;
end;
$$;

create or replace function public.join_team_by_code(_team_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  team_row public.teams%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if public.current_user_role() is distinct from 'student' then
    raise exception 'only_students_can_join_team' using errcode = '42501';
  end if;

  select *
    into team_row
  from public.teams
  where team_code = _team_code
  limit 1;

  if team_row.id is null then
    raise exception 'team_not_found' using errcode = 'P0002';
  end if;

  insert into public.team_members (team_id, user_id, role_in_team)
  values (team_row.id, auth.uid(), 'student');

  return team_row.id;
end;
$$;

revoke all on function public.join_team_by_code(text) from public;
grant execute on function public.join_team_by_code(text) to authenticated;

drop policy if exists team_members_insert_self on public.team_members;

create policy team_members_insert_coach_self
  on public.team_members for insert to authenticated
  with check (
    role_in_team = 'coach'
    and public.can_insert_coach_team_member(team_id, user_id)
  );

-- ------------------------------------------------------------
-- contents select hardening
-- ------------------------------------------------------------

drop policy if exists contents_select_published_or_owner on public.contents;

create policy contents_select_published_or_owner
  on public.contents for select to authenticated
  using (
       created_by = auth.uid()
    or (
      status = 'published'
      and (
           (public.current_user_role() = 'student' and for_student)
        or (public.current_user_role() = 'parent' and for_parent)
        or (public.current_user_role() = 'coach' and for_coach)
        or  public.current_user_role() = 'admin'
      )
    )
  );

-- ------------------------------------------------------------
-- notifications hardening
-- ------------------------------------------------------------

create or replace function public.create_feedback_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  student_id uuid;
  sender_name text;
  notify_title text;
  notify_body text;
begin
  select dr.student_id
    into student_id
  from public.daily_records dr
  where dr.id = new.daily_record_id;

  if student_id is null or student_id = new.sender_id then
    return new;
  end if;

  select p.display_name
    into sender_name
  from public.profiles p
  where p.id = new.sender_id;

  if tg_table_name = 'reactions' then
    notify_title := coalesce(nullif(sender_name, ''), '応援者') || 'さんからリアクションが届きました';
    notify_body := new.emoji;
  elsif tg_table_name = 'comments' then
    notify_title := coalesce(nullif(sender_name, ''), '応援者') || 'さんからコメントが届きました';
    notify_body := new.text;
  else
    return new;
  end if;

  insert into public.notifications (
    user_id,
    type,
    title,
    body,
    related_record_id
  ) values (
    student_id,
    case
      when tg_table_name = 'reactions' then 'reaction'
      when tg_table_name = 'comments' then 'comment'
      else tg_table_name
    end,
    notify_title,
    notify_body,
    new.daily_record_id
  );

  return new;
end;
$$;

drop trigger if exists reactions_create_feedback_notification on public.reactions;
create trigger reactions_create_feedback_notification
  after insert on public.reactions
  for each row execute function public.create_feedback_notification();

drop trigger if exists comments_create_feedback_notification on public.comments;
create trigger comments_create_feedback_notification
  after insert on public.comments
  for each row execute function public.create_feedback_notification();

drop policy if exists notifications_insert_authenticated on public.notifications;
