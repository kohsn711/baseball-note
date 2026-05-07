# 10 チーム作成・チーム参加

## 概要
コーチがチームを作成し、学生がチームコードで参加する機能。

## ToDo

### チーム作成（コーチ）
- [x] `app/(coach)/coach/team/create/page.tsx` を作成
- [x] チーム名入力フォーム
- [x] 作成Server Action（`teams` テーブルに insert、`team_members` にcoachとして登録）
- [x] チームコード（ランダム英数字6文字）を自動生成して保存

### チーム参加（学生）
- [x] `app/(student)/team/join/page.tsx` を作成
- [x] チームコード入力フォーム
- [x] 参加Server Action（コードでチームを検索し `team_members` にstudentとして登録）
- [x] 存在しないコードの場合はエラーメッセージを表示

### チーム情報表示
- [x] コーチのダッシュボード（`/coach`）にチームコードを表示
- [x] 学生ホーム（`/home`）ヘッダーに所属チーム名を表示（マイページは未実装のため暫定対応）

### アクセス制御
- [x] チーム作成はcoachロールのみ
- [x] チーム参加はstudentロールのみ
- [x] 1学生が複数チームに所属できる設計

## 実装メモ

### ルート構成
- `app/(coach)/layout.tsx` — 監督ルートグループ共通レイアウト
- `app/(coach)/coach/page.tsx` — `/coach`（監督ダッシュボード）
- `app/(coach)/coach/team/create/{page.tsx,actions.ts,team-create-form.tsx}`
- `app/(student)/team/join/{page.tsx,actions.ts,team-join-form.tsx}`
- `lib/team.ts` — `generateTeamCode` / `fetchTeamsForUser` / `TEAM_CODE_PATTERN`

ルートグループ `(coach)` は URL に出ないため、`/coach` を生成するには `app/(coach)/coach/page.tsx` のように明示的なセグメントが必要。

### チームコード仕様
- 文字種: `A-Z` と `2-9`（紛らわしい `0/O/1/I/L` を除外）
- 長さ: 6文字
- `crypto.getRandomValues` で生成
- `teams.team_code` は `unique` 制約。衝突時は最大8回リトライ（`TEAM_CODE_MAX_ATTEMPTS`）

### RLS / マイグレーション
チケット10で追加した3つのマイグレーション:

- `0005_team_join_rpc.sql`
  `find_team_by_code(_team_code text)` を SECURITY DEFINER で追加。
  学生は `teams_select_members` の制約により未参加チームを SELECT できないため、
  チーム参加時のコード→id 解決はこの RPC 経由で行う。

- `0006_teams_select_creator.sql`
  `teams_select_creator` ポリシーを追加（`auth.uid() = created_by`）。
  これがないと `teams.insert(...).select().single()` の returning row が
  RLS でブロックされ、`PGRST116` でチーム作成が失敗する。

- `0007_team_members_recursion_fix.sql`
  `is_team_member(_team_id uuid)` を SECURITY DEFINER で追加し、
  既存の `teams_select_members` / `team_members_select_teammates` を関数呼び出しに置き換え。
  両ポリシーが互いに `team_members` を SELECT して RLS を再帰評価し、
  PostgreSQL が `42P17 infinite recursion detected in policy for relation "team_members"` を返す問題を解消。

### 注意
- 監督用の初期設定（`role = 'coach'` の付与）画面はまだ未実装。
  動作確認時は Supabase 上で手動で `profiles.role` を `coach` に更新する。
- 学生のマイページ画面もまだない。所属チーム名は暫定で学生ホームに表示している。

## 備考
- チームコードは推測されにくいランダム文字列にする（`A-Z`/`2-9` の32種から6文字 ≒ 約10億通り）
