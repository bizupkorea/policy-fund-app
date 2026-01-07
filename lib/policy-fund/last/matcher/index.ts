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
} from '../types';
import {
  POLICY_FUND_KNOWLEDGE_BASE,
} from '../knowledge-base';
import { checkAllFundsEligibility } from '../eligibility';
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
// Re-exports
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

  // 체납/신용 하드컷
  if (profile.taxDelinquencyStatus === 'active' || profile.creditIssueStatus === 'current') {
    eligibilityResults = [];
  }

  // isEligible 필터링
  eligibilityResults = eligibilityResults.filter(r => r.isEligible);

  // 키워드 기반 하드컷
  eligibilityResults = eligibilityResults.filter(r => {
    const keywordResult = checkKeywordExclusion(r.fundName, profile);
    return !keywordResult?.excluded;
  });

  // 결과 변환 + 보너스 적용
  const resultsWithBonus: DetailedMatchResult[] = eligibilityResults.map(result => {
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

  // 감점 로직: 중진공 졸업제
  const kosmesPrevCount = profile.kosmesPreviousCount ?? 0;
  if (kosmesPrevCount >= 4) {
    resultsWithBonus.forEach(r => {
      if (r.institutionId === 'kosmes') {
        if (kosmesPrevCount >= 5) {
          r.score = Math.max(0, r.score - 60);
          r.warnings.push('중진공 정책자금 5회 이상 이용 (졸업제 - 신규 지원 불가)');
        } else {
          r.score = Math.max(0, r.score - 30);
          r.warnings.push('중진공 정책자금 4회 이용 (졸업제 임박)');
        }
        r.level = r.score >= 70 ? 'high' : r.score >= 40 ? 'medium' : 'low';
      }
    });
  }

  // 감점 로직: 보증기관 중복
  if (profile.currentGuaranteeOrg && profile.currentGuaranteeOrg !== 'none') {
    const usingKodit = profile.currentGuaranteeOrg === 'kodit' || profile.currentGuaranteeOrg === 'both';
    const usingKibo = profile.currentGuaranteeOrg === 'kibo' || profile.currentGuaranteeOrg === 'both';

    resultsWithBonus.forEach(r => {
      const isKodit = r.institutionId === 'kodit';
      const isKibo = r.institutionId === 'kibo';

      if ((isKibo && usingKodit) || (isKodit && usingKibo)) {
        r.score = Math.max(0, r.score - 20);
        r.warnings.push('타 보증기관 이용 중 (중복 보증 제한)');
        r.level = r.score >= 70 ? 'high' : r.score >= 40 ? 'medium' : 'low';
      }
    });
  }

  // 감점 로직: 기존 대출 잔액
  if (profile.existingLoanBalance && profile.existingLoanBalance > 0) {
    const balance = profile.existingLoanBalance;
    resultsWithBonus.forEach(r => {
      if (balance >= 15) {
        r.score = Math.max(0, r.score - 20);
        r.warnings.push('기존 정책자금 잔액 과다 (15억+, 한도 초과 우려)');
      } else if (balance >= 10) {
        r.score = Math.max(0, r.score - 10);
        r.warnings.push('기존 정책자금 잔액 10억 이상 (한도 근접)');
      } else if (balance >= 5) {
        r.score = Math.max(0, r.score - 5);
        r.warnings.push('기존 정책자금 잔액 5억 이상 (여유 한도 축소)');
      }
      r.level = r.score >= 70 ? 'high' : r.score >= 40 ? 'medium' : 'low';
    });
  }

  // 감점/가점 로직: 과거 부실
  if (profile.hasPastDefault) {
    resultsWithBonus.forEach(r => {
      const isRestartFund = r.fundId.includes('restart') || r.fundName.includes('재창업') || r.fundName.includes('재도약') || r.fundName.includes('재기');

      if (isRestartFund) {
        r.score = Math.min(100, r.score + 15);
        r.eligibilityReasons.push('부실/사고 이력 보유 (재도전 자금 적격)');
      } else {
        r.score = Math.max(0, r.score - 40);
        r.warnings.push('과거 부실/사고 이력 (보증사고, 대출연체 등)');
      }
      r.level = r.score >= 70 ? 'high' : r.score >= 40 ? 'medium' : 'low';
    });
  }

  // 감점 로직: 용도 불일치
  if (profile.requestedFundingPurpose && profile.requestedFundingPurpose !== 'both') {
    resultsWithBonus.forEach(r => {
      const fund = POLICY_FUND_KNOWLEDGE_BASE.find(f => f.id === r.fundId);
      if (fund) {
        const requested = profile.requestedFundingPurpose;
        const supportsWorking = fund.fundingPurpose.working;
        const supportsFacility = fund.fundingPurpose.facility;

        if (requested === 'working' && !supportsWorking && supportsFacility) {
          r.score = Math.max(0, r.score - 15);
          r.warnings.push('용도 불일치 (운전자금 필요, 시설자금 전용)');
          r.level = r.score >= 70 ? 'high' : r.score >= 40 ? 'medium' : 'low';
        }
        if (requested === 'facility' && !supportsFacility && supportsWorking) {
          r.score = Math.max(0, r.score - 15);
          r.warnings.push('용도 불일치 (시설자금 필요, 운전자금 전용)');
          r.level = r.score >= 70 ? 'high' : r.score >= 40 ? 'medium' : 'low';
        }
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
        r.score = Math.min(100, r.score + 15);
        r.eligibilityReasons.push('벤처투자 유치 실적 보유 - 혁신성장/스케일업 자금 적합');
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
        r.score = Math.min(100, r.score + 20);
        r.eligibilityReasons.push('재창업 기업 - 재도전 자금 최우선 추천');
        r.level = r.score >= 70 ? 'high' : r.score >= 40 ? 'medium' : 'low';
      } else {
        r.score = Math.max(0, r.score - 20);
        r.warnings.push('재창업기업에 일반자금 추천 (심사 탈락 위험)');
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
  // 벤처기업 +15, 이노비즈 +10, 메인비즈 +5, 특허보유 +10, 수출실적 +10
  // ============================================================================
  const getCertificationBonus = (): number => {
    let bonus = 0;
    if (profile.isVentureCompany) bonus += 15;
    if (profile.isInnobiz) bonus += 10;
    if (profile.isMainbiz) bonus += 5;
    if (profile.hasPatent) bonus += 10;
    if (profile.hasExportRevenue) bonus += 10;
    if (profile.hasRndActivity) bonus += 5;
    return bonus;
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
  // ============================================================================
  const MAX_PER_INSTITUTION = 2;
  const institutionCount: Record<string, number> = {};
  const diversifiedResults: DetailedMatchResult[] = [];

  for (const r of resultsWithBonus) {
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

  const results = diversifiedResults.map((result, index) => {
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
