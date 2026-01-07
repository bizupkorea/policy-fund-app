/**
 * lib/policy-fund/last/eligibility/scoring.ts
 *
 * 점수 계산 및 결과 생성 함수
 */

import type { PolicyFundKnowledge } from '../knowledge-base';
import type { CheckResult } from '../types';

// ============================================================================
// 점수 계산
// ============================================================================

export function calculateScore(
  passed: CheckResult[],
  failed: CheckResult[],
  warnings: CheckResult[],
  bonuses: CheckResult[]
): number {
  let score = 50;

  for (const check of passed) {
    score += check.impact;
  }

  for (const check of failed) {
    score += check.impact;
  }

  for (const check of warnings) {
    score += check.impact;
  }

  for (const check of bonuses) {
    score += check.impact;
  }

  return Math.max(0, Math.min(100, score));
}

// ============================================================================
// 요약 생성
// ============================================================================

export function generateSummary(
  isEligible: boolean,
  passed: CheckResult[],
  failed: CheckResult[]
): string {
  if (!isEligible) {
    const mainReasons = failed
      .slice(0, 2)
      .map((f) => f.condition)
      .join(', ');
    return `신청 불가 (사유: ${mainReasons})`;
  }

  const passCount = passed.length;
  return `신청 가능 (${passCount}개 조건 충족)`;
}

// ============================================================================
// 추천 메시지 생성
// ============================================================================

export function generateRecommendation(
  isEligible: boolean,
  score: number,
  failed: CheckResult[],
  fund: PolicyFundKnowledge
): string {
  if (!isEligible) {
    const fixable = failed.filter((f) => f.impact > -50);
    if (fixable.length > 0) {
      return `다음 조건 해소 시 재검토 가능: ${fixable.map((f) => f.condition).join(', ')}`;
    }
    return '현재 조건으로는 신청이 어렵습니다. 다른 정책자금을 검토해 주세요.';
  }

  if (score >= 80) {
    return `적극 추천! ${fund.shortName} 신청을 권장합니다.`;
  }

  if (score >= 60) {
    return `신청 가능합니다. 서류 준비 후 신청을 검토해 보세요.`;
  }

  return `조건부 신청 가능. 추가 확인이 필요할 수 있습니다.`;
}
