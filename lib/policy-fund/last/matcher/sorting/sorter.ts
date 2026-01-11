/**
 * lib/policy-fund/last/matcher/sorting/sorter.ts
 *
 * 정렬 로직
 * - 4단계 트랙 우선순위
 * - 기관 가산점
 * - 기업규모 적합도
 * - 점수순
 */

import type { DetailedMatchResult, ExtendedCompanyProfile, IndustryCategory } from '../../types';
import { POLICY_FUND_KNOWLEDGE_BASE } from '../../knowledge-base';
import {
  TRACK_PRIORITY,
  FUND_CATEGORIES,
} from '../config';
import {
  calculateInstitutionBonus,
  calculateCertificationBonus,
} from '../scoring';
import { calculateSizeMatchScore } from '../scorer';
import {
  determineCompanyScale,
  isStrategicIndustry,
  getStrategicIndustryBonus,
} from '../company-scale';

// ============================================================================
// 정렬 우선순위 계산
// ============================================================================

/**
 * 트랙 기반 정렬 우선순위
 */
export function getSortPriority(
  result: DetailedMatchResult,
  profile: ExtendedCompanyProfile
): number {
  // 1순위: 특화자금 (exclusive)
  if (result.track === 'exclusive') return TRACK_PRIORITY.exclusive;

  // 2순위: 직접대출 (kosmes, semas의 general/policy_linked)
  const isDirectLoan = result.institutionId === 'kosmes' || result.institutionId === 'semas';
  if (isDirectLoan && result.track !== 'guarantee') return TRACK_PRIORITY.directLoan;

  // 3순위: 일반정책자금/대리대출
  if (result.track === 'policy_linked' || result.track === 'general') {
    return TRACK_PRIORITY.policyLinked;
  }

  // 4순위: 보증서
  return TRACK_PRIORITY.guarantee;
}

/**
 * 특수목적자금 선택 시 트랙 우선순위 상향
 */
export function adjustPriorityForSpecialPurpose(
  priority: number,
  result: DetailedMatchResult,
  profile: ExtendedCompanyProfile
): number {
  // 스마트공장 계획 선택 → 스마트공장자금 exclusive
  if (profile.hasSmartFactoryPlan && result.fundId === 'kosmes-smart-factory') {
    return TRACK_PRIORITY.exclusive;
  }

  // IPO/투자 계획 선택 → 투융자복합금융 exclusive
  if (profile.hasIpoOrInvestmentPlan && result.fundId === 'kosmes-investment-loan') {
    return TRACK_PRIORITY.exclusive;
  }

  // ESG/탄소중립 계획 선택 → 탄소중립자금 exclusive
  if (profile.hasEsgInvestmentPlan && result.fundId === 'kosmes-carbon-neutral') {
    return TRACK_PRIORITY.exclusive;
  }

  // 긴급경영 상황 선택 → 긴급경영안정자금 exclusive
  if (profile.isEmergencySituation && result.fundId === 'kosmes-emergency') {
    return TRACK_PRIORITY.exclusive;
  }

  return priority;
}

// ============================================================================
// 정렬 메인 함수
// ============================================================================

/**
 * 결과 정렬
 */
export function applySorting(
  results: DetailedMatchResult[],
  profile: ExtendedCompanyProfile
): DetailedMatchResult[] {
  // 기업규모 및 전략산업 판정
  const employeeCount = profile.employeeCount ?? 0;
  const industry = (profile.industryName || profile.industry || '') as IndustryCategory;
  const annualRevenue = profile.revenue ? profile.revenue * 100000000 : undefined;
  const companyScale = determineCompanyScale(employeeCount, industry, annualRevenue);
  const isMicro = companyScale === 'micro';

  const industryNameStr = String(profile.industryName || profile.industry || '');
  const industryCode = (profile as any).industryCode || (profile as any).ksicCode || '';
  const businessDesc = (profile as any).businessDescription || (profile as any).mainProduct || '';
  const isStrategic = isStrategicIndustry(industryNameStr, industryCode, businessDesc);
  const strategicBonus = getStrategicIndustryBonus(isStrategic, isMicro);

  // 인증 가점
  const certificationBonus = calculateCertificationBonus(profile);

  // 정렬 메타데이터 계산
  const resultsWithMeta = results.map(r => {
    const fund = POLICY_FUND_KNOWLEDGE_BASE.find(f => f.id === r.fundId);

    // 기본 정렬 우선순위
    let sortPriority = getSortPriority(r, profile);

    // 특수목적자금 우선순위 조정
    sortPriority = adjustPriorityForSpecialPurpose(sortPriority, r, profile);

    // 기관 가산점 (전략산업 보너스 포함)
    let institutionBonus = calculateInstitutionBonus(r.institutionId, profile);
    if (r.institutionId === 'kosmes' && isMicro) {
      institutionBonus += strategicBonus;
    }

    // 기업규모 적합도
    const sizeScore = calculateSizeMatchScore(fund?.id, profile.companySize);

    // 총 가산점
    const totalBonus = institutionBonus + certificationBonus;

    // 전략산업 적격 사유 추가
    if (isStrategic && isMicro && r.institutionId === 'kosmes') {
      r.eligibilityReasons.push('전략산업(이차전지/반도체/AI 등) - 중진공 우선 지원');
      r.score = Math.min(100, r.score + 10);
      r.level = r.score >= 70 ? 'high' : r.score >= 40 ? 'medium' : 'low';
    }

    return {
      result: r,
      sortPriority,
      totalBonus,
      sizeScore,
    };
  });

  // 정렬
  resultsWithMeta.sort((a, b) => {
    // 1단계: 트랙 우선순위 (절대적)
    if (a.sortPriority !== b.sortPriority) {
      return a.sortPriority - b.sortPriority;
    }

    // 2단계: 같은 트랙 내에서 합산 가산점
    if (a.totalBonus !== b.totalBonus) {
      return b.totalBonus - a.totalBonus;
    }

    // 3단계: 기업규모 적합도
    if (a.sizeScore !== b.sizeScore) {
      return b.sizeScore - a.sizeScore;
    }

    // 4단계: 점수순
    return b.result.score - a.result.score;
  });

  return resultsWithMeta.map(m => m.result);
}
