import { NextRequest, NextResponse } from 'next/server';
import { crawlKosmes } from '@/lib/crawlers/kosmes-crawler';

/**
 * POST /api/policy-fund/crawl
 * 정책자금 크롤링 실행
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const source = body.source || 'kosmes';

    let result;

    switch (source) {
      case 'kosmes':
        result = await crawlKosmes();
        break;
      // 추후 추가
      // case 'kodit':
      //   result = await crawlKodit();
      //   break;
      // case 'kibo':
      //   result = await crawlKibo();
      //   break;
      // case 'semas':
      //   result = await crawlSemas();
      //   break;
      default:
        return NextResponse.json(
          { error: `Unknown source: ${source}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: result.success,
      source,
      itemsFound: result.itemsFound,
      itemsNew: result.itemsNew,
      itemsUpdated: result.itemsUpdated,
      errors: result.errors,
      crawledAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Crawl API] Error:', error);
    return NextResponse.json(
      { error: 'Crawl failed', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/policy-fund/crawl
 * 크롤링된 데이터 조회
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source');
  const limit = parseInt(searchParams.get('limit') || '20');

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    let query = supabase
      .from('policy_fund_notices')
      .select('*')
      .order('crawled_at', { ascending: false })
      .limit(limit);

    if (source) {
      query = query.eq('source', source);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      count: data?.length || 0,
      data: data || [],
    });

  } catch (error) {
    console.error('[Crawl API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data', details: String(error) },
      { status: 500 }
    );
  }
}
