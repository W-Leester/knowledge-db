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

### 문서 페이지 구조

각 문서(`*.html`)는 루트에 있는 자립적 HTML이며, 원본을 재작성하지 않고 head에 공통 3요소만 주입한다:

1. FOUC 방지 인라인 스니펫 (localStorage `kdb-theme` 읽어 `data-theme` 즉시 설정)
2. `assets/fonts.css` + `assets/dark.css` 링크
3. `assets/app.js` (defer) — 테마 3단 토글(시스템/라이트/다크), ⌂ 홈 버튼, 읽던 위치 저장·이어읽기 토스트, 최근 문서 기록을 플로팅 UI로 주입

### 디자인 시스템

전 문서가 동일한 CSS 변수 토큰(`--bg-primary`, `--navy-900` 등, Hyundai-inspired)을 쓴다 — `design-system.html` 참조. 다크모드는 `assets/dark.css`가 `:root[data-theme="dark"]`에서 이 변수들만 오버라이드하는 방식이므로, 새 문서도 반드시 같은 토큰을 사용해야 한다. 문서 이미지는 `Docs/img/*.svg`.

### 클라이언트 저장소

localStorage 키는 `kdb-` 접두사: `kdb-theme`, `kdb-pos:{docId}`, `kdb-recent`, `kdb-dl-ver:{docId}`. Cache Storage(Phase 3 예정): `kdb-shell-v{n}`, `kdb-docs`.

### KnowledgeDB_App/ 폴더

앱의 소스가 아니라 기획·설계 문서다. 실제 소스는 저장소 루트에 있다.

- `Tasks.md` — **살아있는 작업 체크리스트.** 작업 시작 전 여기서 현재 Phase를 확인하고, 완료하면 체크 표시로 갱신한다.
- `docs/05_설계문서.md` — 아키텍처의 "어떻게" (SW 캐싱 전략, 다운로드 버튼, 검색 설계 등 미구현 Phase 포함)
- `docs/01~04` — 요구사항(FR/NFR 번호의 출처), 기술 비교, 로드맵

## 운영 워크플로

이 저장소는 여러 PC에서 사용한다. **작업 시작 전 `git pull`, 작업 완료 후 커밋·push**를 기본 리듬으로 한다.

**새 문서 추가**: ① 루트에 HTML 작성 (디자인 토큰 + 반응형 + head 3요소 포함) ② `docs.json`에 항목 추가 (assets에 참조 SVG 전부 나열) ③ `index.html`의 `<noscript>` 폴백 목록에도 링크 추가 ④ push

**기존 문서 수정**: HTML 수정 → `docs.json`의 해당 `version` +1 → push

docs.json 갱신 누락이 이 구조의 유일한 휴먼에러 지점이므로 문서 작업 시 반드시 함께 확인한다.
