/**
 * targetScale 하드컷 로직 추가
 * 기업규모가 자금의 targetScale에 포함되지 않으면 EXCLUDED
 */

const fs = require('fs');

const filePath = 'E:/biznova/policy-fund-app/lib/policy-fund/matching-engine.ts';
let content = fs.readFileSync(filePath, 'utf8');

// 키워드 제외 체크 후, 하드룰 체크 전에 targetScale 체크 삽입
const oldPattern = `      continue;
    }

    // 3) 하드룰 미충족 → EXCLUDED
    if (!result.isEligible) {`;

const newPattern = `      continue;
    }

    // 2.5) targetScale 하드컷 - 기업규모 미충족 시 EXCLUDED
    if (fund?.targetScale && fund.targetScale.length > 0) {
      const companyScale = profile.companySize || 'small';
      if (!fund.targetScale.includes(companyScale)) {
        excluded.push({
          program_name: result.fundName,
          agency: INSTITUTIONS[fund.institutionId]?.name || result.institutionId,
          track: fundTrackKorean,
          excluded_reason: '기업규모 미충족',
          rule_triggered: \`대상: \${fund.targetScale.join(', ')} / 귀사: \${companyScale}\`,
          note: \`이 자금은 \${fund.targetScale.map(s => s === 'micro' ? '소공인' : s === 'small' ? '소기업' : s === 'medium' ? '중기업' : s).join(', ')} 전용입니다.\`,
        });
        continue;
      }
    }

    // 3) 하드룰 미충족 → EXCLUDED
    if (!result.isEligible) {`;

if (content.includes(oldPattern)) {
  content = content.replace(oldPattern, newPattern);
  console.log('✅ targetScale 하드컷 로직 추가 완료');
} else {
  console.log('⚠️ 패턴 찾을 수 없음');
  // 디버깅용
  console.log('찾는 패턴:');
  console.log(oldPattern.substring(0, 100));
}

fs.writeFileSync(filePath, content, 'utf8');
