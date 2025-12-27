/**
 * Employment Grant (고용지원금) Types
 * 정부 고용지원금 매칭 분석 관련 타입 정의
 */

/**
 * 고용지원금 카테고리
 */
export type EmploymentGrantCategory =
  | 'youth-employment'       // 청년 고용
  | 'senior-employment'      // 장년/고령자 고용
  | 'disabled-employment'    // 장애인 고용
  | 'women-employment'       // 여성 고용
  | 'job-creation'           // 일자리 창출
  | 'work-life-balance'      // 일생활 균형
  | 'skill-training'         // 직업능력개발
  | 'employment-retention';  // 고용유지

/**
 * 적격성 레벨
 */
export type EligibilityLevel = 'eligible' | 'conditional' | 'ineligible';

/**
 * 고용지원금 프로그램
 */
export interface EmploymentGrantProgram {
  id: string;
  category: EmploymentGrantCategory;
  name: string;                       // 프로그램명
  description: string;                // 프로그램 설명

  // 지원 금액
  supportAmount: {
    min: number;                      // 최소 지원액 (월)
    max: number;                      // 최대 지원액 (월)
    unit: string;                     // 단위 (예: '원/월', '원/년')
  };
  supportDuration: string;            // 지원 기간 (예: '12개월')

  // 적격성 판단
  eligibility: EligibilityLevel;
  eligibilityScore: number;           // 적격성 점수 (0-100)
  matchedConditions: string[];        // 충족 조건
  missingConditions: string[];        // 미충족 조건

  // 신청 정보
  applicationPeriod: string;          // 신청 기간
  managingAgency: string;             // 관리 기관
  applicationMethod: string;          // 신청 방법
  requiredDocuments: string[];        // 필요 서류

  // 참고 링크
  detailUrl?: string;                 // 상세 안내 URL
}

/**
 * 직원 프로필 (입력 데이터)
 */
export interface EmployeeProfile {
  id: string;
  name?: string;                      // 이름 (선택)
  age: number;                        // 나이
  gender: 'male' | 'female';          // 성별
  hireDate: string;                   // 입사일 (YYYY-MM-DD)
  employmentType: 'regular' | 'contract' | 'parttime'; // 고용형태
  isDisabled?: boolean;               // 장애인 여부
  isVeteran?: boolean;                // 보훈대상자 여부
  education?: 'high-school' | 'college' | 'university' | 'graduate'; // 학력
  previousUnemploymentPeriod?: number; // 이전 실업 기간 (개월)
  salary?: number;                    // 급여 (월)
}

/**
 * 기업 프로필 (입력 데이터)
 */
export interface CompanyEmploymentProfile {
  companySize: 'small' | 'medium' | 'large'; // 기업 규모
  industry: string;                   // 업종
  totalEmployees: number;             // 총 직원 수
  newHiresLastYear?: number;          // 최근 1년 신규채용
  youthEmployeeCount?: number;        // 청년 직원 수
  seniorEmployeeCount?: number;       // 고령자 직원 수
  disabledEmployeeCount?: number;     // 장애인 직원 수
  womenEmployeeCount?: number;        // 여성 직원 수
  hasFlexibleWork?: boolean;          // 유연근무제 운영 여부
  hasChildcareSupport?: boolean;      // 육아지원제도 여부
  location?: string;                  // 소재지
}

/**
 * 고용지원금 분석 결과
 */
export interface EmploymentGrantAnalysis {
  // 매칭 프로그램 목록
  programs: EmploymentGrantProgram[];

  // 요약 통계
  summary: {
    totalPrograms: number;            // 총 프로그램 수
    eligiblePrograms: number;         // 적격 프로그램 수
    conditionalPrograms: number;      // 조건부 적격 프로그램 수
    maxAnnualGrant: number;           // 최대 연간 지원액
  };

  // 우선순위 프로그램 (상위 5개)
  prioritizedPrograms: EmploymentGrantProgram[];

  // 직원별 매칭 (상세 분석 시)
  employeeMatches?: {
    employeeId: string;
    employeeName?: string;
    matchedPrograms: string[];        // 매칭된 프로그램 ID
    estimatedGrant: number;           // 예상 지원액
  }[];

  // 권장사항
  recommendations: string[];

  // 분석 메타데이터
  metadata: {
    analyzedAt: Date;
    companyProfile: CompanyEmploymentProfile;
    employeeCount: number;
  };
}

/**
 * 고용지원금 가이드 (LLM 생성)
 */
export interface EmploymentGrantGuidance {
  programId: string;
  programName: string;
  applicationSteps: string[];         // 신청 절차
  checklist: string[];                // 체크리스트
  timeline: string;                   // 예상 일정
  tips: string[];                     // 신청 팁
  pitfalls: string[];                 // 주의사항
  contactInfo: string;                // 문의처
}

/**
 * 카테고리별 메타 정보
 */
export const EMPLOYMENT_GRANT_CATEGORY_INFO: Record<EmploymentGrantCategory, {
  name: string;
  description: string;
  icon: string;
  color: string;
}> = {
  'youth-employment': {
    name: '청년 고용 지원',
    description: '만 15-34세 청년 채용 시 지원',
    icon: '👨‍🎓',
    color: 'blue',
  },
  'senior-employment': {
    name: '장년/고령자 고용',
    description: '만 50세 이상 고령자 채용 시 지원',
    icon: '👴',
    color: 'orange',
  },
  'disabled-employment': {
    name: '장애인 고용',
    description: '장애인 의무고용 및 추가 고용 지원',
    icon: '♿',
    color: 'purple',
  },
  'women-employment': {
    name: '여성 고용',
    description: '경력단절여성 등 여성 채용 지원',
    icon: '👩',
    color: 'pink',
  },
  'job-creation': {
    name: '일자리 창출',
    description: '신규 일자리 창출 기업 지원',
    icon: '💼',
    color: 'green',
  },
  'work-life-balance': {
    name: '일생활 균형',
    description: '유연근무, 육아지원 등 제도 운영 지원',
    icon: '⚖️',
    color: 'teal',
  },
  'skill-training': {
    name: '직업능력개발',
    description: '직원 교육훈련 비용 지원',
    icon: '📚',
    color: 'indigo',
  },
  'employment-retention': {
    name: '고용유지',
    description: '경영위기 시 고용유지 지원',
    icon: '🛡️',
    color: 'yellow',
  },
};

/**
 * 고용지원금 프로그램 데이터베이스
 * ⚠️ 주의: 이 데이터는 데모용이며 실제 지원금 정보가 아닙니다.
 * 실제 운영 시에는 고용노동부 API를 통해 최신 데이터를 가져와야 합니다.
 * 데이터 출처: 고용노동부 홈페이지 (데모용 샘플)
 */
export const EMPLOYMENT_GRANT_PROGRAMS: Omit<EmploymentGrantProgram, 'eligibility' | 'eligibilityScore' | 'matchedConditions' | 'missingConditions'>[] = [
  {
    id: 'youth-job-growth',
    category: 'youth-employment',
    name: '청년일자리도약장려금',
    description: '만 15~34세 취업애로청년을 정규직으로 채용하고 6개월 이상 고용 유지 시 지원',
    supportAmount: { min: 600000, max: 1200000, unit: '원/월' },
    supportDuration: '최대 12개월',
    applicationPeriod: '상시',
    managingAgency: '고용노동부',
    applicationMethod: '고용24(www.work24.go.kr) 온라인 신청',
    requiredDocuments: ['사업자등록증', '근로계약서', '4대보험 가입증명', '임금대장'],
    detailUrl: 'https://www.work24.go.kr',
  },
  {
    id: 'youth-tomorrow-fund',
    category: 'youth-employment',
    name: '청년내일채움공제',
    description: '중소·중견기업 청년 정규직 2년 근속 시 1,200만원+ 자산 형성 지원',
    supportAmount: { min: 500000, max: 500000, unit: '원/월' },
    supportDuration: '2년',
    applicationPeriod: '상시',
    managingAgency: '중소벤처기업부',
    applicationMethod: '청년내일채움공제 홈페이지',
    requiredDocuments: ['사업자등록증', '근로계약서', '청년 본인 신청'],
    detailUrl: 'https://www.work.go.kr/youngtomorrow',
  },
  {
    id: 'senior-employment-incentive',
    category: 'senior-employment',
    name: '고령자 고용지원금',
    description: '만 60세 이상 고령자를 일정 비율 이상 고용하는 기업 지원',
    supportAmount: { min: 270000, max: 540000, unit: '원/분기' },
    supportDuration: '2년',
    applicationPeriod: '분기별 신청',
    managingAgency: '고용노동부',
    applicationMethod: '고용센터 방문 또는 온라인',
    requiredDocuments: ['사업자등록증', '재직자 명부', '4대보험 가입증명'],
    detailUrl: 'https://www.ei.go.kr',
  },
  {
    id: 'disabled-employment-incentive',
    category: 'disabled-employment',
    name: '장애인 고용장려금',
    description: '장애인 의무고용률(3.1%) 이상 고용 시 지원',
    supportAmount: { min: 300000, max: 800000, unit: '원/월' },
    supportDuration: '고용 기간 중',
    applicationPeriod: '분기별 신청',
    managingAgency: '한국장애인고용공단',
    applicationMethod: 'EDI 시스템 또는 공단 방문',
    requiredDocuments: ['사업자등록증', '장애인 근로자 명부', '급여대장'],
    detailUrl: 'https://www.kead.or.kr',
  },
  {
    id: 'career-break-women',
    category: 'women-employment',
    name: '경력단절여성 재취업 지원',
    description: '2년 이상 경력단절 여성을 채용한 기업 지원',
    supportAmount: { min: 300000, max: 600000, unit: '원/월' },
    supportDuration: '최대 12개월',
    applicationPeriod: '상시',
    managingAgency: '여성가족부',
    applicationMethod: '새일센터 경유 신청',
    requiredDocuments: ['사업자등록증', '근로계약서', '경력단절 확인서'],
    detailUrl: 'https://saeil.mogef.go.kr',
  },
  {
    id: 'job-creation-subsidy',
    category: 'job-creation',
    name: '일자리 창출 장려금',
    description: '전년 대비 근로자 수 순증 기업 지원',
    supportAmount: { min: 500000, max: 900000, unit: '원/월' },
    supportDuration: '최대 12개월',
    applicationPeriod: '연 2회',
    managingAgency: '고용노동부',
    applicationMethod: '고용센터 방문 또는 온라인',
    requiredDocuments: ['사업자등록증', '4대보험 가입자 명부', '전년도 대비 증가 증빙'],
    detailUrl: 'https://www.ei.go.kr',
  },
  {
    id: 'flexible-work-subsidy',
    category: 'work-life-balance',
    name: '유연근무제 간접노무비',
    description: '재택근무, 원격근무, 시차출퇴근 등 유연근무제 도입 기업 지원',
    supportAmount: { min: 100000, max: 300000, unit: '원/월/인' },
    supportDuration: '최대 12개월',
    applicationPeriod: '상시',
    managingAgency: '고용노동부',
    applicationMethod: '워라밸일자리장려금 시스템',
    requiredDocuments: ['유연근무제 규정', '활용 실적 증빙'],
    detailUrl: 'https://www.ei.go.kr',
  },
  {
    id: 'childcare-subsidy',
    category: 'work-life-balance',
    name: '육아휴직 지원금',
    description: '근로자 육아휴직 시 기업에 대체인력 인건비 지원',
    supportAmount: { min: 300000, max: 600000, unit: '원/월' },
    supportDuration: '육아휴직 기간',
    applicationPeriod: '상시',
    managingAgency: '고용노동부',
    applicationMethod: '고용보험 전산망',
    requiredDocuments: ['육아휴직 확인서', '대체인력 채용 증빙'],
    detailUrl: 'https://www.ei.go.kr',
  },
  {
    id: 'employment-retention',
    category: 'employment-retention',
    name: '고용유지지원금',
    description: '경영난으로 고용조정이 불가피한 상황에서 휴업, 휴직 등으로 고용 유지 시 지원',
    supportAmount: { min: 0, max: 0, unit: '휴업수당의 2/3' },
    supportDuration: '최대 180일',
    applicationPeriod: '상시 (위기 상황 발생 시)',
    managingAgency: '고용노동부',
    applicationMethod: '고용센터 방문 또는 온라인',
    requiredDocuments: ['휴업계획서', '고용조정계획서', '매출감소 증빙'],
    detailUrl: 'https://www.ei.go.kr',
  },
  {
    id: 'skill-training-subsidy',
    category: 'skill-training',
    name: '사업주 직업능력개발훈련 지원',
    description: '재직자 직무능력 향상 교육 비용 지원',
    supportAmount: { min: 0, max: 0, unit: '훈련비의 80-100%' },
    supportDuration: '훈련 기간',
    applicationPeriod: '상시',
    managingAgency: '고용노동부, 한국산업인력공단',
    applicationMethod: 'HRD-Net',
    requiredDocuments: ['훈련계획서', '훈련 실시 증빙'],
    detailUrl: 'https://www.hrd.go.kr',
  },
];
