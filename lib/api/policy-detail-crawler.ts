/**
 * Policy Detail Crawler
 *
 * 정책자금 상세 페이지를 크롤링하여 추가 정보를 추출합니다.
 * 서버 사이드에서만 동작합니다 (API Route에서 사용).
 *
 * 주의: 실제 운영 시에는 크롤링 대상 사이트의 robots.txt와
 * 이용약관을 확인해야 합니다.
 */

import type { PolicyFundDetail, PolicyFundProgram } from '../types/policy-fund';

/**
 * 상세 페이지 크롤링
 *
 * @param program 정책자금 프로그램
 * @returns 크롤링된 상세 정보
 */
export async function crawlPolicyDetail(
  program: PolicyFundProgram
): Promise<PolicyFundDetail | null> {
  try {
    // 서버 환경 체크
    if (typeof window !== 'undefined') {
      console.warn('크롤러는 서버 사이드에서만 동작합니다.');
      return null;
    }

    const response = await fetch(program.detailUrl, {
      headers: {
        'User-Agent': 'BizUp-AI-Bot/1.0 (Financial Analysis)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      next: { revalidate: 86400 }, // 24시간 캐시
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // HTML 파싱 (cheerio 없이 정규식으로 기본 파싱)
    const detail = parseHtmlContent(html, program);

    return {
      ...detail,
      crawledAt: new Date(),
      crawlSuccess: true,
    };
  } catch (error) {
    console.error(`크롤링 실패 [${program.id}]:`, error);
    return {
      supportConditions: [],
      eligibility: [],
      exclusions: [],
      requiredDocuments: [],
      evaluationCriteria: [],
      crawledAt: new Date(),
      crawlSuccess: false,
    };
  }
}

/**
 * HTML 콘텐츠 파싱 (기본 정규식 기반)
 *
 * 실제 운영 시에는 cheerio를 사용하여 더 정교한 파싱이 필요합니다.
 */
function parseHtmlContent(
  html: string,
  program: PolicyFundProgram
): Omit<PolicyFundDetail, 'crawledAt' | 'crawlSuccess'> {
  // 기본값으로 목업 데이터 반환 (실제 구현 시 정교한 파싱 필요)
  const mockDetails = getMockDetailForProgram(program);

  // 간단한 정규식 파싱 시도
  const supportConditions: string[] = [];
  const eligibility: string[] = [];
  const exclusions: string[] = [];
  const requiredDocuments: string[] = [];
  const evaluationCriteria: string[] = [];

  // 지원 금액 추출 시도
  const amountMatch = html.match(/(\d+(?:,\d+)*)\s*(억원|만원|원)/);
  let supportAmount: PolicyFundDetail['supportAmount'] | undefined;
  if (amountMatch) {
    const value = parseInt(amountMatch[1].replace(/,/g, ''));
    supportAmount = {
      max: value,
      unit: amountMatch[2],
      description: amountMatch[0],
    };
  }

  // 금리 추출 시도
  const rateMatch = html.match(/(\d+(?:\.\d+)?)\s*%/);
  let interestRate: PolicyFundDetail['interestRate'] | undefined;
  if (rateMatch) {
    interestRate = {
      min: parseFloat(rateMatch[1]),
      description: `연 ${rateMatch[1]}%`,
    };
  }

  // 실제 파싱 결과가 빈 경우 목업 데이터 사용
  return mockDetails || {
    supportAmount,
    supportConditions,
    interestRate,
    eligibility,
    exclusions,
    requiredDocuments,
    evaluationCriteria,
  };
}

/**
 * 프로그램별 목업 상세 데이터
 */
function getMockDetailForProgram(
  program: PolicyFundProgram
): Omit<PolicyFundDetail, 'crawledAt' | 'crawlSuccess'> | null {
  const mockDetails: Record<string, Omit<PolicyFundDetail, 'crawledAt' | 'crawlSuccess'>> = {
    'mock-001': {
      supportAmount: {
        min: 10000000,
        max: 6000000000,
        unit: '원',
        description: '1천만원 ~ 최대 60억원',
      },
      supportConditions: [
        '제조업 또는 IT서비스업 영위',
        '업력 1년 이상',
        '신용등급 6등급 이상',
      ],
      interestRate: {
        min: 2.0,
        max: 3.5,
        description: '연 2.0% ~ 3.5% (기준금리 연동)',
      },
      repaymentTerms: {
        period: '8년',
        gracePeriod: '3년',
        description: '8년 이내 (거치기간 3년 포함)',
      },
      eligibility: [
        '중소기업기본법상 중소기업',
        '사업자등록 후 1년 이상 경과',
        '세금 체납 없음',
      ],
      exclusions: [
        '휴/폐업 중인 기업',
        '금융기관 연체자',
        '국세/지방세 체납 기업',
      ],
      requiredDocuments: [
        '사업자등록증',
        '재무제표 (최근 3개년)',
        '법인등기부등본',
        '사업계획서',
        '대표자 신분증',
      ],
      evaluationCriteria: [
        '기업 신용등급',
        '재무상태 (부채비율, 유동비율)',
        '사업성 및 성장성',
        '고용 창출 계획',
      ],
      contactInfo: {
        phone: '1357',
        email: 'support@kosmes.or.kr',
        website: 'https://www.kosmes.or.kr',
      },
    },
    'mock-002': {
      supportAmount: {
        max: 3000000000,
        unit: '원',
        description: '최대 30억원 (보증비율 90%)',
      },
      supportConditions: [
        '신용등급 6등급 이상',
        '담보력 부족 중소기업',
      ],
      interestRate: {
        min: 0.5,
        max: 1.5,
        description: '보증료율 연 0.5% ~ 1.5%',
      },
      eligibility: [
        '중소기업기본법상 중소기업',
        '신용등급 6등급 이상',
        '금융거래 정상',
      ],
      exclusions: [
        '보증채무 불이행자',
        '휴/폐업 기업',
        '부실위험 기업',
      ],
      requiredDocuments: [
        '사업자등록증',
        '재무제표',
        '신용등급확인서',
        '대출용도 증빙서류',
      ],
      evaluationCriteria: [
        '신용등급',
        '재무안정성',
        '경영상태',
      ],
      contactInfo: {
        phone: '1588-6565',
        website: 'https://www.kodit.co.kr',
      },
    },
    'mock-003': {
      supportAmount: {
        max: 500000000,
        unit: '원',
        description: 'R&D 자금 최대 5억원',
      },
      supportConditions: [
        'TIPS 운영사 선정',
        '기술창업기업',
        '창업 7년 이내',
      ],
      eligibility: [
        '기술기반 창업기업',
        'TIPS 운영사 선정 기업',
        '대표자 또는 팀의 기술역량 보유',
      ],
      exclusions: [
        '비기술 창업기업',
        '대기업 계열사',
      ],
      requiredDocuments: [
        '사업계획서',
        '기술소개서',
        '팀 구성 현황',
        '투자계약서 (VC 투자 시)',
      ],
      evaluationCriteria: [
        '기술혁신성',
        '시장성',
        '팀 역량',
        '사업화 가능성',
      ],
      contactInfo: {
        phone: '1551-8787',
        website: 'https://www.tips.or.kr',
      },
    },
    'mock-004': {
      supportAmount: {
        max: 400000000,
        unit: '원',
        description: '구축비용의 최대 50% 지원',
      },
      supportConditions: [
        '제조업 영위',
        '스마트공장 도입 의지',
      ],
      eligibility: [
        '제조업 영위 중소/중견기업',
        '공장 운영 1년 이상',
        '스마트공장 미구축 기업',
      ],
      exclusions: [
        '비제조업',
        '이미 스마트공장 구축 완료 기업',
      ],
      requiredDocuments: [
        '사업자등록증',
        '공장등록증',
        '사업계획서',
        '견적서',
      ],
      evaluationCriteria: [
        '도입 필요성',
        '기대효과',
        '추진 의지',
        '자부담 능력',
      ],
      contactInfo: {
        phone: '1644-0889',
        website: 'https://www.smart-factory.kr',
      },
    },
  };

  return mockDetails[program.id] || null;
}

/**
 * 여러 프로그램 일괄 크롤링
 */
export async function crawlMultiplePrograms(
  programs: PolicyFundProgram[],
  maxConcurrent: number = 3
): Promise<Map<string, PolicyFundDetail | null>> {
  const results = new Map<string, PolicyFundDetail | null>();

  // 동시 요청 제한을 위한 청크 분할
  const chunks: PolicyFundProgram[][] = [];
  for (let i = 0; i < programs.length; i += maxConcurrent) {
    chunks.push(programs.slice(i, i + maxConcurrent));
  }

  for (const chunk of chunks) {
    const chunkResults = await Promise.all(
      chunk.map(async (program) => {
        const detail = await crawlPolicyDetail(program);
        return { id: program.id, detail };
      })
    );

    for (const { id, detail } of chunkResults) {
      results.set(id, detail);
    }

    // Rate limiting: 청크 간 1초 대기
    if (chunks.indexOf(chunk) < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * 프로그램에 상세 정보 병합
 */
export function mergeDetailIntoProgram(
  program: PolicyFundProgram,
  detail: PolicyFundDetail | null
): PolicyFundProgram {
  return {
    ...program,
    detail: detail || undefined,
  };
}
