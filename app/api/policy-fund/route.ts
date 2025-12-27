/**
 * Policy Fund API Route
 *
 * 정책자금 검색 및 매칭 분석 API
 *
 * GET  /api/policy-fund - 정책자금 프로그램 목록 조회
 * POST /api/policy-fund - 기업 프로필 기반 매칭 분석
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchBizInfoPrograms } from '@/lib/api/bizinfo-client';
import { crawlMultiplePrograms, mergeDetailIntoProgram } from '@/lib/api/policy-detail-crawler';
import { analyzePolicyFundMatch } from '@/lib/financial/policy-fund-matcher';
import type {
  PolicyFundSearchParams,
  CompanyPolicyProfile,
} from '@/lib/types/policy-fund';

/**
 * GET: 정책자금 프로그램 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const params: PolicyFundSearchParams = {
      keyword: searchParams.get('keyword') || undefined,
      category: searchParams.get('category') as any || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '20'),
    };

    // 기업마당 API 호출
    const programs = await fetchBizInfoPrograms(params);

    // 상세 정보 크롤링 여부
    const includeDetail = searchParams.get('includeDetail') === 'true';

    let enrichedPrograms = programs;

    if (includeDetail && programs.length > 0) {
      // 상위 5개 프로그램에 대해서만 크롤링 (성능 고려)
      const topPrograms = programs.slice(0, 5);
      const details = await crawlMultiplePrograms(topPrograms, 2);

      enrichedPrograms = programs.map(program => {
        const detail = details.get(program.id);
        return mergeDetailIntoProgram(program, detail || null);
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        programs: enrichedPrograms,
        totalCount: enrichedPrograms.length,
        page: params.page,
        pageSize: params.pageSize,
      },
    });
  } catch (error) {
    console.error('Policy fund API error:', error);
    return NextResponse.json(
      { success: false, error: '정책자금 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST: 기업 프로필 기반 매칭 분석
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      companyProfile,
      searchParams = {},
    }: {
      companyProfile: CompanyPolicyProfile;
      searchParams?: PolicyFundSearchParams;
    } = body;

    // 필수 필드 검증
    if (!companyProfile || !companyProfile.companyName) {
      return NextResponse.json(
        { success: false, error: '기업 프로필이 필요합니다.' },
        { status: 400 }
      );
    }

    // 정책자금 프로그램 조회
    const programs = await fetchBizInfoPrograms(searchParams);

    // 상세 정보 크롤링 (상위 10개만)
    const topPrograms = programs.slice(0, 10);
    const details = await crawlMultiplePrograms(topPrograms, 3);

    const enrichedPrograms = programs.map(program => {
      const detail = details.get(program.id);
      return mergeDetailIntoProgram(program, detail || null);
    });

    // 매칭 분석 실행
    const analysis = analyzePolicyFundMatch(
      enrichedPrograms,
      companyProfile,
      searchParams
    );

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Policy fund matching error:', error);
    return NextResponse.json(
      { success: false, error: '정책자금 매칭 분석에 실패했습니다.' },
      { status: 500 }
    );
  }
}
