-- ============================================================
-- 0011_comments_free_text.sql
-- comments を自由記述化
--   - text 列を追加し既存レコードを preset 文言で backfill
--   - text NOT NULL + 200 文字以内の制約
--   - preset_comment_id 列を drop（preset_comments テーブル自体は残す）
-- ============================================================

alter table public.comments add column text text;

update public.comments c
set text = pc.text
from public.preset_comments pc
where c.preset_comment_id = pc.id;

alter table public.comments
  alter column text set not null,
  add constraint comments_text_length check (char_length(text) between 1 and 200);

alter table public.comments drop column preset_comment_id;
