'use client';

/**
 * lib/policy-fund/last/components/steps/Step2FundingNeeds.tsx
 *
 * Step 2: 필요 자금 규모 및 용도 설정
 */

import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { TestProfile } from '../../ui-types';
import { FUNDING_STEPS, FUNDING_PURPOSE_OPTIONS } from '../../constants/funding';

interface Step2FundingNeedsProps {
  profile: TestProfile;
  updateProfile: <K extends keyof TestProfile>(key: K, value: TestProfile[K]) => void;
  setProfile: React.Dispatch<React.SetStateAction<TestProfile>>;
}

export function Step2FundingNeeds({
  profile,
  updateProfile,
  setProfile,
}: Step2FundingNeedsProps) {
  // 슬라이더 인덱스 계산
  const initialIndex = FUNDING_STEPS.findIndex((s) => s.value === profile.requiredFundingAmount);
  const [fundingStepIndex, setFundingStepIndex] = useState(initialIndex >= 0 ? initialIndex : 2);
  const [isStep2SubExpanded, setIsStep2SubExpanded] = useState(false);

  // 현재 자금 용도 계산
  const { fundingPurposeWorking: w, fundingPurposeFacility: f } = profile;
  const currentPurpose = w && f ? 'mixed' : w && !f ? 'working' : !w && f ? 'facility' : 'working';

  return (
    <div className="space-y-4 [&:has(input:focus,select:focus)_:is(input,select):not(:focus)]:opacity-50 [&:has(input:focus,select:focus)_:is(input,select):not(:focus)]:transition-opacity">
      {/* 주카드: 필요 자금 규모/성격 */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
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
              onChange={(e) => {
                const index = parseInt(e.target.value);
                setFundingStepIndex(index);
                const step = FUNDING_STEPS[index];
                setProfile((prev) => ({
                  ...prev,
                  requiredFundingAmount: step.value,
                  needsLargeFunding: step.value >= 5,
                }));
              }}
              className="w-full h-3 bg-slate-200 rounded-full appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7
                         [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-orange-500
                         [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer
                         [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110"
            />
            <div className="flex justify-between mt-2 text-xs text-slate-400 font-medium">
              <span>1억 미만</span>
              <span>3억</span>
              <span>5억</span>
              <span>10억+</span>
            </div>
          </div>

          {/* 현재 선택 피드백 */}
          <div className="bg-white rounded-xl p-4 border-2 border-orange-400 text-center shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-3xl font-bold text-orange-600">
                {FUNDING_STEPS[fundingStepIndex].label}
              </span>
              {FUNDING_STEPS[fundingStepIndex].value >= 5 && (
                <span className="px-2.5 py-1 bg-orange-100 text-orange-600 text-xs font-bold rounded-full border border-orange-200">
                  대규모
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600">{FUNDING_STEPS[fundingStepIndex].desc}</p>
          </div>
        </div>

        {/* 자금 용도 - 카드 선택 */}
        <div className="mt-5">
          <label className="text-sm font-medium text-slate-600 mb-3 block">자금 용도</label>
          <div className="grid grid-cols-3 gap-3">
            {FUNDING_PURPOSE_OPTIONS.map((option) => {
              const isSelected = currentPurpose === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setProfile((prev) => ({
                      ...prev,
                      fundingPurposeWorking: option.working,
                      fundingPurposeFacility: option.facility,
                    }));
                  }}
                  className={`
                    relative p-4 rounded-xl border-2 transition-all duration-200 text-left bg-white
                    ${isSelected ? 'border-orange-500 shadow-md' : 'border-slate-200 hover:border-slate-300'}
                  `}
                >
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="text-2xl mb-2">{option.icon}</div>
                  <div className={`font-semibold text-sm ${isSelected ? 'text-orange-700' : 'text-slate-700'}`}>
                    {option.label}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{option.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 보조카드: 특수목적자금 매칭 */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <button
          onClick={() => setIsStep2SubExpanded((prev) => !prev)}
          className="w-full px-5 py-3.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-all"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🎯</span>
            <span className="font-semibold text-slate-700">특수목적자금 매칭</span>
            <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full font-medium">
              고급
            </span>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${
              isStep2SubExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isStep2SubExpanded && (
          <div className="p-5 space-y-4 bg-white border-t border-slate-100">
            <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
              💡 해당 사항이 있으면 체크해 주세요.{' '}
              <strong className="text-slate-700">전용자금을 우선 추천</strong>합니다.
            </p>

            {/* 투자/성장 계획 */}
            <div className="rounded-lg">
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span>📈</span> 투자/성장 계획
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'hasIpoOrInvestmentPlan', label: 'IPO/투자 유치' },
                  { key: 'hasVentureInvestment', label: '벤처투자 실적' },
                  { key: 'acceptsEquityDilution', label: '지분희석 감수' },
                  { key: 'needsLargeFunding', label: '대규모 (5억+)' },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border border-slate-200 bg-white hover:border-orange-300 transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={profile[item.key as keyof TestProfile] as boolean}
                      onChange={(e) => updateProfile(item.key as keyof TestProfile, e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm text-slate-700">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 특수 자금 계획 */}
            <div className="rounded-lg">
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span>🎯</span> 특수 자금 계획
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { key: 'hasSmartFactoryPlan', label: '스마트공장' },
                  { key: 'hasEsgInvestmentPlan', label: 'ESG/탄소중립' },
                  { key: 'isEmergencySituation', label: '긴급경영' },
                  { key: 'hasJobCreation', label: '고용증가' },
                  { key: 'isGreenEnergyBusiness', label: '신재생에너지', colSpan: true },
                ].map((item) => (
                  <label
                    key={item.key}
                    className={`flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border border-slate-200 bg-white hover:border-orange-300 transition-all ${
                      item.colSpan ? 'md:col-span-2' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={profile[item.key as keyof TestProfile] as boolean}
                      onChange={(e) => updateProfile(item.key as keyof TestProfile, e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm text-slate-700">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 업력 예외 조건 */}
            <div className="rounded-lg">
              <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <span>🎓</span> 업력 예외 조건
              </h4>
              <p className="text-xs text-slate-500 mb-3">청년전용창업자금 업력 3년 → 7년 완화</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {[
                  { key: 'isYouthStartupAcademyGrad', label: '청년창업사관학교' },
                  { key: 'isGlobalStartupAcademyGrad', label: '글로벌창업사관학교' },
                  { key: 'hasKiboYouthGuarantee', label: '기보 청년보증' },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border border-slate-200 bg-white hover:border-orange-300 transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={profile[item.key as keyof TestProfile] as boolean}
                      onChange={(e) => updateProfile(item.key as keyof TestProfile, e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
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
  );
}
