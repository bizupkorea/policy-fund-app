/**
 * lib/policy-fund/last/ui-types.ts
 *
 * /test 페이지 전용 UI 타입 정의
 * TestProfile, PresetScenario 등 UI 컴포넌트에서 사용하는 타입
 */

// ============================================================================
// 업종 타입
// ============================================================================

export type IndustryType =
  | 'manufacturing_general'    // 제조업 (일반)
  | 'manufacturing_root'       // 제조업 (뿌리/소부장) - 정부 우대
  | 'it_software'              // IT/정보통신 (SW)
  | 'it_hardware'              // IT/정보통신 (HW)
  | 'knowledge_service'        // 지식서비스업
  | 'bio_healthcare'           // 바이오/헬스케어
  | 'future_mobility'          // 미래차/로봇/드론
  | 'culture_content'          // 문화/콘텐츠
  | 'construction_energy'      // 건설/환경/에너지
  | 'wholesale_retail'         // 도소매/유통
  | 'tourism_food'             // 관광/숙박/음식
  | 'other_service';           // 기타 서비스업

// ============================================================================
// 보증기관 타입
// ============================================================================

export type GuaranteeOrg = 'none' | 'kodit' | 'kibo' | 'both';

// ============================================================================
// 테스트 프로필 타입
// ============================================================================

export interface TestProfile {
  // 기본 정보
  companyName: string;
  industry: IndustryType;
  location: string;
  establishedYear: number;

  // 재무 정보
  annualRevenue: number; // 억원
  employeeCount: number;
  debtRatio: number;

  // 인증 정보
  isVenture: boolean;
  isInnobiz: boolean;
  isMainbiz: boolean;
  hasPatent: boolean;
  hasResearchInstitute: boolean;
  hasExportRecord: boolean;

  // 대표자 정보
  ceoAge: number;
  isFemale: boolean;
  isDisabled: boolean;
  isDisabledStandard: boolean; // 장애인표준사업장
  isSocialEnterprise: boolean; // 사회적기업 인증
  isPreSocialEnterprise: boolean; // 예비사회적기업
  isSocialCooperative: boolean; // 사회적협동조합
  isSelfSupportEnterprise: boolean; // 자활기업
  isVillageEnterprise: boolean; // 마을기업

  // 제약 조건
  hasTaxDelinquency: boolean;
  existingLoanBalance: number; // 억원
  isRestart: boolean; // 재창업 여부

  // 정책자금 이용 이력
  kosmesPreviousCount: number;  // 중진공 누적 이용 횟수 (졸업제 체크)
  currentGuaranteeOrg: GuaranteeOrg;  // 현재 이용 중인 보증기관
  recentYearSubsidyAmount: number;  // 최근 1년 정책자금 수혜액 (억원)
  hasPastDefault: boolean;  // 과거 부실/사고 이력

  // 업력 예외 조건 (청년전용창업자금 업력 7년 확대)
  isYouthStartupAcademyGrad: boolean; // 청년창업사관학교 졸업
  isGlobalStartupAcademyGrad: boolean; // 글로벌창업사관학교 졸업
  hasKiboYouthGuarantee: boolean; // 기보 청년창업우대보증 지원

  // 특수 자금 계획
  hasSmartFactoryPlan: boolean;     // 스마트공장 구축/고도화 계획
  hasEsgInvestmentPlan: boolean;    // ESG/탄소중립 시설투자 계획
  isEmergencySituation: boolean;    // 경영위기/긴급상황

  // 성장 전략 및 투자 계획
  hasIpoOrInvestmentPlan: boolean;  // IPO/투자유치 계획
  hasVentureInvestment: boolean;    // 벤처투자 유치 실적
  acceptsEquityDilution: boolean;   // 지분 희석 감수 가능
  needsLargeFunding: boolean;       // 대규모 자금 필요 (5억+)
  requiredFundingAmount: number;    // 필요 자금 (억원)
  fundingPurposeWorking: boolean;   // 운전자금
  fundingPurposeFacility: boolean;  // 시설자금
}

// ============================================================================
// 프리셋 시나리오 타입
// ============================================================================

export interface PresetScenario {
  id: string;
  name: string;
  description: string;
  emoji: string;
  profile: TestProfile;
}

// ============================================================================
// 빈 프로필 초기값
// ============================================================================

export const EMPTY_PROFILE: TestProfile = {
  companyName: '',
  industry: 'manufacturing_general',
  location: '서울',
  establishedYear: new Date().getFullYear(),
  annualRevenue: 0,
  employeeCount: 0,
  debtRatio: 0,
  isVenture: false,
  isInnobiz: false,
  isMainbiz: false,
  hasPatent: false,
  hasResearchInstitute: false,
  hasExportRecord: false,
  ceoAge: 40,
  isFemale: false,
  isDisabled: false,
  isDisabledStandard: false,
  isSocialEnterprise: false,
  isPreSocialEnterprise: false,
  isSocialCooperative: false,
  isSelfSupportEnterprise: false,
  isVillageEnterprise: false,
  hasTaxDelinquency: false,
  existingLoanBalance: 0,
  isRestart: false,
  kosmesPreviousCount: 0,
  currentGuaranteeOrg: 'none',
  recentYearSubsidyAmount: 0,
  hasPastDefault: false,
  isYouthStartupAcademyGrad: false,
  isGlobalStartupAcademyGrad: false,
  hasKiboYouthGuarantee: false,
  hasSmartFactoryPlan: false,
  hasEsgInvestmentPlan: false,
  isEmergencySituation: false,
  hasIpoOrInvestmentPlan: false,
  hasVentureInvestment: false,
  acceptsEquityDilution: false,
  needsLargeFunding: false,
  requiredFundingAmount: 0,
  fundingPurposeWorking: false,
  fundingPurposeFacility: false,
};
