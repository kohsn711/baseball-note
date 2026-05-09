# 21 パフォーマンス改善

## 概要
ログイン後の主要画面で、認証・プロフィール取得、Supabaseへの往復回数、DB検索効率を改善する。

## ToDo

### 認証・Proxy
- [x] `proxy.ts` / `utils/supabase/proxy.ts` で不要な `profiles` 取得を減らす
- [x] ページ側の認証・プロフィール取得を共通化し、同一リクエスト内の重複取得を抑える
- [x] 既存の `getClaims()` 利用ルールを維持し、`getSession()` は使わない

### 主要画面のデータフェッチ
- [x] `/home` のホーム用データ取得をまとめ、Supabaseクライアント生成とクエリ呼び出しを削減する
- [x] 日次記録取得をネストselect化し、カテゴリ別テーブル取得の往復を削減する
- [x] 監督ダッシュボードの最終記録取得を必要件数に絞る

### DB
- [x] 実クエリに合わせた追加インデックスをマイグレーションで定義する

### 検証
- [x] `npm run lint`
- [x] `npm run build`

## 実装方針
- ユーザー固有データは共有キャッシュしない
- 画面表示仕様は変えず、データ取得経路のみを最適化する
- Supabase RLSを前提にしつつ、ページ/Server Action側のロールチェックは維持する

## 改善内容

### 1. ProxyのDBアクセス削減
- 以前は保護ページへのアクセスごとにProxyで `profiles` を取得していた
- 現在は `/setup` と `/admin` のようにProxy段階でロール判定が必要な経路だけ `profiles` を取得する
- 通常の学生・保護者・監督ページでは、Proxyは認証トークン更新と未ログインリダイレクトに絞る

### 2. 認証・ロール確認の共通化
- `lib/current-user.ts` を追加し、`getCurrentUserProfile()` / `requireRole()` に認証・プロフィール取得を集約した
- Server Component内の同一リクエストではReact `cache()` により現在ユーザー取得を重複実行しない
- 主要ページは `createClient()` → `getClaims()` → `profiles` 取得の重複実装をやめ、`requireRole('student' | 'coach' | 'parent')` を使う
- `getSession()` は使わず、既存方針どおり `getClaims()` を維持した

### 3. 主要画面のSupabase往復削減
- `/home` は `fetchStudentHomeData()` に集約し、今日の記録有無、月次カレンダー日付、連続記録用日付、最近の反応/コメント、チーム、未読通知数をまとめて取得する
- 日次記録取得は `daily_records` から `practice_entries` / `training_entries` / `meal_records` / `condition_records` / `injury_records` / `reflection_records` をネストselectで一括取得する
- 監督ダッシュボードの最終記録日は、全レコードをアプリ側で走査せず `get_students_last_record_dates()` RPCでDB側集約する

### 4. DB検索効率の改善
- `0015_performance_improvements.sql` を追加し、実クエリに合わせたインデックスを定義した
- 追加対象は `team_members`、`reactions`、`comments`、`goals`、公開 `contents` のロール別一覧・カテゴリ絞り込み
- 複数学生の最終記録日を集約する `get_students_last_record_dates(uuid[])` RPCを追加した

## 実装メモ
- `lib/current-user.ts` に `getCurrentUserProfile()` / `requireRole()` を追加し、主要ページの認証・プロフィール取得を共通化した
- Proxyは `/setup` と `/admin` などロール判定が必要な経路だけ `profiles` を読む。通常の保護ページはページ側チェックに委ねる
- `fetchStudentHomeData()` でホーム用データを1つのSupabaseクライアントに集約した
- `fetchDailyRecord()` は `daily_records` から子テーブルをネストselectで一括取得する
- `0015_performance_improvements.sql` で追加インデックスと `get_students_last_record_dates()` RPCを定義した
