/**
 * Policy Fund Matching API
 *
 * 기업 프로필 기반 정책자금 매칭 API
 *
 * POST /api/policy-fund/match
 * - 룰 기반 자격 체크 + AI 분석 결과 반환
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  CompanyProfile,
  checkAllFundsEligibility,
  getEligibleFunds,
  EligibilityResult,
} from '@/lib/policy-fund/eligibility-checker';
import {
  analyzeWithAI,
  analyzePortfolio,
  quickAnalyze,
  AIAdvisorResult,
  PortfolioAnalysis,
  generateBriefingScript,
} from '@/lib/policy-fund/gemini-advisor';
import { IndustryCategory } from '@/lib/policy-fund/knowledge-base';

interface MatchRequest {
  profile: CompanyProfile;
  options?: {
    useAI?: boolean; // AI 분석 사용 여부 (기본: false - 빠른 응답)
    topN?: number; // 상위 N개만 반환 (기본: 10)
    minScore?: number; // 최소 점수 필터 (기본: 30)
    generateBriefing?: boolean; // 브리핑 스크립트 생성 여부
  };
}

interface MatchResponse {
  success: boolean;
  data?: {
    eligibilityResults: EligibilityResult[];
    aiAnalysis?: AIAdvisorResult[];
    portfolioAnalysis?: PortfolioAnalysis;
    briefingScript?: string;
    summary: {
      totalAnalyzed: number;
      eligibleCount: number;
      topRecommendation: string | null;
      estimatedMaxAmount: string;
    };
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<MatchResponse>> {
  try {
    const body = await request.json() as MatchRequest;
    const { profile, options = {} } = body;

    // 필수 필드 검증
    if (!profile) {
      return NextResponse.json(
        { success: false, error: '기업 프로필이 필요합니다.' },
        { status: 400 }
      );
    }

    if (!profile.companyName) {
      return NextResponse.json(
        { success: false, error: '기업명은 필수 입력입니다.' },
        { status: 400 }
      );
    }

    if (profile.businessAge === undefined || profile.businessAge < 0) {
      return NextResponse.json(
        { success: false, error: '업력 정보가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!profile.industry) {
      return NextResponse.json(
        { success: false, error: '업종 정보가 필요합니다.' },
        { status: 400 }
      );
    }

    // 옵션 기본값
    const useAI = options.useAI ?? false;
    const topN = options.topN ?? 10;
    const minScore = options.minScore ?? 30;
    const generateBriefing = options.generateBriefing ?? false;

    console.log(`🔍 정책자금 매칭 요청: ${profile.companyName}`);
    console.log(`   - 업력: ${profile.businessAge}년, 업종: ${profile.industry}`);
    console.log(`   - AI 분석: ${useAI}, 최소 점수: ${minScore}`);

    // 1. 룰 기반 자격 체크
    const allResults = checkAllFundsEligibility(profile);
    const filteredResults = allResults
      .filter((r) => r.eligibilityScore >= minScore)
      .slice(0, topN);

    console.log(`   - 분석 완료: ${allResults.length}개 중 ${filteredResults.length}개 적합`);

    // 2. AI 분석 (옵션)
    let aiAnalysis: AIAdvisorResult[] | undefined;
    let portfolioAnalysis: PortfolioAnalysis | undefined;
    let briefingScript: string | undefined;

    if (useAI) {
      // AI 분석 수행
      portfolioAnalysis = await analyzePortfolio(filteredResults, profile);
      aiAnalysis = portfolioAnalysis.recommendedFunds;

      if (generateBriefing && portfolioAnalysis) {
        briefingScript = generateBriefingScript(portfolioAnalysis, profile);
      }
    } else {
      // 빠른 분석 (AI 없이)
      aiAnalysis = filteredResults.map((result) => quickAnalyze(result, profile));
    }

    // 3. 요약 정보 생성
    const eligibleCount = filteredResults.filter((r) => r.isEligible).length;
    const topRecommendation = filteredResults.length > 0 ? filteredResults[0].fundName : null;

    // 예상 최대 금액 계산
    const estimatedMaxAmount = calculateEstimatedAmount(filteredResults);

    return NextResponse.json({
      success: true,
      data: {
        eligibilityResults: filteredResults,
        aiAnalysis,
        portfolioAnalysis,
        briefingScript,
        summary: {
          totalAnalyzed: allResults.length,
          eligibleCount,
          topRecommendation,
          estimatedMaxAmount,
        },
      },
    });
  } catch (error) {
    console.error('❌ Policy fund matching error:', error);

    const errorMessage = error instanceof Error ? error.message : '매칭 분석에 실패했습니다.';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * 예상 최대 지원 금액 계산
 */
function calculateEstimatedAmount(results: EligibilityResult[]): string {
  const eligible = results.filter((r) => r.isEligible);

  if (eligible.length === 0) return '해당 없음';

  // 간략화된 추정 (실제로는 각 자금의 지원 금액 정보 참조)
  const highScore = eligible.filter((r) => r.eligibilityScore >= 80);

  if (highScore.length >= 3) return '최대 20억원 이상';
  if (highScore.length >= 2) return '최대 10~20억원';
  if (highScore.length >= 1) return '최대 5~10억원';
  if (eligible.length >= 2) return '최대 3~5억원';
  return '최대 1~3억원';
}

/**
 * GET - 간단한 상태 확인
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    message: 'Policy Fund Matching API',
    endpoints: {
      POST: {
        description: '기업 프로필 기반 정책자금 매칭',
        body: {
          profile: {
            companyName: 'string (필수)',
            businessAge: 'number (필수)',
            industry: 'IndustryCategory (필수)',
            annualRevenue: 'number (선택)',
            employeeCount: 'number (선택)',
            certifications: 'CompanyScale[] (선택)',
            creditRating: 'number 1-10 (선택)',
          },
          options: {
            useAI: 'boolean (기본: false)',
            topN: 'number (기본: 10)',
            minScore: 'number (기본: 30)',
            generateBriefing: 'boolean (기본: false)',
          },
        },
      },
    },
  });
}
