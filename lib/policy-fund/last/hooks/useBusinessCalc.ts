'use client';

/**
 * lib/policy-fund/last/hooks/useBusinessCalc.ts
 *
 * 업력, 기업규모 등 계산 훅
 */

import { useMemo } from 'react';
import { TestProfile } from '../ui-types';

export interface BusinessAge {
  years: number;
  months: number;
  total: number; // 소수점 년 환산
}

export type CompanySize = 'startup' | 'small' | 'medium' | 'large';

export function useBusinessCalc(profile: TestProfile) {
  // 업력 계산 (년 + 월)
  const businessAge = useMemo((): BusinessAge => {
    const now = new Date();
    const established = new Date(
      profile.establishedYear,
      profile.establishedMonth - 1,
      profile.establishedDay
    );
    const diffMs = now.getTime() - established.getTime();
    const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365.25);
    const years = Math.floor(diffYears);
    const months = Math.floor((diffYears - years) * 12);
    return { years, months, total: diffYears };
  }, [profile.establishedYear, profile.establishedMonth, profile.establishedDay]);

  // 기업 규모 분류
  const companySize = useMemo((): CompanySize => {
    const age = businessAge.total;
    const revenue = profile.annualRevenue;
    const employees = profile.employeeCount;

    if (age < 3 && revenue < 5) return 'startup';
    if (revenue < 10 || employees < 10) return 'small';
    if (revenue < 50 || employees < 50) return 'medium';
    return 'large';
  }, [businessAge.total, profile.annualRevenue, profile.employeeCount]);

  // 인증 보유 개수
  const certCount = useMemo(() => {
    let count = 0;
    if (profile.isVenture) count++;
    if (profile.isInnobiz) count++;
    if (profile.isMainbiz) count++;
    if (profile.hasPatent) count++;
    if (profile.hasResearchInstitute) count++;
    if (profile.exportRevenue > 0) count++;
    if (profile.isDisabledStandard) count++;
    if (profile.isSocialEnterprise) count++;
    return count;
  }, [
    profile.isVenture,
    profile.isInnobiz,
    profile.isMainbiz,
    profile.hasPatent,
    profile.hasResearchInstitute,
    profile.exportRevenue,
    profile.isDisabledStandard,
    profile.isSocialEnterprise,
  ]);

  // 제약 조건 체크 (심사 확인 항목 개수)
  const constraintCount = useMemo(() => {
    let count = 0;
    if (profile.isInactive) count++;
    if (profile.hasTaxDelinquency) count++;
    if (profile.isCurrentlyDelinquent) count++;
    if (profile.hasUnresolvedGuaranteeAccident) count++;
    if (profile.hasPastDefault) count++;
    if (profile.isCreditRecoveryInProgress) count++;
    return count;
  }, [
    profile.isInactive,
    profile.hasTaxDelinquency,
    profile.isCurrentlyDelinquent,
    profile.hasUnresolvedGuaranteeAccident,
    profile.hasPastDefault,
    profile.isCreditRecoveryInProgress,
  ]);

  // 청년 창업자 여부 (대표자 39세 이하)
  const isYouthFounder = profile.ceoAge <= 39;

  // 여성 대표 여부
  const isFemaleFounder = profile.isFemale;

  return {
    businessAge,
    companySize,
    certCount,
    constraintCount,
    isYouthFounder,
    isFemaleFounder,
  };
}
