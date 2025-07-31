import React, { useState } from 'react';
import { useDashboard } from '../../hooks/useDashboard';
import DashboardWidget from './DashboardWidget';
import MemoWidget from './MemoWidget';
import QuickLinksWidget from './QuickLinksWidget';
import TasksWidget from './TasksWidget';
import ScheduleWidget from './ScheduleWidget';
import type { DashboardWidget as DashboardWidgetType, MemoContent, QuickLinksContent, TasksContent } from '../../types/dashboard';

export default function TeamDashboard() {
  const { widgets, loading, error, updateWidget } = useDashboard();
  const [collapsedWidgets, setCollapsedWidgets] = useState<Record<string, boolean>>({});

  const toggleCollapse = (widgetId: string) => {
    setCollapsedWidgets(prev => ({
      ...prev,
      [widgetId]: !prev[widgetId]
    }));
  };

  if (loading) {
    return (
      <div className="px-3 py-2 text-sm text-text-secondary">
        読み込み中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-3 py-2 text-sm text-red-600">
        {error}
      </div>
    );
  }

  const renderWidgetContent = (widget: DashboardWidgetType) => {
    switch (widget.widget_type) {
      case 'memo':
        return (
          <MemoWidget 
            content={widget.content as MemoContent} 
            onUpdate={(content) => updateWidget(widget.id, { content })}
          />
        );
      case 'quicklinks':
        return (
          <QuickLinksWidget 
            content={widget.content as QuickLinksContent} 
            onUpdate={(content) => updateWidget(widget.id, { content })}
          />
        );
      case 'tasks':
        return (
          <TasksWidget 
            content={widget.content as TasksContent} 
            onUpdate={(content) => updateWidget(widget.id, { content })}
          />
        );
      case 'schedule':
        return <ScheduleWidget />;
      default:
        return null;
    }
  };

  return (
    <div className="border-t border-gray-200 mt-4">
      <div className="px-3 py-2 text-xs font-semibold text-text-secondary uppercase tracking-wide">
        チームダッシュボード
      </div>
      
      {widgets.map((widget) => (
        <DashboardWidget
          key={widget.id}
          title={widget.title}
          isCollapsed={collapsedWidgets[widget.id]}
          onToggleCollapse={() => toggleCollapse(widget.id)}
        >
          {renderWidgetContent(widget)}
        </DashboardWidget>
      ))}
    </div>
  );
}