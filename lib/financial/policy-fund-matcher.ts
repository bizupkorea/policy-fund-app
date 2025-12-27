/**
 * Policy Fund Matcher (정책자금 매칭 엔진)
 *
 * 기업 프로필과 정책자금 프로그램을 매칭하여 적합도를 평가합니다.
 */

import type {
  PolicyFundProgram,
  PolicyFundAnalysis,
  CompanyPolicyProfile,
  PolicyFundSearchParams,
  PolicyFundCategory,
} from '../types/policy-fund';

/**
 * 정책자금 매칭 분석 실행
 */
export function analyzePolicyFundMatch(
  programs: PolicyFundProgram[],
  companyProfile: CompanyPolicyProfile,
  searchParams: PolicyFundSearchParams = {}
): PolicyFundAnalysis {
  console.log('🏛️ Policy Fund Matching Started...');

  // 각 프로그램에 대해 매칭 점수 계산
  const scoredPrograms = programs.map(program => ({
    ...program,
    ...calculateMatchScore(program, companyProfile),
  }));

  // 점수순 정렬
  scoredPrograms.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  // 우선순위 프로그램 (상위 5개)
  const prioritizedPrograms = scoredPrograms.slice(0, 5);

  // 카테고리별 분포 계산
  const categoryDistribution = calculateCategoryDistribution(scoredPrograms);

  // 권장사항 생성
  const recommendations = generateRecommendations(scoredPrograms, companyProfile);

  // 요약 통계
  const summary = {
    totalPrograms: scoredPrograms.length,
    highMatchPrograms: scoredPrograms.filter(p => (p.matchScore || 0) >= 70).length,
    mediumMatchPrograms: scoredPrograms.filter(p => {
      const score = p.matchScore || 0;
      return score >= 40 && score < 70;
    }).length,
    deadlineThisMonth: countDeadlineThisMonth(scoredPrograms),
  };

  console.log(`✅ Matched ${summary.highMatchPrograms} high-fit programs`);

  return {
    programs: scoredPrograms,
    summary,
    prioritizedPrograms,
    categoryDistribution,
    recommendations,
    metadata: {
      analyzedAt: new Date(),
      companyProfile,
      searchParams,
      dataSource: programs.some(p => p.detail?.crawlSuccess) ? 'api+crawl' : 'api',
    },
  };
}

/**
 * 프로그램별 매칭 점수 계산
 */
function calculateMatchScore(
  program: PolicyFundProgram,
  company: CompanyPolicyProfile
): { matchScore: number; matchReasons: string[]; unmatchReasons: string[] } {
  let score = 0;
  const matchReasons: string[] = [];
  const unmatchReasons: string[] = [];

  // 1. 기업 규모 매칭 (30점)
  const sizeScore = evaluateSizeMatch(program, company);
  score += sizeScore.score;
  if (sizeScore.score > 0) {
    matchReasons.push(...sizeScore.reasons);
  } else {
    unmatchReasons.push(...sizeScore.unmatchReasons);
  }

  // 2. 카테고리별 적합성 (25점)
  const categoryScore = evaluateCategoryMatch(program, company);
  score += categoryScore.score;
  if (categoryScore.score > 0) {
    matchReasons.push(...categoryScore.reasons);
  } else {
    unmatchReasons.push(...categoryScore.unmatchReasons);
  }

  // 3. 업종 매칭 (20점)
  const industryScore = evaluateIndustryMatch(program, company);
  score += industryScore.score;
  if (industryScore.score > 0) {
    matchReasons.push(...industryScore.reasons);
  }

  // 4. 특수 조건 매칭 (15점)
  const specialScore = evaluateSpecialConditions(program, company);
  score += specialScore.score;
  if (specialScore.score > 0) {
    matchReasons.push(...specialScore.reasons);
  }

  // 5. 신청 기간 보너스 (10점)
  const periodScore = evaluateApplicationPeriod(program);
  score += periodScore.score;
  if (periodScore.score > 0) {
    matchReasons.push(...periodScore.reasons);
  }

  return {
    matchScore: Math.min(100, Math.max(0, score)),
    matchReasons,
    unmatchReasons,
  };
}

/**
 * 기업 규모 매칭 평가
 */
function evaluateSizeMatch(
  program: PolicyFundProgram,
  company: CompanyPolicyProfile
): { score: number; reasons: string[]; unmatchReasons: string[] } {
  const reasons: string[] = [];
  const unmatchReasons: string[] = [];
  let score = 0;

  const targetText = (program.targetSummary || '').toLowerCase();
  const supportText = (program.supportSummary || '').toLowerCase();
  const combinedText = `${targetText} ${supportText}`;

  // 중소기업 관련 키워드
  if (combinedText.includes('중소') || combinedText.includes('중견')) {
    if (company.companySize === 'small' || company.companySize === 'medium') {
      score += 30;
      reasons.push('중소/중견기업 대상 프로그램');
    } else if (company.companySize === 'large') {
      unmatchReasons.push('대기업 지원 제외 가능성');
    }
  }

  // 창업기업 관련 키워드
  if (combinedText.includes('창업') || combinedText.includes('스타트업')) {
    if (company.companySize === 'startup' || company.businessAge <= 7) {
      score += 30;
      reasons.push('창업기업 우대');
    } else {
      score += 10;
    }
  }

  // 기본 점수 (특별한 조건이 없으면)
  if (score === 0) {
    score = 15;
    reasons.push('일반 기업 지원 대상');
  }

  return { score, reasons, unmatchReasons };
}

/**
 * 카테고리별 적합성 평가
 */
function evaluateCategoryMatch(
  program: PolicyFundProgram,
  company: CompanyPolicyProfile
): { score: number; reasons: string[]; unmatchReasons: string[] } {
  const reasons: string[] = [];
  const unmatchReasons: string[] = [];
  let score = 0;

  switch (program.category) {
    case 'loan':
    case 'guarantee':
      // 융자/보증: 신용등급, 재무상태 기반
      if (company.creditRating && parseInt(company.creditRating) <= 6) {
        score += 25;
        reasons.push('신용등급 양호');
      } else {
        score += 15;
        unmatchReasons.push('신용등급 확인 필요');
      }
      break;

    case 'rnd':
      // R&D: 연구개발 활동 여부
      if (company.hasRndActivity) {
        score += 25;
        reasons.push('R&D 활동 수행 중');
      } else {
        score += 10;
        unmatchReasons.push('R&D 활동 실적 필요');
      }
      break;

    case 'export':
      // 수출: 수출 실적 여부
      if (company.hasExportRevenue) {
        score += 25;
        reasons.push('수출 실적 보유');
      } else {
        score += 15;
        reasons.push('수출 계획 기업도 신청 가능');
      }
      break;

    case 'employment':
      // 고용: 직원 수 기반
      if (company.employeeCount && company.employeeCount >= 5) {
        score += 20;
        reasons.push(`직원 ${company.employeeCount}명 고용`);
      } else {
        score += 10;
      }
      break;

    case 'certification':
      // 인증: 특수 조건 확인
      if (company.isVentureCompany || company.isInnobiz || company.isMainbiz) {
        score += 20;
        reasons.push('기존 인증 보유');
      } else {
        score += 25;
        reasons.push('인증 취득 지원');
      }
      break;

    default:
      score += 15;
  }

  return { score, reasons, unmatchReasons };
}

/**
 * 업종 매칭 평가
 */
function evaluateIndustryMatch(
  program: PolicyFundProgram,
  company: CompanyPolicyProfile
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  const targetText = (program.targetSummary || '').toLowerCase();
  const industry = company.industry.toLowerCase();

  // 제조업 매칭
  if (targetText.includes('제조') && (industry.includes('제조') || industry.includes('생산'))) {
    score += 20;
    reasons.push('제조업 지원 대상');
  }

  // IT/서비스업 매칭
  if ((targetText.includes('it') || targetText.includes('서비스')) &&
      (industry.includes('it') || industry.includes('소프트웨어') || industry.includes('서비스'))) {
    score += 20;
    reasons.push('IT/서비스업 지원 대상');
  }

  // 특정 업종 제한이 없는 경우
  if (score === 0 && !targetText.includes('제외')) {
    score += 15;
    reasons.push('업종 제한 없음');
  }

  return { score, reasons };
}

/**
 * 특수 조건 매칭 평가
 */
function evaluateSpecialConditions(
  program: PolicyFundProgram,
  company: CompanyPolicyProfile
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // 벤처기업
  if (company.isVentureCompany) {
    score += 5;
    reasons.push('벤처기업 인증 보유');
  }

  // 이노비즈/메인비즈
  if (company.isInnobiz || company.isMainbiz) {
    score += 5;
    reasons.push('이노비즈/메인비즈 인증');
  }

  // 사회적기업
  if (company.isSocialEnterprise) {
    score += 5;
    reasons.push('사회적기업');
  }

  // 업력 기반 추가 점수
  if (company.businessAge >= 3 && company.businessAge <= 7) {
    score += 5;
    reasons.push('성장기 기업');
  }

  return { score, reasons };
}

/**
 * 신청 기간 평가
 */
function evaluateApplicationPeriod(
  program: PolicyFundProgram
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // 상시 접수
  if (program.applicationPeriod.includes('상시')) {
    score += 5;
    reasons.push('상시 신청 가능');
    return { score, reasons };
  }

  // 마감일 파싱
  const periodMatch = program.applicationPeriod.match(/~\s*(\d{4})\.(\d{2})\.(\d{2})/);
  if (periodMatch) {
    const endDate = new Date(
      parseInt(periodMatch[1]),
      parseInt(periodMatch[2]) - 1,
      parseInt(periodMatch[3])
    );
    const now = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysRemaining > 0 && daysRemaining <= 30) {
      score += 10;
      reasons.push(`마감 임박 (${daysRemaining}일 남음)`);
    } else if (daysRemaining > 30) {
      score += 5;
      reasons.push('신청 기간 내');
    }
  }

  return { score, reasons };
}

/**
 * 카테고리별 분포 계산
 */
function calculateCategoryDistribution(
  programs: PolicyFundProgram[]
): Record<PolicyFundCategory, number> {
  const distribution: Record<PolicyFundCategory, number> = {
    'loan': 0,
    'guarantee': 0,
    'grant': 0,
    'investment': 0,
    'consulting': 0,
    'certification': 0,
    'export': 0,
    'rnd': 0,
    'employment': 0,
    'other': 0,
  };

  for (const program of programs) {
    distribution[program.category]++;
  }

  return distribution;
}

/**
 * 이번 달 마감 프로그램 수 계산
 */
function countDeadlineThisMonth(programs: PolicyFundProgram[]): number {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  return programs.filter(program => {
    const periodMatch = program.applicationPeriod.match(/~\s*(\d{4})\.(\d{2})\.(\d{2})/);
    if (!periodMatch) return false;

    const endYear = parseInt(periodMatch[1]);
    const endMonth = parseInt(periodMatch[2]) - 1;

    return endYear === thisYear && endMonth === thisMonth;
  }).length;
}

/**
 * 권장사항 생성
 */
function generateRecommendations(
  programs: PolicyFundProgram[],
  company: CompanyPolicyProfile
): string[] {
  const recommendations: string[] = [];

  const highMatchCount = programs.filter(p => (p.matchScore || 0) >= 70).length;

  if (highMatchCount > 0) {
    recommendations.push(
      `📌 ${highMatchCount}개 프로그램이 귀사에 높은 적합도를 보입니다. 우선 검토를 권장합니다.`
    );
  }

  // 마감 임박 프로그램 안내
  const deadlineSoon = programs.filter(p => {
    const match = p.applicationPeriod.match(/~\s*(\d{4})\.(\d{2})\.(\d{2})/);
    if (!match) return false;
    const endDate = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
    const daysRemaining = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysRemaining > 0 && daysRemaining <= 14;
  });

  if (deadlineSoon.length > 0) {
    recommendations.push(
      `⏰ ${deadlineSoon.length}개 프로그램이 2주 내 마감됩니다. 서둘러 신청하세요!`
    );
  }

  // 카테고리별 추천
  const loanPrograms = programs.filter(p => p.category === 'loan' || p.category === 'guarantee');
  if (loanPrograms.length > 0) {
    recommendations.push(
      `💳 융자/보증 프로그램 ${loanPrograms.length}개가 있습니다. 자금 조달 계획이 있다면 검토하세요.`
    );
  }

  // R&D 프로그램
  if (company.hasRndActivity && programs.some(p => p.category === 'rnd')) {
    recommendations.push(
      '🔬 R&D 활동을 수행 중이시므로 R&D 지원사업을 우선 검토하세요.'
    );
  }

  // 수출 프로그램
  if (company.hasExportRevenue && programs.some(p => p.category === 'export')) {
    recommendations.push(
      '🚢 수출 실적이 있으시므로 수출지원 프로그램을 활용하세요.'
    );
  }

  // 일반 안내
  recommendations.push(
    '💡 정책자금은 예산 소진 시 조기 마감될 수 있습니다. 적합한 프로그램은 빠르게 신청하세요.'
  );

  return recommendations;
}

/**
 * 금액 포맷팅
 */
export function formatAmount(value: number): string {
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(1)}억원`;
  } else if (value >= 10000) {
    return `${Math.round(value / 10000).toLocaleString()}만원`;
  }
  return `${value.toLocaleString()}원`;
}

/**
 * 샘플 기업 프로필 (테스트용)
 */
export const SAMPLE_POLICY_PROFILE: CompanyPolicyProfile = {
  companyName: '테스트 기업',
  companySize: 'small',
  businessAge: 5,
  industry: '제조업',
  location: '서울특별시',
  annualRevenue: 5000000000, // 50억
  employeeCount: 30,
  hasExportRevenue: true,
  hasRndActivity: true,
  creditRating: '5',
  isVentureCompany: true,
};
