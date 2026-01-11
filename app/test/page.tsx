'use client';

import { useState, useCallback } from 'react';
import { Play, RotateCcw, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import {
  matchWithKnowledgeBase,
  ExtendedCompanyProfile,
  DetailedMatchResult,
  InstitutionId,
  // UI 상수
  INDUSTRY_OPTIONS,
  REGION_OPTIONS,
  INSTITUTION_COLORS,
  INSTITUTION_NAMES,
  // UI 타입 및 프리셋
  TestProfile,
  PresetScenario,
  EMPTY_PROFILE,
  PRESET_SCENARIOS,
} from '@/lib/policy-fund/last';

// ============================================================================
// 메인 컴포넌트
// ============================================================================

export default function TestPage() {
  // 상태
  const [profile, setProfile] = useState<TestProfile>(EMPTY_PROFILE);
  const [results, setResults] = useState<DetailedMatchResult[]>([]);
  const [trackInfo, setTrackInfo] = useState<{
    hasSpecializedTrack: boolean;
    trackType: string | null;
    trackLabel: string;
    trackDescription: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [showAllResults, setShowAllResults] = useState(false);
  const [fundingAmountInput, setFundingAmountInput] = useState('');

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
    setTrackInfo(null);
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
        hasExportRevenue: profile.exportRevenue > 0,
        hasRndActivity: profile.hasResearchInstitute || profile.hasPatent,
        isVentureCompany: profile.isVenture,
        isInnobiz: profile.isInnobiz,
        isMainbiz: profile.isMainbiz,
        // Extended fields
        revenue: profile.annualRevenue,
        industryName: INDUSTRY_OPTIONS.find(i => i.value === profile.industry)?.label || '제조업',
        region: profile.location,
        hasTaxDelinquency: profile.hasTaxDelinquency,
        taxDelinquencyStatus: profile.hasTaxDelinquency ? 'active' : 'none',
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
        hasVentureInvestment: profile.hasVentureInvestment,
        acceptsEquityDilution: profile.acceptsEquityDilution,
        needsLargeFunding: profile.needsLargeFunding,
        requiredFundingAmount: profile.requiredFundingAmount,
        // 자금 용도
        fundingPurposeWorking: profile.fundingPurposeWorking,
        fundingPurposeFacility: profile.fundingPurposeFacility,
        // 정책자금 이용 이력
        kosmesPreviousCount: profile.kosmesPreviousCount,
        currentGuaranteeOrg: profile.currentGuaranteeOrg,
        existingLoanBalance: profile.existingLoanBalance,
        recentYearSubsidyAmount: profile.recentYearSubsidyAmount,
        // 하드컷 조건
        hasPastDefault: profile.hasPastDefault,
        isPastDefaultResolved: profile.isPastDefaultResolved,
        isInactive: profile.isInactive,
        isCurrentlyDelinquent: profile.isCurrentlyDelinquent,
        hasUnresolvedGuaranteeAccident: profile.hasUnresolvedGuaranteeAccident,
        // 조건부(Conditional) 조건
        hasTaxInstallmentApproval: profile.hasTaxInstallmentApproval,
        isCreditRecoveryInProgress: profile.isCreditRecoveryInProgress,
        // 특수 자금 계획
        hasSmartFactoryPlan: profile.hasSmartFactoryPlan,
        hasEsgInvestmentPlan: profile.hasEsgInvestmentPlan,
        isEmergencySituation: profile.isEmergencySituation,
        hasJobCreation: profile.hasJobCreation,
        isGreenEnergyBusiness: profile.isGreenEnergyBusiness,
        // 여성기업 여부
        isFemale: profile.isFemale,
        // 재창업 여부
        isRestart: profile.isRestart,
        // 부채비율
        debtRatio: profile.debtRatio,
        // 장애인/사회적기업 인증
        isDisabled: profile.isDisabled,
        isDisabledStandard: profile.isDisabledStandard,
        isSocialEnterprise: profile.isSocialEnterprise,
      };

      const result = await matchWithKnowledgeBase(extendedProfile, {
        useAI: false,
        topN: 5,
      });

      setResults(result.results);
      // trackInfo는 현재 API에서 반환하지 않으므로 null 유지
      // setTrackInfo(result.trackInfo || null);
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
  const displayResults = showAllResults ? results : results.slice(0, 5);

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
                        max={1000}
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
                    max={1000}
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
                        onChange={e => updateProfile('debtRatio', Math.max(0, Math.min(1000, parseInt(e.target.value) || 0)))}
                        min={0}
                        max={1000}
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
                    max={1000}
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
                  { key: 'isDisabledStandard', label: '장애인표준사업장' },
                  { key: 'isSocialEnterprise', label: '사회적기업 인증' },
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
                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-green-200 hover:bg-green-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={profile.hasVentureInvestment}
                    onChange={e => updateProfile('hasVentureInvestment', e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-gray-300 text-green-500 focus:ring-green-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">벤처투자 유치 실적 있음</span>
                    <p className="text-xs text-green-600 mt-0.5">최근 2년 내 VC/엔젤 투자 유치 (투융자복합금융 +15점)</p>
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
                        type="text"
                        inputMode="decimal"
                        value={fundingAmountInput}
                        onChange={e => {
                          const value = e.target.value;
                          // 숫자와 소수점만 허용
                          if (value !== '' && !/^[0-9]*.?[0-9]*$/.test(value)) return;
                          setFundingAmountInput(value);
                          const amount = value === '' ? 0 : parseFloat(value) || 0;
                          setProfile(prev => ({
                            ...prev,
                            requiredFundingAmount: amount,
                            needsLargeFunding: amount >= 5
                          }));
                        }}
                        placeholder="0"
                        className="w-24 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      />
                      <span className="text-sm text-gray-600">억원</span>
                    </div>
                    <p className="text-xs text-gray-400 ml-auto">5억 이상 입력 시 대규모 자금 자동 체크</p>
                  </div>
                </div>
                {/* 자금 용도 선택 (복수 선택 가능) */}
                <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                  <label className="text-sm font-medium text-gray-700 block mb-3">자금 용도 (복수 선택 가능)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded border border-gray-200 hover:bg-white transition-colors">
                      <input
                        type="checkbox"
                        checked={profile.fundingPurposeWorking}
                        onChange={e => updateProfile('fundingPurposeWorking', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">운전자금</span>
                        <p className="text-xs text-gray-400">원자재, 인건비, 마케팅</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded border border-gray-200 hover:bg-white transition-colors">
                      <input
                        type="checkbox"
                        checked={profile.fundingPurposeFacility}
                        onChange={e => updateProfile('fundingPurposeFacility', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">시설자금</span>
                        <p className="text-xs text-gray-400">설비, 공장, 장비 구매</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded border border-orange-200 hover:bg-orange-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={profile.hasSmartFactoryPlan}
                        onChange={e => updateProfile('hasSmartFactoryPlan', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">스마트공장</span>
                        <p className="text-xs text-orange-500">구축/고도화 계획</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded border border-green-200 hover:bg-green-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={profile.hasEsgInvestmentPlan}
                        onChange={e => updateProfile('hasEsgInvestmentPlan', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-green-500 focus:ring-green-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">ESG/탄소중립</span>
                        <p className="text-xs text-green-500">친환경 시설투자</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded border border-red-200 hover:bg-red-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={profile.isEmergencySituation}
                        onChange={e => updateProfile('isEmergencySituation', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">긴급경영안정</span>
                        <p className="text-xs text-red-500">재해/경영위기 상황</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded border border-blue-200 hover:bg-blue-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={profile.hasJobCreation}
                        onChange={e => updateProfile('hasJobCreation', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">고용증가</span>
                        <p className="text-xs text-blue-500">최근 1년 내 고용 증가</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded border border-yellow-200 hover:bg-yellow-50 transition-colors col-span-2">
                      <input
                        type="checkbox"
                        checked={profile.isGreenEnergyBusiness}
                        onChange={e => updateProfile('isGreenEnergyBusiness', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">신재생에너지</span>
                        <p className="text-xs text-yellow-600">태양광/풍력/수소 등 사업</p>
                      </div>
                    </label>
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
                {/* 세금 체납 */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.hasTaxDelinquency}
                      onChange={e => {
                        updateProfile('hasTaxDelinquency', e.target.checked);
                        if (!e.target.checked) {
                          updateProfile('hasTaxInstallmentApproval', false);
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-700">세금 체납 있음</span>
                    {profile.hasTaxDelinquency && !profile.hasTaxInstallmentApproval && (
                      <span className="text-xs text-red-500 font-medium">⚠️ 하드컷 - 자금 불가</span>
                    )}
                  </label>
                  {profile.hasTaxDelinquency && (
                    <div className="ml-6 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profile.hasTaxInstallmentApproval}
                          onChange={e => updateProfile('hasTaxInstallmentApproval', e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">분납 승인</span>
                      </label>
                      {profile.hasTaxInstallmentApproval ? (
                        <p className="text-xs text-orange-600">⚠️ 심사 시 불이익 가능 (감점 -10)</p>
                      ) : (
                        <p className="text-xs text-red-500">⚠️ 분납 미승인 시 정책자금 신청 불가</p>
                      )}
                    </div>
                  )}
                </div>
                {/* 신용회복 중 */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.isCreditRecoveryInProgress}
                    onChange={e => updateProfile('isCreditRecoveryInProgress', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">신용회복 중</span>
                  {profile.isCreditRecoveryInProgress && (
                    <span className="text-xs text-red-500 font-medium">🚫 정책자금 제외 (재도전자금 예외)</span>
                  )}
                </label>
                {/* 재창업 기업 */}
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-gray-600">
                      기존 대출 잔액
                      {profile.existingLoanBalance >= 15 && <span className="text-red-500 ml-2">⚠️ 한도 초과 우려</span>}
                      {profile.existingLoanBalance >= 10 && profile.existingLoanBalance < 15 && <span className="text-orange-500 ml-2">⚠️ 한도 근접</span>}
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={profile.existingLoanBalance}
                        onChange={e => updateProfile('existingLoanBalance', Math.max(0, Math.min(50, parseInt(e.target.value) || 0)))}
                        min={0}
                        max={50}
                        className="w-20 px-2 py-1 text-sm text-right border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                      />
                      <span className="text-xs text-gray-500">억원</span>
                    </div>
                  </div>
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-gray-600">
                      중진공 정책자금 이용 횟수
                      {profile.kosmesPreviousCount >= 5 && <span className="text-red-500 ml-2">⚠️ 졸업제 해당</span>}
                      {profile.kosmesPreviousCount === 4 && <span className="text-orange-500 ml-2">⚠️ 졸업제 임박</span>}
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={profile.kosmesPreviousCount}
                        onChange={e => updateProfile('kosmesPreviousCount', Math.max(0, Math.min(10, parseInt(e.target.value) || 0)))}
                        min={0}
                        max={10}
                        className="w-20 px-2 py-1 text-sm text-right border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                      />
                      <span className="text-xs text-gray-500">회</span>
                    </div>
                  </div>
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-gray-600">
                      최근 1년 수혜액
                      {profile.annualRevenue > 0 && profile.recentYearSubsidyAmount > 0 && (
                        <span className={`ml-2 ${(profile.recentYearSubsidyAmount / profile.annualRevenue) > 0.5 ? 'text-red-500' : (profile.recentYearSubsidyAmount / profile.annualRevenue) > 0.33 ? 'text-orange-500' : 'text-green-500'}`}>
                          (매출대비 {Math.round((profile.recentYearSubsidyAmount / profile.annualRevenue) * 100)}%)
                        </span>
                      )}
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={profile.recentYearSubsidyAmount}
                        onChange={e => updateProfile('recentYearSubsidyAmount', Math.max(0, Math.min(20, parseFloat(e.target.value) || 0)))}
                        min={0}
                        max={20}
                        step={0.5}
                        className="w-20 px-2 py-1 text-sm text-right border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                      />
                      <span className="text-xs text-gray-500">억원</span>
                    </div>
                  </div>
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
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.hasPastDefault}
                      onChange={e => {
                        updateProfile('hasPastDefault', e.target.checked);
                        if (!e.target.checked) {
                          updateProfile('isPastDefaultResolved', false);
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-700">과거 부실/사고 이력</span>
                    <span className="text-xs text-gray-500">(보증사고, 대출연체 등)</span>
                  </label>
                  {profile.hasPastDefault && (
                    <div className="ml-6 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profile.isPastDefaultResolved}
                          onChange={e => updateProfile('isPastDefaultResolved', e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-green-500 focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-700">정리 완료</span>
                        <span className="text-xs text-gray-500">(채무 상환/면책 등)</span>
                      </label>
                      {profile.isPastDefaultResolved ? (
                        <p className="text-xs text-green-600">✓ 재창업/재기자금 우대 적용</p>
                      ) : (
                        <p className="text-xs text-red-500">⚠️ 미정리 시 정책자금 신청 불가 (하드컷)</p>
                      )}
                    </div>
                  )}
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

            {/* 전용 트랙 안내 배너 */}
            {trackInfo?.hasSpecializedTrack && (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">★</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-800 mb-1">
                      {trackInfo.trackLabel}
                    </h4>
                    <p className="text-sm text-purple-700">
                      {trackInfo.trackDescription}
                    </p>
                    <p className="text-xs text-purple-500 mt-2">
                      ⚠️ 일반 자금은 정책 목적 부합도가 낮아 후순위로 안내됩니다.
                    </p>
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

                {results.length > 5 && (
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
                        나머지 {results.length - 5}개 더보기
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
  const instId = result.institutionId as InstitutionId;
  const colors = INSTITUTION_COLORS[instId] || INSTITUTION_COLORS.kosmes;
  const instName = INSTITUTION_NAMES[instId] || result.institutionId;

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
              {/* 트랙 배지 */}
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                result.track === 'exclusive' ? 'bg-purple-100 text-purple-700' :
                result.track === 'policy_linked' ? 'bg-blue-100 text-blue-700' :
                result.track === 'general' ? 'bg-gray-100 text-gray-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {result.trackLabel}
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
          {/* 점수 설명 */}
          {result.scoreExplanation && (
            <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
              <div className="text-xs font-medium text-blue-700 mb-1">왜 이 순위인가요?</div>
              <p className="text-sm text-gray-700">{result.scoreExplanation}</p>
            </div>
          )}

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
