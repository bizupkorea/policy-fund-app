/**
 * lib/policy-fund/last/matcher/pipeline.ts
 *
 * 매칭 파이프라인 실행기
 * - 필터링 → 점수 계산 → 정렬 → 다양성 필터 → 결과 생성
 */

import type {
  ExtendedCompanyProfile,
  DetailedMatchResult,
  AIAdvisorResult,
  EnhancedMatchResult,
} from '../types';
import { POLICY_FUND_KNOWLEDGE_BASE } from '../knowledge-base';
import { checkAllFundsEligibility, generateDetailedReasons } from '../eligibility';
import { analyzePortfolio, quickAnalyze } from '../gemini-advisor';
import { convertToKBProfile } from './converter';
import { convertToDetailedMatchResult, checkKeywordExclusion } from './helpers';
import {
  generateRankReason,
  generateConfidenceLabel,
  generateScoreExplanation,
} from './scorer';

// 모듈 import
import { applyHardCutFilters } from './filters';
import { applyDiversityFilter } from './filters';
import { applyScoring, applyRankDifferentiation } from './scoring';
import { applySorting } from './sorting';
import { INSTITUTION_LABELS } from './config';

// ============================================================================
// 매칭 파이프라인 메인 함수
// ============================================================================

export interface MatchOptions {
  useAI?: boolean;
  topN?: number;
}

export interface MatchResult {
  results: DetailedMatchResult[];
  aiAnalysis?: AIAdvisorResult[];
  summary: {
    totalFunds: number;
    eligibleCount: number;
    topRecommendation: string | null;
  };
}

/**
 * 제도 지식 기반 매칭 수행 (리팩토링 버전)
 */
export async function matchWithKnowledgeBase(
  profile: ExtendedCompanyProfile,
  options: MatchOptions = {}
): Promise<MatchResult> {
  const { useAI = false, topN = 10 } = options;

  // ============================================================================
  // 1단계: 초기 자격 체크
  // ============================================================================
  const kbProfile = convertToKBProfile(profile);
  let eligibilityResults = checkAllFundsEligibility(kbProfile);

  // ============================================================================
  // 2단계: 하드컷 필터링
  // ============================================================================
  eligibilityResults = applyHardCutFilters(eligibilityResults, profile);

  // ============================================================================
  // 3단계: 키워드 기반 하드컷
  // ============================================================================
  eligibilityResults = eligibilityResults.filter(r => {
    const keywordResult = checkKeywordExclusion(r.fundName, profile);
    return !keywordResult?.excluded;
  });

  // ============================================================================
  // 4단계: 결과 변환
  // ============================================================================
  let detailedResults: DetailedMatchResult[] = eligibilityResults.map(result => {
    const fund = POLICY_FUND_KNOWLEDGE_BASE.find(f => f.id === result.fundId);
    return convertToDetailedMatchResult(result, fund);
  });

  // ============================================================================
  // 5단계: 점수 계산 (평가자 실행)
  // ============================================================================
  detailedResults = applyScoring(detailedResults, profile);

  // ============================================================================
  // 6단계: 정렬
  // ============================================================================
  detailedResults = applySorting(detailedResults, profile);

  // ============================================================================
  // 7단계: 다양성 필터
  // ============================================================================
  detailedResults = applyDiversityFilter(detailedResults, topN);

  // ============================================================================
  // 8단계: 고도화된 적격 사유 생성
  // ============================================================================
  const enhancedResults: EnhancedMatchResult[] = detailedResults.map(r => {
    const fund = POLICY_FUND_KNOWLEDGE_BASE.find(f => f.id === r.fundId);

    // 기본 문구 생성 (fallback)
    if (r.eligibilityReasons.length === 0) {
      const institutionLabel = INSTITUTION_LABELS[r.institutionId] || '정책자금';

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

    // 고도화된 적격 사유 생성
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
  // 9단계: 순위별 점수 차등
  // ============================================================================
  const rankedResults = applyRankDifferentiation(enhancedResults);

  // ============================================================================
  // 10단계: 최종 결과 생성
  // ============================================================================
  const results = rankedResults.map((result, index) => {
    const rank = index + 1;
    return {
      ...result,
      rank,
      rankReason: generateRankReason(rank, result.track, result.fundName),
      scoreExplanation: generateScoreExplanation(result.score, result.track, result.fundName, rank),
      confidenceLabel: generateConfidenceLabel(rank, result.track, result.score),
    };
  });

  // ============================================================================
  // 11단계: AI 분석 (선택적)
  // ============================================================================
  let aiAnalysis: AIAdvisorResult[] | undefined;
  if (useAI) {
    const portfolio = await analyzePortfolio(eligibilityResults.slice(0, 5), kbProfile);
    aiAnalysis = portfolio.recommendedFunds;
  } else {
    aiAnalysis = eligibilityResults.slice(0, 5).map(result =>
      quickAnalyze(result, kbProfile)
    );
  }

  // ============================================================================
  // 12단계: 요약 생성
  // ============================================================================
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
