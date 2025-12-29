'use client';

import { ExternalLink } from 'lucide-react';
import { DetailedMatchResult } from '@/lib/policy-fund/matching-engine';

// 기관별 배지 색상
const institutionColors: Record<string, { bg: string; text: string; border: string }> = {
  kosmes: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  kodit: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  kibo: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
  semas: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
  seoul_credit: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  gyeonggi_credit: { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200' },
  mss: { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
  motie: { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-200' },
};

// 기관 한글명
const institutionNames: Record<string, string> = {
  kosmes: '중진공',
  kodit: '신보',
  kibo: '기보',
  semas: '소진공',
  seoul_credit: '서울신보',
  gyeonggi_credit: '경기신보',
  mss: '중기부',
  motie: '산업부',
};

interface BestPicksSectionProps {
  results: DetailedMatchResult[];
  maxItems?: number;
}

export function BestPicksSection({ results, maxItems = 3 }: BestPicksSectionProps) {
  // High/Medium만 필터링하고 점수 순 정렬
  const topPicks = results
    .filter(r => r.level === 'high' || r.level === 'medium')
    .sort((a, b) => b.score - a.score)
    .slice(0, maxItems);

  // 추천할 만한 자금이 없는 경우
  if (topPicks.length === 0) {
    return (
      <div className="mb-6 p-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">💡</span>
          <h3 className="text-lg font-bold text-slate-800">AI 맞춤 분석 결과</h3>
        </div>
        <p className="text-slate-600">
          현재 입력하신 조건에 딱 맞는 핵심 자금은 없지만, 아래 공고들을 확인해보세요.
          <br />
          <span className="text-sm text-slate-500">
            추가 정보를 입력하시면 더 정확한 매칭이 가능합니다.
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
          <span className="text-white text-lg">🎯</span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">AI 맞춤 추천 자금</h3>
          <p className="text-sm text-slate-500">귀사의 조건에 가장 적합한 정책자금 {topPicks.length}건</p>
        </div>
        <div className="ml-auto px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">
          Best Picks
        </div>
      </div>

      {/* 프리미엄 카드 그리드 */}
      <div className="p-1 bg-gradient-to-r from-amber-200 via-orange-200 to-amber-200 rounded-2xl">
        <div className="bg-white rounded-xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topPicks.map((pick, index) => (
              <BestPickCard key={pick.fundId} pick={pick} rank={index + 1} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface BestPickCardProps {
  pick: DetailedMatchResult;
  rank: number;
}

function BestPickCard({ pick, rank }: BestPickCardProps) {
  const colors = institutionColors[pick.institutionId] || institutionColors.kosmes;
  const instName = institutionNames[pick.institutionId] || pick.institutionId;

  // 적합도 레벨에 따른 색상
  const levelColors = {
    high: { bg: 'bg-green-500', text: '높음' },
    medium: { bg: 'bg-yellow-500', text: '보통' },
    low: { bg: 'bg-red-500', text: '낮음' },
  };
  const level = levelColors[pick.level];

  // 가장 중요한 추천 사유 한 줄
  const mainReason = pick.eligibilityReasons[0] || pick.reasons[0] || '조건 충족';

  return (
    <div className="relative bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 p-4 hover:shadow-lg transition-shadow h-full flex flex-col">
      {/* 랭크 배지 */}
      <div className="absolute -top-2 -left-2 w-7 h-7 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-md">
        <span className="text-white text-xs font-bold">{rank}</span>
      </div>

      {/* 기관 배지 + 점수 */}
      <div className="flex items-center justify-between mb-3">
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${colors.bg} ${colors.text}`}>
          {instName}
        </span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${level.bg}`} />
            <span className="text-xs text-slate-500">{level.text}</span>
          </div>
          <span className="text-lg font-bold text-slate-900">{pick.score}<span className="text-xs text-slate-500 ml-0.5">점</span></span>
        </div>
      </div>

      {/* 자금명 */}
      <h4 className="font-bold text-slate-900 mb-2 line-clamp-2">
        {pick.fundName}
      </h4>

      {/* 지원 조건 */}
      <div className="space-y-1.5 mb-3 flex-grow">
        {pick.supportDetails?.amount && (
          <div className="flex items-center text-sm">
            <span className="text-slate-500 w-12">한도</span>
            <span className="text-slate-900 font-medium">{pick.supportDetails.amount}</span>
          </div>
        )}
        {pick.supportDetails?.interestRate && (
          <div className="flex items-center text-sm">
            <span className="text-slate-500 w-12">금리</span>
            <span className="text-slate-900 font-medium">{pick.supportDetails.interestRate}</span>
          </div>
        )}
      </div>

      {/* 추천 사유 + 공고원문 버튼 (항상 하단 고정) */}
      <div className="pt-3 border-t border-slate-100 space-y-2">
        <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1.5 rounded-lg">
          💡 {mainReason}
        </p>
        {pick.officialUrl && (
          <a
            href={pick.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 w-full py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            공고원문
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}
