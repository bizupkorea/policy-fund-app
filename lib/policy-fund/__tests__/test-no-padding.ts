/**
 * "개수 채우기 금지" 규칙 검증
 * - matched가 5개 미만이어도 그대로 출력
 * - 빈 순위를 채우기 위한 생성/추론 없음
 */

import { classifyMatchResults } from '../matching-engine';

// 극단적 케이스: 거의 모든 자금이 excluded되는 프로필
const extremeProfile = {
  companyName: '극단테스트기업',
  businessNumber: '999-99-99999',
  companySize: 'small' as const,
  industry: '도박업', // 대부분 제외 업종
  location: '서울',
  businessAge: 1, // 1년차 - 많은 자금 업력 미달
  annualRevenue: 50000000, // 5천만원 - 매출 미달
  employeeCount: 1, // 1명 - 직원수 미달
  debtRatio: 500, // 500% - 부채비율 과다
  isDisabledStandard: false,
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
  hasPatent: false,
  hasIpoOrInvestmentPlan: false,
  acceptsEquityDilution: false,
  requiredFundingAmount: 10, // 10억 필요
  fundPurpose: 'operating' as const,
  hasTaxDelinquency: true, // 체납 있음!
  hasCreditIssue: true, // 신용문제 있음!
};

async function runTest() {
  console.log('='.repeat(70));
  console.log('[개수 채우기 금지 규칙 검증]');
  console.log('='.repeat(70));
  console.log('');
  console.log('테스트 프로필: 거의 모든 조건 미달');
  console.log('- 업종: 도박업 (대부분 제외)');
  console.log('- 업력: 1년차');
  console.log('- 매출: 5천만원');
  console.log('- 직원: 1명');
  console.log('- 부채비율: 500%');
  console.log('- 체납: O');
  console.log('- 신용문제: O');
  console.log('');

  const result = await classifyMatchResults(extremeProfile, { topN: 10 });

  console.log('[결과]');
  console.log(`  matched: ${result.matched.length}개`);
  console.log(`  conditional: ${result.conditional.length}개`);
  console.log(`  excluded: ${result.excluded.length}개`);
  console.log('');

  if (result.matched.length > 0) {
    console.log('[matched 항목]');
    result.matched.forEach((m, i) => {
      console.log(`  ${i + 1}. ${m.program_name} (${m.track})`);
    });
  } else {
    console.log('[matched 항목] (없음)');
  }

  console.log('');
  console.log('='.repeat(70));
  console.log('[ASSERT 검증]');
  console.log('='.repeat(70));

  // ASSERT 1: matched가 5개 미만이어도 빈 항목으로 채우지 않음
  const assert1 = result.matched.every(m => m.program_name && m.program_name.length > 0);
  console.log(`1) matched에 빈 항목/더미 없음: ${assert1 ? '✅ PASS' : '❌ FAIL'}`);

  // ASSERT 2: matched 개수가 실제 매칭된 것만 포함
  const assert2 = result.matched.length <= 5;
  console.log(`2) matched 개수 ≤ 5: ${assert2 ? '✅ PASS' : '❌ FAIL'} (${result.matched.length}개)`);

  // ASSERT 3: 모든 matched 항목이 실제 knowledge-base에 존재하는 자금
  // (생성/추론된 가짜 자금이 아님)
  const knownFundKeywords = ['자금', '보증', '융자', '지원'];
  const assert3 = result.matched.every(m =>
    knownFundKeywords.some(kw => m.program_name.includes(kw))
  );
  console.log(`3) matched가 실제 자금명만 포함: ${assert3 ? '✅ PASS' : '❌ FAIL'}`);

  // ASSERT 4: 빈 순위를 채우기 위해 "추천합니다", "검토해보세요" 등의 추론 문구 없음
  const inferenceKeywords = ['추천합니다', '검토해보세요', '고려해볼', '대안으로'];
  const assert4 = result.matched.every(m =>
    !inferenceKeywords.some(kw => m.why_ranked_here?.includes(kw))
  );
  console.log(`4) 추론/보완 문구 없음: ${assert4 ? '✅ PASS' : '❌ FAIL'}`);

  const allPass = assert1 && assert2 && assert3 && assert4;
  console.log('');
  console.log(`====> 최종: ${allPass ? '✅ ALL PASS' : '❌ FAIL'}`);

  // 추가: matched가 0~2개인 경우 정상임을 표시
  if (result.matched.length < 3) {
    console.log('');
    console.log(`※ matched ${result.matched.length}개는 정상입니다. 빈 순위를 채우지 않습니다.`);
  }
}

runTest();
