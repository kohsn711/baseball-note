# 15 アプリ内通知

## 概要
リアクション・コメントが届いた際に学生へアプリ内通知を表示する機能。

## ToDo

### 通知作成
- [x] リアクション送信時にServer Actionで `notifications` テーブルに insert
- [x] コメント送信時にServer Actionで `notifications` テーブルに insert
- [x] `type`（reaction / comment）と送信者情報・対象記録IDを保存

### 通知一覧画面（`app/(student)/notifications/page.tsx`）
- [x] 通知一覧を新着順で表示
- [x] 通知タイプ（リアクション / コメント）と送信者名・日時を表示
- [x] 対象記録へのリンク
- [x] 既読・未読の管理（`is_read` カラム）

### 通知バッジ
- [x] 学生ホームの `PageHeader` 右端にベルアイコン + 未読件数バッジを表示
- [x] バッジの数値は `countUnreadNotifications(userId)` で取得し、他フェッチと `Promise.all` で並列実行
- [x] 件数 99 超は `99+` と表示

### 既読処理
- [x] 通知一覧を開いたタイミングで既読にする
- [x] 未読がある場合のみ UPDATE を実行し、完了後に `revalidatePath('/', 'layout')` でホームのバッジを即時リセット

### アクセス制御
- [x] 通知は本人のみ閲覧可（RLS + アプリ側チェック）

## 備考
- プッシュ通知（Push Notifications）はMVPスコープ外
- スキーマは既存 `notifications` テーブルの `is_read` カラムを使用（ticket 当初記載の `read_at` は不採用）
- 自分自身の操作（学生が自分の記録に何かするケース）では通知を作成しない
- リアクションを取り消しても通知は削除しない（履歴として残す）

## 実装ファイル
- `lib/notifications.ts` — `fetchNotifications` / `countUnreadNotifications` / `createNotification`
- `app/_actions/social.ts` — リアクション/コメント作成成功時に通知を insert
- `app/(student)/notifications/page.tsx` — 一覧表示 + ページ表示時に既読化
- `app/(student)/home/page.tsx` — `PageHeader` 右端にベルアイコン（未読バッジ付き）をインライン配置

## UI 仕様メモ
- リアクション通知: 左アイコン位置に押された絵文字（👍🔥💪❤️）を表示。本文行は省略
- コメント通知: 左アイコン位置に 💬、本文にコメント文を 1 行で truncate 表示
- 未読は amber 背景 + 「新着」バッジ
- バッジ件数は 99 を超えたら `99+` と表示
