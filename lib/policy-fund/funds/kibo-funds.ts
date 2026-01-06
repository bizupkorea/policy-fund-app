/**
 * 기보(KIBO) 보증상품 목록
 *
 * 기술보증기금 - 기술력 기반 신용보증 제공
 * 2026년 기준 기술보증 전문 기관
 *
 * @lastUpdated 2026-01
 */

import type { PolicyFundKnowledge } from '../knowledge-base';

export type { PolicyFundKnowledge };

/**
 * 기보(KIBO) 보증상품 프로그램 목록
 */
export const kiboFunds: PolicyFundKnowledge[] = [
  // ========== 창업기업보증 ==========
  {
    id: 'kibo-startup',
    institutionId: 'kibo',
    track: 'guarantee',
    name: '창업기업보증',
    shortName: '기보 창업',
    type: 'guarantee',
    description: '창업 7년 이내 중소기업 전용 신용보증',

    fundingPurpose: { working: true, facility: true },

    eligibility: {
      businessAge: {
        max: 7,
        description: '창업 7년 이내',
      },
      revenue: {
        max: 100000000000,
        description: '매출 1000억원 이하 중소기업',
      },
      excludedIndustries: ['부동산업', '금융업', '유흥업'],
    },

    terms: {
      amount: {
        max: 3000000000,
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
      processingTime: '1~2주',
      requiredDocuments: [
        '사업자등록증',
        '재무제표',
        '사업계획서',
        '법인등기부등본',
      ],
    },

    riskFactors: [
      '신용등급에 따라 보증비율 차등',
      '업력 7년 초과 시 일반보증으로 전환',
    ],

    preferentialConditions: [
      '창업 3년 이내 보증료 감면',
      '기술창업기업 우대',
    ],

    officialUrl: 'https://www.kibo.or.kr',

    meta: {
      lastUpdated: '2026-01',
      confidence: 0.9,
    },
  },

  // ========== 기술평가보증 ==========
  {
    id: 'kibo-tech-evaluation',
    institutionId: 'kibo',
    track: 'guarantee',
    name: '기술평가보증',
    shortName: '기보 기술평가',
    type: 'guarantee',
    description: '기술력 보유 기업에 기술평가 기반 보증',

    fundingPurpose: { working: true, facility: true },

    eligibility: {
      additionalRequirements: [
        '기술력 보유 (특허, 기술인력 등)',
        '기술사업성 평가 통과',
      ],
      excludedIndustries: ['부동산업', '금융업'],
      requiredConditions: {
        hasTechnologyCertification: true,
      },
    },

    terms: {
      amount: {
        max: 5000000000,
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
      lastUpdated: '2026-01',
      confidence: 0.9,
    },
  },

  // ========== 혁신스타트업보증 ==========
  {
    id: 'kibo-venture-startup',
    institutionId: 'kibo',
    track: 'guarantee',
    name: '혁신스타트업보증',
    shortName: '기보 스타트업',
    type: 'guarantee',
    description: '벤처·이노비즈 인증 기업 전용 보증',

    fundingPurpose: { working: true, facility: true },

    eligibility: {
      additionalRequirements: [
        '벤처기업 확인',
        '또는 이노비즈 인증',
        '기술혁신형 중소기업',
      ],
      requiredConditions: {
        isVentureCompany: true,
      },
      excludedIndustries: ['부동산업', '금융업'],
    },

    terms: {
      amount: {
        max: 5000000000,
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
        '벤처기업확인서 또는 이노비즈 인증서',
        '사업계획서',
        '재무제표',
      ],
    },

    riskFactors: [
      '인증 유효기간 확인 필요',
      '기술력 유지 필요',
    ],

    preferentialConditions: [
      '벤처/이노비즈 인증기업 보증료 감면',
      '우대 한도 적용',
    ],

    officialUrl: 'https://www.kibo.or.kr/vc/index.do',

    meta: {
      lastUpdated: '2026-01',
      confidence: 0.85,
    },
  },

  // ========== IP담보보증 ==========
  {
    id: 'kibo-ip-collateral',
    institutionId: 'kibo',
    track: 'policy_linked',
    name: 'IP담보보증',
    shortName: '기보 IP담보',
    type: 'guarantee',
    description: '특허, 실용신안 등 지식재산권 담보 보증',

    fundingPurpose: { working: true, facility: true },

    eligibility: {
      additionalRequirements: [
        '특허권, 실용신안권 보유',
        'IP 가치평가 가능',
        '기술사업화 계획',
      ],
      requiredConditions: {
        hasPatent: true,
      },
    },

    terms: {
      amount: {
        max: 3000000000,
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

    officialUrl: 'https://www.kibo.or.kr/main/contents.do?menuNo=200047',

    meta: {
      lastUpdated: '2026-01',
      confidence: 0.8,
    },
  },

  // ========== R&D보증 ==========
  {
    id: 'kibo-rnd',
    institutionId: 'kibo',
    track: 'policy_linked',
    name: 'R&D보증',
    shortName: '기보 R&D',
    type: 'guarantee',
    description: '연구개발 투자 기업 전용 보증',

    fundingPurpose: { working: true, facility: false },

    eligibility: {
      additionalRequirements: [
        '연구개발 투자 실적 또는 계획',
        '기업부설연구소 또는 연구개발전담부서 보유',
        'R&D 과제 수행 기업 우대',
      ],
      requiredConditions: {
        hasRndActivity: true,
      },
    },

    terms: {
      amount: {
        max: 5000000000,
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

    officialUrl: 'https://www.kibo.or.kr/main/contents.do?menuNo=200046',

    meta: {
      lastUpdated: '2026-01',
      confidence: 0.85,
    },
  },

  // ========== 문화콘텐츠보증 ==========
  {
    id: 'kibo-cultural-contents',
    institutionId: 'kibo',
    track: 'policy_linked',
    name: '문화콘텐츠보증',
    shortName: '기보 문화콘텐츠',
    type: 'guarantee',
    description: '게임, 영상, 음악, 공연 등 문화콘텐츠 기업 전용',

    fundingPurpose: { working: true, facility: true },

    eligibility: {
      allowedIndustries: ['it_service'],
      additionalRequirements: [
        '문화콘텐츠 제작/유통 기업',
        '게임, 영상, 음악, 공연, 출판 등',
        '콘텐츠 제작 실적 또는 계획',
      ],
      requiredConditions: {
        isCulturalContents: true,
      },
    },

    terms: {
      amount: {
        max: 3000000000,
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
        '콘텐츠 제작/유통 계획서',
        '기존 콘텐츠 실적',
        '재무제표',
      ],
    },

    riskFactors: [
      '콘텐츠 수익성 평가',
      '지식재산권 확보 여부',
    ],

    preferentialConditions: [
      '한류 콘텐츠 기업 우대',
      'IP 보유 기업 우대',
    ],

    officialUrl: 'https://www.kibo.or.kr',

    meta: {
      lastUpdated: '2026-01',
      confidence: 0.8,
    },
  },

  // ========== 예비창업자보증 ==========
  {
    id: 'kibo-pre-startup',
    institutionId: 'kibo',
    track: 'guarantee',
    name: '예비창업자보증',
    shortName: '기보 예비창업',
    type: 'guarantee',
    description: '사업자등록 전 예비창업자 전용 보증',

    fundingPurpose: { working: true, facility: true },

    eligibility: {
      businessAge: {
        max: 0,
        description: '예비창업자 (사업자등록 전)',
      },
      additionalRequirements: [
        '사업자등록 전 예비창업자',
        '창업계획 보유',
        '기술력 또는 사업성 검증',
      ],
    },

    terms: {
      amount: {
        max: 200000000,
        unit: '억원',
        description: '기업당 2억원 이내',
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
        '창업계획서',
        '기술/아이디어 증빙',
        '대표자 신분증',
      ],
    },

    riskFactors: [
      '창업계획 구체성 중요',
      '대표자 역량 평가',
    ],

    preferentialConditions: [
      '예비창업자 지원 가능',
      '창업지원사업 연계 우대',
    ],

    officialUrl: 'https://www.kibo.or.kr',

    meta: {
      lastUpdated: '2026-01',
      confidence: 0.8,
      notes: '법인 설립 전 지원 가능',
    },
  },

  // ========== 청년테크스타보증 ==========
  {
    id: 'kibo-youth-techstar',
    institutionId: 'kibo',
    track: 'exclusive',
    name: '청년테크스타보증',
    shortName: '기보 청년테크',
    type: 'guarantee',
    description: '우수 기술력 보유 청년 창업기업 전용 프리미엄 보증 (공식: 5년 이내, 만17~39세)',

    fundingPurpose: { working: true, facility: true },

    eligibility: {
      businessAge: {
        max: 5,
        description: '창업 5년 이내 (공식 확인)',
      },
      preferredOwnerTypes: ['youth'],
      requiredConditions: {
        isYouthCompany: true,
        hasTechnologyCertification: true,
      },
      additionalRequirements: [
        '대표자 만 17~39세 (공식 확인)',
        '기술력 보유 (특허, 벤처 등)',
        '창업 5년 이내',
      ],
      excludedIndustries: ['부동산업', '금융업', '유흥업'],
    },

    terms: {
      amount: {
        max: 300000000,
        unit: '억원',
        description: '기업당 3억원 이내',
      },
      guaranteeRatio: {
        min: 95,
        max: 100,
        description: '보증비율 95~100% (청년 우대)',
      },
    },

    practicalInfo: {
      processingTime: '약 1~2주',
      requiredDocuments: [
        '대표자 신분증',
        '사업자등록증',
        '기술 관련 증빙 (특허, 벤처확인서 등)',
        '재무제표',
      ],
      applicationMethod: '기보 영업점',
      contactInfo: '1544-1120',
    },

    riskFactors: [
      '청년 연령 기준 엄격',
      '기술력 입증 필수',
    ],

    preferentialConditions: [
      '보증비율 95~100%',
      '보증료 감면',
      '청년 전용 프리미엄 지원',
    ],

    officialUrl: 'https://www.kibo.or.kr',

    meta: {
      lastUpdated: '2026-01',
      confidence: 0.9,
      notes: '2025년 신설 청년 기술창업 전용',
    },
  },

  // ============================================================================
  // 2026년 신규 추가 보증상품
  // ============================================================================

  // ========== 유니콘기업보증 ==========
  {
    id: 'kibo-unicorn',
    institutionId: 'kibo',
    track: 'policy_linked',
    name: '유니콘기업보증',
    shortName: '기보 유니콘',
    type: 'guarantee',
    description: '기업가치 1,000억원 이상 또는 지역스타기업 중 유니콘 성장 잠재력 보유 기업',

    fundingPurpose: { working: true, facility: true },

    eligibility: {
      additionalRequirements: [
        '기업가치 1,000억원 이상 (공식 확인)',
        '또는 지역스타기업 (시장검증/성장성/혁신성 충족)',
        '기술사업평가등급 B등급 이상 (공식 확인)',
      ],
      requiredConditions: {
        isVentureCompany: true,
      },
      excludedIndustries: ['부동산업', '금융업', '유흥업'],
    },

    terms: {
      amount: {
        max: 20000000000,
        unit: '억원',
        description: '기업당 최대 200억원 (공식 확인: 선정연도 100억, 차년도 잔여)',
      },
      guaranteeRatio: {
        min: 85,
        max: 100,
        description: '보증비율 85% (공식 확인, 특별출연협약 시 100%)',
      },
    },

    practicalInfo: {
      processingTime: '약 3주',
      requiredDocuments: [
        '사업계획서',
        '재무제표',
        '기업가치 평가서',
        '투자유치 실적 증빙',
      ],
      applicationMethod: '기보 영업점',
      contactInfo: '1544-1120',
    },

    riskFactors: [
      '선정 경쟁 치열',
      '기업가치 평가 필요',
    ],

    preferentialConditions: [
      '최대 200억 지원',
      '유니콘 육성 프로그램 연계',
      '전담 지원',
    ],

    officialUrl: 'https://www.kibo.or.kr',

    meta: {
      lastUpdated: '2026-01',
      confidence: 0.95,
      notes: '공식 확인: 기업가치 1000억+, B등급+, 한도 200억, 비율 85%',
    },
  },

  // ========== 신재생에너지보증 ==========
  {
    id: 'kibo-green-energy',
    institutionId: 'kibo',
    track: 'policy_linked',
    name: '신재생에너지보증',
    shortName: '기보 신재생에너지',
    type: 'guarantee',
    description: '신재생에너지 분야 특화 기술평가 기반 보증',

    fundingPurpose: { working: true, facility: true },

    eligibility: {
      additionalRequirements: [
        '신재생에너지 발전기업',
        '또는 신재생에너지 산업기업',
        '태양광, 풍력, 수소 등',
      ],
      excludedIndustries: ['부동산업', '금융업'],
    },

    terms: {
      amount: {
        max: 5000000000,
        unit: '억원',
        description: '최대 50억원',
      },
      interestRate: {
        min: 0.5,
        max: 0.7,
        type: 'fixed',
        description: '발전기업 0.5% 고정, 산업기업 0.2%p 차감',
      },
      guaranteeRatio: {
        min: 85,
        max: 100,
        description: '보증비율 85~100%',
      },
    },

    practicalInfo: {
      processingTime: '약 2주',
      requiredDocuments: [
        '사업계획서',
        '재무제표',
        '신재생에너지 사업 인허가 서류',
        '발전사업 허가증 (해당 시)',
      ],
      applicationMethod: '기보 영업점',
      contactInfo: '1544-1120',
    },

    riskFactors: [
      '신재생에너지 분야 전문 평가',
      '사업 인허가 필수',
    ],

    preferentialConditions: [
      '발전기업 고정 보증료율 0.5%',
      '산업기업 보증료 0.2%p 차감',
      '전용 평가모형 적용',
    ],

    officialUrl: 'https://www.kibo.or.kr',

    meta: {
      lastUpdated: '2026-01',
      confidence: 0.85,
      notes: '신재생에너지 분야 특화 보증',
    },
  },

  // ========== 녹색전환보증 ==========
  {
    id: 'kibo-green-transition',
    institutionId: 'kibo',
    track: 'policy_linked',
    name: '녹색전환보증',
    shortName: '기보 녹색전환',
    type: 'guarantee',
    description: '녹색전환 공정·설비·기술 투자 기업 지원',

    fundingPurpose: { working: false, facility: true },

    eligibility: {
      additionalRequirements: [
        '녹색 공정·설비·기술 투자 계획',
        '탄소중립 전환 추진 기업',
        'ESG 경영 도입 기업',
      ],
      requiredConditions: {
        hasEsgInvestmentPlan: true,
      },
      excludedIndustries: ['부동산업', '금융업'],
    },

    terms: {
      amount: {
        max: 5000000000,
        unit: '억원',
        description: '최대 50억원',
      },
      guaranteeRatio: {
        min: 85,
        max: 100,
        description: '보증비율 85~100%',
      },
    },

    practicalInfo: {
      processingTime: '약 2주',
      requiredDocuments: [
        '녹색투자 계획서',
        '설비 투자 견적서',
        'ESG 경영 계획서',
      ],
      applicationMethod: '기보 영업점',
      contactInfo: '1544-1120',
    },

    riskFactors: [
      '녹색투자 계획 구체성 필요',
      '설비투자 실행력 검증',
    ],

    preferentialConditions: [
      '녹색전환 기업 우대',
      '보증료 감면',
      '탄소중립 지원',
    ],

    officialUrl: 'https://www.kibo.or.kr',

    meta: {
      lastUpdated: '2026-01',
      confidence: 0.85,
      notes: '녹색전환 투자 기업 지원',
    },
  },

  // ========== 굿잡보증 ==========
  {
    id: 'kibo-good-job',
    institutionId: 'kibo',
    track: 'policy_linked',
    name: '굿잡보증',
    shortName: '기보 굿잡',
    type: 'guarantee',
    description: '일자리 창출·확대 기업 전용 우대 보증',

    fundingPurpose: { working: true, facility: true },

    eligibility: {
      additionalRequirements: [
        '최근 1년 내 고용 증가 기업',
        '또는 고용 확대 계획 보유',
        '정규직 채용 우대',
      ],
      excludedIndustries: ['부동산업', '금융업'],
    },

    terms: {
      amount: {
        max: 3000000000,
        unit: '억원',
        description: '최대 30억원',
      },
      guaranteeRatio: {
        min: 85,
        max: 100,
        description: '보증비율 85~100%',
      },
    },

    practicalInfo: {
      processingTime: '약 2주',
      requiredDocuments: [
        '사업계획서',
        '재무제표',
        '고용보험 가입 증명원',
        '채용계획서',
      ],
      applicationMethod: '기보 영업점',
      contactInfo: '1544-1120',
    },

    riskFactors: [
      '고용 증가 실적 또는 계획 필요',
      '정규직 중심 평가',
    ],

    preferentialConditions: [
      '고용 증가 기업 우대',
      '보증료 감면',
      '한도 우대',
    ],

    officialUrl: 'https://www.kibo.or.kr',

    meta: {
      lastUpdated: '2026-01',
      confidence: 0.85,
      notes: '일자리 창출 기업 전용',
    },
  },

  // ========== 신성장분야보증 ==========
  {
    id: 'kibo-new-growth',
    institutionId: 'kibo',
    track: 'policy_linked',
    name: '신성장분야보증',
    shortName: '기보 신성장',
    type: 'guarantee',
    description: 'AI, IoT, 빅데이터 등 4차산업혁명 신성장 분야 기업 지원',

    fundingPurpose: { working: true, facility: true },

    eligibility: {
      additionalRequirements: [
        '4차산업혁명 관련 업종',
        'AI, IoT, 빅데이터, 블록체인 등',
        '신성장 분야 기술 보유',
      ],
      requiredConditions: {
        hasTechnologyCertification: true,
      },
      excludedIndustries: ['부동산업', '금융업'],
    },

    terms: {
      amount: {
        max: 5000000000,
        unit: '억원',
        description: '최대 50억원',
      },
      guaranteeRatio: {
        min: 85,
        max: 100,
        description: '보증비율 85~100%',
      },
    },

    practicalInfo: {
      processingTime: '약 2주',
      requiredDocuments: [
        '사업계획서',
        '재무제표',
        '기술보유 증빙 (특허, 인증 등)',
      ],
      applicationMethod: '기보 영업점',
      contactInfo: '1544-1120',
    },

    riskFactors: [
      '4차산업 분야 기술력 입증 필요',
      '시장성 평가',
    ],

    preferentialConditions: [
      '신성장 분야 우대',
      '보증료 감면',
      '기술 컨설팅 연계',
    ],

    officialUrl: 'https://www.kibo.or.kr',

    meta: {
      lastUpdated: '2026-01',
      confidence: 0.85,
      notes: '4차산업혁명 신성장 분야 기업 지원',
    },
  },

  // ========== 소셜벤처보증 ==========
  {
    id: 'kibo-social-venture',
    institutionId: 'kibo',
    track: 'exclusive',
    name: '소셜벤처보증',
    shortName: '기보 소셜벤처',
    type: 'guarantee',
    description: '사회적가치 창출 기술혁신 기업 및 (예비)사회적기업 전용',

    fundingPurpose: { working: true, facility: true },

    eligibility: {
      additionalRequirements: [
        '사회적 가치 창출 기술혁신 기업',
        '(예비)사회적기업',
        '사회적 약자 보호, 환경 보전, 일자리 제공',
      ],
      requiredConditions: {
        isSocialEconomyEnterprise: true,
      },
      excludedIndustries: ['부동산업', '금융업'],
    },

    terms: {
      amount: {
        max: 1000000000,
        unit: '억원',
        description: '최대 10억원',
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
        '사업계획서',
        '사회적기업 인증서 (또는 예비)',
        '사회적가치 측정 보고서',
      ],
      applicationMethod: '기보 영업점',
      contactInfo: '1544-1120',
    },

    riskFactors: [
      '사회적가치 창출 입증 필요',
      '인증 서류 필수',
    ],

    preferentialConditions: [
      '사회적기업 전용',
      '보증료 감면',
      '높은 보증비율',
    ],

    officialUrl: 'https://www.kibo.or.kr',

    meta: {
      lastUpdated: '2026-01',
      confidence: 0.85,
      notes: '사회적가치 창출 기업 전용',
    },
  },

  // ========== 원클릭보증 ==========
  {
    id: 'kibo-one-click',
    institutionId: 'kibo',
    track: 'guarantee',
    name: '원클릭보증',
    shortName: '기보 원클릭',
    type: 'guarantee',
    description: '온라인 빅데이터 기반 간편 보증 (영업점 방문 불필요)',

    fundingPurpose: { working: true, facility: false },

    eligibility: {
      businessAge: {
        min: 1,
        description: '업력 1년 이상',
      },
      additionalRequirements: [
        '온라인 신청 가능 기업',
        '기존 기보 거래 실적 있으면 유리',
      ],
      excludedIndustries: ['부동산업', '금융업'],
    },

    terms: {
      amount: {
        max: 200000000,
        unit: '억원',
        description: '최대 2억원',
      },
      guaranteeRatio: {
        min: 85,
        max: 95,
        description: '보증비율 85~95%',
      },
    },

    practicalInfo: {
      processingTime: '즉시~1일',
      requiredDocuments: [
        '사업자등록증',
        '대표자 신분증',
        '(추가 서류 최소화)',
      ],
      applicationMethod: '기보 디지털지점 온라인',
      contactInfo: '1544-1120',
    },

    riskFactors: [
      '한도 제한적 (최대 2억)',
      '빅데이터 평가 기반',
    ],

    preferentialConditions: [
      '영업점 방문 불필요',
      '빠른 심사 (즉시~1일)',
      '온라인 간편 신청',
    ],

    officialUrl: 'https://www.kibo.or.kr/dbranch/index.do',

    meta: {
      lastUpdated: '2026-01',
      confidence: 0.85,
      notes: '온라인 빅데이터 기반 간편 보증',
    },
  },
];

export default kiboFunds;
