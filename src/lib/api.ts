import { supabase } from './supabase';
import type { Program, NewProgram, UpdateProgram } from '../types/program';
import type { CalendarTask, NewCalendarTask, UpdateCalendarTask } from '../types/calendar-task';

// 既存のプログラム関連の関数
export async function getPrograms() {
  const { data, error } = await supabase
    .from('platto_programs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Program[];
}

export async function createProgram(program: NewProgram) {
  const { data, error } = await supabase
    .from('platto_programs')
    .insert([program])
    .select()
    .single();

  if (error) throw error;
  return data as Program;
}

export async function updateProgram(id: number, updates: UpdateProgram) {
  console.log('🔄 API: Updating program', id, 'with data:', updates);
  
  // First check if we can read the record
  const { data: currentData, error: readError } = await supabase
    .from('platto_programs')
    .select('*')
    .eq('id', id)
    .single();
    
  if (readError) {
    console.error('❌ API: Cannot read program for update:', readError);
    throw readError;
  }
  
  console.log('📖 API: Current program data:', currentData);
  
  const { data, error } = await supabase
    .from('platto_programs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  console.log('🔄 API: Update result:', { data, error });
  
  if (error) {
    console.error('❌ API: Update failed:', error);
    console.error('❌ Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    throw error;
  }
  
  console.log('✅ API: Update successful, returning:', data);
  return data as Program;
}

export async function deleteProgram(id: number) {
  const { error } = await supabase
    .from('platto_programs')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// カレンダータスク関連の関数
export async function getCalendarTasks() {
  const { data, error } = await supabase
    .from('platto_calendar_tasks')
    .select(`
      *,
      program:platto_programs (
        id,
        program_id,
        title
      )
    `)
    .order('start_date', { ascending: true });

  if (error) throw error;
  return data as (CalendarTask & { program: Program | null })[];
}

export async function createCalendarTask(task: NewCalendarTask) {
  const { data, error } = await supabase
    .from('platto_calendar_tasks')
    .insert([task])
    .select(`
      *,
      program:platto_programs (
        id,
        program_id,
        title
      )
    `)
    .single();

  if (error) throw error;
  return data as CalendarTask & { program: Program | null };
}

export async function updateCalendarTask(id: string, updates: UpdateCalendarTask) {
  const { data, error } = await supabase
    .from('platto_calendar_tasks')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      program:platto_programs (
        id,
        program_id,
        title
      )
    `)
    .single();

  if (error) throw error;
  return data as CalendarTask & { program: Program | null };
}

export async function deleteCalendarTask(id: string) {
  const { error } = await supabase
    .from('platto_calendar_tasks')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// 日付に近い番組を取得する関数を改善
export async function getNearbyPrograms(date: string) {
  const { data, error } = await supabase
    .from('platto_programs')
    .select('*')
    .order('first_air_date', { ascending: true });

  if (error) throw error;

  const programs = data as Program[];
  const targetDate = new Date(date);

  // 日付との差分を計算し、放送日の近さでソート
  const sortedPrograms = programs.sort((a, b) => {
    const dateA = a.first_air_date ? new Date(a.first_air_date) : new Date('9999-12-31');
    const dateB = b.first_air_date ? new Date(b.first_air_date) : new Date('9999-12-31');
    
    const diffA = Math.abs(dateA.getTime() - targetDate.getTime());
    const diffB = Math.abs(dateB.getTime() - targetDate.getTime());
    
    if (diffA === diffB) {
      // 日付の差が同じ場合は、番組IDの降順（新しい順）でソート
      const idA = parseInt(a.program_id || '0', 10);
      const idB = parseInt(b.program_id || '0', 10);
      return idB - idA;
    }
    
    return diffA - diffB;
  });

  return sortedPrograms;
}