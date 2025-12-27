'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, TrendingUp } from 'lucide-react';

export interface TickerItem {
  id: string;
  type: 'breaking' | 'deadline' | 'new';  // 속보/마감임박/신규
  message: string;
  link?: string;  // 클릭 시 이동할 URL
}

interface NewsTickerProps {
  items: TickerItem[];
  speed?: number; // 픽셀/초
  onItemClick?: (item: TickerItem) => void;
}

// 타입별 색상 매핑
const typeColors: Record<TickerItem['type'], string> = {
  breaking: 'text-red-400',      // 속보 - 빨간색
  deadline: 'text-red-400',      // 마감임박 - 빨간색
  new: 'text-emerald-400',       // 신규 - 초록색
};

// 타입별 라벨
const typeLabels: Record<TickerItem['type'], string> = {
  breaking: '[속보]',
  deadline: '[마감임박]',
  new: '[신규]',
};

export function NewsTicker({ items, speed = 50, onItemClick }: NewsTickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [animationDuration, setAnimationDuration] = useState(20);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (contentRef.current && containerRef.current) {
      const contentWidth = contentRef.current.scrollWidth;
      const duration = contentWidth / speed;
      setAnimationDuration(duration);
    }
  }, [items, speed]);

  // 아이템 클릭 핸들러
  const handleItemClick = (item: TickerItem) => {
    if (item.link) {
      window.open(item.link, '_blank');
    }
    onItemClick?.(item);
  };

  // 티커 아이템 렌더링
  const renderTickerContent = () => (
    <>
      {items.map((item, index) => (
        <span
          key={`${item.id}-${index}`}
          onClick={() => handleItemClick(item)}
          className={`cursor-pointer hover:underline ${item.link ? 'hover:opacity-80' : ''}`}
        >
          <span className={`font-bold ${typeColors[item.type]}`}>
            {typeLabels[item.type]}
          </span>
          <span className="text-gray-300 ml-1">{item.message}</span>
          {index < items.length - 1 && (
            <span className="text-slate-600 mx-4">|</span>
          )}
        </span>
      ))}
    </>
  );

  return (
    <div className="bg-gradient-to-r from-slate-900 to-slate-800 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-10">
          {/* 아이콘 + 라벨 */}
          <div className="flex items-center gap-2 pr-4 border-r border-slate-700">
            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
              <Bell className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-orange-400 font-bold text-sm whitespace-nowrap">
              속보
            </span>
          </div>

          {/* 롤링 텍스트 영역 */}
          <div
            ref={containerRef}
            className="flex-1 overflow-hidden ml-4"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div
              ref={contentRef}
              className="inline-flex whitespace-nowrap text-sm"
              style={{
                animation: `ticker ${animationDuration}s linear infinite`,
                animationPlayState: isPaused ? 'paused' : 'running',
              }}
            >
              <span className="inline-flex items-center">
                {renderTickerContent()}
              </span>
              <span className="inline-flex items-center ml-16">
                {renderTickerContent()}
              </span>
            </div>
          </div>

          {/* 실시간 표시 */}
          <div className="flex items-center gap-1.5 pl-4 border-l border-slate-700">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-400 text-xs font-medium">LIVE</span>
          </div>
        </div>
      </div>

      {/* 인라인 스타일로 keyframes 정의 */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes ticker {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `
      }} />
    </div>
  );
}

/**
 * 미니 티커 (사이드바 등 작은 공간용)
 */
export function MiniTicker({ messages }: { messages: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [messages.length]);

  if (messages.length === 0) return null;

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-orange-500 flex-shrink-0" />
        <p className="text-sm text-orange-800 truncate animate-fade-in" key={currentIndex}>
          {messages[currentIndex]}
        </p>
      </div>
    </div>
  );
}
