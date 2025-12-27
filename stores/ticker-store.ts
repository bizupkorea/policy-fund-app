/**
 * 롤링 티커 전역 상태 관리
 *
 * 페이지 이동 시에도 티커 데이터를 유지하기 위한 Zustand 스토어
 * 메모리 기반 - 새로고침 시 다시 fetch
 */

import { create } from 'zustand';
import type { TickerItem } from '@/components/policy-fund/NewsTicker';

interface TickerStore {
  // 상태
  items: TickerItem[];
  lastFetched: number | null;  // timestamp
  isLoading: boolean;

  // 액션
  setItems: (items: TickerItem[]) => void;
  setLoading: (loading: boolean) => void;
  shouldRefetch: () => boolean;  // 5분마다 갱신
  reset: () => void;
}

const REFETCH_INTERVAL = 5 * 60 * 1000; // 5분

export const useTickerStore = create<TickerStore>((set, get) => ({
  // 초기 상태
  items: [],
  lastFetched: null,
  isLoading: false,

  // 액션
  setItems: (items) => set({
    items,
    lastFetched: Date.now(),
    isLoading: false
  }),

  setLoading: (isLoading) => set({ isLoading }),

  shouldRefetch: () => {
    const { lastFetched, isLoading } = get();
    // 이미 로딩 중이면 재요청하지 않음
    if (isLoading) return false;
    // 한번도 fetch 안했으면 fetch
    if (!lastFetched) return true;
    // 5분 지났으면 갱신
    return Date.now() - lastFetched > REFETCH_INTERVAL;
  },

  reset: () => set({
    items: [],
    lastFetched: null,
    isLoading: false
  }),
}));
