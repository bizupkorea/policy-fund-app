/**
 * V1 vs V2 매칭 엔진 비교 테스트
 *
 * 실행: npx tsx lib/policy-fund/last/matcher/__tests__/compare-v1-v2.ts
 */

import { matchWithKnowledgeBase } from '../index';
import { matchWithKnowledgeBase as matchWithKnowledgeBaseV2 } from '../pipeline';
import type { ExtendedCompanyProfile } from '../../types';

// ============================================================================
// 테스트 케이스 정의
// ============================================================================

interface TestCase {
  name: string;
  profile: Partial<ExtendedCompanyProfile>;
}

const TEST_CASES: TestCase[] = [
  {
    name: '기본 케이스: 제조업 소기업',
    profile: {
      industryName: '금속가공 제조업',
      industry: 'manufacturing',
      employeeCount: 15,
      revenue: 20, // 20억
      businessAge: 5,
      companySize: 'small',
      isVentureCompany: false,
      isInnobiz: false,
    },
  },
  {
    name: '문제 케이스: 스마트공장 + 벤처투자 + IPO',
    profile: {
      industryName: '금속가공 제조업 (자동차 부품)',
      industry: 'manufacturing',
      industryCode: 'C25',
      employeeCount: 22,
      revenue: 38, // 38억
      businessAge: 7,
      companySize: 'small',
      isVentureCompany: true,
      hasRndActivity: true, // 기업부설연구소
      hasIsoCertification: true, // ISO9001
      hasIpoOrInvestmentPlan: true,
      hasVentureInvestment: true,
      ventureInvestmentAmount: 5, // Pre-A 5억
      acceptsEquityDilution: true,
      hasSmartFactoryPlan: true,
      requestedFundingPurpose: 'facility',
      currentGuaranteeOrg: 'kibo',
    },
  },
  {
    name: '소상공인: 서비스업 4인',
    profile: {
      industryName: '소프트웨어 개발업',
      industry: 'service',
      employeeCount: 4,
      revenue: 3, // 3억
      businessAge: 2,
      companySize: 'micro',
      isVentureCompany: true,
    },
  },
  {
    name: '재창업 기업',
    profile: {
      industryName: '음식점업',
      industry: 'service',
      employeeCount: 3,
      revenue: 2,
      businessAge: 1,
      companySize: 'micro',
      isRestart: true,
      hasPastDefault: true,
      isPastDefaultResolved: true,
    },
  },
  {
    name: 'ESG + 신재생에너지',
    profile: {
      industryName: '태양광 발전업',
      industry: 'manufacturing',
      employeeCount: 30,
      revenue: 50,
      businessAge: 5,
      companySize: 'small',
      hasEsgInvestmentPlan: true,
      isGreenEnergyBusiness: true,
    },
  },
  {
    name: '중진공 4회 이용 (졸업제 임박)',
    profile: {
      industryName: '전자부품 제조업',
      industry: 'manufacturing',
      employeeCount: 45,
      revenue: 80,
      businessAge: 10,
      companySize: 'medium',
      kosmesPreviousCount: 4,
    },
  },
  {
    name: '긴급경영 상황',
    profile: {
      industryName: '의류 도매업',
      industry: 'wholesale',
      employeeCount: 8,
      revenue: 15,
      businessAge: 8,
      companySize: 'small',
      isEmergencySituation: true,
    },
  },
];

// ============================================================================
// 비교 함수
// ============================================================================

interface ComparisonResult {
  testName: string;
  v1Count: number;
  v2Count: number;
  v1Top5: { fundName: string; score: number; level: string }[];
  v2Top5: { fundName: string; score: number; level: string }[];
  differences: string[];
}

async function compareResults(testCase: TestCase): Promise<ComparisonResult> {
  const profile = testCase.profile as ExtendedCompanyProfile;

  // V1 실행
  const v1Result = await matchWithKnowledgeBase(profile, { topN: 5 });

  // V2 실행
  const v2Result = await matchWithKnowledgeBaseV2(profile, { topN: 5 });

  const v1Top5 = v1Result.results.slice(0, 5).map(r => ({
    fundName: r.fundName,
    score: r.score,
    level: r.level,
  }));

  const v2Top5 = v2Result.results.slice(0, 5).map(r => ({
    fundName: r.fundName,
    score: r.score,
    level: r.level,
  }));

  // 차이점 분석
  const differences: string[] = [];

  // 1. 결과 개수 비교
  if (v1Result.results.length !== v2Result.results.length) {
    differences.push(`결과 개수 차이: V1=${v1Result.results.length}, V2=${v2Result.results.length}`);
  }

  // 2. Top 5 자금명 비교
  const v1Names = v1Top5.map(r => r.fundName);
  const v2Names = v2Top5.map(r => r.fundName);

  for (let i = 0; i < Math.max(v1Names.length, v2Names.length); i++) {
    if (v1Names[i] !== v2Names[i]) {
      differences.push(`순위 ${i + 1} 차이: V1="${v1Names[i] || '없음'}" vs V2="${v2Names[i] || '없음'}"`);
    }
  }

  // 3. 점수 차이 (같은 자금)
  for (const v1Item of v1Top5) {
    const v2Item = v2Top5.find(r => r.fundName === v1Item.fundName);
    if (v2Item && v1Item.score !== v2Item.score) {
      differences.push(`"${v1Item.fundName}" 점수 차이: V1=${v1Item.score} vs V2=${v2Item.score}`);
    }
  }

  return {
    testName: testCase.name,
    v1Count: v1Result.results.length,
    v2Count: v2Result.results.length,
    v1Top5,
    v2Top5,
    differences,
  };
}

// ============================================================================
// 메인 실행
// ============================================================================

async function main() {
  console.log('='.repeat(80));
  console.log('V1 vs V2 매칭 엔진 비교 테스트');
  console.log('='.repeat(80));
  console.log('');

  let totalDifferences = 0;

  for (const testCase of TEST_CASES) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`📋 ${testCase.name}`);
    console.log('─'.repeat(80));

    try {
      const result = await compareResults(testCase);

      // V1 결과
      console.log('\n[V1 결과]');
      result.v1Top5.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.fundName} - ${r.score}점 (${r.level})`);
      });

      // V2 결과
      console.log('\n[V2 결과]');
      result.v2Top5.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.fundName} - ${r.score}점 (${r.level})`);
      });

      // 차이점
      if (result.differences.length > 0) {
        console.log('\n⚠️ [차이점 발견]');
        result.differences.forEach(d => console.log(`  - ${d}`));
        totalDifferences += result.differences.length;
      } else {
        console.log('\n✅ 결과 동일');
      }
    } catch (error) {
      console.log(`\n❌ 에러 발생: ${error}`);
      totalDifferences++;
    }
  }

  // 요약
  console.log('\n' + '='.repeat(80));
  console.log('📊 테스트 요약');
  console.log('='.repeat(80));
  console.log(`  총 테스트 케이스: ${TEST_CASES.length}`);
  console.log(`  총 차이점: ${totalDifferences}`);

  if (totalDifferences === 0) {
    console.log('\n🎉 모든 테스트 통과! V1과 V2 결과가 동일합니다.');
  } else {
    console.log(`\n⚠️ ${totalDifferences}개의 차이점이 발견되었습니다.`);
  }
}

main().catch(console.error);
