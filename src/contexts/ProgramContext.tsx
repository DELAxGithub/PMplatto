import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getPrograms, createProgram, updateProgram, deleteProgram } from '../lib/api';
import type { Program, NewProgram, UpdateProgram } from '../types/program';
import { useAuth } from './AuthContext';

interface ProgramContextType {
  programs: Program[];
  loading: boolean;
  error: string | null;
  refreshPrograms: () => Promise<void>;
  addProgram: (program: NewProgram) => Promise<Program>;
  updateProgram: (id: number, updates: UpdateProgram) => Promise<Program>;
  deleteProgram: (id: number) => Promise<void>;
}

const ProgramContext = createContext<ProgramContextType | undefined>(undefined);

export function ProgramProvider({ children }: { children: React.ReactNode }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const refreshPrograms = async () => {
    try {
      setError(null);
      console.log('🔄 Refreshing programs from database...');
      const data = await getPrograms();
      console.log('📊 Fresh programs loaded:', data.length, 'programs');
      setPrograms(data);
    } catch (err) {
      console.error('❌ Error fetching programs:', err);
      setError(err instanceof Error ? err.message : '番組データの取得に失敗しました');
      throw err;
    }
  };

  useEffect(() => {
    console.log('👤 ProgramContext: User state changed:', user ? 'AUTHENTICATED' : 'NOT_AUTHENTICATED');
    if (user) {
      console.log('👤 User authenticated, setting up programs and real-time...');
      refreshPrograms().finally(() => setLoading(false));

      // リアルタイム更新のサブスクリプション設定
      console.log('🔗 Setting up real-time subscription for programs');
      const channel = supabase
        .channel('platto_programs_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'platto_programs'
          },
          async (payload) => {
            console.log('🔄 Real-time event:', payload.eventType, payload);
            // ペイロードのイベントタイプに応じて適切な処理を実行
            switch (payload.eventType) {
              case 'INSERT':
                setPrograms(prev => {
                  // 既に存在する場合は重複を避ける
                  if (prev.some(p => p.id === payload.new.id)) {
                    return prev;
                  }
                  return [payload.new as Program, ...prev];
                });
                break;
              case 'UPDATE':
                console.log('📝 Updating program via real-time:', payload.new.id, 'to status:', payload.new.status);
                setPrograms(prev => {
                  const updated = prev.map(p => (p.id === payload.new.id ? payload.new as Program : p));
                  console.log('✅ Programs state updated via real-time');
                  // リアルタイム更新のタイムスタンプをセット（ただし、これだけでは十分ではない）
                  return updated;
                });
                break;
              case 'DELETE':
                setPrograms(prev =>
                  prev.filter(p => p.id !== payload.old.id)
                );
                break;
              default:
                // 不明なイベントタイプの場合は全データを再取得
                await refreshPrograms();
            }
          }
        )
        .subscribe((status) => {
          console.log('🔌 Real-time subscription status:', status);
        });

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const addProgram = async (program: NewProgram) => {
    try {
      setError(null);
      const newProgram = await createProgram(program);
      // リアルタイム更新で処理されるため、ここでのstate更新は不要
      return newProgram;
    } catch (err) {
      setError(err instanceof Error ? err.message : '番組の追加に失敗しました');
      throw err;
    }
  };

  const updateProgramData = async (id: number, updates: UpdateProgram) => {
    try {
      setError(null);
      const updatedProgram = await updateProgram(id, updates);
      // リアルタイム更新で処理されるため、ここでのstate更新は不要
      return updatedProgram;
    } catch (err) {
      setError(err instanceof Error ? err.message : '番組の更新に失敗しました');
      throw err;
    }
  };

  const deleteProgramData = async (id: number) => {
    try {
      setError(null);
      await deleteProgram(id);
      // リアルタイム更新で処理されるため、ここでのstate更新は不要
    } catch (err) {
      setError(err instanceof Error ? err.message : '番組の削除に失敗しました');
      throw err;
    }
  };

  return (
    <ProgramContext.Provider
      value={{
        programs,
        loading,
        error,
        refreshPrograms,
        addProgram,
        updateProgram: updateProgramData,
        deleteProgram: deleteProgramData,
      }}
    >
      {children}
    </ProgramContext.Provider>
  );
}

export function usePrograms() {
  const context = useContext(ProgramContext);
  if (context === undefined) {
    throw new Error('usePrograms must be used within a ProgramProvider');
  }
  return context;
}