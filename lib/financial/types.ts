/**
 * 재무제표 분석을 위한 타입 정의
 */

// 재무상태표 (Balance Sheet)
export interface BalanceSheet {
  // 자산
  assets: {
    currentAssets: number;        // 유동자산
    nonCurrentAssets: number;     // 비유동자산
    totalAssets: number;          // 총자산
  };

  // 부채
  liabilities: {
    currentLiabilities: number;   // 유동부채
    nonCurrentLiabilities: number; // 비유동부채
    totalLiabilities: number;     // 총부채
  };

  // 자본
  equity: {
    capital: number;              // 자본금
    retainedEarnings: number;     // 이익잉여금
    totalEquity: number;          // 총자본
  };
}

// 손익계산서 (Income Statement)
export interface IncomeStatement {
  revenue: number;                // 매출액
  costOfSales: number;            // 매출원가
  grossProfit: number;            // 매출총이익
  operatingExpenses: number;      // 판매관리비
  operatingIncome: number;        // 영업이익
  nonOperatingIncome: number;     // 영업외수익
  nonOperatingExpenses: number;   // 영업외비용
  incomeBeforeTax: number;        // 법인세차감전순이익
  incomeTaxExpense: number;       // 법인세비용
  netIncome: number;              // 당기순이익
}

// 현금흐름표 (Cash Flow Statement)
export interface CashFlowStatement {
  operatingCashFlow: number;      // 영업활동 현금흐름
  investingCashFlow: number;      // 투자활동 현금흐름
  financingCashFlow: number;      // 재무활동 현금흐름
  netCashFlow: number;            // 순 현금흐름
}

// 전체 재무제표
export interface FinancialStatement {
  companyName: string;            // 기업명
  fiscalYear: number;             // 회계연도
  industry?: string;              // 업종
  balanceSheet: BalanceSheet;
  incomeStatement: IncomeStatement;
  cashFlowStatement?: CashFlowStatement;
}

// 재무 비율
export interface FinancialRatios {
  // 수익성 비율
  profitability: {
    grossProfitMargin: number;    // 매출총이익률 (%)
    operatingProfitMargin: number; // 영업이익률 (%)
    netProfitMargin: number;      // 순이익률 (%)
    roa: number;                  // 총자산이익률 (ROA, %)
    roe: number;                  // 자기자본이익률 (ROE, %)
  };

  // 안정성 비율
  stability: {
    currentRatio: number;         // 유동비율 (%)
    quickRatio: number;           // 당좌비율 (%)
    debtRatio: number;            // 부채비율 (%)
    debtToEquityRatio: number;    // 부채비율 (총부채/자기자본, %)
  };

  // 활동성 비율
  activity: {
    totalAssetTurnover: number;   // 총자산회전율 (회)
    inventoryTurnover?: number;   // 재고자산회전율 (회)
  };
}

// 재무 분석 결과
export interface FinancialAnalysis {
  statement: FinancialStatement;
  ratios: FinancialRatios;
  insights: AnalysisInsight[];
  grade: FinancialGrade;
}

// 분석 인사이트
export interface AnalysisInsight {
  type: 'success' | 'warning' | 'danger' | 'info';
  category: 'profitability' | 'stability' | 'activity' | 'growth';
  title: string;
  message: string;
  recommendation?: string;
}

// 재무 등급
export interface FinancialGrade {
  overall: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D';
  profitability: number;  // 0-100
  stability: number;      // 0-100
  activity: number;       // 0-100
}

// 업종별 기준값
export interface IndustryBenchmark {
  industry: string;
  ratios: {
    grossProfitMargin: { min: number; avg: number; max: number };
    operatingProfitMargin: { min: number; avg: number; max: number };
    debtRatio: { min: number; avg: number; max: number };
    currentRatio: { min: number; avg: number; max: number };
  };
}
