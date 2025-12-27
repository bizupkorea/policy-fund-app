/**
 * GET /api/policy-fund/health
 *
 * 서비스 헬스 체크 API
 * Parser 서비스, Supabase, 기업마당 API 상태 확인
 */

import { NextResponse } from 'next/server';
import { checkParserHealth } from '@/lib/api/parser-client';

export async function GET() {
  const health: Record<string, string> = {
    nextjs: 'healthy',
    parserService: 'unknown',
    supabase: 'unknown',
    bizinfoApi: 'unknown',
  };

  // 1. Parser 서비스 체크
  try {
    const parserHealth = await checkParserHealth();
    health.parserService = parserHealth?.status || 'down';
  } catch {
    health.parserService = 'down';
  }

  // 2. Supabase 체크 (TODO: 구현)
  // try {
  //   const supabase = createClient(
  //     process.env.SUPABASE_URL!,
  //     process.env.SUPABASE_KEY!
  //   );
  //   await supabase.from('policy_announcements').select('id').limit(1);
  //   health.supabase = 'healthy';
  // } catch {
  //   health.supabase = 'down';
  // }
  health.supabase = 'not_configured';

  // 3. 기업마당 API 체크
  try {
    const bizRes = await fetch(
      `https://www.bizinfo.go.kr/uss/rss/bizInfoApi.do?crtfcKey=${process.env.BIZINFO_API_KEY}&dataType=json&numOfRows=1`,
      { signal: AbortSignal.timeout(5000) }
    );
    health.bizinfoApi = bizRes.ok ? 'healthy' : 'unhealthy';
  } catch {
    health.bizinfoApi = 'down';
  }

  // 전체 상태 결정
  const criticalServices = ['nextjs', 'bizinfoApi'];
  const allCriticalHealthy = criticalServices.every(
    (s) => health[s] === 'healthy'
  );
  const anyDown = Object.values(health).some((s) => s === 'down');

  let status: 'healthy' | 'degraded' | 'unhealthy';
  if (allCriticalHealthy && !anyDown) {
    status = 'healthy';
  } else if (allCriticalHealthy) {
    status = 'degraded';
  } else {
    status = 'unhealthy';
  }

  return NextResponse.json({
    status,
    services: health,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
}
