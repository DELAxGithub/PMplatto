import React, { useState } from 'react';
import { ExternalLink, Plus, X, Edit3, Save } from 'lucide-react';
import type { QuickLinksContent, QuickLink } from '../../types/dashboard';

interface QuickLinksWidgetProps {
  content: QuickLinksContent;
  onUpdate: (content: QuickLinksContent) => void;
}

export default function QuickLinksWidget({ content, onUpdate }: QuickLinksWidgetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editLinks, setEditLinks] = useState<QuickLink[]>(content.links || []);
  const [newLink, setNewLink] = useState<QuickLink>({ url: '', label: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSave = () => {
    onUpdate({ links: editLinks });
    setIsEditing(false);
    setShowAddForm(false);
    setNewLink({ url: '', label: '' });
  };

  const handleCancel = () => {
    setEditLinks(content.links || []);
    setIsEditing(false);
    setShowAddForm(false);
    setNewLink({ url: '', label: '' });
  };

  const addLink = () => {
    if (newLink.url && newLink.label) {
      setEditLinks([...editLinks, newLink]);
      setNewLink({ url: '', label: '' });
      setShowAddForm(false);
    }
  };

  const removeLink = (index: number) => {
    setEditLinks(editLinks.filter((_, i) => i !== index));
  };

  const updateLink = (index: number, field: 'url' | 'label', value: string) => {
    setEditLinks(editLinks.map((link, i) => 
      i === index ? { ...link, [field]: value } : link
    ));
  };

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          {editLinks.map((link, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <div className="flex-1 space-y-1">
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) => updateLink(index, 'label', e.target.value)}
                  placeholder="ラベル"
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => updateLink(index, 'url', e.target.value)}
                  placeholder="https://..."
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
              <button
                onClick={() => removeLink(index)}
                className="p-1 text-red-500 hover:text-red-700 transition-colors"
                title="削除"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        {showAddForm && (
          <div className="p-2 bg-blue-50 rounded space-y-1">
            <input
              type="text"
              value={newLink.label}
              onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
              placeholder="ラベル"
              className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
            <input
              type="url"
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              placeholder="https://..."
              className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={addLink}
                disabled={!newLink.url || !newLink.label || !validateUrl(newLink.url)}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={12} />
                追加
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewLink({ url: '', label: '' });
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
            リンクを追加
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

  const links = content.links || [];

  return (
    <div className="group relative">
      {links.length === 0 ? (
        <div className="text-xs text-text-secondary py-2">
          クイックリンクがありません。
        </div>
      ) : (
        <div className="space-y-2">
          {links.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <ExternalLink size={12} />
              <span className="truncate">{link.label}</span>
            </a>
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