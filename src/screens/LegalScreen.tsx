import { Markdown } from '../components/Markdown'
import { sfx } from '../lib/sound'

export type LegalDoc = 'terms' | 'refund' | 'privacy'

interface Props {
  doc: LegalDoc
  onBack: () => void
}

/**
 * 법적 고지 페이지 (플레이스홀더).
 * ⚠ 결제 서비스 오픈 전 실제 사업자 정보·약관으로 반드시 교체할 것.
 * 아래 [ ] 항목은 사업자 확정 후 채워야 하는 자리다.
 */
const DOCS: Record<LegalDoc, { title: string; body: string }> = {
  terms: {
    title: '이용약관',
    body: `# 이용약관 (초안 · 플레이스홀더)

> ⚠ 이 문서는 초안이다. 서비스 오픈 전 법률 검토를 거쳐 실제 약관으로 교체하라.

## 제1조 (목적)
본 약관은 [서비스명]이 제공하는 교육 콘텐츠 서비스의 이용 조건을 규정한다.

## 제2조 (교육 목적 고지)
본 서비스의 모든 콘텐츠는 **교육 목적**이며 투자 조언이 아니다. 특정 자산의 매매 추천이
아니며, 투자 판단과 그 책임은 이용자 본인에게 있다.

## 제3조 (계정)
이용자는 이메일로 로그인하며, 유료 콘텐츠는 결제 또는 입장 코드로 이용 권한을 얻는다.

## 제4조 (금지 행위)
유료 콘텐츠의 무단 복제·배포·공유를 금지한다.

## 제5조 (책임의 한계)
[사업자명]은 콘텐츠를 신의성실하게 제공하나, 이용자의 투자 결과에 대해 책임지지 않는다.

_[ ] 상호·대표자·연락처·관할 등 세부 조항은 사업자 정보 확정 후 보완할 것_`,
  },
  refund: {
    title: '환불정책',
    body: `# 환불정책 (초안 · 플레이스홀더)

> ⚠ 전자상거래법상 디지털 콘텐츠의 청약철회 제한은 **결제 전 고지 + 동의**가 있어야 유효하다.
> 아래 문구를 결제 화면에서도 명시하라.

## 청약철회
- 콘텐츠 이용(열람)을 시작하기 **전**에는 결제일로부터 7일 이내 청약철회가 가능하다.
- 이용을 시작한 디지털 콘텐츠는 관련 법령에 따라 청약철회가 제한될 수 있으며,
  이 경우 결제 전에 그 사실을 고지하고 동의를 받는다.

## 환불 절차
[ ] 환불 문의처(이메일/연락처)와 처리 기간을 기재할 것.

## 결제 대행
결제는 토스페이먼츠를 통해 처리되며, 카드 취소·환불은 PG 정책을 따른다.

_[ ] 사업자 정보 확정 후 세부 절차·기간을 보완할 것_`,
  },
  privacy: {
    title: '개인정보처리방침',
    body: `# 개인정보처리방침 (초안 · 플레이스홀더)

> ⚠ 개인정보 보호법(PIPA)에 따라 실제 수집 항목·목적·보유기간·위탁을 정확히 기재하라.

## 수집 항목
- 필수: 이메일(로그인), 결제 기록(주문·결제 상태)
- 선택: 없음. 학습 진행률·업적은 이용자 기기(localStorage)에만 저장된다.

## 이용 목적
계정 인증, 유료 콘텐츠 이용 권한 관리, 결제 처리.

## 처리 위탁
- Supabase (인증·데이터 저장/호스팅)
- 토스페이먼츠 (결제 처리)

## 보유 기간
[ ] 관련 법령(전자상거래법 등)에 따른 보유 기간을 기재할 것.

## 이용자 권리
이용자는 자신의 개인정보 열람·정정·삭제를 요청할 수 있다. [ ] 요청 창구를 기재할 것.

## 분석
동의한 이용자에 한해 최소한의 퍼널 이벤트(PII 없음)만 수집한다. 동의 전에는 수집하지 않는다.

_[ ] 개인정보 보호책임자·연락처를 기재할 것_`,
  },
}

export function LegalScreen({ doc, onBack }: Props) {
  const { title, body } = DOCS[doc]
  return (
    <div className="screen chapter-screen">
      <nav className="chapter-breadcrumb">
        <button type="button" className="crumb-link" onClick={onBack}>
          ← 돌아가기
        </button>
        <span aria-hidden="true"> ▸ </span>
        <span className="crumb-current">{title}</span>
      </nav>
      <article className="chapter-body">
        <Markdown source={body} />
      </article>
      <footer className="chapter-actions">
        <button
          type="button"
          className="pixel-btn ghost-btn"
          onClick={() => {
            sfx.blip()
            onBack()
          }}
        >
          ■ 닫기
        </button>
      </footer>
    </div>
  )
}
