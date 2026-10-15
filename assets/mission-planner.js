/* HIGH OS Planejador de Eventos V9.5.2 — Evento > Zonas + Replicador Inteligente */
(() => {
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
  /* V12.5 - nomes de evento/zona vem do Firestore e sao digitados pela equipe:
     tudo que entra em innerHTML ou popup do Leaflet passa por aqui. */
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const STORE='highos_mission_planner_v832_missions';
  const ACTIVE='highos_mission_planner_v832_active';
  const DB_NAME='highos_mission_planner_v832';
  const SNAP_STORE='snapshots';

  const DOMINACAO_30=[
    [126.19,
-455.65,
42.21,
175.75],
[333.39,
-476.59,
43.17,
167.25],
[529.8,
-542.94,
24.8,
138.9],
[710.96,
-647.32,
35.87,
150.24],
[869.03,
-781.43,
40.47,
116.23],
[987.45,
-956.33,
42.07,
90.71],
[1074.23,
-1147.33,
26.05,
119.06],
[1109.81,
-1354.03,
29.39,
28.35],
[1111.85,
-1559.48,
34.9,
187.09],
[1074.22,
-1765.37,
35.72,
226.78],
[989.25,
-1956.43,
30.75,
209.77],
[866.31,
-2125.47,
30.55,
206.93],
[709.38,
-2267.73,
27.47,
76.54],
[530.71,
-2368.62,
5.95,
331.66],
[331.17,
-2434.32,
8.41,
331.66],
[127.86,
-2458.49,
6,
328.82],
[-84.75,
-2434.49,
6,
243.78],
[-272.95,
-2388.94,
6,
238.12],
[-456.03,
-2263.83,
8.51,
314.65],
[-619.97,
-2125.47,
6,
311.82],
[-742.78,
-1956.27,
8.16,
308.98],
[-830.2,
-1765.22,
37.32,
130.4],
[-900.97,
-1534.72,
5.02,
42.52],
[-837.92,
-1333.78,
5,
25.52],
[-827.89,
-1147.33,
7.55,
263.63],
[-742.68,
-956.36,
17.54,
266.46],
[-616.24,
-787.42,
25.09,
274.97],
[-464.72,
-647.32,
32.2,
87.88],
[-282.97,
-545.43,
29.28,
308.98],
[-84.75,
-478.19,
34.07,
334.49]
  ];
  const FACXFAC_25=[
    [2047.19,
4793.20,
41.72,
337.33],
[2077.90,
5222.43,
55.76,
124.73],
[2644.07,
5300.08,
44.15,
90.71],
[2944.20,
4902.62,
102.85,
102.05],
[2571.17,
4494.00,
36.90,
195.60],
[3255.45,
4483.96,
130.64,
170.08],
[2609.66,
3990.06,
41.52,
170.08],
[3316.00,
4028.01,
154.98,
121.89],
[3011.48,
3606.78,
71.16,
28.35],
[2814.98,
3226.52,
54.12,
87.88],
[2473.34,
3344.27,
50.21,
85.04],
[2395.52,
3022.16,
47.94,
119.06],
[2013.88,
3232.94,
43.69,
331.66],
[1900.16,
2821.05,
45.95,
42.52],
[1438.86,
2946.04,
44.74,
39.69],
[847.47,
3047.33,
41.40,
48.19],
[1378.44,
3462.31,
34.51,
337.33],
[718.54,
3560.48,
33.40,
334.49],
[-52.68,
3705.38,
36.21,
343.00],
[-259.45,
4184.54,
62.23,
257.96],
[203.94,
4418.76,
71.81,
204.10],
[728.34,
4295.90,
67.30,
218.27],
[1475.68,
4942.80,
76.04,
226.78],
[1240.82,
4393.51,
39.98,
138.90],
[711.38,
4711.51,
117.06,
201.26]
  ];

  const FACXFAC_SUL_CASSINO_25=[
    [339.20,
-242.94,
53.92,
161.58],
[497.54,
-118.50,
61.13,
229.61],
[341.33,
36.93,
89.89,
79.38],
[503.29,
104.06,
96.30,
59.53],
[790.90,
-107.32,
80.42,
65.20],
[648.68,
-12.07,
82.60,
221.11],
[501.28,
-357.41,
43.15,
141.74],
[857.94,
-325.51,
60.52,
164.41],
[730.53,
-467.26,
16.82,
164.41],
[760.79,
-705.41,
28.49,
184.26],
[558.64,
-790.44,
11.09,
178.59],
[507.35,
-631.81,
24.75,
175.75],
[395.99,
-884.87,
29.42,
175.75],
[308.56,
-729.71,
29.32,
195.60],
[278.11,
-589.13,
43.30,
175.75],
[180.35,
-855.66,
30.94,
172.92],
[175.55,
-412.31,
41.15,
172.92],
[86.11,
-673.27,
31.64,
150.24],
[-38.08,
-508.43,
32.65,
79.38],
[-21.57,
-320.65,
45.49,
249.45],
[668.48,
-253.63,
44.75,
354.34],
[-61.42,
-90.94,
57.78,
246.62],
[100.74,
-3.59,
68.09,
226.78],
[130.37,
-206.92,
54.53,
303.31],
[205.79,
164.27,
105.48,
0.00]
  ];
  const FACXFAC_SUL_CEMITERIO_25=[
    [-1480.45,
197.56,
56.67,
107.72],
[-1315.17,
292.78,
64.67,
153.08],
[-1087.63,
336.72,
66.86,
306.15],
[-940.72,
177.37,
66.00,
104.89],
[-791.24,
58.67,
50.31,
99.22],
[-877.22,
-156.40,
37.66,
79.38],
[-1005.16,
-312.81,
37.86,
116.23],
[-742.64,
-317.43,
36.43,
150.24],
[-789.59,
-640.07,
28.91,
175.75],
[-988.14,
-639.19,
24.25,
189.93],
[-935.86,
-822.64,
15.20,
189.93],
[-1205.96,
-686.59,
40.36,
5.67],
[-1255.29,
-960.52,
2.61,
150.24],
[-1429.42,
-787.66,
21.96,
215.44],
[-1648.25,
-971.98,
7.70,
68.04],
[-1363.89,
-565.80,
30.13,
48.19],
[-1722.42,
-718.11,
10.09,
300.48],
[-1596.96,
-552.42,
34.81,
8.51],
[-1806.60,
-500.47,
39.71,
260.79],
[-1889.20,
-280.31,
49.32,
246.62],
[-2135.02,
-305.49,
13.19,
246.62],
[-1689.98,
-326.20,
50.09,
280.63],
[-1580.21,
-130.82,
55.82,
82.21],
[-1676.53,
69.51,
63.91,
85.04],
[-1225.30,
-126.56,
41.62,
311.82]
  ];

  const presets=[
    {id:'dominacao-sul',
name:'Dominação — Sul',
event:'Dominação',
panel:'/evento',
mode:'assistant',
center:{x:116.48,
y:-457.27,
z:481.13,
h:212.6,
label:'Centro / área do evento'},
radius:1000,
points:DOMINACAO_30},

    {id:'facxfac-norte',
eventId:'preset_gas_fac-x-fac',
name:'Norte - Mar Alamo',
event:'Fac x Fac',
category:'gas',
panel:'/evento',
mode:'assistant',
center:{x:1692.36,
y:4040.85,
z:281.98,
h:22.68,
label:'Centro do Gás / Marco Zero'},
radius:1000,
points:FACXFAC_25},

    {id:'facxfac-sul-cassino-banco',
eventId:'preset_gas_fac-x-fac',
name:'Sul - Cassino / Banco Central',
event:'Fac x Fac',
category:'gas',
panel:'/evento',
mode:'assistant',
center:{x:351.53,
y:-357.41,
z:0.00,
h:0.00,
label:'Centro do Gás / Marco Zero'},
radius:1000,
points:FACXFAC_SUL_CASSINO_25},

    {id:'facxfac-sul-cemiterio-praia',
eventId:'preset_gas_fac-x-fac',
name:'Sul - Cemitério / Praia',
event:'Fac x Fac',
category:'gas',
panel:'/evento',
mode:'assistant',
center:{x:-1422.15,
y:-287.28,
z:46.25,
h:133.23,
label:'Centro do Gás / Marco Zero'},
radius:1000,
points:FACXFAC_SUL_CEMITERIO_25},

    {id:'facxfac-cayo-perico',
eventId:'preset_gas_fac-x-fac',
name:'Cayo Perico',
event:'Fac x Fac',
category:'gas',
panel:'/evento',
mode:'assistant',
center:{x:4787.64,
y:-5150.00,
z:0.00,
h:351.50,
label:'Centro do Gás / Marco Zero'},
radius:1000,
points:[]}
  ];

  const state={map:null,
drawn:[],
missions:[],
activeId:null,
initialized:false,
placing:false,
snapshotTimer:null,
autosaveTimer:null,
editing:false,
editBackup:null,
dirty:false,
libraryCategory:'dominacao',
activeEventId:null,
activeMapName:null,
workspaceOpen:false,
cloudState:'local',
safePlacementStage:null};
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
      if(!seen.has(m.eventId)) seen.set(m.eventId,{id:m.eventId,
name:m.event||'Evento sem nome',
category:m.category||category,
panel:m.panel||'/ilegal'});
    });
    return [...seen.values()];
  };
  function slugify(s){return String(s||'evento').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'evento';}
  function inferLegacyStructure(m){
    if(m.eventId) return;
    const cat=m.category||((String(m.event||'').toLowerCase().includes('domina'))?'dominacao':'gas');
    const name=String(m.name||'').trim(),
 evt=String(m.event||'').trim();
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
    let max=-1,
maxIndex=-1,
sum=0;
    pts.forEach((p,i)=>{const d=Math.hypot(Number(p.x)-Number(m.center.x),Number(p.y)-Number(m.center.y));sum+=d;if(d>max){max=d;maxIndex=(m.points||[]).indexOf(p);}});
    const minimum=Math.ceil(max);
    const recommended=Math.ceil((max*1.02)/100)*100;
    return {count:pts.length,
max,
minimum,
recommended,
average:sum/pts.length,
farthestIndex:maxIndex};
  }
  function effectiveEventRadius(m){const saved=Number(m?.eventRadius),
base=Number(m?.circleRadius),
s=coverageStats(m);return Number.isFinite(saved)&&saved>0?saved:(Number.isFinite(base)&&base>0?base:(s?.recommended||1000));}
  function pointDistanceFromCenter(m,p){return Math.hypot(Number(p.x)-Number(m.center.x),Number(p.y)-Number(m.center.y));}
  function pointInsideZone(m,p){if(!m||!p||!validCoord(m.center?.x)||!validCoord(m.center?.y)||!validCoord(p.x)||!validCoord(p.y))return true;return pointDistanceFromCenter(m,p)<=effectiveEventRadius(m);}
  function zoneCoverageCounts(m){const pts=(m?.points||[]).filter(p=>validCoord(p.x)&&validCoord(p.y));const radius=effectiveEventRadius(m);let inside=0,
outside=0;pts.forEach(p=>{if(pointDistanceFromCenter(m,p)<=radius)inside++;else outside++;});return {inside,
outside,
total:pts.length,
radius};}

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
    if(!t)return {ok:false,
motivo:'Cole a CDS copiada do jogo.'};
    t=t.replace(/^\s*(tpcds|tp|nc|setcoords|coords?)\s*[:=]?\s*/i,'');
    t=t.replace(/vector4|vector3|vec4|vec3/gi,'');
    t=t.replace(/[{}\[\]()]/g,' ');
    t=t.replace(/\b[xyzh]\s*[:=]\s*/gi,' ');
    t=t.replace(/heading|head|rot/gi,' ');
    const nums=t.match(/-?\d+(?:[.,]\d+)?/g)||[];
    const vals=nums.map(v=>Number(String(v).replace(',','.'))).filter(v=>Number.isFinite(v));
    if(vals.length<2)return {ok:false,
motivo:'Nao encontrei X e Y na CDS colada.'};
    const [x,
y,
z,
h]=vals;
    return {
      ok:true,

      x,
y,

      z:Number.isFinite(z)?z:null,

      h:Number.isFinite(h)?h:null,

      total:vals.length
    };
  }
  function cdsProblemas(r,{exigeZ=true,
exigeH=true}={}){
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
    return {id:i+1,
x:num(p.x),
y:num(p.y),
z:num(p.z),
h:num(p.h),
status:p.status||statusDefault,
validatedAt:p.validatedAt||null};
  }
  function presetMission(p){
    const category=p.category||(p.event==='Dominação'?'dominacao':'gas');
    let eventName=p.event,
 zoneName=p.name;
    if(category==='dominacao' && /Sul/i.test(p.name)){eventName='Dominação Sul';zoneName='Zona Principal';}
    if(category==='gas' && /Fac x Fac/i.test(p.event||p.name) && !p.eventId){eventName='Fac x Fac';zoneName=(/Norte/i.test(p.name)?'Norte':'Zona Principal');}
    return {id:p.id,
eventId:p.eventId||`preset_${category}_${slugify(eventName)}`,
mapName:p.mapName||'Mapa Principal',
name:zoneName,
event:eventName,
panel:p.panel,
mode:p.mode,
category,
center:{...p.center,
status:'validated',
validatedAt:nowIso()},
circleRadius:p.radius,
eventRadius:null,
startAngle:0,
spawnRadius:100,
createdAt:nowIso(),
updatedAt:nowIso(),
points:p.points.map((v,i)=>normalizePoint({x:v[0],
y:v[1],
z:v[2],
h:v[3],
status:'validated',
validatedAt:nowIso()},i,'validated')),
requestText:'',
requestKind:'alter-zone',
official:true};
  }
  function newMission(eventId=null,eventName=null,category=null){
    const cat=category||state.libraryCategory||'dominacao';
    return {id:uid(),
eventId:eventId||eventUid(),
mapName:'Mapa Principal',
name:'Zona Principal',
event:eventName||(cat==='gas'?'Novo Evento de Gás':'Novo Evento de Dominação'),
panel:defaultPanel(),
mode:'assistant',
category:cat,
center:{x:null,
y:null,
z:null,
h:null,
label:cat==='gas'?'Centro do Gás / Marco Zero':'Centro da Zona do Evento',
status:'planned',
validatedAt:null},
circleRadius:1000,
eventRadius:null,
startAngle:0,
spawnRadius:100,
createdAt:nowIso(),
updatedAt:nowIso(),
points:[],
requestText:'',
requestKind:eventId?'create-zone':'create-event',
official:false};
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
  const BACKUPS='highos_mission_planner_backups';
  const MAX_BACKUPS=8;

  /* V9.4.2 - guarda as ultimas versoes da lista de missoes neste navegador.
     Serve de rede de seguranca contra qualquer perda (sincronizacao, limpeza
     de cache, erro de edicao). Nunca apaga sozinho alem do rodizio. */
  function pushBackup(missions){
    try{
      if(!Array.isArray(missions)||!missions.length)return;
      const lista=JSON.parse(localStorage.getItem(BACKUPS)||'[]');
      const corpo=JSON.stringify(missions);
      if(lista[0]&&lista[0].corpo===corpo)return;          // nada mudou
      lista.unshift({at:new Date().toISOString(),
qtd:missions.length,
corpo});
      while(lista.length>MAX_BACKUPS)lista.pop();
      localStorage.setItem(BACKUPS,JSON.stringify(lista));
    }catch(e){
      // cota cheia: descarta o backup mais antigo e tenta de novo uma vez
      try{
        const lista=JSON.parse(localStorage.getItem(BACKUPS)||'[]').slice(0,3);
        localStorage.setItem(BACKUPS,JSON.stringify(lista));
      }catch(e2){}
    }
  }
  function readBackups(){
    try{return JSON.parse(localStorage.getItem(BACKUPS)||'[]')}catch(e){return []}
  }
  /* Fusao: nunca remove missao existente, so acrescenta o que faltar. */
  function mergeMissions(entrada=[]){
    if(!Array.isArray(entrada)||!entrada.length)return 0;
    const porId=new Set(state.missions.map(m=>m.id));
    const chave=m=>`${String(m.eventId||'')}|${normalizeText(m.name||'')}`;
    const porChave=new Set(state.missions.map(chave));
    let add=0;
    entrada.forEach(m=>{
      if(!m||!m.id)return;
      if(porId.has(m.id)||porChave.has(chave(m)))return;
      normalizeCenter(m);
      if(!m.category)m.category=(String(m.event||'').toLowerCase().includes('domina')?'dominacao':'gas');
      inferLegacyStructure(m);
      state.missions.push(m);porId.add(m.id);porChave.add(chave(m));add++;
    });
    if(add){baselineOfficialZones();saveStore();render();}
    return add;
  }
  function saveStore(){
    try{
      localStorage.setItem(STORE,JSON.stringify(state.missions));
      localStorage.setItem(ACTIVE,state.activeId||'');
      if(!state.applyingCloud)localStorage.setItem(SAVED_AT,new Date().toISOString());
      pushBackup(state.missions);
    }catch(e){console.warn('Planejador: falha ao salvar',e);}
    if(state.applyingCloud)return;
    try{window.HighOSMissionCloud?.push?.(state.missions);}catch(e){console.warn('Planejador: falha ao enfileirar sincronizacao',e);}
  }
  function applyCloudMissions(list){
    return mergeMissions(list)>0;
  }

  function setCloudState(kind,text){
    state.cloudState=kind;
    const els=[qs('#mpCloudState'),
qs('#mpCloudStateTop')].filter(Boolean);if(!els.length)return;
    els.forEach(el=>{el.className='mp-cloud-state '+kind;el.textContent=text||(kind==='ok'?'☁ SINCRONIZADO':kind==='sync'?'↻ SINCRONIZANDO...':'⚠ MODO LOCAL');});
  }
  function syncMissionsFromCloud(tries=0){
    const cloud=window.HighOSMissionCloud;
    if(!cloud||!cloud.pull){if(tries<12)setTimeout(()=>syncMissionsFromCloud(tries+1),1500);else setCloudState('local');return;}
    setCloudState('sync');
    cloud.pull().then(async res=>{
      const remote=Array.isArray(res?.missions)?res.missions:[];
      const add=mergeMissions(remote);
      // V9.5: primeira sincronizacao e sempre uma UNIAO segura. O navegador
      // nunca e substituido pela nuvem; depois da fusao, a lista completa volta
      // ao Firestore para que outros computadores recebam as zonas que so
      // existiam localmente.
      if(cloud.pushNow){await cloud.pushNow(state.missions);}else cloud.push?.(state.missions);
      setCloudState('ok',`☁ SINCRONIZADO · ${new Set(state.missions.map(m=>m.eventId).filter(Boolean)).size} eventos · ${state.missions.length} zonas`);
      if(add)setStatus(`${add} missao(oes) da equipe adicionadas.`,'ok');
    }).catch(()=>setCloudState('local'));
  }

  function mergeOfficialPresets(){
    const byId=new Set(state.missions.map(m=>m.id));
    let changed=false;
    presets.forEach(p=>{
      const existing=state.missions.find(m=>m.id===p.id);
      if(existing){
        const fresh=presetMission(p);
        ['eventId',
'event',
'name',
'category',
'panel'].forEach(k=>{if(existing[k]!==fresh[k]){existing[k]=fresh[k];changed=true;}});
        return;
      }
      state.missions.push(presetMission(p));
      byId.add(p.id);changed=true;
    });
    return changed;
  }

  function loadStore(){
    try{
      const raw=JSON.parse(localStorage.getItem(STORE)||'null');
      if(Array.isArray(raw)&&raw.length){state.missions=raw;state.missions.forEach(m=>{normalizeCenter(m);if(!m.category)m.category=(String(m.event||'').toLowerCase().includes('domina')?'dominacao':'gas');inferLegacyStructure(m);});repairKnownZoneAssignments();repairFacxFacHierarchy();mergeOfficialPresets();baselineOfficialZones();state.activeId=localStorage.getItem(ACTIVE)||raw[0].id;const am=state.missions.find(m=>m.id===state.activeId)||raw[0];state.libraryCategory=(am?.category||'dominacao');state.activeEventId=am?.eventId||null;saveStore();return;}
    }catch{}
    state.missions=presets.map(presetMission);state.activeId=state.missions[0].id;baselineOfficialZones();state.libraryCategory=state.missions[0]?.category||'dominacao';state.activeEventId=state.missions[0]?.eventId||null;saveStore();
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
    try{const db=await openDb();const tx=db.transaction(SNAP_STORE,'readwrite');tx.objectStore(SNAP_STORE).put({id,
dataUrl,
updatedAt:nowIso()});}catch(e){console.warn('Planejador: snapshot não salvo',e);}
  }
  async function getSnapshot(id){
    try{const db=await openDb();return await new Promise((resolve,reject)=>{const r=db.transaction(SNAP_STORE,'readonly').objectStore(SNAP_STORE).get(id);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error);});}catch{return null;}
  }

  function makeCrs(){return L.extend({},L.CRS.Simple,{projection:L.Projection.LonLat,
scale:z=>Math.pow(2,z),
zoom:s=>Math.log(s)/Math.LN2,
distance:(a,b)=>Math.hypot(b.lng-a.lng,b.lat-a.lat),
transformation:new L.Transformation(0.02072,117.3,-0.0205,172.8),
infinite:true});}
  const remoteBases=['https://cdn.jsdelivr.net/gh/Trusted-Studios/mapStyles@main',
'https://raw.githubusercontent.com/Trusted-Studios/mapStyles/main'];
  const TRANSPARENT_TILE='data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
  function layer(style,ext='jpg',maxZoom=5,baseIndex=0){
    // V9.5.3: o repositorio usa matriz XYZ padrao (0..2^z-1). O CRS customizado
    // pode pedir x/y fora dessa matriz; antes isso gerava dezenas de 404/403 no console.
    const base=`${remoteBases[baseIndex]}/${style}`;
    const SafeTiles=L.TileLayer.extend({
      getTileUrl(coords){
        const max=Math.pow(2,coords.z)-1;
        if(coords.x<0||coords.y<0||coords.x>max||coords.y>max)return TRANSPARENT_TILE;
        return `${base}/${coords.z}/${coords.x}/${coords.y}.${ext}`;
      }
    });
    return new SafeTiles('',{minZoom:0,
maxZoom,
noWrap:true,
continuousWorld:false,
updateWhenIdle:true,
keepBuffer:2,
crossOrigin:'anonymous',
errorTileUrl:TRANSPARENT_TILE});
  }
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
      const pts=[[2,
2],
[c.width-3,
2],
[2,
c.height-3],
[c.width-3,
c.height-3],
[c.width>>1,
2]];
      const cores=pts.map(([x,
y])=>{const d=ctx.getImageData(x,y,1,1).data;return [d[0],
d[1],
d[2],
d[3]];}).filter(d=>d[3]>200);
      if(cores.length<4)return null;
      const media=[0,
1,
2].map(i=>cores.reduce((a,c2)=>a+c2[i],0)/cores.length);
      // so aceita se as amostras forem parecidas entre si (tile uniforme = mar aberto)
      const desvio=Math.max(...[0,
1,
2].map(i=>Math.max(...cores.map(c2=>Math.abs(c2[i]-media[i])))));
      if(desvio>14)return null;
      const [r,
g,
b]=media.map(v=>Math.round(v));
      // e se realmente parecer agua (azul/verde dominante e nao muito claro)
      if(b<40||b<r||(r+g+b)/3>190)return null;
      return '#'+[r,
g,
b].map(v=>v.toString(16).padStart(2,'0')).join('');
    }catch(e){return null;}
  }
  function watchOcean(layer){
    if(!layer||layer._mpOceanWatch)return;layer._mpOceanWatch=true;
    layer.on('tileload',ev=>{
      // desiste depois de algumas tentativas: e so cosmetico, nunca pode
      // atrapalhar o carregamento do mapa em si
      if(state.oceanLocked||state.oceanTries>=8)return;
      state.oceanTries=(state.oceanTries||0)+1;
      try{
        const hex=sampleOceanFromTile(ev.tile);
        if(hex){state.oceanLocked=true;applyOceanColor(hex);}
      }catch(e){state.oceanTries=99;}
    });
  }
  /* ---------------------------------------------------------------
     V9.4.4 - Se nenhum tile chegar, o mapa ficava eternamente em
     "Carregando mapa GTA V...". Agora existe um vigia: ele diz o que
     esta acontecendo, tenta o servidor alternativo sozinho e oferece
     um botao de recarregar sem precisar atualizar a pagina inteira.
  --------------------------------------------------------------- */
  function mapNotice(texto,tipo='warn',comBotao=false){
    setStatus(texto,tipo);
    const barra=qs('.mp-map-status');if(!barra)return;
    let acao=qs('#mpMapRetry');
    if(!comBotao){acao?.remove();return;}
    if(!acao){
      acao=document.createElement('button');
      acao.type='button';acao.id='mpMapRetry';acao.className='mp-map-retry';
      acao.textContent='RECARREGAR MAPA';
      acao.addEventListener('click',reloadMapTiles);
      barra.appendChild(acao);
    }
  }
  function reloadMapTiles(){
    if(!state.map)return;
    state.tileBase=((state.tileBase||0)+1)%remoteBases.length;
    mapNotice('Tentando outro servidor do mapa...','warn',false);
    try{
      Object.values(state.mapLayers||{}).forEach(l=>{try{state.map.removeLayer(l)}catch(e){}});
    }catch(e){}
    const atlas=layer('styleAtlas','jpg',5,state.tileBase);
    const sat=layer('styleSatelite','jpg',5,state.tileBase);
    const grid=layer('styleGrid','png',5,state.tileBase);
    state.mapLayers={atlas,
sat,
grid};
    let ok=0,
err=0;
    atlas.on('tileload',()=>{ok++;mapNotice('Mapa GTA V carregado','ok',false)});
    [atlas,
sat,
grid].forEach(l=>{l.on('tileerror',()=>err++);watchOcean(l)});
    atlas.addTo(state.map);
    state.map.invalidateSize();
    startMapWatchdog(()=>ok,()=>err);
  }
  function startMapWatchdog(getOk,getErr){
    clearTimeout(state.mapWatchdog);
    let ciclos=0;
    const tick=()=>{
      ciclos++;
      if(!state.map)return;
      if(getOk()>0){mapNotice('Mapa GTA V carregado','ok',false);return;}
      const box=qs('#missionPlannerMap');
      const semTamanho=box&&(box.clientWidth<40||box.clientHeight<40);
      if(semTamanho){
        // causa mais comum: o mapa foi criado com a aba ainda escondida
        state.map.invalidateSize();
        if(ciclos<6)return void(state.mapWatchdog=setTimeout(tick,1200));
        mapNotice('O mapa abriu sem espaço na tela. Recarregue.','warn',true);
        return;
      }
      if(getErr()>0){
        mapNotice(`Servidor do mapa não respondeu (${getErr()} tiles falharam).`,'warn',true);
        return;
      }
      if(ciclos<6)return void(state.mapWatchdog=setTimeout(tick,1200));
      mapNotice('Nenhum tile chegou. Verifique a conexão ou o bloqueador.','warn',true);
    };
    state.mapWatchdog=setTimeout(tick,2500);
  }

  /* ---------------------------------------------------------------
     V9.4.5 - Controle de camadas proprio. O padrao do Leaflet (lista
     de radios e checkboxes) destoava do resto do painel. Aqui as
     bases viram um seletor segmentado e os overlays de Cayo viram
     interruptores, tudo no mesmo tema do High OS.
  --------------------------------------------------------------- */
  function buildLayerControl(bases,overlays){
    const host=qs('.mission-planner-mapwrap');
    if(!host||qs('#mpLayerControl'))return;
    const box=document.createElement('div');
    box.id='mpLayerControl';box.className='mp-layer-control';
    box.innerHTML=`
      <button type="button" class="mp-layer-toggle" aria-expanded="true" title="Camadas do mapa">
        <span class="mp-layer-icon">◧</span><span class="mp-layer-label">CAMADAS</span>
      </button>
      <div class="mp-layer-body">
        <div class="mp-layer-group">
          <span class="mp-layer-title">BASE</span>
          <div class="mp-segment" role="group">
            <button type="button" data-base="atlas" class="active">ATLAS</button>
            <button type="button" data-base="sat">SATÉLITE</button>
            <button type="button" data-base="grid">GRID</button>
          </div>
        </div>
        <div class="mp-layer-group">
          <span class="mp-layer-title">CAYO PERICO</span>
          <label class="mp-switch"><input type="checkbox" data-over="cayo" checked><i></i><span>Satélite</span></label>
          <label class="mp-switch"><input type="checkbox" data-over="cayoPostal" checked><i></i><span>Postal</span></label>
        </div>
      </div>`;
    host.appendChild(box);
    if(window.L?.DomEvent){L.DomEvent.disableClickPropagation(box);L.DomEvent.disableScrollPropagation(box);}

    const trocarBase=chave=>{
      Object.entries(bases).forEach(([k,
l])=>{
        try{if(k===chave){if(!state.map.hasLayer(l))l.addTo(state.map);}else if(state.map.hasLayer(l))state.map.removeLayer(l);}catch(e){}
      });
      qsa('[data-base]',box).forEach(b=>b.classList.toggle('active',b.dataset.base===chave));
      state.oceanLocked=false;state.oceanTries=0;
      watchOcean(bases[chave]);
    };
    qsa('[data-base]',box).forEach(b=>b.addEventListener('click',()=>trocarBase(b.dataset.base)));

    // overlays de Cayo comecam visiveis, como antes
    Object.values(overlays).forEach(l=>{try{l.addTo(state.map)}catch(e){}});
    qsa('[data-over]',box).forEach(inp=>inp.addEventListener('change',()=>{
      const l=overlays[inp.dataset.over];if(!l)return;
      try{inp.checked?l.addTo(state.map):state.map.removeLayer(l)}catch(e){}
    }));

    const alternar=()=>{
      const aberto=box.classList.toggle('collapsed');
      box.querySelector('.mp-layer-toggle')?.setAttribute('aria-expanded',aberto?'false':'true');
      try{localStorage.setItem('highos_mp_layers_collapsed',aberto?'1':'0')}catch(e){}
    };
    box.querySelector('.mp-layer-toggle')?.addEventListener('click',alternar);
    try{if(localStorage.getItem('highos_mp_layers_collapsed')==='1')box.classList.add('collapsed');}catch(e){}
  }

  function initMap(){
    if(state.map||!qs('#missionPlannerMap'))return;
    if(typeof L==='undefined'){setStatus('Leaflet não carregou','warn');return;}
    let atlas=layer('styleAtlas'),
sat=layer('styleSatelite'),
grid=layer('styleGrid','png');
    // Cayo Perico overlay calibrated to the GTA/FiveM world-coordinate region around 4700,-5150.
    // It is an overlay (not a separate coordinate system), so clicks/markers continue returning GTA X/Y.
    const cayoUrl='https://raw.githubusercontent.com/fivenet-app/livemap-tiles/main/overlays/cayo-perico/satellite.webp';
    const cayoPostalUrl='https://raw.githubusercontent.com/fivenet-app/livemap-tiles/main/overlays/cayo-perico/postal.webp';
    const cayoBounds=L.latLngBounds(ll(3900,-6000),ll(5600,-4300));
    // Fundo de oceano próprio para a região de Cayo. O mapa base não possui tiles nessa área,
    // então este retângulo evita o vazio/preto ao redor da ilha sem alterar as coordenadas GTA/FiveM.
    state.map=L.map('missionPlannerMap',{crs:makeCrs(),
minZoom:1,
maxZoom:5,
layers:[atlas],
preferCanvas:true,
zoomControl:true,
attributionControl:false});
    state.map.createPane('cayoOceanPane');state.map.getPane('cayoOceanPane').style.zIndex=220;
    state.map.createPane('cayoMapPane');state.map.getPane('cayoMapPane').style.zIndex=230;
    const cayoOceanBounds=L.latLngBounds(ll(3450,-6450),ll(6050,-3850));
    const cayoOcean=L.rectangle(cayoOceanBounds,{pane:'cayoOceanPane',
stroke:false,
fill:true,
fillColor:OCEAN_FALLBACK,
fillOpacity:1,
interactive:false}).addTo(state.map);
    const cayo=L.imageOverlay(cayoUrl,cayoBounds,{pane:'cayoMapPane',
opacity:1,
interactive:false,
crossOrigin:true});
    const cayoPostal=L.imageOverlay(cayoPostalUrl,cayoBounds,{pane:'cayoMapPane',
opacity:1,
interactive:false,
crossOrigin:true});
    buildLayerControl({atlas,
sat,
grid},{cayo,
cayoPostal});
    state.cayoBounds=cayoBounds;state.cayoOceanBounds=cayoOceanBounds;state.cayoOceanLayer=cayoOcean;state.cayoLayer=cayo;state.cayoPostalLayer=cayoPostal;state.atlasLayer=atlas;state.satLayer=sat;state.gridLayer=grid;
    state.map.setView(ll(900,-600),3);
    let okCount=0,
errCount=0,
fallbackUsed=false;
    const ok=()=>{okCount++;setStatus('Mapa GTA V carregado','ok');};
    const err=()=>{errCount++;if(okCount===0&&errCount>4&&!fallbackUsed){fallbackUsed=true;setStatus('Alternando servidor do mapa…','warn');try{state.map.removeLayer(atlas);}catch{}atlas=layer('styleAtlas','jpg',5,1);atlas.on('tileload',ok);atlas.addTo(state.map);}};
    [atlas,
sat,
grid].forEach(x=>{x.on('tileload',ok);x.on('tileerror',err);watchOcean(x);});
    state.mapLayers={atlas,
sat,
grid};
    state.tileCounters={get ok(){return okCount},
get err(){return errCount}};
    startMapWatchdog(()=>okCount,()=>errCount);
    applyOceanColor(OCEAN_FALLBACK);
    state.map.on('baselayerchange',ev=>{state.oceanLocked=false;watchOcean(ev.layer);setTimeout(()=>{if(!state.oceanLocked)applyOceanColor(OCEAN_FALLBACK);},1200);});
    state.map.on('mousemove',e=>{if(qs('#mpCursor'))qs('#mpCursor').textContent=`X ${f(e.latlng.lng)} | Y ${f(e.latlng.lat)}`;});
    state.map.on('click',e=>{
      const m=active();if(!m)return;
      if(!state.editing){if(qs('#mpClicked'))qs('#mpClicked').textContent='Modo visualização: clique em EDITAR EVENTO para alterar posições.';return;}
      if(qs('#mpClicked'))qs('#mpClicked').textContent=`${f(e.latlng.lng)},${f(e.latlng.lat)}`;
      if(state.safePlacementStage!==null){placeSafeOnMap(e.latlng);return;}
      if(state.placing){m.points.push(normalizePoint({x:e.latlng.lng,
y:e.latlng.lat,
z:0,
h:0,
status:'planned'},m.points.length));commit('Ponto marcado no mapa');}
      else {m.center.x=e.latlng.lng;m.center.y=e.latlng.lat;m.center.z=0;m.center.h=0;m.center.status='planned';m.center.validatedAt=null;m.center.validationReason='coordinate-change';syncForm();commit('Centro ajustado no mapa — validação removida');}
    });
  }

  function pinIcon(p,outside=false,risco=false){const cls=isValidated(p)?'validated':'planned';const warn=outside?' style="outline:3px solid #ff5252;box-shadow:0 0 0 5px rgba(255,82,82,.22)"':(risco?' style="outline:3px solid #ffb02e;box-shadow:0 0 0 5px rgba(255,176,46,.25)"':'');return L.divIcon({className:'',
html:`<div class="mp-pin ${cls} ${outside?'outside':''}"${warn}>${outside?'!':''}${String(p.id).padStart(2,'0')}</div>`,
iconSize:[outside?34:28,
outside?34:28],
iconAnchor:[outside?17:14,
outside?17:14]});}
  function headingIcon(h){return L.divIcon({className:'',
html:`<div class="mp-heading" style="transform:rotate(${Number(h)||0}deg)">↑</div>`,
iconSize:[24,
24],
iconAnchor:[12,
12]});}
  function clearLayers(){state.drawn.forEach(o=>{try{state.map.removeLayer(o)}catch{}});state.drawn=[];}
  // V12.6 — rota progressiva da Safe: FECHA -> MOVE -> FECHA -> MOVE -> FECHA FINAL
  function ensureSafeRoute(m){
    if(!m||((m.category||'dominacao')!=='gas'))return null;
    const initial=effectiveEventRadius(m);
    if(!m.safeRoute||!Array.isArray(m.safeRoute.stages)){
      m.safeRoute={version:1,stages:[
        {x:num(m.center?.x),y:num(m.center?.y),z:num(m.center?.z),radius:Math.max(50,Math.round(initial*.65)),damage:5,closeSeconds:180,moveSeconds:90},
        {x:null,y:null,z:null,radius:Math.max(50,Math.round(initial*.35)),damage:10,closeSeconds:150,moveSeconds:75},
        {x:null,y:null,z:null,radius:Math.max(30,Math.round(initial*.12)),damage:20,closeSeconds:120,moveSeconds:0}
      ]};
    }
    const s=m.safeRoute.stages;
    while(s.length<3)s.push({x:null,y:null,z:null,radius:100,damage:5,closeSeconds:120,moveSeconds:60});
    s.length=3;
    if(!validCoord(s[0].x)&&validCoord(m.center?.x)){s[0].x=num(m.center.x);s[0].y=num(m.center.y);s[0].z=num(m.center.z);}
    if(!Array.isArray(m.safeRoute.stage2Options))m.safeRoute.stage2Options=safeStageValid?.(s[1])?[{x:s[1].x,y:s[1].y,z:s[1].z}]:[];
    if(!Array.isArray(m.safeRoute.stage3Options))m.safeRoute.stage3Options=safeStageValid?.(s[2])?[{x:s[2].x,y:s[2].y,z:s[2].z}]:[];
    return m.safeRoute;
  }
  function safeStageValid(s){return !!s&&validCoord(s.x)&&validCoord(s.y)&&Number(s.radius)>0;}
  function ensureSafeRouteUi(){
    const existing=qs('#mpSafeRouteBox');
    if(existing){
      const coverage=qs('#mpCoverageBox');
      if(coverage&&existing.previousElementSibling!==coverage)coverage.insertAdjacentElement('afterend',existing);
      return;
    }
    const anchor=qs('#mpCoverageBox')||qs('#mpCenterValidation'),zonePanel=plannerPanel('zona');
    if(!anchor&&!zonePanel)return;
    const box=document.createElement('div');box.id='mpSafeRouteBox';box.className='mp-card';box.dataset.forceTab='zona';box.style.marginTop='10px';
    box.innerHTML=`<h3>ROTA PROGRESSIVA DA SAFE</h3>
      <p class="mp-note">Fluxo: <b>FECHA 1 → MOVE → FECHA 2 → MOVE → FECHA FINAL</b>. Os respawns da missão não são alterados.</p>
      <div id="mpSafeRouteStatus" class="mp-readout"></div>
      <div id="mpSafeStages"></div>
      <div class="mp-actions" style="display:flex;gap:6px;flex-wrap:wrap">
        <button type="button" id="mpSafeUseCenter">SAFE 1 = CENTRO ATUAL</button>
        <button type="button" id="mpSafePlace2">ADICIONAR OPÇÃO SAFE 2</button>
        <button type="button" id="mpSafePlace3">ADICIONAR OPÇÃO SAFE 3</button>
        <button type="button" id="mpSafePreview" class="primary">▶ PREVIEW DA ROTA</button>
        <button type="button" id="mpSafeStop">■ PARAR</button>
      </div>`;
    if(anchor)anchor.insertAdjacentElement('afterend',box);else zonePanel.appendChild(box);
    qs('#mpSafeUseCenter')?.addEventListener('click',()=>{if(!requireEdit())return;const m=active(),r=ensureSafeRoute(m);if(!m||!r)return;r.stages[0].x=num(m.center.x);r.stages[0].y=num(m.center.y);r.stages[0].z=num(m.center.z);commit('Safe 1 vinculada ao centro da missão');});
    qs('#mpSafePlace2')?.addEventListener('click',()=>beginSafePlacement(1));
    qs('#mpSafePlace3')?.addEventListener('click',()=>beginSafePlacement(2));
    qs('#mpSafePreview')?.addEventListener('click',startSafePreview);
    qs('#mpSafeStop')?.addEventListener('click',stopSafePreview);
  }
  function beginSafePlacement(stageIndex){
    if(!requireEdit())return;
    const m=active();if(!m||((m.category||'dominacao')!=='gas'))return;
    ensureSafeRoute(m);state.safePlacementStage=stageIndex;state.placing=false;
    const status=qs('#mpSafeRouteStatus');if(status)status.innerHTML=`<b>MARCAÇÃO ATIVA: SAFE ${stageIndex+1}</b><br>Clique no mapa no local onde o centro da Safe deverá chegar.`;
    if(state.map?.getContainer())state.map.getContainer().style.cursor='crosshair';
  }
  function placeSafeOnMap(latlng){
    const m=active(),idx=state.safePlacementStage;if(!m||idx===null||idx===undefined)return false;
    const r=ensureSafeRoute(m),s=r?.stages?.[idx];if(!s)return false;
    s.x=latlng.lng;s.y=latlng.lat;s.z=num(m.center?.z)||0;
    const key=idx===1?'stage2Options':'stage3Options';if(!Array.isArray(r[key]))r[key]=[];
    r[key].push({x:s.x,y:s.y,z:s.z});
    state.safePlacementStage=null;if(state.map?.getContainer())state.map.getContainer().style.cursor='';
    commit(`Safe ${idx+1} marcada no mapa`);
    state.map?.panTo(latlng);renderSafeRouteUi();return true;
  }
  function renderSafeRouteUi(){
    ensureSafeRouteUi();const box=qs('#mpSafeRouteBox'),m=active();if(!box||!m)return;
    const gas=(m.category||'dominacao')==='gas';
    box.style.display=gas?'block':'none';if(!gas)return;
    const coverage=qs('#mpCoverageBox');
    if(coverage&&box.previousElementSibling!==coverage)coverage.insertAdjacentElement('afterend',box);
    const r=ensureSafeRoute(m),host=qs('#mpSafeStages'),status=qs('#mpSafeRouteStatus');if(!r||!host)return;
    const initial=effectiveEventRadius(m);
    host.innerHTML=r.stages.map((s,i)=>`<div class="mp-readout" style="margin-top:8px"><b>SAFE ${i+1}${i===2?' • FINAL':''}</b>
      <div class="mp-grid" style="margin-top:6px">
        <label>X<input data-safe="${i}" data-k="x" inputmode="decimal" value="${s.x??''}"></label>
        <label>Y<input data-safe="${i}" data-k="y" inputmode="decimal" value="${s.y??''}"></label>
        <label>Raio final (m)<input data-safe="${i}" data-k="radius" type="number" min="30" value="${s.radius??''}"></label>
        <label>Dano<input data-safe="${i}" data-k="damage" type="number" min="0" value="${s.damage??''}"></label>
        <label>Fechamento (s)<input data-safe="${i}" data-k="closeSeconds" type="number" min="1" value="${s.closeSeconds??''}"></label>
        ${i<2?`<label>Movimento (s)<input data-safe="${i}" data-k="moveSeconds" type="number" min="1" value="${s.moveSeconds??''}"></label>`:''}
      </div></div>`).join('');
    qsa('[data-safe]',host).forEach(inp=>inp.addEventListener('change',e=>{if(!requireEdit())return;const mm=active(),rr=ensureSafeRoute(mm),i=Number(e.target.dataset.safe),k=e.target.dataset.k,v=Number(e.target.value);if(!Number.isFinite(v)){renderSafeRouteUi();return;}rr.stages[i][k]=v;if(k==='radius')rr.stages[i][k]=Math.max(30,v);state.dirty=true;setSaveState('Rota da Safe alterada • NÃO SALVO');renderMap();renderSafeRouteUi();}));
    const ok=r.stages.filter(safeStageValid).length;
    const o2=r.stage2Options||[],o3=r.stage3Options||[];
    const opts=document.createElement('div');opts.className='mp-note';opts.style.marginTop='8px';opts.innerHTML=`Opções aleatórias: <b>Safe 2: ${o2.length}</b> • <b>Safe 3: ${o3.length}</b> <button type="button" id="mpSafeClearOptions" style="margin-left:8px">LIMPAR OPÇÕES</button>`;host.appendChild(opts);
    qs('#mpSafeClearOptions')?.addEventListener('click',()=>{if(!requireEdit())return;r.stage2Options=[];r.stage3Options=[];r.stages[1].x=r.stages[1].y=null;r.stages[2].x=r.stages[2].y=null;commit('Opções aleatórias da Safe removidas');});
    status.innerHTML=`Raio inicial: <b>${Math.round(initial)} m</b> • Etapas configuradas: <b>${ok}/3</b><br><small>Adicione várias opções de Safe 2 e Safe 3 clicando no mapa. A execução poderá sortear uma rota.</small>`;
  }
  function drawSafeRoute(m){
    if(!state.map||!m||((m.category||'dominacao')!=='gas'))return;
    const r=ensureSafeRoute(m);if(!r)return;
    const o2=(r.stage2Options||[]).filter(s=>validCoord(s.x)&&validCoord(s.y)),o3=(r.stage3Options||[]).filter(s=>validCoord(s.x)&&validCoord(s.y));
    const s1=r.stages[0],valid=r.stages.filter(safeStageValid);
    if(safeStageValid(s1)){o2.forEach((p,i)=>{const line=L.polyline([ll(s1.x,s1.y),ll(p.x,p.y)],{weight:2,dashArray:'7 7',opacity:.55,interactive:false}).addTo(state.map);const icon=L.divIcon({className:'',html:`<div class="mp-center-pin planned" style="font-size:10px;font-weight:900">S2-${i+1}</div>`,iconSize:[36,30],iconAnchor:[18,15]});state.drawn.push(line,L.marker(ll(p.x,p.y),{icon}).addTo(state.map));});}
    o2.forEach(a=>o3.forEach((b,i)=>{const line=L.polyline([ll(a.x,a.y),ll(b.x,b.y)],{weight:1.5,dashArray:'4 8',opacity:.28,interactive:false}).addTo(state.map);state.drawn.push(line);}));
    o3.forEach((p,i)=>{const icon=L.divIcon({className:'',html:`<div class="mp-center-pin planned" style="font-size:10px;font-weight:900">S3-${i+1}</div>`,iconSize:[36,30],iconAnchor:[18,15]});state.drawn.push(L.marker(ll(p.x,p.y),{icon}).addTo(state.map));});
    if(valid.length>1){
      const line=L.polyline(valid.map(s=>ll(s.x,s.y)),{weight:4,dashArray:'10 8',opacity:.85,interactive:false}).addTo(state.map);state.drawn.push(line);
    }
    r.stages.forEach((s,i)=>{if(!safeStageValid(s))return;
      const circle=L.circle(ll(s.x,s.y),{radius:Number(s.radius),weight:3,fillOpacity:.025,dashArray:i===2?'4 4':'10 7',interactive:false}).addTo(state.map);
      const icon=L.divIcon({className:'',html:`<div class="mp-center-pin validated" style="font-size:11px;font-weight:900">S${i+1}</div>`,iconSize:[32,32],iconAnchor:[16,16]});
      const pin=L.marker(ll(s.x,s.y),{icon,interactive:true}).addTo(state.map).bindPopup(`<b>SAFE ${i+1}</b><br>Raio final: ${Math.round(Number(s.radius))}m<br>Dano: ${Number(s.damage)||0}<br>Fecha: ${Number(s.closeSeconds)||0}s${i<2?`<br>Move: ${Number(s.moveSeconds)||0}s`:''}`);
      state.drawn.push(circle,pin);
    });
  }
  function stopSafePreview(){
    if(state.safePreviewTimer){clearInterval(state.safePreviewTimer);state.safePreviewTimer=null;}
    if(state.safePreviewLayer&&state.map){try{state.map.removeLayer(state.safePreviewLayer)}catch{}state.safePreviewLayer=null;}
  }
  function startSafePreview(){
    const m=active(),r=ensureSafeRoute(m);if(!m||!r||!safeStageValid(r.stages[0])){alert('Configure a Safe 1 antes do preview.');return;}
    const o2=(r.stage2Options||[]).filter(s=>validCoord(s.x)&&validCoord(s.y)),o3=(r.stage3Options||[]).filter(s=>validCoord(s.x)&&validCoord(s.y));
    if(!o2.length||!o3.length){alert('Adicione pelo menos uma opção de Safe 2 e uma de Safe 3 no mapa.');return;}
    const p2=o2[Math.floor(Math.random()*o2.length)],p3=o3[Math.floor(Math.random()*o3.length)];
    r.stages[1].x=p2.x;r.stages[1].y=p2.y;r.stages[2].x=p3.x;r.stages[2].y=p3.y;
    stopSafePreview();
    const initial=effectiveEventRadius(m),phases=[
      {type:'close',a:r.stages[0],from:initial,to:r.stages[0].radius},
      {type:'move',a:r.stages[0],b:r.stages[1],from:r.stages[0].radius,to:r.stages[0].radius},
      {type:'close',a:r.stages[1],from:r.stages[0].radius,to:r.stages[1].radius},
      {type:'move',a:r.stages[1],b:r.stages[2],from:r.stages[1].radius,to:r.stages[1].radius},
      {type:'close',a:r.stages[2],from:r.stages[1].radius,to:r.stages[2].radius}
    ];
    let pi=0,t=0;const steps=60;
    const gasStyle={radius:initial,weight:4,color:'#a855f7',opacity:.92,fillColor:'#7e22ce',fillOpacity:.16,dashArray:'10 7',interactive:false};
    state.safePreviewLayer=L.circle(ll(r.stages[0].x,r.stages[0].y),gasStyle).addTo(state.map);
    const routeLine=L.polyline([ll(r.stages[0].x,r.stages[0].y),ll(r.stages[1].x,r.stages[1].y),ll(r.stages[2].x,r.stages[2].y)],{color:'#c084fc',weight:3,opacity:.72,dashArray:'8 8',interactive:false}).addTo(state.map);state.drawn.push(routeLine);
    const status=qs('#mpSafeRouteStatus');if(status)status.innerHTML=`<b>PREVIEW EM EXECUÇÃO</b> • rota sorteada: SAFE 1 → SAFE 2 → SAFE 3<br><small>O círculo roxo representa a área do gás durante fechamento e deslocamento.</small>`;
    state.safePreviewTimer=setInterval(()=>{const p=phases[pi];t++;const u=Math.min(1,t/steps),smooth=u*u*(3-2*u);let x=p.a.x,y=p.a.y,rad=p.from+(p.to-p.from)*smooth;if(p.type==='move'){x=p.a.x+(p.b.x-p.a.x)*smooth;y=p.a.y+(p.b.y-p.a.y)*smooth;}state.safePreviewLayer.setLatLng(ll(x,y));state.safePreviewLayer.setRadius(rad);if(u>=1){pi++;t=0;if(pi>=phases.length){stopSafePreview();renderMap();}}},45);
  }

  function renderMap(){
    if(!state.map)return;clearLayers();const m=active();if(!m)return;renderSafeRouteUi();
    if(validCoord(m.center.x)&&validCoord(m.center.y)){
      const cicon=L.divIcon({className:'',
html:`<div class="mp-center-pin ${isCenterValidated(m)?'validated':'planned'}">◎</div>`,
iconSize:[32,
32],
iconAnchor:[16,
16]});
      const center=L.marker(ll(m.center.x,m.center.y),{icon:cicon,
draggable:state.editing}).addTo(state.map).bindPopup(`<b>${esc(m.center.label||'Centro')}</b><br>Status: <b>${isCenterValidated(m)?'VALIDADO':'PENDENTE'}</b><br>${f(m.center.x)},${f(m.center.y)}${isCenterValidated(m)?','+f(m.center.z)+','+f(m.center.h):',0.00,0.00'}<br><small>${state.editing?'Arraste para ajustar o centro':'Visualização • ponto travado'}</small>`);
      center.on('dragend',ev=>{const n=ev.target.getLatLng();m.center.x=n.lng;m.center.y=n.lat;m.center.z=0;m.center.h=0;m.center.status='planned';m.center.validatedAt=null;m.center.validationReason='coordinate-change';commit('Centro movido no mapa — validação removida');});
      state.drawn.push(center);
      const eventRadius=effectiveEventRadius(m);
      if(eventRadius>0){
        const zone=L.circle(ll(m.center.x,m.center.y),{radius:eventRadius,
weight:2,
fillOpacity:.035,
dashArray:(m.category||'dominacao')==='gas'?'8 6':null,
interactive:false}).addTo(state.map);
        state.drawn.push(zone);
      }
    }
    drawSafeRoute(m);
    m.points.forEach((p,i)=>{
      p.id=i+1;const valid=isValidated(p),
outside=((m.category||'dominacao')==='gas')&&!pointInsideZone(m,p),
pos=ll(p.x,p.y);
      const circle=L.circle(pos,{radius:Number(m.spawnRadius)||100,
weight:outside?3:2,
fillOpacity:outside?.14:.07,
dashArray:outside?'3 4':(valid?null:'6 5'),
color:outside?'#ff5252':undefined,
fillColor:outside?'#ff5252':undefined}).addTo(state.map);
      /* V12.13 — risco de terreno (água/QG) marcado no pino: arraste e valide */
      const agua=pointWater(p)===true,qgPerto=nearQg(p),risco=agua||!!qgPerto;
      const wk=`${partidasDe(m).length}|${m.points.length}`;if(!state._winsFor||state._winsFor.m!==m||state._winsFor.k!==wk){state._winsFor={m,k:wk,w:zoneInsights(m).wins};}
      const vit=state._winsFor.w[i+1]||0;
      const marker=L.marker(pos,{icon:pinIcon(p,outside,risco),
draggable:state.editing}).addTo(state.map);
      marker.bindPopup(`<b>Ponto ${String(p.id).padStart(2,'0')}</b><br>Status: <b>${valid?'VALIDADO':'PENDENTE'}</b>${outside?'<br><b style="color:#ff7474">FORA DA ZONA ⚠</b>':''}${agua?'<br><b style="color:#ffb02e">⚠ PARECE ESTAR NA ÁGUA</b>':''}${qgPerto?`<br><b style="color:#ffb02e">⚠ ${Math.round(qgPerto.d)} m do QG ${esc(qgPerto.qg||qgPerto.group)}</b>`:''}${vit?`<br>🏆 ${vit} vitória${vit>1?'s':''} registrada${vit>1?'s':''}`:''}<br>${f(p.x)},${f(p.y)}${valid?','+f(p.z)+','+f(p.h):''}${risco&&!valid?`<br><small>${state.editing?'Arraste para terra firme e valide a CDS':'Clique em EDITAR para arrastar'}</small>`:''}`);
      marker.on('click',()=>selectPoint(p.id));
      marker.on('dragend',ev=>{const n=ev.target.getLatLng();p.x=n.lng;p.y=n.lat;p.z=0;p.status='planned';p.validatedAt=null;commit(`Ponto ${p.id} movido — valide a CDS real`);selectPoint(p.id);goValidate();});
      state.drawn.push(circle,marker);
      if(Number.isFinite(p.h)){const a=p.h*Math.PI/180,
d=35;state.drawn.push(L.marker(ll(p.x+Math.sin(a)*d,p.y+Math.cos(a)*d),{icon:headingIcon(p.h),
interactive:false}).addTo(state.map));}
    });
  }

  function renderMissionList(){
    renderCentralV954();
  }

  function renderPointList(){
    const m=active(),
box=qs('#mpPointList');if(!box||!m)return;
    if(!m.points.length){box.innerHTML='<div class="mp-note">Nenhum ponto registrado.</div>';return;}
    box.innerHTML=m.points.map((p,i)=>{const valid=isValidated(p);return `<div class="mp-point-row ${valid?'validated':'planned'}" data-pidx="${i}"><div class="mp-point-num">${String(i+1).padStart(2,'0')}</div><div><b>Ponto ${i+1} <span class="mp-state ${valid?'ok':'warn'}">${valid?'VALIDADO':'PENDENTE'}</span></b><small>${valid?rawCds(p):tpCds(p)+' • Z provisório para TP/NC'}</small></div><div class="mp-row-actions"><button type="button" data-copy="${i}" title="${valid?'Copiar CDS validada':'Copiar CDS provisória para TPCDS'}">⧉</button><button type="button" data-del="${i}" title="Remover">×</button></div></div>`;}).join('');
    qsa('.mp-point-row',box).forEach(r=>r.onclick=e=>{if(e.target.dataset.copy!==undefined||e.target.dataset.del!==undefined)return;const i=Number(r.dataset.pidx);selectPoint(i+1);state.map?.setView(ll(m.points[i].x,m.points[i].y),5);});
    qsa('[data-copy]',box).forEach(b=>b.onclick=async e=>{e.stopPropagation();const p=m.points[Number(b.dataset.copy)];await copyText(isValidated(p)?rawCds(p):tpCds(p));b.textContent='✓';setTimeout(()=>b.textContent='⧉',800);});
    qsa('[data-del]',box).forEach(b=>b.onclick=e=>{e.stopPropagation();if(!requireEdit())return;m.points.splice(Number(b.dataset.del),1);commit('Ponto removido');});
  }
  /* depois de mover um ponto: abre a validação com o campo de CDS pronto */
  function goValidate(){try{setPlannerTab('validacao');setTimeout(()=>qs('#mpValidateCds')?.focus(),60);}catch(e){}}
  function selectPoint(id){
    const m=active(),
p=m?.points[id-1],
box=qs('#mpValidationTarget');
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
  function renderCenterValidation(){ensureCenterValidationUi();const m=active(),
el=qs('#mpCenterValidationStatus');if(!m||!el)return;el.innerHTML=isCenterValidated(m)?`<b>CENTRO VALIDADO ✓</b><br>${rawCds(m.center)}`:(validCoord(m.center.x)&&validCoord(m.center.y)?`<b>CENTRO PENDENTE</b><br>${f(m.center.x)},${f(m.center.y)},0.00,0.00 • copie o TP, vá ao local e cole a CDS real.`:'Marque o centro no mapa para iniciar a validação.');}
  function validateCenter(){if(!requireEdit())return;
    const m=active();if(!m)return;const r=parseCds(qs('#mpCenterRealCds')?.value);
    if(!r.ok){alert('CDS do centro nao reconhecida. '+r.motivo);return;}
    const probsC=cdsProblemas(r);
    if(probsC.length){alert('CDS do centro incompleta:\n\n'+probsC.join('\n'));return;}
    const x=r.x,
y=r.y,
z=r.z,
h=r.h===null?0:r.h;
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
    qs('#mpUseRecommendedRadius')?.addEventListener('click',()=>{if(!requireEdit())return;const m=active(),
s=coverageStats(m);if(!m||!s)return;applyRadius(s.recommended);});
    qs('#mpFitZone')?.addEventListener('click',fitZone);
    qs('#mpGenerateInsideZone')?.addEventListener('click',generateInsideZone);
  }
  function renderCoverage(){
    ensureCoverageUi();ensureSafeRouteUi();const m=active(),
el=qs('#mpCoverageStatus'),
title=qs('#mpCoverageTitle'),
inp=qs('#mpEventRadius'),
btn=qs('#mpUseRecommendedRadius');if(!m||!el)return;
    const category=m.category||'dominacao',
used=effectiveEventRadius(m),
s=coverageStats(m),
counts=zoneCoverageCounts(m);
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
    ['mpRadiusMinus50',
'mpRadiusPlus50',
'mpRadiusMinus100',
'mpRadiusPlus100'].forEach(id=>{const b=qs('#'+id);if(b)b.disabled=!state.editing;});
  }

  function fitZone(){
    const m=active();if(!state.map||!m||!validCoord(m.center?.x)||!validCoord(m.center?.y))return;
    const r=effectiveEventRadius(m);if(r<=0)return;
    const temp=L.circle(ll(m.center.x,m.center.y),{radius:r});state.map.fitBounds(temp.getBounds(),{padding:[35,
35]});
  }
  function generateInsideZone(){
    if(!requireEdit())return;const m=active();if(!m||!validCoord(m.center?.x)||!validCoord(m.center?.y)){alert('Defina primeiro o centro da zona.');return;}
    const zoneRadius=effectiveEventRadius(m),
qty=Math.max(2,Number(qs('#mpQty')?.value)||m.points.length||25),
spawnRing=Math.max(50,Math.floor((zoneRadius*.80)/50)*50);
    if(!confirm(`Gerar ${qty} spawns distribuídos a aproximadamente 80% do raio da zona (${spawnRing} m)?

Os pontos atuais serão substituídos e ficarão PENDENTES até validação no FiveM.`))return;
    if(qs('#mpCircleRadius'))qs('#mpCircleRadius').value=spawnRing;m.circleRadius=spawnRing;
    if(qs('#mpQty'))qs('#mpQty').value=qty;
    generateCircle();renderCoverage();fitZone();
  }

  function analyze(){
    const m=active();if(!m)return;let min=Infinity,
pair=null,
over=0;
    for(let i=0;i<m.points.length;i++)for(let j=i+1;j<m.points.length;j++){const d=Math.hypot(m.points[i].x-m.points[j].x,m.points[i].y-m.points[j].y);if(d<min){min=d;pair=[i+1,
j+1];}if(d<(Number(m.spawnRadius)||100)*2)over++;}
    if(qs('#mpCount'))qs('#mpCount').textContent=m.points.length;
    if(qs('#mpValidCount'))qs('#mpValidCount').textContent=m.points.filter(isValidated).length;
    if(qs('#mpPendingCount'))qs('#mpPendingCount').textContent=m.points.filter(p=>!isValidated(p)).length;
    if(qs('#mpOverlap'))qs('#mpOverlap').textContent=over;
    if(qs('#mpNearest'))qs('#mpNearest').textContent=pair?`${pair[0]} ↔ ${pair[1]} • ${min.toFixed(1)} m`:'—';
  }
  function rawCds(p){return `${f(p.x)},${f(p.y)},${f(p.z)},${f(p.h)}`;}
  function tpCds(p){const z=Number.isFinite(Number(p?.z))?Number(p.z):0;const h=Number.isFinite(Number(p?.h))?Number(p.h):0;return `${f(p.x)},${f(p.y)},${f(z)},${f(h)}`;}
  function updateExport(){const m=active(),
out=qs('#mpExport');if(out&&m)out.value=m.points.filter(isValidated).map((p,i)=>`${p.id||i+1} - ${rawCds(p)}`).join('\n');}
  function render(){adoptStrayCards();ensureSafeRouteUi();adoptStrayCards();renderMissionList();renderPointList();renderMap();analyze();updateExport();syncForm();renderCenterValidation();renderCoverage();renderPlannerBadges();renderWorkspaceBar();renderBackupList();syncEventKind();renderRequestStatus();const rt=qs('#mpRequestText'),
m=active();if(rt&&document.activeElement!==rt)rt.value=m?.requestText||'';loadSnapshotPreview();}

  function syncForm(){
    const m=active();if(!m)return;
    const vals={mpMissionName:m.name,
mpEventCategory:m.category||'dominacao',
mpEventType:m.event,
mpPanel:m.panel,
mpMode:m.mode,
mpRequestKind:m.requestKind||'alter-zone',
mpCenterLabel:m.center.label||'Coordenada central',
mpCenterX:m.center.x??'',
mpCenterY:m.center.y??'',
mpCenterZ:m.center.z??'',
mpCenterH:m.center.h??'',
mpCircleRadius:m.circleRadius||1000,
mpStartAngle:m.startAngle||0,
mpRadius:m.spawnRadius||100,
mpEventRadius:m.eventRadius||''};
    Object.entries(vals).forEach(([id,
v])=>{const el=qs('#'+id);if(el&&document.activeElement!==el)el.value=v;});
    if(qs('#mpRadiusValue'))qs('#mpRadiusValue').textContent=`${m.spawnRadius||100} m`;
    const assist=m.mode==='assistant';qs('#mpModeHint')&&(qs('#mpModeHint').textContent=assist?'ASSISTENTE: todo ponto novo começa PENDENTE (vermelho), recebe Z provisório 0.00 para TPCDS/NC e só fica verde após validação com a CDS real.':'MANUAL: CDS completa e não-zero pode ser adicionada já como validada.');
  }

  function commit(reason='Alteração'){
    const m=active();if(!m)return;m.updatedAt=nowIso();
    if(state.editing){state.dirty=true;render();setSaveState(`${reason} • NÃO SALVO`);return;}
    saveStore();render();setSaveState(`${reason} • salvo`);queueSnapshot();
  }
  function requireEdit(){if(state.editing)return true;alert('Zona travada em modo visualização. Clique em EDITAR ZONA para fazer alterações.');return false;}
  function startEdit(){const m=active();if(!m||state.editing)return;state.editBackup={eventId:m.eventId,
zones:JSON.parse(JSON.stringify(zonesOfEvent(m.eventId)))};state.editing=true;state.dirty=false;state.placing=false;render();updateEditUi();setSaveState('MODO EDIÇÃO • alterações ainda não salvas');}
  function saveMission(){const m=active();if(!m)return;if(!state.editing){setSaveState('Nenhuma alteração para salvar');return;}m.updatedAt=nowIso();saveStore();state.editBackup=null;state.editing=false;state.dirty=false;state.placing=false;render();updateEditUi();setSaveState('Zona salva ✓');queueSnapshot();}
  function cancelEdit(){if(!state.editing)return;if(state.editBackup?.eventId&&Array.isArray(state.editBackup.zones)){const eid=state.editBackup.eventId;const keep=state.missions.filter(x=>x.eventId!==eid);state.missions=[...state.editBackup.zones,
...keep];}state.editBackup=null;state.editing=false;state.dirty=false;state.placing=false;state.activeEventId=active()?.eventId||state.activeEventId;render();updateEditUi();setSaveState('Alterações descartadas • visualização');}
  function updateEditUi(){
    const edit=state.editing;const eb=qs('#mpEditMission'),
sb=qs('#mpSaveMission'),
cb=qs('#mpCancelEdit');
    if(eb)eb.style.display=edit?'none':'';if(sb)sb.style.display=edit?'':'none';if(cb)cb.style.display=edit?'':'none';
    qsa('#page-planejador input:not(#mpRequestText),#page-planejador select,#page-planejador textarea:not(#mpRequestText):not(#mpExport)').forEach(el=>{if(!['mpValidateCds',
'mpCenterRealCds',
'mpCloneTarget'].includes(el.id))el.disabled=!edit;});
    ['mpSafeUseCenter','mpSafePlace2','mpSafePlace3','mpSafeClearOptions','mpPlaceBtn',
'mpGenerateCircle',
'mpImport',
'mpAddCoord',
'mpClear',
'mpValidateBtn',
'mpValidateCenter',
'mpEventRadius',
'mpRadiusMinus50',
'mpRadiusPlus50',
'mpRadiusMinus100',
'mpRadiusPlus100',
'mpUseRecommendedRadius',
'mpGenerateInsideZone'].forEach(id=>{const el=qs('#'+id);if(el)el.disabled=!edit;});
    if(qs('#missionPlannerMap'))qs('#missionPlannerMap').classList.toggle('mp-editing',edit);
    syncEventKind();
  }
  function setSaveState(t){if(qs('#mpSaveState'))qs('#mpSaveState').textContent=t;}
  function queueSnapshot(){clearTimeout(state.snapshotTimer);state.snapshotTimer=setTimeout(()=>captureSnapshot(false),1100);}
  async function captureSnapshot(download=false){
    const m=active(),
el=qs('#missionPlannerMap');if(!m||!el)return;
    try{
      if(typeof html2canvas==='undefined')throw new Error('html2canvas indisponível');
      const canvas=await html2canvas(el,{useCORS:true,
allowTaint:false,
backgroundColor:'#10151f',
logging:false,
scale:1});
      const max=1400,
ratio=Math.min(1,max/canvas.width);let out=canvas;
      if(ratio<1){out=document.createElement('canvas');out.width=Math.round(canvas.width*ratio);out.height=Math.round(canvas.height*ratio);out.getContext('2d').drawImage(canvas,0,0,out.width,out.height);}
      const dataUrl=out.toDataURL('image/jpeg',0.78);await saveSnapshot(m.id,dataUrl);await loadSnapshotPreview();setSaveState('Missão e print do mapa salvos');
      if(download){const a=document.createElement('a');a.href=dataUrl;a.download=`${safeName(m.name)}-mapa.jpg`;a.click();}
    }catch(e){console.warn(e);if(download)alert('Não foi possível gerar o print do mapa. Aguarde o mapa terminar de carregar e tente novamente.');}
  }
  async function loadSnapshotPreview(){const m=active(),
img=qs('#mpSnapshotPreview');if(!m||!img)return;const s=await getSnapshot(m.id);if(s?.dataUrl){img.src=s.dataUrl;img.classList.add('show');if(qs('#mpSnapshotEmpty'))qs('#mpSnapshotEmpty').style.display='none';}else{img.removeAttribute('src');img.classList.remove('show');if(qs('#mpSnapshotEmpty'))qs('#mpSnapshotEmpty').style.display='block';}}
  const safeName=s=>String(s||'missao').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase();

  function fit(){const m=active();if(!state.map||!m)return;const arr=m.points.map(p=>ll(p.x,p.y));if(validCoord(m.center.x)&&validCoord(m.center.y))arr.push(ll(m.center.x,m.center.y));if(arr.length)state.map.fitBounds(L.latLngBounds(arr).pad(.12));}
  function generateCircle(){if(!requireEdit())return;
    const m=active();if(!m)return;const cx=num(qs('#mpCenterX')?.value),
cy=num(qs('#mpCenterY')?.value),
qty=Math.max(2,Number(qs('#mpQty')?.value)||2),
r=Math.max(1,Number(qs('#mpCircleRadius')?.value)||1000),
start=Number(qs('#mpStartAngle')?.value)||0;
    if(cx===null||cy===null){alert('Defina a coordenada central no mapa ou informe X e Y.');return;}
    if(Number(m.center.x)!==cx||Number(m.center.y)!==cy){m.center.z=0;m.center.h=0;m.center.status='planned';m.center.validatedAt=null;m.center.validationReason='coordinate-change';}m.center.x=cx;m.center.y=cy;m.circleRadius=r;m.startAngle=start;m.points=[];
    for(let i=0;i<qty;i++){const deg=start+(360/qty)*i,
a=deg*Math.PI/180;m.points.push(normalizePoint({x:cx+Math.sin(a)*r,
y:cy+Math.cos(a)*r,
z:0,
h:(deg+180)%360,
status:'planned'},i));}
    commit(`${qty} pontos gerados como PENDENTES`);fit();
  }
  function parseBulk(text){const out=[];String(text||'').split(/\n+/).forEach(line=>{const c=line.replace(/^\s*\d+\s*[-–—:)]\s*/,'').trim();if(!c)return;const r=parseCds(c);if(!r.ok)return;out.push({x:r.x,
y:r.y,
z:r.z,
h:r.h});});return out;}
  function importBulk(){if(!requireEdit())return;
    const m=active(),
arr=parseBulk(qs('#mpBulk')?.value);if(!m||!arr.length){alert('Nenhuma coordenada válida encontrada.');return;}
    const manual=m.mode==='manual';arr.forEach(v=>{const can=manual&&validCoord(v.x)&&validCoord(v.y)&&validCoord(v.z)&&Number.isFinite(v.h);m.points.push(normalizePoint({...v,
status:can?'validated':'planned',
validatedAt:can?nowIso():null},m.points.length));});commit(`Importadas ${arr.length} CDS`);fit();
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
      qs('#mpForceValidate')?.addEventListener('click',()=>validateSelected({forcar:true,
avancar:opts.avancar}));
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
    const m=active(),
id=m?.selectedId,
p=id?m.points[id-1]:null;
    if(!p){setValidationFeedback('Selecione um ponto na lista.','erro');return;}
    p.status='planned';p.z=0;p.validatedAt=null;p.validationReason='manual-reset';
    commit(`Ponto ${id} voltou para PENDENTE`);
    setValidationFeedback(`<b>Ponto ${id} voltou para pendente</b><span>Z zerado para permitir TPCDS + NC.</span>`,'alerta');
  }
  async function copySelectedTp(){
    const m=active(),
id=m?.selectedId,
p=id?m.points[id-1]:null;
    if(!p){setValidationFeedback('Selecione um ponto na lista.','erro');return;}
    await copyText(`${f(p.x)},${f(p.y)},0.00,${Number.isFinite(Number(p.h))?f(p.h):'0.00'}`);
    setValidationFeedback(`<b>TP do ponto ${id} copiado</b><span>Va ate o local no jogo e cole a CDS real aqui.</span>`,'ok');
  }
  function addManual(){if(!requireEdit())return;
    const m=active();if(!m)return;const x=num(qs('#mpX')?.value),
y=num(qs('#mpY')?.value),
z=num(qs('#mpZ')?.value),
h=num(qs('#mpH')?.value);if(x===null||y===null){alert('Informe X e Y válidos.');return;}
    const can=m.mode==='manual'&&validCoord(x)&&validCoord(y)&&validCoord(z)&&h!==null;m.points.push(normalizePoint({x,
y,
z,
h,
status:can?'validated':'planned',
validatedAt:can?nowIso():null},m.points.length));commit(can?'Ponto manual validado':'Ponto manual adicionado como PENDENTE');
  }
  function createEvent(){
    if(state.editing&&state.dirty&&!confirm('Descartar alterações não salvas e criar um novo evento?'))return;
    if(state.editing)cancelEdit();
    const m=newMission(null,null,state.libraryCategory||'dominacao');
    m.name='Zona Principal';m.requestKind='create-event';
    state.missions.unshift(m);state.activeId=m.id;state.activeEventId=m.eventId;saveStore();setWorkspace(true);render();startEdit();state.map?.setView(ll(900,-600),3);setSaveState('Novo evento criado • configure a Zona Principal e clique SALVAR EVENTO');
  }
  function createZone(){
    if(state.editing&&state.dirty&&!confirm('Descartar alterações não salvas e criar uma nova zona?'))return;
    if(state.editing)cancelEdit();
    const base=active(),
eid=activeEventId();
    if(!eid||!base){alert('Selecione primeiro um evento.');return;}
    const m=newMission(eid,base.event,base.category);
    m.name=`Nova Zona ${zonesOfEvent(eid).length+1}`;m.panel=base.panel||defaultPanel();if(base.eventType)m.eventType=base.eventType;m.mode=base.mode;m.requestKind='create-zone';m.eventRadius=base.eventRadius||null;m.circleRadius=base.circleRadius||1000;m.spawnRadius=base.spawnRadius||100;
    state.missions.unshift(m);state.activeId=m.id;state.activeEventId=eid;saveStore();setWorkspace(true);render();startEdit();setSaveState('Nova zona criada • defina centro, raio e spawns');
  }
  function syncMapRegion(m){
    if(!state.map||!m)return;
    const pts=[m.center,
...(m.points||[])].filter(p=>validCoord(p?.x)&&validCoord(p?.y));
    const isCayo=/cayo\s*perico/i.test(`${m.name||''} ${m.event||''}`)||pts.some(p=>Number(p.x)>3800&&Number(p.y)<-3800);
    const overlays=[state.cayoLayer,
state.cayoPostalLayer].filter(Boolean);
    if(isCayo){
      if(state.cayoLayer&&!state.map.hasLayer(state.cayoLayer)&&!state.map.hasLayer(state.cayoPostalLayer))state.cayoLayer.addTo(state.map);
    }else overlays.forEach(l=>{if(state.map.hasLayer(l))state.map.removeLayer(l);});
  }
  function focusActiveMission(scrollToMap=false){
    const m=active();if(!state.map||!m)return;syncMapRegion(m);
    const run=()=>{state.map.invalidateSize();const arr=(m.points||[]).filter(p=>validCoord(p.x)&&validCoord(p.y)).map(p=>ll(p.x,p.y));if(validCoord(m.center?.x)&&validCoord(m.center?.y))arr.push(ll(m.center.x,m.center.y));if(arr.length>1)state.map.fitBounds(L.latLngBounds(arr).pad(.12),{animate:true,
duration:.45,
maxZoom:5});else if(arr.length===1)state.map.setView(arr[0],5,{animate:true});};
    setTimeout(run,70);setTimeout(run,260);
    if(scrollToMap){const el=qs('#missionPlannerMap')?.closest('.mission-planner-mapwrap')||qs('#missionPlannerMap');if(el)setTimeout(()=>el.scrollIntoView({behavior:'smooth',
block:'center'}),40);}
  }
  function switchEvent(eventId){
    if(state.editing&&state.dirty&&!confirm('Existem alterações não salvas. Deseja descartá-las?'))return;
    if(state.editing)cancelEdit();
    const zones=zonesOfEvent(eventId);if(!zones.length)return;
    state.activeEventId=eventId;state.activeId=zones[0].id;state.libraryCategory=zones[0].category||state.libraryCategory;saveStore();render();updateEditUi();focusActiveMission(false);
  }
  function switchMission(id){if(state.editing&&state.dirty&&!confirm('Existem alterações não salvas. Deseja descartá-las?'))return;if(state.editing)cancelEdit();state.activeId=id;const m=state.missions.find(m=>m.id===id);state.activeEventId=m?.eventId||state.activeEventId;state.libraryCategory=(m?.category||state.libraryCategory||'dominacao');saveStore();setWorkspace(true);render();updateEditUi();focusActiveMission(true);}
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
    if(category==='dominacao')return {title:'DOMINAÇÃO',
needsSafe:false,
notes:['Área de disputa fixa',
'Spawns podem ficar dentro ou fora do raio',
'Sem fechamento progressivo de gás']};
    if(fac)return {title:'FAC X FAC',
needsSafe:true,
notes:['Safe inicial obrigatória cobrindo todos os spawns',
'Fechamento progressivo do gás',
'Spawn individual por organização',
'Loot/caixas e drop ao morrer conforme padrão Fac x Fac',
'Ranking e regras próprias preservados']};
    return {title:'ZONA DE GÁS',
needsSafe:true,
notes:['Safe inicial obrigatória cobrindo todos os spawns',
'Fechamento progressivo do gás',
'Regras específicas do evento de destino preservadas']};
  }
  function openReplicator(){
    const src=active();if(!src)return;if(state.editing&&state.dirty){alert('Salve ou cancele as alterações antes de replicar.');return;}
    let modal=qs('#mpReplicateModal');if(modal)modal.remove();modal=document.createElement('div');modal.id='mpReplicateModal';modal.className='mp-replicate-backdrop';
    const eventOptions=(cat)=>eventsOfCategory(cat).map(e=>`<option value="${esc(e.id)}">${esc(e.name)}</option>`).join('');
    modal.innerHTML=`<div class="mp-replicate-modal"><div class="mp-replicate-head"><div><b>REPLICAR / CONVERTER ZONA</b><small>A geografia vem da zona de origem; a lógica é adaptada ao evento de destino.</small></div><button id="mpRepClose">×</button></div><div class="mp-replicate-origin"><span>ORIGEM</span><b>${esc(src.event)} → ${esc(src.name)}</b><small>${src.points?.length||0} spawns • original será preservado</small></div><div class="mp-replicate-grid"><label>Tipo de destino<select id="mpRepCat"><option value="dominacao">DOMINAÇÃO</option><option value="gas">ZONA DE GÁS</option></select></label><label>Evento de destino<select id="mpRepEvent"></select></label><label>Nome da nova zona<input id="mpRepName" value="${esc(src.name||'Zona replicada')}"></label><label id="mpRepRadiusWrap">Raio inicial da Safe (m)<input id="mpRepRadius" type="number" min="50" step="10" value="${Math.round(effectiveEventRadius(src)||1000)}"></label></div><div id="mpRepStatus" class="mp-replicate-status"></div><div class="mp-replicate-actions"><button id="mpRepCancel">CANCELAR</button><button id="mpRepCreate" class="primary">CRIAR CÓPIA ADAPTADA</button></div></div>`;
    document.body.appendChild(modal);
    const cat=qs('#mpRepCat',modal),
ev=qs('#mpRepEvent',modal),
rad=qs('#mpRepRadius',modal),
status=qs('#mpRepStatus',modal),
create=qs('#mpRepCreate',modal);
    function refreshEvents(){const es=eventsOfCategory(cat.value);ev.innerHTML=eventOptions(cat.value)+`<option value="__new__">+ Criar novo evento…</option>`;if(!es.length)ev.value='__new__';validate();}
    function validate(){const targetCat=cat.value;const targetEvent=ev.value==='__new__'?'Novo Evento':(eventsOfCategory(targetCat).find(x=>x.id===ev.value)?.name||'Evento');const prof=eventProfiles(targetCat,targetEvent);const r=Math.max(0,Number(rad.value)||0);let outside=0,
max=0;if(prof.needsSafe&&validCoord(src.center?.x)&&validCoord(src.center?.y)){(src.points||[]).forEach(p=>{const d=pointDistanceFromCenter(src,p);max=Math.max(max,d);if(d>r)outside++;});}const ok=!prof.needsSafe||outside===0;qs('#mpRepRadiusWrap',modal).style.display=prof.needsSafe?'grid':'none';status.innerHTML=`<b>${prof.title}</b>${prof.notes.map(n=>`<span>✓ ${n}</span>`).join('')}${prof.needsSafe?`<span class="${ok?'ok':'bad'}">${ok?'✓':'⚠'} ${(src.points||[]).length-outside}/${(src.points||[]).length} spawns dentro da safe${outside?` • ${outside} fora • mínimo aproximado ${Math.ceil(max)} m`:''}</span>`:''}`;create.disabled=!ok;}
    function close(){modal.remove();}
    cat.onchange=refreshEvents;ev.onchange=validate;rad.oninput=validate;qs('#mpRepClose',modal).onclick=close;qs('#mpRepCancel',modal).onclick=close;
    create.onclick=()=>{let targetCat=cat.value,
targetEventId=ev.value,
targetEventName;if(targetEventId==='__new__'){targetEventName=prompt('Nome do novo evento:','Novo Evento');if(!targetEventName)return;targetEventId=eventUid();}else targetEventName=eventsOfCategory(targetCat).find(x=>x.id===targetEventId)?.name||'Evento';const c=JSON.parse(JSON.stringify(src));c.id=uid();c.eventId=targetEventId;c.event=targetEventName;c.name=qs('#mpRepName',modal).value.trim()||`${src.name} — Cópia`;c.category=targetCat;c.official=false;delete c.request;delete c.requestLog;delete c.partidas;{const ref=zonesOfEvent(targetEventId)[0];if(ref?.eventType)c.eventType=ref.eventType;else delete c.eventType;}c.createdAt=nowIso();c.updatedAt=nowIso();c.requestText='';c.requestKind=zonesOfEvent(targetEventId).length?'create-zone':'create-event';delete c.facxfacScenarios;delete c.activeScenario;delete c.mapName;c.center.label=targetCat==='gas'?'Centro do Gás / Marco Zero':'Centro da Zona do Evento';if(targetCat==='gas')c.eventRadius=Math.max(50,Number(rad.value)||1000);else c.eventRadius=null;state.missions.unshift(c);state.activeId=c.id;state.activeEventId=c.eventId;state.libraryCategory=targetCat;saveStore();close();render();startEdit();setSaveState('Zona replicada e adaptada • revise e gere a solicitação');focusActiveMission(false);};
    refreshEvents();
  }
  function cloneZone(){
    const m=active();if(!m)return;if(state.editing&&state.dirty){alert('Salve ou cancele as alterações antes de clonar.');return;}
    const c=JSON.parse(JSON.stringify(m));c.id=uid();c.name=`${m.name} — Cópia`;c.official=false;delete c.request;delete c.requestLog;delete c.partidas;c.createdAt=nowIso();c.updatedAt=nowIso();c.requestText='';c.requestKind='create-zone';
    state.missions.unshift(c);state.activeId=c.id;state.activeEventId=c.eventId;saveStore();render();startEdit();setSaveState('Zona clonada • evento original preservado');
  }
  function cloneEventTo(targetCategory){
    const m=active();if(!m)return;if(state.editing&&state.dirty){alert('Salve ou cancele as alterações antes de clonar.');return;}
    const source=zonesOfEvent(m.eventId);const newEventId=eventUid();const newName=`${m.event} — Clone ${targetCategory==='gas'?'Gás':'Dominação'}`;
    const clones=source.map((z,idx)=>{const c=JSON.parse(JSON.stringify(z));c.id=uid();c.eventId=newEventId;c.event=newName;c.category=targetCategory;c.official=false;delete c.request;delete c.requestLog;delete c.partidas;if(eventTypeOf(c).category!==targetCategory)delete c.eventType;c.createdAt=nowIso();c.updatedAt=nowIso();c.requestText='';c.requestKind=idx===0?'create-event':'create-zone';c.center.label=targetCategory==='gas'?'Centro do Gás / Marco Zero':'Centro da Zona do Evento';if(c.center&&validCoord(c.center.x)&&validCoord(c.center.y)&&validCoord(c.center.z)&&Number.isFinite(Number(c.center.h))){c.center.status='validated';c.center.validatedAt=c.center.validatedAt||nowIso();delete c.center.validationReason;}return c;});
    state.missions.unshift(...clones);state.activeId=clones[0].id;state.activeEventId=newEventId;state.libraryCategory=targetCategory;saveStore();render();startEdit();setSaveState(`Evento clonado com ${clones.length} zona(s) • original preservado`);
  }
  function duplicateMission(){
    const target=qs('#mpCloneTarget')?.value||state.libraryCategory||'dominacao';
    cloneEventTo(target);
  }
  function clearPoints(){if(!requireEdit())return;const m=active();if(!m||!confirm('Limpar todos os pontos desta missão?'))return;m.points=[];m.selectedId=null;commit('Pontos removidos');}
  async function copyText(text){try{await navigator.clipboard.writeText(text);return true;}catch{}const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');}catch{}ta.remove();return true;}
  async function exportValidated(){const m=active(),
v=m?.points.filter(isValidated)||[];if(!v.length){alert('Nenhum ponto validado para exportar.');return;}const txt=v.map((p,i)=>`${p.id||i+1} - ${rawCds(p)}`).join('\n');if(qs('#mpExport'))qs('#mpExport').value=txt;await copyText(txt);}
  async function exportXY(){const m=active();if(!m?.points.length)return;await copyText(m.points.map((p,i)=>`${i+1} - ${isValidated(p)?rawCds(p):tpCds(p)}`).join('\n'));}
  /* ---------------------------------------------------------------
     V12.8 — PAINEL /EVENTO
     O jogador escolhe EVENTO > ZONA no /evento. O Planejador passa a
     espelhar isso: tipo de evento com mecânica própria (catálogo em
     modules/eventos-painel.js), ciclo da solicitação por zona
     (rascunho → pronta → aguardando cidade → no /evento) e pacote
     único de solicitação para o evento inteiro.
  --------------------------------------------------------------- */
  const CATALOG=()=>window.HighEventCatalog||null;
  function eventTypeOf(m){
    const c=CATALOG();if(c)return c.tipoDe(m);
    const gas=(m?.category||'dominacao')==='gas';
    return {id:gas?'outro-gas':'outro-dominacao',label:gas?'ZONA DE GÁS':'DOMINAÇÃO',category:gas?'gas':'dominacao',gas,mechanic:[],notes:[]};
  }
  function defaultPanel(){return CATALOG()?.PANEL_PADRAO||'/evento';}
  function cloudUser(){try{return window.HighOSMissionCloud?.user?.()||'';}catch(e){return '';}}
  function canMarkRequests(){try{const c=window.HighOSMissionCloud;return !c?.canEdit||!!c.canEdit();}catch(e){return true;}}
  function hashText(s){let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return (h>>>0).toString(36);}
  /* Impressão digital da geografia: o que a cidade precisa aplicar.
     A rota da safe só entra quando realmente configurada, para que a
     criação automática dos valores padrão não marque a zona como alterada. */
  function safeParts(m){
    const parts=[],sr=m?.safeRoute;
    if((m?.category||'dominacao')==='gas'&&sr&&((sr.stage2Options||[]).length||(sr.stage3Options||[]).length)){
      (sr.stages||[]).forEach(s=>parts.push(`${f(s.x)},${f(s.y)},${Math.round(Number(s.radius)||0)},${Number(s.damage)||0},${Number(s.closeSeconds)||0},${Number(s.moveSeconds)||0}`));
      (sr.stage2Options||[]).forEach(p=>parts.push(`s2:${f(p.x)},${f(p.y)}`));
      (sr.stage3Options||[]).forEach(p=>parts.push(`s3:${f(p.x)},${f(p.y)}`));
    }
    return parts;
  }
  function geomHash(m){
    const c=m?.center||{};
    const parts=[f(c.x),f(c.y),f(c.z),f(c.h),Math.round(effectiveEventRadius(m)),...(m?.points||[]).map(p=>`${f(p.x)},${f(p.y)},${f(p.z)},${f(p.h)}`),...safeParts(m)];
    return hashText(parts.join('|'));
  }

  /* V12.9 — cópia compacta da geografia no momento do envio/aplicação.
     Permite mostrar O QUE mudou (não só que mudou) e escrever isso na
     solicitação de alteração para a cidade. */
  const r2=v=>{const n=Number(v);return Number.isFinite(n)?Math.round(n*100)/100:0;};
  function geomSnap(m){
    const c=m?.center||{};
    return {c:[c.x,c.y,c.z,c.h].map(r2),r:Math.round(effectiveEventRadius(m)),pts:(m?.points||[]).map(p=>[p.x,p.y,p.z,p.h].map(r2)),safe:hashText(safeParts(m).join('|'))};
  }
  function gameGeom(m){const r=m?.request;if(!r)return null;if(r.status==='applied')return r.geom||null;if(r.status==='sent')return r.prev?.geom||null;return null;}
  function geomDiff(old,m){
    if(!old||!Array.isArray(old.c))return null;
    const now=geomSnap(m),out=[],d2=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]),cds=a=>a.map(f).join(','),nn=i=>String(i+1).padStart(2,'0');
    const dc=d2(old.c,now.c);
    if(dc>=0.5)out.push(`Centro deslocado ${dc.toFixed(1)} m (antes: ${cds(old.c)} • agora: ${cds(now.c)}).`);
    else if(Math.abs(old.c[2]-now.c[2])>=0.5||Math.abs(old.c[3]-now.c[3])>=1)out.push(`Centro com altura/heading ajustados (antes: ${cds(old.c)} • agora: ${cds(now.c)}).`);
    if(old.r!==now.r)out.push(`Raio: ${old.r} m → ${now.r} m.`);
    const moved=[],added=[],removed=[],op=old.pts||[];
    for(let i=0;i<Math.max(op.length,now.pts.length);i++){
      const a=op[i],b=now.pts[i];
      if(a&&!b)removed.push(i);else if(!a&&b)added.push(i);
      else if(d2(a,b)>=0.5||Math.abs(a[2]-b[2])>=0.5||Math.abs(a[3]-b[3])>=1)moved.push({i,d:d2(a,b),b});
    }
    if(moved.length&&moved.length<=8)moved.forEach(o=>out.push(`Spawn ${nn(o.i)} ${o.d>=0.5?`reposicionado ${o.d.toFixed(1)} m`:'com altura/heading ajustados'} → nova CDS: ${cds(o.b)}.`));
    else if(moved.length)out.push(`${moved.length} spawns reposicionados (${moved.map(o=>nn(o.i)).join(', ')}) — utilizar a lista completa de spawns abaixo.`);
    if(added.length)out.push(`Spawn${added.length>1?'s':''} novo${added.length>1?'s':''}: ${added.map(nn).join(', ')}.`);
    if(removed.length)out.push(`Spawn${removed.length>1?'s':''} removido${removed.length>1?'s':''}: ${removed.map(nn).join(', ')} — a zona passa a ter ${now.pts.length} spawns.`);
    if(old.safe&&old.safe!==now.safe)out.push('Movimentação da safe alterada (ver bloco MOVIMENTAÇÃO DA SAFE).');
    return out;
  }
  function diffText(m){
    const lines=geomDiff(gameGeom(m),m);
    return lines&&lines.length?`ALTERAÇÕES EM RELAÇÃO À VERSÃO ATUAL NO JOGO:

${lines.map(l=>`- ${l}`).join('\n')}

`:'';
  }

  /* Capacidade: 1 spawn por organização. No /evento o jogador escolhe a
     zona depois de escalar, então todas as zonas precisam comportar o
     mesmo número de facções. */
  function zoneCapacity(m){return (m?.points||[]).filter(isValidated).length;}
  function eventCapacities(eventId){return zonesOfEvent(eventId).map(z=>({z,cap:zoneCapacity(z)})).filter(o=>o.cap>0);}
  function capacityWarning(eventId){
    const caps=eventCapacities(eventId);if(caps.length<2)return '';
    const min=Math.min(...caps.map(o=>o.cap)),max=Math.max(...caps.map(o=>o.cap));
    if(min===max)return '';
    return `Capacidade desigual: ${caps.map(o=>`${o.z.name||'Zona'} ${o.cap}`).join(' · ')} — acima de ${min} facções inscritas não cabe em todas as zonas`;
  }

  /* Equilíbrio dos spawns (aviso, nunca bloqueia nem mexe em CDS):
     ninguém muito mais perto do centro que os demais e nenhum par
     colado em comparação com o espaçamento típico da zona. */
  function zoneBalance(m){
    const pts=(m?.points||[]).map((p,i)=>({p,n:i+1})).filter(o=>validCoord(o.p.x)&&validCoord(o.p.y));
    if(pts.length<3)return null;
    const res={tight:[],near:[],far:[],spacing:0,mean:0};
    const nearest=pts.map(a=>{let d=Infinity,who=null;pts.forEach(b=>{if(b===a)return;const x=distXY(a.p,b.p);if(x<d){d=x;who=b.n;}});return {n:a.n,d,who};});
    const sorted=nearest.map(o=>o.d).sort((a,b)=>a-b);res.spacing=sorted[Math.floor(sorted.length/2)];
    const seen=new Set();
    nearest.forEach(o=>{const k=[o.n,o.who].sort((a,b)=>a-b).join('-');if(o.d<res.spacing*.4&&!seen.has(k)){seen.add(k);res.tight.push({a:Math.min(o.n,o.who),b:Math.max(o.n,o.who),d:o.d});}});
    if(validCoord(m.center?.x)&&validCoord(m.center?.y)){
      const ds=pts.map(o=>({n:o.n,d:distXY(m.center,o.p)}));
      res.mean=ds.reduce((s,o)=>s+o.d,0)/ds.length;
      if(res.mean>0){ds.forEach(o=>{if(o.d<res.mean*.6)res.near.push(o);else if(o.d>res.mean*1.4)res.far.push(o);});}
    }
    return res;
  }
  const pad2=n=>String(n).padStart(2,'0');

  /* V12.11 — meta de spawns: quantas facções o evento precisa comportar.
     Padrão = facções com Group ATIVO no High OS; a equipe pode fixar
     uma meta própria por evento. */
  function faccoesAtivas(){try{const l=window.HighOSMissionCloud?.faccoesAtivas?.();return Array.isArray(l)&&l.length?l:null;}catch(e){return null;}}
  function eventTarget(eventId){
    const manual=zonesOfEvent(eventId).map(z=>Number(z.spawnTarget)).find(n=>n>0);
    if(manual)return {n:manual,fonte:'meta do evento'};
    const a=faccoesAtivas();return a?{n:a.length,fonte:'facções ativas'}:null;
  }
  function spawnShortfall(m){const t=eventTarget(m?.eventId);return t?Math.max(0,t.n-(m.points||[]).length):0;}
  function setEventTarget(eventId){
    if(!canMarkRequests()){alert('Seu acesso ao Planejador é somente leitura.');return;}
    const zs=zonesOfEvent(eventId);if(!zs.length)return;
    const atual=zs.map(z=>Number(z.spawnTarget)).find(n=>n>0)||'',ativas=faccoesAtivas(),hist=eventInsights(eventId);
    const v=prompt(`Meta de facções do evento "${zs[0].event||'Evento'}".\n\nDeixe vazio para usar as facções ativas no High OS${ativas?` (hoje: ${ativas.length})`:''}.${hist.partMax?`\nPartidas registradas: média ${hist.partMed} · pico ${hist.partMax} facções.`:''}`,atual||hist.partMax||'');
    if(v===null)return;
    const n=Math.round(Number(String(v).trim()));
    zs.forEach(z=>{if(String(v).trim()&&n>0)z.spawnTarget=n;else delete z.spawnTarget;});
    saveStore();render();renderCentralV954();
  }
  /* Novos spawns sem mexer nos existentes: candidatos na mesma faixa de
     distância do centro dos spawns atuais (equilíbrio) e, um a um, o
     candidato mais afastado de todos os spawns (preenche os vazios).
     Em evento com gás ficam sempre dentro da safe inicial. */
  function suggestSpawns(m,n,bloqueado=null,extra=[]){
    const c=m?.center;if(!validCoord(c?.x)||!validCoord(c?.y)||n<1)return [];
    const cx=Number(c.x),cy=Number(c.y),R=effectiveEventRadius(m),gas=eventTypeOf(m).gas;
    const pts=(m.points||[]).filter(p=>validCoord(p.x)&&validCoord(p.y)).map(p=>({x:Number(p.x),y:Number(p.y)}));
    let mean=pts.length?pts.reduce((s,p)=>s+Math.hypot(p.x-cx,p.y-cy),0)/pts.length:R*.8;
    if(gas)mean=Math.min(mean,R*.85);
    const band=[1,.92,1.08].map(k=>gas?Math.min(mean*k,R*.92):mean*k);
    let cand=[];for(let a=0;a<360;a+=2)band.forEach(d=>{const r=a*Math.PI/180;cand.push({x:cx+Math.sin(r)*d,y:cy+Math.cos(r)*d,deg:a});});
    if(bloqueado)cand=cand.filter(q=>!bloqueado(q));
    const out=[],all=[...pts,...extra.map(q=>({x:q.x,y:q.y}))];
    const minTo=(q,arr)=>{let md=Infinity;for(const p of arr){const d=Math.hypot(q.x-p.x,q.y-p.y);if(d<md)md=d;}return md;};
    for(let k=0;k<n;k++){
      /* empate no vão (spawns atuais uniformes): espalha os novos pelo círculo */
      let best=null,bd=-1,bn=-1;
      cand.forEach(q=>{const md=Math.round(minTo(q,all)),mn=out.length?minTo(q,out):0;if(md>bd||(md===bd&&mn>bn)){bd=md;bn=mn;best=q;}});
      if(!best)break;out.push(best);all.push(best);
    }
    return out;
  }
  /* V12.12 — terreno: água (lida dos próprios tiles do mapa) e QGs.
     A leitura usa as mesmas imagens que o mapa exibe: Atlas para Los
     Santos/condado e o overlay de satélite para Cayo Perico. */
  const TERRAIN={atlasZ:4,cayoUrl:'https://raw.githubusercontent.com/fivenet-app/livemap-tiles/main/overlays/cayo-perico/satellite.webp',
    cayo:{x0:3900,x1:5600,y0:-6000,y1:-4300},cayoSea:{x0:3450,x1:6050,y0:-6450,y1:-3850}};
  const pixelCache=new Map();
  function loadPixels(url){
    if(!pixelCache.has(url))pixelCache.set(url,new Promise(res=>{
      const img=new Image();img.crossOrigin='anonymous';
      img.onload=()=>{try{const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);res({w:c.width,h:c.height,d:ctx.getImageData(0,0,c.width,c.height).data});}catch(e){res(null);}};
      img.onerror=()=>res(null);img.src=url;
    }));
    return pixelCache.get(url);
  }
  const inBox=(x,y,b)=>x>=b.x0&&x<=b.x1&&y>=b.y0&&y<=b.y1;
  /* true = água, false = terra, null = sem leitura (mapa não carregou) */
  async function isWater(x,y){
    x=Number(x);y=Number(y);if(!Number.isFinite(x)||!Number.isFinite(y))return null;
    if(inBox(x,y,TERRAIN.cayoSea)){
      if(!inBox(x,y,TERRAIN.cayo))return true;
      const im=await loadPixels(TERRAIN.cayoUrl);if(!im)return null;
      const b=TERRAIN.cayo,u=Math.floor((x-b.x0)/(b.x1-b.x0)*(im.w-1)),v=Math.floor((b.y1-y)/(b.y1-b.y0)*(im.h-1));
      let agua=0,n=0;
      for(let dx=-2;dx<=2;dx+=2)for(let dy=-2;dy<=2;dy+=2){const uu=Math.min(im.w-1,Math.max(0,u+dx)),vv=Math.min(im.h-1,Math.max(0,v+dy)),i=(vv*im.w+uu)*4,r=im.d[i],g=im.d[i+1],bl=im.d[i+2],a=im.d[i+3];n++;if(a<100||(bl>r+40&&bl>g+10))agua++;}
      return agua*2>n;
    }
    const z=TERRAIN.atlasZ,sc=Math.pow(2,z),X=(0.02072*x+117.3)*sc,Y=(-0.0205*y+172.8)*sc,tx=Math.floor(X/256),ty=Math.floor(Y/256),max=sc-1;
    if(tx<0||ty<0||tx>max||ty>max)return null;
    let im=null;for(const base of remoteBases){im=await loadPixels(`${base}/styleAtlas/${z}/${tx}/${ty}.jpg`);if(im)break;}
    if(!im)return null;
    const u=Math.floor(X-tx*256),v=Math.floor(Y-ty*256);let agua=0,n=0;
    for(let dx=-2;dx<=2;dx+=2)for(let dy=-2;dy<=2;dy+=2){const uu=Math.min(im.w-1,Math.max(0,u+dx)),vv=Math.min(im.h-1,Math.max(0,v+dy)),i=(vv*im.w+uu)*4,r=im.d[i],g=im.d[i+1],bl=im.d[i+2];n++;if(bl-r>=35&&bl>=160&&bl>g+5)agua++;}
    return agua*2>n;
  }
  function qgList(){try{const l=window.HighOSMissionCloud?.qgs?.();return Array.isArray(l)?l:[];}catch(e){return [];}}
  function raioQg(){return Number(CATALOG()?.RAIO_QG_M)||150;}
  function nearQg(p,qgs=qgList()){const r=raioQg();let best=null;qgs.forEach(q=>{const d=Math.hypot(Number(p.x)-q.x,Number(p.y)-q.y);if(d<r&&(!best||d<best.d))best={...q,d};});return best;}
  /* Resultado de água por ponto fica em cache; o checklist lê o cache e
     pede a leitura quando falta (re-renderiza ao terminar). */
  const waterOf=new Map();
  const wKey=p=>`${Math.round(Number(p.x))},${Math.round(Number(p.y))}`;
  function pointWater(p){
    const k=wKey(p);if(waterOf.has(k))return waterOf.get(k);
    waterOf.set(k,undefined);
    isWater(p.x,p.y).then(v=>{waterOf.set(k,v);clearTimeout(state.waterTimer);state.waterTimer=setTimeout(()=>{try{renderRequestStatus();renderMap();}catch(e){}},250);});
    return undefined;
  }
  function terrainIssues(m){
    const qgs=qgList(),agua=[],qg=[];let pend=0;
    (m?.points||[]).forEach((p,i)=>{if(!validCoord(p.x)||!validCoord(p.y))return;const w=pointWater(p);if(w===undefined)pend++;else if(w===true)agua.push(i+1);const q=nearQg(p,qgs);if(q)qg.push({n:i+1,q});});
    return {agua,qg,pend,temQg:qgs.length>0};
  }

  async function completeSpawns(){
    const m=active();if(!m)return;
    if(!canMarkRequests()){alert('Seu acesso ao Planejador é somente leitura.');return;}
    const t=eventTarget(m.eventId),need=spawnShortfall(m);
    if(!t){alert('Defina a meta de facções do evento (botão META na central de eventos).');return;}
    if(!need){alert(`A zona já tem ${m.points.length} spawns para a meta de ${t.n} facções.`);return;}
    if(!validCoord(m.center?.x)||!validCoord(m.center?.y)){alert('Defina primeiro o centro da zona.');return;}
    if(!confirm(`Gerar ${need} spawn${need>1?'s':''} novo${need>1?'s':''} para a zona "${m.name}" chegar a ${t.n} facções (${t.fonte})?\n\nOs ${m.points.length} spawns atuais NÃO serão alterados. Os novos entram na mesma faixa de distância do centro, nos espaços vazios${eventTypeOf(m).gas?', dentro da safe inicial':''}, e ficam PENDENTES até a validação da CDS real no FiveM.`))return;
    if(!state.editing)startEdit();
    setSaveState('Lendo terreno (água e QGs)…');
    /* candidatos são lidos uma vez: água pelo mapa, QG pela CDS dos Groups */
    const c=m.center,cx=Number(c.x),cy=Number(c.y),qgs=qgList(),bad=new Map();
    const R=effectiveEventRadius(m),gas=eventTypeOf(m).gas;
    const pts=(m.points||[]).filter(p=>validCoord(p.x)&&validCoord(p.y));
    let mean=pts.length?pts.reduce((s2,p)=>s2+Math.hypot(Number(p.x)-cx,Number(p.y)-cy),0)/pts.length:R*.8;if(gas)mean=Math.min(mean,R*.85);
    const band=[1,.92,1.08].map(k=>gas?Math.min(mean*k,R*.92):mean*k),jobs=[];
    let semLeitura=0;
    for(let a=0;a<360;a+=2)band.forEach(d=>{const r=a*Math.PI/180,x=cx+Math.sin(r)*d,y=cy+Math.cos(r)*d,k=`${Math.round(x)},${Math.round(y)}`;
      if(nearQg({x,y},qgs)){bad.set(k,'qg');return;}
      jobs.push(isWater(x,y).then(w=>{if(w===true)bad.set(k,'agua');else if(w===null)semLeitura++;}));});
    await Promise.all(jobs);
    const seguros=suggestSpawns(m,need,q=>bad.has(`${Math.round(q.x)},${Math.round(q.y)}`));
    /* sem espaço seguro suficiente: cria mesmo assim e marca em laranja
       para ajuste no mouse + validação da CDS (nunca deixa faltar spawn) */
    const arriscados=seguros.length<need?suggestSpawns(m,need-seguros.length,null,seguros):[];
    const add=[...seguros,...arriscados],base=m.points.length;
    add.forEach((q,i)=>m.points.push(normalizePoint({x:q.x,y:q.y,z:0,h:(q.deg+180)%360,status:'planned'},base+i)));
    const nAgua=[...bad.values()].filter(v=>v==='agua').length,nQg=[...bad.values()].filter(v=>v==='qg').length;
    commit(`${add.length} spawns gerados como PENDENTES${nAgua||nQg?` (evitados: ${nAgua?`${nAgua} pontos na água`:''}${nAgua&&nQg?' · ':''}${nQg?`${nQg} perto de QG`:''})`:''} — confira no mapa e SALVE`);fit();
    if(arriscados.length){setPlannerTab('pontos');alert(`${arriscados.length} de ${add.length} spawns ficaram em área de risco (água ou perto de QG) e estão marcados em LARANJA no mapa.\n\nArraste cada um para terra firme e valide a CDS real.`);}
    else if(semLeitura>jobs.length/2)alert('O mapa não respondeu para a leitura de água: os spawns foram gerados sem esse filtro. Confira no mapa antes de salvar.');
  }

  /* V12.14 — PARTIDAS: registro do que aconteceu em cada evento e
     inteligência em cima disso (zona sugerida, vantagem de spawn/lado,
     facção dominante, participação real x capacidade). O spawn da
     campeã é guardado com a CDS, então a análise continua certa mesmo
     se os spawns forem renumerados. */
  function partidasDe(z){return Array.isArray(z?.partidas)?z.partidas:[];}
  function partidasEvento(eventId){return zonesOfEvent(eventId).flatMap(z=>partidasDe(z).map(p=>({...p,zoneId:z.id,zona:z.name||'Zona'}))).sort((a,b)=>String(b.at).localeCompare(String(a.at)));}
  function spawnIndexOf(m,sp){
    if(!sp||!Number.isFinite(Number(sp.x)))return null;let best=null,bd=40;
    (m.points||[]).forEach((p,i)=>{const d=Math.hypot(Number(p.x)-Number(sp.x),Number(p.y)-Number(sp.y));if(d<bd){bd=d;best=i+1;}});
    return best;
  }
  function zoneInsights(m){
    const ps=partidasDe(m),out={total:ps.length,comSpawn:0,wins:{},hot:[],setor:null,partMax:0,partMed:0};
    if(!ps.length)return out;
    const parts=ps.map(p=>Number(p.participantes)||0).filter(n=>n>0);
    if(parts.length){out.partMax=Math.max(...parts);out.partMed=Math.round(parts.reduce((a,b)=>a+b,0)/parts.length);}
    const setores={N:0,L:0,S:0,O:0},c=m.center;
    ps.forEach(p=>{const n=spawnIndexOf(m,p.spawn);if(!n)return;out.comSpawn++;out.wins[n]=(out.wins[n]||0)+1;
      if(validCoord(c?.x)){const a=(Math.atan2(Number(p.spawn.x)-Number(c.x),Number(p.spawn.y)-Number(c.y))*180/Math.PI+360)%360;setores[a<45||a>=315?'N':a<135?'L':a<225?'S':'O']++;}});
    const cap=Math.max(1,(m.points||[]).length),esperado=out.comSpawn/cap;
    out.hot=Object.entries(out.wins).map(([n,w])=>({n:Number(n),w})).filter(o=>o.w>=3&&o.w>=esperado*2.5).sort((a,b)=>b.w-a.w);
    if(out.comSpawn>=6){const [lado,q]=Object.entries(setores).sort((a,b)=>b[1]-a[1])[0];if(q/out.comSpawn>=.5)out.setor={lado,q,nome:{N:'norte',L:'leste',S:'sul',O:'oeste'}[lado]};}
    return out;
  }
  function eventInsights(eventId){
    const zones=zonesOfEvent(eventId),ps=partidasEvento(eventId),out={total:ps.length,ultima:ps[0]||null,sugestao:null,dominante:null,partMax:0,partMed:0,uso:[]};
    out.uso=zones.map(z=>{const l=partidasDe(z);const last=l.map(p=>p.at).sort().pop()||'';return {z,n:l.length,last};});
    /* zona sugerida: entre as que estão no jogo, a que está há mais tempo sem partida */
    const jogaveis=out.uso.filter(u=>wasApplied(u.z)||zoneStage(u.z)==='nojogo');
    if(ps.length&&jogaveis.length>1)out.sugestao=[...jogaveis].sort((a,b)=>String(a.last).localeCompare(String(b.last))||a.n-b.n)[0];
    const recentes=ps.slice(0,10).filter(p=>p.campea);
    if(recentes.length>=4){const cont={};recentes.forEach(p=>{const k=String(p.campea).trim();cont[k]=(cont[k]||0)+1;});const [nome,q]=Object.entries(cont).sort((a,b)=>b[1]-a[1])[0];if(q/recentes.length>=.4)out.dominante={nome,q,de:recentes.length};}
    const parts=ps.map(p=>Number(p.participantes)||0).filter(n=>n>0);
    if(parts.length){out.partMax=Math.max(...parts);out.partMed=Math.round(parts.reduce((a,b)=>a+b,0)/parts.length);}
    return out;
  }
  function faccaoOptions(){
    const l=faccoesAtivas()||[];return [...new Set(l.map(f=>f.faccao||f.group).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  }
  function openPartidasModal(eventId,zoneId=null){
    const zones=zonesOfEvent(eventId);if(!zones.length)return;
    const ev=zones[0].event||'Evento';
    let modal=qs('#mpPartidasModal');if(modal)modal.remove();
    modal=document.createElement('div');modal.id='mpPartidasModal';modal.className='mp-replicate-backdrop';
    const draw=()=>{
      const ins=eventInsights(eventId),lista=partidasEvento(eventId).slice(0,25),since=CATALOG()?.tempoDesde||(()=>'');
      const zSel=qs('#mppZona',modal)?.value||zoneId||ins.sugestao?.z.id||zones[0].id;
      const zAtual=zones.find(z=>z.id===zSel)||zones[0];
      const dicas=[];
      if(ins.sugestao)dicas.push(`Zona sugerida para a próxima: <b>${esc(ins.sugestao.z.name)}</b> (${ins.sugestao.last?`última partida ${since(ins.sugestao.last)}`:'ainda sem partida'})`);
      if(ins.dominante)dicas.push(`<b>${esc(ins.dominante.nome)}</b> venceu ${ins.dominante.q} das últimas ${ins.dominante.de}`);
      if(ins.partMax)dicas.push(`Participação: média ${ins.partMed} · pico ${ins.partMax} facções`);
      zones.forEach(z=>{const zi=zoneInsights(z);zi.hot.forEach(h=>dicas.push(`<span class="w">${esc(z.name)}: spawn ${pad2(h.n)} venceu ${h.w} de ${zi.comSpawn}</span>`));if(zi.setor)dicas.push(`<span class="w">${esc(z.name)}: lado ${zi.setor.nome} venceu ${zi.setor.q} de ${zi.comSpawn}</span>`);});
      modal.innerHTML=`<div class="mp-replicate-modal mpk-modal"><div class="mp-replicate-head"><div><b>PARTIDAS · ${esc(ev)}</b><small>${ins.total} partida${ins.total===1?'':'s'} registrada${ins.total===1?'':'s'} • o registro alimenta a análise de zonas, spawns e facções</small></div><button data-close>×</button></div>
        ${dicas.length?`<div class="mpp-dicas">${dicas.map(d=>`<span>${d}</span>`).join('')}</div>`:''}
        <div class="mpp-form">
          <label>ZONA<select id="mppZona">${zones.map(z=>`<option value="${esc(z.id)}" ${z.id===zAtual.id?'selected':''}>${esc(z.name||'Zona')}${ins.sugestao?.z.id===z.id?' ★':''}</option>`).join('')}</select></label>
          <label>DATA/HORA<input id="mppAt" type="datetime-local" value="${new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16)}"></label>
          <label>FACÇÕES<input id="mppPart" type="number" min="1" max="99" placeholder="nº"></label>
          <label class="wide">CAMPEÃ<input id="mppCampea" list="mppFacs" placeholder="Facção ou Group"><datalist id="mppFacs">${faccaoOptions().map(f=>`<option value="${esc(f)}">`).join('')}</datalist></label>
          <label>SPAWN DA CAMPEÃ<select id="mppSpawn"><option value="">—</option>${(zAtual.points||[]).map((p,i)=>`<option value="${i}">${pad2(i+1)}</option>`).join('')}</select></label>
          <label class="wide">OBS.<input id="mppObs" placeholder="opcional"></label>
          <button type="button" class="primary" id="mppSalvar">REGISTRAR PARTIDA</button>
        </div>
        <div class="mpp-lista">${lista.length?lista.map(p=>`<div><b>${esc(fmtLogDate(p.at))}</b><span>${esc(p.zona)}</span><em>${esc(p.campea||'—')}</em><small>${p.participantes?`${p.participantes} fac.`:''}${p.spawnN?` · spawn ${pad2(p.spawnN)}`:''}${p.obs?` · ${esc(p.obs)}`:''}</small><button type="button" data-del="${esc(p.zoneId)}|${esc(p.id)}" title="Excluir">×</button></div>`).join(''):'<div class="mpc-empty">Nenhuma partida registrada ainda.</div>'}</div>
        <div class="mp-replicate-actions"><button data-close>FECHAR</button></div></div>`;
      qsa('[data-close]',modal).forEach(b=>b.onclick=()=>modal.remove());
      qs('#mppZona',modal).onchange=()=>{zoneId=qs('#mppZona',modal).value;draw();};
      qs('#mppSalvar',modal).onclick=()=>{
        if(!canMarkRequests()){alert('Seu acesso ao Planejador é somente leitura.');return;}
        const z=zones.find(x=>x.id===qs('#mppZona',modal).value);if(!z)return;
        const campea=qs('#mppCampea',modal).value.trim();if(!campea){alert('Informe a facção campeã.');return;}
        const si=qs('#mppSpawn',modal).value,sp=si!==''?z.points[Number(si)]:null;
        const at=new Date(qs('#mppAt',modal).value||Date.now());
        const reg={id:uid(),at:(Number.isFinite(at.getTime())?at:new Date()).toISOString(),by:cloudUser(),campea,participantes:Number(qs('#mppPart',modal).value)||null,obs:qs('#mppObs',modal).value.trim(),spawnN:sp?Number(si)+1:null,spawn:sp?{x:r2(sp.x),y:r2(sp.y)}:null};
        z.partidas=[reg,...partidasDe(z)].slice(0,80);
        saveStore();zoneId=z.id;draw();render();renderCentralV954();
      };
      qsa('[data-del]',modal).forEach(b=>b.onclick=()=>{
        if(!canMarkRequests())return;const [zid,pid]=b.dataset.del.split('|');const z=zones.find(x=>x.id===zid);if(!z||!confirm('Excluir esta partida do registro?'))return;
        z.partidas=partidasDe(z).filter(p=>p.id!==pid);saveStore();draw();render();renderCentralV954();
      });
    };
    document.body.appendChild(modal);draw();
    modal.addEventListener('click',e=>{if(e.target===modal)modal.remove();});
  }

  /* Prazo de retorno da cidade */
  function retornoHoras(){return Number(CATALOG()?.PRAZO_RETORNO_H)||48;}
  function isStale(m){const r=m?.request;if(r?.status!=='sent'||zoneStage(m)!=='enviada')return false;const t=Date.parse(r.sentAt||'');return Number.isFinite(t)&&Date.now()-t>retornoHoras()*3600000;}

  /* Discord: mensagens de até 2.000 caracteres. Quebra em blocos
     inteiros (nunca no meio de uma CDS). */
  const DISCORD_LIMIT=1900;
  function splitDiscord(text,limit=DISCORD_LIMIT){
    text=String(text||'');if(text.length<=limit)return [text];
    const units=[];
    text.split(/\n\n/).forEach(par=>{
      if(par.length<=limit){units.push(par);return;}
      let cur='';par.split('\n').forEach(l=>{if(cur&&(cur.length+1+l.length)>limit){units.push(cur);cur=l;}else cur=cur?`${cur}\n${l}`:l;});if(cur)units.push(cur);
    });
    const parts=[];let cur='';
    units.forEach(u=>{if(cur&&(cur.length+2+u.length)>limit-20){parts.push(cur);cur=u;}else cur=cur?`${cur}\n\n${u}`:u;});
    if(cur)parts.push(cur);
    return parts.map((p,i)=>`(Parte ${i+1}/${parts.length})\n\n${p}`);
  }
  function openPartsModal(title,text){
    const parts=splitDiscord(text);
    let modal=qs('#mpPartsModal');if(modal)modal.remove();
    modal=document.createElement('div');modal.id='mpPartsModal';modal.className='mp-replicate-backdrop';
    modal.innerHTML=`<div class="mp-replicate-modal mpk-modal"><div class="mp-replicate-head"><div><b>${esc(title)}</b><small>${text.length.toLocaleString('pt-BR')} caracteres • ${parts.length} mensage${parts.length===1?'m':'ns'} no Discord (limite 2.000) — cole na ordem</small></div><button data-close>×</button></div>
      <div class="mpk-parts">${parts.map((p,i)=>`<div class="mpk-part"><header><b>PARTE ${i+1}/${parts.length}</b><small>${p.length} caracteres</small><button type="button" data-part="${i}">COPIAR</button></header><pre>${esc(p.slice(0,260))}${p.length>260?'…':''}</pre></div>`).join('')}</div>
      <div class="mp-replicate-actions"><button data-close>FECHAR</button></div></div>`;
    document.body.appendChild(modal);
    qsa('[data-close]',modal).forEach(b=>b.onclick=()=>modal.remove());
    modal.addEventListener('click',e=>{if(e.target===modal)modal.remove();});
    qsa('[data-part]',modal).forEach(b=>b.onclick=async()=>{await copyText(parts[Number(b.dataset.part)]);b.textContent='COPIADA ✓';b.closest('.mpk-part')?.classList.add('done');});
  }
  function fmtLogDate(iso){const d=new Date(iso||'');return Number.isFinite(d.getTime())?d.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'—';}
  function centerReadyFor(m){return isCenterValidated(m)||(m.official&&validCoord(m.center?.x)&&validCoord(m.center?.y)&&Number.isFinite(Number(m.center?.z))&&Number.isFinite(Number(m.center?.h)));}
  function zoneChecks(m){
    const type=eventTypeOf(m),all=m?.points||[],val=all.filter(isValidated).length,out=[];
    out.push({label:type.gas?'Centro do gás validado':'Centro da zona validado',ok:centerReadyFor(m),block:true});
    out.push({label:all.length?`Spawns validados (${val}/${all.length})`:'Spawns cadastrados',ok:all.length>0&&val===all.length,block:true});
    if(type.gas){
      const cc=zoneCoverageCounts(m);
      out.push({label:cc.outside?`${cc.outside} spawn(s) fora da safe inicial`:`Spawns dentro da safe (${Math.round(cc.radius)} m)`,ok:cc.outside===0&&cc.total>0,block:true});
      const sr=m.safeRoute;const o2=(sr?.stage2Options||[]).length,o3=(sr?.stage3Options||[]).length;
      out.push({label:o2||o3?`Movimentação da safe (${o2} op. SAFE 2 · ${o3} op. SAFE 3)`:'Movimentação da safe não configurada (opcional)',ok:!!(o2||o3),block:false});
    }
    if(type.zonasIguais){
      const sig=safeRulesSig(m),diff=zonesOfEvent(m.eventId).filter(z=>z.id!==m.id&&safeRulesSig(z)&&sig&&safeRulesSig(z)!==sig);
      if(sig)out.push(diff.length
        ?{label:`Fases da safe diferentes de ${diff.map(z=>z.name||'Zona').join(', ')} (tempos/dano precisam ser iguais em todas as zonas)`,ok:false,block:false,warn:true}
        :{label:'Fases da safe (tempos/dano) iguais às demais zonas',ok:true,block:false});
    }
    /* avisos (não bloqueiam): capacidade igual às demais zonas e equilíbrio */
    const ti=terrainIssues(m);
    if((m.points||[]).length){
      out.push(ti.agua.length
        ?{label:`Spawn${ti.agua.length>1?'s':''} na água pelo mapa: ${ti.agua.map(pad2).join(', ')} — confira (píer/ponte podem enganar)`,ok:false,block:false,warn:true}
        :{label:ti.pend?'Verificando água no mapa…':'Nenhum spawn na água (leitura do mapa)',ok:!ti.pend,block:false});
      if(ti.temQg)out.push(ti.qg.length
        ?{label:`Spawn perto de QG: ${ti.qg.slice(0,4).map(o=>`${pad2(o.n)} a ${Math.round(o.q.d)} m de ${o.q.qg||o.q.group}`).join(', ')} (mínimo ${raioQg()} m)`,ok:false,block:false,warn:true}
        :{label:`Nenhum spawn a menos de ${raioQg()} m de QG`,ok:true,block:false});
    }
    const zi=zoneInsights(m);
    if(zi.total){
      zi.hot.forEach(h=>out.push({label:`Spawn ${pad2(h.n)} venceu ${h.w} de ${zi.comSpawn} partidas — revisar vantagem (cobertura, altura, acesso)`,ok:false,block:false,warn:true}));
      if(zi.setor)out.push({label:`Lado ${zi.setor.nome} venceu ${zi.setor.q} de ${zi.comSpawn} partidas — conferir equilíbrio do terreno`,ok:false,block:false,warn:true});
      if(!zi.hot.length&&!zi.setor&&zi.comSpawn>=5)out.push({label:`Sem vantagem de spawn em ${zi.comSpawn} partidas registradas`,ok:true,block:false});
      if(zi.partMax&&zi.partMax>(m.points||[]).length)out.push({label:`Já teve ${zi.partMax} facções numa partida e a zona tem ${(m.points||[]).length} spawns`,ok:false,block:false,warn:true});
    }
    const tg=eventTarget(m.eventId);
    if(tg){
      const tot=(m.points||[]).length;
      out.push(tot<tg.n
        ?{label:`Faltam ${tg.n-tot} spawn(s) para ${tg.n} facções (${tg.fonte}) — use GERAR SPAWNS QUE FALTAM`,ok:false,block:false,warn:true}
        :{label:`Spawns suficientes para ${tg.n} facções (${tg.fonte})`,ok:true,block:false});
    }
    const cap=zoneCapacity(m);
    if(cap){
      const others=eventCapacities(m.eventId).filter(o=>o.z.id!==m.id);
      const diff=others.filter(o=>o.cap!==cap);
      out.push(diff.length
        ?{label:`Comporta ${cap} facções; ${diff.map(o=>`${o.z.name||'Zona'}: ${o.cap}`).join(' · ')}`,ok:false,block:false,warn:true}
        :{label:`Comporta ${cap} facções${others.length?' (igual às demais zonas)':''}`,ok:true,block:false});
    }
    const bal=zoneBalance(m);
    if(bal){
      if(bal.mean){
        const lst=[...bal.near.map(o=>`${pad2(o.n)} a ${Math.round(o.d)} m`),...bal.far.map(o=>`${pad2(o.n)} a ${Math.round(o.d)} m`)];
        out.push(lst.length
          ?{label:`Distância ao centro desigual (média ${Math.round(bal.mean)} m): ${lst.slice(0,5).join(', ')}${lst.length>5?'…':''}`,ok:false,block:false,warn:true}
          :{label:`Distância ao centro equilibrada (média ${Math.round(bal.mean)} m)`,ok:true,block:false});
      }
      out.push(bal.tight.length
        ?{label:`Spawns colados: ${bal.tight.slice(0,4).map(t=>`${pad2(t.a)}↔${pad2(t.b)} ${Math.round(t.d)} m`).join(', ')} (típico ${Math.round(bal.spacing)} m)`,ok:false,block:false,warn:true}
        :{label:`Espaçamento entre spawns equilibrado (típico ${Math.round(bal.spacing)} m)`,ok:true,block:false});
    }
    return out;
  }
  function zoneReady(m){return zoneChecks(m).every(c=>c.ok||!c.block);}
  function zoneStage(m){
    const r=m?.request;
    if(r?.hash&&r.hash!==geomHash(m))return 'alterada';
    if(r?.status==='applied')return 'nojogo';
    if(r?.status==='sent')return 'enviada';
    return zoneReady(m)?'pronta':'rascunho';
  }
  function stageInfo(st){return CATALOG()?.ETAPAS?.[st]||{label:st.toUpperCase(),tom:'muted'};}
  function wasApplied(m){const r=m?.request;return r?.status==='applied'||!!r?.appliedAt||!!r?.baseline||!!r?.appliedBefore;}
  function logRequest(m,action){m.requestLog=[{at:nowIso(),action,by:cloudUser()},...(m.requestLog||[])].slice(0,12);}
  /* Zonas oficiais já existem no jogo: viram a linha de base para detectar alteração. */
  function baselineOfficialZones(){
    /* V12.8: eventos ficam no painel in-game /evento; o antigo padrão /ilegal era só o canal do ticket */
    state.missions.forEach(m=>{if(!m.panelMigrated128){if(!m.panel||m.panel==='/ilegal')m.panel=defaultPanel();m.panelMigrated128=true;}});
    state.missions.forEach(m=>{if(m.official&&!m.request)m.request={status:'applied',hash:geomHash(m),baseline:true,appliedAt:null};});
    /* V12.9: registros antigos guardavam só o hash; se a geografia ainda é a
       mesma, a cópia detalhada pode ser criada agora sem perda. */
    state.missions.forEach(m=>{const r=m.request;if(r&&!r.geom&&r.hash&&r.hash===geomHash(m))r.geom=geomSnap(m);});
  }
  function markZoneSent(m,silent=false){
    if(!m)return false;
    if(!canMarkRequests()){if(!silent)alert('Seu acesso ao Planejador é somente leitura.');return false;}
    if(!zoneReady(m)){if(!silent)alert('A zona ainda tem pendências. Resolva o checklist antes de marcar como enviada.');return false;}
    const prev=m.request||{};
    /* guarda a versão que está no jogo para poder cancelar o envio e para
       descrever as alterações em relação a ela */
    const game=prev.status==='applied'?{hash:prev.hash,geom:prev.geom||null,appliedAt:prev.appliedAt||null,appliedBy:prev.appliedBy||'',baseline:!!prev.baseline}:(prev.status==='sent'?(prev.prev||null):null);
    m.request={status:'sent',hash:geomHash(m),geom:geomSnap(m),kind:m.requestKind||'alter-zone',sentAt:nowIso(),sentBy:cloudUser(),appliedBefore:wasApplied(m)||!!prev.appliedBefore,prev:game};
    logRequest(m,prev.status==='sent'?'reenviada':'enviada');
    return true;
  }
  function markZoneApplied(m){
    if(!m)return false;
    if(!canMarkRequests()){alert('Seu acesso ao Planejador é somente leitura.');return false;}
    const r=m.request||{};
    m.request={...r,status:'applied',hash:r.hash||geomHash(m),geom:r.geom||geomSnap(m),appliedAt:nowIso(),appliedBy:cloudUser(),baseline:false};
    delete m.request.prev;
    m.requestKind='alter-zone';
    logRequest(m,'aplicada no jogo');
    return true;
  }
  /* Cidade recusou/pediu ajuste, ou o envio foi marcado por engano:
     volta para a versão que está no jogo (ou para pronta, se a zona é nova). */
  function cancelZoneSent(m){
    if(!m||m.request?.status!=='sent')return false;
    if(!canMarkRequests()){alert('Seu acesso ao Planejador é somente leitura.');return false;}
    const r=m.request;
    if(r.prev)m.request={status:'applied',...r.prev};
    else if(r.appliedBefore)m.request={status:'applied',hash:'?',appliedBefore:true};
    else m.request=null;
    if(!m.request)delete m.request;
    logRequest(m,'envio cancelado');
    return true;
  }
  function zonesInPanel(eventId,extraIds=[]){
    return zonesOfEvent(eventId).filter(z=>wasApplied(z)||z.request?.status==='sent'||extraIds.includes(z.id)).map(z=>z.name||'Zona');
  }
  function zoneOverlaps(eventId){
    const zs=zonesOfEvent(eventId).filter(z=>validCoord(z.center?.x)&&validCoord(z.center?.y)),out=[];
    for(let i=0;i<zs.length;i++)for(let j=i+1;j<zs.length;j++){
      const a=zs[i],b=zs[j],d=distXY(a.center,b.center),lim=effectiveEventRadius(a)+effectiveEventRadius(b);
      if(d<lim)out.push({a:a.name,b:b.name,d,lim});
    }
    return out;
  }

  /* Blocos de texto reutilizados pela solicitação da zona e pelo pacote do evento. */
  function zoneGeoText(m){
    const type=eventTypeOf(m),pts=(m.points||[]).filter(isValidated),radius=effectiveEventRadius(m);
    const centerTitle=type.gas?'CENTRO DO GÁS / MARCO ZERO':'COORDENADA CENTRAL';
    const radiusTitle=type.gas?'RAIO INICIAL DA SAFE / GÁS':'RAIO DA ÁREA DE DOMINAÇÃO';
    const sr=type.gas?ensureSafeRoute(m):null;
    let safe='';
    if(sr){
      const s=sr.stages||[],o2=(sr.stage2Options||[]).filter(p=>validCoord(p.x)&&validCoord(p.y)),o3=(sr.stage3Options||[]).filter(p=>validCoord(p.x)&&validCoord(p.y));
      if(o2.length||o3.length){
        const fmtOpt=(p,i,prefix)=>`- ${prefix}${String.fromCharCode(65+i)}: ${f(p.x)},${f(p.y)} • raio da etapa: ${Math.round(Number(s[prefix==='SAFE 2'?1:2]?.radius)||0)} m`;
        safe=`

MOVIMENTAÇÃO DA SAFE:

- SAFE 1: ${f(s[0]?.x)},${f(s[0]?.y)} • fecha até ${Math.round(Number(s[0]?.radius)||0)} m • dano ${Number(s[0]?.damage)||0} • fechamento ${Number(s[0]?.closeSeconds)||0}s.
${o2.map((p,i)=>fmtOpt(p,i,'SAFE 2')).join('\n')}
${o3.map((p,i)=>fmtOpt(p,i,'SAFE 3')).join('\n')}

- A cada execução, sortear uma opção de SAFE 2 e uma opção de SAFE 3 dentre as CDS configuradas.
- Fluxo: SAFE 1 fecha → círculo inteiro se desloca até SAFE 2 mantendo o raio alcançado → fecha novamente → desloca até SAFE 3 → fechamento final${eventTypeOf(m).padrao?' até raio zero, com dano contínuo até restar uma equipe':''}.
- Movimento SAFE 1→2: ${Number(s[0]?.moveSeconds)||0}s. Movimento SAFE 2→3: ${Number(s[1]?.moveSeconds)||0}s.
- Durante o deslocamento, centro e área do gás devem se mover continuamente, sem teleporte da zona.`;
      }
    }
    return `${centerTitle}:

- ${rawCds(m.center)}

${radiusTitle}:

- ${Math.round(radius)} metros.

SPAWNS DAS ORGANIZAÇÕES:

${pts.map((p,i)=>`${String(i+1).padStart(2,'0')} - ${rawCds(p)}`).join('\n')}${safe}`;
  }
  function distributionText(cap){return `DISTRIBUIÇÃO:

- Utilizar 1 spawn diferente por organização inscrita.${cap?`

- Capacidade: até ${cap} organizações por partida.`:''}

- Caso haja menos organizações que pontos disponíveis, utilizar somente a quantidade necessária.

- Nenhuma organização deverá compartilhar o mesmo ponto de spawn.`;}
  function mechanicText(m){return (eventTypeOf(m).mechanic||[]).map(l=>`- ${l}`).join('\n\n');}
  function heightText(m){return eventTypeOf(m).gas?`

OBSERVAÇÃO — ALTURA DA SAFE:

- A Safe não deve ficar presa ao Z da CDS do centro. Como poderá se movimentar entre locais com alturas diferentes, o gás deve ter cobertura vertical do chão/abaixo do terreno até uma altura suficiente para permanecer visível durante todo o percurso.

- A movimentação e a verificação da Safe devem considerar principalmente X/Y e o raio atual, evitando que o gás fique enterrado ou suspenso devido à diferença de altitude do mapa.`:'';}
  function panelLabel(m){return m?.panel||defaultPanel();}

  /* V12.10 — padrão dos eventos com zona de gás (solicitação de 13/10).
     Vai em toda solicitação de zona de Sobrevivência, Fac x Fac e BR. */
  function padraoText(m){
    const t=eventTypeOf(m),P=t.padrao;if(!P)return '';
    return `

${P.titulo} (${P.eventos}):

${P.regras.map(l=>`- ${l}`).join('\n\n')}${t.zonasIguais?`

- ${P.zonasIguais}`:''}`;
  }
  /* assinatura das fases da safe que precisam ser iguais entre zonas */
  function safeRulesSig(m){
    const sr=m?.safeRoute;if(!sr||!Array.isArray(sr.stages))return null;
    return sr.stages.map((s,i)=>`F${i+1}: dano ${Number(s.damage)||0} · fecha ${Number(s.closeSeconds)||0}s${i<sr.stages.length-1?` · move ${Number(s.moveSeconds)||0}s`:''}`).join(' | ');
  }
  function testList(m){const t=eventTypeOf(m),P=t.padrao;if(!P)return [];return t.zonasIguais?[...P.testes,P.testeZonasIguais]:[...P.testes];}
  function testStatus(m){
    const list=testList(m);if(!list.length)return null;
    const tt=m?.request?.tests;const ok=Array.isArray(tt?.ok)?tt.ok.filter(i=>i<list.length):[];
    return {total:list.length,ok:ok.length,done:!!tt,falhas:list.filter((_,i)=>!ok.includes(i)),at:tt?.at,by:tt?.by};
  }
  /* Ao confirmar no jogo: checklist dos critérios de validação da solicitação */
  function openTestsModal(m,confirmApply){
    const list=testList(m);if(!list.length)return false;
    const prev=m.request?.tests?.ok||[];
    let modal=qs('#mpTestsModal');if(modal)modal.remove();
    modal=document.createElement('div');modal.id='mpTestsModal';modal.className='mp-replicate-backdrop';
    modal.innerHTML=`<div class="mp-replicate-modal mpk-modal"><div class="mp-replicate-head"><div><b>${confirmApply?'CONFIRMAR NO JOGO':'TESTES'} · ${esc(m.event||'Evento')} › ${esc(m.name||'Zona')}</b><small>Critérios de validação do ${esc(eventTypeOf(m).padrao.titulo.toLowerCase())} (${esc(eventTypeOf(m).padrao.solicitadoEm)}). Marque o que foi testado e funcionou.</small></div><button data-close>×</button></div>
      <div class="mpk-tests">${list.map((t,i)=>`<label><input type="checkbox" data-test="${i}" ${prev.includes(i)?'checked':''}><span>${esc(t)}</span></label>`).join('')}</div>
      <div class="mpk-count" id="mpkTestsCount"></div>
      <div class="mp-replicate-actions"><button data-close>FECHAR</button><button data-all>MARCAR TODOS</button><button class="primary" data-save>${confirmApply?'CONFIRMAR APLICADA NO JOGO':'SALVAR TESTES'}</button></div></div>`;
    document.body.appendChild(modal);
    const boxes=qsa('[data-test]',modal),count=()=>{const n=boxes.filter(b=>b.checked).length;qs('#mpkTestsCount',modal).textContent=`${n}/${list.length} critérios OK${n<list.length?' — os que faltarem ficam como pendência na zona':''}`;};
    boxes.forEach(b=>b.onchange=count);count();
    qsa('[data-close]',modal).forEach(b=>b.onclick=()=>modal.remove());
    modal.addEventListener('click',e=>{if(e.target===modal)modal.remove();});
    qs('[data-all]',modal).onclick=()=>{boxes.forEach(b=>b.checked=true);count();};
    qs('[data-save]',modal).onclick=()=>{
      if(confirmApply&&!markZoneApplied(m))return;
      if(!canMarkRequests()){alert('Seu acesso ao Planejador é somente leitura.');return;}
      const ok=boxes.filter(b=>b.checked).map(b=>Number(b.dataset.test));
      m.request=m.request||{status:'applied',hash:geomHash(m),geom:geomSnap(m)};
      m.request.tests={ok,at:nowIso(),by:cloudUser()};
      logRequest(m,`testes ${ok.length}/${list.length}`);
      saveStore();modal.remove();render();renderCentralV954();
    };
    return true;
  }
  function openPadraoModal(eventId){
    const zones=zonesOfEvent(eventId),t=eventTypeOf(zones[0]||{}),P=t.padrao;if(!P)return;
    let modal=qs('#mpPadraoModal');if(modal)modal.remove();
    modal=document.createElement('div');modal.id='mpPadraoModal';modal.className='mp-replicate-backdrop';
    const zt=zones.map(z=>{const ts=testStatus(z),st=zoneStage(z);return `<div class="mpk-ztest"><b>${esc(z.name||'Zona')}</b><span class="${!ts?.done?'':(ts.ok===ts.total?'ok':'warn')}">${st!=='nojogo'&&!wasApplied(z)?'ainda não está no jogo':(!ts?.done?'testes não registrados':`${ts.ok}/${ts.total} OK${ts.at?` · ${esc(fmtLogDate(ts.at))}`:''}`)}</span>${ts?.done&&ts.falhas.length?`<small>Falta: ${ts.falhas.map(esc).join(' · ')}</small>`:''}</div>`;}).join('');
    modal.innerHTML=`<div class="mp-replicate-modal mpk-modal"><div class="mp-replicate-head"><div><b>${esc(P.titulo)}</b><small>Solicitado à cidade em ${esc(P.solicitadoEm)} • ${esc(P.eventos)} • entra automaticamente nas solicitações de zona</small></div><button data-close>×</button></div>
      <div class="mpk-padrao">${P.resumo.map(g=>`<div><span>${esc(g.titulo)}</span><ul>${g.itens.map(i=>`<li>${esc(i)}</li>`).join('')}</ul></div>`).join('')}</div>
      <div class="mpk-ztests"><span>TESTES NO JOGO · ${esc(zones[0]?.event||'Evento')}</span>${zt}</div>
      <div class="mp-replicate-actions"><button data-close>FECHAR</button></div></div>`;
    document.body.appendChild(modal);
    qsa('[data-close]',modal).forEach(b=>b.onclick=()=>modal.remove());
    modal.addEventListener('click',e=>{if(e.target===modal)modal.remove();});
  }

  function generateRequest(){
    const m=active();if(!m)return false;
    const type=eventTypeOf(m),all=m.points||[],pts=all.filter(isValidated),pending=all.length-pts.length;
    if(!pts.length){alert('Nenhum spawn validado para gerar a solicitação.');return false;}
    if(pending>0){alert(`Existem ${pending} spawn(s) pendente(s). Valide todos antes de gerar a solicitação.`);return false;}
    if(!centerReadyFor(m)){alert(`Valide primeiro a CDS real do ${type.gas?'CENTRO DO GÁS / MARCO ZERO':'CENTRO DA ZONA'}.`);return false;}
    const counts=zoneCoverageCounts(m);
    if(type.gas&&counts.outside>0){alert(`${counts.outside} spawn(s) estão FORA da safe inicial (${Math.round(counts.radius)} m). Todos precisam iniciar dentro da área segura.`);return false;}
    /* zona que já está no jogo só pode receber pedido de ALTERAÇÃO */
    if(wasApplied(m)&&m.requestKind!=='alter-zone'){m.requestKind='alter-zone';syncForm();}
    const panel=panelLabel(m),kind=m.requestKind||'alter-zone',eventName=m.event||'Evento',zoneName=m.name||'Zona Principal';
    const eventLive=zonesOfEvent(m.eventId).some(z=>z.id!==m.id&&wasApplied(z));
    let subject='',intro='';
    if(kind==='create-event'){
      subject=`Solicitação de Criação do Evento ${eventName} - ${panel}`;
      intro=`- Solicitamos a criação do evento "${eventName}" (${type.label}) no painel ${panel}.

- O evento deverá ser criado inicialmente com a zona "${zoneName}", utilizando a configuração geográfica abaixo.`;
    }else if(kind==='create-zone'){
      subject=`Solicitação de Criação da Zona ${zoneName} - Evento ${eventName} - ${panel}`;
      intro=`- Solicitamos a criação da nova zona "${zoneName}" para o evento "${eventName}" (${type.label}) no painel ${panel}.

- As demais zonas já existentes do evento deverão permanecer inalteradas.`;
    }else{
      subject=`Solicitação de Alteração da Zona ${zoneName} - Evento ${eventName} - ${panel}`;
      intro=`- Solicitamos a alteração da zona "${zoneName}" do evento "${eventName}" (${type.label}) no painel ${panel}, utilizando a configuração geográfica abaixo.

- As demais zonas do evento deverão permanecer inalteradas.`;
    }
    const selection=[...new Set([...zonesInPanel(m.eventId),zoneName])];
    const panelText=`PAINEL ${panel.toUpperCase()} — SELEÇÃO:

- Evento: "${eventName}"${kind==='create-event'||!eventLive&&kind!=='alter-zone'?' (novo no painel)':''}.

- Zona: "${zoneName}" — ${kind==='alter-zone'?'mantém o mesmo nome na seleção de zonas':'deverá aparecer na seleção de zonas do evento'}.

- Zonas do evento disponíveis na seleção após esta solicitação: ${selection.join(', ')}.`;
    const text=`Assunto:

- ${subject};

Solicitação:

${intro}

${panelText}

${kind==='alter-zone'?diffText(m):''}${zoneGeoText(m)}

${distributionText(zoneCapacity(m))}

${mechanicText(m)}${padraoText(m)}${heightText(m)}

- As demais configurações, regras, premiações, duração e funcionamento do evento deverão permanecer inalterados.`;
    m.requestText=text;if(qs('#mpRequestText'))qs('#mpRequestText').value=text;
    renderRequestStatus();
    return true;
  }

  /* Pacote do evento: uma solicitação só com todas as zonas prontas
     ou alteradas, no formato que a cidade usa para o /evento. */
  function buildEventPackage(eventId){
    const zones=zonesOfEvent(eventId);if(!zones.length)return null;
    const first=zones[0],type=eventTypeOf(first),panel=panelLabel(first),eventName=first.event||'Evento';
    const include=zones.filter(z=>{const st=zoneStage(z);return (st==='pronta'||st==='alterada')&&zoneReady(z);});
    const blocked=zones.filter(z=>!zoneReady(z)&&zoneStage(z)!=='nojogo'&&zoneStage(z)!=='enviada');
    const live=zones.filter(z=>wasApplied(z));
    if(!include.length)return {eventName,type,include,blocked,live,text:''};
    const isNew=!live.length&&!zones.some(z=>z.request?.status==='sent');
    /* capacidade considera as zonas que ficarão selecionáveis no painel */
    const selZones=zones.filter(z=>include.includes(z)||wasApplied(z)||z.request?.status==='sent');
    const caps=selZones.map(z=>({z,cap:zoneCapacity(z)})).filter(o=>o.cap>0);
    const capMin=caps.length?Math.min(...caps.map(o=>o.cap)):0,capUneven=caps.some(o=>o.cap!==capMin);
    const capLines=capUneven?`

- Capacidade por zona: ${caps.map(o=>`${o.z.name||'Zona'} ${o.cap}`).join(' · ')}. O limite de inscrições do evento deverá respeitar a zona com menos spawns (${capMin}).`:'';
    const selection=[...new Set([...zonesInPanel(eventId),...include.map(z=>z.name||'Zona')])];
    const subject=isNew
      ?`Solicitação de Criação do Evento ${eventName} - ${panel}`
      :`Solicitação de Atualização das Zonas do Evento ${eventName} - ${panel}`;
    const intro=isNew
      ?`- Solicitamos a criação do evento "${eventName}" (${type.label}) no painel ${panel}, com ${include.length} zona${include.length===1?'':'s'} selecionáve${include.length===1?'l':'is'}.`
      :`- Solicitamos a atualização do evento "${eventName}" (${type.label}) no painel ${panel} conforme as zonas listadas abaixo.

- As zonas do evento que não estão listadas deverão permanecer inalteradas.`;
    const blocks=include.map((z,i)=>{
      const acao=wasApplied(z)?'ALTERAÇÃO':'CRIAÇÃO';
      return `━━━━━━━━━━━━━━━━━━━━

ZONA ${String(i+1).padStart(2,'0')} — ${z.name||'Zona'} (${acao})

${acao==='ALTERAÇÃO'?diffText(z):''}${zoneGeoText(z)}`;
    }).join('\n\n');
    const text=`Assunto:

- ${subject};

Solicitação:

${intro}

PAINEL ${panel.toUpperCase()} — SELEÇÃO:

- Evento: "${eventName}".

- Zonas disponíveis na seleção do evento: ${selection.join(', ')}.

- Ao escolher a zona no ${panel}, o evento deverá utilizar o centro, o raio e os spawns da zona escolhida.

${blocks}

━━━━━━━━━━━━━━━━━━━━

${distributionText(capMin)}${capLines}

${(type.mechanic||[]).map(l=>`- ${l}`).join('\n\n')}${padraoText(first)}${heightText(first)}

- As demais configurações, regras, premiações, duração e funcionamento do evento deverão permanecer inalterados.`;
    return {eventName,type,include,blocked,live,text,capMin,capUneven};
  }
  function openEventPackage(eventId){
    const pkg=buildEventPackage(eventId);if(!pkg)return;
    let modal=qs('#mpPackageModal');if(modal)modal.remove();
    modal=document.createElement('div');modal.id='mpPackageModal';modal.className='mp-replicate-backdrop';
    const list=(arr,cls)=>arr.map(z=>`<span class="mpk-chip ${cls}">${esc(z.name||'Zona')}</span>`).join('');
    modal.innerHTML=`<div class="mp-replicate-modal mpk-modal"><div class="mp-replicate-head"><div><b>SOLICITAÇÃO DO EVENTO · ${esc(pkg.eventName)}</b><small>${esc(pkg.type.label)} • todas as zonas prontas em um único texto para o ${esc(panelLabel(zonesOfEvent(eventId)[0]))}</small></div><button id="mpkClose">×</button></div>
      <div class="mpk-groups">
        <div><span>NESTA SOLICITAÇÃO</span><div>${list(pkg.include,'ok')||'<em>Nenhuma zona pronta</em>'}</div></div>
        <div><span>JÁ NO JOGO</span><div>${list(pkg.live.filter(z=>!pkg.include.includes(z)),'live')||'<em>—</em>'}</div></div>
        <div><span>FORA (PENDÊNCIAS)</span><div>${list(pkg.blocked,'bad')||'<em>—</em>'}</div></div>
      </div>
      ${pkg.capUneven?`<div class="mpk-warns inline"><span>⚠ ${esc(capacityWarning(eventId))}</span></div>`:''}
      ${pkg.text?`<div class="mpk-count">${pkg.text.length.toLocaleString('pt-BR')} caracteres • ${splitDiscord(pkg.text).length>1?`${splitDiscord(pkg.text).length} mensagens no Discord — use COPIAR EM PARTES`:'cabe em 1 mensagem do Discord'}${pkg.capMin?` • até ${pkg.capMin} facções por partida`:''}</div><textarea id="mpkText" rows="16" readonly>${esc(pkg.text)}</textarea>`:'<div class="mpc-empty">Nenhuma zona deste evento está pronta para envio. Abra as zonas em RASCUNHO e conclua o checklist.</div>'}
      <div class="mp-replicate-actions"><button id="mpkCancel">FECHAR</button>${pkg.text?`${splitDiscord(pkg.text).length>1?'<button id="mpkParts">COPIAR EM PARTES</button>':''}<button id="mpkCopy">COPIAR TEXTO</button><button id="mpkSent" class="primary">${splitDiscord(pkg.text).length>1?'':'COPIAR E '}MARCAR ${pkg.include.length} COMO ENVIADA${pkg.include.length===1?'':'S'}</button>`:''}</div></div>`;
    document.body.appendChild(modal);
    const close=()=>modal.remove();
    qs('#mpkClose',modal).onclick=close;qs('#mpkCancel',modal).onclick=close;
    modal.addEventListener('click',e=>{if(e.target===modal)close();});
    qs('#mpkCopy',modal)?.addEventListener('click',async e=>{await copyText(pkg.text);e.target.textContent='COPIADO ✓';});
    qs('#mpkParts',modal)?.addEventListener('click',()=>openPartsModal(`SOLICITAÇÃO DO EVENTO · ${pkg.eventName}`,pkg.text));
    qs('#mpkSent',modal)?.addEventListener('click',async()=>{
      if(!canMarkRequests()){alert('Seu acesso ao Planejador é somente leitura.');return;}
      if(splitDiscord(pkg.text).length===1)await copyText(pkg.text);
      const eventLive=pkg.live.length>0;pkg.include.forEach((z,i)=>{if(!wasApplied(z))z.requestKind=!eventLive&&i===0?'create-event':'create-zone';z.requestText=pkg.text;markZoneSent(z,true);});
      saveStore();close();render();renderCentralV954();
    });
  }

  function ensureRequestStatusUi(){
    const btn=qs('#mpGenerateRequest');const card=btn?.closest('.mp-card');if(!card||qs('#mpRequestStatus'))return;
    const box=document.createElement('div');box.id='mpRequestStatus';box.className='mpk-status';
    card.querySelector('h3')?.insertAdjacentElement('afterend',box);
  }
  function renderRequestStatus(){
    ensureRequestStatusUi();
    const box=qs('#mpRequestStatus'),m=active();if(!box||!m)return;
    const st=zoneStage(m),info=stageInfo(st),checks=zoneChecks(m),r=m.request||{},since=CATALOG()?.tempoDesde||(()=>'');
    const stale=isStale(m);
    const when=st==='enviada'?`Enviada ${since(r.sentAt)}${r.sentBy?` por ${esc(r.sentBy)}`:''}${stale?` — sem retorno há mais de ${retornoHoras()} h: cobre no ticket`:''}`
      :st==='nojogo'?(r.baseline?'Zona oficial já existente no jogo':`Confirmada no jogo ${since(r.appliedAt)}${r.appliedBy?` por ${esc(r.appliedBy)}`:''}`)
      :st==='alterada'?`A geografia mudou depois do ${r.status==='applied'?'último ajuste no jogo':'envio'} — gere e envie uma nova solicitação`
      :st==='pronta'?'Checklist completo: gere o texto, envie à cidade e marque como enviada'
      :'Conclua o checklist para liberar a solicitação';
    const actions=[];
    if(st==='pronta'||st==='alterada')actions.push(`<button type="button" data-req="sent" class="primary">COPIAR E MARCAR COMO ENVIADA</button>`);
    if(st==='enviada')actions.push(`<button type="button" data-req="applied" class="primary">CONFIRMAR APLICADA NO JOGO</button><button type="button" data-req="cancel">CANCELAR ENVIO</button>`);
    if(st==='pronta'||st==='alterada')actions.push(`<button type="button" data-req="parts">COPIAR EM PARTES (DISCORD)</button>`);
    if(spawnShortfall(m)>0)actions.unshift(`<button type="button" data-req="fill" class="primary">GERAR ${spawnShortfall(m)} SPAWN${spawnShortfall(m)>1?'S':''} QUE FALTA${spawnShortfall(m)>1?'M':''}</button>`);
    const ts=testStatus(m);
    if(ts&&st==='nojogo')actions.push(`<button type="button" data-req="tests">${ts.done?'REVISAR TESTES':'REGISTRAR TESTES'}</button>`);
    if(eventTypeOf(m).padrao)actions.push(`<button type="button" data-req="padrao">VER PADRÃO GÁS</button>`);
    if(wasApplied(m)||st==='nojogo')actions.push(`<button type="button" data-req="partidas">PARTIDAS${partidasDe(m).length?` (${partidasDe(m).length})`:''}</button>`);
    actions.push(`<button type="button" data-req="package">SOLICITAÇÃO DO EVENTO INTEIRO</button>`);
    /* o que mudou: contra o que foi enviado (se aguardando) ou contra o jogo */
    let diffHtml='';
    if(st==='alterada'){
      const ref=r.geom||null,lines=geomDiff(ref,m);
      diffHtml=`<div class="mpk-diff"><b>O QUE MUDOU DESDE O ${r.status==='applied'?'AJUSTE NO JOGO':'ENVIO'}</b>${lines?(lines.length?`<ul>${lines.map(l=>`<li>${esc(l)}</li>`).join('')}</ul>`:'<small>Somente arredondamento/ajustes mínimos.</small>'):'<small>Versão anterior registrada sem detalhe (antes da V12.9). A próxima solicitação passa a registrar.</small>'}</div>`;
    }
    if(ts&&st==='nojogo'){
      diffHtml+=`<div class="mpk-testbar ${!ts.done?'warn':(ts.ok===ts.total?'ok':'warn')}"><b>TESTES DO PADRÃO GÁS</b><small>${!ts.done?'Ainda não registrados — teste no jogo e registre':(ts.ok===ts.total?`Todos os ${ts.total} critérios OK`:`${ts.ok}/${ts.total} OK · falta: ${ts.falhas.slice(0,3).map(esc).join(' · ')}${ts.falhas.length>3?'…':''}`)}</small></div>`;
    }
    const log=m.requestLog||[];
    const logHtml=log.length?`<details class="mpk-log"><summary>HISTÓRICO DA SOLICITAÇÃO (${log.length})</summary><ol>${log.map(l=>`<li><b>${esc(fmtLogDate(l.at))}</b> ${esc(l.action)}${l.by?` <i>· ${esc(l.by)}</i>`:''}</li>`).join('')}</ol></details>`:'';
    box.innerHTML=`<div class="mpk-stage ${stale?'bad':info.tom}"><b>${info.label}${stale?' · ATRASADA':''}</b><small>${when}</small></div>${diffHtml}
      <ul class="mpk-checks">${checks.map(c=>`<li class="${c.ok?'ok':(c.block?'bad':(c.warn?'warn':'opt'))}">${c.ok?'✓':(c.block?'✕':(c.warn?'⚠':'○'))} ${esc(c.label)}</li>`).join('')}</ul>
      <div class="mp-actions">${actions.join('')}</div>${logHtml}`;
    qsa('[data-req]',box).forEach(b=>b.onclick=async()=>{
      const m=active();if(!m)return;
      if(b.dataset.req==='sent'){if(!generateRequest())return;const multi=splitDiscord(m.requestText).length>1;if(!multi)await copyText(m.requestText);if(markZoneSent(m)){saveStore();render();if(multi)openPartsModal(`SOLICITAÇÃO · ${m.event||'Evento'} › ${m.name||'Zona'}`,m.requestText);}}
      else if(b.dataset.req==='parts'){if(!generateRequest())return;openPartsModal(`SOLICITAÇÃO · ${m.event||'Evento'} › ${m.name||'Zona'}`,m.requestText);}
      else if(b.dataset.req==='applied'&&eventTypeOf(m).padrao){openTestsModal(m,true);}
      else if(b.dataset.req==='tests'){openTestsModal(m,false);}
      else if(b.dataset.req==='fill'){completeSpawns();}
      else if(b.dataset.req==='partidas'){openPartidasModal(m.eventId,m.id);}
      else if(b.dataset.req==='padrao'){openPadraoModal(m.eventId);}
      else if(b.dataset.req==='applied'){if(confirm(`Confirmar que a zona "${m.name}" já está disponível no ${panelLabel(m)}?`)&&markZoneApplied(m)){saveStore();render();}}
      else if(b.dataset.req==='cancel'){if(confirm(`Cancelar o envio da zona "${m.name}"? Use quando a cidade recusar/pedir ajuste ou se marcou por engano. A zona volta para ${m.request?.prev||m.request?.appliedBefore?'a versão que está no jogo':'PRONTA P/ ENVIAR'}.`)&&cancelZoneSent(m)){saveStore();render();}}
      else openEventPackage(m.eventId);
    });
  }

  /* Tipo do evento e tipo de solicitação no editor */
  function ensureEventKindUi(){
    const sel=qs('#mpEventKind');if(!sel||sel.dataset.ready)return;sel.dataset.ready='1';
    sel.innerHTML=(CATALOG()?.TIPOS||[]).map(t=>`<option value="${t.id}">${esc(t.label)}</option>`).join('');
    sel.addEventListener('change',()=>{
      const m=active();if(!m)return;if(!requireEdit()){syncEventKind();return;}
      const t=CATALOG()?.porId?.[sel.value];if(!t)return;
      zonesOfEvent(m.eventId).forEach(z=>{z.eventType=t.id;z.category=t.category;z.center=z.center||{};z.center.label=t.gas?'Centro do Gás / Marco Zero':'Centro da Zona do Evento';});
      state.libraryCategory=t.category;state.dirty=true;setSaveState('Tipo do evento alterado • NÃO SALVO');render();
    });
  }
  function syncEventKind(){
    const m=active(),sel=qs('#mpEventKind');if(!m||!sel)return;
    sel.value=eventTypeOf(m).id;sel.disabled=!state.editing;
    const rk=qs('#mpRequestKind');if(rk){rk.disabled=!state.editing||wasApplied(m);if(wasApplied(m))rk.title='Zona já existente no jogo: somente alteração.';}
    const hint=qs('#mpEventKindHint');if(hint){const t=eventTypeOf(m);const zs=zonesOfEvent(m.eventId).length;hint.innerHTML=`${t.notes.map(n=>`<span>• ${esc(n)}</span>`).join('')}${t.zonasPrevistas?`<span class="${zs<t.zonasPrevistas?'warn':''}">• ${zs}/${t.zonasPrevistas} zonas cadastradas</span>`:''}`;}
  }

  async function copyCurrentRequest(){if(!generateRequest())return;const m=active();if(!m?.requestText)return;await copyText(m.requestText);const b=qs('#mpCopyRequest');if(b){const old=b.textContent;b.textContent='COPIADO ✓';setTimeout(()=>b.textContent=old,900);}}

  function ensureCentralV954(){
    let host=qs('#mpCentralV954');
    if(host)return host;
    const shell=qs('.mission-planner-shell');if(!shell)return null;
    host=document.createElement('section');host.id='mpCentralV954';host.className='mp-central-v952';
    shell.insertAdjacentElement('beforebegin',host);return host;
  }
  function centralCategory(){return state.centralFilter||'all';}
  function selectEventForAction(eventId){
    const zones=zonesOfEvent(eventId),
z=zones[0];if(!z)return false;
    state.activeId=z.id;state.activeEventId=eventId;state.libraryCategory=z.category||'dominacao';saveStore();return true;
  }
  function renderCentralV954(){
    const host=ensureCentralV954();if(!host)return;
    const filter=centralCategory(),allEvents=[];
    ['dominacao','gas'].forEach(cat=>eventsOfCategory(cat).forEach(e=>allEvents.push({...e,category:cat})));
    const stages=state.missions.map(zoneStage);
    const cnt=k=>stages.filter(s=>s===k).length;
    const evStages=e=>zonesOfEvent(e.id).map(zoneStage);
    const pendFilter=e=>evStages(e).some(s=>s==='pronta'||s==='alterada'||s==='enviada');
    const events=filter==='all'?allEvents:filter==='pend'?allEvents.filter(pendFilter):allEvents.filter(e=>e.category===filter);
    const since=CATALOG()?.tempoDesde||(()=>'');
    const kpi=(n,l,tom,sub)=>`<div class="mpk-kpi ${tom||''}"><b>${n}</b><span>${l}</span>${sub?`<small>${sub}</small>`:''}</div>`;
    const staleN=state.missions.filter(isStale).length;
    host.innerHTML=`<div class="mpc-head"><div><span>EVENTOS · PAINEL ${esc(defaultPanel().toUpperCase())}</span><strong>${allEvents.length} eventos <i>•</i> ${state.missions.length} zonas${faccoesAtivas()?` <i>•</i> ${faccoesAtivas().length} facções ativas`:''}</strong></div><span id="mpCloudStateCentral" class="mp-cloud-state ${state.cloudState||'local'}">${state.cloudState==='synced'||state.cloudState==='ok'?'☁ SINCRONIZADO':'↻ SINCRONIZANDO'}</span></div>
      <div class="mpk-kpis">${kpi(cnt('nojogo'),'no /evento','ok')}${kpi(cnt('enviada'),'aguardando cidade',staleN?'bad':'warn',staleN?`${staleN} há +${retornoHoras()} h`:'')}${kpi(cnt('pronta'),'prontas p/ enviar','brand')}${kpi(cnt('alterada'),'alteradas após envio',cnt('alterada')?'bad':'')}${kpi(cnt('rascunho'),'em rascunho','')}</div>
      <div class="mpc-toolbar"><div class="mpc-filters"><button data-cfilter="all" class="${filter==='all'?'active':''}">TODOS</button><button data-cfilter="pend" class="${filter==='pend'?'active':''}">SOLICITAÇÕES EM ABERTO</button><button data-cfilter="dominacao" class="${filter==='dominacao'?'active':''}">DOMINAÇÃO</button><button data-cfilter="gas" class="${filter==='gas'?'active':''}">ZONA DE GÁS</button></div><button id="mpCentralNewEvent" class="mpc-primary">+ NOVO EVENTO</button></div>
      <div class="mpc-events">${events.length?events.map(e=>{
        const zones=zonesOfEvent(e.id),type=eventTypeOf(zones[0]||{category:e.category,event:e.name});
        const live=zones.filter(z=>zoneStage(z)==='nojogo'||wasApplied(z));
        const toSend=zones.filter(z=>['pronta','alterada'].includes(zoneStage(z))).length;
        const warns=[];
        if(type.zonasPrevistas&&zones.length<type.zonasPrevistas)warns.push(`${type.label}: ${zones.length}/${type.zonasPrevistas} zonas cadastradas`);
        const capW=capacityWarning(e.id);if(capW)warns.push(capW);
        const ei=eventInsights(e.id);
        zones.forEach(z=>{const zi=zoneInsights(z);if(zi.hot.length||zi.setor)warns.push(`${z.name||'Zona'}: ${zi.hot.length?`spawn ${zi.hot.map(h=>pad2(h.n)).join(', ')} vence acima do esperado`:`lado ${zi.setor.nome} vence demais`} — revisar`);});
        const tg=eventTarget(e.id);if(tg){const curtas=zones.filter(z=>(z.points||[]).length<tg.n);if(curtas.length)warns.push(`Meta de ${tg.n} facções (${tg.fonte}): ${curtas.map(z=>`${z.name||'Zona'} tem ${(z.points||[]).length}`).join(' · ')} — abra a zona e use GERAR SPAWNS QUE FALTAM`);}
        if(type.padrao){const semTeste=zones.filter(z=>{const ts=testStatus(z);return zoneStage(z)==='nojogo'&&ts&&(!ts.done||ts.ok<ts.total);});if(semTeste.length)warns.push(`Padrão gás: testes pendentes em ${semTeste.map(z=>z.name||'Zona').join(', ')}`);}
        if(type.zonasSeparadas)zoneOverlaps(e.id).forEach(o=>warns.push(`${o.a} × ${o.b}: áreas sobrepostas (${Math.round(o.d)} m entre centros, mínimo ${Math.round(o.lim)} m)`));
        const sugest=ei.sugestao?`<div class="mpp-sug">★ PRÓXIMA ZONA SUGERIDA: <b>${esc(ei.sugestao.z.name||'Zona')}</b><small>${ei.sugestao.last?`última partida ${since(ei.sugestao.last)}`:'sem partida registrada'}${ei.dominante?` • ${esc(ei.dominante.nome)} venceu ${ei.dominante.q} das últimas ${ei.dominante.de}`:''}</small></div>`:'';
        const preview=`<div class="mpk-preview"><span>NO ${esc(panelLabel(zones[0]).toUpperCase())}</span><b>${esc(e.name)}</b><i>›</i>${live.length?live.map(z=>`<em>${esc(z.name||'Zona')}</em>`).join(''):'<small>nenhuma zona confirmada no jogo</small>'}</div>`;
        return `<article class="mpc-event"><header><div><span>${esc(type.label)}</span><h3>${esc(e.name)}</h3><small>${zones.length} zona${zones.length===1?'':'s'} • ${live.length} no jogo${toSend?` • ${toSend} para enviar`:''}${(()=>{const c=eventCapacities(e.id).map(o=>o.cap);if(!c.length)return '';const a=Math.min(...c),b=Math.max(...c);return ` • ${a===b?`até ${a}`:`${a}–${b}`} facções`;})()}</small></div><div class="mpc-event-actions"><button data-package="${esc(e.id)}" class="${toSend?'hot':''}">SOLICITAÇÃO${toSend?` (${toSend})`:''}</button><button data-partidas="${esc(e.id)}" title="Registrar resultado e ver análise">PARTIDAS${partidasEvento(e.id).length?` (${partidasEvento(e.id).length})`:''}</button><button data-meta="${esc(e.id)}" title="Quantas facções o evento precisa comportar">META${eventTarget(e.id)?` ${eventTarget(e.id).n}`:''}</button>${type.padrao?`<button data-padrao="${esc(e.id)}">PADRÃO GÁS</button>`:''}<button data-newzone="${esc(e.id)}">+ NOVA ZONA</button><button class="danger" data-delevent="${esc(e.id)}">EXCLUIR</button></div></header>${preview}${sugest}${warns.length?`<div class="mpk-warns">${warns.map(w=>`<span>⚠ ${esc(w)}</span>`).join('')}</div>`:''}<div class="mpc-zones">${zones.map(z=>{const st=zoneStage(z),info=stageInfo(st),total=z.points?.length||0,val=(z.points||[]).filter(isValidated).length,extra=st==='enviada'?` • ${isStale(z)?'⚠ sem retorno ':''}${since(z.request?.sentAt)}`:'';return `<button class="mpc-zone" data-openzone="${esc(z.id)}"><span><b>${esc(z.name||'Zona sem nome')}</b><small>${total?`${val}/${total} validados`:'Sem pontos'}${extra}</small></span><em class="mpk-badge ${isStale(z)?'bad':info.tom}">${info.label}</em></button>`}).join('')||'<div class="mpc-empty">Nenhuma zona cadastrada.</div>'}</div></article>`;
      }).join(''):'<div class="mpc-empty big">Nenhum evento neste filtro.</div>'}</div>`;
    qsa('[data-cfilter]',host).forEach(b=>b.onclick=()=>{state.centralFilter=b.dataset.cfilter;renderCentralV954();});
    qsa('[data-openzone]',host).forEach(b=>b.onclick=()=>switchMission(b.dataset.openzone));
    qsa('[data-package]',host).forEach(b=>b.onclick=()=>openEventPackage(b.dataset.package));
    qsa('[data-padrao]',host).forEach(b=>b.onclick=()=>openPadraoModal(b.dataset.padrao));
    qsa('[data-meta]',host).forEach(b=>b.onclick=()=>setEventTarget(b.dataset.meta));
    qsa('[data-partidas]',host).forEach(b=>b.onclick=()=>openPartidasModal(b.dataset.partidas));
    qsa('[data-newzone]',host).forEach(b=>b.onclick=()=>{if(selectEventForAction(b.dataset.newzone))createZone();});
    qsa('[data-delevent]',host).forEach(b=>b.onclick=()=>{if(selectEventForAction(b.dataset.delevent))deleteEvent();});
    qs('#mpCentralNewEvent',host)?.addEventListener('click',()=>{if(filter==='dominacao'||filter==='gas')state.libraryCategory=filter;createEvent();});
  }

  function bindFormAutosave(){
    const map={mpMissionName:['name'],mpEventCategory:['category'],mpEventType:['event'],mpPanel:['panel'],mpMode:['mode'],mpRequestKind:['requestKind'],mpCenterLabel:['center','label'],mpCenterX:['center','x'],mpCenterY:['center','y'],mpCenterZ:['center','z'],mpCenterH:['center','h'],mpCircleRadius:['circleRadius'],mpStartAngle:['startAngle'],mpRadius:['spawnRadius']};
    Object.entries(map).forEach(([id,path])=>qs('#'+id)?.addEventListener((['mpMode','mpEventCategory','mpRequestKind'].includes(id))?'change':'input',e=>{const m=active();if(!m||!state.editing)return;let v=e.target.value;const oldCategory=m.category;if(['mpCenterX','mpCenterY','mpCenterZ','mpCenterH','mpCircleRadius','mpStartAngle','mpRadius'].includes(id))v=num(v);if(path.length===2){if((id==='mpCenterX'||id==='mpCenterY')&&Number(m.center[path[1]])!==Number(v)){m.center.z=0;m.center.h=0;m.center.status='planned';m.center.validatedAt=null;m.center.validationReason='coordinate-change';}m[path[0]][path[1]]=v;}else m[path[0]]=v;if(id==='mpEventType'){zonesOfEvent(m.eventId).forEach(z=>z.event=v);}if(id==='mpPanel'){zonesOfEvent(m.eventId).forEach(z=>z.panel=v);}if(id==='mpEventCategory'){zonesOfEvent(m.eventId).forEach(z=>z.category=v);}if(id==='mpEventCategory'&&oldCategory!==v){state.libraryCategory=v;if(v==='gas'){m.center.label='Centro do Gás / Marco Zero';}else{m.center.label='Centro da Zona do Evento';}/* trocar categoria não muda a CDS; mantém validação existente */}if(id==='mpMode'&&v==='assistant'){m.points.forEach(p=>{if(!p.validatedAt&&p.status!=='validated')p.status='planned';});}state.dirty=true;setSaveState('Alteração • NÃO SALVO');renderMap();renderCenterValidation();renderCoverage();if(id==='mpRadius'&&qs('#mpRadiusValue'))qs('#mpRadiusValue').textContent=`${v||100} m`; }));
  }

  function setWorkspace(open){
    state.workspaceOpen=!!open;
    const page=qs('#page-planejador');if(page)page.classList.toggle('mp-library-mode',!state.workspaceOpen);
    const bar=qs('#mpWorkspaceBar');if(bar)bar.hidden=!state.workspaceOpen;
    if(state.workspaceOpen)setTimeout(()=>{try{state.map?.invalidateSize();focusActiveMission(false)}catch(e){}},100);
  }
  function ensureWorkspaceBar(){
    const shell=qs('.mission-planner-shell');if(!shell||qs('#mpWorkspaceBar'))return;
    const bar=document.createElement('div');bar.id='mpWorkspaceBar';bar.className='mp-workspace-bar';
    bar.innerHTML=`<button type="button" id="mpBackLibrary">← VOLTAR ÀS MISSÕES</button><div class="mp-workspace-path"><b id="mpWorkspaceEvent">Evento</b><span>›</span><strong id="mpWorkspaceZone">Zona</strong></div><div class="mp-editor-actions"><button type="button" id="mpNewZone">+ NOVA ZONA</button><button type="button" id="mpReplicateZone">REPLICAR</button><button type="button" id="mpCloneZone">CLONAR</button><button type="button" id="mpDeleteMission" class="mp-delete-action">EXCLUIR ZONA</button><button type="button" id="mpEditMission">EDITAR</button><button type="button" id="mpSaveMission" class="primary" style="display:none">SALVAR</button><button type="button" id="mpCancelEdit" style="display:none">CANCELAR</button></div><span id="mpCloudState" class="mp-cloud-state local">⚠ MODO LOCAL</span>`;
    shell.insertAdjacentElement('beforebegin',bar);
    qs('#mpBackLibrary')?.addEventListener('click',()=>{if(state.editing&&state.dirty&&!confirm('Existem alterações não salvas. Deseja voltar às missões?'))return;if(state.editing)cancelEdit();setWorkspace(false);renderCentralV954();});
  }
  function renderWorkspaceBar(){
    const m=active();const ev=qs('#mpWorkspaceEvent'),zn=qs('#mpWorkspaceZone');if(ev)ev.textContent=m?.event||'Evento';if(zn)zn.textContent=m?.name||'Zona';
  }

  function bind(){
    if(state.initialized)return;state.initialized=true;loadStore();state.activeEventId=active()?.eventId||state.activeEventId;ensureCentralV954();ensureWorkspaceBar();ensureBackupCard();ensurePlannerTabs();ensureSafeRouteUi();adoptStrayCards();ensureMapKpis();ensureEventKindUi();ensureRequestStatusUi();initMap();render();renderWorkspaceBar();setWorkspace(false);bindFormAutosave();updateEditUi();
    qs('#mpEditMission')?.addEventListener('click',startEdit);qs('#mpSaveMission')?.addEventListener('click',saveMission);qs('#mpCancelEdit')?.addEventListener('click',cancelEdit);qs('#mpNewZone')?.addEventListener('click',createZone);qs('#mpCloneZone')?.addEventListener('click',cloneZone);qs('#mpReplicateZone')?.addEventListener('click',openReplicator);qs('#mpDeleteMission')?.addEventListener('click',deleteZone);
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
    if(t.includes('EXPORT')||t.includes('SOLICITA')||t.includes('PRINT')||t.includes('SEGURANÇA'))return 'entrega';
    if(t.includes('PONTO')||t.includes('SPAWN')||t.includes('LOTE')||t.includes('IMPORT')||t.includes('STATUS'))return 'pontos';
    return 'zona';
  }
  function plannerPanel(id){return qs(`.mp-tabpanel[data-tab="${id}"]`);}
  function adoptStrayCards(){
    const side=qs('.mission-planner-side');if(!side||!qs('#mpTabBar'))return;
    Array.from(side.children).forEach(el=>{
      if(!el.classList||!el.classList.contains('mp-card'))return;
      plannerPanel(el.dataset.forceTab||cardTabKey(el))?.appendChild(el);
    });
    const safe=qs('#mpSafeRouteBox');if(safe&&!safe.closest('.mp-tabpanel[data-tab="zona"]'))plannerPanel('zona')?.appendChild(safe);
  }
  function setPlannerTab(id){
    qsa('.mp-tab').forEach(b=>{const on=b.dataset.tab===id;b.classList.toggle('active',on);b.setAttribute('aria-selected',on?'true':'false');});
    qsa('.mp-tabpanel').forEach(p=>p.classList.toggle('active',p.dataset.tab===id));
    state.plannerTab=id;
    try{localStorage.setItem('highos_mp_tab',id);}catch(e){}
  }
  function fmtBackupData(iso){
    try{return new Date(iso).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}catch(e){return iso}
  }
  function renderBackupList(){
    const box=qs('#mpBackupList');if(!box)return;
    const lista=readBackups();
    box.innerHTML=lista.length?lista.map((b,i)=>
      `<div class="mp-backup-row"><div><b>${fmtBackupData(b.at)}</b><small>${b.qtd} missao(oes)</small></div><button type="button" data-restore="${i}">RESTAURAR</button></div>`
    ).join(''):'<div class="mp-note">Nenhum backup automatico ainda. Ele e criado a cada alteracao salva.</div>';
    qsa('[data-restore]',box).forEach(b=>b.onclick=()=>{
      const item=readBackups()[Number(b.dataset.restore)];
      if(!item)return;
      let dados=[];try{dados=JSON.parse(item.corpo)}catch(e){}
      const add=mergeMissions(dados);
      const el=qs('#mpBackupFeedback');
      if(el){el.className='mp-validation-feedback '+(add?'ok':'info');
        el.innerHTML=add?`<b>${add} missao(oes) recuperadas</b><span>Nada foi substituido: apenas o que faltava foi devolvido a lista.</span>`
                        :'<b>Nada a recuperar</b><span>Todas as missoes deste backup ja estao na lista atual.</span>';}
      renderBackupList();
    });
  }
  function baixarBackup(){
    try{
      const blob=new Blob([JSON.stringify(state.missions,null,2)],{type:'application/json'});
      const a=document.createElement('a');
      a.href=URL.createObjectURL(blob);
      a.download=`high-os-missoes-${new Date().toISOString().slice(0,10)}.json`;
      a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000);
    }catch(e){alert('Nao foi possivel gerar o arquivo: '+e.message)}
  }
  function restaurarArquivo(file){
    if(!file)return;
    const r=new FileReader();
    r.onload=()=>{
      let dados=[];
      try{dados=JSON.parse(String(r.result||'[]'))}catch(e){alert('Arquivo invalido.');return;}
      if(!Array.isArray(dados)){alert('O arquivo nao contem uma lista de missoes.');return;}
      const add=mergeMissions(dados);
      const el=qs('#mpBackupFeedback');
      if(el){el.className='mp-validation-feedback '+(add?'ok':'info');
        el.innerHTML=add?`<b>${add} missao(oes) importadas do arquivo</b>`:'<b>Nada novo no arquivo</b><span>Todas essas missoes ja existem aqui.</span>';}
    };
    r.readAsText(file);
  }
  function ensureBackupCard(){
    const side=qs('.mission-planner-side');
    if(!side||qs('#mpBackupCard'))return;
    const card=document.createElement('div');
    card.className='mp-card';card.id='mpBackupCard';
    card.innerHTML=`<h3>SEGURANÇA DAS MISSÕES</h3>
      <p class="mp-note">Cada alteração salva gera um backup automático neste navegador. Restaurar só devolve o que estiver faltando — nunca apaga uma missão atual.</p>
      <div class="mp-actions mp-actions-tight">
        <button type="button" id="mpBackupDownload">BAIXAR CÓPIA (.json)</button>
        <label class="mp-file-btn">RESTAURAR ARQUIVO<input id="mpBackupFile" type="file" accept="application/json" hidden></label>
      </div>
      <div id="mpBackupFeedback" class="mp-validation-feedback info">Backups automáticos das últimas 8 alterações.</div>
      <div id="mpBackupList" class="mp-backup-list"></div>`;
    side.appendChild(card);
    qs('#mpBackupDownload')?.addEventListener('click',baixarBackup);
    qs('#mpBackupFile')?.addEventListener('change',e=>{restaurarArquivo(e.target.files?.[0]);e.target.value='';});
    renderBackupList();
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
  function activate(){
    bind();
    // o mapa e criado dentro de uma secao que pode estar escondida: varias
    // remedidas garantem que o Leaflet enxergue o tamanho real
    [80,300,700,1400].forEach(ms=>setTimeout(()=>{try{state.map?.invalidateSize()}catch(e){}},ms));
    setTimeout(()=>{fit();},320);
    if(!state.resizeWatch&&window.ResizeObserver){
      const box=qs('#missionPlannerMap');
      if(box){
        state.resizeWatch=new ResizeObserver(()=>{try{state.map?.invalidateSize()}catch(e){}});
        state.resizeWatch.observe(box);
      }
    }
  }
  window.HighMissionPlanner={activate,fit,captureSnapshot,syncCloud:syncMissionsFromCloud,applyCloudMissions};
  document.addEventListener('DOMContentLoaded',()=>{if(qs('#missionPlannerMap'))bind();});
})();
