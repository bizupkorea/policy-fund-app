import { type ClassValue, clsx } from 'clsx';

/**
 * Tailwind CSS 클래스를 병합하는 유틸리티 함수
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
