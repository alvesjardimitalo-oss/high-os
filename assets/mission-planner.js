/* HIGH OS V8.30 — Planejador de Missões */
(() => {
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
  const defaults=[
    [998.81,-436.32,64.08,232.45],[728.29,-348.61,43.88,243.78],[529.67,-265.34,47.94,218.27],[379.88,-582.35,28.7,260.79],[450.23,-825.19,28,263.63],[721.76,-814.85,24.65,351.5],[980.44,-1015.46,41.55,303.31],[1116.51,-1145.2,26.61,357.17],[1176.47,-964.04,47.52,11.34],[1321.79,-819.11,81.96,68.04],[1377.54,-579.75,74.19,59.53],[1319.28,-404.38,68.43,82.21],[1216.01,-292.68,69.02,121.89],[1126.94,-298.24,68.98,155.91],[1066.54,-184.7,69.89,147.41],[1096.54,-94.12,81.99,130.4],[907.69,29.61,79.99,127.56],[644.19,2.83,82.78,218.27],[540.77,-36,70.68,192.76],[610.84,-397.23,24.8,65.2],[511.05,-657.57,26.05,320.32],[838.37,-745.62,34.74,255.12],[1379.54,-1281.16,72.2,42.52],[1395.68,-962.03,59.24,73.71],[1201.03,-1332.52,35.22,351.5]
  ];
  const state={map:null,points:[],drawn:[],placing:false,radius:100,loaded:false,initialized:false};
  const STORE='highos_mission_planner_v830';

  // Mesmo sistema de transformação usado por projetos Leaflet para GTA V/FiveM.
  function makeCrs(){
    return L.extend({},L.CRS.Simple,{
      projection:L.Projection.LonLat,
      scale:z=>Math.pow(2,z),
      zoom:s=>Math.log(s)/Math.LN2,
      distance:(a,b)=>Math.hypot(b.lng-a.lng,b.lat-a.lat),
      transformation:new L.Transformation(0.02072,117.3,-0.0205,172.8),
      infinite:true
    });
  }
  const ll=(x,y)=>L.latLng(Number(y),Number(x));
  const f=n=>Number(n).toFixed(2);
  const remoteBase='https://raw.githubusercontent.com/Trusted-Studios/mapStyles/main';

  function layer(style,ext='jpg',maxZoom=5){
    return L.tileLayer(`${remoteBase}/${style}/{z}/{x}/{y}.${ext}`,{minZoom:0,maxZoom,noWrap:true,continuousWorld:false,updateWhenIdle:true,keepBuffer:3});
  }
  function pinIcon(id){return L.divIcon({className:'',html:`<div class="mp-pin">${String(id).padStart(2,'0')}</div>`,iconSize:[28,28],iconAnchor:[14,14]});}
  function headingIcon(h){return L.divIcon({className:'',html:`<div class="mp-heading" style="transform:rotate(${Number(h)||0}deg)">↑</div>`,iconSize:[24,24],iconAnchor:[12,12]});}

  function setStatus(text,type='ok'){
    const el=qs('#mpTileStatus'); if(!el)return; el.textContent=text; el.className=type;
  }
  function initMap(){
    if(state.map||!qs('#missionPlannerMap'))return;
    if(typeof L==='undefined'){setStatus('Leaflet não carregou','warn');return;}
    const atlas=layer('styleAtlas','jpg',5);
    const sat=layer('styleSatelite','jpg',5);
    const grid=layer('styleGrid','png',5);
    state.map=L.map('missionPlannerMap',{crs:makeCrs(),minZoom:1,maxZoom:5,layers:[atlas],preferCanvas:true,zoomControl:true,attributionControl:false});
    L.control.layers({'ATLAS':atlas,'SATELLITE':sat,'GRID':grid},null,{collapsed:false,position:'topright'}).addTo(state.map);
    state.map.setView(ll(900,-600),3);
    let tileOk=false;
    const ok=()=>{tileOk=true;setStatus('Mapa GTA V carregado','ok')};
    atlas.on('tileload',ok); sat.on('tileload',ok); grid.on('tileload',ok);
    [atlas,sat,grid].forEach(x=>x.on('tileerror',()=>{if(!tileOk)setStatus('Tentando carregar o fundo do mapa…','warn')}));
    setTimeout(()=>{if(!tileOk)setStatus('Fundo bloqueado pela rede/navegador','warn')},6000);
    state.map.on('mousemove',e=>{const r=qs('#mpCursor');if(r)r.textContent=`X ${f(e.latlng.lng)} | Y ${f(e.latlng.lat)}`});
    state.map.on('click',e=>{
      const r=qs('#mpClicked');if(r)r.textContent=`${f(e.latlng.lng)},${f(e.latlng.lat)}`;
      if(qs('#mpCenterX'))qs('#mpCenterX').value=f(e.latlng.lng);
      if(qs('#mpCenterY'))qs('#mpCenterY').value=f(e.latlng.lat);
      if(state.placing)addPoint(e.latlng.lng,e.latlng.lat,null,null,true);
    });
  }
  function normalizeIds(){state.points.forEach((p,i)=>p.id=i+1)}
  function addPoint(x,y,z=null,h=null,focus=false){
    x=Number(x);y=Number(y);if(!Number.isFinite(x)||!Number.isFinite(y))return;
    state.points.push({id:state.points.length+1,x,y,z:(z===null||z===''?null:Number(z)),h:(h===null||h===''?null:Number(h))});
    render();persist(); if(focus)state.map?.panTo(ll(x,y));
  }
  function clearLayers(){state.drawn.forEach(o=>{try{state.map.removeLayer(o)}catch{}});state.drawn=[]}
  function render(){
    if(!state.map)return;clearLayers();
    state.points.forEach(p=>{
      const pos=ll(p.x,p.y);
      const circle=L.circle(pos,{radius:state.radius,weight:2,fillOpacity:.09}).addTo(state.map);
      const marker=L.marker(pos,{icon:pinIcon(p.id),draggable:true}).addTo(state.map);
      marker.bindPopup(`<b>Ponto ${String(p.id).padStart(2,'0')}</b><br>X: ${f(p.x)}<br>Y: ${f(p.y)}<br>Z: ${p.z??'não definido'}<br>Heading: ${p.h??'não definido'}<br>Raio visual: ${state.radius} m`);
      marker.on('dragend',ev=>{const n=ev.target.getLatLng();p.x=n.lng;p.y=n.lat;circle.setLatLng(n);renderList();analyze();persist()});
      state.drawn.push(circle,marker);
      if(Number.isFinite(p.h)){
        const a=p.h*Math.PI/180,d=35,ap=ll(p.x+Math.sin(a)*d,p.y+Math.cos(a)*d);
        state.drawn.push(L.marker(ap,{icon:headingIcon(p.h),interactive:false}).addTo(state.map));
      }
    });
    renderList();analyze();
  }
  function renderList(){
    const box=qs('#mpPointList');if(!box)return;
    if(!state.points.length){box.innerHTML='<div class="mp-note">Nenhum ponto marcado.</div>';return;}
    box.innerHTML=state.points.map((p,i)=>`<div class="mp-point-row" data-idx="${i}"><div class="mp-point-num">${String(p.id).padStart(2,'0')}</div><div><b>Ponto ${p.id}</b><small>X ${f(p.x)} • Y ${f(p.y)}${p.z!==null?` • Z ${p.z}`:''}${p.h!==null?` • H ${p.h}`:''}</small></div><button type="button" data-del="${i}" title="Remover">×</button></div>`).join('');
    qsa('.mp-point-row',box).forEach(row=>row.addEventListener('click',e=>{if(e.target.dataset.del!==undefined)return;const p=state.points[Number(row.dataset.idx)];state.map?.setView(ll(p.x,p.y),5)}));
    qsa('[data-del]',box).forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();state.points.splice(Number(b.dataset.del),1);normalizeIds();render();persist()}));
  }
  function analyze(){
    let min=Infinity,pair=null,over=0;
    for(let i=0;i<state.points.length;i++)for(let j=i+1;j<state.points.length;j++){
      const d=Math.hypot(state.points[i].x-state.points[j].x,state.points[i].y-state.points[j].y);
      if(d<min){min=d;pair=[state.points[i].id,state.points[j].id]}
      if(d<state.radius*2)over++;
    }
    if(qs('#mpNearest'))qs('#mpNearest').textContent=pair?`${pair[0]} ↔ ${pair[1]} • ${min.toFixed(1)} m`:'—';
    if(qs('#mpOverlap'))qs('#mpOverlap').textContent=String(over);
    if(qs('#mpCount'))qs('#mpCount').textContent=String(state.points.length);
  }
  function fit(){if(state.map&&state.points.length)state.map.fitBounds(L.latLngBounds(state.points.map(p=>ll(p.x,p.y))).pad(.12))}
  function parseBulk(text){
    const out=[];String(text||'').split(/\n+/).forEach(line=>{
      const c=line.replace(/^\s*\d+\s*[-–—:]\s*/,'').trim();if(!c)return;
      const n=c.split(',').map(v=>Number(String(v).trim()));if(n.length>=2&&Number.isFinite(n[0])&&Number.isFinite(n[1]))out.push(n);
    });return out;
  }
  function importBulk(){
    const a=parseBulk(qs('#mpBulk')?.value);if(!a.length){alert('Nenhuma coordenada válida encontrada.');return}
    a.forEach(v=>addPoint(v[0],v[1],v[2],v[3]));fit();
  }
  function generateCircle(){
    const cx=Number(qs('#mpCenterX')?.value),cy=Number(qs('#mpCenterY')?.value),qty=Math.max(2,Number(qs('#mpQty')?.value)||2),r=Math.max(1,Number(qs('#mpCircleRadius')?.value)||100);
    if(!Number.isFinite(cx)||!Number.isFinite(cy)){alert('Clique no mapa para definir o centro ou informe X e Y.');return}
    const start=Number(qs('#mpStartAngle')?.value)||0;
    state.points=[];
    for(let i=0;i<qty;i++){
      const deg=start+(360/qty)*i,a=deg*Math.PI/180;
      // Heading apontando para o centro do círculo.
      const x=cx+Math.sin(a)*r,y=cy+Math.cos(a)*r,h=(deg+180)%360;
      state.points.push({id:i+1,x,y,z:null,h});
    }
    render();fit();persist();
  }
  function exportCoords(){
    const txt=state.points.map(p=>`${p.id} - ${f(p.x)},${f(p.y)},${p.z??'Z'},${p.h!==null?Number(p.h).toFixed(2):'H'}`).join('\n');
    if(qs('#mpExport'))qs('#mpExport').value=txt;navigator.clipboard?.writeText(txt).catch(()=>{});
  }
  function persist(){try{localStorage.setItem(STORE,JSON.stringify({radius:state.radius,points:state.points}))}catch{}}
  function restore(){
    try{const x=JSON.parse(localStorage.getItem(STORE)||'null');if(x&&Array.isArray(x.points)){state.points=x.points;state.radius=Number(x.radius)||100;return true}}catch{}return false;
  }
  function loadDefault(){state.points=defaults.map((v,i)=>({id:i+1,x:v[0],y:v[1],z:v[2],h:v[3]}));render();fit();persist()}
  function clearAll(){if(!confirm('Apagar todos os pontos do Planejador?'))return;state.points=[];render();persist()}

  function bind(){
    if(state.initialized)return;state.initialized=true;initMap();
    if(!restore())loadDefault();else render();
    if(qs('#mpRadius')){qs('#mpRadius').value=state.radius;qs('#mpRadiusValue').textContent=state.radius+' m'}
    qs('#mpPlaceBtn')?.addEventListener('click',()=>{state.placing=!state.placing;qs('#missionPlannerMap')?.classList.toggle('mp-crosshair',state.placing);qs('#mpPlaceBtn').textContent=state.placing?'PARAR DE MARCAR':'MARCAR NO MAPA'});
    qs('#mpAddCoord')?.addEventListener('click',()=>{const x=Number(qs('#mpX').value),y=Number(qs('#mpY').value);if(!Number.isFinite(x)||!Number.isFinite(y)){alert('Informe X e Y válidos.');return}addPoint(x,y,qs('#mpZ').value,qs('#mpH').value,true)});
    qs('#mpRadius')?.addEventListener('input',e=>{state.radius=Number(e.target.value);qs('#mpRadiusValue').textContent=state.radius+' m';render();persist()});
    qs('#mpImport')?.addEventListener('click',importBulk);qs('#mpFit')?.addEventListener('click',fit);qs('#mpGenerateCircle')?.addEventListener('click',generateCircle);qs('#mpExportBtn')?.addEventListener('click',exportCoords);qs('#mpDefault25')?.addEventListener('click',loadDefault);qs('#mpClear')?.addEventListener('click',clearAll);
  }
  function activate(){bind();setTimeout(()=>{state.map?.invalidateSize();if(state.points.length)fit()},100)}
  window.HighMissionPlanner={activate,fit,loadDefault};
  document.addEventListener('DOMContentLoaded',()=>{if(qs('#missionPlannerMap'))bind()});
})();
