# Plan: NeedCash 프로젝트 초기화

> 프로토타입 허브 - 게임, 블로그, 광고, 이력서 등 다양한 프로토타입을 관리하는 프로젝트

## 1. 프로젝트 개요

### 비전
개인 프로토타입과 포트폴리오를 하나의 웹사이트에서 관리하는 허브 사이트.
트렌디한 디자인, 테마 전환, 반응형 레이아웃을 핵심 가치로 한다.

### 핵심 원칙
- **Backend 없이 시작**: DB/API 없이 프론트엔드만 구현, 차후 백엔드 추가 가능한 구조
- **트렌디한 디자인**: httpster, designspiration, savee, cosmos 등의 미학 반영
- **테마 변경 가능**: 다크/라이트 + 커스텀 테마 시스템
- **반응형**: 모바일 ~ 데스크톱 전 기기 대응

---

## 2. 기술 스택

### Frontend (Web)
| 기술 | 버전 | 용도 |
|------|------|------|
| **Next.js** | 15 | App Router 기반 웹 프레임워크 |
| **React** | 19 | UI 라이브러리 |
| **TypeScript** | 5.x | 타입 안전성 |
| **Tailwind CSS** | 4.x | 유틸리티 퍼스트 스타일링 |
| **next-mdx-remote** | latest | MDX 블로그 콘텐츠 렌더링 |
| **next-themes** | latest | 다크/라이트/커스텀 테마 전환 |
| **framer-motion** | latest | 페이지 전환, 스크롤 애니메이션 |

### Mobile
| 기술 | 버전 | 용도 |
|------|------|------|
| **Flutter** | 3.x | 크로스 플랫폼 모바일 앱 |
| **Dart** | 3.x | Flutter 언어 |

### 개발 도구
| 기술 | 용도 |
|------|------|
| **ESLint** (flat config) | 코드 린팅 |
| **Prettier** | 코드 포매팅 |
| **pnpm** | 패키지 매니저 |

### 차후 추가 예정 (Backend)
| 기술 | 용도 | 시기 |
|------|------|------|
| API Routes (Next.js) | 서버리스 API | 필요 시 |
| Prisma / Drizzle | ORM | DB 연결 시 |
| PostgreSQL / SQLite | 데이터베이스 | DB 연결 시 |
| NextAuth.js | 인증 | 인증 필요 시 |

---

## 3. 프로젝트 구조

```
NeedCash/
├── apps/
│   ├── web/                        # Next.js 앱 (메인)
│   │   ├── app/                    # App Router
│   │   │   ├── layout.tsx          # 루트 레이아웃 (테마, 폰트)
│   │   │   ├── page.tsx            # 메인 홈페이지
│   │   │   ├── blog/               # MDX 블로그
│   │   │   │   ├── page.tsx        # 블로그 목록
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx    # 블로그 상세
│   │   │   ├── game/               # 게임 허브
│   │   │   │   ├── page.tsx        # 게임 목록
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx    # 개별 게임
│   │   │   ├── ads/                # 광고 랜딩 페이지
│   │   │   │   └── page.tsx
│   │   │   └── resume/             # 이력서
│   │   │       └── page.tsx
│   │   ├── components/             # 공유 컴포넌트
│   │   │   ├── layout/             # Header, Footer, Nav
│   │   │   ├── ui/                 # Button, Card, Modal 등
│   │   │   └── theme/              # ThemeProvider, ThemeSwitcher
│   │   ├── content/                # MDX 블로그 콘텐츠
│   │   │   └── blog/
│   │   │       └── *.mdx
│   │   ├── lib/                    # 유틸리티
│   │   │   ├── mdx.ts              # MDX 파싱 유틸
│   │   │   └── utils.ts            # 공통 유틸
│   │   ├── styles/                 # 글로벌 스타일, 테마 변수
│   │   │   └── globals.css
│   │   ├── public/                 # 정적 파일
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   ├── eslint.config.mjs
│   │   └── package.json
│   └── mobile/
│       └── needcash_app/           # Flutter 앱
│           ├── lib/
│           ├── pubspec.yaml
│           └── ...
├── doc/                            # AI 작업 문서 및 출력물
│   ├── 01-plan/
│   ├── 02-design/
│   ├── 03-analysis/
│   └── 04-report/
├── CLAUDE.md                       # 프로젝트 지침서
├── package.json                    # 루트 (선택, 스크립트용)
└── README.md                       # 프로젝트 소개 (선택)
```

---

## 4. 페이지별 기능 정의

### 4.1 메인 홈페이지 (`/`)
- 프로젝트 소개 히어로 섹션
- 각 섹션(블로그, 게임, 광고, 이력서)으로의 네비게이션
- 최신 블로그 포스트 프리뷰
- 부드러운 스크롤 애니메이션
- 테마 전환 버튼

### 4.2 블로그 (`/blog`)
- MDX 기반 정적 블로그
- 카테고리/태그 필터링
- 코드 하이라이팅 (shiki)
- 읽기 시간 표시
- 목차 자동 생성

### 4.3 게임 허브 (`/game`)
- 게임 카드 그리드 레이아웃
- 각 게임 상세 페이지 (iframe 또는 컴포넌트 임베드)
- 간단한 웹 게임 프로토타입 호스팅

### 4.4 광고 랜딩 페이지 (`/ads`)
- A/B 테스트 가능한 랜딩 페이지 템플릿
- CTA 버튼, 히어로 이미지
- 반응형 레이아웃

### 4.5 이력서 (`/resume`)
- 인터랙티브 이력서
- 타임라인 형식 경력 표시
- 스킬 시각화
- PDF 다운로드 기능

---

## 5. 디자인 방향

### 참고 사이트 분석 종합

| 사이트 | 핵심 트렌드 |
|--------|-------------|
| **httpster** | 타이포그래피 중심, 미니멀, 비표준 레이아웃, 스크롤 인터랙션 |
| **designspiration** | 모듈식 그리드, 흑백 미학, 브랜딩 중심 |
| **savee** | 미니멀리스트, 광고 없는 깔끔함, AI 기반 정리 |
| **cosmos** | 다크 테마, 고해상도 비주얼, 세련된 타이포그래피 |

### 디자인 원칙
1. **타이포그래피 퍼스트**: 폰트 선택이 디자인의 핵심, 대담한 서체 활용
2. **미니멀 레이아웃**: 여백을 충분히 활용, 콘텐츠에 집중
3. **스크롤 인터랙션**: framer-motion으로 부드러운 등장 애니메이션
4. **다크 모드 우선**: 기본 다크 테마 + 라이트 모드 전환
5. **비표준 그리드**: 정형화되지 않은 창의적 레이아웃 활용

### 테마 시스템
```
테마 구조:
├── dark (기본)       # 다크 테마 - cosmos 스타일
├── light             # 라이트 테마 - 미니멀 화이트
├── brutalist         # 브루탈리스트 - httpster 스타일
└── custom            # 사용자 정의 (차후)
```

### 폰트 계획
- **헤딩**: 대담한 sans-serif (Satoshi, Plus Jakarta Sans, 또는 유사)
- **본문**: 가독성 높은 serif/sans-serif (Inter, Pretendard)
- **코드**: JetBrains Mono

---

## 6. 구현 우선순위

### Phase 1: 프로젝트 셋업
- [ ] Next.js 15 프로젝트 생성 (`apps/web`)
- [ ] Tailwind CSS 4 설정
- [ ] ESLint flat config 설정
- [ ] TypeScript 설정
- [ ] 폴더 구조 생성
- [ ] next-themes 테마 시스템 구축
- [ ] 글로벌 레이아웃 (Header, Footer, ThemeSwitcher)

### Phase 2: 메인 홈페이지
- [ ] 히어로 섹션
- [ ] 네비게이션 섹션
- [ ] 스크롤 애니메이션 (framer-motion)
- [ ] 반응형 레이아웃

### Phase 3: 블로그
- [ ] MDX 파이프라인 구축
- [ ] 블로그 목록 페이지
- [ ] 블로그 상세 페이지
- [ ] 코드 하이라이팅
- [ ] 샘플 포스트 작성

### Phase 4: 이력서
- [ ] 인터랙티브 타임라인
- [ ] 스킬 시각화
- [ ] PDF 내보내기

### Phase 5: 게임 허브
- [ ] 게임 카드 그리드
- [ ] 게임 상세 페이지
- [ ] 샘플 게임 임베드

### Phase 6: 광고 랜딩 페이지
- [ ] 랜딩 페이지 템플릿
- [ ] CTA 컴포넌트

### Phase 7: 모바일 앱 (Flutter)
- [ ] Flutter 프로젝트 초기화
- [ ] 웹뷰 기반 앱 또는 네이티브 UI

---

## 7. 제약 사항

- Backend/DB는 현재 구현하지 않음 (차후 추가 가능한 구조 유지)
- 블로그 콘텐츠는 MDX 파일 기반 정적 생성
- 게임은 클라이언트 사이드 렌더링
- 인증/로그인 기능 없음 (차후 추가)
- 모바일 앱은 웹 완성 후 진행

---

## 8. 성공 기준

| 항목 | 기준 |
|------|------|
| 반응형 | 모바일(320px) ~ 데스크톱(1920px) 정상 표시 |
| 테마 | 다크/라이트 최소 2개 테마 전환 가능 |
| 성능 | Lighthouse Performance 90+ |
| 접근성 | Lighthouse Accessibility 90+ |
| 디자인 | 참고 사이트 수준의 트렌디한 비주얼 |
| 페이지 | 5개 섹션 모두 동작 (홈, 블로그, 게임, 광고, 이력서) |
