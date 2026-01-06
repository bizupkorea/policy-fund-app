/**
 * 2026년 knowledge-base 전면 업데이트 검증 테스트
 *
 * 테스트 기업: 임가공/포장, 부산 사상구, 직원14명, 매출18억, 장애인표준사업장
 *
 * 예상 결과:
 * 1. 장애인기업지원자금 (소진공) → MATCHED (전용자금)
 * 2. 일반경영안정자금 (소진공) → EXCLUDED (소상공인 아님, targetScale: micro)
 * 3. 신성장기반자금 (중진공) → MATCHED (업력 7년 초과)
 * 4. 긴급경영안정자금 → EXCLUDED (긴급상황 아님)
 * 5. 스마트공장지원자금 → EXCLUDED (스마트공장계획 없음)
 * 6. 탄소중립시설자금 → EXCLUDED (ESG투자계획 없음)
 */

import { matchWithKnowledgeBase, ExtendedCompanyProfile } from '../matching-engine';
import { POLICY_FUND_KNOWLEDGE_BASE } from '../knowledge-base';

const testCompany: ExtendedCompanyProfile = {
  companyName: '테스트기업 (장애인표준사업장)',
  businessNumber: '123-45-67890',
  companySize: 'small',  // 직원 14명 = 소기업
  industry: '임가공/포장',
  location: '부산 사상구',
  businessAge: 10,  // 업력 10년
  annualRevenue: 1800000000,  // 18억
  employeeCount: 14,
  debtRatio: 100,

  // 전용 자격
  isDisabled: false,
  isDisabledStandard: true,  // 장애인표준사업장
  isSocialEnterprise: false,
  isVentureCompany: false,
  isInnobiz: false,
  isMainbiz: false,
  isFemale: false,
  isRestart: false,
  isYouthCompany: false,

  // 기타
  hasExportRevenue: false,
  hasRndActivity: false,
  hasIpoOrInvestmentPlan: false,
  acceptsEquityDilution: false,
  requiredFundingAmount: 3,  // 3억
  fundPurpose: 'operating',

  // 체납/신용 상태
  hasTaxDelinquency: false,
  hasCreditIssue: false,
  taxDelinquencyStatus: 'none',
  creditIssueStatus: 'none',

  // 정책연계 조건 (모두 false)
  hasSmartFactoryPlan: false,
  // hasEsgInvestmentPlan: false, // (타입에 추가 필요)
};

async function runTest() {
  console.log('='.repeat(70));
  console.log('2026년 Knowledge Base 전면 업데이트 검증');
  console.log('='.repeat(70));
  console.log('');

  // Knowledge Base 통계
  const semasCount = POLICY_FUND_KNOWLEDGE_BASE.filter(f => f.institutionId === 'semas').length;
  const kosmesCount = POLICY_FUND_KNOWLEDGE_BASE.filter(f => f.institutionId === 'kosmes').length;
  const koditCount = POLICY_FUND_KNOWLEDGE_BASE.filter(f => f.institutionId === 'kodit').length;
  const kiboCount = POLICY_FUND_KNOWLEDGE_BASE.filter(f => f.institutionId === 'kibo').length;
  const semasWithTargetScale = POLICY_FUND_KNOWLEDGE_BASE.filter(f =>
    f.institutionId === 'semas' && f.targetScale?.includes('micro')
  ).length;

  console.log('Knowledge Base 현황:');
  console.log(`  - 중진공(KOSMES): ${kosmesCount}개`);
  console.log(`  - 소진공(SEMAS): ${semasCount}개 (targetScale:micro 설정: ${semasWithTargetScale}개)`);
  console.log(`  - 신보(KODIT): ${koditCount}개`);
  console.log(`  - 기보(KIBO): ${kiboCount}개`);
  console.log('');

  console.log('테스트 기업:');
  console.log(`  - 업종: ${testCompany.industry}`);
  console.log(`  - 위치: ${testCompany.location}`);
  console.log(`  - 직원: ${testCompany.employeeCount}명 (소상공인 아님)`);
  console.log(`  - 매출: ${(testCompany.annualRevenue! / 100000000).toFixed(1)}억`);
  console.log(`  - 업력: ${testCompany.businessAge}년`);
  console.log(`  - 장애인표준사업장: ${testCompany.isDisabledStandard ? '예' : '아니오'}`);
  console.log('');

  try {
    const results = await matchWithKnowledgeBase(testCompany, { topN: 15 });

    console.log('='.repeat(70));
    console.log('매칭 결과');
    console.log('='.repeat(70));
    console.log('');

    results.results.forEach((r, i) => {
      console.log(`${i + 1}. ${r.fundName}`);
      console.log(`   기관: ${r.institutionName || r.institutionId} | 트랙: ${r.track || 'general'} | 점수: ${r.score}`);
    });
    console.log('');

    // 검증
    console.log('='.repeat(70));
    console.log('검증 결과');
    console.log('='.repeat(70));
    console.log('');

    // 1. 일반경영안정자금 제외 (소상공인 아님)
    const hasGeneralStability = results.results.some(r => r.fundName === '일반경영안정자금');
    console.log(`1. 일반경영안정자금 제외 (소상공인 아님): ${hasGeneralStability ? '❌ FAIL' : '✅ PASS'}`);

    // 2. 소진공 자금들 제외 (장애인기업 제외)
    const semasNonDisabled = results.results.filter(r =>
      r.institutionId === 'semas' && !r.fundName.includes('장애인')
    );
    console.log(`2. 소진공 일반자금 제외: ${semasNonDisabled.length === 0 ? '✅ PASS' : '⚠️ ' + semasNonDisabled.map(r => r.fundName).join(', ')}`);

    // 3. 신성장기반자금 매칭
    const hasNewGrowth = results.results.some(r => r.fundName === '신성장기반자금');
    console.log(`3. 신성장기반자금 매칭: ${hasNewGrowth ? '✅ PASS' : '⚠️ (없음)'}`);

    // 4. 장애인기업지원자금 매칭
    const hasDisabledFund = results.results.some(r => r.fundName.includes('장애인'));
    console.log(`4. 장애인기업지원자금 매칭: ${hasDisabledFund ? '✅ PASS' : '⚠️ (없음)'}`);

    // 5. 전용자금 1순위
    const firstTrack = results.results[0]?.track;
    console.log(`5. 1순위 트랙: ${firstTrack} ${firstTrack === 'exclusive' ? '✅ PASS' : '⚠️'}`);

    // 6. 긴급경영안정자금 제외 (긴급상황 아님)
    const hasEmergency = results.results.some(r => r.fundName.includes('긴급'));
    console.log(`6. 긴급경영안정자금 제외: ${hasEmergency ? '⚠️ (매칭됨 - 조건 확인 필요)' : '✅ PASS'}`);

    // 7. 스마트공장/탄소중립 제외
    const hasPolicyLinked = results.results.some(r =>
      r.fundName.includes('스마트공장') || r.fundName.includes('탄소중립')
    );
    console.log(`7. 스마트공장/탄소중립 제외: ${hasPolicyLinked ? '⚠️ (매칭됨)' : '✅ PASS'}`);

    // 8. kosmes-general-stability 삭제 확인
    const hasKosmesGeneral = POLICY_FUND_KNOWLEDGE_BASE.some(f => f.id === 'kosmes-general-stability');
    console.log(`8. kosmes-general-stability 삭제: ${hasKosmesGeneral ? '❌ FAIL' : '✅ PASS'}`);

    console.log('');
    console.log('='.repeat(70));
    const passCount = [
      !hasGeneralStability,
      semasNonDisabled.length === 0,
      hasNewGrowth,
      hasDisabledFund,
      firstTrack === 'exclusive',
      !hasEmergency,
      !hasPolicyLinked,
      !hasKosmesGeneral,
    ].filter(Boolean).length;
    console.log(`총 ${passCount}/8 항목 통과`);
    console.log('='.repeat(70));

  } catch (error) {
    console.error('테스트 실행 오류:', error);
  }
}

runTest();
