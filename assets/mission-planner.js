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
centerPending:true,
/* V12.18: rascunho de 25 spawns gerado pelo planejador (terra firme, fora de QG) — PENDENTES até validar a CDS no jogo */
draftPoints:[[4787.64,-4414.00],[5343.01,-5811.86],[4011.08,-4771.25],[5523.19,-5175.69],[4813.33,-5885.55],[4329.79,-4417.29],[5437.49,-5495.53],[4240.69,-4657.52],[4511.93,-4467.59],[5468.48,-5681.93],[5501.78,-5328.05],[5317.07,-5661.27],[4150.25,-4782.00],[4355.03,-4554.56],[5539.39,-5423.62],[5240.77,-5729.98],[5383.08,-5582.61],[4890.07,-4421.16],[5520.35,-5607.85],[5409.15,-5750.18],[4412.06,-4443.64],[4273.41,-4537.16],[4124.41,-4702.65],[4890.07,-5878.84],[5516.48,-5252.43]],
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
mapMode:'center',safeEditorStage:0,safePlacementStage:null,polygonPlacement:false,layerVisibility:{zone:true,spawns:true,center:true,access:false},proToolsReady:false,undoStack:[],redoStack:[],lastEditSnapshot:null,compareOverlay:false,safePresentation:false,safePresentationPrev:null,safeConfigView:false,safePreviewModel:null,safePreviewElapsed:0,safePreviewPlaying:false,safePreviewSpeed:1,safeTestPlayer:null,safeTestPlayerMarker:null,safePreviewCenterMarker:null,safeBots:[],safeBotLayer:null,safeBotLastElapsed:0,zoneProposal:null,safeHoverMarker:null,cloudMeta:{updatedAtText:'',updatedBy:''}};
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
  function normalizeZoneGeometry(m){
    if(!m)return false;let changed=false;const cat=m.category||((String(m.event||'').toLowerCase().includes('domina'))?'dominacao':'gas');
    if(cat==='dominacao'){if(!Array.isArray(m.zonePolygon)){m.zonePolygon=[];changed=true;}if(m.zoneMode!=='radius'&&m.zoneMode!=='polygon'){m.zoneMode=m.zonePolygon.filter(p=>validCoord(p?.x)&&validCoord(p?.y)).length>=3?'polygon':'radius';changed=true;}}
    return changed;
  }
  function inferLegacyStructure(m){
    normalizeZoneGeometry(m);if(m.eventId)return;
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
    m.requestKind=m.requestKind||(m.official?'alter-zone':'create-zone');normalizeZoneGeometry(m);
  }

  function dominationPolygon(m){return (m?.category||'dominacao')==='dominacao'&&Array.isArray(m?.zonePolygon)?m.zonePolygon.filter(p=>validCoord(p?.x)&&validCoord(p?.y)):[];}
  function dominationZoneMode(m){if((m?.category||'dominacao')!=='dominacao')return 'radius';const p=dominationPolygon(m);return m?.zoneMode||(p.length>=3?'polygon':'radius');}
  function activeDominationPolygon(m){return dominationZoneMode(m)==='polygon'?dominationPolygon(m):[];}
  function polygonArea(points){if(!points||points.length<3)return 0;let a=0;for(let i=0,j=points.length-1;i<points.length;j=i++)a+=Number(points[j].x)*Number(points[i].y)-Number(points[i].x)*Number(points[j].y);return Math.abs(a)/2;}
  function polygonPerimeter(points){if(!points||points.length<2)return 0;let d=0;for(let i=0;i<points.length;i++)d+=distXY(points[i],points[(i+1)%points.length]);return d;}
  function polygonCentroid(points){if(!points?.length)return null;if(points.length<3){const x=points.reduce((a,p)=>a+Number(p.x),0)/points.length,y=points.reduce((a,p)=>a+Number(p.y),0)/points.length;return {x,y};}let a=0,cx=0,cy=0;for(let i=0;i<points.length;i++){const p=points[i],q=points[(i+1)%points.length],cross=Number(p.x)*Number(q.y)-Number(q.x)*Number(p.y);a+=cross;cx+=(Number(p.x)+Number(q.x))*cross;cy+=(Number(p.y)+Number(q.y))*cross;}a*=.5;if(Math.abs(a)<1e-7)return {x:points.reduce((v,p)=>v+Number(p.x),0)/points.length,y:points.reduce((v,p)=>v+Number(p.y),0)/points.length};return {x:cx/(6*a),y:cy/(6*a)};}
  function dominationAnalysisCenter(m){const p=activeDominationPolygon(m),c=p.length>=3?polygonCentroid(p):null;return c||(validCoord(m?.center?.x)&&validCoord(m?.center?.y)?{x:Number(m.center.x),y:Number(m.center.y)}:null);}

  function dominationZoneGeometry(m){const p=dominationPolygon(m),raw=Array.isArray(m?.zonePolygon)?m.zonePolygon:[],mode=m?.zoneMode||(p.length>=3?'polygon':'radius');if(mode==='polygon'&&raw.some(v=>!validCoord(v?.x)||!validCoord(v?.y)))return {mode:'polygon-invalid',vertices:p.length,area:null,perimeter:null};if(mode==='polygon'&&p.length<3)return {mode:'polygon-incomplete',vertices:p.length,area:null,perimeter:null};if(mode!=='polygon')return {mode:'radius',vertices:0,area:Math.PI*Math.pow(effectiveEventRadius(m),2),perimeter:2*Math.PI*effectiveEventRadius(m)};return {mode:'polygon',vertices:p.length,area:polygonArea(p),perimeter:polygonPerimeter(p)};}
  function orient2d(a,b,c){return (Number(b.y)-Number(a.y))*(Number(c.x)-Number(b.x))-(Number(b.x)-Number(a.x))*(Number(c.y)-Number(b.y));}
  function segmentCross(a,b,c,d){const eps=1e-7,o1=orient2d(a,b,c),o2=orient2d(a,b,d),o3=orient2d(c,d,a),o4=orient2d(c,d,b),on=(p,q,r)=>Math.abs(orient2d(p,q,r))<=eps&&Number(r.x)>=Math.min(Number(p.x),Number(q.x))-eps&&Number(r.x)<=Math.max(Number(p.x),Number(q.x))+eps&&Number(r.y)>=Math.min(Number(p.y),Number(q.y))-eps&&Number(r.y)<=Math.max(Number(p.y),Number(q.y))+eps;if(((o1>eps&&o2<-eps)||(o1<-eps&&o2>eps))&&((o3>eps&&o4<-eps)||(o3<-eps&&o4>eps)))return true;return (Math.abs(o1)<=eps&&on(a,b,c))||(Math.abs(o2)<=eps&&on(a,b,d))||(Math.abs(o3)<=eps&&on(c,d,a))||(Math.abs(o4)<=eps&&on(c,d,b));}
  function polygonSelfIntersections(points){const hits=[];if(!points||points.length<4)return hits;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];for(let j=i+1;j<points.length;j++){if(j===i||j===(i+1)%points.length||(i===0&&j===points.length-1))continue;const c=points[j],d=points[(j+1)%points.length];if(segmentCross(a,b,c,d))hits.push([i+1,j+1]);}}return hits;}
  function dominationPolygonAudit(m){
    const raw=Array.isArray(m?.zonePolygon)?m.zonePolygon:[],indexed=raw.map((v,i)=>({v,i})).filter(x=>validCoord(x.v?.x)&&validCoord(x.v?.y)),p=indexed.map(x=>x.v),findings=[];
    const add=(level,message,action)=>findings.push({level,message,action});
    const pack=metrics=>({issues:findings.filter(x=>x.level==='BLOQUEIO').map(x=>x.message),warns:findings.filter(x=>x.level!=='BLOQUEIO'&&x.level!=='OK').map(x=>x.message),findings,metrics});
    if(!raw.length)return pack(null);
    const invalid=raw.map((v,i)=>({v,i})).filter(x=>!validCoord(x.v?.x)||!validCoord(x.v?.y)),pendingZ=raw.map((v,i)=>({v,i})).filter(x=>validCoord(x.v?.x)&&validCoord(x.v?.y)&&(!validCoord(x.v?.z)||x.v?.status!=='validated'));
    if(invalid.length)add('BLOQUEIO','CDS inválida(s) no polígono: '+invalid.map(x=>String(x.i+1).padStart(2,'0')).join(', ')+'.','Corrija X/Y dessas CDS. O sistema não deve unir os vértices vizinhos atravessando um ponto inválido.');
    if(pendingZ.length)add('ATENÇÃO','Vértice(s) pendente(s) de validação real no FiveM: '+pendingZ.map(x=>String(x.i+1).padStart(2,'0')).join(', ')+'.','Cole a CDS real X/Y/Z coletada no jogo e valide cada vértice antes da implementação.');
    if(p.length<3){add('BLOQUEIO','Polígono incompleto: são necessárias pelo menos 3 CDS válidas para fechar a Zona de Pontuação.','Adicione vértices seguindo a ordem real do contorno.');return pack(null);}
    if(invalid.length){add('ATENÇÃO','Auditoria geométrica suspensa até corrigir todas as CDS com X/Y inválidos.','Mantenha a numeração original e corrija somente as CDS inválidas.');return pack({area:null,perimeter:null,minSide:null,maxSide:null,compactness:null,crossings:null,invalidVertices:invalid.length,pendingZ:pendingZ.length,nearDuplicates:null,geometryDeferred:true});}
    const near=[];for(let i=0;i<p.length;i++)for(let j=i+1;j<p.length;j++){const d=distXY(p[i],p[j]);if(d<2)near.push([indexed[i].i+1,indexed[j].i+1,d]);}
    if(near.length)add('BLOQUEIO','Vértices duplicados/quase iguais: '+near.map(x=>String(x[0]).padStart(2,'0')+'↔'+String(x[1]).padStart(2,'0')+' ('+x[2].toFixed(1)+'m)').join(', ')+'.','Confirme no mapa qual CDS representa o contorno correto; não remova ou mova automaticamente.');
    const sides=p.map((v,i)=>distXY(v,p[(i+1)%p.length])),area=polygonArea(p),perimeter=polygonPerimeter(p),minSide=Math.min(...sides),maxSide=Math.max(...sides),meanSide=sides.reduce((x,y)=>x+y,0)/sides.length,sideStd=Math.sqrt(sides.reduce((x,y)=>x+Math.pow(y-meanSide,2),0)/sides.length),sideCv=meanSide?sideStd/meanSide:0,cross=polygonSelfIntersections(p),compactness=perimeter>0?(4*Math.PI*area)/(perimeter*perimeter):0;
    const xs=p.map(v=>Number(v.x)),ys=p.map(v=>Number(v.y)),width=Math.max(...xs)-Math.min(...xs),height=Math.max(...ys)-Math.min(...ys),shortAxis=Math.max(1,Math.min(width,height)),longAxis=Math.max(width,height),aspectRatio=longAxis/shortAxis;
    const hullArea=(()=>{const pts=p.map(v=>({x:Number(v.x),y:Number(v.y)})).sort((x,y)=>x.x-y.x||x.y-y.y);if(pts.length<3)return area;const cr=(o,x,y)=>(x.x-o.x)*(y.y-o.y)-(x.y-o.y)*(y.x-o.x),lo=[],up=[];pts.forEach(q=>{while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],q)<=0)lo.pop();lo.push(q);});for(let i=pts.length-1;i>=0;i--){const q=pts[i];while(up.length>=2&&cr(up[up.length-2],up[up.length-1],q)<=0)up.pop();up.push(q);}return polygonArea(lo.slice(0,-1).concat(up.slice(0,-1)));})();
    const concavity=hullArea>0?1-area/hullArea:0;
    if(cross.length){const edgeLabel=k=>{const x=indexed[k-1]?.i+1,y=indexed[k%p.length]?.i+1;return String(x).padStart(2,'0')+'→'+String(y).padStart(2,'0');},detail=cross.slice(0,6).map(x=>edgeLabel(x[0])+' × '+edgeLabel(x[1])).join(', ');add('BLOQUEIO','O contorno possui arestas que se cruzam, encostam ou se sobrepõem indevidamente'+(detail?': '+detail:'')+(cross.length>6?' (+'+(cross.length-6)+' conflito(s))':'')+'.','Revise a ordem das CDS ou a posição do vértice indicado; não publique enquanto houver cruzamento.');}
    if(area<10000)add('ALERTA','Área pequena (~'+Math.round(area).toLocaleString('pt-BR')+' m²).','Confira no jogo se há espaço suficiente para movimentação, cobertura e flancos.');
    if(minSide<25)add('ALERTA','Há lado muito curto no contorno (~'+Math.round(minSide)+' m).','Confira se existe CDS redundante, duplicada ou posicionada perto demais da vizinha.');
    if(maxSide>0&&minSide>0&&maxSide/minSide>8)add('ALERTA','Lados muito desproporcionais ('+Math.round(minSide)+'–'+Math.round(maxSide)+' m).','Confira se a ordem das CDS cria um salto grande ou um gargalo não intencional.');
    if(aspectRatio>4)add('ALERTA','Zona muito alongada: proporção aproximada '+aspectRatio.toFixed(1)+':1 ('+Math.round(width)+' × '+Math.round(height)+' m).','Revise se o formato cobre de fato vários quarteirões ou se virou um corredor estreito.');
    if(compactness<.18)add('ALERTA','Formato com baixa compactação ('+(compactness*100).toFixed(0)+'%).','Confira corredores, gargalos e pontas excessivas antes de implementar.');
    if(concavity>.35)add('ALERTA','Contorno muito côncavo: cerca de '+Math.round(concavity*100)+'% da envoltória externa fica recortada.','Verifique se as reentrâncias são intencionais e se não criam bolsões difíceis de entender dentro da cidade.');
    if(sideCv>.85)add('ATENÇÃO','Variação alta entre comprimentos dos lados (CV '+sideCv.toFixed(2)+').','Revise visualmente os trechos muito curtos e muito longos; isso pode indicar CDS fora de ordem.');
    if(!findings.some(x=>x.level==='BLOQUEIO')&&area>=10000&&aspectRatio<=4&&compactness>=.18&&concavity<=.35)add('OK','Geometria estrutural consistente para validação operacional.','Ainda confirme terreno, cobertura, acessos e CDS reais no FiveM antes de publicar.');
    return pack({area,perimeter,minSide,maxSide,meanSide,sideCv,compactness,crossings:cross.length,invalidVertices:invalid.length,pendingZ:pendingZ.length,nearDuplicates:near.length,width,height,aspectRatio,concavity,hullArea,geometryDeferred:false});
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
  function zoneCoverageCounts(m){const pts=(m?.points||[]).filter(p=>validCoord(p.x)&&validCoord(p.y)),radius=effectiveEventRadius(m),category=m?.category||'dominacao',geom=category==='dominacao'?dominationZoneGeometry(m):null;let inside=0,outside=0,unknown=0;pts.forEach(p=>{if(category==='dominacao'&&geom?.mode==='polygon'){if(pointInPolygon(p,activeDominationPolygon(m)))inside++;else outside++;}else if(category==='dominacao'&&['polygon-incomplete','polygon-invalid'].includes(geom?.mode))unknown++;else if(validCoord(m?.center?.x)&&validCoord(m?.center?.y)&&pointDistanceFromCenter(m,p)<=radius)inside++;else outside++;});return {inside,outside,unknown,total:pts.length,radius,mode:geom?.mode||'radius'};}

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
    let nums=t.match(/-?\d+(?:[.,]\d+)?/g)||[];
    let vals=nums.map(v=>Number(String(v).replace(',','.'))).filter(v=>Number.isFinite(v));
    // CDS copiada com vírgula decimal e separador por espaço: "123,45 -456,78 30,10 90"
    if(vals.length<2){nums=t.replace(/(\d),(\d)/g,'$1.$2').match(/-?\d+(?:\.\d+)?/g)||[];vals=nums.map(Number).filter(Number.isFinite);}
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
center:p.centerPending?{...p.center,z:0,status:'planned',validatedAt:null}:{...p.center,
status:'validated',
validatedAt:nowIso()},
circleRadius:p.radius,
eventRadius:null,
startAngle:0,
spawnRadius:100,
createdAt:nowIso(),
updatedAt:nowIso(),
points:(!p.points.length&&Array.isArray(p.draftPoints))?p.draftPoints.map((v,i)=>normalizePoint({x:v[0],y:v[1],z:0,h:0,status:'planned',validatedAt:null},i,'planned')):p.points.map((v,i)=>normalizePoint({x:v[0],
y:v[1],
z:v[2],
h:v[3],
status:'validated',
validatedAt:nowIso()},i,'validated')),
requestText:'',
requestKind:(!p.points.length&&p.draftPoints)?'create-zone':'alter-zone',
...((!p.points.length&&p.draftPoints)?{draftApplied:true}:{}),
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
official:false,zoneMode:cat==='dominacao'?'radius':null,zonePolygon:[]};
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
    // Recuperação V10.98.2: migração nunca apaga registros. Duplicatas/legados
    // permanecem disponíveis até uma revisão explícita do usuário.
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
  /* Fusão multi-PC: adiciona zonas novas e resolve a mesma zona pela versão
     mais recente. Em empate com conteúdo diferente, preserva o local e registra conflito. */
  function missionComparable(m){const x=JSON.parse(JSON.stringify(m||{}));delete x._syncConflict;delete x._rev;return JSON.stringify(x);}
  /* V12.7 - sincronização por zona.
     _rev (na zona)       = versão da nuvem que este navegador conhece;
     state.syncedHash[id] = assinatura do conteúdo na última sincronização;
     state.deletedIds     = zonas excluídas: backups e presets não podem recriá-las. */
  const DELETED_KEY='highos_mission_planner_deleted';
  const SYNCED_KEY='highos_mission_planner_synced';
  function loadSyncMeta(){
    try{state.deletedIds=new Set(JSON.parse(localStorage.getItem(DELETED_KEY)||'[]').map(String))}catch(e){state.deletedIds=new Set()}
    try{state.syncedHash=JSON.parse(localStorage.getItem(SYNCED_KEY)||'{}')||{}}catch(e){state.syncedHash={}}
  }
  function saveSyncMeta(){
    try{localStorage.setItem(DELETED_KEY,JSON.stringify([...state.deletedIds]));localStorage.setItem(SYNCED_KEY,JSON.stringify(state.syncedHash||{}));}catch(e){}
  }
  function zoneHash(m){const s=missionComparable(m);let h=5381;for(let i=0;i<s.length;i++)h=((h*33)^s.charCodeAt(i))>>>0;return h.toString(36)+':'+s.length;}
  function isPendingZone(m){return !!m&&state.syncedHash?.[String(m.id)]!==zoneHash(m);}
  function isEditingZone(m){return !!(m&&state.editing&&state.dirty&&m.eventId===active()?.eventId);}
  function cloudSummary(){return `☁ SINCRONIZADO · ${new Set(state.missions.map(m=>m.eventId).filter(Boolean)).size} eventos · ${state.missions.length} zonas`;}
  function missionTime(m){const t=Date.parse(m?.updatedAt||'');return Number.isFinite(t)?t:0;}
  function prepareIncoming(raw,id){
    const m=JSON.parse(JSON.stringify(raw||{}));if(!m.id)m.id=id;delete m._syncConflict;normalizeCenter(m);
    if(!m.category)m.category=(String(m.event||'').toLowerCase().includes('domina')?'dominacao':'gas');
    inferLegacyStructure(m);return m;
  }
  /* V12.7 - recebe entradas da nuvem: {id, rev, deleted, zona, legacy}.
     - exclusão na nuvem remove a zona aqui (se não estiver em edição);
     - versão maior na nuvem substitui a local, a menos que exista alteração
       local ainda não enviada: aí marca conflito e não sobrescreve nada. */
  function mergeMissions(entrada=[]){
    const result={added:0,updated:0,removed:0,keptLocal:0,conflicts:[]};
    if(!Array.isArray(entrada)||!entrada.length)return result;
    if(!state.deletedIds)loadSyncMeta();
    entrada.forEach(e=>{
      if(!e||!e.id)return;
      const id=String(e.id),idx=state.missions.findIndex(x=>String(x.id)===id),local=idx>=0?state.missions[idx]:null;
      if(e.deleted){
        state.deletedIds.add(id);delete state.syncedHash[id];
        if(!local)return;
        if(isEditingZone(local)){local._syncConflict={at:nowIso(),deleted:true,remote:null,by:e.deletedBy||e.updatedBy||'',when:e.deletedAtText||'',remoteRev:e.rev};result.keptLocal++;result.conflicts.push({id,name:local.name,resolution:'manual',deleted:true});return;}
        state.missions.splice(idx,1);result.removed++;return;
      }
      if(!e.zona)return;
      const m=prepareIncoming(e.zona,id);
      if(e.legacy){
        // Antes da migração: comportamento antigo, sem apagar nada.
        if(state.deletedIds.has(id))return;
        if(!local){state.missions.push(m);result.added++;return;}
        if(missionComparable(local)===missionComparable(m)||isEditingZone(local))return;
        if(missionTime(m)>missionTime(local)){state.missions[idx]=m;result.updated++;}
        return;
      }
      const remoteRev=Number(e.rev)||0;m._rev=remoteRev;
      state.deletedIds.delete(id);
      if(!local){state.missions.push(m);state.syncedHash[id]=zoneHash(m);result.added++;return;}
      const localRev=Number(local._rev)||0;
      if(missionComparable(local)===missionComparable(m)){local._rev=Math.max(localRev,remoteRev);delete local._syncConflict;state.syncedHash[id]=zoneHash(local);return;}
      if(remoteRev<=localRev)return; // alteração local ainda não enviada
      const pendenteLocal=localRev?isPendingZone(local):(missionTime(local)>missionTime(m));
      if(isEditingZone(local)||pendenteLocal){
        local._syncConflict={at:nowIso(),remote:m,by:e.updatedBy||'',when:e.updatedAtText||'',remoteRev};
        result.keptLocal++;result.conflicts.push({id,name:local.name,resolution:'manual',localAt:local.updatedAt||'',remoteAt:e.updatedAtText||''});return;
      }
      state.missions[idx]=m;state.syncedHash[id]=zoneHash(m);result.updated++;
    });
    if(result.added)baselineOfficialZones();
    saveSyncMeta();
    if(result.added||result.updated||result.removed){
      if(!state.missions.some(x=>x.id===state.activeId)){const f=state.missions[0];state.activeId=f?.id||null;state.activeEventId=f?.eventId||null;}
      try{localStorage.setItem(STORE,JSON.stringify(state.missions));localStorage.setItem(ACTIVE,state.activeId||'');}catch(err){}
      render();
    }
    return result;
  }

  /* Envia zonas com alteração local. Antes de qualquer gravação garante a
     migração do formato antigo (senão a coleção nova esconderia o restante). */
  async function syncPendingZones(lista){
    const cloud=window.HighOSMissionCloud;
    if(!cloud?.saveZones||!cloud.canEdit())return {ok:false,reason:'permission',conflicts:[]};
    const mig=await cloud.ensureMigrated(state.missions);
    if(!mig.ok)return {ok:false,reason:mig.reason||'migration',error:mig.error,conflicts:[]};
    if(mig.migrated){const res=await cloud.pull({force:true});if(res?.entries)mergeMissions(res.entries);}
    const ids=new Set((lista||[]).map(z=>String(z.id)));
    const alvo=state.missions.filter(z=>ids.has(String(z.id))&&isPendingZone(z));
    if(!alvo.length)return {ok:true,conflicts:[],sent:0};
    const r=await cloud.saveZones(alvo.map(z=>({zona:z,baseRev:Number(z._rev)||0})));
    (r.results||[]).forEach(x=>{
      const z=state.missions.find(m=>String(m.id)===x.id);if(!z)return;
      if(x.ok){z._rev=x.rev;delete z._syncConflict;state.syncedHash[x.id]=zoneHash(z);state.deletedIds.delete(x.id);}
      else if(x.conflict){z._syncConflict={at:nowIso(),remote:x.remote?.zona?prepareIncoming(x.remote.zona,x.id):null,deleted:!!x.remote?.deleted,by:x.remote?.deletedBy||x.remote?.updatedBy||'',when:x.remote?.deletedAtText||x.remote?.updatedAtText||'',remoteRev:x.remoteRev};}
    });
    saveSyncMeta();
    try{localStorage.setItem(STORE,JSON.stringify(state.missions));}catch(e){}
    const conflicts=(r.results||[]).filter(x=>x.conflict),grandes=(r.results||[]).filter(x=>x.tooBig);
    if(grandes.length)alert('Zona grande demais para salvar na nuvem (limite do Firestore): '+grandes.map(g=>g.id).join(', '));
    return {ok:!!r.ok,conflicts,error:r.error,sent:alvo.length};
  }

  /* Conflito: outra pessoa salvou a mesma zona depois que você abriu.
     A pessoa decide, zona por zona: manter a sua ou usar a da nuvem. */
  async function resolveZoneConflicts(){
    const cloud=window.HighOSMissionCloud;let resolvidas=0;
    const lista=state.missions.filter(z=>z._syncConflict&&!isEditingZone(z));
    for(const z of lista){
      const c=z._syncConflict,quem=c.by?` por ${c.by}`:'',quando=c.when?` em ${new Date(c.when).toLocaleString('pt-BR')}`:'';
      const texto=c.deleted
        ?`A zona "${z.name}" foi EXCLUÍDA${quem}${quando}.\n\nOK = manter a sua versão (restaura a zona)\nCancelar = aceitar a exclusão`
        :`A zona "${z.name}" foi alterada${quem}${quando} depois que você abriu.\n\nOK = manter a SUA versão (sobrescreve a da nuvem)\nCancelar = descartar a sua e usar a da nuvem`;
      if(confirm(texto)){
        const r=await cloud.saveZones([{zona:z,baseRev:c.remoteRev}]);const x=r.results?.[0];
        if(x?.ok){z._rev=x.rev;delete z._syncConflict;state.syncedHash[x.id]=zoneHash(z);state.deletedIds.delete(x.id);resolvidas++;}
      }else{
        const idx=state.missions.indexOf(z);
        if(c.deleted){state.missions.splice(idx,1);state.deletedIds.add(String(z.id));delete state.syncedHash[String(z.id)];}
        else if(c.remote){const m=c.remote;m._rev=c.remoteRev;state.missions[idx]=m;state.syncedHash[String(m.id)]=zoneHash(m);}
        resolvidas++;
      }
    }
    if(lista.length){saveSyncMeta();if(!state.missions.some(x=>x.id===state.activeId)){const f=state.missions[0];state.activeId=f?.id||null;state.activeEventId=f?.eventId||null;}saveStore();render();}
    return resolvidas;
  }

  /* Exclusão só acontece com a nuvem confirmando. Sem Firebase, nada é apagado. */
  async function deleteZonesSynced(zonas){
    const cloud=window.HighOSMissionCloud;
    if(!cloud?.deleteZones||!cloud.canEdit()){alert('A exclusão precisa do Firebase conectado e de permissão de edição no Planejador. Nada foi apagado.');return false;}
    setCloudState('sync','↻ EXCLUINDO NO FIREBASE...');
    const mig=await cloud.ensureMigrated(state.missions);
    if(!mig.ok){setCloudState('local','⚠ FIREBASE PENDENTE');alert('Não foi possível preparar a nuvem para excluir. Nada foi apagado.');return false;}
    if(mig.migrated){const res=await cloud.pull({force:true});if(res?.entries)mergeMissions(res.entries);}
    const revDe=z=>Number(state.missions.find(m=>m.id===z.id)?._rev??z._rev)||0;
    let r=await cloud.deleteZones(zonas.map(z=>({zona:z,baseRev:revDe(z)})));
    const jaExcluida=x=>x.conflict&&x.remote?.deleted;
    const conflitos=(r.results||[]).filter(x=>x.conflict&&!jaExcluida(x));
    let resultados=(r.results||[]).filter(x=>!x.conflict||jaExcluida(x)),erro=r.error;
    if(conflitos.length){
      const nomes=conflitos.map(c=>zonas.find(z=>String(z.id)===c.id)?.name||c.id).join('\n- ');
      if(!confirm(`Estas zonas foram alteradas por outra pessoa depois que você abriu:\n- ${nomes}\n\nExcluir mesmo assim?`)){setCloudState('ok',cloudSummary());return false;}
      const r2=await cloud.deleteZones(conflitos.map(c=>({zona:zonas.find(z=>String(z.id)===c.id),baseRev:c.remoteRev})));
      resultados=resultados.concat(r2.results||[]);erro=erro||r2.error;
    }
    const falhou=erro||resultados.length<zonas.length||resultados.some(x=>!x.ok&&!jaExcluida(x));
    if(falhou){setCloudState('local','⚠ FIREBASE PENDENTE');alert('Falha ao excluir no Firebase'+(erro?.message?': '+erro.message:'')+'. Nada foi apagado neste navegador.');return false;}
    zonas.forEach(z=>{state.deletedIds.add(String(z.id));delete state.syncedHash[String(z.id)];});
    saveSyncMeta();setCloudState('ok',cloudSummary());
    return true;
  }

  function saveStore(){
    try{
      localStorage.setItem(STORE,JSON.stringify(state.missions));
      localStorage.setItem(ACTIVE,state.activeId||'');
      if(!state.applyingCloud)localStorage.setItem(SAVED_AT,new Date().toISOString());
      pushBackup(state.missions);
    }catch(e){console.warn('Planejador: falha ao salvar',e);}
    // Persistência normal do Planejador é somente local.
    // Firebase recebe escrita apenas no SALVAR explícito (saveMission) ou no botão manual de sincronização.
  }
  function applyCloudMissions(list){
    const r=mergeMissions(list);return !!(r.added||r.updated);
  }

  window.addEventListener('highos:mission-cloud',e=>{const st=e?.detail?.state,err=e?.detail?.error;if(st==='sync')setCloudState('sync','↻ SALVANDO NO FIREBASE...');else if(st==='ok'){state.cloudMeta={updatedAtText:e?.detail?.updatedAtText||new Date().toISOString(),updatedBy:e?.detail?.updatedBy||state.cloudMeta?.updatedBy||''};setCloudState('ok',`☁ SINCRONIZADO · ${new Set(state.missions.map(m=>m.eventId).filter(Boolean)).size} eventos · ${state.missions.length} zonas`);}else if(st==='quota'){const suffix=err?.when?` • tentar após ${err.when}${err.estimated?' (estimado)':''}`:'';setCloudState('local','⚠ COTA FIREBASE ESGOTADA'+suffix);setSaveState('Cota do Firebase esgotada'+suffix+' • dados locais preservados');}else if(st==='permission'){setCloudState('local','⛔ SEM PERMISSÃO PARA SINCRONIZAR');setSaveState('Firebase recusou a gravação por permissão • dados locais preservados');}else if(st==='local')setCloudState('local','⚠ SALVO LOCAL • FIREBASE PENDENTE');});
  function setCloudState(kind,text){
    state.cloudState=kind;
    const els=[qs('#mpCloudState'),
qs('#mpCloudStateTop')].filter(Boolean);if(!els.length)return;
    els.forEach(el=>{el.className='mp-cloud-state '+kind;el.textContent=text||(kind==='ok'?'☁ SINCRONIZADO':kind==='sync'?'↻ SINCRONIZANDO...':'⚠ MODO LOCAL');});
  }
  async function forcePlannerCloudSync(){
    const cloud=window.HighOSMissionCloud;if(!cloud?.pull){setCloudState('local','⚠ FIREBASE INDISPONÍVEL');return;}
    const btn=qs('#mpForceCloudSync');if(btn){btn.disabled=true;btn.textContent='↻ SINCRONIZANDO...';}
    setCloudState('sync','↻ SINCRONIZANDO FIREBASE...');
    try{
      let res=await cloud.pull({force:true});
      if(res?.legacy&&cloud.canEdit()){const mig=await cloud.ensureMigrated(state.missions);if(mig.migrated)res=await cloud.pull({force:true});}
      const merge=mergeMissions(Array.isArray(res?.entries)?res.entries:[]);state.cloudMeta={updatedAtText:res?.pulledAt||new Date().toISOString(),updatedBy:''};
      if(cloud.canEdit()){const pend=state.missions.filter(z=>!isEditingZone(z)&&!z._syncConflict&&isPendingZone(z));if(pend.length){const sp=await syncPendingZones(pend);if(!sp.ok&&!sp.conflicts.length)throw sp.error||new Error('envio pendente falhou');}}
      await resolveZoneConflicts();
      setCloudState('ok',`☁ SINCRONIZADO · ${new Set(state.missions.map(m=>m.eventId).filter(Boolean)).size} eventos · ${state.missions.length} zonas`);
      setSaveState(`Firebase sincronizado ✓${merge.added?' • '+merge.added+' nova(s)':''}${merge.updated?' • '+merge.updated+' atualizada(s)':''}${merge.removed?' • '+merge.removed+' excluída(s)':''}`);
      render();
    }catch(e){
      console.warn('Planejador: sincronização manual falhou',e);setCloudState('local','⚠ FIREBASE PENDENTE');setSaveState('Falha ao sincronizar Firebase • dados locais preservados');
    }finally{const b=qs('#mpForceCloudSync');if(b){b.disabled=false;b.textContent='↻ SINCRONIZAR FIREBASE';}}
  }
  function syncMissionsFromCloud(tries=0){
    const cloud=window.HighOSMissionCloud;
    if(!cloud||!cloud.pull){if(tries<12)setTimeout(()=>syncMissionsFromCloud(tries+1),1500);else setCloudState('local');return;}
    setCloudState('sync');
    cloud.pull().then(async res=>{
      // V12.7 - a primeira abertura de quem edita converte o formato antigo (uma vez só, para toda a equipe).
      if(res?.legacy&&cloud.canEdit()&&cloud.ensureMigrated){const mig=await cloud.ensureMigrated(state.missions);if(mig.migrated){res=await cloud.pull({force:true});setStatus(`Planejador convertido para o novo formato da nuvem: ${mig.count} zona(s).`,'ok');}}
      const merge=mergeMissions(Array.isArray(res?.entries)?res.entries:[]);
      if(res){state.cloudMeta={updatedAtText:res.pulledAt||new Date().toISOString(),updatedBy:''};if(!(merge.added||merge.updated||merge.removed))render();}
      // Leitura pura: abrir/sincronizar nunca grava de volta no Firebase.
      // Escrita acontece somente no SALVAR explícito após alteração real.
      setCloudState('ok',`☁ SINCRONIZADO · ${new Set(state.missions.map(m=>m.eventId).filter(Boolean)).size} eventos · ${state.missions.length} zonas`);
      if(merge.added||merge.updated||merge.removed)setStatus(`${merge.added} nova(s) • ${merge.updated} atualizada(s) • ${merge.removed} excluída(s) pela equipe.`,'ok');
      if(state.missions.some(z=>z._syncConflict&&!isEditingZone(z)))await resolveZoneConflicts();
    }).catch(()=>setCloudState('local'));
  }

  function mergeOfficialPresets(){
    const byId=new Set(state.missions.map(m=>m.id));
    let changed=false;
    presets.forEach(p=>{
      if(state.deletedIds?.has(String(p.id)))return; // V12.7 - preset excluído não volta
      const existing=state.missions.find(m=>m.id===p.id);
      if(existing){
        const fresh=presetMission(p);
        ['eventId',
'event',
'name',
'category',
'panel'].forEach(k=>{if(existing[k]!==fresh[k]){existing[k]=fresh[k];changed=true;}});
        /* V12.18: zona oficial ainda vazia recebe o rascunho de spawns do preset (pendentes) */
        if(!(existing.points||[]).length&&Array.isArray(p.draftPoints)&&p.draftPoints.length&&!existing.draftApplied){existing.points=fresh.points;existing.draftApplied=true;if(!existing.request)existing.requestKind='create-zone';if(existing.request?.baseline&&!existing.request?.appliedAt)delete existing.request;existing.updatedAt=nowIso();changed=true;}
        return;
      }
      state.missions.push(presetMission(p));
      byId.add(p.id);changed=true;
    });
    return changed;
  }

  function persistBootStateLocalOnly(){
    try{
      localStorage.setItem(STORE,JSON.stringify(state.missions));
      localStorage.setItem(ACTIVE,state.activeId||'');
      pushBackup(state.missions);
    }catch(e){console.warn('Planejador: falha ao preservar estado local no boot',e);}
  }
  function recoverMissingFromLocalBackups(){
    const backups=readBackups();let recovered=0;
    const key=m=>m?.id||(`${String(m?.eventId||'')}|${normalizeText(m?.name||'')}`);
    const known=new Set(state.missions.map(key));
    backups.forEach(b=>{
      let list=[];try{list=JSON.parse(b?.corpo||'[]')}catch(e){}
      if(!Array.isArray(list))return;
      list.forEach(raw=>{
        if(!raw||!raw.id)return;
        if(state.deletedIds?.has(String(raw.id)))return; // V12.7 - zona excluída não volta do backup
        const k=key(raw);if(known.has(k))return;
        const m=JSON.parse(JSON.stringify(raw));delete m._syncConflict;normalizeCenter(m);
        if(!m.category)m.category=(String(m.event||'').toLowerCase().includes('domina')?'dominacao':'gas');
        inferLegacyStructure(m);state.missions.push(m);known.add(k);recovered++;
      });
    });
    return recovered;
  }
  function loadStore(){
    loadSyncMeta();
    let raw=null;
    try{raw=JSON.parse(localStorage.getItem(STORE)||'null')}catch(e){}
    if(Array.isArray(raw)&&raw.length){
      state.missions=raw;
      state.missions.forEach(m=>{delete m._syncConflict;normalizeCenter(m);if(!m.category)m.category=(String(m.event||'').toLowerCase().includes('domina')?'dominacao':'gas');inferLegacyStructure(m);});
    }else{
      // Nunca envia presets para o Firebase antes do primeiro pull.
      state.missions=presets.filter(p=>!state.deletedIds.has(String(p.id))).map(presetMission);
    }
    const recovered=recoverMissingFromLocalBackups();
    repairKnownZoneAssignments();repairFacxFacHierarchy();mergeOfficialPresets();baselineOfficialZones();
    const preferred=localStorage.getItem(ACTIVE)||raw?.[0]?.id||state.missions[0]?.id||null;
    state.activeId=state.missions.some(m=>m.id===preferred)?preferred:(state.missions[0]?.id||null);
    const am=state.missions.find(m=>m.id===state.activeId)||state.missions[0];
    state.libraryCategory=(am?.category||'dominacao');state.activeEventId=am?.eventId||null;
    // Boot é leitura pura: não grava cache, backup ou Firebase.
    if(recovered)console.info('Planejador: '+recovered+' missão(ões) recuperada(s) dos backups locais no boot.');
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
        // CRS GTA usa transformação própria; não aplicar limites XYZ WebMercator aqui.
        // O servidor/fallback decide se a coordenada existe.
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
  function updateMapDiagnostics(extra=''){
    const el=qs('#mpMapDiagnostics');if(!el)return;
    const base=qs('#mpLayerControl [data-base].active')?.dataset.base||'atlas',ok=state.tileCounters?.ok||0,err=state.tileCounters?.err||0,server=(Number(state.tileBase)||0)+1,cayo=!!(state.cayoLayer&&state.map?.hasLayer(state.cayoLayer)),postal=!!(state.cayoPostalLayer&&state.map?.hasLayer(state.cayoPostalLayer)),box=qs('#missionPlannerMap');
    el.textContent='Servidor '+server+'/'+remoteBases.length+' • '+base.toUpperCase()+' • tiles '+ok+' OK / '+err+' falha(s) • Cayo '+(cayo?'SAT':postal?'POSTAL':'OFF')+(box?' • '+box.clientWidth+'×'+box.clientHeight:'')+(extra?' • '+extra:'');
  }
  function mapNotice(texto,tipo='warn',comBotao=false){
    setStatus(texto,tipo);updateMapDiagnostics(texto);
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
  function attachMapLayerHealth(layers){
    let ok=0,err=0;Object.values(layers).forEach(l=>{l.on('tileload',()=>{ok++;mapNotice('Mapa GTA V carregado','ok',false)});l.on('tileerror',()=>{err++;updateMapDiagnostics('falha de tile')});watchOcean(l);});
    startMapWatchdog(()=>ok,()=>err);return {get ok(){return ok},get err(){return err}};
  }
  function replaceMapBases(baseIndex=0){
    if(!state.map)return;const current=qs('#mpLayerControl [data-base].active')?.dataset.base||'atlas';
    Object.values(state.mapLayers||{}).forEach(l=>{try{state.map.removeLayer(l)}catch(e){}});
    const layers={atlas:layer('styleAtlas','jpg',5,baseIndex),sat:layer('styleSatelite','jpg',5,baseIndex),grid:layer('styleGrid','png',5,baseIndex)};
    state.mapLayers=layers;state.atlasLayer=layers.atlas;state.satLayer=layers.sat;state.gridLayer=layers.grid;state.tileCounters=attachMapLayerHealth(layers);
    (layers[current]||layers.atlas).addTo(state.map);state.map.invalidateSize();
    return layers;
  }
  function reloadMapTiles(){
    if(!state.map)return;
    state.tileBase=((state.tileBase||0)+1)%remoteBases.length;
    mapNotice('Tentando outro servidor do mapa...','warn',false);
    replaceMapBases(state.tileBase);
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
        <div class="mp-layer-group"><span class="mp-layer-title">DIAGNÓSTICO</span><small id="mpMapDiagnostics" style="display:block;max-width:230px;line-height:1.45;opacity:.72">Aguardando mapa…</small><button type="button" id="mpMapDiagRefresh" style="margin-top:6px">ATUALIZAR</button></div>
      </div>`;
    host.appendChild(box);
    qs('#mpMapDiagRefresh',box)?.addEventListener('click',()=>{state.map?.invalidateSize();updateMapDiagnostics('diagnóstico atualizado');});
    if(window.L?.DomEvent){L.DomEvent.disableClickPropagation(box);L.DomEvent.disableScrollPropagation(box);}

    const trocarBase=chave=>{
      const live=state.mapLayers||bases;
      Object.entries(live).forEach(([k,l])=>{try{if(k===chave){if(!state.map.hasLayer(l))l.addTo(state.map);}else if(state.map.hasLayer(l))state.map.removeLayer(l);}catch(e){}});
      qsa('[data-base]',box).forEach(b=>b.classList.toggle('active',b.dataset.base===chave));
      state.oceanLocked=false;state.oceanTries=0;watchOcean(live[chave]);updateMapDiagnostics('base alterada');
    };
    qsa('[data-base]',box).forEach(b=>b.addEventListener('click',()=>trocarBase(b.dataset.base)));

    // Overlays de Cayo são ativados apenas quando a missão está em Cayo.
    qsa('[data-over]',box).forEach(inp=>{inp.checked=false;inp.addEventListener('change',()=>{
      const l=overlays[inp.dataset.over];if(!l)return;
      try{inp.checked?l.addTo(state.map):state.map.removeLayer(l)}catch(e){}
    });});

    const alternar=()=>{
      const aberto=box.classList.toggle('collapsed');
      box.querySelector('.mp-layer-toggle')?.setAttribute('aria-expanded',aberto?'false':'true');
      try{localStorage.setItem('highos_mp_layers_collapsed',aberto?'1':'0')}catch(e){}
    };
    box.querySelector('.mp-layer-toggle')?.addEventListener('click',alternar);
    /* V12.16: no celular o painel cobria metade do mapa — começa recolhido */
    try{const pref=localStorage.getItem('highos_mp_layers_collapsed');if(pref==='1'||(pref===null&&window.matchMedia?.('(max-width:700px)').matches))box.classList.add('collapsed');}catch(e){}
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
interactive:false});
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
    state.cayoBounds=cayoBounds;state.cayoOceanLayer=cayoOcean;state.cayoLayer=cayo;state.cayoPostalLayer=cayoPostal;state.atlasLayer=atlas;state.satLayer=sat;state.gridLayer=grid;
    let cayoOk=false;cayo.on('load',()=>{cayoOk=true;if(/cayo/i.test(active()?.name||'')||/cayo/i.test(active()?.event||''))mapNotice('Cayo Perico carregado','ok',false)});cayo.on('error',()=>{if(!cayoOk)mapNotice('Imagem de Cayo indisponível • coordenadas e ferramentas continuam funcionando','warn',true)});
    state.map.setView(ll(900,-600),3);
    state.tileBase=0;
    state.mapLayers={atlas,sat,grid};state.atlasLayer=atlas;state.satLayer=sat;state.gridLayer=grid;
    state.tileCounters=attachMapLayerHealth(state.mapLayers);
    let initialFallback=false;
    const initialErr=()=>{if(initialFallback||state.tileCounters.ok>0||state.tileCounters.err<=4)return;initialFallback=true;state.tileBase=1;mapNotice('Servidor principal falhou • alternando automaticamente…','warn',false);replaceMapBases(1);};
    [atlas,sat,grid].forEach(x=>x.on('tileerror',()=>setTimeout(initialErr,0)));
    applyOceanColor(OCEAN_FALLBACK);
    state.map.on('baselayerchange',ev=>{state.oceanLocked=false;watchOcean(ev.layer);setTimeout(()=>{if(!state.oceanLocked)applyOceanColor(OCEAN_FALLBACK);},1200);});
    state.map.on('mousemove',e=>{
      if(qs('#mpCursor')){const m=active(),sg=m?suggestedMapCoord(m,e.latlng):null;qs('#mpCursor').textContent=sg?`X ${f(sg.x)} | Y ${f(sg.y)} | Z~ ${sg.elevation.count?f(sg.z):'?'} | ${sg.elevation.confidence}%`:`X ${f(e.latlng.lng)} | Y ${f(e.latlng.lat)}`;}
      if(state.safePlacementStage!==null)previewSafePlacement(e.latlng);
    });
    state.map.on('click',e=>{
      const m=active();if(!m)return;
      if(!state.editing){if(qs('#mpClicked'))qs('#mpClicked').textContent='Modo visualização: clique em EDITAR EVENTO para alterar posições.';return;}
      const suggested=suggestedMapCoord(m,e.latlng);
      if(qs('#mpClicked'))qs('#mpClicked').innerHTML=`MAPA ${f(e.latlng.lng)}, ${f(e.latlng.lat)} → <b>CDS SUGERIDA ${f(suggested.x)}, ${f(suggested.y)}, ${suggested.elevation.count?f(suggested.z):'Z ?'}</b>${suggested.elevation.count?` • confiança Z ${suggested.elevation.confidence}% • ${suggested.elevation.count} ref.`:''}`;
      if(state.mapMode==='safe-stage'){placeSafeOnMap(e.latlng);return;}
      if(state.mapMode==='polygon'){if((m.category||'dominacao')!=='dominacao')return;if(!Array.isArray(m.zonePolygon))m.zonePolygon=[];m.zonePolygon.push({x:e.latlng.lng,y:e.latlng.lat,z:0,status:'planned',validatedAt:null,validationReason:'map-placement'});m.zoneMode='polygon';commit('Vértice '+String(m.zonePolygon.length).padStart(2,'0')+' marcado no mapa');return;}
      if(state.mapMode==='spawn'){m.points.push(normalizePoint({x:e.latlng.lng,y:e.latlng.lat,z:0,h:0,status:'planned'},m.points.length));commit('Ponto marcado no mapa');return;}
      if(state.mapMode!=='center')return;
      if((m.category||'dominacao')==='dominacao'&&dominationZoneMode(m)==='polygon'){if(qs('#mpClicked'))qs('#mpClicked').textContent=`${f(e.latlng.lng)},${f(e.latlng.lat)} • Polígono ativo: use MARCAR VÉRTICE NO MAPA`;return;}m.center.x=e.latlng.lng;m.center.y=e.latlng.lat;m.center.z=0;m.center.h=0;m.center.status='planned';m.center.validatedAt=null;m.center.validationReason='coordinate-change';syncForm();commit('Centro ajustado no mapa — validação removida');
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
  function clearLayers(){const compareLegend=qs('#mpCompareLegend');if(compareLegend)compareLegend.remove();state.drawn.forEach(o=>{try{state.map.removeLayer(o)}catch{}});state.drawn=[];}
  function drawCompareOverlay(){
    if(!state.compareOverlay||!state.editing||!state.map)return;const m=active(),old=state.editBackup?.zones?.find(z=>z.id===m?.id);if(!old)return;
    const oldPoly=dominationPolygon(old);
    if((old.category||'dominacao')==='dominacao'&&dominationZoneMode(old)==='polygon'&&oldPoly.length>=3){
      const z=L.polygon(oldPoly.map(p=>ll(p.x,p.y)),{weight:3,opacity:.78,fillOpacity:.012,dashArray:'4 8',color:'#9ca3af',interactive:false}).addTo(state.map);z._mpKind='compare';state.drawn.push(z);
      oldPoly.forEach((p,i)=>{const ic=L.divIcon({className:'',html:'<div style="min-width:20px;height:20px;border:1px dashed #d1d5db;border-radius:50%;background:rgba(17,24,39,.7);color:#e5e7eb;font:9px/18px system-ui;text-align:center">V'+(i+1)+'</div>',iconSize:[20,20],iconAnchor:[10,10]});const mk=L.marker(ll(p.x,p.y),{icon:ic,interactive:false}).addTo(state.map);mk._mpKind='compare';state.drawn.push(mk);});
    }else if(validCoord(old.center?.x)&&validCoord(old.center?.y)){
      const z=L.circle(ll(old.center.x,old.center.y),{radius:effectiveEventRadius(old),weight:2,opacity:.72,fillOpacity:.015,dashArray:'3 8',color:'#9ca3af',interactive:false}).addTo(state.map);z._mpKind='compare';state.drawn.push(z);
    }
    if(validCoord(old.center?.x)&&validCoord(old.center?.y)){const ci=L.divIcon({className:'',html:'<div style="width:18px;height:18px;border:2px dashed #d1d5db;border-radius:50%;background:rgba(17,24,39,.55)"></div>',iconSize:[18,18],iconAnchor:[9,9]});const cm=L.marker(ll(old.center.x,old.center.y),{icon:ci,interactive:false}).addTo(state.map);cm._mpKind='compare';state.drawn.push(cm);}
    if((m?.category||'dominacao')==='dominacao'){const before=dominationZoneGeometry(old),after=dominationZoneGeometry(m),ba=Number(before?.area),aa=Number(after?.area);if(Number.isFinite(ba)&&ba>0&&Number.isFinite(aa)&&aa>0){const pct=((aa-ba)/ba)*100,center=dominationAnalysisCenter(m)||dominationAnalysisCenter(old);if(center){const label=L.marker(ll(center.x,center.y),{interactive:false,icon:L.divIcon({className:'',html:'<div style="white-space:nowrap;transform:translate(-50%,-32px);background:rgba(17,24,39,.88);border:1px dashed #d1d5db;border-radius:8px;padding:4px 7px;color:#f3f4f6;font:10px system-ui">ANTES '+Math.round(ba).toLocaleString('pt-BR')+' m² → DEPOIS '+Math.round(aa).toLocaleString('pt-BR')+' m² ('+(pct>=0?'+':'')+pct.toFixed(1)+'%)</div>'})}).addTo(state.map);label._mpKind='compare';state.drawn.push(label);}}}
    (old.points||[]).forEach((p,i)=>{if(!validCoord(p.x)||!validCoord(p.y))return;const ic=L.divIcon({className:'',html:'<div style="min-width:20px;height:20px;padding:0 3px;border:1px dashed #d1d5db;border-radius:10px;background:rgba(17,24,39,.68);color:#e5e7eb;font:10px/18px system-ui;text-align:center">S'+(i+1)+'</div>',iconSize:[22,20],iconAnchor:[11,10]});const mk=L.marker(ll(p.x,p.y),{icon:ic,interactive:false}).addTo(state.map);mk._mpKind='compare';state.drawn.push(mk);});
    const host=qs('.mission-planner-mapwrap')||qs('#missionPlannerMap')?.parentElement;if(host){let legend=qs('#mpCompareLegend');if(!legend){legend=document.createElement('div');legend.id='mpCompareLegend';Object.assign(legend.style,{position:'absolute',right:'12px',bottom:'12px',zIndex:'901',background:'rgba(17,24,39,.9)',border:'1px dashed #d1d5db',borderRadius:'9px',padding:'7px 9px',fontSize:'10px',lineHeight:'1.55',color:'#f3f4f6',pointerEvents:'none'});host.appendChild(legend);}legend.innerHTML='<b>ANTES × DEPOIS</b><br>Tracejado = configuração anterior<br>V = vértice antigo • S = spawn antigo<br>Zona sólida = configuração atual';}
  }
  // V12.6 — rota progressiva da Safe: FECHA -> MOVE -> FECHA -> MOVE -> FECHA FINAL
  function hasDynamicSafe(m){return !!(m?.safeRoute&&Array.isArray(m.safeRoute.stages)&&m.safeRoute.stages.length);}
  function ensureSafeRoute(m,create=false){
    if(!m||((m.category||'dominacao')!=='gas'))return null;
    if(!hasDynamicSafe(m)){
      if(!create)return null;
      const initial=Math.max(100,Number(effectiveEventRadius(m))||1000);
      m.safeRoute={version:3,enabled:true,height:{bottom:-1000,top:2000},walkSpeed:5.2,safetyMargin:.85,stages:[
        {x:num(m.center?.x),y:num(m.center?.y),z:0,radius:Math.round(initial*.70),damage:5,closeSeconds:120,moveSeconds:90},
        {x:null,y:null,z:0,radius:Math.round(initial*.48),damage:10,closeSeconds:90,moveSeconds:75},
        {x:null,y:null,z:0,radius:Math.round(initial*.28),damage:20,closeSeconds:75,moveSeconds:60},
        {x:null,y:null,z:0,radius:Math.max(30,Math.round(initial*.12)),damage:35,closeSeconds:60,moveSeconds:0}
      ]};
    }
    const r=m.safeRoute;r.version=3;r.enabled=true;
    r.height=r.height&&typeof r.height==='object'?r.height:{bottom:-1000,top:2000};
    r.walkSpeed=Math.max(1,Number(r.walkSpeed)||5.2);r.safetyMargin=Math.max(.5,Math.min(1,Number(r.safetyMargin)||.85));
    delete r.stageOptions;delete r.stage2Options;delete r.stage3Options;
    r.stages=(Array.isArray(r.stages)?r.stages:[]).map((s,i)=>({...s,z:Number.isFinite(Number(s.z))?Number(s.z):0,radius:Math.max(1,Number(s.radius)||50),damage:Math.max(0,Number(s.damage)||0),closeSeconds:Math.max(0,Number(s.closeSeconds)||0),moveSeconds:i<(r.stages?.length||0)-1?Math.max(0,Number(s.moveSeconds)||0):0}));
    return r;
  }
  
  
  
  
  
  
  function safeStageValid(s){return !!s&&validCoord(s.x)&&validCoord(s.y)&&Number(s.radius)>0;}
  function safeInitialStage(m){
    const radius=Math.max(1,Number(effectiveEventRadius(m))||1000),cx=Number(m?.center?.x),cy=Number(m?.center?.y);
    return {x:Number.isFinite(cx)?cx:null,y:Number.isFinite(cy)?cy:null,z:Number(m?.center?.z)||0,radius,damage:0,closeSeconds:0,moveSeconds:0,label:'INICIAL'};
  }
  function safeTransitionSeconds(from,to,index){
    if(index===0)return Math.max(1,Number(to?.moveSeconds)||Number(to?.closeSeconds)||60);
    return Math.max(1,Number(from?.moveSeconds)||60);
  }
  function safeFinalCloseSeconds(r){const last=r?.stages?.[r.stages.length-1];return Math.max(1,Number(last?.closeSeconds)||60);}
  function safeTimeline(m){
    const r=ensureSafeRoute(m);if(!r)return [];const initial=safeInitialStage(m),stages=(r.stages||[]).filter(safeStageValid);if(!safeStageValid(initial)||!stages.length)return [];
    let at=0;const out=[{label:'RAIO INICIAL',at:0,radius:initial.radius,duration:0,type:'start'}],chain=[initial,...stages];
    for(let i=0;i<stages.length;i++){const from=chain[i],to=chain[i+1],transition=safeTransitionSeconds(from,to,i);at+=transition;out.push({label:(i===0?'INICIAL':'S'+i)+' → S'+(i+1),at,radius:to.radius,duration:transition,type:'transition'});if(i<stages.length-1){const hold=Math.max(0,Number(to.closeSeconds)||0);if(hold){at+=hold;out.push({label:'S'+(i+1)+' ATIVA',at,radius:to.radius,duration:hold,type:'hold'});}}}
    const final=stages[stages.length-1],finalClose=safeFinalCloseSeconds(r);at+=finalClose;out.push({label:'FECHAMENTO TOTAL',at,radius:0,duration:finalClose,type:'final-close'});return out;
  }
  function safeTotalSeconds(m){const tl=safeTimeline(m);return tl.length?tl[tl.length-1].at:0;}
  function formatDuration(sec){sec=Math.max(0,Math.round(Number(sec)||0));const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;return ((h?h+'h ':'')+(m?m+'min ':'')+(s||(!h&&!m)?s+'s':'')).trim();}
  function setSafeConfigView(on){state.safeConfigView=!!on;state.layerVisibility.spawns=!on;qsa('[data-mplayer="spawns"]').forEach(c=>c.checked=!on);const b=qs('#mpSafeFocus');if(b){b.textContent=on?'Mostrar spawns':'Ocultar spawns';b.title=on?'Voltar a exibir os spawns no mapa':'Esconder os spawns para enxergar só as safes';}renderMap();} // V12.8.1 - antes escondia e nunca reexibia
  
  function safeRouteAudit(m){
    const issues=[];
    if(!m||(m.category||'dominacao')!=='gas')return issues;
    const mandatory=/sobreviv[eê]ncia|battle\s*royal(?:e)?|batalha\s*real/i.test(String(m.event||''));
    const r=ensureSafeRoute(m);
    if(!r||!Array.isArray(r.stages)||!r.stages.length){
      if(mandatory)issues.push('A SAFE dinâmica deste evento ainda não foi configurada.');
      return issues;
    }
    const valid=r.stages.filter(safeStageValid);
    if(mandatory&&valid.length<3)issues.push('A SAFE precisa de pelo menos 3 etapas válidas.');
    if(valid.length!==r.stages.length)issues.push('Há SAFE(s) sem posição ou raio válido.');
    if(mandatory&&safeTotalSeconds(m)<1200)issues.push('O fechamento completo da SAFE deve durar pelo menos 1200 segundos.');
    const initial=safeInitialStage(m),chain=[initial,...r.stages];
    for(let i=1;i<chain.length;i++){
      const prev=chain[i-1],cur=chain[i];
      if(!safeStageValid(prev)||!safeStageValid(cur))continue;
      const displacement=Math.hypot(Number(cur.x)-Number(prev.x),Number(cur.y)-Number(prev.y));
      if(Number(cur.radius)>=Number(prev.radius))issues.push('S'+i+': o raio deve diminuir em relação à etapa anterior.');
      if(displacement+Number(cur.radius)>Number(prev.radius)+.01)
        issues.push('S'+i+': a SAFE está fora dos limites da etapa anterior.');
    }
    safeWalkAnalysis(m).forEach(a=>{
      if(!a.canEscape||a.physicalMargin<0)issues.push(a.from+' → '+a.to+': fechamento rápido demais para fugir a pé.');
      else if(a.pvpExtraNeeded>0)issues.push(a.from+' → '+a.to+': aumentar o deslocamento em '+a.pvpExtraNeeded+'s para margem de fuga.');
    });
    return issues;
  }
  
  

  
  

  

  function elevationSamples(){
    const out=[];state.missions.forEach(m=>{
      const add=(p,source)=>{if(!p||!validCoord(p.x)||!validCoord(p.y)||!Number.isFinite(Number(p.z))||Number(p.z)===0||!isValidated(p))return;out.push({x:Number(p.x),y:Number(p.y),z:Number(p.z),source,missionId:m.id});};
      add(m.center,'centro');(m.points||[]).forEach(p=>add(p,'spawn'));(m.zonePolygon||[]).forEach(p=>add(p,'zona'));
      const r=hasDynamicSafe(m)?m.safeRoute:null;(r?.stages||[]).forEach(p=>add(p,'safe'));
    });return out;
  }
  function estimateElevation(x,y){
    const samples=elevationSamples().map(p=>({...p,d:Math.hypot(Number(x)-p.x,Number(y)-p.y)})).sort((a,b)=>a.d-b.d).slice(0,8);
    if(!samples.length)return {z:0,confidence:0,count:0,nearest:null};
    const near=samples.filter(p=>p.d<=1200),use=(near.length>=2?near:samples.slice(0,Math.min(3,samples.length)));
    let sw=0,sz=0;use.forEach(p=>{const w=1/Math.max(25,p.d)**2;sw+=w;sz+=p.z*w;});
    const z=sw?sz/sw:use[0].z,nearest=samples[0],spread=use.reduce((a,p)=>a+Math.abs(p.z-z),0)/use.length;
    let confidence=Math.round(Math.max(5,Math.min(98,100-(nearest.d/15)-(spread*1.5)+(Math.min(use.length,5)*5))));
    if(nearest.d>1500)confidence=Math.min(confidence,25);else if(nearest.d>700)confidence=Math.min(confidence,50);
    return {z,confidence,count:use.length,nearest,spread};
  }
  function suggestedMapCoord(m,latlng){
    const c=calibrationModelAt(latlng.lng,latlng.lat),x=Number(latlng.lng)+(c?.dx||0),y=Number(latlng.lat)+(c?.dy||0),e=estimateElevation(x,y);
    return {x,y,z:e.z,elevation:e,calibration:c};
  }
  function calibrationReferences(){
    const refs=[];state.missions.forEach(m=>(m.calibrationRefs||[]).forEach(r=>{if([r.realX,r.realY,r.mapX,r.mapY].every(Number.isFinite))refs.push({...r,dx:Number(r.realX)-Number(r.mapX),dy:Number(r.realY)-Number(r.mapY)});}));
    return refs;
  }
  function calibrationModelAt(x,y){
    const refs=calibrationReferences().map(r=>({...r,d:Math.hypot(Number(x)-Number(r.mapX),Number(y)-Number(r.mapY))})).sort((a,b)=>a.d-b.d).slice(0,8);
    if(!refs.length)return null;const use=refs.filter(r=>r.d<=1800);const chosen=use.length?use:refs.slice(0,Math.min(3,refs.length));let sw=0,dx=0,dy=0;
    chosen.forEach(r=>{const w=1/Math.max(50,r.d)**2;sw+=w;dx+=r.dx*w;dy+=r.dy*w;});dx/=sw;dy/=sw;
    const error=chosen.reduce((a,r)=>a+Math.hypot(r.dx-dx,r.dy-dy),0)/chosen.length,nearest=chosen[0]?.d??Infinity;
    const confidence=Math.round(Math.max(5,Math.min(98,100-nearest/20-error*8+Math.min(chosen.length,5)*4)));
    return {dx,dy,count:chosen.length,error,nearest,confidence};
  }
  function ensureSafeRouteUi(){
    let box=qs('#mpSafeRouteBox');if(box)return;
    const anchor=qs('#mpCoverageBox')||qs('#mpCenterValidation'),zonePanel=plannerPanel('zona');if(!anchor&&!zonePanel)return;
    box=document.createElement('div');box.id='mpSafeRouteBox';box.className='mp-card mp-workflow-card mp-safe-workflow';box.dataset.forceTab='zona';box.style.marginTop='10px';
    box.innerHTML='<h3>SAFE DINÂMICA V3</h3><div id="mpSafeRouteStatus" class="mp-readout"></div><div id="mpSafeStageStrip" class="mp-actions" style="margin-top:8px;display:flex;gap:5px;flex-wrap:wrap"></div><div id="mpSafeStages"></div><div id="mpSafeValidator" class="mp-readout" style="margin-top:8px"></div><div class="mp-actions" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"><button type="button" id="mpSafeAuto" class="primary" title="SAFE automática: terreno, QGs e duração alvo do evento">⚡ AUTO</button><button type="button" id="mpSafePreview" class="primary" title="Simular fechamento e movimento da SAFE">▶</button><button type="button" id="mpSafePresent" title="Modo apresentação">⛶</button><button type="button" id="mpSafeRecord" title="Gravar simulação">●</button><button type="button" id="mpSafeFocus" title="Mostrar/ocultar spawns">◉</button><button type="button" id="mpRemoveSafeTop" title="Remover última SAFE">−</button></div>';
    if(anchor)anchor.insertAdjacentElement('afterend',box);else zonePanel.appendChild(box);
    qs('#mpSafeAuto')?.addEventListener('click',autoSafe);qs('#mpSafePreview')?.addEventListener('click',startSafePreview);qs('#mpSafePresent')?.addEventListener('click',startSafePresentation);qs('#mpSafeRecord')?.addEventListener('click',toggleSafeRecording);qs('#mpSafeFocus')?.addEventListener('click',()=>setSafeConfigView(!state.safeConfigView));qs('#mpRemoveSafeTop')?.addEventListener('click',removeDynamicSafeStage);
  }
  function safePlacementCheck(latlng){
    const idx=state.safePlacementStage,r=ensureSafeRoute(active());
    return idx===null||idx===undefined||!r?.stages?.[idx]||!latlng?{ok:false,reason:'Marcação inativa.'}:{ok:true,reason:'Clique para posicionar S'+(idx+1)};
  }
  function clearSafeHover(){
    if(state.safeHoverMarker&&state.map){try{state.map.removeLayer(state.safeHoverMarker)}catch(e){}}
    state.safeHoverMarker=null;
  }
  function previewSafePlacement(latlng){
    const m=active(),idx=state.safePlacementStage,r=ensureSafeRoute(m),stage=r?.stages?.[idx];if(!stage||!latlng)return;
    const radius=Math.max(1,Number(stage.radius)||1);
    if(!state.safeHoverMarker)state.safeHoverMarker=L.circle(latlng,{radius,weight:3,color:'#a855f7',fillColor:'#7e22ce',fillOpacity:.18,interactive:false}).addTo(state.map);
    else{state.safeHoverMarker.setLatLng(latlng);state.safeHoverMarker.setRadius(radius);state.safeHoverMarker.setStyle({color:'#a855f7',fillColor:'#7e22ce',fillOpacity:.18});}
    const mapEl=state.map?.getContainer();if(mapEl)mapEl.style.cursor='crosshair';
    const status=qs('#mpSafeRouteStatus');if(status)status.innerHTML='<b>POSICIONANDO S'+(idx+1)+'</b> • clique em qualquer ponto do mapa';
  }
  function beginSafePlacement(stageIndex){
    if(!requireEdit())return;const m=active(),r=ensureSafeRoute(m,true);if(!m||!r?.stages?.[stageIndex])return;
    resetMapPlacementModes();state.safeEditorStage=stageIndex;state.safePlacementStage=stageIndex;state.mapMode='safe-stage';
    const status=qs('#mpSafeRouteStatus');if(status)status.innerHTML='<b>POSICIONANDO S'+(stageIndex+1)+'</b> • clique no local desejado';
    if(state.map?.getContainer())state.map.getContainer().style.cursor='crosshair';
  }
  function placeSafeOnMap(latlng){
    const m=active(),idx=state.safePlacementStage;if(!m||idx===null||idx===undefined||!latlng)return false;
    const r=ensureSafeRoute(m,true),s=r?.stages?.[idx];if(!s)return false;
    s.x=latlng.lng;s.y=latlng.lat;s.z=estimateElevation?.(latlng.lng,latlng.lat)?.z||0;s.status='planned';
    state.safeEditorStage=idx;state.safePlacementStage=null;state.mapMode='center';clearSafeHover();
    if(state.map?.getContainer())state.map.getContainer().style.cursor='';
    commit('SAFE '+(idx+1)+' posicionada');state.map?.panTo(latlng);renderSafeRouteUi();renderMap();
    if(qs('#mpClicked'))qs('#mpClicked').textContent='SAFE '+(idx+1)+' • '+f(s.x)+', '+f(s.y);
    return true;
  }
  function safeStageMinRadius(index){return Number(index)>=3?10:30;}
  function addDynamicSafeStage(){
    if(!requireEdit())return;const m=active(),r=ensureSafeRoute(m,true);if(!m||!r)return;
    if(r.stages.length>=6){setSaveState('Limite operacional: 6 SAFEs.');return;}
    const prev=r.stages[r.stages.length-1],radius=Math.max(20,Math.round((Number(prev?.radius)||100)*.55)),damage=Math.max(5,(Number(prev?.damage)||0)+10);
    if(prev)prev.moveSeconds=Math.max(45,Number(prev.moveSeconds)||0);
    r.stages.push({x:null,y:null,z:0,radius,damage,closeSeconds:60,moveSeconds:0});state.safeEditorStage=r.stages.length-1;
    commit('SAFE '+r.stages.length+' adicionada');renderSafeRouteUi();
  }
  function removeSafeStage(index){
    if(!requireEdit())return;const r=ensureSafeRoute(active());if(!r||r.stages.length<=1)return;
    const i=Math.max(0,Math.min(Number(index)||0,r.stages.length-1)),label='S'+(i+1);
    r.stages.splice(i,1);if(r.stages.length)r.stages[r.stages.length-1].moveSeconds=0;
    state.safeEditorStage=Math.max(0,Math.min(i,r.stages.length-1));state.safePlacementStage=null;state.mapMode='center';
    commit(label+' removida');renderSafeRouteUi();renderMap();
  }
  function removeDynamicSafeStage(){const r=ensureSafeRoute(active());if(r?.stages?.length)removeSafeStage(r.stages.length-1);}
  function renderSafeRouteUi(){
    ensureSafeRouteUi();const box=qs('#mpSafeRouteBox'),m=active();if(!box||!m)return;const gas=(m.category||'dominacao')==='gas';box.style.display=gas?'block':'none';if(!gas)return;
    const host=qs('#mpSafeStages'),strip=qs('#mpSafeStageStrip'),status=qs('#mpSafeRouteStatus'),validator=qs('#mpSafeValidator');if(!host||!strip)return;
    if(!hasDynamicSafe(m)){host.innerHTML='<button type="button" id="mpEnableDynamicSafe" class="primary">CRIAR SAFE DINÂMICA</button>';strip.innerHTML='';validator.innerHTML='';qs('#mpEnableDynamicSafe')?.addEventListener('click',()=>{if(!requireEdit())return;ensureSafeRoute(m,true);commit('SAFE dinâmica criada');});return;}
    const r=ensureSafeRoute(m),open=Math.max(0,Math.min(Number(state.safeEditorStage)||0,r.stages.length-1));state.safeEditorStage=open;
    strip.innerHTML=r.stages.map((s,i)=>'<span style="display:inline-flex;gap:2px;align-items:center"><button type="button" data-safe-tab="'+i+'" title="Editar SAFE '+(i+1)+'" class="'+(i===open?'primary':'')+'">S'+(i+1)+'</button>'+(r.stages.length>1?'<button type="button" data-safe-delete="'+i+'" title="Remover SAFE '+(i+1)+'" aria-label="Remover SAFE '+(i+1)+'">🗑</button>':'')+'</span>').join('<span>→</span>')+(r.stages.length<4?'<button type="button" id="mpAddSafeTop" title="Adicionar próxima SAFE">＋</button>':'');
    qsa('[data-safe-tab]',strip).forEach(b=>b.onclick=()=>selectSafeStage(Number(b.dataset.safeTab),{focus:false}));qsa('[data-safe-delete]',strip).forEach(b=>b.onclick=e=>{e.stopPropagation();removeSafeStage(Number(b.dataset.safeDelete));});qs('#mpAddSafeTop')?.addEventListener('click',addDynamicSafeStage);
    const s=r.stages[open],pos=validCoord(s.x)&&validCoord(s.y);
    host.innerHTML='<section class="mp-safe-stage open"><div class="mp-grid"><label>Raio (m)<input data-safe-field="radius" type="number" min="1" value="'+s.radius+'"></label><label>Dano/s<input data-safe-field="damage" type="number" min="0" value="'+s.damage+'"></label><label>Espera (s)<input data-safe-field="closeSeconds" type="number" min="0" value="'+s.closeSeconds+'"></label>'+(open<r.stages.length-1?'<label>Movimento (s)<input data-safe-field="moveSeconds" type="number" min="1" value="'+s.moveSeconds+'"></label>':'')+'</div><div class="mp-actions"><button type="button" id="mpPlaceSelectedSafe" class="primary" title="Editar posição da S'+(open+1)+' no mapa">⌖</button><button type="button" id="mpFocusSelectedSafe" title="Enquadrar S'+(open+1)+'">◎</button>'+(r.stages.length>1?'<button type="button" id="mpDeleteSelectedSafe" title="Remover S'+(open+1)+'" aria-label="Remover S'+(open+1)+'">🗑</button>':'')+'</div><div class="mp-note">'+(pos?f(s.x)+', '+f(s.y):'Ainda sem posição')+' • altura lógica '+r.height.bottom+' → '+r.height.top+'</div></section>';
    qs('#mpPlaceSelectedSafe')?.addEventListener('click',()=>beginSafePlacement(open));qs('#mpFocusSelectedSafe')?.addEventListener('click',()=>focusSafeStage(open));qs('#mpDeleteSelectedSafe')?.addEventListener('click',()=>removeSafeStage(open));
    qsa('[data-safe-field]',host).forEach(inp=>inp.addEventListener('change',e=>{if(!requireEdit())return;const rr=ensureSafeRoute(active()),v=Number(e.target.value);if(!Number.isFinite(v))return;rr.stages[open][e.target.dataset.safeField]=Math.max(0,v);commit('S'+(open+1)+' alterada');}));
    const analyses=safeWalkAnalysis(m);validator.innerHTML=analyses.length?'<b>ESCAPE A PÉ</b><br>'+analyses.map(a=>'<div title="'+esc(a.detail)+'" style="margin:7px 0"><b>'+a.from+'→'+a.to+'</b> • '+(a.riskLevel==='comfortable'?'✓ ESCAPE CONFORTÁVEL':a.riskLevel==='tight'?'⚠ ESCAPE APERTADO':a.riskLevel==='critical'?'⚠ ESCAPE CRÍTICO':'✕ GÁS ALCANÇA O PLAYER')+'<br><small>Borda '+a.edgeSpeed.toFixed(2)+'m/s × player '+a.playerSpeed.toFixed(2)+'m/s • tempo '+a.seconds+'s • mínimo físico '+a.physicalMinimum+'s • margem '+(a.physicalMargin>=0?'+':'')+a.physicalMargin+'s<br>Recomendação PvP ≥ '+a.pvpRecommended+'s'+(a.pvpExtraNeeded>0?' • adicionar +'+a.pvpExtraNeeded+'s':' • margem PvP adequada')+' • raio destino '+Math.round(a.toRadius||0)+'m</small></div>').join(''):'<b>ESCAPE A PÉ</b><br>Posicione pelo menos duas SAFEs.';
    if(status){const missionSeconds=safeTotalSeconds(m),timeline=safeTimeline(m),movementSeconds=timeline.filter(x=>x.type==='transition').reduce((sum,x)=>sum+(Number(x.duration)||0),0),holdSeconds=timeline.filter(x=>x.type==='hold').reduce((sum,x)=>sum+(Number(x.duration)||0),0),finalSeconds=timeline.filter(x=>x.type==='final-close').reduce((sum,x)=>sum+(Number(x.duration)||0),0);status.innerHTML='<b>INICIAL → S1 → '+(r.stages.length>1?'S2'+(r.stages.length>2?' → S3':'')+(r.stages.length>3?' → S4':''):'')+'</b><br><span style="display:inline-block;margin-top:6px"><b>TEMPO TOTAL DA MISSÃO: '+formatDuration(missionSeconds)+'</b> <small>(alvo '+duracaoAlvo()+' min'+(missionSeconds&&missionSeconds<duracaoAlvo()*60*.9?' — curto: use ⚡ AUTO ou aumente os tempos':'')+')</small></span><br><small>Movimentação '+formatDuration(movementSeconds)+' • Esperas '+formatDuration(holdSeconds)+' • Fechamento final '+formatDuration(finalSeconds)+'</small><br><small>Raio inicial '+Math.round(effectiveEventRadius(m))+'m • S'+(open+1)+' '+(pos?'posicionada':'sem posição')+' • cada transição fecha e movimenta simultaneamente</small>';}
  }
  function selectSafeStage(index,{focus=true,cancelPlacement=true}={}){
    const m=active(),r=ensureSafeRoute(m);if(!r?.stages?.length)return false;
    const raw=Number(index);if(!Number.isInteger(raw))return false;
    const i=Math.max(0,Math.min(raw,r.stages.length-1));
    if(cancelPlacement&&(state.safePlacementStage!==null||state.mapMode==='safe-stage'))resetMapPlacementModes();
    state.safeEditorStage=i;
    renderMap();
    if(focus)focusSafeStage(i);
    return true;
  }
  function focusSafeStage(index){
    const m=active(),r=ensureSafeRoute(m);if(!state.map||!r)return;const i=Math.max(0,Math.min(Number(index)||0,r.stages.length-1)),st=r.stages[i];
    if(!safeStageValid(st))return;
    const radius=Math.max(80,Number(st.radius)||80),pad=Math.max(radius*1.35,160);
    try{state.map.fitBounds([[Number(st.y)-pad,Number(st.x)-pad],[Number(st.y)+pad,Number(st.x)+pad]],{maxZoom:5,animate:true,duration:.35});}catch(e){}
  }
  function safeTransitionGeometry(parent,child){
    if(!safeStageValid(parent)||!safeStageValid(child))return null;const dx=Number(child.x)-Number(parent.x),dy=Number(child.y)-Number(parent.y),distance=Math.hypot(dx,dy),shrink=Math.max(0,Number(parent.radius)-Number(child.radius)),seconds=Math.max(1,Number(parent.moveSeconds)||1),edgeTravel=distance+shrink,edgeSpeed=edgeTravel/seconds,bearing=(Math.atan2(dx,dy)*180/Math.PI+360)%360;
    return {distance,centerDistance:distance,shrink,edgeTravel,edgeSpeed,bearing,seconds,fromRadius:Number(parent.radius),toRadius:Number(child.radius)};
  }
  function safeBearingLabel(deg){const names=['N','NE','L','SE','S','SO','O','NO'];return names[Math.round(((deg%360)+360)%360/45)%8]+' '+Math.round(deg)+'°';}
  function safeWalkAnalysis(m){
    const r=ensureSafeRoute(m);if(!r)return [];const playerSpeed=Math.max(1,Number(r.walkSpeed)||5.2),safeSpeed=playerSpeed*(Number(r.safetyMargin)||.85),stages=r.stages.filter(safeStageValid),initial=safeInitialStage(m),chain=safeStageValid(initial)?[initial,...stages]:stages,out=[];
    for(let i=0;i<chain.length-1;i++){const a={...chain[i],moveSeconds:safeTransitionSeconds(chain[i],chain[i+1],i)},b=chain[i+1],g=safeTransitionGeometry(a,b);if(!g)continue;
      const recommended=Math.ceil(g.edgeTravel/safeSpeed),ratio=g.edgeSpeed/safeSpeed,status=ratio<=.8?'SEGURO':ratio<=1?'ATENÇÃO':'RISCO',canEscape=g.edgeSpeed<=playerSpeed,physicalMinimum=Math.ceil(g.edgeTravel/playerSpeed),physicalMargin=g.seconds-physicalMinimum,pvpMargin=15,pvpRecommended=physicalMinimum+pvpMargin,pvpExtraNeeded=Math.max(0,pvpRecommended-g.seconds),riskLevel=!canEscape||physicalMargin<0?'unsafe':physicalMargin<5?'critical':physicalMargin<15?'tight':'comfortable',maxShrinkForTime=Math.max(0,playerSpeed*g.seconds-g.centerDistance),minTargetRadius=Math.max(1,Math.ceil(Number(a.radius)-maxShrinkForTime)),recommendedRadius=Math.min(Number(a.radius),Math.max(Number(b.radius),minTargetRadius)),from=i===0?'INICIAL':'S'+i,to='S'+(i+1);
      out.push({from,to,...g,bearingLabel:safeBearingLabel(g.bearing),recommended,status,canEscape,playerSpeed,recommendedRadius,physicalMinimum,physicalMargin,pvpRecommended,pvpExtraNeeded,riskLevel,detail:'Centro '+Math.round(g.centerDistance)+'m + redução '+Math.round(g.shrink)+'m = avanço máximo '+Math.round(g.edgeTravel)+'m. Player '+playerSpeed.toFixed(2)+'m/s. Mínimo físico '+physicalMinimum+'s; configurado '+g.seconds+'s; margem '+(physicalMargin>=0?'+':'')+physicalMargin+'s; recomendação PvP ≥ '+pvpRecommended+'s (15s de margem).'});
    }return out;
  }
  
  
  function drawSafeRoute(m){
    if(!state.map||!m||((m.category||'dominacao')!=='gas'))return;const r=ensureSafeRoute(m);if(!r)return;const selected=Math.max(0,Math.min(Number(state.safeEditorStage)||0,r.stages.length-1)),purple='#8b5cf6';
    const positioned=r.stages.filter(s=>safeStageValid(s));if(positioned.length>1){const line=L.polyline(positioned.map(s=>ll(s.x,s.y)),{color:'#c084fc',weight:3,dashArray:'9 7',opacity:.8,interactive:false}).addTo(state.map);state.drawn.push(line);}
    r.stages.forEach((s,i)=>{if(!safeStageValid(s))return;const current=i===selected,circle=L.circle(ll(s.x,s.y),{radius:Number(s.radius),weight:current?4:2,color:purple,opacity:current?1:.55,fillColor:'#7c3aed',fillOpacity:current?.22:.09,interactive:false}).addTo(state.map);
      const icon=L.divIcon({className:'',html:'<div class="mp-center-pin" style="background:'+(current?'#6d28d9':'#312e81')+';font-size:11px;font-weight:900">S'+(i+1)+'</div>',iconSize:[current?38:32,current?38:32],iconAnchor:[current?19:16,current?19:16]});
      const pin=L.marker(ll(s.x,s.y),{icon,interactive:true,draggable:!!state.editing&&current&&!state.safePresentation}).addTo(state.map).bindPopup('<b>SAFE '+(i+1)+'</b><br>Raio '+Math.round(s.radius)+'m<br>Dano '+s.damage+'/s<br>Vertical '+r.height.bottom+' → '+r.height.top);
      circle._mpKind='safe';pin._mpKind='safe';pin.on('click',()=>selectSafeStage(i));if(state.editing&&current&&!state.safePresentation){pin.on('drag',e=>circle.setLatLng(e.target.getLatLng()));pin.on('dragend',e=>{const p=e.target.getLatLng();s.x=p.lng;s.y=p.lat;s.z=estimateElevation?.(p.lng,p.lat)?.z||0;commit('S'+(i+1)+' reposicionada');});}state.drawn.push(circle,pin);
    });
  }
  function stopSafePreview(){
    if(state.safePreviewTimer){clearInterval(state.safePreviewTimer);state.safePreviewTimer=null;}
    state.safePreviewModel=null;state.safePreviewElapsed=0;state.safePreviewPlaying=false;
    if(state.safePreviewLayer&&state.map){try{state.map.removeLayer(state.safePreviewLayer)}catch{}state.safePreviewLayer=null;}
    if(state.safePreviewMask&&state.map){try{state.map.removeLayer(state.safePreviewMask)}catch{}state.safePreviewMask=null;}
    if(state.safePreviewRouteLayer&&state.map){try{state.map.removeLayer(state.safePreviewRouteLayer)}catch{}state.safePreviewRouteLayer=null;}if(state.safePreviewCenterMarker&&state.map){try{state.map.removeLayer(state.safePreviewCenterMarker)}catch{}state.safePreviewCenterMarker=null;}
    const hud=qs('#mpSafePreviewHud');if(hud)hud.remove();
    if(state.safeTestPlayerMarker&&state.map){try{state.map.removeLayer(state.safeTestPlayerMarker)}catch{}state.safeTestPlayerMarker=null;}
    state.safeTestPlayer=null;clearSafeBots();qs('#mpSafeTimeline')?.remove();qs('#mpSafeTimelineSim')?.remove();
  }
  function ensurePreviewHud(){
    let hud=qs('#mpSafePreviewHud');if(hud)return hud;const wrap=qs('#missionPlannerMap')?.parentElement;if(!wrap)return null;
    if(getComputedStyle(wrap).position==='static')wrap.style.position='relative';
    hud=document.createElement('div');hud.id='mpSafePreviewHud';Object.assign(hud.style,{position:'absolute',top:'16px',left:'50%',transform:'translateX(-50%)',zIndex:'10050',background:'rgba(8,10,18,.88)',border:'1px solid rgba(192,132,252,.7)',borderRadius:'12px',padding:'10px 16px',color:'#fff',fontWeight:'700',fontFamily:'system-ui',textAlign:'center',pointerEvents:'none',boxShadow:'0 10px 30px rgba(0,0,0,.35)'});wrap.appendChild(hud);return hud;
  }
  function fitSafeRouteForPresentation(){
    const m=active(),r=ensureSafeRoute(m);if(!m||!r||!state.map)return;const pts=(r.stages||[]).filter(safeStageValid).map(p=>ll(p.x,p.y));
    if(pts.length>1)state.map.fitBounds(L.latLngBounds(pts).pad(.18),{maxZoom:5});else if(pts.length)state.map.setView(pts[0],4);
  }
  function startSafePresentation(){
    const m=active(),r=ensureSafeRoute(m);if(!m||!r||!safeStageValid(r.stages[0])){alert('Configure a rota da Safe antes de apresentar.');return;}
    const el=qs('#missionPlannerMap')?.closest('.mp-map-card')||qs('#missionPlannerMap');if(!el)return;
    state.safePresentationPrev={fullscreen:el.classList.contains('mp-pro-fullscreen'),layerVisibility:{...state.layerVisibility}};
    state.safePresentation=true;el.dataset.safePresentation='1';Object.assign(el.style,{position:'fixed',inset:'0',zIndex:'100000',background:'#05070d',padding:'0'});
    const map=qs('#missionPlannerMap');if(map)map.style.height='100vh';
    qsa('.mp-map-toolbar,.mp-map-status,.leaflet-control-container',el).forEach(x=>{x.dataset.mpPresentationDisplay=x.style.display||'';x.style.display='none';});
    const legend=qs('#mpMapLegend');if(legend)legend.style.display='none';
    // Modo gravação: mantém somente o mapa base e a Safe animada.
    (state.drawn||[]).forEach(l=>{try{if(state.map?.hasLayer(l))state.map.removeLayer(l);}catch(e){}});
    let title=qs('#mpPresentationTitle');if(!title){title=document.createElement('div');title.id='mpPresentationTitle';Object.assign(title.style,{position:'absolute',top:'16px',left:'16px',zIndex:'10040',background:'rgba(5,7,13,.82)',border:'1px solid rgba(255,255,255,.14)',borderRadius:'10px',padding:'9px 12px',color:'#fff',font:'700 13px system-ui',pointerEvents:'none'});el.appendChild(title);}title.innerHTML='SOBREVIVÊNCIA • '+esc(m.name||'ZONA')+'<br><small style="opacity:.65;font-weight:500">Preview visual • ESC para sair</small>';
    setTimeout(()=>{state.map?.invalidateSize();fitSafeRouteForPresentation();setTimeout(startSafePreview,180);},100);
  }
  function exitSafePresentation(){
    if(!state.safePresentation)return;state.safePresentation=false;const prev=state.safePresentationPrev||{},el=qs('[data-safe-presentation="1"]');if(el){delete el.dataset.safePresentation;const wasFullscreen=!!prev.fullscreen;Object.assign(el.style,wasFullscreen?{position:'fixed',inset:'0',zIndex:'99999',background:'#0b1018',padding:'12px'}:{position:'',inset:'',zIndex:'',background:'',padding:''});const map=qs('#missionPlannerMap');if(map)map.style.height=wasFullscreen?'calc(100vh - 24px)':'';qsa('.mp-map-toolbar,.mp-map-status,.leaflet-control-container',el).forEach(x=>{x.style.display=x.dataset.mpPresentationDisplay||'';delete x.dataset.mpPresentationDisplay;});}
    qs('#mpPresentationTitle')?.remove();state.safePresentationPrev=null;renderMap();const legend=qs('#mpMapLegend');if(legend)legend.style.display=qs('#mpLegendToggle')?.checked===false?'none':'';setTimeout(()=>state.map?.invalidateSize(),80);
  }
  function safeGasMask(center,radius){
    if(!state.map||!center)return null;
    const bounds=[[-12000,-12000],[-12000,12000],[12000,12000],[12000,-12000]];
    const hole=[];for(let deg=0;deg<=360;deg+=4){const a=deg*Math.PI/180;hole.push(ll(Number(center.x)+Math.sin(a)*Number(radius),Number(center.y)+Math.cos(a)*Number(radius)));}
    return L.polygon([bounds,hole],{stroke:false,fillColor:'#6d28d9',fillOpacity:.68,fillRule:'evenodd',interactive:false,pane:'overlayPane'}).addTo(state.map);
  }
  function updateSafeGasMask(center,radius){
    if(!state.map||!center)return;
    const bounds=[[-12000,-12000],[-12000,12000],[12000,12000],[12000,-12000]],hole=[];
    for(let deg=0;deg<=360;deg+=4){const a=deg*Math.PI/180;hole.push(ll(Number(center.x)+Math.sin(a)*Number(radius),Number(center.y)+Math.cos(a)*Number(radius)));}
    if(state.safePreviewMask)state.safePreviewMask.setLatLngs([bounds,hole]);else state.safePreviewMask=safeGasMask(center,radius);
    state.safePreviewMask?.bringToFront?.();state.safePreviewLayer?.bringToFront?.();
  }

  function safeTestPlayerStatus(center,radius,damage){
    const p=state.safeTestPlayer;if(!p||!center)return null;const distance=distXY(p,center),margin=Number(radius)-distance,inside=margin>=0;
    return {distance,margin,inside,damage:inside?0:(Number(damage)||0)};
  }
  function updateSafeTestPlayerMarker(){
    if(!state.map||!state.safeTestPlayer)return;
    if(!state.safeTestPlayerMarker){
      const icon=L.divIcon({className:'',html:'<div id="mpSafeTestPlayerPin" style="width:28px;height:28px;border-radius:50%;background:#111827;border:3px solid #fff;color:#fff;font:900 12px/22px system-ui;text-align:center;box-shadow:0 4px 14px rgba(0,0,0,.5)">P</div>',iconSize:[28,28],iconAnchor:[14,14]});
      state.safeTestPlayerMarker=L.marker(ll(state.safeTestPlayer.x,state.safeTestPlayer.y),{icon,draggable:true,zIndexOffset:2000}).addTo(state.map);
      state.safeTestPlayerMarker.on('drag',e=>{const n=e.target.getLatLng();state.safeTestPlayer={x:n.lng,y:n.lat};safePreviewAt(state.safePreviewElapsed);});
    }else state.safeTestPlayerMarker.setLatLng(ll(state.safeTestPlayer.x,state.safeTestPlayer.y));
  }
  function toggleSafeTestPlayer(){
    if(state.safeTestPlayer){if(state.safeTestPlayerMarker&&state.map){try{state.map.removeLayer(state.safeTestPlayerMarker)}catch{}}state.safeTestPlayer=null;state.safeTestPlayerMarker=null;safePreviewAt(state.safePreviewElapsed);return;}
    const model=state.safePreviewModel;if(!model?.route?.length)return;const s=model.route[0];state.safeTestPlayer={x:Number(s.x),y:Number(s.y)};updateSafeTestPlayerMarker();safePreviewAt(state.safePreviewElapsed);
  }
  function clearSafeBots(){if(state.safeBotLayer&&state.map){try{state.map.removeLayer(state.safeBotLayer)}catch(e){}}state.safeBotLayer=null;state.safeBots=[];state.safeBotLastElapsed=0;}
  function initSafeBots(m,initial){
    clearSafeBots();if(!state.map||!m)return;const spawns=(m.points||[]).filter(p=>validCoord(p.x)&&validCoord(p.y));if(!spawns.length)return;
    state.safeBotLayer=L.layerGroup().addTo(state.map);const total=70,per=Math.max(1,Math.floor(total/spawns.length));let made=0;
    for(let si=0;si<spawns.length&&made<total;si++){const count=Math.min(total-made,si===spawns.length-1?total-made:per);for(let j=0;j<count&&made<total;j++,made++){const ang=(j/Math.max(1,count))*Math.PI*2+(si*.37),spread=5+(j%5)*2,x=Number(spawns[si].x)+Math.cos(ang)*spread,y=Number(spawns[si].y)+Math.sin(ang)*spread,team=si%10;
      const mk=L.circleMarker(ll(x,y),{radius:3.2,weight:1,color:'#fff',opacity:.95,fillColor:['#60a5fa','#f87171','#34d399','#fbbf24','#c084fc','#fb7185','#22d3ee','#a3e635','#f97316','#818cf8'][team],fillOpacity:.95,interactive:false,pane:'markerPane'}).addTo(state.safeBotLayer);
      state.safeBots.push({id:made,x,y,alive:true,team,marker:mk,seed:(made*9301+49297)%233280,nextFight:8+(made%11),kills:0});
    }}
  }
  function updateSafeBots(elapsed,safe){
    const bots=state.safeBots||[];if(!bots.length)return {alive:0,kills:0};const dt=Math.max(0,Math.min(1,elapsed-(state.safeBotLastElapsed||0)));state.safeBotLastElapsed=elapsed;
    const target={x:Number(safe.x),y:Number(safe.y)},rad=Math.max(1,Number(safe.rad)||1);
    bots.forEach((b,idx)=>{if(!b.alive)return;const dx=target.x-b.x,dy=target.y-b.y,d=Math.hypot(dx,dy)||1,inside=d<=rad*.72,wander=Math.sin(elapsed*.19+b.seed)*.55,speed=inside?1.15:3.9;b.x+=(dx/d*speed+(-dy/d)*wander)*dt;b.y+=(dy/d*speed+(dx/d)*wander)*dt;
      if(elapsed>=b.nextFight){b.nextFight=elapsed+6+((b.seed+Math.floor(elapsed))%9);let enemy=null,best=170;for(const e of bots){if(!e.alive||e.team===b.team||e===b)continue;const ed=Math.hypot(e.x-b.x,e.y-b.y);if(ed<best){best=ed;enemy=e;}}if(enemy&&((b.seed+Math.floor(elapsed*3))%100)<34){enemy.alive=false;b.kills++;try{enemy.marker.setStyle({radius:2,color:'#6b7280',fillColor:'#111827',fillOpacity:.28,opacity:.35})}catch(e){}}}
      try{b.marker.setLatLng(ll(b.x,b.y));}catch(e){}
    });return {alive:bots.filter(b=>b.alive).length,kills:bots.reduce((n,b)=>n+b.kills,0)};
  }
  function safePreviewAt(seconds){
    const model=state.safePreviewModel;if(!model||!model.phases.length)return;const total=model.totalSeconds,elapsed=Math.max(0,Math.min(total,Number(seconds)||0));state.safePreviewElapsed=elapsed;let acc=0,p=model.phases[model.phases.length-1],pi=model.phases.length-1;
    for(let i=0;i<model.phases.length;i++){if(elapsed<=acc+model.phases[i].seconds||i===model.phases.length-1){p=model.phases[i];pi=i;break;}acc+=model.phases[i].seconds;}
    const local=Math.max(0,elapsed-acc),u=p.seconds?Math.min(1,local/p.seconds):1,x=p.type==='transition'?Number(p.a.x)+(Number(p.b.x)-Number(p.a.x))*u:Number(p.a.x),y=p.type==='transition'?Number(p.a.y)+(Number(p.b.y)-Number(p.a.y))*u:Number(p.a.y),rad=Number(p.from)+(Number(p.to)-Number(p.from))*u,damage=p.type==='transition'?Math.round(Number(p.a.damage||0)+(Number(p.b.damage||0)-Number(p.a.damage||0))*u):Number(p.damage)||0;
    if(state.safePreviewLayer){state.safePreviewLayer.setLatLng(ll(x,y));state.safePreviewLayer.setRadius(rad);}if(state.safePreviewCenterMarker)state.safePreviewCenterMarker.setLatLng(ll(x,y));updateSafeGasMask({x,y},rad);
    const hud=ensurePreviewHud(),remain=Math.max(0,Math.ceil(p.seconds-local)),player=safeTestPlayerStatus({x,y},rad,damage),botStats=updateSafeBots(elapsed,{x,y,rad});updateSafeTestPlayerMarker();
    const geom=p.type==='transition'?safeTransitionGeometry(p.a,p.b):null,moved=geom?geom.centerDistance*u:0;
    if(hud)hud.innerHTML='<div style="font-size:15px;font-weight:900">'+(p.type==='final-close'?'⚠ FECHAMENTO FINAL<br>⚠ A SAFE ESTÁ FECHANDO TOTALMENTE':p.type==='transition'?'⚠ A SAFE ESTÁ FECHANDO<br>⚠ A SAFE ESTÁ SE MOVIMENTANDO':'SAFE '+(p.stage+1)+' ATIVA')+'</div><div style="font-size:12px;margin-top:3px">'+(p.type==='transition'?(p.stage===0?'INICIAL → S1':'S'+p.stage+' → S'+(p.stage+1))+' • ':'')+'Raio '+Math.round(rad)+'m • '+damage+' dano/s fora • '+remain+'s'+(geom?' • centro '+Math.round(moved)+'/'+Math.round(geom.centerDistance)+'m • borda '+geom.edgeSpeed.toFixed(2)+'m/s':'')+'</div>'+(botStats.alive?'<div style="margin-top:5px;font-size:11px;color:#e9d5ff">SIMULAÇÃO • '+botStats.alive+'/70 vivos • '+botStats.kills+' eliminações</div>':'')+(player&&!player.inside?'<div style="margin-top:6px;color:#fca5a5;font-weight:900">VOCÊ ESTÁ TOMANDO '+damage+' DE DANO POR SEGUNDO FORA DA SAFE</div>':'');
    const range=qs('#mpSafeTimeRange'),clock=qs('#mpSafeTimeClock'),play=qs('#mpSafeTimePlay');if(range&&document.activeElement!==range)range.value=String(elapsed);if(clock)clock.textContent=formatDuration(elapsed)+' / '+formatDuration(total);if(play)play.textContent=state.safePreviewPlaying?'❚❚':'▶';model.phaseIndex=pi;
  }
  function ensureSafeTimeline(){
    const model=state.safePreviewModel;if(!model)return null;let bar=qs('#mpSafeTimelineSim');if(bar)return bar;const wrap=qs('#missionPlannerMap')?.parentElement;if(!wrap)return null;if(getComputedStyle(wrap).position==='static')wrap.style.position='relative';
    bar=document.createElement('div');bar.id='mpSafeTimelineSim';Object.assign(bar.style,{position:'absolute',left:'50%',bottom:'18px',transform:'translateX(-50%)',zIndex:'10055',width:'min(820px,calc(100% - 32px))',background:'rgba(8,10,18,.94)',border:'1px solid rgba(192,132,252,.65)',borderRadius:'12px',padding:'9px 12px',color:'#fff',font:'600 12px system-ui'});
    bar.innerHTML='<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><button id="mpSafePrevStage" title="SAFE anterior">⏮</button><button id="mpSafeBack10" title="Voltar 10 segundos">−10s</button><button id="mpSafeTimePlay" title="Play/Pause">▶</button><button id="mpSafeForward10" title="Avançar 10 segundos">+10s</button><button id="mpSafeNextStage" title="Próxima SAFE">⏭</button><button id="mpSafeTimeSpeed" title="Velocidade">1x</button><button id="mpSafeTestPlayer" title="Player de teste">P</button><span id="mpSafeTimeClock"></span><input id="mpSafeTimeRange" type="range" min="0" max="'+model.totalSeconds+'" step=".5" value="0" style="flex:1;min-width:180px"></div>';
    wrap.appendChild(bar);const phaseStart=i=>model.phases.slice(0,Math.max(0,i)).reduce((n,p)=>n+p.seconds,0);
    qs('#mpSafeTimePlay',bar).onclick=()=>{state.safePreviewPlaying=!state.safePreviewPlaying;safePreviewAt(state.safePreviewElapsed);};qs('#mpSafeTimeSpeed',bar).onclick=e=>{state.safePreviewSpeed=state.safePreviewSpeed===1?2:state.safePreviewSpeed===2?4:1;e.currentTarget.textContent=state.safePreviewSpeed+'x';};
    qs('#mpSafeTimeRange',bar).oninput=e=>{state.safePreviewPlaying=false;safePreviewAt(Number(e.target.value));};qs('#mpSafeBack10',bar).onclick=()=>{state.safePreviewPlaying=false;safePreviewAt(state.safePreviewElapsed-10);};qs('#mpSafeForward10',bar).onclick=()=>{state.safePreviewPlaying=false;safePreviewAt(state.safePreviewElapsed+10);};
    qs('#mpSafePrevStage',bar).onclick=()=>{state.safePreviewPlaying=false;safePreviewAt(phaseStart(Math.max(0,(model.phaseIndex||0)-2)));};qs('#mpSafeNextStage',bar).onclick=()=>{state.safePreviewPlaying=false;safePreviewAt(phaseStart(Math.min(model.phases.length-1,(model.phaseIndex||0)+2)));};qs('#mpSafeTestPlayer',bar).onclick=toggleSafeTestPlayer;return bar;
  }
  function startSafePreview(){
    const m=active(),r=ensureSafeRoute(m);if(!m||!r)return;const stages=r.stages.filter(safeStageValid),initial=safeInitialStage(m);
    if(!safeStageValid(initial)||!stages.length){alert('Configure o raio inicial e posicione a S1 para simular.');return;}
    stopSafePreview();state.safeConfigView=true;state.layerVisibility.spawns=false;renderMap();
    (state.drawn||[]).filter(l=>l?._mpKind==='safe').forEach(l=>{try{if(state.map?.hasLayer(l))state.map.removeLayer(l);}catch(e){}});
    const chain=[initial,...stages],phases=[];
    for(let i=0;i<stages.length;i++){const from=chain[i],to=chain[i+1],sec=safeTransitionSeconds(from,to,i);phases.push({type:'transition',label:(i===0?'INICIAL':'S'+i)+' → S'+(i+1),a:from,b:to,from:from.radius,to:to.radius,damage:Number(to.damage)||0,seconds:sec,stage:i});if(i<stages.length-1){const hold=Math.max(0,Number(to.closeSeconds)||0);if(hold)phases.push({type:'hold',label:'SAFE '+(i+1)+' ATIVA',a:to,b:to,from:to.radius,to:to.radius,damage:Number(to.damage)||0,seconds:hold,stage:i});}}const lastStage=stages[stages.length-1],zero={...lastStage,radius:0};phases.push({type:'final-close',label:'FECHAMENTO TOTAL',a:lastStage,b:zero,from:lastStage.radius,to:0,damage:Number(lastStage.damage)||0,seconds:safeFinalCloseSeconds(r),stage:stages.length-1});
    state.safePreviewMask=safeGasMask(initial,initial.radius);state.safePreviewLayer=L.circle(ll(initial.x,initial.y),{radius:Number(initial.radius),weight:5,color:'#d8b4fe',opacity:1,fill:false,fillOpacity:0,interactive:false,pane:'overlayPane'}).addTo(state.map);
    state.safePreviewRouteLayer=L.polyline(chain.map(s=>ll(s.x,s.y)),{color:'#f5d0fe',weight:3,opacity:.9,dashArray:'10 8',interactive:false}).addTo(state.map);
    const centerIcon=L.divIcon({className:'',html:'<div style="width:24px;height:24px;border-radius:50%;background:#7c3aed;border:4px solid #fff;box-shadow:0 0 0 4px rgba(124,58,237,.35),0 4px 14px rgba(0,0,0,.55)"></div>',iconSize:[24,24],iconAnchor:[12,12]});
    state.safePreviewCenterMarker=L.marker(ll(initial.x,initial.y),{icon:centerIcon,interactive:false,zIndexOffset:5000}).addTo(state.map);
    const totalSeconds=phases.reduce((n,p)=>n+p.seconds,0);initSafeBots(m,initial);state.safePreviewModel={route:chain,phases,totalSeconds,routeMode:'FIXA',phaseIndex:0};state.safePreviewElapsed=0;state.safePreviewPlaying=true;state.safePreviewSpeed=1;ensureSafeTimeline();safePreviewAt(0);
    let lastTick=performance.now();state.safePreviewTimer=setInterval(()=>{const now=performance.now(),dt=(now-lastTick)/1000;lastTick=now;if(!state.safePreviewPlaying)return;const next=state.safePreviewElapsed+dt*state.safePreviewSpeed;if(next>=totalSeconds){state.safePreviewPlaying=false;safePreviewAt(totalSeconds);}else safePreviewAt(next);},40);
  }

  async function recordSafeDemonstration(){
    const mapEl=state.map?.getContainer(),m=active(),r=ensureSafeRoute(m);if(!mapEl||!m||!r)return;
    if(r.stages.filter(safeStageValid).length<1){alert('Posicione pelo menos S1 antes de gravar.');return;}
    if(!navigator.mediaDevices?.getDisplayMedia||typeof MediaRecorder==='undefined'){alert('Este navegador não oferece gravação de tela compatível.');return;}
    stopSafePreview();
    let stream;try{stream=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:30},audio:false,preferCurrentTab:true});}catch{return;}
    const chunks=[],mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm',recorder=new MediaRecorder(stream,{mimeType:mime});
    state.safeRecorder=recorder;state.safeRecordStream=stream;
    recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data);};
    recorder.onstop=()=>{stream.getTracks().forEach(t=>t.stop());state.safeRecorder=null;state.safeRecordStream=null;if(!chunks.length)return;const blob=new Blob(chunks,{type:'video/webm'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='high-os-safe-'+slugify(m.event||'evento')+'-'+Date.now()+'.webm';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);const b=qs('#mpSafeRecord');if(b){b.textContent='●';b.title='Gravar simulação';}};
    recorder.start(500);startSafePreview();const b=qs('#mpSafeRecord');if(b){b.textContent='■';b.title='Parar e salvar gravação';}
  }
  function toggleSafeRecording(){
    if(state.safeRecorder&&state.safeRecorder.state!=='inactive'){state.safeRecorder.stop();return;}
    recordSafeDemonstration();
  }
  function drawElevationKnowledge(m){
    if(!state.map||!state.showElevationKnowledge)return;
    const samples=elevationSamples();if(!samples.length)return;
    samples.forEach(p=>{const c=L.circleMarker(ll(p.x,p.y),{radius:4,weight:1,opacity:.75,fillOpacity:.55,interactive:true}).addTo(state.map).bindPopup(`<b>ALTURA CONFIRMADA</b><br>Z ${f(p.z)} • ${esc(p.source)}`);state.drawn.push(c);});
    const bounds=state.map.getBounds?.();if(!bounds)return;
    const sw=bounds.getSouthWest(),ne=bounds.getNorthEast(),nx=7,ny=7;
    for(let ix=0;ix<nx;ix++)for(let iy=0;iy<ny;iy++){
      const x=sw.lng+(ne.lng-sw.lng)*(ix/(nx-1)),y=sw.lat+(ne.lat-sw.lat)*(iy/(ny-1)),e=estimateElevation(x,y);
      if(!e.count||e.confidence<20)continue;
      const icon=L.divIcon({className:'',html:`<div class="mp-elev-label" style="opacity:${Math.max(.35,e.confidence/100)}">Z~${Math.round(e.z)}<small>${e.confidence}%</small></div>`,iconSize:[48,28],iconAnchor:[24,14]});
      const mk=L.marker(ll(x,y),{icon,interactive:false}).addTo(state.map);state.drawn.push(mk);
    }
  }
  function renderMapLegend(m){
    const host=qs('.mission-planner-mapwrap')||qs('#missionPlannerMap')?.parentElement;if(!host)return;let el=qs('#mpMapLegend');
    if(!el){el=document.createElement('div');el.id='mpMapLegend';Object.assign(el.style,{position:'absolute',left:'12px',bottom:'12px',zIndex:'900',background:'rgba(8,10,18,.86)',border:'1px solid rgba(255,255,255,.16)',borderRadius:'10px',padding:'8px 10px',fontSize:'11px',lineHeight:'1.55',color:'#fff',pointerEvents:'none',boxShadow:'0 8px 24px rgba(0,0,0,.3)'});host.appendChild(el);}
    const counts=zoneCoverageCounts(m),valid=(m.points||[]).filter(isValidated).length,total=m.points?.length||0,category=m.category||'dominacao',poly=category==='dominacao'?dominationPolygon(m):[],mode=category==='dominacao'?dominationZoneMode(m):'radius',geom=category==='dominacao'?dominationZoneGeometry(m):null,rawPoly=category==='dominacao'&&Array.isArray(m.zonePolygon)?m.zonePolygon:[];
    const zoneLabel=category==='dominacao'&&mode==='polygon'?(geom?.mode==='polygon'?('⬡ Zona por CDS • '+poly.length+' vértices'):(geom?.mode==='polygon-invalid'?('⚠ Polígono com CDS inválida • '+rawPoly.length+' armazenadas'):('⬡ Polígono em construção • '+poly.length+'/3+ vértices válidos'))):'◯ Zona '+Math.round(effectiveEventRadius(m))+'m';
    const centerLabel=category==='dominacao'&&mode==='polygon'?'':('◎ Centro • ');
    el.innerHTML='<b>'+esc(m.event||'EVENTO')+' • '+esc(m.name||'ZONA')+'</b><br>'+centerLabel+zoneLabel+'<br>Spawns '+valid+'/'+total+' validados'+(category==='gas'?'<br>Safe inicial: '+counts.inside+'/'+counts.total+' dentro'+(counts.outside?' • '+counts.outside+' fora ⚠':' ✓'):'');
  }
  function renderMap(){
    if(!state.map)return;clearLayers();const m=active();if(!m)return;renderSafeRouteUi();renderMapLegend(m);drawElevationKnowledge(m);
    const poly=dominationPolygon(m),hasCenter=validCoord(m.center?.x)&&validCoord(m.center?.y),polyMode=(m.category||'dominacao')==='dominacao'&&dominationZoneMode(m)==='polygon';
    if(hasCenter&&!polyMode){
      const cicon=L.divIcon({className:'',html:`<div class="mp-center-pin ${isCenterValidated(m)?'validated':'planned'}">◎</div>`,iconSize:[32,32],iconAnchor:[16,16]});
      const center=L.marker(ll(m.center.x,m.center.y),{icon:cicon,draggable:state.editing}).addTo(state.map).bindPopup(`<b>${esc(m.center.label||'Centro')}</b><br>Status: <b>${isCenterValidated(m)?'VALIDADO':'PENDENTE'}</b><br>${f(m.center.x)},${f(m.center.y)}${isCenterValidated(m)?','+f(m.center.z)+','+f(m.center.h):',0.00,0.00'}<br><small>${state.editing?'Arraste para ajustar o centro':'Visualização • ponto travado'}</small>`);
      center.on('dragend',ev=>{const n=ev.target.getLatLng();m.center.x=n.lng;m.center.y=n.lat;m.center.z=0;m.center.h=0;m.center.status='planned';m.center.validatedAt=null;m.center.validationReason='coordinate-change';commit('Centro movido no mapa — validação removida');});center._mpKind='center';state.drawn.push(center);
    }
    if((m.category||'dominacao')==='dominacao'&&(m.zoneMode||(poly.length>=3?'polygon':'radius'))==='polygon'&&poly.length){
      const geom=dominationZoneGeometry(m),canClose=geom.mode==='polygon';if(canClose){const zone=L.polygon(poly.map(p=>ll(p.x,p.y)),{weight:2,fillOpacity:.055,interactive:false}).addTo(state.map);zone._mpKind='zone';state.drawn.push(zone);}else{const raw=Array.isArray(m.zonePolygon)?m.zonePolygon:[];let run=[];const flush=()=>{if(run.length>=2){const line=L.polyline(run.map(p=>ll(p.x,p.y)),{weight:2,dashArray:'6 7',opacity:.85,interactive:false}).addTo(state.map);line._mpKind='zone';state.drawn.push(line);}run=[];};raw.forEach(v=>{if(validCoord(v?.x)&&validCoord(v?.y))run.push(v);else flush();});flush();}
      poly.forEach(p=>{const rawIndex=(m.zonePolygon||[]).indexOf(p),vertexNo=rawIndex>=0?rawIndex+1:0,ic=L.divIcon({className:'',html:'<div style="min-width:22px;height:22px;border:2px solid #fff;border-radius:50%;background:#171923;color:#fff;font:10px/18px system-ui;text-align:center">'+vertexNo+'</div>',iconSize:[22,22],iconAnchor:[11,11]});const mk=L.marker(ll(p.x,p.y),{icon:ic,interactive:true,draggable:state.editing}).addTo(state.map).bindPopup('<b>Vértice da Zona '+String(vertexNo).padStart(2,'0')+'</b><br>'+f(p.x)+', '+f(p.y)+', '+f(Number(p.z)||0)+(state.editing?'<br><small>Arraste para ajustar • será necessário validar novamente</small>':''));mk.on('dragend',ev=>{if(rawIndex<0)return;const n=ev.target.getLatLng(),v=m.zonePolygon[rawIndex];v.x=n.lng;v.y=n.lat;v.z=0;v.status='planned';v.validatedAt=null;v.validationReason='coordinate-change';commit('Vértice '+String(rawIndex+1).padStart(2,'0')+' movido — validação removida');});mk._mpKind='zone';state.drawn.push(mk);});
    }else if(hasCenter&&!polyMode){const eventRadius=effectiveEventRadius(m);if(eventRadius>0){const zone=L.circle(ll(m.center.x,m.center.y),{radius:eventRadius,weight:2,fillOpacity:.035,dashArray:(m.category||'dominacao')==='gas'?'8 6':null,interactive:false}).addTo(state.map);zone._mpKind='zone';state.drawn.push(zone);}}
    drawSafeRoute(m);drawCompareOverlay();drawDominationAccess(m);drawZoneProposal();drawLocSuggestions();
    if(!state.safeConfigView&&!state.safePresentation)m.points.forEach((p,i)=>{
      p.id=i+1;const valid=isValidated(p),
outside=((m.category||'dominacao')==='gas')&&!pointInsideZone(m,p),
pos=ll(p.x,p.y);
      /* V12.15: cor só quando definida — "undefined" fazia o canvas herdar a cor da camada anterior */
      const co={radius:Number(m.spawnRadius)||100,weight:outside?3:2,fillOpacity:outside?.14:.07,dashArray:outside?'3 4':(valid?null:'6 5')};
      if(outside){co.color='#ff5252';co.fillColor='#ff5252';}
      const circle=L.circle(pos,co).addTo(state.map);
      /* V12.13 — risco de terreno (água/QG) marcado no pino: arraste e valide */
      const agua=pointWater(p)===true,qgPerto=nearQg(p),risco=agua||!!qgPerto;
      const wk=`${partidasDe(m).length}|${m.points.length}`;if(!state._winsFor||state._winsFor.m!==m||state._winsFor.k!==wk){state._winsFor={m,k:wk,w:zoneInsights(m).wins};}
      const vit=state._winsFor.w[i+1]||0;
      const marker=L.marker(pos,{icon:pinIcon(p,outside,risco),
draggable:state.editing}).addTo(state.map);
      marker.bindPopup(`<b>Ponto ${String(p.id).padStart(2,'0')}</b><br>Status: <b>${valid?'VALIDADO':'PENDENTE'}</b>${outside?'<br><b style="color:#ff7474">FORA DA ZONA ⚠</b>':''}${agua?'<br><b style="color:#ffb02e">⚠ PARECE ESTAR NA ÁGUA</b>':''}${qgPerto?`<br><b style="color:#ffb02e">⚠ ${Math.round(qgPerto.d)} m do QG ${esc(qgPerto.qg||qgPerto.group)}</b>`:''}${vit?`<br>🏆 ${vit} vitória${vit>1?'s':''} registrada${vit>1?'s':''}`:''}<br>${f(p.x)},${f(p.y)}${valid?','+f(p.z)+','+f(p.h):''}${risco&&!valid?`<br><small>${state.editing?'Arraste para terra firme e valide a CDS':'Clique em EDITAR para arrastar'}</small>`:''}`);
      marker.on('click',()=>selectPoint(p.id));
      marker.on('dragend',ev=>{const n=ev.target.getLatLng();p.x=n.lng;p.y=n.lat;p.z=0;p.status='planned';p.validatedAt=null;commit(`Ponto ${p.id} movido — valide a CDS real`);selectPoint(p.id);goValidate();});
      circle._mpKind='spawns';marker._mpKind='spawns';state.drawn.push(circle,marker);
      if(Number.isFinite(p.h)){const a=p.h*Math.PI/180,
d=35;const hd=L.marker(ll(p.x+Math.sin(a)*d,p.y+Math.cos(a)*d),{icon:headingIcon(p.h),interactive:false}).addTo(state.map);hd._mpKind='spawns';state.drawn.push(hd);}
    });
    applyLayerVisibility();
  }

  function renderMissionList(){
    renderCentralV954();
  }

  function spawnProblems(m){
    const near=new Set(),duplicates=[];if(!m)return {near,duplicates};
    for(let i=0;i<m.points.length;i++)for(let j=i+1;j<m.points.length;j++){const d=distXY(m.points[i],m.points[j]);if(d<2){near.add(i);near.add(j);duplicates.push([i,j,d]);}else if(d<(Number(m.spawnRadius)||100)*2){near.add(i);near.add(j);}}
    return {near,duplicates};
  }
  function renumberSpawns(){
    if(!requireEdit())return;const m=active();if(!m)return;m.points.forEach((p,i)=>p.id=i+1);commit('Spawns renumerados sem alterar CDS');
  }
  function focusSpawnProblems(){
    const m=active();if(!m)return;const pr=spawnProblems(m);if(!pr.near.size){alert('Nenhum spawn duplicado ou próximo demais foi detectado.');return;}const pts=[...pr.near].map(i=>m.points[i]).filter(Boolean);if(pts.length===1)state.map?.setView(ll(pts[0].x,pts[0].y),5);else state.map?.fitBounds(L.latLngBounds(pts.map(p=>ll(p.x,p.y))).pad(.2),{maxZoom:5});qsa('.mp-point-row').forEach((el,i)=>el.style.outline=pr.near.has(i)?'2px solid #ff7474':'');setSaveState(pr.near.size+' spawn(s) problemático(s) destacados');
  }
  function renderPointList(){
    const m=active(),
box=qs('#mpPointList');if(!box||!m)return;
    if(!m.points.length){box.innerHTML='<div class="mp-note">Nenhum ponto registrado.</div>';return;}
    const problems=spawnProblems(m);
    box.innerHTML='<div class="mp-actions" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px"><button type="button" id="mpFocusProblems">VER PROBLEMÁTICOS</button><button type="button" id="mpRenumberSpawns">RENUMERAR 01…'+String(m.points.length).padStart(2,'0')+'</button><span class="mp-note">'+(problems.duplicates.length?problems.duplicates.length+' duplicidade(s) crítica(s) < 2m':'Sem duplicidades exatas')+'</span></div>'+m.points.map((p,i)=>{const valid=isValidated(p);return `<div class="mp-point-row ${valid?'validated':'planned'}" data-pidx="${i}"><div class="mp-point-num">${String(i+1).padStart(2,'0')}</div><div><b>Ponto ${i+1} <span class="mp-state ${valid?'ok':'warn'}">${valid?'VALIDADO':'PENDENTE'}</span></b><small>${valid?rawCds(p):tpCds(p)+' • Z provisório para TP/NC'}</small></div><div class="mp-row-actions"><button type="button" data-copy="${i}" title="${valid?'Copiar CDS validada':'Copiar CDS provisória para TPCDS'}">⧉</button><button type="button" data-del="${i}" title="Remover">×</button></div></div>`;}).join('');
    qs('#mpFocusProblems')?.addEventListener('click',focusSpawnProblems);qs('#mpRenumberSpawns')?.addEventListener('click',renumberSpawns);if(qs('#mpRenumberSpawns'))qs('#mpRenumberSpawns').disabled=!state.editing;
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
    if(box)box.innerHTML=p?`Ponto <b>${String(id).padStart(2,'0')}</b> • ${isValidated(p)?rawCds(p):tpCds(p)} • ${isValidated(p)?'<span class="mp-ok">VALIDADO</span>':'<span class="mp-warn">PENDENTE / Z ESTIMADO</span>'}${zHint(p)?`<br>${zHint(p)}`:''}`:'Selecione um ponto.';
    if(m)m.selectedId=id;
    qsa('.mp-point-row').forEach((r,i)=>r.classList.toggle('selected',i===id-1));
  }

  function ensureCenterValidationUi(){
    const clicked=qs('#mpClicked');if(!clicked||qs('#mpCenterValidation'))return;
    const wrap=document.createElement('div');wrap.id='mpCenterValidation';wrap.style.marginTop='8px';
    wrap.innerHTML=`<div id="mpCenterValidationStatus" class="mp-readout"></div><div class="mp-actions"><button type="button" id="mpCopyCenterTp">COPIAR TP DO CENTRO</button></div><label style="margin-top:8px">Cole a CDS real do centro<input id="mpCenterRealCds" placeholder="4869.25,-5060.22,292.63,306.15"></label><div class="mp-actions"><button type="button" id="mpValidateCenter" class="primary">VALIDAR CENTRO</button></div>`;
    clicked.insertAdjacentElement('afterend',wrap);
    qs('#mpCopyCenterTp')?.addEventListener('click',async()=>{const m=active();if(!m||!validCoord(m.center.x)||!validCoord(m.center.y)){alert('Marque primeiro o centro no mapa.');return;}const ez=isCenterValidated(m)?{z:Number(m.center.z)}:estimateZ(m.center.x,m.center.y);await copyText(`${f(m.center.x)},${f(m.center.y)},${f(ez?ez.z:0)},${Number.isFinite(Number(m.center.h))?f(m.center.h):'0.00'}`);const b=qs('#mpCopyCenterTp');if(b){const old=b.textContent;b.textContent='COPIADO ✓';setTimeout(()=>b.textContent=old,900);}});
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
    box.innerHTML=`<label id="mpZoneModeWrap" style="margin-bottom:8px">FORMA DA ZONA<select id="mpZoneMode"><option value="radius">CENTRO + RAIO</option><option value="polygon">POLÍGONO POR CDS</option></select></label><div class="mp-readout"><b id="mpCoverageTitle">COBERTURA DA ZONA</b><div id="mpCoverageStatus" style="margin-top:6px">—</div></div><label style="margin-top:8px">Raio visual da zona (m)<input id="mpEventRadius" type="number" min="50" step="50" placeholder="1000"></label><div class="mp-actions" style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" id="mpRadiusMinus50">-50</button><button type="button" id="mpRadiusPlus50">+50</button><button type="button" id="mpRadiusMinus100">-100</button><button type="button" id="mpRadiusPlus100">+100</button></div><div class="mp-actions" style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" id="mpUseRecommendedRadius">COBRIR TODOS</button><button type="button" id="mpFitZone">ENQUADRAR ZONA</button><button type="button" id="mpGenerateInsideZone">GERAR SPAWNS DENTRO DA ZONA</button></div><div class="mp-note" style="margin-top:6px">Defina primeiro o tamanho ideal da área. Spawns fora dela serão destacados; não aumente a zona só para caber em pontos ruins.</div>`;
    anchor.insertAdjacentElement('afterend',box);
    qs('#mpZoneMode')?.addEventListener('change',e=>{if(!requireEdit())return;const m=active();if(!m||m.category!=='dominacao')return;m.zoneMode=e.target.value==='polygon'?'polygon':'radius';commit('Forma da Zona alterada para '+(m.zoneMode==='polygon'?'Polígono por CDS':'Centro + Raio'));});

    const applyRadius=(v,commitNow=true)=>{if(!requireEdit())return;const m=active();if(!m)return;v=Math.max(50,Math.round(Number(v)/50)*50);if(Number(m.eventRadius)===v)return;m.eventRadius=v;if(commitNow)commit('Raio da zona alterado');else{state.dirty=true;setSaveState('Raio da zona alterado • NÃO SALVO');renderMap();renderCoverage();}};
    let radiusInputStart=null;const radiusInput=qs('#mpEventRadius');
    radiusInput?.addEventListener('focus',()=>{radiusInputStart=state.editing?editSnapshot():null;});
    radiusInput?.addEventListener('input',e=>{if(!state.editing)return;const v=Number(e.target.value);if(Number.isFinite(v)&&v>0)applyRadius(v,false);});
    radiusInput?.addEventListener('change',()=>{if(!state.editing)return;if(radiusInputStart&&radiusInputStart!==editSnapshot()){const current=editSnapshot();state.lastEditSnapshot=radiusInputStart;pushUndo();state.lastEditSnapshot=current;state.dirty=true;render();setSaveState('Raio da zona alterado • NÃO SALVO');}radiusInputStart=null;});
    qs('#mpRadiusMinus50')?.addEventListener('click',()=>applyRadius(effectiveEventRadius(active())-50));
    qs('#mpRadiusPlus50')?.addEventListener('click',()=>applyRadius(effectiveEventRadius(active())+50));
    qs('#mpRadiusMinus100')?.addEventListener('click',()=>applyRadius(effectiveEventRadius(active())-100));
    qs('#mpRadiusPlus100')?.addEventListener('click',()=>applyRadius(effectiveEventRadius(active())+100));
    qs('#mpUseRecommendedRadius')?.addEventListener('click',()=>{if(!requireEdit())return;const m=active(),
s=coverageStats(m);if(!m||!s)return;applyRadius(s.recommended);});
    qs('#mpFitZone')?.addEventListener('click',fitZone);
    qs('#mpGenerateInsideZone')?.addEventListener('click',generateInsideZone);
    const asst=document.createElement('div');asst.className='mp-actions mpa-assist';asst.style.marginTop='10px';
    asst.innerHTML=`<button type="button" id="mpSuggestLoc" title="Varre a área visível do mapa">🔎 SUGERIR LOCAIS</button><button type="button" id="mpOptimize" title="Reposiciona só os spawns com problema">✨ OTIMIZAR SPAWNS</button><button type="button" id="mpFairCenter" title="Centro mais equidistante de todos os spawns">⚖ CENTRO JUSTO</button>`;
    box.appendChild(asst);
    qs('#mpSuggestLoc')?.addEventListener('click',suggestLocations);
    qs('#mpOptimize')?.addEventListener('click',optimizeSpawns);
    qs('#mpFairCenter')?.addEventListener('click',applyFairCenter);
  }
  function zoneProposalPoints(m,shape,scale=1,rotation=0){
    if(!m||!validCoord(m.center?.x)||!validCoord(m.center?.y))return [];const cx=Number(m.center.x),cy=Number(m.center.y),r=Math.max(100,effectiveEventRadius(m))*Math.max(.2,Number(scale)||1),z=Number(m.center.z)||0,rot=Number(rotation)||0;
    const rotate=(x,y)=>{const a=rot*Math.PI/180,c=Math.cos(a),sn=Math.sin(a);return {x:cx+x*c-y*sn,y:cy+x*sn+y*c,z};};
    if(shape==='triangle')return [0,120,240].map(a=>{const q=a*Math.PI/180;return rotate(Math.sin(q)*r,Math.cos(q)*r);});
    if(shape==='hexagon')return [0,60,120,180,240,300].map(a=>{const q=a*Math.PI/180;return rotate(Math.sin(q)*r,Math.cos(q)*r);});
    if(shape==='rectangle'){const w=r,h=r*.62;return [rotate(-w,-h),rotate(w,-h),rotate(w,h),rotate(-w,h)];}
    const d=r/Math.sqrt(2);return [rotate(-d,-d),rotate(d,-d),rotate(d,d),rotate(-d,d)];
  }
  function drawZoneProposal(){const p=state.zoneProposal;if(!p?.points?.length||!state.map)return;const line=L.polygon(p.points.map(v=>ll(v.x,v.y)),{weight:3,fillOpacity:.025,dashArray:'8 7',interactive:false}).addTo(state.map);line._mpKind='proposal';state.drawn.push(line);p.points.forEach((v,i)=>{const mk=L.marker(ll(v.x,v.y),{interactive:false,icon:L.divIcon({className:'',html:'<div style="width:24px;height:24px;border:2px dashed #fff;border-radius:50%;background:rgba(8,10,18,.75);color:#fff;font:10px/20px system-ui;text-align:center">P'+(i+1)+'</div>',iconSize:[24,24],iconAnchor:[12,12]})}).addTo(state.map);mk._mpKind='proposal';state.drawn.push(mk);});}
  function setZoneProposal(shape){const m=active();if(!m||m.category!=='dominacao')return;if(!validCoord(m.center?.x)||!validCoord(m.center?.y)){alert('Defina o centro da zona antes de gerar uma proposta.');return;}const scale=Math.max(.2,Number(qs('#mpDomProposalScale')?.value)||1),rotation=Number(qs('#mpDomProposalRotation')?.value)||0;state.zoneProposal={shape,scale,rotation,points:zoneProposalPoints(m,shape,scale,rotation)};renderMap();renderDominationPolygonUi();}
  function applyZoneProposal(){if(!requireEdit())return;const m=active(),p=state.zoneProposal;if(!m||!p?.points?.length)return;m.zonePolygon=p.points.map(v=>({x:v.x,y:v.y,z:0,status:'planned',validatedAt:null,validationReason:'assisted-proposal'}));m.zoneMode='polygon';state.zoneProposal=null;commit('Proposta assistida aplicada à Zona de Dominação');}

  function ensureDominationPolygonUi(){
    const anchor=qs('#mpCoverageBox'),m=active();if(!anchor||qs('#mpDomPolygonBox'))return;
    const box=document.createElement('div');box.id='mpDomPolygonBox';box.className='mp-card';box.dataset.forceTab='zona';box.style.marginTop='10px';
    box.innerHTML=`<h3>CDS DA ZONA — POLÍGONO</h3><p class="mp-note">Opcional. Cole 3 ou mais CDS na ordem do contorno. O mapa une os pontos e fecha a Zona de Pontuação automaticamente. Estas CDS não são spawns.</p><div id="mpDomPolygonStatus" class="mp-readout">Nenhum vértice cadastrado.</div><div id="mpDomPolygonList" style="margin-top:8px"></div><label style="margin-top:8px">CDS do vértice<input id="mpDomPolygonCds" type="text" placeholder="x, y, z ou vec3(x, y, z)"></label><label style="margin-top:8px">COLAR VÁRIAS CDS<textarea id="mpDomPolygonBulk" rows="5" placeholder="01 - x, y, z&#10;02 - x, y, z&#10;03 - vec3(x, y, z)"></textarea></label><div class="mp-actions" style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" id="mpDomPolygonAdd">ADICIONAR VÉRTICE</button><button type="button" id="mpDomPolygonPlace">MARCAR VÉRTICE NO MAPA</button><button type="button" id="mpDomPolygonBulkAdd">IMPORTAR / ACRESCENTAR</button><button type="button" id="mpDomPolygonBulkReplace">SUBSTITUIR POLÍGONO</button><button type="button" id="mpDomPolygonValidateAll">VALIDAR TODAS</button><button type="button" id="mpDomPolygonUndo">REMOVER ÚLTIMO</button><button type="button" id="mpDomPolygonClear">LIMPAR POLÍGONO</button></div><div class="mp-note" style="margin-top:10px"><b>PLANEJADOR ASSISTIDO</b> • gera apenas uma proposta visual; nada é alterado até clicar APLICAR. Ao aplicar, as CDS ficam PENDENTES até validação real no FiveM.</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0"><label>ESCALA<input id="mpDomProposalScale" type="number" min="0.2" max="3" step="0.1" value="1"></label><label>ROTAÇÃO °<input id="mpDomProposalRotation" type="number" min="-180" max="180" step="5" value="0"></label></div><div class="mp-actions" style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" data-zoneproposal="square">QUADRADO</button><button type="button" data-zoneproposal="rectangle">RETÂNGULO</button><button type="button" data-zoneproposal="triangle">TRIÂNGULO</button><button type="button" data-zoneproposal="hexagon">HEXÁGONO</button><button type="button" id="mpDomProposalApply">APLICAR PROPOSTA</button><button type="button" id="mpDomProposalCancel">CANCELAR</button></div>`;
    anchor.insertAdjacentElement('afterend',box);
    qs('#mpDomPolygonPlace')?.addEventListener('click',()=>{if(!requireEdit())return;const m=active();if(!m||m.category!=='dominacao')return;const enable=!state.polygonPlacement;resetMapPlacementModes();state.polygonPlacement=enable;state.mapMode=enable?'polygon':'center';const b=qs('#mpDomPolygonPlace');if(b)b.textContent=state.polygonPlacement?'PARAR MARCAÇÃO':'MARCAR VÉRTICE NO MAPA';if(state.map?.getContainer())state.map.getContainer().style.cursor=state.polygonPlacement?'crosshair':'';const el=qs('#mpDomPolygonStatus');if(el&&state.polygonPlacement)el.innerHTML='<b>MARCAÇÃO DE VÉRTICES ATIVA</b><br>Clique no mapa seguindo a ordem do contorno. Os pontos entram como PENDENTES até validação real no FiveM.';});
    qs('#mpDomPolygonAdd')?.addEventListener('click',()=>{if(!requireEdit())return;const m=active();if(!m||m.category!=='dominacao')return;const r=parseCds(qs('#mpDomPolygonCds')?.value);if(!r.ok||!validCoord(r.x)||!validCoord(r.y)){alert('CDS do vértice não reconhecida.');return;}if(!Array.isArray(m.zonePolygon))m.zonePolygon=[];m.zonePolygon.push({x:r.x,y:r.y,z:Number.isFinite(r.z)?r.z:0,status:'planned',validatedAt:null,validationReason:'pending-explicit-validation'});if(qs('#mpDomPolygonCds'))qs('#mpDomPolygonCds').value='';commit('Vértice da Zona de Dominação adicionado');});
    function readPolygonBulk(){const input=qs('#mpDomPolygonBulk'),lines=String(input?.value||'').split(/\n+/).map(x=>x.trim()).filter(Boolean),parsed=[],bad=[];lines.forEach((line,i)=>{const clean=line.replace(/^\s*\d+\s*[-–—:.)]\s*/,'').trim(),r=parseCds(clean);if(!r.ok||!validCoord(r.x)||!validCoord(r.y)){bad.push(i+1);return;}parsed.push({x:r.x,y:r.y,z:Number.isFinite(r.z)?r.z:0,status:'planned',validatedAt:null,validationReason:'pending-explicit-validation'});});return {input,parsed,bad};}
    function confirmPolygonBulk(result,action){if(!result.parsed.length){alert('Nenhuma CDS válida encontrada.');return false;}if(result.bad.length&&!confirm(result.parsed.length+' CDS reconhecida(s). Linha(s) não reconhecida(s): '+result.bad.join(', ')+'.\n\n'+action+' somente as CDS válidas?'))return false;return true;}
    qs('#mpDomPolygonBulkAdd')?.addEventListener('click',()=>{if(!requireEdit())return;const m=active(),r=readPolygonBulk();if(!m||m.category!=='dominacao'||!r.input||!confirmPolygonBulk(r,'Importar'))return;if(!Array.isArray(m.zonePolygon))m.zonePolygon=[];m.zonePolygon.push(...r.parsed);m.zoneMode='polygon';r.input.value='';commit(r.parsed.length+' CDS acrescentadas à Zona de Dominação na ordem informada');fitZone();});
    qs('#mpDomPolygonBulkReplace')?.addEventListener('click',()=>{if(!requireEdit())return;const m=active(),r=readPolygonBulk();if(!m||m.category!=='dominacao'||!r.input||!confirmPolygonBulk(r,'Substituir'))return;const oldCount=Array.isArray(m.zonePolygon)?m.zonePolygon.length:0;if(oldCount&&!confirm('Substituir os '+oldCount+' vértice(s) atuais por '+r.parsed.length+' CDS da lista colada?\n\nOs vértices anteriores serão removidos desta edição.'))return;m.zonePolygon=r.parsed;m.zoneMode='polygon';r.input.value='';commit('Polígono substituído por '+r.parsed.length+' CDS na ordem informada');fitZone();});

    qs('#mpDomPolygonValidateAll')?.addEventListener('click',()=>{if(!requireEdit())return;const m=active(),raw=Array.isArray(m?.zonePolygon)?m.zonePolygon:[];if(!raw.length)return;const ready=raw.filter(v=>validCoord(v.x)&&validCoord(v.y)&&validCoord(v.z)&&v.status!=='validated');if(!ready.length){alert('Não há CDS pendentes com X, Y e Z completos para validar.');return;}if(!confirm('Confirmar '+ready.length+' CDS como coordenadas REAIS coletadas no FiveM?\n\nUse esta opção somente depois de conferir as CDS no jogo.'))return;const at=nowIso();ready.forEach(v=>{v.status='validated';v.validatedAt=at;v.validationReason=null;});commit(ready.length+' vértice(s) validados com CDS reais do FiveM');});
    qs('#mpDomPolygonUndo')?.addEventListener('click',()=>{if(!requireEdit())return;const m=active();if(!m?.zonePolygon?.length)return;m.zonePolygon.pop();if(!m.zonePolygon.length)m.zoneMode='radius';commit(m.zonePolygon.length?'Último vértice da Zona de Dominação removido — polígono permanece em construção':'Último vértice removido — zona voltou para Centro + Raio');});
    qs('#mpDomPolygonClear')?.addEventListener('click',()=>{if(!requireEdit())return;const m=active();if(!m)return;const count=Array.isArray(m.zonePolygon)?m.zonePolygon.length:0;if(!count&&dominationZoneMode(m)!=='polygon')return;if(!confirm('Remover todas as CDS do polígono e voltar a visualizar a zona por Centro + Raio?'))return;m.zonePolygon=[];m.zoneMode='radius';state.zoneProposal=null;resetMapPlacementModes();commit('Polígono removido — Zona de Pontuação voltou para Centro + Raio');});
    qsa('[data-zoneproposal]',box).forEach(b=>b.addEventListener('click',()=>setZoneProposal(b.dataset.zoneproposal)));['mpDomProposalScale','mpDomProposalRotation'].forEach(id=>qs('#'+id)?.addEventListener('input',()=>{const p=state.zoneProposal,m=active();if(!p||!m)return;p.scale=Math.max(.2,Number(qs('#mpDomProposalScale')?.value)||1);p.rotation=Number(qs('#mpDomProposalRotation')?.value)||0;p.points=zoneProposalPoints(m,p.shape,p.scale,p.rotation);renderMap();renderDominationPolygonUi();}));
    qs('#mpDomProposalApply')?.addEventListener('click',applyZoneProposal);qs('#mpDomProposalCancel')?.addEventListener('click',()=>{state.zoneProposal=null;renderMap();renderDominationPolygonUi();});
    box.addEventListener('click',e=>{const b=e.target.closest('[data-polyaction]');if(!b)return;const m=active(),i=Number(b.dataset.index);if(!m||!Array.isArray(m.zonePolygon)||!Number.isInteger(i)||!m.zonePolygon[i])return;const action=b.dataset.polyaction;if(action==='go'){const p=m.zonePolygon[i];if(!validCoord(p?.x)||!validCoord(p?.y)){alert('Este vértice possui X/Y inválidos. Use CORRIGIR CDS antes de tentar localizá-lo no mapa.');return;}state.map?.setView(ll(p.x,p.y),Math.max(state.map?.getZoom?.()||4,5));return;}if(!requireEdit())return;if(action==='validate'){const old=m.zonePolygon[i];if(!validCoord(old?.x)||!validCoord(old?.y)){alert('Corrija X/Y deste vértice antes de validá-lo com a CDS real do FiveM.');return;}const value=prompt('Cole a CDS REAL coletada no FiveM para validar o vértice '+String(i+1).padStart(2,'0')+':',validCoord(old.z)?f(old.x)+', '+f(old.y)+', '+f(old.z):'');if(value===null)return;const r=parseCds(value);if(!r.ok||!validCoord(r.x)||!validCoord(r.y)||!validCoord(r.z)){alert('Para validar é necessário informar X, Y e Z reais da CDS coletada no FiveM.');return;}m.zonePolygon[i]={...old,x:r.x,y:r.y,z:r.z,status:'validated',validatedAt:nowIso(),validationReason:null};commit('Vértice '+String(i+1).padStart(2,'0')+' validado com CDS real');return;}if(action==='edit'){const old=m.zonePolygon[i],value=prompt('Editar CDS do vértice '+String(i+1).padStart(2,'0')+':',f(old.x)+', '+f(old.y)+', '+f(old.z));if(value===null)return;const r=parseCds(value);if(!r.ok||!validCoord(r.x)||!validCoord(r.y)){alert('CDS não reconhecida.');return;}m.zonePolygon[i]={...old,x:r.x,y:r.y,z:Number.isFinite(r.z)?r.z:0,status:'planned',validatedAt:null,validationReason:'coordinate-change'};commit('CDS do vértice '+String(i+1).padStart(2,'0')+' atualizada');return;}if(action==='remove'){m.zonePolygon.splice(i,1);commit('Vértice '+String(i+1).padStart(2,'0')+' removido da Zona de Dominação');return;}const j=action==='up'?i-1:action==='down'?i+1:i;if(j<0||j>=m.zonePolygon.length||j===i)return;[m.zonePolygon[i],m.zonePolygon[j]]=[m.zonePolygon[j],m.zonePolygon[i]];commit('Ordem das CDS da Zona de Dominação alterada');});
  }
  function renderDominationPolygonUi(){
    ensureDominationPolygonUi();const m=active(),box=qs('#mpDomPolygonBox'),el=qs('#mpDomPolygonStatus');if(!box||!m)return;const show=(m.category||'dominacao')==='dominacao';box.style.display=show?'block':'none';if(!show||!el)return;const p=dominationPolygon(m),polyMode=dominationZoneMode(m)==='polygon',raw=Array.isArray(m.zonePolygon)?m.zonePolygon:[],validated=raw.filter(v=>validCoord(v.x)&&validCoord(v.y)&&validCoord(v.z)&&v.status==='validated').length,geom=dominationZoneGeometry(m),pa=dominationPolygonAudit(m),crit=(pa.findings||[]).filter(x=>x.level!=='OK'),list=qs('#mpDomPolygonList');if(list)list.innerHTML=raw.length?raw.map((v,i)=>{const xyOk=validCoord(v.x)&&validCoord(v.y),validatedOk=xyOk&&validCoord(v.z)&&v.status==='validated',status=!xyOk?'CDS INVÁLIDA':(validatedOk?'VALIDADO':'PENDENTE'),statusColor=!xyOk?'#ff9b9b':(validatedOk?'#a7f3d0':'#ffd27a');return '<div class="mp-readout" style="margin:4px 0;display:flex;gap:6px;align-items:center;flex-wrap:wrap'+(!xyOk?';border-color:rgba(255,116,116,.55)':'')+'"><b>'+String(i+1).padStart(2,'0')+'</b><span style="font-size:10px;padding:2px 6px;border-radius:8px;border:1px solid rgba(255,255,255,.18);color:'+statusColor+'">'+status+'</span><span style="flex:1;min-width:180px">'+f(v.x)+', '+f(v.y)+', '+f(v.z)+'</span><button type="button" data-polyaction="go" data-index="'+i+'" '+(!xyOk?'disabled':'')+'>IR</button><button type="button" data-polyaction="edit" data-index="'+i+'" '+(!state.editing?'disabled':'')+'>'+(!xyOk?'CORRIGIR CDS':'EDITAR CDS')+'</button><button type="button" data-polyaction="validate" data-index="'+i+'" '+(!state.editing||!xyOk?'disabled':'')+'>VALIDAR CDS</button><button type="button" data-polyaction="up" data-index="'+i+'" '+(!state.editing||i===0?'disabled':'')+'>↑</button><button type="button" data-polyaction="down" data-index="'+i+'" '+(!state.editing||i===raw.length-1?'disabled':'')+'>↓</button><button type="button" data-polyaction="remove" data-index="'+i+'" '+(!state.editing?'disabled':'')+'>REMOVER</button></div>';}).join(''):'<div class="mp-note">Adicione as CDS na ordem do contorno da zona.</div>';const geometryReady=polyMode&&p.length>=3&&!pa.metrics?.geometryDeferred&&Number.isFinite(geom?.area)&&Number.isFinite(geom?.perimeter);el.innerHTML=raw.length?`Vértices armazenados: <b>${raw.length}</b> • validados: <b>${validated}/${raw.length}</b>${polyMode?(p.length>=3?(geometryReady?`<br>Polígono ativo e fechado ✓ • área ~<b>${Math.round(geom.area).toLocaleString('pt-BR')} m²</b> • perímetro ~<b>${Math.round(geom.perimeter)} m</b>`:'<br>Polígono selecionado • <b>geometria aguardando correção das CDS</b>.'):'<br>Modo POLÍGONO ativo • adicione pelo menos 3 CDS para fechar a zona.'):'<br>Modo CENTRO + RAIO ativo • polígono armazenado sem interferir na zona.'}`:(polyMode?'Nenhum vértice cadastrado • modo POLÍGONO aguardando CDS.':'Nenhum vértice cadastrado • usando Centro + Raio.');if(polyMode&&raw.length>=3&&crit.length){const rank={BLOQUEIO:0,ALERTA:1,'ATENÇÃO':2};crit.sort((a,b)=>(rank[a.level]??9)-(rank[b.level]??9));el.innerHTML+='<br><br><b>DIAGNÓSTICO DA ZONA</b><br>'+crit.map(x=>'<span><b>['+esc(x.level)+']</b> '+esc(x.message)+(x.action?'<br><small>↳ '+esc(x.action)+'</small>':'')+'</span>').join('<br><br>');if(pa.metrics&&!pa.metrics.geometryDeferred)el.innerHTML+='<br><br><b>MÉTRICAS</b><br>Dimensões ~<b>'+Math.round(pa.metrics.width)+' × '+Math.round(pa.metrics.height)+' m</b> • proporção <b>'+pa.metrics.aspectRatio.toFixed(1)+':1</b><br>Compactação <b>'+(pa.metrics.compactness*100).toFixed(0)+'%</b> • concavidade <b>'+Math.round(pa.metrics.concavity*100)+'%</b> • lados <b>'+Math.round(pa.metrics.minSide)+'–'+Math.round(pa.metrics.maxSide)+' m</b>';}else if(polyMode&&raw.length>=3)el.innerHTML+='<br><br><b>Geometria:</b> sem problemas estruturais detectados ✓';
    ['mpDomPolygonAdd','mpDomPolygonPlace','mpDomPolygonBulkAdd','mpDomPolygonValidateAll','mpDomPolygonUndo','mpDomPolygonClear','mpDomProposalApply'].forEach(id=>{const b=qs('#'+id);if(b)b.disabled=!state.editing;});const placeBtn=qs('#mpDomPolygonPlace');if(placeBtn){placeBtn.textContent=state.polygonPlacement?'PARAR MARCAÇÃO':'MARCAR VÉRTICE NO MAPA';placeBtn.setAttribute('aria-pressed',state.polygonPlacement?'true':'false');}if(state.map?.getContainer()&&state.polygonPlacement){state.map.getContainer().style.cursor='crosshair';qs('#missionPlannerMap')?.classList.add('mp-crosshair');}const prop=state.zoneProposal;if(prop){const names={square:'QUADRADO',rectangle:'RETÂNGULO',triangle:'TRIÂNGULO',hexagon:'HEXÁGONO'};el.innerHTML+='<br><br><b>Proposta visual:</b> '+esc(names[prop.shape]||String(prop.shape||'FORMA').toUpperCase())+' • '+prop.points.length+' vértices • ainda não aplicada.';}
  }

  function renderCoverage(){
    ensureCoverageUi();ensureSafeRouteUi();ensureDominationPolygonUi();const m=active(),
el=qs('#mpCoverageStatus'),
title=qs('#mpCoverageTitle'),
inp=qs('#mpEventRadius'),
btn=qs('#mpUseRecommendedRadius');if(!m||!el)return;
    const category=m.category||'dominacao',
used=effectiveEventRadius(m),
s=coverageStats(m),
counts=zoneCoverageCounts(m);
    if(title)title.textContent=category==='gas'?'COBERTURA INICIAL DA SAFE / GÁS':'ZONA DE PONTUAÇÃO — DOMINAÇÃO';const modeWrap=qs('#mpZoneModeWrap'),modeEl=qs('#mpZoneMode');if(modeWrap)modeWrap.style.display=category==='dominacao'?'block':'none';if(modeEl&&document.activeElement!==modeEl)modeEl.value=m.zoneMode||(dominationPolygon(m).length>=3?'polygon':'radius');
    if(inp&&document.activeElement!==inp)inp.value=used;
    const note=qs('#mpCoverageBox .mp-note');renderDominationPolygonUi();
    if(category==='dominacao'){
      const geom=dominationZoneGeometry(m),outsideAccess=(m.points||[]).filter(isValidated).map(p=>dominationAccessDistance(m,p)).filter(Number.isFinite),minAccess=outsideAccess.length?Math.min(...outsideAccess):null,maxAccess=outsideAccess.length?Math.max(...outsideAccess):null,aa=dominationAccessAnalysis(m);
      const fair=dominationFairnessAnalysis(m),fairWarn=dominationFairnessWarnings(m),usedEdges=aa?new Set(aa.access.map(x=>x.edge).filter(Boolean)).size:0,accessSummary=aa?`${geom.mode==='polygon'?`Bordas com aproximação: <b>${usedEdges}/${geom.vertices}</b> • `:''}Cobertura angular: <b>${aa.sectors}/4 quadrantes</b> • maior trecho sem entrada: <b>${aa.largestGap.toFixed(0)}°</b><br>${fair?`Mediana de aproximação: <b>${fair.median.toFixed(0)} m</b> • amplitude: <b>${fair.spread.toFixed(0)} m</b><br>`:''}${fairWarn.length?`<span style="color:#ffd27a"><b>Crítica de equidade:</b><br>${fairWarn.map(x=>'• '+esc(x)).join('<br>')}</span><br>`:''}`:'';
      el.innerHTML=`${geom.mode==='polygon'?`Zona por polígono: <b>${geom.vertices} vértices</b> • área ~<b>${Math.round(geom.area).toLocaleString('pt-BR')} m²</b><br>`:(geom.mode==='polygon-incomplete'?`Zona por polígono: <b>EM CONSTRUÇÃO</b> • ${geom.vertices}/3+ vértices válidos<br>`:(geom.mode==='polygon-invalid'?`Zona por polígono: <b>AGUARDANDO CORREÇÃO</b> • existem CDS com X/Y inválidos<br>`:`Zona por raio: <b>${used} m</b><br>`))}Spawns/entradas cadastrados: <b>${counts.total}</b><br>${minAccess!==null?`Distância até a borda da zona: <b>${minAccess.toFixed(0)}–${maxAccess.toFixed(0)} m</b><br>`:''}${geom.mode==='polygon-incomplete'?'<span style="color:#ffd27a"><b>Análise de acesso pausada:</b> conclua o contorno com pelo menos 3 CDS válidas. Distâncias, quadrantes e equidade serão recalculados automaticamente quando a zona fechar.</span><br>':(geom.mode==='polygon-invalid'?'<span style="color:#ff9b9b"><b>Análise de acesso pausada:</b> corrija as CDS com X/Y inválidos. O sistema não conectará vértices ignorando pontos inválidos.</span><br>':'')}${accessSummary}<span style="color:#9ed7ff">A pontuação acontece dentro da zona. Os spawns podem e normalmente devem ficar externos, funcionando como pontos de entrada para a disputa.</span>`;
      if(note)note.textContent='Projete uma área ampla de disputa, com espaço para movimentação, cobertura e flancos. Evite zonas pequenas que permitam marcar facilmente os jogadores ou controlar todas as entradas.';
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
    const m=active();if(!state.map||!m)return;const poly=dominationPolygon(m),polyMode=(m.category||'dominacao')==='dominacao'&&dominationZoneMode(m)==='polygon';
    if(polyMode&&poly.length){const arr=poly.map(p=>ll(p.x,p.y));if(arr.length===1){state.map.setView(arr[0],Math.max(state.map.getZoom()||0,5));}else state.map.fitBounds(L.latLngBounds(arr).pad(.12),{padding:[35,35],maxZoom:6});return;}
    if(polyMode)return;
    if(!validCoord(m.center?.x)||!validCoord(m.center?.y))return;const r=effectiveEventRadius(m);if(r<=0)return;const temp=L.circle(ll(m.center.x,m.center.y),{radius:r});state.map.fitBounds(temp.getBounds(),{padding:[35,35],maxZoom:6});
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
    if(qs('#mpOverlap'))qs('#mpOverlap').textContent=over+(spawnProblems(m).duplicates.length?' • '+spawnProblems(m).duplicates.length+' duplicado(s)':'');
    if(qs('#mpNearest'))qs('#mpNearest').textContent=pair?`${pair[0]} ↔ ${pair[1]} • ${min.toFixed(1)} m`:'—';
  }
  function rawCds(p){return `${f(p.x)},${f(p.y)},${f(p.z)},${f(p.h)}`;}
  /* V12.17 — TP de teste com Z estimado: usa as CDS já validadas (spawns,
     centros e QGs) perto do ponto para não cair embaixo do mapa (limbo)
     e não precisar de NC. O Z salvo continua 0 até a validação real. */
  function knownHeights(){
    const key=state.missions.length+':'+state.missions.reduce((a,m)=>a+(m.points||[]).filter(isValidated).length+(isCenterValidated(m)?1:0),0)+':'+qgList().length;
    if(state._zIdx?.key===key)return state._zIdx.list;
    const list=[];
    state.missions.forEach(m=>{
      /* fora: spawns com altura suspeita e centro muito acima/abaixo dos spawns (ex.: z=481) */
      const susp=new Set(heightIssues(m).map(o=>o.n));
      const zs=(m.points||[]).filter(isValidated).map(p=>+p.z).filter(Number.isFinite).sort((a,b)=>a-b),med=zs.length?zs[Math.floor(zs.length/2)]:null;
      (m.points||[]).forEach((p,i)=>{if(isValidated(p)&&!susp.has(i+1))list.push({x:+p.x,y:+p.y,z:+p.z});});
      if(isCenterValidated(m)&&(med===null||Math.abs(+m.center.z-med)<=60))list.push({x:+m.center.x,y:+m.center.y,z:+m.center.z,centro:true});
    });
    qgList().forEach(q=>{if(Number.isFinite(q.z)&&q.z!==0)list.push({x:q.x,y:q.y,z:q.z});});
    /* descarta alturas absurdas (CDS capturada voando/no alto de prédio) */
    const ok=list.filter(o=>Number.isFinite(o.z)&&o.z>-5&&o.z<900);
    state._zIdx={key,list:ok};return ok;
  }
  function estimateZ(x,y){
    x=Number(x);y=Number(y);if(!Number.isFinite(x)||!Number.isFinite(y))return null;
    const near=knownHeights().map(o=>({...o,d:Math.hypot(o.x-x,o.y-y)})).filter(o=>o.d<=600).sort((a,b)=>a.d-b.d).slice(0,6);
    if(!near.length)return null;
    let z;
    if(near[0].d<20)z=near[0].z;
    else{let sw=0,sz=0;near.forEach(o=>{const w=1/(o.d*o.d);sw+=w;sz+=w*o.z;});z=sz/sw;
      /* terreno irregular perto: usa a maior altura próxima para nunca nascer enterrado */
      const perto=near.filter(o=>o.d<150);if(perto.length>=2){const zs=perto.map(o=>o.z);if(Math.max(...zs)-Math.min(...zs)>15)z=Math.max(z,Math.max(...zs));}}
    const conf=near[0].d<80?'alta':near[0].d<250?'média':'baixa';
    const margem=conf==='alta'?1.5:conf==='média'?3:6;
    return {z:z+margem,base:z,conf,n:near.length,d:near[0].d,margem};
  }
  function tpCds(p){
    const h=Number.isFinite(Number(p?.h))?Number(p.h):0;let z=Number.isFinite(Number(p?.z))?Number(p.z):0;
    if(!isValidated(p)&&!(z>0)){const e=estimateZ(p?.x,p?.y);if(e)z=e.z;}
    return `${f(p.x)},${f(p.y)},${f(z)},${f(h)}`;
  }
  function zHint(p){
    if(!p||isValidated(p))return '';const e=estimateZ(p.x,p.y);
    return e?`<span class="mpz ${e.conf==='baixa'?'low':''}">Z estimado ${e.base.toFixed(1)} + ${e.margem} m • confiança ${e.conf} (${e.n} CDS, mais perto a ${Math.round(e.d)} m)</span>`:'<span class="mpz low">Sem CDS validada a menos de 600 m: TP vai com Z=0 — use NC ou valide um ponto próximo antes</span>';
  }
  /* V9.6 DEV — pacote de produtividade/validação do Planejador */
  function median(nums){const a=nums.filter(Number.isFinite).sort((x,y)=>x-y);if(!a.length)return null;const i=Math.floor(a.length/2);return a.length%2?a[i]:(a[i-1]+a[i])/2;}
  function pointSegmentDistance(p,a,b){const px=Number(p.x),py=Number(p.y),ax=Number(a.x),ay=Number(a.y),bx=Number(b.x),by=Number(b.y),dx=bx-ax,dy=by-ay,l2=dx*dx+dy*dy;if(!l2)return Math.hypot(px-ax,py-ay);const t=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/l2));return Math.hypot(px-(ax+t*dx),py-(ay+t*dy));}
  function polygonEdgeAccess(m,p){const poly=activeDominationPolygon(m);if(poly.length<3)return null;let best={distance:Infinity,edge:0};for(let i=0;i<poly.length;i++){const d=pointSegmentDistance(p,poly[i],poly[(i+1)%poly.length]);if(d<best.distance)best={distance:d,edge:i+1};}return best;}
  function pointOnSegment(p,a,b,epsilon=.15){const px=Number(p.x),py=Number(p.y),ax=Number(a.x),ay=Number(a.y),bx=Number(b.x),by=Number(b.y),dx=bx-ax,dy=by-ay,l2=dx*dx+dy*dy;if(!Number.isFinite(px)||!Number.isFinite(py)||!l2)return Math.hypot(px-ax,py-ay)<=epsilon;const t=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/l2)),x=ax+t*dx,y=ay+t*dy;return Math.hypot(px-x,py-y)<=epsilon;}
  function pointInPolygon(p,poly){if(!p||!poly||poly.length<3)return false;for(let i=0;i<poly.length;i++)if(pointOnSegment(p,poly[i],poly[(i+1)%poly.length]))return true;const x=Number(p.x),y=Number(p.y);let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const xi=Number(poly[i].x),yi=Number(poly[i].y),xj=Number(poly[j].x),yj=Number(poly[j].y);if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))inside=!inside;}return inside;}
  function spawnInsideDomination(m,p){const poly=activeDominationPolygon(m);if(poly.length>=3)return pointInPolygon(p,poly);if(!validCoord(m?.center?.x)||!validCoord(m?.center?.y))return false;return pointDistanceFromCenter(m,p)<=effectiveEventRadius(m);}
  function dominationAccessDistance(m,p){if(['polygon-incomplete','polygon-invalid'].includes(dominationZoneGeometry(m).mode))return null;if(spawnInsideDomination(m,p))return 0;const edge=polygonEdgeAccess(m,p);return edge?edge.distance:Math.max(0,pointDistanceFromCenter(m,p)-effectiveEventRadius(m));}
  function nearestPolygonEdgePoint(m,p){const poly=activeDominationPolygon(m);if(poly.length<3)return null;let best={distance:Infinity,x:null,y:null,edge:null};for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],px=Number(p.x),py=Number(p.y),ax=Number(a.x),ay=Number(a.y),dx=Number(b.x)-ax,dy=Number(b.y)-ay,l2=dx*dx+dy*dy,t=l2?Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/l2)):0,x=ax+t*dx,y=ay+t*dy,d=Math.hypot(px-x,py-y);if(d<best.distance)best={distance:d,x,y,edge:i+1};}return best;}
  function dominationAccessTarget(m,p){if(['polygon-incomplete','polygon-invalid'].includes(dominationZoneGeometry(m).mode))return null;if(spawnInsideDomination(m,p))return {x:Number(p.x),y:Number(p.y),distance:0,edge:null,inside:true};const edge=nearestPolygonEdgePoint(m,p);if(edge)return {...edge,inside:false};if(!validCoord(m?.center?.x)||!validCoord(m?.center?.y))return null;const dx=Number(p.x)-Number(m.center.x),dy=Number(p.y)-Number(m.center.y),d=Math.hypot(dx,dy),r=effectiveEventRadius(m);if(!d)return {x:Number(m.center.x),y:Number(m.center.y),distance:0,edge:null};return {x:Number(m.center.x)+dx/d*r,y:Number(m.center.y)+dy/d*r,distance:Math.max(0,d-r),edge:null};}
  function drawDominationAccess(m){if((m?.category||'dominacao')!=='dominacao'||state.layerVisibility?.access===false)return;(m.points||[]).filter(isValidated).forEach(p=>{const t=dominationAccessTarget(m,p);if(!t)return;if(!t.inside){const line=L.polyline([ll(p.x,p.y),ll(t.x,t.y)],{weight:2,opacity:.72,dashArray:'6 7',interactive:false}).addTo(state.map);line._mpKind='access';state.drawn.push(line);}const label=L.marker(ll(t.x,t.y),{interactive:false,icon:L.divIcon({className:'',html:'<div style="white-space:nowrap;background:rgba(8,10,18,.82);border:1px solid rgba(255,255,255,.25);border-radius:8px;padding:2px 5px;color:#fff;font:10px system-ui">'+(t.inside?'DENTRO DA ZONA':Math.round(t.distance)+'m'+(t.edge?' • L'+t.edge:''))+'</div>',iconAnchor:[18,-4]})}).addTo(state.map);label._mpKind='access';state.drawn.push(label);});}

  function dominationAccessAnalysis(m){
    if(['polygon-incomplete','polygon-invalid'].includes(dominationZoneGeometry(m).mode))return null;
    const pts=(m?.points||[]).filter(isValidated),center=dominationAnalysisCenter(m);if(!m||pts.length<2||!center)return null;
    const poly=activeDominationPolygon(m),access=pts.map(p=>{let deg=Math.atan2(Number(p.y)-Number(center.y),Number(p.x)-Number(center.x))*180/Math.PI;if(deg<0)deg+=360;const inside=spawnInsideDomination(m,p),edge=!inside&&poly.length>=3?polygonEdgeAccess(m,p):null;return {id:p.id,deg,distanceToEdge:inside?0:(edge?edge.distance:Math.max(0,pointDistanceFromCenter(m,p)-effectiveEventRadius(m))),edge:edge?.edge||null,inside};}).sort((a,b)=>a.deg-b.deg);
    let largestGap=0;for(let i=0;i<access.length;i++){const a=access[i].deg,b=i===access.length-1?access[0].deg+360:access[i+1].deg;largestGap=Math.max(largestGap,b-a);}
    const sectors=new Set(access.map(x=>Math.floor(x.deg/90)%4));
    return {access,largestGap,sectors:sectors.size};
  }
  function dominationFairnessAnalysis(m){
    const aa=dominationAccessAnalysis(m);if(!aa?.access?.length)return null;const inside=aa.access.filter(x=>x.inside),external=aa.access.filter(x=>!x.inside),ds=external.map(x=>x.distanceToEdge).filter(Number.isFinite),med=median(ds);if(med===null)return {median:null,q1:null,q3:null,spread:0,short:[],long:[],maxEdge:null,total:aa.access.length,externalTotal:external.length,inside,external,access:aa.access};
    const sorted=[...ds].sort((a,b)=>a-b),q1=sorted[Math.floor((sorted.length-1)*.25)]||0,q3=sorted[Math.floor((sorted.length-1)*.75)]||0,spread=(Math.max(...ds)-Math.min(...ds));
    const short=external.filter(x=>x.distanceToEdge<Math.max(30,med*.55)),long=external.filter(x=>x.distanceToEdge>Math.max(med*1.65,med+180));
    const edgeCounts={};external.forEach(x=>{if(x.edge)edgeCounts[x.edge]=(edgeCounts[x.edge]||0)+1;});const maxEdge=Object.entries(edgeCounts).sort((a,b)=>b[1]-a[1])[0]||null;
    return {median:med,q1,q3,spread,short,long,maxEdge,total:aa.access.length,externalTotal:external.length,inside,external,access:aa.access};
  }
  function dominationFairnessWarnings(m){
    const f=dominationFairnessAnalysis(m),w=[];if(!f)return w;if(f.inside?.length)w.push('Spawn(s) já dentro da Zona de Pontuação: '+f.inside.map(x=>String(x.id).padStart(2,'0')).join(', ')+'. Confira se isso é intencional.');if(f.externalTotal<3)return w;
    if(f.short.length)w.push('Aproximação muito curta em relação ao conjunto: spawn(s) '+f.short.map(x=>String(x.id).padStart(2,'0')).join(', ')+'. Confira possível vantagem de chegada.');
    if(f.long.length)w.push('Aproximação muito longa em relação ao conjunto: spawn(s) '+f.long.map(x=>String(x.id).padStart(2,'0')).join(', ')+'. Confira possível desvantagem de chegada.');
    if(f.maxEdge&&Number(f.maxEdge[1])>=Math.ceil(f.externalTotal*.6))w.push('Concentração de acessos externos: '+f.maxEdge[1]+'/'+f.externalTotal+' spawns se aproximam pela borda L'+f.maxEdge[0]+'. Confira gargalo/camping de entrada.');
    return w;
  }

  function plannerAudit(m){
    const issues=[],warns=[]; if(!m)return {issues:['Nenhuma zona ativa.'],warns:[]};
    const category=m.category||'dominacao',poly=category==='dominacao'?dominationPolygon(m):[],zoneMode=category==='dominacao'?(m.zoneMode||(poly.length>=3?'polygon':'radius')):null,usesPolygon=category==='dominacao'&&zoneMode==='polygon';if(usesPolygon&&poly.length<3)issues.push('Forma da zona definida como Polígono por CDS, mas ainda faltam vértices válidos para fechar o contorno.');if(!usesPolygon&&(!validCoord(m.center?.x)||!validCoord(m.center?.y)))issues.push(category==='dominacao'?'Centro da Zona de Pontuação não definido para o modo Centro + Raio.':'Centro da zona não definido.');
    const pending=(m.points||[]).filter(p=>!isValidated(p)); if(pending.length)issues.push(pending.length+' spawn(s) ainda pendente(s) de validação.');
    if(category==='gas'){const c=zoneCoverageCounts(m);if(c.outside)issues.push(c.outside+' spawn(s) fora da safe inicial.');const r=ensureSafeRoute(m);const configured=r?.stages?.filter(safeStageValid).length||0;if(configured<3)warns.push('Rota progressiva da Safe está com '+configured+'/3 etapas configuradas.');safeRouteAudit(m).forEach(x=>issues.push(x));}
    else{const radius=effectiveEventRadius(m);if(usesPolygon){const pa=dominationPolygonAudit(m);issues.push(...pa.issues);warns.push(...pa.warns);}else{if(!Number.isFinite(radius)||radius<=0)issues.push('Raio da Zona de Pontuação inválido.');if(radius<150)warns.push('Zona de Pontuação pequena ('+Math.round(radius)+' m de raio). Confira se há espaço suficiente para movimentação, cobertura e flancos.');}const ds=(m.points||[]).filter(isValidated).map(p=>dominationAccessDistance(m,p));if(ds.length>=4){const min=Math.min(...ds),max=Math.max(...ds);if(max-min>300)warns.push('Acessos com diferença relevante: há cerca de '+Math.round(max-min)+' m entre a entrada mais próxima e a mais distante da borda da zona.');dominationFairnessWarnings(m).forEach(x=>warns.push(x));const aa=dominationAccessAnalysis(m);if(aa&&aa.sectors<3)warns.push('Acessos concentrados em apenas '+aa.sectors+' setor(es) ao redor da zona; confira se existem rotas de aproximação por lados diferentes.');if(aa&&aa.largestGap>180)warns.push('Há mais de 180° da Zona de Pontuação sem entrada cadastrada; confira risco de concentração da disputa em um único lado.');}}
    const allProblems=spawnProblems(m);if(allProblems.duplicates.length)issues.push(allProblems.duplicates.length+' par(es) de spawns praticamente duplicados (< 2 m).');
    const pts=(m.points||[]).filter(p=>isValidated(p));
    let nearest=Infinity,pair=null;for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){const d=distXY(pts[i],pts[j]);if(d<nearest){nearest=d;pair=[pts[i].id,pts[j].id];}}
    const minRecommended=(Number(m.spawnRadius)||100)*2;if(pair&&nearest<minRecommended)warns.push('Spawns '+pair[0]+' e '+pair[1]+' estão muito próximos ('+nearest.toFixed(0)+' m).');
    const zs=pts.map(p=>Number(p.z)).filter(Number.isFinite),med=median(zs);if(med!==null){const odd=pts.filter(p=>Math.abs(Number(p.z)-med)>80);if(odd.length)warns.push('Altitude atípica em '+odd.length+' spawn(s): '+odd.map(p=>p.id).join(', ')+'.');}
    return {issues,warns};
  }
  function zoneOperation(m){if(!m)return 'alter-zone';if(m.requestKind==='create-event')return 'create-event';if(m.requestKind==='create-zone'||m.official===false)return 'create-zone';return 'alter-zone';}
  function requestComparable(m){if(!m)return null;const x=JSON.parse(JSON.stringify(m));delete x.updatedAt;delete x._lastSavedRequestBase;delete x.requestText;return x;}
  function requestChangeScope(m){
    const base=m?._lastSavedRequestBase;if(!base)return {safeOnly:false,hasBase:false};
    const now=requestComparable(m),before=requestComparable(base),nowSafe=JSON.stringify(now?.safeRoute||null),beforeSafe=JSON.stringify(before?.safeRoute||null);
    if(now)delete now.safeRoute;if(before)delete before.safeRoute;
    const n=JSON.parse(JSON.stringify(now||{})),b=JSON.parse(JSON.stringify(before||{}));
    const nPoints=JSON.stringify(n.points||[]),bPoints=JSON.stringify(b.points||[]),nCenter=JSON.stringify(n.center||{}),bCenter=JSON.stringify(b.center||{}),nRadius=JSON.stringify({eventRadius:n.eventRadius,circleRadius:n.circleRadius}),bRadius=JSON.stringify({eventRadius:b.eventRadius,circleRadius:b.circleRadius}),nPoly=JSON.stringify(n.zonePolygon||[]),bPoly=JSON.stringify(b.zonePolygon||[]);
    const safeOnly=nowSafe!==beforeSafe&&JSON.stringify(now)===JSON.stringify(before);
    ['points','center','eventRadius','circleRadius','zonePolygon','zoneMode'].forEach(k=>{delete n[k];delete b[k];});
    const commonSame=JSON.stringify(n)===JSON.stringify(b),zoneChanged=nCenter!==bCenter||nRadius!==bRadius||nPoly!==bPoly||(before?.zoneMode||null)!==(now?.zoneMode||null),spawnsOnly=nPoints!==bPoints&&!zoneChanged&&commonSame,zoneOnly=nPoints===bPoints&&zoneChanged&&commonSame;
    const beforePoly=(before?.zonePolygon||[]).filter(p=>validCoord(p?.x)&&validCoord(p?.y)),nowPoly=(now?.zonePolygon||[]).filter(p=>validCoord(p?.x)&&validCoord(p?.y)),beforeZoneMode=before?.zoneMode||(beforePoly.length>=3?'polygon':'radius'),nowZoneMode=now?.zoneMode||(nowPoly.length>=3?'polygon':'radius'),zoneTransition=beforeZoneMode===nowZoneMode?(nowZoneMode==='polygon'&&nPoly!==bPoly?'polygon-to-polygon':null):(beforeZoneMode+'-to-'+nowZoneMode);return {hasBase:true,safeOnly,safeChanged:nowSafe!==beforeSafe,spawnsOnly,zoneOnly,polygonChanged:nPoly!==bPoly,zoneChanged,beforeZoneMode,nowZoneMode,zoneTransition};
  }
  function safeIssueStage(issue){
    const s=String(issue||'');let m=s.match(/SAFE\s+(\d+)/i);if(m)return Math.max(0,Number(m[1])-1);
    m=s.match(/após SAFE\s+(\d+)/i);if(m)return Math.max(0,Number(m[1])-1);
    return null;
  }
  function safePreflight(m){
    if(!m||(m.category||'dominacao')!=='gas')return {blocking:[],warnings:[],firstStage:null};
    const r=ensureSafeRoute(m),warnings=[];if(!r)return {blocking:[],warnings,firstStage:null};
    const missing=r.stages.map((s,i)=>safeStageValid(s)?null:i).filter(i=>i!==null);if(missing.length)warnings.push('SAFE(s) sem posição: '+missing.map(i=>'S'+(i+1)).join(', ')+'.');
    safeWalkAnalysis(m).forEach(a=>{if(a.status!=='SEGURO')warnings.push(a.from+'→'+a.to+': '+a.status+' • borda '+a.edgeSpeed.toFixed(2)+'m/s • recomendado ≥ '+a.recommended+'s.');});
    return {blocking:[],warnings,firstStage:missing[0]??null};
  }
  function focusSafePreflight(stage){
    const m=active(),r=ensureSafeRoute(m);if(!r?.stages?.length)return;
    const i=Math.min(Math.max(0,Number(stage)||0),r.stages.length-1);state.safeEditorStage=i;state.safeConfigView=true;state.layerVisibility.spawns=false;renderSafeRouteUi();renderMap();
    const st=r.stages[i];if(safeStageValid(st)&&state.map)state.map.panTo(ll(st.x,st.y));
  }
  function requireSafePreflight(m,action='gerar a solicitação'){
    const issues=safeRouteAudit(m),check=safePreflight(m);
    if(issues.length){
      state.lastRequestError=issues.join(' • ');
      alert('Não é seguro '+action+':\n\n- '+issues.join('\n- ')+'\n\nAjuste a SAFE ou utilize AUTO.');
      setSaveState('SAFE precisa de reparos antes da solicitação');
      return false;
    }
    if(check.warnings.length)setSaveState('SAFE com '+check.warnings.length+' aviso(s) técnico(s) • '+action+' permitido');
    return true;
  }
  function highRequestExport(){
    const m=active();if(!m)return '';const a=plannerAudit(m),pts=(m.points||[]).filter(isValidated),r=(m.category||'dominacao')==='gas'?ensureSafeRoute(m):null,isSurvival=/sobreviv[eê]ncia/i.test(m.event||''),change=requestChangeScope(m),polyRaw=(m.category||'dominacao')==='dominacao'&&Array.isArray(m.zonePolygon)?m.zonePolygon:[],polyAudit=(m.category||'dominacao')==='dominacao'?dominationPolygonAudit(m):null,polyPending=polyRaw.filter(v=>validCoord(v?.x)&&validCoord(v?.y)&&(!validCoord(v?.z)||v?.status!=='validated')).length,polyInvalid=polyRaw.filter(v=>!validCoord(v?.x)||!validCoord(v?.y)).length;
    const operation=zoneOperation(m),creating=operation==='create-event'||operation==='create-zone',zoneName=m.name||'Zona Principal',eventName=m.event||'Sem nome',facXFac=/fac\s*x\s*fac/i.test(eventName),subject=operation==='create-event'?'Solicitação de Criação do Evento '+eventName:(operation==='create-zone'?'Solicitação de Criação de Zona do Evento '+eventName+' — Zona '+zoneName:'Solicitação de Alteração da Zona do Evento '+eventName+' — Zona '+zoneName);
    const lines=['ASSUNTO:','- '+subject+'.','','SOLICITAÇÃO:','- '+(creating?'Solicitamos a criação':'Solicitamos a alteração')+' da zona "'+zoneName+'" do evento "'+eventName+'" no painel '+(m.panel||'/ilegal')+'.'];
    if(facXFac&&!creating)lines.push('- Evento base: Fac x Fac.');
    if(dominationZoneMode(m)==='polygon'&&(polyPending>0||polyInvalid>0)){lines.push('','STATUS DA ENTREGA:','- RASCUNHO — NÃO IMPLEMENTAR AINDA.');if(polyPending>0)lines.push('- Existem '+polyPending+' vértice(s) do polígono pendente(s) de validação com CDS reais no FiveM.');if(polyInvalid>0)lines.push('- Existem '+polyInvalid+' vértice(s) com X/Y inválidos que precisam ser corrigidos antes de fechar a zona.');lines.push('- As coordenadas válidas abaixo podem ser usadas para planejamento visual, mas devem ser confirmadas antes da implementação.');}
    if(isSurvival)lines.push('','BASE DO EVENTO — CLONE DO FAC X FAC:','- Utilizar o Fac X Fac atual como base do Sobrevivência.','- Preservar as mecânicas, regras, sistemas, escalação, inventário entregue aos participantes, caixas de loot, drop de itens ao morrer, ping para aliados, ranking e premiações já existentes no Fac X Fac.','- Não recriar nem alterar essas mecânicas sem necessidade; a diferença funcional desta solicitação é a SAFE DINÂMICA progressiva descrita abaixo.');
    if(change.safeOnly&&!creating)lines.push('','ESCOPO DA ALTERAÇÃO:','- Alteração exclusiva da SAFE progressiva desta zona.','- Manter centro, raio inicial, spawns, regras e demais configurações atuais sem alteração.','- Implementar somente as etapas e movimentos da SAFE descritos abaixo.');
    else if(change.spawnsOnly&&!creating)lines.push('','ESCOPO DA ALTERAÇÃO:','- Alteração exclusiva dos pontos de spawn desta zona.','- Manter centro, raio/zona de disputa, regras e demais configurações atuais sem alteração.','- Atualizar somente os spawns conforme as CDS abaixo.','','SPAWNS ATUALIZADOS:',...pts.map((p,i)=>'  '+String(i+1).padStart(2,'0')+' - '+f(p.x)+', '+f(p.y)+', '+f(p.z)+', '+f(p.h)));
    else if(change.zoneOnly&&!creating){const poly=dominationPolygon(m),polyMode=dominationZoneMode(m)==='polygon';lines.push('','ESCOPO DA ALTERAÇÃO:','- Alteração exclusiva da Zona de Pontuação deste evento.','- Manter spawns, mecânica de pontuação, regras, premiações e demais configurações atuais sem alteração.');if(polyMode&&poly.length<3){lines.push('- A forma escolhida é POLÍGONO POR CDS, porém o contorno ainda está incompleto.','- NÃO converter para Centro + Raio e NÃO implementar esta alteração enquanto faltarem vértices.','','ZONA ATUALIZADA — POLÍGONO EM CONSTRUÇÃO:','- Vértices válidos cadastrados: '+poly.length+' / mínimo 3.');poly.forEach((p,i)=>lines.push('  '+String(i+1).padStart(2,'0')+' - '+f(p.x)+', '+f(p.y)+', '+f(p.z)+(isValidated(p)?'':'  [PENDENTE DE VALIDAÇÃO]')));}else if(polyMode&&poly.length>=3){if(change.zoneTransition==='radius-to-polygon')lines.push('- Converter a Zona de Pontuação atual de CENTRO + RAIO para POLÍGONO POR CDS.');else if(change.zoneTransition==='polygon-to-polygon')lines.push('- Substituir o contorno atual do POLÍGONO pelas novas CDS abaixo.');else lines.push('- Atualizar os limites da Zona de Dominação pelas CDS abaixo.');lines.push('','ZONA ATUALIZADA — POLÍGONO POR CDS:');poly.forEach((p,i)=>lines.push('  '+String(i+1).padStart(2,'0')+' - '+f(p.x)+', '+f(p.y)+', '+f(p.z)+(isValidated(p)?'':'  [PENDENTE DE VALIDAÇÃO]')));lines.push('- As CDS acima formam o limite da Zona de Dominação, devem ser ligadas na ordem informada e fechadas do último ponto ao primeiro.','- Estas CDS NÃO são pontos de spawn.');}else{if(change.zoneTransition==='polygon-to-radius')lines.push('- Converter a Zona de Pontuação atual de POLÍGONO POR CDS para CENTRO + RAIO.','- O polígono/CDS de contorno anterior deixa de definir a área válida da Zona de Pontuação.','- Manter os pontos de spawn atuais sem alteração.');else lines.push('- Atualizar somente o centro e o raio conforme abaixo.');lines.push('','ZONA ATUALIZADA — CENTRO + RAIO:','- Centro: '+f(m.center?.x)+', '+f(m.center?.y)+', '+f(m.center?.z),'- Raio: '+Math.round(effectiveEventRadius(m))+'m');}}
    else{const poly=dominationPolygon(m),polyMode=dominationZoneMode(m)==='polygon';lines.push('','CONFIGURAÇÃO DA ZONA:');if((m.category||'dominacao')==='dominacao'&&polyMode&&poly.length<3){lines.push('- Forma da Zona de Pontuação: POLÍGONO POR CDS — INCOMPLETO.','- Vértices válidos cadastrados: '+poly.length+' / mínimo 3.','- NÃO implementar como Centro + Raio; concluir e validar o polígono antes da implementação.');poly.forEach((p,i)=>lines.push('  '+String(i+1).padStart(2,'0')+' - '+f(p.x)+', '+f(p.y)+', '+f(p.z)+(isValidated(p)?'':'  [PENDENTE DE VALIDAÇÃO]')));}else if((m.category||'dominacao')==='dominacao'&&polyMode&&poly.length>=3){lines.push('- Forma da Zona de Pontuação: POLÍGONO POR CDS.','- CDS que formam o limite da Zona de Dominação:');poly.forEach((p,i)=>lines.push('  '+String(i+1).padStart(2,'0')+' - '+f(p.x)+', '+f(p.y)+', '+f(p.z)+(isValidated(p)?'':'  [PENDENTE DE VALIDAÇÃO]')));lines.push('- Ligar as CDS na ordem informada e fechar do último ponto ao primeiro.','- Estas CDS formam a zona e NÃO são spawns.');}else lines.push('- Forma da zona: CENTRO + RAIO.','- Centro: '+f(m.center?.x)+', '+f(m.center?.y)+', '+f(m.center?.z),'- Raio inicial: '+Math.round(effectiveEventRadius(m))+'m');lines.push('','SPAWNS / PONTOS DE ENTRADA:','- Spawns validados: '+pts.length);pts.forEach((p,i)=>lines.push('  '+String(i+1).padStart(2,'0')+' - '+f(p.x)+', '+f(p.y)+', '+f(p.z)+', '+f(p.h)));}
    if(r){
      lines.push('','SAFE DINÂMICA:','- Volume vertical da SAFE: fundo '+r.height.bottom+' até teto '+r.height.top+'.','- Fluxo com '+r.stages.length+' etapas: ESPERA → MOVE + REDUZ RAIO → próxima SAFE.');
      r.stages.forEach((st,i)=>{
        lines.push('- Safe '+(i+1)+': '+f(st.x)+', '+f(st.y)+', 0.00 | raio '+Math.round(Number(st.radius)||0)+'m | dano '+(Number(st.damage)||0)+' HP/s | fechamento '+(Number(st.closeSeconds)||0)+'s'+(i<r.stages.length-1?' | movimento '+(Number(st.moveSeconds)||0)+'s':''));
        
      });
      lines.push('- HUD em movimento: "ATENÇÃO — A SAFE ZONE ESTÁ SE MOVENDO".','- Aviso fora da SAFE: "VOCÊ ESTÁ TOMANDO X DE DANO POR SEGUNDO FORA DA SAFE".','- X acompanha automaticamente o dano da etapa ativa.','- FECHAMENTO FINAL: a última SAFE deve reduzir continuamente até raio 0.','- ENCERRAMENTO: quando o raio atingir 0, encerrar o evento imediatamente.','- DURAÇÃO TOTAL DO EVENTO: '+safeTotalSeconds(m)+' segundos ('+formatDuration(safeTotalSeconds(m))+'). Esta duração é derivada da timeline da SAFE e substitui qualquer duração fixa anterior.');
    }
    lines.push('','VALIDAÇÃO:');if(!a.issues.length&&!a.warns.length)lines.push('- Configuração aprovada pelas validações automáticas do Planejador.');else{a.issues.forEach(x=>lines.push('- BLOQUEIO: '+x));a.warns.forEach(x=>lines.push('- AVISO: '+x));}
    lines.push('','OBSERVAÇÕES:',isSurvival?'- O Fac X Fac existente permanece como referência de funcionamento; implementar somente as diferenças necessárias para o Sobrevivência.':'- Preservar as mecânicas/regras já existentes do evento base quando aplicável.','- As CDS acima estão em formato simples; vec3/vec4 não é obrigatório.','- Spawns utilizam Z real; somente a referência visual da Safe utiliza Z = 0.');
    return lines.join('\n');
  }
  function technicalSummary(){
    const m=active();if(!m)return '';const a=plannerAudit(m),tl=(m.category||'dominacao')==='gas'?safeTimeline(m):[];
    return ['EVENTO: '+m.event,'ZONA: '+m.name,'STATUS: '+(a.issues.length?'BLOQUEADO':a.warns.length?'PRONTO COM AVISOS':'PRONTO'),'SPAWNS: '+(m.points||[]).filter(isValidated).length+'/'+(m.points||[]).length,'RAIO: '+Math.round(effectiveEventRadius(m))+'m',...(tl.length?['SAFE: '+tl.map(x=>x.label+' @ '+x.at+'s / '+Math.round(x.radius)+'m').join(' | ')]:[]),...(a.issues.length?['BLOQUEIOS: '+a.issues.join(' • ')]:[]),...(a.warns.length?['AVISOS: '+a.warns.join(' • ')]:[])].join('\n');
  }
  function exportMission(format='lua'){
    const m=active();if(!m)return '';if(format==='high'){/* V12.18: mesma solicitação padronizada da aba Solicitação */if(generateRequest({silent:true}))return m.requestText;return `RASCUNHO — NÃO ENVIAR À CIDADE AINDA\nMotivo: ${state.lastRequestError||'zona com pendências'}\nResolva as pendências na etapa Solicitação para gerar o texto oficial padronizado.\n\n----- PRÉVIA TÉCNICA -----\n\n`+highRequestExport();}if(format==='summary')return technicalSummary();const pts=(m.points||[]).filter(isValidated);
    if(format==='json')return JSON.stringify({event:m.event,zone:m.name,center:m.center,radius:effectiveEventRadius(m),spawns:pts,safeRoute:m.safeRoute||null,eventDurationSeconds:hasDynamicSafe(m)?safeTotalSeconds(m):null,endCondition:hasDynamicSafe(m)?'SAFE_RADIUS_ZERO':null},null,2);
    if(format==='plain')return pts.map((p,i)=>String(p.id||i+1).padStart(2,'0')+' - '+f(p.x)+', '+f(p.y)+', '+f(p.z)+', '+f(p.h)).join('\n');
    if(format==='vec3')return pts.map((p,i)=>String(p.id||i+1).padStart(2,'0')+' - vec3('+f(p.x)+', '+f(p.y)+', '+f(p.z)+')').join('\n');
    if(format==='vec4')return pts.map((p,i)=>String(p.id||i+1).padStart(2,'0')+' - vec4('+f(p.x)+', '+f(p.y)+', '+f(p.z)+', '+f(p.h)+')').join('\n');
    return pts.map((p,i)=>'['+(i+1)+'] = vector4('+f(p.x)+', '+f(p.y)+', '+f(p.z)+', '+f(p.h)+'),').join('\n');
  }
  function togglePlannerFullscreen(){
    const el=qs('#missionPlannerMap')?.closest('.mp-map-card')||qs('#missionPlannerMap');if(!el)return;
    el.classList.toggle('mp-pro-fullscreen');const on=el.classList.contains('mp-pro-fullscreen');
    Object.assign(el.style,on?{position:'fixed',inset:'0',zIndex:'99999',background:'#0b1018',padding:'12px'}:{position:'',inset:'',zIndex:'',background:'',padding:''});
    const map=qs('#missionPlannerMap');if(map)map.style.height=on?'calc(100vh - 24px)':'';
    qsa('.mp-map-toolbar,.mp-map-status',el).forEach(x=>x.style.display=on?'none':'');
    if(on&&active()){const m=active(),pts=(m.points||[]).filter(p=>validCoord(p.x)&&validCoord(p.y)).map(p=>ll(p.x,p.y));if(validCoord(m.center?.x)&&validCoord(m.center?.y))pts.push(ll(m.center.x,m.center.y));if(pts.length>1)setTimeout(()=>state.map?.fitBounds(L.latLngBounds(pts).pad(.08),{maxZoom:5}),120);}
    setTimeout(()=>state.map?.invalidateSize(),80);
  }
  function applyLayerVisibility(){
    (state.drawn||[]).forEach(l=>{const k=l._mpKind;if(!k)return;const visible=state.layerVisibility?.[k]!==false;try{if(visible&&!state.map.hasLayer(l))l.addTo(state.map);else if(!visible&&state.map.hasLayer(l))state.map.removeLayer(l);}catch(e){}});
  }
  const DRAFT_KEY='highos_mp_edit_draft_v1',LOCAL_PRESETS='highos_mp_local_presets_v1';
  function saveEditDraft(){
    if(!state.editing||!state.dirty)return;
    try{localStorage.setItem(DRAFT_KEY,JSON.stringify({at:nowIso(),activeId:state.activeId,eventId:active()?.eventId,missions:state.missions}));const el=qs('#mpDraftState');if(el)el.textContent='Rascunho salvo às '+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});}catch(e){}
  }
  function clearEditDraft(){try{localStorage.removeItem(DRAFT_KEY)}catch(e){}}
  function recoverEditDraft(){
    let d=null;try{d=JSON.parse(localStorage.getItem(DRAFT_KEY)||'null')}catch(e){}
    if(!d?.missions?.length)return;
    const current=state.missions.find(m=>m.id===d.activeId),draft=d.missions.find(m=>m.id===d.activeId);
    if(!draft)return;
    const newer=!current||new Date(draft.updatedAt||d.at||0)>new Date(current.updatedAt||0);
    if(newer&&confirm('Existe um rascunho não salvo do Planejador. Deseja recuperar?')){state.missions=d.missions;state.activeId=d.activeId;state.activeEventId=d.eventId||draft.eventId;saveStore();setSaveState('Rascunho recuperado • revise antes de salvar');}
    clearEditDraft();
  }
  function readLocalPresets(){try{return JSON.parse(localStorage.getItem(LOCAL_PRESETS)||'[]')}catch(e){return []}}
  function saveLocalPreset(){
    const m=active();if(!m)return;const list=readLocalPresets(),copy=JSON.parse(JSON.stringify(m));copy.id='localpreset_'+Date.now();copy.official=false;copy.createdAt=nowIso();copy.updatedAt=nowIso();list.unshift({name:(m.event||'Evento')+' — '+(m.name||'Zona'),mission:copy});try{localStorage.setItem(LOCAL_PRESETS,JSON.stringify(list.slice(0,12)));renderLocalPresets();}catch(e){alert('Não foi possível salvar o preset local.');}
  }
  function renderLocalPresets(){
    const el=qs('#mpLocalPresets');if(!el)return;const list=readLocalPresets();if(!list.length){el.textContent='Presets locais: nenhum salvo.';return;}
    el.innerHTML='<b>Presets locais:</b> '+list.map((p,i)=>'<button type="button" data-localpreset="'+i+'" style="margin:3px">'+esc(p.name)+'</button>').join('');
    qsa('[data-localpreset]',el).forEach(b=>b.onclick=()=>{cleanupSafePresentation();const p=readLocalPresets()[Number(b.dataset.localpreset)];if(!p?.mission)return;const m=JSON.parse(JSON.stringify(p.mission));m.id=uid();m.eventId=eventUid();m.event=(m.event||'Evento')+' (Preset)';m.createdAt=nowIso();m.updatedAt=nowIso();state.missions.push(m);state.activeId=m.id;state.activeEventId=m.eventId;saveStore();render();fit();});
  }
  function renderProTools(){
    let box=qs('#mpProTools');const anchor=qs('#mpSafeRouteBox')||qs('#mpCoverageBox');if(!anchor)return;
    if(!box){box=document.createElement('div');box.id='mpProTools';box.className='mp-card';box.style.marginTop='10px';box.innerHTML=`<h3>FERRAMENTAS DE MISSÃO</h3>
      <div id="mpAuditStatus" class="mp-readout"></div>
      <div class="mp-actions" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
        <button type="button" id="mpAuditBtn">VALIDAR ANTES DE PUBLICAR</button><button type="button" id="mpChecklistBtn">CHECKLIST DO EVENTO</button><button type="button" id="mpCompareBtn">ANTES × DEPOIS</button><button type="button" id="mpFullscreenBtn">MAPA TELA CHEIA</button><button type="button" id="mpSurvivalBtn">CRIAR SOBREVIVÊNCIA DO FAC X FAC</button>
      </div>
      <div class="mp-grid" style="margin-top:8px"><label>Exportação<select id="mpExportFormat"><option value="plain">CDS simples</option><option value="lua">Lua / vector4</option><option value="vec4">vec4</option><option value="vec3">vec3</option><option value="json">JSON</option><option value="high">Solicitação HIGH</option><option value="summary">Resumo técnico</option></select></label><label>Camadas<div style="display:flex;gap:10px;flex-wrap:wrap;padding-top:8px"><span><input type="checkbox" data-mplayer="zone" checked> Zona</span><span><input type="checkbox" data-mplayer="spawns" checked> Spawns</span><span><input type="checkbox" data-mplayer="center" checked> Centro</span><span><input type="checkbox" data-mplayer="access"> Acessos</span><span><input type="checkbox" id="mpLegendToggle" checked> Legenda</span><span><input type="checkbox" id="mpCompareLayerToggle"> Antes</span></div></label></div>
      <div class="mp-grid" style="margin-top:8px"><label>Ir para CDS <small style="opacity:.65">formato livre • vec é opcional</small><input id="mpGoCoord" placeholder="Cole a CDS como tiver: X,Y,Z • vec3/vec4 • /tpcds • /tp..."></label><label>Rascunho<div id="mpDraftState" class="mp-note" style="padding-top:8px">Nenhum rascunho pendente.</div></label></div>
      <div class="mp-actions" style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" id="mpGoCoordBtn">CENTRALIZAR CDS</button><button type="button" id="mpSavePresetBtn">SALVAR COMO PRESET LOCAL</button><button type="button" id="mpCopyExportPro">COPIAR EXPORTAÇÃO</button></div>
      <div id="mpLocalPresets" class="mp-note" style="margin-top:8px"></div>`;
      anchor.insertAdjacentElement('afterend',box);
      qs('#mpAuditBtn')?.addEventListener('click',()=>{renderProTools();const a=plannerAudit(active());alert(a.issues.length?'BLOQUEIOS:\n- '+a.issues.join('\n- ')+(a.warns.length?'\n\nAVISOS:\n- '+a.warns.join('\n- '):''):'Validação concluída sem bloqueios.'+(a.warns.length?'\n\nAvisos:\n- '+a.warns.join('\n- '):''));});
      qs('#mpChecklistBtn')?.addEventListener('click',()=>{const m=active(),a=plannerAudit(m),r=(m?.category||'dominacao')==='gas'?ensureSafeRoute(m):null,checks=[['Centro definido',validCoord(m?.center?.x)&&validCoord(m?.center?.y)],['Spawns cadastrados',(m?.points?.length||0)>0],['Todos os spawns validados',(m?.points||[]).length>0&&(m?.points||[]).every(isValidated)],['Raio da zona definido',effectiveEventRadius(m)>0],['Safe progressiva completa',!r||r.stages.every(safeStageValid)],['Sem bloqueios automáticos',a.issues.length===0]];alert('CHECKLIST — '+(m?.event||'EVENTO')+'\n\n'+checks.map(([n,ok])=>(ok?'✓ ':'✗ ')+n).join('\n')+(a.warns.length?'\n\nAVISOS:\n- '+a.warns.join('\n- '):''));});
      qs('#mpCompareBtn')?.addEventListener('click',()=>{const m=active(),old=state.editBackup?.zones?.find(z=>z.id===m?.id);if(!old){alert('Entre em EDITAR ZONA para comparar a versão salva com a alteração atual.');return;}state.compareOverlay=!state.compareOverlay;renderMap();const b=qs('#mpCompareBtn');if(b)b.textContent=state.compareOverlay?'OCULTAR ANTES':'ANTES × DEPOIS';const changes=[];if(Number(old.eventRadius)!==Number(m.eventRadius))changes.push('Raio: '+effectiveEventRadius(old)+' → '+effectiveEventRadius(m)+' m');if(old.points?.length!==m.points?.length)changes.push('Spawns: '+(old.points?.length||0)+' → '+(m.points?.length||0));if(distXY(old.center,m.center)>1)changes.push('Centro movido '+distXY(old.center,m.center).toFixed(0)+' m');setSaveState((state.compareOverlay?'Comparação visual ativa':'Comparação visual ocultada')+(changes.length?' • '+changes.join(' • '):''));});
      qs('#mpFullscreenBtn')?.addEventListener('click',togglePlannerFullscreen);qs('#mpSurvivalBtn')?.addEventListener('click',cloneFacXFacAsSurvival);
      qs('#mpGoCoordBtn')?.addEventListener('click',()=>{const r=parseCds(qs('#mpGoCoord')?.value);if(!r.ok||!validCoord(r.x)||!validCoord(r.y)){alert('CDS não reconhecida. Cole pelo menos X e Y.');return;}state.map?.setView(ll(r.x,r.y),5);});
      qs('#mpGoCoord')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();qs('#mpGoCoordBtn')?.click();}});qs('#mpGoCoord')?.addEventListener('input',e=>{const lab=e.target.closest('label')?.querySelector('small');if(lab)lab.textContent=cdsFormatHint(e.target.value)+' • vec é opcional';});
      qs('#mpSavePresetBtn')?.addEventListener('click',()=>saveLocalPreset());
      qsa('[data-mplayer]',box).forEach(c=>{c.checked=state.layerVisibility[c.dataset.mplayer]!==false;c.addEventListener('change',()=>{state.layerVisibility[c.dataset.mplayer]=c.checked;renderMap();});});qs('#mpLegendToggle')?.addEventListener('change',e=>{const x=qs('#mpMapLegend');if(x)x.style.display=e.target.checked?'':'none';});qs('#mpCompareLayerToggle')?.addEventListener('change',e=>{if(!state.editing&&e.target.checked){e.target.checked=false;alert('Entre em EDITAR ZONA para visualizar a versão anterior.');return;}state.compareOverlay=e.target.checked;renderMap();});
      qs('#mpCopyExportPro')?.addEventListener('click',async()=>{const fmt=qs('#mpExportFormat')?.value||'lua',m=active();if(fmt==='high'&&(m?.category||'dominacao')==='gas'&&!requireSafePreflight(m,'copiar a solicitação HIGH'))return;await copyText(exportMission(fmt));const b=qs('#mpCopyExportPro');if(b){b.textContent='COPIADO ✓';setTimeout(()=>b.textContent='COPIAR EXPORTAÇÃO',900);}});
    }
    const a=plannerAudit(active()),el=qs('#mpAuditStatus');if(el)el.innerHTML=a.issues.length?'<b style="color:#ff7474">NÃO PRONTO PARA PUBLICAR</b><br>'+esc(a.issues.join(' • ')):(a.warns.length?'<b style="color:#ffd166">PRONTO COM AVISOS</b><br>'+esc(a.warns.join(' • ')):'<b class="mp-ok">PRONTO PARA PUBLICAR ✓</b><br>Centro, spawns e cobertura passaram nas validações automáticas.');
    qsa('[data-mplayer]',box).forEach(c=>c.checked=state.layerVisibility?.[c.dataset.mplayer]!==false);const lg=qs('#mpMapLegend');if(lg)lg.style.display=qs('#mpLegendToggle')?.checked===false?'none':'';const ct=qs('#mpCompareLayerToggle');if(ct){ct.checked=!!state.compareOverlay;ct.disabled=!state.editing;}const cb=qs('#mpCompareBtn');if(cb)cb.textContent=state.compareOverlay?'OCULTAR ANTES':'ANTES × DEPOIS';renderLocalPresets();
  }

  function updateExport(){const m=active(),
out=qs('#mpExport');if(out&&m)out.value=m.points.filter(isValidated).map((p,i)=>`${p.id||i+1} - ${rawCds(p)}`).join('\n');}
  function render(){adoptStrayCards();ensureSafeRouteUi();adoptStrayCards();renderMissionList();renderPointList();renderMap();analyze();updateExport();syncForm();renderCenterValidation();renderCoverage();renderProTools();renderPlannerBadges();renderWorkspaceBar();renderBackupList();syncEventKind();renderRequestStatus();const rt=qs('#mpRequestText'),
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

  function editSnapshot(){return JSON.stringify({missions:state.missions,activeId:state.activeId,activeEventId:state.activeEventId});}
  function pushUndo(){
    if(!state.editing)return false;const before=state.lastEditSnapshot,current=editSnapshot();if(!before||before===current)return false;if(state.undoStack.at(-1)!==before){state.undoStack.push(before);if(state.undoStack.length>30)state.undoStack.shift();}state.redoStack=[];return true;
  }
  function restoreEditSnapshot(raw,label){
    if(!raw)return;try{const x=JSON.parse(raw);state.missions=x.missions;state.activeId=x.activeId;state.activeEventId=x.activeEventId;state.lastEditSnapshot=editSnapshot();state.dirty=true;render();updateEditUi();setSaveState(label+' • NÃO SALVO');}catch(e){}
  }
  function undoEdit(){if(!state.editing||!state.undoStack.length)return;state.redoStack.push(editSnapshot());const target=state.undoStack.pop();restoreEditSnapshot(target,'DESFEITO');state.lastEditSnapshot=editSnapshot();}
  function redoEdit(){if(!state.editing||!state.redoStack.length)return;state.undoStack.push(editSnapshot());const target=state.redoStack.pop();restoreEditSnapshot(target,'REFAZENDO');state.lastEditSnapshot=editSnapshot();}
  function commit(reason='Alteração'){
    const m=active();if(!m)return;
    if(state.editing){const changed=pushUndo();if(!changed){setSaveState('Nenhuma alteração detectada');return;}m.updatedAt=nowIso();state.lastEditSnapshot=editSnapshot();state.dirty=true;render();setSaveState(`${reason} • NÃO SALVO`);return;}
    m.updatedAt=nowIso();saveStore();render();setSaveState(`${reason} • salvo`);queueSnapshot();
  }
  function resetMapPlacementModes(){state.mapMode='center';state.placing=false;state.polygonPlacement=false;state.safePlacementStage=null;clearSafeHover();qs('#missionPlannerMap')?.classList.remove('mp-crosshair');if(state.map?.getContainer())state.map.getContainer().style.cursor='';const pb=qs('#mpPlaceBtn');if(pb)pb.textContent='MARCAR PONTO NO MAPA';const vb=qs('#mpDomPolygonPlace');if(vb)vb.textContent='MARCAR VÉRTICE NO MAPA';}
  function requireEdit(){if(state.editing)return true;alert('Zona travada em modo visualização. Clique em EDITAR ZONA para fazer alterações.');return false;}
  function startEdit(){const m=active();if(!m||state.editing)return;state.undoStack=[];state.redoStack=[];state.compareOverlay=false;state.editBackup={eventId:m.eventId,
zones:JSON.parse(JSON.stringify(zonesOfEvent(m.eventId)))};state.editing=true;state.dirty=false;resetMapPlacementModes();state.lastEditSnapshot=editSnapshot();render();updateEditUi();setSaveState('MODO EDIÇÃO • alterações ainda não salvas');}
  function saveMission(){const m=active();if(!m)return;if(!state.editing){setSaveState('Nenhuma alteração para salvar');return;}const audit=plannerAudit(m);if(audit.issues.length&&!confirm('Existem bloqueios de validação:\n\n- '+audit.issues.join('\n- ')+'\n\nSalvar mesmo assim como rascunho?'))return;m.updatedAt=nowIso();const original=state.editBackup?.zones?.find(z=>z.id===m.id);if(original)m._lastSavedRequestBase=requestComparable(original);saveStore();const pendentes=state.missions.filter(z=>isPendingZone(z)&&!z._syncConflict);const cloudPush=syncPendingZones(pendentes);setCloudState('sync','↻ SALVANDO NO FIREBASE...');clearEditDraft();state.editBackup=null;state.editing=false;state.dirty=false;resetMapPlacementModes();state.undoStack=[];state.redoStack=[];state.lastEditSnapshot=null;state.compareOverlay=false;render();updateEditUi();setSaveState(audit.issues.length?'Zona salva como rascunho ⚠ • enviando Firebase':'Zona salva ✓ • enviando Firebase');Promise.resolve(cloudPush).then(async r=>{if(r?.conflicts?.length){setCloudState('local','⚠ CONFLITO DE VERSÃO');setSaveState('Outra pessoa alterou esta zona • escolha qual versão manter');await resolveZoneConflicts();setCloudState('ok',cloudSummary());return;}if(r?.ok){setCloudState('ok',cloudSummary());setSaveState(audit.issues.length?'Rascunho salvo ⚠ • Firebase sincronizado':'Zona salva ✓ • Firebase sincronizado');}else{setCloudState('local','⚠ SALVO LOCAL • FIREBASE PENDENTE');setSaveState('Salvo localmente • Firebase pendente');}}).catch(()=>{setCloudState('local','⚠ SALVO LOCAL • FIREBASE PENDENTE');setSaveState('Salvo localmente • Firebase pendente');});queueSnapshot();}
  function cancelEdit(){if(!state.editing)return;clearEditDraft();if(state.editBackup?.eventId&&Array.isArray(state.editBackup.zones)){const eid=state.editBackup.eventId;const keep=state.missions.filter(x=>x.eventId!==eid);state.missions=[...state.editBackup.zones,
...keep];}state.editBackup=null;state.editing=false;state.dirty=false;resetMapPlacementModes();state.undoStack=[];state.redoStack=[];state.lastEditSnapshot=null;state.activeEventId=active()?.eventId||state.activeEventId;render();updateEditUi();setSaveState('Alterações descartadas • visualização');}
  function updateEditUi(){
    const edit=state.editing;const eb=qs('#mpEditMission'),
sb=qs('#mpSaveMission'),
cb=qs('#mpCancelEdit');
    if(eb)eb.style.display=edit?'none':'';if(sb)sb.style.display=edit?'':'none';if(cb)cb.style.display=edit?'':'none';const ub=qs('#mpUndoEdit'),rb=qs('#mpRedoEdit');if(ub){ub.style.display=edit?'':'none';ub.disabled=!state.undoStack.length;}if(rb){rb.style.display=edit?'':'none';rb.disabled=!state.redoStack.length;}
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
      if(typeof html2canvas==='undefined'&&window.HighCarregarHtml2canvas)await window.HighCarregarHtml2canvas();
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

  function fit(){const m=active();if(!state.map||!m)return;const arr=(m.points||[]).filter(p=>validCoord(p.x)&&validCoord(p.y)).map(p=>ll(p.x,p.y)),poly=activeDominationPolygon(m);poly.forEach(p=>arr.push(ll(p.x,p.y)));if(dominationZoneMode(m)!=='polygon'&&validCoord(m.center?.x)&&validCoord(m.center?.y))arr.push(ll(m.center.x,m.center.y));if(arr.length===1)state.map.setView(arr[0],5);else if(arr.length)state.map.fitBounds(L.latLngBounds(arr).pad(.12),{padding:[30,30],maxZoom:6});}
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
  function parseBulk(text){const out=[];String(text||'').split(/\n+/).forEach(line=>{const c=line.replace(/^\s*\d+\s*[-–—:)]\s*/,'').trim();if(!c)return;const r=parseCds(c);if(!r.ok)return;out.push({x:r.x,y:r.y,z:r.z,h:r.h});});return out;}
  function cdsFormatHint(raw){
    const t=String(raw||'').trim();if(!t)return 'Formato livre';
    if(/vector4|vec4/i.test(t))return 'vec4 detectado';if(/vector3|vec3/i.test(t))return 'vec3 detectado';if(/^\s*\/?(tpcds|tp|nc|setcoords|coords?)/i.test(t))return 'Comando detectado';return 'CDS simples detectada';
  }
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
    await copyText(tpCds(p));
    setValidationFeedback(`<b>TP do ponto ${id} copiado</b><span>${isValidated(p)?'CDS validada.':zHint(p)}</span><span>Vá até o local no jogo, ajuste a posição e cole a CDS real aqui.</span>`,'ok');
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
    cleanupSafePresentation();if(state.editing)cancelEdit();
    const m=newMission(null,null,state.libraryCategory||'dominacao');
    m.name='Zona Principal';m.requestKind='create-event';
    state.missions.unshift(m);state.activeId=m.id;state.activeEventId=m.eventId;saveStore();setWorkspace(true);render();startEdit();state.map?.setView(ll(900,-600),3);setSaveState('Novo evento criado • configure a Zona Principal e clique SALVAR EVENTO');
  }
  function createZone(){
    if(state.editing&&state.dirty&&!confirm('Descartar alterações não salvas e criar uma nova zona?'))return;
    cleanupSafePresentation();if(state.editing)cancelEdit();
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
    const overlays=[state.cayoLayer,state.cayoPostalLayer].filter(Boolean),checks=qsa('#mpLayerControl [data-over]');
    if(isCayo){
      if(state.cayoOceanLayer&&!state.map.hasLayer(state.cayoOceanLayer))state.cayoOceanLayer.addTo(state.map);
      const satCheck=qs('#mpLayerControl [data-over="cayo"]'),postalCheck=qs('#mpLayerControl [data-over="cayoPostal"]');
      // Ao entrar em Cayo sem preferência ativa, liga somente o satélite para evitar duas imagens sobrepostas.
      if(state.cayoLayer&&!state.map.hasLayer(state.cayoLayer)&&!state.map.hasLayer(state.cayoPostalLayer)){state.cayoLayer.addTo(state.map);if(satCheck)satCheck.checked=true;if(postalCheck)postalCheck.checked=false;}
      checks.forEach(x=>{x.disabled=false;const layer=x.dataset.over==='cayo'?state.cayoLayer:state.cayoPostalLayer;x.checked=!!layer&&state.map.hasLayer(layer);});
    }else{
      [...overlays,state.cayoOceanLayer].filter(Boolean).forEach(l=>{if(state.map.hasLayer(l))state.map.removeLayer(l);});
      checks.forEach(x=>{x.checked=false;x.disabled=false;});
    }
    updateMapDiagnostics(isCayo?'região Cayo':'região Los Santos');
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
  function cleanupSafePresentation(){
    if(state.safePresentation){stopSafePreview();exitSafePresentation();}
    else stopSafePreview();
    state.safePlacementStage=null;
    const mapEl=state.map?.getContainer?.();if(mapEl)mapEl.style.cursor='';
  }
  function switchMission(id){if(state.editing&&state.dirty&&!confirm('Existem alterações não salvas. Deseja descartá-las?'))return;cleanupSafePresentation();if(state.editing)cancelEdit();state.activeId=id;const m=state.missions.find(m=>m.id===id);state.activeEventId=m?.eventId||state.activeEventId;state.libraryCategory=(m?.category||state.libraryCategory||'dominacao');saveStore();setWorkspace(true);render();updateEditUi();focusActiveMission(true);}
  function deleteZone(){const m=active();if(!m)return;const zones=zonesOfEvent(m.eventId);if(zones.length<=1){alert('Este é o único mapa/zona do evento. Para removê-lo, exclua o evento inteiro.');return;}if(!confirm(`Apagar somente a zona "${m.name}" do evento "${m.event}"?\n\nA exclusão vale para toda a equipe.`))return;setSaveState('Excluindo no Firebase...');deleteZonesSynced([m]).then(ok=>{if(!ok){setSaveState('Exclusão cancelada • nada foi apagado');return;}cleanupSafePresentation();state.missions=state.missions.filter(x=>x.id!==m.id);const next=zones.find(x=>x.id!==m.id);state.activeId=next?.id||null;saveStore();render();focusActiveMission(false);setSaveState('Zona excluída ✓ • Firebase sincronizado');});}
  function deleteEvent(){
    const m=active();if(!m)return;const zones=zonesOfEvent(m.eventId);
    if(zones.some(z=>z.official)){if(!confirm(`Este evento contém zona(s) cadastrada(s) originalmente no sistema. Excluir o evento "${m.event}" e suas ${zones.length} zona(s)?`))return;}
    else if(!confirm(`Excluir o evento "${m.event}" e TODAS as ${zones.length} zona(s)?`))return;
    setSaveState('Excluindo no Firebase...');
    deleteZonesSynced(zones).then(ok=>{
      if(!ok){setSaveState('Exclusão cancelada • nada foi apagado');return;}
      cleanupSafePresentation();state.missions=state.missions.filter(x=>x.eventId!==m.eventId);
      const first=state.missions.find(x=>(x.category||'dominacao')===state.libraryCategory)||state.missions[0];
      state.activeId=first?.id||null;state.activeEventId=first?.eventId||null;saveStore();render();focusActiveMission(false);
      setSaveState('Evento excluído ✓ • Firebase sincronizado');
    });
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
  function cloneFacXFacAsSurvival(){
    const m=active();if(!m)return;if(!/fac\s*x\s*fac/i.test(m.event||'')){alert('Selecione primeiro um evento Fac x Fac para criar o Sobrevivência.');return;}
    if(state.editing&&state.dirty){alert('Salve ou cancele as alterações antes de criar o Sobrevivência.');return;}
    const source=zonesOfEvent(m.eventId),eid=eventUid();
    const clones=source.map((z,idx)=>{const c=JSON.parse(JSON.stringify(z));c.id=uid();c.eventId=eid;c.event='Sobrevivência';c.category='gas';c.official=false;c.createdAt=nowIso();c.updatedAt=nowIso();c.requestText='';c.requestKind=idx===0?'create-event':'create-zone';c.center.label='Centro da Safe / Marco Zero';ensureSafeRoute(c);c.safeRoute.stages.forEach(st=>st.z=0);return c;});
    state.missions.unshift(...clones);state.activeId=clones[0].id;state.activeEventId=eid;state.libraryCategory='gas';saveStore();render();startEdit();setSaveState('Sobrevivência criado a partir do Fac x Fac • original preservado');
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
    if((m?.category||'dominacao')==='gas'&&hasDynamicSafe(m)){
      (sr.stages||[]).forEach(s=>parts.push(`${f(s.x)},${f(s.y)},${Math.round(Number(s.radius)||0)},${Number(s.damage)||0},${Number(s.closeSeconds)||0},${Number(s.moveSeconds)||0}`));
    }
    /* dominação por polígono: o contorno também é geografia aplicada pela cidade */
    if(dominationZoneMode(m)==='polygon')dominationPolygon(m).forEach(p=>parts.push(`v:${f(p.x)},${f(p.y)}`));
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
    if(old.safe&&old.safe!==now.safe)out.push((m?.category||'dominacao')==='gas'?'Movimentação da safe alterada (ver bloco MOVIMENTAÇÃO DA SAFE).':'Contorno do polígono da Zona de Dominação alterado (ver CDS do polígono).');
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
  /* V12.18 — partidas a partir do Diário Operacional (registros /highos registrar no Discord) */
  const normEv=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  function diarioId(r){return String(r?.id||`${r?.date}|${r?.time}|${r?.title||r?.scheduleName}`);}
  async function diarioEventos(force=false){
    const c=window.HighOSMissionCloud;if(!c?.diarioEventos)return null;
    if(!force&&state._diario&&Date.now()-state._diario.at<120000)return state._diario.list;
    try{const list=await c.diarioEventos();state._diario={at:Date.now(),list:Array.isArray(list)?list:[]};return state._diario.list;}catch(e){return null;}
  }
  function diarioDoEvento(eventId,list){
    const zones=zonesOfEvent(eventId),k=normEv(zones[0]?.event);if(!k||!Array.isArray(list))return [];
    const feitos=new Set(zones.flatMap(z=>partidasDe(z).map(p=>p.diarioId).filter(Boolean)));
    return list.filter(r=>{const tt=normEv(`${r.title||''} ${r.scheduleName||''}`);return tt.includes(k)&&String(r.winner||'').trim()&&!feitos.has(diarioId(r));})
      .sort((a,b)=>`${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)).slice(0,12);
  }
  function openPartidasModal(eventId,zoneId=null){
    const zones=zonesOfEvent(eventId);if(!zones.length)return;
    const ev=zones[0].event||'Evento';
    let modal=qs('#mpPartidasModal');if(modal)modal.remove();
    modal=document.createElement('div');modal.id='mpPartidasModal';modal.className='mp-replicate-backdrop';
    let diario=null,pendDiario=null,pref=null;
    const draw=()=>{
      const ins=eventInsights(eventId),lista=partidasEvento(eventId).slice(0,25),since=CATALOG()?.tempoDesde||(()=>'');
      const zSel=qs('#mppZona',modal)?.value||zoneId||ins.sugestao?.z.id||zones[0].id;
      const zAtual=zones.find(z=>z.id===zSel)||zones[0];
      const dicas=[];
      if(ins.sugestao)dicas.push(`Zona sugerida para a próxima: <b>${esc(ins.sugestao.z.name)}</b> (${ins.sugestao.last?`última partida ${since(ins.sugestao.last)}`:'ainda sem partida'})`);
      if(ins.dominante)dicas.push(`<b>${esc(ins.dominante.nome)}</b> venceu ${ins.dominante.q} das últimas ${ins.dominante.de}`);
      if(ins.partMax)dicas.push(`Participação: média ${ins.partMed} · pico ${ins.partMax} facções`);
      zones.forEach(z=>{const zi=zoneInsights(z);zi.hot.forEach(h=>dicas.push(`<span class="w">${esc(z.name)}: spawn ${pad2(h.n)} venceu ${h.w} de ${zi.comSpawn}</span>`));if(zi.setor)dicas.push(`<span class="w">${esc(z.name)}: lado ${zi.setor.nome} venceu ${zi.setor.q} de ${zi.comSpawn}</span>`);});
      const dl=diarioDoEvento(eventId,diario);
      const diarioHtml=diario===null?(window.HighOSMissionCloud?.diarioEventos?'<div class="mpp-diario"><span>DIÁRIO OPERACIONAL · carregando…</span></div>':''):(dl.length?`<div class="mpp-diario"><span>NO DIÁRIO OPERACIONAL (DISCORD) · ${dl.length} resultado${dl.length===1?'':'s'} para registrar</span>${dl.map((r,i)=>`<div><b>${esc(String(r.date||'').split('-').reverse().join('/'))} ${esc(r.time||'')}</b><em>${esc(r.winner)}</em><small>${esc(r.title||r.scheduleName||'Evento')}${r.result?` · ${esc(String(r.result).slice(0,60))}`:''}</small><button type="button" data-dusar="${i}">USAR</button></div>`).join('')}<small class="mpp-dnote">USAR preenche o formulário; escolha a zona (e o spawn, se souber) e clique em REGISTRAR.</small></div>`:'');
      modal.innerHTML=`<div class="mp-replicate-modal mpk-modal"><div class="mp-replicate-head"><div><b>PARTIDAS · ${esc(ev)}</b><small>${ins.total} partida${ins.total===1?'':'s'} registrada${ins.total===1?'':'s'} • o registro alimenta a análise de zonas, spawns e facções</small></div><button data-close>×</button></div>
        ${dicas.length?`<div class="mpp-dicas">${dicas.map(d=>`<span>${d}</span>`).join('')}</div>`:''}
        ${diarioHtml}
        <div class="mpp-form">
          <label>ZONA<select id="mppZona">${zones.map(z=>`<option value="${esc(z.id)}" ${z.id===zAtual.id?'selected':''}>${esc(z.name||'Zona')}${ins.sugestao?.z.id===z.id?' ★':''}</option>`).join('')}</select></label>
          <label>DATA/HORA<input id="mppAt" type="datetime-local" value="${pref?.at||new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16)}"></label>
          <label>FACÇÕES<input id="mppPart" type="number" min="1" max="99" placeholder="nº"></label>
          <label class="wide">CAMPEÃ<input id="mppCampea" list="mppFacs" placeholder="Facção ou Group" value="${esc(pref?.campea||'')}"><datalist id="mppFacs">${faccaoOptions().map(f=>`<option value="${esc(f)}">`).join('')}</datalist></label>
          <label>SPAWN DA CAMPEÃ<select id="mppSpawn"><option value="">—</option>${(zAtual.points||[]).map((p,i)=>`<option value="${i}">${pad2(i+1)}</option>`).join('')}</select></label>
          <label class="wide">OBS.<input id="mppObs" placeholder="opcional" value="${esc(pref?.obs||'')}"></label>
          <button type="button" class="primary" id="mppSalvar">REGISTRAR PARTIDA</button>
        </div>
        <div class="mpp-lista">${lista.length?lista.map(p=>`<div><b>${esc(fmtLogDate(p.at))}</b><span>${esc(p.zona)}</span><em>${esc(p.campea||'—')}</em><small>${p.participantes?`${p.participantes} fac.`:''}${p.spawnN?` · spawn ${pad2(p.spawnN)}`:''}${p.obs?` · ${esc(p.obs)}`:''}</small><button type="button" data-del="${esc(p.zoneId)}|${esc(p.id)}" title="Excluir">×</button></div>`).join(''):'<div class="mpc-empty">Nenhuma partida registrada ainda.</div>'}</div>
        <div class="mp-replicate-actions"><button data-close>FECHAR</button></div></div>`;
      qsa('[data-close]',modal).forEach(b=>b.onclick=()=>modal.remove());
      const keepForm=()=>{if(pendDiario||qs('#mppCampea',modal)?.value)pref={at:qs('#mppAt',modal)?.value,campea:qs('#mppCampea',modal)?.value,obs:qs('#mppObs',modal)?.value};};
      qs('#mppZona',modal).onchange=()=>{keepForm();zoneId=qs('#mppZona',modal).value;draw();};
      qsa('[data-dusar]',modal).forEach(b=>b.onclick=()=>{const r=dl[Number(b.dataset.dusar)];if(!r)return;pendDiario=diarioId(r);pref={at:r.date?`${r.date}T${String(r.time||'20:00').slice(0,5)}`:'',campea:r.winner,obs:`Diário: ${r.title||r.scheduleName||'evento'}${r.createdByName?` · ${r.createdByName}`:''}`};draw();qs('#mppCampea',modal)?.focus();});
      qs('#mppSalvar',modal).onclick=()=>{
        if(!canMarkRequests()){alert('Seu acesso ao Planejador é somente leitura.');return;}
        const z=zones.find(x=>x.id===qs('#mppZona',modal).value);if(!z)return;
        const campea=qs('#mppCampea',modal).value.trim();if(!campea){alert('Informe a facção campeã.');return;}
        const si=qs('#mppSpawn',modal).value,sp=si!==''?z.points[Number(si)]:null;
        const at=new Date(qs('#mppAt',modal).value||Date.now());
        const reg={id:uid(),...(pendDiario?{diarioId:pendDiario}:{}),at:(Number.isFinite(at.getTime())?at:new Date()).toISOString(),by:cloudUser(),campea,participantes:Number(qs('#mppPart',modal).value)||null,obs:qs('#mppObs',modal).value.trim(),spawnN:sp?Number(si)+1:null,spawn:sp?{x:r2(sp.x),y:r2(sp.y)}:null};
        z.partidas=[reg,...partidasDe(z)].slice(0,80);
        pendDiario=null;pref=null;saveStore();zoneId=z.id;draw();render();renderCentralV954();
      };
      qsa('[data-del]',modal).forEach(b=>b.onclick=()=>{
        if(!canMarkRequests())return;const [zid,pid]=b.dataset.del.split('|');const z=zones.find(x=>x.id===zid);if(!z||!confirm('Excluir esta partida do registro?'))return;
        z.partidas=partidasDe(z).filter(p=>p.id!==pid);saveStore();draw();render();renderCentralV954();
      });
    };
    document.body.appendChild(modal);draw();
    modal.addEventListener('click',e=>{if(e.target===modal)modal.remove();});
    diarioEventos().then(l=>{diario=l||[];if(document.body.contains(modal)){keepFormOuter();draw();}});
    function keepFormOuter(){if(qs('#mppCampea',modal)?.value)pref={at:qs('#mppAt',modal)?.value,campea:qs('#mppCampea',modal)?.value,obs:qs('#mppObs',modal)?.value};}
  }

  /* V12.15 — MONTAGEM INTELIGENTE
     · Safe automática: tempos pela duração alvo (~20 min), raios por
       fase, opções de SAFE 2/3 em terra e válidas entre si.
     · Altura suspeita: CDS validada muito acima/abaixo das demais
       (risco de limbo ou de nascer no alto).
     · Sugerir locais: varre a área visível do mapa e propõe centros
       com mais terra firme, sem QG e sem sobrepor as outras zonas.
     · Otimizar spawns: troca só os spawns problemáticos (água, QG,
       colados, fora da faixa) mantendo a numeração. */
  function duracaoAlvo(){return Number(CATALOG()?.DURACAO_ALVO_MIN)||20;}
  function safeDuration(m){return hasDynamicSafe(m)?safeTotalSeconds(m):0;}
  async function landFraction(cx,cy,r,n=16){
    const pts=[[cx,cy],...Array.from({length:n},(_,i)=>{const a=i/n*Math.PI*2;return [cx+Math.sin(a)*r*.7,cy+Math.cos(a)*r*.7];}),...Array.from({length:8},(_,i)=>{const a=(i+.5)/8*Math.PI*2;return [cx+Math.sin(a)*r*.35,cy+Math.cos(a)*r*.35];})];
    const res=await Promise.all(pts.map(([x,y])=>isWater(x,y)));
    const lidos=res.filter(v=>v!==null);if(!lidos.length)return null;
    return lidos.filter(v=>v===false).length/lidos.length;
  }
  async function autoSafe(){
    if(!requireEdit())return;const m=active();if(!m||eventTypeOf(m).category!=='gas')return;
    if(!validCoord(m.center?.x)||!validCoord(m.center?.y)){alert('Defina primeiro o centro da zona.');return;}
    const C=CATALOG()||{},T=duracaoAlvo()*60,R0=effectiveEventRadius(m),fr=C.SAFE_RAIOS||[.7,.48,.28,.12],dn=C.SAFE_DANO||[5,10,20,35],n=fr.length;
    if(!confirm(`Gerar a SAFE automática da zona "${m.name}"?\n\n• ${n} SAFEs: ${Math.round(R0)} m → ${fr.map(v=>Math.round(R0*v)+' m').join(' → ')} → 0\n• Duração até a SAFE final chegar a raio 0: ~${duracaoAlvo()} min\n• Cada SAFE em terra firme, longe de QG, com tempo de fuga a pé ≥ margem PvP${hasDynamicSafe(m)?'\n\nA SAFE dinâmica atual será substituída.':''}`))return;
    setSaveState('Calculando a SAFE (terreno)…');
    const sr=ensureSafeRoute(m,true),qgs=qgList();
    const nota=async(x,y,r)=>{if(qgs.some(g=>Math.hypot(g.x-x,g.y-y)<r*.6))return -1;const lf=await landFraction(x,y,r,12);return lf===null?.5:lf;};
    /* cada SAFE precisa caber dentro da anterior; escolhe o centro com mais terra firme
       e um leve deslocamento (a safe "anda" em vez de só encolher no lugar) */
    let px=Number(m.center.x),py=Number(m.center.y),pr=R0;const st=[];
    for(let i=0;i<n;i++){
      const r=Math.max(30,Math.round(R0*fr[i]/10)*10),maxD=Math.max(0,(pr-r)*.8),cand=[{x:px,y:py}];
      for(let a=0;a<360;a+=30)for(const k of [.45,.9])cand.push({x:px+Math.sin(a*Math.PI/180)*maxD*k,y:py+Math.cos(a*Math.PI/180)*maxD*k});
      for(const c of cand){c.s=await nota(c.x,c.y,r);c.v=c.s+(maxD?Math.hypot(c.x-px,c.y-py)/maxD*.06:0);}
      const best=cand.filter(c=>c.s>=0).sort((a,b)=>b.v-a.v)[0]||cand[0];
      st.push({x:r2(best.x),y:r2(best.y),z:0,radius:r,damage:dn[i]??dn[dn.length-1],closeSeconds:0,moveSeconds:0});px=best.x;py=best.y;pr=r;
    }
    /* tempos: esperas 45% • movimentos 38% • fechamento final 17% da duração alvo.
       Na timeline da SAFE dinâmica o movimento da S1 conta duas vezes (INICIAL→S1 e S1→S2). */
    const q=v=>Math.max(15,Math.round(v/15)*15),holdW=Array.from({length:n-1},(_,i)=>n-1-i),hs=holdW.reduce((a,b)=>a+b,0)||1;
    st.forEach((s,i)=>{if(i<n-1){s.closeSeconds=q(T*.45*holdW[i]/hs);s.moveSeconds=q(T*.38/(n));}else{s.closeSeconds=q(T*.17);s.moveSeconds=0;}});
    sr.stages=st;
    /* garante fuga a pé com margem PvP em todas as transições */
    for(let k=0;k<3;k++){let mudou=false;safeWalkAnalysis(m).forEach((a,i)=>{if(a.pvpExtraNeeded>0){const s=m.safeRoute.stages[i===0?0:i-1];if(s){s.moveSeconds=q(Number(s.moveSeconds)+a.pvpExtraNeeded+7);mudou=true;}}});if(!mudou)break;}
    /* a fuga a pé pode ter alongado os movimentos: devolve o tempo encurtando
       as esperas (mín. 30 s) e o fechamento final (mín. 60 s) até chegar perto do alvo */
    for(let k=0;k<6;k++){
      const tot=safeTotalSeconds(m);if(tot<=T*1.04)break;
      const s2=m.safeRoute.stages,minOf=i=>i<s2.length-1?30:60,folga=s2.reduce((a,s,i)=>a+Math.max(0,Number(s.closeSeconds)-minOf(i)),0);if(folga<=0)break;
      const f2=Math.min(1,(tot-T)/folga);s2.forEach((s,i)=>{s.closeSeconds=Math.max(minOf(i),Math.round((Number(s.closeSeconds)-(Number(s.closeSeconds)-minOf(i))*f2)/15)*15);});
    }
    state.safeEditorStage=0;
    commit(`SAFE automática: ${n} etapas • ${formatDuration(safeTotalSeconds(m))} até raio 0`);
    renderSafeRouteUi();
  }
  /* Altura: compara cada CDS validada com a mediana da zona */
  function heightIssues(m){
    const v=(m?.points||[]).map((p,i)=>({n:i+1,z:Number(p.z),ok:isValidated(p)})).filter(o=>o.ok&&Number.isFinite(o.z));
    if(v.length<3)return [];
    const zs=v.map(o=>o.z).sort((a,b)=>a-b),med=zs[Math.floor(zs.length/2)];
    const dev=zs.map(z=>Math.abs(z-med)).sort((a,b)=>a-b)[Math.floor(zs.length/2)];
    const lim=Math.max(35,dev*4);
    return v.filter(o=>o.z<-2||Math.abs(o.z-med)>lim).map(o=>({...o,med,tipo:o.z<-2||o.z<med?'baixo':'alto'}));
  }
  /* Sugerir locais na área visível do mapa */
  async function suggestLocations(){
    const m=active();if(!m||!state.map)return;
    /* pegada do evento: área disputada/safe ou o spawn mais distante, o que for maior */
    const R=Math.max(effectiveEventRadius(m),coverageStats(m)?.max||0)*1.05,b=state.map.getBounds(),x0=b.getWest(),x1=b.getEast(),y0=b.getSouth(),y1=b.getNorth();
    const others=zonesOfEvent(m.eventId).filter(z=>z.id!==m.id&&validCoord(z.center?.x));
    const sep=eventTypeOf(m).zonasSeparadas;
    if((x1-x0)<R*1.2||(y1-y0)<R*1.2){alert(`Afaste o zoom: a área visível precisa caber pelo menos uma zona de ${Math.round(R)} m.`);return;}
    setSaveState('Procurando locais na área visível…');
    const qgs=qgList(),cand=[],N=7;
    for(let i=0;i<N;i++)for(let j=0;j<N;j++){
      const x=x0+R*.6+(x1-x0-R*1.2)*(i/(N-1)),y=y0+R*.6+(y1-y0-R*1.2)*(j/(N-1));
      const qgDentro=qgs.filter(g=>Math.hypot(g.x-x,g.y-y)<R+raioQg());
      const sobre=others.filter(z=>Math.hypot(Number(z.center.x)-x,Number(z.center.y)-y)<R+effectiveEventRadius(z));
      cand.push({x,y,qg:qgDentro.length,sobre:sobre.length});
    }
    for(const c of cand)c.terra=c.qg?0:(await landFraction(c.x,c.y,R));
    /* o próprio local atual não é sugestão */
    const aqui=validCoord(m.center?.x)?{x:Number(m.center.x),y:Number(m.center.y)}:null;
    const aptos=cand.filter(c=>c.terra!==null&&c.terra>=.75&&!c.qg&&(!sep||!c.sobre)&&(!aqui||Math.hypot(c.x-aqui.x,c.y-aqui.y)>R)).sort((a,b)=>b.terra-a.terra);
    const top=[];aptos.forEach(c=>{if(top.length<3&&top.every(t=>Math.hypot(t.x-c.x,t.y-c.y)>R*1.2))top.push(c);});
    state.locSuggest=top;renderMap();
    setSaveState(top.length?`${top.length} local(is) sugerido(s) no mapa (L1–L${top.length}) — clique para usar`:'Nenhum local apto na área visível');
    if(!top.length)alert('Nenhum local apto na área visível (terra firme ≥ 75%, sem QG e sem sobrepor outras zonas). Mova o mapa para outra região e tente de novo.');
  }
  function drawLocSuggestions(){
    (state.locSuggest||[]).forEach((c,i)=>{
      const m=active();if(!m)return;const R=Math.max(effectiveEventRadius(m),coverageStats(m)?.max||0)*1.05;
      const circ=L.circle(ll(c.x,c.y),{radius:R,color:'#ffd166',weight:2,dashArray:'6 6',fillOpacity:.06,interactive:false}).addTo(state.map);
      const icon=L.divIcon({className:'',html:`<div class="mp-center-pin" style="background:#ffd166;color:#201a00;font-size:10px;font-weight:900">L${i+1}</div>`,iconSize:[32,32],iconAnchor:[16,16]});
      const mk=L.marker(ll(c.x,c.y),{icon}).addTo(state.map).bindPopup(`<b>LOCAL SUGERIDO L${i+1}</b><br>Terra firme: <b>${Math.round(c.terra*100)}%</b><br>Sem QG no raio + ${raioQg()} m${c.sobre?'<br>⚠ encosta em outra zona':''}<br><button type="button" class="mp-use-loc" data-loc="${i}">USAR ESTE LOCAL</button>`);
      mk.on('popupopen',ev=>{ev.popup.getElement()?.querySelector('.mp-use-loc')?.addEventListener('click',()=>useLocation(i));});
      state.drawn.push(circ,mk);
    });
  }
  function useLocation(i){
    const m=active(),c=state.locSuggest?.[i];if(!m||!c)return;
    if(!canMarkRequests()){alert('Seu acesso ao Planejador é somente leitura.');return;}
    if(!state.editing)startEdit();
    const temCentro=validCoord(m.center?.x)&&validCoord(m.center?.y),n=(m.points||[]).length;
    const mover=temCentro&&n&&confirm(`Levar os ${n} spawns junto, mantendo o desenho atual da zona?\n\nOK = move tudo (spawns ficam PENDENTES para validar)\nCancelar = só o centro`);
    const dx=temCentro?c.x-Number(m.center.x):0,dy=temCentro?c.y-Number(m.center.y):0;
    m.center.x=r2(c.x);m.center.y=r2(c.y);m.center.z=0;m.center.h=0;m.center.status='planned';m.center.validatedAt=null;m.center.validationReason='coordinate-change';
    if(mover)m.points.forEach(p=>{p.x=r2(Number(p.x)+dx);p.y=r2(Number(p.y)+dy);p.z=0;p.status='planned';p.validatedAt=null;});
    if(hasDynamicSafe(m))m.safeRoute.stages.forEach(s=>{if(temCentro&&validCoord(s.x)&&validCoord(s.y)){s.x=r2(Number(s.x)+dx);s.y=r2(Number(s.y)+dy);}else{s.x=m.center.x;s.y=m.center.y;}});
    if(dominationZoneMode(m)==='polygon'&&Array.isArray(m.zonePolygon)&&temCentro)m.zonePolygon.forEach(v=>{if(validCoord(v?.x)&&validCoord(v?.y)){v.x=r2(Number(v.x)+dx);v.y=r2(Number(v.y)+dy);v.z=0;v.status='planned';v.validatedAt=null;}});
    state.locSuggest=[];state.map?.closePopup();
    commit(`Zona levada para o local L${i+1}${mover?' com os spawns':''} — valide centro e CDS`);fit();
  }
  /* Centro justo: a partir das CDS dos spawns, o ponto mais equidistante
     de todos (ajuste de círculo por mínimos quadrados + refinamento do
     pior caso). Na Dominação define onde fica a área disputada; no gás,
     onde nasce a safe. A diferença entre o spawn mais perto e o mais
     longe é a medida de justiça. */
  function spreadOf(pts,cx,cy){const d=pts.map(p=>Math.hypot(p.x-cx,p.y-cy));return {min:Math.min(...d),max:Math.max(...d),mean:d.reduce((a,b)=>a+b,0)/d.length};}
  function fairCenterOf(m){
    const pts=(m?.points||[]).filter(p=>validCoord(p.x)&&validCoord(p.y)).map(p=>({x:Number(p.x),y:Number(p.y)}));
    if(pts.length<3)return null;
    /* Kasa: x²+y² = 2ax + 2by + c */
    let Sx=0,Sy=0,Sxx=0,Syy=0,Sxy=0,Sxz=0,Syz=0,Sz=0;const n=pts.length;
    pts.forEach(({x,y})=>{const z=x*x+y*y;Sx+=x;Sy+=y;Sxx+=x*x;Syy+=y*y;Sxy+=x*y;Sxz+=x*z;Syz+=y*z;Sz+=z;});
    const A=[[2*Sxx,2*Sxy,Sx],[2*Sxy,2*Syy,Sy],[2*Sx,2*Sy,n]],B=[Sxz,Syz,Sz];
    const det=M=>M[0][0]*(M[1][1]*M[2][2]-M[1][2]*M[2][1])-M[0][1]*(M[1][0]*M[2][2]-M[1][2]*M[2][0])+M[0][2]*(M[1][0]*M[2][1]-M[1][1]*M[2][0]);
    const D=det(A);let cx,cy;
    if(Math.abs(D)>1e-6){const col=(k)=>A.map((r,i)=>r.map((v,j)=>j===k?B[i]:v));cx=det(col(0))/D;cy=det(col(1))/D;}
    else{cx=Sx/n;cy=Sy/n;}
    /* refinamento: reduz a diferença máx−mín (pior caso) */
    let best={x:cx,y:cy,...spreadOf(pts,cx,cy)},step=Math.max(10,(best.max-best.min)/2);
    for(let it=0;it<60&&step>0.5;it++){let moved=false;
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[.7,.7],[-.7,.7],[.7,-.7],[-.7,-.7]]){const x=best.x+dx*step,y=best.y+dy*step,sp=spreadOf(pts,x,y);if(sp.max-sp.min<best.max-best.min-0.01){best={x,y,...sp};moved=true;}}
      if(!moved)step/=2;}
    const atual=validCoord(m.center?.x)?spreadOf(pts,Number(m.center.x),Number(m.center.y)):null;
    return {...best,atual,deslocamento:atual?Math.hypot(best.x-Number(m.center.x),best.y-Number(m.center.y)):null};
  }
  /* V12.18 — cobrir os spawns: raio mínimo para todos nascerem dentro da safe inicial, mantendo o centro */
  function coverRadius(m){
    const c=m?.center;if(!validCoord(c?.x)||!validCoord(c?.y))return 0;
    const d=(m.points||[]).filter(p=>validCoord(p.x)&&validCoord(p.y)).map(p=>Math.hypot(Number(p.x)-Number(c.x),Number(p.y)-Number(c.y)));
    return d.length?Math.ceil((Math.max(...d)+40)/50)*50:0;
  }
  function coverSpawns(){
    const m=active();if(!m)return;
    if(!canMarkRequests()){alert('Seu acesso ao Planejador é somente leitura.');return;}
    const R=coverRadius(m),atual=Math.round(effectiveEventRadius(m));if(!R||R<=atual){alert('Todos os spawns já cabem na safe inicial.');return;}
    const fc=fairCenterOf(m),alt=fc?Math.ceil(fc.max*1.05/50)*50:null;
    if(!confirm(`Aumentar a safe inicial de ${atual} m para ${R} m, mantendo o centro, para todos os spawns nascerem dentro?${alt&&alt<R-100?`\n\nDica: com CENTRO JUSTO bastaria ~${alt} m (o centro muda e precisa ser validado de novo).`:''}${hasDynamicSafe(m)?'\n\nOs raios da SAFE dinâmica foram calculados para o raio antigo — rode ⚡ AUTO de novo depois.':''}`))return;
    if(!state.editing)startEdit();
    m.eventRadius=R;
    commit(`Safe inicial ${atual} m → ${R} m para cobrir os spawns`);
  }
  function applyFairCenter(){
    const m=active();if(!m)return;
    if(!canMarkRequests()){alert('Seu acesso ao Planejador é somente leitura.');return;}
    const fc=fairCenterOf(m);if(!fc){alert('Cadastre pelo menos 3 spawns para calcular o centro justo.');return;}
    const dom=eventTypeOf(m).category!=='gas',dif=fc.max-fc.min,difA=fc.atual?fc.atual.max-fc.atual.min:null;
    if(fc.deslocamento!==null&&fc.deslocamento<3){alert(`O centro atual já é o mais justo (diferença entre spawns: ${Math.round(difA)} m).`);return;}
    const R=effectiveEventRadius(m),sugR=dom?null:Math.ceil(fc.max*1.05/50)*50;
    if(!confirm(`CENTRO JUSTO pelas CDS dos ${m.points.length} spawns:\n\n${fc.atual?`Hoje: spawn mais perto ${Math.round(fc.atual.min)} m · mais longe ${Math.round(fc.atual.max)} m (diferença ${Math.round(difA)} m)\n`:''}Novo: mais perto ${Math.round(fc.min)} m · mais longe ${Math.round(fc.max)} m (diferença ${Math.round(dif)} m)\n${fc.deslocamento!==null?`Centro se move ${Math.round(fc.deslocamento)} m.\n`:''}${dom?`\nA área de Dominação (${Math.round(R)} m) passa a ficar nesse centro; os spawns não mudam.`:`\nA safe inicial passa para ${sugR} m para cobrir todos os spawns.`}\n\nO centro fica PENDENTE até validar a CDS real no jogo.`))return;
    if(!state.editing)startEdit();
    /* a rota da safe acompanha o centro (mesmo desenho) */
    const ddx=validCoord(m.center?.x)?fc.x-Number(m.center.x):0,ddy=validCoord(m.center?.y)?fc.y-Number(m.center.y):0,sr=m.safeRoute;
    if(sr&&!dom){(sr.stages||[]).forEach(o=>{if(validCoord(o.x)&&validCoord(o.y)){o.x=r2(Number(o.x)+ddx);o.y=r2(Number(o.y)+ddy);}});}
    m.center.x=r2(fc.x);m.center.y=r2(fc.y);m.center.z=0;m.center.h=0;m.center.status='planned';m.center.validatedAt=null;m.center.validationReason='coordinate-change';
    if(!dom){m.eventRadius=Math.max(Math.round(R),sugR);}
    commit(`Centro justo aplicado (diferença ${Math.round(dif)} m) — valide a CDS do centro`);fitZone();
  }

  /* Otimizar: troca só os spawns com problema, mantendo a numeração */
  async function optimizeSpawns(){
    const m=active();if(!m)return;
    if(!canMarkRequests()){alert('Seu acesso ao Planejador é somente leitura.');return;}
    if(!validCoord(m.center?.x)){alert('Defina primeiro o centro da zona.');return;}
    setSaveState('Analisando spawns…');
    const qgs=qgList(),bal=zoneBalance(m),motivo=new Map();
    for(const [i,p] of (m.points||[]).entries()){
      if(!validCoord(p.x)||!validCoord(p.y))continue;
      if(await isWater(p.x,p.y)===true)motivo.set(i,'na água');
      else if(nearQg(p,qgs))motivo.set(i,'perto de QG');
      else if(eventTypeOf(m).gas&&!pointInsideZone(m,p))motivo.set(i,'fora da safe');
    }
    (bal?.near||[]).forEach(o=>{if(!motivo.has(o.n-1))motivo.set(o.n-1,'perto demais do centro');});
    (bal?.far||[]).forEach(o=>{if(!motivo.has(o.n-1))motivo.set(o.n-1,'longe demais do centro');});
    (bal?.tight||[]).forEach(t=>{if(!motivo.has(t.b-1)&&!motivo.has(t.a-1))motivo.set(t.b-1,`colado no ${pad2(t.a)}`);});
    if(!motivo.size){setSaveState('Spawns OK');alert('Nenhum spawn precisa de ajuste: todos em terra, longe de QG e equilibrados.');return;}
    const lista=[...motivo.entries()].sort((a,b)=>a[0]-b[0]);
    if(!confirm(`Reposicionar ${lista.length} spawn(s)?\n\n${lista.map(([i,mo])=>`• ${pad2(i+1)}: ${mo}`).join('\n')}\n\nOs demais não mudam. Os reposicionados mantêm o número e ficam PENDENTES para validar a CDS.`))return;
    if(!state.editing)startEdit();
    const idx=lista.map(([i])=>i),manter=m.points.filter((_,i)=>!motivo.has(i));
    const bad=new Map();const c=m.center,R=effectiveEventRadius(m);
    const tmp={...m,points:manter};
    /* candidatos ruins (água/QG) descartados antes de escolher */
    const cand=suggestSpawns(tmp,idx.length*4);
    for(const q of cand){if(nearQg(q,qgs)||await isWater(q.x,q.y)===true)bad.set(`${Math.round(q.x)},${Math.round(q.y)}`,1);}
    let novos=suggestSpawns(tmp,idx.length,q=>bad.has(`${Math.round(q.x)},${Math.round(q.y)}`)||nearQg(q,qgs));
    if(novos.length<idx.length)novos=[...novos,...suggestSpawns(tmp,idx.length-novos.length,null,novos)];
    idx.forEach((i,k)=>{const q=novos[k];if(!q)return;m.points[i]=normalizePoint({x:q.x,y:q.y,z:0,h:(Math.atan2(Number(c.x)-q.x,Number(c.y)-q.y)*180/Math.PI+360)%360,status:'planned'},i);});
    commit(`${idx.length} spawn(s) reposicionado(s) — confira e valide as CDS`);
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
      out.push({label:cc.outside?`${cc.outside} spawn(s) fora da safe inicial (${Math.round(cc.radius)} m)`:`Spawns dentro da safe (${Math.round(cc.radius)} m)`,ok:cc.outside===0&&cc.total>0,block:true,fix:cc.outside?[{id:'cover',label:`AUMENTAR RAIO P/ ${coverRadius(m)} m`},...((m.points||[]).length>=3?[{id:'fair',label:'CENTRO JUSTO'}]:[])]:null});
      const dyn=hasDynamicSafe(m),sem=dyn?m.safeRoute.stages.filter(s=>!safeStageValid(s)).length:0;
      out.push({label:dyn?(sem?`SAFE dinâmica: ${sem} etapa(s) sem posição`:`SAFE dinâmica (${m.safeRoute.stages.length} etapas • ${formatDuration(safeTotalSeconds(m))} até raio 0)`):'SAFE dinâmica não configurada — use ⚡ AUTO',ok:dyn&&!sem,block:false,warn:dyn&&sem>0});
      if(dyn){const esc2=safeWalkAnalysis(m).filter(a=>a.riskLevel==='unsafe'||a.riskLevel==='critical');if(esc2.length)out.push({label:`Escape a pé ${esc2.map(a=>a.from+'→'+a.to).join(', ')} crítico — aumente o movimento ou reduza o deslocamento`,ok:false,block:false,warn:true});}
    }
    if(type.zonasIguais){
      const sig=safeRulesSig(m),diff=zonesOfEvent(m.eventId).filter(z=>z.id!==m.id&&safeRulesSig(z)&&sig&&safeRulesSig(z)!==sig);
      if(sig)out.push(diff.length
        ?{label:`Fases da safe diferentes de ${diff.map(z=>z.name||'Zona').join(', ')} (tempos/dano precisam ser iguais em todas as zonas)`,ok:false,block:false,warn:true}
        :{label:'Fases da safe (tempos/dano) iguais às demais zonas',ok:true,block:false});
    }
    /* avisos (não bloqueiam): capacidade igual às demais zonas e equilíbrio */
    const fc=fairCenterOf(m);
    if(fc&&fc.atual){const difA=fc.atual.max-fc.atual.min,difB=fc.max-fc.min;
      out.push(difA-difB>Math.max(40,fc.mean*.12)
        ?{label:`Centro pode ser mais justo: diferença entre spawns ${Math.round(difA)} m → ${Math.round(difB)} m movendo ${Math.round(fc.deslocamento)} m (⚖ CENTRO JUSTO)`,ok:false,block:false,warn:true}
        :{label:`Centro equidistante dos spawns (diferença ${Math.round(difA)} m)`,ok:true,block:false});}
    const hz=heightIssues(m);
    /* centro muito acima/abaixo dos spawns: CDS do centro capturada no alto (ex.: voando/em prédio) */
    {const zs=(m.points||[]).filter(isValidated).map(p=>Number(p.z)).filter(Number.isFinite).sort((a,b)=>a-b);const cz=Number(m.center?.z);
     if(zs.length>=3&&centerReadyFor(m)&&Number.isFinite(cz)){const med=zs[Math.floor(zs.length/2)];if(cz<-2||Math.abs(cz-med)>60)out.push({label:`Centro com altura suspeita: z=${cz.toFixed(1)} (spawns em ~${med.toFixed(0)}) — revalide a CDS do centro no chão`,ok:false,block:false,warn:true});}}
    if(hz.length)out.push({label:`Altura suspeita (risco de limbo/nascer no alto): ${hz.slice(0,4).map(o=>`${pad2(o.n)} z=${o.z.toFixed(1)}`).join(', ')} — mediana ${hz[0].med.toFixed(1)}; revalide no jogo`,ok:false,block:false,warn:true});
    if(type.padrao&&hasDynamicSafe(m)){const dur=safeDuration(m);out.push(dur<duracaoAlvo()*60*.9?{label:`Ciclo da safe ~${Math.round(dur/60)} min (alvo ${duracaoAlvo()} min) — use SAFE AUTOMÁTICA ou aumente os tempos`,ok:false,block:false,warn:true}:{label:`Ciclo da safe ~${Math.round(dur/60)} min`,ok:true,block:false});}
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
    /* V12.16: zona oficial sem nenhum spawn cadastrado não pode aparecer como "no /evento" (ex.: Cayo Perico do preset) */
    if(r?.baseline&&!(m.points||[]).length)return 'rascunho';
    if(r?.hash&&r.hash!==geomHash(m))return 'alterada';
    if(r?.status==='applied')return 'nojogo';
    if(r?.status==='sent')return 'enviada';
    return zoneReady(m)?'pronta':'rascunho';
  }
  function stageInfo(st){return CATALOG()?.ETAPAS?.[st]||{label:st.toUpperCase(),tom:'muted'};}
  function wasApplied(m){const r=m?.request;if(r?.baseline&&!r?.appliedAt&&!(m.points||[]).length)return false;return r?.status==='applied'||!!r?.appliedAt||!!r?.baseline||!!r?.appliedBefore;}
  function logRequest(m,action){m.requestLog=[{at:nowIso(),action,by:cloudUser()},...(m.requestLog||[])].slice(0,12);}
  /* Zonas oficiais já existem no jogo: viram a linha de base para detectar alteração. */
  function baselineOfficialZones(){
    /* V12.8: eventos ficam no painel in-game /evento; o antigo padrão /ilegal era só o canal do ticket */
    state.missions.forEach(m=>{if(!m.panelMigrated128){if(!m.panel||m.panel==='/ilegal')m.panel=defaultPanel();m.panelMigrated128=true;}});
    state.missions.forEach(m=>{if(m.official&&!m.request&&!m.draftApplied&&(m.points||[]).length)m.request={status:'applied',hash:geomHash(m),baseline:true,appliedAt:null};});
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
    const poly=dominationZoneMode(m)==='polygon'?dominationPolygon(m):[];
    const radiusTitle=type.gas?'RAIO INICIAL DA SAFE / GÁS':(poly.length>=3?'ÁREA DE DOMINAÇÃO — POLÍGONO POR CDS':'RAIO DA ÁREA DE DOMINAÇÃO');
    const radiusBody=poly.length>=3?`${poly.map((p,i)=>`${pad2(i+1)} - ${f(p.x)}, ${f(p.y)}, ${f(p.z)}${isValidated(p)?'':'  [PENDENTE DE VALIDAÇÃO]'}`).join('\n')}

- Ligar as CDS na ordem informada e fechar do último ponto ao primeiro.

- Estas CDS formam o limite da Zona de Dominação e NÃO são spawns.`:`- ${Math.round(radius)} metros.`;
    const sr=type.gas?ensureSafeRoute(m):null;
    let safe='';
    if(sr&&sr.stages?.length){
      const s=sr.stages,P=type.padrao;
      safe=`

MOVIMENTAÇÃO DA SAFE (${s.length} etapas):

${s.map((st,i)=>`- SAFE ${i+1}: ${safeStageValid(st)?f(st.x)+','+f(st.y):'SEM POSIÇÃO'} • raio ${Math.round(Number(st.radius)||0)} m • dano fora da SAFE: ${Number(st.damage)||0} HP por segundo • ${i<s.length-1?`espera ${Number(st.closeSeconds)||0}s • movimento para a próxima SAFE ${Number(st.moveSeconds)||0}s`:`fechamento final até raio 0 em ${Number(st.closeSeconds)||0}s`}.`).join('\n')}

- Utilizar todas as etapas configuradas, na ordem, até a SAFE final. Cada SAFE tem posição fixa definida pelo Planejador; não sortear posições alternativas.

- Durante cada deslocamento, centro e raio devem mudar continuamente e ao mesmo tempo, sem teleporte da zona. Exibir HUD "ATENÇÃO — A SAFE ZONE ESTÁ SE MOVENDO" durante a transição.

- A SAFE deve existir verticalmente do fundo (${sr.height?.bottom??-1000}) ao teto (${sr.height?.top??2000}) para permanecer visível em aclives e declives.

DANO FORA DA SAFE:

- Dano contínuo por segundo enquanto o player estiver fora do círculo ativo, acompanhando a etapa atual.

- Aviso visível ao player: "VOCÊ ESTÁ FORA DA SAFE — TOMANDO X DE DANO POR SEGUNDO" (X = dano da SAFE ativa, atualizado a cada etapa). Ao voltar para dentro, interromper o dano e remover o aviso.

- Tempo da timeline até a SAFE final chegar a raio 0: ${safeTotalSeconds(m)} segundos (${formatDuration(safeTotalSeconds(m))}).${P?' Depois disso o gás segue causando dano contínuo até restar uma equipe.':''}`;
    }
    return `${centerTitle}:

- ${rawCds(m.center)}

${radiusTitle}:

${radiusBody}

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
  /* encerramento: em gás com SAFE dinâmica a duração do evento vem da timeline */
  function closingText(m){
    if(!(eventTypeOf(m).gas&&hasDynamicSafe(m)))return '- As demais configurações, regras, premiações, duração e funcionamento do evento deverão permanecer inalterados.';
    const s=safeTotalSeconds(m),P=eventTypeOf(m).padrao;
    return `- DURAÇÃO: a SAFE final atinge raio 0 em ${s} segundos (${formatDuration(s)}); a duração deve ser recalculada sempre que a timeline da SAFE for alterada.

- ${P?'Após o raio 0 o gás continua causando dano até restar uma equipe; o evento termina quando restar apenas uma equipe viva.':'O evento termina exatamente quando a SAFE final atingir raio 0.'}

- As demais configurações, regras, premiações e funcionamento do evento deverão permanecer inalterados.`;
  }

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

  function generateRequest(opts={}){
    const m=active();if(!m)return false;
    /* silencioso: usado pelo exportar HIGH — guarda o motivo em vez de abrir alerta */
    const alert=opts.silent?(msg=>{state.lastRequestError=msg;}):window.alert.bind(window);state.lastRequestError='';
    const type=eventTypeOf(m),all=m.points||[],pts=all.filter(isValidated),pending=all.length-pts.length;
    if(type.gas&&!requireSafePreflight(m,'gerar a solicitação'))return false;
    if(dominationZoneMode(m)==='polygon'){const g=dominationZoneGeometry(m);if(g.mode!=='polygon'){alert('O polígono da Zona de Dominação está incompleto ou inválido. Conclua o contorno (mínimo 3 vértices) antes de gerar a solicitação.');return false;}}
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

${closingText(m)}`;
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

${closingText(first)}`;
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

  /* V12.16: problemas primeiro; o que está OK fica recolhido */
  function checksHtml(checks){
    const li=c=>`<li class="${c.ok?'ok':(c.block?'bad':(c.warn?'warn':'opt'))}"><i>${c.ok?'✓':(c.block?'✕':(c.warn?'!':'○'))}</i><span>${esc(c.label)}${!c.ok&&c.fix?`<span class="mpk-fixes">${c.fix.map(x=>`<button type="button" class="mpk-fix" data-fix="${x.id}">${esc(x.label)}</button>`).join('')}</span>`:''}</span></li>`;
    const bad=checks.filter(c=>!c.ok&&c.block),warn=checks.filter(c=>!c.ok&&!c.block&&c.warn),opt=checks.filter(c=>!c.ok&&!c.block&&!c.warn),ok=checks.filter(c=>c.ok);
    return `<div class="mpk-checkwrap">${bad.length?`<div class="mpk-ckgroup bad"><b>PENDÊNCIAS QUE BLOQUEIAM (${bad.length})</b><ul class="mpk-checks">${bad.map(li).join('')}</ul></div>`:''}${warn.length?`<div class="mpk-ckgroup warn"><b>AVISOS (${warn.length})</b><ul class="mpk-checks">${warn.map(li).join('')}</ul></div>`:''}${opt.length?`<ul class="mpk-checks">${opt.map(li).join('')}</ul>`:''}${ok.length?`<details class="mpk-ckok"><summary>✓ ${ok.length} verificaç${ok.length===1?'ão':'ões'} OK</summary><ul class="mpk-checks">${ok.map(li).join('')}</ul></details>`:''}</div>`;
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
      ${checksHtml(checks)}
      <div class="mp-actions">${actions.join('')}</div>${logHtml}`;
    qsa('[data-fix]',box).forEach(b=>b.onclick=()=>{if(b.dataset.fix==='cover')coverSpawns();else if(b.dataset.fix==='fair')applyFairCenter();});
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
    state.activeId=z.id;state.activeEventId=eventId;state.libraryCategory=z.category||'dominacao';return true;
  }
  function syncConflicts(){if(!(state.editing&&state.dirty))return [];return state.missions.filter(m=>m.id===state.activeId&&m?._syncConflict?.remote);}
  function resolveSyncConflict(id,choice){
    const idx=state.missions.findIndex(m=>m.id===id);if(idx<0)return;
    const local=state.missions[idx],remote=local?._syncConflict?.remote;if(!remote)return;
    const remoteRev=local._syncConflict?.remoteRev;
    if(choice==='firebase'){
      // V12.7 - adota a versão da nuvem como está (sem gerar nova versão)
      const chosen=JSON.parse(JSON.stringify(remote));delete chosen._syncConflict;if(remoteRev!==undefined){chosen._rev=remoteRev;state.syncedHash[String(chosen.id)]=zoneHash(chosen);saveSyncMeta();}state.missions[idx]=chosen;
    }else{
      // V12.7 - manter local: o próximo SALVAR sobrescreve a versão da nuvem conhecida
      delete local._syncConflict;local.updatedAt=nowIso();if(remoteRev!==undefined)local._rev=remoteRev;
    }
    saveStore();render();setSaveState(choice==='firebase'?'Conflito resolvido • versão Firebase escolhida':'Conflito resolvido • versão local mantida');
  }

  function renderCentralV954(){
    const host=ensureCentralV954();if(!host)return;
    if(!state._diarioReq&&window.HighOSMissionCloud?.diarioEventos){state._diarioReq=true;diarioEventos().then(l=>{if(l&&l.length)renderCentralV954();});}
    const filter=centralCategory(),query=String(state.centralSearch||'').trim().toLowerCase(),allEvents=[],conflicts=syncConflicts();
    ['dominacao','gas'].forEach(cat=>eventsOfCategory(cat).forEach(e=>allEvents.push({...e,category:cat})));
    const stages=state.missions.map(zoneStage);
    const cnt=k=>stages.filter(s=>s===k).length;
    const evStages=e=>zonesOfEvent(e.id).map(zoneStage);
    const pendFilter=e=>evStages(e).some(s=>s==='pronta'||s==='alterada'||s==='enviada');
    let events=filter==='all'?allEvents:filter==='pend'?allEvents.filter(pendFilter):allEvents.filter(e=>e.category===filter);
    if(query)events=events.filter(e=>String(e.name||'').toLowerCase().includes(query)||zonesOfEvent(e.id).some(z=>String(z.name||'').toLowerCase().includes(query)));
    const since=CATALOG()?.tempoDesde||(()=>'');
    const kpi=(n,l,tom,sub)=>`<div class="mpk-kpi ${tom||''}"><b>${n}</b><span>${l}</span>${sub?`<small>${sub}</small>`:''}</div>`;
    const staleN=state.missions.filter(isStale).length;
    host.innerHTML=`${conflicts.length?`<div class="mp-readout" style="margin-bottom:12px;border-color:#f59e0b"><b>⚠ CONFLITO DE SINCRONIZAÇÃO • ${conflicts.length}</b><br><span style="opacity:.8">A mesma zona foi alterada em dois computadores sem uma versão claramente mais recente. Escolha qual deve prevalecer.</span>${conflicts.map(z=>`<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px"><strong style="flex:1;min-width:180px">${esc(z.event||'Evento')} • ${esc(z.name||'Zona')}</strong><button type="button" data-conflict-local="${esc(z.id)}">MANTER LOCAL</button><button type="button" class="mpc-primary" data-conflict-cloud="${esc(z.id)}">USAR FIREBASE</button></div>`).join('')}</div>`:''}<div class="mpc-head"><div><span>EVENTOS · PAINEL ${esc(defaultPanel().toUpperCase())}</span><strong>${allEvents.length} eventos <i>•</i> ${state.missions.length} zonas${faccoesAtivas()?` <i>•</i> ${faccoesAtivas().length} facções ativas`:''}</strong></div><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px"><span id="mpCloudStateCentral" class="mp-cloud-state ${state.cloudState||'local'}">${state.cloudState==='ok'?'☁ SINCRONIZADO':state.cloudState==='sync'?'↻ SINCRONIZANDO...':'⚠ LOCAL'}</span><small id="mpCloudMeta" style="opacity:.7;text-align:right">${state.cloudMeta?.updatedAtText?'Última: '+new Date(state.cloudMeta.updatedAtText).toLocaleString('pt-BR')+(state.cloudMeta.updatedBy?' • '+esc(state.cloudMeta.updatedBy):''):'Ainda sem sincronização confirmada nesta sessão'}</small></div><button type="button" id="mpForceCloudSync" class="mpc-primary" style="white-space:nowrap">↻ SINCRONIZAR</button></div></div>
      <div class="mpk-kpis">${kpi(cnt('nojogo'),'no /evento','ok')}${kpi(cnt('enviada'),'aguardando cidade',staleN?'bad':'warn',staleN?`${staleN} há +${retornoHoras()} h`:'')}${kpi(cnt('pronta'),'prontas p/ enviar','brand')}${kpi(cnt('alterada'),'alteradas após envio',cnt('alterada')?'bad':'')}${kpi(cnt('rascunho'),'em rascunho','')}</div>
      <div class="mpc-toolbar"><div class="mpc-filters"><button data-cfilter="all" class="${filter==='all'?'active':''}">TODOS</button><button data-cfilter="pend" class="${filter==='pend'?'active':''}">SOLICITAÇÕES EM ABERTO</button><button data-cfilter="dominacao" class="${filter==='dominacao'?'active':''}">DOMINAÇÃO</button><button data-cfilter="gas" class="${filter==='gas'?'active':''}">ZONA DE GÁS</button></div><div style="display:flex;gap:8px;align-items:center"><input id="mpCentralSearch" value="${esc(state.centralSearch||'')}" placeholder="Buscar evento ou zona…" style="max-width:240px"><button id="mpCentralNewEvent" class="mpc-primary">+ NOVO EVENTO</button></div></div>
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
        return `<article class="mpc-event"><header><div><span>${esc(type.label)}</span><h3>${esc(e.name)}</h3><small>${zones.length} zona${zones.length===1?'':'s'} • ${live.length} no jogo${toSend?` • ${toSend} para enviar`:''}${(()=>{const c=eventCapacities(e.id).map(o=>o.cap);if(!c.length)return '';const a=Math.min(...c),b=Math.max(...c);return ` • ${a===b?`até ${a}`:`${a}–${b}`} facções`;})()}</small></div><div class="mpc-event-actions"><button data-package="${esc(e.id)}" class="${toSend?'hot':''}">SOLICITAÇÃO${toSend?` (${toSend})`:''}</button><button data-partidas="${esc(e.id)}" title="Registrar resultado e ver análise">PARTIDAS${partidasEvento(e.id).length?` (${partidasEvento(e.id).length})`:''}${(()=>{const n=state._diario?diarioDoEvento(e.id,state._diario.list).length:0;return n?` <i class="mpk-new">+${n} no diário</i>`:'';})()}</button><button data-meta="${esc(e.id)}" title="Quantas facções o evento precisa comportar">META${eventTarget(e.id)?` ${eventTarget(e.id).n}`:''}</button>${type.padrao?`<button data-padrao="${esc(e.id)}">PADRÃO GÁS</button>`:''}<button data-newzone="${esc(e.id)}">+ NOVA ZONA</button><button class="danger mpk-icon" data-delevent="${esc(e.id)}" title="Excluir evento" aria-label="Excluir evento">🗑</button></div></header>${preview}${sugest}${warns.length?`<div class="mpk-warns">${warns.map(w=>`<span>⚠ ${esc(w)}</span>`).join('')}</div>`:''}<div class="mpc-zones">${zones.map(z=>{const st=zoneStage(z),info=stageInfo(st),total=z.points?.length||0,val=(z.points||[]).filter(isValidated).length,extra=st==='enviada'?` • ${isStale(z)?'⚠ sem retorno ':''}${since(z.request?.sentAt)}`:'';const pct=total?Math.round(val/total*100):0;return `<button class="mpc-zone" data-openzone="${esc(z.id)}"><span><b>${esc(z.name||'Zona sem nome')}</b><small>${total?`${val}/${total} validados`:'Sem pontos'}${extra}${partidasDe(z).length?` • ${partidasDe(z).length} partida${partidasDe(z).length===1?'':'s'}`:''}</small><i class="mpk-bar"><u style="width:${pct}%"></u></i></span><em class="mpk-badge ${isStale(z)?'bad':info.tom}">${info.label}</em></button>`}).join('')||'<div class="mpc-empty">Nenhuma zona cadastrada.</div>'}</div></article>`;
      }).join(''):'<div class="mpc-empty big">Nenhum evento neste filtro.</div>'}</div>`;
    qsa('[data-conflict-local]',host).forEach(btn=>btn.onclick=()=>resolveSyncConflict(btn.dataset.conflictLocal,'local'));
    qsa('[data-conflict-cloud]',host).forEach(btn=>btn.onclick=()=>resolveSyncConflict(btn.dataset.conflictCloud,'firebase'));
    const search=qs('#mpCentralSearch',host);if(search){search.oninput=()=>{state.centralSearch=search.value;clearTimeout(state.centralSearchTimer);state.centralSearchTimer=setTimeout(renderCentralV954,180);};setTimeout(()=>{if(document.activeElement?.id==='mpCentralSearch'){const el=qs('#mpCentralSearch');el?.focus();el?.setSelectionRange(el.value.length,el.value.length);}},0);}
    qs('#mpForceCloudSync',host)?.addEventListener('click',forcePlannerCloudSync);
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
    Object.entries(map).forEach(([id,path])=>{const el=qs('#'+id);if(!el)return;let inputStart=null;const eventName=['mpMode','mpEventCategory','mpRequestKind'].includes(id)?'change':'input';el.addEventListener('focus',()=>{inputStart=state.editing?editSnapshot():null;});el.addEventListener(eventName,e=>{const m=active();if(!m||!state.editing)return;let v=e.target.value;const oldCategory=m.category;if(['mpCenterX','mpCenterY','mpCenterZ','mpCenterH','mpCircleRadius','mpStartAngle','mpRadius'].includes(id))v=num(v);if(path.length===2){if((id==='mpCenterX'||id==='mpCenterY')&&Number(m.center[path[1]])!==Number(v)){m.center.z=0;m.center.h=0;m.center.status='planned';m.center.validatedAt=null;m.center.validationReason='coordinate-change';}m[path[0]][path[1]]=v;}else m[path[0]]=v;if(id==='mpEventType'){zonesOfEvent(m.eventId).forEach(z=>z.event=v);}if(id==='mpPanel'){zonesOfEvent(m.eventId).forEach(z=>z.panel=v);}if(id==='mpEventCategory'){zonesOfEvent(m.eventId).forEach(z=>z.category=v);}if(id==='mpEventCategory'&&oldCategory!==v){state.libraryCategory=v;if(v==='gas'){m.center.label='Centro do Gás / Marco Zero';}else{m.center.label='Centro da Zona do Evento';}/* trocar categoria não muda a CDS; mantém validação existente */}if(id==='mpMode'&&v==='assistant'){m.points.forEach(p=>{if(!p.validatedAt&&p.status!=='validated')p.status='planned';});}state.dirty=true;setSaveState('Alteração • NÃO SALVO');renderMap();renderCenterValidation();renderCoverage();if(id==='mpRadius'&&qs('#mpRadiusValue'))qs('#mpRadiusValue').textContent=`${v||100} m`; });if(eventName==='input')el.addEventListener('change',()=>{if(!state.editing)return;if(inputStart&&inputStart!==editSnapshot()){const current=editSnapshot();state.lastEditSnapshot=inputStart;pushUndo();state.lastEditSnapshot=current;state.dirty=true;updateEditUi();}inputStart=null;});else el.addEventListener('change',()=>{if(!state.editing)return;const current=editSnapshot();if(inputStart&&inputStart!==current){state.lastEditSnapshot=inputStart;pushUndo();state.lastEditSnapshot=current;state.dirty=true;updateEditUi();}inputStart=null;});});
  }

  function setWorkspace(open){
    state.workspaceOpen=!!open;
    const page=qs('#page-planejador');if(page)page.classList.toggle('mp-library-mode',!state.workspaceOpen);
    const bar=qs('#mpWorkspaceBar');if(bar)bar.hidden=!state.workspaceOpen;
    syncStickyOffset();
    if(state.workspaceOpen)setTimeout(()=>{try{state.map?.invalidateSize();focusActiveMission(false)}catch(e){}},100);
  }
  /* V12.16: a barra da zona grudava em top:0 e ficava por cima do topo do site */
  function syncStickyOffset(){
    const top=qs('.topbar'),page=qs('#page-planejador');if(!page)return;
    const sticky=top&&getComputedStyle(top).position==='sticky';
    page.style.setProperty('--mp-sticky-top',`${sticky?top.offsetHeight+8:8}px`);
    if(!state.stickyWatch){state.stickyWatch=true;window.addEventListener('resize',()=>syncStickyOffset(),{passive:true});}
  }
  function ensureWorkspaceBar(){
    const shell=qs('.mission-planner-shell');if(!shell||qs('#mpWorkspaceBar'))return;
    const bar=document.createElement('div');bar.id='mpWorkspaceBar';bar.className='mp-workspace-bar';
    bar.innerHTML=`<button type="button" id="mpBackLibrary" class="mp-icon-action" title="Voltar às missões — retorna para a biblioteca de mapas" aria-label="Voltar às missões">←</button><div class="mp-workspace-path"><b id="mpWorkspaceEvent">Evento</b><span>›</span><strong id="mpWorkspaceZone">Zona</strong></div><div class="mp-editor-actions"><button type="button" id="mpNewZone" class="mp-icon-action" title="Nova zona — cria outra zona dentro deste evento" aria-label="Nova zona">＋</button><button type="button" id="mpReplicateZone" class="mp-icon-action" title="Replicar — reaproveita a configuração desta zona em uma nova zona" aria-label="Replicar zona">⧉</button><button type="button" id="mpCloneZone" class="mp-icon-action" title="Clonar — cria uma cópia independente desta zona" aria-label="Clonar zona">⎘</button><button type="button" id="mpDeleteMission" class="mp-delete-action mp-icon-action" title="Excluir zona — remove esta zona do evento" aria-label="Excluir zona">⌫</button><button type="button" id="mpUndoEdit" class="mp-icon-action" title="Desfazer — volta a última alteração da edição" aria-label="Desfazer" style="display:none">↶</button><button type="button" id="mpRedoEdit" class="mp-icon-action" title="Refazer — reaplica a alteração desfeita" aria-label="Refazer" style="display:none">↷</button><button type="button" id="mpEditMission" class="mp-icon-action" title="Editar — habilita alterações nesta zona" aria-label="Editar zona">✎</button><button type="button" id="mpSaveMission" class="primary mp-icon-action" title="Salvar — grava as alterações desta zona" aria-label="Salvar alterações" style="display:none">✓</button><button type="button" id="mpCancelEdit" class="mp-icon-action" title="Cancelar — descarta a edição atual" aria-label="Cancelar edição" style="display:none">×</button></div><span id="mpCloudState" class="mp-cloud-state local">⚠ MODO LOCAL</span>`;
    shell.insertAdjacentElement('beforebegin',bar);
    qs('#mpBackLibrary')?.addEventListener('click',()=>{if(state.editing&&state.dirty&&!confirm('Existem alterações não salvas. Deseja voltar às missões?'))return;if(state.editing)cancelEdit();setWorkspace(false);renderCentralV954();});
  }
  function renderWorkspaceBar(){
    const m=active();const ev=qs('#mpWorkspaceEvent'),zn=qs('#mpWorkspaceZone');if(ev)ev.textContent=m?.event||'Evento';if(zn)zn.textContent=m?.name||'Zona';
  }

  function bind(){
    if(state.initialized)return;state.initialized=true;loadStore();recoverEditDraft();window.addEventListener('beforeunload',e=>{if(state.editing&&state.dirty){saveEditDraft();e.preventDefault();e.returnValue='';}});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.safePresentation){e.preventDefault();stopSafePreview();exitSafePresentation();return;}if(!state.editing)return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redoEdit():undoEdit();}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();redoEdit();}});state.activeEventId=active()?.eventId||state.activeEventId;ensureCentralV954();ensureWorkspaceBar();ensureBackupCard();ensurePlannerTabs();ensureSafeRouteUi();adoptStrayCards();ensureMapKpis();ensureEventKindUi();ensureRequestStatusUi();initMap();render();renderWorkspaceBar();setWorkspace(false);bindFormAutosave();updateEditUi();
    qs('#mpEditMission')?.addEventListener('click',startEdit);qs('#mpUndoEdit')?.addEventListener('click',undoEdit);qs('#mpRedoEdit')?.addEventListener('click',redoEdit);qs('#mpSaveMission')?.addEventListener('click',saveMission);qs('#mpCancelEdit')?.addEventListener('click',cancelEdit);qs('#mpNewZone')?.addEventListener('click',createZone);qs('#mpCloneZone')?.addEventListener('click',cloneZone);qs('#mpReplicateZone')?.addEventListener('click',openReplicator);qs('#mpDeleteMission')?.addEventListener('click',deleteZone);
    qs('#mpPlaceBtn')?.addEventListener('click',()=>{if(!requireEdit())return;const enable=state.mapMode!=='spawn';resetMapPlacementModes();state.placing=enable;state.mapMode=enable?'spawn':'center';qs('#missionPlannerMap')?.classList.toggle('mp-crosshair',state.placing);if(state.map?.getContainer())state.map.getContainer().style.cursor=state.placing?'crosshair':'';qs('#mpPlaceBtn').textContent=state.placing?'PARAR DE MARCAR':'MARCAR PONTO NO MAPA';});
    qs('#mpFit')?.addEventListener('click',fit);qs('#mpGoLS')?.addEventListener('click',()=>state.map?.setView(ll(900,-600),3));qs('#mpGoCayo')?.addEventListener('click',()=>{if(state.map&&state.cayoBounds)state.map.fitBounds(state.cayoBounds,{padding:[20,20]});});qs('#mpGenerateCircle')?.addEventListener('click',generateCircle);qs('#mpImport')?.addEventListener('click',importBulk);qs('#mpValidateBtn')?.addEventListener('click',()=>validateSelected());
    qs('#mpValidateBulkBtn')?.addEventListener('click',validateBulk);
    qs('#mpInvalidateBtn')?.addEventListener('click',invalidateSelected);
    qs('#mpCopyPointTp')?.addEventListener('click',copySelectedTp);
    qs('#mpJumpPending')?.addEventListener('click',()=>{const m=active();const id=nextPendingId(m,m?.selectedId||0);if(!id){setValidationFeedback('<b>Nenhum ponto pendente nesta zona.</b>','ok');return;}selectPoint(id);const p=m.points[id-1];if(p)state.map?.setView(ll(p.x,p.y),5);qs('#mpValidateCds')?.focus();});
    qs('#mpValidateCds')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();validateSelected();}});qs('#mpAddCoord')?.addEventListener('click',addManual);qs('#mpClear')?.addEventListener('click',clearPoints);qs('#mpExportBtn')?.addEventListener('click',exportValidated);qs('#mpExportXYBtn')?.addEventListener('click',exportXY);qs('#mpGenerateRequest')?.addEventListener('click',generateRequest);qs('#mpCopyRequest')?.addEventListener('click',copyCurrentRequest);qs('#mpCaptureBtn')?.addEventListener('click',()=>captureSnapshot(true));
    setTimeout(()=>{state.map?.invalidateSize();fit();queueSnapshot();},180);
    setTimeout(()=>syncMissionsFromCloud(),1200);clearInterval(state.autosaveTimer);state.autosaveTimer=setInterval(saveEditDraft,5000);
  }
  /* ---------------------------------------------------------------
     V9.4.1 - A lateral tinha 11 cards empilhados e exigia rolagem
     constante. Aqui os MESMOS cards sao reorganizados em 4 abas, sem
     recriar elemento nenhum (os listeners continuam valendo).
  --------------------------------------------------------------- */
  /* V12.8 - navegação por etapas: cada etapa mostra só os cards dela.
     A etapa Safe só aparece em missões de gás. */
  const PLANNER_TABS=[
    {id:'zona',label:'Zona',hint:'Centro e área'},
    {id:'pontos',label:'Spawns',hint:'Gerar e ajustar'},
    {id:'validacao',label:'Validação',hint:'NC + TPCDS no jogo'},
    {id:'safe',label:'Safe',hint:'Fases e simulação',gasOnly:true},
    {id:'entrega',label:'Solicitação',hint:'Checar e enviar'}
  ];
  const CARD_STEP_BY_ID={mpSafeRouteBox:'safe',mpProTools:'entrega',mpBackupCard:'entrega',mpDomPolygonBox:'zona'};
  function isGasActive(){return (active()?.category||'dominacao')==='gas';}
  function visibleSteps(){const gas=isGasActive();return PLANNER_TABS.filter(t=>!t.gasOnly||gas);}
  function currentStep(){return qs('.mp-tab.active')?.dataset.tab||'zona';}
  function updateStepUi(){
    const vis=visibleSteps(),ids=vis.map(t=>t.id);
    qsa('.mp-tab').forEach(b=>{const i=ids.indexOf(b.dataset.tab);b.hidden=i<0;const n=b.querySelector('.mp-step-num');if(n&&i>=0)n.textContent=String(i+1);});
    let cur=currentStep();if(!ids.includes(cur)){setPlannerTab('zona');cur='zona';}
    const i=ids.indexOf(cur),prev=qs('#mpStepPrev'),next=qs('#mpStepNext');
    if(prev){prev.disabled=i<=0;}
    if(next){next.disabled=i>=ids.length-1;next.textContent=i>=ids.length-1?'Última etapa':'Próxima etapa: '+vis[i+1].label;}
  }
  function goStep(delta){const ids=visibleSteps().map(t=>t.id),i=ids.indexOf(currentStep()),n=ids[i+delta];if(n){setPlannerTab(n);const side=qs('.mission-planner-side');if(side)side.scrollTop=0;const bar=qs('#mpTabBar');if(bar&&bar.getBoundingClientRect().top<90){bar.scrollIntoView({block:'start'});window.scrollBy(0,-90);}}}
  function cardTabKey(card){
    if(card.id&&CARD_STEP_BY_ID[card.id])return CARD_STEP_BY_ID[card.id];
    const t=(card.querySelector('h3')?.textContent||'').toUpperCase();
    if(t.includes('FERRAMENTAS')||t.includes('SEGURANÇA DAS'))return 'entrega';
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
      const alvo=(el.id&&CARD_STEP_BY_ID[el.id])||el.dataset.forceTab||cardTabKey(el);
      plannerPanel(alvo)?.appendChild(el);
    });
    const safe=qs('#mpSafeRouteBox');if(safe&&!safe.closest('.mp-tabpanel[data-tab="safe"]'))plannerPanel('safe')?.appendChild(safe);
    const pro=qs('#mpProTools');if(pro&&!pro.closest('.mp-tabpanel[data-tab="entrega"]'))plannerPanel('entrega')?.appendChild(pro);
  }
  function setPlannerTab(id){
    qsa('.mp-tab').forEach(b=>{const on=b.dataset.tab===id;b.classList.toggle('active',on);b.setAttribute('aria-selected',on?'true':'false');});
    qsa('.mp-tabpanel').forEach(p=>p.classList.toggle('active',p.dataset.tab===id));
    const m=active(),gas=(m?.category||'dominacao')==='gas';
    qsa('.mp-tab').forEach(b=>{if(b.dataset.tab==='zona')b.title=gas?'Definir zona inicial e rota progressiva das SAFEs':'Definir geometria e limites da zona';});
    try{localStorage.setItem('highos_mp_tab',id);}catch(e){}
    updateStepUi();
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
      b.innerHTML=`<b class="mp-step-num"></b><span class="mp-step-txt"><span>${t.label}</span><small>${t.hint}</small></span><i class="mp-tab-badge" data-badge="${t.id}"></i>`;
      b.addEventListener('click',()=>setPlannerTab(t.id));
      bar.appendChild(b);
      const panel=document.createElement('div');panel.className='mp-tabpanel';panel.dataset.tab=t.id;
      panels[t.id]=panel;
    });
    // V12.8 - a barra de etapas fica acima do editor, na largura toda
    const wb=qs('#mpWorkspaceBar'),shell=qs('.mission-planner-shell');
    if(wb)wb.insertAdjacentElement('afterend',bar);else if(shell)shell.insertAdjacentElement('beforebegin',bar);else side.insertBefore(bar,side.firstChild);
    PLANNER_TABS.forEach(t=>side.appendChild(panels[t.id]));
    cards.forEach(card=>panels[cardTabKey(card)].appendChild(card));
    const foot=document.createElement('div');foot.id='mpStepFooter';foot.className='mp-step-footer';
    foot.innerHTML='<button type="button" id="mpStepPrev">Voltar</button><button type="button" id="mpStepNext" class="mp-step-next">Próxima etapa</button>';
    side.appendChild(foot);
    qs('#mpStepPrev')?.addEventListener('click',()=>goStep(-1));
    qs('#mpStepNext')?.addEventListener('click',()=>goStep(1));
    let salva='zona';try{salva=localStorage.getItem('highos_mp_tab')||'zona';}catch(e){}
    setPlannerTab(PLANNER_TABS.some(t=>t.id===salva)?salva:'zona');
  }
  function renderPlannerBadges(){
    const m=active();if(!m)return;
    const pend=(m.points||[]).filter(p=>!isValidated(p)).length;
    const total=(m.points||[]).length;
    updateStepUi();
    const set=(id,txt,warn)=>{const el=qs(`[data-badge="${id}"]`);if(!el)return;el.textContent=txt||'';el.classList.toggle('warn',!!warn);el.classList.toggle('hidden',!txt);};
    set('pontos',total?String(total):'',false);
    set('validacao',pend?String(pend):'✓',!!pend);
    set('zona','',false);
    set('safe','',false);
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
  /* V15.6.3: o planejador pode ser carregado sob demanda (depois do DOMContentLoaded). */
  const iniciar=()=>{if(qs('#missionPlannerMap'))bind();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);else iniciar();
})();
