/**
 * Top Navigation Bar Component
 *
 * Desktop top bar with breadcrumbs, search, and user menu
 * Height: 64px (matching sidebar collapsed width)
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Search, Bell, User, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface TopNavProps {
  /**
   * Breadcrumb items
   */
  breadcrumbs?: BreadcrumbItem[];

  /**
   * Show search bar
   * @default false
   */
  showSearch?: boolean;

  /**
   * Additional actions to display
   */
  actions?: React.ReactNode;

  /**
   * User name to display
   */
  userName?: string;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * TopNav Component
 *
 * @example
 * ```tsx
 * <TopNav
 *   breadcrumbs={[
 *     { label: '대시보드', href: '/' },
 *     { label: '재무 분석' }
 *   ]}
 *   showSearch
 *   userName="홍길동"
 * />
 * ```
 */
export function TopNav({
  breadcrumbs = [],
  showSearch = false,
  actions,
  userName,
  className = '',
}: TopNavProps) {
  const pathname = usePathname();

  // Auto-generate breadcrumbs from pathname if not provided
  const displayBreadcrumbs = breadcrumbs.length > 0 ? breadcrumbs : generateBreadcrumbs(pathname);

  return (
    <header
      className={cn(
        'h-16 bg-white border-b border-neutral-200 flex items-center px-6',
        'sticky top-0 z-30',
        className
      )}
    >
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 flex-1">
        {displayBreadcrumbs.map((item, index) => {
          const isLast = index === displayBreadcrumbs.length - 1;

          return (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && (
                <ChevronRight size={16} className="text-neutral-400" />
              )}

              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-[15px] text-neutral-600 hover:text-primary-600 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={cn(
                  'text-[15px] font-medium',
                  isLast ? 'text-neutral-900' : 'text-neutral-600'
                )}>
                  {item.label}
                </span>
              )}
            </div>
          );
        })}
      </nav>

      {/* Search Bar */}
      {showSearch && (
        <div className="relative mx-6 flex-1 max-w-md">
          <Search
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="text"
            placeholder="검색..."
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-[15px]"
          />
        </div>
      )}

      {/* Actions */}
      {actions && (
        <div className="flex items-center gap-2 mx-4">
          {actions}
        </div>
      )}

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button
          className="relative p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          aria-label="알림"
        >
          <Bell size={20} className="text-neutral-600" />
          {/* Notification badge */}
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full" />
        </button>

        {/* Settings */}
        <button
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          aria-label="설정"
        >
          <SettingsIcon size={20} className="text-neutral-600" />
        </button>

        {/* User Menu */}
        <div className="flex items-center gap-3 pl-3 border-l border-neutral-200">
          <div className="flex items-center gap-2 hover:bg-neutral-100 rounded-lg px-3 py-2 transition-colors cursor-pointer">
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            {userName && (
              <span className="text-[15px] font-medium text-neutral-900">
                {userName}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * Auto-generate breadcrumbs from pathname
 */
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const pathMap: Record<string, string> = {
    '/': '대시보드',
    '/upload': '파일 업로드',
    '/analyze': '세부재무분석',
    '/consulting': '컨설팅 준비',
    '/chat': '대화형 분석',
    '/settings': '설정',
    '/help': '도움말',
  };

  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return [{ label: pathMap['/'] || '대시보드' }];
  }

  const breadcrumbs: BreadcrumbItem[] = [
    { label: '대시보드', href: '/' }
  ];

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;

    breadcrumbs.push({
      label: pathMap[currentPath] || segment,
      href: isLast ? undefined : currentPath,
    });
  });

  return breadcrumbs;
}
