/**
 * lib/policy-fund/last/eligibility/suggestions.ts
 *
 * 해결 가이드 및 제안 함수
 */

import type { EligibilityResult } from '../types';

// ============================================================================
// 타입 정의
// ============================================================================

export interface Suggestion {
  issue: string;
  solution: string;
  alternatives?: string[];
  actionRequired?: boolean;
}

// ============================================================================
// 해결 가이드 생성
// ============================================================================

export function getSuggestions(failedChecks: string[]): Suggestion[] {
  const suggestions: Suggestion[] = [];

  for (const reason of failedChecks) {
    const lowerReason = reason.toLowerCase();

    if (lowerReason.includes('업력') && (lowerReason.includes('초과') || lowerReason.includes('이내'))) {
      suggestions.push({
        issue: reason,
        solution: '창업초기 자금 대신 성장기/도약기 기업 대상 자금을 검토하세요.',
        alternatives: ['중진공 신성장기반자금', '신보 일반보증', '기보 기술보증']
      });
    } else if (lowerReason.includes('업력') && lowerReason.includes('미달')) {
      suggestions.push({
        issue: reason,
        solution: '업력 요건이 낮은 창업 초기기업 대상 자금을 검토하세요.',
        alternatives: ['중진공 혁신창업사업화자금', '소진공 소상공인정책자금']
      });
    } else if (lowerReason.includes('청년') && lowerReason.includes('미충족')) {
      suggestions.push({
        issue: reason,
        solution: '청년전용 자금은 만 39세 이하만 가능합니다. 일반 정책자금을 검토하세요.',
        alternatives: ['중진공 신성장기반자금', '중진공 긴급경영안정자금']
      });
    } else if (lowerReason.includes('매출') && lowerReason.includes('미달')) {
      suggestions.push({
        issue: reason,
        solution: '매출 조건이 낮은 소상공인/소기업 대상 자금을 검토하세요.',
        alternatives: ['소진공 일반경영안정자금', '신용보증재단 일반보증', '지역신보 소기업보증']
      });
    } else if (lowerReason.includes('매출') && lowerReason.includes('초과')) {
      suggestions.push({
        issue: reason,
        solution: '매출 기준이 높은 중기업/중견기업 대상 자금을 검토하세요.',
        alternatives: ['산업은행 시설자금', '기업은행 중기대출']
      });
    } else if (lowerReason.includes('세금') || lowerReason.includes('체납')) {
      suggestions.push({
        issue: reason,
        solution: '체납 세금을 완납한 후 납세증명서를 다시 발급받으세요.',
        actionRequired: true
      });
    } else if (lowerReason.includes('기존') && lowerReason.includes('대출')) {
      suggestions.push({
        issue: reason,
        solution: '기존 정책자금 대출 상환 후 재신청하거나, 한도 내 추가 신청을 검토하세요.',
        alternatives: ['보증 상품으로 전환', '일반 은행 대출']
      });
    } else if (lowerReason.includes('업종') && (lowerReason.includes('제외') || lowerReason.includes('아님'))) {
      suggestions.push({
        issue: reason,
        solution: '업종 제한이 없거나 해당 업종을 지원하는 자금을 검토하세요.',
        alternatives: ['전업종 대상 정책자금 검색']
      });
    } else if (lowerReason.includes('지역') || lowerReason.includes('소재지')) {
      suggestions.push({
        issue: reason,
        solution: '전국 대상 정책자금 또는 해당 지역 지자체 자금을 검토하세요.',
        alternatives: ['중진공 전국 단위 자금', '해당 지역 신용보증재단']
      });
    } else if (lowerReason.includes('인증') && lowerReason.includes('미보유')) {
      suggestions.push({
        issue: reason,
        solution: '필요한 인증을 취득하거나, 인증 요건이 없는 자금을 검토하세요.',
        alternatives: ['인증 취득 지원 사업', '일반 정책자금']
      });
    } else if (lowerReason.includes('직원')) {
      suggestions.push({
        issue: reason,
        solution: '기업 규모에 맞는 자금을 검토하세요.',
        alternatives: ['소상공인 대상 자금', '중소기업 대상 자금']
      });
    } else {
      suggestions.push({
        issue: reason,
        solution: '해당 조건을 충족하거나 다른 정책자금을 검토하세요.'
      });
    }
  }

  return suggestions;
}

// ============================================================================
// 요약 함수
// ============================================================================

export function summarizeEligibility(result: EligibilityResult): string {
  if (result.isEligible) {
    return `✅ 자격 충족 (${result.passedConditions.length}개 조건 통과)`;
  }

  return `❌ 자격 미충족 (탈락 사유 ${result.failedConditions.length}개)\n` +
         result.failedConditions.map((c, i) => `  ${i + 1}. ${c.description}`).join('\n');
}

export function summarizeSuggestions(suggestions: Suggestion[]): string {
  if (suggestions.length === 0) {
    return '해결 가이드 없음';
  }

  return suggestions.map((s, i) => {
    let text = `${i + 1}. ${s.issue}\n   → ${s.solution}`;
    if (s.alternatives && s.alternatives.length > 0) {
      text += `\n   💡 대안: ${s.alternatives.join(', ')}`;
    }
    if (s.actionRequired) {
      text += '\n   ⚠️ 즉시 조치 필요';
    }
    return text;
  }).join('\n\n');
}
