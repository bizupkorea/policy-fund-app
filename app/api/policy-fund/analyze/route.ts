/**
 * Policy Fund Document Analyze API
 *
 * PDF 문서에서 기업 정보를 추출하는 API
 *
 * POST /api/policy-fund/analyze
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeDocumentsUnified } from '@/lib/policy-fund/document-analyzer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { documents } = body as {
      documents: Array<{ base64: string; fileName: string }>;
    };

    // 필수 필드 검증
    if (!documents || documents.length === 0) {
      return NextResponse.json(
        { success: false, error: '분석할 문서가 없습니다.' },
        { status: 400 }
      );
    }

    // 문서 개수 제한 (최대 5개)
    if (documents.length > 5) {
      return NextResponse.json(
        { success: false, error: '최대 5개의 문서만 분석할 수 있습니다.' },
        { status: 400 }
      );
    }

    // base64 유효성 검사
    for (const doc of documents) {
      if (!doc.base64 || doc.base64.length === 0) {
        return NextResponse.json(
          { success: false, error: `파일 "${doc.fileName}"의 데이터가 비어있습니다.` },
          { status: 400 }
        );
      }
    }

    console.log(`📄 ${documents.length}개 문서 분석 요청`);

    // Gemini API를 사용하여 문서 분석
    const extractedData = await analyzeDocumentsUnified(documents);

    console.log('✅ 문서 분석 완료:', {
      companyName: extractedData.companyName,
      businessNumber: extractedData.businessNumber,
      confidence: extractedData.confidence,
    });

    return NextResponse.json({
      success: true,
      data: extractedData,
    });
  } catch (error) {
    console.error('❌ Document analysis error:', error);

    const errorMessage = error instanceof Error ? error.message : '문서 분석에 실패했습니다.';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
