/**
 * lib/policy-fund/last/matcher/config/fund-categories.ts
 *
 * 자금 카테고리 및 ID 중앙화
 * - 특수목적자금, 혁신성장자금, ESG/녹색자금 등 분류
 * - 키워드 매핑
 */

// ============================================================================
// 자금 카테고리 정의
// ============================================================================

export const FUND_CATEGORIES = {
  /** 특수목적자금 (다양성 필터 예외) */
  specialPurpose: [
    'kosmes-smart-factory',      // 스마트공장자금
    'kosmes-investment-loan',    // 투융자복합금융
    'kosmes-carbon-neutral',     // 탄소중립자금
    'kosmes-emergency',          // 긴급경영안정자금
  ],

  /** 혁신성장 자금 (벤처투자 유치 기업 우선) */
  innovation: [
    'kosmes-investment-loan',    // 투융자복합금융
    'kodit-innovation-growth',   // 혁신성장보증
    'kodit-innovation-icon',     // 혁신아이콘보증
    'kibo-innovation-startup',   // 혁신스타트업보증
    'kibo-unicorn',              // 유니콘보증
  ],

  /** ESG/녹색 자금 */
  green: [
    'kosmes-carbon-neutral',     // 탄소중립자금
    'kodit-green-new-deal',      // 그린뉴딜보증
    'kibo-green-transition',     // 녹색전환보증
    'kibo-green-energy',         // 신재생에너지보증
  ],

  /** 신재생에너지 전용 (하드컷 대상) */
  greenEnergy: [
    'kibo-green-energy',         // 신재생에너지보증
  ],

  /** 환경 자금 */
  environment: [
    'keiti-env-growth',          // 환경산업육성자금
    'keiti-env-facility',        // 환경시설설치자금
  ],

  /** 재도전 자금 */
  restart: [
    'kosmes-restart',            // 재도전자금
    'semas-restart',             // 소상공인 재기지원자금
  ],

  /** 긴급경영안정 자금 */
  emergency: [
    'kosmes-emergency',          // 긴급경영안정자금
    'semas-emergency',           // 소상공인 긴급경영안정자금
  ],

  /** 스마트공장 자금 */
  smartFactory: [
    'kosmes-smart-factory',      // 스마트공장자금
  ],

  /** 일자리 창출 자금 */
  jobCreation: [
    'kodit-job-creation',        // 일자리창출보증
    'kibo-good-job',             // 굿잡보증
  ],

  /** 사회적가치 기업 자금 */
  socialValue: [
    'kosmes-social-enterprise',  // 사회적기업전용자금
    'semas-disabled',            // 장애인기업지원자금
    'kibo-social-venture',       // 소셜벤처보증
    'kodit-social-venture',      // 소셜벤처보증
  ],

  /** 대규모 자금 (유동화/투융자) */
  largeFunding: [
    'kodit-securitization',      // 유동화회사보증(P-CBO)
    'kosmes-investment-loan',    // 투융자복합금융
  ],
} as const;

// ============================================================================
// 키워드 매핑 (자금명 기반 판별용)
// ============================================================================

export const FUND_KEYWORDS = {
  /** 재도전/재창업 자금 판별 키워드 */
  restart: ['재도전', '재창업', '재기', '재도약'],

  /** 스마트공장 자금 판별 키워드 */
  smartFactory: ['스마트공장', '스마트팩토리'],

  /** ESG/탄소중립 자금 판별 키워드 */
  esg: ['녹색전환', '탄소중립', 'ESG', '친환경'],

  /** 신재생에너지 자금 판별 키워드 */
  greenEnergy: ['신재생', '태양광', '풍력', '수소', '에너지'],

  /** 긴급경영 자금 판별 키워드 */
  emergency: ['긴급', '경영안정', '위기'],

  /** 일자리 창출 자금 판별 키워드 */
  jobCreation: ['일자리', '고용', '굿잡'],

  /** 사회적가치 자금 판별 키워드 */
  socialValue: ['사회적', '장애인', '소셜벤처'],

  /** 혁신성장 자금 판별 키워드 */
  innovation: ['혁신', '스케일업', '투자', '유니콘', '아이콘'],

  /** 소상공인 자금 판별 키워드 */
  micro: ['소공인', '소상공인'],
} as const;

// ============================================================================
// 기관 정의
// ============================================================================

/** 직접대출 기관 (중진공, 소진공) */
export const DIRECT_LOAN_INSTITUTIONS = ['kosmes', 'semas'] as const;

/** 보증 기관 (신보, 기보) */
export const GUARANTEE_INSTITUTIONS = ['kodit', 'kibo'] as const;

/** 기관 라벨 */
export const INSTITUTION_LABELS: Record<string, string> = {
  kosmes: '중진공 직접대출',
  semas: '소진공 직접대출',
  kodit: '신용보증기금 보증',
  kibo: '기술보증기금 보증',
};

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * 자금이 특정 카테고리에 속하는지 확인
 */
export function isFundInCategory(
  fundId: string,
  category: keyof typeof FUND_CATEGORIES
): boolean {
  const categoryFunds = FUND_CATEGORIES[category] as readonly string[];
  return categoryFunds.includes(fundId);
}

/**
 * 자금명이 특정 키워드를 포함하는지 확인
 */
export function matchesKeywords(
  fundName: string,
  category: keyof typeof FUND_KEYWORDS
): boolean {
  return FUND_KEYWORDS[category].some(kw => fundName.includes(kw));
}

/**
 * 재도전 자금 여부 확인 (ID + 키워드)
 */
export function isRestartFund(fundId: string, fundName: string): boolean {
  return (
    isFundInCategory(fundId, 'restart') ||
    fundId.includes('restart') ||
    matchesKeywords(fundName, 'restart')
  );
}

/**
 * 혁신성장 자금 여부 확인 (ID + 키워드)
 */
export function isInnovationFund(fundId: string, fundName: string): boolean {
  return (
    isFundInCategory(fundId, 'innovation') ||
    matchesKeywords(fundName, 'innovation')
  );
}

/**
 * 직접대출 기관 여부 확인
 */
export function isDirectLoanInstitution(institutionId: string): boolean {
  return DIRECT_LOAN_INSTITUTIONS.includes(institutionId as any);
}

/**
 * 보증 기관 여부 확인
 */
export function isGuaranteeInstitution(institutionId: string): boolean {
  return GUARANTEE_INSTITUTIONS.includes(institutionId as any);
}
