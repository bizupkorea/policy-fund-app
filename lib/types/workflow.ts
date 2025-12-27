/**
 * Workflow Report System Types
 * 업무별 리포트 생성 시스템의 타입 정의
 */

import { WorkflowType } from '@/stores/financial-context-store';

/**
 * 워크플로우별 전문가 페르소나
 */
export interface WorkflowPersona {
  /** 전문가 역할 */
  role: string;

  /** 전문 영역 */
  expertise: string;

  /** 작성 톤 & 스타일 */
  tone: string;

  /** 깊이 있게 다뤄야 할 주제들 */
  depthFocus: string[];

  /** 대상 독자 */
  audience: string;

  /** 핵심 목표 */
  objective: string;
}

/**
 * 리포트 섹션
 */
export interface ReportSection {
  /** 섹션 제목 */
  title: string;

  /** 섹션 내용 (마크다운) */
  content: string;

  /** 주요 데이터 포인트 */
  dataPoints: Array<{
    metric: string;
    value: string | number;
    context: string;
    sourceReference: string;
  }>;

  /** 인사이트 */
  insights: string[];

  /** 리스크 */
  risks: string[];

  /** 추천 액션 */
  recommendations: string[];
}

/**
 * 워크플로우 리포트 템플릿
 */
export interface WorkflowTemplate {
  /** 워크플로우 타입 */
  workflowType: WorkflowType;

  /** 리포트 제목 */
  title: string;

  /** 리포트 설명 */
  description: string;

  /** 필수 섹션 정의 */
  sections: Array<{
    title: string;
    requiredDepth: 'light' | 'medium' | 'deep';
    questions: string[];
    minLength: number;
    mustInclude: string[];
    icon?: string;
  }>;

  /** 전체 리포트 최소 길이 (단어 수) */
  totalMinLength: number;

  /** 필수 포함 요소 */
  criticalElements: string[];
}

/**
 * 동적 생성 리포트
 */
export interface DynamicReport {
  /** 워크플로우 타입 */
  perspective: WorkflowType;

  /** 요약 */
  executiveSummary: string;

  /** 핵심 발견사항 */
  keyFindings: string[];

  /** 섹션들 */
  sections: ReportSection[];

  /** 종합 평가 */
  overallAssessment: string;

  /** 신뢰도 점수 (0-1) */
  confidenceScore: number;

  /** 생성 시각 */
  generatedAt: Date;
}

/**
 * 리포트 생성 옵션
 */
export interface ReportGenerationOptions {
  /** 깊이 레벨 */
  depthLevel?: 'quick' | 'standard' | 'premium';

  /** 포커스 영역 */
  focus?: string[];

  /** 최소 길이 오버라이드 */
  minLengthOverride?: number;

  /** 캐시 사용 여부 */
  useCache?: boolean;
}

/**
 * 생성 단계
 */
export type GenerationPhase = 'draft' | 'deepen' | 'validate' | 'finalize';

/**
 * 생성 진행 상태
 */
export interface GenerationProgress {
  phase: GenerationPhase;
  progress: number; // 0-100
  message: string;
}
