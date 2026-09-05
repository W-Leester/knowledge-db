#!/usr/bin/env python3
"""docs.json + docs/*.html → graph.json (문서 관계 그래프)

노드: docs.json의 문서. 엣지 두 종류를 본문에서 자동 추출한다.
  link    : <a href="다른문서.html">  (강한 참조 — 실제 하이퍼링크)
  mention : 「다른 문서 제목」 텍스트 언급 (약한 참조 — 제목 부분일치, ALIASES로 보정)
weight = 등장 횟수. 자기 자신 언급은 제외.
기존 graph.json의 "curated" 배열(손으로 적은 관계)은 보존한다.
실행: python3 scripts/build-graph.py   (새 문서 추가·수정 후 반드시)
"""
import json, re, html, collections, os, sys, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

ALIASES = {  # 제목 부분일치로 못 잡는 언급 → 문서 id
    "상주형 에이전트": "resident-agents",
    "개발 환경으로서의 macOS vs Windows": "dev-os-comparison",
    "macOS vs Windows": "dev-os-comparison",
    "로컬 LLM 코딩 공장": "llm-factory",
    "Claude 확장하기": "claude-extensions",
}
IGNORE = {"함께 읽기"}  # 문서 제목이 아닌 관용구

docs = json.load(open("docs.json"))["docs"]
by_id = {d["id"]: d for d in docs}
titles = {d["id"]: d["title"] for d in docs}
file_to_id = {os.path.basename(d["file"]): d["id"] for d in docs}

def resolve(mention):
    m = html.unescape(mention).strip()
    if m in IGNORE: return []
    if m in ALIASES: return [ALIASES[m]]
    exact = [i for i, t in titles.items() if t == m]
    if exact: return exact
    return [i for i, t in titles.items() if (m in t or t in m) and len(m) >= 3]

edges = collections.Counter()   # (src, dst, type) -> weight
unresolved = collections.Counter()
for d in docs:
    s = open(d["file"], encoding="utf-8").read()
    body = s[s.find("<main"):] if "<main" in s else s
    for href in re.findall(r'href="([a-z0-9-]+\.html)"', body):
        t = file_to_id.get(href)
        if t and t != d["id"]: edges[(d["id"], t, "link")] += 1
    for m in re.findall(r"「([^」]{2,60})」", body):
        hits = resolve(m)
        if not hits: unresolved[m] += 1; continue
        for t in hits:
            if t != d["id"]: edges[(d["id"], t, "mention")] += 1

prev = {}
if os.path.exists("graph.json"):
    try: prev = json.load(open("graph.json"))
    except Exception: prev = {}

out = {
    "generated": datetime.date.today().isoformat(),
    "note": "scripts/build-graph.py가 생성. nodes는 docs.json 참조, edges는 자동 추출, curated는 손으로 유지.",
    "nodes": [{"id": d["id"], "title": d["title"], "group": d["group"], "icon": d.get("icon", ""), "file": d["file"], "desc": d.get("desc", "")} for d in docs],
    "edges": [{"source": s, "target": t, "type": ty, "weight": w} for (s, t, ty), w in sorted(edges.items())],
    "curated": prev.get("curated", []),
}
json.dump(out, open("graph.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)

deg = collections.Counter()
for (s, t, ty), w in edges.items(): deg[s] += 1; deg[t] += 1
print(f"nodes {len(out['nodes'])} · edges {len(out['edges'])} (link {sum(1 for e in edges if e[2]=='link')}, mention {sum(1 for e in edges if e[2]=='mention')}) · curated {len(out['curated'])}")
iso = [i for i in titles if deg[i] == 0]
print("고립 노드:", [titles[i] for i in iso] or "없음")
if unresolved: print("미해결 언급:", dict(unresolved.most_common(8)))
