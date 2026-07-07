import { config } from '../config'
import { sfx } from '../lib/sound'
import { track } from '../lib/analytics'

interface Props {
  /** 섹션 상단 헤드라인 (배치 지점별로 다르게) */
  heading?: string
  /** true면 10계명/사례를 생략하고 가치 제안 + CTA만 (챕터 하단용 컴팩트 버전) */
  compact?: boolean
  /** 고지 문구 표시 여부 (타이틀 화면은 자체 푸터에 표시하므로 끔) */
  showDisclaimer?: boolean
}

/**
 * 마케팅 퍼널 — 가치 제안 카드(funnel.blocks) + Before/After 사례(cases)
 * + 설계자의 10계명(principles) + 외부 유료 강의 CTA.
 * 관련 config 필드가 비어 있으면 각 부분을 자연스럽게 숨긴다.
 */
export function FunnelSection({ heading, compact = false, showDisclaimer = true }: Props) {
  const { funnel, cases, principles } = config
  const hasBlocks = funnel.blocks.length > 0
  const hasCta = funnel.ctaText !== '' && funnel.url !== ''
  const hasCases = !compact && !!cases && cases.length > 0
  const hasPrinciples = !compact && !!principles && principles.items.length > 0
  const testimonials = funnel.testimonials ?? []
  const hasTestimonials = !compact && testimonials.length > 0

  if (!hasBlocks && !hasCta && !hasCases && !hasPrinciples && !hasTestimonials) return null

  return (
    <section className="funnel">
      {heading && <h2 className="section-title">— {heading} —</h2>}

      {hasPrinciples && (
        <div className="principles-panel">
          <h3 className="funnel-subtitle">◆ {principles!.title}</h3>
          <ol className="principles-list">
            {principles!.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        </div>
      )}

      {hasCases && (
        <div className="cases-panel">
          <h3 className="funnel-subtitle">◆ BEFORE / AFTER</h3>
          <div className="cases-table-wrap">
            <table className="cases-table">
              <thead>
                <tr>
                  <th scope="col"> </th>
                  <th scope="col">BEFORE</th>
                  <th scope="col">AFTER</th>
                  <th scope="col">RESULT</th>
                </tr>
              </thead>
              <tbody>
                {cases!.map((c) => (
                  <tr key={c.id}>
                    <th scope="row">{c.title}</th>
                    <td className="case-before">{c.before}</td>
                    <td className="case-after">{c.after}</td>
                    <td className="case-metric">{c.metric ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {hasBlocks && (
        <ul className="funnel-blocks">
          {funnel.blocks.map((b) => (
            <li className="funnel-block" key={b.id}>
              {b.icon && (
                <span className="funnel-block-icon" aria-hidden="true">
                  {b.icon}
                </span>
              )}
              <span className="funnel-block-title">{b.title}</span>
              <span className="funnel-block-desc">{b.description}</span>
            </li>
          ))}
        </ul>
      )}

      {hasTestimonials && (
        <ul className="testimonials" aria-label="수강생 후기">
          {testimonials.map((t, i) => (
            <li className={`testimonial${t.placeholder ? ' placeholder' : ''}`} key={i}>
              {t.placeholder && <span className="testimonial-tag">예시 자리 — 실제 후기로 교체</span>}
              <p className="testimonial-quote">“{t.quote}”</p>
              <p className="testimonial-author">— {t.author}</p>
            </li>
          ))}
        </ul>
      )}

      {hasCta && (
        <a
          className="pixel-btn start-btn funnel-cta"
          href={funnel.url}
          target="_blank"
          rel="noreferrer"
          onClick={() => {
            sfx.start()
            track('cta_click', { url: funnel.url })
          }}
        >
          {funnel.ctaText}
        </a>
      )}

      {showDisclaimer && config.brand.disclaimer && (
        <p className="disclaimer">{config.brand.disclaimer}</p>
      )}
    </section>
  )
}
