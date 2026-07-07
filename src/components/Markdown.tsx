import { useMemo } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

marked.setOptions({ gfm: true })

/**
 * 챕터 본문(마크다운) 렌더러.
 * marked 출력은 DOMPurify로 새니타이즈한다 — 현재 소스는 개발자가 관리하는
 * content.ts뿐이지만, 원격/사용자 콘텐츠가 개입하는 순간을 대비한 XSS 방어선이다.
 */
export function Markdown({ source }: { source: string }) {
  const html = useMemo(() => {
    const raw = marked.parse(source, { async: false })
    const clean = DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } })
    // 목차 앵커: h2에 등장 순서대로 sec-N id 부여 (ChapterScreen의 목차와 순서 일치)
    let i = 0
    return clean.replace(/<h2>/g, () => `<h2 id="sec-${i++}">`)
  }, [source])
  return <div className="markdown" dangerouslySetInnerHTML={{ __html: html }} />
}
