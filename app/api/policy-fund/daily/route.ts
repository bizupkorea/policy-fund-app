/**
 * Daily Policy Fund Briefing API Route
 *
 * 오늘의 정책자금 브리핑 데이터 조회 API
 *
 * GET /api/policy-fund/daily - 데일리 브리핑 데이터 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchDailyBriefing } from '@/lib/api/bizinfo-client';

/**
 * GET: 오늘의 정책자금 브리핑 조회
 *
 * Response:
 * - newPrograms: 오늘 신규 등록 공고
 * - deadlineSoonPrograms: 마감 임박 공고 (D-day 포함)
 * - tickerMessages: 롤링 티커용 메시지
 * - totalCount: 총 건수
 */
export async function GET(request: NextRequest) {
  try {
    const briefingData = await fetchDailyBriefing();

    return NextResponse.json({
      success: true,
      data: {
        date: briefingData.date.toISOString(),
        newPrograms: briefingData.newPrograms,
        deadlineSoonPrograms: briefingData.deadlineSoonPrograms,
        tickerItems: briefingData.tickerItems,
        totalCount: briefingData.totalCount,
      },
    });
  } catch (error) {
    console.error('Daily briefing API error:', error);
    return NextResponse.json(
      { success: false, error: '데일리 브리핑 데이터를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
