/**
 * Main Layout Component
 *
 * Desktop-first professional layout with:
 * - Fixed left sidebar (256px/64px)
 * - Top navigation bar (64px)
 * - Scrollable content area with 12-column grid
 * - Max-width 1440px container
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { TopNav, TopNavProps } from './TopNav';
import { PageNavigationIndicator } from '@/components/ui/PageNavigationIndicator';
import { NewsTicker } from '@/components/policy-fund/NewsTicker';
import { useTickerStore } from '@/stores/ticker-store';
import { cn } from '@/lib/utils/cn';

// 페이지 네비게이션 인디케이터가 표시될 경로들
const INDICATOR_PATHS = [
  '/',
  '/analyze/policy-fund',
  '/analyze/employment-grant',
  '/analyze/tax-refund',
];

export interface MainLayoutProps {
  /**
   * Page content
   */
  children: React.ReactNode;

  /**
   * TopNav props
   */
  topNav?: Omit<TopNavProps, 'className'>;

  /**
   * Hide sidebar
   * @default false
   */
  hideSidebar?: boolean;

  /**
   * Hide top nav
   * @default false
   */
  hideTopNav?: boolean;

  /**
   * Max width of content container
   * @default '1440px'
   */
  maxWidth?: '1280px' | '1440px' | '1536px' | 'full';

  /**
   * Content padding
   * @default '32px'
   */
  contentPadding?: '0' | '16px' | '24px' | '32px' | '40px';

  /**
   * Background color
   * @default 'light' (#f8fafc)
   */
  background?: 'white' | 'light' | 'neutral';

  /**
   * Additional CSS classes for content area
   */
  contentClassName?: string;
}

/**
 * MainLayout Component
 *
 * @example
 * ```tsx
 * <MainLayout
 *   topNav={{
 *     breadcrumbs: [
 *       { label: '대시보드', href: '/' },
 *       { label: '재무 분석' }
 *     ],
 *     showSearch: true,
 *     userName: '홍길동'
 *   }}
 * >
 *   <h1>Page Content</h1>
 * </MainLayout>
 * ```
 */
export function MainLayout({
  children,
  topNav,
  hideSidebar = false,
  hideTopNav = false,
  maxWidth = '1440px',
  contentPadding = '32px',
  background = 'light',
  contentClassName = '',
}: MainLayoutProps) {
  const pathname = usePathname();
  const showIndicator = INDICATOR_PATHS.includes(pathname);

  // 롤링 티커 데이터 - Zustand 전역 상태 사용 (페이지 이동 시에도 유지)
  const tickerItems = useTickerStore((state) => state.items);
  const lastFetched = useTickerStore((state) => state.lastFetched);
  const isLoading = useTickerStore((state) => state.isLoading);
  const setItems = useTickerStore((state) => state.setItems);
  const setLoading = useTickerStore((state) => state.setLoading);

  // 클라이언트 마운트 상태 (SSR hydration mismatch 방지)
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // 클라이언트 마운트 대기
    if (!isMounted) return;

    // 로딩 중이면 스킵
    if (isLoading) return;

    // 이미 데이터 있고 5분 안 지났으면 스킵
    const REFETCH_INTERVAL = 5 * 60 * 1000;
    if (lastFetched && (Date.now() - lastFetched < REFETCH_INTERVAL)) return;

    const fetchBriefing = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/policy-fund/daily');
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setItems(result.data.tickerItems);
          }
        }
      } catch (error) {
        console.error('[Ticker] 티커 데이터 로드 실패:', error);
        setLoading(false);
      }
    };

    fetchBriefing();
  }, [isMounted, isLoading, lastFetched, setItems, setLoading]);

  const backgroundColors = {
    white: 'bg-white',
    light: 'bg-slate-50',
    neutral: 'bg-neutral-100',
  };

  const maxWidthClasses = {
    '1280px': 'max-w-[1280px]',
    '1440px': 'max-w-[1440px]',
    '1536px': 'max-w-[1536px]',
    'full': 'max-w-full',
  };

  const paddingClasses = {
    '0': 'p-0',
    '16px': 'p-4',
    '24px': 'p-6',
    '32px': 'p-8',
    '40px': 'p-10',
  };

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      {/* Sidebar */}
      {!hideSidebar && <Sidebar />}

      {/* Main Content Area */}
      <div
        className={cn(
          'flex-1 flex flex-col',
          !hideSidebar && 'ml-80', // Offset for expanded sidebar (320px)
          backgroundColors[background]
        )}
      >
        {/* 상단 롤링 티커 - 고정 위치로 항상 표시 */}
        <div className="sticky top-0 z-40">
          {!isMounted ? (
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 h-10" />
          ) : tickerItems.length > 0 ? (
            <NewsTicker items={tickerItems} speed={60} />
          ) : (
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 h-10" />
          )}
        </div>

        {/* Top Navigation */}
        {!hideTopNav && <TopNav {...topNav} />}

        {/* Content */}
        <main
          className={cn(
            'flex-1',
            paddingClasses[contentPadding],
            contentClassName
          )}
        >
          <div className={cn('mx-auto w-full', maxWidthClasses[maxWidth])}>
            {children}
          </div>
        </main>
      </div>

      {/* Page Navigation Indicator - 4가지 핵심 기능 페이지에서만 표시 */}
      {showIndicator && <PageNavigationIndicator />}

      {/* Floating AI Chat Button - 프로토타입과 동일 */}
      <Link
        href="/analyze/chat"
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-4 rounded-2xl shadow-lg flex items-center gap-3 z-50 hover:scale-105 transition-transform duration-300"
        title="AI 컨설팅 챗"
      >
        <span className="text-2xl">🤖</span>
        <div className="text-left">
          <p className="font-bold text-sm">대화형 AI 컨설팅챗</p>
          <p className="text-xs text-blue-100">정책자금/세무/노무 Q&A</p>
        </div>
      </Link>
    </div>
  );
}

/**
 * Content Section Component
 * Helper component for consistent section spacing
 */
export function ContentSection({
  children,
  className = '',
  spacing = 'normal',
}: {
  children: React.ReactNode;
  className?: string;
  spacing?: 'tight' | 'normal' | 'loose';
}) {
  const spacingClasses = {
    tight: 'mb-4',
    normal: 'mb-8',
    loose: 'mb-12',
  };

  return (
    <section className={cn(spacingClasses[spacing], className)}>
      {children}
    </section>
  );
}

/**
 * Page Header Component
 * Standard page title with optional description and actions
 */
export function PageHeader({
  title,
  description,
  actions,
  className = '',
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-8', className)}>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2 leading-[1.7]">
            {title}
          </h1>
          {description && (
            <p className="text-[15px] text-neutral-600 leading-[1.7]">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Grid Container Component
 * 12-column grid system with configurable gaps
 */
export function GridContainer({
  children,
  cols = 12,
  gap = '24px',
  className = '',
}: {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: '16px' | '24px' | '32px';
  className?: string;
}) {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    6: 'grid-cols-6',
    12: 'grid-cols-12',
  };

  const gapClasses = {
    '16px': 'gap-4',
    '24px': 'gap-6',
    '32px': 'gap-8',
  };

  return (
    <div className={cn('grid', colClasses[cols], gapClasses[gap], className)}>
      {children}
    </div>
  );
}
