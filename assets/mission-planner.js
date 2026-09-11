/* HIGH OS V8.33 — Planejador de Missões */
(() => {
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
  const STORE='highos_mission_planner_v832_missions';
  const ACTIVE='highos_mission_planner_v832_active';
  const DB_NAME='highos_mission_planner_v832';
  const SNAP_STORE='snapshots';

  const DOMINACAO_30=[
    [126.19,-455.65,42.21,175.75],[333.39,-476.59,43.17,167.25],[529.8,-542.94,24.8,138.9],[710.96,-647.32,35.87,150.24],[869.03,-781.43,40.47,116.23],[987.45,-956.33,42.07,90.71],[1074.23,-1147.33,26.05,119.06],[1109.81,-1354.03,29.39,28.35],[1111.85,-1559.48,34.9,187.09],[1074.22,-1765.37,35.72,226.78],[989.25,-1956.43,30.75,209.77],[866.31,-2125.47,30.55,206.93],[709.38,-2267.73,27.47,76.54],[530.71,-2368.62,5.95,331.66],[331.17,-2434.32,8.41,331.66],[127.86,-2458.49,6,328.82],[-84.75,-2434.49,6,243.78],[-272.95,-2388.94,6,238.12],[-456.03,-2263.83,8.51,314.65],[-619.97,-2125.47,6,311.82],[-742.78,-1956.27,8.16,308.98],[-830.2,-1765.22,37.32,130.4],[-900.97,-1534.72,5.02,42.52],[-837.92,-1333.78,5,25.52],[-827.89,-1147.33,7.55,263.63],[-742.68,-956.36,17.54,266.46],[-616.24,-787.42,25.09,274.97],[-464.72,-647.32,32.2,87.88],[-282.97,-545.43,29.28,308.98],[-84.75,-478.19,34.07,334.49]
  ];
  const FACXFAC_25=[
    [2047.19,4793.20,41.72,337.33],[2077.90,5222.43,55.76,124.73],[2644.07,5300.08,44.15,90.71],[2944.20,4902.62,102.85,102.05],[2571.17,4494.00,36.90,195.60],[3255.45,4483.96,130.64,170.08],[2609.66,3990.06,41.52,170.08],[3316.00,4028.01,154.98,121.89],[3011.48,3606.78,71.16,28.35],[2814.98,3226.52,54.12,87.88],[2473.34,3344.27,50.21,85.04],[2395.52,3022.16,47.94,119.06],[2013.88,3232.94,43.69,331.66],[1900.16,2821.05,45.95,42.52],[1438.86,2946.04,44.74,39.69],[847.47,3047.33,41.40,48.19],[1378.44,3462.31,34.51,337.33],[718.54,3560.48,33.40,334.49],[-52.68,3705.38,36.21,343.00],[-259.45,4184.54,62.23,257.96],[203.94,4418.76,71.81,204.10],[728.34,4295.90,67.30,218.27],[1475.68,4942.80,76.04,226.78],[1240.82,4393.51,39.98,138.90],[711.38,4711.51,117.06,201.26]
  ];

  const presets=[
    {id:'dominacao-sul',name:'Dominação — Sul',event:'Dominação',panel:'/ilegal',mode:'assistant',center:{x:116.48,y:-457.27,z:481.13,h:212.6,label:'Centro / área do evento'},radius:1000,points:DOMINACAO_30},
    {id:'facxfac-norte',name:'Fac x Fac — Norte',event:'Fac x Fac',panel:'/ilegal',mode:'assistant',center:{x:1692.36,y:4040.85,z:281.98,h:22.68,label:'Centro da área do gás'},radius:1000,points:FACXFAC_25}
  ];

  const state={map:null,drawn:[],missions:[],activeId:null,initialized:false,placing:false,snapshotTimer:null,autosaveTimer:null};
  const f=n=>Number(n).toFixed(2);
  const num=v=>{const n=Number(v);return Number.isFinite(n)?n:null};
  const nowIso=()=>new Date().toISOString();
  const uid=()=>`m_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
  const ll=(x,y)=>L.latLng(Number(y),Number(x));
  const active=()=>state.missions.find(m=>m.id===state.activeId)||null;

  function validCoord(v){return Number.isFinite(Number(v)) && Number(v)!==0;}
  function isValidated(p){return p?.status==='validated' && validCoord(p.x) && validCoord(p.y) && validCoord(p.z) && Number.isFinite(Number(p.h));}
  function normalizePoint(p,i,statusDefault='planned'){
    return {id:i+1,x:num(p.x),y:num(p.y),z:num(p.z),h:num(p.h),status:p.status||statusDefault,validatedAt:p.validatedAt||null};
  }
  function presetMission(p){
    return {id:p.id,name:p.name,event:p.event,panel:p.panel,mode:p.mode,center:{...p.center},circleRadius:p.radius,startAngle:0,spawnRadius:100,createdAt:nowIso(),updatedAt:nowIso(),points:p.points.map((v,i)=>normalizePoint({x:v[0],y:v[1],z:v[2],h:v[3],status:'validated',validatedAt:nowIso()},i,'validated')),requestText:'',official:true};
  }
  function newMission(){
    return {id:uid(),name:'Novo Local de Evento',event:'Novo Evento',panel:'/ilegal',mode:'assistant',center:{x:null,y:null,z:null,h:null,label:'Coordenada central'},circleRadius:1000,startAngle:0,spawnRadius:100,createdAt:nowIso(),updatedAt:nowIso(),points:[],requestText:'',official:false};
  }

  function saveStore(){
    try{localStorage.setItem(STORE,JSON.stringify(state.missions));localStorage.setItem(ACTIVE,state.activeId||'');}catch(e){console.warn('Planejador: falha ao salvar',e);}
  }
  function loadStore(){
    try{
      const raw=JSON.parse(localStorage.getItem(STORE)||'null');
      if(Array.isArray(raw)&&raw.length){state.missions=raw;state.activeId=localStorage.getItem(ACTIVE)||raw[0].id;return;}
    }catch{}
    state.missions=presets.map(presetMission);state.activeId=state.missions[0].id;saveStore();
  }

  function openDb(){
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB_NAME,1);
      req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(SNAP_STORE))db.createObjectStore(SNAP_STORE,{keyPath:'id'});};
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
    });
  }
  async function saveSnapshot(id,dataUrl){
    if(!id||!dataUrl)return;
    try{const db=await openDb();const tx=db.transaction(SNAP_STORE,'readwrite');tx.objectStore(SNAP_STORE).put({id,dataUrl,updatedAt:nowIso()});}catch(e){console.warn('Planejador: snapshot não salvo',e);}
  }
  async function getSnapshot(id){
    try{const db=await openDb();return await new Promise((resolve,reject)=>{const r=db.transaction(SNAP_STORE,'readonly').objectStore(SNAP_STORE).get(id);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error);});}catch{return null;}
  }

  function makeCrs(){return L.extend({},L.CRS.Simple,{projection:L.Projection.LonLat,scale:z=>Math.pow(2,z),zoom:s=>Math.log(s)/Math.LN2,distance:(a,b)=>Math.hypot(b.lng-a.lng,b.lat-a.lat),transformation:new L.Transformation(0.02072,117.3,-0.0205,172.8),infinite:true});}
  const remoteBases=['https://cdn.jsdelivr.net/gh/Trusted-Studios/mapStyles@main','https://raw.githubusercontent.com/Trusted-Studios/mapStyles/main'];
  function layer(style,ext='jpg',maxZoom=5,baseIndex=0){return L.tileLayer(`${remoteBases[baseIndex]}/${style}/{z}/{x}/{y}.${ext}`,{minZoom:0,maxZoom,noWrap:true,continuousWorld:false,updateWhenIdle:true,keepBuffer:3,crossOrigin:'anonymous'});}
  function setStatus(text,type='ok'){const el=qs('#mpTileStatus');if(el){el.textContent=text;el.className=type;}}
  function initMap(){
    if(state.map||!qs('#missionPlannerMap'))return;
    if(typeof L==='undefined'){setStatus('Leaflet não carregou','warn');return;}
    let atlas=layer('styleAtlas'),sat=layer('styleSatelite'),grid=layer('styleGrid','png');
    // Cayo Perico overlay calibrated to the GTA/FiveM world-coordinate region around 4700,-5150.
    // It is an overlay (not a separate coordinate system), so clicks/markers continue returning GTA X/Y.
    const cayoUrl='https://raw.githubusercontent.com/fivenet-app/livemap-tiles/main/overlays/cayo-perico/satellite.webp';
    const cayoPostalUrl='https://raw.githubusercontent.com/fivenet-app/livemap-tiles/main/overlays/cayo-perico/postal.webp';
    const cayoBounds=L.latLngBounds(ll(3900,-6000),ll(5600,-4300));
    const cayo=L.imageOverlay(cayoUrl,cayoBounds,{opacity:1,interactive:false,crossOrigin:true});
    const cayoPostal=L.imageOverlay(cayoPostalUrl,cayoBounds,{opacity:1,interactive:false,crossOrigin:true});
    state.map=L.map('missionPlannerMap',{crs:makeCrs(),minZoom:1,maxZoom:5,layers:[atlas,cayo],preferCanvas:true,zoomControl:true,attributionControl:false});
    L.control.layers({'ATLAS':atlas,'SATELLITE':sat,'GRID':grid},{'CAYO PERICO — SATÉLITE':cayo,'CAYO PERICO — POSTAL':cayoPostal},{collapsed:false,position:'topright'}).addTo(state.map);
    state.cayoBounds=cayoBounds;state.cayoLayer=cayo;state.cayoPostalLayer=cayoPostal;
    state.map.setView(ll(900,-600),3);
    let okCount=0,errCount=0,fallbackUsed=false;
    const ok=()=>{okCount++;setStatus('Mapa GTA V carregado','ok');};
    const err=()=>{errCount++;if(okCount===0&&errCount>4&&!fallbackUsed){fallbackUsed=true;setStatus('Alternando servidor do mapa…','warn');try{state.map.removeLayer(atlas);}catch{}atlas=layer('styleAtlas','jpg',5,1);atlas.on('tileload',ok);atlas.addTo(state.map);}};
    [atlas,sat,grid].forEach(x=>{x.on('tileload',ok);x.on('tileerror',err);});
    state.map.on('mousemove',e=>{if(qs('#mpCursor'))qs('#mpCursor').textContent=`X ${f(e.latlng.lng)} | Y ${f(e.latlng.lat)}`;});
    state.map.on('click',e=>{
      const m=active();if(!m)return;
      if(qs('#mpClicked'))qs('#mpClicked').textContent=`${f(e.latlng.lng)},${f(e.latlng.lat)}`;
      if(state.placing){m.points.push(normalizePoint({x:e.latlng.lng,y:e.latlng.lat,z:null,h:null,status:'planned'},m.points.length));commit('Ponto marcado no mapa');}
      else {m.center.x=e.latlng.lng;m.center.y=e.latlng.lat;syncForm();commit('Centro ajustado no mapa');}
    });
  }

  function pinIcon(p){const cls=isValidated(p)?'validated':'planned';return L.divIcon({className:'',html:`<div class="mp-pin ${cls}">${String(p.id).padStart(2,'0')}</div>`,iconSize:[28,28],iconAnchor:[14,14]});}
  function headingIcon(h){return L.divIcon({className:'',html:`<div class="mp-heading" style="transform:rotate(${Number(h)||0}deg)">↑</div>`,iconSize:[24,24],iconAnchor:[12,12]});}
  function clearLayers(){state.drawn.forEach(o=>{try{state.map.removeLayer(o)}catch{}});state.drawn=[];}
  function renderMap(){
    if(!state.map)return;clearLayers();const m=active();if(!m)return;
    if(validCoord(m.center.x)&&validCoord(m.center.y)){
      const cicon=L.divIcon({className:'',html:'<div class="mp-center-pin">◎</div>',iconSize:[32,32],iconAnchor:[16,16]});
      const center=L.marker(ll(m.center.x,m.center.y),{icon:cicon,draggable:true}).addTo(state.map).bindPopup(`<b>${m.center.label||'Centro'}</b><br>${f(m.center.x)},${f(m.center.y)}${validCoord(m.center.z)?','+f(m.center.z):''}<br><small>Arraste para ajustar o centro</small>`);
      center.on('dragend',ev=>{const n=ev.target.getLatLng();m.center.x=n.lng;m.center.y=n.lat;commit('Centro movido no mapa');});
      state.drawn.push(center);
    }
    m.points.forEach((p,i)=>{
      p.id=i+1;const valid=isValidated(p);const pos=ll(p.x,p.y);
      const circle=L.circle(pos,{radius:Number(m.spawnRadius)||100,weight:2,fillOpacity:.07,dashArray:valid?null:'6 5'}).addTo(state.map);
      const marker=L.marker(pos,{icon:pinIcon(p),draggable:true}).addTo(state.map);
      marker.bindPopup(`<b>Ponto ${String(p.id).padStart(2,'0')}</b><br>Status: <b>${valid?'VALIDADO':'PENDENTE'}</b><br>${f(p.x)},${f(p.y)}${valid?','+f(p.z)+','+f(p.h):''}`);
      marker.on('click',()=>selectPoint(p.id));
      marker.on('dragend',ev=>{const n=ev.target.getLatLng();p.x=n.lng;p.y=n.lat;p.z=null;p.status='planned';p.validatedAt=null;commit(`Ponto ${p.id} movido — validação removida`);selectPoint(p.id);});
      state.drawn.push(circle,marker);
      if(Number.isFinite(p.h)){const a=p.h*Math.PI/180,d=35;state.drawn.push(L.marker(ll(p.x+Math.sin(a)*d,p.y+Math.cos(a)*d),{icon:headingIcon(p.h),interactive:false}).addTo(state.map));}
    });
  }

  function renderMissionList(){
    const box=qs('#mpMissionList');if(!box)return;
    box.innerHTML=state.missions.map(m=>`<button type="button" class="mp-mission-item ${m.id===state.activeId?'active':''}" data-mid="${m.id}"><b>${m.name}</b><small>${m.event} • ${m.points.length} pontos • ${m.points.filter(isValidated).length} validados</small></button>`).join('');
    qsa('[data-mid]',box).forEach(b=>b.onclick=()=>switchMission(b.dataset.mid));
  }
  function renderPointList(){
    const m=active(),box=qs('#mpPointList');if(!box||!m)return;
    if(!m.points.length){box.innerHTML='<div class="mp-note">Nenhum ponto registrado.</div>';return;}
    box.innerHTML=m.points.map((p,i)=>{const valid=isValidated(p);return `<div class="mp-point-row ${valid?'validated':'planned'}" data-pidx="${i}"><div class="mp-point-num">${String(i+1).padStart(2,'0')}</div><div><b>Ponto ${i+1} <span class="mp-state ${valid?'ok':'warn'}">${valid?'VALIDADO':'PENDENTE'}</span></b><small>${f(p.x)},${f(p.y)}${valid?','+f(p.z)+','+f(p.h):' • precisa validar no jogo'}</small></div><div class="mp-row-actions">${valid?`<button type="button" data-copy="${i}" title="Copiar CDS">⧉</button>`:''}<button type="button" data-del="${i}" title="Remover">×</button></div></div>`;}).join('');
    qsa('.mp-point-row',box).forEach(r=>r.onclick=e=>{if(e.target.dataset.copy!==undefined||e.target.dataset.del!==undefined)return;const i=Number(r.dataset.pidx);selectPoint(i+1);state.map?.setView(ll(m.points[i].x,m.points[i].y),5);});
    qsa('[data-copy]',box).forEach(b=>b.onclick=async e=>{e.stopPropagation();const p=m.points[Number(b.dataset.copy)];await copyText(rawCds(p));b.textContent='✓';setTimeout(()=>b.textContent='⧉',800);});
    qsa('[data-del]',box).forEach(b=>b.onclick=e=>{e.stopPropagation();m.points.splice(Number(b.dataset.del),1);commit('Ponto removido');});
  }
  function selectPoint(id){
    const m=active(),p=m?.points[id-1],box=qs('#mpValidationTarget');
    if(box)box.innerHTML=p?`Ponto <b>${String(id).padStart(2,'0')}</b> • ${f(p.x)}, ${f(p.y)} • ${isValidated(p)?'<span class="mp-ok">VALIDADO</span>':'<span class="mp-warn">PENDENTE</span>'}`:'Selecione um ponto.';
    if(m)m.selectedId=id;
    qsa('.mp-point-row').forEach((r,i)=>r.classList.toggle('selected',i===id-1));
  }

  function analyze(){
    const m=active();if(!m)return;let min=Infinity,pair=null,over=0;
    for(let i=0;i<m.points.length;i++)for(let j=i+1;j<m.points.length;j++){const d=Math.hypot(m.points[i].x-m.points[j].x,m.points[i].y-m.points[j].y);if(d<min){min=d;pair=[i+1,j+1];}if(d<(Number(m.spawnRadius)||100)*2)over++;}
    if(qs('#mpCount'))qs('#mpCount').textContent=m.points.length;
    if(qs('#mpValidCount'))qs('#mpValidCount').textContent=m.points.filter(isValidated).length;
    if(qs('#mpPendingCount'))qs('#mpPendingCount').textContent=m.points.filter(p=>!isValidated(p)).length;
    if(qs('#mpOverlap'))qs('#mpOverlap').textContent=over;
    if(qs('#mpNearest'))qs('#mpNearest').textContent=pair?`${pair[0]} ↔ ${pair[1]} • ${min.toFixed(1)} m`:'—';
  }
  function rawCds(p){return `${f(p.x)},${f(p.y)},${f(p.z)},${f(p.h)}`;}
  function updateExport(){const m=active(),out=qs('#mpExport');if(out&&m)out.value=m.points.filter(isValidated).map((p,i)=>`${p.id||i+1} - ${rawCds(p)}`).join('\n');}
  function render(){renderMissionList();renderPointList();renderMap();analyze();updateExport();syncForm();loadSnapshotPreview();}

  function syncForm(){
    const m=active();if(!m)return;
    const vals={mpMissionName:m.name,mpEventType:m.event,mpPanel:m.panel,mpMode:m.mode,mpCenterLabel:m.center.label||'Coordenada central',mpCenterX:m.center.x??'',mpCenterY:m.center.y??'',mpCenterZ:m.center.z??'',mpCenterH:m.center.h??'',mpCircleRadius:m.circleRadius||1000,mpStartAngle:m.startAngle||0,mpRadius:m.spawnRadius||100};
    Object.entries(vals).forEach(([id,v])=>{const el=qs('#'+id);if(el&&document.activeElement!==el)el.value=v;});
    if(qs('#mpRadiusValue'))qs('#mpRadiusValue').textContent=`${m.spawnRadius||100} m`;
    const assist=m.mode==='assistant';qs('#mpModeHint')&&(qs('#mpModeHint').textContent=assist?'ASSISTENTE: todo ponto novo começa PENDENTE e só fica verde após validação explícita.':'MANUAL: CDS completa e não-zero pode ser adicionada já como validada.');
  }

  function commit(reason='Alteração salva'){
    const m=active();if(!m)return;m.updatedAt=nowIso();saveStore();render();setSaveState(`${reason} • salvo automaticamente`);queueSnapshot();
  }
  function setSaveState(t){if(qs('#mpSaveState'))qs('#mpSaveState').textContent=t;}
  function queueSnapshot(){clearTimeout(state.snapshotTimer);state.snapshotTimer=setTimeout(()=>captureSnapshot(false),1100);}
  async function captureSnapshot(download=false){
    const m=active(),el=qs('#missionPlannerMap');if(!m||!el)return;
    try{
      if(typeof html2canvas==='undefined')throw new Error('html2canvas indisponível');
      const canvas=await html2canvas(el,{useCORS:true,allowTaint:false,backgroundColor:'#10151f',logging:false,scale:1});
      const max=1400,ratio=Math.min(1,max/canvas.width);let out=canvas;
      if(ratio<1){out=document.createElement('canvas');out.width=Math.round(canvas.width*ratio);out.height=Math.round(canvas.height*ratio);out.getContext('2d').drawImage(canvas,0,0,out.width,out.height);}
      const dataUrl=out.toDataURL('image/jpeg',0.78);await saveSnapshot(m.id,dataUrl);await loadSnapshotPreview();setSaveState('Missão e print do mapa salvos');
      if(download){const a=document.createElement('a');a.href=dataUrl;a.download=`${safeName(m.name)}-mapa.jpg`;a.click();}
    }catch(e){console.warn(e);if(download)alert('Não foi possível gerar o print do mapa. Aguarde o mapa terminar de carregar e tente novamente.');}
  }
  async function loadSnapshotPreview(){const m=active(),img=qs('#mpSnapshotPreview');if(!m||!img)return;const s=await getSnapshot(m.id);if(s?.dataUrl){img.src=s.dataUrl;img.classList.add('show');if(qs('#mpSnapshotEmpty'))qs('#mpSnapshotEmpty').style.display='none';}else{img.removeAttribute('src');img.classList.remove('show');if(qs('#mpSnapshotEmpty'))qs('#mpSnapshotEmpty').style.display='block';}}
  const safeName=s=>String(s||'missao').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase();

  function fit(){const m=active();if(!state.map||!m)return;const arr=m.points.map(p=>ll(p.x,p.y));if(validCoord(m.center.x)&&validCoord(m.center.y))arr.push(ll(m.center.x,m.center.y));if(arr.length)state.map.fitBounds(L.latLngBounds(arr).pad(.12));}
  function generateCircle(){
    const m=active();if(!m)return;const cx=num(qs('#mpCenterX')?.value),cy=num(qs('#mpCenterY')?.value),qty=Math.max(2,Number(qs('#mpQty')?.value)||2),r=Math.max(1,Number(qs('#mpCircleRadius')?.value)||1000),start=Number(qs('#mpStartAngle')?.value)||0;
    if(cx===null||cy===null){alert('Defina a coordenada central no mapa ou informe X e Y.');return;}
    m.center.x=cx;m.center.y=cy;m.circleRadius=r;m.startAngle=start;m.points=[];
    for(let i=0;i<qty;i++){const deg=start+(360/qty)*i,a=deg*Math.PI/180;m.points.push(normalizePoint({x:cx+Math.sin(a)*r,y:cy+Math.cos(a)*r,z:null,h:(deg+180)%360,status:'planned'},i));}
    commit(`${qty} pontos gerados como PENDENTES`);fit();
  }
  function parseBulk(text){const out=[];String(text||'').split(/\n+/).forEach(line=>{const c=line.replace(/^\s*\d+\s*[-–—:]\s*/,'').trim();if(!c)return;const p=c.split(',').map(v=>v.trim());const x=num(p[0]),y=num(p[1]);if(x===null||y===null)return;out.push({x,y,z:num(p[2]),h:num(p[3])});});return out;}
  function importBulk(){
    const m=active(),arr=parseBulk(qs('#mpBulk')?.value);if(!m||!arr.length){alert('Nenhuma coordenada válida encontrada.');return;}
    const manual=m.mode==='manual';arr.forEach(v=>{const can=manual&&validCoord(v.x)&&validCoord(v.y)&&validCoord(v.z)&&Number.isFinite(v.h);m.points.push(normalizePoint({...v,status:can?'validated':'planned',validatedAt:can?nowIso():null},m.points.length));});commit(`Importadas ${arr.length} CDS`);fit();
  }
  function validateSelected(){
    const m=active(),id=m?.selectedId,p=id?m.points[id-1]:null;if(!p){alert('Selecione o ponto que você está conferindo no jogo.');return;}
    const raw=String(qs('#mpValidateCds')?.value||'').trim().replace(/^tpcds\s+/i,'');const a=raw.split(',').map(v=>v.trim());const x=num(a[0]),y=num(a[1]),z=num(a[2]),h=num(a[3]);
    if(!validCoord(x)||!validCoord(y)||!validCoord(z)||h===null){alert('CDS inválida. Cole X,Y,Z,H completos e sem valor zero.');return;}
    p.x=x;p.y=y;p.z=z;p.h=h;p.status='validated';p.validatedAt=nowIso();if(qs('#mpValidateCds'))qs('#mpValidateCds').value='';commit(`Ponto ${id} validado`);selectPoint(id);state.map?.panTo(ll(x,y));
  }
  function addManual(){
    const m=active();if(!m)return;const x=num(qs('#mpX')?.value),y=num(qs('#mpY')?.value),z=num(qs('#mpZ')?.value),h=num(qs('#mpH')?.value);if(x===null||y===null){alert('Informe X e Y válidos.');return;}
    const can=m.mode==='manual'&&validCoord(x)&&validCoord(y)&&validCoord(z)&&h!==null;m.points.push(normalizePoint({x,y,z,h,status:can?'validated':'planned',validatedAt:can?nowIso():null},m.points.length));commit(can?'Ponto manual validado':'Ponto manual adicionado como PENDENTE');
  }
  function createMission(){const m=newMission();state.missions.unshift(m);state.activeId=m.id;saveStore();render();state.map?.setView(ll(900,-600),3);setSaveState('Nova missão criada');}
  function switchMission(id){state.activeId=id;saveStore();render();setTimeout(fit,80);}
  function deleteMission(){const m=active();if(!m||m.official){alert('Os dois eventos oficiais cadastrados não podem ser apagados. Duplique ou crie uma nova missão.');return;}if(!confirm(`Apagar a missão "${m.name}"?`))return;state.missions=state.missions.filter(x=>x.id!==m.id);state.activeId=state.missions[0]?.id||null;saveStore();render();fit();}
  function duplicateMission(){const m=active();if(!m)return;const c=JSON.parse(JSON.stringify(m));c.id=uid();c.name=`${m.name} — Cópia`;c.official=false;c.createdAt=nowIso();c.updatedAt=nowIso();state.missions.unshift(c);state.activeId=c.id;commit('Missão duplicada');}
  function clearPoints(){const m=active();if(!m||!confirm('Limpar todos os pontos desta missão?'))return;m.points=[];m.selectedId=null;commit('Pontos removidos');}
  async function copyText(text){try{await navigator.clipboard.writeText(text);return true;}catch{}const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');}catch{}ta.remove();return true;}
  async function exportValidated(){const m=active(),v=m?.points.filter(isValidated)||[];if(!v.length){alert('Nenhum ponto validado para exportar.');return;}const txt=v.map((p,i)=>`${p.id||i+1} - ${rawCds(p)}`).join('\n');if(qs('#mpExport'))qs('#mpExport').value=txt;await copyText(txt);}
  async function exportXY(){const m=active();if(!m?.points.length)return;await copyText(m.points.map((p,i)=>`${i+1} - ${f(p.x)},${f(p.y)}`).join('\n'));}
  function generateRequest(){
    const m=active();if(!m)return;const pts=m.points.filter(isValidated);const center=[m.center.x,m.center.y,m.center.z,m.center.h].every(v=>num(v)!==null)?`${f(m.center.x)},${f(m.center.y)},${f(m.center.z)},${f(m.center.h)}`:`${f(m.center.x)},${f(m.center.y)}`;
    const title=m.event||m.name;let text=`Assunto:\n\n- Solicitação de Alteração de Local do Evento ${title}${m.panel?` - Painel ${m.panel}`:''};\n\nSolicitação:\n\n- Solicitamos a alteração do local de realização do evento ${title}${m.panel?` do painel ${m.panel}`:''}.\n\n${String(m.center.label||'Coordenada central').toUpperCase()}:\n\n- ${center}\n\nSPAWNS DAS ORGANIZAÇÕES:\n\n${pts.map((p,i)=>`${String(i+1).padStart(2,'0')} - ${rawCds(p)}`).join('\n')}\n\n- Os pontos de spawn deverão ser distribuídos entre as organizações de acordo com a quantidade de facções inscritas no evento, utilizando 1 ponto diferente para cada organização.\n\n- Caso haja menos organizações inscritas que a quantidade de pontos disponíveis, deverão ser utilizados somente os spawns necessários.\n\n- Todas as demais configurações, regras e funcionamento atualmente existentes no evento deverão permanecer inalterados.`;
    m.requestText=text;if(qs('#mpRequestText'))qs('#mpRequestText').value=text;saveStore();
  }

  function bindFormAutosave(){
    const map={mpMissionName:['name'],mpEventType:['event'],mpPanel:['panel'],mpMode:['mode'],mpCenterLabel:['center','label'],mpCenterX:['center','x'],mpCenterY:['center','y'],mpCenterZ:['center','z'],mpCenterH:['center','h'],mpCircleRadius:['circleRadius'],mpStartAngle:['startAngle'],mpRadius:['spawnRadius']};
    Object.entries(map).forEach(([id,path])=>qs('#'+id)?.addEventListener(id==='mpMode'?'change':'input',e=>{const m=active();if(!m)return;let v=e.target.value;if(['mpCenterX','mpCenterY','mpCenterZ','mpCenterH','mpCircleRadius','mpStartAngle','mpRadius'].includes(id))v=num(v);if(path.length===2)m[path[0]][path[1]]=v;else m[path[0]]=v;if(id==='mpMode'&&v==='assistant'){m.points.forEach(p=>{if(!p.validatedAt&&p.status!=='validated')p.status='planned';});}clearTimeout(state.autosaveTimer);state.autosaveTimer=setTimeout(()=>commit('Alteração'),250);if(id==='mpRadius'&&qs('#mpRadiusValue'))qs('#mpRadiusValue').textContent=`${v||100} m`; }));
  }

  function bind(){
    if(state.initialized)return;state.initialized=true;loadStore();initMap();render();bindFormAutosave();
    qs('#mpNewMission')?.addEventListener('click',createMission);qs('#mpDuplicateMission')?.addEventListener('click',duplicateMission);qs('#mpDeleteMission')?.addEventListener('click',deleteMission);
    qs('#mpPlaceBtn')?.addEventListener('click',()=>{state.placing=!state.placing;qs('#missionPlannerMap')?.classList.toggle('mp-crosshair',state.placing);qs('#mpPlaceBtn').textContent=state.placing?'PARAR DE MARCAR':'MARCAR PONTO NO MAPA';});
    qs('#mpFit')?.addEventListener('click',fit);qs('#mpGoLS')?.addEventListener('click',()=>state.map?.setView(ll(900,-600),3));qs('#mpGoCayo')?.addEventListener('click',()=>{if(state.map&&state.cayoBounds)state.map.fitBounds(state.cayoBounds,{padding:[20,20]});});qs('#mpGenerateCircle')?.addEventListener('click',generateCircle);qs('#mpImport')?.addEventListener('click',importBulk);qs('#mpValidateBtn')?.addEventListener('click',validateSelected);qs('#mpAddCoord')?.addEventListener('click',addManual);qs('#mpClear')?.addEventListener('click',clearPoints);qs('#mpExportBtn')?.addEventListener('click',exportValidated);qs('#mpExportXYBtn')?.addEventListener('click',exportXY);qs('#mpGenerateRequest')?.addEventListener('click',generateRequest);qs('#mpCopyRequest')?.addEventListener('click',()=>copyText(qs('#mpRequestText')?.value||''));qs('#mpCaptureBtn')?.addEventListener('click',()=>captureSnapshot(true));
    setTimeout(()=>{state.map?.invalidateSize();fit();queueSnapshot();},180);
  }
  function activate(){bind();setTimeout(()=>{state.map?.invalidateSize();fit();},100);}
  window.HighMissionPlanner={activate,fit,captureSnapshot};
  document.addEventListener('DOMContentLoaded',()=>{if(qs('#missionPlannerMap'))bind();});
})();
