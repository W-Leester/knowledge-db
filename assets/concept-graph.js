/* concept-graph.js — 문서 안 "개념 그래프" 공용 렌더러 (라이브러리 0, 외부 자원 0)
   사용법: <figure class="cg-anim"><script type="application/json" class="cg-data">{kinds,nodes,edges}</script></figure>
           + <script src="../assets/concept-graph.js" defer></script>
   데이터 스키마는 CLAUDE.md "개념 그래프" 항목 참조.

   다크모드: 매트(밝은 배경 강제)에 의존하지 않고 JS가 테마를 직접 감지해 색을 칠한다.
   정적 SVG(img)와 달리 동적으로 그리므로 가능 — 캐시·CSS 순서에 영향받지 않고 다크에서 눈부시지 않다.
   테마 변경(3단 토글·시스템 설정)도 실시간 반영한다.
   줌·팬: 휠·핀치·드래그 + 버튼. 모바일에서 가로 스크롤 대신 줌으로 본다. */
(function(){
  var NS='http://www.w3.org/2000/svg';

  /* ── 팔레트 ── */
  var LIGHT={bg:'#FFFFFF',border:'#D5CFBF',edge:'#B5AFA5',edgeHi:'#E8962A',label:'#1A1A1A',labelHalo:'#FFFFFF',
             nodeRing:'#FFFFFF',panelBg:'#FFFFFF',panelBorder:'#D5CFBF',panelText:'#1A1A1A',panelSub:'#555555',
             panelMuted:'#666666',link:'#1A5CB5',btnBg:'#FFFFFF',btnText:'#1A1A1A'};
  var DARK ={bg:'#131A26',border:'#2C3746',edge:'#5D6B7E',edgeHi:'#F0A94A',label:'#E7E5E0',labelHalo:'#131A26',
             nodeRing:'#131A26',panelBg:'#1B2430',panelBorder:'#2C3746',panelText:'#E7E5E0',panelSub:'#ABB0BA',
             panelMuted:'#98A0AC',link:'#7FB0F0',btnBg:'#222D3D',btnText:'#E7E5E0'};
  /* 다크에서 노드 색을 밝은 변형으로 — 어두운 배경 위 대비 확보 */
  var DARKEN={'#1A5CB5':'#5E90DC','#0F766E':'#2FA894','#AF5109':'#E8962A','#B91C1C':'#EF5F5F','#6B21A8':'#A855F7',
              '#002C5F':'#5E90DC','#B45309':'#E8962A','#0E7490':'#38B6CE','#7C2D12':'#D98A5B','#6B6459':'#A9A196',
              '#E8962A':'#F0A94A','#DC2626':'#EF5F5F','#00AA6C':'#3FD39C','#003F8A':'#6B9BE0'};

  function isDark(){
    var t=document.documentElement.getAttribute('data-theme');
    if(t==='dark') return true;
    if(t==='light') return false;
    try{ return matchMedia('(prefers-color-scheme: dark)').matches; }catch(e){ return false; }
  }
  function mk(t,at){var el=document.createElementNS(NS,t);for(var q in at)el.setAttribute(q,at[q]);return el;}
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

  var css='figure.cg-anim{border-radius:14px;padding:12px 10px 8px;margin:22px 0;border:1px solid;position:relative}'
    +'figure.cg-anim .cg-stage{position:relative;overflow:hidden;border-radius:10px}'
    +'figure.cg-anim svg{width:100%;display:block;touch-action:none;cursor:grab}'
    +'figure.cg-anim svg.cg-drag{cursor:grabbing}'
    +'figure.cg-anim .cg-zoom{position:absolute;right:8px;top:8px;display:flex;flex-direction:column;gap:5px;z-index:2}'
    +'figure.cg-anim .cg-zoom button{width:30px;height:30px;border-radius:8px;border:1px solid;font-size:15px;line-height:1;cursor:pointer;padding:0;font-family:inherit}'
    +'figure.cg-anim .cg-panel{margin:8px 2px 2px;padding:10px 12px;border-radius:10px;border:1px solid;font-size:13px;line-height:1.55;min-height:58px}'
    +'figure.cg-anim .cg-panel a{text-decoration:none;font-weight:700;font-size:11.5px;margin-left:6px}'
    +'figure.cg-anim figcaption{font-size:12.5px;text-align:center;padding:8px 0 4px}';
  var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

  var instances=[];

  function build(fig){
    if(fig.getAttribute('data-cg-built'))return; fig.setAttribute('data-cg-built','1');
    var dataEl=fig.querySelector('script.cg-data'); if(!dataEl)return;
    var data; try{ data=JSON.parse(dataEl.textContent); }catch(e){ return; }
    var kinds=data.kinds||{}, W=900, H=460;

    var stage=document.createElement('div'); stage.className='cg-stage';
    var svg=mk('svg',{viewBox:'0 0 '+W+' '+H,'font-family':"Pretendard, 'Apple SD Gothic Neo', sans-serif"});
    var gView=mk('g',{}), gE=mk('g',{}), gL=mk('g',{}), gN=mk('g',{});
    gView.appendChild(gE); gView.appendChild(gL); gView.appendChild(gN); svg.appendChild(gView);
    stage.appendChild(svg);

    var zoom=document.createElement('div'); zoom.className='cg-zoom';
    var bIn=document.createElement('button'), bOut=document.createElement('button'), bFit=document.createElement('button');
    bIn.textContent='＋'; bIn.title='확대'; bOut.textContent='－'; bOut.title='축소'; bFit.textContent='⤢'; bFit.title='전체 보기';
    zoom.appendChild(bIn); zoom.appendChild(bOut); zoom.appendChild(bFit); stage.appendChild(zoom);

    var panel=document.createElement('div'); panel.className='cg-panel';
    var cap=fig.querySelector('figcaption');
    fig.insertBefore(stage,cap||null); fig.insertBefore(panel,cap||null);

    var nodes=data.nodes.map(function(n,i){return {id:n.id,label:n.label,kind:n.kind,sec:n.sec,def:n.def,
      x:Math.cos(i/data.nodes.length*6.283)*230, y:Math.sin(i/data.nodes.length*6.283)*170, vx:0, vy:0, deg:0};});
    var byId={}; nodes.forEach(function(n){byId[n.id]=n;});
    var edges=[]; data.edges.forEach(function(e){var s=byId[e.s],t=byId[e.t]; if(!s||!t)return; s.deg++; t.deg++; edges.push({s:s,t:t,rel:e.rel});});

    /* 배치: 동기 시뮬레이션 후 정지 (문서 안에서 흔들리지 않게) */
    for(var it=0;it<450;it++){var a=1-it/450;
      for(var i=0;i<nodes.length;i++){var n=nodes[i];
        for(var j=i+1;j<nodes.length;j++){var m=nodes[j],dx=m.x-n.x,dy=m.y-n.y,d=Math.sqrt(dx*dx+dy*dy)+.01,f;
          if(d<66){f=(66-d)*.15;}else{f=2300/(d*d)*a;} dx/=d;dy/=d; n.vx-=dx*f;n.vy-=dy*f;m.vx+=dx*f;m.vy+=dy*f;}
        n.vx-=n.x*.004*a; n.vy-=n.y*.0065*a;}
      edges.forEach(function(e){var dx=e.t.x-e.s.x,dy=e.t.y-e.s.y,d=Math.sqrt(dx*dx+dy*dy)+.01,f=(d-96)*.02*a;dx/=d;dy/=d;
        e.s.vx+=dx*f;e.s.vy+=dy*f;e.t.vx-=dx*f;e.t.vy-=dy*f;});
      nodes.forEach(function(n){n.vx*=.8;n.vy*=.8;n.x+=n.vx;n.y+=n.vy;});}
    var minx=1e9,maxx=-1e9,miny=1e9,maxy=-1e9;
    nodes.forEach(function(n){minx=Math.min(minx,n.x);maxx=Math.max(maxx,n.x);miny=Math.min(miny,n.y);maxy=Math.max(maxy,n.y);});
    var k=Math.min((W-120)/Math.max(1,maxx-minx),(H-80)/Math.max(1,maxy-miny));
    nodes.forEach(function(n){n.x=60+(n.x-minx)*k+((W-120)-(maxx-minx)*k)/2; n.y=36+(n.y-miny)*k+((H-80)-(maxy-miny)*k)/2;});

    edges.forEach(function(e){
      e.el=mk('line',{'stroke-width':1.6,'stroke-opacity':.7,'stroke-linecap':'round'}); gE.appendChild(e.el);
      e.lab=mk('text',{'font-size':10,'font-weight':700,'text-anchor':'middle','paint-order':'stroke','stroke-width':4,'stroke-linejoin':'round',style:'display:none'});
      e.lab.textContent=e.rel; gL.appendChild(e.lab);});

    var sel=null, P=LIGHT;
    nodes.forEach(function(n){
      var g=mk('g',{style:'cursor:pointer'}); var r=9+n.deg*1.3;
      n.c=mk('circle',{r:r,'stroke-width':2.5});
      n.t=mk('text',{y:r+12,'font-size':11.5,'font-weight':700,'text-anchor':'middle','paint-order':'stroke','stroke-width':4,'stroke-linejoin':'round'});
      n.t.textContent=n.label;
      g.appendChild(n.c); g.appendChild(n.t); n.el=g; gN.appendChild(g);
      var drag=false,moved=false,px,py;
      g.addEventListener('pointerdown',function(ev){ev.stopPropagation();ev.preventDefault();drag=true;moved=false;px=ev.clientX;py=ev.clientY;g.setPointerCapture(ev.pointerId);});
      g.addEventListener('pointermove',function(ev){if(!drag)return;var s=svg.getBoundingClientRect().width/W/sc;n.x+=(ev.clientX-px)/s;n.y+=(ev.clientY-py)/s;px=ev.clientX;py=ev.clientY;moved=true;draw();});
      g.addEventListener('pointerup',function(){drag=false;if(!moved)select(n);});
      g.addEventListener('pointercancel',function(){drag=false;});
    });

    /* ── 줌·팬 ── */
    var tx=0,ty=0,sc=1;
    function view(){gView.setAttribute('transform','translate('+tx+','+ty+') scale('+sc+')');}
    function zoomAt(cx,cy,f){var ns=Math.max(.5,Math.min(4,sc*f)); tx=cx-(cx-tx)*ns/sc; ty=cy-(cy-ty)*ns/sc; sc=ns; view();}
    function svgPt(clientX,clientY){var b=svg.getBoundingClientRect(); return [(clientX-b.left)/b.width*W,(clientY-b.top)/b.height*H];}
    function fit(){tx=0;ty=0;sc=1;view();}
    bIn.onclick=function(){zoomAt(W/2,H/2,1.3);}; bOut.onclick=function(){zoomAt(W/2,H/2,1/1.3);}; bFit.onclick=fit;
    svg.addEventListener('wheel',function(ev){ev.preventDefault();var p=svgPt(ev.clientX,ev.clientY);zoomAt(p[0],p[1],ev.deltaY<0?1.15:1/1.15);},{passive:false});
    var pan=null;
    svg.addEventListener('pointerdown',function(ev){pan={x:ev.clientX,y:ev.clientY,tx:tx,ty:ty};svg.classList.add('cg-drag');svg.setPointerCapture(ev.pointerId);});
    svg.addEventListener('pointermove',function(ev){if(!pan)return;var b=svg.getBoundingClientRect(),r=W/b.width;tx=pan.tx+(ev.clientX-pan.x)*r;ty=pan.ty+(ev.clientY-pan.y)*r;view();});
    svg.addEventListener('pointerup',function(){pan=null;svg.classList.remove('cg-drag');});
    svg.addEventListener('pointercancel',function(){pan=null;svg.classList.remove('cg-drag');});
    var pinch=null;
    svg.addEventListener('touchstart',function(ev){if(ev.touches.length===2){pinch=dist(ev.touches);pan=null;}},{passive:true});
    svg.addEventListener('touchmove',function(ev){if(ev.touches.length===2&&pinch){ev.preventDefault();var d=dist(ev.touches);
      var p=svgPt((ev.touches[0].clientX+ev.touches[1].clientX)/2,(ev.touches[0].clientY+ev.touches[1].clientY)/2);
      zoomAt(p[0],p[1],d/pinch);pinch=d;}},{passive:false});
    svg.addEventListener('touchend',function(){pinch=null;});
    function dist(t){var dx=t[0].clientX-t[1].clientX,dy=t[0].clientY-t[1].clientY;return Math.sqrt(dx*dx+dy*dy);}

    function draw(){
      edges.forEach(function(e){e.el.setAttribute('x1',e.s.x);e.el.setAttribute('y1',e.s.y);e.el.setAttribute('x2',e.t.x);e.el.setAttribute('y2',e.t.y);
        e.lab.setAttribute('x',(e.s.x+e.t.x)/2);e.lab.setAttribute('y',(e.s.y+e.t.y)/2+3);});
      nodes.forEach(function(n){n.el.setAttribute('transform','translate('+n.x+','+n.y+')');});
    }
    function nodeColor(n){var base=(kinds[n.kind]||['','#555555'])[1]; return P===DARK?(DARKEN[base.toUpperCase()]||base):base;}
    function idleText(){
      var legend=''; for(var q in kinds){legend+=' · <b style="color:'+(P===DARK?(DARKEN[kinds[q][1].toUpperCase()]||kinds[q][1]):kinds[q][1])+'">'+esc(kinds[q][0])+'</b>';}
      return '<span style="color:'+P.panelMuted+'">노드를 누르면 정의와 관계가 표시됩니다 · 확대·축소·끌기 가능 · 색:'+legend.replace(/^ · /,'')+'</span>';
    }
    function paint(){
      P=isDark()?DARK:LIGHT;
      fig.style.background=P.bg; fig.style.borderColor=P.border;
      panel.style.background=P.panelBg; panel.style.borderColor=P.panelBorder; panel.style.color=P.panelText;
      [bIn,bOut,bFit].forEach(function(b){b.style.background=P.btnBg;b.style.color=P.btnText;b.style.borderColor=P.border;});
      if(cap) cap.style.color=P.panelMuted;
      nodes.forEach(function(n){n.c.setAttribute('fill',nodeColor(n));n.c.setAttribute('stroke',n===sel?P.edgeHi:P.nodeRing);
        n.t.setAttribute('fill',P.label);n.t.setAttribute('stroke',P.labelHalo);});
      edges.forEach(function(e){e.lab.setAttribute('fill',P.label);e.lab.setAttribute('stroke',P.labelHalo);});
      applySel();
    }
    function applySel(){
      var nb={};
      edges.forEach(function(e){var on=sel&&(e.s===sel||e.t===sel); if(on){nb[e.s.id]=1;nb[e.t.id]=1;}
        e.el.setAttribute('stroke',on?P.edgeHi:P.edge); e.el.setAttribute('stroke-width',on?3:1.6);
        e.el.setAttribute('stroke-opacity',sel?(on?1:.12):.7); e.lab.style.display=on?'':'none';});
      nodes.forEach(function(m){m.el.style.opacity=sel&&!nb[m.id]&&m!==sel?.2:1;
        m.c.setAttribute('stroke',m===sel?P.edgeHi:P.nodeRing); m.c.setAttribute('stroke-width',m===sel?4:2.5);});
      if(!sel){panel.innerHTML=idleText();return;}
      var out=[],inn=[];
      edges.forEach(function(e){if(e.s===sel)out.push(esc(sel.label)+' —'+esc(e.rel)+'→ <b>'+esc(e.t.label)+'</b>');
        if(e.t===sel)inn.push('<b>'+esc(e.s.label)+'</b> —'+esc(e.rel)+'→ '+esc(sel.label));});
      panel.innerHTML='<div style="font-weight:800;color:'+nodeColor(sel)+';font-size:14px">'+esc(sel.label)
        +(sel.sec?'<a href="'+esc(sel.sec)+'" style="color:'+P.link+'">해당 절로 이동 ↗</a>':'')+'</div>'
        +'<div style="margin:4px 0 6px;color:'+P.panelText+'">'+esc(sel.def||'')+'</div>'
        +'<div style="font-size:12px;color:'+P.panelSub+'">'+out.concat(inn).join(' · ')+'</div>';
    }
    function select(n){sel=(sel===n)?null:n;applySel();}

    draw(); paint(); view();
    instances.push({paint:paint});
  }

  function repaintAll(){instances.forEach(function(o){o.paint();});}
  function init(){var figs=document.querySelectorAll('figure.cg-anim');for(var i=0;i<figs.length;i++)build(figs[i]);}
  window.ConceptGraph={init:init,build:build,repaint:repaintAll};

  /* 테마 변경 추적: 3단 토글(data-theme)과 시스템 설정 양쪽 */
  try{ new MutationObserver(repaintAll).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']}); }catch(e){}
  try{ var mq=matchMedia('(prefers-color-scheme: dark)'); mq.addEventListener? mq.addEventListener('change',repaintAll) : mq.addListener(repaintAll); }catch(e){}

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init); else init();
})();
