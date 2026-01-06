/**
 * 1. 프로필 타입 확장 (체납/신용문제 상세)
 * 2. checkCreditStatus 함수 추가
 * 3. 정렬 로직 단순화
 */

const fs = require('fs');

const filePath = 'E:/biznova/policy-fund-app/lib/policy-fund/matching-engine.ts';
let content = fs.readFileSync(filePath, 'utf8');

// 1. ExtendedCompanyProfile에 새 필드 추가
const oldProfile = `  hasPastDefault?: boolean;  // 과거 부실/사고 이력 (보증사고, 대출연체 등)
}`;

const newProfile = `  hasPastDefault?: boolean;  // 과거 부실/사고 이력 (보증사고, 대출연체 등)

  // ★ 체납 상세 (신규)
  taxDelinquencyStatus?: 'none' | 'active' | 'resolving' | 'installment';
  // none: 없음, active: 체납 중 (정리 안 됨), resolving: 정리 중, installment: 분납 확정

  // ★ 신용문제 상세 (신규)
  creditIssueStatus?: 'none' | 'current' | 'past_resolved';
  // none: 없음, current: 현재 연체/부실, past_resolved: 과거만 (현재 정상)

  // ★ 재창업 사유 (신규)
  restartReason?: 'covid' | 'recession' | 'partner_default' | 'disaster' | 'illness' | 'policy' | 'other' | 'unknown';
}`;

if (content.includes(oldProfile)) {
  content = content.replace(oldProfile, newProfile);
  console.log('✅ 1. ExtendedCompanyProfile 확장 완료');
} else {
  console.log('⚠️ ExtendedCompanyProfile 패턴 찾을 수 없음');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ 타입 확장 패치 완료!');
