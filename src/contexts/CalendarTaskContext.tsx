import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  getCalendarTasks,
  createCalendarTask,
  updateCalendarTask,
  deleteCalendarTask,
} from '../lib/api';
import type { CalendarTask, NewCalendarTask, UpdateCalendarTask } from '../types/calendar-task';
import { useAuth } from './AuthContext';

interface CalendarTaskContextType {
  tasks: CalendarTask[];
  loading: boolean;
  error: string | null;
  refreshTasks: () => Promise<void>;
  addTask: (task: NewCalendarTask) => Promise<CalendarTask>;
  updateTask: (id: string, updates: UpdateCalendarTask) => Promise<CalendarTask>;
  deleteTask: (id: string) => Promise<void>;
}

const CalendarTaskContext = createContext<CalendarTaskContextType | undefined>(undefined);

export function CalendarTaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const refreshTasks = async () => {
    try {
      setError(null);
      const data = await getCalendarTasks();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'タスクデータの取得に失敗しました');
      throw err;
    }
  };

  useEffect(() => {
    if (user) {
      refreshTasks().finally(() => setLoading(false));

      // リアルタイム更新のサブスクリプション設定
      const channel = supabase
        .channel('platto_calendar_tasks_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'platto_calendar_tasks'
          },
          async (payload) => {
            switch (payload.eventType) {
              case 'INSERT':
                setTasks(prev => [payload.new as CalendarTask, ...prev]);
                break;
              case 'UPDATE':
                setTasks(prev =>
                  prev.map(t => (t.id === payload.new.id ? payload.new as CalendarTask : t))
                );
                break;
              case 'DELETE':
                setTasks(prev =>
                  prev.filter(t => t.id !== payload.old.id)
                );
                break;
              default:
                await refreshTasks();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const addTask = async (task: NewCalendarTask) => {
    try {
      setError(null);
      const newTask = await createCalendarTask(task);
      return newTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'タスクの追加に失敗しました');
      throw err;
    }
  };

  const updateTaskData = async (id: string, updates: UpdateCalendarTask) => {
    try {
      setError(null);
      const updatedTask = await updateCalendarTask(id, updates);
      return updatedTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'タスクの更新に失敗しました');
      throw err;
    }
  };

  const deleteTaskData = async (id: string) => {
    try {
      setError(null);
      await deleteCalendarTask(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'タスクの削除に失敗しました');
      throw err;
    }
  };

  return (
    <CalendarTaskContext.Provider
      value={{
        tasks,
        loading,
        error,
        refreshTasks,
        addTask,
        updateTask: updateTaskData,
        deleteTask: deleteTaskData,
      }}
    >
      {children}
    </CalendarTaskContext.Provider>
  );
}

export function useCalendarTasks() {
  const context = useContext(CalendarTaskContext);
  if (context === undefined) {
    throw new Error('useCalendarTasks must be used within a CalendarTaskProvider');
  }
  return context;
}