/**
 * 정책자금 1분진단 상태 관리 (AI 분석 지원 버전)
 * Zustand를 사용한 전역 상태 관리
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ExtractedCompanyData,
  UserInputData,
  PolicyFundProfile,
  AnalysisStatus,
  PolicyFundMatchResult,
  Certifications,
  FundPurpose,
} from '@/lib/policy-fund/types';
import { PolicyFundProgram, CompanyPolicyProfile } from '@/lib/types/policy-fund';
import { calculateMatchScore } from '@/lib/policy-fund/matching-engine';
import type { AIAnalysisResult } from '@/lib/policy-fund/gemini-advisor-new';
import type { EligibilityResult } from '@/lib/policy-fund/eligibility-checker-new';

// ============================================================================
// AI 추천 결과 타입
// ============================================================================

export interface AIRecommendation {
  fundId: string;
  fundName: string;
  agency: string;
  category: string;
  eligibility: EligibilityResult;
  aiAnalysis: AIAnalysisResult;
  maxAmount?: string;
  interestRate?: string;
}

export interface GeneralMatch {
  fundId: string;
  fundName: string;
  agency: string;
  category: string;
  eligibility: EligibilityResult;
  maxAmount?: string;
  applicationPeriod?: string;
}

// ============================================================================
// Store 타입 정의
// ============================================================================

interface PolicyFundState {
  // 분석 상태
  status: AnalysisStatus;
  error: string | null;

  // 업로드된 파일
  uploadedFiles: Array<{ file: File; base64: string; category?: string }>;

  // 추출된 데이터
  extractedData: ExtractedCompanyData | null;

  // 사용자 입력
  userInput: UserInputData;

  // 최종 프로필
  profile: PolicyFundProfile | null;

  // 매칭 결과
  matchResults: PolicyFundMatchResult[];

  // 정책자금 프로그램 목록 (API에서 가져옴)
  programs: PolicyFundProgram[];

  // 분석 시간
  analyzedAt: Date | null;

  // AI 추천 결과 (VIP 섹션)
  aiRecommendations: AIRecommendation[];

  // 일반 매칭 결과 (하단 리스트)
  generalMatches: GeneralMatch[];

  // AI 분석 로딩 상태
  isAIAnalyzing: boolean;

  // Actions
  setStatus: (status: AnalysisStatus) => void;
  setError: (error: string | null) => void;
  setUploadedFiles: (files: Array<{ file: File; base64: string; category?: string }>) => void;
  addUploadedFile: (file: File, base64: string, category?: string) => void;
  removeUploadedFile: (index: number) => void;
  clearUploadedFiles: () => void;
  setExtractedData: (data: ExtractedCompanyData) => void;
  setUserInput: (input: Partial<UserInputData>) => void;
  setCertification: (key: keyof Certifications, value: boolean) => void;
  setFundPurpose: (purpose: FundPurpose) => void;
  setRequiredAmount: (amount: number) => void;
  buildProfile: () => PolicyFundProfile | null;
  setPrograms: (programs: PolicyFundProgram[]) => void;
  runMatching: () => void;
  setAIRecommendations: (recommendations: AIRecommendation[]) => void;
  setGeneralMatches: (matches: GeneralMatch[]) => void;
  setIsAIAnalyzing: (isAnalyzing: boolean) => void;
  reset: () => void;
}

// ============================================================================
// 초기 상태
// ============================================================================

const initialUserInput: UserInputData = {
  fundPurpose: 'operating',
  requiredAmount: 1,
  industryType: 'manufacturing',
  location: '서울',
  ceoAge: undefined,
  isYoungCeo: false,
  existingLoanBalance: 0,
  certifications: {
    venture: false,
    innobiz: false,
    mainbiz: false,
    researchInstitute: false,
    patent: false,
    exportRecord: false,
    womenOwned: false,
    disabledOwned: false,
    iso: false,
  },
  hasTaxDelinquency: false,
  hasCreditIssue: false,
};

// ============================================================================
// Store 생성
// ============================================================================

export const usePolicyFundStoreNew = create<PolicyFundState>()(
  persist(
    (set, get) => ({
      // 초기 상태
      status: 'idle',
      error: null,
      uploadedFiles: [],
      extractedData: null,
      userInput: initialUserInput,
      profile: null,
      matchResults: [],
      programs: [],
      analyzedAt: null,
      aiRecommendations: [],
      generalMatches: [],
      isAIAnalyzing: false,

      // Status 설정
      setStatus: (status) => set({ status }),

      // Error 설정
      setError: (error) => set({ error, status: error ? 'error' : get().status }),

      // 파일 관리
      setUploadedFiles: (files) => set({ uploadedFiles: files }),

      addUploadedFile: (file, base64, category) =>
        set((state) => ({
          uploadedFiles: [...state.uploadedFiles, { file, base64, category }],
        })),

      removeUploadedFile: (index) =>
        set((state) => ({
          uploadedFiles: state.uploadedFiles.filter((_, i) => i !== index),
        })),

      clearUploadedFiles: () => set({ uploadedFiles: [] }),

      // 추출 데이터 설정
      setExtractedData: (data) => set({ extractedData: data }),

      // 사용자 입력 설정
      setUserInput: (input) =>
        set((state) => ({
          userInput: { ...state.userInput, ...input },
        })),

      setCertification: (key, value) =>
        set((state) => ({
          userInput: {
            ...state.userInput,
            certifications: {
              ...state.userInput.certifications,
              [key]: value,
            },
          },
        })),

      setFundPurpose: (purpose) =>
        set((state) => ({
          userInput: { ...state.userInput, fundPurpose: purpose },
        })),

      setRequiredAmount: (amount) =>
        set((state) => ({
          userInput: { ...state.userInput, requiredAmount: amount },
        })),

      // 프로필 구축
      buildProfile: () => {
        const { extractedData, userInput } = get();

        if (!extractedData || !extractedData.companyName) {
          return null;
        }

        // 업력 계산
        let businessAge = 0;
        if (extractedData.establishedDate) {
          const established = new Date(extractedData.establishedDate);
          const today = new Date();
          businessAge = Math.floor(
            (today.getTime() - established.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
          );
        }

        // 기업 규모 분류
        const employeeCount = extractedData.employeeCount || 10;
        const annualRevenue = extractedData.annualRevenue || 0;
        let companySize: 'startup' | 'small' | 'medium' | 'large' = 'small';

        if (employeeCount < 5) companySize = 'startup';
        else if (employeeCount < 50) companySize = 'small';
        else if (employeeCount < 300 || annualRevenue < 40000000000) companySize = 'medium';
        else companySize = 'large';

        const profile: PolicyFundProfile = {
          companyName: extractedData.companyName,
          businessNumber: extractedData.businessNumber || '',
          establishedDate: extractedData.establishedDate || '',
          businessAge,
          industry: extractedData.industry || '',
          location: extractedData.location || '',
          annualRevenue: extractedData.annualRevenue || 0,
          debtRatio: extractedData.debtRatio || 0,
          employeeCount,
          fundPurpose: userInput.fundPurpose,
          requiredAmount: userInput.requiredAmount,
          certifications: userInput.certifications,
          hasTaxDelinquency: userInput.hasTaxDelinquency || extractedData.hasTaxDelinquency || false,
          hasCreditIssue: userInput.hasCreditIssue,
          companySize,
          isVentureCompany: userInput.certifications.venture,
          hasExportRevenue: userInput.certifications.exportRecord,
          hasRndActivity: userInput.certifications.researchInstitute || userInput.certifications.patent,
        };

        set({ profile });
        return profile;
      },

      // 정책자금 프로그램 설정
      setPrograms: (programs) => set({ programs }),

      // 매칭 실행
      runMatching: () => {
        const { profile, programs } = get();

        if (!profile) {
          console.error('프로필이 없습니다.');
          return;
        }

        // CompanyPolicyProfile로 변환
        const companyProfile: CompanyPolicyProfile = {
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
        };

        // 각 프로그램에 대해 매칭 점수 계산
        const results: PolicyFundMatchResult[] = programs.map((program) => {
          const matchResult = calculateMatchScore(program, companyProfile);
          return {
            programId: program.id,
            programName: program.name,
            matchScore: matchResult.score,
            matchLevel: matchResult.level,
            matchReasons: matchResult.reasons,
            warnings: matchResult.warnings,
          };
        });

        // 점수순 정렬
        results.sort((a, b) => b.matchScore - a.matchScore);

        set({
          matchResults: results,
          status: 'completed',
          analyzedAt: new Date(),
        });
      },

      // AI 추천 설정
      setAIRecommendations: (recommendations) => set({ aiRecommendations: recommendations }),

      // 일반 매칭 설정
      setGeneralMatches: (matches) => set({ generalMatches: matches }),

      // AI 분석 로딩 상태 설정
      setIsAIAnalyzing: (isAnalyzing) => set({ isAIAnalyzing: isAnalyzing }),

      // 초기화
      reset: () =>
        set({
          status: 'idle',
          error: null,
          uploadedFiles: [],
          extractedData: null,
          userInput: initialUserInput,
          profile: null,
          matchResults: [],
          analyzedAt: null,
          aiRecommendations: [],
          generalMatches: [],
          isAIAnalyzing: false,
        }),
    }),
    {
      name: 'policy-fund-store-new',
      partialize: (state) => ({
        // 파일 객체는 저장하지 않음
        extractedData: state.extractedData,
        userInput: state.userInput,
        profile: state.profile,
        matchResults: state.matchResults,
        analyzedAt: state.analyzedAt,
        aiRecommendations: state.aiRecommendations,
        generalMatches: state.generalMatches,
      }),
    }
  )
);

// ============================================================================
// 셀렉터
// ============================================================================

export const selectStatus = (state: PolicyFundState) => state.status;
export const selectError = (state: PolicyFundState) => state.error;
export const selectExtractedData = (state: PolicyFundState) => state.extractedData;
export const selectUserInput = (state: PolicyFundState) => state.userInput;
export const selectProfile = (state: PolicyFundState) => state.profile;
export const selectMatchResults = (state: PolicyFundState) => state.matchResults;
export const selectHighMatchCount = (state: PolicyFundState) =>
  state.matchResults.filter((r) => r.matchLevel === 'high').length;
export const selectAIRecommendations = (state: PolicyFundState) => state.aiRecommendations;
export const selectGeneralMatches = (state: PolicyFundState) => state.generalMatches;
export const selectIsAIAnalyzing = (state: PolicyFundState) => state.isAIAnalyzing;
