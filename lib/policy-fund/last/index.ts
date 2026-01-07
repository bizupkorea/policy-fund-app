/**
 * lib/policy-fund/last/index.ts
 *
 * /test 페이지 전용 독립 모듈 메인 export
 * 이 폴더의 모든 파일은 기존 lib/policy-fund/와 완전히 독립적입니다.
 */

// ============================================================================
// 핵심 매칭 함수 export
// ============================================================================

export {
  matchWithKnowledgeBase,
  classifyMatchResults,
  convertToKBProfile,
  convertToDetailedMatchResult,
  TRACK_LABELS,
  TRACK_PRIORITY,
} from './matcher';

// ============================================================================
// 자격 체크 함수 export
// ============================================================================

export {
  checkAllFundsEligibility,
  checkFundEligibility,
  getEligibleFunds,
  getEligibleFundsByInstitution,
  quickScreening,
  getSuggestions,
  summarizeEligibility,
  summarizeSuggestions,
} from './eligibility';

export type { Suggestion } from './eligibility';

// ============================================================================
// AI 어드바이저 함수 export
// ============================================================================

export {
  analyzeWithAI,
  analyzePortfolio,
  quickAnalyze,
  generateBriefingScript,
} from './gemini-advisor';

// ============================================================================
// Knowledge Base export
// ============================================================================

export {
  POLICY_FUND_KNOWLEDGE_BASE,
  INSTITUTIONS,
  getFundById,
  getFundsByInstitution,
  getFundsByType,
  getAllFunds,
  getInstitutionInfo,
} from './knowledge-base';

// ============================================================================
// 타입 export
// ============================================================================

export type {
  // 기관 및 자금 유형
  InstitutionId,
  FundType,
  FundTrack,
  IndustryCategory,
  CompanyScale,
  OwnerCharacteristic,
  BusinessAgeException,

  // 매칭 결과
  MatchLevel,
  MatchResult,
  MatchResultTrack,
  ConfidenceLabel,
  TrackLabel,

  // 3분류 결과
  MatchedFund,
  ConditionalFund,
  ExcludedFund,
  TrackDecision,
  ClassifiedMatchResult,

  // 상세 매칭 결과
  DetailedMatchResult,

  // 기업 프로필
  CompanyPolicyProfile,
  ExtendedCompanyProfile,
  CompanyProfile,

  // 자격 체크 결과
  CheckResult,
  EligibilityResult,

  // AI 분석 결과
  AIAdvisorResult,
  PortfolioAnalysis,

  // Knowledge Base
  PolicyFundKnowledge,
  InstitutionInfo,
  EligibilityCriteria,
  SupportTerms,
  FundingPurpose,
} from './types';
