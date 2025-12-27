/**
 * 정책자금 1분진단 상태 관리
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
  IndustryType,
  calculateBusinessAge,
  classifyCompanySize,
  getInitialUserInput,
  getInitialCertifications,
} from '@/lib/policy-fund/types';
import { PolicyFundProgram, CompanyPolicyProfile } from '@/lib/types/policy-fund';
import { calculateMatchScore, ExtendedCompanyProfile, matchWithKnowledgeBase, DetailedMatchResult } from '@/lib/policy-fund/matching-engine';
import { AIAdvisorResult } from '@/lib/policy-fund/gemini-advisor';

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

  // Knowledge Base 매칭 결과
  kbMatchResults: DetailedMatchResult[];
  aiAnalysis: AIAdvisorResult[];

  // 분석 시간
  analyzedAt: Date | null;

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
  runKBMatching: () => Promise<void>;
  reset: () => void;
}

// ============================================================================
// 초기 상태
// ============================================================================

const initialUserInput: UserInputData = {
  fundPurpose: 'operating',
  requiredAmount: 1,
  industryType: 'manufacturing',
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

export const usePolicyFundStore = create<PolicyFundState>()(
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
      kbMatchResults: [],
      aiAnalysis: [],
      analyzedAt: null,

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

      // Knowledge Base 기반 매칭 실행
      runKBMatching: async () => {
        const { profile, userInput } = get();

        if (!profile) {
          console.error('프로필이 없습니다.');
          return;
        }

        // ExtendedCompanyProfile로 변환
        const extendedProfile: ExtendedCompanyProfile = {
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
          // Extended fields
          revenue: profile.annualRevenue / 100000000, // 원 → 억원
          industryName: profile.industry,
          region: profile.location,
          hasTaxDelinquency: userInput.hasTaxDelinquency,
          hasPreviousSupport: false,
          isYouthCompany: userInput.isYoungCeo,
          hasExistingLoan: userInput.existingLoanBalance > 0,
        };

        try {
          // Knowledge Base 매칭 실행
          const kbResult = await matchWithKnowledgeBase(extendedProfile, {
            useAI: false, // 빠른 응답을 위해 AI 비활성화
            topN: 10,
          });

          // 기존 matchResults 형식으로도 변환
          const legacyResults: PolicyFundMatchResult[] = kbResult.results.map((result, idx) => ({
            programId: `kb-${idx}`,
            programName: result.supportDetails?.amount
              ? `${result.eligibilityReasons[0] || '정책자금'}`
              : '정책자금',
            matchScore: result.score,
            matchLevel: result.level,
            matchReasons: result.eligibilityReasons,
            warnings: result.ineligibilityReasons,
          }));

          set({
            kbMatchResults: kbResult.results,
            aiAnalysis: kbResult.aiAnalysis || [],
            matchResults: [...get().matchResults, ...legacyResults],
            status: 'completed',
            analyzedAt: new Date(),
          });
        } catch (error) {
          console.error('KB 매칭 실패:', error);
          set({ status: 'error', error: 'Knowledge Base 매칭에 실패했습니다.' });
        }
      },

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
          kbMatchResults: [],
          aiAnalysis: [],
          analyzedAt: null,
        }),
    }),
    {
      name: 'policy-fund-store',
      partialize: (state) => ({
        // 파일 객체는 저장하지 않음
        extractedData: state.extractedData,
        userInput: state.userInput,
        profile: state.profile,
        matchResults: state.matchResults,
        analyzedAt: state.analyzedAt,
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
