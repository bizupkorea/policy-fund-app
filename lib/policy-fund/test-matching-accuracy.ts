/**
 * 매칭 정확도 테스트
 * 테스트 기업: 장애인표준사업장 / 임가공업 / 9년차 / 대표 55세
 */

import { matchWithKnowledgeBase } from './matching-engine';

const testProfile = {
  // 기본 정보
  companyName: '테스트기업',
  businessNumber: '123-45-67890',
  companySize: 'small' as const,
  industry: '임가공 및 포장 서비스',
  location: '부산',
  businessAge: 9,  // 9년차

  // 재무 정보
  annualRevenue: 1500000000,  // 15억
  employeeCount: 12,
  debtRatio: 150,

  // 인증/자격
  isDisabledStandard: true,   // 장애인표준사업장 ✅
  isDisabled: true,           // 장애인 대표 ✅
  isSocialEnterprise: false,
  isVentureCompany: false,
  isInnobiz: false,
  isMainbiz: false,
  isFemale: false,
  isRestart: false,
  isYouthCompany: false,      // 청년 아님 (55세)

  // 기술/수출
  hasRndActivity: false,      // R&D 없음
  hasExportRevenue: false,    // 수출 없음
  hasPatent: false,

  // 자금 필요
  requiredFundingAmount: 2,   // 2억
  fundPurpose: 'operating' as const,

  // 체납/신용
  hasTaxDelinquency: false,
  hasCreditIssue: false,
};

async function runTest() {
  console.log('========================================');
  console.log('매칭 정확도 테스트');
  console.log('========================================');
  console.log('테스트 기업 프로필:');
  console.log('- 업종: 임가공 및 포장 서비스');
  console.log('- 업력: 9년');
  console.log('- 대표: 55세 남성 (장애인)');
  console.log('- 인증: 장애인표준사업장');
  console.log('- R&D: 없음');
  console.log('- 수출: 없음');
  console.log('========================================\n');

  try {
    const result = await matchWithKnowledgeBase(testProfile, { topN: 10 });

    console.log(`총 ${result.results.length}개 자금 매칭됨\n`);

    result.results.forEach((fund, index) => {
      const rank = index + 1;
      console.log(`${rank}순위: ${fund.fundName}`);
      console.log(`  트랙: ${fund.trackLabel}`);
      console.log(`  점수: ${fund.score}점`);
      console.log(`  기관: ${fund.institutionName || fund.institutionId}`);
      if (fund.rankReason) {
        console.log(`  이유: ${fund.rankReason}`);
      }
      console.log('');
    });

    // 제외되어야 할 자금 체크
    console.log('========================================');
    console.log('제외 검증 (이 자금들은 나오면 안 됨)');
    console.log('========================================');

    const shouldBeExcluded = [
      { name: '청년', reason: '대표 55세' },
      { name: '혁신', reason: 'R&D 없음' },
      { name: '문화콘텐츠', reason: '임가공업' },
      { name: '창업', reason: '9년차' },
      { name: '수출', reason: '수출실적 없음' },
    ];

    shouldBeExcluded.forEach(check => {
      const found = result.results.find(r =>
        r.fundName.includes(check.name)
      );
      if (found) {
        console.log(`❌ 오류: "${found.fundName}" 이 ${found.score}점으로 추천됨 (제외사유: ${check.reason})`);
      } else {
        console.log(`✅ 정상: "${check.name}" 포함 자금 제외됨 (${check.reason})`);
      }
    });

  } catch (error) {
    console.error('테스트 오류:', error);
  }
}

runTest();
