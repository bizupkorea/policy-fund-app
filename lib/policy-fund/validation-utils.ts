/**
 * 정책자금 검증 유틸리티 (공통 함수 모음)
 *
 * 이 파일은 eligibility-checker.ts, matching-engine.ts 등에서
 * 중복 사용되던 검증 함수들을 통합한 것입니다.
 */

import {
  IndustryCategory,
  CompanyScale,
  OwnerCharacteristic,
  BusinessAgeException,
} from './knowledge-base';

// ============================================================================
// 타입 정의
// ============================================================================

/** 개별 조건 체크 결과 */
export interface CheckResult {
  condition: string;
  status: 'pass' | 'fail' | 'warning';
  description: string;
  impact: number; // 점수 영향 (-30 ~ +30)
}

/** 업력 기준 */
export interface BusinessAgeCriteria {
  min?: number;
  max?: number;
  maxWithException?: number;
  exceptions?: BusinessAgeException[];
  description: string;
}

/** 매출/직원수 기준 */
export interface NumericCriteria {
  min?: number;
  max?: number;
  description: string;
}

// ============================================================================
// 업력 체크
// ============================================================================

/**
 * 업력 조건 체크
 */
export function checkBusinessAge(
  businessAge: number,
  criteria: BusinessAgeCriteria,
  companyExceptions?: BusinessAgeException[]
): CheckResult {
  const { min, max, maxWithException, exceptions, description } = criteria;

  // 최소 업력 체크
  if (min !== undefined && businessAge < min) {
    return {
      condition: '업력 조건',
      status: 'fail',
      description: `업력 ${min}년 이상 필요 (현재: ${businessAge}년)`,
      impact: -30,
    };
  }

  // 최대 업력 체크
  if (max !== undefined && businessAge > max) {
    // 예외 조건 체크
    if (maxWithException && exceptions && companyExceptions) {
      const hasValidException = exceptions.some(ex =>
        companyExceptions.includes(ex)
      );

      if (hasValidException && businessAge <= maxWithException) {
        const matchedExceptions = exceptions.filter(ex =>
          companyExceptions.includes(ex)
        );
        const exceptionLabel = getExceptionLabel(matchedExceptions[0]);
        return {
          condition: '업력 조건 (예외 적용)',
          status: 'pass',
          description: `${exceptionLabel} 예외 적용으로 ${maxWithException}년까지 가능 (현재: ${businessAge}년)`,
          impact: 10,
        };
      }
    }

    // 예외 조건이 있지만 기업이 해당하지 않는 경우
    if (maxWithException && exceptions && (!companyExceptions || companyExceptions.length === 0)) {
      return {
        condition: '업력 조건',
        status: 'warning',
        description: `업력 ${max}년 초과 (${businessAge}년). 단, 청창사/글로벌창업사관학교 졸업 시 ${maxWithException}년까지 가능`,
        impact: -15,
      };
    }

    return {
      condition: '업력 조건',
      status: 'fail',
      description: `업력 ${max}년 이내 기업 대상 (현재: ${businessAge}년)`,
      impact: -30,
    };
  }

  return {
    condition: '업력 조건',
    status: 'pass',
    description: `업력 조건 충족 (${description})`,
    impact: 10,
  };
}

/**
 * 업력 예외 조건 라벨
 */
export function getExceptionLabel(exception: BusinessAgeException): string {
  const labels: Record<BusinessAgeException, string> = {
    youth_startup_academy: '청년창업사관학교 졸업',
    global_startup_academy: '글로벌창업사관학교 졸업',
    kibo_youth_guarantee: '기보 청년창업우대보증',
    startup_success_package: '창업성공패키지 선정',
    tips_program: 'TIPS 프로그램 선정',
  };
  return labels[exception] || exception;
}

// ============================================================================
// 매출 체크
// ============================================================================

/**
 * 매출 조건 체크
 */
export function checkRevenue(
  revenue: number,
  criteria: NumericCriteria
): CheckResult {
  const { min, max, description } = criteria;

  if (min !== undefined && revenue < min) {
    return {
      condition: '매출 조건',
      status: 'fail',
      description: `최소 매출 ${formatCurrency(min)} 이상 필요 (현재: ${formatCurrency(revenue)})`,
      impact: -20,
    };
  }

  if (max !== undefined && revenue > max) {
    return {
      condition: '매출 조건',
      status: 'fail',
      description: `매출 ${formatCurrency(max)} 이하 기업 대상 (현재: ${formatCurrency(revenue)})`,
      impact: -20,
    };
  }

  return {
    condition: '매출 조건',
    status: 'pass',
    description: `매출 조건 충족 (${description})`,
    impact: 10,
  };
}

// ============================================================================
// 직원 수 체크
// ============================================================================

/**
 * 직원 수 조건 체크
 */
export function checkEmployeeCount(
  count: number,
  criteria: NumericCriteria
): CheckResult {
  const { min, max, description } = criteria;

  if (min !== undefined && count < min) {
    return {
      condition: '직원 수 조건',
      status: 'fail',
      description: `직원 ${min}인 이상 필요 (현재: ${count}인)`,
      impact: -25,
    };
  }

  if (max !== undefined && count > max) {
    return {
      condition: '직원 수 조건',
      status: 'fail',
      description: `직원 ${max}인 미만 기업 대상 (현재: ${count}인)`,
      impact: -25,
    };
  }

  return {
    condition: '직원 수 조건',
    status: 'pass',
    description: `직원 수 조건 충족 (${description})`,
    impact: 10,
  };
}

// ============================================================================
// 업종 체크
// ============================================================================

/**
 * 업종 조건 체크
 */
export function checkIndustry(
  industry: IndustryCategory,
  industryDetail: string | undefined,
  allowedIndustries: IndustryCategory[] | undefined,
  excludedIndustries: string[] | undefined
): CheckResult {
  // 제외 업종 체크
  if (excludedIndustries && industryDetail) {
    for (const excluded of excludedIndustries) {
      if (industryDetail.includes(excluded)) {
        return {
          condition: '업종 조건',
          status: 'fail',
          description: `제외 업종에 해당 (${excluded})`,
          impact: -30,
        };
      }
    }
  }

  // 허용 업종 체크
  if (allowedIndustries) {
    if (allowedIndustries.includes('all')) {
      return {
        condition: '업종 조건',
        status: 'pass',
        description: '전 업종 지원 대상',
        impact: 5,
      };
    }

    if (allowedIndustries.includes(industry)) {
      return {
        condition: '업종 조건',
        status: 'pass',
        description: `업종 조건 충족 (${getIndustryLabel(industry)})`,
        impact: 10,
      };
    }

    return {
      condition: '업종 조건',
      status: 'warning',
      description: `주요 지원 업종이 아님 (확인 필요)`,
      impact: -5,
    };
  }

  // 업종 조건이 없는 경우 (전 업종)
  return {
    condition: '업종 조건',
    status: 'pass',
    description: '업종 제한 없음',
    impact: 5,
  };
}

// ============================================================================
// 포맷팅 유틸리티
// ============================================================================

/**
 * 금액 포맷팅 (원 → 억원/만원)
 */
export function formatCurrency(value: number): string {
  if (value >= 100000000) {
    const billions = value / 100000000;
    return billions === Math.floor(billions)
      ? `${billions}억원`
      : `${billions.toFixed(1)}억원`;
  }
  if (value >= 10000) {
    return `${Math.floor(value / 10000)}만원`;
  }
  return `${value.toLocaleString()}원`;
}

/**
 * 업종 라벨
 */
export function getIndustryLabel(industry: IndustryCategory): string {
  const labels: Record<IndustryCategory, string> = {
    manufacturing: '제조업',
    it_service: 'IT/지식서비스업',
    wholesale_retail: '도소매업',
    food_service: '음식점업',
    construction: '건설업',
    logistics: '운수/물류업',
    other_service: '기타 서비스업',
    all: '전 업종',
  };
  return labels[industry] || industry;
}

/**
 * 기업규모/인증 라벨
 */
export function getCertificationLabel(cert: CompanyScale): string {
  const labels: Record<CompanyScale, string> = {
    micro: '소공인',
    small: '소기업',
    medium: '중소기업',
    venture: '벤처기업',
    innobiz: '이노비즈',
    mainbiz: '메인비즈',
    patent: '특허보유',
    research_institute: '기업부설연구소',
  };
  return labels[cert] || cert;
}

/**
 * 대표자 특성 라벨
 */
export function getOwnerCharLabel(char: OwnerCharacteristic): string {
  const labels: Record<OwnerCharacteristic, string> = {
    youth: '청년',
    female: '여성',
    disabled: '장애인',
    veteran: '보훈대상자',
    general: '일반',
  };
  return labels[char] || char;
}

// ============================================================================
// 점수 계산 유틸리티
// ============================================================================

/**
 * CheckResult 배열에서 총 점수 계산
 */
export function calculateTotalImpact(results: CheckResult[]): number {
  return results.reduce((sum, r) => sum + r.impact, 0);
}

/**
 * 조건 결과 분류
 */
export function categorizeResults(results: CheckResult[]): {
  passed: CheckResult[];
  failed: CheckResult[];
  warnings: CheckResult[];
} {
  return {
    passed: results.filter(r => r.status === 'pass'),
    failed: results.filter(r => r.status === 'fail'),
    warnings: results.filter(r => r.status === 'warning'),
  };
}
