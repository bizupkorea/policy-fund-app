'use client';

/**
 * lib/policy-fund/last/components/form/SelectField.tsx
 *
 * 드롭다운 선택 필드 컴포넌트
 */

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  className?: string;
}

export function SelectField({
  label,
  value,
  options,
  onChange,
  className = '',
}: SelectFieldProps) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-orange-400/40 focus:border-orange-500 focus:shadow-[0_0_25px_rgba(249,115,22,0.35)] transition-all duration-300"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
