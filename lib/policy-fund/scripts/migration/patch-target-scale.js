/**
 * PolicyFundKnowledge 인터페이스에 targetScale 필드 추가
 */

const fs = require('fs');

const filePath = 'E:/biznova/policy-fund-app/lib/policy-fund/knowledge-base.ts';
let content = fs.readFileSync(filePath, 'utf8');

// PolicyFundKnowledge에 targetScale 필드 추가
const oldInterface = `  // 자격 조건
  eligibility: EligibilityCriteria;

  // 지원 조건
  terms: SupportTerms;`;

const newInterface = `  // 자격 조건
  eligibility: EligibilityCriteria;

  // ★ 대상 기업규모 (하드컷용)
  // 이 규모에 해당하지 않으면 EXCLUDED
  targetScale?: CompanyScale[];
  // 예: ['micro'] → 소공인만
  // 예: ['small', 'medium'] → 소기업, 중기업
  // 예: undefined → 제한 없음 (기본: 모든 중소기업)

  // 지원 조건
  terms: SupportTerms;`;

if (content.includes(oldInterface)) {
  content = content.replace(oldInterface, newInterface);
  console.log('✅ PolicyFundKnowledge에 targetScale 필드 추가 완료');
} else {
  console.log('⚠️ 패턴 찾을 수 없음');
}

fs.writeFileSync(filePath, content, 'utf8');
