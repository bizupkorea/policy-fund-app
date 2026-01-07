/**
 * lib/policy-fund/last/matcher/converter.ts
 *
 * 프로필 변환 함수
 * ExtendedCompanyProfile → CompanyProfile 변환
 */

import type {
  ExtendedCompanyProfile,
  CompanyProfile,
  CompanyScale,
  OwnerCharacteristic,
  IndustryCategory,
} from '../types';

// ============================================================================
// 업종 매핑
// ============================================================================

const INDUSTRY_MAP: Record<string, IndustryCategory> = {
  'manufacturing_general': 'manufacturing',
  'manufacturing_root': 'manufacturing',
  'it_software': 'it_service',
  'it_hardware': 'manufacturing',
  'knowledge_service': 'it_service',
  'bio_healthcare': 'manufacturing',
  'future_mobility': 'manufacturing',
  'culture_content': 'it_service',
  'construction_energy': 'construction',
  'wholesale_retail': 'wholesale_retail',
  'tourism_food': 'food_service',
  'other_service': 'other_service',
  // 한글 매핑
  '제조': 'manufacturing',
  'IT': 'it_service',
  '도소매': 'wholesale_retail',
  '음식': 'food_service',
  '건설': 'construction',
  '물류': 'logistics',
};

// ============================================================================
// 업종 변환
// ============================================================================

function convertIndustry(companyIndustry: string): IndustryCategory {
  if (INDUSTRY_MAP[companyIndustry]) {
    return INDUSTRY_MAP[companyIndustry];
  }

  const lowerIndustry = companyIndustry.toLowerCase();
  for (const [key, value] of Object.entries(INDUSTRY_MAP)) {
    if (lowerIndustry.includes(key)) {
      return value;
    }
  }

  return 'other_service';
}

// ============================================================================
// 인증 정보 추출
// ============================================================================

function extractCertifications(profile: ExtendedCompanyProfile): CompanyScale[] {
  const certifications: CompanyScale[] = [];

  if (profile.isVentureCompany) certifications.push('venture');
  if (profile.isInnobiz) certifications.push('innobiz');
  if (profile.isMainbiz) certifications.push('mainbiz');
  if (profile.companySize === 'startup' || profile.companySize === 'small') {
    certifications.push('small');
  }

  return certifications;
}

// ============================================================================
// 대표자 특성 추출
// ============================================================================

function extractOwnerCharacteristics(profile: ExtendedCompanyProfile): OwnerCharacteristic[] | undefined {
  const characteristics: OwnerCharacteristic[] = [];

  if (profile.isYouthCompany) characteristics.push('youth');
  if (profile.isFemale) characteristics.push('female');
  if (profile.isDisabled || profile.isDisabledStandard) characteristics.push('disabled');

  return characteristics.length > 0 ? characteristics : undefined;
}

// ============================================================================
// 메인 변환 함수
// ============================================================================

/**
 * ExtendedCompanyProfile을 CompanyProfile로 변환
 */
export function convertToKBProfile(profile: ExtendedCompanyProfile): CompanyProfile {
  const companyIndustry = profile.industryName || profile.industry || '';
  const industry = convertIndustry(companyIndustry);

  return {
    companyName: profile.companyName,
    businessNumber: profile.businessNumber,
    businessAge: profile.businessAge,
    annualRevenue: profile.revenue ? profile.revenue * 100000000 : undefined,
    employeeCount: profile.employeeCount,
    industry,
    industryDetail: profile.industryName || profile.industry,
    region: profile.region || profile.location,
    certifications: extractCertifications(profile),
    ownerCharacteristics: extractOwnerCharacteristics(profile),
    hasTaxDelinquency: profile.hasTaxDelinquency,
    hasBankDelinquency: false,
    isInactive: false,
    hasCreditIssue: false,
    hasExportExperience: profile.hasExportRevenue,
    hasTechAssets: profile.hasRndActivity,
    isEmergencySituation: false,
    businessAgeExceptions: profile.businessAgeExceptions,
    isRestart: profile.isRestart,
  };
}

// ============================================================================
// 기업규모 매핑
// ============================================================================

export const SIZE_MAP: Record<string, CompanyScale> = {
  'startup': 'small',
  'small': 'small',
  'medium': 'medium',
  'large': 'medium',
  'micro': 'micro',
  'venture': 'venture',
  'innobiz': 'innobiz',
  'mainbiz': 'mainbiz',
};

/**
 * 기업 규모 문자열을 CompanyScale로 변환
 */
export function normalizeCompanySize(size: string | undefined): CompanyScale {
  if (!size) return 'small';
  return SIZE_MAP[size] || 'small';
}
