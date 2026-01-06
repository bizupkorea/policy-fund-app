/**
 * 정책자금 제도 지식 베이스 (Knowledge Base)
 *
 * 4대 기관(중진공, 신보, 기보, 소진공)의 핵심 정책자금 정보를 구조화
 * - 공고에 의존하지 않고 제도 자체의 자격 요건/조건을 기반으로 판단
 * - 추후 Supabase로 마이그레이션 가능한 구조
 *
 * 업데이트 주기: 매년 1~2월 정책 개편 시
 * 최종 업데이트: 2026.01 (2026년도 정책자금 기준)
 */

// ============================================================================
// 타입 정의 (Supabase 스키마와 호환)
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

/** 자격 조건 */
export interface EligibilityCriteria {
  // 업력 조건
  businessAge?: {
    min?: number;  // 최소 업력 (년)
    max?: number;  // 최대 업력 (년)
    maxWithException?: number;  // 예외 적용 시 최대 업력 (년)
    exceptions?: BusinessAgeException[];  // 적용 가능한 예외 조건
    description: string;
  };

  // 매출 조건
  revenue?: {
    min?: number;  // 최소 매출 (원)
    max?: number;  // 최대 매출 (원)
    description: string;
  };

  // 직원 수 조건
  employeeCount?: {
    min?: number;
    max?: number;
    description: string;
  };

  // 허용 업종
  allowedIndustries?: IndustryCategory[];

  // 제외 업종
  excludedIndustries?: string[];

  // 허용 지역
  allowedRegions?: string[];

  // 기업 규모/인증 조건
  requiredCertifications?: CompanyScale[];

  // 대표자 특성 우대
  preferredOwnerTypes?: OwnerCharacteristic[];

  // 신용등급 조건
  creditRating?: {
    min?: number;  // 최소 등급 (1~10, 낮을수록 좋음)
    max?: number;
    description: string;
  };

  // 기타 필수 조건
  additionalRequirements?: string[];

  // 제외 조건 (이 조건에 해당하면 불가)
  exclusionConditions?: string[];

  // 수출실적 요구 여부
  requiresExport?: boolean;

  // ========================================
  // 필수 조건 (조건 불충족 시 자동 제외)
  // ========================================
  // 프로필의 boolean 필드와 매핑됨
  // 예: { hasExportRevenue: true } → 수출실적 없으면 제외
  requiredConditions?: {
    // 인증/자격 관련
    isVentureCompany?: boolean;      // 벤처기업 인증 필수
    isInnobiz?: boolean;             // 이노비즈 인증 필수
    hasPatent?: boolean;             // 특허 보유 필수
    hasResearchInstitute?: boolean;  // 기업부설연구소 필수
    hasRndActivity?: boolean;        // R&D 활동 필수

    // 수출 관련
    hasExportRevenue?: boolean;      // 수출실적 필수

    // 대표자 특성
    isYouthCompany?: boolean;        // 청년기업 (만 39세 이하)
    isFemale?: boolean;              // 여성기업
    isDisabled?: boolean;            // 장애인 대표자
    isDisabledStandard?: boolean;    // 장애인표준사업장
    isSocialEnterprise?: boolean;    // 사회적기업

    // 특수 계획
    hasSmartFactoryPlan?: boolean;   // 스마트공장 계획
    hasEsgInvestmentPlan?: boolean;  // ESG 투자 계획
    isRestart?: boolean;             // 재창업기업

    // 기타
    isEmergencySituation?: boolean;  // 긴급경영 상황

    // 특수 업종/분야
    is4thIndustry?: boolean;         // 4차산업혁명 분야 (AI, IoT, 빅데이터 등)
    isCulturalContents?: boolean;    // 문화콘텐츠 기업 (게임, 영상, 음악 등)

    // ========================================
    // 복합 조건 (매칭엔진에서 OR 로직 처리)
    // ========================================
    // 기술력: 벤처/이노비즈/특허/연구소 중 1개 이상
    hasTechnologyCertification?: boolean;
    // 장애인기업: isDisabled || isDisabledStandard
    isDisabledCompany?: boolean;
    // 사회적경제기업: 사회적기업/예비/사회적협동조합/자활기업/마을기업/장애인표준사업장
    isSocialEconomyEnterprise?: boolean;
    // 청년고용계획: 청년 채용 예정
    hasYouthEmploymentPlan?: boolean;
  };
}

/** 지원 조건 */
export interface SupportTerms {
  // 지원 금액
  amount: {
    min?: number;
    max?: number;
    unit: string;  // '억원', '만원'
    description: string;
  };

  // 금리
  interestRate?: {
    min?: number;
    max?: number;
    type: 'fixed' | 'variable';
    description: string;
  };

  // 대출 기간
  loanPeriod?: {
    years: number;
    gracePeriod?: number;  // 거치 기간 (년)
    description: string;
  };

  // 보증 비율 (보증 상품인 경우)
  guaranteeRatio?: {
    min?: number;
    max?: number;
    description: string;
  };

  // 상환 방식
  repaymentMethod?: string;
}

/** 자금 용도 */
export interface FundingPurpose {
  working: boolean;   // 운전자금 지원 여부
  facility: boolean;  // 시설자금 지원 여부
}

/** 정책자금 프로그램 */
export interface PolicyFundKnowledge {
  // 식별자
  id: string;
  institutionId: InstitutionId;

  // 트랙 (점수 비교 그룹)
  // exclusive: 전용자격 자금 (장애인/여성/재창업 등 인증 기반)
  // policy_linked: 정책연계 자금 (고용/수출/스마트공장 등 정책 목적)
  // general: 일반 정책자금 (창업/경영안정 등)
  // guarantee: 보증 자금 (플랜B)
  track: FundTrack;

  // 기본 정보
  name: string;
  shortName: string;  // 줄임말
  type: FundType;
  description: string;

  // 자금 용도 (운전/시설)
  fundingPurpose: FundingPurpose;

  // 자격 조건
  eligibility: EligibilityCriteria;

  // ★ 대상 기업규모 (하드컷용)
  // 이 규모에 해당하지 않으면 EXCLUDED
  targetScale?: CompanyScale[];
  // 예: ['micro'] → 소공인만
  // 예: ['small', 'medium'] → 소기업, 중기업
  // 예: undefined → 제한 없음 (기본: 모든 중소기업)

  // 지원 조건
  terms: SupportTerms;

  // 실무 정보
  practicalInfo: {
    processingTime?: string;     // 처리 기간
    requiredDocuments?: string[]; // 필요 서류
    applicationMethod?: string;  // 신청 방법
    contactInfo?: string;        // 문의처
  };

  // 리스크 요소
  riskFactors: string[];

  // 우대 조건
  preferentialConditions?: string[];

  // 공식 URL
  officialUrl?: string;

  // 메타데이터
  meta: {
    lastUpdated: string;     // 마지막 업데이트
    validFrom?: string;      // 유효 시작일
    validUntil?: string;     // 유효 종료일 (없으면 상시)
    confidence: number;      // 정보 신뢰도 (0~1)
    notes?: string;          // 비고
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
// 기관 정보
// ============================================================================

export const INSTITUTIONS: Record<InstitutionId, InstitutionInfo> = {
  kosmes: {
    id: 'kosmes',
    name: '중진공',
    fullName: '중소벤처기업진흥공단',
    description: '중소기업 정책자금 융자 전문 기관',
    website: 'https://www.kosmes.or.kr',
    contactNumber: '1357',
  },
  kodit: {
    id: 'kodit',
    name: '신보',
    fullName: '신용보증기금',
    description: '담보력 부족 기업에 신용보증 제공',
    website: 'https://www.kodit.co.kr',
    contactNumber: '1588-6565',
  },
  kibo: {
    id: 'kibo',
    name: '기보',
    fullName: '기술보증기금',
    description: '기술력 기반 신용보증 제공',
    website: 'https://www.kibo.or.kr',
    contactNumber: '1544-1120',
  },
  semas: {
    id: 'semas',
    name: '소진공',
    fullName: '소상공인시장진흥공단',
    description: '소상공인 정책자금 융자 전문 기관',
    website: 'https://www.semas.or.kr',
    contactNumber: '1357',
  },
  seoul_credit: {
    id: 'seoul_credit',
    name: '서울신보',
    fullName: '서울신용보증재단',
    description: '서울 소재 소기업·소상공인 신용보증',
    website: 'https://www.seoulshinbo.co.kr',
    contactNumber: '1577-6119',
  },
  gyeonggi_credit: {
    id: 'gyeonggi_credit',
    name: '경기신보',
    fullName: '경기신용보증재단',
    description: '경기도 소재 소기업·소상공인 신용보증',
    website: 'https://www.gcgf.or.kr',
    contactNumber: '1588-7365',
  },
  mss: {
    id: 'mss',
    name: '중기부',
    fullName: '중소벤처기업부',
    description: '중소기업 정책 총괄 부처',
    website: 'https://www.mss.go.kr',
    contactNumber: '1357',
  },
  motie: {
    id: 'motie',
    name: '산업부',
    fullName: '산업통상자원부',
    description: '산업기술 R&D 지원 부처',
    website: 'https://www.motie.go.kr',
    contactNumber: '1577-0900',
  },
  keiti: {
    id: 'keiti',
    name: '환경산업기술원',
    fullName: '한국환경산업기술원',
    description: '환경부 산하 환경산업 지원기관',
    website: 'https://www.keiti.re.kr',
    contactNumber: '02-2284-1114',
  },
};

// ============================================================================
// 핵심 정책자금 (2026년 기준)
// 기관별 자금 데이터는 funds/ 폴더로 분리됨
// ============================================================================

import { kosmesFunds } from './funds/kosmes-funds';
import { semasFunds } from './funds/semas-funds';
import { koditFunds } from './funds/kodit-funds';
import { kiboFunds } from './funds/kibo-funds';

// 모든 기관의 자금을 통합
export const POLICY_FUND_KNOWLEDGE_BASE: PolicyFundKnowledge[] = [
  ...kosmesFunds,
  ...semasFunds,
  ...koditFunds,
  ...kiboFunds,
];
// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * 기관별 자금 목록 조회
 */
export function getFundsByInstitution(institutionId: InstitutionId): PolicyFundKnowledge[] {
  return POLICY_FUND_KNOWLEDGE_BASE.filter(fund => fund.institutionId === institutionId);
}

/**
 * 자금 유형별 목록 조회
 */
export function getFundsByType(type: FundType): PolicyFundKnowledge[] {
  return POLICY_FUND_KNOWLEDGE_BASE.filter(fund => fund.type === type);
}

/**
 * ID로 자금 조회
 */
export function getFundById(id: string): PolicyFundKnowledge | undefined {
  return POLICY_FUND_KNOWLEDGE_BASE.find(fund => fund.id === id);
}

/**
 * 모든 자금 목록 조회
 */
export function getAllFunds(): PolicyFundKnowledge[] {
  return POLICY_FUND_KNOWLEDGE_BASE;
}

/**
 * 기관 정보 조회
 */
export function getInstitutionInfo(id: InstitutionId): InstitutionInfo {
  return INSTITUTIONS[id];
}
