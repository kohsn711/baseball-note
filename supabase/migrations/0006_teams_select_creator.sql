-- ============================================================
-- teams_select_creator
--   作成者は自分が作成した teams 行を常に閲覧できる。
--   既存の teams_select_members（同チームメンバー）と OR 結合され、
--   どちらかに該当すれば SELECT 可能になる。
--
--   このポリシーがないと、teams への INSERT 直後の returning row が
--   RLS でブロックされ、Supabase クライアントの insert(...).select().single()
--   が PGRST116 を返してチーム作成が失敗する。
-- ============================================================
create policy teams_select_creator
  on public.teams for select to authenticated
  using (auth.uid() = created_by);
