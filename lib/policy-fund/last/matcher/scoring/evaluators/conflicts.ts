/**
 * lib/policy-fund/last/matcher/scoring/evaluators/conflicts.ts
 *
 * 충돌 조정 평가자 (GPT 제안 추가)
 * - 긴급경영 + IPO/투자유치 충돌
 * - 재창업 + 벤처투자실적 충돌
 * - 소상공인 + 벤처인증 충돌 (GPT 제안)
 * - 대규모 자금 + 소상공인 충돌 (GPT 제안)
 */

import type { Evaluator, EvaluationResult } from './base-evaluator';
import { CONFLICT_PENALTIES } from '../../config';

// ============================================================================
// 긴급경영 + IPO/투자유치 충돌
// ============================================================================

export const emergencyInvestmentConflictEvaluator: Evaluator = {
  id: 'conflict-emergency-investment',
  name: '긴급경영+투자유치 충돌',
  priority: 60,

  evaluate(result, profile): EvaluationResult | null {
    if (!profile.isEmergencySituation || !profile.hasIpoOrInvestmentPlan) {
      return null;
    }

    if (result.fundId === 'kosmes-investment-loan') {
      return {
        penalty: CONFLICT_PENALTIES.emergencyWithInvestment.penalty,
        warning: CONFLICT_PENALTIES.emergencyWithInvestment.message,
      };
    }

    return null;
  },
};

// ============================================================================
// 재창업 + 벤처투자실적 충돌
// ============================================================================

export const restartVentureConflictEvaluator: Evaluator = {
  id: 'conflict-restart-venture',
  name: '재창업+벤처투자 충돌',
  priority: 61,

  evaluate(result, profile): EvaluationResult | null {
    if (!profile.isRestart || !profile.hasVentureInvestment) {
      return null;
    }

    const innovationFundIds = ['kosmes-investment-loan', 'kodit-innovation-growth'];

    if (innovationFundIds.includes(result.fundId)) {
      return {
        penalty: CONFLICT_PENALTIES.restartWithVenture.penalty,
        warning: CONFLICT_PENALTIES.restartWithVenture.message,
      };
    }

    return null;
  },
};

// ============================================================================
// 소상공인 + 벤처인증 충돌 (GPT 제안)
// - 소상공인 기업이 벤처인증 보유 시 → 중진공 우선 안내
// ============================================================================

export const microVentureConflictEvaluator: Evaluator = {
  id: 'conflict-micro-venture',
  name: '소상공인+벤처 충돌',
  priority: 62,

  evaluate(result, profile): EvaluationResult | null {
    // 소상공인 규모 + 벤처인증 보유
    const isMicro = profile.companySize === 'micro' ||
                    (profile.employeeCount && profile.employeeCount < 10);

    if (!isMicro || !profile.isVentureCompany) {
      return null;
    }

    // 소진공 자금에 대한 경고 (감점 없음, 안내만)
    if (result.institutionId === 'semas') {
      return {
        warning: '벤처인증 보유 기업은 중진공 혁신자금도 검토 권장',
      };
    }

    // 중진공 자금에 대한 가점 안내
    if (result.institutionId === 'kosmes') {
      return {
        reason: '벤처인증 소규모 기업 - 중진공 혁신자금 우대 대상',
      };
    }

    return null;
  },
};

// ============================================================================
// 대규모 자금 + 소상공인 충돌 (GPT 제안)
// - 10억 이상 필요자금 + 소상공인 → 경고
// ============================================================================

export const largeFundingMicroConflictEvaluator: Evaluator = {
  id: 'conflict-large-funding-micro',
  name: '대규모자금+소상공인 충돌',
  priority: 63,

  evaluate(result, profile): EvaluationResult | null {
    // 대규모 자금 필요 (10억 이상)
    const needsLargeFunding = (profile.requiredFundingAmount ?? 0) >= 10;

    // 소상공인 규모
    const isMicro = profile.companySize === 'micro' ||
                    (profile.employeeCount && profile.employeeCount < 10);

    if (!needsLargeFunding || !isMicro) {
      return null;
    }

    // 소진공 자금은 한도 제한 경고
    if (result.institutionId === 'semas') {
      return {
        penalty: 15,
        warning: `필요자금 ${profile.requiredFundingAmount}억원 - 소진공 한도(7천만~1억) 초과 가능성`,
      };
    }

    return null;
  },
};
