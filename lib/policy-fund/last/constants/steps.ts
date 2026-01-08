/**
 * lib/policy-fund/last/constants/steps.ts
 *
 * Step UI 단계 정보 상수
 */

export interface StepInfo {
  title: string;
  description: string;
  icon: string;
  guidance?: string;
}

export const STEP_INFO: StepInfo[] = [
  {
    title: '기본 정보 입력',
    description: '기업과 대표자의 기본 정보를 입력해 주세요',
    icon: '📋',
  },
  {
    title: '필요 자금 설정',
    description: '필요한 자금 규모와 용도를 선택해 주세요',
    icon: '💰',
  },
  {
    title: '특수 조건 확인',
    description: '정책자금 매칭 정확도를 높이는 항목입니다',
    icon: '🎯',
    guidance: '해당 사항이 없으면 건너뛰어도 됩니다',
  },
  {
    title: 'AI 분석 준비 완료',
    description: '입력하신 정보를 바탕으로 정책자금 가능성을 분석합니다',
    icon: '✅',
  },
  {
    title: 'AI 매칭 결과',
    description: '기업에 적합한 정책자금 매칭 결과입니다',
    icon: '🎯',
  },
];

export const STEP_LABELS = ['기본정보', '필요자금', '특수조건', '최종확인', 'AI 매칭결과'];

export const TOTAL_STEPS = 5;
