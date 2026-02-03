# Plan: animal-face

> Teachable Machine 이미지 분류 모델을 활용한 "동물상 찾기" 게임 추가

## 1. Overview

### Purpose
웹캠으로 셀카를 촬영하면 Teachable Machine AI 모델이 사용자의 동물상(강아지/고양이/여우)을 분석해주는 인터랙티브 게임을 기존 게임 허브에 추가한다.

### Background
- 프로젝트: NeedCash (Next.js 16 + React 19 + Static Export)
- 모델: Google Teachable Machine Image Classification
- 모델 URL: `https://teachablemachine.withgoogle.com/models/V9poYecHi/`
- 분류 클래스: `dog` (강아지상), `cat` (고양이상), `fox` (여우상)
- 기존 게임: Dice Roller, Lotto Pick (동일 패턴으로 추가)

## 2. Scope

### In Scope
- `@teachablemachine/image`, `@tensorflow/tfjs` 의존성 설치
- 게임 메타데이터 등록 (GAMES 배열, GAME_COMPONENTS 매핑)
- AnimalFaceGame 클라이언트 컴포넌트 구현
  - 웹캠 연동 (전면 카메라, 모바일 대응)
  - TM 모델 로딩 및 이미지 분류
  - 결과 표시 (동물상 이름, 신뢰도 바, 성격 설명)
  - 히스토리 기능 (최근 10건)
- 에러 처리 (카메라 권한 거부, 모델 로딩 실패 등)

### Out of Scope
- 모델 재학습 또는 클래스 추가
- 사진 저장/공유 기능
- 서버 사이드 추론
- 다국어 지원 (향후 i18n 확장 시 추가)

## 3. Requirements

### Functional Requirements

| ID | 요구사항 | 우선순위 | 설명 |
|----|---------|---------|------|
| FR-01 | GAMES 배열에 animal-face 게임 등록 | HIGH | slug, title, description, emoji 메타데이터 |
| FR-02 | AnimalFaceGame 컴포넌트 dynamic import 등록 | HIGH | `app/game/[slug]/page.tsx`의 GAME_COMPONENTS에 추가 |
| FR-03 | 웹캠 연동 | CRITICAL | getUserMedia로 전면 카메라 접근, 실시간 프리뷰 |
| FR-04 | Teachable Machine 모델 로딩 | CRITICAL | 외부 CDN에서 모델 동적 로드, 로딩 상태 표시 |
| FR-05 | 이미지 분류 및 결과 표시 | CRITICAL | 캡처 → 예측 → 동물상(dog/cat/fox) + 신뢰도 표시 |
| FR-06 | 신뢰도 바 시각화 | HIGH | 3개 클래스의 확률을 애니메이션 바로 표시 |
| FR-07 | 동물상 성격 설명 표시 | MEDIUM | 각 동물상별 재미있는 성격 설명 텍스트 |
| FR-08 | 히스토리 기능 | MEDIUM | 최근 10건 결과 기록, 기존 게임 패턴 동일 |
| FR-09 | 에러 처리 | HIGH | 카메라 권한 거부, 미감지, 모델 로딩 실패 대응 |
| FR-10 | 모바일 카메라 대응 | HIGH | facingMode: "user", iOS 호환성 처리 |

### Non-Functional Requirements

| ID | 요구사항 |
|----|---------|
| NFR-01 | 기존 게임(Dice, Lotto) 동작에 영향 없어야 함 |
| NFR-02 | 빌드 성공 (`pnpm build`) - `/game/animal-face` 정적 페이지 생성 |
| NFR-03 | 린트 통과 (`pnpm lint`) |
| NFR-04 | TensorFlow.js 번들은 해당 페이지 진입 시에만 로드 (code splitting) |
| NFR-05 | 웹캠 리소스 정리 (컴포넌트 언마운트 시 카메라 해제) |

## 4. Success Criteria

| 기준 | 목표 |
|------|------|
| CRITICAL FR 해결 | 3/3 (FR-03, FR-04, FR-05) |
| HIGH FR 해결 | 5/5 (FR-01, FR-02, FR-06, FR-09, FR-10) |
| MEDIUM FR 해결 | 2/2 (FR-07, FR-08) |
| 빌드 성공 | Pass |
| 린트 통과 | Pass |
| 기존 기능 회귀 | 0건 |
| 게임 허브 페이지에 3번째 게임 표시 | Pass |

## 5. Technical Design

### 게임 흐름 (Phase State Machine)

```
idle → [카메라 시작] → loading → [모델+웹캠 준비] → camera → [촬영] → analyzing → [예측 완료] → result → [다시 하기] → camera
```

### 의존성
```bash
pnpm add @teachablemachine/image @tensorflow/tfjs
```

### 모델 연동
- `@teachablemachine/image`의 `tmImage.load(modelURL, metadataURL)` 사용
- `tmImage.Webcam(300, 300, true)` 으로 웹캠 제어
- `model.predict(canvas)` 으로 이미지 분류
- 모델은 useRef로 관리 (리렌더 방지)

### 동물상 데이터

| 클래스 | 이모지 | 이름 | 설명 |
|--------|-------|------|------|
| dog | 🐶 | 강아지상 | 충성스럽고 활발한 에너지! 사교적이고 따뜻한 성격으로 주변 사람들에게 사랑받는 타입 |
| cat | 🐱 | 고양이상 | 독립적이고 신비로운 매력! 차분하고 우아한 분위기로 자신만의 세계가 확실한 타입 |
| fox | 🦊 | 여우상 | 영리하고 매력적인 인상! 날카로운 관찰력과 재치로 사람들의 시선을 사로잡는 타입 |

### UI 구성 (Phase별)

| Phase | 화면 요소 |
|-------|----------|
| idle | 게임 설명 텍스트 + "카메라 시작" 버튼 |
| loading | 펄스 애니메이션 + "모델 로딩중..." |
| camera | 웹캠 프리뷰 (300x300) + "촬영하기" 버튼 |
| analyzing | 정지된 프레임 + "분석중..." 애니메이션 |
| result | 동물 이모지(대형) + 이름 + 신뢰도 바 3개 + 성격 설명 + "다시 하기" 버튼 |

### 에러 처리

| 에러 | 메시지 |
|------|--------|
| 카메라 권한 거부 | 카메라 접근이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해 주세요. |
| 카메라 미감지 | 카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해 주세요. |
| 모델 로딩 실패 | 모델을 불러오는데 실패했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요. |
| 예측 실패 | 분석 중 오류가 발생했습니다. 다시 시도해 주세요. |

## 6. Implementation Order

### Phase 1: 의존성 및 등록
1. **FR-01**: `lib/constants.ts` - GAMES 배열에 animal-face 추가
2. **FR-02**: `app/game/[slug]/page.tsx` - dynamic import + GAME_COMPONENTS 등록

### Phase 2: 핵심 게임 컴포넌트
3. **FR-03**: 웹캠 연동 (getUserMedia, tmImage.Webcam)
4. **FR-04**: TM 모델 로딩 (tmImage.load)
5. **FR-05**: 이미지 분류 및 결과 표시

### Phase 3: UX 완성
6. **FR-06**: 신뢰도 바 시각화 (framer-motion 애니메이션)
7. **FR-07**: 동물상별 성격 설명 표시
8. **FR-08**: 히스토리 기능

### Phase 4: 안정성
9. **FR-09**: 에러 처리 (카메라, 모델, 예측)
10. **FR-10**: 모바일/iOS 대응

### Phase 5: 검증
11. `pnpm lint` 실행
12. `pnpm build` 실행 - `/game/animal-face` 페이지 생성 확인

## 7. Affected Files

| 파일 | 수정 내용 | Phase |
|------|----------|-------|
| `apps/web/lib/constants.ts` | GAMES 배열에 animal-face 추가 | 1 |
| `apps/web/app/game/[slug]/page.tsx` | dynamic import + GAME_COMPONENTS 추가 | 1 |
| `apps/web/components/game/animal-face.tsx` | 새 게임 컴포넌트 (전체 구현) | 2-4 |

## 8. Risks & Mitigation

| 리스크 | 영향 | 확률 | 대응 |
|--------|------|------|------|
| TensorFlow.js 번들 크기 (~1.5MB) | MEDIUM | HIGH | next/dynamic으로 해당 페이지만 로드 |
| @teachablemachine/image peer dep 불일치 | LOW | HIGH | tfjs 4.x와 실제 호환 가능, 경고만 발생 |
| iOS Safari 웹캠 제한 | MEDIUM | MEDIUM | playsinline + muted 속성, video 요소 직접 사용 |
| 모델 CDN 응답 지연 | LOW | LOW | 로딩 상태 UI로 대응 |
| @teachablemachine/image TypeScript 미지원 | LOW | HIGH | 인라인 declare module 선언 |

## 9. Dependencies

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `@teachablemachine/image` | ^0.8.5 | Teachable Machine 이미지 모델 로더 |
| `@tensorflow/tfjs` | ^4.22.0 | TensorFlow.js 런타임 |

---

**Created**: 2026-02-03
**Feature**: animal-face
**Phase**: Plan
