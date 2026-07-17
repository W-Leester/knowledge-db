# KnowledgeDB App

Knowledge_DB 폴더의 HTML 지식 문서들을 **핸드폰에서 열람**하기 위한 앱 프로젝트.

## 폴더 구조

> 2026-07-17 저장소 구조 개편: `KnowledgeDB_App/` → `planning/`, 문서 HTML·SVG는 루트 → `docs/`로 이동.

```
planning/                              ← 이 폴더 (기획/설계 문서 전용, 앱 소스 아님)
├── README.md                          ← 이 파일 (프로젝트 개요 + 진행 가이드)
├── Tasks.md                           ← ★ 개발 체크리스트 (Phase별 작업 목록, 작업 시 여기부터)
└── docs/                              ← 기획/설계 문서
    ├── 01_요구사항정의서.md            ← 기능/비기능 요구사항
    ├── 02_기술방식_비교.md             ← PWA vs 웹뷰 앱 vs 네이티브 비교 + 추천
    ├── 03_결정필요사항_체크리스트.md    ← 답변 완료 (D1~D7 확정)
    ├── 04_개발_로드맵.md               ← 단계별 개발 계획
    └── 05_설계문서.md                  ← ★ 아키텍처·컴포넌트 설계 (PWA 구조, 캐싱, docs.json)

※ 앱의 실제 소스는 저장소 루트에 위치한다 — 루트 = 앱 셸(index.html, docs.json,
   manifest, assets/, icons/), 지식 문서는 docs/*.html + docs/img/*.svg.
   설계문서 3장의 트리는 개편 전 기준이므로 현재 구조는 루트 CLAUDE.md 참조.
```

## 현재 상태

> 세부 진행 상황은 **`Tasks.md`** 에서 관리한다 (아래는 큰 흐름만).

- [x] 프로젝트 폴더 생성, 기획 문서 작성
- [x] 결정필요사항 체크리스트 답변 완료 (2026-07-17)
- [x] 기술 방식 확정: **PWA** (GitHub Pages + 홈 화면 추가, Android/Galaxy S25 기준)
- [x] 설계문서 작성 (`docs/05_설계문서.md`)
- [x] Phase 1 일부: 전 문서 모바일 반응형 + index.html 홈 화면 (별도 세션에서 완료)
- [ ] **← 지금 여기: Phase 1 잔여 — docs.json, 폰트 로컬화, dark.css/app.js, 아이콘**
- [ ] Phase 2: MVP 개발
- [ ] Phase 3: 동기화/오프라인
- [ ] Phase 4: 부가 기능

## 진행 방법

요구사항(v1.0)과 기술 방식(PWA)이 확정됐다. 이후는 `docs/04_개발_로드맵.md`의
Phase 순서대로 진행하면 된다:

1. **Phase 1** — 콘텐츠 준비: `content/` 빌드 스크립트, 폰트 로컬화, 반응형 보완, 홈 화면 생성
2. **Phase 2** — GitHub Pages 배포 + PWA 설치 (폰에서 열람 가능 = 실질 목표 달성)
3. **Phase 3** — 문서 다운로드·오프라인, 읽던 위치, 검색, 다크모드
4. **Phase 4** — 전체 검색, 북마크, 태그

Claude Code에게 "Phase 1 시작하자"라고 요청하면 이어서 진행할 수 있다.
