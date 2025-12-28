/**
 * Policy Fund Matching API (통합 오케스트레이션)
 *
 * 2단계 자격심사 + 3단계 AI 분석을 순차 실행
 *
 * POST /api/policy-fund/match-new
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  checkEligibility,
  getSuggestions,
  CompanyProfile,
  PolicyEligibilityCriteria,
  EligibilityResult,
} from '@/lib/policy-fund/eligibility-checker-new';
import {
  analyzeWithGemini,
  AIAnalysisResult,
  PolicyFundInfo,
} from '@/lib/policy-fund/gemini-advisor-new';

// ============================================================================
// 타입 정의
// ============================================================================

/**
 * API 요청 타입
 */
interface MatchRequest {
  company: CompanyProfile;
  options?: {
    useAI?: boolean;           // AI 분석 사용 여부 (기본: true)
    topN?: number;             // AI 분석할 상위 N개 (기본: 3)
    includeIneligible?: boolean; // 부적격 자금도 포함 (기본: false)
  };
}

/**
 * AI 추천 결과 (VIP 섹션용)
 */
interface AIRecommendation {
  fundId: string;
  fundName: string;
  agency: string;
  category: string;
  eligibility: EligibilityResult;
  aiAnalysis: AIAnalysisResult;
  maxAmount?: string;
  interestRate?: string;
}

/**
 * 일반 매칭 결과 (하단 리스트용)
 */
interface GeneralMatch {
  fundId: string;
  fundName: string;
  agency: string;
  category: string;
  eligibility: EligibilityResult;
  suggestions?: ReturnType<typeof getSuggestions>;
  maxAmount?: string;
  applicationPeriod?: string;
}

/**
 * API 응답 타입
 */
interface MatchResponse {
  success: boolean;
  data?: {
    aiRecommendations: AIRecommendation[];  // AI 분석된 상위 추천 (VIP)
    generalMatches: GeneralMatch[];          // 나머지 적격 자금
    ineligibleMatches?: GeneralMatch[];      // 부적격 자금 (옵션)
    summary: {
      totalFunds: number;
      eligibleCount: number;
      ineligibleCount: number;
      aiAnalyzedCount: number;
      topRecommendation: string | null;
    };
  };
  error?: string;
}

// ============================================================================
// 정책자금 데이터 (임시 - 추후 knowledge-base.ts 또는 DB에서 가져옴)
// ============================================================================

const POLICY_FUNDS: (PolicyFundInfo & { criteria: PolicyEligibilityCriteria })[] = [
  {
    id: 'fund-001',
    name: '중소벤처기업부 창업성장기술개발사업',
    agency: '중소벤처기업부',
    category: '보조금',
    targetSummary: '창업 7년 이내 기술혁신형 중소기업',
    supportSummary: 'R&D 자금 최대 3억원 지원',
    maxAmount: '3억원',
    criteria: {
      businessAgeMax: 7,
      excludeTaxDelinquent: true,
    },
  },
  {
    id: 'fund-002',
    name: '중진공 혁신성장자금',
    agency: '중소벤처기업진흥공단',
    category: '융자',
    targetSummary: '혁신성장 유망 중소기업',
    supportSummary: '운전·시설자금 최대 100억원 융자',
    maxAmount: '100억원',
    interestRate: '2.0~3.5%',
    criteria: {
      businessAgeMin: 3,
      excludeTaxDelinquent: true,
    },
  },
  {
    id: 'fund-003',
    name: '청년창업사관학교',
    agency: '중소벤처기업진흥공단',
    category: '보조금',
    targetSummary: '만 39세 이하 청년 창업자',
    supportSummary: '사업화 자금 최대 1억원 + 창업 교육',
    maxAmount: '1억원',
    criteria: {
      businessAgeMax: 3,
      ceoAgeMax: 39,
      excludeTaxDelinquent: true,
    },
  },
  {
    id: 'fund-004',
    name: '소상공인 정책자금 (일반경영안정)',
    agency: '소상공인시장진흥공단',
    category: '융자',
    targetSummary: '상시근로자 5인 미만 소상공인',
    supportSummary: '운전자금 최대 7천만원 융자',
    maxAmount: '7천만원',
    interestRate: '2.0~3.0%',
    criteria: {
      employeeMax: 5,
      excludeTaxDelinquent: true,
    },
  },
  {
    id: 'fund-005',
    name: '신용보증기금 일반보증',
    agency: '신용보증기금',
    category: '보증',
    targetSummary: '담보력 부족 중소기업',
    supportSummary: '신용보증 최대 30억원',
    maxAmount: '30억원',
    interestRate: '보증료 0.5~1.5%',
    criteria: {
      excludeTaxDelinquent: true,
    },
  },
  {
    id: 'fund-006',
    name: '기술보증기금 기술평가보증',
    agency: '기술보증기금',
    category: '보증',
    targetSummary: '기술력 보유 중소기업, 벤처기업',
    supportSummary: '기술평가 기반 보증 최대 50억원',
    maxAmount: '50억원',
    interestRate: '보증료 0.5~1.5%',
    criteria: {
      requiredCertifications: ['venture'],
      excludeTaxDelinquent: true,
    },
  },
  {
    id: 'fund-007',
    name: '경기도 중소기업 육성자금',
    agency: '경기신용보증재단',
    category: '융자',
    targetSummary: '경기도 소재 중소기업',
    supportSummary: '운전자금 보증 지원 최대 5억원',
    maxAmount: '5억원',
    interestRate: '2.5~3.5%',
    criteria: {
      allowedRegions: ['경기', '경기도'],
      excludeTaxDelinquent: true,
    },
  },
  {
    id: 'fund-008',
    name: '서울시 중소기업 긴급자금',
    agency: '서울신용보증재단',
    category: '융자',
    targetSummary: '서울시 소재 중소기업',
    supportSummary: '긴급운전자금 최대 3억원',
    maxAmount: '3억원',
    interestRate: '2.0~3.0%',
    criteria: {
      allowedRegions: ['서울', '서울시', '서울특별시'],
      excludeTaxDelinquent: true,
    },
  },
  {
    id: 'fund-009',
    name: '제조업 스마트공장 지원사업',
    agency: '중소벤처기업부',
    category: '보조금',
    targetSummary: '제조업 중소기업',
    supportSummary: '스마트공장 구축비 최대 50% 지원',
    maxAmount: '1억원',
    criteria: {
      allowedIndustries: ['제조', '제조업', 'C'],
      excludeTaxDelinquent: true,
    },
  },
  {
    id: 'fund-010',
    name: '벤처기업 성장자금',
    agency: '한국벤처투자',
    category: '투자',
    targetSummary: '벤처인증 기업',
    supportSummary: '성장단계 투자 최대 30억원',
    maxAmount: '30억원',
    criteria: {
      requiredCertifications: ['venture'],
      businessAgeMin: 3,
      excludeTaxDelinquent: true,
    },
  },
];

// ============================================================================
// API 핸들러
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<MatchResponse>> {
  try {
    const body = await request.json() as MatchRequest;
    const { company, options = {} } = body;

    // 옵션 기본값
    const useAI = options.useAI ?? true;
    const topN = options.topN ?? 3;
    const includeIneligible = options.includeIneligible ?? false;

    // 필수 필드 검증
    if (!company || !company.name) {
      return NextResponse.json(
        { success: false, error: '기업 정보가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log(`🔍 정책자금 매칭 시작: ${company.name}`);
    console.log(`   - 업력: ${getBusinessYears(company.foundedDate)}년`);
    console.log(`   - 업종: ${company.industryCode}`);
    console.log(`   - AI 분석: ${useAI ? '사용' : '미사용'}`);

    // ========================================================================
    // 2단계: 룰 기반 자격 심사
    // ========================================================================
    const eligibilityResults: {
      fund: typeof POLICY_FUNDS[0];
      result: EligibilityResult;
    }[] = [];

    for (const fund of POLICY_FUNDS) {
      const result = checkEligibility(company, fund.criteria);
      eligibilityResults.push({ fund, result });
    }

    // 적격/부적격 분리
    const eligibleFunds = eligibilityResults.filter(e => e.result.isEligible);
    const ineligibleFunds = eligibilityResults.filter(e => !e.result.isEligible);

    console.log(`   - 자격심사 완료: 적격 ${eligibleFunds.length}개 / 부적격 ${ineligibleFunds.length}개`);

    // ========================================================================
    // 3단계: AI 분석 (적격 자금 중 상위 N개만)
    // ========================================================================
    const aiRecommendations: AIRecommendation[] = [];
    const generalMatches: GeneralMatch[] = [];

    if (useAI && eligibleFunds.length > 0) {
      // 상위 N개만 AI 분석
      const topFunds = eligibleFunds.slice(0, topN);
      const remainingFunds = eligibleFunds.slice(topN);

      console.log(`   - AI 분석 시작: 상위 ${topFunds.length}개`);

      for (const { fund, result } of topFunds) {
        const aiResponse = await analyzeWithGemini({
          company,
          fund,
          eligibilityResult: result,
        });

        if (aiResponse.result) {
          aiRecommendations.push({
            fundId: fund.id,
            fundName: fund.name,
            agency: fund.agency,
            category: fund.category,
            eligibility: result,
            aiAnalysis: aiResponse.result,
            maxAmount: fund.maxAmount,
            interestRate: fund.interestRate,
          });
        }

        // Rate Limit 방지
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // 나머지는 일반 매칭으로
      for (const { fund, result } of remainingFunds) {
        generalMatches.push({
          fundId: fund.id,
          fundName: fund.name,
          agency: fund.agency,
          category: fund.category,
          eligibility: result,
          maxAmount: fund.maxAmount,
          applicationPeriod: '2024.01.01 ~ 2024.12.31',  // TODO: 실제 데이터
        });
      }
    } else {
      // AI 미사용시 모두 일반 매칭으로
      for (const { fund, result } of eligibleFunds) {
        generalMatches.push({
          fundId: fund.id,
          fundName: fund.name,
          agency: fund.agency,
          category: fund.category,
          eligibility: result,
          maxAmount: fund.maxAmount,
          applicationPeriod: '2024.01.01 ~ 2024.12.31',
        });
      }
    }

    // AI 점수순 정렬
    aiRecommendations.sort((a, b) => b.aiAnalysis.score - a.aiAnalysis.score);

    // 부적격 자금 (옵션)
    const ineligibleMatches: GeneralMatch[] = includeIneligible
      ? ineligibleFunds.map(({ fund, result }) => ({
          fundId: fund.id,
          fundName: fund.name,
          agency: fund.agency,
          category: fund.category,
          eligibility: result,
          suggestions: getSuggestions(result.failedChecks),
          maxAmount: fund.maxAmount,
        }))
      : [];

    console.log(`✅ 매칭 완료: AI추천 ${aiRecommendations.length}개, 일반 ${generalMatches.length}개`);

    return NextResponse.json({
      success: true,
      data: {
        aiRecommendations,
        generalMatches,
        ineligibleMatches: includeIneligible ? ineligibleMatches : undefined,
        summary: {
          totalFunds: POLICY_FUNDS.length,
          eligibleCount: eligibleFunds.length,
          ineligibleCount: ineligibleFunds.length,
          aiAnalyzedCount: aiRecommendations.length,
          topRecommendation: aiRecommendations[0]?.fundName || null,
        },
      },
    });

  } catch (error) {
    console.error('❌ Policy fund matching error:', error);

    const errorMessage = error instanceof Error
      ? error.message
      : '매칭 분석에 실패했습니다.';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// ============================================================================
// 헬퍼 함수
// ============================================================================

function getBusinessYears(foundedDate: string): number {
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

// ============================================================================
// GET - API 상태 확인
// ============================================================================

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    message: 'Policy Fund Matching API (Orchestration)',
    version: '2.0',
    endpoints: {
      POST: {
        description: '기업 정보 기반 정책자금 매칭 (2단계 자격심사 + 3단계 AI 분석)',
        body: {
          company: {
            name: 'string (필수)',
            foundedDate: 'YYYY-MM-DD (필수)',
            revenue: 'number (원)',
            industryCode: 'string',
            employees: 'number',
            location: 'string',
            ceoAge: 'number (선택)',
            hasTaxDelinquency: 'boolean',
            hasExistingLoan: 'boolean',
            certifications: '{ venture, innobiz, mainbiz }',
          },
          options: {
            useAI: 'boolean (기본: true)',
            topN: 'number (기본: 3)',
            includeIneligible: 'boolean (기본: false)',
          },
        },
        response: {
          aiRecommendations: 'AI 분석된 상위 추천 (VIP 섹션)',
          generalMatches: '나머지 적격 자금',
          ineligibleMatches: '부적격 자금 (옵션)',
          summary: '요약 통계',
        },
      },
    },
    availableFunds: POLICY_FUNDS.length,
  });
}
