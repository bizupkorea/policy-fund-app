const fs = require('fs');

const filePath = 'E:/biznova/policy-fund-app/lib/policy-fund/matching-engine.ts';
let content = fs.readFileSync(filePath, 'utf8');

// 1. MatchedFund 인터페이스 교체
const oldMatchedFund = `/**
 * MATCHED: 하드룰 충족 + 결정변수 확정
 */
export interface MatchedFund {
  program_name: string;
  agency: string;
  track: TrackLabel;
  confidence_score: number;
  why_ranked_here: string;
  hard_reasons_passed: string[];
  hard_reasons_failed: string[];
}`;

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

if (content.includes(oldMatchedFund)) {
  content = content.replace(oldMatchedFund, newMatchedFund);
  console.log('✅ MatchedFund 인터페이스 업데이트 완료');
} else {
  console.log('⚠️ MatchedFund 패턴 찾을 수 없음');
}

// 2. ConditionalFund 인터페이스 교체
const oldConditionalFund = `/**
 * CONDITIONAL: 하드룰 충족 + 결정변수 미확정
 */
export interface ConditionalFund {
  program_name: string;
  agency: string;
  track: TrackLabel;
  missing_requirements: string[];
  what_to_fix: string[];
}`;

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

if (content.includes(oldConditionalFund)) {
  content = content.replace(oldConditionalFund, newConditionalFund);
  console.log('✅ ConditionalFund 인터페이스 업데이트 완료');
} else {
  console.log('⚠️ ConditionalFund 패턴 찾을 수 없음');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ 타입 정의 패치 완료!');
