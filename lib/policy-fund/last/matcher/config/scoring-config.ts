/**
 * lib/policy-fund/last/matcher/config/scoring-config.ts
 *
 * 점수 계산 설정값 중앙화
 * - 기본 점수, 레벨 기준, 순위별 차등
 * - 기관별 가산점, 인증 가점
 */

// ============================================================================
// 점수 기본 설정
// ============================================================================

export const SCORING_CONFIG = {
  /** 기본 점수 (95점에서 시작 - GPT 제안 적용) */
  baseScore: 95,

  /** 일반 점수 상한 (95점 Cap) */
  scoreCap: 95,

  /** 최대 점수 (100점 = 전용자금 완벽 매칭만) */
  maxScore: 100,

  /** 최소 점수 */
  minScore: 0,

  /** 레벨 기준 */
  levels: {
    high: 70,    // 70점 이상: 높음
    medium: 40,  // 40점 이상: 보통
    // 40점 미만: 낮음
  },

  /** 최대 결과 개수 */
  maxResults: 5,

  /** 기관당 최대 자금 개수 (다양성 필터) */
  maxPerInstitution: 2,
} as const;

// ============================================================================
// 순위별 점수 차등
// ============================================================================

/** 순위별 감점 (1위만 100점 유지) */
export const RANK_DIFFERENTIATION: Record<number, number> = {
  2: -3,
  3: -6,
  4: -9,
  5: -12,
  // 6위 이상은 -12 적용
};

/**
 * 순위에 따른 감점 계산
 */
export function getRankPenalty(rank: number): number {
  if (rank <= 1) return 0;
  return RANK_DIFFERENTIATION[rank] ?? -12;
}

// ============================================================================
// 기관별 가산점 (기업규모 기반)
// ============================================================================

export const INSTITUTION_BONUS = {
  /** 소상공인 (micro) */
  micro: {
    semas: 30,   // 소진공 최우선
    kosmes: 20,  // 중진공
    kodit: 10,   // 신보
    kibo: 10,    // 기보
  },

  /** 소기업/중기업 (small/medium) */
  small: {
    semas: 5,    // 소진공 (비적격이지만 일부 자금 가능)
    kosmes: 30,  // 중진공 최우선
    kodit: 20,   // 신보
    kibo: 20,    // 기보
  },

  /** 중기업과 동일 */
  medium: {
    semas: 5,
    kosmes: 30,
    kodit: 20,
    kibo: 20,
  },

  /** 대기업 (대부분 대상 아님) */
  large: {
    semas: 0,
    kosmes: 10,
    kodit: 10,
    kibo: 10,
  },
} as const;

/**
 * 기업규모에 따른 기관 가산점 조회
 */
export function getInstitutionBonus(
  companyScale: 'micro' | 'small' | 'medium' | 'large',
  institutionId: string
): number {
  const scaleConfig = INSTITUTION_BONUS[companyScale] || INSTITUTION_BONUS.small;
  return scaleConfig[institutionId as keyof typeof scaleConfig] ?? 0;
}

// ============================================================================
// 인증 가점 (그룹별 최대값 적용)
// ============================================================================

export const CERTIFICATION_BONUS = {
  /** 그룹1: 기업유형 인증 (택1 최대) */
  group1: {
    venture: 10,   // 벤처기업
    innobiz: 5,    // 이노비즈
    mainbiz: 5,    // 메인비즈
  },

  /** 그룹2: 기술·연구 (택1 최대) */
  group2: {
    rnd: 10,       // 기업부설연구소
    patent: 5,     // 특허 보유
  },

  /** 그룹3: 사업성과 */
  group3: {
    export: 5,     // 수출실적
  },

  /** 총합 상한 */
  maxTotal: 25,
} as const;

// ============================================================================
// 자금용도 매칭 가점/감점
// ============================================================================

export const FUNDING_PURPOSE_BONUS = {
  /** 용도 일치 시 가점 */
  match: {
    working: 10,   // 운전자금 전용
    facility: 20,  // 시설자금 전용 (더 중요)
    both: 15,      // 혼합 가능
  },

  /** 용도 불일치 시 감점 */
  mismatch: -25,

  /** 시설자금 부분 가점 (혼합 선택 시 시설만 가능) */
  facilityPartial: 5,
} as const;

// ============================================================================
// 트랙 우선순위 (4단계)
// ============================================================================

export const TRACK_PRIORITY = {
  /** 1순위: 특화자금 (exclusive) */
  exclusive: 1,

  /** 2순위: 직접대출 (kosmes, semas의 general/policy_linked) */
  directLoan: 2,

  /** 3순위: 일반정책자금/대리대출 */
  policyLinked: 3,

  /** 4순위: 보증서 (guarantee) */
  guarantee: 4,
} as const;

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * 점수를 레벨로 변환
 */
export function scoreToLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= SCORING_CONFIG.levels.high) return 'high';
  if (score >= SCORING_CONFIG.levels.medium) return 'medium';
  return 'low';
}

/**
 * 점수 클램핑 (최소~최대 범위 내로 제한)
 * 일반 자금은 95점 Cap 적용, 전용자금 완벽매칭은 100점 허용
 */
export function clampScore(score: number, allowPerfectMatch: boolean = false): number {
  const maxAllowed = allowPerfectMatch ? SCORING_CONFIG.maxScore : SCORING_CONFIG.scoreCap;
  return Math.max(SCORING_CONFIG.minScore, Math.min(maxAllowed, score));
}

/**
 * 가점 적용 (최대값 초과 방지)
 */
export function applyBonus(currentScore: number, bonus: number, allowPerfectMatch: boolean = false): number {
  return clampScore(currentScore + bonus, allowPerfectMatch);
}

/**
 * 감점 적용 (최소값 미만 방지)
 */
export function applyPenalty(currentScore: number, penalty: number): number {
  return clampScore(currentScore - penalty, false);
}

// ============================================================================
// 전용자금 완벽 매칭 조건
// ============================================================================

/**
 * 전용자금 완벽 매칭 여부 확인
 * - 스마트공장 선택 + 스마트공장자금
 * - 재창업 + 재도전자금
 * - 긴급경영 + 긴급경영안정자금
 * - ESG 투자 + ESG 자금
 * - 사회적기업/장애인기업 + 전용자금
 */
export interface PerfectMatchCondition {
  profileFlag: string;
  fundCategory: string;
  fundIdPattern?: string;
}

export const PERFECT_MATCH_CONDITIONS: PerfectMatchCondition[] = [
  { profileFlag: 'hasSmartFactoryPlan', fundCategory: 'smartFactory', fundIdPattern: 'smart-factory' },
  { profileFlag: 'isRestart', fundCategory: 'restart', fundIdPattern: 'restart' },
  { profileFlag: 'isEmergencySituation', fundCategory: 'emergency', fundIdPattern: 'emergency' },
  { profileFlag: 'hasEsgInvestmentPlan', fundCategory: 'green', fundIdPattern: 'carbon-neutral' },
  { profileFlag: 'isGreenEnergyBusiness', fundCategory: 'greenEnergy', fundIdPattern: 'green-energy' },
  { profileFlag: 'isSocialEnterprise', fundCategory: 'socialValue', fundIdPattern: 'social' },
  { profileFlag: 'isDisabledStandard', fundCategory: 'socialValue', fundIdPattern: 'disabled' },
];
