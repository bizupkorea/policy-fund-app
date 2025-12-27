/**
 * File Validator
 * 업로드된 파일 검증 및 분석 모드 탐지
 */

// ============================================================================
// 타입 정의
// ============================================================================

/**
 * 문서 카테고리
 */
export type DocumentCategory = 'balanceSheet' | 'incomeStatement' | 'cretopReport';

/**
 * 분석 모드
 * - combined: 재무제표 + 손익계산서 통합 분석
 * - cretopReport: 크레탑(CRETOP) 종합보고서 분석
 */
export type AnalysisMode = 'combined' | 'cretopReport';

/**
 * 카테고리별 파일 정보
 */
export interface CategorizedFile {
  file: File;
  category: DocumentCategory;
  base64?: string; // 변환 후 저장
}

/**
 * 업로드된 파일 구조
 */
export interface UploadedFiles {
  balanceSheet: CategorizedFile[];
  incomeStatement: CategorizedFile[];
  cretopReport: CategorizedFile[];
}

/**
 * 검증 결과
 */
export interface ValidationResult {
  isValid: boolean;
  mode: AnalysisMode | null;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// 카테고리 이름 헬퍼
// ============================================================================

/**
 * 카테고리 한글 이름
 */
export function getCategoryName(category: DocumentCategory): string {
  const names: Record<DocumentCategory, string> = {
    balanceSheet: '재무상태표',
    incomeStatement: '손익계산서',
    cretopReport: '크레탑 종합보고서',
  };
  return names[category];
}

/**
 * 모드 한글 이름
 */
export function getModeName(mode: AnalysisMode): string {
  const names: Record<AnalysisMode, string> = {
    combined: '재무제표 + 손익계산서 통합 분석',
    cretopReport: '크레탑 종합보고서 분석',
  };
  return names[mode];
}

/**
 * 모드 설명
 */
export function getModeDescription(mode: AnalysisMode): string {
  const descriptions: Record<AnalysisMode, string> = {
    combined: '재무상태표와 손익계산서를 통합하여 기업의 재무 건전성, 수익성, 안정성을 종합 분석합니다.',
    cretopReport: '크레탑(CRETOP) 종합보고서를 분석하여 재무제표, 손익계산서, 신용등급, 리스크 요인을 종합적으로 평가합니다.',
  };
  return descriptions[mode];
}

// ============================================================================
// 검증 함수
// ============================================================================

/**
 * Mode A (통합 분석) 가능 여부 확인
 */
export function isModeCombinedValid(files: UploadedFiles): boolean {
  return files.balanceSheet.length > 0 && files.incomeStatement.length > 0;
}

/**
 * Mode B (크레탑 종합보고서 분석) 가능 여부 확인
 */
export function isModeCretopReportValid(files: UploadedFiles): boolean {
  return files.cretopReport.length > 0;
}

/**
 * 가능한 분석 모드 탐지
 */
export function detectAvailableModes(files: UploadedFiles): AnalysisMode[] {
  const modes: AnalysisMode[] = [];

  if (isModeCombinedValid(files)) {
    modes.push('combined');
  }

  if (isModeCretopReportValid(files)) {
    modes.push('cretopReport');
  }

  return modes;
}

/**
 * 업로드된 파일 전체 검증
 */
export function validateUploadedFiles(files: UploadedFiles): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const availableModes = detectAvailableModes(files);

  // 아무 파일도 없는 경우
  const totalFiles =
    files.balanceSheet.length +
    files.incomeStatement.length +
    files.cretopReport.length;

  if (totalFiles === 0) {
    errors.push('최소 1개 이상의 파일을 업로드해주세요.');
    return {
      isValid: false,
      mode: null,
      errors,
      warnings,
    };
  }

  // 모드가 하나도 활성화되지 않는 경우
  if (availableModes.length === 0) {
    errors.push(
      '분석 가능한 파일 조합이 아닙니다. 아래 조건 중 하나를 만족해야 합니다:'
    );
    errors.push('  • 재무제표 + 손익계산서 (통합 분석)');
    errors.push('  • 크레탑 종합보고서 (단독 분석)');

    return {
      isValid: false,
      mode: null,
      errors,
      warnings,
    };
  }

  // 재무제표만 있거나 손익계산서만 있는 경우 경고
  if (files.balanceSheet.length > 0 && files.incomeStatement.length === 0) {
    warnings.push('재무제표만 있습니다. 손익계산서를 추가하면 통합 분석이 가능합니다.');
  }

  if (files.incomeStatement.length > 0 && files.balanceSheet.length === 0) {
    warnings.push('손익계산서만 있습니다. 재무제표를 추가하면 통합 분석이 가능합니다.');
  }

  // 모든 카테고리가 있는 경우 정보 제공
  if (availableModes.length === 2) {
    warnings.push('두 가지 분석 모드를 모두 사용할 수 있습니다. 원하는 모드를 선택하세요.');
  }

  return {
    isValid: true,
    mode: availableModes.length === 1 ? availableModes[0] : null,
    errors,
    warnings,
  };
}

/**
 * 검증 결과를 사용자 친화적인 메시지로 변환
 */
export function getValidationMessages(result: ValidationResult): string[] {
  const messages: string[] = [];

  // 에러 메시지
  if (result.errors.length > 0) {
    messages.push(...result.errors);
  }

  // 경고 메시지
  if (result.warnings.length > 0) {
    messages.push(...result.warnings);
  }

  // 성공 메시지
  if (result.isValid && result.mode) {
    messages.push(`✓ ${getModeName(result.mode)} 준비 완료`);
  }

  return messages;
}

/**
 * 파일 크기 검증 (MB 단위)
 */
export function validateFileSize(file: File, maxSizeMB: number = 20): boolean {
  const fileSizeMB = file.size / 1024 / 1024;
  return fileSizeMB <= maxSizeMB;
}

/**
 * 파일 형식 검증
 */
export function validateFileFormat(
  file: File,
  acceptedFormats: string[] = ['.pdf']
): boolean {
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  return acceptedFormats.includes(fileExtension);
}

/**
 * 업로드된 파일 개수 확인
 */
export function getTotalFileCount(files: UploadedFiles): number {
  return (
    files.balanceSheet.length +
    files.incomeStatement.length +
    files.cretopReport.length
  );
}

/**
 * 특정 카테고리의 파일 개수 확인
 */
export function getCategoryFileCount(
  files: UploadedFiles,
  category: DocumentCategory
): number {
  return files[category].length;
}
