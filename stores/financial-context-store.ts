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
  sessions: Map<string, Session>;
  currentSessionId: string | null;
  switchSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
}

export const useFinancialContext = create<FinancialContextStore>()((set) => ({
  sessions: new Map(),
  currentSessionId: null,
  switchSession: () => {},
  deleteSession: () => {},
}));
