'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  Landmark,
  Users,
  Receipt,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageInfo {
  id: string;
  path: string;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
}

const PAGES: PageInfo[] = [
  {
    id: 'dashboard',
    path: '/',
    label: 'AI 기업 정밀 진단',
    shortLabel: '기업진단',
    icon: <BarChart3 size={18} />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30',
    glowColor: 'shadow-blue-500/20',
  },
  {
    id: 'policy-fund',
    path: '/analyze/policy-fund',
    label: '정책자금 1분 진단',
    shortLabel: '정책자금',
    icon: <Landmark size={18} />,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/30',
    glowColor: 'shadow-orange-500/20',
  },
  {
    id: 'employment-grant',
    path: '/analyze/employment-grant',
    label: '숨은 고용지원금 발굴',
    shortLabel: '고용지원금',
    icon: <Users size={18} />,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/30',
    glowColor: 'shadow-green-500/20',
  },
  {
    id: 'tax-refund',
    path: '/analyze/tax-refund',
    label: '미환급 세금 조회',
    shortLabel: '세금환급',
    icon: <Receipt size={18} />,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/30',
    glowColor: 'shadow-purple-500/20',
  },
];

export function PageNavigationIndicator() {
  const pathname = usePathname();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredPage, setHoveredPage] = useState<string | null>(null);

  const currentPageIndex = PAGES.findIndex(page => page.path === pathname);
  const currentPage = PAGES[currentPageIndex] || PAGES[0];

  const handleNavigate = (path: string) => {
    router.push(path);
    setIsExpanded(false);
  };

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-end gap-2">
      {/* 확장 토글 버튼 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          "bg-slate-800/80 backdrop-blur-md border border-slate-600/50",
          "text-slate-300 hover:text-white hover:bg-slate-700/80",
          "transition-all duration-300 shadow-lg",
          isExpanded && "rotate-180"
        )}
      >
        <ChevronUp size={18} />
      </button>

      {/* 메인 네비게이션 패널 */}
      <div
        className={cn(
          "relative flex flex-col gap-1 p-2 rounded-2xl",
          "bg-slate-900/80 backdrop-blur-xl border border-slate-700/50",
          "shadow-2xl transition-all duration-500 ease-out",
          isExpanded ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 pointer-events-none"
        )}
      >
        {/* 글로우 효과 */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-slate-700/20 to-transparent pointer-events-none" />

        {PAGES.map((page, index) => {
          const isActive = page.path === pathname;
          const isHovered = hoveredPage === page.id;

          return (
            <div key={page.id} className="relative">
              <button
                onClick={() => handleNavigate(page.path)}
                onMouseEnter={() => setHoveredPage(page.id)}
                onMouseLeave={() => setHoveredPage(null)}
                className={cn(
                  "relative w-full flex items-center gap-3 px-4 py-3 rounded-xl",
                  "transition-all duration-300 group",
                  isActive
                    ? `${page.bgColor} ${page.borderColor} border shadow-lg ${page.glowColor}`
                    : "hover:bg-slate-800/60 border border-transparent"
                )}
              >
                {/* 페이지 아이콘 */}
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
                  isActive ? page.bgColor : "bg-slate-700/50",
                  isActive ? page.color : "text-slate-400 group-hover:text-slate-200"
                )}>
                  {page.icon}
                </div>

                {/* 페이지 라벨 */}
                <div className="flex flex-col items-start min-w-[120px]">
                  <span className={cn(
                    "text-sm font-medium transition-colors duration-300",
                    isActive ? "text-white" : "text-slate-300 group-hover:text-white"
                  )}>
                    {page.shortLabel}
                  </span>
                  <span className={cn(
                    "text-xs transition-colors duration-300",
                    isActive ? page.color : "text-slate-500 group-hover:text-slate-400"
                  )}>
                    {page.label}
                  </span>
                </div>

                {/* 활성 인디케이터 */}
                {isActive && (
                  <div className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full",
                    page.color.replace('text-', 'bg-')
                  )} />
                )}

                {/* 페이지 번호 */}
                <span className={cn(
                  "ml-auto text-xs font-mono",
                  isActive ? page.color : "text-slate-600"
                )}>
                  {String(index + 1).padStart(2, '0')}
                </span>
              </button>
            </div>
          );
        })}

        {/* 하단 프로그레스 바 */}
        <div className="mt-2 px-2">
          <div className="h-1 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                currentPage.color.replace('text-', 'bg-')
              )}
              style={{ width: `${((currentPageIndex + 1) / PAGES.length) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-slate-500">시작</span>
            <span className="text-[10px] text-slate-500">{currentPageIndex + 1} / {PAGES.length}</span>
          </div>
        </div>
      </div>

      {/* 미니 인디케이터 (닫혔을 때) */}
      <div
        className={cn(
          "flex flex-col gap-2 p-2 rounded-xl",
          "bg-slate-900/80 backdrop-blur-xl border border-slate-700/50",
          "shadow-xl transition-all duration-500",
          !isExpanded ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 pointer-events-none"
        )}
      >
        {PAGES.map((page, index) => {
          const isActive = page.path === pathname;

          return (
            <button
              key={page.id}
              onClick={() => handleNavigate(page.path)}
              onMouseEnter={() => setHoveredPage(page.id)}
              onMouseLeave={() => setHoveredPage(null)}
              className={cn(
                "relative w-10 h-10 rounded-xl flex items-center justify-center",
                "transition-all duration-300 group",
                isActive
                  ? `${page.bgColor} ${page.borderColor} border shadow-md ${page.glowColor}`
                  : "hover:bg-slate-800/60"
              )}
            >
              <div className={cn(
                "transition-all duration-300",
                isActive ? page.color : "text-slate-500 group-hover:text-slate-300"
              )}>
                {page.icon}
              </div>

              {/* 호버 툴팁 */}
              <div className={cn(
                "absolute right-full mr-3 px-3 py-2 rounded-lg",
                "bg-slate-800/95 backdrop-blur-sm border border-slate-700/50",
                "whitespace-nowrap transition-all duration-200",
                "opacity-0 translate-x-2 pointer-events-none",
                "group-hover:opacity-100 group-hover:translate-x-0"
              )}>
                <span className={cn("text-sm font-medium", page.color)}>
                  {page.shortLabel}
                </span>
                <div className={cn(
                  "absolute right-0 top-1/2 -translate-y-1/2 translate-x-1",
                  "w-2 h-2 rotate-45 bg-slate-800/95 border-r border-t border-slate-700/50"
                )} />
              </div>

              {/* 활성 도트 */}
              {isActive && (
                <div className={cn(
                  "absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full",
                  page.color.replace('text-', 'bg-')
                )} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
