import React, { useState, useEffect, useRef } from 'react';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isToday,
  addWeeks,
  subWeeks,
  parse,
  isSameDay,
  addMonths,
  subMonths,
  differenceInWeeks,
  startOfMonth,
  endOfMonth,
  isSameMonth,
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, X, RefreshCw } from 'lucide-react';
import { usePrograms } from '../contexts/ProgramContext';
import { useCalendarTasks } from '../contexts/CalendarTaskContext';
import { CalendarTask, TASK_TYPE_PRESETS, TASK_TYPE_COLORS, DEFAULT_TASK_COLOR } from '../types/calendar-task';
import type { Program } from '../types/program';
import TaskModal from './TaskModal';
import ProgramModal from './ProgramModal';

interface TaskItemProps {
  task: CalendarTask;
  taskIndex: number;
  onClick: () => void;
}

function TaskItem({ task, taskIndex, onClick }: TaskItemProps) {
  const taskColor = TASK_TYPE_PRESETS.includes(task.task_type as any)
    ? TASK_TYPE_COLORS[task.task_type as keyof typeof TASK_TYPE_COLORS]
    : DEFAULT_TASK_COLOR;

  return (
    <button
      onClick={onClick}
      className={`absolute left-0 right-0 mx-1 px-2 py-1 rounded border ${taskColor.bg} ${taskColor.text} ${taskColor.border} text-xs font-medium hover:brightness-95 transition-all truncate`}
      style={{
        top: `${taskIndex * 24}px`,
        height: '20px',
        zIndex: getTaskTypeZIndex(task.task_type),
      }}
    >
      {task.program?.program_id && `[${task.program.program_id}] `}
      {task.task_type}
    </button>
  );
}

function getTaskTypeZIndex(taskType: string): number {
  switch (taskType) {
    case '編集':
      return 30;
    case '試写':
      return 20;
    case 'MA':
      return 10;
    default:
      return 1;
  }
}

interface ProgramEventProps {
  program: Program;
  type: 'air' | 'reair' | 'filming' | 'complete';
  onClick: () => void;
}

function ProgramEvent({ program, type, onClick }: ProgramEventProps) {
  const programColor = getProgramColor(program.program_id || '');
  const icon = type === 'air' ? '📢' : 
               type === 'reair' ? '🔄' :
               type === 'filming' ? '📍' : '🎵';

  const colorClasses = type === 'reair' ? {
    bg: 'bg-blue-50',
    text: 'text-blue-900',
    border: 'border-blue-200'
  } : programColor;

  return (
    <button
      onClick={onClick}
      className={`w-full px-2 py-1 mb-1 text-left rounded border ${colorClasses.bg} ${colorClasses.text} ${colorClasses.border} text-xs font-medium hover:brightness-95 transition-all`}
    >
      <div className="flex items-start gap-1">
        <span className="flex-shrink-0">{icon}</span>
        <div className="min-w-0 flex-1">
          <div className="font-medium">{program.program_id}</div>
          <div className="text-[10px] leading-tight break-words">
            {program.title}
          </div>
        </div>
      </div>
    </button>
  );
}

function getProgramColor(programId: string): { bg: string; text: string; border: string } {
  const colors = [
    { bg: 'bg-pink-50', text: 'text-pink-900', border: 'border-pink-200' },
    { bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-200' },
    { bg: 'bg-green-50', text: 'text-green-900', border: 'border-green-200' },
    { bg: 'bg-purple-50', text: 'text-purple-900', border: 'border-purple-300' },
    { bg: 'bg-yellow-50', text: 'text-yellow-900', border: 'border-yellow-200' },
    { bg: 'bg-indigo-50', text: 'text-indigo-900', border: 'border-indigo-200' },
    { bg: 'bg-red-50', text: 'text-red-900', border: 'border-red-200' },
    { bg: 'bg-cyan-50', text: 'text-cyan-900', border: 'border-cyan-200' },
  ];

  const numericId = parseInt(programId.replace(/\D/g, ''), 10);
  const colorIndex = numericId % colors.length;
  return colors[colorIndex];
}

interface EventModalProps {
  program: Program;
  type: 'air' | 'reair' | 'filming' | 'complete';
  onClose: () => void;
  onEdit: () => void;
}

function EventModal({ program, type, onClose, onEdit }: EventModalProps) {
  const getEventTitle = () => {
    switch (type) {
      case 'air':
        return '放送';
      case 'reair':
        return '再放送';
      case 'filming':
        return '収録';
      case 'complete':
        return '完パケ納品';
    }
  };

  const getEventDate = () => {
    switch (type) {
      case 'air':
        return program.first_air_date;
      case 'reair':
        return program.re_air_date;
      case 'filming':
        return program.filming_date;
      case 'complete':
        return program.complete_date;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">
              {getEventTitle()}情報
              {type === 'reair' && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  再放送
                </span>
              )}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <div className="text-sm text-text-secondary font-medium">
              {program.program_id}
            </div>
            <h3 className="text-lg font-medium text-text-primary mt-1">
              {program.title}
            </h3>
            {program.subtitle && (
              <p className="text-text-secondary mt-1">{program.subtitle}</p>
            )}
          </div>

          <div>
            <div className="text-sm font-medium text-text-primary mb-1">
              {getEventTitle()}日
            </div>
            <div className="text-text-primary">{getEventDate()}</div>
          </div>

          {type === 'reair' && program.first_air_date && (
            <div>
              <div className="text-sm font-medium text-text-primary mb-1">
                初回放送日
              </div>
              <div className="text-text-primary">{program.first_air_date}</div>
            </div>
          )}

          {(program.cast1 || program.cast2) && (
            <div>
              <div className="text-sm font-medium text-text-primary mb-1">
                出演者
              </div>
              <div className="text-text-secondary">
                {[program.cast1, program.cast2].filter(Boolean).join('、')}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            閉じる
          </button>
          <button
            onClick={onEdit}
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
          >
            編集
          </button>
        </div>
      </div>
    </div>
  );
}

function WeekView({ 
  startDate,
  programs,
  tasks,
  onAddTask,
  onEditTask,
  onShowEventDetail,
  onEditProgram,
  isFirstWeekOfMonth
}: {
  startDate: Date;
  programs: Program[];
  tasks: CalendarTask[];
  onAddTask: (date: Date) => void;
  onEditTask: (task: CalendarTask) => void;
  onShowEventDetail: (event: { program: Program; type: 'air' | 'reair' | 'filming' | 'complete' }) => void;
  onEditProgram: (program: Program) => void;
  isFirstWeekOfMonth: boolean;
}) {
  const weekDays = eachDayOfInterval({
    start: startOfWeek(startDate, { locale: ja }),
    end: endOfWeek(startDate, { locale: ja })
  });

  return (
    <div className="grid grid-cols-7 border-b border-gray-200">
      {weekDays.map((date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const isFirstOfMonth = date.getDate() === 1;
        const dayEvents = programs.flatMap(program => {
          const events: { program: Program; type: 'air' | 'reair' | 'filming' | 'complete' }[] = [];
          
          if (program.first_air_date && isSameDay(parse(program.first_air_date, 'yyyy-MM-dd', new Date()), date)) {
            events.push({ program, type: 'air' });
          }
          if (program.re_air_date && isSameDay(parse(program.re_air_date, 'yyyy-MM-dd', new Date()), date)) {
            events.push({ program, type: 'reair' });
          }
          if (program.filming_date && isSameDay(parse(program.filming_date, 'yyyy-MM-dd', new Date()), date)) {
            events.push({ program, type: 'filming' });
          }
          if (program.complete_date && isSameDay(parse(program.complete_date, 'yyyy-MM-dd', new Date()), date)) {
            events.push({ program, type: 'complete' });
          }
          
          return events;
        });

        const dayTasks = tasks
          .filter(task => {
            const taskStart = parse(task.start_date, 'yyyy-MM-dd', new Date());
            const taskEnd = parse(task.end_date, 'yyyy-MM-dd', new Date());
            return (
              isSameDay(date, taskStart) ||
              isSameDay(date, taskEnd) ||
              (date > taskStart && date < taskEnd)
            );
          })
          .sort((a, b) => {
            const getTypeOrder = (type: string) => {
              switch (type) {
                case '編集': return 0;
                case '試写': return 1;
                case 'MA': return 2;
                default: return 3;
              }
            };
            return getTypeOrder(a.task_type) - getTypeOrder(b.task_type);
          });

        return (
          <div
            key={dateStr}
            className={`min-h-[120px] p-2 border-r border-gray-200 relative ${
              !isSameMonth(date, startDate) ? 'bg-gray-50' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <div className={`text-sm font-medium ${
                  isToday(date) ? 'text-white bg-primary rounded-full w-6 h-6 flex items-center justify-center' :
                  date.getDay() === 0 ? 'text-red-500' :
                  date.getDay() === 6 ? 'text-blue-500' :
                  'text-text-primary'
                }`}>
                  {isFirstOfMonth ? (
                    <span className="flex items-center gap-1">
                      {format(date, 'd')}
                      <span className="text-xs text-text-secondary">
                        {format(date, 'M月')}
                      </span>
                    </span>
                  ) : (
                    format(date, 'd')
                  )}
                </div>
              </div>
              <button
                onClick={() => onAddTask(date)}
                className="p-1 text-gray-400 hover:text-primary transition-colors rounded-full hover:bg-gray-100"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="space-y-1">
              {dayEvents.map((event, index) => (
                <ProgramEvent
                  key={`${event.program.id}-${event.type}`}
                  program={event.program}
                  type={event.type}
                  onClick={() => onShowEventDetail(event)}
                />
              ))}
            </div>

            <div className="relative mt-1">
              {dayTasks.map((task, index) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  taskIndex={index}
                  onClick={() => onEditTask(task)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTask, setSelectedTask] = useState<CalendarTask>();
  const [selectedEvent, setSelectedEvent] = useState<{
    program: Program;
    type: 'air' | 'reair' | 'filming' | 'complete';
  }>();
  const [selectedProgram, setSelectedProgram] = useState<Program>();
  
  const { programs } = usePrograms();
  const { tasks, loading, error, addTask, updateTask } = useCalendarTasks();

  const weeks = React.useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { locale: ja });
    const endDate = endOfWeek(endOfMonth(addMonths(monthStart, 1)), { locale: ja });
    const weekCount = differenceInWeeks(endDate, startDate) + 1;
    
    return Array.from({ length: weekCount }, (_, i) => 
      addWeeks(startDate, i)
    );
  }, [currentDate]);

  const handlePreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleAddTask = (date: Date) => {
    setSelectedDate(date);
    setSelectedTask(undefined);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: CalendarTask) => {
    setSelectedTask(task);
    setSelectedDate(parse(task.start_date, 'yyyy-MM-dd', new Date()));
    setIsTaskModalOpen(true);
  };

  const handleEditProgram = (program: Program) => {
    setSelectedProgram(program);
    setIsProgramModalOpen(true);
    setIsEventModalOpen(false);
  };

  const handleSubmit = async (data: { program_id: number | null; task_type: string; start_date: string; end_date: string }) => {
    if (selectedTask) {
      await updateTask(selectedTask.id, data);
    } else {
      await addTask(data);
    }
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

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col">
      <div className="sticky top-0 bg-secondary z-20 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold text-text-primary">
              カレンダー
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousMonth}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-lg font-medium">
                {format(currentDate, 'yyyy年 M月', { locale: ja })}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="sticky top-0 bg-white z-10 grid grid-cols-7 border-b border-gray-200">
            {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
              <div
                key={day}
                className={`py-2 text-center text-sm font-medium ${
                  index === 0 ? 'text-red-500' : 
                  index === 6 ? 'text-blue-500' : 'text-text-primary'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {weeks.map((weekStart, index) => (
            <WeekView
              key={index}
              startDate={weekStart}
              programs={programs}
              tasks={tasks}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
              onShowEventDetail={(event) => {
                setSelectedEvent(event);
                setIsEventModalOpen(true);
              }}
              onEditProgram={handleEditProgram}
              isFirstWeekOfMonth={weekStart.getDate() <= 7}
            />
          ))}
        </div>
      </div>

      {isTaskModalOpen && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          selectedDate={selectedDate}
          task={selectedTask}
          onSubmit={handleSubmit}
        />
      )}

      {isEventModalOpen && selectedEvent && (
        <EventModal
          program={selectedEvent.program}
          type={selectedEvent.type}
          onClose={() => setIsEventModalOpen(false)}
          onEdit={() => handleEditProgram(selectedEvent.program)}
        />
      )}

      {isProgramModalOpen && selectedProgram && (
        <ProgramModal
          isOpen={isProgramModalOpen}
          onClose={() => setIsProgramModalOpen(false)}
          program={selectedProgram}
        />
      )}
    </div>
  );
}