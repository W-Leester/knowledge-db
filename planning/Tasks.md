# KnowledgeDB App — 개발 체크리스트 (Tasks)

> **살아있는 작업 목록.** 작업을 마칠 때마다 체크하고, 새 할 일이 생기면 해당 Phase에 추가한다.
> 계획의 "왜"는 `docs/04_개발_로드맵.md`, 구현의 "어떻게"는 `docs/05_설계문서.md` 참조.
>
> 표기: `[x]` 완료 · `[ ]` 대기 · `[~]` 진행 중 · ~~취소선~~ 폐기
> 마지막 갱신: 2026-07-17

---

## Phase 0 — 요구사항·설계 ✅ 완료

- [x] 요구사항 체크리스트(D1~D7) 답변 및 확정
- [x] 요구사항정의서 v1.0 확정 (`docs/01`)
- [x] 기술 방식 확정: PWA (`docs/02`, `docs/03`)
- [x] 설계문서 v1.0 작성 (`docs/05`)

## Phase 0.5 — 개발 환경 구성 ✅ 완료 (2026-07-17)

**완료 기준: `git push`만으로 GitHub에 올라가는 상태 (Pages 활성화는 Phase 2)**

### 확인 완료 (조치 불필요)
- [x] git 설치 (2.52.0) + user.name/email 설정 확인
- [x] GitHub 계정 존재 확인 — `W-Leester` (github.com/W-Leester)
- [x] Git Credential Manager 2.6.1 설치 확인 (첫 push 때 브라우저 로그인 1회면 이후 자동)
- [x] Node.js v24.11.1 확인 (Phase 4 도구용)

### 남은 조치
- [x] `.gitignore` 작성 (zip·OS 잡동사니 제외)
- [x] `Knowledge_DB` 폴더 `git init`(main) + 첫 커밋 `c2e88f8` (46개 파일)
- [x] remote 연결: `origin = https://github.com/W-Leester/knowledge-db.git`
- [x] GitHub 저장소 `knowledge-db` 생성 + 첫 push 완료 (main → origin/main 추적 설정)
- ~~(선택) gh CLI 설치~~ (웹 생성 방식 선택으로 불필요)

## Phase 0.6 — 저장소 구조 개편 ✅ 완료 (2026-07-17)

- [x] 문서 HTML 4개 + SVG(구 `Docs/img`) → `docs/`·`docs/img/`로 이동 (루트는 앱 셸만)
- [x] `KnowledgeDB_App/` → `planning/` 이름 변경, 빈 `MyRecords.md` 삭제
- [x] 경로 일괄 갱신: 문서 내 `../assets/`·`img/`, docs.json, index.html noscript, app.js 홈 버튼, dark.css SVG 매트 셀렉터
- [x] `CLAUDE.md` 추가 (Claude Code용 저장소 가이드) 및 새 구조 반영

## Phase 1 — 콘텐츠·공통 기반 (진행 중)

**완료 기준(M1): PC DevTools 모바일 뷰에서 전 문서가 폰트 포함 로컬 자원만으로 깨짐 없이 표시**

### 1A. 완료된 것
- [x] 전 문서(5개) 모바일 반응형 적용·점검
- [x] `index.html` 홈 화면 생성
- ~~원본 → `content/` 복사 빌드 스크립트~~ (폐기 — Knowledge_DB 루트 직접 배포로 설계 변경)

### 1B. docs.json — 문서 매니페스트 (설계 4.1) ✅
- [x] 스키마대로 `docs.json` 작성 — 문서 4개 항목 (SVG 자산 32개 grep 추출·실존 검증 완료)
- [x] `index.html`을 docs.json 기반 JS 렌더링으로 전환 + fetch 실패 안내
- [x] `<noscript>` 정적 링크 목록 추가 (JS 실패 폴백)

### 1C. 폰트 로컬화 (NFR-02, 설계 3장) ✅
- [x] Pretendard Variable(가변·한글, ~2MB) + JetBrains Mono latin 400/500/600/700 → `assets/fonts/`
- [x] `assets/fonts.css` 작성, 문서 5개의 CDN `<link>` 치환 (외부 참조 0건 grep 확인)
- [ ] 네트워크 차단 상태에서 폰트 정상 표시 확인 → 1F에서 일괄 검증

### 1D. 다크모드 + 공통 스크립트 (FR-07, FR-09, 설계 4.4~4.5) ✅ (검증 제외)
- [x] `assets/dark.css` — 토큰 오버라이드 + 사이드바/헤더 개별 보정 + SVG 라이트 매트 처리
- [x] `assets/app.js` — 테마 3단 토글(시스템/라이트/다크), 읽던 위치 저장·이어읽기 토스트, 최근 문서 기록, ⌂ 홈 버튼 (좌하단 플로팅)
- [x] FOUC 방지 인라인 스니펫 + 문서 5개 head 패치 (테마 토글은 index 포함 전 페이지 공통 플로팅 버튼으로 통일)
- [ ] 전 문서 다크모드에서 대비·가독성 점검 (SVG 포함) → 1F에서 일괄 검증

### 1E. 아이콘 ✅
- [x] PWA 아이콘 생성: 네이비 그라데이션 + "K" 모노그램 + 베이지 바 (`icons/icon-192.png`, `icon-512.png`, `maskable-512.png`)

### 1F. 검증 (남음)
- [ ] 로컬 서버(`npx serve`) 또는 Pages 배포 후, 모바일 뷰(360px)로 전 문서 + 홈 점검
- [ ] 다크모드 전 문서 가독성 점검, 오프라인 폰트 확인 → **M1 달성**

## Phase 2 — 배포·PWA 설치 (MVP)

**완료 기준(M2): Galaxy S25 홈 화면 아이콘으로 문서를 열어볼 수 있다**

- ~~.gitignore / git init / 저장소 생성·push~~ → Phase 0.5로 이동
- [x] `manifest.webmanifest` 작성 + `index.html`에 링크·파비콘 (설계 4.6) — Phase 1과 함께 선행 완료
- [x] GitHub Pages 활성화 완료 → **https://w-leester.github.io/knowledge-db/**
- [x] 배포 검증: 핵심 리소스 16종(HTML·docs.json·폰트·아이콘·SVG·manifest) 전부 200 + 정상 MIME 확인
- [ ] 폰 테스트 ①: Chrome에서 접속 → 설치 배너/홈 화면에 추가 → 앱 서랍·전체화면 확인
- [ ] 폰 테스트 ②: Samsung Internet에서 동일 확인 (NFR-08)
- [ ] 새 문서 추가 리허설: 더미 문서 + docs.json 항목 → push → 폰에서 등장 확인 → 더미 제거
- [ ] **M2 달성** → 이 시점부터 실사용 가능

## Phase 3 — 오프라인·편의 기능

**완료 기준(M3): 다운로드해둔 문서를 비행기 모드에서 열람할 수 있다**

### 3A. Service Worker (설계 4.2)
- [ ] `sw.js` 골격 + 등록 코드 (index.html)
- [ ] 앱 셸 사전 캐싱 (`kdb-shell-v{n}`: index, docs.json, assets/*, icons/*)
- [ ] 문서 network-first + 캐시 폴백
- [ ] 오프라인 폴백 안내 페이지 (미다운로드 문서용)
- [ ] SW 버전 갱신 시 구버전 셸 캐시 정리

### 3B. 다운로드 버튼 (FR-06, 설계 4.3)
- [ ] 카드에 ⬇ 버튼 → 문서+SVG+폰트 `kdb-docs` 캐시에 저장
- [ ] 저장됨(✓)·진행 중 상태 표시, 저장 여부 판정 로직
- [ ] 다운로드 문서 cache-first 서빙
- [ ] version 비교 → "업데이트" 배지 + 재다운로드
- [ ] 다운로드 삭제 UI
- [ ] **비행기 모드 실기기 테스트 → M3 달성**

### 3C. 편의 기능
- [x] 홈 화면 제목/태그 검색바 (FR-08) — 2026-07-22 구현 (index.html 헤더 검색바, docs.json title/desc/tags/group/id 클라이언트 필터)
- [x] 문서 내 단어 찾기 (기획 외 추가) — 2026-07-22 구현 (app.js가 전 문서에 우상단 🔍 플로팅 버튼 주입, Custom Highlight API 하이라이트 + 이전/다음 이동 + 아코디언 자동 펼침)
- [ ] 홈 화면 "최근 본 문서" 섹션 (FR-07)
- [ ] 이어서 읽기 토스트 동작 확인 (app.js는 Phase 1에서 작성됨)

## Phase 4 — 부가 기능 (선택·순서 무관)

- [ ] 본문 전체 검색: `tools/build-search-index.js` + 홈 검색 연동 (FR-10)
- [ ] 즐겨찾기·북마크 (FR-11)
- [ ] 태그/카테고리 필터 (FR-12)

## Backlog / 아이디어 (미확정)

- [ ] 지인 배포 시작 시: 사용 안내 한 페이지 (설치 방법)
- [ ] Play 스토어 배포가 필요해지면: TWA(Bubblewrap) 포장 — `docs/02` 참조
- [ ] 문서 추가 자동화: docs.json 항목 생성 스크립트 (`tools/`)

---

## 진행 현황 요약

| Phase | 상태 | 마일스톤 |
|---|---|---|
| 0 요구사항·설계 | ✅ 완료 | — |
| 0.5 환경 구성 | ✅ 완료 (repo: github.com/W-Leester/knowledge-db) | push 가능 상태 ✅ |
| 1 콘텐츠·공통 기반 | 🔄 진행 중 (1A 완료) | M1: 로컬 자원만으로 전 문서 정상 표시 |
| 2 배포·PWA 설치 | ⬜ 대기 | **M2: 폰에서 열람 (실질 목표)** |
| 3 오프라인·편의 | ⬜ 대기 | M3: 비행기 모드 열람 |
| 4 부가 기능 | ⬜ 대기 | — |
