import React, { useState, useRef, useEffect } from 'react';
import { PlusCircle, User, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ProgramModal from './ProgramModal';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, signOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="h-16 bg-primary border-b border-primary/10 flex items-center justify-between px-4 md:px-6 fixed top-0 right-0 left-0 md:left-64">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="md:hidden text-white/80 hover:text-white transition-colors"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-lg md:text-xl font-semibold text-white">プラッと進捗すごろく</h1>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg transition-colors text-sm md:text-base"
          >
            <PlusCircle size={20} />
            <span className="hidden md:inline">新規番組</span>
          </button>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <User size={20} />
              <span className="hidden md:inline">{user?.email || 'ユーザー'}</span>
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
                <button
                  onClick={async () => {
                    try {
                      await signOut();
                      setIsDropdownOpen(false);
                    } catch (error) {
                      console.error('ログアウトに失敗しました:', error);
                    }
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <LogOut size={16} />
                  <span>ログアウト</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <ProgramModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}