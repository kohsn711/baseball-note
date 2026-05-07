-- ============================================================
-- 0002_rls.sql
-- Row Level Security 有効化 + ポリシー定義
-- ============================================================

-- ------------------------------------------------------------
-- ヘルパー関数
--   SECURITY DEFINER で RLS を回避し循環参照を防ぐ
-- ------------------------------------------------------------

-- 現在ユーザーのロール
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- 指定 student と現在ユーザーが同じチームに所属し、かつ現在ユーザーが coach か
create or replace function public.is_coach_of_student(_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.team_members coach_tm
    join public.team_members student_tm on coach_tm.team_id = student_tm.team_id
    where coach_tm.user_id      = auth.uid()
      and coach_tm.role_in_team = 'coach'
      and student_tm.user_id    = _student_id
      and student_tm.role_in_team = 'student'
  );
$$;

-- 指定 student と現在ユーザーが active な親子リンクで結ばれているか
create or replace function public.is_active_parent_of(_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.parent_child_links
    where parent_id  = auth.uid()
      and student_id = _student_id
      and status     = 'active'
  );
$$;

-- daily_record にアクセス可能か（本人 / coach / 親）
create or replace function public.can_access_daily_record(_daily_record_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.daily_records dr
    where dr.id = _daily_record_id
      and (
            dr.student_id = auth.uid()
        or  public.is_coach_of_student(dr.student_id)
        or  public.is_active_parent_of(dr.student_id)
      )
  );
$$;

-- daily_record の所有者か（書き込み判定用）
create or replace function public.owns_daily_record(_daily_record_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.daily_records dr
    where dr.id = _daily_record_id and dr.student_id = auth.uid()
  );
$$;

-- ============================================================
-- RLS 有効化
-- ============================================================
alter table public.profiles            enable row level security;
alter table public.teams               enable row level security;
alter table public.team_members        enable row level security;
alter table public.parent_child_links  enable row level security;
alter table public.daily_records       enable row level security;
alter table public.practice_entries    enable row level security;
alter table public.training_entries    enable row level security;
alter table public.meal_records        enable row level security;
alter table public.condition_records   enable row level security;
alter table public.injury_records      enable row level security;
alter table public.reflection_records  enable row level security;
alter table public.goals               enable row level security;
alter table public.reactions           enable row level security;
alter table public.preset_comments     enable row level security;
alter table public.comments            enable row level security;
alter table public.contents            enable row level security;
alter table public.notifications       enable row level security;

-- ============================================================
-- profiles
--   閲覧: 認証済みユーザーは display_name / role を読める
--   作成・更新: 本人のみ
-- ============================================================
create policy profiles_select_authenticated
  on public.profiles for select to authenticated using (true);

create policy profiles_insert_self
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

create policy profiles_update_self
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- ============================================================
-- teams
--   閲覧: 同チームメンバー
--   作成: coach のみ (作成者 = 自分)
--   更新: 作成者のみ
-- ============================================================
create policy teams_select_members
  on public.teams for select to authenticated
  using (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = teams.id and tm.user_id = auth.uid()
    )
  );

create policy teams_insert_coach
  on public.teams for insert to authenticated
  with check (auth.uid() = created_by and public.current_user_role() = 'coach');

create policy teams_update_owner
  on public.teams for update to authenticated
  using (auth.uid() = created_by) with check (auth.uid() = created_by);

-- ============================================================
-- team_members
--   閲覧: 同チームメンバー
--   作成: 本人 (チームコードで自身を追加)
--   削除: 本人 (脱退)
-- ============================================================
create policy team_members_select_teammates
  on public.team_members for select to authenticated
  using (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = team_members.team_id and tm.user_id = auth.uid()
    )
  );

create policy team_members_insert_self
  on public.team_members for insert to authenticated
  with check (auth.uid() = user_id);

create policy team_members_delete_self
  on public.team_members for delete to authenticated
  using (auth.uid() = user_id);

-- ============================================================
-- parent_child_links
--   閲覧: 親 or 学生本人
--   作成: 親 (status=pending)
--   更新: 学生本人 (承認 → active)
-- ============================================================
create policy pcl_select_self
  on public.parent_child_links for select to authenticated
  using (auth.uid() = parent_id or auth.uid() = student_id);

create policy pcl_insert_parent
  on public.parent_child_links for insert to authenticated
  with check (
    auth.uid() = parent_id
    and public.current_user_role() = 'parent'
    and status = 'pending'
  );

create policy pcl_update_student
  on public.parent_child_links for update to authenticated
  using (auth.uid() = student_id) with check (auth.uid() = student_id);

create policy pcl_delete_self
  on public.parent_child_links for delete to authenticated
  using (auth.uid() = parent_id or auth.uid() = student_id);

-- ============================================================
-- daily_records
--   閲覧: 本人 / coach / 親
--   作成・更新・削除: 本人のみ
-- ============================================================
create policy daily_records_select
  on public.daily_records for select to authenticated
  using (
       auth.uid() = student_id
    or public.is_coach_of_student(student_id)
    or public.is_active_parent_of(student_id)
  );

create policy daily_records_insert_self
  on public.daily_records for insert to authenticated
  with check (auth.uid() = student_id);

create policy daily_records_update_self
  on public.daily_records for update to authenticated
  using (auth.uid() = student_id) with check (auth.uid() = student_id);

create policy daily_records_delete_self
  on public.daily_records for delete to authenticated
  using (auth.uid() = student_id);

-- ============================================================
-- 子テーブル (practice / training / meal / condition / injury / reflection)
--   閲覧: 親レコードへのアクセス権を継承
--   書き込み: 親レコードの所有者のみ
-- ============================================================
do $$
declare t text;
begin
  for t in
    select unnest(array[
      'practice_entries', 'training_entries',
      'meal_records', 'condition_records',
      'injury_records', 'reflection_records'
    ])
  loop
    execute format($f$
      create policy %1$I_select on public.%1$I for select to authenticated
        using (public.can_access_daily_record(daily_record_id));
      create policy %1$I_insert on public.%1$I for insert to authenticated
        with check (public.owns_daily_record(daily_record_id));
      create policy %1$I_update on public.%1$I for update to authenticated
        using (public.owns_daily_record(daily_record_id))
        with check (public.owns_daily_record(daily_record_id));
      create policy %1$I_delete on public.%1$I for delete to authenticated
        using (public.owns_daily_record(daily_record_id));
    $f$, t);
  end loop;
end$$;

-- ============================================================
-- goals
--   閲覧: 本人 / coach
--   書き込み: 本人のみ
-- ============================================================
create policy goals_select
  on public.goals for select to authenticated
  using (auth.uid() = student_id or public.is_coach_of_student(student_id));

create policy goals_insert_self
  on public.goals for insert to authenticated
  with check (auth.uid() = student_id);

create policy goals_update_self
  on public.goals for update to authenticated
  using (auth.uid() = student_id) with check (auth.uid() = student_id);

create policy goals_delete_self
  on public.goals for delete to authenticated
  using (auth.uid() = student_id);

-- ============================================================
-- reactions
--   閲覧: 親レコードにアクセス可能なユーザー
--   作成: coach / parent (対象学生の記録に対してのみ)
--   削除: 送信者本人
-- ============================================================
create policy reactions_select
  on public.reactions for select to authenticated
  using (public.can_access_daily_record(daily_record_id));

create policy reactions_insert_coach_or_parent
  on public.reactions for insert to authenticated
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.daily_records dr
      where dr.id = reactions.daily_record_id
        and (
             public.is_coach_of_student(dr.student_id)
          or public.is_active_parent_of(dr.student_id)
        )
    )
  );

create policy reactions_delete_sender
  on public.reactions for delete to authenticated
  using (auth.uid() = sender_id);

-- ============================================================
-- preset_comments
--   閲覧: 認証ユーザー全員 (active のみ)
--   管理: admin のみ
-- ============================================================
create policy preset_comments_select_active
  on public.preset_comments for select to authenticated
  using (is_active = true);

create policy preset_comments_admin_all
  on public.preset_comments for all to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- ============================================================
-- comments (定型コメント送信履歴)
--   閲覧: 親レコードにアクセス可能なユーザー
--   作成: coach / parent
--   削除: 送信者本人
-- ============================================================
create policy comments_select
  on public.comments for select to authenticated
  using (public.can_access_daily_record(daily_record_id));

create policy comments_insert_coach_or_parent
  on public.comments for insert to authenticated
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.daily_records dr
      where dr.id = comments.daily_record_id
        and (
             public.is_coach_of_student(dr.student_id)
          or public.is_active_parent_of(dr.student_id)
        )
    )
  );

create policy comments_delete_sender
  on public.comments for delete to authenticated
  using (auth.uid() = sender_id);

-- ============================================================
-- contents (運営記事)
--   閲覧: published は全員、drafts は作成者のみ
--   管理: admin のみ
-- ============================================================
create policy contents_select_published_or_owner
  on public.contents for select to authenticated
  using (status = 'published' or created_by = auth.uid());

create policy contents_admin_all
  on public.contents for all to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- ============================================================
-- notifications
--   閲覧・更新 (既読化): 本人のみ
--   作成: 認証ユーザー (アプリ層で送信元の妥当性を担保)
--   削除: 本人のみ
-- ============================================================
create policy notifications_select_self
  on public.notifications for select to authenticated
  using (auth.uid() = user_id);

create policy notifications_update_self
  on public.notifications for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy notifications_insert_authenticated
  on public.notifications for insert to authenticated
  with check (true);

create policy notifications_delete_self
  on public.notifications for delete to authenticated
  using (auth.uid() = user_id);