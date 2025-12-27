/**
 * Python Parser Service Client
 *
 * Python 마이크로서비스와 통신하는 클라이언트
 * 정책자금 공고 PDF 파싱 및 크롤링 데이터 조회
 */

const PARSER_SERVICE_URL =
  process.env.PARSER_SERVICE_URL || 'http://localhost:8000';
const PARSE_TIMEOUT = 20000; // 20초

// ============================================================================
// Types
// ============================================================================

export interface ParseRequest {
  fileBase64: string;
  fileName: string;
  timeout?: number;
}

export interface ParseUrlRequest {
  url: string;
  timeout?: number;
}

export type ParseMethod =
  | 'pdfplumber'
  | 'text'
  | 'ocr'
  | 'hwpx_xml'
  | 'hwp_olefile'
  | 'hwp_libreoffice'
  | 'gemini'
  | 'failed';

export interface ParsedPolicyData {
  // 기본 정보
  title?: string;
  agency?: string;

  // 신청 기간
  application_start?: string;
  application_end?: string;

  // 지원 금액
  support_amount_min?: number;
  support_amount_max?: number;
  support_amount_unit?: string;
  support_description?: string;

  // 금리/상환
  interest_rate_min?: number;
  interest_rate_max?: number;
  repayment_period?: string;
  grace_period?: string;

  // 조건 분해 필드
  business_age_min?: number;
  business_age_max?: number;
  business_age_condition?: string;

  revenue_min?: number;
  revenue_max?: number;
  revenue_condition?: string;

  employee_min?: number;
  employee_max?: number;
  employee_condition?: string;

  allowed_industries?: string[];
  excluded_industries?: string[];

  allowed_regions?: string[];
  excluded_regions?: string[];

  exclusion_conditions?: string[];

  // 기타
  eligibility?: string[];
  required_documents?: string[];
  evaluation_criteria?: string[];

  // 연락처
  contact_phone?: string;
  contact_email?: string;
  contact_website?: string;

  // 원본 데이터
  raw_text?: string;
}

export interface ParseResponse {
  success: boolean;
  data: ParsedPolicyData;
  confidence: number;
  method: ParseMethod;
  tables_found: number;
  text_length: number;
  processing_time: number;
  errors?: string[];
}

export interface Attachment {
  filename: string;
  url: string;
  size?: number;
  ext: string;
}

export interface SelectFileResponse {
  selected: Attachment | null;
  message: string;
}

export interface Announcement {
  id: string;
  external_id: string;
  source: string;
  title: string;
  agency?: string;
  detail_url?: string;
  pdf_url?: string;
  application_start?: string;
  application_end?: string;
  category?: string;
  status: 'new' | 'updated' | 'extended' | 'closed' | 'deleted';
  content_hash?: string;
  crawled_at: string;
}

export interface AnnouncementListResponse {
  success: boolean;
  total: number;
  announcements: Announcement[];
  from_cache: boolean;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  services: Record<string, string>;
  timestamp: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * PDF 파싱 요청 (파일 업로드)
 */
export async function parsePdf(request: ParseRequest): Promise<ParseResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    request.timeout || PARSE_TIMEOUT
  );

  try {
    // Base64 -> Blob 변환
    const blob = base64ToBlob(request.fileBase64, 'application/pdf');
    const formData = new FormData();
    formData.append('file', blob, request.fileName);

    const response = await fetch(`${PARSER_SERVICE_URL}/api/v1/parse/pdf`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Parser service error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        data: {},
        confidence: 0,
        method: 'failed',
        tables_found: 0,
        text_length: 0,
        processing_time: 0,
        errors: ['Parsing timeout exceeded'],
      };
    }

    // 서비스 다운 시 폴백: Gemini로 파싱
    console.warn('Parser service unavailable, falling back to Gemini');
    return await fallbackToGemini(request);
  }
}

/**
 * URL에서 PDF 다운로드 후 파싱
 */
export async function parsePdfFromUrl(
  request: ParseUrlRequest
): Promise<ParseResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    (request.timeout || PARSE_TIMEOUT) + 10000 // 다운로드 시간 추가
  );

  try {
    const response = await fetch(`${PARSER_SERVICE_URL}/api/v1/parse/url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: request.url,
        timeout: request.timeout || 20,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Parser service error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    console.error('Parse from URL failed:', error);
    return {
      success: false,
      data: {},
      confidence: 0,
      method: 'failed',
      tables_found: 0,
      text_length: 0,
      processing_time: 0,
      errors: [
        error instanceof Error ? error.message : 'Unknown error',
      ],
    };
  }
}

/**
 * 첨부파일 중 파싱할 파일 선택
 */
export async function selectBestFile(
  attachments: Attachment[]
): Promise<SelectFileResponse> {
  try {
    const response = await fetch(`${PARSER_SERVICE_URL}/api/v1/select-file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ attachments }),
    });

    if (!response.ok) {
      throw new Error(`Select file error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Select file failed:', error);

    // 로컬 폴백: 직접 선택 로직
    return selectBestFileLocal(attachments);
  }
}

/**
 * 크롤링된 공고 목록 조회
 */
export async function getAnnouncements(params: {
  source?: string;
  limit?: number;
  offset?: number;
}): Promise<AnnouncementListResponse> {
  const queryParams = new URLSearchParams();
  if (params.source) queryParams.append('source', params.source);
  if (params.limit) queryParams.append('limit', String(params.limit));
  if (params.offset) queryParams.append('offset', String(params.offset));

  try {
    const response = await fetch(
      `${PARSER_SERVICE_URL}/api/v1/announcements?${queryParams.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Announcements API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Get announcements failed:', error);
    return {
      success: false,
      total: 0,
      announcements: [],
      from_cache: false,
    };
  }
}

/**
 * 서비스 헬스 체크
 */
export async function checkParserHealth(): Promise<HealthResponse | null> {
  try {
    const response = await fetch(`${PARSER_SERVICE_URL}/api/v1/health`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}

/**
 * 파서 서비스 가용 여부 확인
 */
export async function isParserServiceAvailable(): Promise<boolean> {
  const health = await checkParserHealth();
  return health?.status === 'healthy' || health?.status === 'degraded';
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Base64 -> Blob 변환
 */
function base64ToBlob(base64: string, mimeType: string): Blob {
  // data:application/pdf;base64, 접두사 제거
  const base64Data = base64.replace(/^data:[^;]+;base64,/, '');

  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * 로컬 파일 선택 폴백 (서비스 장애 시)
 */
function selectBestFileLocal(attachments: Attachment[]): SelectFileResponse {
  if (!attachments || attachments.length === 0) {
    return { selected: null, message: 'No attachments provided' };
  }

  // PDF 우선
  const pdfFile = attachments.find((f) =>
    f.ext.toLowerCase() === '.pdf' || f.filename.toLowerCase().endsWith('.pdf')
  );
  if (pdfFile) {
    return { selected: pdfFile, message: 'Selected PDF file' };
  }

  // HWPX 다음
  const hwpxFile = attachments.find((f) =>
    f.ext.toLowerCase() === '.hwpx' || f.filename.toLowerCase().endsWith('.hwpx')
  );
  if (hwpxFile) {
    return { selected: hwpxFile, message: 'Selected HWPX file' };
  }

  // HWP 마지막
  const hwpFile = attachments.find((f) =>
    f.ext.toLowerCase() === '.hwp' || f.filename.toLowerCase().endsWith('.hwp')
  );
  if (hwpFile) {
    return { selected: hwpFile, message: 'Selected HWP file' };
  }

  return { selected: null, message: 'No parseable files found' };
}

/**
 * Gemini 폴백 (서비스 장애 시)
 */
async function fallbackToGemini(request: ParseRequest): Promise<ParseResponse> {
  try {
    // 기존 document-analyzer 활용
    const { analyzeDocumentsUnified } = await import(
      '@/lib/policy-fund/document-analyzer'
    );

    const result = await analyzeDocumentsUnified([
      {
        base64: request.fileBase64,
        fileName: request.fileName,
      },
    ]);

    return {
      success: true,
      data: {
        title: result.companyName,
        raw_text: 'Parsed via Gemini fallback',
      },
      confidence: (result.confidence || 0.5) * 100,
      method: 'gemini',
      tables_found: 0,
      text_length: 0,
      processing_time: 0,
    };
  } catch (error) {
    console.error('Gemini fallback failed:', error);
    return {
      success: false,
      data: {},
      confidence: 0,
      method: 'failed',
      tables_found: 0,
      text_length: 0,
      processing_time: 0,
      errors: ['Both parser service and Gemini fallback failed'],
    };
  }
}
