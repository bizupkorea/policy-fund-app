'use client';

/**
 * lib/policy-fund/last/components/shared/StepHeader.tsx
 *
 * 단계별 제목 및 설명 표시 컴포넌트
 */

import { STEP_INFO } from '../../constants/steps';

interface StepHeaderProps {
  currentStep: number;
}

export function StepHeader({ currentStep }: StepHeaderProps) {
  const stepInfo = STEP_INFO[currentStep - 1];
  if (!stepInfo) return null;

  return (
    <div className="mb-5">
      {/* 단계 제목 */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{stepInfo.icon}</span>
        <h2 className="text-lg font-bold text-slate-800">
          STEP {currentStep}. {stepInfo.title}
        </h2>
      </div>
      {/* 설명 */}
      <p className="text-sm text-slate-600 ml-10">{stepInfo.description}</p>
      {/* 안내 문구 (Step 3 전용) */}
      {stepInfo.guidance && (
        <div className="mt-3 ml-10 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-100">
          <span className="text-base">💡</span>
          <span>{stepInfo.guidance}</span>
        </div>
      )}
    </div>
  );
}
