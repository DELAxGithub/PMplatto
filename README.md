# 週次レビュー機能

## 概要
毎週月曜日の朝8時（JST）に、番組の進捗状況や予定をSlackで通知する機能です。

## 機能
- 今週の放送予定、収録予定、タスク予定の表示
- ステータス別の番組数の集計
- 先週の更新情報（新規番組、ステータス変更）の表示

## 実行方法

### 開発環境での実行
```bash
# 依存関係のインストール
npm install

# 週次レビューの実行（開発環境）
npm run weekly-review
```

### 本番環境での設定
1. 環境変数の設定
   - `SLACK_WEBHOOK_URL`: Slack通知用のWebhook URL
   - `VITE_SUPABASE_URL`: SupabaseのプロジェクトURL
   - `VITE_SUPABASE_ANON_KEY`: Supabaseの匿名キー

2. スケジュール実行の設定
   - Netlify Functionsまたは GitHub Actionsで定期実行を設定
   - `src/scripts/weeklyReview.ts`がエントリーポイント

## エラーハンドリング
- データ取得エラー時はコンソールにエラーログを出力
- Slack通知失敗時は再試行なし（次回の実行時に再度通知）

## 通知フォーマット
```
📊 週次番組レビュー

📅 今週の予定
📢 放送予定
• 2025-03-20 PRG001 サンプル番組1
• 2025-03-22 PRG002 サンプル番組2

📍 収録予定
• 2025-03-21 PRG003 サンプル番組3

📝 タスク予定
• 2025-03-19 編集 (PRG001)
• 2025-03-20 MA (PRG002)

📊 番組状況
• 編集中: 5件
• 試写中: 3件
• MA中: 2件
...

🆕 新規番組
• PRG004 新規番組1
• PRG005 新規番組2
```