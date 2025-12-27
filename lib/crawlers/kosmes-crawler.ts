/**
 * 중진공(중소벤처기업진흥공단) 크롤러
 *
 * 데이터 소스: https://www.kosmes.or.kr
 * API: /sh/nts/notice_list.json
 */

import { supabase } from '@/lib/supabase/client';

// 중진공 API 응답 타입
interface KosmesNoticeItem {
  SLNO: string;        // 시퀀스 번호
  TITL_NM: string;     // 제목
  UPDT_DTM: string;    // 수정일
  RGST_DTM?: string;   // 등록일
  CONT?: string;       // 내용
}

interface KosmesApiResponse {
  ds_infoList?: KosmesNoticeItem[];
}

// 파싱된 정책 조건
export interface ParsedConditions {
  businessAgeMin?: number;
  businessAgeMax?: number;
  revenueMin?: number;
  revenueMax?: number;
  employeeMin?: number;
  employeeMax?: number;
  allowedIndustries?: string[];
  excludedIndustries?: string[];
  allowedRegions?: string[];
  exclusionConditions?: string[];
  supportAmountMin?: number;
  supportAmountMax?: number;
  interestRateMin?: number;
  interestRateMax?: number;
}

// 크롤링 결과
export interface CrawlResult {
  success: boolean;
  itemsFound: number;
  itemsNew: number;
  itemsUpdated: number;
  errors: string[];
}

/**
 * 중진공 공지사항 목록 조회
 */
export async function fetchKosmesNotices(page: number = 1, pageSize: number = 20): Promise<KosmesNoticeItem[]> {
  const url = 'https://www.kosmes.or.kr/sh/nts/notice_list.json';

  const formData = new URLSearchParams();
  formData.append('nowPage', page.toString());
  formData.append('pageCount', pageSize.toString());
  formData.append('rowCount', pageSize.toString());

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'BizUp-PolicyFund-Crawler/1.0',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: KosmesApiResponse = await response.json();
    return data.ds_infoList || [];
  } catch (error) {
    console.error('[Kosmes Crawler] 목록 조회 실패:', error);
    return [];
  }
}

/**
 * 정책자금 관련 공지인지 필터링
 */
export function isPolicyFundNotice(title: string): boolean {
  const keywords = [
    '정책자금', '융자', '대출', '지원사업',
    '중소기업', '소상공인', '창업', '혁신',
    '보증', '이차보전', '금리'
  ];

  return keywords.some(keyword => title.includes(keyword));
}

/**
 * 상세 페이지에서 내용 크롤링
 */
export async function fetchNoticeDetail(seqNo: string): Promise<string | null> {
  const url = `https://www.kosmes.or.kr/nsh/SH/NTS/SHNTS001F0.do?seqNo=${seqNo}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BizUp-PolicyFund-Crawler/1.0',
      },
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();

    // 본문 내용 추출 (간단한 정규식)
    const contentMatch = html.match(/<div[^>]*class="[^"]*cont[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (contentMatch) {
      // HTML 태그 제거
      return contentMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    return null;
  } catch (error) {
    console.error(`[Kosmes Crawler] 상세 조회 실패 (${seqNo}):`, error);
    return null;
  }
}

/**
 * 텍스트에서 정책 조건 파싱
 */
export function parseConditions(text: string): ParsedConditions {
  const conditions: ParsedConditions = {};

  // 업력 조건 파싱
  const ageMatch = text.match(/업력\s*(\d+)\s*년\s*(이상|이내|미만)/);
  if (ageMatch) {
    const years = parseInt(ageMatch[1]);
    if (ageMatch[2] === '이상') {
      conditions.businessAgeMin = years;
    } else {
      conditions.businessAgeMax = years;
    }
  }

  // 창업 N년 이내
  const startupMatch = text.match(/창업\s*(\d+)\s*년\s*이내/);
  if (startupMatch) {
    conditions.businessAgeMax = parseInt(startupMatch[1]);
  }

  // 매출 조건 파싱
  const revenueMatch = text.match(/매출[액]?\s*(\d+)\s*(억|만)\s*원?\s*(이상|이하|미만|초과)/);
  if (revenueMatch) {
    let amount = parseInt(revenueMatch[1]);
    if (revenueMatch[2] === '억') amount *= 100000000;
    else if (revenueMatch[2] === '만') amount *= 10000;

    if (revenueMatch[3] === '이상' || revenueMatch[3] === '초과') {
      conditions.revenueMin = amount;
    } else {
      conditions.revenueMax = amount;
    }
  }

  // 직원수 조건 파싱
  const employeeMatch = text.match(/(?:상시)?근로자\s*(\d+)\s*인?\s*(이상|이하|미만)/);
  if (employeeMatch) {
    const count = parseInt(employeeMatch[1]);
    if (employeeMatch[2] === '이상') {
      conditions.employeeMin = count;
    } else {
      conditions.employeeMax = count;
    }
  }

  // 지원 금액 파싱
  const amountMatch = text.match(/(?:최대|한도)\s*(\d+)\s*(억|만)\s*원/);
  if (amountMatch) {
    let amount = parseInt(amountMatch[1]);
    if (amountMatch[2] === '억') amount *= 100000000;
    else if (amountMatch[2] === '만') amount *= 10000;
    conditions.supportAmountMax = amount;
  }

  // 금리 파싱
  const rateMatch = text.match(/금리\s*(\d+\.?\d*)\s*%?\s*~?\s*(\d+\.?\d*)?\s*%/);
  if (rateMatch) {
    conditions.interestRateMin = parseFloat(rateMatch[1]);
    if (rateMatch[2]) {
      conditions.interestRateMax = parseFloat(rateMatch[2]);
    }
  }

  // 제외 조건 파싱
  const exclusions: string[] = [];
  if (text.includes('세금') && text.includes('체납')) exclusions.push('세금체납');
  if (text.includes('휴업') || text.includes('폐업')) exclusions.push('휴폐업');
  if (text.includes('연체')) exclusions.push('금융기관 연체');
  if (text.includes('신용불량')) exclusions.push('신용불량');
  if (exclusions.length > 0) {
    conditions.exclusionConditions = exclusions;
  }

  // 업종 파싱
  const industries: string[] = [];
  if (text.includes('제조업')) industries.push('제조업');
  if (text.includes('지식서비스')) industries.push('지식서비스업');
  if (text.includes('정보통신')) industries.push('정보통신업');
  if (text.includes('소상공인')) industries.push('소상공인');
  if (industries.length > 0) {
    conditions.allowedIndustries = industries;
  }

  return conditions;
}

/**
 * 중진공 크롤링 실행 및 Supabase 저장
 */
export async function crawlKosmes(): Promise<CrawlResult> {
  const result: CrawlResult = {
    success: false,
    itemsFound: 0,
    itemsNew: 0,
    itemsUpdated: 0,
    errors: [],
  };

  // 크롤링 로그 시작
  const { data: logData } = await supabase
    .from('crawl_logs')
    .insert({ source: 'kosmes' })
    .select()
    .single();

  const logId = logData?.id;

  try {
    // 1. 공지사항 목록 조회 (최근 50개)
    const notices = await fetchKosmesNotices(1, 50);
    result.itemsFound = notices.length;

    // 2. 정책자금 관련 공지만 필터링
    const policyNotices = notices.filter(n => isPolicyFundNotice(n.TITL_NM));

    console.log(`[Kosmes] 전체 ${notices.length}개 중 정책자금 관련 ${policyNotices.length}개`);

    // 3. 각 공지 처리
    for (const notice of policyNotices) {
      try {
        // 상세 내용 조회
        const content = await fetchNoticeDetail(notice.SLNO);

        // 조건 파싱
        const fullText = `${notice.TITL_NM} ${content || ''}`;
        const conditions = parseConditions(fullText);

        // Supabase upsert
        const { error } = await supabase
          .from('policy_fund_notices')
          .upsert({
            source: 'kosmes',
            source_id: notice.SLNO,
            title: notice.TITL_NM,
            content: content,
            detail_url: `https://www.kosmes.or.kr/nsh/SH/NTS/SHNTS001F0.do?seqNo=${notice.SLNO}`,
            business_age_min: conditions.businessAgeMin,
            business_age_max: conditions.businessAgeMax,
            revenue_min: conditions.revenueMin,
            revenue_max: conditions.revenueMax,
            employee_min: conditions.employeeMin,
            employee_max: conditions.employeeMax,
            allowed_industries: conditions.allowedIndustries,
            exclusion_conditions: conditions.exclusionConditions,
            support_amount_min: conditions.supportAmountMin,
            support_amount_max: conditions.supportAmountMax,
            interest_rate_min: conditions.interestRateMin,
            interest_rate_max: conditions.interestRateMax,
            published_at: notice.RGST_DTM || notice.UPDT_DTM,
            raw_content: { original: notice, parsed: conditions },
          }, {
            onConflict: 'source,source_id',
          });

        if (error) {
          result.errors.push(`${notice.SLNO}: ${error.message}`);
        } else {
          result.itemsNew++;
        }

        // Rate limiting - 요청 간 500ms 대기
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (err) {
        result.errors.push(`${notice.SLNO}: ${err}`);
      }
    }

    result.success = true;

  } catch (error) {
    result.errors.push(`크롤링 실패: ${error}`);
  }

  // 크롤링 로그 업데이트
  if (logId) {
    await supabase
      .from('crawl_logs')
      .update({
        completed_at: new Date().toISOString(),
        items_found: result.itemsFound,
        items_new: result.itemsNew,
        items_updated: result.itemsUpdated,
        errors: result.errors.length > 0 ? result.errors : null,
      })
      .eq('id', logId);
  }

  return result;
}
