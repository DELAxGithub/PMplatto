import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Program, ProgramStatus } from '../types/program';
import { usePrograms } from '../contexts/ProgramContext';
import { calculateCompleteDate, calculatePrDueDate } from '../lib/dateUtils';

interface ProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  program?: Program;
}

export default function ProgramModal({ isOpen, onClose, program }: ProgramModalProps) {
  const { addProgram, updateProgram } = usePrograms();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    program_id: program?.program_id || '',
    title: program?.title || '',
    subtitle: program?.subtitle || '',
    status: program?.status || 'キャスティング中' as ProgramStatus,
    first_air_date: program?.first_air_date || '',
    re_air_date: program?.re_air_date || '',
    filming_date: program?.filming_date || '',
    complete_date: program?.complete_date || '',
    cast1: program?.cast1 || '',
    cast2: program?.cast2 || '',
    script_url: program?.script_url || '',
    pr_80text: program?.pr_80text || '',
    pr_200text: program?.pr_200text || '',
    notes: program?.notes || '',
    pr_completed: program?.pr_completed || false,
    pr_due_date: program?.pr_due_date || '',
  });

  if (!isOpen) return null;

  const statusOptions: { value: ProgramStatus; label: string }[] = [
    { value: 'キャスティング中', label: 'キャスティング中' },
    { value: '日程調整中', label: '日程調整中' },
    { value: 'ロケハン前', label: 'ロケハン前' },
    { value: '収録準備中', label: '収録準備中' },
    { value: '編集中', label: '編集中' },
    { value: '試写中', label: '試写中' },
    { value: 'MA中', label: 'MA中' },
    { value: '完パケ納品', label: '完パケ納品' }
  ];

  const handleFirstAirDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFirstAirDate = e.target.value;
    setFormData(prev => ({
      ...prev,
      first_air_date: newFirstAirDate,
      // 初回放送日が入力された場合のみ完パケ納品日とPR納品日を計算
      complete_date: newFirstAirDate ? calculateCompleteDate(newFirstAirDate) : prev.complete_date,
      pr_due_date: newFirstAirDate ? calculatePrDueDate(newFirstAirDate) : prev.pr_due_date
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const programData = {
        program_id: formData.program_id,
        title: formData.title,
        subtitle: formData.subtitle || null,
        status: formData.status as ProgramStatus,
        first_air_date: formData.first_air_date || null,
        re_air_date: formData.re_air_date || null,
        filming_date: formData.filming_date || null,
        complete_date: formData.complete_date || null,
        cast1: formData.cast1 || null,
        cast2: formData.cast2 || null,
        script_url: formData.script_url || null,
        pr_80text: formData.pr_80text || null,
        pr_200text: formData.pr_200text || null,
        notes: formData.notes || null,
        pr_completed: formData.pr_completed,
        pr_due_date: formData.pr_due_date || null,
      };

      if (program) {
        await updateProgram(program.id, programData);
      } else {
        await addProgram(programData);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '番組の保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
          <h2 className="text-lg md:text-xl font-semibold text-text-primary">
            {program ? '番組を編集' : '新規番組登録'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="program_id" className="block text-sm font-medium text-text-primary mb-1">
                  番組ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="program_id"
                  value={formData.program_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, program_id: e.target.value }))}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-text-primary mb-1">
                  番組タイトル <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              
              <div>
                <label htmlFor="subtitle" className="block text-sm font-medium text-text-primary mb-1">
                  サブタイトル
                </label>
                <input
                  type="text"
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-text-primary mb-1">
                  ステータス <span className="text-red-500">*</span>
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as ProgramStatus }))}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="first_air_date" className="block text-sm font-medium text-text-primary mb-1">
                  初回放送日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="first_air_date"
                  value={formData.first_air_date}
                  onChange={handleFirstAirDateChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="filming_date" className="block text-sm font-medium text-text-primary mb-1">
                  収録日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="filming_date"
                  value={formData.filming_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, filming_date: e.target.value }))}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="complete_date" className="block text-sm font-medium text-text-primary mb-1">
                  完パケ納品日
                </label>
                <input
                  type="date"
                  id="complete_date"
                  value={formData.complete_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, complete_date: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="pr_due_date" className="block text-sm font-medium text-text-primary mb-1">
                  PR納品日
                </label>
                <input
                  type="date"
                  id="pr_due_date"
                  value={formData.pr_due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, pr_due_date: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="re_air_date" className="block text-sm font-medium text-text-primary mb-1">
                  再放送日
                </label>
                <input
                  type="date"
                  id="re_air_date"
                  value={formData.re_air_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, re_air_date: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="cast1" className="block text-sm font-medium text-text-primary mb-1">
                  出演者1
                </label>
                <input
                  type="text"
                  id="cast1"
                  value={formData.cast1}
                  onChange={(e) => setFormData(prev => ({ ...prev, cast1: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="cast2" className="block text-sm font-medium text-text-primary mb-1">
                  出演者2
                </label>
                <input
                  type="text"
                  id="cast2"
                  value={formData.cast2}
                  onChange={(e) => setFormData(prev => ({ ...prev, cast2: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="script_url" className="block text-sm font-medium text-text-primary mb-1">
                  台本・素材URL
                </label>
                <input
                  type="url"
                  id="script_url"
                  value={formData.script_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, script_url: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-text-primary mb-1">
                  備考
                </label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={8}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.pr_completed}
                    onChange={(e) => setFormData(prev => ({ ...prev, pr_completed: e.target.checked }))}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-text-primary">PR納品完了</span>
                </label>

                <div>
                  <label htmlFor="pr_80text" className="block text-sm font-medium text-text-primary mb-1">
                    PR用テキスト（80文字）
                  </label>
                  <textarea
                    id="pr_80text"
                    value={formData.pr_80text}
                    onChange={(e) => setFormData(prev => ({ ...prev, pr_80text: e.target.value }))}
                    rows={5}
                    maxLength={80}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                </div>

                <div>
                  <label htmlFor="pr_200text" className="block text-sm font-medium text-text-primary mb-1">
                    PR用テキスト（200文字）
                  </label>
                  <textarea
                    id="pr_200text"
                    value={formData.pr_200text}
                    onChange={(e) => setFormData(prev => ({ ...prev, pr_200text: e.target.value }))}
                    rows={10}
                    maxLength={200}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '保存中...' : program ? '更新' : '登録'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}