/**
 * 리팩토링 검증 테스트
 * 1. 트랙 차단 완화 확인 (exclusive 자격 + general 자금 표시)
 * 2. 4단계 정렬 확인 (특화 → 규모 → 직접대출 → 점수)
 */

import { classifyMatchResults } from '../matching-engine';

// 테스트 케이스 1: 장애인기업 + 일반자금도 보여야 함
const testProfile1 = {
  companyName: '장애인기업테스트',
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

async function runTest() {
  console.log('======================================================================');
  console.log('리팩토링 검증 테스트');
  console.log('======================================================================');
  console.log('');

  // 테스트 1: 장애인기업 + 트랙 차단 완화 확인
  console.log('[테스트 1] 장애인기업 - 트랙 차단 완화 확인');
  console.log('기대: 전용자금 우선 + 일반자금도 후순위로 표시');
  console.log('');

  const result1 = await classifyMatchResults(testProfile1, { topN: 10 });

  console.log('[track_decision]');
  console.log(`  allowed_tracks: ${JSON.stringify(result1.track_decision.allowed_tracks)}`);
  console.log(`  blocked_tracks: ${JSON.stringify(result1.track_decision.blocked_tracks)}`);
  console.log(`  why: ${result1.track_decision.why}`);
  console.log('');

  // 차단 완화 확인
  const hasGeneralBlocked = result1.track_decision.blocked_tracks.includes('일반');
  console.log(`일반 트랙 차단됨: ${hasGeneralBlocked ? '❌ FAIL (아직 차단됨)' : '✅ PASS (차단 해제)'}`);
  console.log('');

  console.log('[matched 결과]');
  console.log(`  총 ${result1.matched.length}개`);

  // 트랙 분포
  const trackDist: Record<string, number> = {};
  result1.matched.forEach(m => {
    trackDist[m.track] = (trackDist[m.track] || 0) + 1;
  });
  console.log(`  트랙 분포: ${JSON.stringify(trackDist)}`);
  console.log('');

  // 일반 트랙 자금 있는지
  const hasGeneral = result1.matched.some(m => m.track === '일반');
  console.log(`일반 트랙 자금 포함: ${hasGeneral ? '✅ PASS' : '⚠️ (없음 - 정상일 수 있음)'}`);
  console.log('');

  // 정렬 순서 확인
  console.log('[정렬 순서 확인]');
  result1.matched.forEach((m, i) => {
    console.log(`  ${i + 1}순위: [${m.track}] ${m.program_name} (label: ${m.label})`);
  });
  console.log('');

  // 전용 트랙이 상단에 있는지
  const exclusiveFirst = result1.matched.length > 0 && result1.matched[0].track === '전용';
  console.log(`전용 트랙 최상단: ${exclusiveFirst ? '✅ PASS' : '⚠️ (전용 없음)'}`);
  console.log('');

  // excluded에서 트랙차단 이유 확인
  const trackBlockedExcluded = result1.excluded.filter(e => e.excluded_reason === '트랙차단');
  console.log(`[excluded 중 트랙차단]: ${trackBlockedExcluded.length}개`);
  if (trackBlockedExcluded.length > 0) {
    console.log('  - ' + trackBlockedExcluded.slice(0, 3).map(e => e.program_name).join(', ') + '...');
  }
  console.log('');

  console.log('======================================================================');
  console.log('[종합 결과]');
  console.log('======================================================================');
  console.log(`1. 트랙 차단 완화: ${!hasGeneralBlocked ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`2. 전용자금 우선: ${exclusiveFirst ? '✅ PASS' : '⚠️ 확인 필요'}`);
  console.log(`3. 4단계 정렬: 수동 확인 필요 (위 정렬 순서 참고)`);
}

runTest();
