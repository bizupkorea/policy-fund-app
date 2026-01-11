/**
 * lib/policy-fund/last/matcher/scoring/evaluators/funding-purpose.ts
 *
 * 자금용도 매칭 평가자
 * - 운전자금/시설자금/혼합 선택에 따라 차등 점수
 */

import type { Evaluator, EvaluationResult } from './base-evaluator';
import { FUNDING_PURPOSE_BONUS, FUNDING_AMOUNT } from '../../config';

export const fundingPurposeEvaluator: Evaluator = {
  id: 'funding-purpose',
  name: '자금용도 매칭',
  priority: 30,

  evaluate(result, profile, fund): EvaluationResult | null {
    if (!profile.requestedFundingPurpose || !fund) return null;

    const requested = profile.requestedFundingPurpose;
    const supportsWorking = fund.fundingPurpose.working;
    const supportsFacility = fund.fundingPurpose.facility;
    const supportsBoth = supportsWorking && supportsFacility;

    // 운전자금 선택
    if (requested === 'working') {
      if (supportsWorking && !supportsFacility) {
        return {
          bonus: FUNDING_PURPOSE_BONUS.match.working,
          reason: '운전자금 전용 - 용도 일치',
        };
      }
      if (!supportsWorking && supportsFacility) {
        return {
          penalty: Math.abs(FUNDING_PURPOSE_BONUS.mismatch),
          warning: '용도 불일치 (운전자금 필요, 시설자금 전용)',
        };
      }
    }

    // 시설자금 선택
    if (requested === 'facility') {
      if (supportsFacility && !supportsWorking) {
        return {
          bonus: FUNDING_PURPOSE_BONUS.match.facility,
          reason: '시설자금 전용 - 용도 일치',
        };
      }
      if (!supportsFacility && supportsWorking) {
        return {
          penalty: Math.abs(FUNDING_PURPOSE_BONUS.mismatch),
          warning: '용도 불일치 (시설자금 필요, 운전자금 전용)',
        };
      }
    }

    // 혼합자금 선택
    if (requested === 'both') {
      if (supportsBoth) {
        return {
          bonus: FUNDING_PURPOSE_BONUS.match.both,
          reason: '시설자금+운전자금 모두 지원 가능',
        };
      }
      if (supportsFacility && !supportsWorking) {
        return {
          bonus: FUNDING_PURPOSE_BONUS.facilityPartial,
          reason: '시설자금 지원 가능',
        };
      }
    }

    return null;
  },
};

export const fundingAmountEvaluator: Evaluator = {
  id: 'funding-amount',
  name: '필요자금 규모',
  priority: 31,

  evaluate(result, profile, fund): EvaluationResult | null {
    if (!profile.requiredFundingAmount || profile.requiredFundingAmount <= 0 || !fund) {
      return null;
    }

    const requiredAmount = profile.requiredFundingAmount * 100000000;
    const fundMaxAmount = fund.terms.amount.max;

    // 한도 충족
    if (fundMaxAmount && requiredAmount <= fundMaxAmount) {
      const result1: EvaluationResult = {
        bonus: FUNDING_AMOUNT.matchBonus,
        reason: `필요 자금 (${profile.requiredFundingAmount}억) 한도 충족`,
      };

      // 대규모 자금 추가 가점
      if (profile.requiredFundingAmount >= FUNDING_AMOUNT.largeThreshold) {
        if (result.fundId === 'kodit-securitization' || result.fundId === 'kosmes-investment-loan') {
          result1.bonus = (result1.bonus || 0) + FUNDING_AMOUNT.largeBonus;
          result1.reason = `필요 자금 (${profile.requiredFundingAmount}억) 한도 충족 - ` + FUNDING_AMOUNT.largeMessage;
        }
      }

      return result1;
    }

    // 한도 초과
    if (fundMaxAmount && requiredAmount > fundMaxAmount) {
      const fundMaxInBillion = Math.round(fundMaxAmount / 100000000);
      return {
        warning: `필요 자금 초과 (한도: ${fundMaxInBillion}억원)`,
      };
    }

    return null;
  },
};
