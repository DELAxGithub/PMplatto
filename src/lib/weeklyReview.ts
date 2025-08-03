import { startOfWeek, endOfWeek, subWeeks, format, parseISO } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
import { supabase } from './supabase';
import type { Program, ProgramStatus } from '../types/program';
import type { CalendarTask } from '../types/calendar-task';
import type { WeeklyReviewData, SlackMessage } from '../types/weekly-review';

const TIME_ZONE = 'Asia/Tokyo';

export async function generateWeeklyReview(): Promise<WeeklyReviewData> {
  const now = utcToZonedTime(new Date(), TIME_ZONE);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // 月曜日開始
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const lastWeekStart = subWeeks(weekStart, 1);

  // 今週の放送・収録予定を取得
  const { data: programs } = await supabase
    .from('platto_programs')
    .select('*')
    .or(`first_air_date.gte.${format(weekStart, 'yyyy-MM-dd')},filming_date.gte.${format(weekStart, 'yyyy-MM-dd')}`)
    .or(`first_air_date.lte.${format(weekEnd, 'yyyy-MM-dd')},filming_date.lte.${format(weekEnd, 'yyyy-MM-dd')}`);

  // 今週のタスクを取得
  const { data: tasks } = await supabase
    .from('platto_calendar_tasks')
    .select(`
      *,
      program:platto_programs (
        id,
        program_id,
        title
      )
    `)
    .gte('start_date', format(weekStart, 'yyyy-MM-dd'))
    .lte('end_date', format(weekEnd, 'yyyy-MM-dd'));

  // 先週の更新情報を取得
  const { data: recentPrograms } = await supabase
    .from('platto_programs')
    .select('*')
    .gte('updated_at', format(lastWeekStart, 'yyyy-MM-dd'));

  // ステータス別の番組数を集計
  const { data: allPrograms } = await supabase
    .from('platto_programs')
    .select('status');

  const statusSummary = (allPrograms || []).reduce((acc: Record<ProgramStatus, number>, program) => {
    acc[program.status as ProgramStatus] = (acc[program.status as ProgramStatus] || 0) + 1;
    return acc;
  }, {} as Record<ProgramStatus, number>);

  // 週次レビューデータを構築
  const weeklyReviewData: WeeklyReviewData = {
    weeklySchedule: {
      broadcasts: (programs || [])
        .filter(p => p.first_air_date && isWithinWeek(p.first_air_date, weekStart, weekEnd))
        .map(program => ({
          date: program.first_air_date!,
          program: program as Program,
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),

      recordings: (programs || [])
        .filter(p => p.filming_date && isWithinWeek(p.filming_date, weekStart, weekEnd))
        .map(program => ({
          date: program.filming_date!,
          program: program as Program,
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),

      tasks: (tasks || [])
        .map(task => ({
          date: task.start_date,
          task: task as CalendarTask,
          program: task.program as Program | undefined,
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    },
    statusSummary,
    recentUpdates: {
      newPrograms: (recentPrograms || [])
        .filter(p => {
          const createdAt = parseISO(p.created_at);
          return createdAt >= lastWeekStart && createdAt <= weekEnd;
        }) as Program[],
      statusChanges: [], // Note: Status changes would require audit log or history table
    },
  };

  return weeklyReviewData;
}

export function formatSlackMessage(data: WeeklyReviewData): SlackMessage {
  const message: SlackMessage = {
    text: "📊 週次番組レビュー",
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "📊 週次番組レビュー"
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*📅 今週の予定*"
        }
      }
    ]
  };

  // 放送予定
  if (data.weeklySchedule.broadcasts.length > 0) {
    message.blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "📢 *放送予定*\n" + data.weeklySchedule.broadcasts
          .map(b => `• ${b.date} ${b.program.program_id} ${b.program.title}`)
          .join("\n")
      }
    });
  }

  // 収録予定
  if (data.weeklySchedule.recordings.length > 0) {
    message.blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "📍 *収録予定*\n" + data.weeklySchedule.recordings
          .map(r => `• ${r.date} ${r.program.program_id} ${r.program.title}`)
          .join("\n")
      }
    });
  }

  // タスク予定
  if (data.weeklySchedule.tasks.length > 0) {
    message.blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "📝 *タスク予定*\n" + data.weeklySchedule.tasks
          .map(t => `• ${t.date} ${t.task.task_type}${t.program ? ` (${t.program.program_id})` : ''}`)
          .join("\n")
      }
    });
  }

  // ステータスサマリー
  message.blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*📊 番組状況*\n" + Object.entries(data.statusSummary)
        .map(([status, count]) => `• ${status}: ${count}件`)
        .join("\n")
    }
  });

  // 新規番組
  if (data.recentUpdates.newPrograms.length > 0) {
    message.blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "🆕 *新規番組*\n" + data.recentUpdates.newPrograms
          .map(p => `• ${p.program_id} ${p.title}`)
          .join("\n")
      }
    });
  }

  return message;
}

export async function sendToSlack(message: SlackMessage): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error('Slack Webhook URL is not configured');
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Failed to send message to Slack: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error sending message to Slack:', error);
    throw error;
  }
}

function isWithinWeek(dateStr: string, weekStart: Date, weekEnd: Date): boolean {
  const date = parseISO(dateStr);
  return date >= weekStart && date <= weekEnd;
}