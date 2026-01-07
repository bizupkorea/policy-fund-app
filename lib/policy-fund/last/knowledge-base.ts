/**
 * lib/policy-fund/last/knowledge-base.ts
 *
 * /test 페이지 전용 독립 Knowledge Base
 * 4대 기관(중진공, 신보, 기보, 소진공) 정책자금 데이터 포함
 */

// types.ts에서 타입 import
import type {
  InstitutionId,
  InstitutionInfo,
  PolicyFundKnowledge,
  FundTrack,
  IndustryCategory,
  CompanyScale,
  OwnerCharacteristic,
  BusinessAgeException,
  FundingPurpose,
  EligibilityCriteria,
  SupportTerms,
} from './types';

// 기관별 자금 데이터 import
import { kosmesFunds } from './funds/kosmes-funds';
import { semasFunds } from './funds/semas-funds';
import { koditFunds } from './funds/kodit-funds';
import { kiboFunds } from './funds/kibo-funds';

// 타입 re-export
export type {
  InstitutionId,
  InstitutionInfo,
  PolicyFundKnowledge,
  FundTrack,
  IndustryCategory,
  CompanyScale,
  OwnerCharacteristic,
  BusinessAgeException,
  FundingPurpose,
  EligibilityCriteria,
  SupportTerms,
};

// ============================================================================
// 기관 정보
// ============================================================================

export const INSTITUTIONS: Record<InstitutionId, InstitutionInfo> = {
  kosmes: {
    id: 'kosmes',
    name: '중진공',
    fullName: '중소벤처기업진흥공단',
    description: '중소기업 정책자금 융자 전문 기관',
    website: 'https://www.kosmes.or.kr',
    contactNumber: '1357',
  },
  kodit: {
    id: 'kodit',
    name: '신보',
    fullName: '신용보증기금',
    description: '담보력 부족 기업에 신용보증 제공',
    website: 'https://www.kodit.co.kr',
    contactNumber: '1588-6565',
  },
  kibo: {
    id: 'kibo',
    name: '기보',
    fullName: '기술보증기금',
    description: '기술력 기반 신용보증 제공',
    website: 'https://www.kibo.or.kr',
    contactNumber: '1544-1120',
  },
  semas: {
    id: 'semas',
    name: '소진공',
    fullName: '소상공인시장진흥공단',
    description: '소상공인 정책자금 융자 전문 기관',
    website: 'https://www.semas.or.kr',
    contactNumber: '1357',
  },
  seoul_credit: {
    id: 'seoul_credit',
    name: '서울신보',
    fullName: '서울신용보증재단',
    description: '서울 소재 소기업·소상공인 신용보증',
    website: 'https://www.seoulshinbo.co.kr',
    contactNumber: '1577-6119',
  },
  gyeonggi_credit: {
    id: 'gyeonggi_credit',
    name: '경기신보',
    fullName: '경기신용보증재단',
    description: '경기도 소재 소기업·소상공인 신용보증',
    website: 'https://www.gcgf.or.kr',
    contactNumber: '1588-7365',
  },
  mss: {
    id: 'mss',
    name: '중기부',
    fullName: '중소벤처기업부',
    description: '중소기업 정책 총괄 부처',
    website: 'https://www.mss.go.kr',
    contactNumber: '1357',
  },
  motie: {
    id: 'motie',
    name: '산업부',
    fullName: '산업통상자원부',
    description: '산업기술 R&D 지원 부처',
    website: 'https://www.motie.go.kr',
    contactNumber: '1577-0900',
  },
  keiti: {
    id: 'keiti',
    name: '환경산업기술원',
    fullName: '한국환경산업기술원',
    description: '환경부 산하 환경산업 지원기관',
    website: 'https://www.keiti.re.kr',
    contactNumber: '02-2284-1114',
  },
};

// ============================================================================
// 통합 Knowledge Base
// ============================================================================

export const POLICY_FUND_KNOWLEDGE_BASE: PolicyFundKnowledge[] = [
  ...kosmesFunds,
  ...semasFunds,
  ...koditFunds,
  ...kiboFunds,
];

// ============================================================================
// 유틸리티 함수
// ============================================================================

export function getFundsByInstitution(institutionId: InstitutionId): PolicyFundKnowledge[] {
  return POLICY_FUND_KNOWLEDGE_BASE.filter(fund => fund.institutionId === institutionId);
}

export function getFundsByType(type: 'loan' | 'guarantee' | 'grant'): PolicyFundKnowledge[] {
  return POLICY_FUND_KNOWLEDGE_BASE.filter(fund => fund.type === type);
}

export function getFundById(id: string): PolicyFundKnowledge | undefined {
  return POLICY_FUND_KNOWLEDGE_BASE.find(fund => fund.id === id);
}

export function getAllFunds(): PolicyFundKnowledge[] {
  return POLICY_FUND_KNOWLEDGE_BASE;
}

export function getInstitutionInfo(id: InstitutionId): InstitutionInfo {
  return INSTITUTIONS[id];
}
