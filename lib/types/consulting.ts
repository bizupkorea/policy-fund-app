/**
 * Consulting Types
 * 컨설팅 관련 공통 타입 정의
 */

/**
 * 컨설팅 타겟 (대본 생성 대상)
 */
export type ConsultingTarget = 'ceo' | 'investor' | 'bank';

/**
 * 타겟별 프로필
 */
export interface TargetProfile {
  name: string;
  description: string;
  tone: string;
  priorities: string[];
  focusAreas: string[];
  keyMetrics: string[];  // 강조할 재무 지표
}

/**
 * 타겟 정보 (UI용)
 */
export interface TargetOption {
  id: ConsultingTarget;
  name: string;
  description: string;
}
