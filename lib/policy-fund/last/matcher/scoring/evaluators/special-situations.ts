/**
 * lib/policy-fund/last/matcher/scoring/evaluators/special-situations.ts
 *
 * 특수 상황 평가자 모음
 * - 벤처투자 유치
 * - 재창업
 * - 스마트공장
 * - ESG/탄소중립
 * - 신재생에너지
 * - 긴급경영안정
 * - 일자리 창출
 * - 사회적가치 기업
 * - 과거 부실 정리
 * - 신용회복 진행
 * - 세금 체납 분납
 */

import type { Evaluator, EvaluationResult } from './base-evaluator';
import { SPECIAL_BONUSES } from '../../config';
import { isFundInCategory, isRestartFund, isInnovationFund, matchesKeywords } from '../../config';

// ============================================================================
// 벤처투자 유치
// ============================================================================

export const ventureInvestmentEvaluator: Evaluator = {
  id: 'venture-investment',
  name: '벤처투자 유치',
  priority: 40,

  evaluate(result, profile): EvaluationResult | null {
    if (!profile.hasVentureInvestment) return null;

    const isInnovation = isInnovationFund(result.fundId, result.fundName);
    const isMicro = result.institutionId === 'semas' || matchesKeywords(result.fundName, 'micro');

    if (isInnovation) {
      return {
        bonus: SPECIAL_BONUSES.ventureInvestment.innovationBonus,
        reason: SPECIAL_BONUSES.ventureInvestment.innovationMessage,
      };
    }

    if (isMicro) {
      return {
        penalty: SPECIAL_BONUSES.ventureInvestment.microPenalty,
        warning: SPECIAL_BONUSES.ventureInvestment.microPenaltyMessage,
      };
    }

    return null;
  },
};

// ============================================================================
// 재창업
// ============================================================================

export const restartEvaluator: Evaluator = {
  id: 'restart',
  name: '재창업',
  priority: 41,

  evaluate(result, profile): EvaluationResult | null {
    if (!profile.isRestart) return null;

    const isRestart = isRestartFund(result.fundId, result.fundName);

    if (isRestart) {
      // 전용자금 완벽 매칭 → 100점 허용 (트랙 전환 방식)
      return {
        bonus: SPECIAL_BONUSES.restart.dedicatedBonus,
        reason: SPECIAL_BONUSES.restart.dedicatedMessage,
        isPerfectMatch: true,  // GPT 제안: 100점 허용
      };
    }

    // 일반자금: 부실 이력에 따라 차등
    const hasNoDefault = !profile.hasPastDefault;
    const isDefaultResolved = profile.hasPastDefault && profile.isPastDefaultResolved;

    if (hasNoDefault) {
      return {
        warning: SPECIAL_BONUSES.restart.noDefaultWarning,
      };
    }

    if (isDefaultResolved) {
      return {
        penalty: SPECIAL_BONUSES.restart.generalPenalty,
        warning: SPECIAL_BONUSES.restart.defaultResolvedWarning,
      };
    }

    return null;
  },
};

// ============================================================================
// 스마트공장
// ============================================================================

export const smartFactoryEvaluator: Evaluator = {
  id: 'smart-factory',
  name: '스마트공장',
  priority: 42,

  evaluate(result, profile): EvaluationResult | null {
    if (!profile.hasSmartFactoryPlan) return null;

    const isSmartFactory = isFundInCategory(result.fundId, 'smartFactory') ||
                           matchesKeywords(result.fundName, 'smartFactory');

    if (!isSmartFactory) return null;

    // 제조업 여부 확인
    const industryCode = profile.industryCode || '';
    const isManufacturing = industryCode.startsWith('C') ||
                            (parseInt(industryCode.substring(0, 2)) >= 10 &&
                             parseInt(industryCode.substring(0, 2)) <= 34);

    if (isManufacturing) {
      // 전용자금 완벽 매칭 (제조업 + 스마트공장) → 100점 허용
      return {
        bonus: SPECIAL_BONUSES.smartFactory.manufacturing,
        reason: '스마트공장 구축/고도화 계획 (제조업) - 스마트공장자금 최우선 추천',
        isPerfectMatch: true,  // GPT 제안: 100점 허용
      };
    }

    // 비제조업: 완벽 매칭 아님 (경고 포함)
    return {
      bonus: SPECIAL_BONUSES.smartFactory.other,
      warning: SPECIAL_BONUSES.smartFactory.warningMessage,
      reason: '스마트공장 구축 계획 (비제조업 주의)',
      // isPerfectMatch: false - 비제조업은 100점 불가
    };
  },
};

// ============================================================================
// ESG/탄소중립 + 신재생에너지 (Ceiling 적용)
// ============================================================================

export const esgGreenEnergyEvaluator: Evaluator = {
  id: 'esg-green-energy',
  name: 'ESG/신재생에너지',
  priority: 43,

  evaluate(result, profile): EvaluationResult | null {
    const hasEsg = profile.hasEsgInvestmentPlan;
    const hasGreenEnergy = profile.isGreenEnergyBusiness;

    if (!hasEsg && !hasGreenEnergy) return null;

    const isEsgFund = isFundInCategory(result.fundId, 'green') ||
                       matchesKeywords(result.fundName, 'esg');
    const isGreenEnergyFund = isFundInCategory(result.fundId, 'greenEnergy') ||
                               matchesKeywords(result.fundName, 'greenEnergy');

    let bonus = 0;
    const reasons: string[] = [];
    let isPerfectMatch = false;

    if (hasEsg && isEsgFund) {
      bonus += SPECIAL_BONUSES.esg.bonus;
      reasons.push('ESG/탄소중립 시설투자 계획');
      isPerfectMatch = true;  // 전용자금 완벽 매칭
    }

    if (hasGreenEnergy && isGreenEnergyFund) {
      bonus += SPECIAL_BONUSES.greenEnergy.bonus;
      reasons.push('신재생에너지 사업');
      isPerfectMatch = true;  // 전용자금 완벽 매칭
    }

    if (bonus <= 0) return null;

    // Ceiling 적용
    const appliedBonus = Math.min(bonus, SPECIAL_BONUSES.esgGreenCeiling);

    if (bonus > SPECIAL_BONUSES.esgGreenCeiling) {
      return {
        bonus: appliedBonus,
        reason: `${reasons.join(' + ')} - 녹색/신재생 자금 최우선 (가점 ${appliedBonus}점, Ceiling 적용)`,
        isPerfectMatch,  // GPT 제안: 100점 허용
      };
    }

    return {
      bonus: appliedBonus,
      reason: `${reasons.join(' + ')} - 녹색/신재생 자금 최우선 추천`,
      isPerfectMatch,  // GPT 제안: 100점 허용
    };
  },
};

// ============================================================================
// 긴급경영안정
// ============================================================================

export const emergencyEvaluator: Evaluator = {
  id: 'emergency',
  name: '긴급경영안정',
  priority: 44,

  evaluate(result, profile): EvaluationResult | null {
    if (!profile.isEmergencySituation) return null;

    const isEmergency = isFundInCategory(result.fundId, 'emergency') ||
                         matchesKeywords(result.fundName, 'emergency');

    if (isEmergency) {
      // 전용자금 완벽 매칭 → 100점 허용
      return {
        bonus: SPECIAL_BONUSES.emergency.bonus,
        reason: SPECIAL_BONUSES.emergency.message,
        isPerfectMatch: true,  // GPT 제안: 100점 허용
      };
    }

    return null;
  },
};

// ============================================================================
// 일자리 창출
// ============================================================================

export const jobCreationEvaluator: Evaluator = {
  id: 'job-creation',
  name: '일자리 창출',
  priority: 45,

  evaluate(result, profile): EvaluationResult | null {
    if (!profile.hasJobCreation) return null;

    const isJobCreation = isFundInCategory(result.fundId, 'jobCreation') ||
                           matchesKeywords(result.fundName, 'jobCreation');

    if (isJobCreation) {
      return {
        bonus: SPECIAL_BONUSES.jobCreation.bonus,
        reason: SPECIAL_BONUSES.jobCreation.message,
      };
    }

    return null;
  },
};

// ============================================================================
// 사회적가치 기업
// ============================================================================

export const socialValueEvaluator: Evaluator = {
  id: 'social-value',
  name: '사회적가치 기업',
  priority: 46,

  evaluate(result, profile): EvaluationResult | null {
    if (!profile.isDisabledStandard && !profile.isSocialEnterprise) return null;

    const isSocialFund = isFundInCategory(result.fundId, 'socialValue') ||
                          matchesKeywords(result.fundName, 'socialValue');

    if (isSocialFund) {
      // 전용자금 완벽 매칭 → 100점 허용
      return {
        bonus: SPECIAL_BONUSES.socialValue.dedicatedBonus,
        reason: SPECIAL_BONUSES.socialValue.dedicatedMessage,
        isPerfectMatch: true,  // GPT 제안: 100점 허용
      };
    }

    // 일반자금도 베이스 가점 (완벽 매칭 아님)
    return {
      bonus: SPECIAL_BONUSES.socialValue.generalBonus,
      reason: SPECIAL_BONUSES.socialValue.generalMessage,
    };
  },
};

// ============================================================================
// 과거 부실 정리 완료
// ============================================================================

export const pastDefaultResolvedEvaluator: Evaluator = {
  id: 'past-default-resolved',
  name: '과거 부실 정리',
  priority: 47,

  evaluate(result, profile): EvaluationResult | null {
    if (!profile.hasPastDefault || !profile.isPastDefaultResolved) return null;

    const isRestart = isRestartFund(result.fundId, result.fundName);

    if (isRestart) {
      return {
        bonus: SPECIAL_BONUSES.pastDefaultResolved.restartBonus,
        reason: SPECIAL_BONUSES.pastDefaultResolved.restartMessage,
      };
    }

    return {
      penalty: SPECIAL_BONUSES.pastDefaultResolved.generalPenalty,
      warning: SPECIAL_BONUSES.pastDefaultResolved.generalWarning,
    };
  },
};

// ============================================================================
// 신용회복 진행 중
// ============================================================================

export const creditRecoveryEvaluator: Evaluator = {
  id: 'credit-recovery',
  name: '신용회복 진행',
  priority: 48,

  evaluate(result, profile): EvaluationResult | null {
    if (!profile.isCreditRecoveryInProgress) return null;

    const isRestart = isRestartFund(result.fundId, result.fundName);

    if (isRestart) {
      return {
        bonus: SPECIAL_BONUSES.creditRecovery.restartBonus,
        reason: SPECIAL_BONUSES.creditRecovery.message,
        warning: SPECIAL_BONUSES.creditRecovery.warning,
      };
    }

    return {
      warning: SPECIAL_BONUSES.creditRecovery.warning,
    };
  },
};

// ============================================================================
// 세금 체납 + 분납 승인
// ============================================================================

export const taxDelinquencyEvaluator: Evaluator = {
  id: 'tax-delinquency',
  name: '세금 체납 분납',
  priority: 49,

  evaluate(result, profile): EvaluationResult | null {
    if (profile.taxDelinquencyStatus !== 'active') return null;
    if (!profile.hasTaxInstallmentApproval) return null;

    return {
      penalty: SPECIAL_BONUSES.taxDelinquencyWithApproval.penalty,
      warning: SPECIAL_BONUSES.taxDelinquencyWithApproval.warning,
    };
  },
};
