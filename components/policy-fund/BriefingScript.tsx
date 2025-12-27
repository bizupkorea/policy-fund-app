'use client';

/**
 * 브리핑 스크립트 컴포넌트
 *
 * 컨설턴트가 고객에게 설명할 때 사용하는 브리핑 스크립트
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Copy,
  FileText,
  MessageSquare,
  Printer,
  Share2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ExtendedCompanyProfile,
  DetailedMatchResult,
  generateBriefingScript,
} from '@/lib/policy-fund/matching-engine';
import { useToast } from '@/hooks/use-toast';

export interface BriefingScriptProps {
  company: ExtendedCompanyProfile;
  matchResults: DetailedMatchResult[];
  programNames?: string[];
  className?: string;
  onRegenerate?: () => void;
}

export function BriefingScript({
  company,
  matchResults,
  programNames = [],
  className,
  onRegenerate,
}: BriefingScriptProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState('full');

  // 브리핑 스크립트 생성
  const fullScript = React.useMemo(
    () => generateBriefingScript(company, matchResults, 3),
    [company, matchResults]
  );

  // 간략 버전 생성
  const shortScript = React.useMemo(() => {
    const eligibleCount = matchResults.filter((r) => r.isEligible).length;
    const topMatch = matchResults
      .filter((r) => r.isEligible)
      .sort((a, b) => b.score - a.score)[0];

    if (!topMatch) {
      return `${company.industry} 업종, 업력 ${company.businessAge}년 기업입니다.\n현재 적합한 정책자금을 찾지 못했습니다.`;
    }

    return `${company.industry} 업종, 업력 ${company.businessAge}년 기업입니다.
${matchResults.length}개 정책자금 중 ${eligibleCount}개 적합.
최고 적합도: ${topMatch.score}점`;
  }, [company, matchResults]);

  // 클립보드 복사
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: '복사 완료',
        description: '브리핑 스크립트가 클립보드에 복사되었습니다.',
      });
    } catch {
      toast({
        title: '복사 실패',
        description: '클립보드 복사에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  // 인쇄
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>정책자금 브리핑 - ${company.industry}</title>
            <style>
              body { font-family: 'Malgun Gothic', sans-serif; padding: 20px; }
              pre { white-space: pre-wrap; font-family: inherit; }
              .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
              .footer { margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #ccc; padding-top: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>정책자금 매칭 브리핑</h1>
              <p>생성일: ${new Date().toLocaleDateString('ko-KR')}</p>
            </div>
            <pre>${fullScript}</pre>
            <div class="footer">
              ※ 본 분석 결과는 참고용이며, 실제 신청 자격은 해당 기관에서 최종 확인됩니다.
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const eligibleCount = matchResults.filter((r) => r.isEligible).length;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              컨설턴트 브리핑 스크립트
            </CardTitle>
            <CardDescription>
              고객 상담 시 활용할 수 있는 브리핑 자료
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              적합 {eligibleCount}/{matchResults.length}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="full">
              <FileText className="h-4 w-4 mr-2" />
              전체 스크립트
            </TabsTrigger>
            <TabsTrigger value="short">
              <MessageSquare className="h-4 w-4 mr-2" />
              간략 버전
            </TabsTrigger>
          </TabsList>

          <TabsContent value="full" className="mt-4">
            <div className="relative">
              <pre className="p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap font-sans leading-relaxed max-h-[400px] overflow-y-auto">
                {fullScript}
              </pre>
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(fullScript)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="short" className="mt-4">
            <div className="relative">
              <pre className="p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap font-sans leading-relaxed">
                {shortScript}
              </pre>
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(shortScript)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* 법적 고지 */}
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800">
            ※ 본 분석 결과는 정보 제공 목적으로만 사용되며, 실제 정책자금 신청
            가능 여부는 해당 기관의 심사에 따라 결정됩니다. 최종 판단은 관할
            기관에서 이루어집니다.
          </p>
        </div>
      </CardContent>

      <Separator />

      <CardFooter className="flex justify-between pt-4">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => copyToClipboard(activeTab === 'full' ? fullScript : shortScript)}>
            <Copy className="h-4 w-4 mr-2" />
            복사
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            인쇄
          </Button>
        </div>
        {onRegenerate && (
          <Button variant="secondary" size="sm" onClick={onRegenerate}>
            <RefreshCw className="h-4 w-4 mr-2" />
            재생성
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default BriefingScript;
