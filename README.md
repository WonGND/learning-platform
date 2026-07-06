# RETRO LEARNING PLATFORM (QUANT QUEST)

레트로 게임 감성의 게이미피케이션 학습 플랫폼 템플릿.
**주제 종속 데이터는 전부 `src/config/content.ts` 한 파일에 있다** — 이 파일만 교체하면
영어 강의, AI 가이드, 재테크 등 어떤 주제로든 서비스가 재구성된다.

현재 더미 주제: **퀀트 퀘스트** (자동매매/퀀트 투자 입문)

## 실행 방법

```bash
cd learning-platform
npm install
npm run dev      # 개발 서버 (http://localhost:5173)
npm run build    # 프로덕션 빌드 (dist/)
npm run preview  # 빌드 결과 미리보기
```

## 폴더 구조

```
src/
  config/
    content.ts    ← ★ 주제 교체는 이 파일만 수정
    index.ts      ← 기본값 병합 (필드 누락 시 안전 폴백)
  types/config.ts ← AppConfig 스키마 정의
  screens/        ← 화면 단위 (Boot / Title / Main ...)
  components/     ← 공용 컴포넌트 (MuteToggle ...)
  hooks/          ← usePrefersReducedMotion 등
  lib/            ← storage(네임스페이스드 localStorage), sound(Web Audio 효과음)
  styles/         ← CRT/픽셀 디자인 시스템 CSS
```

## 마일스톤 진행 상황

- [x] **M1**: 프로젝트 셋업 + content.ts 스키마 + 더미 주제 + 부팅 연출
- [x] **M2**: 학습 월드맵 + 챕터 뷰어 + 진행률 저장
- [x] **M3**: 진단 퀴즈 → 추천 로직 → 시작점 연결
- [ ] M4: 게이미피케이션 (업적·능력치·사운드·인카운터)
- [ ] M5: 멤버십 게이트 (입장 코드 잠금해제)
- [ ] M6: 마케팅 퍼널 CTA + 사례 섹션 + 반응형 마감 + 배포 빌드

주제 교체 상세 가이드는 M6 완료 시 이 README에 정리된다.
