/**
 * lib/policy-fund/last/matcher/helpers.ts
 *
 * 매칭 헬퍼 함수
 * 키워드 체크, 결과 변환 등
 */

import type {
  ExtendedCompanyProfile,
  EligibilityResult,
  DetailedMatchResult,
  PolicyFundKnowledge,
} from '../types';
import { INSTITUTIONS } from '../knowledge-base';
import { TRACK_LABELS, generateScoreExplanation } from './scorer';

// ============================================================================
// 키워드 기반 제외 체크
// ============================================================================

export function checkKeywordExclusion(
  fundName: string,
  profile: ExtendedCompanyProfile
): { excluded: boolean; reason: '근거부족' | '요건불충족'; rule: string; note: string } | null {
  const name = fundName.toLowerCase();

  // 청년 체크는 eligibility/index.ts의 requiredConditions에서 처리
  // (isYouthCompany → ownerCharacteristics: ['youth'])

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
// EligibilityResult → DetailedMatchResult 변환
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
