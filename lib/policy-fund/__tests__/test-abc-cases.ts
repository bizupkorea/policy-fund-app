/**
 * A/B/C 케이스 검증 테스트
 */

import { classifyMatchResults } from '../matching-engine';

// 기본 프로필 템플릿
const baseProfile = {
  companyName: '테스트기업',
  businessNumber: '123-45-67890',
  companySize: 'small' as const,
  industry: '임가공 및 포장 서비스',
  location: '부산 사상구',
  businessAge: 9,
  annualRevenue: 1500000000,
  employeeCount: 12,
  debtRatio: 150,
  isSocialEnterprise: false,
  isVentureCompany: false,
  isInnobiz: false,
  isMainbiz: false,
  isFemale: false,
  isRestart: false,
  isYouthCompany: false,
  requiredFundingAmount: 2,
  fundPurpose: 'operating' as const,
  hasTaxDelinquency: false,
  hasCreditIssue: false,
};

// 케이스 A: 장애인표준사업장=O
const caseA = {
  ...baseProfile,
  isDisabledStandard: true,
  isDisabled: true,
  hasExportRevenue: false,
  hasRndActivity: false,
  hasPatent: false,
  hasIpoOrInvestmentPlan: false,
  acceptsEquityDilution: false,
};

// 케이스 B: 장애인표준사업장=X, 전용자격 없음
const caseB = {
  ...baseProfile,
  isDisabledStandard: false,
  isDisabled: false,
  hasExportRevenue: false,
  hasRndActivity: false,
  hasPatent: false,
  hasIpoOrInvestmentPlan: false,
  acceptsEquityDilution: false,
};

// 케이스 C: 장애인표준사업장=X, 기술근거=O
const caseC = {
  ...baseProfile,
  isDisabledStandard: false,
  isDisabled: false,
  hasExportRevenue: false,
  hasRndActivity: true,  // R&D 활동 있음
  hasPatent: true,        // 특허 있음
  hasIpoOrInvestmentPlan: false,
  acceptsEquityDilution: false,
};

async function runCaseTest(caseName: string, profile: any, expectedAllowed: string[], expectedBlocked: string[]) {
  console.log('');
  console.log('='.repeat(70));
  console.log(`[입력 ${caseName}]`);
  console.log('='.repeat(70));

  // 주요 입력값 출력
  console.log(`장애인표준사업장: ${profile.isDisabledStandard ? 'O' : 'X'}`);
  console.log(`수출: ${profile.hasExportRevenue ? 'O' : 'X'}`);
  console.log(`기술근거(R&D/특허): ${(profile.hasRndActivity || profile.hasPatent) ? 'O' : 'X'}`);
  console.log(`투자/지분희석: ${(profile.hasIpoOrInvestmentPlan || profile.acceptsEquityDilution) ? 'O' : 'X'}`);
  console.log('');

  const result = await classifyMatchResults(profile, { topN: 10 });

  // track_decision 출력
  console.log('[track_decision]');
  console.log(`  allowed_tracks: [${result.track_decision.allowed_tracks.join(', ')}]`);
  console.log(`  blocked_tracks: [${result.track_decision.blocked_tracks.join(', ')}]`);
  console.log(`  why: ${result.track_decision.why}`);
  console.log('');

  // 개수 출력
  console.log('[결과 개수]');
  console.log(`  matched: ${result.matched.length}개`);
  console.log(`  conditional: ${result.conditional.length}개`);
  console.log(`  excluded: ${result.excluded.length}개`);
  console.log('');

  // matched 트랙 분포
  const matchedTracks: Record<string, number> = {};
  result.matched.forEach(m => {
    matchedTracks[m.track] = (matchedTracks[m.track] || 0) + 1;
  });
  console.log('[matched 트랙 분포]');
  Object.entries(matchedTracks).forEach(([track, count]) => {
    console.log(`  ${track}: ${count}개`);
  });
  console.log('');

  // excluded 중 트랙차단 개수
  const trackBlockedCount = result.excluded.filter(e => e.excluded_reason === '트랙차단').length;
  console.log(`[excluded 중 트랙차단]: ${trackBlockedCount}개`);

  // ASSERT 검증
  console.log('');
  console.log('-'.repeat(70));
  console.log('[ASSERT 검증]');
  console.log('-'.repeat(70));

  // ASSERT 1: allowed/blocked 일치
  const allowedMatch = JSON.stringify(result.track_decision.allowed_tracks.sort()) === JSON.stringify(expectedAllowed.sort());
  const blockedMatch = JSON.stringify(result.track_decision.blocked_tracks.sort()) === JSON.stringify(expectedBlocked.sort());
  const assert1 = allowedMatch && blockedMatch;
  console.log(`1) allowed/blocked 규칙 일치: ${assert1 ? '✅ PASS' : '❌ FAIL'}`);
  if (!assert1) {
    console.log(`   기대: allowed=[${expectedAllowed.join(',')}], blocked=[${expectedBlocked.join(',')}]`);
    console.log(`   실제: allowed=[${result.track_decision.allowed_tracks.join(',')}], blocked=[${result.track_decision.blocked_tracks.join(',')}]`);
  }

  // ASSERT 2: blocked 트랙이 matched에 없어야 함
  const blockedInMatched = result.matched.filter(m => expectedBlocked.includes(m.track)).length;
  const assert2 = blockedInMatched === 0;
  console.log(`2) blocked 트랙이 matched에 0개: ${assert2 ? '✅ PASS' : '❌ FAIL'} (${blockedInMatched}개 발견)`);

  // ASSERT 3: blocked 트랙 후보가 excluded에 "트랙차단"으로 기록
  const assert3 = trackBlockedCount > 0;
  console.log(`3) blocked 트랙 후보가 excluded에 트랙차단 기록: ${assert3 ? '✅ PASS' : '❌ FAIL'} (${trackBlockedCount}개)`);

  const allPass = assert1 && assert2 && assert3;
  console.log('');
  console.log(`====> ${caseName} 최종: ${allPass ? '✅ ALL PASS' : '❌ FAIL'}`);

  return allPass;
}

async function runAllTests() {
  console.log('');
  console.log('#'.repeat(70));
  console.log('# A/B/C 케이스 검증 테스트');
  console.log('#'.repeat(70));

  // 케이스 A: 장애인표준사업장 O → 일반 blocked
  const passA = await runCaseTest('A', caseA, ['전용', '정책연계', '보증'], ['일반']);

  // 케이스 B: 전용자격 없음 → 전용 blocked
  const passB = await runCaseTest('B', caseB, ['정책연계', '일반', '보증'], ['전용']);

  // 케이스 C: 전용자격 없음 + 기술근거 O → 전용 blocked (기술자금은 매칭 가능해야 함)
  const passC = await runCaseTest('C', caseC, ['정책연계', '일반', '보증'], ['전용']);

  console.log('');
  console.log('#'.repeat(70));
  console.log('# 종합 결과');
  console.log('#'.repeat(70));
  console.log(`케이스 A: ${passA ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`케이스 B: ${passB ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`케이스 C: ${passC ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');
  console.log(`====> 전체: ${(passA && passB && passC) ? '✅ ALL PASS' : '❌ FAIL'}`);
}

runAllTests();
