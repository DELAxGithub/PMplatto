import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { MoreVertical, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { isBefore, startOfToday, parseISO } from 'date-fns';
import type { Program, ProgramStatus } from '../types/program';
import { usePrograms } from '../contexts/ProgramContext';
import ProgramDetailModal from './ProgramDetailModal';

// ステータスを2行に分割
const TOP_ROW_STATUSES: ProgramStatus[] = ['日程調整中', 'ロケハン前', '収録準備中', '編集中'];
const BOTTOM_ROW_STATUSES: ProgramStatus[] = ['試写中', 'MA中', '完パケ納品', '放送済み'];

interface ProgramCardProps {
  program: Program;
  index: number;
  onClick: () => void;
}

function ProgramCard({ program, index, onClick }: ProgramCardProps) {
  return (
    <Draggable draggableId={program.id.toString()} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-2 ${
            snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-md'
          } transition-shadow cursor-pointer`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-xs text-text-secondary font-medium truncate">
                {program.program_id}
              </div>
              <h3 className="text-sm font-medium text-text-primary truncate mt-0.5">
                {program.title}
              </h3>
              {program.subtitle && (
                <p className="text-xs text-text-secondary truncate mt-0.5">
                  {program.subtitle}
                </p>
              )}
              <div className="flex flex-col gap-1 mt-2 text-xs text-text-secondary">
                {program.filming_date && (
                  <div className="flex items-center gap-1">
                    <span>📍</span>
                    <span>収録: {program.filming_date}</span>
                  </div>
                )}
                {program.complete_date && (
                  <div className="flex items-center gap-1">
                    <span>🎵</span>
                    <span>MA: {program.complete_date}</span>
                  </div>
                )}
                {program.first_air_date && (
                  <div className="flex items-center gap-1">
                    <span>📢</span>
                    <span>放送: {program.first_air_date}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {program.pr_completed && (
                <span className="text-primary" title="PR納品済み">
                  <CheckCircle size={14} />
                </span>
              )}
              <button 
                className="text-text-secondary hover:text-primary transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
              >
                <MoreVertical size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

interface StatusColumnProps {
  status: ProgramStatus;
  programs: Program[];
  updatingProgram: number | null;
  onCardClick: (program: Program) => void;
}

function StatusColumn({ status, programs, updatingProgram, onCardClick }: StatusColumnProps) {
  return (
    <Droppable droppableId={status}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`flex-1 rounded-lg p-3 overflow-y-auto ${
            snapshot.isDraggingOver ? 'bg-gray-100' : 'bg-gray-50'
          } ${updatingProgram ? 'pointer-events-none opacity-50' : ''}`}
          style={{ maxHeight: 'calc((100vh - 16rem) / 2)' }}
        >
          {programs
            .filter(program => program.status === status)
            .map((program, index) => (
              <ProgramCard
                key={program.id}
                program={program}
                index={index}
                onClick={() => onCardClick(program)}
              />
            ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}

export default function KanbanBoard() {
  const { programs, loading, error, updateProgram } = usePrograms();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAired, setShowAired] = useState(false);
  const [updatingProgram, setUpdatingProgram] = useState<number | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [optimisticPrograms, setOptimisticPrograms] = useState<Program[]>([]);

  const today = startOfToday();

  // 楽観的更新された programs またはオリジナルの programs を使用
  const currentPrograms = optimisticPrograms.length > 0 ? optimisticPrograms : programs;

  const filteredPrograms = currentPrograms
    .filter(program => program.status !== 'キャスティング中')
    .filter(program => {
      if (!program.first_air_date) return true;
      const airDate = parseISO(program.first_air_date);
      return showAired || !isBefore(airDate, today);
    })
    .filter(program => {
      const query = searchQuery.toLowerCase();
      return (
        (program.title || '').toLowerCase().includes(query) ||
        (program.subtitle || '').toLowerCase().includes(query) ||
        (program.program_id || '').toLowerCase().includes(query)
      );
    });

  // 楽観的更新をリセットするためのパフォーマンス最適化
  useEffect(() => {
    if (optimisticPrograms.length > 0) {
      // 実際のプログラム状態と楽観的更新を比較
      const needsReset = optimisticPrograms.some(optimisticProgram => {
        const realProgram = programs.find(p => p.id === optimisticProgram.id);
        return realProgram && realProgram.status === optimisticProgram.status;
      });
      
      if (needsReset) {
        console.log('🔄 Resetting optimistic programs - real-time sync confirmed');
        setOptimisticPrograms([]);
        // リアルタイム同期が確認されたので更新中状態もクリア
        if (updatingProgram) {
          console.log('✅ Real-time sync confirmed, clearing updating state');
          setUpdatingProgram(null);
        }
      }
    }
  }, [programs, optimisticPrograms, updatingProgram]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // ドロップ先がない場合は何もしない
    if (!destination) return;

    // 同じ位置にドロップした場合は何もしない
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const programId = parseInt(draggableId, 10);
    const newStatus = destination.droppableId as ProgramStatus;
    
    // エラー復旧用に元のプログラム情報を保存
    const originalProgram = currentPrograms.find(program => program.id === programId);
    if (!originalProgram) return;
    
    // 1. 最初に即座にローカル状態を更新（楽観的更新）
    const updatedPrograms = currentPrograms.map(program =>
      program.id === programId
        ? { ...program, status: newStatus }
        : program
    );
    console.log('🎯 Applying optimistic update:', { programId, newStatus });
    setOptimisticPrograms(updatedPrograms);
    setUpdatingProgram(programId);

    // 2. その後でAPI呼び出し
    try {
      console.log('💾 Updating program in database:', { programId, newStatus });
      await updateProgram(programId, {
        status: newStatus
      });
      
      console.log('✅ Database update successful - waiting for real-time sync');
      // API成功 - リアルタイム更新が最終状態を同期
      
    } catch (error) {
      console.error('❌ Database update FAILED:', error);
      
      // エラー時は元の状態に復旧
      console.log('🔄 Reverting optimistic update due to DB error');
      setOptimisticPrograms([]);
      setUpdatingProgram(null);
      
      // ユーザーにエラー表示
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      alert(`ステータスの更新に失敗しました: ${errorMessage}`);
    }
  };

  const handleCardClick = (program: Program) => {
    setSelectedProgram(program);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-7rem)]">
        <div className="text-text-primary">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-7rem)]">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  const airedCount = currentPrograms.filter(program => {
    if (!program.first_air_date) return false;
    const airDate = parseISO(program.first_air_date);
    return isBefore(airDate, today);
  }).length;

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold text-text-primary">
            カンバンボード
          </h2>
          <button
            onClick={() => setShowAired(!showAired)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-gray-100 rounded-lg transition-colors"
          >
            {showAired ? <EyeOff size={16} /> : <Eye size={16} />}
            <span>オンエア済み表示</span>
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
              {airedCount}
            </span>
          </button>
        </div>
        <input
          type="search"
          placeholder="番組を検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 flex flex-col gap-4">
          {/* 上段のステータス */}
          <div className="flex-1 grid grid-cols-4 gap-4">
            {TOP_ROW_STATUSES.map(status => (
              <div key={status} className="flex flex-col">
                <div className="mb-3">
                  <div className={`px-3 py-1.5 rounded text-sm font-medium inline-flex bg-status-${status} bg-opacity-20 text-text-primary`}>
                    {status}
                    <span className="ml-2 text-text-secondary">
                      {filteredPrograms.filter(p => p.status === status).length}
                    </span>
                  </div>
                </div>
                <StatusColumn
                  status={status}
                  programs={filteredPrograms}
                  updatingProgram={updatingProgram}
                  onCardClick={handleCardClick}
                />
              </div>
            ))}
          </div>

          {/* 下段のステータス */}
          <div className="flex-1 grid grid-cols-4 gap-4">
            {BOTTOM_ROW_STATUSES.map(status => (
              <div key={status} className="flex flex-col">
                <div className="mb-3">
                  <div className={`px-3 py-1.5 rounded text-sm font-medium inline-flex bg-status-${status} bg-opacity-20 text-text-primary`}>
                    {status}
                    <span className="ml-2 text-text-secondary">
                      {filteredPrograms.filter(p => p.status === status).length}
                    </span>
                  </div>
                </div>
                <StatusColumn
                  status={status}
                  programs={filteredPrograms}
                  updatingProgram={updatingProgram}
                  onCardClick={handleCardClick}
                />
              </div>
            ))}
          </div>
        </div>
      </DragDropContext>

      {showDetailModal && selectedProgram && (
        <ProgramDetailModal
          program={selectedProgram}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedProgram(null);
          }}
          onEdit={() => {
            setShowDetailModal(false);
            setSelectedProgram(null);
          }}
        />
      )}
    </div>
  );
}