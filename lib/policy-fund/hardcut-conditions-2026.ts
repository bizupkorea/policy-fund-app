/**
 * 2026년 정책자금 하드컷 조건 정리 (공식 자료 기반)
 *
 * 출처:
 * - 중진공: 2026년 중소기업 정책자금 융자계획 공고 (제2025-649호)
 * - 소진공: 2026년 소상공인 정책자금 융자사업 공고
 * - 신보: 신용보증기금 공식 홈페이지 (kodit.co.kr)
 * - 기보: 기술보증기금 공식 홈페이지 (kibo.or.kr)
 *
 * 최종 업데이트: 2026-01
 */

// ============================================================================
// 1. 중진공(KOSMES) 정책자금 하드컷 조건
// ============================================================================

export const KOSMES_HARDCUT_CONDITIONS = {
  // 공통 제외 대상
  commonExclusions: {
    // 기업 상태
    closedOrSuspended: true,        // 휴·폐업 기업
    smallBusinessOwner: true,       // 소상공인 (상시근로자 5인 미만, 제조업 10인 미만)
    taxDelinquent: true,            // 세금 체납
    creditDefaulted: true,          // 신용불량/연체

    // 제외 업종
    excludedIndustries: [
      '부동산업',
      '금융업',
      '보험업',
      '유흥주점업',
      '무도유흥주점업',
      '도박업',
      '사행성게임업',
      '숙박업 (관광숙박업 제외)',
    ],
  },

  // 자금별 하드컷 조건
  funds: {
    // 혁신창업사업화자금 - 창업기반지원자금(일반)
    'kosmes-startup-general': {
      name: '혁신창업사업화자금 (일반창업)',
      hardcut: {
        businessAge: { max: 7, description: '업력 7년 미만 (사업개시일 기준)' },
        companySize: ['small', 'medium'], // 중소기업
        targetScale: null, // 소상공인 제외
      },
      exclusive: null, // 전용자격 없음
      required: null,  // 필수조건 없음
    },

    // 혁신창업사업화자금 - 창업기반지원자금(기술창업)
    'kosmes-startup-tech': {
      name: '혁신창업사업화자금 (기술창업)',
      hardcut: {
        businessAge: { max: 7, description: '업력 7년 미만' },
        companySize: ['small', 'medium'],
        targetScale: null,
      },
      exclusive: null,
      required: {
        hasTechnologyCertification: true, // 벤처/이노비즈/특허/연구소 중 1개 이상
        description: '기술력 보유 필수 (벤처기업확인서, 이노비즈인증, 특허권, 기업부설연구소 중 1개)',
      },
    },

    // 혁신창업사업화자금 - 청년전용창업자금
    'kosmes-startup-youth': {
      name: '혁신창업사업화자금 (청년전용)',
      hardcut: {
        businessAge: { max: 3, description: '업력 3년 미만 (예외: 창업사관학교 등 추천 시 7년 미만)' },
        companySize: ['small', 'medium'],
        targetScale: null,
        ownerAge: { max: 39, description: '대표자 만 39세 이하' },
      },
      exclusive: {
        isYouthCompany: true, // 청년기업 전용
      },
      required: null,
    },

    // 신시장진출지원자금 - 내수기업수출기업화
    'kosmes-new-market-domestic': {
      name: '신시장진출지원자금 (내수기업 수출기업화)',
      hardcut: {
        businessAge: null, // 업력 제한 없음
        companySize: ['small', 'medium'],
        targetScale: null,
      },
      exclusive: null,
      required: {
        hasExportPlan: true, // 수출 계획 필수 (수출실적 10만불 미만)
        description: '수출실적 10만불 미만 기업의 수출 진출 계획',
      },
    },

    // 신시장진출지원자금 - 수출기업글로벌화
    'kosmes-new-market-global': {
      name: '신시장진출지원자금 (수출기업 글로벌화)',
      hardcut: {
        businessAge: null,
        companySize: ['small', 'medium'],
        targetScale: null,
      },
      exclusive: null,
      required: {
        hasExportRevenue: true, // 수출실적 필수 (10만불 이상)
        description: '수출실적 10만불 이상 보유',
      },
    },

    // 신성장기반자금 - 혁신성장지원자금
    'kosmes-new-growth': {
      name: '신성장기반자금',
      hardcut: {
        businessAge: { min: 7, description: '업력 7년 이상 (창업기업 제외)' },
        companySize: ['small', 'medium'],
        targetScale: null,
      },
      exclusive: null,
      required: null,
    },

    // 재도약지원자금 - 재창업자금
    'kosmes-restart': {
      name: '재도약지원자금 (재창업)',
      hardcut: {
        businessAge: null,
        companySize: ['small', 'medium'],
        targetScale: null,
      },
      exclusive: {
        isRestart: true, // 재창업기업 전용
      },
      required: {
        restartReason: ['covid', 'recession', 'partner_default', 'disaster', 'illness', 'policy'],
        description: '정당한 재창업 사유 필요 (코로나, 경기침체, 거래처 부도, 재해, 질병, 정책변화 등)',
      },
    },

    // 긴급경영안정자금
    'kosmes-emergency': {
      name: '긴급경영안정자금',
      hardcut: {
        businessAge: null,
        companySize: ['small', 'medium'],
        targetScale: null,
      },
      exclusive: null,
      required: {
        isEmergencySituation: true,
        description: '경영위기 상황 필수 (재해·재난 피해, 매출 급감 20% 이상, 구조조정 등)',
      },
    },

    // 스마트공장지원자금
    'kosmes-smart-factory': {
      name: '스마트공장지원자금',
      hardcut: {
        businessAge: null,
        companySize: ['small', 'medium'],
        targetScale: null,
        allowedIndustries: ['manufacturing'], // 제조업만
      },
      exclusive: null,
      required: {
        hasSmartFactoryPlan: true,
        description: '스마트공장 구축 계획 또는 참여 기업',
      },
    },

    // 탄소중립시설자금
    'kosmes-carbon-neutral': {
      name: '탄소중립시설자금',
      hardcut: {
        businessAge: null,
        companySize: ['small', 'medium'],
        targetScale: null,
      },
      exclusive: null,
      required: {
        hasEsgInvestmentPlan: true,
        description: '탄소중립 전환 설비 투자 계획 필수',
      },
    },

    // 사회적기업전용자금
    'kosmes-social-enterprise': {
      name: '사회적기업전용자금',
      hardcut: {
        businessAge: null,
        companySize: ['small', 'medium'],
        targetScale: null,
      },
      exclusive: {
        isSocialEconomyEnterprise: true,
        description: '사회적기업/예비사회적기업/사회적협동조합/자활기업/마을기업 인증',
      },
      required: null,
    },
  },
};

// ============================================================================
// 2. 소진공(SEMAS) 정책자금 하드컷 조건
// ============================================================================

export const SEMAS_HARDCUT_CONDITIONS = {
  // 공통 대상: 소상공인만
  commonRequirements: {
    // 소상공인 기준 (필수)
    targetScale: ['micro'], // 소상공인/소공인만
    employeeCount: {
      general: { max: 5, description: '상시근로자 5인 미만 (일반업종)' },
      manufacturing: { max: 10, description: '상시근로자 10인 미만 (제조업, 건설업, 운수업, 광업)' },
    },
  },

  // 공통 제외 대상
  commonExclusions: {
    closedOrSuspended: true,
    taxDelinquent: true,
    creditDefaulted: true,
    excludedIndustries: [
      '부동산업',
      '금융업',
      '보험업',
      '일반유흥주점업 (관광특구 제외)',
      '무도유흥주점업 (관광특구 제외)',
      '도박업',
      '사행성게임업',
      '담배도매업',
      '성인용품소매업',
    ],
  },

  // 자금별 하드컷 조건
  funds: {
    // 일반경영안정자금
    'semas-general': {
      name: '일반경영안정자금',
      hardcut: {
        targetScale: ['micro'], // 소상공인 필수
        businessAge: null,
      },
      exclusive: null,
      required: null,
    },

    // 특별경영안정자금
    'semas-special': {
      name: '특별경영안정자금',
      hardcut: {
        targetScale: ['micro'],
        businessAge: null,
      },
      exclusive: {
        isVulnerable: true,
        description: '취약계층 소상공인 (여성, 장애인, 고령자, 다문화 등)',
      },
      required: null,
    },

    // 긴급경영안정자금
    'semas-emergency': {
      name: '긴급경영안정자금',
      hardcut: {
        targetScale: ['micro'],
        businessAge: null,
      },
      exclusive: null,
      required: {
        isEmergencySituation: true,
        description: '재해·재난, 매출급감 등 경영위기 상황',
      },
    },

    // 성장기반자금
    'semas-growth': {
      name: '성장기반자금',
      hardcut: {
        targetScale: ['micro'],
        businessAge: { min: 1, description: '업력 1년 이상' },
      },
      exclusive: null,
      required: {
        hasGrowthPlan: true,
        description: '성장 계획 보유 (시설투자, 고용확대 등)',
      },
    },

    // 장애인기업지원자금
    'semas-disabled': {
      name: '장애인기업지원자금',
      hardcut: {
        targetScale: null, // 장애인기업은 소상공인 제한 없음
        businessAge: null,
      },
      exclusive: {
        isDisabledCompany: true,
        description: '장애인 대표자 또는 장애인표준사업장',
      },
      required: null,
    },

    // 청년고용연계자금
    'semas-youth-employment': {
      name: '청년고용연계자금',
      hardcut: {
        targetScale: ['micro'],
        businessAge: null,
      },
      exclusive: null,
      required: {
        hasYouthEmploymentPlan: true,
        description: '청년(만 39세 이하) 신규 채용 계획 또는 실적',
      },
    },

    // 재도전특별자금
    'semas-restart': {
      name: '재도전특별자금',
      hardcut: {
        targetScale: ['micro'],
        businessAge: null,
      },
      exclusive: {
        isRestart: true,
        description: '재창업 소상공인',
      },
      required: null,
    },

    // 소공인특화자금
    'semas-micro-manufacturing': {
      name: '소공인특화자금',
      hardcut: {
        targetScale: ['micro'],
        businessAge: null,
        allowedIndustries: ['manufacturing'], // 제조업만
        employeeCount: { max: 10, description: '상시근로자 10인 미만 제조업' },
      },
      exclusive: null,
      required: null,
    },
  },
};

// ============================================================================
// 3. 신보(KODIT) 보증 하드컷 조건
// ============================================================================

export const KODIT_HARDCUT_CONDITIONS = {
  // 공통 제외 대상
  commonExclusions: {
    taxDelinquent: true,
    creditDefaulted: true,
    guaranteeDefaulted: true, // 보증사고 이력
    excludedIndustries: [
      '부동산임대업',
      '부동산매매업',
      '유흥주점업',
      '무도유흥주점업',
      '도박업',
      '사행성게임업',
      '담배소매업 일부',
      '금융업 일부',
    ],
  },

  // 상품별 하드컷 조건
  products: {
    // 일반보증
    'kodit-general': {
      name: '일반보증',
      hardcut: {
        creditRating: { max: 6, description: '신용등급 6등급 이상' },
        companySize: ['micro', 'small', 'medium'],
      },
      exclusive: null,
      required: null,
    },

    // 창업기업보증
    'kodit-startup': {
      name: '창업기업보증',
      hardcut: {
        businessAge: { max: 5, description: '창업 5년 이내' },
        companySize: ['micro', 'small', 'medium'],
      },
      exclusive: null,
      required: null,
    },

    // 혁신성장보증
    'kodit-innovation-growth': {
      name: '혁신성장보증',
      hardcut: {
        companySize: ['micro', 'small', 'medium'],
      },
      exclusive: null,
      required: {
        is4thIndustry: true,
        description: '4차산업혁명 관련 업종 (AI, 빅데이터, IoT 등)',
      },
    },

    // 일자리창출보증
    'kodit-job-creation': {
      name: '일자리창출보증',
      hardcut: {
        companySize: ['micro', 'small', 'medium'],
      },
      exclusive: null,
      required: {
        hasJobCreation: true,
        description: '최근 1년 내 고용 증가 또는 고용 확대 계획',
      },
    },

    // 여성기업우대보증
    'kodit-female': {
      name: '여성기업우대보증',
      hardcut: {
        companySize: ['micro', 'small', 'medium'],
      },
      exclusive: {
        isFemale: true,
        description: '여성 대표자 기업',
      },
      required: null,
    },

    // 수출기업보증
    'kodit-export': {
      name: '수출기업보증',
      hardcut: {
        companySize: ['micro', 'small', 'medium'],
      },
      exclusive: null,
      required: {
        hasExportRevenue: true,
        description: '수출 실적 또는 수출 계획',
      },
    },

    // 청년희망드림보증
    'kodit-youth-dream': {
      name: '청년희망드림보증',
      hardcut: {
        businessAge: { max: 7, description: '창업 7년 이내' },
        ownerAge: { min: 17, max: 39, description: '대표자 만 17~39세' },
        companySize: ['micro', 'small', 'medium'],
      },
      exclusive: {
        isYouthCompany: true,
        description: '청년 대표자 기업',
      },
      required: null,
    },

    // 청년창업특례보증
    'kodit-youth-startup-special': {
      name: '청년창업특례보증',
      hardcut: {
        businessAge: { max: 3, description: '예비창업자 또는 창업 3년 이내' },
        ownerAge: { max: 39, description: '대표자 만 39세 이하' },
        companySize: ['micro', 'small', 'medium'],
      },
      exclusive: {
        isYouthCompany: true,
      },
      required: null,
    },

    // 재도약보증
    'kodit-restart': {
      name: '재도약보증',
      hardcut: {
        companySize: ['micro', 'small', 'medium'],
      },
      exclusive: {
        isRestart: true,
        description: '재창업 기업 또는 경영위기 극복 기업',
      },
      required: null,
    },

    // 소셜벤처보증
    'kodit-social-venture': {
      name: '소셜벤처보증',
      hardcut: {
        companySize: ['micro', 'small', 'medium'],
      },
      exclusive: {
        isSocialEconomyEnterprise: true,
        description: '사회적기업/예비사회적기업/소셜벤처',
      },
      required: null,
    },

    // 녹색전환보증
    'kodit-green-new-deal': {
      name: '녹색전환보증',
      hardcut: {
        companySize: ['micro', 'small', 'medium'],
      },
      exclusive: null,
      required: {
        hasEsgInvestmentPlan: true,
        description: '탄소중립 전환 투자 계획',
      },
    },
  },
};

// ============================================================================
// 4. 기보(KIBO) 보증 하드컷 조건
// ============================================================================

export const KIBO_HARDCUT_CONDITIONS = {
  // 공통 대상: 기술력 보유 기업
  commonRequirements: {
    hasTechnology: true, // 기술 기반 기업 (제조업, IT, 바이오 등)
    companySize: {
      employeeCount: { max: 1000, description: '상시근로자 1,000인 이하' },
      totalAssets: { max: 100000000000, description: '총자산 1,000억원 이하' },
    },
  },

  // 공통 제외 대상
  commonExclusions: {
    taxDelinquent: true,
    creditDefaulted: true,
    guaranteeDefaulted: true,
    excludedIndustries: [
      '부동산업',
      '금융업',
      '유흥업',
      '단순 유통업 (기술력 없음)',
      '음식점업 (기술력 없음)',
    ],
  },

  // 상품별 하드컷 조건
  products: {
    // 창업기업보증
    'kibo-startup': {
      name: '창업기업보증',
      hardcut: {
        businessAge: { max: 7, description: '창업 7년 이내' },
        revenue: { max: 100000000000, description: '매출 1,000억원 이하' },
      },
      exclusive: null,
      required: null,
    },

    // 기술평가보증
    'kibo-tech-evaluation': {
      name: '기술평가보증',
      hardcut: {},
      exclusive: null,
      required: {
        hasTechnologyCertification: true,
        description: '기술력 보유 필수 (특허, 기술인력, 기술사업성 평가 통과)',
      },
    },

    // 혁신스타트업보증
    'kibo-venture-startup': {
      name: '혁신스타트업보증',
      hardcut: {
        businessAge: { max: 10, description: '창업 10년 이내' },
      },
      exclusive: null,
      required: {
        isVentureCompany: true,
        description: '벤처기업 또는 이노비즈 인증',
      },
    },

    // IP담보보증
    'kibo-ip-collateral': {
      name: 'IP담보보증',
      hardcut: {},
      exclusive: null,
      required: {
        hasPatent: true,
        description: '특허권, 실용신안권 등 지식재산권 보유',
      },
    },

    // R&D보증
    'kibo-rnd': {
      name: 'R&D보증',
      hardcut: {},
      exclusive: null,
      required: {
        hasRndActivity: true,
        description: '연구개발 투자 실적 또는 기업부설연구소/연구개발전담부서 보유',
      },
    },

    // 문화콘텐츠보증
    'kibo-cultural-contents': {
      name: '문화콘텐츠보증',
      hardcut: {
        allowedIndustries: ['it_service'], // 문화콘텐츠 관련 업종
      },
      exclusive: null,
      required: {
        isCulturalContents: true,
        description: '문화콘텐츠 제작/유통 기업 (게임, 영상, 음악, 공연, 출판 등)',
      },
    },

    // 예비창업자보증
    'kibo-pre-startup': {
      name: '예비창업자보증',
      hardcut: {
        businessAge: { max: 0, description: '법인 설립 전 예비창업자' },
      },
      exclusive: null,
      required: {
        hasTechStartupPlan: true,
        description: '기술 기반 창업 계획',
      },
    },

    // 청년테크스타보증
    'kibo-youth-techstar': {
      name: '청년테크스타보증',
      hardcut: {
        businessAge: { max: 7, description: '창업 7년 이내' },
        ownerAge: { max: 39, description: '대표자 만 39세 이하' },
      },
      exclusive: {
        isYouthCompany: true,
        description: '청년 대표자 + 기술력 보유',
      },
      required: {
        hasTechnologyCertification: true,
      },
    },

    // 유니콘기업보증
    'kibo-unicorn': {
      name: '유니콘기업보증',
      hardcut: {
        techRating: { min: 'B', description: '기술사업평가등급 B등급 이상' },
      },
      exclusive: null,
      required: {
        enterpriseValue: { min: 100000000000, description: '기업가치 1,000억원 이상' },
        isVentureCompany: true,
      },
    },

    // 소셜벤처보증
    'kibo-social-venture': {
      name: '소셜벤처보증',
      hardcut: {},
      exclusive: {
        isSocialEconomyEnterprise: true,
        description: '사회적기업/예비사회적기업/소셜벤처',
      },
      required: null,
    },

    // 녹색전환보증
    'kibo-green-transition': {
      name: '녹색전환보증',
      hardcut: {},
      exclusive: null,
      required: {
        hasEsgInvestmentPlan: true,
        description: '녹색 공정·설비·기술 투자 계획',
      },
    },

    // 신재생에너지보증
    'kibo-green-energy': {
      name: '신재생에너지보증',
      hardcut: {
        allowedIndustries: ['renewable_energy'], // 신재생에너지 분야
      },
      exclusive: null,
      required: {
        isRenewableEnergy: true,
        description: '신재생에너지 발전 또는 관련 산업',
      },
    },

    // 굿잡보증
    'kibo-good-job': {
      name: '굿잡보증',
      hardcut: {},
      exclusive: null,
      required: {
        hasJobCreation: true,
        description: '최근 1년 내 고용 증가 또는 고용 확대 계획',
      },
    },

    // 신성장분야보증
    'kibo-new-growth': {
      name: '신성장분야보증',
      hardcut: {},
      exclusive: null,
      required: {
        hasTechnologyCertification: true,
        is4thIndustry: true,
        description: '4차산업혁명 분야 기술 보유 (AI, IoT, 빅데이터, 블록체인 등)',
      },
    },

    // 원클릭보증
    'kibo-one-click': {
      name: '원클릭보증',
      hardcut: {
        businessAge: { min: 1, description: '업력 1년 이상' },
      },
      exclusive: null,
      required: null, // 온라인 신청 가능한 일반 기업
    },
  },
};

// ============================================================================
// 5. 공통 제외 업종 (전 기관 공통)
// ============================================================================

export const COMMON_EXCLUDED_INDUSTRIES = [
  // 도박·사행성
  '도박업',
  '사행성게임장',
  '복권발행 및 판매업',

  // 유흥·향락
  '일반유흥주점업',
  '무도유흥주점업',
  '성인용품소매',
  '무도장운영업',

  // 부동산 투기
  '부동산 개발 및 공급업',
  '부동산 임대업 (일부)',
  '부동산 중개업',

  // 금융
  '은행업',
  '금융투자업',
  '보험업',
  '여신금융업',

  // 담배
  '담배제조업',
  '담배도매업',
];

// ============================================================================
// 6. 전용자격 (Exclusive Track) 정리
// ============================================================================

export const EXCLUSIVE_QUALIFICATIONS = {
  // 청년기업
  isYouthCompany: {
    condition: '대표자 만 39세 이하',
    applicableFunds: [
      'kosmes-startup-youth',
      'kodit-youth-dream',
      'kodit-youth-startup-special',
      'kibo-youth-techstar',
    ],
  },

  // 여성기업
  isFemale: {
    condition: '여성 대표자',
    applicableFunds: [
      'kodit-female',
      'semas-female',
    ],
  },

  // 장애인기업
  isDisabledCompany: {
    condition: '장애인 대표자 또는 장애인표준사업장',
    applicableFunds: [
      'semas-disabled',
    ],
  },

  // 재창업기업
  isRestart: {
    condition: '폐업 후 재창업 또는 사업전환',
    applicableFunds: [
      'kosmes-restart',
      'semas-restart',
      'kodit-restart',
    ],
  },

  // 사회적경제기업
  isSocialEconomyEnterprise: {
    condition: '사회적기업/예비사회적기업/사회적협동조합/자활기업/마을기업',
    applicableFunds: [
      'kosmes-social-enterprise',
      'kodit-social-venture',
      'kibo-social-venture',
    ],
  },

  // 벤처기업
  isVentureCompany: {
    condition: '벤처기업확인서 보유',
    applicableFunds: [
      'kibo-venture-startup',
      'kibo-unicorn',
    ],
  },
};

// ============================================================================
// 7. 필수조건 (Required Conditions) 정리
// ============================================================================

export const REQUIRED_CONDITIONS = {
  // 기술력 필수
  hasTechnologyCertification: {
    condition: '벤처기업/이노비즈/특허/기업부설연구소 중 1개 이상',
    applicableFunds: [
      'kosmes-startup-tech',
      'kibo-tech-evaluation',
      'kibo-youth-techstar',
      'kibo-new-growth',
    ],
  },

  // 수출실적 필수
  hasExportRevenue: {
    condition: '수출실적 보유',
    applicableFunds: [
      'kosmes-new-market-global',
      'kodit-export',
    ],
  },

  // R&D 활동 필수
  hasRndActivity: {
    condition: '연구개발 투자 또는 연구소 보유',
    applicableFunds: [
      'kibo-rnd',
    ],
  },

  // 특허 보유 필수
  hasPatent: {
    condition: '특허권/실용신안권 보유',
    applicableFunds: [
      'kibo-ip-collateral',
    ],
  },

  // 긴급상황 필수
  isEmergencySituation: {
    condition: '재해/재난/매출급감/구조조정 등 경영위기',
    applicableFunds: [
      'kosmes-emergency',
      'semas-emergency',
    ],
  },

  // 스마트공장 계획 필수
  hasSmartFactoryPlan: {
    condition: '스마트공장 구축 계획',
    applicableFunds: [
      'kosmes-smart-factory',
    ],
  },

  // ESG 투자 계획 필수
  hasEsgInvestmentPlan: {
    condition: '탄소중립/녹색전환 투자 계획',
    applicableFunds: [
      'kosmes-carbon-neutral',
      'kodit-green-new-deal',
      'kibo-green-transition',
    ],
  },

  // 고용 창출 계획 필수
  hasJobCreation: {
    condition: '최근 1년 내 고용 증가 또는 확대 계획',
    applicableFunds: [
      'kodit-job-creation',
      'kibo-good-job',
    ],
  },
};
