/**
 * lib/policy-fund/last/matcher/scorer.ts
 *
 * 점수/라벨 계산 함수
 * 순위, 확신도, 점수 설명 생성
 */

import type {
  MatchResultTrack,
  ConfidenceLabel,
  CompanyScale,
} from '../types';
import { POLICY_FUND_KNOWLEDGE_BASE } from '../knowledge-base';

// ============================================================================
// 트랙 상수
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
// 순위 역할 라벨
// ============================================================================

export function getRankRole(rank: number, track: MatchResultTrack): string {
  if (!rank) return '';
  if (rank <= 2 && track === 'exclusive') return '[최우선] ';
  if (rank === 3) return '[대안] ';
  if (rank === 4) return '[차선] ';
  if (rank >= 5) return '[참고] ';
  return '';
}

// ============================================================================
// 순위 사유 생성
// ============================================================================

export function generateRankReason(rank: number, track: MatchResultTrack, fundName: string): string {
  if (rank === 1) return `${fundName}은(는) 귀사의 정책 자격과 목적이 가장 정확히 일치하는 자금입니다.`;
  if (rank === 2 && track === 'exclusive') return `${fundName}은(는) 1순위와 함께 검토할 수 있는 전용 자금입니다.`;
  if (rank === 2) return `${fundName}은(는) 1순위 다음으로 정합성이 높은 자금입니다.`;
  if (rank === 3) return `${fundName}은(는) 전용 자금 집행이 어려울 경우의 정책 목적 유사 대안입니다.`;
  if (rank === 4) return `${fundName}은(는) 직접대출 외 보증·간접자금으로 활용 가능합니다.`;
  if (rank >= 5) return `${fundName}은(는) 참고용으로만 제시되는 자금입니다.`;
  return '';
}

// ============================================================================
// 확신도 라벨 생성
// ============================================================================

export function generateConfidenceLabel(rank: number, track: MatchResultTrack, score: number): ConfidenceLabel {
  if (rank <= 2 && track === 'exclusive') return '전용·우선';
  if (rank <= 2 && track === 'policy_linked') return '유력';
  if (rank === 3 || (track === 'general' && score >= 60) || (track === 'policy_linked' && score >= 50)) return '대안';
  return '플랜B';
}

// ============================================================================
// 점수 설명 생성
// ============================================================================

export function generateScoreExplanation(
  score: number,
  track: MatchResultTrack,
  fundName: string,
  rank: number
): string {
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
  // guarantee
  if (score >= 70) return `${rankRole}본 자금은 담보력 보완에 유용한 ${trackKor} 상품입니다.`;
  return `${rankRole}본 자금은 플랜B로 고려할 수 있는 ${trackKor} 상품입니다.`;
}

// ============================================================================
// 기업규모 적합도 계산
// ============================================================================

export function calculateSizeMatchScore(
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
// 점수 → 레벨 변환
// ============================================================================

export function scoreToLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}
