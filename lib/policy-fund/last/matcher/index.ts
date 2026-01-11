/**
 * lib/policy-fund/last/matcher/index.ts
 *
 * 매칭 엔진 메인 모듈
 * 모든 매칭 관련 함수 export
 */

import type {
  ExtendedCompanyProfile,
  DetailedMatchResult,
  AIAdvisorResult,
  IndustryCategory,
  EnhancedMatchResult,
} from '../types';
import {
  POLICY_FUND_KNOWLEDGE_BASE,
} from '../knowledge-base';
import { checkAllFundsEligibility, generateDetailedReasons } from '../eligibility';
import { analyzePortfolio, quickAnalyze } from '../gemini-advisor';
import { convertToKBProfile } from './converter';
import {
  TRACK_LABELS,
  TRACK_PRIORITY,
  generateRankReason,
  generateConfidenceLabel,
  generateScoreExplanation,
  calculateSizeMatchScore,
} from './scorer';
import { convertToDetailedMatchResult, checkKeywordExclusion } from './helpers';
import { determineCompanyScale, isStrategicIndustry, getStrategicIndustryBonus } from './company-scale';

// ============================================================================
// Re-exports (기존)
// ============================================================================

export { convertToKBProfile, SIZE_MAP, normalizeCompanySize } from './converter';
export {
  determineCompanyScale,
  isMicroEnterprise,
  getMicroThreshold,
  COMPANY_SCALE_LABELS,
  getRecommendedInstitutions,
  isStrategicIndustry,
  getStrategicIndustryBonus,
  STRATEGIC_INDUSTRY_KEYWORDS,
  STRATEGIC_KSIC_PREFIXES,
} from './company-scale';
export {
  TRACK_LABELS,
  TRACK_PRIORITY,
  generateRankReason,
  generateConfidenceLabel,
  generateScoreExplanation,
  calculateSizeMatchScore,
  scoreToLevel,
  getRankRole,
} from './scorer';
export { convertToDetailedMatchResult, checkKeywordExclusion } from './helpers';
export { classifyMatchResults, getTrackLabelKorean } from './classifier';

// ============================================================================
// Re-exports (리팩토링 모듈)
// ============================================================================

// Config (설정 중앙화)
export {
  FUND_CATEGORIES,
  FUND_KEYWORDS,
  DIRECT_LOAN_INSTITUTIONS,
  GUARANTEE_INSTITUTIONS,
  INSTITUTION_LABELS,
  isFundInCategory,
  matchesKeywords,
  isRestartFund,
  isInnovationFund,
  isDirectLoanInstitution,
  isGuaranteeInstitution,
  SCORING_CONFIG,
  RANK_DIFFERENTIATION,
  getRankPenalty,
  INSTITUTION_BONUS,
  getInstitutionBonus,
  CERTIFICATION_BONUS,
  FUNDING_PURPOSE_BONUS,
  TRACK_PRIORITY as NEW_TRACK_PRIORITY,
  clampScore,
  applyBonus,
  applyPenalty,
  KOSMES_GRADUATION,
  GUARANTEE_ORG,
  LOAN_BALANCE,
  SUBSIDY_RATIO,
  SPECIAL_BONUSES,
  CONFLICT_PENALTIES,
  FUNDING_AMOUNT,
  HARD_CUT_MESSAGES,
} from './config';

// Filters (필터)
export {
  isHardExcluded,
  needsRestartFundsOnly,
  applyHardCutFilters,
  applyDiversityFilter,
  isSpecialPurposeFund,
} from './filters';

// Scoring (점수 계산)
export {
  ALL_EVALUATORS,
  getEvaluatorById,
  getEvaluatorsByPriority,
  applyScoring,
  calculateInstitutionBonus,
  calculateCertificationBonus,
  applyRankDifferentiation,
} from './scoring';
export type { Evaluator, EvaluationResult } from './scoring';

// Sorting (정렬)
export {
  getSortPriority,
  adjustPriorityForSpecialPurpose,
  applySorting,
} from './sorting';

// Pipeline (파이프라인) - 신규 매칭 함수
export {
  matchWithKnowledgeBase as matchWithKnowledgeBaseV2,
} from './pipeline';
export type { MatchOptions, MatchResult } from './pipeline';

// ============================================================================
// 메인 매칭 함수
// ============================================================================

/**
 * 제도 지식 기반 매칭 수행
 */
export async function matchWithKnowledgeBase(
  profile: ExtendedCompanyProfile,
  options: {
    useAI?: boolean;
    topN?: number;
  } = {}
): Promise<{
  results: DetailedMatchResult[];
  aiAnalysis?: AIAdvisorResult[];
  summary: {
    totalFunds: number;
    eligibleCount: number;
    topRecommendation: string | null;
  };
}> {
  const { useAI = false, topN = 10 } = options;

  const kbProfile = convertToKBProfile(profile);
  let eligibilityResults = checkAllFundsEligibility(kbProfile);

  // 투융자복합금융 필터링
  if (!profile.hasIpoOrInvestmentPlan && !profile.acceptsEquityDilution) {
    eligibilityResults = eligibilityResults.filter(r => r.fundId !== 'kosmes-investment-loan');
  }

  // 유동화회사보증(P-CBO) 필터링
  if (!profile.needsLargeFunding) {
    eligibilityResults = eligibilityResults.filter(r => r.fundId !== 'kodit-securitization');
  }

  // 환경 자금 필터링
  const envFundIds = ['keiti-env-growth', 'keiti-env-facility'];
  if (!profile.fundingPurposeDetails?.environmentInvestment) {
    eligibilityResults = eligibilityResults.filter(r => !envFundIds.includes(r.fundId));
  }

  // 신재생에너지보증 하드컷 필터링
  // 신재생에너지 사업자가 아니면 신재생에너지 전용 보증 제외
  const greenEnergyFundIds = ['kibo-green-energy'];
  if (!profile.isGreenEnergyBusiness) {
    eligibilityResults = eligibilityResults.filter(r => !greenEnergyFundIds.includes(r.fundId));
  }

  // 전용자격 체크
  const hasExclusiveQualification =
    profile.isDisabledStandard ||
    profile.isDisabled ||
    profile.isSocialEnterprise ||
    profile.isRestart ||
    profile.isFemale;

  const blockedTracks = hasExclusiveQualification ? [] : ['exclusive'];

  eligibilityResults = eligibilityResults.filter(r => {
    const fund = POLICY_FUND_KNOWLEDGE_BASE.find(f => f.id === r.fundId);
    if (!fund) return true;
    return !blockedTracks.includes(fund.track);
  });

  // ============================================================================
  // 기업규모 판정 (업종 기반)
  // ============================================================================
  // 소상공인 기준:
  // - 제조/건설/운수: 10인 미만
  // - 서비스/도소매/기타: 5인 미만
  // ============================================================================
  const employeeCount = profile.employeeCount ?? 0;
  const industry = (profile.industryName || profile.industry || '') as IndustryCategory;
  const annualRevenue = profile.revenue ? profile.revenue * 100000000 : undefined;
  const companyScale = determineCompanyScale(employeeCount, industry, annualRevenue);
  const isMicro = companyScale === 'micro';

  // ============================================================================
  // 전략산업 판정 (규모 무관 중진공 우선 지원)
  // ============================================================================
  // 12대 국가전략기술: 이차전지, 반도체, 로봇, AI, 바이오, 미래차 등
  // 전략산업 + 소상공인 = 중진공 추가 가산점 +20 (소진공 +30 추월)
  // ============================================================================
  const industryNameStr = String(profile.industryName || profile.industry || '');
  const industryCode = (profile as any).industryCode || (profile as any).ksicCode || '';
  const businessDesc = (profile as any).businessDescription || (profile as any).mainProduct || '';
  const isStrategic = isStrategicIndustry(industryNameStr, industryCode, businessDesc);
  const strategicBonus = getStrategicIndustryBonus(isStrategic, isMicro);

  // targetScale 하드컷 (기업규모 기반 필터링)
  eligibilityResults = eligibilityResults.filter(r => {
    const fund = POLICY_FUND_KNOWLEDGE_BASE.find(f => f.id === r.fundId);
    if (!fund?.targetScale || fund.targetScale.length === 0) return true;

    // 기업규모 기반 필터링 (micro, small, medium, large)
    const scaleMatches = fund.targetScale.includes(companyScale);

    // 인증 기반 필터링 (venture, innobiz 등은 별도 체크)
    const certMatches = fund.targetScale.some(s =>
      (s === 'venture' && profile.isVentureCompany) ||
      (s === 'innobiz' && profile.isInnobiz) ||
      (s === 'mainbiz' && profile.isMainbiz)
    );

    return scaleMatches || certMatches;
  });

  // ============================================================================
  // 하드컷: 정책자금 신청 불가 조건
  // ============================================================================
  // A. 즉시 제외 (하드컷):
  //    - 금융기관 연체 중
  //    - 보증사고 미정리
  // B. 조건부 가능 (재도전자금만):
  //    - 휴·폐업 → 재창업/재도전 전용자금만
  //    - 신용회복 진행 중 → 재창업/재도전 전용자금만
  //    - 과거 부실(정리 완료) → 감점 처리
  //    - 세금 체납(분납 승인) → 감점 처리 (기존)
  // ============================================================================

  // A. 즉시 제외 (하드컷) - 일반자금 전면 제외
  const isHardExcluded =
    (profile.taxDelinquencyStatus === 'active' && !profile.hasTaxInstallmentApproval) ||  // 세금 체납 (분납 미승인)
    profile.creditIssueStatus === 'current' ||                              // 신용문제 (현재)
    profile.isCurrentlyDelinquent ||                                        // 금융 연체 중
    profile.hasUnresolvedGuaranteeAccident ||                               // 보증사고 미정리
    (profile.hasPastDefault && !profile.isPastDefaultResolved);             // 과거 부실 미정리

  if (isHardExcluded) {
    eligibilityResults = [];
  }

  // B-1. 휴·폐업 또는 신용회복 중 → 재창업/재도전 전용자금만 노출
  const needsRestartFundsOnly = (profile.isInactive || profile.isCreditRecoveryInProgress) && !isHardExcluded;
  if (needsRestartFundsOnly) {
    const restartFundKeywords = ['재도전', '재창업', '재기', '재도약'];
    eligibilityResults = eligibilityResults.filter(r => {
      const fund = POLICY_FUND_KNOWLEDGE_BASE.find(f => f.id === r.fundId);
      if (!fund) return false;
      return restartFundKeywords.some(kw => fund.name.includes(kw) || r.fundId.includes('restart'));
    });
  }

  // isEligible 필터링
  eligibilityResults = eligibilityResults.filter(r => r.isEligible);

  // 키워드 기반 하드컷
  eligibilityResults = eligibilityResults.filter(r => {
    const keywordResult = checkKeywordExclusion(r.fundName, profile);
    return !keywordResult?.excluded;
  });

  // 결과 변환 + 보너스 적용
  let resultsWithBonus: DetailedMatchResult[] = eligibilityResults.map(result => {
    const fund = POLICY_FUND_KNOWLEDGE_BASE.find(f => f.id === result.fundId);
    const detailedResult = convertToDetailedMatchResult(result, fund);

    // 필요 자금 보너스/경고
    if (profile.requiredFundingAmount && profile.requiredFundingAmount > 0 && fund) {
      const requiredAmount = profile.requiredFundingAmount * 100000000;
      const fundMaxAmount = fund.terms.amount.max;

      if (fundMaxAmount) {
        if (requiredAmount <= fundMaxAmount) {
          detailedResult.score = Math.min(100, detailedResult.score + 5);
          detailedResult.eligibilityReasons.push(`필요 자금 (${profile.requiredFundingAmount}억) 한도 충족`);
        } else {
          const fundMaxInBillion = Math.round(fundMaxAmount / 100000000);
          detailedResult.warnings.push(`필요 자금 초과 (한도: ${fundMaxInBillion}억원)`);
        }
      }

      if (profile.requiredFundingAmount >= 10) {
        if (result.fundId === 'kodit-securitization' || result.fundId === 'kosmes-investment-loan') {
          detailedResult.score = Math.min(100, detailedResult.score + 5);
          detailedResult.eligibilityReasons.push('대규모 자금 조달에 적합');
        }
      }
    }

    detailedResult.level = detailedResult.score >= 70 ? 'high' :
                           detailedResult.score >= 40 ? 'medium' : 'low';

    return detailedResult;
  });

  // 하드컷 + 감점: 중진공 졸업제
  const kosmesPrevCount = profile.kosmesPreviousCount ?? 0;

  // 5회 이상: 중진공 자금 완전 제외 (하드컷)
  if (kosmesPrevCount >= 5) {
    resultsWithBonus = resultsWithBonus.filter(r => {
      if (r.institutionId === 'kosmes') {
        return false; // 중진공 자금 제외
      }
      return true;
    });
  } else if (kosmesPrevCount === 4) {
    // 4회: 중진공 자금 -30 감점
    resultsWithBonus.forEach(r => {
      if (r.institutionId === 'kosmes') {
        r.score = Math.max(0, r.score - 30);
        r.warnings.push('중진공 정책자금 4회 이용 (졸업제 임박 - 마지막 신청 기회)');
        r.level = r.score >= 70 ? 'high' : r.score >= 40 ? 'medium' : 'low';
      }
    });
  } else if (kosmesPrevCount === 3) {
    // 3회: 경고만 (감점 없음)
    resultsWithBonus.forEach(r => {
      if (r.institutionId === 'kosmes') {
        r.warnings.push('중진공 정책자금 3회 이용 (졸업제 주의 - 2회 남음)');
      }
    });
  }

  // 최근 2년 내 중진공 이용: 추가 -10 감점
  if (profile.hasRecentKosmesLoan) {
    resultsWithBonus.forEach(r => {
      if (r.institutionId === 'kosmes') {
        r.score = Math.max(0, r.score - 10);
        r.warnings.push('최근 2년 내 중진공 자금 이용 (연속 지원 제한)');
        r.level = r.score >= 70 ? 'high' : r.score >= 40 ? 'medium' : 'low';
      }
    });
  }

  // 감점 로직: 보증기관 이용 현황
  if (profile.currentGuaranteeOrg && profile.currentGuaranteeOrg !== 'none') {
    const usingBoth = profile.currentGuaranteeOrg === 'both';
    const usingKodit = profile.currentGuaranteeOrg === 'kodit' || usingBoth;
    const usingKibo = profile.currentGuaranteeOrg === 'kibo' || usingBoth;

    resultsWithBonus.forEach(r => {
      const isKodit = r.institutionId === 'kodit';
      const isKibo = r.institutionId === 'kibo';
      const isGuaranteeFund = isKodit || isKibo;

      if (!isGuaranteeFund) return; // 보증 자금만 해당

      let penalty = 0;
      let message = '';

      if (usingBoth) {
        // 케이스 1: 양쪽 기관 모두 이용 중 → -30
        penalty = 30;
        message = '신보+기보 동시 이용 중 (추가 보증 한도 제한)';
      } else if ((isKibo && usingKodit) || (isKodit && usingKibo)) {
        // 케이스 2: 타기관 이용 중 → -10
        penalty = 10;
        message = '타 보증기관 이용 중 (전환 시 심사 필요)';
      } else if ((isKibo && usingKibo) || (isKodit && usingKodit)) {
        // 케이스 3: 동일 기관 추가 이용 → 감점 없지만 경고 추가
        r.warnings.push(`${isKibo ? '기보' : '신보'} 이용 중 - 추가 보증 한도 확인 필요`);
      }

      if (penalty > 0) {
        r.score = Math.max(0, r.score - penalty);
        r.warnings.push(message);
        r.level = r.score >= 70 ? 'high' : r.score >= 40 ? 'medium' : 'low';
      }
    });
  }

  // 감점 로직: 기존 대출 잔액 (직접대출/보증 차등 적용)
  if (profile.existingLoanBalance && profile.existingLoanBalance > 0) {
    const balance = profile.existingLoanBalance;
    resultsWithBonus.forEach(r => {
      // 직접대출 (중진공, 소진공) vs 보증 (신보, 기보) 구분
      const isDirectLoan = r.institutionId === 'kosmes' || r.institutionId === 'semas';
      const isGuarantee = r.institutionId === 'kodit' || r.institutionId === 'kibo';

      let penalty = 0;
      let message = '';

      if (balance >= 15) {
        penalty = isDirectLoan ? 40 : (isGuarantee ? 25 : 30);
        message = `기존 정책자금 잔액 과다 (${balance}억, 한도 초과 우려)`;
      } else if (balance >= 10) {
        penalty = isDirectLoan ? 25 : (isGuarantee ? 15 : 20);
        message = `기존 정책자금 잔액 ${balance}억 (한도 근접)`;
      } else if (balance >= 5) {
        penalty = isDirectLoan ? 10 : (isGuarantee ? 5 : 8);
        message = `기존 정책자금 잔액 ${balance}억 (여유 한도 축소)`;
      }

      if (penalty > 0) {
        r.score = Math.max(0, r.score - penalty);
        r.warnings.push(message);
      }
      r.level = r.score >= 70 ? 'high' : r.score >= 40 ? 'medium' : 'low';
    });
  }

  // 가점/감점 로직: 과거 부실 정리 완료
  // 주의: 과거 부실 미정리(isPastDefaultResolved=false)는 하드컷에서 이미 제외됨
  if (profile.hasPastDefault && profile.isPastDefaultResolved) {
    resultsWithBonus.forEach(r => {
      const isRestartFund = r.fundId.includes('restart') || r.fundName.includes('재창업') || r.fundName.includes('재도약') || r.fundName.includes('재기');

      if (isRestartFund) {
        // 재도전 자금: +20 가점
        r.score = Math.min(100, r.score + 20);
        r.eligibilityReasons.push('과거 부실 정리 완료 - 재도전 자금 최우선 추천');
      } else {
        // 일반 자금: -15 감점 + 경고
        r.score = Math.max(0, r.score - 15);
        r.warnings.push('과거 부실 이력 (정리 완료 - 심사 시 불이익 가능)');
      }
      r.level = r.score >= 70 ? 'high' : r.score >= 40 ? 'medium' : 'low';
    });
  }

  // 휴·폐업 경고 메시지 추가
  if (profile.isInactive) {
    resultsWithBonus.forEach(r => {
      r.warnings.push('휴·폐업 상태 - 재창업/재도전 전용자금만 신청 가능');
    });
  }

  // 신용회복 진행 중 경고 메시지 추가 + 재도전 자금 가점
  if (profile.isCreditRecoveryInProgress) {
    resultsWithBonus.forEach(r => {
      const isRestartFund = r.fundId.includes('restart') || r.fundName.includes('재창업') || r.fundName.includes('재도약') || r.fundName.includes('재기');
      if (isRestartFund) {
        r.score = Math.min(100, r.score + 15);
        r.eligibilityReasons.push('신용회복 진행 중 - 재도전자금 우대 대상');
      }
      r.warnings.push('신용회복 절차 진행 중 - 재창업/재도전 전용자금만 신청 가능');
      r.level = r.score >= 70 ? 'high' : r.score >= 40 ? 'medium' : 'low';
    });
  }

  // ============================================================================
  // 조건부(Conditional) 감점 로직
  // ============================================================================

  // 감점: 세금 체납 + 분납 승인 (하드컷 아님, 경고만)
  if (profile.taxDelinquencyStatus === 'active' && profile.hasTaxInstallmentApproval) {
    resultsWithBonus.forEach(r => {
      r.score = Math.max(0, r.score - 10);
      r.warnings.push('세금 체납 중 (분납 승인 - 심사 시 불이익 가능)');
      r.level = r.score >= 70 ? 'high' : r.score >= 40 ? 'medium' : 'low';
    });
  }

  // 감점: 최근 1년 정책자금 수혜액 (매출 대비 비율 기반)
  // 비율 기준: 10% 이하 정상, 10-20% 주의, 20-30% 제한, 30% 초과 강한 제한
  const recentSubsidy = profile.recentYearSubsidyAmount ?? 0;
  const revenueForSubsidy = profile.revenue ?? 0;
  const subsidyRatio = revenueForSubsidy > 0 ? (recentSubsidy / revenueForSubsidy) : 0;

  if (recentSubsidy > 0 && revenueForSubsidy > 0) {
    resultsWithBonus.forEach(r => {
      let penalty = 0;
      let message = '';
      const ratioPercent = Math.round(subsidyRatio * 100);

      if (subsidyRatio > 0.3) {
        // 30% 초과: 강한 제한
        penalty = 30;
        message = `최근 1년 수혜액/매출 비율 과다 (${ratioPercent}%, 추가 지원 제한 가능)`;
      } else if (subsidyRatio > 0.2) {
        // 20-30%: 제한
        penalty = 20;
        message = `최근 1년 수혜액/매출 비율 ${ratioPercent}% (심사 시 고려됨)`;
      } else if (subsidyRatio > 0.1) {
        // 10-20%: 주의
        penalty = 10;
        message = `최근 1년 수혜액/매출 비율 ${ratioPercent}% (주의)`;
      }
      // 10% 이하: 감점 없음

      if (penalty > 0) {
        r.score = Math.max(0, r.score - penalty);
        r.warnings.push(message);
        r.level = r.score >= 70 ? 'high' : r.score >= 40 ? 'medium' : 'low';
      }
    });
  } else if (recentSubsidy >= 5 && revenueForSubsidy === 0) {
    // 매출 정보 없이 수혜액만 있는 경우: 절대금액 기준 적용 (fallback)
    resultsWithBonus.forEach(r => {
      let penalty = 0;
      let message = '';

      if (recentSubsidy >= 10) {
        penalty = 25;
        message = `최근 1년 정책자금 수혜 과다 (${recentSubsidy}억원)`;
      } else {
        penalty = 15;
        message = `최근 1년 정책자금 수혜 (${recentSubsidy}억원)`;
      }

      r.score = Math.max(0, r.score - penalty);
      r.warnings.push(message);
      r.level = r.score >= 70 ? 'high' : r.score >= 40 ? 'medium' : 'low';
    });
  }

  // 하드컷: 신용회복 중 (재도전자금 예외)
  // 근거: 2026년 중소기업 정책자금 융자계획 공고
  // "신용회복위원회·개인회생·파산 신청자는 신청 대상에서 제외"
  // 예외: 재도전자금 중 '신용회복위원회 재창업지원'은 가능
  if (profile.isCreditRecoveryInProgress) {
    resultsWithBonus = resultsWithBonus.filter(r => {
      const isRestartFund = r.fundId?.includes('restart') ||
                            r.fundName?.includes('재도전') ||
                            r.fundName?.includes('재창업');
      if (isRestartFund) {
        r.eligibilityReasons.push('신용회복 중 - 재도전자금 신청 가능');
        return true;  // 재도전자금은 유지
      }
      return false;  // 나머지는 제외
    });
  }

  // ============================================================================
  // 가중치 기반 자금용도 매칭 로직
  // ============================================================================
  // 운전자금/시설자금/혼합 선택에 따라 차등 점수 적용
  // - 운전자금 선택 + 운전자금 전용 펀드: +10점
  // - 운전자금 선택 + 시설자금 전용 펀드: -25점 (강한 제한)
  // - 시설자금 선택 + 시설자금 전용 펀드: +20점 (시설자금은 더 중요)
  // - 시설자금 선택 + 운전자금 전용 펀드: -25점 (강한 제한)
  // - 혼합 선택 + 시설+운전 모두 가능: +15점
  // - 혼합 선택 + 시설자금 전용: +5점
  // - 혼합 선택 + 운전자금 전용: 0점 (기본)
  // ============================================================================
  if (profile.requestedFundingPurpose) {
    resultsWithBonus.forEach(r => {
      const fund = POLICY_FUND_KNOWLEDGE_BASE.find(f => f.id === r.fundId);
      if (fund) {
        const requested = profile.requestedFundingPurpose;
        const supportsWorking = fund.fundingPurpose.working;
        const supportsFacility = fund.fundingPurpose.facility;
        const supportsBoth = supportsWorking && supportsFacility;

        if (requested === 'working') {
          // 운전자금 선택
          if (supportsWorking && !supportsFacility) {
            // 운전자금 전용 펀드: +10점
            r.score = Math.min(100, r.score + 10);
            r.eligibilityReasons.push('운전자금 전용 - 용도 일치');
          } else if (!supportsWorking && supportsFacility) {
            // 시설자금 전용 펀드: -25점 (강한 제한)
            r.score = Math.max(0, r.score - 25);
            r.warnings.push('용도 불일치 (운전자금 필요, 시설자금 전용)');
          }
          // 혼합 지원 펀드: 0점 (기본)
        } else if (requested === 'facility') {
          // 시설자금 선택
          if (supportsFacility && !supportsWorking) {
            // 시설자금 전용 펀드: +20점 (시설자금은 더 중요)
            r.score = Math.min(100, r.score + 20);
            r.eligibilityReasons.push('시설자금 전용 - 용도 일치');
          } else if (!supportsFacility && supportsWorking) {
            // 운전자금 전용 펀드: -25점 (강한 제한)
            r.score = Math.max(0, r.score - 25);
            r.warnings.push('용도 불일치 (시설자금 필요, 운전자금 전용)');
          }
          // 혼합 지원 펀드: 0점 (기본)
        } else if (requested === 'both') {
          // 혼합자금 선택
          if (supportsBoth) {
            // 시설+운전 모두 가능: +15점
            r.score = Math.min(100, r.score + 15);
            r.eligibilityReasons.push('시설자금+운전자금 모두 지원 가능');
          } else if (supportsFacility && !supportsWorking) {
            // 시설자금 전용: +5점 (시설자금이라도 있으면 가점)
            r.score = Math.min(100, r.score + 5);
            r.eligibilityReasons.push('시설자금 지원 가능');
          }
          // 운전자금 전용: 0점 (기본)
        }

        // 레벨 재계산
        r.level = r.score >= 70 ? 'high' : r.score >= 40 ? 'medium' : 'low';
      }
    });
  }

  // 가점/감점 로직: 벤처투자 유치 실적 (혁신성장/스케일업 트랙)
  if (profile.hasVentureInvestment) {
    const innovationFundIds = [
      'kosmes-investment-loan',    // 투융자복합금융
      'kodit-innovation-growth',   // 혁신성장보증
      'kodit-innovation-icon',     // 혁신아이콘보증
      'kibo-innovation-startup',   // 혁신스타트업보증
      'kibo-unicorn',              // 유니콘보증
    ];
    const innovationKeywords = ['혁신', '스케일업', '투자', '유니콘', '아이콘'];

    resultsWithBonus.forEach(r => {
      const isInnovationFund = innovationFundIds.includes(r.fundId) ||
                               innovationKeywords.some(kw => r.fundName.includes(kw));
      const isMicroFund = r.institutionId === 'semas' ||
                          r.fundName.includes('소공인') ||
                          r.fundName.includes('소상공인');

      if (isInnovationFund) {
        r.score = Math.min(100, r.score + 20);
        r.eligibilityReasons.push('벤처투자 유치 실적 보유 - 혁신성장/스케일업 자금 최우선');
        r.level = r.score >= 70 ? 'high' : r.score >= 40 ? 'medium' : 'low';
      } else if (isMicroFund) {
        r.score = Math.max(0, r.score - 25);
        r.warnings.push('벤처투자 유치 기업에 소상공인 자금 부적합');
        r.level = r.score >= 70 ? 'high' : r.score >= 40 ? 'medium' : 'low';
      }
    });
  }

  // 가점/감점 로직: 재창업
  if (profile.isRestart) {
    resultsWithBonus.forEach(r => {
      const isRestartFund = r.fundId.includes('restart') ||
                           r.fundName.includes('재창업') ||
                           r.fundName.includes('재도약') ||
                           r.fundName.includes('재기') ||
                           r.fundName.includes('재도전');

      if (isRestartFund) {
        // 재도전자금: +30 가점
        r.score = Math.min(100, r.score + 30);
        r.eligibilityReasons.push('재창업 기업 - 재도전 자금 최우선 추천');
        r.level = r.score >= 70 ? 'high' : r.score >= 40 ? 'medium' : 'low';
      } else {
        // 일반자금: 부실 이력에 따라 차등 감점
        const hasNoDefault = !profile.hasPastDefault;
        const isDefaultResolved = profile.hasPastDefault && profile.isPastDefaultResolved;

        if (hasNoDefault) {
          // 부실 이력 없는 재창업: 0 감점 (경고만)
          r.warnings.push('재창업기업 - 재도전자금 우선 검토 권장');
        } else if (isDefaultResolved) {
          // 부실 정리 완료: -5 감점
          r.score = Math.max(0, r.score - 5);
          r.warnings.push('재창업기업(부실정리) - 일반자금 심사 시 이력 확인됨');
          r.level = r.score >= 70 ? 'high' : r.score >= 40 ? 'medium' : 'low';
        }
        // 부실 미정리: 하드컷에서 이미 제외됨
      }
    });
  }

  // ============================================================================
  // 가점 로직: 자금 용도 특화자금 우선 매칭
  // ============================================================================
  // 스마트공장 체크 → 스마트공장자금 우선
  // ESG/탄소중립 체크 → 녹색전환자금, 탄소중립자금 우선
  // 긴급경영안정 체크 → 긴급경영안정자금 우선
  // ============================================================================

  // 스마트공장 계획 체크 시 → 스마트공장 자금 우선 (제조업 검증 포함)
  if (profile.hasSmartFactoryPlan) {
    const smartFactoryFundIds = ['kosmes-smart-factory'];
    const smartFactoryKeywords = ['스마트공장', '스마트팩토리'];

    // 제조업 여부 확인 (KSIC C코드: 10~34)
    const industryCode = profile.industryCode || '';
    const isManufacturing = industryCode.startsWith('C') ||
                            (parseInt(industryCode.substring(0, 2)) >= 10 && parseInt(industryCode.substring(0, 2)) <= 34);

    resultsWithBonus.forEach(r => {
      const isSmartFactoryFund = smartFactoryFundIds.includes(r.fundId) ||
                                  smartFactoryKeywords.some(kw => r.fundName.includes(kw));

      if (isSmartFactoryFund) {
        if (isManufacturing) {
          r.score = Math.min(100, r.score + 25);
          r.eligibilityReasons.push('스마트공장 구축/고도화 계획 (제조업) - 스마트공장자금 최우선 추천');
        } else {
          // 비제조업: 가점 축소 + 경고
          r.score = Math.min(100, r.score + 10);
          r.warnings.push('스마트공장자금은 제조업 우선 - 비제조업은 심사 제한 가능');
          r.eligibilityReasons.push('스마트공장 구축 계획 (비제조업 주의)');
        }
        r.level = r.score >= 70 ? 'high' : r.score >= 40 ? 'medium' : 'low';
      }
    });
  }

  // ESG/탄소중립 + 신재생에너지 통합 처리 (Ceiling 로직 적용)
  // 둘 다 체크 시 합산 최대 +35점 제한
  const hasEsg = profile.hasEsgInvestmentPlan;
  const hasGreenEnergy = profile.isGreenEnergyBusiness;
  const esgGreenEnergyCeiling = 35; // 중복 체크 시 최대 가점

  if (hasEsg || hasGreenEnergy) {
    const esgFundIds = ['kosmes-carbon-neutral', 'kodit-green-new-deal', 'kibo-green-transition'];
    const esgKeywords = ['녹색전환', '탄소중립', 'ESG', '친환경'];
    const greenEnergyFundIds = ['kibo-green-energy'];
    const greenEnergyKeywords = ['신재생', '태양광', '풍력', '수소', '에너지'];

    resultsWithBonus.forEach(r => {
      const isEsgFund = esgFundIds.includes(r.fundId) ||
                        esgKeywords.some(kw => r.fundName.includes(kw));
      const isGreenEnergyFund = greenEnergyFundIds.includes(r.fundId) ||
                                 greenEnergyKeywords.some(kw => r.fundName.includes(kw));

      let greenBonus = 0;
      const reasons: string[] = [];

      if (hasEsg && isEsgFund) {
        greenBonus += 25;
        reasons.push('ESG/탄소중립 시설투자 계획');
      }
      if (hasGreenEnergy && isGreenEnergyFund) {
        greenBonus += 25;
        reasons.push('신재생에너지 사업');
      }

      // Ceiling 적용: 둘 다 해당 시 최대 35점
      if (greenBonus > 0) {
        const appliedBonus = Math.min(greenBonus, esgGreenEnergyCeiling);
        r.score = Math.min(100, r.score + appliedBonus);

        if (greenBonus > esgGreenEnergyCeiling) {
          r.eligibilityReasons.push(`${reasons.join(' + ')} - 녹색/신재생 자금 최우선 (가점 ${appliedBonus}점, Ceiling 적용)`);
        } else {
          r.eligibilityReasons.push(`${reasons.join(' + ')} - 녹색/신재생 자금 최우선 추천`);
        }
        r.level = r.score >= 70 ? 'high' : r.score >= 40 ? 'medium' : 'low';
      }
    });
  }

  // 긴급경영안정 상황 체크 시 → 긴급경영안정자금 우선
  if (profile.isEmergencySituation) {
    const emergencyFundIds = ['kosmes-emergency', 'semas-emergency'];
    const emergencyKeywords = ['긴급', '경영안정', '위기'];

    resultsWithBonus.forEach(r => {
      const isEmergencyFund = emergencyFundIds.includes(r.fundId) ||
                              emergencyKeywords.some(kw => r.fundName.includes(kw));

      if (isEmergencyFund) {
        r.score = Math.min(100, r.score + 30);
        r.eligibilityReasons.push('경영위기 상황 - 긴급경영안정자금 최우선 추천');
        r.level = r.score >= 70 ? 'high' : r.score >= 40 ? 'medium' : 'low';
      }
    });
  }

  // 고용증가 실적 체크 시 → 일자리 창출 관련 자금 우선
  if (profile.hasJobCreation) {
    const jobCreationFundIds = ['kodit-job-creation', 'kibo-good-job'];
    const jobCreationKeywords = ['일자리', '고용', '굿잡'];

    resultsWithBonus.forEach(r => {
      const isJobCreationFund = jobCreationFundIds.includes(r.fundId) ||
                                 jobCreationKeywords.some(kw => r.fundName.includes(kw));

      if (isJobCreationFund) {
        r.score = Math.min(100, r.score + 25);
        r.eligibilityReasons.push('고용증가 실적 보유 - 일자리창출자금 최우선 추천');
        r.level = r.score >= 70 ? 'high' : r.score >= 40 ? 'medium' : 'low';
      }
    });
  }

  // ============================================================================
  // 사회적가치 기업 전용 로직 (장애인표준사업장 / 사회적기업)
  // ============================================================================
  // - 전용자금 4개: +50점 (최우선 추천)
  // - 일반자금: 베이스 +10점 (정책적 우대 대상)
  // ============================================================================
  if (profile.isDisabledStandard || profile.isSocialEnterprise) {
    const socialFundIds = [
      'kosmes-social-enterprise',  // 사회적기업전용자금
      'semas-disabled',            // 장애인기업지원자금
      'kibo-social-venture',       // 소셜벤처보증
      'kodit-social-venture',      // 소셜벤처보증
    ];
    const socialKeywords = ['사회적', '장애인', '소셜벤처'];

    resultsWithBonus.forEach(r => {
      const isSocialFund = socialFundIds.includes(r.fundId) ||
                            socialKeywords.some(kw => r.fundName.includes(kw));

      if (isSocialFund) {
        r.score = Math.min(100, r.score + 50);
        r.eligibilityReasons.push('사회적가치 기업 전용자금 - 최우선 추천');
      } else {
        r.score = Math.min(100, r.score + 10);
        r.eligibilityReasons.push('사회적가치 기업 우대 대상');
      }
      r.level = r.score >= 70 ? 'high' : r.score >= 40 ? 'medium' : 'low';
    });
  }

  // ============================================================================
  // 충돌 조정 로직 (상충되는 특수자금 선택 시)
  // ============================================================================
  // 긴급경영 + IPO/투자유치 → 긴급경영 우선 (투융자복합금융 -20점)
  // 재창업 + 벤처투자실적 → 재도전자금 우선 (혁신성장자금 -15점)
  // ============================================================================
  if (profile.isEmergencySituation && profile.hasIpoOrInvestmentPlan) {
    resultsWithBonus.forEach(r => {
      if (r.fundId === 'kosmes-investment-loan') {
        r.score = Math.max(0, r.score - 20);
        r.warnings.push('긴급경영 상황에서 투자유치형 자금은 부적합');
        r.level = r.score >= 70 ? 'high' : r.score >= 40 ? 'medium' : 'low';
      }
    });
  }

  if (profile.isRestart && profile.hasVentureInvestment) {
    const innovationFundIds = ['kosmes-investment-loan', 'kodit-innovation-growth'];
    resultsWithBonus.forEach(r => {
      if (innovationFundIds.includes(r.fundId)) {
        r.score = Math.max(0, r.score - 15);
        r.warnings.push('재창업 기업은 재도전자금 우선 검토 권장');
        r.level = r.score >= 70 ? 'high' : r.score >= 40 ? 'medium' : 'low';
      }
    });
  }

  // ============================================================================
  // 정렬: 4단계 트랙 우선순위 (Hard Sorting)
  // ============================================================================
  // 1. 특화자금: 인증/자격 기반 전용 (exclusive 트랙)
  // 2. 직접대출: 기관이 직접 심사 (kosmes, semas의 general/policy_linked)
  // 3. 일반정책자금: 대리대출/정책연계 (kodit, kibo의 policy_linked)
  // 4. 보증서: 기보/신보 보증 기반 (guarantee 트랙)
  // ============================================================================

  const MAX_RESULTS = 5;

  // 직접대출 기관 (중진공, 소진공)
  const DIRECT_LOAN_INSTITUTIONS = ['kosmes', 'semas'];

  // 4단계 우선순위 계산 함수
  const getSortPriority = (r: DetailedMatchResult): number => {
    // 1순위: 특화자금 (exclusive)
    if (r.track === 'exclusive') return 1;

    // 2순위: 직접대출 (kosmes, semas의 general/policy_linked)
    if (DIRECT_LOAN_INSTITUTIONS.includes(r.institutionId) && r.track !== 'guarantee') return 2;

    // 3순위: 일반정책자금/대리대출 (kodit, kibo의 policy_linked)
    if (r.track === 'policy_linked' || r.track === 'general') return 3;

    // 4순위: 보증서 (guarantee)
    return 4;
  };

  // ============================================================================
  // 2단계: 기업 규모별 기관 가산점 (Dynamic Scoring)
  // ============================================================================
  // 소상공인 (micro): semas +30, kosmes +20, kodit/kibo +10
  // 소기업/중기업 (small/medium): semas +5, kosmes +30, kodit/kibo +20
  //
  // 전략산업 예외 (소상공인 + 전략산업):
  // - 중진공(kosmes)에 추가 가산점 +20 → 총 +40 (소진공 +30 추월)
  // - 이차전지, 반도체, 로봇, AI, 바이오 등은 규모가 작아도 중진공 우선
  // ============================================================================
  const getInstitutionBonus = (institutionId: string): number => {
    if (isMicro) {
      // 소상공인 (micro) - 업종별 직원 수 기준 충족
      if (institutionId === 'semas') return 30;  // 소진공 최우선
      // 전략산업이면 중진공 가산점 상향 (20 + 20 = 40)
      if (institutionId === 'kosmes') return 20 + strategicBonus;
      if (institutionId === 'kodit' || institutionId === 'kibo') return 10; // 신보/기보
    } else {
      // 소기업/중기업 (small/medium)
      if (institutionId === 'semas') return 5;   // 소진공 (비적격이지만 일부 자금 가능)
      if (institutionId === 'kosmes') return 30; // 중진공 최우선
      if (institutionId === 'kodit' || institutionId === 'kibo') return 20; // 신보/기보
    }
    return 0;
  };

  // ============================================================================
  // 인증/자격 가점 계산
  // ============================================================================
  // 인증 가점 (그룹별 1회만 인정, 총합 상한 +25)
  // ============================================================================
  // 그룹1: 기업유형 인증 (벤처 +10, 이노비즈/메인비즈 +5) → 최대 +10
  // 그룹2: 기술·연구 (연구소 +10, 특허 +5) → 최대 +10
  // 그룹3: 사업성과 (수출실적 +5) → 최대 +5
  // ============================================================================
  const getCertificationBonus = (): number => {
    // 그룹1: 기업유형 인증 (택1 최대)
    let group1 = 0;
    if (profile.isVentureCompany) group1 = 10;
    else if (profile.isInnobiz) group1 = 5;
    else if (profile.isMainbiz) group1 = 5;

    // 그룹2: 기술·연구 (택1 최대)
    let group2 = 0;
    if (profile.hasRndActivity) group2 = 10;  // 기업부설연구소
    else if (profile.hasPatent) group2 = 5;

    // 그룹3: 사업성과
    let group3 = 0;
    if (profile.hasExportRevenue) group3 = 5;

    return group1 + group2 + group3;  // 최대 +25
  };

  const certificationBonus = getCertificationBonus();

  // 기업규모 적합도 + 기관 가산점 + 인증 가점 계산
  resultsWithBonus.forEach(r => {
    const fund = POLICY_FUND_KNOWLEDGE_BASE.find(f => f.id === r.fundId);
    (r as any)._sizeScore = calculateSizeMatchScore(fund?.id, profile.companySize);
    (r as any)._sortPriority = getSortPriority(r);
    (r as any)._institutionBonus = getInstitutionBonus(r.institutionId);
    // 기관 가산점 + 인증/자격 가점 합산
    (r as any)._totalBonus = (r as any)._institutionBonus + certificationBonus;

    // ============================================================================
    // 특수목적자금 트랙 우선순위 상향 (사용자 선택 기반)
    // ============================================================================
    // 스마트공장 계획 선택 시 → 스마트공장자금 exclusive 트랙으로 간주
    if (profile.hasSmartFactoryPlan && r.fundId === 'kosmes-smart-factory') {
      (r as any)._sortPriority = 1;  // exclusive와 동일
    }

    // IPO/투자 계획 선택 시 → 투융자복합금융 exclusive 트랙으로 간주
    if (profile.hasIpoOrInvestmentPlan && r.fundId === 'kosmes-investment-loan') {
      (r as any)._sortPriority = 1;
    }

    // ESG/탄소중립 계획 선택 시 → 탄소중립자금 exclusive 트랙으로 간주
    if (profile.hasEsgInvestmentPlan && r.fundId === 'kosmes-carbon-neutral') {
      (r as any)._sortPriority = 1;
    }

    // 긴급경영 상황 선택 시 → 긴급경영안정자금 exclusive 트랙으로 간주
    if (profile.isEmergencySituation && r.fundId === 'kosmes-emergency') {
      (r as any)._sortPriority = 1;
    }

    // 전략산업 + 소상공인 + 중진공 = 이유 추가
    if (isStrategic && isMicro && r.institutionId === 'kosmes') {
      r.eligibilityReasons.push('전략산업(이차전지/반도체/AI 등) - 중진공 우선 지원');
      r.score = Math.min(100, r.score + 10); // 점수 가산
      r.level = r.score >= 70 ? 'high' : r.score >= 40 ? 'medium' : 'low';
    }
  });

  resultsWithBonus.sort((a, b) => {
    // 1단계: 트랙 우선순위 (절대적)
    const priorityDiff = (a as any)._sortPriority - (b as any)._sortPriority;
    if (priorityDiff !== 0) return priorityDiff;

    // 2단계: 같은 트랙 내에서 합산 가산점 (기관 + 인증/자격)
    const aTotalBonus = (a as any)._totalBonus || 0;
    const bTotalBonus = (b as any)._totalBonus || 0;
    if (aTotalBonus !== bTotalBonus) return bTotalBonus - aTotalBonus;

    // 3단계: 기업규모 적합도
    const aSizeScore = (a as any)._sizeScore || 50;
    const bSizeScore = (b as any)._sizeScore || 50;
    if (aSizeScore !== bSizeScore) return bSizeScore - aSizeScore;

    // 4단계: 점수순
    return b.score - a.score;
  });

  // ============================================================================
  // 3단계: 다양성 필터 (Diversity Guard)
  // ============================================================================
  // 동일 기관 자금은 Top 5 리스트 중 최대 2개까지만 포함
  // 효과: 중진공 자금이 10개 있어도 1,2위만 노출되고, 3위부터는 다른 기관에 기회
  // 예외: 특수목적자금 (스마트공장, 투융자복합, 탄소중립, 긴급경영안정)은 다양성 필터 무시
  // ============================================================================
  const MAX_PER_INSTITUTION = 2;

  // 특수목적자금 ID (다양성 필터 예외)
  const SPECIAL_PURPOSE_FUND_IDS = [
    'kosmes-smart-factory',      // 스마트공장자금
    'kosmes-investment-loan',    // 투융자복합금융
    'kosmes-carbon-neutral',     // 탄소중립자금
    'kosmes-emergency',          // 긴급경영안정자금
  ];

  const institutionCount: Record<string, number> = {};
  const diversifiedResults: DetailedMatchResult[] = [];

  for (const r of resultsWithBonus) {
    // 특수목적자금은 다양성 필터 예외 (기관 카운트에 포함 안 함)
    const isSpecialPurpose = SPECIAL_PURPOSE_FUND_IDS.includes(r.fundId);

    if (isSpecialPurpose) {
      diversifiedResults.push(r);
      if (diversifiedResults.length >= Math.min(topN, MAX_RESULTS)) break;
      continue;
    }

    const count = institutionCount[r.institutionId] || 0;
    if (count < MAX_PER_INSTITUTION) {
      diversifiedResults.push(r);
      institutionCount[r.institutionId] = count + 1;
      if (diversifiedResults.length >= Math.min(topN, MAX_RESULTS)) break;
    }
  }

  diversifiedResults.forEach(r => {
    delete (r as any)._sizeScore;
    delete (r as any)._sortPriority;
    delete (r as any)._institutionBonus;
    delete (r as any)._totalBonus;
  });

  // ============================================================================
  // 고도화된 적격 사유 생성 (3사 통합: Claude + Gemini + GPT)
  // ============================================================================
  // 1단계: 기존 자동 문구 생성 (기본 fallback)
  // 2단계: generateDetailedReasons()로 상세 적격 사유 생성
  // ============================================================================
  const enhancedResults: EnhancedMatchResult[] = diversifiedResults.map(r => {
    const fund = POLICY_FUND_KNOWLEDGE_BASE.find(f => f.id === r.fundId);

    // 기존 eligibilityReasons가 비어있으면 기본 문구 생성 (fallback)
    if (r.eligibilityReasons.length === 0) {
      const institutionLabels: Record<string, string> = {
        'kosmes': '중진공 직접대출',
        'semas': '소진공 직접대출',
        'kodit': '신용보증기금 보증',
        'kibo': '기술보증기금 보증',
      };
      const institutionLabel = institutionLabels[r.institutionId] || '정책자금';

      if (r.track === 'exclusive') {
        r.eligibilityReasons.push(`전용자금 요건 충족 - ${institutionLabel} 우선 지원 대상`);
      } else if (r.track === 'policy_linked') {
        r.eligibilityReasons.push(`정책연계 자금 적합 - ${institutionLabel} 지원 가능`);
      } else if (r.track === 'guarantee') {
        r.eligibilityReasons.push(`${institutionLabel} 심사 요건 충족`);
      } else {
        r.eligibilityReasons.push(`${institutionLabel} 일반 지원 요건 충족`);
      }

      if (fund?.terms.amount.max) {
        const maxInBillion = Math.round(fund.terms.amount.max / 100000000);
        if (maxInBillion > 0) {
          r.eligibilityReasons.push(`최대 ${maxInBillion}억원 한도`);
        }
      }
    }

    // 고도화된 적격 사유 생성 (3사 통합)
    let detailedReasons: EnhancedMatchResult['detailedReasons'] = [];
    let aiJudgment: EnhancedMatchResult['aiJudgment'] = {
      killerPoint: '기본 요건 충족으로 신청 가능합니다',
      improvementTip: '현재 조건으로 최적 매칭 상태입니다',
      actionGuide: '신청 전 해당 기관 홈페이지에서 최신 공고 내용을 확인하십시오',
      relatedFunds: [],
      scoreBreakdown: '',
    };

    if (fund) {
      try {
        const detailed = generateDetailedReasons(profile, fund);
        detailedReasons = detailed.detailedReasons;
        aiJudgment = detailed.aiJudgment;
      } catch (e) {
        // 에러 발생 시 기본값 유지
        console.warn(`Failed to generate detailed reasons for ${fund.id}:`, e);
      }
    }

    return {
      ...r,
      detailedReasons,
      aiJudgment,
    } as EnhancedMatchResult;
  });

  // ============================================================================
  // 점수 차별화 (GPT 제안 반영)
  // ============================================================================
  // 1위만 100점 유지, 2순위부터 순차 감점
  // 효과: 모든 자금이 100점으로 수렴하는 문제 해결
  // ============================================================================
  enhancedResults.forEach((result, index) => {
    const rank = index + 1;
    if (rank === 2) {
      result.score = Math.max(0, result.score - 3);
    } else if (rank === 3) {
      result.score = Math.max(0, result.score - 6);
    } else if (rank === 4) {
      result.score = Math.max(0, result.score - 9);
    } else if (rank >= 5) {
      result.score = Math.max(0, result.score - 12);
    }
    result.level = result.score >= 70 ? 'high' : result.score >= 40 ? 'medium' : 'low';
  });

  const results = enhancedResults.map((result, index) => {
    const rank = index + 1;
    return {
      ...result,
      rank,
      rankReason: generateRankReason(rank, result.track, result.fundName),
      scoreExplanation: generateScoreExplanation(result.score, result.track, result.fundName, rank),
      confidenceLabel: generateConfidenceLabel(rank, result.track, result.score),
    };
  });

  // AI 분석
  let aiAnalysis: AIAdvisorResult[] | undefined;
  if (useAI) {
    const portfolio = await analyzePortfolio(eligibilityResults.slice(0, 5), kbProfile);
    aiAnalysis = portfolio.recommendedFunds;
  } else {
    aiAnalysis = eligibilityResults.slice(0, 5).map(result =>
      quickAnalyze(result, kbProfile)
    );
  }

  const eligibleCount = results.filter(r => r.isEligible).length;

  return {
    results,
    aiAnalysis,
    summary: {
      totalFunds: POLICY_FUND_KNOWLEDGE_BASE.length,
      eligibleCount,
      topRecommendation: eligibleCount > 0 ? eligibilityResults[0].fundName : null,
    },
  };
}
