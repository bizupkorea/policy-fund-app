const fs = require('fs');

const filePath = 'E:/biznova/policy-fund-app/lib/policy-fund/matching-engine.ts';
let content = fs.readFileSync(filePath, 'utf8');

// 패턴 찾기: if (undetermined) 블록
const pattern = /if \(undetermined\) \{\s*\/\/ CONDITIONAL: 하드룰 충족 \+ 결정변수 미확정\s*conditional\.push\(toConditionalFund\(result, detailedResult, missingVars, whatToFix, fund\)\);\s*\} else \{\s*\/\/ MATCHED: 하드룰 \+ 결정변수 모두 충족\s*matched\.push\(toMatchedFund\(result, detailedResult, fund\)\);\s*\}/;

const replacement = `if (undetermined) {
      // CONDITIONAL: 하드룰 충족 + 결정변수 미확정
      // ★ conditional은 matched에 절대 포함 안 됨
      // ★ 점수 계산, 정렬, 순위 산정에서 완전히 제외
      conditional.push(toConditionalFund(result, detailedResult, missingVars, whatToFix, fund));
      continue;
    }

    // MATCHED: 하드룰 + 결정변수 모두 충족
    matched.push(toMatchedFund(result, detailedResult, fund));`;

if (pattern.test(content)) {
  content = content.replace(pattern, replacement);
  console.log('✅ conditional 분리 로직 수정 완료');
} else {
  console.log('⚠️ 패턴을 찾을 수 없음, 수동 확인 필요');

  // 대체 방법: 문자열 직접 치환
  const oldStr = `    if (undetermined) {
      // CONDITIONAL: 하드룰 충족 + 결정변수 미확정
      conditional.push(toConditionalFund(result, detailedResult, missingVars, whatToFix, fund));
    } else {
      // MATCHED: 하드룰 + 결정변수 모두 충족
      matched.push(toMatchedFund(result, detailedResult, fund));
    }`;

  const newStr = `    if (undetermined) {
      // CONDITIONAL: 하드룰 충족 + 결정변수 미확정
      // ★ conditional은 matched에 절대 포함 안 됨
      // ★ 점수 계산, 정렬, 순위 산정에서 완전히 제외
      conditional.push(toConditionalFund(result, detailedResult, missingVars, whatToFix, fund));
      continue;
    }

    // MATCHED: 하드룰 + 결정변수 모두 충족
    matched.push(toMatchedFund(result, detailedResult, fund));`;

  if (content.includes(oldStr)) {
    content = content.replace(oldStr, newStr);
    console.log('✅ 대체 방법으로 수정 완료');
  } else {
    console.log('❌ 대체 방법도 실패');
  }
}

fs.writeFileSync(filePath, content, 'utf8');
