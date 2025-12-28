/**
 * Gemini AI 정책자금 고도화 분석 모듈 (gemini-advisor.ts)
 *
 * 기능:
 * - 2단계 적격 판정 자금에 대한 AI 정성 분석
 * - 합격 가능성, 매칭 사유, 리스크, 전략 제시
 * - JSON 구조화된 응답 강제
 * - API 실패시 Fallback 처리
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { CompanyProfile, PolicyEligibilityCriteria, EligibilityResult } from './eligibility-checker-new';

// ============================================================================
// 타입 정의
// ============================================================================

/**
 * AI 분석 가능성 등급
 */
export type PossibilityLevel = 'High' | 'Medium' | 'Low';

/**
 * AI 분석 결과
 */
export interface AIAnalysisResult {
  possibility: PossibilityLevel;    // 합격 가능성
  score: number;                     // 0-100점
  matchReason: string;               // 매칭 사유 (강점)
  riskFactor: string;                // 리스크 요인 (약점)
  strategy: string;                  // 추천 전략
  additionalTips?: string[];         // 추가 팁
}

/**
 * 정책자금 정보 (AI 분석용)
 */
export interface PolicyFundInfo {
  id: string;
  name: string;                      // 자금명
  agency: string;                    // 수행기관
  category: string;                  // 카테고리 (융자/보증/보조금)
  targetSummary?: string;            // 지원대상 요약
  supportSummary?: string;           // 지원내용 요약
  maxAmount?: string;                // 최대 지원금액
  interestRate?: string;             // 금리
  eligibilityCriteria?: PolicyEligibilityCriteria;  // 자격 조건
}

/**
 * AI 분석 요청
 */
export interface AIAnalysisRequest {
  company: CompanyProfile;
  fund: PolicyFundInfo;
  eligibilityResult?: EligibilityResult;  // 2단계 자격심사 결과
}

/**
 * AI 분석 응답 (Fallback 포함)
 */
export interface AIAnalysisResponse {
  success: boolean;
  result?: AIAnalysisResult;
  fallback?: boolean;                // Fallback 사용 여부
  error?: string;
}

/**
 * Gemini Advisor 설정
 */
export interface GeminiAdvisorConfig {
  apiKey?: string;
  model?: string;                    // 기본: gemini-1.5-flash
  maxRetries?: number;               // 재시도 횟수
  timeout?: number;                  // 타임아웃 (ms)
  temperature?: number;              // 창의성 (0-1)
}

// ============================================================================
// 상수 및 기본값
// ============================================================================

const DEFAULT_CONFIG: Required<GeminiAdvisorConfig> = {
  apiKey: process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || '',
  model: 'gemini-1.5-flash',
  maxRetries: 2,
  timeout: 30000,
  temperature: 0.3,  // 낮은 온도로 일관된 JSON 응답 유도
};

/**
 * System Prompt: 정책자금 전문 컨설턴트
 */
const SYSTEM_PROMPT = `당신은 한국 최고의 정책자금 전문 컨설턴트입니다.
20년 이상의 경력으로 수천 건의 정책자금 신청을 성공적으로 지원한 전문가입니다.

주어진 기업 정보와 정책자금 공고를 분석하여:
1. 합격 가능성을 객관적으로 평가하세요
2. 기업의 강점이 해당 자금 요건과 어떻게 매칭되는지 설명하세요
3. 잠재적 리스크 요인을 파악하세요
4. 구체적인 신청 전략을 제시하세요

중요: 반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.`;

/**
 * JSON 응답 스키마
 */
const JSON_SCHEMA = `{
  "possibility": "High" | "Medium" | "Low",
  "score": 0-100 사이의 정수,
  "matchReason": "기업 강점과 자금 요건의 매칭 포인트 (1-2문장)",
  "riskFactor": "잠재적 리스크 또는 보완이 필요한 부분 (1-2문장)",
  "strategy": "구체적인 신청 전략 및 준비사항 (2-3문장)",
  "additionalTips": ["추가 팁1", "추가 팁2"] (선택적)
}`;

// ============================================================================
// Gemini 클라이언트
// ============================================================================

let geminiClient: GoogleGenerativeAI | null = null;
let geminiModel: GenerativeModel | null = null;

/**
 * Gemini 클라이언트 초기화
 */
function initializeGemini(config: GeminiAdvisorConfig = {}): GenerativeModel | null {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  if (!mergedConfig.apiKey) {
    console.warn('⚠️ Gemini API Key가 설정되지 않았습니다. GOOGLE_AI_API_KEY 환경변수를 확인하세요.');
    return null;
  }

  try {
    geminiClient = new GoogleGenerativeAI(mergedConfig.apiKey);
    geminiModel = geminiClient.getGenerativeModel({
      model: mergedConfig.model,
      generationConfig: {
        temperature: mergedConfig.temperature,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
      },
    });
    return geminiModel;
  } catch (error) {
    console.error('❌ Gemini 초기화 실패:', error);
    return null;
  }
}

// ============================================================================
// 프롬프트 생성
// ============================================================================

/**
 * 분석 프롬프트 생성
 */
function buildAnalysisPrompt(request: AIAnalysisRequest): string {
  const { company, fund, eligibilityResult } = request;

  // 기업 정보 포맷팅
  const companyInfo = `
## 기업 정보
- 기업명: ${company.name}
- 업력: ${getBusinessAge(company.foundedDate)}년 (설립일: ${company.foundedDate})
- 업종: ${company.industryCode}
- 소재지: ${company.location}
- 직원수: ${company.employees}명
- 연매출: ${formatRevenue(company.revenue)}
${company.ceoAge ? `- 대표자 연령: ${company.ceoAge}세` : ''}
${company.certifications ? `- 보유 인증: ${formatCertifications(company.certifications)}` : ''}
${company.hasTaxDelinquency !== undefined ? `- 세금 체납: ${company.hasTaxDelinquency ? '있음' : '없음'}` : ''}
${company.hasExistingLoan !== undefined ? `- 기존 정책자금 대출: ${company.hasExistingLoan ? '있음' : '없음'}` : ''}
`.trim();

  // 정책자금 정보 포맷팅
  const fundInfo = `
## 정책자금 정보
- 자금명: ${fund.name}
- 수행기관: ${fund.agency}
- 카테고리: ${fund.category}
${fund.targetSummary ? `- 지원대상: ${fund.targetSummary}` : ''}
${fund.supportSummary ? `- 지원내용: ${fund.supportSummary}` : ''}
${fund.maxAmount ? `- 최대금액: ${fund.maxAmount}` : ''}
${fund.interestRate ? `- 금리: ${fund.interestRate}` : ''}
`.trim();

  // 자격심사 결과 포맷팅
  let eligibilityInfo = '';
  if (eligibilityResult) {
    eligibilityInfo = `
## 기본 자격심사 결과
- 적격 여부: ${eligibilityResult.isEligible ? '적격' : '부적격'}
- 통과 조건: ${eligibilityResult.passedChecks.join(', ') || '없음'}
${eligibilityResult.warnings.length > 0 ? `- 주의사항: ${eligibilityResult.warnings.join(', ')}` : ''}
`.trim();
  }

  return `${SYSTEM_PROMPT}

${companyInfo}

${fundInfo}

${eligibilityInfo}

위 정보를 바탕으로 해당 기업의 정책자금 합격 가능성을 분석해주세요.

응답 형식 (JSON만 출력):
${JSON_SCHEMA}`;
}

// ============================================================================
// 헬퍼 함수
// ============================================================================

/**
 * 설립일로부터 업력 계산
 */
function getBusinessAge(foundedDate: string): number {
  const founded = new Date(foundedDate);
  const today = new Date();
  if (isNaN(founded.getTime())) return 0;

  let years = today.getFullYear() - founded.getFullYear();
  const monthDiff = today.getMonth() - founded.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < founded.getDate())) {
    years--;
  }
  return Math.max(0, years);
}

/**
 * 매출 포맷팅
 */
function formatRevenue(revenue: number): string {
  if (revenue >= 100000000) {
    return `${(revenue / 100000000).toFixed(1)}억원`;
  } else if (revenue >= 10000) {
    return `${(revenue / 10000).toFixed(0)}만원`;
  }
  return `${revenue}원`;
}

/**
 * 인증 포맷팅
 */
function formatCertifications(certs: CompanyProfile['certifications']): string {
  if (!certs) return '없음';

  const labels: string[] = [];
  if (certs.venture) labels.push('벤처기업');
  if (certs.innobiz) labels.push('이노비즈');
  if (certs.mainbiz) labels.push('메인비즈');

  return labels.length > 0 ? labels.join(', ') : '없음';
}

/**
 * JSON 파싱 (안전하게)
 */
function parseJsonResponse(text: string): AIAnalysisResult | null {
  try {
    // JSON 블록 추출 시도
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    // 필수 필드 검증
    if (!parsed.possibility || typeof parsed.score !== 'number' ||
        !parsed.matchReason || !parsed.riskFactor || !parsed.strategy) {
      return null;
    }

    // 타입 정규화
    return {
      possibility: normalizePossibility(parsed.possibility),
      score: Math.max(0, Math.min(100, Math.round(parsed.score))),
      matchReason: String(parsed.matchReason),
      riskFactor: String(parsed.riskFactor),
      strategy: String(parsed.strategy),
      additionalTips: Array.isArray(parsed.additionalTips)
        ? parsed.additionalTips.map(String)
        : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * 가능성 등급 정규화
 */
function normalizePossibility(value: string): PossibilityLevel {
  const upper = String(value).toUpperCase();
  if (upper.includes('HIGH') || upper.includes('높')) return 'High';
  if (upper.includes('LOW') || upper.includes('낮')) return 'Low';
  return 'Medium';
}

// ============================================================================
// Fallback 분석 (룰 기반)
// ============================================================================

/**
 * Fallback 분석 결과 생성 (AI 실패시)
 */
function generateFallbackResult(request: AIAnalysisRequest): AIAnalysisResult {
  const { company, eligibilityResult } = request;

  // 기본 점수 계산
  let score = 50;
  const reasons: string[] = [];
  const risks: string[] = [];

  // 자격심사 결과 기반 점수 조정
  if (eligibilityResult) {
    if (eligibilityResult.isEligible) {
      score += 20;
      reasons.push('기본 자격 조건을 모두 충족합니다');
    } else {
      score -= 20;
      risks.push('일부 자격 조건을 충족하지 못합니다');
    }

    // 통과 조건 수에 따른 가점
    score += Math.min(eligibilityResult.passedChecks.length * 3, 15);

    // 경고 사항에 따른 감점
    score -= eligibilityResult.warnings.length * 5;
  }

  // 인증 보유 가점
  if (company.certifications) {
    if (company.certifications.venture) {
      score += 10;
      reasons.push('벤처기업 인증 보유');
    }
    if (company.certifications.innobiz || company.certifications.mainbiz) {
      score += 5;
      reasons.push('기술/경영 인증 보유');
    }
  }

  // 체납 감점
  if (company.hasTaxDelinquency) {
    score -= 30;
    risks.push('세금 체납 이력이 있어 불리할 수 있습니다');
  }

  // 점수 범위 제한
  score = Math.max(10, Math.min(90, score));

  // 가능성 등급 결정
  const possibility: PossibilityLevel =
    score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low';

  return {
    possibility,
    score,
    matchReason: reasons.length > 0
      ? reasons.join('. ')
      : '기본 자격 조건을 충족하여 신청 가능합니다',
    riskFactor: risks.length > 0
      ? risks.join('. ')
      : '특별한 리스크 요인이 발견되지 않았습니다',
    strategy: generateFallbackStrategy(company, score),
    additionalTips: [
      '신청 전 최신 공고문을 반드시 확인하세요',
      '필요 서류를 미리 준비하면 심사에 유리합니다',
    ],
  };
}

/**
 * Fallback 전략 생성
 */
function generateFallbackStrategy(company: CompanyProfile, score: number): string {
  const strategies: string[] = [];

  if (score >= 70) {
    strategies.push('합격 가능성이 높습니다.');
    strategies.push('신청서 작성 시 기업의 강점을 명확히 기술하세요.');
  } else if (score >= 40) {
    strategies.push('합격 가능성이 있으나 경쟁이 예상됩니다.');
    strategies.push('차별화 포인트를 강조하는 것이 중요합니다.');
  } else {
    strategies.push('합격 가능성이 낮아 보입니다.');
    strategies.push('다른 정책자금을 함께 검토하시기 바랍니다.');
  }

  if (company.certifications?.venture) {
    strategies.push('벤처기업 인증을 적극 활용하세요.');
  }

  return strategies.join(' ');
}

// ============================================================================
// 메인 분석 함수
// ============================================================================

/**
 * Gemini AI 정책자금 분석
 *
 * @param request 분석 요청 (기업정보, 자금정보)
 * @param config Gemini 설정 (선택)
 * @returns AI 분석 결과 또는 Fallback 결과
 */
export async function analyzeWithGemini(
  request: AIAnalysisRequest,
  config: GeminiAdvisorConfig = {}
): Promise<AIAnalysisResponse> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // Gemini 초기화
  const model = geminiModel || initializeGemini(mergedConfig);

  if (!model) {
    console.warn('⚠️ Gemini 모델 초기화 실패, Fallback 결과 반환');
    return {
      success: true,
      result: generateFallbackResult(request),
      fallback: true,
      error: 'AI 모델 초기화 실패 - 기본 룰 기반 결과 표시',
    };
  }

  // 프롬프트 생성
  const prompt = buildAnalysisPrompt(request);

  // API 호출 (재시도 포함)
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= mergedConfig.maxRetries; attempt++) {
    try {
      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), mergedConfig.timeout)
        ),
      ]);

      const response = result.response;
      const text = response.text();

      // JSON 파싱
      const parsed = parseJsonResponse(text);

      if (parsed) {
        return {
          success: true,
          result: parsed,
          fallback: false,
        };
      }

      // 파싱 실패시 재시도
      console.warn(`⚠️ JSON 파싱 실패 (시도 ${attempt + 1}/${mergedConfig.maxRetries + 1})`);
      lastError = new Error('JSON 파싱 실패');

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`⚠️ API 호출 실패 (시도 ${attempt + 1}/${mergedConfig.maxRetries + 1}):`, lastError.message);

      // 마지막 시도가 아니면 잠시 대기 후 재시도
      if (attempt < mergedConfig.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  // 모든 시도 실패 → Fallback
  console.warn('⚠️ AI 분석 실패, Fallback 결과 반환');
  return {
    success: true,
    result: generateFallbackResult(request),
    fallback: true,
    error: `AI 분석 일시 불가 - ${lastError?.message || '알 수 없는 오류'}`,
  };
}

// ============================================================================
// 배치 분석
// ============================================================================

/**
 * 여러 정책자금 일괄 AI 분석
 *
 * @param company 기업 정보
 * @param funds 정책자금 목록
 * @param config Gemini 설정
 * @returns 자금별 분석 결과 Map
 */
export async function analyzeMultipleFunds(
  company: CompanyProfile,
  funds: PolicyFundInfo[],
  config: GeminiAdvisorConfig = {}
): Promise<Map<string, AIAnalysisResponse>> {
  const results = new Map<string, AIAnalysisResponse>();

  // 순차 처리 (API Rate Limit 고려)
  for (const fund of funds) {
    const response = await analyzeWithGemini({ company, fund }, config);
    results.set(fund.id, response);

    // Rate Limit 방지를 위한 딜레이
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}

/**
 * 적격 자금만 AI 분석 (2단계 결과 활용)
 */
export async function analyzeEligibleFunds(
  company: CompanyProfile,
  fundsWithResults: { fund: PolicyFundInfo; eligibilityResult: EligibilityResult }[],
  config: GeminiAdvisorConfig = {}
): Promise<Map<string, AIAnalysisResponse>> {
  // 적격 자금만 필터링
  const eligibleFunds = fundsWithResults.filter(f => f.eligibilityResult.isEligible);

  const results = new Map<string, AIAnalysisResponse>();

  for (const { fund, eligibilityResult } of eligibleFunds) {
    const response = await analyzeWithGemini(
      { company, fund, eligibilityResult },
      config
    );
    results.set(fund.id, response);

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}

// ============================================================================
// 유틸리티
// ============================================================================

/**
 * 분석 결과 요약 문자열 생성
 */
export function summarizeAnalysis(result: AIAnalysisResult): string {
  const emoji = result.possibility === 'High' ? '🟢' :
                result.possibility === 'Medium' ? '🟡' : '🔴';

  return `
${emoji} 합격 가능성: ${result.possibility} (${result.score}점)

📌 매칭 포인트:
${result.matchReason}

⚠️ 리스크 요인:
${result.riskFactor}

💡 추천 전략:
${result.strategy}
${result.additionalTips ? '\n📋 추가 팁:\n' + result.additionalTips.map(t => `  • ${t}`).join('\n') : ''}
`.trim();
}

/**
 * 가능성 등급 한글 변환
 */
export function getPossibilityLabel(level: PossibilityLevel): string {
  switch (level) {
    case 'High': return '높음';
    case 'Medium': return '보통';
    case 'Low': return '낮음';
  }
}

/**
 * 가능성 등급 색상
 */
export function getPossibilityColor(level: PossibilityLevel): string {
  switch (level) {
    case 'High': return 'green';
    case 'Medium': return 'yellow';
    case 'Low': return 'red';
  }
}

// ============================================================================
// 내보내기
// ============================================================================

export {
  initializeGemini,
  generateFallbackResult,
  buildAnalysisPrompt,
};
