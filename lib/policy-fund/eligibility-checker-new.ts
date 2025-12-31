/**
 * 정책자금 자격 심사 모듈 (eligibility-checker.ts)
 *
 * 기능:
 * - 룰 기반 자격 요건 검사 (Pass/Fail)
 * - 탈락 사유별 해결 가이드 제공
 * - 여러 정책자금 일괄 검사
 */

// ============================================================================
// 타입 정의
// ============================================================================

/**
 * 기업 프로필 (자격 심사용)
 */
export interface CompanyProfile {
  name: string;
  foundedDate: string;          // 설립일 (YYYY-MM-DD)
  revenue: number;              // 매출액 (원)
  industryCode: string;         // 업종코드 (예: C제조업, G도소매, J정보통신)
  employees: number;            // 직원수
  location: string;             // 소재지 (시/도)
  ceoAge?: number;              // 대표자 나이
  hasTaxDelinquency?: boolean;  // 세금체납 여부
  hasExistingLoan?: boolean;    // 기대출 여부
  requestedFundingPurpose?: 'working' | 'facility' | 'both';  // 요청 자금용도
  certifications?: {
    venture?: boolean;          // 벤처기업
    innobiz?: boolean;          // 이노비즈
    mainbiz?: boolean;          // 메인비즈
  };
}

/**
 * 정책자금 자격 조건
 */
export interface PolicyEligibilityCriteria {
  // 업력 조건
  businessAgeMin?: number;      // 최소 업력 (년)
  businessAgeMax?: number;      // 최대 업력 (년)

  // 매출 조건 (원)
  revenueMin?: number;          // 최소 매출
  revenueMax?: number;          // 최대 매출

  // 직원수 조건
  employeeMin?: number;
  employeeMax?: number;

  // 대표자 나이 조건 (청년전용)
  ceoAgeMax?: number;           // 예: 39세 이하

  // 업종 조건
  allowedIndustries?: string[]; // 허용 업종 코드/이름
  excludedIndustries?: string[]; // 제외 업종 코드/이름

  // 지역 조건
  allowedRegions?: string[];    // 허용 지역

  // 제외 조건
  excludeTaxDelinquent?: boolean;  // 세금체납자 제외
  excludeExistingLoan?: boolean;   // 기대출자 제외

  // 필수 인증
  requiredCertifications?: ('venture' | 'innobiz' | 'mainbiz')[];

  // 자금 용도
  fundingPurpose?: {
    working: boolean;   // 운전자금 지원
    facility: boolean;  // 시설자금 지원
  };
}

/**
 * 개별 체크 결과
 */
interface CheckResult {
  passed: boolean;
  message: string;
  isWarning?: boolean;  // 경고 여부 (불확실한 경우)
}

/**
 * 자격 심사 결과
 */
export interface EligibilityResult {
  isEligible: boolean;          // 자격 충족 여부
  passedChecks: string[];       // 통과한 조건들
  failedChecks: string[];       // 실패한 조건들 (탈락 사유)
  warnings: string[];           // 경고/확인 필요 사항
}

/**
 * 해결 가이드
 */
export interface Suggestion {
  issue: string;                // 문제 (탈락 사유)
  solution: string;             // 해결 방안
  alternatives?: string[];      // 대안 정책자금
  actionRequired?: boolean;     // 즉시 조치 필요 여부
}

// ============================================================================
// 업력 계산
// ============================================================================

/**
 * 설립일로부터 정확한 업력(만 연도) 계산
 */
export function calculateBusinessYears(foundedDate: string): number {
  const founded = new Date(foundedDate);
  const today = new Date();

  // 유효하지 않은 날짜 처리
  if (isNaN(founded.getTime())) {
    return 0;
  }

  let years = today.getFullYear() - founded.getFullYear();

  // 월/일 비교로 정확한 만 연도 계산
  const monthDiff = today.getMonth() - founded.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < founded.getDate())) {
    years--;
  }

  return Math.max(0, years);
}

// ============================================================================
// 개별 체크 함수
// ============================================================================

/**
 * 업력 조건 체크
 */
function checkBusinessAge(
  company: CompanyProfile,
  criteria: PolicyEligibilityCriteria
): CheckResult {
  const { businessAgeMin, businessAgeMax } = criteria;
  const businessYears = calculateBusinessYears(company.foundedDate);

  // 조건 없음
  if (businessAgeMin === undefined && businessAgeMax === undefined) {
    return { passed: true, message: '업력 제한 없음' };
  }

  // 최소 업력 체크
  if (businessAgeMin !== undefined && businessYears < businessAgeMin) {
    return {
      passed: false,
      message: `업력 ${businessYears}년으로 최소 업력(${businessAgeMin}년 이상) 조건 미달`
    };
  }

  // 최대 업력 체크
  if (businessAgeMax !== undefined && businessYears > businessAgeMax) {
    return {
      passed: false,
      message: `업력 ${businessYears}년으로 창업초기(${businessAgeMax}년 이내) 조건 초과`
    };
  }

  return {
    passed: true,
    message: `업력 ${businessYears}년으로 조건 충족`
  };
}

/**
 * 매출 조건 체크
 */
function checkRevenue(
  company: CompanyProfile,
  criteria: PolicyEligibilityCriteria
): CheckResult {
  const { revenueMin, revenueMax } = criteria;
  const revenue = company.revenue;

  // 조건 없음
  if (revenueMin === undefined && revenueMax === undefined) {
    return { passed: true, message: '매출 제한 없음' };
  }

  const formatRevenue = (amount: number): string => {
    if (amount >= 100000000) {
      return `${(amount / 100000000).toFixed(1)}억원`;
    } else if (amount >= 10000) {
      return `${(amount / 10000).toFixed(0)}만원`;
    }
    return `${amount}원`;
  };

  // 최소 매출 체크
  if (revenueMin !== undefined && revenue < revenueMin) {
    return {
      passed: false,
      message: `매출 ${formatRevenue(revenue)}으로 최소 매출(${formatRevenue(revenueMin)}) 조건 미달`
    };
  }

  // 최대 매출 체크
  if (revenueMax !== undefined && revenue > revenueMax) {
    return {
      passed: false,
      message: `매출 ${formatRevenue(revenue)}으로 최대 매출(${formatRevenue(revenueMax)}) 초과`
    };
  }

  return {
    passed: true,
    message: `매출 ${formatRevenue(revenue)}으로 조건 충족`
  };
}

/**
 * 직원수 조건 체크
 */
function checkEmployees(
  company: CompanyProfile,
  criteria: PolicyEligibilityCriteria
): CheckResult {
  const { employeeMin, employeeMax } = criteria;
  const employees = company.employees;

  // 조건 없음
  if (employeeMin === undefined && employeeMax === undefined) {
    return { passed: true, message: '직원수 제한 없음' };
  }

  // 최소 직원수 체크
  if (employeeMin !== undefined && employees < employeeMin) {
    return {
      passed: false,
      message: `직원 ${employees}명으로 최소 직원수(${employeeMin}명 이상) 조건 미달`
    };
  }

  // 최대 직원수 체크
  if (employeeMax !== undefined && employees > employeeMax) {
    return {
      passed: false,
      message: `직원 ${employees}명으로 최대 직원수(${employeeMax}명 이하) 초과`
    };
  }

  return {
    passed: true,
    message: `직원 ${employees}명으로 조건 충족`
  };
}

/**
 * 대표자 나이 조건 체크 (청년전용)
 */
function checkCeoAge(
  company: CompanyProfile,
  criteria: PolicyEligibilityCriteria
): CheckResult {
  const { ceoAgeMax } = criteria;
  const ceoAge = company.ceoAge;

  // 조건 없음
  if (ceoAgeMax === undefined) {
    return { passed: true, message: '대표자 연령 제한 없음' };
  }

  // 대표자 나이 정보 없음
  if (ceoAge === undefined) {
    return {
      passed: false,
      message: `청년(만 ${ceoAgeMax}세 이하) 조건 확인 필요 - 대표자 연령 정보 없음`,
      isWarning: true
    };
  }

  // 청년 조건 체크
  if (ceoAge > ceoAgeMax) {
    return {
      passed: false,
      message: `대표자 연령 ${ceoAge}세로 청년(만 ${ceoAgeMax}세 이하) 조건 미충족`
    };
  }

  return {
    passed: true,
    message: `대표자 연령 ${ceoAge}세로 청년 조건 충족`
  };
}

/**
 * 업종 조건 체크
 */
function checkIndustry(
  company: CompanyProfile,
  criteria: PolicyEligibilityCriteria
): CheckResult {
  const { allowedIndustries, excludedIndustries } = criteria;
  const industryCode = company.industryCode.toUpperCase();

  // 제외 업종 체크 (우선)
  if (excludedIndustries && excludedIndustries.length > 0) {
    const isExcluded = excludedIndustries.some(excluded => {
      const upperExcluded = excluded.toUpperCase();
      return industryCode.includes(upperExcluded) ||
             upperExcluded.includes(industryCode) ||
             company.industryCode.includes(excluded);
    });

    if (isExcluded) {
      return {
        passed: false,
        message: `업종 '${company.industryCode}'은(는) 지원 제외 대상`
      };
    }
  }

  // 허용 업종 체크
  if (allowedIndustries && allowedIndustries.length > 0) {
    // 전 업종 허용인 경우
    if (allowedIndustries.some(a => a === '전업종' || a === '전 업종' || a === 'ALL')) {
      return { passed: true, message: '전 업종 지원 가능' };
    }

    const isAllowed = allowedIndustries.some(allowed => {
      const upperAllowed = allowed.toUpperCase();
      return industryCode.includes(upperAllowed) ||
             upperAllowed.includes(industryCode) ||
             company.industryCode.includes(allowed);
    });

    if (!isAllowed) {
      return {
        passed: false,
        message: `업종 '${company.industryCode}'은(는) 지원 대상 아님 (지원: ${allowedIndustries.join(', ')})`
      };
    }
  }

  return {
    passed: true,
    message: `업종 '${company.industryCode}' 지원 가능`
  };
}

/**
 * 지역 조건 체크
 */
function checkRegion(
  company: CompanyProfile,
  criteria: PolicyEligibilityCriteria
): CheckResult {
  const { allowedRegions } = criteria;
  const location = company.location;

  // 조건 없음
  if (!allowedRegions || allowedRegions.length === 0) {
    return { passed: true, message: '지역 제한 없음 (전국)' };
  }

  // 전국 지원인 경우
  if (allowedRegions.some(r => r === '전국' || r === '전 지역' || r === 'ALL')) {
    return { passed: true, message: '전국 지원 가능' };
  }

  // 지역 매칭 체크
  const isAllowed = allowedRegions.some(region =>
    location.includes(region) || region.includes(location)
  );

  if (!isAllowed) {
    return {
      passed: false,
      message: `소재지 '${location}'은(는) 지원 대상 지역 아님 (지원: ${allowedRegions.join(', ')})`
    };
  }

  return {
    passed: true,
    message: `소재지 '${location}' 지원 가능`
  };
}

/**
 * 제외 조건 체크 (세금체납, 기대출)
 */
function checkExclusions(
  company: CompanyProfile,
  criteria: PolicyEligibilityCriteria
): CheckResult {
  const { excludeTaxDelinquent, excludeExistingLoan } = criteria;
  const failures: string[] = [];

  // 세금 체납 체크
  if (excludeTaxDelinquent && company.hasTaxDelinquency) {
    failures.push('세금 체납 이력으로 지원 제외');
  }

  // 기대출 체크
  if (excludeExistingLoan && company.hasExistingLoan) {
    failures.push('기존 정책자금 대출로 중복 지원 제외');
  }

  if (failures.length > 0) {
    return {
      passed: false,
      message: failures.join(', ')
    };
  }

  return {
    passed: true,
    message: '제외 조건 해당 없음'
  };
}

/**
 * 필수 인증 체크 (OR 조건 - 하나라도 보유하면 통과)
 */
function checkCertifications(
  company: CompanyProfile,
  criteria: PolicyEligibilityCriteria
): CheckResult {
  const { requiredCertifications } = criteria;

  // 조건 없음
  if (!requiredCertifications || requiredCertifications.length === 0) {
    return { passed: true, message: '필수 인증 없음' };
  }

  const certifications = company.certifications || {};

  const certNames: Record<string, string> = {
    venture: '벤처기업',
    innobiz: '이노비즈',
    mainbiz: '메인비즈'
  };

  // OR 조건: 필수 인증 중 하나라도 보유하면 통과
  const hasCert = requiredCertifications.some(cert => certifications[cert]);

  if (!hasCert) {
    return {
      passed: false,
      message: `필수 인증 미보유: ${requiredCertifications.map(c => certNames[c] || c).join(' 또는 ')} 중 하나 필요`
    };
  }

  // 보유한 인증 목록
  const ownedCerts = requiredCertifications.filter(cert => certifications[cert]);

  return {
    passed: true,
    message: `필수 인증 보유: ${ownedCerts.map(c => certNames[c]).join(', ')}`
  };
}

/**
 * 자금 용도 체크
 */
function checkFundingPurpose(
  company: CompanyProfile,
  criteria: PolicyEligibilityCriteria
): CheckResult {
  const { requestedFundingPurpose } = company;
  const { fundingPurpose } = criteria;

  // 요청 용도가 없으면 체크 스킵
  if (!requestedFundingPurpose) {
    return { passed: true, message: '자금 용도 미지정 (전체 대상)' };
  }

  // 정책자금에 용도 정보가 없으면 체크 스킵
  if (!fundingPurpose) {
    return { passed: true, message: '자금 용도 제한 없음' };
  }

  const purposeNames = {
    working: '운전자금',
    facility: '시설자금',
    both: '운전/시설자금'
  };

  // 요청 용도에 따라 체크
  if (requestedFundingPurpose === 'working' && !fundingPurpose.working) {
    return {
      passed: false,
      message: '운전자금 미지원 (시설자금 전용 상품)'
    };
  }

  if (requestedFundingPurpose === 'facility' && !fundingPurpose.facility) {
    return {
      passed: false,
      message: '시설자금 미지원 (운전자금 전용 상품)'
    };
  }

  // both인 경우 둘 다 지원해야 함
  if (requestedFundingPurpose === 'both' && (!fundingPurpose.working || !fundingPurpose.facility)) {
    const supported = [];
    if (fundingPurpose.working) supported.push('운전자금');
    if (fundingPurpose.facility) supported.push('시설자금');
    return {
      passed: true,  // 일부 지원이므로 통과하지만 경고
      message: `부분 지원: ${supported.join(', ')}만 가능`,
      isWarning: true
    };
  }

  return {
    passed: true,
    message: `${purposeNames[requestedFundingPurpose]} 지원 가능`
  };
}

// ============================================================================
// 메인 자격 심사 함수
// ============================================================================

/**
 * 자격 심사 실행
 *
 * @param company 기업 프로필
 * @param criteria 정책자금 자격 조건
 * @returns 자격 심사 결과
 */
export function checkEligibility(
  company: CompanyProfile,
  criteria: PolicyEligibilityCriteria
): EligibilityResult {
  const passedChecks: string[] = [];
  const failedChecks: string[] = [];
  const warnings: string[] = [];

  // 모든 체크 함수 실행
  const checks = [
    checkBusinessAge(company, criteria),
    checkRevenue(company, criteria),
    checkEmployees(company, criteria),
    checkCeoAge(company, criteria),
    checkIndustry(company, criteria),
    checkRegion(company, criteria),
    checkExclusions(company, criteria),
    checkCertifications(company, criteria),
    checkFundingPurpose(company, criteria),
  ];

  for (const result of checks) {
    if (result.passed) {
      passedChecks.push(result.message);
    } else if (result.isWarning) {
      warnings.push(result.message);
    } else {
      failedChecks.push(result.message);
    }
  }

  return {
    isEligible: failedChecks.length === 0,
    passedChecks,
    failedChecks,
    warnings
  };
}

// ============================================================================
// 일괄 자격 검사
// ============================================================================

/**
 * 여러 정책자금에 대해 일괄 자격 검사
 *
 * @param company 기업 프로필
 * @param criteriaList 정책자금 ID와 조건 목록
 * @returns ID별 자격 심사 결과 Map
 */
export function checkEligibilityBatch(
  company: CompanyProfile,
  criteriaList: { id: string; criteria: PolicyEligibilityCriteria }[]
): Map<string, EligibilityResult> {
  const results = new Map<string, EligibilityResult>();

  for (const { id, criteria } of criteriaList) {
    results.set(id, checkEligibility(company, criteria));
  }

  return results;
}

/**
 * 적합한 정책자금만 필터링
 */
export function filterEligiblePrograms<T extends { id: string }>(
  company: CompanyProfile,
  programs: T[],
  getCriteria: (program: T) => PolicyEligibilityCriteria
): { program: T; result: EligibilityResult }[] {
  return programs
    .map(program => ({
      program,
      result: checkEligibility(company, getCriteria(program))
    }))
    .filter(({ result }) => result.isEligible);
}

// ============================================================================
// 해결 가이드
// ============================================================================

/**
 * 탈락 사유별 해결 가이드 제공
 *
 * @param failedChecks 탈락 사유 목록
 * @returns 해결 가이드 목록
 */
export function getSuggestions(failedChecks: string[]): Suggestion[] {
  const suggestions: Suggestion[] = [];

  for (const reason of failedChecks) {
    const lowerReason = reason.toLowerCase();

    // 업력 초과
    if (lowerReason.includes('업력') && (lowerReason.includes('초과') || lowerReason.includes('이내'))) {
      suggestions.push({
        issue: reason,
        solution: '창업초기 자금 대신 성장기/도약기 기업 대상 자금을 검토하세요.',
        alternatives: ['중진공 성장공유자금', '신보 일반보증', '기보 기술보증']
      });
    }

    // 업력 미달
    else if (lowerReason.includes('업력') && lowerReason.includes('미달')) {
      suggestions.push({
        issue: reason,
        solution: '업력 요건이 낮은 창업 초기기업 대상 자금을 검토하세요.',
        alternatives: ['중진공 창업기업지원자금', '소진공 소상공인정책자금']
      });
    }

    // 청년 조건 미충족
    else if (lowerReason.includes('청년') && lowerReason.includes('미충족')) {
      suggestions.push({
        issue: reason,
        solution: '청년전용 자금은 만 39세 이하만 가능합니다. 일반 정책자금을 검토하세요.',
        alternatives: ['중진공 일반운전자금', '중진공 긴급경영안정자금']
      });
    }

    // 매출 미달
    else if (lowerReason.includes('매출') && lowerReason.includes('미달')) {
      suggestions.push({
        issue: reason,
        solution: '매출 조건이 낮은 소상공인/소기업 대상 자금을 검토하세요.',
        alternatives: ['소진공 직접대출', '신용보증재단 일반보증', '지역신보 소기업보증']
      });
    }

    // 매출 초과
    else if (lowerReason.includes('매출') && lowerReason.includes('초과')) {
      suggestions.push({
        issue: reason,
        solution: '매출 기준이 높은 중기업/중견기업 대상 자금을 검토하세요.',
        alternatives: ['산업은행 시설자금', '기업은행 중기대출']
      });
    }

    // 세금 체납
    else if (lowerReason.includes('세금') || lowerReason.includes('체납')) {
      suggestions.push({
        issue: reason,
        solution: '체납 세금을 완납한 후 납세증명서를 다시 발급받으세요.',
        actionRequired: true
      });
    }

    // 기대출
    else if (lowerReason.includes('기존') && lowerReason.includes('대출')) {
      suggestions.push({
        issue: reason,
        solution: '기존 정책자금 대출 상환 후 재신청하거나, 한도 내 추가 신청을 검토하세요.',
        alternatives: ['보증 상품으로 전환', '일반 은행 대출']
      });
    }

    // 업종 제외
    else if (lowerReason.includes('업종') && (lowerReason.includes('제외') || lowerReason.includes('아님'))) {
      suggestions.push({
        issue: reason,
        solution: '업종 제한이 없거나 해당 업종을 지원하는 자금을 검토하세요.',
        alternatives: ['전업종 대상 정책자금 검색']
      });
    }

    // 지역 제한
    else if (lowerReason.includes('지역') || lowerReason.includes('소재지')) {
      suggestions.push({
        issue: reason,
        solution: '전국 대상 정책자금 또는 해당 지역 지자체 자금을 검토하세요.',
        alternatives: ['중진공 전국 단위 자금', '해당 지역 신용보증재단']
      });
    }

    // 필수 인증 미보유
    else if (lowerReason.includes('인증') && lowerReason.includes('미보유')) {
      suggestions.push({
        issue: reason,
        solution: '필요한 인증을 취득하거나, 인증 요건이 없는 자금을 검토하세요.',
        alternatives: ['인증 취득 지원 사업', '일반 정책자금']
      });
    }

    // 직원수 관련
    else if (lowerReason.includes('직원')) {
      suggestions.push({
        issue: reason,
        solution: '기업 규모에 맞는 자금을 검토하세요.',
        alternatives: ['소상공인 대상 자금', '중소기업 대상 자금']
      });
    }

    // 기타
    else {
      suggestions.push({
        issue: reason,
        solution: '해당 조건을 충족하거나 다른 정책자금을 검토하세요.'
      });
    }
  }

  return suggestions;
}

// ============================================================================
// 유틸리티
// ============================================================================

/**
 * 자격 심사 결과 요약 문자열 생성
 */
export function summarizeEligibility(result: EligibilityResult): string {
  if (result.isEligible) {
    return `✅ 자격 충족 (${result.passedChecks.length}개 조건 통과)`;
  }

  return `❌ 자격 미충족 (탈락 사유 ${result.failedChecks.length}개)\n` +
         result.failedChecks.map((r, i) => `  ${i + 1}. ${r}`).join('\n');
}

/**
 * 해결 가이드 요약 문자열 생성
 */
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
