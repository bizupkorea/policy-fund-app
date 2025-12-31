'use client';

import { useState, useCallback } from 'react';
import { Play, RotateCcw, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { matchWithKnowledgeBase, ExtendedCompanyProfile, DetailedMatchResult } from '@/lib/policy-fund/matching-engine';

// ============================================================================
// 타입 정의
// ============================================================================

interface TestProfile {
  // 기본 정보
  companyName: string;
  industry:
    | 'manufacturing_general'    // 제조업 (일반)
    | 'manufacturing_root'       // 제조업 (뿌리/소부장) - 정부 우대
    | 'it_software'              // IT/정보통신 (SW)
    | 'it_hardware'              // IT/정보통신 (HW)
    | 'knowledge_service'        // 지식서비스업
    | 'bio_healthcare'           // 바이오/헬스케어
    | 'future_mobility'          // 미래차/로봇/드론
    | 'culture_content'          // 문화/콘텐츠
    | 'construction_energy'      // 건설/환경/에너지
    | 'wholesale_retail'         // 도소매/유통
    | 'tourism_food'             // 관광/숙박/음식
    | 'other_service';           // 기타 서비스업
  location: string;
  establishedYear: number;

  // 재무 정보
  annualRevenue: number; // 억원
  employeeCount: number;
  debtRatio: number;

  // 인증 정보
  isVenture: boolean;
  isInnobiz: boolean;
  isMainbiz: boolean;
  hasPatent: boolean;
  hasResearchInstitute: boolean;
  hasExportRecord: boolean;

  // 대표자 정보
  ceoAge: number;
  isFemale: boolean;
  isDisabled: boolean;

  // 제약 조건
  hasTaxDelinquency: boolean;
  existingLoanBalance: number; // 억원
  isRestart: boolean; // 재창업 여부

  // 정책자금 이용 이력
  kosmesPreviousCount: number;  // 중진공 누적 이용 횟수 (졸업제 체크)
  currentGuaranteeOrg: 'none' | 'kodit' | 'kibo' | 'both';  // 현재 이용 중인 보증기관
  recentYearSubsidyAmount: number;  // 최근 1년 정책자금 수혜액 (억원)
  hasPastDefault: boolean;  // 과거 부실/사고 이력

  // 업력 예외 조건 (청년전용창업자금 업력 7년 확대)
  isYouthStartupAcademyGrad: boolean; // 청년창업사관학교 졸업
  isGlobalStartupAcademyGrad: boolean; // 글로벌창업사관학교 졸업
  hasKiboYouthGuarantee: boolean; // 기보 청년창업우대보증 지원

  // 성장 전략 및 투자 계획
  hasIpoOrInvestmentPlan: boolean;  // IPO/투자유치 계획
  acceptsEquityDilution: boolean;   // 지분 희석 감수 가능
  needsLargeFunding: boolean;       // 대규모 자금 필요 (5억+)
  requiredFundingAmount: number;    // 필요 자금 (억원)
  fundingPurpose: 'working' | 'facility' | 'both';  // 자금 용도
}

interface PresetScenario {
  id: string;
  name: string;
  description: string;
  emoji: string;
  profile: TestProfile;
}

// ============================================================================
// 프리셋 시나리오 정의
// ============================================================================

const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'youth-venture',
    name: '청년 벤처',
    description: '청년창업 제조 벤처기업',
    emoji: '🚀',
    profile: {
      companyName: '(주)청년테크',
      industry: 'manufacturing_general',
      location: '경기',
      establishedYear: 2022,
      annualRevenue: 25,
      employeeCount: 15,
      debtRatio: 50,
      isVenture: true,
      isInnobiz: false,
      isMainbiz: false,
      hasPatent: true,
      hasResearchInstitute: false,
      hasExportRecord: false,
      ceoAge: 32,
      isFemale: false,
      isDisabled: false,
      hasTaxDelinquency: false,
      existingLoanBalance: 0,
      isRestart: false,
      kosmesPreviousCount: 0,
      currentGuaranteeOrg: 'none',
      recentYearSubsidyAmount: 0,
      hasPastDefault: false,
      isYouthStartupAcademyGrad: false,
      isGlobalStartupAcademyGrad: false,
      hasKiboYouthGuarantee: false,
      hasIpoOrInvestmentPlan: false,
      acceptsEquityDilution: false,
      needsLargeFunding: false,
      requiredFundingAmount: 3,
          fundingPurpose: 'both',
    },
  },
  {
    id: 'youth-academy-grad',
    name: '청창사 졸업',
    description: '청년창업사관학교 졸업 기업 (업력 5년)',
    emoji: '🎓',
    profile: {
      companyName: '(주)청창사테크',
      industry: 'it_software',
      location: '서울',
      establishedYear: 2020,  // 업력 5년
      annualRevenue: 15,
      employeeCount: 8,
      debtRatio: 40,
      isVenture: true,
      isInnobiz: false,
      isMainbiz: false,
      hasPatent: true,
      hasResearchInstitute: false,
      hasExportRecord: false,
      ceoAge: 34,
      isFemale: false,
      isDisabled: false,
      hasTaxDelinquency: false,
      existingLoanBalance: 0,
      isRestart: false,
      kosmesPreviousCount: 0,
      currentGuaranteeOrg: 'none',
      recentYearSubsidyAmount: 0,
      hasPastDefault: false,
      isYouthStartupAcademyGrad: true,  // 청창사 졸업 예외 적용
      isGlobalStartupAcademyGrad: false,
      hasKiboYouthGuarantee: false,
      hasIpoOrInvestmentPlan: false,
      acceptsEquityDilution: false,
      needsLargeFunding: false,
      requiredFundingAmount: 5,
          fundingPurpose: 'both',
    },
  },
  {
    id: 'micro-enterprise',
    name: '소공인',
    description: '10인 미만 제조 가공업체',
    emoji: '🔧',
    profile: {
      companyName: '(주)정밀가공',
      industry: 'manufacturing_root',
      location: '서울',
      establishedYear: 2017,
      annualRevenue: 3,
      employeeCount: 5,
      debtRatio: 30,
      isVenture: false,
      isInnobiz: false,
      isMainbiz: false,
      hasPatent: false,
      hasResearchInstitute: false,
      hasExportRecord: false,
      ceoAge: 50,
      isFemale: false,
      isDisabled: false,
      hasTaxDelinquency: false,
      existingLoanBalance: 0,
      isRestart: false,
      kosmesPreviousCount: 0,
      currentGuaranteeOrg: 'none',
      recentYearSubsidyAmount: 0,
      hasPastDefault: false,
      isYouthStartupAcademyGrad: false,
      isGlobalStartupAcademyGrad: false,
      hasKiboYouthGuarantee: false,
      hasIpoOrInvestmentPlan: false,
      acceptsEquityDilution: false,
      needsLargeFunding: false,
      requiredFundingAmount: 1,
          fundingPurpose: 'both',
    },
  },
  {
    id: 'export-company',
    name: '수출기업',
    description: '수출 실적 보유 제조기업',
    emoji: '🌏',
    profile: {
      companyName: '(주)글로벌테크',
      industry: 'manufacturing_general',
      location: '인천',
      establishedYear: 2018,
      annualRevenue: 100,
      employeeCount: 80,
      debtRatio: 80,
      isVenture: false,
      isInnobiz: true,
      isMainbiz: false,
      hasPatent: true,
      hasResearchInstitute: false,
      hasExportRecord: true,
      ceoAge: 48,
      isFemale: false,
      isDisabled: false,
      hasTaxDelinquency: false,
      existingLoanBalance: 5,
      isRestart: false,
      kosmesPreviousCount: 0,
      currentGuaranteeOrg: 'none',
      recentYearSubsidyAmount: 0,
      hasPastDefault: false,
      isYouthStartupAcademyGrad: false,
      isGlobalStartupAcademyGrad: false,
      hasKiboYouthGuarantee: false,
      hasIpoOrInvestmentPlan: false,
      acceptsEquityDilution: false,
      needsLargeFunding: false,
      requiredFundingAmount: 5,
          fundingPurpose: 'both',
    },
  },
  {
    id: 'rnd-company',
    name: 'R&D 기업',
    description: '연구개발 중심 기술기업',
    emoji: '🔬',
    profile: {
      companyName: '(주)테크연구소',
      industry: 'knowledge_service',
      location: '대전',
      establishedYear: 2020,
      annualRevenue: 30,
      employeeCount: 25,
      debtRatio: 40,
      isVenture: true,
      isInnobiz: false,
      isMainbiz: false,
      hasPatent: true,
      hasResearchInstitute: true,
      hasExportRecord: false,
      ceoAge: 42,
      isFemale: false,
      isDisabled: false,
      hasTaxDelinquency: false,
      existingLoanBalance: 2,
      isRestart: false,
      kosmesPreviousCount: 0,
      currentGuaranteeOrg: 'none',
      recentYearSubsidyAmount: 0,
      hasPastDefault: false,
      isYouthStartupAcademyGrad: false,
      isGlobalStartupAcademyGrad: false,
      hasKiboYouthGuarantee: false,
      hasIpoOrInvestmentPlan: false,
      acceptsEquityDilution: false,
      needsLargeFunding: false,
      requiredFundingAmount: 10,
          fundingPurpose: 'both',
    },
  },
  {
    id: 'smart-factory',
    name: '스마트공장',
    description: '스마트공장 추진 제조기업',
    emoji: '🏭',
    profile: {
      companyName: '(주)스마트제조',
      industry: 'manufacturing_root',
      location: '경기',
      establishedYear: 2015,
      annualRevenue: 80,
      employeeCount: 60,
      debtRatio: 70,
      isVenture: false,
      isInnobiz: false,
      isMainbiz: true,
      hasPatent: false,
      hasResearchInstitute: false,
      hasExportRecord: false,
      ceoAge: 55,
      isFemale: false,
      isDisabled: false,
      hasTaxDelinquency: false,
      existingLoanBalance: 10,
      isRestart: false,
      kosmesPreviousCount: 0,
      currentGuaranteeOrg: 'none',
      recentYearSubsidyAmount: 0,
      hasPastDefault: false,
      isYouthStartupAcademyGrad: false,
      isGlobalStartupAcademyGrad: false,
      hasKiboYouthGuarantee: false,
      hasIpoOrInvestmentPlan: false,
      acceptsEquityDilution: false,
      needsLargeFunding: false,
      requiredFundingAmount: 8,
          fundingPurpose: 'both',
    },
  },
  {
    id: 'restart-company',
    name: '재창업',
    description: '성실실패 후 재도전 기업',
    emoji: '🔄',
    profile: {
      companyName: '(주)재도전',
      industry: 'manufacturing_general',
      location: '서울',
      establishedYear: 2023,
      annualRevenue: 5,
      employeeCount: 8,
      debtRatio: 60,
      isVenture: false,
      isInnobiz: false,
      isMainbiz: false,
      hasPatent: false,
      hasResearchInstitute: false,
      hasExportRecord: false,
      ceoAge: 35,
      isFemale: false,
      isDisabled: false,
      hasTaxDelinquency: false,
      existingLoanBalance: 0,
      isRestart: true,
      kosmesPreviousCount: 0,
      currentGuaranteeOrg: 'none',
      recentYearSubsidyAmount: 0,
      hasPastDefault: false,
      isYouthStartupAcademyGrad: false,
      isGlobalStartupAcademyGrad: false,
      hasKiboYouthGuarantee: false,
      hasIpoOrInvestmentPlan: false,
      acceptsEquityDilution: false,
      needsLargeFunding: false,
      requiredFundingAmount: 3,
          fundingPurpose: 'both',
    },
  },
  {
    id: 'crisis-company',
    name: '위기기업',
    description: '체납/연체 있는 기업 (제외 케이스)',
    emoji: '⚠️',
    profile: {
      companyName: '(주)경영위기',
      industry: 'manufacturing_general',
      location: '경기',
      establishedYear: 2020,
      annualRevenue: 20,
      employeeCount: 20,
      debtRatio: 200,
      isVenture: false,
      isInnobiz: false,
      isMainbiz: false,
      hasPatent: false,
      hasResearchInstitute: false,
      hasExportRecord: false,
      ceoAge: 45,
      isFemale: false,
      isDisabled: false,
      hasTaxDelinquency: true,
      existingLoanBalance: 15,
      isRestart: false,
      kosmesPreviousCount: 0,
      currentGuaranteeOrg: 'none',
      recentYearSubsidyAmount: 0,
      hasPastDefault: false,
      isYouthStartupAcademyGrad: false,
      isGlobalStartupAcademyGrad: false,
      hasKiboYouthGuarantee: false,
      hasIpoOrInvestmentPlan: false,
      acceptsEquityDilution: false,
      needsLargeFunding: false,
      requiredFundingAmount: 2,
          fundingPurpose: 'both',
    },
  },
];

// 업종 옵션 (정책자금 우대 산업 기준 세분화)
const INDUSTRY_OPTIONS = [
  { value: 'manufacturing_general', label: '제조업 (일반)', desc: '식음료, 의류, 가구 등' },
  { value: 'manufacturing_root', label: '제조업 (뿌리/소부장)', desc: '금형, 주조, 용접, 소재, 부품, 장비 - 정부 우대' },
  { value: 'it_software', label: 'IT/정보통신 (SW)', desc: '소프트웨어, 앱, SI, 플랫폼' },
  { value: 'it_hardware', label: 'IT/정보통신 (HW)', desc: '반도체, 통신장비, 전자부품' },
  { value: 'knowledge_service', label: '지식서비스업', desc: '디자인, 컨설팅, R&D, 광고' },
  { value: 'bio_healthcare', label: '바이오/헬스케어', desc: '의약품, 의료기기, 화장품, 건기식' },
  { value: 'future_mobility', label: '미래차/로봇/드론', desc: '자율주행, 전기차부품, 로봇' },
  { value: 'culture_content', label: '문화/콘텐츠', desc: '게임, 영상, 웹툰, 출판' },
  { value: 'construction_energy', label: '건설/환경/에너지', desc: '전문건설, 태양광, 친환경' },
  { value: 'wholesale_retail', label: '도소매/유통', desc: '일반 도소매, 전자상거래' },
  { value: 'tourism_food', label: '관광/숙박/음식', desc: '숙박업, 음식점, 여행업' },
  { value: 'other_service', label: '기타 서비스업', desc: '그 외 서비스' },
];

// 지역 옵션
const REGION_OPTIONS = [
  '서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종',
  '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

// 기관별 색상
const institutionColors: Record<string, { bg: string; text: string }> = {
  kosmes: { bg: 'bg-blue-100', text: 'text-blue-800' },
  kodit: { bg: 'bg-green-100', text: 'text-green-800' },
  kibo: { bg: 'bg-purple-100', text: 'text-purple-800' },
  semas: { bg: 'bg-orange-100', text: 'text-orange-800' },
  seoul_credit: { bg: 'bg-red-100', text: 'text-red-800' },
  gyeonggi_credit: { bg: 'bg-teal-100', text: 'text-teal-800' },
  mss: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  motie: { bg: 'bg-cyan-100', text: 'text-cyan-800' },
};

const institutionNames: Record<string, string> = {
  kosmes: '중진공',
  kodit: '신보',
  kibo: '기보',
  semas: '소진공',
  seoul_credit: '서울신보',
  gyeonggi_credit: '경기신보',
  mss: '중기부',
  motie: '산업부',
};

// ============================================================================
// 메인 컴포넌트
// ============================================================================

export default function TestPage() {
  // 상태
  const [profile, setProfile] = useState<TestProfile>(PRESET_SCENARIOS[0].profile);
  const [results, setResults] = useState<DetailedMatchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('youth-venture');
  const [showAllResults, setShowAllResults] = useState(false);

  // 업력 계산
  const businessAge = new Date().getFullYear() - profile.establishedYear;

  // 기업 규모 분류
  const getCompanySize = (): 'startup' | 'small' | 'medium' | 'large' => {
    if (profile.employeeCount < 5) return 'startup';
    if (profile.employeeCount < 50) return 'small';
    if (profile.employeeCount < 300) return 'medium';
    return 'large';
  };

  // 프리셋 선택
  const handlePresetSelect = (preset: PresetScenario) => {
    setProfile(preset.profile);
    setSelectedPreset(preset.id);
    setResults([]);
  };

  // 입력값 변경
  const updateProfile = (key: keyof TestProfile, value: any) => {
    setProfile(prev => ({ ...prev, [key]: value }));
    setSelectedPreset('');
  };

  // 매칭 실행
  const runMatching = useCallback(async () => {
    setIsLoading(true);
    try {
      // ExtendedCompanyProfile로 변환
      const extendedProfile: ExtendedCompanyProfile = {
        companyName: profile.companyName,
        businessNumber: '000-00-00000',
        companySize: getCompanySize(),
        businessAge: businessAge,
        industry: INDUSTRY_OPTIONS.find(i => i.value === profile.industry)?.label || '제조업',
        location: profile.location,
        annualRevenue: profile.annualRevenue * 100000000, // 억 → 원
        employeeCount: profile.employeeCount,
        hasExportRevenue: profile.hasExportRecord,
        hasRndActivity: profile.hasResearchInstitute || profile.hasPatent,
        isVentureCompany: profile.isVenture,
        isInnobiz: profile.isInnobiz,
        isMainbiz: profile.isMainbiz,
        // Extended fields
        revenue: profile.annualRevenue,
        industryName: INDUSTRY_OPTIONS.find(i => i.value === profile.industry)?.label || '제조업',
        region: profile.location,
        hasTaxDelinquency: profile.hasTaxDelinquency,
        hasPreviousSupport: false,
        isYouthCompany: profile.ceoAge <= 39,
        hasExistingLoan: profile.existingLoanBalance > 0,
        // 업력 예외 조건 (청년전용창업자금 업력 7년 확대)
        businessAgeExceptions: [
          ...(profile.isYouthStartupAcademyGrad ? ['youth_startup_academy' as const] : []),
          ...(profile.isGlobalStartupAcademyGrad ? ['global_startup_academy' as const] : []),
          ...(profile.hasKiboYouthGuarantee ? ['kibo_youth_guarantee' as const] : []),
        ],
        // 성장 전략 및 투자 계획
        hasIpoOrInvestmentPlan: profile.hasIpoOrInvestmentPlan,
        acceptsEquityDilution: profile.acceptsEquityDilution,
        needsLargeFunding: profile.needsLargeFunding,
        requiredFundingAmount: profile.requiredFundingAmount,
        // 자금 용도
        requestedFundingPurpose: profile.fundingPurpose,
        // 정책자금 이용 이력
        kosmesPreviousCount: profile.kosmesPreviousCount,
        currentGuaranteeOrg: profile.currentGuaranteeOrg,
        existingLoanBalance: profile.existingLoanBalance,
        recentYearSubsidyAmount: profile.recentYearSubsidyAmount,
        hasPastDefault: profile.hasPastDefault,
      };

      const result = await matchWithKnowledgeBase(extendedProfile, {
        useAI: false,
        topN: 30,
      });

      setResults(result.results);
    } catch (error) {
      console.error('매칭 실행 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, [profile, businessAge]);

  // 결과 통계
  const highCount = results.filter(r => r.level === 'high').length;
  const mediumCount = results.filter(r => r.level === 'medium').length;
  const lowCount = results.filter(r => r.level === 'low').length;

  // 표시할 결과
  const displayResults = showAllResults ? results : results.slice(0, 10);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">정책자금 매칭 테스트</h1>
          <p className="text-gray-600 mt-1">다양한 기업 조건을 설정하여 매칭 결과를 테스트합니다</p>
        </div>

        {/* 프리셋 버튼 */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">테스트 시나리오 프리셋</h3>
          <div className="flex flex-wrap gap-2">
            {PRESET_SCENARIOS.map(preset => (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedPreset === preset.id
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="mr-1.5">{preset.emoji}</span>
                {preset.name}
              </button>
            ))}
          </div>
          {selectedPreset && (
            <p className="text-xs text-gray-500 mt-2">
              {PRESET_SCENARIOS.find(p => p.id === selectedPreset)?.description}
            </p>
          )}
        </div>

        {/* 메인 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 왼쪽: 입력 패널 */}
          <div className="space-y-4">
            {/* 기본 정보 */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">1</span>
                기본 정보
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">업종</label>
                  <select
                    value={profile.industry}
                    onChange={e => updateProfile('industry', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {INDUSTRY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">지역</label>
                  <select
                    value={profile.location}
                    onChange={e => updateProfile('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {REGION_OPTIONS.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    설립연도 <span className="text-orange-500">(업력: {businessAge}년)</span>
                  </label>
                  <input
                    type="number"
                    value={profile.establishedYear}
                    onChange={e => updateProfile('establishedYear', parseInt(e.target.value) || 2020)}
                    min={1950}
                    max={2025}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* 재무 정보 */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs">2</span>
                재무 정보
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-gray-600">연매출</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={profile.annualRevenue}
                        onChange={e => updateProfile('annualRevenue', Math.max(0, Math.min(500, parseFloat(e.target.value) || 0)))}
                        min={0}
                        max={500}
                        step={0.5}
                        className="w-20 px-2 py-1 text-sm text-right border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                      />
                      <span className="text-xs text-gray-500">억원</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    value={profile.annualRevenue}
                    onChange={e => updateProfile('annualRevenue', parseFloat(e.target.value))}
                    min={0}
                    max={500}
                    step={0.5}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0</span>
                    <span>500억</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-gray-600">
                      직원수 <span className="text-gray-400">({getCompanySize() === 'startup' ? '소공인' : getCompanySize() === 'small' ? '소기업' : getCompanySize() === 'medium' ? '중기업' : '중견기업'})</span>
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={profile.employeeCount}
                        onChange={e => updateProfile('employeeCount', Math.max(1, Math.min(300, parseInt(e.target.value) || 1)))}
                        min={1}
                        max={300}
                        className="w-20 px-2 py-1 text-sm text-right border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                      />
                      <span className="text-xs text-gray-500">명</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    value={profile.employeeCount}
                    onChange={e => updateProfile('employeeCount', parseInt(e.target.value))}
                    min={1}
                    max={300}
                    step={1}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>1명</span>
                    <span>300명</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-gray-600">부채비율</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={profile.debtRatio}
                        onChange={e => updateProfile('debtRatio', Math.max(0, Math.min(500, parseInt(e.target.value) || 0)))}
                        min={0}
                        max={500}
                        className="w-20 px-2 py-1 text-sm text-right border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                      />
                      <span className="text-xs text-gray-500">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    value={profile.debtRatio}
                    onChange={e => updateProfile('debtRatio', parseInt(e.target.value))}
                    min={0}
                    max={300}
                    step={10}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* 인증 정보 */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs">3</span>
                인증/자격 정보
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'isVenture', label: '벤처기업 인증' },
                  { key: 'isInnobiz', label: '이노비즈 인증' },
                  { key: 'isMainbiz', label: '메인비즈 인증' },
                  { key: 'hasPatent', label: '특허 보유' },
                  { key: 'hasResearchInstitute', label: '기업부설연구소' },
                  { key: 'hasExportRecord', label: '수출 실적' },
                  { key: 'isFemale', label: '여성기업 인증' },
                ].map(cert => (
                  <label key={cert.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile[cert.key as keyof TestProfile] as boolean}
                      onChange={e => updateProfile(cert.key as keyof TestProfile, e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">{cert.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 대표자 정보 */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xs">4</span>
                대표자 정보
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    대표자 나이 <span className="text-orange-500 font-bold">{profile.ceoAge}세</span>
                    {profile.ceoAge <= 39 && <span className="ml-2 text-green-600">(청년)</span>}
                  </label>
                  <input
                    type="range"
                    value={profile.ceoAge}
                    onChange={e => updateProfile('ceoAge', parseInt(e.target.value))}
                    min={20}
                    max={70}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.isFemale}
                      onChange={e => updateProfile('isFemale', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">여성 대표</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.isDisabled}
                      onChange={e => updateProfile('isDisabled', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">장애인 대표</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 업력 예외 조건 (청년전용창업자금) */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs">5</span>
                업력 예외 조건
                <span className="text-xs text-gray-400 font-normal">(청년전용창업자금 업력 7년 확대)</span>
              </h3>
              <div className="space-y-3">
                <p className="text-xs text-gray-500 bg-indigo-50 p-2 rounded-lg">
                  아래 조건 해당 시, 청년전용창업자금 업력 제한이 3년 → 7년으로 완화됩니다.
                </p>
                {[
                  { key: 'isYouthStartupAcademyGrad', label: '청년창업사관학교 졸업', desc: '중진공 청년창업사관학교 수료 기업' },
                  { key: 'isGlobalStartupAcademyGrad', label: '글로벌창업사관학교 졸업', desc: '중진공 글로벌창업사관학교 수료 기업' },
                  { key: 'hasKiboYouthGuarantee', label: '기보 청년창업우대보증 지원', desc: '기술보증기금 청년창업우대보증 기이용 기업' },
                ].map(item => (
                  <label key={item.key} className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={profile[item.key as keyof TestProfile] as boolean}
                      onChange={e => updateProfile(item.key as keyof TestProfile, e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded border-gray-300 text-indigo-500 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">{item.label}</span>
                      <p className="text-xs text-gray-400">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 성장 전략 및 투자 계획 */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center text-xs">6</span>
                성장 전략 및 투자 계획
              </h3>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={profile.hasIpoOrInvestmentPlan}
                    onChange={e => updateProfile('hasIpoOrInvestmentPlan', e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">IPO(상장) 또는 외부 투자 유치 계획 있음</span>
                    <p className="text-xs text-gray-400 mt-0.5">VC, 엔젤투자, 시리즈 투자 등</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={profile.acceptsEquityDilution}
                    onChange={e => updateProfile('acceptsEquityDilution', e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">대규모 자금 조달을 위해 지분 희석 감수 가능</span>
                    <p className="text-xs text-gray-400 mt-0.5">CB(전환사채), RCPS(상환전환우선주) 등 주식 전환 조건 수용</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={profile.needsLargeFunding}
                    onChange={e => updateProfile('needsLargeFunding', e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">대규모 자금 필요 (5억원 이상)</span>
                    <p className="text-xs text-gray-400 mt-0.5">P-CBO, 유동화 보증 등 대형 자금조달 상품 검토</p>
                  </div>
                </label>
                <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">필요 자금</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={profile.requiredFundingAmount}
                        onChange={e => {
                          const amount = Number(e.target.value);
                          setProfile(prev => ({
                            ...prev,
                            requiredFundingAmount: amount,
                            needsLargeFunding: amount >= 5
                          }));
                        }}
                        min="0"
                        max="1000"
                        className="w-24 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      />
                      <span className="text-sm text-gray-600">억원</span>
                    </div>
                    <p className="text-xs text-gray-400 ml-auto">5억 이상 입력 시 대규모 자금 자동 체크</p>
                  </div>
                </div>
                {/* 자금 용도 선택 */}
                <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">자금 용도</label>
                    <div className="flex gap-3">
                      {[
                        { value: 'working', label: '운전자금', desc: '원자재, 인건비, 마케팅 등' },
                        { value: 'facility', label: '시설자금', desc: '설비, 공장, 장비 구매' },
                        { value: 'both', label: '둘 다', desc: '운전 + 시설' },
                      ].map(option => (
                        <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="fundingPurpose"
                            value={option.value}
                            checked={profile.fundingPurpose === option.value}
                            onChange={e => updateProfile('fundingPurpose', e.target.value as 'working' | 'facility' | 'both')}
                            className="w-4 h-4 text-cyan-500 focus:ring-cyan-500"
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-700">{option.label}</span>
                            <p className="text-xs text-gray-400">{option.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 제약 조건 */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs">7</span>
                제약 조건
              </h3>
              <div className="space-y-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.hasTaxDelinquency}
                    onChange={e => updateProfile('hasTaxDelinquency', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">세금 체납 있음</span>
                  {profile.hasTaxDelinquency && (
                    <span className="text-xs text-red-500 font-medium">⚠️ 대부분 자금 불가</span>
                  )}
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.isRestart}
                    onChange={e => updateProfile('isRestart', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">재창업 기업</span>
                </label>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    기존 대출 잔액 <span className="text-orange-500 font-bold">{profile.existingLoanBalance}억원</span>
                    {profile.existingLoanBalance >= 15 && <span className="text-red-500 ml-2">⚠️ 한도 초과 우려</span>}
                    {profile.existingLoanBalance >= 10 && profile.existingLoanBalance < 15 && <span className="text-orange-500 ml-2">⚠️ 한도 근접</span>}
                  </label>
                  <input
                    type="range"
                    value={profile.existingLoanBalance}
                    onChange={e => updateProfile('existingLoanBalance', parseInt(e.target.value))}
                    min={0}
                    max={50}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                </div>
                {/* 중진공 이용 횟수 */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    중진공 정책자금 이용 횟수 <span className="text-orange-500 font-bold">{profile.kosmesPreviousCount}회</span>
                    {profile.kosmesPreviousCount >= 4 && <span className="text-red-500 ml-2">⚠️ 졸업제 해당</span>}
                  </label>
                  <input
                    type="range"
                    value={profile.kosmesPreviousCount}
                    onChange={e => updateProfile('kosmesPreviousCount', parseInt(e.target.value))}
                    min={0}
                    max={10}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                </div>
                {/* 보증기관 이용 현황 */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    현재 이용 중인 보증기관
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'none', label: '없음' },
                      { value: 'kodit', label: '신용보증기금' },
                      { value: 'kibo', label: '기술보증기금' },
                      { value: 'both', label: '둘 다' },
                    ].map(opt => (
                      <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="guaranteeOrg"
                          value={opt.value}
                          checked={profile.currentGuaranteeOrg === opt.value}
                          onChange={e => updateProfile('currentGuaranteeOrg', e.target.value as typeof profile.currentGuaranteeOrg)}
                          className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  {profile.currentGuaranteeOrg !== 'none' && (
                    <p className="text-xs text-orange-500 mt-1">⚠️ 타 보증기관 자금 신청 시 중복 보증 제한</p>
                  )}
                </div>
                {/* 최근 1년 수혜액 */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    최근 1년 수혜액 <span className="text-orange-500 font-bold">{profile.recentYearSubsidyAmount}억원</span>
                    {profile.annualRevenue > 0 && profile.recentYearSubsidyAmount > 0 && (
                      <span className={`ml-2 ${(profile.recentYearSubsidyAmount / profile.annualRevenue) > 0.5 ? 'text-red-500' : (profile.recentYearSubsidyAmount / profile.annualRevenue) > 0.33 ? 'text-orange-500' : 'text-green-500'}`}>
                        (매출대비 {Math.round((profile.recentYearSubsidyAmount / profile.annualRevenue) * 100)}%)
                      </span>
                    )}
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    step={0.5}
                    value={profile.recentYearSubsidyAmount}
                    onChange={e => updateProfile('recentYearSubsidyAmount', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  {profile.annualRevenue > 0 && profile.recentYearSubsidyAmount / profile.annualRevenue > 0.33 && (
                    <p className="text-xs text-orange-500 mt-1">⚠️ 매출 대비 수혜액 비율 주의 (33% 초과 시 감점)</p>
                  )}
                </div>
                {/* 부실/사고 이력 */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.hasPastDefault}
                    onChange={e => updateProfile('hasPastDefault', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">과거 부실/사고 이력</span>
                  <span className="text-xs text-gray-500">(보증사고, 대출연체 등)</span>
                </label>
                {profile.hasPastDefault && (
                  <p className="text-xs text-orange-500 ml-6">⚠️ 일반자금 감점, 재창업/재기자금은 우대</p>
                )}
              </div>
            </div>

            {/* 매칭 실행 버튼 */}
            <button
              onClick={runMatching}
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  매칭 분석 중...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  매칭 실행
                </>
              )}
            </button>
          </div>

          {/* 오른쪽: 결과 패널 */}
          <div className="space-y-4">
            {/* 결과 요약 */}
            {results.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-4">매칭 결과 요약</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-600">{highCount}</div>
                    <div className="text-xs text-green-700">HIGH</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{mediumCount}</div>
                    <div className="text-xs text-yellow-700">MEDIUM</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-red-600">{lowCount}</div>
                    <div className="text-xs text-red-700">LOW</div>
                  </div>
                </div>
              </div>
            )}

            {/* 결과 목록 */}
            {results.length > 0 ? (
              <div className="space-y-3">
                {displayResults.map((result, idx) => (
                  <ResultCard key={result.fundId} result={result} rank={idx + 1} />
                ))}

                {results.length > 10 && (
                  <button
                    onClick={() => setShowAllResults(!showAllResults)}
                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    {showAllResults ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        접기
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        나머지 {results.length - 10}개 더보기
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">매칭 결과가 여기에 표시됩니다</h3>
                <p className="text-sm text-gray-500">
                  왼쪽에서 기업 조건을 설정하고<br />
                  &apos;매칭 실행&apos; 버튼을 클릭하세요
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 결과 카드 컴포넌트
// ============================================================================

function ResultCard({ result, rank }: { result: DetailedMatchResult; rank: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const colors = institutionColors[result.institutionId] || institutionColors.kosmes;
  const instName = institutionNames[result.institutionId] || result.institutionId;

  const levelColors = {
    high: { bg: 'bg-green-500', text: '높음', border: 'border-green-200' },
    medium: { bg: 'bg-yellow-500', text: '보통', border: 'border-yellow-200' },
    low: { bg: 'bg-red-500', text: '낮음', border: 'border-red-200' },
  };
  const level = levelColors[result.level];

  return (
    <div className={`bg-white rounded-xl shadow-sm border ${level.border} overflow-hidden`}>
      {/* 헤더 */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start gap-3">
          {/* 순위 */}
          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {rank}
          </div>

          {/* 내용 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${colors.bg} ${colors.text}`}>
                {instName}
              </span>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${level.bg}`} />
                <span className="text-xs text-gray-500">{level.text}</span>
              </div>
              <span className="text-lg font-bold text-gray-900 ml-auto">{result.score}<span className="text-xs text-gray-500">점</span></span>
            </div>
            <h4 className="font-semibold text-gray-900 truncate">{result.fundName}</h4>
          </div>

          {/* 확장 아이콘 */}
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* 확장 내용 */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          {/* 지원 조건 */}
          {result.supportDetails && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-2 text-sm">
                {result.supportDetails.amount && (
                  <div>
                    <span className="text-gray-500">한도:</span>
                    <span className="ml-1 font-medium text-gray-900">{result.supportDetails.amount}</span>
                  </div>
                )}
                {result.supportDetails.interestRate && (
                  <div>
                    <span className="text-gray-500">금리:</span>
                    <span className="ml-1 font-medium text-gray-900">{result.supportDetails.interestRate}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 적격 사유 */}
          {result.eligibilityReasons.length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-medium text-green-700 mb-1">✓ 적격 사유</div>
              <ul className="space-y-1">
                {result.eligibilityReasons.map((reason, idx) => (
                  <li key={idx} className="text-xs text-gray-600 pl-3 relative before:absolute before:left-0 before:content-['•'] before:text-green-500">
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 감점 요소 (warnings) */}
          {result.warnings && result.warnings.length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-medium text-orange-700 mb-1">⚠️ 감점 요소</div>
              <ul className="space-y-1">
                {result.warnings.map((warning, idx) => (
                  <li key={idx} className="text-xs text-gray-600 pl-3 relative before:absolute before:left-0 before:content-['•'] before:text-orange-500">
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 부적격/경고 사유 */}
          {result.ineligibilityReasons.length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-medium text-red-700 mb-1">✗ 주의 사항</div>
              <ul className="space-y-1">
                {result.ineligibilityReasons.map((reason, idx) => (
                  <li key={idx} className="text-xs text-gray-600 pl-3 relative before:absolute before:left-0 before:content-['•'] before:text-red-500">
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 공고원문 링크 */}
          {result.officialUrl && (
            <a
              href={result.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-1 w-full py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              공고원문
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
