-- ============================================================
-- 0008_parent_invite.sql
-- 学生主導の保護者招待フローへ移行
--   学生が保護者メールを登録 → status=pending(parent_id=null, invited_email)
--   保護者がアカウント作成 → 招待一覧から「承認」 → status=active(parent_id=自身)
-- ============================================================

-- ------------------------------------------------------------
-- スキーマ変更: parent_id を nullable に、invited_email を追加
-- ------------------------------------------------------------
alter table public.parent_child_links
  alter column parent_id drop not null;

alter table public.parent_child_links
  add column if not exists invited_email text;

create index if not exists parent_child_links_invited_email_idx
  on public.parent_child_links (lower(invited_email));

-- pending では parent_id が NULL の場合があるため、unique 制約を貼り直す
alter table public.parent_child_links
  drop constraint if exists parent_child_links_parent_id_student_id_key;

create unique index if not exists parent_child_links_parent_student_unique
  on public.parent_child_links (parent_id, student_id)
  where parent_id is not null;

-- 同じ学生が同じメールに対して重複招待しないように
create unique index if not exists parent_child_links_student_email_unique
  on public.parent_child_links (student_id, lower(invited_email))
  where invited_email is not null and parent_id is null;

-- active のリンクは必ず parent_id を持つ
alter table public.parent_child_links
  drop constraint if exists parent_child_links_active_requires_parent;

alter table public.parent_child_links
  add constraint parent_child_links_active_requires_parent
  check (status = 'pending' or parent_id is not null);

-- ------------------------------------------------------------
-- RLS ポリシー入れ替え
--   旧: 親が pending を作成 → 学生が承認
--   新: 学生が pending を作成 → 保護者が承認
-- ------------------------------------------------------------

drop policy if exists pcl_select_self     on public.parent_child_links;
drop policy if exists pcl_insert_parent   on public.parent_child_links;
drop policy if exists pcl_update_student  on public.parent_child_links;
drop policy if exists pcl_delete_self     on public.parent_child_links;

-- 閲覧:
--   学生本人 / 紐づく保護者 / 自分のメール宛のpending招待を持つ保護者
create policy pcl_select_involved
  on public.parent_child_links for select to authenticated
  using (
       auth.uid() = student_id
    or auth.uid() = parent_id
    or (
      status = 'pending'
      and parent_id is null
      and lower(invited_email) = lower(coalesce(
        (select email from auth.users where id = auth.uid()),
        ''
      ))
    )
  );

-- 作成: 学生本人が status=pending, invited_email 必須, parent_id=null で作成
create policy pcl_insert_student
  on public.parent_child_links for insert to authenticated
  with check (
    auth.uid() = student_id
    and public.current_user_role() = 'student'
    and status = 'pending'
    and parent_id is null
    and invited_email is not null
  );

-- 更新: 保護者が承認 (parent_id=自分, status=active)
create policy pcl_update_parent_approve
  on public.parent_child_links for update to authenticated
  using (
    status = 'pending'
    and parent_id is null
    and lower(invited_email) = lower(coalesce(
      (select email from auth.users where id = auth.uid()),
      ''
    ))
    and public.current_user_role() = 'parent'
  )
  with check (
    auth.uid() = parent_id
    and status = 'active'
  );

-- 削除: 学生本人 / 紐づく保護者 / 招待対象の保護者
create policy pcl_delete_involved
  on public.parent_child_links for delete to authenticated
  using (
       auth.uid() = student_id
    or auth.uid() = parent_id
    or (
      status = 'pending'
      and parent_id is null
      and lower(invited_email) = lower(coalesce(
        (select email from auth.users where id = auth.uid()),
        ''
      ))
    )
  );
