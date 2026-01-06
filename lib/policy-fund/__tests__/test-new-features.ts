/**
 * targetScale 및 체납/신용 로직 테스트
 */

import { classifyMatchResults, ExtendedCompanyProfile } from '../matching-engine';

// 테스트 1: 소공인 기업이 소공인특화자금 신청 가능
const microCompany: ExtendedCompanyProfile = {
  companyName: '소공인테스트기업',
  businessNumber: '123-45-67890',
  companySize: 'micro',
  industry: '금속 가공',
  location: '서울 금천구',
  businessAge: 5,
  annualRevenue: 500000000,
  employeeCount: 8,
  debtRatio: 100,
  isDisabled: false,
  isSocialEnterprise: false,
  isVentureCompany: false,
  isInnobiz: false,
  isMainbiz: false,
  isFemale: false,
  isRestart: false,
  isYouthCompany: false,
  hasExportRevenue: false,
  hasRndActivity: false,
  hasIpoOrInvestmentPlan: false,
  acceptsEquityDilution: false,
  requiredFundingAmount: 1,
  fundPurpose: 'operating',
  hasTaxDelinquency: false,
  hasCreditIssue: false,
};

// 테스트 2: 일반 소기업이 소공인특화자금 신청 → EXCLUDED
const smallCompany: ExtendedCompanyProfile = {
  ...microCompany,
  companyName: '소기업테스트',
  companySize: 'small',
  employeeCount: 30,
};

// 테스트 3: 체납 active → EXCLUDED
const delinquentCompany: ExtendedCompanyProfile = {
  ...microCompany,
  companyName: '체납기업',
  taxDelinquencyStatus: 'active',
};

// 테스트 4: 체납 정리 중 → CONDITIONAL
const resolvingCompany: ExtendedCompanyProfile = {
  ...microCompany,
  companyName: '체납정리중기업',
  taxDelinquencyStatus: 'resolving',
};

// 테스트 5: 재창업 + 코로나 사유 → 재도전자금 MATCHED
const restartCompany: ExtendedCompanyProfile = {
  ...microCompany,
  companyName: '재창업기업',
  isRestart: true,
  restartReason: 'covid',
};

async function runTests() {
  console.log('======================================================================');
  console.log('targetScale & 체납/신용 로직 테스트');
  console.log('======================================================================\n');

  // 테스트 1: 소공인
  console.log('[테스트 1] 소공인 기업');
  const result1 = await classifyMatchResults(microCompany, { topN: 10 });
  const microFund = result1.matched.find(m => m.program_name.includes('소공인'));
  const microExcluded = result1.excluded.find(e => e.program_name.includes('소공인'));
  console.log(`  소공인특화자금 matched: ${microFund ? '✅ PASS' : '❌ (없음)'}`);
  console.log(`  소공인특화자금 excluded: ${microExcluded ? '❌ FAIL' : '✅ (없음)'}`);
  console.log('');

  // 테스트 2: 소기업 → 소공인특화자금 EXCLUDED
  console.log('[테스트 2] 소기업이 소공인특화자금 신청');
  const result2 = await classifyMatchResults(smallCompany, { topN: 10 });
  const smallExcluded = result2.excluded.find(e =>
    e.program_name.includes('소공인') && e.excluded_reason === '기업규모 미충족'
  );
  console.log(`  소공인특화자금 EXCLUDED (기업규모): ${smallExcluded ? '✅ PASS' : '❌ FAIL'}`);
  if (smallExcluded) {
    console.log(`    rule: ${smallExcluded.rule_triggered}`);
    console.log(`    note: ${smallExcluded.note}`);
  }
  console.log('');

  // 테스트 3: 체납 active → EXCLUDED
  console.log('[테스트 3] 체납 active 기업');
  const result3 = await classifyMatchResults(delinquentCompany, { topN: 10 });
  const delinquentExcluded = result3.excluded.filter(e => e.excluded_reason === '체납');
  console.log(`  체납으로 EXCLUDED된 자금: ${delinquentExcluded.length}개`);
  console.log(`  전체 matched: ${result3.matched.length}개`);
  console.log(`  체납 EXCLUDED 작동: ${delinquentExcluded.length > 0 ? '✅ PASS' : '⚠️ (체납 체크 안 됨)'}`);
  console.log('');

  // 테스트 4: 체납 정리 중 → CONDITIONAL
  console.log('[테스트 4] 체납 정리 중 기업');
  const result4 = await classifyMatchResults(resolvingCompany, { topN: 10 });
  const resolvingConditional = result4.conditional.filter(c => c.what_is_missing === '체납정리중');
  console.log(`  체납정리중 CONDITIONAL: ${resolvingConditional.length}개`);
  console.log(`  CONDITIONAL 작동: ${resolvingConditional.length > 0 ? '✅ PASS' : '⚠️ (조건부 처리 안 됨)'}`);
  console.log('');

  // 테스트 5: 재창업 + 코로나 사유
  console.log('[테스트 5] 재창업 + 코로나 사유 기업');
  const result5 = await classifyMatchResults(restartCompany, { topN: 10 });
  const restartMatched = result5.matched.find(m =>
    m.program_name.includes('재창업') || m.program_name.includes('재도약') || m.program_name.includes('재기')
  );
  console.log(`  재도전자금 matched: ${restartMatched ? '✅ PASS' : '⚠️ (없음)'}`);
  if (restartMatched) {
    console.log(`    자금명: ${restartMatched.program_name}`);
  }
  console.log('');

  console.log('======================================================================');
  console.log('[요약]');
  console.log('======================================================================');
  console.log('1. targetScale 하드컷: ' + (smallExcluded ? '✅' : '❌'));
  console.log('2. 체납 active EXCLUDED: ' + (delinquentExcluded.length > 0 ? '✅' : '⚠️'));
  console.log('3. 체납 정리중 CONDITIONAL: ' + (resolvingConditional.length > 0 ? '✅' : '⚠️'));
  console.log('4. 재창업 + 정당사유 pass: ' + (restartMatched ? '✅' : '⚠️'));
}

runTests();
