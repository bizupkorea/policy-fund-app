'use client';

import { useState, useCallback, useRef } from 'react';
import { Play, ChevronDown, ChevronUp, ChevronRight, ChevronLeft, ExternalLink, Check } from 'lucide-react';
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
  // UI 타입
  TestProfile,
  EMPTY_PROFILE,
} from '@/lib/policy-fund/last';

// ============================================================================
// Step Indicator 컴포넌트
// ============================================================================

function StepIndicator({
  currentStep,
  totalSteps,
  onStepClick,
}: {
  currentStep: number;
  totalSteps: number;
  onStepClick: (step: number) => void;
}) {
  const stepLabels = ['기본정보', '필요자금', '특수조건', '최종확인', 'AI 매칭결과'];

  return (
    <div className="flex items-center justify-between mb-6 bg-slate-100 rounded-2xl p-4 border border-slate-200">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step, idx) => (
        <div key={step} className="flex items-center flex-1">
          <button
            onClick={() => onStepClick(step)}
            className={`flex flex-col items-center gap-2 transition-all duration-300 ${
              step <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'
            }`}
            disabled={step > currentStep}
          >
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                step === currentStep
                  ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/40 scale-110 ring-4 ring-orange-400/30'
                  : step < currentStep
                  ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-md'
                  : 'bg-slate-300 text-slate-500 border border-slate-400/50'
              }`}
            >
              {step < currentStep ? <Check className="w-5 h-5" /> : step}
            </div>
            <span
              className={`text-xs font-medium transition-colors hidden md:inline ${
                step === currentStep ? 'text-orange-600' : step < currentStep ? 'text-emerald-600' : 'text-slate-500'
              }`}
            >
              {stepLabels[idx]}
            </span>
          </button>
          {idx < totalSteps - 1 && (
            <div className="flex-1 h-1.5 mx-3 rounded-full bg-slate-300 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  step < currentStep
                    ? 'w-full bg-gradient-to-r from-emerald-400 to-teal-500'
                    : 'w-0 bg-gradient-to-r from-orange-500 to-amber-400'
                }`}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Step Header 컴포넌트 (단계별 제목 + 설명)
// ============================================================================

const STEP_INFO = [
  {
    title: '기본 정보 입력',
    description: '기업과 대표자의 기본 정보를 입력해 주세요',
    icon: '📋',
  },
  {
    title: '필요 자금 설정',
    description: '필요한 자금 규모와 용도를 선택해 주세요',
    icon: '💰',
  },
  {
    title: '특수 조건 확인',
    description: '정책자금 매칭 정확도를 높이는 항목입니다',
    icon: '🎯',
    guidance: '해당 사항이 없으면 건너뛰어도 됩니다',
  },
  {
    title: 'AI 분석 준비 완료',
    description: '입력하신 정보를 바탕으로 정책자금 가능성을 분석합니다',
    icon: '✅',
  },
  {
    title: 'AI 매칭 결과',
    description: '기업에 적합한 정책자금 매칭 결과입니다',
    icon: '🎯',
  },
];

function StepHeader({ currentStep }: { currentStep: number }) {
  const stepInfo = STEP_INFO[currentStep - 1];
  if (!stepInfo) return null;

  return (
    <div className="mb-5">
      {/* 단계 제목 */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{stepInfo.icon}</span>
        <h2 className="text-lg font-bold text-slate-800">
          STEP {currentStep}. {stepInfo.title}
        </h2>
      </div>
      {/* 설명 */}
      <p className="text-sm text-slate-600 ml-10">
        {stepInfo.description}
      </p>
      {/* 안내 문구 (Step 3 전용) */}
      {stepInfo.guidance && (
        <div className="mt-3 ml-10 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-100">
          <span className="text-base">💡</span>
          <span>{stepInfo.guidance}</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Accordion 컴포넌트
// ============================================================================

function Accordion({
  title,
  icon,
  children,
  isExpanded,
  onToggle,
  badge,
  purposeLabel,
  purposeColor = 'slate',
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  badge?: string;
  purposeLabel?: string;
  purposeColor?: 'emerald' | 'blue' | 'amber' | 'slate';
}) {
  const purposeColors = {
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    amber: 'bg-amber-100 text-amber-700 border-amber-200',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 bg-slate-100 hover:bg-slate-200 flex items-center justify-between transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <span className="font-semibold text-slate-800">{title}</span>
          {badge && (
            <span className="px-2.5 py-1 bg-orange-100 text-orange-600 text-xs font-semibold rounded-full border border-orange-300">
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {purposeLabel && (
            <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${purposeColors[purposeColor]}`}>
              {purposeLabel}
            </span>
          )}
          <ChevronDown
            className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>
      {isExpanded && <div className="p-5 bg-white">{children}</div>}
    </div>
  );
}

// ============================================================================
// 슬라이더 단계 상수
// ============================================================================

const FUNDING_STEPS = [
  { value: 0.5, label: '1억 미만', desc: '소규모 운전자금' },
  { value: 1, label: '1억', desc: '창업/소규모 자금' },
  { value: 2, label: '2억', desc: '일반 운전자금' },
  { value: 3, label: '3억', desc: '중규모 사업자금' },
  { value: 5, label: '5억', desc: '시설투자 포함' },
  { value: 7, label: '7억', desc: '중규모 시설자금' },
  { value: 10, label: '10억', desc: '대규모 시설투자' },
  { value: 15, label: '10억+', desc: '대규모 복합자금' },
];

const FUNDING_PURPOSE_OPTIONS = [
  {
    id: 'working',
    label: '운전자금',
    desc: '인건비, 원자재, 운영비',
    icon: '💼',
    working: true,
    facility: false
  },
  {
    id: 'facility',
    label: '시설·설비자금',
    desc: '설비, 장비, 공장 투자',
    icon: '🏭',
    working: false,
    facility: true
  },
  {
    id: 'mixed',
    label: '혼합 필요',
    desc: '운전 + 시설 모두',
    icon: '🔄',
    working: true,
    facility: true
  },
];

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
  const [showAllResults, setShowAllResults] = useState(false);
  const [fundingStepIndex, setFundingStepIndex] = useState(2); // 기본: 2억

  // Step 관련 상태
  const [currentStep, setCurrentStep] = useState(1);
  const [expandedAccordions, setExpandedAccordions] = useState<string[]>(['certifications']);
  const [isStep2SubExpanded, setIsStep2SubExpanded] = useState(false);

  // 스크롤 영역 ref
  const contentRef = useRef<HTMLDivElement>(null);

  // 업력 계산
  const businessAge = new Date().getFullYear() - profile.establishedYear;

  // 기업 규모 분류
  const getCompanySize = (): 'startup' | 'small' | 'medium' | 'large' => {
    if (profile.employeeCount < 5) return 'startup';
    if (profile.employeeCount < 50) return 'small';
    if (profile.employeeCount < 300) return 'medium';
    return 'large';
  };

  // 입력값 변경
  const updateProfile = (key: keyof TestProfile, value: any) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  // 아코디언 토글
  const toggleAccordion = (id: string) => {
    setExpandedAccordions(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
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

      // 매칭 완료 후 Step 5 (AI 매칭 결과)로 이동
      setCurrentStep(5);
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

  // Step 이동 (스크롤 초기화 포함)
  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= 5) {
      setCurrentStep(step);
      // 내부 스크롤 영역 상단으로 이동
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  // 인증 현황 카운트
  const certCount = [
    profile.isVenture,
    profile.isInnobiz,
    profile.isMainbiz,
    profile.hasPatent,
    profile.hasResearchInstitute,
    profile.hasExportRecord,
    profile.isDisabledStandard,
    profile.isSocialEnterprise,
  ].filter(Boolean).length;

  // 제약 조건 카운트
  const constraintCount = [
    profile.isInactive,
    profile.hasTaxDelinquency,
    profile.isCurrentlyDelinquent,
    profile.hasUnresolvedGuaranteeAccident,
    profile.hasPastDefault,
    profile.isCreditRecoveryInProgress,
  ].filter(Boolean).length;

  return (
    <div className="h-full overflow-hidden flex flex-col bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 w-full flex flex-col flex-1 overflow-hidden">
        {/* 헤더 (고정 영역) */}
        <div className="flex-shrink-0 py-4">
          <h1 className="text-2xl font-bold text-slate-800">정책자금 매칭 테스트</h1>
          <p className="text-slate-500 mt-1 text-sm">다양한 기업 조건을 설정하여 매칭 결과를 테스트합니다</p>
        </div>

        {/* 메인 컨테이너 (가변 영역, 내부 스크롤) */}
        <div className="flex-1 min-h-0 max-w-4xl mx-auto w-full flex flex-col overflow-hidden">
          {/* Step Indicator (고정) */}
          <div className="flex-shrink-0 bg-white border border-slate-200 rounded-t-2xl shadow-sm p-4">
            <StepIndicator
              currentStep={currentStep}
              totalSteps={5}
              onStepClick={goToStep}
            />
          </div>

          {/* Step Content (스크롤 영역) */}
          <div
            ref={contentRef}
            className="flex-1 min-h-0 overflow-y-auto bg-white border-x border-slate-200 p-6"
          >
              {/* Step Header - 모든 Step에 표시 */}
              <StepHeader currentStep={currentStep} />

              {/* ================================================================
                  Step 1: 기본 정보 + 대표자 (10개)
                  ================================================================ */}
              {currentStep === 1 && (
                <div className="space-y-4 [&:has(input:focus,select:focus)_:is(input,select):not(:focus)]:opacity-50 [&:has(input:focus,select:focus)_:is(input,select):not(:focus)]:transition-opacity">
                  {/* 기본 정보 */}
                  <div className="bg-slate-50/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50">
                    <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <span className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-lg flex items-center justify-center text-xs shadow-md">📋</span>
                      기본 정보
                    </h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">업종</label>
                          <select
                            value={profile.industry}
                            onChange={e => updateProfile('industry', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-4 focus:ring-orange-400/40 focus:border-orange-500 focus:shadow-[0_0_25px_rgba(249,115,22,0.35)] transition-all duration-300"
                          >
                            {INDUSTRY_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">지역</label>
                          <select
                            value={profile.location}
                            onChange={e => updateProfile('location', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-4 focus:ring-orange-400/40 focus:border-orange-500 focus:shadow-[0_0_25px_rgba(249,115,22,0.35)] transition-all duration-300"
                          >
                            {REGION_OPTIONS.map(region => (
                              <option key={region} value={region}>{region}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          설립연도 <span className="text-orange-500 font-semibold">(업력: {businessAge}년)</span>
                        </label>
                        <input
                          type="number"
                          value={profile.establishedYear}
                          onChange={e => updateProfile('establishedYear', parseInt(e.target.value) || 2020)}
                          min={1950}
                          max={2026}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-4 focus:ring-orange-400/40 focus:border-orange-500 focus:shadow-[0_0_25px_rgba(249,115,22,0.35)] transition-all duration-300"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-medium text-slate-600">연매출</label>
                          </div>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={profile.annualRevenue}
                              onChange={e => updateProfile('annualRevenue', Math.max(0, Math.min(1000, parseFloat(e.target.value) || 0)))}
                              min={0}
                              max={1000}
                              step={0.5}
                              className="w-full px-2 py-2 text-sm text-right border border-slate-200 rounded-lg bg-white focus:ring-4 focus:ring-orange-400/40 focus:border-orange-500 focus:shadow-[0_0_25px_rgba(249,115,22,0.35)] transition-all duration-300"
                            />
                            <span className="text-xs text-slate-500 font-medium">억원</span>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-medium text-slate-600">
                              직원수 <span className="text-slate-400">({getCompanySize() === 'startup' ? '소공인' : getCompanySize() === 'small' ? '소기업' : getCompanySize() === 'medium' ? '중기업' : '중견기업'})</span>
                            </label>
                          </div>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={profile.employeeCount}
                              onChange={e => updateProfile('employeeCount', Math.max(1, Math.min(300, parseInt(e.target.value) || 1)))}
                              min={1}
                              max={300}
                              className="w-full px-2 py-2 text-sm text-right border border-slate-200 rounded-lg bg-white focus:ring-4 focus:ring-orange-400/40 focus:border-orange-500 focus:shadow-[0_0_25px_rgba(249,115,22,0.35)] transition-all duration-300"
                            />
                            <span className="text-xs text-slate-500 font-medium">명</span>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-medium text-slate-600">부채비율</label>
                          </div>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={profile.debtRatio}
                              onChange={e => updateProfile('debtRatio', Math.max(0, Math.min(1000, parseInt(e.target.value) || 0)))}
                              min={0}
                              max={1000}
                              className="w-full px-2 py-2 text-sm text-right border border-slate-200 rounded-lg bg-white focus:ring-4 focus:ring-orange-400/40 focus:border-orange-500 focus:shadow-[0_0_25px_rgba(249,115,22,0.35)] transition-all duration-300"
                            />
                            <span className="text-xs text-slate-500 font-medium">%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 대표자 정보 */}
                  <div className="bg-amber-50/80 backdrop-blur-sm rounded-xl p-4 border border-amber-200/50">
                    <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <span className="w-7 h-7 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-lg flex items-center justify-center text-xs shadow-md">👤</span>
                      대표자 정보
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          대표자 나이 <span className="text-orange-500 font-bold">{profile.ceoAge}세</span>
                          {profile.ceoAge <= 39 && <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-600 text-xs font-medium rounded-full">청년</span>}
                        </label>
                        <input
                          type="range"
                          value={profile.ceoAge}
                          onChange={e => updateProfile('ceoAge', parseInt(e.target.value))}
                          min={20}
                          max={70}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                          <span>20세</span>
                          <span className="text-emerald-500 font-medium">39세 (청년 기준)</span>
                          <span>70세</span>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-amber-100/50 transition-colors">
                          <input
                            type="checkbox"
                            checked={profile.isFemale}
                            onChange={e => updateProfile('isFemale', e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                          />
                          <span className="text-sm text-slate-700">여성 대표</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-amber-100/50 transition-colors">
                          <input
                            type="checkbox"
                            checked={profile.isDisabled}
                            onChange={e => updateProfile('isDisabled', e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                          />
                          <span className="text-sm text-slate-700">장애인 대표</span>
                        </label>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* ================================================================
                  Step 2: 필요 자금 (주카드 + 접히는 보조카드)
                  ================================================================ */}
              {currentStep === 2 && (
                <div className="space-y-4 [&:has(input:focus,select:focus)_:is(input,select):not(:focus)]:opacity-50 [&:has(input:focus,select:focus)_:is(input,select):not(:focus)]:transition-opacity">

                  {/* ========== 주카드: 필요 자금 규모/성격 ========== */}
                  <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-5 border border-cyan-200 shadow-sm">
                    {/* 필요 자금 입력 - 슬라이더 버전 */}
                    <div className="space-y-4">
                      {/* 질문형 라벨 */}
                      <div className="text-center">
                        <h4 className="text-base font-semibold text-slate-800 mb-1">
                          필요한 자금 규모는 어느 정도인가요?
                        </h4>
                        <p className="text-xs text-slate-500">
                          선택한 범위에 따라 적합한 정책자금이 달라집니다
                        </p>
                      </div>

                      {/* 슬라이더 */}
                      <div className="px-2">
                        <input
                          type="range"
                          min={0}
                          max={FUNDING_STEPS.length - 1}
                          value={fundingStepIndex}
                          onChange={e => {
                            const index = parseInt(e.target.value);
                            setFundingStepIndex(index);
                            const step = FUNDING_STEPS[index];
                            setProfile(prev => ({
                              ...prev,
                              requiredFundingAmount: step.value,
                              needsLargeFunding: step.value >= 5
                            }));
                          }}
                          className="w-full h-3 bg-gradient-to-r from-cyan-200 via-blue-300 to-orange-400 rounded-full appearance-none cursor-pointer
                                     [&::-webkit-slider-thumb]:appearance-none
                                     [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7
                                     [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full
                                     [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-cyan-500
                                     [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer
                                     [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110"
                        />
                        {/* 라벨 마커 */}
                        <div className="flex justify-between mt-2 text-xs text-slate-400 font-medium">
                          <span>1억 미만</span>
                          <span>3억</span>
                          <span>5억</span>
                          <span>10억+</span>
                        </div>
                      </div>

                      {/* 현재 선택 피드백 */}
                      <div className="bg-white rounded-xl p-4 border border-cyan-200 text-center shadow-sm">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <span className="text-3xl font-bold text-cyan-600">
                            {FUNDING_STEPS[fundingStepIndex].label}
                          </span>
                          {FUNDING_STEPS[fundingStepIndex].value >= 5 && (
                            <span className="px-2.5 py-1 bg-orange-100 text-orange-600 text-xs font-bold rounded-full border border-orange-200">
                              대규모
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">
                          💡 {FUNDING_STEPS[fundingStepIndex].desc}
                        </p>
                      </div>
                    </div>

                    {/* 자금 용도 - 카드 선택 */}
                    <div className="mt-5">
                      <label className="text-sm font-medium text-slate-600 mb-3 block">자금 용도</label>
                      <div className="grid grid-cols-3 gap-3">
                        {FUNDING_PURPOSE_OPTIONS.map((option) => {
                          const { fundingPurposeWorking: w, fundingPurposeFacility: f } = profile;
                          const currentOption = (w && f) ? 'mixed' : (w && !f) ? 'working' : (!w && f) ? 'facility' : 'working';
                          const isSelected = currentOption === option.id;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => {
                                setProfile(prev => ({
                                  ...prev,
                                  fundingPurposeWorking: option.working,
                                  fundingPurposeFacility: option.facility,
                                }));
                              }}
                              className={`
                                relative p-4 rounded-xl border-2 transition-all duration-200 text-left
                                ${isSelected
                                  ? 'border-cyan-500 bg-cyan-50 shadow-md shadow-cyan-100'
                                  : 'border-slate-200 bg-white hover:border-cyan-300 hover:bg-cyan-50/50'
                                }
                              `}
                            >
                              {isSelected && (
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center">
                                  <Check className="w-4 h-4 text-white" />
                                </div>
                              )}
                              <div className="text-2xl mb-2">{option.icon}</div>
                              <div className={`font-semibold text-sm ${isSelected ? 'text-cyan-700' : 'text-slate-700'}`}>
                                {option.label}
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                {option.desc}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* ========== 보조카드: 특수목적자금 매칭 (접힘/펼침) ========== */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    {/* 헤더 (클릭하면 펼침/접힘) */}
                    <button
                      onClick={() => setIsStep2SubExpanded(prev => !prev)}
                      className="w-full px-5 py-3.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🎯</span>
                        <span className="font-semibold text-slate-700">특수목적자금 매칭</span>
                        <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full font-medium">고급</span>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isStep2SubExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {/* 펼침 시 내용 */}
                    {isStep2SubExpanded && (
                      <div className="p-5 space-y-4 bg-white border-t border-slate-100">
                        {/* 안내 문구 */}
                        <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
                          💡 해당 사항이 있으면 체크해 주세요. <strong className="text-slate-700">전용자금을 우선 추천</strong>합니다.
                        </p>
                        {/* 투자/성장 계획 */}
                        <div className="bg-cyan-50/50 rounded-lg p-4 border border-cyan-100">
                          <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                            <span>📈</span> 투자/성장 계획
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-slate-200 bg-white hover:border-cyan-400 transition-all">
                              <input
                                type="checkbox"
                                checked={profile.hasIpoOrInvestmentPlan}
                                onChange={e => updateProfile('hasIpoOrInvestmentPlan', e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500"
                              />
                              <span className="text-sm text-slate-700">IPO/투자 유치</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-emerald-200 bg-emerald-50/50 hover:border-emerald-400 transition-all">
                              <input
                                type="checkbox"
                                checked={profile.hasVentureInvestment}
                                onChange={e => updateProfile('hasVentureInvestment', e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span className="text-sm text-slate-700">벤처투자 실적 <span className="text-emerald-600 text-xs">(+15)</span></span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-slate-200 bg-white hover:border-cyan-400 transition-all">
                              <input
                                type="checkbox"
                                checked={profile.acceptsEquityDilution}
                                onChange={e => updateProfile('acceptsEquityDilution', e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500"
                              />
                              <span className="text-sm text-slate-700">지분희석 감수</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-slate-200 bg-white hover:border-cyan-400 transition-all">
                              <input
                                type="checkbox"
                                checked={profile.needsLargeFunding}
                                onChange={e => updateProfile('needsLargeFunding', e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500"
                              />
                              <span className="text-sm text-slate-700">대규모 (5억+)</span>
                            </label>
                          </div>
                        </div>

                        {/* 특수 자금 계획 */}
                        <div className="bg-purple-50/50 rounded-lg p-4 border border-purple-100">
                          <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                            <span>🎯</span> 특수 자금 계획
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-orange-200 bg-orange-50/50 hover:border-orange-400 transition-all">
                              <input
                                type="checkbox"
                                checked={profile.hasSmartFactoryPlan}
                                onChange={e => updateProfile('hasSmartFactoryPlan', e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                              />
                              <span className="text-sm text-slate-700">스마트공장</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-emerald-200 bg-emerald-50/50 hover:border-emerald-400 transition-all">
                              <input
                                type="checkbox"
                                checked={profile.hasEsgInvestmentPlan}
                                onChange={e => updateProfile('hasEsgInvestmentPlan', e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span className="text-sm text-slate-700">ESG/탄소중립</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-red-200 bg-red-50/50 hover:border-red-400 transition-all">
                              <input
                                type="checkbox"
                                checked={profile.isEmergencySituation}
                                onChange={e => updateProfile('isEmergencySituation', e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-red-500 focus:ring-red-500"
                              />
                              <span className="text-sm text-slate-700">긴급경영</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-blue-200 bg-blue-50/50 hover:border-blue-400 transition-all">
                              <input
                                type="checkbox"
                                checked={profile.hasJobCreation}
                                onChange={e => updateProfile('hasJobCreation', e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                              />
                              <span className="text-sm text-slate-700">고용증가</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-amber-200 bg-amber-50/50 hover:border-amber-400 transition-all md:col-span-2">
                              <input
                                type="checkbox"
                                checked={profile.isGreenEnergyBusiness}
                                onChange={e => updateProfile('isGreenEnergyBusiness', e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                              />
                              <span className="text-sm text-slate-700">신재생에너지</span>
                            </label>
                          </div>
                        </div>

                        {/* 업력 예외 조건 */}
                        <div className="bg-indigo-50/50 rounded-lg p-4 border border-indigo-100">
                          <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <span>🎓</span> 업력 예외 조건
                          </h4>
                          <p className="text-xs text-indigo-600 mb-3">청년전용창업자금 업력 3년 → 7년 완화</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {[
                              { key: 'isYouthStartupAcademyGrad', label: '청년창업사관학교' },
                              { key: 'isGlobalStartupAcademyGrad', label: '글로벌창업사관학교' },
                              { key: 'hasKiboYouthGuarantee', label: '기보 청년보증' },
                            ].map(item => (
                              <label key={item.key} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-slate-200 bg-white hover:border-indigo-400 transition-all">
                                <input
                                  type="checkbox"
                                  checked={profile[item.key as keyof TestProfile] as boolean}
                                  onChange={e => updateProfile(item.key as keyof TestProfile, e.target.checked)}
                                  className="w-4 h-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-slate-700">{item.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* ================================================================
                  Step 3: 특수 조건 (아코디언 3개)
                  ================================================================ */}
              {currentStep === 3 && (
                <div className="space-y-4 [&:has(input:focus,select:focus)_:is(input,select):not(:focus)]:opacity-50 [&:has(input:focus,select:focus)_:is(input,select):not(:focus)]:transition-opacity">
                  {/* 아코디언 1: 인증 현황 */}
                  <Accordion
                    title="인증 현황"
                    icon="🏆"
                    isExpanded={expandedAccordions.includes('certifications')}
                    onToggle={() => toggleAccordion('certifications')}
                    badge={certCount > 0 ? `${certCount}개` : undefined}
                    purposeLabel="가점 요소"
                    purposeColor="emerald"
                  >
                    <div className="space-y-5">
                      {/* 안심 문구 */}
                      <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-100">
                        <span className="text-base">✔</span>
                        <span>보유하지 않아도 정책자금 신청은 가능합니다</span>
                      </div>

                      {/* 그룹 1: 기업 인증 */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-base">📜</span>
                          <span className="text-sm font-semibold text-slate-700">기업 인증</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { key: 'isVenture', label: '벤처기업' },
                            { key: 'isInnobiz', label: '이노비즈' },
                            { key: 'isMainbiz', label: '메인비즈' },
                          ].map(cert => {
                            const isChecked = profile[cert.key as keyof TestProfile] as boolean;
                            return (
                              <button
                                key={cert.key}
                                type="button"
                                onClick={() => updateProfile(cert.key as keyof TestProfile, !isChecked)}
                                className={`
                                  relative px-3 py-3 rounded-xl border-2 transition-all duration-200 text-center
                                  ${isChecked
                                    ? 'border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-100'
                                    : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50'
                                  }
                                `}
                              >
                                {isChecked && (
                                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs">✓</span>
                                  </div>
                                )}
                                <span className={`text-sm font-medium ${isChecked ? 'text-emerald-700' : 'text-slate-600'}`}>
                                  {cert.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 그룹 2: 기술·연구 */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-base">🔬</span>
                          <span className="text-sm font-semibold text-slate-700">기술·연구</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { key: 'hasPatent', label: '특허 보유' },
                            { key: 'hasResearchInstitute', label: '기업부설연구소' },
                          ].map(cert => {
                            const isChecked = profile[cert.key as keyof TestProfile] as boolean;
                            return (
                              <button
                                key={cert.key}
                                type="button"
                                onClick={() => updateProfile(cert.key as keyof TestProfile, !isChecked)}
                                className={`
                                  relative px-3 py-3 rounded-xl border-2 transition-all duration-200 text-center
                                  ${isChecked
                                    ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
                                    : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
                                  }
                                `}
                              >
                                {isChecked && (
                                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs">✓</span>
                                  </div>
                                )}
                                <span className={`text-sm font-medium ${isChecked ? 'text-blue-700' : 'text-slate-600'}`}>
                                  {cert.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 그룹 3: 사업 성과 */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-base">📈</span>
                          <span className="text-sm font-semibold text-slate-700">사업 성과</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { key: 'hasExportRecord', label: '수출 실적' },
                            { key: 'isDisabledStandard', label: '장애인표준사업장' },
                            { key: 'isSocialEnterprise', label: '사회적기업' },
                          ].map(cert => {
                            const isChecked = profile[cert.key as keyof TestProfile] as boolean;
                            return (
                              <button
                                key={cert.key}
                                type="button"
                                onClick={() => updateProfile(cert.key as keyof TestProfile, !isChecked)}
                                className={`
                                  relative px-3 py-3 rounded-xl border-2 transition-all duration-200 text-center
                                  ${isChecked
                                    ? 'border-purple-500 bg-purple-50 shadow-md shadow-purple-100'
                                    : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/50'
                                  }
                                `}
                              >
                                {isChecked && (
                                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs">✓</span>
                                  </div>
                                )}
                                <span className={`text-sm font-medium ${isChecked ? 'text-purple-700' : 'text-slate-600'}`}>
                                  {cert.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </Accordion>

                  {/* 아코디언 2: 정책자금 이력 */}
                  <Accordion
                    title="정책자금 이력"
                    icon="📊"
                    isExpanded={expandedAccordions.includes('history')}
                    onToggle={() => toggleAccordion('history')}
                    badge={profile.existingLoanBalance > 0 || profile.kosmesPreviousCount > 0 ? '이력 있음' : undefined}
                    purposeLabel="참고 정보"
                    purposeColor="blue"
                  >
                    <div className="space-y-4">
                      {/* 기존 대출 잔액 */}
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
                              className="w-20 px-2 py-1 text-sm text-right border border-slate-200 rounded-lg bg-white focus:ring-4 focus:ring-orange-400/40 focus:border-orange-500 focus:shadow-[0_0_25px_rgba(249,115,22,0.35)] transition-all duration-300"
                            />
                            <span className="text-xs text-slate-500">억원</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mb-2">(중복 지원 가능 여부 판단에 사용됩니다)</p>
                        <input
                          type="range"
                          value={profile.existingLoanBalance}
                          onChange={e => updateProfile('existingLoanBalance', parseInt(e.target.value))}
                          min={0}
                          max={50}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                      </div>

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

                      {/* 중진공 이용 횟수 */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-medium text-gray-600">
                            중진공 정책자금 이용 횟수
                            {profile.kosmesPreviousCount >= 4 && <span className="text-red-500 ml-2">⚠️ 졸업제 해당</span>}
                          </label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={profile.kosmesPreviousCount}
                              onChange={e => updateProfile('kosmesPreviousCount', Math.max(0, Math.min(10, parseInt(e.target.value) || 0)))}
                              min={0}
                              max={10}
                              className="w-20 px-2 py-1 text-sm text-right border border-slate-200 rounded-lg bg-white focus:ring-4 focus:ring-orange-400/40 focus:border-orange-500 focus:shadow-[0_0_25px_rgba(249,115,22,0.35)] transition-all duration-300"
                            />
                            <span className="text-xs text-slate-500">회</span>
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
                        <label className="block text-xs font-medium text-gray-600 mb-3">
                          현재 이용 중인 보증기관
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'none', label: '없음', icon: '⭕', desc: '보증 이용 이력 없음' },
                            { value: 'kodit', label: '신용보증기금', icon: '🏛️', desc: '신보 보증 이용 중' },
                            { value: 'kibo', label: '기술보증기금', icon: '🔬', desc: '기보 보증 이용 중' },
                            { value: 'both', label: '둘 다', icon: '🏢', desc: '신보+기보 모두 이용' },
                          ].map(opt => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => updateProfile('currentGuaranteeOrg', opt.value as typeof profile.currentGuaranteeOrg)}
                              className={`p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                                profile.currentGuaranteeOrg === opt.value
                                  ? 'border-orange-400 bg-gradient-to-br from-orange-50 to-amber-50 shadow-md shadow-orange-500/10'
                                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{opt.icon}</span>
                                <span className={`text-sm font-semibold ${
                                  profile.currentGuaranteeOrg === opt.value ? 'text-orange-700' : 'text-slate-700'
                                }`}>{opt.label}</span>
                                {profile.currentGuaranteeOrg === opt.value && (
                                  <Check className="w-4 h-4 text-orange-500 ml-auto" />
                                )}
                              </div>
                              <p className="text-xs text-slate-500 pl-7">{opt.desc}</p>
                            </button>
                          ))}
                        </div>
                        {profile.currentGuaranteeOrg !== 'none' && (
                          <p className="text-xs text-orange-500 mt-2 flex items-center gap-1">
                            <span>⚠️</span> 타 보증기관 자금 신청 시 중복 보증 제한이 있을 수 있습니다
                          </p>
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
                              className="w-20 px-2 py-1 text-sm text-right border border-slate-200 rounded-lg bg-white focus:ring-4 focus:ring-orange-400/40 focus:border-orange-500 focus:shadow-[0_0_25px_rgba(249,115,22,0.35)] transition-all duration-300"
                            />
                            <span className="text-xs text-slate-500">억원</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mb-2">(매출 대비 비율로 추가 지원 가능성 판단)</p>
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
                    </div>
                  </Accordion>

                  {/* 아코디언 3: 심사 확인 사항 (기존 제약 조건) */}
                  <Accordion
                    title="심사 확인 사항"
                    icon="📋"
                    isExpanded={expandedAccordions.includes('constraints')}
                    onToggle={() => toggleAccordion('constraints')}
                    badge={constraintCount > 0 ? `${constraintCount}개 확인` : undefined}
                    purposeLabel="사전 확인"
                    purposeColor="slate"
                  >
                    <div className="space-y-4">
                      {/* 상단 안내 문구 */}
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <p className="text-sm text-slate-700 font-medium mb-1">
                          현재 아래 사항에 해당하는 것이 있나요?
                        </p>
                        <p className="text-xs text-slate-500">
                          (없다면 선택하지 않으셔도 됩니다)
                        </p>
                      </div>

                      {/* 체크박스 목록 */}
                      <div className="space-y-3">
                        {/* 휴·폐업 */}
                        <div className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={profile.isInactive}
                              onChange={e => updateProfile('isInactive', e.target.checked)}
                              className="w-4 h-4 rounded border-slate-300 text-slate-600 focus:ring-slate-500"
                            />
                            <span className="text-sm text-slate-700">현재 휴·폐업 상태</span>
                          </label>
                          {profile.isInactive && (
                            <div className="mt-2 ml-7 p-2 bg-blue-50 rounded-lg border border-blue-100">
                              <p className="text-xs text-blue-700">ℹ️ 재도전 특례자금 등 일부 상품 검토 가능합니다</p>
                            </div>
                          )}
                        </div>

                        {/* 세금 체납 */}
                        <div className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={profile.hasTaxDelinquency}
                              onChange={e => {
                                updateProfile('hasTaxDelinquency', e.target.checked);
                                if (!e.target.checked) {
                                  updateProfile('hasTaxInstallmentApproval', false);
                                }
                              }}
                              className="w-4 h-4 rounded border-slate-300 text-slate-600 focus:ring-slate-500"
                            />
                            <span className="text-sm text-slate-700">최근 세금 체납 이력</span>
                          </label>
                          {profile.hasTaxDelinquency && (
                            <div className="mt-3 ml-7 space-y-2">
                              <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-50 rounded-lg">
                                <input
                                  type="checkbox"
                                  checked={profile.hasTaxInstallmentApproval}
                                  onChange={e => updateProfile('hasTaxInstallmentApproval', e.target.checked)}
                                  className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                                />
                                <span className="text-sm text-slate-600">분납 승인 받음</span>
                              </label>
                              <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                                {profile.hasTaxInstallmentApproval ? (
                                  <p className="text-xs text-blue-700">ℹ️ 분납 승인 시 심사 진행 가능 (일부 감점)</p>
                                ) : (
                                  <p className="text-xs text-blue-700">ℹ️ 분납 승인을 받으시면 심사 진행이 가능합니다</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 금융기관 연체 */}
                        <div className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={profile.isCurrentlyDelinquent}
                              onChange={e => updateProfile('isCurrentlyDelinquent', e.target.checked)}
                              className="w-4 h-4 rounded border-slate-300 text-slate-600 focus:ring-slate-500"
                            />
                            <span className="text-sm text-slate-700">금융기관 연체 진행 중</span>
                          </label>
                          {profile.isCurrentlyDelinquent && (
                            <div className="mt-2 ml-7 p-2 bg-blue-50 rounded-lg border border-blue-100">
                              <p className="text-xs text-blue-700">ℹ️ 연체 해소 후 신청 가능하며, 재기지원 상품도 검토해 드립니다</p>
                            </div>
                          )}
                        </div>

                        {/* 보증사고 미정리 */}
                        <div className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={profile.hasUnresolvedGuaranteeAccident}
                              onChange={e => updateProfile('hasUnresolvedGuaranteeAccident', e.target.checked)}
                              className="w-4 h-4 rounded border-slate-300 text-slate-600 focus:ring-slate-500"
                            />
                            <span className="text-sm text-slate-700">보증사고 미정리 상태</span>
                          </label>
                          {profile.hasUnresolvedGuaranteeAccident && (
                            <div className="mt-2 ml-7 p-2 bg-blue-50 rounded-lg border border-blue-100">
                              <p className="text-xs text-blue-700">ℹ️ 정리 후 재도전 자금 등 대안 상품 검토 가능합니다</p>
                            </div>
                          )}
                        </div>

                        {/* 과거 부실/사고 이력 */}
                        <div className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={profile.hasPastDefault}
                              onChange={e => {
                                updateProfile('hasPastDefault', e.target.checked);
                                if (!e.target.checked) {
                                  updateProfile('isPastDefaultResolved', false);
                                }
                              }}
                              className="w-4 h-4 rounded border-slate-300 text-slate-600 focus:ring-slate-500"
                            />
                            <span className="text-sm text-slate-700">과거 부실 이력 (보증·대출)</span>
                          </label>
                          {profile.hasPastDefault && (
                            <div className="mt-3 ml-7 space-y-2">
                              <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-50 rounded-lg">
                                <input
                                  type="checkbox"
                                  checked={profile.isPastDefaultResolved}
                                  onChange={e => updateProfile('isPastDefaultResolved', e.target.checked)}
                                  className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                                />
                                <span className="text-sm text-slate-600">정리 완료 (채무 상환/면책)</span>
                              </label>
                              <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                                {profile.isPastDefaultResolved ? (
                                  <p className="text-xs text-emerald-700">✓ 재창업/재기자금 우대 대상입니다</p>
                                ) : (
                                  <p className="text-xs text-blue-700">ℹ️ 정리 완료 시 재창업 우대 상품 이용 가능합니다</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 신용회복 중 */}
                        <div className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={profile.isCreditRecoveryInProgress}
                              onChange={e => updateProfile('isCreditRecoveryInProgress', e.target.checked)}
                              className="w-4 h-4 rounded border-slate-300 text-slate-600 focus:ring-slate-500"
                            />
                            <span className="text-sm text-slate-700">신용회복 절차 진행 중</span>
                          </label>
                          {profile.isCreditRecoveryInProgress && (
                            <div className="mt-2 ml-7 p-2 bg-blue-50 rounded-lg border border-blue-100">
                              <p className="text-xs text-blue-700">ℹ️ 재도전자금 등 특례 상품으로 안내해 드립니다</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 하단 이탈 방지 안내 */}
                      <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-100">
                        <span className="text-base">✔</span>
                        <div>
                          <p className="font-medium">해당 사항이 있어도 괜찮습니다</p>
                          <p className="text-xs text-emerald-600 mt-0.5">일부 정책자금 또는 대안 상품은 검토 가능합니다</p>
                        </div>
                      </div>
                    </div>
                  </Accordion>

                </div>
              )}

              {/* ================================================================
                  Step 4: 전체 요약 + 매칭 실행
                  ================================================================ */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-lg flex items-center justify-center text-xs shadow-md">✓</span>
                    AI 분석 요약
                  </h3>

                  {/* AI 사전 분석 메시지 */}
                  <div className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-200">
                    <div className="flex items-start gap-3">
                      <span className="text-lg">📊</span>
                      <div>
                        <p className="text-sm font-semibold text-violet-800 mb-1">AI 사전 분석 요약</p>
                        <p className="text-sm text-violet-700">
                          {(() => {
                            const isYouth = profile.ceoAge <= 39;
                            const hasConstraint = profile.hasTaxDelinquency || profile.isCreditRecoveryInProgress || (profile.hasPastDefault && !profile.isPastDefaultResolved);
                            const isStartup = businessAge <= 3;
                            const isVenture = profile.isVenture;
                            const isRestart = profile.isRestart;
                            const hasSmartFactory = profile.hasSmartFactoryPlan;
                            const hasEsg = profile.hasEsgInvestmentPlan;

                            if (hasConstraint) {
                              return "일부 제약 조건이 있어 특수 자금 또는 재도전 자금 위주의 매칭이 예상됩니다";
                            }
                            if (isRestart) {
                              return "재창업 기업으로 재도전 특화 정책자금 매칭이 예상됩니다";
                            }
                            if (isYouth && isStartup) {
                              return "청년 창업 우대 정책자금 중심의 매칭이 예상됩니다";
                            }
                            if (isVenture) {
                              return "벤처/혁신 기업 특화 정책자금 매칭이 예상됩니다";
                            }
                            if (hasSmartFactory || hasEsg) {
                              return "스마트공장/ESG 특화 정책자금 매칭이 예상됩니다";
                            }
                            return "현재 입력 정보 기준으로 일반 정책자금 중심의 매칭이 예상됩니다";
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 요약 섹션 1: 기본 정보 (2단 구조) */}
                  <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-xl border border-blue-200/50">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-blue-800">📋 기본 정보 + 대표자</span>
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="group relative text-xs text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5 rounded-lg bg-blue-100/70 hover:bg-blue-200/70 transition-all flex items-center gap-1"
                      >
                        <span className="text-[10px]">✏️</span>
                        <span>다시 입력</span>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
                          정확히 입력하면 매칭 정확도 UP!
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                        </div>
                      </button>
                    </div>

                    {/* 핵심 요약 - AI 판단에 중요한 정보 */}
                    <div className="mb-3">
                      <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2">핵심 요약</div>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="bg-white/70 rounded-lg p-2.5 text-center border border-blue-100">
                          <div className="text-[10px] text-slate-500 mb-0.5">업종</div>
                          <div className="text-sm font-bold text-slate-800">{INDUSTRY_OPTIONS.find(i => i.value === profile.industry)?.label?.slice(0, 4) || '-'}</div>
                        </div>
                        <div className="bg-white/70 rounded-lg p-2.5 text-center border border-blue-100">
                          <div className="text-[10px] text-slate-500 mb-0.5">업력</div>
                          <div className="text-sm font-bold text-slate-800">{businessAge}년</div>
                        </div>
                        <div className="bg-white/70 rounded-lg p-2.5 text-center border border-blue-100">
                          <div className="text-[10px] text-slate-500 mb-0.5">매출</div>
                          <div className="text-sm font-bold text-slate-800">{profile.annualRevenue}억</div>
                        </div>
                        <div className="bg-white/70 rounded-lg p-2.5 text-center border border-blue-100">
                          <div className="text-[10px] text-slate-500 mb-0.5">필요자금</div>
                          <div className="text-sm font-bold text-blue-700">{profile.requiredFundingAmount}억</div>
                        </div>
                      </div>
                    </div>

                    {/* 참고 정보 */}
                    <div className="pt-3 border-t border-blue-100/50">
                      <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2">참고 정보</div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>지역: <span className="text-slate-700">{profile.location}</span></span>
                        <span>직원: <span className="text-slate-700">{profile.employeeCount}명</span></span>
                        <span>부채비율: <span className="text-slate-700">{profile.debtRatio}%</span></span>
                        <span>대표자: <span className="text-slate-700">{profile.ceoAge}세{profile.isFemale ? ' (여성)' : ''}{profile.isDisabled ? ' (장애인)' : ''}</span></span>
                      </div>
                    </div>
                  </div>

                  {/* 요약 섹션 2: 필요 자금 */}
                  <div className="p-5 bg-gradient-to-br from-cyan-50 to-blue-50/50 rounded-xl border border-cyan-200/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-cyan-800">💰 필요 자금 + 특수 계획</span>
                      <button
                        onClick={() => setCurrentStep(2)}
                        className="group relative text-xs text-cyan-600 hover:text-cyan-800 font-medium px-3 py-1.5 rounded-lg bg-cyan-100/70 hover:bg-cyan-200/70 transition-all flex items-center gap-1"
                      >
                        <span className="text-[10px]">✏️</span>
                        <span>다시 입력</span>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
                          정확히 입력하면 매칭 정확도 UP!
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                        </div>
                      </button>
                    </div>
                    <div className="text-sm text-slate-700">
                      <div>필요 자금: <span className="font-semibold text-slate-800">{profile.requiredFundingAmount}억원</span></div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {profile.fundingPurposeWorking && <span className="px-2.5 py-1 bg-cyan-100 text-cyan-700 text-xs font-medium rounded-full">운전자금</span>}
                        {profile.fundingPurposeFacility && <span className="px-2.5 py-1 bg-cyan-100 text-cyan-700 text-xs font-medium rounded-full">시설자금</span>}
                        {profile.hasSmartFactoryPlan && <span className="px-2.5 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">스마트공장</span>}
                        {profile.hasEsgInvestmentPlan && <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">ESG/탄소중립</span>}
                        {profile.isEmergencySituation && <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">긴급경영안정</span>}
                        {profile.hasJobCreation && <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">고용증가</span>}
                        {profile.isGreenEnergyBusiness && <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">신재생에너지</span>}
                        {profile.hasIpoOrInvestmentPlan && <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">IPO/투자계획</span>}
                        {profile.hasVentureInvestment && <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">벤처투자 실적</span>}
                      </div>
                    </div>
                  </div>

                  {/* 요약 섹션 3: 특수 조건 */}
                  <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50/50 rounded-xl border border-purple-200/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-purple-800">🎯 특수 조건</span>
                      <button
                        onClick={() => setCurrentStep(3)}
                        className="group relative text-xs text-purple-600 hover:text-purple-800 font-medium px-3 py-1.5 rounded-lg bg-purple-100/70 hover:bg-purple-200/70 transition-all flex items-center gap-1"
                      >
                        <span className="text-[10px]">✏️</span>
                        <span>다시 입력</span>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
                          정확히 입력하면 매칭 정확도 UP!
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                        </div>
                      </button>
                    </div>
                    <div className="text-sm text-slate-700">
                      <div className="mb-2">
                        <span className="text-slate-500">인증:</span>
                        <span className="ml-1 font-medium">
                          {[
                            profile.isVenture && '벤처',
                            profile.isInnobiz && '이노비즈',
                            profile.isMainbiz && '메인비즈',
                            profile.hasPatent && '특허',
                            profile.hasResearchInstitute && '연구소',
                            profile.hasExportRecord && '수출',
                            profile.isDisabledStandard && '장애인표준사업장',
                            profile.isSocialEnterprise && '사회적기업',
                          ].filter(Boolean).join(', ') || '없음'}
                        </span>
                      </div>
                      <div className="mb-2">
                        <span className="text-slate-500">정책자금 이력:</span>
                        <span className="ml-1 font-medium">
                          대출 {profile.existingLoanBalance}억 / 중진공 {profile.kosmesPreviousCount}회 / 최근 수혜 {profile.recentYearSubsidyAmount}억
                        </span>
                      </div>
                      {constraintCount > 0 && (
                        <div className="text-red-600 font-semibold bg-red-50 px-3 py-2 rounded-lg mt-2">
                          ⚠️ 제약 조건 {constraintCount}개 해당
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* ================================================================
                  Step 5: AI 매칭 결과
                  ================================================================ */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="w-7 h-7 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-lg flex items-center justify-center text-xs shadow-md">🎯</span>
                    AI 매칭 결과
                  </h3>

                  {/* 결과 요약 */}
                  {results.length > 0 && (
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50/70 rounded-2xl p-6 border border-orange-200/50 shadow-sm">
                      <h4 className="text-sm font-semibold text-orange-800 mb-4">매칭 결과 요약</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center shadow-md border border-emerald-100">
                          <div className="text-4xl font-bold text-emerald-600">{highCount}</div>
                          <div className="text-xs text-emerald-700 font-semibold mt-1">HIGH</div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center shadow-md border border-amber-100">
                          <div className="text-4xl font-bold text-amber-600">{mediumCount}</div>
                          <div className="text-xs text-amber-700 font-semibold mt-1">MEDIUM</div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center shadow-md border border-red-100">
                          <div className="text-4xl font-bold text-red-500">{lowCount}</div>
                          <div className="text-xs text-red-700 font-semibold mt-1">LOW</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 전용 트랙 안내 배너 */}
                  {trackInfo?.hasSpecializedTrack && (
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50/70 border border-purple-200/50 rounded-2xl p-5 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                          <span className="text-white text-lg font-bold">★</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-purple-800 mb-1 text-base">
                            {trackInfo.trackLabel}
                          </h4>
                          <p className="text-sm text-purple-700">
                            {trackInfo.trackDescription}
                          </p>
                          <p className="text-xs text-purple-500 mt-2 bg-purple-100/50 px-3 py-1.5 rounded-lg inline-block">
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
                          className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200"
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
                    <div className="bg-slate-50/80 backdrop-blur-sm rounded-2xl p-12 text-center border-2 border-dashed border-slate-200">
                      <div className="text-6xl mb-4">📊</div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">매칭 결과가 없습니다</h3>
                      <p className="text-sm text-slate-500 mb-4">
                        Step 4에서 &apos;매칭 실행&apos; 버튼을 클릭하여<br />
                        AI 매칭 분석을 시작하세요
                      </p>
                      <button
                        onClick={() => setCurrentStep(4)}
                        className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-sm font-semibold shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-200"
                      >
                        Step 4로 이동
                      </button>
                    </div>
                  )}

                </div>
              )}
          </div>

          {/* 네비게이션 버튼 (고정 하단) */}
          <div className="flex-shrink-0 bg-white border border-slate-200 border-t-0 rounded-b-2xl p-4 shadow-sm">
            <div className="flex justify-between items-center">
              {/* 이전 버튼 */}
              {currentStep > 1 ? (
                <button
                  onClick={prevStep}
                  className="px-5 py-2.5 bg-slate-200 text-slate-700 rounded-xl font-semibold flex items-center gap-2 hover:bg-slate-300 transition-all duration-200 text-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  이전
                </button>
              ) : (
                <div />
              )}

              {/* 다음/실행/새로시작 버튼 */}
              {currentStep < 4 && (
                <button
                  onClick={nextStep}
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-200 text-sm"
                >
                  {currentStep === 1 && '다음: 필요 자금 설정'}
                  {currentStep === 2 && '다음: 특수 조건 확인'}
                  {currentStep === 3 && '다음: 최종 확인'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
              {currentStep === 4 && (
                <button
                  onClick={runMatching}
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      AI 분석 중...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      AI 매칭 시작
                    </>
                  )}
                </button>
              )}
              {currentStep === 5 && (
                <button
                  onClick={() => {
                    setResults([]);
                    goToStep(1);
                  }}
                  className="px-5 py-2.5 bg-slate-600 text-white rounded-xl font-semibold hover:bg-slate-700 transition-all duration-200 text-sm"
                >
                  새로 시작
                </button>
              )}
            </div>
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
    high: { bg: 'bg-emerald-500', text: '높음', border: 'border-emerald-200/70', shadow: 'shadow-emerald-500/10' },
    medium: { bg: 'bg-amber-500', text: '보통', border: 'border-amber-200/70', shadow: 'shadow-amber-500/10' },
    low: { bg: 'bg-red-500', text: '낮음', border: 'border-red-200/70', shadow: 'shadow-red-500/10' },
  };
  const level = levelColors[result.level];

  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg ${level.shadow} border ${level.border} overflow-hidden transition-all duration-200 hover:shadow-xl`}>
      {/* 헤더 */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-start gap-4">
          {/* 순위 */}
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-md shadow-orange-500/30">
            {rank}
          </div>

          {/* 내용 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-1.5">
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${colors.bg} ${colors.text}`}>
                {instName}
              </span>
              {/* 트랙 배지 */}
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
                result.track === 'exclusive' ? 'bg-purple-100 text-purple-700' :
                result.track === 'policy_linked' ? 'bg-blue-100 text-blue-700' :
                result.track === 'general' ? 'bg-slate-100 text-slate-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {result.trackLabel}
              </span>
              <div className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${level.bg}`} />
                <span className="text-xs text-slate-500 font-medium">{level.text}</span>
              </div>
              <span className="text-xl font-bold text-slate-800 ml-auto">{result.score}<span className="text-xs text-slate-500 font-medium">점</span></span>
            </div>
            <h4 className="font-semibold text-slate-800 truncate text-base">{result.fundName}</h4>
          </div>

          {/* 확장 아이콘 */}
          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* 확장 내용 */}
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-slate-100">
          {/* 점수 설명 */}
          {result.scoreExplanation && (
            <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-xl border border-blue-100/70">
              <div className="text-xs font-semibold text-blue-700 mb-1.5">왜 이 순위인가요?</div>
              <p className="text-sm text-slate-700">{result.scoreExplanation}</p>
            </div>
          )}

          {/* 지원 조건 */}
          {result.supportDetails && (
            <div className="mt-4 p-4 bg-slate-50/80 rounded-xl">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {result.supportDetails.amount && (
                  <div>
                    <span className="text-slate-500">한도:</span>
                    <span className="ml-1.5 font-semibold text-slate-800">{result.supportDetails.amount}</span>
                  </div>
                )}
                {result.supportDetails.interestRate && (
                  <div>
                    <span className="text-slate-500">금리:</span>
                    <span className="ml-1.5 font-semibold text-slate-800">{result.supportDetails.interestRate}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 적격 사유 */}
          {result.eligibilityReasons.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-semibold text-emerald-700 mb-2">✓ 적격 사유</div>
              <ul className="space-y-1.5">
                {result.eligibilityReasons.map((reason, idx) => (
                  <li key={idx} className="text-xs text-slate-600 pl-4 relative before:absolute before:left-0 before:content-['•'] before:text-emerald-500 before:font-bold">
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 감점 요소 (warnings) */}
          {result.warnings && result.warnings.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-semibold text-amber-700 mb-2">⚠️ 감점 요소</div>
              <ul className="space-y-1.5">
                {result.warnings.map((warning, idx) => (
                  <li key={idx} className="text-xs text-slate-600 pl-4 relative before:absolute before:left-0 before:content-['•'] before:text-amber-500 before:font-bold">
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 부적격/경고 사유 */}
          {result.ineligibilityReasons.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-semibold text-red-700 mb-2">✗ 주의 사항</div>
              <ul className="space-y-1.5">
                {result.ineligibilityReasons.map((reason, idx) => (
                  <li key={idx} className="text-xs text-slate-600 pl-4 relative before:absolute before:left-0 before:content-['•'] before:text-red-500 before:font-bold">
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
              className="mt-4 flex items-center justify-center gap-1.5 w-full py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all duration-200"
            >
              공고원문
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
