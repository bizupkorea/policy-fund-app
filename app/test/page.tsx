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
  industry: 'manufacturing' | 'it_service' | 'wholesale_retail' | 'food_service' | 'construction' | 'logistics' | 'other_service';
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

  // 업력 예외 조건 (청년전용창업자금 업력 7년 확대)
  isYouthStartupAcademyGrad: boolean; // 청년창업사관학교 졸업
  isGlobalStartupAcademyGrad: boolean; // 글로벌창업사관학교 졸업
  hasKiboYouthGuarantee: boolean; // 기보 청년창업우대보증 지원
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
      industry: 'manufacturing',
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
      isYouthStartupAcademyGrad: false,
      isGlobalStartupAcademyGrad: false,
      hasKiboYouthGuarantee: false,
    },
  },
  {
    id: 'youth-academy-grad',
    name: '청창사 졸업',
    description: '청년창업사관학교 졸업 기업 (업력 5년)',
    emoji: '🎓',
    profile: {
      companyName: '(주)청창사테크',
      industry: 'it_service',
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
      isYouthStartupAcademyGrad: true,  // 청창사 졸업 예외 적용
      isGlobalStartupAcademyGrad: false,
      hasKiboYouthGuarantee: false,
    },
  },
  {
    id: 'micro-enterprise',
    name: '소공인',
    description: '10인 미만 제조 가공업체',
    emoji: '🔧',
    profile: {
      companyName: '(주)정밀가공',
      industry: 'manufacturing',
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
      isYouthStartupAcademyGrad: false,
      isGlobalStartupAcademyGrad: false,
      hasKiboYouthGuarantee: false,
    },
  },
  {
    id: 'export-company',
    name: '수출기업',
    description: '수출 실적 보유 제조기업',
    emoji: '🌏',
    profile: {
      companyName: '(주)글로벌테크',
      industry: 'manufacturing',
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
      isYouthStartupAcademyGrad: false,
      isGlobalStartupAcademyGrad: false,
      hasKiboYouthGuarantee: false,
    },
  },
  {
    id: 'rnd-company',
    name: 'R&D 기업',
    description: '연구개발 중심 기술기업',
    emoji: '🔬',
    profile: {
      companyName: '(주)테크연구소',
      industry: 'manufacturing',
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
      isYouthStartupAcademyGrad: false,
      isGlobalStartupAcademyGrad: false,
      hasKiboYouthGuarantee: false,
    },
  },
  {
    id: 'smart-factory',
    name: '스마트공장',
    description: '스마트공장 추진 제조기업',
    emoji: '🏭',
    profile: {
      companyName: '(주)스마트제조',
      industry: 'manufacturing',
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
      isYouthStartupAcademyGrad: false,
      isGlobalStartupAcademyGrad: false,
      hasKiboYouthGuarantee: false,
    },
  },
  {
    id: 'restart-company',
    name: '재창업',
    description: '성실실패 후 재도전 기업',
    emoji: '🔄',
    profile: {
      companyName: '(주)재도전',
      industry: 'manufacturing',
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
      isYouthStartupAcademyGrad: false,
      isGlobalStartupAcademyGrad: false,
      hasKiboYouthGuarantee: false,
    },
  },
  {
    id: 'crisis-company',
    name: '위기기업',
    description: '체납/연체 있는 기업 (제외 케이스)',
    emoji: '⚠️',
    profile: {
      companyName: '(주)경영위기',
      industry: 'manufacturing',
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
      isYouthStartupAcademyGrad: false,
      isGlobalStartupAcademyGrad: false,
      hasKiboYouthGuarantee: false,
    },
  },
];

// 업종 옵션
const INDUSTRY_OPTIONS = [
  { value: 'manufacturing', label: '제조업' },
  { value: 'it_service', label: 'IT/지식서비스업' },
  { value: 'wholesale_retail', label: '도소매업' },
  { value: 'food_service', label: '음식점업' },
  { value: 'construction', label: '건설업' },
  { value: 'logistics', label: '운수/물류업' },
  { value: 'other_service', label: '기타 서비스업' },
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
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    연매출 <span className="text-orange-500 font-bold">{profile.annualRevenue}억원</span>
                  </label>
                  <input
                    type="range"
                    value={profile.annualRevenue}
                    onChange={e => updateProfile('annualRevenue', parseInt(e.target.value))}
                    min={1}
                    max={500}
                    step={1}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>1억</span>
                    <span>500억</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    직원수 <span className="text-orange-500 font-bold">{profile.employeeCount}명</span>
                    <span className="ml-2 text-gray-400">({getCompanySize() === 'startup' ? '소공인' : getCompanySize() === 'small' ? '소기업' : getCompanySize() === 'medium' ? '중기업' : '중견기업'})</span>
                  </label>
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
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    부채비율 <span className="text-orange-500 font-bold">{profile.debtRatio}%</span>
                  </label>
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

            {/* 제약 조건 */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs">6</span>
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
