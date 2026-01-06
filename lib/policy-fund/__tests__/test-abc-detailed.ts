/**
 * A/B/C 케이스 상세 검증 테스트
 * - 항목명 리스트 출력
 * - 특정 자금 차단 검증
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
  hasRndActivity: true,
  hasPatent: true,
  hasIpoOrInvestmentPlan: false,
  acceptsEquityDilution: false,
};

async function runDetailedTest(caseName: string, profile: any, expectedBlocked: string[]) {
  console.log('');
  console.log('='.repeat(80));
  console.log(`[입력 ${caseName}]`);
  console.log('='.repeat(80));

  // 주요 입력값 출력
  console.log(`장애인표준사업장: ${profile.isDisabledStandard ? 'O' : 'X'}`);
  console.log(`수출: ${profile.hasExportRevenue ? 'O' : 'X'}`);
  console.log(`기술근거(R&D/특허): ${(profile.hasRndActivity || profile.hasPatent) ? 'O' : 'X'}`);
  console.log(`투자/지분희석: ${(profile.hasIpoOrInvestmentPlan || profile.acceptsEquityDilution) ? 'O' : 'X'}`);
  console.log('');

  const result = await classifyMatchResults(profile, { topN: 10 });

  // 1) 항목명 리스트 출력
  console.log('[1) matched 항목명 리스트]');
  result.matched.forEach((m, i) => {
    console.log(`  ${i + 1}. ${m.program_name} (${m.track}, ${m.confidence_score}점)`);
  });
  if (result.matched.length === 0) console.log('  (없음)');

  console.log('');
  console.log('[1) conditional 항목명 리스트]');
  result.conditional.forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.program_name} (${c.track})`);
  });
  if (result.conditional.length === 0) console.log('  (없음)');

  console.log('');
  console.log('[1) excluded 항목명 리스트]');
  result.excluded.forEach((e, i) => {
    console.log(`  ${i + 1}. ${e.program_name} | ${e.track} | ${e.excluded_reason} | ${e.rule_triggered}`);
  });
  if (result.excluded.length === 0) console.log('  (없음)');

  // 2) 일반경영안정자금 검증 (케이스 A만 해당)
  console.log('');
  console.log('-'.repeat(80));
  console.log('[2) 일반경영안정자금 검증]');

  const generalFunds = result.excluded.filter(e =>
    e.program_name.includes('일반경영안정') && e.track === '일반'
  );

  if (caseName === 'A') {
    // A에서는 일반트랙이 blocked이므로, 일반경영안정자금이 트랙차단으로 excluded되어야 함
    const hasGeneralBlocked = generalFunds.some(e =>
      e.excluded_reason === '트랙차단' &&
      (e.rule_triggered.includes('일반') || e.rule_triggered.includes('general'))
    );
    console.log(`  일반경영안정자금 excluded 여부: ${generalFunds.length > 0 ? '✅' : '❌'}`);
    console.log(`  excluded_reason="트랙차단": ${hasGeneralBlocked ? '✅' : '❌'}`);
    if (generalFunds.length > 0) {
      generalFunds.forEach(e => {
        console.log(`    → ${e.program_name}: reason=${e.excluded_reason}, rule=${e.rule_triggered}`);
      });
    }
  } else {
    console.log(`  (케이스 ${caseName}에서는 일반트랙이 allowed이므로 검증 생략)`);
  }

  // 3) 금지 룰 강제 테스트
  console.log('');
  console.log('-'.repeat(80));
  console.log('[3) 금지 룰 강제 테스트]');

  // 3-1) 청년 키워드 자금 검증 (대표자 55세이므로 모두 excluded)
  console.log('');
  console.log('  [3-1) 청년 키워드 자금 검증 (대표자 55세)]');
  const youthFunds = result.excluded.filter(e =>
    e.program_name.includes('청년')
  );
  const youthExcluded = youthFunds.filter(e =>
    e.excluded_reason === '요건불충족' && e.rule_triggered.includes('연령')
  );
  console.log(`    청년 키워드 자금 excluded 개수: ${youthFunds.length}개`);
  console.log(`    요건불충족+대표자연령불일치: ${youthExcluded.length}개`);
  youthFunds.slice(0, 3).forEach(e => {
    console.log(`      → ${e.program_name}: reason=${e.excluded_reason}, rule=${e.rule_triggered}`);
  });
  if (youthFunds.length > 3) console.log(`      ... 외 ${youthFunds.length - 3}개`);

  // 3-2) 기술/혁신/R&D 키워드 자금 검증
  console.log('');
  console.log('  [3-2) 기술/혁신/R&D 키워드 자금 검증]');
  const techFundsExcluded = result.excluded.filter(e =>
    (e.program_name.includes('기술') || e.program_name.includes('혁신') ||
     e.program_name.includes('R&D') || e.program_name.includes('테크'))
  );
  const techFundsMatched = result.matched.filter(m =>
    (m.program_name.includes('기술') || m.program_name.includes('혁신') ||
     m.program_name.includes('R&D') || m.program_name.includes('테크'))
  );

  const hasTechAssets = profile.hasRndActivity || profile.hasPatent;

  if (!hasTechAssets) {
    // 기술근거 없으면 모두 excluded
    console.log(`    기술근거: X → 기술/혁신 자금 모두 excluded 기대`);
    console.log(`    excluded된 기술자금: ${techFundsExcluded.length}개`);
    console.log(`    matched된 기술자금: ${techFundsMatched.length}개 (0이어야 함)`);
    techFundsExcluded.slice(0, 3).forEach(e => {
      console.log(`      → ${e.program_name}: reason=${e.excluded_reason}, rule=${e.rule_triggered}`);
    });
    if (techFundsExcluded.length > 3) console.log(`      ... 외 ${techFundsExcluded.length - 3}개`);
  } else {
    // 기술근거 있으면 matched 가능
    console.log(`    기술근거: O → 기술/혁신 자금 matched 가능`);
    console.log(`    matched된 기술자금: ${techFundsMatched.length}개`);
    techFundsMatched.forEach(m => {
      console.log(`      → ${m.program_name}: ${m.track}, ${m.confidence_score}점`);
    });
  }

  // ASSERT 종합
  console.log('');
  console.log('='.repeat(80));
  console.log(`[ASSERT 종합 - 케이스 ${caseName}]`);
  console.log('='.repeat(80));

  // ASSERT 1: blocked 트랙이 matched에 없어야 함
  const blockedInMatched = result.matched.filter(m => expectedBlocked.includes(m.track)).length;
  const assert1 = blockedInMatched === 0;
  console.log(`1) blocked 트랙(${expectedBlocked.join(',')})이 matched에 0개: ${assert1 ? '✅ PASS' : '❌ FAIL'} (${blockedInMatched}개)`);

  // ASSERT 2: 일반경영안정자금 (케이스 A만)
  let assert2 = true;
  if (caseName === 'A') {
    const hasGeneralCorrectlyExcluded = generalFunds.some(e => e.excluded_reason === '트랙차단');
    assert2 = hasGeneralCorrectlyExcluded;
    console.log(`2) 일반경영안정자금 트랙차단 처리: ${assert2 ? '✅ PASS' : '❌ FAIL'}`);
  } else {
    console.log(`2) 일반경영안정자금 검증: (해당없음) ✅ PASS`);
  }

  // ASSERT 3: 청년 자금 모두 excluded
  const youthInMatched = result.matched.filter(m => m.program_name.includes('청년')).length;
  const assert3 = youthInMatched === 0;
  console.log(`3) 청년 자금이 matched에 0개: ${assert3 ? '✅ PASS' : '❌ FAIL'} (${youthInMatched}개)`);

  // ASSERT 4: 기술 자금 검증 (기술근거 없으면 matched에 0개)
  let assert4 = true;
  if (!hasTechAssets) {
    assert4 = techFundsMatched.length === 0;
    console.log(`4) 기술근거X → 기술자금 matched 0개: ${assert4 ? '✅ PASS' : '❌ FAIL'} (${techFundsMatched.length}개)`);
  } else {
    console.log(`4) 기술근거O → 기술자금 matched 가능: ✅ PASS (${techFundsMatched.length}개)`);
  }

  const allPass = assert1 && assert2 && assert3 && assert4;
  console.log('');
  console.log(`====> 케이스 ${caseName} 최종: ${allPass ? '✅ ALL PASS' : '❌ FAIL'}`);

  return allPass;
}

async function runAllTests() {
  console.log('');
  console.log('#'.repeat(80));
  console.log('# A/B/C 케이스 상세 검증 테스트');
  console.log('#'.repeat(80));

  const passA = await runDetailedTest('A', caseA, ['일반']);
  const passB = await runDetailedTest('B', caseB, ['전용']);
  const passC = await runDetailedTest('C', caseC, ['전용']);

  console.log('');
  console.log('#'.repeat(80));
  console.log('# 종합 결과');
  console.log('#'.repeat(80));
  console.log(`케이스 A (장애인표준O, 기술X): ${passA ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`케이스 B (장애인표준X, 기술X): ${passB ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`케이스 C (장애인표준X, 기술O): ${passC ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');
  console.log(`====> 전체: ${(passA && passB && passC) ? '✅ ALL PASS' : '❌ FAIL'}`);
}

runAllTests();
