'use client';

/**
 * AI 추천 섹션 컴포넌트 (VIP 리포트)
 *
 * Gemini AI가 분석한 상위 추천 정책자금을 표시합니다.
 * 합격 가능성, 매칭 사유, 리스크, 전략을 시각적으로 보여줍니다.
 */

import { AIRecommendation } from '@/stores/policy-fund-store-new';

interface AIRecommendationSectionProps {
  recommendations: AIRecommendation[];
  isLoading?: boolean;
  companyName?: string;
}

/**
 * 가능성 등급에 따른 색상
 */
function getPossibilityStyle(possibility: string) {
  switch (possibility) {
    case 'High':
      return {
        bg: 'bg-green-100',
        text: 'text-green-700',
        border: 'border-green-200',
        label: '높음',
        emoji: '🟢',
      };
    case 'Medium':
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        border: 'border-yellow-200',
        label: '보통',
        emoji: '🟡',
      };
    case 'Low':
      return {
        bg: 'bg-red-100',
        text: 'text-red-700',
        border: 'border-red-200',
        label: '낮음',
        emoji: '🔴',
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        border: 'border-gray-200',
        label: '-',
        emoji: '⚪',
      };
  }
}

/**
 * 점수에 따른 색상
 */
function getScoreColor(score: number) {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
}

/**
 * AI 분석 로딩 스피너
 */
function AILoadingSpinner() {
  return (
    <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d4a6f] rounded-xl p-8 text-center">
      <div className="flex flex-col items-center gap-4">
        {/* 애니메이션 아이콘 */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-white rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">🤖</span>
          </div>
        </div>

        {/* 텍스트 */}
        <div>
          <p className="text-white font-medium text-lg">AI가 정밀 분석 중입니다...</p>
          <p className="text-white/70 text-sm mt-1">
            기업 정보와 정책자금 요건을 비교하고 있습니다
          </p>
        </div>

        {/* 프로그레스 바 */}
        <div className="w-64 h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full animate-pulse" style={{ width: '60%' }}></div>
        </div>
      </div>
    </div>
  );
}

/**
 * AI 추천 카드
 */
function AIRecommendationCard({ recommendation, rank }: { recommendation: AIRecommendation; rank: number }) {
  const { aiAnalysis } = recommendation;
  const style = getPossibilityStyle(aiAnalysis.possibility);
  const scoreColor = getScoreColor(aiAnalysis.score);

  return (
    <div className={`bg-white rounded-xl border-2 ${style.border} overflow-hidden transition-shadow hover:shadow-lg`}>
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d4a6f] p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* 순위 뱃지 */}
            <div className="w-8 h-8 rounded-full bg-[#d4a853] flex items-center justify-center text-white font-bold text-sm">
              {rank}
            </div>
            <div>
              <h3 className="text-white font-bold text-lg leading-tight">
                {recommendation.fundName}
              </h3>
              <p className="text-white/70 text-sm">{recommendation.agency}</p>
            </div>
          </div>

          {/* 점수 */}
          <div className="text-right">
            <div className={`text-3xl font-bold ${scoreColor === 'text-green-600' ? 'text-green-400' : scoreColor === 'text-yellow-600' ? 'text-yellow-400' : 'text-orange-400'}`}>
              {aiAnalysis.score}점
            </div>
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${style.bg} ${style.text} text-xs font-medium`}>
              {style.emoji} 합격 가능성 {style.label}
            </div>
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div className="p-5 space-y-4">
        {/* 지원 정보 */}
        <div className="flex gap-4 text-sm">
          {recommendation.maxAmount && (
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400">💰</span>
              <span className="text-gray-600">최대 {recommendation.maxAmount}</span>
            </div>
          )}
          {recommendation.interestRate && (
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400">📊</span>
              <span className="text-gray-600">{recommendation.interestRate}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">📁</span>
            <span className="text-gray-600">{recommendation.category}</span>
          </div>
        </div>

        {/* 매칭 사유 */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <div>
              <p className="text-green-800 font-medium text-sm mb-1">매칭 포인트</p>
              <p className="text-green-700 text-sm">{aiAnalysis.matchReason}</p>
            </div>
          </div>
        </div>

        {/* 리스크 요인 */}
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <span className="text-orange-500 mt-0.5">⚠</span>
            <div>
              <p className="text-orange-800 font-medium text-sm mb-1">주의사항</p>
              <p className="text-orange-700 text-sm">{aiAnalysis.riskFactor}</p>
            </div>
          </div>
        </div>

        {/* 전략 */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">💡</span>
            <div>
              <p className="text-blue-800 font-medium text-sm mb-1">추천 전략</p>
              <p className="text-blue-700 text-sm">{aiAnalysis.strategy}</p>
            </div>
          </div>
        </div>

        {/* 추가 팁 */}
        {aiAnalysis.additionalTips && aiAnalysis.additionalTips.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-gray-500 text-xs mb-2">📋 추가 팁</p>
            <ul className="space-y-1">
              {aiAnalysis.additionalTips.map((tip, i) => (
                <li key={i} className="text-gray-600 text-xs flex items-start gap-1.5">
                  <span className="text-gray-400">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 푸터 */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
        <span className="text-xs text-gray-500">
          🤖 AI 분석 결과
        </span>
        <button className="px-4 py-1.5 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#2d4a6f] transition-colors">
          상세 보기
        </button>
      </div>
    </div>
  );
}

/**
 * AI 추천 섹션 메인 컴포넌트
 */
export function AIRecommendationSection({
  recommendations,
  isLoading = false,
  companyName,
}: AIRecommendationSectionProps) {
  // 로딩 중
  if (isLoading) {
    return (
      <section className="mb-8">
        <AILoadingSpinner />
      </section>
    );
  }

  // 추천 결과 없음
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          <h2 className="text-xl font-bold text-gray-900">
            AI 맞춤 추천
          </h2>
          <span className="px-2 py-0.5 bg-[#d4a853] text-white text-xs font-medium rounded-full">
            VIP
          </span>
        </div>
        {companyName && (
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">{companyName}</span> 기업에 최적화된 분석
          </p>
        )}
      </div>

      {/* 추천 카드 그리드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recommendations.slice(0, 3).map((rec, index) => (
          <AIRecommendationCard
            key={rec.fundId}
            recommendation={rec}
            rank={index + 1}
          />
        ))}
      </div>

      {/* 추가 추천이 있는 경우 */}
      {recommendations.length > 3 && (
        <div className="mt-4 text-center">
          <button className="text-[#1e3a5f] text-sm font-medium hover:underline">
            + {recommendations.length - 3}개 더 보기
          </button>
        </div>
      )}
    </section>
  );
}

export default AIRecommendationSection;
