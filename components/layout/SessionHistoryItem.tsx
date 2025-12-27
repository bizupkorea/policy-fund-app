/**
 * Session History Item Component
 *
 * ChatGPT 스타일 세션 히스토리 아이템
 * - 회사명 + 연도 표시
 * - 상대 시간 표시 ("5분 전")
 * - 활성 세션 하이라이트
 * - 호버 시 삭제 버튼 표시
 */

'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { Session } from '@/stores/financial-context-store';
import { getSessionDisplayName, formatTimeAgo } from '@/lib/utils/session';
import { cn } from '@/lib/utils/cn';

interface SessionHistoryItemProps {
  session: Session;
  isActive: boolean;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

export function SessionHistoryItem({
  session,
  isActive,
  onClick,
  onDelete,
}: SessionHistoryItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const displayName = getSessionDisplayName(
    session.context.documentInfo.companyName,
    session.context.documentInfo.fiscalYear
  );

  const timeAgo = formatTimeAgo(session.lastAccessedAt);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'w-full text-left px-3 py-2.5 rounded-lg transition-all group relative flex items-center justify-between cursor-pointer',
        'hover:bg-white/10',
        isActive && 'bg-primary-500/20 text-white',
        !isActive && 'text-slate-300'
      )}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-400 rounded-r-full" />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0 pl-2">
        <p
          className={cn(
            'text-sm font-medium truncate',
            isActive ? 'text-white' : 'text-slate-200'
          )}
        >
          {displayName}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">{timeAgo}</p>
      </div>

      {/* Delete button (visible on hover) */}
      {isHovered && (
        <button
          onClick={onDelete}
          className="ml-2 p-1 rounded hover:bg-slate-700 transition-colors flex-shrink-0"
          aria-label="세션 삭제"
        >
          <X size={14} className="text-slate-400 hover:text-white" />
        </button>
      )}
    </div>
  );
}
