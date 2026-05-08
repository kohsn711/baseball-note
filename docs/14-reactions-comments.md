# 14 リアクション・コメント

## 概要

コーチ・保護者が学生の記録にリアクションスタンプと自由記述コメント（定型文挿入補助あり）を送る機能。

## ToDo

### 定型コメントの初期データ

- [x] `preset_comments` テーブルに初期データをseed（`0010_preset_comments_seed.sql`）
  - よく頑張った / 継続できている / 無理しすぎ注意 / 明日も続けよう / 食事も意識できている

### リアクションUI（記録詳細ページに配置）

- [x] リアクションスタンプ選択UI（👍 / 🔥 / 💪 / ❤️）
- [x] スタンプタップでServer Actionを呼び出し
- [x] 既にリアクション済みの場合はトグル（取り消し）
- [x] coach / parent：トグルボタン＋件数のみ表示（名前リストは非表示）
- [x] student：絵文字＋件数バッジ形式。タップで送信者名をインライン展開

### コメントUI

- [x] `textarea`（最大200文字）＋残り文字数カウンタ＋送信ボタン
- [x] 定型ボタン（5件）をタップするとtextareaの末尾に追記
- [x] 送信後にコメント一覧を更新

### Server Action

- [x] リアクション追加・取り消し（`reactions` テーブルに insert / delete）— `toggleReaction`
- [x] コメント送信（`comments` テーブルに insert）— `sendComment(text)`。1〜200文字バリデーション
- [x] Server Action内で認証・権限チェック（coachは自チームの学生のみ、parentは紐づく子どものみ）
- [ ] 送信後に通知を作成（15で実装）

### ロール別可視性

- [x] student：coach・parent両方のリアクション・コメントを閲覧可
- [x] coach：coachが送信したもののみ表示（parentのものは非表示）
- [x] parent：parentが送信したもののみ表示（coachのものは非表示）
- [x] `fetchRecordSocial(dailyRecordId, viewerRole)` でサーバ側フィルタ

### アクセス制御

- [x] coach / parentのみリアクション・コメント可能
- [x] studentは閲覧のみ（`canInteract=false`）

### DB変更（仕様変更）

- [x] `comments.text NOT NULL` 追加・backfill・`preset_comment_id` 列を drop（`0011_comments_free_text.sql`）

## 備考

- 当初「自由文コメントはMVPスコープ外」としていたが、`textarea` ＋定型ボタン補助の形に変更した
- 通知作成はticket 15のスコープ
