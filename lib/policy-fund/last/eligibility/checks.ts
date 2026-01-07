/**
 * lib/policy-fund/last/eligibility/checks.ts
 *
 * 개별 조건 체크 함수들
 * 업력, 매출, 직원 수, 업종, 신용등급 등
 */

import type {
  PolicyFundKnowledge,
  EligibilityCriteria,
  IndustryCategory,
  CompanyScale,
  OwnerCharacteristic,
  BusinessAgeException,
  FundingPurpose,
} from '../knowledge-base';

import type {
  CompanyProfile,
  CheckResult,
} from '../types';

import {
  formatCurrency,
  getIndustryLabel,
  getCertificationLabel,
  getOwnerCharLabel,
  getExceptionLabel,
} from '../utils';

// ============================================================================
// 전역 결격 조건 타입
// ============================================================================

export interface GlobalExclusionResult {
  /** 즉시 제외 (하드컷) - 어떤 자금도 불가 */
  isHardExcluded: boolean;
  /** 조건부 제외 (분납 승인 등 예외 가능) */
  isConditional: boolean;
  /** 제외 사유 목록 */
  exclusionReasons: CheckResult[];
  /** 조건부 사유 목록 (예외 가능) */
  conditionalReasons: CheckResult[];
}

// ============================================================================
// 절대적 제외 조건 체크 (하드컷)
// ============================================================================

export function checkExclusionConditions(
  profile: CompanyProfile,
  criteria: EligibilityCriteria
): GlobalExclusionResult {
  const exclusionReasons: CheckResult[] = [];
  const conditionalReasons: CheckResult[] = [];

  // ========== 하드컷: 즉시 제외 (예외 없음) ==========

  // 휴/폐업 - 절대 불가
  if (profile.isInactive) {
    exclusionReasons.push({
      condition: '휴/폐업',
      status: 'fail',
      description: '휴업 또는 폐업 상태의 기업은 정책자금 신청이 불가합니다',
      impact: -100,
    });
  }

  // 금융기관 연체 (현재 연체 중) - 절대 불가
  if (profile.hasBankDelinquency) {
    exclusionReasons.push({
      condition: '금융기관 연체',
      status: 'fail',
      description: '금융기관 연체 중인 기업은 정책자금 신청이 불가합니다',
      impact: -100,
    });
  }

  // 신용관리정보 등록 (현재) - 절대 불가
  if (profile.hasCreditIssue) {
    exclusionReasons.push({
      condition: '신용관리정보 등록',
      status: 'fail',
      description: '신용관리정보가 등록된 기업은 정책자금 신청이 불가합니다',
      impact: -100,
    });
  }

  // ========== 조건부: 예외 가능 (분납 승인 등) ==========

  // 세금 체납 - 분납 승인 시 예외 가능
  if (profile.hasTaxDelinquency) {
    // 분납 승인 여부 체크 (hasTaxInstallmentApproval 필드가 있다면)
    const hasInstallmentApproval = (profile as any).hasTaxInstallmentApproval;

    if (hasInstallmentApproval) {
      conditionalReasons.push({
        condition: '세금 체납 (분납 승인)',
        status: 'warning',
        description: '세금 체납 중이나 분납 승인으로 신청 가능 (증빙 필요)',
        impact: -20,
      });
    } else {
      exclusionReasons.push({
        condition: '세금 체납',
        status: 'fail',
        description: '세금 체납 중인 기업은 정책자금 신청이 불가합니다 (분납 승인 시 예외)',
        impact: -100,
      });
    }
  }

  return {
    isHardExcluded: exclusionReasons.length > 0,
    isConditional: conditionalReasons.length > 0,
    exclusionReasons,
    conditionalReasons,
  };
}

// ============================================================================
// 업력 조건 체크
// ============================================================================

export function checkBusinessAge(
  businessAge: number,
  criteria: {
    min?: number;
    max?: number;
    maxWithException?: number;
    exceptions?: BusinessAgeException[];
    description: string
  },
  companyExceptions?: BusinessAgeException[]
): CheckResult {
  const { min, max, maxWithException, exceptions, description } = criteria;

  if (min !== undefined && businessAge < min) {
    return {
      condition: '업력 조건',
      status: 'fail',
      description: `업력 ${min}년 이상 필요 (현재: ${businessAge}년)`,
      impact: -30,
    };
  }

  if (max !== undefined && businessAge > max) {
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

// ============================================================================
// 매출 조건 체크
// ============================================================================

export function checkRevenue(
  revenue: number,
  criteria: { min?: number; max?: number; description: string }
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
// 직원 수 조건 체크
// ============================================================================

export function checkEmployeeCount(
  count: number,
  criteria: { min?: number; max?: number; description: string }
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
// 업종 조건 체크
// ============================================================================

export function checkIndustry(
  industry: IndustryCategory,
  industryDetail: string | undefined,
  allowedIndustries: IndustryCategory[] | undefined,
  excludedIndustries: string[] | undefined
): CheckResult {
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

  return {
    condition: '업종 조건',
    status: 'pass',
    description: '업종 제한 없음',
    impact: 5,
  };
}

// ============================================================================
// 신용등급 조건 체크
// ============================================================================

export function checkCreditRating(
  rating: number,
  criteria: { min?: number; max?: number; description: string }
): CheckResult {
  const { max, description } = criteria;

  if (max !== undefined && rating > max) {
    return {
      condition: '신용등급 조건',
      status: 'fail',
      description: `신용등급 ${max}등급 이상 필요 (현재: ${rating}등급)`,
      impact: -25,
    };
  }

  return {
    condition: '신용등급 조건',
    status: 'pass',
    description: `신용등급 조건 충족 (${description})`,
    impact: 10,
  };
}

// ============================================================================
// 수출실적 체크
// ============================================================================

export function checkExportRequirement(hasExportExperience?: boolean): CheckResult {
  if (hasExportExperience) {
    return {
      condition: '수출실적',
      status: 'pass',
      description: '수출실적 보유 기업',
      impact: 10,
    };
  }

  return {
    condition: '수출실적',
    status: 'warning',
    description: '수출실적 또는 수출계획 필요 (미보유 시 신청 불가)',
    impact: -15,
  };
}

// ============================================================================
// 자금 용도 체크
// ============================================================================

export function checkFundingPurpose(
  requested: 'working' | 'facility' | 'both',
  supported: FundingPurpose
): CheckResult {
  const purposeNames = {
    working: '운전자금',
    facility: '시설자금',
    both: '운전/시설자금'
  };

  if (requested === 'working' && !supported.working) {
    return {
      condition: '자금 용도',
      status: 'fail',
      description: '운전자금 미지원 (시설자금 전용 상품)',
      impact: -100,
    };
  }

  if (requested === 'facility' && !supported.facility) {
    return {
      condition: '자금 용도',
      status: 'fail',
      description: '시설자금 미지원 (운전자금 전용 상품)',
      impact: -100,
    };
  }

  if (requested === 'both' && (!supported.working || !supported.facility)) {
    const supportedPurposes = [];
    if (supported.working) supportedPurposes.push('운전자금');
    if (supported.facility) supportedPurposes.push('시설자금');
    return {
      condition: '자금 용도',
      status: 'warning',
      description: `부분 지원: ${supportedPurposes.join(', ')}만 가능`,
      impact: -10,
    };
  }

  return {
    condition: '자금 용도',
    status: 'pass',
    description: `${purposeNames[requested]} 지원 가능`,
    impact: 5,
  };
}

// ============================================================================
// 인증 조건 체크
// ============================================================================

export function checkCertifications(
  companyCerts: CompanyScale[],
  requiredCerts: CompanyScale[]
): CheckResult {
  const hasRequiredCert = requiredCerts.some((cert) =>
    companyCerts.includes(cert)
  );

  if (!hasRequiredCert) {
    const certLabels = requiredCerts.map(getCertificationLabel).join(', ');
    return {
      condition: '인증 조건',
      status: 'fail',
      description: `필수 인증 미보유 (필요: ${certLabels})`,
      impact: -20,
    };
  }

  return {
    condition: '인증 조건',
    status: 'pass',
    description: '필수 인증 보유',
    impact: 30,
  };
}

// ============================================================================
// 대표자 특성 체크
// ============================================================================

export function checkOwnerCharacteristics(
  ownerChars: OwnerCharacteristic[],
  preferredChars: OwnerCharacteristic[],
  isRequiredCondition: boolean = false
): CheckResult {
  const hasPreferred = preferredChars.some((char) => ownerChars.includes(char));

  if (isRequiredCondition && preferredChars.includes('youth')) {
    if (ownerChars.includes('youth')) {
      return {
        condition: '청년 대표자',
        status: 'pass',
        description: '청년 대표자 조건 충족 (만 39세 이하)',
        impact: 30,
      };
    } else {
      return {
        condition: '청년 대표자',
        status: 'fail',
        description: '청년 전용 자금: 만 39세 이하 대표자만 신청 가능',
        impact: -40,
      };
    }
  }

  if (hasPreferred) {
    const charLabels = ownerChars
      .filter((c) => preferredChars.includes(c))
      .map(getOwnerCharLabel)
      .join(', ');
    return {
      condition: '대표자 우대',
      status: 'bonus',
      description: `대표자 우대 대상 (${charLabels})`,
      impact: 10,
    };
  }

  return {
    condition: '대표자 우대',
    status: 'pass',
    description: '대표자 우대 해당 없음',
    impact: 0,
  };
}

// ============================================================================
// 추가 우대 조건 체크
// ============================================================================

export function checkAdditionalBonuses(
  profile: CompanyProfile,
  fund: PolicyFundKnowledge
): CheckResult[] {
  const bonuses: CheckResult[] = [];

  if (
    profile.certifications?.includes('venture') ||
    profile.certifications?.includes('innobiz')
  ) {
    bonuses.push({
      condition: '벤처/이노비즈 인증',
      status: 'bonus',
      description: '벤처 또는 이노비즈 인증 기업 우대',
      impact: 10,
    });
  }

  if (profile.hasExportExperience && fund.id.includes('new-market')) {
    bonuses.push({
      condition: '수출 기업',
      status: 'bonus',
      description: '수출 실적 보유 기업 우대',
      impact: 30,
    });
  }

  if (profile.hasTechAssets && fund.institutionId === 'kibo') {
    bonuses.push({
      condition: '기술력 보유',
      status: 'bonus',
      description: '특허/기술 보유 기업 우대 (기보)',
      impact: 30,
    });
  }

  if (profile.isEmergencySituation && fund.id.includes('emergency')) {
    bonuses.push({
      condition: '긴급 상황',
      status: 'bonus',
      description: '긴급 경영안정 대상',
      impact: 20,
    });
  }

  return bonuses;
}
