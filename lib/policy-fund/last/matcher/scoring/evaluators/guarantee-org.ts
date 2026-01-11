/**
 * lib/policy-fund/last/matcher/scoring/evaluators/guarantee-org.ts
 *
 * 보증기관 이용 현황 평가자
 * - 양쪽 기관 모두 이용 중: -30점
 * - 타기관 이용 중: -10점
 * - 동일 기관 추가 이용: 경고만
 */

import type { Evaluator, EvaluationResult } from './base-evaluator';
import { GUARANTEE_ORG } from '../../config';
import { isGuaranteeInstitution } from '../../config';

export const guaranteeOrgEvaluator: Evaluator = {
  id: 'guarantee-org',
  name: '보증기관 이용 현황',
  priority: 15,

  evaluate(result, profile): EvaluationResult | null {
    // 보증 기관 자금만 해당
    if (!isGuaranteeInstitution(result.institutionId)) return null;

    // 이용 현황 없음
    if (!profile.currentGuaranteeOrg || profile.currentGuaranteeOrg === 'none') {
      return null;
    }

    const usingBoth = profile.currentGuaranteeOrg === 'both';
    const usingKodit = profile.currentGuaranteeOrg === 'kodit' || usingBoth;
    const usingKibo = profile.currentGuaranteeOrg === 'kibo' || usingBoth;

    const isKodit = result.institutionId === 'kodit';
    const isKibo = result.institutionId === 'kibo';

    // 케이스 1: 양쪽 기관 모두 이용 중
    if (usingBoth) {
      return {
        penalty: GUARANTEE_ORG.bothPenalty,
        warning: GUARANTEE_ORG.bothMessage,
      };
    }

    // 케이스 2: 타기관 이용 중
    if ((isKibo && usingKodit) || (isKodit && usingKibo)) {
      return {
        penalty: GUARANTEE_ORG.otherPenalty,
        warning: GUARANTEE_ORG.otherMessage,
      };
    }

    // 케이스 3: 동일 기관 추가 이용 (경고만)
    if ((isKibo && usingKibo) || (isKodit && usingKodit)) {
      const orgName = isKibo ? '기보' : '신보';
      return {
        warning: GUARANTEE_ORG.sameOrgMessage(orgName),
      };
    }

    return null;
  },
};
