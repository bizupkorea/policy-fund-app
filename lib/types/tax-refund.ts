/**
 * Tax Refund (경정청구) Types
 * 세금 환급 기회 분석 관련 타입 정의
 */

/**
 * 경정청구 카테고리
 */
export type TaxRefundCategory =
  | 'overpaid-tax'           // 초과 납부세
  | 'loss-carryforward'      // 결손금 이월공제
  | 'depreciation-error'     // 감가상각 과소 인정
  | 'bad-debt-writeoff'      // 대손충당금 재조정
  | 'rnd-credit'             // R&D 세액공제
  | 'entertainment-limit'    // 접대비 한도 초과
  | 'export-credit'          // 수출 세액공제
  | 'investment-credit';     // 투자 세액공제

/**
 * 감사 위험도 레벨
 */
export type AuditRiskLevel = 'low' | 'medium' | 'high';

/**
 * 경정청구 기회 항목
 */
export interface TaxRefundOpportunity {
  id: string;
  category: TaxRefundCategory;
  title: string;                    // 항목 제목
  description: string;              // 상세 설명

  // 금액 정보
  currentAmount: number;            // 현재 처리액
  estimatedRefund: number;          // 예상 환급액

  // 신뢰도 및 위험도
  confidence: number;               // 신뢰도 (0-100)
  auditRisk: AuditRiskLevel;        // 세무조사 위험도
  riskFactors: string[];            // 위험 요소

  // 근거 및 요건
  dataEvidence: string;             // 데이터 근거
  legalBasis?: string;              // 법적 근거
  requiredDocuments: string[];      // 필요 서류

  // 신청 정보
  deadline: string;                 // 신청 기한
  processingPeriod: string;         // 예상 처리 기간
}

/**
 * 경정청구 분석 결과
 */
export interface TaxRefundAnalysis {
  // 기회 목록
  opportunities: TaxRefundOpportunity[];

  // 요약 통계
  summary: {
    totalEstimatedRefund: number;   // 총 예상 환급액
    opportunityCount: number;       // 발굴 항목 수
    averageConfidence: number;      // 평균 신뢰도
    overallRisk: AuditRiskLevel;    // 종합 위험도
  };

  // 우선순위 항목 (상위 3개)
  prioritizedItems: TaxRefundOpportunity[];

  // 권장사항
  recommendations: string[];

  // 분석 메타데이터
  metadata: {
    analyzedAt: Date;
    fiscalYear: string;
    dataCompleteness: number;       // 데이터 완성도 (0-100)
  };
}

/**
 * 경정청구 가이드 (LLM 생성)
 */
export interface TaxRefundGuidance {
  itemId: string;
  title: string;
  legalBasis: string;               // 법적 근거 상세
  requiredDocuments: string[];      // 필요 서류 상세
  checklist: string[];              // 체크리스트
  timeline: string;                 // 예상 일정
  pitfalls: string[];               // 주의사항
  tips: string[];                   // 신청 팁
}

/**
 * 경정청구 전체 가이드 응답
 */
export interface TaxRefundGuidanceResponse {
  guidances: TaxRefundGuidance[];
  overallStrategy: string;          // 전체 전략
  priorityOrder: string[];          // 신청 우선순위
}

/**
 * 카테고리별 메타 정보
 */
export const TAX_REFUND_CATEGORY_INFO: Record<TaxRefundCategory, {
  name: string;
  description: string;
  icon: string;
  color: string;
}> = {
  'overpaid-tax': {
    name: '초과 납부세 환급',
    description: '산출세액 대비 초과 납부한 세금 환급',
    icon: '💰',
    color: 'green',
  },
  'loss-carryforward': {
    name: '결손금 이월공제',
    description: '당기 결손금을 향후 소득에서 공제',
    icon: '📉',
    color: 'blue',
  },
  'depreciation-error': {
    name: '감가상각 세액공제',
    description: '과소 인정된 감가상각비 재조정',
    icon: '🏭',
    color: 'purple',
  },
  'bad-debt-writeoff': {
    name: '대손충당금 재조정',
    description: '회수 불능 채권에 대한 대손 처리',
    icon: '📝',
    color: 'orange',
  },
  'rnd-credit': {
    name: 'R&D 세액공제',
    description: '연구개발비에 대한 세액공제',
    icon: '🔬',
    color: 'cyan',
  },
  'entertainment-limit': {
    name: '접대비 한도 재조정',
    description: '접대비 한도 초과분 경정청구',
    icon: '🍽️',
    color: 'yellow',
  },
  'export-credit': {
    name: '수출 세액공제',
    description: '수출 실적에 따른 세액공제',
    icon: '🚢',
    color: 'indigo',
  },
  'investment-credit': {
    name: '투자 세액공제',
    description: '시설 투자에 대한 세액공제',
    icon: '🏗️',
    color: 'teal',
  },
};
