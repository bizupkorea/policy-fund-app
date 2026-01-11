/**
 * lib/policy-fund/last/eligibility/reason-generator.ts
 *
 * 3사 통합 적격 사유 생성기 (Claude + Gemini + GPT)
 *
 * 기능:
 * - 기본 자격 (Eligibility): 업력, 직원수, 업종, 매출 등 하드룰 조건
 * - 우대 가점 (Bonus): 벤처/이노비즈 인증, 청년/여성 대표자 등
 * - 전략적 부합성 (Strategy): 스마트공장, ESG, 수출 계획 등
 * - 자금 매칭: 필요 자금 vs 한도, 용도 매칭
 * - AI 종합 판정: 킬러포인트, 보완제안, 탈락경계, 실행가이드
 */

import type {
  ExtendedCompanyProfile,
  PolicyFundKnowledge,
  SafetyZone,
  SafetyZoneResult,
  SafetyThresholds,
  ImpactLevel,
  ReasonCategory,
  EligibilityReasonItem,
  DetailedEligibilityReason,
  AIJudgment,
} from '../types';

import {
  REASON_CATEGORY_LABELS,
  REASON_CATEGORY_ICONS,
  DEFAULT_SAFETY_THRESHOLDS,
} from '../types';

// ============================================================================
// 여유도 계산 함수 (GPT 제안)
// ============================================================================

/**
 * 여유도 구간 계산
 * @param current 현재값
 * @param max 기준 최대값 (max 미만이어야 통과)
 * @param thresholds 임계값 설정
 * @param unit 단위 (명, 년 등)
 */
export function calculateSafetyZone(
  current: number,
  max: number,
  thresholds: SafetyThresholds = DEFAULT_SAFETY_THRESHOLDS,
  unit: string = ''
): SafetyZoneResult {
  const margin = max - current;
  const ratio = current / max;

  let zone: SafetyZone;
  if (ratio <= thresholds.safe) {
    zone = 'safe';
  } else if (ratio <= thresholds.warning) {
    zone = 'warning';
  } else {
    zone = 'danger';
  }

  const marginLabel = margin > 0
    ? `여유: ${margin}${unit}`
    : margin === 0
      ? '기준값 도달'
      : `초과: ${Math.abs(margin)}${unit}`;

  return { zone, margin, marginLabel };
}

/**
 * 업력 여유도 계산 (년.개월 형식)
 */
export function calculateBusinessAgeSafetyZone(
  current: number,
  max: number,
  thresholds: SafetyThresholds = { safe: 0.6, warning: 0.85 }
): SafetyZoneResult {
  const margin = max - current;
  const ratio = current / max;

  let zone: SafetyZone;
  if (ratio <= thresholds.safe) {
    zone = 'safe';
  } else if (ratio <= thresholds.warning) {
    zone = 'warning';
  } else {
    zone = 'danger';
  }

  const marginYears = Math.floor(margin);
  const marginMonths = Math.round((margin % 1) * 12);
  const marginLabel = margin > 0
    ? marginYears > 0
      ? `여유: ${marginYears}년 ${marginMonths}개월`
      : `여유: ${marginMonths}개월`
    : '기준 초과';

  return { zone, margin, marginLabel };
}

// ============================================================================
// 포맷팅 헬퍼 함수
// ============================================================================

/** 업력을 년 개월 형식으로 변환 */
function formatBusinessAge(years: number): string {
  const y = Math.floor(years);
  const m = Math.round((years % 1) * 12);
  if (m === 0) return `${y}년`;
  return `${y}년 ${m}개월`;
}

/** 금액을 억원/만원 형식으로 변환 */
function formatAmount(amount: number): string {
  if (amount >= 100000000) {
    const billions = Math.floor(amount / 100000000);
    const millions = Math.floor((amount % 100000000) / 10000);
    if (millions > 0) {
      return `${billions}억 ${millions.toLocaleString()}만원`;
    }
    return `${billions}억원`;
  }
  if (amount >= 10000) {
    return `${Math.floor(amount / 10000).toLocaleString()}만원`;
  }
  return `${amount.toLocaleString()}원`;
}

/** 업종 라벨 변환 */
function getIndustryLabel(industry: string): string {
  const labels: Record<string, string> = {
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

// ============================================================================
// 기본 자격 (Eligibility) 생성 (GPT 스타일)
// ============================================================================

export function generateBasicConditions(
  profile: ExtendedCompanyProfile,
  fund: PolicyFundKnowledge
): DetailedEligibilityReason {
  const reasons: EligibilityReasonItem[] = [];

  // 1. 직원 수 조건
  if (fund.eligibility.employeeCount) {
    const max = fund.eligibility.employeeCount.max;
    const current = profile.employeeCount || 0;

    if (max !== undefined) {
      const { zone, marginLabel } = calculateSafetyZone(current, max, DEFAULT_SAFETY_THRESHOLDS, '명');
      const passed = current < max;

      reasons.push({
        field: 'employeeCount',
        fieldLabel: '기업 규모 요건',
        userValue: `상시근로자 ${current}명`,
        criterion: `(기준: ${max}인 미만)`,
        safetyZone: zone,
        margin: marginLabel,
        impactLevel: 'critical',
        impactScore: passed ? 30 : -30,
        passed,
      });
    }
  }

  // 2. 업종 조건
  if (fund.eligibility.allowedIndustries) {
    const allowed = fund.eligibility.allowedIndustries;
    const industry = profile.industry as string;
    const industryLabel = getIndustryLabel(industry);
    const isAllowed = allowed.includes('all') || allowed.includes(industry as any);

    reasons.push({
      field: 'industry',
      fieldLabel: '업종 요건',
      userValue: industryLabel,
      criterion: allowed.includes('all') ? '(전 업종 대상)' : `(지원 업종: ${allowed.map(getIndustryLabel).join(', ')})`,
      safetyZone: isAllowed ? 'safe' : 'danger',
      impactLevel: 'critical',
      impactScore: isAllowed ? 20 : -20,
      note: isAllowed && industry === 'manufacturing' ? '중진공 핵심 지원 업종' : undefined,
      passed: isAllowed,
    });
  }

  // 3. 업력 조건
  if (fund.eligibility.businessAge) {
    const max = fund.eligibility.businessAge.max;
    const current = profile.businessAge;

    if (max !== undefined) {
      const { zone, marginLabel } = calculateBusinessAgeSafetyZone(current, max);
      const passed = current <= max;

      reasons.push({
        field: 'businessAge',
        fieldLabel: '업력 요건',
        userValue: formatBusinessAge(current),
        criterion: `(기준: ${max}년 이내)`,
        safetyZone: zone,
        margin: marginLabel,
        impactLevel: 'critical',
        impactScore: passed ? 20 : -30,
        passed,
      });
    }
  }

  // 4. 매출 조건
  if (fund.eligibility.revenue && profile.annualRevenue) {
    const { min, max } = fund.eligibility.revenue;
    const current = profile.annualRevenue;
    let passed = true;
    let criterion = '';

    if (min !== undefined && max !== undefined) {
      passed = current >= min && current <= max;
      criterion = `(${formatAmount(min)} ~ ${formatAmount(max)})`;
    } else if (max !== undefined) {
      passed = current <= max;
      criterion = `(${formatAmount(max)} 이하)`;
    } else if (min !== undefined) {
      passed = current >= min;
      criterion = `(${formatAmount(min)} 이상)`;
    }

    if (criterion) {
      reasons.push({
        field: 'revenue',
        fieldLabel: '매출 요건',
        userValue: formatAmount(current),
        criterion,
        safetyZone: passed ? 'safe' : 'danger',
        impactLevel: 'supplementary',
        impactScore: passed ? 10 : -15,
        passed,
      });
    }
  }

  // 5. 신용등급 조건
  if (fund.eligibility.creditRating && profile.creditRating) {
    const maxRating = fund.eligibility.creditRating.max;
    const current = profile.creditRating;

    if (maxRating !== undefined) {
      const passed = current <= maxRating;
      reasons.push({
        field: 'creditRating',
        fieldLabel: '신용등급 요건',
        userValue: `${current}등급`,
        criterion: `(기준: ${maxRating}등급 이상)`,
        safetyZone: passed ? (current <= maxRating - 2 ? 'safe' : 'warning') : 'danger',
        margin: passed ? `여유: ${maxRating - current}등급` : '기준 미달',
        impactLevel: 'critical',
        impactScore: passed ? 15 : -25,
        passed,
      });
    }
  }

  return {
    category: 'basic',
    categoryLabel: REASON_CATEGORY_LABELS.basic,
    icon: REASON_CATEGORY_ICONS.basic,
    reasons,
  };
}

// ============================================================================
// 우대 가점 (Bonus) 생성 (Gemini 스타일)
// ============================================================================

export function generateBonusConditions(
  profile: ExtendedCompanyProfile,
  fund: PolicyFundKnowledge
): DetailedEligibilityReason {
  const reasons: EligibilityReasonItem[] = [];

  // 1. 벤처기업 인증
  if (profile.isVentureCompany) {
    reasons.push({
      field: 'venture',
      fieldLabel: '벤처기업 인증',
      userValue: '벤처기업 인증 보유',
      criterion: '기술혁신형 기업',
      safetyZone: 'safe',
      impactLevel: 'bonus',
      impactScore: 15,
      benefit: '보증료율 0.2%p 추가 감면 혜택',
      passed: true,
    });
  }

  // 2. 이노비즈 인증
  if (profile.isInnobiz) {
    reasons.push({
      field: 'innobiz',
      fieldLabel: '이노비즈 인증',
      userValue: '이노비즈 인증 보유',
      criterion: '기술혁신 중소기업',
      safetyZone: 'safe',
      impactLevel: 'bonus',
      impactScore: 12,
      benefit: '한도 2억원 증액 가능',
      passed: true,
    });
  }

  // 3. 메인비즈 인증
  if (profile.isMainbiz) {
    reasons.push({
      field: 'mainbiz',
      fieldLabel: '메인비즈 인증',
      userValue: '메인비즈 인증 보유',
      criterion: '경영혁신 중소기업',
      safetyZone: 'safe',
      impactLevel: 'bonus',
      impactScore: 10,
      benefit: '우대금리 0.1%p 적용',
      passed: true,
    });
  }

  // 4. 청년 대표자
  if (profile.isYouthCompany) {
    reasons.push({
      field: 'youth',
      fieldLabel: '청년 대표자',
      userValue: '청년 대표자 (만 39세 이하)',
      criterion: '청년기업 우대 대상',
      safetyZone: 'safe',
      impactLevel: 'bonus',
      impactScore: 10,
      benefit: '청년전용창업자금 우선 배정 대상',
      passed: true,
    });
  }

  // 5. 여성 대표자
  if (profile.isFemale) {
    reasons.push({
      field: 'female',
      fieldLabel: '여성 대표자',
      userValue: '여성 대표자',
      criterion: '여성기업 우대 대상',
      safetyZone: 'safe',
      impactLevel: 'bonus',
      impactScore: 8,
      benefit: '여성기업 전용자금 신청 가능',
      passed: true,
    });
  }

  // 6. 장애인 기업
  if (profile.isDisabled || profile.isDisabledStandard) {
    reasons.push({
      field: 'disabled',
      fieldLabel: '장애인 기업',
      userValue: profile.isDisabledStandard ? '장애인표준사업장' : '장애인 대표자',
      criterion: '사회적기업 우대 대상',
      safetyZone: 'safe',
      impactLevel: 'bonus',
      impactScore: profile.isDisabledStandard ? 15 : 10,
      benefit: '금리 0.3%p 감면, 보증료 50% 감면',
      passed: true,
    });
  }

  // 7. 특허/연구소 보유
  if (profile.hasPatent || profile.hasRndActivity) {
    reasons.push({
      field: 'techAssets',
      fieldLabel: '기술력 보유',
      userValue: profile.hasPatent ? '특허 보유' : '기업부설연구소 운영',
      criterion: '기술혁신 기업',
      safetyZone: 'safe',
      impactLevel: 'bonus',
      impactScore: 12,
      benefit: '기보 기술성 가점, 한도 상향',
      note: fund.institutionId === 'kibo' ? '기보 핵심 우대 항목' : undefined,
      passed: true,
    });
  }

  // 8. 수출 실적
  if (profile.hasExportRevenue) {
    reasons.push({
      field: 'export',
      fieldLabel: '수출 실적',
      userValue: '수출 실적 보유',
      criterion: '글로벌 성장 기업',
      safetyZone: 'safe',
      impactLevel: 'bonus',
      impactScore: 10,
      benefit: '신시장진출지원자금 우선 대상',
      passed: true,
    });
  }

  return {
    category: 'bonus',
    categoryLabel: REASON_CATEGORY_LABELS.bonus,
    icon: REASON_CATEGORY_ICONS.bonus,
    reasons,
  };
}

// ============================================================================
// 전략적 부합성 (Strategy) 생성 (Gemini 제안)
// ============================================================================

export function generateStrategicConditions(
  profile: ExtendedCompanyProfile,
  fund: PolicyFundKnowledge
): DetailedEligibilityReason {
  const reasons: EligibilityReasonItem[] = [];

  // 1. 스마트공장 계획
  if (profile.hasSmartFactoryPlan) {
    reasons.push({
      field: 'smartFactory',
      fieldLabel: '스마트공장 계획',
      userValue: '스마트공장 도입 계획',
      criterion: '제조 혁신 정책 연계',
      safetyZone: 'safe',
      impactLevel: 'bonus',
      impactScore: 20,
      note: `${profile.region || ''} 제조기업 특화 지원 연계 가능`,
      passed: true,
    });
  }

  // 2. ESG/신재생에너지 계획
  if (profile.hasEsgInvestmentPlan || profile.isGreenEnergyBusiness) {
    reasons.push({
      field: 'esg',
      fieldLabel: profile.isGreenEnergyBusiness ? '신재생에너지 사업' : 'ESG 투자 계획',
      userValue: profile.isGreenEnergyBusiness ? '신재생에너지 사업체' : 'ESG 투자 계획 보유',
      criterion: '탄소중립 정책 연계',
      safetyZone: 'safe',
      impactLevel: 'bonus',
      impactScore: 15,
      benefit: '그린뉴딜 연계 우대금리 적용 가능',
      passed: true,
    });
  }

  // 3. 고용 증대 계획
  if (profile.hasJobCreation) {
    reasons.push({
      field: 'jobCreation',
      fieldLabel: '고용 증대 계획',
      userValue: '신규 고용 계획',
      criterion: '일자리 창출 정책 연계',
      safetyZone: 'safe',
      impactLevel: 'bonus',
      impactScore: 12,
      benefit: '고용연계 정책자금 가점 적용',
      passed: true,
    });
  }

  // 4. 투자 유치 계획
  if (profile.hasVentureInvestment || profile.hasIpoOrInvestmentPlan) {
    reasons.push({
      field: 'investment',
      fieldLabel: profile.hasVentureInvestment ? '벤처투자 유치' : 'IPO/투자 계획',
      userValue: profile.hasVentureInvestment ? '벤처투자 유치 완료' : 'IPO/투자 계획 보유',
      criterion: '성장 잠재력 인정',
      safetyZone: 'safe',
      impactLevel: 'bonus',
      impactScore: 25,
      note: '투자매칭형 정책자금 우선 대상',
      passed: true,
    });
  }

  // 5. 시설투자 규모 (대규모)
  if (profile.fundingPurposeFacility && profile.requiredFundingAmount && profile.requiredFundingAmount >= 5) {
    reasons.push({
      field: 'facilityInvestment',
      fieldLabel: '대규모 시설투자',
      userValue: `시설투자 ${profile.requiredFundingAmount}억원 규모`,
      criterion: '대규모 시설자금',
      safetyZone: 'safe',
      impactLevel: 'supplementary',
      note: '10년 장기 거치 상품 최적화',
      passed: true,
    });
  }

  // 6. 재창업 기업
  if (profile.isRestart) {
    const reasonNote = profile.restartReason === 'covid' ? '코로나 피해'
      : profile.restartReason === 'disaster' ? '재해 피해'
      : profile.restartReason === 'illness' ? '질병/사고'
      : '비자발적 폐업';

    reasons.push({
      field: 'restart',
      fieldLabel: '재창업 기업',
      userValue: `재창업 기업 (${reasonNote})`,
      criterion: '재도전 지원 정책',
      safetyZone: 'safe',
      impactLevel: 'bonus',
      impactScore: 10,
      benefit: '재도전 특별보증 신청 가능',
      passed: true,
    });
  }

  return {
    category: 'strategic',
    categoryLabel: REASON_CATEGORY_LABELS.strategic,
    icon: REASON_CATEGORY_ICONS.strategic,
    reasons,
  };
}

// ============================================================================
// 자금 매칭 생성
// ============================================================================

export function generateFundingConditions(
  profile: ExtendedCompanyProfile,
  fund: PolicyFundKnowledge
): DetailedEligibilityReason {
  const reasons: EligibilityReasonItem[] = [];

  // 1. 자금 규모 매칭
  if (profile.requiredFundingAmount && fund.terms.amount.max) {
    const needed = profile.requiredFundingAmount; // 억원 단위
    const maxLimit = fund.terms.amount.max; // 원 단위일 수 있음
    const maxInBillion = maxLimit >= 100000000 ? maxLimit / 100000000 : maxLimit;
    const margin = maxInBillion - needed;
    const passed = needed <= maxInBillion;

    reasons.push({
      field: 'fundingAmount',
      fieldLabel: '자금 규모 매칭',
      userValue: `필요자금 ${needed}억원`,
      criterion: `→ 한도 ${maxInBillion}억원`,
      safetyZone: passed ? (margin >= 3 ? 'safe' : 'warning') : 'danger',
      margin: passed ? `여유분 ${margin}억원 (추가 지원 가능)` : '한도 초과',
      impactLevel: 'supplementary',
      passed,
    });
  }

  // 2. 자금 용도 매칭
  const requestedPurpose = profile.requestedFundingPurpose || 'both';
  const supportsWorking = fund.fundingPurpose.working;
  const supportsFacility = fund.fundingPurpose.facility;

  let purposeMatched = false;
  let purposeNote = '';

  if (requestedPurpose === 'working') {
    purposeMatched = supportsWorking;
    purposeNote = supportsWorking ? '운전자금 지원 가능' : '운전자금 미지원';
  } else if (requestedPurpose === 'facility') {
    purposeMatched = supportsFacility;
    purposeNote = supportsFacility ? '시설자금 지원 가능' : '시설자금 미지원';
  } else {
    purposeMatched = supportsWorking || supportsFacility;
    const supported = [];
    if (supportsWorking) supported.push('운전자금');
    if (supportsFacility) supported.push('시설자금');
    purposeNote = `${supported.join('/')} 지원 가능`;
  }

  reasons.push({
    field: 'fundingPurpose',
    fieldLabel: '자금 용도 매칭',
    userValue: requestedPurpose === 'working' ? '운전자금' : requestedPurpose === 'facility' ? '시설자금' : '운전/시설자금',
    criterion: purposeNote,
    safetyZone: purposeMatched ? 'safe' : 'danger',
    impactLevel: purposeMatched ? 'supplementary' : 'critical',
    impactScore: purposeMatched ? 5 : -100,
    passed: purposeMatched,
  });

  // 3. 금리 정보
  if (fund.terms.interestRate) {
    const { min, max, description } = fund.terms.interestRate;
    const rateDisplay = min !== undefined && max !== undefined
      ? `${min}% ~ ${max}%`
      : description;

    reasons.push({
      field: 'interestRate',
      fieldLabel: '적용 금리',
      userValue: rateDisplay,
      criterion: fund.terms.interestRate.type === 'fixed' ? '고정금리' : '변동금리',
      safetyZone: 'safe',
      impactLevel: 'supplementary',
      note: description,
      passed: true,
    });
  }

  return {
    category: 'funding',
    categoryLabel: REASON_CATEGORY_LABELS.funding,
    icon: REASON_CATEGORY_ICONS.funding,
    reasons,
  };
}

// ============================================================================
// AI 종합 판정 생성 (Gemini + GPT 통합)
// ============================================================================

export function generateAIJudgment(
  profile: ExtendedCompanyProfile,
  fund: PolicyFundKnowledge,
  allReasons: DetailedEligibilityReason[]
): AIJudgment {
  const allItems = allReasons.flatMap(r => r.reasons);

  // 점수 계산
  const passedItems = allItems.filter(r => r.passed && r.impactScore && r.impactScore > 0);
  const scoreBreakdown = passedItems
    .map(r => `${r.fieldLabel}(+${r.impactScore})`)
    .join(' + ');
  const totalScore = passedItems.reduce((sum, r) => sum + (r.impactScore || 0), 0);

  // 킬러 포인트 (가장 높은 가점 항목)
  const topBonus = allItems
    .filter(r => r.impactLevel === 'bonus' && r.passed)
    .sort((a, b) => (b.impactScore || 0) - (a.impactScore || 0))[0];

  // 탈락 경계 (경계 구간 항목)
  const warningItems = allItems.filter(r => r.safetyZone === 'warning' && r.passed);

  // 보완 제안 생성
  const improvements: string[] = [];
  if (!profile.isVentureCompany && !profile.isInnobiz) {
    improvements.push('벤처/이노비즈 인증 취득 시 한도 증액 및 금리 우대 가능');
  }
  if (!profile.hasPatent && !profile.hasRndActivity) {
    improvements.push('특허 출원 또는 기업부설연구소 설립 시 기술성 가점 적용');
  }
  if (!profile.hasSmartFactoryPlan && profile.industry === 'manufacturing') {
    improvements.push('스마트공장 도입 계획 수립 시 정책연계 가점 적용');
  }

  // 실행 가이드 생성
  let actionGuide = '';
  if (fund.institutionId === 'kosmes') {
    actionGuide = profile.hasRndActivity
      ? '중진공 접수 시 연구소 보유 사실을 기술성 평가의 핵심 지표로 강조하십시오'
      : '신청서 작성 시 사업계획서의 성장성을 구체적으로 기술하십시오';
  } else if (fund.institutionId === 'kibo') {
    actionGuide = profile.hasPatent
      ? '기보 접수 시 보유 특허의 사업화 계획을 상세히 작성하십시오'
      : '기술력 증빙 자료(인증서, 수상실적 등)를 최대한 확보하십시오';
  } else if (fund.institutionId === 'kodit') {
    actionGuide = '신보 신청 전 거래 은행과 사전 상담을 통해 보증 한도를 확인하십시오';
  } else {
    actionGuide = '신청 전 해당 기관 홈페이지에서 최신 공고 내용을 확인하십시오';
  }

  // 연관 자금 생성
  const relatedFunds: string[] = [];
  if (profile.hasRndActivity || profile.hasPatent) {
    relatedFunds.push('R&D 연계자금');
  }
  if (profile.hasJobCreation) {
    relatedFunds.push('고용증가 특화자금');
  }
  if (profile.hasExportRevenue) {
    relatedFunds.push('수출금융지원');
  }
  if (profile.hasSmartFactoryPlan) {
    relatedFunds.push('스마트공장 구축자금');
  }

  return {
    killerPoint: topBonus
      ? `${topBonus.userValue}이(가) 본 자금의 핵심 가점 요소입니다`
      : '기본 요건 충족으로 신청 가능합니다',

    improvementTip: improvements[0] || '현재 조건으로 최적 매칭 상태입니다',

    riskWarning: warningItems.length > 0
      ? `향후 ${warningItems[0].fieldLabel} 기준 초과 시 대상에서 제외될 수 있습니다`
      : undefined,

    actionGuide,

    relatedFunds: relatedFunds.length > 0 ? relatedFunds : ['연관 자금 없음'],

    scoreBreakdown: `${scoreBreakdown} = ${totalScore}점`,
  };
}

// ============================================================================
// 통합 적격 사유 생성 (메인 함수)
// ============================================================================

export function generateDetailedReasons(
  profile: ExtendedCompanyProfile,
  fund: PolicyFundKnowledge
): {
  detailedReasons: DetailedEligibilityReason[];
  aiJudgment: AIJudgment;
} {
  // 4개 카테고리 생성
  const basicReasons = generateBasicConditions(profile, fund);
  const bonusReasons = generateBonusConditions(profile, fund);
  const strategicReasons = generateStrategicConditions(profile, fund);
  const fundingReasons = generateFundingConditions(profile, fund);

  // 빈 카테고리 제외
  const allReasons = [basicReasons, bonusReasons, strategicReasons, fundingReasons]
    .filter(r => r.reasons.length > 0);

  // AI 종합 판정 생성
  const aiJudgment = generateAIJudgment(profile, fund, allReasons);

  return {
    detailedReasons: allReasons,
    aiJudgment,
  };
}
