/**
 * 리팩토링 Phase 2 & 3: 4단계 정렬 우선순위 + 기업규모 적합도
 *
 * 정렬 우선순위:
 * 1순위: 특화자금 (exclusive 트랙)
 * 2순위: 기업규모 적합도
 * 3순위: 직접대출 우선 (보증 후순위)
 * 4순위: 점수순
 */

const fs = require('fs');

const filePath = 'E:/biznova/policy-fund-app/lib/policy-fund/matching-engine.ts';
let content = fs.readFileSync(filePath, 'utf8');

// 1. MatchedFund 인터페이스에 _sizeScore 추가
const oldInterface = `export interface MatchedFund {
  program_name: string;
  agency: string;
  track: TrackLabel;
  label: '전용·우선' | '유력' | '대안' | '플랜B';
  confidence?: 'HIGH' | 'MEDIUM'; // exclusive는 점수 계산 대상 아님 → confidence 없음
  why: string;
  hard_rules_passed: string[];
  _score?: number; // 내부 정렬용 (JSON 출력 시 삭제)
}`;

const newInterface = `export interface MatchedFund {
  program_name: string;
  agency: string;
  track: TrackLabel;
  label: '전용·우선' | '유력' | '대안' | '플랜B';
  confidence?: 'HIGH' | 'MEDIUM'; // exclusive는 점수 계산 대상 아님 → confidence 없음
  why: string;
  hard_rules_passed: string[];
  _score?: number; // 내부 정렬용 (JSON 출력 시 삭제)
  _sizeScore?: number; // 기업규모 적합도 (JSON 출력 시 삭제)
  _fundId?: string; // 자금 ID (기업규모 매칭용)
}`;

if (content.includes(oldInterface)) {
  content = content.replace(oldInterface, newInterface);
  console.log('✅ Phase 2-1: MatchedFund 인터페이스 수정');
} else {
  console.log('⚠️ MatchedFund 인터페이스 패턴 찾을 수 없음');
}

// 2. 기존 정렬 로직을 4단계 정렬로 변경
const oldSort = `  // matched 정렬 (트랙 우선순위 → 점수순)
  matched.sort((a, b) => {
    const trackOrder: Record<TrackLabel, number> = { '전용': 1, '정책연계': 2, '일반': 3, '보증': 4 };
    const aTrack = trackOrder[a.track] ?? 99;
    const bTrack = trackOrder[b.track] ?? 99;
    if (aTrack !== bTrack) return aTrack - bTrack;
    return (b._score || 0) - (a._score || 0);
  });`;

const newSort = `  // ★ 4단계 정렬 우선순위
  // 1순위: 특화자금 (exclusive)
  // 2순위: 기업규모 적합도
  // 3순위: 직접대출 우선 (보증 후순위)
  // 4순위: 점수순
  matched.sort((a, b) => {
    // 1) 특화자금(전용) 우선
    if (a.track === '전용' && b.track !== '전용') return -1;
    if (b.track === '전용' && a.track !== '전용') return 1;

    // 2) 기업규모 적합도 (높을수록 우선)
    const aSizeScore = a._sizeScore || 50;
    const bSizeScore = b._sizeScore || 50;
    if (aSizeScore !== bSizeScore) return bSizeScore - aSizeScore;

    // 3) 직접대출 우선 (보증 후순위)
    if (a.track !== '보증' && b.track === '보증') return -1;
    if (b.track !== '보증' && a.track === '보증') return 1;

    // 4) 점수순
    return (b._score || 0) - (a._score || 0);
  });`;

if (content.includes(oldSort)) {
  content = content.replace(oldSort, newSort);
  console.log('✅ Phase 2-2: 4단계 정렬 로직 적용');
} else {
  console.log('⚠️ 정렬 로직 패턴 찾을 수 없음');
}

// 3. _score 제거 부분에 _sizeScore, _fundId도 제거 추가
const oldScoreDelete = `  // _score 제거 (내부 정렬용 필드, JSON 출력에서 제외)
  limitedMatched.forEach(fund => {
    delete fund._score;
  });`;

const newScoreDelete = `  // 내부 정렬용 필드 제거 (JSON 출력에서 제외)
  limitedMatched.forEach(fund => {
    delete fund._score;
    delete fund._sizeScore;
    delete fund._fundId;
  });`;

if (content.includes(oldScoreDelete)) {
  content = content.replace(oldScoreDelete, newScoreDelete);
  console.log('✅ Phase 2-3: 내부 필드 제거 로직 수정');
} else {
  console.log('⚠️ 내부 필드 제거 패턴 찾을 수 없음');
}

// 4. toMatchedFund 함수에서 _fundId, _sizeScore 추가
const oldToMatchedReturn = `  return {
    program_name: result.fundName,
    agency: fund ? INSTITUTIONS[fund.institutionId]?.name || result.institutionId : result.institutionId,
    track: trackKor,
    label,
    confidence,
    why: '', // 정렬 후 generateRankReason으로 채워짐
    hard_rules_passed: result.passedConditions.map(c => c.description),
    _score: detailedResult.score, // 내부 정렬용
  };
}`;

const newToMatchedReturn = `  return {
    program_name: result.fundName,
    agency: fund ? INSTITUTIONS[fund.institutionId]?.name || result.institutionId : result.institutionId,
    track: trackKor,
    label,
    confidence,
    why: '', // 정렬 후 generateRankReason으로 채워짐
    hard_rules_passed: result.passedConditions.map(c => c.description),
    _score: detailedResult.score, // 내부 정렬용
    _fundId: fund?.id, // 기업규모 매칭용
  };
}`;

if (content.includes(oldToMatchedReturn)) {
  content = content.replace(oldToMatchedReturn, newToMatchedReturn);
  console.log('✅ Phase 2-4: toMatchedFund에 _fundId 추가');
} else {
  console.log('⚠️ toMatchedFund return 패턴 찾을 수 없음');
}

// 5. 기업규모 적합도 함수 추가 (classifyMatchResults 함수 앞에)
const sizeScoreFunction = `
/**
 * 기업규모 적합도 계산
 * - 자금의 대상 기업규모와 실제 기업규모 비교
 */
function calculateSizeMatchScore(
  fundId: string | undefined,
  companySize: 'micro' | 'small' | 'medium' | 'venture' | 'innobiz' | 'mainbiz' | undefined
): number {
  if (!fundId || !companySize) return 50; // 기본값

  const fund = POLICY_FUND_KNOWLEDGE_BASE.find(f => f.id === fundId);
  if (!fund) return 50;

  // 자금의 대상 기업규모 (targetScale이 있으면 사용, 없으면 기본)
  const targetScales = fund.targetScale || ['small', 'medium'];

  // 기업규모 매핑
  const sizeMapping: Record<string, string[]> = {
    'micro': ['micro', 'small'],
    'small': ['small', 'micro'],
    'medium': ['medium'],
    'venture': ['venture', 'small', 'medium'],
    'innobiz': ['innobiz', 'small', 'medium'],
    'mainbiz': ['mainbiz', 'small', 'medium'],
  };

  const companySizeGroup = sizeMapping[companySize] || [companySize];

  // 정확히 일치하면 100점, 범위 내 포함이면 80점, 불일치면 50점
  if (targetScales.includes(companySize)) return 100;
  if (companySizeGroup.some(s => targetScales.includes(s))) return 80;
  return 50;
}

`;

// classifyMatchResults 함수 앞에 삽입
const insertPoint = '/**\n * ★ v7: 3분류 결과 반환 함수';
if (content.includes(insertPoint)) {
  content = content.replace(insertPoint, sizeScoreFunction + insertPoint);
  console.log('✅ Phase 3-1: calculateSizeMatchScore 함수 추가');
} else {
  console.log('⚠️ 삽입 지점 찾을 수 없음');
}

// 6. matched.push 전에 _sizeScore 계산 추가
const oldMatchedPush = `    // MATCHED: 하드룰 + 결정변수 모두 충족
    matched.push(toMatchedFund(result, detailedResult, fund));`;

const newMatchedPush = `    // MATCHED: 하드룰 + 결정변수 모두 충족
    const matchedFund = toMatchedFund(result, detailedResult, fund);
    // 기업규모 적합도 계산
    matchedFund._sizeScore = calculateSizeMatchScore(fund?.id, profile.companySize);
    matched.push(matchedFund);`;

if (content.includes(oldMatchedPush)) {
  content = content.replace(oldMatchedPush, newMatchedPush);
  console.log('✅ Phase 3-2: _sizeScore 계산 로직 추가');
} else {
  console.log('⚠️ matched.push 패턴 찾을 수 없음');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Phase 2 & 3 완료: 4단계 정렬 + 기업규모 적합도');
