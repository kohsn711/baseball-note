-- ============================================================
-- 0004_record_categorical.sql
-- 記録のカテゴリカル項目を boolean / 数値 から 3値テキストへ変更
--   - injury_records.affects_practice (boolean) → affects_level (text, none/little/serious)
--   - meal_records.water_amount_ml (integer)   → water_level   (text, low/normal/high)
-- ============================================================

-- injury_records: affects_practice → affects_level
alter table public.injury_records
  drop column if exists affects_practice;

alter table public.injury_records
  add column if not exists affects_level text
    check (affects_level in ('none', 'little', 'serious'));

-- meal_records: water_amount_ml → water_level
alter table public.meal_records
  drop column if exists water_amount_ml;

alter table public.meal_records
  add column if not exists water_level text
    check (water_level in ('low', 'normal', 'high'));
