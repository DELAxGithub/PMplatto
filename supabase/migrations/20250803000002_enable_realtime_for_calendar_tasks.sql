/*
  # Enable Realtime for platto_calendar_tasks
  
  Fix for the calendar task real-time sync issue.
  The platto_calendar_tasks table was not added to the supabase_realtime publication,
  causing calendar tasks to not update in real-time (requiring page reload).
  
  This migration adds the table to the realtime publication to enable
  real-time updates for calendar task CRUD operations.
*/

-- Add platto_calendar_tasks table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE platto_calendar_tasks;

-- Add comment for documentation
COMMENT ON TABLE platto_calendar_tasks IS 'カレンダータスク管理テーブル (PMplatto用) - リアルタイム同期有効';