-- ============================================================
-- team_members / teams の RLS 無限再帰修正
--
-- 既存ポリシー:
--   teams_select_members         : teams から team_members を select
--   team_members_select_teammates: team_members から team_members を select
-- これらが互いに team_members の RLS を再帰評価し、
-- "infinite recursion detected in policy for relation team_members" (42P17) を発生させていた。
--
-- 解決策:
--   SECURITY DEFINER 関数 is_team_member(_team_id) を導入して RLS を回避し、
--   両ポリシーを書き直す。
-- ============================================================

-- 現在ユーザーが指定チームのメンバーか
create or replace function public.is_team_member(_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.team_members
    where team_id = _team_id and user_id = auth.uid()
  );
$$;

revoke all on function public.is_team_member(uuid) from public;
grant execute on function public.is_team_member(uuid) to authenticated;

-- 既存の再帰的ポリシーを置き換える
drop policy if exists teams_select_members         on public.teams;
drop policy if exists team_members_select_teammates on public.team_members;

create policy teams_select_members
  on public.teams for select to authenticated
  using (public.is_team_member(teams.id));

create policy team_members_select_teammates
  on public.team_members for select to authenticated
  using (public.is_team_member(team_members.team_id));
