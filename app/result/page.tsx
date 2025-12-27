'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { SummaryBanner } from '@/components/policy-fund/SummaryBanner';
import { FundCard } from '@/components/policy-fund/FundCard';
import { DocumentChecklist } from '@/components/policy-fund/DocumentChecklist';
import { OneSummaryCard } from '@/components/policy-fund/OneSummaryCard';
import { PolicyFundProgram, CompanyPolicyProfile } from '@/lib/types/policy-fund';
import { calculateMatchScore } from '@/lib/policy-fund/matching-engine';
import { usePolicyFundStore } from '@/stores/policy-fund-store';

// 데모용 목업 프로그램 데이터 (API 연동 전까지 사용)
const mockPrograms: PolicyFundProgram[] = [
  {
    id: '1',
    name: '2024년 중소기업 정책자금 (혁신성장자금)',
    category: 'loan',
    executingAgency: '중소벤처기업진흥공단',
    supervisingAgency: '중소벤처기업부',
    applicationPeriod: '2024.01.02 ~ 2024.12.31',
    detailUrl: 'https://www.kosmes.or.kr',
    supportSummary: '혁신성장 유망 중소기업 운전·시설자금 융자 지원',
    targetSummary: '중소기업 (제조업, 지식서비스업 등)',
    detail: {
      supportAmount: { min: 1, max: 100, unit: '억원', description: '최대 100억원' },
      supportConditions: ['업력 3년 이상', '신용등급 B 이상'],
      interestRate: { min: 2.0, max: 3.5, description: '2.0~3.5% (변동금리)' },
      repaymentTerms: { period: '10년 이내', gracePeriod: '3년 이내', description: '10년 이내 (거치 3년)' },
      eligibility: ['중소기업기본법상 중소기업', '업력 3년 이상'],
      exclusions: ['세금 체납 기업', '휴업 중인 기업'],
      requiredDocuments: ['사업자등록증', '재무제표', '납세증명서', '4대보험 완납증명서'],
      evaluationCriteria: ['기술성', '사업성', '성장성'],
      crawledAt: new Date(),
      crawlSuccess: true
    },
    isMockData: true
  },
  {
    id: '2',
    name: '경기도 중소기업 육성자금 (운전자금)',
    category: 'loan',
    executingAgency: '경기신용보증재단',
    supervisingAgency: '경기도',
    applicationPeriod: '2024.01.15 ~ 2024.12.20',
    detailUrl: 'https://www.gcgf.or.kr',
    supportSummary: '경기도 소재 중소기업 운전자금 보증 지원',
    targetSummary: '경기도 소재 중소기업',
    detail: {
      supportAmount: { min: 0.5, max: 5, unit: '억원', description: '최대 5억원' },
      supportConditions: ['경기도 사업장 소재'],
      interestRate: { min: 2.5, max: 3.5, description: '2.5~3.5% (고정금리)' },
      repaymentTerms: { period: '5년 이내', gracePeriod: '1년 이내', description: '5년 이내 (거치 1년)' },
      eligibility: ['경기도 소재 중소기업'],
      exclusions: [],
      requiredDocuments: ['사업자등록증', '재무제표', '지방세 납세증명서'],
      evaluationCriteria: ['재무건전성', '고용현황'],
      crawledAt: new Date(),
      crawlSuccess: true
    },
    isMockData: true
  },
  {
    id: '3',
    name: '소상공인 정책자금 (일반경영안정자금)',
    category: 'loan',
    executingAgency: '소상공인시장진흥공단',
    supervisingAgency: '중소벤처기업부',
    applicationPeriod: '2024.02.01 ~ 2024.11.30',
    detailUrl: 'https://www.semas.or.kr',
    supportSummary: '소상공인 경영안정을 위한 운전자금 융자',
    targetSummary: '소상공인 (상시근로자 5인 미만)',
    detail: {
      supportAmount: { min: 0.1, max: 0.7, unit: '억원', description: '최대 7천만원' },
      supportConditions: ['상시근로자 5인 미만'],
      interestRate: { min: 2.0, max: 3.0, description: '2.0~3.0% (고정금리)' },
      repaymentTerms: { period: '5년', gracePeriod: '2년', description: '5년 (거치 2년)' },
      eligibility: ['소상공인'],
      exclusions: ['도박, 사치업종'],
      requiredDocuments: ['사업자등록증', '부가세 과세표준증명', '소득금액증명원'],
      evaluationCriteria: ['상환능력', '업종특성'],
      crawledAt: new Date(),
      crawlSuccess: true
    },
    isMockData: true
  },
  {
    id: '4',
    name: '신용보증기금 일반보증',
    category: 'guarantee',
    executingAgency: '신용보증기금',
    supervisingAgency: '금융위원회',
    applicationPeriod: '2024.01.01 ~ 2024.12.31',
    detailUrl: 'https://www.kodit.co.kr',
    supportSummary: '담보력이 부족한 중소기업을 위한 신용보증',
    targetSummary: '중소기업 (전 업종)',
    detail: {
      supportAmount: { min: 0.5, max: 30, unit: '억원', description: '최대 30억원' },
      supportConditions: ['신용평가 통과'],
      interestRate: { min: 0.5, max: 1.5, description: '보증료 0.5~1.5%' },
      repaymentTerms: { period: '1년 (연장 가능)', description: '1년 단위 연장' },
      eligibility: ['중소기업', '신용평가 가능 기업'],
      exclusions: ['연체 중인 기업'],
      requiredDocuments: ['사업자등록증', '재무제표', '매출 증빙'],
      evaluationCriteria: ['신용등급', '재무상태', '사업전망'],
      crawledAt: new Date(),
      crawlSuccess: true
    },
    isMockData: true
  },
  {
    id: '5',
    name: '기술보증기금 기술평가보증',
    category: 'guarantee',
    executingAgency: '기술보증기금',
    supervisingAgency: '금융위원회',
    applicationPeriod: '2024.01.01 ~ 2024.12.31',
    detailUrl: 'https://www.kibo.or.kr',
    supportSummary: '기술력 보유 중소기업을 위한 기술평가 기반 보증',
    targetSummary: '기술력 보유 중소기업 (벤처, 이노비즈 등)',
    detail: {
      supportAmount: { min: 1, max: 50, unit: '억원', description: '최대 50억원' },
      supportConditions: ['기술력 보유', '기술평가 가능'],
      interestRate: { min: 0.5, max: 1.5, description: '보증료 0.5~1.5%' },
      repaymentTerms: { period: '1년 (연장 가능)', description: '1년 단위 연장' },
      eligibility: ['기술력 보유 중소기업', '벤처기업', '이노비즈'],
      exclusions: [],
      requiredDocuments: ['사업자등록증', '재무제표', '기술 관련 서류'],
      evaluationCriteria: ['기술성', '사업성', '경영능력'],
      crawledAt: new Date(),
      crawlSuccess: true
    },
    isMockData: true
  }
];

export default function PolicyFundResultPage() {
  const router = useRouter();
  const { profile, matchResults, status, programs: storePrograms } = usePolicyFundStore();

  const [selectedProgram, setSelectedProgram] = useState<PolicyFundProgram | null>(null);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [sortBy, setSortBy] = useState<'match' | 'deadline'>('match');
  const [isLoading, setIsLoading] = useState(true);

  // 분석 결과 없으면 입력 페이지로 리다이렉트
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // 프로그램 목록 (store에 있으면 사용, 없으면 mock)
  const programs = storePrograms.length > 0 ? storePrograms : mockPrograms;

  // CompanyPolicyProfile 생성 (store profile에서)
  const companyProfile: CompanyPolicyProfile = profile ? {
    companyName: profile.companyName,
    businessNumber: profile.businessNumber,
    companySize: profile.companySize,
    businessAge: profile.businessAge,
    industry: profile.industry,
    location: profile.location,
    annualRevenue: profile.annualRevenue,
    employeeCount: profile.employeeCount,
    hasExportRevenue: profile.hasExportRevenue,
    hasRndActivity: profile.hasRndActivity,
    isVentureCompany: profile.isVentureCompany,
    isInnobiz: profile.certifications.innobiz,
    isMainbiz: profile.certifications.mainbiz,
  } : {
    // 기본값 (데모용)
    companyName: '(주)노바테크',
    businessNumber: '123-45-67890',
    companySize: 'small',
    businessAge: 4,
    industry: '제조업',
    location: '경기도',
    annualRevenue: 3000000000,
    employeeCount: 25,
    hasExportRevenue: false,
    hasRndActivity: true,
    isVentureCompany: true,
  };

  // 매칭 결과 계산 (store에 있으면 사용, 없으면 계산)
  const programsWithMatch = programs.map(program => {
    // store에 매칭 결과가 있으면 사용
    const storedMatch = matchResults.find(r => r.programId === program.id);
    if (storedMatch) {
      return {
        program,
        matchResult: {
          score: storedMatch.matchScore,
          level: storedMatch.matchLevel,
          reasons: storedMatch.matchReasons,
          warnings: storedMatch.warnings,
        }
      };
    }

    // 없으면 직접 계산
    const matchResult = calculateMatchScore(program, companyProfile);
    return {
      program,
      matchResult
    };
  });

  // 정렬
  const sortedPrograms = [...programsWithMatch].sort((a, b) => {
    if (sortBy === 'match') {
      return b.matchResult.score - a.matchResult.score;
    }
    // deadline 정렬 (추후 구현)
    return 0;
  });

  const highMatchCount = programsWithMatch.filter(p => p.matchResult.level === 'high').length;

  // 최대 지원 금액 계산
  const maxAmount = Math.max(...programs.map(p => p.detail?.supportAmount?.max || 0));
  const maxAmountText = maxAmount >= 100 ? `${maxAmount}억` : `${maxAmount}억`;

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex">
        <Sidebar />
        <main className="flex-1 ml-80 overflow-auto">
          <div className="max-w-5xl mx-auto px-8 py-6">
            <div className="flex items-center justify-center h-[60vh]">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">분석 결과를 불러오는 중...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 분석 결과 없음 알림
  const isUsingMockData = !profile;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar />

      <main className="flex-1 ml-80 overflow-auto">
        <div className="max-w-5xl mx-auto px-8 py-6">
          {/* 헤더 */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <a href="/" className="hover:text-gray-700">정책자금 1분진단</a>
              <span>/</span>
              <span className="text-gray-900">진단 결과</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">정책자금 매칭 결과</h1>
          </div>

          {/* 요약 배너 */}
          <SummaryBanner
            companyName={companyProfile.companyName}
            totalPrograms={programs.length}
            highMatchCount={highMatchCount}
            maxAmount={maxAmountText}
            filters={{
              industry: companyProfile.industry,
              location: companyProfile.location,
              businessAge: companyProfile.businessAge
            }}
          />

          {/* 데모/실제 데이터 알림 */}
          {isUsingMockData ? (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <p className="text-purple-800 text-sm flex items-center gap-2">
                <span>ℹ️</span>
                <span>
                  현재 데모 데이터로 표시됩니다.
                  <button
                    onClick={() => router.push('/')}
                    className="underline font-medium ml-1 hover:text-purple-900"
                  >
                    홈택스 서류를 업로드
                  </button>
                  하시면 기업 맞춤 진단 결과를 확인할 수 있습니다.
                </span>
              </p>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 text-sm flex items-center gap-2">
                <span>✅</span>
                <span>
                  <strong>{companyProfile.companyName}</strong> 기업 정보를 기반으로 분석한 결과입니다.
                  {profile?.certifications.venture && ' (벤처기업)'}
                  {profile?.certifications.innobiz && ' (이노비즈)'}
                </span>
              </p>
            </div>
          )}

          {/* 기업 정보 요약 (실제 데이터인 경우) */}
          {!isUsingMockData && profile && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">분석에 사용된 기업 정보</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">업종:</span>
                  <span className="ml-2 text-gray-900">{profile.industry || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">소재지:</span>
                  <span className="ml-2 text-gray-900">{profile.location || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">업력:</span>
                  <span className="ml-2 text-gray-900">{profile.businessAge}년</span>
                </div>
                <div>
                  <span className="text-gray-500">직원수:</span>
                  <span className="ml-2 text-gray-900">{profile.employeeCount}명</span>
                </div>
                <div>
                  <span className="text-gray-500">연매출:</span>
                  <span className="ml-2 text-gray-900">
                    {profile.annualRevenue ? `${(profile.annualRevenue / 100000000).toFixed(1)}억원` : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">부채비율:</span>
                  <span className="ml-2 text-gray-900">
                    {profile.debtRatio ? `${profile.debtRatio.toFixed(1)}%` : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">자금용도:</span>
                  <span className="ml-2 text-gray-900">
                    {profile.fundPurpose === 'operating' ? '운전자금' : '시설자금'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">필요금액:</span>
                  <span className="ml-2 text-gray-900">{profile.requiredAmount}억원</span>
                </div>
              </div>
            </div>
          )}

          {/* 정렬 옵션 */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-600">
              총 <span className="font-bold text-[#1e3a5f]">{programs.length}건</span>의 정책자금
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('match')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  sortBy === 'match'
                    ? 'bg-[#1e3a5f] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                적합도순
              </button>
              <button
                onClick={() => setSortBy('deadline')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  sortBy === 'deadline'
                    ? 'bg-[#1e3a5f] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                마감일순
              </button>
            </div>
          </div>

          {/* 자금 카드 리스트 */}
          <div className="grid gap-4">
            {sortedPrograms.map(({ program, matchResult }) => (
              <FundCard
                key={program.id}
                program={program}
                matchLevel={matchResult.level}
                matchScore={matchResult.score}
                matchReasons={matchResult.reasons}
                onShowSummary={() => {
                  setSelectedProgram(program);
                  setShowSummary(true);
                }}
                onShowChecklist={() => {
                  setSelectedProgram(program);
                  setShowChecklist(true);
                }}
              />
            ))}
          </div>

          {/* 다시 진단하기 버튼 */}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              다시 진단하기
            </button>
          </div>

          {/* 하단 안내 */}
          <div className="mt-8 p-6 bg-white rounded-xl border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-3">정책자금 신청 안내</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-[#d4a853]">•</span>
                <span>적합도는 기업 정보와 공고 조건을 기반으로 AI가 판단한 결과입니다.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#d4a853]">•</span>
                <span>실제 지원 가능 여부는 공고 원문을 반드시 확인해주세요.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#d4a853]">•</span>
                <span>서류 준비 및 신청 대행이 필요하시면 전문가 상담을 이용해주세요.</span>
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* 1장 요약 카드 모달 */}
      {showSummary && selectedProgram && (
        <OneSummaryCard
          program={selectedProgram}
          matchLevel={
            programsWithMatch.find(p => p.program.id === selectedProgram.id)?.matchResult.level || 'medium'
          }
          matchReasons={
            programsWithMatch.find(p => p.program.id === selectedProgram.id)?.matchResult.reasons || []
          }
          onClose={() => {
            setShowSummary(false);
            setSelectedProgram(null);
          }}
        />
      )}

      {/* 서류 체크리스트 모달 */}
      {showChecklist && selectedProgram && (
        <DocumentChecklist
          programName={selectedProgram.name}
          documents={selectedProgram.detail?.requiredDocuments || []}
          onClose={() => {
            setShowChecklist(false);
            setSelectedProgram(null);
          }}
        />
      )}
    </div>
  );
}
