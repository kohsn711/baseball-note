# 11 監督の選手一覧・記録閲覧

## 概要
コーチが所属チームの選手一覧と各選手の記録を閲覧する機能。

## ToDo

### チームダッシュボード（`app/(coach)/coach/page.tsx`）
- [x] 所属チームの選手一覧表示
- [x] 各選手の直近記録状況（連続日数・最終記録日）を表示
- [x] 選手名クリックで記録一覧へ遷移

### 選手記録一覧（`app/(coach)/coach/students/[studentId]/page.tsx`）
- [x] 選手の記録をカレンダー形式または一覧形式で表示
- [x] 日付クリックで記録詳細へ遷移

### 選手記録詳細（`app/(coach)/coach/students/[studentId]/record/[date]/page.tsx`）
- [x] 学生の記録詳細を閲覧（08と同様の表示）
- [x] リアクション・コメント入力UI（14で実装）

### 選手目標確認（`app/(coach)/coach/students/[studentId]/goals/page.tsx`）
- [x] 選手の目標一覧を表示

### データフェッチとアクセス制御
- [x] 自分のチームに所属する学生のみ表示（RLS + アプリ側チェック）
- [x] 他チームの学生データにアクセスした場合は `notFound()`
- [x] `params` は `await params` で取得

### UI
- [x] `loading.tsx` でスケルトン表示
- [x] `error.tsx` でエラー表示
