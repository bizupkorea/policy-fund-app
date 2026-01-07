/**
 * lib/policy-fund/last/utils/formatters.ts
 *
 * 포맷팅 유틸리티 함수
 * 금액, 날짜 등 데이터 포맷팅
 */

/**
 * 금액을 한글 표기로 변환 (원 → 억원/만원)
 */
export function formatCurrency(value: number): string {
  if (value >= 100000000) {
    const billions = value / 100000000;
    return billions === Math.floor(billions)
      ? `${billions}억원`
      : `${billions.toFixed(1)}억원`;
  }
  if (value >= 10000) {
    return `${Math.floor(value / 10000)}만원`;
  }
  return `${value.toLocaleString()}원`;
}

/**
 * 억원 단위를 원 단위로 변환
 */
export function billionsToWon(billions: number): number {
  return billions * 100000000;
}

/**
 * 원 단위를 억원 단위로 변환
 */
export function wonToBillions(won: number): number {
  return won / 100000000;
}

/**
 * 퍼센트 포맷팅
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * 점수를 레벨로 변환
 */
export function scoreToLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}
