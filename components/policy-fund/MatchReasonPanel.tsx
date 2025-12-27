'use client';

/**
 * 매칭 사유 패널 컴포넌트
 *
 * 적합/불가 사유를 상세히 보여주는 컴포넌트
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
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { DetailedMatchResult } from '@/lib/policy-fund/matching-engine';

export interface MatchReasonPanelProps {
  programName: string;
  matchResult: DetailedMatchResult;
  showFullDetails?: boolean;
  className?: string;
}

export function MatchReasonPanel({
  programName,
  matchResult,
  showFullDetails = false,
  className,
}: MatchReasonPanelProps) {
  const [isOpen, setIsOpen] = React.useState(showFullDetails);

  const { score, level, isEligible, eligibilityReasons, ineligibilityReasons, supportDetails, warnings } = matchResult;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{programName}</CardTitle>
            <CardDescription>매칭 분석 결과</CardDescription>
          </div>
          <div className="text-right">
            <Badge
              variant={isEligible ? 'default' : 'destructive'}
              className="text-sm"
            >
              {isEligible ? '신청 가능' : '신청 불가'}
            </Badge>
            <div className="text-2xl font-bold mt-1">{score}점</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 지원 상세 정보 */}
        {supportDetails && (supportDetails.amount || supportDetails.interestRate) && (
          <>
            <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
              {supportDetails.amount && (
                <div>
                  <div className="text-xs text-muted-foreground">지원 금액</div>
                  <div className="font-semibold">{supportDetails.amount}</div>
                </div>
              )}
              {supportDetails.interestRate && (
                <div>
                  <div className="text-xs text-muted-foreground">금리</div>
                  <div className="font-semibold">{supportDetails.interestRate}</div>
                </div>
              )}
            </div>
            <Separator />
          </>
        )}

        {/* 적합 사유 */}
        {eligibilityReasons.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              충족 조건 ({eligibilityReasons.length}개)
            </h4>
            <ul className="space-y-1.5">
              {eligibilityReasons.map((reason, idx) => (
                <li
                  key={idx}
                  className="text-sm flex items-start gap-2 text-green-600"
                >
                  <span className="text-green-400 mt-1">✓</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 불가 사유 */}
        {ineligibilityReasons.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2 text-red-700">
              <XCircle className="h-4 w-4" />
              미충족 조건 ({ineligibilityReasons.length}개)
            </h4>
            <ul className="space-y-1.5">
              {ineligibilityReasons.map((reason, idx) => (
                <li
                  key={idx}
                  className="text-sm flex items-start gap-2 text-red-600"
                >
                  <span className="text-red-400 mt-1">✗</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 경고 사항 */}
        {warnings && warnings.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              주의 사항
            </h4>
            <ul className="space-y-1.5">
              {warnings.map((warning, idx) => (
                <li
                  key={idx}
                  className="text-sm flex items-start gap-2 text-amber-600"
                >
                  <span className="text-amber-400 mt-1">!</span>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 상세 보기 토글 */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full">
              {isOpen ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  간략히 보기
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  상세 분석 보기
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <div className="p-4 bg-muted/30 rounded-lg space-y-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 text-blue-500" />
                <div className="text-sm">
                  <p className="font-medium mb-1">분석 정보</p>
                  <p className="text-muted-foreground">
                    본 분석 결과는 공고 문서 파싱 데이터를 기반으로 합니다.
                    실제 신청 자격은 해당 기관의 심사에 따라 결정됩니다.
                  </p>
                </div>
              </div>

              {!isEligible && (
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium mb-2">다음 단계 제안:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 다른 적합한 정책자금을 확인해 보세요</li>
                    <li>• 조건 변경 후 재검토가 가능한지 확인하세요</li>
                    <li>• 해당 기관에 직접 문의하여 예외 사항을 확인하세요</li>
                  </ul>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

export default MatchReasonPanel;
