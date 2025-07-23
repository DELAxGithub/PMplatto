import React from 'react';
import { X, Link2, Copy, ExternalLink } from 'lucide-react';
import type { Program } from '../types/program';

interface ProgramDetailModalProps {
  program: Program;
  onClose: () => void;
  onEdit: () => void;
}

export default function ProgramDetailModal({ program, onClose, onEdit }: ProgramDetailModalProps) {
  const [copySuccess, setCopySuccess] = React.useState<string | null>(null);

  const handleCopyUrl = async (url: string, label: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(label);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-text-primary">番組詳細</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <div className="text-sm text-text-secondary font-medium">{program.program_id}</div>
            <h3 className="text-lg font-medium text-text-primary mt-1">{program.title}</h3>
            {program.subtitle && (
              <p className="text-text-secondary mt-1">{program.subtitle}</p>
            )}
          </div>

          {program.script_url && (
            <div className="bg-primary/5 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary">
                  <Link2 size={20} />
                  <span className="font-medium">台本・素材URL</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyUrl(program.script_url!, '台本URL')}
                    className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-primary"
                    title="URLをコピー"
                  >
                    <Copy size={16} />
                  </button>
                  <a
                    href={program.script_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-primary"
                    title="新しいタブで開く"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
              {copySuccess === '台本URL' && (
                <div className="text-sm text-primary">URLをコピーしました！</div>
              )}
              <div className="text-sm text-text-secondary break-all">
                {program.script_url}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-sm font-medium text-text-primary mb-1">ステータス</div>
              <div className={`inline-flex px-2.5 py-1 rounded-full text-sm font-medium bg-status-${program.status} bg-opacity-20 text-text-primary`}>
                {program.status}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-text-primary mb-1">放送日</div>
              <div className="text-text-secondary">{program.first_air_date || '未定'}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-text-primary mb-1">収録日</div>
              <div className="text-text-secondary">{program.filming_date || '未定'}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-text-primary mb-1">完パケ納品日</div>
              <div className="text-text-secondary">{program.complete_date || '未定'}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-text-primary mb-1">再放送日</div>
              <div className="text-text-secondary">{program.re_air_date || '未定'}</div>
            </div>

            {(program.cast1 || program.cast2) && (
              <div className="col-span-2">
                <div className="text-sm font-medium text-text-primary mb-1">出演者</div>
                <div className="text-text-secondary">
                  {[program.cast1, program.cast2].filter(Boolean).join('、')}
                </div>
              </div>
            )}

            {program.pr_80text && (
              <div className="col-span-2">
                <div className="text-sm font-medium text-text-primary mb-1">PR用テキスト（80文字）</div>
                <div className="text-text-secondary whitespace-pre-wrap rounded-lg bg-gray-50 p-3">
                  {program.pr_80text}
                </div>
              </div>
            )}

            {program.pr_200text && (
              <div className="col-span-2">
                <div className="text-sm font-medium text-text-primary mb-1">PR用テキスト（200文字）</div>
                <div className="text-text-secondary whitespace-pre-wrap rounded-lg bg-gray-50 p-3">
                  {program.pr_200text}
                </div>
              </div>
            )}

            {program.notes && (
              <div className="col-span-2">
                <div className="text-sm font-medium text-text-primary mb-1">備考</div>
                <div className="text-text-secondary whitespace-pre-wrap">{program.notes}</div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
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