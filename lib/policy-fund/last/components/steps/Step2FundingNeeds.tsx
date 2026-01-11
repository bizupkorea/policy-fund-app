'use client';

/**
 * lib/policy-fund/last/components/steps/Step2FundingNeeds.tsx
 *
 * Step 2: 필요 자금 규모 및 용도 설정
 */

import { Check, ChevronDown } from 'lucide-react';
import { TestProfile } from '../../ui-types';
import { FUNDING_PURPOSE_OPTIONS } from '../../constants/funding';

interface Step2FundingNeedsProps {
  profile: TestProfile;
  updateProfile: <K extends keyof TestProfile>(key: K, value: TestProfile[K]) => void;
  setProfile: React.Dispatch<React.SetStateAction<TestProfile>>;
  expandedAccordions: string[];
  toggleAccordion: (id: string) => void;
}

export function Step2FundingNeeds({
  profile,
  updateProfile,
  setProfile,
  expandedAccordions,
  toggleAccordion,
}: Step2FundingNeedsProps) {
  const isStep2SubExpanded = expandedAccordions.includes('step2-special');

  // 현재 자금 용도 계산
  const { fundingPurposeWorking: w, fundingPurposeFacility: f } = profile;
  const currentPurpose = w && f ? 'mixed' : w && !f ? 'working' : !w && f ? 'facility' : 'working';

  // 금액 변경 핸들러 (스테퍼, 직접입력)
  // value: 억원 단위 (소수점 지원, 0.1억 = 1천만원)
  const handleAmountChange = (value: number) => {
    const clampedValue = Math.max(0, Math.min(100, value));

    setProfile((prev) => ({
      ...prev,
      requiredFundingAmount: clampedValue,
      needsLargeFunding: clampedValue >= 5,
    }));
  };

  // 억/천만원 분리 입력을 위한 계산값
  const amount = profile.requiredFundingAmount;
  const billionPart = Math.floor(amount);
  const tenMillionPart = Math.round((amount % 1) * 10);

  // 억 필드 변경 핸들러 (천만원 유지)
  const handleBillionChange = (billion: number) => {
    const clamped = Math.max(0, Math.min(100, billion));
    const newAmount = clamped + tenMillionPart / 10;
    handleAmountChange(newAmount);
  };

  // 천만원 필드 변경 핸들러 (0~9)
  const handleTenMillionChange = (tenMillion: number) => {
    if (tenMillion >= 10) {
      // 10 입력 시 억 자동 증가
      handleBillionChange(billionPart + 1);
      return;
    }
    const clamped = Math.max(0, tenMillion);
    const newAmount = billionPart + clamped / 10;
    handleAmountChange(newAmount);
  };

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

          {/* 스테퍼 + 억/천만원 분리 입력 */}
          <div className="bg-white rounded-xl py-3 px-4 border-2 border-blue-400 shadow-sm">
            <div className="flex items-center justify-center gap-3">
              {/* 감소 버튼 (1천만원 = 0.1억 단위) */}
              <button
                type="button"
                onClick={() => handleAmountChange(Math.round((amount - 0.1) * 10) / 10)}
                disabled={amount <= 0}
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200
                           disabled:opacity-40 disabled:cursor-not-allowed
                           flex items-center justify-center text-xl font-bold text-slate-600
                           transition-all active:scale-95"
              >
                −
              </button>

              {/* 억 입력 (음영 플레이스홀더) */}
              <div className="flex items-center">
                <div className="relative">
                  {/* 음영 플레이스홀더 */}
                  {!billionPart && (
                    <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-slate-300 pointer-events-none">
                      00
                    </span>
                  )}
                  <input
                    type="number"
                    value={billionPart || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        handleBillionChange(0);
                      } else {
                        handleBillionChange(parseInt(val) || 0);
                      }
                    }}
                    onFocus={(e) => e.target.select()}
                    className="w-14 text-3xl font-bold text-blue-600 text-center bg-slate-50 rounded-lg
                               border border-slate-200 outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400
                               [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                               [&::-webkit-inner-spin-button]:appearance-none transition-all"
                    min={0}
                    max={100}
                  />
                </div>
                <span className="text-xl font-bold text-blue-600 ml-1">억</span>
              </div>

              {/* 천만원 입력 (음영 플레이스홀더) */}
              <div className="flex items-center">
                <div className="relative">
                  {/* 음영 플레이스홀더 */}
                  {!tenMillionPart && (
                    <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-slate-300 pointer-events-none">
                      0
                    </span>
                  )}
                  <input
                    type="number"
                    value={tenMillionPart || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        handleTenMillionChange(0);
                      } else {
                        handleTenMillionChange(parseInt(val) || 0);
                      }
                    }}
                    onFocus={(e) => e.target.select()}
                    className="w-10 text-3xl font-bold text-blue-600 text-center bg-slate-50 rounded-lg
                               border border-slate-200 outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400
                               [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                               [&::-webkit-inner-spin-button]:appearance-none transition-all"
                    min={0}
                    max={9}
                  />
                </div>
                <span className="text-lg font-bold text-blue-600 ml-1">천만원</span>
              </div>

              {/* 대규모 뱃지 (5억 이상) */}
              {amount >= 5 && (
                <span className="px-2.5 py-1 bg-blue-100 text-blue-600 text-xs font-bold rounded-full border border-blue-200">
                  대규모
                </span>
              )}

              {/* 증가 버튼 (1천만원 = 0.1억 단위) */}
              <button
                type="button"
                onClick={() => handleAmountChange(Math.round((amount + 0.1) * 10) / 10)}
                disabled={amount >= 100}
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200
                           disabled:opacity-40 disabled:cursor-not-allowed
                           flex items-center justify-center text-xl font-bold text-slate-600
                           transition-all active:scale-95"
              >
                +
              </button>
            </div>
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
          onClick={() => toggleAccordion('step2-special')}
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
            {/* 투자/성장 계획 */}
            <div className="rounded-lg">
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span>📈</span> 투자/성장 계획
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { key: 'hasIpoOrInvestmentPlan', label: 'IPO/투자 유치' },
                  { key: 'hasVentureInvestment', label: '벤처투자 실적' },
                  { key: 'acceptsEquityDilution', label: '지분희석 감수' },
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
                  { key: 'isGreenEnergyBusiness', label: '신재생에너지' },
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

            {/* 사회적가치 기업 */}
            <div className="rounded-lg">
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span>🤝</span> 사회적가치 기업
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { key: 'isDisabledStandard', label: '장애인표준사업장' },
                  { key: 'isSocialEnterprise', label: '사회적기업' },
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
