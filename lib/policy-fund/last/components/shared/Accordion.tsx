'use client';

/**
 * lib/policy-fund/last/components/shared/Accordion.tsx
 *
 * 재사용 가능한 접힘/펼침 컴포넌트
 */

import { ChevronDown } from 'lucide-react';
import { ReactNode } from 'react';

interface AccordionProps {
  title: string;
  icon: string;
  children: ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  badge?: string;
  purposeLabel?: string;
  purposeColor?: 'emerald' | 'blue' | 'amber' | 'slate';
}

const PURPOSE_COLORS = {
  emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  amber: 'bg-amber-100 text-amber-700 border-amber-200',
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
};

export function Accordion({
  title,
  icon,
  children,
  isExpanded,
  onToggle,
  badge,
  purposeLabel,
  purposeColor = 'slate',
}: AccordionProps) {
  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 bg-slate-100 hover:bg-slate-200 flex items-center justify-between transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <span className="font-semibold text-slate-800">{title}</span>
          {badge && (
            <span className="px-2.5 py-1 bg-orange-100 text-orange-600 text-xs font-semibold rounded-full border border-orange-300">
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {purposeLabel && (
            <span
              className={`px-2.5 py-1 text-xs font-medium rounded-full border ${PURPOSE_COLORS[purposeColor]}`}
            >
              {purposeLabel}
            </span>
          )}
          <ChevronDown
            className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>
      {isExpanded && <div className="p-5 bg-white">{children}</div>}
    </div>
  );
}
