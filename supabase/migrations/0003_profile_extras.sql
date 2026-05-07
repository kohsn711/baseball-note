-- ============================================================
-- 0003_profile_extras.sql
-- profiles に学年・ポジションを追加 (任意項目)
-- ============================================================

alter table public.profiles
  add column if not exists grade    text
    check (grade in ('中1', '中2', '中3', '高1', '高2', '高3')),
  add column if not exists position text
    check (position in ('投手', '捕手', '内野手', '外野手', 'その他'));
