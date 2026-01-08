'use client';

/**
 * lib/policy-fund/last/components/form/DateInputField.tsx
 *
 * 년/월/일 입력 필드 컴포넌트
 */

interface DateInputFieldProps {
  label: string;
  year: number;
  month: number;
  day: number;
  onChange: (field: 'year' | 'month' | 'day', value: number) => void;
  minYear?: number;
  maxYear?: number;
}

export function DateInputField({
  label,
  year,
  month,
  day,
  onChange,
  minYear = 1950,
  maxYear = new Date().getFullYear(),
}: DateInputFieldProps) {
  // 년도 옵션 생성 (최신순)
  const yearOptions = Array.from(
    { length: maxYear - minYear + 1 },
    (_, i) => maxYear - i
  );

  // 월 옵션 생성
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  // 일 옵션 생성 (해당 월의 일수에 따라)
  const getDaysInMonth = (y: number, m: number) => {
    return new Date(y, m, 0).getDate();
  };
  const daysInMonth = getDaysInMonth(year, month);
  const dayOptions = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
      <div className="flex items-center gap-1">
        {/* 년도 */}
        <select
          value={year}
          onChange={(e) => onChange('year', parseInt(e.target.value))}
          className="flex-1 px-2 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-orange-400/40 focus:border-orange-500 focus:shadow-[0_0_25px_rgba(249,115,22,0.35)] transition-all duration-300"
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-500">년</span>

        {/* 월 */}
        <select
          value={month}
          onChange={(e) => onChange('month', parseInt(e.target.value))}
          className="w-16 px-2 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-orange-400/40 focus:border-orange-500 focus:shadow-[0_0_25px_rgba(249,115,22,0.35)] transition-all duration-300"
        >
          {monthOptions.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-500">월</span>

        {/* 일 */}
        <select
          value={Math.min(day, daysInMonth)}
          onChange={(e) => onChange('day', parseInt(e.target.value))}
          className="w-16 px-2 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-orange-400/40 focus:border-orange-500 focus:shadow-[0_0_25px_rgba(249,115,22,0.35)] transition-all duration-300"
        >
          {dayOptions.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-500">일</span>
      </div>
    </div>
  );
}
