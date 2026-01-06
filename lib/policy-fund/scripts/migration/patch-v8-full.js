const fs = require('fs');

const filePath = 'E:/biznova/policy-fund-app/lib/policy-fund/matching-engine.ts';
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// 1. MatchedFund 인터페이스 교체 (라인 85-96)
let matchedStart = -1;
let matchedEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('* MATCHED: 하드룰 충족 + 결정변수 확정')) {
    matchedStart = i - 1; // /** 시작
  }
  if (matchedStart > 0 && lines[i].trim() === '}' && i > matchedStart + 5) {
    matchedEnd = i;
    break;
  }
}

if (matchedStart >= 0 && matchedEnd > matchedStart) {
  console.log(`MatchedFund: 라인 ${matchedStart + 1} ~ ${matchedEnd + 1}`);

  const newMatchedFund = `/**
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

  const newLines = newMatchedFund.split('\n');
  lines.splice(matchedStart, matchedEnd - matchedStart + 1, ...newLines);
  console.log('✅ MatchedFund 인터페이스 업데이트 완료');
}

// 다시 인덱스 찾기 (이전 수정으로 변경됨)
content = lines.join('\n');
const lines2 = content.split('\n');

// 2. ConditionalFund 인터페이스 교체
let conditionalStart = -1;
let conditionalEnd = -1;
for (let i = 0; i < lines2.length; i++) {
  if (lines2[i].includes('* CONDITIONAL: 하드룰 충족 + 결정변수 미확정')) {
    conditionalStart = i - 1; // /** 시작
  }
  if (conditionalStart > 0 && lines2[i].trim() === '}' && i > conditionalStart + 4) {
    conditionalEnd = i;
    break;
  }
}

if (conditionalStart >= 0 && conditionalEnd > conditionalStart) {
  console.log(`ConditionalFund: 라인 ${conditionalStart + 1} ~ ${conditionalEnd + 1}`);

  const newConditionalFund = `/**
 * CONDITIONAL: 하드룰 충족 + 결정변수 미확정
 * - what_is_missing: 미확정 결정 변수
 * - how_to_confirm: 확정 방법 안내
 */
export interface ConditionalFund {
  program_name: string;
  agency: string;
  track: TrackLabel;
  what_is_missing: string;
  how_to_confirm: string;
}`;

  const newLines2 = newConditionalFund.split('\n');
  lines2.splice(conditionalStart, conditionalEnd - conditionalStart + 1, ...newLines2);
  console.log('✅ ConditionalFund 인터페이스 업데이트 완료');
}

fs.writeFileSync(filePath, lines2.join('\n'), 'utf8');
console.log('✅ 타입 정의 패치 완료!');
