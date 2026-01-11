/**
 * lib/policy-fund/last/matcher/config/index.ts
 *
 * 설정 파일 통합 export
 */

// 자금 카테고리
export {
  FUND_CATEGORIES,
  FUND_KEYWORDS,
  DIRECT_LOAN_INSTITUTIONS,
  GUARANTEE_INSTITUTIONS,
  INSTITUTION_LABELS,
  isFundInCategory,
  matchesKeywords,
  isRestartFund,
  isInnovationFund,
  isDirectLoanInstitution,
  isGuaranteeInstitution,
} from './fund-categories';

// 점수 설정
export {
  SCORING_CONFIG,
  RANK_DIFFERENTIATION,
  getRankPenalty,
  INSTITUTION_BONUS,
  getInstitutionBonus,
  CERTIFICATION_BONUS,
  FUNDING_PURPOSE_BONUS,
  TRACK_PRIORITY,
  scoreToLevel,
  clampScore,
  applyBonus,
  applyPenalty,
} from './scoring-config';

// 비즈니스 규칙 기준값
export {
  KOSMES_GRADUATION,
  GUARANTEE_ORG,
  LOAN_BALANCE,
  SUBSIDY_RATIO,
  SPECIAL_BONUSES,
  CONFLICT_PENALTIES,
  FUNDING_AMOUNT,
  HARD_CUT_MESSAGES,
} from './thresholds';
