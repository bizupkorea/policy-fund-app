/**
 * 컨설팅 스크립트 파싱 유틸리티
 *
 * LLM이 생성한 fullScript를 파싱하여 구조화된 데이터로 변환
 */

export interface ParsedScriptSection {
  title: string;
  content: string[];
}

export interface ParsedScript {
  intro: string;
  sections: ParsedScriptSection[];
  closing: string;
}

/**
 * 컨설팅 스크립트를 파싱하여 구조화
 */
export function parseConsultingScript(fullScript: string): ParsedScript {
  if (!fullScript) {
    return { intro: '', sections: [], closing: '' };
  }

  // 우선 Markdown 형식(## 섹션명)을 찾음
  const markdownPattern = /^##\s+(.+)$/gm;
  const matches: Array<{ title: string; index: number }> = [];
  let match;

  while ((match = markdownPattern.exec(fullScript)) !== null) {
    const title = match[1].trim();
    matches.push({ title, index: match.index });
  }

  // Markdown 섹션이 없으면 기존 패턴으로 시도: [섹션명] 또는 **섹션명:**
  if (matches.length === 0) {
    const sectionPattern = /\[([^\]]+)\]|^\*\*([^*]+):\*\*$/gm;
    while ((match = sectionPattern.exec(fullScript)) !== null) {
      const title = match[1] || match[2];
      matches.push({ title: title.trim(), index: match.index });
    }
  }

  // 섹션별로 텍스트 추출
  if (matches.length === 0) {
    // 섹션 구분이 없는 경우, 전체를 하나의 섹션으로
    return parseUnstructuredScript(fullScript);
  }

  // 첫 번째 섹션 이전 텍스트 (인트로)
  let intro = fullScript.substring(0, matches[0].index).trim();
  intro = cleanMarkdownText(intro);

  // 각 섹션 추출
  const sections: ParsedScriptSection[] = [];
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const nextIndex = i < matches.length - 1 ? matches[i + 1].index : fullScript.length;

    let sectionText = fullScript.substring(current.index, nextIndex);

    // 섹션 헤더 제거 (## 섹션명 또는 [섹션명])
    sectionText = sectionText.replace(/^##\s+.+$/m, '').trim();
    sectionText = sectionText.replace(/\[([^\]]+)\]|^\*\*([^*]+):\*\*$/gm, '').trim();

    // Markdown 포맷팅 정리
    sectionText = cleanMarkdownText(sectionText);

    // 중간 섹션의 인사말 제거 (첫 섹션 제외)
    if (i > 0) {
      sectionText = removeGreetings(sectionText);
    }

    // 문단으로 분리
    const paragraphs = sectionText
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 0 && p !== '---'); // 구분선 제거

    sections.push({
      title: current.title,
      content: paragraphs,
    });
  }

  // 마무리 인사 추출 (마지막 섹션의 마지막 문단이 "감사합니다" 등으로 끝나면)
  let closing = '';
  if (sections.length > 0) {
    const lastSection = sections[sections.length - 1];
    const lastParagraph = lastSection.content[lastSection.content.length - 1];

    if (isClosingGreeting(lastParagraph)) {
      closing = lastParagraph;
      lastSection.content.pop();
    }
  }

  return { intro, sections, closing };
}

/**
 * 구조화되지 않은 스크립트 파싱
 */
function parseUnstructuredScript(fullScript: string): ParsedScript {
  const paragraphs = fullScript
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  if (paragraphs.length === 0) {
    return { intro: '', sections: [], closing: '' };
  }

  // 첫 문단이 인사말이면 intro로
  let intro = '';
  let startIdx = 0;
  if (isGreeting(paragraphs[0])) {
    intro = paragraphs[0];
    startIdx = 1;
  }

  // 마지막 문단이 마무리 인사면 closing으로
  let closing = '';
  let endIdx = paragraphs.length;
  if (isClosingGreeting(paragraphs[paragraphs.length - 1])) {
    closing = paragraphs[paragraphs.length - 1];
    endIdx--;
  }

  // 나머지는 하나의 섹션으로
  const sections: ParsedScriptSection[] = [
    {
      title: '분석 내용',
      content: paragraphs.slice(startIdx, endIdx),
    },
  ];

  return { intro, sections, closing };
}

/**
 * Markdown 텍스트 정리
 */
function cleanMarkdownText(text: string): string {
  // # 제목 마커 제거 (### 제목 -> 제목)
  text = text.replace(/^###\s+/gm, '');
  text = text.replace(/^##\s+/gm, '');
  text = text.replace(/^#\s+/gm, '');

  // 구조적 레이블만 제거 (일반 Bold는 보존)
  text = text.replace(/^\*\*(문제 제기|현재 상황|현재 상황 및 분석|솔루션|권장 조치|기대 효과|실행 단계):\*\*\s*/gm, '');

  // 중간에 나오는 구조 레이블도 제거
  text = text.replace(/\*\*(문제 제기|현재 상황|현재 상황 및 분석|솔루션|권장 조치|기대 효과|실행 단계):\*\*\s*/g, '');

  // 구분선 제거
  text = text.replace(/^---+$/gm, '');

  // "도입:" 레이블 제거
  text = text.replace(/^\*\*도입:\*\*\s*/gm, '');
  text = text.replace(/^도입:\s*/gm, '');

  // 일반 Bold (**중요 텍스트**)는 유지 (제거 코드 삭제됨)

  return text.trim();
}

/**
 * 인트로 텍스트 정리 (하위 호환성 유지)
 */
function cleanIntroText(text: string): string {
  return cleanMarkdownText(text);
}

/**
 * 인사말 제거
 */
function removeGreetings(text: string): string {
  const greetingPatterns = [
    /^안녕하십니까[.。]?\s*/gm,
    /^안녕하세요[.。]?\s*/gm,
    /^반갑습니다[.。]?\s*/gm,
  ];

  for (const pattern of greetingPatterns) {
    text = text.replace(pattern, '');
  }

  return text.trim();
}

/**
 * 인사말 여부 확인
 */
function isGreeting(text: string): boolean {
  const greetingPatterns = [
    /^안녕하십니까/,
    /^안녕하세요/,
    /^반갑습니다/,
  ];

  return greetingPatterns.some(pattern => pattern.test(text));
}

/**
 * 마무리 인사 여부 확인
 */
function isClosingGreeting(text: string): boolean {
  const closingPatterns = [
    /감사합니다[.。]?\s*$/,
    /고맙습니다[.。]?\s*$/,
    /이상입니다[.。]?\s*$/,
  ];

  return closingPatterns.some(pattern => pattern.test(text));
}
