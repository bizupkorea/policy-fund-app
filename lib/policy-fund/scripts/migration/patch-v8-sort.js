const fs = require('fs');

const filePath = 'E:/biznova/policy-fund-app/lib/policy-fund/matching-engine.ts';
let content = fs.readFileSync(filePath, 'utf8');

// MatchedFund에 _score 내부 필드 추가 (정렬용, 출력에서 제외)
const oldInterface = `/**
 * MATCHED: 하드룰 충족 + 결정변수 확정
 * - confidence: HIGH(전용자격 보유+정책목적 일치) / MEDIUM(정책연계/일반)
 * - label: 전용·우선 / 유력 / 대안 / 플랜B
 */
export interface MatchedFund {
  program_name: string;
  agency: string;
  track: TrackLabel;
  label: '전용·우선' | '유력' | '대안' | '플랜B';
  confidence: 'HIGH' | 'MEDIUM';
  why: string;
  hard_rules_passed: string[];
}`;

const newInterface = `/**
 * MATCHED: 하드룰 충족 + 결정변수 확정
 * - confidence: HIGH(전용자격 보유+정책목적 일치) / MEDIUM(정책연계/일반)
 * - label: 전용·우선 / 유력 / 대안 / 플랜B
 */
export interface MatchedFund {
  program_name: string;
  agency: string;
  track: TrackLabel;
  label: '전용·우선' | '유력' | '대안' | '플랜B';
  confidence: 'HIGH' | 'MEDIUM';
  why: string;
  hard_rules_passed: string[];
  _score?: number; // 내부 정렬용 (JSON 출력 시 삭제)
}`;

if (content.includes(oldInterface)) {
  content = content.replace(oldInterface, newInterface);
  console.log('✅ MatchedFund 인터페이스에 _score 추가');
} else {
  console.log('⚠️ MatchedFund 인터페이스 패턴 찾을 수 없음');
}

// toMatchedFund에서 _score 설정 추가
const oldToMatched = `  return {
    program_name: result.fundName,
    agency: fund ? INSTITUTIONS[fund.institutionId]?.name || result.institutionId : result.institutionId,
    track: trackKor,
    label,
    confidence,
    why: '', // 정렬 후 generateRankReason으로 채워짐
    hard_rules_passed: result.passedConditions.map(c => c.description),
  };
}`;

const newToMatched = `  return {
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

if (content.includes(oldToMatched)) {
  content = content.replace(oldToMatched, newToMatched);
  console.log('✅ toMatchedFund에 _score 설정 추가');
} else {
  console.log('⚠️ toMatchedFund return 패턴 찾을 수 없음');
}

// 정렬 로직 수정: confidence_score → _score
const oldSort = `return b.confidence_score - a.confidence_score;`;
const newSort = `return (b._score || 0) - (a._score || 0);`;

if (content.includes(oldSort)) {
  content = content.replace(oldSort, newSort);
  console.log('✅ 정렬 로직 수정 완료');
} else {
  console.log('⚠️ 정렬 로직 패턴 찾을 수 없음');
}

// 정렬 후 _score 삭제 로직 추가
const oldLimited = `  // v8: 순위 기반 why, label 재설정`;
const newLimited = `  // _score 제거 (내부 정렬용 필드, JSON 출력에서 제외)
  limitedMatched.forEach(fund => {
    delete fund._score;
  });

  // v8: 순위 기반 why, label 재설정`;

if (content.includes(oldLimited)) {
  content = content.replace(oldLimited, newLimited);
  console.log('✅ _score 삭제 로직 추가');
} else {
  console.log('⚠️ 순위 업데이트 패턴 찾을 수 없음');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ 패치 완료!');
