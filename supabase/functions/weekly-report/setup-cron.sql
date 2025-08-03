-- PMplatto 週報自動送信 Cron Job設定
-- 毎週月曜日 8:00 AM JST (23:00 UTC 日曜日) に実行

-- 1. pg_cron拡張を有効化
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. 週報送信のCron jobをスケジュール
SELECT cron.schedule(
  'pmplatto-weekly-report',
  '0 23 * * 0',
  $BODY$
    SELECT net.http_post(
      'https://pgropwfkdcvbccdgscff.supabase.co/functions/v1/weekly-report',
      '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm9wd2ZrZGN2YmNjZGdzY2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE2MjU0OTcsImV4cCI6MjA1NzIwMTQ5N30.Zbf0U4PH4m5_ieSmzhxX2isHdZCP7OB_FxUF2exW9rM", "Content-Type": "application/json"}'::jsonb
    );
  $BODY$
);

-- 3. 設定されているCron jobsを確認
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobname
FROM cron.job 
WHERE jobname = 'pmplatto-weekly-report';

-- 4. Cron job実行履歴を確認（オプション）
-- SELECT * FROM cron.job_run_details 
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'pmplatto-weekly-report')
-- ORDER BY start_time DESC 
-- LIMIT 10;

-- 【重要】Cron jobを削除する場合（必要な時のみ実行）
-- SELECT cron.unschedule('pmplatto-weekly-report');

-- 【備考】
-- - 日本時間(JST)は UTC+9 なので、月曜日 8:00 AM JSTは日曜日 23:00 UTCです
-- - Cron形式: 分 時 日 月 曜日 (0=日曜日, 1=月曜日, ...)
-- - '0 23 * * 0' = 毎週日曜日の23:00 UTC
-- - このジョブは毎週自動実行され、PMplattoの最新データから週報を生成してSlackに送信します