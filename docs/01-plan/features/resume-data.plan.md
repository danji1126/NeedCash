# Plan: resume-data

> resume.txt 원본 데이터를 JSON으로 정형화하고 Resume 페이지에서 실제 데이터로 사용

- **작성일**: 2026-02-02
- **Feature**: resume-data
- **Level**: Starter
- **소스 데이터**: `docs/data/resume.txt`

---

## 1. 배경 및 목표

### 현재 상태
- Resume 데이터가 `apps/web/lib/constants.ts`에 더미 데이터("홍길동")로 하드코딩되어 있음
- `Experience` 인터페이스가 단순함 (company, role, period, description)
- 실제 경력 데이터는 `docs/data/resume.txt`에 비정형 텍스트로 존재

### 목표
1. `resume.txt`를 분석하여 구조화된 `resume.json` 생성
2. `apps/web/data/` 폴더 생성 후 JSON 파일 배치
3. `constants.ts`의 더미 데이터를 제거하고 JSON에서 import
4. Resume 페이지/컴포넌트가 실제 데이터를 표시하도록 연결

---

## 2. 데이터 분석 (resume.txt)

### 경력 회사 분류 (4개 회사)

| # | 회사명 | 기간 | 비고 |
|---|--------|------|------|
| 1 | SGCNS(주) | 2007.08 ~ 2014.03 | 조선해양 SI |
| 2 | 성동조선해양(주) 정보기술 | 2014.06 ~ 2017.10 | 사내 IT부서 |
| 3 | 대우정보시스템(주) | 2018.07 ~ 2022.03 | 조선해양 ERP SI |
| 4 | 동국시스템즈 | 2022.05 ~ 2024.10 | 철강 SI + 자체 제품 |

### 프로젝트 총 수: 약 27개 (상세 섹션 기준)

### 기술 스택 추출

**Frontend**:
- HTML, CSS, JavaScript, Prototype.js, jQuery
- JSP, JSTL
- Nexacro 14/17, Xplatform, MiPlatform
- React, Tailwind CSS

**Backend**:
- Java, Spring 2.5, Spring Boot
- iBatis/MyBatis, 전자정부프레임워크
- NestJS, Node.js, PHP
- PowerBuilder, Pro*C

**Database**:
- Oracle (10g, 11g), Tibero, MongoDB, SQL Server

**Mobile**:
- Android, Node.js (서버)

**Infra/Tool**:
- HP UNIX, Windows Server, Ubuntu
- SharePoint 2010, ASP.NET(C#)

---

## 3. JSON 스키마 설계

### 파일 위치: `apps/web/data/resume.json`

```jsonc
{
  "name": "배진",
  "title": "풀스택 개발자",
  "bio": "17년차 조선해양/제조 SI 및 웹 시스템 개발 전문가",

  "experience": [
    // 회사 단위로 그룹핑, 최신순 정렬
    {
      "company": "동국시스템즈",
      "role": "시스템 분석/설계/개발",
      "period": "2022.05 ~ 2024.10",
      "description": "동국제강 F-Project 및 Oasis Flow(BPGOAT) 개발",
      "projects": [
        {
          "name": "F-Project 2차",
          "client": "동국제강/동국시스템즈",
          "period": "2024.05 ~ 2024.10",
          "description": "제철소 통합관리 시스템 2차 고도화",
          "role": "시스템 분석/설계/개발",
          "teamSize": null,
          "techStack": ["Java", "Nexacro 17", "Spring Boot", "Tibero"]
        },
        // ...
      ]
    },
    // ...
  ],

  "skills": [
    // resume.txt에서 추출한 실제 기술 스택
    // 사용 빈도와 최근 사용 여부로 level 산정
    { "name": "Java", "level": 5, "category": "Backend" },
    { "name": "Spring/Spring Boot", "level": 5, "category": "Backend" },
    { "name": "Oracle", "level": 5, "category": "Database" },
    { "name": "React", "level": 4, "category": "Frontend" },
    { "name": "NestJS", "level": 4, "category": "Backend" },
    { "name": "Nexacro", "level": 5, "category": "Frontend" },
    { "name": "JavaScript", "level": 5, "category": "Frontend" },
    { "name": "Node.js", "level": 4, "category": "Backend" },
    { "name": "Tailwind CSS", "level": 4, "category": "Frontend" },
    { "name": "MongoDB", "level": 3, "category": "Database" },
    { "name": "Tibero", "level": 3, "category": "Database" },
    { "name": "Android", "level": 3, "category": "Mobile" },
    { "name": "TypeScript", "level": 4, "category": "Frontend" }
  ],

  "education": [],

  "contact": {
    "email": null,
    "github": null
  }
}
```

### 타입 확장 (TypeScript 인터페이스)

```typescript
// 기존 Experience 인터페이스를 확장
export interface Project {
  name: string;
  client: string;
  period: string;
  description: string;
  role: string;
  teamSize: number | null;
  techStack: string[];
}

export interface Experience {
  company: string;
  role: string;
  period: string;
  description: string;
  projects?: Project[];  // 신규 - 상세 프로젝트 목록
}

export interface Skill {
  name: string;
  level: number;
  category: "Frontend" | "Backend" | "Database" | "Mobile" | "Tool";
  // category에 "Database"와 "Mobile" 추가
}
```

---

## 4. 수정 대상 파일

| # | 파일 | 작업 |
|---|------|------|
| 1 | `apps/web/data/resume.json` | **신규 생성** - 정형화된 JSON 데이터 |
| 2 | `apps/web/lib/constants.ts` | RESUME 더미 데이터 제거, JSON import로 교체 |
| 3 | `apps/web/lib/constants.ts` | `Experience` 인터페이스에 `projects?` 필드 추가, `Skill.category`에 "Database"/"Mobile" 추가 |
| 4 | `apps/web/app/resume/page.tsx` | 프로젝트 상세 섹션 추가 (선택적 토글/확장) |
| 5 | `apps/web/components/resume/timeline.tsx` | 프로젝트 하위 목록 표시 지원 |

---

## 5. 구현 순서

### Step 1: 데이터 폴더 및 JSON 생성
- `apps/web/data/` 디렉토리 생성
- `resume.txt`의 상세 섹션(99행~) 기준으로 27개 프로젝트를 4개 회사로 그룹핑
- 최신순(2024→2007) 정렬로 `resume.json` 작성

### Step 2: TypeScript 타입/인터페이스 수정
- `constants.ts`의 `Skill.category`에 `"Database" | "Mobile"` 추가
- `Experience`에 `projects?: Project[]` 추가
- `Project` 인터페이스 신규 정의

### Step 3: 데이터 연결
- `constants.ts`에서 `RESUME` 더미 데이터 제거
- `resume.json`을 import하여 `RESUME` 상수 생성
- 타입 호환성 확인

### Step 4: Resume 페이지 업데이트
- Timeline 컴포넌트에 프로젝트 하위 목록 표시 (접이식)
- 기술스택 태그 표시
- SkillChart의 category 확장 반영

### Step 5: 빌드 검증
- `pnpm build` 성공 확인
- Resume 페이지 정상 렌더링 확인

---

## 6. 주의사항

- **개인정보**: resume.txt에 실제 URL이 포함됨. JSON에는 프로젝트명과 설명만 포함하고, 내부 URL은 제외
- **교육 정보**: resume.txt에 학력 정보가 없음. `education` 필드는 빈 배열 유지
- **연락처**: resume.txt에 연락처 정보가 없음. `contact` 필드는 null 유지
- **프로젝트 수**: 27개 전체를 넣되, Timeline에는 회사별 요약만 표시하고, 상세는 토글로 볼 수 있게 함
- **JSON import**: Next.js에서 `.json` 파일은 자동으로 import 가능 (`import data from './data.json'`)
- **Skill level 산정 기준**:
  - 5: 10년+ 사용 또는 핵심 기술 (Java, Spring, Oracle, Nexacro, JavaScript)
  - 4: 3년+ 사용 또는 최근 주력 (React, NestJS, Node.js, TypeScript, Tailwind)
  - 3: 1~3년 사용 (MongoDB, Tibero, Android)

---

## 7. 예상 결과

- `apps/web/data/resume.json`: 실제 경력 데이터 (4개 회사, 27개 프로젝트, 13개+ 기술스택)
- Resume 페이지에 실제 17년차 개발자 이력이 표시됨
- 회사별 타임라인 + 프로젝트 상세 토글
- 실제 기술 스택 기반 스킬 차트

---

*Generated by PDCA Plan Phase*
