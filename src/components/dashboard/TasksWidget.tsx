import React, { useState } from 'react';
import { Plus, X, Edit3, Save, Check } from 'lucide-react';
import type { TasksContent, Task } from '../../types/dashboard';

interface TasksWidgetProps {
  content: TasksContent;
  onUpdate: (content: TasksContent) => void;
}

export default function TasksWidget({ content, onUpdate }: TasksWidgetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTasks, setEditTasks] = useState<Task[]>(content.tasks || []);
  const [newTaskText, setNewTaskText] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const generateTaskId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  const handleSave = () => {
    onUpdate({ tasks: editTasks });
    setIsEditing(false);
    setShowAddForm(false);
    setNewTaskText('');
  };

  const handleCancel = () => {
    setEditTasks(content.tasks || []);
    setIsEditing(false);
    setShowAddForm(false);
    setNewTaskText('');
  };

  const addTask = () => {
    if (newTaskText.trim()) {
      const newTask: Task = {
        id: generateTaskId(),
        text: newTaskText.trim(),
        completed: false
      };
      setEditTasks([...editTasks, newTask]);
      setNewTaskText('');
      setShowAddForm(false);
    }
  };

  const removeTask = (id: string) => {
    setEditTasks(editTasks.filter(task => task.id !== id));
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setEditTasks(editTasks.map(task => 
      task.id === id ? { ...task, ...updates } : task
    ));
  };

  const toggleTaskCompletion = (id: string) => {
    const tasks = content.tasks || [];
    const updatedTasks = tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    onUpdate({ tasks: updatedTasks });
  };

  if (isEditing) {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          {editTasks.map((task) => (
            <div key={task.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={(e) => updateTask(task.id, { completed: e.target.checked })}
                className="w-3 h-3 text-primary focus:ring-primary focus:ring-1 border-gray-300 rounded"
              />
              <input
                type="text"
                value={task.text}
                onChange={(e) => updateTask(task.id, { text: e.target.value })}
                className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
              <button
                onClick={() => removeTask(task.id)}
                className="p-1 text-red-500 hover:text-red-700 transition-colors"
                title="削除"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        {showAddForm && (
          <div className="p-2 bg-blue-50 rounded">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="新しいタスクを入力..."
                className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addTask();
                  }
                }}
                autoFocus
              />
              <button
                onClick={addTask}
                disabled={!newTaskText.trim()}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={12} />
                追加
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewTaskText('');
                }}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
          >
            <Plus size={12} />
            タスクを追加
          </button>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-primary text-white rounded hover:bg-primary/90 transition-colors"
          >
            <Save size={12} />
            保存
          </button>
          <button
            onClick={handleCancel}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            <X size={12} />
            キャンセル
          </button>
        </div>
      </div>
    );
  }

  const tasks = content.tasks || [];

  return (
    <div className="group relative">
      {tasks.length === 0 ? (
        <div className="text-xs text-text-secondary py-2">
          タスクがありません。
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-2 text-xs">
              <button
                onClick={() => toggleTaskCompletion(task.id)}
                className={`w-3 h-3 border rounded flex items-center justify-center transition-colors ${
                  task.completed 
                    ? 'bg-primary border-primary text-white' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {task.completed && <Check size={10} />}
              </button>
              <span className={`flex-1 ${
                task.completed ? 'line-through text-text-secondary' : 'text-text-primary'
              }`}>
                {task.text}
              </span>
            </div>
          ))}
        </div>
      )}
      
      <button
        onClick={() => setIsEditing(true)}
        className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-text-secondary hover:text-text-primary"
        title="編集"
      >
        <Edit3 size={12} />
      </button>
    </div>
  );
}