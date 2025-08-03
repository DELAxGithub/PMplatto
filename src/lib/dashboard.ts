import { supabase } from './supabase';
import type { DashboardWidget } from '../types/dashboard';

export async function getDashboardWidgets(): Promise<DashboardWidget[]> {
  const { data, error } = await supabase
    .from('platto_team_dashboard')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching dashboard widgets:', error);
    throw error;
  }

  return data || [];
}

export async function updateDashboardWidget(
  id: string,
  updates: Partial<DashboardWidget>
): Promise<DashboardWidget> {
  const { data, error } = await supabase
    .from('platto_team_dashboard')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating dashboard widget:', error);
    throw error;
  }

  return data;
}

export async function createDashboardWidget(
  widget: Omit<DashboardWidget, 'id' | 'created_at' | 'updated_at'>
): Promise<DashboardWidget> {
  const { data, error } = await supabase
    .from('platto_team_dashboard')
    .insert(widget)
    .select()
    .single();

  if (error) {
    console.error('Error creating dashboard widget:', error);
    throw error;
  }

  return data;
}

export async function deleteDashboardWidget(id: string): Promise<void> {
  const { error } = await supabase
    .from('platto_team_dashboard')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting dashboard widget:', error);
    throw error;
  }
}