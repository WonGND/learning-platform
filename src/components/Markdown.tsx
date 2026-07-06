import { useMemo } from 'react'
import { marked } from 'marked'

marked.setOptions({ gfm: true })

/**
 * 챕터 본문(마크다운) 렌더러.
 * 소스는 개발자가 관리하는 content.ts 에서만 오므로 신뢰 가능한 입력이다 —
 * 외부 사용자 입력을 렌더링하게 된다면 반드시 sanitizer를 추가하라.
 */
export function Markdown({ source }: { source: string }) {
  const html = useMemo(() => marked.parse(source, { async: false }), [source])
  return <div className="markdown" dangerouslySetInnerHTML={{ __html: html }} />
}
