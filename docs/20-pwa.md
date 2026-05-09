# 20 PWA対応

## 概要
スマホ利用を主とする前提に合わせ、野球ノートをホーム画面追加可能な PWA として整備する。

本チケットの初回対応では「インストール可能にする」ことを主目的とし、オフライン対応や Web Push は段階的に別フェーズで扱う。
本チケットの初回対応の実装対象は Phase 1 のみとし、Phase 2（オフライン対応）および Phase 3（Web Push 通知）は将来対応とする。

## 方針

### 段階導入
- Phase 1: ホーム画面追加、standalone 起動、manifest、アイコン、起動導線の最適化
- Phase 2: 最低限のオフライン画面と静的アセットのキャッシュ
- Phase 3: Web Push 通知

本チケットは段階導入を前提とし、当面の完了条件は Phase 1 の実装と実機確認までとする。

### 初回スコープ外
- 記録データや通知一覧の本格オフライン閲覧
- 認証済み個人データの積極キャッシュ
- Push 購読保存、VAPID 鍵管理、外部通知送信

## ToDo

### Phase 1: インストール可能にする
- [x] `app/manifest.ts` を追加し、`name` / `short_name` / `description` / `start_url` / `display` / `background_color` / `theme_color` / `icons` を定義
- [x] アプリアイコンを追加（静的SVGアイコン）
- [x] `app/layout.tsx` に PWA 向け metadata / viewport を追加し、テーマカラーとモバイル起動時の見え方を調整
- [x] `/` 起動時の遷移を PWA 前提に見直し、ログイン済みならロール別ホーム、未ログインなら `/login` へ誘導
- [x] `/login` アクセス時もログイン済みならロール別ホームへ戻すよう導線を統一
- [x] インストール導線 UI を追加（Chromium 系の install prompt、iOS Safari 向け案内）
- [ ] 実機でホーム画面追加と standalone 起動を確認

### Phase 2: 最低限のオフライン対応
- [ ] Service Worker を追加
- [ ] 静的アセットのみ cache-first、認証済み画面や個人データ取得は network-first を基本方針にする
- [ ] オフライン時の汎用フォールバック画面を用意
- [ ] 共有端末やログアウト後に個人データが誤表示されないことを確認

### Phase 3: Web Push 通知
- [ ] Push 購読情報を保存する設計を追加
- [ ] 購読 / 解除 UI を追加
- [ ] VAPID 鍵と通知送信経路を整備
- [ ] 既存のアプリ内通知とは別チャネルとして運用方針を整理

## 受け入れ条件
- [ ] Android Chrome でホーム画面追加できる
- [ ] iPhone Safari でホーム画面追加できる
- [ ] ホーム画面から起動した際にブラウザタブではなく standalone 表示になる
- [ ] ログイン済みユーザーは PWA 起動後に `/login` ではなく自分のホームへ入る
- [ ] 未ログイン時は正しく `/login` へ遷移する
- [ ] 下部ナビやヘッダーが safe area を含めて崩れない

## 備考
- 現状のアプリは Supabase 認証と個人データ依存が強いため、オフライン対応は慎重に行う
- 初回リリースでは「インストール体験の改善」を優先し、複雑なキャッシュ戦略は後段に分離する
- 既存の `notifications` はアプリ内通知であり、Web Push を入れても置き換えず併存させる
- インストール導線 UI は認証後画面で共通表示し、`/login` `/setup` では非表示
- Phase 2 / Phase 3 は本チケットの初回対応のリリース範囲には含めず、要件とリスクを整理したうえで後続対応する
- 開発時に `ImageResponse` 生成アイコンへの `/icon/512?...` リクエストが繰り返される問題があったため、`app/icon.tsx` / `app/apple-icon.tsx` は廃止し、`app/icon.svg` と `public/icons/baseball-note-icon.svg` の静的配信に変更した
- `proxy.ts` の matcher では `icon` / `apple-icon` / `manifest.webmanifest` / 画像拡張子を除外し、PWAメタデータ取得で認証Proxyを通らないようにする
