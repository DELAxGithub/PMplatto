export type ProgramStatus =
  | 'キャスティング中'
  | '日程調整中'
  | 'ロケハン前'
  | '収録準備中'
  | '編集中'
  | '試写中'
  | 'MA中'
  | '完パケ納品'
  | '放送済み';

// ステータスの順序を定義
export const STATUS_ORDER: ProgramStatus[] = [
  '日程調整中',
  'ロケハン前',
  '収録準備中',
  '編集中',
  '試写中',
  'MA中',
  '完パケ納品',
  '放送済み',
  'キャスティング中', // 表示順序の最後に配置
];

export interface Program {
  id: number;
  program_id: string;
  title: string;
  subtitle: string | null;
  status: ProgramStatus;
  first_air_date: string | null;
  re_air_date: string | null;
  filming_date: string | null;
  complete_date: string | null;
  cast1: string | null;
  cast2: string | null;
  script_url: string | null;
  pr_80text: string | null;
  pr_200text: string | null;
  notes: string | null;
  pr_completed: boolean;
  pr_due_date: string | null;
  created_at: string;
  updated_at: string;
}

export type NewProgram = Omit<Program, 'id' | 'created_at' | 'updated_at'>;
export type UpdateProgram = Partial<NewProgram>;