/**
 * lib/policy-fund/last/matcher/classifier.ts
 *
 * 3분류 매칭 함수
 * matched / conditional / excluded 분류
 */

import type {
  ExtendedCompanyProfile,
  EligibilityResult,
  DetailedMatchResult,
  MatchResultTrack,
  TrackLabel,
  CompanyScale,
  MatchedFund,
  ConditionalFund,
  ExcludedFund,
  TrackDecision,
  ClassifiedMatchResult,
  PolicyFundKnowledge,
} from '../types';
import {
  POLICY_FUND_KNOWLEDGE_BASE,
  INSTITUTIONS,
} from '../knowledge-base';
import { checkAllFundsEligibility } from '../eligibility';
import { convertToKBProfile, SIZE_MAP } from './converter';
import {
  TRACK_LABELS,
  generateRankReason,
  calculateSizeMatchScore,
} from './scorer';
import { convertToDetailedMatchResult, checkKeywordExclusion } from './helpers';

// ============================================================================
// 트랙 라벨 변환
// ============================================================================

export function getTrackLabelKorean(track: MatchResultTrack): TrackLabel {
  const map: Record<MatchResultTrack, TrackLabel> = {
    exclusive: '전용',
    policy_linked: '정책연계',
    general: '일반',
    guarantee: '보증',
  };
  return map[track] || '일반';
}

// ============================================================================
// 제외 사유 분류
// ============================================================================

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

// ============================================================================
// 트리거된 규칙 추출
// ============================================================================

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

// ============================================================================
// 라벨 생성
// ============================================================================

function generateLabel(
  rank: number,
  track: MatchResultTrack,
  trackKor: TrackLabel
): '전용·우선' | '유력' | '대안' | '플랜B' {
  if (rank <= 2 && track === 'exclusive') return '전용·우선';
  if (rank <= 2 && track === 'policy_linked') return '유력';
  if (rank === 3) return '대안';
  return '플랜B';
}

function determineConfidence(
  track: MatchResultTrack,
  trackKor: TrackLabel,
  score: number
): 'HIGH' | 'MEDIUM' {
  if (track === 'exclusive' && score >= 50) return 'HIGH';
  if (track === 'policy_linked' && score >= 70) return 'HIGH';
  return 'MEDIUM';
}

// ============================================================================
// 결과 변환 함수
// ============================================================================

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

// ============================================================================
// 결정 변수 확인
// ============================================================================

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

// ============================================================================
// 신용 상태 체크
// ============================================================================

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

// ============================================================================
// 메인 3분류 함수
// ============================================================================

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
  const allEligibilityResults = checkAllFundsEligibility(kbProfile);

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

    // 트랙 차단 체크
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

    // 키워드 제외 체크
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

    // 기업 규모 체크
    if (fund?.targetScale && fund.targetScale.length > 0) {
      const companyScale: CompanyScale = SIZE_MAP[profile.companySize || 'small'] || 'small';
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

    // 신용 상태 체크
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

    // 자격 미충족
    if (!result.isEligible) {
      excluded.push(toExcludedFund(result, fund));
      continue;
    }

    const detailedResult = convertToDetailedMatchResult(result, fund);

    // 조건부 (신용)
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

    // 조건부 (결정변수)
    const { undetermined, missingVars, whatToFix } = hasUndeterminedDecisionVariables(
      result, profile, fund
    );

    if (undetermined) {
      conditional.push(toConditionalFund(result, detailedResult, missingVars, whatToFix, fund));
      continue;
    }

    // 매칭
    const matchedFund = toMatchedFund(result, detailedResult, fund);
    matchedFund._sizeScore = calculateSizeMatchScore(fund?.id, profile.companySize);
    matched.push(matchedFund);
  }

  // 정렬
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

  // 상위 5개만
  const MAX_MATCHED = 5;
  const limitedMatched = matched.slice(0, MAX_MATCHED);

  // 임시 필드 제거 및 라벨 생성
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

    delete fund._score;
    delete fund._sizeScore;
    delete fund._fundId;
  });

  return {
    track_decision: trackDecision,
    matched: limitedMatched,
    conditional,
    excluded,
  };
}
