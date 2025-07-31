import React from 'react';
import { Clock } from 'lucide-react';
import { useCalendarTasks } from '../../contexts/CalendarTaskContext';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { ja } from 'date-fns/locale';
import { getJSTToday } from '../../lib/timezone';

export default function ScheduleWidget() {
  const { tasks, loading } = useCalendarTasks();

  if (loading) {
    return (
      <div className="text-xs text-text-secondary py-2">
        読み込み中...
      </div>
    );
  }

  // 今週の範囲を取得（JST基準）
  const today = getJSTToday();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

  // 今週のタスクをフィルタリング
  const thisWeekTasks = tasks.filter(task => {
    const taskDate = new Date(task.start_date);
    return taskDate >= weekStart && taskDate <= weekEnd;
  });

  // 日付順でソート
  const sortedTasks = thisWeekTasks
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    .slice(0, 5); // 最大5件まで表示

  if (sortedTasks.length === 0) {
    return (
      <div className="text-xs text-text-secondary py-2">
        今週の予定はありません。
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sortedTasks.map((task) => (
        <div key={task.id} className="flex items-start gap-2 text-xs">
          <div className="mt-0.5">
            <Clock size={12} className="text-text-secondary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-text-secondary">
                {format(new Date(task.start_date), 'M/d(E)', { locale: ja })}
              </span>
            </div>
            <div className="font-medium truncate text-text-primary">
              {task.task_type}
            </div>
            {task.program && (
              <div className="text-text-secondary text-xs truncate">
                {task.program.program_id}
              </div>
            )}
          </div>
        </div>
      ))}
      
      {thisWeekTasks.length > 5 && (
        <div className="text-xs text-text-secondary text-center pt-2 border-t border-gray-200">
          他 {thisWeekTasks.length - 5} 件の予定
        </div>
      )}
    </div>
  );
}