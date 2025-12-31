/**
 * 정책자금 적합도 매칭 엔진 v2.0
 *
 * 기능:
 * - 룰 기반 기업-정책자금 매칭
 * - 파싱된 조건 필드 기반 정밀 매칭
 * - 매칭 불가 사유 자동 생성 (핵심!)
 * - 컨설턴트용 브리핑 스크립트 생성
 */

import { PolicyFundProgram, CompanyPolicyProfile } from '@/lib/types/policy-fund';

export type MatchLevel = 'high' | 'medium' | 'low';

export interface MatchResult {
  score: number;           // 0-100
  level: MatchLevel;       // 높음/보통/낮음
  reasons: string[];       // 적합 사유
  warnings: string[];      // 주의 사항
}

/**
 * 파싱된 공고 데이터 (조건 분해 필드 포함)
 */
export interface ParsedPolicyConditions {
  // 업력 조건
  businessAgeMin?: number;
  businessAgeMax?: number;
  businessAgeCondition?: string;

  // 매출 조건
  revenueMin?: number;
  revenueMax?: number;
  revenueCondition?: string;

  // 직원수 조건
  employeeMin?: number;
  employeeMax?: number;
  employeeCondition?: string;

  // 업종 조건
  allowedIndustries?: string[];
  excludedIndustries?: string[];

  // 지역 조건
  allowedRegions?: string[];
  excludedRegions?: string[];

  // 제외 조건
  exclusionConditions?: string[];

  // 지원 금액
  supportAmountMin?: number;
  supportAmountMax?: number;
  supportAmountUnit?: string;

  // 금리
  interestRateMin?: number;
  interestRateMax?: number;
}

/**
 * 상세 매칭 결과 (불가 사유 포함)
 */
export interface DetailedMatchResult extends MatchResult {
  // 자금 정보
  fundId: string;
  fundName: string;
  institutionId: string;
  institutionName?: string;
  officialUrl?: string;  // 공고 원문 URL

  isEligible: boolean;
  eligibilityReasons: string[];    // 적합 사유
  ineligibilityReasons: string[];  // 불가 사유 (핵심!)
  supportDetails?: {
    amount?: string;
    interestRate?: string;
    repaymentPeriod?: string;
  };
}

/**
 * 적합도 점수 계산
 */
export function calculateMatchScore(
  program: PolicyFundProgram,
  company: CompanyPolicyProfile
): MatchResult {
  let score = 0;
  const reasons: string[] = [];
  const warnings: string[] = [];

  // 1. 업종 매칭 (30점)
  const industryScore = matchIndustry(program, company);
  score += industryScore.score;
  if (industryScore.matched) {
    reasons.push(industryScore.reason);
  } else if (industryScore.warning) {
    warnings.push(industryScore.warning);
  }

  // 2. 기업 규모 (25점)
  const sizeScore = matchCompanySize(program, company);
  score += sizeScore.score;
  if (sizeScore.matched) {
    reasons.push(sizeScore.reason);
  } else if (sizeScore.warning) {
    warnings.push(sizeScore.warning);
  }

  // 3. 지역 조건 (20점)
  const regionScore = matchRegion(program, company);
  score += regionScore.score;
  if (regionScore.matched) {
    reasons.push(regionScore.reason);
  } else if (regionScore.warning) {
    warnings.push(regionScore.warning);
  }

  // 4. 업력 조건 (15점)
  const ageScore = matchBusinessAge(program, company);
  score += ageScore.score;
  if (ageScore.matched) {
    reasons.push(ageScore.reason);
  } else if (ageScore.warning) {
    warnings.push(ageScore.warning);
  }

  // 5. 특수 우대 (10점)
  const specialScore = matchSpecialConditions(program, company);
  score += specialScore.score;
  if (specialScore.matched) {
    reasons.push(specialScore.reason);
  }

  // 등급 판정
  const level: MatchLevel = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';

  return {
    score,
    level,
    reasons,
    warnings
  };
}

interface ScoreResult {
  score: number;
  matched: boolean;
  reason: string;
  warning?: string;
}

/**
 * 업종 매칭 (30점)
 */
function matchIndustry(program: PolicyFundProgram, company: CompanyPolicyProfile): ScoreResult {
  const targetText = (program.targetSummary || '').toLowerCase();
  const supportText = (program.supportSummary || '').toLowerCase();
  const companyIndustry = company.industry.toLowerCase();

  // 업종 키워드 매칭
  const industryKeywords: Record<string, string[]> = {
    '제조': ['제조', '제조업', '생산', '공장'],
    '서비스': ['서비스', '서비스업'],
    '도소매': ['도소매', '유통', '판매'],
    'IT': ['it', '정보통신', '소프트웨어', 'sw', '테크'],
    '건설': ['건설', '건축', '시공'],
    '음식': ['음식', '식품', '외식', 'f&b'],
  };

  // 기업 업종 카테고리 찾기
  let companyCategory = '';
  for (const [category, keywords] of Object.entries(industryKeywords)) {
    if (keywords.some(kw => companyIndustry.includes(kw))) {
      companyCategory = category;
      break;
    }
  }

  // 전 업종 대상인 경우
  if (targetText.includes('전 업종') || targetText.includes('업종 무관') || targetText.includes('중소기업')) {
    return {
      score: 25,
      matched: true,
      reason: '전 업종 지원 가능'
    };
  }

  // 업종 매칭 확인
  if (companyCategory) {
    const categoryKeywords = industryKeywords[companyCategory];
    if (categoryKeywords.some(kw => targetText.includes(kw) || supportText.includes(kw))) {
      return {
        score: 30,
        matched: true,
        reason: `${companyCategory}업 지원 대상`
      };
    }
  }

  // 기본 점수 (불확실한 경우)
  return {
    score: 15,
    matched: false,
    reason: '',
    warning: '업종 적합 여부 확인 필요'
  };
}

/**
 * 기업 규모 매칭 (25점)
 */
function matchCompanySize(program: PolicyFundProgram, company: CompanyPolicyProfile): ScoreResult {
  const targetText = (program.targetSummary || '').toLowerCase();

  // 중소기업 대상 (대부분의 정책자금)
  if (targetText.includes('중소기업') || targetText.includes('중소')) {
    if (company.companySize !== 'large') {
      return {
        score: 25,
        matched: true,
        reason: '중소기업 지원 대상'
      };
    } else {
      return {
        score: 0,
        matched: false,
        reason: '',
        warning: '중소기업 대상 (대기업 제외)'
      };
    }
  }

  // 소기업 대상
  if (targetText.includes('소기업') || targetText.includes('소상공인')) {
    if (company.companySize === 'startup' || company.companySize === 'small') {
      return {
        score: 25,
        matched: true,
        reason: '소기업/소상공인 지원 대상'
      };
    }
  }

  // 창업기업 대상
  if (targetText.includes('창업') || targetText.includes('스타트업')) {
    if (company.companySize === 'startup' || company.businessAge <= 7) {
      return {
        score: 25,
        matched: true,
        reason: '창업기업 지원 대상'
      };
    }
  }

  // 기본 점수
  return {
    score: 15,
    matched: false,
    reason: '',
    warning: '기업 규모 조건 확인 필요'
  };
}

/**
 * 지역 매칭 (20점)
 */
function matchRegion(program: PolicyFundProgram, company: CompanyPolicyProfile): ScoreResult {
  const agencyName = (program.executingAgency || '').toLowerCase();
  const programName = (program.name || '').toLowerCase();
  const companyLocation = company.location.toLowerCase();

  // 전국 대상
  const nationalAgencies = ['중진공', '중소벤처기업부', '신용보증기금', '기술보증기금', '소진공'];
  if (nationalAgencies.some(agency => agencyName.includes(agency))) {
    return {
      score: 20,
      matched: true,
      reason: '전국 지원 가능'
    };
  }

  // 지역 키워드
  const regions = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
    '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];

  for (const region of regions) {
    if ((agencyName.includes(region) || programName.includes(region)) && companyLocation.includes(region)) {
      return {
        score: 20,
        matched: true,
        reason: `${region} 소재 기업 지원`
      };
    }
  }

  // 지역 제한이 있는 것 같지만 매칭 안되는 경우
  if (regions.some(r => agencyName.includes(r) || programName.includes(r))) {
    return {
      score: 5,
      matched: false,
      reason: '',
      warning: '지역 제한 있음 - 확인 필요'
    };
  }

  // 기본 점수 (지역 제한 없는 것으로 추정)
  return {
    score: 15,
    matched: true,
    reason: '지역 제한 없음'
  };
}

/**
 * 업력 매칭 (15점)
 */
function matchBusinessAge(program: PolicyFundProgram, company: CompanyPolicyProfile): ScoreResult {
  const targetText = (program.targetSummary || '').toLowerCase();
  const programName = (program.name || '').toLowerCase();

  // 업력 제한 패턴 추출
  const agePatterns = [
    { pattern: /(\d+)년\s*이내/g, type: 'max' },
    { pattern: /(\d+)년\s*이상/g, type: 'min' },
    { pattern: /창업\s*(\d+)년/g, type: 'max' },
  ];

  for (const { pattern, type } of agePatterns) {
    const match = pattern.exec(targetText) || pattern.exec(programName);
    if (match) {
      const years = parseInt(match[1]);
      if (type === 'max' && company.businessAge <= years) {
        return {
          score: 15,
          matched: true,
          reason: `업력 ${years}년 이내 조건 충족`
        };
      } else if (type === 'max' && company.businessAge > years) {
        return {
          score: 0,
          matched: false,
          reason: '',
          warning: `업력 ${years}년 이내 대상 (현재 ${company.businessAge}년)`
        };
      }
      if (type === 'min' && company.businessAge >= years) {
        return {
          score: 15,
          matched: true,
          reason: `업력 ${years}년 이상 조건 충족`
        };
      }
    }
  }

  // 업력 제한 없는 경우
  return {
    score: 10,
    matched: true,
    reason: '업력 제한 없음'
  };
}

/**
 * 특수 조건 매칭 (10점)
 */
function matchSpecialConditions(program: PolicyFundProgram, company: CompanyPolicyProfile): ScoreResult {
  const targetText = (program.targetSummary || '').toLowerCase();
  let bonusScore = 0;
  const matchedConditions: string[] = [];

  // 벤처기업
  if (company.isVentureCompany && targetText.includes('벤처')) {
    bonusScore += 5;
    matchedConditions.push('벤처기업');
  }

  // 이노비즈
  if (company.isInnobiz && targetText.includes('이노비즈')) {
    bonusScore += 5;
    matchedConditions.push('이노비즈');
  }

  // 메인비즈
  if (company.isMainbiz && targetText.includes('메인비즈')) {
    bonusScore += 5;
    matchedConditions.push('메인비즈');
  }

  // 수출기업
  if (company.hasExportRevenue && (targetText.includes('수출') || targetText.includes('해외'))) {
    bonusScore += 5;
    matchedConditions.push('수출기업');
  }

  // R&D 활동
  if (company.hasRndActivity && (targetText.includes('r&d') || targetText.includes('연구') || targetText.includes('개발'))) {
    bonusScore += 5;
    matchedConditions.push('R&D 활동');
  }

  // 최대 10점
  bonusScore = Math.min(bonusScore, 10);

  if (matchedConditions.length > 0) {
    return {
      score: bonusScore,
      matched: true,
      reason: `우대조건: ${matchedConditions.join(', ')}`
    };
  }

  return {
    score: 0,
    matched: false,
    reason: ''
  };
}

/**
 * D-Day 계산
 */
export function calculateDDay(applicationPeriod: string): number | null {
  // "2024.01.01 ~ 2024.12.31" 형식 파싱
  const datePattern = /(\d{4})\.(\d{2})\.(\d{2})\s*~\s*(\d{4})\.(\d{2})\.(\d{2})/;
  const match = applicationPeriod.match(datePattern);

  if (!match) {
    // "~ 2024.12.31" 형식
    const endPattern = /~\s*(\d{4})\.(\d{2})\.(\d{2})/;
    const endMatch = applicationPeriod.match(endPattern);
    if (endMatch) {
      const endDate = new Date(
        parseInt(endMatch[1]),
        parseInt(endMatch[2]) - 1,
        parseInt(endMatch[3])
      );
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffTime = endDate.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    return null;
  }

  const endDate = new Date(
    parseInt(match[4]),
    parseInt(match[5]) - 1,
    parseInt(match[6])
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = endDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 적합도 등급 라벨
 */
export function getMatchLevelLabel(level: MatchLevel): string {
  switch (level) {
    case 'high': return '높음';
    case 'medium': return '보통';
    case 'low': return '낮음';
  }
}

/**
 * 적합도 등급 색상
 */
export function getMatchLevelColor(level: MatchLevel): string {
  switch (level) {
    case 'high': return 'green';
    case 'medium': return 'yellow';
    case 'low': return 'gray';
  }
}

// ============================================================================
// 상세 매칭 엔진 (파싱된 조건 필드 기반)
// ============================================================================

/**
 * 확장된 기업 프로필 (상세 조건 매칭용)
 */
export interface ExtendedCompanyProfile extends CompanyPolicyProfile {
  revenue?: number;           // 연매출 (억원)
  employeeCount?: number;     // 직원 수
  industryCode?: string;      // 업종 코드
  industryName?: string;      // 업종명
  region?: string;            // 지역
  hasTaxDelinquency?: boolean;   // 세금 체납 여부
  hasPreviousSupport?: boolean;  // 기존 수혜 이력
  isYouthCompany?: boolean;      // 청년기업 여부
  hasExistingLoan?: boolean;     // 기대출 여부
  // 업력 예외 조건 (청년전용창업자금 업력 확대 등)
  businessAgeExceptions?: Array<'youth_startup_academy' | 'global_startup_academy' | 'kibo_youth_guarantee' | 'startup_success_package' | 'tips_program'>;
  // 성장 전략 및 투자 계획
  hasIpoOrInvestmentPlan?: boolean;  // IPO/투자유치 계획
  acceptsEquityDilution?: boolean;   // 지분 희석 감수 가능
  needsLargeFunding?: boolean;       // 대규모 자금 필요 (5억+)
  requiredFundingAmount?: number;    // 필요 자금 (억원)
  // 자금 용도
  requestedFundingPurpose?: 'working' | 'facility' | 'both';
  // 재창업 여부
  isRestart?: boolean;
  // 세부 자금 용도 (복수 선택)
  fundingPurposeDetails?: {
    facilityInvestment?: boolean;    // 설비 투자
    facilityInstallation?: boolean;  // 시설 설치
    rndTechUpgrade?: boolean;        // R&D / 기술 고도화
    commercialization?: boolean;     // 사업화 투자
    operatingExpenses?: boolean;     // 단순 운영자금
    environmentInvestment?: boolean; // 환경 투자 (환경 설비/시설/R&D)
  };
  // 정책자금 이용 이력
  kosmesPreviousCount?: number;  // 중진공 누적 이용 횟수 (졸업제 체크)
  currentGuaranteeOrg?: 'none' | 'kodit' | 'kibo' | 'both';  // 현재 이용 중인 보증기관
  existingLoanBalance?: number;  // 기존 정책자금 잔액 (억원)
  recentYearSubsidyAmount?: number;  // 최근 1년 정책자금 수혜액 (억원)
  hasPastDefault?: boolean;  // 과거 부실/사고 이력 (보증사고, 대출연체 등)
}

/**
 * 상세 적합도 점수 계산 (파싱된 조건 기반)
 *
 * 핵심: 불가 사유 자동 생성
 */
export function calculateDetailedMatchScore(
  program: PolicyFundProgram,
  company: ExtendedCompanyProfile,
  parsedConditions?: ParsedPolicyConditions
): DetailedMatchResult {
  const eligibilityReasons: string[] = [];
  const ineligibilityReasons: string[] = [];
  let score = 0;
  let totalPossibleScore = 0;

  // 파싱된 조건이 있으면 정밀 매칭 수행
  if (parsedConditions) {
    // 1. 업력 체크 (20점)
    totalPossibleScore += 20;
    const ageResult = checkBusinessAge(company, parsedConditions);
    if (ageResult.passed) {
      score += 20;
      eligibilityReasons.push(ageResult.reason);
    } else if (ageResult.failed) {
      ineligibilityReasons.push(ageResult.reason);
    } else {
      score += 10; // 불확실한 경우 절반 점수
    }

    // 2. 매출 체크 (15점)
    totalPossibleScore += 15;
    const revenueResult = checkRevenue(company, parsedConditions);
    if (revenueResult.passed) {
      score += 15;
      eligibilityReasons.push(revenueResult.reason);
    } else if (revenueResult.failed) {
      ineligibilityReasons.push(revenueResult.reason);
    } else {
      score += 7;
    }

    // 3. 직원수 체크 (10점)
    totalPossibleScore += 10;
    const employeeResult = checkEmployeeCount(company, parsedConditions);
    if (employeeResult.passed) {
      score += 10;
      eligibilityReasons.push(employeeResult.reason);
    } else if (employeeResult.failed) {
      ineligibilityReasons.push(employeeResult.reason);
    } else {
      score += 5;
    }

    // 4. 업종 체크 (25점)
    totalPossibleScore += 25;
    const industryResult = checkIndustry(company, parsedConditions);
    if (industryResult.passed) {
      score += 25;
      eligibilityReasons.push(industryResult.reason);
    } else if (industryResult.failed) {
      ineligibilityReasons.push(industryResult.reason);
    } else {
      score += 12;
    }

    // 5. 지역 체크 (15점)
    totalPossibleScore += 15;
    const regionResult = checkRegion(company, parsedConditions);
    if (regionResult.passed) {
      score += 15;
      eligibilityReasons.push(regionResult.reason);
    } else if (regionResult.failed) {
      ineligibilityReasons.push(regionResult.reason);
    } else {
      score += 7;
    }

    // 6. 제외 조건 체크 (15점)
    totalPossibleScore += 15;
    const exclusionResult = checkExclusions(company, parsedConditions);
    if (exclusionResult.passed) {
      score += 15;
      eligibilityReasons.push(exclusionResult.reason);
    } else if (exclusionResult.failed) {
      ineligibilityReasons.push(exclusionResult.reason);
    } else {
      score += 7;
    }

    // 점수 정규화 (0-100)
    score = Math.round((score / totalPossibleScore) * 100);
  } else {
    // 파싱된 조건 없으면 기존 로직 사용
    const basicResult = calculateMatchScore(program, company);
    score = basicResult.score;
    eligibilityReasons.push(...basicResult.reasons);
  }

  // 등급 판정
  const level: MatchLevel = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
  const isEligible = ineligibilityReasons.length === 0;

  // 지원 상세 정보
  const supportDetails = parsedConditions ? {
    amount: formatSupportAmount(
      parsedConditions.supportAmountMin,
      parsedConditions.supportAmountMax,
      parsedConditions.supportAmountUnit
    ),
    interestRate: formatInterestRate(
      parsedConditions.interestRateMin,
      parsedConditions.interestRateMax
    ),
  } : undefined;

  return {
    // 기업마당 API 프로그램용 - program.id 사용
    fundId: program.id,
    fundName: program.name,
    institutionId: program.executingAgency || 'unknown',
    institutionName: program.executingAgency,

    score,
    level,
    reasons: eligibilityReasons,
    warnings: isEligible ? [] : ['자격 조건 미충족'],
    isEligible,
    eligibilityReasons,
    ineligibilityReasons,
    supportDetails,
  };
}

// ============================================================================
// 조건별 체크 함수
// ============================================================================

interface CheckResult {
  passed: boolean;
  failed: boolean;
  reason: string;
}

/**
 * 업력 조건 체크
 */
function checkBusinessAge(
  company: ExtendedCompanyProfile,
  conditions: ParsedPolicyConditions
): CheckResult {
  const { businessAgeMin, businessAgeMax, businessAgeCondition } = conditions;
  const companyAge = company.businessAge;

  // 조건 없음
  if (!businessAgeMin && !businessAgeMax) {
    return { passed: true, failed: false, reason: '업력 제한 없음' };
  }

  // 최소 업력 체크
  if (businessAgeMin && companyAge < businessAgeMin) {
    return {
      passed: false,
      failed: true,
      reason: `업력 미달: ${businessAgeMin}년 이상 필요 (현재 ${companyAge}년)`
    };
  }

  // 최대 업력 체크
  if (businessAgeMax && companyAge > businessAgeMax) {
    return {
      passed: false,
      failed: true,
      reason: `업력 초과: ${businessAgeMax}년 이하만 가능 (현재 ${companyAge}년)`
    };
  }

  return {
    passed: true,
    failed: false,
    reason: `업력 조건 충족 (${businessAgeCondition || `${companyAge}년`})`
  };
}

/**
 * 매출 조건 체크
 */
function checkRevenue(
  company: ExtendedCompanyProfile,
  conditions: ParsedPolicyConditions
): CheckResult {
  const { revenueMin, revenueMax, revenueCondition } = conditions;
  const companyRevenue = company.revenue;

  // 조건 없거나 기업 매출 정보 없음
  if ((!revenueMin && !revenueMax) || !companyRevenue) {
    return { passed: false, failed: false, reason: '' };
  }

  // 최소 매출 체크
  if (revenueMin && companyRevenue < revenueMin) {
    return {
      passed: false,
      failed: true,
      reason: `매출 미달: ${formatCurrency(revenueMin)} 이상 필요`
    };
  }

  // 최대 매출 체크
  if (revenueMax && companyRevenue > revenueMax) {
    return {
      passed: false,
      failed: true,
      reason: `매출 초과: ${formatCurrency(revenueMax)} 이하만 가능 (현재 ${formatCurrency(companyRevenue)})`
    };
  }

  return {
    passed: true,
    failed: false,
    reason: `매출 조건 충족 (${revenueCondition || formatCurrency(companyRevenue)})`
  };
}

/**
 * 직원수 조건 체크
 */
function checkEmployeeCount(
  company: ExtendedCompanyProfile,
  conditions: ParsedPolicyConditions
): CheckResult {
  const { employeeMin, employeeMax, employeeCondition } = conditions;
  const companyEmployees = company.employeeCount;

  // 조건 없거나 기업 직원수 정보 없음
  if ((!employeeMin && !employeeMax) || !companyEmployees) {
    return { passed: false, failed: false, reason: '' };
  }

  // 최소 직원수 체크
  if (employeeMin && companyEmployees < employeeMin) {
    return {
      passed: false,
      failed: true,
      reason: `직원수 미달: ${employeeMin}명 이상 필요 (현재 ${companyEmployees}명)`
    };
  }

  // 최대 직원수 체크
  if (employeeMax && companyEmployees > employeeMax) {
    return {
      passed: false,
      failed: true,
      reason: `직원수 초과: ${employeeMax}명 이하만 가능 (현재 ${companyEmployees}명)`
    };
  }

  return {
    passed: true,
    failed: false,
    reason: `직원수 조건 충족 (${employeeCondition || `${companyEmployees}명`})`
  };
}

/**
 * 업종 조건 체크
 */
function checkIndustry(
  company: ExtendedCompanyProfile,
  conditions: ParsedPolicyConditions
): CheckResult {
  const { allowedIndustries, excludedIndustries } = conditions;
  const companyIndustry = company.industryName || company.industry;

  // 제외 업종 체크 (우선)
  if (excludedIndustries && excludedIndustries.length > 0) {
    const isExcluded = excludedIndustries.some(excluded =>
      companyIndustry.includes(excluded) || excluded.includes(companyIndustry)
    );
    if (isExcluded) {
      return {
        passed: false,
        failed: true,
        reason: `업종 제외 대상: ${companyIndustry}`
      };
    }
  }

  // 허용 업종 체크
  if (allowedIndustries && allowedIndustries.length > 0) {
    const isAllowed = allowedIndustries.some(allowed =>
      companyIndustry.includes(allowed) ||
      allowed.includes(companyIndustry) ||
      allowed === '전업종' ||
      allowed === '전 업종'
    );
    if (isAllowed) {
      return {
        passed: true,
        failed: false,
        reason: `지원 대상 업종: ${companyIndustry}`
      };
    } else {
      return {
        passed: false,
        failed: true,
        reason: `업종 불일치: ${allowedIndustries.join(', ')}만 가능 (현재 ${companyIndustry})`
      };
    }
  }

  return { passed: false, failed: false, reason: '' };
}

/**
 * 지역 조건 체크
 */
function checkRegion(
  company: ExtendedCompanyProfile,
  conditions: ParsedPolicyConditions
): CheckResult {
  const { allowedRegions, excludedRegions } = conditions;
  const companyRegion = company.region || company.location;

  // 제외 지역 체크
  if (excludedRegions && excludedRegions.length > 0) {
    const isExcluded = excludedRegions.some(excluded =>
      companyRegion.includes(excluded)
    );
    if (isExcluded) {
      return {
        passed: false,
        failed: true,
        reason: `지역 제외 대상: ${companyRegion}`
      };
    }
  }

  // 허용 지역 체크
  if (allowedRegions && allowedRegions.length > 0) {
    const isAllowed = allowedRegions.some(allowed =>
      companyRegion.includes(allowed) ||
      allowed === '전국' ||
      allowed === '전 지역'
    );
    if (isAllowed) {
      return {
        passed: true,
        failed: false,
        reason: `지원 대상 지역: ${companyRegion}`
      };
    } else {
      return {
        passed: false,
        failed: true,
        reason: `지역 제한: ${allowedRegions.join(', ')}만 가능`
      };
    }
  }

  return { passed: true, failed: false, reason: '전국 지원 가능' };
}

/**
 * 제외 조건 체크
 */
function checkExclusions(
  company: ExtendedCompanyProfile,
  conditions: ParsedPolicyConditions
): CheckResult {
  const { exclusionConditions } = conditions;

  if (!exclusionConditions || exclusionConditions.length === 0) {
    return { passed: true, failed: false, reason: '제외 조건 없음' };
  }

  const failedConditions: string[] = [];

  for (const condition of exclusionConditions) {
    const lowerCondition = condition.toLowerCase();

    // 체납 관련
    if ((lowerCondition.includes('체납') || lowerCondition.includes('세금')) && company.hasTaxDelinquency) {
      failedConditions.push('세금 체납 이력으로 인한 제외');
    }

    // 중복 수혜 관련
    if ((lowerCondition.includes('중복') || lowerCondition.includes('수혜')) && company.hasPreviousSupport) {
      failedConditions.push('동일 사업 기수혜 이력');
    }

    // 기대출 관련
    if ((lowerCondition.includes('대출') || lowerCondition.includes('기대출')) && company.hasExistingLoan) {
      failedConditions.push('기존 대출 보유로 인한 제외');
    }
  }

  if (failedConditions.length > 0) {
    return {
      passed: false,
      failed: true,
      reason: failedConditions.join(', ')
    };
  }

  return { passed: true, failed: false, reason: '제외 조건 해당 없음' };
}

// ============================================================================
// 헬퍼 함수
// ============================================================================

/**
 * 금액 포맷팅
 */
function formatCurrency(amount?: number): string {
  if (!amount) return '';
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}억원`;
  } else if (amount >= 10000) {
    return `${(amount / 10000).toFixed(0)}만원`;
  }
  return `${amount}원`;
}

/**
 * 지원 금액 포맷팅
 */
function formatSupportAmount(
  min?: number,
  max?: number,
  unit?: string
): string | undefined {
  if (!min && !max) return undefined;

  const unitStr = unit || '원';

  if (min && max) {
    return `${min}${unitStr} ~ ${max}${unitStr}`;
  } else if (max) {
    return `최대 ${max}${unitStr}`;
  } else if (min) {
    return `${min}${unitStr} 이상`;
  }
  return undefined;
}

/**
 * 금리 포맷팅
 */
function formatInterestRate(min?: number, max?: number): string | undefined {
  if (!min && !max) return undefined;

  if (min && max) {
    return `연 ${min}% ~ ${max}%`;
  } else if (max) {
    return `연 ${max}%`;
  } else if (min) {
    return `연 ${min}%`;
  }
  return undefined;
}

// ============================================================================
// 컨설턴트용 브리핑 생성
// ============================================================================

/**
 * 컨설턴트 브리핑 스크립트 생성
 */
export function generateBriefingScript(
  company: ExtendedCompanyProfile,
  matchResults: DetailedMatchResult[],
  topN: number = 3
): string {
  const sortedResults = matchResults
    .filter(r => r.isEligible)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  if (sortedResults.length === 0) {
    return `
현재 ${company.industry} 업종, 업력 ${company.businessAge}년인 기업에
적합한 정책자금을 찾지 못했습니다.

다음 조건을 확인해 주세요:
- 세금 체납 여부
- 업종 제한
- 기존 수혜 이력
    `.trim();
  }

  const topMatch = sortedResults[0];

  let script = `
대표님 회사는 ${company.industry} 업종에 업력 ${company.businessAge}년,
${company.revenue ? `연매출 ${formatCurrency(company.revenue * 100000000)}, ` : ''}
${company.employeeCount ? `직원 ${company.employeeCount}명인 ` : ''}기업입니다.

현재 ${matchResults.length}개 정책자금 중 ${sortedResults.length}개가 적합합니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 가장 적합한 정책자금:

${sortedResults.map((result, idx) => `
${idx + 1}. [${result.level === 'high' ? '★★★' : result.level === 'medium' ? '★★☆' : '★☆☆'}] 적합도 ${result.score}점

📌 적합 이유:
${result.eligibilityReasons.map(r => `   • ${r}`).join('\n')}

${result.supportDetails?.amount ? `💰 지원 금액: ${result.supportDetails.amount}` : ''}
${result.supportDetails?.interestRate ? `📊 금리: ${result.supportDetails.interestRate}` : ''}
`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ 주의사항:
본 분석 결과는 참고용이며, 실제 신청 자격은 해당 기관에서 최종 확인됩니다.
  `.trim();

  return script;
}

/**
 * 불가 사유 요약 생성 (고객 설명용)
 */
export function generateIneligibilityExplanation(
  ineligibilityReasons: string[]
): string {
  if (ineligibilityReasons.length === 0) {
    return '자격 조건을 충족합니다.';
  }

  return `
해당 정책자금에 신청이 어려운 이유:

${ineligibilityReasons.map((reason, idx) => `${idx + 1}. ${reason}`).join('\n')}

※ 다른 정책자금을 검토하시거나, 조건 변경 후 재신청을 고려해 주세요.
  `.trim();
}

// ============================================================================
// 제도 지식 기반 매칭 (Knowledge Base Integration)
// ============================================================================

import {
  CompanyProfile as KBCompanyProfile,
  EligibilityResult,
  checkAllFundsEligibility,
  getEligibleFunds,
} from './eligibility-checker';
import {
  AIAdvisorResult,
  analyzePortfolio,
  quickAnalyze,
  generateBriefingScript as generateAIBriefing,
} from './gemini-advisor';
import {
  PolicyFundKnowledge,
  POLICY_FUND_KNOWLEDGE_BASE,
  INSTITUTIONS,
  IndustryCategory,
} from './knowledge-base';

/**
 * 기존 CompanyPolicyProfile을 KBCompanyProfile로 변환
 */
export function convertToKBProfile(
  profile: ExtendedCompanyProfile
): KBCompanyProfile {
  // 업종 매핑 (12개 세분화 업종 → KB IndustryCategory)
  const industryMap: Record<string, IndustryCategory> = {
    // 테스트 페이지 12개 업종
    'manufacturing_general': 'manufacturing',
    'manufacturing_root': 'manufacturing',     // 뿌리/소부장 (정부 우대)
    'it_software': 'it_service',
    'it_hardware': 'manufacturing',            // HW는 제조업 분류
    'knowledge_service': 'it_service',         // 지식서비스
    'bio_healthcare': 'manufacturing',         // 바이오는 제조업 분류
    'future_mobility': 'manufacturing',        // 미래차/로봇은 제조업 분류
    'culture_content': 'it_service',           // 문화콘텐츠는 지식서비스 분류
    'construction_energy': 'construction',
    'wholesale_retail': 'wholesale_retail',
    'tourism_food': 'food_service',
    'other_service': 'other_service',
    // 기존 키워드 매핑 (하위 호환)
    '제조': 'manufacturing',
    'IT': 'it_service',
    '도소매': 'wholesale_retail',
    '음식': 'food_service',
    '건설': 'construction',
    '물류': 'logistics',
  };

  let industry: IndustryCategory = 'other_service';
  const companyIndustry = profile.industryName || profile.industry || '';
  
  // 직접 매핑 먼저 시도
  if (industryMap[companyIndustry]) {
    industry = industryMap[companyIndustry];
  } else {
    // 키워드 검색
    const lowerIndustry = companyIndustry.toLowerCase();
    for (const [key, value] of Object.entries(industryMap)) {
      if (lowerIndustry.includes(key)) {
        industry = value;
        break;
      }
    }
  }

  // 인증 매핑
  const certifications: Array<'venture' | 'innobiz' | 'mainbiz' | 'micro' | 'small' | 'medium'> = [];
  if (profile.isVentureCompany) certifications.push('venture');
  if (profile.isInnobiz) certifications.push('innobiz');
  if (profile.isMainbiz) certifications.push('mainbiz');
  if (profile.companySize === 'startup' || profile.companySize === 'small') {
    certifications.push('small');
  }

  return {
    companyName: profile.companyName,
    businessNumber: profile.businessNumber,
    businessAge: profile.businessAge,
    annualRevenue: profile.revenue ? profile.revenue * 100000000 : undefined, // 억원 → 원
    employeeCount: profile.employeeCount,
    industry,
    industryDetail: profile.industryName || profile.industry,
    region: profile.region || profile.location,
    certifications,
    ownerCharacteristics: profile.isYouthCompany ? ['youth'] : undefined,
    hasTaxDelinquency: profile.hasTaxDelinquency,
    hasBankDelinquency: false, // 기존 프로필에 없는 필드
    isInactive: false,
    hasCreditIssue: false,
    hasExportExperience: profile.hasExportRevenue,
    hasTechAssets: profile.hasRndActivity,
    isEmergencySituation: false,
    // 업력 예외 조건 전달
    businessAgeExceptions: profile.businessAgeExceptions,
    // 재창업 여부 전달
    isRestart: profile.isRestart,
  };
}

/**
 * EligibilityResult를 DetailedMatchResult로 변환
 */
export function convertToDetailedMatchResult(
  eligibilityResult: EligibilityResult,
  fund?: PolicyFundKnowledge
): DetailedMatchResult {
  const institution = fund ? INSTITUTIONS[fund.institutionId] : undefined;

  return {
    // 자금 정보
    fundId: eligibilityResult.fundId,
    fundName: eligibilityResult.fundName,
    institutionId: eligibilityResult.institutionId,
    institutionName: institution?.name,
    officialUrl: fund?.officialUrl,

    score: eligibilityResult.eligibilityScore,
    level: eligibilityResult.eligibilityScore >= 70 ? 'high' :
           eligibilityResult.eligibilityScore >= 40 ? 'medium' : 'low',
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

/**
 * 제도 지식 기반 매칭 수행
 * - 기업마당 API 데이터와 Knowledge Base를 결합
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

  // 프로필 변환
  const kbProfile = convertToKBProfile(profile);

  // 자격 체크 수행
  let eligibilityResults = checkAllFundsEligibility(kbProfile);

  // 투융자복합금융 필터링: 둘 중 하나라도 체크되면 포함
  if (!profile.hasIpoOrInvestmentPlan && !profile.acceptsEquityDilution) {
    eligibilityResults = eligibilityResults.filter(r => r.fundId !== 'kosmes-investment-loan');
  }

  // 유동화회사보증(P-CBO) 필터링: 대규모 자금 필요 체크 시에만 포함
  if (!profile.needsLargeFunding) {
    eligibilityResults = eligibilityResults.filter(r => r.fundId !== 'kodit-securitization');
  }

  // 미래환경산업육성융자 필터링: 환경 투자 체크 시에만 포함 (positive filter)
  // 환경 투자 전용 자금이므로 명시적으로 환경 투자를 선택한 경우에만 매칭
  const envFundIds = ['keiti-env-growth', 'keiti-env-facility'];  // 올바른 ID 사용
  if (profile.fundingPurposeDetails?.environmentInvestment) {
    // 환경 투자 체크됨 - 환경 자금 포함 (기존 결과 유지)
  } else {
    // 환경 투자 미체크 - 환경 자금 제외
    eligibilityResults = eligibilityResults.filter(r => !envFundIds.includes(r.fundId));
  }

  // 결과 변환 (자금 규모별 매칭 보너스 적용)
  // 중요: 보너스 점수 적용 후 재정렬 필요!
  const resultsWithBonus: DetailedMatchResult[] = eligibilityResults.map(result => {
      const fund = POLICY_FUND_KNOWLEDGE_BASE.find(f => f.id === result.fundId);
      const detailedResult = convertToDetailedMatchResult(result, fund);

      // 자금 규모별 보너스 점수
      if (profile.requiredFundingAmount && profile.requiredFundingAmount > 0 && fund) {
        const requiredAmount = profile.requiredFundingAmount * 100000000; // 억원 -> 원
        const fundMaxAmount = fund.terms.amount.max;

        if (fundMaxAmount) {
          if (requiredAmount <= fundMaxAmount) {
            // 자금 한도 내: +5점 보너스
            detailedResult.score = Math.min(100, detailedResult.score + 5);
            detailedResult.eligibilityReasons.push(`필요 자금 (${profile.requiredFundingAmount}억) 한도 충족`);
          } else {
            // 자금 한도 초과: 경고 추가
            const fundMaxInBillion = Math.round(fundMaxAmount / 100000000);
            detailedResult.warnings.push(`필요 자금 초과 (한도: ${fundMaxInBillion}억원)`);
          }
        }

        // 대규모 자금 필요 시 특수 자금 우대 (10억+)
        if (profile.requiredFundingAmount >= 10) {
          if (result.fundId === 'kodit-securitization' || result.fundId === 'kosmes-investment-loan') {
            detailedResult.score = Math.min(100, detailedResult.score + 5);
            detailedResult.eligibilityReasons.push('대규모 자금 조달에 적합');
          }
        }
      }

      // 레벨 재계산
      detailedResult.level = detailedResult.score >= 70 ? 'high' :
                             detailedResult.score >= 40 ? 'medium' : 'low';

      return detailedResult;
  });

  // ========== 추가 감점 로직 ==========

  // 1. 중진공 졸업제 체크 (단계별 감점)
  // - 4회: -30점 (주의)
  // - 5회 이상: -60점 (사실상 신청 불가)
  const kosmesPrevCount = profile.kosmesPreviousCount ?? 0;
  if (kosmesPrevCount >= 4) {
    resultsWithBonus.forEach(r => {
      if (r.institutionId === 'kosmes') {
        if (kosmesPrevCount >= 5) {
          // 5회 이상: 사실상 불가
          r.score = Math.max(0, r.score - 60);
          r.warnings.push('중진공 정책자금 5회 이상 이용 (졸업제 - 신규 지원 불가)');
        } else {
          // 4회: 주의
          r.score = Math.max(0, r.score - 30);
          r.warnings.push('중진공 정책자금 4회 이용 (졸업제 임박)');
        }
        r.level = r.score >= 70 ? 'high' : r.score >= 40 ? 'medium' : 'low';
      }
    });
  }

  // 2. 보증기관 중복 이용 체크 (신보/기보 중복 시 -20점)
  if (profile.currentGuaranteeOrg && profile.currentGuaranteeOrg !== 'none') {
    const usingKodit = profile.currentGuaranteeOrg === 'kodit' || profile.currentGuaranteeOrg === 'both';
    const usingKibo = profile.currentGuaranteeOrg === 'kibo' || profile.currentGuaranteeOrg === 'both';

    resultsWithBonus.forEach(r => {
      const isKodit = r.institutionId === 'kodit';
      const isKibo = r.institutionId === 'kibo';

      // 신보 이용 중인데 기보 자금 신청, 또는 그 반대
      if ((isKibo && usingKodit) || (isKodit && usingKibo)) {
        r.score = Math.max(0, r.score - 20);
        r.warnings.push('타 보증기관 이용 중 (중복 보증 제한)');
        r.level = r.score >= 70 ? 'high' : r.score >= 40 ? 'medium' : 'low';
      }
    });
  }

  // 3. 운전자금 통합 한도 체크 (기존 잔액 기반 단계별 감점)
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

  // 4. 최근 1년 수혜액 대비 매출 비율 체크
  if (profile.recentYearSubsidyAmount && profile.recentYearSubsidyAmount > 0 && profile.annualRevenue && profile.annualRevenue > 0) {
    const subsidyRatio = profile.recentYearSubsidyAmount / profile.annualRevenue;
    resultsWithBonus.forEach(r => {
      if (subsidyRatio > 0.5) {
        // 매출의 50% 초과 수혜 - 과다 이용
        r.score = Math.max(0, r.score - 20);
        r.warnings.push(`최근 1년 수혜액 과다 (매출 대비 ${Math.round(subsidyRatio * 100)}%)`);
      } else if (subsidyRatio > 0.33) {
        // 매출의 33% 초과 수혜
        r.score = Math.max(0, r.score - 10);
        r.warnings.push(`최근 1년 수혜액 주의 (매출 대비 ${Math.round(subsidyRatio * 100)}%)`);
      }
      r.level = r.score >= 70 ? 'high' : r.score >= 40 ? 'medium' : 'low';
    });
  }

  // 5. 부실/사고 이력 체크 (재창업/재기자금은 오히려 우대)
  if (profile.hasPastDefault) {
    resultsWithBonus.forEach(r => {
      const isRestartFund = r.fundId.includes('restart') || r.fundName.includes('재창업') || r.fundName.includes('재도약') || r.fundName.includes('재기');

      if (isRestartFund) {
        // 재창업/재기 자금은 부실 이력이 있어야 신청 가능 → 우대
        r.score = Math.min(100, r.score + 15);
        r.eligibilityReasons.push('부실/사고 이력 보유 (재도전 자금 적격)');
      } else {
        // 일반 자금은 부실 이력 시 감점
        r.score = Math.max(0, r.score - 40);
        r.warnings.push('과거 부실/사고 이력 (보증사고, 대출연체 등)');
      }
      r.level = r.score >= 70 ? 'high' : r.score >= 40 ? 'medium' : 'low';
    });
  }


  // 6. 용도 불일치 체크 (시설↔운전 불일치 -15점)
  if (profile.requestedFundingPurpose && profile.requestedFundingPurpose !== 'both') {
    resultsWithBonus.forEach(r => {
      const fund = POLICY_FUND_KNOWLEDGE_BASE.find(f => f.id === r.fundId);
      if (fund) {
        const requested = profile.requestedFundingPurpose;
        const supportsWorking = fund.fundingPurpose.working;
        const supportsFacility = fund.fundingPurpose.facility;

        // 운전자금 요청인데 운전자금 미지원
        if (requested === 'working' && !supportsWorking && supportsFacility) {
          r.score = Math.max(0, r.score - 15);
          r.warnings.push('용도 불일치 (운전자금 필요, 시설자금 전용)');
          r.level = r.score >= 70 ? 'high' : r.score >= 40 ? 'medium' : 'low';
        }
        // 시설자금 요청인데 시설자금 미지원
        if (requested === 'facility' && !supportsFacility && supportsWorking) {
          r.score = Math.max(0, r.score - 15);
          r.warnings.push('용도 불일치 (시설자금 필요, 운전자금 전용)');
          r.level = r.score >= 70 ? 'high' : r.score >= 40 ? 'medium' : 'low';
        }
      }
    });
  }

  // 7. 재창업 기업 처리 (재창업자금 +20점 보너스 / 일반자금 -20점 감점)
  if (profile.isRestart) {
    resultsWithBonus.forEach(r => {
      const isRestartFund = r.fundId.includes('restart') ||
                           r.fundName.includes('재창업') ||
                           r.fundName.includes('재도약') ||
                           r.fundName.includes('재기') ||
                           r.fundName.includes('재도전');

      if (isRestartFund) {
        // 재창업 전용 자금: +20점 보너스 (최우선 추천)
        r.score = Math.min(100, r.score + 20);
        r.eligibilityReasons.push('재창업 기업 - 재도전 자금 최우선 추천');
        r.level = r.score >= 70 ? 'high' : r.score >= 40 ? 'medium' : 'low';
      } else {
        // 일반 자금: -20점 감점 (심사 탈락 위험 반영)
        r.score = Math.max(0, r.score - 20);
        r.warnings.push('재창업기업에 일반자금 추천 (심사 탈락 위험)');
        r.level = r.score >= 70 ? 'high' : r.score >= 40 ? 'medium' : 'low';
      }
    });
  }

  // 감점 적용 후 점수 내림차순 재정렬 및 상위 N개 선택
  const results = resultsWithBonus
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  // AI 분석 (옵션)
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

/**
 * 하이브리드 매칭: 기업마당 API + Knowledge Base
 * - 기업마당 API에서 가져온 프로그램과 Knowledge Base를 모두 활용
 */
export function hybridMatch(
  programs: PolicyFundProgram[],
  company: ExtendedCompanyProfile
): {
  apiResults: DetailedMatchResult[];    // 기업마당 API 기반
  kbResults: DetailedMatchResult[];     // Knowledge Base 기반
  combined: DetailedMatchResult[];       // 합산 결과
} {
  // 1. 기업마당 API 프로그램 매칭 (기존 로직)
  const apiResults = programs.map(program => {
    return calculateDetailedMatchScore(program, company);
  });

  // 2. Knowledge Base 매칭 (신규)
  const kbProfile = convertToKBProfile(company);
  const eligibilityResults = checkAllFundsEligibility(kbProfile);
  const kbResults = eligibilityResults.map(result => {
    const fund = POLICY_FUND_KNOWLEDGE_BASE.find(f => f.id === result.fundId);
    return convertToDetailedMatchResult(result, fund);
  });

  // 3. 결과 합산 (중복 제거, 점수순 정렬)
  const combined = [...apiResults, ...kbResults]
    .sort((a, b) => b.score - a.score);

  return {
    apiResults,
    kbResults,
    combined,
  };
}
