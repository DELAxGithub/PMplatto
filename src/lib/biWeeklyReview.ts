import { startOfWeek, endOfWeek, subWeeks, format, parseISO, addDays } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
import { supabase } from './supabase';
import type { Program, ProgramStatus } from '../types/program';
import type { CalendarTask } from '../types/calendar-task';

const TIME_ZONE = 'Asia/Tokyo';

export interface BiWeeklyReviewData {
  week1: WeekData;
  week2: WeekData;
}

export interface WeekData {
  weekLabel: string;
  dateRange: string;
  broadcasts: Array<{
    date: string;
    program: Program;
  }>;
  recordings: Array<{
    date: string;
    program: Program;
  }>;
  tasks: Array<{
    date: string;
    task: CalendarTask;
    program?: Program;
  }>;
}

export async function generateBiWeeklyReview(): Promise<BiWeeklyReviewData> {
  const now = utcToZonedTime(new Date(), TIME_ZONE);
  
  // Week 1 (今週): 月曜日開始
  const week1Start = startOfWeek(now, { weekStartsOn: 1 });
  const week1End = endOfWeek(week1Start, { weekStartsOn: 1 });
  
  // Week 2 (来週)
  const week2Start = addDays(week1End, 1);
  const week2End = endOfWeek(week2Start, { weekStartsOn: 1 });

  console.log('📅 期間設定:');
  console.log(`Week 1: ${format(week1Start, 'yyyy-MM-dd')} 〜 ${format(week1End, 'yyyy-MM-dd')}`);
  console.log(`Week 2: ${format(week2Start, 'yyyy-MM-dd')} 〜 ${format(week2End, 'yyyy-MM-dd')}`);

  // Week 1 データ取得
  const week1Data = await getWeekData(week1Start, week1End, 'Week 1 (今週)');
  
  // Week 2 データ取得
  const week2Data = await getWeekData(week2Start, week2End, 'Week 2 (来週)');

  return {
    week1: week1Data,
    week2: week2Data,
  };
}

async function getWeekData(weekStart: Date, weekEnd: Date, weekLabel: string): Promise<WeekData> {
  const startDate = format(weekStart, 'yyyy-MM-dd');
  const endDate = format(weekEnd, 'yyyy-MM-dd');

  // 放送・収録予定を取得
  const { data: programs } = await supabase
    .from('platto_programs')
    .select('*')
    .or(`first_air_date.gte.${startDate},filming_date.gte.${startDate}`)
    .or(`first_air_date.lte.${endDate},filming_date.lte.${endDate}`);

  // 完パケ納品予定を取得
  const { data: completePrograms } = await supabase
    .from('platto_programs')
    .select('*')
    .gte('complete_date', startDate)
    .lte('complete_date', endDate);

  // タスクを取得
  const { data: tasks } = await supabase
    .from('platto_calendar_tasks')
    .select(`
      *,
      program:platto_programs (
        id,
        program_id,
        title,
        status
      )
    `)
    .gte('start_date', startDate)
    .lte('end_date', endDate);


  const weekData: WeekData & { completePrograms?: Program[] } = {
    weekLabel,
    dateRange: `${format(weekStart, 'M/d')} 〜 ${format(weekEnd, 'M/d')}`,
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
    
    completePrograms: (completePrograms || []) as Program[]
  };

  return weekData;
}


export function formatBiWeeklyReviewText(data: BiWeeklyReviewData): string {
  const now = new Date();
  const reportDate = format(now, 'yyyy年M月d日');
  
  let report = '';
  
  // ヘッダー
  report += `📊 今後2週間の制作予定 (${reportDate})\n`;
  report += `${'='.repeat(50)}\n\n`;
  
  // Week 1 (今週) 予定
  report += `## 📅 ${data.week1.weekLabel} ${data.week1.dateRange}\n\n`;
  
  // 今週のイベントをすべて日付順に統合  
  const week1Events = [
    ...data.week1.broadcasts.map(b => ({ 
      ...b, 
      type: '📢 放送', 
      title: formatProgramTitle(b.program)
    })),
    ...data.week1.recordings.map(r => ({ 
      ...r, 
      type: '📍 収録', 
      title: formatProgramTitle(r.program)
    })),
    ...data.week1.tasks.map(t => ({
      date: t.date,
      type: '📝 タスク',
      title: `${t.task.task_type}${t.program ? ` - ${formatProgramTitle(t.program)}` : ''}`
    }))
  ];

  // 完パケ納品日を追加
  const week1CompleteEvents = ((data.week1 as any).completePrograms || [])
    .map((program: Program) => ({
      date: program.complete_date!,
      type: '📦 完パケ納品',
      title: formatProgramTitle(program)
    }));

  const allWeek1Events = [...week1Events, ...week1CompleteEvents].sort((a, b) => a.date.localeCompare(b.date));
  
  if (allWeek1Events.length > 0) {
    allWeek1Events.forEach(event => {
      report += `• ${event.date} ${event.type} ${event.title}\n`;
    });
  } else {
    report += `• 今週は特に予定されているイベントはありません\n`;
  }
  
  report += `\n${'-'.repeat(40)}\n\n`;
  
  // Week 2 (来週) 予定
  report += `## 📅 ${data.week2.weekLabel} ${data.week2.dateRange}\n\n`;
  
  // 来週のイベントをすべて日付順に統合
  const week2Events = [
    ...data.week2.broadcasts.map(b => ({ 
      ...b, 
      type: '📢 放送', 
      title: formatProgramTitle(b.program)
    })),
    ...data.week2.recordings.map(r => ({ 
      ...r, 
      type: '📍 収録', 
      title: formatProgramTitle(r.program)
    })),
    ...data.week2.tasks.map(t => ({
      date: t.date,
      type: '📝 タスク', 
      title: `${t.task.task_type}${t.program ? ` - ${formatProgramTitle(t.program)}` : ''}`
    }))
  ];

  // 完パケ納品日を追加
  const week2CompleteEvents = ((data.week2 as any).completePrograms || [])
    .map((program: Program) => ({
      date: program.complete_date!,
      type: '📦 完パケ納品',
      title: formatProgramTitle(program)
    }));

  const allWeek2Events = [...week2Events, ...week2CompleteEvents].sort((a, b) => a.date.localeCompare(b.date));
  
  if (allWeek2Events.length > 0) {
    allWeek2Events.forEach(event => {
      report += `• ${event.date} ${event.type} ${event.title}\n`;
    });
  } else {
    report += `• 来週は特に予定されているイベントはありません\n`;
  }
  
  report += '\n';
  report += `${'='.repeat(50)}\n`;
  report += `📝 Generated: ${reportDate} (月曜朝の週次レビュー)\n`;
  
  return report;
}

function isWithinWeek(dateStr: string, weekStart: Date, weekEnd: Date): boolean {
  const date = parseISO(dateStr);
  return date >= weekStart && date <= weekEnd;
}

function formatProgramTitle(program: Program): string {
  let title = `[${program.program_id}] ${program.title}`;
  
  if (program.subtitle) {
    title += ` ${program.subtitle}`;
  }
  
  const castInfo = [];
  if (program.cast1) castInfo.push(program.cast1);
  if (program.cast2) castInfo.push(program.cast2);
  
  if (castInfo.length > 0) {
    title += ` (出演: ${castInfo.join('、')})`;
  }
  
  return title;
}

// テスト用関数
export async function runBiWeeklyReportTest(): Promise<void> {
  try {
    console.log('🚀 2週間レビュー生成開始...\n');
    
    const reviewData = await generateBiWeeklyReview();
    const reportText = formatBiWeeklyReviewText(reviewData);
    
    console.log(reportText);
    
    console.log('\n✅ 2週間レビュー生成完了');
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    throw error;
  }
}