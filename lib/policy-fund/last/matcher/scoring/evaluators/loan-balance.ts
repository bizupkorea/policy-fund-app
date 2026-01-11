/**
 * lib/policy-fund/last/matcher/scoring/evaluators/loan-balance.ts
 *
 * 기존 대출잔액 평가자
 * - 직접대출(중진공, 소진공) vs 보증(신보, 기보) 차등 감점
 * - 15억 이상: 심각
 * - 10~15억: 높음
 * - 5~10억: 보통
 */

import type { Evaluator, EvaluationResult } from './base-evaluator';
import { LOAN_BALANCE } from '../../config';
import { isDirectLoanInstitution, isGuaranteeInstitution } from '../../config';

export const loanBalanceEvaluator: Evaluator = {
  id: 'loan-balance',
  name: '기존 대출잔액',
  priority: 20,

  evaluate(result, profile): EvaluationResult | null {
    // 잔액 없음
    if (!profile.existingLoanBalance || profile.existingLoanBalance <= 0) {
      return null;
    }

    const balance = profile.existingLoanBalance;
    const isDirectLoan = isDirectLoanInstitution(result.institutionId);
    const isGuarantee = isGuaranteeInstitution(result.institutionId);

    // 심각 (15억 이상)
    if (balance >= LOAN_BALANCE.severe.threshold) {
      const penalty = isDirectLoan
        ? LOAN_BALANCE.severe.directLoanPenalty
        : isGuarantee
        ? LOAN_BALANCE.severe.guaranteePenalty
        : LOAN_BALANCE.severe.defaultPenalty;

      return {
        penalty,
        warning: LOAN_BALANCE.severe.message(balance),
      };
    }

    // 높음 (10~15억)
    if (balance >= LOAN_BALANCE.high.threshold) {
      const penalty = isDirectLoan
        ? LOAN_BALANCE.high.directLoanPenalty
        : isGuarantee
        ? LOAN_BALANCE.high.guaranteePenalty
        : LOAN_BALANCE.high.defaultPenalty;

      return {
        penalty,
        warning: LOAN_BALANCE.high.message(balance),
      };
    }

    // 보통 (5~10억)
    if (balance >= LOAN_BALANCE.medium.threshold) {
      const penalty = isDirectLoan
        ? LOAN_BALANCE.medium.directLoanPenalty
        : isGuarantee
        ? LOAN_BALANCE.medium.guaranteePenalty
        : LOAN_BALANCE.medium.defaultPenalty;

      return {
        penalty,
        warning: LOAN_BALANCE.medium.message(balance),
      };
    }

    return null;
  },
};
