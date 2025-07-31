import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutList, Calendar, Trello, X } from 'lucide-react';
import TeamDashboard from './dashboard/TeamDashboard';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* オーバーレイ（モバイル時のみ表示） */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      {/* サイドバー */}
      <aside
        className={`
          fixed top-0 left-0 h-screen bg-white border-r border-gray-200 z-30
          transition-transform duration-300 ease-in-out
          w-64 flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">プラッと進捗すごろく</h1>
          <button
            onClick={onClose}
            className="md:hidden text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="mt-6 flex flex-col gap-1 px-3">
          <NavLink
            to="/"
            end
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-text-primary hover:bg-primary/5 transition-colors ${
                isActive ? 'bg-primary/10 text-primary font-medium' : ''
              }`
            }
          >
            <LayoutList size={20} />
            <span>番組一覧</span>
          </NavLink>
          <NavLink
            to="/kanban"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-text-primary hover:bg-primary/5 transition-colors ${
                isActive ? 'bg-primary/10 text-primary font-medium' : ''
              }`
            }
          >
            <Trello size={20} />
            <span>カンバンボード</span>
          </NavLink>
          <NavLink
            to="/calendar"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-text-primary hover:bg-primary/5 transition-colors ${
                isActive ? 'bg-primary/10 text-primary font-medium' : ''
              }`
            }
          >
            <Calendar size={20} />
            <span>カレンダー</span>
          </NavLink>
        </nav>

        {/* チームダッシュボード */}
        <div className="flex-1 overflow-y-auto">
          <TeamDashboard />
        </div>
      </aside>
    </>
  );
}