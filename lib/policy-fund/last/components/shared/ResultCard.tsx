'use client';

/**
 * lib/policy-fund/last/components/shared/ResultCard.tsx
 *
 * AI 매칭 결과 카드 컴포넌트 (3사 통합 고도화 버전)
 *
 * 기능:
 * - 카테고리별 적격 사유 표시 (기본/우대/전략/자금)
 * - 여유도 구간 표시 (🟢🟡🔴)
 * - 심사 영향도 태그 ([핵심]/[가점]/[보완])
 * - AI 종합 판정 (킬러포인트, 보완제안, 탈락경계, 실행가이드)
 */

import { useState } from 'react';
import { ChevronDown, ExternalLink, Lightbulb, AlertTriangle, TrendingUp, Sparkles } from 'lucide-react';
import {
  EnhancedMatchResult,
  DetailedMatchResult,
  InstitutionId,
  INSTITUTION_COLORS,
  INSTITUTION_NAMES,
  SAFETY_ZONE_DISPLAY,
  IMPACT_LEVEL_DISPLAY,
} from '../../';

interface ResultCardProps {
  result: EnhancedMatchResult | DetailedMatchResult;
  rank: number;
}

const LEVEL_COLORS = {
  high: {
    bg: 'bg-emerald-500',
    text: '높음',
    border: 'border-emerald-200/70',
    shadow: 'shadow-emerald-500/10',
  },
  medium: {
    bg: 'bg-amber-500',
    text: '보통',
    border: 'border-amber-200/70',
    shadow: 'shadow-amber-500/10',
  },
  low: {
    bg: 'bg-red-500',
    text: '낮음',
    border: 'border-red-200/70',
    shadow: 'shadow-red-500/10',
  },
};

// EnhancedMatchResult인지 확인
function isEnhancedResult(result: EnhancedMatchResult | DetailedMatchResult): result is EnhancedMatchResult {
  return 'detailedReasons' in result && Array.isArray(result.detailedReasons);
}

export function ResultCard({ result, rank }: ResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const instId = result.institutionId as InstitutionId;
  const colors = INSTITUTION_COLORS[instId] || INSTITUTION_COLORS.kosmes;
  const instName = INSTITUTION_NAMES[instId] || result.institutionId;
  const level = LEVEL_COLORS[result.level];

  // EnhancedMatchResult 여부 확인
  const hasDetailedReasons = isEnhancedResult(result) && result.detailedReasons?.length > 0;
  const hasAiJudgment = isEnhancedResult(result) && result.aiJudgment;

  return (
    <div
      className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg ${level.shadow} border ${level.border} overflow-hidden transition-all duration-200 hover:shadow-xl`}
    >
      {/* 헤더 */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-start gap-4">
          {/* 순위 */}
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-md shadow-orange-500/30">
            {rank}
          </div>

          {/* 내용 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-1.5">
              <span
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${colors.bg} ${colors.text}`}
              >
                {instName}
              </span>
              {/* 트랙 배지 */}
              <span
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
                  result.track === 'exclusive'
                    ? 'bg-purple-100 text-purple-700'
                    : result.track === 'policy_linked'
                    ? 'bg-blue-100 text-blue-700'
                    : result.track === 'general'
                    ? 'bg-slate-100 text-slate-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {result.trackLabel}
              </span>
              <div className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${level.bg}`} />
                <span className="text-xs text-slate-500 font-medium">{level.text}</span>
              </div>
              <span className="text-xl font-bold text-slate-800 ml-auto">
                {result.score}
                <span className="text-xs text-slate-500 font-medium">점</span>
              </span>
            </div>
            <h4 className="font-semibold text-slate-800 truncate text-base">
              {result.fundName}
            </h4>
          </div>

          {/* 확장 아이콘 */}
          <ChevronDown
            className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {/* 확장 내용 */}
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-slate-100">
          {/* 점수 설명 */}
          {result.scoreExplanation && (
            <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-xl border border-blue-100/70">
              <div className="text-xs font-semibold text-blue-700 mb-1.5">
                왜 이 순위인가요?
              </div>
              <p className="text-sm text-slate-700">{result.scoreExplanation}</p>
            </div>
          )}

          {/* 지원 조건 */}
          {result.supportDetails && (
            <div className="mt-4 p-4 bg-slate-50/80 rounded-xl">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {result.supportDetails.amount && (
                  <div>
                    <span className="text-slate-500">한도:</span>
                    <span className="ml-1.5 font-semibold text-slate-800">
                      {result.supportDetails.amount}
                    </span>
                  </div>
                )}
                {result.supportDetails.interestRate && (
                  <div>
                    <span className="text-slate-500">금리:</span>
                    <span className="ml-1.5 font-semibold text-slate-800">
                      {result.supportDetails.interestRate}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* 고도화된 적격 사유 (3사 통합) */}
          {/* ============================================ */}
          {hasDetailedReasons && (
            <div className="mt-4 space-y-4">
              {(result as EnhancedMatchResult).detailedReasons.map((category) => (
                <div key={category.category}>
                  {/* 카테고리 헤더 */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-sm">{category.icon}</span>
                    <span className="text-xs font-semibold text-slate-700">
                      {category.categoryLabel}
                    </span>
                  </div>

                  {/* 사유 목록 */}
                  <ul className="space-y-2.5">
                    {category.reasons.map((reason, idx) => {
                      const zoneDisplay = SAFETY_ZONE_DISPLAY[reason.safetyZone];
                      const impactDisplay = IMPACT_LEVEL_DISPLAY[reason.impactLevel];

                      return (
                        <li key={idx} className="text-xs">
                          <div className="flex items-start gap-2">
                            {/* 여유도 아이콘 (GPT) */}
                            <span className={`flex-shrink-0 ${zoneDisplay.color}`}>
                              {zoneDisplay.icon}
                            </span>

                            <div className="flex-1 min-w-0">
                              {/* 필드명 + 값 + 기준 + 태그 */}
                              <div className="flex items-center flex-wrap gap-1.5">
                                <span className="font-medium text-slate-700">
                                  {reason.userValue}
                                </span>
                                <span className="text-slate-400">{reason.criterion}</span>

                                {/* 심사 영향도 태그 (GPT) */}
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${impactDisplay.bgColor} ${impactDisplay.textColor}`}
                                >
                                  {reason.impactLevel === 'bonus' && reason.impactScore
                                    ? `${impactDisplay.label} +${reason.impactScore}`
                                    : impactDisplay.label}
                                </span>
                              </div>

                              {/* 여유분 표시 */}
                              {reason.margin && (
                                <div className="text-slate-400 mt-0.5">
                                  → {reason.margin}
                                </div>
                              )}

                              {/* 혜택 표시 (Gemini) */}
                              {reason.benefit && (
                                <div className="text-emerald-600 mt-0.5">
                                  → {reason.benefit}
                                </div>
                              )}

                              {/* 추가 메모 */}
                              {reason.note && (
                                <div className="text-blue-600 mt-0.5">
                                  → {reason.note}
                                </div>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* ============================================ */}
          {/* AI 종합 판정 (Gemini + GPT 통합) */}
          {/* ============================================ */}
          {hasAiJudgment && (result as EnhancedMatchResult).aiJudgment && (
            <div className="mt-5 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
              <h4 className="text-xs font-semibold text-indigo-800 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                AI 종합 판정
              </h4>

              <div className="space-y-3">
                {/* 킬러 포인트 */}
                <div>
                  <div className="flex items-center gap-1 text-xs font-medium text-indigo-700 mb-0.5">
                    <TrendingUp className="w-3 h-3" />
                    킬러 포인트
                  </div>
                  <p className="text-xs text-slate-600 pl-4">
                    "{(result as EnhancedMatchResult).aiJudgment.killerPoint}"
                  </p>
                </div>

                {/* 보완 시 혜택 */}
                <div>
                  <div className="flex items-center gap-1 text-xs font-medium text-emerald-700 mb-0.5">
                    <Lightbulb className="w-3 h-3" />
                    보완 시 혜택
                  </div>
                  <p className="text-xs text-slate-600 pl-4">
                    "{(result as EnhancedMatchResult).aiJudgment.improvementTip}"
                  </p>
                </div>

                {/* 탈락 경계 (있을 경우만) */}
                {(result as EnhancedMatchResult).aiJudgment.riskWarning && (
                  <div>
                    <div className="flex items-center gap-1 text-xs font-medium text-amber-700 mb-0.5">
                      <AlertTriangle className="w-3 h-3" />
                      탈락 경계
                    </div>
                    <p className="text-xs text-slate-600 pl-4">
                      "{(result as EnhancedMatchResult).aiJudgment.riskWarning}"
                    </p>
                  </div>
                )}

                {/* 실행 가이드 */}
                <div>
                  <div className="flex items-center gap-1 text-xs font-medium text-blue-700 mb-0.5">
                    <Lightbulb className="w-3 h-3" />
                    실행 가이드
                  </div>
                  <p className="text-xs text-slate-600 pl-4">
                    "{(result as EnhancedMatchResult).aiJudgment.actionGuide}"
                  </p>
                </div>

                {/* 점수 산정 근거 */}
                {(result as EnhancedMatchResult).aiJudgment.scoreBreakdown && (
                  <div className="mt-3 pt-2 border-t border-indigo-100">
                    <span className="text-xs text-indigo-600 font-mono">
                      📊 {(result as EnhancedMatchResult).aiJudgment.scoreBreakdown}
                    </span>
                  </div>
                )}

                {/* 연관 자금 */}
                {(result as EnhancedMatchResult).aiJudgment.relatedFunds.length > 0 &&
                  (result as EnhancedMatchResult).aiJudgment.relatedFunds[0] !== '연관 자금 없음' && (
                  <div className="mt-2 flex items-center flex-wrap gap-2">
                    <span className="text-xs text-slate-500">🔍 연관 자금:</span>
                    {(result as EnhancedMatchResult).aiJudgment.relatedFunds.map((fund, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 bg-white rounded-full text-slate-600 border border-slate-200"
                      >
                        {fund}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* 기존 적격 사유 (fallback - EnhancedMatchResult가 아닐 때) */}
          {/* ============================================ */}
          {!hasDetailedReasons && result.eligibilityReasons.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-semibold text-emerald-700 mb-2">✓ 적격 사유</div>
              <ul className="space-y-1.5">
                {result.eligibilityReasons.map((reason, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-slate-600 pl-4 relative before:absolute before:left-0 before:content-['•'] before:text-emerald-500 before:font-bold"
                  >
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 감점 요소 (warnings) */}
          {result.warnings && result.warnings.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-semibold text-amber-700 mb-2">⚠️ 감점 요소</div>
              <ul className="space-y-1.5">
                {result.warnings.map((warning, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-slate-600 pl-4 relative before:absolute before:left-0 before:content-['•'] before:text-amber-500 before:font-bold"
                  >
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 부적격/경고 사유 */}
          {result.ineligibilityReasons.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-semibold text-red-700 mb-2">✗ 주의 사항</div>
              <ul className="space-y-1.5">
                {result.ineligibilityReasons.map((reason, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-slate-600 pl-4 relative before:absolute before:left-0 before:content-['•'] before:text-red-500 before:font-bold"
                  >
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 공고원문 링크 */}
          {result.officialUrl && (
            <a
              href={result.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center justify-center gap-1.5 w-full py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all duration-200"
            >
              공고원문
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
