/**
 * Skeleton Component
 *
 * Loading placeholder with pulse animation
 * Used throughout the app for better loading UX
 */

import React from 'react';

export interface SkeletonProps {
  /**
   * Width of the skeleton
   * Can be CSS value (e.g., '100px', '50%') or Tailwind class
   */
  width?: string;

  /**
   * Height of the skeleton
   * Can be CSS value (e.g., '20px', '2rem') or Tailwind class
   */
  height?: string;

  /**
   * Border radius variant
   * @default 'md'
   */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';

  /**
   * Animation variant
   * @default 'pulse'
   */
  animation?: 'pulse' | 'wave' | 'none';

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Number of skeleton items to render
   * @default 1
   */
  count?: number;

  /**
   * Gap between skeleton items when count > 1
   */
  gap?: string;
}

/**
 * Skeleton Component
 *
 * @example
 * ```tsx
 * <Skeleton width="200px" height="20px" />
 * <Skeleton className="w-full h-32" rounded="lg" />
 * <Skeleton count={3} height="16px" gap="8px" />
 * ```
 */
export default function Skeleton({
  width,
  height,
  rounded = 'md',
  animation = 'pulse',
  className = '',
  count = 1,
  gap,
}: SkeletonProps) {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  }[rounded];

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse-soft',
    none: '',
  }[animation];

  const skeletonElement = (
    <div
      className={`
        bg-neutral-200
        ${roundedClasses}
        ${animationClasses}
        ${className}
      `}
      style={{
        width: width || undefined,
        height: height || undefined,
      }}
      aria-busy="true"
      aria-live="polite"
    />
  );

  if (count <= 1) {
    return skeletonElement;
  }

  return (
    <div className="flex flex-col" style={{ gap: gap || '8px' }}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          {skeletonElement}
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton Text Component
 * Pre-configured for text loading states
 */
export function SkeletonText({
  lines = 3,
  className = '',
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height="16px"
          width={index === lines - 1 ? '80%' : '100%'}
          rounded="sm"
        />
      ))}
    </div>
  );
}

/**
 * Skeleton Card Component
 * Pre-configured for card loading states
 */
export function SkeletonCard({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-lg border border-neutral-200 p-6 ${className}`}>
      <div className="animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <Skeleton width="120px" height="16px" />
          <Skeleton width="32px" height="32px" rounded="lg" />
        </div>
        <Skeleton width="160px" height="32px" className="mb-2" />
        <Skeleton width="80px" height="20px" />
      </div>
    </div>
  );
}

/**
 * Skeleton Table Component
 * Pre-configured for table loading states
 */
export function SkeletonTable({
  rows = 5,
  columns = 4,
  className = '',
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} height="16px" width="80%" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} height="20px" width="90%" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton Avatar Component
 * Pre-configured for avatar loading states
 */
export function SkeletonAvatar({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  }[size];

  return (
    <Skeleton
      className={`${sizeClasses} ${className}`}
      rounded="full"
    />
  );
}

/**
 * Skeleton Chart Component
 * Pre-configured for chart loading states
 */
export function SkeletonChart({
  height = '300px',
  className = '',
}: {
  height?: string;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-lg border border-neutral-200 p-6 ${className}`}
      style={{ height }}
    >
      <div className="animate-pulse h-full flex flex-col">
        <Skeleton width="150px" height="20px" className="mb-4" />
        <div className="flex-1 flex items-end gap-2">
          {Array.from({ length: 12 }).map((_, index) => (
            <Skeleton
              key={index}
              className="flex-1"
              height={`${Math.random() * 60 + 40}%`}
              rounded="sm"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
