/**
 * lib/policy-fund/last/matcher/scoring/index.ts
 *
 * 점수 계산 모듈 메인 export
 */

import type { DetailedMatchResult, ExtendedCompanyProfile } from '../../types';
import { POLICY_FUND_KNOWLEDGE_BASE } from '../../knowledge-base';
import { ALL_EVALUATORS, applyEvaluation } from './evaluators';
import {
  SCORING_CONFIG,
  scoreToLevel,
  getRankPenalty,
  getInstitutionBonus,
  CERTIFICATION_BONUS,
} from '../config';
import { determineCompanyScale } from '../company-scale';

// 평가자 관련 export
export * from './evaluators';

// ============================================================================
// 점수 계산 메인 함수
// ============================================================================

/**
 * 모든 평가자를 실행하여 점수 계산
 */
export function applyScoring(
  results: DetailedMatchResult[],
  profile: ExtendedCompanyProfile
): DetailedMatchResult[] {
  return results.map(result => {
    const fund = POLICY_FUND_KNOWLEDGE_BASE.find(f => f.id === result.fundId);

    // 모든 평가자 실행
    for (const evaluator of ALL_EVALUATORS) {
      const evaluation = evaluator.evaluate(result, profile, fund);

      if (!evaluation) continue;

      // 제외 처리
      if (evaluation.excluded) {
        (result as any)._excluded = true;
        break;
      }

      // 평가 결과 적용
      applyEvaluation(result, evaluation);
    }

    return result;
  }).filter(r => !(r as any)._excluded);
}

// ============================================================================
// 기관 가산점 계산
// ============================================================================

/**
 * 기업규모에 따른 기관 가산점 계산
 */
export function calculateInstitutionBonus(
  institutionId: string,
  profile: ExtendedCompanyProfile
): number {
  const employeeCount = profile.employeeCount ?? 0;
  const industry = (profile.industryName || profile.industry || '') as any;
  const revenue = profile.revenue ? profile.revenue * 100000000 : undefined;

  const companyScale = determineCompanyScale(employeeCount, industry, revenue);

  return getInstitutionBonus(companyScale as any, institutionId);
}

// ============================================================================
// 인증 가점 계산
// ============================================================================

/**
 * 인증/자격 기반 가점 계산 (그룹별 최대값 적용)
 */
export function calculateCertificationBonus(profile: ExtendedCompanyProfile): number {
  // 그룹1: 기업유형 인증 (택1 최대)
  let group1 = 0;
  if (profile.isVentureCompany) group1 = CERTIFICATION_BONUS.group1.venture;
  else if (profile.isInnobiz) group1 = CERTIFICATION_BONUS.group1.innobiz;
  else if (profile.isMainbiz) group1 = CERTIFICATION_BONUS.group1.mainbiz;

  // 그룹2: 기술·연구 (택1 최대)
  let group2 = 0;
  if (profile.hasRndActivity) group2 = CERTIFICATION_BONUS.group2.rnd;
  else if (profile.hasPatent) group2 = CERTIFICATION_BONUS.group2.patent;

  // 그룹3: 사업성과
  let group3 = 0;
  if (profile.hasExportRevenue) group3 = CERTIFICATION_BONUS.group3.export;

  const total = group1 + group2 + group3;
  return Math.min(total, CERTIFICATION_BONUS.maxTotal);
}

// ============================================================================
// 순위별 점수 차등 적용
// ============================================================================

/**
 * 정렬된 결과에 순위별 감점 적용
 */
export function applyRankDifferentiation(results: DetailedMatchResult[]): DetailedMatchResult[] {
  return results.map((result, index) => {
    const rank = index + 1;
    const penalty = getRankPenalty(rank);

    if (penalty < 0) {
      result.score = Math.max(SCORING_CONFIG.minScore, result.score + penalty);
      result.level = scoreToLevel(result.score);
    }

    return result;
  });
}

// ============================================================================
// 유틸리티 re-export
// ============================================================================

export { scoreToLevel } from '../config';
