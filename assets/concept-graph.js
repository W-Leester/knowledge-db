/* concept-graph.js — 문서 안 "개념 그래프" 공용 렌더러 (라이브러리 0)
   사용법: <figure class="cg-anim" data-cg-title="..."><script type="application/json" class="cg-data">{kinds,nodes,edges}</script></figure>
   + <script src="../assets/concept-graph.js" defer>
   데이터 스키마는 scripts/README 대신 CLAUDE.md "개념 그래프" 항목 참조.
   래퍼 클래스가 -anim으로 끝나야 dark.css의 밝은 매트를 받는다. 패널·라벨 색은 매트 위 판독을 위해 고정색. */
(function(){
  var NS='http://www.w3.org/2000/svg';
  var css='figure.cg-anim{background:var(--bg-secondary,#fff);border:1px solid var(--border,#D5CFBF);border-radius:14px;padding:16px 12px 8px;margin:22px 0}'
    +'figure.cg-anim .cg-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}'
    +'figure.cg-anim svg{width:100%;display:block;touch-action:none}'
    +'@media(max-width:720px){figure.cg-anim svg{min-width:860px}figure.cg-anim.cg-fixed svg{min-width:0}}'
    +'figure.cg-anim .cg-panel{margin:6px 4px 2px;padding:10px 12px;border-radius:10px;background:#FFFFFF;border:1px solid #D5CFBF;color:#1A1A1A;font-size:13px;line-height:1.55;min-height:58px}'
    +'figure.cg-anim .cg-panel a{color:#1A5CB5;text-decoration:none;font-weight:700;font-size:11.5px;margin-left:6px}'
    +'figure.cg-anim figcaption{font-size:12.5px;color:#666666;text-align:center;padding:8px 0 4px}';
  var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

  function mk(t,at){var el=document.createElementNS(NS,t);for(var q in at)el.setAttribute(q,at[q]);return el;}
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

  function build(fig){
    if(fig.getAttribute('data-cg-built'))return;fig.setAttribute('data-cg-built','1');
    var dataEl=fig.querySelector('script.cg-data');if(!dataEl)return;
    var data;try{data=JSON.parse(dataEl.textContent);}catch(e){return;}
    var kinds=data.kinds||{},W=900,H=460;
    var wrap=document.createElement('div');wrap.className='cg-wrap';
    var svg=mk('svg',{viewBox:'0 0 '+W+' '+H,'font-family':"Pretendard, 'Apple SD Gothic Neo', sans-serif"});
    var gE=mk('g',{}),gL=mk('g',{}),gN=mk('g',{});svg.appendChild(gE);svg.appendChild(gL);svg.appendChild(gN);wrap.appendChild(svg);
    var panel=document.createElement('div');panel.className='cg-panel';
    var legend='';for(var k in kinds){legend+=' · <b style="color:'+kinds[k][1]+'">'+esc(kinds[k][0])+'</b>';}
    var idle='<span style="color:#666666">노드를 누르면 정의와 관계가 표시됩니다 · 색:'+legend.replace(/^ · /,'')+'</span>';
    panel.innerHTML=idle;
    var cap=fig.querySelector('figcaption');
    fig.insertBefore(wrap,cap||null);fig.insertBefore(panel,cap||null);

    var nodes=data.nodes.map(function(n,i){return {id:n.id,label:n.label,kind:n.kind,sec:n.sec,def:n.def,x:Math.cos(i/data.nodes.length*6.283)*230,y:Math.sin(i/data.nodes.length*6.283)*170,vx:0,vy:0,deg:0};});
    var byId={};nodes.forEach(function(n){byId[n.id]=n;});
    var edges=[];data.edges.forEach(function(e){var s=byId[e.s],t=byId[e.t];if(!s||!t)return;s.deg++;t.deg++;edges.push({s:s,t:t,rel:e.rel});});
    /* 동기 시뮬레이션 — 배치 확정 후 정지 */
    for(var it=0;it<450;it++){var a=1-it/450;
      for(var i=0;i<nodes.length;i++){var n=nodes[i];for(var j=i+1;j<nodes.length;j++){var m=nodes[j],dx=m.x-n.x,dy=m.y-n.y,d=Math.sqrt(dx*dx+dy*dy)+.01,f;
        if(d<66){f=(66-d)*.15;}else{f=2300/(d*d)*a;}dx/=d;dy/=d;n.vx-=dx*f;n.vy-=dy*f;m.vx+=dx*f;m.vy+=dy*f;}
        n.vx-=n.x*.004*a;n.vy-=n.y*.0065*a;}
      edges.forEach(function(e){var dx=e.t.x-e.s.x,dy=e.t.y-e.s.y,d=Math.sqrt(dx*dx+dy*dy)+.01,f=(d-96)*.02*a;dx/=d;dy/=d;e.s.vx+=dx*f;e.s.vy+=dy*f;e.t.vx-=dx*f;e.t.vy-=dy*f;});
      nodes.forEach(function(n){n.vx*=.8;n.vy*=.8;n.x+=n.vx;n.y+=n.vy;});}
    var minx=1e9,maxx=-1e9,miny=1e9,maxy=-1e9;nodes.forEach(function(n){minx=Math.min(minx,n.x);maxx=Math.max(maxx,n.x);miny=Math.min(miny,n.y);maxy=Math.max(maxy,n.y);});
    var k=Math.min((W-120)/Math.max(1,maxx-minx),(H-80)/Math.max(1,maxy-miny));
    nodes.forEach(function(n){n.x=60+(n.x-minx)*k+((W-120)-(maxx-minx)*k)/2;n.y=36+(n.y-miny)*k+((H-80)-(maxy-miny)*k)/2;});

    edges.forEach(function(e){e.el=mk('line',{stroke:'#B5AFA5','stroke-width':1.6,'stroke-opacity':.7});gE.appendChild(e.el);
      e.lab=mk('text',{'font-size':10,'font-weight':700,fill:'#1A1A1A','text-anchor':'middle','paint-order':'stroke',stroke:'#FFFFFF','stroke-width':4,'stroke-linejoin':'round',style:'display:none'});e.lab.textContent=e.rel;gL.appendChild(e.lab);});
    var sel=null;
    nodes.forEach(function(n){var g=mk('g',{style:'cursor:pointer'});var r=9+n.deg*1.3,col=(kinds[n.kind]||['','#555'])[1];
      var c=mk('circle',{r:r,fill:col,stroke:'#FFFFFF','stroke-width':2.5});
      var t=mk('text',{y:r+12,'font-size':11.5,'font-weight':700,fill:'#1A1A1A','text-anchor':'middle','paint-order':'stroke',stroke:'#FAF7F2','stroke-width':4,'stroke-linejoin':'round'});t.textContent=n.label;
      g.appendChild(c);g.appendChild(t);n.el=g;n.c=c;gN.appendChild(g);
      var drag=false,moved=false,px,py;
      g.addEventListener('pointerdown',function(ev){ev.stopPropagation();ev.preventDefault();drag=true;moved=false;px=ev.clientX;py=ev.clientY;g.setPointerCapture(ev.pointerId);});
      g.addEventListener('pointermove',function(ev){if(!drag)return;var sc=svg.getBoundingClientRect().width/W;n.x+=(ev.clientX-px)/sc;n.y+=(ev.clientY-py)/sc;px=ev.clientX;py=ev.clientY;moved=true;draw();});
      g.addEventListener('pointerup',function(){drag=false;if(!moved)select(n);});
      g.addEventListener('pointercancel',function(){drag=false;});});
    function draw(){edges.forEach(function(e){e.el.setAttribute('x1',e.s.x);e.el.setAttribute('y1',e.s.y);e.el.setAttribute('x2',e.t.x);e.el.setAttribute('y2',e.t.y);e.lab.setAttribute('x',(e.s.x+e.t.x)/2);e.lab.setAttribute('y',(e.s.y+e.t.y)/2+3);});nodes.forEach(function(n){n.el.setAttribute('transform','translate('+n.x+','+n.y+')');});}
    function select(n){sel=(sel===n)?null:n;var nb={};
      edges.forEach(function(e){var on=sel&&(e.s===sel||e.t===sel);if(on){nb[e.s.id]=1;nb[e.t.id]=1;}e.el.setAttribute('stroke',on?'#E8962A':'#B5AFA5');e.el.setAttribute('stroke-width',on?3:1.6);e.el.setAttribute('stroke-opacity',sel?(on?1:.12):.7);e.lab.style.display=on?'':'none';});
      nodes.forEach(function(m){m.el.style.opacity=sel&&!nb[m.id]&&m!==sel?.2:1;m.c.setAttribute('stroke',m===sel?'#E8962A':'#FFFFFF');m.c.setAttribute('stroke-width',m===sel?4:2.5);});
      if(!sel){panel.innerHTML=idle;return;}
      var out=[],inn=[];edges.forEach(function(e){if(e.s===sel)out.push(esc(sel.label)+' —'+esc(e.rel)+'→ <b>'+esc(e.t.label)+'</b>');if(e.t===sel)inn.push('<b>'+esc(e.s.label)+'</b> —'+esc(e.rel)+'→ '+esc(sel.label));});
      var col=(kinds[sel.kind]||['','#555'])[1];
      panel.innerHTML='<div style="font-weight:800;color:'+col+';font-size:14px">'+esc(sel.label)+(sel.sec?'<a href="'+esc(sel.sec)+'">해당 절로 이동 ↗</a>':'')+'</div><div style="margin:4px 0 6px">'+esc(sel.def||'')+'</div><div style="font-size:12px;color:#555555">'+out.concat(inn).join(' · ')+'</div>';}
    draw();
  }
  function init(){var figs=document.querySelectorAll('figure.cg-anim');for(var i=0;i<figs.length;i++)build(figs[i]);}
  window.ConceptGraph={init:init,build:build};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
