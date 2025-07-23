import React, { useState, useEffect } from 'react';
import { MoreVertical, Edit, ArrowUpDown, Link2, Copy, ExternalLink, Filter, X, Eye, EyeOff, CheckCircle, RefreshCw } from 'lucide-react';
import type { Program, ProgramStatus } from '../types/program';
import { STATUS_ORDER } from '../types/program';
import ProgramModal from './ProgramModal';
import ProgramDetailModal from './ProgramDetailModal';
import { usePrograms } from '../contexts/ProgramContext';

const statusLabels: Record<Program['status'], string> = {
  'キャスティング中': 'キャスティング中',
  '日程調整中': '日程調整中',
  'ロケハン前': 'ロケハン前',
  '収録準備中': '収録準備中',
  '編集中': '編集中',
  '試写中': '試写中',
  'MA中': 'MA中',
  '完パケ納品': '完パケ納品'
};

type SortField = 'program_id' | 'title' | 'status' | 'first_air_date' | 'filming_date' | 'complete_date';
type SortDirection = 'asc' | 'desc';

interface FilterState {
  status: ProgramStatus | 'all';
  month: string | 'all'; // YYYY-MM format
  showPastPrograms: boolean;
  prStatus: 'all' | 'completed' | 'pending';
}

const FILTER_STORAGE_KEY = 'program_list_filters';

export default function ProgramList() {
  const { programs, loading, error, updateProgram } = usePrograms();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | undefined>();
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [sortField, setSortField] = useState<SortField>('status');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const [filters, setFilters] = useState<FilterState>(() => {
    const savedFilters = localStorage.getItem(FILTER_STORAGE_KEY);
    return savedFilters ? JSON.parse(savedFilters) : {
      status: 'all',
      month: 'all',
      showPastPrograms: false,
      prStatus: 'all'
    };
  });

  useEffect(() => {
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  const availableMonths = React.useMemo(() => {
    const months = new Set<string>();
    programs.forEach(program => {
      if (program.first_air_date) {
        months.add(program.first_air_date.substring(0, 7));
      }
    });
    return Array.from(months).sort();
  }, [programs]);

  const filteredPrograms = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return programs
      .filter(program => program.status !== 'キャスティング中')
      .filter(program => {
        if (!filters.showPastPrograms && program.first_air_date) {
          const airDate = new Date(program.first_air_date);
          if (airDate < today) return false;
        }

        if (filters.status !== 'all' && program.status !== filters.status) {
          return false;
        }

        if (filters.prStatus !== 'all') {
          if (filters.prStatus === 'completed' && !program.pr_completed) return false;
          if (filters.prStatus === 'pending' && program.pr_completed) return false;
        }

        if (filters.month !== 'all' && program.first_air_date) {
          if (!program.first_air_date.startsWith(filters.month)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortField === 'status') {
          const aIndex = STATUS_ORDER.indexOf(a.status);
          const bIndex = STATUS_ORDER.indexOf(b.status);
          return sortDirection === 'asc' ? aIndex - bIndex : bIndex - aIndex;
        }

        const aValue = a[sortField];
        const bValue = b[sortField];
        
        if (aValue === null) return sortDirection === 'asc' ? 1 : -1;
        if (bValue === null) return sortDirection === 'asc' ? -1 : 1;
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [programs, filters, sortField, sortDirection]);

  const futureReAirings = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return programs
      .filter(program => 
        program.re_air_date && 
        new Date(program.re_air_date) >= today
      )
      .sort((a, b) => {
        if (!a.re_air_date || !b.re_air_date) return 0;
        return a.re_air_date.localeCompare(b.re_air_date);
      });
  }, [programs]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleAddProgram = () => {
    setSelectedProgram(undefined);
    setIsModalOpen(true);
  };

  const handleEditProgram = (program: Program) => {
    setSelectedProgram(program);
    setIsModalOpen(true);
    setShowDetailModal(false);
  };

  const handlePrStatusChange = async (program: Program, completed: boolean) => {
    try {
      await updateProgram(program.id, { pr_completed: completed });
    } catch (error) {
      console.error('Failed to update PR status:', error);
    }
  };

  const handleRowClick = (program: Program, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.action-buttons')) {
      return;
    }
    setSelectedProgram(program);
    setShowDetailModal(true);
  };

  const FilterMenu = () => (
    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-text-primary">フィルター</h3>
          <button
            onClick={() => setShowFilterMenu(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              ステータス
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as ProgramStatus | 'all' }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
            >
              <option value="all">すべて</option>
              {STATUS_ORDER.filter(status => status !== 'キャスティング中').map(status => (
                <option key={status} value={status}>{statusLabels[status]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              PR納品状況
            </label>
            <select
              value={filters.prStatus}
              onChange={(e) => setFilters(prev => ({ ...prev, prStatus: e.target.value as 'all' | 'completed' | 'pending' }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
            >
              <option value="all">すべて</option>
              <option value="completed">納品済み</option>
              <option value="pending">未納品</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              放送月
            </label>
            <select
              value={filters.month}
              onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
            >
              <option value="all">すべて</option>
              {availableMonths.map(month => (
                <option key={month} value={month}>
                  {month.replace('-', '年')}月
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.showPastPrograms}
                onChange={(e) => setFilters(prev => ({ ...prev, showPastPrograms: e.target.checked }))}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-text-primary">過去の番組を表示</span>
            </label>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              setFilters({
                status: 'all',
                month: 'all',
                showPastPrograms: false,
                prStatus: 'all'
              });
            }}
            className="w-full px-4 py-2 text-sm font-medium text-text-primary hover:bg-gray-50 rounded-lg transition-colors"
          >
            フィルターをリセット
          </button>
        </div>
      </div>
    </div>
  );

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

  const hasActiveFilters = filters.status !== 'all' || filters.month !== 'all' || filters.prStatus !== 'all';

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-semibold text-text-primary">番組一覧</h2>
            {hasActiveFilters && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                フィルター適用中
              </span>
            )}
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                  hasActiveFilters ? 'border-primary text-primary' : 'border-gray-200 text-text-primary'
                } hover:bg-gray-50 transition-colors`}
              >
                <Filter size={16} />
                <span className="text-sm font-medium">フィルター</span>
                {hasActiveFilters && (
                  <span className="flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-primary rounded-full">
                    {(filters.status !== 'all' ? 1 : 0) + 
                     (filters.month !== 'all' ? 1 : 0) + 
                     (filters.prStatus !== 'all' ? 1 : 0)}
                  </span>
                )}
              </button>
              {showFilterMenu && <FilterMenu />}
            </div>

            <button
              onClick={() => setFilters(prev => ({ ...prev, showPastPrograms: !prev.showPastPrograms }))}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              {filters.showPastPrograms ? <EyeOff size={16} /> : <Eye size={16} />}
              <span className="text-sm font-medium">
                {filters.showPastPrograms ? '過去の番組を非表示' : '過去の番組を表示'}
              </span>
            </button>

            <button
              onClick={handleAddProgram}
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
            >
              新規番組
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[1200px]">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-4 text-left">
                      <button
                        onClick={() => handleSort('program_id')}
                        className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-primary transition-colors"
                      >
                        番組ID
                        <ArrowUpDown size={16} className={`${
                          sortField === 'program_id' ? 'text-primary' : 'text-gray-400'
                        }`} />
                      </button>
                    </th>
                    <th className="px-4 py-4 text-left">
                      <button
                        onClick={() => handleSort('title')}
                        className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-primary transition-colors"
                      >
                        タイトル
                        <ArrowUpDown size={16} className={`${
                          sortField === 'title' ? 'text-primary' : 'text-gray-400'
                        }`} />
                      </button>
                    </th>
                    <th className="px-4 py-4">
                      <button
                        onClick={() => handleSort('status')}
                        className="flex items-center justify-center gap-2 text-sm font-medium text-text-secondary hover:text-primary transition-colors"
                      >
                        ステータス
                        <ArrowUpDown size={16} className={`${
                          sortField === 'status' ? 'text-primary' : 'text-gray-400'
                        }`} />
                      </button>
                    </th>
                    <th className="px-4 py-4">
                      <button
                        onClick={() => handleSort('first_air_date')}
                        className="flex items-center justify-center gap-2 text-sm font-medium text-text-secondary hover:text-primary transition-colors"
                      >
                        放送日
                        <ArrowUpDown size={16} className={`${
                          sortField === 'first_air_date' ? 'text-primary' : 'text-gray-400'
                        }`} />
                      </button>
                    </th>
                    <th className="px-4 py-4">
                      <button
                        onClick={() => handleSort('filming_date')}
                        className="flex items-center justify-center gap-2 text-sm font-medium text-text-secondary hover:text-primary transition-colors"
                      >
                        収録日
                        <ArrowUpDown size={16} className={`${
                          sortField === 'filming_date' ? 'text-primary' : 'text-gray-400'
                        }`} />
                      </button>
                    </th>
                    <th className="px-4 py-4">
                      <button
                        onClick={() => handleSort('complete_date')}
                        className="flex items-center justify-center gap-2 text-sm font-medium text-text-secondary hover:text-primary transition-colors"
                      >
                        完パケ納品日
                        <ArrowUpDown size={16} className={`${
                          sortField === 'complete_date' ? 'text-primary' : 'text-gray-400'
                        }`} />
                      </button>
                    </th>
                    <th className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2 text-sm font-medium text-text-secondary">
                        PR納品状況
                      </div>
                    </th>
                    <th className="px-4 py-4 text-right">
                      <span className="text-sm font-medium text-text-secondary">
                        アクション
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPrograms.map((program) => (
                    <tr
                      key={program.id}
                      onClick={(e) => handleRowClick(program, e)}
                      className="hover:bg-gray-50 transition-colors group cursor-pointer"
                    >
                      <td className="px-4 py-4 text-sm font-medium text-text-primary">
                        {program.program_id}
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <div className="text-sm font-medium text-text-primary">
                            {program.title}
                          </div>
                          {program.subtitle && (
                            <div className="text-xs text-text-secondary mt-0.5">
                              {program.subtitle}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-status-${program.status} bg-opacity-20 text-text-primary`}>
                          {statusLabels[program.status]}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-text-primary text-center">
                        {program.first_air_date}
                      </td>
                      <td className="px-4 py-4 text-sm text-text-primary text-center">
                        {program.filming_date}
                      </td>
                      <td className="px-4 py-4 text-sm text-text-primary text-center">
                        {program.complete_date}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center">
                          <label className="relative inline-flex items-center">
                            <input
                              type="checkbox"
                              checked={program.pr_completed}
                              onChange={(e) => {
                                e.stopPropagation();
                                handlePrStatusChange(program, e.target.checked);
                              }}
                              className="sr-only peer"
                            />
                            <div className={`w-5 h-5 border rounded transition-colors cursor-pointer
                              ${program.pr_completed 
                                ? 'bg-primary border-primary text-white' 
                                : 'border-gray-300 hover:border-primary'}`}
                            >
                              {program.pr_completed && (
                                <CheckCircle className="w-full h-full p-0.5 text-white" />
                              )}
                            </div>
                          </label>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="action-buttons flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProgram(program);
                            }}
                            className="p-1 hover:bg-gray-100 rounded transition-colors text-text-secondary hover:text-primary"
                            title="編集"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProgram(program);
                              setShowDetailModal(true);
                            }}
                            className="p-1 hover:bg-gray-100 rounded transition-colors text-text-secondary hover:text-primary"
                            title="詳細"
                          >
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="px-4 md:px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-text-secondary">
                全 {filteredPrograms.length} 件
              </div>
            </div>
          </div>
        </div>
      </div>

      {futureReAirings.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-text-primary">再放送予定</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {futureReAirings.length}件
            </span>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                      番組ID
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                      タイトル
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-text-secondary">
                      ステータス
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-text-secondary">
                      再放送日
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-text-secondary">
                      初回放送日
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-text-secondary">
                      アクション
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {futureReAirings.map((program) => (
                    <tr
                      key={`reair-${program.id}`}
                      onClick={(e) => handleRowClick(program, e)}
                      className="hover:bg-gray-50 transition-colors group cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <RefreshCw size={14} className="text-blue-500" />
                          <span className="text-sm font-medium text-text-primary">
                            {program.program_id}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-sm font-medium text-text-primary">
                            {program.title}
                          </div>
                          {program.subtitle && (
                            <div className="text-xs text-text-secondary mt-0.5">
                              {program.subtitle}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-status-${program.status} bg-opacity-20 text-text-primary`}>
                            {program.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-primary text-center">
                        {program.re_air_date}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-primary text-center">
                        {program.first_air_date}
                      </td>
                      <td className="px-4 py-3">
                        <div className="action-buttons flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProgram(program);
                            }}
                            className="p-1 hover:bg-gray-100 rounded transition-colors text-text-secondary hover:text-primary"
                            title="編集"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProgram(program);
                              setShowDetailModal(true);
                            }}
                            className="p-1 hover:bg-gray-100 rounded transition-colors text-text-secondary hover:text-primary"
                            title="詳細"
                          >
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <ProgramModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          program={selectedProgram}
        />
      )}

      {showDetailModal && selectedProgram && (
        <ProgramDetailModal
          program={selectedProgram}
          onClose={() => setShowDetailModal(false)}
          onEdit={() => {
            setShowDetailModal(false);
            setIsModalOpen(true);
          }}
        />
      )}
    </div>
  );
}