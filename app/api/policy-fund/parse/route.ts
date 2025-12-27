/**
 * POST /api/policy-fund/parse
 *
 * PDF 파싱 API
 * Python 파서 서비스를 호출하여 정책자금 공고 PDF를 파싱
 */

import { NextRequest, NextResponse } from 'next/server';
import { parsePdf, parsePdfFromUrl } from '@/lib/api/parser-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // URL 기반 파싱
    if (body.url) {
      const result = await parsePdfFromUrl({
        url: body.url,
        timeout: body.timeout || 20,
      });

      return NextResponse.json({
        success: result.success,
        data: result.data,
        confidence: result.confidence,
        method: result.method,
        tables_found: result.tables_found,
        text_length: result.text_length,
        processing_time: result.processing_time,
        errors: result.errors,
      });
    }

    // Base64 파일 기반 파싱
    const { fileBase64, fileName } = body;

    if (!fileBase64 || !fileName) {
      return NextResponse.json(
        { success: false, error: '파일 정보가 필요합니다.' },
        { status: 400 }
      );
    }

    // Python 파서 서비스 호출
    const result = await parsePdf({
      fileBase64,
      fileName,
      timeout: body.timeout || 20000,
    });

    return NextResponse.json({
      success: result.success,
      data: result.data,
      confidence: result.confidence,
      method: result.method,
      tables_found: result.tables_found,
      text_length: result.text_length,
      processing_time: result.processing_time,
      errors: result.errors,
    });
  } catch (error) {
    console.error('Parse API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'PDF 파싱에 실패했습니다.',
      },
      { status: 500 }
    );
  }
}
