/**
 * lib/policy-fund/last/types.ts
 *
 * /test 페이지 전용 독립 타입 정의
 * 기존 lib/policy-fund/의 타입들을 완전히 복사하여 독립적으로 사용
 */

// ============================================================================
// 기관 및 자금 유형 타입
// ============================================================================

/** 기관 ID */
export type InstitutionId = 'kosmes' | 'kodit' | 'kibo' | 'semas' | 'seoul_credit' | 'gyeonggi_credit' | 'mss' | 'motie' | 'keiti';

/** 자금 유형 */
export type FundType = 'loan' | 'guarantee' | 'grant';

/** 트랙 유형 (점수 비교 그룹) */
export type FundTrack =
  | 'exclusive'      // 전용자격 (인증/법적 지위 기반) - 최우선
  | 'policy_linked'  // 정책연계 (고용·정책 목적) - 우선
  | 'general'        // 일반 정책자금 - 기본
  | 'guarantee';     // 보증/플랜B - 보완

/** 업종 카테고리 */
export type IndustryCategory =
  | 'manufacturing'      // 제조업
  | 'it_service'         // IT/지식서비스업
  | 'wholesale_retail'   // 도소매업
  | 'food_service'       // 음식점업
  | 'construction'       // 건설업
  | 'logistics'          // 운수/물류업
  | 'other_service'      // 기타 서비스업
  | 'all';               // 전 업종

/** 기업 규모 및 기술력 인증 */
export type CompanyScale =
  | 'micro'              // 소공인 (10인 미만 제조업)
  | 'small'              // 소기업 (50인 미만)
  | 'medium'             // 중소기업 (300인 미만)
  | 'venture'            // 벤처기업
  | 'innobiz'            // 이노비즈
  | 'mainbiz'            // 메인비즈
  | 'patent'             // 특허 보유
  | 'research_institute'; // 기업부설연구소

/** 대표자 특성 */
export type OwnerCharacteristic =
  | 'youth'      // 청년 (만 39세 이하)
  | 'female'     // 여성
  | 'disabled'   // 장애인
  | 'veteran'    // 보훈대상자
  | 'general';   // 일반

/** 업력 예외 조건 타입 */
export type BusinessAgeException =
  | 'youth_startup_academy'      // 청년창업사관학교 졸업
  | 'global_startup_academy'     // 글로벌창업사관학교 졸업
  | 'kibo_youth_guarantee'       // 기보 청년창업우대보증 지원
  | 'startup_success_package'    // 창업성공패키지 선정
  | 'tips_program';              // TIPS 프로그램 선정

// ============================================================================
// 매칭 결과 타입
// ============================================================================

export type MatchLevel = 'high' | 'medium' | 'low';

export interface MatchResult {
  score: number;           // 0-100
  level: MatchLevel;       // 높음/보통/낮음
  reasons: string[];       // 적합 사유
  warnings: string[];      // 주의 사항
}

/** 트랙 타입 (영문) */
export type MatchResultTrack = 'exclusive' | 'policy_linked' | 'general' | 'guarantee';

/** 확신도 라벨 */
export type ConfidenceLabel = '전용·우선' | '유력' | '대안' | '플랜B';

/** 트랙 한글 라벨 타입 */
export type TrackLabel = '전용' | '정책연계' | '일반' | '보증';

// ============================================================================
// 3분류 결과 타입 (matched / conditional / excluded)
// ============================================================================

/** MATCHED: 하드룰 충족 + 결정변수 확정 */
export interface MatchedFund {
  program_name: string;
  agency: string;
  track: TrackLabel;
  label: '전용·우선' | '유력' | '대안' | '플랜B';
  confidence?: 'HIGH' | 'MEDIUM';
  why: string;
  hard_rules_passed: string[];
  _score?: number;
  _sizeScore?: number;
  _fundId?: string;
}

/** CONDITIONAL: 하드룰 충족 + 결정변수 미확정 */
export interface ConditionalFund {
  program_name: string;
  agency: string;
  track: TrackLabel;
  what_is_missing: string;
  how_to_confirm: string;
}

/** EXCLUDED: 하드룰 미충족 */
export interface ExcludedFund {
  program_name: string;
  agency: string;
  track: TrackLabel;
  excluded_reason: '트랙차단' | '요건불충족' | '정책목적불일치' | '근거부족' | '기업규모 미충족' | '체납' | '신용문제';
  rule_triggered: string;
  note: string;
}

/** 트랙 결정 정보 */
export interface TrackDecision {
  allowed_tracks: TrackLabel[];
  blocked_tracks: TrackLabel[];
  why: string;
}

/** 3분류 최종 결과 */
export interface ClassifiedMatchResult {
  track_decision: TrackDecision;
  matched: MatchedFund[];
  conditional: ConditionalFund[];
  excluded: ExcludedFund[];
}

// ============================================================================
// 상세 매칭 결과
// ============================================================================

/** 상세 매칭 결과 (불가 사유 포함) */
export interface DetailedMatchResult extends MatchResult {
  fundId: string;
  fundName: string;
  institutionId: string;
  institutionName?: string;
  officialUrl?: string;

  track: MatchResultTrack;
  trackLabel: string;
  scoreExplanation: string;

  rank?: number;
  rankReason?: string;
  confidenceLabel?: ConfidenceLabel;

  isEligible: boolean;
  eligibilityReasons: string[];
  ineligibilityReasons: string[];
  supportDetails?: {
    amount?: string;
    interestRate?: string;
    repaymentPeriod?: string;
  };
}

// ============================================================================
// 기업 프로필 타입
// ============================================================================

/** 기본 기업 프로필 */
export interface CompanyPolicyProfile {
  companyName: string;
  businessNumber?: string;
  companySize: 'startup' | 'small' | 'medium' | 'large';
  businessAge: number;
  industry: string;
  location: string;
  annualRevenue?: number;
  employeeCount?: number;
  hasExportRevenue?: boolean;
  hasRndActivity?: boolean;
  creditRating?: number;
  isSocialEnterprise?: boolean;
  isVentureCompany?: boolean;
  isInnobiz?: boolean;
  isMainbiz?: boolean;
}

/** 확장된 기업 프로필 (상세 조건 매칭용) */
export interface ExtendedCompanyProfile extends CompanyPolicyProfile {
  revenue?: number;
  industryCode?: string;
  industryName?: string;
  region?: string;
  hasTaxDelinquency?: boolean;
  hasPreviousSupport?: boolean;
  isYouthCompany?: boolean;
  hasExistingLoan?: boolean;
  isFemale?: boolean;
  isDisabled?: boolean;
  isDisabledStandard?: boolean;
  creditRating?: number;
  businessAgeExceptions?: BusinessAgeException[];
  hasIpoOrInvestmentPlan?: boolean;
  acceptsEquityDilution?: boolean;
  needsLargeFunding?: boolean;
  requiredFundingAmount?: number;
  requestedFundingPurpose?: 'working' | 'facility' | 'both';
  isRestart?: boolean;
  fundingPurposeDetails?: {
    facilityInvestment?: boolean;
    facilityInstallation?: boolean;
    rndTechUpgrade?: boolean;
    commercialization?: boolean;
    operatingExpenses?: boolean;
    environmentInvestment?: boolean;
  };
  kosmesPreviousCount?: number;
  hasRecentKosmesLoan?: boolean;  // 최근 2년 내 중진공 이용 여부
  currentGuaranteeOrg?: 'none' | 'kodit' | 'kibo' | 'both';
  existingLoanBalance?: number;
  recentYearSubsidyAmount?: number;
  hasPastDefault?: boolean;
  taxDelinquencyStatus?: 'none' | 'active' | 'resolving' | 'installment';
  creditIssueStatus?: 'none' | 'current' | 'past_resolved';
  restartReason?: 'covid' | 'recession' | 'partner_default' | 'disaster' | 'illness' | 'policy' | 'other' | 'unknown';
  hasSmartFactoryPlan?: boolean;
  hasVentureInvestment?: boolean;
  fundingPurposeWorking?: boolean;
  fundingPurposeFacility?: boolean;
  hasEsgInvestmentPlan?: boolean;
  isEmergencySituation?: boolean;
  debtRatio?: number;
  hasPatent?: boolean;
  hasJobCreation?: boolean;
  isGreenEnergyBusiness?: boolean;

  // 제약 조건 (하드컷)
  isInactive?: boolean;                      // 휴·폐업
  isCurrentlyDelinquent?: boolean;           // 금융 연체 (현재 진행 중)
  hasUnresolvedGuaranteeAccident?: boolean;  // 보증사고 미정리
  isPastDefaultResolved?: boolean;           // 과거 부실 정리 완료 여부

  // 제약 조건 (조건부 - conditional)
  hasTaxInstallmentApproval?: boolean;       // 세금 분납 승인 여부
  isCreditRecoveryInProgress?: boolean;      // 신용회복 중
}

/** eligibility-checker용 기업 프로필 */
export interface CompanyProfile {
  companyName: string;
  businessNumber?: string;
  businessAge: number;
  annualRevenue?: number;
  employeeCount?: number;
  industry: IndustryCategory;
  industryDetail?: string;
  region?: string;
  certifications?: CompanyScale[];
  ownerCharacteristics?: OwnerCharacteristic[];
  creditRating?: number;
  hasTaxDelinquency?: boolean;
  hasBankDelinquency?: boolean;
  isInactive?: boolean;
  hasCreditIssue?: boolean;
  hasExportExperience?: boolean;
  hasTechAssets?: boolean;
  isEmergencySituation?: boolean;
  businessAgeExceptions?: BusinessAgeException[];
  requestedFundingPurpose?: 'working' | 'facility' | 'both';
  isRestart?: boolean;
}

// ============================================================================
// 자격 체크 결과 타입
// ============================================================================

/** 개별 조건 체크 결과 */
export interface CheckResult {
  condition: string;
  status: 'pass' | 'fail' | 'warning' | 'bonus' | 'unknown';
  description: string;
  impact: number;
}

/** 자격 체크 결과 */
export interface EligibilityResult {
  fundId: string;
  fundName: string;
  institutionId: string;
  isEligible: boolean;
  eligibilityScore: number;
  passedConditions: CheckResult[];
  failedConditions: CheckResult[];
  warningConditions: CheckResult[];
  bonusConditions: CheckResult[];
  summary: string;
  recommendation: string;
}

// ============================================================================
// Knowledge Base 타입
// ============================================================================

/** 자격 조건 */
export interface EligibilityCriteria {
  businessAge?: {
    min?: number;
    max?: number;
    maxWithException?: number;
    exceptions?: BusinessAgeException[];
    description: string;
  };
  revenue?: {
    min?: number;
    max?: number;
    description: string;
  };
  employeeCount?: {
    min?: number;
    max?: number;
    description: string;
  };
  allowedIndustries?: IndustryCategory[];
  excludedIndustries?: string[];
  allowedRegions?: string[];
  requiredCertifications?: CompanyScale[];
  preferredOwnerTypes?: OwnerCharacteristic[];
  creditRating?: {
    min?: number;
    max?: number;
    description: string;
  };
  additionalRequirements?: string[];
  exclusionConditions?: string[];
  requiresExport?: boolean;
  requiredConditions?: {
    isVentureCompany?: boolean;
    isInnobiz?: boolean;
    hasPatent?: boolean;
    hasResearchInstitute?: boolean;
    hasRndActivity?: boolean;
    hasExportRevenue?: boolean;
    isYouthCompany?: boolean;
    isFemale?: boolean;
    isDisabled?: boolean;
    isDisabledStandard?: boolean;
    isSocialEnterprise?: boolean;
    hasSmartFactoryPlan?: boolean;
    hasEsgInvestmentPlan?: boolean;
    isRestart?: boolean;
    isEmergencySituation?: boolean;
    is4thIndustry?: boolean;
    isCulturalContents?: boolean;
    hasTechnologyCertification?: boolean;
    isDisabledCompany?: boolean;
    isSocialEconomyEnterprise?: boolean;
    hasYouthEmploymentPlan?: boolean;
    isGreenEnergyBusiness?: boolean;
    hasJobCreation?: boolean;
  };
}

/** 지원 조건 */
export interface SupportTerms {
  amount: {
    min?: number;
    max?: number;
    unit: string;
    description: string;
  };
  interestRate?: {
    min?: number;
    max?: number;
    type: 'fixed' | 'variable';
    description: string;
  };
  loanPeriod?: {
    years: number;
    gracePeriod?: number;
    description: string;
  };
  guaranteeRatio?: {
    min?: number;
    max?: number;
    description: string;
  };
  repaymentMethod?: string;
}

/** 자금 용도 */
export interface FundingPurpose {
  working: boolean;
  facility: boolean;
}

/** 정책자금 프로그램 (Knowledge Base) */
export interface PolicyFundKnowledge {
  id: string;
  institutionId: InstitutionId;
  track: FundTrack;
  name: string;
  shortName: string;
  type: FundType;
  description: string;
  fundingPurpose: FundingPurpose;
  eligibility: EligibilityCriteria;
  targetScale?: CompanyScale[];
  terms: SupportTerms;
  practicalInfo: {
    processingTime?: string;
    requiredDocuments?: string[];
    applicationMethod?: string;
    contactInfo?: string;
  };
  riskFactors: string[];
  preferentialConditions?: string[];
  officialUrl?: string;
  meta: {
    lastUpdated: string;
    validFrom?: string;
    validUntil?: string;
    confidence: number;
    notes?: string;
  };
}

/** 기관 정보 */
export interface InstitutionInfo {
  id: InstitutionId;
  name: string;
  fullName: string;
  description: string;
  website: string;
  contactNumber?: string;
}

// ============================================================================
// AI Advisor 타입
// ============================================================================

/** AI 분석 결과 */
export interface AIAdvisorResult {
  fundId: string;
  fundName: string;
  approvalProbability: number;
  priorityRank: number;
  riskLevel: 'low' | 'medium' | 'high';
  strengthPoints: string[];
  weakPoints: string[];
  suggestions: string[];
  alternativeFunds?: string[];
  detailedAnalysis: string;
  actionPlan: string[];
}

/** 전체 포트폴리오 분석 */
export interface PortfolioAnalysis {
  companyName: string;
  totalFundsAnalyzed: number;
  recommendedFunds: AIAdvisorResult[];
  overallStrategy: string;
  priorityActions: string[];
  riskSummary: string;
  estimatedTotalAmount: string;
}

// ============================================================================
// 상수
// ============================================================================

export const TRACK_LABELS: Record<MatchResultTrack, string> = {
  exclusive: '전용자금',
  policy_linked: '정책연계',
  general: '일반',
  guarantee: '보증',
};

export const TRACK_PRIORITY: Record<MatchResultTrack, number> = {
  exclusive: 1,
  policy_linked: 2,
  general: 3,
  guarantee: 4,
};
