'use client';

import React from 'react';
import { Check, Circle } from 'lucide-react';

export interface StepItem {
  label: string;
  description: string;
}

export interface StepperProps {
  currentStep: number; // 1-5
  steps: StepItem[];
  completedSteps: Set<number>;
  onStepClick?: (step: number) => void;
  className?: string;
}

/**
 * Stepper Component
 * 5단계 선형 플로우를 시각화하는 컴포넌트
 *
 * Features:
 * - 완료/현재/미완료 상태 표시
 * - 완료된 단계만 클릭 가능
 * - 반응형 디자인 (모바일: 세로, 데스크탑: 가로)
 */
export function Stepper({
  currentStep,
  steps,
  completedSteps,
  onStepClick,
  className = '',
}: StepperProps) {
  const isStepCompleted = (stepNumber: number) => completedSteps.has(stepNumber);
  const isStepCurrent = (stepNumber: number) => stepNumber === currentStep;
  const isStepClickable = (stepNumber: number) =>
    isStepCompleted(stepNumber) || stepNumber < currentStep;

  const handleStepClick = (stepNumber: number) => {
    if (isStepClickable(stepNumber) && onStepClick) {
      onStepClick(stepNumber);
    }
  };

  const getStepColor = (stepNumber: number) => {
    if (isStepCompleted(stepNumber)) {
      return 'text-white bg-success-600 border-success-600';
    }
    if (isStepCurrent(stepNumber)) {
      return 'text-primary-600 bg-primary-100 border-primary-600';
    }
    return 'text-gray-400 bg-gray-100 border-gray-300';
  };

  const getConnectorColor = (stepNumber: number) => {
    if (isStepCompleted(stepNumber)) {
      return 'bg-success-600';
    }
    return 'bg-gray-300';
  };

  return (
    <div className={`w-full ${className}`}>
      {/* 데스크탑: 가로 레이아웃 */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = isStepCompleted(stepNumber);
          const isCurrent = isStepCurrent(stepNumber);
          const isClickable = isStepClickable(stepNumber);

          return (
            <React.Fragment key={stepNumber}>
              {/* Step */}
              <div className="flex flex-col items-center flex-1">
                <button
                  onClick={() => handleStepClick(stepNumber)}
                  disabled={!isClickable}
                  className={`
                    relative flex items-center justify-center
                    w-12 h-12 rounded-full border-2 transition-all
                    ${getStepColor(stepNumber)}
                    ${isClickable ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed'}
                    ${isCurrent ? 'ring-4 ring-primary-200 shadow-lg' : ''}
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6 text-white" />
                  ) : (
                    <span className={`font-semibold ${isCurrent ? 'text-primary-600' : ''}`}>
                      {stepNumber}
                    </span>
                  )}
                </button>

                <div className="mt-3 text-center">
                  <p className={`
                    text-sm font-semibold
                    ${isCurrent ? 'text-primary-600' : ''}
                    ${isCompleted ? 'text-success-600' : ''}
                    ${!isCurrent && !isCompleted ? 'text-gray-500' : ''}
                  `}>
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 max-w-[120px]">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Connector Line */}
              {stepNumber < steps.length && (
                <div className={`
                  flex-1 h-0.5 -mt-12 mx-2
                  ${getConnectorColor(stepNumber)}
                `} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* 모바일: 세로 레이아웃 */}
      <div className="md:hidden space-y-4">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = isStepCompleted(stepNumber);
          const isCurrent = isStepCurrent(stepNumber);
          const isClickable = isStepClickable(stepNumber);

          return (
            <div key={stepNumber} className="flex items-start gap-4">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => handleStepClick(stepNumber)}
                  disabled={!isClickable}
                  className={`
                    flex items-center justify-center
                    w-10 h-10 rounded-full border-2 transition-all flex-shrink-0
                    ${getStepColor(stepNumber)}
                    ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}
                    ${isCurrent ? 'ring-4 ring-primary-200' : ''}
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <span className={`font-semibold text-sm ${isCurrent ? 'text-primary-600' : ''}`}>
                      {stepNumber}
                    </span>
                  )}
                </button>

                {/* Vertical Connector */}
                {stepNumber < steps.length && (
                  <div className={`
                    w-0.5 h-12 mt-2
                    ${getConnectorColor(stepNumber)}
                  `} />
                )}
              </div>

              {/* Step Info */}
              <div className="flex-1 pt-1">
                <p className={`
                  text-sm font-semibold
                  ${isCurrent ? 'text-primary-600' : ''}
                  ${isCompleted ? 'text-success-600' : ''}
                  ${!isCurrent && !isCompleted ? 'text-gray-500' : ''}
                `}>
                  {step.label}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
