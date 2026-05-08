# 13 保護者ホーム・子どもの記録閲覧

## 概要

保護者がわが子の記録を閲覧する機能。

## ToDo

### 保護者ホーム（`app/(parent)/parent/page.tsx`）

- [x] 紐づく子どもの一覧表示（複数の場合はリスト）
- [x] 各子どもの直近記録状況（連続日数・最終記録日）表示
- [x] 子どもの名前クリックで記録一覧へ遷移
- [x] `PageHeader`（`sticky top-0`）にグリーティング表示

### 子どもの記録一覧（`app/(parent)/parent/children/[studentId]/page.tsx`）

- [x] カレンダーまたは一覧形式で記録日を表示
- [x] 日付クリックで記録詳細へ遷移

### 子どもの記録詳細（`app/(parent)/parent/children/[studentId]/record/[date]/page.tsx`）

- [x] 学生の記録詳細を閲覧（08と同様の表示）
- [x] リアクション・コメント入力UI（14で実装）

### データフェッチとアクセス制御

- [x] `parent_child_links` が `active` な子どものみ表示（RLS + アプリ側チェック）
- [x] 紐づいていない学生にアクセスした場合は `notFound()`
- [x] `params` は `await params` で取得

### UI

- [x] `loading.tsx` でスケルトン表示
- [x] `error.tsx` でエラー表示

## ナビゲーション（BottomNav）

保護者は3タブ構成（16b で追加）:

| タブ | href | 内容 |
|---|---|---|
| お子さま | `/parent` | 子ども一覧（本ページ） |
| コンテンツ | `/parent/contents` | 保護者向け記事 |
| マイページ | `/parent/mypage` | 招待・連携 / ログアウト |

## 備考
- 当初「ホーム」「お子さま」の2タブ案があったが、役割が重複するため `/parent` に統合して3タブ化
- コンテンツ導線カード・招待連携セクションはホームから削除し、各タブ直接遷移に変更
