'use client';

/**
 * lib/policy-fund/last/components/form/NumericField.tsx
 *
 * 숫자 + 단위 입력 필드 컴포넌트
 */

interface NumericFieldProps {
  label: string;
  value: number;
  unit: string;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  warning?: string;
  className?: string;
}

export function NumericField({
  label,
  value,
  unit,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
  warning,
  className = '',
}: NumericFieldProps) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">
        {label}
        {warning && <span className="text-red-500 ml-2">{warning}</span>}
      </label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          onChange={(e) =>
            onChange(
              Math.max(min, Math.min(max, parseFloat(e.target.value) || 0))
            )
          }
          min={min}
          max={max}
          step={step}
          className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-orange-400/40 focus:border-orange-500 focus:shadow-[0_0_25px_rgba(249,115,22,0.35)] transition-all duration-300 text-right"
        />
        <span className="text-xs text-slate-500 w-8">{unit}</span>
      </div>
    </div>
  );
}
