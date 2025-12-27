/**
 * KPI Card Component
 *
 * Professional financial metric display with trend indicators,
 * sparklines, and hover effects
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';
import MetricBadge, { TrendDirection } from './MetricBadge';

export interface KPICardProps {
  /**
   * Card title (e.g., "Total Revenue", "Net Income")
   */
  title: string;

  /**
   * Main metric value
   */
  value: number | string;

  /**
   * Unit for the value (e.g., "원", "USD", "%")
   * @default ''
   */
  unit?: string;

  /**
   * Percentage change from previous period
   * If provided, MetricBadge will be displayed
   */
  change?: number;

  /**
   * Override automatic trend detection for badge
   */
  trend?: TrendDirection;

  /**
   * Invert badge colors (useful for cost metrics)
   */
  invertColors?: boolean;

  /**
   * Icon to display in the header
   */
  icon?: LucideIcon;

  /**
   * Icon background color
   * @default 'primary'
   */
  iconColor?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'success' | 'warning' | 'danger';

  /**
   * Sparkline data points for mini trend chart
   * Array of numbers representing historical values
   */
  sparklineData?: number[];

  /**
   * Additional description or subtitle
   */
  description?: string;

  /**
   * Footer content (e.g., "vs last month")
   */
  footer?: React.ReactNode;

  /**
   * Click handler
   */
  onClick?: () => void;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Loading state
   */
  loading?: boolean;
}

/**
 * KPI Card Component
 *
 * @example
 * ```tsx
 * <KPICard
 *   title="Total Revenue"
 *   value={3456789000}
 *   unit="원"
 *   change={12.5}
 *   icon={TrendingUp}
 *   iconColor="success"
 *   description="Current fiscal year"
 * />
 * ```
 */
export default function KPICard({
  title,
  value,
  unit = '',
  change,
  trend,
  invertColors = false,
  icon: Icon,
  iconColor = 'primary',
  sparklineData,
  description,
  footer,
  onClick,
  className = '',
  loading = false,
}: KPICardProps) {
  // Format numeric values
  const formattedValue = typeof value === 'number'
    ? value.toLocaleString('ko-KR')
    : value;

  // Icon background colors
  const iconBgColors = {
    primary: 'bg-primary-100 text-primary-600',
    secondary: 'bg-secondary-100 text-secondary-600',
    accent: 'bg-accent-100 text-accent-600',
    neutral: 'bg-neutral-100 text-neutral-600',
    success: 'bg-success-100 text-success-600',
    warning: 'bg-warning-100 text-warning-600',
    danger: 'bg-danger-100 text-danger-600',
  }[iconColor];

  // Loading skeleton
  if (loading) {
    return (
      <div className={`
        bg-white rounded-lg border border-neutral-200 p-6
        ${className}
      `}>
        <div className="animate-pulse">
          <div className="flex items-start justify-between mb-4">
            <div className="h-4 bg-neutral-200 rounded w-24"></div>
            <div className="h-8 w-8 bg-neutral-200 rounded-lg"></div>
          </div>
          <div className="h-8 bg-neutral-200 rounded w-32 mb-2"></div>
          <div className="h-4 bg-neutral-200 rounded w-20"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        bg-white rounded-lg border border-neutral-200 p-6
        transition-all duration-200
        hover:border-primary-300 hover:shadow-md
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-neutral-600 mb-1">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-neutral-500">
              {description}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`
            p-2 rounded-lg
            ${iconBgColors}
          `}>
            <Icon size={20} />
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mb-3">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-neutral-900 font-sans">
            {formattedValue}
          </span>
          {unit && (
            <span className="text-lg font-medium text-neutral-600">
              {unit}
            </span>
          )}
        </div>
      </div>

      {/* Change Badge & Sparkline */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {change !== undefined && (
            <MetricBadge
              change={change}
              trend={trend}
              invertColors={invertColors}
              size="sm"
            />
          )}
        </div>

        {sparklineData && sparklineData.length > 0 && (
          <div className="flex items-end gap-0.5 h-8">
            {sparklineData.map((point, index) => {
              const maxValue = Math.max(...sparklineData);
              const minValue = Math.min(...sparklineData);
              const range = maxValue - minValue || 1;
              const normalizedHeight = ((point - minValue) / range) * 100;

              return (
                <div
                  key={index}
                  className="w-1 bg-primary-400 rounded-full transition-all hover:bg-primary-600"
                  style={{ height: `${Math.max(normalizedHeight, 10)}%` }}
                  title={`${point.toLocaleString()}`}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {footer && (
        <div className="mt-3 pt-3 border-t border-neutral-100">
          <div className="text-xs text-neutral-500">
            {footer}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * KPI Card Grid Container
 * Responsive grid for displaying multiple KPI cards
 */
export function KPICardGrid({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`
      grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
      gap-4 md:gap-6
      ${className}
    `}>
      {children}
    </div>
  );
}
