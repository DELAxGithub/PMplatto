export interface DashboardWidget {
  id: string;
  widget_type: 'quicklinks' | 'memo' | 'tasks' | 'schedule';
  title: string;
  content: QuickLinksContent | MemoContent | TasksContent | ScheduleContent;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuickLink {
  url: string;
  label: string;
}

export interface QuickLinksContent {
  links: QuickLink[];
}

export interface MemoContent {
  text: string;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export interface TasksContent {
  tasks: Task[];
}

export interface ScheduleContent {
  // スケジュール概要は calendar_tasks から自動取得するため空
  placeholder?: never;
}