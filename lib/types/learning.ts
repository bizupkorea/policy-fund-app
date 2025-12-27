/**
 * 학습센터 타입 정의
 * 재무 지식 학습 콘텐츠 및 진행 상태 관련 타입
 */

/**
 * 학습 카테고리
 */
export type LearningCategory =
  | 'fundamentals' // 재무제표 기초
  | 'accounts' // 계정과목 사전
  | 'ratios' // 재무비율 분석
  | 'risks' // 리스크 평가
  | 'benchmarks' // 업종별 벤치마크
  | 'consulting'; // 컨설팅 실무

/**
 * 난이도
 */
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

/**
 * 학습 콘텐츠 기본 인터페이스
 */
export interface LearningContent {
  id: string;
  category: LearningCategory;
  title: string;
  description: string;
  content: string; // Markdown 형식
  relatedLinks?: string[]; // 관련 페이지 URL
  difficulty: DifficultyLevel;
  estimatedTime: number; // 분 단위
  tags?: string[];
}

/**
 * 계정과목 학습 콘텐츠
 */
export interface AccountLearningContent {
  id: string;
  nameKo: string; // 한글 이름
  nameEn?: string; // 영문 이름
  category: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  definition: string; // 정의 (1-2문장)
  location: string; // 재무제표 위치
  importance: string; // 왜 중요한가
  warningSign?: string; // 주의해야 할 시점
  relatedRatios?: string[]; // 관련 비율 ID 목록
  relatedRules?: string[]; // 관련 리스크 규칙 ID 목록
  example?: string; // 예시
  content: string; // 상세 설명 (Markdown)
  difficulty: DifficultyLevel;
  estimatedTime: number;
}

/**
 * 재무비율 학습 콘텐츠
 */
export interface RatioLearningContent {
  id: string;
  nameKo: string;
  nameEn?: string;
  group: 'liquidity' | 'leverage' | 'profitability' | 'activity' | 'special';
  formula: string; // 계산 공식
  unit: string; // 단위 (%, 배, 일 등)
  benchmarks?: Record<string, number>; // 업종별 평균값
  healthyCriteria?: {
    green: number; // 양호 기준
    yellow: number; // 주의 기준
    red: number; // 위험 기준
  };
  interpretation: string; // 해석 가이드 (Markdown)
  improvementActions?: string[]; // 개선 방법
  relatedRules?: string[]; // 관련 리스크 규칙
  // Phase 1 개선: 실전 적용 필드
  learningObjectives?: string[]; // 학습 목표 ("이 페이지를 다 읽으면 ~할 수 있다")
  howToUse?: {
    scenario: string; // 실전 상황 설명
    badResponse: string; // 나쁜 답변 예시
    goodResponse: string; // 좋은 답변 예시 (실전 대본)
    actionSteps: string[]; // 단계별 실행 방법
  };
  practiceQuestions?: Array<{
    question: string; // 연습 문제
    options: string[]; // 4지선다 보기 (4개)
    correctAnswer: number; // 정답 인덱스 (0-3)
    explanation: string; // 해설
    hint?: string; // 힌트 (선택)
    timeLimit?: number; // 제한시간 (초, 기본 60초)
  }>;
  content: string; // 상세 설명 (Markdown)
  difficulty: DifficultyLevel;
  estimatedTime: number;
}

/**
 * 재무제표 기초 콘텐츠
 */
export interface FundamentalsContent {
  id: string;
  title: string;
  description: string;
  content: string; // Markdown
  keyPoints: string[]; // 핵심 포인트
  practicalTips: string[]; // 실무 팁
  difficulty: DifficultyLevel;
  estimatedTime: number;
}

/**
 * 카테고리 메타데이터
 */
export interface CategoryMetadata {
  id: LearningCategory;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind color class
  itemCount: number; // 학습 항목 수
  totalTime: number; // 총 학습 시간 (분)
  path: string; // 라우트 경로
}

/**
 * 리스크 평가 학습 콘텐츠
 */
export interface RiskLearningContent {
  id: string; // 리스크 규칙 ID (예: current_ratio, debt_ratio)
  nameKo: string; // 한글 이름
  nameEn?: string; // 영문 이름
  tier: 'tax' | 'accounting' | 'finance' | 'legal'; // 주요 Tier
  riskLevel: 'high' | 'medium' | 'low'; // 전체 리스크 레벨
  definition: string; // 규칙 정의 (1-2문장)
  trigger: string; // 발동 조건 (예: "유동비율 < 150%")
  whyDangerous: string; // 왜 위험한가
  fourTierRisks: {
    tax: string[]; // 세무 리스크 요약
    accounting: string[]; // 회계 리스크 요약
    finance: string[]; // 금융 리스크 요약
    legal: string[]; // 법적 리스크 요약
  };
  preventionActions: string[]; // 예방 조치
  resolutionSteps: string[]; // 해결 단계
  relatedAccounts?: string[]; // 관련 계정과목
  relatedRatios?: string[]; // 관련 비율
  realWorldExample: string; // 실제 사례 (Markdown)
  content: string; // 상세 설명 (Markdown)
  difficulty: DifficultyLevel;
  estimatedTime: number;
}

/**
 * 업종별 벤치마크 학습 콘텐츠
 */
export interface IndustryBenchmarkContent {
  id: string; // 업종 ID (예: manufacturing, wholesale-retail)
  nameKo: string; // 한글 이름
  nameEn: string; // 영문 이름
  icon: string; // 아이콘 이름
  description: string; // 업종 설명 (1-2문장)
  characteristics: string[]; // 업종 특성
  benchmarks: {
    currentRatio: number; // 유동비율 (%)
    debtRatio: number; // 부채비율 (%)
    operatingMargin: number; // 영업이익률 (%)
    grossMargin: number; // 매출총이익률 (%)
    roe: number; // 자기자본이익률 ROE (%)
    dso: number; // 매출채권회전일수 (일)
    dio: number; // 재고회전일수 (일)
  };
  warnings: string[]; // 주의사항
  riskPoints: string[]; // 리스크 포인트
  improvementTips: string[]; // 개선 포인트
  content: string; // 상세 설명 (Markdown)
  difficulty: DifficultyLevel;
  estimatedTime: number;
}

/**
 * 컨설팅 실무 학습 콘텐츠
 */
export interface ConsultingContent {
  id: string; // 워크플로우 ID (예: audit-response, management-interview)
  nameKo: string; // 한글 이름
  nameEn: string; // 영문 이름
  icon: string; // 아이콘 이름
  description: string; // 워크플로우 설명 (1-2문장)
  scenario: string; // 실전 시나리오 설명
  objectives: string[]; // 학습 목표 (3-4개)
  keyPoints: string[]; // 핵심 포인트 (5-7개)
  stepByStepGuide: Array<{
    step: number;
    title: string;
    description: string;
    actionItems: string[];
  }>; // 단계별 가이드
  commonMistakes: string[]; // 흔한 실수 (3-4개)
  successTips: string[]; // 성공 팁 (3-4개)
  realWorldExample: string; // 실제 사례 (Markdown)
  content: string; // 상세 설명 (Markdown)
  difficulty: DifficultyLevel;
  estimatedTime: number;
}

/**
 * 학습 경로 (입문/초급/중급)
 */
export interface LearningPath {
  id: 'beginner-path' | 'intermediate-path' | 'advanced-path';
  title: string;
  description: string;
  duration: number; // 총 소요 시간 (시간 단위)
  steps: Array<{
    category: LearningCategory;
    title: string;
    contentIds: string[]; // 학습할 콘텐츠 ID 목록
    estimatedTime: number;
  }>;
}
