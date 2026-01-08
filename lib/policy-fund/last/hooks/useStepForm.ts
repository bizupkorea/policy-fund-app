'use client';

/**
 * lib/policy-fund/last/hooks/useStepForm.ts
 *
 * 프로필 상태 관리 훅
 */

import { useState, useCallback } from 'react';
import { TestProfile, EMPTY_PROFILE } from '../ui-types';

export function useStepForm(initialProfile?: Partial<TestProfile>) {
  const [profile, setProfile] = useState<TestProfile>({
    ...EMPTY_PROFILE,
    ...initialProfile,
  });

  const updateProfile = useCallback(
    <K extends keyof TestProfile>(key: K, value: TestProfile[K]) => {
      setProfile((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const updateMultiple = useCallback(
    (updates: Partial<TestProfile>) => {
      setProfile((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const resetProfile = useCallback(() => {
    setProfile({ ...EMPTY_PROFILE, ...initialProfile });
  }, [initialProfile]);

  return {
    profile,
    setProfile,
    updateProfile,
    updateMultiple,
    resetProfile,
  };
}
