/**
 * MetricBadge Component
 *
 * Displays percentage change with directional arrow and color coding
 * Used in KPI cards and metric displays
 */

import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

export type TrendDirection = 'up' | 'down' | 'neutral';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface MetricBadgeProps {
  /**
   * Percentage change value (e.g., 12.5 for +12.5%)
   */
  change: number;

  /**
   * Override automatic trend detection
   * By default, positive is green (up), negative is red (down)
   */
  trend?: TrendDirection;

  /**
   * Invert color logic (useful for metrics where decrease is good, like costs)
   */
  invertColors?: boolean;

  /**
   * Size variant
   * @default 'md'
   */
  size?: BadgeSize;

  /**
   * Show +/- prefix
   * @default true
   */
  showSign?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * MetricBadge Component
 *
 * @example
 * ```tsx
 * <MetricBadge change={12.5} />  // +12.5% ▲ (green)
 * <MetricBadge change={-8.3} />  // -8.3% ▼ (red)
 * <MetricBadge change={-5.2} invertColors /> // -5.2% ▼ (green, good for costs)
 * ```
 */
export default function MetricBadge({
  change,
  trend,
  invertColors = false,
  size = 'md',
  showSign = true,
  className = '',
}: MetricBadgeProps) {
  // Determine trend direction
  const actualTrend: TrendDirection = trend ?? (
    change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
  );

  // Determine color based on trend and invert flag
  const getColorClasses = () => {
    if (actualTrend === 'neutral') {
      return 'bg-neutral-100 text-neutral-600 border-neutral-200';
    }

    const isPositive = actualTrend === 'up';
    const shouldBeGreen = invertColors ? !isPositive : isPositive;

    if (shouldBeGreen) {
      return 'bg-success-50 text-success-700 border-success-200';
    } else {
      return 'bg-danger-50 text-danger-700 border-danger-200';
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-0.5',
    md: 'text-sm px-2 py-1 gap-1',
    lg: 'text-base px-2.5 py-1.5 gap-1.5',
  }[size];

  // Icon size
  const iconSize = {
    sm: 12,
    md: 14,
    lg: 16,
  }[size];

  // Format change value
  const formattedChange = Math.abs(change).toFixed(1);
  const sign = showSign && change !== 0 ? (change > 0 ? '+' : '-') : '';

  // Icon component
  const Icon = actualTrend === 'up' ? ArrowUp : actualTrend === 'down' ? ArrowDown : Minus;

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-md border
        ${getColorClasses()}
        ${sizeClasses}
        ${className}
      `}
      aria-label={`${change > 0 ? 'Increased' : change < 0 ? 'Decreased' : 'No change'} by ${formattedChange}%`}
    >
      <Icon size={iconSize} className="flex-shrink-0" />
      <span className="font-sans">
        {sign}{formattedChange}%
      </span>
    </span>
  );
}
