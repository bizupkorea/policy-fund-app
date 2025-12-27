/**
 * Session Utility Functions
 *
 * ChatGPT 스타일 세션 히스토리 관리를 위한 헬퍼 함수들
 */

// FinancialContext 인라인 정의
interface FinancialContextMinimal { documentInfo: { companyName: string; fiscalYear: number; }; }

/**
 * 세션 ID 생성
 * 형식: {companyName}_{fiscalYear}_{timestamp}
 */
export function generateSessionId(context: FinancialContextMinimal): string {
  const { companyName, fiscalYear } = context.documentInfo;
  const timestamp = Date.now();

  // 회사명 sanitize (특수문자 제거)
  const sanitizedCompany = companyName.replace(/[^a-zA-Z0-9가-힣]/g, '-');

  return `${sanitizedCompany}_${fiscalYear}_${timestamp}`;
}

/**
 * 세션 표시 이름 생성
 * 형식: "{회사명} ({연도}년)"
 */
export function getSessionDisplayName(companyName: string, fiscalYear: number): string {
  return `${companyName} (${fiscalYear}년)`;
}

/**
 * 상대 시간 포맷팅 (예: "5분 전", "2시간 전", "3일 전")
 */
export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}주 전`;
  if (diffDay < 365) return `${Math.floor(diffDay / 30)}개월 전`;
  return `${Math.floor(diffDay / 365)}년 전`;
}

/**
 * 세션 정렬 (최근 접근 순)
 */
export function sortSessionsByLastAccessed<T extends { lastAccessedAt: Date }>(sessions: T[]): T[] {
  return [...sessions].sort((a, b) => {
    return new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime();
  });
}

/**
 * LRU 정책으로 오래된 세션 제거
 */
export function pruneOldSessions<T extends { id: string; lastAccessedAt: Date }>(
  sessions: T[],
  maxSessions: number = 10
): string[] {
  if (sessions.length <= maxSessions) {
    return [];
  }

  const sorted = sortSessionsByLastAccessed(sessions);
  const toRemove = sorted.slice(maxSessions);

  return toRemove.map(s => s.id);
}
