/**
 * Desktop Sidebar Component
 *
 * Professional dark sidebar for desktop financial analysis application
 * - 256px expanded, 64px collapsed
 * - Dark theme (#1e293b slate-800)
 * - Persistent left navigation
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  History,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

// Font Awesome 아이콘 컴포넌트 (HTML 파일과 동일하게 맞춤)
const FAIcon = ({ icon, className = '' }: { icon: string; className?: string }) => (
  <i className={`fa-solid fa-${icon} ${className}`} />
);
import { cn } from '@/lib/utils/cn';
import { useFinancialContext } from '@/stores/financial-context-store';
import { SessionHistoryItem } from './SessionHistoryItem';
import { shallow } from 'zustand/shallow';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
  submenu?: NavItem[];
  noActiveStyle?: boolean;
}

/**
 * 현재 분석 단계를 localStorage에서 가져옴
 */
function getCurrentStep(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem('analyze-progress');
    if (saved) {
      const { step } = JSON.parse(saved);
      return step || null;
    }
  } catch (error) {
    console.error('Failed to get current step:', error);
  }
  return null;
}

// 랜딩 페이지 URL (headline-slide-v1.html)
const LANDING_URL = '/';

// 메인 네비게이션 메뉴 (Font Awesome 아이콘 - HTML과 동일)
const buildMainNav = (currentStep: number | null): NavItem[] => [
  { label: '대시보드', icon: <FAIcon icon="table-columns" />, href: '/' },
  {
    label: 'AI 기업정밀진단',
    icon: <FAIcon icon="magnifying-glass" />,
    href: '/',
    noActiveStyle: true,
    submenu: [
      { label: '재무 안정성 점수', icon: null, href: '/analyze/stability' },
      { label: '동종 업계 순위', icon: null, href: '/analyze/ranking' },
      { label: '비용·부채 리스크', icon: null, href: '/analyze/cost-risk' },
      { label: '현금흐름 패턴', icon: null, href: '/analyze/cashflow' },
      { label: '성장성 지표', icon: null, href: '/analyze/growth' },
      { label: '핵심 리스크·기회 요약', icon: null, href: '/analyze/risk-opportunity' },
    ]
  },
  { label: '정책자금 1분진단', icon: <FAIcon icon="landmark" />, href: '/analyze/policy-fund' },
  { label: '숨은 고용지원금 발굴', icon: <FAIcon icon="users" />, href: '/analyze/employment-grant' },
  { label: '미환급세금 조회', icon: <FAIcon icon="dollar-sign" />, href: '/analyze/tax-refund' },
];

// 부가 기능 메뉴 (Font Awesome 아이콘 - HTML과 동일)
const additionalNav: NavItem[] = [
  { label: '내 분석 기록', icon: <FAIcon icon="folder-open" />, href: '/history' },
  { label: '즐겨찾기 기업', icon: <FAIcon icon="star" />, href: '/favorites' },
  { label: '실전 브리핑 스크립트', icon: <FAIcon icon="clipboard-list" />, href: '/guide', badge: 'HOT' },
  { label: '전문가와 실전 동행 시작하기', icon: <FAIcon icon="handshake" />, href: '/expert', badge: 'HOT' },
];

// 기존 분석 메뉴 (하단 축소) - Font Awesome 아이콘
const legacyAnalysisNav: NavItem[] = [
  { label: '기업진단리포트', icon: <FAIcon icon="database" />, href: '/analyze/accounts' },
  { label: '세부재무분석', icon: <FAIcon icon="chart-line" />, href: '/analyze' },
  { label: '리스크 분석', icon: <FAIcon icon="triangle-exclamation" />, href: '/analyze/risks' },
  { label: '업무별 리포트', icon: <FAIcon icon="briefcase" />, href: '/analyze/workflow' },
  { label: '학습 센터', icon: <FAIcon icon="book-open" />, href: '/learn' },
];

// 정책자금 매칭 메뉴 - Font Awesome 아이콘
const policyFundNav: NavItem[] = [
  { label: '← 메인으로', icon: <FAIcon icon="house" />, href: LANDING_URL },
  { label: '기업정보 입력', icon: <FAIcon icon="building" />, href: '/analyze/policy-fund' },
  { label: '자격요건 분석', icon: <FAIcon icon="magnifying-glass" />, href: '/analyze/policy-fund#eligibility' },
  { label: '추천 상품', icon: <FAIcon icon="bullseye" />, href: '/analyze/policy-fund#recommendations' },
  { label: '신청 가이드', icon: <FAIcon icon="clipboard-list" />, href: '/analyze/policy-fund#guide' },
];

// 고용지원금 메뉴 - Font Awesome 아이콘
const employmentGrantNav: NavItem[] = [
  { label: '← 메인으로', icon: <FAIcon icon="house" />, href: LANDING_URL },
  { label: '사업장 정보', icon: <FAIcon icon="building" />, href: '/analyze/employment-grant' },
  { label: '고용현황 분석', icon: <FAIcon icon="users" />, href: '/analyze/employment-grant#analysis' },
  { label: '지원금 매칭', icon: <FAIcon icon="circle-check" />, href: '/analyze/employment-grant#matching' },
  { label: '수령액 산출', icon: <FAIcon icon="piggy-bank" />, href: '/analyze/employment-grant#calculation' },
];

// 미환급 세금 메뉴 - Font Awesome 아이콘
const taxRefundNav: NavItem[] = [
  { label: '← 메인으로', icon: <FAIcon icon="house" />, href: LANDING_URL },
  { label: '세금신고 내역', icon: <FAIcon icon="receipt" />, href: '/analyze/tax-refund' },
  { label: '환급항목 탐색', icon: <FAIcon icon="magnifying-glass" />, href: '/analyze/tax-refund#search' },
  { label: '환급액 계산', icon: <FAIcon icon="calculator" />, href: '/analyze/tax-refund#calculation' },
  { label: '신청 대행', icon: <FAIcon icon="file-lines" />, href: '/analyze/tax-refund#apply' },
];

// 경로에 따라 적절한 메뉴 반환 - 항상 메인 메뉴 사용
const getNavByPath = (pathname: string, currentStep: number | null): NavItem[] => {
  return buildMainNav(currentStep);
};

// 사이드바 제목 반환
const getSidebarTitle = (pathname: string): string => {
  if (pathname.startsWith('/analyze/policy-fund')) {
    return '정책자금 1분 진단';
  }
  if (pathname.startsWith('/analyze/employment-grant')) {
    return '숨은 고용지원금 발굴';
  }
  if (pathname.startsWith('/analyze/tax-refund')) {
    return '미환급 세금 조회';
  }
  return 'BizNovaAI 법인 컨설팅';
};

const footerNav: NavItem[] = [
  { label: '설정', icon: <FAIcon icon="gear" />, href: '/settings' },
  { label: '도움말', icon: <FAIcon icon="circle-question" />, href: '/help' },
];

// 미구현 페이지 목록
const disabledPages = [
  '/settings',
  '/help',
];

export function Sidebar() {
  const pathname = usePathname();

  // 현재 경로가 AI 기업정밀진단 서브메뉴인지 확인
  const isAIDiagnosisSubmenu = pathname.startsWith('/analyze/stability') ||
    pathname.startsWith('/analyze/ranking') ||
    pathname.startsWith('/analyze/cost-risk') ||
    pathname.startsWith('/analyze/cashflow') ||
    pathname.startsWith('/analyze/growth') ||
    pathname.startsWith('/analyze/risk-opportunity');

  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(() => {
    const initial = new Set(['업무별 리포트']);
    if (isAIDiagnosisSubmenu) {
      initial.add('AI 기업정밀진단');
    }
    return initial;
  });
  const [currentStep, setCurrentStep] = useState<number | null>(null);

  // Zustand store 연결 - 각 상태를 개별적으로 구독
  const sessionsMap = useFinancialContext((state) => state.sessions);
  const currentSessionId = useFinancialContext((state) => state.currentSessionId);
  const switchSession = useFinancialContext((state) => state.switchSession);
  const deleteSession = useFinancialContext((state) => state.deleteSession);

  // sessions Map을 배열로 변환 (최근 접근 순) - size를 의존성으로 사용
  const sessionsList = useMemo(() => {
    if (sessionsMap.size === 0) return [];
    return Array.from(sessionsMap.values()).sort((a, b) =>
      new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime()
    );
  }, [sessionsMap.size]);

  // localStorage 변경 감지하여 단계 업데이트
  useEffect(() => {
    const updateStep = () => {
      setCurrentStep(getCurrentStep());
    };

    // 초기 로드
    updateStep();

    // storage 이벤트 리스너 (다른 탭에서 변경 시)
    window.addEventListener('storage', updateStep);

    // 커스텀 이벤트 리스너 (같은 탭에서 변경 시)
    window.addEventListener('analyze-progress-updated', updateStep);

    return () => {
      window.removeEventListener('storage', updateStep);
      window.removeEventListener('analyze-progress-updated', updateStep);
    };
  }, []);

  // 경로 변경 시 AI 기업정밀진단 서브메뉴 자동 펼침
  useEffect(() => {
    if (isAIDiagnosisSubmenu) {
      setExpandedMenus(prev => {
        const next = new Set(prev);
        next.add('AI 기업정밀진단');
        return next;
      });
    }
  }, [pathname, isAIDiagnosisSubmenu]);

  const mainNav = getNavByPath(pathname, currentStep);
  const sidebarTitle = getSidebarTitle(pathname);
  const isSpecialMode = pathname.startsWith('/analyze/policy-fund') ||
                        pathname.startsWith('/analyze/employment-grant') ||
                        pathname.startsWith('/analyze/tax-refund');

  // 세션 전환 핸들러
  const handleSessionClick = (sessionId: string) => {
    switchSession(sessionId);
  };

  // 세션 삭제 핸들러
  const handleSessionDelete = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('이 세션을 삭제하시겠습니까?')) {
      deleteSession(sessionId);
    }
  };

  const toggleSubmenu = (label: string) => {
    setExpandedMenus(prev => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-80 bg-slate-800 text-slate-100 flex flex-col z-40 overflow-hidden"
    >
      {/* Logo - 클릭 시 메인화면(랜딩페이지)으로 이동 */}
      <Link href="/landing" className="h-16 flex items-center justify-center gap-3 border-b border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer">
        <svg width="32" height="32" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M25 0L28.5 16.5L45 20L28.5 23.5L25 40L21.5 23.5L5 20L21.5 16.5L25 0Z" fill="url(#paint0_linear_sidebar)"/>
          <circle cx="25" cy="20" r="5" fill="white" fillOpacity="0.9"/>
          <defs>
            <linearGradient id="paint0_linear_sidebar" x1="25" y1="0" x2="25" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3B82F6"/>
              <stop offset="1" stopColor="#2563EB"/>
            </linearGradient>
          </defs>
        </svg>
        <span className="text-xl font-bold text-white">Biz<span className="text-blue-500">Nova</span>AI</span>
      </Link>

      {/* Session History Section (ChatGPT 스타일) - 특수 모드에서는 숨김 */}
      {!isSpecialMode && sessionsList.length > 0 && (
        <div className="border-b border-slate-700 pb-2">
          <div className="px-4 py-3 flex items-center gap-2">
            <History size={16} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              분석 히스토리
            </span>
          </div>
          <div className="px-2 max-h-[200px] overflow-y-auto overflow-x-hidden space-y-1">
            {sessionsList.map((session) => (
              <SessionHistoryItem
                key={session.id}
                session={session}
                isActive={session.id === currentSessionId}
                onClick={() => handleSessionClick(session.id)}
                onDelete={(e) => handleSessionDelete(session.id, e)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 min-h-0 py-4 overflow-y-auto overflow-x-hidden">
        {/* 핵심 기능 메뉴 */}
        {mainNav.map((item) => {
          const isActive = pathname === item.href && !item.noActiveStyle;
          const isDisabled = disabledPages.includes(item.href);
          const hasSubmenu = item.submenu && item.submenu.length > 0;
          const isExpanded = expandedMenus.has(item.label);
          const hasActiveSubmenu = hasSubmenu && item.submenu?.some(sub => pathname === sub.href);

          // 서브메뉴가 있는 경우 아코디언 방식
          if (hasSubmenu) {
            return (
              <div key={`main-${item.label}`}>
                <button
                  onClick={() => toggleSubmenu(item.label)}
                  className={cn(
                    'w-full flex items-center h-12 px-4 mx-2 rounded-lg transition-all group relative overflow-hidden',
                    'hover:bg-white/10 text-slate-300',
                    hasActiveSubmenu && 'text-white'
                  )}
                >
                  <div className="w-6 h-6 mr-3 flex items-center justify-center">{item.icon}</div>
                  <span className="text-[15px] font-medium truncate flex-1 min-w-0 text-left">{item.label}</span>
                  <div className="ml-2 transition-transform duration-200">
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </div>
                </button>
                {/* 서브메뉴 */}
                <div className={cn(
                  'pl-10 overflow-hidden transition-all duration-300',
                  isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                )}>
                  {item.submenu?.map((subItem) => {
                    const isSubActive = pathname === subItem.href;
                    const isSubDisabled = disabledPages.includes(subItem.href);
                    return (
                      <Link
                        key={`sub-${subItem.label}`}
                        href={isSubDisabled ? '#' : subItem.href}
                        onClick={(e) => isSubDisabled && e.preventDefault()}
                        className={cn(
                          'flex items-center h-10 px-4 mx-2 rounded-lg transition-all group relative overflow-hidden',
                          isSubDisabled ? 'text-slate-600 cursor-not-allowed' : 'hover:bg-white/10',
                          isSubActive && !isSubDisabled && 'bg-slate-700 text-white',
                          !isSubActive && !isSubDisabled && 'text-slate-400'
                        )}
                      >
                        <span className="text-[13px] truncate flex-1 min-w-0">{subItem.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }

          // 일반 메뉴 항목
          return (
            <Link
              key={`main-${item.label}`}
              href={isDisabled ? '#' : item.href}
              onClick={(e) => isDisabled && e.preventDefault()}
              className={cn(
                'flex items-center h-12 px-4 mx-2 rounded-lg transition-all group relative overflow-hidden',
                isDisabled ? 'text-slate-600 cursor-not-allowed' : 'hover:bg-white/10',
                isActive && !isDisabled && 'bg-primary-500 text-white',
                !isActive && !isDisabled && 'text-slate-300'
              )}
            >
              {isActive && !isDisabled && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full" />
              )}
              <div className="w-6 h-6 mr-3 flex items-center justify-center">{item.icon}</div>
              <span className="text-[15px] font-medium truncate flex-1 min-w-0">{item.label}</span>
              {item.badge && (
                <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-orange-500 text-white rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* 구분선 */}
        <div className="my-4 mx-4 border-t border-slate-700" />

        {/* 부가 기능 메뉴 */}
        {additionalNav.map((item) => {
          const isActive = pathname === item.href;
          const isDisabled = disabledPages.includes(item.href);

          return (
            <Link
              key={`add-${item.label}`}
              href={isDisabled ? '#' : item.href}
              onClick={(e) => isDisabled && e.preventDefault()}
              className={cn(
                'flex items-center h-12 px-4 mx-2 rounded-lg transition-all group relative overflow-hidden',
                isDisabled ? 'text-slate-600 cursor-not-allowed' : 'hover:bg-white/10',
                isActive && !isDisabled && 'bg-primary-500 text-white',
                !isActive && !isDisabled && 'text-slate-300'
              )}
            >
              {isActive && !isDisabled && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full" />
              )}
              <div className="w-6 h-6 mr-3 flex items-center justify-center">{item.icon}</div>
              <span className="text-[15px] font-medium truncate flex-1 min-w-0">{item.label}</span>
              {item.badge && (
                <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-orange-500 text-white rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* 구분선 */}
        <div className="my-4 mx-4 border-t border-slate-700" />

        {/* 학습 센터 */}
        <Link
          href="/learn"
          className={cn(
            'flex items-center h-12 px-4 mx-2 rounded-lg transition-all group relative overflow-hidden',
            'hover:bg-white/10',
            pathname === '/learn' && 'bg-primary-500 text-white',
            pathname !== '/learn' && 'text-slate-300'
          )}
        >
          {pathname === '/learn' && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full" />
          )}
          <div className="w-6 h-6 mr-3 flex items-center justify-center"><FAIcon icon="book-open" /></div>
          <span className="text-[15px] font-medium">학습 센터</span>
        </Link>

      </nav>

      {/* Footer Navigation */}
      <div className="border-t border-slate-700 py-4 overflow-x-hidden">
        {footerNav.map((item) => {
          const isActive = pathname === item.href;
          const isDisabled = disabledPages.includes(item.href);
          return (
            <Link
              key={item.href}
              href={isDisabled ? '#' : item.href}
              onClick={(e) => isDisabled && e.preventDefault()}
              className={cn(
                'flex items-center h-12 px-4 mx-2 rounded-lg transition-all group relative overflow-hidden',
                isDisabled ? 'text-slate-600 cursor-not-allowed' : 'hover:bg-white/10',
                isActive && !isDisabled ? 'text-white' : !isDisabled && 'text-slate-300'
              )}
            >
              <div className="w-6 h-6 mr-3 flex items-center justify-center">
                {item.icon}
              </div>
              <span className="text-[15px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
