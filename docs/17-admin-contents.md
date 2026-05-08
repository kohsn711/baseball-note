# 17 運営コンテンツ管理

## 概要
管理者（Admin）がコンテンツ（記事・外部動画）を作成・編集・公開管理する機能。

## ToDo

### コンテンツ一覧（`app/(admin)/admin/contents/page.tsx`）
- [ ] 全ステータスのコンテンツを一覧表示（draft / published / archived）
- [ ] ステータス・対象ユーザー・公開日時を表示
- [ ] 「新規作成」ボタン
- [ ] 各コンテンツの「編集」「公開」「アーカイブ」ボタン

### コンテンツ作成・編集（`app/(admin)/admin/contents/[id]/edit/page.tsx`）
- [ ] タイトル入力
- [ ] 本文入力（リッチテキストまたはMarkdown）
- [ ] サムネイル画像アップロード（Supabase Storage）
- [ ] 対象ユーザー選択（student / parent / both）
- [ ] カテゴリ選択
- [ ] 外部動画URL入力
- [ ] ステータス切り替え（draft / published / archived）
- [ ] 保存Server Action（upsert）

### 公開管理
- [ ] 「公開」アクション（`status` を `published` に更新、`published_at` を記録）
- [ ] 「非公開」アクション（`status` を `draft` に戻す）
- [ ] 「アーカイブ」アクション（`status` を `archived` に更新）

### 画像アップロード
- [ ] Supabase Storageにアップロード
- [ ] `thumbnail_url` にStorageのURLを保存
- [ ] `next/image` で表示する場合は `next.config.ts` に Supabaseドメインを追加

### アクセス制御
- [ ] adminロールのみアクセス可能（proxy + アプリ側チェック）

## 備考
- `created_by` に管理者のuser_idを保存
- 動画は外部URLのみ（自前アップロード・変換・配信は実装しない）
