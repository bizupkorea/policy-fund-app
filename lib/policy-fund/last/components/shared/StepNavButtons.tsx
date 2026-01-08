'use client';

/**
 * lib/policy-fund/last/components/shared/StepNavButtons.tsx
 *
 * 하단 네비게이션 버튼 (이전/다음/실행/새로시작)
 */

import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { TOTAL_STEPS } from '../../constants/steps';

interface StepNavButtonsProps {
  currentStep: number;
  totalSteps?: number;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onReset: () => void;
  isLoading?: boolean;
}

export function StepNavButtons({
  currentStep,
  totalSteps = TOTAL_STEPS,
  onPrev,
  onNext,
  onSubmit,
  onReset,
  isLoading = false,
}: StepNavButtonsProps) {
  // Step 5 (결과 화면)
  if (currentStep === totalSteps) {
    return (
      <div className="flex justify-center gap-4 mt-6">
        <button
          onClick={onReset}
          className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-semibold transition-colors"
        >
          새로운 분석 시작
        </button>
      </div>
    );
  }

  // Step 4 (최종 확인)
  if (currentStep === totalSteps - 1) {
    return (
      <div className="flex justify-between items-center mt-6">
        <button
          onClick={onPrev}
          className="flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>이전</span>
        </button>
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span>⏱️</span> 약 10초 소요
            </span>
            <span className="flex items-center gap-1">
              <span>📄</span> 매칭 결과 리포트 제공
            </span>
          </div>
          <button
            onClick={onSubmit}
            disabled={isLoading}
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-orange-500/30 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>분석 중...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>AI 정책자금 분석 시작 →</span>
              </>
            )}
          </button>
        </div>
        <div className="w-20" /> {/* 균형을 위한 빈 공간 */}
      </div>
    );
  }

  // Step 1-3
  return (
    <div className="flex justify-between mt-6">
      {currentStep > 1 ? (
        <button
          onClick={onPrev}
          className="flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>이전</span>
        </button>
      ) : (
        <div />
      )}
      <button
        onClick={onNext}
        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/20 transition-all duration-200 hover:scale-105"
      >
        <span>다음</span>
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
