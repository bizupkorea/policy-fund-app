'use client';

/**
 * lib/policy-fund/last/components/form/ToggleButtonGroup.tsx
 *
 * 인증/조건 토글 버튼 그룹 컴포넌트
 */

interface ToggleItem {
  key: string;
  label: string;
}

interface ToggleButtonGroupProps {
  items: ToggleItem[];
  selectedKeys: string[];
  onToggle: (key: string) => void;
  title?: string;
  icon?: string;
}

export function ToggleButtonGroup({
  items,
  selectedKeys,
  onToggle,
  title,
  icon,
}: ToggleButtonGroupProps) {
  return (
    <div>
      {title && (
        <div className="flex items-center gap-2 mb-2">
          {icon && <span className="text-sm">{icon}</span>}
          <span className="text-xs font-semibold text-slate-700">{title}</span>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const isChecked = selectedKeys.includes(item.key);
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onToggle(item.key)}
              className={`
                relative px-3 py-1.5 rounded-lg border transition-all duration-200 text-center
                ${
                  isChecked
                    ? 'border-orange-500 bg-white shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }
              `}
            >
              {isChecked && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-[10px]">✓</span>
                </div>
              )}
              <span
                className={`text-xs font-medium ${
                  isChecked ? 'text-orange-700' : 'text-slate-600'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
