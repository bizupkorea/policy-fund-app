const fs = require('fs');

const filePath = 'E:/biznova/policy-fund-app/lib/policy-fund/matching-engine.ts';
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// "★ v7: 3분류 매칭 수행" 찾기
let insertLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('★ v7: 3분류 매칭 수행')) {
    insertLine = i - 1; // /** 바로 앞
    break;
  }
}

if (insertLine >= 0) {
  console.log(`삽입 위치: 라인 ${insertLine + 1}`);

  const sizeFunc = `/**
 * 기업규모 적합도 계산
 * - 자금의 대상 기업규모와 실제 기업규모 비교
 * @returns 100(정확 일치), 80(범위 내), 50(불일치/기본)
 */
function calculateSizeMatchScore(
  fundId: string | undefined,
  companySize: 'micro' | 'small' | 'medium' | 'venture' | 'innobiz' | 'mainbiz' | undefined
): number {
  if (!fundId || !companySize) return 50;

  const fund = POLICY_FUND_KNOWLEDGE_BASE.find(f => f.id === fundId);
  if (!fund) return 50;

  // 자금의 대상 기업규모 (기본: 소기업, 중기업)
  const targetScales = fund.targetScale || ['small', 'medium'];

  // 기업 규모별 호환 그룹
  const sizeCompatibility: Record<string, string[]> = {
    'micro': ['micro', 'small'],
    'small': ['small', 'micro', 'medium'],
    'medium': ['medium', 'small'],
    'venture': ['venture', 'small', 'medium'],
    'innobiz': ['innobiz', 'small', 'medium'],
    'mainbiz': ['mainbiz', 'small', 'medium'],
  };

  const compatibleSizes = sizeCompatibility[companySize] || [companySize];

  // 정확히 일치: 100점
  if (targetScales.includes(companySize)) return 100;
  // 호환 범위 내: 80점
  if (compatibleSizes.some(s => targetScales.includes(s))) return 80;
  // 불일치: 50점
  return 50;
}

`;

  const funcLines = sizeFunc.split('\n');
  lines.splice(insertLine, 0, ...funcLines);
  console.log('✅ calculateSizeMatchScore 함수 추가 완료');
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
