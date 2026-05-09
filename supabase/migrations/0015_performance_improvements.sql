-- ============================================================
-- 0015_performance_improvements.sql
-- 主要画面の検索条件に合わせたインデックスと集約RPC
-- ============================================================

-- team_members: 所属チーム取得・チーム内学生取得
create index if not exists team_members_user_role_idx
  on public.team_members (user_id, role_in_team);

create index if not exists team_members_team_role_user_idx
  on public.team_members (team_id, role_in_team, user_id);

-- reactions / comments: 記録詳細・最近のフィードバック
create index if not exists reactions_daily_record_created_idx
  on public.reactions (daily_record_id, created_at desc);

create index if not exists reactions_sender_created_idx
  on public.reactions (sender_id, created_at desc);

create index if not exists comments_daily_record_created_idx
  on public.comments (daily_record_id, created_at desc);

create index if not exists comments_sender_created_idx
  on public.comments (sender_id, created_at desc);

-- goals: 学生別・ステータス別一覧
create index if not exists goals_student_status_created_idx
  on public.goals (student_id, status, created_at desc);

-- contents: 公開コンテンツのロール別一覧・カテゴリ絞り込み
create index if not exists contents_published_student_idx
  on public.contents (published_at desc, category)
  where status = 'published' and for_student;

create index if not exists contents_published_parent_idx
  on public.contents (published_at desc, category)
  where status = 'published' and for_parent;

create index if not exists contents_published_coach_idx
  on public.contents (published_at desc, category)
  where status = 'published' and for_coach;

-- 監督/保護者ダッシュボード向け: 複数学生の最終記録日をDB側で集約する
create or replace function public.get_students_last_record_dates(_student_ids uuid[])
returns table(student_id uuid, last_record_date date)
language sql
stable
as $$
  select dr.student_id, max(dr.record_date) as last_record_date
  from public.daily_records dr
  where dr.student_id = any(_student_ids)
  group by dr.student_id
$$;

revoke all on function public.get_students_last_record_dates(uuid[]) from public;
grant execute on function public.get_students_last_record_dates(uuid[]) to authenticated;
