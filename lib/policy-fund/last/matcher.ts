/**
 * lib/policy-fund/last/matcher.ts
 *
 * /test 페이지 전용 매칭 엔진 (완전 독립)
 * 기존 lib/policy-fund/matching-engine.ts의 핵심 로직 복사본
 */

import {
  ExtendedCompanyProfile,
  DetailedMatchResult,
  MatchLevel,
  MatchResultTrack,
  ConfidenceLabel,
  MatchedFund,
  ConditionalFund,
  ExcludedFund,
  TrackDecision,
  ClassifiedMatchResult,
  TrackLabel,
  CompanyProfile,
  EligibilityResult,
  AIAdvisorResult,
  CompanyScale,
  OwnerCharacteristic,
  IndustryCategory,
} from './types';
import {
  PolicyFundKnowledge,
  POLICY_FUND_KNOWLEDGE_BASE,
  INSTITUTIONS,
  getFundById,
} from './knowledge-base';
import { checkAllFundsEligibility } from './eligibility';
import { analyzePortfolio, quickAnalyze } from './gemini-advisor';

// ============================================================================
// 상수
// ============================================================================

export const TRACK_LABELS: Record<MatchResultTrack, string> = {
  exclusive: '전용자금',
  policy_linked: '정책연계',
  general: '일반',
  guarantee: '보증',
};

export const TRACK_PRIORITY: Record<MatchResultTrack, number> = {
  exclusive: 1,
  policy_linked: 2,
  general: 3,
  guarantee: 4,
};

// ============================================================================
// 프로필 변환 함수
// ============================================================================

/**
 * ExtendedCompanyProfile을 CompanyProfile로 변환
 */
export function convertToKBProfile(
  profile: ExtendedCompanyProfile
): CompanyProfile {
  const industryMap: Record<string, IndustryCategory> = {
    'manufacturing_general': 'manufacturing',
    'manufacturing_root': 'manufacturing',
    'it_software': 'it_service',
    'it_hardware': 'manufacturing',
    'knowledge_service': 'it_service',
    'bio_healthcare': 'manufacturing',
    'future_mobility': 'manufacturing',
    'culture_content': 'it_service',
    'construction_energy': 'construction',
    'wholesale_retail': 'wholesale_retail',
    'tourism_food': 'food_service',
    'other_service': 'other_service',
    '제조': 'manufacturing',
    'IT': 'it_service',
    '도소매': 'wholesale_retail',
    '음식': 'food_service',
    '건설': 'construction',
    '물류': 'logistics',
  };

  let industry: IndustryCategory = 'other_service';
  const companyIndustry = profile.industryName || profile.industry || '';

  if (industryMap[companyIndustry]) {
    industry = industryMap[companyIndustry];
  } else {
    const lowerIndustry = companyIndustry.toLowerCase();
    for (const [key, value] of Object.entries(industryMap)) {
      if (lowerIndustry.includes(key)) {
        industry = value;
        break;
      }
    }
  }

  const certifications: CompanyScale[] = [];
  if (profile.isVentureCompany) certifications.push('venture');
  if (profile.isInnobiz) certifications.push('innobiz');
  if (profile.isMainbiz) certifications.push('mainbiz');
  if (profile.companySize === 'startup' || profile.companySize === 'small') {
    certifications.push('small');
  }

  const ownerCharacteristics: OwnerCharacteristic[] = [];
  if (profile.isYouthCompany) ownerCharacteristics.push('youth');
  if (profile.isFemale) ownerCharacteristics.push('female');
  if (profile.isDisabled || profile.isDisabledStandard) ownerCharacteristics.push('disabled');

  return {
    companyName: profile.companyName,
    businessNumber: profile.businessNumber,
    businessAge: profile.businessAge,
    annualRevenue: profile.revenue ? profile.revenue * 100000000 : undefined,
    employeeCount: profile.employeeCount,
    industry,
    industryDetail: profile.industryName || profile.industry,
    region: profile.region || profile.location,
    certifications,
    ownerCharacteristics: ownerCharacteristics.length > 0 ? ownerCharacteristics : undefined,
    hasTaxDelinquency: profile.hasTaxDelinquency,
    hasBankDelinquency: false,
    isInactive: false,
    hasCreditIssue: false,
    hasExportExperience: profile.hasExportRevenue,
    hasTechAssets: profile.hasRndActivity,
    isEmergencySituation: false,
    businessAgeExceptions: profile.businessAgeExceptions,
    isRestart: profile.isRestart,
  };
}

// ============================================================================
// 순위/라벨 생성 함수
// ============================================================================

function getRankRole(rank: number, track: MatchResultTrack): string {
  if (!rank) return '';
  if (rank <= 2 && track === 'exclusive') return '[최우선] ';
  if (rank === 3) return '[대안] ';
  if (rank === 4) return '[차선] ';
  if (rank >= 5) return '[참고] ';
  return '';
}

function generateRankReason(rank: number, track: MatchResultTrack, fundName: string): string {
  if (rank === 1) return `${fundName}은(는) 귀사의 정책 자격과 목적이 가장 정확히 일치하는 자금입니다.`;
  if (rank === 2 && track === 'exclusive') return `${fundName}은(는) 1순위와 함께 검토할 수 있는 전용 자금입니다.`;
  if (rank === 2) return `${fundName}은(는) 1순위 다음으로 정합성이 높은 자금입니다.`;
  if (rank === 3) return `${fundName}은(는) 전용 자금 집행이 어려울 경우의 정책 목적 유사 대안입니다.`;
  if (rank === 4) return `${fundName}은(는) 직접대출 외 보증·간접자금으로 활용 가능합니다.`;
  if (rank >= 5) return `${fundName}은(는) 참고용으로만 제시되는 자금입니다.`;
  return '';
}

function generateConfidenceLabel(rank: number, track: MatchResultTrack, score: number): ConfidenceLabel {
  if (rank <= 2 && track === 'exclusive') return '전용·우선';
  if (rank <= 2 && track === 'policy_linked') return '유력';
  if (rank === 3 || (track === 'general' && score >= 60) || (track === 'policy_linked' && score >= 50)) return '대안';
  return '플랜B';
}

function generateScoreExplanation(score: number, track: MatchResultTrack, fundName: string, rank: number): string {
  const trackKor = TRACK_LABELS[track];
  const rankRole = getRankRole(rank, track);

  if (track === 'exclusive') {
    if (score >= 90) return `${rankRole}본 자금은 귀사의 인증/자격 조건과 정책 목적이 완벽히 일치하는 ${trackKor} 자금입니다.`;
    if (score >= 80) return `${rankRole}본 자금은 귀사에 적합한 ${trackKor} 자금으로, 우선 검토 대상입니다.`;
    return `${rankRole}본 자금은 ${trackKor} 자금이나, 일부 조건 확인이 필요합니다.`;
  }
  if (track === 'policy_linked') {
    if (score >= 80) return `${rankRole}본 자금은 귀사의 사업 방향과 정책 목적이 잘 부합하는 ${trackKor} 자금입니다.`;
    if (score >= 70) return `${rankRole}본 자금은 ${trackKor} 자금으로, 현실적 대안이 될 수 있습니다.`;
    return `${rankRole}본 자금은 ${trackKor} 자금이나, 적합도 확인이 필요합니다.`;
  }
  if (track === 'general') {
    if (score >= 70) return `${rankRole}본 자금은 일반적인 지원 조건을 충족하는 ${trackKor} 자금입니다.`;
    if (score >= 60) return `${rankRole}본 자금은 기본 조건은 충족하나, 정책 정합성은 보통 수준입니다.`;
    return `${rankRole}본 자금은 조건은 충족하나, 우선순위가 낮은 ${trackKor} 자금입니다.`;
  }
  if (score >= 70) return `${rankRole}본 자금은 담보력 보완에 유용한 ${trackKor} 상품입니다.`;
  return `${rankRole}본 자금은 플랜B로 고려할 수 있는 ${trackKor} 상품입니다.`;
}

// ============================================================================
// 결과 변환 함수
// ============================================================================

/**
 * EligibilityResult를 DetailedMatchResult로 변환
 */
export function convertToDetailedMatchResult(
  eligibilityResult: EligibilityResult,
  fund?: PolicyFundKnowledge
): DetailedMatchResult {
  const institution = fund ? INSTITUTIONS[fund.institutionId] : undefined;

  const track = (fund?.track || (
    eligibilityResult.institutionId === 'kodit' || eligibilityResult.institutionId === 'kibo'
      ? 'guarantee'
      : 'general'
  ));
  const score = eligibilityResult.eligibilityScore;

  return {
    fundId: eligibilityResult.fundId,
    fundName: eligibilityResult.fundName,
    institutionId: eligibilityResult.institutionId,
    institutionName: institution?.name,
    officialUrl: fund?.officialUrl,
    track,
    trackLabel: TRACK_LABELS[track],
    scoreExplanation: generateScoreExplanation(score, track, eligibilityResult.fundName, 0),
    score,
    level: score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low',
    reasons: eligibilityResult.passedConditions.map(c => c.description),
    warnings: eligibilityResult.warningConditions.map(c => c.description),
    isEligible: eligibilityResult.isEligible,
    eligibilityReasons: eligibilityResult.passedConditions.map(c => c.description),
    ineligibilityReasons: eligibilityResult.failedConditions.map(c => c.description),
    supportDetails: fund ? {
      amount: fund.terms.amount.description,
      interestRate: fund.terms.interestRate?.description,
    } : undefined,
  };
}

// ============================================================================
// 키워드 기반 차단 함수
// ============================================================================

function checkKeywordExclusion(
  fundName: string,
  profile: ExtendedCompanyProfile
): { excluded: boolean; reason: '근거부족' | '요건불충족'; rule: string; note: string } | null {
  const name = fundName.toLowerCase();

  if (name.includes('청년') && !profile.isYouthCompany) {
    return {
      excluded: true,
      reason: '요건불충족',
      rule: '대표자연령불일치',
      note: '청년 전용 자금: 만 39세 이하 대표자만 신청 가능',
    };
  }

  if ((name.includes('기술') || name.includes('혁신') || name.includes('r&d') || name.includes('테크')) &&
      !profile.hasRndActivity && !profile.hasPatent) {
    return {
      excluded: true,
      reason: '근거부족',
      rule: '기술근거없음',
      note: '기술/혁신 자금: 특허, R&D 활동, 기술평가 근거 필요',
    };
  }

  if ((name.includes('수출') || name.includes('신시장') || name.includes('해외')) &&
      !profile.hasExportRevenue) {
    return {
      excluded: true,
      reason: '근거부족',
      rule: '수출실적없음',
      note: '수출/해외진출 자금: 수출 실적 또는 해외진출 계획 필요',
    };
  }

  if ((name.includes('투자') || name.includes('스케일업') || name.includes('투융자')) &&
      !profile.hasIpoOrInvestmentPlan && !profile.acceptsEquityDilution) {
    return {
      excluded: true,
      reason: '근거부족',
      rule: '투자의사없음',
      note: '투자 연계 자금: 투자유치 계획 또는 지분희석 감수 의사 필요',
    };
  }

  if ((name.includes('스마트공장') || name.includes('스마트팩토리') || name.includes('스마트제조')) &&
      !profile.hasSmartFactoryPlan) {
    return {
      excluded: true,
      reason: '근거부족',
      rule: '스마트공장계획없음',
      note: '스마트공장 자금: 스마트공장 구축 또는 고도화 계획 필요',
    };
  }

  if ((name.includes('탄소') || name.includes('친환경') || name.includes('그린') || name.includes('녹색')) &&
      !profile.fundingPurposeDetails?.environmentInvestment) {
    return {
      excluded: true,
      reason: '근거부족',
      rule: '환경투자계획없음',
      note: '탄소중립/친환경 자금: 환경설비 투자 또는 친환경 전환 계획 필요',
    };
  }

  if (name.includes('긴급') && !(profile as any).isEmergencySituation) {
    return {
      excluded: true,
      reason: '요건불충족',
      rule: '긴급상황없음',
      note: '긴급경영안정자금: 재해·재난 피해, 매출 급감(전년 대비 20%↓), 구조조정 등 경영위기 상황 필요',
    };
  }

  return null;
}

// ============================================================================
// 기업규모 적합도 계산
// ============================================================================

function calculateSizeMatchScore(
  fundId: string | undefined,
  companySize: string | undefined
): number {
  if (!fundId || !companySize) return 50;

  const sizeMap: Record<string, CompanyScale> = {
    'startup': 'small',
    'small': 'small',
    'medium': 'medium',
    'large': 'medium',
    'micro': 'micro',
    'venture': 'venture',
    'innobiz': 'innobiz',
    'mainbiz': 'mainbiz',
  };
  const normalizedSize: CompanyScale = sizeMap[companySize] || 'small';

  const fund = POLICY_FUND_KNOWLEDGE_BASE.find(f => f.id === fundId);
  if (!fund) return 50;

  const targetScales = fund.targetScale || ['small', 'medium'];

  const sizeCompatibility: Record<string, string[]> = {
    'micro': ['micro', 'small'],
    'small': ['small', 'micro', 'medium'],
    'medium': ['medium', 'small'],
    'venture': ['venture', 'small', 'medium'],
    'innobiz': ['innobiz', 'small', 'medium'],
    'mainbiz': ['mainbiz', 'small', 'medium'],
  };

  const compatibleSizes = sizeCompatibility[normalizedSize] || [normalizedSize];

  if (targetScales.includes(normalizedSize as CompanyScale)) return 100;
  if (compatibleSizes.some(s => targetScales.includes(s as CompanyScale))) return 80;
  return 50;
}

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

  // targetScale 하드컷
  eligibilityResults = eligibilityResults.filter(r => {
    const fund = POLICY_FUND_KNOWLEDGE_BASE.find(f => f.id === r.fundId);
    if (!fund?.targetScale || fund.targetScale.length === 0) return true;

    const sizeMap: Record<string, CompanyScale> = {
      'startup': 'small', 'small': 'small', 'medium': 'medium', 'large': 'medium',
      'micro': 'micro', 'venture': 'venture', 'innobiz': 'innobiz', 'mainbiz': 'mainbiz',
    };
    const companyScale: CompanyScale = sizeMap[profile.companySize || 'small'] || 'small';
    return fund.targetScale.includes(companyScale);
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

  // 감점 로직들
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

  // 정렬
  const MAX_RESULTS = 5;

  resultsWithBonus.forEach(r => {
    const fund = POLICY_FUND_KNOWLEDGE_BASE.find(f => f.id === r.fundId);
    (r as any)._sizeScore = calculateSizeMatchScore(fund?.id, profile.companySize);
  });

  const sortedResults = resultsWithBonus
    .sort((a, b) => {
      if (a.track === 'exclusive' && b.track !== 'exclusive') return -1;
      if (b.track === 'exclusive' && a.track !== 'exclusive') return 1;

      const aSizeScore = (a as any)._sizeScore || 50;
      const bSizeScore = (b as any)._sizeScore || 50;
      if (aSizeScore !== bSizeScore) return bSizeScore - aSizeScore;

      if (a.track !== 'guarantee' && b.track === 'guarantee') return -1;
      if (b.track !== 'guarantee' && a.track === 'guarantee') return 1;

      return b.score - a.score;
    })
    .slice(0, Math.min(topN, MAX_RESULTS));

  sortedResults.forEach(r => {
    delete (r as any)._sizeScore;
  });

  const results = sortedResults.map((result, index) => {
    const rank = index + 1;
    return {
      ...result,
      rank,
      rankReason: generateRankReason(rank, result.track, result.fundName),
      scoreExplanation: generateScoreExplanation(result.score, result.track, result.fundName, rank),
      confidenceLabel: generateConfidenceLabel(rank, result.track, result.score),
    };
  });

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

// ============================================================================
// 3분류 매칭 함수
// ============================================================================

function getTrackLabelKorean(track: MatchResultTrack): TrackLabel {
  const map: Record<MatchResultTrack, TrackLabel> = {
    exclusive: '전용',
    policy_linked: '정책연계',
    general: '일반',
    guarantee: '보증',
  };
  return map[track] || '일반';
}

function categorizeExcludedReason(
  failedConditions: Array<{ condition: string; description: string }>
): '요건불충족' | '정책목적불일치' | '근거부족' {
  for (const cond of failedConditions) {
    const desc = cond.description.toLowerCase();
    const condName = cond.condition.toLowerCase();

    if (condName.includes('청년') || condName.includes('여성') || condName.includes('장애인') ||
        desc.includes('만 39세') || desc.includes('대표자')) {
      return '요건불충족';
    }

    if (condName.includes('r&d') || condName.includes('기술') || condName.includes('수출') ||
        condName.includes('특허') || desc.includes('기술 근거') || desc.includes('수출 실적')) {
      return '근거부족';
    }

    if (condName.includes('재창업') || desc.includes('재창업')) {
      return '정책목적불일치';
    }
  }

  return '요건불충족';
}

function extractRuleTriggered(
  failedConditions: Array<{ condition: string; description: string }>
): string {
  if (failedConditions.length === 0) return '';

  const cond = failedConditions[0];
  const condName = cond.condition;
  const desc = cond.description;

  if (condName.includes('청년') || desc.includes('만 39세')) return '대표자연령불일치';
  if (condName.includes('R&D') || condName.includes('기술') || desc.includes('기술 근거')) return '기술근거없음';
  if (condName.includes('수출') || desc.includes('수출')) return '수출없음';
  if (condName.includes('재창업') || desc.includes('재창업')) return '재창업요건미충족';
  if (condName.includes('업력') || desc.includes('업력')) return '업력조건불충족';

  return condName.replace(/\s+/g, '');
}

function toExcludedFund(
  result: EligibilityResult,
  fund?: PolicyFundKnowledge
): ExcludedFund {
  const failedConds = result.failedConditions.map(c => ({
    condition: c.condition,
    description: c.description,
  }));

  const fundTrack = fund?.track || 'general';

  return {
    program_name: result.fundName,
    agency: fund ? INSTITUTIONS[fund.institutionId]?.name || result.institutionId : result.institutionId,
    track: getTrackLabelKorean(fundTrack),
    excluded_reason: categorizeExcludedReason(failedConds),
    rule_triggered: extractRuleTriggered(failedConds),
    note: result.failedConditions.length > 0
      ? result.failedConditions[0].description
      : '자격 요건 미충족',
  };
}

function generateLabel(rank: number, track: MatchResultTrack, trackKor: TrackLabel): '전용·우선' | '유력' | '대안' | '플랜B' {
  if (rank <= 2 && track === 'exclusive') return '전용·우선';
  if (rank <= 2 && track === 'policy_linked') return '유력';
  if (rank === 3) return '대안';
  return '플랜B';
}

function determineConfidence(track: MatchResultTrack, trackKor: TrackLabel, score: number): 'HIGH' | 'MEDIUM' {
  if (track === 'exclusive' && score >= 50) return 'HIGH';
  if (track === 'policy_linked' && score >= 70) return 'HIGH';
  return 'MEDIUM';
}

function toMatchedFund(
  result: EligibilityResult,
  detailedResult: DetailedMatchResult,
  fund?: PolicyFundKnowledge,
  rank?: number
): MatchedFund {
  const trackKor = getTrackLabelKorean(detailedResult.track);
  const label = generateLabel(rank || 1, detailedResult.track, trackKor);
  const confidence = determineConfidence(detailedResult.track, trackKor, detailedResult.score);

  return {
    program_name: result.fundName,
    agency: fund ? INSTITUTIONS[fund.institutionId]?.name || result.institutionId : result.institutionId,
    track: trackKor,
    label,
    confidence,
    why: '',
    hard_rules_passed: result.passedConditions.map(c => c.description),
    _score: detailedResult.score,
    _fundId: fund?.id,
  };
}

function toConditionalFund(
  result: EligibilityResult,
  detailedResult: DetailedMatchResult,
  missingVars: string[],
  whatToFix: string[],
  fund?: PolicyFundKnowledge
): ConditionalFund {
  return {
    program_name: result.fundName,
    agency: fund ? INSTITUTIONS[fund.institutionId]?.name || result.institutionId : result.institutionId,
    track: getTrackLabelKorean(detailedResult.track),
    what_is_missing: missingVars.join(', ') || '결정 변수 미확정',
    how_to_confirm: whatToFix.join(' / ') || '추가 서류 제출 시 확정 가능',
  };
}

function hasUndeterminedDecisionVariables(
  eligibilityResult: EligibilityResult,
  profile: ExtendedCompanyProfile,
  fund?: PolicyFundKnowledge
): { undetermined: boolean; missingVars: string[]; whatToFix: string[] } {
  const missingVars: string[] = [];
  const whatToFix: string[] = [];

  if (!fund) {
    return { undetermined: false, missingVars: [], whatToFix: [] };
  }

  const reqCond = fund.eligibility.requiredConditions;
  if (!reqCond) {
    return { undetermined: false, missingVars: [], whatToFix: [] };
  }

  if (reqCond.hasExportRevenue === true && profile.hasExportRevenue === undefined) {
    missingVars.push('수출실적/계획');
    whatToFix.push('수출 실적 또는 수출 계획 보유 여부를 확인하세요');
  }

  if (reqCond.hasRndActivity === true && profile.hasRndActivity === undefined) {
    missingVars.push('R&D/기술자산');
    whatToFix.push('특허, 기업부설연구소, R&D 활동 여부를 확인하세요');
  }

  if (fund.eligibility.creditRating && profile.creditRating === undefined) {
    missingVars.push('신용등급');
    whatToFix.push('기업 신용등급을 확인하세요 (NICE, KED 등)');
  }

  if (fund.eligibility.revenue && profile.revenue === undefined) {
    missingVars.push('연매출');
    whatToFix.push('최근 결산 기준 연매출액을 확인하세요');
  }

  if (fund.eligibility.employeeCount && profile.employeeCount === undefined) {
    missingVars.push('직원수');
    whatToFix.push('4대보험 가입 기준 직원수를 확인하세요');
  }

  if (fund.eligibility.businessAge?.exceptions &&
      fund.eligibility.businessAge.exceptions.length > 0 &&
      profile.businessAge > (fund.eligibility.businessAge.max || 0) &&
      (profile.businessAgeExceptions === undefined || profile.businessAgeExceptions.length === 0)) {
    missingVars.push('업력예외조건');
    whatToFix.push('청년창업사관학교, TIPS 등 업력 예외 해당 여부를 확인하세요');
  }

  return {
    undetermined: missingVars.length > 0,
    missingVars,
    whatToFix,
  };
}

function checkCreditStatus(
  profile: ExtendedCompanyProfile,
  fundTrack: string
): { status: 'pass' | 'excluded' | 'conditional'; reason: string; rule: string; note: string } {
  if (profile.taxDelinquencyStatus === 'active') {
    return {
      status: 'excluded',
      reason: '체납',
      rule: '체납_미정리',
      note: '국세/지방세 체납 중인 기업은 정책자금 신청이 제한됩니다. 체납 해소 후 신청 가능합니다.',
    };
  }

  if (profile.creditIssueStatus === 'current') {
    return {
      status: 'excluded',
      reason: '신용문제',
      rule: '현재_연체',
      note: '현재 연체/부실 상태인 기업은 정책자금 신청이 제한됩니다.',
    };
  }

  if (profile.isRestart && fundTrack === 'exclusive') {
    const validReasons = ['covid', 'recession', 'partner_default', 'disaster', 'illness', 'policy'];
    if (profile.restartReason && validReasons.includes(profile.restartReason)) {
      return { status: 'pass', reason: '', rule: '', note: '' };
    }
  }

  if (profile.taxDelinquencyStatus === 'resolving' || profile.taxDelinquencyStatus === 'installment') {
    return {
      status: 'conditional',
      reason: '체납정리중',
      rule: '체납_정리중',
      note: '체납 정리 중/분납 확정 상태 - 완납 후 신청 가능 여부 확인 필요',
    };
  }

  if (profile.creditIssueStatus === 'past_resolved') {
    return {
      status: 'conditional',
      reason: '과거신용문제',
      rule: '과거_연체해소',
      note: '과거 연체 이력 있음 - 현재 정상 상태이나 심사 시 확인 필요',
    };
  }

  if (profile.isRestart && profile.restartReason === 'unknown') {
    return {
      status: 'conditional',
      reason: '재창업사유확인필요',
      rule: '재창업_사유미확인',
      note: '재창업 사유가 불명확합니다. 정당한 사유 확인 시 재도전자금 신청 가능',
    };
  }

  return { status: 'pass', reason: '', rule: '', note: '' };
}

/**
 * 3분류 매칭 수행
 */
export async function classifyMatchResults(
  profile: ExtendedCompanyProfile,
  options: {
    topN?: number;
  } = {}
): Promise<ClassifiedMatchResult> {
  const { topN = 10 } = options;

  const kbProfile = convertToKBProfile(profile);
  let allEligibilityResults = checkAllFundsEligibility(kbProfile);

  const hasExclusiveQualification =
    profile.isDisabledStandard ||
    profile.isDisabled ||
    profile.isSocialEnterprise ||
    profile.isRestart ||
    profile.isFemale;

  let allowedTracks: TrackLabel[];
  let blockedTracksKorean: TrackLabel[];
  let trackDecisionWhy: string;

  if (hasExclusiveQualification) {
    allowedTracks = ['전용', '정책연계', '일반', '보증'];
    blockedTracksKorean = [];

    const qualifications: string[] = [];
    if (profile.isDisabledStandard) qualifications.push('장애인표준사업장');
    if (profile.isDisabled) qualifications.push('장애인기업');
    if (profile.isSocialEnterprise) qualifications.push('사회적기업');
    if (profile.isRestart) qualifications.push('재창업기업');
    if (profile.isFemale) qualifications.push('여성기업');

    trackDecisionWhy = qualifications.join(', ') + ' 자격 보유 → 전용자금 우선 추천';
  } else {
    allowedTracks = ['정책연계', '일반', '보증'];
    blockedTracksKorean = ['전용'];
    trackDecisionWhy = '전용자격 미보유 → 전용자금 신청 불가';
  }

  const trackDecision: TrackDecision = {
    allowed_tracks: allowedTracks,
    blocked_tracks: blockedTracksKorean,
    why: trackDecisionWhy,
  };

  const blockedTracks = hasExclusiveQualification ? [] : ['exclusive'];

  const matched: MatchedFund[] = [];
  const conditional: ConditionalFund[] = [];
  const excluded: ExcludedFund[] = [];

  for (const result of allEligibilityResults) {
    const fund = POLICY_FUND_KNOWLEDGE_BASE.find(f => f.id === result.fundId);
    const fundTrack = fund?.track || 'general';
    const fundTrackKorean = getTrackLabelKorean(fundTrack);

    if (blockedTracks.includes(fundTrack)) {
      excluded.push({
        program_name: result.fundName,
        agency: fund ? INSTITUTIONS[fund.institutionId]?.name || result.institutionId : result.institutionId,
        track: fundTrackKorean,
        excluded_reason: '트랙차단',
        rule_triggered: hasExclusiveQualification ? '전용자격보유→일반트랙제외' : '전용자격미보유→전용트랙제외',
        note: hasExclusiveQualification
          ? '전용자격 보유 기업은 일반자금 대신 전용자금을 우선 이용합니다'
          : '전용자금은 해당 자격(장애인/여성/재창업 등) 보유 기업만 신청 가능합니다',
      });
      continue;
    }

    const keywordExclusion = checkKeywordExclusion(result.fundName, profile);
    if (keywordExclusion && keywordExclusion.excluded) {
      excluded.push({
        program_name: result.fundName,
        agency: fund ? INSTITUTIONS[fund.institutionId]?.name || result.institutionId : result.institutionId,
        track: fundTrackKorean,
        excluded_reason: keywordExclusion.reason,
        rule_triggered: keywordExclusion.rule,
        note: keywordExclusion.note,
      });
      continue;
    }

    if (fund?.targetScale && fund.targetScale.length > 0) {
      const sizeMap: Record<string, CompanyScale> = {
        'startup': 'small', 'small': 'small', 'medium': 'medium', 'large': 'medium',
        'micro': 'micro', 'venture': 'venture', 'innobiz': 'innobiz', 'mainbiz': 'mainbiz',
      };
      const companyScale: CompanyScale = sizeMap[profile.companySize || 'small'] || 'small';
      if (!fund.targetScale.includes(companyScale)) {
        excluded.push({
          program_name: result.fundName,
          agency: INSTITUTIONS[fund.institutionId]?.name || result.institutionId,
          track: fundTrackKorean,
          excluded_reason: '기업규모 미충족',
          rule_triggered: `대상: ${fund.targetScale.join(', ')} / 귀사: ${companyScale}`,
          note: `이 자금은 ${fund.targetScale.map(s => s === 'micro' ? '소공인' : s === 'small' ? '소기업' : s === 'medium' ? '중기업' : s).join(', ')} 전용입니다.`,
        });
        continue;
      }
    }

    const creditStatus = checkCreditStatus(profile, fundTrack);
    if (creditStatus.status === 'excluded') {
      excluded.push({
        program_name: result.fundName,
        agency: fund ? INSTITUTIONS[fund.institutionId]?.name || result.institutionId : result.institutionId,
        track: fundTrackKorean,
        excluded_reason: creditStatus.reason as ExcludedFund['excluded_reason'],
        rule_triggered: creditStatus.rule,
        note: creditStatus.note,
      });
      continue;
    }

    if (!result.isEligible) {
      excluded.push(toExcludedFund(result, fund));
      continue;
    }

    const detailedResult = convertToDetailedMatchResult(result, fund);

    if (creditStatus.status === 'conditional') {
      conditional.push({
        program_name: result.fundName,
        agency: fund ? INSTITUTIONS[fund.institutionId]?.name || result.institutionId : result.institutionId,
        track: fundTrackKorean,
        what_is_missing: creditStatus.reason,
        how_to_confirm: creditStatus.note,
      });
      continue;
    }

    const { undetermined, missingVars, whatToFix } = hasUndeterminedDecisionVariables(
      result, profile, fund
    );

    if (undetermined) {
      conditional.push(toConditionalFund(result, detailedResult, missingVars, whatToFix, fund));
      continue;
    }

    const matchedFund = toMatchedFund(result, detailedResult, fund);
    matchedFund._sizeScore = calculateSizeMatchScore(fund?.id, profile.companySize);
    matched.push(matchedFund);
  }

  matched.sort((a, b) => {
    if (a.track === '전용' && b.track !== '전용') return -1;
    if (b.track === '전용' && a.track !== '전용') return 1;

    const aSizeScore = a._sizeScore || 50;
    const bSizeScore = b._sizeScore || 50;
    if (aSizeScore !== bSizeScore) return bSizeScore - aSizeScore;

    if (a.track !== '보증' && b.track === '보증') return -1;
    if (b.track !== '보증' && a.track === '보증') return 1;

    return (b._score || 0) - (a._score || 0);
  });

  const MAX_MATCHED = 5;
  const limitedMatched = matched.slice(0, MAX_MATCHED);

  limitedMatched.forEach(fund => {
    delete fund._score;
    delete fund._sizeScore;
    delete fund._fundId;
  });

  limitedMatched.forEach((fund, index) => {
    const rank = index + 1;
    const trackCode = fund.track === '전용' ? 'exclusive' :
      fund.track === '정책연계' ? 'policy_linked' :
      fund.track === '보증' ? 'guarantee' : 'general';

    if (trackCode === 'exclusive') {
      delete fund.confidence;
      fund.label = '전용·우선';
      fund.why = `${fund.program_name}은(는) 귀사의 전용자격에 해당하는 우선 검토 자금입니다.`;
    } else {
      fund.why = generateRankReason(rank, trackCode, fund.program_name);
      fund.label = generateLabel(rank, trackCode, fund.track);
    }
  });

  return {
    track_decision: trackDecision,
    matched: limitedMatched,
    conditional,
    excluded,
  };
}
