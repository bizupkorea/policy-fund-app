/**
 * /test 페이지 전용 매칭 엔진 래퍼
 *
 * 목적: app/test/page.tsx에서 필요한 함수/타입만 깔끔하게 re-export
 *
 * 사용법:
 * import { matchWithKnowledgeBase, ExtendedCompanyProfile, DetailedMatchResult } from '@/lib/policy-fund/test-matcher';
 */

// ============================================================================
// 타입 re-export
// ============================================================================

export type {
  // 핵심 타입
  ExtendedCompanyProfile,
  DetailedMatchResult,

  // 매칭 결과 관련
  MatchLevel,
  MatchResult,
  MatchResultTrack,
  ConfidenceLabel,

  // 3분류 결과 타입
  MatchedFund,
  ConditionalFund,
  ExcludedFund,
} from './matching-engine';

// ============================================================================
// 함수 re-export
// ============================================================================

export {
  // 핵심 매칭 함수
  matchWithKnowledgeBase,

  // 유틸리티
  convertToKBProfile,
  convertToDetailedMatchResult,
} from './matching-engine';

// ============================================================================
// Knowledge Base re-export (테스트/디버깅용)
// ============================================================================

export {
  POLICY_FUND_KNOWLEDGE_BASE,
  INSTITUTIONS,
} from './knowledge-base';

// ============================================================================
// Eligibility Checker re-export (고급 사용자용)
// ============================================================================

export {
  checkAllFundsEligibility,
  checkFundEligibility,
  getEligibleFunds,
} from './eligibility-checker';

export type {
  EligibilityResult,
  CompanyProfile as KBCompanyProfile,
} from './eligibility-checker';
