/**
 * ExtendedCompanyProfile에 체납/신용 상세 필드 추가
 */

const fs = require('fs');

const filePath = 'E:/biznova/policy-fund-app/lib/policy-fund/matching-engine.ts';
let content = fs.readFileSync(filePath, 'utf8');

const oldPattern = `  hasPastDefault?: boolean;  // 과거 부실/사고 이력 (보증사고, 대출연체 등)
}

/**
 * 상세 적합도 점수 계산 (파싱된 조건 기반)`;

const newPattern = `  hasPastDefault?: boolean;  // 과거 부실/사고 이력 (보증사고, 대출연체 등)

  // ★ 체납 상세 (신규)
  taxDelinquencyStatus?: 'none' | 'active' | 'resolving' | 'installment';
  // none: 없음, active: 체납 중 (정리 안 됨), resolving: 정리 중, installment: 분납 확정

  // ★ 신용문제 상세 (신규)
  creditIssueStatus?: 'none' | 'current' | 'past_resolved';
  // none: 없음, current: 현재 연체/부실, past_resolved: 과거만 (현재 정상)

  // ★ 재창업 사유 (신규)
  restartReason?: 'covid' | 'recession' | 'partner_default' | 'disaster' | 'illness' | 'policy' | 'other' | 'unknown';
}

/**
 * 상세 적합도 점수 계산 (파싱된 조건 기반)`;

if (content.includes(oldPattern)) {
  content = content.replace(oldPattern, newPattern);
  console.log('✅ ExtendedCompanyProfile 체납/신용 필드 추가 완료');
} else {
  console.log('⚠️ 패턴 찾을 수 없음');
}

fs.writeFileSync(filePath, content, 'utf8');
