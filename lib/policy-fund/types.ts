/**
 * 정책자금 1분진단 타입 정의
 */

// ============================================================================
// PDF에서 추출된 기업 정보
// ============================================================================

/**
 * Gemini가 PDF에서 추출한 기업 데이터
 */
export interface ExtractedCompanyData {
  // 사업자등록증에서 추출
  companyName: string;           // 회사명
  businessNumber: string;        // 사업자번호
  establishedDate: string;       // 설립일 (YYYY-MM-DD)
  industry: string;              // 업종
  industryCode?: string;         // 업종코드
  location: string;              // 소재지 (시/도)
  address?: string;              // 상세주소

  // 재무제표에서 추출
  annualRevenue?: number;        // 연매출 (원)
  totalAssets?: number;          // 총자산 (원)
  totalLiabilities?: number;     // 총부채 (원)
  equity?: number;               // 자본총계 (원)
  debtRatio?: number;            // 부채비율 (%)
  operatingProfit?: number;      // 영업이익 (원)

  // 4대보험 명부에서 추출
  employeeCount?: number;        // 직원수
  youthEmployeeCount?: number;   // 청년 고용수 (34세 이하)

  // 납세증명서에서 추출
  hasTaxDelinquency?: boolean;   // 체납 여부

  // 추출 메타데이터
  extractedAt: Date;
  confidence: number;            // 전체 추출 신뢰도 (0-1)
  warnings?: string[];           // 추출 시 경고 메시지
}

// ============================================================================
// 사용자 입력 정보
// ============================================================================

/**
 * 자금 용도
 */
export type FundPurpose = 'operating' | 'facility';

/**
 * 업종 구분
 */
export type IndustryType = 'manufacturing' | 'construction' | 'retail' | 'it' | 'food' | 'other';

/**
 * 업종별 한글 이름
 */
export const INDUSTRY_LABELS: Record<IndustryType, { label: string; icon: string }> = {
  manufacturing: { label: '제조업', icon: '🏭' },
  construction: { label: '건설업', icon: '🏗️' },
  retail: { label: '도소매', icon: '🛒' },
  it: { label: 'IT/SW', icon: '💻' },
  food: { label: '음식/숙박', icon: '🍽️' },
  other: { label: '기타서비스', icon: '📋' },
};

/**
 * 보유 인증 종류
 */
export interface Certifications {
  venture: boolean;              // 벤처기업
  innobiz: boolean;              // 이노비즈
  mainbiz: boolean;              // 메인비즈
  researchInstitute: boolean;    // 기업부설연구소
  patent: boolean;               // 특허/실용신안
  exportRecord: boolean;         // 수출실적
  womenOwned: boolean;           // 여성기업
  disabledOwned: boolean;        // 장애인기업
  iso: boolean;                  // ISO 인증
}

/**
 * 사용자 추가 입력 정보
 */
export interface UserInputData {
  fundPurpose: FundPurpose;      // 자금 용도
  requiredAmount: number;        // 필요 금액 (억원)
  industryType: IndustryType;    // 주요 업종
  isYoungCeo: boolean;           // 청년 대표자 (만 39세 이하)
  existingLoanBalance: number;   // 기존 정책자금 잔액 (억원)
  certifications: Certifications; // 보유 인증
  hasTaxDelinquency: boolean;    // 체납 여부 (직접 입력)
  hasCreditIssue: boolean;       // 신용 문제 여부
}

// ============================================================================
// 통합 기업 프로필
// ============================================================================

/**
 * PDF 추출 + 사용자 입력 병합된 최종 프로필
 */
export interface PolicyFundProfile {
  // 기본 정보
  companyName: string;
  businessNumber: string;
  establishedDate: string;
  businessAge: number;           // 업력 (년)
  industry: string;
  location: string;

  // 재무 정보
  annualRevenue: number;
  debtRatio: number;
  employeeCount: number;

  // 자금 정보 (사용자 입력)
  fundPurpose: FundPurpose;
  requiredAmount: number;

  // 인증 및 자격
  certifications: Certifications;
  hasTaxDelinquency: boolean;
  hasCreditIssue: boolean;

  // 기업 규모 분류
  companySize: 'startup' | 'small' | 'medium' | 'large';

  // 특수 조건
  isVentureCompany: boolean;
  hasExportRevenue: boolean;
  hasRndActivity: boolean;
}

// ============================================================================
// 분석 상태
// ============================================================================

/**
 * 분석 진행 상태
 */
export type AnalysisStatus =
  | 'idle'           // 대기
  | 'uploading'      // 파일 업로드 중
  | 'extracting'     // PDF에서 데이터 추출 중
  | 'matching'       // 정책자금 매칭 중
  | 'completed'      // 완료
  | 'error';         // 오류

/**
 * 분석 결과 전체
 */
export interface PolicyFundAnalysisResult {
  status: AnalysisStatus;
  extractedData?: ExtractedCompanyData;
  userInput?: UserInputData;
  profile?: PolicyFundProfile;
  matchResults?: PolicyFundMatchResult[];
  error?: string;
  analyzedAt?: Date;
}

/**
 * 개별 정책자금 매칭 결과
 */
export interface PolicyFundMatchResult {
  programId: string;
  programName: string;
  matchScore: number;            // 0-100
  matchLevel: 'high' | 'medium' | 'low';
  matchReasons: string[];
  warnings: string[];
}

// ============================================================================
// 업로드 파일 타입
// ============================================================================

/**
 * 정책자금용 문서 카테고리
 */
export type PolicyDocumentCategory =
  | 'financialStatement'    // 표준재무제표증명
  | 'vatCertificate'        // 부가가치세과세표준증명
  | 'businessRegistration'  // 사업자등록증명
  | 'taxClearance'          // 납세증명서
  | 'insuranceList';        // 4대보험가입자명부

/**
 * 업로드된 파일 정보
 */
export interface UploadedPolicyDocument {
  file: File;
  category: PolicyDocumentCategory;
  base64?: string;
  extractedData?: Partial<ExtractedCompanyData>;
}

/**
 * 카테고리별 업로드 파일
 */
export interface PolicyUploadedFiles {
  financialStatement: UploadedPolicyDocument[];
  vatCertificate: UploadedPolicyDocument[];
  businessRegistration: UploadedPolicyDocument[];
  taxClearance: UploadedPolicyDocument[];
  insuranceList: UploadedPolicyDocument[];
}

// ============================================================================
// 헬퍼 함수
// ============================================================================

/**
 * 설립일로부터 업력 계산
 */
export function calculateBusinessAge(establishedDate: string): number {
  const established = new Date(establishedDate);
  const today = new Date();
  const diffYears = (today.getTime() - established.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  return Math.floor(diffYears);
}

/**
 * 기업 규모 분류
 */
export function classifyCompanySize(
  employeeCount: number,
  annualRevenue: number
): 'startup' | 'small' | 'medium' | 'large' {
  // 소상공인: 상시근로자 5인 미만
  if (employeeCount < 5) return 'startup';

  // 소기업: 상시근로자 50인 미만
  if (employeeCount < 50) return 'small';

  // 중기업: 상시근로자 300인 미만 또는 매출 400억 미만
  if (employeeCount < 300 || annualRevenue < 40000000000) return 'medium';

  return 'large';
}

/**
 * 카테고리 한글 이름
 */
export function getCategoryDisplayName(category: PolicyDocumentCategory): string {
  const names: Record<PolicyDocumentCategory, string> = {
    financialStatement: '표준재무제표증명',
    vatCertificate: '부가가치세과세표준증명',
    businessRegistration: '사업자등록증명',
    taxClearance: '납세증명서',
    insuranceList: '4대보험가입자명부',
  };
  return names[category];
}

/**
 * 초기 인증 상태
 */
export function getInitialCertifications(): Certifications {
  return {
    venture: false,
    innobiz: false,
    mainbiz: false,
    researchInstitute: false,
    patent: false,
    exportRecord: false,
    womenOwned: false,
    disabledOwned: false,
    iso: false,
  };
}

/**
 * 초기 사용자 입력
 */
export function getInitialUserInput(): UserInputData {
  return {
    fundPurpose: 'operating',
    requiredAmount: 1,
    industryType: 'manufacturing',
    isYoungCeo: false,
    existingLoanBalance: 0,
    certifications: getInitialCertifications(),
    hasTaxDelinquency: false,
    hasCreditIssue: false,
  };
}
