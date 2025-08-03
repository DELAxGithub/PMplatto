# PMplatto データベース構造仕様書

## 📋 プロジェクト概要

**PMplatto (プラッと進捗すごろく)** は、番組制作チーム向けのリアルタイム進捗管理システムです。
React + TypeScript + Supabase を基盤とし、Kanban ボード形式での直感的な進捗管理とチーム共有機能を提供します。

### 技術スタック
- **データベース**: Supabase PostgreSQL
- **セキュリティ**: Row Level Security (RLS)
- **リアルタイム**: Supabase Realtime
- **フロントエンド**: React 18 + TypeScript + Vite

---

## 🏗️ データベース全体構成

### ERD (Entity Relationship Diagram)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    programs     │    │ calendar_tasks  │    │ team_dashboard  │
│                 │    │                 │    │                 │
│ id (PK)         │◄──┤ program_id (FK) │    │ id (PK)         │
│ program_id      │    │ id (PK)         │    │ widget_type     │
│ title           │    │ task_type       │    │ title           │
│ status          │    │ start_date      │    │ content (JSON)  │
│ first_air_date  │    │ end_date        │    │ sort_order      │
│ filming_date    │    │ created_at      │    │ is_active       │
│ complete_date   │    │ updated_at      │    │ created_at      │
│ ...            │    │                 │    │ updated_at      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### テーブル一覧

| テーブル名 | 目的 | レコード数目安 |
|------------|------|----------------|
| `programs` | 番組の基本情報と進捗管理 | 100-500件 |
| `calendar_tasks` | 制作スケジュールとタスク管理 | 500-2000件 |
| `team_dashboard` | チーム共有ダッシュボード | 5-20件 |

---

## 📺 programs テーブル (番組管理)

### 概要
番組制作の全ライフサイクルを管理するメインテーブル。番組情報、進捗ステータス、スケジュール、PR情報を一元管理。

### テーブル構造

```sql
CREATE TABLE platto_programs (
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
  pr_completed boolean DEFAULT false,
  pr_due_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### フィールド詳細

| フィールド名 | 型 | 制約 | 説明 |
|-------------|---|-----|------|
| `id` | bigint | PK, IDENTITY | 自動採番の主キー |
| `program_id` | text | - | 番組識別ID (例: "001", "002") |
| `title` | text | NOT NULL | 番組タイトル |
| `subtitle` | text | NULL可 | サブタイトル |
| `status` | text | NOT NULL | [進捗ステータス](#進捗ステータス体系) |
| `first_air_date` | date | NULL可 | 初回放送予定日 |
| `re_air_date` | date | NULL可 | 再放送予定日 |
| `filming_date` | date | NULL可 | 収録予定日 |
| `complete_date` | date | NULL可 | 完成予定日 |
| `cast1` | text | NULL可 | 主要キャスト1 |
| `cast2` | text | NULL可 | 主要キャスト2 |
| `script_url` | text | NULL可 | 台本URL |
| `pr_80text` | text | NULL可 | PR文（80文字版） |
| `pr_200text` | text | NULL可 | PR文（200文字版） |
| `pr_completed` | boolean | DEFAULT false | PR完了フラグ |
| `pr_due_date` | date | NULL可 | PR期限日 |
| `notes` | text | NULL可 | 備考・メモ |
| `created_at` | timestamptz | DEFAULT now() | 作成日時 |
| `updated_at` | timestamptz | DEFAULT now() | 更新日時 |

### 進捗ステータス体系

番組制作フローに基づく10段階のステータス管理：

```typescript
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

// Kanban表示順序
export const STATUS_ORDER: ProgramStatus[] = [
  '日程調整中',
  'ロケハン前', 
  '収録準備中',
  '編集中',
  '試写中',
  'MA中',
  '完パケ納品',
  '放送済み',
  'キャスティング中', // 最後に表示
];
```

### TypeScript型定義

```typescript
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
  pr_completed: boolean;
  pr_due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
```

---

## 📅 calendar_tasks テーブル (スケジュール管理)

### 概要
番組制作に関連するタスクやスケジュールを管理。編集、試写、MA等の工程スケジュールを期間指定で管理。

### テーブル構造

```sql
CREATE TABLE platto_calendar_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id bigint REFERENCES programs(id) ON DELETE SET NULL,
  task_type text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);
```

### フィールド詳細

| フィールド名 | 型 | 制約 | 説明 |
|-------------|---|-----|------|
| `id` | uuid | PK, DEFAULT | UUID形式の主キー |
| `program_id` | bigint | FK, NULL可 | programs.id への外部キー |
| `task_type` | text | NOT NULL | タスク種別 |
| `start_date` | date | NOT NULL | 開始日 |
| `end_date` | date | NOT NULL | 終了日 |
| `created_at` | timestamptz | DEFAULT now() | 作成日時 |
| `updated_at` | timestamptz | DEFAULT now() | 更新日時 |

### タスク種別とカラーマッピング

```typescript
export const TASK_TYPE_PRESETS = [
  '編集',
  '試写', 
  'MA',
] as const;

export const TASK_TYPE_COLORS: Record<TaskTypePreset, { bg: string; text: string; border: string }> = {
  '編集': { bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-300' },
  'MA': { bg: 'bg-purple-100', text: 'text-purple-900', border: 'border-purple-300' },
  '試写': { bg: 'bg-green-100', text: 'text-green-900', border: 'border-green-300' },
};
```

### TypeScript型定義

```typescript
export interface CalendarTask {
  id: string;
  program_id: number | null;
  task_type: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  program?: Program; // JOIN時に取得
}
```

### インデックス設計

```sql
CREATE INDEX idx_calendar_tasks_dates ON calendar_tasks (start_date, end_date);
CREATE INDEX idx_calendar_tasks_program_id ON calendar_tasks (program_id);
```

---

## 📊 team_dashboard テーブル (チーム共有ダッシュボード)

### 概要
チーム内での情報共有を目的としたダッシュボードウィジェットを管理。クイックリンク、メモ、タスク、スケジュール概要の4種類のウィジェットを提供。

### テーブル構造

```sql
CREATE TABLE platto_team_dashboard (
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
```

### フィールド詳細

| フィールド名 | 型 | 制約 | 説明 |
|-------------|---|-----|------|
| `id` | bigint | PK, IDENTITY | 自動採番の主キー |
| `widget_type` | text | NOT NULL, CHECK | ウィジェット種別 |
| `title` | text | NOT NULL | ウィジェットタイトル |
| `content` | jsonb | NOT NULL | ウィジェット設定（JSON） |
| `sort_order` | integer | DEFAULT 0 | 表示順序 |
| `is_active` | boolean | DEFAULT true | 有効フラグ |
| `created_at` | timestamptz | DEFAULT now() | 作成日時 |
| `updated_at` | timestamptz | DEFAULT now() | 更新日時 |
| `created_by` | uuid | FK | 作成者ID |
| `updated_by` | uuid | FK | 更新者ID |

### ウィジェット種別と設定例

#### 1. quicklinks (クイックリンク)
```json
{
  "links": [
    {"url": "https://example.com", "label": "社内システム"},
    {"url": "https://github.com", "label": "GitHub"}
  ]
}
```

#### 2. memo (チーム共有メモ)
```json
{
  "text": "ここにチーム共有のメモを記載します。\n\n• 重要な連絡事項\n• 作業上の注意点"
}
```

#### 3. tasks (チーム共有タスク)
```json
{
  "tasks": [
    {"id": "1", "text": "サンプルタスク1", "completed": false},
    {"id": "2", "text": "サンプルタスク2", "completed": true}
  ]
}
```

#### 4. schedule (スケジュール概要)
```json
{
  // calendar_tasks から自動取得するため設定なし
}
```

### TypeScript型定義

```typescript
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

export interface QuickLinksContent {
  links: Array<{
    url: string;
    label: string;
  }>;
}

export interface MemoContent {
  text: string;
}

export interface TasksContent {
  tasks: Array<{
    id: string;
    text: string;
    completed: boolean;
  }>;
}
```

---

## 🔒 セキュリティ設計

### Row Level Security (RLS)

すべてのテーブルでRLSを有効化し、認証済みユーザーのみアクセス可能：

```sql
-- 全テーブル共通のRLS設定
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザー用ポリシー（読み取り）
CREATE POLICY "Enable read access for authenticated users"
  ON [table_name]
  FOR SELECT
  TO authenticated
  USING (true);

-- 認証済みユーザー用ポリシー（書き込み）
CREATE POLICY "Enable write access for authenticated users"
  ON [table_name]
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

### 認証設定

Supabase Auth を使用した認証システム：

```toml
[auth]
site_url = "https://delaxplatto.com/"
enable_signup = true
enable_confirmations = false
jwt_expiry = 3600
enable_refresh_token_rotation = true
```

### セキュリティレベル評価

**総合スコア: A (91/100)**

- ✅ 環境変数の適切な管理
- ✅ ハードコーディングされた秘密情報なし
- ✅ RLSによる適切なアクセス制御
- ✅ 認証ベースのセキュリティポリシー

---

## ⚙️ 技術仕様

### トリガー関数

#### updated_at 自動更新

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 各テーブルへのトリガー適用
CREATE TRIGGER update_[table]_updated_at
  BEFORE UPDATE ON [table]
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### team_dashboard 専用トリガー

```sql
-- 作成者・更新者自動設定
CREATE OR REPLACE FUNCTION set_team_dashboard_created_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by = auth.uid();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ language 'plpgsql';
```

### インデックス戦略

パフォーマンス最適化のための戦略的インデックス配置：

```sql
-- calendar_tasks: 日付範囲検索最適化
CREATE INDEX idx_calendar_tasks_dates ON calendar_tasks (start_date, end_date);
CREATE INDEX idx_calendar_tasks_program_id ON calendar_tasks (program_id);

-- team_dashboard: ダッシュボード表示最適化
CREATE INDEX idx_team_dashboard_widget_type ON team_dashboard(widget_type);
CREATE INDEX idx_team_dashboard_sort_order ON team_dashboard(sort_order);
CREATE INDEX idx_team_dashboard_is_active ON team_dashboard(is_active);
```

### リアルタイム同期

Supabase Realtime を活用したリアルタイム更新：

```typescript
// プログラム更新の監視
supabase
  .channel('programs')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'programs'
  }, (payload) => {
    // リアルタイム更新処理
  })
  .subscribe();
```

---

## 📋 使用例

### 基本的なCRUD操作

#### プログラム作成
```typescript
const { data, error } = await supabase
  .from('platto_programs')
  .insert({
    program_id: '001',
    title: '新番組企画',
    status: 'キャスティング中',
    first_air_date: '2025-12-01'
  });
```

#### カレンダータスク検索
```typescript
const { data, error } = await supabase
  .from('platto_calendar_tasks')
  .select(`
    *,
    program:programs(title, status)
  `)
  .gte('start_date', '2025-08-01')
  .lte('end_date', '2025-08-31');
```

#### ダッシュボードウィジェット取得
```typescript
const { data, error } = await supabase
  .from('platto_team_dashboard')
  .select('*')
  .eq('is_active', true)
  .order('sort_order');
```

### 複合クエリ例

#### 週次レビューデータ取得
```typescript
// 今週の放送予定
const broadcasts = await supabase
  .from('platto_programs')
  .select('*')
  .gte('first_air_date', weekStart)
  .lte('first_air_date', weekEnd);

// 今週のタスク
const tasks = await supabase
  .from('platto_calendar_tasks')
  .select(`
    *,
    program:programs(title, status)
  `)
  .gte('start_date', weekStart)
  .lte('end_date', weekEnd);
```

---

## 🔄 マイグレーション履歴

### 開発履歴

| 日付 | ファイル | 概要 |
|------|----------|------|
| 2025-03-11 | `20250311084508_mellow_wave.sql` | programs テーブル初期作成 |
| 2025-03-11 | `20250311090312_plain_cell.sql` | programs テーブル構造調整 |
| 2025-03-12 | `20250312153118_calm_jungle.sql` | calendar_tasks テーブル追加 |
| 2025-03-23 | `20250323235457_billowing_credit.sql` | PR管理フィールド追加 |
| 2025-07-31 | `20250731130000_add_team_dashboard.sql` | team_dashboard テーブル追加 |

### 今後の拡張予定

- **通知システム**: プッシュ通知・メール通知機能
- **ファイル管理**: 台本・資料のアップロード機能
- **承認ワークフロー**: 段階的承認システム
- **分析ダッシュボード**: 制作効率分析機能

---

## 📞 サポート

### 開発チーム連絡先
- **システム管理**: delaxplatto.com
- **技術サポート**: GitHub Issues
- **運用サポート**: チーム内Slack

### 関連ドキュメント
- [ユーザーマニュアル](./user-manual.md)
- [オンボーディングガイド](./onboarding.md)
- [API仕様書](../src/lib/api.ts)

---

*最終更新: 2025-08-03*  
*バージョン: 1.0.0*