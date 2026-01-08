/**
 * lib/policy-fund/last/constants/funding.ts
 *
 * 자금 관련 상수 (슬라이더 단계, 자금 용도 옵션)
 */

export interface FundingStep {
  value: number;
  label: string;
  desc: string;
}

export const FUNDING_STEPS: FundingStep[] = [
  { value: 0.5, label: '1억 미만', desc: '소규모 운전자금' },
  { value: 1, label: '1억', desc: '창업/소규모 자금' },
  { value: 2, label: '2억', desc: '일반 운전자금' },
  { value: 3, label: '3억', desc: '중규모 사업자금' },
  { value: 5, label: '5억', desc: '시설투자 포함' },
  { value: 7, label: '7억', desc: '중규모 시설자금' },
  { value: 10, label: '10억', desc: '대규모 시설투자' },
  { value: 15, label: '10억+', desc: '대규모 복합자금' },
];

export interface FundingPurposeOption {
  id: string;
  label: string;
  desc: string;
  icon: string;
  working: boolean;
  facility: boolean;
}

export const FUNDING_PURPOSE_OPTIONS: FundingPurposeOption[] = [
  {
    id: 'working',
    label: '운전자금',
    desc: '인건비, 원자재, 운영비',
    icon: '💼',
    working: true,
    facility: false,
  },
  {
    id: 'facility',
    label: '시설·설비자금',
    desc: '설비, 장비, 공장 투자',
    icon: '🏭',
    working: false,
    facility: true,
  },
  {
    id: 'mixed',
    label: '혼합 필요',
    desc: '운전 + 시설 모두',
    icon: '🔄',
    working: true,
    facility: true,
  },
];

// 자금 규모 기준
export const LARGE_FUNDING_THRESHOLD = 5; // 억원 - 대규모 자금 기준
