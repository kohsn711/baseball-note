-- ============================================================
-- 0009_parent_invite_jwt_email.sql
-- 招待メール突合を auth.users から JWT クレームへ切替
--   authenticated ロールは auth.users を SELECT できないため、
--   0008 の (select email from auth.users where id = auth.uid()) は
--   常に空を返し、保護者が pending 招待を閲覧/承認できなかった。
-- ============================================================

drop policy if exists pcl_select_involved        on public.parent_child_links;
drop policy if exists pcl_update_parent_approve  on public.parent_child_links;
drop policy if exists pcl_delete_involved        on public.parent_child_links;

create policy pcl_select_involved
  on public.parent_child_links for select to authenticated
  using (
       auth.uid() = student_id
    or auth.uid() = parent_id
    or (
      status = 'pending'
      and parent_id is null
      and lower(invited_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

create policy pcl_update_parent_approve
  on public.parent_child_links for update to authenticated
  using (
    status = 'pending'
    and parent_id is null
    and lower(invited_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and public.current_user_role() = 'parent'
  )
  with check (
    auth.uid() = parent_id
    and status = 'active'
  );

create policy pcl_delete_involved
  on public.parent_child_links for delete to authenticated
  using (
       auth.uid() = student_id
    or auth.uid() = parent_id
    or (
      status = 'pending'
      and parent_id is null
      and lower(invited_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );
