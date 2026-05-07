-- contents.target_audience を廃止し、ロール別 boolean カラムに置き換える
-- 旧 'both' は (for_student=true, for_parent=true) に分解する

alter table public.contents
  add column for_student boolean not null default false,
  add column for_parent  boolean not null default false,
  add column for_coach   boolean not null default false;

update public.contents set for_student = true
  where target_audience in ('student', 'both');

update public.contents set for_parent = true
  where target_audience in ('parent', 'both');

alter table public.contents
  add constraint contents_audience_at_least_one
  check (for_student or for_parent or for_coach);

alter table public.contents drop column target_audience;
