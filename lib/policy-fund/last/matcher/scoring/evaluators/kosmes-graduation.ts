/**
 * lib/policy-fund/last/matcher/scoring/evaluators/kosmes-graduation.ts
 *
 * 중진공 졸업제 평가자
 * - 5회 이상: 완전 제외
 * - 4회: -30점
 * - 3회: 경고만
 * - 최근 2년 내 이용: 추가 -10점
 */

import type { Evaluator, EvaluationResult } from './base-evaluator';
import { KOSMES_GRADUATION } from '../../config';

export const kosmesGraduationEvaluator: Evaluator = {
  id: 'kosmes-graduation',
  name: '중진공 졸업제',
  priority: 5, // 하드컷 우선순위

  evaluate(result, profile): EvaluationResult | null {
    // 중진공 자금만 해당
    if (result.institutionId !== 'kosmes') return null;

    const count = profile.kosmesPreviousCount ?? 0;

    // 5회 이상: 완전 제외
    if (count >= KOSMES_GRADUATION.excludeThreshold) {
      return { excluded: true };
    }

    // 4회: -30점
    if (count === KOSMES_GRADUATION.warning4Threshold) {
      return {
        penalty: KOSMES_GRADUATION.warning4Penalty,
        warning: KOSMES_GRADUATION.warning4Message,
      };
    }

    // 3회: 경고만
    if (count === KOSMES_GRADUATION.warning3Threshold) {
      return {
        warning: KOSMES_GRADUATION.warning3Message,
      };
    }

    return null;
  },
};

export const kosmesRecentLoanEvaluator: Evaluator = {
  id: 'kosmes-recent-loan',
  name: '중진공 최근 이용',
  priority: 20,

  evaluate(result, profile): EvaluationResult | null {
    // 중진공 자금만 해당
    if (result.institutionId !== 'kosmes') return null;

    // 최근 2년 내 이용
    if (profile.hasRecentKosmesLoan) {
      return {
        penalty: KOSMES_GRADUATION.recentLoanPenalty,
        warning: KOSMES_GRADUATION.recentLoanMessage,
      };
    }

    return null;
  },
};
