/**
 * lib/policy-fund/last/matcher/company-scale.ts
 *
 * 기업규모 판정 함수
 * 정책자금 기관 기준에 맞춰 소상공인/소기업/중기업 판정
 */

import type { IndustryCategory, CompanyScale } from '../types';

// ============================================================================
// 기업규모 판정 상수
// ============================================================================

/**
 * 소상공인 기준: 10인 미만 업종
 * - 광업, 제조업, 건설업, 운수업
 */
const MICRO_10_INDUSTRIES: IndustryCategory[] = [
  'manufacturing',
  'construction',
  'logistics',
];

/**
 * 소상공인 기준: 5인 미만 업종
 * - 서비스업, 도소매업, 음식점업, 기타
 */
const MICRO_5_INDUSTRIES: IndustryCategory[] = [
  'it_service',
  'wholesale_retail',
  'food_service',
  'other_service',
];

// ============================================================================
// 전략산업 상수 (규모 무관 중진공 우선 지원)
// ============================================================================

/**
 * 전략산업 키워드 목록
 * - 정부 지정 12대 국가전략기술 및 신성장동력 분야
 * - 소상공인이어도 중진공 자금 우선 추천
 */
export const STRATEGIC_INDUSTRY_KEYWORDS = [
  // 이차전지/에너지
  '이차전지', '배터리', '리튬', '전고체', '에너지저장', 'ESS',
  // 반도체/디스플레이
  '반도체', '파운드리', '팹리스', '시스템반도체', '디스플레이', 'OLED',
  // 로봇/자동화
  '로봇', '협동로봇', '서비스로봇', '물류로봇', '자동화',
  // AI/빅데이터
  'AI', '인공지능', '머신러닝', '딥러닝', '빅데이터', 'LLM',
  // 바이오/헬스케어
  '바이오', '신약', '의료기기', '헬스케어', '줄기세포', 'CDO', 'CMO',
  // 미래차/자율주행
  '전기차', '수소차', '자율주행', '미래차', '모빌리티',
  // 항공/우주
  '드론', 'UAM', '항공', '우주', '위성',
  // 양자/첨단소재
  '양자', '양자컴퓨터', '첨단소재', '나노',
  // 탄소중립/그린
  '탄소중립', '수소', '신재생에너지', '태양광', '풍력',
] as const;

/**
 * 전략산업 업종코드 (KSIC 기준)
 * - C26: 전자부품, 컴퓨터, 영상, 음향 및 통신장비 제조업
 * - C21: 의료용 물질 및 의약품 제조업
 * - C28: 전기장비 제조업
 * - J62: 컴퓨터 프로그래밍, 시스템 통합 및 관리업
 */
export const STRATEGIC_KSIC_PREFIXES = [
  'C26', // 반도체, 전자부품
  'C21', // 바이오, 의약품
  'C28', // 이차전지, 전기장비
  'C29', // 자동차, 미래차
  'C30', // 항공우주
  'J62', // IT서비스, AI
  'J63', // 정보서비스
  'M70', // 연구개발업
] as const;

// ============================================================================
// 기업규모 판정 함수
// ============================================================================

/**
 * 기업규모 판정 (정책자금 기준)
 *
 * 우선순위: 직원 수 → 매출액 (보조)
 *
 * @param employeeCount 상시 근로자 수
 * @param industry 업종 카테고리
 * @param annualRevenue 연간 매출액 (원)
 * @returns CompanyScale - 'micro' | 'small' | 'medium' | 'large'
 *
 * @example
 * // 제조업, 직원 8명 → micro (소상공인)
 * determineCompanyScale(8, 'manufacturing') // 'micro'
 *
 * // 도소매, 직원 8명 → small (소기업)
 * determineCompanyScale(8, 'wholesale_retail') // 'small'
 *
 * // IT서비스, 직원 3명 → micro (소상공인)
 * determineCompanyScale(3, 'it_service') // 'micro'
 */
export function determineCompanyScale(
  employeeCount: number,
  industry?: IndustryCategory,
  annualRevenue?: number
): CompanyScale {
  // 직원 수 기준 없으면 small 기본값
  if (employeeCount === undefined || employeeCount === null) {
    return 'small';
  }

  // ========== 1단계: 소상공인(Micro) 판정 ==========
  // 업종에 따라 10인 미만 또는 5인 미만

  if (industry) {
    // 제조/건설/운수: 10인 미만
    if (MICRO_10_INDUSTRIES.includes(industry)) {
      if (employeeCount < 10) {
        return 'micro';
      }
    }
    // 서비스/도소매/음식: 5인 미만
    else if (MICRO_5_INDUSTRIES.includes(industry)) {
      if (employeeCount < 5) {
        return 'micro';
      }
    }
    // 'all' 또는 기타: 5인 미만 기본
    else {
      if (employeeCount < 5) {
        return 'micro';
      }
    }
  } else {
    // 업종 정보 없으면 5인 미만 기준
    if (employeeCount < 5) {
      return 'micro';
    }
  }

  // ========== 2단계: 소기업(Small) 판정 ==========
  // 직원 50인 미만 또는 매출 120억 이하
  if (employeeCount < 50) {
    return 'small';
  }

  // 매출 기준 보조 (직원 수가 50 이상이어도 매출이 낮으면 small)
  if (annualRevenue !== undefined && annualRevenue <= 12_000_000_000) {
    return 'small';
  }

  // ========== 3단계: 중기업(Medium) 판정 ==========
  // 직원 300인 미만 또는 매출 1,500억 이하
  if (employeeCount < 300) {
    return 'medium';
  }

  if (annualRevenue !== undefined && annualRevenue <= 150_000_000_000) {
    return 'medium';
  }

  // ========== 4단계: 대기업 ==========
  // CompanyScale에 'large'가 없으므로 medium으로 처리
  return 'medium';
}

/**
 * 소상공인 여부 판정
 *
 * @param employeeCount 상시 근로자 수
 * @param industry 업종 카테고리
 * @returns true if 소상공인 (micro)
 */
export function isMicroEnterprise(
  employeeCount: number,
  industry?: IndustryCategory
): boolean {
  return determineCompanyScale(employeeCount, industry) === 'micro';
}

/**
 * 소상공인 기준 직원 수 반환
 *
 * @param industry 업종 카테고리
 * @returns 해당 업종의 소상공인 기준 직원 수
 */
export function getMicroThreshold(industry?: IndustryCategory): number {
  if (!industry) return 5;

  if (MICRO_10_INDUSTRIES.includes(industry)) {
    return 10;
  }
  return 5;
}

/**
 * 기업규모 한글 라벨
 */
export const COMPANY_SCALE_LABELS: Record<CompanyScale, string> = {
  micro: '소상공인',
  small: '소기업',
  medium: '중기업',
  venture: '벤처기업',
  innobiz: '이노비즈',
  mainbiz: '메인비즈',
  patent: '특허보유',
  research_institute: '기업부설연구소',
};

/**
 * 기업규모에 따른 권장 기관
 */
export function getRecommendedInstitutions(scale: CompanyScale): string[] {
  switch (scale) {
    case 'micro':
      return ['semas', 'kosmes', 'kodit'];
    case 'small':
      return ['kosmes', 'kodit', 'kibo'];
    case 'medium':
      return ['kosmes', 'kodit', 'kibo'];
    default:
      return ['kosmes', 'kodit', 'kibo'];
  }
}

// ============================================================================
// 전략산업 판별 함수
// ============================================================================

/**
 * 전략산업 여부 판별
 *
 * 전략산업에 해당하면 소상공인이어도 중진공 자금 우선 추천
 *
 * @param industryName 업종명 (예: "이차전지 제조업", "AI 솔루션 개발")
 * @param industryCode KSIC 업종코드 (예: "C2629", "J6201")
 * @param businessDescription 사업 설명 (옵션)
 * @returns true if 전략산업
 *
 * @example
 * isStrategicIndustry('이차전지 제조업') // true
 * isStrategicIndustry('음식점업') // false
 * isStrategicIndustry('소프트웨어 개발', 'J6201', 'AI 기반 서비스') // true
 */
export function isStrategicIndustry(
  industryName?: string,
  industryCode?: string,
  businessDescription?: string
): boolean {
  // 1. 업종코드 기반 판별 (가장 정확)
  if (industryCode) {
    const codeUpper = industryCode.toUpperCase();
    for (const prefix of STRATEGIC_KSIC_PREFIXES) {
      if (codeUpper.startsWith(prefix)) {
        return true;
      }
    }
  }

  // 2. 업종명 키워드 기반 판별
  if (industryName) {
    const nameLower = industryName.toLowerCase();
    for (const keyword of STRATEGIC_INDUSTRY_KEYWORDS) {
      if (nameLower.includes(keyword.toLowerCase())) {
        return true;
      }
    }
  }

  // 3. 사업 설명 키워드 기반 판별 (보조)
  if (businessDescription) {
    const descLower = businessDescription.toLowerCase();
    for (const keyword of STRATEGIC_INDUSTRY_KEYWORDS) {
      if (descLower.includes(keyword.toLowerCase())) {
        return true;
      }
    }
  }

  return false;
}

/**
 * 전략산업 가산점 반환
 *
 * @param isStrategic 전략산업 여부
 * @param isMicro 소상공인 여부
 * @returns 중진공 추가 가산점 (0 또는 20)
 */
export function getStrategicIndustryBonus(
  isStrategic: boolean,
  isMicro: boolean
): number {
  // 전략산업 + 소상공인 = 중진공 추가 가산점 +20
  // (기본 소상공인 kosmes +20 → +40으로 상향, semas +30 추월)
  if (isStrategic && isMicro) {
    return 20;
  }
  return 0;
}
