const fs = require('fs');

const filePath = 'E:/biznova/policy-fund-app/lib/policy-fund/matching-engine.ts';
let content = fs.readFileSync(filePath, 'utf8');

const oldFunc = `/**
 * ★ v4: "왜 이 순위인지" 한 문장 설명 생성
 */
function generateRankReason(rank, track, fundName) {
  if (rank === 1) return \`\${fundName}은(는) 귀사의 정책 자격과 목적이 가장 정확히 일치하는 자금입니다.\`;
  if (rank === 2 && track === 'exclusive') return \`\${fundName}은(는) 1순위와 함께 검토할 수 있는 전용 자금입니다.\`;
  if (rank === 2) return \`\${fundName}은(는) 1순위 다음으로 정합성이 높은 자금입니다.\`;
  if (rank === 3) return \`\${fundName}은(는) 전용 자금 집행이 어려울 경우의 정책 목적 유사 대안입니다.\`;
  if (rank === 4) return \`\${fundName}은(는) 직접대출 외 보증·간접자금으로 활용 가능합니다.\`;
  if (rank >= 5) return \`\${fundName}은(는) 참고용으로만 제시되는 자금입니다.\`;
  return '';
}`;

const newFunc = `/**
 * ★ v4: "왜 이 순위인지" 한 문장 설명 생성
 *
 * 순위 역할 정의:
 * - 1순위: 정책 자격·목적 가장 정확히 일치
 * - 2순위: 1순위와 병행 검토 가능한 자금
 * - 3순위: 1·2순위 집행 불가 시 '정책 목적 유사 대안'
 * - 4순위: 직접대출 불가 시 '보증·간접자금'
 * - 5순위: 최악의 경우 참고용으로만 제시
 *
 * 3순위 이후는 "왜 1·2순위가 아닌지"를 전제로 추천됨
 */
function generateRankReason(rank: number, track: string, fundName: string): string {
  if (rank === 1) {
    return \`\${fundName}은(는) 귀사의 정책 자격과 목적이 가장 정확히 일치하는 자금입니다.\`;
  }
  if (rank === 2) {
    if (track === 'exclusive') {
      return \`\${fundName}은(는) 1순위와 함께 검토할 수 있는 전용 자금입니다.\`;
    }
    return \`\${fundName}은(는) 1순위 다음으로 정합성이 높은 자금입니다.\`;
  }
  if (rank === 3) {
    // 1·2순위 집행 불가 시의 '정책 목적 유사 대안'
    return \`1·2순위 집행이 어려울 경우, \${fundName}은(는) 정책 목적이 유사한 대안입니다.\`;
  }
  if (rank === 4) {
    // 직접대출 불가 시의 '보증·간접자금'
    if (track === 'guarantee') {
      return \`직접대출이 불가할 경우, \${fundName}은(는) 보증을 통한 간접 지원 수단입니다.\`;
    }
    return \`상위 순위 집행이 어려울 경우, \${fundName}은(는) 대안으로 검토 가능합니다.\`;
  }
  if (rank >= 5) {
    // 최악의 경우 참고용
    return \`\${fundName}은(는) 다른 옵션이 모두 불가할 경우 참고용으로만 제시됩니다.\`;
  }
  return '';
}`;

if (content.includes(oldFunc)) {
  content = content.replace(oldFunc, newFunc);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('generateRankReason 함수 업데이트 완료!');
} else {
  console.log('패턴을 찾을 수 없습니다.');
}
