# Plan: content-expansion

> NeedCash 프로토타입 허브에 바이럴 공유, 신규 게임, 개발자 도구, 콘텐츠 시너지 강화를 위한 8단계 콘텐츠 확장

## 1. Overview

### Purpose
NeedCash 사이트의 콘텐츠를 확장하여 (1) 바이럴 성장 루프 구축, (2) 재방문율 향상, (3) 콘텐츠 간 시너지 강화를 달성한다. 전문가 패널 브레인스토밍(크리스텐슨 JTBD, 고딘 바이럴, 드러커 가치, 메도우즈 시스템) 결과를 기반으로 8개 Phase를 우선순위 순으로 구현한다.

### Background
- 프로젝트: NeedCash (Next.js 16 + React 19 + TypeScript 5 + Tailwind CSS 4)
- 현재 콘텐츠: Blog(D1 CMS), Game(6종), Resume(5개국어), 정적 페이지
- 배포: Cloudflare Workers (@opennextjs/cloudflare)
- 브레인스토밍 문서: `docs/brainstorm/content-expansion.brainstorm.md`
- 빠져있는 JTBD: 친구와 비교(공유), 매일 올 이유(데일리), 실용 도구, 인터랙티브 학습

## 2. Scope

### In Scope (8 Phases)

| Phase | 콘텐츠 | 유형 |
|-------|--------|------|
| 1 | 게임 결과 공유 | 기존 게임 6개 기능 추가 |
| 2 | 타이핑 스피드 테스트 | 신규 게임 |
| 3 | 개발자 유틸리티 (/tools) | 신규 섹션 + 도구 3종 |
| 4 | 수학 암산 게임 | 신규 게임 |
| 5 | 콘텐츠 간 연결 강화 | 기존 페이지 개선 |
| 6 | 데일리 챌린지 | 홈페이지 위젯 |
| 7 | 알고리즘 시각화 | 신규 도구 |
| 8 | 퍼스널리티 퀴즈 | 신규 게임 |

### Out of Scope
- 서버사이드 랭킹/리더보드 (백엔드 인증 시스템 필요)
- OG 이미지 자동 생성 (canvas/서버리스 이미지 생성 — 추후 고려)
- 사운드/효과음 (Web Audio API)
- 크로스 디바이스 데이터 동기화 (인증 시스템 없음)
- 다국어 지원 (게임/도구 UI — 이력서만 다국어)
- 모바일 앱 (Flutter — 웹 완성 후)

## 3. Requirements

### Phase 1: 게임 결과 공유

| ID | 요구사항 | 우선순위 | 설명 |
|----|---------|---------|------|
| P1-01 | 공유 텍스트 생성 유틸리티 | CRITICAL | `buildShareText(gameName, grade, mainValue, unit?)` → 클립보드용 텍스트 |
| P1-02 | 클립보드 복사 유틸리티 | CRITICAL | `copyToClipboard(text)` → navigator.clipboard.writeText 래핑 |
| P1-03 | ShareResult 공유 컴포넌트 | CRITICAL | Button + "복사됨!" 피드백 (2초 후 리셋) |
| P1-04 | reaction-game 통합 | HIGH | 결과 화면에 등급 + 평균ms 공유 |
| P1-05 | color-memory-game 통합 | HIGH | 결과 화면에 등급 + 라운드 수 공유 |
| P1-06 | color-sense-game 통합 | HIGH | 결과 화면에 등급 + 점수 공유 |
| P1-07 | dice-game 통합 | MEDIUM | 최근 결과 텍스트 공유 |
| P1-08 | lotto-game 통합 | MEDIUM | 생성 번호 텍스트 공유 |
| P1-09 | animal-face 통합 | MEDIUM | 동물상 결과 공유 |

공유 텍스트 형식:
```
[NeedCash] {게임명}
등급: {등급} · {칭호}
{메인값}{단위}
https://needcash.dev/game/{slug}
```

### Phase 2: 타이핑 스피드 게임

| ID | 요구사항 | 우선순위 | 설명 |
|----|---------|---------|------|
| P2-01 | UIIconType에 keyboard 아이콘 추가 | HIGH | 키보드 SVG 아이콘 |
| P2-02 | GAMES 배열에 typing 등록 | HIGH | slug: "typing", title: "Typing Speed" |
| P2-03 | FOOTER_SECTIONS에 링크 추가 | HIGH | 게임 섹션에 Typing Speed 링크 |
| P2-04 | game-content.ts에 콘텐츠 추가 | HIGH | intro, howToPlay, scoreGuide, background, faq |
| P2-05 | 한/영 언어 선택 | CRITICAL | 게임 시작 전 KO/EN 토글 |
| P2-06 | 60초 타이머 | CRITICAL | useEffect + setInterval 카운트다운 |
| P2-07 | 문자별 정오답 표시 | CRITICAL | 초록(정답), 빨강(오답), 회색(미입력) 색상 구분 |
| P2-08 | WPM 계산 | CRITICAL | `(입력 문자 수 / 5) / (경과 시간(분))` |
| P2-09 | 정확도 계산 | HIGH | `(정답 문자 수 / 전체 입력 수) × 100` |
| P2-10 | 등급 시스템 | HIGH | S(100+), A(80-99), B(60-79), C(40-59), D(20-39), F(<20) |
| P2-11 | 히스토리 | MEDIUM | 최근 10건, 기존 패턴 동일 |
| P2-12 | ShareResult 통합 | MEDIUM | Phase 1 컴포넌트 재사용 |
| P2-13 | [slug]/page.tsx 등록 | HIGH | dynamic import + GAME_COMPONENTS |
| P2-14 | 텍스트 코퍼스 | HIGH | KO_TEXTS[], EN_TEXTS[] (3-5개 문단, 파일 내 상수) |

Phase 상태 머신:
```
idle → [시작] → countdown(3초) → playing(60초) → result
```

등급 기준:
| 등급 | WPM | 칭호 |
|:----:|:---:|------|
| S | 100+ | "타자의 신" |
| A | 80-99 | "전문가 수준" |
| B | 60-79 | "빠른 손가락" |
| C | 40-59 | "평균 타이피스트" |
| D | 20-39 | "느긋한 타자" |
| F | <20 | "독수리 타법" |

### Phase 3: 개발자 유틸리티 도구 섹션

| ID | 요구사항 | 우선순위 | 설명 |
|----|---------|---------|------|
| P3-01 | NAV_LINKS에 /tools 추가 | CRITICAL | 4개 디자인 헤더 자동 반영 |
| P3-02 | FOOTER_SECTIONS에 도구 섹션 추가 | HIGH | 도구 3종 링크 |
| P3-03 | Tool 인터페이스 + TOOLS 배열 | CRITICAL | slug, title, description, icon, category |
| P3-04 | /tools 허브 페이지 | CRITICAL | TOOLS.map() 그리드, /game 허브와 동일 구조 |
| P3-05 | /tools/[slug] 개별 페이지 | CRITICAL | dynamic import, generateStaticParams |
| P3-06 | JSON Formatter 도구 | HIGH | JSON.parse + stringify, 들여쓰기 옵션(2/4), 에러 표시 |
| P3-07 | Base64 Encoder 도구 | HIGH | encode/decode 토글, UTF-8 안전 처리 |
| P3-08 | Color Palette 도구 | HIGH | 기본색 입력 → 보색/유사색/삼색 조합 생성, HSL 수학 |
| P3-09 | sitemap.ts 업데이트 | HIGH | /tools + 개별 도구 페이지 추가 |
| P3-10 | 아이콘 3종 추가 | HIGH | braces, code, palette → UIIconType 확장 |

### Phase 4: 수학 암산 게임

| ID | 요구사항 | 우선순위 | 설명 |
|----|---------|---------|------|
| P4-01 | 게임 등록 (아이콘, 상수, 콘텐츠, 라우트) | HIGH | 기존 5단계 패턴 |
| P4-02 | 난이도 선택 | CRITICAL | easy(1-20, +−), medium(1-50, +-×÷), hard(1-100) |
| P4-03 | 문제 생성 로직 | CRITICAL | 나눗셈: b×answer=a로 정수 보장 |
| P4-04 | 60초 타이머 | CRITICAL | Phase 2와 동일 패턴 |
| P4-05 | 정답/오답 피드백 | HIGH | 정답 시 초록 플래시, 오답 시 빨강 흔들림 |
| P4-06 | 등급 시스템 | HIGH | S(30+), A(20-29), B(15-19), C(10-14), D(5-9), F(<5) |
| P4-07 | 히스토리 + ShareResult | MEDIUM | 기존 패턴 |

등급 기준:
| 등급 | 정답 수 | 칭호 |
|:----:|:------:|------|
| S | 30+ | "인간 계산기" |
| A | 20-29 | "수학의 달인" |
| B | 15-19 | "빠른 암산가" |
| C | 10-14 | "평균 수준" |
| D | 5-9 | "계산기가 그립다" |
| F | <5 | "수포자" |

### Phase 5: 콘텐츠 간 연결 강화

| ID | 요구사항 | 우선순위 | 설명 |
|----|---------|---------|------|
| P5-01 | Blog → Game 링크 | MEDIUM | 블로그 본문에 관련 게임 마크다운 링크 (스키마 변경 없음) |
| P5-02 | Game → Blog 링크 | LOW | 이미 relatedBlog 필드 존재, 블로그 포스트 작성만 필요 |
| P5-03 | Tool → Blog 연결 | MEDIUM | Tool 인터페이스에 relatedBlog? 추가 |
| P5-04 | Resume → Portfolio | MEDIUM | 이력서 페이지에 GAMES/TOOLS 링크 그리드 추가 |

### Phase 6: 데일리 챌린지

| ID | 요구사항 | 우선순위 | 설명 |
|----|---------|---------|------|
| P6-01 | 날짜 기반 시드 난수 생성 | CRITICAL | Mulberry32 PRNG, 날짜 시드 |
| P6-02 | getDailyGame() 함수 | CRITICAL | 매일 동일 게임 선정 (시드 기반) |
| P6-03 | 방문 스트릭 관리 | HIGH | localStorage: lastPlayed, streak, totalPlayed |
| P6-04 | 홈페이지 위젯 | HIGH | "오늘의 챌린지" 카드 + 스트릭 카운터 + 플레이 링크 |
| P6-05 | home-page.tsx 통합 | HIGH | DailyChallenge 위젯을 디자인 컴포넌트 위에 삽입 |

### Phase 7: 알고리즘 시각화

| ID | 요구사항 | 우선순위 | 설명 |
|----|---------|---------|------|
| P7-01 | TOOLS 배열에 sort-visualizer 등록 | HIGH | Phase 3 의존 |
| P7-02 | 3가지 정렬 알고리즘 | CRITICAL | 버블, 퀵, 병합 |
| P7-03 | 단계 사전 계산 | CRITICAL | 정렬 전 과정을 BarState[][] 배열로 미리 계산 |
| P7-04 | 애니메이션 재생 | HIGH | setInterval로 단계별 재생, 속도 조절 |
| P7-05 | 컨트롤 UI | HIGH | 알고리즘 선택, 배열 크기(10-100), 속도, Play/Pause/Step/Reset |
| P7-06 | 상태별 색상 | MEDIUM | 비교중=노랑, 정렬완료=초록, 피봇=빨강, 기본=파랑 |

### Phase 8: 퍼스널리티 퀴즈

| ID | 요구사항 | 우선순위 | 설명 |
|----|---------|---------|------|
| P8-01 | 게임 등록 (아이콘, 상수, 콘텐츠, 라우트) | HIGH | slug: "quiz", icon: "sparkles" |
| P8-02 | 15-20문항 가중치 질문 | CRITICAL | 각 답변에 PersonalityType별 가중치 |
| P8-03 | 4가지 성격 유형 | CRITICAL | 탐험가/창작자/분석가/연결자 |
| P8-04 | 결과 화면 | HIGH | 유형 이모지 + 설명 + 특성 목록 |
| P8-05 | ShareResult 통합 | HIGH | Phase 1 컴포넌트 재사용 |
| P8-06 | 히스토리 | MEDIUM | 최근 결과 유형 기록 |

성격 유형:
| 유형 | 이모지 | 설명 |
|------|--------|------|
| 탐험가 | 🗺️ | 새로운 것을 찾아 나서는 모험가 |
| 창작자 | 🎨 | 상상력으로 세상을 바꾸는 예술가 |
| 분석가 | 🔬 | 데이터와 논리로 문제를 해결하는 전략가 |
| 연결자 | 🤝 | 사람과 사람 사이를 잇는 소통가 |

### Non-Functional Requirements

| ID | 요구사항 |
|----|---------|
| NFR-01 | 기존 게임/블로그/이력서 동작에 영향 없어야 함 |
| NFR-02 | 각 Phase 완료 후 `pnpm build` 성공 |
| NFR-03 | `pnpm lint` 통과 |
| NFR-04 | 외부 라이브러리 추가 없음 (기존 의존성만 사용) |
| NFR-05 | 모든 신규 게임/도구는 클라이언트 사이드 전용 ("use client") |
| NFR-06 | setTimeout/setInterval cleanup 처리 (메모리 누수 방지) |
| NFR-07 | 모바일 반응형 (320px ~ 1920px) |
| NFR-08 | 다크/라이트 모드 호환 |

## 4. Success Criteria

| 기준 | 목표 |
|------|------|
| Phase 1: 공유 기능 | 6개 게임 모두 ShareResult 버튼 동작 |
| Phase 2: 타이핑 게임 | /game/typing 접속 → 한/영 선택 → 60초 플레이 → WPM+등급 표시 |
| Phase 3: 도구 섹션 | /tools 허브 + 3개 도구 페이지 정상 동작, 네비게이션 표시 |
| Phase 4: 수학 게임 | /game/math 접속 → 난이도 선택 → 60초 플레이 → 점수+등급 표시 |
| Phase 5: 연결 강화 | 도구↔블로그, 이력서↔포트폴리오 링크 동작 |
| Phase 6: 데일리 | 홈페이지에 오늘의 챌린지 위젯 표시, 스트릭 카운터 동작 |
| Phase 7: 시각화 | /tools/sort-visualizer 3가지 알고리즘 애니메이션 동작 |
| Phase 8: 퀴즈 | /game/quiz 15-20문항 → 성격 유형 결과 표시 |
| 빌드 성공 | 각 Phase 완료 후 Pass |
| 린트 통과 | 각 Phase 완료 후 Pass |
| 기존 기능 회귀 | 0건 |
| 외부 의존성 추가 | 0개 |

## 5. Technical Design

### Phase 1: 공유 시스템 아키텍처

```
lib/share.ts
├── buildShareText(gameName, grade, mainValue, unit?) → string
└── copyToClipboard(text) → Promise<boolean>

components/game/share-result.tsx
├── Props: gameName, grade, gradeTitle, mainValue, unit?, slug
├── State: copied (boolean, 2초 후 리셋)
└── Render: Button variant="outline" size="sm"
```

통합 위치 (각 게임의 결과 Phase):
| 게임 | 공유 데이터 |
|------|-----------|
| reaction | grade + average(ms) |
| color-memory | grade + round |
| color-sense | grade + totalScore |
| dice | 최근 주사위 값 |
| lotto | 생성 번호 6개 |
| animal-face | 동물상 유형 |

### Phase 2: 타이핑 게임 상태 머신

```
idle → [시작] → countdown(3,2,1) → playing(60초) → result
                                      │
                                      ├── 문자 입력 → 실시간 정오답 표시
                                      └── 타이머 종료 → WPM/정확도 계산
```

핵심 로직:
```
WPM = Math.round((totalChars / 5) / ((60 - timeLeft) / 60))
Accuracy = Math.round((correctChars / totalChars) * 100)
```

텍스트 표시 방식:
- 프롬프트 텍스트를 문자 단위로 렌더링
- 각 문자에 조건부 색상 클래스 적용
- 입력은 숨겨진 textarea에서 받고 시각적 표시는 span 배열로

### Phase 3: 도구 섹션 구조

```
app/tools/
├── page.tsx          ← TOOLS.map() 그리드 (서버 컴포넌트)
└── [slug]/
    └── page.tsx      ← TOOL_COMPONENTS[slug] (dynamic import)

components/tools/
├── json-formatter.tsx  ← "use client"
├── base64-tool.tsx     ← "use client"
└── color-palette.tsx   ← "use client"
```

TOOLS 데이터 구조:
```typescript
interface Tool {
  slug: string;
  title: string;
  description: string;
  icon: UIIconType;
  category: "formatter" | "encoder" | "design";
  relatedBlog?: { slug: string; title: string; description: string };
}
```

JSON Formatter 핵심:
```
입력(textarea) → JSON.parse (try/catch) → JSON.stringify(parsed, null, indent) → 출력(pre) + 복사 버튼
```

Base64 핵심:
```
encode: btoa(unescape(encodeURIComponent(input)))  // UTF-8 안전
decode: decodeURIComponent(escape(atob(input)))
```

Color Palette 핵심:
```
기본색(hex) → HSL 변환 → 보색(H+180°), 유사색(H±30°), 삼색(H±120°) 생성
각 swatch: hex/rgb/hsl 값 + 복사 기능
```

### Phase 4: 수학 게임 문제 생성

```typescript
interface Problem {
  a: number;
  b: number;
  operator: "+" | "−" | "×" | "÷";
  answer: number;
}

// 나눗셈 정수 보장:
// b = random(2, max), answer = random(1, max)
// a = b × answer → a ÷ b = answer (항상 정수)
```

Phase 상태:
```
idle → [난이도 선택 + 시작] → playing(60초) → result
```

### Phase 6: 데일리 챌린지 시드 로직

```typescript
// Mulberry32 PRNG - 날짜 시드로 매일 동일 결과
function seededRandom(seed: number): () => number { ... }

function getDailyGame(): Game {
  const today = new Date();
  const seed = today.getFullYear() * 10000
    + (today.getMonth() + 1) * 100
    + today.getDate();
  const rng = seededRandom(seed);
  return GAMES[Math.floor(rng() * GAMES.length)];
}
```

localStorage 스키마:
```typescript
interface StreakData {
  lastPlayed: string;   // "YYYY-MM-DD"
  streak: number;       // 연속 방문일
  totalPlayed: number;  // 총 플레이 횟수
}
```

### Phase 7: 정렬 시각화 사전 계산

```typescript
interface BarState {
  value: number;
  state: "default" | "comparing" | "sorted" | "pivot";
}

// 정렬 전 과정을 미리 계산
function getBubbleSortSteps(arr: number[]): BarState[][] { ... }
function getQuickSortSteps(arr: number[]): BarState[][] { ... }
function getMergeSortSteps(arr: number[]): BarState[][] { ... }

// 애니메이션: steps 배열을 setInterval로 순회
```

## 6. Implementation Order

### Phase 1: 게임 결과 공유 (의존성 없음)
1. **P1-01, P1-02**: `lib/share.ts` 생성 — 공유 텍스트 + 클립보드 유틸리티
2. **P1-03**: `components/game/share-result.tsx` 생성 — ShareResult 컴포넌트
3. **P1-04~P1-06**: reaction, color-memory, color-sense 게임에 통합 (결과 화면)
4. **P1-07~P1-09**: dice, lotto, animal-face 게임에 통합

### Phase 2: 타이핑 스피드 게임 (Phase 1 권장)
5. **P2-01**: icons.tsx — `keyboard` 아이콘 추가
6. **P2-02, P2-03**: constants.ts — GAMES + FOOTER_SECTIONS 등록
7. **P2-04**: game-content.ts — typing 콘텐츠 추가
8. **P2-05~P2-12**: `components/game/typing-game.tsx` 생성 — 전체 게임 구현
9. **P2-13**: [slug]/page.tsx — dynamic import 등록

### Phase 3: 개발자 유틸리티 도구 (의존성 없음)
10. **P3-10**: icons.tsx — braces, code, palette 아이콘 추가
11. **P3-01~P3-03**: constants.ts — NAV_LINKS, FOOTER_SECTIONS, TOOLS 배열
12. **P3-04**: `app/tools/page.tsx` 생성 — 도구 허브
13. **P3-05**: `app/tools/[slug]/page.tsx` 생성 — 개별 도구 라우트
14. **P3-06**: `components/tools/json-formatter.tsx` 생성
15. **P3-07**: `components/tools/base64-tool.tsx` 생성
16. **P3-08**: `components/tools/color-palette.tsx` 생성
17. **P3-09**: sitemap.ts — /tools 페이지 추가

### Phase 4: 수학 암산 게임 (Phase 1 권장)
18. **P4-01**: icons.tsx(`calculator`), constants.ts, game-content.ts, [slug]/page.tsx 등록
19. **P4-02~P4-07**: `components/game/math-game.tsx` 생성 — 전체 게임 구현

### Phase 5: 콘텐츠 간 연결 강화 (Phase 3 필요)
20. **P5-03**: constants.ts — Tool 인터페이스에 relatedBlog? 추가
21. **P5-04**: 이력서 페이지에 포트폴리오 섹션 추가

### Phase 6: 데일리 챌린지 (의존성 없음)
22. **P6-01~P6-03**: `lib/daily.ts` 생성 — 시드 난수 + 스트릭 관리
23. **P6-04, P6-05**: `components/home/daily-challenge.tsx` 생성 + home-page.tsx 통합

### Phase 7: 알고리즘 시각화 (Phase 3 필수)
24. **P7-01**: constants.ts(TOOLS), icons.tsx(`chart-bar`), [slug]/page.tsx 등록
25. **P7-02~P7-06**: `components/tools/sort-visualizer.tsx` 생성

### Phase 8: 퍼스널리티 퀴즈 (Phase 1 권장)
26. **P8-01**: icons.tsx(`sparkles`), constants.ts, game-content.ts, [slug]/page.tsx 등록
27. **P8-02~P8-06**: `components/game/personality-quiz.tsx` 생성

### 검증 (각 Phase 후)
- `pnpm lint` 실행
- `pnpm build` 실행

## 7. Affected Files

### 신규 생성 파일

| 파일 | Phase | 설명 |
|------|-------|------|
| `apps/web/lib/share.ts` | 1 | 공유 유틸리티 |
| `apps/web/components/game/share-result.tsx` | 1 | 공유 버튼 컴포넌트 |
| `apps/web/components/game/typing-game.tsx` | 2 | 타이핑 게임 |
| `apps/web/app/tools/page.tsx` | 3 | 도구 허브 |
| `apps/web/app/tools/[slug]/page.tsx` | 3 | 개별 도구 라우트 |
| `apps/web/components/tools/json-formatter.tsx` | 3 | JSON 포매터 |
| `apps/web/components/tools/base64-tool.tsx` | 3 | Base64 도구 |
| `apps/web/components/tools/color-palette.tsx` | 3 | 색상 팔레트 |
| `apps/web/components/game/math-game.tsx` | 4 | 수학 게임 |
| `apps/web/lib/daily.ts` | 6 | 데일리 챌린지 로직 |
| `apps/web/components/home/daily-challenge.tsx` | 6 | 데일리 위젯 |
| `apps/web/components/tools/sort-visualizer.tsx` | 7 | 정렬 시각화 |
| `apps/web/components/game/personality-quiz.tsx` | 8 | 퍼스널리티 퀴즈 |

### 수정 파일

| 파일 | Phase | 수정 내용 |
|------|-------|----------|
| `apps/web/components/ui/icons.tsx` | 2,3,4,7,8 | UIIconType 확장 + SVG 추가 (keyboard, braces, code, palette, calculator, chart-bar, sparkles) |
| `apps/web/lib/constants.ts` | 2,3,4,5,8 | GAMES, NAV_LINKS, FOOTER_SECTIONS, TOOLS 배열 추가/수정 |
| `apps/web/lib/game-content.ts` | 2,4,8 | typing, math, quiz 콘텐츠 추가 |
| `apps/web/app/game/[slug]/page.tsx` | 2,4,8 | dynamic import + GAME_COMPONENTS 등록 |
| `apps/web/app/sitemap.ts` | 3 | /tools 허브 + 개별 도구 페이지 |
| `apps/web/components/game/reaction-game.tsx` | 1 | ShareResult 통합 |
| `apps/web/components/game/color-memory-game.tsx` | 1 | ShareResult 통합 |
| `apps/web/components/game/color-sense-game.tsx` | 1 | ShareResult 통합 |
| `apps/web/components/game/dice-game.tsx` | 1 | ShareResult 통합 |
| `apps/web/components/game/lotto-game.tsx` | 1 | ShareResult 통합 |
| `apps/web/components/game/animal-face.tsx` | 1 | ShareResult 통합 |
| `apps/web/components/home/home-page.tsx` | 6 | DailyChallenge 위젯 삽입 |

## 8. Phase 의존성 맵

```
Phase 1 (결과 공유) ─── 독립 (다른 Phase에서 ShareResult 재사용)
     │
     ├── Phase 2 (타이핑) ─── Phase 1 권장
     ├── Phase 4 (수학) ─── Phase 1 권장
     └── Phase 8 (퀴즈) ─── Phase 1 권장

Phase 3 (도구 섹션) ─── 독립
     │
     ├── Phase 5 (연결 강화) ─── Phase 3 필요
     └── Phase 7 (시각화) ─── Phase 3 필수

Phase 6 (데일리) ─── 독립
```

## 9. Risks & Mitigation

| 리스크 | 영향 | 확률 | 대응 |
|--------|------|------|------|
| NAV_LINKS 추가 시 헤더 레이아웃 깨짐 | MEDIUM | LOW | 4개 디자인 헤더 모두 NAV_LINKS 이터레이션으로 자동 반영, 5개 항목 테스트 |
| 타이핑 게임 모바일 키보드 UX | MEDIUM | MEDIUM | textarea 자동 포커스 + 화면 키보드 대응 테스트 |
| JSON Formatter 대용량 입력 성능 | LOW | LOW | 입력 크기 제한 (1MB) 또는 디바운스 적용 |
| 데일리 챌린지 시드 충돌 | LOW | LOW | Mulberry32 PRNG은 충분한 분산 보장 |
| 정렬 시각화 큰 배열 성능 | MEDIUM | LOW | 최대 100개 제한, 사전 계산으로 렌더링 분리 |
| 퍼스널리티 퀴즈 질문 품질 | MEDIUM | MEDIUM | 검증된 성격 유형 프레임워크 참고, 반복 테스트 |
| 전체 번들 사이즈 증가 | MEDIUM | LOW | 모든 게임/도구가 dynamic import, 코드 스플리팅 자동 적용 |

## 10. Dependencies

| 패키지 | 버전 | 용도 |
|--------|------|------|
| (없음) | - | 외부 의존성 추가 없음, 기존 프로젝트 라이브러리만 사용 |

기존 사용 라이브러리:
- `react` (useState, useRef, useCallback, useEffect)
- `framer-motion` (motion, AnimatePresence)
- `tailwindcss` (유틸리티 클래스)
- `next/dynamic` (코드 스플리팅)
- `next/link` (내부 링크)

---

**Created**: 2026-03-05
**Feature**: content-expansion
**Phase**: Plan
**Source**: `docs/brainstorm/content-expansion.brainstorm.md`
