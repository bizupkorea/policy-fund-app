/**
 * 정책자금 문서 분석기
 * Gemini AI를 사용하여 홈택스 PDF에서 기업 정보 추출
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ExtractedCompanyData, PolicyDocumentCategory } from './types';

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * Exponential Backoff 재시도 로직
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const isLastAttempt = i === maxRetries - 1;
      const errorMessage = error instanceof Error ? error.message : String(error);

      const isRetryable =
        errorMessage.includes('503') ||
        errorMessage.includes('overloaded') ||
        errorMessage.includes('ECONNRESET') ||
        errorMessage.includes('timeout');

      if (isLastAttempt || !isRetryable) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, i);
      console.log(`⏳ API 재시도 ${i + 1}/${maxRetries} (${delay}ms 후)...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

// ============================================================================
// Gemini API 초기화
// ============================================================================

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not found in environment variables');
  }
  return new GoogleGenerativeAI(apiKey);
}

// ============================================================================
// 문서별 추출 프롬프트
// ============================================================================

const EXTRACTION_PROMPTS: Record<PolicyDocumentCategory, string> = {
  financialStatement: `당신은 재무제표 분석 전문가입니다.
이 표준재무제표증명 PDF에서 다음 정보를 추출하세요:

1. 회사명 (companyName)
2. 사업자등록번호 (businessNumber)
3. 회계기간/결산일 (fiscalYear)
4. 매출액 (annualRevenue) - 원 단위, 숫자만
5. 자산총계 (totalAssets) - 원 단위, 숫자만
6. 부채총계 (totalLiabilities) - 원 단위, 숫자만
7. 자본총계 (equity) - 원 단위, 숫자만
8. 영업이익 (operatingProfit) - 원 단위, 숫자만

부채비율 = (부채총계 / 자본총계) × 100 으로 계산해서 debtRatio에 넣으세요.

JSON 형식으로 응답:
{
  "companyName": "회사명",
  "businessNumber": "000-00-00000",
  "annualRevenue": 숫자,
  "totalAssets": 숫자,
  "totalLiabilities": 숫자,
  "equity": 숫자,
  "debtRatio": 숫자,
  "operatingProfit": 숫자,
  "confidence": 0.0-1.0
}`,

  vatCertificate: `당신은 세무 서류 분석 전문가입니다.
이 부가가치세과세표준증명 PDF에서 다음 정보를 추출하세요:

1. 회사명/상호 (companyName)
2. 사업자등록번호 (businessNumber)
3. 과세표준 합계/매출액 (annualRevenue) - 가장 최근 연도, 원 단위, 숫자만

JSON 형식으로 응답:
{
  "companyName": "회사명",
  "businessNumber": "000-00-00000",
  "annualRevenue": 숫자,
  "confidence": 0.0-1.0
}`,

  businessRegistration: `당신은 사업자등록증 분석 전문가입니다.
이 사업자등록증명 PDF에서 다음 정보를 추출하세요:

1. 상호/법인명 (companyName)
2. 사업자등록번호 (businessNumber)
3. 개업일/설립일 (establishedDate) - YYYY-MM-DD 형식
4. 업태 (industry)
5. 업종코드 (industryCode) - 있는 경우
6. 사업장 소재지 (address)
7. 소재지에서 시/도만 추출 (location) - 예: "서울", "경기", "부산"

JSON 형식으로 응답:
{
  "companyName": "회사명",
  "businessNumber": "000-00-00000",
  "establishedDate": "YYYY-MM-DD",
  "industry": "업태",
  "industryCode": "코드",
  "address": "전체주소",
  "location": "시/도",
  "confidence": 0.0-1.0
}`,

  taxClearance: `당신은 납세증명서 분석 전문가입니다.
이 납세증명서 PDF에서 다음 정보를 추출하세요:

1. 상호/법인명 (companyName)
2. 사업자등록번호 (businessNumber)
3. 체납 여부 (hasTaxDelinquency) - "체납액 없음"이면 false, 체납이 있으면 true

JSON 형식으로 응답:
{
  "companyName": "회사명",
  "businessNumber": "000-00-00000",
  "hasTaxDelinquency": true/false,
  "confidence": 0.0-1.0
}`,

  insuranceList: `당신은 4대보험 서류 분석 전문가입니다.
이 4대보험가입자명부 PDF에서 다음 정보를 추출하세요:

1. 사업장명 (companyName)
2. 사업자등록번호 (businessNumber)
3. 총 가입자 수/직원 수 (employeeCount) - 숫자만
4. 청년 직원 수 (youthEmployeeCount) - 34세 이하, 파악 가능한 경우만

JSON 형식으로 응답:
{
  "companyName": "회사명",
  "businessNumber": "000-00-00000",
  "employeeCount": 숫자,
  "youthEmployeeCount": 숫자 또는 null,
  "confidence": 0.0-1.0
}`,
};

// ============================================================================
// 단일 문서 분석
// ============================================================================

/**
 * 단일 PDF 문서에서 정보 추출
 */
export async function extractFromDocument(
  fileBase64: string,
  category: PolicyDocumentCategory
): Promise<Partial<ExtractedCompanyData> & { confidence: number }> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.0,
      maxOutputTokens: 2000,
      responseMimeType: 'application/json',
    },
  });

  const prompt = EXTRACTION_PROMPTS[category];

  try {
    const result = await retryWithBackoff(
      () => model.generateContent([
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: fileBase64,
          },
        },
        { text: prompt },
      ]),
      3,
      1000
    );

    let responseText = result.response.text();

    if (!responseText || responseText.trim() === '') {
      console.error(`❌ Empty response for ${category}`);
      return { confidence: 0 };
    }

    // 마크다운 코드 블록 제거
    if (responseText.includes('```json')) {
      responseText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    } else if (responseText.includes('```')) {
      responseText = responseText.replace(/```\s*/g, '');
    }

    responseText = responseText.trim();

    const parsed = JSON.parse(responseText);
    console.log(`✅ ${category} 추출 완료:`, parsed);

    return {
      ...parsed,
      extractedAt: new Date(),
    };
  } catch (error) {
    console.error(`❌ ${category} 추출 실패:`, error);
    return { confidence: 0 };
  }
}

// ============================================================================
// 복수 문서 병합 분석
// ============================================================================

/**
 * 여러 PDF에서 추출한 데이터를 하나로 병합
 */
export async function analyzeAllDocuments(
  documents: Array<{ base64: string; category: PolicyDocumentCategory }>
): Promise<ExtractedCompanyData> {
  console.log(`🔍 ${documents.length}개 문서 분석 시작...`);

  // 병렬로 모든 문서 분석
  const results = await Promise.all(
    documents.map(doc => extractFromDocument(doc.base64, doc.category))
  );

  // 결과 병합 (신뢰도 높은 값 우선)
  const merged: Partial<ExtractedCompanyData> = {
    extractedAt: new Date(),
    confidence: 0,
    warnings: [],
  };

  let totalConfidence = 0;
  let confidenceCount = 0;

  for (const result of results) {
    if (result.confidence > 0) {
      totalConfidence += result.confidence;
      confidenceCount++;

      // 각 필드별로 병합 (기존 값이 없거나 새 값의 신뢰도가 높으면 덮어씀)
      for (const [key, value] of Object.entries(result)) {
        if (key === 'confidence' || key === 'extractedAt') continue;
        if (value !== null && value !== undefined && value !== '') {
          (merged as Record<string, unknown>)[key] = value;
        }
      }
    }
  }

  merged.confidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;

  // 필수 필드 검증
  const requiredFields = ['companyName', 'businessNumber'];
  const missingFields = requiredFields.filter(
    field => !(merged as Record<string, unknown>)[field]
  );

  if (missingFields.length > 0) {
    merged.warnings = merged.warnings || [];
    merged.warnings.push(`필수 정보 누락: ${missingFields.join(', ')}`);
  }

  console.log('✅ 문서 분석 완료:', merged);

  return merged as ExtractedCompanyData;
}

// ============================================================================
// 통합 분석 (단일 호출용)
// ============================================================================

/**
 * 여러 PDF를 한 번에 분석하는 통합 함수
 * 모든 PDF를 하나의 프롬프트로 분석 (API 호출 최소화)
 */
export async function analyzeDocumentsUnified(
  documents: Array<{ base64: string; fileName: string }>
): Promise<ExtractedCompanyData> {
  if (documents.length === 0) {
    throw new Error('분석할 문서가 없습니다.');
  }

  console.log(`🔍 ${documents.length}개 문서 통합 분석 시작...`);

  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.0,
      maxOutputTokens: 4000,
      responseMimeType: 'application/json',
    },
  });

  const prompt = `당신은 기업 재무/세무 서류 분석 전문가입니다.

업로드된 홈택스 서류들에서 정책자금 신청에 필요한 기업 정보를 추출하세요.
여러 서류가 있으면 정보를 종합하여 가장 정확한 값을 선택하세요.

추출할 정보:
1. companyName: 회사명/상호
2. businessNumber: 사업자등록번호 (000-00-00000 형식)
3. establishedDate: 설립일/개업일 (YYYY-MM-DD 형식)
4. industry: 업종/업태
5. location: 소재지 (시/도만, 예: "서울", "경기", "부산")
6. annualRevenue: 연매출액 (원 단위 숫자)
7. totalAssets: 자산총계 (원 단위 숫자)
8. totalLiabilities: 부채총계 (원 단위 숫자)
9. debtRatio: 부채비율 (%)
10. employeeCount: 직원수 (숫자)
11. hasTaxDelinquency: 체납여부 (true/false)

없는 정보는 null로 표시하세요.

JSON 응답:
{
  "companyName": "회사명",
  "businessNumber": "000-00-00000",
  "establishedDate": "YYYY-MM-DD",
  "industry": "업종",
  "location": "시/도",
  "annualRevenue": 숫자 또는 null,
  "totalAssets": 숫자 또는 null,
  "totalLiabilities": 숫자 또는 null,
  "debtRatio": 숫자 또는 null,
  "employeeCount": 숫자 또는 null,
  "hasTaxDelinquency": true/false 또는 null,
  "confidence": 0.0-1.0,
  "warnings": ["경고 메시지"]
}`;

  try {
    // 모든 PDF를 content에 추가
    const contentParts: Array<{ inlineData: { mimeType: string; data: string } } | { text: string }> = [];

    for (const doc of documents) {
      contentParts.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: doc.base64,
        },
      });
    }

    contentParts.push({ text: prompt });

    const result = await retryWithBackoff(
      () => model.generateContent(contentParts),
      3,
      1000
    );

    let responseText = result.response.text();

    if (!responseText || responseText.trim() === '') {
      throw new Error('Gemini API returned empty response');
    }

    // 마크다운 코드 블록 제거
    if (responseText.includes('```json')) {
      responseText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    } else if (responseText.includes('```')) {
      responseText = responseText.replace(/```\s*/g, '');
    }

    responseText = responseText.trim();

    const parsed = JSON.parse(responseText);

    console.log('✅ 통합 분석 완료:', {
      companyName: parsed.companyName,
      businessNumber: parsed.businessNumber,
      confidence: parsed.confidence,
    });

    return {
      ...parsed,
      extractedAt: new Date(),
    } as ExtractedCompanyData;

  } catch (error) {
    console.error('❌ 통합 분석 실패:', error);

    // 기본값 반환
    return {
      companyName: '',
      businessNumber: '',
      establishedDate: '',
      industry: '',
      location: '',
      extractedAt: new Date(),
      confidence: 0,
      warnings: ['문서 분석에 실패했습니다. 수동으로 정보를 입력해주세요.'],
    };
  }
}
