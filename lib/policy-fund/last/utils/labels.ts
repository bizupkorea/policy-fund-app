/**
 * lib/policy-fund/last/utils/labels.ts
 *
 * 라벨 변환 유틸리티 함수
 * 코드값을 한글 라벨로 변환
 */

import type {
  IndustryCategory,
  CompanyScale,
  OwnerCharacteristic,
  BusinessAgeException,
  FundTrack,
  MatchLevel,
} from '../types';

// ============================================================================
// 업종 라벨
// ============================================================================

const INDUSTRY_LABELS: Record<IndustryCategory, string> = {
  manufacturing: '제조업',
  it_service: 'IT/지식서비스업',
  wholesale_retail: '도소매업',
  food_service: '음식점업',
  construction: '건설업',
  logistics: '운수/물류업',
  other_service: '기타 서비스업',
  all: '전 업종',
};

export function getIndustryLabel(industry: IndustryCategory): string {
  return INDUSTRY_LABELS[industry] || industry;
}

// ============================================================================
// 기업 규모/인증 라벨
// ============================================================================

const CERTIFICATION_LABELS: Record<CompanyScale, string> = {
  micro: '소공인',
  small: '소기업',
  medium: '중소기업',
  venture: '벤처기업',
  innobiz: '이노비즈',
  mainbiz: '메인비즈',
  patent: '특허보유',
  research_institute: '기업부설연구소',
};

export function getCertificationLabel(cert: CompanyScale): string {
  return CERTIFICATION_LABELS[cert] || cert;
}

// ============================================================================
// 대표자 특성 라벨
// ============================================================================

const OWNER_CHAR_LABELS: Record<OwnerCharacteristic, string> = {
  youth: '청년',
  female: '여성',
  disabled: '장애인',
  veteran: '보훈대상자',
  general: '일반',
};

export function getOwnerCharLabel(char: OwnerCharacteristic): string {
  return OWNER_CHAR_LABELS[char] || char;
}

// ============================================================================
// 업력 예외 조건 라벨
// ============================================================================

const EXCEPTION_LABELS: Record<BusinessAgeException, string> = {
  youth_startup_academy: '청년창업사관학교 졸업',
  global_startup_academy: '글로벌창업사관학교 졸업',
  kibo_youth_guarantee: '기보 청년창업우대보증',
  startup_success_package: '창업성공패키지 선정',
  tips_program: 'TIPS 프로그램 선정',
};

export function getExceptionLabel(exception: BusinessAgeException): string {
  return EXCEPTION_LABELS[exception] || exception;
}

// ============================================================================
// 트랙 라벨
// ============================================================================

const TRACK_LABELS: Record<FundTrack, string> = {
  exclusive: '전용자금',
  policy_linked: '정책연계',
  general: '일반',
  guarantee: '보증',
};

export function getTrackLabel(track: FundTrack): string {
  return TRACK_LABELS[track] || track;
}

// ============================================================================
// 매칭 레벨 라벨
// ============================================================================

const MATCH_LEVEL_LABELS: Record<MatchLevel, string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
};

export function getMatchLevelLabel(level: MatchLevel): string {
  return MATCH_LEVEL_LABELS[level] || level;
}

// ============================================================================
// 라벨 상수 export (직접 사용 가능)
// ============================================================================

export {
  INDUSTRY_LABELS,
  CERTIFICATION_LABELS,
  OWNER_CHAR_LABELS,
  EXCEPTION_LABELS,
  TRACK_LABELS,
  MATCH_LEVEL_LABELS,
};
