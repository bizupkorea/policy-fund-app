'use client';

import { useState } from 'react';
import { PolicyFundProgram } from '@/lib/types/policy-fund';
import { MatchLevel, calculateDDay, getMatchLevelLabel } from '@/lib/policy-fund/matching-engine';

interface FundCardProps {
  program: PolicyFundProgram;
  matchLevel: MatchLevel;
  matchScore: number;
  matchReasons: string[];
  onShowSummary?: () => void;
  onShowChecklist?: () => void;
}

export function FundCard({
  program,
  matchLevel,
  matchScore,
  matchReasons,
  onShowSummary,
  onShowChecklist
}: FundCardProps) {
  const [expanded, setExpanded] = useState(false);
  const dDay = calculateDDay(program.applicationPeriod);

  // D-Day 뱃지 스타일
  const getDDayBadge = () => {
    if (dDay === null) return null;

    if (dDay < 0) {
      return (
        <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-bold rounded">
          마감
        </span>
      );
    }

    if (dDay <= 3) {
      return (
        <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded animate-pulse">
          D-{dDay} 마감임박
        </span>
      );
    }

    if (dDay <= 7) {
      return (
        <span className="px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded">
          D-{dDay}
        </span>
      );
    }

    if (dDay <= 30) {
      return (
        <span className="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded">
          D-{dDay}
        </span>
      );
    }

    return (
      <span className="px-2 py-1 bg-gray-500 text-white text-xs font-bold rounded">
        D-{dDay}
      </span>
    );
  };

  // 적합도 바 색상
  const getMatchBarColor = () => {
    switch (matchLevel) {
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-gray-400';
    }
  };

  // 적합도 라벨 색상
  const getMatchLabelStyle = () => {
    switch (matchLevel) {
      case 'high': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* 헤더 */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {getDDayBadge()}
            {program.isMockData && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-xs rounded">
                데모
              </span>
            )}
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded ${getMatchLabelStyle()}`}>
            적합도: {getMatchLevelLabel(matchLevel)}
          </span>
        </div>

        <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2">
          {program.name}
        </h3>

        <p className="text-sm text-gray-500 mb-3">
          {program.executingAgency} · {program.supervisingAgency}
        </p>

        {/* 적합도 바 */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500">적합도</span>
            <span className="font-medium">{matchScore}점</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${getMatchBarColor()} rounded-full transition-all`}
              style={{ width: `${matchScore}%` }}
            />
          </div>
        </div>

        {/* 핵심 정보 */}
        <div className="flex flex-wrap gap-2 text-sm">
          {program.detail?.interestRate && (
            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
              연 {program.detail.interestRate.description}
            </span>
          )}
          {program.detail?.supportAmount && (
            <span className="px-2 py-1 bg-green-50 text-green-700 rounded">
              최대 {program.detail.supportAmount.description}
            </span>
          )}
          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">
            {program.applicationPeriod}
          </span>
        </div>

        {/* 적합 사유 */}
        {matchReasons.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex flex-wrap gap-1">
              {matchReasons.slice(0, 3).map((reason, idx) => (
                <span key={idx} className="text-xs text-green-600">
                  {reason}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex gap-2">
        <button
          onClick={onShowSummary}
          className="flex-1 px-3 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#2d4a6f] transition-colors"
        >
          1장 요약
        </button>
        <button
          onClick={onShowChecklist}
          className="flex-1 px-3 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
        >
          서류 체크
        </button>
        <a
          href={program.detailUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
        >
          공고원문
        </a>
      </div>
    </div>
  );
}
