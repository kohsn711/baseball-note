-- ============================================================
-- find_team_by_code
--   学生がチームコードで teams.id を引くための SECURITY DEFINER 関数。
--   teams の select RLS は「同チームメンバーのみ」のため、
--   未参加の学生は通常クエリで teams を引けない。
--   コードに完全一致した1件の id, name のみ返す。
-- ============================================================
create or replace function public.find_team_by_code(_team_code text)
returns table(id uuid, name text)
language sql
stable
security definer
set search_path = public
as $$
  select id, name
  from public.teams
  where team_code = _team_code
  limit 1;
$$;

revoke all on function public.find_team_by_code(text) from public;
grant execute on function public.find_team_by_code(text) to authenticated;
