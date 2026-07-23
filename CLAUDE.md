# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

개인 지식 베이스: 공부한 내용을 자립적(self-contained) 인터랙티브 HTML 문서로 정리하고, PWA로 폰에서 열람한다.

- **배포**: GitHub Pages — https://w-leester.github.io/knowledge-db/ (`main` 브랜치 root, push = 배포)
- **빌드 없음**: 번들러·프레임워크·서버 코드 금지. 푸시한 파일이 곧 서비스다.
- **외부 CDN 의존 금지** (NFR-02): 폰트 포함 모든 자원은 로컬. 폰트는 `assets/fonts/` + `assets/fonts.css`.
- 콘텐츠·문서·커밋 메시지는 한국어.

## 실행/확인

```bash
npx serve   # 로컬 서버 — index.html은 docs.json을 fetch하므로 file:// 로 직접 열면 목록이 안 뜸
```

테스트·린트 도구 없음. 검증은 브라우저(DevTools 모바일 뷰 360px, 라이트/다크 모두)로 직접 확인한다.

## 아키텍처

### docs.json = 단일 진실 공급원

문서 목록 렌더링(index.html), 검색, 다운로드할 자산 목록, 버전 갱신 감지가 전부 `docs.json` 하나에서 나온다. 각 항목: `id`(파일명에서 .html 뗀 것 — localStorage 키로도 사용), `file`, `version`(내용 수정 시 수동 +1), `assets`(문서가 참조하는 SVG 전부).

### 디렉토리 구조

- 루트 = 앱 셸: `index.html`, `docs.json`, `manifest.webmanifest`, `assets/`, `icons/` (Phase 3에서 `sw.js` 추가 예정 — SW 스코프 때문에 루트 필수)
- `docs/` = 지식 문서 HTML + `docs/img/`(문서용 SVG)
- `planning/` = 기획·설계 문서 (앱 소스 아님, 아래 참조)

### 문서 페이지 구조

각 문서(`docs/*.html`)는 자립적 HTML이며, 원본을 재작성하지 않고 head에 공통 3요소만 주입한다:

1. FOUC 방지 인라인 스니펫 (localStorage `kdb-theme` 읽어 `data-theme` 즉시 설정)
2. `../assets/fonts.css` + `../assets/dark.css` 링크
3. `../assets/app.js` (defer) — 테마 3단 토글(시스템/라이트/다크), ⌂ 홈 버튼, 읽던 위치 저장·이어읽기 토스트, 최근 문서 기록을 플로팅 UI로 주입

문서 내 이미지 참조는 `img/…`(문서 기준 상대경로), docs.json의 `assets` 배열은 `docs/img/…`(사이트 루트 기준)로 적는다.

### 디자인 시스템

전 문서가 동일한 CSS 변수 토큰(`--bg-primary`, `--navy-900` 등, Hyundai-inspired)을 쓴다 — `docs/design-system.html` 참조. 다크모드는 `assets/dark.css`가 `:root[data-theme="dark"]`에서 이 변수들만 오버라이드하는 방식이므로, 새 문서도 반드시 같은 토큰을 사용해야 한다.

### 클라이언트 저장소

localStorage 키는 `kdb-` 접두사: `kdb-theme`, `kdb-pos:{docId}`, `kdb-recent`, `kdb-dl-ver:{docId}`. Cache Storage(Phase 3 예정): `kdb-shell-v{n}`, `kdb-docs`.

### planning/ 폴더

앱의 소스가 아니라 기획·설계 문서다 (구 `KnowledgeDB_App/`, 2026-07-17 개명).

- `Tasks.md` — **살아있는 작업 체크리스트.** 작업 시작 전 여기서 현재 Phase를 확인하고, 완료하면 체크 표시로 갱신한다.
- `docs/05_설계문서.md` — 아키텍처의 "어떻게" (SW 캐싱 전략, 다운로드 버튼, 검색 설계 등 미구현 Phase 포함). 단, 3장의 디렉토리 트리는 구조 개편 전 기준.
- `docs/01~04` — 요구사항(FR/NFR 번호의 출처), 기술 비교, 로드맵

## 문서 저작 규칙 (반복 실수 방지 — 전부 실제로 겪은 것)

**새 문서는 복제로 시작한다.** 백지에서 쓰지 말고 기존 `docs/*.html`을 복제해 시작한다 — 공통 셸(디자인 토큰·사이드바·hero·카드·callout·표·figure·코드블록·아코디언·라이트박스·진행바·모바일 드로어·반응형 `@media`)이 약 250줄로 전 문서가 동일하다. 교체하는 것은 본문(hero 카피·섹션·footer)과 hero 그라데이션 색뿐.

**모바일 함정 3종** (각각 실제 버그였음):
- `body`가 flex인 문서는 `main`에 `min-width: 0` 필수 — 없으면 내부 스크롤 컨테이너가 페이지를 밀어 가로 오버플로 발생.
- 도식·표는 축소하지 말고 **가로 스크롤**: SVG는 `.fig-scroll`로 감싸고 모바일 `@media`에서 `.fig-scroll img { min-width: 660px }`. 표는 `table.ds { min-width: 600px }`, 모바일에서 `th { width: auto !important }`, 마지막 열 `min-width: 240px`, `word-break: keep-all`(한국어 어절 단위).
- Android 브라우저의 강제 다크 반전은 `dark.css`의 `color-scheme` 선언으로 차단됨 — 건드리지 말 것.

**SVG 저작.** 처음부터 모바일 가독 기준으로 그린다: viewBox 폭 ~900, 본문 글자 ≥13.5px. (다 그린 뒤 글자만 키우면 요소가 겹친다.) `font-family`는 SVG 안에 인라인. 밝은 배경 전제로 그린다 — 다크모드에서 `dark.css`가 `img[src*="img/"]`에 밝은 매트를 자동으로 깐다.

**섹션 삽입 시** 세 곳을 함께 갱신: 사이드바 TOC · 섹션 번호(및 소절 A/B/C…) · 본문 상호 참조(`§N`). 하나라도 놓치면 목차와 본문이 어긋난다.

**최신 정보·수치.** 지식 기준일 이후일 수 있는 것(신규 모델 스펙·논문·가격)은 웹 검색으로 확인하고, 검증 못 한 수치는 "개략치·확인 필요"로 표기한다. 세대마다 바뀌는 수치(대역폭·TOPS 등)는 하드코딩 금지. 문서끼리는 적극적으로 상호 링크한다.

## 운영 워크플로

이 저장소는 여러 PC에서 사용한다. **작업 시작 전 `git pull`, 작업 완료 후 커밋·push**를 기본 리듬으로 한다.

**새 문서 추가** (아래를 모두 해야 "완료"): ① 기존 문서 복제 → `docs/`에 작성 (SVG는 `docs/img/`) ② `docs.json`에 항목 추가 — `file`은 `docs/….html`, assets에 참조 SVG 전부 나열, **같은 `group`끼리 인접 배치**(홈 화면이 순회하며 라벨을 찍으므로 떨어져 있으면 라벨 중복 표시) ③ `index.html`의 `<noscript>` 폴백 목록에 링크 추가 ④ 로컬 검증(아래) ⑤ 커밋·push

**기존 문서 수정** (아래를 모두 해야 "완료"): HTML 수정 → `docs.json`의 해당 `version` +1 → 로컬 검증 → 커밋·push

**로컬 검증** (push 전): ① `docs.json`이 참조하는 `file`·`assets`가 전부 실존하는지 ② 새/수정 SVG의 XML 유효성 ③ 헤드리스 크롬 360px 렌더로 가로 오버플로 없는지(`scrollWidth == innerWidth`). 검증 스크립트가 아직 없으므로 필요 시 임시로 조합해 돌린다 (`scripts/verify.sh`로 굳히면 좋음).

docs.json 갱신 누락과 `<noscript>` 누락이 이 구조의 반복 휴먼에러 지점이므로 문서 작업 시 반드시 함께 확인한다.
