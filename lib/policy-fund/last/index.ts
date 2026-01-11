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
// UI 상수 export
// ============================================================================

export {
  INDUSTRY_OPTIONS,
  REGION_OPTIONS,
  INSTITUTION_COLORS,
  INSTITUTION_NAMES,
} from './constants';

export type { IndustryOption, InstitutionColorStyle } from './constants';

// ============================================================================
// UI 타입 및 프리셋 export
// ============================================================================

export {
  EMPTY_PROFILE,
} from './ui-types';

export type {
  IndustryType,
  GuaranteeOrg,
  TestProfile,
  PresetScenario,
} from './ui-types';

export { PRESET_SCENARIOS } from './presets';

// ============================================================================
// Step UI 상수 export (신규)
// ============================================================================

export {
  STEP_INFO,
  STEP_LABELS,
  TOTAL_STEPS,
  FUNDING_STEPS,
  FUNDING_PURPOSE_OPTIONS,
  LARGE_FUNDING_THRESHOLD,
  LOCATIONS,
  CAPITAL_REGIONS,
  isCapitalRegion,
  INDUSTRY_LABEL_MAP,
  PREFERRED_INDUSTRIES,
  isPreferredIndustry,
} from './constants/index';

export type {
  StepInfo,
  FundingStep,
  FundingPurposeOption,
  LocationType,
  IndustryOption as IndustryOptionNew,
} from './constants/index';

// ============================================================================
// Step UI 컴포넌트 export (신규)
// ============================================================================

export {
  StepIndicator,
  StepHeader,
  Accordion,
  StepNavButtons,
  ResultCard,
  SelectField,
  DateInputField,
  NumericField,
  ToggleButtonGroup,
} from './components';

// ============================================================================
// Step UI 훅 export (신규)
// ============================================================================

export {
  useStepForm,
  useStepNav,
  useBusinessCalc,
} from './hooks';

export type { BusinessAge, CompanySize } from './hooks';

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
  EnhancedMatchResult,

  // 고도화된 적격 사유 타입 (3사 통합)
  SafetyZone,
  ImpactLevel,
  ReasonCategory,
  EligibilityReasonItem,
  DetailedEligibilityReason,
  AIJudgment,
  SafetyZoneResult,
  SafetyThresholds,

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

// ============================================================================
// 고도화된 적격 사유 상수 export (3사 통합)
// ============================================================================

export {
  REASON_CATEGORY_LABELS,
  REASON_CATEGORY_ICONS,
  SAFETY_ZONE_DISPLAY,
  IMPACT_LEVEL_DISPLAY,
  DEFAULT_SAFETY_THRESHOLDS,
} from './types';

// ============================================================================
// 고도화된 적격 사유 생성 함수 export
// ============================================================================

export {
  generateDetailedReasons,
  generateBasicConditions,
  generateBonusConditions,
  generateStrategicConditions,
  generateFundingConditions,
  generateAIJudgment,
  calculateSafetyZone,
  calculateBusinessAgeSafetyZone,
} from './eligibility';
