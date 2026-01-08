/**
 * lib/policy-fund/last/constants/locations.ts
 *
 * 지역 목록 상수
 */

export const LOCATIONS = [
  '서울',
  '경기',
  '인천',
  '부산',
  '대구',
  '광주',
  '대전',
  '울산',
  '세종',
  '강원',
  '충북',
  '충남',
  '전북',
  '전남',
  '경북',
  '경남',
  '제주',
] as const;

export type LocationType = (typeof LOCATIONS)[number];

// 수도권/비수도권 구분
export const CAPITAL_REGIONS: LocationType[] = ['서울', '경기', '인천'];

export function isCapitalRegion(location: string): boolean {
  return CAPITAL_REGIONS.includes(location as LocationType);
}
