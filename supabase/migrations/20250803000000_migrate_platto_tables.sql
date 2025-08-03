/*
  # Migrate PMplatto tables with platto_ prefix
  
  Migration of three core tables from pgropwfkdcvbccdgscff to pfrzcteapmwufnovmmfc:
  - platto_programs (based on programs table)
  - platto_calendar_tasks (based on calendar_tasks table)  
  - platto_team_dashboard (based on team_dashboard table)
  
  All tables include:
  - Row Level Security (RLS) enabled
  - Authenticated user policies for CRUD operations
  - Proper indexes for performance
  - Foreign key relationships maintained
  - Trigger functions for updated_at timestamps
*/

-- Create platto_programs table (based on programs)
CREATE TABLE IF NOT EXISTS platto_programs (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  program_id text,
  title text NOT NULL,
  subtitle text,
  status text NOT NULL,
  first_air_date date,
  re_air_date date,
  filming_date date,
  complete_date date,
  cast1 text,
  cast2 text,
  script_url text,
  pr_80text text,
  pr_200text text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create platto_calendar_tasks table (based on calendar_tasks)
CREATE TABLE IF NOT EXISTS platto_calendar_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id bigint REFERENCES platto_programs(id) ON DELETE SET NULL,
  task_type text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Ensure end_date is not before start_date
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Create platto_team_dashboard table (based on team_dashboard)
CREATE TABLE IF NOT EXISTS platto_team_dashboard (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  widget_type text NOT NULL CHECK (widget_type IN ('quicklinks', 'memo', 'tasks', 'schedule')),
  title text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS on all platto tables
ALTER TABLE platto_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE platto_calendar_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE platto_team_dashboard ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create updated_at triggers for platto_programs
CREATE OR REPLACE FUNCTION update_platto_programs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_platto_programs_updated_at
  BEFORE UPDATE ON platto_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_platto_programs_updated_at();

-- Create updated_at triggers for platto_calendar_tasks
CREATE TRIGGER update_platto_calendar_tasks_updated_at
  BEFORE UPDATE ON platto_calendar_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create updated_at triggers for platto_team_dashboard
CREATE OR REPLACE FUNCTION update_platto_team_dashboard_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_platto_team_dashboard_updated_at
  BEFORE UPDATE ON platto_team_dashboard
  FOR EACH ROW
  EXECUTE FUNCTION update_platto_team_dashboard_updated_at();

-- Create insert trigger for platto_team_dashboard to set created_by
CREATE OR REPLACE FUNCTION set_platto_team_dashboard_created_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by = auth.uid();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_platto_team_dashboard_created_by
  BEFORE INSERT ON platto_team_dashboard
  FOR EACH ROW
  EXECUTE FUNCTION set_platto_team_dashboard_created_by();

-- RLS Policies for platto_programs
CREATE POLICY "Enable read access for authenticated users" ON platto_programs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON platto_programs
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON platto_programs
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON platto_programs
  FOR DELETE TO authenticated USING (true);

-- RLS Policies for platto_calendar_tasks
CREATE POLICY "Enable read access for authenticated users" ON platto_calendar_tasks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON platto_calendar_tasks
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON platto_calendar_tasks
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON platto_calendar_tasks
  FOR DELETE TO authenticated USING (true);

-- RLS Policies for platto_team_dashboard  
CREATE POLICY "Enable read access for authenticated users" ON platto_team_dashboard
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable write access for authenticated users" ON platto_team_dashboard
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_platto_calendar_tasks_dates ON platto_calendar_tasks (start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_platto_calendar_tasks_program_id ON platto_calendar_tasks (program_id);
CREATE INDEX IF NOT EXISTS idx_platto_team_dashboard_widget_type ON platto_team_dashboard(widget_type);
CREATE INDEX IF NOT EXISTS idx_platto_team_dashboard_sort_order ON platto_team_dashboard(sort_order);
CREATE INDEX IF NOT EXISTS idx_platto_team_dashboard_is_active ON platto_team_dashboard(is_active);

-- Add comments for documentation
COMMENT ON TABLE platto_programs IS 'プログラム管理テーブル (PMplatto用)';
COMMENT ON TABLE platto_calendar_tasks IS 'カレンダータスク管理テーブル (PMplatto用)';  
COMMENT ON TABLE platto_team_dashboard IS '制作チーム用の共有ダッシュボード情報 (PMplatto用)';
COMMENT ON COLUMN platto_team_dashboard.widget_type IS 'ウィジェットタイプ: quicklinks, memo, tasks, schedule';
COMMENT ON COLUMN platto_team_dashboard.content IS 'ウィジェットの内容をJSON形式で格納';
COMMENT ON COLUMN platto_team_dashboard.sort_order IS 'ダッシュボード内での表示順序';