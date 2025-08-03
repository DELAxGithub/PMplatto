import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { startOfWeek, endOfWeek, format, parseISO, addDays } from 'https://esm.sh/date-fns@3.6.0'
import { zonedTimeToUtc, utcToZonedTime } from 'https://esm.sh/date-fns-tz@2.0.1'

const TIME_ZONE = 'Asia/Tokyo';

interface Program {
  id: number;
  program_id: string;
  title: string;
  subtitle: string | null;
  status: string;
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

interface CalendarTask {
  id: string;
  program_id: number | null;
  task_type: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  program?: Program;
}

interface WeekData {
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
  completePrograms?: Program[];
}

interface BiWeeklyReviewData {
  week1: WeekData;
  week2: WeekData;
}

serve(async (req) => {
  try {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    // Supabase client initialization - try both service role key and anon key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    console.log('🚀 週報生成開始...')
    console.log('🔗 Supabase URL:', supabaseUrl)
    console.log('🔑 Service Role Key exists:', !!supabaseServiceKey)
    console.log('🔑 Service Role Key length:', supabaseServiceKey?.length || 0)
    console.log('🔑 Anon Key exists:', !!supabaseAnonKey)
    console.log('🔑 Anon Key length:', supabaseAnonKey?.length || 0)
    
    // 環境変数デバッグ
    console.log('🔍 Available environment variables:')
    console.log('- SUPABASE_URL:', !!Deno.env.get('SUPABASE_URL'))
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))
    console.log('- SUPABASE_ANON_KEY:', !!Deno.env.get('SUPABASE_ANON_KEY'))
    console.log('- SLACK_WEBHOOK_URL:', !!Deno.env.get('SLACK_WEBHOOK_URL'))
    
    // まずAnon Keyでテストしてみる（フロントエンドと同じ認証方法）
    console.log('🔑 Trying with ANON KEY first (same as frontend)...')
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Test database connection first
    console.log('🧪 Testing database connection...')
    
    // 1. まずplatto_programsテーブルの存在確認
    console.log('🧪 Testing platto_programs table existence...')
    const { data: testData, error: testError } = await supabase
      .from('platto_programs')
      .select('id, program_id, title, status')
      .limit(3)
    
    console.log('🧪 Test query result:', testData)
    console.log('🧪 Test query error:', testError)
    
    // 2. 総件数を確認
    console.log('🧪 Testing platto_programs count...')
    const { count, error: countError } = await supabase
      .from('platto_programs')
      .select('id', { count: 'exact' })
    
    console.log('🧪 Total programs count:', count)
    console.log('🧪 Count query error:', countError)
    
    // 3. platto_calendar_tasksも確認
    console.log('🧪 Testing platto_calendar_tasks...')
    const { data: tasksData, error: tasksError } = await supabase
      .from('platto_calendar_tasks')
      .select('id, task_type, start_date')
      .limit(3)
    
    console.log('🧪 Calendar tasks sample:', tasksData)
    console.log('🧪 Calendar tasks error:', tasksError)

    // Generate bi-weekly review data
    const reviewData = await generateBiWeeklyReview(supabase)
    
    // Format for Slack
    const slackMessage = formatSlackMessage(reviewData)
    
    // Slack送信を一時的に無効化（テスト中）
    console.log('📝 Slack message prepared (sending disabled for testing):', JSON.stringify(slackMessage, null, 2))
    
    let slackStatus = 'テスト中のため送信無効化'
    
    // const webhookUrl = Deno.env.get('SLACK_WEBHOOK_URL')
    // if (webhookUrl) {
    //   try {
    //     const slackResponse = await fetch(webhookUrl, {
    //       method: 'POST',
    //       headers: {
    //         'Content-Type': 'application/json',
    //       },
    //       body: JSON.stringify(slackMessage),
    //     })

    //     if (slackResponse.ok) {
    //       console.log('✅ Slack notification sent successfully')
    //       slackStatus = '送信成功'
    //     } else {
    //       console.warn(`⚠️ Slack notification failed: ${slackResponse.statusText}`)
    //       slackStatus = `送信失敗: ${slackResponse.statusText}`
    //     }
    //   } catch (error) {
    //     console.warn('⚠️ Slack notification error:', error)
    //     slackStatus = `送信エラー: ${error.message}`
    //   }
    // }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Weekly report generated successfully (Slack: ${slackStatus})`,
        data: reviewData,
        slack_status: slackStatus
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

async function generateBiWeeklyReview(supabase: any): Promise<BiWeeklyReviewData> {
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
  const week1Data = await getWeekData(supabase, week1Start, week1End, 'Week 1 (今週)');
  
  // Week 2 データ取得
  const week2Data = await getWeekData(supabase, week2Start, week2End, 'Week 2 (来週)');

  return {
    week1: week1Data,
    week2: week2Data,
  };
}

async function getWeekData(supabase: any, weekStart: Date, weekEnd: Date, weekLabel: string): Promise<WeekData> {
  const startDate = format(weekStart, 'yyyy-MM-dd');
  const endDate = format(weekEnd, 'yyyy-MM-dd');

  // 放送・収録予定を取得
  console.log('📊 Querying programs for period:', startDate, 'to', endDate);
  console.log('📊 Query: platto_programs table');
  const { data: programs, error: programsError } = await supabase
    .from('platto_programs')
    .select('*')
    .or(`first_air_date.gte.${startDate},filming_date.gte.${startDate}`)
    .or(`first_air_date.lte.${endDate},filming_date.lte.${endDate}`);
  
  if (programsError) {
    console.error('❌ Programs query error:', programsError);
    console.error('❌ Error details:', JSON.stringify(programsError, null, 2));
  } else {
    console.log('📊 Programs found:', programs?.length || 0);
    console.log('📊 Sample program data:', programs?.slice(0, 2));
  }

  // 完パケ納品予定を取得
  const { data: completePrograms, error: completeError } = await supabase
    .from('platto_programs')
    .select('*')
    .gte('complete_date', startDate)
    .lte('complete_date', endDate);
    
  if (completeError) {
    console.error('❌ Complete programs query error:', completeError);
  } else {
    console.log('📦 Complete programs found:', completePrograms?.length || 0);
  }

  // タスクを取得
  const { data: tasks, error: tasksError } = await supabase
    .from('platto_calendar_tasks')
    .select(`
      *,
      program:platto_programs (
        id,
        program_id,
        title,
        status,
        subtitle,
        cast1,
        cast2
      )
    `)
    .gte('start_date', startDate)
    .lte('end_date', endDate);
    
  if (tasksError) {
    console.error('❌ Tasks query error:', tasksError);
  } else {
    console.log('📝 Tasks found:', tasks?.length || 0);
  }

  const weekData: WeekData = {
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

function formatSlackMessage(data: BiWeeklyReviewData) {
  const now = new Date();
  const reportDate = format(now, 'yyyy年M月d日');
  
  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `📊 今後2週間の制作予定 (${reportDate})`
      }
    },
    {
      type: "divider"
    }
  ];

  // Week 1 (今週)
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*📅 ${data.week1.weekLabel} ${data.week1.dateRange}*`
    }
  });

  // 今週のイベント
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
    })),
    ...(data.week1.completePrograms || []).map(p => ({
      date: p.complete_date!,
      type: '📦 完パケ納品',
      title: formatProgramTitle(p)
    }))
  ].sort((a, b) => a.date.localeCompare(b.date));

  if (week1Events.length > 0) {
    const eventText = week1Events
      .map(event => `• ${event.date} ${event.type} ${event.title}`)
      .join('\n');
    
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: eventText
      }
    });
  } else {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "• 今週は特に予定されているイベントはありません"
      }
    });
  }

  blocks.push({
    type: "divider"
  });

  // Week 2 (来週)
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*📅 ${data.week2.weekLabel} ${data.week2.dateRange}*`
    }
  });

  // 来週のイベント
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
    })),
    ...(data.week2.completePrograms || []).map(p => ({
      date: p.complete_date!,
      type: '📦 完パケ納品',
      title: formatProgramTitle(p)
    }))
  ].sort((a, b) => a.date.localeCompare(b.date));

  if (week2Events.length > 0) {
    const eventText = week2Events
      .map(event => `• ${event.date} ${event.type} ${event.title}`)
      .join('\n');
    
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: eventText
      }
    });
  } else {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "• 来週は特に予定されているイベントはありません"
      }
    });
  }

  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `📝 Generated: ${reportDate} (月曜朝の週次レビュー)`
      }
    ]
  });

  return {
    text: `📊 今後2週間の制作予定 (${reportDate})`,
    blocks: blocks
  };
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

function isWithinWeek(dateStr: string, weekStart: Date, weekEnd: Date): boolean {
  const date = parseISO(dateStr);
  return date >= weekStart && date <= weekEnd;
}