/**
 * lib/policy-fund/last/matcher/filters/diversity-filter.ts
 *
 * 다양성 필터
 * - 동일 기관 자금은 최대 2개까지만 포함
 * - 특수목적자금은 예외
 */

import type { DetailedMatchResult } from '../../types';
import { FUND_CATEGORIES, SCORING_CONFIG } from '../config';

// ============================================================================
// 다양성 필터
// ============================================================================

/**
 * 다양성 필터 적용
 * - 동일 기관당 최대 2개
 * - 특수목적자금은 기관 카운트에서 제외
 */
export function applyDiversityFilter(
  results: DetailedMatchResult[],
  topN: number = 10
): DetailedMatchResult[] {
  const maxResults = Math.min(topN, SCORING_CONFIG.maxResults);
  const maxPerInstitution = SCORING_CONFIG.maxPerInstitution;

  const institutionCount: Record<string, number> = {};
  const diversifiedResults: DetailedMatchResult[] = [];

  for (const r of results) {
    // 특수목적자금은 다양성 필터 예외
    const isSpecialPurpose = FUND_CATEGORIES.specialPurpose.includes(r.fundId as any);

    if (isSpecialPurpose) {
      diversifiedResults.push(r);
      if (diversifiedResults.length >= maxResults) break;
      continue;
    }

    // 기관별 카운트 체크
    const count = institutionCount[r.institutionId] || 0;
    if (count < maxPerInstitution) {
      diversifiedResults.push(r);
      institutionCount[r.institutionId] = count + 1;
      if (diversifiedResults.length >= maxResults) break;
    }
  }

  return diversifiedResults;
}

/**
 * 특수목적자금 여부 확인
 */
export function isSpecialPurposeFund(fundId: string): boolean {
  return FUND_CATEGORIES.specialPurpose.includes(fundId as any);
}
