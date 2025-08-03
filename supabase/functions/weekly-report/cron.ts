// Cron job for weekly report
// This file shows how to set up a cron job to run the weekly report

// To set up a cron job using pg_cron:
// 1. Enable pg_cron extension in Supabase Dashboard
// 2. Run this SQL in the SQL Editor:

/*
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule weekly report to run every Monday at 8:00 AM JST (23:00 UTC Sunday)
SELECT cron.schedule(
  'weekly-report',
  '0 23 * * 0',  -- Every Sunday at 23:00 UTC (Monday 8:00 AM JST)
  $$
  SELECT
    net.http_post(
      url := 'https://pfrzcteapmwufnovmmfc.supabase.co/functions/v1/weekly-report',
      headers := '{"Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '", "Content-Type": "application/json"}'::jsonb
    ) as request_id;
  $$
);

-- Check scheduled jobs
SELECT * FROM cron.job;

-- To remove the job (if needed):
-- SELECT cron.unschedule('weekly-report');
*/

// Alternative: Use Supabase Edge Functions with HTTP requests
// You can also trigger this function via:
// - GitHub Actions (for more complex scheduling)
// - External cron services
// - Manual API calls

export {};