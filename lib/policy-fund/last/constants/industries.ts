/**
 * lib/policy-fund/last/constants/industries.ts
 *
 * 업종 관련 상수 및 타입
 */

import { IndustryType } from '../ui-types';

export interface IndustryOption {
  value: IndustryType;
  label: string;
}

export const INDUSTRY_OPTIONS: IndustryOption[] = [
  { value: 'manufacturing_general', label: '제조업 (일반)' },
  { value: 'manufacturing_root', label: '제조업 (뿌리/소부장)' },
  { value: 'it_software', label: 'IT/정보통신 (SW)' },
  { value: 'it_hardware', label: 'IT/정보통신 (HW)' },
  { value: 'knowledge_service', label: '지식서비스업' },
  { value: 'bio_healthcare', label: '바이오/헬스케어' },
  { value: 'future_mobility', label: '미래차/로봇/드론' },
  { value: 'culture_content', label: '문화/콘텐츠' },
  { value: 'construction_energy', label: '건설/환경/에너지' },
  { value: 'wholesale_retail', label: '도소매/유통' },
  { value: 'tourism_food', label: '관광/숙박/음식' },
  { value: 'other_service', label: '기타 서비스업' },
];

export const INDUSTRY_LABEL_MAP: Record<IndustryType, string> = {
  manufacturing_general: '제조업 (일반)',
  manufacturing_root: '제조업 (뿌리/소부장)',
  it_software: 'IT/정보통신 (SW)',
  it_hardware: 'IT/정보통신 (HW)',
  knowledge_service: '지식서비스업',
  bio_healthcare: '바이오/헬스케어',
  future_mobility: '미래차/로봇/드론',
  culture_content: '문화/콘텐츠',
  construction_energy: '건설/환경/에너지',
  wholesale_retail: '도소매/유통',
  tourism_food: '관광/숙박/음식',
  other_service: '기타 서비스업',
};

// 정부 우대 업종
export const PREFERRED_INDUSTRIES: IndustryType[] = [
  'manufacturing_root',
  'bio_healthcare',
  'future_mobility',
  'it_software',
];

export function isPreferredIndustry(industry: IndustryType): boolean {
  return PREFERRED_INDUSTRIES.includes(industry);
}
