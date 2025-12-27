/**
 * Policy Fund (정책자금) Types
 * 기업마당 API + 크롤링 기반 정책자금 매칭 관련 타입 정의
 */

/**
 * 정책자금 카테고리
 */
export type PolicyFundCategory =
  | 'loan'            // 융자
  | 'guarantee'       // 보증
  | 'grant'           // 보조금
  | 'investment'      // 투자
  | 'consulting'      // 컨설팅
  | 'certification'   // 인증
  | 'export'          // 수출지원
  | 'rnd'             // R&D지원
  | 'employment'      // 고용지원
  | 'other';          // 기타

/**
 * 기업마당 API 응답 (기본 정보)
 */
export interface BizInfoApiResponse {
  resultCode: string;
  resultMsg: string;
  totalCount: number;
  items: BizInfoApiItem[];
}

/**
 * 기업마당 API 사업 항목
 */
export interface BizInfoApiItem {
  pbancSn: string;              // 공고 일련번호
  bizPbancNm: string;           // 사업공고명
  excInsttNm: string;           // 수행기관명
  jrsdInsttNm: string;          // 주관기관명
  reqstBeginEndDe: string;      // 신청기간 (시작-종료)
  bizPbancUrl: string;          // 상세페이지 URL
  pldirSportCn?: string;        // 지원내용
  trgetNm?: string;             // 지원대상
}

/**
 * 크롤링으로 가져올 상세 정보
 */
export interface PolicyFundDetail {
  // 지원 금액
  supportAmount?: {
    min?: number;
    max?: number;
    unit: string;               // 예: '억원', '만원'
    description: string;        // 원문 텍스트
  };

  // 지원 조건
  supportConditions: string[];

  // 금리 정보
  interestRate?: {
    min?: number;
    max?: number;
    description: string;
  };

  // 상환 조건
  repaymentTerms?: {
    period: string;             // 예: '5년'
    gracePeriod?: string;       // 거치기간
    description: string;
  };

  // 신청 자격
  eligibility: string[];

  // 제외 대상
  exclusions: string[];

  // 필요 서류
  requiredDocuments: string[];

  // 심사 기준
  evaluationCriteria: string[];

  // 연락처
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };

  // 크롤링 메타데이터
  crawledAt: Date;
  crawlSuccess: boolean;
}

/**
 * 정책자금 프로그램 (API + 크롤링 결합)
 */
export interface PolicyFundProgram {
  // 기본 정보 (API)
  id: string;                   // pbancSn
  name: string;                 // bizPbancNm
  category: PolicyFundCategory;
  executingAgency: string;      // excInsttNm
  supervisingAgency: string;    // jrsdInsttNm
  applicationPeriod: string;    // reqstBeginEndDe
  detailUrl: string;            // bizPbancUrl
  supportSummary?: string;      // pldirSportCn
  targetSummary?: string;       // trgetNm
  publishedAt?: string;         // 공고 등록일
  isNew?: boolean;              // 오늘 신규 공고 여부

  // 상세 정보 (크롤링)
  detail?: PolicyFundDetail;

  // 매칭 정보
  matchScore?: number;          // 매칭 점수 (0-100)
  matchReasons?: string[];      // 매칭 사유
  unmatchReasons?: string[];    // 비매칭 사유

  // 목업 데이터 여부
  isMockData?: boolean;         // true면 데모 데이터임을 표시
}

/**
 * 기업 프로필 (정책자금 매칭용)
 */
export interface CompanyPolicyProfile {
  // 기본 정보
  companyName: string;
  businessNumber?: string;      // 사업자번호
  companySize: 'startup' | 'small' | 'medium' | 'large';
  businessAge: number;          // 업력 (년)
  industry: string;             // 업종
  location: string;             // 소재지

  // 재무 정보
  annualRevenue?: number;       // 연매출
  employeeCount?: number;       // 직원 수
  hasExportRevenue?: boolean;   // 수출실적 유무
  hasRndActivity?: boolean;     // R&D 활동 유무

  // 신용 정보
  creditRating?: string;        // 신용등급

  // 특수 조건
  isSocialEnterprise?: boolean; // 사회적기업
  isVentureCompany?: boolean;   // 벤처기업
  isInnobiz?: boolean;          // 이노비즈
  isMainbiz?: boolean;          // 메인비즈
}

/**
 * 정책자금 검색 조건
 */
export interface PolicyFundSearchParams {
  // 키워드 검색
  keyword?: string;

  // 필터
  category?: PolicyFundCategory;
  targetRegion?: string;        // 지역
  targetIndustry?: string;      // 업종
  targetCompanySize?: string;   // 기업 규모

  // 페이지네이션
  page?: number;
  pageSize?: number;

  // 정렬
  sortBy?: 'deadline' | 'amount' | 'match';
}

/**
 * 정책자금 분석 결과
 */
export interface PolicyFundAnalysis {
  // 매칭 프로그램 목록
  programs: PolicyFundProgram[];

  // 요약 통계
  summary: {
    totalPrograms: number;
    highMatchPrograms: number;  // 70점 이상
    mediumMatchPrograms: number; // 40-69점
    deadlineThisMonth: number;  // 이번 달 마감
  };

  // 우선순위 프로그램 (상위 5개)
  prioritizedPrograms: PolicyFundProgram[];

  // 카테고리별 분포
  categoryDistribution: Record<PolicyFundCategory, number>;

  // 권장사항
  recommendations: string[];

  // 분석 메타데이터
  metadata: {
    analyzedAt: Date;
    companyProfile: CompanyPolicyProfile;
    searchParams: PolicyFundSearchParams;
    dataSource: 'api' | 'api+crawl';
  };
}

/**
 * 카테고리별 메타 정보
 */
export const POLICY_FUND_CATEGORY_INFO: Record<PolicyFundCategory, {
  name: string;
  description: string;
  icon: string;
  color: string;
}> = {
  'loan': {
    name: '융자',
    description: '정부/공공기관 융자 지원',
    icon: '💳',
    color: 'blue',
  },
  'guarantee': {
    name: '보증',
    description: '신용보증, 기술보증 등',
    icon: '🛡️',
    color: 'green',
  },
  'grant': {
    name: '보조금',
    description: '무상 지원금',
    icon: '💰',
    color: 'yellow',
  },
  'investment': {
    name: '투자',
    description: '정책펀드 투자',
    icon: '📈',
    color: 'purple',
  },
  'consulting': {
    name: '컨설팅',
    description: '경영/기술 컨설팅 지원',
    icon: '📋',
    color: 'indigo',
  },
  'certification': {
    name: '인증',
    description: '인증 취득 지원',
    icon: '🏆',
    color: 'orange',
  },
  'export': {
    name: '수출지원',
    description: '수출 관련 지원',
    icon: '🚢',
    color: 'cyan',
  },
  'rnd': {
    name: 'R&D지원',
    description: '연구개발 지원',
    icon: '🔬',
    color: 'pink',
  },
  'employment': {
    name: '고용지원',
    description: '인력 채용/교육 지원',
    icon: '👥',
    color: 'teal',
  },
  'other': {
    name: '기타',
    description: '기타 지원사업',
    icon: '📦',
    color: 'gray',
  },
};

/**
 * 기업 규모 라벨
 */
export const COMPANY_SIZE_LABELS: Record<CompanyPolicyProfile['companySize'], string> = {
  'startup': '창업기업 (7년 이하)',
  'small': '소기업 (50인 미만)',
  'medium': '중소기업 (300인 미만)',
  'large': '중견/대기업',
};
