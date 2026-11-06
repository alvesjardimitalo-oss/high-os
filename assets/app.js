import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';

import { getAuth,
 GoogleAuthProvider,
 signInWithPopup,
 signOut,
 onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';

import { getFirestore,
 doc,
 getDoc,
 collection,
 getDocs,
 setDoc as _setDoc,
 addDoc as _addDoc,
 serverTimestamp,
 writeBatch as _writeBatch,
 runTransaction,
 deleteDoc as _deleteDoc,
 onSnapshot,
 query,
 where,
 orderBy,
 limit,
 startAfter,
 arrayUnion } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { situacaoGroup, ocupado as ocupadoV14, inconsistencias } from './modules/ocupacao.js';
import { syncBlipsCoordinates, valuesFor as blipsValuesFor } from './modules/blips-sheet-sync.js?v=1.2.0';
import { montarLinhaDoTempo, atribuirLinhas, coletaDoDia, rotuloColeta, msDe, chaveGroup, descartarColetasVazias } from './modules/metricas-motor.js?v=14.8.2';
import { painelOcupacaoHtml, painelDisponiveisHtml, ligarPaineis, abrirRevisao } from './modules/painel-ocupacao.js?v=14.7.0';
import * as fila from './modules/fila-bot.js?v=13.1.0';
import * as qgsUi from './modules/qgs-ui.js?v=13.2.0';
import * as catCraft from './modules/catalogo-craft.js?v=13.1.0';
import * as catUi from './modules/catalogo-ui.js?v=13.2.0';
import * as itensUi from './modules/itens-conhecidos.js?v=13.0.0';
import * as metasUi from './modules/metas-ui.js?v=13.1.0';
import * as avisos from './modules/avisos-discord.js?v=13.0.0';
import { season, lerIndice, carregarSeason, seasonEscolhida, guardarEscolha, esquecerEscolha, filtrarPorSeason, qgsSemVinculo, foraDaPlanilha, resumoSeason, salvarQg, vincularGroup, desvincularGroup, chaveFaccao } from './modules/season.js?v=17.10.0';

const firebaseConfig={apiKey:'AIzaSyBKtl3rCA9Id1RDMwGch-yi4hxAs83DraU',
authDomain:'high-os.firebaseapp.com',
projectId:'high-os',
storageBucket:'high-os.firebasestorage.app',
messagingSenderId:'471862600170',
appId:'1:471862600170:web:ff55af6f7e808ff393d293'};

const app=initializeApp(firebaseConfig), auth=getAuth(app), db=getFirestore(app), provider=new GoogleAuthProvider();

provider.setCustomParameters({prompt:'select_account'});

const sheetsProvider=new GoogleAuthProvider();

sheetsProvider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');

const facSheetProvider=new GoogleAuthProvider();

facSheetProvider.addScope('https://www.googleapis.com/auth/spreadsheets');

const $=s=>document.querySelector(s), loginView=$('#loginView'),deniedView=$('#deniedView'),appView=$('#appView'),sessionArea=$('#sessionArea');

let currentUser=null,currentProfile=null,faccoes=[],faccoesTodas=[],solicitacoes=[],requestRecords=[],usuarios=[],organizacoes=[];
// Endereço vem de assets/api-config.js (uma linha para trocar de servidor).
const HIGH_OS_DISCORD_API=String(window.HIGH_OS_API_URL||'https://desktop-a2oor0c.taile5cb57.ts.net').replace(/\/+$/,'');
// Acesso de contingência: requer cadastro ativo validado no Firestore e é sempre somente leitura.
// A API Discord continua sendo a fonte operacional canônica, sem simular gravações.
let highOsEmergencyReadOnly=false;
/* V13 - ferramentas do Firestore repassadas aos modulos, para eles nao
   abrirem conexao propria.

   Montado SOB DEMANDA, nunca no topo do arquivo: setDoc e writeBatch
   aqui sao os embrulhos com contagem de escrita e limpeza de cache,
   declarados mais abaixo com const. Um objeto literal no topo leria
   essas variaveis antes da declaracao e derrubava o modulo inteiro com
   "Cannot access 'setDoc' before initialization" - nao o trecho da
   fila, o app todo. */
let _fnsFila=null;
function fnsFila(){
 return _fnsFila||(_fnsFila={db,doc,collection,getDoc,getDocs,setDoc,serverTimestamp,writeBatch,runTransaction,query,where,orderBy,limit});
}

async function highOsDiscordRequest(path,options={}){
 if(!currentUser)throw new Error('Sessão expirada. Entre novamente.');
 if(highOsEmergencyReadOnly){
  /* V13 - API fora do ar. Leitura continua recusada (o cache ja cobre
     isso); ESCRITA vai para a fila e e reenviada quando o PC voltar.
     Nada aqui finge que o bot recebeu: o retorno diz "enfileirado". */
  const metodo=String(options.method||'GET').toUpperCase();
  if(!fila.mutacao(metodo))throw new Error('API do Discord offline. Modo de contingência: somente leitura.');
  let corpo=null;
  try{corpo=options.body?JSON.parse(options.body):null}catch(e){corpo=options.body??null}
  const id=await fila.enfileirar(fnsFila(),{
   caminho:path,metodo,corpo,
   resumo:fila.resumirOperacao(path,metodo,corpo),
   usuario:currentUser.email||''
  });
  await atualizarSeloFila();
  return {enfileirado:true,filaId:id,
   aviso:'O bot está offline. A alteração ficou na fila e será enviada quando o PC ligar.'};
 }
 const token=await currentUser.getIdToken();
 const res=await fetch(HIGH_OS_DISCORD_API+path,{...options,headers:{'content-type':'application/json','authorization':'Bearer '+token,...(options.headers||{})}});
 const data=await res.json().catch(()=>({}));
 if(!res.ok)throw new Error(data.error||('High OS Discord HTTP '+res.status));
 return data;
}
function factionDiscordPayload(f={}){
 return {group:f.group,segmento:f.segmento||'',qg:f.qg||'',status:f.status||'INATIVA',faccao:f.faccao||'',lider:f.lider||'',staff:f.staff||'',dataEntrega:f.dataEntrega||'',contingenteMin:Number(f.contingenteMin||0),contingenteMax:Number(f.contingenteMax||0),beneficios:f.beneficios||{},observacoes:f.observacao||f.observacoes||'',discordImageUrls:Array.isArray(f.discordImageUrls)?f.discordImageUrls:(f.imagemAnuncio?[f.imagemAnuncio]:[])};
}
async function saveFactionToDiscord(f,extra={}){return highOsDiscordRequest('/v1/factions/'+encodeURIComponent(f.group),{method:'PUT',body:JSON.stringify({...factionDiscordPayload(f),...extra})});}
async function highOsStoreList(scope){const r=await highOsDiscordRequest('/v1/store/'+encodeURIComponent(scope));return (r.records||[]).map(x=>({id:x.id,...(x.data||{})}));}
async function highOsStoreGet(scope,id){const r=await highOsDiscordRequest('/v1/store/'+encodeURIComponent(scope)+'/'+encodeURIComponent(id));return {id:r.record.id,...(r.record.data||{})};}
async function highOsStorePut(scope,id,data){return highOsDiscordRequest('/v1/store/'+encodeURIComponent(scope)+'/'+encodeURIComponent(id),{method:'PUT',body:JSON.stringify(data)});}
async function highOsStoreDelete(scope,id){return highOsDiscordRequest('/v1/store/'+encodeURIComponent(scope)+'/'+encodeURIComponent(id),{method:'DELETE'});}
function discordId(prefix='row'){return prefix+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10);}


const facCol=collection(db,'highos','data','faccoes'), histCol=collection(db,'highos','data','historico'), reqCol=collection(db,'highos','data','solicitacoes'), deliveryCol=collection(db,'highos','data','entregas'), orgCol=collection(db,'highos','data','organizacoes'), sessionCol=collection(db,'highos','data','sessoes_usuario'), usersCol=collection(db,'users');

let currentSessionId='',currentSessionStart=0,sessionTimer=null,sessionWarningShown=false;

const segmentConfigDoc=doc(db,'highos','data','config','segmentos');

const dashboardConfigDoc=doc(db,'highos','data','config','dashboard');

const spotifyConfigDoc=doc(db,'highos','data','config','spotify');

const dashboardAlertCol=collection(db,'highos','data','alertas_dashboard');

const chatCol=collection(db,'highos','data','chat_mensagens');

const callCol=collection(db,'highos','data','call_signals');

const DEFAULT_DASHBOARD_CONFIG={quedaAtencaoPct:15,
quedaCriticaPct:30,
minComparacoes:4};

let dashboardConfig={...DEFAULT_DASHBOARD_CONFIG},dashboardAlertStates=[],spotifyConfig={url:'',
clientId:''},chatUnsubscribe=null,chatSubscriptionKey='',chatItems=[],chatPendingAttachment=null,chatRecipientEmail='',spotifyPlayer=null,spotifyDeviceId='',spotifyAccessToken='',spotifyTokenExpiry=0,activeMeetingRoom='',activeMeetingUrl='',activeMeetingChannel='',teamCallPendingFile=null,callInboxUnsubscribe=null,callInboxSubscriptionEmail='',activeCallUnsubscribe=null,activeCallId='',activePeer=null,activeLocalStream=null,activeRemoteStream=null,activeCallMode='audio',seenRemoteCandidates=new Set();

function sanitizeDashboardConfig(v={}){
 const legacyBase=Number(v.contingenteAlerta)||0;

 const atencao=Math.max(1,Math.min(90,Number(v.quedaAtencaoPct)|| (legacyBase?15:DEFAULT_DASHBOARD_CONFIG.quedaAtencaoPct)));

 const critico=Math.max(atencao+1,Math.min(100,Number(v.quedaCriticaPct)||DEFAULT_DASHBOARD_CONFIG.quedaCriticaPct));

 const minComparacoes=Math.max(1,Math.min(50,Number(v.minComparacoes)||DEFAULT_DASHBOARD_CONFIG.minComparacoes));

 return {quedaAtencaoPct:atencao,
quedaCriticaPct:critico,
minComparacoes};

}
let dashboardConfigReadAt=0;
const DASHBOARD_CONFIG_TTL=10*60*1000;
async function loadDashboardConfig({force=false}={}){
 if(!force&&dashboardConfigReadAt&&Date.now()-dashboardConfigReadAt<DASHBOARD_CONFIG_TTL){
  await loadDashboardAlertStates();renderDashboardConfigAdmin();renderCommandDashboard();return;
 }
 try{const _d=await highOsStoreGet('config','dashboard').catch(()=>null);const snap={exists:()=>!!_d,data:()=>_d||{}};
dashboardConfigReadAt=Date.now();
statBump('config_dashboard','leituras');
statBump('config_dashboard','docs',snap.exists()?1:0);
dashboardConfig=sanitizeDashboardConfig(snap.exists()?snap.data():DEFAULT_DASHBOARD_CONFIG);
/* V10.59 - carregar Dashboard não cria documento de configuração.
   Defaults ficam em memória até um admin realmente alterar os parâmetros. */
await loadDashboardAlertStates();
renderDashboardConfigAdmin();
renderCommandDashboard();
}
 catch(e){console.warn('Falha ao carregar parâmetros do dashboard',e);
dashboardConfig={...DEFAULT_DASHBOARD_CONFIG};
renderDashboardConfigAdmin();
renderCommandDashboard();
}
}
function dashboardHealth(alerts=[]){const open=alerts.filter(x=>!['CONCLUIDO',
'LIMPO'].includes(x.state||'PENDENTE'));
if(open.some(x=>x.level==='CRÍTICO'))return 'CRÍTICO';
if(open.length)return 'ATENÇÃO';
return 'NORMAL'}
function renderDashboardConfigAdmin(){
 const c=dashboardConfig||DEFAULT_DASHBOARD_CONFIG;

 const a=$('#dashCfgAtencao'),
cr=$('#dashCfgCritico'),
mc=$('#dashCfgMinComparacoes'),
preview=$('#dashCfgPreview');

 if(a)a.value=c.quedaAtencaoPct;
if(cr)cr.value=c.quedaCriticaPct;
if(mc)mc.value=c.minComparacoes;

 if(preview)preview.innerHTML=`<div><span>NORMAL</span><b>sem queda relevante</b></div><div><span>ATENÇÃO</span><b>queda ≥ ${c.quedaAtencaoPct}%</b></div><div><span>CRÍTICO</span><b>queda ≥ ${c.quedaCriticaPct}%</b></div><small>A referência é sempre a <b>semana anterior</b>. A semana atual é comparada somente com os mesmos dias/horários já coletados, evitando alerta por semana incompleta. Mínimo de <b>${c.minComparacoes}</b> coletas comparáveis.</small>`;

}
async function saveDashboardConfig(){
 if(!isAdmin())return;

 const raw={quedaAtencaoPct:Number($('#dashCfgAtencao')?.value),
quedaCriticaPct:Number($('#dashCfgCritico')?.value),
minComparacoes:Number($('#dashCfgMinComparacoes')?.value)};

 if(!Number.isFinite(raw.quedaAtencaoPct)||raw.quedaAtencaoPct<1)return alert('Informe a queda percentual para ATENÇÃO.');

 if(!Number.isFinite(raw.quedaCriticaPct)||raw.quedaCriticaPct<=raw.quedaAtencaoPct)return alert('A queda CRÍTICA precisa ser maior que a queda de ATENÇÃO.');

 if(!Number.isFinite(raw.minComparacoes)||raw.minComparacoes<1)return alert('Informe o mínimo de coletas comparáveis.');

 const before={...dashboardConfig};
dashboardConfig=sanitizeDashboardConfig(raw);
 if(JSON.stringify(before)===JSON.stringify(dashboardConfig)){renderDashboardConfigAdmin();renderCommandDashboard();return alert('Nenhuma alteração nos parâmetros do Dashboard.');}

 try{await setDoc(dashboardConfigDoc,{...dashboardConfig,
updatedAt:serverTimestamp(),
updatedBy:currentUser.email},{merge:true});
dashboardConfigReadAt=Date.now();
await addDoc(histCol,{sessionId:currentSessionId||'',
tipo:'DASHBOARD_PARAMETROS',
descricao:'Parâmetros semanais NORMAL / ATENÇÃO / CRÍTICO alterados',
antes:before,
depois:dashboardConfig,
usuario:currentUser.email,
data:serverTimestamp()});
renderDashboardConfigAdmin();
renderCommandDashboard();
alert('Parâmetros semanais do Dashboard salvos.');
}
 catch(e){dashboardConfig=before;
alert('Não foi possível salvar os parâmetros: '+e.message)}
}
let dashboardAlertsReadAt=0;
const DASHBOARD_ALERTS_TTL=5*60*1000;
async function loadDashboardAlertStates({force=false}={}){
 if(!force&&dashboardAlertsReadAt&&Date.now()-dashboardAlertsReadAt<DASHBOARD_ALERTS_TTL)return dashboardAlertStates;
 /* V10.74 - reaproveita o espelho persistido entre reloads/novas abas.
    Se ele ainda estiver dentro do TTL, evita as duas queries do Dashboard. */
 if(!force&&!dashboardAlertsReadAt){
  const cached=cacheMemoria.get('alertas_dashboard')||cacheLer('alertas_dashboard');
  const cachedAt=Number(cached?.at)||0;
  if(cached&&Array.isArray(cached.rows)&&cachedAt&&Date.now()-cachedAt<DASHBOARD_ALERTS_TTL){
   dashboardAlertStates=cached.rows.map(x=>({...x}));
   cacheMemoria.set('alertas_dashboard',{at:cachedAt,rows:dashboardAlertStates.map(x=>({...x}))});
   dashboardAlertsReadAt=cachedAt;
   statBump('alertas_dashboard','cache');
   return dashboardAlertStates;
  }
 }
 try{
  /* V10.66 - o Dashboard não precisa reler alertas semanais históricos.
     Busca somente a semana corrente e os estados persistentes de anomalia. */
  const weekKey=isoDay(startOfWeekMonday(new Date()));
  const _all=await highOsStoreList('alertas_dashboard');
  const _rows=_all.filter(x=>x.weekKey===weekKey||x.tipo==='VAGO_COM_METRICA');
  const qw={docs:_rows.filter(x=>x.weekKey===weekKey).map(x=>({id:x.id,data:()=>x}))},qa={docs:_rows.filter(x=>x.tipo==='VAGO_COM_METRICA').map(x=>({id:x.id,data:()=>x}))};
  const mapa=new Map(_rows.map(x=>[x.id,x]));
  dashboardAlertStates=[...mapa.values()];
  const rows=dashboardAlertStates.map(x=>({...x}));
  cacheMemoria.set('alertas_dashboard',{at:Date.now(),rows});
  cacheEscrever('alertas_dashboard',rows);
  statBump('alertas_dashboard','leituras',2);
  statBump('alertas_dashboard','docs',qw.docs.length+qa.docs.length);
  dashboardAlertsReadAt=Date.now();
 }catch(e){
  console.warn('Falha ao carregar status dos alertas; usando cache local quando disponível',e);
  const qs=cachedSnapshotOnly('alertas_dashboard');
  if(qs)dashboardAlertStates=qs.docs.map(d=>({id:d.id,...d.data()}));
 }
 return dashboardAlertStates;
}
function upsertDashboardAlertLocal(id,data={}){
 const row={id,...data,updatedAt:new Date()};
 const i=dashboardAlertStates.findIndex(x=>x.id===id);
 if(i>=0)dashboardAlertStates[i]={...dashboardAlertStates[i],...row};
 else dashboardAlertStates.push(row);
 queryFreshAt.set('alertas_dashboard',Date.now());
 dashboardAlertsReadAt=Date.now();
}
function alertStateId(group,weekKey){return `CONTINGENTE_${String(group||'').replace(/[^a-zA-Z0-9_-]/g,'_')}_${weekKey}`}
function findDashboardAlertState(group,weekKey){return dashboardAlertStates.find(x=>x.id===alertStateId(group,weekKey))||null}
async function setDashboardAlertState(group,weekKey,status){
 if(!canEditModule('dashboard'))return permissionDeniedMessage('dashboard',true);

 const id=alertStateId(group,weekKey),
before=findDashboardAlertState(group,weekKey);
 if(before&&String(before.status||'')===String(status||'')){renderCommandDashboard();return}
 const data={tipo:'CONTINGENTE_SEMANAL',
group,
weekKey,
status,
updatedAt:serverTimestamp(),
updatedBy:currentUser.email};

 try{await setDoc(doc(db,'highos','data','alertas_dashboard',id),data,{merge:true});
await addDoc(histCol,{sessionId:currentSessionId||'',
tipo:'ALERTA_DASHBOARD',
group,
descricao:`Alerta semanal marcado como ${status}`,
antes:before||null,
depois:{group,
weekKey,
status},
usuario:currentUser.email,
data:serverTimestamp()});
upsertDashboardAlertLocal(id,{...data,updatedBy:currentUser.email});
renderCommandDashboard()}catch(e){alert('Erro ao atualizar o alerta: '+e.message)}
}
function anomalyAlertId(group){return `VAGO_METRICA_${String(group||'').replace(/[^a-zA-Z0-9_-]/g,'_')}`}
function anomalyIsCleared(group,date){const st=dashboardAlertStates.find(x=>x.id===anomalyAlertId(group));
if(!st||st.status!=='LIMPO')return false;
const cleared=st.metricAt?.toDate?st.metricAt.toDate():st.metricAt?new Date(st.metricAt):null;
return !!(cleared&&date&&date<=cleared)}
async function clearVacantMetricAlert(group,date){if(!canEditModule('dashboard'))return permissionDeniedMessage('dashboard',true);
const id=anomalyAlertId(group),
metricAt=date instanceof Date?date:new Date(date),
before=dashboardAlertStates.find(x=>x.id===id);
if(before?.status==='LIMPO'){
 const oldAt=before.metricAt?.toDate?before.metricAt.toDate():before.metricAt?new Date(before.metricAt):null;
 if(oldAt&&!isNaN(oldAt)&&oldAt.getTime()>=metricAt.getTime()){renderCommandDashboard();return}
}
try{await setDoc(doc(db,'highos','data','alertas_dashboard',id),{tipo:'VAGO_COM_METRICA',
group,
status:'LIMPO',
metricAt,
updatedAt:serverTimestamp(),
updatedBy:currentUser.email},{merge:true});
await addDoc(histCol,{sessionId:currentSessionId||'',
tipo:'ALERTA_DASHBOARD',
group,
descricao:'Alerta de Group vago com métrica removido do Dashboard',
depois:{group,
status:'LIMPO',
metricAt:metricAt.toISOString()},
usuario:currentUser.email,
data:serverTimestamp()});
upsertDashboardAlertLocal(id,{tipo:'VAGO_COM_METRICA',group,status:'LIMPO',metricAt,updatedBy:currentUser.email});
renderCommandDashboard()}catch(e){alert('Erro ao limpar o alerta: '+e.message)}}
const DEFAULT_SEGMENTS=[
 {nome:'MECÂNICA ILEGAL', icone:'🛠️', descricao:'Mecânicas Ilegais'},
 {nome:'HOSPITAL ILEGAL', icone:'🏥', descricao:'Hospitais Ilegais'},
 {nome:'ARMAS',
icone:'🔫',
descricao:'Arsenal'},

 {nome:'MUNIÇÃO',
icone:'🎯',
descricao:'Munições'},

 {nome:'DROGAS',
icone:'🧪',
descricao:'Drogas'},

 {nome:'LAVAGEM',
icone:'💵',
descricao:'Lavagem'},

 {nome:'DESMANCHE',
icone:'🔧',
descricao:'Desmanche'},

 {nome:'ESTELIONATÁRIOS',
icone:'💳',
descricao:'Estelionatários'},

 {nome:'CONTRABANDO',
icone:'📦',
descricao:'Contrabando'},

 {nome:'APOIO',
icone:'🛠️',
descricao:'Apoio Ilegal'},

 {nome:'OUTROS',
icone:'◆',
descricao:'Outros'}
];

let segmentos=[...DEFAULT_SEGMENTS];

function cleanSegmentName(v=''){return String(v||'').trim().toUpperCase()}
function segmentDefs(){return segmentos.length?segmentos:DEFAULT_SEGMENTS}
function segmentNames(){return segmentDefs().map(x=>x.nome)}
function syncSegmentSelects(){
 const opts=segmentNames().map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');

 ['fSegment',
'oSegment',
'segmentAssignTarget'].forEach(id=>{const el=$('#'+id);if(!el)return;const old=el.value;el.innerHTML=opts;if(old&&segmentNames().some(x=>segmentKey(x)===segmentKey(old)))el.value=segmentNames().find(x=>segmentKey(x)===segmentKey(old));});

 const metric=$('#metricSegment');
if(metric){const old=metric.value;
metric.innerHTML='<option value="">TODOS OS SEGMENTOS</option>'+opts;
if(old&&segmentNames().includes(old))metric.value=old;
}
}
let segmentConfigReadAt=0;
const SEGMENT_CONFIG_TTL=10*60*1000;
async function loadSegmentConfig({force=false}={}){
 if(!force&&segmentConfigReadAt&&Date.now()-segmentConfigReadAt<SEGMENT_CONFIG_TTL){syncSegmentSelects();renderSegmentAdmin();return}
 try{const _d=await highOsStoreGet('config','segmentos').catch(()=>null);const snap={exists:()=>!!_d,data:()=>_d||{}};
segmentConfigReadAt=Date.now();
statBump('config_segmentos','leituras');
statBump('config_segmentos','docs',snap.exists()?1:0);
if(snap.exists()&&Array.isArray(snap.data().items)&&snap.data().items.length)segmentos=snap.data().items.map(x=>({nome:cleanSegmentName(x.nome),
icone:x.icone||'◇',
descricao:x.descricao||cleanSegmentName(x.nome)})).filter(x=>x.nome);
else{
 segmentos=[...DEFAULT_SEGMENTS];
 /* V10.58 - leitura não cria configuração no Firestore. Os padrões ficam
    somente em memória até que um admin realmente altere/salve segmentos. */
}syncSegmentSelects();
renderSegmentAdmin();
}catch(e){console.warn('Falha ao carregar segmentos',e);
segmentos=[...DEFAULT_SEGMENTS];
syncSegmentSelects();
}
}

const SEED=[{"numero": 1,
 "cds": "{1286.34,-266.43,99.7,303.31}",
 "anuncio": "",
 "qg": "Favela da Barragem",
 "group": "Armas01",
 "groupOriginal": "Armas01",
 "segmento": "ARMAS",
 "produto": "Pistola, Sub Metralhadora e Rifle",
 "faccao": "Imperial",
 "status": "ATIVA",
 "lider": "109 —Brunin Allef",
 "staff": "Ítalo Leonardo",
 "dataEntrega": "17/07/2026",
 "observacoes": ""},
 {"numero": 2,
 "cds": "{2696.23,3400.29,58.82,90.71}",
 "anuncio": "",
 "qg": "Favela do MegaMall",
 "group": "Armas02",
 "groupOriginal": "Armas02",
 "segmento": "ARMAS",
 "produto": "Pistola, Sub Metralhadora e Rifle",
 "faccao": "Talibã",
 "status": "ATIVA",
 "lider": "4792—Grazzi Sette",
 "staff": "Italo Leonardo",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 3,
 "cds": "2355.39,-605.06,96.58,257.96",
 "anuncio": "NULO",
 "qg": "SEM LOCAL",
 "group": "Armas03",
 "groupOriginal": "Armas03",
 "segmento": "ARMAS",
 "produto": "Pistola, Sub Metralhadora e Rifle",
 "faccao": "",
 "status": "INATIVA",
 "lider": "",
 "staff": "",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 4,
 "cds": "{-2390.91,-198.43,39.65,269.3}",
 "anuncio": "",
 "qg": "Favela da Praia 1",
 "group": "Armas04",
 "groupOriginal": "Armas04",
 "segmento": "ARMAS",
 "produto": "Pistola, Sub Metralhadora e Rifle",
 "faccao": "Peitanove",
 "status": "ATIVA",
 "lider": "2199—Boaventura P",
 "staff": "Ralf",
 "dataEntrega": "20/07/2026",
 "observacoes": ""},
 {"numero": 5,
 "cds": "{2561.79,2437.52,55.47,110.56}",
 "anuncio": "SIM",
 "qg": "Favela do Dino",
 "group": "Armas05",
 "groupOriginal": "Armas05",
 "segmento": "ARMAS",
 "produto": "Pistola, Sub Metralhadora e Rifle",
 "faccao": "",
 "status": "INATIVA",
 "lider": "—",
 "staff": "",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 6,
 "cds": "{-2120.96,2482.66,10.03,133.23}",
 "anuncio": "",
 "qg": "Favela do Zancudo",
 "group": "Armas06",
 "groupOriginal": "Armas06",
 "segmento": "ARMAS",
 "produto": "Pistola, Sub Metralhadora e Rifle",
 "faccao": "Medellin",
 "status": "ATIVA",
 "lider": "7142—Alix Fainelli",
 "staff": "Italo Leonardo",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 7,
 "cds": "-113.73,-12.34,70.52,133.23",
 "anuncio": "",
 "qg": "Favela do Campinho",
 "group": "Armas07",
 "groupOriginal": "Armas07",
 "segmento": "ARMAS",
 "produto": "Pistola, Sub Metralhadora e Rifle",
 "faccao": "",
 "status": "INATIVA",
 "lider": "",
 "staff": "",
 "dataEntrega": "",
 "observacoes": "",
 "semCraft": true},
 {"numero": 8,
 "cds": "60.64,2602.08,87.1,303.31",
 "anuncio": "SIM",
 "qg": "Distrito 14 (apto norte)",
 "group": "Armas08",
 "groupOriginal": "Armas08",
 "segmento": "ARMAS",
 "produto": "Pistola, Sub Metralhadora e Rifle",
 "faccao": "",
 "status": "INATIVA",
 "lider": "—",
 "staff": "",
 "dataEntrega": "",
 "observacoes": "",
 "removido": true},
 {"numero": 9,
 "cds": "2640.33,1789.71,33.62,102.05",
 "anuncio": "",
 "qg": "Favela da Indústria, Sul",
 "group": "Armas09",
 "groupOriginal": "Armas09",
 "segmento": "ARMAS",
 "produto": "Pistola, Sub Metralhadora e Rifle",
 "faccao": "Safadoes",
 "status": "ATIVA",
 "lider": "3182 / JUNIM SAFADO",
 "staff": "RALF PENA",
 "dataEntrega": "16/08/26",
 "observacoes": ""},
 {"numero": 10,
 "cds": "-1431.37,2306.54,30.82,187.09",
 "anuncio": "SIM",
 "qg": "Favela da Cachoeira",
 "group": "Armas10",
 "groupOriginal": "Armas10",
 "segmento": "ARMAS",
 "produto": "Pistola, Sub Metralhadora e Rifle",
 "faccao": "Lotus",
 "status": "ATIVA",
 "lider": "12510 — Ray Hollow",
 "staff": "Italo Alves",
 "dataEntrega": "04/09/26",
 "observacoes": ""},
 {"numero": 11,
 "cds": "{-480.22,1613.99,369.58,0.0}",
 "anuncio": "NAO",
 "qg": "FAVELA DO OBS 2",
 "group": "Armas11",
 "groupOriginal": "Armas 11",
 "segmento": "ARMAS",
 "produto": "Pistola, Sub Metralhadora e Rifle",
 "faccao": "Playboy",
 "status": "ATIVA",
 "lider": "12182 - Igor Mecktref",
 "staff": "Ralf Pena",
 "dataEntrega": "26/08/26",
 "observacoes": ""},
 {"numero": 12,
 "cds": "1550.5,-728.82,111.51,204.1",
 "anuncio": "",
 "qg": "Clube de Festas, Açougue",
 "group": "Municao01",
 "groupOriginal": "Municao01",
 "segmento": "MUNIÇÃO",
 "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++",
 "faccao": "Golden Lotus",
 "status": "ATIVA",
 "lider": "9528—Maddy A Jhuns",
 "staff": "Jonh",
 "dataEntrega": "09/07/26",
 "observacoes": ""},
 {"numero": 13,
 "cds": "{-779.26,985.57,249.23,195.6}",
 "anuncio": "NAO",
 "qg": "Favela do OBS 2",
 "group": "Municao02",
 "groupOriginal": "Municao02",
 "segmento": "MUNIÇÃO",
 "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++",
 "faccao": "",
 "status": "INATIVA",
 "lider": "",
 "staff": "",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 14,
 "cds": "-130.69,3220.77,73.72,255.12",
 "anuncio": "SIM",
 "qg": "Favela de Sandy Shores, Baixo",
 "group": "Municao03",
 "groupOriginal": "Municao03",
 "segmento": "MUNIÇÃO",
 "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++",
 "faccao": "Hidra",
 "status": "ATIVA",
 "lider": "12114- Jaque Miller",
 "staff": "Ralf Pena",
 "dataEntrega": "25/08/26",
 "observacoes": ""},
 {"numero": 15,
 "cds": "1367.56,-2433.89,62.18,337.33",
 "anuncio": "",
 "qg": "Favela do Petróleo, Sul",
 "group": "Municao04",
 "groupOriginal": "Municao04",
 "segmento": "MUNIÇÃO",
 "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++",
 "faccao": "",
 "status": "INATIVA",
 "lider": "",
 "staff": "",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 16,
 "cds": "2047.86,5095.36,58.32,2.84",
 "anuncio": "",
 "qg": "QG da Plantação",
 "group": "Municao05",
 "groupOriginal": "Municao05",
 "segmento": "MUNIÇÃO",
 "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++",
 "faccao": "",
 "status": "INATIVA",
 "lider": "",
 "staff": "",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 17,
 "cds": "2473.01,4959.72,44.89,51.03",
 "anuncio": "NAO",
 "qg": "Mansao da Fazenda Queimada",
 "group": "Municao06",
 "groupOriginal": "Municao06",
 "segmento": "MUNIÇÃO",
 "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++",
 "faccao": "",
 "status": "INATIVA",
 "lider": "—",
 "staff": "",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 18,
 "cds": "-1896.6,2015.73,171.3,351.5",
 "anuncio": "",
 "qg": "Vinhedo",
 "group": "Municao07",
 "groupOriginal": "Municao07",
 "segmento": "MUNIÇÃO",
 "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++",
 "faccao": "Real Midia",
 "status": "ATIVA",
 "lider": "2323—Henrique Lewis",
 "staff": "Italo Leonardo",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 19,
 "cds": "-1771.7,-117.8,95.4",
 "anuncio": "",
 "qg": "Favela do Cemitério, Sul",
 "group": "Municao08",
 "groupOriginal": "Municao08",
 "segmento": "MUNIÇÃO",
 "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++",
 "faccao": "",
 "status": "INATIVA",
 "lider": "",
 "staff": "",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 20,
 "cds": "320.79,-2058.35,24.03,323.15",
 "anuncio": "NAO",
 "qg": "QG dos Vagos",
 "group": "Municao09",
 "groupOriginal": "Municao09",
 "segmento": "MUNIÇÃO",
 "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++",
 "faccao": "",
 "status": "INATIVA",
 "lider": "-",
 "staff": "",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 21,
 "cds": "-3694.8,3790.2,5.1",
 "anuncio": "",
 "qg": "Ilha Particular",
 "group": "Municao10",
 "groupOriginal": "Municao10",
 "segmento": "MUNIÇÃO",
 "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++",
 "faccao": "Black Angels",
 "status": "ATIVA",
 "lider": "4510—Gordao",
 "staff": "Ralf Pena",
 "dataEntrega": "11/06/26",
 "observacoes": ""},
 {"numero": 22,
 "cds": "241.5,-3144.2,3.3",
 "anuncio": "SIM",
 "qg": "Club 77",
 "group": "Lavagem01",
 "groupOriginal": "Lavagem01",
 "segmento": "LAVAGEM",
 "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora",
 "faccao": "",
 "status": "INATIVA",
 "lider": "—",
 "staff": "",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 23,
 "cds": "1466.47,1119.43,119.13,0.0",
 "anuncio": "",
 "qg": "FAZENDA, SUL",
 "group": "Lavagem02",
 "groupOriginal": "Lavagem02",
 "segmento": "LAVAGEM",
 "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora",
 "faccao": "Yakuza",
 "status": "ATIVA",
 "lider": "101—Mel Conha",
 "staff": "",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 24,
 "cds": "768.49,441.9,149.73,215.44",
 "anuncio": "",
 "qg": "Bahamas",
 "group": "Lavagem03",
 "groupOriginal": "Lavagem03",
 "segmento": "LAVAGEM",
 "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora",
 "faccao": "Renegados",
 "status": "ATIVA",
 "lider": "51—Ana Konda",
 "staff": "Italo Leonardo",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 25,
 "cds": "-482.6,1606.5,369.6",
 "anuncio": "NULO",
 "qg": "SEM LOCAL",
 "group": "Lavagem04",
 "groupOriginal": "Lavagem04",
 "segmento": "LAVAGEM",
 "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora",
 "faccao": "",
 "status": "INATIVA",
 "lider": "",
 "staff": "",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 26,
 "cds": "{-1540.36,81.20,56.58}",
 "anuncio": "",
 "qg": "Mansão da Playboy",
 "group": "Lavagem05",
 "groupOriginal": "Lavagem05",
 "segmento": "LAVAGEM",
 "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora",
 "faccao": "ICE",
 "status": "ATIVA",
 "lider": "899—Mani Khalifa",
 "staff": "Italo Leonardo",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 27,
 "cds": "",
 "anuncio": "SIM",
 "qg": "Boate Arcade",
 "group": "Lavagem06",
 "groupOriginal": "Lavagem06",
 "segmento": "LAVAGEM",
 "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora",
 "faccao": "",
 "status": "INATIVA",
 "lider": "",
 "staff": "",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 28,
 "cds": "1876.33,1511.54,112.98,357.17",
 "anuncio": "NULO",
 "qg": "SEM LOCAL",
 "group": "Lavagem07",
 "groupOriginal": "Lavagem07",
 "segmento": "LAVAGEM",
 "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora",
 "faccao": "",
 "status": "INATIVA",
 "lider": "",
 "staff": "",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 29,
 "cds": "SEM QG",
 "anuncio": "NULO",
 "qg": "SEM LOCAL",
 "group": "Lavagem08",
 "groupOriginal": "Lavagem08",
 "segmento": "LAVAGEM",
 "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora",
 "faccao": "",
 "status": "INATIVA",
 "lider": "",
 "staff": "",
 "dataEntrega": "",
 "observacoes": "",
 "removido": true},
 {"numero": 30,
 "cds": "342.68,293.21,118.13,354.34",
 "anuncio": "NAO",
 "qg": "Galaxy",
 "group": "Lavagem09",
 "groupOriginal": "Lavagem09",
 "segmento": "LAVAGEM",
 "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora",
 "faccao": "",
 "status": "INATIVA",
 "lider": "—",
 "staff": "",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 31,
 "cds": "1876.33,1511.54,112.98,357.17",
 "anuncio": "NAO",
 "qg": "Favela do Sapao",
 "group": "Estelionatarios01",
 "groupOriginal": "Estelionatarios01",
 "segmento": "ESTELIONATÁRIOS",
 "produto": "Cartão Nuhigh Prata e Ouro e Dinheiro Falso",
 "faccao": "",
 "status": "INATIVA",
 "lider": "—",
 "staff": "",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 32,
 "cds": "-1376.69,-621.82,35.89,31.19",
 "anuncio": "NAO",
 "qg": "Favela da Boa Vista",
 "group": "Estelionatarios02",
 "groupOriginal": "Estelionatarios02",
 "segmento": "ESTELIONATÁRIOS",
 "produto": "Cartão Nuhigh Prata e Ouro e Dinheiro Falso",
 "faccao": "",
 "status": "INATIVA",
 "lider": "—",
 "staff": "",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 33,
 "cds": "657.75,-174.98,69.86,59.53",
 "anuncio": "NULO",
 "qg": "SEM LOCAL",
 "group": "Drogas01",
 "groupOriginal": "Drogas01",
 "segmento": "DROGAS",
 "produto": "Metadona, Capuz e Placa Balistica",
 "faccao": "",
 "status": "INATIVA",
 "lider": "—",
 "staff": "",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 34,
 "cds": "-1682.63,931.86,180.38,334.49",
 "anuncio": "NULO",
 "qg": "SEM LOCAL",
 "group": "Drogas02",
 "groupOriginal": "Drogas02",
 "segmento": "DROGAS",
 "produto": "Metadona, Capuz e Placa Balistica",
 "faccao": "",
 "status": "INATIVA",
 "lider": "",
 "staff": "",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 35,
 "cds": "1367.25,-1381.16,108.73,257.96",
 "anuncio": "SIM",
 "qg": "Favela morro dos Macacos",
 "group": "Drogas03",
 "groupOriginal": "Drogas03",
 "segmento": "DROGAS",
 "produto": "Heroina, Capuz e Placa Balistica",
 "faccao": "",
 "status": "INATIVA",
 "lider": "",
 "staff": "",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 36,
 "cds": "SEM QG",
 "anuncio": "NULO",
 "qg": "SEM LOCAL",
 "group": "Drogas04",
 "groupOriginal": "Drogas04",
 "segmento": "DROGAS",
 "produto": "Heroina, Capuz e Placa Balistica",
 "faccao": "",
 "status": "INATIVA",
 "lider": "—",
 "staff": "",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 37,
 "cds": "SEM QG",
 "anuncio": "NULO",
 "qg": "SEM LOCAL",
 "group": "Drogas05",
 "groupOriginal": "Drogas05",
 "segmento": "DROGAS",
 "produto": "Heroina, Capuz e Placa Balistica",
 "faccao": "",
 "status": "INATIVA",
 "lider": "—",
 "staff": "",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 38,
 "cds": "1550.5,-728.82,111.51,204.1",
 "anuncio": "NAO",
 "qg": "Favela do Helipa",
 "group": "Drogas06",
 "groupOriginal": "Drogas06",
 "segmento": "DROGAS",
 "produto": "Metadona, Capuz e Placa Balistica",
 "faccao": "Helipa",
 "status": "ATIVA",
 "lider": "12380 - Megan Fox",
 "staff": "Italo Alves",
 "dataEntrega": "01/09/2026",
 "observacoes": ""},
 {"numero": 39,
 "cds": "-9.29,-1441.26,31.1,215.44",
 "anuncio": "SIM",
 "qg": "Residência Clinton",
 "group": "Drogas07",
 "groupOriginal": "Drogas07",
 "segmento": "DROGAS",
 "produto": "Anfetamina, Capuz e Placa Balistica",
 "faccao": "",
 "status": "INATIVA",
 "lider": "—",
 "staff": "",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 40,
 "cds": "{-2902.94,1485.7,71.12,153.08}",
 "anuncio": "SIM",
 "qg": "Favela da Praia 3",
 "group": "Drogas08",
 "groupOriginal": "Drogas08",
 "segmento": "DROGAS",
 "produto": "Crack, Capuz e Placa Balistica",
 "faccao": "",
 "status": "INATIVA",
 "lider": "",
 "staff": "",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 41,
 "cds": "{-1682.63,931.86,180.38,334.49}",
 "anuncio": "NAO",
 "qg": "Favela do Asilo",
 "group": "Drogas09",
 "groupOriginal": "Drogas09",
 "segmento": "DROGAS",
 "produto": "Anfetamina, Capuz e Placa Balistica",
 "faccao": "Black Eagles",
 "status": "ATIVA",
 "lider": "1149—Sergio Medina",
 "staff": "Italo Leonardo",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 42,
 "cds": "{1772.1,6474.44,60.04,240.95}",
 "anuncio": "NAO",
 "qg": "Favela de Paleto, Norte",
 "group": "Drogas10",
 "groupOriginal": "Drogas10",
 "segmento": "DROGAS",
 "produto": "Heroina, Capuz e Placa Balistica",
 "faccao": "",
 "status": "INATIVA",
 "lider": "",
 "staff": "",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 43,
 "cds": "{-59.76,-2517.63,7.30}",
 "anuncio": "SIM",
 "qg": "Posto, Porto",
 "group": "Drogas11",
 "groupOriginal": "Drogas11",
 "segmento": "DROGAS",
 "produto": "Crack, Capuz e Placa Balistica",
 "faccao": "",
 "status": "INATIVA",
 "lider": "—",
 "staff": "",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 44,
 "cds": "{-1332.84,-1238.37,1.4,317.49}",
 "anuncio": "SIM",
 "qg": "QG Gang 1",
 "group": "Desmanche01",
 "groupOriginal": "Desmanche01",
 "segmento": "DESMANCHE",
 "produto": "Cartão Ilegivel, Cartao Ilegivel ++, Gazua, Gazua++, Desmanche",
 "faccao": "Desmanche01",
 "status": "ATIVA",
 "lider": "12359 — Gtres Bittencourt",
 "staff": "Italo Leonardo",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 45,
 "cds": "-572.99,286.48,79.18,184.26",
 "anuncio": "NAO",
 "qg": "Tequi-la-la",
 "group": "Desmanche02",
 "groupOriginal": "Desmanche02",
 "segmento": "DESMANCHE",
 "produto": "Cartão Ilegivel, Cartao Ilegivel ++, Gazua, Gazua++, Desmanche",
 "faccao": "Tequila-la",
 "status": "ATIVA",
 "lider": "11728 - TiToin Gaspar",
 "staff": "Jonh Smith",
 "dataEntrega": "25/08/26",
 "observacoes": ""},
 {"numero": 46,
 "cds": "-1376.69,-621.82,35.89,31.19",
 "anuncio": "NAO",
 "qg": "Favela da Placa",
 "group": "Desmanche03",
 "groupOriginal": "Desmanche03",
 "segmento": "DESMANCHE",
 "produto": "Cartão Ilegivel, Cartao Ilegivel ++, Gazua, Gazua++, Desmanche",
 "faccao": "",
 "status": "INATIVA",
 "lider": "",
 "staff": "",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 47,
 "cds": "983.12,-126.47,74.05,320.32",
 "anuncio": "",
 "qg": "Motoclube Lost MC",
 "group": "Desmanche04",
 "groupOriginal": "Desmanche04",
 "segmento": "DESMANCHE",
 "produto": "Cartão Ilegivel, Cartao Ilegivel ++, Gazua, Gazua++, Desmanche",
 "faccao": "Abutres Motoclube",
 "status": "ATIVA",
 "lider": "11181 Chefinho",
 "staff": "Ralf Pena",
 "dataEntrega": "17/08/2026",
 "observacoes": ""},
 {"numero": 48,
 "cds": "{-616.13,-1621.95,32.88}",
 "anuncio": "NAO",
 "qg": "Roogers",
 "group": "Desmanche05",
 "groupOriginal": "Desmanche05",
 "segmento": "DESMANCHE",
 "produto": "Cartão Ilegivel, Cartao Ilegivel ++, Gazua, Gazua++, Desmanche",
 "faccao": "",
 "status": "INATIVA",
 "lider": "",
 "staff": "",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 49,
 "cds": "471.44,-1311.00,29.26",
 "anuncio": "",
 "qg": "Hayes Auto",
 "group": "Desmanche06",
 "groupOriginal": "Desmanche06",
 "segmento": "DESMANCHE",
 "produto": "Cartão Ilegivel, Cartao Ilegivel ++, Gazua, Gazua++, Desmanche",
 "faccao": "",
 "status": "INATIVA",
 "lider": "",
 "staff": "",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 50,
 "cds": "2201.62,4689.18,37.68,68.04",
 "anuncio": "NAO",
 "qg": "Favela de Sandy Shores, Alto",
 "group": "Desmanche07",
 "groupOriginal": "Desmanche07",
 "segmento": "DESMANCHE",
 "produto": "Cartão Ilegivel, Cartao Ilegivel ++, Gazua, Gazua++, Desmanche",
 "faccao": "",
 "status": "INATIVA",
 "lider": "",
 "staff": "",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 51,
 "cds": "92.59,-1290.91,29.25",
 "anuncio": "NAO",
 "qg": "Vanilla",
 "group": "Vanilla",
 "groupOriginal": "Vanilla",
 "segmento": "OUTROS",
 "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora",
 "faccao": "Vannila Unicorn",
 "status": "ATIVA",
 "lider": "5128 - MECIN BARROS",
 "staff": "Ralf",
 "dataEntrega": "26/08/26",
 "observacoes": ""},
 {"numero": 52,
 "cds": "227.44,-1388.25,32.45,36.86",
 "anuncio": "",
 "qg": "IML Centro",
 "group": "IlegalMedic01",
 "groupOriginal": "IlegalMedic01",
 "segmento": "APOIO",
 "produto": "Bandagem Infectada, Metadona, Adrenalina Clandestina",
 "faccao": "",
 "status": "INATIVA",
 "lider": "",
 "staff": "",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 53,
 "cds": "",
 "anuncio": "NULO",
 "qg": "SEM LOCAL",
 "group": "IlegalMedic2",
 "groupOriginal": "IlegalMedic2",
 "segmento": "APOIO",
 "produto": "Bandagem Infectada, Metadona, Adrenalina Clandestina",
 "faccao": "",
 "status": "INATIVA",
 "lider": "",
 "staff": "",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 54,
 "cds": "{2355.39,-605.06,96.58,257.96}",
 "anuncio": "",
 "qg": "Favela da DP",
 "group": "IlegalMechanic01",
 "groupOriginal": "IlegalMechanic01",
 "segmento": "APOIO",
 "produto": "Nitro, Tablet de Corrida,  Cartao Descartavel, Cartão Descartável ++",
 "faccao": "Comando Central",
 "status": "ATIVA",
 "lider": "10711—Rabico silva",
 "staff": "Nala",
 "dataEntrega": "27/07/2026",
 "observacoes": ""},
 {"numero": 55,
 "cds": "",
 "anuncio": "",
 "qg": "Galpão do Porto",
 "group": "Contrabando01",
 "groupOriginal": "Contrabando01",
 "segmento": "CONTRABANDO",
 "produto": "Farme de todas as facções disponiveis",
 "faccao": "Capricorp",
 "status": "ATIVA",
 "lider": "819 - Joseph Capri",
 "staff": "",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 56,
 "cds": "",
 "anuncio": "NAO",
 "qg": "Casa do Lester",
 "group": "Contrabando02",
 "groupOriginal": "Contrabando02",
 "segmento": "CONTRABANDO",
 "produto": "Farme de todas as facções disponiveis",
 "faccao": "",
 "status": "INATIVA",
 "lider": "",
 "staff": "",
 "dataEntrega": "",
 "observacoes": ""},
 {"numero": 57,
 "cds": "3899.68,4877.41,12.7,93.55",
 "anuncio": "",
 "qg": "Manicomio",
 "group": "Manicomio",
 "groupOriginal": "Manicomio",
 "segmento": "DROGAS",
 "produto": "LSD, Capuz e Placa Balistica, Glock Rajada, Gazua, Gazua ++, Adrenalina Clandestina",
 "faccao": "Manicomio",
 "status": "ATIVA",
 "lider": "15—Dark Rott",
 "staff": "Italo Leonardo",
 "dataEntrega": "",
 "observacoes": ""}];

function show(el){[loginView,
deniedView,
appView].forEach(x=>x.classList.add('hidden'));
el.classList.remove('hidden')}
async function login(){try{await signInWithPopup(auth,provider)}catch(e){alert('Não foi possível entrar com Google: '+e.message)}}
const SESSION_MAX_MS=8*60*60*1000;

function sessionStorageKey(email=''){return 'highos_session_'+String(email||'').toLowerCase()}
function makeSessionId(email=''){return `${Date.now()}_${String(email||'user').replace(/[^a-z0-9]/gi,'_')}_${Math.random().toString(36).slice(2,8)}`}
function fmtDuration(ms=0){ms=Math.max(0,Number(ms)||0);
const total=Math.floor(ms/1000),
h=Math.floor(total/3600),
m=Math.floor((total%3600)/60),
sec=total%60;
return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`}
function sessionMeta(){return {sessionId:currentSessionId,
sessionStart:currentSessionStart||0}}
async function closeCurrentSession(reason='LOGOUT'){
 if(!currentUser||!currentSessionId)return;

 /* V9.8 - blindagem: se alguem ligar logout direto a um onclick, o motivo
    chega como Event e o Firestore recusa o documento inteiro. */
 if(typeof reason!=='string')reason='LOGOUT';

 const now=Date.now(),
duration=Math.max(0,now-currentSessionStart);

 try{await setDoc(doc(db,'highos','data','sessoes_usuario',currentSessionId),{status:'ENCERRADA',
endAt:serverTimestamp(),
endAtText:new Date(now).toISOString(),
lastActivityAt:serverTimestamp(),
lastActivityText:new Date(now).toISOString(),
durationMs:duration,
endReason:reason,
updatedBy:currentUser.email},{merge:true});

 /* V10.56 - status, duração, motivo e timestamps já ficam em sessoes_usuario.
    Não duplica o encerramento no Histórico. */
}catch(e){console.warn('Falha ao encerrar sessão no log',e)}
 try{localStorage.removeItem(sessionStorageKey(currentUser.email))}catch(e){}
 currentSessionId='';
currentSessionStart=0;
if(sessionTimer){clearInterval(sessionTimer);
sessionTimer=null}
}
async function logout(reason='LOGOUT'){await closeCurrentSession(reason);
await signOut(auth)}
async function startOrResumeSession(user,profile){
 const email=String(user.email||'').toLowerCase(),
key=sessionStorageKey(email),
now=Date.now();
let saved=null;

 try{saved=JSON.parse(localStorage.getItem(key)||'null')}catch(e){}
 if(saved?.id&&saved?.start&&now-saved.start<SESSION_MAX_MS){currentSessionId=saved.id;
currentSessionStart=Number(saved.start)||now;
}
 else{
  if(saved?.id&&saved?.start&&now-saved.start>=SESSION_MAX_MS){try{await setDoc(doc(db,'highos','data','sessoes_usuario',saved.id),{status:'ENCERRADA',
endAtText:new Date(saved.start+SESSION_MAX_MS).toISOString(),
durationMs:SESSION_MAX_MS,
endReason:'TIMEOUT_8H'},{merge:true})}catch(e){}}
  currentSessionId=makeSessionId(email);
currentSessionStart=now;
sessionWarningShown=false;

  try{localStorage.setItem(key,JSON.stringify({id:currentSessionId,
start:currentSessionStart,
email}))}catch(e){}
  try{await setDoc(doc(db,'highos','data','sessoes_usuario',currentSessionId),{sessionId:currentSessionId,
email,
nome:profile?.name||user.displayName||'',
role:String(profile?.role||'CONSULTA').toUpperCase(),
cargo:profile?.cargo||String(profile?.role||'CONSULTA').toUpperCase(),
status:'EM_ANDAMENTO',
startAt:serverTimestamp(),
startAtText:new Date(now).toISOString(),
lastActivityAt:serverTimestamp(),
lastActivityText:new Date(now).toISOString(),
createdBy:email});

  /* V10.56 - o documento sessoes_usuario já é a auditoria canônica de login.
     Evita duplicar cada início de sessão também no Histórico. */
}catch(e){console.warn('Falha ao registrar início da sessão',e)}
 }
 startSessionClock(email);

}
function renderSessionClock(email=''){
 if(!currentSessionStart||!currentSessionId)return;
const elapsed=Date.now()-currentSessionStart,
remaining=SESSION_MAX_MS-elapsed;

 const displayName=currentProfile?.name||currentUser?.displayName||email;

 const cargo=currentProfile?.cargo||String(currentProfile?.role||'CONSULTA').toUpperCase();

 const photo=currentUser?.photoURL||'';

 if(sessionArea){sessionArea.innerHTML=`<div class="bank-session-shell"><div class="bank-user-identity">${photo?`<img src="${esc(photo)}" alt="Foto Google">`:`<span class="bank-user-fallback">${esc(String(displayName||'?').slice(0,1).toUpperCase())}</span>`}<div><small>USUÁRIO CONECTADO</small><strong>${esc(displayName)}</strong><span>${esc(cargo)}</span></div></div><div class="bank-session-divider"></div><div class="session-clock-box"><span>BEM-VINDO, ${esc(email)}</span><b>TEMPO DE SESSÃO</b><small><strong>${fmtDuration(elapsed)}</strong><em>/ 08:00:00</em></small></div><button type="button" class="bank-logout-btn" id="logoutTopSession" title="Encerrar sessão"><span>↪</span><b>SAIR</b></button></div>`;
$('#logoutTopSession')?.addEventListener('click',()=>logout('LOGOUT'));
}
 if(remaining<=10*60*1000&&remaining>0&&!sessionWarningShown){sessionWarningShown=true;
alert('Sua sessão expira em 10 minutos. Salve suas alterações.');
}
 if(elapsed>=SESSION_MAX_MS){alert('Sua sessão atingiu o limite máximo de 8 horas e será encerrada. Faça login novamente para iniciar uma nova sessão.');
logout('TIMEOUT_8H');
}
}
function startSessionClock(email=''){if(sessionTimer)clearInterval(sessionTimer);
renderSessionClock(email);
sessionTimer=setInterval(()=>renderSessionClock(email),1000)}
let lastTouchAt=0;
const SESSION_TOUCH_REMOTE_MS=30*60*1000;

/* V10.32 - a sessão continua contando localmente a cada segundo, mas a
   presença remota não precisa gravar a cada troca de aba. Persistimos no
   máximo a cada 30 min; login e logout continuam registrando imediatamente. */
async function touchSession(force=false){
 if(!currentUser||!currentSessionId)return;

 if(!force&&Date.now()-lastTouchAt<SESSION_TOUCH_REMOTE_MS)return;

 lastTouchAt=Date.now();

 try{await setDoc(doc(db,'highos','data','sessoes_usuario',currentSessionId),{lastActivityAt:serverTimestamp(),
lastActivityText:new Date().toISOString()},{merge:true})}catch(e){}
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')touchSession()});

window.addEventListener('beforeunload',()=>{try{if(currentUser&&currentSessionId)localStorage.setItem(sessionStorageKey(currentUser.email),JSON.stringify({id:currentSessionId,
start:currentSessionStart,
email:currentUser.email}))}catch(e){}});

$('#loginBtn').onclick=login;
$('#loginBtnCard').onclick=login;
$('#logoutBtn')?.addEventListener('click',()=>logout('LOGOUT'));
$('#logoutDenied').onclick=()=>logout('LOGOUT');

const METRIC_ONLY_ROLES=new Set(['RH_METRICAS',
'RH_VISUALIZADOR',
'RH_ANALISTA',
'RH_GESTOR']);

// ===== HIGH OS V8.18 · PERMISSÕES GRANULARES POR MÓDULO =====
const SYSTEM_MODULES=[
 {id:'dashboard',
label:'Dashboard',
desc:'Visão geral e indicadores'},

 {id:'faccoes',
label:'Organizações',
desc:'Group permanente, ocupação, divulgação, entrega, estrutura, rota e histórico'},

 {id:'solicitacoes',
label:'Solicitações',
desc:'Modelos e solicitações técnicas'},

 {id:'metricas',
label:'Métricas',
desc:'Central de métricas e relatórios'},

 {id:'economia',
label:'Economia',
desc:'Tabela, pista e referências econômicas'},

 {id:'historico',
label:'Histórico',
desc:'Movimentações e auditoria operacional'},

 {id:'diario',
label:'Diário Operacional',
desc:'Cronograma, eventos, reuniões, doações, benefícios e relatórios'},

 {id:'planejador',
label:'Planejador de Missões',
desc:'Mapa GTA V, spawns, áreas e distribuição de equipes'},

 {id:'alvesinho',
label:'Alvesinho',
desc:'Assistente do High OS'},

 {id:'chat',
label:'Chat da Equipe',
desc:'Mensagens internas entre usuários logados'},

 {id:'spotify',
label:'Spotify',
desc:'Player de música integrado ao High OS'}
];

const INTERNAL_MODULE_PARENT={'planejador-acoes':'economia',
'group-profile':'faccoes',
'group-settings':'faccoes',
'organizacoes':'faccoes',
'org-profile':'faccoes',
'disponiveis':'faccoes',
'qgs':'faccoes',
'receitas':'faccoes',
'metas':'faccoes',
'metas':'faccoes',
'entregas':'faccoes'};

function normalizePermission(v){v=String(v||'').toUpperCase();
return ['NONE',
'VIEW',
'EDIT'].includes(v)?v:'NONE'}
function defaultPermissionsForRole(role='CONSULTA'){
 role=String(role||'CONSULTA').toUpperCase();
const out={};

 if(role==='ADMIN'){SYSTEM_MODULES.forEach(m=>out[m.id]='EDIT');
return out}
 if(METRIC_ONLY_ROLES.has(role)){SYSTEM_MODULES.forEach(m=>out[m.id]=m.id==='metricas'?'VIEW':'NONE');
out.dashboard='VIEW';
return out}
 if(role==='CONSULTA'){SYSTEM_MODULES.forEach(m=>out[m.id]='VIEW');
return out}
 SYSTEM_MODULES.forEach(m=>out[m.id]=m.id==='historico'?'VIEW':'EDIT');
return out
}
function effectivePermissions(profile=currentProfile){const role=String(profile?.role||'CONSULTA').toUpperCase();
if(role==='ADMIN')return defaultPermissionsForRole('ADMIN');
const base=defaultPermissionsForRole(role),
custom=profile?.permissions||{};
SYSTEM_MODULES.forEach(m=>{if(Object.prototype.hasOwnProperty.call(custom,m.id))base[m.id]=normalizePermission(custom[m.id])});
const legacyKeys=['faccoes',
'organizacoes',
'disponiveis',
'entregas'],
legacyOwn=legacyKeys.filter(k=>Object.prototype.hasOwnProperty.call(custom,k)).map(k=>normalizePermission(custom[k]));
if(legacyOwn.length){base.faccoes=legacyOwn.includes('EDIT')?'EDIT':legacyOwn.includes('VIEW')?'VIEW':'NONE'}return base}
function pageModule(page=''){return INTERNAL_MODULE_PARENT[page]||page}
function canViewModule(module){if(isAdmin())return true;
return ['VIEW',
'EDIT'].includes(effectivePermissions()[pageModule(module)]||'NONE')}
function canEditModule(module){if(isAdmin())return true;
return (effectivePermissions()[pageModule(module)]||'NONE')==='EDIT'}
function firstAllowedModule(){return SYSTEM_MODULES.find(m=>!['solicitacoes','economia','alvesinho','spotify','chat'].includes(m.id)&&canViewModule(m.id))?.id||''}
function applyModuleAccess(role='CONSULTA'){
 const perms=effectivePermissions();
document.body.classList.toggle('metric-only-access',false);

 document.querySelectorAll('.nav-item').forEach(btn=>{
  const page=btn.dataset.page;
  const visivel=btn.classList.contains('admin-only')?isAdmin():canViewModule(page);
  // O tema Prime aplica display:flex!important. Inline normal não ocultava os módulos.
  btn.style.setProperty('display',visivel?'flex':'none','important');
 });

 const active=document.querySelector('.page.active')?.id?.replace('page-','')||'dashboard';
if(!isAdmin()&&!canViewModule(active)){const first=firstAllowedModule();
if(first)activateAppPage(first)}
 document.body.dataset.accessMode='custom';

}
function mutationButton(btn){if(!btn)return false;
const txt=String(btn.textContent||'').trim().toUpperCase();
if(btn.matches('[type="submit"],.btn-danger,.admin-wipe,.tech-remove'))return true;
return /(^|\s)(SALVAR|NOVO|NOVA|CRIAR|EDITAR|APAGAR|REMOVER|RECOLHER|TRANSFERIR|TROCAR|IMPORTAR|CONCLUIR|VINCULAR|RESET|ADICIONAR|ALTERAR|ATIVAR|DESATIVAR|REATIVAR)(\s|$)/.test(txt)}
function moduleForElement(el){const page=el?.closest?.('.page');
if(page)return pageModule(page.id.replace('page-',''));
const modal=el?.closest?.('.modal')?.id||'';
const map={facModal:'faccoes',
recipeEditorModal:'faccoes',
farmEditorModal:'faccoes',
movementModal:'faccoes',
newDeliveryModal:'faccoes',
reqModal:'solicitacoes',
craftRequestModal:'faccoes',
metricSourceModal:'metricas',
metricImportModal:'metricas',
orgModal:'faccoes',
userModal:'administracao',
auditSessionModal:'administracao',
facSheetDiffModal:'administracao'};
return map[modal]||pageModule(document.querySelector('.page.active')?.id?.replace('page-','')||'dashboard')}
function permissionDeniedMessage(module,edit=false){const label=SYSTEM_MODULES.find(m=>m.id===pageModule(module))?.label||module;
alert(edit?`Seu acesso a ${label} é somente para visualização.\n\nSolicite a um ADMIN permissão de edição.`:`Você não possui acesso ao módulo ${label}.`)}
document.addEventListener('click',e=>{const nav=e.target.closest?.('.nav-item[data-page]');if(nav&&((nav.classList.contains('admin-only')&&!isAdmin())||(!nav.classList.contains('admin-only')&&!canViewModule(nav.dataset.page)))){e.preventDefault();e.stopImmediatePropagation();permissionDeniedMessage(nav.dataset.page,false);return}const b=e.target.closest?.('button');if(!b||isAdmin())return;const mod=moduleForElement(b);if(mutationButton(b)&&!canEditModule(mod)){e.preventDefault();e.stopImmediatePropagation();permissionDeniedMessage(mod,true)}},true);

document.addEventListener('submit',e=>{if(isAdmin())return;const mod=moduleForElement(e.target);if(!canEditModule(mod)){e.preventDefault();e.stopImmediatePropagation();permissionDeniedMessage(mod,true)}},true);

/* =====================================================================
   HIGH OS V9.8 - LEITURA DO CADASTRO COM DIAGNOSTICO
   Tenta o e-mail em minusculas e depois exatamente como o Google devolveu.
   Quando falha, diz o PORQUE na tela, em vez do texto generico de sempre.
   ===================================================================== */
async function highOsDiscordWriteSelfTest(){
 if(!currentUser)return {ok:false,reason:'no-user'};
 const id='web-'+Date.now()+'-'+Math.random().toString(36).slice(2,8);
 const payload={kind:'HIGH_OS_WEB_WRITE_TEST',nonce:id,createdAt:new Date().toISOString(),email:String(currentUser.email||'').toLowerCase()};
 try{
  await highOsStorePut('_selftest',id,payload);
  const back=await highOsStoreGet('_selftest',id);
  const ok=back?.kind===payload.kind&&back?.nonce===payload.nonce&&back?.email===payload.email;
  await highOsStoreDelete('_selftest',id).catch(()=>{});
  console.log('[HIGH OS][DISCORD SELFTEST]',{ok,id,source:'WEB',roundTrip:true});
  return {ok,id,roundTrip:true};
 }catch(error){
  console.error('[HIGH OS][DISCORD SELFTEST] FALHOU',error);
  return {ok:false,id,error:error.message||String(error)};
 }
}

/* V15.6.3: o Planejador de Missões (~360 KB) só é baixado quando a página dele é aberta. */
let planejadorCarregando=null;
function carregarScriptUnico(src){return new Promise((ok,er)=>{const s=document.createElement('script');s.src=src;s.onload=()=>ok();s.onerror=()=>er(new Error('falha ao carregar '+src));document.body.appendChild(s)})}
/* V15.6.3: html2canvas (~200 KB) só é baixado na primeira captura de imagem. */
let html2canvasCarregando=null;
function carregarHtml2canvas(){if(window.html2canvas)return Promise.resolve();return html2canvasCarregando||=carregarScriptUnico('assets/vendor/html2canvas.min.js?v=1.4.1').catch(e=>{html2canvasCarregando=null;throw e});}
window.HighCarregarHtml2canvas=carregarHtml2canvas;
function carregarPlanejadorMissoes(){
 if(window.HighMissionPlanner)return Promise.resolve();
 return planejadorCarregando||=carregarScriptUnico('assets/modules/eventos-painel.js?v=12.17.0')
  .then(()=>carregarScriptUnico('assets/mission-planner.js?v=12.18.3'))
  .then(()=>carregarScriptUnico('assets/mission-planner-nav.js?v=12.8.1'))
  .catch(e=>{planejadorCarregando=null;throw e});
}
async function carregarCadastro(user){
 const email=String(user.email||'').trim().toLowerCase();
 try{
  let dados=null;
  try{dados=await highOsStoreGet('users',email)}catch{}
  if(!dados){
   const users=await highOsStoreList('users');
   dados=users.find(x=>String(x.email||x.id||'').trim().toLowerCase()===email)||null;
  }
  if(!dados)return {ok:false,explicacao:'<b>'+esc(email)+'</b> foi autenticado no Google, mas não possui cadastro no High OS Discord.'};
  if(dados.active!==true)return {ok:false,explicacao:'<b>'+esc(email)+'</b> está cadastrado, mas o acesso está inativo.'};
  return {ok:true,snap:{data:()=>dados},id:String(dados.id||email)};
 }catch(e){
  // NUNCA usar fallback quando o servidor recusou acesso. Apenas falhas reais de rede.
  const mensagem=String(e?.message||e||'');
  const erroRede=e instanceof TypeError||/failed to fetch|networkerror|load failed|fetch failed|connection refused|err_connection/i.test(mensagem);
  if(erroRede){
   const tentativas=[email,String(user.email||'').trim()].filter((x,i,a)=>x&&a.indexOf(x)===i);
   for(const id of tentativas){
    try{
     const cadastro=await getDoc(doc(db,'users',id));
     if(!cadastro.exists())continue;
     const dados=cadastro.data()||{};
     if(dados.active!==true)continue;
     // Sem ampliar permissões do cadastro antigo; nenhuma permissão de edição.
     const padrao=defaultPermissionsForRole(dados.role);
     const permissoes=Object.fromEntries(SYSTEM_MODULES.map(m=>{
      const valor=Object.prototype.hasOwnProperty.call(dados.permissions||{},m.id)
       ? normalizePermission(dados.permissions[m.id]) : normalizePermission(padrao[m.id]);
      return [m.id,valor==='NONE'?'NONE':'VIEW'];
     }));
     highOsEmergencyReadOnly=true;
     const perfil={...dados,role:'CONSULTA',cargo:'CONTINGÊNCIA • LEITURA',permissions:permissoes};
     return {ok:true,id,emergency:true,snap:{data:()=>perfil}};
    }catch(erroFirebase){
     console.warn('[HIGH OS] Cadastro de contingência não validado:',erroFirebase?.code||erroFirebase);
    }
   }
   return {ok:false,explicacao:'O servidor Discord está offline e não foi possível validar um cadastro ativo no Firebase para contingência. O acesso permanece bloqueado.'};
  }
  /* Bot recém-ligado/atualizado: ainda lendo o canal 💾 storage. Não é acesso negado. */
  if(/storage_loading|discord_not_ready/i.test(mensagem))return {ok:false,carregando:true,explicacao:'O bot do High OS acabou de ligar e ainda está carregando os dados do Discord.'};
  return {ok:false,explicacao:'Falha ao consultar seu cadastro no High OS Discord: <b>'+esc(mensagem)+'</b>'};
 }
}

onAuthStateChanged(auth,async user=>{
 currentUser=user;
 if(!user){highOsEmergencyReadOnly=false;show(loginView);sessionArea.innerHTML='<button class="btn-google" id="loginTop">G&nbsp; Entrar com Google</button>';$('#loginTop').onclick=login;return}
 const email=(user.email||'').toLowerCase();
 try{
  /* V9.8 - o cadastro pode ter sido criado com o e-mail em outra caixa
     (High@... , HIGH@...). Antes so tentavamos a versao minuscula e o
     usuario ficava trancado para fora sem saber o motivo. */
  let perfil=await carregarCadastro(user);
  /* storage_loading: espera o bot terminar de carregar (até ~3 min) em vez de negar o acesso */
  const tituloNegado=deniedView.querySelector('h2'),tituloOriginal=tituloNegado?.textContent||'ACESSO NÃO AUTORIZADO';
  for(let i=1;!perfil.ok&&perfil.carregando&&i<=36;i++){
   show(deniedView);if(tituloNegado)tituloNegado.textContent='BOT INICIANDO';
   $('#deniedText').innerHTML=esc(perfil.explicacao)+'<br><small>Tentando de novo automaticamente… ('+i+')</small>';
   await new Promise(r=>setTimeout(r,5000));if(currentUser!==user)return;
   perfil=await carregarCadastro(user);
  }
  if(tituloNegado)tituloNegado.textContent=tituloOriginal;
  if(!perfil.ok){
   show(deniedView);
   $('#deniedText').innerHTML=perfil.explicacao;
   sessionArea.innerHTML=`<span class="top-email">${esc(email)}</span><button class="mini-btn" id="logoutTop">Sair</button>`;
   $('#logoutTop').onclick=()=>logout('LOGOUT');
   return;
  }
  const snap=perfil.snap;
  currentProfile=snap.data();const role=String(currentProfile.role||'CONSULTA').toUpperCase();await startOrResumeSession(user,currentProfile);if(Date.now()-currentSessionStart>=SESSION_MAX_MS)return;show(appView);
  if(highOsEmergencyReadOnly){
   entrarModoLocal('Bot do High OS (PC) indisponível');
   const aviso=document.createElement('div');
   aviso.id='highOsEmergencyReadOnlyNotice';
   aviso.setAttribute('role','status');
   aviso.style.cssText='padding:10px 14px;margin:0 0 16px;background:#221c10;border:1px solid #8d682a;border-radius:10px;color:#ffe2a0;line-height:1.5;font-size:12px';
   aviso.textContent='CONTINGÊNCIA • SOMENTE LEITURA: cadastro validado no Firebase. Dados do Discord indisponíveis; informações em cache podem estar desatualizadas. Nenhuma alteração será gravada até a API voltar.';
   // .app é uma grid de duas colunas (sidebar + conteúdo).
   // O aviso precisa ficar DENTRO do conteúdo, não como terceira coluna.
   appView.querySelector('.content')?.prepend(aviso);
  }else{
   setTimeout(()=>highOsDiscordWriteSelfTest().then(r=>{if(!r.ok)console.warn('[HIGH OS] autoteste Discord falhou sem bloquear o painel',r)}),800);
  }
  const userNameEl=$('#userName'),
userRoleEl=$('#userRole'),
userAccessEl=$('#userAccessLevel'),
dashEmailEl=$('#dashEmail'),
dashRoleEl=$('#dashRole'),
userPhotoEl=$('#userPhoto');
  if(userNameEl)userNameEl.textContent=currentProfile.name||user.displayName||email;if(userRoleEl)userRoleEl.textContent=currentProfile.cargo||role;if(userAccessEl)userAccessEl.textContent='ACESSO: '+role;if(dashEmailEl)dashEmailEl.textContent=email;if(dashRoleEl)dashRoleEl.textContent=role;
  if(userPhotoEl){if(user.photoURL){userPhotoEl.src=user.photoURL;userPhotoEl.style.display=''}else userPhotoEl.style.display='none';}
  document.querySelectorAll('.admin-only').forEach(el=>el.style.setProperty('display',role==='ADMIN'?'flex':'none','important'));
  applyModuleAccess(role);
  renderSessionClock(email);
  const initialPage=document.querySelector('.page.active')?.id?.replace('page-','')||'';
  const needsSegments=['dashboard','metricas','faccoes','organizacoes','disponiveis','entregas','group-profile','group-settings','org-profile'].includes(initialPage);
  if(needsSegments)await loadSegmentConfig();
  if(initialPage==='dashboard')await loadDashboardConfig();
  await iniciarSeason();
  renderSeasonTopo();
  await iniciarFila();
  if(needsSegments&&(!highOsEmergencyReadOnly||canViewModule('faccoes'))){
   try{await loadFaccoes()}catch(e){
    if(!highOsEmergencyReadOnly)throw e;
    console.warn('[HIGH OS] Facções indisponíveis na contingência; painel continua aberto:',e?.message||e);
   }
  }
  if(['dashboard','metricas'].includes(initialPage)){
   try{await loadMetrics()}catch(e){
    console.warn('[HIGH OS] métricas indisponíveis no boot; painel seguirá carregando:',e?.message||e);
   }
  }
  /* V10.62 - recuperação periódica de métricas inicia apenas quando
     Dashboard/Métricas estiverem ativos; não cria timer global no login. */
  /* V10.61 - módulos não essenciais deixam de consumir Firestore no login.
     Spotify e Usuários carregam somente quando a respectiva tela é aberta. */
  if(canViewModule('chat'))$('#teamChatLauncher')?.classList.remove('hidden');
 }catch(e){
  show(deniedView);
  $('#deniedText').innerHTML=`Falha ao carregar o painel: <b>${esc(e.code||'')}</b> ${esc(e.message||String(e))}`+
   `<br><br><span style="font-size:12px;opacity:.85">O login usa Firebase Auth; os dados operacionais são carregados pelo bot do High OS (Discord).</span>`;
  console.error('[HIGH OS] falha no login:',e);
 }
});

/* V10.50 - toda navegacao passa por um unico ciclo de vida.
   Evita caminhos paralelos que ativavam telas sem aplicar cache/timers/permissoes. */
document.querySelectorAll('.nav-item').forEach(btn=>btn.addEventListener('click',()=>activateAppPage(btn.dataset.page)));


let operationalDiaryLoaded=false;
function diaryTodayIso(){
 const p=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const g=t=>p.find(x=>x.type===t)?.value||'';return g('year')+'-'+g('month')+'-'+g('day');
}
function diaryWeekday(date){
 const d=new Date(date+'T12:00:00');return new Intl.DateTimeFormat('pt-BR',{weekday:'long'}).format(d).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace('-feira','');
}
async function loadOperationalDiary(){
 const date=$('#diarioDate')?.value||diaryTodayIso(); if($('#diarioDate')&&!$('#diarioDate').value)$('#diarioDate').value=date;
 try{
  const [records,schedule]=await Promise.all([highOsStoreList('diario_operacional'),highOsStoreList('cronograma_operacional')]);
  const rows=records.filter(x=>String(x.date||'')===date).sort((a,b)=>String(a.time||'').localeCompare(String(b.time||'')));
  const day=diaryWeekday(date),agenda=schedule.filter(x=>x.active!==false&&String(x.day||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')===day).sort((a,b)=>String(a.time||'').localeCompare(String(b.time||'')));
  const count=t=>rows.filter(x=>x.type===t).length;
  $('#diarioAgendaCount').textContent=agenda.length;$('#diarioDoneCount').textContent=rows.length;
  $('#diarioStats').innerHTML=[
   ['ATIVIDADES',rows.length],['EVENTOS',count('evento')],['REUNIÕES',count('reuniao')],['DOAÇÕES / SORTEIOS',count('doacao')],['BENEFÍCIOS / BLINDADOS',count('beneficio')]
  ].map(x=>`<div class="stat-card"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('');
  $('#diarioAgenda').innerHTML=agenda.length?agenda.map(x=>{const done=rows.find(r=>r.scheduleName===x.name&&r.scheduleTime===x.time);return `<article class="history-item"><div><b>${esc(x.time||'—')} • ${esc(x.name||'Atividade')}</b><p>${esc(String(x.type||'geral').toUpperCase())} • aviso automático ${Number(x.alertMinutes??15)} min antes${done?' • finalizado por '+esc(done.createdByName||'staff'):''}</p></div><span class="status-chip ${done?'ativa':''}">${done?'FINALIZADO':'AGENDADO'}</span></article>`}).join(''):`<div class="placeholder"><b>▦</b><h3>SEM ATIVIDADES EXTRAS</h3><p>O cronograma padrão continua sendo monitorado pelo bot.</p></div>`;
  $('#diarioList').innerHTML=rows.length?rows.map(x=>`<article class="history-item"><div><b>${esc(x.time||'—')} • ${esc(x.title||'Registro')}</b><p>${esc(String(x.type||'geral').toUpperCase())}${x.winner?' • Vencedor/beneficiado: '+esc(x.winner):''}${x.prize?' • '+esc(x.prize):''}${x.quantity?' • Qtd. '+esc(x.quantity):''}${x.createdByName?' • Registrado por '+esc(x.createdByName):''}</p>${x.result?`<small>${esc(x.result)}</small>`:''}</div><span class="status-chip ativa">FINALIZADO</span></article>`).join(''):`<div class="placeholder"><b>◷</b><h3>SEM REGISTROS NESTA DATA</h3><p>Use /highos registrar no Discord para lançar o realizado.</p></div>`;
  operationalDiaryLoaded=true;
 }catch(e){
  $('#diarioList').innerHTML=`<div class="placeholder"><h3>ERRO AO CARREGAR</h3><p>${esc(e.message||String(e))}</p></div>`;
 }
}
$('#diarioRefresh')?.addEventListener('click',loadOperationalDiary);
$('#diarioToday')?.addEventListener('click',()=>{if($('#diarioDate'))$('#diarioDate').value=diaryTodayIso();loadOperationalDiary()});
$('#diarioDate')?.addEventListener('change',loadOperationalDiary);

// HIGH OS V6.7 · o perfil do Group passa a abrir como página interna, não como modal.
// O planejador só escreve nos campos BUFF/NERF da aba original após uma
// confirmação específica do gestor. Não cria abas nem reescreve fórmulas.
// High OS Dev 15.7 — baseline compartilhado e decisões auditadas.
const ACTION_PRICES_REFERENCE='acoes_precos_referencia_v1';

const ACTION_REGISTRY_DOC='acoes_cadastro_v1';
async function actionReadRegistry(){
 if(!currentUser||!canViewModule('planejador-acoes'))throw Error('Acesso ao Planejador de Ações não autorizado.');
 const snap=await getDoc(doc(db,'highos','data','config',ACTION_REGISTRY_DOC));
 const {cleanRegistry}=await import('./modules/acoes-cadastro.js?v=5');
 return cleanRegistry(snap.exists()?snap.data():null);
}
async function actionMutateRegistry({kind,entry=null,name='',oldName='',expectedRevision}={}){
 // O match /highos/data/config/{outro} das rules atuais permite edição só
 // para ADMIN; nenhuma nova regra Firebase precisa ser publicada.
 if(!currentUser||!isAdmin()||!canEditModule('economia'))throw Error('Cadastro de ações disponível apenas para administrador com acesso à Economia.');
 if(!['save','delete','archive','restore','npc-save','house-run-save'].includes(kind))throw Error('Operação inválida.');
 const {applyRegistryMutation}=await import('./modules/acoes-cadastro.js?v=5');
 const source=await fetch('https://alvesjardimitalo-oss.github.io/high-mercado-negro/data/acoes-blipadas.json',{cache:'no-store'});
 if(!source.ok)throw Error('Não foi possível conferir ações oficiais. Nenhuma alteração aplicada.');
 const published=(await source.json()).acoes||[];
 const ref=doc(db,'highos','data','config',ACTION_REGISTRY_DOC);
 const result=await runTransaction(db,async transaction=>{
  const snap=await transaction.get(ref),before=snap.exists()?snap.data():null;
  if((Number(before?.revision)||0)!==Number(expectedRevision))
   throw Error('O cadastro foi alterado por outro administrador. Atualize a página antes de salvar.');
  const updated=applyRegistryMutation(before,{kind,entry,name,oldName},published);
  transaction.set(ref,{...updated,updatedAt:new Date().toISOString(),updatedBy:currentUser.email});
  return updated;
 });
 try{
  await addDoc(histCol,{tipo:'CADASTRO_ACOES',operacao:kind,
   acao:String(entry?.nome||entry?.market||entry?.label||name||oldName).slice(0,100),
   usuario:currentUser.email,data:serverTimestamp(),revisao:result.revision});
 }catch(err){console.warn('[AÇÕES] Cadastro salvo, mas auditoria histórica indisponível:',err);}
 return result;
}

function actionEconomyAuthorized(){if(!currentUser||!canEditModule('economia'))throw Error('Você não tem permissão de alterar a Economia.');}
async function actionReadReference(){
 if(!currentUser||!canViewModule('planejador-acoes'))return null;
 const data=await highOsStoreGet('config',ACTION_PRICES_REFERENCE).catch(()=>null);
 return data?.snapshot||null;
}
async function actionSaveReference(snapshot){
 actionEconomyAuthorized();
 if(snapshot?.version!==1||!Array.isArray(snapshot?.items)||snapshot.items.length<5||snapshot.items.length>500||
  snapshot.items.some(i=>!i.item||!['ativo','inativo'].includes(i.status)))
  throw Error('Não foi possível validar a lista de preços de referência.');
 await setDoc(doc(db,'highos','data','config',ACTION_PRICES_REFERENCE),{
  snapshot,updatedAt:new Date().toISOString(),updatedBy:currentUser.email
 });
 try{await addDoc(histCol,{tipo:'REFERENCIA_PRECOS_ACOES',usuario:currentUser.email,
  data:serverTimestamp(),qtd: snapshot.items.length,referencia:snapshot.createdAt});}
 catch(e){console.warn('[AÇÕES] Referência salva, auditoria pendente',e)}
 return {saved:true};
}
async function actionRejectProposal({name,oldMin,newMin,reason,team,source}){
 actionEconomyAuthorized();
 if(!name||!Number.isFinite(Number(newMin))||!String(reason||'').trim())
  throw Error('A recusa exige ação, prêmio proposto e uma justificativa.');
 await addDoc(histCol,{tipo:'DECISAO_PREMIACAO_ACAO',decisao:'RECUSADA',acao:name,
  usuario:currentUser.email,novoPremio:Number(newMin),premioAnterior:Number(oldMin),
  invasores:Number(team)||0,origem:source||'simulacao',motivo:String(reason).slice(0,600),
  data:serverTimestamp()});
 return {recorded:true};
}
async function actionReadDecisions(){
 if(!currentUser||!canViewModule('planejador-acoes'))throw Error('Sem permissão.');
 const items=await highOsStoreList('historico');
 return (items||[]).filter(x=>['AJUSTE_PREMIACAO_ACAO','DECISAO_PREMIACAO_ACAO','REFERENCIA_PRECOS_ACOES'].includes(x.tipo))
 .sort((a,b)=>String(b.data||b.createdAt||'').localeCompare(String(a.data||a.createdAt||''))).slice(0,40)
 .map(x=>({tipo:x.tipo,acao:x.acao||'',decisao:x.decisao||'',usuario:x.usuario||'',
  data:x.data||x.createdAt||'',motivo:x.motivo||'',premioMinAnterior:x.premioMinAnterior??x.premioAnterior??null,
  premioMinProposto:x.premioMinProposto??x.novoPremio??null}));
}
async function actionReadSheetPrizes(){
 actionEconomyAuthorized();
 const token=await facSheetAuthorize();
 const root='https://sheets.googleapis.com/v4/spreadsheets/'+DLV_VIP_SHEET_ID;
 const range=encodeURIComponent("'VALORES AÇÃO BLIPADA'!A1:AD400");
 const [{extractPublishedActionPrizes},response]=await Promise.all([
  import('./modules/acoes-sheet-sync.js?v=3'),
  facSheetFetch(root+'/values/'+range+'?valueRenderOption=UNFORMATTED_VALUE',{token})
 ]);
 const prizes=extractPublishedActionPrizes(response.values||[]);
 if(!prizes.length)throw Error('Não encontrei prêmios válidos na aba VALORES AÇÃO BLIPADA.');
 return {prizes,readAt:new Date().toISOString()};
}
async function syncApprovedActionPayout({name,officialMin,officialMax,proposedMin,proposedMax,team,cost,tax,winChance,reason='',source='sugestao'}){
 if(!currentUser||!canEditModule('economia'))throw Error('Sem permissão de edição de Economia.');
 const value=Number(proposedMin);
 if(!Number.isFinite(value)||value<=0)throw Error('Não há prêmio sugerido válido.');
 const token=await facSheetAuthorize();
 const root='https://sheets.googleapis.com/v4/spreadsheets/'+DLV_VIP_SHEET_ID;
 const range=encodeURIComponent("'VALORES AÇÃO BLIPADA'!A1:AD400");
 const [{planApprovedActionSheetUpdate},first,originalFormulas]=await Promise.all([
   import('./modules/acoes-sheet-sync.js?v=2'),
   facSheetFetch(root+'/values/'+range+'?valueRenderOption=UNFORMATTED_VALUE',{token}),
   facSheetFetch(root+'/values/'+range+'?valueRenderOption=FORMULA',{token})
 ]);
 const candidate=planApprovedActionSheetUpdate(first.values||[],name,officialMin,value,
  {officialMax,proposedMax});
 // A leitura utiliza o nome da aba, mas a gravação usa o sheetId.
 // Uma aba recriada com outro ID não pode causar escrita em um lugar errado.
 const sheetInfo=await facSheetFetch(root+'?fields=sheets.properties(sheetId,title)',{token});
 const sheetEntry=(sheetInfo.sheets||[]).find(x=>x.properties?.title===candidate.sheetName);
 if(!sheetEntry||Number(sheetEntry.properties.sheetId)!==candidate.sheetId)
  throw Error('O identificador da aba VALORES AÇÃO BLIPADA mudou. Nenhuma célula foi alterada; confira o GID.');
 const formulaRows=originalFormulas.values||[];
 for(const cell of [candidate.buff,candidate.nerf]){
  const input=formulaRows[cell.rowIndex]?.[cell.columnIndex];
  if(typeof input==='string'&&input.startsWith('='))
   throw Error('A aba contém uma fórmula no BUFF/NERF. Alteração interrompida para preservar a planilha.');
 }
 const proposal='AÇÃO: '+name+'\nINVASORES: '+team+
 '\nPrêmio mínimo atual (sujo): '+Math.round(candidate.previousMin).toLocaleString('pt-BR')+
 '\nPrêmio máximo atual (sujo): '+Math.round(candidate.previousMax).toLocaleString('pt-BR')+
 '\nNovo prêmio mínimo proposto (sujo): '+value.toLocaleString('pt-BR')+
 '\nNovo prêmio máximo INDICATIVO (sujo): '+Math.round(candidate.proposedMax).toLocaleString('pt-BR')+
 '\nVariação: '+candidate.delta.toLocaleString('pt-BR')+
 '\nBUFF: '+candidate.oldBuff+' → '+candidate.nextBuff+
 '\nNERF: '+candidate.oldNerf+' → '+candidate.nextNerf+
 '\n\nO máximo é recalculado por FÓRMULA: a estimativa acima NÃO é uma edição direta do valor máximo. Confirmo a alteração dos ajustes de BUFF/NERF na aba VALORES AÇÃO BLIPADA?';
 if(!confirm(proposal))return {cancelled:true};
 // A confirmação pode levar tempo: validar novamente as células antes do POST.
 const fresh=await facSheetFetch(root+'/values/'+range+'?valueRenderOption=UNFORMATTED_VALUE',{token});
 const checked=planApprovedActionSheetUpdate(fresh.values||[],name,officialMin,value,{officialMax,proposedMax});
 if(checked.buff.rowIndex!==candidate.buff.rowIndex||
    checked.buff.columnIndex!==candidate.buff.columnIndex||
    checked.nerf.rowIndex!==candidate.nerf.rowIndex||
    checked.nerf.columnIndex!==candidate.nerf.columnIndex||
    checked.oldBuff!==candidate.oldBuff||checked.oldNerf!==candidate.oldNerf||
    Math.abs(checked.previousMin-candidate.previousMin)>.01||
    Math.abs(checked.previousMax-candidate.previousMax)>.01||
    checked.max.rowIndex!==candidate.max.rowIndex||checked.max.columnIndex!==candidate.max.columnIndex)
  throw Error('A planilha foi alterada durante a confirmação. Nenhuma alteração aplicada; refaça a análise.');
 // Reconfere fórmulas após a aprovação do gestor e antes da gravação.
 const latestFormulas=await facSheetFetch(root+'/values/'+range+'?valueRenderOption=FORMULA',{token});
 for(const cell of [checked.buff,checked.nerf]){
  const input=latestFormulas.values?.[cell.rowIndex]?.[cell.columnIndex];
  if(typeof input==='string'&&input.startsWith('='))
   throw Error('BUFF/NERF recebeu uma fórmula durante a confirmação. Nenhuma célula foi alterada.');
 }
 const updates=[['buff',checked.nextBuff],['nerf',checked.nextNerf]].map(([key,num])=>({
   updateCells:{start:{sheetId:checked.sheetId,rowIndex:checked[key].rowIndex,columnIndex:checked[key].columnIndex},
     rows:[{values:[{userEnteredValue:{numberValue:num}}]}],fields:'userEnteredValue'}
 }));
 await facSheetFetch(root+':batchUpdate',{method:'POST',body:{requests:updates},token});
 const after=await facSheetFetch(root+'/values/'+range+'?valueRenderOption=UNFORMATTED_VALUE',{token});
 const pos=checked.min;
 const calculatedMinimum=Number(after.values?.[pos.rowIndex]?.[pos.columnIndex]);
 const calculatedMaximum=Number(after.values?.[checked.max.rowIndex]?.[checked.max.columnIndex]);
 const verifiedMaximum=Number.isFinite(calculatedMaximum)&&
  Math.abs(calculatedMaximum-checked.proposedMax)<=Math.max(2,Math.abs(checked.proposedMax)*.005);
 const verified=Number.isFinite(calculatedMinimum)&&Math.abs(calculatedMinimum-value)<2;
 const {extractPublishedActionPrizes}=await import('./modules/acoes-sheet-sync.js?v=3');
 const actual=extractPublishedActionPrizes(after.values||[]).find(x=>
  x.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase()===
  name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase());
 let audited=false;
 try{
  await addDoc(histCol,{tipo:'AJUSTE_PREMIACAO_ACAO',usuario:currentUser.email,
   acao:name,grupo:'ECONOMIA_ILEGAL',invasores:team,custoKit:cost,
   taxaLavagem:tax,winChanceAssumida:Number.isFinite(winChance)?winChance:null,
   premioMinAnterior:checked.previousMin,premioMaxAnterior:checked.previousMax,
   premioMinProposto:value,premioMaxEstimado:checked.proposedMax,
   premioMaxConfirmado:Number.isFinite(calculatedMaximum)?calculatedMaximum:null,
   buffAnterior:checked.oldBuff,nerfAnterior:checked.oldNerf,
   buffNovo:checked.nextBuff,nerfNovo:checked.nextNerf,
   origem:source,motivo:String(reason).slice(0,600),
   planilha:'VALORES AÇÃO BLIPADA',data:serverTimestamp()});
  audited=true;
 }catch(error){console.warn('[AÇÕES] Atualização feita, mas falha ao registrar auditoria:',error)}
 return {updated:true,verified,verifiedMaximum,audited,previous:checked.previousMin,
  previousMax:checked.previousMax,next:value,estimatedMax:checked.proposedMax,
  actualMin:verified&&actual?actual.min:null,actualMax:verified&&actual?actual.max:null,
  actualBuff:verified&&actual?actual.buff:null,actualNerf:verified&&actual?actual.nerf:null,
  publicationPending:true};
}

function activateAppPage(page){
 if(page!=='administracao'&&page!=='usuarios'&&!isAdmin()&&!canViewModule(page)){permissionDeniedMessage(page,false);
const fallback=firstAllowedModule();
if(!fallback||fallback===page)return;
page=fallback}
 if(page==='administracao'&&isAdmin())setTimeout(()=>loadUserAudit(),0);
if(page==='usuarios'&&isAdmin())setTimeout(()=>loadUsers(),0);
if(['dashboard','metricas','faccoes','organizacoes','disponiveis','entregas','group-profile','group-settings','org-profile'].includes(page))setTimeout(()=>loadSegmentConfig(),0);
if(page==='dashboard')setTimeout(()=>loadDashboardConfig(),0);
if(page==='economia')setTimeout(()=>loadMarketCatalog(),0);
if(page==='solicitacoes')setTimeout(()=>loadRequests(),0);
if(page==='diario')setTimeout(()=>loadOperationalDiary(),0);
if(page==='qgs')setTimeout(async()=>{try{if(!faccoesLoaded)await loadFaccoes()}catch(e){}renderQgs()},0);
if(page==='metas')setTimeout(async()=>{try{if(!faccoesLoaded)await loadFaccoes()}catch(e){}renderMetas()},0);
if(page==='receitas')setTimeout(async()=>{await carregarCatalogo();renderCatalogo()},0);
if(page==='metas')setTimeout(async()=>{try{if(!faccoesLoaded)await loadFaccoes()}catch(e){}renderMetas()},0);
if(['dashboard','metricas','faccoes','organizacoes','disponiveis','entregas','group-profile','group-settings','org-profile'].includes(page)&&!faccoesLoaded)setTimeout(()=>loadFaccoes().catch(e=>console.warn('[FACÇÕES] lazy-load falhou',e)),0);
if(['dashboard','metricas'].includes(page)&&!metricsLoaded)setTimeout(async()=>{try{if(!faccoesLoaded)await loadFaccoes();await loadMetrics()}catch(e){console.warn('[MÉTRICAS] lazy-load falhou',e)}},0);
if(page==='planejador')carregarPlanejadorMissoes().then(()=>setTimeout(()=>window.HighMissionPlanner?.activate?.(),60)).catch(err=>{console.error('[PLANEJADOR]',err);const box=document.querySelector('#page-planejador');if(box)box.insertAdjacentHTML('afterbegin','<div class="placeholder"><h3>NÃO FOI POSSÍVEL CARREGAR O PLANEJADOR</h3><p>Recarregue a página.</p></div>')});
if(page==='planejador-acoes')import('./modules/acoes-planejador-ui.js?v=28').then(mod=>mod.mountActionPlanner({
 onApproveAction:canEditModule('economia')?syncApprovedActionPayout:null,
 onReadReference:actionReadReference,onSaveReference:canEditModule('economia')?actionSaveReference:null,
 onRejectAction:canEditModule('economia')?actionRejectProposal:null,
 onReadDecisions:actionReadDecisions,onReadSheet:canEditModule('economia')?actionReadSheetPrizes:null,
 onReadRegistry:actionReadRegistry,onMutateRegistry:isAdmin()&&canEditModule('economia')?actionMutateRegistry:null
})).catch(err=>{console.error('[PLANEJADOR DE AÇÕES]',err);const root=document.querySelector('#actionEconomyPlanner');if(root)root.textContent='Não foi possível carregar o Planejador de Ações: '+(err?.message||String(err));});

 document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id==='page-'+page));

 document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.page===page));

 /* V10.50 - trabalhos periodicos caros so ficam ativos nas telas que os usam.
    Dashboard e Metricas podem consumir a atualizacao economica; demais telas
    encerram o timer imediatamente. Ao voltar, o cache/TTL continua valendo. */
 try{
  if(['dashboard','metricas'].includes(page)){
   startMetricAutoRecovery();
   startMetricRealtime();
  }else{
   stopMetricAutoRecovery();
   stopMetricRealtime();
  }
 }catch(e){console.warn('[HIGH OS] ciclo de vida da pagina',e)}
 try{window.scrollTo({top:0,
behavior:'smooth'})}catch{}
}
function showGroupProfilePage(f){
 const card=$('#facModal .fac-modal-card-wide')||$('.fac-modal-card-wide');

 const mount=$('#groupProfileMount');

 if(card&&mount&&card.parentElement!==mount){mount.appendChild(card);
card.classList.add('profile-page-card')}
 $('#groupProfilePageTitle').textContent=f?.group||'GROUP';

 $('#groupProfilePageSubtitle').textContent=[f?.qg||'QG sem nome',
f?.faccao?`Ocupante: ${f.faccao}`:'Group vago'].join(' • ');

 const st=$('#groupProfilePageStatus');
if(st)st.innerHTML=`<span class="status-chip ${(f?.status||'INATIVA').toLowerCase()}">${esc(f?.status==='ATIVA'?'OCUPADO':'VAGO')}</span>`;

 activateAppPage('group-profile');

}
function closeGroupProfilePage(){activateAppPage('faccoes')}
$('#groupProfileBack')?.addEventListener('click',closeGroupProfilePage);

// Recuperação única: as CDS enviadas para a Mecânica 02 não foram persistidas
// pelo antigo fluxo de entrega. Nunca substitui coordenadas já cadastradas.
async function recuperarTelaoIlegalMechanic02(facList=[]){
 if(!currentUser||String(currentProfile?.role||'').toUpperCase()!=='ADMIN')return false;
 const f=facList.find(x=>String(x.group||'').toLowerCase()==='ilegalmechanic02');
 if(!f||f.recuperacaoTelao20261020)return false;
 const b=f.beneficios||{},p=f.perfilTecnico||{},o=p.operacional||{},t=o.telao||{};
 const registros=[b.telaoNome,b.telaoPostit,b.telaoCds,
  ...[1,2,3,4].map(i=>b['telaoCaixa'+i]),...(b.telaoSons||[]),
  t.modelo,t.postit,t.cds,...(t.sons||[])];
 if(registros.some(v=>String(v||'').trim()))return false;
 const sons=['-226.37,-1299.58,31.36,223.94','-215.9,-1291.34,31.29,201.26',
  '-153.71,-1293.34,31.29,102.05','-158.59,-1316.05,32.3,70.87'];
 const telao={ativo:true,tipo:'Hall',modelo:'paradise_telao01a',
  postit:'-220.95,-1294.61,33.65',cds:'-221.01,-1295.35,31.29,223.94',
  permissao:f.group,sons};
 const beneficios={...b,telao:true,telaoNome:telao.modelo,
  telaoPostit:telao.postit,telaoCds:telao.cds,telaoSons:[...sons],
  ...Object.fromEntries(sons.map((v,i)=>['telaoCaixa'+(i+1),v]))};
 const perfilTecnico={...p,operacional:{...o,telao}};
 await setDoc(doc(db,'highos','data','faccoes',idFac(f.group)),{
  beneficios,perfilTecnico,recuperacaoTelao20261020:true,
  updatedAt:serverTimestamp(),updatedBy:currentUser.email});
 Object.assign(f,{beneficios,perfilTecnico,recuperacaoTelao20261020:true});
 return true;
}

let faccoesLoaded=false,faccoesLoadPromise=null,faccoesEmergencyError='';
async function loadFaccoes(){
 if(faccoesLoadPromise)return faccoesLoadPromise;
 faccoesLoadPromise=(async()=>{
  try{
   /* Facções usam o Discord como fonte operacional. O cache curto de 15s
      evita rajadas de GET sem esconder alterações por longos períodos. */
   const qs=await getDocsCached(facCol,'faccoes',{ttl:15000});
   // Persiste uma única vez a solicitação no cadastro, em sessão ADMIN.
   // Se o Firestore recusar a gravação, não mascara o erro criando dados falsos na interface.
   let currentSnapshot=qs;
   if(String(currentProfile?.role||'').toUpperCase()==='ADMIN'){
    try{
     const result=await persistirSolicitacaoMecanicas20261019(qs.docs);
     if(result.updated)currentSnapshot=await getDocsCached(facCol,'faccoes',{ttl:0});
    }catch(err){console.warn('[MECÂNICAS] Cadastro pendente:',err?.message||err)}
   }
   /* V13 - a lista crua fica guardada inteira; o painel trabalha so com
      os Groups da season ativa. Filtrar num lugar so faz todas as telas
      respeitarem a season sem precisar mexer em cada uma. */
   faccoesTodas=currentSnapshot.docs.map(d=>({id:d.id,...d.data()}));
   try{await recuperarTelaoIlegalMechanic02(faccoesTodas)}catch(err){console.warn('[TELÃO MECÂNICA 02] Recuperação pendente:',err?.message||err)}
   faccoesTodas.sort((a,b)=>(a.numero||999)-(b.numero||999));
   faccoes=filtrarPorSeason(faccoesTodas);
   faccoesEmergencyError='';
   faccoesLoaded=true;
   renderFaccoes();
   renderSeasonBadge();
   renderAvailableFaccoes();
   renderCommandDashboard();
   return faccoes;
  }catch(e){
   $('#facList').innerHTML=`<div class="placeholder"><h3>DADOS INDISPONÍVEIS</h3><p>${esc(e.message||String(e))}</p></div>`;
   if(highOsEmergencyReadOnly){faccoesEmergencyError=String(e?.message||e);renderCommandDashboard()}
   throw e;
  }
 })();
 try{return await faccoesLoadPromise}
 finally{faccoesLoadPromise=null}
}

/* ------------------------------------------------------------
   AVISO DO DISCORD NO FIM DA ENTREGA
   Os modelos e as 22 artes ja existem; o que faltava era eles
   aparecerem na hora certa. Abrir outra ferramenta para montar
   o aviso logo depois de entregar e o tipo de passo que a
   equipe esquece.
   O bot ainda nao tem endpoint para postar entrega e
   recolhimento - so para faccao livre. Entao aqui o aviso sai
   pronto para colar, e o botao de postar aparece sozinho
   quando o endpoint existir.
   ------------------------------------------------------------ */
/* Campos que o cadastro NAO tem como saber: sao do atendimento,
   negociados caso a caso. Ficam em formulario aqui porque digitar
   no Discord depois do post e o que gera aviso editado a mao. */
const CAMPOS_AVISO={
 entrega:[
  {k:'responsavel',r:'Staff responsável',obrigatorio:true},
  {k:'oferta',r:'Oferta',obrigatorio:true,ajuda:'O que foi oferecido para a Org ficar'},
  {k:'metaRec',r:'Meta de Rec',ajuda:'Vem da meta cadastrada; pode ajustar'},
  {k:'observacao',r:'Observação',area:true,ajuda:'Condição do acordo, se houver'}
 ],
 recolhimento:[
  {k:'responsavel',r:'Responsável',obrigatorio:true},
  {k:'motivo',r:'Motivo',obrigatorio:true,opcoes:[
   'Solicitação da liderança','Baixo contingente','Inatividade',
   'Quebra de regra','Encerramento de season'
  ]},
  {k:'justificativa',r:'Justificativa',area:true,obrigatorio:true,
   ajuda:'O que sustenta o motivo'},
  {k:'statusFinal',r:'Status final',ajuda:'Como o local ficou'}
 ]
};
const CANAL_AVISO={entrega:'faccoes-entregues',recolhimento:'faccoes-retomadas'};

/* Monta o corpo pronto da webhook de recolhimento a partir do que o
   formulario de recolhimento ja captura. E o mesmo modelo da previa:
   um unico lugar decide como o aviso sai. */
function avisoRecolhimentoWebhook(f={},r={}){
 try{
  return avisos.corpoWebhook(avisos.avisoRecolhimento(avisos.dadosDaFaccao(f,{
   motivo:r.motivoLabel||r.motivo||'',
   responsavel:r.responsavel||'',
   justificativa:r.justificativa||'',
   data:r.data||undefined,
   hora:r.hora||undefined,
   statusFinal:'Facção sem Group. Local vago.'
  })));
 }catch(e){console.warn('[AVISO-REC]',e?.message||e);return null}
}

function abrirAvisoEntrega(f,extra={}){
 /* A meta ja foi combinada na tela de metas - nao se pergunta duas vezes. */
 let metaRec=extra.metaRec||'';
 try{if(!metaRec)metaRec=metasUi.textoMeta(metasUi.metaDoGroup(f))||''}catch(e){}
 mostrarAviso('entrega',f,{...extra,metaRec});
}
function abrirAvisoRecolhimento(f,extra={}){
 mostrarAviso('recolhimento',f,extra);
}

function mostrarAviso(tipo,f,extra={}){
 const campos=CAMPOS_AVISO[tipo]||[];
 const valores={...extra};
 const montar=()=>avisos[tipo==='entrega'?'avisoEntrega':'avisoRecolhimento'](
  avisos.dadosDaFaccao(f,valores));
 let aviso=montar();

 const modal=document.createElement('div');
 modal.className='modal';
 modal.innerHTML=`<div class="modal-card aviso-modal">
   <button class="modal-x" type="button" aria-label="Fechar">\u00d7</button>
   <div class="eyebrow">AVISO DO DISCORD \u00b7 ${tipo==='entrega'?'ENTREGA':'RECOLHIMENTO'}</div>
   <h2 style="margin:4px 0 4px">${esc(f?.group||'')}</h2>
   <p class="cat-ajuda">Group, QG, segmento, fac\u00e7\u00e3o, l\u00edder e benef\u00edcios vieram do cadastro. Preencha abaixo o que \u00e9 do atendimento \u2014 a pr\u00e9via acompanha.</p>
   <div class="aviso-grade">
    <div class="aviso-form">
     ${campos.map(c=>`<label class="campo">
       <span>${esc(c.r)}${c.obrigatorio?' *':''}</span>
       ${c.opcoes
         ? `<input list="op_${c.k}" data-c="${c.k}" value="${esc(valores[c.k]||'')}" placeholder="${esc(c.ajuda||'')}">
            <datalist id="op_${c.k}">${c.opcoes.map(o=>`<option value="${esc(o)}">`).join('')}</datalist>`
         : c.area
           ? `<textarea data-c="${c.k}" rows="3" placeholder="${esc(c.ajuda||'')}">${esc(valores[c.k]||'')}</textarea>`
           : `<input data-c="${c.k}" value="${esc(valores[c.k]||'')}" placeholder="${esc(c.ajuda||'')}">`}
      </label>`).join('')}
    </div>
    <div class="aviso-previa" data-previa>
     <h3>${esc(aviso.titulo)}</h3>
     <pre data-desc>${esc(aviso.embed.description)}</pre>
     <img src="${esc(aviso.embed.image.url)}" alt="" onerror="this.style.display='none'">
     <div class="aviso-rodape">${esc(aviso.embed.footer.text)}</div>
    </div>
   </div>
   <div class="aviso-erro" data-erro hidden></div>
   <div class="modal-actions">
    <button type="button" class="btn-secondary compact" data-fechar>FECHAR</button>
    <div style="display:flex;gap:9px;margin-left:auto;flex-wrap:wrap">
     <button type="button" class="btn-secondary compact" data-json>COPIAR JSON</button>
     <button type="button" class="btn-secondary compact" data-texto>COPIAR TEXTO</button>
     <button type="button" class="btn-primary compact" data-postar>POSTAR NO DISCORD</button>
    </div>
   </div>
  </div>`;
 document.body.appendChild(modal);

 const desc=modal.querySelector('[data-desc]');
 const erro=modal.querySelector('[data-erro]');
 const mostrarErro=t=>{if(t){erro.textContent=t;erro.hidden=false}else{erro.hidden=true}};

 /* A previa e o aviso sao o mesmo objeto: o que esta na tela e o
    que vai pro Discord, sem segunda montagem na hora de postar. */
 const atualizar=()=>{aviso=montar();desc.textContent=aviso.embed.description};
 modal.querySelectorAll('[data-c]').forEach(el=>{
  el.oninput=()=>{valores[el.dataset.c]=el.value;atualizar();mostrarErro('')};
 });

 const fechar=()=>modal.remove();
 modal.querySelector('.modal-x').onclick=fechar;
 modal.querySelector('[data-fechar]').onclick=fechar;
 modal.onclick=e=>{if(e.target===modal)fechar()};

 const copiar=async(txt,btn)=>{
  try{await navigator.clipboard.writeText(txt)}
  catch(e){const t=document.createElement('textarea');t.value=txt;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove()}
  const antes=btn.textContent; btn.textContent='COPIADO';
  setTimeout(()=>btn.textContent=antes,1600);
 };
 modal.querySelector('[data-texto]').onclick=e=>copiar(aviso.texto,e.currentTarget);
 modal.querySelector('[data-json]').onclick=e=>copiar(JSON.stringify(avisos.corpoWebhook(aviso),null,2),e.currentTarget);

 modal.querySelector('[data-postar]').onclick=async e=>{
  const faltando=campos.filter(c=>c.obrigatorio&&!String(valores[c.k]||'').trim()).map(c=>c.r);
  if(faltando.length)return mostrarErro('Preencha antes de postar: '+faltando.join(', ')+'.');
  const btn=e.currentTarget; btn.disabled=true; const antes=btn.textContent; btn.textContent='POSTANDO...';
  try{
   const r=await highOsDiscordRequest('/v1/avisos',{method:'POST',body:JSON.stringify({
    tipo,canal:CANAL_AVISO[tipo],group:f?.group||'',
    webhook:avisos.corpoWebhook(aviso),
    usuario:currentUser?.email||''
   })});
   if(r?.enfileirado){
    /* Fila do bot: o aviso sai quando o PC ligar, na ordem. */
    mostrarErro(r.aviso||'O bot esta offline. O aviso ficou na fila.');
    btn.textContent='NA FILA';
   }else{
    btn.textContent='POSTADO';
    setTimeout(fechar,900);
   }
  }catch(err){
   const m=String(err?.message||err);
   mostrarErro(/404|not found/i.test(m)
    ? 'O bot ainda nao tem o endpoint /v1/avisos. Use COPIAR JSON e cole na webhook por enquanto.'
    : 'Nao deu pra postar: '+m);
   btn.disabled=false; btn.textContent=antes;
  }
 };
}

/* ============================================================
   V13 · METAS DE RECRUTAMENTO
   A meta e o acordo da entrega ("Vip Org Ultra caso bater a
   meta"). Negociada caso a caso, muda no atendimento - por isso
   mora aqui e nao na planilha.
   ============================================================ */
let metaFiltro={busca:'',soSemMeta:false};

function renderMetas(){
 const box=$('#metasBox');
 if(!box)return;
 /* So Groups: a meta e de quem produz. Um QG sem Group nao tem com quem
    combinar nada. */
 box.innerHTML=metasUi.metasHtml({
  groups:(faccoes||[]).filter(f=>!f.removido&&String(f.group||'').trim()),
  esc, podeEditar:canEditModule('faccoes'), filtro:metaFiltro, resumoRec:null
 });
 ligarMetas();
}

function ligarMetas(){
 const box=$('#metasBox');
 if(!box)return;
 const busca=$('#metaBusca');
 if(busca)busca.oninput=()=>{clearTimeout(busca._t);busca._t=setTimeout(()=>{
  const pos=busca.selectionStart; metaFiltro.busca=busca.value; renderMetas();
  const n=$('#metaBusca'); if(n){n.focus();n.setSelectionRange(pos,pos)}
 },250)};
 const so=$('#metaSoSem');
 if(so)so.onchange=()=>{metaFiltro.soSemMeta=so.checked;renderMetas()};

 box.querySelectorAll('.meta-linha').forEach(l=>{
  /* Dias so fazem sentido com meta diaria; aparecem e somem junto. */
  const per=l.querySelector('[data-m="periodo"]');
  const dias=l.querySelector('[data-dias]');
  if(per&&dias)per.onchange=()=>{dias.hidden=per.value!=='DIA'};
  l.querySelectorAll('[data-dia]').forEach(b=>b.onclick=()=>b.classList.toggle('on'));
 });

 box.querySelectorAll('[data-salvar-meta]').forEach(b=>b.onclick=()=>salvarMeta(b.dataset.salvarMeta,b));
}

async function salvarMeta(group,btn){
 if(!canEditModule('faccoes'))return permissionDeniedMessage('faccoes',true);
 const linha=$(`[data-meta-group="${CSS.escape(group)}"]`);
 if(!linha)return;
 const f=(faccoes||[]).find(x=>String(x.group||'')===group);
 if(!f)return;
 const meta=metasUi.lerLinha(linha);
 const antes=metasUi.textoMeta(metasUi.metaDoGroup(f));

 btn.disabled=true; const rotulo=btn.textContent; btn.textContent='...';
 try{
  await setDoc(doc(db,'highos','data','faccoes',idFac(f.group)),{
   metaRec:meta,  /* null limpa a meta: combinar zero nao e um acordo */
   updatedAt:serverTimestamp(), updatedBy:currentUser?.email||''
  },{merge:true});
  await addDoc(histCol,{sessionId:currentSessionId||'',tipo:'META_REC',group:f.group,
   descricao:meta?`Meta de ${f.group}: ${metasUi.textoMeta(meta)}${antes?` (antes: ${antes})`:''}`
                 :`Meta de ${f.group} removida${antes?` (era: ${antes})`:''}`,
   usuario:currentUser?.email||'',data:serverTimestamp()}).catch(()=>{});
  f.metaRec=meta;
  const i=(faccoesTodas||[]).findIndex(x=>x.group===f.group);
  if(i>=0)faccoesTodas[i].metaRec=meta;
  btn.textContent='SALVO';
  setTimeout(()=>{btn.textContent=rotulo;btn.disabled=false;renderMetas()},700);
 }catch(e){
  alert('Não salvou: '+e.message);
  btn.textContent=rotulo; btn.disabled=false;
 }
}

/* ============================================================
   V13 · CATÁLOGO DE CRAFT E ROTA
   As receitas saem do código e passam a morar no Firebase,
   editáveis pela equipe. A rota continua derivada dos insumos.
   ============================================================ */
let catalogoCraft={versao:0,segmentos:{}}, catSegAtivo='', catalogoCarregado=false;

/* O panorama e MONTADO a partir dos QGs da season, nao de um catalogo
   separado: a receita mora no QG, junto das coordenadas. Assim nao ha
   duas verdades sobre a mesma receita. Custo zero de leitura: a season
   ja esta carregada. */
async function carregarCatalogo(){
 const segmentos={};
 for(const f of (faccoesTodas||[])){
  const receitas=f.perfilTecnico?.craft?.receitas||[];
  if(!receitas.length)continue;
  const seg=(f.segmento||'SEM SEGMENTO').toUpperCase();
  (segmentos[seg]=segmentos[seg]||{receitas:[]}).receitas.push(...receitas);
 }
 catalogoCraft=catCraft.normalizarCatalogo({segmentos});
 catalogoCarregado=true;
 return catalogoCraft;
}



function renderCatalogo(){
 const box=$('#catalogoBox');
 if(!box)return;
 box.innerHTML=catUi.catalogoHtml({catalogo:catalogoCraft,segmentoAtivo:catSegAtivo,esc,
  podeEditar:false});
 ligarCatalogo();
}

function ligarCatalogo(){
 const box=$('#catalogoBox');
 if(!box)return;
 box.querySelectorAll('[data-cat-seg]').forEach(b=>b.onclick=()=>{catSegAtivo=b.dataset.catSeg;renderCatalogo()});
}

/* ============================================================
   V13 · QGs DA SEASON
   O Firebase e o banco: esta tela grava. A planilha semeia e
   serve de espelho, mas nao manda.
   ============================================================ */
let qgFiltro={setor:'',estado:'',busca:''};

function renderQgs(){
 const box=$('#qgsBox');
 if(!box)return;
 box.innerHTML=qgsUi.qgsHtml({season,faccoes:faccoesTodas||[],esc,filtro:qgFiltro});
 ligarQgs();
}

function ligarQgs(){
 const box=$('#qgsBox');
 if(!box)return;
 box.querySelectorAll('[data-qg-estado]').forEach(b=>b.onclick=()=>{
  qgFiltro.estado=b.dataset.qgEstado; renderQgs();
 });
 const busca=$('#qgBusca');
 if(busca)busca.oninput=()=>{qgFiltro.busca=busca.value;clearTimeout(busca._t);
  busca._t=setTimeout(()=>{const pos=busca.selectionStart;renderQgs();
   const novo=$('#qgBusca');if(novo){novo.focus();novo.setSelectionRange(pos,pos)}},250)};
 const setor=$('#qgSetor');
 if(setor)setor.onchange=()=>{qgFiltro.setor=setor.value;renderQgs()};

 box.querySelectorAll('[data-qg-editar]').forEach(b=>b.onclick=()=>abrirEditorQg(b.dataset.qgEditar));
 box.querySelectorAll('[data-qg-craft]').forEach(b=>b.onclick=()=>abrirCraftQg(b.dataset.qgCraft));
 /* O QG e o Group sao o mesmo lugar em dois momentos: definida a
    producao, o cartao leva direto ao perfil do Group em vez de obrigar
    a procurar a mesma favela na outra tela. */
 box.querySelectorAll('[data-qg-abrir]').forEach(b=>b.onclick=()=>{
  const alvo=(faccoes||[]).find(x=>String(x.group||'').toUpperCase()===String(b.dataset.qgAbrir).toUpperCase());
  if(!alvo)return alert(`O Group "${b.dataset.qgAbrir}" não está na season ativa.`);
  activateAppPage('faccoes');
  setTimeout(()=>openFac(alvo.id),120);
 });
 box.querySelectorAll('[data-qg-vincular]').forEach(b=>b.onclick=()=>vincularQg(b.dataset.qgVincular));
 box.querySelectorAll('[data-qg-desvincular]').forEach(b=>b.onclick=()=>desvincularQg(b.dataset.qgDesvincular));
}

function qgPorChave(chave){return (season.qgs||[]).find(q=>q.chave===chave)}

/* ------------------------------------------------------------
   GROUP SOLTO E VINCULO COM O QG
   O Group e a identidade produtiva (segmento, produto, receita);
   o QG e o lugar fisico. Os dois nascem separados: a season abre
   com o elenco de Groups definido e as favelas ainda vazias, e o
   vinculo e feito quando se decide quem produz onde.
   ------------------------------------------------------------ */
/* O nome do Group e rotulo, nao chave. Duas seasons podem ter um
   Armas01 cada, e sao registros diferentes. Este e o unico lugar
   que decide em que documento um Group e gravado:
   - ja carregado  -> o id real dele, seja novo ou herdado
   - novo          -> chave com a season na frente
   Sem isso, gravar o Armas01 da season nova escreveria por cima do
   Armas01 da anterior. */
function idFac(nomeOuId){
 const n=String(nomeOuId||'').trim();
 if(!n)return n;
 const todos=faccoesTodas||[];
 const porId=todos.find(x=>x.id===n);
 if(porId)return porId.id;
 const alvo=n.toUpperCase();
 const daSeason=todos.find(x=>String(x.group||'').toUpperCase()===alvo
  && String(x.seasonId||'')===String(season.id||''));
 if(daSeason)return daSeason.id;
 if(!season.id){
  const qualquer=todos.find(x=>String(x.group||'').toUpperCase()===alvo);
  if(qualquer)return qualquer.id;
  return n;
 }
 const legado=todos.find(x=>String(x.group||'').toUpperCase()===alvo && !String(x.seasonId||'').trim());
 if(legado)return legado.id;
 return chaveFaccao(n,season.id);
}

function qgsLivres(){
 const ocupadas=new Set((faccoesTodas||[])
  .filter(x=>!x.removido&&String(x.qgChave||'').trim())
  .map(x=>String(x.qgChave)));
 return (season.qgs||[]).filter(q=>!ocupadas.has(String(q.chave)));
}
function groupsSemQg(){
 return (faccoesTodas||[])
  .filter(x=>!x.removido&&String(x.group||'').trim()&&!String(x.qgChave||'').trim())
  .filter(x=>!season.id||!x.seasonId||x.seasonId===season.id);
}

function dialogo(html,aoAbrir){
 const modal=document.createElement('div');
 modal.className='modal';
 modal.innerHTML=html;
 document.body.appendChild(modal);
 const fechar=()=>modal.remove();
 modal.querySelector('.modal-x')?.addEventListener('click',fechar);
 modal.querySelector('[data-cancelar]')?.addEventListener('click',fechar);
 modal.onclick=e=>{if(e.target===modal)fechar()};
 aoAbrir(modal,fechar);
 return modal;
}

/* Cria o Group sem lugar nenhum. E o caminho normal de abertura de
   season: define-se o elenco antes de saber que favela cada um pega. */
/* Delegacao no documento: renderFaccoes e reatribuida varias vezes
   ao longo do arquivo, entao ligar o botao dentro de um render
   especifico so funciona ate o proximo redesenho. */
document.addEventListener('click',ev=>{
 const b=ev.target?.closest?.('#btnNovoGroup');
 if(b){ev.preventDefault();criarGroupSemQg()}
});
async function criarGroupSemQg(){
 if(!canEditModule('faccoes'))return permissionDeniedMessage('faccoes',true);
 const segs=segmentDefs().map(s=>s.nome).filter(Boolean);
 /* O nome so precisa ser unico dentro da season: Armas01 da season
    passada nao impede o Armas01 desta. */
 const existentes=(faccoes||[]).map(x=>String(x.group||'').toUpperCase());
 dialogo(`<div class="modal-card qg-definir">
   <button class="modal-x" type="button" aria-label="Fechar">\u00d7</button>
   <div class="eyebrow">NOVO GROUP</div>
   <h2 style="margin:4px 0 2px">Criar Group sem QG</h2>
   <p class="page-subtitle" style="margin:0 0 18px">O Group guarda o segmento, o produto e a receita. A favela e a fac\u00e7\u00e3o entram depois.</p>
   <div class="qg-definir-grade">
    <label><span>SEGMENTO</span>
     <select data-d="segmento"><option value="">\u2014 escolha \u2014</option>
      ${segs.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}</select></label>
    <label><span>NOME DO GROUP</span>
     <input data-d="group" placeholder="MUNICAO01" autocomplete="off"></label>
    <label class="larga"><span>PRODUTO</span>
     <input data-d="produto" placeholder="Muni\u00e7\u00f5es e Explosivos"></label>
   </div>
   <p class="qg-definir-aviso" data-aviso></p>
   <div class="modal-actions">
    <button type="button" class="btn-secondary compact" data-cancelar>CANCELAR</button>
    <button type="button" class="btn-primary compact" data-ok>CRIAR</button>
   </div></div>`,(modal,fechar)=>{
  const campo=k=>modal.querySelector(`[data-d="${k}"]`);
  const aviso=modal.querySelector('[data-aviso]');
  const conferir=()=>{
   const g=campo('group').value.trim().toUpperCase();
   const rep=g&&existentes.includes(g);
   aviso.textContent=rep?`J\u00e1 existe um Group chamado "${g}".`:'';
   aviso.className='qg-definir-aviso'+(rep?' alerta':'');
   return !rep;
  };
  campo('group').oninput=conferir;
  campo('segmento').onchange=()=>{if(!campo('produto').value.trim())campo('produto').value=campo('segmento').value};
  modal.querySelector('[data-ok]').onclick=async ev=>{
   const g=campo('group').value.trim(), seg=campo('segmento').value;
   if(!seg)return alert('Escolha o segmento.');
   if(!g)return alert('D\u00ea um nome ao Group.');
   if(!conferir())return alert('Esse nome j\u00e1 est\u00e1 em uso.');
   const btn=ev.currentTarget; btn.disabled=true; btn.textContent='CRIANDO...';
   try{
    await gravarGroup(g,{segmento:seg,produto:campo('produto').value.trim()});
    try{await loadFaccoes()}catch(e){}
    fechar(); renderFaccoes(); renderQgs(); renderSeasonBadge();
   }catch(e){alert('N\u00e3o criou: '+e.message);btn.disabled=false;btn.textContent='CRIAR'}
  };
  setTimeout(()=>campo('segmento').focus(),60);
 });
}

/* Um unico lugar grava Group, com ou sem QG - assim os dois caminhos
   nao divergem no formato do registro. */
async function gravarGroup(g,{segmento,produto,qg='',qgChave=''}){
 const jaExiste=(faccoesTodas||[]).some(x=>String(x.group||'').toUpperCase()===g.toUpperCase());
 await setDoc(doc(db,'highos','data','faccoes',idFac(g)),{
  group:g, segmento, produto:produto||segmento, qg, qgChave,
  status:'INATIVA', faccao:'', lider:'', staff:'',
  seasonId:season.id||'',
  ...(jaExiste?{}:{criadoEm:serverTimestamp()}),
  updatedAt:serverTimestamp(), updatedBy:currentUser?.email||''
 },{merge:true});
}

/* Vincula um Group que ja existe a uma favela livre. */
async function vincularGroupAQg(group){
 if(!canEditModule('faccoes'))return permissionDeniedMessage('faccoes',true);
 const f=(faccoesTodas||[]).find(x=>x.group===group);
 if(!f)return;
 const livres=qgsLivres();
 if(!livres.length)return alert('Nenhuma favela livre nesta season.');
 dialogo(`<div class="modal-card qg-definir">
   <button class="modal-x" type="button" aria-label="Fechar">\u00d7</button>
   <div class="eyebrow">VINCULAR A UMA FAVELA</div>
   <h2 style="margin:4px 0 2px">${esc(group)}</h2>
   <p class="page-subtitle" style="margin:0 0 18px">${esc(f.segmento||'')} \u00b7 escolha onde este Group passa a produzir.</p>
   <div class="qg-definir-grade">
    <label class="larga"><span>FAVELA / QG</span>
     <select data-d="qg"><option value="">\u2014 escolha \u2014</option>
      ${livres.map(q=>`<option value="${esc(q.chave)}">${esc(q.local||q.chave)}${q.setor?' \u00b7 '+esc(q.setor):''}</option>`).join('')}
     </select></label>
   </div>
   <div class="modal-actions">
    <button type="button" class="btn-secondary compact" data-cancelar>CANCELAR</button>
    <button type="button" class="btn-primary compact" data-ok>VINCULAR</button>
   </div></div>`,(modal,fechar)=>{
  modal.querySelector('[data-ok]').onclick=async ev=>{
   const chave=modal.querySelector('[data-d="qg"]').value;
   if(!chave)return alert('Escolha a favela.');
   const q=qgPorChave(chave);
   const btn=ev.currentTarget; btn.disabled=true; btn.textContent='VINCULANDO...';
   try{
    await gravarGroup(group,{segmento:f.segmento||'',produto:f.produto||'',qg:q.local||'',qgChave:chave});
    await vincularGroup(fnsFila(),chave,group,currentUser?.email||'');
    await salvarQg(fnsFila(),chave,{produto:f.produto||''},currentUser?.email||'');
    await registrarHistoricoQg('QG_VINCULADO',q,`Group ${group} vinculado a ${q.local||chave}`);
    try{await loadFaccoes()}catch(e){}
    fechar(); renderFaccoes(); renderQgs(); renderSeasonBadge();
   }catch(e){alert('N\u00e3o vinculou: '+e.message);btn.disabled=false;btn.textContent='VINCULAR'}
  };
 });
}

async function vincularQg(chave){
 if(!canEditModule('faccoes'))return permissionDeniedMessage('faccoes',true);
 const q=qgPorChave(chave);
 if(!q)return;

 /* A planilha da season traz "Setor 1", nao o segmento, e o produto vem
    vazio. Entao definir o Group NAO e so dar um nome: e dizer o que
    aquele lugar passa a produzir. Sem segmento o sistema nao sabe que
    receita padrao oferecer, nem onde o Group entra nos relatorios. */
 const segs=segmentDefs().map(s=>s.nome).filter(Boolean);
 /* O nome so precisa ser unico dentro da season: Armas01 da season
    passada nao impede o Armas01 desta. */
 const existentes=(faccoes||[]).map(x=>String(x.group||'').toUpperCase());

 const modal=document.createElement('div');
 modal.className='modal';
 modal.innerHTML=`<div class="modal-card qg-definir">
   <button class="modal-x" type="button" aria-label="Fechar">×</button>
   <div class="eyebrow">DEFINIR GROUP</div>
   <h2 style="margin:4px 0 2px">${esc(q.local||chave)}</h2>
   <p class="page-subtitle" style="margin:0 0 18px">O Group é a definição produtiva desta favela: o que ela fabrica, com que receita e que farm. A facção que vai ocupar entra depois, na entrega.</p>

   <label class="qg-definir-usar"><span>USAR UM GROUP JÁ CRIADO</span>
    <select data-d="existente">
     <option value="">— criar um novo abaixo —</option>
     ${groupsSemQg().map(x=>`<option value="${esc(x.group)}">${esc(x.group)}${x.segmento?' · '+esc(x.segmento):''}</option>`).join('')}
    </select></label>

   <div class="qg-definir-grade">
    <label><span>SEGMENTO</span>
     <select data-d="segmento">
      <option value="">— escolha —</option>
      ${segs.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('')}
     </select></label>
    <label><span>NOME DO GROUP</span>
     <input data-d="group" placeholder="MUNICAO01" autocomplete="off"></label>
    <label class="larga"><span>PRODUTO</span>
     <input data-d="produto" value="${esc(q.produto||'')}" placeholder="Munições e Explosivos"></label>
   </div>
   <p class="qg-definir-aviso" data-aviso></p>

   <div class="modal-actions">
    <button type="button" class="btn-secondary compact" data-cancelar>CANCELAR</button>
    <button type="button" class="btn-primary compact" data-ok>DEFINIR</button>
   </div>
  </div>`;
 document.body.appendChild(modal);
 const fechar=()=>modal.remove();
 modal.querySelector('.modal-x').onclick=fechar;
 modal.querySelector('[data-cancelar]').onclick=fechar;
 modal.onclick=e=>{if(e.target===modal)fechar()};

 const campo=s=>modal.querySelector(`[data-d="${s}"]`);
 const aviso=modal.querySelector('[data-aviso]');

 /* Escolhido o segmento, o nome vem sugerido pela convencao e o produto
    pelo nome do segmento - os dois continuam editaveis. */
 campo('segmento').onchange=()=>{
  const seg=campo('segmento').value;
  if(!seg)return;
  if(!campo('group').value.trim())campo('group').value=qgsUi.sugerirGroup(seg,faccoesTodas||[],season.qgs||[]);
  if(!campo('produto').value.trim())campo('produto').value=seg;
  conferir();
 };
 const conferir=()=>{
  const g=campo('group').value.trim().toUpperCase();
  const repetido=g&&existentes.includes(g);
  aviso.textContent=repetido?`Já existe um Group chamado "${g}". Definir aqui vai movê-lo para esta favela.`:'';
  aviso.className='qg-definir-aviso'+(repetido?' alerta':'');
 };
 campo('group').oninput=conferir;

 /* Escolher um Group ja criado preenche e tranca os campos: esse
    Group ja tem segmento e produto decididos, vincular nao e hora
    de mudar isso. */
 const ex=campo('existente');
 if(ex)ex.onchange=()=>{
  const alvo=(faccoesTodas||[]).find(x=>x.group===ex.value);
  const travar=!!alvo;
  if(alvo){
   campo('group').value=alvo.group;
   campo('segmento').value=alvo.segmento||'';
   campo('produto').value=alvo.produto||alvo.segmento||'';
  }
  ['group','segmento','produto'].forEach(k=>{campo(k).disabled=travar});
  aviso.textContent=travar?'':'';
  aviso.className='qg-definir-aviso';
 };

 modal.querySelector('[data-ok]').onclick=async ev=>{
  const g=campo('group').value.trim();
  const seg=campo('segmento').value;
  const prod=campo('produto').value.trim();
  if(!seg)return alert('Escolha o segmento: é ele que define que receita padrão o sistema oferece e onde o Group entra nos relatórios.');
  if(!g)return alert('Dê um nome ao Group.');

  const btn=ev.currentTarget;
  btn.disabled=true; btn.textContent='DEFININDO...';
  try{
   const jaExiste=existentes.includes(g.toUpperCase());
   await setDoc(doc(db,'highos','data','faccoes',idFac(g)),{
    group:g, segmento:seg, qg:q.local||'', produto:prod,
    status:'INATIVA', faccao:'', lider:'', staff:'',
    seasonId:season.id||'', qgChave:q.chave,
    ...(jaExiste?{}:{criadoEm:serverTimestamp()}),
    updatedAt:serverTimestamp(), updatedBy:currentUser?.email||''
   },{merge:true});
   await vincularGroup(fnsFila(),chave,g,currentUser?.email||'');
   /* O segmento vem do Group, nao da planilha: o setor da aba e so a
      posicao fisica na cidade. */
   await salvarQg(fnsFila(),chave,{produto:prod},currentUser?.email||'');
   await registrarHistoricoQg('QG_VINCULADO',q,`Group ${g} (${seg}) ${jaExiste?'movido para':'criado em'} ${q.local||chave}`);
   try{await loadFaccoes()}catch(e){}
   fechar(); renderQgs(); renderSeasonBadge();
   if(confirm(`${g} definido em ${q.local||chave}.\n\nCadastrar agora a receita de craft e farm?`))abrirCraftQg(chave);
  }catch(e){
   alert('Não definiu: '+e.message);
   btn.disabled=false; btn.textContent='DEFINIR';
  }
 };
 setTimeout(()=>campo('segmento').focus(),60);
}

async function desvincularQg(chave){
 if(!canEditModule('faccoes'))return permissionDeniedMessage('faccoes',true);
 const q=qgPorChave(chave);
 if(!q)return;
 if(!confirm(`Tirar o Group "${q.group}" de "${q.local||chave}"?\n\nO cadastro do Group não é apagado — ele só deixa de ocupar este QG.`))return;
 try{
  await desvincularGroup(fnsFila(),chave,currentUser?.email||'');
  await registrarHistoricoQg('QG_DESVINCULADO',q,`Group ${q.group} desvinculado de ${q.local||chave}`);
  renderQgs(); renderSeasonBadge();
 }catch(e){alert('Não desvinculou: '+e.message)}
}

function abrirEditorQg(chave){
 const q=qgPorChave(chave);
 if(!q)return;
 const pode=canEditModule('faccoes');
 const modal=document.createElement('div');
 modal.className='modal';
 modal.innerHTML=`<div class="modal-card qg-modal">
   <button class="modal-x" type="button" aria-label="Fechar">×</button>
   <div class="eyebrow">COORDENADAS DO QG</div>
   <h2 style="margin:4px 0 2px">${esc(q.local||chave)}</h2>
   <p class="page-subtitle" style="margin:0 0 16px">${esc(q.setor||'sem setor')}${q.group?' · Group '+esc(q.group):' · sem Group'}</p>
   ${qgsUi.editorHtml(q,esc)}
   <div class="modal-actions">
    <button type="button" class="btn-secondary" data-fechar>FECHAR</button>
    ${pode?'<button type="button" class="btn-primary compact" data-salvar>SALVAR NO BANCO</button>':''}
   </div>
  </div>`;
 document.body.appendChild(modal);
 const fechar=()=>modal.remove();
 modal.querySelector('.modal-x').onclick=fechar;
 modal.querySelector('[data-fechar]').onclick=fechar;
 modal.onclick=e=>{if(e.target===modal)fechar()};
 if(!pode)modal.querySelectorAll('input').forEach(i=>i.disabled=true);

 modal.querySelector('[data-salvar]')?.addEventListener('click',async ev=>{
  const btn=ev.currentTarget;
  btn.disabled=true; btn.textContent='SALVANDO...';
  try{
   const atualizado=qgsUi.lerEditor(modal,q);
   await salvarQg(fnsFila(),chave,{
    local:atualizado.local,setor:atualizado.setor,produto:atualizado.produto,cds:atualizado.cds
   },currentUser?.email||'');
   await registrarHistoricoQg('QG_EDITADO',q,`Coordenadas de ${atualizado.local||chave} atualizadas no painel`);
   fechar(); renderQgs();
  }catch(e){
   alert('Não salvou: '+e.message);
   btn.disabled=false; btn.textContent='SALVAR NO BANCO';
  }
 });
}

/* ------------------------------------------------------------
   CRAFT E ROTA DO QG
   A receita e cadastrada no Group, e o Group mora num QG - entao
   ela fica no proprio registro do QG, junto das coordenadas. Uma
   leitura traz o lugar, a receita e a rota: e o que a solicitacao
   precisa, tudo no mesmo documento.
   ------------------------------------------------------------ */
function abrirCraftQg(chave){
 const q=qgPorChave(chave);
 if(!q)return;
 const pode=canEditModule('faccoes');
 /* Catalogo de uma season so: as receitas dos QGs dela, para um insumo
    poder apontar para a receita de outro QG quando for intermediario. */
 /* Para um insumo intermediario poder apontar para a receita de outro
    Group da cidade. */
 const catalogoDaSeason=()=>({versao:1,segmentos:{
  CIDADE:{receitas:(faccoesTodas||[]).flatMap(x=>(x.perfilTecnico?.craft?.receitas||[]))}
 }});

 /* A RECEITA MORA NO GROUP, nao na favela: se o Group for recolhido e
    for para outro QG, ela vai junto. Sem Group nao ha onde cadastrar. */
 const grp=(faccoesTodas||[]).find(x=>String(x.group||'').toUpperCase()===String(q.group||'').toUpperCase());
 if(!q.group||!grp){
  alert(`"${q.local||chave}" ainda nao tem Group.\n\nA receita fica no Group, nao na favela - vincule um Group primeiro e depois cadastre o craft dele.`);
  return;
 }
 let receitas=catCraft.normalizarCatalogo({segmentos:{S:{receitas:grp.perfilTecnico?.craft?.receitas||[]}}}).segmentos.S.receitas;

 const modal=document.createElement('div');
 modal.className='modal';
 document.body.appendChild(modal);

 function desenhar(){
  const cat=catalogoDaSeason();
  const rotaTotal=receitas.flatMap(r=>catCraft.rotaDaReceita(r,cat));
  const soma=new Map();
  for(const i of rotaTotal){
   const k=i.spawn.toLowerCase();
   const c=soma.get(k)||{spawn:i.spawn,qtd:0,semReceita:false};
   c.qtd+=i.qtd; if(i.semReceita)c.semReceita=true; soma.set(k,c);
  }
  const rota=[...soma.values()].sort((a,b)=>b.qtd-a.qtd);

  modal.innerHTML=`<div class="modal-card cat-modal">
   <button class="modal-x" type="button" aria-label="Fechar">×</button>
   <div class="eyebrow">CRAFT E ROTA</div>
   <h2 style="margin:4px 0 2px">${esc(q.local||chave)}</h2>
   <p class="page-subtitle" style="margin:0 0 16px">Group <b>${esc(q.group)}</b>${q.setor?' · '+esc(q.setor):''} · a receita fica no Group e vai com ele se mudar de favela</p>

   <div class="cat-layout">
    <section>
     <div class="cat-cab"><h3>Receitas</h3>
      ${pode?'<button type="button" class="mini-btn primaria" data-nova>NOVA RECEITA</button>':''}</div>
     ${receitas.length?`<div class="cat-receitas">${receitas.map((r,i)=>`
       <article class="cat-receita">
        <header><div><h4>${esc(r.nome||'(sem nome)')}</h4>
         <span>${esc(r.spawn||'sem spawn')}${r.nivel?' · nível '+r.nivel:''}${r.max?' · máx '+r.max:''}</span></div>
         ${pode?`<button type="button" class="mini-btn" data-edit="${i}">EDITAR</button>`:''}</header>
        <div class="cat-insumos">${r.insumos.map(x=>`<span class="ins ${x.origem.toLowerCase()}">${esc(x.spawn)} <b>×${x.qtd}</b><i>${esc(catCraft.ORIGENS[x.origem]?.label||x.origem)}</i></span>`).join('')||'<span class="vazio">sem insumos</span>'}</div>
       </article>`).join('')}</div>`
      :`<div class="placeholder peq"><h3>SEM RECEITA</h3><p>Cadastre o que este QG fabrica. A rota sai dos insumos.</p></div>`}
    </section>
    <aside class="cat-rota">
     <h3>Rota</h3>
     <p>O que a facção precisa colher para dar conta das receitas deste QG. Entra na solicitação junto das coordenadas.</p>
     ${rota.length?`<ul>${rota.map(i=>`<li${i.semReceita?' class="alerta"':''}><b>${esc(i.spawn)}</b><span>×${i.qtd}</span>${i.semReceita?'<small>craft sem receita cadastrada</small>':''}</li>`).join('')}</ul>`
      :'<p class="vazio">Nada a colher ainda.</p>'}
    </aside>
   </div>

   <div class="modal-actions">
    <button type="button" class="btn-secondary compact" data-fechar>FECHAR</button>
    ${pode?'<button type="button" class="btn-primary compact" data-salvar>SALVAR NO BANCO</button>':''}
   </div>
  </div>`;

  modal.querySelector('.modal-x').onclick=()=>modal.remove();
  modal.querySelector('[data-fechar]').onclick=()=>modal.remove();
  modal.querySelector('[data-nova]')?.addEventListener('click',()=>editarReceitaQg(-1));
  modal.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editarReceitaQg(Number(b.dataset.edit)));
  modal.querySelector('[data-salvar]')?.addEventListener('click',salvar);
 }

 function editarReceitaQg(idx){
  const nova=idx<0;
  const base=nova?catCraft.normalizarReceita({}):receitas[idx];
  const cat=catalogoDaSeason();
  const sub=document.createElement('div');
  sub.className='modal';
  sub.innerHTML=`<div class="modal-card cat-modal">
    <button class="modal-x" type="button" aria-label="Fechar">×</button>
    <div class="eyebrow">${nova?'NOVA RECEITA':'EDITAR RECEITA'}</div>
    <h2 style="margin:4px 0 14px">${esc(base.nome||'Sem nome')}</h2>
    ${catUi.editorReceitaHtml(base,cat,esc,mercadoCatalogo||[])}
    <div class="modal-actions">
     ${nova?'':'<button type="button" class="btn-danger" data-apagar>APAGAR</button>'}
     <div style="display:flex;gap:9px;margin-left:auto">
      <button type="button" class="btn-secondary compact" data-cancelar>CANCELAR</button>
      <button type="button" class="btn-primary compact" data-ok>OK</button>
     </div>
    </div>
   </div>`;
  document.body.appendChild(sub);
  const fecharSub=()=>sub.remove();
  sub.querySelector('.modal-x').onclick=fecharSub;
  sub.querySelector('[data-cancelar]').onclick=fecharSub;

  const previa=()=>{
   const atual=catCraft.normalizarReceita(catUi.lerEditorReceita(sub,base));
   const alvo=sub.querySelector('[data-previa]');
   if(alvo)alvo.innerHTML=catUi.previaRota(atual,cat,esc);
  };
  const lista=sub.querySelector('[data-ins-lista]');
  sub.querySelector('[data-ins-add]').onclick=()=>{
   lista.insertAdjacentHTML('beforeend',sub.querySelector('[data-ins-modelo]').innerHTML);
   ligar();previa();
  };
  function ligar(){
   lista.querySelectorAll('[data-ins-remover]').forEach(b=>b.onclick=()=>{b.closest('.cat-ins-linha').remove();previa()});
   lista.querySelectorAll('[data-i="origem"]').forEach(sl=>{
    const cx=sl.closest('.cat-ins-linha').querySelector('.cat-ins-receita');
    cx.style.display=sl.value==='CRAFT'?'':'none';
    sl.onchange=()=>{cx.style.display=sl.value==='CRAFT'?'':'none';previa()};
   });
  }
  ligar();
  sub.addEventListener('input',e=>{
   if(e.target.matches('[data-i="spawn"],[data-r="spawn"]')){
    const alvo=e.target.parentElement.querySelector('.cat-nome-item');
    if(alvo)alvo.textContent=itensUi.nomeDoItem(e.target.value)||'';
   }
   previa();
  });
  previa();

  sub.querySelector('[data-apagar]')?.addEventListener('click',()=>{
   if(!confirm(`Apagar "${base.nome||'esta receita'}"?`))return;
   receitas.splice(idx,1); fecharSub(); desenhar();
  });
  sub.querySelector('[data-ok]').onclick=()=>{
   const atual=catCraft.normalizarReceita(catUi.lerEditorReceita(sub,base));
   if(!atual.nome||!atual.spawn)return alert('Produto final e spawn são obrigatórios.');
   if(nova)receitas.push(atual); else receitas[idx]=atual;
   fecharSub(); desenhar();
  };
 }

 async function salvar(ev){
  const btn=ev.currentTarget;
  btn.disabled=true; btn.textContent='SALVANDO...';
  try{
   const perfil={...(grp.perfilTecnico||{})};
   perfil.craft={...(perfil.craft||{}),receitas};
   await setDoc(doc(db,'highos','data','faccoes',idFac(grp.group)),
    {perfilTecnico:perfil,updatedAt:serverTimestamp(),updatedBy:currentUser?.email||''},{merge:true});
   await registrarHistoricoQg('GROUP_CRAFT',q,`Craft do Group ${grp.group}: ${receitas.length} receita(s)`);
   try{await loadFaccoes()}catch(e){}
   modal.remove(); renderQgs();
  }catch(e){
   alert('Não salvou: '+e.message);
   btn.disabled=false; btn.textContent='SALVAR NO BANCO';
  }
 }

 desenhar();
}

/* O historico ja registra tudo que a equipe faz; os QGs entram nele
   para a trilha de niveis poder ser lida dali depois. */
async function registrarHistoricoQg(tipo,q,descricao){
 try{
  await addDoc(histCol,{sessionId:currentSessionId||'',tipo,
   group:q.group||'',qg:q.local||q.chave,season:season.id,
   descricao,usuario:currentUser?.email||'',data:serverTimestamp()});
 }catch(e){console.warn('[QG] histórico não gravou:',e?.message||e)}
}

/* ============================================================
   V13 · FILA DE ATUALIZAÇÕES PARA O BOT
   O bot roda no PC de casa. Com a máquina desligada, o que
   antes era recusado agora fica guardado e é reenviado na
   ordem quando ela volta.
   ============================================================ */
let filaPendentes=null;         // null = ainda não consultado

/* Uma leitura só, no login: o documento contador. Se não há
   pendência, a coleção da fila não é tocada. */
async function iniciarFila(){
 const st=await fila.lerStatusFila(fnsFila());
 filaPendentes=st.pendentes;
 atualizarSeloFila();
 /* API de volta e fila com itens: oferece drenar, não drena sozinho.
    Reenviar sem a pessoa saber poderia sobrescrever algo que mudou
    na cidade enquanto o PC estava fora. */
 if(!highOsEmergencyReadOnly && Number(filaPendentes)>0)setTimeout(oferecerDrenagem,1200);
}

function atualizarSeloFila(){
 const el=$('#filaBadge');
 if(!el)return;
 const n=filaPendentes;
 if(n===null){el.hidden=true;return}
 if(n===0&&!highOsEmergencyReadOnly){el.hidden=true;return}
 el.hidden=false;
 el.classList.toggle('offline',highOsEmergencyReadOnly);
 el.innerHTML=`<span><b>${n===null?'—':n} NA FILA</b><small>${highOsEmergencyReadOnly?'bot offline':'pronto para enviar'}</small></span>`;
 el.title=highOsEmergencyReadOnly
  ? 'O bot está offline. As alterações ficam aqui e são enviadas quando o PC ligar.'
  : 'Há alterações feitas com o bot offline esperando para ser enviadas. Clique para revisar.';
 el.onclick=abrirFila;
}

async function abrirFila(){
 let itens=[];
 try{itens=await fila.listarPendentes(fnsFila())}
 catch(e){return alert('Não consegui ler a fila: '+e.message)}
 if(!itens.length){filaPendentes=0;atualizarSeloFila();return alert('A fila está vazia.')}

 const lista=itens.map((x,i)=>`${i+1}. ${x.resumo}`).join('\n');
 if(highOsEmergencyReadOnly)
  return alert(`${itens.length} alteração(ões) esperando o bot ligar:\n\n${lista}\n\nQuando o PC estiver ligado, abra o painel e envie por aqui.`);

 if(!confirm(`Enviar ${itens.length} alteração(ões) ao bot, na ordem em que foram feitas?\n\n${lista}\n\nSe alguma falhar, o envio para ali — para não aplicar as seguintes sobre um estado já divergente.`))return;
 await drenarFila();
}

function oferecerDrenagem(){
 if(!confirm(`O bot está no ar e há ${filaPendentes} alteração(ões) na fila feitas enquanto ele estava fora.\n\nRevisar e enviar agora?`))return;
 abrirFila();
}

async function drenarFila(){
 const r=await fila.drenar(fnsFila(),async item=>{
  const res=await fetch(HIGH_OS_DISCORD_API+item.caminho,{
   method:item.metodo,
   headers:{'content-type':'application/json','authorization':'Bearer '+(await currentUser.getIdToken())},
   body:item.corpo==null?undefined:JSON.stringify(item.corpo)
  });
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(data.error||('HTTP '+res.status));
  return data;
 });
 filaPendentes=Math.max(0,r.total-r.enviados);
 atualizarSeloFila();
 if(r.falhou){
  alert(`Enviadas ${r.enviados} de ${r.total}.\n\nParou em "${r.parouEm?.resumo||'?'}": ${r.falhou}\n\nAs seguintes continuam na fila. Corrija o motivo e envie de novo.`);
 }else{
  alert(`Fila enviada: ${r.enviados} alteração(ões) aplicadas no bot.`);
  try{await loadFaccoes()}catch(e){}
 }
}

/* ============================================================
   V13 · SEASON ATIVA
   A planilha de blips e coordenadas e a lista oficial da season:
   quem nao esta nela nao aparece no painel. Os Groups da season
   anterior continuam gravados, so saem de vista.
   ============================================================ */
async function iniciarSeason(){
 const {lista}=await lerIndice({getDoc,doc,db});
 if(!lista.length){
  /* Nenhuma season importada ainda: nao escondemos nada, mas avisamos -
     um filtro silencioso que some com tudo seria pior que nao filtrar. */
  avisarSeasonAusente();
  return;
 }
 /* A escolha aparece SEMPRE no login, mesmo com uma season so: saber em
    qual temporada se esta trabalhando e parte de abrir o painel, nao um
    detalhe a ser adivinhado. A ultima escolhida vem marcada. */
 await perguntarSeason(lista,seasonEscolhida());
}

function avisarSeasonAusente(){
 const el=$('#seasonBadge');
 if(!el)return;
 el.hidden=false;
 el.classList.add('vazia');
 el.innerHTML='<span><b>SEM SEASON</b><small>importe a planilha</small></span>';
 el.title='Nenhuma season foi importada ainda. Rode tools/importador-planilha.html; enquanto isso o painel mostra todos os Groups.';
 el.onclick=()=>alert('Nenhuma season importada ainda.\n\nO painel esta mostrando TODOS os Groups gravados. Para limitar o painel aos QGs da season, importe a aba de blips e coordenadas em tools/importador-planilha.html.');
}

function perguntarSeason(lista,atual=''){
 return new Promise(resolve=>{
  const caixa=document.createElement('div');
  caixa.className='season-ask';
  caixa.innerHTML=`<div class="season-ask-box" role="dialog" aria-modal="true" aria-label="Escolher season">
   <span>HIGH OS</span>
   <h2>Qual season você vai trabalhar?</h2>
   <p>O painel mostra apenas os Groups que estão na planilha da season escolhida.</p>
   <div class="season-ask-list">${lista.map(s=>`<button type="button" data-season="${esc(s.id)}"${s.id===atual?' class="atual"':''}>
     <b>${esc(s.nome||s.id)}</b>
     <small>${Number(s.total||0)} QGs${Number(s.semGroup||0)?` • ${Number(s.semGroup)} sem Group vinculado`:''}${s.id===atual?' • última usada':''}</small>
    </button>`).join('')}</div>
   <p class="season-ask-erro" hidden></p>
  </div>`;
  document.body.appendChild(caixa);
  caixa.querySelectorAll('[data-season]').forEach(b=>b.onclick=async()=>{
   caixa.querySelectorAll('button').forEach(x=>x.disabled=true);
   const erro=caixa.querySelector('.season-ask-erro');
   try{
    await carregarSeason(b.dataset.season,{getDoc,doc,db});
    guardarEscolha(b.dataset.season);
    caixa.remove();
    resolve(true);
   }catch(e){
    erro.hidden=false;
    erro.textContent=e.message;
    caixa.querySelectorAll('button').forEach(x=>x.disabled=false);
   }
  });
 });
}

function renderSeasonBadge(){
 const el=$('#seasonBadge');
 if(el&&season.carregada){
  const r=resumoSeason(faccoesTodas||[]);
  el.hidden=false;
  el.classList.remove('vazia');
  el.innerHTML=`<span><b>${esc(season.nome)}</b><small>${r.noPainel} no painel${r.semVinculo?` • ${r.semVinculo} QG sem Group`:''}</small></span>`;
  el.title=`${r.qgs} QGs na planilha • ${r.foraDaPlanilha} Group(s) do painel fora da planilha desta season`;
  el.onclick=trocarSeason;
 }
 renderSeasonTopo();
}

/* Botao no topo: a season ativa fica visivel de qualquer tela, nao so
   dentro de Organizacoes. Trocar dali nao recarrega a pagina as cegas -
   abre a mesma escolha do login. */
function renderSeasonTopo(){
 const b=$('#seasonTopBtn');
 if(!b)return;
 if(!season.carregada){
  b.hidden=false;
  b.classList.add('vazia');
  b.innerHTML='<i></i><span><b>SEM SEASON</b><small>importar planilha</small></span>';
  b.title='Nenhuma season importada. O painel está mostrando todos os Groups.';
  b.onclick=()=>alert('Nenhuma season importada ainda.\n\nO painel está mostrando TODOS os Groups gravados. Para limitar aos QGs da temporada, importe a aba de blips e coordenadas em tools/importador-planilha.html.');
  return;
 }
 b.hidden=false;
 b.classList.remove('vazia');
 b.innerHTML=`<i></i><span><b>${esc(season.nome)}</b><small>trocar</small></span>`;
 b.title=`Season ativa: ${season.nome} — ${season.qgs.length} QGs na planilha. Clique para trocar.`;
 b.onclick=trocarSeason;
}

async function trocarSeason(){
 let lista=season.indice;
 if(!lista?.length){
  const r=await lerIndice({getDoc,doc,db});
  lista=r.lista;
 }
 if(!lista?.length)return alert('Nenhuma season importada ainda.');
 const antes=season.id;
 await perguntarSeason(lista,season.id);
 if(season.id===antes)return;          // escolheu a mesma: nada a refazer
 try{
  faccoes=filtrarPorSeason(faccoesTodas);
  renderFaccoes();
  renderSeasonBadge();
  renderAvailableFaccoes();
  renderCommandDashboard();
 }catch(e){location.reload()}
}

function renderFaccoes(){
 const q=($('#facSearch').value||'').toLowerCase(),
seg=$('#facSegment').value,
st=$('#facStatus').value;

 const filtered=faccoes.filter(f=>(!seg||f.segmento===seg)&&(!st||f.status===st)&&(!q||[f.group,
f.faccao,
f.qg,
f.lider,
f.staff,
f.produto].join(' ').toLowerCase().includes(q)));

 const at=faccoes.filter(f=>f.status==='ATIVA').length;

 $('#facStats').innerHTML=`<span><b>${faccoes.length}</b> POSIÇÕES</span><span><b>${at}</b> ATIVAS</span><span><b>${faccoes.length-at}</b> VAGAS</span><span><b>${filtered.length}</b> EXIBIDAS</span>`;

 if(!faccoes.length){$('#facList').innerHTML='<div class="placeholder"><b>◆</b><h3>NENHUM GROUP DISPONÍVEL</h3><p>Não foi possível carregar a base de facções do Discord.</p></div>';return}
 $('#facList').innerHTML=filtered.map(f=>`<article class="fac-card" data-id="${f.id}"><div class="fac-card-head"><h3>${esc(f.group)}</h3><span class="status-chip ${f.status==='ATIVA'?'ativa':'inativa'}">${f.status==='ATIVA'?'ATIVA':'VAGA'}</span></div><div class="fac-name">${esc(f.faccao||'— VAGA —')}</div><div class="muted">${esc(f.segmento)} • ${esc(f.qg||'SEM LOCAL')}</div><div class="muted">${f.lider?'Líder: '+esc(f.lider):''}${f.staff?'<br>Staff: '+esc(f.staff):''}</div><div class="product">${esc(f.produto||'')}</div><div class="card-actions"><button class="mini-btn req-from-fac" data-group="${esc(f.group)}">NOVA SOLICITAÇÃO</button></div></article>`).join('');

 document.querySelectorAll('.fac-card').forEach(c=>c.onclick=(e)=>{if(e.target.closest('.req-from-fac'))return;openFac(c.dataset.id)});
document.querySelectorAll('.req-from-fac').forEach(b=>b.onclick=(e)=>{e.stopPropagation();openRequestModal('',b.dataset.group)});

}
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;',
'<':'&lt;',
'>':'&gt;',
'"':'&quot;',
"'":'&#39;'}[m]));

/* =====================================================================
   HIGH OS V9.4.1 - CAMADA DE RESILIENCIA DO FIRESTORE
   ---------------------------------------------------------------------
   Problema: toda tela lia a colecao inteira com getDocs() a cada
   navegacao. Isso gastava cota, deixava o painel lento e, se o Firebase
   atingisse o limite (ou caisse a internet), o sistema simplesmente nao
   abria.

   Esta camada resolve em tres niveis:
     1. JANELA (ttl)  - a mesma colecao nao e relida em sequencia dentro
                        da janela de tempo; devolve o que ja esta na
                        memoria. Corta a maior parte das leituras.
     2. ESPELHO LOCAL - toda leitura bem sucedida e copiada para o
                        localStorage. Se o Firestore falhar (cota,
                        offline, permissao), o painel abre com o ultimo
                        espelho em MODO LOCAL, somente leitura.
     3. CONTADOR      - registra quantas leituras cada rotina fez na
                        sessao. Digite highOSRotinas() no console para
                        ver a tabela.

   Os dados voltam no mesmo formato de um QuerySnapshot (.docs, .size,
   .forEach), entao nenhuma tela precisou ser reescrita.
   ===================================================================== */
/* V10.5 - invalidacao seletiva de cache.
   Antes QUALQUER gravacao limpava TODAS as colecoes em memoria. Uma simples
   linha no historico fazia Faccoes, Organizacoes, Entregas e Solicitacoes
   perderem o cache e serem relidas na proxima tela. */
const CACHE_COLLECTION_NAMES={
 faccoes:'faccoes',
 organizacoes:'organizacoes',
 entregas:'entregas',
 solicitacoes:'solicitacoes',
 users:'usuarios',
 sessoes_usuario:'sessoes_usuario',
 alertas_dashboard:'alertas_dashboard',
 metricas:'metricas'
};
function cacheNameFromRef(ref){
 try{
  const seg=ref?._key?.path?.segments||ref?._path?.segments||[];
  const dataIx=seg.lastIndexOf('data');
  if(dataIx>=0&&seg[dataIx+1])return CACHE_COLLECTION_NAMES[seg[dataIx+1]]||seg[dataIx+1];
  if(seg.length===2&&seg[0]==='users')return 'usuarios';
 }catch(e){}
 return '';
}
function invalidarCacheRef(ref){
 const nome=cacheNameFromRef(ref);
 if(nome){
  cacheMemoria.delete(nome);
  queryFreshAt.delete(nome);
  try{
   localStorage.removeItem(CACHE_PREFIX+nome);
   if(nome==='entregas')localStorage.removeItem(CACHE_PREFIX+'entregas_resumo');
   if(nome==='solicitacoes')localStorage.removeItem(CACHE_PREFIX+'solicitacoes_resumo');
  }catch(e){}
 }else{
  /* V10.27 - gravações em documentos de configuração (ex. dashboard,
     segmentos, Spotify) não pertencem às coleções operacionais cacheadas.
     Antes elas limpavam TODO o cache em memória e provocavam releituras
     desnecessárias de facções, organizações, entregas e usuários. */
  const seg=ref?._key?.path?.segments||ref?._path?.segments||[];
  if(!seg.length)cacheMemoria.clear(); // só invalida tudo se a referência for realmente indecifrável
 }
}
/* V10.76 - só invalida o espelho depois que o Firestore confirma a escrita.
   Se quota/permissão/rede falhar, a última cópia local válida continua disponível. */
function assertRemoteWriteAvailable(){
 if(highOsEmergencyReadOnly)throw new Error('Contingência somente leitura: API Discord indisponível. Nenhuma alteração foi salva.');
 if(!window.HighOSOffline?.ativo)return;
 const e=new Error('Modo local ativo: reconecte ao Firebase antes de gravar alterações.');
 e.code='highos/offline-write-blocked';
 throw e;
}
function discordStoreRef(ref){
 try{
  const seg=ref?._key?.path?.segments||ref?._path?.segments||[];
  const ix=seg.lastIndexOf('data');
  if(ix>=0&&seg[ix-1]==='highos'&&seg[ix+1])return {scope:String(seg[ix+1]),id:seg.slice(ix+2).join('/')};
 }catch{}
 return null;
}
function discordPlain(v){
 if(v===undefined)return undefined;if(v===null||['string','number','boolean'].includes(typeof v))return v;
 if(typeof v?.toDate==='function')return v.toDate().toISOString();
 if(Array.isArray(v))return v.map(discordPlain);
 if(typeof v==='object'){const o={};for(const [k,x] of Object.entries(v)){const y=discordPlain(x);if(y!==undefined)o[k]=y}return o}
 return String(v);
}
/* V15.1: o registro vindo do bot traz os nomes nativos (location, highOsFaction,
   responsible…) e o painel edita os nomes em português (qg, faccao, lider…).
   O bot lê primeiro o nome nativo, então um {...old, qg:''} reenviava o QG
   antigo em "location" e a edição era desfeita. O campo em português manda. */
const FACTION_PT_NATIVE=[['segmento','segment'],['qg','location'],['faccao','highOsFaction'],['lider','responsible'],['dataEntrega','deliveryDate'],['dataAssuncao','assumedAt'],['fabricacao','fabrication'],['producao','production'],['craft','craftDescription'],['autorizacao','authorization'],['beneficiosAssumir','assumeBenefits'],['motivoRecolhimento','collectionReason'],['dataRecolhimento','collectedAt'],['recolhidoPor','collectedBy'],['contingenteMin','contingentMin'],['contingenteMax','contingentMax'],['beneficios','benefits'],['observacoes','observations'],['observacao','observations']];
async function discordFactionPatch(id,patch={}){
 // O backend faz merge atômico com o registro atual. Evita um GET extra
 // em cada alteração feita pelo painel Web.
 const p=discordPlain(patch);
 // V15.6.6 — segmentação customizada: o backend e o painel podem carregar
 // tanto segmento (PT) quanto segment (campo nativo). Não é seguro eliminar
 // o nativo ao reatribuir uma categoria: o valor antigo (APOIO) pode vencer
 // ao recarregar o cadastro. Atualizar ambos para o MESMO nome de segmento.
 for(const [pt,nat] of FACTION_PT_NATIVE){
  if(!Object.prototype.hasOwnProperty.call(p,pt))continue;
  if(pt==='segmento'){p.segment=String(p.segmento||'').trim();continue;}
  delete p[nat];
 }
 /* A URL leva a CHAVE; o corpo leva o NOME. Enquanto os dois eram a mesma
    coisa, o nome do Group virava a chave e duas seasons nao podiam ter um
    Armas01 cada. */
 const nome=String(p.group||'').trim()||id;
 return highOsDiscordRequest('/v1/factions/'+encodeURIComponent(id),{method:'PUT',body:JSON.stringify({...p,group:nome})});
}
const setDoc=async(ref,data,opts={})=>{
 const ds=discordStoreRef(ref);
 if(ds?.id){
  assertRemoteWriteAvailable();
  const payload=discordPlain(data||{});
  if(ds.scope==='faccoes')await discordFactionPatch(ds.id,payload);
  else{
   let next=payload;
   if(opts?.merge){try{next={...(await highOsStoreGet(ds.scope,ds.id)),...payload};delete next.id}catch{}}
   await highOsStorePut(ds.scope,ds.id,next);
  }
  invalidarCacheRef(ref);return;
 }
 assertRemoteWriteAvailable();const r=await _setDoc(ref,data,opts);invalidarCacheRef(ref);return r;
};
const addDoc=async(ref,data)=>{
 const ds=discordStoreRef(ref);
 if(ds&&!ds.id){
  assertRemoteWriteAvailable();const id=discordId(ds.scope.slice(0,8));await highOsStorePut(ds.scope,id,discordPlain(data||{}));invalidarCacheRef(ref);return {id};
 }
 assertRemoteWriteAvailable();const r=await _addDoc(ref,data);invalidarCacheRef(ref);return r;
};
const deleteDoc=async(ref,...a)=>{
 const ds=discordStoreRef(ref);
 if(ds?.id){assertRemoteWriteAvailable();if(ds.scope==='faccoes')throw new Error('Exclusão direta de facção bloqueada; use recolhimento/status.');await highOsStoreDelete(ds.scope,ds.id);invalidarCacheRef(ref);return;}
 assertRemoteWriteAvailable();const r=await _deleteDoc(ref,...a);invalidarCacheRef(ref);return r;
};

const writeBatch=(...a)=>{
 const real=_writeBatch(...a),ops=[],tocadas=new Set();
 const api={};
 api.set=(ref,data,opts={})=>{const ds=discordStoreRef(ref);if(ds){ops.push({type:'set',ref,data,opts});tocadas.add(ds.scope);return api}real.set(ref,data,opts);return api};
 api.update=(ref,data)=>{const ds=discordStoreRef(ref);if(ds){ops.push({type:'set',ref,data,opts:{merge:true}});tocadas.add(ds.scope);return api}real.update(ref,data);return api};
 api.delete=(ref)=>{const ds=discordStoreRef(ref);if(ds){ops.push({type:'delete',ref});tocadas.add(ds.scope);return api}real.delete(ref);return api};
 api.commit=async()=>{assertRemoteWriteAvailable();for(const op of ops){if(op.type==='delete')await deleteDoc(op.ref);else await setDoc(op.ref,op.data,op.opts)}if(!ops.length)await real.commit();tocadas.forEach(nome=>{cacheMemoria.delete(nome);queryFreshAt.delete(nome);try{localStorage.removeItem(CACHE_PREFIX+nome)}catch{}});};
 return api;
};

const CACHE_PREFIX='highos_cache_';

const CACHE_TTL_PADRAO=120000;
          // janela curta: agrupa a rajada de leituras da navegacao
const CACHE_LIMITE_BYTES=1200000;
      // nao espelha colecao gigante
const cacheMemoria=new Map();
          // nome -> {at, rows}
const queryFreshAt=new Map();
const QUERY_CHAIN_TTL=120000;
function queryAindaFresca(nome){return Date.now()-(queryFreshAt.get(nome)||0)<QUERY_CHAIN_TTL}
const firestoreStats=new Map();
        // nome -> {leituras, docs, cache, falhas, ultimaAt}

function statBump(nome,campo,qtd=1){
 const s=firestoreStats.get(nome)||{leituras:0,
docs:0,
cache:0,
falhas:0,
ultimaAt:null};

 s[campo]+=qtd;
s.ultimaAt=new Date().toLocaleTimeString('pt-BR');

 firestoreStats.set(nome,s);

}
window.highOSRotinas=function(){
 const linhas=[...firestoreStats.entries()].map(([nome,
s])=>({
  colecao:nome,
'leituras no Firestore':s.leituras,
'documentos lidos':s.docs,

  'respostas do cache':s.cache,
falhas:s.falhas,
'ultima vez':s.ultimaAt
 }));

 console.table(linhas);

 console.info('MODO LOCAL ativo:',!!window.HighOSOffline?.ativo);

 return linhas;

};

/* Timestamp do Firestore nao sobrevive ao JSON: guardamos como {__ts}
   e reconstruimos com .toDate() na volta, para as telas nao quebrarem. */
function packCache(v){
 if(v===null||v===undefined)return v;

 if(typeof v?.toDate==='function'&&typeof v?.seconds==='number')return {__ts:v.seconds};

 if(Array.isArray(v))return v.map(packCache);

 if(typeof v==='object'){const o={};
for(const k in v)o[k]=packCache(v[k]);
return o}
 return v;

}
function unpackCache(v){
 if(v===null||v===undefined)return v;

 if(typeof v==='object'&&!Array.isArray(v)&&Object.prototype.hasOwnProperty.call(v,'__ts')){
  const d=new Date(v.__ts*1000);

  return {seconds:v.__ts,
nanoseconds:0,
toDate:()=>d};

 }
 if(Array.isArray(v))return v.map(unpackCache);

 if(typeof v==='object'){const o={};
for(const k in v)o[k]=unpackCache(v[k]);
return o}
 return v;

}
function cacheEscrever(nome,rows){
 try{
  const txt=JSON.stringify({at:Date.now(),
rows:rows.map(r=>packCache(r))});

  if(txt.length>CACHE_LIMITE_BYTES)return;

  localStorage.setItem(CACHE_PREFIX+nome,txt);

 }catch(e){/* cota do navegador cheia: o espelho e opcional */}
}
function cacheLer(nome){
 try{
  const raw=localStorage.getItem(CACHE_PREFIX+nome);

  if(!raw)return null;

  const data=JSON.parse(raw);

  if(!Array.isArray(data?.rows))return null;

  return {at:data.at,
rows:data.rows.map(r=>unpackCache(r))};

 }catch(e){return null}
}
function comoSnapshot(rows=[]){
 const docs=rows.map(r=>{const {id,
...resto}=r;return {id,
data:()=>resto,
exists:()=>true}});

 return {docs,
size:docs.length,
empty:!docs.length,
forEach:fn=>docs.forEach(fn)};

}
function cachedSnapshotOnly(nome){
 const mem=cacheMemoria.get(nome);
 const espelho=mem||cacheLer(nome);
 /* V10.65 - coleção vazia também é um cache válido. */
 if(espelho&&Array.isArray(espelho.rows)){statBump(nome,'cache');return comoSnapshot(espelho.rows)}
 return null;
}

window.HighOSOffline={ativo:false,
desde:null,
motivo:''};

function entrarModoLocal(motivo=''){
 if(window.HighOSOffline.ativo)return;

 window.HighOSOffline={ativo:true,
desde:new Date(),
motivo:String(motivo||'')};

 document.body.classList.add('modo-local');

 mostrarFaixaModoLocal();

 try{window.highToast?.(highOsEmergencyReadOnly?'Contingência: API Discord offline. O painel está somente leitura.':'Modo local ativo: o Firebase nao respondeu, mostrando a ultima copia salva. Nada sera gravado ate a conexao voltar.','warn',9000)}catch(e){}
}
function sairModoLocal(){
 if(highOsEmergencyReadOnly)return;
 if(!window.HighOSOffline.ativo)return;

 window.HighOSOffline={ativo:false,
desde:null,
motivo:''};

 document.body.classList.remove('modo-local');

 document.getElementById('highLocalBanner')?.remove();

 try{window.highToast?.('Conexao com o Firebase restabelecida.','ok')}catch(e){}
}
function mostrarFaixaModoLocal(){
 if(document.getElementById('highLocalBanner'))return;

 const b=document.createElement('div');

 b.id='highLocalBanner';

 b.innerHTML=highOsEmergencyReadOnly?'<b>API DISCORD OFFLINE</b><span>Contingência somente leitura. Informações locais podem estar desatualizadas; nenhuma alteração será gravada.</span><button type="button" id="highLocalRetry">TENTAR DE NOVO</button>':'<b>MODO LOCAL</b><span>O Firebase nao respondeu (cota, queda ou permissao). Voce esta vendo a ultima copia salva neste navegador e as alteracoes nao serao gravadas.</span><button type="button" id="highLocalRetry">TENTAR DE NOVO</button>';

 document.body.appendChild(b);

 document.getElementById('highLocalRetry')?.addEventListener('click',()=>{cacheMemoria.clear();location.reload()});

}

/* Substitui getDocs() nas rotinas de leitura completa. */
async function getDocsCached(colRef,nome,opts={}){
 const ttl=Number.isFinite(opts.ttl)?opts.ttl:CACHE_TTL_PADRAO;

 const mem=cacheMemoria.get(nome);

 if(mem&&ttl>0&&(Date.now()-mem.at)<ttl){statBump(nome,'cache');
return comoSnapshot(mem.rows)}
 /* V10.75 - o espelho persistido também vale entre reloads/novas abas.
    Antes ele só era usado após falha do Firestore, desperdiçando o TTL. */
 if(!mem&&ttl>0){
  const local=cacheLer(nome);
  if(local&&Number(local.at)>0&&(Date.now()-Number(local.at))<ttl&&Array.isArray(local.rows)){
   cacheMemoria.set(nome,{at:Number(local.at),rows:local.rows});
   statBump(nome,'cache');
   return comoSnapshot(local.rows);
  }
 }
 // Contingência: consultar cache ou dados históricos do Firestore, sem atualizá-los.
 if(highOsEmergencyReadOnly){
  const anterior=mem||cacheLer(nome);
  if(anterior?.rows?.length)return comoSnapshot(anterior.rows);
  try{
   const historico=await getDocs(colRef);
   if(!historico.empty){
    const rows=historico.docs.map(d=>({id:d.id,...d.data()}));
    cacheMemoria.set(nome,{at:0,rows});
    return comoSnapshot(rows);
   }
  }catch(error){
   console.warn('[HIGH OS] Espelho Firestore não disponível:',nome,error?.code||error?.message||error);
  }
  throw new Error('Dados de '+nome+' indisponíveis: Discord offline e sem cópia local/histórica acessível.');
 }
 try{
  const ds=discordStoreRef(colRef);
  if(ds&&!ds.id){
   let rows;
   if(ds.scope==='faccoes'){const r=await highOsDiscordRequest('/v1/factions');rows=(r.records||[]).map(x=>({
    ...x,
    /* key e a chave do registro no bot. Com dois Armas01 (um por season) o
       nome sozinho nao identifica registro nenhum. */
    id:x.key||x.group||x.id,
    group:x.group||x.id||'',
    segmento:x.segmento||x.segment||'',
    qg:x.qg||x.location||'',
    produto:x.produto||x.product||'',
    cds:x.cds||x.coords||'',
    anuncio:x.anuncio||x.announced||'',
    faccao:x.faccao||x.highOsFaction||'',
    lider:x.lider||x.responsible||'',
    staff:x.staff||'',
    dataEntrega:x.dataEntrega||x.deliveryDate||'',
    status:(String(x.status||'').toUpperCase()==='ENTREGUE'||String(x.highOsFaction||x.faccao||'').trim())?'ATIVA':'INATIVA',
    beneficios:x.beneficios||x.benefits||{},
    observacoes:x.observacoes||x.observations||'',
    discordImageUrls:Array.isArray(x.discordImageUrls)?x.discordImageUrls:[]
   }));}
   else rows=await highOsStoreList(ds.scope);
   cacheMemoria.set(nome,{at:Date.now(),rows});cacheEscrever(nome,rows);statBump(nome,'cache');sairModoLocal();
   return comoSnapshot(rows);
  }
  const qs=await getDocs(colRef);

  const rows=qs.docs.map(d=>({id:d.id,
...d.data()}));

  cacheMemoria.set(nome,{at:Date.now(),
rows});

  cacheEscrever(nome,rows);

  statBump(nome,'leituras');
statBump(nome,'docs',rows.length);

  sairModoLocal();

  return qs;

 }catch(e){
  statBump(nome,'falhas');

  const espelho=mem||cacheLer(nome);

  console.warn(`[HIGH OS] Falha ao ler ${nome} no Firestore:`,e?.message||e);

  if(espelho&&Array.isArray(espelho.rows)){
   entrarModoLocal(e?.message||'');

   return comoSnapshot(espelho.rows);

  }
  throw e;

 }
}
['facSearch',
'facSegment',
'facStatus'].forEach(id=>$('#'+id).addEventListener(id==='facSearch'?'input':'change',renderFaccoes));

$('#seedBtn').onclick=async()=>{
 if(currentProfile?.role!=='ADMIN')return;

 if(faccoes.length){alert('A base já possui registros. A importação inicial foi bloqueada para evitar duplicidade.');
return}
 if(!confirm(`Importar as ${SEED.length} posições do Documento das Facções para o Discord Storage?`))return;

 try{const batch=writeBatch(db);
SEED.forEach(f=>batch.set(doc(db,'highos','data','faccoes',idFac(f.group)),{...f,
updatedAt:serverTimestamp(),
updatedBy:currentUser.email}));
await batch.commit();
await addDoc(histCol,{sessionId:currentSessionId||'',
tipo:'IMPORTACAO_INICIAL',
descricao:`Base inicial importada: ${SEED.length} posições`,
usuario:currentUser.email,
data:serverTimestamp()});
await loadFaccoes();
alert('Base inicial importada com sucesso.')}catch(e){alert('Erro na importação: '+e.message)}
};

function getFormBenefits(){
 return {
  vipOrg:$('#fVipOrg').checked,

  chatFaccao:$('#fChatFaccao').checked,

  salario:$('#fSalario').value.trim(),

  salarioMinutos:$('#fSalarioMin').value.trim(),

  radio:$('#fRadio').value.trim(),

  garagemVipBlip:$('#fGaragemVipBlip').value.trim(),

  garagemVipSpawn:$('#fGaragemVipSpawn').value.trim(),

  garagemVipVeiculos:$('#fGaragemVipVeiculos').value.trim(),

  lojaRoupas:$('#fLojaRoupas').value.trim(),

  barbearia:$('#fBarbearia').value.trim(),

  tatuagem:$('#fTatuagem').value.trim(),

  shopExclusivo:$('#fShopExclusivo').value.trim(),

  bau:$('#fBau').value.trim(),

  bauCapacidade:$('#fBauCapacidade').value.trim(),

  arena:$('#fArena').value.trim(),

  farm:($('#fTechFarmCds')?.value||$('#fFarm').value).trim(),

  craft:($('#fTechCraftCds')?.value||$('#fCraft').value).trim(),

  rotaExclusiva:$('#fRotaExclusiva').checked,

  rotaBlips:($('#fTechRoutePoints')?.value||$('#fRotaBlips').value).trim(),

  telao:$('#fTelao').checked,

  telaoNome:$('#fTelaoNome').value.trim(),

  telaoPostit:$('#fTelaoPostit').value.trim(),

  telaoCds:$('#fTelaoCds').value.trim(),
  telaoSons:[1,2,3,4].map(i=>$('#fOpTelaoSom'+i)?.value.trim()||''),
  ...Object.fromEntries([1,2,3,4].map(i=>['telaoCaixa'+i,$('#fOpTelaoSom'+i)?.value.trim()||''])),

  garagemPublica:$('#fGaragemPublica').checked,

  garagemPublicaBlip:$('#fGaragemPublicaBlip').value.trim(),

  garagemPublicaSpawn:$('#fGaragemPublicaSpawn').value.trim(),

  heliponto:$('#fHeliponto').checked,

  helipontoBlip:$('#fHelipontoBlip').value.trim(),

  helipontoSpawn:$('#fHelipontoSpawn').value.trim(),

  outros:$('#fOutrosBeneficios').value.trim()
 };

}
function setFormBenefits(b={}){
 $('#fVipOrg').checked=!!b.vipOrg;
$('#fChatFaccao').checked=!!b.chatFaccao;

 $('#fSalario').value=b.salario||'';
$('#fSalarioMin').value=b.salarioMinutos||'';
$('#fRadio').value=b.radio||'';

 $('#fGaragemVipBlip').value=b.garagemVipBlip||'';
$('#fGaragemVipSpawn').value=b.garagemVipSpawn||'';
$('#fGaragemVipVeiculos').value=b.garagemVipVeiculos||'';

 $('#fLojaRoupas').value=b.lojaRoupas||'';
$('#fBarbearia').value=b.barbearia||'';
$('#fTatuagem').value=b.tatuagem||'';
$('#fShopExclusivo').value=b.shopExclusivo||'';

 $('#fBau').value=b.bau||'';
$('#fBauCapacidade').value=b.bauCapacidade||'';
$('#fArena').value=b.arena||'';
$('#fFarm').value=b.farm||'';
$('#fCraft').value=b.craft||'';

 $('#fRotaExclusiva').checked=!!b.rotaExclusiva;
$('#fRotaBlips').value=b.rotaBlips||'';
$('#fTelao').checked=!!b.telao;
$('#fTelaoNome').value=b.telaoNome||'';
$('#fTelaoPostit').value=b.telaoPostit||'';
$('#fTelaoCds').value=b.telaoCds||'';

 $('#fGaragemPublica').checked=!!b.garagemPublica;
$('#fGaragemPublicaBlip').value=b.garagemPublicaBlip||'';
$('#fGaragemPublicaSpawn').value=b.garagemPublicaSpawn||'';

 $('#fHeliponto').checked=!!b.heliponto;
$('#fHelipontoBlip').value=b.helipontoBlip||'';
$('#fHelipontoSpawn').value=b.helipontoSpawn||'';
$('#fOutrosBeneficios').value=b.outros||'';

}
function selectedDefaultBenefits(){return [...document.querySelectorAll('[data-default-benefit]:checked')].map(x=>x.dataset.defaultBenefit)}
function currentFactionFromForm(){
 const old=faccoes.find(x=>x.group===$('#fGroup').value)||{};

 return {...old,
group:$('#fGroup').value,
status:$('#fStatus').value,
faccao:$('#fFaccao').value.trim(),
qg:$('#fQG').value.trim(),
produto:$('#fProduto').value.trim(),
lider:$('#fLider').value.trim(),
staff:$('#fStaff').value.trim(),
dataEntrega:$('#fData').value.trim(),
anuncio:$('#fAnuncio').value.trim(),
imagemAnuncio:$('#fImagemAnuncio')?.value.trim()||'',
contingenteMin:Number($('#fContingenteMin')?.value||15),
contingenteMax:Number($('#fContingenteMax')?.value||28),
cds:$('#fCds').value.trim(),
observacoes:$('#fObs').value.trim(),
beneficios:getFormBenefits(),
perfilEntrega:{planoPadrao:$('#fPlanoPadrao')?.value.trim()||'',
observacao:$('#fPerfilObs')?.value.trim()||'',
beneficiosPadrao:selectedDefaultBenefits()},
perfilTecnico:getTechProfileFromForm()};

}
function benefitLines(f){
 const b=f?.beneficios||{},
 out=[];

 if(b.vipOrg)out.push('VIP Org');

 if(b.salario)out.push(`Salário: R$ ${b.salario} a cada ${b.salarioMinutos||40} minutos`);

 if(b.chatFaccao)out.push('Chat da Facção');

 if(b.radio)out.push(`Rádio Exclusiva: ${b.radio}`);

 if(b.garagemVipBlip||b.garagemVipSpawn)out.push('Garagem VIP Org');

 if(b.lojaRoupas)out.push('Loja de Roupas');
if(b.barbearia)out.push('Barbearia');
if(b.tatuagem)out.push('Tatuagem');
if(b.shopExclusivo)out.push('Shop Exclusivo');

 if(b.bau)out.push(`Baú${b.bauCapacidade?' ('+b.bauCapacidade+')':''}`);
if(b.arena)out.push('Blip de Arena');
if(b.farm)out.push('Farm');
if(b.craft)out.push('Craft');

 if(b.rotaExclusiva)out.push('Rota Exclusiva');
if(b.telao)out.push(`Telão${b.telaoNome?' ('+b.telaoNome+')':''}`);

 if(b.garagemPublica)out.push('Garagem Pública');
if(b.heliponto)out.push('Heliponto');

 if(b.outros)out.push(...b.outros.split(/\r?\n/).map(x=>x.trim()).filter(Boolean));

 return out;

}
function buildDeliveryExtract(f=currentFactionFromForm()){
 const items=benefitLines(f),
 L=['ENTREGA DE ORGANIZAÇÃO — HIGH ILEGAL',
'',
'Facção: '+(f.faccao||'—'),
'Group: '+(f.group||'—'),
'Segmento: '+(f.segmento||'—'),
'Local/QG: '+(f.qg||'—')];

 if(f.produto)L.push('Produto/Eixo: '+f.produto);
if(f.lider)L.push('Líder: '+f.lider);
if(f.staff)L.push('Staff responsável: '+f.staff);
if(f.dataEntrega)L.push('Data da entrega: '+f.dataEntrega);

 L.push('','Benefícios / Setagens:');
L.push(...(items.length?items.map(x=>'• '+x):['• Nenhum benefício/setagem cadastrado']));

 if(f.observacoes)L.push('','Observações: '+f.observacoes);

 return L.join('\n');

}
function changedBenefit(oldB={},newB={},keys=[]){return keys.some(k=>String(oldB?.[k]??'')!==String(newB?.[k]??''))}
function samePlain(a,b){return JSON.stringify(clonePlain(a||{}))===JSON.stringify(clonePlain(b||{}))}
function operationalRequestAdditions(old={},f={}){
 const req=[],
oldO=mergedTechProfile(old).operacional||opBlank(),
newO=f?.perfilTecnico?.operacional||mergedTechProfile(f).operacional||opBlank(),
group=f.group||old.group||'{Group}';

 const og=t=>oldO.garagens?.find(x=>x.tipo===t)||{},
ng=t=>newO.garagens?.find(x=>x.tipo===t)||{};

 const add=(tipo,titulo,texto)=>req.push({tipo,
titulo,
texto});

 const pub2=ng('PUBLICA_2'),
oldPub2=og('PUBLICA_2');

 if((pub2.blip||pub2.spawn)&&!samePlain(oldPub2,pub2))add('GARAGEM','Garagem Pública 2',['Assunto:',
'',
'- Solicitação de Garagem Pública;',
'',
'Solicitação:',
'',
'- Adicione uma garagem pública na CDS abaixo:',
'',
`- Blip: ${fmtCds(pub2.blip)}`,
`- Spawn: ${fmtCds(pub2.spawn)}`,
'',
`- Permissão: ${group}`].join('\n'));

 const serv=ng('SERVICO'),
oldServ=og('SERVICO');

 if((serv.blip||serv.spawn||serv.veiculos)&&!samePlain(oldServ,serv))add('GARAGEM_SERVICO','Garagem de Serviço / VIP Org',['Assunto:',
'',
`- Adição de Garagem de Serviço no Group "${group}";`,
'',
'Solicitação:',
'',
`- Adicione uma garagem de serviço no Group "${group}";`,
'',
'- Tipo: SERVIÇO / VIP ORG;',
`- Veículos de aluguel: ${serv.veiculos||'{veiculo1}, {veiculo2}'};`,
'',
`- Blip: ${fmtCds(serv.blip)}`,
`- Spawn: ${fmtCds(serv.spawn)}`,
'',
`- A garagem deverá ficar disponível para todos os membros do Group "${group}".`,
'',
`- Permissão: "${group}".`].join('\n'));

 const arm=newO.blindados||{},
oldArm=oldO.blindados||{};

 if((arm.blip||arm.spawn||arm.veiculos||arm.vagas)&&!samePlain(oldArm,arm))add('GARAGEM_BLINDADOS','Garagem de Blindados',['Assunto:',
'',
`- Adição de Garagem de Blindados no Group "${group}";`,
'',
'Solicitação:',
'',
`- Adicione uma garagem de blindados no Group "${group}";`,
'',
`- Quantidade de vagas: ${arm.vagas||'{quantidade}'};`,
`- Blip: ${fmtCds(arm.blip)}`,
`- Spawn da garagem: ${fmtCds(arm.spawn)}`,
`- Spawn do veículo blindado: ${arm.veiculos||'{spawn_do_veiculo}'};`,
'',
`- Obs: Os veículos só serão spawnados após o líder cadastrar no painel o membro permissionado a pegar o mesmo. Se o membro não tiver set, informar para solicitar à liderança o set de blindado, dentro das vagas disponíveis. Se não houver mais blindado disponível, exibir a mensagem: "Esse Group já setou todas as vagas de blindados disponíveis, verifique com o líder da facção."`,
'',
`- Permissão: "${group}".`].join('\n'));

 return req;

}
function autoDeliveryRequests(f=currentFactionFromForm()){
 const old=faccoes.find(x=>x.group===f.group)||{},
 ob=old.beneficios||{},
 b=f.beneficios||{},
 req=[];

 const add=(tipo,titulo,texto)=>req.push({tipo,
titulo,
texto});

 const vipKeys=['vipOrg',
'salario',
'salarioMinutos',
'chatFaccao',
'radio',
'garagemVipBlip',
'garagemVipSpawn',
'garagemVipVeiculos',
'lojaRoupas',
'barbearia',
'tatuagem',
'shopExclusivo',
'bau',
'bauCapacidade',
'arena',
'farm',
'craft',
'outros'];

 if(b.vipOrg && (!ob.vipOrg || changedBenefit(ob,b,vipKeys))){
   let L=['Assunto: Ativação de benefícios de uma organização e alguns blips',
'',
'Solicitação:',
'',
'- Ativação de benefícios de uma organização e alguns blips',
'',
`- Group: ${f.group}`];

   if(b.salario)L.push('',`- Ativar salário de ${b.salario} (A cada ${b.salarioMinutos||40} minutos)`);

   if(b.radio)L.push('',`- Ativar Rádio exclusiva: ${b.radio}`);
 if(b.chatFaccao)L.push('','- Ativar Chat Facção.');

   if(b.garagemVipBlip||b.garagemVipSpawn){L.push('','- Ativar Garagem VIP:','','- Blip de Garagem VIP Org.');
if(b.garagemVipVeiculos)L.push(`- Veículos: ${b.garagemVipVeiculos}`);
L.push('',`- Blip: ${fmtCds(b.garagemVipBlip)}`,`- Spawn: ${fmtCds(b.garagemVipSpawn)}`)}
   [['Loja de roupas',
b.lojaRoupas],
['Barbearia',
b.barbearia],
['Tatuagem',
b.tatuagem],
['Shop Exclusivo',
b.shopExclusivo],
['Baú',
b.bau],
['Blip de arena',
b.arena],
['Farm',
b.farm],
['Craft',
b.craft]].forEach(([n,
v])=>{if(v)L.push('',`- ${n}: ${fmtCds(v)}`)});
 if(b.bauCapacidade)L.push(`- Capacidade do Baú: ${b.bauCapacidade}`);
 if(b.outros)L.push('',...b.outros.split(/\r?\n/).filter(Boolean).map(x=>'- '+x));

   add('BENEFICIOS','VIP Org / Benefícios e Setagens',L.join('\n'));

 }
 if(b.rotaExclusiva && (!ob.rotaExclusiva || changedBenefit(ob,b,['rotaBlips']))){let pts=(b.rotaBlips||'').split(/\r?\n/).filter(Boolean);
add('ROTA_FARM','Rota de Farm Exclusiva',['Assunto: Ativação de rota de farm exclusiva',
'',
'Solicitação:',
'',
'- Ativação de rota de farm exclusiva',
`- Group: ${f.group}`,
'',
'- Blips da rota nova:',
'',
...(pts.length?pts:['{ CDS },'])].join('\n'))}
 if(b.telao && (!ob.telao || changedBenefit(ob,b,['telaoNome',
'telaoPostit',
'telaoCds']))){add('TELAO','Telão da Organização',['Assunto: Ativação de Telão Hall em uma Organização Ilegal',
'',
'Solicitação:',
'',
'- Ativação de Telão Hall em uma Organização Ilegal.',
'',
`- Group: ${f.group}`,
`- Telão usado: ${b.telaoNome||'{modelo_do_telao}'}`,
'',
'- Local/Coordenadas de onde está o telão (coordenadas pega com postit):',
`  ${fmtCds(b.telaoPostit)}`,
'',
'- Local/Coordenadas de onde está o telão (coordenadas pega com cds):',
`  ${fmtCds(b.telaoCds)}`].join('\n'))}
 if(b.garagemPublica && (!ob.garagemPublica || changedBenefit(ob,b,['garagemPublicaBlip',
'garagemPublicaSpawn']))){add('GARAGEM','Garagem Pública',['Assunto:',
'',
'- Solicitaçao de Garagem Publica;',
'',
'Solicitaçao:',
'',
'- Adicione uma garagem publica na CDS abaixo:',
'',
`* Blip: ${fmtCds(b.garagemPublicaBlip)}`,
`* Spawn: ${fmtCds(b.garagemPublicaSpawn)}`,
'',
`- Permissao : ${f.group}`].join('\n'))}
 if(b.heliponto && (!ob.heliponto || changedBenefit(ob,b,['helipontoBlip',
'helipontoSpawn']))){add('HELIPONTO','Heliponto',['Assunto: Adição de Heliponto',
'',
'Solicitação:',
'- Adicione um Heliponto na cds abaixo;',
`- ${fmtCds(b.helipontoBlip)}`,
...(b.helipontoSpawn?['',
`- Spawn: ${fmtCds(b.helipontoSpawn)}`]:[]),
'',
`- Group: ${f.group}.`].join('\n'))}
 operationalRequestAdditions(old,f).forEach(x=>{if(!req.some(r=>requestFingerprint({group:f.group,
tipo:r.tipo,
texto:r.texto})===requestFingerprint({group:f.group,
tipo:x.tipo,
texto:x.texto})))req.push(x)});

 return req;

}
function renderDeliveryRequests(){const box=$('#deliveryRequestsPreview');
if(!box)return;
const rs=autoDeliveryRequests();
box.innerHTML=rs.length?rs.map((r,i)=>`<article class="delivery-request-card"><div><b>${i+1}. ${esc(r.titulo)}</b><span>${esc(r.tipo)}</span></div><pre>${esc(r.texto)}</pre></article>`).join(''):'<div class="delivery-no-change">Nenhuma nova solicitação necessária com as alterações atuais.</div>'}
function updateDeliveryPreview(){if($('#deliveryPreview'))$('#deliveryPreview').value=buildDeliveryExtract();
renderDeliveryRequests()}
async function copyDeliveryRequests(){const rs=autoDeliveryRequests(),
t=rs.map((r,i)=>`===== ${i+1}. ${r.titulo.toUpperCase()} =====\n\n${r.texto}`).join('\n\n');
if(!t)return alert('Nenhuma solicitação técnica nova foi identificada.');
try{await navigator.clipboard.writeText(t);
const b=$('#copyDeliveryRequestsBtn'),
o=b.textContent;
b.textContent='COPIADO ✓';
setTimeout(()=>b.textContent=o,1400)}catch(e){alert('Não foi possível copiar automaticamente.') }}
async function copyDeliveryExtract(){const t=$('#deliveryPreview').value;
try{await navigator.clipboard.writeText(t);
const b=$('#copyDeliveryBtn'),
o=b.textContent;
b.textContent='COPIADO ✓';
setTimeout(()=>b.textContent=o,1400)}catch(e){$('#deliveryPreview').select();
document.execCommand('copy')}}

function resolveGroupIdentity(f={}){
 const seed=SEED.find(x=>x.group===f.group)||{};

 const org=organizacoes.find(o=>String(o.nome||'').trim().toLowerCase()===String(f.faccao||'').trim().toLowerCase())||{};

 const sameSeedOccupant=!!f.faccao && String(seed.faccao||'').trim().toLowerCase()===String(f.faccao||'').trim().toLowerCase();

 return {
  ...f,

  lider:f.lider||org.lider||(sameSeedOccupant?seed.lider:'')||'',

  staff:f.staff||(sameSeedOccupant?seed.staff:'')||'',

  dataEntrega:f.dataEntrega||org.desde||(sameSeedOccupant?seed.dataEntrega:'')||''
 };

}
function openFac(id){
 const raw=faccoes.find(x=>x.id===id);
if(!raw)return;
const f=resolveGroupIdentity(raw);

 $('#fGroup').value=f.group;
$('#fGroupShow').value=f.group;
syncSegmentSelects();
if($('#fSegment'))$('#fSegment').value=segmentNames().find(x=>segmentKey(x)===segmentKey(f.segmento||''))||f.segmento||'OUTROS';
$('#fStatus').value=f.status||'INATIVA';
$('#fFaccao').value=f.faccao||'';
$('#fQG').value=f.qg||'';
$('#fProduto').value=f.produto||'';
$('#fLider').value=f.lider||'';
$('#fStaff').value=f.staff||'';
$('#fData').value=f.dataEntrega||'';
$('#fAnuncio').value=f.anuncio||'';
if($('#fImagemAnuncio'))$('#fImagemAnuncio').value=f.imagemAnuncio||'';
if($('#fContingenteMin'))$('#fContingenteMin').value=f.contingenteMin||15;
if($('#fContingenteMax'))$('#fContingenteMax').value=f.contingenteMax||28;
$('#fCds').value=f.cds||'';
$('#fObs').value=f.observacoes||'';
setFormBenefits(f.beneficios||{});
renderDefaultDeliveryProfile(f);
renderTechProfile(f);
$('#facModalTitle').textContent=f.group;
showGroupProfilePage(f);
updateDeliveryPreview();

 $('#recolherBtn').style.display=f.status==='ATIVA'?'block':'none';

}
$('#facModalClose').onclick=closeGroupProfilePage;

['fSegment',
'fStatus',
'fFaccao',
'fQG',
'fProduto',
'fLider',
'fStaff',
'fData',
'fAnuncio',
'fImagemAnuncio',
'fContingenteMin',
'fContingenteMax',
'fCds',
'fObs',
'fVipOrg',
'fChatFaccao',
'fSalario',
'fSalarioMin',
'fRadio',
'fGaragemVipBlip',
'fGaragemVipSpawn',
'fGaragemVipVeiculos',
'fLojaRoupas',
'fBarbearia',
'fTatuagem',
'fShopExclusivo',
'fBau',
'fBauCapacidade',
'fArena',
'fFarm',
'fCraft',
'fRotaExclusiva',
'fRotaBlips',
'fTelao',
'fTelaoNome',
'fTelaoPostit',
'fTelaoCds',
'fGaragemPublica',
'fGaragemPublicaBlip',
'fGaragemPublicaSpawn',
'fHeliponto',
'fHelipontoBlip',
'fHelipontoSpawn',
'fOutrosBeneficios',
'fPlanoPadrao',
'fPerfilObs',
'fTechCraftCds',
'fTechCraftNome',
'fTechFarmCds',
'fTechRouteName',
'fTechRouteStart',
'fTechRoutePoints'].forEach(id=>$('#'+id)?.addEventListener('input',updateDeliveryPreview));

$('#copyDeliveryBtn').onclick=copyDeliveryExtract;
 $('#copyDeliveryRequestsBtn').onclick=copyDeliveryRequests;

$('#facForm').onsubmit=async e=>{
 e.preventDefault();
const group=$('#fGroup').value,
old=faccoes.find(x=>x.group===group);
getTechProfileFromForm();
const data={...old,
segmento:$('#fSegment')?.value||old?.segmento||'OUTROS',
status:$('#fStatus').value,
faccao:$('#fFaccao').value.trim(),
qg:$('#fQG').value.trim(),
produto:$('#fProduto').value.trim(),
lider:$('#fLider').value.trim(),
staff:$('#fStaff').value.trim(),
dataEntrega:$('#fData').value.trim(),
anuncio:$('#fAnuncio').value.trim(),
imagemAnuncio:$('#fImagemAnuncio')?.value.trim()||'',
contingenteMin:Number($('#fContingenteMin')?.value||15),
contingenteMax:Number($('#fContingenteMax')?.value||28),
cds:$('#fCds').value.trim(),
observacoes:$('#fObs').value.trim(),
beneficios:getFormBenefits(),
perfilEntrega:{planoPadrao:$('#fPlanoPadrao')?.value.trim()||'',
observacao:$('#fPerfilObs')?.value.trim()||'',
beneficiosPadrao:selectedDefaultBenefits()},
perfilTecnico:getTechProfileFromForm(),
updatedAt:serverTimestamp(),
updatedBy:currentUser.email};

 if(data.status==='ATIVA'&&!data.faccao){alert('Informe o nome da facção para marcar como ATIVA.');
return}
 /* V14: facção entra pela ENTREGA e sai pelo RECOLHER; uma facção só ocupa um Group. */
 {const outroV14=data.faccao?faccoes.find(x=>!x.removido&&x.group!==data.group&&ocupadoV14(x)&&String(x.faccao).trim().toLowerCase()===data.faccao.trim().toLowerCase()):null;
 if(outroV14){alert(`${data.faccao} já ocupa o ${outroV14.group}. Uma facção só pode ter um Group.`);return}}
 // O bot recusa entrega sem líder (passaporte + nome); avisa aqui antes de enviar.
 if(data.status==='ATIVA'&&old?.status!=='ATIVA'&&!data.lider){alert('Informe o líder (passaporte e nome) para marcar como ATIVA.');
return}
 /* V10.73 - salvar o perfil sem mudanças não deve consumir Firestore nem
    gerar um evento de auditoria vazio. Timestamps técnicos não entram na comparação. */
 const comparableData=clonePlain(data);
 delete comparableData.updatedAt;
 delete comparableData.updatedBy;
 const comparableOld=clonePlain(old||{});
 delete comparableOld.updatedAt;
 delete comparableOld.updatedBy;
 delete comparableOld.id;
 if(old&&JSON.stringify(comparableOld)===JSON.stringify(comparableData)){
  closeGroupProfilePage();
  return;
 }
 try{const generated=autoDeliveryRequests(data);
await setDoc(doc(db,'highos','data','faccoes',idFac(group)),data);
const localIndex=faccoes.findIndex(x=>x.group===group);
if(localIndex>=0)faccoes[localIndex]={...faccoes[localIndex],
...clonePlain(data)};
await addDoc(histCol,{sessionId:currentSessionId||'',
tipo:(old?.qg!==data.qg||old?.cds!==data.cds||JSON.stringify(old?.beneficios||{})!==JSON.stringify(data.beneficios||{}))?'QG_ALTERADO':(old?.status==='INATIVA'&&data.status==='ATIVA'?'ENTREGA':'EDICAO'),
group,
faccao:data.faccao||old?.faccao||'',
qg:data.qg||'',
antes:snapshot(old),
depois:snapshot(data),
solicitacoesGeradas:generated,
extratoEntrega:buildDeliveryExtract(data),
usuario:currentUser.email,
data:serverTimestamp()});
for(const r of generated)await archiveTechnicalRequest(r,data,'ALTERACAO_DO_GROUP');
await syncGroupsToOfficialSheet([data],{quiet:true,previousGroups:old?[old]:[]});
queryFreshAt.set('faccoes',Date.now());
renderFaccoes();renderAvailableFaccoes();renderOrganizations();
closeGroupProfilePage()}catch(err){alert('Erro ao salvar: '+err.message)}
};

let recollectPanelImage='';

function recollectReasonLabel(v){return ({BAIXO_CONTINGENTE:'Baixo contingente',
INATIVIDADE:'Inatividade',
ABANDONO:'Abandono da facção',
QUEBRA_REGRAS:'Quebra de regras / descumprimento',
DECISAO_CUPULA:'Decisão da cúpula',
SOLICITACAO_LIDERANCA:'Solicitação da liderança',
OUTRO:'Outro'})[v]||v||'—'}
function currentPtBrDateTime(){const d=new Date(),
parts=new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',
day:'2-digit',
month:'2-digit',
year:'numeric',
hour:'2-digit',
minute:'2-digit',
hour12:false}).formatToParts(d).reduce((a,p)=>(a[p.type]=p.value,a),{});
return {date:`${parts.day}/${parts.month}/${parts.year}`,
time:`${parts.hour}:${parts.minute}`}}
function recollectExtract(){const f=faccoes.find(x=>x.group===$('#rGroup')?.value)||{},
reason=$('#rReason')?.value||'',
lines=['RECOLHIMENTO DE FACÇÃO — HIGH ILEGAL',
'',
`Group: ${f.group||'—'}`,
`QG / Local: ${f.qg||'—'}`,
`Segmento: ${f.segmento||'—'}`,
`Facção recolhida: ${f.faccao||'—'}`,
`Líder: ${f.lider||'—'}`,
`Motivo: ${recollectReasonLabel(reason)}`,
`Data: ${$('#rDate')?.value||'—'}`,
`Hora: ${$('#rTime')?.value||'—'}`,
`Responsável: ${$('#rResponsible')?.value||'—'}`];
if(reason==='BAIXO_CONTINGENTE'){lines.push('',`Contingente observado: ${$('#rContingentObserved')?.value||'—'}`,`Meta / mínimo esperado: ${$('#rContingentMin')?.value||'—'}`,`Período de referência: ${$('#rContingentPeriod')?.value||'—'}`,`Métrica / horário: ${$('#rContingentMetric')?.value||'—'}`,`Evidência: ${recollectPanelImage?'Print do painel anexado ao registro':'PRINT DO PAINEL PENDENTE'}`)}const details=$('#rDetails')?.value?.trim();
if(details)lines.push('','Justificativa:',details);
lines.push('','Status final: GROUP VAGO / FACÇÃO SEM GROUP');
return lines.join('\n')}
function updateRecollectUi(){const low=$('#rReason')?.value==='BAIXO_CONTINGENTE';
$('#lowContingentBox')?.classList.toggle('hidden',!low);
if($('#rExtract'))$('#rExtract').value=recollectPrevia()}
/* A previa mostra o modelo novo (o mesmo que vai na webhook); se por
   algum motivo nao montar, cai no extrato antigo em vez de ficar vazia. */
function recollectPrevia(){
 const f=faccoes.find(x=>x.group===$('#rGroup')?.value)||{};
 try{
  const w=avisoRecolhimentoWebhook(f,{
   motivoLabel:recollectReasonLabel($('#rReason')?.value||''),
   responsavel:$('#rResponsible')?.value||'',
   justificativa:$('#rDetails')?.value||'',
   data:$('#rDate')?.value||'',hora:$('#rTime')?.value||''
  });
  const e=w?.embeds?.[0];
  if(e)return e.title+'\n\n'+e.description;
 }catch(err){}
 return recollectExtract();
}
function openRecollectModal(){const group=$('#fGroup').value,
f=faccoes.find(x=>x.group===group);
if(!f||f.status!=='ATIVA')return alert('Este Group não possui uma facção ativa para recolher.');
recollectPanelImage='';
$('#recollectForm')?.reset();
$('#rGroup').value=group;
const now=currentPtBrDateTime();
$('#rDate').value=now.date;
$('#rTime').value=now.time;
$('#rResponsible').value=currentProfile?.name||currentUser?.displayName||currentUser?.email||'';
$('#rContingentMin').value='15';
$('#rPanelPreviewWrap').classList.add('hidden');
$('#rPanelPreview').removeAttribute('src');
$('#rPanelPrintLabel').textContent='CLIQUE, ARRASTE OU COLE O PRINT AQUI';
$('#recollectSummary').innerHTML=`<div><span>FACÇÃO</span><b>${esc(f.faccao||'—')}</b></div><div><span>GROUP</span><b>${esc(f.group||'—')}</b></div><div><span>QG</span><b>${esc(f.qg||'—')}</b></div><div><span>LÍDER</span><b>${esc(f.lider||'—')}</b></div>`;
updateRecollectUi();
$('#recollectModal').classList.remove('hidden')}
function closeRecollectModal(){$('#recollectModal')?.classList.add('hidden');
recollectPanelImage=''}
async function compressRecollectImage(file){if(!file||!file.type.startsWith('image/'))throw new Error('Selecione uma imagem PNG ou JPG.');
const raw=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(new Error('Não foi possível ler a imagem.'));r.readAsDataURL(file)});
const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('Imagem inválida.'));i.src=raw});
const max=1280,
scale=Math.min(1,max/Math.max(img.width,img.height)),
c=document.createElement('canvas');
c.width=Math.round(img.width*scale);
c.height=Math.round(img.height*scale);
c.getContext('2d').drawImage(img,0,0,c.width,c.height);
let q=.72,
data=c.toDataURL('image/jpeg',q);
while(data.length>650000&&q>.4){q-=.08;
data=c.toDataURL('image/jpeg',q)}if(data.length>780000)throw new Error('O print ficou grande demais. Recorte a imagem e tente novamente.');
return data}
async function setRecollectPrint(file){try{recollectPanelImage=await compressRecollectImage(file);
$('#rPanelPreview').src=recollectPanelImage;
$('#rPanelPreviewWrap').classList.remove('hidden');
$('#rPanelPrintLabel').textContent='PRINT CARREGADO ✓';
updateRecollectUi()}catch(e){recollectPanelImage='';
alert(e.message)}}
$('#recolherBtn').onclick=openRecollectModal;

$('#recollectModalClose')?.addEventListener('click',closeRecollectModal);
$('#cancelRecollectBtn')?.addEventListener('click',closeRecollectModal);
$('#rReason')?.addEventListener('change',updateRecollectUi);
['rResponsible',
'rDate',
'rTime',
'rDetails',
'rContingentObserved',
'rContingentMin',
'rContingentPeriod',
'rContingentMetric'].forEach(id=>$('#'+id)?.addEventListener('input',updateRecollectUi));
$('#rPanelPrint')?.addEventListener('change',e=>setRecollectPrint(e.target.files?.[0]));
$('#rRemovePrint')?.addEventListener('click',()=>{recollectPanelImage='';$('#rPanelPrint').value='';$('#rPanelPreviewWrap').classList.add('hidden');$('#rPanelPreview').removeAttribute('src');$('#rPanelPrintLabel').textContent='CLIQUE, ARRASTE OU COLE O PRINT AQUI';updateRecollectUi()});
$('#copyRecollectExtract')?.addEventListener('click',e=>copyText(recollectExtract(),e.currentTarget));

$('#recollectModal')?.addEventListener('paste',async e=>{const item=[...(e.clipboardData?.items||[])].find(x=>x.type?.startsWith('image/'));if(item){e.preventDefault();await setRecollectPrint(item.getAsFile())}});

let recollectInFlight=false;
$('#recollectForm')?.addEventListener('submit',async e=>{e.preventDefault();if(recollectInFlight)return;const group=$('#rGroup').value,
old=faccoes.find(x=>x.group===group);if(!old||old.status!=='ATIVA')return alert('A ocupação deste Group já foi alterada. Atualize a tela e tente novamente.');const reason=$('#rReason').value;if(!reason)return alert('Selecione o motivo do recolhimento.');if(reason==='BAIXO_CONTINGENTE'&&!recollectPanelImage)return alert('Para recolhimento por baixo contingente, o print do painel é obrigatório.');if(reason==='BAIXO_CONTINGENTE'&&!$('#rContingentObserved').value)return alert('Informe o contingente observado.');const recolhimento={motivo:reason,
motivoLabel:recollectReasonLabel(reason),
responsavel:$('#rResponsible').value.trim(),
data:$('#rDate').value.trim(),
hora:$('#rTime').value.trim(),
justificativa:$('#rDetails').value.trim(),
baixoContingente:reason==='BAIXO_CONTINGENTE'?{observado:Number($('#rContingentObserved').value||0),
minimo:Number($('#rContingentMin').value||0),
periodo:$('#rContingentPeriod').value.trim(),
metrica:$('#rContingentMetric').value.trim(),
possuiPrint:!!recollectPanelImage}:null,
extrato:recollectExtract(),
createdAtText:new Date().toISOString(),
createdBy:currentUser.email};if(!recolhimento.responsavel||!recolhimento.data||!recolhimento.hora||!recolhimento.justificativa)return alert('Preencha responsável, data, hora e justificativa.');if(!confirm(`Confirmar recolhimento de ${old.faccao||group}?\n\nMotivo: ${recolhimento.motivoLabel}\nO Group ficará vago e o histórico será preservado.`))return;
recollectInFlight=true;
const submitBtn=e?.submitter||$('#recollectForm')?.querySelector('[type="submit"]');
if(submitBtn)submitBtn.disabled=true;
const data={...old,
status:'INATIVA',
faccao:'',
lider:'',
staff:'',
dataEntrega:'',
ocupacaoAtual:null,
anuncioDiscordStatus:{postado:false,
resetEm:new Date().toISOString(),
resetPor:currentUser.email},
ultimoRecolhimento:{...recolhimento,
possuiEvidencia:!!recollectPanelImage},
observacoes:old.observacoes||'',
updatedAt:serverTimestamp(),
updatedBy:currentUser.email};try{let committed=false;const recollectBatch=writeBatch(db);let evidenceId='';if(recollectPanelImage){const evidenceRef=doc(collection(db,'highos','data','evidencias_recolhimento'));recollectBatch.set(evidenceRef,{tipo:'PRINT_PAINEL',
group,
faccao:old.faccao||'',
motivo:reason,
imagemDataUrl:recollectPanelImage,
createdAt:serverTimestamp(),
createdAtText:new Date().toISOString(),
createdBy:currentUser.email});evidenceId=evidenceRef.id}recolhimento.evidenciaId=evidenceId;data.ultimoRecolhimento.evidenciaId=evidenceId;
/* O bot posta o extrato (e o print, no baixo contingente) no tópico do Group
   e no canal de recolhidas do Discord do Ilegal. Só vai no PUT; não fica no registro local. */
const [tituloRec,...corpoRec]=String(recolhimento.extrato||'').split('\n');
recollectBatch.set(doc(db,'highos','data','faccoes',idFac(group)),{...data,anuncioRecolhimento:{title:tituloRec,description:corpoRec.join('\n').trim(),imageDataUrl:recollectPanelImage||'',
 /* webhook: modelo novo (embed com arte, cor e rodape da Ilegal) montado
    do mesmo formulario de recolhimento. title/description ficam para o
    bot que ainda nao le o campo novo. */
 webhook:avisoRecolhimentoWebhook(old,recolhimento)}});
if(old.faccao){const oid=orgKey(old.faccao);recollectBatch.set(doc(db,'highos','data','organizacoes',oid),{nome:old.faccao,
status:'SEM_GROUP',
groupAtual:'',
segmentoAtual:old.segmento||'',
segmentoVinculado:old.segmento||'',
qgAtual:'',
ultimoRecolhimento:recolhimento,
updatedAt:serverTimestamp(),
updatedBy:currentUser.email},{merge:true})}
const activeDeliveries=entregas.filter(x=>x.group===group&&x.status==='ATIVA');
for(const d of activeDeliveries)recollectBatch.set(doc(db,'highos','data','entregas',d.id),{status:'RECOLHIDA',
recolhimento,
recolhidaEm:serverTimestamp(),
recolhidaPor:currentUser.email},{merge:true});
recollectBatch.set(doc(histCol),{sessionId:currentSessionId||'',
tipo:'RECOLHIMENTO',
group,
faccao:old.faccao||'',
qg:old.qg||'',
motivo:reason,
motivoLabel:recolhimento.motivoLabel,
responsavel:recolhimento.responsavel,
dataRecolhimento:recolhimento.data,
horaRecolhimento:recolhimento.hora,
justificativa:recolhimento.justificativa,
baixoContingente:recolhimento.baixoContingente,
evidenciaId:evidenceId,
extratoRecolhimento:recolhimento.extrato,
antes:snapshot(old),
depois:snapshot(data),
usuario:currentUser.email,
data:serverTimestamp()});
await recollectBatch.commit();
committed=true;
const sheetSynced=await syncGroupsToOfficialSheet([data],{quiet:true});
const fix=faccoes.findIndex(x=>x.group===group);
if(fix>=0)faccoes[fix]={...clonePlain(data),id:faccoes[fix].id||group,updatedBy:currentUser.email};
if(old.faccao){
 const oid=orgKey(old.faccao),oix=organizacoes.findIndex(o=>o.id===oid||String(o.nome||'').toLowerCase()===String(old.faccao).toLowerCase());
 const orgPatch={nome:old.faccao,status:'SEM_GROUP',groupAtual:'',segmentoAtual:old.segmento||'',segmentoVinculado:old.segmento||'',qgAtual:'',ultimoRecolhimento:clonePlain(recolhimento),updatedBy:currentUser.email};
 if(oix>=0)organizacoes[oix]={...organizacoes[oix],...orgPatch,id:organizacoes[oix].id||oid};else organizacoes.push({id:oid,...orgPatch});
}
const activeIds=new Set(activeDeliveries.map(d=>d.id));
entregas=entregas.map(d=>activeIds.has(d.id)?{...d,status:'RECOLHIDA',recolhimento:clonePlain(recolhimento),recolhidaPor:currentUser.email}:d);
queryFreshAt.set('faccoes',Date.now());queryFreshAt.set('organizacoes',Date.now());queryFreshAt.set('entregas',Date.now());
renderFaccoes();renderOrganizations();renderDeliveries();
closeRecollectModal();closeGroupProfilePage();alert(sheetSynced?'Facção recolhida com sucesso. Histórico, organização e evidências registrados.':'Facção recolhida no High OS. Planilha PENDENTE: conecte o Google Sheets e sincronize novamente.')}catch(err){alert('Erro ao recolher: '+err.message)}finally{recollectInFlight=false;if(submitBtn)submitBtn.disabled=false}});

function snapshot(o){if(!o)return null;
const x={...o};
delete x.updatedAt;
return x}

// ===== HIGH OS V4.2 · CENTRAL DE SOLICITAÇÕES · PADRÕES OFICIAIS HIGH =====
const REQUEST_TYPES=[
  ['GARAGEM',
'Garagem Pública'],

  ['HELIPONTO',
'Heliponto'],

  ['GARAGEM_VIP',
'Garagem VIP / VIP Fac'],

  ['GARAGEM_SERVICO',
'Garagem de Serviço / VIP Org'],

  ['GARAGEM_BLINDADOS',
'Garagem de Blindados'],

  ['ROTA_FARM',
'Rota de Farm Exclusiva'],

  ['BAU',
'Baú'],

  ['BLIP',
'Adição / Alteração de Blip'],

  ['REMOVER_BLIP',
'Remoção de Blip'],

  ['RADIO',
'Rádio Exclusiva'],

  ['BENEFICIOS',
'VIP Org / Benefícios e Setagens'],

  ['TELAO',
'Telão da Organização'],

  ['LOJA_FACCAO',
'Loja de Facção / Shop Exclusivo'],

  ['TELEPORT',
'Teleport'],

  ['WEBHOOK',
'Log / Webhook'],

  ['UNIFORME',
'Uniforme / Roupas'],

  ['ITENS',
'Criação / Alteração de Itens'],

  ['ALTERACAO_GROUP',
'Alteração de Group / Facção'],

  ['GERAL',
'Solicitação Geral']
];

const TYPE_PLACEHOLDERS={
 GARAGEM:'Blip: {x,y,z,h}\nSpawn: {x,y,z,h}\nObservações:',

 HELIPONTO:'Blip: {x,y,z,h}\nSpawn: {x,y,z,h}\nObservações:',

 GARAGEM_VIP:'Veículos: LLMOTOSTIER2002, fooxcustomzlexrfc\nBlip: {x,y,z,h}\nSpawn: {x,y,z,h}\nObservações:',

 GARAGEM_SERVICO:'Tipo: SERVIÇO / VIP ORG\nVeículos: veiculo1, veiculo2\nBlip: {x,y,z,h}\nSpawn: {x,y,z,h}\nObservações:',

 GARAGEM_BLINDADOS:'Quantidade de vagas: 2\nBlip: {x,y,z,h}\nSpawn da garagem: {x,y,z,h}\nSpawn do veículo blindado: spawn_do_veiculo\nObservações:',

 ROTA_FARM:'Blips da rota nova:\n{x,y,z},\n{x,y,z},\n{x,y,z}\nObservações:',

 BAU:'CDS: {x,y,z,h}\nCapacidade: \nPermissão: \nObservações:',

 BLIP:'Tipo do blip: \nCDS: {x,y,z,h}\nSpawn: {x,y,z,h} (se houver)\nObservações:',

 REMOVER_BLIP:'Tipo do blip: \nCDS: {x,y,z,h}\nObservações:',

 RADIO:'Rádio: \nObservações:',

 BENEFICIOS:'Os benefícios são puxados automaticamente da ficha do Group.\nUse este campo somente para complemento/observação ou substituição pontual.\nObservações:',

 TELAO:'Os dados do telão são puxados automaticamente da ficha do Group.\nModelo do Telão: \nCDS/postit: \nCDS: \nObservações:',

 LOJA_FACCAO:'CDS: {x,y,z,h}\nObservações:',

 TELEPORT:'Entrada: {x,y,z,h}\nSaída: {x,y,z,h}\nObservações:',

 WEBHOOK:'Webhook: \nDiscord/Canal: \nPermissão: \nObservações:',

 UNIFORME:'Organização/Group: \nNome do uniforme: \nArquivo/anexo: \nCategoria/ajuste: \nObservações:',

 ITENS:'Nome do item: \nSpawn: \nArquivo PNG: spawn_do_item.png\nInteração/uso: \nDescrição: \nObservações:',

 ALTERACAO_GROUP:'Alteração solicitada: \nGroup atual: \nNovo Group: \nBlip/CDS relacionado: \nObservações:',

 GERAL:'Descreva de forma objetiva o que precisa ser realizado:\n\nDados técnicos / CDS / permissões:'
};

const BUILTIN_REQUEST_MODELS=REQUEST_TYPES.map(([tipo,
nome])=>({
  id:'builtin-'+tipo,

  builtin:true,

  tipo,

  nome:nome,

  assunto:defaultSubject(tipo),

  detalhes:TYPE_PLACEHOLDERS[tipo]||'',

  origem:'Base padrão High OS'
}));

function initRequestUi(){
  const opts=REQUEST_TYPES.map(([v,
n])=>`<option value="${v}">${n}</option>`).join('');

  $('#reqTipo').innerHTML=opts;
 $('#reqTypeFilter').innerHTML='<option value="">TODAS AS CATEGORIAS</option>'+opts;

  $('#newRequestBtn').onclick=()=>openRequestModal();

  $('#reqModalClose').onclick=()=>$('#reqModal').classList.add('hidden');

  $('#reqModal').addEventListener('click',e=>{if(e.target.id==='reqModal')$('#reqModal').classList.add('hidden')});

  $('#reqTipo').addEventListener('change',()=>{
    if(!$('#reqId').value){
      $('#reqDetalhes').value=TYPE_PLACEHOLDERS[$('#reqTipo').value]||'';
      $('#reqAssunto').value=defaultSubject($('#reqTipo').value);
      $('#reqModelName').value=requestTypeName($('#reqTipo').value);
    }
    updateRequestPreview();syncRouteRequestAction();
  });

  ['reqGroup',
'reqAssunto',
'reqDetalhes',
'reqModelName'].forEach(id=>$('#'+id).addEventListener('input',()=>{if(id==='reqGroup')syncRequestFaction();updateRequestPreview();syncRouteRequestAction()}));

  $('#reqSearch').addEventListener('input',renderRequests);
 $('#reqTypeFilter').addEventListener('change',renderRequests);

  $('#copyReqBtn').onclick=copyRequestText;
 $('#applyRouteRequestBtn')?.addEventListener('click',applyRouteRequestToProfile);
 $('#reqForm').addEventListener('submit',saveRequestModel);

}
function requestTypeName(v){return REQUEST_TYPES.find(x=>x[0]===v)?.[1]||v||'Solicitação Geral'}
function updateRequestGroupOptions(selected=''){
  $('#reqGroup').innerHTML='<option value="">SEM GROUP / GERAL</option>'+faccoes.map(f=>`<option value="${esc(f.group)}">${esc(f.group)}${f.faccao?' — '+esc(f.faccao):''}</option>`).join('');

  $('#reqGroup').value=selected||'';
 syncRequestFaction();

}
function syncRequestFaction(){const f=faccoes.find(x=>x.group===$('#reqGroup').value);
$('#reqFaccao').value=f?.faccao||''}
function defaultSubject(type){return ({
 GARAGEM:'Solicitaçao de Garagem Publica',

 HELIPONTO:'Adição de Heliponto',

 GARAGEM_VIP:'Ativação de garagem VIP',

 GARAGEM_SERVICO:'Adição de Garagem de Serviço',

 GARAGEM_BLINDADOS:'Adição de Garagem de Blindados',

 ROTA_FARM:'Ativação de rota de farm exclusiva',

 BAU:'Adição de baú',

 BLIP:'Adição de blip',

 REMOVER_BLIP:'Remover blip',

 RADIO:'Ativação de rádio exclusiva para uma facção',

 BENEFICIOS:'Ativação de benefícios de uma organização e alguns blips',

 TELAO:'Ativação de Telão Hall em uma Organização Ilegal',

 LOJA_FACCAO:'Adição de blip de loja de facção',

 TELEPORT:'Criação de blip de teleport',

 WEBHOOK:'Ativação de log através da Webhook',

 UNIFORME:'Adição de uniforme',

 ITENS:'Criação / alteração de itens',

 ALTERACAO_GROUP:'Alteração de Group / facção',

 GERAL:'Solicitação operacional'
})[type]||'Solicitação operacional'}

function getDetailValue(label, detalhes=''){
 const safe=String(label).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

 const rx=new RegExp('^\\s*[-*]?\\s*'+safe+'\\s*[:=-]\\s*(.+)$','im');

 const m=String(detalhes||'').match(rx);

 return m?m[1].trim():'';

}
function getDetailBlock(label, detalhes=''){
 const lines=String(detalhes||'').split(/\r?\n/);
 let on=false,
out=[];

 for(const raw of lines){const t=raw.trim();
if(!t)continue;

   if(new RegExp('^[-*]?\\s*'+label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*:?$','i').test(t)){on=true;
continue}
   if(on && /^[A-Za-zÀ-ÿ][^{}]*:\s*/.test(t))break;

   if(on)out.push(t);

 }
 return out;

}
function fmtCds(v){if(!v)return '{CDS}';
return v.startsWith('{')?v:`{${v.replace(/^\{|\}$/g,'')}}`}
function pushObs(lines,detalhes){const obs=getDetailValue('Observações?',detalhes)||getDetailValue('Obs',detalhes);
if(obs)lines.push('',`- Observação: ${obs}`)}

function buildRequestText(){
 const group=$('#reqGroup').value.trim();

 const tipo=$('#reqTipo').value;

 const d=$('#reqDetalhes').value.trim();

 const subject=$('#reqAssunto').value.trim()||defaultSubject(tipo);

 const G=group||'{Nome do Group}';

 const fac=faccoes.find(x=>x.group===group);
 const b=fac?.beneficios||{};

 let L=[];

 if(tipo==='GARAGEM'){
   L=['Assunto:',
'',
'- Solicitaçao de Garagem Publica;',
'',
'Solicitaçao:',
'',
'- Adicione uma garagem publica na CDS abaixo:',
'',
`* Blip: ${fmtCds(getDetailValue('Blip',d))}`,
`* Spawn: ${fmtCds(getDetailValue('Spawn',d))}`,
'',
`- Permissao : ${G}`];

 }
 else if(tipo==='HELIPONTO'){
   const blip=getDetailValue('Blip',d)||getDetailValue('Heliponto',d)||getDetailValue('CDS',d),
spawn=getDetailValue('Spawn',d);

   L=['Assunto:',
'',
`- ${subject};`,
'',
'Solicitação:',
'',
'- Adicione um Heliponto na CDS abaixo:',
'',
`* Blip: ${fmtCds(blip)}`];

   if(spawn)L.push(`* Spawn: ${fmtCds(spawn)}`);
 L.push('',`- Permissão: ${G}`);
 pushObs(L,d);

 }
 else if(tipo==='GARAGEM_VIP'){
   const veic=getDetailValue('Veículos?',d)||'"LLMOTOSTIER2002" e "fooxcustomzlexrfc"';

   L=[`Assunto: ${subject}`,
'',
'Solicitação:',
'',
'- Ativação de garagem VIP',
'',
'- Garagem VIP:',
'',
'- Blip de Garagem VIP Org.',
`- Veículos: ${veic}`,
'',
`- Group: ${G}`,
'',
`- Blip:`,
`  ${fmtCds(getDetailValue('Blip',d))}`,
'',
`- Spawn:`,
`  ${fmtCds(getDetailValue('Spawn',d))}`];
pushObs(L,d);

 }
 else if(tipo==='GARAGEM_SERVICO'){
   const tipoGar=getDetailValue('Tipo',d)||'SERVIÇO / VIP ORG',
veic=getDetailValue('Veículos?',d)||'{veiculo1}, {veiculo2}',
blip=getDetailValue('Blip',d),
spawn=getDetailValue('Spawn',d);

   L=['Assunto:',
'',
`- Adição de Garagem de Serviço no Group "${G}";`,
'',
'Solicitação:',
'',
`- Adicione uma garagem de serviço no Group "${G}";`,
'',
`- Tipo: ${tipoGar};`,
`- Veículos de aluguel: ${veic};`,
'',
`- Blip: ${fmtCds(blip)}`,
`- Spawn: ${fmtCds(spawn)}`,
'',
`- A garagem deverá ficar disponível para todos os membros do Group "${G}".`,
'',
`- Permissão: "${G}".`];
pushObs(L,d);

 }
 else if(tipo==='GARAGEM_BLINDADOS'){
   const vagas=getDetailValue('Quantidade de vagas',d)||'{quantidade}',
blip=getDetailValue('Blip',d),
spawn=getDetailValue('Spawn da garagem',d)||getDetailValue('Spawn',d),
veic=getDetailValue('Spawn do veículo blindado',d)||getDetailValue('Veículos?',d)||'{spawn_do_veiculo}';

   L=['Assunto:',
'',
`- Adição de Garagem de Blindados no Group "${G}";`,
'',
'Solicitação:',
'',
`- Adicione uma garagem de blindados no Group "${G}";`,
'',
`- Quantidade de vagas: ${vagas};`,
`- Blip: ${fmtCds(blip)}`,
`- Spawn da garagem: ${fmtCds(spawn)}`,
`- Spawn do veículo blindado: ${veic};`,
'',
`- Obs: Os veículos só serão spawnados após o líder cadastrar no painel o membro permissionado a pegar o mesmo. Se o membro não tiver set, informar para solicitar à liderança o set de blindado, dentro das vagas disponíveis. Se não houver mais blindado disponível, exibir a mensagem: "Esse Group já setou todas as vagas de blindados disponíveis, verifique com o líder da facção."`,
'',
`- Permissão: "${G}".`];
pushObs(L,d);

 }
 else if(tipo==='ROTA_FARM'){
   let pts=getDetailBlock('Blips da rota nova',d);
 if(!pts.length)pts=d.split(/\r?\n/).map(x=>x.trim()).filter(x=>/^\{.*\},?$/.test(x));
 if(!pts.length&&b.rotaBlips)pts=String(b.rotaBlips).split(/\r?\n/).map(x=>x.trim()).filter(Boolean);

   L=[`Assunto: ${subject}`,
'',
'Solicitação:',
'',
'- Ativação de rota de farm exclusiva',
`- Group: ${G}`,
'',
'- Blips da rota nova:',
''];

   L.push(...(pts.length?pts:['{ CDS },',
'{ CDS },']));
 pushObs(L,d);

 }
 else if(tipo==='BAU'){
   L=[`Assunto: ${subject}`,
'',
'Solicitação:',
'',
'- Adição de baú.',
`- Group: ${G}`,
'',
`- Local/Coordenadas:`,
`  ${fmtCds(getDetailValue('CDS',d)||getDetailValue('Blip',d))}`];

   const cap=getDetailValue('Capacidade',d),
perm=getDetailValue('Permissão',d);
if(cap)L.push(`- Capacidade: ${cap}`);
L.push(`- Permissão: ${perm||G}`);
pushObs(L,d);

 }
 else if(tipo==='BLIP'){
   const bt=getDetailValue('Tipo do blip',d)||'blip';

   L=[`Assunto: ${subject}`,
'',
'Solicitação:',
'',
`- Adição de ${bt}.`,
`- Group: ${G}`,
'',
`- Local/Coordenadas:`,
`  ${fmtCds(getDetailValue('CDS',d)||getDetailValue('Blip',d))}`];

   const sp=getDetailValue('Spawn',d);
if(sp)L.push('',`- Spawn:`,`  ${fmtCds(sp)}`);
pushObs(L,d);

 }
 else if(tipo==='REMOVER_BLIP'){
   const bt=getDetailValue('Tipo do blip',d)||'blip';
L=[`Assunto: ${subject}`,
'',
'Solicitação:',
'',
`- Remover ${bt}.`,
`- Group: ${G}`,
'',
`- Local/Coordenadas:`,
`  ${fmtCds(getDetailValue('CDS',d)||getDetailValue('Blip',d))}`];
pushObs(L,d);

 }
 else if(tipo==='RADIO'){
   const radio=getDetailValue('Rádio(?: Exclusiva)?',d)||getDetailValue('Radio(?: exclusiva)?',d)||'{Número da rádio}';

   L=[`Assunto: ${subject}`,
'',
'Solicitação:',
'',
`- Ativação de rádio exclusiva para uma facção.`,
`- Group: ${G}`,
'',
`- Rádio Exclusiva: ${radio}.`];
pushObs(L,d);

 }
 else if(tipo==='BENEFICIOS'){
   L=[`Assunto: ${subject}`,
'',
'Solicitação:',
'',
'- Ativação de benefícios de uma organização e alguns blips',
'',
`- Group: ${G}`];

   const salario=getDetailValue('Salário',d)||b.salario;
 const mins=b.salarioMinutos||'40';
 if(salario)L.push('',`- Ativar salário de ${salario} (A cada ${mins} minutos)`);

   const radio=getDetailValue('Rádio',d)||b.radio;
 if(radio)L.push('',`- Ativar Rádio exclusiva: ${radio}`);

   const chatOverride=getDetailValue('Chat Facção',d);
 if(b.chatFaccao||/^sim|ativar|sim$/i.test(chatOverride))L.push('','- Ativar Chat Facção.');

   const gvB=getDetailValue('Garagem VIP - Blip',d)||b.garagemVipBlip,
gvS=getDetailValue('Garagem VIP - Spawn',d)||b.garagemVipSpawn,
veic=getDetailValue('Veículos',d)||b.garagemVipVeiculos;

   if(gvB||gvS){L.push('','- Garagem VIP:','','- Blip de Garagem VIP Org.');
if(veic)L.push(`- Veículos: ${veic}`);
L.push('',`- Blip:`,`  ${fmtCds(gvB)}`,'',`- Spawn:`,`  ${fmtCds(gvS)}`)}
   const singles=[['Loja de roupas',
b.lojaRoupas],
['Barbearia',
b.barbearia],
['Tatuagem',
b.tatuagem],
['Shop Exclusivo',
b.shopExclusivo],
['Farm',
b.farm],
['Craft',
b.craft],
['Baú',
b.bau],
['Arena',
b.arena]];

   for(const [label,
saved] of singles){const v=getDetailValue(label,d)||saved;
if(v)L.push('',`- ${label}:`,`  ${fmtCds(v)}`)}

   if(b.outros){L.push('','- Outros benefícios / setagens:');
L.push(...String(b.outros).split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(x=>`- ${x}`))}
   pushObs(L,d);

 }
 else if(tipo==='TELAO'){
   const nome=getDetailValue('Modelo do Telão',d)||getDetailValue('Telão usado',d)||b.telaoNome||'{modelo_do_telao}';

   const postit=getDetailValue('CDS/postit',d)||b.telaoPostit||'{CDS postit}';
 const cds=getDetailValue('CDS',d)||b.telaoCds||'{CDS jogador}';

   L=[`Assunto: ${subject}`,
'',
'Solicitação:',
'',
'- Ativação de Telão Hall em uma Organização Ilegal.',
'',
`- Group: ${G}`,
`- Telão usado: ${nome}`,
'',
'- Local/Coordenadas de onde está o telão (coordenadas pega com postit):',
`  ${fmtCds(postit)}`,
'',
'- Local/Coordenadas de onde está o telão (coordenadas pega com cds):',
`  ${fmtCds(cds)}`];
pushObs(L,d);

 }
 else if(tipo==='LOJA_FACCAO'){
   L=[`Assunto: ${subject}`,
'',
'Solicitação:',
'',
`- Adicionar uma loja na cds abaixo com acesso exclusivo para o group ${G};`,
`- ${fmtCds(getDetailValue('CDS',d)||getDetailValue('Blip',d))}`,
'',
`- Group: ${G}.`];
pushObs(L,d);

 }
 else if(tipo==='TELEPORT'){
   L=[`Assunto: ${subject}`,
'',
'Solicitação:',
'',
'- Criação de blip de teleport',
'',
`- Entrada: ${fmtCds(getDetailValue('Entrada',d))}`,
`- Saída: ${fmtCds(getDetailValue('Saída',d)||getDetailValue('Saida',d))}`,
'',
`- Group: ${G}.`];
pushObs(L,d);

 }
 else if(tipo==='WEBHOOK'){
   L=[`Assunto: ${subject}`,
'',
'Solicitação:',
'',
'- Ativação de log através da Webhook.',
`- Webhook: ${getDetailValue('Webhook',d)||'{Webhook}'}`,
`- Discord para colocar a log: ${getDetailValue('Discord/Canal',d)||getDetailValue('Discord',d)||'{Canal/Discord}'}`,
'',
`- Permissão que o recurso está: ${getDetailValue('Permissão',d)||G}.`];
pushObs(L,d);

 }
 else if(tipo==='UNIFORME'){
   const org=getDetailValue('Organização/Group',d)||group;
const nome=getDetailValue('Nome do uniforme',d);
const arq=getDetailValue('Arquivo/anexo',d);

   L=[`Assunto: ${subject}`,
'',
'Solicitação:',
'',
'- Adição de uniforme.',
'- Cidade: High',
'',
'- Arquivo/anexo:'];

   if(nome||org)L.push(`Uniforme ${org?org+' ':''}${nome||''}`.trim()+'.');
if(arq)L.push(arq);
const ajuste=getDetailValue('Categoria/ajuste',d);
if(ajuste)L.push('',`- Ajuste solicitado: ${ajuste}`);
pushObs(L,d);

 }
 else if(tipo==='ITENS'){
   const nome=getDetailValue('Nome do item',d)||'{Nome do item}',
spawn=getDetailValue('Spawn',d)||'{spawn_do_item}',
png=getDetailValue('Arquivo PNG',d)||`${spawn}.png`,
uso=getDetailValue('Interação/uso',d),
desc=getDetailValue('Descrição',d);

   L=[`Assunto: ${subject}`,
'',
'Solicitação:',
'',
'- Criação / alteração de item.',
'',
`- Nome do item: ${nome}`,
`- Spawn: ${spawn}`,
`- Arquivo PNG: ${png}`];
if(uso)L.push(`- Interação/uso: ${uso}`);
if(desc)L.push(`- Descrição: ${desc}`);
if(group)L.push('',`- Group/Permissão: ${group}`);
pushObs(L,d);

 }
 else if(tipo==='ALTERACAO_GROUP'){
   L=[`Assunto: ${subject}`,
'',
'Solicitação:',
'',
`- ${getDetailValue('Alteração solicitada',d)||'Alteração de Group / permissão.'}`,
`- Group atual: ${getDetailValue('Group atual',d)||'{Group atual}'}`,
`- Novo Group: ${getDetailValue('Novo Group',d)||group||'{Novo Group}'}`];
const cds=getDetailValue('Blip/CDS relacionado',d);
if(cds)L.push(`- Blip/CDS relacionado: ${fmtCds(cds)}`);
pushObs(L,d);

 }
 else if(tipo==='GERAL'){
   L=[`Assunto: ${subject}`,
'',
'Solicitação:',
''];
if(d)L.push(d);

 }
 else {
   L=[`Assunto: ${subject}`,
'',
'Solicitação:',
''];
if(group)L.push(`- Group: ${group}`);
if(d)L.push(d);

 }
 return L.join('\n');

}

function updateRequestPreview(){
 const preview=$('#reqPreview');
 if(preview)preview.value=buildRequestText();
}

function openRequestModal(id='',group=''){
 const model=id?[...BUILTIN_REQUEST_MODELS,
...solicitacoes].find(x=>x.id===id):null;

 $('#reqId').value=model?.builtin?'':(model?.id||'');

 updateRequestGroupOptions(group||model?.group||'');

 $('#reqTipo').value=model?.tipo||'GERAL';

 $('#reqModelName').value=model?.nome||requestTypeName($('#reqTipo').value);

 $('#reqAssunto').value=model?.assunto||defaultSubject($('#reqTipo').value);

 $('#reqDetalhes').value=model?.detalhes||TYPE_PLACEHOLDERS[$('#reqTipo').value]||'';

 $('#reqOrigem').value=model?.origem||(model?.builtin?'Base padrão High OS':'Biblioteca de modelos');

 $('#reqModalTitle').textContent=model?'GERAR A PARTIR DO MODELO':'NOVO MODELO / SOLICITAÇÃO';

 syncRequestFaction();
updateRequestPreview();
syncRouteRequestAction();
$('#reqModal').classList.remove('hidden');

}
const REQUEST_RECORD_LIMIT=300;
async function loadRequests(){
 if(queryAindaFresca('solicitacoes')){renderRequests();return}
 try{
   const cached=cacheLer('solicitacoes_resumo');
   if(cached&&Number(cached.at)>0&&Date.now()-Number(cached.at)<QUERY_CHAIN_TTL&&Array.isArray(cached.rows)){
    solicitacoes=cached.rows.filter(x=>x.isModelo===true);
    requestRecords=cached.rows.filter(x=>x.isModelo!==true);
    queryFreshAt.set('solicitacoes',Number(cached.at));
    statBump('solicitacoes','cache');
    renderRequests();
    return;
   }
   /* V10.4 - modelos e histórico operacional têm necessidades diferentes:
      modelos são poucos e precisam estar todos disponíveis; registros gerados
      crescem continuamente e ficam limitados aos 300 mais recentes. */
   let modelos=[],registros=[];
   try{
     const all=await highOsStoreList('solicitacoes');
     modelos=all.filter(x=>x.isModelo===true);
     registros=all.filter(x=>x.isModelo!==true).sort((x,y)=>String(y.createdAtText||'').localeCompare(String(x.createdAtText||''))).slice(0,REQUEST_RECORD_LIMIT);
   }catch(err){
     console.warn('[SOLICITAÇÕES] consultas econômicas indisponíveis; coleção inteira não será lida:',err?.code||err?.message);
     const qs=cachedSnapshotOnly('solicitacoes');
     if(!qs)throw err;
     const all=qs.docs.map(d=>({id:d.id,...d.data()}));
     modelos=all.filter(x=>x.isModelo===true);
     registros=all.filter(x=>x.isModelo!==true)
      .sort((a,b)=>String(b.createdAtText||'').localeCompare(String(a.createdAtText||'')))
      .slice(0,REQUEST_RECORD_LIMIT);
   }

   solicitacoes=modelos;
   requestRecords=registros;
   solicitacoes.sort((a,b)=>(a.nome||a.assunto||'').localeCompare(b.nome||b.assunto||'','pt-BR'));
   requestRecords.sort((a,b)=>String(b.createdAtText||'').localeCompare(String(a.createdAtText||'')));
   queryFreshAt.set('solicitacoes',Date.now());
   cacheEscrever('solicitacoes_resumo',[...solicitacoes,...requestRecords]);
   renderRequests();

 }catch(e){$('#reqList').innerHTML=`<div class="placeholder"><h3>ERRO AO CARREGAR</h3><p>${esc(e.message)}</p></div>`}
}
function allRequestModels(){return [...BUILTIN_REQUEST_MODELS,
...solicitacoes]}
function renderRequests(){
 const q=($('#reqSearch').value||'').toLowerCase(),
tp=$('#reqTypeFilter').value;

 const models=allRequestModels();

 const list=models.filter(r=>(!tp||r.tipo===tp)&&(!q||[r.nome,
r.assunto,
r.tipo,
requestTypeName(r.tipo),
r.group,
r.origem,
r.detalhes].join(' ').toLowerCase().includes(q)));

 const custom=solicitacoes.length;

 $('#reqStats').innerHTML=`<span><b>${models.length}</b> MODELOS</span><span><b>${BUILTIN_REQUEST_MODELS.length}</b> PADRÃO HIGH</span><span><b>${custom}</b> PERSONALIZADOS</span><span><b>${list.length}</b> EXIBIDOS</span>`;

 if(!list.length){$('#reqList').innerHTML='<div class="placeholder"><b>▤</b><h3>NENHUM MODELO ENCONTRADO</h3><p>Ajuste os filtros ou crie um novo modelo de referência.</p></div>';
return}
 $('#reqList').innerHTML=list.map(r=>`<article class="req-card model-card" data-id="${esc(r.id)}"><div class="req-card-top"><div><span class="protocol">${r.builtin?'PADRÃO HIGH':'MODELO SALVO'}</span><h3>${esc(r.nome||r.assunto||requestTypeName(r.tipo))}</h3></div><span class="req-status s-concluida">${esc(requestTypeName(r.tipo))}</span></div><div class="req-meta">${esc(r.assunto||defaultSubject(r.tipo))}</div><p>${esc((r.detalhes||TYPE_PLACEHOLDERS[r.tipo]||'').slice(0,210))}</p><div class="req-footer"><span>${esc(r.origem||'Biblioteca High OS')}</span><button class="mini-btn generate-model" data-id="${esc(r.id)}">GERAR / COPIAR</button></div></article>`).join('');

 document.querySelectorAll('.generate-model').forEach(b=>b.onclick=e=>{e.stopPropagation();openRequestModal(b.dataset.id)});

 document.querySelectorAll('.model-card').forEach(c=>c.onclick=()=>openRequestModal(c.dataset.id));

}
function requestRoutePoints(){
 const d=$('#reqDetalhes')?.value||'';

 let pts=getDetailBlock('Blips da rota nova',d);

 if(!pts.length)pts=String(d).split(/\r?\n/).map(x=>x.trim()).filter(x=>/^\{?\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?(?:\s*,\s*-?\d+(?:\.\d+)?)?\s*\}?,?$/.test(x));

 return pts.map(x=>x.replace(/,$/,'').trim()).filter(Boolean);

}
function syncRouteRequestAction(){
 const box=$('#routeRequestSyncBox'),
btn=$('#applyRouteRequestBtn');
if(!box||!btn)return;

 const isRoute=$('#reqTipo')?.value==='ROTA_FARM',
group=$('#reqGroup')?.value||'',
pts=isRoute?requestRoutePoints():[];

 box.classList.toggle('hidden',!isRoute);

 const note=box.querySelector('span');

 if(!group){btn.disabled=true;
btn.textContent='SELECIONE UM GROUP';
if(note)note.textContent='Selecione o Group para conectar esta solicitação ao Perfil Técnico.';
return}
 btn.disabled=!pts.length;
btn.textContent=pts.length?`CRIAR SOLICITAÇÃO + SALVAR ${pts.length} CDS`:'ADICIONE AS CDS DO TAKEFARM';

 if(note)note.textContent=pts.length?`${pts.length} CDS detectadas. Esta é a exceção do fluxo: a Solicitação alimentará o Perfil Técnico e marcará a rota como EXCLUSIVA.`:'Cole abaixo as CDS recebidas pelo takefarm. Para os demais recursos, o fluxo continua Perfil → comparação → Solicitação.';

}
async function applyRouteRequestToProfile(){
 const group=$('#reqGroup')?.value||'',
tipo=$('#reqTipo')?.value||'';
if(tipo!=='ROTA_FARM')return;

 if(!group)return alert('Selecione o Group da rota.');

 const pts=requestRoutePoints();
if(!pts.length)return alert('Não encontrei CDS válidas em “Blips da rota nova”.');

 const f=faccoes.find(x=>x.group===group);
if(!f)return alert('Group não encontrado na base atual.');

 const oldT=mergedTechProfile(f),
nextT=clonePlain(oldT),
routePoints=pts.join('\n'),
routeName=`RotaExclusiva${group}`,
oldRoute=oldT.rota||{};
 const benefits={...(f.beneficios||{}),
rotaExclusiva:true,
rotaBlips:routePoints};
 const routeSame=String(oldRoute.nome||'')===routeName
  &&String(oldRoute.pontos||'')===routePoints
  &&String(oldRoute.origem||'')==='SOLICITACAO_TAKEFARM'
  &&f.beneficios?.rotaExclusiva===true
  &&String(f.beneficios?.rotaBlips||'')===routePoints;
 if(routeSame){try{await copyRequestText()}catch{}return alert('Esta rota exclusiva já está cadastrada com as mesmas CDS.')}

nextT.rota=nextT.rota||{};
nextT.rota.nome=routeName;
nextT.rota.pontos=routePoints;
nextT.rota.origem='SOLICITACAO_TAKEFARM';
nextT.rota.atualizadoPor=currentUser.email;
nextT.rota.atualizadoEm=new Date().toISOString();

 // O início/farm do Group não é substituído pelas 35 CDS: elas são somente os pontos da rota exclusiva.
 syncFarmWithCraft(nextT);

 try{
  const routeBatch=writeBatch(db);
  routeBatch.set(doc(db,'highos','data','faccoes',idFac(group)),{perfilTecnico:nextT,
beneficios:benefits,
updatedAt:serverTimestamp(),
updatedBy:currentUser.email},{merge:true});

  routeBatch.set(doc(histCol),{sessionId:currentSessionId||'',
tipo:'ROTA_EXCLUSIVA_SOLICITADA',
group,
descricao:`Solicitação de rota exclusiva criada e Perfil Técnico alimentado automaticamente • ${pts.length} CDS do takefarm`,
rotaPontos:pts,
solicitacaoTexto:buildRequestText(),
origem:'SOLICITACAO_TAKEFARM',
usuario:currentUser.email,
data:serverTimestamp()});
  await routeBatch.commit();

  const ix=faccoes.findIndex(x=>x.group===group);
  if(ix>=0){
   faccoes[ix]={...faccoes[ix],perfilTecnico:clonePlain(nextT),beneficios:clonePlain(benefits),updatedBy:currentUser.email};
   queryFreshAt.set('faccoes',Date.now());
  }
  renderFaccoes();
  renderAvailableFaccoes();

  try{await copyRequestText()}catch{}
  if(typeof currentGroupProfile!=='undefined'&&currentGroupProfile?.group===group){const fresh=faccoes.find(x=>x.group===group);
if(fresh){renderTechProfile(fresh);
$('#fRotaExclusiva').checked=true;
renderRouteOverview();
}}
  alert(`Solicitação criada para ${group}.\n\n${pts.length} CDS do takefarm foram salvas no Perfil Técnico.\nA rota foi marcada como EXCLUSIVA e o texto foi copiado para o Discord.`);

 }catch(err){alert('Erro ao salvar a rota no perfil: '+err.message)}
}

let requestModelSaveInFlight=false;
async function saveRequestModel(e){
 e.preventDefault();
 if(requestModelSaveInFlight)return;

 const id=$('#reqId').value;

 const tipo=$('#reqTipo').value;

 const modelData={isModelo:true,
tipo,
nome:$('#reqModelName').value.trim()||requestTypeName(tipo),
assunto:$('#reqAssunto').value.trim()||defaultSubject(tipo),
detalhes:$('#reqDetalhes').value.trim(),
origem:'Biblioteca High OS'};
 const payload={...modelData,
updatedAt:serverTimestamp(),
updatedBy:currentUser.email};

 let ref=null;
 requestModelSaveInFlight=true;
 const submitBtn=e?.submitter||$('#reqForm')?.querySelector('[type="submit"]');
 if(submitBtn)submitBtn.disabled=true;
 try{
   if(id){
const old=solicitacoes.find(x=>x.id===id);
const same=old&&Object.keys(modelData).every(k=>String(old[k]??'')===String(modelData[k]??''));
if(same){$('#reqModal').classList.add('hidden');return}
await setDoc(doc(db,'highos','data','solicitacoes',id),payload,{merge:true});
await addDoc(histCol,{sessionId:currentSessionId||'',
tipo:'MODELO_SOLICITACAO_EDITADO',
solicitacaoId:id,
descricao:payload.nome,
usuario:currentUser.email,
data:serverTimestamp()});
}
   else{ref=await addDoc(reqCol,{...payload,
createdAt:serverTimestamp(),
createdBy:currentUser.email});
await addDoc(histCol,{sessionId:currentSessionId||'',
tipo:'MODELO_SOLICITACAO_CRIADO',
solicitacaoId:ref.id,
descricao:payload.nome,
usuario:currentUser.email,
data:serverTimestamp()});
}
   $('#reqModal').classList.add('hidden');
if(id){
 const ix=solicitacoes.findIndex(x=>x.id===id);
 if(ix>=0)solicitacoes[ix]={...solicitacoes[ix],...modelData,updatedBy:currentUser.email};
}else{
 const createdId=ref?.id;
 if(createdId)solicitacoes.unshift({id:createdId,...modelData,createdBy:currentUser.email,updatedBy:currentUser.email});
}
solicitacoes.sort((a,b)=>(a.nome||a.assunto||'').localeCompare(b.nome||b.assunto||'','pt-BR'));
queryFreshAt.set('solicitacoes',Date.now());
renderRequests();

 }catch(err){alert('Erro ao salvar modelo: '+err.message)}
 finally{
  requestModelSaveInFlight=false;
  if(submitBtn)submitBtn.disabled=false;
 }
}
function manualRequestMutation(tipo,d,f={}){
 const t=mergedTechProfile(f),
 o=clonePlain(t.operacional||opBlank()),
 b={...(f.beneficios||{})};
 let changed=false,desc='';

 // Uma cópia de modelo com "{x,y,z,h}" não deve cadastrar blips fictícios.
 const cds=(label)=>getDetailValue(label,d).trim();
 const coordenada=(v)=>{
  const raw=String(v||'').trim();
  return /^\{?\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?(?:\s*,\s*-?\d+(?:\.\d+)?)?\s*\}?$/.test(raw)?raw:'';
 };
 const newPair=(blip,spawn)=>({blip:coordenada(blip),spawn:coordenada(spawn)});
 const upGarage=(kind,obj)=>{
  if(!obj.blip||!obj.spawn)return false;
  o.garagens=Array.isArray(o.garagens)?o.garagens:[];
  const i=o.garagens.findIndex(x=>x.tipo===kind&&(x.blip===obj.blip||x.spawn===obj.spawn));
  const old=i>=0?o.garagens[i]:{};
  const next={...old,...obj,veiculos:obj.veiculos||old.veiculos||'',tipo:kind};
  if(samePlain(old,next))return false;
  if(i>=0)o.garagens[i]=next;
  else o.garagens.push(next);
  changed=true;
  return true;
 };

 if(tipo==='TELAO'){
  const next={...(o.telao||{}),ativo:true,
   modelo:cds('Modelo do Telão')||cds('Telão usado')||o.telao?.modelo||'',
   postit:coordenada(cds('CDS/postit'))||o.telao?.postit||'',
   cds:coordenada(cds('CDS'))||o.telao?.cds||'',permissao:f.group||''};
  if(!samePlain(o.telao,next)){
   o.telao=next;b.telao=true;b.telaoNome=next.modelo;
   b.telaoPostit=next.postit;b.telaoCds=next.cds;
   changed=true;desc='Telão';
  }
 }else if(tipo==='GARAGEM'||tipo==='GARAGEM_VIP'||tipo==='GARAGEM_SERVICO'){
  const kind=tipo==='GARAGEM'?'PUBLICA':tipo==='GARAGEM_VIP'?'FACCAO':'SERVICO';
  const obj={tipo:kind,...newPair(cds('Blip'),cds('Spawn')),veiculos:cds('Veículos')||cds('Veiculo')};
  if(upGarage(kind,obj)){
   desc=tipo==='GARAGEM'?'Garagem Pública':tipo==='GARAGEM_VIP'?'Garagem VIP':'Garagem de Serviço';
   if(kind==='PUBLICA'){b.garagemPublica=true;b.garagemPublicaBlip=obj.blip;b.garagemPublicaSpawn=obj.spawn;}
   if(kind==='FACCAO'){b.garagemVip=true;b.garagemVipBlip=obj.blip;b.garagemVipSpawn=obj.spawn;
    if(obj.veiculos)b.garagemVipVeiculos=obj.veiculos;}
  }
 }else if(tipo==='GARAGEM_BLINDADOS'){
  const old=o.blindados||{};
  const coords=newPair(cds('Blip'),cds('Spawn da garagem')||cds('Spawn'));
  if(coords.blip&&coords.spawn){
   const next={...old,...coords,
    vagas:cds('Quantidade de vagas')||old.vagas||'',
    veiculos:cds('Spawn do veículo blindado')||cds('Veículos')||old.veiculos||''};
   if(!samePlain(old,next)){o.blindados=next;changed=true;desc='Garagem de Blindados';}
  }
 }else if(tipo==='HELIPONTO'){
  const obj=newPair(cds('Blip')||cds('Heliponto')||cds('CDS'),cds('Spawn'));
  if(obj.blip&&obj.spawn){
   const items=Array.isArray(o.helipontos)?o.helipontos:[];
   const i=items.findIndex(x=>x.blip===obj.blip||x.spawn===obj.spawn);
   const old=i>=0?items[i]:{};
   const next={...old,...obj};
   if(!samePlain(old,next)){
    if(i>=0)items[i]=next;else items.push(next);
    o.helipontos=items;b.heliponto=true;
    b.helipontoBlip=obj.blip;b.helipontoSpawn=obj.spawn;
    changed=true;desc='Heliponto';
   }
  }
 }else if(tipo==='LOJA_FACCAO'){
  const position=coordenada(cds('CDS')||cds('Blip'));
  if(position){
   const next={...(o.lojaFac||{}),cds:position};
   if(!samePlain(o.lojaFac,next)){
    o.lojaFac=next;b.shopExclusivo=position;changed=true;desc='Loja da Facção';
   }
  }
 }
 t.operacional=o;
 return {changed,perfilTecnico:t,beneficios:b,descricao:desc};
}
async function copyRequestText(){
 const text=$('#reqPreview').value,
group=$('#reqGroup')?.value||'',
tipo=$('#reqTipo')?.value||'GERAL',
d=$('#reqDetalhes')?.value||'',
f=faccoes.find(x=>x.group===group);

 try{
  if(group&&f){const mut=manualRequestMutation(tipo,d,f);
if(mut.changed){const yes=confirm(`Essa solicitação vai gerar modificações no Group ${group}.\n\nAlteração detectada: ${mut.descricao||requestTypeName(tipo)}.\n\nDeseja que as mesmas sejam cadastradas no Group?`);
if(yes){const previousGroup=clonePlain(f);
await setDoc(doc(db,'highos','data','faccoes',idFac(group)),{perfilTecnico:mut.perfilTecnico,
beneficios:mut.beneficios,
updatedAt:serverTimestamp(),
updatedBy:currentUser?.email||''},{merge:true});
const ix=faccoes.findIndex(x=>x.group===group);
if(ix>=0){faccoes[ix].perfilTecnico=clonePlain(mut.perfilTecnico);
faccoes[ix].beneficios=clonePlain(mut.beneficios)}await addDoc(histCol,{sessionId:currentSessionId||'',
tipo:'SOLICITACAO_APLICADA_AO_GROUP',
group,
descricao:`${mut.descricao||requestTypeName(tipo)} cadastrada no Group a partir de solicitação`,
solicitacaoTexto:text,
usuario:currentUser?.email||'',
data:serverTimestamp()});
const currentGroup={...previousGroup,perfilTecnico:mut.perfilTecnico,beneficios:mut.beneficios};
const synced=await syncBlipsGroups([currentGroup],{quiet:true,overwriteFieldsByGroup:blipsChangedFieldsByGroup([previousGroup],[currentGroup])});
if(!synced)facSheetRenderStatus('warn','Solicitação aplicada ao Group; BLIPS COORDENADAS pendente de sincronização.');
}}
   await archiveTechnicalRequest({tipo,
titulo:$('#reqAssunto')?.value||requestTypeName(tipo),
texto:text},f,'CENTRAL_DE_SOLICITACOES');

  }
  await navigator.clipboard.writeText(text);
const b=$('#copyReqBtn'),
old=b.textContent;
b.textContent='COPIADO + ARQUIVADO ✓';
setTimeout(()=>b.textContent=old,1600)
 }catch(e){try{$('#reqPreview').select();
document.execCommand('copy')}catch{}alert('O texto foi preparado, mas ocorreu um erro ao registrar/sincronizar: '+(e?.message||e))}
}
function slug(v){return (v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-')}

initRequestUi();

const _loadFaccoesV3=loadFaccoes;

loadFaccoes=async function(){await _loadFaccoesV3();
updateRequestGroupOptions($('#reqGroup')?.value||'')};

// ===== HIGH OS V4 · GESTÃO DE USUÁRIOS =====
function renderUserPermissionMatrix(values={}){
 const box=$('#userPermissionMatrix');
if(!box)return;
const role=$('#uRole')?.value||'CONSULTA';
const base=defaultPermissionsForRole(role);

 box.innerHTML=SYSTEM_MODULES.map(m=>{const val=normalizePermission(Object.prototype.hasOwnProperty.call(values||{},m.id)?values[m.id]:base[m.id]);return `<div class="permission-row"><div><b>${esc(m.label)}</b><small>${esc(m.desc)}</small></div><select class="module-permission-select" data-module="${esc(m.id)}"><option value="NONE" ${val==='NONE'?'selected':''}>SEM ACESSO</option><option value="VIEW" ${val==='VIEW'?'selected':''}>VISUALIZAR</option><option value="EDIT" ${val==='EDIT'?'selected':''}>EDITAR</option></select></div>`}).join('');

}
function readUserPermissions(){const out={};
document.querySelectorAll('#userPermissionMatrix .module-permission-select').forEach(el=>out[el.dataset.module]=normalizePermission(el.value));
return out}
function applyPermissionPreset(type){const role=$('#uRole')?.value||'CONSULTA';
const values={};
if(type==='NONE')SYSTEM_MODULES.forEach(m=>values[m.id]='NONE');
else if(type==='VIEW')SYSTEM_MODULES.forEach(m=>values[m.id]='VIEW');
else if(type==='OPERATIONAL')SYSTEM_MODULES.forEach(m=>values[m.id]=m.id==='historico'?'VIEW':'EDIT');
else Object.assign(values,defaultPermissionsForRole(role));
renderUserPermissionMatrix(values)}
function initUsersUi(){
 const nb=$('#newUserBtn');
 if(!nb)return;

 nb.onclick=()=>openUserModal();

 $('#userModalClose').onclick=()=>$('#userModal').classList.add('hidden');

 $('#userModal').addEventListener('click',e=>{if(e.target.id==='userModal')$('#userModal').classList.add('hidden')});

 $('#userSearch').addEventListener('input',renderUsers);

 $('#userRoleFilter').addEventListener('change',renderUsers);

 $('#userStatusFilter').addEventListener('change',renderUsers);

 $('#userForm').addEventListener('submit',saveUser);

 $('#toggleUserBtn').onclick=toggleUserAccess;

 $('#uRole')?.addEventListener('change',()=>{const original=$('#userOriginalEmail')?.value||'';const u=original?usuarios.find(x=>x.email===original):null;if(!u?.permissions)renderUserPermissionMatrix(defaultPermissionsForRole($('#uRole').value))});

 $('#permPresetView')?.addEventListener('click',()=>applyPermissionPreset('VIEW'));

 $('#permPresetOperational')?.addEventListener('click',()=>applyPermissionPreset('OPERATIONAL'));

 $('#permPresetNone')?.addEventListener('click',()=>applyPermissionPreset('NONE'));

}
function assertAdmin(){if(String(currentProfile?.role||'').toUpperCase()!=='ADMIN'){alert('Apenas ADMIN pode gerenciar usuários.');
return false}return true}
async function loadUsers(){
 if(!assertAdmin())return;
 try{
  usuarios=(await highOsStoreList('users')).map(x=>({email:String(x.email||x.id||'').toLowerCase(),...x})).sort((a,b)=>(a.name||a.email).localeCompare(b.name||b.email,'pt-BR'));
  renderUsers();
 }catch(e){$('#userList').innerHTML=`<div class="placeholder"><h3>ERRO AO CARREGAR</h3><p>${esc(e.message)}</p></div>`}
}
function renderUsers(){
 if(!$('#userList'))return;

 const q=($('#userSearch').value||'').toLowerCase(),
 role=$('#userRoleFilter').value,
 st=$('#userStatusFilter').value;

 const list=usuarios.filter(u=>(!role||String(u.role||'CONSULTA').toUpperCase()===role)&&(!st||(st==='ATIVO'?u.active===true:u.active!==true))&&(!q||[u.name,
u.cargo,
u.email,
u.role,
u.notes].join(' ').toLowerCase().includes(q)));

 const ativos=usuarios.filter(u=>u.active===true).length,
 admins=usuarios.filter(u=>String(u.role||'').toUpperCase()==='ADMIN'&&u.active===true).length;

 $('#userStats').innerHTML=`<span><b>${usuarios.length}</b> CADASTRADOS</span><span><b>${ativos}</b> ATIVOS</span><span><b>${usuarios.length-ativos}</b> INATIVOS</span><span><b>${admins}</b> ADMINS</span><span><b>${list.length}</b> EXIBIDOS</span>`;

 if(!usuarios.length){$('#userList').innerHTML='<div class="placeholder"><b>♟</b><h3>NENHUM USUÁRIO</h3><p>Cadastre a primeira conta autorizada.</p></div>';
return}
 $('#userList').innerHTML=list.map(u=>`<article class="user-row" data-email="${esc(u.email)}"><div class="user-avatar">${esc((u.name||u.email||'?').slice(0,1).toUpperCase())}</div><div class="user-main"><strong>${esc(u.name||'Sem nome')}</strong><span>${esc(u.email)}</span><small class="user-cargo-line">${esc(u.cargo||String(u.role||'CONSULTA').toUpperCase())}</small>${u.notes?`<small>${esc(u.notes)}</small>`:''}</div><div class="user-tags"><span class="role-chip r-${slug(u.role)}">${esc(String(u.role||'CONSULTA').toUpperCase())}</span><span class="status-chip ${u.active===true?'ativa':'inativa'}">${u.active===true?'ATIVO':'INATIVO'}</span><small class="perm-summary">${(()=>{const p={...defaultPermissionsForRole(u.role),...(u.permissions||{})};const v=SYSTEM_MODULES.filter(m=>['VIEW','EDIT'].includes(normalizePermission(p[m.id]))).length,e=SYSTEM_MODULES.filter(m=>normalizePermission(p[m.id])==='EDIT').length;return `${v}/${SYSTEM_MODULES.length} módulos • ${e} editáveis`})()}</small></div><div class="user-row-actions"><button type="button" class="mini-btn user-activity-btn" data-activity="${esc(u.email)}">ATIVIDADE</button><button type="button" class="mini-btn user-edit-btn">EDITAR</button></div></article>`).join('');
 document.querySelectorAll('.user-row').forEach(r=>{r.querySelector('.user-edit-btn')?.addEventListener('click',e=>{e.stopPropagation();openUserModal(r.dataset.email)});r.querySelector('.user-activity-btn')?.addEventListener('click',e=>{e.stopPropagation();openUserActivity(e.currentTarget.dataset.activity)});r.addEventListener('click',()=>openUserModal(r.dataset.email));});
}
function openUserModal(email=''){
 if(!assertAdmin())return;
 const u=email?usuarios.find(x=>x.email===email):null;
 $('#userOriginalEmail').value=u?.email||'';
 $('#uEmail').value=u?.email||''; $('#uEmail').disabled=!!u;
 $('#uName').value=u?.name||''; $('#uCargo').value=u?.cargo||''; $('#uRole').value=String(u?.role||'CONSULTA').toUpperCase(); $('#uActive').value=u?.active===false?'false':'true'; $('#uNotes').value=u?.notes||'';
 renderUserPermissionMatrix(u?.permissions||defaultPermissionsForRole(String(u?.role||'CONSULTA').toUpperCase()));
 $('#userModalTitle').textContent=u?'EDITAR USUÁRIO':'NOVO USUÁRIO';
 $('#toggleUserBtn').style.display=u?'block':'none';
 $('#toggleUserBtn').textContent=u?.active===true?'DESATIVAR ACESSO':'REATIVAR ACESSO';
 $('#toggleUserBtn').className=u?.active===true?'btn-danger':'btn-secondary';
 $('#userModal').classList.remove('hidden');
}
async function saveUser(e){
 e.preventDefault(); if(!assertAdmin())return;
 const original=$('#userOriginalEmail').value.trim().toLowerCase(), email=$('#uEmail').value.trim().toLowerCase();
 if(!email){alert('Informe o e-mail Google.');return}
 const old=original?usuarios.find(x=>x.email===original):null;
 const userData={email,name:$('#uName').value.trim(),cargo:$('#uCargo').value.trim(),role:$('#uRole').value,active:$('#uActive').value==='true',notes:$('#uNotes').value.trim(),permissions:readUserPermissions()};
 const payload={...userData,updatedAt:serverTimestamp(),updatedBy:currentUser.email};
 if(email===String(currentUser.email||'').toLowerCase() && payload.active!==true){alert('Você não pode desativar sua própria conta enquanto está logado.');return}
 if(old){
  const same=['email','name','cargo','role','active','notes'].every(k=>String(old[k]??'')===String(userData[k]??''))
   &&JSON.stringify(old.permissions||{})===JSON.stringify(userData.permissions||{});
  if(same){$('#userModal').classList.add('hidden');return}
 }
 try{
  await highOsStorePut('users',email,{...userData,updatedAt:new Date().toISOString(),updatedBy:currentUser.email});
  await addDoc(histCol,{sessionId:currentSessionId||'',tipo:old?'USUARIO_EDITADO':'USUARIO_CRIADO',usuarioAlvo:email,antes:snapshot(old),depois:snapshot(payload),usuario:currentUser.email,data:serverTimestamp()});
  $('#userModal').classList.add('hidden');
  const local={...(old||{}),...clonePlain(userData),updatedBy:currentUser.email};
  const ix=usuarios.findIndex(x=>x.email===email);
  if(ix>=0)usuarios[ix]=local;else usuarios.push(local);
  usuarios.sort((a,b)=>(a.name||a.email).localeCompare(b.name||b.email,'pt-BR'));
  queryFreshAt.set('usuarios',Date.now());
  if(email===String(currentUser?.email||'').toLowerCase()){currentProfile={...currentProfile,...local};if($('#userName'))$('#userName').textContent=local.name||currentUser?.displayName||email;if($('#userRole'))$('#userRole').textContent=local.cargo||local.role;if($('#userAccessLevel'))$('#userAccessLevel').textContent='ACESSO: '+String(local.role||'CONSULTA').toUpperCase();renderSessionClock(email);applyModuleAccess(local.role);}
  renderUsers();
 }catch(err){alert('Erro ao salvar usuário: '+err.message)}
}
async function toggleUserAccess(){
 if(!assertAdmin())return;
 const email=$('#userOriginalEmail').value.trim().toLowerCase(), old=usuarios.find(x=>x.email===email); if(!old)return;
 if(email===String(currentUser.email||'').toLowerCase() && old.active===true){alert('Você não pode desativar sua própria conta enquanto está logado.');return}
 const next=old.active!==true;
 if(!confirm(`${next?'Reativar':'Desativar'} o acesso de ${old.name||email}?`))return;
 try{
  await highOsStorePut('users',email,{...old,active:next,updatedAt:new Date().toISOString(),updatedBy:currentUser.email});
  await addDoc(histCol,{sessionId:currentSessionId||'',tipo:next?'USUARIO_REATIVADO':'USUARIO_DESATIVADO',usuarioAlvo:email,usuario:currentUser.email,data:serverTimestamp()});
  $('#userModal').classList.add('hidden');
  const ix=usuarios.findIndex(x=>x.email===email);
  if(ix>=0)usuarios[ix]={...usuarios[ix],active:next,updatedBy:currentUser.email};
  queryFreshAt.set('usuarios',Date.now());
  renderUsers();
 }catch(err){alert('Erro ao alterar acesso: '+err.message)}
}
initUsersUi();

// ===== HIGH OS V8.15 · SESSÕES E AUDITORIA DE USUÁRIOS =====
let userSessions=[],userSessionsLoadedAt=0;
const AUDIT_CACHE_TTL=120000;
function auditModule(tipo=''){
 const t=String(tipo||'').toUpperCase();
 if(t.includes('SESSION')||t.includes('LOGIN')||t.includes('USUARIO'))return 'ACESSO';
 if(t.includes('CRAFT')||t.includes('FARM')||t.includes('ROTA'))return 'CRAFT / FARM';
 if(t.includes('SEGMENT'))return 'SEGMENTOS';
 if(t.includes('METRIC'))return 'MÉTRICAS';
 if(t.includes('SOLICIT')||t.includes('MODELO'))return 'SOLICITAÇÕES';
 if(t.includes('ENTREGA'))return 'ENTREGAS';
 if(t.includes('RECOLH'))return 'RECOLHIMENTO';
 if(t.includes('SYNC')||t.includes('PLANILHA'))return 'PLANILHA';
 if(t.includes('ORGANIZ'))return 'FACÇÕES';
 if(t.includes('QG')||t.includes('EDICAO')||t.includes('ALTER')||t.includes('TRANSFER'))return 'GROUPS / QGs';
 if(t.includes('ADM'))return 'ADMIN';return 'SISTEMA';
}
function auditTarget(h){return [h.group,h.faccao,h.usuarioAlvo,h.segmento,h.alvo].filter(Boolean).join(' • ')||'—'}
function sessionStartMs(x){const d=x?.startAt;try{if(d?.toDate)return d.toDate().getTime();if(d?.seconds)return d.seconds*1000;if(x?.startAtText)return new Date(x.startAtText).getTime()}catch(e){}return 0}
function sessionEndMs(x){const d=x?.endAt;try{if(d?.toDate)return d.toDate().getTime();if(d?.seconds)return d.seconds*1000;if(x?.endAtText)return new Date(x.endAtText).getTime()}catch(e){}return 0}
function fmtDateMs(ms){return ms?new Date(ms).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'}):'—'}
function sessionActions(sess){return historico.filter(h=>h.sessionId===sess.sessionId&&!['SESSION_START','SESSION_END'].includes(String(h.tipo||'').toUpperCase())).sort((a,b)=>(historyDateValue(a)?.getTime()||0)-(historyDateValue(b)?.getTime()||0))}
function sessionEffectiveEnd(sess){const end=sessionEndMs(sess);if(end)return end;if(sess.sessionId===currentSessionId)return Date.now();const last=sessionActions(sess).map(h=>historyDateValue(h)?.getTime()||0).filter(Boolean).pop();return last||Number(sess.lastActivityText?new Date(sess.lastActivityText).getTime():0)||sessionStartMs(sess)}
function sessionDuration(sess){return Math.min(SESSION_MAX_MS,Math.max(0,Number(sess.durationMs)||sessionEffectiveEnd(sess)-sessionStartMs(sess)))}
function isSameLocalDay(ms,base=Date.now()){if(!ms)return false;const a=new Date(ms),b=new Date(base);return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate()}

/* =====================================================================
   HIGH OS V10.3 - PAINEL DE SAUDE DO SISTEMA
   ---------------------------------------------------------------------
   Reune num lugar so o que hoje esta espalhado: consumo de cota (que
   estava escondido dentro de Metricas), de onde vieram os dados, quando
   foi a ultima sincronizacao, quantas sessoes estao abertas e ha quanto
   tempo nao se faz backup.

   Nao consulta nada novo: usa os contadores da sessao e o que ja esta
   carregado em memoria.
   ===================================================================== */
function saudeTempoDesde(iso){
 if(!iso)return null;
 const t=new Date(iso).getTime();
 if(!Number.isFinite(t))return null;
 const dias=Math.floor((Date.now()-t)/86400000);
 if(dias>=1)return `${dias} dia(s) atrás`;
 const horas=Math.floor((Date.now()-t)/3600000);
 if(horas>=1)return `${horas} hora(s) atrás`;
 return 'há poucos minutos';
}
function saudeUltimoBackup(){
 try{return localStorage.getItem('highos_ultimo_backup')||''}catch(e){return ''}
}
function saudeUltimaSync(){
 try{
  const ultimo=Number(localStorage.getItem(METRIC_SYNC_LOCK)||0);
  return ultimo?new Date(ultimo).toISOString():'';
 }catch(e){return ''}
}
function saudeCartao(rotulo,valor,estado='ok',detalhe=''){
 return `<div class="saude-card ${estado}">
   <span>${esc(rotulo)}</span>
   <b>${esc(valor)}</b>
   ${detalhe?`<small>${esc(detalhe)}</small>`:''}
 </div>`;
}

/* =====================================================================
   HIGH OS V10.4 - BUSCA GLOBAL (Ctrl+K)
   ---------------------------------------------------------------------
   Ate aqui, achar onde uma faccao aparecia exigia abrir modulo por
   modulo. Esta busca varre o que ja esta carregado em memoria -
   Groups, organizacoes, solicitacoes, entregas, historico, usuarios,
   missoes do planejador - e leva direto ao lugar certo.

   Nao faz nenhuma leitura no Firebase: e busca em memoria. O que nao
   estiver carregado (o modulo nunca aberto na sessao) simplesmente nao
   aparece, e o rodape avisa isso.
   ===================================================================== */
const BUSCA_MAX_POR_TIPO=6;

function buscaNorm(v){return alvesNorm(String(v??'')).replace(/\s+/g,' ').trim()}
function buscaCasa(termo,...campos){
 const alvo=buscaNorm(campos.filter(Boolean).join(' '));
 return termo.split(' ').every(parte=>alvo.includes(parte));
}
function buscaDestacar(texto,termo){
 const t=esc(String(texto||''));
 const partes=termo.split(' ').filter(x=>x.length>1);
 if(!partes.length)return t;
 let saida=t;
 for(const parte of partes){
  const re=new RegExp('('+parte.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','ig');
  saida=saida.replace(re,'<mark>$1</mark>');
 }
 return saida;
}

function buscaResultados(termoBruto){
 const termo=buscaNorm(termoBruto);
 if(termo.length<2)return [];
 const grupos=[];
 const add=(tipo,rotulo,itens,pagina)=>{
  if(itens.length)grupos.push({tipo,rotulo,pagina,itens:itens.slice(0,BUSCA_MAX_POR_TIPO),total:itens.length});
 };

 add('group','GROUPS E FACÇÕES',(faccoes||[])
  .filter(f=>buscaCasa(termo,f.group,f.faccao,f.lider,f.qg,f.segmento,f.staff))
  .map(f=>({titulo:f.group||'(sem Group)',detalhe:[f.faccao,f.lider,f.segmento].filter(Boolean).join(' • ')||'sem facção vinculada',acao:()=>{activateAppPage('faccoes');setTimeout(()=>{try{showGroupProfilePage(f)}catch(err){console.warn('[BUSCA]',err)}},140)}})),'faccoes');

 add('org','ORGANIZAÇÕES',(organizacoes||[])
  .filter(o=>buscaCasa(termo,o.nome,o.group,o.tipo,o.status))
  .map(o=>({titulo:o.nome||o.group||'(sem nome)',detalhe:[o.group,o.status].filter(Boolean).join(' • '),acao:()=>activateAppPage('faccoes')})),'faccoes');


 add('entrega','ENTREGAS',(entregas||[])
  .filter(e=>buscaCasa(termo,e.group,e.faccao,e.lider,e.responsavel))
  .map(e=>({titulo:`${e.group||''} → ${e.faccao||''}`.trim(),detalhe:[e.lider,e.dataTexto||e.data].filter(Boolean).join(' • '),acao:()=>activateAppPage('faccoes')})),'faccoes');

 add('hist','HISTÓRICO CARREGADO',(historico||[])
  .filter(h=>buscaCasa(termo,h.group,h.faccao,h.descricao,h.tipo,h.usuario))
  .map(h=>({titulo:h.tipo||'evento',detalhe:[h.group,h.descricao].filter(Boolean).join(' • ').slice(0,110),acao:()=>activateAppPage('historico')})),'historico');

 if(isAdmin())add('user','USUÁRIOS',(usuarios||[])
  .filter(u=>buscaCasa(termo,u.email,u.name,u.cargo,u.role))
  .map(u=>({titulo:u.name||u.email,detalhe:[u.email,u.role].filter(Boolean).join(' • '),acao:()=>activateAppPage('usuarios')})),'usuarios');

 let missoes=[];
 try{missoes=JSON.parse(localStorage.getItem('highos_mission_planner_v832_missions')||'[]')||[]}catch(e){}
 add('missao','MISSÕES DO PLANEJADOR',missoes
  .filter(m=>buscaCasa(termo,m.name,m.event,m.category))
  .map(m=>({titulo:m.name||'(zona)',detalhe:[m.event,`${(m.points||[]).length} spawns`].filter(Boolean).join(' • '),acao:()=>activateAppPage('planejador')})),'planejador');

 return grupos;
}

function buscaFechar(){
 document.getElementById('buscaGlobal')?.classList.remove('aberta');
 document.body.classList.remove('busca-aberta');
}
function buscaAbrir(){
 buscaMontar();
 const cx=document.getElementById('buscaGlobal');
 cx?.classList.add('aberta');
 document.body.classList.add('busca-aberta');
 const campo=document.getElementById('buscaGlobalInput');
 if(campo){campo.value='';campo.focus();buscaRenderizar('')}
}
function buscaRenderizar(termo){
 const lista=document.getElementById('buscaGlobalLista');
 if(!lista)return;
 if(buscaNorm(termo).length<2){
  lista.innerHTML=`<div class="busca-vazio">Digite ao menos 2 letras. A busca cobre Groups, facções, organizações, solicitações, entregas, histórico já carregado, usuários e missões.</div>`;
  return;
 }
 const grupos=buscaResultados(termo);
 const total=grupos.reduce((n,g)=>n+g.total,0);
 if(!total){
  lista.innerHTML=`<div class="busca-vazio">Nada encontrado para <b>${esc(termo)}</b>. Módulos que você ainda não abriu nesta sessão não entram na busca.</div>`;
  return;
 }
 const t=buscaNorm(termo);
 lista.innerHTML=grupos.map((g,gi)=>`
  <div class="busca-grupo">
   <div class="busca-grupo-top">${esc(g.rotulo)}<span>${g.total>g.itens.length?`${g.itens.length} de ${g.total}`:`${g.total}`}</span></div>
   ${g.itens.map((it,ii)=>`
    <button type="button" class="busca-item" data-g="${gi}" data-i="${ii}">
     <b>${buscaDestacar(it.titulo,t)}</b>
     <small>${buscaDestacar(it.detalhe||'',t)}</small>
    </button>`).join('')}
  </div>`).join('');
 lista.querySelectorAll('.busca-item').forEach(b=>b.addEventListener('click',()=>{
  const it=grupos[Number(b.dataset.g)].itens[Number(b.dataset.i)];
  buscaFechar();
  try{it.acao()}catch(e){console.warn('[BUSCA] falha ao navegar:',e)}
 }));
}
let buscaTimer=null;
function buscaMontar(){
 if(document.getElementById('buscaGlobal'))return;
 const cx=document.createElement('div');
 cx.id='buscaGlobal';cx.className='busca-global';
 cx.innerHTML=`
  <div class="busca-fundo" data-busca-fechar></div>
  <div class="busca-caixa" role="dialog" aria-label="Busca global">
   <div class="busca-topo">
    <span aria-hidden="true">⌕</span>
    <input id="buscaGlobalInput" type="search" autocomplete="off" placeholder="Buscar Group, facção, líder, solicitação, missão...">
    <kbd>ESC</kbd>
   </div>
   <div id="buscaGlobalLista" class="busca-lista"></div>
   <div class="busca-rodape">Busca em memória — não consome cota do Firebase</div>
  </div>`;
 document.body.appendChild(cx);
 cx.querySelector('[data-busca-fechar]')?.addEventListener('click',buscaFechar);
 const campo=cx.querySelector('#buscaGlobalInput');
 campo?.addEventListener('input',e=>{
  clearTimeout(buscaTimer);
  const v=e.target.value;
  buscaTimer=setTimeout(()=>buscaRenderizar(v),140);
 });
 campo?.addEventListener('keydown',e=>{if(e.key==='Escape')buscaFechar()});
}
document.getElementById('buscaGlobalBtn')?.addEventListener('click',buscaAbrir);
document.addEventListener('keydown',e=>{
 if((e.ctrlKey||e.metaKey)&&String(e.key).toLowerCase()==='k'){e.preventDefault();buscaAbrir();return}
 if(e.key==='Escape')buscaFechar();
});

function renderSaudeSistema(){
 const box=document.getElementById('adminSaude');
 if(!box)return;

 const leituras=metricReadCount(), gravacoes=metricWriteCount;
 const pctL=Math.min(100,Math.round(leituras/50000*100));

 const origem=metricOrigem==='PLANILHA'?'Planilha (0 leituras)'
   :metricOrigem==='ESPELHO'?'Espelho mensal'
   :metricOrigem==='COLECAO_ANTIGA'?'Coleção antiga'
   :'Ainda não carregado';
 const estadoOrigem=metricOrigem==='PLANILHA'?'ok':metricOrigem==='COLECAO_ANTIGA'?'alerta':'neutro';

 const sync=saudeUltimaSync(), syncTexto=saudeTempoDesde(sync)||'nesta sessão ainda não';
 const backup=saudeUltimoBackup(), backupTexto=saudeTempoDesde(backup)||'nunca registrado neste navegador';
 const backupDias=backup?Math.floor((Date.now()-new Date(backup).getTime())/86400000):999;
 const estadoBackup=backupDias<=31?'ok':backupDias<=45?'alerta':'erro';

 const sessoesAbertas=(typeof userSessions!=="undefined"?userSessions:[]).filter(x=>String(x.status||'').toUpperCase()==='EM_ANDAMENTO').length;

 box.innerHTML=`
  <div class="saude-head">
   <div><b>SAÚDE DO SISTEMA</b><span>Estado atual da sessão e das integrações. Nenhuma consulta extra é feita para montar este painel.</span></div>
   <button type="button" id="saudeAtualizar">ATUALIZAR</button>
  </div>
  <div class="saude-grid">
   ${saudeCartao('LEITURAS FIRESTORE',leituras.toLocaleString('pt-BR'),'neutro','legado; dados operacionais usam Discord')}
   ${saudeCartao('GRAVAÇÕES FIRESTORE',gravacoes.toLocaleString('pt-BR'),'neutro','legado; dados operacionais usam Discord')}
   ${saudeCartao('ORIGEM DAS MÉTRICAS',origem,estadoOrigem,metricOrigem==='COLECAO_ANTIGA'?'a planilha e o espelho falharam':'')}
   ${saudeCartao('ÚLTIMA SINCRONIZAÇÃO',syncTexto,'neutro',sync?new Date(sync).toLocaleString('pt-BR'):'')}
   ${saudeCartao('ÚLTIMO BACKUP',backupTexto,estadoBackup,estadoBackup==='ok'?'':'rode tools/backup-firestore.html')}
   ${saudeCartao('SESSÕES ABERTAS',String(sessoesAbertas),sessoesAbertas>4?'alerta':'ok','contas com sessão em andamento')}
   ${saudeCartao('STORAGE OPERACIONAL','DISCORD','ok','Bot no PC / Discord Storage')}
   ${saudeCartao('MISSÕES SALVAS',String((JSON.parse(localStorage.getItem('highos_mission_planner_v832_missions')||'[]')||[]).length),'neutro','neste navegador')}
  </div>`;
 document.getElementById('saudeAtualizar')?.addEventListener('click',renderSaudeSistema);
}

const AUDIT_SESSION_PAGE=150;
async function loadUserAudit({force=false}={}){
 if(!isAdmin()||!$('#adminSessionList'))return;
 if(!force&&userSessions.length&&Date.now()-userSessionsLoadedAt<AUDIT_CACHE_TTL){renderUserAudit();return}
 try{
  /* V10.2 - auditoria respeita a janela paginada do histórico. Antes esta
     tela ignorava a V9.9 e relia a coleção historico inteira. */
  if(!historico.length)await loadHistory();

  let qs;
  try{
   /* V10.77 - a janela paginada de auditoria também reaproveita o espelho
      entre reloads. Force continua ignorando o cache para atualização manual. */
   const cached=!force?cacheLer('sessoes_auditoria'):null;
   if(cached&&Number(cached.at)>0&&Date.now()-Number(cached.at)<AUDIT_CACHE_TTL&&Array.isArray(cached.rows)){
    qs=comoSnapshot(cached.rows);
    statBump('sessoes_usuario','cache');
   }else{
    const auditRows=(await highOsStoreList('sessoes_usuario')).sort((a,b)=>sessionStartMs(b)-sessionStartMs(a)).slice(0,AUDIT_SESSION_PAGE);
    qs=comoSnapshot(auditRows);
    cacheEscrever('sessoes_auditoria',auditRows);
    statBump('sessoes_usuario','leituras');
    statBump('sessoes_usuario','docs',qs.docs.length);
   }
  }catch(err){
   console.warn('[AUDITORIA] Discord indisponível, usando cache local:',err?.code||err?.message);
   const local=cacheLer('sessoes_auditoria');
   if(!local?.rows)throw err;
   qs=comoSnapshot(local.rows);
  }
  userSessions=qs.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>sessionStartMs(b)-sessionStartMs(a));
  userSessionsLoadedAt=Date.now();
  renderUserAudit();
 }catch(e){$('#adminSessionList').innerHTML=`<div class="placeholder"><h3>ERRO AO CARREGAR AUDITORIA</h3><p>${esc(e.message)}</p></div>`}
}
function renderUserAudit(){
 const box=$('#adminSessionList');if(!box)return;const q=String($('#adminAuditSearch')?.value||'').toLowerCase(),user=String($('#adminAuditUser')?.value||'').toLowerCase(),status=$('#adminAuditStatus')?.value||'',day=$('#adminAuditDate')?.value||'';
 const known=[...new Set(userSessions.map(s=>String(s.email||'').toLowerCase()).filter(Boolean))].sort();const sel=$('#adminAuditUser');if(sel){const old=sel.value;sel.innerHTML='<option value="">TODOS OS USUÁRIOS</option>'+known.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');if(known.includes(old))sel.value=old;}
 const list=userSessions.filter(s=>{const sm=sessionStartMs(s),date=sm?new Date(sm).toISOString().slice(0,10):'';const acts=sessionActions(s);return(!user||String(s.email||'').toLowerCase()===user)&&(!status||(status==='ATIVA'?s.sessionId===currentSessionId&&s.status!=='ENCERRADA':s.status==='ENCERRADA'))&&(!day||date===day)&&(!q||[s.email,s.nome,s.role,s.endReason,...acts.map(a=>[a.tipo,a.group,a.faccao,a.descricao].join(' '))].join(' ').toLowerCase().includes(q))});
 const todayTotal=userSessions.filter(s=>isSameLocalDay(sessionStartMs(s))).reduce((n,s)=>n+sessionDuration(s),0),active=userSessions.filter(s=>s.sessionId===currentSessionId&&s.status!=='ENCERRADA').length;
 $('#adminAuditStats').innerHTML=`<span><b>${userSessions.length}</b> SESSÕES</span><span><b>${active}</b> EM ANDAMENTO</span><span><b>${fmtDuration(todayTotal)}</b> TEMPO LOGADO HOJE</span><span><b>${list.length}</b> EXIBIDAS</span>`;
 if(!list.length){box.innerHTML='<div class="placeholder"><b>◷</b><h3>NENHUMA SESSÃO ENCONTRADA</h3><p>Altere os filtros de auditoria.</p></div>';return}
 box.innerHTML=list.map(s=>{const acts=sessionActions(s),start=sessionStartMs(s),end=sessionEffectiveEnd(s),ongoing=s.sessionId===currentSessionId&&s.status!=='ENCERRADA';return `<article class="audit-session-row" data-session="${esc(s.sessionId)}"><div class="audit-session-state ${ongoing?'live':''}">●</div><div class="audit-session-main"><strong>${esc(s.nome||s.email||'Usuário')}</strong><span>${esc(s.email||'—')} • ${esc(String(s.role||'').toUpperCase())}</span><small>${fmtDateMs(start)} → ${ongoing?'EM ANDAMENTO':fmtDateMs(end)}</small></div><div class="audit-session-kpi"><span>TEMPO</span><b>${fmtDuration(sessionDuration(s))}</b></div><div class="audit-session-kpi"><span>AÇÕES</span><b>${acts.length}</b></div><button type="button" class="mini-btn audit-open">VER SESSÃO</button></article>`}).join('');
 box.querySelectorAll('.audit-session-row').forEach(r=>r.querySelector('.audit-open')?.addEventListener('click',()=>openAuditSession(r.dataset.session)));
}
function openAuditSession(id){const s=userSessions.find(x=>x.sessionId===id);if(!s)return;const acts=sessionActions(s),start=sessionStartMs(s),end=sessionEffectiveEnd(s),ongoing=s.sessionId===currentSessionId&&s.status!=='ENCERRADA';$('#auditSessionTitle').textContent=`SESSÃO • ${s.email||'USUÁRIO'}`;$('#auditSessionMeta').innerHTML=`<span><b>LOGIN</b>${fmtDateMs(start)}</span><span><b>${ongoing?'ÚLTIMA ATIVIDADE':'ENCERRAMENTO'}</b>${ongoing?fmtDateMs(end):fmtDateMs(sessionEndMs(s)||end)}</span><span><b>DURAÇÃO</b>${fmtDuration(sessionDuration(s))}</span><span><b>AÇÕES</b>${acts.length}</span>`;$('#auditSessionTimeline').innerHTML=`<div class="audit-event"><time>${new Date(start).toLocaleTimeString('pt-BR')}</time><div><b>LOGIN</b><span>Usuário entrou no High OS</span></div></div>`+acts.map(h=>{const d=historyDateValue(h);return `<div class="audit-event"><time>${d?d.toLocaleTimeString('pt-BR'):'—'}</time><div><b>${esc(String(h.tipo||'AÇÃO').replaceAll('_',' '))}</b><span>${esc(auditModule(h.tipo))}${auditTarget(h)!=='—'?' • '+esc(auditTarget(h)):''}</span>${h.descricao?`<small>${esc(h.descricao)}</small>`:''}${h.antes||h.depois?`<details><summary>VER ALTERAÇÃO ANTES → DEPOIS</summary><div class="audit-diff"><pre>${esc(JSON.stringify(h.antes||{},null,2))}</pre><pre>${esc(JSON.stringify(h.depois||{},null,2))}</pre></div></details>`:''}</div></div>`}).join('')+(!ongoing?`<div class="audit-event"><time>${new Date(end).toLocaleTimeString('pt-BR')}</time><div><b>FIM DA SESSÃO</b><span>${esc(s.endReason==='TIMEOUT_8H'?'Limite máximo de 8 horas atingido':'Sessão encerrada')}</span></div></div>`:'');$('#auditSessionModal').classList.remove('hidden');}
$('#auditSessionClose')?.addEventListener('click',()=>$('#auditSessionModal')?.classList.add('hidden'));
['adminAuditSearch','adminAuditUser','adminAuditStatus','adminAuditDate'].forEach(id=>{$('#'+id)?.addEventListener(id==='adminAuditSearch'?'input':'change',renderUserAudit)});
$('#adminAuditRefresh')?.addEventListener('click',()=>loadUserAudit({force:true}));
function openUserActivity(email){activateAppPage('administracao');loadUserAudit().then(()=>{const s=$('#adminAuditUser');if(s){s.value=String(email||'').toLowerCase();renderUserAudit();}})}

// ===== HIGH OS V5 · GROUP COMO PATRIMÔNIO + ENTREGA COMO VÍNCULO =====
let entregas=[];
const INSTALLATIONS=[
 ['vipOrg','VIP Org'],['chatFaccao','Chat da Facção'],['radio','Rádio Exclusiva'],['salario','Salário'],
 ['garagemVip','Garagem VIP'],['garagemPublica','Garagem Pública'],['garagemPublica2','Garagem Pública 2'],['heliponto','Heliponto'],['blindados','Blindados'],['rotaInicio','Rota'],['rotaExclusiva','Rota Exclusiva'],
 ['telao','Telão'],['lojaRoupas','Loja de Roupas'],['barbearia','Barbearia'],['tatuagem','Tatuagem'],['shopExclusivo','Shop Exclusivo'],
 ['bau','Baú'],['bar','Bar'],['atm','ATM'],['garagemDeluxe','Garagem Deluxe'],['shopDeluxe','Shop Deluxe'],['academia','Academia'],['sinuca','Sinuca'],['roupasFaccao','Uniforme'],['farm','Farm'],['craft','Craft'],['arena','Arena']
];
function renderDefaultDeliveryProfile(f){
 const p=f?.perfilEntrega||{}, b=f?.beneficios||{}, selected=new Set(p.beneficiosPadrao||[]);
 if($('#fPlanoPadrao'))$('#fPlanoPadrao').value=p.planoPadrao||'';
 if($('#fPerfilObs'))$('#fPerfilObs').value=p.observacao||'';
 if(!$('#fDefaultBenefits'))return;
 const available=INSTALLATIONS.filter(([k])=>isInstalled(b,k));
 $('#fDefaultBenefits').innerHTML=available.length?available.map(([k,n])=>`<label class="install-item install-toggle"><input type="checkbox" data-default-benefit="${k}" ${selected.has(k)?'checked':''}><span><b>${esc(n)}</b><small>${esc(installedValue(b,k))}</small></span></label>`).join(''):'<div class="delivery-no-change">Cadastre primeiro as instalações/setagens acima. O perfil padrão só pode ativar recursos existentes no Group.</div>';
 document.querySelectorAll('[data-default-benefit]').forEach(x=>x.addEventListener('change',updateDeliveryPreview));
}

function installedValue(b,k){
 if(k==='garagemVip') return [b.garagemVipBlip,b.garagemVipSpawn].filter(Boolean).join(' / ');
 if(['garagemPublica','garagemPublica2','garagemDeluxe','heliponto'].includes(k)){const pre=k==='heliponto'?'heliponto':k,c=[b[pre+'Blip'],b[pre+'Spawn']].filter(Boolean).join(' / ');if(c)return c}
 if(k==='radio') return b.radio||''; if(k==='salario') return b.salario?`${b.salario} / ${b.salarioMinutos||40} min`:'';
 if(typeof b[k]==='boolean') return b[k]?'SIM':''; return b[k]||'';
}
function isInstalled(b,k){return !!installedValue(b||{},k)}
function installedCount(f){return INSTALLATIONS.filter(([k])=>isInstalled(f.beneficios||{},k)).length}

// HIGH OS V8.10 · segmentos clicáveis também em Groups / QGs
function facSegmentsAvailable(all=[]){
 const preferred=['ARMAS','MUNIÇÃO','LAVAGEM','DROGAS','DESMANCHE','ESTELIONATÁRIOS','OUTROS'];
 const found=[...new Set((all||[]).filter(f=>!f.removido).map(f=>String(f.segmento||'').trim()).filter(Boolean))];
 return [...preferred.filter(x=>found.includes(x)),...found.filter(x=>!preferred.includes(x)).sort((a,b)=>a.localeCompare(b))];
}
function renderFacSegmentChips(all=[]){
 const sel=$('#facSegment'),box=$('#facSegmentChips');if(!sel||!box)return;
 const current=sel.value||'',segments=facSegmentsAvailable(all);
 sel.innerHTML=`<option value="">TODOS OS SEGMENTOS</option>${segments.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}`;
 if(current&&segments.includes(current))sel.value=current;else sel.value='';
 const active=sel.value||'',base=(all||[]).filter(f=>!f.removido),counts={};
 base.forEach(f=>{const k=String(f.segmento||'OUTROS').trim()||'OUTROS';counts[k]=(counts[k]||0)+1});
 box.innerHTML=`<button type="button" class="fac-segment-chip ${!active?'active':''}" data-segment=""><span>TODOS</span><b>${base.length}</b></button>${segments.map(x=>`<button type="button" class="fac-segment-chip ${active===x?'active':''}" data-segment="${esc(x)}"><span>${esc(x)}</span><b>${counts[x]||0}</b></button>`).join('')}`;
 box.querySelectorAll('.fac-segment-chip').forEach(btn=>btn.onclick=()=>{sel.value=btn.dataset.segment||'';renderFaccoes()});
}

// V5 substitui a leitura visual de "Facções" por "Groups / QGs" sem quebrar a coleção legada.
renderFaccoes=function(){
 renderFacSegmentChips(faccoes);
renderFacActivityButtons();

 const q=($('#facSearch')?.value||'').toLowerCase(),
seg=$('#facSegment')?.value||'',
st=$('#facStatus')?.value||'',
operacionais=faccoes.filter(f=>!f.removido);

 const filtered=operacionais.filter(f=>(!seg||segmentKey(f.segmento)===segmentKey(seg))&&(!st||f.status===st)&&(!q||[f.group,
f.faccao,
f.qg,
f.lider,
f.staff,
f.produto].join(' ').toLowerCase().includes(q)));

 const ocup=operacionais.filter(f=>f.status==='ATIVA').length,
vagos=operacionais.length-ocup,
inst=operacionais.reduce((n,f)=>n+installedCount(f),0);

 const segCounts={};
operacionais.forEach(f=>{const k=f.segmento||'OUTROS';segCounts[k]=(segCounts[k]||0)+1});

 const maxSeg=Math.max(1,...Object.values(segCounts));

 if($('#facOverview'))$('#facOverview').innerHTML=`<div class="ops-kpis"><article class="ops-kpi purple"><span>GROUPS</span><b>${operacionais.length}</b><small>posições permanentes cadastradas</small></article><article class="ops-kpi good"><span>OCUPADOS</span><b>${ocup}</b><small>${operacionais.length?Math.round(ocup/operacionais.length*100):0}% da base em uso</small></article><article class="ops-kpi warn"><span>DISPONÍVEIS</span><b>${vagos}</b><small>livres para nova ocupação</small></article><article class="ops-kpi"><span>INSTALAÇÕES</span><b>${inst}</b><small>recursos/setagens registrados</small></article></div><section class="ops-distribution"><div class="ops-distribution-head"><b>DISTRIBUIÇÃO POR SEGMENTO</b><span>BASE COMPLETA</span></div><div class="ops-bars">${Object.entries(segCounts).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="ops-bar-row"><span>${esc(k)}</span><div class="ops-track"><div class="ops-fill" style="width:${Math.max(4,v/maxSeg*100)}%"></div></div><b>${v}</b></div>`).join('')}</div></section>`;

 $('#facStats').innerHTML=`<span><b>${filtered.length}</b> EXIBIDOS</span>${seg?`<span>SEGMENTO <b>${esc(seg)}</b></span>`:''}${st?`<span>STATUS <b>${st==='ATIVA'?'OCUPADOS':'VAGOS'}</b></span>`:''}`;

 if(!faccoes.length){$('#facList').innerHTML='<div class="placeholder"><b>◆</b><h3>NENHUM GROUP DISPONÍVEL</h3><p>Não foi possível carregar a base de facções do Discord.</p></div>';return}
 if(!filtered.length){$('#facList').innerHTML='<div class="placeholder"><b>⌕</b><h3>NENHUM GROUP ENCONTRADO</h3><p>Ajuste a busca ou os filtros.</p></div>';
return}
 $('#facList').innerHTML=filtered.map(f=>`<article class="fac-card" data-id="${f.id}"><div class="fac-card-head"><div><div class="group-kicker">${esc(f.segmento||'OUTROS')}</div><h3>${esc(f.group)}</h3></div><span class="status-chip ${f.status==='ATIVA'?'ativa':'inativa'}">${f.status==='ATIVA'?'OCUPADO':'VAGO'}</span></div><div class="fac-name">${esc(f.qg||'SEM LOCAL')}</div><div class="muted">Ocupante: <b>${esc(f.faccao||'— NENHUMA —')}</b>${f.lider?'<br>Líder: '+esc(f.lider):''}</div><div class="product">${esc(f.produto||'')}</div><div class="install-count">${installedCount(f)} instalações/setagens cadastradas no Group</div><div class="group-profile"><button class="mini-btn edit-group" data-id="${f.id}">PERFIL TÉCNICO</button><button class="btn-primary compact deliver-group" data-group="${esc(f.group)}">${f.status==='ATIVA'?'NOVA ENTREGA':'ENTREGAR GROUP'}</button></div></article>`).join('');

 document.querySelectorAll('.edit-group').forEach(b=>b.onclick=e=>{e.stopPropagation();openFac(b.dataset.id)});

 document.querySelectorAll('.deliver-group').forEach(b=>b.onclick=e=>{e.stopPropagation();openNewDelivery(b.dataset.group)});

};

function initDeliveryUi(){
 $('#newDeliveryBtn')?.addEventListener('click',()=>openNewDelivery());
 $('#newDeliveryClose')?.addEventListener('click',()=>$('#newDeliveryModal').classList.add('hidden'));

 $('#newDeliveryModal')?.addEventListener('click',e=>{if(e.target.id==='newDeliveryModal')$('#newDeliveryModal').classList.add('hidden')});

 $('#dGroup')?.addEventListener('change',()=>{
  dlvVipCustomItems.clear();
  dlvUltraStaffConfirmed.clear();
  if($('#dVipMuleSet'))$('#dVipMuleSet').checked=false;
  if($('#dVipCargobobSet'))$('#dVipCargobobSet').checked=false;
  if($('#dVipPackage'))$('#dVipPackage').value='';
  fillDeliveryFromGroup($('#dGroup').value);
 });
 $('#dSheetRefresh')?.addEventListener('click',async()=>{
  const button=$('#dSheetRefresh');
  if(button)button.disabled=true;
  try{
   // O botão consulta a planilha ORIGINAL. O espelho do bot pode estar truncado.
   await authorizeSheets();
   await fillDeliveryFromGroup($('#dGroup').value,{force:true});
  }catch(error){
   dlvSheetCache={...dlvSheetCache,error:'Não foi possível consultar a planilha original: '+(error?.message||error)};
   dlvRenderStatus();
  }finally{if(button)button.disabled=false}
 });

 ['dFaccao',
'dLider',
'dStaff',
'dData',
'dPlano',
'dNotes'].forEach(id=>$('#'+id)?.addEventListener('input',updateNewDeliveryPreview));
 $('#dVipSheetSave')?.addEventListener('click',async()=>{
  const btn=$('#dVipSheetSave'),fb=$('#dVipSheetFeedback');
  if(btn)btn.disabled=true;
  try{await dlvSaveVipSheet();}catch(err){if(fb)fb.textContent='Falha ao salvar: '+(err?.message||err);alert('Checklist não foi salvo: '+(err?.message||err))}
  finally{if(btn)btn.disabled=false}
 });
 $('#dVipSheetPanel')?.addEventListener('change',e=>{
  if(e.target?.dataset?.vipCustomItem){
   const key=e.target.dataset.vipCustomItem;
   if(e.target.checked)dlvVipCustomItems.add(key);else dlvVipCustomItems.delete(key);
   updateNewDeliveryPreview();return;
  }
  if(!e.target?.dataset?.vipSheetField)return;
  const fb=$('#dVipSheetFeedback');
  if(fb)fb.textContent='Alterações ainda não salvas na planilha.';
  dlvRenderUltraReview();updateNewDeliveryPreview();
 });
 $('#dVipPackage')?.addEventListener('change',()=>{
  dlvVipCustomItems.clear();
  dlvUltraStaffConfirmed.clear();
  renderDeliveryBenefits(dlvSnapshotForm());
  dlvRenderVipSheet();
  updateNewDeliveryPreview();
 });
 ['dVipMuleSet','dVipCargobobSet'].forEach(id=>$('#'+id)?.addEventListener('change',updateNewDeliveryPreview));

 $('#deliverySearch')?.addEventListener('input',renderDeliveries);
 $('#deliveryStatus')?.addEventListener('change',renderDeliveries);

 $('#copyDExtract')?.addEventListener('click',()=>copyText($('#dExtract').value,$('#copyDExtract')));
 $('#copyDRequests')?.addEventListener('click',()=>copyText(currentDeliveryRequests().map((r,i)=>`===== ${i+1}. ${r.titulo.toUpperCase()} =====\n\n${r.texto}`).join('\n\n'),$('#copyDRequests')));

 $('#newDeliveryForm')?.addEventListener('submit',saveNewDelivery);

}

// HIGH OS V5.3 · FACÇÕES COMO ENTIDADE PRÓPRIA
function orgKey(name){return String(name||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'facção'}
function derivedOrganizations(){
 const map=new Map();

 organizacoes.forEach(o=>map.set(String(o.nome||o.id||'').toLowerCase(),{...o,
source:'cadastro'}));

 faccoes.filter(f=>f.faccao).forEach(f=>{const k=String(f.faccao).toLowerCase(),
old=map.get(k)||{};map.set(k,{...old,
id:old.id||orgKey(f.faccao),
nome:old.nome||f.faccao,
lider:old.lider||f.lider||'',
status:old.status||'ATIVA',
groupAtual:f.group,
segmentoAtual:f.segmento,
segmentoVinculado:old.segmentoVinculado||f.segmento,
qgAtual:f.qg,
contato:old.contato||'',
discord:old.discord||'',
desde:old.desde||f.dataEntrega||'',
observacoes:old.observacoes||'',
source:old.source||'group'});});

 return [...map.values()].map(o=>({...o,
status:o.groupAtual?'ATIVA':'INATIVA'})).sort((a,b)=>(a.nome||'').localeCompare(b.nome||''));

}
async function loadOrganizations(){
 if(queryAindaFresca('organizacoes')){renderOrganizations();syncOrgOptions();return}
 try{const qs=await getDocsCached(orgCol,'organizacoes');
organizacoes=qs.docs.map(d=>({id:d.id,
...d.data()}));
queryFreshAt.set('organizacoes',Date.now());
renderOrganizations();
syncOrgOptions()}catch(e){if($('#orgList'))$('#orgList').innerHTML=`<div class="placeholder"><h3>ERRO AO CARREGAR</h3><p>${esc(e.message)}</p></div>`}
}
function syncOrgOptions(){const dl=$('#orgOptions');
if(!dl)return;
dl.innerHTML=derivedOrganizations().filter(o=>o.status!=='INATIVA').map(o=>`<option value="${esc(o.nome)}">${esc(o.groupAtual||'SEM GROUP')}</option>`).join('')}
function orgSegmentValue(o={}){return o.segmentoVinculado||o.segmentoAtual||''}
function orgSegmentsAvailable(all=[]){
 const preferred=['ARMAS',
'MUNIÇÃO',
'LAVAGEM',
'DROGAS',
'DESMANCHE',
'ESTELIONATÁRIOS',
'OUTROS'];

 const found=[...new Set((all||[]).map(o=>String(orgSegmentValue(o)||'').trim()).filter(Boolean))];

 return [...preferred.filter(x=>found.includes(x)),
...found.filter(x=>!preferred.includes(x)).sort((a,b)=>a.localeCompare(b))];

}
function renderOrgSegmentChips(all=[]){
 const sel=$('#orgSegment'),
box=$('#orgSegmentChips');
if(!sel||!box)return;

 const current=sel.value||'',
segments=orgSegmentsAvailable(all);

 sel.innerHTML=`<option value="">TODOS OS SEGMENTOS</option>${segments.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}`;

 if(current&&segments.includes(current))sel.value=current;
else sel.value='';

 const active=sel.value||'';

 const counts={};
(all||[]).forEach(o=>{const k=String(orgSegmentValue(o)||'').trim();if(k)counts[k]=(counts[k]||0)+1});

 box.innerHTML=`<button type="button" class="org-segment-chip ${!active?'active':''}" data-segment=""><span>TODOS</span><b>${all.length}</b></button>${segments.map(x=>`<button type="button" class="org-segment-chip ${active===x?'active':''}" data-segment="${esc(x)}"><span>${esc(x)}</span><b>${counts[x]||0}</b></button>`).join('')}`;

 box.querySelectorAll('.org-segment-chip').forEach(btn=>btn.onclick=()=>{sel.value=btn.dataset.segment||'';renderOrganizations()});

}
function renderOrganizations(){
 if(!$('#orgList'))return;
const all=derivedOrganizations();
renderOrgSegmentChips(all);
renderOrgActivityButtons();
const q=($('#orgSearch')?.value||'').toLowerCase(),
st=$('#orgStatus')?.value||'',
seg=$('#orgSegment')?.value||'';

 const list=all.filter(o=>(!seg||segmentKey(orgSegmentValue(o))===segmentKey(seg))&&(!st||(st==='ACTIVE'?o.status!=='INATIVA':o.status===st))&&(!q||[o.nome,
o.lider,
o.groupAtual,
o.qgAtual,
orgSegmentValue(o),
o.contato,
o.discord].join(' ').toLowerCase().includes(q)));

 const active=all.filter(o=>o.groupAtual&&o.status!=='INATIVA').length,
sem=all.filter(o=>!o.groupAtual&&o.status!=='INATIVA').length,
inativas=all.filter(o=>o.status==='INATIVA').length;

 const segCounts={};
all.filter(o=>o.groupAtual).forEach(o=>{const k=orgSegmentValue(o)||'OUTROS';segCounts[k]=(segCounts[k]||0)+1});
const maxSeg=Math.max(1,...Object.values(segCounts));

 if($('#orgOverview'))$('#orgOverview').innerHTML=`<div class="ops-kpis"><article class="ops-kpi purple"><span>FACÇÕES</span><b>${all.length}</b><small>organizações registradas</small></article><article class="ops-kpi good"><span>COM GROUP</span><b>${active}</b><small>ocupando patrimônio da cidade</small></article><article class="ops-kpi warn"><span>SEM GROUP</span><b>${sem}</b><small>ativas aguardando ocupação</small></article><article class="ops-kpi"><span>INATIVAS</span><b>${inativas}</b><small>mantidas apenas no histórico</small></article></div><section class="ops-distribution"><div class="ops-distribution-head"><b>OCUPAÇÃO POR SEGMENTO</b><span>FACÇÕES COM GROUP</span></div><div class="ops-bars">${Object.keys(segCounts).length?Object.entries(segCounts).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="ops-bar-row"><span>${esc(k)}</span><div class="ops-track"><div class="ops-fill" style="width:${Math.max(4,v/maxSeg*100)}%"></div></div><b>${v}</b></div>`).join(''):'<div class="muted">Nenhuma ocupação ativa.</div>'}</div></section>`;

 $('#orgStats').innerHTML=`<span><b>${list.length}</b> EXIBIDAS</span>${seg?`<span>SEGMENTO <b>${esc(seg)}</b></span>`:''}${st?`<span>STATUS <b>${esc(st.replace('_',' '))}</b></span>`:''}`;

 $('#orgList').innerHTML=list.length?list.map(o=>`<article class="org-card" data-org="${esc(o.id||orgKey(o.nome))}"><div class="org-card-head"><div><div class="group-kicker">${esc(orgSegmentValue(o)||'ORGANIZAÇÃO')}</div><h3>${esc(o.nome||'SEM NOME')}</h3></div><span class="status-chip ${o.status==='INATIVA'?'inativa':'ativa'}">${o.status==='INATIVA'?'INATIVA':(o.groupAtual?'OCUPANDO':'ATIVA • SEM GROUP')}</span></div><div class="org-group-link"><span>GROUP ATUAL</span><b>${esc(o.groupAtual||'—')}</b><small>${esc(o.qgAtual||'')}</small></div><div class="muted">${o.lider?'Líder: '+esc(o.lider):'Liderança não cadastrada'}${o.contato?'<br>Contato: '+esc(o.contato):''}</div><button class="mini-btn open-org" data-name="${esc(o.nome)}">PERFIL DA FACÇÃO</button></article>`).join(''):'<div class="placeholder"><b>♜</b><h3>NENHUMA FACÇÃO ENCONTRADA</h3><p>Ajuste a busca ou os filtros.</p></div>';

 document.querySelectorAll('.open-org').forEach(b=>b.onclick=e=>{e.stopPropagation();openOrganizationByName(b.dataset.name)});

}

async function orgHistory(name){
 const key=String(name||'').trim();
 if(!key)return [];
 /* V10.26 - perfil da facção não baixa mais o histórico inteiro.
    Busca no servidor somente os eventos diretamente vinculados à facção.
    Registros legados que guardavam o nome apenas em antes/depois continuam
    aparecendo no Histórico geral paginado, sem transformar a abertura do
    perfil em uma leitura crescente da coleção inteira. */
 try{
  const rows=(await highOsStoreList('historico')).filter(x=>String(x.faccao||'')===key).sort((a,b)=>historyMillis(b)-historyMillis(a)).slice(0,8);
  return rows;
 }catch(e){
  console.warn('[HISTÓRICO/PERFIL] consulta econômica indisponível:',e?.code||e?.message);
  return historico.filter(h=>String(h.faccao||h.depois?.faccao||h.antes?.faccao||'').toLowerCase()===key.toLowerCase())
   .sort((a,b)=>historyMillis(b)-historyMillis(a))
   .slice(0,8);
 }
}
async function openOrganizationByName(name=''){
 const o=derivedOrganizations().find(x=>String(x.nome).toLowerCase()===String(name).toLowerCase())||{id:'',
nome:name,
status:'SEM_GROUP'};

 $('#orgId').value=o.id||'';
$('#oNome').value=o.nome||'';
syncSegmentSelects();
if($('#oSegment'))$('#oSegment').value=segmentNames().find(x=>segmentKey(x)===segmentKey(orgSegmentValue(o)))||'OUTROS';
$('#oStatus').value=o.status|| (o.groupAtual?'ATIVA':'SEM_GROUP');
$('#oLider').value=o.lider||'';
$('#oContato').value=o.contato||'';
$('#oDiscord').value=o.discord||'';
$('#oDesde').value=o.desde||'';
$('#oObs').value=o.observacoes||'';
$('#orgModalTitle').textContent=o.nome||'NOVA FACÇÃO';

 const current=faccoes.find(f=>String(f.faccao||'').toLowerCase()===String(o.nome||'').toLowerCase());

 $('#orgProfileSummary').innerHTML=`<div><span>STATUS</span><b>${esc(current?'COM GROUP':(o.status||'SEM GROUP'))}</b></div><div><span>GROUP ATUAL</span><b>${esc(current?.group||'—')}</b></div><div><span>SEGMENTO</span><b>${esc(current?.segmento||orgSegmentValue(o)||'—')}</b></div><div><span>QG</span><b>${esc(current?.qg||'—')}</b></div>`;

 $('#orgCurrentGroup').innerHTML=current?`<div class="eyebrow">OCUPAÇÃO ATUAL</div><strong>${esc(current.group)} • ${esc(current.qg||'')}</strong><span>${esc(current.produto||'')}</span>`:'<div class="delivery-no-change">Esta facção não ocupa nenhum Group atualmente.</div>';

 $('#orgHistoryPreview').innerHTML='<div class="delivery-no-change">Carregando histórico...</div>';
showOrganizationProfilePage(o,current);

 const hist=await orgHistory(o.nome);
$('#orgHistoryPreview').innerHTML=hist.length?hist.map(h=>`<div class="group-history-item"><i></i><div><b>${esc(historyTitle(h))}</b><span>${esc(h.group||'')} • ${esc(formatHistoryDate(h))}</span></div></div>`).join(''):'<div class="delivery-no-change">Ainda não há eventos registrados para esta organização.</div>';

}
$('#newOrgBtn')?.addEventListener('click',()=>openOrganizationByName(''));

$('#orgModalClose')?.addEventListener('click',closeOrganizationProfilePage);

['orgSearch',
'orgSegment',
'orgStatus'].forEach(id=>$('#'+id)?.addEventListener(id==='orgSearch'?'input':'change',renderOrganizations));

$('#orgForm')?.addEventListener('submit',async e=>{e.preventDefault();const nome=$('#oNome').value.trim();if(!nome)return;const id=$('#orgId').value||orgKey(nome),
current=faccoes.find(f=>String(f.faccao||'').toLowerCase()===nome.toLowerCase());const data={nome,
status:current?'ATIVA':'INATIVA',
lider:$('#oLider').value.trim(),
contato:$('#oContato').value.trim(),
discord:$('#oDiscord').value.trim(),
desde:$('#oDesde').value.trim(),
observacoes:$('#oObs').value.trim(),
groupAtual:current?.group||'',
segmentoAtual:current?.segmento||$('#oSegment')?.value||'',
segmentoVinculado:$('#oSegment')?.value||current?.segmento||'',
qgAtual:current?.qg||'',
updatedAt:serverTimestamp(),
updatedBy:currentUser.email};
const existing=organizacoes.find(o=>o.id===id)||derivedOrganizations().find(o=>String(o.nome||'').toLowerCase()===nome.toLowerCase());
const comparable={...data};delete comparable.updatedAt;delete comparable.updatedBy;
const same=existing&&Object.keys(comparable).every(k=>String(existing[k]??'')===String(comparable[k]??''));
if(same){closeOrganizationProfilePage();return}
try{await setDoc(doc(db,'highos','data','organizacoes',id),data);await addDoc(histCol,{sessionId:currentSessionId||'',
tipo:'ORGANIZACAO',
faccao:nome,
group:current?.group||'',
descricao:`Cadastro da facção ${nome} atualizado`,
usuario:currentUser.email,
data:serverTimestamp()});
const local={...(existing||{}),...comparable,id,updatedBy:currentUser.email};
const ix=organizacoes.findIndex(o=>o.id===id);
if(ix>=0)organizacoes[ix]=local;else organizacoes.push(local);
queryFreshAt.set('organizacoes',Date.now());
closeOrganizationProfilePage();renderOrganizations()}catch(err){alert('Erro ao salvar facção: '+err.message)}});

async function upsertOrganizationFromDelivery(payload,f){
 const id=orgKey(payload.faccao),
existing=derivedOrganizations().find(o=>String(o.nome).toLowerCase()===payload.faccao.toLowerCase())||{},
next={nome:payload.faccao,
status:'ATIVA',
lider:payload.lider||existing.lider||'',
contato:existing.contato||'',
discord:existing.discord||'',
desde:existing.desde||payload.dataEntrega||'',
observacoes:existing.observacoes||'',
groupAtual:f.group,
segmentoAtual:f.segmento||'',
segmentoVinculado:f.segmento||existing.segmentoVinculado||'',
qgAtual:f.qg||''};

 /* V10.29 - entrega idempotente: se a organização já representa exatamente
    esta ocupação, não regrava updatedAt/updatedBy nem derruba o cache. */
 const campos=Object.keys(next);
 const igual=existing?.id&&campos.every(k=>String(existing[k]??'')===String(next[k]??''));
 if(igual)return false;

 await setDoc(doc(db,'highos','data','organizacoes',id),{...next,
updatedAt:serverTimestamp(),
updatedBy:currentUser.email},{merge:true});
 return true;

}
const DELIVERY_RECENT_LIMIT=250;
async function loadDeliveries(){
 if(queryAindaFresca('entregas')){renderDeliveries();return}
 try{
  const cached=cacheLer('entregas_resumo');
  if(cached&&Number(cached.at)>0&&Date.now()-Number(cached.at)<QUERY_CHAIN_TTL&&Array.isArray(cached.rows)){
   entregas=cached.rows;
   queryFreshAt.set('entregas',Number(cached.at));
   statBump('entregas','cache');
   renderDeliveries();
   return;
  }
  /* V10.3 - preserva TODAS as entregas ativas (necessárias para recolher e
     transferir corretamente) e limita o histórico encerrado às 250 mais
     recentes. Assim o crescimento da coleção não aumenta indefinidamente
     o custo normal de abertura do painel. */
  let ativos=[],recentes=[];
  try{
   const all=await highOsStoreList('entregas');
   ativos=all.filter(x=>x.status==='ATIVA');
   recentes=all.slice().sort((x,y)=>String(y.createdAtText||y.dataEntrega||'').localeCompare(String(x.createdAtText||x.dataEntrega||''))).slice(0,DELIVERY_RECENT_LIMIT);
   const mapa=new Map([...ativos,...recentes].map(x=>[x.id,x]));
   entregas=[...mapa.values()];
  }catch(err){
   console.warn('[ENTREGAS] consultas econômicas indisponíveis; coleção inteira não será lida:',err?.code||err?.message);
   const qs=cachedSnapshotOnly('entregas');
   if(!qs)throw err;
   const all=qs.docs.map(d=>({id:d.id,...d.data()}));
   const ativosCache=all.filter(x=>x.status==='ATIVA');
   const recentesCache=all.slice()
    .sort((a,b)=>String(b.createdAtText||b.dataEntrega||'').localeCompare(String(a.createdAtText||a.dataEntrega||'')))
    .slice(0,DELIVERY_RECENT_LIMIT);
   const mapaCache=new Map([...ativosCache,...recentesCache].map(x=>[x.id,x]));
   entregas=[...mapaCache.values()];
  }
  entregas.sort((a,b)=>String(b.createdAtText||b.dataEntrega||'').localeCompare(String(a.createdAtText||a.dataEntrega||'')));
  queryFreshAt.set('entregas',Date.now());
  cacheEscrever('entregas_resumo',entregas);
  renderDeliveries();
 }catch(e){if($('#deliveryList'))$('#deliveryList').innerHTML=`<div class="placeholder"><h3>ERRO AO CARREGAR</h3><p>${esc(e.message)}</p></div>`}
}
async function reconcileActiveDeliveriesToGroups(){
 /* V14: desligada. Ela reocupava o Group sozinha a partir de qualquer entrega
    ATIVA — inclusive entrega antiga que ficou para trás num recolhimento.
    Agora o caso aparece em Revisar ocupação com as opções "restaurar
    ocupação" ou "marcar entrega como recolhida", e o admin escolhe. */
 return;
 if(!Array.isArray(entregas)||!Array.isArray(faccoes)||!entregas.length||!faccoes.length)return;
 const activeByGroup=new Map();
 entregas.filter(d=>d&&d.status==='ATIVA'&&String(d.group||'').trim()&&String(d.faccao||'').trim())
  .sort((a,b)=>String(a.createdAtText||a.dataEntrega||'').localeCompare(String(b.createdAtText||b.dataEntrega||'')))
  .forEach(d=>activeByGroup.set(String(d.group),d));
 const fixes=[];
 for(const [group,d] of activeByGroup){
  const f=faccoes.find(x=>x.group===group);
  if(!f||f.removido)continue;
  if(f.status==='ATIVA'&&String(f.faccao||'').trim()===String(d.faccao||'').trim())continue;
  fixes.push({f,d});
 }
 if(!fixes.length)return;
 if(!isAdmin())return;
 try{
  const batch=writeBatch(db);
  fixes.forEach(({f,d})=>batch.set(doc(db,'highos','data','faccoes',idFac(f.group)),{
   status:'ATIVA',
   faccao:String(d.faccao||'').trim(),
   lider:d.lider||f.lider||'',
   staff:d.staff||f.staff||'',
   dataEntrega:d.dataEntrega||f.dataEntrega||'',
   ocupacaoAtual:{
    faccao:String(d.faccao||'').trim(),
    lider:d.lider||'',
    staff:d.staff||'',
    dataEntrega:d.dataEntrega||'',
    plano:d.plano||'',
    beneficiosAtivos:Array.isArray(d.beneficiosAtivos)?d.beneficiosAtivos:[]
   },
   updatedAt:serverTimestamp(),
   updatedBy:currentUser.email
  },{merge:true}));
  await batch.commit();
  faccoes=faccoes.map(f=>{
   const hit=fixes.find(x=>x.f.group===f.group);
   if(!hit)return f;
   const d=hit.d;
   return {...f,status:'ATIVA',faccao:String(d.faccao||'').trim(),lider:d.lider||f.lider||'',staff:d.staff||f.staff||'',dataEntrega:d.dataEntrega||f.dataEntrega||'',ocupacaoAtual:{faccao:String(d.faccao||'').trim(),lider:d.lider||'',staff:d.staff||'',dataEntrega:d.dataEntrega||'',plano:d.plano||'',beneficiosAtivos:Array.isArray(d.beneficiosAtivos)?d.beneficiosAtivos:[]}};
  });
  queryFreshAt.set('faccoes',Date.now());
  console.info('[HIGH OS] ocupações restauradas a partir das entregas ativas:',fixes.map(x=>x.f.group));
 }catch(e){console.warn('[HIGH OS] falha ao reconciliar entregas ativas com Groups',e)}
}

function renderDeliveries(){
 if(!$('#deliveryList'))return;
const q=($('#deliverySearch').value||'').toLowerCase(),
st=$('#deliveryStatus').value;

 const list=entregas.filter(d=>(!st||d.status===st)&&(!q||[d.group,
d.faccao,
d.lider,
d.staff,
d.dataEntrega].join(' ').toLowerCase().includes(q)));

 const at=entregas.filter(d=>d.status==='ATIVA').length;
$('#deliveryStats').innerHTML=`<span><b>${entregas.length}</b> REGISTROS</span><span><b>${at}</b> ATIVOS</span><span><b>${list.length}</b> EXIBIDOS</span>`;

 $('#deliveryList').innerHTML=list.length?list.map(d=>`<article class="delivery-row"><div><div class="group-kicker">GROUP</div><strong>${esc(d.group)}</strong></div><div><span>${esc(d.faccao||'—')}</span><small>${esc(d.qg||'')} ${d.plano?'• '+esc(d.plano):''}</small></div><div><strong>${esc(d.dataEntrega||'—')}</strong><small>${esc(d.staff||'')}</small></div><span class="status-chip ${d.status==='ATIVA'?'ativa':'inativa'}">${esc(d.status||'ATIVA')}</span></article>`).join(''):'<div class="placeholder"><b>◇</b><h3>NENHUMA ENTREGA REGISTRADA</h3><p>Use “Nova Entrega” ou entregue diretamente pelo card de um Group.</p></div>';

}
function openNewDelivery(group=''){
 const sel=$('#dGroup');
/* V14: situação pela regra única; SEM QG / REVISAR não podem ser entregues; ocupado = troca */
sel.innerHTML='<option value="">SELECIONE O GROUP</option>'+faccoes.filter(f=>!f.removido).map(f=>{const st=situacaoGroup(f);return `<option value="${esc(f.group)}" ${st==='SEM_QG'||st==='REVISAR'?'disabled':''}>${esc(f.group)} — ${esc(f.qg||'SEM LOCAL')} ${st==='ASSUMIDA'?'['+esc(f.faccao)+' • TROCA]':st==='SEM_QG'?'[SEM QG]':st==='REVISAR'?'[REVISAR]':'[DISPONÍVEL]'}</option>`}).join('');

 $('#newDeliveryForm').reset();
 dlvVipCustomItems.clear();
 dlvUltraStaffConfirmed.clear();
dlvCurrent.group='';
if(group){sel.value=group;
fillDeliveryFromGroup(group)}else{fillDeliveryFromGroup('')};
$('#newDeliveryModal').classList.remove('hidden');

}
/* =====================================================================
   HIGH OS V12.9 · ENTREGA COM BENEFÍCIOS DA PLANILHA
   O bot já recebe a planilha principal (Apps Script → /v1/sheets/ingest)
   e guarda cada aba no storage "planilha". A entrega lê as abas
   BENEFICIOS FACÇÕES e BLIPS COORDENADAS, junta com o cadastro do Group
   e mostra TODOS os benefícios como marcáveis:
   - instalado (planilha ou High OS) → vem marcado;
   - não instalado → ao marcar, pede CDS/dados e gera a solicitação.
   ===================================================================== */
const DLV_SHEET_TABS=['beneficios-faccoes','blips-coordenadas'];
const DLV_SHEET_TTL=5*60*1000;
let dlvSheetCache={at:0,tabs:null,promise:null,error:''};
const dlvFold=v=>String(v??'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const dlvAlnum=v=>dlvFold(v).replace(/[^a-z0-9]/g,'');
const dlvNegative=v=>/^(|-|—|–|0|n|nao|não|nao possui|não possui|sem|nenhum|nenhuma|false|x nao|inativo|inativa|nao tem|não tem|n\/a|na)$/.test(dlvFold(v));
const dlvAffirmative=v=>/^(sim|s|x|ok|✓|✔|✅|true|ativo|ativa|possui|tem|instalado|instalada|liberado|liberada)$/.test(dlvFold(v));

/* Rótulo da planilha → benefício do High OS. A primeira regra que casar vence. */
const DLV_LABEL_RULES=[
 ['garagemDeluxe',/garag.*deluxe/],
 ['garagemVip',/garag.*(vip|fac|org)|(vip|fac).*garag/],
 ['garagemPublica2',/garag.*publ.*2/],
 ['garagemPublica',/garag.*publ/],
 ['heliponto',/heli/],
 ['blindados',/blindad/],
 ['bar',/^bar$/],
 ['telao',/telao/],
 ['roupasFaccao',/roupas? (de |da )?(fac|org)|uniforme/],
 ['lojaRoupas',/roupa|^loja de r$/],
 ['barbearia',/barbe/],
 ['tatuagem',/tatuag|tattoo/],
 ['atm',/\batm\b|caixa eletr/],
 ['shopDeluxe',/shop.*deluxe|loja.*deluxe|^shop d$/],
 ['sinuca',/sinuca/],
 ['academia',/academia/],
 ['shopExclusivo',/shop|loja (da |de )?(fac|org)|loja exclusiva|lojinha/],
 ['bau',/\bbau\b/],
 ['radio',/radio/],
 ['salario',/salario/],
 ['chatFaccao',/chat/],
 ['rotaInicio',/^(iniciar rota|rota inicio|inicio da rota|rota)$/],
 ['rotaExclusiva',/rota exclusiva|rota de farm exclusiva|^rota (fac|org)/],
 ['arena',/arena/],
 ['craft',/craft|fabrica/],
 ['farm',/\bfarm\b/],
 ['vipOrg',/\bvip\b/]
];
const DLV_SPAWNABLE={garagemDeluxe:'garagemDeluxeSpawn',garagemVip:'garagemVipSpawn',garagemPublica:'garagemPublicaSpawn',garagemPublica2:'garagemPublica2Spawn',heliponto:'helipontoSpawn'};
const DLV_IGNORE=/^(group|grupo|local|qg|localizacao|segmento|produto|status|lider|proprietario|organizacao|organizacoes|faccao|staff|entregue por|data|data de entrega|contingente|quantidade contingente|observac|obs|n|no|numero|cds|coordenada|coordenadas|anuncio|coluna \d+|true|false|completo|pendente|disp|ocup|setado|remover|vencimentos?|legendas?|vips? (esmeralda|prata|ouro|deluxe|obsidian|premium))\b/;

function dlvLabelKey(label){const l=dlvFold(label);for(const [k,re] of DLV_LABEL_RULES)if(re.test(l))return k;return ''}

/* Fichas ancoradas em "GROUP" (mesma leitura do bot) e, se não houver,
   tabela com coluna GROUP ou tabela com um Group por coluna. */
function dlvSheetEntries(tab,group){
 const cells=tab?.grid?.cells||[tab?.header||[],...(tab?.rows||[])];
 const want=dlvAlnum(group),out=[];
 if(!want||!cells.length)return out;
 // 1) Fichas.
 for(let ri=0;ri<cells.length;ri++){const line=cells[ri]||[];
  for(let ci=0;ci<line.length;ci++){
   if(!/^(group|grupo)$/.test(dlvFold(line[ci])))continue;
   let end=line.length;for(let k=ci+1;k<line.length;k++)if(/^(group|grupo)$/.test(dlvFold(line[k]))){end=k;break}
   const pick=r=>{for(let k=ci+1;k<end;k++)if(cells[r]?.[k])return k;return -1};
   const gi=pick(ri);if(gi<0||dlvAlnum(cells[ri][gi])!==want)continue;
   // Quadros completos possuem linhas vazias e agora até 45+ campos.
   // Não interromper após duas linhas sem rótulo; finalizar no rodapé TRUE.
   for(let rj=ri+1;rj<Math.min(cells.length,ri+90);rj++){const label=cells[rj]?.[ci]||'';
    if(/^(group|grupo|true)$/.test(dlvFold(label)))break;
    if(!label)continue;
    const vi=pick(rj);out.push({label,value:vi>=0?cells[rj][vi]:'',row:rj,col:vi>=0?vi:gi});
   }
  }
 }
 if(out.length)return out;
 // 2) Tabela com coluna GROUP.
 for(let hi=0;hi<Math.min(cells.length,200);hi++){const head=cells[hi]||[];
  if(head.some(x=>dlvFold(x)==='pacote vip org'))continue;
  const gc=head.findIndex(x=>/^(group|grupo)\b/.test(dlvFold(x)));
  if(gc<0)continue;
  for(let ri=hi+1;ri<cells.length;ri++){const r=cells[ri]||[];
   if(dlvAlnum(r[gc])!==want)continue;
   head.forEach((label,i)=>{if(i!==gc&&label)out.push({label,value:r[i]||''})});
  }
  if(out.length)return out;
 }
 // 3) Um Group por coluna, rótulo na primeira coluna.
 for(let hi=0;hi<Math.min(cells.length,200);hi++){const head=cells[hi]||[];
  const gc=head.findIndex(x=>dlvAlnum(x)===want);
  if(gc<0)continue;
  for(let ri=hi+1;ri<cells.length;ri++){const r=cells[ri]||[];if(r[0])out.push({label:r[0],value:r[gc]||''})}
  return out;
 }
 return out;
}

/* Converte as linhas da planilha em campos de benefício do High OS. */
function dlvSheetBenefits(group,tabs){
 const b={},src={},unknown=[];let found=0,last='';
 const set=(field,value,key,tabName,label)=>{if(b[field]&&!(b[field]===true||b[field]==='SIM'))return;if(b[field]&&(value===true||value==='SIM'))return;b[field]=value;src[key]=`${tabName} › ${label}`};
 for(const tab of tabs||[]){
  const entries=dlvSheetEntries(tab,group);if(entries.length)found++;
  for(const {label,value} of entries){
   const l=dlvFold(label),v=String(value||'').trim();
   // Spawn logo abaixo da garagem/heliponto.
   if(/^(spawn|saida|vaga)/.test(l)&&DLV_SPAWNABLE[last]){if(v&&!dlvNegative(v))set(DLV_SPAWNABLE[last],v,last,tab.name,label);continue}
   // Campos extras de um quadro expandido: não confundir telão/garagens.
   const tel=l.match(/^telao (modelo|postit|caixa [1-4])$/);
   if(tel){if(v&&!dlvNegative(v)){
    const f=tel[1]==='modelo'?'telaoNome':tel[1]==='postit'?'telaoPostit':'telaoCaixa'+tel[1].slice(-1);
    set(f,v,'telao',tab.name,label);set('telao',true,'telao',tab.name,label);
   }continue}
   if(l==='intervalo salario'){if(v&&!dlvNegative(v))set('salarioMinutos',v,'salario',tab.name,label);continue}
   if(l==='capacidade bau'){if(v&&!dlvNegative(v))set('bauCapacidade',v,'bau',tab.name,label);continue}
   if(l==='veiculos vip'){if(v&&!dlvNegative(v))set('garagemVipVeiculos',v,'garagemVip',tab.name,label);continue}
   if(l==='cds rota exclusiva'){if(v&&!dlvNegative(v)){set('rotaBlips',v,'rotaExclusiva',tab.name,label);set('rotaExclusiva',true,'rotaExclusiva',tab.name,label)}continue}
   // Campo que lista vários benefícios ("Benefícios: Loja de roupa, Barbearia...").
   if(/benef|estrutura|instala|setage/.test(l)&&v&&!dlvLabelKey(label)){
    v.split(/[,;\n•|/]+/).map(x=>x.trim()).filter(Boolean).forEach(item=>{const k=dlvLabelKey(item);if(k&&!b[k])set(k,'SIM',k,tab.name,label);else if(!k)unknown.push(item)});
    continue}
   if(l.startsWith('vip |')||l==='vip org | checklist')continue;
   if(DLV_IGNORE.test(l))continue;
   const key=dlvLabelKey(label);last=key||last;
   if(!key){if(v&&!dlvNegative(v)&&!DLV_IGNORE.test(l))unknown.push(label);continue}
   if(!v||dlvNegative(v))continue;
   const spawn=/spawn|saida/.test(l);
   if(['garagemVip','garagemPublica','garagemPublica2','garagemDeluxe'].includes(key)){
    // Na planilha a garagem vem como "blip / spawn" na mesma célula.
    const parts=v.split(/\s+\/\s*|\s*\/\s+/).map(x=>x.trim()).filter(x=>x&&!dlvNegative(x));
    if(spawn)set(key+'Spawn',parts[0]||v,key,tab.name,label);
    else{set(key+'Blip',parts[0]||v,key,tab.name,label);if(parts[1])set(key+'Spawn',parts[1],key,tab.name,label)}
    if(key!=='garagemVip')set(key,true,key,tab.name,label)}
   else if(key==='heliponto'){set(spawn?'helipontoSpawn':'helipontoBlip',v,key,tab.name,label);set('heliponto',true,key,tab.name,label)}
   else if(key==='telao'){if(!dlvAffirmative(v))set('telaoCds',v,key,tab.name,label);set('telao',true,key,tab.name,label)}
   else if(key==='salario'){const n=(v.match(/[\d.]+/)||[''])[0].replace(/\./g,'');set('salario',n||v,key,tab.name,label)}
   else if(key==='vipOrg')set('vipOrg',dlvAffirmative(v)?true:v,key,tab.name,label);
   else if(['chatFaccao','rotaExclusiva','roupasFaccao'].includes(key)){set(key,true,key,tab.name,label);if(key==='rotaExclusiva'&&!dlvAffirmative(v))set('rotaBlips',v,key,tab.name,label)}
   else set(key,dlvAffirmative(v)?'SIM':v,key,tab.name,label);
  }
 }
 return {b,src,found,unknown:[...new Set(unknown)].slice(0,12)};
}

/* Leitura direta da planilha oficial: as fichas vão até CD, além do corte
   de 40 colunas que existia no espelho do Discord (LAVAGEM09 fica em BK).
   Esta consulta é somente leitura e não altera nenhuma célula. */
async function dlvReadOfficialTabs(token){
 const base='https://sheets.googleapis.com/v4/spreadsheets/1zs-LNN1XS8t9cYwHe4_6TMxRDIy6yS-cLv66Rx_K9C4/values/';
 const specs=[
  {name:'BENEFICIOS FACÇÕES',range:"'BENEFICIOS FACÇÕES'!A:AU"},
  {name:'BLIPS COORDENADAS',range:"'BLIPS COORDENADAS'!A:CD"}
 ];
 return Promise.all(specs.map(async item=>{
  const url=base+encodeURIComponent(item.range)+'?valueRenderOption=FORMATTED_VALUE';
  const data=await sheetsFetch(url,token);
  return {name:item.name,grid:{cells:data.values||[]},receivedAt:new Date().toISOString()};
 }));
}
async function dlvLoadSheet(force=false){
 if(!force&&dlvSheetCache.tabs&&Date.now()-dlvSheetCache.at<DLV_SHEET_TTL&&!((sheetsAccessToken||facSheetAccessToken)&&dlvSheetCache.source!=='original'))return dlvSheetCache;
 if(dlvSheetCache.promise)return dlvSheetCache.promise;
 dlvSheetCache.promise=(async()=>{
  let directError='';
  if(facSheetAccessToken||sheetsAccessToken){
   try{
    const tabs=await dlvReadOfficialTabs(facSheetAccessToken||sheetsAccessToken);
    dlvSheetCache={at:Date.now(),tabs,promise:null,error:'',source:'original'};
    return dlvSheetCache;
   }catch(error){
    directError=error?.message||String(error);
    console.warn('[ENTREGA] Google Sheets original indisponível; tentando espelho:',error);
   }
  }
  const tabs=[],errors=[];
  for(const slug of DLV_SHEET_TABS){
   try{tabs.push(await highOsStoreGet('planilha',slug))}catch(e){errors.push(slug+': '+e.message)}
  }
  dlvSheetCache={at:Date.now(),tabs,promise:null,source:'espelho',
   error:directError?'Falha ao ler a planilha original: '+directError:(tabs.length?'':(errors.join(' • ')||'abas não encontradas'))};
  return dlvSheetCache;
 })().catch(e=>{dlvSheetCache={...dlvSheetCache,promise:null,error:e.message};return dlvSheetCache});
 return dlvSheetCache.promise;
}

/* Dados que a entrega precisa quando o benefício ainda não existe no Group.
   [campo, rótulo, placeholder, opcional, multilinha] */
const DLV_NEEDS={
 vipOrg:[],chatFaccao:[],
 radio:[['radio','Frequência da rádio','Ex.: 155']],
 salario:[['salario','Valor do salário','Ex.: 5000'],['salarioMinutos','A cada (minutos)','40',true]],
 garagemVip:[['garagemVipBlip','Blip (CDS)','x, y, z'],['garagemVipSpawn','Spawn (CDS)','x, y, z, h']],
 garagemPublica:[['garagemPublicaBlip','Blip (CDS)','x, y, z'],['garagemPublicaSpawn','Spawn (CDS)','x, y, z, h']],
 garagemPublica2:[['garagemPublica2Blip','Blip (CDS)','x, y, z'],['garagemPublica2Spawn','Spawn (CDS)','x, y, z, h']],
 blindados:[['blindados','CDS / configuração dos blindados','x, y, z, h']],
 garagemDeluxe:[['garagemDeluxeBlip','Blip (CDS)','x, y, z'],['garagemDeluxeSpawn','Spawn (CDS)','x, y, z, h']],
 shopDeluxe:[['shopDeluxe','CDS do Shop Deluxe','x, y, z']],
 academia:[['academia','CDS da academia','x, y, z']],
 sinuca:[['sinuca','CDS da sinuca','x, y, z']],
 roupasFaccao:[],
 heliponto:[['helipontoBlip','Blip (CDS)','x, y, z'],['helipontoSpawn','Spawn (CDS)','x, y, z, h',true]],
 rotaInicio:[['rotaInicio','CDS para iniciar a rota','x, y, z, h']],
 rotaExclusiva:[['rotaBlips','Pontos da rota (uma CDS por linha)','x, y, z',false,true]],
 telao:[['telaoNome','Prop / modelo do telão','Ex.: prop_telao',false],['telaoCds','CDS do telão','x, y, z'],['telaoPostit','CDS do postit','x, y, z',true],
  // Caixas de som: até 4; a próxima aparece quando a anterior é preenchida.
  ['telaoCaixa1','CDS da caixa de som 1','x, y, z',true],['telaoCaixa2','CDS da caixa de som 2','x, y, z',true,false,'telaoCaixa1'],['telaoCaixa3','CDS da caixa de som 3','x, y, z',true,false,'telaoCaixa2'],['telaoCaixa4','CDS da caixa de som 4','x, y, z',true,false,'telaoCaixa3']],
 lojaRoupas:[['lojaRoupas','CDS da loja','x, y, z']],
 barbearia:[['barbearia','CDS da barbearia','x, y, z']],
 tatuagem:[['tatuagem','CDS da tatuagem','x, y, z']],
 shopExclusivo:[['shopExclusivo','CDS da loja da facção','x, y, z']],
 atm:[['atm','CDS do ATM','x, y, z']],
 bau:[['bau','CDS do baú','x, y, z'],['bauCapacidade','Capacidade','',true]],
 farm:[['farm','CDS / descrição do farm','x, y, z']],
 craft:[['craft','CDS do craft','x, y, z']],
 bar:[['bar','CDS do bar','x, y, z']],
 arena:[['arena','CDS da arena','x, y, z']]
};

let dlvCurrent={group:'',stored:{},sheet:{b:{},src:{},found:0,unknown:[]},status:''};

/* Benefícios do Group: planilha manda; o cadastro do High OS completa. */
function dlvMergedBenefits(){
 const out={...(dlvCurrent.stored||{})};
 Object.entries(dlvCurrent.sheet?.b||{}).forEach(([k,v])=>{if(v!==''&&v!=null)out[k]=v});
 return out;
}
/* VIP Org Ultra é um pacote OPCIONAL por entrega e não a garagem VIP já instalada.
   A avaliação usa somente instalações anteriores (base): proposta/pedido não é execução. */
/* Fonte oficial da entrega: checklist VIP por Group na aba BLIPS COORDENADAS.
   Coordenadas e benefícios físicos são independentes do pacote comercial. */
const dlvVipCustomItems=new Set();
const DLV_VIP_ITEMS=[
 {key:'salario',label:'Salário R$ 1.200 / 30 min',status:'SALÁRIO ATIVO',origin:'SALÁRIO ORIGEM',extra:['SALÁRIO VALOR','SALÁRIO INTERVALO (MIN)']},
 {key:'bau',label:'Baú de 2.000 kg',status:'BAÚ 2000KG ATIVO',origin:'BAÚ ORIGEM',extra:['CAPACIDADE BAÚ KG']},
 {key:'roupasFaccao',label:'2 peças de uniforme',status:'UNIFORME 2 PEÇAS',origin:'UNIFORME ORIGEM'},
 {key:'mochila',label:'Mochila entregue',status:'MOCHILA ENTREGUE',origin:'MOCHILA ORIGEM'},
 {key:'radio',label:'Rádio exclusiva',status:'RÁDIO EXCLUSIVA ATIVA',origin:'RÁDIO ORIGEM',extra:['FREQUÊNCIA RÁDIO']},
 {key:'rotaExclusiva',label:'Rota exclusiva',status:'ROTA EXCLUSIVA ATIVA',origin:'ROTA ORIGEM'},
 {key:'chatFaccao',label:'Chat da facção',status:'CHAT FACÇÃO ATIVO',origin:'CHAT ORIGEM'},
 {key:'xmaxx',label:'xMaxx',status:'XMAXX ATIVA',origin:'XMAXX ORIGEM'},
 {key:'bm4g82',label:'BM4G82',status:'BM4G82 ATIVA',origin:'BM4G82 ORIGEM'},
 {key:'garagemVip',label:'Garagem VIP Fac',status:'GARAGEM VIP ATIVA',origin:'GARAGEM ORIGEM'},
 {key:'mule',label:'Mule setado',status:'MULE SETADO',origin:'MULE ORIGEM',id:'MULE ID'},
 {key:'cargobob',label:'Cargobob setado',status:'CARGOBOB SETADO',origin:'CARGOBOB ORIGEM',id:'CARGOBOB ID'},
 {key:'telao',label:'Telão (prop + caixas na aba BLIPS)',status:'TELÃO ATIVO',origin:'TELÃO ORIGEM'}
];
const DLV_VIP_META=['PACOTE VIP ORG','VIP ORG ATIVO','ORIGEM DO PACOTE','OBSERVAÇÕES'];
const DLV_VIP_ORIGINS=['','PACOTE ULTRA','PACOTE PERSONALIZADO','AVULSO','BENEFÍCIO BASE','OUTRO','NÃO INFORMADO'];
const DLV_VIP_STATUSES=['','SIM','NÃO','PENDENTE'];
const DLV_VIP_PACKAGES=['','NENHUM','ORG ULTRA','PERSONALIZADO','AVULSO'];
const DLV_VIP_SHEET_ID='1zs-LNN1XS8t9cYwHe4_6TMxRDIy6yS-cLv66Rx_K9C4';
const DLV_VIP_SHEET_GID=1358800909;
function dlvVipRead(group,tabs=[]){
 const tab=tabs.find(t=>dlvAlnum(t.name)==='beneficiosfaccoes');
 const cells=tab?.grid?.cells||[],want=dlvAlnum(group),result={};
 if(!want||!cells.length)return result;
 let header=-1,gc=-1;
 for(let i=0;i<cells.length;i++){
  const row=cells[i]||[],g=row.findIndex(x=>dlvFold(x)==='group');
  if(g>=0&&dlvFold(row[g+3])==='pacote vip org'){header=i;gc=g;break}
 }
 if(header<0)return result;
 let match=-1;
 for(let r=header+1;r<cells.length;r++)if(dlvAlnum(cells[r]?.[gc])===want){
  if(match>=0)throw new Error('Group duplicado no inventário VIP: '+group);
  match=r;
 }
 if(match<0)return result;
 for(let col=gc;col<(cells[header]||[]).length;col++){
  const label=String(cells[header][col]||'').trim().toUpperCase();
  if(label)result[label]={label,value:String(cells[match]?.[col]??'').trim(),row:match,col};
 }
 return result;
}
function dlvVipValue(label){return dlvCurrent.vip?.[label]?.value||''}
function dlvVipSelect(label,options){
 const value=dlvVipValue(label);
 return '<select data-vip-sheet-field="'+esc(label)+'" aria-label="'+esc(label)+'">'
  +options.map(x=>'<option value="'+esc(x)+'"'+(x===value?' selected':'')+'>'+(x?esc(x):'Não informado')+'</option>').join('')
  +'</select>';
}
function dlvVipExistingDetail(item){
 const b=dlvMergedBenefits();
 const text={
  salario:b.salario?'R$ '+b.salario+' / '+(b.salarioMinutos||'?')+' min':'',
  bau:[b.bau,b.bauCapacidade?b.bauCapacidade+' kg':''].filter(Boolean).join(' · '),
  roupasFaccao:b.roupasFaccao?'Uniformes cadastrados; entrega pendente de confirmação':'',
  mochila:b.mochila?'Mochila cadastrada':'',
  radio:b.radio?'Frequência: '+b.radio:'',
  rotaExclusiva:b.rotaBlips?'CDS: '+b.rotaBlips:(b.rotaInicio?'Início da rota comum: '+b.rotaInicio:''),
  chatFaccao:b.chatFaccao?'Chat encontrado':'',
  xmaxx:b.garagemVipVeiculos?'Veículos: '+b.garagemVipVeiculos:'',
  bm4g82:b.garagemVipVeiculos?'Veículos: '+b.garagemVipVeiculos:'',
  garagemVip:[b.garagemVipBlip,b.garagemVipSpawn].filter(Boolean).join(' / '),
  telao:[b.telaoNome,b.telaoCds,b.telaoPostit,...[1,2,3,4].map(i=>b['telaoCaixa'+i])].filter(Boolean).join(' / ')
 }[item.key]||'';
 return text?'<small class="dlv-vip-existing">Dados cadastrados: '+esc(text)+'</small>':'';
}
function dlvRenderVipSheet(){
 const panel=$('#dVipSheetPanel'),list=$('#dVipSheetChecklist'),meta=$('#dVipSheetMeta');
 if(!panel||!list||!meta)return;
 panel.hidden=!dlvCurrent.group;
 if(panel.hidden)return;
 if(dlvSheetCache.source!=='original'){
  meta.innerHTML='<small>Conecte o Google Sheets e clique em ATUALIZAR DA PLANILHA para editar os dados oficiais.</small>';
  list.innerHTML='';
  return;
 }
 meta.innerHTML='<label class="dlv-vip-field"><b>Pacote adquirido</b>'+dlvVipSelect('PACOTE VIP ORG',DLV_VIP_PACKAGES)+'</label>'
  +'<label class="dlv-vip-field"><b>VIP Org ativado</b>'+dlvVipSelect('VIP ORG ATIVO',DLV_VIP_STATUSES)+'</label>'
  +'<label class="dlv-vip-field"><b>Origem geral</b>'+dlvVipSelect('ORIGEM DO PACOTE',DLV_VIP_ORIGINS)+'</label>';
 list.innerHTML=DLV_VIP_ITEMS.map(item=>
  '<div class="dlv-vip-sheet-row"><b>'+esc(item.label)+'</b>'+dlvVipExistingDetail(item)+
  (dlvSelectedVipPackage()==='PERSONALIZADO'?'<label class="dlv-vip-custom"><input type="checkbox" data-vip-custom-item="'+esc(item.key)+'" '+(dlvVipCustomItems.has(item.key)?'checked':'')+'> Incluir neste pacote</label>':'')+
  '<label>Status'+dlvVipSelect(item.status,DLV_VIP_STATUSES)+'</label>'+
  '<label>Origem'+dlvVipSelect(item.origin,DLV_VIP_ORIGINS)+'</label>'+
  (item.id?'<label>ID setado<input data-vip-sheet-field="'+esc(item.id)+'" value="'+esc(dlvVipValue(item.id))+'" placeholder="ID do jogador"></label>':'')+
  (item.extra||[]).map(field=>'<label>'+esc(field)+'<input data-vip-sheet-field="'+esc(field)+'" value="'+esc(dlvVipValue(field))+'" placeholder="Valor conferido"></label>').join('')+'</div>'
 ).join('');
 list.innerHTML+='<label class="dlv-vip-field"><b>Observações do VIP Org</b><input data-vip-sheet-field="OBSERVAÇÕES" value="'+esc(dlvVipValue('OBSERVAÇÕES'))+'" placeholder="Observações do pacote ou instalações"></label>';
 const feedback=$('#dVipSheetFeedback');if(feedback)feedback.textContent='Dados oficiais do '+dlvCurrent.group+'. Salvar altera somente a linha de benefícios deste Group, sem modificar as coordenadas.';
}
function dlvVipFormChanges(){
 return [...document.querySelectorAll('[data-vip-sheet-field]')].map(el=>({label:el.dataset.vipSheetField,value:el.value.trim()}));
}
async function dlvSaveVipSheet({fromDelivery=false,silent=false}={}){
 const group=dlvCurrent.group;
 if(!group)throw Error('Selecione um Group.');
 const form=dlvVipFormChanges();
 const baseline=new Map(Object.entries(dlvCurrent.vip||{}).map(([label,x])=>[label,String(x.value??'').trim()]));
 // Somente campos ALTERADOS pelo operador. Não reenviar campos intactos.
 const edits=new Map(form.filter(x=>x.value!==(baseline.get(x.label)||'')).map(x=>[x.label,x.value]));
 if(fromDelivery){
  const chosen=dlvSelectedVipPackage();
  const faccao=$('#dFaccao')?.value.trim()||'';
  const oldOwner=baseline.get('FACÇÃO BENEFICIÁRIA')||'';
  const changedOwner=!!oldOwner&&dlvAlnum(oldOwner)!==dlvAlnum(faccao);
  if(faccao)edits.set('FACÇÃO BENEFICIÁRIA',faccao);
  if($('#dLider')?.value.trim())edits.set('LÍDER / ID',$('#dLider').value.trim());
  if($('#dData')?.value.trim())edits.set('DATA DA ENTREGA',$('#dData').value.trim());
  if(changedOwner){
   // Veículos setados em IDs e entregas pessoais não passam automaticamente ao novo ocupante.
   for(const [status,id] of [['MULE SETADO','MULE ID'],['CARGOBOB SETADO','CARGOBOB ID']]){
    edits.set(status,'PENDENTE');edits.set(id,'');
   }
   for(const status of ['UNIFORME 2 PEÇAS','MOCHILA ENTREGUE'])edits.set(status,'PENDENTE');
   edits.set('VIP ORG ATIVO','PENDENTE');
   if(!chosen)edits.set('PACOTE VIP ORG','NENHUM');
  }
  if(chosen){
   edits.set('PACOTE VIP ORG',chosen==='ORG_ULTRA'?'ORG ULTRA':'PERSONALIZADO');
   if(!edits.has('ORIGEM DO PACOTE')||!edits.get('ORIGEM DO PACOTE'))edits.set('ORIGEM DO PACOTE',chosen==='ORG_ULTRA'?'PACOTE ULTRA':'PACOTE PERSONALIZADO');
  }
  for(const x of dlvUltraStaffConfirmed){
   const item=DLV_VIP_ITEMS.find(item=>item.key===x);
   if(item)edits.set(item.status,'SIM');
  }
  for(const [key,idSel,idLabel] of [
    ['mule','#dVipMuleId','MULE ID'],
    ['cargobob','#dVipCargobobId','CARGOBOB ID']]){
   const marked=$('#dVip'+(key==='mule'?'Mule':'Cargobob')+'Set')?.checked;
   if(!marked)continue;
   const id=String($(idSel)?.value||edits.get(idLabel)||'').trim();
   if(!/^\d+$/.test(id))throw Error('Informe o ID numérico do '+key+' antes de confirmar a setagem.');
   edits.set(idLabel,id);
   const item=DLV_VIP_ITEMS.find(x=>x.key===key);
   edits.set(item.status,'SIM');
   if(chosen&&!edits.get(item.origin)&&!(baseline.get(item.origin)||''))edits.set(item.origin,chosen==='ORG_ULTRA'?'PACOTE ULTRA':'PACOTE PERSONALIZADO');
  }
 }
 // Setagem confirmada de veículos precisa identificar o membro.
 for(const key of ['mule','cargobob']){
  const item=DLV_VIP_ITEMS.find(x=>x.key===key);
  const status=edits.has(item.status)?edits.get(item.status):dlvVipValue(item.status);
  const id=edits.has(item.id)?edits.get(item.id):dlvVipValue(item.id);
  if(status==='SIM'&&!/^\d+$/.test(String(id||'')))throw Error('Informe o ID do membro que recebeu o '+(key==='mule'?'Mule':'Cargobob')+' antes de marcar SIM.');
 }
 if(!edits.size)return true;
 if(dlvSheetCache.source!=='original')throw Error('Conecte o Google Sheets e atualize a leitura da planilha antes de salvar o checklist.');
 const token=await facSheetAuthorize();
 // Buscar o quadro do Group no momento da gravação, nunca usar posições antigas.
 const url='https://sheets.googleapis.com/v4/spreadsheets/'+DLV_VIP_SHEET_ID;
 const fresh=await facSheetFetch(url+'/values/'+encodeURIComponent("'BENEFICIOS FACÇÕES'!A:AU")+'?valueRenderOption=FORMATTED_VALUE',{token});
 let found=dlvVipRead(group,[{name:'BENEFICIOS FACÇÕES',grid:{cells:fresh.values||[]}}]);
 if(!Object.keys(found).length){
  // Novo Group: acrescentar uma linha no fim do inventário, sem tocar na tabela antiga.
  const rows=fresh.values||[];
  const header=rows.findIndex(row=>{const g=(row||[]).findIndex(x=>dlvFold(x)==='group');return g>=0&&dlvFold(row[g+3])==='pacote vip org'});
  if(header<0)throw Error('Tabela de inventário VIP não encontrada. Nenhuma célula foi alterada.');
  const col=(rows[header]||[]).findIndex(x=>dlvFold(x)==='group');
  let dest=header+1;
  while(dest<rows.length&&rows[dest]?.[col])dest++;
  if((rows[dest]||[]).some(x=>x!==null&&x!==undefined&&x!==''))throw Error('Linha final do inventário está ocupada. Nenhuma célula foi alterada.');
  const meta=await facSheetFetch(url+'?fields=sheets.properties(sheetId,gridProperties(rowCount))',{token});
  const properties=(meta.sheets||[]).find(x=>Number(x.properties?.sheetId)===DLV_VIP_SHEET_GID)?.properties;
  if(!properties)throw Error('Aba de benefícios não disponível para cadastro do novo Group.');
  const creation=[];
  if(dest>=Number(properties.gridProperties?.rowCount||0))creation.push({appendDimension:{sheetId:DLV_VIP_SHEET_GID,dimension:'ROWS',length:5}});
  creation.push({copyPaste:{source:{sheetId:DLV_VIP_SHEET_GID,startRowIndex:dest-1,endRowIndex:dest,startColumnIndex:col,endColumnIndex:col+42},
   destination:{sheetId:DLV_VIP_SHEET_GID,startRowIndex:dest,endRowIndex:dest+1,startColumnIndex:col,endColumnIndex:col+42},pasteType:'PASTE_NORMAL',pasteOrientation:'NORMAL'}});
  creation.push({repeatCell:{range:{sheetId:DLV_VIP_SHEET_GID,startRowIndex:dest,endRowIndex:dest+1,startColumnIndex:col,endColumnIndex:col+42},cell:{},fields:'userEnteredValue'}});
  creation.push({updateCells:{start:{sheetId:DLV_VIP_SHEET_GID,rowIndex:dest,columnIndex:col},rows:[{values:[{userEnteredValue:{stringValue:group}}]}],fields:'userEnteredValue'}});
  creation.push({setBasicFilter:{filter:{range:{sheetId:DLV_VIP_SHEET_GID,startRowIndex:header,endRowIndex:dest+1,startColumnIndex:col,endColumnIndex:col+42}}}});
  await facSheetFetch(url+':batchUpdate',{token,method:'POST',body:{requests:creation}});
  const reloaded=await facSheetFetch(url+'/values/'+encodeURIComponent("'BENEFICIOS FACÇÕES'!A:AU")+'?valueRenderOption=FORMATTED_VALUE',{token});
  found=dlvVipRead(group,[{name:'BENEFICIOS FACÇÕES',grid:{cells:reloaded.values||[]}}]);
  if(!Object.keys(found).length)throw Error('Falha ao cadastrar o novo Group no inventário VIP.');
 }
 const requests=[];
 for(const [label,value] of edits){
  const item=found[label];
  if(!item)throw Error('O campo '+label+' não existe no quadro '+group+'.');
  if(!Number.isInteger(item.row)||!Number.isInteger(item.col)||item.col<0)throw Error('Posição inválida para '+label);
  const remote=String(item.value??'').trim(),old=baseline.get(label)||'';
  if(remote===value)continue;
  if(remote!==old)throw Error('O campo '+label+' do '+group+' foi alterado na planilha por outra pessoa. Atualize a planilha e revise antes de salvar.');
  requests.push({updateCells:{start:{sheetId:DLV_VIP_SHEET_GID,rowIndex:item.row,columnIndex:item.col},
   rows:[{values:[{userEnteredValue:{stringValue:value}}]}],fields:'userEnteredValue'}});
 }
 if(requests.length){
  const last=found['ATUALIZADO EM'],by=found['ATUALIZADO POR'];
  if(last)requests.push({updateCells:{start:{sheetId:DLV_VIP_SHEET_GID,rowIndex:last.row,columnIndex:last.col},rows:[{values:[{userEnteredValue:{stringValue:new Date().toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})}}]}],fields:'userEnteredValue'}});
  if(by)requests.push({updateCells:{start:{sheetId:DLV_VIP_SHEET_GID,rowIndex:by.row,columnIndex:by.col},rows:[{values:[{userEnteredValue:{stringValue:currentUser?.email||''}}]}],fields:'userEnteredValue'}});
  await facSheetFetch(url+':batchUpdate',{token,method:'POST',body:{requests}});
 }
 for(const [label,value] of edits){if(dlvCurrent.vip?.[label])dlvCurrent.vip[label].value=value;}
 dlvSheetCache={at:0,tabs:null,promise:null,error:'',source:''};
 if(!silent){await fillDeliveryFromGroup(group,{force:true});const fb=$('#dVipSheetFeedback');if(fb)fb.textContent='Checklist salvo no Google Sheets • '+requests.length+' campo(s) atualizado(s).'}
 return true;
}
const DLV_ULTRA_PACKAGE_KEYS=new Set(['vipOrg','salario','chatFaccao','radio','garagemVip','bau','roupasFaccao','rotaExclusiva']);
const dlvUltraStaffConfirmed=new Set();
function dlvSelectedVipPackage(){const value=$('#dVipPackage')?.value;return value==='ORG_ULTRA'||value==='PERSONALIZADO'?value:''}
function dlvUltraNumber(value){
 const x=String(value??'').replace(/[^\d,.]/g,'').trim();
 if(!x)return 0;
 return Number(x.includes(',')?x.replace(/\./g,'').replace(',','.'):x.replace(/\.(?=\d{3}(?:\.|$))/g,''))||0;
}
function dlvUltraAssessment(base=dlvMergedBenefits()){
 const f=faccoes.find(x=>x.group===dlvCurrent.group)||{};
 const t=f.perfilTecnico||{}, b=base||{};
 const present=v=>!!v&&!dlvNegative(v);
 const salary=dlvUltraNumber(dlvVipValue('SALÁRIO VALOR')||b.salario),minutes=dlvUltraNumber(dlvVipValue('SALÁRIO INTERVALO (MIN)')||b.salarioMinutos);
 const garagePresent=!!(b.garagemVipBlip||b.garagemVipSpawn||t?.operacional?.garagens?.some(g=>dlvAlnum(g.tipo)==='faccao'&&g.blip));
 const vehicles=[b.garagemVipVeiculos,...(t?.operacional?.garagens||[]).map(g=>g.veiculos)].filter(Boolean).join(' ').toUpperCase();
 const bauPresent=present(b.bau)||present(t?.operacional?.bau?.cds);
 const capacity=dlvUltraNumber(dlvVipValue('CAPACIDADE BAÚ KG')||b.bauCapacidade||t?.operacional?.bau?.capacidade);
 const uniform=present(b.roupasFaccao);
 const uniformeQtd=dlvUltraNumber(b.uniformesQuantidade||b.uniformesQtd||0);
 const mochila=present(b.mochila);
 const list=[
  {key:'salario',label:'Salário R$ 1.200 a cada 30 minutos',
   ok:salary>=1200&&minutes>0&&minutes<=30,
   detail:salary?('Atual: R$ '+salary.toLocaleString('pt-BR')+(minutes?' / '+minutes+' min':' / intervalo não confirmado')):'Sem salário configurado',
   action:'Configurar ou ajustar salário para R$ 1.200 a cada 30 minutos (preservar valor maior e intervalo menor, se já existentes)'},
  {key:'chatFaccao',label:'Chat interno da organização',ok:present(b.chatFaccao),
   detail:present(b.chatFaccao)?'Já cadastrado':'Não localizado',
   action:'Ativar chat interno da organização'},
  {key:'garagemVip',label:'Estrutura da garagem VIP Fac',ok:garagePresent,
   detail:garagePresent?'Aproveitar blip/garagem existente':'Não foi encontrada garagem VIP Fac',
   action:'Adicionar garagem VIP Fac apenas se não houver nenhuma; manter a estrutura existente e suas CDS'},
  {key:'xmaxx',label:'Garagem / veículo xMaxx',ok:vehicles.includes('XMAXX'),
   detail:vehicles.includes('XMAXX')?'xMaxx já identificado':'Não identificado nos veículos da garagem',
   action:'Conferir ou configurar xMaxx na garagem VIP (aproveitar o blip existente quando possível)'},
  {key:'bm4g82',label:'Garagem / veículo BM4G82',ok:vehicles.includes('BM4G82'),
   detail:vehicles.includes('BM4G82')?'BM4G82 já identificado':'Não identificado nos veículos da garagem',
   action:'Conferir ou configurar BM4G82 na garagem VIP (aproveitar o blip existente quando possível)'},
  {key:'bau',label:'Baú com capacidade de 2.000 kg',ok:bauPresent&&capacity>=2000,
   detail:bauPresent?'Baú existente'+(capacity?' · '+capacity+' kg':' · capacidade não informada'):'Nenhum baú localizado',
   action:bauPresent?'Conferir e, se necessário, ampliar o baú existente para 2.000 kg (não criar outro baú)':'Adicionar baú com capacidade de 2.000 kg e informar CDS'},
  {key:'roupasFaccao',label:'2 peças de uniforme',ok:uniform&&uniformeQtd>=2,
   detail:uniform?'Uniforme cadastrado; conferir quantidade e mochila':'Uniforme e mochila não confirmados',
   action:uniform?'Conferir a entrega das 2 peças de uniforme':'Disponibilizar 2 peças de uniforme'},
  {key:'mochila',label:'Mochila entregue',ok:mochila,detail:mochila?'Mochila confirmada':'Mochila não confirmada',action:'Disponibilizar mochila à facção'}, 
  {key:'radio',label:'Rádio exclusiva',ok:present(dlvVipValue('FREQUÊNCIA RÁDIO')||b.radio),
   detail:present(dlvVipValue('FREQUÊNCIA RÁDIO')||b.radio)?'Rádio existente: '+String(dlvVipValue('FREQUÊNCIA RÁDIO')||b.radio):'Não localizada',
   action:'Ativar rádio exclusiva e registrar a frequência'},
  {key:'rotaExclusiva',label:'Rota de farm exclusiva',ok:present(b.rotaExclusiva)||present(b.rotaBlips),
   detail:present(b.rotaExclusiva)||present(b.rotaBlips)?'Rota exclusiva identificada':'Somente iniciar rota não comprova rota exclusiva',
   action:'Ativar rota de farm exclusiva com as respectivas CDS (não confundir com INICIAR ROTA)'}
 ];
 return list.map(item=>{
  const vipItem=DLV_VIP_ITEMS.find(x=>x.key===item.key);
  const status=String(vipItem?dlvVipValue(vipItem.status):'').toUpperCase();
  const origin=vipItem?dlvVipValue(vipItem.origin):'';
  const statusFromSheet=['SIM','NÃO','PENDENTE'].includes(status);
  const sheetOk=status==='SIM';
  const sourceOk=statusFromSheet?(sheetOk&&(['salario','bau','radio'].includes(item.key)?item.ok:true)):item.ok;
  const confirmed=dlvUltraStaffConfirmed.has(item.key);
  return {...item,detail:item.detail+(statusFromSheet?' · Planilha: '+status:'')+(origin?' · Origem: '+origin:''),
   sourceOk,confirmed,ok:sourceOk||confirmed};
 });
}
function dlvRenderUltraReview(){
 const el=$('#dVipUltraReview'),body=$('#dVipUltraItems');
 if(!el||!body)return;
 const ultra=dlvSelectedVipPackage()==='ORG_ULTRA';
 el.hidden=!ultra;
 if(!ultra)return;
 const items=dlvUltraAssessment();
 const ready=items.filter(x=>x.ok).length;
 body.innerHTML='<div class="dlv-vip-entry"><b>CONFERÊNCIA DO ULTRA</b><small>'+ready+' de '+items.length+' itens verificados. O restante será solicitado ou conferido, sem reimplantar o que já existe.</small></div>'
 +items.map(item=>'<div class="dlv-vip-entry '+(item.ok?'is-present':'')+'"><b>'+esc(item.label)+'</b><span class="vip-state">'+(item.sourceOk?'JÁ CADASTRADO':item.confirmed?'CONFIRMADO PELO STAFF':'PENDENTE / CONFERIR')+'</span><small>'+esc(item.detail)+'</small>'+(item.sourceOk?'':'<label class="dlv-vip-confirm"><input type="checkbox" data-vip-confirma="'+esc(item.key)+'" '+(item.confirmed?'checked':'')+'> Confirmar que este item já existe no Group</label>')+'</div>').join('');
 body.querySelectorAll('[data-vip-confirma]').forEach(input=>input.addEventListener('change',()=>{
  if(input.checked)dlvUltraStaffConfirmed.add(input.dataset.vipConfirma);
  else dlvUltraStaffConfirmed.delete(input.dataset.vipConfirma);
  dlvRenderUltraReview();updateNewDeliveryPreview();
 }));
}
function dlvSnapshotForm(){
 const checks={},fields={};
 document.querySelectorAll('[data-delivery-benefit][data-touched]').forEach(x=>checks[x.dataset.deliveryBenefit]=x.checked);
 document.querySelectorAll('[data-dlv-field]').forEach(x=>fields[x.dataset.dlvField]=x.value);
 return {checks,fields};
}

/* CDS de cada benefício instalado, separadas para conferir/testar in game.
   Garagem/heliponto: Blip e Spawn (na planilha vêm na mesma célula, "blip / spawn").
   Baú etc.: uma linha por CDS separada por "/". O texto é copiado exatamente como está. */
const DLV_BLIP_SPAWN=['garagemVip','garagemPublica','garagemPublica2','garagemDeluxe','heliponto'];
function dlvCoordParts(v){return String(v||'').split(/\s*\/\s*|\n+/).map(x=>x.trim()).filter(x=>/-?\d+(?:\.\d+)?\s*,\s*-?\d+/.test(x))}
function dlvCoordRows(k,b){
 if(DLV_BLIP_SPAWN.includes(k)){
  let blip=dlvCoordParts(b[k+'Blip']),spawn=dlvCoordParts(b[k+'Spawn']);
  if(!spawn.length&&blip.length>1){spawn=blip.slice(1);blip=blip.slice(0,1)}
  return [...blip.map((c,i)=>[blip.length>1?`Blip ${i+1}`:'Blip',c]),...spawn.map((c,i)=>[spawn.length>1?`Spawn ${i+1}`:'Spawn',c])];
 }
 if(k==='telao')return [['Telão',b.telaoCds],['Postit',b.telaoPostit],...[1,2,3,4].map(n=>[`Caixa ${n}`,b['telaoCaixa'+n]])].flatMap(([l,v])=>dlvCoordParts(v).map(c=>[l,c]));
 const list=dlvCoordParts(k==='rotaExclusiva'?b.rotaBlips:b[k]);
 return list.map((c,i)=>[list.length>1?`CDS ${i+1}`:'CDS',c]);
}
function renderDeliveryBenefits(keep=null){
 const box=$('#dActive');if(!box)return;
 const f=faccoes.find(x=>x.group===dlvCurrent.group);
 if(!f){box.innerHTML='<div class="delivery-no-change">Selecione um Group.</div>';dlvRenderStatus();return}
 const b=dlvMergedBenefits(),p=f.perfilEntrega||{},defaults=new Set(p.beneficiosPadrao||[]);
 const prev=keep||{checks:{},fields:{}};
 const item=([k,n])=>{
  const installed=isInstalled(b,k),src=dlvCurrent.sheet?.src?.[k];
  const checked=Object.prototype.hasOwnProperty.call(prev.checks,k)?prev.checks[k]:(installed&&(defaults.size?defaults.has(k):true));
  const coords=installed?dlvCoordRows(k,b):[];
  const detail=coords.length?`${coords.length} CDS`:installed?(String(installedValue(b,k))==='SIM'||installedValue(b,k)===true?'Instalado':esc(installedValue(b,k))):'Não instalado';
  const needs=installed?'':(DLV_NEEDS[k]||[]).map(([field,label,ph,opt,multi,after])=>{const v=esc(prev.fields[field]??'');return `<label${after?` data-dlv-after="${after}"${String(prev.fields[after]??'').trim()?'':' hidden'}`:''}>${esc(label)}${opt?' <i>(opcional)</i>':''}${multi?`<textarea data-dlv-field="${field}" placeholder="${esc(ph||'')}">${v}</textarea>`:`<input data-dlv-field="${field}" placeholder="${esc(ph||'')}" value="${v}">`}</label>`}).join('');
  return `<div class="dlv-item ${installed?'is-installed':'is-missing'} ${checked?'is-on':''}" data-dlv-key="${k}">
   <label class="dlv-toggle"><input type="checkbox" data-delivery-benefit="${k}" ${checked?'checked':''} ${Object.prototype.hasOwnProperty.call(prev.checks,k)?'data-touched="1"':''}>
    <span class="dlv-text"><b>${esc(n)}</b><small>${detail}${src?` · <em title="${esc(src)}">planilha</em>`:''}</small></span>
    <span class="dlv-tag">${installed?'INSTALADO':'SOLICITAR'}</span></label>
   ${coords.length?`<div class="dlv-coords">${coords.map(([l,c])=>`<div class="dlv-coord"><span>${esc(l)}</span><code>${esc(c).replace(/,/g,',<wbr>')}</code><button type="button" class="dlv-copy" data-copy="${esc(c)}">COPIAR</button></div>`).join('')}</div>`:''}
   ${installed?'':`<div class="dlv-needs">${needs||'<p>Sem dados extras: a solicitação de ativação é gerada automaticamente.</p>'}</div>`}
  </div>`};
 const inst=INSTALLATIONS.filter(([k])=>k!=='vipOrg'&&isInstalled(b,k)),miss=INSTALLATIONS.filter(([k])=>k!=='vipOrg'&&!isInstalled(b,k));
 box.innerHTML=`${inst.length?`<div class="dlv-group-title">INSTALADOS NO GROUP <span>${inst.length}</span></div><div class="dlv-grid">${inst.map(item).join('')}</div>`:''}
  <div class="dlv-group-title">NÃO INSTALADOS · MARQUE PARA SOLICITAR <span>${miss.length}</span></div><div class="dlv-grid">${miss.map(item).join('')}</div>`;
 box.querySelectorAll('[data-delivery-benefit]').forEach(x=>x.addEventListener('change',()=>{x.dataset.touched='1';x.closest('.dlv-item')?.classList.toggle('is-on',x.checked);updateNewDeliveryPreview()}));
 box.querySelectorAll('[data-dlv-field]').forEach(x=>x.addEventListener('input',()=>{
  // Revela o próximo campo encadeado (ex.: caixa de som 2 depois da 1).
  const next=x.closest('.dlv-needs')?.querySelector(`[data-dlv-after="${x.dataset.dlvField}"]`);
  if(next&&x.value.trim())next.hidden=false;
  updateNewDeliveryPreview()}));
 box.querySelectorAll('.dlv-copy').forEach(x=>x.addEventListener('click',()=>copyText(x.dataset.copy,x)));
 dlvRenderStatus();dlvRenderUltraReview();
}

function dlvRenderStatus(){
 const el=$('#dSheetStatus');if(!el)return;
 const s=dlvCurrent.sheet||{},when=(dlvSheetCache.tabs||[]).map(t=>t.receivedAt).filter(Boolean).sort().pop();
 const fmt=when?new Date(when).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'';
 let html;
 if(dlvCurrent.status==='loading')html='<b>Lendo a planilha…</b> BENEFICIOS FACÇÕES e BLIPS COORDENADAS.';
 else if(dlvSheetCache.error)html=`<b class="warn">Leitura da planilha incompleta.</b> Os benefícios podem não estar atualizados. <small>${esc(dlvSheetCache.error)}</small>`;
 else if(!dlvCurrent.group)html='Selecione um Group para ler os benefícios da planilha.';
 else if(!s.found)html=`<b class="warn">${esc(dlvCurrent.group)} não foi encontrado</b> nas abas BENEFICIOS FACÇÕES / BLIPS COORDENADAS${fmt?` (recebidas ${fmt})`:''}. Usando só o cadastro do High OS.`;
 else html=`<b>${dlvSheetCache.source==='original'?'Planilha original lida':'Espelho da planilha lido'}</b>${fmt?` · recebida ${fmt}`:''} · ${Object.keys(s.src||{}).length} benefício(s) do Group encontrados.`;
 if(s.unknown?.length)html+=`<br><small>Itens da planilha não reconhecidos: ${s.unknown.map(esc).join(', ')}</small>`;
 el.innerHTML=html;
}

async function fillDeliveryFromGroup(group,{force=false}={}){
 const f=faccoes.find(x=>x.group===group);
 const keep=dlvCurrent.group===group?dlvSnapshotForm():null;
 dlvCurrent={group:f?group:'',stored:{...(f?.beneficios||{}),rotaInicio:f?.beneficios?.rotaInicio||f?.perfilTecnico?.rota?.inicio||f?.perfilFonte?.['INICIAR ROTA']||''},sheet:{b:{},src:{},found:0,unknown:[]},status:f?'loading':''};
 if(!f){renderDeliveryBenefits();dlvRenderVipSheet();updateNewDeliveryPreview();return}
 const p=f.perfilEntrega||{};
 if(!keep){
  $('#dPlano').value=p.planoPadrao||'';
  if(p.observacao&&!$('#dNotes').value)$('#dNotes').value=p.observacao;
  $('#dStaff').value=currentProfile?.name||currentUser?.displayName||'';
 }
 renderDeliveryBenefits(keep);updateNewDeliveryPreview();
 const cache=await dlvLoadSheet(force);
 if(dlvCurrent.group!==group)return; // trocou de Group enquanto carregava
 dlvCurrent.sheet=dlvSheetBenefits(group,cache.tabs||[]);dlvCurrent.vip=dlvVipRead(group,cache.tabs||[]);dlvCurrent.status='';
 renderDeliveryBenefits(dlvSnapshotForm());dlvRenderVipSheet();updateNewDeliveryPreview();
}
function selectedDeliveryBenefits(){const selected=[...document.querySelectorAll('[data-delivery-benefit]:checked')].map(x=>x.dataset.deliveryBenefit);if(dlvSelectedVipPackage()&&!selected.includes('vipOrg'))selected.push('vipOrg');return selected}
/* Benefícios usados no extrato e nas solicitações: os do Group + o que foi
   digitado para os que ainda não existem. */
function deliveryBenefitState(){
 const base=dlvMergedBenefits(),active=selectedDeliveryBenefits(),b={...base},isNew=new Set();
 active.forEach(k=>{if(k==='vipOrg'&&dlvSelectedVipPackage())return; if(isInstalled(base,k))return;isNew.add(k);
  document.querySelectorAll(`[data-dlv-key="${k}"] [data-dlv-field]`).forEach(x=>{const v=x.value.trim();if(v)b[x.dataset.dlvField]=v});
  if(['chatFaccao','telao','garagemPublica','garagemPublica2','garagemDeluxe','heliponto','rotaExclusiva','roupasFaccao'].includes(k))b[k]=true});
 return {b,base,active,isNew};
}
function deliveryMissingData(){
 const {isNew}=deliveryBenefitState(),miss=[];
 isNew.forEach(k=>{const n=INSTALLATIONS.find(x=>x[0]===k)?.[1]||k;
  (DLV_NEEDS[k]||[]).forEach(([field,label,,opt])=>{if(opt)return;const el=document.querySelector(`[data-dlv-key="${k}"] [data-dlv-field="${field}"]`);if(!el?.value.trim())miss.push(`${n}: ${label}`)})});
 return miss;
}
function deliveryExtractV5(){
 const f=faccoes.find(x=>x.group===$('#dGroup').value);
if(!f)return '';

 const {b,active,isNew}=deliveryBenefitState(),
 lines=['ENTREGA DE ORGANIZAÇÃO — HIGH ILEGAL',
'',
`Group: ${f.group}`,
`QG / Local: ${f.qg||'—'}`,
`Segmento: ${f.segmento||'—'}`,
`Facção: ${$('#dFaccao').value.trim()||'{FACÇÃO}'}`,
`Líder: ${$('#dLider').value.trim()||'{LÍDER}'}`,
`Staff responsável: ${$('#dStaff').value.trim()||'{STAFF}'}`,
`Data: ${$('#dData').value.trim()||'{DATA}'}`];

 if(dlvSelectedVipPackage())lines.push('Pacote VIP Org: '+(dlvSelectedVipPackage()==='ORG_ULTRA'?'ORG ULTRA':'PERSONALIZADO')+' (ofertado nesta entrega)');
 if($('#dPlano').value.trim())lines.push(`Plano / observação: ${$('#dPlano').value.trim()}`);
// Mesmo formato do anúncio em facs-entregues: só os nomes do que foi marcado.
lines.push('','');
 if(!active.length)lines.push('Nenhum benefício selecionado');
 else active.forEach(k=>lines.push(k==='vipOrg'&&dlvSelectedVipPackage()?(dlvSelectedVipPackage()==='ORG_ULTRA'?'VIP ORG ULTRA':'VIP ORG PERSONALIZADO'):(INSTALLATIONS.find(x=>x[0]===k)?.[1]||k).toUpperCase()));

 if(dlvSelectedVipPackage())lines.push('','VEÍCULOS MANUAIS DO VIP ULTRA:',
 'Mule: '+($('#dVipMuleSet')?.checked?'SETADO PELO STAFF':'PENDENTE · STAFF RESPONSÁVEL'),
 'Cargobob: '+($('#dVipCargobobSet')?.checked?'SETADO PELO STAFF':'PENDENTE · STAFF RESPONSÁVEL'));
 if($('#dNotes').value.trim())lines.push('','PERSONALIZAÇÕES / ALTERAÇÕES:',$('#dNotes').value.trim());
return lines.join('\n');

}
function currentDeliveryRequests(){
 const f=faccoes.find(x=>x.group===$('#dGroup').value);
if(!f)return[];
const {b,base,active:a,isNew}=deliveryBenefitState(),
ultra=dlvSelectedVipPackage()==='ORG_ULTRA',
has=k=>a.includes(k)&&!(k==='vipOrg'&&dlvSelectedVipPackage())&&!(ultra&&DLV_ULTRA_PACKAGE_KEYS.has(k))&&(!isInstalled(base,k)||isNew.has(k)),
novo=k=>isNew.has(k)?' (NOVA INSTALAÇÃO)':'',
R=[],
add=(tipo,titulo,texto)=>R.push({tipo,
titulo,
texto});

 const vipKeys=['vipOrg',
'chatFaccao',
'radio',
'salario',
'garagemVip',
'lojaRoupas',
'bar',
'blindados',
'barbearia',
'tatuagem',
'shopExclusivo',
'bau',
'farm',
'craft',
'arena',
'atm',
'shopDeluxe',
'academia',
'sinuca',
'roupasFaccao'];

 if(a.some(k=>vipKeys.includes(k)&&has(k))){let L=['Assunto: Ativação de benefícios de uma organização e alguns blips',
'',
'Solicitação:',
'',
'- Ativação de benefícios de uma organização e alguns blips',
`- Group: ${f.group}`];
if(has('salario')&&b.salario)L.push('',`- Ativar salário${novo('salario')} de ${b.salario} (A cada ${b.salarioMinutos||40} minutos)`);
if(has('radio')&&b.radio)L.push('',`- Ativar Rádio exclusiva${novo('radio')}: ${b.radio==='SIM'?'{FREQUÊNCIA}':b.radio}`);
if(has('chatFaccao'))L.push('','- Chat Facção.');
if(has('vipOrg')&&typeof b.vipOrg==='string'&&b.vipOrg!=='SIM')L.push('',`- VIP: ${b.vipOrg}`);
if(has('roupasFaccao'))L.push('',`- Roupas de Facção${novo('roupasFaccao')}.`);
if(has('garagemVip'))L.push('',`- ${isNew.has('garagemVip')?'Adicionar':'Ativar'} Garagem VIP${novo('garagemVip')}:`,`- Blip: ${fmtCds(b.garagemVipBlip)}`,`- Spawn: ${fmtCds(b.garagemVipSpawn)}`,b.garagemVipVeiculos?`- Veículos: ${b.garagemVipVeiculos}`:'');
[['lojaRoupas',
'Loja de roupas'],
['barbearia',
'Barbearia'],
['tatuagem',
'Tatuagem'],
['shopExclusivo',
'Shop Exclusivo'],
['bau',
'Baú'],
['bar',
'Bar'],
['blindados',
'Blindados'],
['farm',
'Farm'],
['craft',
'Craft'],
['arena',
'Arena'],
['atm',
'ATM'],
['shopDeluxe',
'Shop Deluxe'],
['academia',
'Academia'],
['sinuca',
'Sinuca']].forEach(([k,
n])=>{if(has(k))L.push('',`- ${n}${novo(k)}: ${fmtCds(b[k]&&b[k]!=='SIM'?b[k]:'')}`)});
add('BENEFICIOS','VIP Org / Benefícios e Setagens',L.filter(x=>x!==undefined).join('\n'))}
 if(has('rotaInicio'))add('ROTA_INICIO','Rota'+novo('rotaInicio'),[
 'Assunto: Ativação do ponto de início da rota',
 '',
 'Solicitação:',
 '- Ativar o ponto de início da rota',
 `- Group: ${f.group}`,
 `- Local/Coordenadas: ${fmtCds(b.rotaInicio)}`
 ].join('\n'));
 if(has('rotaExclusiva')){const pts=(b.rotaBlips||'').split(/\r?\n/).filter(Boolean);
add('ROTA_FARM','Rota de Farm Exclusiva'+novo('rotaExclusiva'),['Assunto: Ativação de rota de farm exclusiva',
'',
'Solicitação:',
'',
'- Ativação de rota de farm exclusiva',
`- Group: ${f.group}`,
'',
'- Blips da rota nova:',
'',
...(pts.length?pts:['{ CDS },'])].join('\n'))}
 if(has('telao'))add('TELAO','Telão da Organização'+novo('telao'),['Assunto: Ativação de Telão Hall em uma Organização Ilegal',
'',
'Solicitação:',
'',
'- Ativação de Telão Hall em uma Organização Ilegal.',
'',
`- Group: ${f.group}`,
`- Prop / modelo do telão: ${b.telaoNome||'{PROP_DO_TELAO}'}`,
'',
`- Local/Coordenadas postit: ${fmtCds(b.telaoPostit)}`,
`- Local/Coordenadas cds: ${fmtCds(b.telaoCds)}`,
...(()=>{const cx=[1,2,3,4].map(n=>b['telaoCaixa'+n]).filter(Boolean);return cx.length?['','- Caixas de som:',...cx.map((c,i)=>`* Caixa ${i+1}: ${fmtCds(c)}`)]:[]})()].join('\n'));

 if(has('garagemPublica'))add('GARAGEM','Garagem Pública'+novo('garagemPublica'),['Assunto:',
'',
'- Solicitaçao de Garagem Publica;',
'',
'Solicitaçao:',
'',
'- Adicione uma garagem publica na CDS abaixo:',
'',
`* Blip: ${fmtCds(b.garagemPublicaBlip)}`,
`* Spawn: ${fmtCds(b.garagemPublicaSpawn)}`,
'',
`- Permissao : ${f.group}`].join('\n'));

 if(has('garagemPublica2'))add('GARAGEM','Garagem Pública 2'+novo('garagemPublica2'),[
 'Assunto: Adição de Garagem Pública 2',
 '',
 'Solicitação:',
 '- Adicionar garagem pública 2 nas coordenadas abaixo:',
 `- Group: ${f.group}`,
 `- Blip: ${fmtCds(b.garagemPublica2Blip)}`,
 `- Spawn: ${fmtCds(b.garagemPublica2Spawn)}`,
 `- Permissão: ${f.group}`
 ].join('\n'));
 if(has('garagemDeluxe'))add('GARAGEM','Garagem Deluxe'+novo('garagemDeluxe'),['Assunto:',
'',
`- ${isNew.has('garagemDeluxe')?'Solicitação':'Ativação'} de Garagem Deluxe;`,
'',
'Solicitação:',
'',
`- ${isNew.has('garagemDeluxe')?'Adicione':'Ative'} a Garagem Deluxe na CDS abaixo:`,
'',
`* Blip: ${fmtCds(b.garagemDeluxeBlip)}`,
`* Spawn: ${fmtCds(b.garagemDeluxeSpawn)}`,
'',
`- Permissão: ${f.group}`].join('\n'));

 if(has('heliponto'))add('HELIPONTO','Heliponto'+novo('heliponto'),['Assunto: Adição de Heliponto',
'',
'Solicitação:',
'- Adicione um Heliponto na cds abaixo;',
`- ${fmtCds(b.helipontoBlip)}`,
b.helipontoSpawn?`- Spawn: ${fmtCds(b.helipontoSpawn)}`:'',
'',
`- Group: ${f.group}.`].join('\n'));

 if(ultra){
  const unmet=dlvUltraAssessment(base).filter(item=>!item.ok&&!item.manual);
  if(unmet.length){
   const lines=['Assunto: Complementação de benefícios VIP Org Ultra',
    '',
    'Solicitação:',
    '- Ativar SOMENTE os benefícios pendentes do pacote Org Ultra',
    '- Group: '+f.group,
    '- Aproveitar instalações e coordenadas existentes, sem duplicá-las',
    '',
    '- Benefícios faltantes ou não confirmados:',
    ...unmet.map(item=>'- '+item.action)];
   if(unmet.some(item=>item.key==='radio')&&b.radio)lines.push('- Frequência informada: '+b.radio);
   if(unmet.some(item=>item.key==='rotaExclusiva')&&b.rotaBlips)lines.push('- CDS da rota exclusiva: '+b.rotaBlips);
   if(unmet.some(item=>item.key==='bau')&&b.bau)lines.push('- Baú existente: '+b.bau);
   if(unmet.some(item=>item.key==='garagemVip')&&b.garagemVipBlip)lines.push('- Blip da garagem VIP: '+b.garagemVipBlip);
   add('VIP_ORG_ULTRA','VIP Org Ultra · Somente pendências',lines.join('\n'));
  }
 }
 if(dlvSelectedVipPackage()==='PERSONALIZADO'&&dlvVipCustomItems.size){
  const existing=new Map(dlvUltraAssessment(base).map(x=>[x.key,x.ok]));
  const lines=['Assunto: VIP Org personalizado · benefícios selecionados',
  '',
  'Solicitação:',
  '- Ativar apenas itens selecionados e não instalados',
  '- Group: '+f.group,
  '- Manter estruturas e CDS já existentes sem duplicações',
  ''];
  const selected=DLV_VIP_ITEMS.filter(x=>dlvVipCustomItems.has(x.key));
  const items=[];
  for(const item of selected){
   const official=dlvVipValue(item.status)==='SIM';
   const installed=official||existing.get(item.key);
   if(installed){lines.push('- '+item.label+': JÁ ATENDIDO (não solicitar)');continue}
   if(item.key==='mule'||item.key==='cargobob'){
    lines.push('- '+item.label+': PENDENTE DE SETAGEM MANUAL PELO STAFF; informar ID no checklist');continue;
   }
   if(item.key==='telao'){
    lines.push('- Telão: incluir prop '+(b.telaoNome||'{PROP}')+', CDS '+(b.telaoCds||'{CDS}'));
    lines.push('- Postit: '+(b.telaoPostit||'{CDS}')+'; caixas: '+[1,2,3,4].map(n=>b['telaoCaixa'+n]).filter(Boolean).join(' / '));
   }else lines.push('- '+item.label+': instalar, configurar ou confirmar o que faltar');
   items.push(item.key);
  }
  if(items.length) add('VIP_PERSONALIZADO','VIP Org personalizado · Itens pendentes',lines.join('\n'));
 }
 if($('#dNotes').value.trim())add('GERAL','Personalização / Alteração estrutural',['Assunto: Alteração / personalização de estrutura do QG',
'',
'Solicitação:',
'',
`- Group: ${f.group}`,
'',
 $('#dNotes').value.trim()].join('\n'));

 return R;

}
function updateNewDeliveryPreview(){if(!$('#dExtract'))return;
$('#dExtract').value=deliveryExtractV5();
const rs=currentDeliveryRequests();
$('#dRequests').innerHTML=rs.length?rs.map((r,i)=>`<article class="delivery-request-card"><div><b>${i+1}. ${esc(r.titulo)}</b><span>${esc(r.tipo)}</span></div><pre>${esc(r.texto)}</pre></article>`).join(''):'<div class="delivery-no-change">Selecione o Group e os benefícios que serão ativados.</div>'}
async function copyText(text,btn){if(!text)return alert('Não há conteúdo para copiar.');
try{await navigator.clipboard.writeText(text);
const o=btn.textContent;
btn.textContent='COPIADO ✓';
setTimeout(()=>btn.textContent=o,1300)}catch(e){alert('Não foi possível copiar automaticamente.')}}
/* Promessa que nao volta e pior que promessa que falha: a tela fica
   viva e o botao morto. Aqui toda espera externa tem prazo. */
function comPrazo(promessa,ms,recado){
 let t; return Promise.race([
  Promise.resolve(promessa).finally(()=>clearTimeout(t)),
  new Promise((_,rej)=>{t=setTimeout(()=>rej(new Error(recado)),ms)})
 ]);
}
let deliverySaveInFlight=false;
/* V14: troca de ocupante = recolhimento da anterior (o bot anuncia) + entrega da nova */
async function recolherParaTrocaV14(f,novaFaccao,justificativa){
 const agora=new Date(),hora=agora.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'}),data=agora.toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'});
 const responsavel=$('#dStaff')?.value.trim()||currentProfile?.name||currentUser?.email||'';
 const extrato=['RECOLHIMENTO POR TROCA DE OCUPANTE',`Group: ${f.group}`,`QG / Local: ${f.qg||'—'}`,`Sai: ${f.faccao}`,`Entra: ${novaFaccao}`,`Responsável: ${responsavel}`,`Data: ${data} ${hora}`,`Justificativa: ${justificativa}`].join('\n');
 const recolhimento={motivo:'TROCA_OCUPANTE',motivoLabel:'Troca de ocupante',responsavel,data,hora,justificativa,baixoContingente:null,extrato,createdAtText:agora.toISOString(),createdBy:currentUser.email,troca:true,novaFaccao};
 const vago={...f,status:'INATIVA',faccao:'',lider:'',staff:'',dataEntrega:'',ocupacaoAtual:null,ultimoRecolhimento:{...recolhimento,possuiEvidencia:false},updatedBy:currentUser.email};
 const [titulo,...corpo]=extrato.split('\n');
 await setDoc(doc(db,'highos','data','faccoes',idFac(f.group)),{...vago,anuncioRecolhimento:{title:titulo,description:corpo.join('\n').trim(),imageDataUrl:'',
  webhook:avisoRecolhimentoWebhook(f,{motivoLabel:'Encerramento de season',responsavel:currentUser?.email||'',justificativa:'Virada de season.'})}});
 try{await setDoc(doc(db,'highos','data','organizacoes',orgKey(f.faccao)),{nome:f.faccao,status:'SEM_GROUP',groupAtual:'',segmentoAtual:f.segmento||'',qgAtual:'',ultimoRecolhimento:recolhimento,updatedBy:currentUser.email},{merge:true})}catch(e){}
 entregas=entregas.map(d=>d.group===f.group&&d.status==='ATIVA'?{...d,status:'RECOLHIDA',recolhidaPor:currentUser.email,recolhimento}:d);
 const i=faccoes.findIndex(x=>x.group===f.group);if(i>=0)faccoes[i]={...faccoes[i],...vago};
}
async function saveNewDelivery(e){
 e.preventDefault();
 if(deliverySaveInFlight)return;
const f=faccoes.find(x=>x.group===$('#dGroup').value);
if(!f)return alert('Selecione um Group.');
const faccao=$('#dFaccao').value.trim();
if(!faccao)return alert('Informe a facção que está assumindo.');
// O bot recusa entrega sem líder (passaporte + nome); avisa aqui antes de enviar.
if(!$('#dLider').value.trim())return alert('Informe o líder (passaporte e nome) da facção que está assumindo.');
/* O banco e o Firebase; a planilha e adicional. Entrega nao pode
   deixar de ser gravada porque o Google nao autorizou - antes, uma
   recusa de popup derrubava a entrega inteira. Tenta sincronizar;
   se nao der, grava assim mesmo e marca a planilha como pendente. */
let planilhaPendente='';
if(!facSheetAccessToken){
 /* A autorizacao do Google nao rejeita quando o popup e bloqueado:
    ela fica pendurada. Sem prazo, a entrega trava em "salvando" e
    todo clique seguinte e ignorado calado. */
 try{await comPrazo(facSheetAuthorize(),20000,'A janela de autorizacao do Google nao respondeu.')}
 catch(error){planilhaPendente=String(error?.message||error)}
}
const pendentes=deliveryMissingData();
if(pendentes.length)return alert('Faltam dados para solicitar os benefícios que ainda não existem no Group:\n\n• '+pendentes.join('\n• ')+'\n\nPreencha os campos ou desmarque o benefício.');
let trocaParaExecutar=null;
/* V14 — travas de ocupação */
{const st=situacaoGroup(f);
 if(st==='SEM_QG')return alert('Este Group não tem QG/favela cadastrado. Cadastre o QG antes de entregar.');
 if(st==='REVISAR')return alert('Os dados deste Group estão contraditórios. Corrija em Organizações → A REVISAR antes de entregar.');
 const outro=faccoes.find(x=>!x.removido&&x.group!==f.group&&ocupadoV14(x)&&alvesNorm(x.faccao).trim()===alvesNorm(faccao).trim());
 if(outro)return alert(`${faccao} já ocupa o ${outro.group}${outro.qg?` (${outro.qg})`:''}. Uma facção só pode ter um Group: recolha o ${outro.group} antes.`);
 if(st==='ASSUMIDA'){
  if(alvesNorm(f.faccao).trim()===alvesNorm(faccao).trim())return alert(`${faccao} já é a ocupante deste Group.`);
  if(!confirm(`TROCA DE OCUPANTE\n\n${f.group} está ocupado por ${f.faccao}.\nAo confirmar, ${f.faccao} é recolhida (com anúncio de recolhimento) e ${faccao} assume.\n\nContinuar?`))return;
  const just=prompt(`Justificativa da troca (${f.faccao} → ${faccao}):`,'');
  if(!just||!just.trim())return alert('A troca precisa de justificativa.');
  trocaParaExecutar={f,faccao,justificativa:just.trim()};
 }}

if(!$('#dData').value.trim())$('#dData').value=new Date().toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'});
/* Mesma regra do acesso acima: a planilha nao decide se a entrega
   acontece. Falhou, anota a pendencia e segue. */
try{await comPrazo(dlvSaveVipSheet({fromDelivery:true,silent:true}),20000,'A planilha nao respondeu a tempo.')}
catch(error){if(!planilhaPendente)planilhaPendente=String(error?.message||error)}
if(trocaParaExecutar){
 try{await recolherParaTrocaV14(trocaParaExecutar.f,trocaParaExecutar.faccao,trocaParaExecutar.justificativa)}
 catch(err){return alert('Não foi possível recolher a facção anterior: '+err.message)}
}
// Sem data informada, a entrega vale para hoje (o anúncio não sai com {DATA}).
if(!$('#dData').value.trim())$('#dData').value=new Date().toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'});
const {b:beneficiosConfigurados,isNew}=deliveryBenefitState(),
active=selectedDeliveryBenefits(),
requests=currentDeliveryRequests(),
extract=deliveryExtractV5();

 deliverySaveInFlight=true;
 const submitBtn=e?.submitter||$('#newDeliveryForm')?.querySelector('[type="submit"]');
 if(submitBtn)submitBtn.disabled=true;

 const payload={group:f.group,
qg:f.qg||'',
segmento:f.segmento||'',
faccao,
lider:$('#dLider').value.trim(),
staff:$('#dStaff').value.trim(),
dataEntrega:$('#dData').value.trim(),
plano:$('#dPlano').value.trim()||(dlvSelectedVipPackage()==='ORG_ULTRA'?'Org Ultra':dlvSelectedVipPackage()==='PERSONALIZADO'?'VIP Org personalizado':''),
pacoteVip:dlvSelectedVipPackage(),
pacoteVipConferencia:dlvSelectedVipPackage()?dlvUltraAssessment(dlvMergedBenefits()).map(x=>({item:x.key,atendido:x.ok,origem:x.sourceOk?'CADASTRO':x.confirmed?'CONFIRMACAO_STAFF':'PENDENTE',descricao:x.detail})):[],
setagensManuais:dlvSelectedVipPackage()?{mule:!!$('#dVipMuleSet')?.checked,cargobob:!!$('#dVipCargobobSet')?.checked}:{},
pacoteVipItens:dlvSelectedVipPackage()==='PERSONALIZADO'?[...dlvVipCustomItems]:[],
beneficiosAtivos:active,
beneficiosSolicitados:[...isNew],
personalizacoes:$('#dNotes').value.trim(),
solicitacoesGeradas:requests,
extrato:extract,
status:'ATIVA',
createdAt:serverTimestamp(),
createdAtText:new Date().toISOString(),
createdBy:currentUser.email};

 try{
  // V12 Discord Storage: ocupação passa a ser persistida no High OS Discord.
  // Não cria/atualiza documentos de facções, entregas, organizações ou histórico no Firestore.
  const previous=entregas.filter(x=>x.group===f.group&&x.status==='ATIVA');
  // Benefícios lidos da planilha passam a constar no cadastro do Group.
  const deliveredGroup={...f,
   // Persistir também as CDS informadas para novas instalações, não apenas os benefícios anteriores.
   beneficios:clonePlain(beneficiosConfigurados),
   status:'ATIVA',
   faccao,
   lider:payload.lider,
   staff:payload.staff,
   dataEntrega:payload.dataEntrega,
   ocupacaoAtual:{faccao,lider:payload.lider,staff:payload.staff,dataEntrega:payload.dataEntrega,plano:payload.plano,pacoteVip:payload.pacoteVip,pacoteVipConferencia:payload.pacoteVipConferencia,setagensManuais:payload.setagensManuais,pacoteVipItens:payload.pacoteVipItens,beneficiosAtivos:active,beneficiosSolicitados:[...isNew]},
   updatedBy:currentUser.email};

  // O bot cria o tópico em facs-entregues e posta o extrato como anúncio.
  const [titulo,...corpo]=extract.split('\n');
  await setDoc(doc(db,'highos','data','faccoes',idFac(f.group)),{
   ...deliveredGroup,
   anuncioEntrega:{title:titulo,description:corpo.join('\n').trim()}
  });
  const sheetSynced=await syncGroupsToOfficialSheet([deliveredGroup],{quiet:true,previousGroups:[f]});

  $('#newDeliveryModal').classList.add('hidden');
  const previousIds=new Set(previous.map(d=>d.id));
  entregas=entregas.map(d=>previousIds.has(d.id)?{...d,status:'RECOLHIDA',recolhidaPor:currentUser.email}:d);
  entregas.unshift({id:'discord:'+f.group+':'+Date.now(),...clonePlain(payload),createdAt:null,storage:'DISCORD'});
  const fix=faccoes.findIndex(x=>x.group===f.group);
  if(fix>=0)faccoes[fix]={...clonePlain(deliveredGroup),id:faccoes[fix].id||f.group,updatedBy:currentUser.email};
  queryFreshAt.set('faccoes',Date.now());queryFreshAt.set('entregas',Date.now());
  cacheEscrever('entregas_resumo',entregas);
  renderFaccoes();renderDeliveries();renderOrganizations();
  alert(sheetSynced&&!planilhaPendente
   ?'Entrega registrada e sincronizada com as planilhas.'
   :'Entrega registrada. A planilha NAO foi sincronizada - conecte o Google Sheets e sincronize quando puder.'+(planilhaPendente?'\n\n'+planilhaPendente:''));
  /* O aviso sai agora, com a entrega fresca na cabeca de quem fez. */
  try{abrirAvisoEntrega(deliveredGroup,{responsavel:currentUser?.email||'',oferta:payload?.plano||''})}catch(e){console.warn('[AVISO]',e?.message||e)}


 }catch(err){alert('Erro ao concluir entrega: '+err.message)}
 finally{
  deliverySaveInFlight=false;
  if(submitBtn)submitBtn.disabled=false;
 }
}
initDeliveryUi();

const _loadFaccoesV5=loadFaccoes;
loadFaccoes=async function(){await _loadFaccoesV5();
renderFaccoes();
await loadDeliveries();
await reconcileActiveDeliveriesToGroups();
renderFaccoes();renderAvailableFaccoes();renderOrganizations();
/* V14.1: entregas definem quem ocupava cada Group — reatribui as métricas */
if(reatribuirMetricas()){try{renderMetrics()}catch(e){}}};

// ===== HIGH OS V5.1 · PERFIL TÉCNICO + MEMÓRIA OPERACIONAL DO GROUP =====
let historico=[];

function historyDateValue(h){
 const d=h?.data;

 try{if(d?.toDate)return d.toDate();
if(d?.seconds)return new Date(d.seconds*1000);
if(h?.createdAtText)return new Date(h.createdAtText)}catch(e){}
 return null;

}
function formatHistoryDate(h){const d=historyDateValue(h);
return d&&!isNaN(d)?d.toLocaleString('pt-BR',{day:'2-digit',
month:'2-digit',
year:'numeric',
hour:'2-digit',
minute:'2-digit'}):'—'}
/* V10.75 - normalizador temporal único para ordenações do histórico.
   Evita ReferenceError nas rotinas econômicas que ordenam registros sem
   rebaixar falhas de código para a tela de acesso negado. */
function historyMillis(h){
 const d=historyDateValue(h);
 return d&&!isNaN(d)?d.getTime():0;
}
function historyFamily(tipo=''){
 const t=String(tipo).toUpperCase();

 if(t.includes('RECOLH'))return 'RECOLHIMENTO';

 if(t.includes('ENTREGA'))return 'ENTREGA';

 if(t.includes('USUARIO'))return 'USUARIO';

 if(t.includes('SOLICIT')||t.includes('MODELO'))return 'MODELO_SOLICITACAO';

 if(t.includes('EDICAO')||t.includes('ALTER'))return 'EDICAO';

 return t;

}
function historyTitle(h){
 const fam=historyFamily(h.tipo);

 if(fam==='ENTREGA')return `Entrega ${h.group||''}${h.faccao?' → '+h.faccao:''}`.trim();

 if(h.tipo==='ORGANIZACAO')return `Cadastro da facção ${h.faccao||''}`.trim();

 if(fam==='RECOLHIMENTO')return `Recolhimento ${h.group||''}`.trim();

 if(fam==='EDICAO')return `Alteração no perfil técnico ${h.group||''}`.trim();

 if(fam==='USUARIO')return `Acesso / usuário ${h.usuarioAlvo||''}`.trim();

 if(fam==='MODELO_SOLICITACAO')return `Biblioteca de solicitações`;

 if(String(h.tipo||'').toUpperCase()==='IMPORTACAO_INICIAL')return 'Importação da base inicial';

 return String(h.tipo||'Evento').replaceAll('_',' ');

}
function changedSummary(h){
 const a=h?.antes||{},
d=h?.depois||{};
 const out=[];

 const keys=[['qg',
'QG'],
['cds',
'CDS principal'],
['produto',
'Produto'],
['faccao',
'Facção'],
['lider',
'Líder'],
['staff',
'Staff'],
['status',
'Status']];

 keys.forEach(([k,
n])=>{if(String(a[k]??'')!==String(d[k]??''))out.push(`${n}: ${a[k]||'—'} → ${d[k]||'—'}`)});

 const ab=a.beneficios||{},
db=d.beneficios||{};

 const names={vipOrg:'VIP Org',
chatFaccao:'Chat Facção',
radio:'Rádio',
salario:'Salário',
garagemVipBlip:'Garagem VIP',
garagemPublicaBlip:'Garagem Pública',
helipontoBlip:'Heliponto',
rotaExclusiva:'Rota Exclusiva',
telao:'Telão',
lojaRoupas:'Loja de roupas',
barbearia:'Barbearia',
tatuagem:'Tatuagem',
shopExclusivo:'Shop',
bau:'Baú',
farm:'Farm',
craft:'Craft',
arena:'Arena'};

 Object.keys(names).forEach(k=>{if(JSON.stringify(ab[k]??'')!==JSON.stringify(db[k]??''))out.push(`${names[k]} alterado`)});

 return out.slice(0,5);

}
/* =====================================================================
   HIGH OS V9.9 - HISTORICO PAGINADO
   ---------------------------------------------------------------------
   Antes: getDocs(historico) trazia a colecao inteira em toda visita ao
   modulo. Como o sistema grava um evento em 45 pontos diferentes, essa
   colecao so cresce - em poucos meses ela sozinha consumiria a cota
   diaria de leitura.

   Agora: janela de HISTORY_PAGE registros mais recentes, ordenados no
   servidor, com botao "carregar mais" usando cursor. Se o Firestore
   recusar a consulta ordenada (documentos antigos sem o campo data, por
   exemplo), cai automaticamente na leitura completa antiga, para que
   nenhuma tela fique vazia.
   ===================================================================== */
const HISTORY_PAGE=250;

let historyCursor=null,
 historyEsgotado=false,
 historyModoLegado=false,
 historyFromPersistentCache=false;
const HISTORY_CACHE_TTL=120000;

async function loadHistory({append=false}={}){
 if(!$('#historyList')&&!$('#groupHistoryPreview'))return;
 try{
  const all=(await highOsStoreList('historico')).sort((a,b)=>historyMillis(b)-historyMillis(a));
  const start=append?historico.length:0,novos=all.slice(start,start+HISTORY_PAGE);
  historico=append?historico.concat(novos):novos;
  historyEsgotado=start+novos.length>=all.length;historyModoLegado=false;queryFreshAt.set('historico',Date.now());renderHistory();
 }catch(e){if($('#historyList'))$('#historyList').innerHTML=`<div class="placeholder"><h3>ERRO AO CARREGAR</h3><p>${esc(e.message)}</p></div>`}
}
async function openRecollectEvidence(evidenceId,historyId=''){if(!evidenceId)return;
const modal=$('#recollectEvidenceModal'),
img=$('#recollectEvidenceImage'),
meta=$('#recollectEvidenceMeta');
if(!modal||!img)return;
img.removeAttribute('src');
meta.textContent='Carregando evidência...';
modal.classList.remove('hidden');
try{const e=await highOsStoreGet('evidencias_recolhimento',evidenceId).catch(()=>null);
if(!e)throw new Error('Evidência não encontrada.');

h=historico.find(x=>x.id===historyId)||{};
img.src=e.imagemDataUrl||'';
meta.innerHTML=`<span><b>${esc(e.group||h.group||'—')}</b> • ${esc(e.faccao||h.faccao||'—')}</span><span>${esc(h.motivoLabel||recollectReasonLabel(e.motivo)||'Recolhimento')} • ${esc(h.dataRecolhimento||'')}</span>`}catch(err){meta.textContent='Não foi possível abrir a evidência: '+err.message}}
$('#recollectEvidenceClose')?.addEventListener('click',()=>$('#recollectEvidenceModal')?.classList.add('hidden'));

function renderHistoryFooter(){
 const lista=$('#historyList');
if(!lista)return;

 document.getElementById('historyMore')?.remove();

 const box=document.createElement('div');

 box.id='historyMore';
box.className='history-more';

 box.innerHTML=historyEsgotado
  ? `<span>${historico.length} registro(s) — fim do histórico${historyModoLegado?' (cache local)':''}.</span>`
  : `<span>${historico.length} registro(s) carregados</span><button type="button" id="historyMoreBtn">CARREGAR MAIS ${HISTORY_PAGE}</button>`;

 lista.insertAdjacentElement('afterend',box);

 document.getElementById('historyMoreBtn')?.addEventListener('click',async ev=>{
  const b=ev.currentTarget;b.disabled=true;b.textContent='CARREGANDO...';
  await loadHistory({append:true});
 });

}
function renderHistory(){
 if(!$('#historyList'))return;

 const q=($('#historySearch')?.value||'').toLowerCase(),
type=$('#historyType')?.value||'';

 const list=historico.filter(h=>(!type||historyFamily(h.tipo)===type||String(h.tipo||'')===type)&&(!q||[h.tipo,
h.group,
h.faccao,
h.usuario,
h.usuarioAlvo,
h.descricao,
h.motivoLabel,
h.responsavel,
h.justificativa,
JSON.stringify(h.depois||{})].join(' ').toLowerCase().includes(q)));

 const deliveries=historico.filter(h=>historyFamily(h.tipo)==='ENTREGA').length,
recol=historico.filter(h=>historyFamily(h.tipo)==='RECOLHIMENTO').length,
edits=historico.filter(h=>historyFamily(h.tipo)==='EDICAO').length;

 $('#historyStats').innerHTML=`<span><b>${historico.length}</b> EVENTOS</span><span><b>${deliveries}</b> ENTREGAS</span><span><b>${recol}</b> RECOLHIMENTOS</span><span><b>${edits}</b> ALTERAÇÕES</span><span><b>${list.length}</b> EXIBIDOS</span>`;

 if(!list.length){$('#historyList').innerHTML='<div class="placeholder"><b>◷</b><h3>NENHUM EVENTO ENCONTRADO</h3><p>Altere os filtros ou registre uma nova operação.</p></div>';
return}
 $('#historyList').innerHTML=list.map(h=>{const changes=changedSummary(h),
isRec=historyFamily(h.tipo)==='RECOLHIMENTO',
recInfo=isRec?`<div class="recollect-history-data"><span><b>Motivo</b>${esc(h.motivoLabel||recollectReasonLabel(h.motivo)||'—')}</span><span><b>Responsável</b>${esc(h.responsavel||h.usuario||'—')}</span><span><b>Data efetiva</b>${esc([h.dataRecolhimento,h.horaRecolhimento].filter(Boolean).join(' • ')||'—')}</span>${h.baixoContingente?`<span><b>Contingente</b>${esc(String(h.baixoContingente.observado??'—'))} / mínimo ${esc(String(h.baixoContingente.minimo??'—'))}</span>`:''}</div>${h.justificativa?`<p class="recollect-justification">${esc(h.justificativa)}</p>`:''}${h.evidenciaId?`<button type="button" class="mini-btn history-evidence-btn" data-evidence="${esc(h.evidenciaId)}" data-history="${esc(h.id)}">VER PRINT DO PAINEL</button>`:''}`:'';return `<article class="history-row"><div class="history-icon h-${historyFamily(h.tipo).toLowerCase()}">◷</div><div class="history-main"><div class="history-top"><strong>${esc(historyTitle(h))}</strong><span>${esc(formatHistoryDate(h))}</span></div><div class="history-meta">${h.group?`<b>${esc(h.group)}</b>`:''}${h.faccao?` • ${esc(h.faccao)}`:''}${h.usuario?` • por ${esc(h.usuario)}`:''}</div>${h.descricao?`<p>${esc(h.descricao)}</p>`:''}${recInfo}${changes.length?`<div class="history-changes">${changes.map(x=>`<span>${esc(x)}</span>`).join('')}</div>`:''}${Array.isArray(h.solicitacoesGeradas)&&h.solicitacoesGeradas.length?`<small>${h.solicitacoesGeradas.length} solicitação(ões) técnica(s) gerada(s)</small>`:''}</div></article>`}).join('');

 $('#historyList').querySelectorAll('.history-evidence-btn').forEach(btn=>btn.addEventListener('click',()=>openRecollectEvidence(btn.dataset.evidence,btn.dataset.history)));

 renderHistoryFooter();

}
function renderGroupProfileMemory(f){
 if(!f)return;
const b=f.beneficios||{},
installed=INSTALLATIONS.filter(([k])=>isInstalled(b,k));

 if($('#groupProfileSummary'))$('#groupProfileSummary').innerHTML=`<div><span>STATUS</span><b class="${f.status==='ATIVA'?'online':''}">${f.status==='ATIVA'?'OCUPADO':'VAGO'}</b></div><div><span>OCUPANTE ATUAL</span><b>${esc(f.faccao||'—')}</b></div><div><span>QG / LOCAL</span><b>${esc(f.qg||'SEM LOCAL')}</b></div><div><span>INSTALAÇÕES</span><b>${installed.length}</b></div>`;

 const hs=historico.filter(h=>h.group===f.group).slice(0,6),
box=$('#groupHistoryPreview');
if(!box)return;

 box.innerHTML=hs.length?hs.map(h=>`<div class="group-history-item"><i></i><div><b>${esc(historyTitle(h))}</b><span>${esc(formatHistoryDate(h))}${h.usuario?' • '+esc(h.usuario):''}</span></div></div>`).join(''):'<div class="delivery-no-change">Ainda não há eventos registrados para este Group.</div>';

}
$('#historySearch')?.addEventListener('input',renderHistory);
$('#historyType')?.addEventListener('change',renderHistory);

const _openFacV51=openFac;
openFac=function(id){_openFacV51(id);
renderGroupProfileMemory(faccoes.find(x=>x.id===id))};

const _loadFaccoesV51=loadFaccoes;
loadFaccoes=async function(){await _loadFaccoesV51();
await loadHistory();
await loadOrganizations()};

// ===== HIGH OS V5.2 · PERFIL PADRÃO DE ENTREGA POR GROUP =====

// ===== HIGH OS V5.4 · ALVESINHO OPERACIONAL =====
function alvesNorm(v=''){return String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
function alvesFindGroup(text=''){
 const n=alvesNorm(text);
return faccoes.find(f=>n.includes(alvesNorm(f.group)))||faccoes.find(f=>n.includes(alvesNorm(f.qg||''))&&String(f.qg||'').length>2)||null;

}
function alvesFindOrg(text=''){
 const n=alvesNorm(text);
return organizacoes.find(o=>n.includes(alvesNorm(o.nome)))||faccoes.map(f=>({nome:f.faccao,
groupAtual:f.group,
segmentoAtual:f.segmento,
qgAtual:f.qg,
lider:f.lider,
status:f.status==='ATIVA'?'ATIVA':'SEM_GROUP'})).find(o=>o.nome&&n.includes(alvesNorm(o.nome)))||null;

}










// ===== HIGH OS V5.8 · PARSER DA PLANILHA OFICIAL + GOOGLE SHEETS SOMENTE LEITURA =====
let metricas=[],
metricasCache=[],
metricsLoaded=false,
metricsLoadPromise=null,
metricPeriodKey='',
metricDateStart='',
metricDateEnd='',
metricSourceConfig={url:'',
sheet:'',
autoSync:true},
metricSourceState={status:'SEM FONTE',
lastSync:null,
count:0,
activeCount:0,
error:''},
sheetsAccessToken='',
mercadoCatalogo=[],
mercadoStatus='CARREGANDO';

let metricLiveUnsub=null,
metricLiveLastAt=0;

// V12.8: métricas não possuem mais referências Firestore no High OS Web.
// Fonte oficial: Apps Script -> bot High OS (PC) -> Discord -> /v1/metrics.

const MARKET_CATALOG_URL='https://alvesjardimitalo-oss.github.io/high-mercado-negro/data/catalogo.json';

const SHEETS_SCOPE='https://www.googleapis.com/auth/spreadsheets.readonly';

function metricDateValue(m){
 const raw=String(m?.data||m?.date||'').trim();

 const br=raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:$|[^\d])/);
 const iso=raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T00:00(?::00(?:\.0+)?)?Z?$)/);
 if(iso&&!br)return new Date(+iso[1],+iso[2]-1,+iso[3]);
if(br){let y=+br[3];
if(y<100)y+=2000;
return new Date(y,+br[2]-1,+br[1])}
 const d=new Date(raw);
return isNaN(d)?new Date(0):d;

}
function normalizeMetricSlotKey(v=''){
 const x=String(v??'').trim().toUpperCase().replace(/\s+/g,'');

 let m=x.match(/^(\d{1,2})(?::(\d{2}))?H?$/);
if(!m)return '';
let h=+m[1],
min=m[2]===undefined?0:+m[2];
if(h>23||min>59)return '';
return min===0?`${String(h).padStart(2,'0')}H`:`${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`;

}
function metricSlotMinutes(k=''){const x=String(k).toUpperCase();
let m=x.match(/^(\d{1,2})H$/);
if(m)return +m[1]*60;
m=x.match(/^(\d{1,2}):(\d{2})$/);
return m?+m[1]*60 + +m[2]:9999}
function metricSlots(m){
 const src=m?.slots||{},
out={};
Object.entries(src).forEach(([k,
v])=>{const nk=normalizeMetricSlotKey(k);if(nk&&v!==null&&v!==undefined&&typeof v!=='boolean'&&String(v).trim()!==''&&Number.isFinite(Number(v)))out[nk]=Number(v)});

 [['14H',
m?.['14H']??m?.h14],
['16H',
m?.['16H']??m?.h16],
['21H',
m?.['21H']??m?.h21],
['23H',
m?.['23H']??m?.h23]].forEach(([k,
v])=>{if(!(k in out)&&v!==undefined&&v!==null&&v!=='')out[k]=Number(v)||0});

 return Object.fromEntries(Object.entries(out).sort((a,b)=>metricSlotMinutes(a[0])-metricSlotMinutes(b[0])));

}
function metricSlotKeys(rows=activeMetricRows()){return [...new Set(rows.flatMap(r=>Object.keys(metricSlots(r))))].sort((a,b)=>metricSlotMinutes(a)-metricSlotMinutes(b))}

function metricMonthKey(m){
 const d=metricDateValue(m);
if(!d||d.getTime()===0)return '';
return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;

}
function currentMetricMonthKey(){const d=new Date();
return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
function metricPeriodLabel(key=''){
 const m=String(key).match(/^(\d{4})-(\d{2})$/);
if(!m)return key||'—';
const d=new Date(+m[1],+m[2]-1,1);
return d.toLocaleDateString('pt-BR',{month:'long',
year:'numeric'}).replace(/^./,c=>c.toUpperCase());

}
function parseIsoMetricDate(v=''){const m=String(v).match(/^(\d{4})-(\d{2})-(\d{2})$/);
return m?new Date(+m[1],+m[2]-1,+m[3]):null}
function metricGroupOccupied(group){return faccoes.some(f=>!f.removido&&alvesNorm(f.group)===alvesNorm(group)&&ocupadoV14(f))}
/* Cadastro do Group para as métricas. Pode haver registros duplicados ou
   removidos com o mesmo Group (Armas07 / ARMAS7 / Armas 07): vale o ASSUMIDO
   não removido; depois qualquer não removido; removido só em último caso.
   Antes pegava o primeiro da lista — um removido com outra facção fazia a
   facção atual sumir da Central de Métricas. */
function metricFaccaoDoGroup(group){
 const k=chaveGroup(group);if(!k)return null;
 const mesmos=(faccoes||[]).filter(f=>f&&chaveGroup(f.group)===k);
 return mesmos.find(f=>!f.removido&&ocupadoV14(f))||mesmos.find(f=>!f.removido)||mesmos[0]||null;
}
/* ===== V14.1 · MÉTRICA POR FACÇÃO (modules/metricas-motor.js) =====
   metricasCache = linhas BRUTAS (Discord/Sheets). metricas = versão ATRIBUÍDA:
   cada coleta vai para a facção que ocupava o Group naquele horário, já no
   Group atual dela. Coleta em Group vago vai para metricSemOcupante. */
let metricTransferencias=[],metricSemOcupante=[],metricOcupTL=null,metricColetasVazias=[];
function metricasAtribuidas(rows=[]){
 try{
  const tl=montarLinhaDoTempo({faccoes,entregas,transferencias:metricTransferencias});metricOcupTL=tl;
  const limpas=descartarColetasVazias(rows,{dataDe:metricDateValue,slotsDe:metricSlots});metricColetasVazias=limpas.descartados;
  if(limpas.descartados.length)console.info('[MÉTRICAS] horários zerados pela mensagem vazia da cidade (tratados como sem coleta):',limpas.descartados);
  const r=atribuirLinhas(limpas.linhas,tl,{faccoes,dataDe:metricDateValue,slotsDe:metricSlots});
  metricSemOcupante=r.semOcupante;return r.linhas;
 }catch(e){console.warn('[MÉTRICAS] atribuição por facção falhou; exibindo por Group',e);metricSemOcupante=[];return rows.slice()}
}
function reatribuirMetricas(){if(!metricasCache?.length)return false;metricas=metricasAtribuidas(metricasCache);return true}
async function carregarTransferenciasMetricas(){
 try{const rows=await highOsStoreList('historico');metricTransferencias=rows.filter(h=>h.tipo==='TRANSFERENCIA_PAINEL')}catch(e){metricTransferencias=[]}
}
function metricRowHasHistoricalOccupant(m={}){
 // Snapshots novos podem trazer a identidade histórica; registros legados do
 // cache do bot não trazem. Group válido continua sendo dado histórico válido
 // e não deve desaparecer apenas porque a ocupação atual mudou.
 return !!String(m.faccaoSnapshot||m.faccaoHistorica||'').trim()||!!String(m.group||m.organizacao||'').trim();
}
function activeMetricRows(){
 /* V12.5 - uma métrica histórica pertence à facção que ocupava o Group
    no dia da coleta. Não descartamos o passado só porque o Group hoje
    está vago ou foi assumido por outra organização. Linhas antigas de
    Group vazio continuam fora porque não possuem faccaoSnapshot. */
 /* V15.6.1: coletas de facções que SAÍRAM (linha "Group • Facção") ficam fora
    do ranking, totais e gráficos; o chip de registros separados continua
    mostrando quantas são. */
 const occupied=m=>!m.__exFaccao&&(metricRowHasHistoricalOccupant(m)||metricGroupOccupied(m.group||m.organizacao||m.faccao));

 if(metricDateStart||metricDateEnd){const a=parseIsoMetricDate(metricDateStart),
b=parseIsoMetricDate(metricDateEnd);
return metricas.filter(m=>{const d=metricDateValue(m);return occupied(m)&&(!a||d>=a)&&(!b||d<=new Date(b.getFullYear(),b.getMonth(),b.getDate(),23,59,59))})}
 const key=metricPeriodKey||currentMetricMonthKey();
return metricas.filter(m=>occupied(m)&&metricMonthKey(m)===key)
}
function metricActivePeriodLabel(){if(metricDateStart||metricDateEnd){const f=x=>{const d=parseIsoMetricDate(x);
return d?d.toLocaleDateString('pt-BR'):'…'};
return `${f(metricDateStart)} a ${f(metricDateEnd)}`}return metricPeriodLabel(metricPeriodKey)}
function syncMetricDateInputs(){const a=$('#metricDateStart'),
b=$('#metricDateEnd');
if(a)a.value=metricDateStart;
if(b)b.value=metricDateEnd}

function refreshMetricPeriodOptions(){
 const el=$('#metricPeriod');
if(!el)return;
const current=currentMetricMonthKey();
const keys=[...new Set(metricas.map(metricMonthKey).filter(Boolean))].sort().reverse();
if(!keys.includes(current))keys.unshift(current);
if(!metricPeriodKey)metricPeriodKey=current;
if(!keys.includes(metricPeriodKey))metricPeriodKey=current;

 el.innerHTML=keys.map(k=>`<option value="${esc(k)}"${k===metricPeriodKey?' selected':''}>${esc(metricPeriodLabel(k))}${k===current?' • ATUAL':''}</option>`).join('');

}
function metricGroupRecords(group){
 /* V15.6.2: leitura SOMENTE pelo nome do Group. A atribuição (motor) já
    levou cada coleta para o Group atual da facção; o nome da facção vindo
    das fontes pode ter grafia diferente e não é usado para filtrar. */
 const k=chaveGroup(group);
 const rows=activeMetricRows().filter(m=>chaveGroup(m.group||m.organizacao||m.faccao)===k).sort((a,b)=>metricDateValue(a)-metricDateValue(b));
 return rows;
}
function metricPredominanceRange(values=[],width=5){
 const vals=values.map(Number).filter(Number.isFinite);
if(!vals.length)return {label:'—',
start:null,
end:null,
count:0,
share:0,
mid:0};

 const min=Math.floor(Math.min(...vals)),
max=Math.ceil(Math.max(...vals));
let best=null;

 for(let start=min;start<=max;start++){const end=start+width-1,
count=vals.filter(v=>v>=start&&v<=end).length,
inside=vals.filter(v=>v>=start&&v<=end),
avgInside=inside.length?inside.reduce((a,b)=>a+b,0)/inside.length:0;
const cand={start,
end,
count,
avgInside};
if(!best||count>best.count||(count===best.count&&avgInside>best.avgInside))best=cand}
 return {label:`${best.start}–${best.end}`,
start:best.start,
end:best.end,
count:best.count,
share:best.count/vals.length*100,
mid:(best.start+best.end)/2};

}
function metricAnalysis(group){
 const rows=metricGroupRecords(group);
if(!rows.length)return null;
const vals=[],
win={},
dailyPeaks=[],
hourValues={};
let peak={value:-1,
hour:'—',
date:'—'};

 rows.forEach(r=>{const entries=Object.entries(metricSlots(r)).filter(([,
v])=>Number.isFinite(Number(v)));entries.forEach(([h,
v0])=>{const v=Number(v0);vals.push(v);if(!hourValues[h])hourValues[h]=[];hourValues[h].push(v);if(!(h in win))win[h]=0;if(v>peak.value)peak={value:v,
hour:h,
date:r.data||r.date||'—'}});if(entries.length){const mx=Math.max(...entries.map(x=>Number(x[1])));dailyPeaks.push(mx);entries.filter(x=>Number(x[1])===mx&&mx>0).forEach(x=>win[x[0]]++)}});

 const avg=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0;
const predHour=Object.entries(win).sort((a,b)=>b[1]-a[1])[0];
const predominance=metricPredominanceRange(vals);
const nightVals=Object.entries(hourValues).filter(([h])=>metricSlotMinutes(h)>=21*60).flatMap(([,
v])=>v);
const nightPredominance=metricPredominanceRange(nightVals);
const hourAvg=Object.fromEntries(Object.entries(hourValues).map(([h,
v])=>[h,
v.length?v.reduce((a,b)=>a+b,0)/v.length:0]));
const strongestHour=Object.entries(hourAvg).sort((a,b)=>b[1]-a[1])[0]||['—',
0];
const dailyPeakAvg=dailyPeaks.length?dailyPeaks.reduce((a,b)=>a+b,0)/dailyPeaks.length:0;

 return {rows,
avg,
peak,
predominant:predHour&&predHour[1]?predHour[0]:'—',
predCount:predHour?.[1]||0,
predominance,
nightPredominance,
dailyPeakAvg,
hourAvg,
strongestHour:strongestHour[0],
strongestHourAvg:strongestHour[1]};

}

/* V9.6.1 - A URL de "Publicar na web" tem o formato
   /spreadsheets/d/e/2PACX-.../pub?output=csv . O regex antigo parava no
   primeiro segmento depois de /d/ e devolvia a letra "e" como ID, o que
   gerava a URL /spreadsheets/d/e/gviz/... e o HTTP 404. */
function isPublishedSheetUrl(value=''){
 return /\/spreadsheets\/d\/e\/[a-zA-Z0-9-_]+/.test(String(value||''));

}
function publishedCsvUrl(value=''){
 /* V9.6.2 - o link salvo costuma ser o "pubhtml?gid=...&single=true".
    A versao anterior trocava o final por /pub e perdia o gid, entao o Google
    devolvia a PRIMEIRA aba publicada em vez da aba de metricas. Agora o gid e
    preservado e so o formato muda para CSV. */
 try{
  const u=new URL(String(value||'').trim());

  const gid=u.searchParams.get('gid')||'';

  u.pathname=u.pathname.replace(/\/(pubhtml|pub|edit)\/?$/,'/pub');

  if(!/\/pub$/.test(u.pathname))u.pathname=u.pathname.replace(/\/$/,'')+'/pub';

  const q=new URLSearchParams();

  if(gid)q.set('gid',gid);

  q.set('single','true');

  q.set('output','csv');

  q.set('_',String(Date.now()));

  u.search=q.toString();

  return u.toString();

 }catch(e){
  const base=String(value||'').trim().split('?')[0].replace(/\/(pubhtml|pub|edit)\/?$/,'/pub');

  return base+'?output=csv&single=true&_='+Date.now();

 }
}
function extractSpreadsheetId(value=''){
 const v=String(value||'').trim();
if(!v)return '';

 if(isPublishedSheetUrl(v)){const p=v.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/);
return p?'e/'+p[1]:'';
}
 const m=v.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
if(m)return m[1];

 return /^[a-zA-Z0-9-_]{20,}$/.test(v)?v:'';

}
function a1SheetName(name=''){return `'${String(name).replace(/'/g,"''")}'`}
function normalizeMetricDate(v){
 const x=String(v??'').trim();
if(!x)return '';

 let m=x.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
if(m){let y=+m[3];
if(y<100)y+=2000;
return `${String(+m[1]).padStart(2,'0')}/${String(+m[2]).padStart(2,'0')}/${y}`}
 m=x.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
if(m)return `${String(+m[3]).padStart(2,'0')}/${String(+m[2]).padStart(2,'0')}/${m[1]}`;

 return '';

}
function parseMetricNumber(v){if(v===null||v===undefined||String(v).trim()==='')return null;
const n=Number(String(v).replace(/\s/g,'').replace(',','.'));
return Number.isFinite(n)?n:null}
function metricSlotLabel(v){return normalizeMetricSlotKey(v)}
function metricGroupLabel(v){
 const raw=String(v??'').trim();
if(!raw)return '';

 const n=alvesNorm(raw).replace(/\s+/g,'');

 const gk=x=>alvesNorm(x).replace(/[^a-z0-9]/g,'').replace(/mecanic/g,'mechanic').replace(/0*(\d+)$/,'$1');
 const known=(faccoes||[]).find(f=>alvesNorm(f.group).replace(/\s+/g,'')===n)||(faccoes||[]).find(f=>gk(f.group)===gk(raw));
if(known)return known.group;

 const compact=raw.replace(/\s+/g,'');

 if(/^(ARMAS|MUNI[CÇ][AÃ]O|MUNICAO|LAVAGEM|DROGAS|DESMANCHE|CONTRABANDO|ESTELIONATARIOS|ILEGALMEDIC|ILEGALMECHANIC)0*\d+$/i.test(compact))return compact.replace(/^MUNI[CÇ][AÃ]O/i,'Municao');

 if(/^(VANILLA|MANICOMIO)$/i.test(compact))return compact;

 return '';

}
function parseMetricSheet(values=[]){
 if(!Array.isArray(values)||!values.length)return [];

 /* V9.7.4 - parser dirigido pela linha de DATAS.
    A planilha oficial possui blocos mensais repetidos e setembro aparece duas vezes
    (um bloco preenchido e outro vazio). Nao usamos mais a deteccao de cabecalho para
    delimitar o bloco: uma linha com varias datas e a ancora; a linha seguinte e o
    cabecalho e as linhas seguintes sao os Groups ate a proxima linha de datas. */
 const scanLimit=Math.min(values.length,600),
 dateBlocks=[];

 for(let r=0;r<scanLimit;r++){
  const row=values[r]||[],
 anchors=[];

  for(let c=0;c<row.length;c++){const d=normalizeMetricDate(row[c]);
if(d)anchors.push({c,
d})}
  // Um bloco mensal real tem muitas datas. >=7 evita datas soltas de outras tabelas.
  if(anchors.length>=7)dateBlocks.push({dateRowIndex:r,
anchors});

 }
 if(!dateBlocks.length)return [];

 const candidates=[];

 for(let b=0;b<dateBlocks.length;b++){
  const block=dateBlocks[b],
 dateRowIndex=block.dateRowIndex;

  const headerIndex=dateRowIndex+1;

  const nextDateRow=dateBlocks[b+1]?.dateRowIndex??values.length;

  const header=values[headerIndex]||[];

  const map={},
slotByCol={},
padrao=['14H',
'16H',
'21H',
'23H'];

  for(let i=0;i<block.anchors.length;i++){
   const a=block.anchors[i],
next=block.anchors[i+1]?.c??Infinity;

   for(let off=0;off<4;off++){
    const c=a.c+off;
if(c>=next)break;

    map[c]=a.d;

    // Usa o texto real quando valido, mas a posicao fisica e a garantia.
    slotByCol[c]=metricSlotLabel(header[c])||padrao[off];

   }
  }
  const rows=[];

  for(let r=headerIndex+1;r<nextDateRow;r++){
   const row=values[r]||[];
let group='';

   for(const cell of row.slice(0,20)){group=metricGroupLabel(cell);
if(group)break}
   if(!group)continue;

   const byDate={};

   for(const [cs,
d] of Object.entries(map)){
    const c=Number(cs),
h=slotByCol[c],
num=parseMetricNumber(row[c]);

    if(num===null)continue;

    if(!byDate[d])byDate[d]={group,
data:d,
slots:{}};

    byDate[d].slots[h]=num;

   }
   Object.values(byDate).forEach(x=>rows.push(x));

  }
  const populated=rows.reduce((n,x)=>n+Object.values(x.slots).filter(v=>Number(v)>0).length,0);

  candidates.push({dateRowIndex,
rows,
populated});

 }
 // Duplicatas do mesmo mes: prioriza o bloco que realmente possui coletas.
 const bestByMonth=new Map();

 for(const c of candidates){
  const first=c.rows[0]?.data||normalizeMetricDate((values[c.dateRowIndex]||[]).find(normalizeMetricDate));

  if(!first)continue;
const month=first.slice(3);
const old=bestByMonth.get(month);

  if(!old||c.populated>old.populated)bestByMonth.set(month,c);

 }
 const out=[],
seen=new Set();

 for(const c of bestByMonth.values())for(const x of c.rows){
  const key=`${alvesNorm(x.group)}|${x.data}`;

  if(seen.has(key))continue;
seen.add(key);
out.push(x);

 }
 return out;

}
function metricTsToDate(v){
 if(!v)return null;
if(v?.toDate)return v.toDate();
if(v?.seconds)return new Date(v.seconds*1000);
const d=new Date(v);
return isNaN(d)?null:d;

}
function renderMetricSourceStatus(){
 const el=$('#metricSourceStatus');
 if(!el)return;
 const srv=metricSourceConfig.serverSync||{};
 const localState=String(metricSourceState.status||'');
 const serverState=String(srv.status||'').toUpperCase();
 // V12.8: o bot do Discord é a fonte operacional. Não exigir mais URL local
 // da planilha para considerar a Central configurada.
 const discordOnline=/DISCORD|GOOGLE SHEETS|ONLINE|CACHE_LOCAL/.test(localState.toUpperCase())&&metricas.length>0;
 const sheetConfigured=metricSourceConfig.mode==='GOOGLE_APPS_SCRIPT_FREE'||!!extractSpreadsheetId(metricSourceConfig.url);
 const configured=discordOnline||sheetConfigured;
 const online=discordOnline||serverState==='ONLINE'||localState==='ONLINE';
 const failed=!online&&(serverState==='ERRO'||localState==='ERRO'||/INDISPON/.test(localState.toUpperCase()));
 el.classList.toggle('online',online);
 el.classList.toggle('error',failed);
 const last=metricTsToDate(srv.lastSuccessAt)||metricTsToDate(srv.lastRunAt)||(metricSourceState.lastSync?new Date(metricSourceState.lastSync):null);
 const when=last?last.toLocaleString('pt-BR'):'—';
 const count=Number(metricSourceState.count||srv.rows||metricas.length)||0;
 let title=discordOnline?'DISCORD • CENTRAL DE MÉTRICAS':(sheetConfigured?'GOOGLE SHEETS • FONTE DIRETA':'FONTE NÃO CONFIGURADA');
 let desc=discordOnline?`Base sincronizada pelo High OS Bot • ${count} registros históricos • Google Sheets → Bot → Discord → High OS`:(sheetConfigured?'Fonte Google Sheets configurada':'Aguardando Central de Métricas do Discord');
 if(failed)desc=metricSourceState.error||srv.error||'Fonte temporariamente indisponível';
 el.innerHTML=`<div><span class="metric-source-dot"></span><div><b>${esc(title)}</b><small>${esc(desc)}</small></div></div><span>${configured?`Última sincronização: ${esc(when)}<br>COLETAS • 14H · 16H · 21H · 23H`:'AUTOMÁTICO'}</span>`;
}
async function fetchMetricsFromSource({persist=false,
quiet=false,
authorize=true}={}){
 if(!extractSpreadsheetId(metricSourceConfig.url)){if(!quiet)alert('Configure primeiro o link da planilha em Fonte.');
metricSourceState={status:'SEM FONTE',
lastSync:null,
count:0,
activeCount:0,
error:''};
renderMetricSourceStatus();
return false}
 metricSourceState={...metricSourceState,
status:'SINCRONIZANDO',
error:''};
renderMetricSourceStatus();

 try{const result=await readMetricsDirect({authorize});
const rows=result.rows.map(metricSnapshot);
metricas=rows;
metricPeriodKey=currentMetricMonthKey();
metricSourceState={status:'ONLINE',
lastSync:Date.now(),
count:rows.length,
activeCount:activeMetricRows().length,
error:'',
sheet:result.sheet};
renderMetricSourceStatus();
refreshMetricPeriodOptions();
renderMetrics();
if(persist)await persistMetricRows(rows,result.sheet);
if(!quiet)alert(`${rows.length} registro(s) históricos lidos da aba ${result.sheet}. Exibindo ${activeMetricRows().length} registro(s) de ${metricPeriodLabel(metricPeriodKey)}. A planilha não foi alterada.`);
return true
 }catch(e){metricas=metricasAtribuidas(metricasCache);
if(e.message==='AUTORIZAÇÃO NECESSÁRIA'){metricSourceState={...metricSourceState,
status:'AGUARDANDO',
error:''};
renderMetricSourceStatus();
return false}metricSourceState={...metricSourceState,
status:'ERRO',
error:e.message};
renderMetricSourceStatus();
renderMetrics();
if(!quiet)alert('Erro ao sincronizar métricas: '+e.message);
return false}
}
/* =====================================================================
   HIGH OS V9.6 - ECONOMIA DE COTA DAS METRICAS
   ---------------------------------------------------------------------
   A versao anterior regravava TODAS as linhas da planilha a cada
   sincronizacao, mesmo quando nada tinha mudado, e relia a colecao
   inteira antes e depois de gravar. Com alguns milhares de linhas e um
   ciclo a cada 5 minutos, o plano gratuito (50 mil leituras e 20 mil
   gravacoes por dia) era consumido em poucas horas - e a partir dai as
   metricas simplesmente paravam de ser alimentadas.

   Agora: compara linha a linha, grava so o que mudou, nao rele a
   colecao depois de gravar e trava a rotina quando a cota estoura.
   ===================================================================== */
let metricWriteCount=0,
 metricQuotaBlocked=false,
 metricQuotaAt=null;

function isQuotaError(e){
 const c=String(e?.code||'').toLowerCase(),
 m=String(e?.message||'').toLowerCase();

 return c.includes('resource-exhausted')||c.includes('quota')||m.includes('quota')||m.includes('resource-exhausted')||m.includes('exhausted');

}
function enterQuotaMode(e){
 if(metricQuotaBlocked)return;

 metricQuotaBlocked=true;
metricQuotaAt=new Date();

 stopMetricAutoRecovery();

 try{metricLiveUnsub?.();
metricLiveUnsub=null}catch(err){}
 metricSourceState={...metricSourceState,
status:'COTA ESGOTADA',
error:'Limite diário gratuito do Firebase atingido.'};

 renderMetricSourceStatus();
renderMetricQuotaPanel();

 try{window.highToast?.('Cota diária do Firebase esgotada. As métricas seguem visíveis com a última cópia; a gravação volta após a virada do dia (meia-noite no Pacífico, 4h/5h em Brasília).','err',12000)}catch(err){}
 console.warn('[MÉTRICAS] cota esgotada:',e?.message||e);

}

/* Devolve apenas as linhas novas ou alteradas em relacao ao que ja esta gravado. */
function metricRowsPendentes(sheetRows=[],fireRows=[]){
 const fire=new Map(fireRows.map(r=>[metricRowKey(r),
r]));

 const pendentes=[];

 for(const s of sheetRows){
  const f=fire.get(metricRowKey(s));

  if(!f){pendentes.push(s);
continue}
  const fs=metricSlots(f),
 ss=metricSlots(s);

  let mudou=false;

  for(const [k,
v] of Object.entries(ss)){if(!(k in fs)||Number(fs[k])!==Number(v)){mudou=true;
break}}
  if(mudou)pendentes.push(s);

 }
 return pendentes;

}

async function persistMetricRows(rows,sheet='',{jaFiltrado=false}={}){
 metricasCache=Array.isArray(rows)?rows.slice():[];
 return {gravadas:0,bloqueado:false,source:'GOOGLE_SHEETS'};
}

function applyMetricSnapshot(qs,{realtime=false}={}){
 const previousKey=metricPeriodKey||currentMetricMonthKey();

 metricasCache=qs.docs.map(d=>({id:d.id,
...d.data()}));

 metricas=metricasAtribuidas(metricasCache);

 metricPeriodKey=previousKey;

 if(realtime){metricLiveLastAt=Date.now();
metricSourceState={...metricSourceState,
status:'ONLINE',
lastSync:metricLiveLastAt,
count:metricas.length,
activeCount:activeMetricRows().length,
error:''}}
 refreshMetricPeriodOptions();
renderMetrics();
renderMetricSourceStatus();

}

/* =====================================================================
   PAINEL DE CONSUMO DO FIREBASE (V9.6)
   Mostra, na propria tela de Metricas, quanto da cota diaria gratuita
   ja foi usado nesta sessao e o estado da sincronizacao. Sem isso o
   sistema falhava em silencio quando o limite estourava.
   ===================================================================== */
function metricReadCount(){return 0}
function ensureMetricQuotaPanel(){
 const host=document.getElementById('metricSourceStatus');
 if(!host||document.getElementById('metricQuotaPanel'))return null;
 const box=document.createElement('div');box.id='metricQuotaPanel';box.className='metric-quota-panel';host.insertAdjacentElement('afterend',box);return box;
}
function renderMetricQuotaPanel(){
 const box=ensureMetricQuotaPanel()||document.getElementById('metricQuotaPanel');if(!box)return;
 const online=metricOrigem==='DISCORD';
 box.className='metric-quota-panel'+(online?'':' bloqueado');
 box.innerHTML=`<div class="mq-head"><b>MÉTRICAS • DISCORD</b><span>${online?'fonte oficial online':'fonte oficial indisponível'}</span></div><div class="mq-foot"><span>${metricas.length.toLocaleString('pt-BR')} registros carregados • Apps Script → bot (PC) → Discord → High OS</span><button type="button" id="metricSyncNow">ATUALIZAR AGORA</button></div>`;
 document.getElementById('metricSyncNow')?.addEventListener('click',async()=>{const btn=document.getElementById('metricSyncNow');if(btn){btn.disabled=true;btn.textContent='ATUALIZANDO...'}try{await loadMetrics({force:true})}catch(e){alert('Não foi possível atualizar as métricas: '+e.message)}finally{if(btn){btn.disabled=false;btn.textContent='ATUALIZAR AGORA'}}});
}

/* V9.6 - a escuta em tempo real da colecao inteira cobra uma leitura por
   documento a cada alteracao. Com a sincronizacao de 30 em 30 minutos ela
   deixou de compensar: fica desligada por padrao e pode ser ligada na tela
   de Métricas quando alguem estiver acompanhando ao vivo. */
function metricRealtimeAtivo(){
 try{return localStorage.getItem('highos_metric_realtime')==='1'}catch(e){return false}
}
function setMetricRealtime(on){
 try{localStorage.setItem('highos_metric_realtime',on?'1':'0')}catch(e){}
 if(on)startMetricRealtime();

 else stopMetricRealtime();
 renderMetricQuotaPanel();

}
/* V10.1 - "Tempo real" nao abre mais listener na colecao legada.
   A colecao metricas tem milhares de documentos e um onSnapshot nela cobra
   uma leitura por documento ao iniciar. Quando o usuario pede tempo real,
   reaproveitamos a sincronizacao barata da planilha/espelho e atualizamos
   somente enquanto a pagina esta visivel. */
let metricLiveTimer=null;
function stopMetricRealtime(){
 try{metricLiveUnsub?.()}catch(e){}
 metricLiveUnsub=null;
 if(metricLiveTimer){clearInterval(metricLiveTimer);metricLiveTimer=null}
}
async function refreshMetricRealtimeCheap(){
 if(document.visibilityState==='hidden')return;
 try{await loadMetrics({force:true});metricLiveLastAt=Date.now()}
 catch(e){console.warn('[MÉTRICAS] atualização Discord falhou',e?.message||e)}
}
function startMetricRealtime(){
 stopMetricRealtime();
 const activePage=document.querySelector('.page.active')?.id?.replace('page-','')||'';
 if(!['dashboard','metricas'].includes(activePage))return;
 if(metricQuotaBlocked)return;
 // A API do bot serve o cache em RAM e não gera leituras no
 // Firestore. Enquanto Dashboard/Métricas estiver visível, atualizamos
 // automaticamente para que 14H/16H/21H/23H apareçam sem recarregar a página.
 refreshMetricRealtimeCheap();
 metricLiveTimer=setInterval(refreshMetricRealtimeCheap,5*60*1000);
}
document.addEventListener('visibilitychange',()=>{
 if(document.visibilityState==='hidden'){
  if(metricLiveTimer){clearInterval(metricLiveTimer);metricLiveTimer=null}
 }else if(!metricLiveTimer){
  const activePage=document.querySelector('.page.active')?.id?.replace('page-','')||'';
  if(['dashboard','metricas'].includes(activePage))startMetricRealtime();
 }
});

/* =====================================================================
   HIGH OS V10 - METRICAS SEM CUSTO DE LEITURA
   ---------------------------------------------------------------------
   O backup de 17/09 mostrou 10.076 documentos na colecao "metricas": um
   por Group, por dia. Abrir o modulo com o cache frio custava 10.076
   leituras, e o limite gratuito e de 50.000 por dia. Cinco aberturas
   esgotavam a cota - era o fundo do poco do problema original.

   A planilha publicada ja contem o historico inteiro e e servida como
   arquivo estatico: ler o CSV nao consome cota nenhuma do Firebase.
   Entao a ordem de leitura passa a ser:

     1. CSV da planilha publicada        -> 0 leituras
     2. espelho mensal no Firestore      -> 1 leitura por mes
     3. colecao antiga (compatibilidade) -> so se os dois acima falharem

   O espelho mensal guarda o mes inteiro em UM documento
   (highos/data/metricas_mensais/AAAA-MM), gravado apenas quando o
   conteudo daquele mes muda. Sai de ate 2.060 gravacoes por
   sincronizacao para 1 por mes alterado.

   A colecao antiga nao e apagada: fica como historico ate voce decidir.
   ===================================================================== */
let metricOrigem='';
          // de onde vieram os dados exibidos
let metricMesesCarregados=new Set();

function metricMesDe(data=''){                       // 'dd/mm/aaaa' -> 'aaaa-mm'
 const m=String(data||'').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

 return m?`${m[3]}-${m[2]}`:'';

}
/* Formato compacto: um mes de 56 Groups x 30 dias fica em torno de 140 KB,
   bem abaixo do teto de 1 MB por documento do Firestore. */
function compactarLinhas(rows=[]){
 return rows.map(r=>({g:r.group,
d:r.data,
s:r.slots||{}}));

}
function expandirLinhas(rows=[]){
 return rows.map(r=>({group:r.g,
data:r.d,
slots:r.s||{}}));

}
function agruparPorMes(rows=[]){
 const mapa=new Map();

 for(const r of rows){
  const mes=metricMesDe(r.data);
if(!mes)continue;

  if(!mapa.has(mes))mapa.set(mes,[]);

  mapa.get(mes).push(r);

 }
 return mapa;

}
function assinaturaMes(rows=[]){
 // assinatura barata para saber se o mes mudou desde a ultima gravacao
 let soma=0,
n=0;

 for(const r of rows)for(const v of Object.values(r.slots||{})){soma+=Number(v)||0;
n++}
 return `${rows.length}:${n}:${soma}`;

}

/* Grava um documento por mes alterado. Substitui persistMetricRows no
   fluxo novo; a funcao antiga continua no arquivo para compatibilidade. */
async function salvarEspelhoMensal(rows=[],sheet=''){
 // V12 Discord Storage: métricas permanecem na Google Sheets.
 // O bot High OS lê a planilha diretamente; não replicar no Firestore.
 metricasCache=Array.isArray(rows)?rows.slice():[];
 metricSourceState={...metricSourceState,lastSync:Date.now()};
 return {gravados:0,source:'GOOGLE_SHEETS'};
}

/* Le o espelho mensal. Usado quando o CSV nao esta disponivel. */
async function lerEspelhoMensal(meses=[]){
 // Legado Firestore desativado: métricas vêm diretamente da Google Sheets.
 return [];
}

function aplicarLinhasMetricas(rows=[],origem=''){
 metricOrigem=origem;

 metricasCache=rows.slice();

 metricas=metricasAtribuidas(rows);

 metricPeriodKey=metricPeriodKey||currentMetricMonthKey();

 refreshMetricPeriodOptions();

 renderMetrics();

 renderMetricQuotaPanel();

}

async function loadMetrics({force=false}={}){
 if(metricsLoadPromise&&!force)return metricsLoadPromise;
 metricsLoadPromise=(async()=>{
  metricPeriodKey=metricPeriodKey||currentMetricMonthKey();
  await loadMetricSourceConfig().catch(()=>{});
  await carregarTransferenciasMetricas();
  try{
   const remote=await metricTimeout(highOsDiscordRequest('/v1/metrics'),15000,'métricas do Discord');
   if(!Array.isArray(remote?.rows)||!remote.rows.length)throw new Error('Snapshot de métricas vazio no Discord.');
   aplicarLinhasMetricas(remote.rows,'DISCORD');
   metricSourceState={...metricSourceState,status:'DISCORD / APPS SCRIPT',lastSync:remote.receivedAt||null,count:remote.rows.length,activeCount:activeMetricRows().length,error:''};
   renderMetricSourceStatus();
   metricsLoaded=true;
   return remote;
  }catch(e){
   // Fallback para a planilha só quando ela estiver ativada como fonte
   // (Métricas > Fonte de métricas). Padrão: somente Paradise via bot.
   try{
    if(metricSourceConfig.planilhaAtiva!==true)throw new Error('planilha desativada como fonte (somente Paradise)');
    const direct=await metricTimeout(readMetricsWithoutPopup(),15000,'leitura direta da planilha');
    if(!Array.isArray(direct?.rows)||!direct.rows.length)throw new Error('Planilha sem métricas reconhecíveis.');
    const rows=direct.rows.map(metricSnapshot);
    aplicarLinhasMetricas(rows,'GOOGLE_SHEETS_FALLBACK');
    metricSourceState={...metricSourceState,status:'GOOGLE SHEETS • FALLBACK',lastSync:Date.now(),count:rows.length,activeCount:activeMetricRows().length,error:'Discord: '+(e?.message||String(e)),sheet:direct.sheet||metricSourceConfig.sheet||''};
    renderMetricSourceStatus();
    metricsLoaded=true;
    return {rows,source:'google_sheets_fallback',sheet:direct.sheet||''};
   }catch(sheetError){
    // Preserve o último conjunto válido em memória em vez de zerar a tela.
    metricSourceState={...metricSourceState,status:'MÉTRICAS TEMPORARIAMENTE INDISPONÍVEIS',error:(e?.message||String(e))+' | Sheets: '+(sheetError?.message||String(sheetError))};
    if(metricasCache.length)aplicarLinhasMetricas(metricasCache,'CACHE_LOCAL');
    else {refreshMetricPeriodOptions();renderMetrics();renderMetricQuotaPanel();}
    renderMetricSourceStatus();
    throw e;
   }
  }
 })();
 try{return await metricsLoadPromise}finally{metricsLoadPromise=null}
}
function metricIdentity(group,row=null){
 const f=metricFaccaoDoGroup(group)||SEED.find(x=>alvesNorm(x.group)===alvesNorm(group))||{};

 return {group:group||f.group||'',
faccao:row?.faccaoSnapshot||row?.faccao||f.faccao||'',
qg:row?.qgSnapshot||f.qg||'',
segmento:row?.segmentoSnapshot||f.segmento||'',
lider:row?.liderSnapshot||f.lider||''};

}
function metricSnapshot(row={}){
 const id=metricIdentity(row.group||row.organizacao||row.faccao,row);

 return {...row,
faccaoSnapshot:id.faccao,
qgSnapshot:id.qg,
segmentoSnapshot:id.segmento,
liderSnapshot:id.lider,
snapshotVersion:'V8.4'};

}
function metricSummaryRows(){
 const active=activeMetricRows();

 // Deduplica o Group pela chave normalizada. A planilha/histórico pode conter o mesmo
 // Group com caixa, acento ou espaços diferentes (ex.: Armas09 / ARMAS09 / Armas09 ).
 const groupMap=new Map();

 active.forEach(m=>{
  const raw=String(m.group||m.organizacao||m.faccao||'').trim();
  if(!raw)return;
  const key=alvesNorm(raw).replace(/\s+/g,'');
  if(!groupMap.has(key))groupMap.set(key,raw);
 });

 return [...groupMap.values()].map(group=>{
  const first=active.find(m=>alvesNorm(String(m.group||m.organizacao||m.faccao||'')).replace(/\s+/g,'')===alvesNorm(group).replace(/\s+/g,''));
  const ident=metricIdentity(group,first);
  const cad=metricFaccaoDoGroup(group),f=cad&&!cad.removido?cad:ident;
  const a=metricAnalysis(group);
  return a?{f:{...f,
group:String(f.group||group).trim(),
faccao:f.faccao||metricIdentity(group,a.rows[0]).faccao,
segmento:f.segmento||metricIdentity(group,a.rows[0]).segmento,
qg:f.qg||metricIdentity(group,a.rows[0]).qg},
a}:null;
 }).filter(Boolean).sort((x,y)=>y.a.avg-x.a.avg);

}
function metricDateLabel(row){const d=metricDateValue(row);
return d&&d.getTime()?d.toLocaleDateString('pt-BR'):(row?.data||row?.date||'—')}
function metricDayAverage(row){const v=Object.values(metricSlots(row));
return v.length?v.reduce((a,b)=>a+b,0)/v.length:0}
function metricPeriodRange(rows=[]){const dates=rows.map(metricDateValue).filter(d=>d&&d.getTime()).sort((a,b)=>a-b);
if(!dates.length)return '—';
return `${dates[0].toLocaleDateString('pt-BR')} a ${dates.at(-1).toLocaleDateString('pt-BR')}`}
function metricModeValue(values=[]){const counts=new Map();
values.forEach(v=>counts.set(v,(counts.get(v)||0)+1));
return [...counts.entries()].sort((a,b)=>b[1]-a[1]||b[0]-a[0])[0]?.[0]??'—'}
function metricSortRows(rows=[],mode='peak'){
 const out=[...rows];
const name=x=>alvesNorm(`${x.f?.faccao||''} ${x.f?.group||''}`),
seg=x=>alvesNorm(x.f?.segmento||'OUTROS');

 return out.sort((a,b)=>{if(mode==='peak')return b.a.peak.value-a.a.peak.value||b.a.avg-a.a.avg;if(mode==='predominance')return (b.a.predominance?.mid||0)-(a.a.predominance?.mid||0)||b.a.predominance?.share-a.a.predominance?.share;if(mode==='dailyPeakAvg')return b.a.dailyPeakAvg-a.a.dailyPeakAvg;if(mode==='avg')return b.a.avg-a.a.avg;if(mode==='segment')return seg(a).localeCompare(seg(b),'pt-BR')||name(a).localeCompare(name(b),'pt-BR');if(mode==='name')return name(a).localeCompare(name(b),'pt-BR');return b.a.avg-a.a.avg})
}
function metricCurrentScope(){return $('#metricScopeSelect')?.value||''}

function metricSelectedGroup(){return $('#metricFactionSelect')?.value||metricSummaryRows()[0]?.f?.group||''}
function syncMetricSelectors(){
 const rows=metricSummaryRows();
const options=rows.map(x=>`<option value="${esc(x.f.group)}">${esc(x.f.faccao||x.f.group)} • ${esc(x.f.group)}${x.f.segmento?' • '+esc(x.f.segmento):''}</option>`).join('');

 const fs=$('#metricFactionSelect'),
rg=$('#metricReportGroup'),
scope=$('#metricScopeSelect');
const keepF=fs?.value,
keepR=rg?.value,
keepScope=scope?.value;

 if(scope){scope.innerHTML='<option value="">GERAL • TODAS AS FACÇÕES</option>'+options;
if(keepScope&&rows.some(x=>x.f.group===keepScope))scope.value=keepScope}
 if(fs){fs.innerHTML=options||'<option value="">SEM DADOS</option>';
if(keepF&&rows.some(x=>x.f.group===keepF))fs.value=keepF}
 if(rg){const seg=$('#metricReportSegment')?.value||'';
const filtered=rows.filter(x=>!seg||x.f.segmento===seg);
rg.innerHTML=filtered.map(x=>`<option value="${esc(x.f.group)}">${esc(x.f.group)}${x.f.faccao?' • '+esc(x.f.faccao):''}</option>`).join('')||'<option value="">SEM DADOS</option>';
if(keepR&&filtered.some(x=>x.f.group===keepR))rg.value=keepR}
 const rp=$('#metricReportPeriod');
if(rp&&$('#metricPeriod')){const selected=rp.value||metricPeriodKey;
rp.innerHTML=$('#metricPeriod').innerHTML;
if([...rp.options].some(o=>o.value===selected))rp.value=selected}
}
function renderMetricFactionDetail(group=metricSelectedGroup()){
 const sum=$('#metricFactionSummary'),
table=$('#metricFactionTable');
if(!sum||!table)return;

 if(!group){sum.innerHTML='';
table.innerHTML='<div class="placeholder"><h3>SEM DADOS</h3></div>';
return}
 const a=metricAnalysis(group);
if(!a){sum.innerHTML='';
table.innerHTML='<div class="placeholder"><h3>SEM MÉTRICAS PARA ESTE GROUP</h3></div>';
return}
 const id=metricIdentity(group,a.rows[0]);
const keys=metricSlotKeys(a.rows),
expected=a.rows.length*keys.length,
filled=a.rows.reduce((n,r)=>n+Object.values(metricSlots(r)).filter(v=>Number.isFinite(v)).length,0);

 sum.innerHTML=`<article><span>FACÇÃO</span><b>${esc(id.faccao||'—')}</b><small>${esc(group)} • ${esc(id.segmento||'—')}</small></article><article><span>PICO</span><b>${a.peak.value}</b><small>${esc(a.peak.hour)} • ${esc(a.peak.date)}</small></article><article class="metric-predominance-card"><span>PREDOMINÂNCIA</span><b>${esc(a.predominance.label)}</b><small>${a.predominance.share.toFixed(0)}% das medições nessa faixa</small></article><article><span>MÉDIA DIÁRIA DE PICO</span><b>${a.dailyPeakAvg.toFixed(1)}</b><small>média do maior contingente de cada dia</small></article><article><span>MÉDIA GERAL</span><b>${a.avg.toFixed(1)}</b><small>todos os horários do período</small></article><article><span>MELHOR HORÁRIO</span><b>${esc(a.strongestHour)}</b><small>média ${a.strongestHourAvg.toFixed(1)} • noite ${esc(a.nightPredominance.label)}</small></article>`;

 table.innerHTML=`<div class="metric-date-table-title"><div><b>HISTÓRICO DIÁRIO</b><span>${esc(id.faccao||group)} • ${esc(metricActivePeriodLabel())} • ${filled}/${expected} coletas</span></div></div><div class="metric-table-scroll"><table class="metric-date-table"><thead><tr><th>DATA</th>${keys.map(h=>`<th>${esc(h)}</th>`).join('')}<th>PICO DO DIA</th><th>MÉDIA DO DIA</th></tr></thead><tbody>${a.rows.map(r=>{const sl=metricSlots(r),vals=Object.values(sl).filter(Number.isFinite),pk=vals.length?Math.max(...vals):'—';const cl=coletaDoDia(sl,metricDateValue(r)),pl=rotuloColeta(cl);return `<tr class="${pl?'metric-row-parcial':''}"><td><b>${esc(metricDateLabel(r))}</b>${r.gruposOrigem&&r.gruposOrigem.some(x=>alvesNorm(x)!==alvesNorm(group))?`<small class="metric-origem">no ${esc(r.gruposOrigem.join(', '))}</small>`:''}</td>${keys.map(h=>`<td>${sl[h]??(cl.aguardando&&!(h in sl)?'<i class="metric-wait">…</i>':'—')}</td>`).join('')}<td><b>${pk}</b></td><td>${metricDayAverage(r).toFixed(1)}${pl?`<small class="metric-parcial">${esc(pl)}</small>`:''}</td></tr>`}).join('')}</tbody></table></div>`;

}
function metricReportData(group,period=metricPeriodKey){
 const prev=metricPeriodKey;
metricPeriodKey=period||prev;
const a=metricAnalysis(group);
metricPeriodKey=prev;
if(!a)return null;
const id=metricIdentity(group,a.rows[0]);
const vals=a.rows.flatMap(r=>Object.values(metricSlots(r)));
return {group,
id,
a,
low:vals.length?Math.min(...vals):0,
mode:metricModeValue(vals),
range:metricPeriodRange(a.rows),
period:period||prev};

}
function buildMetricReportHtml(data,printMode=false){
 if(!data)return '<div class="placeholder"><h3>SEM DADOS PARA O RELATÓRIO</h3></div>';
const {group,
id,
a,
low,
mode,
range,
period}=data;

 return `<article class="monthly-report${printMode?' print-report':''}"><header><div><span>HIGH ROLEPLAY • CENTRAL DE MÉTRICAS</span><h2>RELATÓRIO MENSAL DE DESEMPENHO</h2><p>${esc(metricPeriodLabel(period))} • período ${esc(range)}</p></div><div class="report-badge">RH</div></header><section class="report-ident"><div><span>FACÇÃO</span><b>${esc(id.faccao||'—')}</b></div><div><span>GROUP</span><b>${esc(group)}</b></div><div><span>SEGMENTO</span><b>${esc(id.segmento||'—')}</b></div><div><span>QG</span><b>${esc(id.qg||'—')}</b></div><div><span>LÍDER</span><b>${esc(id.lider||'—')}</b></div></section><section class="report-kpis"><div><span>PICO</span><b>${a.peak.value}</b><small>${esc(a.peak.hour)} • ${esc(a.peak.date)}</small></div><div><span>PREDOMINÂNCIA</span><b>${esc(a.predominance.label)}</b><small>${a.predominance.share.toFixed(0)}% das medições</small></div><div><span>MÉDIA DIÁRIA DE PICO</span><b>${a.dailyPeakAvg.toFixed(1)}</b></div><div><span>MÉDIA GERAL</span><b>${a.avg.toFixed(1)}</b></div><div><span>MELHOR HORÁRIO</span><b>${esc(a.strongestHour)}</b><small>média ${a.strongestHourAvg.toFixed(1)}</small></div></section><section><h3>REGISTROS DIÁRIOS</h3><table><thead><tr><th>Data</th><th>14H</th><th>16H</th><th>21H</th><th>23H</th><th>Média</th></tr></thead><tbody>${a.rows.map(r=>{const sl=metricSlots(r);return `<tr><td>${esc(metricDateLabel(r))}</td><td>${sl['14H']??'—'}</td><td>${sl['16H']??'—'}</td><td>${sl['21H']??'—'}</td><td>${sl['23H']??'—'}</td><td>${metricDayAverage(r).toFixed(2)}</td></tr>`}).join('')}</tbody></table></section><footer>Gerado pelo High OS • ${new Date().toLocaleString('pt-BR')}</footer></article>`;

}
function renderMetricReport(){
 const group=$('#metricReportGroup')?.value||'',
period=$('#metricReportPeriod')?.value||metricPeriodKey;
const data=metricReportData(group,period);
$('#metricReportPreview').innerHTML=buildMetricReportHtml(data);
return data;

}
function printMetricReport(){
 const data=renderMetricReport();
if(!data)return alert('Selecione uma facção com dados nesta competência.');
const w=window.open('','_blank','width=1050,height=760');
if(!w)return alert('O navegador bloqueou a janela de impressão.');
w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Relatório ${esc(data.group)} - ${esc(metricPeriodLabel(data.period))}</title><style>body{font-family:Arial,sans-serif;color:#17131b;margin:32px}header{display:flex;justify-content:space-between;border-bottom:3px solid #6f25a7;padding-bottom:16px}header span,.report-ident span,.report-kpis span{font-size:10px;text-transform:uppercase;color:#716978}h2{margin:5px 0}.report-badge{font-size:24px;font-weight:900}.report-ident,.report-kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin:20px 0}.report-ident div,.report-kpis div{border:1px solid #ddd;border-radius:8px;padding:10px}.report-ident b,.report-kpis b{display:block;margin-top:5px}.report-kpis b{font-size:22px}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #ddd;padding:8px;text-align:center}th{background:#f2edf6}footer{margin-top:20px;font-size:10px;color:#777}@media print{body{margin:12mm}.no-print{display:none}}</style></head><body>${buildMetricReportHtml(data,true)}<script>window.onload=()=>window.print()<\/script></body></html>`);
w.document.close();

}
function downloadMetricCsv(){
 const data=renderMetricReport();
if(!data)return alert('Selecione uma facção com dados nesta competência.');
const lines=[['Data',
'14H',
'16H',
'21H',
'23H',
'Media'],
...data.a.rows.map(r=>{const s=metricSlots(r);return [metricDateLabel(r),
s['14H'],
s['16H'],
s['21H'],
s['23H'],
metricDayAverage(r).toFixed(2).replace('.',',')]})];
const csv='\ufeff'+lines.map(row=>row.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(';')).join('\r\n');
const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),
a=document.createElement('a');
a.href=URL.createObjectURL(blob);
a.download=`metricas_${slug(data.group)}_${data.period}.csv`;
a.click();
setTimeout(()=>URL.revokeObjectURL(a.href),1000);

}

function metricGroupKey(row){return alvesNorm(String(row?.group||row?.organizacao||row?.faccao||'')).replace(/\s+/g,'')}
function metricTimeMinutes(h){const m=String(h||'').toUpperCase().match(/(\d{1,2})(?::?(\d{2}))?/);
return m?(+m[1]*60+(+m[2]||0)):9999}
function metricTimeline(rows=[]){
 const map=new Map();

 rows.forEach(r=>{const d=metricDateValue(r);if(!d||!d.getTime())return;const day=d.toISOString().slice(0,10);Object.entries(metricSlots(r)).forEach(([hour,
val])=>{val=Number(val);if(!Number.isFinite(val))return;const key=day+'|'+hour;const cur=map.get(key)||{day,
date:new Date(d),
hour,
total:0,
count:0};cur.total+=val;cur.count++;map.set(key,cur)})});

 return [...map.values()].sort((a,b)=>a.date-b.date||metricTimeMinutes(a.hour)-metricTimeMinutes(b.hour));

}
function metricCalendarRange31(daily=[]){
 let start=null,
end=null;

 if(metricDateStart||metricDateEnd){
  start=parseIsoMetricDate(metricDateStart)||daily[0]?.date||null;

  end=parseIsoMetricDate(metricDateEnd)||daily.at(-1)?.date||start;

 }else{
  const m=String(metricPeriodKey||currentMetricMonthKey()).match(/^(\d{4})-(\d{2})$/);

  if(m){start=new Date(+m[1],+m[2]-1,1);
end=new Date(+m[1],+m[2],0)}
 }
 if(!start&&daily.length)start=new Date(daily[0].date);

 if(!end&&daily.length)end=new Date(daily.at(-1).date);

 if(!start||!end)return [];

 start=new Date(start.getFullYear(),start.getMonth(),start.getDate());

 end=new Date(end.getFullYear(),end.getMonth(),end.getDate());

 const by=new Map(daily.map(d=>[`${d.date.getFullYear()}-${String(d.date.getMonth()+1).padStart(2,'0')}-${String(d.date.getDate()).padStart(2,'0')}`,
d]));

 const out=[];

 for(let d=new Date(start);d<=end&&out.length<31;d.setDate(d.getDate()+1)){
  const dd=new Date(d),
key=`${dd.getFullYear()}-${String(dd.getMonth()+1).padStart(2,'0')}-${String(dd.getDate()).padStart(2,'0')}`;

  out.push({date:dd,
data:by.get(key)||null});

 }
 // Em competência mensal, preserva sempre 31 posições para manter a leitura visual estável.
 if(!(metricDateStart||metricDateEnd)){
  while(out.length<31){
   const dd=new Date(start.getFullYear(),start.getMonth(),out.length+1);

   if(dd.getMonth()!==start.getMonth())out.push({date:null,
data:null});
else out.push({date:dd,
data:by.get(`${dd.getFullYear()}-${String(dd.getMonth()+1).padStart(2,'0')}-${String(dd.getDate()).padStart(2,'0')}`)||null});

  }
 }
 return out;

}
function metricDailyBars(daily=[]){
 const cols=metricCalendarRange31(daily);
if(!cols.length)return '<div class="metric-empty-chart">Sem dados suficientes para montar o gráfico.</div>';

 const values=cols.map(c=>c.data?.avg||0),
max=Math.max(1,...values);

 return `<div class="metric-month-bars" role="img" aria-label="Contingente diário do período">${cols.map(c=>{
  if(!c.date)return `<div class="metric-month-col metric-month-empty"><div class="metric-month-value">—</div><div class="metric-month-track"><i style="height:0%"></i></div><b>—</b><span>—</span></div>`;
  const d=c.data,v=d?.avg||0,pct=d?Math.max(4,Math.min(100,v/max*100)):0,week=c.date.toLocaleDateString('pt-BR',{weekday:'short'}).replace('.','').toUpperCase(),day=String(c.date.getDate()).padStart(2,'0'),count=d?.vals?.length||0,tip=d?`${c.date.toLocaleDateString('pt-BR')} • ${count<4?'PARCIAL • ':''}${count}/4 coletas • média ${v.toFixed(1)} • pico ${d.peak.total} às ${d.peak.hour}`:`${c.date.toLocaleDateString('pt-BR')} • sem coleta`;
  return `<div class="metric-month-col${d?'':' metric-month-no-data'}" title="${esc(tip)}"><div class="metric-month-value">${d?v.toFixed(0)+(count<4?' P':''):'—'}</div><div class="metric-month-track"><i style="height:${pct}%"></i></div><b>${day}</b><span>${week}</span></div>`;
 }).join('')}</div>`;

}
function metricDailySummary(points=[]){
 const days=new Map();
points.forEach(p=>{const a=days.get(p.day)||{date:p.date,
vals:[],
peak:p};a.vals.push(p.total);if(p.total>a.peak.total)a.peak=p;days.set(p.day,a)});

 return [...days.values()].map(d=>({date:d.date,
vals:d.vals,
avg:d.vals.reduce((a,b)=>a+b,0)/d.vals.length,
peak:d.peak}));

}
function metricSegmentSummary(active=[]){
 const by=new Map();
active.forEach(r=>{const id=metricIdentity(r.group||r.organizacao||r.faccao,r),
seg=id.segmento||'OUTROS';if(!by.has(seg))by.set(seg,[]);by.get(seg).push(r)});

 return [...by.entries()].map(([segmento,
rs])=>{const pts=metricTimeline(rs),
vals=pts.map(p=>p.total);return {segmento,
avg:vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0,
peak:vals.length?Math.max(...vals):0}}).sort((a,b)=>b.avg-a.avg);

}

function metricScopeTitle(rows=[],seg=''){
 const scope=metricCurrentScope();
if(scope){const x=rows.find(r=>r.f.group===scope)||metricSummaryRows().find(r=>r.f.group===scope);
return x?`${x.f.faccao||x.f.group} • ${x.f.group}`:scope}
 return seg?`${seg} • GERAL`:'GERAL ILEGAL';

}
function metricAggregateDays(raw=[]){
 const by=new Map();
raw.forEach(r=>{const d=metricDateValue(r);if(!d||!d.getTime())return;const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;if(!by.has(key))by.set(key,{key,
date:new Date(d.getFullYear(),d.getMonth(),d.getDate()),
slots:{},
groups:{}});const x=by.get(key),
g=String(r.group||r.organizacao||r.faccao||'');const sl=metricSlots(r);x.groups[g]=sl;Object.entries(sl).forEach(([h,
v])=>{if(Number.isFinite(Number(v)))x.slots[h]=(x.slots[h]||0)+Number(v)})});
return [...by.values()].sort((a,b)=>a.date-b.date)
}
function metricWeekBounds(date=new Date()){const d=new Date(date.getFullYear(),date.getMonth(),date.getDate()),
dow=(d.getDay()+6)%7;
const start=new Date(d);
start.setDate(d.getDate()-dow);
const end=new Date(start);
end.setDate(start.getDate()+6);
return {start,
end}}
function metricFmtDay(d){return d.toLocaleDateString('pt-BR',{weekday:'short'}).replace('.','').toUpperCase()+` ${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`}
function metricDailyCard(day,title){const hours=['14H',
'16H',
'21H',
'23H'],
collected=hours.filter(h=>Number.isFinite(day?.slots?.[h])),
vals=collected.map(h=>day.slots[h]),
peak=vals.length?Math.max(...vals):null,
avg=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null,
pending=4-collected.length,
status=!day||!collected.length?'SEM COLETA':pending?`PARCIAL • ${collected.length}/4 COLETAS • AGUARDANDO ${pending}`:'4/4 COLETAS • DIA COMPLETO';
return `<section class="metric-daily-card"><header><div><span>${esc(title)}</span><h3>${day?esc(day.date.toLocaleDateString('pt-BR')):'SEM COLETA'}</h3><em class="metric-partial-status ${pending?'partial':'complete'}">${status}</em></div><div><small>PICO</small><b>${peak??'—'}</b></div><div><small>MÉDIA PARCIAL</small><b>${avg===null?'—':avg.toFixed(1)}</b></div></header><div class="metric-hour-grid">${hours.map(h=>`<div class="metric-hour-cell ${day&&Number.isFinite(day.slots[h])?'collected':'waiting'}"><span>${h.replace('H',':00')}</span><b>${day&&Number.isFinite(day.slots[h])?day.slots[h]:'—'}</b><small>${day&&Number.isFinite(day.slots[h])?'ONLINE':'AGUARDANDO COLETA'}</small></div>`).join('')}</div></section>`}
function metricWeekSvg(days=[]){const hours=['14H','16H','21H','23H'],all=days.flatMap(d=>hours.map(h=>d.slots[h]).filter(Number.isFinite)),max=Math.max(1,...all);
const W=920,H=280,padTop=28,padBottom=54,padLeft=38,padRight=18,plotW=W-padLeft-padRight,plotH=H-padTop-padBottom,x=i=>padLeft+(i/(Math.max(1,days.length-1)))*plotW,y=v=>padTop+plotH-(v/max)*plotH;
const lines=hours.map((h,idx)=>{const pts=days.map((d,i)=>Number.isFinite(d.slots[h])?`${x(i).toFixed(1)},${y(d.slots[h]).toFixed(1)}`:null);let segs=[],cur=[];pts.forEach(p=>{if(p)cur.push(p);else if(cur.length){segs.push(cur);cur=[]}});if(cur.length)segs.push(cur);return `<g class="metric-line line-${idx}">${segs.map(s=>s.length>1?`<polyline points="${s.join(' ')}"/>`:'').join('')}${days.map((d,i)=>Number.isFinite(d.slots[h])?`<circle cx="${x(i).toFixed(1)}" cy="${y(d.slots[h]).toFixed(1)}" r="4"><title>${metricFmtDay(d.date)} • ${h} • ${d.slots[h]} online</title></circle>`:'').join('')}</g>`}).join('');
const grid=[0,.25,.5,.75,1].map(t=>`<line x1="${padLeft}" x2="${W-padRight}" y1="${y(max*t)}" y2="${y(max*t)}" class="metric-grid-line"/><text x="${padLeft-7}" y="${y(max*t)+4}" text-anchor="end" class="metric-axis-text">${Math.round(max*t)}</text>`).join('');
const labels=days.map((d,i)=>`<g class="metric-x-day" data-metric-day="${d.key}"><line x1="${x(i)}" x2="${x(i)}" y1="${padTop}" y2="${padTop+plotH}" class="metric-day-guide"/><text x="${x(i)}" y="${H-25}" text-anchor="middle" class="metric-x-label">${metricFmtDay(d.date)}</text></g>`).join('');
return `<svg class="metric-week-svg" viewBox="0 0 ${W} ${H}" role="img">${grid}${labels}${lines}</svg>`}
let metricWeekOffset=0;
function renderMetricIntelligence(rows=[],raw=[],seg=''){
 const daily=$('#metricDailyIntel'),
weekly=$('#metricWeeklyIntel');
if(!daily||!weekly)return;
const days=metricAggregateDays(raw),
title=metricScopeTitle(rows,seg),
today=new Date(),
todayKey=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`,
todayDay=days.find(d=>d.key===todayKey)||{key:todayKey,
date:new Date(today.getFullYear(),today.getMonth(),today.getDate()),
slots:{},
groups:{}};
daily.innerHTML=metricDailyCard(todayDay,title);

 // A semana exibida é sempre relativa à semana atual. Assim o dia de hoje
 // já aparece como "aguardando coleta" antes do primeiro horário e recebe os
 // pontos assim que 14H/16H/21H/23H entram no cache.
 const weekAnchor=new Date(today.getFullYear(),today.getMonth(),today.getDate());
 weekAnchor.setDate(weekAnchor.getDate()+(metricWeekOffset*7));
 const wb=metricWeekBounds(weekAnchor);
const week=[];
for(let i=0;i<7;i++){const d=new Date(wb.start);
d.setDate(wb.start.getDate()+i);
const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
week.push(days.find(x=>x.key===k)||{key:k,
date:d,
slots:{},
groups:{}})};
const hours=['14H',
'16H',
'21H',
'23H'];
weekly.innerHTML=`<section class="metric-week-card"><header><div><span>SEMANA • ${esc(title)}</span><h3>${wb.start.toLocaleDateString('pt-BR')} — ${wb.end.toLocaleDateString('pt-BR')}</h3></div><div class="metric-week-legend">${hours.map((h,i)=>`<span class="l-${i}"><i></i>${h}</span>`).join('')}</div></header><div class="metric-week-nav"><button type="button" data-week-nav="-1">‹ SEMANA ANTERIOR</button><button type="button" data-week-current ${metricWeekOffset===0?'disabled':''}>SEMANA ATUAL</button><button type="button" data-week-nav="1" ${metricWeekOffset>=0?'disabled':''}>PRÓXIMA ›</button></div>${metricWeekSvg(week)}</section>`;

weekly.querySelectorAll('[data-week-nav]').forEach(b=>b.onclick=()=>{metricWeekOffset+=Number(b.dataset.weekNav||0);if(metricWeekOffset>0)metricWeekOffset=0;renderMetricIntelligence(rows,raw,seg)});
weekly.querySelector('[data-week-current]')?.addEventListener('click',()=>{metricWeekOffset=0;renderMetricIntelligence(rows,raw,seg)})
}
function metricDailyReportText(){const seg=$('#metricSegment')?.value||'',
scope=metricCurrentScope(),
rows=metricSummaryRows().filter(x=>(!seg||x.f.segmento===seg)&&(!scope||x.f.group===scope)),
keys=new Set(rows.map(x=>alvesNorm(x.f.group))),
raw=activeMetricRows().filter(r=>keys.has(alvesNorm(r.group||r.organizacao||r.faccao))),
days=metricAggregateDays(raw),
day=days.at(-1);
if(!day)return 'Sem métricas para o recorte atual.';
const hours=['14H',
'16H',
'21H',
'23H'];
let txt=`HIGH OS • RELATÓRIO DIÁRIO\n${metricScopeTitle(rows,seg)}\n${day.date.toLocaleDateString('pt-BR')}\n\n`;
hours.forEach(h=>txt+=`${h.replace('H',':00')} - ${Number.isFinite(day.slots[h])?day.slots[h]+' ONLINE':'NÃO COLETADO'}\n`);
const ranking=Object.entries(day.groups).map(([g,
slots])=>({g,
total:hours.reduce((s,h)=>s+(Number.isFinite(slots[h])?slots[h]:0),0),
latest:[...hours].reverse().find(h=>Number.isFinite(slots[h]))})).sort((a,b)=>b.total-a.total);
txt+='\nFACÇÕES / GROUPS\n'+ranking.map(x=>`${x.g} - ${x.latest?day.groups[x.g][x.latest]+' ('+x.latest+')':'—'}`).join('\n');
return txt}
function printMetricDailyReport(){const text=metricDailyReportText();
const w=window.open('','_blank','width=850,height=720');
if(!w)return alert('Pop-up bloqueado.');
w.document.write(`<pre style="font:14px/1.55 Arial;padding:28px;white-space:pre-wrap">${esc(text)}</pre><script>window.onload=()=>window.print()<\/script>`);
w.document.close()}

function renderMetricExecutiveVisuals(rows,visibleRaw,seg){
 const box=$('#metricVisuals');
if(!box)return;
const pts=metricTimeline(visibleRaw),
daily=metricDailySummary(pts),
segs=metricSegmentSummary(activeMetricRows()),
peak=pts.reduce((a,p)=>!a||p.total>a.total?p:a,null),
avg=pts.length?pts.reduce((a,p)=>a+p.total,0)/pts.length:0;

 const maxSeg=Math.max(1,...segs.map(x=>x.avg));

 box.innerHTML=`<section class="metric-exec-chart metric-chart-card"><div class="metric-chart-head"><div><b>CONTINGENTE ${seg?'DO SEGMENTO '+esc(seg):'GERAL DO ILEGAL'}</b><span>MÉDIA DIÁRIA DO PERÍODO • 31 COLUNAS • ALTURA PROPORCIONAL AO CONTINGENTE</span></div><div class="metric-chart-mini"><strong>${avg.toFixed(1)}</strong><small>MÉDIA</small><strong>${peak?peak.total:'—'}</strong><small>PICO${peak?' • '+esc(peak.hour):''}</small></div></div>${metricDailyBars(daily)}<div class="metric-chart-hint">Cada coluna representa um dia. Passe o mouse para ver média, pico e horário do pico.</div></section>
 <section class="metric-chart-card metric-segment-card"><div class="metric-chart-head"><b>CONTINGENTE POR SEGMENTO</b><span>MÉDIA CONSOLIDADA DO PERÍODO</span></div><div class="metric-segment-bars">${segs.map(x=>`<div class="metric-segment-row"><span>${esc(x.segmento)}</span><div><i style="width:${Math.max(3,x.avg/maxSeg*100)}%"></i></div><b>${x.avg.toFixed(1)}</b><small>pico ${x.peak}</small></div>`).join('')}</div></section>
 <section class="metric-chart-card"><div class="metric-chart-head"><b>LEITURA DO RECORTE</b><span>${esc(metricActivePeriodLabel())}</span></div><div class="metric-quick-grid"><div><span>COLETAS</span><b>${pts.length}</b></div><div><span>DIAS</span><b>${daily.length}</b></div><div><span>GROUPS</span><b>${rows.length}</b></div><div><span>PICO GERAL</span><b>${peak?peak.total:'—'}</b><small>${peak?peak.date.toLocaleDateString('pt-BR')+' • '+peak.hour:'—'}</small></div></div></section>`;

}
function metricSortLabel(mode='peak'){return {peak:'PICO',
predominance:'PREDOMINÂNCIA',
dailyPeakAvg:'MÉDIA DIÁRIA DE PICO',
avg:'MÉDIA GERAL',
segment:'SEGMENTO',
name:'FACÇÃO / GROUP'}[mode]||'PICO'}
function metricMainSortValue(x,mode='peak'){
 if(mode==='peak')return String(x.a.peak.value);
if(mode==='predominance')return x.a.predominance.label;
if(mode==='dailyPeakAvg')return x.a.dailyPeakAvg.toFixed(1);
if(mode==='avg')return x.a.avg.toFixed(1);
if(mode==='segment')return x.f.segmento||'—';
if(mode==='name')return x.f.faccao||x.f.group;
return String(x.a.peak.value)
}
function renderMetricQuickRanking(rows=[],mode='peak'){
 const box=$('#metricQuickRanking');
if(!box)return;
if(!rows.length){box.innerHTML='';
return}const label=metricSortLabel(mode);

 box.innerHTML=`<div class="metric-quick-ranking-head"><b>CLASSIFICAÇÃO • ${esc(label)}</b><span>Clique em uma facção para abrir a análise individual</span></div><div class="metric-quick-ranking-list">${rows.map((x,i)=>`<button class="metric-quick-row" data-metric-group="${esc(x.f.group)}"><strong>#${i+1}</strong><div><b>${esc(x.f.faccao||x.f.group)}</b><small>${esc(x.f.group)} • ${esc(x.f.segmento||'—')}</small></div><span class="metric-main-value">${esc(metricMainSortValue(x,mode))}</span><span class="metric-hide-mobile">Pico <b>${x.a.peak.value}</b></span><span class="metric-hide-mobile">Pred. <b>${esc(x.a.predominance.label)}</b></span></button>`).join('')}</div>`;

}

/* =====================================================================
   HIGH OS V10.2 - BOLETIM SEMANAL AUTOMATICO
   ---------------------------------------------------------------------
   Monta o texto do boletim comparando os ultimos 7 dias fechados com os
   7 anteriores, usando a serie que ja esta carregada. Nao le nada novo
   do Firebase: trabalha sobre o mesmo array das outras abas.

   O texto sai pronto para o Discord, respeitando o limite de 2.000
   caracteres por mensagem - quando passa disso, e dividido em partes
   numeradas que podem ser copiadas uma a uma.
   ===================================================================== */
const BOLETIM_LIMITE_DISCORD=1900;   // folga sobre os 2.000 do Discord

function boletimDataBR(d){
 return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
}
function boletimParseData(txt){
 const m=String(txt||'').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
 return m?new Date(Number(m[3]),Number(m[2])-1,Number(m[1]),12,0,0):null;
}
function boletimTotalLinha(row){
 const sl=metricSlots(row);
 return ['14H','16H','21H','23H'].reduce((a,k)=>a+(Number(sl[k])||0),0);
}

/* Agrega por Group dentro de uma janela de datas. */
function boletimAgregar(inicio,fim){
 const mapa=new Map();
 for(const row of (metricas||[])){
  const d=boletimParseData(row.data);
  if(!d||d<inicio||d>fim)continue;
  const nome=String(row.group||row.organizacao||'').trim();
  if(!nome)continue;
  const chave=alvesNorm(nome).replace(/\s+/g,'');
  const atual=mapa.get(chave)||{nome,total:0,dias:new Set(),picos:0};
  const t=boletimTotalLinha(row);
  atual.total+=t;
  if(t>0)atual.dias.add(row.data);
  atual.picos=Math.max(atual.picos,t);
  mapa.set(chave,atual);
 }
 return mapa;
}

/* Ultimos 7 dias FECHADOS: o dia de hoje costuma estar incompleto. */
function boletimJanelas(){
 const hoje=new Date();hoje.setHours(12,0,0,0);
 const fimAtual=new Date(hoje);fimAtual.setDate(fimAtual.getDate()-1);
 const inicioAtual=new Date(fimAtual);inicioAtual.setDate(inicioAtual.getDate()-6);
 const fimAnterior=new Date(inicioAtual);fimAnterior.setDate(fimAnterior.getDate()-1);
 const inicioAnterior=new Date(fimAnterior);inicioAnterior.setDate(inicioAnterior.getDate()-6);
 return {inicioAtual,fimAtual,inicioAnterior,fimAnterior};
}

function boletimVariacao(atual,anterior){
 if(!anterior)return atual?Infinity:0;
 return ((atual-anterior)/anterior)*100;
}
function boletimPct(v){
 if(v===Infinity)return 'novo';
 const sinal=v>=0?'+':'';
 return `${sinal}${v.toFixed(0)}%`;
}

function boletimCalcular(){
 const j=boletimJanelas();
 const atual=boletimAgregar(j.inicioAtual,j.fimAtual);
 const anterior=boletimAgregar(j.inicioAnterior,j.fimAnterior);
 const linhas=[];
 const chaves=new Set([...atual.keys(),...anterior.keys()]);
 for(const k of chaves){
  const a=atual.get(k),b=anterior.get(k);
  linhas.push({
   nome:(a||b).nome,
   total:a?a.total:0,
   totalAnterior:b?b.total:0,
   dias:a?a.dias.size:0,
   pico:a?a.picos:0,
   variacao:boletimVariacao(a?a.total:0,b?b.total:0)
  });
 }
 const somaAtual=linhas.reduce((n,x)=>n+x.total,0);
 const somaAnterior=linhas.reduce((n,x)=>n+x.totalAnterior,0);
 return {janelas:j,linhas,somaAtual,somaAnterior,variacaoGeral:boletimVariacao(somaAtual,somaAnterior)};
}

function boletimTexto(){
 const r=boletimCalcular();
 if(!r.linhas.length)return 'Sem dados suficientes para o período. Sincronize as métricas antes de gerar o boletim.';
 const j=r.janelas;
 const ativos=r.linhas.filter(x=>x.total>0);
 const semColeta=r.linhas.filter(x=>x.total===0&&x.totalAnterior>0).sort((a,b)=>b.totalAnterior-a.totalAnterior);
 const subiram=ativos.filter(x=>x.totalAnterior>0&&x.variacao>=15).sort((a,b)=>b.variacao-a.variacao).slice(0,5);
 const cairam=ativos.filter(x=>x.totalAnterior>0&&x.variacao<=-15).sort((a,b)=>a.variacao-b.variacao).slice(0,5);
 const novos=r.linhas.filter(x=>x.totalAnterior===0&&x.total>0).sort((a,b)=>b.total-a.total).slice(0,5);
 const top=ativos.slice().sort((a,b)=>b.total-a.total).slice(0,10);
 const irregulares=ativos.filter(x=>x.dias<=3).sort((a,b)=>a.dias-b.dias).slice(0,5);

 const L=[];
 L.push(`**BOLETIM SEMANAL DO ILEGAL**`);
 L.push(`Período: ${boletimDataBR(j.inicioAtual)} a ${boletimDataBR(j.fimAtual)} • comparado com ${boletimDataBR(j.inicioAnterior)} a ${boletimDataBR(j.fimAnterior)}`);
 L.push('');
 L.push(`**MOVIMENTO GERAL**`);
 L.push(`Total da semana: **${r.somaAtual.toLocaleString('pt-BR')}** (${boletimPct(r.variacaoGeral)} sobre a semana anterior)`);
 L.push(`Organizações com coleta: **${ativos.length}** de ${r.linhas.length}`);
 L.push('');
 if(top.length){
  L.push(`**MAIORES VOLUMES**`);
  top.forEach((x,i)=>L.push(`${String(i+1).padStart(2,'0')}. ${x.nome} — ${x.total.toLocaleString('pt-BR')} (${boletimPct(x.variacao)})`));
  L.push('');
 }
 if(subiram.length){
  L.push(`**EM ALTA**`);
  subiram.forEach(x=>L.push(`• ${x.nome} — ${boletimPct(x.variacao)} (${x.totalAnterior.toLocaleString('pt-BR')} → ${x.total.toLocaleString('pt-BR')})`));
  L.push('');
 }
 if(cairam.length){
  L.push(`**EM QUEDA — MERECE OLHAR**`);
  cairam.forEach(x=>L.push(`• ${x.nome} — ${boletimPct(x.variacao)} (${x.totalAnterior.toLocaleString('pt-BR')} → ${x.total.toLocaleString('pt-BR')})`));
  L.push('');
 }
 if(semColeta.length){
  L.push(`**PARARAM DE COLETAR**`);
  semColeta.slice(0,8).forEach(x=>L.push(`• ${x.nome} — tinha ${x.totalAnterior.toLocaleString('pt-BR')} na semana anterior, zerou`));
  if(semColeta.length>8)L.push(`• e mais ${semColeta.length-8} organização(ões)`);
  L.push('');
 }
 if(irregulares.length){
  L.push(`**PRESENÇA IRREGULAR**`);
  irregulares.forEach(x=>L.push(`• ${x.nome} — coleta em apenas ${x.dias} dia(s) dos 7`));
  L.push('');
 }
 if(novos.length){
  L.push(`**ESTREANTES**`);
  novos.forEach(x=>L.push(`• ${x.nome} — ${x.total.toLocaleString('pt-BR')} na primeira semana`));
  L.push('');
 }
 L.push(`_Gerado pelo High OS em ${new Date().toLocaleString('pt-BR')}_`);
 return L.join('\n');
}

/* Divide respeitando o limite do Discord, sem cortar linha no meio. */
function boletimPartes(texto){
 const linhas=texto.split('\n'),partes=[];
 let atual='';
 for(const l of linhas){
  if((atual+l+'\n').length>BOLETIM_LIMITE_DISCORD&&atual){partes.push(atual.trimEnd());atual=''}
  atual+=l+'\n';
 }
 if(atual.trim())partes.push(atual.trimEnd());
 return partes.length>1
  ? partes.map((p,i)=>`${p}\n\n_(parte ${i+1} de ${partes.length})_`)
  : partes;
}

function renderBoletim(){
 const box=document.getElementById('metricViewBoletim');
 if(!box)return;
 const texto=boletimTexto();
 const partes=boletimPartes(texto);
 box.innerHTML=`
  <div class="boletim-head">
   <div>
    <b>BOLETIM SEMANAL</b>
    <span>Últimos 7 dias fechados contra os 7 anteriores. ${partes.length>1?`${partes.length} partes para o Discord.`:`${texto.length} caracteres — cabe em uma mensagem.`}</span>
   </div>
   <div class="boletim-acoes">
    <button type="button" id="boletimGerar">ATUALIZAR</button>
    <button type="button" id="boletimCopiar" class="primary">COPIAR TUDO</button>
   </div>
  </div>
  <div class="boletim-partes">
   ${partes.map((p,i)=>`
    <div class="boletim-parte">
     <div class="boletim-parte-top">
      <span>${partes.length>1?`PARTE ${i+1} DE ${partes.length}`:'MENSAGEM ÚNICA'} • ${p.length} caracteres</span>
      <button type="button" data-boletim-parte="${i}">COPIAR</button>
     </div>
     <pre>${esc(p)}</pre>
    </div>`).join('')}
  </div>`;
 document.getElementById('boletimGerar')?.addEventListener('click',renderBoletim);
 document.getElementById('boletimCopiar')?.addEventListener('click',async()=>{
  await copyText(texto);
  window.highToast?.('Boletim copiado.','ok');
 });
 box.querySelectorAll('[data-boletim-parte]').forEach(b=>b.addEventListener('click',async()=>{
  await copyText(partes[Number(b.dataset.boletimParte)]);
  window.highToast?.(`Parte ${Number(b.dataset.boletimParte)+1} copiada.`,'ok');
 }));
}

function renderMetrics(err=null){
 const box=$('#metricRanking');
if(err instanceof Event)err=null;

 const q=alvesNorm($('#metricSearch')?.value||''),
seg=$('#metricSegment')?.value||'';

 const scope=metricCurrentScope(),
sortMode=$('#metricSortMode')?.value||'peak';
let rows=metricSummaryRows().filter(x=>(!seg||x.f.segmento===seg)&&(!scope||x.f.group===scope)&&(!q||alvesNorm([x.f.group,
x.f.faccao,
x.f.qg].join(' ')).includes(q)));
rows=metricSortRows(rows,sortMode);

 const active=activeMetricRows(),
groupsWith=new Set(active.map(m=>alvesNorm(m.group||m.organizacao||m.faccao))).size;

 const groupKeys=new Set(rows.map(x=>alvesNorm(x.f.group))),
visibleRaw=active.filter(m=>groupKeys.has(alvesNorm(m.group||m.organizacao||m.faccao)));

 const slotTotals=Object.fromEntries(metricSlotKeys(visibleRaw).map(h=>[h,
[]]));
visibleRaw.forEach(r=>{const sl=metricSlots(r);Object.entries(sl).forEach(([h,
v])=>{if(!slotTotals[h])slotTotals[h]=[];slotTotals[h].push(v)})});

 const hourAvgs=Object.fromEntries(Object.entries(slotTotals).map(([h,
a])=>[h,
a.length?a.reduce((x,y)=>x+y,0)/a.length:0]));

 const allValues=visibleRaw.flatMap(r=>Object.values(metricSlots(r))),
overall=allValues.length?allValues.reduce((a,b)=>a+b,0)/allValues.length:0;

 const top=rows[0]||null,
peak=rows.reduce((best,x)=>!best||x.a.peak.value>best.a.peak.value?x:best,null);
const pred=Object.entries(hourAvgs).sort((a,b)=>b[1]-a[1])[0]||['—',
0];

 const selected=scope?rows[0]:null;
const generalPred=metricPredominanceRange(allValues),
dailyPeaksAll=visibleRaw.map(r=>{const v=Object.values(metricSlots(r)).filter(Number.isFinite);return v.length?Math.max(...v):null}).filter(Number.isFinite),
dailyPeakOverall=dailyPeaksAll.length?dailyPeaksAll.reduce((a,b)=>a+b,0)/dailyPeaksAll.length:0;
if($('#metricOverview'))$('#metricOverview').innerHTML=selected?`<article class="metric-hero-kpi"><span>FACÇÃO / GROUP</span><b>${esc(selected.f.faccao||selected.f.group)}</b><small>${esc(selected.f.group)} • ${esc(selected.f.segmento||'—')}</small></article><article class="metric-hero-kpi"><span>PICO</span><b>${selected.a.peak.value}</b><small>${esc(selected.a.peak.hour)} • ${esc(selected.a.peak.date)}</small></article><article class="metric-hero-kpi metric-predominance-card"><span>PREDOMINÂNCIA</span><b>${esc(selected.a.predominance.label)}</b><small>${selected.a.predominance.share.toFixed(0)}% das medições</small></article><article class="metric-hero-kpi"><span>MÉDIA DIÁRIA DE PICO</span><b>${selected.a.dailyPeakAvg.toFixed(1)}</b><small>média geral ${selected.a.avg.toFixed(1)} • melhor ${esc(selected.a.strongestHour)}</small></article>`:`<article class="metric-hero-kpi"><span>VISÃO GERAL</span><b>${rows.length}</b><small>facções / Groups no recorte</small></article><article class="metric-hero-kpi"><span>MAIOR PICO</span><b>${peak?peak.a.peak.value:'—'}</b><small>${peak?`${esc(peak.f.group)} • ${esc(peak.a.peak.hour)}`:'sem dados'}</small></article><article class="metric-hero-kpi metric-predominance-card"><span>PREDOMINÂNCIA GERAL</span><b>${esc(generalPred.label)}</b><small>${generalPred.share.toFixed(0)}% das medições</small></article><article class="metric-hero-kpi"><span>MÉDIA DIÁRIA DE PICO</span><b>${dailyPeakOverall.toFixed(1)}</b><small>média geral ${overall.toFixed(1)} • horário forte ${esc(pred[0])}</small></article>`;

 $('#metricStats').innerHTML=`<span><b>${esc(metricActivePeriodLabel())}</b> COMPETÊNCIA</span><span><b>${esc(metricPeriodRange(active))}</b> PERÍODO</span><span><b>${active.length}</b> DIAS / REGISTROS</span><span><b>${groupsWith}</b> GROUPS COM DADOS</span><span><b>${rows.length}</b> EXIBIDOS</span>${seg?`<span>SEGMENTO <b>${esc(seg)}</b></span>`:''}`;
 /* V14.1: coleta de hoje — parcial em vez de parecer zero/média baixa */
 {const hoje=new Date(),hk=hoje.toDateString(),doDia=visibleRaw.filter(r=>metricDateValue(r)?.toDateString?.()===hk);
  if(doDia.length){const uni={};doDia.forEach(r=>Object.assign(uni,metricSlots(r)));const c=coletaDoDia(uni,hoje,hoje);
   $('#metricStats').insertAdjacentHTML('beforeend',`<span class="${c.parcial?'metric-parcial-chip':''}"><b>HOJE ${c.feitas}/${c.esperadas}</b> ${c.parcial?esc(rotuloColeta(c)):'COLETAS COMPLETAS'}</span>`)}}
 {const ex=metricas.filter(r=>r.__exFaccao&&metricMonthKey(r)===(metricPeriodKey||currentMetricMonthKey())).length;if(ex)$('#metricStats').insertAdjacentHTML('beforeend',`<span title="Coletas de facções que já saíram aparecem como linha própria (Group • Facção), separadas da ocupante atual"><b>${ex}</b> REGISTROS DE FACÇÕES QUE SAÍRAM (separados)</span>`)}

 const maxHour=Math.max(1,...Object.values(hourAvgs)),
top5=rows.slice(0,5),
maxTop=Math.max(1,...top5.map(x=>x.a.avg));

 const advanced=rows.map(x=>({...x,
adv:metricAdvancedStats(x.f.group)})).filter(x=>x.adv);

 const rising=[...advanced].filter(x=>x.adv.trend>0).sort((a,b)=>b.adv.trend-a.adv.trend).slice(0,4);

 const falling=[...advanced].filter(x=>x.adv.trend<0).sort((a,b)=>a.adv.trend-b.adv.trend).slice(0,4);

 const attention=[...advanced].filter(x=>x.adv.alerts.length).sort((a,b)=>a.adv.trend-b.adv.trend).slice(0,5);

 const movement=(list,empty)=>list.length?list.map(x=>`<div class="metric-move-row"><div><b>${esc(x.f.faccao||x.f.group)}</b><small>${esc(x.f.group)} • média ${x.a.avg.toFixed(1)}</small></div><strong>${x.adv.trend>=0?'+':''}${x.adv.trend.toFixed(0)}%</strong></div>`).join(''):`<div class="muted">${empty}</div>`;

 renderMetricIntelligence(rows,visibleRaw,seg);

 renderMetricExecutiveVisuals(rows,visibleRaw,seg);

 if(err){
  if($('#metricOverview'))$('#metricOverview').innerHTML=`<div class="placeholder"><h3>ERRO AO CARREGAR</h3><p>${esc(err.message||String(err))}</p></div>`;

  if($('#metricStats'))$('#metricStats').innerHTML='';

  if($('#metricVisuals'))$('#metricVisuals').innerHTML='';
if($('#metricQuickRanking'))$('#metricQuickRanking').innerHTML='';

  return
 }
 if(!rows.length){
  if($('#metricOverview'))$('#metricOverview').innerHTML=`<div class="placeholder"><b>▥</b><h3>SEM MÉTRICAS EM ${esc(metricPeriodLabel(metricPeriodKey).toUpperCase())}</h3><p>Não há dados para os filtros atuais. O High OS não mistura competências.</p></div>`;

  if($('#metricStats'))$('#metricStats').innerHTML='';

  if($('#metricVisuals'))$('#metricVisuals').innerHTML='';
if($('#metricQuickRanking'))$('#metricQuickRanking').innerHTML='';

  syncMetricSelectors();
renderMetricFactionDetail();
if($('#metricViewRanking')?.classList.contains('active'))renderMetricAdvancedRanking();
return
 }
 // V8.4: a classificação rápida também fica na Visão Geral e respeita o critério escolhido.
 if(box)box.innerHTML='';

 renderMetricQuickRanking(rows,sortMode);

 syncMetricSelectors();
renderMetricFactionDetail();
if($('#metricViewRanking')?.classList.contains('active'))renderMetricAdvancedRanking();
if($('#metricViewComparatives')?.classList.contains('active')){syncMetricCompareSelectors();
renderMetricComparison()}
}
function metricAdvancedStats(group){
 const a=metricAnalysis(group);
if(!a)return null;
const dayAvgs=a.rows.map(metricDayAverage),
slots=Object.fromEntries(metricSlotKeys(a.rows).map(h=>[h,
[]]));
a.rows.forEach(r=>{const x=metricSlots(r);Object.keys(x).forEach(h=>{if(!slots[h])slots[h]=[];slots[h].push(Number(x[h])||0)})});

 const hourAvg=Object.fromEntries(Object.entries(slots).map(([h,
v])=>[h,
v.length?v.reduce((x,y)=>x+y,0)/v.length:0]));

 const threshold=a.avg*.8,
regularDays=dayAvgs.filter(v=>v>=threshold).length,
regularity=dayAvgs.length?regularDays/dayAvgs.length*100:0;

 const recent=dayAvgs.slice(-5),
prior=dayAvgs.slice(-10,-5),
av=v=>v.length?v.reduce((x,y)=>x+y,0)/v.length:0;
const recentAvg=av(recent),
priorAvg=av(prior);
const trend=priorAvg?((recentAvg-priorAvg)/priorAvg*100):0;

 const alerts=[];
if(prior.length>=3&&trend<=-20)alerts.push(`⚠ Queda de ${Math.abs(trend).toFixed(0)}% na média dos últimos dias.`);
if(prior.length>=3&&trend>=15)alerts.push(`▲ Crescimento de ${trend.toFixed(0)}% na média dos últimos dias.`);

 const weak=Object.entries(hourAvg).sort((x,y)=>x[1]-y[1])[0],
strong=Object.entries(hourAvg).sort((x,y)=>y[1]-x[1])[0];
if(weak&&strong&&strong[1]>0&&weak[1]<strong[1]*.7)alerts.push(`⚠ ${weak[0]} está ${((1-weak[1]/strong[1])*100).toFixed(0)}% abaixo do horário mais forte (${strong[0]}).`);

 return {...a,
hourAvg,
regularity,
trend,
recentAvg,
priorAvg,
alerts};

}
function renderMetricAdvancedRanking(){
 const box=$('#metricAdvancedRanking');
if(!box)return;
const mode=$('#metricRankingMode')?.value||'peak',
seg=$('#metricSegment')?.value||'',
scope=metricCurrentScope();
let rows=metricSummaryRows().filter(x=>(!seg||x.f.segmento===seg)&&(!scope||x.f.group===scope)).map(x=>({...x,
x:metricAdvancedStats(x.f.group)})).filter(x=>x.x);

 rows=metricSortRows(rows.map(r=>({...r,
a:r.x})),mode).map(r=>({...r,
x:r.a}));
if(mode==='regularity')rows.sort((a,b)=>b.x.regularity-a.x.regularity);

 const label={peak:'PICO',
predominance:'PREDOMINÂNCIA',
dailyPeakAvg:'MÉDIA PICO/DIA',
avg:'MÉDIA GERAL',
segment:'SEGMENTO',
name:'FACÇÃO / GROUP',
regularity:'REGULARIDADE'}[mode]||'CLASSIFICAÇÃO';

 box.innerHTML=rows.length?`<div class="rh-ranking-row"><b>#</b><b>FACÇÃO / GROUP</b><span>${label}</span><span class="rh-extra">PICO</span><span class="rh-extra">PREDOM.</span><span class="rh-extra">MÉDIA PICO/DIA</span></div>${rows.map((r,i)=>{const main=mode==='peak'?r.x.peak.value:mode==='predominance'?r.x.predominance.label:mode==='dailyPeakAvg'?r.x.dailyPeakAvg.toFixed(1):mode==='avg'?r.x.avg.toFixed(1):mode==='segment'?r.f.segmento||'—':mode==='name'?r.f.faccao||r.f.group:r.x.regularity.toFixed(0)+'%';return `<div class="rh-ranking-row"><b>${i+1}</b><div><strong>${esc(r.f.faccao||r.f.group)}</strong><small style="display:block">${esc(r.f.group)} • ${esc(r.f.segmento||'—')}</small></div><span><b>${esc(main)}</b></span><span class="rh-extra">${r.x.peak.value}</span><span class="rh-extra metric-rank-pred"><b>${esc(r.x.predominance.label)}</b><small>${r.x.predominance.share.toFixed(0)}%</small></span><span class="rh-extra">${r.x.dailyPeakAvg.toFixed(1)}</span></div>`}).join('')}`:'<div class="placeholder"><h3>SEM DADOS</h3></div>';

}
function syncMetricCompareSelectors(){const rows=metricSummaryRows(),
opts=rows.map(x=>`<option value="${esc(x.f.group)}">${esc(x.f.faccao||x.f.group)} • ${esc(x.f.group)}</option>`).join('');
const a=$('#metricCompareA'),
b=$('#metricCompareB');
if(a&&!a.options.length)a.innerHTML=opts;
if(b&&!b.options.length){b.innerHTML=opts;
if(b.options.length>1)b.selectedIndex=1}}
function renderMetricComparison(){
 const ga=$('#metricCompareA')?.value,
gb=$('#metricCompareB')?.value,
box=$('#metricCompareResult');
if(!box||!ga||!gb)return;
const a=metricAdvancedStats(ga),
b=metricAdvancedStats(gb);
if(!a||!b){box.innerHTML='<div class="placeholder"><h3>SEM DADOS PARA COMPARAR</h3></div>';
return}const ia=metricIdentity(ga,a.rows[0]),
ib=metricIdentity(gb,b.rows[0]);

 const rows=[['Média mensal',
a.avg.toFixed(2),
b.avg.toFixed(2)],
['Pico',
a.peak.value,
b.peak.value],
['Regularidade',
a.regularity.toFixed(0)+'%',
b.regularity.toFixed(0)+'%'],
['Tendência últimos dias',
(a.trend>=0?'+':'')+a.trend.toFixed(0)+'%',
(b.trend>=0?'+':'')+b.trend.toFixed(0)+'%'],
...['14H',
'16H',
'21H',
'23H'].map(h=>['Média '+h,
Number.isFinite(a.hourAvg[h])?a.hourAvg[h].toFixed(2):'—',
Number.isFinite(b.hourAvg[h])?b.hourAvg[h].toFixed(2):'—'])];

 box.innerHTML=`<div class="rh-grid"><div class="rh-card"><span>FACÇÃO A</span><b>${esc(ia.faccao||ga)}</b><small>${esc(ga)}</small></div><div class="rh-card"><span>FACÇÃO B</span><b>${esc(ib.faccao||gb)}</b><small>${esc(gb)}</small></div><div class="rh-card"><span>DIFERENÇA DE MÉDIA</span><b>${Math.abs(a.avg-b.avg).toFixed(2)}</b><small>${a.avg>=b.avg?esc(ia.faccao||ga):esc(ib.faccao||gb)} à frente</small></div><div class="rh-card"><span>COMPETÊNCIA</span><b>${esc(metricActivePeriodLabel())}</b></div></div><table class="rh-compare-table"><thead><tr><th>INDICADOR</th><th>${esc(ia.faccao||ga)}</th><th>${esc(ib.faccao||gb)}</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r[0]}</td><td><b>${r[1]}</b></td><td><b>${r[2]}</b></td></tr>`).join('')}</tbody></table>`;

}
function renderRhFactionInsights(group){const sum=$('#metricFactionSummary');
if(!sum||!group)return;
const x=metricAdvancedStats(group);
if(!x)return;
const extra=document.createElement('div');
extra.className='rh-insights';
extra.innerHTML=`<div class="rh-grid"><div class="rh-card"><span>PREDOMINÂNCIA GERAL</span><b>${esc(x.predominance.label)}</b><small>${x.predominance.share.toFixed(0)}% das medições</small></div><div class="rh-card"><span>PREDOMINÂNCIA NOTURNA</span><b>${esc(x.nightPredominance.label)}</b><small>21H em diante</small></div>${Object.entries(x.hourAvg).map(([h,v])=>`<div class="rh-card"><span>MÉDIA ${h}</span><b>${v.toFixed(1)}</b></div>`).join('')}<div class="rh-card"><span>REGULARIDADE</span><b>${x.regularity.toFixed(0)}%</b><small>dias ≥ 80% da média geral</small></div><div class="rh-card"><span>TENDÊNCIA</span><b>${x.trend>=0?'+':''}${x.trend.toFixed(0)}%</b><small>últimos 5 dias vs. 5 anteriores</small></div></div>${x.alerts.length?`<div>${x.alerts.map(a=>`<div class="rh-alert">${esc(a)}</div>`).join('')}</div>`:'<div class="rh-alert">Sem alertas estatísticos relevantes no período.</div>'}`;
sum.after(extra)}

const _renderMetricFactionDetailBase=renderMetricFactionDetail;

renderMetricFactionDetail=function(group=metricSelectedGroup()){document.querySelector('.rh-insights')?.remove();
_renderMetricFactionDetailBase(group);
renderRhFactionInsights(group)};

function switchMetricCenterView(view='overview'){
 document.querySelectorAll('.metric-center-tab').forEach(b=>b.classList.toggle('active',b.dataset.metricView===view));
 if(view==='boletim')setTimeout(renderBoletim,0);
document.querySelectorAll('.metric-center-view').forEach(v=>v.classList.toggle('active',v.id===`metricView${view[0].toUpperCase()+view.slice(1)}`));
if(view==='faction')renderMetricFactionDetail();
if(view==='ranking')renderMetricAdvancedRanking();
if(view==='comparatives'){syncMetricCompareSelectors();
renderMetricComparison()}if(view==='reports')syncMetricSelectors();
if(view==='management')renderIllegalManagement();

}
document.querySelectorAll('.metric-center-tab').forEach(b=>b.addEventListener('click',()=>switchMetricCenterView(b.dataset.metricView)));

$('#metricRankingMode')?.addEventListener('change',renderMetricAdvancedRanking);

$('#metricScopeSelect')?.addEventListener('change',e=>{const g=e.target.value||'';renderMetrics();if(g){if($('#metricFactionSelect'))$('#metricFactionSelect').value=g;renderMetricFactionDetail(g)}});

$('#metricSortMode')?.addEventListener('change',()=>{renderMetrics();if($('#metricViewRanking')?.classList.contains('active')){const m=$('#metricSortMode')?.value;if($('#metricRankingMode')&&[...$('#metricRankingMode').options].some(o=>o.value===m))$('#metricRankingMode').value=m;renderMetricAdvancedRanking()}});

$('#metricCompareBtn')?.addEventListener('click',renderMetricComparison);

$('#metricCompareA')?.addEventListener('change',renderMetricComparison);

$('#metricCompareB')?.addEventListener('change',renderMetricComparison);

document.addEventListener('click',e=>{const row=e.target.closest?.('[data-metric-group]');if(!row)return;const g=row.dataset.metricGroup;if($('#metricScopeSelect'))$('#metricScopeSelect').value=g;renderMetrics();if($('#metricFactionSelect'))$('#metricFactionSelect').value=g;switchMetricCenterView('faction');renderMetricFactionDetail(g)});

$('#metricFactionSelect')?.addEventListener('change',e=>renderMetricFactionDetail(e.target.value));

$('#metricOpenReportBtn')?.addEventListener('click',()=>{switchMetricCenterView('reports');if($('#metricReportGroup'))$('#metricReportGroup').value=$('#metricFactionSelect')?.value||'';renderMetricReport()});

$('#metricReportSegment')?.addEventListener('change',syncMetricSelectors);
$('#metricReportPreviewBtn')?.addEventListener('click',renderMetricReport);
$('#metricReportPrintBtn')?.addEventListener('click',printMetricReport);
$('#metricReportCsvBtn')?.addEventListener('click',downloadMetricCsv);

function parseMetricImport(text=''){
 const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
if(!lines.length)return [];

 const split=x=>x.includes('\t')?x.split('\t').map(v=>v.trim()):x.split(';').map(v=>v.trim());

 const first=split(lines[0]),
headerIsNamed=alvesNorm(first[0])==='group'&&alvesNorm(first[1])==='data';
let slots=[];
let start=0;

 if(headerIsNamed){slots=first.slice(2).map(normalizeMetricSlotKey);
start=1}
 else if(first.length>=6){slots=['14H',
'16H',
'21H',
'23H']}
 const out=[];

 for(let i=start;i<lines.length;i++){const p=split(lines[i]);
if(p.length<4)continue;
const group=p[0],
data=normalizeMetricDate(p[1])||p[1];
if(!group||!data)continue;

  if(headerIsNamed||p.length>4){const use=headerIsNamed?slots:(p.length===6?['14H',
'16H',
'21H',
'23H']:p.slice(2,-1).map(normalizeMetricSlotKey));
const obj={};
use.forEach((h,j)=>{if(!h)return;const n=parseMetricNumber(p[j+2]);if(n!==null)obj[h]=n});
if(Object.keys(obj).length)out.push({group,
data,
slots:obj})}
  else{const h=normalizeMetricSlotKey(p[2]),
n=parseMetricNumber(p[3]);
if(h&&n!==null)out.push({group,
data,
slots:{[h]:n}})}
 }
 const merged=new Map();
out.forEach(r=>{const k=alvesNorm(r.group).replace(/\s+/g,'')+'|'+r.data;if(!merged.has(k))merged.set(k,{group:r.group,
data:r.data,
slots:{}});Object.assign(merged.get(k).slots,r.slots)});
return [...merged.values()];

}
async function saveMetricImport(){
 const rows=parseMetricImport($('#metricImportText')?.value||'');
if(!rows.length){alert('Nenhuma linha válida. Use um cabeçalho como: Group;Data;18:00;18:30;19:00;...');
return}
 try{const batch=writeBatch(db);
rows.forEach(r=>{const existing=metricas.find(x=>alvesNorm(x.group||'')===alvesNorm(r.group)&&normalizeMetricDate(x.data||x.date)===normalizeMetricDate(r.data));r={...r,
slots:{...metricSlots(existing||{}),
...r.slots}};r=metricSnapshot(r);const id=(r.group+'_'+r.data).replace(/[^a-zA-Z0-9_-]/g,'_');batch.set(doc(db,'highos','data','metricas',id),{...r,
updatedAt:serverTimestamp(),
updatedBy:currentUser.email},{merge:true})});
await batch.commit();
await addDoc(histCol,{sessionId:currentSessionId||'',
tipo:'IMPORTACAO_METRICAS',
descricao:`${rows.length} registro(s) importado(s) com horários flexíveis`,
usuario:currentUser.email,
data:serverTimestamp()});
$('#metricImportModal')?.classList.add('hidden');
$('#metricImportText').value='';
await loadMetrics();
alert(`${rows.length} registro(s) importado(s). Os horários adicionais foram preservados.`)}catch(e){alert('Erro ao importar métricas: '+e.message)}
}

$('#metricSearch')?.addEventListener('input',()=>renderMetrics());
$('#metricPeriod')?.addEventListener('change',e=>{metricDateStart='';metricDateEnd='';syncMetricDateInputs();metricPeriodKey=e.target.value||currentMetricMonthKey();renderMetrics();syncMetricSelectors()});

$('#metricApplyRange')?.addEventListener('click',()=>{metricDateStart=$('#metricDateStart')?.value||'';metricDateEnd=$('#metricDateEnd')?.value||'';if(metricDateStart&&metricDateEnd&&metricDateStart>metricDateEnd)return alert('A data inicial não pode ser maior que a data final.');renderMetrics();syncMetricSelectors();renderMetricFactionDetail();});

document.querySelectorAll('.metric-period-shortcuts button').forEach(btn=>btn.addEventListener('click',()=>{const now=new Date();let a=new Date(now.getFullYear(),now.getMonth(),now.getDate()),
b=new Date(a);if(btn.dataset.currentMonth)a=new Date(now.getFullYear(),now.getMonth(),1);else a.setDate(a.getDate()-(Number(btn.dataset.days)||1)+1);const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;metricDateStart=iso(a);metricDateEnd=iso(b);syncMetricDateInputs();renderMetrics();syncMetricSelectors();renderMetricFactionDetail()}));
$('#metricSegment')?.addEventListener('change',()=>{renderMetrics();if($('#metricViewRanking')?.classList.contains('active'))renderMetricAdvancedRanking()});
$('#metricReportPeriod')?.addEventListener('change',()=>{});
$('#openMetricImportBtn')?.addEventListener('click',()=>$('#metricImportModal')?.classList.remove('hidden'));
$('#metricImportClose')?.addEventListener('click',()=>$('#metricImportModal')?.classList.add('hidden'));
$('#metricImportModal')?.addEventListener('click',e=>{if(e.target.id==='metricImportModal')e.currentTarget.classList.add('hidden')});
$('#metricImportSave')?.addEventListener('click',saveMetricImport);

function openMetricSource(){
 const out=$('#metricSourceTestResult');

 if($('#metricSourceUrl'))$('#metricSourceUrl').value=metricSourceConfig.url||'';

 if($('#metricSourceSheet'))$('#metricSourceSheet').value=metricSourceConfig.sheet||'';

 if($('#metricPlanilhaAtiva'))$('#metricPlanilhaAtiva').checked=metricSourceConfig.planilhaAtiva===true;
 if($('#metricAutoSync')){$('#metricAutoSync').checked=true;
$('#metricAutoSync').disabled=true}
 if(out)out.innerHTML='<b>SINCRONIZAÇÃO GRATUITA VIA GOOGLE APPS SCRIPT</b><br>A planilha envia as métricas automaticamente ao Firestore às 14:05, 16:05, 21:05 e 23:05. Não usa Cloud Functions nem plano Blaze.';

 $('#metricSourceModal')?.classList.remove('hidden');

}
async function testMetricSource(){
 const out=$('#metricSourceTestResult');
if(out)out.textContent='Atualizando as métricas oficiais do Discord...';

 try{await loadMetrics();
if(out)out.innerHTML=`<b>CENTRAL ONLINE</b> • ${metricas.length} registro(s) disponíveis no Discord.`}catch(e){if(out)out.textContent='Falha: '+e.message}
}
/* V9.8.1 - Esta funcao havia desaparecido numa das edicoes anteriores do
   arquivo. Sem ela, loadMetrics() lancava ReferenceError e o painel inteiro
   caia na tela de ACESSO NAO AUTORIZADO, mesmo com o cadastro correto. */
let metricConfigReadAt=0;
const METRIC_CONFIG_TTL=10*60*1000;
async function loadMetricSourceConfig({force=false}={}){
 /* V10.11 - a configuração da fonte muda raramente. Evita uma leitura
    Firestore em cada passagem pelo fluxo de métricas. */
 if(!force&&metricConfigReadAt&&Date.now()-metricConfigReadAt<METRIC_CONFIG_TTL){
  renderMetricSourceStatus();
  return;
 }
 try{const _d=await highOsStoreGet('config','metricas').catch(()=>null);const s={exists:()=>!!_d,data:()=>_d||{}};
metricConfigReadAt=Date.now();
statBump('config_metricas','leituras');
statBump('config_metricas','docs',s.exists()?1:0);
if(s.exists())metricSourceConfig={...metricSourceConfig,
...s.data()}}catch(e){console.warn('[MÉTRICAS] config da fonte indisponível:',e?.code||e?.message||e)}
 renderMetricSourceStatus();

}

/* =====================================================================
   HIGH OS V9.8.1 - CAMADA DO GOOGLE SHEETS RESTAURADA
   ---------------------------------------------------------------------
   sheetsFetch, authorizeSheets, getSheetTitles, readMetricSheet e
   readMetricsDirect existiam na V9.5.6 e desapareceram durante as
   edicoes do parser. Sem elas, loadMetrics() lancava ReferenceError e
   derrubava o login inteiro para a tela de ACESSO NAO AUTORIZADO.
   Faixa de leitura ampliada de A1:ZZ300 para A1:ZZ800: a aba MÉTRICAS
   ja tem 606 linhas e os blocos novos ficariam de fora.
   ===================================================================== */
async function sheetsFetch(url,token){
 const r=await fetch(url,{headers:{Authorization:`Bearer ${token}`},
cache:'no-store'});
let payload={};
try{payload=await r.json()}catch(e){}
 if(!r.ok){const msg=payload?.error?.message||`Google Sheets API: HTTP ${r.status}`;
if(r.status===401)sheetsAccessToken='';
throw new Error(msg)}return payload;

}
async function authorizeSheets(){
 if(sheetsAccessToken)return sheetsAccessToken;
if(!currentUser)throw new Error('Entre no High OS antes de conectar a planilha.');

 sheetsProvider.setCustomParameters({prompt:'consent',
login_hint:currentUser.email||''});

 const before=(currentUser.email||'').toLowerCase();
const result=await signInWithPopup(auth,sheetsProvider);
const after=(result.user?.email||'').toLowerCase();

 if(before&&after&&before!==after)throw new Error('Autorize com a mesma conta Google usada no High OS.');

 const credential=GoogleAuthProvider.credentialFromResult(result);
const token=credential?.accessToken;
if(!token)throw new Error('O Google não retornou autorização para leitura da planilha.');
sheetsAccessToken=token;
return token;

}
async function getSheetTitles(spreadsheetId,token){
 const url=`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=sheets.properties(title,index)`;
const p=await sheetsFetch(url,token);
return (p.sheets||[]).sort((a,b)=>(a.properties?.index||0)-(b.properties?.index||0)).map(x=>x.properties?.title).filter(Boolean);

}
async function readMetricSheet(spreadsheetId,sheet,token){
 const range=`${a1SheetName(sheet)}!A1:ZZ800`;
const url=`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE`;
const p=await sheetsFetch(url,token);
return parseMetricSheet(p.values||[]);

}
async function readMetricsDirect({authorize=false,
urlOverride='',
sheetOverride=''}={}){
 const source=urlOverride||metricSourceConfig.url,
id=extractSpreadsheetId(source);
if(!id)throw new Error('Informe um link ou ID válido do Google Sheets.');

 let token=sheetsAccessToken;
if(!token&&authorize)token=await authorizeSheets();
if(!token)throw new Error('AUTORIZAÇÃO NECESSÁRIA');

 const requested=(sheetOverride||metricSourceConfig.sheet||'').trim();
if(requested){const rows=await readMetricSheet(id,requested,token);
if(!rows.length)throw new Error(`A aba “${requested}” foi lida, mas o formato de métricas não foi reconhecido.`);
return {rows,
sheet:requested}}
 const titles=await getSheetTitles(id,token);
let best={rows:[],
sheet:''};
for(const title of titles){try{const rows=await readMetricSheet(id,title,token);
if(rows.length>best.rows.length)best={rows,
sheet:title}}catch(e){}}
 if(!best.rows.length)throw new Error('Nenhuma aba com o padrão 14H / 16H / 21H / 23H foi encontrada.');
return best;

}
async function refreshMetricServerConfig(){
 await loadMetricSourceConfig({force:true});
}
function metricRowKey(r={}){return alvesNorm(String(r.group||r.organizacao||r.faccao||'')).replace(/\s+/g,'')+'|'+normalizeMetricDate(r.data||r.date)}
function metricLatestInfo(rows=[]){
 const valid=rows.filter(r=>normalizeMetricDate(r.data||r.date));
if(!valid.length)return {date:'—',
slot:'—'};

 valid.sort((a,b)=>metricDateValue(a)-metricDateValue(b));
const lastDate=normalizeMetricDate(valid.at(-1).data||valid.at(-1).date);

 const same=valid.filter(r=>normalizeMetricDate(r.data||r.date)===lastDate),
slots=[...new Set(same.flatMap(r=>Object.keys(metricSlots(r))))].sort((a,b)=>metricSlotMinutes(a)-metricSlotMinutes(b));

 return {date:lastDate,
slot:slots.at(-1)||'—'};

}
function compareMetricSources(sheetRows=[],fireRows=[]){
 const fire=new Map(fireRows.map(r=>[metricRowKey(r),
r]));
let newRows=0,
changedRows=0,
newSlots=0;

 for(const s of sheetRows){const f=fire.get(metricRowKey(s));
if(!f){newRows++;
newSlots+=Object.keys(metricSlots(s)).length;
continue}const fs=metricSlots(f),
ss=metricSlots(s);
let changed=false;
for(const [k,
v] of Object.entries(ss)){if(!(k in fs)||Number(fs[k])!==Number(v)){newSlots++;
changed=true}}if(changed)changedRows++}
 return {newRows,
changedRows,
newSlots,
pendingRows:newRows+changedRows};

}
function metricTimeout(promise,ms=15000,label='operação'){
 let timer;
return Promise.race([promise,
new Promise((_,rej)=>timer=setTimeout(()=>rej(new Error(`Tempo limite ao executar ${label}.`)),ms))]).finally(()=>clearTimeout(timer));

}
function parseCsvRows(text=''){
 const rows=[];
let row=[],
cell='',
q=false;

 for(let i=0;i<text.length;i++){const c=text[i];
if(q){if(c==='"'&&text[i+1]==='"'){cell+='"';
i++}else if(c==='"')q=false;
else cell+=c}else if(c==='"')q=true;
else if(c===','){row.push(cell);
cell=''}else if(c==='\n'){row.push(cell.replace(/\r$/,''));
rows.push(row);
row=[];
cell=''}else cell+=c}
 if(cell||row.length){row.push(cell.replace(/\r$/,''));
rows.push(row)}return rows;

}
async function readMetricsWithoutPopup(){
 const id=extractSpreadsheetId(metricSourceConfig.url);
if(!id)throw new Error('Fonte da planilha não configurada.');

 const sheet=(metricSourceConfig.sheet||'MÉTRICAS').trim();

 // Primeiro tenta a leitura pública/compartilhada. Não abre popup e não interfere no login do High OS.
 const csvUrl=isPublishedSheetUrl(metricSourceConfig.url)
   ? publishedCsvUrl(metricSourceConfig.url,sheet)
   : `https://docs.google.com/spreadsheets/d/${encodeURIComponent(id)}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}&_=${Date.now()}`;

 const controller=new AbortController(),
timer=setTimeout(()=>controller.abort(),12000);

 try{

  const r=await fetch(csvUrl,{cache:'no-store',
signal:controller.signal,
credentials:'omit'});

  if(!r.ok)throw new Error(`Planilha respondeu HTTP ${r.status}`);

  const text=await r.text();
const rows=parseMetricSheet(parseCsvRows(text));

  if(!rows.length)throw new Error(`A aba “${sheet}” não retornou métricas reconhecíveis.`);

  return {rows,
sheet};

 }finally{clearTimeout(timer)}
}
async function recoverMetricsAutomatically({quiet=true}={}){

 await refreshMetricServerConfig();

 /* V9.6 - antes lia a colecao inteira aqui e DE NOVO depois de gravar.
    Agora usa a copia que ja esta em memoria (carregada no loadMetrics). */
 let fireRows=metricasCache.slice();

 /* V10.54 - recuperação automática não pode disparar leitura da coleção
    histórica inteira. Se não houver dados em memória, compara com cache local
    ou parte de uma base vazia; a planilha continua sendo a fonte oficial. */
 if(!fireRows.length){
  const qs=cachedSnapshotOnly('metricas');
  if(qs){
   fireRows=qs.docs.map(d=>({id:d.id,...d.data()}));
   applyMetricSnapshot(qs);
  }
 }
 if(!extractSpreadsheetId(metricSourceConfig.url))return {ok:true,
source:'firestore',
diff:null};

 let result;

 try{result=await metricTimeout(readMetricsWithoutPopup(),15000,'leitura automática da planilha')}
 catch(e){
  // Se já houve autorização manual nesta sessão, usa o token existente sem abrir nova janela.
  if(sheetsAccessToken){console.warn('[MÉTRICAS AUTO] leitura sem popup falhou; tentando token já existente');
result=await metricTimeout(readMetricsDirect({authorize:false}),15000,'leitura autenticada da planilha')}
  else throw e;

 }
 const sheetRows=result.rows.map(metricSnapshot),
diff=compareMetricSources(sheetRows,fireRows),
fireLastBefore=metricLatestInfo(fireRows);

 if(!metricQuotaBlocked){
  // V10 - um documento por mes alterado, no lugar de um por linha
  await metricTimeout(salvarEspelhoMensal(sheetRows,result.sheet),25000,'gravação do espelho mensal');

 }
 /* V9.6 - nada de reler a colecao: a planilha ja e a versao mais nova,
    entao aplicamos localmente e economizamos N leituras por ciclo. */
 metricasCache=sheetRows.slice();

 metricas=metricasAtribuidas(sheetRows);

 metricPeriodKey=metricPeriodKey||currentMetricMonthKey();

 refreshMetricPeriodOptions();
renderMetrics();
renderMetricQuotaPanel();

 const sheetLast=metricLatestInfo(sheetRows),
fireLast=fireLastBefore;

 metricSourceState={...metricSourceState,
status:'ONLINE',
lastSync:Date.now(),
count:metricas.length,
activeCount:activeMetricRows().length,
error:'',
sheet:result.sheet,
directCheck:{sheetLast,
fireLast,
diff}};
renderMetricSourceStatus();

 return {ok:true,
source:'sheet',
diff,
sheetLast,
fireLast,
sheet:result.sheet};

}
let metricAutoRecoveryTimer=null,
metricAutoRecoveryBusy=false;

async function runMetricAutoRecovery({quiet=true}={}){
 if(metricAutoRecoveryBusy)return false;
metricAutoRecoveryBusy=true;

 try{return await recoverMetricsAutomatically({quiet})}catch(e){console.warn('[MÉTRICAS AUTO] planilha indisponível; mantendo dados locais/espelho:',e?.message||e);
metricSourceState={...metricSourceState,
error:''};
renderMetricSourceStatus();
return false}finally{metricAutoRecoveryBusy=false}
}
/* V9.6 - o ciclo rodava de 5 em 5 minutos EM CADA ABA ABERTA e ainda
   disparava a cada troca de aba do navegador. Tres abas abertas
   multiplicavam por tres o consumo. Agora: 30 minutos, trava
   compartilhada entre abas e nada de disparar por visibilidade. */
const METRIC_SYNC_INTERVALO=30*60*1000;

const METRIC_SYNC_LOCK='highos_metric_sync_at';

function podeSincronizarAgora(){
 if(metricQuotaBlocked)return false;

 try{
  const ultimo=Number(localStorage.getItem(METRIC_SYNC_LOCK)||0);

  if(Date.now()-ultimo<METRIC_SYNC_INTERVALO)return false;

  localStorage.setItem(METRIC_SYNC_LOCK,String(Date.now()));

  return true;

 }catch(e){return true}
}
function stopMetricAutoRecovery(){
 if(metricAutoRecoveryTimer){clearInterval(metricAutoRecoveryTimer);
metricAutoRecoveryTimer=null}
}
function startMetricAutoRecovery(){
 if(metricAutoRecoveryTimer)return;
 const activePage=document.querySelector('.page.active')?.id?.replace('page-','')||'';
 if(!['dashboard','metricas'].includes(activePage))return;

 if(!extractSpreadsheetId(metricSourceConfig.url))return;

 setTimeout(()=>{if(podeSincronizarAgora())runMetricAutoRecovery({quiet:true})},2500);

 metricAutoRecoveryTimer=setInterval(()=>{
  if(document.hidden)return;
  if(!podeSincronizarAgora())return;
  runMetricAutoRecovery({quiet:true});
 },METRIC_SYNC_INTERVALO);

}
async function requestServerMetricSync({quiet=false}={}){
 const btn=$('#syncMetricBtn'),old=btn?.textContent;
 if(btn){btn.disabled=true;btn.textContent='ATUALIZANDO...'}
 try{
  const result=await loadMetrics({force:true});
  if(!quiet)alert(`Central atualizada pelo Discord. ${Number(result?.rows?.length||metricas.length).toLocaleString('pt-BR')} registro(s) disponíveis.`);
  return true;
 }catch(e){
  console.warn('[MÉTRICAS] atualização manual via Discord falhou:',e);
  if(!quiet)alert('Não foi possível consultar o snapshot de métricas no Discord.\n\nDetalhe: '+(e.message||e));
  return false;
 }finally{if(btn){btn.disabled=false;btn.textContent=old||'ATUALIZAR CENTRAL'}}
}
async function saveMetricSource(){
 const cfg={...metricSourceConfig,planilhaAtiva:!!$('#metricPlanilhaAtiva')?.checked,url:$('#metricSourceUrl')?.value?.trim()||metricSourceConfig.url||'',sheet:$('#metricSourceSheet')?.value?.trim()||metricSourceConfig.sheet||'',autoSync:true,mode:'DISCORD_APPS_SCRIPT',schedule:'14:05,16:05,21:05,23:05',timeZone:'America/Sao_Paulo',updatedAt:new Date().toISOString(),updatedBy:currentUser.email};
 try{await highOsStorePut('config','metricas',cfg);metricSourceConfig={...metricSourceConfig,...cfg};metricConfigReadAt=Date.now();$('#metricSourceModal')?.classList.add('hidden');renderMetricSourceStatus();alert(cfg.planilhaAtiva?'Fonte salva: Paradise + planilha MÉTRICAS.':'Fonte salva: somente Paradise (planilha desativada).');loadMetrics({force:true}).catch(()=>{})}catch(e){alert('Erro ao salvar a fonte: '+e.message)}
}
$('#metricSourceBtn')?.addEventListener('click',openMetricSource);
$('#metricSourceClose')?.addEventListener('click',()=>$('#metricSourceModal')?.classList.add('hidden'));
$('#metricSourceModal')?.addEventListener('click',e=>{if(e.target.id==='metricSourceModal')e.currentTarget.classList.add('hidden')});
$('#metricSourceTest')?.addEventListener('click',testMetricSource);
$('#metricSourceSave')?.addEventListener('click',saveMetricSource);
$('#syncMetricBtn')?.addEventListener('click',()=>requestServerMetricSync({quiet:false}));

function marketFlatten(node,path='',out=[]){
 if(Array.isArray(node)){node.forEach((v,i)=>marketFlatten(v,path,out));
return out}
 if(!node||typeof node!=='object')return out;
const name=node.nome||node.item||node.produto||node.name||node.ITEM||node.NOME||node.PRODUTO;

 if(name){out.push({...node,
__name:String(name),
__path:path})}
 Object.entries(node).forEach(([k,
v])=>{if(v&&typeof v==='object')marketFlatten(v,path?path+' / '+k:k,out)});
return out;

}
function marketPriceFields(x){
 const pick=(...ks)=>{for(const k of ks)if(x[k]!==undefined&&x[k]!==null&&String(x[k]).trim()!=='')return x[k];
return ''};

 return {pista:pick('pista','preco_pista','precoPista','sell','sell_min','venda','VALOR PISTA','PISTA'),
parceria:pick('parceria','preco_parceria','precoParceria','buy','buy_min','compra','VALOR PARCERIA','PARCERIA'),
categoria:pick('categoria','category','CATEGORIA')||x.__path||''};

}
async function loadMarketCatalog(){
 mercadoStatus='CARREGANDO';
renderMarket();
try{const r=await fetch(MARKET_CATALOG_URL,{cache:'no-store'});
if(!r.ok)throw new Error('HTTP '+r.status);
const json=await r.json();
mercadoCatalogo=marketFlatten(json).filter((x,i,a)=>a.findIndex(y=>alvesNorm(y.__name)===alvesNorm(x.__name))===i);
mercadoStatus='ONLINE';
renderMarket()}catch(e){mercadoCatalogo=[];
mercadoStatus='INDISPONÍVEL';
renderMarket(e)}
}
function fmtMoneyMaybe(v){if(v===''||v==null)return '—';
if(typeof v==='number')return '$'+v.toLocaleString('pt-BR');
const n=Number(String(v).replace(/[^0-9,.-]/g,'').replace('.','').replace(',','.'));
return Number.isFinite(n)&&n?('$'+n.toLocaleString('pt-BR')):String(v)}
function marketFind(question=''){const n=alvesNorm(question);
return mercadoCatalogo.filter(x=>n.includes(alvesNorm(x.__name))||alvesNorm(x.__name).includes(n)).sort((a,b)=>b.__name.length-a.__name.length)[0]||null}
function renderMarket(err){
 const st=$('#marketStatus'),
box=$('#marketResults'),
cnt=$('#marketCount');
if(!st||!box)return;
st.innerHTML=mercadoStatus==='ONLINE'?`<span class="online">● CATÁLOGO ONLINE</span>`:(mercadoStatus==='CARREGANDO'?'Carregando catálogo público...':`<span class="danger">● CATÁLOGO INDISPONÍVEL</span>${err?' • '+esc(err.message):''}`);
if(cnt)cnt.textContent=mercadoStatus==='ONLINE'?String(mercadoCatalogo.length):'—';

 const q=alvesNorm($('#marketSearch')?.value||'');
const list=(q?mercadoCatalogo.filter(x=>alvesNorm([x.__name,
x.__path].join(' ')).includes(q)):mercadoCatalogo.slice(0,8)).slice(0,20);
box.innerHTML=list.map(x=>{const p=marketPriceFields(x);return `<div class="market-item"><div><b>${esc(x.__name)}</b><small>${esc(p.categoria||'Mercado Negro')}</small></div><span>Pista <b>${esc(fmtMoneyMaybe(p.pista))}</b><br>Parceria <b>${esc(fmtMoneyMaybe(p.parceria))}</b></span></div>`}).join('')||'<div class="delivery-no-change">Nenhum item encontrado.</div>';

}
$('#marketSearch')?.addEventListener('input',renderMarket);





// ===== HIGH OS V6.5 · CDS CONFIRMADAS / GROUPS REMOVIDOS · 07/09/2026 =====
const GROUP_PROFILE_SOURCE={"Armas01":{"LOCAL":"Favela da Barragem",
"PRODUTO":"Armas",
"INICIAR ROTA":"1264.48,-179.11,106.39,19.85",
"CRAFT":"1267.72,-186.22,105.97,195.6",
"BARBEARIA":"",
"BAU":"1272.3,-181.79,101.0,209.77",
"LOJA DE ROUPAS":"",
"GARAGEM VIP FAC":"1300.19,-272.83,99.7,51.03 / 1298.18,-269.26,99.36,127.56",
"GARAGEM PUBLICA":"1285.68,-250.29,99.7,153.08 / 1288.0,-255.85,99.36,130.4",
"GARAGEM DELUXE":"",
"SHOP DELUXE":""},
"Armas02":{"LOCAL":"Favela do MegaMal",
"PRODUTO":"Armas",
"INICIAR ROTA":"2584.82,3491.02,65.82,345.83",
"CRAFT":"2583.34,3489.61,65.82,87.88",
"BARBEARIA":"2648.6,3363.12,56.92,317.49",
"BAU":"2585.78,3485.36,65.82,124.73",
"LOJA DE ROUPAS":"2646.4,3357.91,56.92,357.17",
"GARAGEM VIP FAC":"2706.2,3385.18,58.82,340.16",
"GARAGEM PUBLICA":"2634.39,3370.33,56.87,314.65",
"GARAGEM DELUXE":"",
"SHOP DELUXE":"2548.08,3350.56,53.41,172.92"},
"Armas03":{"LOCAL":"Favela da DP",
"PRODUTO":"Armas",
"INICIAR ROTA":"2287.76,-627.52,90.37,62.37",
"CRAFT":"2292.19,-624.81,90.37,343.0",
"BARBEARIA":"2457.5,-537.94,78.64,76.54",
"BAU":"2290.21,-629.61,90.37,136.07",
"LOJA DE ROUPAS":"2464.12,-535.34,78.64,127.56",
"GARAGEM VIP FAC":"2332.5,-614.04,96.5,286.3",
"GARAGEM PUBLICA":"2345.79,-609.89,96.57,102.05",
"GARAGEM DELUXE":"",
"SHOP DELUXE":"2447.74,-586.65,79.67,235.28"},
"Armas04":{"LOCAL":"Favela da Praia 2",
"PRODUTO":"Armas",
"INICIAR ROTA":"-2404.99,-167.64,36.5,79.38",
"CRAFT":"-2483.78,-239.67,23.56,260.79",
"BARBEARIA":"-2428.14,-266.43,16.68,62.37",
"BAU":"-2486.09,-239.16,23.56,62.37",
"LOJA DE ROUPAS":"-2420.76,-266.25,16.68,113.39",
"GARAGEM VIP FAC":"-2395.47,-180.94,38.5,150.24",
"GARAGEM PUBLICA":"-2384.67,-194.25,39.56,334.49 / -2383.23,-191.85,39.48,68.04",
"GARAGEM DELUXE":"",
"SHOP DELUXE":"-2410.57,-293.44,16.75,229.61"},
"Armas05":{"LOCAL":"Favela do Dino",
"PRODUTO":"Armas",
"INICIAR ROTA":"2561.79,2437.52,55.47,110.56",
"CRAFT":"2561.94,2437.71,55.47,323.15",
"BARBEARIA":"2503.28,2490.61,42.07,96.38",
"BAU":"2564.27,2435.75,55.47,155.91",
"LOJA DE ROUPAS":"2547.14,2417.11,53.85,334.49",
"GARAGEM VIP FAC":"2503.89,2471.52,52.23,116.23 / 2501.68,2471.86,52.12,19.85",
"GARAGEM PUBLICA":"2846.76,4741.39,55.35,34.02\t/ 2510.42,2450.05,51.46,206.93",
"GARAGEM DELUXE":"",
"SHOP DELUXE":""},
"Armas06":{"LOCAL":"Favela do Zancudo",
"PRODUTO":"Armas06",
"INICIAR ROTA":"-2120.96,2482.66,10.03,133.23",
"CRAFT":"-2124.3,2478.9,10.03,195.6",
"BARBEARIA":"-2252.65,2457.93,15.62,107.72",
"BAU":"-2124.05,2484.81,10.03,297.64",
"LOJA DE ROUPAS":"-2248.43,2463.33,15.62,192.76",
"GARAGEM VIP FAC":"",
"GARAGEM PUBLICA":"-2223.74,2453.89,15.6,204.1 / -2224.76,2456.39,15.35,104.89",
"SHOP DELUXE":""},
"Armas07":{"LOCAL":"",
"PRODUTO":"",
"INICIAR ROTA":"",
"CRAFT":"",
"BARBEARIA":"",
"BAU":"",
"LOJA DE ROUPAS":"",
"GARAGEM VIP FAC":"",
"GARAGEM PUBLICA":"",
"GARAGEM DELUXE":"",
"SHOP DELUXE":""},
"Armas08":{"LOCAL":"Favela do Cemitério Norte",
"PRODUTO":"Armas",
"INICIAR ROTA":"60.64,2602.08,87.1,303.31",
"CRAFT":"61.57,2605.42,90.2,25.52",
"BARBEARIA":"",
"BAU":"62.42,2604.93,86.91,192.76",
"LOJA DE ROUPAS":"",
"GARAGEM PUBLICA":"-31.7,2673.96,76.48,93.55 / -33.75,2677.72,76.25,11.34",
"GARAGEM DELUXE":"",
"SHOP DELUXE":""},
"Armas09":{"LOCAL":"Favela da Indústria, Sul",
"PRODUTO":"IlegalMechanic",
"INICIAR ROTA":"2640.33,1789.71,33.62,102.05",
"CRAFT":"2642.02,1781.15,33.62,187.09",
"BARBEARIA":"2657.95,1811.29,36.97,82.21",
"BAU":"2639.29,1784.0,41.1,172.92",
"LOJA DE ROUPAS":"2654.02,1812.91,36.97,184.26",
"GARAGEM VIP FAC":"-21.3,2584.61,91.16,96.38 / -23.15,2589.95,90.92,5.67",
"GARAGEM PUBLICA":"2639.48,1811.7,36.97,133.23 / 2636.38,1815.26,36.73,187.09",
"GARAGEM DELUXE":"2622.48,1808.18,36.92,198.43 / 2616.08,1804.09,36.46,85.04",
"SHOP DELUXE":"2640.37,1784.28,37.76"},
"Armas10":{"LOCAL":"Favela da Cachoeira",
"PRODUTO":"Armas",
"INICIAR ROTA":"-1431.37,2306.54,30.82,187.09",
"CRAFT":"-1432.37,2309.31,30.82,90.71",
"BARBEARIA":"-1480.8,2283.59,30.72,257.96",
"BAU":"-1428.47,2308.29,30.82,291.97",
"LOJA DE ROUPAS":"-1414.47,2255.7,30.75,62.37",
"GARAGEM VIP FAC":"2688.94,1807.72,36.97,212.6 / 2684.77,1804.78,36.72,107.72",
"GARAGEM PUBLICA":"-1422.0,2267.5,30.67,155.91 / -1419.5,2267.27,30.45,345.83",
"GARAGEM DELUXE":"",
"SHOP DELUXE":"-1427.1,2271.31,30.95,172.92"},
"Municao01":{"LOCAL":"Favela do Helipa",
"PRODUTO":"Municao",
"INICIAR ROTA":"1550.5,-728.82,111.51,204.1",
"CRAFT":"1547.48,-712.73,111.51,5.67",
"BARBEARIA":"1300.95,-781.39,79.04,221.11",
"BAU":"1538.87,-712.2,111.51,0.0",
"LOJA DE ROUPAS":"1294.03,-779.3,79.04,280.63",
"GARAGEM VIP FAC":"1355.24,-697.71,78.89,249.45",
"GARAGEM PUBLICA":"1388.29,-749.64,66.96,28.35 / 1379.99,-747.32,66.03,51.03",
"SHOP DELUXE":"1538.76,-723.59,111.51,14.18",
"ACADEMIA":""},
"Municao02":{"LOCAL":"Favela do OBS 1",
"PRODUTO":"Municao",
"INICIAR ROTA":"-779.26,985.57,249.23,195.6",
"CRAFT":"-770.0,986.37,249.23,201.26",
"BARBEARIA":"-765.17,993.8,249.23,306.15",
"BAU":"-772.61,985.43,249.23,195.6",
"LOJA DE ROUPAS":"-760.24,993.57,249.23,150.24",
"GARAGEM VIP FAC":"-841.97,979.67,250.81,274.97 / -839.98,981.83,250.56,274.97",
"GARAGEM PUBLICA":"-833.8,969.79,250.81,39.69 / -833.88,972.49,250.14,8.51",
"GARAGEM DELUXE":"",
"SHOP DELUXE":"-771.07,935.66,240.28,303.31",
"ACADEMIA":""},
"Municao03":{"LOCAL":"Favela de Sandy Shores, Alto",
"PRODUTO":"Municao",
"INICIAR ROTA":"2204.62,4682.23,37.68,232.45",
"CRAFT":"2200.62,4684.16,37.68,161.58",
"BARBEARIA":"2268.82,4607.25,37.59,70.87",
"BAU":"2203.59,4688.95,37.68,340.16",
"LOJA DE ROUPAS":"2159.7,4685.54,37.59,170.08",
"GARAGEM VIP FAC":"s",
"GARAGEM PUBLICA":"2193.62,4616.84,39.38,141.74",
"GARAGEM DELUXE":"",
"SHOP DELUXE":"2190.44,4669.46,37.54,138.9",
"ACADEMIA":""},
"Municao04":{"LOCAL":"Favela do Petróleo, Sul",
"PRODUTO":"Municao",
"INICIAR ROTA":"1367.56,-2433.89,62.18,337.33",
"CRAFT":"1372.79,-2435.76,62.18,334.49",
"BARBEARIA":"1459.26,-2402.88,67.43,320.32",
"BAU":"1364.8,-2439.95,62.18,70.87",
"LOJA DE ROUPAS":"1371.31,-2435.59,58.32,136.07 / 1319.74,-2483.81,51.83,325.99",
"GARAGEM VIP FAC":"1386.0,-2499.9,52.82,206.93 / 1384.77,-2511.32,51.37,155.91",
"GARAGEM PUBLICA":"1389.18,-2509.62,51.98,93.55 / 1390.54,-2496.84,53.08,345.83",
"GARAGEM DELUXE":"1389.08,-2486.87,53.87,141.74 / 1392.64,-2488.64,53.11,348.67",
"SHOP DELUXE":"1385.25,-2378.29,68.36,252.29",
"ACADEMIA":""},
"Municao05":{"LOCAL":"",
"PRODUTO":"QG da Plantação",
"INICIAR ROTA":"2047.86,5095.36,58.32,2.84",
"CRAFT":"2052.14,5126.33,53.89,130.4",
"BARBEARIA":"2069.89,5123.6,58.32,39.69",
"BAU":"2028.02,5095.71,58.32,124.73",
"LOJA DE ROUPAS":"2053.85,5121.14,58.35,303.31",
"GARAGEM VIP FAC":"2022.78,5137.13,52.99,317.49 / 2026.65,5133.26,52.99,130.4",
"GARAGEM PUBLICA":"2027.73,5141.33,52.99,130.4 / 2031.41,5137.24,52.99,130.4",
"GARAGEM DELUXE":"2096.62,5101.39,53.94,42.52 / 2087.23,5103.49,53.77,36.86",
"SHOP DELUXE":"2033.10,5088.68,58.44",
"ACADEMIA":""},
"Municao06":{"LOCAL":"2476.25,4976.52,71.16,96.38",
"PRODUTO":"QG da Mansão Queimada",
"INICIAR ROTA":"2431.55,4972.79,42.34,31.19",
"CRAFT":"2435.99,4968.48,42.34,325.99",
"BARBEARIA":"2443.43,4976.83,51.56,314.65",
"BAU":"",
"LOJA DE ROUPAS":"2454.45,4976.54,51.56,136.07",
"GARAGEM VIP FAC":"2463.58,4949.11,45.29,5.67",
"GARAGEM PUBLICA":"",
"GARAGEM DELUXE":"2459.6,4960.17,43.99,343.0 / 2462.0,4958.6,45.12,150.24",
"SHOP DELUXE":"2443.18,4970.88,51.56,161.58",
"ACADEMIA":""},
"Municao07":{"COORDENADA":"-1896.6,2015.73,171.3,351.5",
"LOCAL":"Vinhedo",
"PRODUTO":"Municao",
"INICIAR ROTA":"-1942.14,2048.95,132.25,164.41",
"CRAFT":"",
"BARBEARIA":"",
"BAU":"-1937.7,2040.68,140.83",
"LOJA DE ROUPAS":"",
"GARAGEM VIP FAC":"-1925.88,2035.26,140.83,286.3 / -1921.87,2037.21,140.73,260.79",
"GARAGEM PUBLICA":"-1921.04,2059.93,140.83,243.78 / -1917.63,2058.18,140.73,243.78",
"GARAGEM DELUXE":""},
"Municao08":{"COORDENADA":"-1777.93,5.13,119.47,161.58",
"LOCAL":"Favela do Cemitério, Sul",
"PRODUTO":"Munição",
"INICIAR ROTA":"-1768.66,-118.06,95.4,311.82",
"CRAFT":"",
"BARBEARIA":"",
"BAU":"-1771.63,-117.69,95.4,42.52",
"LOJA DE ROUPAS":"",
"GARAGEM VIP FAC":"",
"GARAGEM PUBLICA":"-1750.31,-118.12,85.66,164.41 / -1756.5,-116.51,85.41,45.36",
"SHOP DELUXE":"-1777.02,6.2,85.71,235.28",
"ACADEMIA":""},
"Municao09":{"COORDENADA":"",
"LOCAL":"QG dos Vagos",
"PRODUTO":"Munição",
"INICIAR ROTA":"320.79,-2058.35,24.03,323.15",
"CRAFT":"",
"BARBEARIA":"",
"BAU":"314.84,-2049.11,20.98,53.86",
"LOJA DE ROUPAS":"",
"GARAGEM VIP FAC":"313.21,-2035.34,20.73,325.99 / 317.48,-2030.66,20.62,323.15",
"GARAGEM PUBLICA":"320.99,-2041.22,20.78,325.99 / 324.85,-2038.76,20.69,323.15",
"SHOP DELUXE":"322.09,-2050.02,20.98,306.15",
"ACADEMIA":""},
"Municao10":{"COORDENADA":"2184.19,85.47,261.91,164.41",
"LOCAL":"Favela da Boa Vista, Sul",
"PRODUTO":"Munição",
"CRAFT":"2249.79,51.97,251.42,68.04",
"BARBEARIA":"",
"BAU":"",
"LOJA DE ROUPAS":"2228.56,88.91,241.56,340.16",
"GARAGEM VIP FAC":"",
"GARAGEM PUBLICA":"2179.75,70.55,227.22,172.92 / 2177.03,72.47,227.15,130.4",
"GARAGEM DELUXE":"",
"SHOP DELUXE":"2218.22,109.56,235.26,238.12",
"ACADEMIA":""},
"Drogas01":{"LOCAL":"657.75,-174.98,69.86,59.53",
"PRODUTO":"Favela do Campinho",
"INICIAR ROTA":"709.82,-225.13,71.65,153.08",
"CRAFT":"710.31,-224.03,71.65,334.49",
"BARBEARIA":"709.89,-223.81,71.65,155.91",
"BAU":"707.57,-221.92,71.65,343.0",
"LOJA DE ROUPAS":"721.89,-191.4,69.37,243.78",
"GARAGEM VIP FAC":"619.18,-92.62,74.93,79.38",
"GARAGEM PUBLICA":"719.91,-213.37,68.49,345.83 / 719.97,-210.54,68.24,56.7",
"GARAGEM DELUXE":"723.24,-205.81,68.49,153.08 / 721.06,-207.58,68.24,59.53",
"SHOP DELUXE":""},
"Drogas02":{"LOCAL":"-1682.63,931.86,180.38,334.49",
"PRODUTO":"Favela do Asilo",
"INICIAR ROTA":"-1764.55,952.9,188.9,136.07",
"CRAFT":"-1762.31,954.81,188.9,229.61",
"BARBEARIA":"-1643.8,930.12,177.58,161.58",
"BAU":"-1763.18,958.83,188.9,246.62",
"LOJA DE ROUPAS":"-1639.81,945.88,177.56,76.54",
"GARAGEM VIP FAC":"-1644.81,937.1,177.58,201.26",
"GARAGEM PUBLICA":"-1669.83,992.43,177.61,249.45 / -1668.32,990.68,177.38,153.08",
"GARAGEM DELUXE":"-1670.38,934.22,177.63,136.07 / -1673.44,932.39,177.39,229.61",
"SHOP DELUXE":""},
"Drogas03":{"LOCAL":"1367.25,-1381.16,108.73,257.96",
"PRODUTO":"Favela do Esgoto",
"INICIAR ROTA":"1430.23,-1414.87,84.37,280.63",
"CRAFT":"1427.54,-1415.26,84.37,8.51",
"BARBEARIA":"1283.57,-1333.09,47.92,187.09",
"BAU":"1424.85,-1418.62,84.37,22.68",
"LOJA DE ROUPAS":"1280.64,-1327.29,47.92,266.46",
"GARAGEM VIP FAC":"1295.6,-1330.47,47.6,323.15 / 1298.84,-1330.61,47.38,0.0",
"GARAGEM DELUXE":"1353.17,-1435.42,71.38,82.21 / 1351.1,-1434.02,71.12,357.17",
"GARAGEM PUBLICA":"1343.79,-1380.5,71.38,269.3 / 1347.0,-1380.58,71.12,0.0",
"SHOP DELUXE":""},
"Drogas04":{"LOCAL":"482.33,208.67,100.73,82.21",
"PRODUTO":"QG Gang 1",
"INICIAR ROTA":"482.33,208.67,100.73,82.21",
"CRAFT":"470.13,205.06,100.73,354.34",
"BARBEARIA":"485.31,192.23,100.73,164.41",
"BAU":"472.67,197.5,100.73,164.41",
"LOJA DE ROUPAS":"473.06,186.7,100.73,297.64",
"GARAGEM VIP FAC":"473.52,186.59,100.73,325.99",
"GARAGEM PUBLICA":"509.06,225.12,104.74,147.41 / 514.46,226.33,104.74,345.83",
"GARAGEM DELUXE":"528.22,249.87,103.1,351.5 / 528.8,252.23,102.97,252.29",
"SHOP DELUXE":""},
"Drogas05":{"LOCAL":"-1570.68,-298.16,88.78,337.33",
"PRODUTO":"QG Gang 2(mapa removido)",
"INICIAR ROTA":"-1565.57,-264.05,44.26,22.68",
"CRAFT":"-1578.25,-262.83,44.26,343.0",
"BARBEARIA":"-1571.2,-252.76,43.89,76.54",
"BAU":"-1578.55,-270.92,44.26,136.07",
"LOJA DE ROUPAS":"-1578.81,-270.88,43.79,153.08",
"GARAGEM VIP FAC":"1580.84,-281.09,44.26,300.48",
"GARAGEM PUBLICA":"-1566.89,-252.61,48.46,51.03",
"GARAGEM DELUXE":"-1575.38,-234.43,49.76,59.53 / -1576.35,-238.15,49.45,243.78",
"SHOP DELUXE":""},
"Drogas06":{"LOCAL":"Clube de Festas, Açougue",
"PRODUTO":"Drogas",
"INICIAR ROTA":"1003.52,-2367.53,-4.52,189.93",
"CRAFT":"1010.48,-2372.96,-4.55,280.63",
"BARBEARIA":"1005.37,-2365.64,-4.55,221.11",
"BAU":"1001.11,-2365.92,-4.55,90.71",
"LOJA DE ROUPAS":"1004.46,-2373.0,-4.55,323.15",
"GARAGEM VIP FAC":"",
"GARAGEM PUBLICA":"1024.74,-2349.74,31.24,175.75 / 1018.94,-2351.77,31.24,187.09",
"GARAGEM DELUXE":"",
"SHOP DELUXE":""},
"Drogas07":{"LOCAL":"Residência Clinton",
"PRODUTO":"",
"INICIAR ROTA":"-9.29,-1441.26,31.1,215.44",
"CRAFT":"-9.08,-1433.34,30.85",
"BARBEARIA":"-17.93,-1436.92,31.1,272.13",
"BAU":"-17.41,-1430.43,30.89",
"LOJA DE ROUPAS":"-17.98,-1439.36,31.1,235.28",
"GARAGEM VIP FAC":"-21.12,-1432.83,30.65,90.71 / -24.29,-1437.13,30.65,175.75",
"GARAGEM PUBLICA":"-13.3,-1454.7,30.46,187.09 / -12.59,-1458.68,30.5,93.55",
"GARAGEM DELUXE":"-28.68,-1455.62,30.97,192.76 / -27.63,-1460.43,30.92,90.71",
"SHOP DELUXE":"-9.86,-1428.56,31.18"},
"Drogas08":{"LOCAL":"Favela da Praia 3",
"PRODUTO":"Drogas",
"INICIAR ROTA":"-2902.94,1485.7,71.12,153.08",
"CRAFT":"-2899.09,1488.07,71.12,255.12",
"BARBEARIA":"-2888.92,1367.41,76.26,19.85",
"BAU":"-2902.65,1492.9,71.12,340.16",
"LOJA DE ROUPAS":"-2843.63,1419.7,96.99,73.71",
"GARAGEM VIP FAC":"",
"GARAGEM PUBLICA":"",
"GARAGEM DELUXE":"",
"SHOP DELUXE":""},
"Drogas09":{"LOCAL":"Favela da Praia 1",
"PRODUTO":"Drogas",
"INICIAR ROTA":"-1137.86,-1764.65,4.48,215.44",
"CRAFT":"-1139.78,-1763.02,4.48,215.44",
"BARBEARIA":"-1127.14,-1752.72,4.48,300.48",
"BAU":"-1137.37,-1761.03,4.48,226.78",
"LOJA DE ROUPAS":"-1124.34,-1750.41,4.48,31.19",
"GARAGEM VIP FAC":"-1191.48,-1790.99,4.26,269.3 / -1188.75,-1793.3,4.01,343.0",
"GARAGEM PUBLICA":"",
"GARAGEM DELUXE":"",
"SHOP DELUXE":""},
"Drogas10":{"LOCAL":"Favela de Paleto, Norte",
"PRODUTO":"DROGAS",
"INICIAR ROTA":"1772.1,6474.44,60.04,240.95",
"CRAFT":"1767.62,6478.2,60.04,56.7",
"BARBEARIA":"1759.67,6466.96,59.77,272.13",
"BAU":"1770.48,6472.01,60.04,249.45",
"LOJA DE ROUPAS":"1756.12,6466.74,59.77,317.49",
"GARAGEM VIP FAC":"1744.07,6496.36,59.78,147.41 / 1741.94,6494.63,59.55,51.03",
"GARAGEM DELUXE":"",
"SHOP DELUXE":"1696.08,6529.43,52.13,48.19"},
"Drogas11":{"LOCAL":"Posto, Porto",
"PRODUTO":"Drogas",
"INICIAR ROTA":"-59.76,-2517.63,7.30",
"CRAFT":"-55.92,-2519.98,7.23",
"BARBEARIA":"-55.09,-2503.67,6.15,56.7",
"BAU":"-52.39,-2525.34,7.51",
"LOJA DE ROUPAS":"-61.99,-2504.17,6.0,56.7",
"GARAGEM VIP FAC":"-103.79,-2509.85,5.39,240.95 / -105.71,-2513.14,5.43,232.45",
"GARAGEM PUBLICA":"1742.47,6487.88,59.78,331.66 / 1742.77,6490.59,59.56,62.37",
"GARAGEM DELUXE":"",
"SHOP DELUXE":""},
"Lavagem01":{"LOCAL":"Club 77",
"PRODUTO":"Lavagem",
"INICIAR ROTA":"209.95,-3175.18,8.21,181.42",
"CRAFT":"242.5,-3143.78,3.32,124.73",
"BARBEARIA":"239.56,-3151.23,-0.19,181.42",
"BAU":"248.55,-3144.14,3.40",
"LOJA DE ROUPAS":"252.76,-3150.9,-0.2,87.88",
"GARAGEM VIP FAC":"194.48,-3158.92,5.78,93.55",
"GARAGEM PUBLICA":"160.19,-3180.44,5.98,235.28/164.02,-3182.84,5.91,266.46",
"BAR":"247.17,-3162.36,-0.15",
"SHOP DELUXE":"244.12,-3157.52,-0.27",
"ACADEMIA":""},
"Lavagem02":{"LOCAL":"FAZENDA, SUL",
"PRODUTO":"LAVAGEM",
"INICIAR ROTA":"1466.47,1119.43,119.13,0.0",
"CRAFT":"1471.03,1118.18,119.13,0.0",
"BARBEARIA":"1403.24,1138.17,117.53,184.26",
"BAU":"",
"LOJA DE ROUPAS":"1404.22,1146.07,117.53,107.72",
"GARAGEM VIP FAC":"1372.26,1151.31,113.75,90.71 / 1368.33,1150.45,113.75,195.6",
"GARAGEM DELUXE":"1374.97,1131.93,114.16,317.49 / 1370.97,1130.95,113.89,138.9",
"SHOP DELUXE":""},
"Lavagem03":{"LOCAL":"FAVELA DA PLACA",
"PRODUTO":"LAVAGEM",
"INICIAR ROTA":"768.49,441.9,149.73,215.44",
"CRAFT":"765.18,445.32,149.73,34.02",
"BARBEARIA":"764.5,396.1,139.68,153.08",
"BAU":"767.48,443.1,146.37,144.57",
"LOJA DE ROUPAS":"765.43,402.19,139.68,192.76",
"GARAGEM VIP FAC":"828.36,424.15,139.63,331.66",
"GARAGEM DELUXE":"",
"SHOP DELUXE":""},
"Lavagem04":{"LOCAL":"FAVELA DO OBS 2",
"PRODUTO":"LAVAGEM",
"INICIAR ROTA":"-480.22,1613.99,369.58,0.0",
"CRAFT":"-482.76,1606.59,369.58,195.6",
"BARBEARIA":"-304.33,1599.18,347.27,102.05",
"BAU":"-479.65,1609.97,369.58,192.76",
"LOJA DE ROUPAS":"-298.58,1603.26,347.27,138.9",
"GARAGEM VIP FAC":"",
"GARAGEM DELUXE":"",
"SHOP DELUXE":""},
"Lavagem05":{"LOCAL":"Mansão Playboy",
"PRODUTO":"Lavagem",
"INICIAR ROTA":"-1540.36,81.20,56.58",
"CRAFT":"-1511.86,109.48,46.86",
"BARBEARIA":"-1545.0,99.0,60.96,314.65",
"BAU":"-1509.97,117.46,47.15",
"LOJA DE ROUPAS":"-1535.6,106.92,60.96,130.4",
"GARAGEM VIP FAC":"",
"GARAGEM DELUXE":""},
"Lavagem06":{"LOCAL":"QG do China (MAPA REMOVIDO)",
"PRODUTO":"Lavagem",
"INICIAR ROTA":"-881.18,-1462.64,7.46",
"CRAFT":"-892.03,-1444.94,7.53,209.77",
"BARBEARIA":"-895.49,-1467.9,7.53,113.39",
"BAU":"-867.42,-1458.02,7.53,291.97",
"LOJA DE ROUPAS":"",
"GARAGEM VIP FAC":"",
"GARAGEM PUBLICA":"",
"SHOP DELUXE":"-902.60,-1455.85,7.44"},
"Lavagem07":{"COORDENADA":"Favela do Sapao",
"LOCAL":"LAVAGEM07",
"PRODUTO":"",
"INICIAR ROTA":"1876.33,1511.54,112.98,357.17",
"CRAFT":"1885.17,1504.95,113.06,269.3",
"BARBEARIA":"1797.51,1356.97,126.93,175.75",
"BAU":"1886.08,1509.38,112.98,246.62",
"LOJA DE ROUPAS":"",
"GARAGEM DELUXE":"1860.3,1466.5,113.16,0.0"},
"Lavagem08":{"LOCAL":"QG Gang 4(MAPA REMOVIDO",
"PRODUTO":"Lavagem08",
"INICIAR ROTA":"-1129.31,-1584.40,0.24",
"CRAFT":"-1123.6,-1562.83,0.42,297.64",
"BARBEARIA":"-1134.11,-1564.1,0.42,303.31",
"BAU":"-1127.24,-1576.06,0.42,303.31",
"LOJA DE ROUPAS":"-1121.56,-1566.9,0.42,76.54",
"GARAGEM VIP FAC":"-1138.97,-1545.38,4.35,127.56 / -1140.6,-1546.48,4.38,36.86",
"GARAGEM PUBLICA":"-1162.28,-1552.97,4.35,308.98 / -1158.29,-1550.28,4.3,308.98",
"GARAGEM DELUXE":"",
"SHOP DELUXE":"-1140.83,-1589.01,0.52"},
"Lavagem09":{"LOCAL":"Galaxy",
"PRODUTO":"Lavagem",
"INICIAR ROTA":"400.75,242.64,92.05,158.75",
"CRAFT":"406.28,244.24,92.05,263.63",
"BARBEARIA":"",
"BAU":"391.84,250.44,92.05,79.38",
"LOJA DE ROUPAS":"380.99,272.5,91.19,73.71",
"GARAGEM VIP FAC":"",
"BAR":"351.80,286.03,91.22"},
"Desmanche01":{"LOCAL":"QG Gang 3",
"PRODUTO":"Desmanche",
"INICIAR ROTA":"-1332.84,-1238.37,1.4,317.49",
"CRAFT":"-1325.19,-1246.69,0.59,34.02",
"BARBEARIA":"-1334.04,-1258.29,0.59,136.07",
"BAU":"-1337.69,-1245.67,0.59,104.89",
"LOJA DE ROUPAS":"-1345.79,-1252.23,0.59,257.96",
"GARAGEM VIP FAC":"-1298.72,-1250.86,4.45,107.72 / -1303.08,-1253.4,4.36,221.11",
"GARAGEM PUBLICA":"-1306.33,-1240.29,4.84,133.23 / -1309.84,-1242.13,4.73,204.1",
"GARAGEM DELUXE":"",
"SHOP DELUXE":""},
"Desmanche02":{"LOCAL":"Tequi-la-la",
"PRODUTO":"Desmanche",
"INICIAR ROTA":"-572.99,286.48,79.18,184.26",
"CRAFT":"-568.52,292.05,79.18,167.25",
"BARBEARIA":"-561.91,289.98,85.38,178.59",
"BAU":"-572.8,292.22,79.18,25.52",
"LOJA DE ROUPAS":"-552.76,278.47,82.18,59.53",
"GARAGEM VIP FAC":"-569.89,323.5,84.48,0.0 / -572.76,324.7,84.54,184.26",
"GARAGEM PUBLICA":"-552.03,310.63,83.17,354.34 / -546.87,308.18,83.02,175.75",
"GARAGEM DELUXE":"",
"BAR":"-561.28,286.65,82.25 / -563.87,286.07,85.48"},
"Desmanche04":{"LOCAL":"The Lost",
"PRODUTO":"Desmanche04",
"INICIAR ROTA":"961.56,-107.1,74.34,25.52",
"CRAFT":"971.5, -98.4, 74.3",
"BARBEARIA":"974.39,-99.78,78.08,311.82",
"BAU":"957.8, -110.9, 74.3",
"LOJA DE ROUPAS":"974.4, -99.7, 78.1",
"GARAGEM VIP FAC":"950.0, -129.3, 74.4",
"GARAGEM PUBLICA":"959.1, -121.4, 75.0",
"GARAGEM DELUXE":"",
"SHOP DELUXE":"998.22,-108.19,73.97,314.65"},
"Desmanche05":{"LOCAL":"Roogers",
"PRODUTO":"",
"INICIAR ROTA":"-616.13,-1621.95,32.88",
"CRAFT":"-612.49,-1624.81,32.80",
"BARBEARIA":"-589.7,-1618.08,33.01,172.92 / 490.22,-1306.8,29.27,195.6",
"BAU":"-619.84,-1617.82,33.01,357.17",
"LOJA DE ROUPAS":"-594.88,-1618.53,33.01,269.3",
"GARAGEM VIP FAC":"-610.65,-1600.65,26.74,82.21 / -610.2,-1597.7,26.74,79.38",
"GARAGEM PUBLICA":"-609.36,-1591.97,26.74,87.88 / -610.6,-1594.24,26.74,82.21",
"GARAGEM DELUXE":"-588.75,-1583.67,26.74,82.21 / -590.55,-1587.77,26.74,90.71",
"SHOP DELUXE":"-623.7,-1617.59,33.01,11.34"},
"Desmanche06":{"LOCAL":"Hayes Auto",
"PRODUTO":"",
"INICIAR ROTA":"t/",
"CRAFT":"",
"BARBEARIA":"474.0,-1321.5,29.22,198.43",
"BAU":"479.42,-1326.83,29.2,113.39",
"LOJA DE ROUPAS":"482.19,-1303.27,29.25,218.27",
"GARAGEM VIP FAC":"484.36,-1338.85,29.28,289.14 / 485.78,-1333.83,29.3,306.15",
"GARAGEM PUBLICA":"504.6,-1336.41,29.32,195.6 / 499.79,-1337.28,29.32,34.02",
"GARAGEM DELUXE":"492.64,-1356.22,29.34,90.71 / 488.4,-1362.14,29.25,192.76",
"SHOP DELUXE":"478.44,-1334.72,29.23,141.74"},
"IlegalMedic01":{"LOCAL":"QG Gang 5",
"PRODUTO":"IlegalMedic",
"INICIAR ROTA":"544.32,-1756.77,25.34,65.2",
"CRAFT":"540.27,-1766.22,25.34,150.24",
"BARBEARIA":"553.57,-1783.34,25.34,144.57",
"BAU":"541.8,-1776.8,25.34,56.7",
"LOJA DE ROUPAS":"547.28,-1789.54,25.34,161.58",
"GARAGEM VIP FAC":"569.71,-1800.96,29.17,348.67 / 567.43,-1799.82,29.18,348.67",
"GARAGEM PUBLICA":"564.15,-1754.86,29.17,340.16 / 564.15,-1754.86,29.17,343.0",
"GARAGEM DELUXE":"",
"SHOP DELUXE":""},
"Contrabando02":{"LOCAL":"Lester",
"PRODUTO":"",
"INICIAR ROTA":"1272.07,-1711.17,54.59",
"CRAFT":"1272.58,-1716.33,54.42",
"BARBEARIA":"1273.69,-1708.15,54.76,119.06",
"BAU":"1268.32,-1710.62,55.26",
"LOJA DE ROUPAS":"1276.17,-1714.44,54.76,48.19",
"GARAGEM VIP FAC":"1273.14,-1733.26,51.85,221.11 / 1272.55,-1736.37,51.63,113.39",
"GARAGEM PUBLICA":"1282.54,-1728.36,52.72,218.27 / 1286.06,-1732.69,52.86,297.64",
"GARAGEM DELUXE":"",
"SHOP EXCLUSIVO":"1270.48,-1730.46,54.85"}};

const GROUP_BASE_CORRECTIONS={"Armas01":{"cds":"1286.34,-266.43,99.7,303.31",
"state":"OK"},
"Armas02":{"cds":"2696.23,3400.29,58.82,90.71",
"state":"OK"},
"Armas03":{"cds":"2355.39,-605.06,96.58,257.96",
"state":"OK"},
"Armas04":{"cds":"-2390.91,-198.43,39.65,269.3",
"state":"OK"},
"Armas05":{"cds":"2561.79,2437.52,55.47,110.56",
"state":"OK"},
"Armas06":{"cds":"-2120.96,2482.66,10.03,133.23",
"state":"OK"},
"Armas07":{"cds":"-113.73,-12.34,70.52,133.23",
"state":"SEM_CRAFT"},
"Armas08":{"state":"REMOVIDO"},
"Armas09":{"cds":"2640.33,1789.71,33.62,102.05",
"state":"OK"},
"Armas10":{"cds":"-1431.37,2306.54,30.82,187.09",
"state":"OK"},
"Municao01":{"cds":"1550.5,-728.82,111.51,204.1",
"state":"OK"},
"Municao02":{"cds":"-779.26,985.57,249.23,195.6",
"state":"OK"},
"Municao03":{"cds":"-130.69,3220.77,73.72,255.12",
"state":"OK"},
"Municao04":{"cds":"1367.56,-2433.89,62.18,337.33",
"state":"OK"},
"Municao05":{"cds":"2047.86,5095.36,58.32,2.84",
"state":"OK"},
"Municao06":{"cds":"2473.01,4959.72,44.89,51.03",
"state":"OK"},
"Municao07":{"cds":"-1896.6,2015.73,171.3,351.5",
"state":"OK"},
"Municao08":{"cds":"-1771.7,-117.8,95.4",
"state":"OK"},
"Municao09":{"cds":"320.79,-2058.35,24.03,323.15",
"state":"OK"},
"Municao10":{"cds":"-3694.8,3790.2,5.1",
"state":"OK"},
"Lavagem01":{"cds":"241.5,-3144.2,3.3",
"state":"OK"},
"Lavagem02":{"cds":"1466.47,1119.43,119.13,0.0",
"state":"OK"},
"Lavagem03":{"cds":"768.49,441.9,149.73,215.44",
"state":"OK"},
"Lavagem04":{"cds":"-482.6,1606.5,369.6",
"state":"OK"},
"Lavagem05":{"cds":"-1511.9,109.5,46.9",
"state":"OK"},
"Lavagem07":{"cds":"1876.33,1511.54,112.98,357.17",
"state":"OK"},
"Lavagem08":{"state":"REMOVIDO"},
"Lavagem09":{"cds":"342.68,293.21,118.13,354.34",
"state":"OK"},
"Desmanche01":{"cds":"-1332.84,-1238.37,1.4,317.49",
"state":"OK"},
"Desmanche02":{"cds":"-572.99,286.48,79.18,184.26",
"state":"OK"},
"Desmanche03":{"cds":"-1376.69,-621.82,35.89,31.19",
"state":"OK"},
"Desmanche04":{"cds":"983.12,-126.47,74.05,320.32",
"state":"OK"},
"Desmanche05":{"cds":"-616.13,-1621.95,32.88",
"state":"OK"},
"Desmanche06":{"cds":"471.44,-1311.00,29.26",
"state":"OK"},
"Desmanche07":{"cds":"2201.62,4689.18,37.68,68.04",
"state":"OK"},
"Vanilla":{"cds":"92.59,-1290.91,29.25",
"state":"OK"},
"IlegalMedic01":{"cds":"227.44,-1388.25,32.45,36.86",
"state":"OK"},
"IlegalMechanic":{"cds":"-205.6,-1310.29,31.29,223.94",
"state":"OK"},
"Manicomio":{"cds":"3899.68,4877.41,12.7,93.55",
"state":"OK"},
"Drogas01":{"cds":"657.75,-174.98,69.86,59.53",
"state":"OK"},
"Drogas02":{"cds":"-1682.63,931.86,180.38,334.49",
"state":"OK"},
"Drogas03":{"cds":"1367.25,-1381.16,108.73,257.96",
"state":"OK"}};

const GROUP_PROFILE_SOURCE_VERSION='07/09/2026 · CDS conferidas';

function profileCoordLike(v=''){return /^\s*[{]?\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+/.test(String(v||''))}
function splitCoordPair(v=''){const s=String(v||'').replace(/\t/g,' ').trim();
if(!s)return ['',
''];
const parts=s.split(/\s*\/\s*/).map(x=>x.trim()).filter(Boolean);
return [parts[0]||'',
parts[1]||'']}
function cleanProfileValue(v=''){return String(v||'').replace(/<br\s*\/?\s*>/gi,'').trim()}
function sourceToGroupPatch(f,src){
 const oldB={...(f?.beneficios||{})},
 oldT=mergedTechProfile(f||{}),
 b={...oldB},
 t=clonePlain(oldT)||{},
 correction=GROUP_BASE_CORRECTIONS[f?.group]||{};

 const local=cleanProfileValue(src.LOCAL),
 product=cleanProfileValue(src.PRODUTO),
 craft=cleanProfileValue(src.CRAFT),
 routeStart=cleanProfileValue(src['INICIAR ROTA']);

 const [vipBlip,
vipSpawn]=splitCoordPair(src['GARAGEM VIP FAC']),
[pubBlip,
pubSpawn]=splitCoordPair(src['GARAGEM PUBLICA']);

 if(cleanProfileValue(src.BARBEARIA))b.barbearia=cleanProfileValue(src.BARBEARIA);

 if(cleanProfileValue(src.BAU))b.bau=cleanProfileValue(src.BAU);

 if(cleanProfileValue(src['LOJA DE ROUPAS']))b.lojaRoupas=cleanProfileValue(src['LOJA DE ROUPAS']);

 if(vipBlip){b.garagemVipBlip=vipBlip;
b.garagemVip=true} if(vipSpawn)b.garagemVipSpawn=vipSpawn;

 if(pubBlip){b.garagemPublicaBlip=pubBlip;
b.garagemPublica=true} if(pubSpawn)b.garagemPublicaSpawn=pubSpawn;

 if(cleanProfileValue(src['SHOP EXCLUSIVO']))b.shopExclusivo=cleanProfileValue(src['SHOP EXCLUSIVO']);

 if(craft)b.craft=craft;
if(routeStart)b.rotaExclusiva=true;

 t.craft=t.craft||{receitas:[]};
if(craft)t.craft.cds=craft;

 t.rota=t.rota||{};
if(routeStart)t.rota.inicio=routeStart;

 t.estruturaExtra={...(t.estruturaExtra||{}),
coordenadaBase:cleanProfileValue(src.COORDENADA||''),
garagemDeluxe:cleanProfileValue(src['GARAGEM DELUXE']||''),
shopDeluxe:cleanProfileValue(src['SHOP DELUXE']||''),
academia:cleanProfileValue(src.ACADEMIA||''),
bar:cleanProfileValue(src.BAR||''),
fontePerfil:GROUP_PROFILE_SOURCE_VERSION};

 if(correction.state==='SEM_CRAFT'){b.craft='';
t.craft={...(t.craft||{}),
cds:'',
ativo:false,
receitas:[]};
}
 if(correction.state==='REMOVIDO'){t.estruturaExtra={...(t.estruturaExtra||{}),
removido:true};
}
 const patch={beneficios:b,
perfilTecnico:t,
perfilFonte:{...src,
versao:GROUP_PROFILE_SOURCE_VERSION},
perfilBase:{cds:correction.cds||f?.cds||'',
situacao:correction.state||'BASE',
fonte:'Conferência manual 07/09/2026'}};

 if(correction.cds)patch.cds=correction.cds;

 if(correction.state==='REMOVIDO'){patch.removido=true;
patch.status='INATIVA';
patch.observacoes=[f?.observacoes,
'Group removido da cidade em 07/09/2026.'].filter(Boolean).join(' | ');
}
 if(correction.state!=='REMOVIDO'&&f?.removido){patch.removido=false;
}
 if(local&&!profileCoordLike(local)&&!/^N\/?A$/i.test(local))patch.qg=local;

 if(product&&/^(armas\d*|muni[cç][aã]o|drogas|lavagem|desmanche|ilegalmedic)$/i.test(product))patch.produto=product;

 return patch;

}
async function updateOfficialGroupProfiles(){
 if(String(currentProfile?.role||'').toUpperCase()!=='ADMIN')return alert('Apenas ADMIN pode atualizar os perfis dos Groups.');

 const keys=[...new Set([...Object.keys(GROUP_PROFILE_SOURCE),
...Object.keys(GROUP_BASE_CORRECTIONS)])];
const entries=keys.map(k=>[k,
GROUP_PROFILE_SOURCE[k]||{}]);
if(!entries.length)return alert('Nenhum perfil oficial carregado.');

 if(!confirm(`Atualizar ${entries.length} perfis técnicos com a base oficial de ${GROUP_PROFILE_SOURCE_VERSION}?\n\nA ocupação atual, líderes, status, histórico e receitas personalizadas serão preservados.`))return;

 try{let updated=0,
missing=0;
const batch=writeBatch(db);
for(const [sourceGroup,
src] of entries){const f=(faccoes||[]).find(x=>alvesNorm(x.group).replace(/\s+/g,'')===alvesNorm(sourceGroup).replace(/\s+/g,''));
if(!f){missing++;
continue}const patch=sourceToGroupPatch(f,src);
batch.set(doc(db,'highos','data','faccoes',idFac(f.group)),{...patch,
updatedAt:serverTimestamp(),
updatedBy:currentUser.email},{merge:true});
updated++;
}await batch.commit();
await addDoc(histCol,{sessionId:currentSessionId||'',
tipo:'ATUALIZACAO_PERFIS',
descricao:`Perfis técnicos oficiais atualizados: ${updated} Group(s) · fonte ${GROUP_PROFILE_SOURCE_VERSION}`,
usuario:currentUser.email,
data:serverTimestamp()});
await loadFaccoes();
alert(`Perfis atualizados com sucesso.\n\nAtualizados: ${updated}\nSem Group correspondente na base atual: ${missing}\n\nFacções/ocupações existentes foram preservadas.`);
}catch(e){alert('Erro ao atualizar perfis: '+e.message)}
}

// ===== HIGH OS V6.3 · PERFIL TÉCNICO INTEGRADO AO GROUP =====
// Craft não é uma página: receitas, farm e rota fazem parte do patrimônio permanente do Group/QG.
const ITEM_IMG_BASE='assets/itens/';

const ITEM_META={
 pistolbody:{nome:'Corpo de Pistola',
imagem:'pistolbody.png'},
 smgbody:{nome:'Corpo de Sub',
imagem:'smgbody.png'},
 riflebody:{nome:'Corpo de Rifle',
imagem:'riflebody.png'},

 sheetmetal:{nome:'Chapa de Metal',
imagem:'sheetmetal.png'},
 dollar:{nome:'Dólar',
imagem:'dollar.png'},
 elastic:{nome:'Elástico',
imagem:'elastic.png'},
 rubber:{nome:'Borracha',
imagem:'rubber.png'},
 techtrash:{nome:'Lixo Eletrônico',
imagem:'techtrash.png'},

 ziplock:{nome:'Ziplock',
imagem:'ziplock.png'},
 weedbud:{nome:'Bud de Maconha',
imagem:'weedbud.png'},
 kunk:{nome:'Kunk',
imagem:'weedbud.png'},
 projectile:{nome:'Projétil',
imagem:'projectile.png'},
 gunpowder:{nome:'Frasco de Pólvora',
imagem:'gunpowder.png'},

 plastic:{nome:'Plástico',
imagem:'plastic.png'},
 explosives:{nome:'Explosivos',
imagem:'explosives.png'},
 misturaquimica:{nome:'Mistura Química',
imagem:'misturaquimica.png'},
 electroniccomponents:{nome:'Componentes Eletrônicos',
imagem:'electroniccomponents.png'},

 washbleach:{nome:'Alvejante',
imagem:'washbleach.png'},
 alcohol:{nome:'Álcool',
imagem:'alcohol.png'},
 acetone:{nome:'Acetona',
imagem:'acetone.png'},
 sulfuric:{nome:'Ácido Sulfúrico',
imagem:'sulfuric.png'},
 acid:{nome:'Ácido',
imagem:'acid.png'},

 tarp:{nome:'Lona',
imagem:'tarp.png'},
 fibrasin:{nome:'Fibra Sintética',
imagem:'fibrasin.png'},
 syringe:{nome:'Seringa',
imagem:'syringe.png'},
 saline:{nome:'Soro Fisiológico',
imagem:'saline.png'},
 paper:{nome:'Papel',
imagem:'paper.png'},

 woodlog:{nome:'Tora de Madeira',
imagem:'woodlog.png'}
};

const ARMAS_STANDARD_RECIPES=[
 {id:'ak74n',
nome:'AK-74N',
spawn:'WEAPON_ASSAULTRIFLE',
imagem:'ak74n.png',
nivel:5,
max:10,
insumos:[['riflebody',
35],
['sheetmetal',
30],
['dollar',
70000]]},

 {id:'ak102',
nome:'AK-102',
spawn:'WEAPON_ASSAULTRIFLE_MK2',
imagem:'ak102.png',
nivel:5,
max:10,
insumos:[['riflebody',
40],
['sheetmetal',
34],
['dollar',
46000]]},

 {id:'sigsauer556',
nome:'Sig Sauer 556',
spawn:'WEAPON_SPECIALCARBINE_MK2',
imagem:'sigsauer556.png',
nivel:5,
max:10,
insumos:[['riflebody',
47],
['sheetmetal',
33],
['dollar',
70000]]},

 {id:'t54',
nome:'T54',
spawn:'WEAPON_PISTOL_MK2',
imagem:'t54.png',
nivel:5,
max:10,
insumos:[['pistolbody',
22],
['sheetmetal',
12],
['dollar',
8500]]},

 {id:'f2000',
nome:'F2000',
spawn:'WEAPON_ASSAULTSMG',
imagem:'WEAPON_ASSAULTSMG.png',
nivel:5,
max:10,
insumos:[['smgbody',
30],
['sheetmetal',
24],
['dollar',
31000]]},

 {id:'deagle',
nome:'Deagle',
spawn:'WEAPON_PISTOL50',
imagem:'WEAPON_PISTOL50.png',
nivel:5,
max:10,
insumos:[['pistolbody',
16],
['sheetmetal',
13],
['dollar',
18000]]},

 {id:'m1922',
nome:'M1922',
spawn:'WEAPON_VINTAGEPISTOL',
imagem:'WEAPON_VINTAGEPISTOL.png',
nivel:5,
max:10,
insumos:[['pistolbody',
11],
['sheetmetal',
9],
['dollar',
12000]]},

 {id:'tec9',
nome:'Tec-9',
spawn:'WEAPON_MACHINEPISTOL',
imagem:'WEAPON_MACHINEPISTOL.png',
nivel:5,
max:10,
insumos:[['smgbody',
25],
['sheetmetal',
19],
['dollar',
26000]]},

 {id:'fnfal',
nome:'FN L1A1 / FN FAL',
spawn:'WEAPON_FNFAL',
imagem:'WEAPON_FNFAL.png',
nivel:5,
max:10,
insumos:[['riflebody',
38],
['sheetmetal',
31],
['dollar',
70000]]}
].map(r=>({...r,
origem:'PADRÃO DO SEGMENTO'}));

const MUNICAO_STANDARD_RECIPES=[
 {id:'ammo-pistol',
nome:'Caixa de Munição de Pistola',
spawn:'caixa_m_pistola',
imagem:'caixa_m_pistola.png',
insumos:[['projectile',
12],
['gunpowder',
10]]},

 {id:'ammo-smg',
nome:'Caixa de Munição de SMG',
spawn:'caixa_m_smg',
imagem:'caixa_m_smg.png',
insumos:[['projectile',
18],
['gunpowder',
17]]},

 {id:'ammo-rifle',
nome:'Caixa de Munição de Rifle',
spawn:'caixa_m_rifle',
imagem:'caixa_m_rifle.png',
insumos:[['projectile',
31],
['gunpowder',
24]]},

 {id:'c4',
nome:'C4',
spawn:'c4',
imagem:'c4.png',
insumos:[['explosives',
25],
['plastic',
10]]}
].map(r=>({...r,
origem:'PADRÃO DO SEGMENTO'}));

const LAVAGEM_STANDARD_RECIPES=[
 {id:'pendrive1',
nome:'Pendrive 1',
spawn:'pendrive1',
imagem:'pendrive1.png',
insumos:[['electroniccomponents',
12],
['rubber',
8]]},

 {id:'pendrive2',
nome:'Pendrive 2',
spawn:'pendrive2',
imagem:'pendrive2.png',
insumos:[['electroniccomponents',
14],
['rubber',
10]]},

 {id:'pendrive3',
nome:'Pendrive 3',
spawn:'pendrive3',
imagem:'pendrive3.png',
insumos:[['electroniccomponents',
19],
['rubber',
15]]},

 {id:'pendrive4',
nome:'Pendrive 4',
spawn:'pendrive4',
imagem:'pendrive4.png',
insumos:[['electroniccomponents',
27],
['rubber',
23]]},

 {id:'pendrive5',
nome:'Pendrive 5',
spawn:'pendrive5',
imagem:'pendrive5.png',
insumos:[['electroniccomponents',
40],
['rubber',
30]]},

 {id:'handcuff',
nome:'Algema',
spawn:'handcuff',
imagem:'handcuff.png',
insumos:[['sheetmetal',
3]]},

 {id:'lavagem',
nome:'Máquina de Lavagem',
spawn:'lavagem',
imagem:'lavagem.png',
insumos:[['plastic',
70],
['electroniccomponents',
50]]}
].map(r=>({...r,
origem:'PADRÃO DO SEGMENTO'}));

const DESMANCHE_STANDARD_RECIPES=[
 {id:'blocksignal',
nome:'Bloqueador de Sinal',
spawn:'blocksignal',
imagem:'blocksignal.png',
insumos:[['techtrash',
12],
['elastic',
10]]},

 {id:'lockpick',
nome:'Gazua',
spawn:'lockpick',
imagem:'lockpick.png',
insumos:[['elastic',
14],
['rubber',
8]]},

 {id:'lockpickplus',
nome:'Gazua ++',
spawn:'lockpickplus',
imagem:'lockpickplus.png',
insumos:[['elastic',
18],
['rubber',
13]]},

 {id:'card-illegible',
nome:'Cartão Ilegível',
spawn:'cardillegible',
imagem:'cardillegible.png',
insumos:[['elastic',
7],
['techtrash',
8]]},

 {id:'dismantleplus',
nome:'Desmanche ++',
spawn:'dismantleplus',
imagem:'dismantleplus.png',
insumos:[['elastic',
14],
['techtrash',
15]],
bloqueado:true}
].map(r=>({...r,
origem:'PADRÃO DO SEGMENTO'}));

const MEDIC_STANDARD_RECIPES=[
 {id:'adrenalineclandestine',
nome:'Adrenalina Clandestina',
spawn:'adrenalineclandestine',
imagem:'adrenalina.png',
insumos:[['syringe',
12],
['saline',
10]]},

 {id:'infectedbandage',
nome:'Bandagem Infectada',
spawn:'infectedbandage',
imagem:'infectedbandage.png',
insumos:[['saline',
20]]},

 {id:'adrenalineclandestineplus',
nome:'Adrenalina Clandestina +',
spawn:'adrenalineclandestineplus',
imagem:'adrenalineclandestineplus.png',
insumos:[['syringe',
15],
['saline',
15]],
bloqueado:true}
].map(r=>({...r,
origem:'PADRÃO DO SEGMENTO'}));

const MECHANIC_STANDARD_RECIPES=[
 {id:'notebook',
nome:'Notebook',
spawn:'notebook',
imagem:'notebook.png',
insumos:[['techtrash',
5],
['plastic',
5]]},

 {id:'racesticketplus',
nome:'Ticket de Corrida +',
spawn:'racesticketplus',
imagem:'racesticketplus.png',
insumos:[['paper',
10]],
bloqueado:true}
].map(r=>({...r,
origem:'PADRÃO DO SEGMENTO'}));

const CONTRABANDO_STANDARD_RECIPES=[
 {id:'attachbox',
nome:'Caixa de Attachments',
spawn:'attachbox',
imagem:'attachbox.png',
insumos:[['woodlog',
3],
['sheetmetal',
4]]},

 {id:'pager',
nome:'Pager',
spawn:'pager',
imagem:'pager.png',
insumos:[['plastic',
6],
['techtrash',
4]]}
].map(r=>({...r,
origem:'PADRÃO DO SEGMENTO'}));

const DRUG_COMMON_RECIPES=[
 {id:'hood',
nome:'Capuz',
spawn:'hood',
imagem:'hood.png',
insumos:[['tarp',
5]]},

 {id:'ballisticplate',
nome:'Placa Balística',
spawn:'ballisticplate',
imagem:'ballisticplate.png',
insumos:[['tarp',
12],
['fibrasin',
13]]}
].map(r=>({...r,
origem:'PADRÃO DO SEGMENTO'}));

const DRUG_GROUP_RECIPES={
 Drogas01:[{id:'packdrug1',
nome:'Pacote Selado de Metadona',
spawn:'packdrug1',
imagem:'packdrug1.png',
insumos:[['alcohol',
25],
['ziplock',
50]]}],

 Drogas03:[{id:'packdrug2',
nome:'Pacote Selado de Heroína',
spawn:'packdrug2',
imagem:'packdrug2.png',
insumos:[['acetone',
25],
['ziplock',
50]]}],

 Drogas06:[{id:'packdrug3',
nome:'Pacote Selado de Anfetamina',
spawn:'packdrug3',
imagem:'packdrug3.png',
insumos:[['sulfuric',
25],
['ziplock',
50]]}],

 Drogas09:[{id:'packdrug4',
nome:'Pacote Selado de Crack',
spawn:'packdrug4',
imagem:'packdrug4.png',
insumos:[['acid',
25],
['ziplock',
50]]}]
};

Object.values(DRUG_GROUP_RECIPES).forEach(list=>list.forEach(r=>r.origem='PADRÃO DO GROUP'));

// Solicitação 19/10/2026 - catálogo de craft compartilhado pelas duas mecânicas ilegais.
const MECHANIC_REQUEST_RECIPES_20261019=[
 {id:'mechanic-nitro',nome:'Nitro',spawn:'nitro',insumos:[['sheetmetal',5],['misturaquimica',9]]},
 {id:'mechanic-nitroplus',nome:'Nitro +',spawn:'Nitro+',insumos:[['rubber',16],['sheetmetal',10]]},
 {id:'mechanic-tablet',nome:'Tablet Descartável',spawn:'racestablet',insumos:[['sheetmetal',1],['techtrash',8]]},
 {id:'mechanic-ticket',nome:'Cartão Descartável',spawn:'racesticket',insumos:[['paper',5]]},
 {id:'mechanic-notebook',nome:'Notebook',spawn:'notebook',insumos:[['techtrash',5],['plastic',5]]},
 {id:'mechanic-aerofolio',nome:'Aerofólio Esportivo',spawn:'Aerofolio_Esportivo',insumos:[['sheetmetal',17],['rubber',12]]},
 {id:'mechanic-ticketplus',nome:'Cartão Descartável ++',spawn:'racesticketplus',insumos:[['paper',10]]}
].map(r=>({...r,imagem:r.spawn+'.png',origem:'SOLICITAÇÃO DA MECÂNICA'}));
const MECHANIC02_REQUEST_CONFIG_20261019={
 craft:'-227.82,-1327.89,30.89,85.04',
 farm:'-197.19,-1320.46,31.09,178.59',
 garagemVipBlip:'-210.5,-1308.15,31.29,357.17',
 itensFarm:['paper','techtrash','misturaquimica','sheetmetal','plastic','alcohol','ziplock','rubber'],
 faixaFarm:'8–14'
};

// As receitas das mecânicas agora pertencem ao cadastro salvo de cada Group.
// Migração única da solicitação de 19/10/2026 para o cadastro CANÔNICO
// no bot do Discord. Só uma sessão autorizada ADMIN pode realizar a gravação.
// Nunca cria Groups ausentes e não reverte edições posteriores à migração.
async function persistirSolicitacaoMecanicas20261019(docs=[]){
 if(String(currentProfile?.role||'').toUpperCase()!=='ADMIN'||!currentUser)return {updated:false};
 const groups=['IlegalMechanic02','IlegalMechanic01'].filter(group=>
  docs.some(d=>String(d.data()?.group||d.id).toLowerCase()===group.toLowerCase()));
 if(!groups.length)return {updated:false};
 let updated=false;
 for(const group of groups){
  // Consulta sempre o registro vivo antes de fazer patch (cache pode estar antigo).
  const result=await highOsDiscordRequest('/v1/factions/'+encodeURIComponent(group));
  const old=result.record||{};
  if(old.solicitacaoMecanica20261019===true)continue;
  const p=old.perfilTecnico||{},c=p.craft||{},f=p.farm||{};
  const receitas=mergeRecipeLists(Array.isArray(c.receitas)?c.receitas:[],MECHANIC_REQUEST_RECIPES_20261019);
  const perfilTecnico={...p,craft:{...c,ativo:true,receitas}};
  const patch={perfilTecnico,solicitacaoMecanica20261019:true};
  if(group==='IlegalMechanic02'){
   const cfg=MECHANIC02_REQUEST_CONFIG_20261019;
   const items=new Map((Array.isArray(f.itens)?f.itens:[]).map(x=>[String(x.spawn||'').toLowerCase(),{...x}]));
   for(const spawn of cfg.itensFarm){
    const prev=items.get(spawn)||{};
    items.set(spawn,{...prev,spawn,nome:ITEM_META[spawn]?.nome||prev.nome||spawn,
      imagem:ITEM_META[spawn]?.imagem||prev.imagem||'',qtd:cfg.faixaFarm,
      detalhe:'Coleta de '+cfg.faixaFarm+' unidades',origem:'FARM DA SOLICITAÇÃO'});
   }
   perfilTecnico.craft={...perfilTecnico.craft,cds:cfg.craft,nome:c.nome||'Mecânica Ilegal'};
   perfilTecnico.farm={...f,cds:cfg.farm,itens:[...items.values()]};
   patch.beneficios={...(old.benefits||{}),craft:cfg.craft,farm:cfg.farm,garagemVipBlip:cfg.garagemVipBlip};
  }
  await discordFactionPatch(group,patch);
  updated=true;
 }
 return {updated};
}

const GROUP_EXTRA_RECIPES={
 Armas01:[{id:'extra-packdrug8',
nome:'Pacote Selado de Cannabis',
spawn:'packdrug8',
imagem:'packdrug1.png',
nivel:4,
max:10,
origem:'ADQUIRIDO EM LOJA',
disponibilidade:'TODAS AS FACÇÕES',
insumos:[['kunk',
25],
['ziplock',
50]]}],

 Municao10:[{id:'extra-t54',
nome:'T54',
spawn:'WEAPON_PISTOL_MK2',
imagem:'t54.png',
nivel:5,
max:10,
origem:'CRAFT ADQUIRIDO',
insumos:[['pistolbody',
22],
['sheetmetal',
12],
['dollar',
8500]]}],

 Lavagem02:[{id:'extra-paradise-glock',
nome:'Paradise Glock',
spawn:'WEAPON_PARADISE_GLOCK',
imagem:'glock.png',
origem:'CRAFT EXTRA DO GROUP',
insumos:[['pistolbody',
20],
['sheetmetal',
21],
['dollar',
35000]]}],

 Manicomio:[
  {id:'extra-paradise-glock',
nome:'Paradise Glock',
spawn:'WEAPON_PARADISE_GLOCK',
imagem:'glock.png',
origem:'CRAFT EXTRA DO GROUP',
insumos:[['pistolbody',
20],
['sheetmetal',
21],
['dollar',
35000]]},

  {id:'extra-lockpickplus',
nome:'Gazua ++',
spawn:'lockpickplus',
imagem:'lockpickplus.png',
origem:'CRAFT EXTRA DO GROUP',
insumos:[['elastic',
17],
['rubber',
13]]},

  {id:'extra-hood',
nome:'Capuz',
spawn:'hood',
imagem:'hood.png',
origem:'CRAFT EXTRA DO GROUP',
insumos:[['tarp',
5]]}
 ]
};

function segmentKey(v=''){return alvesNorm(String(v)).replace(/[^a-z0-9]/g,'')}
function standardRecipesForGroup(f={}){
 if(f.semCraft||GROUP_BASE_CORRECTIONS?.[f.group]?.state==='SEM_CRAFT')return [];

 const k=segmentKey(f.segmento),
g=String(f.group||'');
let base=[];

 if(k==='armas')base=ARMAS_STANDARD_RECIPES;

 else if(k==='municao')base=MUNICAO_STANDARD_RECIPES;

 else if(k==='lavagem')base=LAVAGEM_STANDARD_RECIPES;

 else if(k==='desmanche')base=DESMANCHE_STANDARD_RECIPES;

 else if(k==='hospitalilegal'||k==='ilegalmedic')base=MEDIC_STANDARD_RECIPES;

 else if(k==='mecanicaillegal'||k==='ilegalmechanic')base=MECHANIC_STANDARD_RECIPES;

 else if(k==='contrabando')base=CONTRABANDO_STANDARD_RECIPES;

 else if(k==='drogas')base=[...DRUG_COMMON_RECIPES,
...(DRUG_GROUP_RECIPES[g]||[])];

 if(g==='Manicomio')base=[...DRUG_COMMON_RECIPES];

 return [...base,
...(GROUP_EXTRA_RECIPES[g]||[])].map(recipeNormalize);

}
function mergeRecipeLists(base=[],saved=[]){
 const out=[],
idx=new Map();

 [...base,
...saved].forEach(raw=>{const r=recipeNormalize(raw),
key=String(r.spawn||r.id||r.nome).toLowerCase();if(!key)return;if(idx.has(key))out[idx.get(key)]={...out[idx.get(key)],
...r,
insumos:(r.insumos?.length?r.insumos:out[idx.get(key)].insumos)};else{idx.set(key,out.length);out.push(r)}});
return out;

}
let techDraft={craft:{cds:'',
nome:'',
receitas:[]},
farm:{cds:'',
itens:[]},
rota:{nome:'',
inicio:'',
pontos:''},
estruturaExtra:{}};

function clonePlain(v){return JSON.parse(JSON.stringify(v??null))}
// Imagens oficiais dos produtos conforme a Tabela Mercado Negro.
// Para estes spawns o arquivo oficial SEMPRE prevalece sobre valores antigos salvos no Firestore.
const PRODUCT_IMAGE_BY_SPAWN={
 'weapon_vintagepistol':'WEAPON_VINTAGEPISTOL.png',

 'weapon_pistol_mk2':'t54.png',

 'weapon_pistol50':'WEAPON_PISTOL50.png',

 'weapon_machinepistol':'WEAPON_MACHINEPISTOL.png',

 'weapon_assaultsmg':'WEAPON_ASSAULTSMG.png',

 'weapon_fnfal':'WEAPON_FNFAL.png',

 'weapon_specialcarbine_mk2':'sigsauer556.png',

 'weapon_assaultrifle_mk2':'ak102.png',

 'weapon_assaultrifle':'ak74n.png'
};

const PRODUCT_IMAGE_BY_NAME={
 'm1922':'WEAPON_VINTAGEPISTOL.png',
'pistola m1922':'WEAPON_VINTAGEPISTOL.png',

 't54':'t54.png',
'pistola t54':'t54.png',

 'deagle':'WEAPON_PISTOL50.png',
'desert eagle':'WEAPON_PISTOL50.png',
'pistola desert eagle':'WEAPON_PISTOL50.png',

 'tec-9':'WEAPON_MACHINEPISTOL.png',
'tec9':'WEAPON_MACHINEPISTOL.png',

 'f2000':'WEAPON_ASSAULTSMG.png',
'f2000 - mtar.':'WEAPON_ASSAULTSMG.png',
'f2000 - mtar':'WEAPON_ASSAULTSMG.png',

 'fn l1a1 / fn fal':'WEAPON_FNFAL.png',
'fn l1a1':'WEAPON_FNFAL.png',
'fn fal':'WEAPON_FNFAL.png',
'fal':'WEAPON_FNFAL.png',
'fall':'WEAPON_FNFAL.png',

 'sig sauer 556':'sigsauer556.png',
'g3 - sig sauer':'sigsauer556.png',

 'ak-102':'ak102.png',
'ak102':'ak102.png',

 'ak-74n':'ak74n.png',
'ak74n':'ak74n.png'
};

function canonicalProductImage(spawn='',nome='',imagem=''){
 const sp=String(spawn||'').trim().toLowerCase();

 if(PRODUCT_IMAGE_BY_SPAWN[sp])return PRODUCT_IMAGE_BY_SPAWN[sp];

 const nm=alvesNorm(String(nome||'')).trim();

 if(PRODUCT_IMAGE_BY_NAME[nm])return PRODUCT_IMAGE_BY_NAME[nm];

 return String(imagem||'').trim()||String(spawn||'').trim()+'.png';

}
function itemImg(spawn='',imagem='',nome=''){const f=canonicalProductImage(spawn,nome,imagem);
return ITEM_IMG_BASE+encodeURIComponent(f).replace(/%2F/gi,'/')}
function recipeNormalize(r={}){return {id:r.id||('r_'+Math.random().toString(36).slice(2,9)),
nome:r.nome||'',
spawn:r.spawn||'',
imagem:canonicalProductImage(r.spawn,r.nome,r.imagem),
nivel:r.nivel||'',
max:r.max||'',
origem:r.origem||'EXTRA DO GROUP',
disponibilidade:r.disponibilidade||'',
insumos:(r.insumos||[]).map(x=>Array.isArray(x)?{spawn:x[0],
qtd:x[1],
nome:ITEM_META[x[0]]?.nome||x[0],
imagem:ITEM_META[x[0]]?.imagem||''}:{spawn:x.spawn||'',
qtd:x.qtd??'',
nome:x.nome||ITEM_META[x.spawn]?.nome||x.spawn||'',
imagem:x.imagem||ITEM_META[x.spawn]?.imagem||''})};
}
const NON_ROUTE_CRAFT_ITEMS=new Set(['dollar',
'money',
'cash',
'dirtymoney',
'black_money']);

function farmItemsFromCraft(receitas=[]){
 const map=new Map();

 (receitas||[]).forEach(r=>(r.insumos||[]).forEach(x=>{
  const spawn=String(x.spawn||'').trim();if(!spawn||NON_ROUTE_CRAFT_ITEMS.has(spawn.toLowerCase()))return;
  const key=spawn.toLowerCase(),
cur=map.get(key)||{nome:x.nome||ITEM_META[spawn]?.nome||spawn,
spawn,
imagem:x.imagem||ITEM_META[spawn]?.imagem||'',
origem:'CRAFT',
receitas:[],
quantidades:[]};
  if(r.nome&&!cur.receitas.includes(r.nome))cur.receitas.push(r.nome);if(x.qtd!==''&&x.qtd!=null&&!cur.quantidades.includes(String(x.qtd)))cur.quantidades.push(String(x.qtd));map.set(key,cur);
 }));

 return [...map.values()].map(x=>({...x,
qtd:'',
detalhe:`Usado em ${x.receitas.length} receita(s)${x.quantidades.length?' • necessidade: x'+x.quantidades.join('/x'):''}`}));

}
function syncFarmWithCraft(profile=techDraft){
 if(!profile?.craft||!profile?.farm)return profile;

 const auto=farmItemsFromCraft(profile.craft.receitas||[]),
manual=(profile.farm.itens||[]).filter(x=>String(x.origem||'').toUpperCase()!=='CRAFT');

 const autoKeys=new Set(auto.map(x=>String(x.spawn||'').toLowerCase()));
 const especiais=new Map(manual.filter(x=>String(x.origem||'').toUpperCase()==='FARM DA SOLICITAÇÃO')
   .map(x=>[String(x.spawn||'').toLowerCase(),x]));

 // A faixa própria de coleta (8–14), gravada no cadastro, prevalece sobre
 // as quantidades de insumos calculadas automaticamente pelo craft.
 profile.farm.itens=[...auto.map(x=>especiais.get(String(x.spawn||'').toLowerCase())||x),
 ...manual.filter(x=>!autoKeys.has(String(x.spawn||'').toLowerCase()))];

 return profile;

}
function defaultTechProfile(f={}){
 const b=f.beneficios||{},
base=standardRecipesForGroup(f);
 const names={armas:'Armas de Pequeno, Médio e Grande Calibre',
municao:'Munições e Explosivos',
lavagem:'Lavagem / Pendrives',
desmanche:'Desmanche',
drogas:'Drogas',
hospitalilegal:'Hospital Ilegal',
ilegalmedic:'Hospital Ilegal',
mecanicaillegal:'Mecânica Ilegal',
ilegalmechanic:'Mecânica Ilegal',
contrabando:'Contrabando'};

 const out={craft:{cds:b.craft||'',
 nome:names[segmentKey(f.segmento)]||'',
 receitas:base},
 farm:{cds:b.farm||'',
 itens:[]},
rota:{nome:b.rotaExclusiva?`RotaExclusiva${f.group||''}`:'',
inicio:'',
pontos:b.rotaBlips||''},
estruturaExtra:{}};
return syncFarmWithCraft(out);

}
function mergedTechProfile(f={}){
 const d=defaultTechProfile(f),
p=clonePlain(f.perfilTecnico||{})||{};

 const semCraft=!!(f.semCraft||GROUP_BASE_CORRECTIONS?.[f.group]?.state==='SEM_CRAFT'||p?.craft?.ativo===false);

 const saved=Array.isArray(p?.craft?.receitas)?p.craft.receitas:[];

 const receitas=semCraft?[]:mergeRecipeLists(d.craft.receitas,saved);
 const canonicalV9=Array.isArray(f?.estruturaCatalogoV9)?f.estruturaCatalogoV9:null;
const out={craft:{cds:p?.craft?.cds??d.craft.cds,
 nome:p?.craft?.nome||d.craft.nome,
ativo:!semCraft,
receitas},
farm:{cds:p?.farm?.cds??d.farm.cds,
 itens:Array.isArray(p?.farm?.itens)?p.farm.itens.map(x=>({...x})):[]},
rota:{nome:p?.rota?.nome??d.rota.nome,
inicio:p?.rota?.inicio??d.rota.inicio,
pontos:p?.rota?.pontos??d.rota.pontos,
origem:p?.rota?.origem||'',
status:p?.rota?.status||''},
estruturaExtra:{...(d.estruturaExtra||{}),
...(p?.estruturaExtra||{})},
estruturaCatalogo:(canonicalV9|| (Array.isArray(p?.estruturaCatalogo)?p.estruturaCatalogo:[])).map(x=>({...x}))};
syncFarmWithCraft(out);
 return out;
}
function renderTechProfile(f){
 techDraft=mergedTechProfile(f);
$('#fTechCraftCds').value=techDraft.craft.cds||'';
$('#fTechCraftNome').value=techDraft.craft.nome||'';
$('#fTechFarmCds').value=techDraft.farm.cds||'';
$('#fTechRouteName').value=techDraft.rota.nome||'';
$('#fTechRouteStart').value=techDraft.rota.inicio||'';
$('#fTechRoutePoints').value=techDraft.rota.pontos||'';
renderCraftRecipes();
renderFarmItems();
renderRouteOverview();
renderStructureSnapshot(f);
renderConnectedRequests();
if(typeof gsRender==='function')gsRender(true);

}
function getTechProfileFromForm(){
 if(!techDraft)techDraft={craft:{receitas:[]},
farm:{itens:[]},
rota:{}};

 techDraft.craft.cds=$('#fTechCraftCds')?.value.trim()||'';
techDraft.craft.nome=$('#fTechCraftNome')?.value.trim()||'';
techDraft.farm.cds=$('#fTechFarmCds')?.value.trim()||'';
techDraft.rota.nome=$('#fTechRouteName')?.value.trim()||'';
techDraft.rota.inicio=$('#fTechRouteStart')?.value.trim()||'';
techDraft.rota.pontos=$('#fTechRoutePoints')?.value.trim()||'';

 // manter compatibilidade com campos legados da estrutura
 if($('#fCraft'))$('#fCraft').value=techDraft.craft.cds;
if($('#fFarm'))$('#fFarm').value=techDraft.farm.cds;
if($('#fRotaBlips'))$('#fRotaBlips').value=techDraft.rota.pontos;
techDraft.rota.nome=$('#fRotaExclusiva')?.checked?`RotaExclusiva${$('#fGroup')?.value||''}`:'';

 syncFarmWithCraft(techDraft);
renderFarmItems();
return clonePlain(techDraft);

}
function recipeCard(r,i){const ins=(r.insumos||[]).map((x,j)=>`<div class="tech-ingredient"><img loading="lazy" decoding="async" alt="" src="${esc(itemImg(x.spawn,x.imagem))}" onerror="this.style.opacity=.18"><div><b>${esc(x.nome||x.spawn||'Item')}</b><span>${esc(x.spawn||'—')} • x${esc(x.qtd)}</span></div><button type="button" class="tech-remove admin-only" data-remove-ing="${i}:${j}" title="Remover">×</button></div>`).join('');
return `<article class="tech-recipe-card"><div class="tech-recipe-art"><img loading="lazy" decoding="async" alt="" src="${esc(itemImg(r.spawn,r.imagem,r.nome))}" onerror="this.style.opacity=.18"></div><div class="tech-recipe-body"><div class="tech-recipe-title"><div><b>${esc(r.nome||'Receita')}</b><span>${esc(r.spawn||'SEM SPAWN')}</span></div><em>${esc(r.origem||'GROUP')}</em></div><div class="tech-recipe-kpis"><span>NÍVEL <b>${esc(r.nivel||'—')}</b></span><span>MÁX. <b>${esc(r.max||'—')}</b></span><span>INSUMOS <b>${r.insumos?.length||0}</b></span></div><div class="tech-ingredients">${ins||'<small class="muted">Sem insumos cadastrados.</small>'}</div><div class="tech-recipe-actions"><button type="button" class="mini-btn" data-edit-recipe="${i}">ABRIR RECEITA</button><button type="button" class="mini-btn danger admin-only" data-remove-recipe="${i}">REMOVER DO GROUP</button></div></div></article>`}
function renderCraftRecipes(){const box=$('#groupCraftRecipes');
if(!box)return;
const rs=techDraft?.craft?.receitas||[];
$('#techCraftSummary').textContent=`${rs.length} receita(s) vinculada(s) a este Group`;
box.innerHTML=rs.length?rs.map(recipeCard).join(''):'<div class="delivery-no-change">Nenhuma receita vinculada a este Group.</div>';
box.querySelectorAll('[data-remove-recipe]').forEach(b=>b.onclick=()=>{techDraft.craft.receitas.splice(+b.dataset.removeRecipe,1);syncFarmWithCraft();renderCraftRecipes();renderFarmItems();updateDeliveryPreview();renderConnectedRequests()});
box.querySelectorAll('[data-edit-recipe]').forEach(b=>b.onclick=()=>editRecipe(+b.dataset.editRecipe));
box.querySelectorAll('[data-remove-ing]').forEach(b=>b.onclick=()=>{const [ri,
ii]=b.dataset.removeIng.split(':').map(Number);techDraft.craft.receitas[ri].insumos.splice(ii,1);syncFarmWithCraft();renderCraftRecipes();renderFarmItems();updateDeliveryPreview();renderConnectedRequests()});
}
function ingredientEditorRow(x={},i=0){const sp=String(x.spawn||'');
return `<div class="ingredient-editor-row" data-ing-row="${i}"><div class="ingredient-editor-art"><img loading="lazy" decoding="async" alt="" src="${esc(itemImg(sp,x.imagem,x.nome))}" onerror="this.style.opacity=.18"></div><label>Item<input data-ing-name value="${esc(x.nome||ITEM_META[sp]?.nome||sp)}" placeholder="Nome do insumo"></label><label>Spawn<input data-ing-spawn value="${esc(sp)}" placeholder="spawn_do_item"></label><label>Quantidade<input data-ing-qty value="${esc(x.qtd||'')}" placeholder="Ex.: 22"></label><button type="button" class="tech-remove ingredient-remove" data-ing-remove title="Remover insumo">×</button></div>`}
function renderIngredientEditor(items=[]){const box=$('#recipeIngredientRows');
if(!box)return;
box.innerHTML=items.length?items.map(ingredientEditorRow).join(''):'<div class="route-empty"><b>SEM INSUMOS</b><span>Adicione os itens necessários para esta receita.</span></div>';
box.querySelectorAll('[data-ing-remove]').forEach((b,i)=>b.onclick=()=>{const rows=readIngredientEditor();rows.splice(i,1);renderIngredientEditor(rows)});
box.querySelectorAll('[data-ing-spawn]').forEach(inp=>inp.onchange=()=>{const row=inp.closest('[data-ing-row]'),
sp=inp.value.trim(),
name=row?.querySelector('[data-ing-name]'),
img=row?.querySelector('img');if(name&&!name.value.trim())name.value=ITEM_META[sp]?.nome||sp;if(img)img.src=itemImg(sp,ITEM_META[sp]?.imagem||'',name?.value||sp)})}
function readIngredientEditor(){return [...document.querySelectorAll('#recipeIngredientRows [data-ing-row]')].map(row=>{const sp=row.querySelector('[data-ing-spawn]')?.value.trim()||'';return {spawn:sp,
nome:row.querySelector('[data-ing-name]')?.value.trim()||ITEM_META[sp]?.nome||sp,
qtd:row.querySelector('[data-ing-qty]')?.value.trim()||'',
imagem:ITEM_META[sp]?.imagem||''}}).filter(x=>x.spawn||x.nome)}
let recipeEditorOriginal=null;
function closeRecipeEditor(){ recipeEditorOriginal=null;$('#recipeEditorModal')?.classList.add('hidden') }
function editRecipe(i){const r=techDraft?.craft?.receitas?.[i];
if(!r)return;
recipeEditorOriginal=clonePlain(r);
$('#recipeEditorIndex').value=String(i);
$('#recipeEditorName').value=r.nome||'';
$('#recipeEditorSpawn').value=r.spawn||'';
$('#recipeEditorLevel').value=r.nivel||'';
$('#recipeEditorMax').value=r.max||'';
if($('#recipeEditorOrigin'))$('#recipeEditorOrigin').value=r.origem||'EXTRA DO GROUP';
$('#recipeEditorTitle').textContent=r.nome||'RECEITA DO GROUP';
$('#recipeEditorImage').src=itemImg(r.spawn,r.imagem,r.nome);
renderIngredientEditor(r.insumos||[]);
$('#recipeEditorModal').classList.remove('hidden')}
function addRecipe(){const r=recipeNormalize({origem:'EXTRA DO GROUP'});
techDraft.craft.receitas.push(r);
editRecipe(techDraft.craft.receitas.length-1)}
function farmItemCard(x,i){const auto=String(x.origem||'').toUpperCase()==='CRAFT';
return `<div class="tech-farm-item route-item-card"><div class="route-item-art"><img loading="lazy" decoding="async" alt="" src="${esc(itemImg(x.spawn,x.imagem))}" onerror="this.style.opacity=.18"></div><div class="route-item-copy"><b>${esc(x.nome||x.spawn||'Item')}</b><span>${esc(x.spawn||'—')}</span><small>${auto?'VINCULADO AO CRAFT':esc(x.qtd||x.detalhe||'ITEM MANUAL')}</small></div><div class="route-item-actions"><button type="button" class="mini-btn" data-edit-farm="${i}">VER ITEM</button>${auto?'':`<button type="button" class="tech-remove admin-only" data-remove-farm="${i}">×</button>`}</div></div>`}
function renderFarmItems(){const box=$('#groupFarmItems');
if(!box)return;
const xs=techDraft?.farm?.itens||[];
box.innerHTML=xs.length?xs.map(farmItemCard).join(''):'<div class="route-empty"><b>NENHUM ITEM VINCULADO</b><span>Cadastre receitas no Craft para os insumos aparecerem automaticamente aqui.</span></div>';
box.querySelectorAll('[data-remove-farm]').forEach(b=>b.onclick=()=>{techDraft.farm.itens.splice(+b.dataset.removeFarm,1);renderFarmItems();renderConnectedRequests();updateDeliveryPreview()});
box.querySelectorAll('[data-edit-farm]').forEach(b=>b.onclick=()=>editFarmItem(+b.dataset.editFarm));
}
function closeFarmEditor(){ $('#farmEditorModal')?.classList.add('hidden') }
function editFarmItem(i){const x=techDraft?.farm?.itens?.[i];
if(!x)return;
const auto=String(x.origem||'').toUpperCase()==='CRAFT';
$('#farmEditorIndex').value=String(i);
$('#farmEditorName').value=x.nome||'';
$('#farmEditorSpawn').value=x.spawn||'';
$('#farmEditorQty').value=x.qtd||x.detalhe||'';
$('#farmEditorTitle').textContent=x.nome||'ITEM DO FARM';
$('#farmEditorImage').src=itemImg(x.spawn,x.imagem,x.nome);
$('#farmEditorName').disabled=auto;
$('#farmEditorSpawn').disabled=auto;
$('#farmEditorQty').disabled=auto;
$('#farmEditorSave').classList.toggle('hidden',auto);
$('#farmEditorHelp').textContent=auto?'Este item é gerado automaticamente pelos insumos do Craft. Para alterá-lo, edite a receita de origem.':'Edite os dados do item manual da rota.';
const info=$('#farmLinkedInfo');
if(auto){info.classList.remove('hidden');
info.innerHTML=`<span>VÍNCULO AUTOMÁTICO</span><b>CRAFT → FARM</b><p>${esc(x.detalhe||'Este insumo é necessário em uma ou mais receitas do Group.')}</p>`}else info.classList.add('hidden');
$('#farmEditorModal').classList.remove('hidden')}
function addFarmItem(){techDraft.farm.itens.push({nome:'',
spawn:'',
qtd:'',
imagem:'',
origem:'MANUAL'});
editFarmItem(techDraft.farm.itens.length-1)}
function routePointList(raw=''){
 const txt=String(raw||'').trim();
if(!txt)return [];

 let pts=txt.split(/\r?\n|·/).map(x=>x.trim()).filter(Boolean);

 if(pts.length<=1){const found=txt.match(/\{?\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?(?:\s*,\s*-?\d+(?:\.\d+)?)?\s*\}?/g);
if(found?.length)pts=found.map(x=>x.trim())}
 return pts;

}
function setRouteExclusive(value){
 const cb=$('#fRotaExclusiva');
if(!cb)return;
cb.checked=!!value;

 if(techDraft?.rota)techDraft.rota.nome=cb.checked?`RotaExclusiva${$('#fGroup')?.value||''}`:'';

 renderRouteOverview();
updateDeliveryPreview();
renderConnectedRequests();

}
function renderRouteOverview(){
 const exclusive=!!$('#fRotaExclusiva')?.checked,
pts=routePointList(techDraft?.rota?.pontos||$('#fTechRoutePoints')?.value||''),
start=techDraft?.rota?.inicio||$('#fTechRouteStart')?.value||'';

 $('#routeTypeLabel')&&( $('#routeTypeLabel').textContent=exclusive?'ROTA EXCLUSIVA':'ROTA PADRÃO');

 $('#routeTypeHelp')&&( $('#routeTypeHelp').textContent=exclusive?'Este Group possui uma rota própria de farm.':'Utiliza a rota padrão do segmento.');

 $('#routePointCount')&&( $('#routePointCount').textContent=exclusive?String(pts.length):'—');

 $('#routePointHint')&&( $('#routePointHint').textContent=exclusive?(pts.length?`${pts.length} coordenada(s) cadastrada(s).`:'Ainda sem CDS cadastradas.'):'Não se aplica à rota padrão.');

 $('#routeStartDisplay')&&( $('#routeStartDisplay').textContent=start||'—');

 document.querySelectorAll('[data-route-exclusive]').forEach(b=>b.classList.toggle('active',String(+exclusive)===b.dataset.routeExclusive));

 const ex=$('#exclusiveRouteBox');
if(ex)ex.classList.toggle('hidden',!exclusive);

 $('#exclusiveRouteSummary')&&( $('#exclusiveRouteSummary').textContent=`${pts.length} CDS cadastrada${pts.length===1?'':'s'}`);

 const list=$('#routePointsList');
if(list)list.innerHTML=pts.length?pts.map((pt,i)=>`<div class="route-point-row"><span>${String(i+1).padStart(2,'0')}</span><code>${esc(pt)}</code></div>`).join(''):'<div class="route-empty"><b>SEM CDS</b><span>Adicione as coordenadas da rota exclusiva no editor abaixo.</span></div>';

}
function toggleRoutePoints(){const drawer=$('#routePointsDrawer'),
btn=$('#routePointsToggleBtn');
if(!drawer||!btn)return;
const willOpen=drawer.classList.contains('hidden');
drawer.classList.toggle('hidden',!willOpen);
btn.textContent=willOpen?'OCULTAR CDS DA ROTA':'VER CDS DA ROTA';
}
function renderStructureSnapshot(f=currentFactionFromForm()){const b=f?.beneficios||getFormBenefits(),
t=techDraft||mergedTechProfile(f),
items=[];
const add=(n,v)=>{if(v)items.push([n,
v])};
add('Craft',t.craft?.cds||b.craft);
add('Farm / Início',t.rota?.inicio||t.farm?.cds||b.farm);
add('Tipo da Rota',b.rotaExclusiva?`Exclusiva • ${routePointList(t.rota?.pontos||b.rotaBlips).length} CDS`:'Padrão');
add('Garagem Pública',[b.garagemPublicaBlip,
b.garagemPublicaSpawn].filter(Boolean).join(' / '));
add('Garagem VIP',[b.garagemVipBlip,
b.garagemVipSpawn].filter(Boolean).join(' / '));
add('Heliponto',[b.helipontoBlip,
b.helipontoSpawn].filter(Boolean).join(' / '));
add('Rádio',b.radio);
add('Baú',b.bau);
add('Loja de Roupas',b.lojaRoupas);
add('Barbearia',b.barbearia);
add('Tatuagem',b.tatuagem);
add('Shop Exclusivo',b.shopExclusivo);
add('Arena',b.arena);
add('Telão',b.telaoCds||b.telaoNome);
Object.entries(t.estruturaExtra||{}).forEach(([k,
v])=>{if(v&&k!=='fontePerfil')add(({coordenadaBase:'Coordenada Base',
garagemDeluxe:'Garagem Deluxe',
shopDeluxe:'Shop Deluxe',
academia:'Academia',
bar:'Bar'}[k]||k),v)});
const box=$('#groupStructureSnapshot');
if(box)box.innerHTML=items.length?items.map(([n,
v])=>`<div class="structure-chip"><span>${esc(n)}</span><b>${esc(v)}</b></div>`).join(''):'<div class="delivery-no-change">Nenhuma estrutura técnica cadastrada.</div>';
}
function techChanged(oldF,newF){return JSON.stringify(mergedTechProfile(oldF))!==JSON.stringify(newF.perfilTecnico||mergedTechProfile(newF))}
function techAutoRequests(f=currentFactionFromForm()){
 const old=faccoes.find(x=>x.group===f.group)||{},
now=f.perfilTecnico||getTechProfileFromForm(),
oldT=mergedTechProfile(old),
out=[];

 if(JSON.stringify(oldT.craft)!==JSON.stringify(now.craft)){
  const lines=['Assunto: Atualização do Craft do Group',
'',
'Solicitação:',
'',
`- Atualizar o Craft do Group ${f.group};`,
now.craft.cds?`- CDS do Craft: ${fmtCds(now.craft.cds)}`:'',
'',
 '- Produtos / receitas:'];

  (now.craft.receitas||[]).forEach(r=>{lines.push(`- ${r.nome}${r.spawn?` (${r.spawn})`:''}${r.nivel?` | Nível ${r.nivel}`:''}${r.max?` | Máx. ${r.max}`:''}`);lines.push(`  Receita: ${(r.insumos||[]).map(x=>`${x.nome||x.spawn} x${x.qtd}`).join(' + ')||'Sem insumos cadastrados'}`)});
lines.push('',`- Permissão: ${f.group}.`);
out.push({tipo:'ITENS',
titulo:'Atualização de Craft / Receitas',
texto:lines.filter((x,i)=>x!==''||lines[i-1]!=='').join('\n')});

 }
 if(JSON.stringify(oldT.farm)!==JSON.stringify(now.farm)||JSON.stringify(oldT.rota)!==JSON.stringify(now.rota)){
  const pts=String(now.rota?.pontos||'').split(/\r?\n|·/).map(x=>x.trim()).filter(Boolean),
routeStart=String(now.rota?.inicio||'').trim(),
items=(now.farm?.itens||[]).map(x=>`- ${x.nome||x.spawn}${x.spawn?` (${x.spawn})`:''}${x.qtd?` — ${x.qtd}`:''}${x.detalhe?` — ${x.detalhe}`:''}`);

  out.push({tipo:'ROTA_FARM',
titulo:'Farm / Rota do Group',
texto:['Assunto: Ativação / atualização de rota de farm exclusiva',
'',
'Solicitação:',
'',
`- Group: ${f.group}`,
now.farm?.cds?`- Farm: ${fmtCds(now.farm.cds)}`:'',
now.rota?.nome?`- Rota: ${now.rota.nome}`:'',
routeStart?`- Início da rota: ${fmtCds(routeStart)}`:'',
'',
...(items.length?['- Itens do Farm:',
...items,
'']:[]),
'- Blips da rota:',
...(pts.length?pts:['{ CDS },'])].filter(Boolean).join('\n')});

 }
 return out;

}
const _autoDeliveryRequestsV62=autoDeliveryRequests;
autoDeliveryRequests=function(f=currentFactionFromForm()){return [..._autoDeliveryRequestsV62(f),
...techAutoRequests(f)]};

const _updateDeliveryPreviewV62=updateDeliveryPreview;
updateDeliveryPreview=function(){getTechProfileFromForm();
_updateDeliveryPreviewV62();
try{renderStructureSnapshot(currentFactionFromForm());
renderConnectedRequests()}catch{}};

function requestFingerprint(r={}){return `${String(r.group||'').toUpperCase()}|${String(r.tipo||'').toUpperCase()}|${String(r.texto||'').replace(/\s+/g,' ').trim().toLowerCase()}`}
const technicalRequestInFlight=new Map();
async function archiveTechnicalRequest(r,f={},origem='ALTERACAO_GROUP'){
 const group=f.group||r.group||'',
texto=r.texto||'',
tipo=r.tipo||'GERAL';
if(!group||!texto)return null;

 const fp=requestFingerprint({group,
tipo,
texto}),
dup=requestRecords.find(x=>x.status==='PENDENTE'&&x.fingerprint===fp);
if(dup)return dup;
if(technicalRequestInFlight.has(fp))return technicalRequestInFlight.get(fp);

 const createPromise=(async()=>{
 const payload={isModelo:false,
status:'PENDENTE',
tipo,
group,
faccao:f.faccao||'',
assunto:r.titulo||r.assunto||requestTypeName(tipo),
titulo:r.titulo||'',
texto,
origem,
solicitadoPor:currentUser?.email||'',
createdAt:serverTimestamp(),
createdAtText:new Date().toISOString(),
createdBy:currentUser?.email||'',
fingerprint:fp};

 const ref=await addDoc(reqCol,payload),
item={id:ref.id,
...clonePlain(payload),
createdAt:null};
requestRecords.unshift(item);
return item;
 })();
 technicalRequestInFlight.set(fp,createPromise);
 try{return await createPromise}
 finally{technicalRequestInFlight.delete(fp)}

}
function fmtRequestWhen(r={}){const d=r.createdAtText?new Date(r.createdAtText):null;
return d&&!isNaN(d)?d.toLocaleString('pt-BR'):'—'}
async function copyArchivedRequest(id,btn){const r=requestRecords.find(x=>x.id===id);
if(!r?.texto)return;
try{await navigator.clipboard.writeText(r.texto);
const o=btn.textContent;
btn.textContent='COPIADO ✓';
setTimeout(()=>btn.textContent=o,1200)}catch{}}
function renderConnectedRequests(){
 const box=$('#groupConnectedRequests');
if(!box)return;
const f=currentFactionFromForm(),
group=f?.group||$('#fGroup')?.value||'';
let pending=[];
try{pending=autoDeliveryRequests(f)}catch{}
 const archived=requestRecords.filter(x=>x.group===group).slice(0,60);

 const pendingHtml=pending.length?`<div class="request-archive-section"><div class="request-archive-head"><b>DEMANDAS GERADAS PELAS ALTERAÇÕES ATUAIS</b><span>${pending.length} pendente(s) de salvar</span></div>${pending.map((r,i)=>`<article class="delivery-request-card request-live"><div><b>${i+1}. ${esc(r.titulo)}</b><span>${esc(r.tipo)}</span></div><pre>${esc(r.texto)}</pre></article>`).join('')}</div>`:'<div class="delivery-no-change">Nenhuma nova demanda pelas alterações atuais.</div>';

 const archiveHtml=archived.length?`<div class="request-archive-section"><div class="request-archive-head"><b>ARQUIVO DE SOLICITAÇÕES DO GROUP</b><span>${archived.length} registro(s)</span></div>${archived.map(r=>`<article class="delivery-request-card archived-request"><div><b>${esc(r.assunto||r.titulo||requestTypeName(r.tipo))}</b><span class="req-status s-${String(r.status||'PENDENTE').toLowerCase()}">${esc(r.status||'PENDENTE')}</span></div><div class="request-audit-meta">${esc(fmtRequestWhen(r))} • ${esc(r.solicitadoPor||r.createdBy||'—')} • ${esc(r.origem||'—')}</div><pre>${esc(r.texto||'')}</pre><button type="button" class="mini-btn copy-archived-request" data-request-id="${esc(r.id)}">COPIAR</button></article>`).join('')}</div>`:'<div class="delivery-no-change">Este Group ainda não possui solicitações arquivadas.</div>';

 box.innerHTML=pendingHtml+archiveHtml;
box.querySelectorAll('.copy-archived-request').forEach(b=>b.onclick=()=>copyArchivedRequest(b.dataset.requestId,b));

}
$('#addCraftRecipeBtn')?.addEventListener('click',addRecipe);
$('#addFarmItemBtn')?.addEventListener('click',addFarmItem);
$('#routePointsToggleBtn')?.addEventListener('click',toggleRoutePoints);
document.querySelectorAll('[data-route-exclusive]').forEach(b=>b.addEventListener('click',()=>setRouteExclusive(b.dataset.routeExclusive==='1')));
$('#fRotaExclusiva')?.addEventListener('change',renderRouteOverview);

['fTechCraftCds',
'fTechCraftNome',
'fTechFarmCds',
'fTechRouteName',
'fTechRouteStart',
'fTechRoutePoints'].forEach(id=>$('#'+id)?.addEventListener('input',()=>{getTechProfileFromForm();renderRouteOverview();renderConnectedRequests();renderStructureSnapshot(currentFactionFromForm());}));

document.querySelectorAll('.tech-tab').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.tech-tab').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.tech-panel').forEach(p=>p.classList.toggle('active',p.dataset.techPanel===b.dataset.techTab));if(b.dataset.techTab==='farm')renderRouteOverview();if(b.dataset.techTab==='estrutura')renderStructureSnapshot(currentFactionFromForm());if(b.dataset.techTab==='solicitacoes')renderConnectedRequests()}));

// Alvesinho usa o mesmo perfil do Group — sem base paralela.



// HIGH OS V6.4 · ação de atualização da base técnica
$('#updateProfilesBtn')?.addEventListener('click',updateOfficialGroupProfiles);

// HIGH OS V6.6 · Farm/Rota sincronizados automaticamente com os insumos do Craft.

// HIGH OS V6.7 · Perfil do Group em página + Rota Padrão/Exclusiva organizada.

// HIGH OS V6.9 · Fluxo correto: Perfil → comparação → Solicitação. Exceção: Rota Exclusiva, em que a Solicitação com CDS do takefarm alimenta o Perfil Técnico.

// HIGH OS V7.2 · Perfil Operacional completo do Group/QG
const OPERATIONAL_PROFILE_VERSION='07/09/2026 · Perfil Operacional V7.2';

const OP_KNOWN_EXTRAS={
 Armas02:{telao:{ativo:true,
tipo:'Hall',
modelo:'paradise_telao01a',
postit:'2685.14,3386.41,61.70',
cds:'2684.81,3386.92,58.82,164.41',
permissao:'Armas02',
sons:['2662.59,3397.22,58.82,286.3',
'2691.1,3386.87,60.57,331.66',
'2720.27,3419.87,59.08,107.72',
'2654.06,3417.68,57.71,187.09']}},

 Desmanche07:{lojaFac:{cds:'2189.12,4670.27,37.54,325.99'},
barbearia:{cds:'2268.74,4607.04,37.59,59.53'},
tatuagem:{cds:'2288.37,4562.1,37.66,323.15'},
roupas:{cds:'2273.21,4608.11,37.59,130.4'},
garagens:[{tipo:'PUBLICA',
blip:'2193.82,4616.75,39.38,147.41',
spawn:'2192.91,4609.84,38.75,325.99'},
{tipo:'PUBLICA_2',
blip:'2196.19,4617.57,39.38,136.07',
spawn:'2194.11,4610.75,39.38,136.07'},
{tipo:'SERVICO',
blip:'2222.68,4612.5,37.54,345.83',
spawn:'2227.86,4612.09,37.31,56.7'}],
helipontos:[{blip:'2199.82,4614.74,39.38,133.23',
spawn:'2194.11,4610.75,39.38,136.07'}]},

 Municao10:{telao:{ativo:false,
tipo:'',
modelo:'',
postit:'',
cds:'',
permissao:'Municao10',
sons:[]}}
};

function opPair(v=''){const parts=String(v||'').replace(/\t/g,' ').split(/\s*\/\s*/).map(x=>x.trim()).filter(Boolean);
return {blip:parts[0]||'',
spawn:parts[1]||''}}
function opBlank(){return {localizacao:{nome:'',
cdsPrincipal:''},
lojaFac:{cds:''},
bar:{cds:''},
barbearia:{cds:''},
tatuagem:{cds:''},
roupas:{cds:''},
uniforme:{local:'',
arquivo:''},
arena:{cds:''},
garagens:[],
helipontos:[],
blindados:{vagas:'',
blip:'',
spawn:'',
veiculos:''},
telao:{ativo:false,
tipo:'',
modelo:'',
postit:'',
cds:'',
permissao:'',
sons:['',
'',
'',
'']}}}
function opMerge(a={},b={}){const out={...opBlank(),
...clonePlain(a||{}),
...clonePlain(b||{})};
['localizacao',
'lojaFac',
'bar',
'barbearia',
'tatuagem',
'roupas',
'uniforme',
'arena',
'blindados',
'telao'].forEach(k=>out[k]={...(opBlank()[k]||{}),
...(a?.[k]||{}),
...(b?.[k]||{})});
out.garagens=Array.isArray(b?.garagens)&&b.garagens.length?clonePlain(b.garagens):Array.isArray(a?.garagens)?clonePlain(a.garagens):[];
out.helipontos=Array.isArray(b?.helipontos)&&b.helipontos.length?clonePlain(b.helipontos):Array.isArray(a?.helipontos)?clonePlain(a.helipontos):[];
out.telao.sons=[...(b?.telao?.sons?.length?b.telao.sons:(a?.telao?.sons||[])),
'',
'',
'',
''].slice(0,4);
return out}
function operationalFromExisting(f={}){
 const o=opBlank(),
b=f.beneficios||{},
src=f.perfilFonte||GROUP_PROFILE_SOURCE?.[f.group]||{},
corr=GROUP_BASE_CORRECTIONS?.[f.group]||{};

 o.localizacao.nome=f.qg||cleanProfileValue(src.LOCAL||'');
o.localizacao.cdsPrincipal=corr.cds||f.perfilBase?.cds||f.cds||cleanProfileValue(src.COORDENADA||'');

 o.barbearia.cds=b.barbearia||cleanProfileValue(src.BARBEARIA||'');
o.tatuagem.cds=b.tatuagem||cleanProfileValue(src.TATUAGEM||'');
o.roupas.cds=b.lojaRoupas||cleanProfileValue(src['LOJA DE ROUPAS']||'');
o.lojaFac.cds=b.shopExclusivo||cleanProfileValue(src['SHOP EXCLUSIVO']||src['SHOP DELUXE']||'');
o.bar.cds=cleanProfileValue(f.perfilTecnico?.estruturaExtra?.bar||src.BAR||'');
o.arena.cds=b.arena||cleanProfileValue(src.ARENA||'');

 const pub=opPair(cleanProfileValue(src['GARAGEM PUBLICA']||'')),
vip=opPair(cleanProfileValue(src['GARAGEM VIP FAC']||'')),
deluxe=opPair(cleanProfileValue(src['GARAGEM DELUXE']||''));

 if(b.garagemPublicaBlip||pub.blip)o.garagens.push({tipo:'PUBLICA',
blip:b.garagemPublicaBlip||pub.blip,
spawn:b.garagemPublicaSpawn||pub.spawn,
veiculos:'',
vagas:''});

 if(b.garagemVipBlip||vip.blip)o.garagens.push({tipo:'FACCAO',
blip:b.garagemVipBlip||vip.blip,
spawn:b.garagemVipSpawn||vip.spawn,
veiculos:b.garagemVipVeiculos||'',
vagas:''});

 if(deluxe.blip)o.garagens.push({tipo:'SERVICO',
blip:deluxe.blip,
spawn:deluxe.spawn,
veiculos:'',
vagas:''});

 if(b.helipontoBlip||b.helipontoSpawn)o.helipontos=[{blip:b.helipontoBlip||'',
spawn:b.helipontoSpawn||''}];

 o.telao={ativo:!!b.telao,
tipo:b.telao?'Hall':'',
modelo:b.telaoNome||'',
postit:b.telaoPostit||'',
cds:b.telaoCds||'',
permissao:f.group||'',
sons:Array.isArray(b.telaoSons)&&b.telaoSons.some(Boolean)?b.telaoSons:[1,2,3,4].map(i=>b['telaoCaixa'+i]||'')};

 return opMerge(o,OP_KNOWN_EXTRAS[f.group]||{});

}
const _mergedTechProfileV71=mergedTechProfile;
mergedTechProfile=function(f={}){const out=_mergedTechProfileV71(f);
out.operacional=opMerge(operationalFromExisting(f),f.perfilTecnico?.operacional||out.operacional||{});
return out};

function opGet(id){return $('#'+id)?.value?.trim?.()||''}
function operationalFromForm(){
 const garages=[
  {tipo:'PUBLICA',
blip:opGet('fOpPub1Blip'),
spawn:opGet('fOpPub1Spawn'),
veiculos:'',
vagas:''},

  {tipo:'PUBLICA_2',
blip:opGet('fOpPub2Blip'),
spawn:opGet('fOpPub2Spawn'),
veiculos:'',
vagas:''},

  {tipo:'FACCAO',
blip:opGet('fOpVipBlip'),
spawn:opGet('fOpVipSpawn'),
veiculos:opGet('fOpVipVehicles'),
vagas:''},

  {tipo:'SERVICO',
blip:opGet('fOpServiceBlip'),
spawn:opGet('fOpServiceSpawn'),
veiculos:opGet('fOpServiceVehicles'),
vagas:''}
 ].filter(x=>x.blip||x.spawn||x.veiculos);

 return {localizacao:{nome:opGet('fOpQGName'),
cdsPrincipal:opGet('fOpMainCds')},
lojaFac:{cds:opGet('fOpLojaFac')},
bar:{cds:opGet('fOpBar')},
barbearia:{cds:opGet('fOpBarbearia')},
tatuagem:{cds:opGet('fOpTatuagem')},
roupas:{cds:opGet('fOpRoupas')},
uniforme:{local:opGet('fOpUniformeLocal'),
arquivo:opGet('fOpUniformeArquivo')},
arena:{cds:opGet('fOpArena')},
garagens:garages,
helipontos:(opGet('fOpHeliBlip')||opGet('fOpHeliSpawn'))?[{blip:opGet('fOpHeliBlip'),
spawn:opGet('fOpHeliSpawn')}]:[],
blindados:{vagas:opGet('fOpArmoredSlots'),
blip:opGet('fOpArmoredBlip'),
spawn:opGet('fOpArmoredSpawn'),
veiculos:opGet('fOpArmoredVehicles')},
telao:{ativo:!!(opGet('fOpTelaoModelo')||opGet('fOpTelaoPostit')||opGet('fOpTelaoCds')),
tipo:opGet('fOpTelaoTipo'),
modelo:opGet('fOpTelaoModelo'),
postit:opGet('fOpTelaoPostit'),
cds:opGet('fOpTelaoCds'),
permissao:opGet('fOpTelaoPermissao'),
sons:[1,
2,
3,
4].map(i=>opGet('fOpTelaoSom'+i))}};

}
function setOpVal(id,v){const el=$('#'+id);
if(el)el.value=v||''}
function renderOperationalProfile(f={}){
 const o=mergedTechProfile(f).operacional||opBlank(),
g=(type)=>o.garagens?.find(x=>x.tipo===type)||{},
h=o.helipontos?.[0]||{},
sons=[...(o.telao?.sons||[]),
'',
'',
'',
''];

 setOpVal('fOpQGName',o.localizacao?.nome);
setOpVal('fOpMainCds',o.localizacao?.cdsPrincipal);
setOpVal('fOpLojaFac',o.lojaFac?.cds);
setOpVal('fOpBar',o.bar?.cds);
setOpVal('fOpBarbearia',o.barbearia?.cds);
setOpVal('fOpTatuagem',o.tatuagem?.cds);
setOpVal('fOpRoupas',o.roupas?.cds);
setOpVal('fOpUniformeLocal',o.uniforme?.local);
setOpVal('fOpUniformeArquivo',o.uniforme?.arquivo);
setOpVal('fOpArena',o.arena?.cds);

 [['Pub1',
'PUBLICA'],
['Pub2',
'PUBLICA_2'],
['Vip',
'FACCAO'],
['Service',
'SERVICO']].forEach(([p,
t])=>{const x=g(t);setOpVal('fOp'+p+'Blip',x.blip);setOpVal('fOp'+p+'Spawn',x.spawn);if(p==='Vip'||p==='Service')setOpVal('fOp'+p+'Vehicles',x.veiculos)});

 setOpVal('fOpHeliBlip',h.blip);
setOpVal('fOpHeliSpawn',h.spawn);
setOpVal('fOpArmoredSlots',o.blindados?.vagas);
setOpVal('fOpArmoredBlip',o.blindados?.blip);
setOpVal('fOpArmoredSpawn',o.blindados?.spawn);
setOpVal('fOpArmoredVehicles',o.blindados?.veiculos);
setOpVal('fOpTelaoTipo',o.telao?.tipo);
setOpVal('fOpTelaoModelo',o.telao?.modelo);
setOpVal('fOpTelaoPostit',o.telao?.postit);
setOpVal('fOpTelaoCds',o.telao?.cds);
setOpVal('fOpTelaoPermissao',o.telao?.permissao||f.group);
[1,
2,
3,
4].forEach(i=>setOpVal('fOpTelaoSom'+i,sons[i-1]));

}
const _getTechProfileFromFormV71=getTechProfileFromForm;
getTechProfileFromForm=function(){const out=_getTechProfileFromFormV71();
if($('#fOpQGName'))out.operacional=operationalFromForm();
techDraft=out;
return out};

const _renderTechProfileV71=renderTechProfile;
renderTechProfile=function(f){_renderTechProfileV71(f);
renderOperationalProfile(f)};

const _sourceToGroupPatchV71=sourceToGroupPatch;
sourceToGroupPatch=function(f,src){const patch=_sourceToGroupPatchV71(f,src),
holder={...f,
...patch,
perfilTecnico:{...(f.perfilTecnico||{}),
...(patch.perfilTecnico||{})},
perfilFonte:{...src,
versao:OPERATIONAL_PROFILE_VERSION}};
/* INICIAR ROTA é o blip inicial do farm e não significa Rota Exclusiva. */if(patch.beneficios&&!(f?.beneficios?.rotaExclusiva)){patch.beneficios.rotaExclusiva=false;
patch.beneficios.rotaBlips=f?.beneficios?.rotaBlips||'';
if(holder.beneficios){holder.beneficios.rotaExclusiva=false;
holder.beneficios.rotaBlips=f?.beneficios?.rotaBlips||''}}holder.perfilTecnico.operacional=opMerge(operationalFromExisting(holder),f.perfilTecnico?.operacional||{});
patch.perfilTecnico=holder.perfilTecnico;
patch.perfilFonte={...src,
versao:OPERATIONAL_PROFILE_VERSION};
return patch};

// Sincroniza os campos do Perfil Operacional com os campos legados usados pelo gerador de solicitações.
function syncOperationalLegacy(){
 if(!$('#fOpQGName'))return;
const o=operationalFromForm(),
pub=o.garagens.find(x=>x.tipo==='PUBLICA')||{},
vip=o.garagens.find(x=>x.tipo==='FACCAO')||{},
heli=o.helipontos[0]||{};

 setOpVal('fQG',o.localizacao.nome);
setOpVal('fCds',o.localizacao.cdsPrincipal);
setOpVal('fBarbearia',o.barbearia.cds);
setOpVal('fTatuagem',o.tatuagem.cds);
setOpVal('fLojaRoupas',o.roupas.cds);
setOpVal('fArena',o.arena.cds);
setOpVal('fShopExclusivo',o.lojaFac.cds);
setOpVal('fGaragemPublicaBlip',pub.blip);
setOpVal('fGaragemPublicaSpawn',pub.spawn);
setOpVal('fGaragemVipBlip',vip.blip);
setOpVal('fGaragemVipSpawn',vip.spawn);
setOpVal('fGaragemVipVeiculos',vip.veiculos);
setOpVal('fHelipontoBlip',heli.blip);
setOpVal('fHelipontoSpawn',heli.spawn);
setOpVal('fTelaoNome',o.telao.modelo);
setOpVal('fTelaoPostit',o.telao.postit);
setOpVal('fTelaoCds',o.telao.cds);
// Mantém caixas de som alinhadas no cadastro legado e no Perfil Operacional.
if($('#fTelao'))$('#fTelao').checked=!!o.telao.ativo;
if($('#fGaragemPublica'))$('#fGaragemPublica').checked=!!(pub.blip||pub.spawn);
if($('#fHeliponto'))$('#fHeliponto').checked=!!(heli.blip||heli.spawn);

}
const OP_INPUT_IDS=['fOpQGName',
'fOpMainCds',
'fOpLojaFac',
'fOpBar',
'fOpBarbearia',
'fOpTatuagem',
'fOpRoupas',
'fOpUniformeLocal',
'fOpUniformeArquivo',
'fOpArena',
'fOpPub1Blip',
'fOpPub1Spawn',
'fOpPub2Blip',
'fOpPub2Spawn',
'fOpVipBlip',
'fOpVipSpawn',
'fOpVipVehicles',
'fOpServiceBlip',
'fOpServiceSpawn',
'fOpServiceVehicles',
'fOpHeliBlip',
'fOpHeliSpawn',
'fOpArmoredSlots',
'fOpArmoredBlip',
'fOpArmoredSpawn',
'fOpArmoredVehicles',
'fOpTelaoTipo',
'fOpTelaoModelo',
'fOpTelaoPostit',
'fOpTelaoCds',
'fOpTelaoPermissao',
'fOpTelaoSom1',
'fOpTelaoSom2',
'fOpTelaoSom3',
'fOpTelaoSom4'];

OP_INPUT_IDS.forEach(id=>$('#'+id)?.addEventListener('input',()=>{syncOperationalLegacy();getTechProfileFromForm();try{renderConnectedRequests();renderStructureSnapshot(currentFactionFromForm());updateDeliveryPreview()}catch{}}));

$('#fOpTelaoTipo')?.addEventListener('change',()=>{syncOperationalLegacy();getTechProfileFromForm();try{renderConnectedRequests();updateDeliveryPreview()}catch{}});

// Perfil operacional também passa a responder no Alvesinho.



// HIGH OS V7.5 · Benefícios e Setagens realmente isolados em página própria.
let groupBenefitsHome=null;

function ensureBenefitsHome(){
 const box=$('#groupBenefitsSettings');

 if(box&&!groupBenefitsHome)groupBenefitsHome={parent:box.parentElement,
next:box.nextSibling};

 return box;

}
function openGroupSettingsPage(){
 const box=ensureBenefitsHome(),
mount=$('#groupSettingsMount');

 if(!box||!mount)return;

 mount.appendChild(box);
box.open=true;
box.classList.add('settings-active');

 const raw=faccoes.find(x=>x.group===$('#fGroup')?.value)||{};
const g=resolveGroupIdentity(raw);

 $('#groupSettingsTitle').textContent=`${g.group||$('#fGroup')?.value||'GROUP'} · BENEFÍCIOS E SETAGENS`;

 $('#groupSettingsSubtitle').textContent=[g.qg||'QG sem nome',
g.faccao?`Ocupante: ${g.faccao}`:'Group vago'].join(' • ');

 activateAppPage('group-settings');

}
function closeGroupSettingsPage(){
 const box=ensureBenefitsHome();

 if(box){box.classList.remove('settings-active');
box.open=false;
}
 if(box&&groupBenefitsHome?.parent){
   if(groupBenefitsHome.next&&groupBenefitsHome.next.parentElement===groupBenefitsHome.parent)groupBenefitsHome.parent.insertBefore(box,groupBenefitsHome.next);

   else groupBenefitsHome.parent.appendChild(box);

 }
 activateAppPage('group-profile');

}
$('#openGroupSettings')?.addEventListener('click',openGroupSettingsPage);

$('#groupSettingsBack')?.addEventListener('click',closeGroupSettingsPage);

$('#saveGroupSettingsBtn')?.addEventListener('click',()=>$('#facForm')?.requestSubmit());

// ===== HIGH OS V7.4 · RESUMO EXECUTIVO / CADASTRO RECOLHIDO =====
function renderGroupOverview(f){
 if(!f)return;

 const installed=INSTALLATIONS.filter(([k])=>isInstalled(f.beneficios||{},k));

 const put=(id,val)=>{const el=$('#'+id);
if(el)el.textContent=val||'—'};

 put('groupOverviewSegment',f.segmento||'OUTROS');

 put('groupOverviewGroup',f.group||'GROUP');

 put('groupOverviewQG',f.qg||'QG sem nome');

 put('groupOverviewProduct',f.produto||'—');

 put('groupOverviewLeader',f.lider||'—');

 put('groupOverviewStaff',f.staff||'—');

 put('groupOverviewCds',f.cds||'—');

 const s=$('#groupProfileSummary');

 if(s)s.innerHTML=`<div><span>STATUS</span><b class="${f.status==='ATIVA'?'online':''}">${f.status==='ATIVA'?'OCUPADO':'VAGO'}</b></div><div><span>OCUPANTE</span><b>${esc(f.faccao||'—')}</b></div><div><span>QG / LOCAL</span><b>${esc(f.qg||'SEM LOCAL')}</b></div><div><span>ESTRUTURAS</span><b>${installed.length}</b></div>`;

 const d=$('#groupIdentityDetails');
if(d)d.open=false;

}
$('#editGroupIdentityBtn')?.addEventListener('click',()=>{const d=$('#groupIdentityDetails');if(!d)return;d.open=true;setTimeout(()=>d.scrollIntoView({behavior:'smooth',
block:'start'}),30)});

const _openFacV74=openFac;
openFac=function(id){_openFacV74(id);
const raw=faccoes.find(x=>x.id===id);
renderGroupOverview(resolveGroupIdentity(raw||{}))};

['fStatus',
'fFaccao',
'fQG',
'fProduto',
'fLider',
'fStaff',
'fCds'].forEach(id=>$('#'+id)?.addEventListener('input',()=>{
 const current=faccoes.find(x=>x.group===$('#fGroup')?.value)||{};
 renderGroupOverview({...current,
status:$('#fStatus')?.value||current.status,
faccao:$('#fFaccao')?.value.trim()||'',
qg:$('#fQG')?.value.trim()||'',
produto:$('#fProduto')?.value.trim()||'',
lider:$('#fLider')?.value.trim()||'',
staff:$('#fStaff')?.value.trim()||'',
cds:$('#fCds')?.value.trim()||''});
 const d=$('#groupIdentityDetails');if(d)d.open=true;
}));

// ===== HIGH OS · TRANSFERÊNCIA DE PAINEL, TROCA DE QG E ADMINISTRAÇÃO =====
let movementMode = '';

let movementSourceGroup = '';

const OCCUPANT_FIELDS = ['faccao',
'lider',
'staff',
'dataEntrega',
'status',
'observacoes'];

const PHYSICAL_FIELDS = ['qg',
'cds',
'beneficios',
'perfilEntrega',
'perfilTecnico',
'produto',
'anuncio',
'semCraft',
'removido'];

function isAdmin(){
  return String(currentProfile?.role || '').toUpperCase() === 'ADMIN';

}

function cleanSnapshot(o){
  return snapshot(o);

}

function movementOpen(mode){
  if(!isAdmin()) return alert('Apenas ADMIN pode executar transferências e trocas de QG.');

  const group = $('#fGroup')?.value;

  const src = faccoes.find(x => x.group === group);

  if(!src) return;

  movementMode = mode;

  movementSourceGroup = group;

  const dst = $('#movementDestination');

  if(!dst) return;

  dst.innerHTML = faccoes
    .filter(x => x.group !== group)
    .map(x => `<option value="${esc(x.group)}">${esc(x.group)} • ${esc(x.qg || 'SEM LOCAL')} • ${esc(x.faccao || 'VAGO')}</option>`)
    .join('');

  $('#movementOrigin').textContent = `${src.group} • ${src.qg || 'SEM LOCAL'} • ${src.faccao || 'VAGO'}`;

  $('#movementTitle').textContent = mode === 'TRANSFER_PANEL' ? 'TRANSFERIR PAINEL / FACÇÃO' : 'TROCAR QG / LOCAL FÍSICO';

  $('#movementHelp').textContent = mode === 'TRANSFER_PANEL'
    ? 'TRANSFERIR FACÇÃO: a organização muda de Group e o histórico de métricas acompanha a facção. O Group não leva o histórico da ocupante anterior. Se o destino estiver ocupado, as duas facções trocam de Group.'
    : 'TROCAR QG / LOCAL: as facções permanecem nos mesmos Groups. Somente os locais/estruturas físicas são trocados — use esta opção quando quiser, por exemplo, manter ARMAS04 e levar DROGAS03 para o local de ARMAS04.';

  $('#movementReason').value = '';
  const effective=$('#movementEffectiveDate');
  if(effective)effective.value=new Date().toISOString().slice(0,10);

  show($('#movementModal'));

  movementPreview();

}

function movementPreview(){
  const src = faccoes.find(x => x.group === movementSourceGroup);

  const dst = faccoes.find(x => x.group === $('#movementDestination')?.value);

  if(!src || !dst) return;

  $('#movementPreview').innerHTML = movementMode === 'TRANSFER_PANEL'
    ? `<b>PRÉVIA • FACÇÃO / GROUP</b><span>${esc(src.faccao || 'VAGO')} : ${esc(src.group)} → ${esc(dst.group)} • histórico acompanha a facção</span>${dst.faccao ? `<span>${esc(dst.faccao)} : ${esc(dst.group)} → ${esc(src.group)} • histórico acompanha a facção</span>` : ''}<small>Os locais físicos dos Groups permanecem onde estão.</small>`
    : `<b>PRÉVIA • SOMENTE QG / LOCAL</b><span>${esc(src.group)} continua com ${esc(src.faccao||'VAGO')} • local: ${esc(src.qg || 'SEM LOCAL')} → ${esc(dst.qg || 'SEM LOCAL')}</span><span>${esc(dst.group)} continua com ${esc(dst.faccao||'VAGO')} • local: ${esc(dst.qg || 'SEM LOCAL')} → ${esc(src.qg || 'SEM LOCAL')}</span><small>Nenhuma facção muda de Group e nenhum histórico de métricas é transferido.</small>`;

}

$('#transferPanelBtn')?.addEventListener('click', () => movementOpen('TRANSFER_PANEL'));

$('#swapQGBtn')?.addEventListener('click', () => movementOpen('SWAP_QG'));

$('#movementDestination')?.addEventListener('change', movementPreview);
$('#movementEffectiveDate')?.addEventListener('change', movementPreview);

$('#movementClose')?.addEventListener('click', () => $('#movementModal')?.classList.add('hidden'));

$('#movementCancel')?.addEventListener('click', () => $('#movementModal')?.classList.add('hidden'));

$('#movementConfirm')?.addEventListener('click', async () => {
  if(!isAdmin()) return;
  const src = faccoes.find(x => x.group === movementSourceGroup);
  const dst = faccoes.find(x => x.group === $('#movementDestination')?.value);
  const reason = $('#movementReason')?.value.trim() || '';
  const effectiveDate = $('#movementEffectiveDate')?.value || new Date().toISOString().slice(0,10);
  if(!src || !dst) return;
  if(!reason) return alert('Informe o motivo da operação.');
  if(!confirm(`Confirmar operação entre ${src.group} e ${dst.group}? Esta ação será registrada no histórico.`)) return;

  let committed = false;
  try{
    const a = {...src};
    const b = {...dst};

    if(movementMode === 'TRANSFER_PANEL'){
      for(const k of OCCUPANT_FIELDS){
        a[k] = dst[k] ?? (k === 'status' ? 'INATIVA' : '');
        b[k] = src[k] ?? (k === 'status' ? 'INATIVA' : '');
      }
      a.status = a.faccao ? 'ATIVA' : 'INATIVA';
      b.status = b.faccao ? 'ATIVA' : 'INATIVA';
    }else{
      for(const k of PHYSICAL_FIELDS){
        const v = a[k];
        a[k] = b[k];
        b[k] = v;
      }
    }

    a.updatedAt = serverTimestamp();
    a.updatedBy = currentUser.email;
    b.updatedAt = serverTimestamp();
    b.updatedBy = currentUser.email;

    const batch = writeBatch(db);
    batch.set(doc(db,'highos','data','faccoes',idFac(src.group)), a);
    batch.set(doc(db,'highos','data','faccoes',idFac(dst.group)), b);

    // Guardar log e vínculos junto com as alterações principais.
    batch.set(doc(histCol), {
      tipo: movementMode === 'TRANSFER_PANEL' ? 'TRANSFERENCIA_PAINEL' : 'TROCA_QG',

      group: src.group,

      groupDestino: dst.group,

      faccao: src.faccao || '',

      qg: src.qg || '',

      motivo: reason,
      dataEfetiva: effectiveDate,

      antes: {origem: cleanSnapshot(src),
 destino: cleanSnapshot(dst)},

      depois: {origem: cleanSnapshot(a),
 destino: cleanSnapshot(b)},

      usuario: currentUser.email,

      data: serverTimestamp()
    });
    /* V10.31 - sincroniza as organizações movimentadas em uma única
       confirmação. Em troca de duas facções deixa de fazer duas escritas
       sequenciais independentes. */
    

    for(const rec of [a,
b]){
      if(rec.faccao){
        const existing=derivedOrganizations().find(o=>String(o.nome||'').toLowerCase()===String(rec.faccao).toLowerCase())||{};
        const next={nome:rec.faccao,status:'ATIVA',groupAtual:rec.group,segmentoAtual:rec.segmento||'',qgAtual:rec.qg||'',lider:rec.lider||''};
        const igual=existing?.id&&Object.keys(next).every(k=>String(existing[k]??'')===String(next[k]??''));
        if(!igual){
          batch.set(doc(db,'highos','data','organizacoes',orgKey(rec.faccao)), {
            ...next,
            updatedAt:serverTimestamp(),
            updatedBy:currentUser.email
          }, {merge:true});

        }
      }
    }

    await batch.commit();
    committed = true;
    // Ocupações complementares são gravadas após a transação principal:
    // mantém compatibilidade enquanto firestore.rules ainda não for publicado.
    let occupationSynced=true;
    if(movementMode === 'TRANSFER_PANEL'){
      try{
        const occupationBatch=writeBatch(db);
        const stamp=Date.now();
        const moved=[
          {before:src,after:b,from:src.group,to:dst.group},
          ...(dst.faccao?[{before:dst,after:a,from:dst.group,to:src.group}]:[])
        ];
        moved.forEach((mv,n)=>{
          const faction=String(mv.before?.faccao||'').trim();
          if(!faction)return;
          const oid=(orgKey(faction)+'_'+effectiveDate+'_'+stamp+'_'+n).replace(/[^a-zA-Z0-9_-]/g,'_');
          occupationBatch.set(doc(db,'highos','data','ocupacoes',oid),{
            organizacaoId:orgKey(faction),
            faccao:faction,
            groupOrigem:mv.from,
            groupDestino:mv.to,
            segmentoOrigem:mv.before?.segmento||'',
            segmentoDestino:mv.after?.segmento||'',
            qgOrigem:mv.before?.qg||'',
            qgDestino:mv.after?.qg||'',
            dataEfetiva:effectiveDate,
            motivo:reason,
            tipo:'TRANSFERENCIA_GROUP',
            createdAt:serverTimestamp(),
            createdBy:currentUser.email
          });
        });
        await occupationBatch.commit();
      }catch(occError){
        occupationSynced=false;
        console.warn('[OCUPAÇÕES] Log principal salvo; registro complementar pendente:',occError);
      }
    }
    const sheetOk=await syncGroupsToOfficialSheet([a,b],{quiet:true,previousGroups:[src,dst]});



    const localA={...clonePlain(a),id:src.id||src.group,updatedBy:currentUser.email};
    const localB={...clonePlain(b),id:dst.id||dst.group,updatedBy:currentUser.email};
    faccoes=faccoes.map(f=>f.group===src.group?localA:f.group===dst.group?localB:f);
    for(const rec of [localA,localB]){
      if(!rec.faccao)continue;
      const oid=orgKey(rec.faccao),oix=organizacoes.findIndex(o=>o.id===oid||String(o.nome||'').toLowerCase()===String(rec.faccao).toLowerCase());
      const patch={nome:rec.faccao,status:'ATIVA',groupAtual:rec.group,segmentoAtual:rec.segmento||'',qgAtual:rec.qg||'',lider:rec.lider||'',updatedBy:currentUser.email};
      if(oix>=0)organizacoes[oix]={...organizacoes[oix],...patch,id:organizacoes[oix].id||oid};
      else organizacoes.push({id:oid,...patch});
    }
    queryFreshAt.set('faccoes',Date.now());queryFreshAt.set('organizacoes',Date.now());
    renderFaccoes();renderOrganizations();renderAvailableFaccoes();

    $('#movementModal')?.classList.add('hidden');
    closeGroupProfilePage();
    const pending=[];
    if(!sheetOk)pending.push('planilha PENDENTE: reconecte o Google Sheets e sincronize');
    if(!occupationSynced)pending.push('registro complementar de ocupação PENDENTE: publicar as novas regras do Firestore');
    alert(pending.length?'Operação concluída e auditada no High OS; '+pending.join('; ')+'.':'Operação concluída, auditada e planilhas sincronizadas.');
  }catch(e){
    alert(committed?'Dados gravados no High OS, mas houve falha após a confirmação. Recarregue a página para conferir o resultado: '+e.message:'Falha na operação; nada foi confirmado: ' + e.message);
  }
});

async function wipeCollection(name){
 const rows=name==='faccoes'?(await highOsDiscordRequest('/v1/factions')).records||[]:await highOsStoreList(name);
 if(name==='faccoes')throw new Error('Limpeza total de facções bloqueada para proteger os fóruns canônicos do Discord.');
 for(const row of rows)await highOsStoreDelete(name,row.id);
 return rows.length;
}

async function adminWipe(target){
  if(!isAdmin()) return;

  const phrase = `APAGAR ${target.toUpperCase()}`;

  const typed = prompt(`AÇÃO IRREVERSÍVEL. Para apagar ${target}, digite exatamente:\n${phrase}`);

  if(typed !== phrase) return alert('Confirmação incorreta. Nada foi apagado.');

  try{
    await addDoc(histCol, {
      tipo:'ADM_LIMPEZA',

      alvo:target,

      descricao:`Administrador confirmou limpeza de ${target}`,

      usuario:currentUser.email,

      data:serverTimestamp()
    });

    const n = await wipeCollection(target);

    alert(`${n} registro(s) apagado(s) de ${target}. O log de auditoria foi preservado.`);

    if(target === 'faccoes') await loadFaccoes();

  }catch(e){
    alert('Erro na limpeza: ' + e.message);

  }
}

document.querySelectorAll('.admin-wipe').forEach(b => b.addEventListener('click', () => adminWipe(b.dataset.target)));

$('#adminResetAll')?.addEventListener('click', async () => {
  if(!isAdmin()) return;
  const typed = prompt('RESET OPERACIONAL COMPLETO. O histórico de auditoria será PRESERVADO.\n\nDigite exatamente: RESETAR HIGH OS');
  if(typed !== 'RESETAR HIGH OS') return alert('Confirmação incorreta. Nada foi apagado.');
  if(!confirm('Última confirmação: apagar Groups/QGs, organizações, solicitações, entregas e métricas?')) return;

  try{
    await addDoc(histCol, {
      tipo:'ADM_RESET_COMPLETO',

      descricao:'Reset operacional completo confirmado. Histórico preservado.',

      usuario:currentUser.email,

      data:serverTimestamp()
    });
    let total = 0;
    for(const c of ['faccoes',
'organizacoes',
'solicitacoes',
'entregas',
'metricas']) total += await wipeCollection(c);
    await loadFaccoes();
    alert(`Reset concluído. ${total} registro(s) operacionais removidos. Histórico preservado.`);
  }catch(e){
    alert('Erro no reset: ' + e.message);
  }
});

// ===== HIGH OS V8.0 · DOCUMENTO DAS FACÇÕES ↔ GOOGLE SHEETS =====
const FAC_SHEET_SPREADSHEET_ID='1MBVzWMFrAzIhYlT7-ZgWZEAoJLjPn3JeZdmHyRcZf2A';

const FAC_SHEET_GID=1572584288;

const FAC_SHEET_SCOPE='https://www.googleapis.com/auth/spreadsheets';

let facSheetAccessToken='',
facSheetTitle='',
facSheetRowMap=new Map(),
facSheetPendingDiffs=[],
facSheetBusy=false;

const FAC_SHEET_FIELDS=[
 ['numero',
'nº'],
['cds',
'CDS'],
['anuncio',
'Anúncio Discord ?'],
['qg',
'Nome QG ou Favela'],
['group',
'Group'],
['produto',
'Produto'],
['faccao',
'Facção'],
['status',
'STATUS'],
['lider',
'Líder'],
['staff',
'Staff Responsável'],
['dataEntrega',
'Data Entrega'],
['observacoes',
'Observações']
];

function facSheetNorm(v=''){return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'').toLowerCase()}
function facSheetStatus(v=''){const x=String(v||'').trim().toUpperCase();
return x==='ATIVA'||x==='ATIVO'?'ATIVA':'INATIVA'}
function facSheetClean(v){return String(v??'').trim()}
function facSheetComparable(field,v){if(field==='status')return facSheetStatus(v);
if(field==='numero')return String(Number(v||0)||'');
return facSheetClean(v)}
function facSheetRowFromGroup(f={}){return [f.numero??'',
f.cds||'',
f.anuncio||'',
f.qg||'',
f.group||'',
f.produto||'',
f.faccao||'',
f.status==='ATIVA'?'Ativa':'Inativa',
f.lider||'',
f.staff||'',
f.dataEntrega||'',
f.observacoes||'']}
function facSheetPatchFromRow(row=[]){return {numero:Number(row[0]||0)||'',
cds:facSheetClean(row[1]),
anuncio:facSheetClean(row[2]),
qg:facSheetClean(row[3]),
group:facSheetClean(row[4]),
produto:facSheetClean(row[5]),
faccao:facSheetClean(row[6]),
status:facSheetStatus(row[7] || (row[6]?'ATIVA':'INATIVA')),
lider:facSheetClean(row[8]),
staff:facSheetClean(row[9]),
dataEntrega:facSheetClean(row[10]),
observacoes:facSheetClean(row[11])}}
function facSheetRenderStatus(status='offline',text=''){
 const badge=$('#facSheetSyncBadge'),
desc=$('#facSheetStatusText');
if(badge){badge.className='sheet-sync-badge '+status;
badge.textContent=status==='online'?'CONECTADO':status==='busy'?'SINCRONIZANDO':status==='warn'?'PENDENTE':'DESCONECTADO'}if(desc&&text)desc.textContent=text;

}
function facSheetSetLastCheck(){const el=$('#facSheetLastCheck');
if(el)el.textContent=new Date().toLocaleString('pt-BR')}
async function facSheetAuthorize(){
 if(facSheetAccessToken)return facSheetAccessToken;
if(!currentUser)throw new Error('Entre no High OS antes de conectar a planilha.');

 facSheetProvider.setCustomParameters({prompt:'consent',
login_hint:currentUser.email||''});

 const result=await signInWithPopup(auth,facSheetProvider),
cred=GoogleAuthProvider.credentialFromResult(result),
token=cred?.accessToken;

 if(!token)throw new Error('O Google não retornou autorização de edição da planilha.');
facSheetAccessToken=token;
facSheetRenderStatus('online','Google Sheets conectado. Alterações feitas no High OS serão enviadas automaticamente.');
try{await facSheetResolveTitle(token)}catch(e){console.warn('[PLANILHAS] Documento das Facções indisponível; BLIPS COORDENADAS pode continuar normalmente:',e)}
return token;

}
async function facSheetFetch(url,{method='GET',
body=null,
token=''}={}){
 token=token||facSheetAccessToken;
if(!token)throw new Error('PLANILHA_NAO_CONECTADA');
const opt={method,
headers:{Authorization:`Bearer ${token}`}};
if(body!==null){opt.headers['Content-Type']='application/json';
opt.body=JSON.stringify(body)}
 const r=await fetch(url,opt);
const p=await r.json().catch(()=>({}));
if(!r.ok){if(r.status===401||r.status===403)facSheetAccessToken='';
throw new Error(p?.error?.message||`Google Sheets HTTP ${r.status}`)}return p;

}
async function facSheetResolveTitle(token=''){
 if(facSheetTitle)return facSheetTitle;
const u=`https://sheets.googleapis.com/v4/spreadsheets/${FAC_SHEET_SPREADSHEET_ID}?fields=sheets.properties(sheetId,title,index)`;
const p=await facSheetFetch(u,{token});
const hit=(p.sheets||[]).find(x=>Number(x.properties?.sheetId)===FAC_SHEET_GID);
if(!hit)throw new Error(`Não encontrei a aba gid ${FAC_SHEET_GID} na planilha.`);
facSheetTitle=hit.properties.title;
const el=$('#facSheetName');
if(el)el.textContent=`${facSheetTitle} • gid ${FAC_SHEET_GID}`;
return facSheetTitle;

}
async function facSheetReadAll({authorize=false}={}){
 const token=authorize?await facSheetAuthorize():facSheetAccessToken;
if(!token)throw new Error('PLANILHA_NAO_CONECTADA');
const title=await facSheetResolveTitle(token),
range=`'${String(title).replace(/'/g,"''")}'!A1:L300`,
u=`https://sheets.googleapis.com/v4/spreadsheets/${FAC_SHEET_SPREADSHEET_ID}/values/${encodeURIComponent(range)}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE`;
const p=await facSheetFetch(u,{token}),
values=p.values||[];
facSheetRowMap=new Map();
const records=[];

 values.forEach((row,i)=>{const patch=facSheetPatchFromRow(row);if(!patch.group)return;const key=facSheetNorm(patch.group);facSheetRowMap.set(key,i+1);records.push({rowNumber:i+1,
row,
patch,
key})});
return records;

}
function facSheetDiffForRecord(record){
 const current=faccoes.find(f=>facSheetNorm(f.group)===record.key);
if(!current)return null;
const patch={...record.patch,
group:current.group};
const changes=[];
for(const [field,
label] of FAC_SHEET_FIELDS){if(field==='group')continue;
const a=facSheetComparable(field,current[field]),
b=facSheetComparable(field,patch[field]);
if(a!==b)changes.push({field,
label,
before:current[field]??'',
after:patch[field]??''})}return changes.length?{current,
patch,
rowNumber:record.rowNumber,
changes}:null;

}
async function facSheetCheckForChanges(){
 if(facSheetBusy)return;
facSheetBusy=true;
facSheetRenderStatus('busy','Comparando a planilha com a base atual do High OS...');
const btn=$('#facSheetCheckBtn');
if(btn)btn.disabled=true;

 try{const rows=await facSheetReadAll({authorize:!facSheetAccessToken});
facSheetPendingDiffs=rows.map(facSheetDiffForRecord).filter(Boolean);
facSheetSetLastCheck();
if(!facSheetPendingDiffs.length){facSheetRenderStatus('online','Planilha e High OS estão iguais nos campos sincronizados.');
return alert('Nenhuma diferença encontrada entre a planilha e o High OS.')}renderFacSheetDiffModal();
facSheetRenderStatus('warn',`${facSheetPendingDiffs.length} Group(s) possuem alterações aguardando sua confirmação.`)}catch(e){facSheetRenderStatus('offline',e.message==='PLANILHA_NAO_CONECTADA'?'Conecte o Google Sheets para verificar alterações.':'Erro: '+e.message);
if(e.message!=='PLANILHA_NAO_CONECTADA')alert('Erro ao ler a planilha: '+e.message)}finally{facSheetBusy=false;
if(btn)btn.disabled=false}
}
function renderFacSheetDiffModal(){
 const sum=$('#facSheetDiffSummary'),
list=$('#facSheetDiffList');
if(sum)sum.innerHTML=`<b>${facSheetPendingDiffs.length}</b><span>GROUP(S) COM DIFERENÇAS</span><small>${facSheetPendingDiffs.reduce((n,x)=>n+x.changes.length,0)} campo(s) serão alterados somente após a confirmação.</small>`;
if(list)list.innerHTML=facSheetPendingDiffs.map(d=>`<article class="sheet-diff-card"><header><div><span>LINHA ${d.rowNumber}</span><h3>${esc(d.current.group)}</h3></div><b>${d.changes.length} ALTERAÇÃO(ÕES)</b></header><div>${d.changes.map(c=>`<div class="sheet-diff-row"><span>${esc(c.label)}</span><del>${esc(c.before||'—')}</del><i>→</i><ins>${esc(c.after||'—')}</ins></div>`).join('')}</div></article>`).join('');
$('#facSheetDiffModal')?.classList.remove('hidden');

}
async function facSheetApplyConfirmed(){
 if(!facSheetPendingDiffs.length)return $('#facSheetDiffModal')?.classList.add('hidden');
if(!confirm(`Confirmar ${facSheetPendingDiffs.length} atualização(ões) da planilha no High OS?`))return;
const btn=$('#facSheetDiffConfirm');
if(btn){btn.disabled=true;
btn.textContent='ATUALIZANDO...'}
 try{const batch=writeBatch(db);
for(const d of facSheetPendingDiffs){const next={...d.current,
...d.patch,
group:d.current.group,
updatedAt:serverTimestamp(),
updatedBy:currentUser.email,
syncSource:'GOOGLE_SHEETS'};
batch.set(doc(db,'highos','data','faccoes',idFac(d.current.group)),next,{merge:true})}await batch.commit();
for(const d of facSheetPendingDiffs){const oldName=String(d.current.faccao||'').trim(),
newName=String(d.patch.faccao||'').trim();
if(oldName&&facSheetNorm(oldName)!==facSheetNorm(newName)){await setDoc(doc(db,'highos','data','organizacoes',orgKey(oldName)),{nome:oldName,
status:'SEM_GROUP',
groupAtual:'',
segmentoAtual:'',
qgAtual:'',
updatedAt:serverTimestamp(),
updatedBy:currentUser.email},{merge:true})}if(newName){await setDoc(doc(db,'highos','data','organizacoes',orgKey(newName)),{nome:newName,
status:d.patch.status==='ATIVA'?'ATIVA':'SEM_GROUP',
groupAtual:d.patch.status==='ATIVA'?d.current.group:'',
segmentoAtual:d.patch.status==='ATIVA'?(d.current.segmento||''):'',
qgAtual:d.patch.status==='ATIVA'?(d.patch.qg||d.current.qg||''):'',
lider:d.patch.lider||'',
updatedAt:serverTimestamp(),
updatedBy:currentUser.email},{merge:true})}}await addDoc(histCol,{sessionId:currentSessionId||'',
tipo:'SYNC_PLANILHA_FACCOES_IMPORT',
descricao:`${facSheetPendingDiffs.length} Group(s) atualizados após confirmação da planilha oficial`,
grupos:facSheetPendingDiffs.map(x=>x.current.group),
usuario:currentUser.email,
data:serverTimestamp()});
facSheetPendingDiffs=[];
$('#facSheetDiffModal')?.classList.add('hidden');
await loadFaccoes();
facSheetRenderStatus('online','Alterações da planilha confirmadas e aplicadas ao High OS.');
alert('High OS atualizado com os dados confirmados da planilha.')}catch(e){alert('Erro ao aplicar alterações: '+e.message)}finally{if(btn){btn.disabled=false;
btn.textContent='CONFIRMAR E ATUALIZAR HIGH OS'}}
}
function blipsChangedFieldsByGroup(previousGroups=[],currentGroups=[]){
 const before=new Map(previousGroups.filter(Boolean).map(g=>[facSheetNorm(g.group),blipsValuesFor(g)]));
 const changes={};
 for(const g of currentGroups.filter(Boolean)){
  const old=before.get(facSheetNorm(g.group));
  if(!old)continue;
  const now=blipsValuesFor(g);
  changes[g.group]=Object.keys(now).filter(field=>String(now[field]??'')!==String(old[field]??''));
 }
 return changes;
}
async function syncBlipsGroups(rows=[],{onlyMissing=false,quiet=true,overwriteFieldsByGroup={}}={}){
 if(!facSheetAccessToken)return false;
 try{
  const result=await syncBlipsCoordinates({token:facSheetAccessToken,groups:rows,onlyMissing,overwriteFieldsByGroup});
  if(result.created)console.info('[BLIPS COORDENADAS] '+result.created+' quadro(s) cadastrado(s) na categoria correta.');
  const inconsistencies=[...(result.categoryMismatches||[]),...(result.duplicates||[])];
  if(inconsistencies.length){
   console.warn('[BLIPS COORDENADAS] Groups que precisam de revisão de categoria/duplicidade:',inconsistencies);
   if(!quiet)alert('Sincronização parcial: '+inconsistencies.length+' Group(s) precisam de revisão na categoria ou estão duplicados. Consulte o console para detalhes.');
  }
  return inconsistencies.length===0;
 }catch(error){
  console.warn('[BLIPS COORDENADAS] Falha de sincronização:',error);
  if(/HTTP (401|403)|unauthorized|invalid authentication credentials/i.test(String(error?.message||error)))facSheetAccessToken='';
  if(!quiet)alert('Não foi possível atualizar a aba BLIPS COORDENADAS: '+(error?.message||error));
  return false;
 }
}
async function syncGroupsToOfficialSheet(groups=[],{quiet=false,
forceAuthorize=false,previousGroups=[]}={}){
 const clean=groups.filter(Boolean);
if(!clean.length)return true;
let token=facSheetAccessToken;
if(!token&&forceAuthorize)token=await facSheetAuthorize();
if(!token){facSheetRenderStatus('warn','High OS salvo. Conecte o Google Sheets para enviar as alterações pendentes à planilha.');
return false}
 const blipsOk=await syncBlipsGroups(clean,{quiet:true,overwriteFieldsByGroup:blipsChangedFieldsByGroup(previousGroups,clean)});
 try{facSheetRenderStatus('busy',`Enviando ${clean.length} Group(s) para a planilha...`);
if(!facSheetRowMap.size)await facSheetReadAll();
const title=await facSheetResolveTitle(token);
for(const f of clean){const key=facSheetNorm(f.group),
row=facSheetRowMap.get(key),
values=[facSheetRowFromGroup(f)];
if(row){const range=`'${String(title).replace(/'/g,"''")}'!A${row}:L${row}`,
u=`https://sheets.googleapis.com/v4/spreadsheets/${FAC_SHEET_SPREADSHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
await facSheetFetch(u,{method:'PUT',
body:{range,
majorDimension:'ROWS',
values},
token})}else{const range=`'${String(title).replace(/'/g,"''")}'!A:L`,
u=`https://sheets.googleapis.com/v4/spreadsheets/${FAC_SHEET_SPREADSHEET_ID}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
await facSheetFetch(u,{method:'POST',
body:{range,
majorDimension:'ROWS',
values},
token});
facSheetRowMap.clear()}}
 facSheetSetLastCheck();
facSheetRenderStatus(blipsOk?'online':'warn',blipsOk?`${clean.length} Group(s) sincronizado(s) com as planilhas.`:'Documento das facções atualizado, mas BLIPS COORDENADAS não sincronizou.');
return blipsOk}catch(e){facSheetRenderStatus('warn','High OS foi salvo, mas a planilha não recebeu a atualização: '+e.message);
if(!quiet)alert('High OS salvo, mas houve erro ao atualizar a planilha: '+e.message);
return false}
}
async function facSheetPushAll(){
 if(!isAdmin())return;
const btn=$('#facSheetPushAllBtn');
if(btn){btn.disabled=true;
btn.textContent='ENVIANDO...'}try{if(!facSheetAccessToken)await facSheetAuthorize();
if(!confirm(`Enviar os ${faccoes.length} Groups atuais do High OS para a planilha oficial?\n\nLinhas existentes serão atualizadas pelo Group e Groups ausentes serão adicionados.`))return;
const ok=await syncGroupsToOfficialSheet(faccoes,{forceAuthorize:true});
if(ok){await addDoc(histCol,{sessionId:currentSessionId||'',
tipo:'SYNC_PLANILHA_FACCOES_EXPORT',
descricao:`Base High OS enviada manualmente para a planilha oficial: ${faccoes.length} Group(s)`,
usuario:currentUser.email,
data:serverTimestamp()});
alert('Planilha atualizada com a base atual do High OS.')}}catch(e){alert('Erro ao enviar a base: '+e.message)}finally{if(btn){btn.disabled=false;
btn.textContent='ENVIAR HIGH OS → PLANILHA'}}
}
$('#facSheetConnectBtn')?.addEventListener('click',async()=>{try{await facSheetAuthorize();
const blipsOk=await syncBlipsGroups(faccoes,{onlyMissing:true,quiet:false});
try{await facSheetReadAll()}catch(e){console.warn('[PLANILHAS] Documento das Facções indisponível:',e)}
facSheetSetLastCheck();
if(blipsOk)alert('Google Sheets conectado. A aba BLIPS COORDENADAS foi conferida e os Groups ausentes foram incluídos na categoria correta.')}catch(e){facSheetRenderStatus('offline','Falha ao conectar: '+e.message);alert('Não foi possível conectar a planilha: '+e.message)}});

$('#facSheetCheckBtn')?.addEventListener('click',facSheetCheckForChanges);

$('#facSheetPushAllBtn')?.addEventListener('click',facSheetPushAll);
$('#blipsSyncAllBtn')?.addEventListener('click',async()=>{
 if(!isAdmin())return;
 try{
  if(!facSheetAccessToken)await facSheetAuthorize();
  const success=await syncBlipsGroups(faccoes,{onlyMissing:false,quiet:false});
  if(success)alert('BLIPS COORDENADAS sincronizada: Groups organizados por segmento, com os dados cadastrados no High OS.');
 }catch(e){alert('Erro ao sincronizar BLIPS COORDENADAS: '+(e?.message||e));}
});

$('#facSheetDiffClose')?.addEventListener('click',()=>$('#facSheetDiffModal')?.classList.add('hidden'));

$('#facSheetDiffCancel')?.addEventListener('click',()=>$('#facSheetDiffModal')?.classList.add('hidden'));

$('#facSheetDiffConfirm')?.addEventListener('click',facSheetApplyConfirmed);

// ===== HIGH OS V7.8 · CENTRAL DE COMANDO + PERFIL DE FACÇÃO EM PÁGINA =====
function showOrganizationProfilePage(o={},current=null){
 const card=$('#orgModal .org-modal-card')||$('.org-modal-card');

 const mount=$('#orgProfilePageMount');

 if(card&&mount&&card.parentElement!==mount){mount.appendChild(card);
card.classList.add('org-profile-page-card')}
 $('#orgProfilePageTitle').textContent=o.nome||'NOVA FACÇÃO';

 $('#orgProfilePageSubtitle').textContent=current?[`${current.group||'—'} • ${current.qg||'QG sem local'}`,
current.lider?`Líder: ${current.lider}`:'Liderança não cadastrada'].join(' • '):'Organização sem Group atual • histórico e cadastro preservados';

 const st=$('#orgProfilePageStatus');
if(st)st.innerHTML=`<span class="status-chip ${current?'ativa':'inativa'}">${current?'OCUPANDO GROUP':(o.status||'SEM GROUP').replace('_',' ')}</span>`;

 activateAppPage('org-profile');

}
function closeOrganizationProfilePage(){activateAppPage('organizacoes')}
$('#orgProfileBack')?.addEventListener('click',closeOrganizationProfilePage);

function startOfWeekMonday(d=new Date()){
 const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());
const day=(x.getDay()+6)%7;
x.setDate(x.getDate()-day);
x.setHours(0,0,0,0);
return x;

}
function isoDay(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function weeklyContingentAlerts(){
 const now=new Date(),
curStart=startOfWeekMonday(now),
prevStart=new Date(curStart);
prevStart.setDate(prevStart.getDate()-7);
const prevEnd=new Date(curStart.getTime()-1);

 const currentRows=metricas.filter(r=>{const d=metricDateValue(r);return d&&d>=curStart&&d<=now});

 const previousRows=metricas.filter(r=>{const d=metricDateValue(r);return d&&d>=prevStart&&d<=prevEnd});

 const cfg=dashboardConfig||DEFAULT_DASHBOARD_CONFIG,
weekKey=isoDay(curStart),
out=[];

 faccoes.filter(f=>!f.removido&&ocupadoV14(f)).forEach(f=>{
  const same=r=>alvesNorm(r.group||r.organizacao||r.faccao)===alvesNorm(f.group),
cur=currentRows.filter(same),
prev=previousRows.filter(same);if(!cur.length||!prev.length)return;
  const prevMap=new Map();prev.forEach(r=>{const d=metricDateValue(r),
wd=(d.getDay()+6)%7;Object.entries(metricSlots(r)).forEach(([h,
v])=>{v=Number(v);if(Number.isFinite(v))prevMap.set(`${wd}|${h}`,v)})});
  const pairs=[];cur.forEach(r=>{const d=metricDateValue(r),
wd=(d.getDay()+6)%7;Object.entries(metricSlots(r)).forEach(([h,
v])=>{v=Number(v);const pv=prevMap.get(`${wd}|${h}`);if(Number.isFinite(v)&&Number.isFinite(pv))pairs.push([v,
pv])})});
  if(pairs.length<cfg.minComparacoes)return;const currentAvg=pairs.reduce((a,x)=>a+x[0],0)/pairs.length,
previousAvg=pairs.reduce((a,x)=>a+x[1],0)/pairs.length;if(previousAvg<=0)return;
  const drop=(previousAvg-currentAvg)/previousAvg*100;if(drop<cfg.quedaAtencaoPct)return;const level=drop>=cfg.quedaCriticaPct?'CRÍTICO':'ATENÇÃO',
state=findDashboardAlertState(f.group,weekKey)?.status||'PENDENTE';
  out.push({group:f.group,
faccao:f.faccao,
segmento:f.segmento,
currentAvg,
previousAvg,
drop,
level,
state,
pairs:pairs.length,
weekKey,
currentStart:curStart,
previousStart:prevStart});
 });
return out.sort((a,b)=>(a.state==='CONCLUIDO')-(b.state==='CONCLUIDO')||b.drop-a.drop);

}
function vacantMetricAnomalies(){
 const cutoff=new Date();
cutoff.setDate(cutoff.getDate()-7);
const by=new Map();
metricSemOcupante.forEach(r=>{const g=String(r.group||r.organizacao||r.faccao||'').trim(),
d=metricDateValue(r);if(!g||!d||d<cutoff)return;const vals=Object.values(metricSlots(r)).map(Number).filter(Number.isFinite),
mx=vals.length?Math.max(...vals):0;if(mx<=0)return;const cur=by.get(alvesNorm(g));if(!cur||d>cur.date)by.set(alvesNorm(g),{group:g,
date:d,
value:mx,
row:r})});

 return [...by.values()].filter(x=>!anomalyIsCleared(x.group,x.date)).map(x=>{const gkF=v=>alvesNorm(v).replace(/[^a-z0-9]/g,'').replace(/mecanic/g,'mechanic').replace(/0*(\d+)$/,'$1'),gk=gkF(x.group),cands=faccoes.filter(z=>!z.removido&&gkF(z.group)===gk),f=cands.find(z=>ocupadoV14(z))||cands[0];const ini=metricOcupTL?.inicioAtual?.(x.group);const assumido=f&&ocupadoV14(f)?{faccao:f.faccao,desde:ini&&ini.faccao&&Number.isFinite(ini.t)&&ini.t>0?new Date(ini.t):null}:null;const lastDelivery=historico.filter(h=>h.tipo==='ENTREGA_GROUP'&&alvesNorm(h.group)===alvesNorm(x.group)).sort((a,b)=>historyMillis(b)-historyMillis(a))[0];return {...x,
qg:f?.qg||'',
staff:f?.staff||'',
assumido,
hasExtract:!!lastDelivery};}).sort((a,b)=>b.date-a.date);

}
function dashboardGo(page){activateAppPage(page)}
function openMetricForGroup(group){
 activateAppPage('metricas');
const cur=startOfWeekMonday(new Date());
metricDateStart=isoDay(cur);
metricDateEnd=isoDay(new Date());
syncMetricDateInputs();
renderMetrics();
if($('#metricScopeSelect'))$('#metricScopeSelect').value=group;
if($('#metricFactionSelect'))$('#metricFactionSelect').value=group;
switchMetricCenterView('faction');
renderMetricFactionDetail(group);

}
/* ===== V14 · painéis de ocupação / revisão (modules/painel-ocupacao.js) ===== */
const estadoV14={get faccoes(){return faccoes},get entregas(){return entregas}};
function inconsistenciasV14(){return inconsistencias(faccoes,entregas)}
function painelDepsV14(){return {esc,estado:estadoV14,db,fs:{setDoc,doc,addDoc,serverTimestamp},histCol,
 user:()=>({email:currentUser?.email||'',sessionId:currentSessionId||''}),
 discordState:f=>availableDiscordState(f),anuncioTexto:f=>availableAnnouncementText(f),
 marcarPostado:(g,v)=>setAvailableDiscordState(g,v),
 abrirEntrega:g=>openNewDelivery(g),
 abrirGroup:g=>{activateAppPage('faccoes');const f=faccoes.find(x=>x.group===g);if(f)openFac(f.id)},
 abrirOrganizacoes:st=>{activateAppPage('faccoes');const sel=$('#facStatus');if(sel){sel.value=st==='SEM_QG'?'INDISPONIVEL':st;renderFaccoes();}},
 recarregar:async()=>{await loadFaccoes();renderCommandDashboard();},
 alert:msg=>alert(msg)}}
function renderCommandDashboard(){
 const box=$('#commandDashboard');
if(!box)return;
if(highOsEmergencyReadOnly&&!faccoesLoaded){
 box.innerHTML=faccoesEmergencyError?'<div class="placeholder"><h3>DADOS OPERACIONAIS INDISPONÍVEIS</h3><p>Não foi encontrada uma cópia das facções no navegador ou no Firestore. Os números atuais são desconhecidos; não foram apagados do Discord.</p></div>':'<div class="placeholder"><h3>CONSULTANDO CÓPIA HISTÓRICA</h3><p>Discord offline. O High OS tentará recuperar registros antigos do Firestore ou deste navegador.</p></div>';
 return;
}
if(highOsEmergencyReadOnly&&!faccoes.length){
 box.innerHTML='<div class="placeholder"><h3>DADOS OPERACIONAIS INDISPONÍVEIS</h3><p>Sem conexão com o Discord e sem cópia histórica. Os números atuais são desconhecidos, não zero.</p></div>';
 return;
}

 /* V14: regra única de ocupação (modules/ocupacao.js) */
 const active=faccoes.filter(f=>!f.removido&&situacaoGroup(f)==='ASSUMIDA'),
vacant=faccoes.filter(f=>!f.removido&&situacaoGroup(f)==='DISPONIVEL'),
weekly=weeklyContingentAlerts(),
visibleWeekly=weekly.filter(x=>x.state!=='LIMPO'),
openAlerts=visibleWeekly.filter(x=>x.state!=='CONCLUIDO'),
critical=openAlerts.filter(x=>x.level==='CRÍTICO').length;

 const pending=solicitacoes.filter(x=>String(x.status||'').toUpperCase()==='PENDENTE').length,
health=dashboardHealth(weekly),
anomalies=vacantMetricAnomalies();

 const segs={};
faccoes.forEach(f=>{const k=f.segmento||'OUTROS';if(!segs[k])segs[k]={all:0,
on:0};segs[k].all++;if(f.status==='ATIVA'&&f.faccao)segs[k].on++});

 const movements=historico.slice(0,6),
rec30=historico.filter(h=>historyFamily(h.tipo)==='RECOLHIMENTO').length,
ent30=historico.filter(h=>historyFamily(h.tipo)==='ENTREGA').length;

 const bars=Object.entries(segs).map(([k,
v])=>`<div class="dash-seg-row"><span>${esc(k)}</span><div><i style="width:${v.all?Math.max(3,v.on/v.all*100):0}%"></i></div><b>${v.on}/${v.all}</b></div>`).join('');

 /* V14.9 · CENTRAL DE ALERTAS — um painel só, com abas e linhas compactas */
 const alTab=(()=>{try{return localStorage.getItem('dash.alertTab')||''}catch(e){return ''}})();
 const alExp=(()=>{try{return localStorage.getItem('dash.alertExp')==='1'}catch(e){return false}})();
 const weekOpen=visibleWeekly.filter(x=>x.state!=='CONCLUIDO').sort((a,b)=>(b.level==='CRÍTICO')-(a.level==='CRÍTICO')||b.drop-a.drop),weekDone=visibleWeekly.filter(x=>x.state==='CONCLUIDO');
 const anoVago=anomalies.filter(x=>!x.assumido),anoAntes=anomalies.filter(x=>x.assumido);
 const tabs=[['queda','QUEDA DE CONTINGENTE',weekOpen.length,critical?'crit':'warn'],['vago','GROUP VAGO COM PLAYER',anoVago.length,'crit'],['antes','COLETA ANTES DA ASSUNÇÃO',anoAntes.length,'info'],['ok','CONCLUÍDOS',weekDone.length,'ok']];
 const tabAtual=tabs.find(t=>t[0]===alTab&&t[2])?.[0]||tabs.find(t=>t[2]&&t[0]!=='ok')?.[0]||'queda';
 const LIM=6;
 const rowWeek=x=>`<article class="al-row ${x.level==='CRÍTICO'?'crit':'warn'} ${x.state==='CONCLUIDO'?'done':''}"><button type="button" class="al-main" data-alert-group="${esc(x.group)}"><i></i><b>${esc(x.faccao)}</b><span class="al-g">${esc(x.group)}</span><span class="al-meta">${x.currentAvg.toFixed(1)} vs ${x.previousAvg.toFixed(1)} · ${x.pairs} coletas</span><strong>−${x.drop.toFixed(0)}%</strong></button><div class="al-act"><button type="button" title="${x.state==='CONCLUIDO'?'Reabrir':'Marcar como concluído'}" data-alert-state="${x.state==='CONCLUIDO'?'PENDENTE':'CONCLUIDO'}" data-group="${esc(x.group)}" data-week="${esc(x.weekKey)}">${x.state==='CONCLUIDO'?'↺':'✓'}</button><button type="button" title="Limpar do Dashboard nesta semana" data-alert-state="LIMPO" data-group="${esc(x.group)}" data-week="${esc(x.weekKey)}">✕</button></div></article>`;
 const rowAno=x=>`<article class="al-row ${x.assumido?'info':'crit'}"><button type="button" class="al-main" data-anomaly-group="${esc(x.group)}" title="${x.assumido?`Na data da coleta o Group ainda constava vago. Se ${esc(x.assumido.faccao)} já estava lá, corrija a DATA DE ENTREGA no perfil da facção.`:'Confirme a ocupação. Se não houve assunção, peça para quem estiver no Group sair.'}"><i></i><b>${esc(x.group)}</b><span class="al-g">${x.assumido?`hoje: ${esc(x.assumido.faccao)}${x.assumido.desde?' desde '+x.assumido.desde.toLocaleDateString('pt-BR'):''}`:esc(x.qg||'sem QG')}</span><span class="al-meta">coleta ${x.date.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})} ${x.date.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span><strong>${x.value} ON</strong></button><div class="al-act">${x.assumido?'':`<button type="button" title="Registrar entrega de facção" data-deliver-anomaly="${esc(x.group)}">＋</button>`}<button type="button" title="Limpar alerta" data-clear-anomaly="${esc(x.group)}" data-anomaly-date="${esc(x.date.toISOString())}">✕</button></div></article>`;
 const listas={queda:weekOpen.map(rowWeek),vago:anoVago.map(rowAno),antes:anoAntes.map(rowAno),ok:weekDone.map(rowWeek)};
 const vazio={queda:'Nenhuma queda semanal relevante entre as facções ocupadas.',vago:'Nenhum player em Group vago nos últimos 7 dias.',antes:'Nenhuma coleta antes da data de entrega.',ok:'Nada concluído nesta semana.'};
 const dica={queda:'Semana atual × mesmos dias e horários da semana anterior. Clique para abrir a métrica.',vago:'Coletas com player em Group sem facção. ＋ registra a entrega, ✕ limpa.',antes:'O Group está assumido, mas a coleta é anterior à data de entrega. Se a facção já estava lá, corrija a data no perfil.',ok:'Alertas marcados com ✓ nesta semana.'};
 const L=listas[tabAtual]||[];
 const alertCenter=`<section class="dash-panel dash-wide al-center"><header><div><span>CENTRAL DE ALERTAS</span><h3>${weekOpen.length+anoVago.length+anoAntes.length?`${weekOpen.length+anoVago.length+anoAntes.length} PONTOS DE ATENÇÃO`:'TUDO EM ORDEM'}</h3></div>${(tabAtual==='vago'||tabAtual==='antes')&&L.length>1?`<button type="button" data-al-clear-all="${tabAtual}">LIMPAR TODOS</button>`:''}</header>
 <nav class="al-tabs">${tabs.map(([k,l,n,c])=>`<button type="button" class="${k===tabAtual?'on':''} t-${c}" data-al-tab="${k}"${n||k===tabAtual?'':' disabled'}>${l}<em>${n}</em></button>`).join('')}</nav>
 <p class="al-hint">${dica[tabAtual]}</p>
 <div class="al-list">${L.length?(alExp?L:L.slice(0,LIM)).join(''):`<div class="dash-empty good-text">${vazio[tabAtual]}</div>`}</div>
 ${L.length>LIM?`<button type="button" class="al-more" data-al-exp>${alExp?'MOSTRAR MENOS':`VER TODOS (${L.length})`}</button>`:''}</section>`;

 const activity=movements.map(h=>`<div class="dash-activity-row"><i></i><div><b>${esc(historyTitle(h))}</b><span>${esc([h.group,h.faccao].filter(Boolean).join(' • ')||h.descricao||'Operação administrativa')}</span><small>${esc(formatHistoryDate(h))}${h.usuario?' • '+esc(h.usuario):''}</small></div></div>`).join('')||'<div class="dash-empty">Nenhuma movimentação registrada.</div>';

 box.innerHTML=`${highOsEmergencyReadOnly?'<div role="status" style="padding:12px;margin-bottom:14px;border:1px solid #8d682a;border-radius:8px;color:#ffe2a0;background:#221c10">DADOS HISTÓRICOS / CACHE • Não representam a situação atual da cidade. Discord offline.</div>':''}<section class="dash-command-hero"><div><span class="dash-hero-kicker">HIGH OS • CENTRAL EXECUTIVA</span><h3>VISÃO GERAL DO ILEGAL</h3><p>Indicadores, alertas e ações prioritárias reunidos em uma leitura rápida da operação.</p></div><div class="dash-hero-actions"><button type="button" data-open-management>ABRIR GESTÃO DO ILEGAL</button><button type="button" class="primary" data-open-general-report>GERAR RELATÓRIO GERAL</button></div></section><div class="dash-kpis"><button data-go="faccoes"><span>FACÇÕES ATIVAS</span><b>${active.length}</b><small>somente ocupadas</small></button><button data-go="faccoes"><span>DISPONÍVEIS</span><b>${vacant.length}</b><small>prontas para entrega</small></button><button data-go="metricas" class="${openAlerts.length?'warn':''}"><span>ALERTAS SEMANAIS</span><b>${openAlerts.length}</b><small>${critical?critical+' crítico(s)':'comparação com semana anterior'}</small></button><article class="health ${health.toLowerCase()}"><span>SAÚDE DO ILEGAL</span><b>${health}</b><small>${openAlerts.length?openAlerts.length+' alerta(s) pendente(s)':'sem alertas pendentes'}</small></article></div>
 <div class="dash-grid">${alertCenter}${painelDisponiveisHtml(painelDepsV14())}${painelOcupacaoHtml(painelDepsV14())}
 <section class="dash-panel"><header><div><span>30 DIAS / HISTÓRICO</span><h3>MOVIMENTAÇÃO DE FACÇÕES</h3></div><button data-go="historico">VER HISTÓRICO →</button></header><div class="dash-move-kpis"><div><b>${ent30}</b><span>ENTREGAS</span></div><div><b>${rec30}</b><span>RECOLHIMENTOS</span></div><div><b>${historico.length}</b><span>EVENTOS</span></div></div></section>
 <section class="dash-panel dash-wide"><header><div><span>AUDITORIA</span><h3>ATIVIDADE RECENTE</h3></div><button data-go="historico">ABRIR HISTÓRICO →</button></header><div class="dash-activity">${activity}</div></section></div>`;

 box.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>dashboardGo(b.dataset.go));
ligarPaineis(box,painelDepsV14(),renderCommandDashboard);
box.querySelector('[data-open-management]')?.addEventListener('click',()=>{activateAppPage('metricas');switchMetricCenterView('management');renderIllegalManagement()});
box.querySelector('[data-open-general-report]')?.addEventListener('click',mgmtOpenRichReport);
box.querySelectorAll('[data-alert-group]').forEach(b=>b.onclick=()=>openMetricForGroup(b.dataset.alertGroup));
box.querySelectorAll('[data-alert-state]').forEach(b=>b.onclick=e=>{e.stopPropagation();setDashboardAlertState(b.dataset.group,b.dataset.week,b.dataset.alertState)});
box.querySelectorAll('[data-anomaly-group]').forEach(b=>b.onclick=()=>{activateAppPage('faccoes');const f=faccoes.find(x=>alvesNorm(x.group)===alvesNorm(b.dataset.anomalyGroup));if(f)openFac(f.id)});
box.querySelectorAll('[data-deliver-anomaly]').forEach(b=>b.onclick=e=>{e.stopPropagation();const f=estado.faccoes.find(x=>alvesNorm(x.group)===alvesNorm(b.dataset.deliverAnomaly));openNewDelivery(f?.group||b.dataset.deliverAnomaly)});
box.querySelectorAll('[data-clear-anomaly]').forEach(b=>b.onclick=e=>{e.stopPropagation();clearVacantMetricAlert(b.dataset.clearAnomaly,new Date(b.dataset.anomalyDate))});
box.querySelectorAll('[data-al-tab]').forEach(b=>b.onclick=()=>{try{localStorage.setItem('dash.alertTab',b.dataset.alTab);localStorage.setItem('dash.alertExp','0')}catch(e){}renderCommandDashboard()});
box.querySelector('[data-al-exp]')?.addEventListener('click',()=>{try{localStorage.setItem('dash.alertExp',alExp?'0':'1')}catch(e){}renderCommandDashboard()});
box.querySelector('[data-al-clear-all]')?.addEventListener('click',async e=>{const k=e.currentTarget.dataset.alClearAll,lst=k==='antes'?anoAntes:anoVago;if(!confirm(`Limpar ${lst.length} alertas desta aba?`))return;for(const x of lst){try{await clearVacantMetricAlert(x.group,x.date)}catch(err){console.warn(err)}}renderCommandDashboard()});

}
const _loadMetricsV78=loadMetrics;
loadMetrics=async function(){await _loadMetricsV78();
renderCommandDashboard()};

const _renderHistoryV78=renderHistory;
renderHistory=function(){_renderHistoryV78();
renderCommandDashboard()};

const _renderOrganizationsV78=renderOrganizations;
renderOrganizations=function(){_renderOrganizationsV78();
renderCommandDashboard()};

// HIGH OS V8.6 — solicitação automática ao salvar Craft adquirido/extra
function craftRecipeKey(r={}){return String(r.spawn||r.id||r.nome||'').trim().toLowerCase()}
function farmItemKey(x={}){return String(x.spawn||x.nome||'').trim().toLowerCase()}
function ingredientDisplay(x={}){
 const meta=ITEM_META[x.spawn]||{};

 const nome=x.nome||meta.nome||x.spawn||'Item';

 const qtd=String(x.qtd??'').trim();

 return qtd?`${nome} x${qtd}`:nome;

}
function isLaundryMachineRecipe(r={}){
 const txt=`${r.nome||''} ${r.spawn||''}`.toLowerCase();

 return /brastemp|m[aá]quina.*lav|maquina.*lav|lavagem/.test(txt) || String(r.spawn||'').toLowerCase()==='lavagem';

}
function buildCraftRequestText(group,recipe,newProfile={},oldProfile={}){
 const product=recipe?.nome||recipe?.spawn||'Produto';

 const recipeLine=(recipe?.insumos||[]).map(ingredientDisplay).join(', ')||'Informar receita';

 const oldFarm=new Map(((oldProfile?.farm?.itens)||[]).map(x=>[farmItemKey(x),
x]));

 let farmNew=((newProfile?.farm?.itens)||[]).filter(x=>!oldFarm.has(farmItemKey(x)));

 if(!farmNew.length)farmNew=(recipe?.insumos||[]).map(x=>({spawn:x.spawn,
nome:x.nome||ITEM_META[x.spawn]?.nome||x.spawn,
qtd:x.qtd}));

 if(isLaundryMachineRecipe(recipe) && !farmNew.some(x=>farmItemKey(x)==='washbleach'||/alvejante/i.test(x.nome||''))){
   farmNew.push({spawn:'washbleach',
nome:'Alvejante'});

 }
 const seen=new Set(),
farmNames=[];

 farmNew.forEach(x=>{const k=farmItemKey(x);if(!k||seen.has(k))return;seen.add(k);farmNames.push(x.nome||ITEM_META[x.spawn]?.nome||x.spawn)});

 const farmLine=farmNames.length?farmNames.join(', '):'Informar itens do farm';

 const L=[
  'Assunto:',
'',

  `- Adição do produto "${product}" no Group "${group}";`,
'',

  'Solicitação:',
'',

  `- Adicionar o produto "${product}" ao craft do group "${group}";`,
'',

  `- Receita do Craft: ${recipeLine};`,
'',

  `- Adicionar os itens abaixo no farm do group "${group}";`,
'',

  `- ${farmLine};`,
'',

 ];

 if(isLaundryMachineRecipe(recipe)){
   L.push(`- Obs: O Group referido abaixo terá permissão para fabricar a "${product}" e apenas o "Lider e o Sublider" desse group poderão utilizar a mesma para realizar lavagem, as configurações e restrições do item seguem padrão.`,'');

 }else if(String(recipe?.origem||'').toUpperCase()==='ADQUIRIDO EM LOJA'){
   L.push(`- Obs: Craft adquirido em loja para o Group "${group}". A receita deverá ser adicionada somente a este Group, mantendo as configurações e restrições padrão do item.`,'');

 }
 L.push(`- Permissão "${group}".`);

 return {texto:L.join('\n'),
farmItens:farmNames};

}
function openCraftRequestModal(group,recipe,requestData){
 const modal=$('#craftRequestModal'),
ta=$('#craftRequestText'),
sum=$('#craftRequestSummary');

 if(!modal||!ta)return;

 ta.value=requestData?.texto||'';

 if(sum)sum.innerHTML=`<span>GROUP: ${esc(group)}</span><span>PRODUTO: ${esc(recipe?.nome||recipe?.spawn||'—')}</span><span>TIPO: ${esc(recipe?.origem||'EXTRA DO GROUP')}</span>`;

 modal.classList.remove('hidden');

}
function closeCraftRequestModal(){$('#craftRequestModal')?.classList.add('hidden')}
$('#craftRequestClose')?.addEventListener('click',closeCraftRequestModal);

$('#craftRequestLater')?.addEventListener('click',closeCraftRequestModal);

$('#craftRequestModal')?.addEventListener('click',e=>{if(e.target.id==='craftRequestModal')closeCraftRequestModal()});

$('#copyCraftRequestBtn')?.addEventListener('click',async()=>{
 const t=$('#craftRequestText')?.value||'';if(!t)return;const b=$('#copyCraftRequestBtn'),
old=b?.textContent||'COPIAR SOLICITAÇÃO';
 try{await navigator.clipboard.writeText(t);if(b)b.textContent='COPIADO ✓'}catch(e){const ta=$('#craftRequestText');ta?.select();document.execCommand('copy');if(b)b.textContent='COPIADO ✓'}
 setTimeout(()=>{if(b)b.textContent=old},1400);
});

// HIGH OS V8.7 — persistência forte de Craft/Farm.
// Salva diretamente no documento do Group e relê o Firestore para impedir que
// um rascunho antigo da tela sobrescreva receitas recém-cadastradas.
async function persistCurrentTechProfile(group, {reload=true}={}){
 if(!group)throw new Error('Group não identificado.');

 const ref=doc(db,'highos','data','faccoes',idFac(group));

 const perfilTecnico=getTechProfileFromForm();
 const local=faccoes.find(x=>x.group===group);
 const previousGroup=clonePlain(local||{group});
 const before=clonePlain(mergedTechProfile(local||{}));
 if(JSON.stringify(before)===JSON.stringify(clonePlain(perfilTecnico))){
   return clonePlain(perfilTecnico);
 }

 await setDoc(ref,{perfilTecnico,
updatedAt:serverTimestamp(),
updatedBy:currentUser?.email||''},{merge:true});

 /* V10.69 - o setDoc concluído já confirma o perfil enviado. Craft/Farm
    continua usando o mesmo payload para solicitação e histórico, sem reler
    o documento inteiro do Group após cada edição. */
 if(local){
   local.perfilTecnico=clonePlain(perfilTecnico);
   techDraft=mergedTechProfile(local);
 }else{
   techDraft=clonePlain(perfilTecnico);
 }
 const currentGroup={...(local||{group}),perfilTecnico};
 const techSheetOk=await syncBlipsGroups([currentGroup],{quiet:true,overwriteFieldsByGroup:blipsChangedFieldsByGroup([previousGroup],[currentGroup])});
 if(!techSheetOk)facSheetRenderStatus('warn','Perfil técnico salvo no High OS; planilha de coordenadas pendente.');
 return clonePlain(perfilTecnico);

}

// HIGH OS V7.9 — editores visuais de Receita e Farm (sem prompt do navegador)
$('#recipeEditorClose')?.addEventListener('click',closeRecipeEditor);

$('#recipeEditorCancel')?.addEventListener('click',()=>{const i=+($('#recipeEditorIndex')?.value||-1),
r=techDraft?.craft?.receitas?.[i];if(r&&!r.nome&&!r.spawn){techDraft.craft.receitas.splice(i,1);renderCraftRecipes();renderFarmItems()}closeRecipeEditor()});

$('#recipeAddIngredient')?.addEventListener('click',()=>{const items=readIngredientEditor();items.push({spawn:'',
nome:'',
qtd:'',
imagem:''});renderIngredientEditor(items)});

$('#recipeEditorSpawn')?.addEventListener('input',e=>{$('#recipeEditorImage').src=itemImg(e.target.value.trim(),ITEM_META[e.target.value.trim()]?.imagem||'',$('#recipeEditorName')?.value||'')});

$('#recipeEditorForm')?.addEventListener('submit',async e=>{
 e.preventDefault();
 const i=Number($('#recipeEditorIndex')?.value);
 const r=Number.isInteger(i)?techDraft?.craft?.receitas?.[i]:null;
 if(!r)return alert('Não foi possível localizar esta receita. Feche e abra o Craft novamente.');
 const nome=$('#recipeEditorName').value.trim(),
spawn=$('#recipeEditorSpawn').value.trim(),
insumos=readIngredientEditor();
 if(!nome||!spawn)return alert('Informe o nome e o spawn do produto.');
 if(!insumos.length)return alert('Adicione pelo menos um insumo à receita antes de salvar.');
 r.nome=nome;r.spawn=spawn;r.nivel=$('#recipeEditorLevel').value.trim();r.max=$('#recipeEditorMax').value.trim();r.origem=$('#recipeEditorOrigin')?.value||r.origem||'EXTRA DO GROUP';r.disponibilidade=r.origem==='ADQUIRIDO EM LOJA'?'TODAS AS FACÇÕES':(r.disponibilidade||'');r.insumos=insumos;r.imagem=ITEM_META[r.spawn]?.imagem||r.imagem||'';r.origem=r.origem||'EXTRA DO GROUP';
 const recipeChanged=!recipeEditorOriginal||JSON.stringify(recipeEditorOriginal)!==JSON.stringify(clonePlain(r));
 if(!recipeChanged){closeRecipeEditor();return alert('Nenhuma alteração na receita.');}
 syncFarmWithCraft();renderCraftRecipes();renderFarmItems();updateDeliveryPreview();renderConnectedRequests();
 const group=$('#fGroup')?.value||'';
 const btn=$('#recipeEditorSave');
 if(btn){btn.disabled=true;btn.textContent='SALVANDO...'}
 try{
   if(!group)throw new Error('Group não identificado.');
   const local=faccoes.find(x=>x.group===group);
   const oldPerfil=clonePlain(mergedTechProfile(local||{}));
   const perfilTecnico=getTechProfileFromForm();
   const oldRecipe=(oldPerfil?.craft?.receitas||[]).find(x=>craftRecipeKey(x)===craftRecipeKey(r));
   await persistCurrentTechProfile(group,{reload:true});
   const shouldGenerate=String(r.origem||'').toUpperCase()!=='PADRÃO DO SEGMENTO';
   let generatedRequest=null,
requestRef=null;
   if(shouldGenerate){
     generatedRequest=buildCraftRequestText(group,r,perfilTecnico,oldPerfil);
     const craftPayload={isModelo:false,
status:'PENDENTE',
tipo:'CRAFT_ITEM',
group,
faccao:local?.faccao||'',
assunto:`Adição do produto ${nome} no Group ${group}`,
texto:generatedRequest.texto,
receita:clonePlain(r),
farmItens:generatedRequest.farmItens,
origem:'CRAFT_DO_GROUP',
solicitadoPor:currentUser?.email||'',
createdAt:serverTimestamp(),
createdAtText:new Date().toISOString(),
createdBy:currentUser?.email||'',
fingerprint:requestFingerprint({group,
tipo:'CRAFT_ITEM',
texto:generatedRequest.texto})};const dup=requestRecords.find(x=>x.status==='PENDENTE'&&x.fingerprint===craftPayload.fingerprint);if(dup){requestRef={id:dup.id}}else{requestRef=await addDoc(reqCol,craftPayload);requestRecords.unshift({id:requestRef.id,
...clonePlain(craftPayload),
createdAt:null})};
   }
   await addDoc(histCol,{sessionId:currentSessionId||'',
tipo:'CRAFT_RECEITA',
group,
faccao:local?.faccao||'',
descricao:`Receita ${nome} (${spawn}) salva no Craft do Group${generatedRequest?' • solicitação gerada':''}`,
receita:clonePlain(r),
solicitacaoId:requestRef?.id||'',
solicitacaoTexto:generatedRequest?.texto||'',
alteracao:oldRecipe?'EDICAO':'ADICAO',
usuario:currentUser?.email||'',
data:serverTimestamp()});
   if(btn)btn.textContent=generatedRequest?'SALVO + SOLICITAÇÃO ✓':'SALVO ✓';
   setTimeout(()=>{closeRecipeEditor();if(generatedRequest)openCraftRequestModal(group,r,generatedRequest)},250);
 }catch(err){
   if(btn){btn.disabled=false;btn.textContent='SALVAR RECEITA'}
   alert('Erro ao salvar a receita: '+(err?.message||err));
 }
});

$('#farmEditorClose')?.addEventListener('click',closeFarmEditor);

$('#farmEditorCancel')?.addEventListener('click',()=>{const i=+($('#farmEditorIndex')?.value||-1),
x=techDraft?.farm?.itens?.[i];if(x&&String(x.origem||'').toUpperCase()!=='CRAFT'&&!x.nome&&!x.spawn){techDraft.farm.itens.splice(i,1);renderFarmItems()}closeFarmEditor()});

$('#farmEditorSpawn')?.addEventListener('input',e=>{$('#farmEditorImage').src=itemImg(e.target.value.trim(),ITEM_META[e.target.value.trim()]?.imagem||'',$('#farmEditorName')?.value||'')});

$('#farmEditorForm')?.addEventListener('submit',e=>{e.preventDefault();const i=+($('#farmEditorIndex')?.value||-1),
x=techDraft?.farm?.itens?.[i];if(!x||String(x.origem||'').toUpperCase()==='CRAFT')return closeFarmEditor();x.nome=$('#farmEditorName').value.trim();x.spawn=$('#farmEditorSpawn').value.trim();x.qtd=$('#farmEditorQty').value.trim();x.imagem=ITEM_META[x.spawn]?.imagem||x.imagem||'';renderFarmItems();renderConnectedRequests();updateDeliveryPreview();closeFarmEditor()});

// HIGH OS V8.1 · FACÇÕES DISPONÍVEIS + ANÚNCIOS DISCORD
// Modelo oficial "ASSUMIR FACÇÃO ILEGAL! 📌" — muda apenas segmento, local, contingente e fabricação.
const ANUNCIO_ASSUMIR_CANAL='<#1488964261513531583>';
const ANUNCIO_SEGMENTO_NOME={ARMAS:'Armas','MUNIÇÃO':'Munição',MUNICAO:'Munição',DROGAS:'Drogas',LAVAGEM:'Lavagem',DESMANCHE:'Desmanche','ESTELIONATÁRIOS':'Estelionatários',ESTELIONATARIOS:'Estelionatários',CONTRABANDO:'Contrabando',APOIO:'Apoio',OUTROS:'Outros'};
const ANUNCIO_FABRICACAO={
 ARMAS:'Armas de pequeno, médio e grosso calibre.',
 'MUNIÇÃO':'Cx de Munição de Rifle, Cx de Munição de SMG, Cx de Munição de Pistola, C4, C4++, Energético Zero.',
 MUNICAO:'Cx de Munição de Rifle, Cx de Munição de SMG, Cx de Munição de Pistola, C4, C4++, Energético Zero.',
 LAVAGEM:'Lavadora Brastemp, Secadora, Pendrive Clandestino (1 ao 5).',
 DESMANCHE:'Cartão Ilegível, Cartão Ilegível ++, Bloqueador de Sinal, Gazua (Lockpick Veículos), Gazua ++ (Lockpick Casas).',
 DROGAS:'Pacote Selado de Droga, Placa Balística, Capuz.',
 'ESTELIONATÁRIOS':'Cartões Nuhigh (prata e ouro) e dinheiro falso.',
 ESTELIONATARIOS:'Cartões Nuhigh (prata e ouro) e dinheiro falso.',
 CONTRABANDO:'Farm de todas as facções disponíveis.'
};
function anuncioSegmentoKey(seg){return String(seg||'OUTROS').trim().toUpperCase().replace(/\d+$/,'')}
function anuncioSegmentoNome(seg){const k=anuncioSegmentoKey(seg);return ANUNCIO_SEGMENTO_NOME[k]||k.charAt(0)+k.slice(1).toLowerCase()}
function anuncioFabricacao(f){
 const k=anuncioSegmentoKey(f.segmento);
 // Apoio/Outros variam por Group: usa o produto cadastrado no próprio Group.
 if(ANUNCIO_FABRICACAO[k])return ANUNCIO_FABRICACAO[k];
 const p=String(f.produto||'').trim().replace(/\s+/g,' ').replace(/[.;,\s]+$/,'');
 return p?p.charAt(0).toUpperCase()+p.slice(1)+'.':'Conforme o segmento da facção.';
}
function availableAnnouncementText(f){
 const min=Math.max(1,Number(f.contingenteMin||15));
 const max=Math.max(min,Number(f.contingenteMax||28));
 const local=String(f.qg||'').trim()||'A definir';
 const linhas=[
  'ASSUMIR FACÇÃO ILEGAL! 📌',
  'Facção disponível para assumir via contingente.',
  '',
  `Segmento: ${anuncioSegmentoNome(f.segmento)}`,
  `Localização: ${local}`,
  `Contingente para assumir: De ${min} a ${max} pessoas.`,
  `Fabricação: ${anuncioFabricacao(f)}`,
  '',
  'Benefícios ao assumir:',
  '',
  'Kit inicial Facção. (Com mais de 25 itens)',
  '',
  'VIP Facção por 15 dias.',
  '',
  'R$ 1.000.000 em dinheiro sujo.',
  '',
  'Possibilidade de benefícios futuros por meta de contingente.',
  '',
  `Interessados devem acessar ${ANUNCIO_ASSUMIR_CANAL}, selecionar "Assumir Facção" e apresentar o contingente solicitado.`
 ];
 if(f.imagemAnuncio)linhas.push('',String(f.imagemAnuncio).trim());
 return linhas.join('\n');
}

async function saveAvailableImageLink(group,input,button){
 const f=faccoes.find(x=>x.group===group);
if(!f||!currentUser)return;

 const url=String(input?.value||'').trim();

 if(url&&!/^https?:\/\//i.test(url)){alert('Informe um link válido começando com http:// ou https://');
return}
 const old=f.imagemAnuncio||'';

 if(url===old){if(button){const t=button.textContent;
button.textContent='JÁ SALVO';
setTimeout(()=>button.textContent=t,900)}return}
 try{
  if(button){button.disabled=true;
button.textContent='SALVANDO...'}
  await setDoc(doc(db,'highos','data','faccoes',idFac(group)),{imagemAnuncio:url,
updatedAt:serverTimestamp(),
updatedBy:currentUser.email},{merge:true});

  await addDoc(histCol,{sessionId:currentSessionId||'',
tipo:'IMAGEM_ANUNCIO_DISCORD',
group,
antes:{imagemAnuncio:old},
depois:{imagemAnuncio:url},
descricao:url?'Link da imagem do anúncio cadastrado/alterado':'Link da imagem do anúncio removido',
usuario:currentUser.email,
data:serverTimestamp()});

  f.imagemAnuncio=url;
  f.updatedBy=currentUser.email;
  queryFreshAt.set('faccoes',Date.now());
  renderAvailableFaccoes();
  renderFaccoes();

 }catch(e){alert('Erro ao salvar link da imagem: '+e.message);
if(button){button.disabled=false;
button.textContent='SALVAR LINK'}}
}
async function saveAvailableContingent(group,card,button){
 const f=faccoes.find(x=>x.group===group);
if(!f||!currentUser)return;

 const min=Math.max(1,Number(card?.querySelector('.available-cont-min')?.value||15));

 const rawMax=Number(card?.querySelector('.available-cont-max')?.value||28);

 const max=Math.max(min,rawMax||28);

 const antes={contingenteMin:Number(f.contingenteMin||15),
contingenteMax:Number(f.contingenteMax||28)};
 if(antes.contingenteMin===min&&antes.contingenteMax===max){
  if(button){const t=button.textContent;button.textContent='JÁ SALVO';setTimeout(()=>button.textContent=t,900)}
  return;
 }

 try{
  if(button){button.disabled=true;
button.textContent='SALVANDO...'}
  await setDoc(doc(db,'highos','data','faccoes',idFac(group)),{contingenteMin:min,
contingenteMax:max,
updatedAt:serverTimestamp(),
updatedBy:currentUser.email},{merge:true});

  await addDoc(histCol,{sessionId:currentSessionId||'',
tipo:'CONTINGENTE_ANUNCIO',
group,
antes,
depois:{contingenteMin:min,
contingenteMax:max},
descricao:`Contingente do anúncio alterado para ${min} a ${max} membros`,
usuario:currentUser.email,
data:serverTimestamp()});

  f.contingenteMin=min;
  f.contingenteMax=max;
  f.updatedBy=currentUser.email;
  queryFreshAt.set('faccoes',Date.now());
  renderAvailableFaccoes();
  renderFaccoes();

 }catch(e){alert('Erro ao salvar contingente: '+e.message);
if(button){button.disabled=false;
button.textContent='SALVAR CONTINGENTE'}}
}
function availableDiscordState(f){
 const meta=f?.anuncioDiscordStatus||{};

 if(meta.postado===true)return 'POSTADO';

 if(meta.postado===false&&(meta.confirmado===true||meta.naoPostadoEm||meta.desmarcadoEm))return 'NAO_POSTADO';

 return 'NAO_INFORMADO';

}
function availablePosted(f){return availableDiscordState(f)==='POSTADO'}
function renderAvailableFaccoes(){
 const box=$('#availableList');
if(!box)return;
renderAvailableSegmentCards();

 const q=($('#availableSearch')?.value||'').toLowerCase(),
seg=$('#availableSegment')?.value||'',
dc=$('#availableDiscord')?.value||'';

 const all=faccoes.filter(f=>f.status!=='ATIVA'||!String(f.faccao||'').trim());

 const list=all.filter(f=>(!seg||segmentKey(f.segmento)===segmentKey(seg))&&(!q||[f.group,
f.qg,
f.produto,
f.segmento].join(' ').toLowerCase().includes(q))&&(!dc||availableDiscordState(f)===dc));

 const posted=all.filter(f=>availableDiscordState(f)==='POSTADO').length,
notPosted=all.filter(f=>availableDiscordState(f)==='NAO_POSTADO').length,
unknown=all.filter(f=>availableDiscordState(f)==='NAO_INFORMADO').length;

 if($('#availableStats'))$('#availableStats').innerHTML=`<span><b>${all.length}</b> LIVRES</span><span><b>${unknown}</b> NÃO INFORMADO</span><span><b>${notPosted}</b> NÃO POSTADAS</span><span><b>${posted}</b> POSTADAS</span><span><b>${list.length}</b> EXIBIDAS</span>`;

 if(!list.length){box.innerHTML='<div class="placeholder"><b>◈</b><h3>NENHUMA FACÇÃO DISPONÍVEL NESTE FILTRO</h3><p>Ajuste os filtros ou aguarde um Group ficar vago.</p></div>';
return}
 box.innerHTML=list.map(f=>{const dcState=availableDiscordState(f),
posted=dcState==='POSTADO',
meta=f.anuncioDiscordStatus||{},
text=availableAnnouncementText(f),
stateLabel=dcState==='POSTADO'?'POSTADO':dcState==='NAO_POSTADO'?'NÃO POSTADO':'RESPONDER STATUS';return `<article class="available-card" data-group="${esc(f.group)}">
   <div class="available-card-head"><div><span>${esc(f.segmento||'OUTROS')}</span><h3>${esc(f.group)}</h3></div><span class="discord-state ${posted?'posted':dcState==='NAO_POSTADO'?'not-posted':'pending'}">${stateLabel}</span></div>
   <div class="available-qg">${esc(f.qg||'SEM LOCAL')}</div>
   <div class="available-product">${esc(f.produto||'Produto não informado')}</div>
   <div class="available-contingent-editor"><span>CONTINGENTE DO ANÚNCIO</span><div class="available-contingent-row"><label>MÍNIMO<input class="available-cont-min" type="number" min="1" max="100" value="${Number(f.contingenteMin||15)}"></label><label>MÁXIMO<input class="available-cont-max" type="number" min="1" max="100" value="${Number(f.contingenteMax||28)}"></label><button class="mini-btn available-save-contingent" data-group="${esc(f.group)}">SALVAR CONTINGENTE</button></div></div>
   <div class="available-image-editor ${f.imagemAnuncio?'':'missing'}"><label><span>LINK DA IMAGEM PARA O DISCORD</span><div class="available-image-input-row"><input class="available-image-input" data-group="${esc(f.group)}" value="${esc(f.imagemAnuncio||'')}" placeholder="Cole aqui o link direto da imagem..."><button class="mini-btn available-save-image" data-group="${esc(f.group)}">SALVAR LINK</button></div><small>${f.imagemAnuncio?'O link será incluído automaticamente no texto do anúncio.':'Cadastre o link aqui; não precisa abrir o perfil do Group.'}</small></label></div>
   ${posted?`<div class="available-posted-meta">Publicado por <b>${esc(meta.responsavel||meta.postadoPor||'—')}</b>${meta.dataHora?` • ${esc(meta.dataHora)}`:''}</div>`:''}
   <div class="available-actions"><button class="btn-primary compact available-generate" data-group="${esc(f.group)}">GERAR ANÚNCIO</button><button class="mini-btn available-copy-text" data-group="${esc(f.group)}">COPIAR ANÚNCIO + IMAGEM</button><button class="mini-btn available-copy-image" data-group="${esc(f.group)}" ${f.imagemAnuncio?'':'disabled'}>COPIAR SÓ O LINK</button><button class="mini-btn available-set-posted ${posted?'posted':''}" data-group="${esc(f.group)}">✓ POSTADO NO HIGH FACS LIVRES</button><button class="mini-btn available-set-not-posted ${dcState==='NAO_POSTADO'?'not-posted':''}" data-group="${esc(f.group)}">✕ NÃO POSTADO</button></div>
   <textarea class="available-preview hidden" data-preview="${esc(f.group)}">${esc(text)}</textarea>
  </article>`}).join('');

 box.querySelectorAll('.available-generate').forEach(b=>b.onclick=()=>{const card=b.closest('.available-card'),
ta=card?.querySelector('.available-preview');if(!ta)return;ta.classList.toggle('hidden');b.textContent=ta.classList.contains('hidden')?'GERAR ANÚNCIO':'OCULTAR PRÉVIA'});

 box.querySelectorAll('.available-save-contingent').forEach(b=>b.onclick=()=>saveAvailableContingent(b.dataset.group,b.closest('.available-card'),b));

 box.querySelectorAll('.available-save-image').forEach(b=>b.onclick=()=>{const input=b.closest('.available-image-editor')?.querySelector('.available-image-input');saveAvailableImageLink(b.dataset.group,input,b)});

 box.querySelectorAll('.available-image-input').forEach(i=>i.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();const b=i.closest('.available-image-editor')?.querySelector('.available-save-image');if(b)saveAvailableImageLink(i.dataset.group,i,b)}}));

 box.querySelectorAll('.available-copy-text').forEach(b=>b.onclick=()=>{const f=faccoes.find(x=>x.group===b.dataset.group);if(f)copyText(availableAnnouncementText(f),b)});

 box.querySelectorAll('.available-copy-image').forEach(b=>b.onclick=()=>{const f=faccoes.find(x=>x.group===b.dataset.group);if(f?.imagemAnuncio)copyText(f.imagemAnuncio,b)});

 box.querySelectorAll('.available-set-posted').forEach(b=>b.onclick=()=>setAvailableDiscordState(b.dataset.group,true));

 box.querySelectorAll('.available-set-not-posted').forEach(b=>b.onclick=()=>setAvailableDiscordState(b.dataset.group,false));

}
async function setAvailableDiscordState(group,postado){
 const f=faccoes.find(x=>x.group===group);
if(!f)return;

 if(f.status==='ATIVA'&&String(f.faccao||'').trim())return alert('Este Group está ocupado e não faz parte das facções livres.');

 const now=new Date(),
label=postado?'POSTADO':'NÃO POSTADO';

 if(!confirm(`Confirmar ${group} como ${label} no Discord HIGH FACS LIVRES?`))return;

 const status=postado
  ?{confirmado:true,
postado:true,
dataHora:now.toLocaleString('pt-BR'),
postadoEm:now.toISOString(),
responsavel:currentProfile?.name||currentUser?.displayName||currentUser.email,
postadoPor:currentUser.email,
texto:availableAnnouncementText(f),
imagemUrl:f.imagemAnuncio||''}
  :{confirmado:true,
postado:false,
dataHora:now.toLocaleString('pt-BR'),
naoPostadoEm:now.toISOString(),
responsavel:currentProfile?.name||currentUser?.displayName||currentUser.email,
confirmadoPor:currentUser.email};

 try{await setDoc(doc(db,'highos','data','faccoes',idFac(group)),{anuncioDiscordStatus:status,
updatedAt:serverTimestamp(),
updatedBy:currentUser.email},{merge:true});
await addDoc(histCol,{sessionId:currentSessionId||'',
tipo:postado?'ANUNCIO_DISCORD_POSTADO':'ANUNCIO_DISCORD_NAO_POSTADO',
group,
qg:f.qg||'',
segmento:f.segmento||'',
descricao:`${group} confirmado como ${label} no HIGH FACS LIVRES`,
texto:postado?availableAnnouncementText(f):'',
imagemUrl:f.imagemAnuncio||'',
usuario:currentUser.email,
data:serverTimestamp()});
f.anuncioDiscordStatus=status;
// Status de anúncio e status de ocupação são independentes.
// Nunca rebaixar uma facção entregue para INATIVA ao confirmar postagem no Discord.
f.updatedBy=currentUser.email;
queryFreshAt.set('faccoes',Date.now());
renderAvailableFaccoes();
renderFaccoes()}catch(e){alert('Erro ao atualizar status do anúncio: '+e.message)}
}
async function toggleAvailablePosted(group){const f=faccoes.find(x=>x.group===group);
return setAvailableDiscordState(group,!availablePosted(f))}

function freeFaccoesForReport(type='TODAS'){
 const rows=faccoes.filter(f=>!f.removido&&(f.status!=='ATIVA'||!String(f.faccao||'').trim()));

 return type==='TODAS'?rows:rows.filter(f=>availableDiscordState(f)===type);

}
function freeFacReportText(type='TODAS'){
 const rows=freeFaccoesForReport(type),
now=new Date().toLocaleString('pt-BR');

 const title=type==='POSTADO'?'POSTADAS':type==='NAO_POSTADO'?'NÃO POSTADAS':type==='NAO_INFORMADO'?'SEM STATUS INFORMADO':'TODAS AS LIVRES';

 return [`RELATÓRIO DE FACÇÕES LIVRES — ${title}`,
`Gerado em: ${now}`,
`Total: ${rows.length}`,
'',
...rows.map((f,i)=>`${i+1}. ${f.group} | ${f.segmento||'OUTROS'} | ${f.qg||'SEM LOCAL'} | ${availableDiscordState(f)==='POSTADO'?'POSTADO':availableDiscordState(f)==='NAO_POSTADO'?'NÃO POSTADO':'NÃO INFORMADO'}${f.anuncioDiscordStatus?.dataHora?' | '+f.anuncioDiscordStatus.dataHora:''}`)].join('\n');

}
function downloadFreeFacCsv(type='TODAS'){
 const rows=freeFaccoesForReport(type),
head=['Group',
'Segmento',
'QG',
'Produto',
'Status Discord',
'Data/Hora',
'Responsável',
'Link imagem'];

 const data=[head,
...rows.map(f=>{const m=f.anuncioDiscordStatus||{};return [f.group,
f.segmento||'',
f.qg||'',
f.produto||'',
availableDiscordState(f)==='POSTADO'?'POSTADO':availableDiscordState(f)==='NAO_POSTADO'?'NÃO POSTADO':'NÃO INFORMADO',
m.dataHora||'',
m.responsavel||m.postadoPor||m.confirmadoPor||'',
f.imagemAnuncio||'']})];

 const csv='\ufeff'+data.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(';')).join('\r\n'),
blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),
a=document.createElement('a');
a.href=URL.createObjectURL(blob);
a.download=`faccoes_livres_${String(type).toLowerCase()}_${new Date().toISOString().slice(0,10)}.csv`;
a.click();
setTimeout(()=>URL.revokeObjectURL(a.href),1000);

}
function showFreeFacReport(){
 const type=$('#availableReportType')?.value||'TODAS',
rows=freeFaccoesForReport(type),
existing=$('#freeFacReportModal');
if(existing)existing.remove();

 const modal=document.createElement('div');
modal.id='freeFacReportModal';
modal.className='modal';
modal.innerHTML=`<div class="modal-box free-report-box"><div class="modal-head"><div><div class="eyebrow">RELATÓRIO • HIGH FACS LIVRES</div><h3>${type==='TODAS'?'TODAS AS FACÇÕES LIVRES':type==='POSTADO'?'FACÇÕES LIVRES POSTADAS':type==='NAO_POSTADO'?'FACÇÕES LIVRES NÃO POSTADAS':'FACÇÕES LIVRES SEM STATUS'}</h3></div><button type="button" class="modal-x">×</button></div><div class="free-report-summary"><b>${rows.length}</b><span>registro(s)</span><small>Gerado em ${new Date().toLocaleString('pt-BR')}</small></div><div class="free-report-table-wrap"><table class="free-report-table"><thead><tr><th>GROUP</th><th>SEGMENTO</th><th>QG</th><th>DISCORD</th><th>DATA / RESPONSÁVEL</th></tr></thead><tbody>${rows.map(f=>{const m=f.anuncioDiscordStatus||{},st=availableDiscordState(f);return `<tr><td><b>${esc(f.group)}</b></td><td>${esc(f.segmento||'—')}</td><td>${esc(f.qg||'SEM LOCAL')}</td><td><span class="discord-state ${st==='POSTADO'?'posted':st==='NAO_POSTADO'?'not-posted':'pending'}">${st==='POSTADO'?'POSTADO':st==='NAO_POSTADO'?'NÃO POSTADO':'NÃO INFORMADO'}</span></td><td>${esc(m.dataHora||'—')}<br><small>${esc(m.responsavel||m.postadoPor||m.confirmadoPor||'—')}</small></td></tr>`}).join('')||'<tr><td colspan="5">Nenhum registro neste filtro.</td></tr>'}</tbody></table></div><div class="modal-actions"><button type="button" class="mini-btn free-report-copy">COPIAR RELATÓRIO</button><button type="button" class="mini-btn free-report-csv">BAIXAR CSV</button><button type="button" class="btn-primary compact free-report-print">IMPRIMIR / PDF</button></div></div>`;document.body.appendChild(modal);modal.querySelector('.modal-x').onclick=()=>modal.remove();modal.querySelector('.free-report-copy').onclick=e=>copyText(freeFacReportText(type),e.currentTarget);modal.querySelector('.free-report-csv').onclick=()=>downloadFreeFacCsv(type);modal.querySelector('.free-report-print').onclick=()=>window.print();
}
['availableSearch','availableSegment','availableDiscord'].forEach(id=>$('#'+id)?.addEventListener(id==='availableSearch'?'input':'change',renderAvailableFaccoes));
$('#availableReportBtn')?.addEventListener('click',showFreeFacReport);

// HIGH OS V8.12 · FILTROS VISUAIS UNIVERSAIS
function segmentVisual(seg=''){
 const d=segmentDefs().find(x=>segmentKey(x.nome)===segmentKey(seg));return [d?.icone||'◇',d?.descricao||seg||'Segmento'];
}
function allSegmentNames(rows=[],field='segmento'){
 const preferred=segmentNames();
 const extras=[...new Set(rows.map(x=>String(x?.[field]||'').trim()).filter(Boolean))].filter(x=>!preferred.some(p=>segmentKey(p)===segmentKey(x)));
 return [...preferred,...extras.sort((a,b)=>a.localeCompare(b))];
}
function segmentCardMarkup(seg,count,active){
 const v=segmentVisual(seg);
 return `<button type="button" class="segment-visual-card ${active?'active':''}" data-segment="${esc(seg)}"><span class="segment-icon">${v[0]}</span><span class="segment-copy"><strong>${esc(seg)}</strong><small>${esc(v[1])}</small></span><b>${count||0}</b></button>`;
}
function renderVisualSegmentFilter({rows=[],field='segmento',selectId,boxId,onChange}){
 const sel=$('#'+selectId),box=$('#'+boxId);if(!sel||!box)return;
 const segments=allSegmentNames(rows,field),current=sel.value||'',counts={};
 rows.forEach(x=>{let raw=String(x?.[field]||'').trim();if(!raw)return;let canonical=segments.find(p=>segmentKey(p)===segmentKey(raw))||raw;counts[canonical]=(counts[canonical]||0)+1});
 sel.innerHTML=`<option value="">TODOS</option>${segments.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}`;

 const canonicalCurrent=segments.find(x=>segmentKey(x)===segmentKey(current))||'';
sel.value=canonicalCurrent;

 box.innerHTML=`<button type="button" class="segment-visual-card ${!sel.value?'active':''}" data-segment=""><span class="segment-icon">◈</span><span class="segment-copy"><strong>TODOS</strong><small>Todos os segmentos</small></span><b>${rows.length}</b></button>${segments.map(x=>segmentCardMarkup(x,counts[x]||0,segmentKey(sel.value)===segmentKey(x))).join('')}`;

 box.querySelectorAll('.segment-visual-card').forEach(btn=>btn.onclick=()=>{sel.value=btn.dataset.segment||'';onChange()});

}
renderFacSegmentChips=function(all=[]){renderVisualSegmentFilter({rows:(all||[]).filter(f=>!f.removido),
field:'segmento',
selectId:'facSegment',
boxId:'facSegmentChips',
onChange:renderFaccoes})};

renderOrgSegmentChips=function(all=[]){renderVisualSegmentFilter({rows:(all||[]).map(o=>({...o,
__segmento:orgSegmentValue(o)})),
field:'__segmento',
selectId:'orgSegment',
boxId:'orgSegmentChips',
onChange:renderOrganizations})};

function renderAvailableSegmentCards(){
 const rows=faccoes.filter(f=>!f.removido&&(f.status!=='ATIVA'||!String(f.faccao||'').trim()));

 renderVisualSegmentFilter({rows,
field:'segmento',
selectId:'availableSegment',
boxId:'availableSegmentChips',
onChange:renderAvailableFaccoes});

}
function activityButtons(boxId,selectId,items,onChange){
 const box=$('#'+boxId),
sel=$('#'+selectId);
if(!box||!sel)return;

 const active=sel.value||'';
box.innerHTML=items.map(([value,
label,
icon])=>`<button type="button" class="${active===value?'active':''}" data-value="${value}">${icon} ${label}</button>`).join('');

 box.querySelectorAll('button').forEach(b=>b.onclick=()=>{sel.value=b.dataset.value||'';onChange()});

}
function renderFacActivityButtonsLegacy(){activityButtons('facStatusButtons','facStatus',[['',
'TODOS',
'◉'],
['ATIVA',
'OCUPADOS',
'●'],
['INATIVA',
'DISPONÍVEIS',
'○']],renderFaccoes)}
function renderOrgActivityButtons(){activityButtons('orgStatusButtons','orgStatus',[['',
'AMBAS',
'◉'],
['ACTIVE',
'ATIVAS',
'●'],
['INATIVA',
'INATIVAS',
'○']],renderOrganizations)}

// HIGH OS V8.13 · GERENCIAMENTO DE SEGMENTOS
function segmentUsage(name){const key=segmentKey(name);
return {groups:faccoes.filter(f=>segmentKey(f.segmento)===key).length,
orgs:derivedOrganizations().filter(o=>segmentKey(orgSegmentValue(o))===key).length}}
function refreshSegmentAssignEntities(){
 const type=$('#segmentAssignType')?.value||'GROUP',
el=$('#segmentAssignEntity');
if(!el)return;

 const rows=type==='GROUP'?faccoes.filter(f=>!f.removido).map(f=>({v:f.group,
t:`${f.group} • ${f.qg||'SEM LOCAL'} • ${f.segmento||'—'}`})):derivedOrganizations().map(o=>({v:o.nome,
t:`${o.nome} • ${orgSegmentValue(o)||'SEM SEGMENTO'}`}));

 el.innerHTML=rows.sort((a,b)=>a.t.localeCompare(b.t)).map(x=>`<option value="${esc(x.v)}">${esc(x.t)}</option>`).join('');

}
function renderSegmentAdmin(){
 syncSegmentSelects();
refreshSegmentAssignEntities();
const box=$('#segmentAdminList');
if(!box)return;

 box.innerHTML=segmentDefs().map(seg=>{const u=segmentUsage(seg.nome),
others=segmentNames().filter(x=>segmentKey(x)!==segmentKey(seg.nome));return `<article class="segment-admin-item"><div class="segment-admin-symbol">${esc(seg.icone||'◇')}</div><div class="segment-admin-copy"><b>${esc(seg.nome)}</b><span>${esc(seg.descricao||'')}</span><small>${u.groups} Group(s) • ${u.orgs} facção(ões)</small></div><select class="segment-delete-target" data-seg="${esc(seg.nome)}"><option value="">TRANSFERIR PARA...</option>${others.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}</select><button type="button" class="mini-btn segment-rename" data-seg="${esc(seg.nome)}">EDITAR</button><button type="button" class="btn-danger compact segment-delete" data-seg="${esc(seg.nome)}">APAGAR</button></article>`}).join('');

 box.querySelectorAll('.segment-delete').forEach(b=>b.onclick=()=>deleteSegment(b.dataset.seg,b.closest('.segment-admin-item')?.querySelector('.segment-delete-target')?.value||''));

 box.querySelectorAll('.segment-rename').forEach(b=>b.onclick=()=>beginEditSegment(b.dataset.seg));

}
async function saveSegmentRegistry(){
 const items=segmentDefs();
 const signature=JSON.stringify(items.map(x=>({nome:x.nome||'',icone:x.icone||'',descricao:x.descricao||''})));
 let previous='';
 try{previous=localStorage.getItem('highos_segment_registry_sig')||''}catch(e){}
 if(previous!==signature){
  await setDoc(segmentConfigDoc,{items,updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true});
  segmentConfigReadAt=Date.now();
  try{localStorage.setItem('highos_segment_registry_sig',signature)}catch(e){}
 }
 syncSegmentSelects();
 renderSegmentAdmin();
 renderFaccoes();
 renderOrganizations();
 renderAvailableFaccoes();
 if(typeof renderMetrics==='function')renderMetrics()
}
let editingSegmentName='';

function beginEditSegment(name){const item=segmentDefs().find(x=>segmentKey(x.nome)===segmentKey(name));
if(!item)return;
editingSegmentName=item.nome;
$('#segmentNewName').value=item.nome;
$('#segmentNewIcon').value=item.icone||'◇';
$('#segmentNewDesc').value=item.descricao||item.nome;
const b=$('#segmentCreateBtn');
if(b)b.textContent='SALVAR ALTERAÇÃO';
$('#segmentNewName')?.focus()}
async function createSegment(){
 const nome=cleanSegmentName($('#segmentNewName')?.value),
icone=$('#segmentNewIcon')?.value.trim()||'◇',
descricao=$('#segmentNewDesc')?.value.trim()||nome;
if(!nome)return alert('Informe o nome do segmento.');

 const oldName=editingSegmentName;

 if(!oldName&&segmentNames().some(x=>segmentKey(x)===segmentKey(nome)))return alert('Este segmento já existe.');

 if(oldName&&segmentKey(nome)!==segmentKey(oldName)&&segmentNames().some(x=>segmentKey(x)===segmentKey(nome)))return alert('Já existe um segmento com esse nome.');

 try{
  let linksChanged=false;
  if(oldName){const item=segmentDefs().find(x=>segmentKey(x.nome)===segmentKey(oldName));
if(!item)return;
const registrySame=segmentKey(item.nome)===segmentKey(nome)&&String(item.icone||'')===String(icone||'')&&String(item.descricao||'')===String(descricao||'');
if(registrySame){editingSegmentName='';if($('#segmentCreateBtn'))$('#segmentCreateBtn').textContent='CRIAR SEGMENTO';return}
const renamed=segmentKey(nome)!==segmentKey(oldName);
if(renamed){linksChanged=true;
 const batch=writeBatch(db);
 faccoes.filter(f=>segmentKey(f.segmento)===segmentKey(oldName)).forEach(f=>batch.set(doc(db,'highos','data','faccoes',idFac(f.group)),{segmento:nome,
 updatedAt:serverTimestamp(),
 updatedBy:currentUser.email},{merge:true}));
 organizacoes.filter(o=>segmentKey(orgSegmentValue(o))===segmentKey(oldName)).forEach(o=>batch.set(doc(db,'highos','data','organizacoes',o.id||orgKey(o.nome)),{segmentoAtual:nome,
 segmentoVinculado:nome,
 updatedAt:serverTimestamp(),
 updatedBy:currentUser.email},{merge:true}));
 await batch.commit();
}
Object.assign(item,{nome,
icone,
descricao});
await addDoc(histCol,{sessionId:currentSessionId||'',
tipo:'SEGMENTO_EDITADO',
segmento:nome,
descricao:`Segmento ${oldName} alterado para ${nome}`,
usuario:currentUser.email,
data:serverTimestamp()});

  }else{segmentos.push({nome,
icone,
descricao});
await addDoc(histCol,{sessionId:currentSessionId||'',
tipo:'SEGMENTO_CRIADO',
segmento:nome,
descricao:`Segmento ${nome} criado`,
usuario:currentUser.email,
data:serverTimestamp()})}
  editingSegmentName='';
$('#segmentNewName').value='';
$('#segmentNewIcon').value='';
$('#segmentNewDesc').value='';
if($('#segmentCreateBtn'))$('#segmentCreateBtn').textContent='CRIAR SEGMENTO';
await saveSegmentRegistry();
if(linksChanged){
 faccoes=faccoes.map(f=>segmentKey(f.segmento)===segmentKey(oldName)?{...f,segmento:nome,updatedBy:currentUser.email}:f);
 organizacoes=organizacoes.map(o=>segmentKey(orgSegmentValue(o))===segmentKey(oldName)?{...o,segmentoAtual:nome,segmentoVinculado:nome,updatedBy:currentUser.email}:o);
 queryFreshAt.set('faccoes',Date.now());queryFreshAt.set('organizacoes',Date.now());
 renderFaccoes();renderOrganizations();
}

 }catch(e){alert('Erro ao salvar segmento: '+e.message)}
}
async function assignSegment(){
 const type=$('#segmentAssignType')?.value||'GROUP',
entity=$('#segmentAssignEntity')?.value,
target=$('#segmentAssignTarget')?.value;
if(!entity||!target)return alert('Selecione o cadastro e o segmento.');
try{if(type==='GROUP'){const f=faccoes.find(x=>x.group===entity);
if(!f)return;
const org=f.faccao?derivedOrganizations().find(x=>String(x.nome||'').toLowerCase()===String(f.faccao).toLowerCase()):null;
const groupSame=segmentKey(f.segmento)===segmentKey(target);
const orgSame=!f.faccao||(segmentKey(org?.segmentoAtual)===segmentKey(target)&&segmentKey(org?.segmentoVinculado)===segmentKey(target));
if(groupSame&&orgSame){renderSegmentAdmin();return}
const batch=writeBatch(db);
if(!groupSame)batch.set(doc(db,'highos','data','faccoes',idFac(f.group)),{segmento:target,
updatedAt:serverTimestamp(),
updatedBy:currentUser.email},{merge:true});
if(f.faccao&&!orgSame)batch.set(doc(db,'highos','data','organizacoes',orgKey(f.faccao)),{segmentoAtual:target,
segmentoVinculado:target,
updatedAt:serverTimestamp(),
updatedBy:currentUser.email},{merge:true});
await batch.commit()}else{const o=derivedOrganizations().find(x=>x.nome===entity);
if(!o)return;
const nextAtual=o.groupAtual?o.segmentoAtual||target:target;
if(segmentKey(o.segmentoVinculado)===segmentKey(target)&&segmentKey(o.segmentoAtual)===segmentKey(nextAtual)){renderSegmentAdmin();return}
await setDoc(doc(db,'highos','data','organizacoes',o.id||orgKey(o.nome)),{segmentoVinculado:target,
segmentoAtual:nextAtual,
updatedAt:serverTimestamp(),
updatedBy:currentUser.email},{merge:true})}await addDoc(histCol,{sessionId:currentSessionId||'',
tipo:'SEGMENTO_VINCULO',
descricao:`${type==='GROUP'?'Group':'Facção'} ${entity} vinculado(a) ao segmento ${target}`,
segmento:target,
usuario:currentUser.email,
data:serverTimestamp()});
if(type==='GROUP'){
 const f=faccoes.find(x=>x.group===entity);
 if(f){f.segmento=target;f.updatedBy=currentUser.email}
 if(f?.faccao){
  const oid=orgKey(f.faccao),ix=organizacoes.findIndex(o=>o.id===oid||String(o.nome||'').toLowerCase()===String(f.faccao).toLowerCase());
  if(ix>=0)organizacoes[ix]={...organizacoes[ix],segmentoAtual:target,segmentoVinculado:target,updatedBy:currentUser.email};
 }
 queryFreshAt.set('faccoes',Date.now());
}else{
 const ix=organizacoes.findIndex(o=>o.id===entity||o.nome===entity);
 if(ix>=0){const o=organizacoes[ix];organizacoes[ix]={...o,segmentoVinculado:target,segmentoAtual:o.groupAtual?(o.segmentoAtual||target):target,updatedBy:currentUser.email}}
}
queryFreshAt.set('organizacoes',Date.now());
renderFaccoes();renderOrganizations();
renderSegmentAdmin()}catch(e){alert('Erro ao vincular segmento: '+e.message)}
}
async function deleteSegment(name,replacement){
 const u=segmentUsage(name);
if((u.groups||u.orgs)&&!replacement)return alert(`O segmento ${name} está em uso por ${u.groups} Group(s) e ${u.orgs} facção(ões). Escolha "TRANSFERIR PARA..." antes de apagar.`);
if(!confirm(`Apagar o segmento ${name}?${replacement?`\n\nTodos os vínculos serão transferidos para ${replacement}.`:''}`))return;

 try{if(replacement){const batch=writeBatch(db);
faccoes.filter(f=>segmentKey(f.segmento)===segmentKey(name)).forEach(f=>batch.set(doc(db,'highos','data','faccoes',idFac(f.group)),{segmento:replacement,
updatedAt:serverTimestamp(),
updatedBy:currentUser.email},{merge:true}));
organizacoes.filter(o=>segmentKey(orgSegmentValue(o))===segmentKey(name)).forEach(o=>batch.set(doc(db,'highos','data','organizacoes',o.id||orgKey(o.nome)),{segmentoAtual:replacement,
segmentoVinculado:replacement,
updatedAt:serverTimestamp(),
updatedBy:currentUser.email},{merge:true}));
await batch.commit()}segmentos=segmentDefs().filter(x=>segmentKey(x.nome)!==segmentKey(name));
await saveSegmentRegistry();
await addDoc(histCol,{sessionId:currentSessionId||'',
tipo:'SEGMENTO_APAGADO',
segmento:name,
descricao:`Segmento ${name} apagado${replacement?` e vínculos movidos para ${replacement}`:''}`,
usuario:currentUser.email,
data:serverTimestamp()});
if(replacement){
 faccoes=faccoes.map(f=>segmentKey(f.segmento)===segmentKey(name)?{...f,segmento:replacement,updatedBy:currentUser.email}:f);
 organizacoes=organizacoes.map(o=>segmentKey(orgSegmentValue(o))===segmentKey(name)?{...o,segmentoAtual:replacement,segmentoVinculado:replacement,updatedBy:currentUser.email}:o);
 queryFreshAt.set('faccoes',Date.now());queryFreshAt.set('organizacoes',Date.now());
}
renderFaccoes();renderOrganizations();renderSegmentAdmin()}catch(e){alert('Erro ao apagar segmento: '+e.message)}
}
let coreSegmentCheckSignature='';
async function applyCoreSegmentMap(){
 const signature=faccoes.map(f=>`${f.group}:${f.segmento||''}:${f.faccao||''}`).sort().join('|');
 if(signature===coreSegmentCheckSignature)return;
 coreSegmentCheckSignature=signature;
 const rules={Manicomio:'DROGAS',
Contrabando01:'CONTRABANDO',
Contrabando02:'CONTRABANDO',
IlegalMedic01:'APOIO',
IlegalMedic1:'APOIO',
IlegalMedic2:'APOIO',
IlegalMechanic01:'APOIO',
IlegalMechanic02:'APOIO',
IlegalMecanic01:'APOIO'};
const needs=faccoes.filter(f=>rules[f.group]&&segmentKey(f.segmento)!==segmentKey(rules[f.group]));
if(!needs.length)return;
try{const batch=writeBatch(db);
needs.forEach(f=>{const seg=rules[f.group];batch.set(doc(db,'highos','data','faccoes',idFac(f.group)),{segmento:seg,
updatedAt:serverTimestamp(),
updatedBy:currentUser.email},{merge:true});if(f.faccao)batch.set(doc(db,'highos','data','organizacoes',orgKey(f.faccao)),{segmentoAtual:seg,
segmentoVinculado:seg,
updatedAt:serverTimestamp(),
updatedBy:currentUser.email},{merge:true})});
await batch.commit();
faccoes=faccoes.map(f=>rules[f.group]?{...f,
segmento:rules[f.group]}:f);
await addDoc(histCol,{sessionId:currentSessionId||'',
tipo:'SEGMENTOS_PADRAO_V813',
descricao:'Correção estrutural: Manicomio=DROGAS, Contrabando=CONTRABANDO, IlegalMedic/IlegalMechanic=APOIO',
usuario:currentUser.email,
data:serverTimestamp()})}catch(e){console.warn('Falha na correção dos segmentos padrão',e)}
}
$('#segmentCreateBtn')?.addEventListener('click',createSegment);
$('#segmentAssignType')?.addEventListener('change',refreshSegmentAssignEntities);
$('#segmentAssignBtn')?.addEventListener('click',assignSegment);

const _loadFaccoesV813=loadFaccoes;
loadFaccoes=async function(){await _loadFaccoesV813();
if(String(currentProfile?.role||'').toUpperCase()==='ADMIN'){await applyCoreSegmentMap();
renderFaccoes();
renderOrganizations();
renderAvailableFaccoes();
renderSegmentAdmin();
renderAdminGroupManager()}};

// ===== HIGH OS V8.24 · ADMINISTRAÇÃO MESTRE DE GROUPS =====
function adminGroupStatus(f={}){return f.status==='ATIVA'&&String(f.faccao||'').trim()?'ATIVA':'INATIVA'}
function renderAdminGroupManager(){
 const box=$('#adminGroupList'),
stats=$('#adminGroupStats');
if(!box)return;

 const q=String($('#adminGroupSearch')?.value||'').trim().toLowerCase(),
status=$('#adminGroupStatus')?.value||'';

 const rows=faccoes.filter(f=>!f.removido).filter(f=>{const st=adminGroupStatus(f);if(status&&st!==status)return false;const hay=[f.group,
f.qg,
f.segmento,
f.faccao,
f.produto,
f.staff,
f.lider].join(' ').toLowerCase();return !q||hay.includes(q)});

 const occupied=faccoes.filter(f=>!f.removido&&adminGroupStatus(f)==='ATIVA').length,
total=faccoes.filter(f=>!f.removido).length;

 if(stats)stats.innerHTML=`<article><span>TOTAL</span><b>${total}</b><small>Groups cadastrados</small></article><article><span>OCUPADOS</span><b>${occupied}</b><small>com facção ativa</small></article><article><span>VAGOS</span><b>${total-occupied}</b><small>sem ocupação</small></article><article><span>EXIBIDOS</span><b>${rows.length}</b><small>filtro atual</small></article>`;

 box.innerHTML=rows.length?rows.map(f=>`<article class="admin-group-row" data-group="${esc(f.group)}"><div class="admin-group-identity"><b>${esc(f.group||'—')}</b><span>${esc(f.qg||'SEM QG')}</span><small>${esc(f.segmento||'OUTROS')} • ${adminGroupStatus(f)==='ATIVA'?'OCUPADO':'VAGO'}</small></div><div class="admin-group-link"><span>VÍNCULO ATUAL</span><b>${esc(f.faccao||'SEM FACÇÃO')}</b><small>${esc(f.lider||f.staff||'—')}</small></div><div class="admin-group-product"><span>PRODUTO / OPERAÇÃO</span><b>${esc(f.produto||'—')}</b></div><div class="admin-group-actions"><button type="button" class="mini-btn admin-group-full-edit" data-id="${esc(f.id||f.group)}">EDITAR COMPLETO</button><button type="button" class="mini-btn admin-group-rename" data-group="${esc(f.group)}">RENOMEAR</button></div></article>`).join(''):'<div class="dash-empty">Nenhum Group encontrado com esse filtro.</div>';

 box.querySelectorAll('.admin-group-full-edit').forEach(b=>b.onclick=()=>{const f=faccoes.find(x=>(x.id||x.group)===b.dataset.id);if(!f)return;activateAppPage('faccoes');openFac(f.id||f.group)});

 box.querySelectorAll('.admin-group-rename').forEach(b=>b.onclick=()=>renameAdminGroup(b.dataset.group));

}
async function renameAdminGroup(oldGroup){
 if(!isAdmin())return;
const current=faccoes.find(f=>alvesNorm(f.group)===alvesNorm(oldGroup));
if(!current)return alert('Group não encontrado.');

 const nextRaw=prompt(`Novo nome para ${current.group}:`,current.group);
if(nextRaw===null)return;
const next=String(nextRaw||'').trim();
if(!next||next===current.group)return;
if(faccoes.some(f=>alvesNorm(f.group)===alvesNorm(next)))return alert('Já existe um Group com esse nome.');

 if(!confirm(`Renomear o Group ${current.group} para ${next}?\n\nO vínculo da facção ocupante será atualizado. O histórico antigo será preservado.`))return;

 try{
  const before=clonePlain(current),
payload={...current,
group:next,
groupOriginal:current.groupOriginal||current.group,
updatedAt:serverTimestamp(),
updatedBy:currentUser.email};
delete payload.id;

  /* V10.40 - renomeação atômica: novo Group, remoção do documento antigo
     e vínculos das organizações são confirmados juntos. */
  const renameBatch=writeBatch(db);
  renameBatch.set(doc(db,'highos','data','faccoes',idFac(next)),payload,{merge:false});
  renameBatch.delete(doc(db,'highos','data','faccoes',idFac(current.id||current.group)));

  const linked=organizacoes.filter(o=>alvesNorm(o.groupAtual)===alvesNorm(current.group));
  for(const o of linked)renameBatch.set(doc(db,'highos','data','organizacoes',o.id||orgKey(o.nome)),{groupAtual:next,
updatedAt:serverTimestamp(),
updatedBy:currentUser.email},{merge:true});
  await renameBatch.commit();
  await addDoc(histCol,{sessionId:currentSessionId||'',
tipo:'RENOMEAR_GROUP',
group:next,
groupAnterior:current.group,
faccao:current.faccao||'',
descricao:`Group ${current.group} renomeado para ${next}`,
antes:before,
depois:{...clonePlain(payload),
group:next},
usuario:currentUser.email,
data:serverTimestamp()});

  const oldId=current.id||current.group;
  const localPayload={...clonePlain(current),...clonePlain(payload),id:next,group:next,updatedBy:currentUser.email};
  faccoes=faccoes.filter(f=>(f.id||f.group)!==oldId);
  faccoes.push(localPayload);
  const linkedIds=new Set(linked.map(o=>o.id||orgKey(o.nome)));
  organizacoes=organizacoes.map(o=>linkedIds.has(o.id||orgKey(o.nome))?{...o,groupAtual:next,updatedBy:currentUser.email}:o);
  queryFreshAt.set('faccoes',Date.now());
  queryFreshAt.set('organizacoes',Date.now());
  renderFaccoes();
  renderOrganizations();
renderAdminGroupManager();
alert(`Group renomeado para ${next}.`);

 }catch(e){alert('Erro ao renomear Group: '+e.message)}
}

/* HIGH OS DEV 15.5.1 - Criar um Group vago sem alterar facções existentes.
   O backend Discord é a fonte oficial do cadastro; /v1/factions persiste
   o novo Group e o restante dos módulos lê essa mesma fonte. */
function openAdminNewGroup(){
 if(!isAdmin())return alert('Somente ADMIN pode cadastrar Groups.');
 const panel=$('#adminNewGroupForm'),select=$('#adminNewGroupSegment');
 if(!panel||!select)return;
 const names=segmentNames();
 select.innerHTML='<option value="">SELECIONE O SEGMENTO</option>'+names.map(name=>`<option value="${esc(name)}">${esc(name)}</option>`).join('');
 panel.reset();
 panel.classList.remove('hidden');
 $('#adminNewGroupName')?.focus();
}
function closeAdminNewGroup(){
 $('#adminNewGroupForm')?.classList.add('hidden');
 $('#adminNewGroupForm')?.reset();
}
async function createAdminNewGroup(event){
 event.preventDefault();
 if(!isAdmin())return alert('Somente ADMIN pode cadastrar Groups.');
 const group=String($('#adminNewGroupName')?.value||'').trim(),
 segmento=String($('#adminNewGroupSegment')?.value||'').trim(),
 qg=String($('#adminNewGroupQG')?.value||'').trim(),
 observacoes=String($('#adminNewGroupObs')?.value||'').trim(),
 min=Number($('#adminNewGroupMin')?.value),
 max=Number($('#adminNewGroupMax')?.value);
 if(!/^[A-Za-z][A-Za-z0-9_-]{1,39}$/.test(group))return alert('Informe um Group válido (2 a 40 caracteres, sem espaços; ex.: Armas05).');
 if(!segmento||!segmentNames().some(name=>segmentKey(name)===segmentKey(segmento)))return alert('Selecione um segmento cadastrado.');
 if(!Number.isInteger(min)||!Number.isInteger(max)||min<0||max<1||max>500||min>max)return alert('Confira o contingente: valores inteiros, mínimo menor ou igual ao máximo (1 a 500).');
 if(faccoes.some(f=>String(f.group||'').toLowerCase()===group.toLowerCase()))return alert('Este Group já está cadastrado.');
 const save=$('#adminNewGroupSave');
 if(save?.disabled)return;
 if(save){save.disabled=true;save.textContent='CADASTRANDO...'}
 let created=false;
 try{
  // Verificação remota evita sobrescrever um Group criado por outro admin.
  const latest=await highOsDiscordRequest('/v1/factions');
  if((latest.records||[]).some(f=>String(f.group||'').toLowerCase()===group.toLowerCase()))return alert('Este Group já existe no cadastro. Atualize a lista.');
  await setDoc(doc(db,'highos','data','faccoes',idFac(group)),{
   group,segmento,qg,status:'DISPONIVEL',faccao:'',lider:'',staff:'',
   dataEntrega:'',contingenteMin:min,contingenteMax:max,observacoes
  });
  created=true;
  try{
   await addDoc(histCol,{sessionId:currentSessionId||'',tipo:'CADASTRO_GROUP',
    group,descricao:`Novo Group ${group} cadastrado como disponível (${segmento})`,
    segmento,usuario:currentUser.email,data:serverTimestamp()});
  }catch(auditError){console.warn('[GROUP] Cadastro realizado; não foi possível registrar a auditoria:',auditError)}
  $('#adminGroupSearch').value='';
  $('#adminGroupStatus').value='';
  closeAdminNewGroup();
  try{await loadFaccoes()}catch(refreshError){
   console.warn('[GROUP] Criado com sucesso, mas a atualização da lista falhou:',refreshError);
   faccoes.push({id:group,group,segmento,qg,status:'INATIVA',faccao:'',lider:'',staff:'',contingenteMin:min,contingenteMax:max,observacoes});
   renderFaccoes();renderAvailableFaccoes();renderOrganizations();
  }
  renderAdminGroupManager();
  await syncBlipsGroups([faccoes.find(f=>String(f.group).toLowerCase()===group.toLowerCase())||{group,segmento,qg}],{quiet:true});
  alert(`Group ${group} cadastrado com sucesso como DISPONÍVEL. Você já pode abrir EDITAR COMPLETO para configurar seu perfil.`);
 }catch(error){
  alert((created?'Group criado, mas ocorreu uma falha na atualização: ':'Erro ao cadastrar Group: ')+(error?.message||error));
 }finally{
  if(save){save.disabled=false;save.textContent='CADASTRAR GROUP'}
 }
}
$('#adminNewGroupBtn')?.addEventListener('click',openAdminNewGroup);
$('#adminNewGroupClose')?.addEventListener('click',closeAdminNewGroup);
$('#adminNewGroupCancel')?.addEventListener('click',closeAdminNewGroup);
$('#adminNewGroupForm')?.addEventListener('submit',createAdminNewGroup);

$('#adminGroupSearch')?.addEventListener('input',renderAdminGroupManager);
$('#adminGroupStatus')?.addEventListener('change',renderAdminGroupManager);

// ===== HIGH OS V8.18 · ADMINISTRAÇÃO ORGANIZADA =====
function openAdminTab(tab='acessos'){document.querySelectorAll('[data-admin-tab]').forEach(b=>b.classList.toggle('active',b.dataset.adminTab===tab));
document.querySelectorAll('[data-admin-panel]').forEach(p=>p.classList.toggle('active',p.dataset.adminPanel===tab));
if(tab==='auditoria'&&isAdmin())loadUserAudit();
if(tab==='groups'&&isAdmin())renderAdminGroupManager()}
document.querySelectorAll('[data-admin-tab]').forEach(b=>b.addEventListener('click',()=>openAdminTab(b.dataset.adminTab)));

$('#dashCfgSave')?.addEventListener('click',saveDashboardConfig);

['dashCfgAtencao',
'dashCfgCritico',
'dashCfgMinComparacoes'].forEach(id=>$('#'+id)?.addEventListener('input',()=>{const raw={quedaAtencaoPct:Number($('#dashCfgAtencao')?.value)||15,
quedaCriticaPct:Number($('#dashCfgCritico')?.value)||30,
minComparacoes:Number($('#dashCfgMinComparacoes')?.value)||4};const old=dashboardConfig;dashboardConfig=sanitizeDashboardConfig(raw);renderDashboardConfigAdmin();dashboardConfig=old;}));

$('#adminOpenUsersBtn')?.addEventListener('click',()=>activateAppPage('usuarios'));

// HIGH OS V8.20 · status da facção é determinado pela ocupação do Group.
let occupationStatusCheckSignature='';
async function normalizeOccupationStatusV820(){
 /* V14: desligada — contradições vão para Revisar ocupação (o admin escolhe). */
 return;
 const signature=faccoes.map(f=>`${f.group}:${f.faccao||''}:${f.status||''}`).sort().join('|');
 if(signature===occupationStatusCheckSignature)return;
 occupationStatusCheckSignature=signature;
 const changes=[];

 faccoes.forEach(f=>{const active=!!String(f.faccao||'').trim(),
wanted=active?'ATIVA':'INATIVA';if(f.status!==wanted)changes.push({f,
wanted})});

 if(!changes.length)return;

 faccoes=faccoes.map(f=>{const hit=changes.find(x=>x.f.group===f.group);return hit?{...f,
status:hit.wanted}:f});

 if(isAdmin()){
  try{const batch=writeBatch(db);
changes.forEach(({f,
wanted})=>batch.set(doc(db,'highos','data','faccoes',idFac(f.group)),{status:wanted,
updatedAt:serverTimestamp(),
updatedBy:currentUser.email},{merge:true}));
await batch.commit();
await addDoc(histCol,{sessionId:currentSessionId||'',
tipo:'STATUS_OCUPACAO_NORMALIZADO',
descricao:`${changes.length} Group(s) tiveram o status ajustado automaticamente pela ocupação`,
grupos:changes.map(x=>x.f.group),
usuario:currentUser.email,
data:serverTimestamp()})}catch(e){console.warn('Falha ao normalizar status por ocupação',e)}
 }
 renderFaccoes();
renderAvailableFaccoes();
renderOrganizations();

}
const _loadFaccoesV820=loadFaccoes;

loadFaccoes=async function(){await _loadFaccoesV820();
await normalizeOccupationStatusV820()};

// ===== HIGH OS V8.26 · COMUNICAÇÃO FLUTUANTE (Spotify removido na V15.6.3) =====
/* Chat da Equipe e High Call removidos na V15.6.3 (página desativada em 15/10/2026). */
// ===== HIGH OS V8.35 · ROTA EXCLUSIVA + MAPA OPERACIONAL DO GROUP =====
let grMap=null,
grRouteLayer=null,
grStructureLayer=null,
grRouteDirty=false;

function grParseCoord(v=''){
 const nums=String(v).replace(/[{}\[\]]/g,'').match(/-?\d+(?:\.\d+)?/g)?.map(Number)||[];

 if(nums.length<3||nums.slice(0,3).some(n=>!Number.isFinite(n)))return null;

 return {x:nums[0],
y:nums[1],
z:nums[2],
h:Number.isFinite(nums[3])?nums[3]:null};

}
function grParseRoute(text=''){return String(text).split(/\r?\n/).map((raw,line)=>({raw:raw.trim().replace(/^\d+\s*[-–:]\s*/,''),
line:line+1})).filter(x=>x.raw).map(x=>({...x,
p:grParseCoord(x.raw)}));
}
function grFmtPoint(p){return `{ ${Number(p.x).toFixed(2)},${Number(p.y).toFixed(2)},${Number(p.z).toFixed(2)}${Number.isFinite(p.h)?','+Number(p.h).toFixed(2):''} },`}
function grRouteText(){return grParseRoute($('#grRouteInput')?.value||'').filter(x=>x.p).map(x=>grFmtPoint(x.p)).join('\n')}
function grCurrent(){const g=$('#fGroup')?.value||'';
return faccoes.find(x=>x.group===g)||currentFactionFromForm()||{};
}
function grSavedPoints(f=grCurrent()){return routePointList(mergedTechProfile(f)?.rota?.pontos||f?.beneficios?.rotaBlips||'').map(grParseCoord).filter(Boolean)}
function grRequestText(action='auto'){
 const f=grCurrent(),
group=f.group||'',
parsed=grParseRoute($('#grRouteInput')?.value||'').filter(x=>x.p),
saved=grSavedPoints(f),
hasSaved=saved.length>0;

 if(action==='delete')return ['Assunto: Remoção de rota de farm exclusiva',
'',
'Solicitação:',
'',
'- Remoção da rota de farm exclusiva',
`- Group: "${group}"`,
'',
`Nome da Rota: RotaExclusiva${group}`,
'',
`- Solicito a remoção da rota de farm exclusiva atualmente vinculada ao Group "${group}".`,
'',
`- Permissão: "${group}"`].join('\n');

 const update=action==='update'||(action==='auto'&&hasSaved),
subject=update?'Atualização de rota de farm exclusiva':'Ativação de rota de farm exclusiva';

 return [`Assunto: ${subject}`,
'',
'Solicitação:',
'',
`- ${subject}`,
`- Group: "${group}"`,
'',
'- Blips da rota nova:',
'',
`Nome da Rota: RotaExclusiva${group}`,
'',
...parsed.map(x=>grFmtPoint(x.p)),
'',
`- Permissão: "${group}"`,
...(update?['',
'- A nova rota deverá substituir integralmente a rota exclusiva atualmente vinculada ao Group.']:[])].join('\n');

}
function grShowRequest(action='auto'){const txt=grRequestText(action);
$('#grRouteRequestText').value=txt;
$('#grRouteRequestBox').classList.remove('hidden');
return txt}
function grCollectStructures(f){const out=[],
seen=new Set(),
routeRaw=mergedTechProfile(f)?.rota?.pontos||'';
const add=(label,v,kind='ESTRUTURA')=>{if(!v||typeof v!=='string'||v===routeRaw)return;
const p=grParseCoord(v);
if(!p)return;
const key=`${p.x.toFixed(2)},${p.y.toFixed(2)},${p.z.toFixed(2)}`;
if(seen.has(key))return;
seen.add(key);
out.push({label,
p,
kind})};

 add('QG / Local principal',f.cds,'QG');
const b=f.beneficios||{},
t=mergedTechProfile(f);
const named=[['Craft',
t.craft?.cds||b.craft],
['Farm / Início',
t.rota?.inicio||t.farm?.cds||b.farm],
['Garagem Pública · Blip',
b.garagemPublicaBlip],
['Garagem Pública · Spawn',
b.garagemPublicaSpawn],
['Garagem VIP · Blip',
b.garagemVipBlip],
['Garagem VIP · Spawn',
b.garagemVipSpawn],
['Heliponto · Blip',
b.helipontoBlip],
['Heliponto · Spawn',
b.helipontoSpawn],
['Loja de Roupas',
b.lojaRoupas],
['Barbearia',
b.barbearia],
['Tatuagem',
b.tatuagem],
['Shop Exclusivo',
b.shopExclusivo],
['Arena',
b.arena],
['Telão',
b.telaoCds]];
named.forEach(([n,
v])=>add(n,v));

 const walk=(obj,path='')=>{if(!obj||typeof obj!=='object')return;
Object.entries(obj).forEach(([k,
v])=>{const np=path?`${path} · ${k}`:k;if(typeof v==='string'&&/(-?\d+(?:\.\d+)?\s*,\s*){2}/.test(v))add(np,v);else if(v&&typeof v==='object'&&!Array.isArray(v))walk(v,np)})};
walk(f.perfilOperacional||{},'Perfil');
walk(t.estruturaExtra||{},'Extra');
return out;
}
function grEnsureMap(){if(grMap||!$('#grGroupMap')||!window.L)return;
const crs=L.extend({},L.CRS.Simple,{projection:L.Projection.LonLat,
scale:z=>Math.pow(2,z),
zoom:s=>Math.log(s)/Math.LN2,
distance:(a,b)=>Math.hypot(b.lng-a.lng,b.lat-a.lat),
transformation:new L.Transformation(0.02072,117.3,-0.0205,172.8),
infinite:true});
grMap=L.map('grGroupMap',{crs,
minZoom:0,
maxZoom:5,
zoomControl:true,
attributionControl:false});
L.tileLayer('https://cdn.jsdelivr.net/gh/Trusted-Studios/mapStyles@main/styleAtlas/{z}/{x}/{y}.jpg',{minZoom:0,
maxZoom:5,
noWrap:true,
crossOrigin:'anonymous'}).addTo(grMap);
grRouteLayer=L.layerGroup().addTo(grMap);
grStructureLayer=L.layerGroup().addTo(grMap);
grMap.setView(L.latLng(-500,500),2);
}
function grRouteIcon(n){return L.divIcon({className:'',
html:`<div class="gr-marker">${n}</div>`,
iconSize:[28,
28],
iconAnchor:[14,
14]})}
function grStructIcon(kind){return L.divIcon({className:'',
html:`<div class="${kind==='QG'?'gr-qg-marker':'gr-structure-marker'}" style="width:18px;height:18px"></div>`,
iconSize:[22,
22],
iconAnchor:[11,
11]})}
function grRenderMap(){grEnsureMap();
if(!grMap)return;
grRouteLayer.clearLayers();
grStructureLayer.clearLayers();
const parsed=grParseRoute($('#grRouteInput')?.value||'').filter(x=>x.p),
latlngs=[];
if($('#grMapRoute')?.checked!==false){parsed.forEach((x,i)=>{const ll=L.latLng(x.p.y,x.p.x);latlngs.push(ll);L.marker(ll,{icon:grRouteIcon(i+1)}).bindPopup(`<b>Ponto ${String(i+1).padStart(2,'0')}</b><br>${esc(grFmtPoint(x.p))}`).addTo(grRouteLayer)});
if(latlngs.length>1)L.polyline(latlngs,{weight:4,
opacity:.9,
dashArray:'8 5'}).addTo(grRouteLayer)}
 const structs=$('#grMapStructures')?.checked===false?[]:grCollectStructures(grCurrent());
structs.forEach(x=>{const ll=L.latLng(x.p.y,x.p.x);latlngs.push(ll);L.marker(ll,{icon:grStructIcon(x.kind)}).bindPopup(`<b>${esc(x.label)}</b><br>${esc(grFmtPoint(x.p))}`).addTo(grStructureLayer)});
$('#grMapLegend').innerHTML=`<span>● ${parsed.length} pontos da rota</span><span>◆ ${structs.filter(x=>x.kind==='QG').length} QG</span><span>● ${structs.filter(x=>x.kind!=='QG').length} outras CDS</span><span>Traçado atual: direto entre pontos</span>`;
if(latlngs.length)try{grMap.fitBounds(L.latLngBounds(latlngs).pad(.15),{maxZoom:4})}catch{};
setTimeout(()=>grMap.invalidateSize(),80);
}
function grRenderRows(){const parsed=grParseRoute($('#grRouteInput')?.value||''),
valid=parsed.filter(x=>x.p);
$('#grRouteCount').textContent=String(valid.length);
const bad=parsed.filter(x=>!x.p);
$('#grRouteParseInfo').textContent=bad.length?`${valid.length} CDS válidas • ${bad.length} linha(s) não reconhecida(s): ${bad.map(x=>x.line).join(', ')}`:`${valid.length} CDS válidas • ordem preservada`;

 const box=$('#grRoutePointRows');
if(!box)return;
box.innerHTML=valid.length?valid.map((x,i)=>`<div class="gr-point-edit-row" data-gr-i="${i}"><span>${String(i+1).padStart(2,'0')}</span><input value="${esc(grFmtPoint(x.p).replace(/,$/,''))}"><button type="button" class="mini-btn danger" title="Remover ponto">×</button></div>`).join(''):'<div class="route-empty"><b>SEM CDS</b><span>Cole os pontos recebidos pelo takefarm.</span></div>';
box.querySelectorAll('.gr-point-edit-row').forEach((row,i)=>{row.querySelector('input').onchange=()=>{const arr=grParseRoute($('#grRouteInput').value).filter(x=>x.p).map(x=>grFmtPoint(x.p));arr[i]=row.querySelector('input').value;$('#grRouteInput').value=arr.join('\n');grRouteDirty=true;grRenderRouteUi(false)};row.querySelector('button').onclick=()=>{const arr=grParseRoute($('#grRouteInput').value).filter(x=>x.p).map(x=>grFmtPoint(x.p));arr.splice(i,1);$('#grRouteInput').value=arr.join('\n');grRouteDirty=true;grRenderRouteUi(false)}})}
function grRenderRouteUi(loadSaved=true){const f=grCurrent(),
t=mergedTechProfile(f),
saved=routePointList(t.rota?.pontos||f?.beneficios?.rotaBlips||'');
if(loadSaved&&!grRouteDirty)$('#grRouteInput').value=saved.join('\n');
const group=f.group||'—',
count=grParseRoute($('#grRouteInput').value).filter(x=>x.p).length,
status=t.rota?.status||((f?.beneficios?.rotaExclusiva||saved.length)?'ATIVA':'ROTA_PADRAO');
$('#grRouteGroup').textContent=group;
$('#grRouteName').textContent=group==='—'?'—':`RotaExclusiva${group}`;
$('#grRoutePermission').textContent=group;
$('#grRouteStatus').textContent=status.replaceAll('_',' ');
$('#grRouteStatus').classList.toggle('warn',status==='AGUARDANDO_REMOCAO');
grRenderRows();
grRenderMap();
}
const routeActionInFlight=new Set();
function routeActionStart(key,btn){
 if(routeActionInFlight.has(key))return false;
 routeActionInFlight.add(key);
 if(btn)btn.disabled=true;
 return true;
}
function routeActionEnd(key,btn){
 routeActionInFlight.delete(key);
 if(btn)btn.disabled=false;
}
async function grSaveRoute(){const f=grCurrent(),
group=f.group,
pts=grParseRoute($('#grRouteInput').value).filter(x=>x.p);
if(!group)return alert('Group não identificado.');
if(!pts.length)return alert('Cole ao menos uma CDS válida.');
const old=grSavedPoints(f),
nextPoints=pts.map(x=>grFmtPoint(x.p).replace(/,$/,''));
if(old.length&&JSON.stringify(old)===JSON.stringify(nextPoints)){grRouteDirty=false;return alert('Nenhuma alteração na Rota Exclusiva.');}
const routeKey='save:'+group,routeBtn=$('#grRouteSave');
if(!routeActionStart(routeKey,routeBtn))return;
const action=old.length?'update':'activate',
text=grRequestText(action);
const t=mergedTechProfile(f);
t.rota={...(t.rota||{}),
nome:`RotaExclusiva${group}`,
pontos:pts.map(x=>grFmtPoint(x.p).replace(/,$/,'')).join('\n'),
status:'ATIVA',
origem:'TAKEFARM_MANUAL',
atualizadoPor:currentUser.email,
atualizadoEm:new Date().toISOString()};
const benefits={...(f.beneficios||{}),
rotaExclusiva:true,
rotaBlips:t.rota.pontos};
try{await setDoc(doc(db,'highos','data','faccoes',idFac(group)),{perfilTecnico:t,
beneficios:benefits,
updatedAt:serverTimestamp(),
updatedBy:currentUser.email},{merge:true});
await addDoc(histCol,{sessionId:currentSessionId||'',
tipo:old.length?'ROTA_EXCLUSIVA_ATUALIZADA':'ROTA_EXCLUSIVA_ATIVADA',
group,
descricao:`Rota exclusiva • ${pts.length} CDS`,
antes:{pontos:old},
depois:{pontos:pts.map(x=>x.p)},
solicitacaoTexto:text,
usuario:currentUser.email,
data:serverTimestamp()});
await archiveTechnicalRequest({tipo:'ROTA_FARM',
titulo:old.length?'Atualização de rota de farm exclusiva':'Ativação de rota de farm exclusiva',
texto:text},f,'ROTA_EXCLUSIVA');
grRouteDirty=false;
const fix=faccoes.findIndex(x=>x.group===group);
if(fix>=0)faccoes[fix]={...faccoes[fix],perfilTecnico:clonePlain(t),beneficios:clonePlain(benefits),updatedBy:currentUser.email};
queryFreshAt.set('faccoes',Date.now());
renderFaccoes();renderAvailableFaccoes();
const fresh=faccoes.find(x=>x.group===group);
if(fresh){renderTechProfile(fresh);
$('#fRotaExclusiva').checked=true}grShowRequest(old.length?'update':'activate');
grRenderRouteUi(true);
alert(`Rota de ${group} salva com ${pts.length} pontos. A solicitação foi gerada e arquivada.`)}catch(e){alert('Erro ao salvar rota: '+e.message)}finally{routeActionEnd(routeKey,routeBtn)}}
async function grDeleteRoute(){const f=grCurrent(),
group=f.group,
old=grSavedPoints(f);
if(!group||!old.length)return alert('Este Group não possui rota exclusiva cadastrada.');
const currentTech=mergedTechProfile(f);
if(currentTech.rota?.status==='AGUARDANDO_REMOCAO'){
 grRouteDirty=false;
 grRenderRouteUi(true);
 return alert('A remoção desta Rota Exclusiva já está aguardando confirmação.');
}
if(!confirm(`Gerar solicitação de remoção da rota exclusiva de ${group}?\n\nA rota ficará como AGUARDANDO REMOÇÃO e não será apagada até a confirmação final.`))return;
const routeKey='delete:'+group,routeBtn=$('#grRouteDelete');
if(!routeActionStart(routeKey,routeBtn))return;
const text=grRequestText('delete'),
t=currentTech;
t.rota={...(t.rota||{}),
status:'AGUARDANDO_REMOCAO',
remocaoSolicitadaEm:new Date().toISOString(),
remocaoSolicitadaPor:currentUser.email};
try{await setDoc(doc(db,'highos','data','faccoes',idFac(group)),{perfilTecnico:t,
updatedAt:serverTimestamp(),
updatedBy:currentUser.email},{merge:true});
await addDoc(histCol,{sessionId:currentSessionId||'',
tipo:'ROTA_EXCLUSIVA_REMOCAO_SOLICITADA',
group,
descricao:'Remoção da rota exclusiva solicitada',
solicitacaoTexto:text,
usuario:currentUser.email,
data:serverTimestamp()});
await archiveTechnicalRequest({tipo:'ROTA_FARM',
titulo:'Remoção de rota de farm exclusiva',
texto:text},f,'ROTA_EXCLUSIVA');
grShowRequest('delete');
grRouteDirty=false;
const fix=faccoes.findIndex(x=>x.group===group);
if(fix>=0)faccoes[fix]={...faccoes[fix],perfilTecnico:clonePlain(t),updatedBy:currentUser.email};
queryFreshAt.set('faccoes',Date.now());
renderFaccoes();
grRenderRouteUi(true);
alert('Solicitação de remoção gerada. As CDS foram preservadas até a remoção ser confirmada.')}catch(e){alert('Erro ao gerar remoção: '+e.message)}finally{routeActionEnd(routeKey,routeBtn)}}
async function grMapPng(){grRenderMap();
await new Promise(r=>setTimeout(r,500));
try{await carregarHtml2canvas()}catch(e){}if(!window.html2canvas)return alert('Captura de imagem indisponível.');
try{const canvas=await html2canvas($('#grGroupMap'),{useCORS:true,
backgroundColor:'#174f70'}),
a=document.createElement('a');
a.download=`mapa-rota-${grCurrent().group||'group'}.png`;
a.href=canvas.toDataURL('image/png');
a.click()}catch(e){alert('Não foi possível gerar a imagem: '+e.message)}}
$('#grRouteInput')?.addEventListener('input',()=>{grRouteDirty=true;grRenderRows()});
$('#grRoutePreview')?.addEventListener('click',()=>{grRenderRows();grRenderMap()});
$('#grRouteSave')?.addEventListener('click',grSaveRoute);
$('#grRouteRequest')?.addEventListener('click',()=>grShowRequest('auto'));
$('#grRouteDelete')?.addEventListener('click',grDeleteRoute);
$('#grRouteCopyRequest')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#grRouteRequestText').value);$('#grRouteCopyRequest').textContent='COPIADO ✓';setTimeout(()=>$('#grRouteCopyRequest').textContent='COPIAR',1200)}catch{}});
$('#grRouteMapPng')?.addEventListener('click',grMapPng);
$('#grMapRoute')?.addEventListener('change',grRenderMap);
$('#grMapStructures')?.addEventListener('change',grRenderMap);

document.querySelector('[data-tech-tab="rota-exclusiva"]')?.addEventListener('click',()=>{grRouteDirty=false;setTimeout(()=>grRenderRouteUi(true),50)});

const _renderTechProfileV835=renderTechProfile;
renderTechProfile=function(f){_renderTechProfileV835(f);
grRouteDirty=false;
if(document.querySelector('[data-tech-panel="rota-exclusiva"]')?.classList.contains('active'))setTimeout(()=>grRenderRouteUi(true),50)};

// ===== HIGH OS V8.36 · ORGANIZAÇÕES UNIFICADAS + ROTA PADRÃO IMPLÍCITA =====
function v836Occupied(f){return f?.status==='ATIVA'&&!!String(f?.faccao||'').trim()}
function v836RoutePoints(f){const t=mergedTechProfile(f),
raw=t?.rota?.pontos||f?.beneficios?.rotaBlips||'';
return routePointList(raw).map(grParseCoord).filter(Boolean)}
function v836RouteLabel(f){const t=mergedTechProfile(f),
pts=v836RoutePoints(f);
if(t?.rota?.status==='AGUARDANDO_REMOCAO'&&pts.length)return 'AGUARDANDO REMOÇÃO';
return pts.length?'ROTA EXCLUSIVA':'ROTA PADRÃO'}
function v836CardImage(f){const url=String(f?.imagemAnuncio||'').trim();
return url?`<div class="unified-card-image"><img src="${esc(url)}" alt="Arte ${esc(f.group||'Group')}" loading="lazy"></div>`:`<div class="unified-card-image empty"><span>HIGH</span><small>${esc(f?.group||'GROUP')}</small></div>`}
function v836RenderOrganizations(){
 const box=$('#facList');
if(!box)return;

 const q=($('#facSearch')?.value||'').toLowerCase(),
seg=$('#facSegment')?.value||'',
st=$('#facStatus')?.value||'';

 const isRegisteredAvailable=f=>{if(v836Occupied(f))return false;
const dc=f?.anuncioDiscordStatus||{};
return !!(f?.assumivel===true||String(f?.imagemAnuncio||'').trim()||String(f?.qg||'').trim()||String(f?.produto||'').trim()||dc?.confirmado===true||dc?.postado===true||dc?.postadoEm||dc?.dataHora)};

 const isOperational=f=>{const t=mergedTechProfile(f),
v9=f?.estruturaCatalogoV9||[];
const hasMap=!!(v9.some(x=>x.tipo==='QG'&&gsCoord(x.cds))||(t?.estruturaCatalogo||[]).some(x=>x.tipo==='QG'&&gsCoord(x.cds))||gsCoord(f?.perfilOperacional?.qg?.cds||f?.perfilOperacional?.coordenadaPrincipal||f?.beneficios?.coordenadaBase||''));
return v836Occupied(f)||isRegisteredAvailable(f)||hasMap};

 const rows=faccoes.filter(f=>!f.removido&&isOperational(f)&&(!seg||segmentKey(f.segmento)===segmentKey(seg))&&(!st||(st==='ATIVA'?v836Occupied(f):!v836Occupied(f)))&&(!q||[f.group,
f.faccao,
f.qg,
f.lider,
f.staff,
f.produto].join(' ').toLowerCase().includes(q)));

 const visibleBase=faccoes.filter(f=>!f.removido&&isOperational(f)),
occupied=visibleBase.filter(v836Occupied).length,
total=visibleBase.length,
free=visibleBase.filter(f=>!v836Occupied(f)).length;

 if($('#facStats'))$('#facStats').innerHTML=`<span><b>${total}</b> GROUPS</span><span><b>${occupied}</b> OCUPADOS</span><span><b>${free}</b> DISPONÍVEIS</span><span><b>${rows.length}</b> EXIBIDOS</span>`;

 if(!rows.length){box.innerHTML='<div class="placeholder"><b>◆</b><h3>NENHUMA ORGANIZAÇÃO NESTE FILTRO</h3><p>Ajuste o segmento, status ou busca.</p></div>';
return}
 box.innerHTML=rows.map(f=>{const occupied=v836Occupied(f),
dc=availableDiscordState(f),
route=v836RouteLabel(f),
dcText=dc==='POSTADO'?'DIVULGADA':dc==='NAO_POSTADO'?'NÃO POSTADA':'DIVULGAÇÃO PENDENTE';return `<article class="fac-card unified-org-card ${occupied?'occupied':'available'}" data-id="${esc(f.id||f.group)}" data-group="${esc(f.group)}">
   ${v836CardImage(f)}
   <div class="unified-card-body"><div class="fac-card-head"><div><small>${esc(f.segmento||'OUTROS')}</small><h3>${esc(f.group)}</h3></div><span class="status-chip ${occupied?'ativa':'inativa'}">${occupied?'OCUPADO':'DISPONÍVEL'}</span></div>
   <div class="fac-name">${esc(occupied?f.faccao:'— LIVRE —')}</div><div class="muted">${esc(f.qg||'SEM LOCAL')}</div>${occupied&&f.lider?`<div class="muted">Líder: ${esc(f.lider)}</div>`:''}
   <div class="unified-card-tags"><span>${esc(route)}</span>${!occupied?`<span class="discord-state ${dc==='POSTADO'?'posted':dc==='NAO_POSTADO'?'not-posted':'pending'}">${dcText}</span>`:''}</div>
   <div class="card-actions unified-actions"><button type="button" class="mini-btn unified-open" data-id="${esc(f.id||f.group)}">ABRIR PERFIL</button>${!occupied?`<button type="button" class="btn-primary compact unified-delivery" data-group="${esc(f.group)}">INICIAR ENTREGA</button><button type="button" class="mini-btn unified-copy-ad" data-group="${esc(f.group)}">COPIAR ANÚNCIO</button><button type="button" class="mini-btn unified-posted ${dc==='POSTADO'?'posted':''}" data-group="${esc(f.group)}">${dc==='POSTADO'?'✓ POSTADO':'MARCAR POSTADO'}</button>`:`<button type="button" class="mini-btn req-from-fac" data-group="${esc(f.group)}">NOVA SOLICITAÇÃO</button>`}</div></div></article>`}).join('');

 box.querySelectorAll('.unified-card-image img').forEach(img=>img.addEventListener('error',()=>{img.parentElement?.classList.add('broken');img.remove()}));

 box.querySelectorAll('.unified-open').forEach(b=>b.onclick=e=>{e.stopPropagation();openFac(b.dataset.id)});

 box.querySelectorAll('.unified-org-card').forEach(c=>c.onclick=e=>{if(e.target.closest('button'))return;openFac(c.dataset.id)});

 box.querySelectorAll('.unified-delivery').forEach(b=>b.onclick=e=>{e.stopPropagation();openNewDelivery(b.dataset.group)});

 box.querySelectorAll('.unified-copy-ad').forEach(b=>b.onclick=e=>{e.stopPropagation();const f=faccoes.find(x=>x.group===b.dataset.group);if(f)copyText(availableAnnouncementText(f),b)});

 box.querySelectorAll('.unified-posted').forEach(b=>b.onclick=e=>{e.stopPropagation();const f=faccoes.find(x=>x.group===b.dataset.group);setAvailableDiscordState(b.dataset.group,availableDiscordState(f)!=='POSTADO')});

 box.querySelectorAll('.req-from-fac').forEach(b=>b.onclick=e=>{e.stopPropagation();openRequestModal('',b.dataset.group)});

}
const _renderFaccoesV836=renderFaccoes;
renderFaccoes=function(){_renderFaccoesV836();
v836RenderOrganizations()};

function v836ApplyUnifiedUi(){
 document.querySelectorAll('.nav-item[data-page="organizacoes"],.nav-item[data-page="disponiveis"],.nav-item[data-page="entregas"]').forEach(x=>x.remove());

 const farm=document.querySelector('[data-tech-panel="farm"]');
farm?.querySelectorAll('.v836-legacy-route,.legacy-route-toggle,.legacy-route-fields').forEach(x=>x.classList.add('hidden'));

 const status=$('#grRouteStatus');
if(status&&/SEM ROTA/i.test(status.textContent||''))status.textContent='ROTA PADRÃO';

}
setTimeout(v836ApplyUnifiedUi,0);

$('#unifiedFreeReportBtn')?.addEventListener('click',e=>copyText(freeFacReportText('TODAS'),e.currentTarget));

// A exclusão física da rota só acontece depois que a remoção foi executada na cidade.
async function grConfirmRouteRemovalV836(){
 const f=grCurrent(),
group=f?.group,
old=grSavedPoints(f);
if(!group||!old.length)return alert('Este Group já está usando a Rota Padrão.');

 const t=mergedTechProfile(f);
if(t?.rota?.status!=='AGUARDANDO_REMOCAO'&&!confirm(`Confirmar que a Rota Exclusiva de ${group} já foi removida na cidade?`))return;

 if(t?.rota?.status==='AGUARDANDO_REMOCAO'&&!confirm(`A remoção da rota de ${group} foi executada na cidade?\n\nAo confirmar, o High OS apagará as CDS exclusivas e o Group passará automaticamente para ROTA PADRÃO.`))return;
 const routeKey='confirm-delete:'+group,routeBtn=$('#grRouteConfirmDelete');
 if(!routeActionStart(routeKey,routeBtn))return;

 t.rota={...(t.rota||{}),
nome:'',
pontos:'',
status:'ROTA_PADRAO',
remocaoConfirmadaEm:new Date().toISOString(),
remocaoConfirmadaPor:currentUser.email};

 const benefits={...(f.beneficios||{}),
rotaExclusiva:false,
rotaBlips:''};

 try{await setDoc(doc(db,'highos','data','faccoes',idFac(group)),{perfilTecnico:t,
beneficios,
updatedAt:serverTimestamp(),
updatedBy:currentUser.email},{merge:true});
await addDoc(histCol,{sessionId:currentSessionId||'',
tipo:'ROTA_EXCLUSIVA_REMOVIDA',
group,
descricao:'Rota exclusiva removida; Group retornou automaticamente para Rota Padrão',
antes:{pontos:old},
depois:{tipo:'ROTA_PADRAO'},
usuario:currentUser.email,
data:serverTimestamp()});
grRouteDirty=false;
const fix=faccoes.findIndex(x=>x.group===group);
if(fix>=0)faccoes[fix]={...faccoes[fix],perfilTecnico:clonePlain(t),beneficios:clonePlain(benefits),updatedBy:currentUser.email};
queryFreshAt.set('faccoes',Date.now());
renderFaccoes();renderAvailableFaccoes();
const fresh=faccoes.find(x=>x.group===group);
if(fresh)renderTechProfile(fresh);
grRenderRouteUi(true);
alert(`${group} agora utiliza ROTA PADRÃO.`)}catch(e){alert('Erro ao confirmar remoção: '+e.message)}
 finally{routeActionEnd(routeKey,routeBtn)}
}
$('#grRouteConfirmDelete')?.addEventListener('click',grConfirmRouteRemovalV836);

const _grRenderRouteUiV836=grRenderRouteUi;
grRenderRouteUi=function(loadSaved=true){_grRenderRouteUiV836(loadSaved);
const f=grCurrent(),
t=mergedTechProfile(f),
pts=grSavedPoints(f),
status=t?.rota?.status;
const badge=$('#grRouteStatus'),
confirmBtn=$('#grRouteConfirmDelete');
if(badge){badge.textContent=status==='AGUARDANDO_REMOCAO'&&pts.length?'AGUARDANDO REMOÇÃO':pts.length?'ROTA EXCLUSIVA':'ROTA PADRÃO';
badge.classList.toggle('warn',status==='AGUARDANDO_REMOCAO')}if(confirmBtn)confirmBtn.classList.toggle('hidden',!(status==='AGUARDANDO_REMOCAO'&&pts.length));
};

// Redireciona acessos antigos para a Central de Organizações sem apagar páginas/coleções legadas.
const _activateAppPageV836=activateAppPage;
activateAppPage=function(page){if(['organizacoes',
'disponiveis',
'entregas'].includes(page))page='faccoes';
/* V14.5: Solicitações e Economia saíram do menu; acessos antigos vão para o Dashboard */
if(['solicitacoes','economia','alvesinho','spotify','chat'].includes(page))page='dashboard';
return _activateAppPageV836(page)};

const _loadFaccoesV836=loadFaccoes;
loadFaccoes=async function(){await _loadFaccoesV836();
faccoes.forEach(f=>{const pts=v836RoutePoints(f);if(!pts.length&&f.beneficios){f.beneficios.rotaExclusiva=false;f.beneficios.rotaBlips=''} });
renderFaccoes();
renderCommandDashboard?.();
};

/* ===== HIGH OS V8.36.1 · Estrutura administrativa + mapa operacional ===== */
const GS_TYPES=['CRAFT',
'FARM',
'LOJA',
'BAÚ',
'RÁDIO',
'AMENIDADE',
'GARAGEM',
'QG',
'OUTRO'];

let gsMap=null,
gsLayer=null,
gsRouteLayer=null,
gsFilter='TODOS';

function gsRows(){if(!techDraft)techDraft=mergedTechProfile(grCurrent()||{});
if(!Array.isArray(techDraft.estruturaCatalogo))techDraft.estruturaCatalogo=[];
return techDraft.estruturaCatalogo}
function gsCoord(v){return grParseCoord(String(v||''))}
function gsIcon(type){const glyph={CRAFT:'C',
FARM:'F',
LOJA:'L',
'BAÚ':'B',
'RÁDIO':'R',
AMENIDADE:'A',
GARAGEM:'G',
QG:'Q',
OUTRO:'•'}[type]||'•';
return L.divIcon({className:'',
html:`<div class="gs-map-marker">${glyph}</div>`,
iconSize:[24,
24],
iconAnchor:[12,
12]})}
function gsEnsureMap(){if(gsMap||!$('#gsMap')||!window.L)return;
const crs=L.extend({},L.CRS.Simple,{projection:L.Projection.LonLat,
scale:z=>Math.pow(2,z),
zoom:s=>Math.log(s)/Math.LN2,
distance:(a,b)=>Math.hypot(b.lng-a.lng,b.lat-a.lat),
transformation:new L.Transformation(0.02072,117.3,-0.0205,172.8),
infinite:true});
gsMap=L.map('gsMap',{crs,
minZoom:0,
maxZoom:5,
zoomControl:true,
attributionControl:false});
L.tileLayer('https://cdn.jsdelivr.net/gh/Trusted-Studios/mapStyles@main/styleAtlas/{z}/{x}/{y}.jpg',{minZoom:0,
maxZoom:5,
noWrap:true,
crossOrigin:'anonymous'}).addTo(gsMap);
gsLayer=L.layerGroup().addTo(gsMap);
gsRouteLayer=L.layerGroup().addTo(gsMap);
gsMap.setView(L.latLng(-500,500),2)}
function gsRenderMap(fit=false){gsEnsureMap();
if(!gsMap)return;
gsLayer.clearLayers();
gsRouteLayer.clearLayers();
const bounds=[];
const visible=gsRows().filter(x=>gsFilter==='TODOS'||x.tipo===gsFilter);
visible.forEach((x,i)=>{const p=gsCoord(x.cds);if(!p)return;const ll=L.latLng(p.y,p.x);bounds.push(ll);L.marker(ll,{icon:gsIcon(x.tipo)}).bindPopup(`<b>${esc(x.nome||x.tipo)}</b><br>${esc(x.tipo)}<br>${esc(x.cds||'')}<br><button onclick="navigator.clipboard?.writeText('${String(x.cds||'').replaceAll("'","\\'")}')">Copiar CDS</button>`).addTo(gsLayer)});
if($('#gsShowRoute')?.checked){const pts=grSavedPoints(grCurrent());
const ls=pts.map(p=>L.latLng(p.y,p.x));
ls.forEach((ll,i)=>{bounds.push(ll);L.marker(ll,{icon:grRouteIcon(i+1)}).bindPopup(`<b>Rota Exclusiva • ${i+1}</b>`).addTo(gsRouteLayer)});
if(ls.length>1)L.polyline(ls,{weight:4,
opacity:.85,
dashArray:'8 5'}).addTo(gsRouteLayer)};
const withCds=visible.filter(x=>gsCoord(x.cds)).length;
$('#gsLegend').innerHTML=`<span>${withCds} estruturas no mapa</span><span>${visible.length-withCds} sem CDS</span><span>${$('#gsShowRoute')?.checked?grSavedPoints(grCurrent()).length:0} pontos de rota</span>`;
if((fit||!gsMap._gsFitted)&&bounds.length){try{gsMap.fitBounds(L.latLngBounds(bounds).pad(.15),{maxZoom:4});
gsMap._gsFitted=true}catch{}}setTimeout(()=>gsMap.invalidateSize(),80)}
function gsRender(load=true){if(!$('#gsList'))return;
const f=grCurrent();
if(load&&techDraft&&!Array.isArray(techDraft.estruturaCatalogo))techDraft.estruturaCatalogo=[];
const rows=gsRows();
$('#gsCount').textContent=`${rows.length} ITENS`;
$('#gsImportArmas01')?.classList.toggle('hidden',String(f?.group||'').toUpperCase()!=='ARMAS01'||rows.length>0);
const counts=Object.fromEntries(GS_TYPES.map(t=>[t,
rows.filter(x=>x.tipo===t).length]));
$('#gsFilters').innerHTML=['TODOS',
...GS_TYPES].map(t=>`<button type="button" class="gs-filter ${gsFilter===t?'active':''}" data-gsf="${t}">${t}${t==='TODOS'?` · ${rows.length}`:counts[t]?` · ${counts[t]}`:''}</button>`).join('');
const shown=rows.map((x,i)=>({...x,
_i:i})).filter(x=>gsFilter==='TODOS'||x.tipo===gsFilter);
$('#gsList').innerHTML=shown.length?shown.map(x=>`<div class="gs-row" data-gsi="${x._i}"><select class="gs-type admin-only">${GS_TYPES.map(t=>`<option ${x.tipo===t?'selected':''}>${t}</option>`).join('')}</select><input class="gs-name" value="${esc(x.nome||'')}" placeholder="Nome / identificação"><input class="gs-coord" value="${esc(x.cds||'')}" placeholder="x,y,z,h • pode ficar vazio para rádio"><button type="button" class="mini-btn danger admin-only gs-del">×</button></div>`).join(''):'<div class="gs-empty">Nenhuma estrutura neste filtro.</div>';
$('#gsFilters').querySelectorAll('[data-gsf]').forEach(b=>b.onclick=()=>{gsFilter=b.dataset.gsf;gsRender(false)});
$('#gsList').querySelectorAll('[data-gsi]').forEach(row=>{const i=+row.dataset.gsi;const sync=()=>{const r=gsRows()[i];r.tipo=row.querySelector('.gs-type')?.value||r.tipo;r.nome=row.querySelector('.gs-name')?.value.trim()||'';r.cds=row.querySelector('.gs-coord')?.value.trim()||'';gsRenderMap(false)};row.querySelectorAll('input,select').forEach(el=>el.onchange=sync);row.querySelector('.gs-del')?.addEventListener('click',()=>{gsRows().splice(i,1);gsRender(false)})});
gsRenderMap(load)}
function gsAdd(){gsRows().push({tipo:'OUTRO',
nome:'',
cds:''});
gsFilter='TODOS';
gsRender(false);
setTimeout(()=>$('#gsList .gs-row:last-child .gs-name')?.focus(),30)}
async function gsSave(){const f=grCurrent(),
group=f?.group;
if(!group)return;
const local=faccoes.find(x=>x.group===group)||f;
const before=clonePlain(mergedTechProfile(local)||{});
getTechProfileFromForm();
techDraft.estruturaCatalogo=gsRows();
const next=clonePlain(techDraft);
if(JSON.stringify(before)===JSON.stringify(next))return alert('Nenhuma alteração na estrutura para salvar.');
try{await setDoc(doc(db,'highos','data','faccoes',idFac(group)),{perfilTecnico:next,
updatedAt:serverTimestamp(),
updatedBy:currentUser.email},{merge:true});
await addDoc(histCol,{sessionId:currentSessionId||'',
tipo:'ESTRUTURA_GROUP_ATUALIZADA',
group,
descricao:`Estrutura administrativa atualizada • ${gsRows().length} itens`,
usuario:currentUser.email,
data:serverTimestamp()});
if(local)local.perfilTecnico=next;
queryFreshAt.set('faccoes',Date.now());
alert(`Estrutura de ${group} salva com ${gsRows().length} itens.`)}catch(e){alert('Erro ao salvar estrutura: '+e.message)}}
function gsImportArmas01(){if(String(grCurrent()?.group||'').toUpperCase()!=='ARMAS01')return;
const seed=[
 {tipo:'CRAFT',
nome:'Bancada Armas01',
cds:'1149.2, -99.9, 61.4'},

 {tipo:'FARM',
nome:'Rota padrão ilegal • Ponto 1',
cds:'1264.5, -179.1, 106.4'},
{tipo:'FARM',
nome:'Rota padrão ilegal • Ponto 2',
cds:'2666.1, 2434.5, 55.5'},
{tipo:'FARM',
nome:'Rota padrão ilegal • Ponto 3',
cds:'-1431.4, 2306.5, 30.8'},
{tipo:'FARM',
nome:'Rota padrão ilegal • Ponto 4',
cds:'-2121.3, 2482.0, 9.9'},

 {tipo:'LOJA',
nome:'LojaExclusivaArmas01',
cds:'1154.5, -136.7, 61.1'},

 {tipo:'BAÚ',
nome:'Armas01 • Líder',
cds:'1146.9, -112.1, 64.3'},
{tipo:'BAÚ',
nome:'Armas01Trofeu',
cds:'1273.0, -231.7, 99.7'},
{tipo:'BAÚ',
nome:'Geras Armas01',
cds:'-2082.7, -1014.6, 5.9'},

 {tipo:'RÁDIO',
nome:'Frequência 123',
cds:''},
{tipo:'RÁDIO',
nome:'Frequência 244',
cds:''},

 {tipo:'AMENIDADE',
nome:'Barbearia',
cds:'1205.3, -187.4, 68.4'},
{tipo:'AMENIDADE',
nome:'Loja de Roupas',
cds:'1201.9, -181.0, 68.4'},
{tipo:'AMENIDADE',
nome:'Telão',
cds:'1247.2, -166.2, 103.8'},
{tipo:'AMENIDADE',
nome:'Arena',
cds:'1286.4, -275.5, 99.7'},

 {tipo:'GARAGEM',
nome:'Garagem VIP',
cds:'1121.8, -148.9, 60.8'},
{tipo:'GARAGEM',
nome:'Blindado',
cds:'1243.4, -63.5, 69.4'},
{tipo:'GARAGEM',
nome:'Garagem',
cds:'1145.7, -128.0, 60.8'}];
techDraft.estruturaCatalogo=seed;
gsRender(false);
alert('Dados legíveis do /fac do Armas01 carregados. Confira e clique SALVAR ESTRUTURA. A rota exclusiva continua sendo administrada na aba Rota Exclusiva.')}
$('#gsAdd')?.addEventListener('click',gsAdd);
$('#gsSave')?.addEventListener('click',gsSave);
$('#gsImportArmas01')?.addEventListener('click',gsImportArmas01);
$('#gsFit')?.addEventListener('click',()=>gsRenderMap(true));
$('#gsShowRoute')?.addEventListener('change',()=>gsRenderMap(false));

// Imagem do card: reaproveita todos os registros antigos conhecidos de divulgação antes de cair no placeholder.
function v8361CardImageUrl(f){const candidates=[f?.imagemAnuncio,
f?.anuncioDiscordStatus?.imagemUrl,
f?.imagemUrl,
f?.imagem,
f?.foto,
f?.cardImagem,
f?.arteDiscord];
return String(candidates.find(x=>typeof x==='string'&&x.trim())||'').trim()}
v836CardImage=function(f){const url=v8361CardImageUrl(f);
return url?`<div class="unified-card-image"><img src="${esc(url)}" alt="Arte ${esc(f.group||'Group')}" loading="lazy" referrerpolicy="no-referrer"><a class="card-image-open" href="${esc(url)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">ABRIR ARTE</a></div>`:`<div class="unified-card-image empty"><span>HIGH</span><small>${esc(f?.group||'GROUP')}</small></div>`}

// O mapa da Rota Exclusiva também passa a enxergar o catálogo administrativo novo.
const _grCollectStructuresV8361=grCollectStructures;
grCollectStructures=function(f){const base=_grCollectStructuresV8361(f),
seen=new Set(base.map(x=>`${x.p.x.toFixed(2)},${x.p.y.toFixed(2)},${x.p.z.toFixed(2)}`));
const cat=mergedTechProfile(f)?.estruturaCatalogo||[];
cat.forEach(x=>{const p=gsCoord(x.cds);if(!p)return;const k=`${p.x.toFixed(2)},${p.y.toFixed(2)},${p.z.toFixed(2)}`;if(seen.has(k))return;seen.add(k);base.push({label:`${x.tipo} · ${x.nome||'Sem nome'}`,
p,
kind:x.tipo==='QG'?'QG':'ESTRUTURA'})});
return base};

document.querySelector('[data-tech-tab="estrutura-mapa"]')?.addEventListener('click',()=>setTimeout(()=>gsRender(false),80));

/* ===== HIGH OS V8.36.2 · ESTRUTURA ÚNICA + LIMPEZA DE LEGADOS ===== */
const GS_TYPES_V8362=['QG',
'CRAFT',
'FARM',
'LOJA',
'BAÚ',
'RÁDIO',
'AMENIDADE',
'GARAGEM',
'HELIPONTO',
'BLINDADO',
'TELÃO',
'OUTRO'];

GS_TYPES.splice(0,GS_TYPES.length,...GS_TYPES_V8362);

function gsNorm(v=''){return String(v||'').trim().replace(/[{}]/g,'').replace(/\s+/g,' ')}
function gsLegacyCatalog(f={}){
 const t=mergedTechProfile(f),
o=t.operacional||opBlank(),
out=[];

 const add=(tipo,nome,cds='',secondary='',detalhe='')=>{if(!gsNorm(cds)&&!gsNorm(secondary)&&!detalhe)return;
out.push({tipo,
nome,
cds:gsNorm(cds),
secondary:gsNorm(secondary),
detalhe,
status:'ATIVO',
origem:'LEGADO'})};

 add('QG',o.localizacao?.nome||f.qg||`QG ${f.group||''}`,o.localizacao?.cdsPrincipal||f.cds||'');

 add('CRAFT',t.craft?.nome||`Craft ${f.group||''}`,t.craft?.cds||'');

 if(t.farm?.cds)add('FARM','Início / Farm',t.farm.cds);

 add('LOJA','Loja da Facção',o.lojaFac?.cds);
add('AMENIDADE','Bar',o.bar?.cds);
add('AMENIDADE','Barbearia',o.barbearia?.cds);
add('AMENIDADE','Tatuagem',o.tatuagem?.cds);
add('AMENIDADE','Loja de Roupas',o.roupas?.cds);
add('AMENIDADE','Arena',o.arena?.cds);
add('AMENIDADE','Uniforme',o.uniforme?.local,'',o.uniforme?.arquivo||'');

 (o.garagens||[]).forEach((g,i)=>add('GARAGEM',({PUBLICA:'Garagem Pública 1',
PUBLICA_2:'Garagem Pública 2',
FACCAO:'Garagem Facção / VIP',
SERVICO:'Garagem Serviço / VIP Org'}[g.tipo]||`Garagem ${i+1}`),g.blip,g.spawn,g.veiculos||''));

 (o.helipontos||[]).forEach((h,i)=>add('HELIPONTO',`Heliponto ${i+1}`,h.blip,h.spawn));

 add('BLINDADO','Garagem de Blindados',o.blindados?.blip,o.blindados?.spawn,[o.blindados?.vagas?`Vagas: ${o.blindados.vagas}`:'',
o.blindados?.veiculos?`Veículo: ${o.blindados.veiculos}`:''].filter(Boolean).join(' • '));

 const te=o.telao||{};
if(te.ativo||te.cds||te.postit){add('TELÃO',te.modelo||'Telão',te.cds,te.postit,[te.tipo,
te.permissao].filter(Boolean).join(' • '));
(te.sons||[]).filter(Boolean).forEach((x,i)=>add('TELÃO',`Telão • Som ${i+1}`,x,'','Ponto de som'));
}
 return out;

}
function gsMergeLegacy(f,existing=[]){
 const rows=(existing||[]).map(x=>({...x,
status:x.status||'ATIVO'})),
keys=new Set();

 const key=x=>[x.tipo,
gsNorm(x.nome).toLowerCase(),
gsNorm(x.cds),
gsNorm(x.secondary)].join('|');

 rows.forEach(x=>keys.add(key(x)));

 gsLegacyCatalog(f).forEach(x=>{const k=key(x);if(!keys.has(k)){rows.push(x);keys.add(k)}});
return rows;

}
function gsMigrateCurrent(show=true){const f=grCurrent();
if(!f)return;
const before=gsRows().length;
techDraft.estruturaCatalogo=gsMergeLegacy(f,gsRows());
gsFilter='TODOS';
gsRender(false);
if(show)alert(`${techDraft.estruturaCatalogo.length-before} registro(s) antigo(s) consolidados. Confira o mapa e clique SALVAR ESTRUTURA.`)}
$('#gsMigrate')?.addEventListener('click',()=>gsMigrateCurrent(true));

// Ao abrir Estrutura, os dados antigos já aparecem na tela sem precisar duplicar cadastro manual.
const _gsRenderV8362=gsRender;
gsRender=function(load=true){if(load&&grCurrent()){if(!techDraft)techDraft=mergedTechProfile(grCurrent());
techDraft.estruturaCatalogo=gsMergeLegacy(grCurrent(),techDraft.estruturaCatalogo||[])}return _gsRenderV8362(load)};

function gsRequestText(row,action,oldRow=null){const group=grCurrent()?.group||'{Group}',
kind=row?.tipo||'Estrutura',
name=row?.nome||kind;
const fmt=x=>x?`{ ${gsNorm(x)} }`:'—';
if(action==='NOVO')return `Assunto: Adição de ${kind}\n\nSolicitação:\n\n- Adicionar ${name} ao Group ${group}.\n- CDS / Blip: ${fmt(row.cds)}\n- Spawn / CDS secundária: ${fmt(row.secondary)}\n- Permissão: ${group}`;
if(action==='REMOVER')return `Assunto: Remoção de ${kind}\n\nSolicitação:\n\n- Remover ${name} do Group ${group}.\n- CDS / Blip atual: ${fmt(row.cds)}\n- Spawn / CDS secundária atual: ${fmt(row.secondary)}\n- Permissão: ${group}`;
return `Assunto: Alteração de ${kind}\n\nSolicitação:\n\n- Alterar ${name} do Group ${group}.\n\nConfiguração atual:\n- CDS / Blip: ${fmt(oldRow?.cds)}\n- Spawn / CDS secundária: ${fmt(oldRow?.secondary)}\n\nNova configuração:\n- CDS / Blip: ${fmt(row.cds)}\n- Spawn / CDS secundária: ${fmt(row.secondary)}\n\n- Permissão: ${group}`}
window.gsCopyRequest=function(i,action='ALTERAR'){const r=gsRows()[i];
if(!r)return;
const txt=gsRequestText(r,action,r._original||r);
navigator.clipboard?.writeText(txt);
alert('Solicitação gerada e copiada para a área de transferência.')}
window.gsMapEdit=function(i){gsFilter='TODOS';
gsRender(false);
setTimeout(()=>{const el=document.querySelector(`#gsList [data-gsi="${i}"]`);el?.scrollIntoView({behavior:'smooth',
block:'center'});el?.querySelector('.gs-name')?.focus()},50)}
window.gsMapRemove=function(i){const r=gsRows()[i];
if(!r||!confirm(`Gerar remoção de ${r.nome||r.tipo}? O ponto continuará registrado até a execução ser confirmada.`))return;
r.status='REMOCAO_PENDENTE';
navigator.clipboard?.writeText(gsRequestText(r,'REMOVER'));
gsRender(false);
alert('Remoção marcada como pendente e solicitação copiada. O cadastro não foi apagado.')}

// Renderização definitiva: Blip/CDS principal + Spawn/CDS secundária usam o mesmo registro e ambos aparecem no mapa.
gsRender=function(load=true){
 if(!$('#gsList'))return;
const f=grCurrent();
if(load&&f){if(!techDraft)techDraft=mergedTechProfile(f);
techDraft.estruturaCatalogo=gsMergeLegacy(f,techDraft.estruturaCatalogo||[])}const rows=gsRows();
$('#gsCount').textContent=`${rows.length} ITENS`;

 const counts=Object.fromEntries(GS_TYPES.map(t=>[t,
rows.filter(x=>x.tipo===t).length]));
$('#gsFilters').innerHTML=['TODOS',
...GS_TYPES].map(t=>`<button type="button" class="gs-filter ${gsFilter===t?'active':''}" data-gsf="${t}">${t}${t==='TODOS'?` · ${rows.length}`:counts[t]?` · ${counts[t]}`:''}</button>`).join('');

 const shown=rows.map((x,i)=>({...x,
_i:i})).filter(x=>gsFilter==='TODOS'||x.tipo===gsFilter);
$('#gsList').innerHTML=shown.length?shown.map(x=>`<div class="gs-row" data-gsi="${x._i}"><select class="gs-type admin-only">${GS_TYPES.map(t=>`<option ${x.tipo===t?'selected':''}>${t}</option>`).join('')}</select><input class="gs-name" value="${esc(x.nome||'')}" placeholder="Nome / identificação"><input class="gs-coord" value="${esc(x.cds||'')}" placeholder="CDS principal / Blip"><input class="gs-secondary" value="${esc(x.secondary||'')}" placeholder="Spawn / CDS secundária"><span class="gs-status ${esc(x.status||'ATIVO')}">${esc((x.status||'ATIVO').replaceAll('_',' '))}</span><button type="button" class="mini-btn admin-only gs-req" title="Gerar solicitação">DC</button><button type="button" class="mini-btn danger admin-only gs-del" title="Solicitar remoção">×</button></div>`).join(''):'<div class="gs-empty">Nenhuma estrutura neste filtro.</div>';

 $('#gsFilters').querySelectorAll('[data-gsf]').forEach(b=>b.onclick=()=>{gsFilter=b.dataset.gsf;gsRender(false)});
$('#gsList').querySelectorAll('[data-gsi]').forEach(row=>{const i=+row.dataset.gsi;const r=gsRows()[i];const sync=()=>{if(!r._original)r._original={...r};r.tipo=row.querySelector('.gs-type')?.value||r.tipo;r.nome=row.querySelector('.gs-name')?.value.trim()||'';r.cds=row.querySelector('.gs-coord')?.value.trim()||'';r.secondary=row.querySelector('.gs-secondary')?.value.trim()||'';if(r.status==='ATIVO')r.status=r.origem==='NOVO'?'PENDENTE':'ALTERACAO_PENDENTE';gsRenderMap(false)};row.querySelectorAll('input,select').forEach(el=>el.onchange=sync);row.querySelector('.gs-req')?.addEventListener('click',()=>window.gsCopyRequest(i,r.status==='PENDENTE'?'NOVO':r.status==='REMOCAO_PENDENTE'?'REMOVER':'ALTERAR'));row.querySelector('.gs-del')?.addEventListener('click',()=>window.gsMapRemove(i))});
gsRenderMap(load)
};

gsAdd=function(){gsRows().push({tipo:'OUTRO',
nome:'',
cds:'',
secondary:'',
detalhe:'',
status:'PENDENTE',
origem:'NOVO'});
gsFilter='TODOS';
gsRender(false);
setTimeout(()=>$('#gsList .gs-row:last-child .gs-name')?.focus(),30)};

$('#gsAdd')?.replaceWith($('#gsAdd').cloneNode(true));
$('#gsAdd')?.addEventListener('click',gsAdd);

gsRenderMap=function(fit=false){gsEnsureMap();
if(!gsMap)return;
gsLayer.clearLayers();
gsRouteLayer.clearLayers();
const bounds=[],
visible=gsRows().map((x,i)=>({...x,
_i:i})).filter(x=>gsFilter==='TODOS'||x.tipo===gsFilter);
let pointCount=0;
visible.forEach(x=>{[['cds',
'Principal / Blip'],
['secondary',
'Spawn / Secundária']].forEach(([field,
label])=>{const p=gsCoord(x[field]);if(!p)return;pointCount++;const ll=L.latLng(p.y,p.x);bounds.push(ll);const st=x.status||'ATIVO',
cls=st==='PENDENTE'?'pending':st==='ALTERACAO_PENDENTE'?'change':st==='REMOCAO_PENDENTE'?'remove':'';const glyph=({CRAFT:'C',
FARM:'F',
LOJA:'L',
'BAÚ':'B',
'RÁDIO':'R',
AMENIDADE:'A',
GARAGEM:'G',
HELIPONTO:'H',
BLINDADO:'B',
TELÃO:'T',
QG:'Q',
OUTRO:'•'}[x.tipo]||'•');const icon=L.divIcon({className:'',
html:`<div class="gs-map-marker ${cls}">${glyph}</div>`,
iconSize:[24,
24],
iconAnchor:[12,
12]});L.marker(ll,{icon}).bindPopup(`<b>${esc(x.nome||x.tipo)}</b><br>${esc(x.tipo)} • ${label}<br>${esc(x[field]||'')}<br><small>${esc(st.replaceAll('_',' '))}</small><br><button onclick="navigator.clipboard?.writeText('${String(x[field]||'').replaceAll("'","\\'")}')">Copiar CDS</button> <button onclick="gsMapEdit(${x._i})">Editar</button> <button onclick="gsMapRemove(${x._i})">Remover</button>`).addTo(gsLayer)})});
if($('#gsShowRoute')?.checked){const pts=grSavedPoints(grCurrent()),
ls=pts.map(p=>L.latLng(p.y,p.x));
ls.forEach((ll,i)=>{bounds.push(ll);L.marker(ll,{icon:grRouteIcon(i+1)}).bindPopup(`<b>Rota Exclusiva • ${i+1}</b>`).addTo(gsRouteLayer)});
if(ls.length>1)L.polyline(ls,{weight:4,
opacity:.85,
dashArray:'8 5'}).addTo(gsRouteLayer)}$('#gsLegend').innerHTML=`<span>${pointCount} pontos estruturais</span><span>${visible.filter(x=>!gsCoord(x.cds)&&!gsCoord(x.secondary)).length} sem CDS</span><span>Verde ativo • Roxo novo • Amarelo alteração • Vermelho remoção</span>`;
if((fit||!gsMap._gsFitted)&&bounds.length){try{gsMap.fitBounds(L.latLngBounds(bounds).pad(.15),{maxZoom:4});
gsMap._gsFitted=true}catch{}}setTimeout(()=>gsMap.invalidateSize(),80)};

/* ===== HIGH OS V8.37 · Fluxo único de Estruturas ===== */
let gsView='LISTA';

function gsCleanRow(r){const x={...r};
delete x._original;
delete x._i;
return x}
async function gsPersist(eventType='ESTRUTURA_ATUALIZADA',description='Estrutura atualizada'){
 const f=grCurrent(),
group=f?.group;
if(!group)return false;
const local=faccoes.find(x=>x.group===group)||f;
const before=(mergedTechProfile(local)?.estruturaCatalogo||[]).map(gsCleanRow);
const after=gsRows().map(gsCleanRow);
/* V10.72 - fluxos legados de Estruturas também respeitam no-op.
   Evita gravar o Group e criar Histórico quando o catálogo não mudou. */
if(JSON.stringify(before)===JSON.stringify(after))return true;
try{techDraft.estruturaCatalogo=after;
await setDoc(doc(db,'highos','data','faccoes',idFac(group)),{perfilTecnico:clonePlain(techDraft),
updatedAt:serverTimestamp(),
updatedBy:currentUser.email},{merge:true});
await addDoc(histCol,{sessionId:currentSessionId||'',
tipo:eventType,
group,
descricao:description,
usuario:currentUser.email,
data:serverTimestamp()});
if(local)local.perfilTecnico=clonePlain(techDraft);
queryFreshAt.set('faccoes',Date.now());
return true}catch(e){alert('Erro ao salvar: '+e.message);
return false}
}
function gsStatusText(s){return ({ATIVO:'ATIVO',
PENDENTE:'NOVA • AGUARDANDO',
ALTERACAO_PENDENTE:'ALTERAÇÃO PENDENTE',
REMOCAO_PENDENTE:'REMOÇÃO PENDENTE'})[s]||'ATIVO'}
function gsCardCoord(label,v){return v?`<div><small>${label}</small><code>${esc(v)}</code></div>`:''}
function gsRenderKpis(rows){const active=rows.filter(x=>(x.status||'ATIVO')==='ATIVO').length,
pending=rows.filter(x=>x.status&&x.status!=='ATIVO').length,
points=rows.reduce((n,x)=>n+(gsCoord(x.cds)?1:0)+(gsCoord(x.secondary)?1:0),0);
$('#gsKpis').innerHTML=`<div class="gs-kpi"><span>Estruturas</span><b>${rows.length}</b></div><div class="gs-kpi"><span>Ativas</span><b>${active}</b></div><div class="gs-kpi"><span>Pendências</span><b>${pending}</b></div><div class="gs-kpi"><span>Pontos no mapa</span><b>${points}</b></div>`;
$('#gsCount').textContent=`${rows.length} ESTRUTURAS`}
function gsSetView(v){gsView=v;
$('#gsLayout')?.classList.toggle('v837-list',v==='LISTA');
$('#gsLayout')?.classList.toggle('v837-map',v==='MAPA');
$('#gsViewList')?.classList.toggle('active',v==='LISTA');
$('#gsViewMap')?.classList.toggle('active',v==='MAPA');
if(v==='MAPA')setTimeout(()=>{gsRenderMap(true);gsMap?.invalidateSize()},80)}
function gsModalHtml(row={},i=-1,isNew=false){const status=row.status||'ATIVO';
return `<div class="gs-modal-backdrop" id="gsModal"><div class="gs-modal"><div class="gs-modal-head"><div><div class="eyebrow">${isNew?'NOVA ESTRUTURA':'EDITAR ESTRUTURA'}</div><h3>${esc(row.nome||'Estrutura')}</h3></div><button class="mini-btn" id="gsmClose">✕</button></div><div class="gs-modal-grid"><label>TIPO<select id="gsmType">${GS_TYPES.map(t=>`<option ${row.tipo===t?'selected':''}>${t}</option>`).join('')}</select></label><label>NOME<input id="gsmName" value="${esc(row.nome||'')}"></label><label>CDS PRINCIPAL / BLIP<input id="gsmCds" value="${esc(row.cds||'')}" placeholder="x,y,z,h"></label><label>SPAWN / CDS SECUNDÁRIA<input id="gsmSecondary" value="${esc(row.secondary||'')}" placeholder="x,y,z,h"></label></div><div class="gs-choice"><button id="gsmCurrent" class="active">ATUALIZAR BASE<br><small>Já existe assim na cidade</small></button><button id="gsmPlan">PLANEJAR ALTERAÇÃO<br><small>Quero solicitar mudança</small></button></div><div class="gs-modal-actions"><button class="btn-secondary compact" id="gsmCancel">CANCELAR</button><button class="btn-primary compact" id="gsmSave">SALVAR COMO CONFIGURAÇÃO ATUAL</button></div></div></div>`}
function gsOpenEditor(i=-1){const isNew=i<0,
row=isNew?{tipo:'OUTRO',
nome:'',
cds:'',
secondary:'',
status:'ATIVO'}:{...gsRows()[i]};
document.body.insertAdjacentHTML('beforeend',gsModalHtml(row,i,isNew));
let mode='CURRENT';
const modal=$('#gsModal'),
save=$('#gsmSave');
const setMode=m=>{mode=m;
$('#gsmCurrent').classList.toggle('active',m==='CURRENT');
$('#gsmPlan').classList.toggle('active',m==='PLAN');
save.textContent=m==='CURRENT'?'SALVAR COMO CONFIGURAÇÃO ATUAL':isNew?'GERAR SOLICITAÇÃO DE CRIAÇÃO':'GERAR SOLICITAÇÃO DE ALTERAÇÃO'};
$('#gsmCurrent').onclick=()=>setMode('CURRENT');
$('#gsmPlan').onclick=()=>setMode('PLAN');
const close=()=>modal.remove();
$('#gsmClose').onclick=close;
$('#gsmCancel').onclick=close;
save.onclick=async()=>{const n={tipo:$('#gsmType').value,
nome:$('#gsmName').value.trim(),
cds:$('#gsmCds').value.trim(),
secondary:$('#gsmSecondary').value.trim()};
if(!n.nome)return alert('Informe o nome da estrutura.');
if(mode==='CURRENT'){if(isNew)gsRows().push({...n,
status:'ATIVO',
origem:'BASE'});
else Object.assign(gsRows()[i],n,{status:'ATIVO',
pending:null,
origem:'BASE'});
const ok=await gsPersist('ESTRUTURA_BASE_CONFIRMADA',`${n.tipo} ${n.nome} confirmado como configuração atual`);
if(ok){close();
gsRender(false)}}else{if(isNew){gsRows().push({...n,
status:'PENDENTE',
origem:'NOVO'});
i=gsRows().length-1;
navigator.clipboard?.writeText(gsRequestText(gsRows()[i],'NOVO'))}else{const r=gsRows()[i];
r.pending=n;
r.status='ALTERACAO_PENDENTE';
navigator.clipboard?.writeText(gsRequestText(n,'ALTERAR',r))}const ok=await gsPersist('ESTRUTURA_SOLICITACAO_GERADA',`${n.tipo} ${n.nome} aguardando execução`);
if(ok){close();
gsRender(false);
alert('Solicitação copiada. A configuração atual foi preservada até você confirmar a execução.')}}}}
window.gsConfirmPending=async function(i){const r=gsRows()[i];
if(!r)return;
if(!['PENDENTE','ALTERACAO_PENDENTE','REMOCAO_PENDENTE'].includes(r.status))return;
if(r.status==='PENDENTE'){r.status='ATIVO';
r.origem='BASE'}else if(r.status==='ALTERACAO_PENDENTE'&&r.pending){Object.assign(r,r.pending);
r.pending=null;
r.status='ATIVO';
r.origem='BASE'}else if(r.status==='REMOCAO_PENDENTE'){const name=r.nome;
gsRows().splice(i,1);
const ok=await gsPersist('ESTRUTURA_REMOCAO_CONFIRMADA',`${name} removido após confirmação de execução`);
if(ok)gsRender(false);
return}const ok=await gsPersist('ESTRUTURA_EXECUCAO_CONFIRMADA',`${r.nome||r.tipo} confirmado como executado na cidade`);
if(ok)gsRender(false)}
window.gsCancelPending=async function(i){const r=gsRows()[i];
if(!r)return;
if(!['PENDENTE','ALTERACAO_PENDENTE','REMOCAO_PENDENTE'].includes(r.status))return;
if(r.status==='PENDENTE'){gsRows().splice(i,1)}else{r.pending=null;
r.status='ATIVO'};
const ok=await gsPersist('ESTRUTURA_PENDENCIA_CANCELADA','Pendência de estrutura cancelada');
if(ok)gsRender(false)}
window.gsRequestRemoval=async function(i){const r=gsRows()[i];
if(!r)return;
if(r.status==='REMOCAO_PENDENTE')return alert('A remoção desta estrutura já está pendente.');
if((r.status||'ATIVO')!=='ATIVO')return alert('Conclua ou cancele a pendência atual antes de solicitar remoção.');
if(!confirm(`Solicitar remoção de ${r.nome||r.tipo}?`))return;
r.status='REMOCAO_PENDENTE';
navigator.clipboard?.writeText(gsRequestText(r,'REMOVER'));
const ok=await gsPersist('ESTRUTURA_REMOCAO_SOLICITADA',`Remoção solicitada: ${r.nome||r.tipo}`);
if(ok){gsRender(false);
alert('Solicitação de remoção copiada. O ponto continuará ativo na base até confirmar a execução.')}}
window.gsCopyRowCds=function(i){const r=gsRows()[i];
navigator.clipboard?.writeText([r?.cds,
r?.secondary,
r?.postit,
...(r?.speakers||[])].filter(Boolean).join('\n'))}

gsRender=function(load=true){if(!$('#gsList'))return;
const f=grCurrent();
if(load&&f){if(!techDraft)techDraft=mergedTechProfile(f);
techDraft.estruturaCatalogo=gsMergeLegacy(f,techDraft.estruturaCatalogo||[])}const rows=gsRows();
gsRenderKpis(rows);
const counts=Object.fromEntries(GS_TYPES.map(t=>[t,
rows.filter(x=>x.tipo===t).length]));
$('#gsFilters').innerHTML=['TODOS',
...GS_TYPES].map(t=>`<button type="button" class="gs-filter ${gsFilter===t?'active':''}" data-gsf="${t}">${t}${t==='TODOS'?` · ${rows.length}`:counts[t]?` · ${counts[t]}`:''}</button>`).join('');
const shown=rows.map((x,i)=>({...x,
_i:i})).filter(x=>gsFilter==='TODOS'||x.tipo===gsFilter);
$('#gsList').innerHTML=shown.length?shown.map(x=>`<article class="gs-card"><div class="gs-card-head"><div><div class="gs-card-type">${esc(x.tipo)}</div><h4>${esc(x.nome||'Sem nome')}</h4></div><span class="gs-status-pill ${esc(x.status||'ATIVO')}">${gsStatusText(x.status)}</span></div><div class="gs-card-cds">${gsCardCoord('CDS PRINCIPAL / BLIP',x.cds)}${gsCardCoord('SPAWN / SECUNDÁRIA',x.secondary)}${!x.cds&&!x.secondary?'<div><small>COORDENADAS</small><code>Sem CDS cadastrada</code></div>':''}</div>${x.status==='ALTERACAO_PENDENTE'&&x.pending?`<div class="gs-card-pending"><b>NOVA CONFIGURAÇÃO</b><br>${esc(x.pending.cds||'—')}${x.pending.secondary?`<br>${esc(x.pending.secondary)}`:''}</div>`:''}<div class="gs-card-actions"><button class="mini-btn" onclick="gsSetView('MAPA');setTimeout(()=>gsRenderMap(true),60)">VER MAPA</button><button class="mini-btn" onclick="gsCopyRowCds(${x._i})">COPIAR CDS</button><button class="mini-btn admin-only" onclick="gsOpenEditor(${x._i})">EDITAR</button>${(x.status||'ATIVO')==='ATIVO'?`<button class="mini-btn danger admin-only" onclick="gsRequestRemoval(${x._i})">REMOVER</button>`:`<button class="mini-btn admin-only" onclick="gsConfirmPending(${x._i})">CONFIRMAR EXECUÇÃO</button><button class="mini-btn danger admin-only" onclick="gsCancelPending(${x._i})">CANCELAR</button>`}</div></article>`).join(''):'<div class="gs-empty-v837">Nenhuma estrutura neste filtro.</div>';
$('#gsFilters').querySelectorAll('[data-gsf]').forEach(b=>b.onclick=()=>{gsFilter=b.dataset.gsf;gsRender(false)});
gsSetView(gsView);
gsRenderMap(load)};

window.gsOpenEditor=gsOpenEditor;
window.gsSetView=gsSetView;

// Substitui listeners antigos por fluxo contextual.
['gsAdd',
'gsViewList',
'gsViewMap'].forEach(id=>{const old=$('#'+id);if(old){const n=old.cloneNode(true);old.replaceWith(n)}});
$('#gsAdd')?.addEventListener('click',()=>gsOpenEditor(-1));
$('#gsViewList')?.addEventListener('click',()=>gsSetView('LISTA'));
$('#gsViewMap')?.addEventListener('click',()=>gsSetView('MAPA'));

// O botão de migração continua apenas como compatibilidade e não cria nova lógica paralela.
const gm=$('#gsMigrate');
if(gm){const n=gm.cloneNode(true);
gm.replaceWith(n);
n.addEventListener('click',()=>gsMigrateCurrent(true))}
// V8.37 mapa usa as mesmas ações da lista e mostra planejamento sem substituir a posição atual.
gsRenderMap=function(fit=false){gsEnsureMap();
if(!gsMap)return;
gsLayer.clearLayers();
gsRouteLayer.clearLayers();
const bounds=[],
visible=gsRows().map((x,i)=>({...x,
_i:i})).filter(x=>gsFilter==='TODOS'||x.tipo===gsFilter);
let pointCount=0;
const glyphs={CRAFT:'C',
FARM:'F',
LOJA:'L',
'BAÚ':'B',
'RÁDIO':'R',
AMENIDADE:'A',
GARAGEM:'G',
HELIPONTO:'H',
BLINDADO:'B',
TELÃO:'T',
QG:'Q',
OUTRO:'•'};
const addPoint=(x,v,label,planned=false)=>{const p=gsCoord(v);
if(!p)return;
pointCount++;
const ll=L.latLng(p.y,p.x);
bounds.push(ll);
const st=planned?'ALTERACAO_PENDENTE':(x.status||'ATIVO'),
cls=st==='PENDENTE'?'pending':st==='ALTERACAO_PENDENTE'?'change':st==='REMOCAO_PENDENTE'?'remove':'';
const icon=L.divIcon({className:'',
html:`<div class="gs-map-marker ${cls}">${glyphs[x.tipo]||'•'}</div>`,
iconSize:[24,
24],
iconAnchor:[12,
12]});
L.marker(ll,{icon}).bindPopup(`<b>${esc(x.nome||x.tipo)}</b><br>${esc(x.tipo)} • ${planned?'PLANEJADO • ':''}${label}<br>${esc(v)}<br><small>${esc(gsStatusText(st))}</small><br><button onclick="navigator.clipboard?.writeText('${String(v).replaceAll("'","\\'")}')">Copiar CDS</button> <button onclick="gsOpenEditor(${x._i})">Editar</button> ${(x.status||'ATIVO')==='ATIVO'?`<button onclick="gsRequestRemoval(${x._i})">Remover</button>`:''}`).addTo(gsLayer)};
visible.forEach(x=>{addPoint(x,x.cds,'Principal / Blip');addPoint(x,x.secondary,'Spawn / Secundária');if(x.status==='ALTERACAO_PENDENTE'&&x.pending){addPoint(x,x.pending.cds,'Principal / Blip',true);addPoint(x,x.pending.secondary,'Spawn / Secundária',true)}});
if($('#gsShowRoute')?.checked){const pts=grSavedPoints(grCurrent()),
ls=pts.map(p=>L.latLng(p.y,p.x));
ls.forEach((ll,i)=>{bounds.push(ll);L.marker(ll,{icon:grRouteIcon(i+1)}).bindPopup(`<b>Rota Exclusiva • ${i+1}</b>`).addTo(gsRouteLayer)});
if(ls.length>1)L.polyline(ls,{weight:4,
opacity:.85,
dashArray:'8 5'}).addTo(gsRouteLayer)}$('#gsLegend').innerHTML=`<span>${pointCount} pontos visíveis</span><span>Verde ativo • Roxo novo • Amarelo planejado • Vermelho remoção</span><span>Clique no marcador para copiar, editar ou remover</span>`;
if((fit||!gsMap._gsFitted)&&bounds.length){try{gsMap.fitBounds(L.latLngBounds(bounds).pad(.15),{maxZoom:4});
gsMap._gsFitted=true}catch{}}setTimeout(()=>gsMap.invalidateSize(),80)};

/* ===== HIGH OS V9.0 · Estrutura simples: editar -> salvar -> solicitar? ===== */
let v9StructureOriginal=[],
v9StructureDirty=false;

const v9Clone=v=>JSON.parse(JSON.stringify(v||[]));

function v9CleanRows(rows){return (rows||[]).map(r=>({tipo:r.tipo||'OUTRO',
nome:r.nome||'',
cds:r.cds||'',
secondary:r.secondary||'',
radio:r.radio||'',
postit:r.postit||'',
speakers:Array.isArray(r.speakers)?r.speakers.filter(Boolean).slice(0,4):[]}));
}
function v9MarkDirty(){v9StructureDirty=true;
const bar=$('#gsDirtyBar');
bar?.classList.remove('hidden');
const a=v9CleanRows(v9StructureOriginal),
b=v9CleanRows(gsRows());
let changes=0;
const max=Math.max(a.length,b.length);
for(let i=0;i<max;i++)if(JSON.stringify(a[i]||null)!==JSON.stringify(b[i]||null))changes++;
if($('#gsDirtyText'))$('#gsDirtyText').textContent=`${changes||1} alteração${changes===1?'':'ões'} não salva${changes===1?'':'s'}`;
}
function v9QGCds(){const q=gsRows().find(r=>r.tipo==='QG'&&gsCoord(r.cds));
return q?.cds||''}
function v9Diff(oldRows,newRows){const key=r=>`${r.tipo}|${r.nome}`.toLowerCase(),
om=new Map(oldRows.map(r=>[key(r),
r])),
nm=new Map(newRows.map(r=>[key(r),
r])),
out=[];
for(const [k,
o] of om)if(!nm.has(k))out.push({acao:'REMOVER',
antes:o});
for(const [k,
n] of nm){const o=om.get(k);
if(!o)out.push({acao:'ADICIONAR',
depois:n});
else if(JSON.stringify(v9CleanRows([o])[0])!==JSON.stringify(v9CleanRows([n])[0]))out.push({acao:'ALTERAR',
antes:o,
depois:n})}return out}
function v9StructureRequest(group,diff){
 const fmt=r=>{
  const a=[];

  if(r.cds)a.push(`- CDS Principal / Blip: ${r.cds}`);

  if(r.secondary)a.push(`- Spawn / CDS secundária: ${r.secondary}`);

  if(r.tipo==='RÁDIO'&&(r.radio||r.nome))a.push(`- Rádio: ${r.radio||r.nome}`);

  if(r.tipo==='TELÃO'){
   if(r.postit)a.push(`- CDS Post-it: ${r.postit}`);

   (r.speakers||[]).filter(Boolean).forEach((c,j)=>a.push(`- Caixa de Som ${j+1}: ${c}`));

  }
  return a;

 };

 const lines=[`Assunto: Alterações estruturais - ${group}`,
'',
'Solicitação:',
'',
`- Favor realizar as seguintes alterações no Group "${group}":`,
''];

 diff.forEach((d,i)=>{
  const r=d.depois||d.antes;
  lines.push(`${i+1}. ${d.acao} ${r.tipo} - ${r.nome}`);
  if(d.acao==='ALTERAR'){
   lines.push('- CONFIGURAÇÃO ATUAL:');lines.push(...fmt(d.antes));
   lines.push('- NOVA CONFIGURAÇÃO:');lines.push(...fmt(d.depois));
  }else lines.push(...fmt(r));
  lines.push('');
 });

 lines.push(`- Permissão / Group: "${group}"`);
return lines.join('\n')
}
function v9ShowRequest(text){document.body.insertAdjacentHTML('beforeend',`<div class="gs-modal-backdrop" id="v9Req"><div class="gs-modal"><div class="gs-modal-head"><div><div class="eyebrow">PRONTO PARA O DISCORD</div><h3>Solicitação gerada</h3></div><button class="mini-btn" id="v9ReqX">✕</button></div><textarea id="v9ReqText" style="width:100%;min-height:360px;resize:vertical">${esc(text)}</textarea><div class="gs-modal-actions"><button class="btn-secondary compact" id="v9ReqClose">FECHAR</button><button class="btn-primary compact" id="v9ReqCopy">COPIAR PARA O DISCORD</button></div></div></div>`);
const close=()=>$('#v9Req')?.remove();
$('#v9ReqX').onclick=close;
$('#v9ReqClose').onclick=close;
$('#v9ReqCopy').onclick=()=>{navigator.clipboard?.writeText($('#v9ReqText').value);
$('#v9ReqCopy').textContent='COPIADO ✓'}}
function v9EditorHtml(row={},isNew=false){
 const speakers=Array.isArray(row.speakers)?row.speakers.filter(Boolean).slice(0,4):[];

 const speakerRows=[0,
1,
2,
3].map(i=>`<label class="v9-speaker-row ${i>=Math.max(1,speakers.length)?'hidden':''}" data-speaker="${i}">CAIXA DE SOM ${i+1}<input class="gsmSpeaker" data-i="${i}" value="${esc(speakers[i]||'')}" placeholder="x,y,z,h"></label>`).join('');

 return `<div class="gs-modal-backdrop" id="gsModal"><div class="gs-modal"><div class="gs-modal-head"><div><div class="eyebrow">${isNew?'ADICIONAR':'EDITAR'} ESTRUTURA</div><h3>${esc(row.nome||'Estrutura')}</h3></div><button type="button" class="mini-btn" id="gsmClose">✕</button></div><div class="gs-modal-grid"><label>TIPO<select id="gsmType">${GS_TYPES.map(t=>`<option ${row.tipo===t?'selected':''}>${t}</option>`).join('')}</select></label><label>NOME / IDENTIFICAÇÃO<input id="gsmName" value="${esc(row.nome||'')}"></label><label>CDS PRINCIPAL / BLIP<input id="gsmCds" value="${esc(row.cds||'')}" placeholder="x,y,z,h"></label><label id="v9SecondaryField" class="${row.tipo==='TELÃO'?'hidden':''}">SPAWN / CDS SECUNDÁRIA<input id="gsmSecondary" value="${esc(row.secondary||'')}" placeholder="x,y,z,h"></label><label id="v9RadioField" class="${row.tipo==='RÁDIO'?'':'hidden'}">FREQUÊNCIA<input id="gsmRadio" value="${esc(row.radio||((row.tipo==='RÁDIO'&&/^\d+(\.\d+)?$/.test(row.nome||''))?row.nome:''))}" placeholder="Ex.: 123"></label></div><div id="v9TelaoFields" class="v9-telao-fields ${row.tipo==='TELÃO'?'':'hidden'}"><div class="v9-telao-title"><div><b>SISTEMA DO TELÃO</b><small>Telão + Post-it + até 4 caixas de som</small></div><div class="v9-speaker-actions"><button type="button" class="mini-btn" id="gsmAddSpeaker">+ CAIXA DE SOM</button><button type="button" class="mini-btn" id="gsmRemoveSpeaker">− REMOVER</button></div></div><div class="gs-modal-grid"><label>CDS POST-IT<input id="gsmPostit" value="${esc(row.postit||'')}" placeholder="x,y,z,h"></label>${speakerRows}</div></div><div class="gs-modal-actions"><button type="button" class="btn-secondary compact" id="gsmCancel">CANCELAR</button><button type="button" class="btn-primary compact" id="gsmSave">${isNew?'ADICIONAR':'GRAVAR EDIÇÃO'}</button></div></div></div>`
}
gsOpenEditor=function(i=-1){
 const isNew=i<0,
row=isNew?{tipo:'OUTRO',
nome:'',
cds:'',
secondary:'',
radio:'',
postit:'',
speakers:[]}:{...gsRows()[i]};

 document.body.insertAdjacentHTML('beforeend',v9EditorHtml(row,isNew));

 const close=()=>$('#gsModal')?.remove();
$('#gsmClose').onclick=close;
$('#gsmCancel').onclick=close;

 const syncType=()=>{const t=$('#gsmType').value;
$('#v9RadioField')?.classList.toggle('hidden',t!=='RÁDIO');
$('#v9TelaoFields')?.classList.toggle('hidden',t!=='TELÃO');
$('#v9SecondaryField')?.classList.toggle('hidden',t==='TELÃO')};

 $('#gsmType').onchange=syncType;
syncType();

 const speakerRows=()=>[...document.querySelectorAll('.v9-speaker-row')];

 $('#gsmAddSpeaker')?.addEventListener('click',()=>{const h=speakerRows().find(x=>x.classList.contains('hidden'));if(h)h.classList.remove('hidden');else alert('O telão aceita no máximo 4 caixas de som.')});

 $('#gsmRemoveSpeaker')?.addEventListener('click',()=>{const vis=speakerRows().filter(x=>!x.classList.contains('hidden'));if(vis.length<=1){const inp=vis[0]?.querySelector('input');if(inp)inp.value='';return}const last=vis.at(-1);const inp=last.querySelector('input');if(inp)inp.value='';last.classList.add('hidden')});

 $('#gsmSave').onclick=()=>{const tipo=$('#gsmType').value;
const n={tipo,
nome:$('#gsmName').value.trim(),
cds:$('#gsmCds').value.trim(),
secondary:tipo==='TELÃO'?'':($('#gsmSecondary')?.value.trim()||''),
radio:tipo==='RÁDIO'?($('#gsmRadio')?.value.trim()||''):'',
postit:tipo==='TELÃO'?($('#gsmPostit')?.value.trim()||''):'',
speakers:tipo==='TELÃO'?[...document.querySelectorAll('.gsmSpeaker')].map(x=>x.value.trim()).filter(Boolean).slice(0,4):[]};
if(!n.nome)return alert('Informe o nome/identificação.');
if(isNew)gsRows().push(n);
else gsRows()[i]=n;
v9MarkDirty();
close();
gsRender(false)}
};

window.gsOpenEditor=gsOpenEditor;

window.gsRequestRemoval=function(i){const r=gsRows()[i];
if(!r)return;
if(!confirm(`Excluir ${r.nome||r.tipo} da estrutura do Group?`))return;
gsRows().splice(i,1);
v9MarkDirty();
gsRender(false)};

window.gsDeleteSimple=window.gsRequestRemoval;

window.gsCopyRowCds=function(i){const r=gsRows()[i];
navigator.clipboard?.writeText([r?.cds,
r?.secondary,
r?.postit,
...(r?.speakers||[])].filter(Boolean).join('\n'))}
const v9OldRender=gsRender;

gsRender=function(load=true){if(load){const f=grCurrent();
if(f){if(!techDraft)techDraft=mergedTechProfile(f);
/* V9 não consolida legado automaticamente */if(!Array.isArray(techDraft.estruturaCatalogo))techDraft.estruturaCatalogo=[];
v9StructureOriginal=v9Clone(techDraft.estruturaCatalogo);
v9StructureDirty=false;
$('#gsDirtyBar')?.classList.add('hidden')}}if(!$('#gsList'))return;
const rows=gsRows();
$('#gsCount').textContent=`${rows.length} ITENS`;
const counts=Object.fromEntries(GS_TYPES.map(t=>[t,
rows.filter(x=>x.tipo===t).length]));
$('#gsFilters').innerHTML=['TODOS',
...GS_TYPES].map(t=>`<button type="button" class="gs-filter ${gsFilter===t?'active':''}" data-gsf="${t}">${t==='TODOS'?'TODOS':t}${t==='TODOS'?` ${rows.length}`:counts[t]?` ${counts[t]}`:''}</button>`).join('');
const shown=rows.map((x,i)=>({...x,
_i:i})).filter(x=>gsFilter==='TODOS'||x.tipo===gsFilter);
$('#gsList').innerHTML=shown.length?shown.map(x=>`<article class="gs-card"><div class="gs-card-head"><div><div class="gs-card-type">${esc(x.tipo)}</div><h4>${esc(x.nome||'Sem nome')}</h4></div></div><div class="gs-card-cds">${x.tipo==='RÁDIO'&&x.radio?`<div><small>FREQUÊNCIA</small><code>📡 ${esc(x.radio)}</code></div>`:''}${gsCardCoord('CDS PRINCIPAL / BLIP',x.cds)}${x.tipo==='TELÃO'?gsCardCoord('CDS POST-IT',x.postit):gsCardCoord('SPAWN / SECUNDÁRIA',x.secondary)}${x.tipo==='TELÃO'?(x.speakers||[]).map((c,j)=>gsCardCoord(`CAIXA DE SOM ${j+1}`,c)).join(''):''}${!x.cds&&!x.secondary&&x.tipo!=='RÁDIO'?'<div><small>COORDENADAS</small><code>Sem CDS</code></div>':''}</div><div class="gs-card-actions"><button type="button" class="mini-btn" onclick="gsFocusMap(event,${x._i})">VER NO MAPA</button><button class="mini-btn" onclick="gsCopyRowCds(${x._i})">COPIAR</button><button class="mini-btn admin-only" onclick="gsOpenEditor(${x._i})">EDITAR</button><button class="mini-btn danger admin-only" onclick="gsDeleteSimple(${x._i})">EXCLUIR</button></div></article>`).join(''):'<div class="gs-empty-v837">Nenhuma estrutura cadastrada neste filtro.</div>';
$('#gsFilters').querySelectorAll('[data-gsf]').forEach(b=>b.onclick=()=>{gsFilter=b.dataset.gsf;gsRender(false)});
gsSetView(gsView);
gsRenderMap(load)};

const v9OldSetView=gsSetView;
gsSetView=function(v){gsView=v;
const layout=$('#gsLayout');
if(!layout)return;
layout.classList.toggle('v9-map-only',v==='MAPA');
$('#gsViewList')?.classList.toggle('active',v!=='MAPA');
$('#gsViewMap')?.classList.toggle('active',v==='MAPA');
if(v==='MAPA')setTimeout(()=>{gsRenderMap(true);gsMap?.invalidateSize()},80)};
window.gsSetView=gsSetView;

gsRenderMap=function(fit=false){gsEnsureMap();
if(!gsMap)return;
gsLayer.clearLayers();
gsRouteLayer.clearLayers();
const bounds=[],
visible=gsRows().map((x,i)=>({...x,
_i:i})).filter(x=>gsFilter==='TODOS'||x.tipo===gsFilter);
let pointCount=0;
const glyphs={CRAFT:'C',
FARM:'F',
LOJA:'L',
'BAÚ':'B',
'AMENIDADE':'A',
GARAGEM:'G',
HELIPONTO:'H',
BLINDADO:'B',
TELÃO:'T',
QG:'Q',
OUTRO:'•'};
const qg=gsCoord(v9QGCds());
visible.forEach((x,idx)=>{let vals=x.tipo==='TELÃO'?[['Telão / Principal',
x.cds],
['Post-it',
x.postit],
...(x.speakers||[]).map((c,j)=>[`Caixa de Som ${j+1}`,
c])]:[['Principal / Blip',
x.cds],
['Spawn / Secundária',
x.secondary]];if(x.tipo==='RÁDIO'&&!gsCoord(x.cds)&&qg){const off=(idx%5)*10;vals=[['Rádio vinculada ao QG',
`${qg.x+off},${qg.y+off},${qg.z||0}`]]}vals.forEach(([label,
v])=>{const p=gsCoord(v);if(!p)return;pointCount++;const ll=L.latLng(p.y,p.x);bounds.push(ll);let html;if(x.tipo==='RÁDIO'){const freq=x.radio||x.nome||'R';html=`<div class="gs-map-radio">⌁<span>${esc(freq)}</span></div>`}else html=`<div class="gs-map-marker">${glyphs[x.tipo]||'•'}</div>`;const icon=L.divIcon({className:'',
html,
iconSize:[34,
28],
iconAnchor:[17,
14]});L.marker(ll,{icon}).bindPopup(`<b>${esc(x.nome||x.tipo)}</b><br>${esc(x.tipo)} • ${label}<br>${esc(v)}<br><button onclick="navigator.clipboard?.writeText('${String(v).replaceAll("'","\\'")}')">Copiar CDS</button> <button onclick="gsOpenEditor(${x._i})">Editar</button> <button onclick="gsDeleteSimple(${x._i})">Excluir</button>`).addTo(gsLayer)})});
if($('#gsShowRoute')?.checked){const pts=grSavedPoints(grCurrent()),
ls=pts.map(p=>L.latLng(p.y,p.x));
ls.forEach((ll,i)=>{bounds.push(ll);L.marker(ll,{icon:grRouteIcon(i+1)}).bindPopup(`<b>Rota Exclusiva • ${i+1}</b>`).addTo(gsRouteLayer)});
if(ls.length>1)L.polyline(ls,{weight:4,
opacity:.85,
dashArray:'8 5'}).addTo(gsRouteLayer)}if($('#gsLegend'))$('#gsLegend').innerHTML=`<span>${pointCount} pontos de estrutura</span><span>${visible.length} itens visíveis</span><span>Clique para editar, copiar ou excluir</span>`;
if((fit||!gsMap._gsFitted)&&bounds.length){try{gsMap.fitBounds(L.latLngBounds(bounds).pad(.15),{maxZoom:4});
gsMap._gsFitted=true}catch{}}setTimeout(()=>gsMap.invalidateSize(),80)};

async function v9SaveAll(){if(!v9StructureDirty)return alert('Nenhuma alteração para salvar.');
const f=grCurrent(),
group=f?.group;
if(!group)return;
const before=v9Clone(v9StructureOriginal),
after=v9Clone(gsRows()),
diff=v9Diff(before,after);
try{techDraft.estruturaCatalogo=v9Clone(after);
await setDoc(doc(db,'highos','data','faccoes',idFac(group)),{perfilTecnico:clonePlain(techDraft),
updatedAt:serverTimestamp(),
updatedBy:currentUser.email},{merge:true});
const local=faccoes.find(x=>x.group===group);
if(local)local.perfilTecnico=clonePlain(techDraft);
await addDoc(histCol,{sessionId:currentSessionId||'',
tipo:'ESTRUTURA_ATUALIZADA',
group,
descricao:`Estrutura atualizada: ${diff.length} alteração(ões)`,
usuario:currentUser.email,
data:serverTimestamp()});
v9StructureOriginal=v9Clone(after);
v9StructureDirty=false;
$('#gsDirtyBar')?.classList.add('hidden');
if(diff.length&&confirm(`Alterações salvas.\n\nDeseja gerar uma solicitação ao Dev da cidade com as ${diff.length} alteração(ões) realizadas?`))v9ShowRequest(v9StructureRequest(group,diff));
gsRender(false)}catch(e){alert('Erro ao salvar estrutura: '+e.message)}}
setTimeout(()=>{$('#gsSaveAll')?.addEventListener('click',v9SaveAll);$('#gsDiscard')?.addEventListener('click',()=>{if(!v9StructureDirty||confirm('Descartar todas as alterações ainda não salvas?')){techDraft.estruturaCatalogo=v9Clone(v9StructureOriginal);v9StructureDirty=false;$('#gsDirtyBar')?.classList.add('hidden');gsRender(false)}});const add=$('#gsAdd');if(add){const n=add.cloneNode(true);add.replaceWith(n);n.addEventListener('click',()=>gsOpenEditor(-1))}},0);

/* V9.0.4 — foco direto da estrutura no mapa */
window.gsFocusMap=function(ev,i){
  ev?.preventDefault?.();

  ev?.stopPropagation?.();

  const row=gsRows()[i];

  if(!row)return false;

  gsFilter='TODOS';

  gsSetView('MAPA');

  setTimeout(()=>{
    gsRenderMap(false);
    gsMap?.invalidateSize();
    const p=gsCoord(row.cds)||gsCoord(row.secondary)||(row.tipo==='RÁDIO'?gsCoord(v9QGCds()):null);
    if(!p||!gsMap)return;
    const ll=L.latLng(p.y,p.x);
    gsMap.setView(ll,4,{animate:true});
    let nearest=null,
best=Infinity;
    gsLayer?.eachLayer?.(layer=>{
      if(!layer?.getLatLng)return;
      const q=layer.getLatLng();
      const d=Math.hypot(q.lat-ll.lat,q.lng-ll.lng);
      if(d<best){best=d;nearest=layer}
    });
    nearest?.openPopup?.();
  },140);

  return false;

};

/* ===== HIGH OS V9.0.8 · Estruturas com salvamento imediato e persistência completa ===== */
async function v909CommitStructure(beforeRows, descricao='Estrutura atualizada'){
  const f=grCurrent(),
 group=f?.group;

  if(!group) throw new Error('Group não identificado.');

  const before=v9CleanRows(v9Clone(beforeRows||[]));

  const after=v9CleanRows(v9Clone(gsRows()));

  const diff=v9Diff(before,after);

  /* V10.23 - não grava, relê nem audita quando o editor não mudou a estrutura. */
  if(!diff.length){v9StructureDirty=false;$('#gsDirtyBar')?.classList.add('hidden');gsRender(false);return true;}

  const scrollY=window.scrollY;

  techDraft.estruturaCatalogo=v9Clone(after);

  const ref=doc(db,'highos','data','faccoes',idFac(group));

  // V9: grava uma cópia canônica no nível raiz + compatibilidade no perfilTecnico.
  // Assim nenhuma consolidação legada consegue apagar Post-it/caixas de som na leitura seguinte.
  await setDoc(ref,{
    estruturaCatalogoV9:clonePlain(after),

    perfilTecnico:clonePlain(techDraft),

    updatedAt:serverTimestamp(),

    updatedBy:currentUser?.email||''
  },{merge:true});

  /* V10.25 - setDoc concluído já confirma a operação no SDK. Evita um getDoc
     adicional por edição e atualiza o estado local com o mesmo payload salvo. */
  const persisted=v9Clone(after);
  const pos=faccoes.findIndex(x=>x.group===group);
  if(pos>=0){
    faccoes[pos]={...faccoes[pos],
      estruturaCatalogoV9:clonePlain(persisted),
      perfilTecnico:clonePlain(techDraft)};
    techDraft=mergedTechProfile(faccoes[pos]);
  }
  techDraft.estruturaCatalogo=v9Clone(persisted);
  v9StructureOriginal=v9Clone(persisted);

  v9StructureDirty=false;

  $('#gsDirtyBar')?.classList.add('hidden');

  await addDoc(histCol,{sessionId:currentSessionId||'',
tipo:'ESTRUTURA_ATUALIZADA',
group,
descricao:`${descricao}: ${diff.length} alteração(ões)`,
usuario:currentUser?.email||'',
data:serverTimestamp()});

  gsRender(false);

  requestAnimationFrame(()=>window.scrollTo({top:scrollY,
left:0,
behavior:'auto'}));

  if(diff.length && confirm(`Alterações salvas.\n\nDeseja gerar uma solicitação ao Dev da cidade com ${diff.length} alteração(ões)?`)){
    v9ShowRequest(v9StructureRequest(group,diff));

  }
  return true;

}
function v908EditorHtml(row={},i=-1,isNew=false){
  const speakers=[...(row.speakers||[]),
'',
'',
'',
''].slice(0,4);

  const speakerRows=[0,
1,
2,
3].map(j=>`<label class="v9-speaker-row ${j>=Math.max(1,(row.speakers||[]).filter(Boolean).length)?'hidden':''}" data-speaker="${j}">CAIXA DE SOM ${j+1}<input class="gsmSpeaker" data-i="${j}" value="${esc(speakers[j]||'')}" placeholder="x,y,z,h"></label>`).join('');

  return `<div class="gs-modal-backdrop" id="gsModal"><div class="gs-modal"><div class="gs-modal-head"><div><div class="eyebrow">${isNew?'ADICIONAR':'EDITAR'} ESTRUTURA</div><h3>${esc(row.nome||'Estrutura')}</h3></div><button type="button" class="mini-btn" id="gsmClose">✕</button></div><div class="gs-modal-grid"><label>TIPO<select id="gsmType">${GS_TYPES.map(t=>`<option ${row.tipo===t?'selected':''}>${t}</option>`).join('')}</select></label><label>NOME / IDENTIFICAÇÃO<input id="gsmName" value="${esc(row.nome||'')}"></label><label>CDS PRINCIPAL / BLIP<input id="gsmCds" value="${esc(row.cds||'')}" placeholder="x,y,z,h"></label><label id="v9SecondaryField" class="${row.tipo==='TELÃO'?'hidden':''}">SPAWN / CDS SECUNDÁRIA<input id="gsmSecondary" value="${esc(row.secondary||'')}" placeholder="x,y,z,h"></label><label id="v9RadioField" class="${row.tipo==='RÁDIO'?'':'hidden'}">FREQUÊNCIA<input id="gsmRadio" value="${esc(row.radio||'')}" placeholder="Ex.: 123"></label></div><div id="v9TelaoFields" class="v9-telao-fields ${row.tipo==='TELÃO'?'':'hidden'}"><div class="v9-telao-title"><div><b>SISTEMA DO TELÃO</b><small>Telão + Post-it + até 4 caixas de som</small></div><div class="v9-speaker-actions"><button type="button" class="mini-btn" id="gsmAddSpeaker">+ CAIXA DE SOM</button><button type="button" class="mini-btn" id="gsmRemoveSpeaker">− REMOVER</button></div></div><div class="gs-modal-grid"><label>CDS POST-IT<input id="gsmPostit" value="${esc(row.postit||'')}" placeholder="x,y,z,h"></label>${speakerRows}</div></div><div class="gs-modal-actions"><button type="button" class="btn-secondary compact" id="gsmCancel">CANCELAR</button><button type="button" class="btn-primary compact" id="gsmSave">${isNew?'ADICIONAR E SALVAR':'SALVAR EDIÇÃO'}</button></div></div></div>`;

}

window.gsOpenEditor=function(i=-1){
  const rows=gsRows(),
 isNew=i<0;

  const row=isNew?{tipo:'OUTRO',
nome:'',
cds:'',
secondary:'',
radio:'',
postit:'',
speakers:[]}:{...rows[i],
speakers:[...(rows[i]?.speakers||[])]};

  const before=v9Clone(rows);

  document.body.insertAdjacentHTML('beforeend',v908EditorHtml(row,i,isNew));

  const modal=$('#gsModal');

  const close=()=>modal?.remove();

  $('#gsmClose').onclick=close;
 $('#gsmCancel').onclick=close;

  const speakerRows=()=>[...modal.querySelectorAll('.v9-speaker-row')];

  const syncType=()=>{const t=$('#gsmType').value;
$('#v9RadioField')?.classList.toggle('hidden',t!=='RÁDIO');
$('#v9TelaoFields')?.classList.toggle('hidden',t!=='TELÃO');
$('#v9SecondaryField')?.classList.toggle('hidden',t==='TELÃO')};

  $('#gsmType').addEventListener('change',syncType);
 syncType();

  $('#gsmAddSpeaker')?.addEventListener('click',()=>{const h=speakerRows().find(x=>x.classList.contains('hidden'));if(h)h.classList.remove('hidden');else alert('O telão aceita no máximo 4 caixas de som.')});

  $('#gsmRemoveSpeaker')?.addEventListener('click',()=>{const vis=speakerRows().filter(x=>!x.classList.contains('hidden'));if(vis.length>1){const r=vis[vis.length-1];r.querySelector('input').value='';r.classList.add('hidden')}else{const inp=vis[0]?.querySelector('input');if(inp)inp.value=''}});

  $('#gsmSave').onclick=async(ev)=>{ev?.preventDefault?.();
ev?.stopPropagation?.();

    const tipo=$('#gsmType').value;

    const n={tipo,
nome:$('#gsmName').value.trim(),
cds:$('#gsmCds').value.trim(),
secondary:tipo==='TELÃO'?'':($('#gsmSecondary')?.value.trim()||''),
radio:tipo==='RÁDIO'?($('#gsmRadio')?.value.trim()||''):'',
postit:tipo==='TELÃO'?($('#gsmPostit')?.value.trim()||''):'',
speakers:tipo==='TELÃO'?[...modal.querySelectorAll('.gsmSpeaker')].map(x=>x.value.trim()).filter(Boolean).slice(0,4):[]};

    if(!n.nome)return alert('Informe o nome/identificação.');

    const btn=$('#gsmSave');
 btn.disabled=true;
 btn.textContent='SALVANDO...';

    if(isNew) rows.push(n);
 else rows[i]=n;

    try{await v909CommitStructure(before,isNew?`Estrutura adicionada: ${n.tipo} ${n.nome}`:`Estrutura editada: ${n.tipo} ${n.nome}`);
close()}catch(e){if(isNew)rows.pop();
else rows[i]=before[i];
alert('Erro ao salvar estrutura: '+e.message);
btn.disabled=false;
btn.textContent=isNew?'ADICIONAR E SALVAR':'SALVAR EDIÇÃO'}
  };

};

window.gsDeleteSimple=async function(i){
  const rows=gsRows(),
r=rows[i];
 if(!r)return;

  if(!confirm(`Excluir ${r.nome||r.tipo}?`))return;

  const before=v9Clone(rows);
 rows.splice(i,1);

  try{await v909CommitStructure(before,`Estrutura excluída: ${r.tipo} ${r.nome||''}`)}catch(e){techDraft.estruturaCatalogo=before;
alert('Erro ao excluir: '+e.message);
gsRender(false)}
};

// Foco do Telão também aceita Post-it e caixas de som como fallback.
window.gsFocusMap=function(ev,i){
  ev?.preventDefault?.();
 ev?.stopPropagation?.();

  const row=gsRows()[i];
 if(!row)return false;

  gsFilter='TODOS';
 gsSetView('MAPA');

  setTimeout(()=>{gsRenderMap(false);gsMap?.invalidateSize();const candidates=[row.cds,
row.secondary,
row.postit,
...(row.speakers||[]),
row.tipo==='RÁDIO'?v9QGCds():''];let p=null;for(const c of candidates){p=gsCoord(c);if(p)break}if(!p||!gsMap)return;const ll=L.latLng(p.y,p.x);gsMap.setView(ll,4,{animate:true});let nearest=null,
best=Infinity;gsLayer?.eachLayer?.(layer=>{if(!layer?.getLatLng)return;const q=layer.getLatLng(),
d=Math.hypot(q.lat-ll.lat,q.lng-ll.lng);if(d<best){best=d;nearest=layer}});nearest?.openPopup?.()},140);

  return false;

};

// O salvamento agora é feito no próprio modal; a barra antiga fica desativada.
$('#gsDirtyBar')?.classList.add('hidden');

/* ===== HIGH OS V9.0.10 · Persistência Estrutura sem sair do perfil ===== */
async function v9010CommitStructure(beforeRows, descricao='Estrutura atualizada'){
  const current=grCurrent(),
 group=current?.group;

  if(!group) throw new Error('Group não identificado.');

  const before=v9CleanRows(v9Clone(beforeRows||[]));

  const after=v9CleanRows(v9Clone(gsRows()));

  const diff=v9Diff(before,after);

  /* V10.23 - não grava, relê nem audita quando o editor não mudou a estrutura. */
  if(!diff.length){v9StructureDirty=false;$('#gsDirtyBar')?.classList.add('hidden');gsRender(false);return true;}

  const scrollY=window.scrollY;

  const ref=doc(db,'highos','data','faccoes',idFac(group));

  techDraft=techDraft||mergedTechProfile(current);

  techDraft.estruturaCatalogo=v9Clone(after);

  await setDoc(ref,{
    estruturaCatalogoV9:clonePlain(after),

    perfilTecnico:clonePlain(techDraft),

    updatedAt:serverTimestamp(),

    updatedBy:currentUser?.email||''
  },{merge:true});

  /* V10.68 - setDoc resolvido já confirma a gravação no SDK.
     Reaplica exatamente o payload salvo no estado local e elimina 1 getDoc
     por edição de estrutura. */
  const persisted=v9CleanRows(v9Clone(after));
  const savedProfile=clonePlain(techDraft);

  let pos=faccoes.findIndex(x=>x.group===group);

  if(pos>=0) faccoes[pos]={...faccoes[pos],
estruturaCatalogoV9:clonePlain(persisted),
perfilTecnico:savedProfile};

  else {faccoes.push({id:group,group,estruturaCatalogoV9:clonePlain(persisted),perfilTecnico:savedProfile});
pos=faccoes.length-1}
  techDraft=mergedTechProfile(faccoes[pos]);

  techDraft.estruturaCatalogo=v9Clone(persisted);

  v9StructureOriginal=v9Clone(persisted);

  v9StructureDirty=false;

  $('#gsDirtyBar')?.classList.add('hidden');

  try{await addDoc(histCol,{sessionId:currentSessionId||'',
tipo:'ESTRUTURA_ATUALIZADA',
group,
descricao:`${descricao}: ${diff.length} alteração(ões)`,
usuario:currentUser?.email||'',
data:serverTimestamp()})}catch(e){console.warn('Histórico da estrutura não gravado:',e)}
  // A edição de estrutura nunca deve fechar o perfil nem voltar para Organizações.
  activateAppPage('group-profile');

  gsRender(false);

  setTimeout(()=>{try{window.scrollTo({top:scrollY,
left:0,
behavior:'auto'})}catch{};gsMap?.invalidateSize?.()},60);

  if(diff.length && confirm(`Alterações salvas.\n\nDeseja gerar uma solicitação ao Dev da cidade com ${diff.length} alteração(ões)?`)){
    v9ShowRequest(v9StructureRequest(group,diff));

  }
  return true;

}
// Substitui apenas o commit da estrutura; o restante da V9 permanece igual.
v909CommitStructure=v9010CommitStructure;

// Blindagem: botões da Estrutura dentro do formulário do Group nunca podem submeter o formulário principal.
document.addEventListener('click',e=>{
  const b=e.target.closest?.('#groupStructurePanel button, .gs-card button, #gsModal button');
  if(b && !b.hasAttribute('type')) b.setAttribute('type','button');
},true);

/* ===== HIGH OS V9.1 · CENTRAL DE GESTÃO DO ILEGAL ===== */
let mgmtLastRows=[];

function mgmtDayKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function mgmtStart(days,offset=0){const d=new Date();
d.setHours(0,0,0,0);
d.setDate(d.getDate()-offset-days+1);
return d}
function mgmtRowsFor(group,start,end){return metricas.filter(m=>alvesNorm(m.group||m.organizacao||m.faccao)===alvesNorm(group)&&metricDateValue(m)>=start&&metricDateValue(m)<=end)}
function mgmtPeriodStats(group,days,offset=0){const start=mgmtStart(days,offset),
end=new Date();
end.setHours(23,59,59,999);
if(offset){end.setDate(end.getDate()-offset)}const rows=mgmtRowsFor(group,start,end),
vals=rows.flatMap(r=>Object.values(metricSlots(r)).filter(Number.isFinite));
const avg=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0;
const peak=vals.length?Math.max(...vals):0;
const dates=new Set(rows.map(r=>mgmtDayKey(metricDateValue(r))));
const expectedSlots=rows.length*4,
actualSlots=rows.reduce((n,r)=>n+['14H',
'16H',
'21H',
'23H'].filter(h=>Number.isFinite(metricSlots(r)[h])).length,0);
return {rows,
avg,
peak,
days:dates.size,
coverage:expectedSlots?actualSlots/expectedSlots*100:0,
start,
end}}
function mgmtPct(cur,prev){return prev>0?(cur-prev)/prev*100:(cur>0?null:0)}
function mgmtTrendText(v){if(v===null||!Number.isFinite(v))return 'base anterior zerada';
return `${v>=0?'+':''}${v.toFixed(0)}%`}
function mgmtMedian(a){const x=a.filter(Number.isFinite).sort((a,b)=>a-b);
if(!x.length)return 0;
const m=Math.floor(x.length/2);
return x.length%2?x[m]:(x[m-1]+x[m])/2}
function mgmtBuild(){
 const occupied=faccoes.filter(f=>f.status==='ATIVA'&&String(f.faccao||'').trim());

 const base=occupied.map(f=>{const w=mgmtPeriodStats(f.group,7),
wp=mgmtPeriodStats(f.group,7,7),
m=mgmtPeriodStats(f.group,30),
mp=mgmtPeriodStats(f.group,30,30);return {f,
w,
wp,
m,
mp,
wTrend:mgmtPct(w.avg,wp.avg),
mTrend:mgmtPct(m.avg,mp.avg)}});

 const medBySeg={};
[...new Set(base.map(x=>x.f.segmento||'OUTROS'))].forEach(seg=>{medBySeg[seg]=mgmtMedian(base.filter(x=>(x.f.segmento||'OUTROS')===seg&&x.w.days>=2&&x.w.avg>0).map(x=>x.w.avg))});

 const globalMed=mgmtMedian(base.filter(x=>x.w.avg>0).map(x=>x.w.avg));

 return base.map(x=>{const med=medBySeg[x.f.segmento||'OUTROS']||globalMed||1,
rel=x.w.avg/med;let status='SAUDAVEL',
reasons=[],
score=0;
  const enough=x.w.days>=3&&x.w.coverage>=60,
zeroWithData=x.w.coverage>=80&&x.w.days>=3&&x.w.avg===0;
  if(!enough&&x.m.days<3){status='SEM_DADOS';reasons.push('dados insuficientes para uma avaliação segura');score=20}
  else if(zeroWithData){status='CRITICA';reasons.push('coletas realizadas com contingente zero');score=150}
  else if(x.w.avg>0&&rel<.45){status='CRITICA';reasons.push('nível atual muito abaixo da referência do segmento');score=125}
  else if(x.wTrend!==null&&x.wTrend<=-35&&rel<.85){status='CRITICA';reasons.push(`queda semanal de ${Math.abs(x.wTrend).toFixed(0)}%`);score=110}
  else if(x.w.avg>0&&rel<.70){status='ATENCAO';reasons.push('nível atual abaixo da referência do segmento');score=75}
  else if(x.wTrend!==null&&x.wTrend<=-20){status='ATENCAO';reasons.push(`queda semanal de ${Math.abs(x.wTrend).toFixed(0)}%`);score=70}
  else if(x.w.coverage<80){status='SEM_DADOS';reasons.push('coletas parcialmente incompletas');score=25}
  else if(x.wp.avg>0&&x.wTrend!==null&&x.wTrend>=25&&rel<1){status='RECUPERACAO';reasons.push('recuperação relevante, mas nível absoluto ainda abaixo da referência');score=35}
  else if(rel>=1.35&&x.w.avg>=5&&(!Number.isFinite(x.wTrend)||x.wTrend>=-15)){status='EXCELENTE';reasons.push('desempenho absoluto acima da referência do segmento');score=-20}
  else{status='SAUDAVEL';reasons.push(x.wTrend!==null&&x.wTrend>=10?'evolução com nível atual saudável':'desempenho estável dentro do esperado');score=0}
  if(x.mTrend!==null&&x.mTrend<=-25&&status==='SAUDAVEL'){status='ATENCAO';reasons.push(`queda mensal de ${Math.abs(x.mTrend).toFixed(0)}%`);score=65}
  return {...x,
status,
reasons,
score,
segmentMedian:med,
relative:rel};
 })
}
function mgmtLabel(s){return s==='EXCELENTE'?'EXCELENTE':s==='SAUDAVEL'?'SAUDÁVEL':s==='RECUPERACAO'?'EM RECUPERAÇÃO':s==='ATENCAO'?'ATENÇÃO':s==='CRITICA'?'CRÍTICA':'DADOS INSUFICIENTES'}
function mgmtAction(x){if(x.status==='CRITICA')return 'Contato prioritário com a liderança para entender atividade, contingente e definir recuperação.';
if(x.status==='ATENCAO')return 'Acompanhar de perto e conversar preventivamente com a liderança.';
if(x.status==='RECUPERACAO')return 'Reconhecer a melhora, mantendo acompanhamento até consolidar a recuperação.';
if(x.status==='SEM_DADOS')return 'Conferir as coletas antes de qualquer avaliação administrativa.';
if(x.status==='EXCELENTE')return 'Reconhecer a liderança e usar como referência positiva do período.';
return 'Manter acompanhamento normal.'}
function mgmtMessage(x){const name=x.f.faccao||x.f.group;
if(x.status==='EXCELENTE'||x.status==='SAUDAVEL')return `Boa noite, liderança da ${name}.\n\nPassando para agradecer pelo trabalho que vocês vêm realizando. A ${x.f.group} apresentou média semanal de ${x.w.avg.toFixed(1)} e ${x.status==='EXCELENTE'?'um desempenho acima da referência do segmento':'um desempenho consistente dentro do esperado'}.\n\nContinuem mantendo a organização e o contingente nesse ritmo. Parabéns pelo trabalho e contem com a equipe do Ilegal.`;
if(x.status==='RECUPERACAO')return `Boa noite, liderança da ${name}.\n\nIdentificamos uma melhora importante nas métricas da ${x.f.group}. A organização está em recuperação e queremos reconhecer essa evolução.\n\nVamos continuar acompanhando os próximos dias para consolidar essa melhora. Contem com a equipe do Ilegal.`;
if(x.status==='SEM_DADOS')return `Boa noite, liderança da ${name}.\n\nAinda não temos coletas suficientes para uma avaliação segura da ${x.f.group}. Estamos conferindo os dados antes de qualquer conclusão. Caso tenha ocorrido alguma situação específica, podem nos sinalizar.`;
return `Boa noite, liderança da ${name}.\n\nEstamos acompanhando as métricas da ${x.f.group} e identificamos ${x.reasons.join(' e ')}. A média semanal atual está em ${x.w.avg.toFixed(1)} (${mgmtTrendText(x.wTrend)} em relação à semana anterior).\n\nQueremos entender se aconteceu alguma situação específica e alinhar com vocês um plano para recuperação. Quando puderem, chamem a equipe do Ilegal para conversarmos.`}
function mgmtFiltered(){const seg=$('#mgmtSegment')?.value||'',
st=$('#mgmtStatus')?.value||'',
q=alvesNorm($('#mgmtSearch')?.value||'');
return mgmtLastRows.filter(x=>(!seg||x.f.segmento===seg)&&(!st||x.status===st)&&(!q||alvesNorm([x.f.group,
x.f.faccao,
x.f.lider].join(' ')).includes(q)))}
function mgmtSummaryText(){const rows=mgmtLastRows,
counts=s=>rows.filter(x=>x.status===s).length,
avg=rows.length?rows.reduce((a,x)=>a+x.w.avg,0)/rows.length:0,
prev=rows.length?rows.reduce((a,x)=>a+(x.wTrend?x.w.avg/(1+x.wTrend/100):x.w.avg),0)/rows.length:0,
tr=mgmtPct(avg,prev);
const critical=rows.filter(x=>x.status==='CRITICA').sort((a,b)=>b.score-a.score),
attention=rows.filter(x=>x.status==='ATENCAO').sort((a,b)=>b.score-a.score),
good=rows.filter(x=>x.status==='EXCELENTE'||x.status==='SAUDAVEL').sort((a,b)=>b.wTrend-a.wTrend).slice(0,5);
return `RESUMO DA CÚPULA — GESTÃO DO ILEGAL\n\nOrganizações ocupadas: ${rows.length}\nSaudáveis: ${counts('EXCELENTE')+counts('SAUDAVEL')}\nAtenção: ${counts('ATENCAO')}\nCríticas: ${counts('CRITICA')}\nDados insuficientes: ${counts('SEM_DADOS')}\nMédia global semanal: ${avg.toFixed(1)}\nEvolução estimada: ${tr>=0?'+':''}${tr.toFixed(1)}%\n\nPRIORIDADE DE CONTATO\n${critical.concat(attention).slice(0,8).map((x,i)=>`${i+1}. ${x.f.group} - ${x.f.faccao||'—'} | ${x.reasons.join('; ')}`).join('\n')||'Nenhuma prioridade crítica.'}\n\nDESTAQUES POSITIVOS\n${good.map(x=>`- ${x.f.group} - ${x.f.faccao||'—'} | ${mgmtTrendText(x.wTrend)} semanal`).join('\n')||'Sem destaques suficientes.'}\n\nAÇÕES RECOMENDADAS\n- Conversar primeiro com organizações críticas.\n- Acompanhar as organizações em atenção antes de medidas administrativas.\n- Não avaliar negativamente organizações com dados incompletos.\n- Reconhecer publicamente as lideranças com evolução consistente.`}
function mgmtSegmentReport(rows){const segs={};
rows.forEach(x=>{const k=x.f.segmento||'OUTROS';(segs[k]||(segs[k]=[])).push(x)});
return Object.entries(segs).sort((a,b)=>a[0].localeCompare(b[0],'pt-BR')).map(([seg,
list])=>{const avg=list.length?list.reduce((n,x)=>n+x.w.avg,0)/list.length:0;const month=list.length?list.reduce((n,x)=>n+x.m.avg,0)/list.length:0;const c=s=>list.filter(x=>x.status===s).length;return `- ${seg}: ${list.length} org(s) | semanal ${avg.toFixed(1)} | mensal ${month.toFixed(1)} | saudáveis ${c('EXCELENTE')+c('SAUDAVEL')} | atenção ${c('ATENCAO')} | críticas ${c('CRITICA')} | sem dados ${c('SEM_DADOS')}`}).join('\n')}
function mgmtGeneralReportText(){const rows=mgmtLastRows.length?mgmtLastRows:mgmtBuild();
const now=new Date(),
fmt=d=>d.toLocaleDateString('pt-BR'),
c=s=>rows.filter(x=>x.status===s).length;
const weekly=rows.length?rows.reduce((n,x)=>n+x.w.avg,0)/rows.length:0,
monthly=rows.length?rows.reduce((n,x)=>n+x.m.avg,0)/rows.length:0;
const prevW=rows.length?rows.reduce((n,x)=>n+(x.wTrend>-99?x.w.avg/(1+x.wTrend/100||1):x.w.avg),0)/rows.length:0,
prevM=rows.length?rows.reduce((n,x)=>n+(x.mTrend>-99?x.m.avg/(1+x.mTrend/100||1):x.m.avg),0)/rows.length:0;
const wTrend=mgmtPct(weekly,prevW),
mTrend=mgmtPct(monthly,prevM);
const critical=rows.filter(x=>x.status==='CRITICA').sort((a,b)=>b.score-a.score),
attention=rows.filter(x=>x.status==='ATENCAO').sort((a,b)=>b.score-a.score),
nodata=rows.filter(x=>x.status==='SEM_DADOS'),
good=rows.filter(x=>x.status==='EXCELENTE'||x.status==='SAUDAVEL').sort((a,b)=>b.wTrend-a.wTrend);
const all=rows.slice().sort((a,b)=>b.score-a.score||String(a.f.group).localeCompare(String(b.f.group)));
return `RELATÓRIO GERAL DO ILEGAL — HIGH OS\nGerado em: ${now.toLocaleString('pt-BR')}\nPeríodos analisados: últimos 7 dias e últimos 30 dias\n\n1. VISÃO EXECUTIVA\nOrganizações ocupadas: ${rows.length}\nSaudáveis: ${c('EXCELENTE')+c('SAUDAVEL')}\nAtenção: ${c('ATENCAO')}\nCríticas: ${c('CRITICA')}\nDados insuficientes: ${c('SEM_DADOS')}\nMédia global semanal: ${weekly.toFixed(1)} (${wTrend>=0?'+':''}${wTrend.toFixed(1)}%)\nMédia global mensal: ${monthly.toFixed(1)} (${mTrend>=0?'+':''}${mTrend.toFixed(1)}%)\n\n2. VISÃO POR SEGMENTO\n${mgmtSegmentReport(rows)||'Sem dados suficientes.'}\n\n3. PRIORIDADE DE AÇÃO\n${critical.map((x,i)=>`${i+1}. [CRÍTICA] ${x.f.group} — ${x.f.faccao||'sem nome'} | ${x.reasons.join('; ')} | Ação: ${mgmtAction(x)}`).join('\n')||'Nenhuma organização crítica.'}\n${attention.map((x,i)=>`${critical.length+i+1}. [ATENÇÃO] ${x.f.group} — ${x.f.faccao||'sem nome'} | ${x.reasons.join('; ')} | Ação: ${mgmtAction(x)}`).join('\n')||''}\n\n4. RECONHECIMENTOS SUGERIDOS\n${good.slice(0,10).map((x,i)=>`${i+1}. ${x.f.group} — ${x.f.faccao||'sem nome'} | média ${x.w.avg.toFixed(1)} | ${mgmtTrendText(x.wTrend)} semanal | ${mgmtAction(x)}`).join('\n')||'Sem destaques suficientes.'}\n\n5. DADOS A CONFERIR\n${nodata.map(x=>`- ${x.f.group} — ${x.f.faccao||'sem nome'} | ${x.reasons.join('; ')} | cobertura semanal ${x.w.coverage.toFixed(0)}%`).join('\n')||'Nenhuma organização com dados insuficientes.'}\n\n6. MAPA COMPLETO DAS ORGANIZAÇÕES\n${all.map(x=>`- ${x.f.group} | ${x.f.faccao||'—'} | ${x.f.segmento||'—'} | ${mgmtLabel(x.status)} | semana ${x.w.avg.toFixed(1)} (${mgmtTrendText(x.wTrend)}) | mês ${x.m.avg.toFixed(1)} (${mgmtTrendText(x.mTrend)}) | pico sem. ${x.w.peak} | coleta ${x.w.coverage.toFixed(0)}% | ${mgmtAction(x)}`).join('\n')||'Sem organizações ocupadas.'}\n\n7. PLANO DE AÇÃO RECOMENDADO\n- Priorizar contato com as organizações críticas e registrar o retorno da liderança.\n- Acompanhar as organizações em atenção antes de medidas administrativas.\n- Não penalizar organizações classificadas como dados insuficientes até validar as coletas.\n- Reconhecer as lideranças com estabilidade ou evolução consistente.\n- Reavaliar semanalmente as ações realizadas e comparar a recuperação no relatório seguinte.\n\n8. COMUNICAÇÃO COM LIDERANÇAS\n- Críticas: abordagem de alinhamento, buscando entender causa da queda e definir recuperação.\n- Atenção: contato preventivo, sem cobrança precipitada.\n- Saudáveis: agradecimento e reconhecimento pelo trabalho.\n\nRelatório gerencial gerado automaticamente a partir dos dados disponíveis no High OS.`}
function mgmtEscHtml(v=''){return String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;',
'<':'&lt;',
'>':'&gt;',
'"':'&quot;'}[m]))}
function mgmtBarSvg(items,maxItems=12){const list=items.slice(0,maxItems),
max=Math.max(1,...list.map(x=>x.value));
return `<svg viewBox="0 0 900 ${70+list.length*32}" xmlns="http://www.w3.org/2000/svg"><style>text{font:12px Arial;fill:#2d2631}.v{font-weight:bold}.bar{fill:#704090}.grid{stroke:#eee}</style>${list.map((x,i)=>{const y=35+i*32,w=Math.max(2,x.value/max*610);return `<text x="8" y="${y+14}">${mgmtEscHtml(x.label)}</text><rect class="bar" x="190" y="${y}" width="${w}" height="18" rx="4"/><text class="v" x="${205+w}" y="${y+14}">${Number(x.value).toFixed(1)}</text>`}).join('')}</svg>`}
function mgmtRichReportHtml(){const rows=mgmtBuild(),
now=new Date(),
c=s=>rows.filter(x=>x.status===s).length,
avg=k=>rows.length?rows.reduce((n,x)=>n+x[k].avg,0)/rows.length:0;
const priority=rows.filter(x=>['CRITICA',
'ATENCAO'].includes(x.status)).sort((a,b)=>b.score-a.score),
best=rows.filter(x=>['EXCELENTE',
'SAUDAVEL'].includes(x.status)).sort((a,b)=>b.w.avg-a.w.avg).slice(0,10),
rank=rows.slice().sort((a,b)=>b.w.avg-a.w.avg);
const segs={};
rows.forEach(x=>(segs[x.f.segmento||'OUTROS']||(segs[x.f.segmento||'OUTROS']=[])).push(x));
const segRows=Object.entries(segs).map(([name,
a])=>({name,
count:a.length,
avg:a.reduce((n,x)=>n+x.w.avg,0)/a.length,
critical:a.filter(x=>x.status==='CRITICA').length,
attention:a.filter(x=>x.status==='ATENCAO').length})).sort((a,b)=>b.avg-a.avg);
const topAbs=rank[0],
critSeg=segRows.slice().sort((a,b)=>(b.critical*2+b.attention)-(a.critical*2+a.attention))[0];
const narrative=`O Ilegal possui ${rows.length} organizações ocupadas avaliadas. ${c('CRITICA')} estão em situação crítica e ${c('ATENCAO')} exigem atenção. ${topAbs?`${topAbs.f.group} — ${topAbs.f.faccao||'—'} apresenta a maior média semanal absoluta (${topAbs.w.avg.toFixed(1)}).`:''} ${critSeg&&critSeg.critical?`O principal foco por segmento é ${critSeg.name}, com ${critSeg.critical} organização(ões) crítica(s).`:''} Organizações com coleta incompleta são separadas da avaliação para evitar conclusões indevidas.`;
return `<!doctype html><html><head><meta charset="utf-8"><title>Relatório Geral do Ilegal</title><style>@page{size:A4;margin:12mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#231d27;margin:0;background:#fff;font-size:11px}.cover{padding:28px 0 20px;border-bottom:4px solid #5d2b78}.kicker{font-size:10px;letter-spacing:2px;color:#71458a;font-weight:700}.cover h1{font-size:30px;margin:6px 0}.muted{color:#746b77}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:18px 0}.kpi{border:1px solid #ddd4e1;border-radius:10px;padding:12px}.kpi b{font-size:22px;display:block}.section{margin:22px 0;break-inside:avoid}.section h2{font-size:16px;border-bottom:1px solid #ddd;padding-bottom:6px}.callout{background:#f6f1f8;border-left:4px solid #6e3b86;padding:12px;line-height:1.5}.charts{display:grid;grid-template-columns:1fr 1fr;gap:12px}.chart{border:1px solid #e1dbe4;border-radius:10px;padding:8px}.chart h3{font-size:12px;margin:3px 6px}table{width:100%;border-collapse:collapse;font-size:9px}th{background:#302537;color:white;text-align:left;padding:6px}td{padding:6px;border-bottom:1px solid #e9e4eb;vertical-align:top}.CRITICA{color:#b51f31;font-weight:bold}.ATENCAO{color:#9b6b00;font-weight:bold}.EXCELENTE{color:#087c45;font-weight:bold}.SAUDAVEL{color:#167047;font-weight:bold}.RECUPERACAO{color:#315e9d;font-weight:bold}.SEM_DADOS{color:#777;font-weight:bold}.pagebreak{break-before:page}.footer{margin-top:20px;padding-top:8px;border-top:1px solid #ddd;color:#777;font-size:8px}@media print{.no-print{display:none}.section{break-inside:auto}.chart{break-inside:avoid}}</style></head><body><section class="cover"><div class="kicker">HIGH OS • GESTÃO DO ILEGAL</div><h1>Relatório Geral do Ilegal</h1><div class="muted">Gerado em ${now.toLocaleString('pt-BR')} • análise semanal (7 dias) + mensal (30 dias) • dados reais carregados na Central de Métricas</div></section><div class="kpis"><div class="kpi"><span>Ocupadas</span><b>${rows.length}</b></div><div class="kpi"><span>Excelentes / Saudáveis</span><b>${c('EXCELENTE')+c('SAUDAVEL')}</b></div><div class="kpi"><span>Atenção / Recuperação</span><b>${c('ATENCAO')+c('RECUPERACAO')}</b></div><div class="kpi"><span>Críticas</span><b>${c('CRITICA')}</b></div></div><section class="section"><h2>1. Leitura executiva</h2><div class="callout">${mgmtEscHtml(narrative)}</div><p><b>Média global semanal:</b> ${avg('w').toFixed(1)} &nbsp; | &nbsp; <b>Média global mensal:</b> ${avg('m').toFixed(1)} &nbsp; | &nbsp; <b>Dados insuficientes:</b> ${c('SEM_DADOS')}</p></section><section class="section charts"><div class="chart"><h3>Ranking — média semanal</h3>${mgmtBarSvg(rank.map(x=>({label:x.f.group,value:x.w.avg})))}</div><div class="chart"><h3>Segmentos — média semanal</h3>${mgmtBarSvg(segRows.map(x=>({label:x.name,value:x.avg})),20)}</div></section><section class="section"><h2>2. Visão por segmento</h2><table><thead><tr><th>Segmento</th><th>Orgs</th><th>Média semanal</th><th>Críticas</th><th>Atenção</th></tr></thead><tbody>${segRows.map(x=>`<tr><td>${mgmtEscHtml(x.name)}</td><td>${x.count}</td><td>${x.avg.toFixed(1)}</td><td>${x.critical}</td><td>${x.attention}</td></tr>`).join('')}</tbody></table></section><section class="section"><h2>3. Prioridades e ações</h2><table><thead><tr><th>#</th><th>Organização</th><th>Status</th><th>Diagnóstico</th><th>Ação sugerida</th></tr></thead><tbody>${priority.map((x,i)=>`<tr><td>${i+1}</td><td><b>${mgmtEscHtml(x.f.group)}</b><br>${mgmtEscHtml(x.f.faccao||'—')}<br><span class="muted">${mgmtEscHtml(x.f.lider||'Líder não cadastrado')}</span></td><td class="${x.status}">${mgmtLabel(x.status)}</td><td>${mgmtEscHtml(x.reasons.join('; '))}<br>Semana ${x.w.avg.toFixed(1)} • Mês ${x.m.avg.toFixed(1)}</td><td>${mgmtEscHtml(mgmtAction(x))}</td></tr>`).join('')||'<tr><td colspan="5">Nenhuma prioridade crítica.</td></tr>'}</tbody></table></section><section class="section"><h2>4. Reconhecimentos</h2><table><thead><tr><th>Organização</th><th>Média semanal</th><th>Pico</th><th>Status</th><th>Sugestão</th></tr></thead><tbody>${best.map(x=>`<tr><td><b>${mgmtEscHtml(x.f.group)}</b> — ${mgmtEscHtml(x.f.faccao||'—')}</td><td>${x.w.avg.toFixed(1)}</td><td>${x.w.peak}</td><td class="${x.status}">${mgmtLabel(x.status)}</td><td>${mgmtEscHtml(mgmtAction(x))}</td></tr>`).join('')}</tbody></table></section><section class="section pagebreak"><h2>5. Mapa completo — todas as organizações</h2><table><thead><tr><th>Group / Facção</th><th>Segmento</th><th>Status</th><th>Semana</th><th>Sem. ant.</th><th>Mês</th><th>Mês ant.</th><th>Pico</th><th>Cobertura</th><th>Diagnóstico</th></tr></thead><tbody>${rows.slice().sort((a,b)=>b.score-a.score||b.w.avg-a.w.avg).map(x=>`<tr><td><b>${mgmtEscHtml(x.f.group)}</b><br>${mgmtEscHtml(x.f.faccao||'—')}<br><span class="muted">${mgmtEscHtml(x.f.lider||'')}</span></td><td>${mgmtEscHtml(x.f.segmento||'—')}</td><td class="${x.status}">${mgmtLabel(x.status)}</td><td>${x.w.avg.toFixed(1)}<br>${mgmtTrendText(x.wTrend)}</td><td>${x.wp.avg.toFixed(1)}</td><td>${x.m.avg.toFixed(1)}<br>${mgmtTrendText(x.mTrend)}</td><td>${x.mp.avg.toFixed(1)}</td><td>${x.w.peak}</td><td>${x.w.coverage.toFixed(0)}%</td><td>${mgmtEscHtml(x.reasons.join('; '))}</td></tr>`).join('')}</tbody></table></section><section class="section"><h2>6. Plano de gestão</h2><div class="callout"><b>Prioridade:</b> conversar primeiro com as críticas; acompanhar preventivamente as de atenção; reconhecer desempenho absoluto forte; acompanhar recuperações até consolidarem; nunca penalizar dados insuficientes sem conferir as coletas.</div></section><div class="footer">Relatório gerado pelo High OS a partir das organizações ocupadas e registros disponíveis na Central de Métricas. Percentuais com base anterior zerada não são usados como prova isolada de bom desempenho.</div></body></html>`}
function mgmtOpenRichReport(){mgmtLastRows=mgmtBuild();
const w=window.open('','_blank');
if(!w)return alert('Permita pop-ups para abrir o relatório completo.');
w.document.open();
w.document.write(mgmtRichReportHtml());
w.document.close();
w.focus()}
function mgmtOpenGeneralReport(){if(!mgmtLastRows.length)mgmtLastRows=mgmtBuild();
const txt=mgmtGeneralReportText();
const ta=$('#mgmtReportText');
if(ta)ta.value=txt;
$('#mgmtReportModal')?.classList.remove('hidden')}
function mgmtDownloadGeneralReport(){const text=mgmtGeneralReportText(),
blob=new Blob([text],{type:'text/plain;charset=utf-8'}),
url=URL.createObjectURL(blob),
a=document.createElement('a');
a.href=url;
a.download=`relatorio-geral-ilegal-${mgmtDayKey(new Date())}.txt`;
a.click();
setTimeout(()=>URL.revokeObjectURL(url),1000)}
function mgmtPrintGeneralReport(){const text=mgmtGeneralReportText(),
w=window.open('','_blank');
if(!w)return alert('Permita pop-ups para imprimir o relatório.');
w.document.write(`<html><head><title>Relatório Geral do Ilegal</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#111}pre{white-space:pre-wrap;font:13px/1.5 Arial,sans-serif}</style></head><body><pre>${esc(text)}</pre></body></html>`);
w.document.close();
w.focus();
setTimeout(()=>w.print(),250)}
function renderIllegalManagement(){if(!$('#mgmtExecutive'))return;
mgmtLastRows=mgmtBuild();
const rows=mgmtFiltered(),
all=mgmtLastRows,
c=s=>all.filter(x=>x.status===s).length,
globalAvg=all.length?all.reduce((a,x)=>a+x.w.avg,0)/all.length:0,
monthAvg=all.length?all.reduce((a,x)=>a+x.m.avg,0)/all.length:0;
$('#mgmtExecutive').innerHTML=`<article class="mgmt-kpi"><span>ORGANIZAÇÕES</span><b>${all.length}</b><small>ocupadas avaliadas</small></article><article class="mgmt-kpi ok"><span>SAUDÁVEIS</span><b>${c('EXCELENTE')+c('SAUDAVEL')}</b><small>sem intervenção</small></article><article class="mgmt-kpi att"><span>ATENÇÃO</span><b>${c('ATENCAO')}</b><small>acompanhar</small></article><article class="mgmt-kpi crit"><span>CRÍTICAS</span><b>${c('CRITICA')}</b><small>prioridade</small></article><article class="mgmt-kpi"><span>MÉDIA SEMANAL GLOBAL</span><b>${globalAvg.toFixed(1)}</b><small>todas as organizações</small></article><article class="mgmt-kpi"><span>MÉDIA MENSAL GLOBAL</span><b>${monthAvg.toFixed(1)}</b><small>últimos 30 dias</small></article>`;
$('#mgmtHeatmap').innerHTML=rows.map(x=>`<button class="mgmt-heat ${x.status}" data-mgmt-open="${esc(x.f.group)}" title="${esc(x.f.group)} • ${mgmtLabel(x.status)}"><span>${esc(x.f.group)}</span><small>${esc(x.f.faccao||'Sem ocupante')}</small><i>${mgmtLabel(x.status)}</i></button>`).join('')||'<div class="mgmt-empty">Nenhuma organização para os filtros.</div>';
const priorities=rows.filter(x=>x.status==='CRITICA'||x.status==='ATENCAO').sort((a,b)=>b.score-a.score).slice(0,10);
$('#mgmtActions').innerHTML=priorities.map((x,i)=>`<div class="mgmt-action-row"><span class="mgmt-priority">${i+1}</span><div><b>${esc(x.f.faccao||x.f.group)} • ${esc(x.f.group)}</b><small>${esc(x.reasons.join(' • '))} — ${esc(mgmtAction(x))}</small></div><div class="mgmt-action-buttons"><button data-mgmt-open="${esc(x.f.group)}">ABRIR</button><button data-mgmt-msg="${esc(x.f.group)}">MENSAGEM</button></div></div>`).join('')||'<div class="mgmt-empty">Nenhuma organização exige intervenção agora.</div>';
const positive=rows.filter(x=>x.status==='EXCELENTE'||x.status==='SAUDAVEL').sort((a,b)=>b.wTrend-a.wTrend).slice(0,8);
$('#mgmtRecognition').innerHTML=positive.map(x=>`<div class="mgmt-action-row"><span class="mgmt-priority">↑</span><div><b>${esc(x.f.faccao||x.f.group)}</b><small>${mgmtTrendText(x.wTrend)} semana • média ${x.w.avg.toFixed(1)}</small></div><div class="mgmt-action-buttons"><button data-mgmt-msg="${esc(x.f.group)}">AGRADECER</button></div></div>`).join('')||'<div class="mgmt-empty">Sem destaques positivos suficientes.</div>';
$('#mgmtTable').innerHTML=`<table class="mgmt-table"><thead><tr><th>ORGANIZAÇÃO</th><th>SEGMENTO</th><th>STATUS</th><th>SEMANA</th><th>VAR. SEM.</th><th>MÊS</th><th>VAR. MÊS</th><th>COLETA</th><th>SUGESTÃO</th></tr></thead><tbody>${rows.sort((a,b)=>b.score-a.score).map(x=>`<tr><td><b>${esc(x.f.faccao||'—')}</b><br><small>${esc(x.f.group)} • ${esc(x.f.lider||'sem líder')}</small></td><td>${esc(x.f.segmento||'—')}</td><td><span class="mgmt-status ${x.status}">${mgmtLabel(x.status)}</span></td><td>${x.w.avg.toFixed(1)} / pico ${x.w.peak}</td><td class="mgmt-trend ${x.wTrend>=0?'up':'down'}">${mgmtTrendText(x.wTrend)}</td><td>${x.m.avg.toFixed(1)} / pico ${x.m.peak}</td><td class="mgmt-trend ${x.mTrend>=0?'up':'down'}">${mgmtTrendText(x.mTrend)}</td><td>${x.w.coverage.toFixed(0)}%</td><td>${esc(mgmtAction(x))}</td></tr>`).join('')}</tbody></table>`}
function mgmtOpenMessage(group){const x=mgmtLastRows.find(y=>y.f.group===group);
if(!x)return;
$('#mgmtMessageTitle').textContent=`MENSAGEM • ${x.f.faccao||x.f.group}`;
$('#mgmtMessageText').value=mgmtMessage(x);
$('#mgmtMessageModal').classList.remove('hidden')}
$('#mgmtRefreshBtn')?.addEventListener('click',renderIllegalManagement);
$('#mgmtSegment')?.addEventListener('change',renderIllegalManagement);
$('#mgmtStatus')?.addEventListener('change',renderIllegalManagement);
$('#mgmtSearch')?.addEventListener('input',renderIllegalManagement);
$('#mgmtCopyBtn')?.addEventListener('click',async()=>{await navigator.clipboard.writeText(mgmtSummaryText());alert('Resumo da Cúpula copiado.')});
$('#mgmtReportClose')?.addEventListener('click',()=>$('#mgmtReportModal').classList.add('hidden'));
$('#mgmtReportCopy')?.addEventListener('click',async()=>{await navigator.clipboard.writeText($('#mgmtReportText')?.value||mgmtGeneralReportText());alert('Relatório geral copiado.')});
$('#mgmtReportDownload')?.addEventListener('click',mgmtDownloadGeneralReport);
$('#mgmtReportPrint')?.addEventListener('click',mgmtPrintGeneralReport);
$('#mgmtMessageClose')?.addEventListener('click',()=>$('#mgmtMessageModal').classList.add('hidden'));
$('#mgmtMessageCopy')?.addEventListener('click',async()=>{await navigator.clipboard.writeText($('#mgmtMessageText').value);alert('Mensagem copiada para o Discord.')});
document.addEventListener('click',e=>{const msg=e.target.closest?.('[data-mgmt-msg]');if(msg){mgmtOpenMessage(msg.dataset.mgmtMsg);return}const op=e.target.closest?.('[data-mgmt-open]');if(op){const g=op.dataset.mgmtOpen;if($('#metricScopeSelect'))$('#metricScopeSelect').value=g;switchMetricCenterView('faction');renderMetricFactionDetail(g)}});

/* ===== HIGH OS V9.2 · ORGANIZAÇÕES — LISTA + STATUS OPERACIONAL + RELATÓRIOS ===== */
function orgV92HasOccupant(f={}){return !!String(f.faccao||'').trim()}
function orgV92HasQG(f={}){
 const q=String(f.qg||f.nomeQG||f.nomeLocal||'').trim();

 return !!q && !/^(sem\s*(qg|local)|-|—|n\/a)$/i.test(q);

}
/* V14: mesma regra do Dashboard, métricas e entrega (modules/ocupacao.js). */
/* Quando a lista sai vazia o motivo quase nunca e o filtro: na virada
   de season a temporada simplesmente ainda nao tem Group definido.
   Dizer "ajuste o filtro" manda a pessoa procurar onde nao ha nada. */
function vazioDeGroups(){
 const naSeason=(faccoes||[]).length, total=(faccoesTodas||[]).length;
 if(season.carregada&&!naSeason){
  const fora=total-naSeason;
  return `<div class="placeholder"><b>◆</b><h3>A ${esc(season.nome)} AINDA NÃO TEM GROUP</h3>
   <p>Group é a definição produtiva de uma favela — o produto, a receita e o farm.
   Abra <b>QGs da Season</b>, escolha uma favela e defina o Group dela.</p>
   ${fora?`<p class="muted">${fora} Group(s) de outras seasons não aparecem aqui. Troque de season no topo para vê-los.</p>`:''}</div>`;
 }
 return '<div class="placeholder"><b>⌕</b><h3>NENHUM GROUP NESTE FILTRO</h3><p>Ajuste segmento, situação ou busca.</p></div>';
}

function orgV92Status(f={}){const s=situacaoGroup(f);return s==='SEM_QG'?'INDISPONIVEL':s}
function orgV92StatusLabel(s=''){return s==='ASSUMIDA'?'ASSUMIDA':s==='DISPONIVEL'?'DISPONÍVEL':s==='INDISPONIVEL'?'SEM QG':s==='REVISAR'?'REVISAR':'—'}
function orgV92StatusClass(s=''){return s==='ASSUMIDA'?'assumed':s==='DISPONIVEL'?'available':s==='REVISAR'?'review':'unavailable'}
function orgV92Segment(f={}){
 const raw=String(f.segmento||'').trim();
if(raw)return raw;

 const g=String(f.group||'').toLowerCase();

 if(g.startsWith('armas'))return 'ARMAS';
if(g.startsWith('municao')||g.startsWith('munição'))return 'MUNIÇÃO';
if(g.startsWith('lavagem'))return 'LAVAGEM';
if(g.startsWith('drogas'))return 'DROGAS';
if(g.startsWith('desmanche'))return 'DESMANCHE';
if(g.startsWith('contrabando'))return 'CONTRABANDO';
if(g.includes('ilegalmec')||g.includes('ilegalmedic'))return 'APOIO';
return 'OUTROS';

}
function orgV92Rows(){return faccoes.filter(f=>!f.removido).map(f=>({...f,
__orgStatus:orgV92Status(f),
__orgSegment:orgV92Segment(f)}))}
function orgV92Audit(rows=[]){
 const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const seen=new Map();

 rows.forEach(f=>{const k=norm(f.group);if(k)seen.set(k,(seen.get(k)||0)+1)});

 const duplicate=[...seen.values()].filter(n=>n>1).length;

 return {duplicate,
assumedNoDate:rows.filter(f=>f.__orgStatus==='ASSUMIDA'&&!String(f.dataEntrega||'').trim()).length,
assumedNoLeader:rows.filter(f=>f.__orgStatus==='ASSUMIDA'&&!String(f.lider||'').trim()).length,
assumedNoCds:rows.filter(f=>f.__orgStatus==='ASSUMIDA'&&!String(f.cds||'').trim()).length,
availableNoCds:rows.filter(f=>f.__orgStatus==='DISPONIVEL'&&!String(f.cds||'').trim()).length};

}
function orgV92Filtered(){
 const all=orgV92Rows(),
q=String($('#facSearch')?.value||'').trim().toLowerCase(),
seg=$('#facSegment')?.value||'',
st=$('#facStatus')?.value||'';

 return all.filter(f=>(!seg||segmentKey(f.__orgSegment)===segmentKey(seg))&&(!st||f.__orgStatus===st)&&(!q||[f.group,
f.faccao,
f.qg,
f.lider,
f.staff,
f.produto,
f.dataEntrega].join(' ').toLowerCase().includes(q)));

}
function renderFacActivityButtons(){activityButtons('facStatusButtons','facStatus',[['',
'TODAS',
'◉'],
['ASSUMIDA',
'ASSUMIDAS',
'●'],
['DISPONIVEL',
'DISPONÍVEIS',
'◇'],
['INDISPONIVEL',
'SEM QG',
'×'],
['REVISAR',
'REVISAR',
'!']],renderFaccoes)}
renderFacSegmentChips=function(){renderVisualSegmentFilter({rows:orgV92Rows().map(f=>({...f,
segmento:f.__orgSegment})),
field:'segmento',
selectId:'facSegment',
boxId:'facSegmentChips',
onChange:renderFaccoes})}
function orgV92ActionMarkup(f){
 const s=f.__orgStatus,
id=esc(f.id||f.group),
group=esc(f.group||'');

 if(s==='ASSUMIDA')return `<button type="button" class="mini-btn org-v92-open" data-id="${id}">PERFIL</button><button type="button" class="mini-btn org-v92-request" data-group="${group}">SOLICITAÇÃO</button>`;

 if(s==='DISPONIVEL')return `<button type="button" class="mini-btn org-v92-open" data-id="${id}">PERFIL</button><button type="button" class="btn-primary compact org-v92-deliver" data-group="${group}">ASSUMIR</button>`;

 return `<button type="button" class="mini-btn org-v92-open" data-id="${id}">PERFIL</button><button type="button" class="mini-btn org-v92-open" data-id="${id}">CADASTRAR QG</button>`;

}
renderFaccoes=function(){
 const all=orgV92Rows(),
rows=orgV92Filtered();
renderFacActivityButtons();
renderFacSegmentChips();

 const c=s=>all.filter(f=>f.__orgStatus===s).length;

 const summary=$('#orgV92Summary');
if(summary)summary.innerHTML=`<article><span>TOTAL</span><b>${all.length}</b><small>Groups administrativos</small></article><article class="assumed"><span>ASSUMIDAS</span><b>${c('ASSUMIDA')}</b><small>com facção ocupante</small></article><article class="available"><span>DISPONÍVEIS</span><b>${c('DISPONIVEL')}</b><small>livres com QG/Favela</small></article><article class="unavailable"><span>INDISPONÍVEIS</span><b>${c('INDISPONIVEL')}</b><small>ausência de QG/Favela</small></article>`;
 {const inc=inconsistenciasV14();if(summary&&(c('REVISAR')||inc.length)){summary.insertAdjacentHTML('beforeend',`<article class="review" data-revisar-ocupacao style="cursor:pointer"><span>A REVISAR</span><b>${inc.length}</b><small>dados contraditórios ou incompletos →</small></article>`);summary.querySelector('[data-revisar-ocupacao]')?.addEventListener('click',()=>abrirRevisao(painelDepsV14()))}}

 const st=$('#facStatus')?.value||'',
seg=$('#facSegment')?.value||'';
if($('#orgV92ListTitle'))$('#orgV92ListTitle').textContent=[st?orgV92StatusLabel(st):'TODAS AS ORGANIZAÇÕES',
seg].filter(Boolean).join(' • ');
if($('#facStats'))$('#facStats').textContent=`${rows.length} exibida(s) de ${all.length}`;

 const box=$('#facList');
if(!box)return;
if(!rows.length){box.innerHTML=vazioDeGroups();
return}
 const ordered=rows.slice().sort((a,b)=>String(a.__orgSegment).localeCompare(String(b.__orgSegment),'pt-BR')||String(a.group||'').localeCompare(String(b.group||''),'pt-BR',{numeric:true}));

 box.innerHTML=`<table class="org-v92-table"><thead><tr><th>GROUP</th><th>SEGMENTO</th><th>SITUAÇÃO</th><th>FACÇÃO / OCUPANTE</th><th>QG / FAVELA</th><th>LÍDER</th><th>DATA QUE ASSUMIU</th><th>STAFF</th><th></th></tr></thead><tbody>${ordered.map(f=>{const s=f.__orgStatus,hasCds=!!String(f.cds||'').trim();return `<tr data-org-v92-id="${esc(f.id||f.group)}"><td class="org-v92-group"><b>${esc(f.group||'—')}</b><small>${esc(f.numero?`Nº ${f.numero}`:'')}</small></td><td><span class="org-v92-segment">${esc(f.__orgSegment)}</span></td><td><span class="org-v92-status ${orgV92StatusClass(s)}">${orgV92StatusLabel(s)}</span>${s==='INDISPONIVEL'?'<small class="org-v92-reason">Ausência de QG ou Favela</small>':''}</td><td class="org-v92-faction">${s==='ASSUMIDA'?`<b>${esc(f.faccao)}</b><small>ocupação atual</small>`:'<span class="org-v92-empty">—</span>'}</td><td class="org-v92-location">${orgV92HasQG(f)?`<b>${esc(f.qg)}</b><small>${hasCds?'CDS cadastrada':'CDS pendente'}</small>`:'<span class="org-v92-empty">Sem QG/Favela</span>'}</td><td class="org-v92-person">${f.lider?`<b>${esc(f.lider)}</b>`:'<span class="org-v92-empty">—</span>'}</td><td>${f.dataEntrega?`<b>${esc(f.dataEntrega)}</b>`:'<span class="org-v92-empty">—</span>'}</td><td class="org-v92-person">${f.staff?esc(f.staff):'<span class="org-v92-empty">—</span>'}</td><td><div class="org-v92-row-actions">${orgV92ActionMarkup(f)}</div></td></tr>`}).join('')}</tbody></table>`;

 const audit=orgV92Audit(all);
box.insertAdjacentHTML('afterend',`<div id="orgV92Audit" class="org-v92-audit"><div class="org-v92-audit-head"><b>QUALIDADE CADASTRAL</b><span>Alertas administrativos — não alteram o status operacional</span></div><div class="org-v92-audit-items"><span class="${audit.duplicate?'danger':''}">${audit.duplicate} Group(s) duplicado(s)</span><span class="${audit.assumedNoDate?'warn':''}">${audit.assumedNoDate} assumida(s) sem data</span><span class="${audit.assumedNoLeader?'warn':''}">${audit.assumedNoLeader} assumida(s) sem líder</span><span class="${audit.assumedNoCds?'warn':''}">${audit.assumedNoCds} assumida(s) sem CDS</span><span class="${audit.availableNoCds?'warn':''}">${audit.availableNoCds} disponível(is) sem CDS</span></div></div>`);

 document.querySelectorAll('#orgV92Audit').forEach((el,i)=>{if(i<document.querySelectorAll('#orgV92Audit').length-1)el.remove()});

 box.querySelectorAll('tbody tr').forEach(r=>r.onclick=e=>{if(e.target.closest('button'))return;openFac(r.dataset.orgV92Id)});
box.querySelectorAll('.org-v92-open').forEach(b=>b.onclick=e=>{e.stopPropagation();openFac(b.dataset.id)});
box.querySelectorAll('.org-v92-request').forEach(b=>b.onclick=e=>{e.stopPropagation();openRequestModal('',b.dataset.group)});
box.querySelectorAll('.org-v92-deliver').forEach(b=>b.onclick=e=>{e.stopPropagation();openNewDelivery(b.dataset.group)});

}
function orgV92ReportRows(type='GERAL'){const all=orgV92Rows();
return type==='GERAL'?all:all.filter(f=>f.__orgStatus===type)}
function orgV92ReportTitle(type='GERAL'){return type==='ASSUMIDA'?'ORGANIZAÇÕES ASSUMIDAS':type==='DISPONIVEL'?'ORGANIZAÇÕES DISPONÍVEIS':type==='INDISPONIVEL'?'ORGANIZAÇÕES INDISPONÍVEIS':'RELATÓRIO GERAL DE ORGANIZAÇÕES'}
function orgV92OpenReport(){
 const type=$('#orgV92ReportType')?.value||'GERAL',
rows=orgV92ReportRows(type).sort((a,b)=>String(a.__orgSegment).localeCompare(String(b.__orgSegment),'pt-BR')||String(a.group).localeCompare(String(b.group),'pt-BR',{numeric:true})),
now=new Date(),
c=s=>orgV92Rows().filter(f=>f.__orgStatus===s).length;

 const html=`<!doctype html><html><head><meta charset="utf-8"><title>${orgV92ReportTitle(type)}</title><style>@page{size:A4 landscape;margin:10mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#241c28;margin:0;font-size:10px}header{border-bottom:4px solid #6f2e8f;padding-bottom:12px;margin-bottom:13px}.kicker{font-size:9px;letter-spacing:1.7px;color:#713f86;font-weight:700}h1{font-size:22px;margin:4px 0}.muted{color:#776d7b}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:12px}.kpi{border:1px solid #ddd4e1;border-radius:8px;padding:9px}.kpi b{display:block;font-size:18px}.kpi small{color:#786d7c}table{width:100%;border-collapse:collapse}th{background:#302537;color:#fff;text-align:left;padding:6px;font-size:8px}td{padding:6px;border-bottom:1px solid #e7e1e9;vertical-align:top}.status{font-weight:bold}.ASSUMIDA{color:#0d7b45}.DISPONIVEL{color:#7d319f}.INDISPONIVEL{color:#b5293a}.reason{font-size:8px;color:#a5434e}.footer{margin-top:12px;color:#817683;font-size:8px;border-top:1px solid #ddd;padding-top:6px}.no-print{position:fixed;right:16px;top:16px;background:#5d2876;color:#fff;border:0;border-radius:7px;padding:8px 12px;font-weight:bold;cursor:pointer}@media print{.no-print{display:none}}</style></head><body><button class="no-print" onclick="window.print()">IMPRIMIR / SALVAR PDF</button><header><div class="kicker">HIGH OS • CENTRAL DE ORGANIZAÇÕES</div><h1>${orgV92ReportTitle(type)}</h1><div class="muted">Gerado em ${now.toLocaleString('pt-BR')} • Status calculado pela ocupação atual e existência de QG/Favela.</div></header><div class="kpis"><div class="kpi"><span>Total</span><b>${orgV92Rows().length}</b><small>Groups</small></div><div class="kpi"><span>Assumidas</span><b>${c('ASSUMIDA')}</b><small>com ocupante</small></div><div class="kpi"><span>Disponíveis</span><b>${c('DISPONIVEL')}</b><small>livres com QG/Favela</small></div><div class="kpi"><span>Indisponíveis</span><b>${c('INDISPONIVEL')}</b><small>sem QG/Favela</small></div></div><table><thead><tr><th>#</th><th>GROUP</th><th>SEGMENTO</th><th>STATUS</th><th>FACÇÃO</th><th>QG / FAVELA</th><th>LÍDER</th><th>DATA QUE ASSUMIU</th><th>STAFF</th></tr></thead><tbody>${rows.map((f,i)=>`<tr><td>${i+1}</td><td><b>${esc(f.group||'—')}</b></td><td>${esc(f.__orgSegment)}</td><td class="status ${f.__orgStatus}">${orgV92StatusLabel(f.__orgStatus)}${f.__orgStatus==='INDISPONIVEL'?'<div class="reason">Ausência de QG ou Favela</div>':''}</td><td>${esc(f.faccao||'—')}</td><td>${esc(f.qg||'—')}</td><td>${esc(f.lider||'—')}</td><td>${esc(f.dataEntrega||'—')}</td><td>${esc(f.staff||'—')}</td></tr>`).join('')}</tbody></table><div class="footer">Fonte administrativa: base de Groups / Documento das Facções sincronizada com o High OS. “Indisponível” significa ausência de QG ou Favela; alertas de CDS, líder e data são pendências cadastrais separadas.</div></body></html>`;

 const w=window.open('','_blank');
if(!w)return alert('O navegador bloqueou a abertura do relatório. Libere pop-ups para o High OS.');
w.document.open();
w.document.write(html);
w.document.close();

}
$('#orgV92ReportBtn')?.addEventListener('click',orgV92OpenReport);

['facSearch',
'facSegment',
'facStatus'].forEach(id=>{const el=$('#'+id);if(!el)return;el.addEventListener(id==='facSearch'?'input':'change',()=>setTimeout(renderFaccoes,0))});

setTimeout(()=>{if($('#page-faccoes'))renderFaccoes()},0);

/* ===== HIGH OS V14.2 · ORGANIZAÇÕES REDESENHADAS =====
   - Lista enxuta: Group, Facção (+ líder), QG/Favela, Frequência, Situação e Ações.
     Staff e data de entrega saem da tabela (continuam no Perfil e na exportação).
   - Frequência no próprio painel: pico diário de cada facção no período escolhido,
     com minigráfico por linha, mapa de frequência e gráfico detalhado por facção.
   - Ordenação (segmento, situação, pico, média, presença, facção, mais recentes).
   - Exportação CSV (organizações, frequência diária, resumo) + relatório para imprimir.
   A métrica usada é a já ATRIBUÍDA à facção (metricas-motor.js): segue a facção
   quando ela troca de Group. */
const ORG15_METRICAS=()=>metricas;
const ORG15_REVISAR=all=>{try{return inconsistenciasV14().length}catch(_){return all.filter(f=>f.__orgStatus==='REVISAR').length}};
const org15GK=x=>alvesNorm(x).replace(/[^a-z0-9]/g,'').replace(/mecanic/g,'mechanic').replace(/0*(\d+)$/,'$1');
const ORG15_KEY='highos.org15';
const org15=(()=>{let s={};try{s=JSON.parse(localStorage.getItem(ORG15_KEY)||'{}')||{}}catch(_){s={}}
 return {view:s.view==='mapa'?'mapa':'lista',sort:s.sort||'segmento',periodo:s.periodo||'14'}})();
function org15Save(){try{localStorage.setItem(ORG15_KEY,JSON.stringify({view:org15.view,sort:org15.sort,periodo:org15.periodo}))}catch(_){}}

const ORG15_PERIODOS=[['7','7 dias'],['14','14 dias'],['30','30 dias'],['mes','Este mês'],['mesant','Mês passado']];
const ORG15_ORDENS=[['segmento','Segmento › Group'],['situacao','Situação'],['pico','Maior pico'],['media','Maior média'],['presenca','Mais presente'],['ausencia','Menos presente'],['faccao','Facção A–Z'],['recente','Assumidas por último']];

function org15Range(p=org15.periodo){
 const now=new Date(),d0=new Date(now.getFullYear(),now.getMonth(),now.getDate());
 if(p==='mes')return {ini:new Date(d0.getFullYear(),d0.getMonth(),1),fim:d0,rotulo:'este mês'};
 if(p==='mesant')return {ini:new Date(d0.getFullYear(),d0.getMonth()-1,1),fim:new Date(d0.getFullYear(),d0.getMonth(),0),rotulo:'mês passado'};
 const n=Math.max(1,parseInt(p,10)||14);
 return {ini:new Date(d0.getFullYear(),d0.getMonth(),d0.getDate()-(n-1)),fim:d0,rotulo:`últimos ${n} dias`};
}
function org15Dias(r=org15Range()){const out=[];for(let d=new Date(r.ini);d<=r.fim;d=new Date(d.getFullYear(),d.getMonth(),d.getDate()+1))out.push(d);return out}
const org15DiaKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const org15DiaBr=d=>d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});
const org15Num=(v,c=1)=>v===null||v===undefined||!Number.isFinite(v)?'—':(Number.isInteger(v)?String(v):v.toFixed(c).replace('.',','));
function org15SlotMin(k=''){const m=String(k).toUpperCase().match(/^(\d{1,2})(?::(\d{2}))?H?$/);return m?(+m[1])*60+(+(m[2]||0)):9999}
function org15DataMs(v){
 const s=String(v||'').trim();if(!s)return NaN;
 const br=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);if(br){let y=+br[3];if(y<100)y+=2000;return new Date(y,+br[2]-1,+br[1]).getTime()}
 return Date.parse(s);
}

/* Índice Group → dia → {slots, pico, media, coletas}, só dentro do período. */
function org15Indice(r=org15Range()){
 const ini=r.ini.getTime(),fim=r.fim.getTime()+86399999,idx=new Map();
 (ORG15_METRICAS()||[]).forEach(m=>{
  if(!m||m.__exFaccao)return;
  const g=String(m.group||m.organizacao||'').trim();if(!g)return;
  const d=metricDateValue(m),t=d&&d.getTime?d.getTime():NaN;
  if(!Number.isFinite(t)||t<ini||t>fim)return;
  const slots=metricSlots(m);if(!Object.keys(slots).length)return;
  const gk=org15GK(g),dk=org15DiaKey(d);
  if(!idx.has(gk))idx.set(gk,new Map());
  const dias=idx.get(gk),prev=dias.get(dk),merged={...(prev?prev.slots:{}),...slots};
  const v=Object.values(merged).map(Number).filter(Number.isFinite);if(!v.length)return;
  dias.set(dk,{slots:merged,pico:Math.max(...v),media:v.reduce((a,b)=>a+b,0)/v.length,coletas:v.length});
 });
 return idx;
}
function org15Resumo(f,idx,dias){
 const m=idx.get(org15GK(f.group))||new Map();
 const serie=dias.map(d=>{const x=m.get(org15DiaKey(d));return x?x.pico:null});
 const vals=serie.filter(v=>v!==null),pres=vals.filter(v=>v>0).length;
 let ultima=null;for(let i=dias.length-1;i>=0;i--){if(serie[i]>0){ultima=dias[i];break}}
 return {serie,mapa:m,pico:vals.length?Math.max(...vals):null,media:vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null,
  presentes:pres,comDados:vals.length,total:dias.length,presenca:dias.length?pres/dias.length:0,ultima};
}

/* ---------- filtros / ordenação ---------- */
function org15Ordenar(rows,res){
 const peso={ASSUMIDA:0,REVISAR:1,DISPONIVEL:2,INDISPONIVEL:3};
 const base=(a,b)=>String(a.__orgSegment).localeCompare(String(b.__orgSegment),'pt-BR')||String(a.group||'').localeCompare(String(b.group||''),'pt-BR',{numeric:true});
 const val=(f,k)=>{const r=res.get(f);return f.__orgStatus==='ASSUMIDA'&&r&&r[k]!==null&&r[k]!==undefined?r[k]:null};
 const met=(k,dir=-1)=>(a,b)=>{const va=val(a,k),vb=val(b,k);
  if(va===null&&vb===null)return base(a,b);if(va===null)return 1;if(vb===null)return -1;
  return (dir<0?vb-va:va-vb)||base(a,b)};
 const s=org15.sort;
 const cmp=s==='situacao'?(a,b)=>(peso[a.__orgStatus]??9)-(peso[b.__orgStatus]??9)||base(a,b)
  :s==='pico'?met('pico'):s==='media'?met('media'):s==='presenca'?met('presenca'):s==='ausencia'?met('presenca',1)
  :s==='faccao'?(a,b)=>{const fa=a.__orgStatus==='ASSUMIDA'?String(a.faccao||''):'',fb=b.__orgStatus==='ASSUMIDA'?String(b.faccao||''):'';if(!fa&&fb)return 1;if(fa&&!fb)return -1;return fa.localeCompare(fb,'pt-BR')||base(a,b)}
  :s==='recente'?(a,b)=>{const ta=a.__orgStatus==='ASSUMIDA'?org15DataMs(a.dataEntrega):NaN,tb=b.__orgStatus==='ASSUMIDA'?org15DataMs(b.dataEntrega):NaN;if(!Number.isFinite(ta)&&!Number.isFinite(tb))return base(a,b);if(!Number.isFinite(ta))return 1;if(!Number.isFinite(tb))return -1;return tb-ta||base(a,b)}
  :base;
 return rows.slice().sort(cmp);
}

/* ---------- desenho ---------- */
function org15Spark(serie,max){
 const n=serie.length||1,w=Math.max(60,Math.min(150,n*6)),h=26,bw=w/n,top=max>0?max:1;
 const bars=serie.map((v,i)=>{const x=(i*bw).toFixed(1),bwp=Math.max(1,bw-1.4).toFixed(1);
  if(v===null)return `<rect x="${x}" y="${h-2}" width="${bwp}" height="2" class="nd"/>`;
  const bh=v>0?Math.max(3,v/top*(h-2)):2;return `<rect x="${x}" y="${(h-bh).toFixed(1)}" width="${bwp}" height="${bh.toFixed(1)}" class="${v>0?'ok':'zero'}"/>`}).join('');
 return `<svg class="org15-spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="none" aria-hidden="true">${bars}</svg>`;
}
function org15FreqCell(f,r,max){
 if(f.__orgStatus!=='ASSUMIDA')return '<span class="org15-muted">—</span>';
 if(!r||!r.comDados)return `<button type="button" class="org15-freq empty" data-org15-freq="${esc(f.id||f.group)}"><span>Sem coleta no período</span></button>`;
 const pct=Math.round(r.presenca*100),cls=pct>=70?'good':pct>=40?'mid':'low';
 return `<button type="button" class="org15-freq" data-org15-freq="${esc(f.id||f.group)}" title="Ver gráfico diário">${org15Spark(r.serie,max)}<span class="org15-freq-nums"><b>${org15Num(r.pico)}</b><small>pico</small><b>${org15Num(r.media)}</b><small>média</small><b class="${cls}">${r.presentes}/${r.total}</b><small>dias</small></span></button>`;
}
function org15Acoes(f){
 const s=f.__orgStatus,id=esc(f.id||f.group),group=esc(f.group||'');
 const perfil=`<button type="button" class="org15-btn ghost org-v92-open" data-id="${id}">PERFIL</button>`;
 if(s==='ASSUMIDA')return perfil+`<button type="button" class="org15-btn org-v92-request" data-group="${group}">SOLICITAÇÃO</button>`;
 if(s==='DISPONIVEL')return perfil+`<button type="button" class="org15-btn primary org-v92-deliver" data-group="${group}">ASSUMIR</button>`;
 return perfil+`<button type="button" class="org15-btn org-v92-open" data-id="${id}">${s==='REVISAR'?'REVISAR':'CADASTRAR QG'}</button>`;
}
function org15Lista(rows,res,max,r){
 return `<table class="org15-table"><thead><tr><th class="c-group">GROUP</th><th class="c-fac">FACÇÃO</th><th class="c-qg">QG / FAVELA</th><th class="c-freq">FREQUÊNCIA <small>${esc(r.rotulo)}</small></th><th class="c-st">SITUAÇÃO</th><th class="c-act"></th></tr></thead><tbody>${rows.map(f=>{
  const s=f.__orgStatus,hasCds=!!String(f.cds||'').trim();
  return `<tr data-org-v92-id="${esc(f.id||f.group)}" class="st-${orgV92StatusClass(s)}">
<td class="c-group"><b>${esc(f.group||'—')}</b><small>${esc(f.__orgSegment)}</small></td>
<td class="c-fac">${s==='ASSUMIDA'?`<b>${esc(f.faccao)}</b>${f.lider?`<small>Líder: ${esc(f.lider)}</small>`:'<small class="warn">Líder não informado</small>'}`:`<span class="org15-muted">${s==='DISPONIVEL'?'Livre para assumir':'—'}</span>`}</td>
<td class="c-qg">${orgV92HasQG(f)?`<b>${esc(f.qg)}</b><small class="${hasCds?'':'warn'}">${hasCds?'CDS cadastrada':'CDS pendente'}</small>`:'<span class="org15-muted">Sem QG/Favela</span>'}</td>
<td class="c-freq">${org15FreqCell(f,res.get(f),max)}</td>
<td class="c-st"><span class="org-v92-status ${orgV92StatusClass(s)}">${orgV92StatusLabel(s)}</span></td>
<td class="c-act"><div class="org15-actions">${org15Acoes(f)}</div></td></tr>`}).join('')}</tbody></table>`;
}
function org15Mapa(rows,res,dias,max){
 const ass=rows.filter(f=>f.__orgStatus==='ASSUMIDA');
 if(!ass.length)return '<div class="placeholder"><b>▦</b><h3>NENHUMA FACÇÃO ASSUMIDA NESTE FILTRO</h3><p>O mapa de frequência mostra apenas Groups com facção ocupante.</p></div>';
 const top=max>0?max:1,hoje=org15DiaKey(new Date());
 const cab=dias.map(d=>`<th class="${org15DiaKey(d)===hoje?'today':''} ${[0,6].includes(d.getDay())?'wknd':''}" title="${d.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'2-digit'})}"><span>${String(d.getDate()).padStart(2,'0')}</span><small>${'DSTQQSS'[d.getDay()]}</small></th>`).join('');
 const linhas=ass.map(f=>{const r=res.get(f)||{serie:dias.map(()=>null),mapa:new Map()};
  const cells=dias.map((d,i)=>{const v=r.serie[i];if(v===null)return '<td class="nd" title="Sem coleta"></td>';
   const x=r.mapa.get(org15DiaKey(d)),a=v>0?(.16+.84*Math.min(1,v/top)).toFixed(2):0;
   const slots=x?Object.entries(x.slots).sort((p,q)=>org15SlotMin(p[0])-org15SlotMin(q[0])).map(([k,n])=>`${k}: ${n}`).join(' · '):'';
   return `<td class="${v>0?'v':'z'}" style="--a:${a}" title="${esc(f.faccao)} — ${org15DiaBr(d)}\nPico ${v}${slots?`\n${slots}`:''}">${v}</td>`}).join('');
  const pct=Math.round((r.presenca||0)*100);
  return `<tr><th class="name"><button type="button" data-org15-freq="${esc(f.id||f.group)}"><b>${esc(f.faccao)}</b><small>${esc(f.group)} · ${esc(f.__orgSegment)}</small></button></th>${cells}<td class="sum">${org15Num(r.pico)}</td><td class="sum">${org15Num(r.media)}</td><td class="sum ${pct>=70?'good':pct>=40?'mid':'low'}">${r.presentes||0}/${dias.length}</td></tr>`}).join('');
 return `<div class="org15-heat-wrap"><table class="org15-heat"><thead><tr><th class="name">FACÇÃO</th>${cab}<th class="sum">PICO</th><th class="sum">MÉDIA</th><th class="sum">DIAS</th></tr></thead><tbody>${linhas}</tbody></table></div>
<div class="org15-heat-legend"><span>Cada célula = pico de players no dia (maior coleta).</span><span class="scale"><i style="--a:.16"></i><i style="--a:.45"></i><i style="--a:.75"></i><i style="--a:1"></i> mais players</span><span><i class="z"></i> zero</span><span><i class="nd"></i> sem coleta</span></div>`;
}

/* ---------- gráfico detalhado da facção ---------- */
function org15Grafico(dias,r){
 const W=780,H=250,L=36,R=12,T=14,B=34,iw=W-L-R,ih=H-T-B,n=dias.length||1,bw=iw/n;
 const max=Math.max(1,...r.serie.filter(v=>v!==null));
 const passo=max<=5?1:max<=10?2:max<=25?5:max<=50?10:max<=100?20:50,topo=Math.ceil(max/passo)*passo;
 const y=v=>T+ih-(v/topo)*ih;
 let g='';for(let v=0;v<=topo;v+=passo)g+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${L-6}" y="${y(v)+3}" class="ax" text-anchor="end">${v}</text>`;
 const salto=n>20?Math.ceil(n/15):1;
 const bars=r.serie.map((v,i)=>{const x=L+i*bw+bw*.14,w=Math.max(2,bw*.72),d=dias[i];
  const lab=((n-1-i)%salto===0)?`<text x="${L+i*bw+bw/2}" y="${H-B+14}" class="ax" text-anchor="middle">${org15DiaBr(d)}</text>`:'';
  if(v===null)return `<rect x="${x}" y="${T+ih-2}" width="${w}" height="2" class="nd"><title>${org15DiaBr(d)} — sem coleta</title></rect>${lab}`;
  const x2=r.mapa.get(org15DiaKey(d));const det=x2?Object.entries(x2.slots).sort((p,q)=>org15SlotMin(p[0])-org15SlotMin(q[0])).map(([k,q])=>`${k}: ${q}`).join(' · '):'';
  const h=Math.max(v>0?3:2,(v/topo)*ih);
  return `<rect x="${x}" y="${T+ih-h}" width="${w}" height="${h}" rx="2" class="${v>0?'ok':'zero'}"><title>${org15DiaBr(d)} — pico ${v}${det?`\n${det}`:''}</title></rect>${v>0&&n<=31?`<text x="${x+w/2}" y="${T+ih-h-4}" class="val" text-anchor="middle">${v}</text>`:''}${lab}`}).join('');
 const media=r.media!==null?`<line x1="${L}" x2="${W-R}" y1="${y(r.media)}" y2="${y(r.media)}" class="avg"/><rect x="${L+4}" y="${T}" width="92" height="17" rx="8" class="avgbg"/><text x="${L+50}" y="${T+12}" class="avgt" text-anchor="middle">- - média ${org15Num(r.media)}</text>`:'';
 return `<svg class="org15-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Pico diário de players">${g}${bars}${media}</svg>`;
}
function org15Detalhe(id){
 const f=orgV92Rows().find(x=>String(x.id||x.group)===String(id));if(!f)return;
 const r0=org15Range(),dias=org15Dias(r0),idx=org15Indice(r0),r=org15Resumo(f,idx,dias);
 const slotKeys=[...new Set([...r.mapa.values()].flatMap(x=>Object.keys(x.slots)))].sort((a,b)=>org15SlotMin(a)-org15SlotMin(b));
 let box=document.getElementById('org15Drawer');
 if(!box){box=document.createElement('div');box.id='org15Drawer';box.className='modal hidden org15-drawer';document.body.appendChild(box);
  box.addEventListener('click',e=>{if(e.target===box||e.target.closest('[data-org15-close]'))box.classList.add('hidden')});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')box.classList.add('hidden')});}
 const pct=Math.round(r.presenca*100);
 const tabela=[...dias].reverse().map(d=>{const x=r.mapa.get(org15DiaKey(d));
  return `<tr class="${x?'':'nd'}"><td>${d.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'})}</td>${slotKeys.map(k=>`<td>${x&&x.slots[k]!==undefined?x.slots[k]:'—'}</td>`).join('')}<td><b>${x?x.pico:'—'}</b></td><td>${x?org15Num(x.media):'—'}</td></tr>`}).join('');
 box.innerHTML=`<div class="modal-card org15-drawer-card" role="dialog" aria-label="Frequência da facção">
<button type="button" class="modal-x" data-org15-close>×</button>
<div class="eyebrow">FREQUÊNCIA • ${esc(r0.rotulo.toUpperCase())}</div>
<h2>${esc(f.faccao||f.group)}</h2><p class="org15-sub">${esc(f.group)} · ${esc(f.__orgSegment)}${f.qg?` · ${esc(f.qg)}`:''}</p>
<div class="org15-drawer-periodo">${ORG15_PERIODOS.map(([v,l])=>`<button type="button" class="${org15.periodo===v?'active':''}" data-org15-dperiodo="${v}">${l}</button>`).join('')}</div>
<div class="org15-kpis"><div><span>PICO MÁXIMO</span><b>${org15Num(r.pico)}</b></div><div><span>MÉDIA DOS PICOS</span><b>${org15Num(r.media)}</b></div><div><span>DIAS PRESENTES</span><b>${r.presentes}/${r.total}</b><small>${pct}% do período</small></div><div><span>ÚLTIMA PRESENÇA</span><b>${r.ultima?org15DiaBr(r.ultima):'—'}</b></div></div>
${r.comDados?rh15BlocoGrafico(dias,{faccao:f.faccao||f.group,dias:r.mapa}):'<div class="placeholder"><b>◌</b><h3>SEM COLETAS NO PERÍODO</h3><p>Não há métrica registrada para esta facção no intervalo escolhido.</p></div>'}
${r.comDados?`<details class="org15-days"><summary>Coletas por dia (${r.comDados})</summary><div class="org15-days-wrap"><table><thead><tr><th>DIA</th>${slotKeys.map(k=>`<th>${esc(k)}</th>`).join('')}<th>PICO</th><th>MÉDIA</th></tr></thead><tbody>${tabela}</tbody></table></div></details>`:''}
<div class="org15-drawer-actions"><button type="button" class="btn-secondary" data-org15-csvone="${esc(f.id||f.group)}">EXPORTAR CSV</button><button type="button" class="btn-primary org-v92-open" data-id="${esc(f.id||f.group)}">ABRIR PERFIL</button></div></div>`;
 box.querySelectorAll('[data-org15-dperiodo]').forEach(b=>b.onclick=()=>{org15.periodo=b.dataset.org15Dperiodo;org15Save();renderFaccoes();org15Detalhe(id)});
 box.querySelector('[data-org15-csvone]')?.addEventListener('click',()=>org15ExportFreq([f]));
 box.querySelector('.org-v92-open')?.addEventListener('click',()=>{box.classList.add('hidden');openFac(f.id||f.group)});
 box.classList.remove('hidden');
}

/* ---------- exportação ---------- */
function org15Csv(nome,cab,linhas){
 const cel=v=>{const s=v===null||v===undefined?'':String(v);return /[;"\r\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s};
 const txt='﻿'+[cab,...linhas].map(l=>l.map(cel).join(';')).join('\r\n');
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'text/csv;charset=utf-8'}));a.download=nome;
 document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},800);
}
const org15Stamp=()=>{const d=new Date();return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`};
function org15ExportOrgs(){
 const rows=org15Ordenar(orgV92Filtered(),new Map());
 org15Csv(`organizacoes_${org15Stamp()}.csv`,['Group','Segmento','Situação','Facção','Líder','QG/Favela','CDS','Data que assumiu','Staff','Produto'],
  rows.map(f=>[f.group,f.__orgSegment,orgV92StatusLabel(f.__orgStatus),f.__orgStatus==='ASSUMIDA'?f.faccao:'',f.lider||'',f.qg||'',f.cds||'',f.dataEntrega||'',f.staff||'',f.produto||'']));
}
function org15ExportFreq(lista){
 const r0=org15Range(),dias=org15Dias(r0),idx=org15Indice(r0);
 const fs=(lista||orgV92Filtered()).filter(f=>f.__orgStatus==='ASSUMIDA');
 const slotKeys=[...new Set([...idx.values()].flatMap(m=>[...m.values()].flatMap(x=>Object.keys(x.slots))))].sort((a,b)=>org15SlotMin(a)-org15SlotMin(b));
 const linhas=[];
 fs.forEach(f=>{const m=idx.get(org15GK(f.group))||new Map();dias.forEach(d=>{const x=m.get(org15DiaKey(d));
  linhas.push([d.toLocaleDateString('pt-BR'),f.faccao,f.group,f.__orgSegment,...slotKeys.map(k=>x&&x.slots[k]!==undefined?x.slots[k]:''),x?x.pico:'',x?org15Num(x.media):'',x?x.coletas:0,x?(x.pico>0?'SIM':'NÃO'):'SEM COLETA'])})});
 const nome=lista&&lista.length===1?`frequencia_${alvesNorm(lista[0].faccao||lista[0].group)}_${org15Stamp()}.csv`:`frequencia_diaria_${org15Stamp()}.csv`;
 org15Csv(nome,['Data','Facção','Group','Segmento',...slotKeys,'Pico do dia','Média do dia','Coletas','Presente'],linhas);
}
function org15ExportResumo(){
 const r0=org15Range(),dias=org15Dias(r0),idx=org15Indice(r0);
 const fs=orgV92Filtered().filter(f=>f.__orgStatus==='ASSUMIDA'),res=new Map(fs.map(f=>[f,org15Resumo(f,idx,dias)]));
 org15Csv(`frequencia_resumo_${org15Stamp()}.csv`,['Facção','Group','Segmento','Líder','Período início','Período fim','Dias no período','Dias com coleta','Dias presentes','Presença %','Pico máximo','Média dos picos','Última presença','Data que assumiu'],
  org15Ordenar(fs,res).map(f=>{const r=res.get(f);return [f.faccao,f.group,f.__orgSegment,f.lider||'',r0.ini.toLocaleDateString('pt-BR'),r0.fim.toLocaleDateString('pt-BR'),r.total,r.comDados,r.presentes,Math.round(r.presenca*100),r.pico??'',r.media===null?'':org15Num(r.media),r.ultima?r.ultima.toLocaleDateString('pt-BR'):'',f.dataEntrega||'']}));
}
function org15ExportPdf(){
 const st=$('#facStatus')?.value||'',sel=$('#orgV92ReportType');
 if(sel)sel.value=['ASSUMIDA','DISPONIVEL','INDISPONIVEL'].includes(st)?st:'GERAL';
 orgV92OpenReport();
}

/* ---------- controles do topo (montados uma vez) ---------- */
function org15Controles(){
 const sort=$('#org15Sort'),per=$('#org15Period');
 if(sort&&!sort.dataset.ok){sort.innerHTML=ORG15_ORDENS.map(([v,l])=>`<option value="${v}">${l}</option>`).join('');sort.dataset.ok='1';sort.onchange=()=>{org15.sort=sort.value;org15Save();renderFaccoes()}}
 if(per&&!per.dataset.ok){per.innerHTML=ORG15_PERIODOS.map(([v,l])=>`<option value="${v}">${l}</option>`).join('');per.dataset.ok='1';per.onchange=()=>{org15.periodo=per.value;org15Save();renderFaccoes()}}
 if(sort)sort.value=org15.sort;if(per)per.value=org15.periodo;
 document.querySelectorAll('[data-org15-view]').forEach(b=>{b.classList.toggle('active',b.dataset.org15View===org15.view);b.setAttribute('aria-selected',b.dataset.org15View===org15.view?'true':'false');
  b.onclick=()=>{org15.view=b.dataset.org15View;org15Save();renderFaccoes()}});
 const ex=$('#org15Export');
 if(ex&&!ex.dataset.ok){ex.dataset.ok='1';
  ex.querySelectorAll('[data-org15-export]').forEach(b=>b.onclick=()=>{ex.open=false;const t=b.dataset.org15Export;
   try{t==='orgs'?org15ExportOrgs():t==='freq'?org15ExportFreq():t==='resumo'?org15ExportResumo():org15ExportPdf()}catch(e){alert('Não foi possível exportar: '+(e?.message||e))}});
  document.addEventListener('click',e=>{if(ex.open&&!e.target.closest('#org15Export'))ex.open=false});
 }
}

renderFaccoes=function(){
 const all=orgV92Rows(),rows=orgV92Filtered();
 org15Controles();renderFacActivityButtons();renderFacSegmentChips();
 const c=s=>all.filter(f=>f.__orgStatus===s).length,revisar=ORG15_REVISAR(all);
 const summary=$('#orgV92Summary');
 if(summary){summary.innerHTML=`<span><b>${all.length}</b> Groups</span><span class="assumida"><b>${c('ASSUMIDA')}</b> assumidas</span><span class="disponivel"><b>${c('DISPONIVEL')}</b> disponíveis</span><span class="indisponivel"><b>${c('INDISPONIVEL')}</b> sem QG</span>${revisar?`<button type="button" class="revisar" data-revisar-ocupacao><b>${revisar}</b> a revisar →</button>`:''}`;
  summary.querySelector('[data-revisar-ocupacao]')?.addEventListener('click',()=>abrirRevisao(painelDepsV14()));}
 document.querySelectorAll('#facStatusButtons [data-value]').forEach(b=>{const v=b.dataset.value||'';const n=v?c(v):all.length;let i=b.querySelector('.chip-contagem');if(!i){i=document.createElement('i');i.className='chip-contagem';b.appendChild(i)}i.textContent=String(n)});

 const r0=org15Range(),dias=org15Dias(r0),idx=org15Indice(r0);
 const res=new Map(rows.map(f=>[f,f.__orgStatus==='ASSUMIDA'?org15Resumo(f,idx,dias):null]));
 const max=Math.max(0,...[...res.values()].filter(Boolean).map(r=>r.pico||0));
 const st=$('#facStatus')?.value||'',seg=$('#facSegment')?.value||'',filtro=[st?orgV92StatusLabel(st):'',seg].filter(Boolean).join(' • ');
 if($('#orgV92ListTitle'))$('#orgV92ListTitle').textContent=filtro?`${filtro} — ${rows.length} de ${all.length}`:`${rows.length} organizações`;
 if($('#facStats'))$('#facStats').textContent=`Frequência: ${r0.rotulo} (${r0.ini.toLocaleDateString('pt-BR')} a ${r0.fim.toLocaleDateString('pt-BR')})${(ORG15_METRICAS()||[]).length?'':' · métricas ainda não carregadas'}`;

 const box=$('#facList');if(!box)return;
 document.querySelectorAll('#orgV92Audit').forEach(el=>el.remove());
 if(!rows.length){box.innerHTML=vazioDeGroups();return}
 const ordered=org15Ordenar(rows,res);
 box.innerHTML=org15.view==='mapa'?org15Mapa(ordered,res,dias,max):org15Lista(ordered,res,max,r0);

 const audit=orgV92Audit(all),alertas=[[audit.duplicate,'Group(s) duplicado(s)','danger'],[audit.assumedNoDate,'assumida(s) sem data','warn'],[audit.assumedNoLeader,'assumida(s) sem líder','warn'],[audit.assumedNoCds,'assumida(s) sem CDS','warn'],[audit.availableNoCds,'disponível(is) sem CDS','warn']].filter(a=>a[0]);
 if(alertas.length)box.insertAdjacentHTML('afterend',`<div id="orgV92Audit" class="org15-audit"><b>QUALIDADE CADASTRAL</b>${alertas.map(([n,t,k])=>`<span class="${k}">${n} ${t}</span>`).join('')}</div>`);

 box.querySelectorAll('tbody tr[data-org-v92-id]').forEach(r=>r.onclick=e=>{if(e.target.closest('button'))return;openFac(r.dataset.orgV92Id)});
 box.querySelectorAll('.org-v92-open').forEach(b=>b.onclick=e=>{e.stopPropagation();openFac(b.dataset.id)});
 box.querySelectorAll('.org-v92-request').forEach(b=>b.onclick=e=>{e.stopPropagation();openRequestModal('',b.dataset.group)});
 box.querySelectorAll('.org-v92-deliver').forEach(b=>b.onclick=e=>{e.stopPropagation();openNewDelivery(b.dataset.group)});
 box.querySelectorAll('[data-org15-freq]').forEach(b=>b.onclick=e=>{e.stopPropagation();org15Detalhe(b.dataset.org15Freq)});
};
/* métricas chegam depois dos Groups: redesenha a página aberta quando elas carregam */
{const _rmOrg15=renderMetrics;renderMetrics=function(...a){const out=_rmOrg15.apply(this,a);try{if($('#page-faccoes')?.classList.contains('active'))renderFaccoes()}catch(_){}return out}}
document.querySelectorAll('.nav-item[data-page="faccoes"]').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>{try{renderFaccoes()}catch(_){}},0)));
setTimeout(()=>{if($('#page-faccoes'))renderFaccoes()},0);

/* ===== HIGH OS V14.3 · CENTRAL RH DE MÉTRICAS =====
   A página de Métricas passa a ser o instrumento estatístico do RH:
   PAINEL · RANKING · PICOS DIÁRIOS · FACÇÃO · RELATÓRIOS · AVANÇADO (telas antigas).
   - Usa as métricas já ATRIBUÍDAS à facção (metricas-motor.js): a coleta segue a
     facção que ocupava o Group no horário, inclusive quem saiu no meio do mês.
   - Pico diário = maior coleta do dia (14H/16H/21H/23H ou outros horários lançados).
   - Toda estatística compara com o período anterior de mesmo tamanho. */
const RH15_METRICAS=()=>metricas;
const RH15_FACCOES=()=>faccoes;
const ocupadoRH15=f=>ocupadoV14(f);
const RH15_KEY='highos.rh15';
const rh15LS={get(k,d){try{const v=JSON.parse(localStorage.getItem(k)||'null');return v===null||v===undefined?d:v}catch(_){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}}};
const rh15={...{tab:'painel',per:'mes:atual',ini:'',fim:'',seg:'',q:'',heatSlot:'pico',fac:'',ord:'media',metaMin:15,metaMax:20,rep:{agrupar:'grafico',ex:true,fac:''}},...rh15LS.get(RH15_KEY,{})};
rh15.semOff=0;
if(rh15.tab==='pagamentos')rh15.tab='ranking';
if(rh15.ord==='presenca')rh15.ord='aprov';
/* meta de pico da facção: o aproveitamento é o pico em relação ao topo da meta */
const rh15Meta=()=>{const a=Math.max(1,+rh15.metaMin||15),b=Math.max(a,+rh15.metaMax||20);return {min:a,max:b}};
const rh15MetaTxt=()=>{const m=rh15Meta();return m.min===m.max?`${m.max}`:`${m.min} a ${m.max}`};
rh15.rep={agrupar:'grafico',ex:true,fac:'',...(rh15.rep||{})};
if(!rh15.v144){rh15.rep.agrupar='grafico';rh15.v144=1}
const rh15Salvar=()=>rh15LS.set(RH15_KEY,{tab:rh15.tab,per:rh15.per,ini:rh15.ini,fim:rh15.fim,seg:rh15.seg,heatSlot:rh15.heatSlot,fac:rh15.fac,ord:rh15.ord,v144:rh15.v144,painelFac:rh15.painelFac,metaMin:rh15.metaMin,metaMax:rh15.metaMax,txtGroup:rh15.txtGroup,rep:rh15.rep});

/* ---------- utilidades ---------- */
const rh15K=s=>alvesNorm(s).replace(/[^a-z0-9]/g,'');
const rh15DK=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const rh15Br=d=>d.toLocaleDateString('pt-BR');
const rh15Dm=d=>d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});
const rh15N=(v,c=1)=>v===null||v===undefined||!Number.isFinite(+v)?'—':(Number.isInteger(+v)?String(+v):(+v).toFixed(c).replace('.',','));
const rh15Pct=v=>v===null||v===undefined||!Number.isFinite(v)?'—':`${Math.round(v*100)}%`;
const rh15SlotMin=k=>{const m=String(k).toUpperCase().match(/^(\d{1,2})(?::(\d{2}))?H?$/);return m?(+m[1])*60+(+(m[2]||0)):9999};
const rh15MesRot=k=>{const m=String(k).match(/^(\d{4})-(\d{2})$/);if(!m)return k;return new Date(+m[1],+m[2]-1,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'}).replace(/^./,c=>c.toUpperCase())};
const rh15Hoje=()=>{const n=new Date();return new Date(n.getFullYear(),n.getMonth(),n.getDate())};
const rh15Iso=s=>{const m=String(s||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?new Date(+m[1],+m[2]-1,+m[3]):null};
/* variação percentual atual × anterior, já formatada com seta */
function rh15Var(atual,ant,{base=5}={}){
 if(atual===null||ant===null||atual===undefined||ant===undefined||!Number.isFinite(atual)||!Number.isFinite(ant))return '<span class="rh15-var na">—</span>';
 const d=atual-ant,cls=Math.abs(d)<0.05?'flat':d>0?'up':'down',seta=cls==='flat'?'■':d>0?'▲':'▼';
 /* base pequena (ex.: 0,4 → 6,7) gera porcentagem absurda: aí mostra a diferença absoluta */
 if(ant<base||ant===0)return `<span class="rh15-var ${cls}" title="Período anterior: ${rh15N(ant)} · base pequena, mostrando a diferença">${seta} ${d>0?'+':d<0?'−':''}${rh15N(Math.abs(d))}</span>`;
 const pc=d/ant*100;
 return `<span class="rh15-var ${Math.abs(pc)<5?'flat':cls}" title="Período anterior: ${rh15N(ant)} · diferença ${d>0?'+':''}${rh15N(d)}">${Math.abs(pc)<0.5?'■':seta} ${Math.abs(pc).toFixed(0)}%</span>`;
}
const rh15VarTxt=(a,b)=>{if(a===null||b===null||a===undefined||b===undefined||!Number.isFinite(a)||!Number.isFinite(b))return '';const d=a-b;return b<5?`${d>=0?'+':''}${rh15N(d)}`:`${d>=0?'+':''}${(d/b*100).toFixed(0)}%`};

function rh15Meses(){
 const set=new Set();(RH15_METRICAS()||[]).forEach(m=>{const d=metricDateValue(m);if(d&&d.getTime&&d.getTime()>0)set.add(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`)});
 const h=rh15Hoje();set.add(`${h.getFullYear()}-${String(h.getMonth()+1).padStart(2,'0')}`);
 return [...set].sort().reverse();
}
function rh15Range(){
 const h=rh15Hoje(),p=String(rh15.per||'mes:atual');
 if(p.startsWith('dias:')){const n=Math.max(1,+p.slice(5)||7);return {ini:new Date(h.getFullYear(),h.getMonth(),h.getDate()-(n-1)),fim:h,fimReal:h,rotulo:`Últimos ${n} dias`,mes:false}}
 if(p==='intervalo'){const a=rh15Iso(rh15.ini)||new Date(h.getFullYear(),h.getMonth(),1),b=rh15Iso(rh15.fim)||h;const ini=a<=b?a:b,fim=a<=b?b:a;return {ini,fim:fim>h?h:fim,fimReal:fim,rotulo:`${rh15Br(ini)} a ${rh15Br(fim)}`,mes:false}}
 let key=p.slice(4);if(!/^\d{4}-\d{2}$/.test(key))key=`${h.getFullYear()}-${String(h.getMonth()+1).padStart(2,'0')}`;
 const [y,mo]=key.split('-').map(Number),ini=new Date(y,mo-1,1),fimMes=new Date(y,mo,0);
 return {ini,fim:fimMes>h?h:fimMes,fimReal:fimMes,rotulo:rh15MesRot(key)+(fimMes>h?' (parcial)':''),mes:key};
}
/* período anterior com o mesmo número de dias (mês: mesmos dias do mês anterior) */
function rh15RangeAnterior(r){
 const n=Math.round((r.fim-r.ini)/864e5)+1;
 if(r.mes){const ini=new Date(r.ini.getFullYear(),r.ini.getMonth()-1,1),ult=new Date(r.ini.getFullYear(),r.ini.getMonth(),0);const fim=new Date(ini.getFullYear(),ini.getMonth(),Math.min(n,ult.getDate()));return {ini,fim,fimReal:fim,rotulo:rh15MesRot(`${ini.getFullYear()}-${String(ini.getMonth()+1).padStart(2,'0')}`)+(n<ult.getDate()?` (até dia ${n})`:'')}}
 const fim=new Date(r.ini.getFullYear(),r.ini.getMonth(),r.ini.getDate()-1),ini=new Date(fim.getFullYear(),fim.getMonth(),fim.getDate()-(n-1));
 return {ini,fim,fimReal:fim,rotulo:`${rh15Br(ini)} a ${rh15Br(fim)}`};
}
function rh15Dias(r){const out=[];if(r.fim<r.ini)return out;for(let d=new Date(r.ini);d<=r.fim;d=new Date(d.getFullYear(),d.getMonth(),d.getDate()+1))out.push(d);return out}

/* ---------- base de dados do período ---------- */
function rh15Coletar(r,comAtuais){
 const dias=rh15Dias(r),ini=r.ini.getTime(),fim=r.fim.getTime()+86399999;
 const atuais=new Map();(RH15_FACCOES()||[]).filter(f=>f&&!f.removido).forEach(f=>atuais.set(org15GK(f.group),f));
 const ent=new Map(),slotSet=new Set();
 const pegar=(faccao,group,seg,ex)=>{const k=ex?'ex|'+rh15K(faccao)+'|'+org15GK(group):org15GK(group);
  if(!ent.has(k))ent.set(k,{k,faccao,group,segmento:seg||'OUTROS',ex:!!ex,dias:new Map()});
  const e=ent.get(k);if(!ex)e.ex=false;return e};
 (RH15_METRICAS()||[]).forEach(m=>{
  if(!m)return;const d=metricDateValue(m),t=d&&d.getTime?d.getTime():NaN;if(!Number.isFinite(t)||t<ini||t>fim)return;
  const slots=metricSlots(m),vals=Object.values(slots).map(Number).filter(Number.isFinite);if(!vals.length)return;
  const gRaw=String(m.group||m.organizacao||'').trim();if(!gRaw)return;
  const ex=!!m.__exFaccao,group=ex?String(m.groupOrigem||gRaw.split(' • ')[0]).trim():gRaw;
  const cur=atuais.get(org15GK(group));
  /* V15.6.2: identidade pelo GROUP; nome da facção sempre do cadastro atual */
  const faccao=String((!ex&&cur&&ocupadoRH15(cur)?cur.faccao:'')||m.faccaoSnapshot||m.faccaoHistorica||(ex?'':group)||'').trim();if(!faccao)return;
  const seg=String(m.segmentoSnapshot||cur?.segmento||orgV92Segment({group})||'OUTROS').trim().toUpperCase();
  const e=pegar(faccao,cur&&!ex?cur.group:group,seg,ex),dk=rh15DK(d),prev=e.dias.get(dk),merged={...(prev?prev.slots:{}),...slots};
  Object.keys(slots).forEach(s=>slotSet.add(s));
  const v=Object.values(merged).map(Number).filter(Number.isFinite);
  e.dias.set(dk,{slots:merged,pico:Math.max(...v),media:v.reduce((a,b)=>a+b,0)/v.length,coletas:v.length});
 });
 /* facções que ocupam Group hoje aparecem mesmo sem coleta, para a ausência ficar visível */
 if(comAtuais&&r.fimReal>=rh15Hoje())(RH15_FACCOES()||[]).filter(f=>f&&!f.removido&&ocupadoRH15(f)&&String(f.faccao||'').trim()).forEach(f=>pegar(String(f.faccao).trim(),f.group,String(f.segmento||orgV92Segment(f)||'OUTROS').toUpperCase(),false));
 const slotKeys=[...slotSet].sort((a,b)=>rh15SlotMin(a)-rh15SlotMin(b));
 return {dias,slotKeys,lista:[...ent.values()].map(e=>({...e,st:rh15Stats(e,dias,slotKeys)}))};
}
function rh15Base(){
 const r=rh15Range(),A=rh15Coletar(r,true),ra=rh15RangeAnterior(r),P=rh15Coletar(ra,false);
 const ant=new Map(P.lista.map(e=>[e.k,e]));
 A.lista.forEach(e=>{e.ant=ant.get(e.k)?.st||null});
 return {r,ra,dias:A.dias,slotKeys:A.slotKeys,lista:A.lista,anterior:P};
}
function rh15Stats(e,dias,slotKeys){
 const serie=dias.map(d=>{const x=e.dias.get(rh15DK(d));return x?x.pico:null});
 const vals=serie.filter(v=>v!==null);
 const porSlot={};slotKeys.forEach(s=>{const a=[];e.dias.forEach(x=>{if(Number.isFinite(+x.slots[s]))a.push(+x.slots[s])});porSlot[s]=a.length?a.reduce((p,q)=>p+q,0)/a.length:null});
 const forte=Object.entries(porSlot).filter(([,v])=>v!==null).sort((a,b)=>b[1]-a[1])[0];
 const todas=[];e.dias.forEach(x=>Object.values(x.slots).forEach(v=>{if(Number.isFinite(+v))todas.push(+v)}));
 let ultima=null;for(let i=dias.length-1;i>=0;i--){if(serie[i]>0){ultima=dias[i];break}}
 const media=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null;
 const dp=vals.length>1?Math.sqrt(vals.reduce((a,v)=>a+(v-media)**2,0)/vals.length):null;
 const ord=[...vals].sort((a,b)=>a-b),mediana=ord.length?(ord.length%2?ord[(ord.length-1)/2]:(ord[ord.length/2-1]+ord[ord.length/2])/2):null;
 /* dias seguidos sem players até o fim do período. Dia SEM COLETA (bot fora,
    hoje antes das 14h, antes de assumir o Group) não é dia sem players: é pulado. */
 let semPlayers=0;for(let i=serie.length-1;i>=0;i--){if(serie[i]===null)continue;if(serie[i]>0)break;semPlayers++}
 const presentes=vals.filter(v=>v>0).length,M=rh15Meta(),diasMeta=vals.filter(v=>v>=M.min).length;
 return {serie,total:dias.length,comDados:vals.length,presentes,presenca:dias.length?presentes/dias.length:0,diasMeta,aprov:media===null?null:media/M.max,
  pico:vals.length?Math.max(...vals):null,media,mediana,minimo:vals.length?Math.min(...vals):null,dp,
  regularidade:media&&dp!==null?Math.max(0,1-dp/media):null,soma:vals.reduce((a,b)=>a+b,0),
  mediaColetas:todas.length?todas.reduce((a,b)=>a+b,0)/todas.length:null,coletas:todas.length,porSlot,forte:forte?forte[0]:null,ultima,semPlayers};
}
function rh15Filtrar(lista,{ex=true}={}){
 const q=rh15K(rh15.q||'');
 return lista.filter(e=>(!rh15.seg||e.segmento===rh15.seg)&&(ex||!e.ex)&&(!q||rh15K(e.faccao+' '+e.group+' '+e.segmento).includes(q)));
}
const rh15Faixa=v=>{if(v===null||v===undefined||!Number.isFinite(v))return 'na';const M=rh15Meta();return v>=M.max?'top':v>=M.min?'ok':v>0?'low':'zero'};
const rh15AprovHtml=(a)=>a===null||a===undefined?'—':`<span class="rh15-meter ${a>=1?'top':a>=rh15Meta().min/rh15Meta().max?'ok':'low'}"><i style="width:${Math.min(100,Math.round(a*100))}%"></i></span><small>${rh15Pct(a)}</small>`;
const rh15SomaDia=(L,i)=>{let s=0,t=false;L.forEach(e=>{const v=e.st.serie[i];if(v!==null){s+=v;t=true}});return t?s:null};

/* ---------- gráficos SVG ---------- */
const rh15Cor=i=>i<8?RH15_CORES[i]:`hsl(${(i*47)%360} 70% 62%)`;
const RH15_CORES=['#9a4dff','#4fdc8f','#ffc35c','#5cc8ff','#ff6b81','#c08bff','#7be0d6','#f39b5c'];
function rh15Linhas(dias,series,{altura=240,rotulo='players',faixa=null,legendaInterativa=false}={}){
 const W=860,H=altura,L=40,R=14,T=16,B=34,iw=W-L-R,ih=H-T-B,n=Math.max(1,dias.length);
 const max=Math.max(1,faixa?faixa.max:0,...series.flatMap(s=>s.vals.filter(v=>v!==null)));
 const passo=max<=5?1:max<=10?2:max<=25?5:max<=50?10:max<=100?20:max<=250?50:100,topo=Math.ceil(max/passo)*passo;
 const x=i=>L+(n===1?iw/2:i*iw/(n-1)),y=v=>T+ih-(v/topo)*ih;
 let g='';for(let v=0;v<=topo;v+=passo)g+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${L-6}" y="${y(v)+3}" class="ax" text-anchor="end">${v}</text>`;
 if(faixa)g+=`<rect x="${L}" y="${y(faixa.max)}" width="${iw}" height="${Math.max(1,y(faixa.min)-y(faixa.max))}" class="meta"/><text x="${W-R-4}" y="${y(faixa.max)-4}" class="metat" text-anchor="end">meta ${faixa.min===faixa.max?faixa.max:faixa.min+' a '+faixa.max}</text>`;
 const salto=n>16?Math.ceil(n/14):1;
 dias.forEach((d,i)=>{if((n-1-i)%salto===0)g+=`<text x="${x(i)}" y="${H-B+16}" class="ax" text-anchor="middle">${rh15Dm(d)}</text>`});
 const ls=series.map((s,si)=>{let path='',pts='';s.vals.forEach((v,i)=>{if(v===null)return;path+=(path&&i>0&&s.vals[i-1]!==null?'L':'M')+x(i).toFixed(1)+' '+y(v).toFixed(1);
  pts+=`<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="${n>40?1.6:2.6}" fill="${s.cor}"><title>${esc(s.nome)} — ${rh15Dm(dias[i])}: ${rh15N(v)} ${rotulo}</title></circle>`});
  return `<g class="rh15-s" data-i="${si}"><path d="${path}" fill="none" stroke="${s.cor}" stroke-width="${s.destaque?2.6:2}" stroke-linejoin="round" stroke-linecap="round"/>${pts}</g>`}).join('');
 const leg=series.length>1?(legendaInterativa?`<div class="rh15-legend inter"><button type="button" class="all" data-rh15-serie="all">Todas</button><button type="button" class="all" data-rh15-serie="none">Nenhuma</button>${series.map((s,i)=>`<button type="button" data-rh15-serie="${i}"><i style="background:${s.cor}"></i>${esc(s.nome)}</button>`).join('')}</div>`:`<div class="rh15-legend">${series.map(s=>`<span><i style="background:${s.cor}"></i>${esc(s.nome)}</span>`).join('')}</div>`):'';
 return `<svg class="rh15-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico diário">${g}${ls}</svg>${leg}`;
}
function rh15Barras(itens,{fmt=rh15N}={}){
 const max=Math.max(1,...itens.map(i=>+i.v||0));
 return `<div class="rh15-bars">${itens.map(i=>`<div class="rh15-bar${i.k?' click':''}"${i.k?` data-rh15-fac="${esc(i.k)}" role="button" tabindex="0"`:''}><span class="lbl" title="${esc(i.nome)}">${esc(i.nome)}</span><span class="trk"><i style="width:${Math.max(1.5,(+i.v||0)/max*100).toFixed(1)}%;${i.cor?`background:${i.cor}`:''}"></i></span><b>${fmt(i.v)}</b></div>`).join('')}</div>`;
}

/* ---------- abas ---------- */
function rh15Painel(B){
 const L=rh15Filtrar(B.lista),dias=B.dias;
 if(!L.length)return rh15Vazio('Sem dados no período','Escolha outro período ou verifique a fonte das métricas.');
 const somaDia=dias.map((d,i)=>rh15SomaDia(L,i)),comDado=somaDia.filter(v=>v!==null);
 const picoGeral=comDado.length?Math.max(...comDado):null,iPico=somaDia.indexOf(picoGeral),mediaGeral=comDado.length?comDado.reduce((a,b)=>a+b,0)/comDado.length:null;
 const PA=rh15Filtrar(B.anterior.lista),somaAnt=B.anterior.dias.map((d,i)=>rh15SomaDia(PA,i)).filter(v=>v!==null);
 const mediaAnt=somaAnt.length?somaAnt.reduce((a,b)=>a+b,0)/somaAnt.length:null,picoAnt=somaAnt.length?Math.max(...somaAnt):null;
 const porFac=[...L].filter(e=>e.st.comDados).sort((a,b)=>b.st.media-a.st.media);
 const sel={k:''};
 const M=rh15Meta();
 const ativas=L.filter(e=>e.st.comDados),presMed=ativas.length?ativas.reduce((a,e)=>a+(e.st.aprov||0),0)/ativas.length:0;
 const ativasAnt=PA.filter(e=>e.st.comDados),presAnt=ativasAnt.length?ativasAnt.reduce((a,e)=>a+(e.st.aprov||0),0)/ativasAnt.length:null;
 const top=[...ativas].sort((a,b)=>b.st.media-a.st.media).slice(0,8);
 const varia=ativas.filter(e=>e.ant&&e.ant.media!==null&&e.st.comDados>=3&&e.ant.comDados>=3).map(e=>({e,v:e.st.media-e.ant.media})).sort((a,b)=>b.v-a.v);
 const linhaVar=x=>`<button type="button" class="rh15-row" data-rh15-fac="${esc(x.e.k)}"><b>${esc(x.e.faccao)}</b><span>${rh15N(x.e.ant.media)} → ${rh15N(x.e.st.media)}</span><span class="rh15-var ${x.v>0?'up':'down'}">${x.v>0?'▲ +':'▼ −'}${rh15N(Math.abs(x.v))}</span></button>`;
 const atencao=L.filter(e=>!e.ex&&(e.st.comDados===0||(e.st.media!==null&&e.st.media<rh15Meta().min)||e.st.semPlayers>=3)).sort((a,b)=>a.st.presentes-b.st.presentes).slice(0,10);
 return `<div class="rh15-kpis">
<div><span>FACÇÕES MEDIDAS</span><b>${ativas.length}</b><small>${L.length} no filtro · ${ativasAnt.length} no período anterior</small></div>
<div><span>MÉDIA DIÁRIA DO ILEGAL</span><b>${rh15N(mediaGeral)}</b><small>${rh15Var(mediaGeral,mediaAnt)} soma dos picos das facções</small></div>
<div><span>PICO DO ILEGAL</span><b>${rh15N(picoGeral)}</b><small>${rh15Var(picoGeral,picoAnt)} ${iPico>=0?`em ${rh15Dm(dias[iPico])}`:''}</small></div>
<div><span>APROVEITAMENTO MÉDIO</span><b>${rh15Pct(presMed)}</b><small>${rh15Var(presMed,presAnt,{base:0.05})} média dos picos ÷ ${rh15Meta().max} (meta ${rh15MetaTxt()})</small></div>
<div><span>COLETAS NO PERÍODO</span><b>${ativas.reduce((a,e)=>a+e.st.coletas,0)}</b><small>${B.slotKeys.length} horário(s): ${esc(B.slotKeys.join(', ')||'—')}</small></div></div>
${rh15SemanaHorario(B)}
${porFac.length?`<section class="rh15-card"><header><b>Pico diário por facção</b><small>Pico de cada dia · verde na meta, amarelo abaixo · clique para abrir o gráfico da facção</small></header><div class="rh15-mini-grid">${porFac.map(e=>`<button type="button" class="rh15-mini ${e.k===sel.k?'on':''}" data-rh15-fac="${esc(e.k)}"><div class="t"><b>${esc(e.faccao)}</b><span>${rh15N(e.st.media)}</span></div>${rh15MiniBarras(dias,e)}<div class="f"><small>${esc(e.segmento)}</small><small>${e.st.diasMeta}/${e.st.total} na meta</small></div></button>`).join('')}</div></section>`:rh15Vazio('Sem coletas no período','')}
<div class="rh15-grid2">
<section class="rh15-card"><header><b>Por facção · pico diário</b><small>Último dia com coleta · clique para abrir a facção</small></header>
<div class="rh15-table-wrap tall"><table class="rh15-table compact"><thead><tr><th>FACÇÃO</th><th>ÚLTIMO PICO</th><th>MÉDIA</th><th>APROV.</th><th>NA META</th><th>VARIAÇÃO</th></tr></thead><tbody>${porFac.map(e=>{let ui=-1;for(let k=e.st.serie.length-1;k>=0;k--){if(e.st.serie[k]!==null){ui=k;break}}const up=ui>=0?e.st.serie[ui]:null;return `<tr data-rh15-fac="${esc(e.k)}"><td><b>${esc(e.faccao)}</b><small>${esc(e.segmento)}</small></td><td><b class="fx-${rh15Faixa(up)}">${rh15N(up)}</b><small>${ui>=0?rh15Dm(dias[ui]):''}</small></td><td>${rh15N(e.st.media)}</td><td>${rh15Pct(e.st.aprov)}</td><td>${e.st.diasMeta}/${e.st.total}</td><td>${rh15Var(e.st.media,e.ant?.media??null)}</td></tr>`}).join('')}</tbody></table></div></section>
<section class="rh15-card"><header><b>Maiores médias de pico</b><small>Clique para abrir a facção</small></header>${rh15Barras(top.map(e=>({nome:e.faccao,v:e.st.media,k:e.k})))}</section>
</div>
<div class="rh15-grid2">
<section class="rh15-card"><header><b>Maiores altas</b><small>Diferença na média de pico (players) × ${esc(B.ra.rotulo)}</small></header>${varia.filter(x=>x.v>=1).slice(0,6).map(linhaVar).join('')||'<p class="rh15-empty">Nenhuma alta de 1 player ou mais.</p>'}</section>
<section class="rh15-card"><header><b>Maiores quedas</b><small>Diferença na média de pico (players) × ${esc(B.ra.rotulo)}</small></header>${varia.filter(x=>x.v<=-1).reverse().slice(0,6).map(linhaVar).join('')||'<p class="rh15-empty">Nenhuma queda de 1 player ou mais.</p>'}</section>
</div>
${atencao.length?`<section class="rh15-card warn"><header><b>Atenção</b><small>Sem coleta, média de pico abaixo de ${rh15Meta().min} ou 3+ dias seguidos sem players</small></header><div class="rh15-chips">${atencao.map(e=>`<button type="button" data-rh15-fac="${esc(e.k)}"><b>${esc(e.faccao)}</b><small>${esc(e.group)} · média ${rh15N(e.st.media)} · ${e.st.diasMeta}/${e.st.total} dias na meta${e.st.semPlayers>=3?` · ${e.st.semPlayers} dias sem players`:''}</small></button>`).join('')}</div></section>`:''}`;
}
const RH15_ORDENS=[['media','Média dos picos'],['pico','Pico máximo'],['aprov','Aproveitamento'],['meta','Dias na meta'],['presenca','Dias com players'],['regularidade','Regularidade'],['variacao','Variação'],['coleta','Média por coleta'],['faccao','Facção A–Z'],['segmento','Segmento']];
function rh15Ordenar(L){
 const k=rh15.ord,num=(e,f)=>{const v=f(e);return v===null||v===undefined||!Number.isFinite(v)?-Infinity:v};
 const vari=e=>e.ant&&e.ant.media!==null&&e.st.media!==null?e.st.media-e.ant.media:null;
 const f={media:e=>e.st.media,pico:e=>e.st.pico,presenca:e=>e.st.presenca,aprov:e=>e.st.aprov,meta:e=>e.st.diasMeta,regularidade:e=>e.st.regularidade,variacao:vari,coleta:e=>e.st.mediaColetas}[k];
 if(f)return [...L].sort((a,b)=>(num(b,f)-num(a,f))||a.faccao.localeCompare(b.faccao,'pt-BR'));
 if(k==='segmento')return [...L].sort((a,b)=>a.segmento.localeCompare(b.segmento,'pt-BR')||(num(b,e=>e.st.media)-num(a,e=>e.st.media)));
 return [...L].sort((a,b)=>a.faccao.localeCompare(b.faccao,'pt-BR'));
}
function rh15Ranking(B){
 const L=rh15Ordenar(rh15Filtrar(B.lista));
 if(!L.length)return rh15Vazio('Nenhuma facção no filtro','');
 return `<div class="rh15-subbar"><label class="rh15-select"><span>CLASSIFICAR POR</span><select id="rh15Ord">${RH15_ORDENS.map(([v,l])=>`<option value="${v}" ${rh15.ord===v?'selected':''}>${l}</option>`).join('')}</select></label>
<div class="rh15-actions"><button type="button" class="rh15-btn" data-rh15-exp="rank-csv">CSV</button><button type="button" class="rh15-btn primary" data-rh15-exp="rank-pdf">IMPRIMIR / PDF</button></div></div>
<div class="rh15-table-wrap"><table class="rh15-table"><thead><tr><th>#</th><th>FACÇÃO</th><th>SEGMENTO</th><th title="Média dos picos ÷ topo da meta">APROVEITAMENTO</th><th>DIAS NA META</th><th>MÉDIA DOS PICOS</th><th>VS ANTERIOR</th><th>MEDIANA</th><th>PICO</th><th>MÉDIA/COLETA</th><th title="Quanto a facção mantém o mesmo nível dia a dia (100% = sempre igual)">REGULARIDADE</th><th>HORÁRIO FORTE</th><th>ÚLTIMA PRESENÇA</th></tr></thead><tbody>
${L.map((e,i)=>{const st=e.st;return `<tr>
<td class="pos">${i+1}</td>
<td><button type="button" class="rh15-link" data-rh15-fac="${esc(e.k)}"><b>${esc(e.faccao)}</b><small>${esc(e.group)}${e.ex?' · saiu do Group':''}</small></button></td>
<td>${esc(e.segmento)}</td>
<td>${rh15AprovHtml(st.aprov)}</td><td><b>${st.diasMeta}/${st.total}</b><small>${st.presentes} com players${st.semPlayers>=3?` · ${st.semPlayers} dias sem players`:''}</small></td>
<td><b>${rh15N(st.media)}</b></td><td>${rh15Var(st.media,e.ant?.media??null)}</td><td>${rh15N(st.mediana)}</td><td>${rh15N(st.pico)}</td><td>${rh15N(st.mediaColetas)}</td>
<td>${st.regularidade===null?'—':`<span class="rh15-meter"><i style="width:${Math.round(st.regularidade*100)}%"></i></span><small>${rh15Pct(st.regularidade)}</small>`}</td>
<td>${st.forte?`<b>${esc(st.forte)}</b><small>${rh15N(st.porSlot[st.forte])} em média</small>`:'—'}</td>
<td>${st.ultima?rh15Dm(st.ultima):'—'}</td></tr>`}).join('')}
</tbody></table></div>`;
}
function rh15Picos(B){
 const L=rh15Filtrar(B.lista).filter(e=>e.st.comDados),dias=B.dias,slot=rh15.heatSlot;
 const valor=(e,d)=>{const x=e.dias.get(rh15DK(d));if(!x)return null;return slot==='pico'?x.pico:(Number.isFinite(+x.slots[slot])?+x.slots[slot]:null)};
 const opts=[['pico','Pico do dia'],...B.slotKeys.map(s=>[s,'Coleta '+s])];
 const top=Math.max(1,...L.flatMap(e=>dias.map(d=>valor(e,d)||0)));
 const ord=[...L].sort((a,b)=>b.st.media-a.st.media);
 const hoje=rh15DK(rh15Hoje());
 const tot=dias.map(d=>{let s=0,t=false;ord.forEach(e=>{const v=valor(e,d);if(v!==null){s+=v;t=true}});return t?s:null});
 return `<div class="rh15-subbar"><div class="rh15-seg">${opts.map(([v,l])=>`<button type="button" class="${slot===v?'active':''}" data-rh15-slot="${esc(v)}">${esc(l)}</button>`).join('')}</div><button type="button" class="rh15-btn" data-rh15-exp="picos-csv">EXPORTAR CSV</button></div>
${ord.length?`<div class="rh15-heat-wrap"><table class="rh15-heat"><thead><tr><th class="name">FACÇÃO</th>${dias.map(d=>`<th class="${rh15DK(d)===hoje?'today':''}" title="${d.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'2-digit'})}"><span>${String(d.getDate()).padStart(2,'0')}</span><small>${'DSTQQSS'[d.getDay()]}</small></th>`).join('')}<th class="sum">MÉDIA</th><th class="sum">PICO</th><th class="sum">DIAS</th></tr></thead><tbody>
${ord.map(e=>{const vs=dias.map(d=>valor(e,d)),vv=vs.filter(v=>v!==null);return `<tr><th class="name"><button type="button" data-rh15-fac="${esc(e.k)}"><b>${esc(e.faccao)}</b><small>${esc(e.group)} · ${esc(e.segmento)}</small></button></th>${vs.map((v,i)=>{if(v===null)return '<td class="nd" title="Sem coleta"></td>';const x=e.dias.get(rh15DK(dias[i]));const det=x?Object.entries(x.slots).sort((p,q)=>rh15SlotMin(p[0])-rh15SlotMin(q[0])).map(([k,n])=>`${k}: ${n}`).join(' · '):'';return `<td class="${v>0?'v':'z'} f-${rh15Faixa(v)}" style="--a:${v>0?(.16+.84*Math.min(1,v/top)).toFixed(2):0}" title="${esc(e.faccao)} — ${rh15Dm(dias[i])}\n${det}">${v}</td>`}).join('')}<td class="sum">${rh15N(vv.length?vv.reduce((a,b)=>a+b,0)/vv.length:null)}</td><td class="sum">${rh15N(vv.length?Math.max(...vv):null)}</td><td class="sum">${vv.filter(v=>v>0).length}/${dias.length}</td></tr>`}).join('')}
<tr class="total"><th class="name"><b>TOTAL DO ILEGAL</b></th>${tot.map(v=>`<td class="tot">${v===null?'':v}</td>`).join('')}<td class="sum" colspan="3"></td></tr>
</tbody></table></div>
<div class="rh15-heat-legend"><span>Célula = ${slot==='pico'?'maior coleta do dia':'players na coleta das '+esc(slot)}. Contorno amarelo: abaixo da meta (${rh15Meta().min}); contorno verde: atingiu o topo (${rh15Meta().max}). Passe o mouse para ver todas as coletas do dia.</span></div>`:rh15Vazio('Sem coletas no período','')}`;
}
function rh15Faccao(B){
 const L=rh15Filtrar(B.lista).sort((a,b)=>a.faccao.localeCompare(b.faccao,'pt-BR'));
 if(!L.length)return rh15Vazio('Nenhuma facção no filtro','');
 let e=L.find(x=>x.k===rh15.fac)||L[0];rh15.fac=e.k;
 const st=e.st,an=e.ant,dias=B.dias,mapa=e.dias;
 const serieSlots=B.slotKeys.map((s,i)=>({nome:s,cor:RH15_CORES[(i+1)%RH15_CORES.length],vals:dias.map(d=>{const x=mapa.get(rh15DK(d));return x&&Number.isFinite(+x.slots[s])?+x.slots[s]:null})}));
 const tabela=[...dias].reverse().map(d=>{const x=mapa.get(rh15DK(d));return `<tr class="${x?'':'nd'}"><td>${d.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'})}</td>${B.slotKeys.map(k=>`<td>${x&&x.slots[k]!==undefined?x.slots[k]:'—'}</td>`).join('')}<td><b>${x?x.pico:'—'}</b></td><td>${x?rh15N(x.media):'—'}</td><td>${x?rh15Pct(x.pico/rh15Meta().max):'—'}</td><td>${x?({top:'<span class="rh15-pill ok">TOPO DA META</span>',ok:'<span class="rh15-pill ok">NA META</span>',low:'<span class="rh15-pill warn">ABAIXO DA META</span>',zero:'<span class="rh15-pill warn">ZERADO</span>'}[rh15Faixa(x.pico)]):'<span class="rh15-pill off">SEM COLETA</span>'}</td></tr>`}).join('');
 const comp=an?`<section class="rh15-card"><header><b>Comparação com ${esc(B.ra.rotulo)}</b></header><table class="rh15-table compact"><thead><tr><th></th><th>ATUAL</th><th>ANTERIOR</th><th>VARIAÇÃO</th></tr></thead><tbody>
${[['Aproveitamento',st.aprov,an.aprov,rh15Pct],['Dias na meta',st.diasMeta,an.diasMeta,rh15N],['Dias com players',st.presentes,an.presentes,rh15N],['Média dos picos',st.media,an.media,rh15N],['Mediana',st.mediana,an.mediana,rh15N],['Pico máximo',st.pico,an.pico,rh15N],['Média por coleta',st.mediaColetas,an.mediaColetas,rh15N],...B.slotKeys.map(s=>['Média '+s,st.porSlot[s],an.porSlot?.[s]??null,rh15N])].map(([l,a,b,f])=>`<tr><td><b>${esc(l)}</b></td><td>${f(a)}</td><td>${f(b??null)}</td><td>${rh15Var(a,b??null,{base:f===rh15Pct?0.05:5})}</td></tr>`).join('')}</tbody></table></section>`:'';
 return `<div class="rh15-subbar"><label class="rh15-select wide"><span>FACÇÃO</span><select id="rh15FacSel">${L.map(x=>`<option value="${esc(x.k)}" ${x.k===e.k?'selected':''}>${esc(x.faccao)} — ${esc(x.group)}${x.ex?' (saiu)':''}</option>`).join('')}</select></label><button type="button" class="rh15-btn" data-rh15-exp="fac-csv">CSV DA FACÇÃO</button><button type="button" class="rh15-btn primary" data-rh15-exp="fac-pdf">RELATÓRIO DA FACÇÃO</button></div>
<div class="rh15-kpis">
<div><span>APROVEITAMENTO</span><b>${rh15Pct(st.aprov)}</b><small>${rh15Var(st.aprov,an?.aprov??null,{base:0.05})} média ${rh15N(st.media)} ÷ ${rh15Meta().max} · ${st.diasMeta}/${st.total} dias na meta</small></div>
<div><span>MÉDIA DOS PICOS</span><b>${rh15N(st.media)}</b><small>${rh15Var(st.media,an?.media??null)} mediana ${rh15N(st.mediana)}</small></div>
<div><span>PICO MÁXIMO</span><b>${rh15N(st.pico)}</b><small>mínimo ${rh15N(st.minimo)} · última presença ${st.ultima?rh15Dm(st.ultima):'—'}</small></div>
<div><span>MÉDIA POR COLETA</span><b>${rh15N(st.mediaColetas)}</b><small>${st.coletas} coleta(s)${st.forte?` · mais forte às ${esc(st.forte)}`:''}</small></div>
<div><span>REGULARIDADE</span><b>${rh15Pct(st.regularidade)}</b><small>quanto o movimento se mantém dia a dia</small></div></div>
<section class="rh15-card"><header><b>Pico diário</b><small>${esc(e.group)} · ${esc(e.segmento)} · ${esc(B.r.rotulo)}</small></header>${st.comDados?rh15BlocoGrafico(rh15DiasMes(B),e):rh15Vazio('Sem coletas no período','')}</section>
${st.comDados&&B.slotKeys.length?`<section class="rh15-card"><header><b>Por horário de coleta</b><small>Média: ${B.slotKeys.map(s=>`${esc(s)} ${rh15N(st.porSlot[s])}`).join(' · ')}</small></header>${rh15Linhas(dias,serieSlots,{altura:210})}</section>`:''}
${comp}
<section class="rh15-card"><header><b>Coletas dia a dia</b></header><div class="rh15-table-wrap tall"><table class="rh15-table compact"><thead><tr><th>DIA</th>${B.slotKeys.map(k=>`<th>${esc(k)}</th>`).join('')}<th>PICO</th><th>MÉDIA</th><th>% DA META</th><th>SITUAÇÃO</th></tr></thead><tbody>${tabela}</tbody></table></div></section>`;
}
const RH15_AGRUP=[['grafico','Gráfico mensal por facção'],['faccao','Resumo por facção'],['group','Group'],['segmento','Segmento'],['dia','Dia'],['semana','Dia da semana'],['horario','Horário de coleta'],['faccaodia','Facção × dia']];
function rh15RelLista(B,cfg){return rh15Filtrar(B.lista,{ex:cfg.ex}).filter(e=>e.st.comDados||cfg.agrupar==='faccao')}
/* ---------- gráfico mensal por facção: todos os dias do mês, barra = pico do dia, linha = constância ---------- */
function rh15DiasMes(B){return rh15Dias({ini:B.r.ini,fim:B.r.fimReal||B.r.fim})}
function rh15GraficoMes(dias,e,{print=false}={}){
 const M=rh15Meta(),W=900,H=print?330:300,L=36,R=74,T=20,Bm=40,iw=W-L-R,ih=H-T-Bm,n=Math.max(1,dias.length),bw=iw/n,hoje=rh15Hoje();
 const serie=dias.map(d=>{const x=e.dias.get(rh15DK(d));return x?x.pico:null});
 const vals=serie.filter(v=>v!==null),media=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null;
 const max=Math.max(M.max+2,...vals,1),passo=max<=10?2:max<=30?5:max<=60?10:20,topo=Math.ceil(max/passo)*passo;
 const y=v=>T+ih-(v/topo)*ih,cx=i=>L+i*bw+bw/2;
 let g='';for(let v=0;v<=topo;v+=passo)g+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${L-6}" y="${y(v)+3}" class="ax" text-anchor="end">${v}</text>`;
 g+=`<rect x="${L}" y="${y(M.max)}" width="${iw}" height="${y(M.min)-y(M.max)}" class="meta"/>`;
 dias.forEach((d,i)=>{const v=serie[i],x=L+i*bw+bw*.16,w=Math.max(2,bw*.68),fut=d>hoje,wk=[0,6].includes(d.getDay());
  g+=`<text x="${cx(i)}" y="${H-Bm+14}" class="ax${wk?' wk':''}" text-anchor="middle">${d.getDate()}</text><text x="${cx(i)}" y="${H-Bm+26}" class="ax sm" text-anchor="middle">${'DSTQQSS'[d.getDay()]}</text>`;
  if(fut)return;
  if(v===null){g+=`<rect x="${x}" y="${T+ih-2}" width="${w}" height="2" class="nd"><title>${rh15Br(d)} — sem coleta</title></rect>`;return}
  const h=Math.max(2,(v/topo)*ih),x2=e.dias.get(rh15DK(d)),det=x2?Object.entries(x2.slots).sort((a,b)=>rh15SlotMin(a[0])-rh15SlotMin(b[0])).map(([k,q])=>`${k}: ${q}`).join(' · '):'';
  const parc=rh15DK(d)===rh15DK(hoje)&&(x2?.coletas||0)<4;
  g+=`<rect x="${x}" y="${T+ih-h}" width="${w}" height="${h}" rx="2" class="b f-${rh15Faixa(v)}${parc?' parcial':''}"><title>${rh15Br(d)} — pico ${v}\n${det}</title></rect><text x="${cx(i)}" y="${T+ih-h-9}" class="val" text-anchor="middle">${v}</text>`});
 /* linha de constância: liga os picos dos dias com coleta */
 let path='';serie.forEach((v,i)=>{if(v===null||dias[i]>hoje)return;path+=(path?'L':'M')+cx(i).toFixed(1)+' '+y(v).toFixed(1)});
 g+=`<path d="${path}" class="line" fill="none"/>`;
 serie.forEach((v,i)=>{if(v!==null&&dias[i]<=hoje)g+=`<circle cx="${cx(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="3" class="dot"/>`});
 if(media!==null){g+=`<line x1="${L}" x2="${W-R+4}" y1="${y(media)}" y2="${y(media)}" class="avg"/><rect x="${W-R+6}" y="${y(media)-9}" width="66" height="18" rx="9" class="avgbg"/><text x="${W-R+39}" y="${y(media)+4}" class="avgt" text-anchor="middle">méd. ${rh15N(media)}</text>`}
 return `<svg class="rh15-mes${print?' print':''}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Pico diário de ${esc(e.faccao)}">${g}</svg>`;
}
/* bloco de tela: gráfico + legenda + tira dia a dia (mesmo modelo do PDF) */
function rh15BlocoGrafico(dias,e){
 const hoje=rh15Hoje(),M=rh15Meta();
 const strip=`<div class="rh15-strip" style="grid-template-columns:repeat(${dias.length},minmax(0,1fr))">${dias.map(d=>{const v=e.dias.get(rh15DK(d))?.pico;const cls=d>hoje?'s-fut':v===undefined?'s-nd':'s-'+rh15Faixa(v);return `<div class="${cls}" title="${rh15Br(d)}${v!==undefined?` — pico ${v}`:''}"><em>${d.getDate()}</em>${d>hoje?'&nbsp;':v===undefined?'–':v}</div>`}).join('')}</div>`;
 return `<div class="rh15-gbox">${rh15GraficoMes(dias,e)}<div class="rh15-gleg"><span><i class="lg-meta"></i>faixa da meta (${rh15MetaTxt()})</span><span><i class="lg-top"></i>pico no topo (≥ ${M.max})</span><span><i class="lg-ok"></i>pico na meta</span><span><i class="lg-low"></i>abaixo da meta</span><span><i class="lg-line"></i>constância (liga os picos)</span><span><i class="lg-avg"></i>média do período</span><span><i class="lg-nd"></i>sem coleta</span></div>${strip}</div>`;
}
/* pico de pessoas online no Ilegal por horário de coleta, segunda a sexta */
/* V15.3 · pico do Ilegal na SEMANA (segunda a domingo), progressivo:
   cada barra é a soma das facções naquele dia/horário. Dias e horários que
   ainda não chegaram aparecem como "aguardando". ◀ ▶ navega entre semanas. */
function rh15SemanaHorario(B){
 const dn=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'],off=Math.min(0,Math.round(+rh15.semOff||0));
 const hoje=rh15Hoje(),dow=(hoje.getDay()+6)%7,seg=new Date(hoje.getFullYear(),hoje.getMonth(),hoje.getDate()-dow+off*7);
 const semana=[...Array(7)].map((_,i)=>new Date(seg.getFullYear(),seg.getMonth(),seg.getDate()+i)),dom=semana[6];
 const A=rh15Coletar({ini:seg,fim:dom<hoje?dom:hoje},true),L=rh15Filtrar(A.lista);
 const slots=[...new Set([...(A.slotKeys||[]),...(B.slotKeys||[]),...(B.slotKeys?.length||A.slotKeys?.length?[]:['14H','16H','21H','23H'])])].sort((x,y)=>rh15SlotMin(x)-rh15SlotMin(y));
 const agora=new Date(),minAgora=agora.getHours()*60+agora.getMinutes();
 const cel=semana.map(d=>{const dk=rh15DK(d);return slots.map(s=>{let t=0,tem=false;L.forEach(e=>{const v=+e.dias.get(dk)?.slots?.[s];if(Number.isFinite(v)){t+=v;tem=true}});
  const futuro=d>hoje||(d.getTime()===hoje.getTime()&&!tem&&rh15SlotMin(s)+20>minAgora);
  return {v:tem?t:null,futuro}})});
 let best=null,max=1,soma=0,n=0;cel.forEach((c,di)=>c.forEach((x,si)=>{if(x.v===null)return;max=Math.max(max,x.v);soma+=x.v;n++;if(!best||x.v>best.v)best={v:x.v,di,si}}));
 const W=1260,H=310,Lm=40,Rm=12,T=24,Bm=60,iw=W-Lm-Rm,ih=H-T-Bm,gw=iw/7,bw=Math.min(34,(gw-24)/Math.max(1,slots.length));
 const passo=max<=20?5:max<=60?10:max<=150?25:50,topo=Math.ceil(max/passo)*passo,y=v=>T+ih-(v/topo)*ih;
 let g='';for(let v=0;v<=topo;v+=passo)g+=`<line x1="${Lm}" x2="${W-Rm}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${Lm-6}" y="${y(v)+3}" class="ax" text-anchor="end">${v}</text>`;
 semana.forEach((d,di)=>{const gx=Lm+di*gw,x0=gx+(gw-bw*slots.length-(slots.length-1)*4)/2,ehHoje=d.getTime()===hoje.getTime();
  if(ehHoje)g+=`<rect x="${gx+2}" y="${T-14}" width="${gw-4}" height="${ih+Bm+8}" rx="10" class="hoje"/><text x="${gx+gw/2}" y="${T-3}" class="hoje-t" text-anchor="middle">HOJE</text>`;
  g+=`<text x="${gx+gw/2}" y="${H-Bm+30}" class="axw${d>hoje?' fut':''}" text-anchor="middle">${dn[d.getDay()]}</text><text x="${gx+gw/2}" y="${H-Bm+46}" class="ax dt" text-anchor="middle">${rh15Dm(d)}</text>`;
  slots.forEach((s,si)=>{const c=cel[di][si],x=x0+si*(bw+4);g+=`<text x="${x+bw/2}" y="${H-Bm+14}" class="ax sm" text-anchor="middle">${esc(s)}</text>`;
   if(c.v===null){g+=`<rect x="${x}" y="${T+ih-22}" width="${bw}" height="22" rx="3" class="hb ${c.futuro?'wait':'miss'}"><title>${dn[d.getDay()]} ${rh15Br(d)} ${s} — ${c.futuro?'aguardando a coleta':'sem coleta'}</title></rect>`;return}
   const h=Math.max(2,c.v/topo*ih),eb=best&&best.di===di&&best.si===si;
   g+=`<rect x="${x}" y="${y(c.v)}" width="${bw}" height="${h}" rx="3" class="hb grow s${si%6}${eb?' best':''}" style="animation-delay:${(di*slots.length+si)*25}ms"><title>${dn[d.getDay()]} ${rh15Br(d)} ${s} — ${c.v} online</title></rect><text x="${x+bw/2}" y="${y(c.v)-5}" class="val" text-anchor="middle">${c.v}</text>`})});
 const tab=`<table class="rh15-table compact rh15-wh"><thead><tr><th>HORÁRIO</th>${semana.map(d=>`<th>${dn[d.getDay()].toUpperCase()}<br><small>${rh15Dm(d)}</small></th>`).join('')}</tr></thead><tbody>${slots.map((s,si)=>`<tr><td><b>${esc(s)}</b></td>${semana.map((d,di)=>{const c=cel[di][si];if(c.v===null)return `<td class="${c.futuro?'wait':''}">${c.futuro?'<small>aguardando</small>':'—'}</td>`;return `<td class="${best&&best.di===di&&best.si===si?'best':''}" style="--a:${(.08+.5*c.v/max).toFixed(2)}"><b>${c.v}</b></td>`}).join('')}</tr>`).join('')}</tbody></table>`;
 const rot=off===0?'Esta semana':off===-1?'Semana passada':`${-off} semanas atrás`;
 return `<section class="rh15-card"><header><div><b>Pico de pessoas online no Ilegal — semana</b><small>${rot} · ${rh15Br(seg)} a ${rh15Br(dom)} · soma de todas as facções em cada horário de coleta${n?` · média ${rh15N(soma/n)}`:''}${best?` · maior: ${dn[semana[best.di].getDay()]} ${rh15Dm(semana[best.di])} ${esc(slots[best.si])} com ${best.v}`:''}</small></div>
<div class="rh15-wh-nav"><button type="button" data-rh15-sem="-1" title="Semana anterior">◀</button><button type="button" data-rh15-sem="0" ${off===0?'disabled':''}>Esta semana</button><button type="button" data-rh15-sem="1" ${off===0?'disabled':''} title="Próxima semana">▶</button></div></header>
<div class="rh15-gbox rh15-wh-chart"><svg class="rh15-mes" viewBox="0 0 ${W} ${H}" role="img" aria-label="Pico do Ilegal na semana">${g}</svg><div class="rh15-gleg">${slots.map((s,si)=>`<span><i class="hb-leg s${si%6}"></i>${esc(s)}</span>`).join('')}<span><i class="hb-leg best"></i>maior pico da semana</span><span><i class="hb-leg wait"></i>aguardando coleta</span></div></div>
<div class="rh15-table-wrap" style="margin-top:12px">${tab}</div></section>`;
}
document.addEventListener('click',ev=>{const b=ev.target.closest?.('[data-rh15-sem]');if(!b)return;const d=+b.dataset.rh15Sem;rh15.semOff=d===0?0:Math.min(0,(+rh15.semOff||0)+d);rh15Render()});
function rh15MiniBarras(dias,e){
 const hoje=rh15Hoje(),n=dias.length,M=rh15Meta(),max=Math.max(M.max,...dias.map(d=>e.dias.get(rh15DK(d))?.pico||0)),W=n*6;
 return `<svg class="rh15-minisvg" viewBox="0 0 ${W} 34" preserveAspectRatio="none"><rect x="0" y="${34-M.max/max*32}" width="${W}" height="${(M.max-M.min)/max*32}" class="mm"/>${dias.map((d,i)=>{if(d>hoje)return '';const v=e.dias.get(rh15DK(d))?.pico;if(v===undefined)return `<rect x="${i*6+.5}" y="32" width="5" height="2" class="nd"/>`;const h=Math.max(1.5,v/max*32);return `<rect x="${i*6+.5}" y="${34-h}" width="5" height="${h}" class="${rh15Faixa(v)}"/>`}).join('')}</svg>`;
}
function rh15CardMes(dias,e){
 const st=e.st,M=rh15Meta(),vals=dias.map(d=>e.dias.get(rh15DK(d))?.pico).filter(v=>v!==undefined);
 const abaixo=vals.filter(v=>v<M.min).length;
 return `<section class="rh15-card rh15-mes-card"><header><div><b>${esc(e.faccao)}</b><small>${esc(e.group)} · ${esc(e.segmento)}${e.ex?' · saiu do Group':''}</small></div>
<div class="rh15-mes-kpis"><span><em>MÉDIA</em><b>${rh15N(st.media)}</b></span><span><em>PICO</em><b>${rh15N(st.pico)}</b></span><span><em>NA META</em><b>${st.diasMeta}/${st.total}</b></span><span><em>ABAIXO</em><b class="${abaixo?'warn':''}">${abaixo}</b></span><span><em>APROV.</em><b>${rh15Pct(st.aprov)}</b></span><span><em>CONSTÂNCIA</em><b>${rh15Pct(st.regularidade)}</b></span></div></header>
${st.comDados?rh15BlocoGrafico(dias,e):rh15Vazio('Sem coletas no período','')}</section>`;
}
function rh15RelGraficos(B,L){
 const dias=rh15DiasMes(B),sel=rh15.rep.fac||'';
 const ord=[...L].filter(e=>e.st.comDados).sort((a,b)=>a.faccao.localeCompare(b.faccao,'pt-BR'));
 const mostrar=sel?ord.filter(e=>e.k===sel):ord;
 return `<div class="rh15-subbar"><label class="rh15-select wide"><span>FACÇÃO</span><select id="rh15RepFac"><option value="">Todas (${ord.length})</option>${ord.map(e=>`<option value="${esc(e.k)}" ${e.k===sel?'selected':''}>${esc(e.faccao)} — ${esc(e.group)}</option>`).join('')}</select></label></div>
<p class="rh15-hint">Cada barra é o pico do dia. A linha liga os picos e mostra a constância; a faixa verde é a meta de ${rh15MetaTxt()} e a linha tracejada é a média. Barra amarela = abaixo da meta.</p>
${mostrar.length?mostrar.map(e=>rh15CardMes(dias,e)).join(''):rh15Vazio('Sem coletas no período','')}`;
}
function rh15TxtAssumidas() {
  const dedup = new Map();
  (RH15_FACCOES() || []).filter(f => f && !f.removido && situacaoGroup(f) === 'ASSUMIDA' && String(f.group || '').trim()).forEach(f => {
    const k = org15GK(f.group);
    const old = dedup.get(k);
    if (!old || (msDe(f.dataEntrega) || 0) > (msDe(old.dataEntrega) || 0)) dedup.set(k, f);
  });
  return [...dedup.values()].filter(f =>
    (!rh15.seg || String(f.segmento || orgV92Segment(f)).toUpperCase() === rh15.seg)
  ).sort((a,b) =>
    String(a.segmento || orgV92Segment(a)).localeCompare(String(b.segmento || orgV92Segment(b)), 'pt-BR') ||
    String(a.group).localeCompare(String(b.group), 'pt-BR', {numeric:true})
  );
}

function rh15TxtMontar(B) {
  const todos = rh15TxtAssumidas();
  const escolhidos = todos.filter(f => !rh15.txtGroup || org15GK(f.group) === org15GK(rh15.txtGroup));
  if (!escolhidos.length) throw new Error('Não há facção assumida para o Group/segmento selecionado.');
  if (!(RH15_METRICAS() || []).length) throw new Error('Ainda não há métricas carregadas. Atualize a Central de Métricas.');
  const dias = B.dias, horarios = ['14H', '16H', '21H', '23H'];
  if (!dias.length) throw new Error('Selecione um período válido.');
  if (dias.length > 366) throw new Error('Escolha um intervalo de até 366 dias.');
  const nomes = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  const mapa = new Map(B.lista.filter(e => !e.ex).map(e => [rh15K(e.faccao)+'|'+org15GK(e.group), e]));
  let registradas = 0, previstas = 0;
  const linhas = [
    'HIGH ROLEPLAY - RELATÓRIO DE CONTINGENTE ONLINE',
    'FACÇÕES ASSUMIDAS - HIGH OS DEV',
    'PERÍODO: ' + rh15Br(dias[0]) + ' A ' + rh15Br(dias[dias.length - 1]),
    'FACÇÕES NO RELATÓRIO: ' + escolhidos.length,
    'HORÁRIOS: 14h, 16h, 21h, 23h',
    'Legenda: — = sem registro ou horário anterior à ocupação atual; 0 = coleta zerada.',
    'Média geral calculada somente sobre as coletas registradas.',
    '='.repeat(64), ''
  ];
  escolhidos.forEach(f => {
    const e = mapa.get(rh15K(f.faccao)+'|'+org15GK(f.group));
    const inicio = msDe(f.dataEntrega);
    const valores = [];
    const diarias = [];
    linhas.push('GROUP: ' + String(f.group).toUpperCase() + ' | FACÇÃO: ' + String(f.faccao).trim());
    linhas.push('Dia           | 14h | 16h | 21h | 23h');
    linhas.push('-------------------------------------');
    dias.forEach(d => {
      const data = rh15DK(d), slots = e?.dias?.get(data)?.slots || {};
      const cells = horarios.map(h => {
        const instante = new Date(d.getFullYear(), d.getMonth(), d.getDate(), Number(h.slice(0,2)));
        const v = slots[h];
        if ((Number.isFinite(inicio) && instante.getTime() < inicio) ||
            v === undefined || v === null || v === '' || !Number.isFinite(Number(v))) return null;
        return Number(v);
      });
      diarias.push(cells);
      cells.filter(v => v !== null).forEach(v => valores.push(v));
      linhas.push(nomes[d.getDay()].padEnd(7) + ' ' + rh15Dm(d) + ' | ' +
        cells.map(v => String(v === null ? '—' : v).padStart(3)).join(' | '));
    });
    const total = valores.length, esperado = dias.length * horarios.length;
    registradas += total; previstas += esperado;
    linhas.push('-------------------------------------');
    linhas.push('MÉDIA GERAL (' + total + ' COLETAS): ' +
      (total ? (valores.reduce((a,b) => a+b,0)/total).toFixed(2).replace('.',',') : '—') + ' membros online');
    linhas.push('PICO DO PERÍODO: ' + (total ? Math.max(...valores) : '—') + ' membros online');
    linhas.push('COLETAS REGISTRADAS: ' + total + '/' + esperado);
    if (f.dataEntrega) linhas.push('DATA QUE ASSUMIU: ' + String(f.dataEntrega));
    linhas.push('', '');
  });
  linhas.push('='.repeat(64));
  linhas.push('RESUMO: ' + escolhidos.length + ' facção(ões) assumida(s); ' +
    registradas + '/' + previstas + ' coletas registradas.');
  linhas.push('FONTE: Central de Métricas do High OS Dev e cadastro atual de Groups.');
  return {texto:linhas.join('\r\n'), total:escolhidos.length, registradas, previstas};
}

function rh15TxtPainel(B) {
  const facs = rh15TxtAssumidas();
  const opcoes = facs.map(f => `<option value="${esc(f.group)}" ${org15GK(f.group)===org15GK(rh15.txtGroup)?'selected':''}>${esc(f.group)} — ${esc(f.faccao)}</option>`).join('');
  return `<section class="rh15-card rh15-txt-card">
  <header><div><b>RELATÓRIO TXT • FACÇÕES ASSUMIDAS</b><small>Contingente online por Group, dia e horário • médias e picos</small></div>
  <span class="rh15-txt-count">${facs.length} assumida(s)</span></header>
  <p>Utiliza o <strong>período selecionado acima</strong> (inclusive o intervalo personalizado). Somente Groups com situação ASSUMIDA no cadastro atual; não inclui disponíveis ou sem QG.</p>
  <div class="rh15-txt-controls">
    <label class="rh15-select"><span>FACÇÕES</span><select id="rh15TxtGroup" aria-label="Facção para relatório TXT"><option value="">TODAS AS ASSUMIDAS</option>${opcoes}</select></label>
    <button type="button" class="rh15-btn" id="rh15TxtPreviewBtn">GERAR PRÉVIA</button>
    <button type="button" class="rh15-btn primary" id="rh15TxtDownloadBtn">BAIXAR TXT</button>
    <button type="button" class="rh15-btn" id="rh15TxtCopyBtn">COPIAR TEXTO</button>
  </div>
  <div id="rh15TxtStatus" class="rh15-txt-status" role="status">Período: ${esc(B.r.rotulo)} • Sem coleta = — • Coleta com zero = 0.</div>
  <textarea id="rh15TxtPreview" class="rh15-txt-preview" readonly spellcheck="false" rows="13" aria-label="Prévia do relatório TXT" placeholder="Clique em GERAR PRÉVIA para visualizar o relatório no padrão do Bloco de Notas."></textarea>
  </section>`;
}

function rh15TxtBaixar(B) {
  const rel = rh15TxtMontar(B);
  const blob = new Blob(['\ufeff',rel.texto], {type:'text/plain;charset=utf-8'});
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = 'relatorio_faccoes_assumidas_' + rh15DK(B.r.ini) + '_a_' + rh15DK(B.r.fim) + '.txt';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
  return rel;
}

async function rh15TxtCopiar(B) {
  const rel = rh15TxtMontar(B);
  if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(rel.texto);
  else {
    const textarea = document.getElementById('rh15TxtPreview');
    if (!textarea) throw new Error('Prévia indisponível.');
    textarea.value = rel.texto;
    textarea.select();
    if (!document.execCommand('copy')) throw new Error('Não foi possível copiar para a área de transferência.');
  }
  return rel;
}

function rh15Relatorio(B){
 const cfg=rh15.rep,graf=cfg.agrupar==='grafico',T=graf?null:rh15RelTabela(B,rh15RelLista(B,cfg),cfg);
 return `${rh15TxtPainel(B)}<div class="rh15-presets"><span>MODELOS PRONTOS</span>
<button type="button" data-rh15-preset="grafico-mensal">Gráfico mensal por facção</button><button type="button" data-rh15-preset="mensal-faccao">Resumo por facção</button><button type="button" data-rh15-preset="mensal-segmento">Mensal por segmento</button><button type="button" data-rh15-preset="mensal-group">Mensal por Group</button><button type="button" data-rh15-preset="picos-diarios">Picos diários (facção × dia)</button><button type="button" data-rh15-preset="horarios">Movimento por horário</button><button type="button" data-rh15-preset="semana">Dia da semana</button><button type="button" data-rh15-preset="ilegal-dia">Total do Ilegal por dia</button></div>
<div class="rh15-subbar"><label class="rh15-select"><span>AGRUPAR POR</span><select id="rh15RepAgrupar">${RH15_AGRUP.map(([v,l])=>`<option value="${v}" ${cfg.agrupar===v?'selected':''}>${l}</option>`).join('')}</select></label>
<label class="rh15-check"><input type="checkbox" id="rh15RepEx" ${cfg.ex?'checked':''}> Incluir facções que saíram do Group</label>
<div class="rh15-actions"><button type="button" class="rh15-btn" data-rh15-exp="rep-csv">BAIXAR CSV</button><button type="button" class="rh15-btn primary" data-rh15-exp="rep-pdf">IMPRIMIR / PDF</button></div></div>
${graf?rh15RelGraficos(B,rh15RelLista(B,cfg)):`<section class="rh15-card"><header><b>${esc(T.titulo)}</b><small>${esc(B.r.rotulo)}${rh15.seg?` · ${esc(rh15.seg)}`:''} · ${T.linhas.length} linha(s)</small></header>
${T.grafico||''}
<div class="rh15-table-wrap tall"><table class="rh15-table compact"><thead><tr>${T.cab.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${T.linhas.map(l=>`<tr>${l.map((c,i)=>`<td>${i===0?`<b>${esc(c)}</b>`:esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>`}`;
}
function rh15RelTabela(B,L,cfg){
 const dias=B.dias,ag=cfg.agrupar;
 if(ag==='faccao'){const o=[...L].sort((a,b)=>(b.st.media??-1)-(a.st.media??-1));
  return {titulo:'Relatório por facção',cab:['Facção','Group','Segmento','Dias no período','Dias com coleta','Dias com players','Dias na meta','Aproveitamento','Pico máximo','Média dos picos','Mediana','Média anterior','Variação','Média por coleta','Regularidade','Horário forte',...B.slotKeys.map(s=>'Média '+s),'Última presença'],
   linhas:o.map(e=>[e.faccao+(e.ex?' (saiu)':''),e.group,e.segmento,e.st.total,e.st.comDados,e.st.presentes,e.st.diasMeta,rh15Pct(e.st.aprov),rh15N(e.st.pico),rh15N(e.st.media),rh15N(e.st.mediana),rh15N(e.ant?.media??null),rh15VarTxt(e.st.media,e.ant?.media??null),rh15N(e.st.mediaColetas),rh15Pct(e.st.regularidade),e.st.forte||'—',...B.slotKeys.map(s=>rh15N(e.st.porSlot[s])),e.st.ultima?rh15Br(e.st.ultima):'—']),
   grafico:rh15Barras(o.filter(e=>e.st.comDados).slice(0,20).map(e=>({nome:e.faccao,v:e.st.media,k:e.k})))};}
 if(ag==='group'){const m=new Map();L.forEach(e=>{const k=org15GK(e.group);if(!m.has(k))m.set(k,{group:e.group,seg:e.segmento,fs:[]});m.get(k).fs.push(e)});
  const o=[...m.values()].map(g=>{const sd=dias.map((d,i)=>{const v=g.fs.map(e=>e.st.serie[i]).filter(v=>v!==null);return v.length?Math.max(...v):null}),vv=sd.filter(v=>v!==null);return {...g,vv,media:vv.length?vv.reduce((a,b)=>a+b,0)/vv.length:null,pico:vv.length?Math.max(...vv):null,pres:vv.filter(v=>v>0).length}}).sort((a,b)=>(b.media??-1)-(a.media??-1));
  return {titulo:'Relatório por Group',cab:['Group','Segmento','Facção(ões) no período','Dias com coleta','Dias com players','Dias na meta','Pico máximo','Média dos picos','Aproveitamento'],
   linhas:o.map(g=>[g.group,g.seg,g.fs.map(e=>e.faccao+(e.ex?' (saiu)':'')).join(', '),g.vv.length,g.pres,g.vv.filter(v=>v>=rh15Meta().min).length,rh15N(g.pico),rh15N(g.media),rh15Pct(g.media===null?null:g.media/rh15Meta().max)]),
   grafico:rh15Barras(o.filter(g=>g.vv.length).slice(0,20).map(g=>({nome:g.group,v:g.media})))};}
 if(ag==='segmento'){const segs=[...new Set(L.map(e=>e.segmento))],PA=rh15Filtrar(B.anterior.lista,{ex:cfg.ex});
  const o=segs.map(s=>{const fs=L.filter(e=>e.segmento===s),c=fs.filter(e=>e.st.comDados),vv=dias.map((d,i)=>rh15SomaDia(fs,i)).filter(v=>v!==null);
   const va=B.anterior.dias.map((d,i)=>rh15SomaDia(PA.filter(e=>e.segmento===s),i)).filter(v=>v!==null);
   const m=vv.length?vv.reduce((a,b)=>a+b,0)/vv.length:null,ma=va.length?va.reduce((a,b)=>a+b,0)/va.length:null;
   return {s,fs,c,m,ma,picoSoma:vv.length?Math.max(...vv):null,mediaFac:c.length?c.reduce((a,e)=>a+e.st.media,0)/c.length:null,pres:c.length?c.reduce((a,e)=>a+(e.st.aprov||0),0)/c.length:null}}).sort((a,b)=>(b.m??-1)-(a.m??-1));
  return {titulo:'Relatório por segmento',cab:['Segmento','Facções','Com coleta','Players/dia (média)','Período anterior','Variação','Players/dia (pico)','Média por facção','Aproveitamento médio'],
   linhas:o.map(x=>[x.s,x.fs.length,x.c.length,rh15N(x.m),rh15N(x.ma),rh15VarTxt(x.m,x.ma),rh15N(x.picoSoma),rh15N(x.mediaFac),rh15Pct(x.pres)]),
   grafico:rh15Barras(o.map((x,i)=>({nome:x.s,v:x.m,cor:RH15_CORES[i%RH15_CORES.length]})))};}
 if(ag==='dia'){const o=dias.map((d,i)=>{const v=L.map(e=>({e,v:e.st.serie[i]})).filter(x=>x.v!==null);const top=[...v].sort((a,b)=>b.v-a.v)[0];return {d,n:v.length,soma:v.reduce((a,x)=>a+x.v,0),pres:v.filter(x=>x.v>0).length,top}});
  return {titulo:'Total do Ilegal por dia',cab:['Dia','Facções com coleta','Facções com players','Soma dos picos','Maior facção do dia'],
   linhas:o.map(x=>[x.d.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'}),x.n,x.pres,x.n?x.soma:'—',x.top?`${x.top.e.faccao} (${x.top.v})`:'—']),
   grafico:rh15Linhas(dias,[{nome:'Soma dos picos',cor:'#9a4dff',vals:o.map(x=>x.n?x.soma:null)}],{altura:220})};}
 if(ag==='semana'){const nomes=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  const o=nomes.map((n,wd)=>{const idx=dias.map((d,i)=>d.getDay()===wd?i:-1).filter(i=>i>=0);const somas=idx.map(i=>rh15SomaDia(L,i)).filter(v=>v!==null);
   const porFac=L.map(e=>{const v=idx.map(i=>e.st.serie[i]).filter(v=>v!==null);return {e,m:v.length?v.reduce((a,b)=>a+b,0)/v.length:null}}).filter(x=>x.m!==null).sort((a,b)=>b.m-a.m)[0];
   return {n,dias:idx.length,m:somas.length?somas.reduce((a,b)=>a+b,0)/somas.length:null,max:somas.length?Math.max(...somas):null,top:porFac}});
  return {titulo:'Movimento por dia da semana',cab:['Dia da semana','Ocorrências no período','Players/dia (média)','Players/dia (máximo)','Facção mais forte nesse dia'],
   linhas:o.map(x=>[x.n,x.dias,rh15N(x.m),rh15N(x.max),x.top?`${x.top.e.faccao} (${rh15N(x.top.m)})`:'—']),
   grafico:rh15Barras(o.map((x,i)=>({nome:x.n,v:x.m,cor:RH15_CORES[i%RH15_CORES.length]})))};}
 if(ag==='horario'){const o=B.slotKeys.map(s=>{const a=[];const porDia=new Map();L.forEach(e=>e.dias.forEach((x,dk)=>{const v=+x.slots[s];if(Number.isFinite(v)){a.push(v);porDia.set(dk,(porDia.get(dk)||0)+v)}}));const pd=[...porDia.values()];
   const lider=L.map(e=>({e,v:e.st.porSlot[s]})).filter(x=>x.v!==null&&x.v!==undefined).sort((p,q)=>q.v-p.v)[0];
   return {s,n:a.length,media:a.length?a.reduce((p,q)=>p+q,0)/a.length:null,max:a.length?Math.max(...a):null,mediaDia:pd.length?pd.reduce((p,q)=>p+q,0)/pd.length:null,maxDia:pd.length?Math.max(...pd):null,lider}});
  return {titulo:'Movimento por horário de coleta',cab:['Horário','Coletas','Média por facção','Maior coleta de uma facção','Total do Ilegal (média)','Total do Ilegal (máximo)','Facção mais forte'],
   linhas:o.map(x=>[x.s,x.n,rh15N(x.media),rh15N(x.max),rh15N(x.mediaDia),rh15N(x.maxDia),x.lider?`${x.lider.e.faccao} (${rh15N(x.lider.v)})`:'—']),
   grafico:rh15Barras(o.map((x,i)=>({nome:x.s,v:x.mediaDia,cor:RH15_CORES[(i+1)%RH15_CORES.length]})))};}
 /* facção × dia */
 const linhas=[];[...L].sort((a,b)=>a.faccao.localeCompare(b.faccao,'pt-BR')).forEach(e=>dias.forEach(d=>{const x=e.dias.get(rh15DK(d));linhas.push([d.toLocaleDateString('pt-BR'),e.faccao,e.group,e.segmento,...B.slotKeys.map(k=>x&&x.slots[k]!==undefined?x.slots[k]:''),x?x.pico:'',x?rh15N(x.media):'',x?rh15Pct(x.pico/rh15Meta().max):'',x?({top:'TOPO DA META',ok:'NA META',low:'ABAIXO DA META',zero:'ZERADO'}[rh15Faixa(x.pico)]):'SEM COLETA'])}));
 return {titulo:'Picos diários por facção',cab:['Data','Facção','Group','Segmento',...B.slotKeys,'Pico do dia','Média do dia','% da meta','Situação'],linhas};
}
function rh15Vazio(t,p){return `<div class="placeholder"><b>◌</b><h3>${esc(t.toUpperCase())}</h3>${p?`<p>${esc(p)}</p>`:''}</div>`}

/* ---------- exportações ---------- */
/* ---------- impressão / PDF: documento com identidade da High ---------- */
const RH15_PRINT_CSS=`
@page{size:A4 landscape;margin:0}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
html,body{margin:0;background:#e9e5ee}
body{font-family:"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:#1d1626;font-size:11px;line-height:1.35}
.pg{width:297mm;height:210mm;margin:0 auto 10mm;background:#fff;position:relative;padding:0 0 14mm;box-shadow:0 4px 24px rgba(30,10,50,.15);page-break-after:always;overflow:hidden}
.pg:last-child{page-break-after:auto}
.top{display:flex;align-items:center;gap:16px;background:#160d20;color:#fff;padding:14px 22px;border-bottom:4px solid #8b3dff}
.top img{height:38px;width:auto}
.top .t1{font-size:9px;letter-spacing:2.4px;font-weight:700;color:#c9a6ff;text-transform:uppercase}
.top .t2{font-size:20px;font-weight:800;letter-spacing:.2px;margin-top:2px}
.top .t3{font-size:11px;color:#bfb2cf;margin-top:2px}
.top .r{margin-left:auto;text-align:right;font-size:10px;color:#bfb2cf;line-height:1.6}
.top .r b{color:#fff;font-size:12px}
.in{padding:16px 22px 0}
.kp{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-bottom:14px}
.kp.k4{grid-template-columns:repeat(4,1fr)}
.kp div{border:1px solid #e6dff0;border-radius:10px;padding:9px 12px;background:#faf8fd}
.kp span{display:block;font-size:8.5px;font-weight:800;letter-spacing:1.2px;color:#7a6c8c;text-transform:uppercase}
.kp b{display:block;font-size:20px;font-weight:800;margin-top:3px;color:#1d1626;font-variant-numeric:tabular-nums}
.kp small{font-size:9.5px;color:#8a7d9a}
.kp .ok b{color:#15803d}.kp .warn b{color:#b45309}
.fh{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:12px}
.fh h2{margin:0;font-size:24px;font-weight:800;letter-spacing:-.2px}
.fh .s{color:#6b5f7b;font-size:11.5px;margin-top:2px}
.badge{display:inline-block;padding:5px 12px;border-radius:999px;font-size:10px;font-weight:800;letter-spacing:.8px}
.badge.ok{background:#dcfce7;color:#166534}.badge.warn{background:#fef3c7;color:#92400e}.badge.bad{background:#fee2e2;color:#991b1b}
.chart{border:1px solid #ece6f3;border-radius:12px;padding:10px 12px 4px;background:#fff}
.leg{display:flex;gap:16px;flex-wrap:wrap;font-size:9.5px;color:#6b5f7b;margin:6px 2px 0}
.leg i{display:inline-block;width:12px;height:8px;border-radius:2px;margin-right:5px;vertical-align:0}
.leg i.ln{height:2px;background:#1d1626;vertical-align:3px}.leg i.av{height:0;border-top:2px dashed #dc2626;vertical-align:3px}
table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}
th{background:#f3eef9;color:#4b3d5e;text-align:left;padding:7px 8px;font-size:8.5px;letter-spacing:1px;text-transform:uppercase;border-bottom:2px solid #d9cce8}
td{padding:6px 8px;border-bottom:1px solid #efe9f5;font-size:10.5px;vertical-align:middle}
tr:nth-child(even) td{background:#fcfbfe}
td.n{text-align:right}th.n{text-align:right}
td b{font-weight:700}
.strip{display:grid;gap:2px;margin-top:10px}
.strip div{text-align:center;border-radius:4px;padding:3px 0;font-size:9px;font-weight:700;background:#f4f1f8;color:#9a8fa8}
.strip div em{display:block;font-style:normal;font-size:7.5px;font-weight:600;color:#9a8fa8}
.strip div.s-ok{background:#dcfce7;color:#166534}.strip div.s-top{background:#86efac;color:#14532d}.strip div.s-low{background:#fef3c7;color:#92400e}.strip div.s-zero{background:#fee2e2;color:#991b1b}.strip div.s-fut{background:#faf9fc;color:#d4cddc}
.ft{position:absolute;left:22px;right:22px;bottom:6mm;display:flex;justify-content:space-between;font-size:8.5px;color:#9a8fa8;border-top:1px solid #eee7f4;padding-top:5px}
.np{position:fixed;right:18px;top:14px;z-index:9;background:#8b3dff;color:#fff;border:0;border-radius:9px;padding:10px 16px;font-weight:800;font-size:12px;letter-spacing:.5px;cursor:pointer;box-shadow:0 6px 18px rgba(139,61,255,.35)}
.note{font-size:9.5px;color:#7a6c8c;margin-top:10px;line-height:1.5}
svg.rh15-mes{width:100%;height:auto;display:block}
svg .grid{stroke:#eee9f3}svg .ax{fill:#8a7d9a;font-size:10.5px}svg .ax.sm{font-size:8.5px}svg .ax.wk{fill:#7c3aed;font-weight:700}
svg .meta{fill:rgba(22,163,74,.07);stroke:rgba(22,163,74,.45);stroke-dasharray:5 4}svg .metat{fill:#15803d;font-size:10.5px;font-weight:800}
svg .b{fill:#a78bfa}svg .b.f-ok{fill:#4ade80}svg .b.f-top{fill:#16a34a}svg .b.f-low{fill:#fbbf24}svg .b.f-zero{fill:#f87171}svg .nd{fill:#e5e0ec}
svg .val{fill:#3b2f4a;font-size:10px;font-weight:800}
svg .line{stroke:#1d1626;stroke-width:2;stroke-linejoin:round}svg .dot{fill:#fff;stroke:#1d1626;stroke-width:1.6}
svg .avg{stroke:#dc2626;stroke-dasharray:7 5;stroke-width:1.4}svg .avgt{fill:#dc2626;font-size:10.5px;font-weight:800}svg .avgbg{fill:#fff;stroke:#fecaca}
svg.spark rect.ok{fill:#4ade80}svg.spark rect.top{fill:#16a34a}svg.spark rect.low{fill:#fbbf24}svg.spark rect.zero{fill:#f87171}svg.spark rect.na{fill:#e5e0ec}
@media print{html,body{background:#fff}.pg{margin:0;box-shadow:none}.np{display:none}}
`;
function rh15PrintAbrir(titulo,paginas){
 const w=window.open('','_blank');if(!w){alert('O navegador bloqueou a janela do relatório. Libere pop-ups para o High OS.');return}
 w.document.open();w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(titulo)}</title><style>${RH15_PRINT_CSS}</style></head><body><button class="np" onclick="window.print()">IMPRIMIR / SALVAR PDF</button>${paginas}</body></html>`);w.document.close();
}
function rh15PrintTopo(titulo,sub){
 const logo=new URL('assets/high_logo.png',location.href).href;
 return `<div class="top"><img src="${logo}" alt="High"><div><div class="t1">High OS • Central RH de Métricas</div><div class="t2">${esc(titulo)}</div><div class="t3">${esc(sub)}</div></div><div class="r">Gerado em<br><b>${new Date().toLocaleDateString('pt-BR')}</b> ${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div></div>`;
}
const rh15PrintRodape=(pag,total)=>`<div class="ft"><span>High OS • Central RH de Métricas • pico diário = maior coleta do dia; a métrica acompanha a facção que ocupava o Group no horário</span><span>Página ${pag} de ${total}</span></div>`;
function rh15PrintSpark(dias,e){
 const hoje=rh15Hoje(),n=dias.length,w=n*5,max=Math.max(rh15Meta().max,...dias.map(d=>e.dias.get(rh15DK(d))?.pico||0));
 return `<svg class="spark" viewBox="0 0 ${w} 22" width="${Math.min(150,w)}" height="22">${dias.map((d,i)=>{const v=e.dias.get(rh15DK(d))?.pico;if(d>hoje)return '';if(v===undefined)return `<rect x="${i*5}" y="20" width="4" height="2" class="na"/>`;const h=Math.max(2,v/max*21);return `<rect x="${i*5}" y="${22-h}" width="4" height="${h}" class="${rh15Faixa(v)}"/>`}).join('')}</svg>`;
}
function rh15Situacao(st){const M=rh15Meta();if(!st.comDados)return ['bad','SEM COLETA'];if(st.media>=M.min)return ['ok','NA META'];if(st.media>=M.min*.7)return ['warn','PRÓXIMO DA META'];return ['bad','ABAIXO DA META']}
function rh15ImprimirGraficos(B,L,selFixa){
 const dias=rh15DiasMes(B),sel=selFixa!==undefined?selFixa:(rh15.rep.fac||''),M=rh15Meta(),hoje=rh15Hoje();
 const ord=[...L].filter(e=>e.st.comDados&&(!sel||e.k===sel)).sort((a,b)=>(b.st.media??-1)-(a.st.media??-1));
 if(!ord.length)return alert('Nenhuma facção com coleta no período.');
 const resumo=!sel&&ord.length>1;let pag=0,total=0;
 const sub=`${B.r.rotulo} • meta de pico ${rh15MetaTxt()} pessoas${rh15.seg?` • ${rh15.seg}`:''}`;
 let html='';
 const POR=13,blocos=[];if(resumo)for(let k=0;k<ord.length;k+=POR)blocos.push(ord.slice(k,k+POR));
 total=ord.length+blocos.length;
 if(resumo){const media=ord.reduce((a,e)=>a+e.st.media,0)/ord.length,naMeta=ord.filter(e=>e.st.media>=M.min).length;
  blocos.forEach((bl,bi)=>{pag++;
  html+=`<section class="pg">${rh15PrintTopo('Relatório mensal por facção',sub)}<div class="in">
${bi===0?`<div class="kp k4"><div><span>Facções avaliadas</span><b>${ord.length}</b><small>com coleta no período</small></div><div><span>Média geral de pico</span><b>${rh15N(media)}</b><small>por facção</small></div><div class="ok"><span>Na meta</span><b>${naMeta}</b><small>média ≥ ${M.min}</small></div><div class="warn"><span>Abaixo da meta</span><b>${ord.length-naMeta}</b><small>média &lt; ${M.min}</small></div></div>`:''}
<table><thead><tr><th>#</th><th>Facção</th><th>Group</th><th>Segmento</th><th>Dia a dia</th><th class="n">Média</th><th class="n">Pico</th><th class="n">Dias na meta</th><th class="n">Aproveit.</th><th class="n">Constância</th><th>Situação</th></tr></thead><tbody>
${bl.map((e,ii)=>{const st=e.st,[c,t]=rh15Situacao(st);return `<tr><td>${bi*POR+ii+1}</td><td><b>${esc(e.faccao)}</b></td><td>${esc(e.group)}</td><td>${esc(e.segmento)}</td><td>${rh15PrintSpark(dias,e)}</td><td class="n"><b>${rh15N(st.media)}</b></td><td class="n">${rh15N(st.pico)}</td><td class="n">${st.diasMeta}/${st.total}</td><td class="n">${rh15Pct(st.aprov)}</td><td class="n">${rh15Pct(st.regularidade)}</td><td><span class="badge ${c}">${t}</span></td></tr>`}).join('')}
</tbody></table>${bi===blocos.length-1?`<div class="note">Ordenado pela média de pico. Aproveitamento = média dos picos ÷ ${M.max}. Constância = quanto o pico se mantém de um dia para o outro (100% = sempre igual). Nas páginas seguintes, o gráfico dia a dia de cada facção.</div>`:''}</div>${rh15PrintRodape(pag,'__TOTAL__')}</section>`});}
 ord.forEach(e=>{pag++;const st=e.st,[c,t]=rh15Situacao(st),abaixo=dias.filter(d=>{const v=e.dias.get(rh15DK(d))?.pico;return v!==undefined&&v<M.min}).length;
  const strip=`<div class="strip" style="grid-template-columns:repeat(${dias.length},1fr)">${dias.map(d=>{const v=e.dias.get(rh15DK(d))?.pico;const cls=d>hoje?'s-fut':v===undefined?'':'s-'+rh15Faixa(v);return `<div class="${cls}"><em>${d.getDate()}</em>${d>hoje?'':v===undefined?'–':v}</div>`}).join('')}</div>`;
  html+=`<section class="pg">${rh15PrintTopo('Relatório mensal por facção',sub)}<div class="in">
<div class="fh"><div><h2>${esc(e.faccao)}</h2><div class="s">${esc(e.group)} • ${esc(e.segmento)}${e.ex?' • saiu do Group no período':''}${st.ultima?` • última presença ${rh15Br(st.ultima)}`:''}</div></div><span class="badge ${c}">${t}</span></div>
<div class="kp"><div><span>Média de pico</span><b>${rh15N(st.media)}</b><small>meta ${rh15MetaTxt()}</small></div><div><span>Maior pico</span><b>${rh15N(st.pico)}</b><small>menor ${rh15N(st.minimo)}</small></div><div class="${st.diasMeta>=st.total/2?'ok':'warn'}"><span>Dias na meta</span><b>${st.diasMeta}/${st.total}</b><small>pico ≥ ${M.min}</small></div><div class="${abaixo?'warn':''}"><span>Dias abaixo</span><b>${abaixo}</b><small>pico &lt; ${M.min}</small></div><div><span>Aproveitamento</span><b>${rh15Pct(st.aprov)}</b><small>média ÷ ${M.max}</small></div><div><span>Constância</span><b>${rh15Pct(st.regularidade)}</b><small>${st.forte?`mais forte às ${esc(st.forte)}`:'&nbsp;'}</small></div></div>
<div class="chart">${rh15GraficoMes(dias,e,{print:true})}<div class="leg"><span><i style="background:rgba(22,163,74,.15);border:1px dashed #16a34a"></i>faixa da meta (${rh15MetaTxt()})</span><span><i style="background:#16a34a"></i>pico no topo da meta (≥ ${M.max})</span><span><i style="background:#4ade80"></i>pico na meta</span><span><i style="background:#fbbf24"></i>abaixo da meta</span><span><i class="ln"></i>constância (liga os picos)</span><span><i class="av"></i>média do período</span><span><i style="background:#e5e0ec"></i>sem coleta</span></div></div>
${strip}</div>${rh15PrintRodape(pag,total)}</section>`});
 rh15PrintAbrir(`Relatório mensal por facção — ${B.r.rotulo}`,html.split('__TOTAL__').join(String(total)));
}
function rh15Imprimir(titulo,sub,cab,linhas){
 const porPag=22,blocos=[];for(let i=0;i<Math.max(1,linhas.length);i+=porPag)blocos.push(linhas.slice(i,i+porPag));
 const num=c=>/^[-+−▲▼]?\s?[\d.,]+%?$|^—$/.test(String(c).trim());
 const html=blocos.map((b,bi)=>`<section class="pg">${rh15PrintTopo(titulo,sub)}<div class="in"><table><thead><tr>${cab.map((c,i)=>`<th class="${i&&b.length&&num(b[0][i])?'n':''}">${esc(c)}</th>`).join('')}</tr></thead><tbody>${b.map(l=>`<tr>${l.map((c,i)=>`<td class="${i&&num(c)?'n':''}">${i===0||i===1?`<b>${esc(c)}</b>`:esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>${bi===blocos.length-1?`<div class="note">Variação comparada ao período anterior de mesmo tamanho. Aproveitamento = média dos picos ÷ ${rh15Meta().max} (meta de ${rh15MetaTxt()} pessoas por facção).</div>`:''}</div>${rh15PrintRodape(bi+1,blocos.length)}</section>`).join('');
 rh15PrintAbrir(titulo,html);
}
function rh15Exportar(tipo){
 const B=rh15Base(),stamp=(B.r.mes||rh15DK(B.r.ini)+'_'+rh15DK(B.r.fim)).replace(/-/g,'');
 if(tipo.startsWith('rank')){const L=rh15Ordenar(rh15Filtrar(B.lista));
  const cab=['#','Facção','Group','Segmento','Dias com players','Dias na meta','Dias no período','Aproveitamento','Média dos picos','Média anterior','Variação','Mediana','Pico','Média por coleta','Regularidade','Horário forte','Última presença'];
  const linhas=L.map((e,i)=>[i+1,e.faccao+(e.ex?' (saiu)':''),e.group,e.segmento,e.st.presentes,e.st.diasMeta,e.st.total,rh15Pct(e.st.aprov),rh15N(e.st.media),rh15N(e.ant?.media??null),rh15VarTxt(e.st.media,e.ant?.media??null),rh15N(e.st.mediana),rh15N(e.st.pico),rh15N(e.st.mediaColetas),rh15Pct(e.st.regularidade),e.st.forte||'—',e.st.ultima?rh15Br(e.st.ultima):'—']);
  const ordRot=(RH15_ORDENS.find(o=>o[0]===rh15.ord)||[])[1]||'';
  if(tipo==='rank-csv')return org15Csv(`ranking_faccoes_${stamp}.csv`,cab,linhas);
  return rh15Imprimir(`Ranking das facções — ${B.r.rotulo}`,`${rh15.seg||'Todos os segmentos'} • meta ${rh15MetaTxt()} • classificado por ${ordRot} • comparação com ${B.ra.rotulo}`,cab,linhas);}
 if(tipo==='picos-csv'){const T=rh15RelTabela(B,rh15Filtrar(B.lista).filter(e=>e.st.comDados),{agrupar:'faccaodia'});return org15Csv(`picos_diarios_${stamp}.csv`,T.cab,T.linhas)}
 if(tipo.startsWith('fac')){const e=B.lista.find(x=>x.k===rh15.fac);if(!e)return;
  const T=rh15RelTabela(B,[e],{agrupar:'faccaodia'});
  if(tipo==='fac-csv')return org15Csv(`metricas_${rh15K(e.faccao)}_${stamp}.csv`,T.cab,T.linhas);
  return rh15ImprimirGraficos(B,[e],e.k);}
 if(tipo==='rep-pdf'&&rh15.rep.agrupar==='faccao')return rh15ImprimirGraficos(B,rh15RelLista(B,rh15.rep),'');
 if(tipo.startsWith('rep')&&rh15.rep.agrupar==='grafico'){const L=rh15RelLista(B,rh15.rep).filter(e=>!rh15.rep.fac||e.k===rh15.rep.fac);
  if(tipo==='rep-pdf')return rh15ImprimirGraficos(B,L);
  const T=rh15RelTabela(B,L,{agrupar:'faccaodia'});return org15Csv(`picos_mensais_por_faccao_${stamp}.csv`,T.cab,T.linhas)}
 if(tipo.startsWith('rep')){const cfg=rh15.rep,T=rh15RelTabela(B,rh15RelLista(B,cfg),cfg);
  if(tipo==='rep-csv')return org15Csv(`${rh15K(T.titulo)}_${stamp}.csv`,T.cab,T.linhas);
  return rh15Imprimir(`${T.titulo} — ${B.r.rotulo}`,`${rh15.seg||'Todos os segmentos'} • ${T.linhas.length} linha(s)`,T.cab,T.linhas);}
}

/* ---------- montagem ---------- */
function rh15Controles(){
 const per=$('#rh15Periodo');if(!per)return;
 const meses=rh15Meses(),h=rh15Hoje(),atual=`${h.getFullYear()}-${String(h.getMonth()+1).padStart(2,'0')}`;
 per.innerHTML=`<optgroup label="Competência">${meses.map(m=>`<option value="mes:${m}">${rh15MesRot(m)}${m===atual?' • atual':''}</option>`).join('')}</optgroup><optgroup label="Atalhos"><option value="dias:7">Últimos 7 dias</option><option value="dias:15">Últimos 15 dias</option><option value="dias:30">Últimos 30 dias</option><option value="intervalo">Intervalo personalizado…</option></optgroup>`;
 if(rh15.per==='mes:atual')rh15.per='mes:'+atual;
 if(![...per.options].some(o=>o.value===rh15.per))rh15.per='mes:'+atual;
 per.value=rh15.per;
 const iv=$('#rh15Intervalo');if(iv)iv.classList.toggle('hidden',rh15.per!=='intervalo');
 if($('#rh15Ini'))$('#rh15Ini').value=rh15.ini||rh15DK(new Date(h.getFullYear(),h.getMonth(),1));
 if($('#rh15Fim'))$('#rh15Fim').value=rh15.fim||rh15DK(h);
 const seg=$('#rh15Seg');if(seg){const segs=[...new Set((RH15_FACCOES()||[]).filter(f=>!f.removido).map(f=>String(f.segmento||orgV92Segment(f)||'').toUpperCase()).filter(Boolean))].sort();
  seg.innerHTML=`<option value="">Todos</option>${segs.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('')}`;seg.value=segs.includes(rh15.seg)?rh15.seg:'';rh15.seg=seg.value}
 document.querySelectorAll('[data-rh15-tab]').forEach(b=>b.classList.toggle('active',b.dataset.rh15Tab===rh15.tab));
 const M=rh15Meta();if($('#rh15MetaMin'))$('#rh15MetaMin').value=M.min;if($('#rh15MetaMax'))$('#rh15MetaMax').value=M.max;
}
function rh15Render(){
 const host=$('#rh15Main');if(!host)return;
 rh15Controles();
 const legado=$('#rh15Legado');
 if(rh15.tab==='avancado'){host.innerHTML='';host.classList.add('hidden');legado?.classList.remove('hidden');if($('#rh15Info'))$('#rh15Info').textContent='';return}
 host.classList.remove('hidden');legado?.classList.add('hidden');
 let B;try{B=rh15Base()}catch(e){console.error('[RH] falha ao montar a base',e);host.innerHTML=rh15Vazio('Erro ao ler as métricas',e?.message||String(e));return}
 const info=$('#rh15Info');if(info)info.textContent=`${B.r.rotulo} · ${B.dias.length} dia(s) · ${B.lista.filter(e=>e.st.comDados).length} facção(ões) com coleta · comparação com ${B.ra.rotulo}${(RH15_METRICAS()||[]).length?'':' · aguardando métricas carregarem'}`;
 host.innerHTML=rh15.tab==='ranking'?rh15Ranking(B):rh15.tab==='picos'?rh15Picos(B):rh15.tab==='faccao'?rh15Faccao(B):rh15.tab==='relatorios'?rh15Relatorio(B):rh15Painel(B);
 host.querySelectorAll('[data-rh15-fac]').forEach(b=>b.onclick=()=>{rh15.fac=b.dataset.rh15Fac;rh15.tab='faccao';rh15Salvar();rh15Render();host.scrollIntoView({behavior:'smooth',block:'start'})});
 host.querySelectorAll('.rh15-legend.inter').forEach(lg=>{const card=lg.closest('.rh15-card'),svg=card?.querySelector('svg');lg.querySelectorAll('[data-rh15-serie]').forEach(b=>b.onclick=()=>{const v=b.dataset.rh15Serie;const gs=[...svg.querySelectorAll('g.rh15-s')];
  if(v==='all'||v==='none'){gs.forEach(g=>g.classList.toggle('off',v==='none'));lg.querySelectorAll('[data-rh15-serie]:not(.all)').forEach(x=>x.classList.toggle('off',v==='none'));return}
  const g=svg.querySelector(`g.rh15-s[data-i="${v}"]`);g?.classList.toggle('off');b.classList.toggle('off',g?.classList.contains('off'))});
  lg.querySelectorAll('[data-rh15-serie]:not(.all)').forEach(b=>{b.onmouseenter=()=>{svg.classList.add('focus');svg.querySelector(`g.rh15-s[data-i="${b.dataset.rh15Serie}"]`)?.classList.add('hl')};b.onmouseleave=()=>{svg.classList.remove('focus');svg.querySelectorAll('g.hl').forEach(g=>g.classList.remove('hl'))}})});
 host.querySelectorAll('[data-rh15-seg]').forEach(r=>r.onclick=()=>{rh15.seg=r.dataset.rh15Seg;rh15Salvar();rh15Render()});
 host.querySelectorAll('[data-rh15-exp]').forEach(b=>b.onclick=()=>{try{rh15Exportar(b.dataset.rh15Exp)}catch(e){alert('Não foi possível exportar: '+(e?.message||e))}});
 host.querySelectorAll('[data-rh15-slot]').forEach(b=>b.onclick=()=>{rh15.heatSlot=b.dataset.rh15Slot;rh15Salvar();rh15Render()});
 host.querySelector('#rh15Ord')?.addEventListener('change',e=>{rh15.ord=e.target.value;rh15Salvar();rh15Render()});
 host.querySelector('#rh15FacSel')?.addEventListener('change',e=>{rh15.fac=e.target.value;rh15Salvar();rh15Render()});
 host.querySelector('#rh15RepAgrupar')?.addEventListener('change',e=>{rh15.rep.agrupar=e.target.value;rh15Salvar();rh15Render()});
 host.querySelector('#rh15RepFac')?.addEventListener('change',e=>{rh15.rep.fac=e.target.value;rh15Salvar();rh15Render()});
 host.querySelector('#rh15RepEx')?.addEventListener('change',e=>{rh15.rep.ex=e.target.checked;rh15Salvar();rh15Render()});
 host.querySelector('#rh15TxtGroup')?.addEventListener('change', e=>{rh15.txtGroup=e.target.value;rh15Salvar();rh15Render()});
 const txtStatus=host.querySelector('#rh15TxtStatus');
 const txtPreview=host.querySelector('#rh15TxtPreview');
 const txtStatusOK=(r,acao)=>{if(txtPreview)txtPreview.value=r.texto;if(txtStatus)txtStatus.textContent=acao+' • '+r.total+' facção(ões) • '+r.registradas+'/'+r.previstas+' coletas registradas.'};
 const txtStatusErro=e=>{if(txtStatus)txtStatus.textContent='Não foi possível gerar o TXT: '+(e?.message||e)};
 host.querySelector('#rh15TxtPreviewBtn')?.addEventListener('click',()=>{try{txtStatusOK(rh15TxtMontar(B),'PRÉVIA GERADA')}catch(e){txtStatusErro(e)}});
 host.querySelector('#rh15TxtDownloadBtn')?.addEventListener('click',()=>{try{txtStatusOK(rh15TxtBaixar(B),'TXT BAIXADO')}catch(e){txtStatusErro(e)}});
 host.querySelector('#rh15TxtCopyBtn')?.addEventListener('click',async()=>{try{txtStatusOK(await rh15TxtCopiar(B),'TEXTO COPIADO')}catch(e){txtStatusErro(e)}});

 const presets={'grafico-mensal':'grafico','mensal-faccao':'faccao','mensal-segmento':'segmento','mensal-group':'group','picos-diarios':'faccaodia','horarios':'horario','semana':'semana','ilegal-dia':'dia'};
 host.querySelectorAll('[data-rh15-preset]').forEach(b=>b.onclick=()=>{const p=b.dataset.rh15Preset;rh15.rep.agrupar=presets[p];if((p.startsWith('mensal')||p==='grafico-mensal')&&!String(rh15.per).startsWith('mes:'))rh15.per='mes:atual';rh15Salvar();rh15Render()});
}
function rh15Ligar(){
 document.querySelectorAll('[data-rh15-tab]').forEach(b=>b.onclick=()=>{rh15.tab=b.dataset.rh15Tab;rh15Salvar();rh15Render()});
 $('#rh15Periodo')?.addEventListener('change',e=>{rh15.per=e.target.value;rh15Salvar();rh15Render()});
 ['#rh15Ini','#rh15Fim'].forEach(id=>$(id)?.addEventListener('change',()=>{rh15.ini=$('#rh15Ini').value;rh15.fim=$('#rh15Fim').value;rh15Salvar();rh15Render()}));
 $('#rh15Seg')?.addEventListener('change',e=>{rh15.seg=e.target.value;rh15Salvar();rh15Render()});
 ['#rh15MetaMin','#rh15MetaMax'].forEach(id=>$(id)?.addEventListener('change',()=>{rh15.metaMin=+$('#rh15MetaMin').value||15;rh15.metaMax=+$('#rh15MetaMax').value||20;if(rh15.metaMax<rh15.metaMin)rh15.metaMax=rh15.metaMin;rh15Salvar();rh15Render()}));
 let t;$('#rh15Busca')?.addEventListener('input',e=>{clearTimeout(t);t=setTimeout(()=>{rh15.q=e.target.value;rh15Render()},180)});
}
rh15Ligar();
{const _rmRh15=renderMetrics;renderMetrics=function(...a){const out=_rmRh15.apply(this,a);try{if($('#page-metricas')?.classList.contains('active')||!$('#rh15Main')?.innerHTML)rh15Render()}catch(e){console.warn('[RH]',e)}return out}}
document.querySelectorAll('.nav-item[data-page="metricas"]').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>{try{rh15Render()}catch(_){}},0)));
setTimeout(()=>{try{rh15Render()}catch(e){console.warn('[RH]',e)}},0);

/* ===== HIGH OS V14.6 · DIÁRIO OPERACIONAL =====
   Agenda do dia = a mesma do post "📅 AGENDA DO DIA" do bot (/v1/agenda):
   cronograma padrão do Ilegal + eventos do Discord + extras/reagendados.
   Cruza com os registros feitos no Discord (diario_operacional) para mostrar
   o que já foi realizado, o que está acontecendo agora e o que ficou pendente. */
const DG_ICON={evento:'🏆',relampago:'⚡',oficial:'⚔️',visita:'📍',reuniao:'🤝',especial:'⭐',geral:'📌'};
const DG_LABEL={oficial:'DIA OFICIAL',relampago:'RELÂMPAGO',visita:'VISITA',especial:'ESPECIAL',evento:'EVENTO',reuniao:'REUNIÃO',geral:'ATIVIDADE'};
let dgTimer=null,dgData=null;
const dgNorm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
function dgAgoraBr(){const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).map(x=>[x.type,x.value]));return {date:`${p.year}-${p.month}-${p.day}`,min:(+p.hour)*60+(+p.minute)}}
const dgMin=t=>{const m=String(t||'').match(/^(\d{1,2}):(\d{2})/);return m?(+m[1])*60+(+m[2]):null};
const dgFmtMin=m=>m<60?`${m} min`:`${Math.floor(m/60)}h${String(m%60).padStart(2,'0')}`;
function dgDiaLongo(date){const d=new Date(date+'T12:00:00');return d.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}).replace(/^./,c=>c.toUpperCase())}
function dgShift(date,n){const d=new Date(date+'T12:00:00');d.setDate(d.getDate()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}

async function dgCarregar(date){
 let agenda=[],fonte='Bot do Discord',erroAgenda='';
 const [ag,regs]=await Promise.allSettled([highOsDiscordRequest('/v1/agenda?date='+encodeURIComponent(date)),highOsStoreList('diario_operacional')]);
 if(ag.status==='fulfilled'&&ag.value?.ok){agenda=ag.value.items||[];fonte=ag.value.source||fonte}
 else{erroAgenda=ag.reason?.message||'';
  /* bot ainda sem a rota nova: usa só o cronograma extra salvo */
  try{const sch=await highOsStoreList('cronograma_operacional');const day=diaryWeekday(date);
   agenda=sch.filter(x=>x.active!==false&&(!x.date||x.date===date)&&dgNorm(x.day)===dgNorm(day)).map(x=>({time:x.time,name:x.name,type:x.type||'geral',typeLabel:DG_LABEL[x.type]||'ATIVIDADE',durationMinutes:x.durationMinutes||15,extraordinary:x.extraordinary}));fonte='Cronograma extra (bot sem /v1/agenda)'}catch(_){}
 }
 const registros=regs.status==='fulfilled'?regs.value.filter(x=>String(x.date||'')===date).sort((a,b)=>String(a.time||'').localeCompare(String(b.time||''))):[];
 agenda.sort((a,b)=>String(a.time||'').localeCompare(String(b.time||'')));
 /* liga cada atividade ao registro feito no Discord */
 const usados=new Set();
 agenda.forEach(a=>{const r=registros.find(r=>!usados.has(r)&&((r.scheduleName&&dgNorm(r.scheduleName)===dgNorm(a.name)&&(!r.scheduleTime||r.scheduleTime===a.time))||(dgNorm(r.title)===dgNorm(a.name))));if(r){usados.add(r);a.reg=r}});
 return {date,agenda,registros,avulsos:registros.filter(r=>!usados.has(r)),fonte,erroAgenda};
}
function dgStatus(a,date){
 const now=dgAgoraBr(),ini=dgMin(a.time),dur=+a.durationMinutes||15;
 if(a.reg)return 'feito';
 if(date<now.date)return 'pendente';
 if(date>now.date||ini===null)return 'agendado';
 if(now.min>=ini&&now.min<ini+dur)return 'agora';
 if(now.min>=ini+dur)return 'pendente';
 return 'agendado';
}
function dgRender(){
 const D=dgData,box=$('#dgMain');if(!D||!box)return;
 const now=dgAgoraBr(),hoje=D.date===now.date;
 D.agenda.forEach(a=>a.st=dgStatus(a,D.date));
 const prox=hoje?D.agenda.find(a=>a.st==='agendado'&&dgMin(a.time)>now.min):null;
 const agora=D.agenda.find(a=>a.st==='agora');
 const feitos=D.agenda.filter(a=>a.st==='feito').length,pend=D.agenda.filter(a=>a.st==='pendente').length,tot=D.agenda.length;
 const pct=tot?Math.round(feitos/tot*100):0;
 const porTipo=Object.entries(D.agenda.reduce((m,a)=>{m[a.type]=(m[a.type]||0)+1;return m},{}));
 let destaque='';
 if(agora)destaque=`<div class="dg-live now"><span class="dg-pulse"></span><div><small>ACONTECENDO AGORA</small><b>${DG_ICON[agora.type]||'📌'} ${esc(agora.name)}</b><em>começou às ${esc(agora.time)} · registre o resultado no Discord ao terminar</em></div></div>`;
 else if(prox){const falta=dgMin(prox.time)-now.min;destaque=`<div class="dg-live next"><span class="dg-clock">⏱</span><div><small>PRÓXIMA ATIVIDADE</small><b>${DG_ICON[prox.type]||'📌'} ${esc(prox.name)} <span>às ${esc(prox.time)}</span></b><em>começa em <strong>${dgFmtMin(falta)}</strong> · aviso automático no Discord 15 min antes</em></div></div>`}
 else if(hoje&&tot)destaque=`<div class="dg-live done"><span class="dg-clock">✓</span><div><small>DIA ENCERRADO</small><b>${feitos} de ${tot} atividades registradas</b><em>${pend?`${pend} sem registro — use /highos diario no Discord para resolver`:'tudo registrado no Discord'}</em></div></div>`;
 box.innerHTML=`
<div class="dg-kpis">
 <div class="dg-kpi"><span>AGENDA DO DIA</span><b>${tot}</b><small>${porTipo.map(([t,n])=>`${DG_ICON[t]||'📌'} ${n}`).join('  ')||'—'}</small></div>
 <div class="dg-kpi ok"><span>REALIZADAS</span><b>${feitos}</b><small>registradas no Discord</small></div>
 <div class="dg-kpi ${pend?'warn':''}"><span>SEM REGISTRO</span><b>${pend}</b><small>${pend?'passaram do horário':'nenhuma pendência'}</small></div>
 <div class="dg-kpi"><span>REGISTROS DO DIA</span><b>${D.registros.length}</b><small>${D.avulsos.length?`${D.avulsos.length} fora da agenda`:'todos ligados à agenda'}</small></div>
</div>
<div class="dg-progress"><div class="dg-bar"><i style="--w:${pct}%"></i></div><span>${pct}% da agenda registrada</span></div>
${destaque}
<section class="dg-card"><header><b>Agenda do dia</b><small>Fonte: ${esc(D.fonte)}</small></header>
${tot?`<ol class="dg-timeline">${D.agenda.map((a,i)=>`<li class="dg-item st-${a.st}" style="--i:${i}">
 <div class="dg-time">${esc(a.time||'—')}</div>
 <div class="dg-node"><span>${DG_ICON[a.type]||'📌'}</span></div>
 <div class="dg-body"><div class="dg-title"><b>${esc(a.name)}</b><span class="dg-type t-${esc(a.type)}">${esc(a.typeLabel||DG_LABEL[a.type]||'ATIVIDADE')}</span>${a.extraordinary?'<span class="dg-type t-extra">EXTRA</span>':''}</div>
 ${a.reg?`<div class="dg-result">${a.reg.winner?`<span>🏅 <b>${esc(a.reg.winner)}</b></span>`:''}${a.reg.prize?`<span>🎁 ${esc(a.reg.prize)}</span>`:''}${a.reg.quantity?`<span>Qtd. ${esc(a.reg.quantity)}</span>`:''}${a.reg.result?`<span class="txt">${esc(a.reg.result)}</span>`:''}<span class="by">registrado por ${esc(a.reg.createdByName||'staff')}${a.reg.time?` às ${esc(a.reg.time)}`:''}</span></div>`:''}
 </div>
 <div class="dg-status">${{feito:'<span class="dg-pill ok">✓ REALIZADO</span>',agora:'<span class="dg-pill live">● AGORA</span>',pendente:'<span class="dg-pill warn">SEM REGISTRO</span>',agendado:'<span class="dg-pill">AGENDADO</span>'}[a.st]}</div>
</li>`).join('')}</ol>`:`<div class="placeholder"><b>▦</b><h3>NADA NA AGENDA DESTA DATA</h3><p>${D.erroAgenda?esc(D.erroAgenda):'O bot não tem atividades programadas para este dia.'}</p></div>`}
</section>
${D.avulsos.length?`<section class="dg-card"><header><b>Registros fora da agenda</b><small>Feitos no Discord sem atividade correspondente no cronograma</small></header><div class="dg-avulsos">${D.avulsos.map((r,i)=>`<article style="--i:${i}"><div class="t">${esc(r.time||'—')}</div><div><b>${esc(r.title||'Registro')}</b><small>${esc(String(r.type||'geral').toUpperCase())}${r.winner?' · 🏅 '+esc(r.winner):''}${r.prize?' · 🎁 '+esc(r.prize):''}${r.createdByName?' · por '+esc(r.createdByName):''}</small>${r.result?`<p>${esc(r.result)}</p>`:''}</div></article>`).join('')}</div></section>`:''}`;
}
async function loadOperationalDiaryV146(){
 const inp=$('#dgDate');const date=(inp&&inp.value)||diaryTodayIso();if(inp&&!inp.value)inp.value=date;
 const lbl=$('#dgDayLabel');if(lbl)lbl.textContent=dgDiaLongo(date);
 const box=$('#dgMain');if(box&&!dgData)box.innerHTML='<div class="dg-skeleton"><i></i><i></i><i></i><i></i></div>';
 try{dgData=await dgCarregar(date);dgRender();operationalDiaryLoaded=true}
 catch(e){if(box)box.innerHTML=`<div class="placeholder"><h3>ERRO AO CARREGAR</h3><p>${esc(e.message||String(e))}</p></div>`}
 clearInterval(dgTimer);dgTimer=setInterval(()=>{if($('#page-diario')?.classList.contains('active'))dgRender()},30000);
}
loadOperationalDiary=loadOperationalDiaryV146;
$('#dgDate')?.addEventListener('change',()=>{dgData=null;loadOperationalDiaryV146()});
$('#dgToday')?.addEventListener('click',()=>{$('#dgDate').value=diaryTodayIso();dgData=null;loadOperationalDiaryV146()});
$('#dgPrev')?.addEventListener('click',()=>{$('#dgDate').value=dgShift($('#dgDate').value||diaryTodayIso(),-1);dgData=null;loadOperationalDiaryV146()});
$('#dgNext')?.addEventListener('click',()=>{$('#dgDate').value=dgShift($('#dgDate').value||diaryTodayIso(),1);dgData=null;loadOperationalDiaryV146()});
$('#dgRefresh')?.addEventListener('click',()=>loadOperationalDiaryV146());

/* ===== HIGH OS V12.7 - MISSOES NA NUVEM: UM DOCUMENTO POR ZONA =====
   Até a V12.6 todas as zonas ficavam em UM documento (config/missoes_planejador),
   gravado inteiro a cada SALVAR. Isso causava três problemas:
   - quem salvava por último sobrescrevia o trabalho de outra pessoa;
   - excluir não ia para a nuvem e a zona voltava depois;
   - o documento crescia até o limite de 1 MB do Firestore.
   Agora cada zona é um documento em highos/data/missoes_zonas/{zona}:
   - campo "rev": número da versão; só grava quem está na versão atual;
   - exclusão vira marcador (deleted:true) que todos os navegadores respeitam
     e guarda o último conteúdo (lixeira);
   - o documento antigo fica intacto, só para leitura, como cópia de segurança. */
const missionsDoc=doc(db,'highos','data','config','missoes_planejador'); // legado · somente leitura
const missionZonesCol=collection(db,'highos','data','missoes_zonas');
const missionMigrationDoc=doc(db,'highos','data','config','missoes_migracao');

let missionCloudLastPullAt=0,
missionCloudLastPull=null,
missionCloudMigrated=false;
const MISSION_PULL_TTL=120000;
const MISSION_MAX_JSON=900000;

function missionEmail(){return String(currentUser?.email||'').toLowerCase();}
function missionDocId(id){
 const s=String(id||'');
 if(/^[A-Za-z0-9_.\-]{1,150}$/.test(s)&&s!=='.'&&s!=='..')return s;
 let h=5381;for(let i=0;i<s.length;i++)h=((h*33)^s.charCodeAt(i))>>>0;
 return 'z_'+h.toString(36)+'_'+s.replace(/[^A-Za-z0-9_\-]/g,'').slice(0,60);
}
function missionZoneRef(id){return doc(db,'highos','data','missoes_zonas',missionDocId(id));}
function missionCleanZone(z){
 const x=JSON.parse(JSON.stringify(z||{}));
 delete x._rev;delete x._syncConflict;
 return x;
}
function missionSnapToEntry(snap){
 const x=snap.data()||{};
 let zona=null;
 if(!x.deleted){try{zona=JSON.parse(x.json||'null')}catch(e){zona=null}}
 return {id:String(x.zonaId||snap.id),rev:Number(x.rev)||0,deleted:!!x.deleted,zona,
  updatedAtText:x.updatedAtText||'',updatedBy:x.updatedBy||'',
  deletedAtText:x.deletedAtText||'',deletedBy:x.deletedBy||''};
}
function missionCloudEvent(detail){window.dispatchEvent(new CustomEvent('highos:mission-cloud',{detail}));}

function missionCloudErrorInfo(e){
 const code=String(e?.code||'').toLowerCase(),msg=String(e?.message||''),raw=(code+' '+msg).toLowerCase();
 const permission=/permission-denied|unauthorized|forbidden/.test(raw);
 const quota=/resource-exhausted|quota|quota-exceeded|exceeded.*quota|too many requests/.test(raw);
 let retryAt=null,estimated=false;
 const retry=msg.match(/retry(?:\s+after|\s+in)?\s*[:=]?\s*(\d+)\s*(ms|s|sec|seconds?|m|min|minutes?)/i);
 if(retry){let n=Number(retry[1]),u=retry[2].toLowerCase();if(u==='ms')n/=1000;else if(u.startsWith('m'))n*=60;retryAt=new Date(Date.now()+n*1000);}
 if(quota&&!retryAt){
   // Firestore informa que quotas diárias do plano gratuito são redefinidas por volta da meia-noite Pacific Time.
   // Calcula a próxima meia-noite de America/Los_Angeles e exibe convertida no relógio local do navegador.
   try{
    const now=new Date(),parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(now).reduce((a,x)=>(a[x.type]=x.value,a),{});
    const pacificAsUtc=Date.UTC(+parts.year,+parts.month-1,+parts.day,+parts.hour,+parts.minute,+parts.second),offset=pacificAsUtc-now.getTime();
    retryAt=new Date(Date.UTC(+parts.year,+parts.month-1,+parts.day+1,0,0,0)-offset);estimated=true;
   }catch(_){retryAt=new Date(Date.now()+24*60*60*1000);estimated=true;}
 }
 const when=retryAt?retryAt.toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}):'';
 return {quota,permission,retryAt,estimated,when,code:code||'firebase-error',message:msg};
}

/* Leitura: coleção nova. Se ainda estiver vazia (antes da migração),
   lê o documento antigo e marca as entradas como "legacy". */
async function pullMissionsFromCloud({force=false}={}){
 if(!currentUser||!canViewModule('planejador'))return null;
 if(!force&&missionCloudLastPull&&Date.now()-missionCloudLastPullAt<MISSION_PULL_TTL)return missionCloudLastPull;
 try{
  const rows=await highOsStoreList('missoes_zonas');
  const entries=rows.map(x=>{let zona=null;if(!x.deleted){try{zona=JSON.parse(x.json||'null')}catch{}}return {id:String(x.zonaId||x.id),rev:Number(x.rev)||0,deleted:!!x.deleted,zona,updatedAtText:x.updatedAtText||'',updatedBy:x.updatedBy||'',deletedAtText:x.deletedAtText||'',deletedBy:x.deletedBy||''}});
  missionCloudMigrated=true;missionCloudLastPull={entries,legacy:false,pulledAt:new Date().toISOString()};missionCloudLastPullAt=Date.now();return missionCloudLastPull;
 }catch(err){console.warn('Missoes: falha ao ler do Discord',err);return null}
}
async function ensureMissionsMigrated(localList=[]){
 missionCloudMigrated=true;return {ok:true,migrated:false};
}
async function writeMissionZone(zona,baseRev,excluir){
 assertRemoteWriteAvailable();
 const id=String(zona?.id||''),docId=missionDocId(id),email=missionEmail(),agora=new Date().toISOString();
 if(!id)return {ok:false,id,reason:'sem-id'};
 let atual=null;try{atual=await highOsStoreGet('missoes_zonas',docId)}catch{}
 const remoteRev=atual?Number(atual.rev)||0:0;
 if(baseRev!==null&&baseRev!==undefined&&remoteRev!==(Number(baseRev)||0))return {ok:false,id,conflict:true,remoteRev,remote:atual};
 const limpa=missionCleanZone(zona),json=excluir&&atual?.json?atual.json:JSON.stringify(limpa);
 const data={zonaId:id,rev:remoteRev+1,json,nome:String(limpa.name||atual?.nome||''),eventId:String(limpa.eventId||atual?.eventId||''),evento:String(limpa.event||atual?.evento||''),categoria:String(limpa.category||atual?.categoria||''),updatedAtText:agora,updatedBy:email,deleted:!!excluir,deletedAtText:excluir?agora:'',deletedBy:excluir?email:''};
 await highOsStorePut('missoes_zonas',docId,data);
 return {ok:true,id,rev:remoteRev+1,deleted:!!excluir,updatedAtText:agora,updatedBy:email};
}
async function writeMissionZones(itens=[],excluir=false){
 if(!currentUser||!canEditModule('planejador'))return {ok:false,permission:true,results:[]};
 const results=[];missionCloudEvent({state:'sync'});
 try{for(const it of itens)results.push(await writeMissionZone(it.zona,it.baseRev,excluir))}
 catch(err){missionCloudEvent({state:'local',error:{message:err.message}});return {ok:false,error:{message:err.message},results}}
 missionCloudLastPullAt=0;const ok=results.every(r=>r.ok);missionCloudEvent({state:ok?'ok':'local',updatedAtText:new Date().toISOString(),updatedBy:missionEmail()});return {ok,results};
}

window.HighOSMissionCloud={
 version:2,
 canEdit:()=>!!currentUser&&canEditModule('planejador'),
 /* Planejador V12.17: facções com Group ativo hoje (meta de spawns dos eventos) */
 faccoesAtivas:()=>(faccoes||[]).filter(f=>!f.removido&&ocupadoV14(f)).map(f=>({group:f.group,faccao:f.faccao||'',segmento:f.segmento||''})),
 /* QGs/favelas com CDS: spawn de evento não pode cair dentro; Z ajuda a estimar a altura do TP de teste */
 qgs:()=>(faccoes||[]).map(f=>{const n=String(f.cds||'').match(/-?\d+(?:\.\d+)?/g)||[];return {group:f.group,qg:f.qg||'',faccao:f.faccao||'',x:Number(n[0]),y:Number(n[1]),z:Number(n[2])};}).filter(q=>Number.isFinite(q.x)&&Number.isFinite(q.y)&&q.x!==0&&!/sem local/i.test(q.qg)),
 user:()=>currentUser?.email||'',
 /* Planejador V12.18: resultados de eventos lançados no Diário Operacional (/highos registrar) */
 diarioEventos:async()=>(await highOsStoreList('diario_operacional')).filter(x=>String(x.type||'').toLowerCase()==='evento'),
 pull:pullMissionsFromCloud,
 ensureMigrated:ensureMissionsMigrated,
 saveZones:itens=>writeMissionZones(itens,false),
 deleteZones:itens=>writeMissionZones(itens,true)
};

console.info('HIGH OS V9.5.6 · sistema carregado');


/* ===== HIGH OS V14.7 · ANÚNCIOS DAS FACÇÕES LIVRES =====
   - "Postado / não postado" passa a ser salvo no bot (store anuncios_livres).
     Antes ia junto do registro do Group, mas o bot descartava o campo e a marca
     sumia ao recarregar. Marcas antigas são recuperadas do Histórico.
   - Botão ANÚNCIO: além de copiar, posta texto + fotos do QG no canal
     📋 anúncios-para-copiar do Discord do High OS. */
let anunciosLivresMap=new Map();
function anuncioDataMs(v){const s=String(v||'').trim();const br=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);if(br){let y=+br[3];if(y<100)y+=2000;return new Date(y,+br[2]-1,+br[1]).getTime()}const t=Date.parse(s);return Number.isFinite(t)?t:NaN}
function anuncioValido(r,f){
 /* marca feita antes do último recolhimento não vale para a nova liberação do Group */
 const quando=anuncioDataMs(r.postadoEm||r.naoPostadoEm||r.dataHora),rec=anuncioDataMs(f?.collectedAt||f?.ultimoRecolhimento?.createdAtText);
 return !(Number.isFinite(quando)&&Number.isFinite(rec)&&quando<rec);
}
async function carregarAnunciosLivres(){
 try{
  const rows=await highOsStoreList('anuncios_livres');
  const m=new Map(rows.map(r=>[String(r.group||r.id||'').toLowerCase(),r]));
  try{
   const hist=await highOsStoreList('historico'),ult=new Map();
   hist.forEach((h,i)=>{if(!/^ANUNCIO_DISCORD_(POSTADO|NAO_POSTADO)$/.test(String(h.tipo||''))||!h.group)return;const k=String(h.group).toLowerCase(),t=anuncioDataMs(h.createdAtText||h.data)||i;const p=ult.get(k);if(!p||t>=p.t)ult.set(k,{t,h})});
   ult.forEach(({h},k)=>{if(m.has(k))return;const postado=h.tipo==='ANUNCIO_DISCORD_POSTADO';m.set(k,{group:h.group,confirmado:true,postado,recuperado:true,dataHora:h.createdAtText||'',postadoEm:postado?(h.createdAtText||''):undefined,naoPostadoEm:postado?undefined:(h.createdAtText||'x'),texto:h.texto||'',imagemUrl:h.imagemUrl||''})});
  }catch(_){}
  anunciosLivresMap=m;
  try{renderCommandDashboard()}catch(_){}try{renderAvailableFaccoes()}catch(_){}
 }catch(e){console.warn('[ANÚNCIOS] não foi possível carregar o status salvo',e)}
}
{const _base=availableDiscordState;availableDiscordState=function(f){
  if(f&&!f.anuncioDiscordStatus){const r=anunciosLivresMap.get(String(f.group||'').toLowerCase());if(r&&anuncioValido(r,f))return _base({...f,anuncioDiscordStatus:r})}
  return _base(f)}}
{const _set=setAvailableDiscordState;setAvailableDiscordState=async function(group,postado){
  const f=faccoes.find(x=>x.group===group),antes=f?.anuncioDiscordStatus;
  await _set(group,postado);
  if(f&&f.anuncioDiscordStatus&&f.anuncioDiscordStatus!==antes){
   const rec={group,...f.anuncioDiscordStatus};
   try{await highOsStorePut('anuncios_livres',group,rec);anunciosLivresMap.set(group.toLowerCase(),rec)}
   catch(e){alert('Marcado nesta tela, mas não foi salvo no bot: '+(e.message||e))}
  }}}
async function postarAnuncioLivre(f){
 if(!f)throw new Error('Group não encontrado');
 const imagens=[f.imagemAnuncio,...(Array.isArray(f.discordImageUrls)?f.discordImageUrls:[])].filter(u=>/^https:\/\//i.test(String(u||'')));
 return highOsDiscordRequest('/v1/anuncios/livre',{method:'POST',body:JSON.stringify({group:f.group,text:availableAnnouncementText(f),imageUrls:imagens})});
}
{const _deps=painelDepsV14;painelDepsV14=function(){return {..._deps(),postarAnuncio:f=>postarAnuncioLivre(f)}}}
{const _lf=loadFaccoes;loadFaccoes=async function(...a){const r=await _lf.apply(this,a);carregarAnunciosLivres();return r}}
setTimeout(()=>{if(currentUser)carregarAnunciosLivres()},1500);

/* ===== HIGH OS V15.4 · RELATÓRIO GERAL DO ILEGAL (inteligente) =====
   Usa o mesmo motor da Central RH (métrica atribuída à facção, meta 15–20):
   últimos 7 dias × 7 anteriores, tendência de 30 dias, padrão dia × horário,
   diagnóstico automático por facção, segmentos, ocupação e plano de ação. */
const RG_CSS=`
.ins{display:grid;gap:6px}
.ins div{display:grid;grid-template-columns:22px 1fr;gap:8px;align-items:start;padding:7px 10px;border-radius:9px;border:1px solid #ece6f3;background:#fcfbfe;font-size:10.5px;line-height:1.45}
.ins div i{font-style:normal;font-size:13px;line-height:1.2;text-align:center}
.ins div.bad{border-color:#fecaca;background:#fff5f5}.ins div.warn{border-color:#fde68a;background:#fffbeb}.ins div.ok{border-color:#bbf7d0;background:#f0fdf4}.ins div.info{border-color:#ddd6fe;background:#f7f4ff}
.ins b{color:#1d1626}
.lead{font-size:12.5px;line-height:1.6;color:#2e2438;margin:0 0 12px;padding:12px 14px;border-left:4px solid #8b3dff;background:#faf7ff;border-radius:0 10px 10px 0}
.cols{display:grid;grid-template-columns:1.25fr 1fr;gap:14px}
.cols3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
h3{margin:0 0 8px;font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:#4b3d5e}
.hm td{text-align:center;font-weight:700;font-size:10.5px;padding:6px 4px}
.hm td.l{text-align:left;font-weight:800}
.hm td.f{color:#c9c1d4;font-weight:600}
.st{display:inline-block;padding:2px 8px;border-radius:999px;font-size:8.5px;font-weight:800;letter-spacing:.6px;white-space:nowrap}
.st.c-top{background:#bbf7d0;color:#14532d}.st.c-ok{background:#dcfce7;color:#166534}.st.c-low{background:#fef3c7;color:#92400e}.st.c-bad{background:#fee2e2;color:#991b1b}
td.rec{font-size:9.5px;color:#4b3d5e;line-height:1.35}
.up{color:#15803d;font-weight:800}.dn{color:#b91c1c;font-weight:800}.eq{color:#8a7d9a}
svg .tb{fill:#c4b5fd}svg .tb.we{fill:#a78bfa}svg .tb.hj{fill:#e9d5ff;stroke:#8b3dff;stroke-dasharray:3 2}
svg .ma{stroke:#7c3aed;stroke-width:2.4;fill:none;stroke-linejoin:round}
svg .rk{fill:#a78bfa}svg .rk.r-top{fill:#16a34a}svg .rk.r-ok{fill:#4ade80}svg .rk.r-low{fill:#fbbf24}svg .rk.r-zero{fill:#f87171}
svg .prev{stroke:#1d1626;stroke-width:2}
svg .nm{fill:#1d1626;font-size:10px;font-weight:700}svg .nm2{fill:#8a7d9a;font-size:8.5px}
svg .vl{fill:#1d1626;font-size:9.5px;font-weight:800}
`;
function rgRange(fim,n){return {ini:new Date(fim.getFullYear(),fim.getMonth(),fim.getDate()-(n-1)),fim}}
function rgVar(a,b){if(a===null||a===undefined||b===null||b===undefined||b<3)return null;return (a-b)/b*100}
function rgVarHtml(v){if(v===null)return '<span class="eq">—</span>';const r=Math.round(v);return r>=3?`<span class="up">▲ ${r}%</span>`:r<=-3?`<span class="dn">▼ ${Math.abs(r)}%</span>`:`<span class="eq">= ${r}%</span>`}
function rgDiag(e,M){
 const st=e.st,v=rgVar(st.media,e.ant?.media??null),forte=st.forte,fraco=Object.entries(st.porSlot||{}).filter(([,x])=>x!==null).sort((a,b)=>a[1]-b[1])[0]?.[0];
 if(!st.comDados)return {cls:'bad',rot:'SEM COLETA',peso:100,rec:'Nenhuma coleta na semana. Confirmar se a facção está ativa; se seguir assim, avaliar recolhimento.',v};
 if(st.semPlayers>=3)return {cls:'bad',rot:'SEM PLAYERS',peso:95,rec:`Sem players há ${st.semPlayers} dias seguidos. Contatar a liderança hoje; candidata a recolhimento.`,v};
 if(st.media<M.min*.5)return {cls:'bad',rot:'CRÍTICA',peso:90,rec:`Média de ${rh15N(st.media)}, menos da metade da meta mínima (${M.min}). Advertência formal e prazo para recuperar.`,v};
 if(st.media<M.min){
  if(v!==null&&v<=-20)return {cls:'low',rot:'ABAIXO ▼',peso:80,rec:`Abaixo da meta e caindo ${Math.abs(Math.round(v))}% na semana. Cobrar a liderança e acompanhar diariamente.`,v};
  if(v!==null&&v>=15)return {cls:'low',rot:'RECUPERANDO',peso:50,rec:`Abaixo da meta, mas subiu ${Math.round(v)}%. Manter acompanhamento até chegar a ${M.min}.`,v};
  return {cls:'low',rot:'ABAIXO',peso:65,rec:`Média ${rh15N(st.media)} (meta ${M.min}–${M.max}); ficou abaixo de ${M.min} em ${st.total-st.diasMeta} de ${st.total} dias.${st.pico>=M.min?` Já chegou a ${rh15N(st.pico)}: dá para sustentar a meta.`:' Nunca chegou à meta na semana.'}${forte?` Melhor horário: ${forte}.`:''}`,v};
 }
 if(v!==null&&v<=-25)return {cls:'ok',rot:'NA META ▼',peso:40,rec:`Ainda na meta, mas caiu ${Math.abs(Math.round(v))}%. Alerta preventivo à liderança.`,v};
 if(st.media>=M.max)return {cls:'top',rot:'DESTAQUE',peso:0,rec:`Acima da meta (${rh15N(st.media)})${st.regularidade!==null&&st.regularidade>=.8?' e constante':''}. Candidata a reconhecimento.${forte?` Horário forte: ${forte}.`:''}`,v};
 return {cls:'ok',rot:'NA META',peso:10,rec:`Dentro da meta.${st.regularidade!==null&&st.regularidade<.6?' Oscila bastante entre os dias: pedir constância.':' Manter.'}`,v};
}
function rgDados(){
 const M=rh15Meta(),hoje=rh15Hoje(),ontem=new Date(hoje.getFullYear(),hoje.getMonth(),hoje.getDate()-1),r7=rgRange(ontem,7),p7=rgRange(new Date(hoje.getFullYear(),hoje.getMonth(),hoje.getDate()-8),7),r30=rgRange(hoje,30);
 const A=rh15Coletar(r7,true),P=rh15Coletar(p7,false),T=rh15Coletar(r30,false);
 const ant=new Map(P.lista.map(e=>[rh15K(e.faccao),e.st]));
 const atuais=A.lista.filter(e=>!e.ex);atuais.forEach(e=>{e.ant=ant.get(rh15K(e.faccao))||null;e.dg=rgDiag(e,M)});
 /* facções que ocupam Group mas não aparecem nas métricas da semana */
 const vistos=new Set(atuais.map(e=>org15GK(e.group)));
 (RH15_FACCOES()||[]).filter(f=>f&&!f.removido&&situacaoGroup(f)==='ASSUMIDA'&&!vistos.has(org15GK(f.group))).forEach(f=>{const e={k:'x'+f.group,faccao:f.faccao,group:f.group,segmento:f.segmento||'OUTROS',dias:new Map(),st:{comDados:0,media:null,pico:null,porSlot:{},semPlayers:0,diasMeta:0,total:7,regularidade:null}};e.dg=rgDiag(e,M);atuais.push(e)});
 /* Ilegal por dia (soma dos picos das facções) */
 const somaDia=(lista,d)=>{let s=0,t=false;lista.forEach(e=>{const v=e.dias.get(rh15DK(d))?.pico;if(Number.isFinite(v)){s+=v;t=true}});return t?s:null};
 const serie30=T.dias.map(d=>({d,v:somaDia(T.lista,d)}));
 const tot7=A.dias.map(d=>somaDia(A.lista,d)).filter(v=>v!==null),totP=P.dias.map(d=>somaDia(P.lista,d)).filter(v=>v!==null);
 const med=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
 /* dia × horário (soma das facções na coleta) */
 const slots=A.slotKeys.length?A.slotKeys:['14H','16H','21H','23H'];
 const agora=new Date(),minAgora=agora.getHours()*60+agora.getMinutes();
 const grade=A.dias.map(d=>slots.map(s=>{let t=0,tem=false;A.lista.forEach(e=>{const v=+e.dias.get(rh15DK(d))?.slots?.[s];if(Number.isFinite(v)){t+=v;tem=true}});const fut=d.getTime()===hoje.getTime()&&!tem&&rh15SlotMin(s)+20>minAgora;return {v:tem?t:null,fut}}));
 const porSlot=slots.map((s,si)=>({s,m:med(grade.map(l=>l[si].v).filter(v=>v!==null))}));
 const faltas=[];grade.forEach((l,di)=>l.forEach((c,si)=>{if(c.v===null&&!c.fut)faltas.push(rh15Dm(A.dias[di])+' '+slots[si])}));
 /* segmentos */
 const segs={};atuais.forEach(e=>{(segs[e.segmento||'OUTROS']||=[]).push(e)});
 const segRows=Object.entries(segs).map(([nome,l])=>{const c=l.filter(e=>e.st.comDados);return {nome,n:l.length,media:med(c.map(e=>e.st.media)),abaixo:l.filter(e=>['bad','low'].includes(e.dg.cls)).length,top:l.filter(e=>e.dg.cls==='top').length}}).sort((a,b)=>(b.media||0)-(a.media||0));
 /* ocupação */
 const fac=(RH15_FACCOES()||[]).filter(f=>f&&!f.removido),sit=s=>fac.filter(f=>situacaoGroup(f)===s);
 let anom=[];try{anom=vacantMetricAnomalies()}catch(e){}
 return {M,hoje,r7,p7,A,P,atuais,serie30,mediaIlegal:med(tot7),mediaIlegalAnt:med(totP),picoIlegal:tot7.length?Math.max(...tot7):null,slots,grade,porSlot,faltas,segRows,
  ocup:{total:fac.length,ass:sit('ASSUMIDA').length,disp:sit('DISPONIVEL').length,rev:sit('REVISAR').length,semqg:sit('SEM_QG').length,vagos:sit('DISPONIVEL').map(f=>f.group)},anom};
}
function rgInsights(D){
 const out=[],M=D.M,L=D.atuais,c=k=>L.filter(e=>e.dg.cls===k).length,comDados=L.filter(e=>e.st.comDados);
 const vI=rgVar(D.mediaIlegal,D.mediaIlegalAnt);
 if(vI!==null)out.push([vI<=-10?'bad':vI>=10?'ok':'info',vI<=-10?'📉':vI>=10?'📈':'📊',`O Ilegal teve em média <b>${rh15N(D.mediaIlegal)}</b> pessoas no pico diário na última semana fechada, ${vI>=0?'alta':'queda'} de <b>${Math.abs(Math.round(vI))}%</b> sobre a semana anterior (${rh15N(D.mediaIlegalAnt)}).`]);
 const sp=L.filter(e=>e.dg.rot==='SEM PLAYERS'||e.dg.rot==='SEM COLETA');
 if(sp.length)out.push(['bad','🚨',`<b>${sp.length}</b> facção(ões) sem players ou sem coleta na semana: ${sp.slice(0,6).map(e=>`<b>${esc(e.faccao)}</b> (${esc(e.group)})`).join(', ')}${sp.length>6?'…':''}. Candidatas a recolhimento.`]);
 const crit=L.filter(e=>e.dg.rot==='CRÍTICA');
 if(crit.length)out.push(['bad','⛔',`<b>${crit.length}</b> facção(ões) com menos da metade da meta mínima: ${crit.slice(0,6).map(e=>`<b>${esc(e.faccao)}</b> (${rh15N(e.st.media)})`).join(', ')}.`]);
 const queda=comDados.filter(e=>e.dg.v!==null&&e.dg.v<=-25).sort((a,b)=>a.dg.v-b.dg.v);
 if(queda.length)out.push(['warn','▼',`Maiores quedas na semana: ${queda.slice(0,4).map(e=>`<b>${esc(e.faccao)}</b> ${Math.round(e.dg.v)}%`).join(', ')}.`]);
 const alta=comDados.filter(e=>e.dg.v!==null&&e.dg.v>=25).sort((a,b)=>b.dg.v-a.dg.v);
 if(alta.length)out.push(['ok','▲',`Maiores crescimentos: ${alta.slice(0,4).map(e=>`<b>${esc(e.faccao)}</b> +${Math.round(e.dg.v)}%`).join(', ')}.`]);
 const tops=comDados.filter(e=>e.dg.cls==='top').sort((a,b)=>b.st.media-a.st.media);
 if(tops.length)out.push(['ok','🏆',`<b>${tops.length}</b> facção(ões) acima de ${M.max}: ${tops.slice(0,5).map(e=>`<b>${esc(e.faccao)}</b> (${rh15N(e.st.media)})`).join(', ')}. Candidatas a reconhecimento.`]);
 const naMeta=c('top')+c('ok');
 out.push([naMeta/Math.max(1,L.length)>=.6?'ok':'warn','🎯',`<b>${naMeta}</b> de ${L.length} facções estão na meta de ${M.min}–${M.max} (${Math.round(naMeta/Math.max(1,L.length)*100)}%); <b>${c('low')+c('bad')}</b> estão abaixo.`]);
 const ps=D.porSlot.filter(x=>x.m!==null).sort((a,b)=>b.m-a.m);
 if(ps.length>1)out.push(['info','🕘',`Horário mais forte: <b>${esc(ps[0].s)}</b> (média ${rh15N(ps[0].m)} online). Mais fraco: <b>${esc(ps[ps.length-1].s)}</b> (${rh15N(ps[ps.length-1].m)}) — bom horário para eventos que puxem movimento.`]);
 const ord=[...comDados].sort((a,b)=>b.st.media-a.st.media),tot=ord.reduce((a,e)=>a+e.st.media,0);
 if(ord.length>=8&&tot>0){const t5=ord.slice(0,5).reduce((a,e)=>a+e.st.media,0)/tot;if(t5>=.4)out.push(['info','⚖️',`As 5 maiores facções concentram <b>${Math.round(t5*100)}%</b> do movimento. ${t5>=.55?'Dependência alta de poucas facções.':'Distribuição razoável.'}`])}
 const sw=D.segRows.filter(s=>s.media!==null);
 if(sw.length>1)out.push(['info','🧩',`Segmento mais forte: <b>${esc(sw[0].nome)}</b> (média ${rh15N(sw[0].media)}). Mais fraco: <b>${esc(sw[sw.length-1].nome)}</b> (${rh15N(sw[sw.length-1].media)})${sw[sw.length-1].abaixo?`, com ${sw[sw.length-1].abaixo} abaixo da meta`:''}.`]);
 if(D.ocup.disp)out.push([D.ocup.disp>=8?'warn':'info','🏚️',`<b>${D.ocup.disp}</b> Group(s) disponíveis para assumir (${D.ocup.ass} ocupados de ${D.ocup.total}).${D.ocup.rev?` ${D.ocup.rev} com cadastro a revisar.`:''}`]);
 if(D.anom.length)out.push(['bad','👀',`<b>${D.anom.length}</b> Group(s) com player sem facção registrada nos últimos 7 dias: ${D.anom.slice(0,5).map(a=>esc(a.group)).join(', ')}.`]);
 if(D.faltas.length)out.push(['warn','🕳️',`<b>${D.faltas.length}</b> coleta(s) não chegaram na semana (${D.faltas.slice(0,6).join(', ')}${D.faltas.length>6?'…':''}). Os números desses horários ficam subestimados.`]);
 const ord2={bad:0,warn:1,ok:2,info:3};return out.sort((a,b)=>ord2[a[0]]-ord2[b[0]]);
}
function rgGraficoTendencia(D){
 const s=D.serie30,W=1000,H=185,Lm=40,Rm=14,T=14,Bm=32,iw=W-Lm-Rm,ih=H-T-Bm,n=s.length,bw=iw/n;
 const max=Math.max(10,...s.map(x=>x.v||0)),passo=max<=60?10:max<=150?25:max<=400?50:100,topo=Math.ceil(max/passo)*passo,y=v=>T+ih-(v/topo)*ih,hoje=D.hoje.getTime();
 let g='';for(let v=0;v<=topo;v+=passo)g+=`<line x1="${Lm}" x2="${W-Rm}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${Lm-6}" y="${y(v)+3}" class="ax" text-anchor="end">${v}</text>`;
 const pts=[];s.forEach((x,i)=>{const cx=Lm+i*bw+bw/2,dw=x.d.getDay(),we=dw===0||dw===6;
  if(i%2===0||n<=16)g+=`<text x="${cx}" y="${H-Bm+13}" class="ax sm" text-anchor="middle">${rh15Dm(x.d)}</text>`;
  if(dw===1)g+=`<text x="${cx}" y="${H-Bm+25}" class="ax sm wk" text-anchor="middle">seg</text>`;
  if(x.v===null)return;const h=Math.max(1,x.v/topo*ih);
  g+=`<rect x="${Lm+i*bw+1.5}" y="${y(x.v)}" width="${bw-3}" height="${h}" rx="2" class="tb${x.d.getTime()===hoje?' hj':we?' we':''}"/>`;
  const jan=s.slice(Math.max(0,i-6),i+1).map(z=>z.v).filter(v=>v!==null);if(jan.length>=3)pts.push(`${cx},${y(jan.reduce((a,b)=>a+b,0)/jan.length)}`)});
 if(pts.length>1)g+=`<polyline points="${pts.join(' ')}" class="ma"/>`;
 return `<div class="chart"><svg class="rh15-mes" viewBox="0 0 ${W} ${H}">${g}</svg><div class="leg"><span><i style="background:#c4b5fd"></i>pico do Ilegal no dia (soma das facções)</span><span><i style="background:#a78bfa"></i>fim de semana</span><span><i class="ln" style="background:#7c3aed"></i>média móvel de 7 dias</span></div></div>`;
}
function rgGraficoRanking(L,M,de,ate){
 const l=L.slice(de,ate),W=1000,rowH=17,T=22,H=T+l.length*rowH+18,Lm=230,Rm=60,iw=W-Lm-Rm;
 const max=Math.max(M.max+5,...L.map(e=>Math.max(e.st.media||0,e.ant?.media||0))),x=v=>Lm+(v/max)*iw;
 let g=`<rect x="${x(M.min)}" y="${T-6}" width="${x(M.max)-x(M.min)}" height="${l.length*rowH+8}" class="meta"/><text x="${(x(M.min)+x(M.max))/2}" y="${T-10}" class="metat" text-anchor="middle">META ${M.min}–${M.max}</text>`;
 const passo=max<=40?5:10;for(let v=0;v<=max;v+=passo)g+=`<line x1="${x(v)}" x2="${x(v)}" y1="${T-4}" y2="${T+l.length*rowH}" class="grid"/><text x="${x(v)}" y="${T+l.length*rowH+12}" class="ax sm" text-anchor="middle">${v}</text>`;
 l.forEach((e,i)=>{const yy=T+i*rowH,m=e.st.media,f=m===null?'zero':rh15Faixa(m);
  g+=`<text x="${Lm-8}" y="${yy+11}" class="nm" text-anchor="end">${de+i+1}. ${esc(e.faccao).slice(0,26)}</text><text x="${Lm-8}" y="${yy+19}" class="nm2" text-anchor="end">${esc(e.group)}</text>`;
  if(m!==null)g+=`<rect x="${Lm}" y="${yy+3}" width="${Math.max(1,x(m)-Lm)}" height="${rowH-7}" rx="3" class="rk r-${f}"/><text x="${x(m)+5}" y="${yy+13}" class="vl">${rh15N(m)}</text>`;
  else g+=`<text x="${Lm+4}" y="${yy+13}" class="nm2">sem coleta</text>`;
  if(e.ant?.media!=null)g+=`<line x1="${x(e.ant.media)}" x2="${x(e.ant.media)}" y1="${yy+1}" y2="${yy+rowH-2}" class="prev"/>`});
 return `<div class="chart"><svg class="rh15-mes" viewBox="0 0 ${W} ${H}">${g}</svg><div class="leg"><span><i style="background:#16a34a"></i>acima de ${M.max}</span><span><i style="background:#4ade80"></i>na meta</span><span><i style="background:#fbbf24"></i>abaixo</span><span><i style="background:#f87171"></i>crítica</span><span><i class="ln"></i>traço = média da semana anterior</span></div></div>`;
}
function rgHeat(D){
 const dn=['DOM','SEG','TER','QUA','QUI','SEX','SÁB'],max=Math.max(1,...D.grade.flat().map(c=>c.v||0));
 return `<table class="hm"><thead><tr><th>DIA</th>${D.slots.map(s=>`<th class="n">${esc(s)}</th>`).join('')}<th class="n">PICO</th></tr></thead><tbody>${D.A.dias.map((d,di)=>{const l=D.grade[di],vs=l.map(c=>c.v).filter(v=>v!==null);return `<tr><td class="l">${dn[d.getDay()]} ${rh15Dm(d)}</td>${l.map(c=>c.v===null?`<td class="f">${c.fut?'…':'—'}</td>`:`<td style="background:rgba(139,61,255,${(.08+.55*c.v/max).toFixed(2)});color:${c.v/max>.6?'#fff':'#1d1626'}">${c.v}</td>`).join('')}<td><b>${vs.length?Math.max(...vs):'—'}</b></td></tr>`}).join('')}</tbody></table>`;
}
function rgHtml(){
 const D=rgDados(),M=D.M,L=[...D.atuais].sort((a,b)=>(b.st.media??-1)-(a.st.media??-1)),ins=rgInsights(D);
 const per=`${rh15Br(D.r7.ini)} a ${rh15Br(D.r7.fim)} • comparação com ${rh15Br(D.p7.ini)} a ${rh15Br(D.p7.fim)} • meta ${M.min}–${M.max}`;
 const c=k=>L.filter(e=>e.dg.cls===k).length,vI=rgVar(D.mediaIlegal,D.mediaIlegalAnt);
 const lead=`Na última semana fechada o Ilegal teve <b>${L.length}</b> facções ativas, com média de <b>${rh15N(D.mediaIlegal)}</b> pessoas no pico diário${vI!==null?` (${vI>=0?'+':''}${Math.round(vI)}% na semana)`:''} e recorde de <b>${rh15N(D.picoIlegal)}</b>. <b>${c('top')+c('ok')}</b> facções estão na meta e <b>${c('low')+c('bad')}</b> abaixo${c('bad')?`, sendo <b>${c('bad')}</b> em situação crítica`:''}. ${L[0]?.st.media!=null?`A líder da semana é <b>${esc(L[0].faccao)}</b> (${esc(L[0].group)}) com ${rh15N(L[0].st.media)}.`:''}`;
 const pags=[];
 pags.push(`<section class="pg">${rh15PrintTopo('Relatório Geral do Ilegal',per)}<div class="in">
<div class="kp"><div><span>Pico médio do Ilegal</span><b>${rh15N(D.mediaIlegal)}</b><small>${vI===null?'sem comparação':(vI>=0?'+':'')+Math.round(vI)+'% vs semana anterior'}</small></div>
<div><span>Recorde da semana</span><b>${rh15N(D.picoIlegal)}</b><small>soma das facções</small></div>
<div class="ok"><span>Na meta</span><b>${c('top')+c('ok')}</b><small>${c('top')} acima de ${M.max}</small></div>
<div class="warn"><span>Abaixo da meta</span><b>${c('low')+c('bad')}</b><small>${c('bad')} crítica(s)</small></div>
<div><span>Groups ocupados</span><b>${D.ocup.ass}/${D.ocup.total}</b><small>${D.ocup.disp} disponíveis</small></div>
<div class="${D.anom.length?'warn':''}"><span>Inconsistências</span><b>${D.anom.length}</b><small>Group vago com player</small></div></div>
<p class="lead">${lead}</p>
<h3>Leitura automática da semana</h3><div class="ins">${ins.slice(0,11).map(([k,i,t])=>`<div class="${k}"><i>${i}</i><span>${t}</span></div>`).join('')}</div></div></section>`);
 pags.push(`<section class="pg">${rh15PrintTopo('Movimento do Ilegal',`Últimos 30 dias e padrão da semana • ${per}`)}<div class="in"><h3>Pico diário do Ilegal — 30 dias</h3>${rgGraficoTendencia(D)}
<div class="cols" style="margin-top:12px"><div><h3>Semana por dia e horário (pessoas online)</h3>${rgHeat(D)}</div><div><h3>Média por horário de coleta</h3><table><thead><tr><th>Horário</th><th class="n">Média online</th><th>Leitura</th></tr></thead><tbody>${(()=>{const ps=D.porSlot.filter(x=>x.m!==null),mx=Math.max(...ps.map(x=>x.m),1);return D.porSlot.map(x=>`<tr><td><b>${esc(x.s)}</b></td><td class="n">${rh15N(x.m)}</td><td>${x.m===null?'sem coleta':x.m===mx?'<span class="st c-top">MAIS FORTE</span>':x.m<mx*.5?'<span class="st c-low">FRACO</span>':'<span class="st c-ok">NORMAL</span>'}</td></tr>`).join('')})()}</tbody></table>
<h3 style="margin-top:12px">Segmentos</h3><table><thead><tr><th>Segmento</th><th class="n">Facções</th><th class="n">Média</th><th class="n">Abaixo</th><th class="n">Destaques</th></tr></thead><tbody>${D.segRows.slice(0,5).map(s=>`<tr><td><b>${esc(s.nome)}</b></td><td class="n">${s.n}</td><td class="n">${rh15N(s.media)}</td><td class="n">${s.abaixo||'—'}</td><td class="n">${s.top||'—'}</td></tr>`).join('')}</tbody></table></div></div></div></section>`);
 const POR=28;for(let i=0;i<L.length;i+=POR)pags.push(`<section class="pg">${rh15PrintTopo('Ranking da semana',`Média dos picos diários por facção • ${per}`)}<div class="in">${rgGraficoRanking(L,M,i,i+POR)}</div></section>`);
 const prio=[...L].sort((a,b)=>b.dg.peso-a.dg.peso||(a.st.media??-1)-(b.st.media??-1));
 const POR2=11;for(let i=0;i<prio.length;i+=POR2)pags.push(`<section class="pg">${rh15PrintTopo('Diagnóstico e recomendações',`Ordenado por prioridade de ação • ${per}`)}<div class="in"><table><thead><tr><th>#</th><th>Facção</th><th>Group</th><th class="n">Média</th><th class="n">Semana ant.</th><th class="n">Variação</th><th class="n">Pico</th><th class="n">Dias na meta</th><th>Situação</th><th>Recomendação</th></tr></thead><tbody>${prio.slice(i,i+POR2).map((e,j)=>`<tr><td>${i+j+1}</td><td><b>${esc(e.faccao)}</b><br><small style="color:#8a7d9a">${esc(e.segmento)}</small></td><td>${esc(e.group)}</td><td class="n"><b>${rh15N(e.st.media)}</b></td><td class="n">${rh15N(e.ant?.media??null)}</td><td class="n">${rgVarHtml(e.dg.v)}</td><td class="n">${rh15N(e.st.pico)}</td><td class="n">${e.st.diasMeta}/${e.st.total}</td><td><span class="st c-${e.dg.cls}">${e.dg.rot}</span></td><td class="rec">${esc(e.dg.rec)}</td></tr>`).join('')}</tbody></table></div></section>`);
 const acoes=prio.filter(e=>e.dg.peso>=50).slice(0,10),reconhecer=L.filter(e=>e.dg.cls==='top').slice(0,6);
 pags.push(`<section class="pg">${rh15PrintTopo('Plano de ação',per)}<div class="in"><div class="cols"><div><h3>Prioridades da staff</h3><div class="ins">${acoes.length?acoes.map((e,i)=>`<div class="${e.dg.cls==='bad'?'bad':'warn'}"><i>${i+1}</i><span><b>${esc(e.faccao)}</b> • ${esc(e.group)} — ${esc(e.dg.rec)}</span></div>`).join(''):'<div class="ok"><i>✓</i><span>Nenhuma facção exige ação imediata.</span></div>'}</div></div>
<div><h3>Reconhecimento</h3><div class="ins">${reconhecer.length?reconhecer.map(e=>`<div class="ok"><i>🏆</i><span><b>${esc(e.faccao)}</b> • ${esc(e.group)} — média ${rh15N(e.st.media)}, pico ${rh15N(e.st.pico)}, ${e.st.diasMeta}/${e.st.total} dias na meta.</span></div>`).join(''):'<div class="info"><i>—</i><span>Nenhuma facção acima de '+M.max+' na semana.</span></div>'}</div>
<h3 style="margin-top:12px">Ocupação</h3><div class="ins"><div class="info"><i>🏠</i><span><b>${D.ocup.ass}</b> ocupados • <b>${D.ocup.disp}</b> disponíveis • ${D.ocup.semqg} sem QG • ${D.ocup.rev} a revisar.${D.ocup.vagos.length?` Disponíveis: ${D.ocup.vagos.slice(0,14).map(esc).join(', ')}${D.ocup.vagos.length>14?'…':''}.`:''}</span></div>${D.anom.length?`<div class="bad"><i>👀</i><span>Player em Group sem facção: ${D.anom.slice(0,8).map(a=>`<b>${esc(a.group)}</b> (${a.value} em ${a.date.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})})`).join(', ')}.</span></div>`:''}</div></div></div>
<p class="note">Como ler: "média" é a média dos picos diários da facção (maior coleta de cada dia) nos últimos 7 dias. A métrica acompanha a facção que ocupava o Group no horário da coleta. Variação só é calculada quando a semana anterior tem média ≥ 3, para evitar porcentagens enganosas.</p></div></section>`);
 const total=pags.length,html=pags.map((p,i)=>p.replace(/<\/section>$/,rh15PrintRodape(i+1,total)+'</section>')).join('');
 return html;
}
function rgAbrir(){
 try{
  if(!(typeof metricas!=='undefined'&&metricas?.length))return alert('As métricas ainda estão carregando. Abra a página Métricas uma vez e tente de novo.');
  const html=rgHtml(),w=window.open('','_blank');if(!w)return alert('O navegador bloqueou a janela do relatório. Libere pop-ups para o High OS.');
  w.document.open();w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório Geral do Ilegal</title><style>${RH15_PRINT_CSS}${RG_CSS}</style></head><body><button class="np" onclick="window.print()">IMPRIMIR / SALVAR PDF</button>${html}</body></html>`);w.document.close();w.focus();
 }catch(e){console.error('[RELATÓRIO GERAL]',e);alert('Falha ao montar o relatório: '+(e.message||e))}
}
mgmtOpenRichReport=rgAbrir;

/* ===== HIGH OS V15.5 · DIÁRIO — RELATÓRIOS (semana / mês / ano / período) =====
   Tudo que o bot registra no Discord (diario_operacional) vira relatório:
   eventos e vencedores, premiação paga, reuniões dos Padrinhos (valor pago
   e demandas), visitas, atividades não realizadas. Exporta PDF e CSV. */
let dgModo='dia',dgRelRows=null,dgRelAt=0;
const dgRel={per:'semana',ref:'',ini:'',fim:''};
const dgIso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const dgFromIso=s=>{const m=String(s||'').match(/^(\d{4})-(\d{2})-(\d{2})/);return m?new Date(+m[1],+m[2]-1,+m[3]):null};
const dgMoney=v=>Number(v)>0?'R$ '+Math.round(Number(v)).toLocaleString('pt-BR'):'—';
function dgParseMoney(t){const m=String(t??'').match(/([\d.]+(?:,\d+)?)\s*(milh(?:ão|ao|ões|oes)|mil|mi|kk|k|m)?(?![a-zà-ú])/i);if(!m)return 0;let v=Number(m[1].replace(/\./g,'').replace(',','.'));if(!Number.isFinite(v))return 0;const u=String(m[2]||'').toLowerCase();if(u==='mil'||u==='k')v*=1e3;else if(u==='kk'||u.startsWith('m'))v*=1e6;return v}
function dgRelRange(){
 const hoje=dgFromIso(diaryTodayIso())||new Date(),ref=dgFromIso(dgRel.ref)||hoje;
 if(dgRel.per==='mes')return {ini:new Date(ref.getFullYear(),ref.getMonth(),1),fim:new Date(ref.getFullYear(),ref.getMonth()+1,0),rot:ref.toLocaleDateString('pt-BR',{month:'long',year:'numeric'}).replace(/^./,c=>c.toUpperCase())};
 if(dgRel.per==='ano')return {ini:new Date(ref.getFullYear(),0,1),fim:new Date(ref.getFullYear(),11,31),rot:'Ano de '+ref.getFullYear()};
 if(dgRel.per==='periodo'){const a=dgFromIso(dgRel.ini)||new Date(hoje.getFullYear(),hoje.getMonth(),1),b=dgFromIso(dgRel.fim)||hoje;const ini=a<=b?a:b,fim=a<=b?b:a;return {ini,fim,rot:`${ini.toLocaleDateString('pt-BR')} a ${fim.toLocaleDateString('pt-BR')}`}}
 const dow=(ref.getDay()+6)%7,ini=new Date(ref.getFullYear(),ref.getMonth(),ref.getDate()-dow),fim=new Date(ini.getFullYear(),ini.getMonth(),ini.getDate()+6);
 return {ini,fim,rot:`Semana de ${ini.toLocaleDateString('pt-BR')} a ${fim.toLocaleDateString('pt-BR')}`};
}
function dgRelShift(n){const r=dgRelRange(),b=r.ini;let d;if(dgRel.per==='mes')d=new Date(b.getFullYear(),b.getMonth()+n,1);else if(dgRel.per==='ano')d=new Date(b.getFullYear()+n,0,1);else d=new Date(b.getFullYear(),b.getMonth(),b.getDate()+7*n);dgRel.ref=dgIso(d)}
function dgKind(r){
 const t=String(r.type||'').toLowerCase(),st=String(r.scheduleType||'').toLowerCase(),nm=String(r.title||r.scheduleName||'');
 if(r.meeting||/reuni/i.test(nm)&&(r.valorPago!==undefined||t==='reuniao'))return 'reuniao';
 if(t==='evento'||r.winner||['evento','relampago','oficial','especial'].includes(st))return 'evento';
 if(t==='visita'||st==='visita'||/visita/i.test(nm))return 'visita';
 return 'outro';
}
function dgPlaces(r){
 const out=[];const add=(pos,name,val)=>{name=String(name||'').trim();if(name&&!out.some(p=>p.pos===pos))out.push({pos,name,val:Number(val)||0})};
 const vals=Array.isArray(r.prizeValues)?r.prizeValues.map(Number):String(r.prize||'').split(/•|\/|,(?=\s*R\$)/).map(dgParseMoney);
 String(r.result||'').split(/\n+/).forEach(l=>{const m=l.match(/^\s*([1-3])\s*(?:º|°|o)?\s*(?:lugar)?\s*[:\-–]?\s*(.+?)(?:\s+[-–]\s+(.+))?$/i);if(m)add(+m[1],m[2],dgParseMoney(m[3])||vals[+m[1]-1])});
 if(!out.length){const pares=[...String(r.result||'').matchAll(/([^\s-–][^-–\n]*?)\s+[-–]\s+([\d.,]+\s*(?:milh(?:ão|ao|ões|oes)|mil|mi|kk|k)?)/gi)];if(pares.length>=2)pares.slice(0,3).forEach((m,i)=>add(i+1,m[1],dgParseMoney(m[2])))}
 const pod=String(r.podium||'').split(/[,;|\/]|\s+e\s+/i).map(x=>x.trim()).filter(Boolean);
 add(1,r.winner,vals[0]);add(2,r.second||pod[0],vals[1]);add(3,r.third||pod[1],vals[2]);
 return out.sort((a,b)=>a.pos-b.pos);
}
async function dgRelCarregar(force=false){
 if(!force&&dgRelRows&&Date.now()-dgRelAt<60000)return dgRelRows;
 dgRelRows=(await highOsStoreList('diario_operacional')).filter(r=>/^\d{4}-\d{2}-\d{2}/.test(String(r.date||'')));dgRelAt=Date.now();return dgRelRows;
}
function dgRelDados(rows){
 const R=dgRelRange(),a=dgIso(R.ini),b=dgIso(R.fim);
 const L=rows.filter(r=>{const d=String(r.date).slice(0,10);return d>=a&&d<=b&&String(r.status||'FINALIZADO')!=='REAGENDADO'}).sort((x,y)=>String(x.date+x.time).localeCompare(String(y.date+y.time)));
 const ok=L.filter(r=>r.status!=='NAO_REALIZADO'),nao=L.filter(r=>r.status==='NAO_REALIZADO');
 const ev=ok.filter(r=>dgKind(r)==='evento'),reu=ok.filter(r=>dgKind(r)==='reuniao'),vis=ok.filter(r=>dgKind(r)==='visita');
 const rank=new Map();let premio=0;
 ev.forEach(r=>dgPlaces(r).forEach(p=>{const k=p.name.toLowerCase().replace(/\s+/g,' ');if(!rank.has(k))rank.set(k,{nome:p.name,v1:0,v2:0,v3:0,valor:0,eventos:new Set()});const x=rank.get(k);x['v'+p.pos]++;x.valor+=p.val;x.eventos.add(r.title||r.scheduleName);premio+=p.val}));
 const ranking=[...rank.values()].map(x=>({...x,pontos:x.v1*3+x.v2*2+x.v3,eventos:[...x.eventos]})).sort((x,y)=>y.v1-x.v1||y.pontos-x.pontos||y.valor-x.valor);
 const pago=reu.reduce((s,r)=>s+(Number(r.valorPago)||0),0);
 const porEvento=new Map();ev.forEach(r=>{const k=r.title||r.scheduleName||'Evento';porEvento.set(k,(porEvento.get(k)||0)+1)});
 /* série: por dia (semana/mês/período curto) ou por mês (ano / período longo) */
 const dias=Math.round((R.fim-R.ini)/864e5)+1,porMes=dias>62,serie=[];
 if(porMes){for(let d=new Date(R.ini.getFullYear(),R.ini.getMonth(),1);d<=R.fim;d=new Date(d.getFullYear(),d.getMonth()+1,1)){const k=dgIso(d).slice(0,7);serie.push({rot:d.toLocaleDateString('pt-BR',{month:'short'}).replace('.',''),ok:ok.filter(r=>String(r.date).startsWith(k)).length,nao:nao.filter(r=>String(r.date).startsWith(k)).length})}}
 else{for(let d=new Date(R.ini);d<=R.fim;d=new Date(d.getFullYear(),d.getMonth(),d.getDate()+1)){const k=dgIso(d);serie.push({rot:dias<=7?['DOM','SEG','TER','QUA','QUI','SEX','SÁB'][d.getDay()]+' '+String(d.getDate()).padStart(2,'0'):String(d.getDate()).padStart(2,'0'),ok:ok.filter(r=>String(r.date).slice(0,10)===k).length,nao:nao.filter(r=>String(r.date).slice(0,10)===k).length})}}
 return {R,L,ok,nao,ev,reu,vis,ranking,premio,pago,porEvento:[...porEvento.entries()].sort((a,b)=>b[1]-a[1]),serie,porMes};
}
function dgRelInsights(D){
 const out=[];const tot=D.ok.length+D.nao.length;
 if(tot)out.push(`<b>${D.ok.length}</b> de ${tot} atividades realizadas (${Math.round(D.ok.length/tot*100)}%)${D.nao.length?`; <b>${D.nao.length}</b> não aconteceram`:''}.`);
 if(D.ranking[0])out.push(`Maior vencedor: <b>${esc(D.ranking[0].nome)}</b> com ${D.ranking[0].v1} vitória(s)${D.ranking[0].valor?` e ${dgMoney(D.ranking[0].valor)} em prêmios`:''}.`);
 if(D.premio)out.push(`Premiação paga nos eventos: <b>${dgMoney(D.premio)}</b> em ${D.ev.length} evento(s).`);
 if(D.reu.length)out.push(`Reuniões dos Padrinhos: <b>${D.reu.length}</b> · valor pago total <b>${dgMoney(D.pago)}</b>${D.reu.filter(r=>r.teveDemanda).length?` · ${D.reu.filter(r=>r.teveDemanda).length} com demandas`:''}.`);
 const motivos=D.nao.map(r=>String(r.reason||'').toLowerCase()).filter(Boolean);if(D.nao.length>=3)out.push(`Atenção: ${D.nao.length} atividades não realizadas no período${motivos.length?' — veja os motivos na lista':''}.`);
 const top=D.porEvento[0];if(top)out.push(`Evento mais realizado: <b>${esc(top[0])}</b> (${top[1]}x).`);
 return out;
}
function dgRelHtml(D){
 const mx=Math.max(1,...D.serie.map(s=>s.ok+s.nao)),mr=Math.max(1,...D.ranking.map(r=>r.pontos));
 const kind={evento:'🏆 Evento',reuniao:'🤝 Reunião',visita:'📍 Visita',outro:'📌 Atividade'};
 return `<div class="dg-rel-bar"><div class="dg-seg">${[['semana','Semana'],['mes','Mês'],['ano','Ano'],['periodo','Período']].map(([k,l])=>`<button type="button" data-dgrel-per="${k}" class="${dgRel.per===k?'on':''}">${l}</button>`).join('')}</div>
 ${dgRel.per==='periodo'?`<div class="dg-per"><input type="date" id="dgRelIni" value="${dgIso(D.R.ini)}"><span>a</span><input type="date" id="dgRelFim" value="${dgIso(D.R.fim)}"></div>`:`<div class="dg-per"><button type="button" data-dgrel-mv="-1">◀</button><b>${esc(D.R.rot)}</b><button type="button" data-dgrel-mv="1">▶</button></div>`}
 <div class="dg-exp"><button type="button" data-dgrel-exp="pdf">PDF</button><button type="button" data-dgrel-exp="csv">CSV</button></div></div>
<div class="dg-kpis">
 <div class="dg-kpi"><span>ATIVIDADES</span><b>${D.ok.length}</b><small>${D.nao.length} não realizada(s)</small></div>
 <div class="dg-kpi ok"><span>EVENTOS</span><b>${D.ev.length}</b><small>${D.ranking.length} organização(ões) no pódio</small></div>
 <div class="dg-kpi"><span>PREMIAÇÃO PAGA</span><b class="sm">${dgMoney(D.premio)}</b><small>soma dos pódios</small></div>
 <div class="dg-kpi"><span>REUNIÕES • VALOR PAGO</span><b class="sm">${dgMoney(D.pago)}</b><small>${D.reu.length} reunião(ões) · ${D.vis.length} visita(s)</small></div>
</div>
${dgRelInsights(D).length?`<section class="dg-card"><header><b>Leitura do período</b><small>${esc(D.R.rot)}</small></header><ul class="dg-ins">${dgRelInsights(D).map(t=>`<li>${t}</li>`).join('')}</ul></section>`:''}
<div class="dg-rel-grid">
<section class="dg-card"><header><b>Atividades ${D.porMes?'por mês':'por dia'}</b><small><i class="dg-lg ok"></i>realizadas <i class="dg-lg no"></i>não realizadas</small></header>
 <div class="dg-cols" style="--n:${D.serie.length}">${D.serie.map((s,i)=>`<div class="dg-col" style="--i:${i}" title="${esc(s.rot)}: ${s.ok} realizada(s), ${s.nao} não realizada(s)"><div class="dg-stack"><i class="no" style="height:${s.nao/mx*100}%"></i><i class="ok" style="height:${s.ok/mx*100}%"></i></div><em>${s.ok+s.nao||''}</em><small>${esc(s.rot)}</small></div>`).join('')}</div></section>
<section class="dg-card"><header><b>Ranking de vencedores</b><small>🥇 3 pts · 🥈 2 · 🥉 1</small></header>
 ${D.ranking.length?`<div class="dg-rank">${D.ranking.slice(0,12).map((r,i)=>`<div class="dg-rk" style="--i:${i}"><span class="n">${i+1}</span><div><b>${esc(r.nome)}</b><small>🥇 ${r.v1} · 🥈 ${r.v2} · 🥉 ${r.v3}${r.valor?' · '+dgMoney(r.valor):''}</small><i style="--w:${r.pontos/mr*100}%"></i></div><strong>${r.pontos}</strong></div>`).join('')}</div>`:'<div class="placeholder"><p>Nenhum evento com vencedor no período.</p></div>'}</section>
</div>
${D.reu.length?`<section class="dg-card"><header><b>Reuniões dos Padrinhos</b><small>Valor pago e demandas registradas no Discord</small></header><div class="dg-tbl"><table><thead><tr><th>Data</th><th>Reunião</th><th class="n">Valor pago</th><th>Demandas</th><th>Registrado por</th></tr></thead><tbody>${D.reu.map(r=>`<tr><td>${String(r.date).slice(0,10).split('-').reverse().join('/')}</td><td><b>${esc(r.title||r.scheduleName||'Reunião')}</b></td><td class="n"><b>${dgMoney(r.valorPago)}</b></td><td>${r.teveDemanda?esc(r.demandas||''):'<span class="mut">Sem demandas</span>'}</td><td>${esc(r.createdByName||'—')}</td></tr>`).join('')}</tbody></table></div></section>`:''}
<section class="dg-card"><header><b>Eventos e atividades</b><small>${D.L.length} registro(s)</small></header><div class="dg-tbl"><table><thead><tr><th>Data</th><th>Hora</th><th>Tipo</th><th>Atividade</th><th>Resultado</th><th class="n">Prêmio</th><th>Situação</th></tr></thead><tbody>${D.L.map(r=>{const k=dgKind(r),pl=k==='evento'?dgPlaces(r):[];return `<tr class="${r.status==='NAO_REALIZADO'?'nao':''}"><td>${String(r.date).slice(0,10).split('-').reverse().join('/')}</td><td>${esc(r.time||'—')}</td><td>${kind[k]}</td><td><b>${esc(r.title||r.scheduleName||'—')}</b>${r.zone?`<br><small class="mut">${esc(r.zone)}</small>`:''}</td><td>${r.status==='NAO_REALIZADO'?`<span class="mut">${esc(r.reason||'não realizada')}</span>`:k==='reuniao'?`${dgMoney(r.valorPago)}${r.teveDemanda?' · demandas':''}`:pl.length?pl.map(p=>`${['🥇','🥈','🥉'][p.pos-1]} ${esc(p.name)}`).join('<br>'):esc(String(r.result||'').slice(0,90))}</td><td class="n">${pl.length?dgMoney(pl.reduce((s,p)=>s+p.val,0)):'—'}</td><td>${r.status==='NAO_REALIZADO'?'<span class="dg-pill warn">NÃO REALIZADA</span>':'<span class="dg-pill ok">✓ REALIZADA</span>'}</td></tr>`}).join('')||'<tr><td colspan="7" class="mut">Nada registrado no período.</td></tr>'}</tbody></table></div></section>`;
}
function dgRelCsv(D){
 const cab=['Data','Hora','Tipo','Atividade','Situação','1º lugar','2º lugar','3º lugar','Premiação total','Zona','Valor pago (reunião)','Demandas','Motivo (não realizada)','Registrado por'];
 const linhas=D.L.map(r=>{const k=dgKind(r),pl=k==='evento'?dgPlaces(r):[],p=n=>pl.find(x=>x.pos===n)?.name||'';return [String(r.date).slice(0,10).split('-').reverse().join('/'),r.time||'',k,r.title||r.scheduleName||'',r.status==='NAO_REALIZADO'?'NÃO REALIZADA':'REALIZADA',p(1),p(2),p(3),pl.reduce((s,x)=>s+x.val,0)||'',r.zone||'',k==='reuniao'?(r.valorPago||''):'',r.demandas||'',r.reason||'',r.createdByName||'']});
 org15Csv(`diario_${dgRel.per}_${dgIso(D.R.ini)}_${dgIso(D.R.fim)}.csv`,cab,linhas);
}
function dgRelPdf(D){
 const sub=`${D.R.rot} • gerado pelo High OS a partir do Discord`,pags=[],ins=dgRelInsights(D);
 pags.push(`<section class="pg">${rh15PrintTopo('Relatório do Diário Operacional',sub)}<div class="in"><div class="kp k4"><div><span>Atividades</span><b>${D.ok.length}</b><small>${D.nao.length} não realizada(s)</small></div><div class="ok"><span>Eventos</span><b>${D.ev.length}</b><small>${D.ranking.length} no pódio</small></div><div><span>Premiação paga</span><b>${dgMoney(D.premio)}</b><small>soma dos pódios</small></div><div><span>Reuniões • valor pago</span><b>${dgMoney(D.pago)}</b><small>${D.reu.length} reunião(ões)</small></div></div>
 ${ins.length?`<div class="note" style="font-size:12px;line-height:1.7;margin:0 0 12px">${ins.map(t=>'• '+t).join('<br>')}</div>`:''}
 <table><thead><tr><th>#</th><th>Organização</th><th class="n">1º</th><th class="n">2º</th><th class="n">3º</th><th class="n">Pontos</th><th class="n">Prêmios</th></tr></thead><tbody>${D.ranking.slice(0,14).map((r,i)=>`<tr><td>${i+1}</td><td><b>${esc(r.nome)}</b></td><td class="n">${r.v1}</td><td class="n">${r.v2}</td><td class="n">${r.v3}</td><td class="n"><b>${r.pontos}</b></td><td class="n">${dgMoney(r.valor)}</td></tr>`).join('')||'<tr><td colspan="7">Nenhum vencedor registrado.</td></tr>'}</tbody></table></div></section>`);
 if(D.reu.length)for(let i=0;i<D.reu.length;i+=12)pags.push(`<section class="pg">${rh15PrintTopo('Reuniões dos Padrinhos',sub)}<div class="in"><table><thead><tr><th>Data</th><th>Reunião</th><th class="n">Valor pago</th><th>Demandas</th></tr></thead><tbody>${D.reu.slice(i,i+12).map(r=>`<tr><td>${String(r.date).slice(0,10).split('-').reverse().join('/')}</td><td><b>${esc(r.title||'Reunião')}</b></td><td class="n"><b>${dgMoney(r.valorPago)}</b></td><td>${r.teveDemanda?esc(r.demandas||''):'Sem demandas'}</td></tr>`).join('')}</tbody></table><p class="note">Total pago no período: <b>${dgMoney(D.pago)}</b></p></div></section>`);
 for(let i=0;i<Math.max(1,D.L.length);i+=18)pags.push(`<section class="pg">${rh15PrintTopo('Eventos e atividades',sub)}<div class="in"><table><thead><tr><th>Data</th><th>Hora</th><th>Atividade</th><th>Resultado</th><th class="n">Prêmio</th><th>Situação</th></tr></thead><tbody>${D.L.slice(i,i+18).map(r=>{const k=dgKind(r),pl=k==='evento'?dgPlaces(r):[];return `<tr><td>${String(r.date).slice(0,10).split('-').reverse().join('/')}</td><td>${esc(r.time||'')}</td><td><b>${esc(r.title||r.scheduleName||'')}</b></td><td>${r.status==='NAO_REALIZADO'?esc(r.reason||'—'):k==='reuniao'?'Valor pago '+dgMoney(r.valorPago):pl.map(p=>p.pos+'º '+esc(p.name)).join(' · ')||esc(String(r.result||'').slice(0,80))}</td><td class="n">${pl.length?dgMoney(pl.reduce((s,p)=>s+p.val,0)):'—'}</td><td>${r.status==='NAO_REALIZADO'?'NÃO REALIZADA':'REALIZADA'}</td></tr>`}).join('')||'<tr><td colspan="6">Nada registrado.</td></tr>'}</tbody></table></div></section>`);
 const total=pags.length;rh15PrintAbrir('Diário Operacional — '+D.R.rot,pags.map((p,i)=>p.replace(/<\/section>$/,rh15PrintRodape(i+1,total)+'</section>')).join(''));
}
let dgRelUltimo=null;
async function dgRelRender(force=false){
 const box=$('#dgMain');if(!box)return;
 box.innerHTML=dgModoBar()+'<div class="dg-skeleton"><i></i><i></i><i></i><i></i></div>';
 try{const rows=await dgRelCarregar(force);dgRelUltimo=dgRelDados(rows);box.innerHTML=dgModoBar()+dgRelHtml(dgRelUltimo)}
 catch(e){box.innerHTML=dgModoBar()+`<div class="placeholder"><h3>ERRO AO CARREGAR</h3><p>${esc(e.message||String(e))}</p></div>`}
}
function dgModoBar(){return `<div class="dg-modo"><button type="button" data-dg-modo="dia" class="${dgModo==='dia'?'on':''}">📅 Dia</button><button type="button" data-dg-modo="rel" class="${dgModo==='rel'?'on':''}">📊 Relatórios</button></div>`}
{const _r=dgRender;dgRender=function(){if(dgModo==='rel')return;_r();const box=$('#dgMain');if(box&&!box.querySelector('.dg-modo'))box.insertAdjacentHTML('afterbegin',dgModoBar())}}
{const _l=loadOperationalDiary;loadOperationalDiary=async function(...a){if(dgModo==='rel')return dgRelRender(true);return _l.apply(this,a)}}
document.addEventListener('click',e=>{
 const m=e.target.closest?.('[data-dg-modo]');if(m){dgModo=m.dataset.dgModo;if(dgModo==='rel'){if(!dgRel.ref)dgRel.ref=$('#dgDate')?.value||diaryTodayIso();dgRelRender()}else{dgData=null;loadOperationalDiaryV146()}return}
 const p=e.target.closest?.('[data-dgrel-per]');if(p){dgRel.per=p.dataset.dgrelPer;dgRelRender();return}
 const mv=e.target.closest?.('[data-dgrel-mv]');if(mv){dgRelShift(+mv.dataset.dgrelMv);dgRelRender();return}
 const ex=e.target.closest?.('[data-dgrel-exp]');if(ex&&dgRelUltimo){ex.dataset.dgrelExp==='pdf'?dgRelPdf(dgRelUltimo):dgRelCsv(dgRelUltimo)}
});
document.addEventListener('change',e=>{if(e.target?.id==='dgRelIni'||e.target?.id==='dgRelFim'){dgRel.ini=$('#dgRelIni')?.value||'';dgRel.fim=$('#dgRelFim')?.value||'';dgRelRender()}});
{const _v=loadOperationalDiaryV146;loadOperationalDiaryV146=function(...a){if(dgModo==='rel')return dgRelRender(true);return _v.apply(this,a)}}
