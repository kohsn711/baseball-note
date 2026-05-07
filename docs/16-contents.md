# 16 コンテンツ一覧・詳細

## 概要
学生・保護者・監督向けのコンテンツ（記事・外部動画）閲覧機能。

## 実装済み

### 対象ロール設計
`target_audience`（enum文字列）を廃止し、ロール別 boolean カラムに置き換えた。

| カラム | 意味 |
|---|---|
| `for_student` | 学生に表示する |
| `for_parent` | 保護者に表示する |
| `for_coach` | 監督に表示する |

- CHECK制約で「3つすべて false」は禁止（必ず1ロール以上を対象にする）
- マイグレーション: `0012_contents_audience_booleans.sql`

### 学生向けコンテンツ一覧（`app/(student)/contents/page.tsx`）
- [x] `status = published` かつ `for_student = true` の記事を一覧表示
- [x] サムネイル・タイトル・カテゴリを表示
- [x] カテゴリでのフィルタリング（`?category=` クエリパラメータ）

### 保護者向けコンテンツ一覧（`app/(parent)/parent/contents/page.tsx`）
- [x] `status = published` かつ `for_parent = true` の記事を一覧表示
- [x] カテゴリでのフィルタリング

### 監督向けコンテンツ一覧（`app/(coach)/coach/contents/page.tsx`）
- [x] `status = published` かつ `for_coach = true` の記事を一覧表示
- [x] カテゴリでのフィルタリング

### コンテンツ詳細（`[id]/page.tsx`、各ロール）
- [x] タイトル・本文・サムネイル画像を表示
- [x] YouTube URL（`youtube.com/watch?v=` / `youtu.be/`）は iframe 埋込
- [x] YouTube 以外の外部URLは外部リンク表示
- [x] 公開日時を表示
- [x] 対象外ロールのIDを直叩きすると `notFound()` で404

### データフェッチ（`lib/contents.ts`）
- [x] `status = published` のコンテンツのみ取得
- [x] `for_student / for_parent / for_coach` カラムで閲覧者ロールをフィルタリング
- [x] `AUDIENCE_COLUMN` 定数でロール→カラム名をマッピング

### UI
- [x] `next/image` でサムネイル表示（`fill` + `sizes` 指定）
- [x] `loading.tsx` でスケルトン表示（学生・保護者・監督の各ページ）
- [x] `params` / `searchParams` は `await` で取得
- [x] 各ロールのホーム画面に「コンテンツ」導線カードを追加 ※16b で BottomNav 追加に伴い各ホームの導線カードは削除済み

### 共有コンポーネント
- `components/contents-list.tsx` — カテゴリチップ + 記事カード一覧（`basePath` で切替）
- `components/content-detail.tsx` — 詳細表示（ロール非依存）

## 備考
- 動画は外部URLのみ（自前アップロード・配信は実装しない）
- ticket 17（admin UI）でコンテンツ作成時に `for_student / for_parent / for_coach` をチェックボックスで設定する
