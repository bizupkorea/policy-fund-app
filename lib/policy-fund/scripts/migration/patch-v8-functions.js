const fs = require('fs');

const filePath = 'E:/biznova/policy-fund-app/lib/policy-fund/matching-engine.ts';
let content = fs.readFileSync(filePath, 'utf8');

// 1. toMatchedFund 함수 교체
const oldToMatchedFund = `/**
 * EligibilityResult를 MatchedFund로 변환
 */
function toMatchedFund(
  result: EligibilityResult,
  detailedResult: DetailedMatchResult,
  fund?: PolicyFundKnowledge
): MatchedFund {
  return {
    program_name: result.fundName,
    agency: fund ? INSTITUTIONS[fund.institutionId]?.name || result.institutionId : result.institutionId,
    track: getTrackLabelKorean(detailedResult.track),
    confidence_score: detailedResult.score,
    why_ranked_here: detailedResult.rankReason || detailedResult.scoreExplanation || '',
    hard_reasons_passed: result.passedConditions.map(c => c.description),
    hard_reasons_failed: [], // matched는 실패 조건 없음
  };
}`;

const newToMatchedFund = `/**
 * EligibilityResult를 MatchedFund로 변환
 * v8: confidence, label, why 필드 사용
 */
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
    why: '', // 정렬 후 generateRankReason으로 채워짐
    hard_rules_passed: result.passedConditions.map(c => c.description),
  };
}

/**
 * label 생성: 전용·우선 / 유력 / 대안 / 플랜B
 */
function generateLabel(rank: number, track: MatchResultTrack, trackKor: TrackLabel): '전용·우선' | '유력' | '대안' | '플랜B' {
  // 1~2순위 + 전용 → 전용·우선
  if (rank <= 2 && track === 'exclusive') return '전용·우선';
  // 1~2순위 + 정책연계 → 유력
  if (rank <= 2 && track === 'policy_linked') return '유력';
  // 3순위 → 대안
  if (rank === 3) return '대안';
  // 4~5순위 또는 보증 → 플랜B
  return '플랜B';
}

/**
 * confidence 결정: HIGH / MEDIUM
 */
function determineConfidence(track: MatchResultTrack, trackKor: TrackLabel, score: number): 'HIGH' | 'MEDIUM' {
  // 전용 트랙 + 점수 70 이상 → HIGH
  if (track === 'exclusive' && score >= 50) return 'HIGH';
  // 정책연계 + 점수 80 이상 → HIGH
  if (track === 'policy_linked' && score >= 70) return 'HIGH';
  // 그 외 MEDIUM
  return 'MEDIUM';
}`;

if (content.includes(oldToMatchedFund)) {
  content = content.replace(oldToMatchedFund, newToMatchedFund);
  console.log('✅ toMatchedFund 함수 업데이트 완료');
} else {
  console.log('⚠️ toMatchedFund 패턴 찾을 수 없음');
}

// 2. toConditionalFund 함수 교체
const oldToConditionalFund = `/**
 * EligibilityResult를 ConditionalFund로 변환
 */
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
    missing_requirements: missingVars,
    what_to_fix: whatToFix,
  };
}`;

const newToConditionalFund = `/**
 * EligibilityResult를 ConditionalFund로 변환
 * v8: what_is_missing, how_to_confirm 필드 사용
 */
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
}`;

if (content.includes(oldToConditionalFund)) {
  content = content.replace(oldToConditionalFund, newToConditionalFund);
  console.log('✅ toConditionalFund 함수 업데이트 완료');
} else {
  console.log('⚠️ toConditionalFund 패턴 찾을 수 없음');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ 함수 패치 완료!');
