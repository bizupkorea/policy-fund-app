'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { usePolicyFundStore } from '@/stores/policy-fund-store';
import type { Certifications, ExtractedCompanyData, IndustryType } from '@/lib/policy-fund/types';
import { INDUSTRY_LABELS, REGIONS } from '@/lib/policy-fund/types';
import { MiniDailyBriefing } from '@/components/policy-fund/MiniDailyBriefing';

// 목업 정책자금 프로그램 (나중에 API로 대체)
const mockPrograms = [
  {
    id: '1',
    name: '2025년 중소기업 정책자금 (혁신성장자금)',
    category: 'loan' as const,
    executingAgency: '중소벤처기업진흥공단',
    supervisingAgency: '중소벤처기업부',
    applicationPeriod: '2025.01.02 ~ 2025.12.31',
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
    category: 'loan' as const,
    executingAgency: '경기신용보증재단',
    supervisingAgency: '경기도',
    applicationPeriod: '2025.01.15 ~ 2025.12.20',
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
    category: 'loan' as const,
    executingAgency: '소상공인시장진흥공단',
    supervisingAgency: '중소벤처기업부',
    applicationPeriod: '2025.02.01 ~ 2025.11.30',
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
    category: 'guarantee' as const,
    executingAgency: '신용보증기금',
    supervisingAgency: '금융위원회',
    applicationPeriod: '2025.01.01 ~ 2025.12.31',
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
    category: 'guarantee' as const,
    executingAgency: '기술보증기금',
    supervisingAgency: '금융위원회',
    applicationPeriod: '2025.01.01 ~ 2025.12.31',
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

export default function PolicyFundPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Zustand store
  const {
    error,
    uploadedFiles,
    userInput,
    setStatus,
    setError,
    addUploadedFile,
    removeUploadedFile,
    clearUploadedFiles,
    setExtractedData,
    setUserInput,
    setCertification,
    setFundPurpose,
    setRequiredAmount,
    buildProfile,
    setPrograms,
    runMatching,
    runKBMatching,
  } = usePolicyFundStore();

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 카테고리별 파일 선택 핸들러
  const handleCategoryFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, category: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // PDF만 허용
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('PDF 파일만 업로드 가능합니다.');
      e.target.value = '';
      return;
    }

    // 파일 크기 제한 (20MB)
    if (file.size > 20 * 1024 * 1024) {
      setError('파일 크기는 20MB 이하여야 합니다.');
      e.target.value = '';
      return;
    }

    // 재무제표는 3개까지 허용, 나머지는 1개만
    const maxFilesForCategory = category === 'financialStatement' ? 3 : 1;
    const existingFiles = uploadedFiles.filter(f => f.category === category);

    if (existingFiles.length >= maxFilesForCategory) {
      setError(`이 항목은 최대 ${maxFilesForCategory}개까지 업로드 가능합니다.`);
      e.target.value = '';
      return;
    }

    // 1개만 허용하는 카테고리는 기존 파일 제거
    if (maxFilesForCategory === 1 && existingFiles.length > 0) {
      const existingIdx = uploadedFiles.findIndex(f => f.category === category);
      if (existingIdx >= 0) {
        removeUploadedFile(existingIdx);
      }
    }

    // base64 변환
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve(dataUrl.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    addUploadedFile(file, base64, category);
    setError(null);

    // input 초기화
    e.target.value = '';
  };

  // AI 진단 시작
  const handleAnalyze = async () => {
    if (uploadedFiles.length === 0) {
      setError('서류를 1개 이상 업로드해주세요.');
      return;
    }

    // 체납 여부 확인
    if (userInput.hasTaxDelinquency) {
      setError('체납이 있는 경우 대부분의 정책자금 신청이 불가능합니다. 먼저 체납을 해결해주세요.');
      return;
    }

    setIsAnalyzing(true);
    setStatus('extracting');
    setError(null);

    try {
      // 1. PDF에서 기업 정보 추출 (API 호출)
      console.log('🔍 PDF 분석 시작...');
      const documents = uploadedFiles.map((f) => ({
        base64: f.base64,
        fileName: f.file.name,
      }));

      const response = await fetch('/api/policy-fund/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '문서 분석에 실패했습니다.');
      }

      const extractedData = result.data as ExtractedCompanyData;
      setExtractedData(extractedData);

      // 2. 프로필 구축
      console.log('📊 프로필 구축...');
      setStatus('matching');
      const profile = buildProfile();

      if (!profile) {
        throw new Error('기업 정보를 추출할 수 없습니다. 서류를 확인해주세요.');
      }

      // 3. 정책자금 프로그램 로드 (목업 + Knowledge Base)
      setPrograms(mockPrograms);

      // 4. 매칭 실행 (기존 + Knowledge Base 하이브리드)
      console.log('🎯 매칭 실행...');
      runMatching();

      // 4-1. Knowledge Base 매칭도 실행
      console.log('🎯 Knowledge Base 매칭 실행...');
      await runKBMatching();

      // 5. 결과 페이지로 이동
      router.push('/result');
    } catch (err) {
      console.error('분석 실패:', err);
      setError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.');
      setStatus('error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 인증 체크박스 변경
  const handleCertificationChange = (key: keyof Certifications) => {
    setCertification(key, !userInput.certifications[key]);
  };

  // 테스트용 데모 실행
  const handleDemoAnalyze = async () => {
    setIsAnalyzing(true);
    setStatus('extracting');
    setError(null);

    try {
      // 가상 기업 데이터
      const mockExtractedData: ExtractedCompanyData = {
        companyName: '(주)테스트기업',
        businessNumber: '123-45-67890',
        establishedDate: '2020-03-15',
        industry: '제조업',
        industryCode: 'C',
        location: '경기',
        address: '경기도 성남시 분당구',
        annualRevenue: 2500000000, // 25억
        totalAssets: 1500000000,   // 15억
        totalLiabilities: 500000000, // 5억
        equity: 1000000000,        // 10억
        debtRatio: 50,
        operatingProfit: 300000000, // 3억
        employeeCount: 15,
        youthEmployeeCount: 5,
        hasTaxDelinquency: false,
        extractedAt: new Date(),
        confidence: 0.95,
      };

      setExtractedData(mockExtractedData);

      // 프로필 구축
      console.log('📊 프로필 구축...');
      setStatus('matching');
      const profile = buildProfile();

      if (!profile) {
        throw new Error('프로필 구축에 실패했습니다.');
      }

      // 정책자금 프로그램 로드
      setPrograms(mockPrograms);

      // 매칭 실행
      console.log('🎯 매칭 실행...');
      runMatching();

      // Knowledge Base 매칭
      console.log('🎯 Knowledge Base 매칭 실행...');
      await runKBMatching();

      // 결과 페이지로 이동
      router.push('/result');
    } catch (err) {
      console.error('데모 분석 실패:', err);
      setError(err instanceof Error ? err.message : '데모 실행 중 오류가 발생했습니다.');
      setStatus('error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <MainLayout hideTopNav={true} contentPadding="24px" background="light">
        <div className="max-w-6xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              정책자금 <span className="text-orange-500">1분진단</span>
            </h1>
            <p className="text-gray-600">
              필요서류를 업로드하면 AI가 맞춤 정책자금을 찾아드립니다.
            </p>
          </div>

          {/* 2컬럼 레이아웃 */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
            {/* 왼쪽: 업로드 및 입력 영역 */}
            <div>
              {/* Step 1: 서류 업로드 */}
              <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-7 h-7 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </span>
                    필요서류 업로드
                  </h2>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    🔒 모든 문서는 분석 후 자동 파기됩니다
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  다음 서류 중 <strong>1개 이상</strong>을 업로드해주세요. 많이 올릴수록 정확도가 높아집니다.
                </p>

                {/* 카테고리별 업로드 영역 */}
                <div className="space-y-2">
              {[
                { key: 'businessRegistration', label: '사업자등록증명', desc: '회사명, 설립일, 업종', priority: true },
                { key: 'financialStatement', label: '표준재무제표증명', desc: '최근 3년 재무제표 업로드', priority: false, maxFiles: 3 },
                { key: 'vatCertificate', label: '부가세과세표준증명', desc: '매출액 확인', priority: false },
                { key: 'taxClearance', label: '납세증명서', desc: '체납 여부', priority: false },
                { key: 'insuranceList', label: '4대보험가입자명부', desc: '직원수 확인', priority: false },
              ].map(({ key, label, desc, priority, maxFiles = 1 }) => {
                const categoryFiles = uploadedFiles.filter(f => f.category === key);
                const uploadCount = categoryFiles.length;
                const isUploaded = uploadCount > 0;
                const canUploadMore = uploadCount < maxFiles;

                return (
                  <div
                    key={key}
                    onClick={() => {
                      const input = document.getElementById(`file-input-${key}`) as HTMLInputElement;
                      input?.click();
                    }}
                    className={`relative flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                      isUploaded
                        ? 'bg-green-50 border border-green-400'
                        : priority
                        ? 'bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-300 hover:border-orange-400 hover:shadow-sm'
                        : 'bg-gray-50 border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
                    }`}
                  >
                    <input
                      id={`file-input-${key}`}
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => handleCategoryFileSelect(e, key)}
                    />

                    {/* 아이콘 */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isUploaded
                        ? 'bg-green-500'
                        : priority
                        ? 'bg-gradient-to-br from-orange-500 to-amber-500'
                        : 'bg-gray-300'
                    }`}>
                      {isUploaded ? (
                        <CheckCircle className="w-4 h-4 text-white" />
                      ) : (
                        <FileText className="w-4 h-4 text-white" />
                      )}
                    </div>

                    {/* 텍스트 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-sm font-medium ${isUploaded ? 'text-green-700' : 'text-gray-900'}`}>
                          {label}
                        </p>
                        {priority && !isUploaded && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-orange-500 text-white rounded">
                            필수
                          </span>
                        )}
                      </div>
                      {isUploaded ? (
                        <p className="text-xs text-green-600 truncate">
                          {maxFiles > 1 ? `${uploadCount}/${maxFiles}개 업로드됨` : categoryFiles[0]?.file.name}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500">{desc}</p>
                      )}
                    </div>

                    {/* 업로드/삭제 버튼 */}
                    {isUploaded && !canUploadMore ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // 해당 카테고리 파일 모두 삭제
                          categoryFiles.forEach(() => {
                            const idx = uploadedFiles.findIndex(f => f.category === key);
                            if (idx >= 0) removeUploadedFile(idx);
                          });
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        priority
                          ? 'bg-orange-500 text-white hover:bg-orange-600'
                          : isUploaded
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-white text-gray-600 border border-gray-300 hover:border-orange-400 hover:text-orange-600'
                      }`}>
                        {isUploaded ? `+추가 (${uploadCount}/${maxFiles})` : '업로드'}
                      </div>
                    )}
                  </div>
                );
              })}

                  {/* 업로드 현황 */}
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-xs text-gray-600">
                      <span className="font-bold text-orange-600">{uploadedFiles.length}</span>
                      <span className="text-gray-400"> / 7</span> 업로드
                    </p>
                    {uploadedFiles.length > 0 && (
                      <button
                        onClick={clearUploadedFiles}
                        className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                      >
                        전체 삭제
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 2: 추가 정보 입력 */}
              <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-7 h-7 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </span>
                  추가 정보 입력
                </h2>

                <div className="space-y-6">
                  {/* 자금 용도 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      자금 용도
                    </label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setFundPurpose('operating')}
                        className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                          userInput.fundPurpose === 'operating'
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        운전자금
                        <p className="text-xs font-normal mt-1 opacity-70">
                          인건비, 재료비, 운영비 등
                        </p>
                      </button>
                      <button
                        onClick={() => setFundPurpose('facility')}
                        className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                          userInput.fundPurpose === 'facility'
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        시설자금
                        <p className="text-xs font-normal mt-1 opacity-70">
                          기계 구입, 공장 건축 등
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* 필요 금액 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      필요 금액
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0.1"
                        max="100"
                        step="0.1"
                        value={userInput.requiredAmount}
                        onChange={(e) => setRequiredAmount(Number(e.target.value))}
                        className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                      />
                      <span className="text-gray-700 font-medium">억원</span>
                    </div>
                  </div>

                  {/* 주요 업종 - 1행 6열 비주얼 카드 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      주요 업종
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {(Object.keys(INDUSTRY_LABELS) as IndustryType[]).map((key) => {
                        const { label, icon } = INDUSTRY_LABELS[key];
                        const isSelected = userInput.industryType === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setUserInput({ industryType: key })}
                            className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border-2 transition-all ${
                              isSelected
                                ? 'border-orange-500 bg-orange-50 text-orange-700'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <span className="text-2xl mb-1">{icon}</span>
                            <span className="text-xs font-medium">{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 소재지 + 대표자 나이 (2열) */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* 소재지 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        소재지 (시/도)
                      </label>
                      <select
                        value={userInput.location}
                        onChange={(e) => setUserInput({ location: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none bg-white"
                      >
                        {REGIONS.map((region) => (
                          <option key={region} value={region}>{region}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        지역별 특화 자금 매칭에 사용
                      </p>
                    </div>

                    {/* 대표자 나이 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        대표자 나이 <span className="text-gray-400 font-normal">(선택)</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="19"
                          max="80"
                          value={userInput.ceoAge ?? ''}
                          onChange={(e) => {
                            const age = e.target.value ? Number(e.target.value) : undefined;
                            setUserInput({
                              ceoAge: age,
                              isYoungCeo: age !== undefined ? age <= 39 : userInput.isYoungCeo
                            });
                          }}
                          placeholder="만 나이"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                        />
                        <span className="text-gray-700 font-medium">세</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        입력 시 청년 자금 정확 매칭
                      </p>
                    </div>
                  </div>

                  {/* 청년 대표자 체크박스 */}
                  <div>
                    <label
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        userInput.isYoungCeo
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={userInput.isYoungCeo}
                        onChange={(e) => {
                          const isYoung = e.target.checked;
                          setUserInput({
                            isYoungCeo: isYoung,
                            // 체크 해제 시 나이도 초기화 (선택사항)
                            ceoAge: !isYoung && userInput.ceoAge && userInput.ceoAge <= 39 ? undefined : userInput.ceoAge
                          });
                        }}
                        className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          청년 대표자 (만 39세 이하)
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          체크 시 청년 전용 우대 자금을 우선 매칭합니다
                          {userInput.ceoAge !== undefined && (
                            <span className="ml-1 text-orange-600">
                              (현재 {userInput.ceoAge}세 입력됨)
                            </span>
                          )}
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* 기존 정책자금 잔액 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      기존 정책자금 잔액
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={userInput.existingLoanBalance}
                        onChange={(e) => setUserInput({ existingLoanBalance: Number(e.target.value) })}
                        placeholder="없으면 0 입력"
                        className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                      />
                      <span className="text-gray-700 font-medium">억원</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      중진공, 신보, 기보 등 기존 정책자금 대출 잔액
                    </p>
                  </div>

                  {/* 보유 인증 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      보유 인증 (해당 항목 체크)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { key: 'venture' as const, label: '벤처기업' },
                        { key: 'innobiz' as const, label: '이노비즈' },
                        { key: 'mainbiz' as const, label: '메인비즈' },
                        { key: 'researchInstitute' as const, label: '기업부설연구소' },
                        { key: 'patent' as const, label: '특허/실용신안' },
                        { key: 'exportRecord' as const, label: '수출 실적' },
                        { key: 'womenOwned' as const, label: '여성기업' },
                        { key: 'iso' as const, label: 'ISO 인증' },
                      ].map(({ key, label }) => (
                        <label
                          key={key}
                          className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                            userInput.certifications[key]
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={userInput.certifications[key]}
                            onChange={() => handleCertificationChange(key)}
                            className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                          />
                          <span className="text-sm text-gray-700">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 체납/신용 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        국세/지방세 체납
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setUserInput({ hasTaxDelinquency: false })}
                          className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                            !userInput.hasTaxDelinquency
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-gray-200 text-gray-600'
                          }`}
                        >
                          없음
                        </button>
                        <button
                          onClick={() => setUserInput({ hasTaxDelinquency: true })}
                          className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                            userInput.hasTaxDelinquency
                              ? 'border-red-500 bg-red-50 text-red-700'
                              : 'border-gray-200 text-gray-600'
                          }`}
                        >
                          있음
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        대표자 신용 문제
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setUserInput({ hasCreditIssue: false })}
                          className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                            !userInput.hasCreditIssue
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-gray-200 text-gray-600'
                          }`}
                        >
                          없음
                        </button>
                        <button
                          onClick={() => setUserInput({ hasCreditIssue: true })}
                          className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                            userInput.hasCreditIssue
                              ? 'border-red-500 bg-red-50 text-red-700'
                              : 'border-gray-200 text-gray-600'
                          }`}
                        >
                          있음
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* 진단 시작 버튼 */}
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || uploadedFiles.length === 0}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                  isAnalyzing || uploadedFiles.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 shadow-lg hover:shadow-xl'
                }`}
              >
                {isAnalyzing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    AI 분석 중...
                  </span>
                ) : (
                  'AI 진단 시작하기'
                )}
              </button>

              {/* 안내 문구 */}
              <p className="text-center text-sm text-gray-500 mt-4">
                * 업로드된 서류는 분석 후 즉시 삭제됩니다
              </p>

              {/* 테스트용 데모 버튼 */}
              <button
                onClick={handleDemoAnalyze}
                disabled={isAnalyzing}
                className="w-full mt-3 py-3 rounded-xl font-medium text-sm border-2 border-dashed border-gray-300 text-gray-500 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50 transition-all"
              >
                테스트용 데모 실행 (가상 데이터)
              </button>
            </div>

            {/* 오른쪽: 미니 브리핑 사이드바 */}
            <aside className="hidden lg:block">
              <MiniDailyBriefing />
            </aside>
          </div>
        </div>
    </MainLayout>
  );
}
