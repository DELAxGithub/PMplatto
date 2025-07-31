import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface DashboardWidgetProps {
  title: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  children: React.ReactNode;
}

export default function DashboardWidget({ 
  title, 
  isCollapsed = false, 
  onToggleCollapse,
  children 
}: DashboardWidgetProps) {
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={onToggleCollapse}
        className="w-full flex items-center justify-between px-3 py-2 text-left text-sm font-medium text-text-primary hover:bg-secondary transition-colors"
      >
        <span>{title}</span>
        {onToggleCollapse && (
          isCollapsed ? (
            <ChevronRight size={16} className="text-text-secondary" />
          ) : (
            <ChevronDown size={16} className="text-text-secondary" />
          )
        )}
      </button>
      
      {!isCollapsed && (
        <div className="px-3 pb-3 text-sm">
          {children}
        </div>
      )}
    </div>
  );
}