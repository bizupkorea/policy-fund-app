'use client';

/**
 * lib/policy-fund/last/hooks/useStepNav.ts
 *
 * 스텝 네비게이션 훅
 */

import { useState, useCallback } from 'react';
import { TOTAL_STEPS } from '../constants/steps';

export function useStepNav(totalSteps = TOTAL_STEPS) {
  const [currentStep, setCurrentStep] = useState(1);

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 1 && step <= totalSteps) {
        setCurrentStep(step);
      }
    },
    [totalSteps]
  );

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  }, [totalSteps]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;
  const isResultStep = currentStep === totalSteps;
  const isSubmitStep = currentStep === totalSteps - 1;

  return {
    currentStep,
    setCurrentStep,
    goToStep,
    nextStep,
    prevStep,
    isFirstStep,
    isLastStep,
    isResultStep,
    isSubmitStep,
  };
}
