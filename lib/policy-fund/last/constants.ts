/**
 * lib/policy-fund/last/constants.ts
 *
 * /test 페이지 전용 UI 상수 정의
 * 업종, 지역, 기관 관련 상수
 */

import type { InstitutionId } from './types';

// ============================================================================
// 업종 옵션
// ============================================================================

export interface IndustryOption {
  value: string;
  label: string;
  desc: string;
}

export const INDUSTRY_OPTIONS: IndustryOption[] = [
  { value: 'manufacturing_general', label: '제조업 (일반)', desc: '식음료, 의류, 가구 등' },
  { value: 'manufacturing_root', label: '제조업 (뿌리/소부장)', desc: '금형, 주조, 용접, 소재, 부품, 장비 - 정부 우대' },
  { value: 'it_software', label: 'IT/정보통신 (SW)', desc: '소프트웨어, 앱, SI, 플랫폼' },
  { value: 'it_hardware', label: 'IT/정보통신 (HW)', desc: '반도체, 통신장비, 전자부품' },
  { value: 'knowledge_service', label: '지식서비스업', desc: '디자인, 컨설팅, R&D, 광고' },
  { value: 'bio_healthcare', label: '바이오/헬스케어', desc: '의약품, 의료기기, 화장품, 건기식' },
  { value: 'future_mobility', label: '미래차/로봇/드론', desc: '자율주행, 전기차부품, 로봇' },
  { value: 'culture_content', label: '문화/콘텐츠', desc: '게임, 영상, 웹툰, 출판' },
  { value: 'construction_energy', label: '건설/환경/에너지', desc: '전문건설, 태양광, 친환경' },
  { value: 'wholesale_retail', label: '도소매/유통', desc: '일반 도소매, 전자상거래' },
  { value: 'tourism_food', label: '관광/숙박/음식', desc: '숙박업, 음식점, 여행업' },
  { value: 'other_service', label: '기타 서비스업', desc: '그 외 서비스' },
];

// ============================================================================
// 지역 옵션
// ============================================================================

export const REGION_OPTIONS: string[] = [
  '서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종',
  '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

// ============================================================================
// 기관별 색상 및 이름
// ============================================================================

export interface InstitutionColorStyle {
  bg: string;
  text: string;
}

export const INSTITUTION_COLORS: Record<InstitutionId, InstitutionColorStyle> = {
  kosmes: { bg: 'bg-blue-100', text: 'text-blue-800' },
  kodit: { bg: 'bg-green-100', text: 'text-green-800' },
  kibo: { bg: 'bg-purple-100', text: 'text-purple-800' },
  semas: { bg: 'bg-orange-100', text: 'text-orange-800' },
  seoul_credit: { bg: 'bg-red-100', text: 'text-red-800' },
  gyeonggi_credit: { bg: 'bg-teal-100', text: 'text-teal-800' },
  mss: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  motie: { bg: 'bg-cyan-100', text: 'text-cyan-800' },
  keiti: { bg: 'bg-lime-100', text: 'text-lime-800' },
};

export const INSTITUTION_NAMES: Record<InstitutionId, string> = {
  kosmes: '중진공',
  kodit: '신보',
  kibo: '기보',
  semas: '소진공',
  seoul_credit: '서울신보',
  gyeonggi_credit: '경기신보',
  mss: '중기부',
  motie: '산업부',
  keiti: '환경산업기술원',
};
