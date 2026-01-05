/**
 * 트랙 강제 분기 상세 검증 테스트
 * - matched/excluded 항목명 리스트 출력
 * - 금지 룰 강제 테스트 (청년고용특별자금, 산업기술혁신자금)
 */

import { matchWithKnowledgeBase } from './matching-engine';
import { POLICY_FUND_KNOWLEDGE_BASE } from './knowledge-base';

// 공통 프로필
const baseProfile = {
  companyName: '테스트기업',
  businessNumber: '123-45-67890',
  companySize: 'small' as const,
  industry: '임가공 및 포장 서비스',
  location: '부산',
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
  isYouthCompany: false,  // 청년 아님 (대표 55세)
  hasExportRevenue: false,
  hasPatent: false,
  requiredFundingAmount: 2,
  fundPurpose: 'operating' as const,
  hasTaxDelinquency: false,
  hasCreditIssue: false,
};

// 입력 A: 장애인표준사업장=O, 기술근거=X
const profileA = {
  ...baseProfile,
  isDisabledStandard: true,
  isDisabled: true,
  hasRndActivity: false,
};

// 입력 B: 장애인표준사업장=X, 기술근거=X
const profileB = {
  ...baseProfile,
  isDisabledStandard: false,
  isDisabled: false,
  hasRndActivity: false,
};

// 입력 C: 장애인표준사업장=X, 기술근거=O
const profileC = {
  ...baseProfile,
  isDisabledStandard: false,
  isDisabled: false,
  hasRndActivity: true,
  hasPatent: true,
};

// knowledge-base에서 트랙 조회
function getTrack(fundName: string): string {
  const fund = POLICY_FUND_KNOWLEDGE_BASE.find(f => f.name === fundName);
  return fund?.track || 'unknown';
}

async function runDetailTest(name: string, profile: any) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`[입력 ${name}]`);
  console.log(`${'='.repeat(70)}`);

  // 프로필 핵심 정보
  console.log(`  장애인표준사업장: ${profile.isDisabledStandard ? 'O' : 'X'}`);
  console.log(`  청년기업(isYouthCompany): ${profile.isYouthCompany ? 'O' : 'X'}`);
  console.log(`  기술근거(hasRndActivity): ${profile.hasRndActivity ? 'O' : 'X'}`);

  const result = await matchWithKnowledgeBase(profile, { topN: 50 });

  // track_decision 추론
  const hasExclusive = profile.isDisabledStandard || profile.isDisabled ||
                       profile.isSocialEnterprise || profile.isRestart || profile.isFemale;
  const allowedTracks = hasExclusive
    ? ['exclusive', 'policy_linked', 'guarantee']
    : ['policy_linked', 'general', 'guarantee'];
  const blockedTracks = hasExclusive ? ['general'] : ['exclusive'];

  console.log(`\n[track_decision]`);
  console.log(`  allowed_tracks: [${allowedTracks.join(', ')}]`);
  console.log(`  blocked_tracks: [${blockedTracks.join(', ')}]`);

  // matched 항목명 리스트
  console.log(`\n[matched 항목 (${result.results.length}개)]`);
  const matchedByTrack: Record<string, string[]> = {
    exclusive: [],
    policy_linked: [],
    general: [],
    guarantee: [],
  };

  result.results.forEach(r => {
    matchedByTrack[r.track]?.push(r.fundName);
  });

  Object.entries(matchedByTrack).forEach(([track, funds]) => {
    if (funds.length > 0) {
      console.log(`  [${track}] ${funds.join(', ')}`);
    }
  });

  // excluded 추론 (현재 반환 안함 - 결과에 없는 자금들)
  // 주요 체크 대상: 일반경영안정자금, 청년고용특별자금, 산업기술혁신자금
  console.log(`\n[excluded 검증]`);

  const checkFunds = [
    { name: '일반경영안정자금', id: 'kosmes-general', track: 'general', reason: '트랙차단' },
    { name: '긴급경영안정자금', id: 'kosmes-emergency', track: 'general', reason: '트랙차단' },
    { name: '청년고용특별자금', id: 'semas-youth', track: 'exclusive', reason: '대표자연령불일치' },
    { name: '산업기술혁신자금', id: 'motie-rnd-fund', track: 'policy_linked', reason: '기술근거없음' },
  ];

  const excluded: Array<{ name: string; track: string; reason: string; rule: string }> = [];

  checkFunds.forEach(check => {
    const inMatched = result.results.some(r => r.fundName === check.name);

    if (!inMatched) {
      // 왜 제외됐는지 판단
      let excludeReason = '';
      let ruleTriggered = '';

      // 1) 트랙 차단
      if (blockedTracks.includes(check.track)) {
        excludeReason = '트랙차단';
        ruleTriggered = `blocked_tracks=${check.track}`;
      }
      // 2) 청년 자금 + 청년 아님
      else if (check.name.includes('청년') && !profile.isYouthCompany) {
        excludeReason = '요건불충족';
        ruleTriggered = '대표자연령불일치(55세, 청년조건39세이하)';
      }
      // 3) 기술/R&D 자금 + 기술근거 없음
      else if ((check.name.includes('기술') || check.name.includes('R&D') || check.name.includes('혁신'))
               && !profile.hasRndActivity) {
        excludeReason = '근거부족';
        ruleTriggered = '기술/R&D근거없음';
      }

      if (excludeReason) {
        excluded.push({
          name: check.name,
          track: check.track,
          reason: excludeReason,
          rule: ruleTriggered,
        });
        console.log(`  ✅ ${check.name} → excluded (${excludeReason}, ${ruleTriggered})`);
      }
    } else {
      console.log(`  ⚠️ ${check.name} → matched에 포함됨!`);
    }
  });

  // ASSERT 검증
  console.log(`\n[ASSERT 검증]`);

  // ASSERT 1: blocked_tracks 자금이 matched에 0개
  let blockedInMatched = 0;
  blockedTracks.forEach(blocked => {
    blockedInMatched += matchedByTrack[blocked]?.length || 0;
  });
  const assert1 = blockedInMatched === 0;
  console.log(`  1) blocked_tracks 자금 0개: ${assert1 ? '✅ PASS' : '❌ FAIL'} (${blockedInMatched}개 발견)`);

  // ASSERT 2: 일반경영안정자금이 A에서 excluded (트랙차단)
  let assert2 = true;
  if (name === 'A') {
    const generalExcluded = excluded.some(e =>
      e.name === '일반경영안정자금' && e.reason === '트랙차단'
    );
    assert2 = generalExcluded;
    console.log(`  2) 일반경영안정자금 트랙차단: ${assert2 ? '✅ PASS' : '❌ FAIL'}`);
  } else {
    console.log(`  2) (A 케이스 전용) SKIP`);
  }

  // ASSERT 3: 청년고용특별자금이 excluded (대표자 55세)
  const youthInMatched = result.results.some(r => r.fundName === '청년고용특별자금');
  const assert3 = !youthInMatched;
  console.log(`  3) 청년고용특별자금 제외: ${assert3 ? '✅ PASS' : '❌ FAIL'}`);

  // ASSERT 4: 산업기술혁신자금 - A/B에서 excluded, C에서 matched
  const rndInMatched = result.results.some(r => r.fundName === '산업기술혁신자금');
  let assert4 = true;
  if (name === 'A' || name === 'B') {
    assert4 = !rndInMatched;
    console.log(`  4) 산업기술혁신자금 제외(기술X): ${assert4 ? '✅ PASS' : '❌ FAIL'}`);
  } else if (name === 'C') {
    assert4 = rndInMatched;
    console.log(`  4) 산업기술혁신자금 포함(기술O): ${assert4 ? '✅ PASS' : '❌ FAIL'}`);
  }

  const allPass = assert1 && assert2 && assert3 && assert4;
  console.log(`\n  ====> 최종: ${allPass ? '✅ ALL PASS' : '❌ FAIL'}`);

  return { name, allPass, matched: result.results.length, excluded: excluded.length };
}

async function main() {
  console.log('=' .repeat(70));
  console.log('트랙 강제 분기 상세 검증 테스트');
  console.log('=' .repeat(70));

  const resultA = await runDetailTest('A', profileA);
  const resultB = await runDetailTest('B', profileB);
  const resultC = await runDetailTest('C', profileC);

  console.log(`\n${'='.repeat(70)}`);
  console.log('[최종 결과 요약]');
  console.log(`${'='.repeat(70)}`);
  console.log(`  입력 A: ${resultA.allPass ? '✅ PASS' : '❌ FAIL'} (matched: ${resultA.matched})`);
  console.log(`  입력 B: ${resultB.allPass ? '✅ PASS' : '❌ FAIL'} (matched: ${resultB.matched})`);
  console.log(`  입력 C: ${resultC.allPass ? '✅ PASS' : '❌ FAIL'} (matched: ${resultC.matched})`);
  console.log(`${'='.repeat(70)}`);
}

main();
