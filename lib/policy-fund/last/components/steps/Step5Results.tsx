'use client';

/**
 * lib/policy-fund/last/components/steps/Step5Results.tsx
 *
 * Step 5: AI 매칭 결과 표시
 */

import { ChevronDown, ChevronUp } from 'lucide-react';
import { DetailedMatchResult } from '../../types';
import { ResultCard } from '../shared/ResultCard';

// TrackInfo 타입 정의 (inline)
interface TrackInfo {
  hasSpecializedTrack: boolean;
  trackType: string | null;
  trackLabel: string;
  trackDescription: string;
}

interface Step5ResultsProps {
  results: DetailedMatchResult[];
  trackInfo: TrackInfo | null;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  goToStep: (step: number) => void;
  expandedAccordions: string[];
  toggleAccordion: (id: string) => void;
}

export function Step5Results({
  results,
  trackInfo,
  highCount,
  mediumCount,
  lowCount,
  goToStep,
  expandedAccordions,
  toggleAccordion,
}: Step5ResultsProps) {
  const showAllResults = expandedAccordions.includes('step5-results');
  const displayResults = showAllResults ? results : results.slice(0, 5);

  return (
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
              onClick={() => toggleAccordion('step5-results')}
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
            onClick={() => goToStep(4)}
            className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-sm font-semibold shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-200"
          >
            Step 4로 이동
          </button>
        </div>
      )}
    </div>
  );
}
