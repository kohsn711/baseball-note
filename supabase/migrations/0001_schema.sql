-- ============================================================
-- 0001_schema.sql
-- 野球ノートアプリ MVP のテーブル・インデックス・制約定義
-- ============================================================

-- ------------------------------------------------------------
-- 共通: updated_at 自動更新トリガ
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- profiles
--   auth.users と 1:1。 ロール・表示名のみ管理。
-- ------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         text not null check (role in ('student', 'coach', 'parent', 'admin')),
  display_name text not null,
  created_at   timestamptz not null default now()
);

-- ------------------------------------------------------------
-- teams / team_members
-- ------------------------------------------------------------
create table public.teams (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  team_code  text not null unique,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);
create index teams_team_code_idx on public.teams (team_code);

create table public.team_members (
  team_id      uuid not null references public.teams(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  role_in_team text not null check (role_in_team in ('student', 'coach')),
  joined_at    timestamptz not null default now(),
  primary key (team_id, user_id)
);
create index team_members_user_id_idx on public.team_members (user_id);

-- ------------------------------------------------------------
-- parent_child_links
--   親が登録 → status=pending → 学生が承認 → status=active
-- ------------------------------------------------------------
create table public.parent_child_links (
  id         uuid primary key default gen_random_uuid(),
  parent_id  uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status     text not null check (status in ('pending', 'active')),
  created_at timestamptz not null default now(),
  unique (parent_id, student_id)
);
create index parent_child_links_parent_id_idx  on public.parent_child_links (parent_id);
create index parent_child_links_student_id_idx on public.parent_child_links (student_id);

-- ------------------------------------------------------------
-- daily_records  (1日1記録)
-- ------------------------------------------------------------
create table public.daily_records (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.profiles(id) on delete cascade,
  record_date date not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (student_id, record_date)
);
create index daily_records_student_date_idx on public.daily_records (student_id, record_date desc);

create trigger daily_records_set_updated_at
  before update on public.daily_records
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 子テーブル群 (1:N): practice_entries / training_entries
-- ------------------------------------------------------------
create table public.practice_entries (
  id               uuid primary key default gen_random_uuid(),
  daily_record_id  uuid not null references public.daily_records(id) on delete cascade,
  type             text not null check (type in
                     ('swing', 'tee_batting', 'catch_ball', 'pitching',
                      'fielding', 'baserunning', 'free')),
  duration_minutes integer check (duration_minutes >= 0),
  count            integer check (count >= 0),
  memo             text,
  created_at       timestamptz not null default now()
);
create index practice_entries_daily_record_idx on public.practice_entries (daily_record_id);

create table public.training_entries (
  id               uuid primary key default gen_random_uuid(),
  daily_record_id  uuid not null references public.daily_records(id) on delete cascade,
  type             text not null check (type in
                     ('running', 'dash', 'pushup', 'situp', 'squat',
                      'stretch', 'free')),
  duration_minutes integer check (duration_minutes >= 0),
  count            integer check (count >= 0),
  memo             text,
  created_at       timestamptz not null default now()
);
create index training_entries_daily_record_idx on public.training_entries (daily_record_id);

-- ------------------------------------------------------------
-- 子テーブル群 (1:1): meal / condition / injury / reflection
--   PK = daily_record_id で自然に1:1を表現
-- ------------------------------------------------------------
create table public.meal_records (
  daily_record_id uuid primary key references public.daily_records(id) on delete cascade,
  breakfast       text check (breakfast in ('ate', 'skipped')),
  lunch           text check (lunch     in ('ate', 'skipped')),
  dinner          text check (dinner    in ('ate', 'skipped')),
  snack           text check (snack     in ('ate', 'skipped')),
  water_amount_ml integer check (water_amount_ml >= 0),
  memo            text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger meal_records_set_updated_at
  before update on public.meal_records
  for each row execute function public.set_updated_at();

create table public.condition_records (
  daily_record_id uuid primary key references public.daily_records(id) on delete cascade,
  sleep_hours     numeric(4,2) check (sleep_hours >= 0 and sleep_hours <= 24),
  wake_time       time,
  sleep_time      time,
  weight_kg       numeric(5,2) check (weight_kg > 0),
  condition       text check (condition in ('good', 'normal', 'bad')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger condition_records_set_updated_at
  before update on public.condition_records
  for each row execute function public.set_updated_at();

create table public.injury_records (
  daily_record_id  uuid primary key references public.daily_records(id) on delete cascade,
  has_pain         boolean not null default false,
  body_part        text,
  pain_level       integer check (pain_level between 1 and 5),
  affects_practice boolean,
  memo             text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create trigger injury_records_set_updated_at
  before update on public.injury_records
  for each row execute function public.set_updated_at();

create table public.reflection_records (
  daily_record_id uuid primary key references public.daily_records(id) on delete cascade,
  achievements    text,
  challenges      text,
  tomorrow_plan   text,
  mood            integer check (mood between 1 and 5),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger reflection_records_set_updated_at
  before update on public.reflection_records
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- goals
-- ------------------------------------------------------------
create table public.goals (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  description text,
  category    text not null check (category in
                ('practice', 'training', 'meal', 'condition', 'general')),
  target_date date,
  status      text not null default 'active'
                check (status in ('active', 'achieved', 'abandoned')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index goals_student_status_idx on public.goals (student_id, status);

create trigger goals_set_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- reactions / preset_comments / comments
-- ------------------------------------------------------------
create table public.reactions (
  id              uuid primary key default gen_random_uuid(),
  daily_record_id uuid not null references public.daily_records(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  emoji           text not null,
  created_at      timestamptz not null default now(),
  unique (daily_record_id, sender_id, emoji)
);
create index reactions_daily_record_idx on public.reactions (daily_record_id);

create table public.preset_comments (
  id         uuid primary key default gen_random_uuid(),
  text       text not null,
  category   text,
  sort_order integer not null default 0,
  is_active  boolean not null default true
);

create table public.comments (
  id                uuid primary key default gen_random_uuid(),
  daily_record_id   uuid not null references public.daily_records(id) on delete cascade,
  sender_id         uuid not null references public.profiles(id) on delete cascade,
  preset_comment_id uuid not null references public.preset_comments(id),
  created_at        timestamptz not null default now()
);
create index comments_daily_record_idx on public.comments (daily_record_id);

-- ------------------------------------------------------------
-- contents (運営記事)
-- ------------------------------------------------------------
create table public.contents (
  id                 uuid primary key default gen_random_uuid(),
  title              text not null,
  body               text not null,
  thumbnail_url      text,
  target_audience    text not null check (target_audience in ('student', 'parent', 'both')),
  category           text,
  external_video_url text,
  status             text not null default 'draft'
                       check (status in ('draft', 'published', 'archived')),
  published_at       timestamptz,
  created_by         uuid not null references public.profiles(id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index contents_status_published_idx on public.contents (status, published_at desc);

create trigger contents_set_updated_at
  before update on public.contents
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- notifications (アプリ内通知)
-- ------------------------------------------------------------
create table public.notifications (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  type              text not null,
  title             text not null,
  body              text,
  related_record_id uuid,
  is_read           boolean not null default false,
  created_at        timestamptz not null default now()
);
create index notifications_user_unread_idx
  on public.notifications (user_id, is_read, created_at desc);
