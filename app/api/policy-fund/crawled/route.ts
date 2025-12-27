/**
 * GET /api/policy-fund/crawled
 *
 * 크롤링된 정책자금 공고 조회 API
 * Python 파서 서비스 또는 Supabase에서 직접 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAnnouncements } from '@/lib/api/parser-client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const source = searchParams.get('source') || undefined;
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    // Python 서비스에서 조회
    const result = await getAnnouncements({ source, limit, offset });

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          total: result.total,
          announcements: result.announcements,
          fromCache: result.from_cache,
        },
      });
    }

    // 폴백: Supabase에서 직접 조회 (TODO: 구현)
    // const supabase = createClient(
    //   process.env.SUPABASE_URL!,
    //   process.env.SUPABASE_KEY!
    // );

    return NextResponse.json({
      success: true,
      data: {
        total: 0,
        announcements: [],
        fromCache: false,
        message: 'Parser service unavailable, Supabase fallback not implemented',
      },
    });
  } catch (error) {
    console.error('Crawled announcements API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '데이터 조회 실패',
      },
      { status: 500 }
    );
  }
}
