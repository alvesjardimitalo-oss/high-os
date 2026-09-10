/* HIGH OS V8.31 — Planejador de Missões */
(() => {
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
  const defaults=[
    [998.81,-436.32,64.08,232.45],[728.29,-348.61,43.88,243.78],[529.67,-265.34,47.94,218.27],[379.88,-582.35,28.7,260.79],[450.23,-825.19,28,263.63],[721.76,-814.85,24.65,351.5],[980.44,-1015.46,41.55,303.31],[1116.51,-1145.2,26.61,357.17],[1176.47,-964.04,47.52,11.34],[1321.79,-819.11,81.96,68.04],[1377.54,-579.75,74.19,59.53],[1319.28,-404.38,68.43,82.21],[1216.01,-292.68,69.02,121.89],[1126.94,-298.24,68.98,155.91],[1066.54,-184.7,69.89,147.41],[1096.54,-94.12,81.99,130.4],[907.69,29.61,79.99,127.56],[644.19,2.83,82.78,218.27],[540.77,-36,70.68,192.76],[610.84,-397.23,24.8,65.2],[511.05,-657.57,26.05,320.32],[838.37,-745.62,34.74,255.12],[1379.54,-1281.16,72.2,42.52],[1395.68,-962.03,59.24,73.71],[1201.03,-1332.52,35.22,351.5]
  ];
  const state={map:null,points:[],drawn:[],placing:false,radius:100,initialized:false,selectedId:null};
  const STORE='highos_mission_planner_v831';
  const LEGACY='highos_mission_planner_v830';

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
  const num=v=>{const n=Number(v);return Number.isFinite(n)?n:null};
  const isValidated=p=>Number.isFinite(Number(p.z));
  const remoteBases=[
    'https://cdn.jsdelivr.net/gh/Trusted-Studios/mapStyles@main',
    'https://raw.githubusercontent.com/Trusted-Studios/mapStyles/main'
  ];

  function layer(style,ext='jpg',maxZoom=5,baseIndex=0){
    const base=remoteBases[baseIndex]||remoteBases[0];
    return L.tileLayer(`${base}/${style}/{z}/{x}/{y}.${ext}`,{minZoom:0,maxZoom,noWrap:true,continuousWorld:false,updateWhenIdle:true,keepBuffer:3});
  }
  function pinIcon(p){
    const cls=isValidated(p)?'validated':'planned';
    return L.divIcon({className:'',html:`<div class="mp-pin ${cls}">${String(p.id).padStart(2,'0')}</div>`,iconSize:[28,28],iconAnchor:[14,14]});
  }
  function headingIcon(h){return L.divIcon({className:'',html:`<div class="mp-heading" style="transform:rotate(${Number(h)||0}deg)">↑</div>`,iconSize:[24,24],iconAnchor:[12,12]});}

  function setStatus(text,type='ok'){const el=qs('#mpTileStatus');if(!el)return;el.textContent=text;el.className=type;}
  function initMap(){
    if(state.map||!qs('#missionPlannerMap'))return;
    if(typeof L==='undefined'){setStatus('Leaflet não carregou','warn');return;}
    let atlas=layer('styleAtlas','jpg',5,0),sat=layer('styleSatelite','jpg',5,0),grid=layer('styleGrid','png',5,0);
    state.map=L.map('missionPlannerMap',{crs:makeCrs(),minZoom:1,maxZoom:5,layers:[atlas],preferCanvas:true,zoomControl:true,attributionControl:false});
    const ctl=L.control.layers({'ATLAS':atlas,'SATELLITE':sat,'GRID':grid},null,{collapsed:false,position:'topright'}).addTo(state.map);
    state.map.setView(ll(900,-600),3);
    let okCount=0, errCount=0, fallbackUsed=false;
    const ok=()=>{okCount++;setStatus('Mapa GTA V carregado','ok');};
    const err=()=>{
      errCount++;
      if(okCount===0 && errCount>4 && !fallbackUsed){
        fallbackUsed=true;
        setStatus('Alternando servidor do mapa…','warn');
        try{state.map.removeLayer(atlas);}catch{}
        atlas=layer('styleAtlas','jpg',5,1);atlas.on('tileload',ok);atlas.addTo(state.map);
      }
    };
    [atlas,sat,grid].forEach(x=>{x.on('tileload',ok);x.on('tileerror',err);});
    setTimeout(()=>{if(okCount===0)setStatus('Fundo do GTA não carregou — verifique acesso ao GitHub/CDN','warn');},7000);
    state.map.on('mousemove',e=>{const r=qs('#mpCursor');if(r)r.textContent=`X ${f(e.latlng.lng)} | Y ${f(e.latlng.lat)}`;});
    state.map.on('click',e=>{
      const r=qs('#mpClicked');if(r)r.textContent=`${f(e.latlng.lng)},${f(e.latlng.lat)}`;
      if(qs('#mpCenterX'))qs('#mpCenterX').value=f(e.latlng.lng);
      if(qs('#mpCenterY'))qs('#mpCenterY').value=f(e.latlng.lat);
      if(state.placing)addPoint(e.latlng.lng,e.latlng.lat,null,null,true,'planned');
    });
  }

  function normalizeIds(){state.points.forEach((p,i)=>p.id=i+1);if(state.selectedId>state.points.length)state.selectedId=null;}
  function addPoint(x,y,z=null,h=null,focus=false,status=null){
    x=Number(x);y=Number(y);if(!Number.isFinite(x)||!Number.isFinite(y))return;
    const zz=num(z),hh=num(h);
    const p={id:state.points.length+1,x,y,z:zz,h:hh,status:status||(zz!==null?'validated':'planned')};
    state.points.push(p);render();persist();if(focus)state.map?.panTo(ll(x,y));return p;
  }
  function clearLayers(){state.drawn.forEach(o=>{try{state.map.removeLayer(o)}catch{}});state.drawn=[];}
  function render(){
    if(!state.map)return;clearLayers();
    state.points.forEach(p=>{
      const pos=ll(p.x,p.y),valid=isValidated(p);
      const circle=L.circle(pos,{radius:state.radius,weight:2,fillOpacity:.09,dashArray:valid?null:'6 5'}).addTo(state.map);
      const marker=L.marker(pos,{icon:pinIcon(p),draggable:true}).addTo(state.map);
      const status=valid?'VALIDADO':'PLANEJADO — Z NÃO VALIDADO';
      marker.bindPopup(`<b>Ponto ${String(p.id).padStart(2,'0')}</b><br>Status: <b>${status}</b><br>X: ${f(p.x)}<br>Y: ${f(p.y)}<br>Z: ${valid?f(p.z):'—'}<br>Heading: ${Number.isFinite(p.h)?f(p.h):'—'}<br>Raio visual: ${state.radius} m`);
      marker.on('click',()=>selectPoint(p.id));
      marker.on('dragend',ev=>{const n=ev.target.getLatLng();p.x=n.lng;p.y=n.lat;p.z=null;p.status='planned';circle.setLatLng(n);selectPoint(p.id);render();persist();});
      state.drawn.push(circle,marker);
      if(Number.isFinite(p.h)){
        const a=p.h*Math.PI/180,d=35,ap=ll(p.x+Math.sin(a)*d,p.y+Math.cos(a)*d);
        state.drawn.push(L.marker(ap,{icon:headingIcon(p.h),interactive:false}).addTo(state.map));
      }
    });
    renderList();analyze();updateExportPreview();
  }

  function selectPoint(id){
    state.selectedId=Number(id)||null;
    const p=state.points.find(x=>x.id===state.selectedId);
    const box=qs('#mpValidationTarget');
    if(box)box.innerHTML=p?`Ponto <b>${String(p.id).padStart(2,'0')}</b> • X ${f(p.x)} • Y ${f(p.y)} • ${isValidated(p)?'<span class="mp-ok">VALIDADO</span>':'<span class="mp-warn">Z NÃO VALIDADO</span>'}`:'Selecione um ponto planejado abaixo.';
    qsa('.mp-point-row').forEach(r=>r.classList.toggle('selected',Number(r.dataset.idx)===state.points.findIndex(x=>x.id===state.selectedId)));
  }

  async function copyText(text){
    try{await navigator.clipboard.writeText(text);return true;}catch{}
    const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();let ok=false;try{ok=document.execCommand('copy');}catch{}ta.remove();return ok;
  }
  function rawCds(p){return `${f(p.x)},${f(p.y)},${f(p.z)},${Number.isFinite(p.h)?f(p.h):'0.00'}`;}
  function renderList(){
    const box=qs('#mpPointList');if(!box)return;
    if(!state.points.length){box.innerHTML='<div class="mp-note">Nenhum ponto marcado.</div>';return;}
    box.innerHTML=state.points.map((p,i)=>{
      const valid=isValidated(p);
      return `<div class="mp-point-row ${valid?'validated':'planned'}" data-idx="${i}">
        <div class="mp-point-num">${String(p.id).padStart(2,'0')}</div>
        <div><b>Ponto ${p.id} <span class="mp-state ${valid?'ok':'warn'}">${valid?'VALIDADO':'PLANEJADO'}</span></b><small>${f(p.x)},${f(p.y)}${valid?','+f(p.z):' • Z não validado'}${Number.isFinite(p.h)?' • H '+f(p.h):''}</small></div>
        <div class="mp-row-actions">${valid?`<button type="button" data-copy="${i}" title="Copiar CDS limpa">⧉</button>`:''}<button type="button" data-del="${i}" title="Remover">×</button></div>
      </div>`;
    }).join('');
    qsa('.mp-point-row',box).forEach(row=>row.addEventListener('click',e=>{
      if(e.target.dataset.del!==undefined||e.target.dataset.copy!==undefined)return;
      const p=state.points[Number(row.dataset.idx)];selectPoint(p.id);state.map?.setView(ll(p.x,p.y),5);
    }));
    qsa('[data-copy]',box).forEach(b=>b.addEventListener('click',async e=>{
      e.stopPropagation();const p=state.points[Number(b.dataset.copy)];if(!isValidated(p))return;
      await copyText(rawCds(p));
      b.textContent='✓';setTimeout(()=>b.textContent='⧉',900);
    }));
    qsa('[data-del]',box).forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();state.points.splice(Number(b.dataset.del),1);normalizeIds();render();persist();selectPoint(null);}));
    if(state.selectedId)selectPoint(state.selectedId);
  }

  function analyze(){
    let min=Infinity,pair=null,over=0;
    for(let i=0;i<state.points.length;i++)for(let j=i+1;j<state.points.length;j++){
      const d=Math.hypot(state.points[i].x-state.points[j].x,state.points[i].y-state.points[j].y);
      if(d<min){min=d;pair=[state.points[i].id,state.points[j].id];}
      if(d<state.radius*2)over++;
    }
    if(qs('#mpNearest'))qs('#mpNearest').textContent=pair?`${pair[0]} ↔ ${pair[1]} • ${min.toFixed(1)} m`:'—';
    if(qs('#mpOverlap'))qs('#mpOverlap').textContent=String(over);
    if(qs('#mpCount'))qs('#mpCount').textContent=String(state.points.length);
  }
  function fit(){if(state.map&&state.points.length)state.map.fitBounds(L.latLngBounds(state.points.map(p=>ll(p.x,p.y))).pad(.12));}

  function parseBulk(text){
    const out=[];String(text||'').split(/\n+/).forEach(line=>{
      const c=line.replace(/^\s*\d+\s*[-–—:]\s*/,'').trim();if(!c)return;
      const parts=c.split(',').map(v=>String(v).trim());
      const x=Number(parts[0]),y=Number(parts[1]);if(!Number.isFinite(x)||!Number.isFinite(y))return;
      const z=parts.length>2?num(parts[2]):null,h=parts.length>3?num(parts[3]):null;
      out.push([x,y,z,h]);
    });return out;
  }
  function importBulk(){
    const a=parseBulk(qs('#mpBulk')?.value);if(!a.length){alert('Nenhuma coordenada válida encontrada.');return;}
    a.forEach(v=>addPoint(v[0],v[1],v[2],v[3],false,v[2]!==null?'validated':'planned'));fit();
  }
  function generateCircle(){
    const cx=Number(qs('#mpCenterX')?.value),cy=Number(qs('#mpCenterY')?.value),qty=Math.max(2,Number(qs('#mpQty')?.value)||2),r=Math.max(1,Number(qs('#mpCircleRadius')?.value)||100);
    if(!Number.isFinite(cx)||!Number.isFinite(cy)){alert('Clique no mapa para definir o centro ou informe X e Y.');return;}
    const start=Number(qs('#mpStartAngle')?.value)||0;
    state.points=[];state.selectedId=null;
    for(let i=0;i<qty;i++){
      const deg=start+(360/qty)*i,a=deg*Math.PI/180;
      const x=cx+Math.sin(a)*r,y=cy+Math.cos(a)*r,h=(deg+180)%360;
      state.points.push({id:i+1,x,y,z:null,h,status:'planned'});
    }
    render();fit();persist();
    alert(`${qty} pontos planejados foram gerados.\n\nX/Y estão prontos, mas nenhum ponto foi liberado para TPCDS porque o Z ainda precisa ser validado no FiveM.`);
  }

  function validateSelected(){
    const p=state.points.find(x=>x.id===state.selectedId);
    if(!p){alert('Selecione primeiro o ponto que você está conferindo no jogo.');return;}
    const raw=String(qs('#mpValidateCds')?.value||'').trim().replace(/^tpcds\s+/i,'');
    const parts=raw.split(',').map(v=>String(v).trim());
    if(parts.length<3){alert('Cole pelo menos X,Y,Z. Exemplo: 123.17,-456.34,31.72,180.00');return;}
    const x=num(parts[0]),y=num(parts[1]),z=num(parts[2]),h=parts.length>3?num(parts[3]):p.h;
    if(x===null||y===null||z===null){alert('A CDS possui valores inválidos. Use somente números separados por vírgula.');return;}
    p.x=x;p.y=y;p.z=z;p.h=h;p.status='validated';
    if(qs('#mpValidateCds'))qs('#mpValidateCds').value='';
    render();persist();selectPoint(p.id);state.map?.panTo(ll(p.x,p.y));
  }

  function updateExportPreview(){
    const out=qs('#mpExport');if(!out)return;
    const valid=state.points.filter(isValidated);
    out.value=valid.map(p=>`${p.id} - ${rawCds(p)}`).join('\n');
  }
  async function exportValidated(){
    const valid=state.points.filter(isValidated);
    if(!valid.length){alert('Nenhum ponto possui Z validado. O Planejador não vai gerar TPCDS inválida.');return;}
    const txt=valid.map(p=>`${p.id} - ${rawCds(p)}`).join('\n');
    if(qs('#mpExport'))qs('#mpExport').value=txt;await copyText(txt);
  }
  async function exportXY(){
    if(!state.points.length)return;
    const txt=state.points.map(p=>`${p.id} - ${f(p.x)},${f(p.y)}`).join('\n');await copyText(txt);
  }

  function persist(){try{localStorage.setItem(STORE,JSON.stringify({radius:state.radius,points:state.points,selectedId:state.selectedId}))}catch{}}
  function restore(){
    try{
      let raw=localStorage.getItem(STORE);
      if(!raw){raw=localStorage.getItem(LEGACY);}
      const x=JSON.parse(raw||'null');
      if(x&&Array.isArray(x.points)){
        state.points=x.points.map((p,i)=>({id:i+1,x:Number(p.x),y:Number(p.y),z:num(p.z),h:num(p.h),status:num(p.z)!==null?'validated':'planned'}));
        state.radius=Number(x.radius)||100;state.selectedId=null;return true;
      }
    }catch{}return false;
  }
  function loadDefault(){state.points=defaults.map((v,i)=>({id:i+1,x:v[0],y:v[1],z:v[2],h:v[3],status:'validated'}));state.selectedId=null;render();fit();persist();}
  function clearAll(){if(!confirm('Apagar todos os pontos do Planejador?'))return;state.points=[];state.selectedId=null;render();persist();selectPoint(null);}

  function bind(){
    if(state.initialized)return;state.initialized=true;initMap();
    if(!restore())loadDefault();else render();
    if(qs('#mpRadius')){qs('#mpRadius').value=state.radius;qs('#mpRadiusValue').textContent=state.radius+' m';}
    qs('#mpPlaceBtn')?.addEventListener('click',()=>{state.placing=!state.placing;qs('#missionPlannerMap')?.classList.toggle('mp-crosshair',state.placing);qs('#mpPlaceBtn').textContent=state.placing?'PARAR DE MARCAR':'MARCAR NO MAPA';});
    qs('#mpAddCoord')?.addEventListener('click',()=>{
      const x=Number(qs('#mpX').value),y=Number(qs('#mpY').value);if(!Number.isFinite(x)||!Number.isFinite(y)){alert('Informe X e Y válidos.');return;}
      const z=qs('#mpZ').value,h=qs('#mpH').value;addPoint(x,y,z,h,true,num(z)!==null?'validated':'planned');
    });
    qs('#mpRadius')?.addEventListener('input',e=>{state.radius=Number(e.target.value);qs('#mpRadiusValue').textContent=state.radius+' m';render();persist();});
    qs('#mpImport')?.addEventListener('click',importBulk);
    qs('#mpFit')?.addEventListener('click',fit);
    qs('#mpGenerateCircle')?.addEventListener('click',generateCircle);
    qs('#mpValidateBtn')?.addEventListener('click',validateSelected);
    qs('#mpExportBtn')?.addEventListener('click',exportValidated);
    qs('#mpExportXYBtn')?.addEventListener('click',exportXY);
    qs('#mpDefault25')?.addEventListener('click',loadDefault);
    qs('#mpClear')?.addEventListener('click',clearAll);
  }
  function activate(){bind();setTimeout(()=>{state.map?.invalidateSize();if(state.points.length)fit();},100);}
  window.HighMissionPlanner={activate,fit,loadDefault};
  document.addEventListener('DOMContentLoaded',()=>{if(qs('#missionPlannerMap'))bind();});
})();
