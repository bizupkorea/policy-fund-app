/**
 * lib/policy-fund/last/eligibility/index.ts
 *
 * 자격 체크 모듈 메인 export
 * 모든 자격 관련 함수 export
 */

import {
  PolicyFundKnowledge,
  POLICY_FUND_KNOWLEDGE_BASE,
} from '../knowledge-base';

import type {
  CompanyProfile,
  EligibilityResult,
  CheckResult,
} from '../types';

import {
  checkExclusionConditions,
  checkBusinessAge,
  checkRevenue,
  checkEmployeeCount,
  checkIndustry,
  checkCreditRating,
  checkExportRequirement,
  checkFundingPurpose,
  checkCertifications,
  checkOwnerCharacteristics,
  checkAdditionalBonuses,
} from './checks';

import {
  calculateScore,
  generateSummary,
  generateRecommendation,
} from './scoring';

// ============================================================================
// Re-exports
// ============================================================================

export {
  checkExclusionConditions,
  checkBusinessAge,
  checkRevenue,
  checkEmployeeCount,
  checkIndustry,
  checkCreditRating,
  checkExportRequirement,
  checkFundingPurpose,
  checkCertifications,
  checkOwnerCharacteristics,
  checkAdditionalBonuses,
} from './checks';

export type { GlobalExclusionResult } from './checks';

export {
  calculateScore,
  generateSummary,
  generateRecommendation,
} from './scoring';

export {
  getSuggestions,
  summarizeEligibility,
  summarizeSuggestions,
} from './suggestions';

export type { Suggestion } from './suggestions';

// 고도화된 적격 사유 생성 (3사 통합)
export {
  calculateSafetyZone,
  calculateBusinessAgeSafetyZone,
  generateBasicConditions,
  generateBonusConditions,
  generateStrategicConditions,
  generateFundingConditions,
  generateAIJudgment,
  generateDetailedReasons,
} from './reason-generator';

// ============================================================================
// 메인 자격 체크 함수
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

  // ========== 1단계: 전역 결격 조건 체크 (하드컷) ==========
  const exclusionCheck = checkExclusionConditions(profile, criteria);

  // 하드컷: 즉시 제외 - 더 이상 체크하지 않고 바로 불합격 반환
  if (exclusionCheck.isHardExcluded) {
    return {
      fundId: fund.id,
      fundName: fund.name,
      institutionId: fund.institutionId,
      isEligible: false,
      eligibilityScore: 0,
      passedConditions: [],
      failedConditions: exclusionCheck.exclusionReasons,
      warningConditions: [],
      bonusConditions: [],
      summary: `신청 불가 (${exclusionCheck.exclusionReasons.map(r => r.condition).join(', ')})`,
      recommendation: '전역 결격 사유로 인해 모든 정책자금 신청이 불가합니다. 결격 사유 해소 후 재검토하세요.',
    };
  }

  // 조건부 결격은 경고로 추가 (분납 승인 등)
  if (exclusionCheck.isConditional) {
    warningConditions.push(...exclusionCheck.conditionalReasons);
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

  // ★★★ requiredConditions 체크 (v5 - 하드컷) ★★★
  // 전용자금 필수 요건 미충족 시 해당 자금 완전 제외
  if (criteria.requiredConditions) {
    const reqCond = criteria.requiredConditions;
    const exclusionReasons: CheckResult[] = [];

    // === 대표자 특성 (하드컷) ===
    if (reqCond.isYouthCompany === true && !profile.ownerCharacteristics?.includes('youth')) {
      exclusionReasons.push({ condition: '청년 대표자 필수', status: 'fail', description: '청년 전용 자금: 만 39세 이하만 신청 가능', impact: -100 });
    }
    if (reqCond.isFemale === true && !profile.ownerCharacteristics?.includes('female')) {
      exclusionReasons.push({ condition: '여성 대표자 필수', status: 'fail', description: '여성 전용 자금: 여성 대표자만 신청 가능', impact: -100 });
    }
    if (reqCond.isDisabled === true && !profile.ownerCharacteristics?.includes('disabled')) {
      exclusionReasons.push({ condition: '장애인 대표자 필수', status: 'fail', description: '장애인 전용 자금: 장애인만 신청 가능', impact: -100 });
    }
    if (reqCond.isDisabledCompany === true && !profile.ownerCharacteristics?.includes('disabled')) {
      exclusionReasons.push({ condition: '장애인기업 필수', status: 'fail', description: '장애인기업 전용 자금: 장애인기업만 신청 가능', impact: -100 });
    }
    if (reqCond.isDisabledStandard === true && !profile.ownerCharacteristics?.includes('disabled')) {
      exclusionReasons.push({ condition: '장애인표준사업장 필수', status: 'fail', description: '장애인표준사업장 전용 자금', impact: -100 });
    }

    // === 인증/자격 (하드컷) ===
    if (reqCond.isVentureCompany === true && !profile.certifications?.includes('venture')) {
      exclusionReasons.push({ condition: '벤처기업 인증 필수', status: 'fail', description: '벤처기업 전용 자금: 벤처 인증 필요', impact: -100 });
    }
    if (reqCond.isInnobiz === true && !profile.certifications?.includes('innobiz')) {
      exclusionReasons.push({ condition: '이노비즈 인증 필수', status: 'fail', description: '이노비즈 전용 자금: 이노비즈 인증 필요', impact: -100 });
    }
    if (reqCond.isSocialEnterprise === true && !(profile as any).isSocialEnterprise) {
      exclusionReasons.push({ condition: '사회적기업 인증 필수', status: 'fail', description: '사회적기업 전용 자금: 사회적기업 인증 필요', impact: -100 });
    }
    if (reqCond.isSocialEconomyEnterprise === true && !(profile as any).isSocialEnterprise) {
      exclusionReasons.push({ condition: '사회적경제기업 필수', status: 'fail', description: '사회적경제기업 전용 자금', impact: -100 });
    }

    // === 기술/특허 (하드컷) ===
    if (reqCond.hasPatent === true && !profile.hasTechAssets) {
      exclusionReasons.push({ condition: '특허 보유 필수', status: 'fail', description: 'IP 담보 자금: 특허/실용신안 필요', impact: -100 });
    }
    if (reqCond.hasRndActivity === true && !profile.hasTechAssets) {
      exclusionReasons.push({ condition: 'R&D 필수', status: 'fail', description: '기술/R&D 자금: R&D 활동 또는 기술성 필요', impact: -100 });
    }
    if (reqCond.hasResearchInstitute === true && !profile.hasTechAssets) {
      exclusionReasons.push({ condition: '기업부설연구소 필수', status: 'fail', description: '연구소 보유 기업 전용', impact: -100 });
    }
    if (reqCond.hasTechnologyCertification === true && !profile.hasTechAssets) {
      exclusionReasons.push({ condition: '기술인증 필수', status: 'fail', description: '기술인증 보유 기업 전용', impact: -100 });
    }

    // === 수출/해외 (하드컷) ===
    if (reqCond.hasExportRevenue === true && !profile.hasExportExperience) {
      exclusionReasons.push({ condition: '수출 실적 필수', status: 'fail', description: '수출 자금: 수출 실적 또는 계약 필요', impact: -100 });
    }

    // === 특수 목적 (하드컷) ===
    if (reqCond.hasSmartFactoryPlan === true && !(profile as any).hasSmartFactoryPlan) {
      exclusionReasons.push({ condition: '스마트공장 계획 필수', status: 'fail', description: '스마트공장 구축/고도화 계획 필요', impact: -100 });
    }
    if (reqCond.hasEsgInvestmentPlan === true && !(profile as any).hasEsgInvestmentPlan) {
      exclusionReasons.push({ condition: 'ESG 투자계획 필수', status: 'fail', description: 'ESG/탄소중립 투자 계획 필요', impact: -100 });
    }
    if (reqCond.isEmergencySituation === true && !profile.isEmergencySituation) {
      exclusionReasons.push({ condition: '긴급경영 상황 필수', status: 'fail', description: '긴급경영안정자금: 경영위기 상황 필요', impact: -100 });
    }
    if (reqCond.hasYouthEmploymentPlan === true && !(profile as any).hasYouthEmploymentPlan) {
      exclusionReasons.push({ condition: '청년고용 계획 필수', status: 'fail', description: '청년고용 계획 또는 청년 근로자 보유 필요', impact: -100 });
    }
    if (reqCond.isGreenEnergyBusiness === true && !(profile as any).isGreenEnergyBusiness) {
      exclusionReasons.push({ condition: '신재생에너지 사업 필수', status: 'fail', description: '신재생에너지 발전 기업 전용', impact: -100 });
    }
    if (reqCond.hasJobCreation === true && !(profile as any).hasJobCreation) {
      exclusionReasons.push({ condition: '고용창출 실적 필수', status: 'fail', description: '최근 1년 내 고용 증가 기업 전용', impact: -100 });
    }

    // 하드컷: 전용자금 요건 미충족 시 즉시 불합격 반환
    if (exclusionReasons.length > 0) {
      return {
        fundId: fund.id,
        fundName: fund.name,
        institutionId: fund.institutionId,
        isEligible: false,
        eligibilityScore: 0,
        passedConditions: [],
        failedConditions: exclusionReasons,
        warningConditions: [],
        bonusConditions: [],
        summary: `신청 불가 (${exclusionReasons.map(r => r.condition).join(', ')})`,
        recommendation: '전용자금 필수 요건을 충족하지 않아 신청이 불가합니다.',
      };
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

  // ========== 4단계: 재창업자금 체크 (하드컷) ==========
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
      // 하드컷: 재창업자금은 재창업 기업만 신청 가능
      return {
        fundId: fund.id,
        fundName: fund.name,
        institutionId: fund.institutionId,
        isEligible: false,
        eligibilityScore: 0,
        passedConditions: [],
        failedConditions: [{
          condition: '재창업 기업 필수',
          status: 'fail',
          description: '재창업자금은 재창업 기업만 신청 가능 (과거 폐업 후 재창업 필요)',
          impact: -100,
        }],
        warningConditions: [],
        bonusConditions: [],
        summary: '신청 불가 (재창업 기업 필수)',
        recommendation: '재창업자금은 과거 폐업 후 재창업한 기업만 신청 가능합니다.',
      };
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
