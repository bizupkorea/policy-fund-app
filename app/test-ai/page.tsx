'use client';

/**
 * AI 분석 테스트 페이지
 *
 * 2단계 자격심사 + 3단계 Gemini AI 분석 테스트
 */

import { useState } from 'react';
import { AIRecommendationSection } from '@/components/policy-fund/AIRecommendationSection';
import type { AIRecommendation } from '@/stores/policy-fund-store-new';

// 테스트용 Mock 데이터
const mockCompanyData = {
  name: '테크이노베이션(주)',
  foundedDate: '2020-03-15',
  revenue: 1500000000, // 15억
  industryCode: 'J정보통신',
  employees: 12,
  location: '서울',
  ceoAge: 35,
  hasTaxDelinquency: false,
  hasExistingLoan: false,
  certifications: {
    venture: true,
    innobiz: false,
    mainbiz: false,
  },
};

export default function TestAIPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [aiRecommendations, setAIRecommendations] = useState<AIRecommendation[]>([]);
  const [summary, setSummary] = useState<{
    totalFunds: number;
    eligibleCount: number;
    aiAnalyzedCount: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // AI 분석 실행
  const runAIAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    setAIRecommendations([]);
    setSummary(null);

    try {
      const response = await fetch('/api/policy-fund/match-new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: mockCompanyData,
          options: {
            useAI: true,
            topN: 3,
            includeIneligible: false,
          },
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '분석 실패');
      }

      setAIRecommendations(data.data.aiRecommendations);
      setSummary(data.data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            🧪 AI 분석 테스트
          </h1>
          <p className="text-gray-600">
            2단계 자격심사 + 3단계 Gemini AI 분석을 테스트합니다.
          </p>
        </div>

        {/* 테스트 기업 정보 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">📋 테스트 기업 정보</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">기업명</span>
              <p className="font-medium">{mockCompanyData.name}</p>
            </div>
            <div>
              <span className="text-gray-500">설립일</span>
              <p className="font-medium">{mockCompanyData.foundedDate}</p>
            </div>
            <div>
              <span className="text-gray-500">업종</span>
              <p className="font-medium">{mockCompanyData.industryCode}</p>
            </div>
            <div>
              <span className="text-gray-500">소재지</span>
              <p className="font-medium">{mockCompanyData.location}</p>
            </div>
            <div>
              <span className="text-gray-500">매출액</span>
              <p className="font-medium">{(mockCompanyData.revenue / 100000000).toFixed(1)}억원</p>
            </div>
            <div>
              <span className="text-gray-500">직원수</span>
              <p className="font-medium">{mockCompanyData.employees}명</p>
            </div>
            <div>
              <span className="text-gray-500">대표자 연령</span>
              <p className="font-medium">{mockCompanyData.ceoAge}세</p>
            </div>
            <div>
              <span className="text-gray-500">인증</span>
              <p className="font-medium">
                {mockCompanyData.certifications.venture ? '벤처기업 ✓' : '-'}
              </p>
            </div>
          </div>

          {/* 분석 버튼 */}
          <div className="mt-6">
            <button
              onClick={runAIAnalysis}
              disabled={isLoading}
              className="px-6 py-3 bg-[#1e3a5f] text-white font-medium rounded-lg hover:bg-[#2d4a6f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? '분석 중...' : '🚀 AI 분석 실행'}
            </button>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700">❌ {error}</p>
          </div>
        )}

        {/* 요약 정보 */}
        {summary && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">📊 분석 요약</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-blue-600">{summary.totalFunds}</p>
                <p className="text-sm text-gray-600">전체 자금</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-green-600">{summary.eligibleCount}</p>
                <p className="text-sm text-gray-600">적격 자금</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-purple-600">{summary.aiAnalyzedCount}</p>
                <p className="text-sm text-gray-600">AI 분석</p>
              </div>
            </div>
          </div>
        )}

        {/* AI 추천 섹션 */}
        <AIRecommendationSection
          recommendations={aiRecommendations}
          isLoading={isLoading}
          companyName={mockCompanyData.name}
        />
      </div>
    </div>
  );
}
