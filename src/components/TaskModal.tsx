import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { CalendarTask, TASK_TYPE_PRESETS } from '../types/calendar-task';
import { Program } from '../types/program';
import { getNearbyPrograms } from '../lib/api';
import { useCalendarTasks } from '../contexts/CalendarTaskContext';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  task?: CalendarTask;
  onSubmit: (data: { program_id: number | null; task_type: string; start_date: string; end_date: string }) => Promise<void>;
}

export default function TaskModal({ isOpen, onClose, selectedDate, task, onSubmit }: TaskModalProps) {
  const { deleteTask } = useCalendarTasks();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nearbyPrograms, setNearbyPrograms] = useState<Program[]>([]);
  const [formData, setFormData] = useState({
    program_id: task?.program_id?.toString() || '',
    task_type: task?.task_type || TASK_TYPE_PRESETS[0],
    start_date: task?.start_date || (selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''),
    end_date: task?.end_date || (selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''),
    custom_type: task?.task_type && !TASK_TYPE_PRESETS.includes(task.task_type as any) ? task.task_type : '',
  });

  useEffect(() => {
    if (selectedDate) {
      getNearbyPrograms(format(selectedDate, 'yyyy-MM-dd'))
        .then(setNearbyPrograms)
        .catch(console.error);
    }
  }, [selectedDate]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        program_id: formData.program_id ? parseInt(formData.program_id, 10) : null,
        task_type: formData.task_type === 'custom' ? formData.custom_type : formData.task_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'タスクの保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!task || !window.confirm('このタスクを削除してもよろしいですか？')) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await deleteTask(task.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'タスクの削除に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-text-primary">
            {task ? 'タスクを編集' : '新規タスク'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="program_id" className="block text-sm font-medium text-text-primary mb-1">
              関連番組
            </label>
            <select
              id="program_id"
              value={formData.program_id}
              onChange={(e) => setFormData(prev => ({ ...prev, program_id: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">関連付けなし</option>
              {nearbyPrograms.map(program => (
                <option key={program.id} value={program.id}>
                  {program.program_id} - {program.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="task_type" className="block text-sm font-medium text-text-primary mb-1">
              タスク種別
            </label>
            <select
              id="task_type"
              value={formData.task_type}
              onChange={(e) => setFormData(prev => ({ ...prev, task_type: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {TASK_TYPE_PRESETS.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
              <option value="custom">カスタム</option>
            </select>
          </div>

          {formData.task_type === 'custom' && (
            <div>
              <label htmlFor="custom_type" className="block text-sm font-medium text-text-primary mb-1">
                カスタムタスク種別
              </label>
              <input
                type="text"
                id="custom_type"
                value={formData.custom_type}
                onChange={(e) => setFormData(prev => ({ ...prev, custom_type: e.target.value }))}
                required={formData.task_type === 'custom'}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="タスク種別を入力"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-text-primary mb-1">
                開始日
              </label>
              <input
                type="date"
                id="start_date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-text-primary mb-1">
                終了日
              </label>
              <input
                type="date"
                id="end_date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                required
                min={formData.start_date}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div className="flex justify-between gap-3 pt-4 border-t border-gray-200">
            <div className="flex items-center">
              {task && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 size={16} />
                  <span>削除</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
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
                {isSubmitting ? '保存中...' : task ? '更新' : '登録'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}