/**
 * lib/policy-fund/last/matcher/scoring/evaluators/base-evaluator.ts
 *
 * 평가자 기본 인터페이스 정의
 * - 모든 평가자는 이 인터페이스를 구현
 * - 평가 결과는 가점/감점/제외/경고 중 하나 이상
 */

import type {
  ExtendedCompanyProfile,
  DetailedMatchResult,
  PolicyFundKnowledge,
} from '../../../types';

// ============================================================================
// 평가 결과 타입
// ============================================================================

export interface EvaluationResult {
  /** 제외 여부 (true면 결과에서 완전 제외) */
  excluded?: boolean;

  /** 감점 점수 (양수) */
  penalty?: number;

  /** 가점 점수 (양수) */
  bonus?: number;

  /** 경고 메시지 (점수 영향 없음, UI 표시용) */
  warning?: string;

  /** 적격 사유 (점수 영향 없음, UI 표시용) */
  reason?: string;

  /**
   * 완벽 매칭 플래그 (100점 허용)
   * - 전용자금 + 조건 충족 시에만 true
   * - 95점 Cap을 우회하여 100점 부여 가능
   */
  isPerfectMatch?: boolean;
}

// ============================================================================
// 평가자 인터페이스
// ============================================================================

export interface Evaluator {
  /** 평가자 ID (고유 식별자) */
  id: string;

  /** 평가자 이름 (UI 표시용) */
  name: string;

  /** 우선순위 (낮을수록 먼저 실행, 하드컷은 0~10) */
  priority: number;

  /**
   * 평가 실행
   *
   * @param result 현재 매칭 결과
   * @param profile 기업 프로필
   * @param fund 자금 정보 (nullable)
   * @returns 평가 결과 (null이면 해당 없음)
   */
  evaluate(
    result: DetailedMatchResult,
    profile: ExtendedCompanyProfile,
    fund: PolicyFundKnowledge | undefined
  ): EvaluationResult | null;
}

// ============================================================================
// 평가 결과 적용 유틸리티
// ============================================================================

/**
 * 평가 결과를 매칭 결과에 적용
 * - GPT 제안 적용: 95점 Cap, 100점은 전용자금 완벽 매칭만
 */
export function applyEvaluation(
  result: DetailedMatchResult,
  evaluation: EvaluationResult
): void {
  // 완벽 매칭 플래그 전파
  if (evaluation.isPerfectMatch) {
    (result as any)._isPerfectMatch = true;
  }

  // 점수 상한 결정 (95 기본, 100은 완벽 매칭만)
  const scoreCap = (result as any)._isPerfectMatch ? 100 : 95;

  // 가점 적용 (상한 적용)
  if (evaluation.bonus && evaluation.bonus > 0) {
    result.score = Math.min(scoreCap, result.score + evaluation.bonus);
  }

  // 감점 적용
  if (evaluation.penalty && evaluation.penalty > 0) {
    result.score = Math.max(0, result.score - evaluation.penalty);
  }

  // 경고 추가
  if (evaluation.warning) {
    result.warnings.push(evaluation.warning);
  }

  // 적격 사유 추가
  if (evaluation.reason) {
    result.eligibilityReasons.push(evaluation.reason);
  }

  // 레벨 재계산
  result.level = result.score >= 70 ? 'high' : result.score >= 40 ? 'medium' : 'low';
}

/**
 * 여러 평가 결과를 병합
 */
export function mergeEvaluations(
  ...evaluations: (EvaluationResult | null)[]
): EvaluationResult {
  const merged: EvaluationResult = {};

  for (const eval_ of evaluations) {
    if (!eval_) continue;

    if (eval_.excluded) merged.excluded = true;
    if (eval_.penalty) merged.penalty = (merged.penalty || 0) + eval_.penalty;
    if (eval_.bonus) merged.bonus = (merged.bonus || 0) + eval_.bonus;
    // 경고와 사유는 마지막 것만 유지 (개별 적용 필요)
    if (eval_.warning) merged.warning = eval_.warning;
    if (eval_.reason) merged.reason = eval_.reason;
  }

  return merged;
}

// ============================================================================
// 평가자 팩토리 유틸리티
// ============================================================================

/**
 * 간단한 조건부 감점 평가자 생성
 */
export function createPenaltyEvaluator(
  id: string,
  name: string,
  priority: number,
  condition: (result: DetailedMatchResult, profile: ExtendedCompanyProfile) => boolean,
  penalty: number,
  warning: string
): Evaluator {
  return {
    id,
    name,
    priority,
    evaluate: (result, profile) => {
      if (condition(result, profile)) {
        return { penalty, warning };
      }
      return null;
    },
  };
}

/**
 * 간단한 조건부 가점 평가자 생성
 */
export function createBonusEvaluator(
  id: string,
  name: string,
  priority: number,
  condition: (result: DetailedMatchResult, profile: ExtendedCompanyProfile) => boolean,
  bonus: number,
  reason: string
): Evaluator {
  return {
    id,
    name,
    priority,
    evaluate: (result, profile) => {
      if (condition(result, profile)) {
        return { bonus, reason };
      }
      return null;
    },
  };
}

/**
 * 간단한 하드컷 평가자 생성
 */
export function createHardCutEvaluator(
  id: string,
  name: string,
  condition: (result: DetailedMatchResult, profile: ExtendedCompanyProfile) => boolean
): Evaluator {
  return {
    id,
    name,
    priority: 0, // 하드컷은 항상 최우선
    evaluate: (result, profile) => {
      if (condition(result, profile)) {
        return { excluded: true };
      }
      return null;
    },
  };
}
