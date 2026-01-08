'use client';

/**
 * lib/policy-fund/last/components/shared/StepIndicator.tsx
 *
 * 5단계 진행 표시기 컴포넌트
 */

import { Check } from 'lucide-react';
import { STEP_LABELS, TOTAL_STEPS } from '../../constants/steps';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps?: number;
  onStepClick: (step: number) => void;
}

export function StepIndicator({
  currentStep,
  totalSteps = TOTAL_STEPS,
  onStepClick,
}: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between mb-6 bg-slate-100 rounded-2xl p-4 border border-slate-200">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step, idx) => (
        <div key={step} className="flex items-center flex-1">
          <button
            onClick={() => onStepClick(step)}
            className={`flex flex-col items-center gap-2 transition-all duration-300 ${
              step <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'
            }`}
            disabled={step > currentStep}
          >
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                step === currentStep
                  ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/40 scale-110 ring-4 ring-orange-400/30'
                  : step < currentStep
                  ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-md'
                  : 'bg-slate-300 text-slate-500 border border-slate-400/50'
              }`}
            >
              {step < currentStep ? <Check className="w-5 h-5" /> : step}
            </div>
            <span
              className={`text-xs font-medium transition-colors hidden md:inline ${
                step === currentStep
                  ? 'text-orange-600'
                  : step < currentStep
                  ? 'text-emerald-600'
                  : 'text-slate-500'
              }`}
            >
              {STEP_LABELS[idx]}
            </span>
          </button>
          {idx < totalSteps - 1 && (
            <div className="flex-1 h-1.5 mx-3 rounded-full bg-slate-300 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  step < currentStep
                    ? 'w-full bg-gradient-to-r from-emerald-400 to-teal-500'
                    : 'w-0 bg-gradient-to-r from-orange-500 to-amber-400'
                }`}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
