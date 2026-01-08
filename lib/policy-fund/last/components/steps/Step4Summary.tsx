'use client';

/**
 * lib/policy-fund/last/components/steps/Step4Summary.tsx
 *
 * Step 4: 최종 확인 (요약 화면)
 */

import { TestProfile } from '../../ui-types';
import { INDUSTRY_OPTIONS } from '../../constants/industries';

interface Step4SummaryProps {
  profile: TestProfile;
  businessAge: number;
  constraintCount: number;
  goToStep: (step: number) => void;
}

export function Step4Summary({
  profile,
  businessAge,
  constraintCount,
  goToStep,
}: Step4SummaryProps) {
  return (
    <div className="space-y-4">
      {/* 요약 섹션 1: 기본 정보 (중립 그레이) */}
      <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-slate-800">📋 기본 정보 + 대표자</span>
          <button
            onClick={() => goToStep(1)}
            className="text-xs text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 transition-colors"
          >
            <span className="text-[10px]">✏️</span>
            <span>수정</span>
          </button>
        </div>

        {/* 핵심 요약 */}
        <div className="mb-3">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">핵심 요약</div>
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white rounded-lg p-2.5 text-center border border-slate-200">
              <div className="text-[10px] text-slate-400 mb-0.5">업종</div>
              <div className="text-sm font-bold text-slate-800">
                {INDUSTRY_OPTIONS.find(i => i.value === profile.industry)?.label?.slice(0, 4) || '-'}
              </div>
            </div>
            <div className="bg-white rounded-lg p-2.5 text-center border border-slate-200">
              <div className="text-[10px] text-slate-400 mb-0.5">업력</div>
              <div className="text-sm font-bold text-slate-800">{businessAge}년</div>
            </div>
            <div className="bg-white rounded-lg p-2.5 text-center border border-slate-200">
              <div className="text-[10px] text-slate-400 mb-0.5">매출</div>
              <div className="text-sm font-bold text-slate-800">{profile.annualRevenue}억</div>
            </div>
            <div className="bg-white rounded-lg p-2.5 text-center border border-slate-200">
              <div className="text-[10px] text-slate-400 mb-0.5">필요자금</div>
              <div className="text-sm font-bold text-slate-800">{profile.requiredFundingAmount}억</div>
            </div>
          </div>
        </div>

        {/* 참고 정보 */}
        <div className="pt-3 border-t border-slate-200">
          <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2">참고 정보</div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            <span>지역: <span className="text-slate-700">{profile.location}</span></span>
            <span>직원: <span className="text-slate-700">{profile.employeeCount}명</span></span>
            <span>부채비율: <span className="text-slate-700">{profile.debtRatio}%</span></span>
            <span>대표자: <span className="text-slate-700">{profile.ceoAge}세{profile.isFemale ? ' (여성)' : ''}{profile.isDisabled ? ' (장애인)' : ''}</span></span>
          </div>
        </div>
      </div>

      {/* 요약 섹션 2: 필요 자금 (중립 그레이) */}
      <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-800">💰 필요 자금 + 특수 계획</span>
          <button
            onClick={() => goToStep(2)}
            className="text-xs text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 transition-colors"
          >
            <span className="text-[10px]">✏️</span>
            <span>수정</span>
          </button>
        </div>
        <div className="text-sm text-slate-700">
          <div>필요 자금: <span className="font-semibold text-slate-800">{profile.requiredFundingAmount}억원</span></div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {profile.fundingPurposeWorking && <span className="px-2.5 py-1 bg-slate-200 text-slate-700 text-xs font-medium rounded-full">운전자금</span>}
            {profile.fundingPurposeFacility && <span className="px-2.5 py-1 bg-slate-200 text-slate-700 text-xs font-medium rounded-full">시설자금</span>}
            {profile.hasSmartFactoryPlan && <span className="px-2.5 py-1 bg-slate-200 text-slate-700 text-xs font-medium rounded-full">스마트공장</span>}
            {profile.hasEsgInvestmentPlan && <span className="px-2.5 py-1 bg-slate-200 text-slate-700 text-xs font-medium rounded-full">ESG/탄소중립</span>}
            {profile.isEmergencySituation && <span className="px-2.5 py-1 bg-slate-200 text-slate-700 text-xs font-medium rounded-full">긴급경영안정</span>}
            {profile.hasJobCreation && <span className="px-2.5 py-1 bg-slate-200 text-slate-700 text-xs font-medium rounded-full">고용증가</span>}
            {profile.isGreenEnergyBusiness && <span className="px-2.5 py-1 bg-slate-200 text-slate-700 text-xs font-medium rounded-full">신재생에너지</span>}
            {profile.hasIpoOrInvestmentPlan && <span className="px-2.5 py-1 bg-slate-200 text-slate-700 text-xs font-medium rounded-full">IPO/투자계획</span>}
            {profile.hasVentureInvestment && <span className="px-2.5 py-1 bg-slate-200 text-slate-700 text-xs font-medium rounded-full">벤처투자 실적</span>}
          </div>
        </div>
      </div>

      {/* 요약 섹션 3: 특수 조건 (중립 그레이) */}
      <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-800">🎯 특수 조건</span>
          <button
            onClick={() => goToStep(3)}
            className="text-xs text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 transition-colors"
          >
            <span className="text-[10px]">✏️</span>
            <span>수정</span>
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
            <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-2 rounded-lg mt-2 border border-amber-200">
              <span>⚠️</span>
              <span className="font-medium">제약 조건 {constraintCount}개 해당</span>
              <span className="text-xs text-amber-600 ml-1">(검토 가능한 정책자금도 함께 분석됩니다)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
