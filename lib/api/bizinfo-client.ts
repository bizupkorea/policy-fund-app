/**
 * 기업마당 (BizInfo) API Client
 *
 * 공공데이터포털 기업마당 API를 통해 정책자금 정보를 조회합니다.
 * API 문서: https://www.data.go.kr/data/15084067/openapi.do
 *
 * 주의: API 키는 환경변수로 관리해야 합니다.
 * 응답 형식: XML RSS (RSS 2.0)
 */

import type {
  PolicyFundProgram,
  PolicyFundCategory,
  PolicyFundSearchParams
} from '../types/policy-fund';

// API 기본 설정
const BIZINFO_API_BASE_URL = 'https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do';

/**
 * XML 텍스트에서 특정 태그 값 추출
 */
function extractXmlValue(xml: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tagName}>|<${tagName}>([^<]*)<\\/${tagName}>`, 'i');
  const match = xml.match(regex);
  if (match) {
    return (match[1] || match[2] || '').trim();
  }
  return '';
}

/**
 * XML RSS 응답에서 item 목록 파싱
 */
function parseRssItems(xmlText: string): PolicyFundProgram[] {
  const items: PolicyFundProgram[] = [];

  // <item> 태그들 추출
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemXml = match[1];

    const title = extractXmlValue(itemXml, 'title');
    const link = extractXmlValue(itemXml, 'link');
    const pblancId = extractXmlValue(itemXml, 'pblancId') || extractXmlValue(itemXml, 'seq');
    const author = extractXmlValue(itemXml, 'jrsdInsttNm') || extractXmlValue(itemXml, 'author');
    const excInsttNm = extractXmlValue(itemXml, 'excInsttNm');
    const description = extractXmlValue(itemXml, 'bsnsSumryCn') || extractXmlValue(itemXml, 'description');
    const reqstDt = extractXmlValue(itemXml, 'reqstBeginEndDe') || extractXmlValue(itemXml, 'reqstDt');
    const trgetNm = extractXmlValue(itemXml, 'trgetNm');
    const pubDate = extractXmlValue(itemXml, 'creatPnttm') || extractXmlValue(itemXml, 'pubDate');

    if (title && pblancId) {
      items.push({
        id: pblancId,
        name: title,
        category: categorizeProgram(title, description),
        executingAgency: excInsttNm || author,
        supervisingAgency: author,
        applicationPeriod: formatApplicationPeriod(reqstDt),
        detailUrl: link,
        supportSummary: cleanHtmlTags(description),
        targetSummary: trgetNm,
        publishedAt: pubDate,
      });
    }
  }

  return items;
}

/**
 * HTML 태그 제거
 */
function cleanHtmlTags(text: string): string {
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 신청기간 포맷 변환
 * 입력: "20251222 ~ 20260109" 또는 "2025-12-22 ~ 2026-01-09"
 * 출력: "2025.12.22 ~ 2026.01.09"
 */
function formatApplicationPeriod(period: string): string {
  if (!period) return '상시접수';

  // 이미 포맷된 경우
  if (period.includes('.')) return period;

  // YYYYMMDD ~ YYYYMMDD 형식
  const match = period.match(/(\d{4})(\d{2})(\d{2})\s*~\s*(\d{4})(\d{2})(\d{2})/);
  if (match) {
    return `${match[1]}.${match[2]}.${match[3]} ~ ${match[4]}.${match[5]}.${match[6]}`;
  }

  // YYYY-MM-DD ~ YYYY-MM-DD 형식
  const match2 = period.match(/(\d{4})-(\d{2})-(\d{2})\s*~\s*(\d{4})-(\d{2})-(\d{2})/);
  if (match2) {
    return `${match2[1]}.${match2[2]}.${match2[3]} ~ ${match2[4]}.${match2[5]}.${match2[6]}`;
  }

  return period;
}

/**
 * 기업마당 API 호출
 *
 * @param params 검색 파라미터
 * @returns API 응답
 */
export async function fetchBizInfoPrograms(
  params: PolicyFundSearchParams = {}
): Promise<PolicyFundProgram[]> {
  const apiKey = process.env.BIZINFO_API_KEY;

  if (!apiKey) {
    console.warn('⚠️ BIZINFO_API_KEY not set. Using mock data.');
    return getMockPrograms();
  }

  try {
    // API URL 구성 (XML RSS 형식)
    const url = `${BIZINFO_API_BASE_URL}?crtfcKey=${apiKey}`;

    console.log('[BizInfo API] Fetching:', url.replace(apiKey, '***'));

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/xml, text/xml, */*',
        'User-Agent': 'BizUp-PolicyFund/1.0',
      },
      next: { revalidate: 3600 }, // 1시간 캐시
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const xmlText = await response.text();

    // XML 파싱
    const programs = parseRssItems(xmlText);

    console.log(`[BizInfo API] Parsed ${programs.length} programs`);

    if (programs.length === 0) {
      console.warn('[BizInfo API] No programs found, using mock data');
      return getMockPrograms();
    }

    // 페이지네이션 적용
    const startIdx = ((params.page || 1) - 1) * (params.pageSize || 20);
    const endIdx = startIdx + (params.pageSize || 20);

    return programs.slice(startIdx, endIdx);
  } catch (error) {
    console.error('기업마당 API 호출 실패:', error);
    // 실패 시 목업 데이터 반환
    return getMockPrograms();
  }
}

/**
 * 프로그램명/지원내용으로 카테고리 추론
 */
function categorizeProgram(name: string, supportContent?: string): PolicyFundCategory {
  const text = `${name} ${supportContent || ''}`.toLowerCase();

  if (text.includes('융자') || text.includes('대출') || text.includes('자금')) {
    return 'loan';
  }
  if (text.includes('보증')) {
    return 'guarantee';
  }
  if (text.includes('보조금') || text.includes('지원금') || text.includes('무상')) {
    return 'grant';
  }
  if (text.includes('투자') || text.includes('펀드')) {
    return 'investment';
  }
  if (text.includes('컨설팅') || text.includes('자문')) {
    return 'consulting';
  }
  if (text.includes('인증') || text.includes('인정')) {
    return 'certification';
  }
  if (text.includes('수출') || text.includes('해외')) {
    return 'export';
  }
  if (text.includes('연구') || text.includes('개발') || text.includes('r&d')) {
    return 'rnd';
  }
  if (text.includes('고용') || text.includes('채용') || text.includes('인력')) {
    return 'employment';
  }

  return 'other';
}

/**
 * 동적 날짜 생성 헬퍼
 */
function generateDynamicPeriod(monthsFromNow: number, durationMonths: number): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + monthsFromNow, 1);
  const end = new Date(start.getFullYear(), start.getMonth() + durationMonths, 0);

  const formatDate = (d: Date) =>
    `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;

  return `${formatDate(start)} ~ ${formatDate(end)}`;
}

/**
 * 목업 데이터 (API 키 없거나 호출 실패 시)
 * ⚠️ 주의: 이 데이터는 데모용이며 실제 정책자금 정보가 아닙니다.
 */
function getMockPrograms(): PolicyFundProgram[] {
  return [
    {
      id: 'mock-001',
      name: '중소기업 정책자금 융자',
      category: 'loan',
      executingAgency: '중소벤처기업진흥공단',
      supervisingAgency: '중소벤처기업부',
      applicationPeriod: generateDynamicPeriod(-1, 12), // 1개월 전부터 12개월간
      detailUrl: 'https://www.kosmes.or.kr',
      supportSummary: '중소기업 시설자금 및 운전자금 융자 지원',
      targetSummary: '제조업, IT서비스업 영위 중소기업',
      isMockData: true,
    },
    {
      id: 'mock-002',
      name: '신용보증기금 일반보증',
      category: 'guarantee',
      executingAgency: '신용보증기금',
      supervisingAgency: '금융위원회',
      applicationPeriod: '상시접수',
      detailUrl: 'https://www.kodit.co.kr',
      supportSummary: '담보력이 부족한 중소기업에 신용보증서 발급',
      targetSummary: '신용등급 6등급 이상 중소기업',
      isMockData: true,
    },
    {
      id: 'mock-003',
      name: '창업성장기술개발사업(팁스)',
      category: 'rnd',
      executingAgency: '한국산업기술진흥원',
      supervisingAgency: '중소벤처기업부',
      applicationPeriod: generateDynamicPeriod(0, 3), // 이번달부터 3개월간
      detailUrl: 'https://www.tips.or.kr',
      supportSummary: '기술창업기업 R&D 자금 지원 (최대 5억원)',
      targetSummary: 'TIPS 선정 창업기업',
      isMockData: true,
    },
    {
      id: 'mock-004',
      name: '스마트공장 구축 지원사업',
      category: 'grant',
      executingAgency: '스마트제조혁신추진단',
      supervisingAgency: '중소벤처기업부',
      applicationPeriod: generateDynamicPeriod(0, 3),
      detailUrl: 'https://www.smart-factory.kr',
      supportSummary: '제조 중소기업 스마트공장 구축비용 지원',
      targetSummary: '제조업 영위 중소기업',
      isMockData: true,
    },
    {
      id: 'mock-005',
      name: '수출바우처 사업',
      category: 'export',
      executingAgency: 'KOTRA',
      supervisingAgency: '산업통상자원부',
      applicationPeriod: generateDynamicPeriod(-1, 2),
      detailUrl: 'https://www.exportvoucher.com',
      supportSummary: '수출 관련 서비스 이용 바우처 지원',
      targetSummary: '수출 또는 수출 계획이 있는 중소/중견기업',
      isMockData: true,
    },
    {
      id: 'mock-006',
      name: '이노비즈 인증 지원',
      category: 'certification',
      executingAgency: '중소기업기술정보진흥원',
      supervisingAgency: '중소벤처기업부',
      applicationPeriod: '상시접수',
      detailUrl: 'https://www.innobiz.net',
      supportSummary: '기술혁신형 중소기업(이노비즈) 인증 취득 지원',
      targetSummary: '기술혁신 역량 보유 중소기업',
      isMockData: true,
    },
    {
      id: 'mock-007',
      name: '중소기업 경영컨설팅 지원',
      category: 'consulting',
      executingAgency: '중소기업진흥공단',
      supervisingAgency: '중소벤처기업부',
      applicationPeriod: '상시접수',
      detailUrl: 'https://www.sbc.or.kr',
      supportSummary: '경영, 재무, 마케팅 등 분야별 전문 컨설팅 지원',
      targetSummary: '업력 3년 이상 중소기업',
      isMockData: true,
    },
    {
      id: 'mock-008',
      name: '청년창업사관학교',
      category: 'investment',
      executingAgency: '창업진흥원',
      supervisingAgency: '중소벤처기업부',
      applicationPeriod: generateDynamicPeriod(1, 2), // 다음달부터 2개월간
      detailUrl: 'https://start.kosmes.or.kr',
      supportSummary: '예비창업자 대상 창업교육 및 사업화 지원',
      targetSummary: '만 39세 이하 예비창업자',
      isMockData: true,
    },
    {
      id: 'mock-009',
      name: '일자리 창출 우수기업 인증',
      category: 'employment',
      executingAgency: '한국산업인력공단',
      supervisingAgency: '고용노동부',
      applicationPeriod: generateDynamicPeriod(0, 4),
      detailUrl: 'https://www.hrd.go.kr',
      supportSummary: '일자리 창출 실적 우수 기업 인증 및 혜택 부여',
      targetSummary: '최근 3년간 고용 순증 기업',
      isMockData: true,
    },
    {
      id: 'mock-010',
      name: '기술보증기금 기술평가보증',
      category: 'guarantee',
      executingAgency: '기술보증기금',
      supervisingAgency: '금융위원회',
      applicationPeriod: '상시접수',
      detailUrl: 'https://www.kibo.or.kr',
      supportSummary: '기술력 기반 신용보증서 발급',
      targetSummary: '기술사업성 보유 중소기업',
      isMockData: true,
    },
  ];
}

/**
 * 마감 임박 프로그램 필터링
 */
export function filterDeadlineApproaching(
  programs: PolicyFundProgram[],
  daysThreshold: number = 30
): PolicyFundProgram[] {
  const now = new Date();
  const threshold = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);

  return programs.filter(program => {
    // 신청기간 파싱 (예: "2024.03.01 ~ 2024.05.31")
    const periodMatch = program.applicationPeriod.match(/~\s*(\d{4})\.(\d{2})\.(\d{2})/);
    if (!periodMatch) return false;

    const endDate = new Date(
      parseInt(periodMatch[1]),
      parseInt(periodMatch[2]) - 1,
      parseInt(periodMatch[3])
    );

    return endDate <= threshold && endDate >= now;
  });
}

/**
 * 카테고리별 그룹핑
 */
export function groupByCategory(
  programs: PolicyFundProgram[]
): Record<PolicyFundCategory, PolicyFundProgram[]> {
  const groups: Record<PolicyFundCategory, PolicyFundProgram[]> = {
    'loan': [],
    'guarantee': [],
    'grant': [],
    'investment': [],
    'consulting': [],
    'certification': [],
    'export': [],
    'rnd': [],
    'employment': [],
    'other': [],
  };

  for (const program of programs) {
    groups[program.category].push(program);
  }

  return groups;
}

/**
 * 오늘 신규 등록된 공고 조회
 * (실제로는 API에서 등록일 필드를 사용해야 하지만,
 *  목업에서는 최근 프로그램을 반환)
 */
export async function fetchTodayNewPrograms(): Promise<PolicyFundProgram[]> {
  const allPrograms = await fetchBizInfoPrograms({ pageSize: 50 });

  // 실제 API가 등록일을 제공하면 필터링
  // 현재는 상위 5개를 "오늘 신규"로 표시
  return allPrograms.slice(0, 5).map(program => ({
    ...program,
    isNew: true,
  }));
}

/**
 * 마감 임박 공고 조회 (D-day 계산)
 */
export async function fetchDeadlineSoonPrograms(
  daysThreshold: number = 7
): Promise<Array<PolicyFundProgram & { daysLeft: number }>> {
  const allPrograms = await fetchBizInfoPrograms({ pageSize: 50 });
  const now = new Date();
  const threshold = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);

  const deadlineSoon: Array<PolicyFundProgram & { daysLeft: number }> = [];

  for (const program of allPrograms) {
    // 상시접수는 제외
    if (program.applicationPeriod === '상시접수') continue;

    // 신청기간에서 마감일 파싱 (예: "2024.03.01 ~ 2024.05.31")
    const periodMatch = program.applicationPeriod.match(/~\s*(\d{4})\.(\d{2})\.(\d{2})/);
    if (!periodMatch) continue;

    const endDate = new Date(
      parseInt(periodMatch[1]),
      parseInt(periodMatch[2]) - 1,
      parseInt(periodMatch[3])
    );

    // 마감일이 오늘 이후 ~ threshold 이내
    if (endDate >= now && endDate <= threshold) {
      const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      deadlineSoon.push({
        ...program,
        daysLeft,
      });
    }
  }

  // D-day 가까운 순 정렬
  return deadlineSoon.sort((a, b) => a.daysLeft - b.daysLeft);
}

/**
 * 티커 아이템 타입
 */
export interface TickerItem {
  id: string;
  type: 'breaking' | 'deadline' | 'new';
  message: string;
  link?: string;
}

/**
 * 데일리 브리핑용 통합 데이터 조회
 */
export interface DailyBriefingData {
  date: Date;
  newPrograms: PolicyFundProgram[];
  deadlineSoonPrograms: Array<PolicyFundProgram & { daysLeft: number }>;
  totalCount: number;
  tickerItems: TickerItem[];
}

export async function fetchDailyBriefing(): Promise<DailyBriefingData> {
  const [newPrograms, deadlineSoon] = await Promise.all([
    fetchTodayNewPrograms(),
    fetchDeadlineSoonPrograms(7),
  ]);

  // 티커 아이템 생성 (색상/링크 포함)
  const tickerItems: TickerItem[] = [];

  // 신규 공고
  newPrograms.slice(0, 2).forEach(program => {
    tickerItems.push({
      id: `new-${program.id}`,
      type: 'new',
      message: `${program.name} 접수 시작`,
      link: program.detailUrl,
    });
  });

  // 마감 임박 공고
  deadlineSoon.slice(0, 3).forEach(program => {
    tickerItems.push({
      id: `deadline-${program.id}`,
      type: 'deadline',
      message: `D-${program.daysLeft} ${program.name}`,
      link: program.detailUrl,
    });
  });

  // 기본 메시지 추가
  if (tickerItems.length === 0) {
    tickerItems.push({
      id: 'default',
      type: 'new',
      message: '오늘의 정책자금 현황을 확인하세요',
    });
  }

  return {
    date: new Date(),
    newPrograms,
    deadlineSoonPrograms: deadlineSoon,
    totalCount: newPrograms.length + deadlineSoon.length,
    tickerItems,
  };
}
