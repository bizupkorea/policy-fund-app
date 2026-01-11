/**
 * lib/policy-fund/last/matcher/config/thresholds.ts
 *
 * 비즈니스 규칙 기준값 중앙화
 * - 감점/가점 기준값
 * - 하드컷/소프트컷 기준값
 */

// ============================================================================
// 중진공 졸업제 기준
// ============================================================================

export const KOSMES_GRADUATION = {
  /** 5회 이상: 완전 제외 (하드컷) */
  excludeThreshold: 5,

  /** 4회: 감점 적용 */
  warning4Threshold: 4,
  warning4Penalty: 30,
  warning4Message: '중진공 정책자금 4회 이용 (졸업제 임박 - 마지막 신청 기회)',

  /** 3회: 경고만 */
  warning3Threshold: 3,
  warning3Message: '중진공 정책자금 3회 이용 (졸업제 주의 - 2회 남음)',

  /** 최근 2년 내 이용: 추가 감점 */
  recentLoanPenalty: 10,
  recentLoanMessage: '최근 2년 내 중진공 자금 이용 (연속 지원 제한)',
} as const;

// ============================================================================
// 보증기관 이용 현황 기준
// ============================================================================

export const GUARANTEE_ORG = {
  /** 양쪽 기관 모두 이용 중 */
  bothPenalty: 30,
  bothMessage: '신보+기보 동시 이용 중 (추가 보증 한도 제한)',

  /** 타기관 이용 중 */
  otherPenalty: 10,
  otherMessage: '타 보증기관 이용 중 (전환 시 심사 필요)',

  /** 동일 기관 추가 이용 (감점 없음, 경고만) */
  sameOrgMessage: (org: string) => `${org} 이용 중 - 추가 보증 한도 확인 필요`,
} as const;

// ============================================================================
// 기존 대출잔액 기준 (억원 단위)
// ============================================================================

export const LOAN_BALANCE = {
  /** 심각 (15억 이상) */
  severe: {
    threshold: 15,
    directLoanPenalty: 40,
    guaranteePenalty: 25,
    defaultPenalty: 30,
    message: (balance: number) => `기존 정책자금 잔액 과다 (${balance}억, 한도 초과 우려)`,
  },

  /** 높음 (10~15억) */
  high: {
    threshold: 10,
    directLoanPenalty: 25,
    guaranteePenalty: 15,
    defaultPenalty: 20,
    message: (balance: number) => `기존 정책자금 잔액 ${balance}억 (한도 근접)`,
  },

  /** 보통 (5~10억) */
  medium: {
    threshold: 5,
    directLoanPenalty: 10,
    guaranteePenalty: 5,
    defaultPenalty: 8,
    message: (balance: number) => `기존 정책자금 잔액 ${balance}억 (여유 한도 축소)`,
  },
} as const;

// ============================================================================
// 수혜액/매출 비율 기준
// ============================================================================

export const SUBSIDY_RATIO = {
  /** 심각 (30% 초과) */
  severe: {
    ratio: 0.3,
    penalty: 30,
    message: (percent: number) => `최근 1년 수혜액/매출 비율 과다 (${percent}%, 추가 지원 제한 가능)`,
  },

  /** 높음 (20~30%) */
  high: {
    ratio: 0.2,
    penalty: 20,
    message: (percent: number) => `최근 1년 수혜액/매출 비율 ${percent}% (심사 시 고려됨)`,
  },

  /** 보통 (10~20%) */
  medium: {
    ratio: 0.1,
    penalty: 10,
    message: (percent: number) => `최근 1년 수혜액/매출 비율 ${percent}% (주의)`,
  },

  /** 매출 정보 없이 절대금액 기준 (fallback) */
  absoluteAmount: {
    highThreshold: 10,  // 10억 이상
    highPenalty: 25,
    lowPenalty: 15,
    highMessage: (amount: number) => `최근 1년 정책자금 수혜 과다 (${amount}억원)`,
    lowMessage: (amount: number) => `최근 1년 정책자금 수혜 (${amount}억원)`,
  },
} as const;

// ============================================================================
// 특수 상황 가점
// ============================================================================

export const SPECIAL_BONUSES = {
  /** 스마트공장 (트랙 전환 방식 - 점수 폭탄 금지) */
  smartFactory: {
    manufacturing: 5,          // 점수 폭탄 금지: 25 → 5 (트랙 우선순위로 대체)
    isPerfectMatch: true,      // 100점 허용 플래그
    other: 5,                  // 비제조업도 동일 (경고만 추가)
    warningMessage: '스마트공장자금은 제조업 우선 - 비제조업은 심사 제한 가능',
  },

  /** 벤처투자 유치 */
  ventureInvestment: {
    innovationBonus: 20,
    microPenalty: 25,
    innovationMessage: '벤처투자 유치 실적 보유 - 혁신성장/스케일업 자금 최우선',
    microPenaltyMessage: '벤처투자 유치 기업에 소상공인 자금 부적합',
  },

  /** 재창업 (트랙 전환 방식 - 점수 폭탄 금지) */
  restart: {
    dedicatedBonus: 5,         // 점수 폭탄 금지: 30 → 5 (트랙 우선순위로 대체)
    isPerfectMatch: true,      // 100점 허용 플래그
    generalPenalty: 5,
    dedicatedMessage: '재창업 기업 - 재도전 자금 최우선 추천',
    noDefaultWarning: '재창업기업 - 재도전자금 우선 검토 권장',
    defaultResolvedWarning: '재창업기업(부실정리) - 일반자금 심사 시 이력 확인됨',
  },

  /** ESG/탄소중립 */
  esg: {
    bonus: 25,
  },

  /** 신재생에너지 */
  greenEnergy: {
    bonus: 25,
  },

  /** ESG + 신재생에너지 동시 체크 시 최대 가점 */
  esgGreenCeiling: 35,

  /** 긴급경영안정 (트랙 전환 방식 - 점수 폭탄 금지) */
  emergency: {
    bonus: 5,                  // 점수 폭탄 금지: 30 → 5 (트랙 우선순위로 대체)
    isPerfectMatch: true,      // 100점 허용 플래그
    message: '경영위기 상황 - 긴급경영안정자금 최우선 추천',
  },

  /** 일자리 창출 */
  jobCreation: {
    bonus: 25,
    message: '고용증가 실적 보유 - 일자리창출자금 최우선 추천',
  },

  /** 사회적가치 기업 (트랙 전환 방식 - 점수 폭탄 금지) */
  socialValue: {
    dedicatedBonus: 5,         // 점수 폭탄 금지: 50 → 5 (트랙 우선순위로 대체)
    isPerfectMatch: true,      // 100점 허용 플래그
    generalBonus: 10,
    dedicatedMessage: '사회적가치 기업 전용자금 - 최우선 추천',
    generalMessage: '사회적가치 기업 우대 대상',
  },

  /** 과거 부실 정리 완료 */
  pastDefaultResolved: {
    restartBonus: 20,
    generalPenalty: 15,
    restartMessage: '과거 부실 정리 완료 - 재도전 자금 최우선 추천',
    generalWarning: '과거 부실 이력 (정리 완료 - 심사 시 불이익 가능)',
  },

  /** 신용회복 진행 중 */
  creditRecovery: {
    restartBonus: 15,
    message: '신용회복 진행 중 - 재도전자금 우대 대상',
    warning: '신용회복 절차 진행 중 - 재창업/재도전 전용자금만 신청 가능',
  },

  /** 세금 체납 + 분납 승인 */
  taxDelinquencyWithApproval: {
    penalty: 10,
    warning: '세금 체납 중 (분납 승인 - 심사 시 불이익 가능)',
  },

  /** 전략산업 (소상공인) */
  strategicIndustry: {
    kosmesBonus: 20,
    scoreBonus: 10,
    message: '전략산업(이차전지/반도체/AI 등) - 중진공 우선 지원',
  },
} as const;

// ============================================================================
// 충돌 조정 감점
// ============================================================================

export const CONFLICT_PENALTIES = {
  /** 긴급경영 + IPO/투자유치 */
  emergencyWithInvestment: {
    penalty: 20,
    message: '긴급경영 상황에서 투자유치형 자금은 부적합',
  },

  /** 재창업 + 벤처투자실적 */
  restartWithVenture: {
    penalty: 15,
    message: '재창업 기업은 재도전자금 우선 검토 권장',
  },
} as const;

// ============================================================================
// 필요 자금 관련
// ============================================================================

export const FUNDING_AMOUNT = {
  /** 한도 충족 시 가점 */
  matchBonus: 5,

  /** 대규모 자금 기준 (억원) */
  largeThreshold: 10,
  largeBonus: 5,
  largeMessage: '대규모 자금 조달에 적합',
} as const;

// ============================================================================
// 휴·폐업 및 하드컷 관련
// ============================================================================

export const HARD_CUT_MESSAGES = {
  inactive: '휴·폐업 상태 - 재창업/재도전 전용자금만 신청 가능',
  creditRecovery: '신용회복 중 - 재도전자금 신청 가능',
} as const;
