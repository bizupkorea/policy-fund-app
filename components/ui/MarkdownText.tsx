import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * MarkdownText
 * 마크다운 텍스트를 렌더링하는 컴포넌트
 */

interface MarkdownTextProps {
  children: string;
  className?: string;
}

/**
 * 간단한 마크다운 변환 함수 (fallback)
 * react-markdown 로드 실패 시 기본 변환
 */
function simpleMarkdownToHtml(markdown: string): string {
  if (!markdown) return '';

  return markdown
    // Bold: **text** or __text__
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    .replace(/__(.+?)__/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    // Italic: *text* or _text_
    .replace(/\*(.+?)\*/g, '<em class="italic text-gray-800">$1</em>')
    .replace(/_(.+?)_/g, '<em class="italic text-gray-800">$1</em>')
    // Code: `text`
    .replace(/`(.+?)`/g, '<code class="bg-gray-100 text-gray-900 px-1 py-0.5 rounded text-sm font-sans">$1</code>')
    // Links: [text](url)
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-primary-600 hover:text-primary-700 underline" target="_blank" rel="noopener noreferrer">$1</a>');
}

export function MarkdownText({ children, className = '' }: MarkdownTextProps) {
  // 마크다운이 비어있거나 undefined면 빈 문자열 반환
  if (!children) return null;

  // ReactMarkdown으로 렌더링 시도
  try {
    return (
      <div className={className}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // 커스텀 스타일링
            strong: ({ children }) => (
              <strong className="font-semibold text-gray-900">{children}</strong>
            ),
            em: ({ children }) => (
              <em className="italic text-gray-800">{children}</em>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                className="text-primary-600 hover:text-primary-700 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            ),
            code: ({ children }) => (
              <code className="bg-gray-100 text-gray-900 px-1 py-0.5 rounded text-sm font-sans">
                {children}
              </code>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside space-y-1">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside space-y-1">{children}</ol>
            ),
            p: ({ children }) => <span>{children}</span>,
          }}
        >
          {children}
        </ReactMarkdown>
      </div>
    );
  } catch (error) {
    // Fallback: 간단한 HTML 변환
    console.warn('[MarkdownText] ReactMarkdown failed, using simple fallback', error);
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(children) }}
      />
    );
  }
}
