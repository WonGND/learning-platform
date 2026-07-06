import type { PartialAppConfig } from '../types/config'

/**
 * ★ 주제 교체는 이 파일만 수정하면 된다 ★
 *
 * 예시 주제: "퀀트 퀘스트" — 자동매매/퀀트 투자 입문 (재테크)
 * 다른 주제(영어 강의, AI 가이드 등)로 바꾸려면 아래 데이터만 교체하라.
 * 필드를 비워도 앱은 죽지 않고 해당 섹션을 숨기거나 기본값으로 대체한다.
 */
export const content: PartialAppConfig = {
  brand: {
    title: 'QUANT QUEST',
    subtitle: '자동매매로 배우는 퀀트 투자 모험',
    logoAscii: String.raw`
  ██████  ██    ██  █████  ███    ██ ████████
 ██    ██ ██    ██ ██   ██ ████   ██    ██
 ██    ██ ██    ██ ███████ ██ ██  ██    ██
 ██ ▄▄ ██ ██    ██ ██   ██ ██  ██ ██    ██
  ██████   ██████  ██   ██ ██   ████    ██
     ▀▀   Q U E S T · INSERT COIN TO LEARN`,
  },

  boot: {
    durationMs: 4200,
    lines: [
      'QUANT-BIOS v2.6.0 (C) 2026 QUEST SYSTEMS',
      'CPU: HUMAN BRAIN @ 1.0 GHZ ... OK',
      'MEMORY TEST: 640K GREED / 640K FEAR ... OK',
      'LOADING MARKET DATA ......... OK',
      'LOADING RISK MODULE ......... OK',
      'LOADING DISCIPLINE.SYS ...... OK',
      'MOUNTING /dev/wallet ........ READ-ONLY (안전모드)',
      'WARNING: 감정 매매 바이러스 검역됨',
      '',
      'ALL SYSTEMS GO. PRESS START.',
    ],
  },

  modes: [
    {
      id: 'novice',
      name: '입문의 동굴',
      description: '투자 마인드셋과 시장의 기본 구조를 배운다',
      chapters: [
        {
          id: 'novice-1',
          title: '왜 자동매매인가',
          summary: '감정 매매의 함정과 시스템 트레이딩의 존재 이유',
          body: `# 왜 자동매매인가

사람은 **공포**와 **탐욕** 앞에서 원칙을 지키지 못한다.

- 떨어지면 무서워서 팔고
- 오르면 배가 아파서 산다

자동매매는 이 둘을 코드 밖으로 몰아낸다.

> 규칙이 없는 매매는 전략이 아니라 도박이다.

## 이 장에서 배우는 것
1. 재량 매매 vs 시스템 매매
2. 백테스트가 필요한 이유
3. "수익률"보다 "생존"이 먼저인 이유`,
        },
        {
          id: 'novice-2',
          title: '시장이라는 던전',
          summary: '주식·코인·선물 시장의 구조와 규칙',
          body: `# 시장이라는 던전

던전마다 몬스터가 다르듯, 시장마다 규칙이 다르다.

| 시장 | 거래 시간 | 변동성 | 레버리지 |
|------|-----------|--------|----------|
| 주식 | 정규장 | 중간 | 낮음 |
| 코인 | 24시간 | 높음 | 선택 |
| 선물 | 거의 24시간 | 높음 | 기본 |

**초보는 변동성이 낮은 던전부터.** 레버리지는 후반 콘텐츠다.`,
        },
        {
          id: 'novice-3',
          title: '리스크라는 HP 관리',
          summary: '포지션 사이징과 손절 — 죽지 않는 법',
          body: `# 리스크라는 HP 관리

게임에서 HP가 0이 되면 끝나듯, 계좌가 0이 되면 퇴장이다.

## 철칙
- 한 번의 트레이드에 계좌의 **1~3%** 이상 걸지 않는다
- 진입 전에 **손절 라인**을 먼저 정한다
- 물타기는 전략이 아니라 회피다

\`\`\`
포지션 크기 = (계좌 × 리스크%) ÷ (진입가 - 손절가)
\`\`\``,
        },
      ],
    },
    {
      id: 'adept',
      name: '실전의 평원',
      description: '전략을 만들고 백테스트로 검증한다',
      chapters: [
        {
          id: 'adept-1',
          title: '첫 전략: 추세 추종',
          summary: '이동평균과 모멘텀으로 만드는 기본 전략',
          body: `# 첫 전략: 추세 추종

가장 오래 살아남은 전략은 단순하다. **"오르는 것을 사고, 내리면 판다."**

## 기본 레시피
1. 20일/60일 이동평균 골든크로스 → 매수
2. 데드크로스 또는 손절 라인 → 매도
3. ATR 기반으로 손절 폭을 시장 변동성에 맞춘다

복잡한 지표 10개보다 규칙 3개를 **지키는 것**이 어렵다.`,
        },
        {
          id: 'adept-2',
          title: '백테스트의 함정',
          summary: '과최적화·생존 편향·미래 참조를 피하는 법',
          body: `# 백테스트의 함정

백테스트 수익률 500%는 대부분 **버그이거나 과최적화**다.

## 3대 함정
- **과최적화**: 파라미터를 과거에 딱 맞추면 미래에 죽는다
- **미래 참조**: 그 시점에 알 수 없던 데이터를 쓰는 실수
- **비용 무시**: 수수료·슬리피지를 빼면 수익이 사라지는 전략이 태반

> 인샘플에서 만들고, 아웃오브샘플에서 죽는지 확인하라.`,
        },
        {
          id: 'adept-3',
          title: '검증 스위트 만들기',
          summary: '워크포워드, 몬테카를로, 파라미터 민감도',
          body: `# 검증 스위트 만들기

전략이 진짜인지 확인하는 3단 콤보:

1. **워크포워드**: 구간을 굴리며 재최적화 → 실전과 가장 비슷
2. **몬테카를로**: 트레이드 순서를 섞어 최악의 낙폭 분포 확인
3. **민감도 분석**: 파라미터를 ±20% 흔들어도 살아남는가

세 가지를 모두 통과해야 실탄을 넣을 자격이 생긴다.`,
        },
      ],
    },
    {
      id: 'master',
      name: '마스터의 탑',
      description: '실계좌 운영·자동화·포트폴리오 레벨의 기술',
      chapters: [
        {
          id: 'master-1',
          title: '실계좌 가동 체크리스트',
          summary: '페이퍼 → 소액 → 증액의 단계적 배포',
          body: `# 실계좌 가동 체크리스트

코드를 짜는 것과 돈을 태우는 것은 다른 게임이다.

- [ ] 페이퍼 트레이딩 최소 2주
- [ ] 소액 실계좌로 체결·슬리피지 확인
- [ ] 워치독(장애 감지) + 알림 연결
- [ ] 최대 낙폭 도달 시 **자동 정지** 규칙

시스템은 실패한다. 실패해도 파산하지 않게 설계하라.`,
        },
        {
          id: 'master-2',
          title: '포트폴리오와 상관관계',
          summary: '전략 여러 개를 섞어 낙폭을 줄이는 법',
          body: `# 포트폴리오와 상관관계

전략 하나는 언젠가 부진기를 맞는다. 해법은 **서로 다르게 움직이는 전략의 조합**.

- 추세 + 평균회귀
- 주식 + 코인 + 현금
- 상관계수가 낮을수록 합산 낙폭이 줄어든다

수익률을 더하는 게 아니라 **최악의 날을 나누는 것**이 분산이다.`,
        },
        {
          id: 'master-3',
          title: '운영 자동화와 기록',
          summary: '봇 감시, 로그, 회고 — 시스템을 시스템으로 지키기',
          body: `# 운영 자동화와 기록

마스터의 마지막 스킬은 화려한 전략이 아니라 **지루한 운영**이다.

1. 매일 봇 상태·포지션·손익을 자동 리포트
2. 모든 주문과 예외를 로그로 남긴다
3. 주 1회 회고: 전략이 아니라 **프로세스**를 평가

> 시장은 통제할 수 없다. 통제할 수 있는 것은 프로세스뿐이다.`,
        },
      ],
    },
  ],

  quiz: [
    {
      id: 'q1',
      question: '투자 경험은 어느 정도인가?',
      options: [
        { label: '전혀 없다 — 예금이 전부', score: 0 },
        { label: '주식/코인을 사본 적 있다', score: 1 },
        { label: '1년 이상 꾸준히 매매 중', score: 2 },
        { label: '전략을 세워 기록하며 매매한다', score: 3 },
      ],
    },
    {
      id: 'q2',
      question: '"손절 라인"을 정하고 진입하는가?',
      options: [
        { label: '손절이 뭔가요', score: 0 },
        { label: '알지만 잘 안 지킨다', score: 1 },
        { label: '대체로 지킨다', score: 2 },
        { label: '기계적으로 지킨다', score: 3 },
      ],
    },
    {
      id: 'q3',
      question: '코딩 경험은?',
      options: [
        { label: '없다', score: 0 },
        { label: '엑셀 함수 정도', score: 1 },
        { label: '파이썬 기초 문법을 안다', score: 2 },
        { label: 'API로 뭔가 만들어봤다', score: 3 },
      ],
    },
    {
      id: 'q4',
      question: '백테스트라는 말을 들으면?',
      options: [
        { label: '처음 듣는다', score: 0 },
        { label: '들어봤지만 해본 적 없다', score: 1 },
        { label: '툴로 돌려본 적 있다', score: 2 },
        { label: '직접 코드로 돌린다', score: 3 },
      ],
    },
    {
      id: 'q5',
      question: '보유 종목이 -10%가 되면?',
      options: [
        { label: '무서워서 바로 판다', score: 0 },
        { label: '물타기한다', score: 1 },
        { label: '계획에 따라 판단한다', score: 2 },
        { label: '이미 손절 주문이 걸려 있다', score: 3 },
      ],
    },
    {
      id: 'q6',
      question: '투자에 쓸 수 있는 시간은?',
      options: [
        { label: '거의 없다 — 그래서 자동화가 궁금하다', score: 1 },
        { label: '주 1~2시간', score: 1 },
        { label: '매일 30분 이상', score: 2 },
        { label: '업무 수준으로 투자한다', score: 3 },
      ],
    },
    {
      id: 'q7',
      question: '레버리지(선물/마진) 경험은?',
      options: [
        { label: '없다 (그게 안전하다)', score: 1 },
        { label: '소액으로 해봤다', score: 2 },
        { label: '주기적으로 사용한다', score: 3 },
        { label: '청산당해본 적 있다', score: 2 },
      ],
    },
    {
      id: 'q8',
      question: '이 여정의 목표는?',
      options: [
        { label: '투자 기초 체력 기르기', score: 0 },
        { label: '내 전략을 만들어 검증하기', score: 2 },
        { label: '봇을 실계좌에 붙여 운영하기', score: 3 },
        { label: '일단 구경', score: 0 },
      ],
    },
  ],

  classes: [
    {
      id: 'squire',
      name: '견습 투자자 (SQUIRE)',
      description: '기초 체력부터. 입문의 동굴에서 마인드셋과 리스크 관리를 먼저 익히자.',
      minScore: 0,
      maxScore: 8,
      startModeId: 'novice',
      startChapterId: 'novice-1',
    },
    {
      id: 'knight',
      name: '전략 기사 (KNIGHT)',
      description: '기본기는 충분. 실전의 평원에서 전략 제작과 백테스트 검증에 들어가자.',
      minScore: 9,
      maxScore: 16,
      startModeId: 'adept',
      startChapterId: 'adept-1',
    },
    {
      id: 'archmage',
      name: '퀀트 대마법사 (ARCHMAGE)',
      description: '이미 실전형. 마스터의 탑에서 실계좌 운영과 포트폴리오 기술을 완성하자.',
      minScore: 17,
      maxScore: 24,
      startModeId: 'master',
      startChapterId: 'master-1',
    },
  ],

  achievements: [
    {
      id: 'first-blood',
      name: 'FIRST BLOOD',
      description: '첫 챕터를 완료했다',
      icon: '⚔',
      condition: { type: 'first_chapter' },
    },
    {
      id: 'class-check',
      name: 'KNOW THYSELF',
      description: '진단 퀴즈를 완료했다',
      icon: '◎',
      condition: { type: 'quiz_complete' },
    },
    {
      id: 'cave-clear',
      name: 'CAVE CLEARED',
      description: '입문의 동굴을 클리어했다',
      icon: '⛏',
      condition: { type: 'mode_clear', modeId: 'novice' },
    },
    {
      id: 'grinder',
      name: 'GRINDER',
      description: '챕터 5개를 완료했다',
      icon: '▲',
      condition: { type: 'chapters_completed', count: 5 },
    },
    {
      id: 'speedrunner',
      name: 'ALL CLEAR',
      description: '모든 챕터를 완주했다',
      icon: '★',
      condition: { type: 'all_clear' },
    },
  ],

  principles: {
    title: '퀀트 설계자의 10계명',
    items: [
      '생존이 수익에 우선한다',
      '진입 전에 청산 계획을 세운다',
      '한 트레이드에 계좌의 3%를 넘기지 않는다',
      '백테스트 없이 실탄을 쓰지 않는다',
      '아웃오브샘플에서 죽는 전략은 버린다',
      '수수료와 슬리피지를 항상 포함한다',
      '파라미터가 예민한 전략을 믿지 않는다',
      '낙폭 한도에 도달하면 시스템을 멈춘다',
      '기록하지 않은 트레이드는 배움이 아니다',
      '시장이 아니라 프로세스를 통제한다',
    ],
  },

  cases: [
    {
      id: 'case-1',
      title: '감정 매매 → 규칙 매매',
      before: '뉴스 보고 추격 매수, 연 -23%',
      after: '추세 추종 규칙 매매, 연 +14%',
      metric: '+37%p',
    },
    {
      id: 'case-2',
      title: '몰빵 → 포지션 사이징',
      before: '한 종목 몰빵, 최대 낙폭 -48%',
      after: '3% 리스크 룰 적용, 최대 낙폭 -12%',
      metric: 'MDD 1/4',
    },
    {
      id: 'case-3',
      title: '수동 감시 → 자동 운영',
      before: '차트 보느라 하루 4시간',
      after: '봇 + 알림으로 하루 10분',
      metric: '시간 96% 절약',
    },
  ],

  funnel: {
    ctaText: '실전 자동매매 부트캠프 입장 →',
    url: 'https://example.com/quant-bootcamp',
    blocks: [
      {
        id: 'f1',
        icon: '🤖',
        title: '내 손으로 만드는 매매 봇',
        description: '파이썬 봇을 거래소 API에 직접 연결하는 실습 과정',
      },
      {
        id: 'f2',
        icon: '📊',
        title: '검증 프레임워크 제공',
        description: '워크포워드·몬테카를로 검증 코드를 그대로 제공',
      },
      {
        id: 'f3',
        icon: '🛡',
        title: '리스크 관리 템플릿',
        description: '포지션 사이징·자동 손절·워치독 설정 템플릿 포함',
      },
    ],
  },

  membership: {
    validCodes: ['QUANT2026', 'PLAYER-ONE'],
    channelUrl: 'https://example.com/free-channel',
    gateAfterChapter: 6,
  },
}
