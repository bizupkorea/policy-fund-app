/**
 * lib/policy-fund/last/matcher/scoring/evaluators/index.ts
 *
 * 모든 평가자 통합 export
 */

import type { Evaluator } from './base-evaluator';

// 기본 인터페이스
export {
  type EvaluationResult,
  type Evaluator,
  applyEvaluation,
  mergeEvaluations,
  createPenaltyEvaluator,
  createBonusEvaluator,
  createHardCutEvaluator,
} from './base-evaluator';

// 개별 평가자
import { kosmesGraduationEvaluator, kosmesRecentLoanEvaluator } from './kosmes-graduation';
import { guaranteeOrgEvaluator } from './guarantee-org';
import { loanBalanceEvaluator } from './loan-balance';
import { subsidyRatioEvaluator } from './subsidy-ratio';
import { fundingPurposeEvaluator, fundingAmountEvaluator } from './funding-purpose';
import {
  ventureInvestmentEvaluator,
  restartEvaluator,
  smartFactoryEvaluator,
  esgGreenEnergyEvaluator,
  emergencyEvaluator,
  jobCreationEvaluator,
  socialValueEvaluator,
  pastDefaultResolvedEvaluator,
  creditRecoveryEvaluator,
  taxDelinquencyEvaluator,
} from './special-situations';
import {
  emergencyInvestmentConflictEvaluator,
  restartVentureConflictEvaluator,
  microVentureConflictEvaluator,
  largeFundingMicroConflictEvaluator,
} from './conflicts';

// 개별 export
export { kosmesGraduationEvaluator, kosmesRecentLoanEvaluator };
export { guaranteeOrgEvaluator };
export { loanBalanceEvaluator };
export { subsidyRatioEvaluator };
export { fundingPurposeEvaluator, fundingAmountEvaluator };
export {
  ventureInvestmentEvaluator,
  restartEvaluator,
  smartFactoryEvaluator,
  esgGreenEnergyEvaluator,
  emergencyEvaluator,
  jobCreationEvaluator,
  socialValueEvaluator,
  pastDefaultResolvedEvaluator,
  creditRecoveryEvaluator,
  taxDelinquencyEvaluator,
};
export {
  emergencyInvestmentConflictEvaluator,
  restartVentureConflictEvaluator,
  microVentureConflictEvaluator,
  largeFundingMicroConflictEvaluator,
};

// ============================================================================
// 전체 평가자 배열 (우선순위 순 정렬)
// ============================================================================

export const ALL_EVALUATORS: Evaluator[] = [
  // 1. 하드컷/졸업제 (priority 0-10)
  kosmesGraduationEvaluator,

  // 2. 보증기관/대출잔액 (priority 11-25)
  guaranteeOrgEvaluator,
  loanBalanceEvaluator,
  kosmesRecentLoanEvaluator,
  subsidyRatioEvaluator,

  // 3. 자금용도 매칭 (priority 30-35)
  fundingPurposeEvaluator,
  fundingAmountEvaluator,

  // 4. 특수 상황 가점/감점 (priority 40-50)
  ventureInvestmentEvaluator,
  restartEvaluator,
  smartFactoryEvaluator,
  esgGreenEnergyEvaluator,
  emergencyEvaluator,
  jobCreationEvaluator,
  socialValueEvaluator,
  pastDefaultResolvedEvaluator,
  creditRecoveryEvaluator,
  taxDelinquencyEvaluator,

  // 5. 충돌 조정 (priority 60+)
  emergencyInvestmentConflictEvaluator,
  restartVentureConflictEvaluator,
  microVentureConflictEvaluator,        // GPT 제안: 소상공인+벤처 충돌
  largeFundingMicroConflictEvaluator,   // GPT 제안: 대규모자금+소상공인 충돌
].sort((a, b) => a.priority - b.priority);

/**
 * 평가자 ID로 조회
 */
export function getEvaluatorById(id: string): Evaluator | undefined {
  return ALL_EVALUATORS.find(e => e.id === id);
}

/**
 * 우선순위 범위로 평가자 필터링
 */
export function getEvaluatorsByPriority(minPriority: number, maxPriority: number): Evaluator[] {
  return ALL_EVALUATORS.filter(e => e.priority >= minPriority && e.priority <= maxPriority);
}
