/* HIGH OS V15 · números dos indicadores contam até o valor (só inteiros, só quando mudam) */
(function(){'use strict';
 if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const SEL='.dash-kpis b,.mpk-kpi b,.mp-kpi b,.po-kpi b,.dg-kpi b,.fac-stats b,.org15-kpi b,.rh15-kpi b,.org-resumo-item b';
 const last=new WeakMap();
 function run(el){
  const txt=el.textContent.trim();if(!/^\d{1,6}$/.test(txt))return;
  const to=+txt,from=last.has(el)?last.get(el):0;last.set(el,to);if(from===to||el.dataset.hxBusy)return;
  el.dataset.hxBusy='1';const t0=performance.now(),dur=Math.min(900,350+Math.abs(to-from)*12);
  const step=t=>{const k=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-k,3),v=Math.round(from+(to-from)*e);
   el.textContent=String(v);if(k<1)requestAnimationFrame(step);else{el.textContent=txt;delete el.dataset.hxBusy}};
  requestAnimationFrame(step);
 }
 let q=false;
 function sweep(){q=false;document.querySelectorAll(SEL).forEach(el=>{if(!el.dataset.hxBusy&&el.offsetParent)run(el)})}
 function sched(){if(!q){q=true;setTimeout(sweep,60)}}
 function start(){sweep();new MutationObserver(m=>{if(m.some(r=>!(r.target instanceof Element&&r.target.dataset&&r.target.dataset.hxBusy)))sched()}).observe(document.body,{subtree:true,childList:true})}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
