'use client';

/**
 * app/test/step-ui/page.tsx
 *
 * 정책자금 매칭 테스트 페이지 (모듈화 버전)
 */

import { useState, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, RotateCcw } from 'lucide-react';

// 분리된 모듈 import
import {
  // 매칭 함수 및 타입
  matchWithKnowledgeBase,
  ExtendedCompanyProfile,
  DetailedMatchResult,
  // 상수
  INDUSTRY_OPTIONS,
} from '@/lib/policy-fund/last';

// TrackInfo 타입 정의 (inline)
interface TrackInfo {
  hasSpecializedTrack: boolean;
  trackType: string | null;
  trackLabel: string;
  trackDescription: string;
}

// 분리된 훅
import {
  useStepForm,
  useStepNav,
  useBusinessCalc,
} from '@/lib/policy-fund/last/hooks';

// 분리된 컴포넌트
import {
  StepIndicator,
  StepHeader,
} from '@/lib/policy-fund/last/components/shared';

// Step 컴포넌트
import {
  Step1BasicInfo,
  Step2FundingNeeds,
  Step3Conditions,
  Step4Summary,
  Step5Results,
} from '@/lib/policy-fund/last/components/steps';

// ============================================================================
// 메인 컴포넌트
// ============================================================================

export default function TestPage() {
  // 분리된 훅 사용
  const { profile, setProfile, updateProfile, resetProfile } = useStepForm();
  const { currentStep, goToStep, nextStep, prevStep } = useStepNav();
  const { businessAge, companySize, constraintCount, certCount } = useBusinessCalc(profile);

  // 매칭 결과 상태
  const [results, setResults] = useState<DetailedMatchResult[]>([]);
  const [trackInfo, setTrackInfo] = useState<TrackInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 아코디언 상태 (Step 3용)
  const [expandedAccordions, setExpandedAccordions] = useState<string[]>([]);

  // 초기화 확인 모달 상태
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // 스크롤 영역 ref
  const contentRef = useRef<HTMLDivElement>(null);

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
        companySize: companySize,
        businessAge: businessAge.years,
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

      // 매칭 완료 후 Step 5 (AI 매칭 결과)로 이동
      goToStep(5);
    } catch (error) {
      console.error('매칭 실행 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, [profile, businessAge, companySize, goToStep]);

  // Step 이동 핸들러 (스크롤 초기화 포함)
  const handleGoToStep = useCallback((step: number) => {
    goToStep(step);
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [goToStep]);

  const handleNextStep = useCallback(() => {
    nextStep();
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [nextStep]);

  const handlePrevStep = useCallback(() => {
    prevStep();
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [prevStep]);

  // 새 분석 시작
  const handleReset = useCallback(() => {
    setResults([]);
    resetProfile();
    goToStep(1);
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [resetProfile, goToStep]);

  // 결과 통계
  const highCount = results.filter(r => r.level === 'high').length;
  const mediumCount = results.filter(r => r.level === 'medium').length;
  const lowCount = results.filter(r => r.level === 'low').length;

  return (
    <div className="h-full overflow-hidden flex flex-col bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 w-full flex flex-col flex-1 overflow-hidden">
        {/* 헤더 (고정 영역) */}
        <div className="flex-shrink-0 pt-4 pb-2 px-3 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">정책자금 적합도 진단</h1>
            <p className="text-[13px] text-gray-500 mt-1">기업 정보를 기반으로 신청 가능한 정책자금을 분석합니다</p>
          </div>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800
                       border border-slate-300 hover:border-slate-400
                       rounded-lg transition-all flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            새 진단 시작
          </button>
        </div>

        {/* 메인 컨테이너 (가변 영역, 내부 스크롤) */}
        <div className="flex-1 min-h-0 w-full flex flex-col overflow-hidden">
          {/* Step Indicator (고정) */}
          <div className="flex-shrink-0 bg-white border border-slate-200 rounded-t-2xl shadow-sm p-4">
            <StepIndicator
              currentStep={currentStep}
              totalSteps={5}
              onStepClick={handleGoToStep}
            />
          </div>

          {/* Step Content (스크롤 영역) */}
          <div
            ref={contentRef}
            className="flex-1 min-h-0 overflow-y-auto bg-white border-x border-slate-200 p-6"
          >
            {/* Step Header - 모든 Step에 표시 */}
            <StepHeader currentStep={currentStep} />

            {/* Step 1: 기본 정보 + 대표자 */}
            {currentStep === 1 && (
              <Step1BasicInfo
                profile={profile}
                updateProfile={updateProfile}
                businessAge={businessAge}
                companySize={companySize}
              />
            )}

            {/* Step 2: 필요 자금 + 특수 계획 */}
            {currentStep === 2 && (
              <Step2FundingNeeds
                profile={profile}
                updateProfile={updateProfile}
                setProfile={setProfile}
                expandedAccordions={expandedAccordions}
                toggleAccordion={toggleAccordion}
              />
            )}

            {/* Step 3: 특수 조건 (3개 아코디언) */}
            {currentStep === 3 && (
              <Step3Conditions
                profile={profile}
                updateProfile={updateProfile}
                expandedAccordions={expandedAccordions}
                toggleAccordion={toggleAccordion}
                certCount={certCount}
                constraintCount={constraintCount}
              />
            )}

            {/* Step 4: 최종 확인 (요약) */}
            {currentStep === 4 && (
              <Step4Summary
                profile={profile}
                businessAge={businessAge.years}
                constraintCount={constraintCount}
                goToStep={handleGoToStep}
              />
            )}

            {/* Step 5: AI 매칭 결과 */}
            {currentStep === 5 && (
              <Step5Results
                results={results}
                trackInfo={trackInfo}
                highCount={highCount}
                mediumCount={mediumCount}
                lowCount={lowCount}
                goToStep={handleGoToStep}
                expandedAccordions={expandedAccordions}
                toggleAccordion={toggleAccordion}
              />
            )}
          </div>

          {/* 네비게이션 버튼 (고정 하단) */}
          <div className="flex-shrink-0 bg-white border border-slate-200 border-t-0 rounded-b-2xl p-4 shadow-sm">
            <div className="flex justify-between items-center">
              {/* 이전 버튼 */}
              {currentStep > 1 ? (
                <button
                  onClick={handlePrevStep}
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
                  onClick={handleNextStep}
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-200 text-sm"
                >
                  {currentStep === 1 && '다음: 필요 자금 설정'}
                  {currentStep === 2 && '다음: 특수 조건 확인'}
                  {currentStep === 3 && '다음: 최종 확인'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
              {currentStep === 4 && (
                <div className="flex flex-col items-end gap-2">
                  {/* 보조 문구 */}
                  {!isLoading && (
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <span>⏱️</span>
                        <span>약 10초 소요</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span>📄</span>
                        <span>매칭 결과 리포트 제공</span>
                      </span>
                    </div>
                  )}
                  {/* CTA 버튼 */}
                  <button
                    onClick={runMatching}
                    disabled={isLoading}
                    className="px-7 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        AI 분석 중...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        AI 정책자금 분석 시작
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 초기화 확인 모달 */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              새 진단을 시작하시겠습니까?
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              현재 입력 정보가 모두 초기화됩니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-slate-300
                           text-slate-700 rounded-xl font-medium
                           hover:bg-slate-50 transition-all"
              >
                취소
              </button>
              <button
                onClick={() => {
                  setShowResetConfirm(false);
                  handleReset();
                }}
                className="flex-1 px-4 py-2.5 bg-slate-700 text-white
                           rounded-xl font-medium hover:bg-slate-800 transition-all"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
