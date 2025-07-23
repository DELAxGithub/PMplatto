# プラッと進捗すごろく オンボーディングガイド

## 1. プロジェクト概要

### 1.1 システムの目的
番組制作の進捗管理と情報共有を効率化するためのWebアプリケーションです。主な機能として：

- 番組情報の一元管理
- 進捗状況の視覚的な把握（カンバンボード）
- スケジュール管理（カレンダー）
- PR納品状況の管理
- 再放送情報の管理

### 1.2 技術スタック
- フロントエンド
  - React (v18)
  - TypeScript
  - Tailwind CSS
  - Vite (ビルドツール)
- バックエンド
  - Supabase (BaaS)
    - PostgreSQL データベース
    - 認証機能
    - リアルタイム更新

## 2. 開発環境のセットアップ

### 2.1 必要な環境
- Node.js (v18以上)
- npm (v9以上)

### 2.2 環境変数の設定
`.env`ファイルに以下の環境変数を設定：

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SLACK_WEBHOOK_URL=your-slack-webhook-url  # 週次レビュー機能用
```

### 2.3 アプリケーションの起動
```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

## 3. プロジェクト構造

### 3.1 主要ディレクトリ
```
src/
├── components/     # Reactコンポーネント
├── contexts/       # Reactコンテキスト
├── lib/           # ユーティリティ関数
├── types/         # TypeScript型定義
└── scripts/       # バッチ処理スクリプト

docs/              # ドキュメント
supabase/          # データベースマイグレーション
```

### 3.2 主要コンポーネント
- `ProgramList.tsx`: 番組一覧画面
- `KanbanBoard.tsx`: カンバンボード画面
- `Calendar.tsx`: カレンダー画面
- `ProgramModal.tsx`: 番組編集モーダル
- `TaskModal.tsx`: タスク編集モーダル

## 4. データモデル

### 4.1 programs テーブル
番組情報を管理する主要テーブル

主要フィールド：
- `id`: 主キー (bigint)
- `program_id`: 番組ID (text)
- `title`: タイトル (text)
- `status`: ステータス (text)
- `first_air_date`: 初回放送日 (date)
- `re_air_date`: 再放送日 (date)
- `filming_date`: 収録日 (date)
- `complete_date`: 完パケ納品日 (date)
- `pr_completed`: PR納品状況 (boolean)
- `pr_due_date`: PR納品期限 (date)

### 4.2 calendar_tasks テーブル
カレンダー上のタスクを管理するテーブル

主要フィールド：
- `id`: 主キー (uuid)
- `program_id`: 関連番組ID (bigint, FK)
- `task_type`: タスク種別 (text)
- `start_date`: 開始日 (date)
- `end_date`: 終了日 (date)

## 5. 主要機能の実装詳細

### 5.1 認証機能
- `AuthContext.tsx`で認証状態を管理
- Supabaseの認証機能を使用
- メールアドレス/パスワード認証

### 5.2 リアルタイム更新
- Supabaseのリアルタイムサブスクリプションを使用
- `ProgramContext.tsx`と`CalendarTaskContext.tsx`で実装
- データ更新時に自動的にUI更新

### 5.3 週次レビュー機能
- `weeklyReview.ts`で実装
- 毎週月曜日朝8時に実行
- Slackに進捗状況を通知

## 6. デプロイメント

### 6.1 本番環境
- Netlifyでホスティング
- 自動デプロイ設定済み
- `main`ブランチへのプッシュで自動デプロイ

### 6.2 環境変数の設定
Netlifyの環境変数に以下を設定：
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SLACK_WEBHOOK_URL`

## 7. 開発ガイドライン

### 7.1 コーディング規約
- ESLintの設定に従う
- TypeScriptの型を適切に使用
- コンポーネントは機能単位で分割

### 7.2 Git運用
- ブランチ名の規約
  - 機能追加: `feature/機能名`
  - バグ修正: `fix/修正内容`
  - リファクタリング: `refactor/内容`
- コミットメッセージは日本語で具体的に記述

### 7.3 レビュー基準
- TypeScriptの型チェックをパス
- ESLintエラーがないこと
- 既存機能への影響がないこと
- UIの一貫性が保たれていること

## 8. トラブルシューティング

### 8.1 開発環境の問題
- 依存関係のエラー → `npm install`を再実行
- 環境変数の問題 → `.env`ファイルの存在確認
- ビルドエラー → `node_modules`を削除して再インストール

### 8.2 データベースの問題
- マイグレーションエラー → `supabase/migrations`の順序確認
- リアルタイム更新の問題 → Supabaseのダッシュボードで接続状態確認

## 9. 参考リソース

### 9.1 公式ドキュメント
- [React Documentation](https://react.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### 9.2 内部ドキュメント
- [ユーザーマニュアル](./user-manual.md)
- [API仕様書](./api-spec.md)
- [データベース設計書](./database-spec.md)

## 10. 連絡先・サポート

### 10.1 チーム連絡先
- 技術的な質問: tech-support@example.com
- 機能に関する質問: product-support@example.com
- 緊急連絡先: emergency@example.com

### 10.2 有用なリンク
- プロジェクト管理ボード: [URL]
- 社内Wiki: [URL]
- チームチャンネル: [Slack URL]