import { Program } from './program';

export interface CalendarTask {
  id: string;
  program_id: number | null;
  task_type: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  program?: Program;
}

export interface NewCalendarTask {
  program_id: number | null;
  task_type: string;
  start_date: string;
  end_date: string;
}

export type UpdateCalendarTask = Partial<NewCalendarTask>;

// タスク種別の優先順位を定義
export const TASK_TYPE_PRESETS = [
  '編集',
  '試写',
  'MA',
] as const;

export type TaskTypePreset = typeof TASK_TYPE_PRESETS[number];

// タスク種別ごとの色設定を改善（コントラストを向上）
export const TASK_TYPE_COLORS: Record<TaskTypePreset, { bg: string; text: string; border: string }> = {
  '編集': { bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-300' },
  'MA': { bg: 'bg-purple-100', text: 'text-purple-900', border: 'border-purple-300' },
  '試写': { bg: 'bg-green-100', text: 'text-green-900', border: 'border-green-300' },
};

// カスタムタスク種別のデフォルト色も改善
export const DEFAULT_TASK_COLOR = {
  bg: 'bg-gray-100',
  text: 'text-gray-900',
  border: 'border-gray-300'
};