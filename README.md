# 野球ノート

中学生から高校生の野球選手向けの記録アプリです。学生が日々の練習、体づくり、食事、体調、ケガ、振り返りを記録し、保護者と監督が閲覧とリアクションで継続を支援します。

## 現在の実装状況

- 実装済み
  - 共通ログイン画面
  - 学生の初期設定、チーム参加、日次記録、目標管理
  - 保護者招待と承認、保護者による子どもの記録閲覧
  - 監督によるチーム管理、選手記録・目標の閲覧
  - リアクション、コメント、通知
  - 学生、保護者、監督向けコンテンツ閲覧
  - BottomNav と各ロールのマイページ
- 未実装
  - 管理者向けコンテンツ管理 UI
  - 自動テスト
  - デプロイ整備

## 技術スタック

- Next.js 16.2.4 App Router
- React 19.2.4
- TypeScript
- Supabase Auth / Database / Storage
- Tailwind CSS v4

## 開発コマンド

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## 主要ルート

- 学生: `/home`, `/records/[date]`, `/goals`, `/contents`, `/mypage`
- 保護者: `/parent`, `/parent/children/[studentId]`, `/parent/contents`, `/parent/mypage`
- 監督: `/coach`, `/coach/students/[studentId]`, `/coach/contents`, `/coach/mypage`
- 共通認証: `/login`

## ドキュメント

- 全体方針: `CLAUDE.md`
- チケット一覧: `docs/00-ticket-index.md`
- 機能別メモ: `docs/*.md`
