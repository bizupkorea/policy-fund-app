// 정책자금 앱용 스텁 - 실제 기능 필요없음
import { create } from 'zustand';

export interface Session {
  id: string;
  companyName: string;
  fiscalYear: number;
  createdAt: Date;
  lastAccessedAt: Date;
}

interface FinancialContextStore {
  sessions: Session[];
  currentSessionId: string | null;
}

export const useFinancialContext = create<FinancialContextStore>()(() => ({
  sessions: [],
  currentSessionId: null,
}));
