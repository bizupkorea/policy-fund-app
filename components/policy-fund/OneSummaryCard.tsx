'use client';

import { PolicyFundProgram } from '@/lib/types/policy-fund';
import { MatchLevel, getMatchLevelLabel, calculateDDay } from '@/lib/policy-fund/matching-engine';

interface OneSummaryCardProps {
  program: PolicyFundProgram;
  matchLevel: MatchLevel;
  matchReasons: string[];
  onClose: () => void;
}

export function OneSummaryCard({ program, matchLevel, matchReasons, onClose }: OneSummaryCardProps) {
  const dDay = calculateDDay(program.applicationPeriod);

  // 금액/금리 정보 파싱
  const amount = program.detail?.supportAmount?.description || '공고문 참조';
  const rate = program.detail?.interestRate?.description || '변동금리';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        {/* 헤더 - 네이비 배경 */}
        <div className="bg-[#1e3a5f] p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {dDay !== null && dDay >= 0 && (
                <span className={`px-2 py-1 text-xs font-bold rounded ${
                  dDay <= 3 ? 'bg-red-500' : dDay <= 7 ? 'bg-orange-500' : 'bg-blue-500'
                }`}>
                  D-{dDay}
                </span>
              )}
              <span className={`px-2 py-1 text-xs font-bold rounded ${
                matchLevel === 'high' ? 'bg-green-500' :
                matchLevel === 'medium' ? 'bg-yellow-500' : 'bg-gray-500'
              }`}>
                적합도 {getMatchLevelLabel(matchLevel)}
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
            >
              <span className="text-white text-xl">&times;</span>
            </button>
          </div>
          <h3 className="font-bold text-lg leading-tight">
            {program.name}
          </h3>
          <p className="text-sm text-white/70 mt-1">
            {program.executingAgency}
          </p>
        </div>

        {/* 핵심 정보 5줄 */}
        <div className="p-5">
          <div className="space-y-4">
            {/* 1. 지원 대상 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🎯</span>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">지원 대상</p>
                <p className="text-sm text-gray-900 font-medium line-clamp-2">
                  {program.targetSummary || '중소기업'}
                </p>
              </div>
            </div>

            {/* 2. 지원 금액 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg">💰</span>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">지원 금액</p>
                <p className="text-sm text-gray-900 font-medium">
                  {amount}
                </p>
              </div>
            </div>

            {/* 3. 금리 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg">📉</span>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">금리</p>
                <p className="text-sm text-gray-900 font-medium">
                  {rate}
                </p>
              </div>
            </div>

            {/* 4. 신청 기간 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg">📅</span>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">신청 기간</p>
                <p className="text-sm text-gray-900 font-medium">
                  {program.applicationPeriod}
                </p>
              </div>
            </div>

            {/* 5. 필요 서류 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg">📋</span>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">필요 서류</p>
                <p className="text-sm text-gray-900 font-medium">
                  {program.detail?.requiredDocuments?.slice(0, 3).join(', ') || '사업자등록증, 재무제표, 납세증명서'}
                </p>
              </div>
            </div>
          </div>

          {/* 적합 사유 */}
          {matchReasons.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">적합 사유</p>
              <div className="flex flex-wrap gap-1">
                {matchReasons.map((reason, idx) => (
                  <span key={idx} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded">
                    {reason}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button
            onClick={() => {
              // 클립보드 복사 (간단 버전)
              const text = `[${program.name}]\n지원대상: ${program.targetSummary || '중소기업'}\n지원금액: ${amount}\n금리: ${rate}\n신청기간: ${program.applicationPeriod}`;
              navigator.clipboard.writeText(text);
              alert('복사되었습니다');
            }}
            className="flex-1 px-4 py-2 bg-[#1e3a5f] text-white font-medium rounded-lg hover:bg-[#2d4a6f]"
          >
            📋 복사하기
          </button>
          <a
            href={program.detailUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-4 py-2 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-100 text-center"
          >
            공고 원문 →
          </a>
        </div>
      </div>
    </div>
  );
}
