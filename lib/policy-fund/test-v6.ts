/**
 * v6 검증 테스트
 * - matched 5개 제한
 * - 확신도 라벨 (전용·우선, 유력, 대안, 플랜B)
 * - 트랙 강제 분기
 */

import { matchWithKnowledgeBase } from './matching-engine';

// 테스트 프로필: 장애인표준사업장 / 임가공업 / 9년차 / 대표 55세
const testProfile = {
  companyName: '테스트기업',
  businessNumber: '123-45-67890',
  companySize: 'small' as const,
  industry: '임가공 및 포장 서비스',
  location: '부산',
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
  console.log('v6 검증 테스트');
  console.log('='.repeat(70));
  console.log('테스트 기업: 장애인표준사업장 / 임가공업 / 9년차 / 대표 55세');
  console.log('='.repeat(70));
  console.log('');

  const result = await matchWithKnowledgeBase(testProfile, { topN: 10 });

  console.log(`[결과 개수] ${result.results.length}개 (상한 5개 제한 적용)`);
  console.log('');

  console.log('[matched 결과]');
  console.log('-'.repeat(70));

  result.results.forEach((fund, index) => {
    const rank = index + 1;
    console.log(`${rank}순위: ${fund.fundName}`);
    console.log(`  트랙: ${fund.trackLabel} (${fund.track})`);
    console.log(`  확신도: ${fund.confidenceLabel}`);
    console.log(`  점수: ${fund.score}점 (내부용)`);
    console.log(`  순위이유: ${fund.rankReason}`);
    console.log('');
  });

  console.log('='.repeat(70));
  console.log('[ASSERT 검증]');
  console.log('='.repeat(70));

  // ASSERT 1: 결과 5개 이하
  const assert1 = result.results.length <= 5;
  console.log(`1) 결과 5개 이하: ${assert1 ? '✅ PASS' : '❌ FAIL'} (${result.results.length}개)`);

  // ASSERT 2: general 트랙 0개 (장애인표준사업장이므로)
  const generalCount = result.results.filter(r => r.track === 'general').length;
  const assert2 = generalCount === 0;
  console.log(`2) general 트랙 0개: ${assert2 ? '✅ PASS' : '❌ FAIL'} (${generalCount}개)`);

  // ASSERT 3: 1~2순위가 exclusive 트랙
  const topExclusive = result.results.slice(0, 2).every(r => r.track === 'exclusive');
  const assert3 = topExclusive;
  console.log(`3) 1~2순위 exclusive: ${assert3 ? '✅ PASS' : '❌ FAIL'}`);

  // ASSERT 4: 확신도 라벨 존재
  const hasConfidenceLabels = result.results.every(r => r.confidenceLabel);
  const assert4 = hasConfidenceLabels;
  console.log(`4) 확신도 라벨 존재: ${assert4 ? '✅ PASS' : '❌ FAIL'}`);

  // ASSERT 5: 1~2순위 확신도가 '전용·우선'
  const topConfidence = result.results.slice(0, 2).every(r => r.confidenceLabel === '전용·우선');
  const assert5 = topConfidence;
  console.log(`5) 1~2순위 확신도 '전용·우선': ${assert5 ? '✅ PASS' : '❌ FAIL'}`);

  const allPass = assert1 && assert2 && assert3 && assert4 && assert5;
  console.log('');
  console.log(`====> 최종: ${allPass ? '✅ ALL PASS' : '❌ FAIL'}`);
  console.log('='.repeat(70));
}

runTest();
