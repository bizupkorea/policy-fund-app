/**
 * lib/policy-fund/last/matcher/scoring/evaluators/subsidy-ratio.ts
 *
 * 수혜액/매출 비율 평가자
 * - 30% 초과: -30점
 * - 20~30%: -20점
 * - 10~20%: -10점
 * - 매출 정보 없이 절대금액만 있을 경우 fallback
 */

import type { Evaluator, EvaluationResult } from './base-evaluator';
import { SUBSIDY_RATIO } from '../../config';

export const subsidyRatioEvaluator: Evaluator = {
  id: 'subsidy-ratio',
  name: '수혜액/매출 비율',
  priority: 25,

  evaluate(result, profile): EvaluationResult | null {
    const recentSubsidy = profile.recentYearSubsidyAmount ?? 0;
    const revenue = profile.revenue ?? 0;

    // 수혜액 없음
    if (recentSubsidy <= 0) return null;

    // 매출 정보 있음: 비율 기반 감점
    if (revenue > 0) {
      const ratio = recentSubsidy / revenue;
      const ratioPercent = Math.round(ratio * 100);

      // 30% 초과
      if (ratio > SUBSIDY_RATIO.severe.ratio) {
        return {
          penalty: SUBSIDY_RATIO.severe.penalty,
          warning: SUBSIDY_RATIO.severe.message(ratioPercent),
        };
      }

      // 20~30%
      if (ratio > SUBSIDY_RATIO.high.ratio) {
        return {
          penalty: SUBSIDY_RATIO.high.penalty,
          warning: SUBSIDY_RATIO.high.message(ratioPercent),
        };
      }

      // 10~20%
      if (ratio > SUBSIDY_RATIO.medium.ratio) {
        return {
          penalty: SUBSIDY_RATIO.medium.penalty,
          warning: SUBSIDY_RATIO.medium.message(ratioPercent),
        };
      }

      return null;
    }

    // 매출 정보 없음: 절대금액 기준 (fallback)
    if (recentSubsidy >= 5) {
      const abs = SUBSIDY_RATIO.absoluteAmount;

      if (recentSubsidy >= abs.highThreshold) {
        return {
          penalty: abs.highPenalty,
          warning: abs.highMessage(recentSubsidy),
        };
      }

      return {
        penalty: abs.lowPenalty,
        warning: abs.lowMessage(recentSubsidy),
      };
    }

    return null;
  },
};
