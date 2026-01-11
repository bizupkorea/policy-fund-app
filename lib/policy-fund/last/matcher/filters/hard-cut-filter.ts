/**
 * lib/policy-fund/last/matcher/filters/hard-cut-filter.ts
 *
 * 하드컷 필터
 * - 정책자금 신청 불가 조건에 따른 완전 제외
 * - 투융자복합금융, 유동화회사보증 등 특수 조건 필터
 */

import type { ExtendedCompanyProfile, IndustryCategory, EligibilityResult } from '../../types';
import { POLICY_FUND_KNOWLEDGE_BASE } from '../../knowledge-base';
import { FUND_CATEGORIES, FUND_KEYWORDS } from '../config';
import { determineCompanyScale } from '../company-scale';

// ============================================================================
// 하드컷 조건 체크
// ============================================================================

/**
 * 즉시 제외 조건 (하드컷)
 */
export function isHardExcluded(profile: ExtendedCompanyProfile): boolean {
  return (
    // 세금 체납 (분납 미승인)
    (profile.taxDelinquencyStatus === 'active' && !profile.hasTaxInstallmentApproval) ||
    // 신용문제 (현재)
    profile.creditIssueStatus === 'current' ||
    // 금융 연체 중
    !!profile.isCurrentlyDelinquent ||
    // 보증사고 미정리
    !!profile.hasUnresolvedGuaranteeAccident ||
    // 과거 부실 미정리
    (!!profile.hasPastDefault && !profile.isPastDefaultResolved)
  );
}

/**
 * 재도전자금만 가능 조건
 */
export function needsRestartFundsOnly(profile: ExtendedCompanyProfile): boolean {
  if (isHardExcluded(profile)) return false;
  return !!(profile.isInactive || profile.isCreditRecoveryInProgress);
}

// ============================================================================
// 초기 하드컷 필터
// ============================================================================

/**
 * 하드컷 필터 적용
 */
export function applyHardCutFilters(
  results: EligibilityResult[],
  profile: ExtendedCompanyProfile
): EligibilityResult[] {
  // 1. 즉시 제외 조건
  if (isHardExcluded(profile)) {
    return [];
  }

  let filtered = results;

  // 2. 투융자복합금융 필터링
  if (!profile.hasIpoOrInvestmentPlan && !profile.acceptsEquityDilution) {
    filtered = filtered.filter(r => r.fundId !== 'kosmes-investment-loan');
  }

  // 3. 유동화회사보증(P-CBO) 필터링
  if (!profile.needsLargeFunding) {
    filtered = filtered.filter(r => r.fundId !== 'kodit-securitization');
  }

  // 4. 환경 자금 필터링
  const envFundIds = FUND_CATEGORIES.environment;
  if (!profile.fundingPurposeDetails?.environmentInvestment) {
    filtered = filtered.filter(r => !envFundIds.includes(r.fundId as any));
  }

  // 5. 신재생에너지보증 하드컷 필터링
  const greenEnergyFundIds = FUND_CATEGORIES.greenEnergy;
  if (!profile.isGreenEnergyBusiness) {
    filtered = filtered.filter(r => !greenEnergyFundIds.includes(r.fundId as any));
  }

  // 6. 전용자격 체크 (exclusive 트랙)
  const hasExclusiveQualification =
    profile.isDisabledStandard ||
    profile.isDisabled ||
    profile.isSocialEnterprise ||
    profile.isRestart ||
    profile.isFemale;

  if (!hasExclusiveQualification) {
    filtered = filtered.filter(r => {
      const fund = POLICY_FUND_KNOWLEDGE_BASE.find(f => f.id === r.fundId);
      return fund?.track !== 'exclusive';
    });
  }

  // 7. 기업규모 기반 필터링 (targetScale)
  const employeeCount = profile.employeeCount ?? 0;
  const industry = (profile.industryName || profile.industry || '') as IndustryCategory;
  const annualRevenue = profile.revenue ? profile.revenue * 100000000 : undefined;
  const companyScale = determineCompanyScale(employeeCount, industry, annualRevenue);

  filtered = filtered.filter(r => {
    const fund = POLICY_FUND_KNOWLEDGE_BASE.find(f => f.id === r.fundId);
    if (!fund?.targetScale || fund.targetScale.length === 0) return true;

    // 기업규모 기반 필터링
    const scaleMatches = fund.targetScale.includes(companyScale);

    // 인증 기반 필터링
    const certMatches = fund.targetScale.some(s =>
      (s === 'venture' && profile.isVentureCompany) ||
      (s === 'innobiz' && profile.isInnobiz) ||
      (s === 'mainbiz' && profile.isMainbiz)
    );

    return scaleMatches || certMatches;
  });

  // 8. 휴·폐업/신용회복 → 재도전자금만
  if (needsRestartFundsOnly(profile)) {
    filtered = filtered.filter(r => {
      const fund = POLICY_FUND_KNOWLEDGE_BASE.find(f => f.id === r.fundId);
      if (!fund) return false;
      return FUND_KEYWORDS.restart.some(kw =>
        fund.name.includes(kw) || r.fundId.includes('restart')
      );
    });
  }

  // 9. 신용회복 중 하드컷 (재도전자금 예외)
  if (profile.isCreditRecoveryInProgress) {
    filtered = filtered.filter(r => {
      const isRestartFund =
        r.fundId?.includes('restart') ||
        r.fundName?.includes('재도전') ||
        r.fundName?.includes('재창업');
      return isRestartFund;
    });
  }

  // 10. isEligible 필터링
  filtered = filtered.filter(r => r.isEligible);

  return filtered;
}
