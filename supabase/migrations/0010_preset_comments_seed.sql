-- ============================================================
-- 0010_preset_comments_seed.sql
-- 定型コメントの初期データ投入（冪等）
-- ============================================================

insert into public.preset_comments (text, category, sort_order, is_active)
select v.text, v.category, v.sort_order, true
from (values
  ('よく頑張った',         'praise',    10),
  ('継続できている',       'praise',    20),
  ('無理しすぎ注意',       'caution',   30),
  ('明日も続けよう',       'encourage', 40),
  ('食事も意識できている', 'praise',    50)
) as v(text, category, sort_order)
where not exists (
  select 1 from public.preset_comments pc where pc.text = v.text
);
