/**
 * Gemini AI 기반 정책자금 어드바이저
 *
 * 룰 기반 자격체크 결과를 바탕으로 AI가 추가 분석 제공:
 * - 실제 승인 가능성 예측
 * - 우선순위 제안
 * - 리스크 분석
 * - 맞춤형 조언
 */

import { EligibilityResult, CompanyProfile } from './eligibility-checker';
import { PolicyFundKnowledge, getFundById, INSTITUTIONS } from './knowledge-base';

// ============================================================================
// 타입 정의
// ============================================================================

/** AI 분석 결과 */
export interface AIAdvisorResult {
  fundId: string;
  fundName: string;

  // AI 판단
  approvalProbability: number; // 0~100 (승인 가능성)
  priorityRank: number; // 1~10 (우선순위)
  riskLevel: 'low' | 'medium' | 'high';

  // AI 분석 내용
  strengthPoints: string[]; // 강점
  weakPoints: string[]; // 약점
  suggestions: string[]; // 개선 제안
  alternativeFunds?: string[]; // 대안 자금

  // 상세 설명
  detailedAnalysis: string;
  actionPlan: string[];
}

/** 전체 포트폴리오 분석 */
export interface PortfolioAnalysis {
  companyName: string;
  totalFundsAnalyzed: number;
  recommendedFunds: AIAdvisorResult[];
  overallStrategy: string;
  priorityActions: string[];
  riskSummary: string;
  estimatedTotalAmount: string;
}

// ============================================================================
// Gemini API 호출
// ============================================================================

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

async function callGeminiAPI(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('⚠️ GEMINI_API_KEY not set. Using fallback analysis.');
    return '';
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) {
    console.error('Gemini API call failed:', error);
    return '';
  }
}

// ============================================================================
// AI 분석 함수
// ============================================================================

/**
 * 단일 정책자금에 대한 AI 분석
 */
export async function analyzeWithAI(
  eligibilityResult: EligibilityResult,
  profile: CompanyProfile
): Promise<AIAdvisorResult> {
  const fund = getFundById(eligibilityResult.fundId);

  if (!fund) {
    return createFallbackResult(eligibilityResult);
  }

  const prompt = buildAnalysisPrompt(eligibilityResult, profile, fund);
  const aiResponse = await callGeminiAPI(prompt);

  if (!aiResponse) {
    return createFallbackResult(eligibilityResult, fund);
  }

  return parseAIResponse(aiResponse, eligibilityResult, fund);
}

/**
 * 여러 정책자금에 대한 포트폴리오 분석
 */
export async function analyzePortfolio(
  eligibilityResults: EligibilityResult[],
  profile: CompanyProfile
): Promise<PortfolioAnalysis> {
  // 상위 5개만 AI 분석 (비용 절감)
  const topResults = eligibilityResults.slice(0, 5);
  const aiResults: AIAdvisorResult[] = [];

  for (const result of topResults) {
    const aiResult = await analyzeWithAI(result, profile);
    aiResults.push(aiResult);
  }

  // 우선순위 순으로 정렬
  aiResults.sort((a, b) => a.priorityRank - b.priorityRank);

  return {
    companyName: profile.companyName,
    totalFundsAnalyzed: eligibilityResults.length,
    recommendedFunds: aiResults,
    overallStrategy: generateOverallStrategy(aiResults, profile),
    priorityActions: generatePriorityActions(aiResults),
    riskSummary: generateRiskSummary(aiResults),
    estimatedTotalAmount: calculateTotalAmount(aiResults),
  };
}

/**
 * 빠른 분석 (AI 없이 룰 기반)
 */
export function quickAnalyze(
  eligibilityResult: EligibilityResult,
  profile: CompanyProfile
): AIAdvisorResult {
  const fund = getFundById(eligibilityResult.fundId);
  return createFallbackResult(eligibilityResult, fund);
}

// ============================================================================
// 프롬프트 빌더
// ============================================================================

function buildAnalysisPrompt(
  result: EligibilityResult,
  profile: CompanyProfile,
  fund: PolicyFundKnowledge
): string {
  const institution = INSTITUTIONS[fund.institutionId];

  return `당신은 한국 중소기업 정책자금 전문 컨설턴트입니다.

## 기업 정보
- 기업명: ${profile.companyName}
- 업력: ${profile.businessAge}년
- 업종: ${profile.industry}${profile.industryDetail ? ` (${profile.industryDetail})` : ''}
- 연매출: ${profile.annualRevenue ? formatCurrency(profile.annualRevenue) : '미입력'}
- 직원수: ${profile.employeeCount ?? '미입력'}명
- 신용등급: ${profile.creditRating ?? '미입력'}등급
- 인증현황: ${profile.certifications?.join(', ') || '없음'}

## 신청 대상 정책자금
- 자금명: ${fund.name}
- 기관: ${institution.name} (${institution.fullName})
- 유형: ${fund.type === 'loan' ? '융자' : fund.type === 'guarantee' ? '보증' : '보조금'}
- 지원금액: ${fund.terms.amount.description}
- 금리: ${fund.terms.interestRate?.description || 'N/A'}

## 자격 체크 결과
- 적합도 점수: ${result.eligibilityScore}점
- 신청 가능 여부: ${result.isEligible ? '가능' : '불가'}
- 충족 조건: ${result.passedConditions.map(c => c.condition).join(', ') || '없음'}
- 미충족 조건: ${result.failedConditions.map(c => c.description).join(', ') || '없음'}

## 분석 요청
다음 항목을 분석해 주세요:

1. **승인 가능성** (0~100%): 실제 심사에서 승인될 확률
2. **우선순위** (1~10): 다른 자금 대비 신청 우선순위 (1이 가장 높음)
3. **리스크 수준**: low/medium/high
4. **강점** (2~3개): 이 자금을 신청할 때의 강점
5. **약점** (2~3개): 심사에서 불리할 수 있는 점
6. **개선 제안** (2~3개): 승인율을 높이기 위한 조언
7. **상세 분석** (100자 내외): 종합적인 판단 근거
8. **실행 계획** (3~4개): 구체적인 다음 단계

JSON 형식으로 응답해 주세요:
{
  "approvalProbability": 75,
  "priorityRank": 2,
  "riskLevel": "medium",
  "strengthPoints": ["...", "..."],
  "weakPoints": ["...", "..."],
  "suggestions": ["...", "..."],
  "detailedAnalysis": "...",
  "actionPlan": ["...", "...", "..."]
}`;
}

// ============================================================================
// AI 응답 파싱
// ============================================================================

function parseAIResponse(
  response: string,
  result: EligibilityResult,
  fund: PolicyFundKnowledge
): AIAdvisorResult {
  try {
    // JSON 부분만 추출
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      fundId: result.fundId,
      fundName: result.fundName,
      approvalProbability: parsed.approvalProbability ?? result.eligibilityScore,
      priorityRank: parsed.priorityRank ?? 5,
      riskLevel: parsed.riskLevel ?? 'medium',
      strengthPoints: parsed.strengthPoints ?? [],
      weakPoints: parsed.weakPoints ?? [],
      suggestions: parsed.suggestions ?? [],
      detailedAnalysis: parsed.detailedAnalysis ?? '',
      actionPlan: parsed.actionPlan ?? [],
    };
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    return createFallbackResult(result, fund);
  }
}

// ============================================================================
// Fallback 분석 (AI 없이)
// ============================================================================

function createFallbackResult(
  result: EligibilityResult,
  fund?: PolicyFundKnowledge
): AIAdvisorResult {
  const score = result.eligibilityScore;

  // 점수 기반 승인 가능성 추정
  let approvalProbability: number;
  let priorityRank: number;
  let riskLevel: 'low' | 'medium' | 'high';

  if (score >= 80) {
    approvalProbability = 80;
    priorityRank = 1;
    riskLevel = 'low';
  } else if (score >= 60) {
    approvalProbability = 60;
    priorityRank = 3;
    riskLevel = 'medium';
  } else if (score >= 50) {
    approvalProbability = 40;
    priorityRank = 5;
    riskLevel = 'medium';
  } else {
    approvalProbability = 20;
    priorityRank = 8;
    riskLevel = 'high';
  }

  // 강점 생성
  const strengthPoints = result.passedConditions.slice(0, 3).map((c) => c.description);

  // 약점 생성
  const weakPoints = result.failedConditions.slice(0, 3).map((c) => c.description);

  // 제안 생성
  const suggestions: string[] = [];
  if (result.failedConditions.length > 0) {
    suggestions.push('미충족 조건 해소 후 재검토');
  }
  if (fund?.practicalInfo?.requiredDocuments) {
    suggestions.push('필요 서류 사전 준비');
  }
  suggestions.push('담당자 사전 상담 권장');

  // 상세 분석
  const detailedAnalysis = result.isEligible
    ? `${result.fundName}은 현재 기업 조건에 적합합니다. 적합도 ${score}점으로 ${strengthPoints.length}개 조건을 충족하고 있습니다.`
    : `현재 ${result.failedConditions.length}개 조건이 미충족 상태입니다. 조건 해소 후 재검토를 권장합니다.`;

  // 실행 계획
  const actionPlan = [
    fund ? `${INSTITUTIONS[fund.institutionId].name} 홈페이지에서 상세 요건 확인` : '해당 기관 홈페이지 확인',
    '필요 서류 목록 작성 및 준비',
    '담당자 유선 상담 (접수 전 사전 확인)',
    '온라인 신청서 작성 및 제출',
  ];

  return {
    fundId: result.fundId,
    fundName: result.fundName,
    approvalProbability,
    priorityRank,
    riskLevel,
    strengthPoints,
    weakPoints,
    suggestions,
    detailedAnalysis,
    actionPlan,
  };
}

// ============================================================================
// 포트폴리오 분석 헬퍼
// ============================================================================

function generateOverallStrategy(
  results: AIAdvisorResult[],
  profile: CompanyProfile
): string {
  const highProbability = results.filter((r) => r.approvalProbability >= 70);
  const lowRisk = results.filter((r) => r.riskLevel === 'low');

  if (highProbability.length >= 2) {
    return `${profile.companyName}은 ${highProbability.length}개 정책자금에 높은 적합도를 보입니다. 우선순위에 따라 순차적으로 신청하시기 바랍니다.`;
  }

  if (lowRisk.length >= 1) {
    return `리스크가 낮은 ${lowRisk[0].fundName}을 우선 신청하고, 결과에 따라 추가 자금을 검토하세요.`;
  }

  return '현재 조건에서는 신중한 접근이 필요합니다. 조건 개선 후 재검토를 권장합니다.';
}

function generatePriorityActions(results: AIAdvisorResult[]): string[] {
  const actions: string[] = [];
  const topResult = results[0];

  if (topResult) {
    actions.push(`1순위: ${topResult.fundName} 신청 준비`);
    if (topResult.actionPlan.length > 0) {
      actions.push(`└ ${topResult.actionPlan[0]}`);
    }
  }

  if (results[1]) {
    actions.push(`2순위: ${results[1].fundName} 검토`);
  }

  actions.push('공통: 재무제표 및 사업계획서 최신화');

  return actions;
}

function generateRiskSummary(results: AIAdvisorResult[]): string {
  const highRisk = results.filter((r) => r.riskLevel === 'high').length;
  const mediumRisk = results.filter((r) => r.riskLevel === 'medium').length;
  const lowRisk = results.filter((r) => r.riskLevel === 'low').length;

  if (highRisk > lowRisk) {
    return '전반적으로 리스크가 높습니다. 조건 개선이 필요합니다.';
  }

  if (lowRisk >= 2) {
    return '안정적인 신청이 가능한 자금이 있습니다.';
  }

  return '중간 수준의 리스크입니다. 서류 준비에 신경 써 주세요.';
}

function calculateTotalAmount(results: AIAdvisorResult[]): string {
  // 실제로는 fund 정보에서 계산해야 하지만, 간략화
  const eligible = results.filter((r) => r.approvalProbability >= 50);

  if (eligible.length === 0) return '해당 없음';
  if (eligible.length === 1) return '최대 1~5억원';
  if (eligible.length <= 3) return '최대 5~15억원';
  return '최대 15억원 이상';
}

// ============================================================================
// 유틸리티
// ============================================================================

function formatCurrency(value: number): string {
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(0)}억원`;
  }
  if (value >= 10000) {
    return `${(value / 10000).toFixed(0)}만원`;
  }
  return `${value}원`;
}

// ============================================================================
// 브리핑 스크립트 생성
// ============================================================================

/**
 * 고객 상담용 브리핑 스크립트 생성
 */
export function generateBriefingScript(
  portfolio: PortfolioAnalysis,
  profile: CompanyProfile
): string {
  const topFunds = portfolio.recommendedFunds.slice(0, 3);

  let script = `## ${profile.companyName} 대표님 상담 브리핑

### 1. 진단 결과 요약
- 분석 대상: ${portfolio.totalFundsAnalyzed}개 정책자금
- 추천 자금: ${portfolio.recommendedFunds.length}개
- 예상 지원 규모: ${portfolio.estimatedTotalAmount}

### 2. 추천 정책자금 TOP 3
`;

  topFunds.forEach((fund, idx) => {
    script += `
**${idx + 1}. ${fund.fundName}**
- 승인 가능성: ${fund.approvalProbability}%
- 리스크: ${fund.riskLevel === 'low' ? '낮음' : fund.riskLevel === 'medium' ? '보통' : '높음'}
- 강점: ${fund.strengthPoints.join(', ')}
- 주의: ${fund.weakPoints.join(', ') || '특이사항 없음'}
`;
  });

  script += `
### 3. 전략 제안
${portfolio.overallStrategy}

### 4. 즉시 실행 사항
${portfolio.priorityActions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

### 5. 리스크 요약
${portfolio.riskSummary}
`;

  return script;
}
