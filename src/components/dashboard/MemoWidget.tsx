import React, { useState } from 'react';
import { Edit3, Save, X } from 'lucide-react';
import type { MemoContent } from '../../types/dashboard';

interface MemoWidgetProps {
  content: MemoContent;
  onUpdate: (content: MemoContent) => void;
}

export default function MemoWidget({ content, onUpdate }: MemoWidgetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(content.text || '');

  const handleSave = () => {
    onUpdate({ text: editText });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(content.text || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          className="w-full h-32 text-xs border border-gray-300 rounded px-2 py-1 resize-none focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          placeholder="チーム共有メモを入力..."
          autoFocus
        />
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

  return (
    <div className="group relative">
      <div className="text-xs text-text-secondary whitespace-pre-wrap min-h-[60px] leading-relaxed">
        {content.text || 'メモがありません。クリックして編集してください。'}
      </div>
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