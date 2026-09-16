/* HIGH OS Planejador de Eventos V9.3.1 — Evento > Zonas + Replicador Inteligente */
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

  const FACXFAC_SUL_CASSINO_25=[
    [339.20,-242.94,53.92,161.58],[497.54,-118.50,61.13,229.61],[341.33,36.93,89.89,79.38],[503.29,104.06,96.30,59.53],[790.90,-107.32,80.42,65.20],[648.68,-12.07,82.60,221.11],[501.28,-357.41,43.15,141.74],[857.94,-325.51,60.52,164.41],[730.53,-467.26,16.82,164.41],[760.79,-705.41,28.49,184.26],[558.64,-790.44,11.09,178.59],[507.35,-631.81,24.75,175.75],[395.99,-884.87,29.42,175.75],[308.56,-729.71,29.32,195.60],[278.11,-589.13,43.30,175.75],[180.35,-855.66,30.94,172.92],[175.55,-412.31,41.15,172.92],[86.11,-673.27,31.64,150.24],[-38.08,-508.43,32.65,79.38],[-21.57,-320.65,45.49,249.45],[668.48,-253.63,44.75,354.34],[-61.42,-90.94,57.78,246.62],[100.74,-3.59,68.09,226.78],[130.37,-206.92,54.53,303.31],[205.79,164.27,105.48,0.00]
  ];
  const FACXFAC_SUL_CEMITERIO_25=[
    [-1480.45,197.56,56.67,107.72],[-1315.17,292.78,64.67,153.08],[-1087.63,336.72,66.86,306.15],[-940.72,177.37,66.00,104.89],[-791.24,58.67,50.31,99.22],[-877.22,-156.40,37.66,79.38],[-1005.16,-312.81,37.86,116.23],[-742.64,-317.43,36.43,150.24],[-789.59,-640.07,28.91,175.75],[-988.14,-639.19,24.25,189.93],[-935.86,-822.64,15.20,189.93],[-1205.96,-686.59,40.36,5.67],[-1255.29,-960.52,2.61,150.24],[-1429.42,-787.66,21.96,215.44],[-1648.25,-971.98,7.70,68.04],[-1363.89,-565.80,30.13,48.19],[-1722.42,-718.11,10.09,300.48],[-1596.96,-552.42,34.81,8.51],[-1806.60,-500.47,39.71,260.79],[-1889.20,-280.31,49.32,246.62],[-2135.02,-305.49,13.19,246.62],[-1689.98,-326.20,50.09,280.63],[-1580.21,-130.82,55.82,82.21],[-1676.53,69.51,63.91,85.04],[-1225.30,-126.56,41.62,311.82]
  ];

  const presets=[
    {id:'dominacao-sul',name:'Dominação — Sul',event:'Dominação',panel:'/ilegal',mode:'assistant',center:{x:116.48,y:-457.27,z:481.13,h:212.6,label:'Centro / área do evento'},radius:1000,points:DOMINACAO_30},
    {id:'facxfac-norte',eventId:'preset_gas_fac-x-fac',name:'Norte - Mar Alamo',event:'Fac x Fac',category:'gas',panel:'/ilegal',mode:'assistant',center:{x:1692.36,y:4040.85,z:281.98,h:22.68,label:'Centro do Gás / Marco Zero'},radius:1000,points:FACXFAC_25},
    {id:'facxfac-sul-cassino-banco',eventId:'preset_gas_fac-x-fac',name:'Sul - Cassino / Banco Central',event:'Fac x Fac',category:'gas',panel:'/ilegal',mode:'assistant',center:{x:351.53,y:-357.41,z:0.00,h:0.00,label:'Centro do Gás / Marco Zero'},radius:1000,points:FACXFAC_SUL_CASSINO_25},
    {id:'facxfac-sul-cemiterio-praia',eventId:'preset_gas_fac-x-fac',name:'Sul - Cemitério / Praia',event:'Fac x Fac',category:'gas',panel:'/ilegal',mode:'assistant',center:{x:-1422.15,y:-287.28,z:46.25,h:133.23,label:'Centro do Gás / Marco Zero'},radius:1000,points:FACXFAC_SUL_CEMITERIO_25},
    {id:'facxfac-cayo-perico',eventId:'preset_gas_fac-x-fac',name:'Cayo Perico',event:'Fac x Fac',category:'gas',panel:'/ilegal',mode:'assistant',center:{x:4787.64,y:-5150.00,z:0.00,h:351.50,label:'Centro do Gás / Marco Zero'},radius:1000,points:[]}
  ];

  const state={map:null,drawn:[],missions:[],activeId:null,initialized:false,placing:false,snapshotTimer:null,autosaveTimer:null,editing:false,editBackup:null,dirty:false,libraryCategory:'dominacao',activeEventId:null,activeMapName:null};
  const f=n=>Number(n).toFixed(2);
  const num=v=>{const n=Number(v);return Number.isFinite(n)?n:null};
  const nowIso=()=>new Date().toISOString();
  const uid=()=>`m_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
  const ll=(x,y)=>L.latLng(Number(y),Number(x));
  const active=()=>state.missions.find(m=>m.id===state.activeId)||null;
  const eventUid=()=>`e_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
  const activeEventId=()=>active()?.eventId||state.activeEventId||null;
  const zonesOfEvent=(eventId)=>state.missions.filter(m=>m.eventId===eventId);
  const mapNameOf=(m)=>m?.mapName||'Mapa Principal';
  const mapsOfEvent=(eventId)=>[...new Set(zonesOfEvent(eventId).map(mapNameOf))];
  const zonesOfMap=(eventId,mapName)=>zonesOfEvent(eventId).filter(m=>mapNameOf(m)===mapName);
  const eventsOfCategory=(category)=> {
    const seen=new Map();
    state.missions.filter(m=>(m.category||'dominacao')===category).forEach(m=>{
      if(!seen.has(m.eventId)) seen.set(m.eventId,{id:m.eventId,name:m.event||'Evento sem nome',category:m.category||category,panel:m.panel||'/ilegal'});
    });
    return [...seen.values()];
  };
  function slugify(s){return String(s||'evento').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'evento';}
  function inferLegacyStructure(m){
    if(m.eventId) return;
    const cat=m.category||((String(m.event||'').toLowerCase().includes('domina'))?'dominacao':'gas');
    const name=String(m.name||'').trim(), evt=String(m.event||'').trim();
    let eventName=evt||name||'Evento';
    let zoneName=name||'Zona Principal';
    if(cat==='dominacao' && /^domina/i.test(evt||'') && /[—-]/.test(name)){
      const parts=name.split(/\s*[—-]\s*/).filter(Boolean);
      if(parts.length>=2){eventName=`Dominação ${parts.slice(1).join(' ')}`;zoneName='Zona Principal';}
      else {eventName=name;zoneName='Zona Principal';}
    } else if(cat==='gas' && /[—-]/.test(name) && evt && name.toLowerCase().startsWith(evt.toLowerCase())){
      const rest=name.slice(evt.length).replace(/^\s*[—-]\s*/,'').trim();
      eventName=evt;zoneName=rest||'Zona Principal';
    } else if(name && evt && name!==evt && !name.toLowerCase().includes('clone')){
      eventName=evt;zoneName=name;
    } else {
      eventName=evt||name||'Evento'; zoneName='Zona Principal';
    }
    m.event=eventName;
    m.name=zoneName;
    m.eventId=`legacy_${cat}_${slugify(eventName)}`;
    m.requestKind=m.requestKind||(m.official?'alter-zone':'create-zone');
  }

  function coverageStats(m){
    if(!m||!validCoord(m.center?.x)||!validCoord(m.center?.y))return null;
    const pts=(m.points||[]).filter(p=>validCoord(p.x)&&validCoord(p.y));
    if(!pts.length)return null;
    let max=-1,maxIndex=-1,sum=0;
    pts.forEach((p,i)=>{const d=Math.hypot(Number(p.x)-Number(m.center.x),Number(p.y)-Number(m.center.y));sum+=d;if(d>max){max=d;maxIndex=(m.points||[]).indexOf(p);}});
    const minimum=Math.ceil(max);
    const recommended=Math.ceil((max*1.02)/100)*100;
    return {count:pts.length,max,minimum,recommended,average:sum/pts.length,farthestIndex:maxIndex};
  }
  function effectiveEventRadius(m){const saved=Number(m?.eventRadius),base=Number(m?.circleRadius),s=coverageStats(m);return Number.isFinite(saved)&&saved>0?saved:(Number.isFinite(base)&&base>0?base:(s?.recommended||1000));}
  function pointDistanceFromCenter(m,p){return Math.hypot(Number(p.x)-Number(m.center.x),Number(p.y)-Number(m.center.y));}
  function pointInsideZone(m,p){if(!m||!p||!validCoord(m.center?.x)||!validCoord(m.center?.y)||!validCoord(p.x)||!validCoord(p.y))return true;return pointDistanceFromCenter(m,p)<=effectiveEventRadius(m);}
  function zoneCoverageCounts(m){const pts=(m?.points||[]).filter(p=>validCoord(p.x)&&validCoord(p.y));const radius=effectiveEventRadius(m);let inside=0,outside=0;pts.forEach(p=>{if(pointDistanceFromCenter(m,p)<=radius)inside++;else outside++;});return {inside,outside,total:pts.length,radius};}

  function validCoord(v){return Number.isFinite(Number(v)) && Number(v)!==0;}

  /* ---------------------------------------------------------------
     V9.4.1 - Leitor de CDS tolerante.
     Aceita, entre outros:
       123.4,-56.7,8.9,180
       tpcds 123.4, -56.7, 8.9, 180
       {123.4,-56.7,8.9,180}   vector4(123.4,-56.7,8.9,180)
       [123.4 -56.7 8.9 180]   123.4; -56.7; 8.9; 180
       x=123.4 y=-56.7 z=8.9 h=180
     Retorna {ok,x,y,z,h,motivo}.
  --------------------------------------------------------------- */
  function parseCds(raw){
    let t=String(raw||'').trim();
    if(!t)return {ok:false,motivo:'Cole a CDS copiada do jogo.'};
    t=t.replace(/^\s*(tpcds|tp|nc|setcoords|coords?)\s*[:=]?\s*/i,'');
    t=t.replace(/vector4|vector3|vec4|vec3/gi,'');
    t=t.replace(/[{}\[\]()]/g,' ');
    t=t.replace(/\b[xyzh]\s*[:=]\s*/gi,' ');
    t=t.replace(/heading|head|rot/gi,' ');
    const nums=t.match(/-?\d+(?:[.,]\d+)?/g)||[];
    const vals=nums.map(v=>Number(String(v).replace(',','.'))).filter(v=>Number.isFinite(v));
    if(vals.length<2)return {ok:false,motivo:'Nao encontrei X e Y na CDS colada.'};
    const [x,y,z,h]=vals;
    return {
      ok:true,
      x,y,
      z:Number.isFinite(z)?z:null,
      h:Number.isFinite(h)?h:null,
      total:vals.length
    };
  }
  function cdsProblemas(r,{exigeZ=true,exigeH=true}={}){
    const out=[];
    if(!validCoord(r.x)||!validCoord(r.y))out.push('X e Y precisam ser numeros diferentes de zero.');
    if(exigeZ&&!validCoord(r.z))out.push('Z ausente ou igual a zero - va ate o local no jogo e copie a CDS real.');
    if(exigeH&&r.h===null)out.push('Heading ausente.');
    if(r.h!==null&&(r.h<-360||r.h>360))out.push('Heading fora da faixa -360..360.');
    return out;
  }
  function distXY(a,b){return Math.hypot(Number(b.x)-Number(a.x),Number(b.y)-Number(a.y));}
  function nextPendingId(m,fromId=0){
    if(!m||!m.points?.length)return 0;
    for(let i=fromId;i<m.points.length;i++)if(!isValidated(m.points[i]))return i+1;
    for(let i=0;i<fromId;i++)if(!isValidated(m.points[i]))return i+1;
    return 0;
  }
  function isValidated(p){return p?.status==='validated' && validCoord(p.x) && validCoord(p.y) && validCoord(p.z) && Number.isFinite(Number(p.h));}
  function isCenterValidated(m){const c=m?.center;return c?.status==='validated' && validCoord(c.x) && validCoord(c.y) && validCoord(c.z) && Number.isFinite(Number(c.h));}
  function normalizeCenter(m){if(!m?.center)return;const c=m.center;const complete=validCoord(c.x)&&validCoord(c.y)&&validCoord(c.z)&&Number.isFinite(Number(c.h));if(!c.status){c.status=complete?'validated':'planned';c.validatedAt=complete?(c.validatedAt||nowIso()):null;}else if(c.status==='planned'&&complete&&!c.validationReason){/* migração: clones antigos perdiam a validação apenas ao trocar de categoria */c.status='validated';c.validatedAt=c.validatedAt||nowIso();}}
  function normalizePoint(p,i,statusDefault='planned'){
    return {id:i+1,x:num(p.x),y:num(p.y),z:num(p.z),h:num(p.h),status:p.status||statusDefault,validatedAt:p.validatedAt||null};
  }
  function presetMission(p){
    const category=p.category||(p.event==='Dominação'?'dominacao':'gas');
    let eventName=p.event, zoneName=p.name;
    if(category==='dominacao' && /Sul/i.test(p.name)){eventName='Dominação Sul';zoneName='Zona Principal';}
    if(category==='gas' && /Fac x Fac/i.test(p.event||p.name) && !p.eventId){eventName='Fac x Fac';zoneName=(/Norte/i.test(p.name)?'Norte':'Zona Principal');}
    return {id:p.id,eventId:p.eventId||`preset_${category}_${slugify(eventName)}`,mapName:p.mapName||'Mapa Principal',name:zoneName,event:eventName,panel:p.panel,mode:p.mode,category,center:{...p.center,status:'validated',validatedAt:nowIso()},circleRadius:p.radius,eventRadius:null,startAngle:0,spawnRadius:100,createdAt:nowIso(),updatedAt:nowIso(),points:p.points.map((v,i)=>normalizePoint({x:v[0],y:v[1],z:v[2],h:v[3],status:'validated',validatedAt:nowIso()},i,'validated')),requestText:'',requestKind:'alter-zone',official:true,facxfacScenarios:p.facxfacScenarios?JSON.parse(JSON.stringify(p.facxfacScenarios)):null,activeScenario:0};
  }
  function newMission(eventId=null,eventName=null,category=null){
    const cat=category||state.libraryCategory||'dominacao';
    return {id:uid(),eventId:eventId||eventUid(),mapName:'Mapa Principal',name:'Zona Principal',event:eventName||(cat==='gas'?'Novo Evento de Gás':'Novo Evento de Dominação'),panel:'/ilegal',mode:'assistant',category:cat,center:{x:null,y:null,z:null,h:null,label:cat==='gas'?'Centro do Gás / Marco Zero':'Centro da Zona do Evento',status:'planned',validatedAt:null},circleRadius:1000,eventRadius:null,startAngle:0,spawnRadius:100,createdAt:nowIso(),updatedAt:nowIso(),points:[],requestText:'',requestKind:eventId?'create-zone':'create-event',official:false};
  }


  function normalizeText(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
  function repairKnownZoneAssignments(){
    // Corrige migração V8: a antiga missão "Hoje é dia de Guerra - Zona Cemiterio Praia"
    // deve ser uma ZONA dentro do evento "Hoje é Dia de Guerra", e não um evento separado.
    const gas=state.missions.filter(m=>(m.category||'dominacao')==='gas');
    const candidates=gas.filter(m=>{
      const t=normalizeText(`${m.event||''} ${m.name||''}`);
      return t.includes('hoje')&&t.includes('dia')&&t.includes('guerra')&&t.includes('cemiterio')&&t.includes('praia');
    });
    if(!candidates.length)return;
    const existing=gas.find(m=>{
      const e=normalizeText(m.event||'');
      const z=normalizeText(m.name||'');
      return e.includes('hoje')&&e.includes('dia')&&e.includes('guerra')&&!e.includes('cemiterio')&&!e.includes('praia')&&!z.includes('cemiterio');
    });
    const targetEventId=existing?.eventId||'legacy_gas_hoje-e-dia-de-guerra';
    const targetEventName=existing?.event||'Hoje é Dia de Guerra';
    candidates.forEach(m=>{
      m.eventId=targetEventId;
      m.event=targetEventName;
      m.name='Cemitério / Praia';
      if(!m.requestKind||m.requestKind==='create-event')m.requestKind='create-zone';
      m.updatedAt=nowIso();
    });
  }

  function repairFacxFacHierarchy(){
    const all=state.missions.filter(m=>normalizeText(m.event||'').includes('fac x fac')||normalizeText(m.event||'').includes('facxfac'));
    if(!all.length)return false;
    let changed=false;
    const target='preset_gas_fac-x-fac';
    // Migra as versões 9.2.8–9.3.0: qualquer cenário/subnível vira uma ZONA normal na coluna da direita.
    const legacySul=all.find(m=>m.id==='facxfac-sul');
    if(legacySul?.facxfacScenarios?.length){
      legacySul.facxfacScenarios.forEach((sc,i)=>{
        const id=i===0?'facxfac-sul-cassino-banco':'facxfac-sul-cemiterio-praia';
        if(!state.missions.some(x=>x.id===id)){
          const z=JSON.parse(JSON.stringify(legacySul));z.id=id;z.eventId=target;z.event='Fac x Fac';z.category='gas';z.name=i===0?'Sul - Cassino / Banco Central':'Sul - Cemitério / Praia';z.center=JSON.parse(JSON.stringify(sc.center));z.points=JSON.parse(JSON.stringify(sc.points||[]));delete z.facxfacScenarios;delete z.activeScenario;delete z.mapName;state.missions.push(z);changed=true;
        }
      });
    }
    state.missions=state.missions.filter(m=>m.id!=='facxfac-sul');
    const rename={
      'facxfac-norte':'Norte - Mar Alamo',
      'facxfac-sul-cassino-banco':'Sul - Cassino / Banco Central',
      'facxfac-sul-cemiterio-praia':'Sul - Cemitério / Praia',
      'facxfac-cayo-perico':'Cayo Perico'
    };
    state.missions.forEach(m=>{if(rename[m.id]){if(m.eventId!==target||m.event!=='Fac x Fac'||m.name!==rename[m.id]||m.mapName||m.facxfacScenarios){m.eventId=target;m.event='Fac x Fac';m.name=rename[m.id];m.category='gas';delete m.mapName;delete m.facxfacScenarios;delete m.activeScenario;changed=true;}}});
    // Remove duplicatas legadas do Fac x Fac, preservando apenas as quatro zonas oficiais e zonas criadas manualmente.
    const officialIds=new Set(Object.keys(rename));
    const seen=new Set();
    state.missions=state.missions.filter(m=>{
      if(m.eventId!==target)return true;
      if(officialIds.has(m.id))return true;
      const n=normalizeText(m.name||'');
      if(n==='norte'||n==='sul'||n==='zona principal'||n==='mapa principal')return false;
      const key=n;if(seen.has(key))return false;seen.add(key);return true;
    });
    return changed;
  }

  const SAVED_AT='highos_mission_planner_saved_at';
  function saveStore(){
    try{
      localStorage.setItem(STORE,JSON.stringify(state.missions));
      localStorage.setItem(ACTIVE,state.activeId||'');
      if(!state.applyingCloud)localStorage.setItem(SAVED_AT,new Date().toISOString());
    }catch(e){console.warn('Planejador: falha ao salvar',e);}
    if(state.applyingCloud)return;
    try{window.HighOSMissionCloud?.push?.(state.missions);}catch(e){console.warn('Planejador: falha ao enfileirar sincronizacao',e);}
  }
  function applyCloudMissions(list){
    if(!Array.isArray(list)||!list.length)return false;
    state.applyingCloud=true;
    try{
      state.missions=list;
      state.missions.forEach(m=>{normalizeCenter(m);if(!m.category)m.category=(String(m.event||'').toLowerCase().includes('domina')?'dominacao':'gas');inferLegacyStructure(m);});
      mergeOfficialPresets();
      if(!state.missions.some(m=>m.id===state.activeId))state.activeId=state.missions[0]?.id||'';
      state.activeEventId=active()?.eventId||state.activeEventId;
      saveStore();
      render();
      return true;
    }catch(e){console.warn('Planejador: falha ao aplicar missoes da nuvem',e);return false;}
    finally{state.applyingCloud=false;}
  }
  function syncMissionsFromCloud(tries=0){
    const cloud=window.HighOSMissionCloud;
    if(!cloud||!cloud.pull){if(tries<12)setTimeout(()=>syncMissionsFromCloud(tries+1),1500);return;}
    cloud.pull().then(res=>{
      if(!res||!Array.isArray(res.missions)||!res.missions.length)return;
      let localAt='';try{localAt=localStorage.getItem(SAVED_AT)||'';}catch(e){}
      const remoteAt=String(res.updatedAtText||'');
      if(localAt&&remoteAt&&remoteAt<=localAt)return;
      if(applyCloudMissions(res.missions)){
        try{localStorage.setItem(SAVED_AT,remoteAt||new Date().toISOString());}catch(e){}
        setStatus('Missoes sincronizadas com a equipe.','ok');
      }
    }).catch(()=>{});
  }
  function mergeOfficialPresets(){
    const byId=new Set(state.missions.map(m=>m.id));
    let changed=false;
    presets.forEach(p=>{
      const existing=state.missions.find(m=>m.id===p.id);
      if(existing){
        const fresh=presetMission(p);
        ['eventId','event','name','category','panel'].forEach(k=>{if(existing[k]!==fresh[k]){existing[k]=fresh[k];changed=true;}});
        if(fresh.facxfacScenarios&&!existing.facxfacScenarios){existing.facxfacScenarios=fresh.facxfacScenarios;existing.activeScenario=0;changed=true;}return;
      }
      state.missions.push(presetMission(p));
      byId.add(p.id);changed=true;
    });
    return changed;
  }

  function loadStore(){
    try{
      const raw=JSON.parse(localStorage.getItem(STORE)||'null');
      if(Array.isArray(raw)&&raw.length){state.missions=raw;state.missions.forEach(m=>{normalizeCenter(m);if(!m.category)m.category=(String(m.event||'').toLowerCase().includes('domina')?'dominacao':'gas');inferLegacyStructure(m);});repairKnownZoneAssignments();repairFacxFacHierarchy();mergeOfficialPresets();state.activeId=localStorage.getItem(ACTIVE)||raw[0].id;const am=state.missions.find(m=>m.id===state.activeId)||raw[0];state.libraryCategory=(am?.category||'dominacao');state.activeEventId=am?.eventId||null;saveStore();return;}
    }catch{}
    state.missions=presets.map(presetMission);state.activeId=state.missions[0].id;state.libraryCategory=state.missions[0]?.category||'dominacao';state.activeEventId=state.missions[0]?.eventId||null;saveStore();
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

  /* ---------------------------------------------------------------
     V9.4.1 - O mar de Cayo Perico e um retangulo desenhado por nos,
     enquanto o mar de Los Santos vem pintado dentro dos tiles. Antes
     usavamos um azul fixo e a emenda ficava visivel. Agora lemos um
     pixel de oceano do proprio tile carregado e aplicamos a mesma cor
     no retangulo e no fundo do mapa - funciona para Atlas, Satelite e
     Grid, e se ajusta sozinho ao trocar de camada.
  --------------------------------------------------------------- */
  const OCEAN_FALLBACK='#0d1b2a';
  function applyOceanColor(hex){
    if(!hex)return;
    state.oceanColor=hex;
    try{state.cayoOceanLayer?.setStyle({fillColor:hex});}catch(e){}
    const box=qs('#missionPlannerMap');
    if(box)box.style.setProperty('--mp-ocean',hex);
  }
  function sampleOceanFromTile(img){
    try{
      if(!img||!img.naturalWidth)return null;
      const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;
      const ctx=c.getContext('2d',{willReadFrequently:true});
      ctx.drawImage(img,0,0);
      const pts=[[2,2],[c.width-3,2],[2,c.height-3],[c.width-3,c.height-3],[c.width>>1,2]];
      const cores=pts.map(([x,y])=>{const d=ctx.getImageData(x,y,1,1).data;return [d[0],d[1],d[2],d[3]];}).filter(d=>d[3]>200);
      if(cores.length<4)return null;
      const media=[0,1,2].map(i=>cores.reduce((a,c2)=>a+c2[i],0)/cores.length);
      // so aceita se as amostras forem parecidas entre si (tile uniforme = mar aberto)
      const desvio=Math.max(...[0,1,2].map(i=>Math.max(...cores.map(c2=>Math.abs(c2[i]-media[i])))));
      if(desvio>14)return null;
      const [r,g,b]=media.map(v=>Math.round(v));
      // e se realmente parecer agua (azul/verde dominante e nao muito claro)
      if(b<40||b<r||(r+g+b)/3>190)return null;
      return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
    }catch(e){return null;}
  }
  function watchOcean(layer){
    if(!layer||layer._mpOceanWatch)return;layer._mpOceanWatch=true;
    layer.on('tileload',ev=>{
      if(state.oceanLocked)return;
      const hex=sampleOceanFromTile(ev.tile);
      if(hex){state.oceanLocked=true;applyOceanColor(hex);}
    });
  }
  function initMap(){
    if(state.map||!qs('#missionPlannerMap'))return;
    if(typeof L==='undefined'){setStatus('Leaflet não carregou','warn');return;}
    let atlas=layer('styleAtlas'),sat=layer('styleSatelite'),grid=layer('styleGrid','png');
    // Cayo Perico overlay calibrated to the GTA/FiveM world-coordinate region around 4700,-5150.
    // It is an overlay (not a separate coordinate system), so clicks/markers continue returning GTA X/Y.
    const cayoUrl='https://raw.githubusercontent.com/fivenet-app/livemap-tiles/main/overlays/cayo-perico/satellite.webp';
    const cayoPostalUrl='https://raw.githubusercontent.com/fivenet-app/livemap-tiles/main/overlays/cayo-perico/postal.webp';
    const cayoBounds=L.latLngBounds(ll(3900,-6000),ll(5600,-4300));
    // Fundo de oceano próprio para a região de Cayo. O mapa base não possui tiles nessa área,
    // então este retângulo evita o vazio/preto ao redor da ilha sem alterar as coordenadas GTA/FiveM.
    state.map=L.map('missionPlannerMap',{crs:makeCrs(),minZoom:1,maxZoom:5,layers:[atlas],preferCanvas:true,zoomControl:true,attributionControl:false});
    state.map.createPane('cayoOceanPane');state.map.getPane('cayoOceanPane').style.zIndex=220;
    state.map.createPane('cayoMapPane');state.map.getPane('cayoMapPane').style.zIndex=230;
    const cayoOceanBounds=L.latLngBounds(ll(3450,-6450),ll(6050,-3850));
    const cayoOcean=L.rectangle(cayoOceanBounds,{pane:'cayoOceanPane',stroke:false,fill:true,fillColor:OCEAN_FALLBACK,fillOpacity:1,interactive:false}).addTo(state.map);
    const cayo=L.imageOverlay(cayoUrl,cayoBounds,{pane:'cayoMapPane',opacity:1,interactive:false,crossOrigin:true});
    const cayoPostal=L.imageOverlay(cayoPostalUrl,cayoBounds,{pane:'cayoMapPane',opacity:1,interactive:false,crossOrigin:true});
    L.control.layers({'ATLAS':atlas,'SATELLITE':sat,'GRID':grid},{'CAYO PERICO — SATÉLITE':cayo,'CAYO PERICO — POSTAL':cayoPostal},{collapsed:false,position:'topright'}).addTo(state.map);
    state.cayoBounds=cayoBounds;state.cayoOceanBounds=cayoOceanBounds;state.cayoOceanLayer=cayoOcean;state.cayoLayer=cayo;state.cayoPostalLayer=cayoPostal;state.atlasLayer=atlas;state.satLayer=sat;state.gridLayer=grid;
    state.map.setView(ll(900,-600),3);
    let okCount=0,errCount=0,fallbackUsed=false;
    const ok=()=>{okCount++;setStatus('Mapa GTA V carregado','ok');};
    const err=()=>{errCount++;if(okCount===0&&errCount>4&&!fallbackUsed){fallbackUsed=true;setStatus('Alternando servidor do mapa…','warn');try{state.map.removeLayer(atlas);}catch{}atlas=layer('styleAtlas','jpg',5,1);atlas.on('tileload',ok);atlas.addTo(state.map);}};
    [atlas,sat,grid].forEach(x=>{x.on('tileload',ok);x.on('tileerror',err);watchOcean(x);});
    applyOceanColor(OCEAN_FALLBACK);
    state.map.on('baselayerchange',ev=>{state.oceanLocked=false;watchOcean(ev.layer);setTimeout(()=>{if(!state.oceanLocked)applyOceanColor(OCEAN_FALLBACK);},1200);});
    state.map.on('mousemove',e=>{if(qs('#mpCursor'))qs('#mpCursor').textContent=`X ${f(e.latlng.lng)} | Y ${f(e.latlng.lat)}`;});
    state.map.on('click',e=>{
      const m=active();if(!m)return;
      if(!state.editing){if(qs('#mpClicked'))qs('#mpClicked').textContent='Modo visualização: clique em EDITAR EVENTO para alterar posições.';return;}
      if(qs('#mpClicked'))qs('#mpClicked').textContent=`${f(e.latlng.lng)},${f(e.latlng.lat)}`;
      if(state.placing){m.points.push(normalizePoint({x:e.latlng.lng,y:e.latlng.lat,z:0,h:0,status:'planned'},m.points.length));commit('Ponto marcado no mapa');}
      else {m.center.x=e.latlng.lng;m.center.y=e.latlng.lat;m.center.z=0;m.center.h=0;m.center.status='planned';m.center.validatedAt=null;m.center.validationReason='coordinate-change';syncForm();commit('Centro ajustado no mapa — validação removida');}
    });
  }

  function pinIcon(p,outside=false){const cls=isValidated(p)?'validated':'planned';const warn=outside?' style="outline:3px solid #ff5252;box-shadow:0 0 0 5px rgba(255,82,82,.22)"':'';return L.divIcon({className:'',html:`<div class="mp-pin ${cls} ${outside?'outside':''}"${warn}>${outside?'!':''}${String(p.id).padStart(2,'0')}</div>`,iconSize:[outside?34:28,outside?34:28],iconAnchor:[outside?17:14,outside?17:14]});}
  function headingIcon(h){return L.divIcon({className:'',html:`<div class="mp-heading" style="transform:rotate(${Number(h)||0}deg)">↑</div>`,iconSize:[24,24],iconAnchor:[12,12]});}
  function clearLayers(){state.drawn.forEach(o=>{try{state.map.removeLayer(o)}catch{}});state.drawn=[];}
  function renderMap(){
    if(!state.map)return;clearLayers();const m=active();if(!m)return;
    if(validCoord(m.center.x)&&validCoord(m.center.y)){
      const cicon=L.divIcon({className:'',html:`<div class="mp-center-pin ${isCenterValidated(m)?'validated':'planned'}">◎</div>`,iconSize:[32,32],iconAnchor:[16,16]});
      const center=L.marker(ll(m.center.x,m.center.y),{icon:cicon,draggable:state.editing}).addTo(state.map).bindPopup(`<b>${m.center.label||'Centro'}</b><br>Status: <b>${isCenterValidated(m)?'VALIDADO':'PENDENTE'}</b><br>${f(m.center.x)},${f(m.center.y)}${isCenterValidated(m)?','+f(m.center.z)+','+f(m.center.h):',0.00,0.00'}<br><small>${state.editing?'Arraste para ajustar o centro':'Visualização • ponto travado'}</small>`);
      center.on('dragend',ev=>{const n=ev.target.getLatLng();m.center.x=n.lng;m.center.y=n.lat;m.center.z=0;m.center.h=0;m.center.status='planned';m.center.validatedAt=null;m.center.validationReason='coordinate-change';commit('Centro movido no mapa — validação removida');});
      state.drawn.push(center);
      const eventRadius=effectiveEventRadius(m);
      if(eventRadius>0){
        const zone=L.circle(ll(m.center.x,m.center.y),{radius:eventRadius,weight:2,fillOpacity:.035,dashArray:(m.category||'dominacao')==='gas'?'8 6':null,interactive:false}).addTo(state.map);
        state.drawn.push(zone);
      }
    }
    m.points.forEach((p,i)=>{
      p.id=i+1;const valid=isValidated(p),outside=((m.category||'dominacao')==='gas')&&!pointInsideZone(m,p),pos=ll(p.x,p.y);
      const circle=L.circle(pos,{radius:Number(m.spawnRadius)||100,weight:outside?3:2,fillOpacity:outside?.14:.07,dashArray:outside?'3 4':(valid?null:'6 5'),color:outside?'#ff5252':undefined,fillColor:outside?'#ff5252':undefined}).addTo(state.map);
      const marker=L.marker(pos,{icon:pinIcon(p,outside),draggable:state.editing}).addTo(state.map);
      marker.bindPopup(`<b>Ponto ${String(p.id).padStart(2,'0')}</b><br>Status: <b>${valid?'VALIDADO':'PENDENTE'}</b>${outside?'<br><b style="color:#ff7474">FORA DA ZONA ⚠</b>':''}<br>${f(p.x)},${f(p.y)}${valid?','+f(p.z)+','+f(p.h):''}`);
      marker.on('click',()=>selectPoint(p.id));
      marker.on('dragend',ev=>{const n=ev.target.getLatLng();p.x=n.lng;p.y=n.lat;p.z=0;p.status='planned';p.validatedAt=null;commit(`Ponto ${p.id} movido — validação removida`);selectPoint(p.id);});
      state.drawn.push(circle,marker);
      if(Number.isFinite(p.h)){const a=p.h*Math.PI/180,d=35;state.drawn.push(L.marker(ll(p.x+Math.sin(a)*d,p.y+Math.cos(a)*d),{icon:headingIcon(p.h),interactive:false}).addTo(state.map));}
    });
  }

  function renderEventList(){
    const box=qs('#mpEventList');if(!box)return;
    const cat=state.libraryCategory||active()?.category||'dominacao';
    const events=eventsOfCategory(cat);
    let selected=activeEventId();
    if(!events.some(e=>e.id===selected) && events[0]) selected=events[0].id;
    state.activeEventId=selected||null;
    box.innerHTML=events.length?events.map(e=>{
      const zones=zonesOfEvent(e.id),ready=zones.filter(z=>isCenterValidated(z)&&z.points?.length&&z.points.every(isValidated)).length;
      return `<button type="button" class="mp-event-item ${e.id===selected?'active':''}" data-eid="${e.id}"><span><b>${e.name}</b><small>${zones.length} zona${zones.length===1?'':'s'} • ${ready}/${zones.length} prontas</small></span><span class="mp-event-arrow">›</span></button>`;
    }).join(''):`<div class="mp-note">Nenhum evento cadastrado neste tipo.</div>`;
    qsa('[data-eid]',box).forEach(b=>b.onclick=()=>switchEvent(b.dataset.eid));
  }
  function renderMissionList(){
    const box=qs('#mpMissionList');if(!box)return;
    renderEventList();
    const eid=activeEventId();
    const zones=eid?zonesOfEvent(eid):[];
    box.innerHTML=zones.length?zones.map(m=>{
      const total=m.points.length,validated=m.points.filter(isValidated).length;
      const gas=(m.category||'dominacao')==='gas', coverage=gas?zoneCoverageCounts(m):null;
      const warn=gas&&coverage?.outside>0;
      const scenarios=m.facxfacScenarios?.length?`<span>${m.facxfacScenarios.length} cenários</span>`:'';
      return `<button type="button" class="mp-mission-item ${m.id===state.activeId?'active':''}" data-mid="${m.id}"><span class="mp-mission-card-top"><b>${m.name||'Zona sem nome'}</b><span class="mp-mission-kind ${gas?'gas':'dominacao'}">${gas?'GÁS':'DOMINAÇÃO'}</span></span><small>${m.event||'Evento'}</small><span class="mp-mission-meta"><span>${total} spawns</span><span>${validated}/${total} validados</span>${scenarios}${warn?`<span class="warn">${coverage.outside} fora da safe</span>`:''}</span></button>`;
    }).join(''):`<div class="mp-note">Este evento ainda não possui zonas.</div>`;
    qsa('[data-mid]',box).forEach(b=>b.onclick=()=>switchMission(b.dataset.mid));
    renderLibraryCategoryUi();
  }
  function renderScenarioSelector(){
    const m=active();let host=qs('#mpScenarioSelector');
    if(!m?.facxfacScenarios?.length){host?.remove();return;}
    if(!host){host=document.createElement('div');host.id='mpScenarioSelector';host.className='mp-scenario-selector';const card=qs('.mission-planner-side .mp-card');if(card)card.insertAdjacentElement('afterbegin',host);}
    const idx=Math.min(Number(m.activeScenario)||0,m.facxfacScenarios.length-1);m.activeScenario=idx;
    host.innerHTML=`<div class="mp-scenario-title"><b>CENÁRIO DO SUL</b><small>O card continua sendo a zona Sul; escolha qual conjunto de CDS editar/visualizar.</small></div><div class="mp-scenario-buttons">${m.facxfacScenarios.map((x,i)=>`<button type="button" data-scenario="${i}" class="${i===idx?'active':''}">${x.name}</button>`).join('')}</div>`;
    qsa('[data-scenario]',host).forEach(b=>b.onclick=()=>switchScenario(Number(b.dataset.scenario)));
  }
  function persistScenario(m){if(!m?.facxfacScenarios?.length)return;const i=Math.min(Number(m.activeScenario)||0,m.facxfacScenarios.length-1);m.facxfacScenarios[i]={name:m.facxfacScenarios[i].name,center:JSON.parse(JSON.stringify(m.center)),points:JSON.parse(JSON.stringify(m.points||[]))};}
  function switchScenario(i){const m=active();if(!m?.facxfacScenarios?.[i])return;if(state.editing&&state.dirty&&!confirm('Existem alterações não salvas neste cenário. Deseja trocar mesmo assim?'))return;persistScenario(m);m.activeScenario=i;const a=m.facxfacScenarios[i];m.center=JSON.parse(JSON.stringify(a.center));m.points=JSON.parse(JSON.stringify(a.points));saveStore();render();focusActiveMission(false);}

  function renderLibraryCategoryUi(){
    const host=qs('#mpCategoryLibrary');if(!host)return;
    const cat=state.libraryCategory||'dominacao';
    host.innerHTML=`<div class="mp-hierarchy-head"><div><span>TIPO DE EVENTO</span><strong>${cat==='gas'?'ZONA DE GÁS':'DOMINAÇÃO'}</strong></div><div class="mp-hierarchy-path">${active()?.event||'Selecione um evento'} <b>›</b> ${active()?.name||'Selecione uma zona'}</div></div><div class="mp-type-tabs"><button type="button" id="mpLibDominacao" class="${cat==='dominacao'?'primary':''}">DOMINAÇÃO</button><button type="button" id="mpLibGas" class="${cat==='gas'?'primary':''}">ZONA DE GÁS</button></div><div class="mp-note">${cat==='gas'?'Safe inicial + fechamento progressivo. Os spawns devem iniciar dentro da safe.':'Área fixa de disputa. Os spawns podem ficar dentro ou fora da área de Dominação.'}</div>`;
    const change=(next)=>{if(next===state.libraryCategory)return;if(state.editing&&state.dirty&&!confirm('Existem alterações não salvas. Deseja descartá-las para trocar de tipo?'))return;if(state.editing)cancelEdit();state.libraryCategory=next;const first=state.missions.find(m=>(m.category||'dominacao')===next);if(first){state.activeId=first.id;state.activeEventId=first.eventId;}saveStore();render();updateEditUi();setTimeout(()=>focusActiveMission(false),80);};
    qs('#mpLibDominacao')?.addEventListener('click',()=>change('dominacao'));
    qs('#mpLibGas')?.addEventListener('click',()=>change('gas'));
  }
  function renderPointList(){
    const m=active(),box=qs('#mpPointList');if(!box||!m)return;
    if(!m.points.length){box.innerHTML='<div class="mp-note">Nenhum ponto registrado.</div>';return;}
    box.innerHTML=m.points.map((p,i)=>{const valid=isValidated(p);return `<div class="mp-point-row ${valid?'validated':'planned'}" data-pidx="${i}"><div class="mp-point-num">${String(i+1).padStart(2,'0')}</div><div><b>Ponto ${i+1} <span class="mp-state ${valid?'ok':'warn'}">${valid?'VALIDADO':'PENDENTE'}</span></b><small>${valid?rawCds(p):tpCds(p)+' • Z provisório para TP/NC'}</small></div><div class="mp-row-actions"><button type="button" data-copy="${i}" title="${valid?'Copiar CDS validada':'Copiar CDS provisória para TPCDS'}">⧉</button><button type="button" data-del="${i}" title="Remover">×</button></div></div>`;}).join('');
    qsa('.mp-point-row',box).forEach(r=>r.onclick=e=>{if(e.target.dataset.copy!==undefined||e.target.dataset.del!==undefined)return;const i=Number(r.dataset.pidx);selectPoint(i+1);state.map?.setView(ll(m.points[i].x,m.points[i].y),5);});
    qsa('[data-copy]',box).forEach(b=>b.onclick=async e=>{e.stopPropagation();const p=m.points[Number(b.dataset.copy)];await copyText(isValidated(p)?rawCds(p):tpCds(p));b.textContent='✓';setTimeout(()=>b.textContent='⧉',800);});
    qsa('[data-del]',box).forEach(b=>b.onclick=e=>{e.stopPropagation();if(!requireEdit())return;m.points.splice(Number(b.dataset.del),1);commit('Ponto removido');});
  }
  function selectPoint(id){
    const m=active(),p=m?.points[id-1],box=qs('#mpValidationTarget');
    if(box)box.innerHTML=p?`Ponto <b>${String(id).padStart(2,'0')}</b> • ${isValidated(p)?rawCds(p):tpCds(p)} • ${isValidated(p)?'<span class="mp-ok">VALIDADO</span>':'<span class="mp-warn">PENDENTE / Z PROVISÓRIO</span>'}`:'Selecione um ponto.';
    if(m)m.selectedId=id;
    qsa('.mp-point-row').forEach((r,i)=>r.classList.toggle('selected',i===id-1));
  }

  function ensureCenterValidationUi(){
    const clicked=qs('#mpClicked');if(!clicked||qs('#mpCenterValidation'))return;
    const wrap=document.createElement('div');wrap.id='mpCenterValidation';wrap.style.marginTop='8px';
    wrap.innerHTML=`<div id="mpCenterValidationStatus" class="mp-readout"></div><div class="mp-actions"><button type="button" id="mpCopyCenterTp">COPIAR TP DO CENTRO</button></div><label style="margin-top:8px">Cole a CDS real do centro<input id="mpCenterRealCds" placeholder="4869.25,-5060.22,292.63,306.15"></label><div class="mp-actions"><button type="button" id="mpValidateCenter" class="primary">VALIDAR CENTRO</button></div>`;
    clicked.insertAdjacentElement('afterend',wrap);
    qs('#mpCopyCenterTp')?.addEventListener('click',async()=>{const m=active();if(!m||!validCoord(m.center.x)||!validCoord(m.center.y)){alert('Marque primeiro o centro no mapa.');return;}await copyText(`${f(m.center.x)},${f(m.center.y)},0.00,${Number.isFinite(Number(m.center.h))?f(m.center.h):'0.00'}`);const b=qs('#mpCopyCenterTp');if(b){const old=b.textContent;b.textContent='COPIADO ✓';setTimeout(()=>b.textContent=old,900);}});
    qs('#mpValidateCenter')?.addEventListener('click',validateCenter);
  }
  function renderCenterValidation(){ensureCenterValidationUi();const m=active(),el=qs('#mpCenterValidationStatus');if(!m||!el)return;el.innerHTML=isCenterValidated(m)?`<b>CENTRO VALIDADO ✓</b><br>${rawCds(m.center)}`:(validCoord(m.center.x)&&validCoord(m.center.y)?`<b>CENTRO PENDENTE</b><br>${f(m.center.x)},${f(m.center.y)},0.00,0.00 • copie o TP, vá ao local e cole a CDS real.`:'Marque o centro no mapa para iniciar a validação.');}
  function validateCenter(){if(!requireEdit())return;
    const m=active();if(!m)return;const r=parseCds(qs('#mpCenterRealCds')?.value);
    if(!r.ok){alert('CDS do centro nao reconhecida. '+r.motivo);return;}
    const probsC=cdsProblemas(r);
    if(probsC.length){alert('CDS do centro incompleta:\n\n'+probsC.join('\n'));return;}
    const x=r.x,y=r.y,z=r.z,h=r.h===null?0:r.h;
    m.center.x=x;m.center.y=y;m.center.z=z;m.center.h=h;m.center.status='validated';m.center.validatedAt=nowIso();delete m.center.validationReason;if(qs('#mpCenterRealCds'))qs('#mpCenterRealCds').value='';commit('Centro validado com CDS real');state.map?.panTo(ll(x,y));
  }

  function ensureCoverageUi(){
    const anchor=qs('#mpCenterValidation');if(!anchor||qs('#mpCoverageBox'))return;
    const box=document.createElement('div');box.id='mpCoverageBox';box.style.marginTop='10px';
    box.innerHTML=`<div class="mp-readout"><b id="mpCoverageTitle">COBERTURA DA ZONA</b><div id="mpCoverageStatus" style="margin-top:6px">—</div></div><label style="margin-top:8px">Raio visual da zona (m)<input id="mpEventRadius" type="number" min="50" step="50" placeholder="1000"></label><div class="mp-actions" style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" id="mpRadiusMinus50">-50</button><button type="button" id="mpRadiusPlus50">+50</button><button type="button" id="mpRadiusMinus100">-100</button><button type="button" id="mpRadiusPlus100">+100</button></div><div class="mp-actions" style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" id="mpUseRecommendedRadius">COBRIR TODOS</button><button type="button" id="mpFitZone">ENQUADRAR ZONA</button><button type="button" id="mpGenerateInsideZone">GERAR SPAWNS DENTRO DA ZONA</button></div><div class="mp-note" style="margin-top:6px">Defina primeiro o tamanho ideal da área. Spawns fora dela serão destacados; não aumente a zona só para caber em pontos ruins.</div>`;
    anchor.insertAdjacentElement('afterend',box);
    const applyRadius=v=>{if(!requireEdit())return;const m=active();if(!m)return;v=Math.max(50,Math.round(Number(v)/50)*50);m.eventRadius=v;state.dirty=true;setSaveState('Raio da zona alterado • NÃO SALVO');renderMap();renderCoverage();};
    qs('#mpEventRadius')?.addEventListener('input',e=>{if(!state.editing)return;const v=Number(e.target.value);if(Number.isFinite(v)&&v>0)applyRadius(v);});
    qs('#mpRadiusMinus50')?.addEventListener('click',()=>applyRadius(effectiveEventRadius(active())-50));
    qs('#mpRadiusPlus50')?.addEventListener('click',()=>applyRadius(effectiveEventRadius(active())+50));
    qs('#mpRadiusMinus100')?.addEventListener('click',()=>applyRadius(effectiveEventRadius(active())-100));
    qs('#mpRadiusPlus100')?.addEventListener('click',()=>applyRadius(effectiveEventRadius(active())+100));
    qs('#mpUseRecommendedRadius')?.addEventListener('click',()=>{if(!requireEdit())return;const m=active(),s=coverageStats(m);if(!m||!s)return;applyRadius(s.recommended);});
    qs('#mpFitZone')?.addEventListener('click',fitZone);
    qs('#mpGenerateInsideZone')?.addEventListener('click',generateInsideZone);
  }
  function renderCoverage(){
    ensureCoverageUi();const m=active(),el=qs('#mpCoverageStatus'),title=qs('#mpCoverageTitle'),inp=qs('#mpEventRadius'),btn=qs('#mpUseRecommendedRadius');if(!m||!el)return;
    const category=m.category||'dominacao',used=effectiveEventRadius(m),s=coverageStats(m),counts=zoneCoverageCounts(m);
    if(title)title.textContent=category==='gas'?'COBERTURA INICIAL DA SAFE / GÁS':'ÁREA DA DOMINAÇÃO';
    if(inp&&document.activeElement!==inp)inp.value=used;
    const note=qs('#mpCoverageBox .mp-note');
    if(category==='dominacao'){
      el.innerHTML=`Raio da área de Dominação: <b>${used} m</b><br>${s?`Spawn mais distante do centro: <b>${s.farthestIndex>=0?String(s.farthestIndex+1).padStart(2,'0'):'—'}</b> • ${s.max.toFixed(0)} m<br>`:''}<span style="color:#9ed7ff">Os spawns podem ficar dentro ou fora desta área. Isso não é erro.</span>`;
      if(note)note.textContent='Ajuste somente o tamanho da área que será disputada. A posição dos spawns é independente da área de Dominação.';
      if(btn){btn.style.display='none';btn.disabled=true;}
      const gen=qs('#mpGenerateInsideZone');if(gen){gen.style.display='none';gen.disabled=true;}
    }else{
      if(!s){el.innerHTML=`Raio inicial da safe: <b>${used} m</b><br>Defina o centro e os spawns para calcular a cobertura.`;}
      else{const ok=counts.outside===0;el.innerHTML=`Dentro da safe inicial: <b>${counts.inside}/${counts.total}</b> ${counts.outside?`• <b style="color:#ff7474">${counts.outside} FORA ⚠</b>`:'• TODOS DENTRO ✓'}<br>Spawn mais distante: <b>${s.farthestIndex>=0?String(s.farthestIndex+1).padStart(2,'0'):'—'}</b> • ${s.max.toFixed(0)} m<br>Raio mínimo para todos: <b>${s.minimum} m</b><br>Raio sugerido + margem: <b>${s.recommended} m</b><br>Raio inicial escolhido: <b>${used} m</b> • ${ok?'COBERTURA OK ✓':'AJUSTE A SAFE OU OS SPAWNS ⚠'}`;}
      if(note)note.textContent='Na Zona de Gás, todos os spawns devem iniciar dentro da safe. Ajuste o raio ou reposicione os pontos que ficarem fora.';
      if(btn){btn.style.display='';btn.disabled=!state.editing;}
      const gen=qs('#mpGenerateInsideZone');if(gen){gen.style.display='';gen.disabled=!state.editing;}
    }
    ['mpRadiusMinus50','mpRadiusPlus50','mpRadiusMinus100','mpRadiusPlus100'].forEach(id=>{const b=qs('#'+id);if(b)b.disabled=!state.editing;});
  }

  function fitZone(){
    const m=active();if(!state.map||!m||!validCoord(m.center?.x)||!validCoord(m.center?.y))return;
    const r=effectiveEventRadius(m);if(r<=0)return;
    const temp=L.circle(ll(m.center.x,m.center.y),{radius:r});state.map.fitBounds(temp.getBounds(),{padding:[35,35]});
  }
  function generateInsideZone(){
    if(!requireEdit())return;const m=active();if(!m||!validCoord(m.center?.x)||!validCoord(m.center?.y)){alert('Defina primeiro o centro da zona.');return;}
    const zoneRadius=effectiveEventRadius(m),qty=Math.max(2,Number(qs('#mpQty')?.value)||m.points.length||25),spawnRing=Math.max(50,Math.floor((zoneRadius*.80)/50)*50);
    if(!confirm(`Gerar ${qty} spawns distribuídos a aproximadamente 80% do raio da zona (${spawnRing} m)?

Os pontos atuais serão substituídos e ficarão PENDENTES até validação no FiveM.`))return;
    if(qs('#mpCircleRadius'))qs('#mpCircleRadius').value=spawnRing;m.circleRadius=spawnRing;
    if(qs('#mpQty'))qs('#mpQty').value=qty;
    generateCircle();renderCoverage();fitZone();
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
  function tpCds(p){const z=Number.isFinite(Number(p?.z))?Number(p.z):0;const h=Number.isFinite(Number(p?.h))?Number(p.h):0;return `${f(p.x)},${f(p.y)},${f(z)},${f(h)}`;}
  function updateExport(){const m=active(),out=qs('#mpExport');if(out&&m)out.value=m.points.filter(isValidated).map((p,i)=>`${p.id||i+1} - ${rawCds(p)}`).join('\n');}
  function render(){adoptStrayCards();renderMissionList();renderPointList();renderMap();analyze();updateExport();syncForm();renderCenterValidation();renderCoverage();renderPlannerBadges();const rt=qs('#mpRequestText'),m=active();if(rt&&document.activeElement!==rt)rt.value=m?.requestText||'';loadSnapshotPreview();}

  function syncForm(){
    const m=active();if(!m)return;
    const vals={mpMissionName:m.name,mpEventCategory:m.category||'dominacao',mpEventType:m.event,mpPanel:m.panel,mpMode:m.mode,mpRequestKind:m.requestKind||'alter-zone',mpCenterLabel:m.center.label||'Coordenada central',mpCenterX:m.center.x??'',mpCenterY:m.center.y??'',mpCenterZ:m.center.z??'',mpCenterH:m.center.h??'',mpCircleRadius:m.circleRadius||1000,mpStartAngle:m.startAngle||0,mpRadius:m.spawnRadius||100,mpEventRadius:m.eventRadius||''};
    Object.entries(vals).forEach(([id,v])=>{const el=qs('#'+id);if(el&&document.activeElement!==el)el.value=v;});
    if(qs('#mpRadiusValue'))qs('#mpRadiusValue').textContent=`${m.spawnRadius||100} m`;
    const assist=m.mode==='assistant';qs('#mpModeHint')&&(qs('#mpModeHint').textContent=assist?'ASSISTENTE: todo ponto novo começa PENDENTE (vermelho), recebe Z provisório 0.00 para TPCDS/NC e só fica verde após validação com a CDS real.':'MANUAL: CDS completa e não-zero pode ser adicionada já como validada.');
  }

  function commit(reason='Alteração'){
    const m=active();if(!m)return;m.updatedAt=nowIso();
    if(state.editing){state.dirty=true;render();setSaveState(`${reason} • NÃO SALVO`);return;}
    saveStore();render();setSaveState(`${reason} • salvo`);queueSnapshot();
  }
  function requireEdit(){if(state.editing)return true;alert('Zona travada em modo visualização. Clique em EDITAR ZONA para fazer alterações.');return false;}
  function startEdit(){const m=active();if(!m||state.editing)return;state.editBackup={eventId:m.eventId,zones:JSON.parse(JSON.stringify(zonesOfEvent(m.eventId)))};state.editing=true;state.dirty=false;state.placing=false;render();updateEditUi();setSaveState('MODO EDIÇÃO • alterações ainda não salvas');}
  function saveMission(){persistScenario(active());const m=active();if(!m)return;if(!state.editing){setSaveState('Nenhuma alteração para salvar');return;}m.updatedAt=nowIso();saveStore();state.editBackup=null;state.editing=false;state.dirty=false;state.placing=false;render();updateEditUi();setSaveState('Zona salva ✓');queueSnapshot();}
  function cancelEdit(){if(!state.editing)return;if(state.editBackup?.eventId&&Array.isArray(state.editBackup.zones)){const eid=state.editBackup.eventId;const keep=state.missions.filter(x=>x.eventId!==eid);state.missions=[...state.editBackup.zones,...keep];}state.editBackup=null;state.editing=false;state.dirty=false;state.placing=false;state.activeEventId=active()?.eventId||state.activeEventId;render();updateEditUi();setSaveState('Alterações descartadas • visualização');}
  function updateEditUi(){
    const edit=state.editing;const eb=qs('#mpEditMission'),sb=qs('#mpSaveMission'),cb=qs('#mpCancelEdit');
    if(eb)eb.style.display=edit?'none':'';if(sb)sb.style.display=edit?'':'none';if(cb)cb.style.display=edit?'':'none';
    qsa('#page-planejador input:not(#mpRequestText),#page-planejador select,#page-planejador textarea:not(#mpRequestText):not(#mpExport)').forEach(el=>{if(!['mpValidateCds','mpCenterRealCds','mpCloneTarget'].includes(el.id))el.disabled=!edit;});
    ['mpPlaceBtn','mpGenerateCircle','mpImport','mpAddCoord','mpClear','mpValidateBtn','mpValidateCenter','mpEventRadius','mpRadiusMinus50','mpRadiusPlus50','mpRadiusMinus100','mpRadiusPlus100','mpUseRecommendedRadius','mpGenerateInsideZone'].forEach(id=>{const el=qs('#'+id);if(el)el.disabled=!edit;});
    if(qs('#missionPlannerMap'))qs('#missionPlannerMap').classList.toggle('mp-editing',edit);
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
  function generateCircle(){if(!requireEdit())return;
    const m=active();if(!m)return;const cx=num(qs('#mpCenterX')?.value),cy=num(qs('#mpCenterY')?.value),qty=Math.max(2,Number(qs('#mpQty')?.value)||2),r=Math.max(1,Number(qs('#mpCircleRadius')?.value)||1000),start=Number(qs('#mpStartAngle')?.value)||0;
    if(cx===null||cy===null){alert('Defina a coordenada central no mapa ou informe X e Y.');return;}
    if(Number(m.center.x)!==cx||Number(m.center.y)!==cy){m.center.z=0;m.center.h=0;m.center.status='planned';m.center.validatedAt=null;m.center.validationReason='coordinate-change';}m.center.x=cx;m.center.y=cy;m.circleRadius=r;m.startAngle=start;m.points=[];
    for(let i=0;i<qty;i++){const deg=start+(360/qty)*i,a=deg*Math.PI/180;m.points.push(normalizePoint({x:cx+Math.sin(a)*r,y:cy+Math.cos(a)*r,z:0,h:(deg+180)%360,status:'planned'},i));}
    commit(`${qty} pontos gerados como PENDENTES`);fit();
  }
  function parseBulk(text){const out=[];String(text||'').split(/\n+/).forEach(line=>{const c=line.replace(/^\s*\d+\s*[-–—:)]\s*/,'').trim();if(!c)return;const r=parseCds(c);if(!r.ok)return;out.push({x:r.x,y:r.y,z:r.z,h:r.h});});return out;}
  function importBulk(){if(!requireEdit())return;
    const m=active(),arr=parseBulk(qs('#mpBulk')?.value);if(!m||!arr.length){alert('Nenhuma coordenada válida encontrada.');return;}
    const manual=m.mode==='manual';arr.forEach(v=>{const can=manual&&validCoord(v.x)&&validCoord(v.y)&&validCoord(v.z)&&Number.isFinite(v.h);m.points.push(normalizePoint({...v,status:can?'validated':'planned',validatedAt:can?nowIso():null},m.points.length));});commit(`Importadas ${arr.length} CDS`);fit();
  }
  function setValidationFeedback(html,tipo='info'){
    const el=qs('#mpValidationFeedback');
    if(el){el.className='mp-validation-feedback '+tipo;el.innerHTML=html;}
  }
  function validateSelected(opts={}){if(!requireEdit())return false;
    const m=active();let id=m?.selectedId;
    if(!id){id=nextPendingId(m);if(id)selectPoint(id);}
    const p=id?m.points[id-1]:null;
    if(!p){setValidationFeedback('Selecione na lista o ponto que voce esta conferindo no jogo.','erro');return false;}
    const campo=qs('#mpValidateCds');
    const r=parseCds(campo?.value);
    if(!r.ok){setValidationFeedback(`<b>CDS nao reconhecida</b><span>${r.motivo}</span>`,'erro');return false;}
    const probs=cdsProblemas(r);
    if(probs.length){setValidationFeedback(`<b>CDS incompleta</b><span>${probs.join('<br>')}</span>`,'erro');return false;}
    const desvio=distXY(p,r);
    if(desvio>250&&!opts.forcar){
      setValidationFeedback(`<b>Desvio de ${desvio.toFixed(0)} m</b><span>A CDS colada esta longe do ponto ${id} planejado. Confira se selecionou o ponto certo.</span><button type="button" id="mpForceValidate" class="mp-mini-danger">VALIDAR ASSIM MESMO</button>`,'alerta');
      qs('#mpForceValidate')?.addEventListener('click',()=>validateSelected({forcar:true,avancar:opts.avancar}));
      return false;
    }
    p.x=r.x;p.y=r.y;p.z=r.z;p.h=r.h===null?0:r.h;p.status='validated';p.validatedAt=nowIso();delete p.validationReason;
    if(campo)campo.value='';
    commit(`Ponto ${id} validado`);
    state.map?.panTo(ll(r.x,r.y));
    const restantes=(m.points||[]).filter(x=>!isValidated(x)).length;
    const prox=opts.avancar!==false?nextPendingId(m,id):0;
    if(prox){selectPoint(prox);setTimeout(()=>qs('#mpValidateCds')?.focus(),60);}
    setValidationFeedback(
      `<b>Ponto ${id} validado &#10003;</b><span>Desvio de ${desvio.toFixed(1)} m &bull; Z ${f(r.z)} &bull; H ${f(p.h)}</span>`+
      (restantes?`<span>${restantes} ponto(s) pendente(s).${prox?` Selecionei o ponto ${prox} - cole a proxima CDS.`:''}</span>`:'<span>Todos os pontos desta zona estao validados.</span>'),
      'ok');
    return true;
  }
  /* valida varios pontos de uma vez: "12 - x,y,z,h" por linha */
  function validateBulk(){if(!requireEdit())return;
    const m=active();if(!m)return;
    const texto=String(qs('#mpValidateBulk')?.value||'');
    const linhas=texto.split(/\n+/).map(l=>l.trim()).filter(Boolean);
    if(!linhas.length){setValidationFeedback('Cole uma CDS por linha, no formato <b>numero - x,y,z,h</b>.','erro');return;}
    let ok=0;const erros=[];
    linhas.forEach((linha,i)=>{
      const mm=linha.match(/^\s*(\d+)\s*[-–—:)]\s*(.+)$/);
      const idx=mm?Number(mm[1]):(i+1);
      const r=parseCds(mm?mm[2]:linha);
      const alvo=m.points[idx-1];
      if(!alvo){erros.push(`Linha ${i+1}: nao existe ponto ${idx}.`);return;}
      if(!r.ok){erros.push(`Linha ${i+1}: ${r.motivo}`);return;}
      const probs=cdsProblemas(r);
      if(probs.length){erros.push(`Ponto ${idx}: ${probs[0]}`);return;}
      alvo.x=r.x;alvo.y=r.y;alvo.z=r.z;alvo.h=r.h===null?0:r.h;
      alvo.status='validated';alvo.validatedAt=nowIso();delete alvo.validationReason;ok++;
    });
    if(ok)commit(`${ok} ponto(s) validado(s) em lote`);
    setValidationFeedback(
      `<b>${ok} ponto(s) validado(s)</b>`+(erros.length?`<span>${erros.slice(0,6).join('<br>')}${erros.length>6?`<br>+${erros.length-6} outros`:''}</span>`:''),
      erros.length?(ok?'alerta':'erro'):'ok');
    if(ok&&qs('#mpValidateBulk'))qs('#mpValidateBulk').value='';
  }
  function invalidateSelected(){if(!requireEdit())return;
    const m=active(),id=m?.selectedId,p=id?m.points[id-1]:null;
    if(!p){setValidationFeedback('Selecione um ponto na lista.','erro');return;}
    p.status='planned';p.z=0;p.validatedAt=null;p.validationReason='manual-reset';
    commit(`Ponto ${id} voltou para PENDENTE`);
    setValidationFeedback(`<b>Ponto ${id} voltou para pendente</b><span>Z zerado para permitir TPCDS + NC.</span>`,'alerta');
  }
  async function copySelectedTp(){
    const m=active(),id=m?.selectedId,p=id?m.points[id-1]:null;
    if(!p){setValidationFeedback('Selecione um ponto na lista.','erro');return;}
    await copyText(`${f(p.x)},${f(p.y)},0.00,${Number.isFinite(Number(p.h))?f(p.h):'0.00'}`);
    setValidationFeedback(`<b>TP do ponto ${id} copiado</b><span>Va ate o local no jogo e cole a CDS real aqui.</span>`,'ok');
  }
  function addManual(){if(!requireEdit())return;
    const m=active();if(!m)return;const x=num(qs('#mpX')?.value),y=num(qs('#mpY')?.value),z=num(qs('#mpZ')?.value),h=num(qs('#mpH')?.value);if(x===null||y===null){alert('Informe X e Y válidos.');return;}
    const can=m.mode==='manual'&&validCoord(x)&&validCoord(y)&&validCoord(z)&&h!==null;m.points.push(normalizePoint({x,y,z,h,status:can?'validated':'planned',validatedAt:can?nowIso():null},m.points.length));commit(can?'Ponto manual validado':'Ponto manual adicionado como PENDENTE');
  }
  function createEvent(){
    if(state.editing&&state.dirty&&!confirm('Descartar alterações não salvas e criar um novo evento?'))return;
    if(state.editing)cancelEdit();
    const m=newMission(null,null,state.libraryCategory||'dominacao');
    m.name='Zona Principal';m.requestKind='create-event';
    state.missions.unshift(m);state.activeId=m.id;state.activeEventId=m.eventId;saveStore();render();startEdit();state.map?.setView(ll(900,-600),3);setSaveState('Novo evento criado • configure a Zona Principal e clique SALVAR EVENTO');
  }
  function createZone(){
    if(state.editing&&state.dirty&&!confirm('Descartar alterações não salvas e criar uma nova zona?'))return;
    if(state.editing)cancelEdit();
    const base=active(),eid=activeEventId();
    if(!eid||!base){alert('Selecione primeiro um evento.');return;}
    const m=newMission(eid,base.event,base.category);
    m.name=`Nova Zona ${zonesOfEvent(eid).length+1}`;m.panel=base.panel;m.mode=base.mode;m.requestKind='create-zone';m.eventRadius=base.eventRadius||null;m.circleRadius=base.circleRadius||1000;m.spawnRadius=base.spawnRadius||100;
    state.missions.unshift(m);state.activeId=m.id;state.activeEventId=eid;saveStore();render();startEdit();setSaveState('Nova zona criada • defina centro, raio e spawns');
  }
  function syncMapRegion(m){
    if(!state.map||!m)return;
    const pts=[m.center,...(m.points||[])].filter(p=>validCoord(p?.x)&&validCoord(p?.y));
    const isCayo=/cayo\s*perico/i.test(`${m.name||''} ${m.event||''}`)||pts.some(p=>Number(p.x)>3800&&Number(p.y)<-3800);
    const overlays=[state.cayoLayer,state.cayoPostalLayer].filter(Boolean);
    if(isCayo){
      if(state.cayoLayer&&!state.map.hasLayer(state.cayoLayer)&&!state.map.hasLayer(state.cayoPostalLayer))state.cayoLayer.addTo(state.map);
    }else overlays.forEach(l=>{if(state.map.hasLayer(l))state.map.removeLayer(l);});
  }
  function focusActiveMission(scrollToMap=false){
    const m=active();if(!state.map||!m)return;syncMapRegion(m);
    const run=()=>{state.map.invalidateSize();const arr=(m.points||[]).filter(p=>validCoord(p.x)&&validCoord(p.y)).map(p=>ll(p.x,p.y));if(validCoord(m.center?.x)&&validCoord(m.center?.y))arr.push(ll(m.center.x,m.center.y));if(arr.length>1)state.map.fitBounds(L.latLngBounds(arr).pad(.12),{animate:true,duration:.45,maxZoom:5});else if(arr.length===1)state.map.setView(arr[0],5,{animate:true});};
    setTimeout(run,70);setTimeout(run,260);
    if(scrollToMap){const el=qs('#missionPlannerMap')?.closest('.mission-planner-mapwrap')||qs('#missionPlannerMap');if(el)setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'center'}),40);}
  }
  function switchEvent(eventId){
    if(state.editing&&state.dirty&&!confirm('Existem alterações não salvas. Deseja descartá-las?'))return;
    if(state.editing)cancelEdit();
    const zones=zonesOfEvent(eventId);if(!zones.length)return;
    state.activeEventId=eventId;state.activeId=zones[0].id;state.libraryCategory=zones[0].category||state.libraryCategory;saveStore();render();updateEditUi();focusActiveMission(false);
  }
  function switchMission(id){if(state.editing&&state.dirty&&!confirm('Existem alterações não salvas. Deseja descartá-las?'))return;if(state.editing)cancelEdit();state.activeId=id;const m=state.missions.find(m=>m.id===id);state.activeEventId=m?.eventId||state.activeEventId;state.libraryCategory=(m?.category||state.libraryCategory||'dominacao');saveStore();render();updateEditUi();focusActiveMission(true);}
  function deleteZone(){const m=active();if(!m)return;const zones=zonesOfEvent(m.eventId);if(zones.length<=1){alert('Este é o único mapa/zona do evento. Para removê-lo, exclua o evento inteiro.');return;}if(!confirm(`Apagar somente a zona "${m.name}" do evento "${m.event}"?`))return;state.missions=state.missions.filter(x=>x.id!==m.id);const next=zones.find(x=>x.id!==m.id);state.activeId=next?.id||null;saveStore();render();focusActiveMission(false);}
  function deleteEvent(){
    const m=active();if(!m)return;const zones=zonesOfEvent(m.eventId);
    if(zones.some(z=>z.official)){if(!confirm(`Este evento contém zona(s) cadastrada(s) originalmente no sistema. Excluir o evento "${m.event}" e suas ${zones.length} zona(s)?`))return;}
    else if(!confirm(`Excluir o evento "${m.event}" e TODAS as ${zones.length} zona(s)?`))return;
    state.missions=state.missions.filter(x=>x.eventId!==m.eventId);
    const first=state.missions.find(x=>(x.category||'dominacao')===state.libraryCategory)||state.missions[0];
    state.activeId=first?.id||null;state.activeEventId=first?.eventId||null;saveStore();render();focusActiveMission(false);
  }
  function eventProfiles(category,eventName){
    const fac=/fac\s*x\s*fac/i.test(eventName||'');
    if(category==='dominacao')return {title:'DOMINAÇÃO',needsSafe:false,notes:['Área de disputa fixa','Spawns podem ficar dentro ou fora do raio','Sem fechamento progressivo de gás']};
    if(fac)return {title:'FAC X FAC',needsSafe:true,notes:['Safe inicial obrigatória cobrindo todos os spawns','Fechamento progressivo do gás','Spawn individual por organização','Loot/caixas e drop ao morrer conforme padrão Fac x Fac','Ranking e regras próprias preservados']};
    return {title:'ZONA DE GÁS',needsSafe:true,notes:['Safe inicial obrigatória cobrindo todos os spawns','Fechamento progressivo do gás','Regras específicas do evento de destino preservadas']};
  }
  function openReplicator(){
    const src=active();if(!src)return;if(state.editing&&state.dirty){alert('Salve ou cancele as alterações antes de replicar.');return;}
    let modal=qs('#mpReplicateModal');if(modal)modal.remove();modal=document.createElement('div');modal.id='mpReplicateModal';modal.className='mp-replicate-backdrop';
    const eventOptions=(cat)=>eventsOfCategory(cat).map(e=>`<option value="${e.id}">${e.name}</option>`).join('');
    modal.innerHTML=`<div class="mp-replicate-modal"><div class="mp-replicate-head"><div><b>REPLICAR / CONVERTER ZONA</b><small>A geografia vem da zona de origem; a lógica é adaptada ao evento de destino.</small></div><button id="mpRepClose">×</button></div><div class="mp-replicate-origin"><span>ORIGEM</span><b>${src.event} → ${src.name}</b><small>${src.points?.length||0} spawns • original será preservado</small></div><div class="mp-replicate-grid"><label>Tipo de destino<select id="mpRepCat"><option value="dominacao">DOMINAÇÃO</option><option value="gas">ZONA DE GÁS</option></select></label><label>Evento de destino<select id="mpRepEvent"></select></label><label>Nome da nova zona<input id="mpRepName" value="${String(src.name||'Zona replicada').replace(/"/g,'&quot;')}"></label><label id="mpRepRadiusWrap">Raio inicial da Safe (m)<input id="mpRepRadius" type="number" min="50" step="10" value="${Math.round(effectiveEventRadius(src)||1000)}"></label></div><div id="mpRepStatus" class="mp-replicate-status"></div><div class="mp-replicate-actions"><button id="mpRepCancel">CANCELAR</button><button id="mpRepCreate" class="primary">CRIAR CÓPIA ADAPTADA</button></div></div>`;
    document.body.appendChild(modal);
    const cat=qs('#mpRepCat',modal),ev=qs('#mpRepEvent',modal),rad=qs('#mpRepRadius',modal),status=qs('#mpRepStatus',modal),create=qs('#mpRepCreate',modal);
    function refreshEvents(){const es=eventsOfCategory(cat.value);ev.innerHTML=eventOptions(cat.value)+`<option value="__new__">+ Criar novo evento…</option>`;if(!es.length)ev.value='__new__';validate();}
    function validate(){const targetCat=cat.value;const targetEvent=ev.value==='__new__'?'Novo Evento':(eventsOfCategory(targetCat).find(x=>x.id===ev.value)?.name||'Evento');const prof=eventProfiles(targetCat,targetEvent);const r=Math.max(0,Number(rad.value)||0);let outside=0,max=0;if(prof.needsSafe&&validCoord(src.center?.x)&&validCoord(src.center?.y)){(src.points||[]).forEach(p=>{const d=pointDistanceFromCenter(src,p);max=Math.max(max,d);if(d>r)outside++;});}const ok=!prof.needsSafe||outside===0;qs('#mpRepRadiusWrap',modal).style.display=prof.needsSafe?'grid':'none';status.innerHTML=`<b>${prof.title}</b>${prof.notes.map(n=>`<span>✓ ${n}</span>`).join('')}${prof.needsSafe?`<span class="${ok?'ok':'bad'}">${ok?'✓':'⚠'} ${(src.points||[]).length-outside}/${(src.points||[]).length} spawns dentro da safe${outside?` • ${outside} fora • mínimo aproximado ${Math.ceil(max)} m`:''}</span>`:''}`;create.disabled=!ok;}
    function close(){modal.remove();}
    cat.onchange=refreshEvents;ev.onchange=validate;rad.oninput=validate;qs('#mpRepClose',modal).onclick=close;qs('#mpRepCancel',modal).onclick=close;
    create.onclick=()=>{let targetCat=cat.value,targetEventId=ev.value,targetEventName;if(targetEventId==='__new__'){targetEventName=prompt('Nome do novo evento:','Novo Evento');if(!targetEventName)return;targetEventId=eventUid();}else targetEventName=eventsOfCategory(targetCat).find(x=>x.id===targetEventId)?.name||'Evento';const c=JSON.parse(JSON.stringify(src));c.id=uid();c.eventId=targetEventId;c.event=targetEventName;c.name=qs('#mpRepName',modal).value.trim()||`${src.name} — Cópia`;c.category=targetCat;c.official=false;c.createdAt=nowIso();c.updatedAt=nowIso();c.requestText='';c.requestKind=zonesOfEvent(targetEventId).length?'create-zone':'create-event';delete c.facxfacScenarios;delete c.activeScenario;delete c.mapName;c.center.label=targetCat==='gas'?'Centro do Gás / Marco Zero':'Centro da Zona do Evento';if(targetCat==='gas')c.eventRadius=Math.max(50,Number(rad.value)||1000);else c.eventRadius=null;state.missions.unshift(c);state.activeId=c.id;state.activeEventId=c.eventId;state.libraryCategory=targetCat;saveStore();close();render();startEdit();setSaveState('Zona replicada e adaptada • revise e gere a solicitação');focusActiveMission(false);};
    refreshEvents();
  }
  function cloneZone(){
    const m=active();if(!m)return;if(state.editing&&state.dirty){alert('Salve ou cancele as alterações antes de clonar.');return;}
    const c=JSON.parse(JSON.stringify(m));c.id=uid();c.name=`${m.name} — Cópia`;c.official=false;c.createdAt=nowIso();c.updatedAt=nowIso();c.requestText='';c.requestKind='create-zone';
    state.missions.unshift(c);state.activeId=c.id;state.activeEventId=c.eventId;saveStore();render();startEdit();setSaveState('Zona clonada • evento original preservado');
  }
  function cloneEventTo(targetCategory){
    const m=active();if(!m)return;if(state.editing&&state.dirty){alert('Salve ou cancele as alterações antes de clonar.');return;}
    const source=zonesOfEvent(m.eventId);const newEventId=eventUid();const newName=`${m.event} — Clone ${targetCategory==='gas'?'Gás':'Dominação'}`;
    const clones=source.map((z,idx)=>{const c=JSON.parse(JSON.stringify(z));c.id=uid();c.eventId=newEventId;c.event=newName;c.category=targetCategory;c.official=false;c.createdAt=nowIso();c.updatedAt=nowIso();c.requestText='';c.requestKind=idx===0?'create-event':'create-zone';c.center.label=targetCategory==='gas'?'Centro do Gás / Marco Zero':'Centro da Zona do Evento';if(c.center&&validCoord(c.center.x)&&validCoord(c.center.y)&&validCoord(c.center.z)&&Number.isFinite(Number(c.center.h))){c.center.status='validated';c.center.validatedAt=c.center.validatedAt||nowIso();delete c.center.validationReason;}return c;});
    state.missions.unshift(...clones);state.activeId=clones[0].id;state.activeEventId=newEventId;state.libraryCategory=targetCategory;saveStore();render();startEdit();setSaveState(`Evento clonado com ${clones.length} zona(s) • original preservado`);
  }
  function duplicateMission(){
    const target=qs('#mpCloneTarget')?.value||state.libraryCategory||'dominacao';
    cloneEventTo(target);
  }
  function clearPoints(){if(!requireEdit())return;const m=active();if(!m||!confirm('Limpar todos os pontos desta missão?'))return;m.points=[];m.selectedId=null;commit('Pontos removidos');}
  async function copyText(text){try{await navigator.clipboard.writeText(text);return true;}catch{}const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');}catch{}ta.remove();return true;}
  async function exportValidated(){const m=active(),v=m?.points.filter(isValidated)||[];if(!v.length){alert('Nenhum ponto validado para exportar.');return;}const txt=v.map((p,i)=>`${p.id||i+1} - ${rawCds(p)}`).join('\n');if(qs('#mpExport'))qs('#mpExport').value=txt;await copyText(txt);}
  async function exportXY(){const m=active();if(!m?.points.length)return;await copyText(m.points.map((p,i)=>`${i+1} - ${isValidated(p)?rawCds(p):tpCds(p)}`).join('\n'));}
  function generateRequest(){
    const m=active();if(!m)return;
    const category=m.category||'dominacao',all=m.points||[],pts=all.filter(isValidated),pending=all.length-pts.length;
    if(!pts.length){alert('Nenhum spawn validado para gerar a solicitação.');return;}
    if(pending>0){alert(`Existem ${pending} spawn(s) pendente(s). Valide todos antes de gerar a solicitação.`);return;}
    const centerReady=isCenterValidated(m)||(m.official&&validCoord(m.center?.x)&&validCoord(m.center?.y)&&Number.isFinite(Number(m.center?.z))&&Number.isFinite(Number(m.center?.h)));
    if(!centerReady){alert(`Valide primeiro a CDS real do ${category==='gas'?'CENTRO DO GÁS / MARCO ZERO':'CENTRO DA ZONA'}.`);return;}
    const radius=effectiveEventRadius(m),counts=zoneCoverageCounts(m);
    if(category==='gas'&&counts.outside>0){alert(`${counts.outside} spawn(s) estão FORA da safe inicial (${Math.round(radius)} m). Todos precisam iniciar dentro da área segura.`);return;}
    const center=rawCds(m.center),panel=m.panel?` - ${m.panel}`:'',kind=m.requestKind||'alter-zone',eventName=m.event||'Evento',zoneName=m.name||'Zona Principal';
    let subject='',intro='';
    if(kind==='create-event'){
      subject=`Solicitação de Criação do Evento ${eventName}${panel}`;
      intro=`- Solicitamos a criação do evento "${eventName}"${m.panel?` no painel ${m.panel}`:''}.

- O evento deverá ser criado inicialmente com a zona "${zoneName}", utilizando a configuração geográfica abaixo.`;
    }else if(kind==='create-zone'){
      subject=`Solicitação de Criação da Zona ${zoneName} - Evento ${eventName}${panel}`;
      intro=`- Solicitamos a criação da nova zona "${zoneName}" para o evento "${eventName}"${m.panel?` no painel ${m.panel}`:''}.

- As demais zonas já existentes do evento deverão permanecer inalteradas.`;
    }else{
      subject=`Solicitação de Alteração da Zona ${zoneName} - Evento ${eventName}${panel}`;
      intro=`- Solicitamos a alteração da zona "${zoneName}" do evento "${eventName}"${m.panel?` no painel ${m.panel}`:''}, utilizando a configuração geográfica abaixo.

- As demais zonas do evento deverão permanecer inalteradas.`;
    }
    const centerTitle=category==='gas'?'CENTRO DO GÁS / MARCO ZERO':'COORDENADA CENTRAL';
    const radiusTitle=category==='gas'?'RAIO INICIAL DA SAFE / GÁS':'RAIO DA ÁREA DE DOMINAÇÃO';
    const isFacXFac=/fac\s*x\s*fac/i.test(eventName);
    const mechanic=category==='gas'
      ? (isFacXFac ? `- Cada facção deverá nascer em uma coordenada diferente da zona selecionada.

- Todos os participantes deverão receber automaticamente os itens necessários no inventário conforme o padrão atual do Fac x Fac.

- Deverão existir caixas de loot espalhadas pelo mapa conforme o funcionamento atual do evento.

- Após alguns minutos, a zona de vitória/safe deverá ser ativada e iniciar o fechamento progressivo.

- Quem permanecer fora da zona deverá receber dano do gás conforme o sistema atual.

- Ao morrer, o jogador deverá dropar uma caixa contendo seus itens, conforme o funcionamento atual do Fac x Fac.

- O comando /evento deverá continuar permitindo escalar a facção de qualquer lugar do mapa, salvar a escalação e aguardar o horário do evento.

- O sistema de ranking próprio e as premiações mensais do Fac x Fac deverão permanecer inalterados.

- Os membros poderão utilizar o N para pingar o mapa para seus aliados, conforme o padrão atual do evento.` : `- Todos os spawns deverão iniciar dentro da safe inicial.

- Após o início, o fechamento da safe/gás deverá seguir a configuração e funcionamento atuais do evento.`)
      : `- Os spawns poderão ficar dentro ou fora da área de Dominação conforme a distribuição planejada.

- A área de Dominação deverá permanecer fixa, sem fechamento progressivo de gás/safe.`;
    const selectorNote=kind==='create-zone'?`

- A nova zona deverá ser adicionada à seleção de zonas do evento "${eventName}".`:'';
    const text=`Assunto:

- ${subject};

Solicitação:

${intro}${selectorNote}

${centerTitle}:

- ${center}

${radiusTitle}:

- ${Math.round(radius)} metros.

SPAWNS DAS ORGANIZAÇÕES:

${pts.map((p,i)=>`${String(i+1).padStart(2,'0')} - ${rawCds(p)}`).join('\n')}

DISTRIBUIÇÃO:

- Utilizar 1 spawn diferente por organização inscrita.

- Caso haja menos organizações que pontos disponíveis, utilizar somente a quantidade necessária.

- Nenhuma organização deverá compartilhar o mesmo ponto de spawn.

${mechanic}

- As demais configurações, regras, premiações, duração e funcionamento do evento deverão permanecer inalterados.`;
    m.requestText=text;if(qs('#mpRequestText'))qs('#mpRequestText').value=text;
  }
  async function copyCurrentRequest(){generateRequest();const m=active();if(!m?.requestText)return;await copyText(m.requestText);const b=qs('#mpCopyRequest');if(b){const old=b.textContent;b.textContent='COPIADO ✓';setTimeout(()=>b.textContent=old,900);}}


  function bindFormAutosave(){
    const map={mpMissionName:['name'],mpEventCategory:['category'],mpEventType:['event'],mpPanel:['panel'],mpMode:['mode'],mpRequestKind:['requestKind'],mpCenterLabel:['center','label'],mpCenterX:['center','x'],mpCenterY:['center','y'],mpCenterZ:['center','z'],mpCenterH:['center','h'],mpCircleRadius:['circleRadius'],mpStartAngle:['startAngle'],mpRadius:['spawnRadius']};
    Object.entries(map).forEach(([id,path])=>qs('#'+id)?.addEventListener((['mpMode','mpEventCategory','mpRequestKind'].includes(id))?'change':'input',e=>{const m=active();if(!m||!state.editing)return;let v=e.target.value;const oldCategory=m.category;if(['mpCenterX','mpCenterY','mpCenterZ','mpCenterH','mpCircleRadius','mpStartAngle','mpRadius'].includes(id))v=num(v);if(path.length===2){if((id==='mpCenterX'||id==='mpCenterY')&&Number(m.center[path[1]])!==Number(v)){m.center.z=0;m.center.h=0;m.center.status='planned';m.center.validatedAt=null;m.center.validationReason='coordinate-change';}m[path[0]][path[1]]=v;}else m[path[0]]=v;if(id==='mpEventType'){zonesOfEvent(m.eventId).forEach(z=>z.event=v);}if(id==='mpPanel'){zonesOfEvent(m.eventId).forEach(z=>z.panel=v);}if(id==='mpEventCategory'){zonesOfEvent(m.eventId).forEach(z=>z.category=v);}if(id==='mpEventCategory'&&oldCategory!==v){state.libraryCategory=v;if(v==='gas'){m.center.label='Centro do Gás / Marco Zero';}else{m.center.label='Centro da Zona do Evento';}/* trocar categoria não muda a CDS; mantém validação existente */}if(id==='mpMode'&&v==='assistant'){m.points.forEach(p=>{if(!p.validatedAt&&p.status!=='validated')p.status='planned';});}state.dirty=true;setSaveState('Alteração • NÃO SALVO');renderMap();renderCenterValidation();renderCoverage();if(id==='mpRadius'&&qs('#mpRadiusValue'))qs('#mpRadiusValue').textContent=`${v||100} m`; }));
  }


  function ensurePlannerV2Ui(){
    const list=qs('#mpMissionList');
    if(list&&!qs('#mpCategoryLibrary')){const cat=document.createElement('div');cat.id='mpCategoryLibrary';list.insertAdjacentElement('beforebegin',cat);}
    if(list&&!qs('#mpEventList')){const eventWrap=document.createElement('div');eventWrap.innerHTML='<div class="mp-level-title"><span>2</span><div><b>EVENTOS</b><small>Selecione o evento deste tipo</small></div></div><div id="mpEventList" class="mp-event-list"></div><div class="mp-level-title zone-title"><span>3</span><div><b>ZONAS DO EVENTO</b><small>Cada zona possui centro, raio e spawns próprios</small></div></div>';list.insertAdjacentElement('beforebegin',eventWrap);}
    if(!qs('#mpEventCategory')){
      const ev=qs('#mpEventType');if(ev){const lab=document.createElement('label');lab.innerHTML='Tipo de evento<select id="mpEventCategory"><option value="dominacao">DOMINAÇÃO — ÁREA FIXA</option><option value="gas">ZONA DE GÁS — SAFE FECHANDO</option></select>';ev.closest('.mp-grid')?.insertAdjacentElement('beforebegin',lab);}
    }
    if(!qs('#mpRequestKind')){
      const ev=qs('#mpEventType');if(ev){const lab=document.createElement('label');lab.innerHTML='Tipo de solicitação<select id="mpRequestKind"><option value="create-event">Criar evento</option><option value="create-zone">Criar nova zona</option><option value="alter-zone">Alterar zona existente</option></select>';ev.closest('.mp-grid')?.insertAdjacentElement('afterend',lab);}
    }
    const name=qs('#mpMissionName');if(name?.closest('label')){const l=name.closest('label');for(const n of [...l.childNodes])if(n.nodeType===3&&n.textContent.trim())n.textContent='Nome da zona ';}

    const actions=qs('.mp-top-actions');
    if(actions){
      actions.innerHTML=`<div class="mp-action-section"><span>EVENTO</span><button type="button" id="mpNewMission" class="mp-new-action">+ NOVO EVENTO</button><button type="button" id="mpDeleteEvent" class="mp-delete-action">EXCLUIR EVENTO</button></div><div class="mp-action-section zone"><span>ZONA</span><button type="button" id="mpNewZone" class="primary">+ NOVA ZONA</button><button type="button" id="mpReplicateZone">IMPORTAR / REPLICAR ZONA</button><button type="button" id="mpCloneZone">CLONAR NESTE EVENTO</button><button type="button" id="mpDeleteMission" class="mp-delete-action">EXCLUIR ZONA</button></div><div class="mp-action-section edit"><span>EDIÇÃO</span><button type="button" id="mpEditMission">EDITAR ZONA</button><button type="button" id="mpSaveMission" class="primary" style="display:none">SALVAR ZONA</button><button type="button" id="mpCancelEdit" style="display:none">CANCELAR</button></div>`;
      actions.className='mp-top-actions mp-actions-v8';
    }
    const clicked=qs('#mpClicked');if(clicked&&!state.editing)clicked.textContent='MODO VISUALIZAÇÃO • zona travada. Clique em EDITAR ZONA para alterar o mapa.';
    renderLibraryCategoryUi();
  }
  function bind(){
    if(state.initialized)return;state.initialized=true;loadStore();state.activeEventId=active()?.eventId||state.activeEventId;ensurePlannerV2Ui();ensurePlannerTabs();ensureMapKpis();initMap();render();bindFormAutosave();updateEditUi();
    qs('#mpEditMission')?.addEventListener('click',startEdit);qs('#mpSaveMission')?.addEventListener('click',saveMission);qs('#mpCancelEdit')?.addEventListener('click',cancelEdit);qs('#mpNewMission')?.addEventListener('click',createEvent);qs('#mpNewZone')?.addEventListener('click',createZone);qs('#mpCloneZone')?.addEventListener('click',cloneZone);qs('#mpReplicateZone')?.addEventListener('click',openReplicator);qs('#mpDeleteMission')?.addEventListener('click',deleteZone);qs('#mpDeleteEvent')?.addEventListener('click',deleteEvent);
    qs('#mpPlaceBtn')?.addEventListener('click',()=>{if(!requireEdit())return;state.placing=!state.placing;qs('#missionPlannerMap')?.classList.toggle('mp-crosshair',state.placing);qs('#mpPlaceBtn').textContent=state.placing?'PARAR DE MARCAR':'MARCAR PONTO NO MAPA';});
    qs('#mpFit')?.addEventListener('click',fit);qs('#mpGoLS')?.addEventListener('click',()=>state.map?.setView(ll(900,-600),3));qs('#mpGoCayo')?.addEventListener('click',()=>{if(state.map&&state.cayoBounds)state.map.fitBounds(state.cayoBounds,{padding:[20,20]});});qs('#mpGenerateCircle')?.addEventListener('click',generateCircle);qs('#mpImport')?.addEventListener('click',importBulk);qs('#mpValidateBtn')?.addEventListener('click',()=>validateSelected());
    qs('#mpValidateBulkBtn')?.addEventListener('click',validateBulk);
    qs('#mpInvalidateBtn')?.addEventListener('click',invalidateSelected);
    qs('#mpCopyPointTp')?.addEventListener('click',copySelectedTp);
    qs('#mpJumpPending')?.addEventListener('click',()=>{const m=active();const id=nextPendingId(m,m?.selectedId||0);if(!id){setValidationFeedback('<b>Nenhum ponto pendente nesta zona.</b>','ok');return;}selectPoint(id);const p=m.points[id-1];if(p)state.map?.setView(ll(p.x,p.y),5);qs('#mpValidateCds')?.focus();});
    qs('#mpValidateCds')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();validateSelected();}});qs('#mpAddCoord')?.addEventListener('click',addManual);qs('#mpClear')?.addEventListener('click',clearPoints);qs('#mpExportBtn')?.addEventListener('click',exportValidated);qs('#mpExportXYBtn')?.addEventListener('click',exportXY);qs('#mpGenerateRequest')?.addEventListener('click',generateRequest);qs('#mpCopyRequest')?.addEventListener('click',copyCurrentRequest);qs('#mpCaptureBtn')?.addEventListener('click',()=>captureSnapshot(true));
    setTimeout(()=>{state.map?.invalidateSize();fit();queueSnapshot();},180);
    setTimeout(()=>syncMissionsFromCloud(),1200);
  }
  /* ---------------------------------------------------------------
     V9.4.1 - A lateral tinha 11 cards empilhados e exigia rolagem
     constante. Aqui os MESMOS cards sao reorganizados em 4 abas, sem
     recriar elemento nenhum (os listeners continuam valendo).
  --------------------------------------------------------------- */
  const PLANNER_TABS=[
    {id:'zona',label:'ZONA'},
    {id:'pontos',label:'PONTOS'},
    {id:'validacao',label:'VALIDAÇÃO'},
    {id:'entrega',label:'ENTREGA'}
  ];
  function cardTabKey(card){
    const t=(card.querySelector('h3')?.textContent||'').toUpperCase();
    if(card.classList.contains('mp-validation-card')||t.includes('VALIDA'))return 'validacao';
    if(t.includes('EXPORT')||t.includes('SOLICITA')||t.includes('PRINT'))return 'entrega';
    if(t.includes('PONTO')||t.includes('SPAWN')||t.includes('LOTE')||t.includes('IMPORT')||t.includes('STATUS'))return 'pontos';
    return 'zona';
  }
  function plannerPanel(id){return qs(`.mp-tabpanel[data-tab="${id}"]`);}
  function adoptStrayCards(){
    const side=qs('.mission-planner-side');if(!side||!qs('#mpTabBar'))return;
    Array.from(side.children).forEach(el=>{
      if(!el.classList||!el.classList.contains('mp-card'))return;
      plannerPanel(cardTabKey(el))?.appendChild(el);
    });
  }
  function setPlannerTab(id){
    qsa('.mp-tab').forEach(b=>{const on=b.dataset.tab===id;b.classList.toggle('active',on);b.setAttribute('aria-selected',on?'true':'false');});
    qsa('.mp-tabpanel').forEach(p=>p.classList.toggle('active',p.dataset.tab===id));
    state.plannerTab=id;
    try{localStorage.setItem('highos_mp_tab',id);}catch(e){}
  }
  function ensurePlannerTabs(){
    const side=qs('.mission-planner-side');
    if(!side||qs('#mpTabBar'))return;
    const cards=Array.from(side.querySelectorAll(':scope > .mp-card'));
    if(!cards.length)return;
    const bar=document.createElement('div');bar.id='mpTabBar';bar.className='mp-tabbar';bar.setAttribute('role','tablist');
    const panels={};
    PLANNER_TABS.forEach(t=>{
      const b=document.createElement('button');
      b.type='button';b.className='mp-tab';b.dataset.tab=t.id;b.setAttribute('role','tab');
      b.innerHTML=`<span>${t.label}</span><i class="mp-tab-badge" data-badge="${t.id}"></i>`;
      b.addEventListener('click',()=>setPlannerTab(t.id));
      bar.appendChild(b);
      const panel=document.createElement('div');panel.className='mp-tabpanel';panel.dataset.tab=t.id;
      panels[t.id]=panel;
    });
    side.insertBefore(bar,side.firstChild);
    PLANNER_TABS.forEach(t=>side.appendChild(panels[t.id]));
    cards.forEach(card=>panels[cardTabKey(card)].appendChild(card));
    let salva='zona';try{salva=localStorage.getItem('highos_mp_tab')||'zona';}catch(e){}
    setPlannerTab(PLANNER_TABS.some(t=>t.id===salva)?salva:'zona');
  }
  function renderPlannerBadges(){
    const m=active();if(!m)return;
    const pend=(m.points||[]).filter(p=>!isValidated(p)).length;
    const total=(m.points||[]).length;
    const set=(id,txt,warn)=>{const el=qs(`[data-badge="${id}"]`);if(!el)return;el.textContent=txt||'';el.classList.toggle('warn',!!warn);el.classList.toggle('hidden',!txt);};
    set('pontos',total?String(total):'',false);
    set('validacao',pend?String(pend):'✓',!!pend);
    set('zona','',false);
    set('entrega','',false);
    const kpi=qs('#mpMapKpis');
    if(kpi)kpi.innerHTML=`<span><b>${total-pend}</b> validados</span><span class="${pend?'warn':''}"><b>${pend}</b> pendentes</span><span><b>${total}</b> pontos</span>`;
  }
  function ensureMapKpis(){
    const status=qs('.mp-map-status');
    if(!status||qs('#mpMapKpis'))return;
    const box=document.createElement('div');box.id='mpMapKpis';box.className='mp-map-kpis';
    status.appendChild(box);
  }
  function activate(){bind();setTimeout(()=>{state.map?.invalidateSize();fit();},100);}
  window.HighMissionPlanner={activate,fit,captureSnapshot,syncCloud:syncMissionsFromCloud,applyCloudMissions};
  document.addEventListener('DOMContentLoaded',()=>{if(qs('#missionPlannerMap'))bind();});
})();
