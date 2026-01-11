'use client';

/**
 * lib/policy-fund/last/components/steps/Step1BasicInfo.tsx
 *
 * Step 1: 기본 정보 + 대표자 정보 입력
 */

import { TestProfile } from '../../ui-types';
import { INDUSTRY_OPTIONS, REGION_OPTIONS } from '../../constants';
import { BusinessAge, CompanySize } from '../../hooks';

interface Step1BasicInfoProps {
  profile: TestProfile;
  updateProfile: <K extends keyof TestProfile>(key: K, value: TestProfile[K]) => void;
  businessAge: BusinessAge;
  companySize: CompanySize;
}

export function Step1BasicInfo({
  profile,
  updateProfile,
  businessAge,
  companySize,
}: Step1BasicInfoProps) {
  const companySizeLabel =
    companySize === 'startup' ? '소공인' :
    companySize === 'small' ? '소기업' :
    companySize === 'medium' ? '중기업' : '중견기업';

  return (
    <div className="space-y-4 [&:has(input:focus,select:focus)_:is(input,select):not(:focus)]:opacity-50 [&:has(input:focus,select:focus)_:is(input,select):not(:focus)]:transition-opacity">
      {/* 기본 정보 */}
      <div className="bg-slate-50/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50">
        <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <span className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-lg flex items-center justify-center text-xs shadow-md">
            📋
          </span>
          기본 정보
        </h3>
        <div className="space-y-3">
          {/* 업종 / 지역 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">업종</label>
              <select
                value={profile.industry}
                onChange={(e) => updateProfile('industry', e.target.value as TestProfile['industry'])}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-4 focus:ring-orange-400/40 focus:border-orange-500 focus:shadow-[0_0_25px_rgba(249,115,22,0.35)] transition-all duration-300"
              >
                {INDUSTRY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">지역</label>
              <select
                value={profile.location}
                onChange={(e) => updateProfile('location', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-4 focus:ring-orange-400/40 focus:border-orange-500 focus:shadow-[0_0_25px_rgba(249,115,22,0.35)] transition-all duration-300"
              >
                {REGION_OPTIONS.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 설립일 */}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <label className="text-xs font-medium text-slate-600">
                설립일{' '}
                <span className="text-orange-500 font-semibold">
                  (업력: {businessAge.years}년 {businessAge.months}개월)
                </span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer px-2 py-0.5 rounded-md border border-slate-200 hover:border-orange-300 transition-all">
                <input
                  type="checkbox"
                  checked={profile.isRestart}
                  onChange={(e) => updateProfile('isRestart', e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-xs text-slate-600">재창업</span>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={profile.establishedYear}
                onChange={(e) => updateProfile('establishedYear', parseInt(e.target.value))}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-4 focus:ring-orange-400/40 focus:border-orange-500 transition-all duration-300"
              >
                {Array.from({ length: 77 }, (_, i) => 2026 - i).map((year) => (
                  <option key={year} value={year}>
                    {year}년
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={profile.establishedMonth}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(12, parseInt(e.target.value) || 1));
                  updateProfile('establishedMonth', val);
                }}
                min={1}
                max={12}
                placeholder="월"
                className="w-16 px-2 py-2 text-center border border-slate-200 rounded-xl text-sm bg-white focus:ring-4 focus:ring-orange-400/40 focus:border-orange-500 transition-all duration-300"
              />
              <span className="text-slate-400 text-sm">월</span>
              <input
                type="number"
                value={profile.establishedDay}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(31, parseInt(e.target.value) || 1));
                  updateProfile('establishedDay', val);
                }}
                min={1}
                max={31}
                placeholder="일"
                className="w-16 px-2 py-2 text-center border border-slate-200 rounded-xl text-sm bg-white focus:ring-4 focus:ring-orange-400/40 focus:border-orange-500 transition-all duration-300"
              />
              <span className="text-slate-400 text-sm">일</span>
            </div>
          </div>

          {/* 연매출 / 직원수 / 부채비율 */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-600">연매출</label>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={profile.annualRevenue}
                  onChange={(e) =>
                    updateProfile(
                      'annualRevenue',
                      Math.max(0, Math.min(1000, parseFloat(e.target.value) || 0))
                    )
                  }
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
                  직원수 <span className="text-slate-400">({companySizeLabel})</span>
                </label>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={profile.employeeCount}
                  onChange={(e) =>
                    updateProfile(
                      'employeeCount',
                      Math.max(1, Math.min(300, parseInt(e.target.value) || 1))
                    )
                  }
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
                  onChange={(e) =>
                    updateProfile(
                      'debtRatio',
                      Math.max(0, Math.min(1000, parseInt(e.target.value) || 0))
                    )
                  }
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
          <span className="w-7 h-7 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-lg flex items-center justify-center text-xs shadow-md">
            👤
          </span>
          대표자 정보
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              대표자 나이 <span className="text-orange-500 font-bold">{profile.ceoAge}세</span>
              {profile.ceoAge <= 39 && (
                <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-600 text-xs font-medium rounded-full">
                  청년
                </span>
              )}
            </label>
            <input
              type="range"
              value={profile.ceoAge}
              onChange={(e) => updateProfile('ceoAge', parseInt(e.target.value))}
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
                onChange={(e) => updateProfile('isFemale', e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-sm text-slate-700">여성 대표</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-amber-100/50 transition-colors">
              <input
                type="checkbox"
                checked={profile.isDisabled}
                onChange={(e) => updateProfile('isDisabled', e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-sm text-slate-700">장애인 대표</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
