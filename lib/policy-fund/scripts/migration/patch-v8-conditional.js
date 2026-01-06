const fs = require('fs');

const filePath = 'E:/biznova/policy-fund-app/lib/policy-fund/matching-engine.ts';
let content = fs.readFileSync(filePath, 'utf8');

// conditional 분류 로직에 명확한 주석 추가 및 continue 추가
const oldConditionalLogic = `    if (undetermined) {
      // CONDITIONAL: 하드룰 충족 + 결정변수 미확정
      conditional.push(toConditionalFund(result, detailedResult, missingVars, whatToFix, fund));
    } else {
      // MATCHED: 하드룰 + 결정변수 모두 충족
      matched.push(toMatchedFund(result, detailedResult, fund));
    }`;

const newConditionalLogic = `    if (undetermined) {
      // CONDITIONAL: 하드룰 충족 + 결정변수 미확정
      // ★ 중요: conditional은 matched에 절대 포함 안 됨
      // ★ 점수 계산, 정렬, 순위 산정에서 완전히 제외
      conditional.push(toConditionalFund(result, detailedResult, missingVars, whatToFix, fund));
      continue; // matched로 넘어가지 않음
    }

    // MATCHED: 하드룰 + 결정변수 모두 충족
    matched.push(toMatchedFund(result, detailedResult, fund));`;

if (content.includes(oldConditionalLogic)) {
  content = content.replace(oldConditionalLogic, newConditionalLogic);
  console.log('✅ conditional 분리 로직 강화 (continue 추가)');
} else {
  console.log('⚠️ conditional 로직 패턴 찾을 수 없음');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ conditional 분리 규칙 패치 완료!');
