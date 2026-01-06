/**
 * v7 3분류 검증 테스트
 * - track_decision 포함
 * - matched/conditional/excluded 분류
 * - 트랙차단/키워드기반 차단 적용
 */

import { classifyMatchResults } from '../matching-engine';

// 테스트 프로필: 장애인표준사업장 / 임가공업 / 9년차 / 대표 55세
const testProfile = {
  companyName: '테스트기업',
  businessNumber: '123-45-67890',
  companySize: 'small' as const,
  industry: '임가공 및 포장 서비스',
  location: '부산 사상구',
  businessAge: 9,
  annualRevenue: 1500000000,
  employeeCount: 12,
  debtRatio: 150,
  isDisabledStandard: true,
  isDisabled: true,
  isSocialEnterprise: false,
  isVentureCompany: false,
  isInnobiz: false,
  isMainbiz: false,
  isFemale: false,
  isRestart: false,
  isYouthCompany: false,
  hasRndActivity: false,
  hasExportRevenue: false,
  hasPatent: false,
  requiredFundingAmount: 2,
  fundPurpose: 'operating' as const,
  hasTaxDelinquency: false,
  hasCreditIssue: false,
};

async function runTest() {
  console.log('='.repeat(70));
  console.log('v7 3분류 검증 테스트');
  console.log('='.repeat(70));
  console.log('테스트 기업: 장애인표준사업장 / 임가공업 / 9년차 / 대표 55세');
  console.log('='.repeat(70));
  console.log('');

  const result = await classifyMatchResults(testProfile, { topN: 10 });

  // JSON 출력
  console.log('[JSON 결과]');
  console.log(JSON.stringify(result, null, 2));
  console.log('');

  console.log('='.repeat(70));
  console.log('[ASSERT 검증]');
  console.log('='.repeat(70));

  // ASSERT 1: track_decision 존재
  const assert1 = result.track_decision !== undefined;
  console.log(`1) track_decision 존재: ${assert1 ? '✅ PASS' : '❌ FAIL'}`);

  // ASSERT 2: 일반트랙 차단 (장애인표준사업장이므로)
  const assert2 = result.track_decision.blocked_tracks.includes('일반');
  console.log(`2) 일반트랙 차단: ${assert2 ? '✅ PASS' : '❌ FAIL'} (blocked: ${result.track_decision.blocked_tracks.join(', ')})`);

  // ASSERT 3: matched 5개 이하
  const assert3 = result.matched.length <= 5;
  console.log(`3) matched 5개 이하: ${assert3 ? '✅ PASS' : '❌ FAIL'} (${result.matched.length}개)`);

  // ASSERT 4: matched에 일반트랙 없음
  const generalInMatched = result.matched.filter(m => m.track === '일반').length;
  const assert4 = generalInMatched === 0;
  console.log(`4) matched에 일반트랙 없음: ${assert4 ? '✅ PASS' : '❌ FAIL'} (${generalInMatched}개)`);

  // ASSERT 5: excluded에 트랙차단 사유 존재
  const trackBlockedCount = result.excluded.filter(e => e.excluded_reason === '트랙차단').length;
  const assert5 = trackBlockedCount > 0;
  console.log(`5) excluded에 트랙차단 존재: ${assert5 ? '✅ PASS' : '❌ FAIL'} (${trackBlockedCount}개)`);

  // ASSERT 6: excluded에 청년/기술 근거부족 존재 (대표 55세, R&D 없음)
  const keywordExcludedCount = result.excluded.filter(e =>
    e.excluded_reason === '근거부족' || e.excluded_reason === '요건불충족'
  ).length;
  const assert6 = keywordExcludedCount > 0;
  console.log(`6) 키워드 기반 차단 존재: ${assert6 ? '✅ PASS' : '❌ FAIL'} (${keywordExcludedCount}개)`);

  const allPass = assert1 && assert2 && assert3 && assert4 && assert5 && assert6;
  console.log('');
  console.log(`====> 최종: ${allPass ? '✅ ALL PASS' : '❌ FAIL'}`);
  console.log('='.repeat(70));
}

runTest();
