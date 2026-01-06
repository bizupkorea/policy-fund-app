/**
 * v8 스키마 검증 테스트
 * - matched: label, confidence, why, hard_rules_passed
 * - conditional: what_is_missing, how_to_confirm
 * - excluded: excluded_reason, rule_triggered, note
 */

import { classifyMatchResults } from '../matching-engine';

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
  hasExportRevenue: false,
  hasRndActivity: false,
  hasPatent: false,
  hasIpoOrInvestmentPlan: false,
  acceptsEquityDilution: false,
  requiredFundingAmount: 2,
  fundPurpose: 'operating' as const,
  hasTaxDelinquency: false,
  hasCreditIssue: false,
};

async function runSchemaTest() {
  console.log('======================================================================');
  console.log('v8 스키마 검증 테스트');
  console.log('======================================================================');
  console.log('');

  const result = await classifyMatchResults(testProfile, { topN: 5 });

  // track_decision 출력
  console.log('[track_decision]');
  console.log(JSON.stringify(result.track_decision, null, 2));
  console.log('');

  // matched 스키마 검증
  console.log('[matched 스키마 검증]');
  if (result.matched.length > 0) {
    const first = result.matched[0];
    console.log('첫 번째 matched:');
    console.log(JSON.stringify(first, null, 2));
    console.log('');

    // 필수 필드 체크
    const requiredFields = ['program_name', 'agency', 'track', 'label', 'confidence', 'why', 'hard_rules_passed'];
    const hasAllFields = requiredFields.every(f => f in first);
    console.log(`필수 필드 존재: ${hasAllFields ? '✅ PASS' : '❌ FAIL'}`);

    // label 값 체크
    const validLabels = ['전용·우선', '유력', '대안', '플랜B'];
    const validLabel = validLabels.includes(first.label);
    console.log(`label 유효값 (${first.label}): ${validLabel ? '✅ PASS' : '❌ FAIL'}`);

    // confidence 값 체크
    const validConfidence = ['HIGH', 'MEDIUM'].includes(first.confidence);
    console.log(`confidence 유효값 (${first.confidence}): ${validConfidence ? '✅ PASS' : '❌ FAIL'}`);

    // _score 제거 확인
    const noScore = !('_score' in first);
    console.log(`_score 제거됨: ${noScore ? '✅ PASS' : '❌ FAIL'}`);

    // confidence_score 없음 확인
    const noOldScore = !('confidence_score' in first);
    console.log(`confidence_score 없음: ${noOldScore ? '✅ PASS' : '❌ FAIL'}`);

    // why_ranked_here 없음 확인
    const noOldWhy = !('why_ranked_here' in first);
    console.log(`why_ranked_here 없음: ${noOldWhy ? '✅ PASS' : '❌ FAIL'}`);
  } else {
    console.log('(matched 없음)');
  }
  console.log('');

  // conditional 스키마 검증
  console.log('[conditional 스키마 검증]');
  if (result.conditional.length > 0) {
    const first = result.conditional[0];
    console.log('첫 번째 conditional:');
    console.log(JSON.stringify(first, null, 2));
    console.log('');

    const requiredFields = ['program_name', 'agency', 'track', 'what_is_missing', 'how_to_confirm'];
    const hasAllFields = requiredFields.every(f => f in first);
    console.log(`필수 필드 존재: ${hasAllFields ? '✅ PASS' : '❌ FAIL'}`);

    // 구 필드 없음 확인
    const noOldFields = !('missing_requirements' in first) && !('what_to_fix' in first);
    console.log(`구 필드 없음: ${noOldFields ? '✅ PASS' : '❌ FAIL'}`);
  } else {
    console.log('(conditional 없음 - 정상)');
  }
  console.log('');

  // excluded 스키마 검증
  console.log('[excluded 스키마 검증]');
  if (result.excluded.length > 0) {
    const first = result.excluded[0];
    console.log('첫 번째 excluded:');
    console.log(JSON.stringify(first, null, 2));
    console.log('');

    const requiredFields = ['program_name', 'agency', 'track', 'excluded_reason', 'rule_triggered', 'note'];
    const hasAllFields = requiredFields.every(f => f in first);
    console.log(`필수 필드 존재: ${hasAllFields ? '✅ PASS' : '❌ FAIL'}`);
  } else {
    console.log('(excluded 없음)');
  }
  console.log('');

  // 전체 JSON 출력
  console.log('======================================================================');
  console.log('[전체 결과 JSON]');
  console.log('======================================================================');
  console.log(JSON.stringify(result, null, 2));
}

runSchemaTest();
