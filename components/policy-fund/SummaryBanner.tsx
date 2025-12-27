'use client';

import { CompanyPolicyProfile } from '@/lib/types/policy-fund';

interface SummaryBannerProps {
  companyName: string;
  totalPrograms: number;
  highMatchCount: number;
  maxAmount?: string;
  filters: {
    industry: string;
    location: string;
    businessAge: number;
  };
}

export function SummaryBanner({
  companyName,
  totalPrograms,
  highMatchCount,
  maxAmount = '5억',
  filters
}: SummaryBannerProps) {
  return (
    <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d4a6f] rounded-2xl p-6 mb-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">
            <span className="text-[#d4a853]">{companyName}</span> 맞춤 정책자금
          </h2>
          <p className="text-lg opacity-90">
            신청 가능한 자금 <span className="text-[#d4a853] font-bold text-2xl">{totalPrograms}건</span>
            {maxAmount && (
              <span className="ml-2">
                / 최대 <span className="text-[#d4a853] font-bold text-2xl">{maxAmount}</span>
              </span>
            )}
          </p>
        </div>
        <div className="text-right">
          <div className="bg-white/10 rounded-xl px-4 py-3">
            <p className="text-sm opacity-80 mb-1">적합도 높은 자금</p>
            <p className="text-3xl font-bold text-[#22c55e]">{highMatchCount}건</p>
          </div>
        </div>
      </div>

      {/* 필터 태그 */}
      <div className="flex gap-2 mt-4 flex-wrap">
        <span className="px-3 py-1 bg-white/10 rounded-full text-sm">
          {filters.industry}
        </span>
        <span className="px-3 py-1 bg-white/10 rounded-full text-sm">
          {filters.location}
        </span>
        <span className="px-3 py-1 bg-white/10 rounded-full text-sm">
          업력 {filters.businessAge}년
        </span>
      </div>
    </div>
  );
}
