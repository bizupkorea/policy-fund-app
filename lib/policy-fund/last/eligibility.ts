/**
 * lib/policy-fund/last/eligibility.ts
 *
 * /test 페이지 전용 자격 체크 모듈 (완전 독립)
 * 기존 lib/policy-fund/eligibility-checker.ts 복사본
 */

import {
  PolicyFundKnowledge,
  EligibilityCriteria,
  IndustryCategory,
  CompanyScale,
  OwnerCharacteristic,
  BusinessAgeException,
  FundingPurpose,
  POLICY_FUND_KNOWLEDGE_BASE,
} from './knowledge-base';

import {
  CompanyProfile,
  EligibilityResult,
  CheckResult,
} from './types';

// ============================================================================
// 포맷팅 유틸리티 (독립 정의)
// ============================================================================

function formatCurrency(value: number): string {
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

function getIndustryLabel(industry: IndustryCategory): string {
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

function getCertificationLabel(cert: CompanyScale): string {
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

function getOwnerCharLabel(char: OwnerCharacteristic): string {
  const labels: Record<OwnerCharacteristic, string> = {
    youth: '청년',
    female: '여성',
    disabled: '장애인',
    veteran: '보훈대상자',
    general: '일반',
  };
  return labels[char] || char;
}

function getExceptionLabel(exception: BusinessAgeException): string {
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
// 자격 체크 함수
// ============================================================================

/**
 * 모든 정책자금에 대해 자격 체크
 */
export function checkAllFundsEligibility(
  profile: CompanyProfile
): EligibilityResult[] {
  return POLICY_FUND_KNOWLEDGE_BASE.map((fund) =>
    checkFundEligibility(profile, fund)
  ).sort((a, b) => b.eligibilityScore - a.eligibilityScore);
}

/**
 * 특정 정책자금에 대해 자격 체크
 */
export function checkFundEligibility(
  profile: CompanyProfile,
  fund: PolicyFundKnowledge
): EligibilityResult {
  const passedConditions: CheckResult[] = [];
  const failedConditions: CheckResult[] = [];
  const warningConditions: CheckResult[] = [];
  const bonusConditions: CheckResult[] = [];

  const criteria = fund.eligibility;

  // ========== 1단계: 절대적 제외 조건 체크 ==========
  const exclusionCheck = checkExclusionConditions(profile, criteria);
  if (exclusionCheck.hasExclusion) {
    failedConditions.push(...exclusionCheck.results);
  }

  // ========== 2단계: 필수 조건 체크 ==========

  // 업력 체크 (예외 조건 포함)
  if (criteria.businessAge) {
    const ageCheck = checkBusinessAge(
      profile.businessAge,
      criteria.businessAge,
      profile.businessAgeExceptions
    );
    if (ageCheck.status === 'pass') {
      passedConditions.push(ageCheck);
    } else if (ageCheck.status === 'fail') {
      failedConditions.push(ageCheck);
    } else {
      warningConditions.push(ageCheck);
    }
  }

  // 매출 체크
  if (criteria.revenue && profile.annualRevenue !== undefined) {
    const revenueCheck = checkRevenue(profile.annualRevenue, criteria.revenue);
    if (revenueCheck.status === 'pass') {
      passedConditions.push(revenueCheck);
    } else if (revenueCheck.status === 'fail') {
      failedConditions.push(revenueCheck);
    }
  }

  // 직원 수 체크
  if (criteria.employeeCount && profile.employeeCount !== undefined) {
    const employeeCheck = checkEmployeeCount(
      profile.employeeCount,
      criteria.employeeCount
    );
    if (employeeCheck.status === 'pass') {
      passedConditions.push(employeeCheck);
    } else if (employeeCheck.status === 'fail') {
      failedConditions.push(employeeCheck);
    }
  }

  // 업종 체크
  if (criteria.allowedIndustries || criteria.excludedIndustries) {
    const industryCheck = checkIndustry(
      profile.industry,
      profile.industryDetail,
      criteria.allowedIndustries,
      criteria.excludedIndustries
    );
    if (industryCheck.status === 'pass') {
      passedConditions.push(industryCheck);
    } else if (industryCheck.status === 'fail') {
      failedConditions.push(industryCheck);
    } else {
      warningConditions.push(industryCheck);
    }
  }

  // 신용등급 체크
  if (criteria.creditRating && profile.creditRating !== undefined) {
    const creditCheck = checkCreditRating(
      profile.creditRating,
      criteria.creditRating
    );
    if (creditCheck.status === 'pass') {
      passedConditions.push(creditCheck);
    } else if (creditCheck.status === 'fail') {
      failedConditions.push(creditCheck);
    }
  }

  // 인증 조건 체크
  if (criteria.requiredCertifications) {
    const certCheck = checkCertifications(
      profile.certifications || [],
      criteria.requiredCertifications
    );
    if (certCheck.status === 'pass') {
      passedConditions.push(certCheck);
    } else if (certCheck.status === 'fail') {
      failedConditions.push(certCheck);
    }
  }

  // 수출실적 요구 체크
  if (criteria.requiresExport) {
    const exportCheck = checkExportRequirement(profile.hasExportExperience);
    if (exportCheck.status === 'pass') {
      passedConditions.push(exportCheck);
    } else if (exportCheck.status === 'warning') {
      warningConditions.push(exportCheck);
    }
  }

  // 자금 용도 체크
  if (profile.requestedFundingPurpose && fund.fundingPurpose) {
    const purposeCheck = checkFundingPurpose(
      profile.requestedFundingPurpose,
      fund.fundingPurpose
    );
    if (purposeCheck.status === 'pass') {
      passedConditions.push(purposeCheck);
    } else if (purposeCheck.status === 'fail') {
      failedConditions.push(purposeCheck);
    } else if (purposeCheck.status === 'warning') {
      warningConditions.push(purposeCheck);
    }
  }

  // ========== 3단계: 대표자 특성 체크 ==========
  // 청년 전용 자금인지 확인 (자금명에 '청년' 포함)
  const isYouthOnlyFund = fund.name.includes('청년') || fund.id.includes('youth');

  // ★★★ requiredConditions 체크 (v3) ★★★
  if (criteria.requiredConditions) {
    const reqCond = criteria.requiredConditions;
    if (reqCond.isYouthCompany === true && !profile.ownerCharacteristics?.includes('youth')) {
      failedConditions.push({ condition: '청년 대표자 필수', status: 'fail', description: '청년 전용 자금: 만 39세 이하만', impact: -50 });
    }
    if (reqCond.isFemale === true && !profile.ownerCharacteristics?.includes('female')) {
      failedConditions.push({ condition: '여성 대표자 필수', status: 'fail', description: '여성 전용 자금: 여성 대표자만', impact: -50 });
    }
    if (reqCond.isDisabled === true && !profile.ownerCharacteristics?.includes('disabled')) {
      failedConditions.push({ condition: '장애인 대표자 필수', status: 'fail', description: '장애인 전용 자금: 장애인만', impact: -50 });
    }
    if (reqCond.hasRndActivity === true && !profile.hasTechAssets) {
      failedConditions.push({ condition: 'R&D 필수', status: 'fail', description: '기술/R&D 자금: 기술 근거 필요', impact: -50 });
    }
    if (reqCond.hasExportRevenue === true && !profile.hasExportExperience) {
      failedConditions.push({ condition: '수출 실적 필수', status: 'fail', description: '수출 자금: 수출 실적 필요', impact: -50 });
    }
  }

  if (criteria.preferredOwnerTypes) {
    const ownerCheck = checkOwnerCharacteristics(
      profile.ownerCharacteristics || [],
      criteria.preferredOwnerTypes,
      isYouthOnlyFund
    );
    if (ownerCheck.status === 'bonus') {
      bonusConditions.push(ownerCheck);
    } else if (ownerCheck.status === 'fail') {
      failedConditions.push(ownerCheck);
    } else if (ownerCheck.status === 'pass') {
      passedConditions.push(ownerCheck);
    }
  }

  // 추가 우대 체크 (벤처/이노비즈, 수출기업, 기술기업)
  const additionalBonuses = checkAdditionalBonuses(profile, fund);
  bonusConditions.push(...additionalBonuses);

  // ========== 4단계: 재창업자금 체크 ==========
  const isRestartOnlyFund = fund.id === 'kosmes-restart' || fund.name.includes('재창업') || fund.name.includes('재도약');

  if (isRestartOnlyFund) {
    if (profile.isRestart) {
      passedConditions.push({
        condition: '재창업 기업',
        status: 'pass',
        description: '재창업 기업 조건 충족 - 재창업자금 최우선 추천',
        impact: 30,
      });
    } else {
      failedConditions.push({
        condition: '재창업 기업',
        status: 'fail',
        description: '재창업자금은 재창업 기업만 신청 가능 (과거 폐업 후 재창업 필요)',
        impact: -50,
      });
    }
  } else {
    if (profile.isRestart) {
      bonusConditions.push({
        condition: '재창업 기업',
        status: 'bonus',
        description: '재창업 기업 (재도전 지원 우대 가능)',
        impact: 5,
      });
    }
  }

  // ========== 점수 계산 ==========
  const eligibilityScore = calculateScore(
    passedConditions,
    failedConditions,
    warningConditions,
    bonusConditions
  );

  // ========== 최종 결과 ==========
  const hasCriticalFailure = failedConditions.some(
    (c) => c.impact <= -30
  );
  const isEligible = !hasCriticalFailure && eligibilityScore >= 50;

  return {
    fundId: fund.id,
    fundName: fund.name,
    institutionId: fund.institutionId,
    isEligible,
    eligibilityScore,
    passedConditions,
    failedConditions,
    warningConditions,
    bonusConditions,
    summary: generateSummary(isEligible, passedConditions, failedConditions),
    recommendation: generateRecommendation(
      isEligible,
      eligibilityScore,
      failedConditions,
      fund
    ),
  };
}

// ============================================================================
// 개별 조건 체크 함수들
// ============================================================================

function checkExclusionConditions(
  profile: CompanyProfile,
  criteria: EligibilityCriteria
): { hasExclusion: boolean; results: CheckResult[] } {
  const results: CheckResult[] = [];

  // 세금 체납
  if (profile.hasTaxDelinquency) {
    results.push({
      condition: '세금 체납',
      status: 'fail',
      description: '세금 체납 중인 기업은 정책자금 신청이 불가합니다',
      impact: -50,
    });
  }

  // 금융기관 연체
  if (profile.hasBankDelinquency) {
    results.push({
      condition: '금융기관 연체',
      status: 'fail',
      description: '금융기관 연체 중인 기업은 정책자금 신청이 불가합니다',
      impact: -50,
    });
  }

  // 휴/폐업
  if (profile.isInactive) {
    results.push({
      condition: '휴/폐업',
      status: 'fail',
      description: '휴업 또는 폐업 상태의 기업은 신청이 불가합니다',
      impact: -50,
    });
  }

  // 신용관리정보 등록
  if (profile.hasCreditIssue) {
    results.push({
      condition: '신용관리정보',
      status: 'fail',
      description: '신용관리정보가 등록된 기업은 신청이 불가합니다',
      impact: -40,
    });
  }

  return {
    hasExclusion: results.length > 0,
    results,
  };
}

function checkBusinessAge(
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

function checkRevenue(
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

function checkEmployeeCount(
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

function checkIndustry(
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

function checkCreditRating(
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

function checkExportRequirement(hasExportExperience?: boolean): CheckResult {
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

function checkFundingPurpose(
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

function checkCertifications(
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

function checkOwnerCharacteristics(
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

function checkAdditionalBonuses(
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

// ============================================================================
// 점수 계산 및 결과 생성
// ============================================================================

function calculateScore(
  passed: CheckResult[],
  failed: CheckResult[],
  warnings: CheckResult[],
  bonuses: CheckResult[]
): number {
  let score = 50;

  for (const check of passed) {
    score += check.impact;
  }

  for (const check of failed) {
    score += check.impact;
  }

  for (const check of warnings) {
    score += check.impact;
  }

  for (const check of bonuses) {
    score += check.impact;
  }

  return Math.max(0, Math.min(100, score));
}

function generateSummary(
  isEligible: boolean,
  passed: CheckResult[],
  failed: CheckResult[]
): string {
  if (!isEligible) {
    const mainReasons = failed
      .slice(0, 2)
      .map((f) => f.condition)
      .join(', ');
    return `신청 불가 (사유: ${mainReasons})`;
  }

  const passCount = passed.length;
  return `신청 가능 (${passCount}개 조건 충족)`;
}

function generateRecommendation(
  isEligible: boolean,
  score: number,
  failed: CheckResult[],
  fund: PolicyFundKnowledge
): string {
  if (!isEligible) {
    const fixable = failed.filter((f) => f.impact > -50);
    if (fixable.length > 0) {
      return `다음 조건 해소 시 재검토 가능: ${fixable.map((f) => f.condition).join(', ')}`;
    }
    return '현재 조건으로는 신청이 어렵습니다. 다른 정책자금을 검토해 주세요.';
  }

  if (score >= 80) {
    return `적극 추천! ${fund.shortName} 신청을 권장합니다.`;
  }

  if (score >= 60) {
    return `신청 가능합니다. 서류 준비 후 신청을 검토해 보세요.`;
  }

  return `조건부 신청 가능. 추가 확인이 필요할 수 있습니다.`;
}

// ============================================================================
// 필터링 함수
// ============================================================================

/**
 * 적합도 높은 순으로 정렬된 정책자금 목록 반환
 */
export function getEligibleFunds(
  profile: CompanyProfile,
  minScore: number = 50
): EligibilityResult[] {
  return checkAllFundsEligibility(profile).filter(
    (result) => result.eligibilityScore >= minScore
  );
}

/**
 * 기관별 적합 정책자금 조회
 */
export function getEligibleFundsByInstitution(
  profile: CompanyProfile,
  institutionId: string
): EligibilityResult[] {
  return checkAllFundsEligibility(profile).filter(
    (result) => result.institutionId === institutionId && result.isEligible
  );
}

/**
 * 빠른 스크리닝 (상위 N개만)
 */
export function quickScreening(
  profile: CompanyProfile,
  topN: number = 5
): EligibilityResult[] {
  return checkAllFundsEligibility(profile).slice(0, topN);
}

// ============================================================================
// 해결 가이드
// ============================================================================

export interface Suggestion {
  issue: string;
  solution: string;
  alternatives?: string[];
  actionRequired?: boolean;
}

export function getSuggestions(failedChecks: string[]): Suggestion[] {
  const suggestions: Suggestion[] = [];

  for (const reason of failedChecks) {
    const lowerReason = reason.toLowerCase();

    if (lowerReason.includes('업력') && (lowerReason.includes('초과') || lowerReason.includes('이내'))) {
      suggestions.push({
        issue: reason,
        solution: '창업초기 자금 대신 성장기/도약기 기업 대상 자금을 검토하세요.',
        alternatives: ['중진공 신성장기반자금', '신보 일반보증', '기보 기술보증']
      });
    } else if (lowerReason.includes('업력') && lowerReason.includes('미달')) {
      suggestions.push({
        issue: reason,
        solution: '업력 요건이 낮은 창업 초기기업 대상 자금을 검토하세요.',
        alternatives: ['중진공 혁신창업사업화자금', '소진공 소상공인정책자금']
      });
    } else if (lowerReason.includes('청년') && lowerReason.includes('미충족')) {
      suggestions.push({
        issue: reason,
        solution: '청년전용 자금은 만 39세 이하만 가능합니다. 일반 정책자금을 검토하세요.',
        alternatives: ['중진공 신성장기반자금', '중진공 긴급경영안정자금']
      });
    } else if (lowerReason.includes('매출') && lowerReason.includes('미달')) {
      suggestions.push({
        issue: reason,
        solution: '매출 조건이 낮은 소상공인/소기업 대상 자금을 검토하세요.',
        alternatives: ['소진공 일반경영안정자금', '신용보증재단 일반보증', '지역신보 소기업보증']
      });
    } else if (lowerReason.includes('매출') && lowerReason.includes('초과')) {
      suggestions.push({
        issue: reason,
        solution: '매출 기준이 높은 중기업/중견기업 대상 자금을 검토하세요.',
        alternatives: ['산업은행 시설자금', '기업은행 중기대출']
      });
    } else if (lowerReason.includes('세금') || lowerReason.includes('체납')) {
      suggestions.push({
        issue: reason,
        solution: '체납 세금을 완납한 후 납세증명서를 다시 발급받으세요.',
        actionRequired: true
      });
    } else if (lowerReason.includes('기존') && lowerReason.includes('대출')) {
      suggestions.push({
        issue: reason,
        solution: '기존 정책자금 대출 상환 후 재신청하거나, 한도 내 추가 신청을 검토하세요.',
        alternatives: ['보증 상품으로 전환', '일반 은행 대출']
      });
    } else if (lowerReason.includes('업종') && (lowerReason.includes('제외') || lowerReason.includes('아님'))) {
      suggestions.push({
        issue: reason,
        solution: '업종 제한이 없거나 해당 업종을 지원하는 자금을 검토하세요.',
        alternatives: ['전업종 대상 정책자금 검색']
      });
    } else if (lowerReason.includes('지역') || lowerReason.includes('소재지')) {
      suggestions.push({
        issue: reason,
        solution: '전국 대상 정책자금 또는 해당 지역 지자체 자금을 검토하세요.',
        alternatives: ['중진공 전국 단위 자금', '해당 지역 신용보증재단']
      });
    } else if (lowerReason.includes('인증') && lowerReason.includes('미보유')) {
      suggestions.push({
        issue: reason,
        solution: '필요한 인증을 취득하거나, 인증 요건이 없는 자금을 검토하세요.',
        alternatives: ['인증 취득 지원 사업', '일반 정책자금']
      });
    } else if (lowerReason.includes('직원')) {
      suggestions.push({
        issue: reason,
        solution: '기업 규모에 맞는 자금을 검토하세요.',
        alternatives: ['소상공인 대상 자금', '중소기업 대상 자금']
      });
    } else {
      suggestions.push({
        issue: reason,
        solution: '해당 조건을 충족하거나 다른 정책자금을 검토하세요.'
      });
    }
  }

  return suggestions;
}

export function summarizeEligibility(result: EligibilityResult): string {
  if (result.isEligible) {
    return `✅ 자격 충족 (${result.passedConditions.length}개 조건 통과)`;
  }

  return `❌ 자격 미충족 (탈락 사유 ${result.failedConditions.length}개)\n` +
         result.failedConditions.map((c, i) => `  ${i + 1}. ${c.description}`).join('\n');
}

export function summarizeSuggestions(suggestions: Suggestion[]): string {
  if (suggestions.length === 0) {
    return '해결 가이드 없음';
  }

  return suggestions.map((s, i) => {
    let text = `${i + 1}. ${s.issue}\n   → ${s.solution}`;
    if (s.alternatives && s.alternatives.length > 0) {
      text += `\n   💡 대안: ${s.alternatives.join(', ')}`;
    }
    if (s.actionRequired) {
      text += '\n   ⚠️ 즉시 조치 필요';
    }
    return text;
  }).join('\n\n');
}
