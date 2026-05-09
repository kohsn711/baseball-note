# 04 DBマイグレーション・RLS設定

## 概要
Supabase PostgreSQLのテーブル作成とRow Level Security（RLS）の設定。

## ToDo

### テーブル作成
- `auth.users` は Supabase Auth が自動管理（手動作成不要）。email / created_at / updated_at はここで管理し、自前テーブルに重複させない
- [x] `profiles`
  - `id` UUID PK, FK → auth.users.id
  - `role` text（student / coach / parent / admin）NOT NULL
  - `display_name` text NOT NULL
  - `created_at` timestamptz DEFAULT now()
  - ※ email は auth.users が管理するため持たない
- [x] `teams`
- [x] `team_members`
- [x] `parent_child_links`（status: pending / active）
- [x] `daily_records`
- [x] `practice_entries`
- [x] `training_entries`
- [x] `meal_records`
- [x] `condition_records`
- [x] `injury_records`
- [x] `reflection_records`
- [x] `goals`（title / description / category / target_date / status: active/achieved/abandoned）
- [x] `reactions`
- [x] `preset_comments`
- [x] `comments`
- [x] `contents`
- [x] `notifications`

### RLS有効化・ポリシー設定
- [x] `daily_records` — 本人のみ作成・編集・閲覧
- [x] `daily_records` — 所属チームのcoachが閲覧可
- [x] `daily_records` — activeな親子リンクのparentが閲覧可
- [x] `parent_child_links` — 本人（student / parent）のみ閲覧
- [x] `team_members` — 同チームメンバーが閲覧可
- [x] `goals` — 本人のみ作成・編集・閲覧、coachは閲覧のみ
- [x] `reactions` — coach / parent が対象studentの記録に作成可
- [x] `comments` — coach / parent が対象studentの記録に作成可
- [x] `notifications` — 本人のみ閲覧
- [x] `contents` — adminが作成・編集、published のみ全ユーザーが閲覧

### インデックス・制約
- [x] `daily_records` に `(student_id, record_date)` のユニーク制約（1日1記録）
- [x] 外部キー制約を適切に設定
- [x] よく使うカラムにインデックスを設定
- [x] `0015_performance_improvements.sql` で主要画面向けの追加インデックスと集約RPCを設定

## 備考
- カラム名はすべて `snake_case`
- RLSとアプリケーション側チェックを必ず併用する
- 「日付」カラムは予約語回避のため `record_date` とした

## 適用方法

`supabase/migrations/` 配下にSQLを配置。以下のいずれかで適用：

### A. Supabaseダッシュボード（推奨・簡単）
1. ダッシュボード → **SQL Editor** を開く
2. `supabase/migrations/0001_schema.sql` の中身をコピペして実行
3. 続けて `supabase/migrations/0002_rls.sql` も実行
4. **Database** → **Tables** で全テーブルが作成されていることを確認
5. **Authentication** → **Policies** でRLSポリシーが適用されていることを確認

### B. Supabase CLI
```bash
npx supabase link --project-ref erhmthnfwwqlxkhcvyqt
npx supabase db push
```

## 設計メモ

### RLSヘルパー関数（0002_rls.sql 内）
循環参照を避けるため `SECURITY DEFINER` で定義：
- `current_user_role()` — 現在ユーザーのロール
- `is_coach_of_student(student_id)` — 指定学生のコーチか
- `is_active_parent_of(student_id)` — 指定学生の親（active）か
- `can_access_daily_record(record_id)` — 記録への閲覧権限を持つか
- `owns_daily_record(record_id)` — 記録の所有者か

### 子テーブルのRLS
`practice_entries` / `training_entries` / `meal_records` / `condition_records` / `injury_records` / `reflection_records` は `daily_records` の権限を継承する形でDOブロックで一括定義。

### notificationsの作成権限
MVP段階では認証ユーザーなら誰でも通知を作成できる（`with check (true)`）。アプリ層で送信元と宛先の妥当性を担保する。後続でDBトリガに移行することも検討。

## 適用後の確認手順

### 1. テーブル数の確認
Database → **Tables** で `public` スキーマに以下17テーブルが存在することを確認:

`profiles` / `teams` / `team_members` / `parent_child_links` / `daily_records` / `practice_entries` / `training_entries` / `meal_records` / `condition_records` / `injury_records` / `reflection_records` / `goals` / `reactions` / `preset_comments` / `comments` / `contents` / `notifications`

### 2. RLS有効化の確認
Authentication → **Policies**（または Database → Policies）で各テーブル右に **「Disable RLS」ボタン**が表示されていればRLSが有効（無効なら「Enable RLS」と表示される）。17テーブルすべてで確認すること。

### 3. ポリシー数の確認
各テーブルに以下のポリシー数が設定されていること（`APPLIED TO` はすべて `authenticated`）:

| テーブル | ポリシー数 | 名前 |
|---|---|---|
| `profiles` | 3 | `_select_authenticated` / `_insert_self` / `_update_self` |
| `teams` | 3 | `_select_members` / `_insert_coach` / `_update_owner` |
| `team_members` | 3 | `_select_teammates` / `_insert_self` / `_delete_self` |
| `parent_child_links` | 4 | `pcl_select_involved` / `pcl_insert_student` / `pcl_update_parent_approve` / `pcl_delete_involved` |
| `daily_records` | 4 | `_select` / `_insert_self` / `_update_self` / `_delete_self` |
| `practice_entries`〜`reflection_records`（6個） | 各4 | `<table>_select` / `_insert` / `_update` / `_delete` |
| `goals` | 4 | `_select` / `_insert_self` / `_update_self` / `_delete_self` |
| `reactions` | 3 | `_select` / `_insert_coach_or_parent` / `_delete_sender` |
| `preset_comments` | 2 | `_select_active` / `_admin_all` |
| `comments` | 3 | `_select` / `_insert_coach_or_parent` / `_delete_sender` |
| `contents` | 2 | `_select_published_or_owner` / `_admin_all` |
| `notifications` | 4 | `_select_self` / `_update_self` / `_insert_authenticated` / `_delete_self` |

### 4. 関数の確認
Database → **Functions** で以下7関数が存在すること:

| 関数 | 用途 | 定義元 |
|---|---|---|
| `set_updated_at` | トリガ用（`updated_at` 自動更新） | 0001_schema.sql |
| `current_user_role` | RLSヘルパー（ロール取得） | 0002_rls.sql |
| `is_coach_of_student` | RLSヘルパー（コーチ判定） | 0002_rls.sql |
| `is_active_parent_of` | RLSヘルパー（親判定） | 0002_rls.sql |
| `can_access_daily_record` | RLSヘルパー（閲覧権限） | 0002_rls.sql |
| `owns_daily_record` | RLSヘルパー（所有判定） | 0002_rls.sql |
| `get_students_last_record_dates` | 複数学生の最終記録日集約 | 0015_performance_improvements.sql |

### 5. 補足
- ダッシュボードのSQL Editorで `0002_rls.sql` 実行時に「New tables will not have Row Level Security enabled」という警告が出るが、これは `CREATE OR REPLACE FUNCTION` や `DO` ブロックを誤検知したもの。テーブル作成は含まないため **「Run without RLS」** を選択して問題ない
- 「Auto-enable RLS for new tables」バナーは今後 `CREATE TABLE` した時に自動でRLSを有効化するトリガの案内。本マイグレーションでは `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` を明示しているため設定不要
