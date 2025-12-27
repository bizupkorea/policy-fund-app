/**
 * Card Component
 *
 * Desktop-optimized card component with professional styling
 * - 24px padding (desktop standard)
 * - 12px border-radius
 * - Subtle shadow with hover effect
 * - Korean text optimized (1.7 line-height)
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /**
   * Card padding variant
   * @default 'normal' (24px)
   */
  padding?: 'compact' | 'normal' | 'comfortable';
  /**
   * Show hover effect
   * @default true
   */
  hoverable?: boolean;
}

export function Card({
  className,
  children,
  padding = 'normal',
  hoverable = true,
  ...props
}: CardProps) {
  const paddingClasses = {
    compact: 'p-4',
    normal: 'p-6',
    comfortable: 'p-8',
  };

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-neutral-200 shadow-sm transition-all',
        hoverable && 'hover:shadow-md hover:border-neutral-300',
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div className={cn('mb-6', className)} {...props}>
      {children}
    </div>
  );
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export function CardTitle({ className, children, ...props }: CardTitleProps) {
  return (
    <h3
      className={cn(
        'text-xl font-bold text-neutral-900 leading-[1.7]',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export function CardDescription({
  className,
  children,
  ...props
}: CardDescriptionProps) {
  return (
    <p
      className={cn(
        'text-[15px] text-neutral-600 mt-2 leading-[1.7]',
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardContent({ className, children, ...props }: CardContentProps) {
  return (
    <div
      className={cn('text-neutral-700 text-[15px] leading-[1.7]', className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardFooter({ className, children, ...props }: CardFooterProps) {
  return (
    <div
      className={cn(
        'mt-6 pt-6 border-t border-neutral-100 flex items-center gap-3',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
