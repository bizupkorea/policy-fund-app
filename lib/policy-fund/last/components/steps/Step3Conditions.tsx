'use client';

/**
 * lib/policy-fund/last/components/steps/Step3Conditions.tsx
 *
 * Step 3: 특수 조건 (3개 아코디언)
 * - 인증 현황
 * - 정책자금 이력
 * - 심사 확인 사항
 */

import { Check } from 'lucide-react';
import { TestProfile, GuaranteeOrg } from '../../ui-types';
import { Accordion } from '../shared/Accordion';

interface Step3ConditionsProps {
  profile: TestProfile;
  updateProfile: <K extends keyof TestProfile>(key: K, value: TestProfile[K]) => void;
  expandedAccordions: string[];
  toggleAccordion: (id: string) => void;
  certCount: number;
  constraintCount: number;
}

// 토글 버튼 컴포넌트 (인라인)
function ToggleButton({
  label,
  isChecked,
  onClick,
}: {
  label: string;
  isChecked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative px-3 py-1.5 rounded-lg border transition-all duration-200 text-center
        ${isChecked ? 'border-orange-500 bg-white shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}
      `}
    >
      {isChecked && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
          <span className="text-white text-[10px]">✓</span>
        </div>
      )}
      <span className={`text-xs font-medium ${isChecked ? 'text-orange-700' : 'text-slate-600'}`}>
        {label}
      </span>
    </button>
  );
}

export function Step3Conditions({
  profile,
  updateProfile,
  expandedAccordions,
  toggleAccordion,
  certCount,
  constraintCount,
}: Step3ConditionsProps) {
  return (
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
          <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-100">
            <span className="text-base">✔</span>
            <span>보유하지 않아도 정책자금 신청은 가능합니다</span>
          </div>

          {/* 그룹 1: 기업 인증 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">📜</span>
              <span className="text-xs font-semibold text-slate-700">기업 인증</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'isVenture', label: '벤처기업' },
                { key: 'isInnobiz', label: '이노비즈' },
                { key: 'isMainbiz', label: '메인비즈' },
                { key: 'hasIsoCertification', label: 'ISO인증' },
              ].map((cert) => (
                <ToggleButton
                  key={cert.key}
                  label={cert.label}
                  isChecked={profile[cert.key as keyof TestProfile] as boolean}
                  onClick={() =>
                    updateProfile(
                      cert.key as keyof TestProfile,
                      !(profile[cert.key as keyof TestProfile] as boolean)
                    )
                  }
                />
              ))}
            </div>
          </div>

          {/* 그룹 2: 기술·연구 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">🔬</span>
              <span className="text-xs font-semibold text-slate-700">기술·연구</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'hasPatent', label: '특허 보유' },
                { key: 'hasResearchInstitute', label: '기업부설연구소' },
              ].map((cert) => (
                <ToggleButton
                  key={cert.key}
                  label={cert.label}
                  isChecked={profile[cert.key as keyof TestProfile] as boolean}
                  onClick={() =>
                    updateProfile(
                      cert.key as keyof TestProfile,
                      !(profile[cert.key as keyof TestProfile] as boolean)
                    )
                  }
                />
              ))}
            </div>
          </div>

          {/* 그룹 3: 사업 성과 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">📈</span>
              <span className="text-xs font-semibold text-slate-700">사업 성과</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'hasExportRecord', label: '수출 실적' },
                { key: 'isDisabledStandard', label: '장애인표준사업장' },
                { key: 'isSocialEnterprise', label: '사회적기업' },
              ].map((cert) => (
                <ToggleButton
                  key={cert.key}
                  label={cert.label}
                  isChecked={profile[cert.key as keyof TestProfile] as boolean}
                  onClick={() =>
                    updateProfile(
                      cert.key as keyof TestProfile,
                      !(profile[cert.key as keyof TestProfile] as boolean)
                    )
                  }
                />
              ))}
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
        badge={
          profile.existingLoanBalance > 0 || profile.kosmesPreviousCount > 0
            ? '이력 있음'
            : undefined
        }
        purposeLabel="참고 정보"
        purposeColor="blue"
      >
        <div className="space-y-4">
          {/* 기존 대출 잔액 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-600">
                기존 대출 잔액
                {profile.existingLoanBalance >= 15 && (
                  <span className="text-red-500 ml-2">⚠️ 한도 초과 우려</span>
                )}
                {profile.existingLoanBalance >= 10 && profile.existingLoanBalance < 15 && (
                  <span className="text-orange-500 ml-2">⚠️ 한도 근접</span>
                )}
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={profile.existingLoanBalance}
                  onChange={(e) =>
                    updateProfile(
                      'existingLoanBalance',
                      Math.max(0, Math.min(50, parseInt(e.target.value) || 0))
                    )
                  }
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
              onChange={(e) => updateProfile('existingLoanBalance', parseInt(e.target.value))}
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
              onChange={(e) => updateProfile('isRestart', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700">재창업 기업</span>
          </label>

          {/* 중진공 이용 횟수 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-600">
                중진공 정책자금 이용 횟수
                {profile.kosmesPreviousCount >= 4 && (
                  <span className="text-red-500 ml-2">⚠️ 졸업제 해당</span>
                )}
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={profile.kosmesPreviousCount}
                  onChange={(e) =>
                    updateProfile(
                      'kosmesPreviousCount',
                      Math.max(0, Math.min(10, parseInt(e.target.value) || 0))
                    )
                  }
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
              onChange={(e) => updateProfile('kosmesPreviousCount', parseInt(e.target.value))}
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
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateProfile('currentGuaranteeOrg', opt.value as GuaranteeOrg)}
                  className={`p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                    profile.currentGuaranteeOrg === opt.value
                      ? 'border-orange-400 bg-gradient-to-br from-orange-50 to-amber-50 shadow-md shadow-orange-500/10'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{opt.icon}</span>
                    <span
                      className={`text-sm font-semibold ${
                        profile.currentGuaranteeOrg === opt.value
                          ? 'text-orange-700'
                          : 'text-slate-700'
                      }`}
                    >
                      {opt.label}
                    </span>
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
                  <span
                    className={`ml-2 ${
                      profile.recentYearSubsidyAmount / profile.annualRevenue > 0.5
                        ? 'text-red-500'
                        : profile.recentYearSubsidyAmount / profile.annualRevenue > 0.33
                        ? 'text-orange-500'
                        : 'text-green-500'
                    }`}
                  >
                    (매출대비{' '}
                    {Math.round((profile.recentYearSubsidyAmount / profile.annualRevenue) * 100)}%)
                  </span>
                )}
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={profile.recentYearSubsidyAmount}
                  onChange={(e) =>
                    updateProfile(
                      'recentYearSubsidyAmount',
                      Math.max(0, Math.min(20, parseFloat(e.target.value) || 0))
                    )
                  }
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
              onChange={(e) =>
                updateProfile('recentYearSubsidyAmount', parseFloat(e.target.value))
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            {profile.annualRevenue > 0 &&
              profile.recentYearSubsidyAmount / profile.annualRevenue > 0.33 && (
                <p className="text-xs text-orange-500 mt-1">
                  ⚠️ 매출 대비 수혜액 비율 주의 (33% 초과 시 감점)
                </p>
              )}
          </div>
        </div>
      </Accordion>

      {/* 아코디언 3: 심사 확인 사항 */}
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
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <p className="text-sm text-slate-700 font-medium mb-1">
              현재 아래 사항에 해당하는 것이 있나요?
            </p>
            <p className="text-xs text-slate-500">(없다면 선택하지 않으셔도 됩니다)</p>
          </div>

          <div className="space-y-3">
            {/* 휴·폐업 */}
            <ConstraintItem
              label="현재 휴·폐업 상태"
              checked={profile.isInactive}
              onChange={(v) => updateProfile('isInactive', v)}
              helperText={
                profile.isInactive
                  ? 'ℹ️ 재도전 특례자금 등 일부 상품 검토 가능합니다'
                  : undefined
              }
            />

            {/* 세금 체납 */}
            <div className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.hasTaxDelinquency}
                  onChange={(e) => {
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
                      onChange={(e) => updateProfile('hasTaxInstallmentApproval', e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-slate-600">분납 승인 받음</span>
                  </label>
                  <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs text-blue-700">
                      {profile.hasTaxInstallmentApproval
                        ? 'ℹ️ 분납 승인 시 심사 진행 가능 (일부 감점)'
                        : 'ℹ️ 분납 승인을 받으시면 심사 진행이 가능합니다'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 금융기관 연체 */}
            <ConstraintItem
              label="금융기관 연체 진행 중"
              checked={profile.isCurrentlyDelinquent}
              onChange={(v) => updateProfile('isCurrentlyDelinquent', v)}
              helperText={
                profile.isCurrentlyDelinquent
                  ? 'ℹ️ 연체 해소 후 신청 가능하며, 재기지원 상품도 검토해 드립니다'
                  : undefined
              }
            />

            {/* 보증사고 미정리 */}
            <ConstraintItem
              label="보증사고 미정리 상태"
              checked={profile.hasUnresolvedGuaranteeAccident}
              onChange={(v) => updateProfile('hasUnresolvedGuaranteeAccident', v)}
              helperText={
                profile.hasUnresolvedGuaranteeAccident
                  ? 'ℹ️ 정리 후 재도전 자금 등 대안 상품 검토 가능합니다'
                  : undefined
              }
            />

            {/* 과거 부실/사고 이력 */}
            <div className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.hasPastDefault}
                  onChange={(e) => {
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
                      onChange={(e) => updateProfile('isPastDefaultResolved', e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-slate-600">정리 완료 (채무 상환/면책)</span>
                  </label>
                  <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                    <p
                      className={`text-xs ${
                        profile.isPastDefaultResolved ? 'text-emerald-700' : 'text-blue-700'
                      }`}
                    >
                      {profile.isPastDefaultResolved
                        ? '✓ 재창업/재기자금 우대 대상입니다'
                        : 'ℹ️ 정리 완료 시 재창업 우대 상품 이용 가능합니다'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 신용회복 중 */}
            <ConstraintItem
              label="신용회복 절차 진행 중"
              checked={profile.isCreditRecoveryInProgress}
              onChange={(v) => updateProfile('isCreditRecoveryInProgress', v)}
              helperText={
                profile.isCreditRecoveryInProgress
                  ? 'ℹ️ 재도전자금 등 특례 상품으로 안내해 드립니다'
                  : undefined
              }
            />
          </div>

          <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-100">
            <span className="text-base">✔</span>
            <div>
              <p className="font-medium">해당 사항이 있어도 괜찮습니다</p>
              <p className="text-xs text-emerald-600 mt-0.5">
                일부 정책자금 또는 대안 상품은 검토 가능합니다
              </p>
            </div>
          </div>
        </div>
      </Accordion>
    </div>
  );
}

// 제약 조건 항목 컴포넌트
function ConstraintItem({
  label,
  checked,
  onChange,
  helperText,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  helperText?: string;
}) {
  return (
    <div className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 rounded border-slate-300 text-slate-600 focus:ring-slate-500"
        />
        <span className="text-sm text-slate-700">{label}</span>
      </label>
      {helperText && (
        <div className="mt-2 ml-7 p-2 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-xs text-blue-700">{helperText}</p>
        </div>
      )}
    </div>
  );
}
