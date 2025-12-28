/**
 * 정책자금 제도 지식 베이스 (Knowledge Base)
 *
 * 4대 기관(중진공, 신보, 기보, 소진공)의 핵심 정책자금 정보를 구조화
 * - 공고에 의존하지 않고 제도 자체의 자격 요건/조건을 기반으로 판단
 * - 추후 Supabase로 마이그레이션 가능한 구조
 *
 * 업데이트 주기: 매년 1~2월 정책 개편 시
 * 최종 업데이트: 2025.01 (2025년도 정책자금 기준)
 */

// ============================================================================
// 타입 정의 (Supabase 스키마와 호환)
// ============================================================================

/** 기관 ID */
export type InstitutionId = 'kosmes' | 'kodit' | 'kibo' | 'semas' | 'seoul_credit' | 'gyeonggi_credit' | 'mss' | 'motie';

/** 자금 유형 */
export type FundType = 'loan' | 'guarantee' | 'grant';

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

/** 기업 규모 */
export type CompanyScale =
  | 'micro'      // 소공인 (10인 미만 제조업)
  | 'small'      // 소기업 (50인 미만)
  | 'medium'     // 중소기업 (300인 미만)
  | 'venture'    // 벤처기업
  | 'innobiz'    // 이노비즈
  | 'mainbiz';   // 메인비즈

/** 대표자 특성 */
export type OwnerCharacteristic =
  | 'youth'      // 청년 (만 39세 이하)
  | 'female'     // 여성
  | 'disabled'   // 장애인
  | 'veteran'    // 보훈대상자
  | 'general';   // 일반

/** 자격 조건 */
export interface EligibilityCriteria {
  // 업력 조건
  businessAge?: {
    min?: number;  // 최소 업력 (년)
    max?: number;  // 최대 업력 (년)
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

/** 정책자금 프로그램 */
export interface PolicyFundKnowledge {
  // 식별자
  id: string;
  institutionId: InstitutionId;

  // 기본 정보
  name: string;
  shortName: string;  // 줄임말
  type: FundType;
  description: string;

  // 자격 조건
  eligibility: EligibilityCriteria;

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
};

// ============================================================================
// 핵심 정책자금 10개 (2025년 기준)
// ============================================================================

export const POLICY_FUND_KNOWLEDGE_BASE: PolicyFundKnowledge[] = [
  // ========== 중진공 (3개) ==========
  {
    id: 'kosmes-innovation-startup',
    institutionId: 'kosmes',
    name: '혁신창업사업화자금',
    shortName: '혁신창업',
    type: 'loan',
    description: '창업 초기 기업의 사업화를 위한 시설·운전자금 지원',

    eligibility: {
      businessAge: {
        max: 7,
        description: '창업 7년 이내 중소기업',
      },
      revenue: {
        max: 12000000000,  // 120억
        description: '연매출 120억원 이하',
      },
      allowedIndustries: ['manufacturing', 'it_service', 'other_service'],
      excludedIndustries: ['부동산업', '유흥업', '금융업'],
      additionalRequirements: [
        '사업성 및 기술성 보유',
        '신용관리정보 미등록',
      ],
      exclusionConditions: [
        '휴·폐업 중인 기업',
        '세금 체납 중인 기업',
        '금융기관 연체 중인 기업',
      ],
    },

    terms: {
      amount: {
        max: 6000000000,  // 60억
        unit: '억원',
        description: '기업당 연간 60억원 이내',
      },
      interestRate: {
        min: 2.0,
        max: 3.5,
        type: 'variable',
        description: '정책자금 기준금리 + 가산금리 (연 2.0~3.5%)',
      },
      loanPeriod: {
        years: 5,
        gracePeriod: 2,
        description: '5년 이내 (거치 2년 포함)',
      },
      repaymentMethod: '거치 후 원금균등분할상환',
    },

    practicalInfo: {
      processingTime: '접수 후 약 2~4주',
      requiredDocuments: [
        '사업계획서',
        '재무제표 (최근 3개년)',
        '사업자등록증',
        '법인등기부등본',
      ],
      applicationMethod: '중진공 온라인 신청 (www.kosmes.or.kr)',
      contactInfo: '중진공 콜센터 1357',
    },

    riskFactors: [
      '최근 매출 감소 시 심사 불리',
      '창업 후 실적 부족 시 한도 축소 가능',
      '재무제표 정리 필수',
    ],

    preferentialConditions: [
      '청년창업기업 금리 0.3%p 우대',
      '여성기업 금리 우대',
      '벤처·이노비즈 인증기업 우대',
    ],

    officialUrl: 'https://www.kosmes.or.kr/sbc/SH/SBI/SHSBI001M0.do',

    meta: {
      lastUpdated: '2025-01',
      validFrom: '2025-01-01',
      confidence: 0.9,
      notes: '2025년도 정책자금 기준',
    },
  },

  {
    id: 'kosmes-new-market',
    institutionId: 'kosmes',
    name: '신시장진출지원자금',
    shortName: '신시장진출',
    type: 'loan',
    description: '수출, 내수 확대, 신사업 진출 기업 지원',

    eligibility: {
      businessAge: {
        min: 1,
        description: '업력 1년 이상',
      },
      revenue: {
        max: 12000000000,
        description: '연매출 120억원 이하',
      },
      allowedIndustries: ['all'],
      additionalRequirements: [
        '수출실적 보유 또는 수출계획 수립 기업',
        '신규 사업 진출 계획 보유',
      ],
      exclusionConditions: [
        '휴·폐업 중인 기업',
        '세금 체납',
        '금융기관 연체',
      ],
    },

    terms: {
      amount: {
        max: 6000000000,
        unit: '억원',
        description: '기업당 연간 60억원 이내',
      },
      interestRate: {
        min: 2.0,
        max: 3.5,
        type: 'variable',
        description: '연 2.0~3.5%',
      },
      loanPeriod: {
        years: 5,
        gracePeriod: 2,
        description: '5년 (거치 2년)',
      },
    },

    practicalInfo: {
      processingTime: '약 2~4주',
      applicationMethod: '중진공 온라인 신청',
    },

    riskFactors: [
      '수출 실적 증빙 필요',
      '신사업 계획의 구체성 필요',
    ],

    meta: {
      lastUpdated: '2025-01',
      confidence: 0.85,
    },
  },

  {
    id: 'kosmes-emergency',
    institutionId: 'kosmes',
    name: '긴급경영안정자금',
    shortName: '긴급경영',
    type: 'loan',
    description: '경영 위기 상황의 중소기업 긴급 지원',

    eligibility: {
      additionalRequirements: [
        '재해·재난 피해 기업',
        '매출 급감 기업 (전년 대비 20% 이상)',
        '구조조정 기업',
      ],
      exclusionConditions: [
        '휴·폐업',
        '세금 체납',
        '금융기관 연체 90일 초과',
      ],
    },

    terms: {
      amount: {
        max: 1000000000,  // 10억
        unit: '억원',
        description: '기업당 10억원 이내',
      },
      interestRate: {
        min: 1.5,
        max: 2.5,
        type: 'fixed',
        description: '연 1.5~2.5% (긴급 지원 우대금리)',
      },
      loanPeriod: {
        years: 5,
        gracePeriod: 2,
        description: '5년 (거치 2년)',
      },
    },

    practicalInfo: {
      processingTime: '긴급 처리 (1~2주)',
    },

    riskFactors: [
      '피해 증빙 서류 필수',
      '매출 감소 객관적 증빙 필요',
    ],

    meta: {
      lastUpdated: '2025-01',
      confidence: 0.8,
      notes: '재해/재난 시 수시 접수',
    },
  },

  // ========== 신용보증기금 (2개) ==========
  {
    id: 'kodit-general',
    institutionId: 'kodit',
    name: '일반보증',
    shortName: '신보 일반',
    type: 'guarantee',
    description: '담보력 부족 중소기업에 신용보증서 발급',

    eligibility: {
      creditRating: {
        max: 6,
        description: '신용등급 6등급 이상',
      },
      allowedIndustries: ['all'],
      excludedIndustries: ['부동산임대업', '유흥주점업'],
      exclusionConditions: [
        '세금 체납',
        '금융기관 연체',
        '신용관리정보 등록',
        '휴·폐업',
      ],
    },

    terms: {
      amount: {
        max: 3000000000,  // 30억
        unit: '억원',
        description: '기업당 30억원 이내',
      },
      guaranteeRatio: {
        min: 70,
        max: 100,
        description: '보증비율 70~100%',
      },
    },

    practicalInfo: {
      processingTime: '약 1~2주',
      applicationMethod: '신보 영업점 방문 또는 온라인',
      contactInfo: '1588-6565',
    },

    riskFactors: [
      '신용등급에 따라 보증 한도 차등',
      '보증료 연 0.5~2.0% 발생',
    ],

    preferentialConditions: [
      '청년·여성 기업 보증료 감면',
      '벤처기업 우대',
    ],

    officialUrl: 'https://www.kodit.co.kr',

    meta: {
      lastUpdated: '2025-01',
      confidence: 0.9,
    },
  },

  {
    id: 'kodit-startup',
    institutionId: 'kodit',
    name: '창업기업보증',
    shortName: '신보 창업',
    type: 'guarantee',
    description: '창업 초기 기업 전용 신용보증',

    eligibility: {
      businessAge: {
        max: 5,
        description: '창업 5년 이내',
      },
      excludedIndustries: ['부동산임대업', '유흥주점업'],
    },

    terms: {
      amount: {
        max: 500000000,  // 5억
        unit: '억원',
        description: '기업당 5억원 이내',
      },
      guaranteeRatio: {
        min: 85,
        max: 100,
        description: '보증비율 85~100% (창업 우대)',
      },
    },

    practicalInfo: {
      processingTime: '약 1주',
      requiredDocuments: [
        '사업계획서',
        '사업자등록증',
        '대표자 신용정보동의서',
      ],
    },

    riskFactors: [
      '창업 후 실적 부족 시 한도 제한',
      '대표자 신용등급 중요',
    ],

    preferentialConditions: [
      '청년창업자 보증료 0.2%p 감면',
      '기술창업 우대',
    ],

    meta: {
      lastUpdated: '2025-01',
      confidence: 0.85,
    },
  },

  // ========== 기술보증기금 (2개) ==========
  {
    id: 'kibo-tech-evaluation',
    institutionId: 'kibo',
    name: '기술평가보증',
    shortName: '기보 기술평가',
    type: 'guarantee',
    description: '기술력 보유 기업에 기술평가 기반 보증',

    eligibility: {
      additionalRequirements: [
        '기술력 보유 (특허, 기술인력 등)',
        '기술사업성 평가 통과',
      ],
      excludedIndustries: ['부동산업', '금융업'],
    },

    terms: {
      amount: {
        max: 5000000000,  // 50억
        unit: '억원',
        description: '기업당 50억원 이내',
      },
      guaranteeRatio: {
        min: 85,
        max: 100,
        description: '보증비율 85~100%',
      },
    },

    practicalInfo: {
      processingTime: '기술평가 포함 2~3주',
      requiredDocuments: [
        '기술관련 서류 (특허, 인증서 등)',
        '사업계획서',
        '재무제표',
      ],
    },

    riskFactors: [
      '기술평가 등급에 따라 한도 차등',
      '기술성 입증 서류 준비 필요',
    ],

    preferentialConditions: [
      '우수기술 TCB등급 기업 우대',
      'IP(지식재산) 보유기업 우대',
    ],

    officialUrl: 'https://www.kibo.or.kr',

    meta: {
      lastUpdated: '2025-01',
      confidence: 0.9,
    },
  },

  {
    id: 'kibo-venture-startup',
    institutionId: 'kibo',
    name: '혁신스타트업보증',
    shortName: '기보 스타트업',
    type: 'guarantee',
    description: '벤처·이노비즈 인증 기업 전용 보증',

    eligibility: {
      requiredCertifications: ['venture', 'innobiz'],
      businessAge: {
        max: 10,
        description: '창업 10년 이내',
      },
    },

    terms: {
      amount: {
        max: 3000000000,  // 30억
        unit: '억원',
        description: '기업당 30억원 이내',
      },
      guaranteeRatio: {
        min: 90,
        max: 100,
        description: '보증비율 90~100%',
      },
    },

    practicalInfo: {
      processingTime: '1~2주 (신속 심사)',
      requiredDocuments: [
        '벤처/이노비즈 인증서',
        '재무제표',
        '사업자등록증',
      ],
    },

    riskFactors: [
      '벤처/이노비즈 인증 유효기간 확인',
      '인증 만료 시 일반보증 전환',
    ],

    preferentialConditions: [
      '보증료 50% 감면',
      '신속 심사',
    ],

    meta: {
      lastUpdated: '2025-01',
      confidence: 0.85,
    },
  },

  // ========== 소상공인시장진흥공단 (3개) ==========
  {
    id: 'semas-micro-enterprise',
    institutionId: 'semas',
    name: '소공인특화자금',
    shortName: '소공인',
    type: 'loan',
    description: '상시근로자 10인 미만 제조업체 전용',

    eligibility: {
      employeeCount: {
        max: 10,
        description: '상시근로자 10인 미만',
      },
      allowedIndustries: ['manufacturing'],
      additionalRequirements: [
        '제조업 영위',
        '소공인 해당 업종',
      ],
    },

    terms: {
      amount: {
        max: 100000000,  // 1억
        unit: '만원',
        description: '기업당 1억원 이내',
      },
      interestRate: {
        min: 2.0,
        max: 3.0,
        type: 'fixed',
        description: '연 2.0~3.0%',
      },
      loanPeriod: {
        years: 5,
        gracePeriod: 2,
        description: '5년 (거치 2년)',
      },
    },

    practicalInfo: {
      applicationMethod: '소진공 지역센터 방문',
    },

    riskFactors: [
      '제조업 업종 증빙 필요',
      '근로자 수 기준 엄격',
    ],

    meta: {
      lastUpdated: '2025-01',
      confidence: 0.85,
    },
  },

  {
    id: 'semas-growth',
    institutionId: 'semas',
    name: '성장촉진자금',
    shortName: '성장촉진',
    type: 'loan',
    description: '성장 단계 소상공인 지원',

    eligibility: {
      employeeCount: {
        max: 10,
        description: '상시근로자 10인 미만 (제조업 외)',
      },
      additionalRequirements: [
        '소상공인 해당',
        '성장 가능성 보유',
      ],
    },

    terms: {
      amount: {
        max: 100000000,
        unit: '만원',
        description: '기업당 1억원 이내',
      },
      interestRate: {
        min: 2.5,
        max: 3.5,
        type: 'variable',
        description: '연 2.5~3.5%',
      },
      loanPeriod: {
        years: 5,
        gracePeriod: 2,
        description: '5년 (거치 2년)',
      },
    },

    practicalInfo: {
      processingTime: '2~3주',
      requiredDocuments: [
        '사업자등록증',
        '재무제표',
        '매출 증빙',
      ],
    },

    riskFactors: [
      '소상공인 기준 충족 필수',
      '매출 기준 확인 필요',
    ],

    meta: {
      lastUpdated: '2025-01',
      confidence: 0.8,
    },
  },

  {
    id: 'semas-emergency',
    institutionId: 'semas',
    name: '긴급자금',
    shortName: '소진공 긴급',
    type: 'loan',
    description: '재해·경영위기 소상공인 긴급 지원',

    eligibility: {
      additionalRequirements: [
        '재해 피해 소상공인',
        '경영위기 소상공인',
      ],
    },

    terms: {
      amount: {
        max: 50000000,  // 5천만원
        unit: '만원',
        description: '기업당 5천만원 이내',
      },
      interestRate: {
        min: 1.5,
        max: 2.0,
        type: 'fixed',
        description: '연 1.5~2.0% (긴급 우대)',
      },
      loanPeriod: {
        years: 5,
        gracePeriod: 2,
        description: '5년 (거치 2년)',
      },
    },

    practicalInfo: {
      processingTime: '긴급 처리 (1주 이내)',
    },

    riskFactors: [
      '피해 증빙 필수',
      '지원 한도 제한적',
    ],

    meta: {
      lastUpdated: '2025-01',
      confidence: 0.8,
      notes: '재해 시 수시 접수',
    },
  },

  // ========== 중진공 추가 (5개) ==========
  {
    id: 'kosmes-investment-loan',
    institutionId: 'kosmes',
    name: '투융자복합금융',
    shortName: '투융자복합',
    type: 'loan',
    description: '투자유치 기업에 투자금액 연계 융자 지원',

    eligibility: {
      businessAge: {
        min: 3,
        description: '업력 3년 이상',
      },
      revenue: {
        min: 3000000000,  // 30억
        description: '연매출 30억원 이상',
      },
      additionalRequirements: [
        '최근 2년 내 벤처투자 유치 기업',
        '투자금액 대비 일정 비율 융자',
      ],
      exclusionConditions: [
        '휴·폐업',
        '세금 체납',
        '금융기관 연체',
      ],
    },

    terms: {
      amount: {
        min: 1000000000,  // 10억
        max: 10000000000,  // 100억
        unit: '억원',
        description: '기업당 10~100억원 (투자금액 연동)',
      },
      interestRate: {
        min: 1.5,
        max: 2.5,
        type: 'variable',
        description: '연 1.5~2.5% (우대금리)',
      },
      loanPeriod: {
        years: 8,
        gracePeriod: 3,
        description: '8년 (거치 3년)',
      },
    },

    practicalInfo: {
      processingTime: '약 4~6주 (투자 검증 포함)',
      requiredDocuments: [
        '투자계약서',
        '주주명부',
        '재무제표',
        '사업계획서',
      ],
    },

    riskFactors: [
      '투자 검증 필수',
      '대규모 자금으로 심사 기간 길음',
    ],

    preferentialConditions: [
      '시리즈B 이상 투자유치 기업 우대',
      '기술특례 상장 추진 기업 우대',
    ],

    meta: {
      lastUpdated: '2025-01',
      confidence: 0.85,
      notes: '스케일업 기업 대상 대형 자금',
    },
  },

  {
    id: 'kosmes-restart',
    institutionId: 'kosmes',
    name: '재창업자금',
    shortName: '재창업',
    type: 'loan',
    description: '실패 경험 재창업자 사업화 지원',

    eligibility: {
      businessAge: {
        max: 7,
        description: '재창업 7년 이내',
      },
      additionalRequirements: [
        '과거 폐업 경험 보유',
        '재창업 사업자',
        '성실실패 인정 또는 회생절차 완료',
      ],
      exclusionConditions: [
        '악의적 폐업 이력',
        '금융사기 전력',
      ],
    },

    terms: {
      amount: {
        max: 5000000000,  // 50억
        unit: '억원',
        description: '기업당 50억원 이내',
      },
      interestRate: {
        min: 2.0,
        max: 3.0,
        type: 'variable',
        description: '연 2.0~3.0%',
      },
      loanPeriod: {
        years: 5,
        gracePeriod: 2,
        description: '5년 (거치 2년)',
      },
    },

    practicalInfo: {
      processingTime: '약 2~3주',
      requiredDocuments: [
        '폐업사실증명원',
        '재창업 사업계획서',
        '신용회복 증빙',
      ],
    },

    riskFactors: [
      '과거 폐업 사유 심사',
      '신용등급 제약 있을 수 있음',
    ],

    preferentialConditions: [
      '재도전성공패키지 참여기업 우대',
      '청년 재창업자 금리 우대',
    ],

    meta: {
      lastUpdated: '2025-01',
      confidence: 0.8,
      notes: '재기 지원 정책',
    },
  },

  {
    id: 'kosmes-smart-factory',
    institutionId: 'kosmes',
    name: '스마트공장지원자금',
    shortName: '스마트공장',
    type: 'loan',
    description: '스마트공장 구축·고도화 시설자금 지원',

    eligibility: {
      allowedIndustries: ['manufacturing'],
      additionalRequirements: [
        '스마트공장 구축 또는 고도화 계획',
        '제조업 영위',
        '스마트공장 보급사업 참여 우대',
      ],
      exclusionConditions: [
        '휴·폐업',
        '세금 체납',
      ],
    },

    terms: {
      amount: {
        max: 6000000000,  // 60억
        unit: '억원',
        description: '기업당 60억원 이내',
      },
      interestRate: {
        min: 1.5,
        max: 2.5,
        type: 'variable',
        description: '연 1.5~2.5% (시설자금 우대)',
      },
      loanPeriod: {
        years: 10,
        gracePeriod: 4,
        description: '10년 (거치 4년)',
      },
    },

    practicalInfo: {
      processingTime: '약 3~4주',
      requiredDocuments: [
        '스마트공장 구축 계획서',
        '견적서/투자계획',
        '재무제표',
      ],
    },

    riskFactors: [
      '시설투자 계획 구체성 필요',
      '스마트공장 수준 진단 필요',
    ],

    preferentialConditions: [
      '스마트공장 보급사업 선정기업 금리 우대',
      '뿌리산업 기업 우대',
    ],

    meta: {
      lastUpdated: '2025-01',
      confidence: 0.85,
      notes: '제조업 디지털화 지원',
    },
  },

  {
    id: 'kosmes-green-growth',
    institutionId: 'kosmes',
    name: '탄소중립시설자금',
    shortName: '탄소중립',
    type: 'loan',
    description: 'ESG·탄소중립 관련 시설투자 지원',

    eligibility: {
      additionalRequirements: [
        '탄소저감 시설 투자 계획',
        'ESG 경영 도입 기업',
        '환경 관련 인증 보유 우대',
      ],
      exclusionConditions: [
        '환경법 위반 기업',
        '휴·폐업',
      ],
    },

    terms: {
      amount: {
        max: 6000000000,  // 60억
        unit: '억원',
        description: '기업당 60억원 이내',
      },
      interestRate: {
        min: 1.0,
        max: 2.0,
        type: 'variable',
        description: '연 1.0~2.0% (정책 우대금리)',
      },
      loanPeriod: {
        years: 10,
        gracePeriod: 4,
        description: '10년 (거치 4년)',
      },
    },

    practicalInfo: {
      processingTime: '약 3~4주',
      requiredDocuments: [
        '탄소저감 투자계획서',
        '환경 인증서 (있는 경우)',
        '재무제표',
      ],
    },

    riskFactors: [
      '환경 관련 시설투자 입증 필요',
      '탄소저감 효과 계량화 필요',
    ],

    preferentialConditions: [
      'K-ESG 우수기업 금리 우대',
      '녹색인증 기업 우대',
    ],

    meta: {
      lastUpdated: '2025-01',
      confidence: 0.8,
      notes: '2050 탄소중립 정책 연계',
    },
  },

  {
    id: 'kosmes-general-stability',
    institutionId: 'kosmes',
    name: '일반경영안정자금',
    shortName: '경영안정',
    type: 'loan',
    description: '일반 중소기업 운전·시설자금 지원',

    eligibility: {
      businessAge: {
        min: 3,
        description: '업력 3년 이상',
      },
      allowedIndustries: ['all'],
      excludedIndustries: ['부동산업', '유흥업', '금융업'],
      exclusionConditions: [
        '휴·폐업',
        '세금 체납',
        '금융기관 연체',
      ],
    },

    terms: {
      amount: {
        max: 6000000000,  // 60억
        unit: '억원',
        description: '기업당 연간 60억원 이내',
      },
      interestRate: {
        min: 2.5,
        max: 3.5,
        type: 'variable',
        description: '연 2.5~3.5%',
      },
      loanPeriod: {
        years: 5,
        gracePeriod: 2,
        description: '5년 (거치 2년)',
      },
    },

    practicalInfo: {
      processingTime: '약 2~3주',
      requiredDocuments: [
        '재무제표',
        '사업자등록증',
        '납세증명서',
      ],
    },

    riskFactors: [
      '재무상태 심사 중요',
      '기존 정책자금 이용 실적 확인',
    ],

    preferentialConditions: [
      '고용 증가 기업 금리 우대',
      '수출 기업 우대',
    ],

    meta: {
      lastUpdated: '2025-01',
      confidence: 0.9,
      notes: '가장 범용적인 정책자금',
    },
  },

  // ========== 신보 추가 (4개) ==========
  {
    id: 'kodit-securitization',
    institutionId: 'kodit',
    name: '유동화회사보증',
    shortName: '신보 유동화',
    type: 'guarantee',
    description: '매출채권 등 자산유동화를 통한 자금조달 지원',

    eligibility: {
      businessAge: {
        min: 2,
        description: '업력 2년 이상',
      },
      revenue: {
        min: 1000000000,  // 10억
        description: '연매출 10억원 이상',
      },
      additionalRequirements: [
        '매출채권 또는 재고자산 보유',
        '안정적인 거래처 보유',
      ],
      exclusionConditions: [
        '세금 체납',
        '금융기관 연체',
      ],
    },

    terms: {
      amount: {
        max: 5000000000,  // 50억
        unit: '억원',
        description: '기업당 50억원 이내',
      },
      guaranteeRatio: {
        min: 80,
        max: 95,
        description: '보증비율 80~95%',
      },
    },

    practicalInfo: {
      processingTime: '약 2~3주',
      requiredDocuments: [
        '매출채권 명세',
        '거래처 정보',
        '재무제표',
      ],
    },

    riskFactors: [
      '매출채권 건전성 심사',
      '거래처 신용도 확인',
    ],

    preferentialConditions: [
      '우량 거래처 보유 기업 우대',
    ],

    meta: {
      lastUpdated: '2025-01',
      confidence: 0.8,
    },
  },

  {
    id: 'kodit-innovation-growth',
    institutionId: 'kodit',
    name: '혁신성장보증',
    shortName: '신보 혁신성장',
    type: 'guarantee',
    description: '4차산업혁명 관련 혁신기업 전용 보증',

    eligibility: {
      additionalRequirements: [
        '4차산업혁명 관련 업종 (AI, 빅데이터, IoT 등)',
        '혁신성장 분야 영위 기업',
        '기술혁신형 중소기업',
      ],
      excludedIndustries: ['부동산임대업', '유흥주점업'],
    },

    terms: {
      amount: {
        max: 5000000000,  // 50억
        unit: '억원',
        description: '기업당 50억원 이내',
      },
      guaranteeRatio: {
        min: 85,
        max: 100,
        description: '보증비율 85~100%',
      },
    },

    practicalInfo: {
      processingTime: '약 1~2주',
      requiredDocuments: [
        '사업계획서',
        '기술관련 자료',
        '재무제표',
      ],
    },

    riskFactors: [
      '혁신성장 분야 해당 여부 심사',
      '기술력 입증 필요',
    ],

    preferentialConditions: [
      '혁신성장 유니콘 기업 우대',
      '특허 보유 기업 보증료 감면',
    ],

    meta: {
      lastUpdated: '2025-01',
      confidence: 0.85,
    },
  },

  {
    id: 'kodit-job-creation',
    institutionId: 'kodit',
    name: '일자리창출보증',
    shortName: '신보 일자리',
    type: 'guarantee',
    description: '고용 확대 기업에 보증 우대 지원',

    eligibility: {
      additionalRequirements: [
        '최근 1년 내 고용 증가 기업',
        '또는 고용 확대 계획 보유',
        '정규직 채용 우대',
      ],
      exclusionConditions: [
        '고용 감소 기업',
        '세금 체납',
      ],
    },

    terms: {
      amount: {
        max: 3000000000,  // 30억
        unit: '억원',
        description: '기업당 30억원 이내',
      },
      guaranteeRatio: {
        min: 85,
        max: 100,
        description: '보증비율 85~100%',
      },
    },

    practicalInfo: {
      processingTime: '약 1~2주',
      requiredDocuments: [
        '고용 증가 증빙 (4대보험 가입자 명부)',
        '채용 계획서',
        '재무제표',
      ],
    },

    riskFactors: [
      '고용 증가 실적 입증 필요',
      '일시적 채용은 인정 제한',
    ],

    preferentialConditions: [
      '청년 고용 증가 시 보증료 추가 감면',
      '지역인재 고용 우대',
    ],

    meta: {
      lastUpdated: '2025-01',
      confidence: 0.85,
    },
  },

  {
    id: 'kodit-export',
    institutionId: 'kodit',
    name: '수출기업보증',
    shortName: '신보 수출',
    type: 'guarantee',
    description: '수출 실적 또는 수출 계획 기업 전용 보증',

    eligibility: {
      additionalRequirements: [
        '수출 실적 보유 기업',
        '또는 수출 계획 수립 기업',
        '해외 바이어 확보',
      ],
      excludedIndustries: ['부동산임대업'],
    },

    terms: {
      amount: {
        max: 5000000000,  // 50억
        unit: '억원',
        description: '기업당 50억원 이내',
      },
      guaranteeRatio: {
        min: 85,
        max: 100,
        description: '보증비율 85~100%',
      },
    },

    practicalInfo: {
      processingTime: '약 1~2주',
      requiredDocuments: [
        '수출실적 증빙 (수출신고필증 등)',
        '수출계약서 또는 L/C',
        '재무제표',
      ],
    },

    riskFactors: [
      '수출 실적 또는 계획 검증',
      '바이어 신용도 확인',
    ],

    preferentialConditions: [
      '수출 신규 진출 기업 우대',
      '강소기업 우대',
    ],

    meta: {
      lastUpdated: '2025-01',
      confidence: 0.85,
    },
  },

  // ========== 기보 추가 (4개) ==========
  {
    id: 'kibo-ip-collateral',
    institutionId: 'kibo',
    name: 'IP담보보증',
    shortName: '기보 IP담보',
    type: 'guarantee',
    description: '특허, 실용신안 등 지식재산권 담보 보증',

    eligibility: {
      additionalRequirements: [
        '특허권, 실용신안권 보유',
        'IP 가치평가 가능',
        '기술사업화 계획',
      ],
    },

    terms: {
      amount: {
        max: 3000000000,  // 30억
        unit: '억원',
        description: '기업당 30억원 이내 (IP 가치 연동)',
      },
      guaranteeRatio: {
        min: 80,
        max: 100,
        description: '보증비율 80~100%',
      },
    },

    practicalInfo: {
      processingTime: '약 3~4주 (IP 가치평가 포함)',
      requiredDocuments: [
        '특허/실용신안 등록증',
        'IP 활용 계획서',
        '재무제표',
      ],
    },

    riskFactors: [
      'IP 가치평가에 따른 한도 변동',
      'IP 사업화 실적 중요',
    ],

    preferentialConditions: [
      '우수 IP 보유 기업 보증료 감면',
      'IP 매출 비중 높은 기업 우대',
    ],

    meta: {
      lastUpdated: '2025-01',
      confidence: 0.8,
    },
  },

  {
    id: 'kibo-rnd',
    institutionId: 'kibo',
    name: 'R&D보증',
    shortName: '기보 R&D',
    type: 'guarantee',
    description: '연구개발 투자 기업 전용 보증',

    eligibility: {
      additionalRequirements: [
        '연구개발 투자 실적 또는 계획',
        '기업부설연구소 또는 연구개발전담부서 보유',
        'R&D 과제 수행 기업 우대',
      ],
    },

    terms: {
      amount: {
        max: 5000000000,  // 50억
        unit: '억원',
        description: '기업당 50억원 이내',
      },
      guaranteeRatio: {
        min: 85,
        max: 100,
        description: '보증비율 85~100%',
      },
    },

    practicalInfo: {
      processingTime: '약 2~3주',
      requiredDocuments: [
        '연구소 인정서',
        'R&D 투자 계획/실적',
        '재무제표',
      ],
    },

    riskFactors: [
      'R&D 투자 계획 구체성 필요',
      '연구개발 역량 심사',
    ],

    preferentialConditions: [
      '정부 R&D 과제 수행 기업 우대',
      '연구인력 비율 높은 기업 우대',
    ],

    meta: {
      lastUpdated: '2025-01',
      confidence: 0.85,
    },
  },

  {
    id: 'kibo-cultural-contents',
    institutionId: 'kibo',
    name: '문화콘텐츠보증',
    shortName: '기보 문화콘텐츠',
    type: 'guarantee',
    description: '게임, 영상, 음악, 공연 등 문화콘텐츠 기업 전용',

    eligibility: {
      allowedIndustries: ['it_service', 'other_service'],
      additionalRequirements: [
        '문화콘텐츠 제작/유통 기업',
        '게임, 영상, 음악, 공연, 출판 등',
        '콘텐츠 제작 실적 또는 계획',
      ],
    },

    terms: {
      amount: {
        max: 3000000000,  // 30억
        unit: '억원',
        description: '기업당 30억원 이내',
      },
      guaranteeRatio: {
        min: 85,
        max: 100,
        description: '보증비율 85~100%',
      },
    },

    practicalInfo: {
      processingTime: '약 2~3주',
      requiredDocuments: [
        '콘텐츠 제작 계획서',
        '기존 작품 포트폴리오',
        '재무제표',
      ],
    },

    riskFactors: [
      '콘텐츠 흥행 리스크',
      '제작비 규모 대비 보증한도',
    ],

    preferentialConditions: [
      '문화콘텐츠 진흥원 추천 기업 우대',
      '해외 수출 실적 기업 우대',
    ],

    meta: {
      lastUpdated: '2025-01',
      confidence: 0.8,
    },
  },

  {
    id: 'kibo-pre-startup',
    institutionId: 'kibo',
    name: '예비창업자보증',
    shortName: '기보 예비창업',
    type: 'guarantee',
    description: '법인설립 전 예비창업자 사업화 자금 보증',

    eligibility: {
      businessAge: {
        max: 0,
        description: '법인 설립 전 예비창업자',
      },
      additionalRequirements: [
        '기술 기반 창업 계획',
        '예비창업패키지 등 창업지원사업 선정자 우대',
        '기술사업계획서 제출',
      ],
    },

    terms: {
      amount: {
        max: 200000000,  // 2억
        unit: '억원',
        description: '최대 2억원 이내',
      },
      guaranteeRatio: {
        min: 90,
        max: 100,
        description: '보증비율 90~100%',
      },
    },

    practicalInfo: {
      processingTime: '약 2주',
      requiredDocuments: [
        '예비창업 사업계획서',
        '기술 관련 자료',
        '대표자 경력증명',
      ],
    },

    riskFactors: [
      '사업계획 실현 가능성 심사',
      '대표자 역량 중요',
    ],

    preferentialConditions: [
      '창업지원사업 선정자 우대',
      '기술창업 우대',
    ],

    meta: {
      lastUpdated: '2025-01',
      confidence: 0.8,
      notes: '법인 설립 전 지원 가능',
    },
  },

  // ========== 소진공 추가 (3개) ==========
  {
    id: 'semas-general',
    institutionId: 'semas',
    name: '일반경영안정자금',
    shortName: '소진공 일반',
    type: 'loan',
    description: '일반 소상공인 운전자금 지원',

    eligibility: {
      employeeCount: {
        max: 5,
        description: '상시근로자 5인 미만 (제조업 외)',
      },
      allowedIndustries: ['wholesale_retail', 'food_service', 'other_service'],
      additionalRequirements: [
        '소상공인 해당',
        '사업자등록 후 6개월 이상',
      ],
      exclusionConditions: [
        '휴·폐업',
        '세금 체납',
        '유흥업종',
      ],
    },

    terms: {
      amount: {
        max: 70000000,  // 7천만원
        unit: '만원',
        description: '기업당 7천만원 이내',
      },
      interestRate: {
        min: 2.5,
        max: 3.5,
        type: 'fixed',
        description: '연 2.5~3.5%',
      },
      loanPeriod: {
        years: 5,
        gracePeriod: 2,
        description: '5년 (거치 2년)',
      },
    },

    practicalInfo: {
      processingTime: '약 2주',
      requiredDocuments: [
        '사업자등록증',
        '매출 증빙',
        '신분증',
      ],
      applicationMethod: '소진공 지역센터 또는 온라인',
    },

    riskFactors: [
      '소상공인 기준 충족 필수',
      '업종별 지원 제외 확인',
    ],

    meta: {
      lastUpdated: '2025-01',
      confidence: 0.9,
    },
  },

  {
    id: 'semas-disabled',
    institutionId: 'semas',
    name: '장애인기업지원자금',
    shortName: '장애인기업',
    type: 'loan',
    description: '장애인 대표 소상공인 전용 지원',

    eligibility: {
      preferredOwnerTypes: ['disabled'],
      additionalRequirements: [
        '장애인 대표자 기업',
        '소상공인 해당',
        '장애인복지법에 따른 장애인',
      ],
    },

    terms: {
      amount: {
        max: 100000000,  // 1억
        unit: '만원',
        description: '기업당 1억원 이내',
      },
      interestRate: {
        min: 2.0,
        max: 2.5,
        type: 'fixed',
        description: '연 2.0~2.5% (우대금리)',
      },
      loanPeriod: {
        years: 5,
        gracePeriod: 2,
        description: '5년 (거치 2년)',
      },
    },

    practicalInfo: {
      processingTime: '약 2주',
      requiredDocuments: [
        '장애인등록증',
        '사업자등록증',
        '매출 증빙',
      ],
    },

    riskFactors: [
      '장애인 대표자 요건 확인',
    ],

    preferentialConditions: [
      '보증료 감면',
      '우대금리 적용',
    ],

    meta: {
      lastUpdated: '2025-01',
      confidence: 0.85,
    },
  },

  {
    id: 'semas-youth',
    institutionId: 'semas',
    name: '청년고용특별자금',
    shortName: '청년소상공인',
    type: 'loan',
    description: '청년 소상공인 또는 청년 고용 소상공인 지원',

    eligibility: {
      preferredOwnerTypes: ['youth'],
      additionalRequirements: [
        '만 39세 이하 청년 대표자',
        '또는 청년 정규직 고용 소상공인',
        '소상공인 해당',
      ],
    },

    terms: {
      amount: {
        max: 100000000,  // 1억
        unit: '만원',
        description: '기업당 1억원 이내',
      },
      interestRate: {
        min: 2.0,
        max: 3.0,
        type: 'fixed',
        description: '연 2.0~3.0% (우대금리)',
      },
      loanPeriod: {
        years: 5,
        gracePeriod: 2,
        description: '5년 (거치 2년)',
      },
    },

    practicalInfo: {
      processingTime: '약 2주',
      requiredDocuments: [
        '대표자 신분증 (연령 확인)',
        '사업자등록증',
        '청년 고용 증빙 (해당 시)',
      ],
    },

    riskFactors: [
      '청년 기준 연령 확인',
      '고용 실적 검증 (청년고용 우대 시)',
    ],

    preferentialConditions: [
      '청년창업 우대금리',
      '보증료 감면',
    ],

    meta: {
      lastUpdated: '2025-01',
      confidence: 0.85,
    },
  },

  // ========== 신규 기관 (4개) ==========
  {
    id: 'seoul-credit-general',
    institutionId: 'seoul_credit',
    name: '서울시 소기업·소상공인 보증',
    shortName: '서울신보 일반',
    type: 'guarantee',
    description: '서울 소재 소기업·소상공인 신용보증',

    eligibility: {
      allowedRegions: ['서울'],
      employeeCount: {
        max: 50,
        description: '상시근로자 50인 미만',
      },
      additionalRequirements: [
        '서울시 소재 사업장',
        '소기업 또는 소상공인',
        '사업자등록 후 6개월 이상',
      ],
      exclusionConditions: [
        '세금 체납',
        '금융기관 연체',
        '휴·폐업',
      ],
    },

    terms: {
      amount: {
        max: 800000000,  // 8억
        unit: '억원',
        description: '기업당 8억원 이내',
      },
      guaranteeRatio: {
        min: 85,
        max: 100,
        description: '보증비율 85~100%',
      },
    },

    practicalInfo: {
      processingTime: '약 1주',
      requiredDocuments: [
        '사업자등록증',
        '재무제표 또는 부가세신고서',
        '신분증',
      ],
      applicationMethod: '서울신보 지점 방문 또는 온라인',
    },

    riskFactors: [
      '서울 소재 확인 필수',
      '지역신보 한도 제한 있음',
    ],

    preferentialConditions: [
      '서울시 정책 연계 시 보증료 감면',
      '청년·여성 기업 우대',
    ],

    meta: {
      lastUpdated: '2025-01',
      confidence: 0.85,
    },
  },

  {
    id: 'gyeonggi-credit-general',
    institutionId: 'gyeonggi_credit',
    name: '경기도 소기업·소상공인 보증',
    shortName: '경기신보 일반',
    type: 'guarantee',
    description: '경기도 소재 소기업·소상공인 신용보증',

    eligibility: {
      allowedRegions: ['경기'],
      employeeCount: {
        max: 50,
        description: '상시근로자 50인 미만',
      },
      additionalRequirements: [
        '경기도 소재 사업장',
        '소기업 또는 소상공인',
        '사업자등록 후 6개월 이상',
      ],
      exclusionConditions: [
        '세금 체납',
        '금융기관 연체',
        '휴·폐업',
      ],
    },

    terms: {
      amount: {
        max: 500000000,  // 5억
        unit: '억원',
        description: '기업당 5억원 이내',
      },
      guaranteeRatio: {
        min: 85,
        max: 100,
        description: '보증비율 85~100%',
      },
    },

    practicalInfo: {
      processingTime: '약 1주',
      requiredDocuments: [
        '사업자등록증',
        '재무제표 또는 부가세신고서',
        '신분증',
      ],
      applicationMethod: '경기신보 지점 방문 또는 온라인',
    },

    riskFactors: [
      '경기도 소재 확인 필수',
      '지역신보 한도 제한 있음',
    ],

    preferentialConditions: [
      '경기도 정책 연계 시 보증료 감면',
      '청년·여성 기업 우대',
    ],

    meta: {
      lastUpdated: '2025-01',
      confidence: 0.85,
    },
  },

  {
    id: 'mss-startup-package',
    institutionId: 'mss',
    name: '창업성공패키지 연계자금',
    shortName: '창성패 연계',
    type: 'loan',
    description: '창업성공패키지 선정기업 후속 연계 자금',

    eligibility: {
      businessAge: {
        max: 3,
        description: '창업 3년 이내',
      },
      additionalRequirements: [
        '창업성공패키지(예비창업/초기창업) 선정기업',
        '창업지원사업 수료 또는 진행 중',
        '사업화 실적 또는 계획',
      ],
    },

    terms: {
      amount: {
        max: 100000000,  // 1억
        unit: '억원',
        description: '최대 1억원',
      },
      interestRate: {
        min: 1.5,
        max: 2.5,
        type: 'fixed',
        description: '연 1.5~2.5% (우대금리)',
      },
      loanPeriod: {
        years: 5,
        gracePeriod: 2,
        description: '5년 (거치 2년)',
      },
    },

    practicalInfo: {
      processingTime: '약 2주',
      requiredDocuments: [
        '창업지원사업 선정 통지서',
        '사업계획서',
        '재무제표',
      ],
    },

    riskFactors: [
      '창업지원사업 선정 필수',
      '후속 투자 연계 시 유리',
    ],

    preferentialConditions: [
      '창업성공패키지 우수 수료기업 우대',
      '후속투자 유치 기업 추가 지원',
    ],

    meta: {
      lastUpdated: '2025-01',
      confidence: 0.8,
      notes: '중기부 창업지원사업 연계',
    },
  },

  {
    id: 'motie-rnd-fund',
    institutionId: 'motie',
    name: '산업기술혁신자금',
    shortName: '산업R&D',
    type: 'loan',
    description: '산업기술 R&D 투자 기업 지원',

    eligibility: {
      additionalRequirements: [
        '산업기술 R&D 과제 수행 기업',
        '또는 R&D 투자 계획 기업',
        '기술개발 실적 보유',
      ],
      excludedIndustries: ['부동산업', '금융업'],
    },

    terms: {
      amount: {
        max: 3000000000,  // 30억
        unit: '억원',
        description: '기업당 30억원 이내',
      },
      interestRate: {
        min: 1.5,
        max: 2.5,
        type: 'variable',
        description: '연 1.5~2.5%',
      },
      loanPeriod: {
        years: 8,
        gracePeriod: 3,
        description: '8년 (거치 3년)',
      },
    },

    practicalInfo: {
      processingTime: '약 4~6주 (기술평가 포함)',
      requiredDocuments: [
        'R&D 과제 수행 증빙',
        '기술개발 계획서',
        '재무제표',
      ],
    },

    riskFactors: [
      'R&D 과제 실적 중요',
      '기술평가 필요',
    ],

    preferentialConditions: [
      '정부 R&D 과제 수행 기업 우대',
      '산업부 인증 기업 우대',
    ],

    meta: {
      lastUpdated: '2025-01',
      confidence: 0.8,
      notes: '산업부 R&D 지원 연계',
    },
  },
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
