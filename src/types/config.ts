/**
 * 콘텐츠 설정 스키마 — 주제 종속 데이터는 전부 src/config/content.ts 에만 존재한다.
 * 이 파일(타입)과 앱 로직은 주제와 무관하게 재사용된다.
 */

export interface Brand {
  title: string
  subtitle: string
  logoAscii?: string
  /** 투자/법적 고지 문구 — 랜딩 하단과 퍼널 CTA 아래에 상시 노출 */
  disclaimer?: string
}

export interface BootConfig {
  /** 부팅 시퀀스에 한 줄씩 타이핑되는 텍스트 */
  lines: string[]
  /** 전체 부팅 연출 목표 시간 (ms) */
  durationMs: number
}

/** 챕터 말미의 지식 확인 문제 (선택 필드 — 없으면 섹션 숨김) */
export interface CheckQuestion {
  question: string
  options: string[]
  /** options 의 0-based 정답 인덱스 */
  answerIndex: number
  /** 정답/오답 시 보여줄 해설 */
  explanation?: string
}

export interface Chapter {
  id: string
  title: string
  summary: string
  /** 마크다운 문자열 — 챕터 뷰어에서 렌더링 */
  body: string
  /** 지식 확인 문제 (선택) */
  check?: CheckQuestion[]
}

export interface Mode {
  id: string
  name: string
  description: string
  chapters: Chapter[]
}

export interface QuizOption {
  label: string
  /** 이 선택지의 점수. 전체 합산으로 클래스 판정 */
  score: number
}

export interface QuizQuestion {
  id: string
  question: string
  options: QuizOption[]
}

export interface RecommendedClass {
  id: string
  name: string
  description: string
  /** 퀴즈 총점이 [minScore, maxScore] 범위이면 이 클래스로 판정 */
  minScore: number
  maxScore: number
  /** 추천 시작점 */
  startModeId: string
  startChapterId: string
}

export type AchievementCondition =
  | { type: 'first_chapter' }
  | { type: 'quiz_complete' }
  | { type: 'mode_clear'; modeId?: string }
  | { type: 'chapters_completed'; count: number }
  | { type: 'all_clear' }

export interface Achievement {
  id: string
  name: string
  description: string
  /** 픽셀 이모지/문자 아이콘 (예: '★') */
  icon?: string
  condition: AchievementCondition
}

export interface CaseStudy {
  id: string
  title: string
  before: string
  after: string
  /** 강조할 핵심 지표 (예: '+38%p') */
  metric?: string
}

export interface FunnelBlock {
  id: string
  title: string
  description: string
  icon?: string
}

/**
 * 수강생 후기 — 반드시 실제 후기(실명·동의)로만 채워라.
 * placeholder: true 인 항목은 화면에 "예시 자리"로 표시된다 (날조 방지 장치).
 */
export interface Testimonial {
  quote: string
  author: string
  placeholder?: boolean
}

export interface FunnelConfig {
  ctaText: string
  url: string
  blocks: FunnelBlock[]
  testimonials?: Testimonial[]
}

export interface MembershipConfig {
  validCodes: string[]
  channelUrl: string
  /** 전체 챕터 순서 기준, 이 번호 이후 챕터는 잠금 (1-based) */
  gateAfterChapter: number
}

export interface Principles {
  title: string
  items: string[]
}

/** RANDOM ENCOUNTER — 낮은 확률로 등장하는 짧은 팁/미션 카드 */
export interface Encounter {
  id: string
  title?: string
  text: string
}

export interface AppConfig {
  brand: Brand
  boot: BootConfig
  modes: Mode[]
  quiz: QuizQuestion[]
  classes: RecommendedClass[]
  achievements: Achievement[]
  encounters?: Encounter[]
  principles?: Principles
  cases?: CaseStudy[]
  funnel: FunnelConfig
  membership: MembershipConfig
}

/** content.ts 작성 시 일부 필드를 빠뜨려도 앱이 죽지 않도록 허용하는 입력 타입 */
export type PartialAppConfig = {
  brand?: Partial<Brand>
  boot?: Partial<BootConfig>
  modes?: Mode[]
  quiz?: QuizQuestion[]
  classes?: RecommendedClass[]
  achievements?: Achievement[]
  encounters?: Encounter[]
  principles?: Principles
  cases?: CaseStudy[]
  funnel?: Partial<FunnelConfig>
  membership?: Partial<MembershipConfig>
}
