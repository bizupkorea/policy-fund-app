'use client';

/**
 * 정책자금 요약 카드 컴포넌트
 *
 * 컨설턴트용 한눈에 파악하는 정책자금 요약 카드
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Banknote,
  Calendar,
  Building2,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DetailedMatchResult } from '@/lib/policy-fund/matching-engine';

export interface PolicySummaryCardProps {
  programName: string;
  agency: string;
  matchResult: DetailedMatchResult;
  deadline?: string;
  dDay?: number | null;
  supportAmount?: string;
  interestRate?: string;
  className?: string;
  onClick?: () => void;
}

export function PolicySummaryCard({
  programName,
  agency,
  matchResult,
  deadline,
  dDay,
  supportAmount,
  interestRate,
  className,
  onClick,
}: PolicySummaryCardProps) {
  const { score, level, isEligible, eligibilityReasons, ineligibilityReasons } = matchResult;

  // 등급별 스타일
  const levelStyles = {
    high: {
      badge: 'bg-green-100 text-green-800 border-green-200',
      progress: 'bg-green-500',
      label: '최적',
      stars: '★★★',
    },
    medium: {
      badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      progress: 'bg-yellow-500',
      label: '적합',
      stars: '★★☆',
    },
    low: {
      badge: 'bg-gray-100 text-gray-600 border-gray-200',
      progress: 'bg-gray-400',
      label: '검토필요',
      stars: '★☆☆',
    },
  };

  const style = levelStyles[level];

  // D-Day 스타일
  const getDDayStyle = (d: number) => {
    if (d <= 3) return 'text-red-600 bg-red-50';
    if (d <= 7) return 'text-orange-600 bg-orange-50';
    if (d <= 14) return 'text-yellow-600 bg-yellow-50';
    return 'text-blue-600 bg-blue-50';
  };

  return (
    <Card
      className={cn(
        'hover:shadow-lg transition-shadow cursor-pointer',
        !isEligible && 'opacity-75',
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">{programName}</CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <Building2 className="h-3 w-3" />
              {agency}
            </CardDescription>
          </div>
          <Badge variant="outline" className={cn('ml-2', style.badge)}>
            {style.stars} {style.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 적합도 점수 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">적합도</span>
            <span className="font-semibold">{score}점</span>
          </div>
          <Progress value={score} className="h-2" />
        </div>

        {/* 핵심 요약 */}
        <div className="grid grid-cols-2 gap-3">
          {/* 지원 금액 */}
          {supportAmount && (
            <div className="flex items-center gap-2 text-sm">
              <Banknote className="h-4 w-4 text-green-600" />
              <span>{supportAmount}</span>
            </div>
          )}

          {/* 금리 */}
          {interestRate && (
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span>{interestRate}</span>
            </div>
          )}

          {/* 마감일 */}
          {dDay !== null && dDay !== undefined && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-orange-600" />
              <Badge
                variant="secondary"
                className={cn('text-xs', getDDayStyle(dDay))}
              >
                D-{dDay > 0 ? dDay : '마감'}
              </Badge>
            </div>
          )}

          {/* 마감일 텍스트 */}
          {deadline && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{deadline}</span>
            </div>
          )}
        </div>

        {/* 적합/불가 사유 */}
        <div className="space-y-2">
          {isEligible ? (
            <>
              {eligibilityReasons.slice(0, 2).map((reason, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 text-sm text-green-700"
                >
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{reason}</span>
                </div>
              ))}
            </>
          ) : (
            <>
              {ineligibilityReasons.slice(0, 2).map((reason, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 text-sm text-red-600"
                >
                  <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{reason}</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* 불가 상태 표시 */}
        {!isEligible && (
          <div className="flex items-center gap-2 p-2 bg-red-50 rounded-md">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700">자격 조건 미충족</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PolicySummaryCard;
