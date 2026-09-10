import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { getFirestore, doc, getDoc, collection, getDocs, setDoc, addDoc, serverTimestamp, writeBatch, deleteDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

const firebaseConfig={apiKey:'AIzaSyBKtl3rCA9Id1RDMwGch-yi4hxAs83DraU',authDomain:'high-os.firebaseapp.com',projectId:'high-os',storageBucket:'high-os.firebasestorage.app',messagingSenderId:'471862600170',appId:'1:471862600170:web:ff55af6f7e808ff393d293'};
const app=initializeApp(firebaseConfig), auth=getAuth(app), db=getFirestore(app), provider=new GoogleAuthProvider();
provider.setCustomParameters({prompt:'select_account'});
const sheetsProvider=new GoogleAuthProvider();
sheetsProvider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
const facSheetProvider=new GoogleAuthProvider();
facSheetProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
const $=s=>document.querySelector(s), loginView=$('#loginView'),deniedView=$('#deniedView'),appView=$('#appView'),sessionArea=$('#sessionArea');
let currentUser=null,currentProfile=null,faccoes=[],solicitacoes=[],requestRecords=[],usuarios=[],organizacoes=[];
const facCol=collection(db,'highos','data','faccoes'), histCol=collection(db,'highos','data','historico'), reqCol=collection(db,'highos','data','solicitacoes'), deliveryCol=collection(db,'highos','data','entregas'), orgCol=collection(db,'highos','data','organizacoes'), sessionCol=collection(db,'highos','data','sessoes_usuario'), usersCol=collection(db,'users');
let currentSessionId='',currentSessionStart=0,sessionTimer=null,sessionWarningShown=false;
const segmentConfigDoc=doc(db,'highos','data','config','segmentos');
const dashboardConfigDoc=doc(db,'highos','data','config','dashboard');
const spotifyConfigDoc=doc(db,'highos','data','config','spotify');
const dashboardAlertCol=collection(db,'highos','data','alertas_dashboard');
const chatCol=collection(db,'highos','data','chat_mensagens');
const DEFAULT_DASHBOARD_CONFIG={quedaAtencaoPct:15,quedaCriticaPct:30,minComparacoes:4};
let dashboardConfig={...DEFAULT_DASHBOARD_CONFIG},dashboardAlertStates=[],spotifyConfig={url:'',clientId:''},chatUnsubscribe=null,chatItems=[],chatPendingAttachment=null,chatRecipientEmail='',spotifyPlayer=null,spotifyDeviceId='',spotifyAccessToken='',spotifyTokenExpiry=0,activeMeetingRoom='',activeMeetingUrl='',activeMeetingChannel='',teamCallPendingFile=null;
function sanitizeDashboardConfig(v={}){
 const legacyBase=Number(v.contingenteAlerta)||0;
 const atencao=Math.max(1,Math.min(90,Number(v.quedaAtencaoPct)|| (legacyBase?15:DEFAULT_DASHBOARD_CONFIG.quedaAtencaoPct)));
 const critico=Math.max(atencao+1,Math.min(100,Number(v.quedaCriticaPct)||DEFAULT_DASHBOARD_CONFIG.quedaCriticaPct));
 const minComparacoes=Math.max(1,Math.min(50,Number(v.minComparacoes)||DEFAULT_DASHBOARD_CONFIG.minComparacoes));
 return {quedaAtencaoPct:atencao,quedaCriticaPct:critico,minComparacoes};
}
async function loadDashboardConfig(){
 try{const snap=await getDoc(dashboardConfigDoc);dashboardConfig=sanitizeDashboardConfig(snap.exists()?snap.data():DEFAULT_DASHBOARD_CONFIG);if(!snap.exists()&&isAdmin())await setDoc(dashboardConfigDoc,{...dashboardConfig,updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true});await loadDashboardAlertStates();renderDashboardConfigAdmin();renderCommandDashboard();}
 catch(e){console.warn('Falha ao carregar parâmetros do dashboard',e);dashboardConfig={...DEFAULT_DASHBOARD_CONFIG};renderDashboardConfigAdmin();renderCommandDashboard();}
}
function dashboardHealth(alerts=[]){const open=alerts.filter(x=>(x.state||'PENDENTE')!=='CONCLUIDO');if(open.some(x=>x.level==='CRÍTICO'))return 'CRÍTICO';if(open.length)return 'ATENÇÃO';return 'NORMAL'}
function renderDashboardConfigAdmin(){
 const c=dashboardConfig||DEFAULT_DASHBOARD_CONFIG;
 const a=$('#dashCfgAtencao'),cr=$('#dashCfgCritico'),mc=$('#dashCfgMinComparacoes'),preview=$('#dashCfgPreview');
 if(a)a.value=c.quedaAtencaoPct;if(cr)cr.value=c.quedaCriticaPct;if(mc)mc.value=c.minComparacoes;
 if(preview)preview.innerHTML=`<div><span>NORMAL</span><b>sem queda relevante</b></div><div><span>ATENÇÃO</span><b>queda ≥ ${c.quedaAtencaoPct}%</b></div><div><span>CRÍTICO</span><b>queda ≥ ${c.quedaCriticaPct}%</b></div><small>A referência é sempre a <b>semana anterior</b>. A semana atual é comparada somente com os mesmos dias/horários já coletados, evitando alerta por semana incompleta. Mínimo de <b>${c.minComparacoes}</b> coletas comparáveis.</small>`;
}
async function saveDashboardConfig(){
 if(!isAdmin())return;
 const raw={quedaAtencaoPct:Number($('#dashCfgAtencao')?.value),quedaCriticaPct:Number($('#dashCfgCritico')?.value),minComparacoes:Number($('#dashCfgMinComparacoes')?.value)};
 if(!Number.isFinite(raw.quedaAtencaoPct)||raw.quedaAtencaoPct<1)return alert('Informe a queda percentual para ATENÇÃO.');
 if(!Number.isFinite(raw.quedaCriticaPct)||raw.quedaCriticaPct<=raw.quedaAtencaoPct)return alert('A queda CRÍTICA precisa ser maior que a queda de ATENÇÃO.');
 if(!Number.isFinite(raw.minComparacoes)||raw.minComparacoes<1)return alert('Informe o mínimo de coletas comparáveis.');
 const before={...dashboardConfig};dashboardConfig=sanitizeDashboardConfig(raw);
 try{await setDoc(dashboardConfigDoc,{...dashboardConfig,updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true});await addDoc(histCol,{sessionId:currentSessionId||'',tipo:'DASHBOARD_PARAMETROS',descricao:'Parâmetros semanais NORMAL / ATENÇÃO / CRÍTICO alterados',antes:before,depois:dashboardConfig,usuario:currentUser.email,data:serverTimestamp()});renderDashboardConfigAdmin();renderCommandDashboard();alert('Parâmetros semanais do Dashboard salvos.');}
 catch(e){dashboardConfig=before;alert('Não foi possível salvar os parâmetros: '+e.message)}
}
async function loadDashboardAlertStates(){try{const qs=await getDocs(dashboardAlertCol);dashboardAlertStates=qs.docs.map(d=>({id:d.id,...d.data()}))}catch(e){dashboardAlertStates=[];console.warn('Falha ao carregar status dos alertas',e)}}
function alertStateId(group,weekKey){return `CONTINGENTE_${String(group||'').replace(/[^a-zA-Z0-9_-]/g,'_')}_${weekKey}`}
function findDashboardAlertState(group,weekKey){return dashboardAlertStates.find(x=>x.id===alertStateId(group,weekKey))||null}
async function setDashboardAlertState(group,weekKey,status){
 if(!canEditModule('dashboard'))return permissionDeniedMessage('dashboard',true);
 const id=alertStateId(group,weekKey),before=findDashboardAlertState(group,weekKey),data={tipo:'CONTINGENTE_SEMANAL',group,weekKey,status,updatedAt:serverTimestamp(),updatedBy:currentUser.email};
 try{await setDoc(doc(db,'highos','data','alertas_dashboard',id),data,{merge:true});await addDoc(histCol,{sessionId:currentSessionId||'',tipo:'ALERTA_DASHBOARD',group,descricao:`Alerta semanal marcado como ${status}`,antes:before||null,depois:{group,weekKey,status},usuario:currentUser.email,data:serverTimestamp()});await loadDashboardAlertStates();renderCommandDashboard()}catch(e){alert('Erro ao atualizar o alerta: '+e.message)}
}
const DEFAULT_SEGMENTS=[
 {nome:'ARMAS',icone:'🔫',descricao:'Arsenal'},
 {nome:'MUNIÇÃO',icone:'🎯',descricao:'Munições'},
 {nome:'DROGAS',icone:'🧪',descricao:'Drogas'},
 {nome:'LAVAGEM',icone:'💵',descricao:'Lavagem'},
 {nome:'DESMANCHE',icone:'🔧',descricao:'Desmanche'},
 {nome:'ESTELIONATÁRIOS',icone:'💳',descricao:'Estelionatários'},
 {nome:'CONTRABANDO',icone:'📦',descricao:'Contrabando'},
 {nome:'APOIO',icone:'🛠️',descricao:'Apoio Ilegal'},
 {nome:'OUTROS',icone:'◆',descricao:'Outros'}
];
let segmentos=[...DEFAULT_SEGMENTS];
function cleanSegmentName(v=''){return String(v||'').trim().toUpperCase()}
function segmentDefs(){return segmentos.length?segmentos:DEFAULT_SEGMENTS}
function segmentNames(){return segmentDefs().map(x=>x.nome)}
function syncSegmentSelects(){
 const opts=segmentNames().map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
 ['fSegment','oSegment','segmentAssignTarget'].forEach(id=>{const el=$('#'+id);if(!el)return;const old=el.value;el.innerHTML=opts;if(old&&segmentNames().some(x=>segmentKey(x)===segmentKey(old)))el.value=segmentNames().find(x=>segmentKey(x)===segmentKey(old));});
 const metric=$('#metricSegment');if(metric){const old=metric.value;metric.innerHTML='<option value="">TODOS OS SEGMENTOS</option>'+opts;if(old&&segmentNames().includes(old))metric.value=old;}
}
async function loadSegmentConfig(){
 try{const snap=await getDoc(segmentConfigDoc);if(snap.exists()&&Array.isArray(snap.data().items)&&snap.data().items.length)segmentos=snap.data().items.map(x=>({nome:cleanSegmentName(x.nome),icone:x.icone||'◇',descricao:x.descricao||cleanSegmentName(x.nome)})).filter(x=>x.nome);else{segmentos=[...DEFAULT_SEGMENTS];if(String(currentProfile?.role||'').toUpperCase()==='ADMIN')await setDoc(segmentConfigDoc,{items:segmentos,updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true})}syncSegmentSelects();renderSegmentAdmin();}catch(e){console.warn('Falha ao carregar segmentos',e);segmentos=[...DEFAULT_SEGMENTS];syncSegmentSelects();}
}

const SEED=[{"numero": 1, "cds": "{1286.34,-266.43,99.7,303.31}", "anuncio": "", "qg": "Favela da Barragem", "group": "Armas01", "groupOriginal": "Armas01", "segmento": "ARMAS", "produto": "Pistola, Sub Metralhadora e Rifle", "faccao": "Imperial", "status": "ATIVA", "lider": "109 —Brunin Allef", "staff": "Ítalo Leonardo", "dataEntrega": "17/07/2026", "observacoes": ""}, {"numero": 2, "cds": "{2696.23,3400.29,58.82,90.71}", "anuncio": "", "qg": "Favela do MegaMall", "group": "Armas02", "groupOriginal": "Armas02", "segmento": "ARMAS", "produto": "Pistola, Sub Metralhadora e Rifle", "faccao": "Talibã", "status": "ATIVA", "lider": "4792—Grazzi Sette", "staff": "Italo Leonardo", "dataEntrega": "", "observacoes": ""}, {"numero": 3, "cds": "2355.39,-605.06,96.58,257.96", "anuncio": "NULO", "qg": "SEM LOCAL", "group": "Armas03", "groupOriginal": "Armas03", "segmento": "ARMAS", "produto": "Pistola, Sub Metralhadora e Rifle", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 4, "cds": "{-2390.91,-198.43,39.65,269.3}", "anuncio": "", "qg": "Favela da Praia 1", "group": "Armas04", "groupOriginal": "Armas04", "segmento": "ARMAS", "produto": "Pistola, Sub Metralhadora e Rifle", "faccao": "Peitanove", "status": "ATIVA", "lider": "2199—Boaventura P", "staff": "Ralf", "dataEntrega": "20/07/2026", "observacoes": ""}, {"numero": 5, "cds": "{2561.79,2437.52,55.47,110.56}", "anuncio": "SIM", "qg": "Favela do Dino", "group": "Armas05", "groupOriginal": "Armas05", "segmento": "ARMAS", "produto": "Pistola, Sub Metralhadora e Rifle", "faccao": "", "status": "INATIVA", "lider": "—", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 6, "cds": "{-2120.96,2482.66,10.03,133.23}", "anuncio": "", "qg": "Favela do Zancudo", "group": "Armas06", "groupOriginal": "Armas06", "segmento": "ARMAS", "produto": "Pistola, Sub Metralhadora e Rifle", "faccao": "Medellin", "status": "ATIVA", "lider": "7142—Alix Fainelli", "staff": "Italo Leonardo", "dataEntrega": "", "observacoes": ""}, {"numero": 7, "cds": "-113.73,-12.34,70.52,133.23", "anuncio": "", "qg": "Favela do Campinho", "group": "Armas07", "groupOriginal": "Armas07", "segmento": "ARMAS", "produto": "Pistola, Sub Metralhadora e Rifle", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": "", "semCraft": true}, {"numero": 8, "cds": "60.64,2602.08,87.1,303.31", "anuncio": "SIM", "qg": "Distrito 14 (apto norte)", "group": "Armas08", "groupOriginal": "Armas08", "segmento": "ARMAS", "produto": "Pistola, Sub Metralhadora e Rifle", "faccao": "", "status": "INATIVA", "lider": "—", "staff": "", "dataEntrega": "", "observacoes": "", "removido": true}, {"numero": 9, "cds": "2640.33,1789.71,33.62,102.05", "anuncio": "", "qg": "Favela da Indústria, Sul", "group": "Armas09", "groupOriginal": "Armas09", "segmento": "ARMAS", "produto": "Pistola, Sub Metralhadora e Rifle", "faccao": "Safadoes", "status": "ATIVA", "lider": "3182 / JUNIM SAFADO", "staff": "RALF PENA", "dataEntrega": "16/08/26", "observacoes": ""}, {"numero": 10, "cds": "-1431.37,2306.54,30.82,187.09", "anuncio": "SIM", "qg": "Favela da Cachoeira", "group": "Armas10", "groupOriginal": "Armas10", "segmento": "ARMAS", "produto": "Pistola, Sub Metralhadora e Rifle", "faccao": "Lotus", "status": "ATIVA", "lider": "12510 — Ray Hollow", "staff": "Italo Alves", "dataEntrega": "04/09/26", "observacoes": ""}, {"numero": 11, "cds": "{-480.22,1613.99,369.58,0.0}", "anuncio": "NAO", "qg": "FAVELA DO OBS 2", "group": "Armas11", "groupOriginal": "Armas 11", "segmento": "ARMAS", "produto": "Pistola, Sub Metralhadora e Rifle", "faccao": "Playboy", "status": "ATIVA", "lider": "12182 - Igor Mecktref", "staff": "Ralf Pena", "dataEntrega": "26/08/26", "observacoes": ""}, {"numero": 12, "cds": "1550.5,-728.82,111.51,204.1", "anuncio": "", "qg": "Clube de Festas, Açougue", "group": "Municao01", "groupOriginal": "Municao01", "segmento": "MUNIÇÃO", "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++", "faccao": "Golden Lotus", "status": "ATIVA", "lider": "9528—Maddy A Jhuns", "staff": "Jonh", "dataEntrega": "09/07/26", "observacoes": ""}, {"numero": 13, "cds": "{-779.26,985.57,249.23,195.6}", "anuncio": "NAO", "qg": "Favela do OBS 2", "group": "Municao02", "groupOriginal": "Municao02", "segmento": "MUNIÇÃO", "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 14, "cds": "-130.69,3220.77,73.72,255.12", "anuncio": "SIM", "qg": "Favela de Sandy Shores, Baixo", "group": "Municao03", "groupOriginal": "Municao03", "segmento": "MUNIÇÃO", "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++", "faccao": "Hidra", "status": "ATIVA", "lider": "12114- Jaque Miller", "staff": "Ralf Pena", "dataEntrega": "25/08/26", "observacoes": ""}, {"numero": 15, "cds": "1367.56,-2433.89,62.18,337.33", "anuncio": "", "qg": "Favela do Petróleo, Sul", "group": "Municao04", "groupOriginal": "Municao04", "segmento": "MUNIÇÃO", "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 16, "cds": "2047.86,5095.36,58.32,2.84", "anuncio": "", "qg": "QG da Plantação", "group": "Municao05", "groupOriginal": "Municao05", "segmento": "MUNIÇÃO", "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 17, "cds": "2473.01,4959.72,44.89,51.03", "anuncio": "NAO", "qg": "Mansao da Fazenda Queimada", "group": "Municao06", "groupOriginal": "Municao06", "segmento": "MUNIÇÃO", "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++", "faccao": "", "status": "INATIVA", "lider": "—", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 18, "cds": "-1896.6,2015.73,171.3,351.5", "anuncio": "", "qg": "Vinhedo", "group": "Municao07", "groupOriginal": "Municao07", "segmento": "MUNIÇÃO", "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++", "faccao": "Real Midia", "status": "ATIVA", "lider": "2323—Henrique Lewis", "staff": "Italo Leonardo", "dataEntrega": "", "observacoes": ""}, {"numero": 19, "cds": "-1771.7,-117.8,95.4", "anuncio": "", "qg": "Favela do Cemitério, Sul", "group": "Municao08", "groupOriginal": "Municao08", "segmento": "MUNIÇÃO", "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 20, "cds": "320.79,-2058.35,24.03,323.15", "anuncio": "NAO", "qg": "QG dos Vagos", "group": "Municao09", "groupOriginal": "Municao09", "segmento": "MUNIÇÃO", "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++", "faccao": "", "status": "INATIVA", "lider": "-", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 21, "cds": "-3694.8,3790.2,5.1", "anuncio": "", "qg": "Ilha Particular", "group": "Municao10", "groupOriginal": "Municao10", "segmento": "MUNIÇÃO", "produto": "Muni de Pistola, SMG e Rifle, Energetico Zero, C4 e C4 ++", "faccao": "Black Angels", "status": "ATIVA", "lider": "4510—Gordao", "staff": "Ralf Pena", "dataEntrega": "11/06/26", "observacoes": ""}, {"numero": 22, "cds": "241.5,-3144.2,3.3", "anuncio": "SIM", "qg": "Club 77", "group": "Lavagem01", "groupOriginal": "Lavagem01", "segmento": "LAVAGEM", "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora", "faccao": "", "status": "INATIVA", "lider": "—", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 23, "cds": "1466.47,1119.43,119.13,0.0", "anuncio": "", "qg": "FAZENDA, SUL", "group": "Lavagem02", "groupOriginal": "Lavagem02", "segmento": "LAVAGEM", "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora", "faccao": "Yakuza", "status": "ATIVA", "lider": "101—Mel Conha", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 24, "cds": "768.49,441.9,149.73,215.44", "anuncio": "", "qg": "Bahamas", "group": "Lavagem03", "groupOriginal": "Lavagem03", "segmento": "LAVAGEM", "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora", "faccao": "Renegados", "status": "ATIVA", "lider": "51—Ana Konda", "staff": "Italo Leonardo", "dataEntrega": "", "observacoes": ""}, {"numero": 25, "cds": "-482.6,1606.5,369.6", "anuncio": "NULO", "qg": "SEM LOCAL", "group": "Lavagem04", "groupOriginal": "Lavagem04", "segmento": "LAVAGEM", "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 26, "cds": "{-1540.36,81.20,56.58}", "anuncio": "", "qg": "Mansão da Playboy", "group": "Lavagem05", "groupOriginal": "Lavagem05", "segmento": "LAVAGEM", "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora", "faccao": "ICE", "status": "ATIVA", "lider": "899—Mani Khalifa", "staff": "Italo Leonardo", "dataEntrega": "", "observacoes": ""}, {"numero": 27, "cds": "", "anuncio": "SIM", "qg": "Boate Arcade", "group": "Lavagem06", "groupOriginal": "Lavagem06", "segmento": "LAVAGEM", "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 28, "cds": "1876.33,1511.54,112.98,357.17", "anuncio": "NULO", "qg": "SEM LOCAL", "group": "Lavagem07", "groupOriginal": "Lavagem07", "segmento": "LAVAGEM", "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 29, "cds": "SEM QG", "anuncio": "NULO", "qg": "SEM LOCAL", "group": "Lavagem08", "groupOriginal": "Lavagem08", "segmento": "LAVAGEM", "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": "", "removido": true}, {"numero": 30, "cds": "342.68,293.21,118.13,354.34", "anuncio": "NAO", "qg": "Galaxy", "group": "Lavagem09", "groupOriginal": "Lavagem09", "segmento": "LAVAGEM", "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora", "faccao": "", "status": "INATIVA", "lider": "—", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 31, "cds": "1876.33,1511.54,112.98,357.17", "anuncio": "NAO", "qg": "Favela do Sapao", "group": "Estelionatarios01", "groupOriginal": "Estelionatarios01", "segmento": "ESTELIONATÁRIOS", "produto": "Cartão Nuhigh Prata e Ouro e Dinheiro Falso", "faccao": "", "status": "INATIVA", "lider": "—", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 32, "cds": "-1376.69,-621.82,35.89,31.19", "anuncio": "NAO", "qg": "Favela da Boa Vista", "group": "Estelionatarios02", "groupOriginal": "Estelionatarios02", "segmento": "ESTELIONATÁRIOS", "produto": "Cartão Nuhigh Prata e Ouro e Dinheiro Falso", "faccao": "", "status": "INATIVA", "lider": "—", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 33, "cds": "657.75,-174.98,69.86,59.53", "anuncio": "NULO", "qg": "SEM LOCAL", "group": "Drogas01", "groupOriginal": "Drogas01", "segmento": "DROGAS", "produto": "Metadona, Capuz e Placa Balistica", "faccao": "", "status": "INATIVA", "lider": "—", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 34, "cds": "-1682.63,931.86,180.38,334.49", "anuncio": "NULO", "qg": "SEM LOCAL", "group": "Drogas02", "groupOriginal": "Drogas02", "segmento": "DROGAS", "produto": "Metadona, Capuz e Placa Balistica", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 35, "cds": "1367.25,-1381.16,108.73,257.96", "anuncio": "SIM", "qg": "Favela morro dos Macacos", "group": "Drogas03", "groupOriginal": "Drogas03", "segmento": "DROGAS", "produto": "Heroina, Capuz e Placa Balistica", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 36, "cds": "SEM QG", "anuncio": "NULO", "qg": "SEM LOCAL", "group": "Drogas04", "groupOriginal": "Drogas04", "segmento": "DROGAS", "produto": "Heroina, Capuz e Placa Balistica", "faccao": "", "status": "INATIVA", "lider": "—", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 37, "cds": "SEM QG", "anuncio": "NULO", "qg": "SEM LOCAL", "group": "Drogas05", "groupOriginal": "Drogas05", "segmento": "DROGAS", "produto": "Heroina, Capuz e Placa Balistica", "faccao": "", "status": "INATIVA", "lider": "—", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 38, "cds": "1550.5,-728.82,111.51,204.1", "anuncio": "NAO", "qg": "Favela do Helipa", "group": "Drogas06", "groupOriginal": "Drogas06", "segmento": "DROGAS", "produto": "Metadona, Capuz e Placa Balistica", "faccao": "Helipa", "status": "ATIVA", "lider": "12380 - Megan Fox", "staff": "Italo Alves", "dataEntrega": "01/09/2026", "observacoes": ""}, {"numero": 39, "cds": "-9.29,-1441.26,31.1,215.44", "anuncio": "SIM", "qg": "Residência Clinton", "group": "Drogas07", "groupOriginal": "Drogas07", "segmento": "DROGAS", "produto": "Anfetamina, Capuz e Placa Balistica", "faccao": "", "status": "INATIVA", "lider": "—", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 40, "cds": "{-2902.94,1485.7,71.12,153.08}", "anuncio": "SIM", "qg": "Favela da Praia 3", "group": "Drogas08", "groupOriginal": "Drogas08", "segmento": "DROGAS", "produto": "Crack, Capuz e Placa Balistica", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 41, "cds": "{-1682.63,931.86,180.38,334.49}", "anuncio": "NAO", "qg": "Favela do Asilo", "group": "Drogas09", "groupOriginal": "Drogas09", "segmento": "DROGAS", "produto": "Anfetamina, Capuz e Placa Balistica", "faccao": "Black Eagles", "status": "ATIVA", "lider": "1149—Sergio Medina", "staff": "Italo Leonardo", "dataEntrega": "", "observacoes": ""}, {"numero": 42, "cds": "{1772.1,6474.44,60.04,240.95}", "anuncio": "NAO", "qg": "Favela de Paleto, Norte", "group": "Drogas10", "groupOriginal": "Drogas10", "segmento": "DROGAS", "produto": "Heroina, Capuz e Placa Balistica", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 43, "cds": "{-59.76,-2517.63,7.30}", "anuncio": "SIM", "qg": "Posto, Porto", "group": "Drogas11", "groupOriginal": "Drogas11", "segmento": "DROGAS", "produto": "Crack, Capuz e Placa Balistica", "faccao": "", "status": "INATIVA", "lider": "—", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 44, "cds": "{-1332.84,-1238.37,1.4,317.49}", "anuncio": "SIM", "qg": "QG Gang 1", "group": "Desmanche01", "groupOriginal": "Desmanche01", "segmento": "DESMANCHE", "produto": "Cartão Ilegivel, Cartao Ilegivel ++, Gazua, Gazua++, Desmanche", "faccao": "Desmanche01", "status": "ATIVA", "lider": "12359 — Gtres Bittencourt", "staff": "Italo Leonardo", "dataEntrega": "", "observacoes": ""}, {"numero": 45, "cds": "-572.99,286.48,79.18,184.26", "anuncio": "NAO", "qg": "Tequi-la-la", "group": "Desmanche02", "groupOriginal": "Desmanche02", "segmento": "DESMANCHE", "produto": "Cartão Ilegivel, Cartao Ilegivel ++, Gazua, Gazua++, Desmanche", "faccao": "Tequila-la", "status": "ATIVA", "lider": "11728 - TiToin Gaspar", "staff": "Jonh Smith", "dataEntrega": "25/08/26", "observacoes": ""}, {"numero": 46, "cds": "-1376.69,-621.82,35.89,31.19", "anuncio": "NAO", "qg": "Favela da Placa", "group": "Desmanche03", "groupOriginal": "Desmanche03", "segmento": "DESMANCHE", "produto": "Cartão Ilegivel, Cartao Ilegivel ++, Gazua, Gazua++, Desmanche", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 47, "cds": "983.12,-126.47,74.05,320.32", "anuncio": "", "qg": "Motoclube Lost MC", "group": "Desmanche04", "groupOriginal": "Desmanche04", "segmento": "DESMANCHE", "produto": "Cartão Ilegivel, Cartao Ilegivel ++, Gazua, Gazua++, Desmanche", "faccao": "Abutres Motoclube", "status": "ATIVA", "lider": "11181 Chefinho", "staff": "Ralf Pena", "dataEntrega": "17/08/2026", "observacoes": ""}, {"numero": 48, "cds": "{-616.13,-1621.95,32.88}", "anuncio": "NAO", "qg": "Roogers", "group": "Desmanche05", "groupOriginal": "Desmanche05", "segmento": "DESMANCHE", "produto": "Cartão Ilegivel, Cartao Ilegivel ++, Gazua, Gazua++, Desmanche", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 49, "cds": "471.44,-1311.00,29.26", "anuncio": "", "qg": "Hayes Auto", "group": "Desmanche06", "groupOriginal": "Desmanche06", "segmento": "DESMANCHE", "produto": "Cartão Ilegivel, Cartao Ilegivel ++, Gazua, Gazua++, Desmanche", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 50, "cds": "2201.62,4689.18,37.68,68.04", "anuncio": "NAO", "qg": "Favela de Sandy Shores, Alto", "group": "Desmanche07", "groupOriginal": "Desmanche07", "segmento": "DESMANCHE", "produto": "Cartão Ilegivel, Cartao Ilegivel ++, Gazua, Gazua++, Desmanche", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 51, "cds": "92.59,-1290.91,29.25", "anuncio": "NAO", "qg": "Vanilla", "group": "Vanilla", "groupOriginal": "Vanilla", "segmento": "OUTROS", "produto": "Pendrive1, 2, 3, 4 e 5, Algemas e Alcool em Gel e Lavadora", "faccao": "Vannila Unicorn", "status": "ATIVA", "lider": "5128 - MECIN BARROS", "staff": "Ralf", "dataEntrega": "26/08/26", "observacoes": ""}, {"numero": 52, "cds": "227.44,-1388.25,32.45,36.86", "anuncio": "", "qg": "IML Centro", "group": "IlegalMedic1", "groupOriginal": "IlegalMedic1", "segmento": "APOIO", "produto": "Bandagem Infectada, Metadona, Adrenalina Clandestina", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 53, "cds": "", "anuncio": "NULO", "qg": "SEM LOCAL", "group": "IlegalMedic2", "groupOriginal": "IlegalMedic2", "segmento": "APOIO", "produto": "Bandagem Infectada, Metadona, Adrenalina Clandestina", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 54, "cds": "{2355.39,-605.06,96.58,257.96}", "anuncio": "", "qg": "Favela da DP", "group": "IlegalMecanic01", "groupOriginal": "IlegalMecanic01", "segmento": "APOIO", "produto": "Nitro, Tablet de Corrida,  Cartao Descartavel, Cartão Descartável ++", "faccao": "Comando Central", "status": "ATIVA", "lider": "10711—Rabico silva", "staff": "Nala", "dataEntrega": "27/07/2026", "observacoes": ""}, {"numero": 55, "cds": "", "anuncio": "", "qg": "Galpão do Porto", "group": "Contrabando01", "groupOriginal": "Contrabando01", "segmento": "CONTRABANDO", "produto": "Farme de todas as facções disponiveis", "faccao": "Capricorp", "status": "ATIVA", "lider": "819 - Joseph Capri", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 56, "cds": "", "anuncio": "NAO", "qg": "Casa do Lester", "group": "Contrabando02", "groupOriginal": "Contrabando02", "segmento": "CONTRABANDO", "produto": "Farme de todas as facções disponiveis", "faccao": "", "status": "INATIVA", "lider": "", "staff": "", "dataEntrega": "", "observacoes": ""}, {"numero": 57, "cds": "3899.68,4877.41,12.7,93.55", "anuncio": "", "qg": "Manicomio", "group": "Manicomio", "groupOriginal": "Manicomio", "segmento": "DROGAS", "produto": "LSD, Capuz e Placa Balistica, Glock Rajada, Gazua, Gazua ++, Adrenalina Clandestina", "faccao": "Manicomio", "status": "ATIVA", "lider": "15—Dark Rott", "staff": "Italo Leonardo", "dataEntrega": "", "observacoes": ""}];

function show(el){[loginView,deniedView,appView].forEach(x=>x.classList.add('hidden'));el.classList.remove('hidden')}
async function login(){try{await signInWithPopup(auth,provider)}catch(e){alert('Não foi possível entrar com Google: '+e.message)}}
const SESSION_MAX_MS=8*60*60*1000;
function sessionStorageKey(email=''){return 'highos_session_'+String(email||'').toLowerCase()}
function makeSessionId(email=''){return `${Date.now()}_${String(email||'user').replace(/[^a-z0-9]/gi,'_')}_${Math.random().toString(36).slice(2,8)}`}
function fmtDuration(ms=0){ms=Math.max(0,Number(ms)||0);const total=Math.floor(ms/1000),h=Math.floor(total/3600),m=Math.floor((total%3600)/60),sec=total%60;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`}
function sessionMeta(){return {sessionId:currentSessionId,sessionStart:currentSessionStart||0}}
async function closeCurrentSession(reason='LOGOUT'){
 if(!currentUser||!currentSessionId)return;
 const now=Date.now(),duration=Math.max(0,now-currentSessionStart);
 try{await setDoc(doc(db,'highos','data','sessoes_usuario',currentSessionId),{status:'ENCERRADA',endAt:serverTimestamp(),endAtText:new Date(now).toISOString(),lastActivityAt:serverTimestamp(),lastActivityText:new Date(now).toISOString(),durationMs:duration,endReason:reason,updatedBy:currentUser.email},{merge:true});
 await addDoc(histCol,{sessionId:currentSessionId||'',tipo:'SESSION_END',descricao:reason==='TIMEOUT_8H'?'Sessão encerrada automaticamente ao atingir 8 horas':'Sessão encerrada pelo usuário',duracaoMs:duration,usuario:currentUser.email,data:serverTimestamp()});}catch(e){console.warn('Falha ao encerrar sessão no log',e)}
 try{localStorage.removeItem(sessionStorageKey(currentUser.email))}catch(e){}
 currentSessionId='';currentSessionStart=0;if(sessionTimer){clearInterval(sessionTimer);sessionTimer=null}
}
async function logout(reason='LOGOUT'){await closeCurrentSession(reason);await signOut(auth)}
async function startOrResumeSession(user,profile){
 const email=String(user.email||'').toLowerCase(),key=sessionStorageKey(email),now=Date.now();let saved=null;
 try{saved=JSON.parse(localStorage.getItem(key)||'null')}catch(e){}
 if(saved?.id&&saved?.start&&now-saved.start<SESSION_MAX_MS){currentSessionId=saved.id;currentSessionStart=Number(saved.start)||now;}
 else{
  if(saved?.id&&saved?.start&&now-saved.start>=SESSION_MAX_MS){try{await setDoc(doc(db,'highos','data','sessoes_usuario',saved.id),{status:'ENCERRADA',endAtText:new Date(saved.start+SESSION_MAX_MS).toISOString(),durationMs:SESSION_MAX_MS,endReason:'TIMEOUT_8H'},{merge:true})}catch(e){}}
  currentSessionId=makeSessionId(email);currentSessionStart=now;sessionWarningShown=false;
  try{localStorage.setItem(key,JSON.stringify({id:currentSessionId,start:currentSessionStart,email}))}catch(e){}
  try{await setDoc(doc(db,'highos','data','sessoes_usuario',currentSessionId),{sessionId:currentSessionId,email,nome:profile?.name||user.displayName||'',role:String(profile?.role||'CONSULTA').toUpperCase(),cargo:profile?.cargo||String(profile?.role||'CONSULTA').toUpperCase(),status:'EM_ANDAMENTO',startAt:serverTimestamp(),startAtText:new Date(now).toISOString(),lastActivityAt:serverTimestamp(),lastActivityText:new Date(now).toISOString(),createdBy:email});
  await addDoc(histCol,{sessionId:currentSessionId||'',tipo:'SESSION_START',descricao:'Login no High OS',role:String(profile?.role||'CONSULTA').toUpperCase(),usuario:email,data:serverTimestamp()});}catch(e){console.warn('Falha ao registrar início da sessão',e)}
 }
 startSessionClock(email);
}
function renderSessionClock(email=''){
 if(!currentSessionStart||!currentSessionId)return;const elapsed=Date.now()-currentSessionStart,remaining=SESSION_MAX_MS-elapsed;
 const displayName=currentProfile?.name||currentUser?.displayName||email;
 const cargo=currentProfile?.cargo||String(currentProfile?.role||'CONSULTA').toUpperCase();
 const photo=currentUser?.photoURL||'';
 if(sessionArea){sessionArea.innerHTML=`<div class="bank-session-shell"><div class="bank-user-identity">${photo?`<img src="${esc(photo)}" alt="Foto Google">`:`<span class="bank-user-fallback">${esc(String(displayName||'?').slice(0,1).toUpperCase())}</span>`}<div><small>USUÁRIO CONECTADO</small><strong>${esc(displayName)}</strong><span>${esc(cargo)}</span></div></div><div class="bank-session-divider"></div><div class="session-clock-box"><span>BEM-VINDO, ${esc(email)}</span><b>TEMPO DE SESSÃO</b><small><strong>${fmtDuration(elapsed)}</strong><em>/ 08:00:00</em></small></div><button type="button" class="bank-logout-btn" id="logoutTopSession" title="Encerrar sessão"><span>↪</span><b>SAIR</b></button></div>`;$('#logoutTopSession')?.addEventListener('click',()=>logout('LOGOUT'));}
 if(remaining<=10*60*1000&&remaining>0&&!sessionWarningShown){sessionWarningShown=true;alert('Sua sessão expira em 10 minutos. Salve suas alterações.');}
 if(elapsed>=SESSION_MAX_MS){alert('Sua sessão atingiu o limite máximo de 8 horas e será encerrada. Faça login novamente para iniciar uma nova sessão.');logout('TIMEOUT_8H');}
}
function startSessionClock(email=''){if(sessionTimer)clearInterval(sessionTimer);renderSessionClock(email);sessionTimer=setInterval(()=>renderSessionClock(email),1000)}
async function touchSession(){if(!currentUser||!currentSessionId)return;try{await setDoc(doc(db,'highos','data','sessoes_usuario',currentSessionId),{lastActivityAt:serverTimestamp(),lastActivityText:new Date().toISOString()},{merge:true})}catch(e){}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')touchSession()});
window.addEventListener('beforeunload',()=>{try{if(currentUser&&currentSessionId)localStorage.setItem(sessionStorageKey(currentUser.email),JSON.stringify({id:currentSessionId,start:currentSessionStart,email:currentUser.email}))}catch(e){}});
$('#loginBtn').onclick=login;$('#loginBtnCard').onclick=login;$('#logoutBtn')?.addEventListener('click',()=>logout('LOGOUT'));$('#logoutDenied').onclick=logout;

const METRIC_ONLY_ROLES=new Set(['RH_METRICAS','RH_VISUALIZADOR','RH_ANALISTA','RH_GESTOR']);
// ===== HIGH OS V8.18 · PERMISSÕES GRANULARES POR MÓDULO =====
const SYSTEM_MODULES=[
 {id:'dashboard',label:'Dashboard',desc:'Visão geral e indicadores'},
 {id:'faccoes',label:'Groups / QGs',desc:'Patrimônio, perfil técnico, craft, farm e estrutura'},
 {id:'organizacoes',label:'Facções',desc:'Cadastros e perfis das organizações'},
 {id:'disponiveis',label:'Facções Disponíveis',desc:'Vagas, anúncios e disponibilidade'},
 {id:'entregas',label:'Entregas',desc:'Nova ocupação e entrega de Group'},
 {id:'solicitacoes',label:'Solicitações',desc:'Modelos e solicitações técnicas'},
 {id:'metricas',label:'Métricas',desc:'Central de métricas e relatórios'},
 {id:'economia',label:'Economia',desc:'Tabela, pista e referências econômicas'},
 {id:'historico',label:'Histórico',desc:'Movimentações e auditoria operacional'},
 {id:'planejador',label:'Planejador de Missões',desc:'Mapa GTA V, spawns, áreas e distribuição de equipes'},
 {id:'alvesinho',label:'Alvesinho',desc:'Assistente do High OS'},
 {id:'chat',label:'Chat da Equipe',desc:'Mensagens internas entre usuários logados'},
 {id:'spotify',label:'Spotify',desc:'Player de música integrado ao High OS'}
];
const INTERNAL_MODULE_PARENT={'group-profile':'faccoes','group-settings':'faccoes'};
function normalizePermission(v){v=String(v||'').toUpperCase();return ['NONE','VIEW','EDIT'].includes(v)?v:'NONE'}
function defaultPermissionsForRole(role='CONSULTA'){
 role=String(role||'CONSULTA').toUpperCase();const out={};
 if(role==='ADMIN'){SYSTEM_MODULES.forEach(m=>out[m.id]='EDIT');return out}
 if(METRIC_ONLY_ROLES.has(role)){SYSTEM_MODULES.forEach(m=>out[m.id]=m.id==='metricas'?'VIEW':'NONE');out.dashboard='VIEW';return out}
 if(role==='CONSULTA'){SYSTEM_MODULES.forEach(m=>out[m.id]='VIEW');return out}
 SYSTEM_MODULES.forEach(m=>out[m.id]=m.id==='historico'?'VIEW':'EDIT');return out
}
function effectivePermissions(profile=currentProfile){const role=String(profile?.role||'CONSULTA').toUpperCase();if(role==='ADMIN')return defaultPermissionsForRole('ADMIN');const base=defaultPermissionsForRole(role),custom=profile?.permissions||{};SYSTEM_MODULES.forEach(m=>{if(Object.prototype.hasOwnProperty.call(custom,m.id))base[m.id]=normalizePermission(custom[m.id])});return base}
function pageModule(page=''){return INTERNAL_MODULE_PARENT[page]||page}
function canViewModule(module){if(isAdmin())return true;return ['VIEW','EDIT'].includes(effectivePermissions()[pageModule(module)]||'NONE')}
function canEditModule(module){if(isAdmin())return true;return (effectivePermissions()[pageModule(module)]||'NONE')==='EDIT'}
function firstAllowedModule(){return SYSTEM_MODULES.find(m=>canViewModule(m.id))?.id||''}
function applyModuleAccess(role='CONSULTA'){
 const perms=effectivePermissions();document.body.classList.toggle('metric-only-access',false);
 document.querySelectorAll('.nav-item').forEach(btn=>{const page=btn.dataset.page;if(btn.classList.contains('admin-only')){btn.style.display=isAdmin()?'flex':'none';return}btn.style.display=canViewModule(page)?'flex':'none';});
 const active=document.querySelector('.page.active')?.id?.replace('page-','')||'dashboard';if(!isAdmin()&&!canViewModule(active)){const first=firstAllowedModule();if(first)activateAppPage(first)}
 document.body.dataset.accessMode='custom';
}
function mutationButton(btn){if(!btn)return false;const txt=String(btn.textContent||'').trim().toUpperCase();if(btn.matches('[type="submit"],.btn-danger,.admin-wipe,.tech-remove'))return true;return /(^|\s)(SALVAR|NOVO|NOVA|CRIAR|EDITAR|APAGAR|REMOVER|RECOLHER|TRANSFERIR|TROCAR|IMPORTAR|CONCLUIR|VINCULAR|RESET|ADICIONAR|ALTERAR|ATIVAR|DESATIVAR|REATIVAR)(\s|$)/.test(txt)}
function moduleForElement(el){const page=el?.closest?.('.page');if(page)return pageModule(page.id.replace('page-',''));const modal=el?.closest?.('.modal')?.id||'';const map={facModal:'faccoes',recipeEditorModal:'faccoes',farmEditorModal:'faccoes',movementModal:'faccoes',newDeliveryModal:'entregas',reqModal:'solicitacoes',craftRequestModal:'faccoes',metricSourceModal:'metricas',metricImportModal:'metricas',orgModal:'organizacoes',userModal:'administracao',auditSessionModal:'administracao',facSheetDiffModal:'administracao'};return map[modal]||pageModule(document.querySelector('.page.active')?.id?.replace('page-','')||'dashboard')}
function permissionDeniedMessage(module,edit=false){const label=SYSTEM_MODULES.find(m=>m.id===pageModule(module))?.label||module;alert(edit?`Seu acesso a ${label} é somente para visualização.\n\nSolicite a um ADMIN permissão de edição.`:`Você não possui acesso ao módulo ${label}.`)}
document.addEventListener('click',e=>{const nav=e.target.closest?.('.nav-item[data-page]');if(nav&&!nav.classList.contains('admin-only')&&!canViewModule(nav.dataset.page)){e.preventDefault();e.stopImmediatePropagation();permissionDeniedMessage(nav.dataset.page,false);return}const b=e.target.closest?.('button');if(!b||isAdmin())return;const mod=moduleForElement(b);if(mutationButton(b)&&!canEditModule(mod)){e.preventDefault();e.stopImmediatePropagation();permissionDeniedMessage(mod,true)}},true);
document.addEventListener('submit',e=>{if(isAdmin())return;const mod=moduleForElement(e.target);if(!canEditModule(mod)){e.preventDefault();e.stopImmediatePropagation();permissionDeniedMessage(mod,true)}},true);

onAuthStateChanged(auth,async user=>{
 currentUser=user;
 if(!user){show(loginView);sessionArea.innerHTML='<button class="btn-google" id="loginTop">G&nbsp; Entrar com Google</button>';$('#loginTop').onclick=login;return}
 const email=(user.email||'').toLowerCase();
 try{
  const snap=await getDoc(doc(db,'users',email));
  if(!snap.exists()||snap.data().active!==true){show(deniedView);$('#deniedText').textContent=`${email} foi autenticado, mas não possui cadastro ativo no High OS.`;sessionArea.innerHTML=`<span class="top-email">${email}</span><button class="mini-btn" id="logoutTop">Sair</button>`;$('#logoutTop').onclick=logout;return}
  currentProfile=snap.data();const role=String(currentProfile.role||'CONSULTA').toUpperCase();await startOrResumeSession(user,currentProfile);if(Date.now()-currentSessionStart>=SESSION_MAX_MS)return;show(appView);
  const userNameEl=$('#userName'),userRoleEl=$('#userRole'),userAccessEl=$('#userAccessLevel'),dashEmailEl=$('#dashEmail'),dashRoleEl=$('#dashRole'),userPhotoEl=$('#userPhoto');
  if(userNameEl)userNameEl.textContent=currentProfile.name||user.displayName||email;if(userRoleEl)userRoleEl.textContent=currentProfile.cargo||role;if(userAccessEl)userAccessEl.textContent='ACESSO: '+role;if(dashEmailEl)dashEmailEl.textContent=email;if(dashRoleEl)dashRoleEl.textContent=role;
  if(userPhotoEl){if(user.photoURL){userPhotoEl.src=user.photoURL;userPhotoEl.style.display=''}else userPhotoEl.style.display='none';}
  document.querySelectorAll('.admin-only').forEach(el=>el.style.display=role==='ADMIN'?'flex':'none');
  applyModuleAccess(role);
  renderSessionClock(email);
  await loadSegmentConfig();
  await loadDashboardConfig();
  await loadFaccoes();
  await loadMetrics();
  if(canViewModule('spotify'))await loadSpotifyConfig();
  if(canViewModule('chat'))startChat();
  if(canViewModule('economia'))loadMarketCatalog();
  if(role==='ADMIN') await loadUsers();
 }catch(e){show(deniedView);$('#deniedText').textContent='Falha ao validar seu cadastro no Firestore: '+e.message}
});

document.querySelectorAll('.nav-item').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));btn.classList.add('active');document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));$('#page-'+btn.dataset.page).classList.add('active');if(btn.dataset.page==='administracao'&&isAdmin())loadUserAudit();if(btn.dataset.page==='planejador')setTimeout(()=>window.HighMissionPlanner?.activate?.(),60)}));

// HIGH OS V6.7 · o perfil do Group passa a abrir como página interna, não como modal.
function activateAppPage(page){
 if(page!=='administracao'&&page!=='usuarios'&&!isAdmin()&&!canViewModule(page)){permissionDeniedMessage(page,false);const fallback=firstAllowedModule();if(!fallback||fallback===page)return;page=fallback}
 if(page==='administracao'&&isAdmin())setTimeout(()=>loadUserAudit(),0);if(page==='spotify')setTimeout(()=>loadSpotifyConfig(),0);if(page==='chat')setTimeout(()=>startChat(),0);if(page==='planejador')setTimeout(()=>window.HighMissionPlanner?.activate?.(),60);
 document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id==='page-'+page));
 document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.page===page));
 try{window.scrollTo({top:0,behavior:'smooth'})}catch{}
}
function showGroupProfilePage(f){
 const card=$('#facModal .fac-modal-card-wide')||$('.fac-modal-card-wide');
 const mount=$('#groupProfileMount');
 if(card&&mount&&card.parentElement!==mount){mount.appendChild(card);card.classList.add('profile-page-card')}
 $('#groupProfilePageTitle').textContent=f?.group||'GROUP';
 $('#groupProfilePageSubtitle').textContent=[f?.qg||'QG sem nome',f?.faccao?`Ocupante: ${f.faccao}`:'Group vago'].join(' • ');
 const st=$('#groupProfilePageStatus');if(st)st.innerHTML=`<span class="status-chip ${(f?.status||'INATIVA').toLowerCase()}">${esc(f?.status==='ATIVA'?'OCUPADO':'VAGO')}</span>`;
 activateAppPage('group-profile');
}
function closeGroupProfilePage(){activateAppPage('faccoes')}
$('#groupProfileBack')?.addEventListener('click',closeGroupProfilePage);


async function loadFaccoes(){
 try{const qs=await getDocs(facCol);faccoes=qs.docs.map(d=>({id:d.id,...d.data()}));faccoes.sort((a,b)=>(a.numero||999)-(b.numero||999));renderFaccoes();renderAvailableFaccoes()}catch(e){$('#facList').innerHTML=`<div class="placeholder"><h3>ERRO AO CARREGAR</h3><p>${e.message}</p></div>`}
}
function renderFaccoes(){
 const q=($('#facSearch').value||'').toLowerCase(),seg=$('#facSegment').value,st=$('#facStatus').value;
 const filtered=faccoes.filter(f=>(!seg||f.segmento===seg)&&(!st||f.status===st)&&(!q||[f.group,f.faccao,f.qg,f.lider,f.staff,f.produto].join(' ').toLowerCase().includes(q)));
 const at=faccoes.filter(f=>f.status==='ATIVA').length;
 $('#facStats').innerHTML=`<span><b>${faccoes.length}</b> POSIÇÕES</span><span><b>${at}</b> ATIVAS</span><span><b>${faccoes.length-at}</b> VAGAS</span><span><b>${filtered.length}</b> EXIBIDAS</span>`;
 if(!operacionais.length){$('#facList').innerHTML='<div class="placeholder"><b>◆</b><h3>BASE AINDA NÃO IMPORTADA</h3><p>ADMIN: clique em “IMPORTAR BASE INICIAL”.</p></div>';return}
 $('#facList').innerHTML=filtered.map(f=>`<article class="fac-card" data-id="${f.id}"><div class="fac-card-head"><h3>${esc(f.group)}</h3><span class="status-chip ${f.status==='ATIVA'?'ativa':'inativa'}">${f.status==='ATIVA'?'ATIVA':'VAGA'}</span></div><div class="fac-name">${esc(f.faccao||'— VAGA —')}</div><div class="muted">${esc(f.segmento)} • ${esc(f.qg||'SEM LOCAL')}</div><div class="muted">${f.lider?'Líder: '+esc(f.lider):''}${f.staff?'<br>Staff: '+esc(f.staff):''}</div><div class="product">${esc(f.produto||'')}</div><div class="card-actions"><button class="mini-btn req-from-fac" data-group="${esc(f.group)}">NOVA SOLICITAÇÃO</button></div></article>`).join('');
 document.querySelectorAll('.fac-card').forEach(c=>c.onclick=(e)=>{if(e.target.closest('.req-from-fac'))return;openFac(c.dataset.id)});document.querySelectorAll('.req-from-fac').forEach(b=>b.onclick=(e)=>{e.stopPropagation();openRequestModal('',b.dataset.group)});
}
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
['facSearch','facSegment','facStatus'].forEach(id=>$('#'+id).addEventListener(id==='facSearch'?'input':'change',renderFaccoes));

$('#seedBtn').onclick=async()=>{
 if(currentProfile?.role!=='ADMIN')return;
 if(faccoes.length){alert('A base já possui registros. A importação inicial foi bloqueada para evitar duplicidade.');return}
 if(!confirm(`Importar as ${SEED.length} posições do Documento das Facções para o Firestore?`))return;
 try{const batch=writeBatch(db);SEED.forEach(f=>batch.set(doc(db,'highos','data','faccoes',f.group),{...f,updatedAt:serverTimestamp(),updatedBy:currentUser.email}));await batch.commit();await addDoc(histCol,{sessionId:currentSessionId||'',tipo:'IMPORTACAO_INICIAL',descricao:`Base inicial importada: ${SEED.length} posições`,usuario:currentUser.email,data:serverTimestamp()});await loadFaccoes();alert('Base inicial importada com sucesso.')}catch(e){alert('Erro na importação: '+e.message)}
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
 $('#fVipOrg').checked=!!b.vipOrg;$('#fChatFaccao').checked=!!b.chatFaccao;
 $('#fSalario').value=b.salario||'';$('#fSalarioMin').value=b.salarioMinutos||'';$('#fRadio').value=b.radio||'';
 $('#fGaragemVipBlip').value=b.garagemVipBlip||'';$('#fGaragemVipSpawn').value=b.garagemVipSpawn||'';$('#fGaragemVipVeiculos').value=b.garagemVipVeiculos||'';
 $('#fLojaRoupas').value=b.lojaRoupas||'';$('#fBarbearia').value=b.barbearia||'';$('#fTatuagem').value=b.tatuagem||'';$('#fShopExclusivo').value=b.shopExclusivo||'';
 $('#fBau').value=b.bau||'';$('#fBauCapacidade').value=b.bauCapacidade||'';$('#fArena').value=b.arena||'';$('#fFarm').value=b.farm||'';$('#fCraft').value=b.craft||'';
 $('#fRotaExclusiva').checked=!!b.rotaExclusiva;$('#fRotaBlips').value=b.rotaBlips||'';$('#fTelao').checked=!!b.telao;$('#fTelaoNome').value=b.telaoNome||'';$('#fTelaoPostit').value=b.telaoPostit||'';$('#fTelaoCds').value=b.telaoCds||'';
 $('#fGaragemPublica').checked=!!b.garagemPublica;$('#fGaragemPublicaBlip').value=b.garagemPublicaBlip||'';$('#fGaragemPublicaSpawn').value=b.garagemPublicaSpawn||'';
 $('#fHeliponto').checked=!!b.heliponto;$('#fHelipontoBlip').value=b.helipontoBlip||'';$('#fHelipontoSpawn').value=b.helipontoSpawn||'';$('#fOutrosBeneficios').value=b.outros||'';
}
function selectedDefaultBenefits(){return [...document.querySelectorAll('[data-default-benefit]:checked')].map(x=>x.dataset.defaultBenefit)}
function currentFactionFromForm(){
 const old=faccoes.find(x=>x.group===$('#fGroup').value)||{};
 return {...old,group:$('#fGroup').value,status:$('#fStatus').value,faccao:$('#fFaccao').value.trim(),qg:$('#fQG').value.trim(),produto:$('#fProduto').value.trim(),lider:$('#fLider').value.trim(),staff:$('#fStaff').value.trim(),dataEntrega:$('#fData').value.trim(),anuncio:$('#fAnuncio').value.trim(),imagemAnuncio:$('#fImagemAnuncio')?.value.trim()||'',contingenteMin:Number($('#fContingenteMin')?.value||15),contingenteMax:Number($('#fContingenteMax')?.value||28),cds:$('#fCds').value.trim(),observacoes:$('#fObs').value.trim(),beneficios:getFormBenefits(),perfilEntrega:{planoPadrao:$('#fPlanoPadrao')?.value.trim()||'',observacao:$('#fPerfilObs')?.value.trim()||'',beneficiosPadrao:selectedDefaultBenefits()},perfilTecnico:getTechProfileFromForm()};
}
function benefitLines(f){
 const b=f?.beneficios||{}, out=[];
 if(b.vipOrg)out.push('VIP Org');
 if(b.salario)out.push(`Salário: R$ ${b.salario} a cada ${b.salarioMinutos||40} minutos`);
 if(b.chatFaccao)out.push('Chat da Facção');
 if(b.radio)out.push(`Rádio Exclusiva: ${b.radio}`);
 if(b.garagemVipBlip||b.garagemVipSpawn)out.push('Garagem VIP Org');
 if(b.lojaRoupas)out.push('Loja de Roupas');if(b.barbearia)out.push('Barbearia');if(b.tatuagem)out.push('Tatuagem');if(b.shopExclusivo)out.push('Shop Exclusivo');
 if(b.bau)out.push(`Baú${b.bauCapacidade?' ('+b.bauCapacidade+')':''}`);if(b.arena)out.push('Blip de Arena');if(b.farm)out.push('Farm');if(b.craft)out.push('Craft');
 if(b.rotaExclusiva)out.push('Rota Exclusiva');if(b.telao)out.push(`Telão${b.telaoNome?' ('+b.telaoNome+')':''}`);
 if(b.garagemPublica)out.push('Garagem Pública');if(b.heliponto)out.push('Heliponto');
 if(b.outros)out.push(...b.outros.split(/\r?\n/).map(x=>x.trim()).filter(Boolean));
 return out;
}
function buildDeliveryExtract(f=currentFactionFromForm()){
 const items=benefitLines(f), L=['ENTREGA DE ORGANIZAÇÃO — HIGH ILEGAL','','Facção: '+(f.faccao||'—'),'Group: '+(f.group||'—'),'Segmento: '+(f.segmento||'—'),'Local/QG: '+(f.qg||'—')];
 if(f.produto)L.push('Produto/Eixo: '+f.produto);if(f.lider)L.push('Líder: '+f.lider);if(f.staff)L.push('Staff responsável: '+f.staff);if(f.dataEntrega)L.push('Data da entrega: '+f.dataEntrega);
 L.push('','Benefícios / Setagens:');L.push(...(items.length?items.map(x=>'• '+x):['• Nenhum benefício/setagem cadastrado']));
 if(f.observacoes)L.push('','Observações: '+f.observacoes);
 return L.join('\n');
}
function changedBenefit(oldB={},newB={},keys=[]){return keys.some(k=>String(oldB?.[k]??'')!==String(newB?.[k]??''))}
function samePlain(a,b){return JSON.stringify(clonePlain(a||{}))===JSON.stringify(clonePlain(b||{}))}
function operationalRequestAdditions(old={},f={}){
 const req=[],oldO=mergedTechProfile(old).operacional||opBlank(),newO=f?.perfilTecnico?.operacional||mergedTechProfile(f).operacional||opBlank(),group=f.group||old.group||'{Group}';
 const og=t=>oldO.garagens?.find(x=>x.tipo===t)||{},ng=t=>newO.garagens?.find(x=>x.tipo===t)||{};
 const add=(tipo,titulo,texto)=>req.push({tipo,titulo,texto});
 const pub2=ng('PUBLICA_2'),oldPub2=og('PUBLICA_2');
 if((pub2.blip||pub2.spawn)&&!samePlain(oldPub2,pub2))add('GARAGEM','Garagem Pública 2',['Assunto:','','- Solicitação de Garagem Pública;','','Solicitação:','','- Adicione uma garagem pública na CDS abaixo:','',`- Blip: ${fmtCds(pub2.blip)}`,`- Spawn: ${fmtCds(pub2.spawn)}`,'',`- Permissão: ${group}`].join('\n'));
 const serv=ng('SERVICO'),oldServ=og('SERVICO');
 if((serv.blip||serv.spawn||serv.veiculos)&&!samePlain(oldServ,serv))add('GARAGEM_SERVICO','Garagem de Serviço / VIP Org',['Assunto:','',`- Adição de Garagem de Serviço no Group "${group}";`,'','Solicitação:','',`- Adicione uma garagem de serviço no Group "${group}";`,'','- Tipo: SERVIÇO / VIP ORG;',`- Veículos de aluguel: ${serv.veiculos||'{veiculo1}, {veiculo2}'};`,'',`- Blip: ${fmtCds(serv.blip)}`,`- Spawn: ${fmtCds(serv.spawn)}`,'',`- A garagem deverá ficar disponível para todos os membros do Group "${group}".`,'',`- Permissão: "${group}".`].join('\n'));
 const arm=newO.blindados||{},oldArm=oldO.blindados||{};
 if((arm.blip||arm.spawn||arm.veiculos||arm.vagas)&&!samePlain(oldArm,arm))add('GARAGEM_BLINDADOS','Garagem de Blindados',['Assunto:','',`- Adição de Garagem de Blindados no Group "${group}";`,'','Solicitação:','',`- Adicione uma garagem de blindados no Group "${group}";`,'',`- Quantidade de vagas: ${arm.vagas||'{quantidade}'};`,`- Blip: ${fmtCds(arm.blip)}`,`- Spawn da garagem: ${fmtCds(arm.spawn)}`,`- Spawn do veículo blindado: ${arm.veiculos||'{spawn_do_veiculo}'};`,'',`- Obs: Os veículos só serão spawnados após o líder cadastrar no painel o membro permissionado a pegar o mesmo. Se o membro não tiver set, informar para solicitar à liderança o set de blindado, dentro das vagas disponíveis. Se não houver mais blindado disponível, exibir a mensagem: "Esse Group já setou todas as vagas de blindados disponíveis, verifique com o líder da facção."`,'',`- Permissão: "${group}".`].join('\n'));
 return req;
}
function autoDeliveryRequests(f=currentFactionFromForm()){
 const old=faccoes.find(x=>x.group===f.group)||{}, ob=old.beneficios||{}, b=f.beneficios||{}, req=[];
 const add=(tipo,titulo,texto)=>req.push({tipo,titulo,texto});
 const vipKeys=['vipOrg','salario','salarioMinutos','chatFaccao','radio','garagemVipBlip','garagemVipSpawn','garagemVipVeiculos','lojaRoupas','barbearia','tatuagem','shopExclusivo','bau','bauCapacidade','arena','farm','craft','outros'];
 if(b.vipOrg && (!ob.vipOrg || changedBenefit(ob,b,vipKeys))){
   let L=['Assunto: Ativação de benefícios de uma organização e alguns blips','','Solicitação:','','- Ativação de benefícios de uma organização e alguns blips','',`- Group: ${f.group}`];
   if(b.salario)L.push('',`- Ativar salário de ${b.salario} (A cada ${b.salarioMinutos||40} minutos)`);
   if(b.radio)L.push('',`- Ativar Rádio exclusiva: ${b.radio}`); if(b.chatFaccao)L.push('','- Ativar Chat Facção.');
   if(b.garagemVipBlip||b.garagemVipSpawn){L.push('','- Ativar Garagem VIP:','','- Blip de Garagem VIP Org.');if(b.garagemVipVeiculos)L.push(`- Veículos: ${b.garagemVipVeiculos}`);L.push('',`- Blip: ${fmtCds(b.garagemVipBlip)}`,`- Spawn: ${fmtCds(b.garagemVipSpawn)}`)}
   [['Loja de roupas',b.lojaRoupas],['Barbearia',b.barbearia],['Tatuagem',b.tatuagem],['Shop Exclusivo',b.shopExclusivo],['Baú',b.bau],['Blip de arena',b.arena],['Farm',b.farm],['Craft',b.craft]].forEach(([n,v])=>{if(v)L.push('',`- ${n}: ${fmtCds(v)}`)}); if(b.bauCapacidade)L.push(`- Capacidade do Baú: ${b.bauCapacidade}`); if(b.outros)L.push('',...b.outros.split(/\r?\n/).filter(Boolean).map(x=>'- '+x));
   add('BENEFICIOS','VIP Org / Benefícios e Setagens',L.join('\n'));
 }
 if(b.rotaExclusiva && (!ob.rotaExclusiva || changedBenefit(ob,b,['rotaBlips']))){let pts=(b.rotaBlips||'').split(/\r?\n/).filter(Boolean);add('ROTA_FARM','Rota de Farm Exclusiva',['Assunto: Ativação de rota de farm exclusiva','','Solicitação:','','- Ativação de rota de farm exclusiva',`- Group: ${f.group}`,'','- Blips da rota nova:','',...(pts.length?pts:['{ CDS },'])].join('\n'))}
 if(b.telao && (!ob.telao || changedBenefit(ob,b,['telaoNome','telaoPostit','telaoCds']))){add('TELAO','Telão da Organização',['Assunto: Ativação de Telão Hall em uma Organização Ilegal','','Solicitação:','','- Ativação de Telão Hall em uma Organização Ilegal.','',`- Group: ${f.group}`,`- Telão usado: ${b.telaoNome||'{modelo_do_telao}'}`,'','- Local/Coordenadas de onde está o telão (coordenadas pega com postit):',`  ${fmtCds(b.telaoPostit)}`,'','- Local/Coordenadas de onde está o telão (coordenadas pega com cds):',`  ${fmtCds(b.telaoCds)}`].join('\n'))}
 if(b.garagemPublica && (!ob.garagemPublica || changedBenefit(ob,b,['garagemPublicaBlip','garagemPublicaSpawn']))){add('GARAGEM','Garagem Pública',['Assunto:','','- Solicitaçao de Garagem Publica;','','Solicitaçao:','','- Adicione uma garagem publica na CDS abaixo:','',`* Blip: ${fmtCds(b.garagemPublicaBlip)}`,`* Spawn: ${fmtCds(b.garagemPublicaSpawn)}`,'',`- Permissao : ${f.group}`].join('\n'))}
 if(b.heliponto && (!ob.heliponto || changedBenefit(ob,b,['helipontoBlip','helipontoSpawn']))){add('HELIPONTO','Heliponto',['Assunto: Adição de Heliponto','','Solicitação:','- Adicione um Heliponto na cds abaixo;',`- ${fmtCds(b.helipontoBlip)}`,...(b.helipontoSpawn?['',`- Spawn: ${fmtCds(b.helipontoSpawn)}`]:[]),'',`- Group: ${f.group}.`].join('\n'))}
 operationalRequestAdditions(old,f).forEach(x=>{if(!req.some(r=>requestFingerprint({group:f.group,tipo:r.tipo,texto:r.texto})===requestFingerprint({group:f.group,tipo:x.tipo,texto:x.texto})))req.push(x)});
 return req;
}
function renderDeliveryRequests(){const box=$('#deliveryRequestsPreview');if(!box)return;const rs=autoDeliveryRequests();box.innerHTML=rs.length?rs.map((r,i)=>`<article class="delivery-request-card"><div><b>${i+1}. ${esc(r.titulo)}</b><span>${esc(r.tipo)}</span></div><pre>${esc(r.texto)}</pre></article>`).join(''):'<div class="delivery-no-change">Nenhuma nova solicitação necessária com as alterações atuais.</div>'}
function updateDeliveryPreview(){if($('#deliveryPreview'))$('#deliveryPreview').value=buildDeliveryExtract();renderDeliveryRequests()}
async function copyDeliveryRequests(){const rs=autoDeliveryRequests(),t=rs.map((r,i)=>`===== ${i+1}. ${r.titulo.toUpperCase()} =====\n\n${r.texto}`).join('\n\n');if(!t)return alert('Nenhuma solicitação técnica nova foi identificada.');try{await navigator.clipboard.writeText(t);const b=$('#copyDeliveryRequestsBtn'),o=b.textContent;b.textContent='COPIADO ✓';setTimeout(()=>b.textContent=o,1400)}catch(e){alert('Não foi possível copiar automaticamente.') }}
async function copyDeliveryExtract(){const t=$('#deliveryPreview').value;try{await navigator.clipboard.writeText(t);const b=$('#copyDeliveryBtn'),o=b.textContent;b.textContent='COPIADO ✓';setTimeout(()=>b.textContent=o,1400)}catch(e){$('#deliveryPreview').select();document.execCommand('copy')}}

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
 const raw=faccoes.find(x=>x.id===id);if(!raw)return;const f=resolveGroupIdentity(raw);
 $('#fGroup').value=f.group;$('#fGroupShow').value=f.group;syncSegmentSelects();if($('#fSegment'))$('#fSegment').value=segmentNames().find(x=>segmentKey(x)===segmentKey(f.segmento||''))||f.segmento||'OUTROS';$('#fStatus').value=f.status||'INATIVA';$('#fFaccao').value=f.faccao||'';$('#fQG').value=f.qg||'';$('#fProduto').value=f.produto||'';$('#fLider').value=f.lider||'';$('#fStaff').value=f.staff||'';$('#fData').value=f.dataEntrega||'';$('#fAnuncio').value=f.anuncio||'';if($('#fImagemAnuncio'))$('#fImagemAnuncio').value=f.imagemAnuncio||'';if($('#fContingenteMin'))$('#fContingenteMin').value=f.contingenteMin||15;if($('#fContingenteMax'))$('#fContingenteMax').value=f.contingenteMax||28;$('#fCds').value=f.cds||'';$('#fObs').value=f.observacoes||'';setFormBenefits(f.beneficios||{});renderDefaultDeliveryProfile(f);renderTechProfile(f);$('#facModalTitle').textContent=f.group;showGroupProfilePage(f);updateDeliveryPreview();
 $('#recolherBtn').style.display=f.status==='ATIVA'?'block':'none';
}
$('#facModalClose').onclick=closeGroupProfilePage;

['fSegment','fStatus','fFaccao','fQG','fProduto','fLider','fStaff','fData','fAnuncio','fImagemAnuncio','fContingenteMin','fContingenteMax','fCds','fObs','fVipOrg','fChatFaccao','fSalario','fSalarioMin','fRadio','fGaragemVipBlip','fGaragemVipSpawn','fGaragemVipVeiculos','fLojaRoupas','fBarbearia','fTatuagem','fShopExclusivo','fBau','fBauCapacidade','fArena','fFarm','fCraft','fRotaExclusiva','fRotaBlips','fTelao','fTelaoNome','fTelaoPostit','fTelaoCds','fGaragemPublica','fGaragemPublicaBlip','fGaragemPublicaSpawn','fHeliponto','fHelipontoBlip','fHelipontoSpawn','fOutrosBeneficios','fPlanoPadrao','fPerfilObs','fTechCraftCds','fTechCraftNome','fTechFarmCds','fTechRouteName','fTechRouteStart','fTechRoutePoints'].forEach(id=>$('#'+id)?.addEventListener('input',updateDeliveryPreview));
$('#copyDeliveryBtn').onclick=copyDeliveryExtract; $('#copyDeliveryRequestsBtn').onclick=copyDeliveryRequests;

$('#facForm').onsubmit=async e=>{
 e.preventDefault();const group=$('#fGroup').value,old=faccoes.find(x=>x.group===group);getTechProfileFromForm();const data={...old,segmento:$('#fSegment')?.value||old?.segmento||'OUTROS',status:$('#fStatus').value,faccao:$('#fFaccao').value.trim(),qg:$('#fQG').value.trim(),produto:$('#fProduto').value.trim(),lider:$('#fLider').value.trim(),staff:$('#fStaff').value.trim(),dataEntrega:$('#fData').value.trim(),anuncio:$('#fAnuncio').value.trim(),imagemAnuncio:$('#fImagemAnuncio')?.value.trim()||'',contingenteMin:Number($('#fContingenteMin')?.value||15),contingenteMax:Number($('#fContingenteMax')?.value||28),cds:$('#fCds').value.trim(),observacoes:$('#fObs').value.trim(),beneficios:getFormBenefits(),perfilEntrega:{planoPadrao:$('#fPlanoPadrao')?.value.trim()||'',observacao:$('#fPerfilObs')?.value.trim()||'',beneficiosPadrao:selectedDefaultBenefits()},perfilTecnico:getTechProfileFromForm(),updatedAt:serverTimestamp(),updatedBy:currentUser.email};
 if(data.status==='ATIVA'&&!data.faccao){alert('Informe o nome da facção para marcar como ATIVA.');return}
 try{const generated=autoDeliveryRequests(data);await setDoc(doc(db,'highos','data','faccoes',group),data);const localIndex=faccoes.findIndex(x=>x.group===group);if(localIndex>=0)faccoes[localIndex]={...faccoes[localIndex],...clonePlain(data)};await addDoc(histCol,{sessionId:currentSessionId||'',tipo:(old?.qg!==data.qg||old?.cds!==data.cds||JSON.stringify(old?.beneficios||{})!==JSON.stringify(data.beneficios||{}))?'QG_ALTERADO':(old?.status==='INATIVA'&&data.status==='ATIVA'?'ENTREGA':'EDICAO'),group,faccao:data.faccao||old?.faccao||'',qg:data.qg||'',antes:snapshot(old),depois:snapshot(data),solicitacoesGeradas:generated,extratoEntrega:buildDeliveryExtract(data),usuario:currentUser.email,data:serverTimestamp()});for(const r of generated)await archiveTechnicalRequest(r,data,'ALTERACAO_DO_GROUP');await syncGroupsToOfficialSheet([data],{quiet:true});closeGroupProfilePage();await loadFaccoes()}catch(err){alert('Erro ao salvar: '+err.message)}
};
let recollectPanelImage='';
function recollectReasonLabel(v){return ({BAIXO_CONTINGENTE:'Baixo contingente',INATIVIDADE:'Inatividade',ABANDONO:'Abandono da facção',QUEBRA_REGRAS:'Quebra de regras / descumprimento',DECISAO_CUPULA:'Decisão da cúpula',SOLICITACAO_LIDERANCA:'Solicitação da liderança',OUTRO:'Outro'})[v]||v||'—'}
function currentPtBrDateTime(){const d=new Date(),parts=new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(d).reduce((a,p)=>(a[p.type]=p.value,a),{});return {date:`${parts.day}/${parts.month}/${parts.year}`,time:`${parts.hour}:${parts.minute}`}}
function recollectExtract(){const f=faccoes.find(x=>x.group===$('#rGroup')?.value)||{},reason=$('#rReason')?.value||'',lines=['RECOLHIMENTO DE FACÇÃO — HIGH ILEGAL','',`Group: ${f.group||'—'}`,`QG / Local: ${f.qg||'—'}`,`Segmento: ${f.segmento||'—'}`,`Facção recolhida: ${f.faccao||'—'}`,`Líder: ${f.lider||'—'}`,`Motivo: ${recollectReasonLabel(reason)}`,`Data: ${$('#rDate')?.value||'—'}`,`Hora: ${$('#rTime')?.value||'—'}`,`Responsável: ${$('#rResponsible')?.value||'—'}`];if(reason==='BAIXO_CONTINGENTE'){lines.push('',`Contingente observado: ${$('#rContingentObserved')?.value||'—'}`,`Meta / mínimo esperado: ${$('#rContingentMin')?.value||'—'}`,`Período de referência: ${$('#rContingentPeriod')?.value||'—'}`,`Métrica / horário: ${$('#rContingentMetric')?.value||'—'}`,`Evidência: ${recollectPanelImage?'Print do painel anexado ao registro':'PRINT DO PAINEL PENDENTE'}`)}const details=$('#rDetails')?.value?.trim();if(details)lines.push('','Justificativa:',details);lines.push('','Status final: GROUP VAGO / FACÇÃO SEM GROUP');return lines.join('\n')}
function updateRecollectUi(){const low=$('#rReason')?.value==='BAIXO_CONTINGENTE';$('#lowContingentBox')?.classList.toggle('hidden',!low);if($('#rExtract'))$('#rExtract').value=recollectExtract()}
function openRecollectModal(){const group=$('#fGroup').value,f=faccoes.find(x=>x.group===group);if(!f||f.status!=='ATIVA')return alert('Este Group não possui uma facção ativa para recolher.');recollectPanelImage='';$('#recollectForm')?.reset();$('#rGroup').value=group;const now=currentPtBrDateTime();$('#rDate').value=now.date;$('#rTime').value=now.time;$('#rResponsible').value=currentProfile?.name||currentUser?.displayName||currentUser?.email||'';$('#rContingentMin').value='15';$('#rPanelPreviewWrap').classList.add('hidden');$('#rPanelPreview').removeAttribute('src');$('#rPanelPrintLabel').textContent='CLIQUE, ARRASTE OU COLE O PRINT AQUI';$('#recollectSummary').innerHTML=`<div><span>FACÇÃO</span><b>${esc(f.faccao||'—')}</b></div><div><span>GROUP</span><b>${esc(f.group||'—')}</b></div><div><span>QG</span><b>${esc(f.qg||'—')}</b></div><div><span>LÍDER</span><b>${esc(f.lider||'—')}</b></div>`;updateRecollectUi();$('#recollectModal').classList.remove('hidden')}
function closeRecollectModal(){$('#recollectModal')?.classList.add('hidden');recollectPanelImage=''}
async function compressRecollectImage(file){if(!file||!file.type.startsWith('image/'))throw new Error('Selecione uma imagem PNG ou JPG.');const raw=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(new Error('Não foi possível ler a imagem.'));r.readAsDataURL(file)});const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('Imagem inválida.'));i.src=raw});const max=1280,scale=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);let q=.72,data=c.toDataURL('image/jpeg',q);while(data.length>650000&&q>.4){q-=.08;data=c.toDataURL('image/jpeg',q)}if(data.length>780000)throw new Error('O print ficou grande demais. Recorte a imagem e tente novamente.');return data}
async function setRecollectPrint(file){try{recollectPanelImage=await compressRecollectImage(file);$('#rPanelPreview').src=recollectPanelImage;$('#rPanelPreviewWrap').classList.remove('hidden');$('#rPanelPrintLabel').textContent='PRINT CARREGADO ✓';updateRecollectUi()}catch(e){recollectPanelImage='';alert(e.message)}}
$('#recolherBtn').onclick=openRecollectModal;
$('#recollectModalClose')?.addEventListener('click',closeRecollectModal);$('#cancelRecollectBtn')?.addEventListener('click',closeRecollectModal);$('#rReason')?.addEventListener('change',updateRecollectUi);['rResponsible','rDate','rTime','rDetails','rContingentObserved','rContingentMin','rContingentPeriod','rContingentMetric'].forEach(id=>$('#'+id)?.addEventListener('input',updateRecollectUi));$('#rPanelPrint')?.addEventListener('change',e=>setRecollectPrint(e.target.files?.[0]));$('#rRemovePrint')?.addEventListener('click',()=>{recollectPanelImage='';$('#rPanelPrint').value='';$('#rPanelPreviewWrap').classList.add('hidden');$('#rPanelPreview').removeAttribute('src');$('#rPanelPrintLabel').textContent='CLIQUE, ARRASTE OU COLE O PRINT AQUI';updateRecollectUi()});$('#copyRecollectExtract')?.addEventListener('click',e=>copyText(recollectExtract(),e.currentTarget));
$('#recollectModal')?.addEventListener('paste',async e=>{const item=[...(e.clipboardData?.items||[])].find(x=>x.type?.startsWith('image/'));if(item){e.preventDefault();await setRecollectPrint(item.getAsFile())}});
$('#recollectForm')?.addEventListener('submit',async e=>{e.preventDefault();const group=$('#rGroup').value,old=faccoes.find(x=>x.group===group);if(!old||old.status!=='ATIVA')return alert('A ocupação deste Group já foi alterada. Atualize a tela e tente novamente.');const reason=$('#rReason').value;if(!reason)return alert('Selecione o motivo do recolhimento.');if(reason==='BAIXO_CONTINGENTE'&&!recollectPanelImage)return alert('Para recolhimento por baixo contingente, o print do painel é obrigatório.');if(reason==='BAIXO_CONTINGENTE'&&!$('#rContingentObserved').value)return alert('Informe o contingente observado.');const recolhimento={motivo:reason,motivoLabel:recollectReasonLabel(reason),responsavel:$('#rResponsible').value.trim(),data:$('#rDate').value.trim(),hora:$('#rTime').value.trim(),justificativa:$('#rDetails').value.trim(),baixoContingente:reason==='BAIXO_CONTINGENTE'?{observado:Number($('#rContingentObserved').value||0),minimo:Number($('#rContingentMin').value||0),periodo:$('#rContingentPeriod').value.trim(),metrica:$('#rContingentMetric').value.trim(),possuiPrint:!!recollectPanelImage}:null,extrato:recollectExtract(),createdAtText:new Date().toISOString(),createdBy:currentUser.email};if(!recolhimento.responsavel||!recolhimento.data||!recolhimento.hora||!recolhimento.justificativa)return alert('Preencha responsável, data, hora e justificativa.');if(!confirm(`Confirmar recolhimento de ${old.faccao||group}?\n\nMotivo: ${recolhimento.motivoLabel}\nO Group ficará vago e o histórico será preservado.`))return;const data={...old,status:'INATIVA',faccao:'',lider:'',staff:'',dataEntrega:'',ocupacaoAtual:null,anuncioDiscordStatus:{postado:false,resetEm:new Date().toISOString(),resetPor:currentUser.email},ultimoRecolhimento:{...recolhimento,possuiEvidencia:!!recollectPanelImage},observacoes:old.observacoes||'',updatedAt:serverTimestamp(),updatedBy:currentUser.email};try{let evidenceId='';if(recollectPanelImage){const ev=await addDoc(collection(db,'highos','data','evidencias_recolhimento'),{tipo:'PRINT_PAINEL',group,faccao:old.faccao||'',motivo:reason,imagemDataUrl:recollectPanelImage,createdAt:serverTimestamp(),createdAtText:new Date().toISOString(),createdBy:currentUser.email});evidenceId=ev.id}recolhimento.evidenciaId=evidenceId;data.ultimoRecolhimento.evidenciaId=evidenceId;await setDoc(doc(db,'highos','data','faccoes',group),data);if(old.faccao){const oid=orgKey(old.faccao);await setDoc(doc(db,'highos','data','organizacoes',oid),{nome:old.faccao,status:'SEM_GROUP',groupAtual:'',segmentoAtual:old.segmento||'',segmentoVinculado:old.segmento||'',qgAtual:'',ultimoRecolhimento:recolhimento,updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true})}const activeDeliveries=entregas.filter(x=>x.group===group&&x.status==='ATIVA');for(const d of activeDeliveries)await setDoc(doc(db,'highos','data','entregas',d.id),{status:'RECOLHIDA',recolhimento,recolhidaEm:serverTimestamp(),recolhidaPor:currentUser.email},{merge:true});await addDoc(histCol,{sessionId:currentSessionId||'',tipo:'RECOLHIMENTO',group,faccao:old.faccao||'',qg:old.qg||'',motivo:reason,motivoLabel:recolhimento.motivoLabel,responsavel:recolhimento.responsavel,dataRecolhimento:recolhimento.data,horaRecolhimento:recolhimento.hora,justificativa:recolhimento.justificativa,baixoContingente:recolhimento.baixoContingente,evidenciaId:evidenceId,extratoRecolhimento:recolhimento.extrato,antes:snapshot(old),depois:snapshot(data),usuario:currentUser.email,data:serverTimestamp()});await syncGroupsToOfficialSheet([data],{quiet:true});closeRecollectModal();closeGroupProfilePage();await loadFaccoes();await loadDeliveries();alert('Facção recolhida com sucesso. O extrato e a evidência foram registrados no histórico.')}catch(err){alert('Erro ao recolher: '+err.message)}});
function snapshot(o){if(!o)return null;const x={...o};delete x.updatedAt;return x}


// ===== HIGH OS V4.2 · CENTRAL DE SOLICITAÇÕES · PADRÕES OFICIAIS HIGH =====
const REQUEST_TYPES=[
  ['GARAGEM','Garagem Pública'],
  ['HELIPONTO','Heliponto'],
  ['GARAGEM_VIP','Garagem VIP / VIP Fac'],
  ['GARAGEM_SERVICO','Garagem de Serviço / VIP Org'],
  ['GARAGEM_BLINDADOS','Garagem de Blindados'],
  ['ROTA_FARM','Rota de Farm Exclusiva'],
  ['BAU','Baú'],
  ['BLIP','Adição / Alteração de Blip'],
  ['REMOVER_BLIP','Remoção de Blip'],
  ['RADIO','Rádio Exclusiva'],
  ['BENEFICIOS','VIP Org / Benefícios e Setagens'],
  ['TELAO','Telão da Organização'],
  ['LOJA_FACCAO','Loja de Facção / Shop Exclusivo'],
  ['TELEPORT','Teleport'],
  ['WEBHOOK','Log / Webhook'],
  ['UNIFORME','Uniforme / Roupas'],
  ['ITENS','Criação / Alteração de Itens'],
  ['ALTERACAO_GROUP','Alteração de Group / Facção'],
  ['GERAL','Solicitação Geral']
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

const BUILTIN_REQUEST_MODELS=REQUEST_TYPES.map(([tipo,nome])=>({
  id:'builtin-'+tipo,
  builtin:true,
  tipo,
  nome:nome,
  assunto:defaultSubject(tipo),
  detalhes:TYPE_PLACEHOLDERS[tipo]||'',
  origem:'Base padrão High OS'
}));

function initRequestUi(){
  const opts=REQUEST_TYPES.map(([v,n])=>`<option value="${v}">${n}</option>`).join('');
  $('#reqTipo').innerHTML=opts; $('#reqTypeFilter').innerHTML='<option value="">TODAS AS CATEGORIAS</option>'+opts;
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
  ['reqGroup','reqAssunto','reqDetalhes','reqModelName'].forEach(id=>$('#'+id).addEventListener('input',()=>{if(id==='reqGroup')syncRequestFaction();updateRequestPreview();syncRouteRequestAction()}));
  $('#reqSearch').addEventListener('input',renderRequests); $('#reqTypeFilter').addEventListener('change',renderRequests);
  $('#copyReqBtn').onclick=copyRequestText; $('#applyRouteRequestBtn')?.addEventListener('click',applyRouteRequestToProfile); $('#reqForm').addEventListener('submit',saveRequestModel);
}
function requestTypeName(v){return REQUEST_TYPES.find(x=>x[0]===v)?.[1]||v||'Solicitação Geral'}
function updateRequestGroupOptions(selected=''){
  $('#reqGroup').innerHTML='<option value="">SEM GROUP / GERAL</option>'+faccoes.map(f=>`<option value="${esc(f.group)}">${esc(f.group)}${f.faccao?' — '+esc(f.faccao):''}</option>`).join('');
  $('#reqGroup').value=selected||''; syncRequestFaction();
}
function syncRequestFaction(){const f=faccoes.find(x=>x.group===$('#reqGroup').value);$('#reqFaccao').value=f?.faccao||''}
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
 const lines=String(detalhes||'').split(/\r?\n/); let on=false,out=[];
 for(const raw of lines){const t=raw.trim();if(!t)continue;
   if(new RegExp('^[-*]?\\s*'+label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*:?$','i').test(t)){on=true;continue}
   if(on && /^[A-Za-zÀ-ÿ][^{}]*:\s*/.test(t))break;
   if(on)out.push(t);
 }
 return out;
}
function fmtCds(v){if(!v)return '{CDS}';return v.startsWith('{')?v:`{${v.replace(/^\{|\}$/g,'')}}`}
function pushObs(lines,detalhes){const obs=getDetailValue('Observações?',detalhes)||getDetailValue('Obs',detalhes);if(obs)lines.push('',`- Observação: ${obs}`)}

function buildRequestText(){
 const group=$('#reqGroup').value.trim();
 const tipo=$('#reqTipo').value;
 const d=$('#reqDetalhes').value.trim();
 const subject=$('#reqAssunto').value.trim()||defaultSubject(tipo);
 const G=group||'{Nome do Group}';
 const fac=faccoes.find(x=>x.group===group); const b=fac?.beneficios||{};
 let L=[];

 if(tipo==='GARAGEM'){
   L=['Assunto:','','- Solicitaçao de Garagem Publica;','','Solicitaçao:','','- Adicione uma garagem publica na CDS abaixo:','',`* Blip: ${fmtCds(getDetailValue('Blip',d))}`,`* Spawn: ${fmtCds(getDetailValue('Spawn',d))}`,'',`- Permissao : ${G}`];
 }
 else if(tipo==='HELIPONTO'){
   const blip=getDetailValue('Blip',d)||getDetailValue('Heliponto',d)||getDetailValue('CDS',d),spawn=getDetailValue('Spawn',d);
   L=['Assunto:','',`- ${subject};`,'','Solicitação:','','- Adicione um Heliponto na CDS abaixo:','',`* Blip: ${fmtCds(blip)}`];
   if(spawn)L.push(`* Spawn: ${fmtCds(spawn)}`); L.push('',`- Permissão: ${G}`); pushObs(L,d);
 }
 else if(tipo==='GARAGEM_VIP'){
   const veic=getDetailValue('Veículos?',d)||'"LLMOTOSTIER2002" e "fooxcustomzlexrfc"';
   L=[`Assunto: ${subject}`,'','Solicitação:','','- Ativação de garagem VIP','','- Garagem VIP:','','- Blip de Garagem VIP Org.',`- Veículos: ${veic}`,'',`- Group: ${G}`,'',`- Blip:`,`  ${fmtCds(getDetailValue('Blip',d))}`,'',`- Spawn:`,`  ${fmtCds(getDetailValue('Spawn',d))}`];pushObs(L,d);
 }
 else if(tipo==='GARAGEM_SERVICO'){
   const tipoGar=getDetailValue('Tipo',d)||'SERVIÇO / VIP ORG',veic=getDetailValue('Veículos?',d)||'{veiculo1}, {veiculo2}',blip=getDetailValue('Blip',d),spawn=getDetailValue('Spawn',d);
   L=['Assunto:','',`- Adição de Garagem de Serviço no Group "${G}";`,'','Solicitação:','',`- Adicione uma garagem de serviço no Group "${G}";`,'',`- Tipo: ${tipoGar};`,`- Veículos de aluguel: ${veic};`,'',`- Blip: ${fmtCds(blip)}`,`- Spawn: ${fmtCds(spawn)}`,'',`- A garagem deverá ficar disponível para todos os membros do Group "${G}".`,'',`- Permissão: "${G}".`];pushObs(L,d);
 }
 else if(tipo==='GARAGEM_BLINDADOS'){
   const vagas=getDetailValue('Quantidade de vagas',d)||'{quantidade}',blip=getDetailValue('Blip',d),spawn=getDetailValue('Spawn da garagem',d)||getDetailValue('Spawn',d),veic=getDetailValue('Spawn do veículo blindado',d)||getDetailValue('Veículos?',d)||'{spawn_do_veiculo}';
   L=['Assunto:','',`- Adição de Garagem de Blindados no Group "${G}";`,'','Solicitação:','',`- Adicione uma garagem de blindados no Group "${G}";`,'',`- Quantidade de vagas: ${vagas};`,`- Blip: ${fmtCds(blip)}`,`- Spawn da garagem: ${fmtCds(spawn)}`,`- Spawn do veículo blindado: ${veic};`,'',`- Obs: Os veículos só serão spawnados após o líder cadastrar no painel o membro permissionado a pegar o mesmo. Se o membro não tiver set, informar para solicitar à liderança o set de blindado, dentro das vagas disponíveis. Se não houver mais blindado disponível, exibir a mensagem: "Esse Group já setou todas as vagas de blindados disponíveis, verifique com o líder da facção."`,'',`- Permissão: "${G}".`];pushObs(L,d);
 }
 else if(tipo==='ROTA_FARM'){
   let pts=getDetailBlock('Blips da rota nova',d); if(!pts.length)pts=d.split(/\r?\n/).map(x=>x.trim()).filter(x=>/^\{.*\},?$/.test(x)); if(!pts.length&&b.rotaBlips)pts=String(b.rotaBlips).split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
   L=[`Assunto: ${subject}`,'','Solicitação:','','- Ativação de rota de farm exclusiva',`- Group: ${G}`,'','- Blips da rota nova:',''];
   L.push(...(pts.length?pts:['{ CDS },','{ CDS },'])); pushObs(L,d);
 }
 else if(tipo==='BAU'){
   L=[`Assunto: ${subject}`,'','Solicitação:','','- Adição de baú.',`- Group: ${G}`,'',`- Local/Coordenadas:`,`  ${fmtCds(getDetailValue('CDS',d)||getDetailValue('Blip',d))}`];
   const cap=getDetailValue('Capacidade',d),perm=getDetailValue('Permissão',d);if(cap)L.push(`- Capacidade: ${cap}`);L.push(`- Permissão: ${perm||G}`);pushObs(L,d);
 }
 else if(tipo==='BLIP'){
   const bt=getDetailValue('Tipo do blip',d)||'blip';
   L=[`Assunto: ${subject}`,'','Solicitação:','',`- Adição de ${bt}.`,`- Group: ${G}`,'',`- Local/Coordenadas:`,`  ${fmtCds(getDetailValue('CDS',d)||getDetailValue('Blip',d))}`];
   const sp=getDetailValue('Spawn',d);if(sp)L.push('',`- Spawn:`,`  ${fmtCds(sp)}`);pushObs(L,d);
 }
 else if(tipo==='REMOVER_BLIP'){
   const bt=getDetailValue('Tipo do blip',d)||'blip';L=[`Assunto: ${subject}`,'','Solicitação:','',`- Remover ${bt}.`,`- Group: ${G}`,'',`- Local/Coordenadas:`,`  ${fmtCds(getDetailValue('CDS',d)||getDetailValue('Blip',d))}`];pushObs(L,d);
 }
 else if(tipo==='RADIO'){
   const radio=getDetailValue('Rádio(?: Exclusiva)?',d)||getDetailValue('Radio(?: exclusiva)?',d)||'{Número da rádio}';
   L=[`Assunto: ${subject}`,'','Solicitação:','',`- Ativação de rádio exclusiva para uma facção.`,`- Group: ${G}`,'',`- Rádio Exclusiva: ${radio}.`];pushObs(L,d);
 }
 else if(tipo==='BENEFICIOS'){
   L=[`Assunto: ${subject}`,'','Solicitação:','','- Ativação de benefícios de uma organização e alguns blips','',`- Group: ${G}`];
   const salario=getDetailValue('Salário',d)||b.salario; const mins=b.salarioMinutos||'40'; if(salario)L.push('',`- Ativar salário de ${salario} (A cada ${mins} minutos)`);
   const radio=getDetailValue('Rádio',d)||b.radio; if(radio)L.push('',`- Ativar Rádio exclusiva: ${radio}`);
   const chatOverride=getDetailValue('Chat Facção',d); if(b.chatFaccao||/^sim|ativar|sim$/i.test(chatOverride))L.push('','- Ativar Chat Facção.');
   const gvB=getDetailValue('Garagem VIP - Blip',d)||b.garagemVipBlip,gvS=getDetailValue('Garagem VIP - Spawn',d)||b.garagemVipSpawn,veic=getDetailValue('Veículos',d)||b.garagemVipVeiculos;
   if(gvB||gvS){L.push('','- Garagem VIP:','','- Blip de Garagem VIP Org.');if(veic)L.push(`- Veículos: ${veic}`);L.push('',`- Blip:`,`  ${fmtCds(gvB)}`,'',`- Spawn:`,`  ${fmtCds(gvS)}`)}
   const singles=[['Loja de roupas',b.lojaRoupas],['Barbearia',b.barbearia],['Tatuagem',b.tatuagem],['Shop Exclusivo',b.shopExclusivo],['Farm',b.farm],['Craft',b.craft],['Baú',b.bau],['Arena',b.arena]];
   for(const [label,saved] of singles){const v=getDetailValue(label,d)||saved;if(v)L.push('',`- ${label}:`,`  ${fmtCds(v)}`)}
   if(b.bauCapacidade)L.push(`- Capacidade do Baú: ${b.bauCapacidade}`);
   if(b.outros){L.push('','- Outros benefícios / setagens:');L.push(...String(b.outros).split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(x=>`- ${x}`))}
   pushObs(L,d);
 }
 else if(tipo==='TELAO'){
   const nome=getDetailValue('Modelo do Telão',d)||getDetailValue('Telão usado',d)||b.telaoNome||'{modelo_do_telao}';
   const postit=getDetailValue('CDS/postit',d)||b.telaoPostit||'{CDS postit}'; const cds=getDetailValue('CDS',d)||b.telaoCds||'{CDS jogador}';
   L=[`Assunto: ${subject}`,'','Solicitação:','','- Ativação de Telão Hall em uma Organização Ilegal.','',`- Group: ${G}`,`- Telão usado: ${nome}`,'','- Local/Coordenadas de onde está o telão (coordenadas pega com postit):',`  ${fmtCds(postit)}`,'','- Local/Coordenadas de onde está o telão (coordenadas pega com cds):',`  ${fmtCds(cds)}`];pushObs(L,d);
 }
 else if(tipo==='LOJA_FACCAO'){
   L=[`Assunto: ${subject}`,'','Solicitação:','',`- Adicionar uma loja na cds abaixo com acesso exclusivo para o group ${G};`,`- ${fmtCds(getDetailValue('CDS',d)||getDetailValue('Blip',d))}`,'',`- Group: ${G}.`];pushObs(L,d);
 }
 else if(tipo==='TELEPORT'){
   L=[`Assunto: ${subject}`,'','Solicitação:','','- Criação de blip de teleport','',`- Entrada: ${fmtCds(getDetailValue('Entrada',d))}`,`- Saída: ${fmtCds(getDetailValue('Saída',d)||getDetailValue('Saida',d))}`,'',`- Group: ${G}.`];pushObs(L,d);
 }
 else if(tipo==='WEBHOOK'){
   L=[`Assunto: ${subject}`,'','Solicitação:','','- Ativação de log através da Webhook.',`- Webhook: ${getDetailValue('Webhook',d)||'{Webhook}'}`,`- Discord para colocar a log: ${getDetailValue('Discord/Canal',d)||getDetailValue('Discord',d)||'{Canal/Discord}'}`,'',`- Permissão que o recurso está: ${getDetailValue('Permissão',d)||G}.`];pushObs(L,d);
 }
 else if(tipo==='UNIFORME'){
   const org=getDetailValue('Organização/Group',d)||group;const nome=getDetailValue('Nome do uniforme',d);const arq=getDetailValue('Arquivo/anexo',d);
   L=[`Assunto: ${subject}`,'','Solicitação:','','- Adição de uniforme.','- Cidade: High','','- Arquivo/anexo:'];
   if(nome||org)L.push(`Uniforme ${org?org+' ':''}${nome||''}`.trim()+'.');if(arq)L.push(arq);const ajuste=getDetailValue('Categoria/ajuste',d);if(ajuste)L.push('',`- Ajuste solicitado: ${ajuste}`);pushObs(L,d);
 }
 else if(tipo==='ITENS'){
   const nome=getDetailValue('Nome do item',d)||'{Nome do item}',spawn=getDetailValue('Spawn',d)||'{spawn_do_item}',png=getDetailValue('Arquivo PNG',d)||`${spawn}.png`,uso=getDetailValue('Interação/uso',d),desc=getDetailValue('Descrição',d);
   L=[`Assunto: ${subject}`,'','Solicitação:','','- Criação / alteração de item.','',`- Nome do item: ${nome}`,`- Spawn: ${spawn}`,`- Arquivo PNG: ${png}`];if(uso)L.push(`- Interação/uso: ${uso}`);if(desc)L.push(`- Descrição: ${desc}`);if(group)L.push('',`- Group/Permissão: ${group}`);pushObs(L,d);
 }
 else if(tipo==='ALTERACAO_GROUP'){
   L=[`Assunto: ${subject}`,'','Solicitação:','',`- ${getDetailValue('Alteração solicitada',d)||'Alteração de Group / permissão.'}`,`- Group atual: ${getDetailValue('Group atual',d)||'{Group atual}'}`,`- Novo Group: ${getDetailValue('Novo Group',d)||group||'{Novo Group}'}`];const cds=getDetailValue('Blip/CDS relacionado',d);if(cds)L.push(`- Blip/CDS relacionado: ${fmtCds(cds)}`);pushObs(L,d);
 }
 else if(tipo==='GERAL'){
   L=[`Assunto: ${subject}`,'','Solicitação:',''];if(d)L.push(d);
 }
 else {
   L=[`Assunto: ${subject}`,'','Solicitação:',''];if(group)L.push(`- Group: ${group}`);if(d)L.push(d);
 }
 return L.join('\n');
}

function openRequestModal(id='',group=''){
 const model=id?[...BUILTIN_REQUEST_MODELS,...solicitacoes].find(x=>x.id===id):null;
 $('#reqId').value=model?.builtin?'':(model?.id||'');
 updateRequestGroupOptions(group||model?.group||'');
 $('#reqTipo').value=model?.tipo||'GERAL';
 $('#reqModelName').value=model?.nome||requestTypeName($('#reqTipo').value);
 $('#reqAssunto').value=model?.assunto||defaultSubject($('#reqTipo').value);
 $('#reqDetalhes').value=model?.detalhes||TYPE_PLACEHOLDERS[$('#reqTipo').value]||'';
 $('#reqOrigem').value=model?.origem||(model?.builtin?'Base padrão High OS':'Biblioteca de modelos');
 $('#reqModalTitle').textContent=model?'GERAR A PARTIR DO MODELO':'NOVO MODELO / SOLICITAÇÃO';
 syncRequestFaction();updateRequestPreview();syncRouteRequestAction();$('#reqModal').classList.remove('hidden');
}
async function loadRequests(){
 try{
   const qs=await getDocs(reqCol),all=qs.docs.map(d=>({id:d.id,...d.data()}));
   solicitacoes=all.filter(x=>x.isModelo===true);
   requestRecords=all.filter(x=>x.isModelo!==true);
   solicitacoes.sort((a,b)=>(a.nome||a.assunto||'').localeCompare(b.nome||b.assunto||'','pt-BR'));
   requestRecords.sort((a,b)=>String(b.createdAtText||'').localeCompare(String(a.createdAtText||'')));
   renderRequests();
 }catch(e){$('#reqList').innerHTML=`<div class="placeholder"><h3>ERRO AO CARREGAR</h3><p>${esc(e.message)}</p></div>`}
}
function allRequestModels(){return [...BUILTIN_REQUEST_MODELS,...solicitacoes]}
function renderRequests(){
 const q=($('#reqSearch').value||'').toLowerCase(),tp=$('#reqTypeFilter').value;
 const models=allRequestModels();
 const list=models.filter(r=>(!tp||r.tipo===tp)&&(!q||[r.nome,r.assunto,r.tipo,requestTypeName(r.tipo),r.group,r.origem,r.detalhes].join(' ').toLowerCase().includes(q)));
 const custom=solicitacoes.length;
 $('#reqStats').innerHTML=`<span><b>${models.length}</b> MODELOS</span><span><b>${BUILTIN_REQUEST_MODELS.length}</b> PADRÃO HIGH</span><span><b>${custom}</b> PERSONALIZADOS</span><span><b>${list.length}</b> EXIBIDOS</span>`;
 if(!list.length){$('#reqList').innerHTML='<div class="placeholder"><b>▤</b><h3>NENHUM MODELO ENCONTRADO</h3><p>Ajuste os filtros ou crie um novo modelo de referência.</p></div>';return}
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
 const box=$('#routeRequestSyncBox'),btn=$('#applyRouteRequestBtn');if(!box||!btn)return;
 const isRoute=$('#reqTipo')?.value==='ROTA_FARM',group=$('#reqGroup')?.value||'',pts=isRoute?requestRoutePoints():[];
 box.classList.toggle('hidden',!isRoute);
 const note=box.querySelector('span');
 if(!group){btn.disabled=true;btn.textContent='SELECIONE UM GROUP';if(note)note.textContent='Selecione o Group para conectar esta solicitação ao Perfil Técnico.';return}
 btn.disabled=!pts.length;btn.textContent=pts.length?`CRIAR SOLICITAÇÃO + SALVAR ${pts.length} CDS`:'ADICIONE AS CDS DO TAKEFARM';
 if(note)note.textContent=pts.length?`${pts.length} CDS detectadas. Esta é a exceção do fluxo: a Solicitação alimentará o Perfil Técnico e marcará a rota como EXCLUSIVA.`:'Cole abaixo as CDS recebidas pelo takefarm. Para os demais recursos, o fluxo continua Perfil → comparação → Solicitação.';
}
async function applyRouteRequestToProfile(){
 const group=$('#reqGroup')?.value||'',tipo=$('#reqTipo')?.value||'';if(tipo!=='ROTA_FARM')return;
 if(!group)return alert('Selecione o Group da rota.');
 const pts=requestRoutePoints();if(!pts.length)return alert('Não encontrei CDS válidas em “Blips da rota nova”.');
 const f=faccoes.find(x=>x.group===group);if(!f)return alert('Group não encontrado na base atual.');
 const oldT=mergedTechProfile(f),nextT=clonePlain(oldT);nextT.rota=nextT.rota||{};nextT.rota.nome=`RotaExclusiva${group}`;nextT.rota.pontos=pts.join('\n');nextT.rota.origem='SOLICITACAO_TAKEFARM';nextT.rota.atualizadoPor=currentUser.email;nextT.rota.atualizadoEm=new Date().toISOString();
 // O início/farm do Group não é substituído pelas 35 CDS: elas são somente os pontos da rota exclusiva.
 syncFarmWithCraft(nextT);
 const benefits={...(f.beneficios||{}),rotaExclusiva:true,rotaBlips:pts.join('\n')};
 try{
  await setDoc(doc(db,'highos','data','faccoes',group),{perfilTecnico:nextT,beneficios,updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true});
  await addDoc(histCol,{sessionId:currentSessionId||'',tipo:'ROTA_EXCLUSIVA_SOLICITADA',group,descricao:`Solicitação de rota exclusiva criada e Perfil Técnico alimentado automaticamente • ${pts.length} CDS do takefarm`,rotaPontos:pts,solicitacaoTexto:buildRequestText(),origem:'SOLICITACAO_TAKEFARM',usuario:currentUser.email,data:serverTimestamp()});
  await loadFaccoes();
  try{await copyRequestText()}catch{}
  if(typeof currentGroupProfile!=='undefined'&&currentGroupProfile?.group===group){const fresh=faccoes.find(x=>x.group===group);if(fresh){renderTechProfile(fresh);$('#fRotaExclusiva').checked=true;renderRouteOverview();}}
  alert(`Solicitação criada para ${group}.\n\n${pts.length} CDS do takefarm foram salvas no Perfil Técnico.\nA rota foi marcada como EXCLUSIVA e o texto foi copiado para o Discord.`);
 }catch(err){alert('Erro ao salvar a rota no perfil: '+err.message)}
}

async function saveRequestModel(e){
 e.preventDefault();
 const id=$('#reqId').value;
 const tipo=$('#reqTipo').value;
 const payload={isModelo:true,tipo,nome:$('#reqModelName').value.trim()||requestTypeName(tipo),assunto:$('#reqAssunto').value.trim()||defaultSubject(tipo),detalhes:$('#reqDetalhes').value.trim(),origem:'Biblioteca High OS',updatedAt:serverTimestamp(),updatedBy:currentUser.email};
 try{
   if(id){await setDoc(doc(db,'highos','data','solicitacoes',id),payload,{merge:true});await addDoc(histCol,{sessionId:currentSessionId||'',tipo:'MODELO_SOLICITACAO_EDITADO',solicitacaoId:id,descricao:payload.nome,usuario:currentUser.email,data:serverTimestamp()});}
   else{const ref=await addDoc(reqCol,{...payload,createdAt:serverTimestamp(),createdBy:currentUser.email});await addDoc(histCol,{sessionId:currentSessionId||'',tipo:'MODELO_SOLICITACAO_CRIADO',solicitacaoId:ref.id,descricao:payload.nome,usuario:currentUser.email,data:serverTimestamp()});}
   $('#reqModal').classList.add('hidden');await loadRequests();
 }catch(err){alert('Erro ao salvar modelo: '+err.message)}
}
function manualRequestMutation(tipo,d,f={}){
 const t=mergedTechProfile(f),o=clonePlain(t.operacional||opBlank()),b={...(f.beneficios||{})};let changed=false,desc='';
 const upGarage=(kind,obj)=>{o.garagens=o.garagens||[];let i=o.garagens.findIndex(x=>x.tipo===kind);const old=i>=0?o.garagens[i]:{};if(!samePlain(old,obj)){if(i>=0)o.garagens[i]=obj;else o.garagens.push(obj);changed=true}};
 if(tipo==='TELAO'){const next={...(o.telao||{}),ativo:true,modelo:getDetailValue('Modelo do Telão',d)||getDetailValue('Telão usado',d)||o.telao?.modelo||'',postit:getDetailValue('CDS/postit',d)||o.telao?.postit||'',cds:getDetailValue('CDS',d)||o.telao?.cds||'',permissao:f.group||''};if(!samePlain(o.telao,next)){o.telao=next;b.telao=true;b.telaoNome=next.modelo;b.telaoPostit=next.postit;b.telaoCds=next.cds;changed=true;desc='Telão'}}
 else if(tipo==='GARAGEM'){const obj={tipo:'PUBLICA',blip:getDetailValue('Blip',d),spawn:getDetailValue('Spawn',d),veiculos:'',vagas:''};upGarage('PUBLICA',obj);b.garagemPublica=true;b.garagemPublicaBlip=obj.blip;b.garagemPublicaSpawn=obj.spawn;desc='Garagem Pública'}
 else if(tipo==='GARAGEM_VIP'){const obj={tipo:'FACCAO',blip:getDetailValue('Blip',d),spawn:getDetailValue('Spawn',d),veiculos:getDetailValue('Veículos?',d),vagas:''};upGarage('FACCAO',obj);b.garagemVipBlip=obj.blip;b.garagemVipSpawn=obj.spawn;b.garagemVipVeiculos=obj.veiculos;desc='Garagem VIP'}
 else if(tipo==='GARAGEM_SERVICO'){const obj={tipo:'SERVICO',blip:getDetailValue('Blip',d),spawn:getDetailValue('Spawn',d),veiculos:getDetailValue('Veículos?',d),vagas:''};upGarage('SERVICO',obj);desc='Garagem de Serviço'}
 else if(tipo==='GARAGEM_BLINDADOS'){const next={vagas:getDetailValue('Quantidade de vagas',d),blip:getDetailValue('Blip',d),spawn:getDetailValue('Spawn da garagem',d)||getDetailValue('Spawn',d),veiculos:getDetailValue('Spawn do veículo blindado',d)||getDetailValue('Veículos?',d)};if(!samePlain(o.blindados,next)){o.blindados=next;changed=true;desc='Garagem de Blindados'}}
 else if(tipo==='HELIPONTO'){const next=[{blip:getDetailValue('Blip',d)||getDetailValue('CDS',d),spawn:getDetailValue('Spawn',d)}];if(!samePlain(o.helipontos,next)){o.helipontos=next;b.heliponto=true;b.helipontoBlip=next[0].blip;b.helipontoSpawn=next[0].spawn;changed=true;desc='Heliponto'}}
 else if(tipo==='LOJA_FACCAO'){const next={cds:getDetailValue('CDS',d)||getDetailValue('Blip',d)};if(!samePlain(o.lojaFac,next)){o.lojaFac=next;b.shopExclusivo=next.cds;changed=true;desc='Loja da Facção'}}
 t.operacional=o;return {changed,perfilTecnico:t,beneficios:b,descricao:desc};
}
async function copyRequestText(){
 const text=$('#reqPreview').value,group=$('#reqGroup')?.value||'',tipo=$('#reqTipo')?.value||'GERAL',d=$('#reqDetalhes')?.value||'',f=faccoes.find(x=>x.group===group);
 try{
  if(group&&f){const mut=manualRequestMutation(tipo,d,f);if(mut.changed){const yes=confirm(`Essa solicitação vai gerar modificações no Group ${group}.\n\nAlteração detectada: ${mut.descricao||requestTypeName(tipo)}.\n\nDeseja que as mesmas sejam cadastradas no Group?`);if(yes){await setDoc(doc(db,'highos','data','faccoes',group),{perfilTecnico:mut.perfilTecnico,beneficios:mut.beneficios,updatedAt:serverTimestamp(),updatedBy:currentUser?.email||''},{merge:true});const ix=faccoes.findIndex(x=>x.group===group);if(ix>=0){faccoes[ix].perfilTecnico=clonePlain(mut.perfilTecnico);faccoes[ix].beneficios=clonePlain(mut.beneficios)}await addDoc(histCol,{sessionId:currentSessionId||'',tipo:'SOLICITACAO_APLICADA_AO_GROUP',group,descricao:`${mut.descricao||requestTypeName(tipo)} cadastrada no Group a partir de solicitação`,solicitacaoTexto:text,usuario:currentUser?.email||'',data:serverTimestamp()});}}
   await archiveTechnicalRequest({tipo,titulo:$('#reqAssunto')?.value||requestTypeName(tipo),texto:text},f,'CENTRAL_DE_SOLICITACOES');
  }
  await navigator.clipboard.writeText(text);const b=$('#copyReqBtn'),old=b.textContent;b.textContent='COPIADO + ARQUIVADO ✓';setTimeout(()=>b.textContent=old,1600)
 }catch(e){try{$('#reqPreview').select();document.execCommand('copy')}catch{}alert('O texto foi preparado, mas ocorreu um erro ao registrar/sincronizar: '+(e?.message||e))}
}
function slug(v){return (v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-')}

initRequestUi();
const _loadFaccoesV3=loadFaccoes;
loadFaccoes=async function(){await _loadFaccoesV3();updateRequestGroupOptions($('#reqGroup')?.value||'');await loadRequests()};


// ===== HIGH OS V4 · GESTÃO DE USUÁRIOS =====
function renderUserPermissionMatrix(values={}){
 const box=$('#userPermissionMatrix');if(!box)return;const role=$('#uRole')?.value||'CONSULTA';const base=defaultPermissionsForRole(role);
 box.innerHTML=SYSTEM_MODULES.map(m=>{const val=normalizePermission(Object.prototype.hasOwnProperty.call(values||{},m.id)?values[m.id]:base[m.id]);return `<div class="permission-row"><div><b>${esc(m.label)}</b><small>${esc(m.desc)}</small></div><select class="module-permission-select" data-module="${esc(m.id)}"><option value="NONE" ${val==='NONE'?'selected':''}>SEM ACESSO</option><option value="VIEW" ${val==='VIEW'?'selected':''}>VISUALIZAR</option><option value="EDIT" ${val==='EDIT'?'selected':''}>EDITAR</option></select></div>`}).join('');
}
function readUserPermissions(){const out={};document.querySelectorAll('#userPermissionMatrix .module-permission-select').forEach(el=>out[el.dataset.module]=normalizePermission(el.value));return out}
function applyPermissionPreset(type){const role=$('#uRole')?.value||'CONSULTA';const values={};if(type==='NONE')SYSTEM_MODULES.forEach(m=>values[m.id]='NONE');else if(type==='VIEW')SYSTEM_MODULES.forEach(m=>values[m.id]='VIEW');else if(type==='OPERATIONAL')SYSTEM_MODULES.forEach(m=>values[m.id]=m.id==='historico'?'VIEW':'EDIT');else Object.assign(values,defaultPermissionsForRole(role));renderUserPermissionMatrix(values)}
function initUsersUi(){
 const nb=$('#newUserBtn'); if(!nb)return;
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
function assertAdmin(){if(String(currentProfile?.role||'').toUpperCase()!=='ADMIN'){alert('Apenas ADMIN pode gerenciar usuários.');return false}return true}
async function loadUsers(){
 if(!assertAdmin())return;
 try{
  const qs=await getDocs(usersCol);
  usuarios=qs.docs.map(d=>({email:d.id,...d.data()})).sort((a,b)=>(a.name||a.email).localeCompare(b.name||b.email,'pt-BR'));
  renderUsers();
 }catch(e){$('#userList').innerHTML=`<div class="placeholder"><h3>ERRO AO CARREGAR</h3><p>${esc(e.message)}</p></div>`}
}
function renderUsers(){
 if(!$('#userList'))return;
 const q=($('#userSearch').value||'').toLowerCase(), role=$('#userRoleFilter').value, st=$('#userStatusFilter').value;
 const list=usuarios.filter(u=>(!role||String(u.role||'CONSULTA').toUpperCase()===role)&&(!st||(st==='ATIVO'?u.active===true:u.active!==true))&&(!q||[u.name,u.cargo,u.email,u.role,u.notes].join(' ').toLowerCase().includes(q)));
 const ativos=usuarios.filter(u=>u.active===true).length, admins=usuarios.filter(u=>String(u.role||'').toUpperCase()==='ADMIN'&&u.active===true).length;
 $('#userStats').innerHTML=`<span><b>${usuarios.length}</b> CADASTRADOS</span><span><b>${ativos}</b> ATIVOS</span><span><b>${usuarios.length-ativos}</b> INATIVOS</span><span><b>${admins}</b> ADMINS</span><span><b>${list.length}</b> EXIBIDOS</span>`;
 if(!usuarios.length){$('#userList').innerHTML='<div class="placeholder"><b>♟</b><h3>NENHUM USUÁRIO</h3><p>Cadastre a primeira conta autorizada.</p></div>';return}
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
 const payload={email,name:$('#uName').value.trim(),cargo:$('#uCargo').value.trim(),role:$('#uRole').value,active:$('#uActive').value==='true',notes:$('#uNotes').value.trim(),permissions:readUserPermissions(),updatedAt:serverTimestamp(),updatedBy:currentUser.email};
 if(email===String(currentUser.email||'').toLowerCase() && payload.active!==true){alert('Você não pode desativar sua própria conta enquanto está logado.');return}
 try{
  await setDoc(doc(db,'users',email),payload,{merge:true});
  await addDoc(histCol,{sessionId:currentSessionId||'',tipo:old?'USUARIO_EDITADO':'USUARIO_CRIADO',usuarioAlvo:email,antes:snapshot(old),depois:snapshot(payload),usuario:currentUser.email,data:serverTimestamp()});
  $('#userModal').classList.add('hidden'); if(email===String(currentUser?.email||'').toLowerCase()){currentProfile={...currentProfile,...payload};if($('#userName'))$('#userName').textContent=payload.name||currentUser?.displayName||email;if($('#userRole'))$('#userRole').textContent=payload.cargo||payload.role;if($('#userAccessLevel'))$('#userAccessLevel').textContent='ACESSO: '+String(payload.role||'CONSULTA').toUpperCase();renderSessionClock(email);applyModuleAccess(payload.role);} await loadUsers();
 }catch(err){alert('Erro ao salvar usuário: '+err.message)}
}
async function toggleUserAccess(){
 if(!assertAdmin())return;
 const email=$('#userOriginalEmail').value.trim().toLowerCase(), old=usuarios.find(x=>x.email===email); if(!old)return;
 if(email===String(currentUser.email||'').toLowerCase() && old.active===true){alert('Você não pode desativar sua própria conta enquanto está logado.');return}
 const next=old.active!==true;
 if(!confirm(`${next?'Reativar':'Desativar'} o acesso de ${old.name||email}?`))return;
 try{
  await setDoc(doc(db,'users',email),{...old,active:next,updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true});
  await addDoc(histCol,{sessionId:currentSessionId||'',tipo:next?'USUARIO_REATIVADO':'USUARIO_DESATIVADO',usuarioAlvo:email,usuario:currentUser.email,data:serverTimestamp()});
  $('#userModal').classList.add('hidden'); await loadUsers();
 }catch(err){alert('Erro ao alterar acesso: '+err.message)}
}
initUsersUi();

// ===== HIGH OS V8.15 · SESSÕES E AUDITORIA DE USUÁRIOS =====
let userSessions=[];
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
async function loadUserAudit(){
 if(!isAdmin()||!$('#adminSessionList'))return;
 try{if(!historico.length){const hq=await getDocs(histCol);historico=hq.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(historyDateValue(b)?.getTime()||0)-(historyDateValue(a)?.getTime()||0));}
 const qs=await getDocs(sessionCol);userSessions=qs.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>sessionStartMs(b)-sessionStartMs(a));renderUserAudit();}catch(e){$('#adminSessionList').innerHTML=`<div class="placeholder"><h3>ERRO AO CARREGAR AUDITORIA</h3><p>${esc(e.message)}</p></div>`}
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
$('#adminAuditRefresh')?.addEventListener('click',loadUserAudit);
function openUserActivity(email){activateAppPage('administracao');loadUserAudit().then(()=>{const s=$('#adminAuditUser');if(s){s.value=String(email||'').toLowerCase();renderUserAudit();}})}

// ===== HIGH OS V5 · GROUP COMO PATRIMÔNIO + ENTREGA COMO VÍNCULO =====
let entregas=[];
const INSTALLATIONS=[
 ['vipOrg','VIP Org'],['chatFaccao','Chat da Facção'],['radio','Rádio Exclusiva'],['salario','Salário'],
 ['garagemVip','Garagem VIP'],['garagemPublica','Garagem Pública'],['heliponto','Heliponto'],['rotaExclusiva','Rota Exclusiva'],
 ['telao','Telão'],['lojaRoupas','Loja de Roupas'],['barbearia','Barbearia'],['tatuagem','Tatuagem'],['shopExclusivo','Shop Exclusivo'],
 ['bau','Baú'],['farm','Farm'],['craft','Craft'],['arena','Arena']
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
 renderFacSegmentChips(faccoes);renderFacActivityButtons();
 const q=($('#facSearch')?.value||'').toLowerCase(),seg=$('#facSegment')?.value||'',st=$('#facStatus')?.value||'',operacionais=faccoes.filter(f=>!f.removido);
 const filtered=operacionais.filter(f=>(!seg||segmentKey(f.segmento)===segmentKey(seg))&&(!st||f.status===st)&&(!q||[f.group,f.faccao,f.qg,f.lider,f.staff,f.produto].join(' ').toLowerCase().includes(q)));
 const ocup=operacionais.filter(f=>f.status==='ATIVA').length,vagos=operacionais.length-ocup,inst=operacionais.reduce((n,f)=>n+installedCount(f),0);
 const segCounts={};operacionais.forEach(f=>{const k=f.segmento||'OUTROS';segCounts[k]=(segCounts[k]||0)+1});
 const maxSeg=Math.max(1,...Object.values(segCounts));
 if($('#facOverview'))$('#facOverview').innerHTML=`<div class="ops-kpis"><article class="ops-kpi purple"><span>GROUPS / QGs</span><b>${operacionais.length}</b><small>patrimônio técnico cadastrado</small></article><article class="ops-kpi good"><span>OCUPADOS</span><b>${ocup}</b><small>${operacionais.length?Math.round(ocup/operacionais.length*100):0}% da base em uso</small></article><article class="ops-kpi warn"><span>VAGOS</span><b>${vagos}</b><small>disponíveis para nova entrega</small></article><article class="ops-kpi"><span>INSTALAÇÕES</span><b>${inst}</b><small>recursos/setagens registrados</small></article></div><section class="ops-distribution"><div class="ops-distribution-head"><b>DISTRIBUIÇÃO POR SEGMENTO</b><span>BASE COMPLETA</span></div><div class="ops-bars">${Object.entries(segCounts).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="ops-bar-row"><span>${esc(k)}</span><div class="ops-track"><div class="ops-fill" style="width:${Math.max(4,v/maxSeg*100)}%"></div></div><b>${v}</b></div>`).join('')}</div></section>`;
 $('#facStats').innerHTML=`<span><b>${filtered.length}</b> EXIBIDOS</span>${seg?`<span>SEGMENTO <b>${esc(seg)}</b></span>`:''}${st?`<span>STATUS <b>${st==='ATIVA'?'OCUPADOS':'VAGOS'}</b></span>`:''}`;
 if(!operacionais.length){$('#facList').innerHTML='<div class="placeholder"><b>◆</b><h3>BASE AINDA NÃO IMPORTADA</h3><p>ADMIN: clique em “IMPORTAR BASE INICIAL”.</p></div>';return}
 if(!filtered.length){$('#facList').innerHTML='<div class="placeholder"><b>⌕</b><h3>NENHUM GROUP ENCONTRADO</h3><p>Ajuste a busca ou os filtros.</p></div>';return}
 $('#facList').innerHTML=filtered.map(f=>`<article class="fac-card" data-id="${f.id}"><div class="fac-card-head"><div><div class="group-kicker">${esc(f.segmento||'OUTROS')}</div><h3>${esc(f.group)}</h3></div><span class="status-chip ${f.status==='ATIVA'?'ativa':'inativa'}">${f.status==='ATIVA'?'OCUPADO':'VAGO'}</span></div><div class="fac-name">${esc(f.qg||'SEM LOCAL')}</div><div class="muted">Ocupante: <b>${esc(f.faccao||'— NENHUMA —')}</b>${f.lider?'<br>Líder: '+esc(f.lider):''}</div><div class="product">${esc(f.produto||'')}</div><div class="install-count">${installedCount(f)} instalações/setagens cadastradas no Group</div><div class="group-profile"><button class="mini-btn edit-group" data-id="${f.id}">PERFIL TÉCNICO</button><button class="btn-primary compact deliver-group" data-group="${esc(f.group)}">${f.status==='ATIVA'?'NOVA ENTREGA':'ENTREGAR GROUP'}</button></div></article>`).join('');
 document.querySelectorAll('.edit-group').forEach(b=>b.onclick=e=>{e.stopPropagation();openFac(b.dataset.id)});
 document.querySelectorAll('.deliver-group').forEach(b=>b.onclick=e=>{e.stopPropagation();openNewDelivery(b.dataset.group)});
};

function initDeliveryUi(){
 $('#newDeliveryBtn')?.addEventListener('click',()=>openNewDelivery()); $('#newDeliveryClose')?.addEventListener('click',()=>$('#newDeliveryModal').classList.add('hidden'));
 $('#newDeliveryModal')?.addEventListener('click',e=>{if(e.target.id==='newDeliveryModal')$('#newDeliveryModal').classList.add('hidden')});
 $('#dGroup')?.addEventListener('change',()=>fillDeliveryFromGroup($('#dGroup').value));
 ['dFaccao','dLider','dStaff','dData','dPlano','dNotes'].forEach(id=>$('#'+id)?.addEventListener('input',updateNewDeliveryPreview));
 $('#deliverySearch')?.addEventListener('input',renderDeliveries); $('#deliveryStatus')?.addEventListener('change',renderDeliveries);
 $('#copyDExtract')?.addEventListener('click',()=>copyText($('#dExtract').value,$('#copyDExtract'))); $('#copyDRequests')?.addEventListener('click',()=>copyText(currentDeliveryRequests().map((r,i)=>`===== ${i+1}. ${r.titulo.toUpperCase()} =====\n\n${r.texto}`).join('\n\n'),$('#copyDRequests')));
 $('#newDeliveryForm')?.addEventListener('submit',saveNewDelivery);
}

// HIGH OS V5.3 · FACÇÕES COMO ENTIDADE PRÓPRIA
function orgKey(name){return String(name||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'facção'}
function derivedOrganizations(){
 const map=new Map();
 organizacoes.forEach(o=>map.set(String(o.nome||o.id||'').toLowerCase(),{...o,source:'cadastro'}));
 faccoes.filter(f=>f.faccao).forEach(f=>{const k=String(f.faccao).toLowerCase(),old=map.get(k)||{};map.set(k,{...old,id:old.id||orgKey(f.faccao),nome:old.nome||f.faccao,lider:old.lider||f.lider||'',status:old.status||'ATIVA',groupAtual:f.group,segmentoAtual:f.segmento,segmentoVinculado:old.segmentoVinculado||f.segmento,qgAtual:f.qg,contato:old.contato||'',discord:old.discord||'',desde:old.desde||f.dataEntrega||'',observacoes:old.observacoes||'',source:old.source||'group'});});
 return [...map.values()].map(o=>({...o,status:o.groupAtual?'ATIVA':'INATIVA'})).sort((a,b)=>(a.nome||'').localeCompare(b.nome||''));
}
async function loadOrganizations(){
 try{const qs=await getDocs(orgCol);organizacoes=qs.docs.map(d=>({id:d.id,...d.data()}));renderOrganizations();syncOrgOptions()}catch(e){if($('#orgList'))$('#orgList').innerHTML=`<div class="placeholder"><h3>ERRO AO CARREGAR</h3><p>${esc(e.message)}</p></div>`}
}
function syncOrgOptions(){const dl=$('#orgOptions');if(!dl)return;dl.innerHTML=derivedOrganizations().filter(o=>o.status!=='INATIVA').map(o=>`<option value="${esc(o.nome)}">${esc(o.groupAtual||'SEM GROUP')}</option>`).join('')}
function orgSegmentValue(o={}){return o.segmentoVinculado||o.segmentoAtual||''}
function orgSegmentsAvailable(all=[]){
 const preferred=['ARMAS','MUNIÇÃO','LAVAGEM','DROGAS','DESMANCHE','ESTELIONATÁRIOS','OUTROS'];
 const found=[...new Set((all||[]).map(o=>String(orgSegmentValue(o)||'').trim()).filter(Boolean))];
 return [...preferred.filter(x=>found.includes(x)),...found.filter(x=>!preferred.includes(x)).sort((a,b)=>a.localeCompare(b))];
}
function renderOrgSegmentChips(all=[]){
 const sel=$('#orgSegment'),box=$('#orgSegmentChips');if(!sel||!box)return;
 const current=sel.value||'',segments=orgSegmentsAvailable(all);
 sel.innerHTML=`<option value="">TODOS OS SEGMENTOS</option>${segments.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}`;
 if(current&&segments.includes(current))sel.value=current;else sel.value='';
 const active=sel.value||'';
 const counts={};(all||[]).forEach(o=>{const k=String(orgSegmentValue(o)||'').trim();if(k)counts[k]=(counts[k]||0)+1});
 box.innerHTML=`<button type="button" class="org-segment-chip ${!active?'active':''}" data-segment=""><span>TODOS</span><b>${all.length}</b></button>${segments.map(x=>`<button type="button" class="org-segment-chip ${active===x?'active':''}" data-segment="${esc(x)}"><span>${esc(x)}</span><b>${counts[x]||0}</b></button>`).join('')}`;
 box.querySelectorAll('.org-segment-chip').forEach(btn=>btn.onclick=()=>{sel.value=btn.dataset.segment||'';renderOrganizations()});
}
function renderOrganizations(){
 if(!$('#orgList'))return;const all=derivedOrganizations();renderOrgSegmentChips(all);renderOrgActivityButtons();const q=($('#orgSearch')?.value||'').toLowerCase(),st=$('#orgStatus')?.value||'',seg=$('#orgSegment')?.value||'';
 const list=all.filter(o=>(!seg||segmentKey(orgSegmentValue(o))===segmentKey(seg))&&(!st||(st==='ACTIVE'?o.status!=='INATIVA':o.status===st))&&(!q||[o.nome,o.lider,o.groupAtual,o.qgAtual,orgSegmentValue(o),o.contato,o.discord].join(' ').toLowerCase().includes(q)));
 const active=all.filter(o=>o.groupAtual&&o.status!=='INATIVA').length,sem=all.filter(o=>!o.groupAtual&&o.status!=='INATIVA').length,inativas=all.filter(o=>o.status==='INATIVA').length;
 const segCounts={};all.filter(o=>o.groupAtual).forEach(o=>{const k=orgSegmentValue(o)||'OUTROS';segCounts[k]=(segCounts[k]||0)+1});const maxSeg=Math.max(1,...Object.values(segCounts));
 if($('#orgOverview'))$('#orgOverview').innerHTML=`<div class="ops-kpis"><article class="ops-kpi purple"><span>FACÇÕES</span><b>${all.length}</b><small>organizações registradas</small></article><article class="ops-kpi good"><span>COM GROUP</span><b>${active}</b><small>ocupando patrimônio da cidade</small></article><article class="ops-kpi warn"><span>SEM GROUP</span><b>${sem}</b><small>ativas aguardando ocupação</small></article><article class="ops-kpi"><span>INATIVAS</span><b>${inativas}</b><small>mantidas apenas no histórico</small></article></div><section class="ops-distribution"><div class="ops-distribution-head"><b>OCUPAÇÃO POR SEGMENTO</b><span>FACÇÕES COM GROUP</span></div><div class="ops-bars">${Object.keys(segCounts).length?Object.entries(segCounts).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="ops-bar-row"><span>${esc(k)}</span><div class="ops-track"><div class="ops-fill" style="width:${Math.max(4,v/maxSeg*100)}%"></div></div><b>${v}</b></div>`).join(''):'<div class="muted">Nenhuma ocupação ativa.</div>'}</div></section>`;
 $('#orgStats').innerHTML=`<span><b>${list.length}</b> EXIBIDAS</span>${seg?`<span>SEGMENTO <b>${esc(seg)}</b></span>`:''}${st?`<span>STATUS <b>${esc(st.replace('_',' '))}</b></span>`:''}`;
 $('#orgList').innerHTML=list.length?list.map(o=>`<article class="org-card" data-org="${esc(o.id||orgKey(o.nome))}"><div class="org-card-head"><div><div class="group-kicker">${esc(orgSegmentValue(o)||'ORGANIZAÇÃO')}</div><h3>${esc(o.nome||'SEM NOME')}</h3></div><span class="status-chip ${o.status==='INATIVA'?'inativa':'ativa'}">${o.status==='INATIVA'?'INATIVA':(o.groupAtual?'OCUPANDO':'ATIVA • SEM GROUP')}</span></div><div class="org-group-link"><span>GROUP ATUAL</span><b>${esc(o.groupAtual||'—')}</b><small>${esc(o.qgAtual||'')}</small></div><div class="muted">${o.lider?'Líder: '+esc(o.lider):'Liderança não cadastrada'}${o.contato?'<br>Contato: '+esc(o.contato):''}</div><button class="mini-btn open-org" data-name="${esc(o.nome)}">PERFIL DA FACÇÃO</button></article>`).join(''):'<div class="placeholder"><b>♜</b><h3>NENHUMA FACÇÃO ENCONTRADA</h3><p>Ajuste a busca ou os filtros.</p></div>';
 document.querySelectorAll('.open-org').forEach(b=>b.onclick=e=>{e.stopPropagation();openOrganizationByName(b.dataset.name)});
}

async function orgHistory(name){
 try{const qs=await getDocs(histCol),key=String(name||'').toLowerCase();return qs.docs.map(d=>({id:d.id,...d.data()})).filter(h=>String(h.faccao||h.depois?.faccao||h.antes?.faccao||'').toLowerCase()===key).sort((a,b)=>historyMillis(b)-historyMillis(a)).slice(0,8)}catch{return[]}
}
async function openOrganizationByName(name=''){
 const o=derivedOrganizations().find(x=>String(x.nome).toLowerCase()===String(name).toLowerCase())||{id:'',nome:name,status:'SEM_GROUP'};
 $('#orgId').value=o.id||'';$('#oNome').value=o.nome||'';syncSegmentSelects();if($('#oSegment'))$('#oSegment').value=segmentNames().find(x=>segmentKey(x)===segmentKey(orgSegmentValue(o)))||'OUTROS';$('#oStatus').value=o.status|| (o.groupAtual?'ATIVA':'SEM_GROUP');$('#oLider').value=o.lider||'';$('#oContato').value=o.contato||'';$('#oDiscord').value=o.discord||'';$('#oDesde').value=o.desde||'';$('#oObs').value=o.observacoes||'';$('#orgModalTitle').textContent=o.nome||'NOVA FACÇÃO';
 const current=faccoes.find(f=>String(f.faccao||'').toLowerCase()===String(o.nome||'').toLowerCase());
 $('#orgProfileSummary').innerHTML=`<div><span>STATUS</span><b>${esc(current?'COM GROUP':(o.status||'SEM GROUP'))}</b></div><div><span>GROUP ATUAL</span><b>${esc(current?.group||'—')}</b></div><div><span>SEGMENTO</span><b>${esc(current?.segmento||orgSegmentValue(o)||'—')}</b></div><div><span>QG</span><b>${esc(current?.qg||'—')}</b></div>`;
 $('#orgCurrentGroup').innerHTML=current?`<div class="eyebrow">OCUPAÇÃO ATUAL</div><strong>${esc(current.group)} • ${esc(current.qg||'')}</strong><span>${esc(current.produto||'')}</span>`:'<div class="delivery-no-change">Esta facção não ocupa nenhum Group atualmente.</div>';
 $('#orgHistoryPreview').innerHTML='<div class="delivery-no-change">Carregando histórico...</div>';showOrganizationProfilePage(o,current);
 const hist=await orgHistory(o.nome);$('#orgHistoryPreview').innerHTML=hist.length?hist.map(h=>`<div class="group-history-item"><i></i><div><b>${esc(historyTitle(h))}</b><span>${esc(h.group||'')} • ${esc(formatHistoryDate(h))}</span></div></div>`).join(''):'<div class="delivery-no-change">Ainda não há eventos registrados para esta organização.</div>';
}
$('#newOrgBtn')?.addEventListener('click',()=>openOrganizationByName(''));
$('#orgModalClose')?.addEventListener('click',closeOrganizationProfilePage);
['orgSearch','orgSegment','orgStatus'].forEach(id=>$('#'+id)?.addEventListener(id==='orgSearch'?'input':'change',renderOrganizations));
$('#orgForm')?.addEventListener('submit',async e=>{e.preventDefault();const nome=$('#oNome').value.trim();if(!nome)return;const id=$('#orgId').value||orgKey(nome),current=faccoes.find(f=>String(f.faccao||'').toLowerCase()===nome.toLowerCase());const data={nome,status:current?'ATIVA':'INATIVA',lider:$('#oLider').value.trim(),contato:$('#oContato').value.trim(),discord:$('#oDiscord').value.trim(),desde:$('#oDesde').value.trim(),observacoes:$('#oObs').value.trim(),groupAtual:current?.group||'',segmentoAtual:current?.segmento||$('#oSegment')?.value||'',segmentoVinculado:$('#oSegment')?.value||current?.segmento||'',qgAtual:current?.qg||'',updatedAt:serverTimestamp(),updatedBy:currentUser.email};try{await setDoc(doc(db,'highos','data','organizacoes',id),data);await addDoc(histCol,{sessionId:currentSessionId||'',tipo:'ORGANIZACAO',faccao:nome,group:current?.group||'',descricao:`Cadastro da facção ${nome} atualizado`,usuario:currentUser.email,data:serverTimestamp()});closeOrganizationProfilePage();await loadOrganizations()}catch(err){alert('Erro ao salvar facção: '+err.message)}});
async function upsertOrganizationFromDelivery(payload,f){
 const id=orgKey(payload.faccao),existing=derivedOrganizations().find(o=>String(o.nome).toLowerCase()===payload.faccao.toLowerCase())||{};
 await setDoc(doc(db,'highos','data','organizacoes',id),{nome:payload.faccao,status:'ATIVA',lider:payload.lider||existing.lider||'',contato:existing.contato||'',discord:existing.discord||'',desde:existing.desde||payload.dataEntrega||'',observacoes:existing.observacoes||'',groupAtual:f.group,segmentoAtual:f.segmento||'',segmentoVinculado:f.segmento||existing.segmentoVinculado||'',qgAtual:f.qg||'',updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true});
}
async function loadDeliveries(){
 try{const qs=await getDocs(deliveryCol);entregas=qs.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(b.createdAtText||b.dataEntrega||'').localeCompare(String(a.createdAtText||a.dataEntrega||'')));renderDeliveries()}catch(e){if($('#deliveryList'))$('#deliveryList').innerHTML=`<div class="placeholder"><h3>ERRO AO CARREGAR</h3><p>${esc(e.message)}</p></div>`}
}
function renderDeliveries(){
 if(!$('#deliveryList'))return;const q=($('#deliverySearch').value||'').toLowerCase(),st=$('#deliveryStatus').value;
 const list=entregas.filter(d=>(!st||d.status===st)&&(!q||[d.group,d.faccao,d.lider,d.staff,d.dataEntrega].join(' ').toLowerCase().includes(q)));
 const at=entregas.filter(d=>d.status==='ATIVA').length;$('#deliveryStats').innerHTML=`<span><b>${entregas.length}</b> REGISTROS</span><span><b>${at}</b> ATIVOS</span><span><b>${list.length}</b> EXIBIDOS</span>`;
 $('#deliveryList').innerHTML=list.length?list.map(d=>`<article class="delivery-row"><div><div class="group-kicker">GROUP</div><strong>${esc(d.group)}</strong></div><div><span>${esc(d.faccao||'—')}</span><small>${esc(d.qg||'')} ${d.plano?'• '+esc(d.plano):''}</small></div><div><strong>${esc(d.dataEntrega||'—')}</strong><small>${esc(d.staff||'')}</small></div><span class="status-chip ${d.status==='ATIVA'?'ativa':'inativa'}">${esc(d.status||'ATIVA')}</span></article>`).join(''):'<div class="placeholder"><b>◇</b><h3>NENHUMA ENTREGA REGISTRADA</h3><p>Use “Nova Entrega” ou entregue diretamente pelo card de um Group.</p></div>';
}
function openNewDelivery(group=''){
 const sel=$('#dGroup');sel.innerHTML='<option value="">SELECIONE O GROUP</option>'+faccoes.filter(f=>!f.removido).map(f=>`<option value="${esc(f.group)}">${esc(f.group)} — ${esc(f.qg||'SEM LOCAL')} ${f.status==='ATIVA'?'['+esc(f.faccao||'OCUPADO')+']':'[VAGO]'}</option>`).join('');
 $('#newDeliveryForm').reset();if(group){sel.value=group;fillDeliveryFromGroup(group)}else{$('#dInstalled').innerHTML='<div class="delivery-no-change">Selecione um Group.</div>';$('#dActive').innerHTML='';updateNewDeliveryPreview()};$('#newDeliveryModal').classList.remove('hidden');
}
function fillDeliveryFromGroup(group){
 const f=faccoes.find(x=>x.group===group);if(!f)return;const b=f.beneficios||{};
 $('#dInstalled').innerHTML=INSTALLATIONS.map(([k,n])=>{const v=installedValue(b,k);return `<div class="install-item"><b>${esc(n)}</b><small>${v?esc(v):'Não cadastrado'}</small></div>`}).join('');
 const p=f.perfilEntrega||{}, defaults=new Set(p.beneficiosPadrao||[]), available=INSTALLATIONS.filter(([k])=>isInstalled(b,k));
 $('#dActive').innerHTML=available.map(([k,n])=>`<label class="install-item install-toggle"><input type="checkbox" data-delivery-benefit="${k}" ${defaults.size?(defaults.has(k)?'checked':''):'checked'}><span><b>${esc(n)}</b><small>${esc(installedValue(b,k))}</small></span></label>`).join('')||'<div class="delivery-no-change">Este Group ainda não possui instalações cadastradas. Cadastre no Perfil Técnico.</div>';
 document.querySelectorAll('[data-delivery-benefit]').forEach(x=>x.addEventListener('change',updateNewDeliveryPreview));
 $('#dPlano').value=p.planoPadrao||'';if(p.observacao&&!$('#dNotes').value)$('#dNotes').value=p.observacao;
 $('#dStaff').value=currentProfile?.name||currentUser?.displayName||'';updateNewDeliveryPreview();
}
function selectedDeliveryBenefits(){return [...document.querySelectorAll('[data-delivery-benefit]:checked')].map(x=>x.dataset.deliveryBenefit)}
function deliveryExtractV5(){
 const f=faccoes.find(x=>x.group===$('#dGroup').value), active=selectedDeliveryBenefits();if(!f)return '';
 const b=f.beneficios||{}, lines=['ENTREGA DE ORGANIZAÇÃO — HIGH ILEGAL','',`Group: ${f.group}`,`QG / Local: ${f.qg||'—'}`,`Segmento: ${f.segmento||'—'}`,`Facção: ${$('#dFaccao').value.trim()||'{FACÇÃO}'}`,`Líder: ${$('#dLider').value.trim()||'{LÍDER}'}`,`Staff responsável: ${$('#dStaff').value.trim()||'{STAFF}'}`,`Data: ${$('#dData').value.trim()||'{DATA}'}`];
 if($('#dPlano').value.trim())lines.push(`Plano / Pacote: ${$('#dPlano').value.trim()}`);lines.push('','BENEFÍCIOS / SETAGENS ENTREGUES:');
 if(!active.length)lines.push('- Nenhum benefício selecionado'); else active.forEach(k=>{const n=INSTALLATIONS.find(x=>x[0]===k)?.[1]||k;lines.push(`- ${n}${installedValue(b,k)&&!['vipOrg','chatFaccao','rotaExclusiva','telao','garagemPublica','heliponto'].includes(k)?`: ${installedValue(b,k)}`:''}`)});
 if($('#dNotes').value.trim())lines.push('','PERSONALIZAÇÕES / ALTERAÇÕES:',$('#dNotes').value.trim());return lines.join('\n');
}
function currentDeliveryRequests(){
 const f=faccoes.find(x=>x.group===$('#dGroup').value);if(!f)return[];const b=f.beneficios||{},a=selectedDeliveryBenefits(),has=k=>a.includes(k),R=[],add=(tipo,titulo,texto)=>R.push({tipo,titulo,texto});
 const vipKeys=['vipOrg','chatFaccao','radio','salario','garagemVip','lojaRoupas','barbearia','tatuagem','shopExclusivo','bau','farm','craft','arena'];
 if(a.some(k=>vipKeys.includes(k))){let L=['Assunto: Ativação de benefícios de uma organização e alguns blips','','Solicitação:','','- Ativação de benefícios de uma organização e alguns blips',`- Group: ${f.group}`];if(has('salario')&&b.salario)L.push('',`- Ativar salário de ${b.salario} (A cada ${b.salarioMinutos||40} minutos)`);if(has('radio')&&b.radio)L.push('',`- Ativar Rádio exclusiva: ${b.radio}`);if(has('chatFaccao'))L.push('','- Chat Facção.');if(has('garagemVip'))L.push('','- Ativar Garagem VIP:',`- Blip: ${fmtCds(b.garagemVipBlip)}`,`- Spawn: ${fmtCds(b.garagemVipSpawn)}`,b.garagemVipVeiculos?`- Veículos: ${b.garagemVipVeiculos}`:'');[['lojaRoupas','Loja de roupas'],['barbearia','Barbearia'],['tatuagem','Tatuagem'],['shopExclusivo','Shop Exclusivo'],['bau','Baú'],['farm','Farm'],['craft','Craft'],['arena','Arena']].forEach(([k,n])=>{if(has(k)&&b[k])L.push('',`- ${n}: ${fmtCds(b[k])}`)});add('BENEFICIOS','VIP Org / Benefícios e Setagens',L.filter(x=>x!==undefined).join('\n'))}
 if(has('rotaExclusiva')){const pts=(b.rotaBlips||'').split(/\r?\n/).filter(Boolean);add('ROTA_FARM','Rota de Farm Exclusiva',['Assunto: Ativação de rota de farm exclusiva','','Solicitação:','','- Ativação de rota de farm exclusiva',`- Group: ${f.group}`,'','- Blips da rota nova:','',...(pts.length?pts:['{ CDS },'])].join('\n'))}
 if(has('telao'))add('TELAO','Telão da Organização',['Assunto: Ativação de Telão Hall em uma Organização Ilegal','','Solicitação:','','- Ativação de Telão Hall em uma Organização Ilegal.','',`- Group: ${f.group}`,`- Telão usado: ${b.telaoNome||'{modelo_do_telao}'}`,'',`- Local/Coordenadas postit: ${fmtCds(b.telaoPostit)}`,`- Local/Coordenadas cds: ${fmtCds(b.telaoCds)}`].join('\n'));
 if(has('garagemPublica'))add('GARAGEM','Garagem Pública',['Assunto:','','- Solicitaçao de Garagem Publica;','','Solicitaçao:','','- Adicione uma garagem publica na CDS abaixo:','',`* Blip: ${fmtCds(b.garagemPublicaBlip)}`,`* Spawn: ${fmtCds(b.garagemPublicaSpawn)}`,'',`- Permissao : ${f.group}`].join('\n'));
 if(has('heliponto'))add('HELIPONTO','Heliponto',['Assunto: Adição de Heliponto','','Solicitação:','- Adicione um Heliponto na cds abaixo;',`- ${fmtCds(b.helipontoBlip)}`,b.helipontoSpawn?`- Spawn: ${fmtCds(b.helipontoSpawn)}`:'','',`- Group: ${f.group}.`].join('\n'));
 if($('#dNotes').value.trim())add('GERAL','Personalização / Alteração estrutural',['Assunto: Alteração / personalização de estrutura do QG','','Solicitação:','',`- Group: ${f.group}`,'', $('#dNotes').value.trim()].join('\n'));
 return R;
}
function updateNewDeliveryPreview(){if(!$('#dExtract'))return;$('#dExtract').value=deliveryExtractV5();const rs=currentDeliveryRequests();$('#dRequests').innerHTML=rs.length?rs.map((r,i)=>`<article class="delivery-request-card"><div><b>${i+1}. ${esc(r.titulo)}</b><span>${esc(r.tipo)}</span></div><pre>${esc(r.texto)}</pre></article>`).join(''):'<div class="delivery-no-change">Selecione o Group e os benefícios que serão ativados.</div>'}
async function copyText(text,btn){if(!text)return alert('Não há conteúdo para copiar.');try{await navigator.clipboard.writeText(text);const o=btn.textContent;btn.textContent='COPIADO ✓';setTimeout(()=>btn.textContent=o,1300)}catch(e){alert('Não foi possível copiar automaticamente.')}}
async function saveNewDelivery(e){
 e.preventDefault();const f=faccoes.find(x=>x.group===$('#dGroup').value);if(!f)return alert('Selecione um Group.');const faccao=$('#dFaccao').value.trim();if(!faccao)return alert('Informe a facção que está assumindo.');const active=selectedDeliveryBenefits(),requests=currentDeliveryRequests(),extract=deliveryExtractV5();
 const payload={group:f.group,qg:f.qg||'',segmento:f.segmento||'',faccao,lider:$('#dLider').value.trim(),staff:$('#dStaff').value.trim(),dataEntrega:$('#dData').value.trim(),plano:$('#dPlano').value.trim(),beneficiosAtivos:active,personalizacoes:$('#dNotes').value.trim(),solicitacoesGeradas:requests,extrato:extract,status:'ATIVA',createdAt:serverTimestamp(),createdAtText:new Date().toISOString(),createdBy:currentUser.email};
 try{
  // encerra logicamente a ocupação anterior no Group e mantém a estrutura física do local.
  const previous=entregas.filter(x=>x.group===f.group&&x.status==='ATIVA');for(const d of previous)await setDoc(doc(db,'highos','data','entregas',d.id),{...d,status:'RECOLHIDA',recolhidaEm:serverTimestamp(),recolhidaPor:currentUser.email},{merge:true});
  await addDoc(deliveryCol,payload);const deliveredGroup={...f,status:'ATIVA',faccao,lider:payload.lider,staff:payload.staff,dataEntrega:payload.dataEntrega,ocupacaoAtual:{faccao,lider:payload.lider,staff:payload.staff,dataEntrega:payload.dataEntrega,plano:payload.plano,beneficiosAtivos:active},updatedAt:serverTimestamp(),updatedBy:currentUser.email};await setDoc(doc(db,'highos','data','faccoes',f.group),deliveredGroup);await syncGroupsToOfficialSheet([deliveredGroup],{quiet:true});await upsertOrganizationFromDelivery(payload,f);
  await addDoc(histCol,{sessionId:currentSessionId||'',tipo:'ENTREGA_GROUP',group:f.group,faccao,solicitacoesGeradas:requests,extrato:extract,usuario:currentUser.email,data:serverTimestamp()});$('#newDeliveryModal').classList.add('hidden');await loadFaccoes();await loadDeliveries();alert('Entrega registrada. A estrutura permanente do Group foi preservada.');
 }catch(err){alert('Erro ao concluir entrega: '+err.message)}
}
initDeliveryUi();
const _loadFaccoesV5=loadFaccoes;loadFaccoes=async function(){await _loadFaccoesV5();renderFaccoes();await loadDeliveries()};

// ===== HIGH OS V5.1 · PERFIL TÉCNICO + MEMÓRIA OPERACIONAL DO GROUP =====
let historico=[];
function historyDateValue(h){
 const d=h?.data;
 try{if(d?.toDate)return d.toDate();if(d?.seconds)return new Date(d.seconds*1000);if(h?.createdAtText)return new Date(h.createdAtText)}catch(e){}
 return null;
}
function formatHistoryDate(h){const d=historyDateValue(h);return d&&!isNaN(d)?d.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}):'—'}
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
 const a=h?.antes||{},d=h?.depois||{}; const out=[];
 const keys=[['qg','QG'],['cds','CDS principal'],['produto','Produto'],['faccao','Facção'],['lider','Líder'],['staff','Staff'],['status','Status']];
 keys.forEach(([k,n])=>{if(String(a[k]??'')!==String(d[k]??''))out.push(`${n}: ${a[k]||'—'} → ${d[k]||'—'}`)});
 const ab=a.beneficios||{},db=d.beneficios||{};
 const names={vipOrg:'VIP Org',chatFaccao:'Chat Facção',radio:'Rádio',salario:'Salário',garagemVipBlip:'Garagem VIP',garagemPublicaBlip:'Garagem Pública',helipontoBlip:'Heliponto',rotaExclusiva:'Rota Exclusiva',telao:'Telão',lojaRoupas:'Loja de roupas',barbearia:'Barbearia',tatuagem:'Tatuagem',shopExclusivo:'Shop',bau:'Baú',farm:'Farm',craft:'Craft',arena:'Arena'};
 Object.keys(names).forEach(k=>{if(JSON.stringify(ab[k]??'')!==JSON.stringify(db[k]??''))out.push(`${names[k]} alterado`)});
 return out.slice(0,5);
}
async function loadHistory(){
 if(!$('#historyList')&&!$('#groupHistoryPreview'))return;
 try{
  const qs=await getDocs(histCol);historico=qs.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(historyDateValue(b)?.getTime()||0)-(historyDateValue(a)?.getTime()||0));renderHistory();
 }catch(e){if($('#historyList'))$('#historyList').innerHTML=`<div class="placeholder"><h3>ERRO AO CARREGAR</h3><p>${esc(e.message)}</p></div>`}
}
async function openRecollectEvidence(evidenceId,historyId=''){if(!evidenceId)return;const modal=$('#recollectEvidenceModal'),img=$('#recollectEvidenceImage'),meta=$('#recollectEvidenceMeta');if(!modal||!img)return;img.removeAttribute('src');meta.textContent='Carregando evidência...';modal.classList.remove('hidden');try{const snap=await getDoc(doc(db,'highos','data','evidencias_recolhimento',evidenceId));if(!snap.exists())throw new Error('Evidência não encontrada.');const e=snap.data(),h=historico.find(x=>x.id===historyId)||{};img.src=e.imagemDataUrl||'';meta.innerHTML=`<span><b>${esc(e.group||h.group||'—')}</b> • ${esc(e.faccao||h.faccao||'—')}</span><span>${esc(h.motivoLabel||recollectReasonLabel(e.motivo)||'Recolhimento')} • ${esc(h.dataRecolhimento||'')}</span>`}catch(err){meta.textContent='Não foi possível abrir a evidência: '+err.message}}
$('#recollectEvidenceClose')?.addEventListener('click',()=>$('#recollectEvidenceModal')?.classList.add('hidden'));
function renderHistory(){
 if(!$('#historyList'))return;
 const q=($('#historySearch')?.value||'').toLowerCase(),type=$('#historyType')?.value||'';
 const list=historico.filter(h=>(!type||historyFamily(h.tipo)===type||String(h.tipo||'')===type)&&(!q||[h.tipo,h.group,h.faccao,h.usuario,h.usuarioAlvo,h.descricao,h.motivoLabel,h.responsavel,h.justificativa,JSON.stringify(h.depois||{})].join(' ').toLowerCase().includes(q)));
 const deliveries=historico.filter(h=>historyFamily(h.tipo)==='ENTREGA').length,recol=historico.filter(h=>historyFamily(h.tipo)==='RECOLHIMENTO').length,edits=historico.filter(h=>historyFamily(h.tipo)==='EDICAO').length;
 $('#historyStats').innerHTML=`<span><b>${historico.length}</b> EVENTOS</span><span><b>${deliveries}</b> ENTREGAS</span><span><b>${recol}</b> RECOLHIMENTOS</span><span><b>${edits}</b> ALTERAÇÕES</span><span><b>${list.length}</b> EXIBIDOS</span>`;
 if(!list.length){$('#historyList').innerHTML='<div class="placeholder"><b>◷</b><h3>NENHUM EVENTO ENCONTRADO</h3><p>Altere os filtros ou registre uma nova operação.</p></div>';return}
 $('#historyList').innerHTML=list.map(h=>{const changes=changedSummary(h),isRec=historyFamily(h.tipo)==='RECOLHIMENTO',recInfo=isRec?`<div class="recollect-history-data"><span><b>Motivo</b>${esc(h.motivoLabel||recollectReasonLabel(h.motivo)||'—')}</span><span><b>Responsável</b>${esc(h.responsavel||h.usuario||'—')}</span><span><b>Data efetiva</b>${esc([h.dataRecolhimento,h.horaRecolhimento].filter(Boolean).join(' • ')||'—')}</span>${h.baixoContingente?`<span><b>Contingente</b>${esc(String(h.baixoContingente.observado??'—'))} / mínimo ${esc(String(h.baixoContingente.minimo??'—'))}</span>`:''}</div>${h.justificativa?`<p class="recollect-justification">${esc(h.justificativa)}</p>`:''}${h.evidenciaId?`<button type="button" class="mini-btn history-evidence-btn" data-evidence="${esc(h.evidenciaId)}" data-history="${esc(h.id)}">VER PRINT DO PAINEL</button>`:''}`:'';return `<article class="history-row"><div class="history-icon h-${historyFamily(h.tipo).toLowerCase()}">◷</div><div class="history-main"><div class="history-top"><strong>${esc(historyTitle(h))}</strong><span>${esc(formatHistoryDate(h))}</span></div><div class="history-meta">${h.group?`<b>${esc(h.group)}</b>`:''}${h.faccao?` • ${esc(h.faccao)}`:''}${h.usuario?` • por ${esc(h.usuario)}`:''}</div>${h.descricao?`<p>${esc(h.descricao)}</p>`:''}${recInfo}${changes.length?`<div class="history-changes">${changes.map(x=>`<span>${esc(x)}</span>`).join('')}</div>`:''}${Array.isArray(h.solicitacoesGeradas)&&h.solicitacoesGeradas.length?`<small>${h.solicitacoesGeradas.length} solicitação(ões) técnica(s) gerada(s)</small>`:''}</div></article>`}).join('');
 $('#historyList').querySelectorAll('.history-evidence-btn').forEach(btn=>btn.addEventListener('click',()=>openRecollectEvidence(btn.dataset.evidence,btn.dataset.history)));
}
function renderGroupProfileMemory(f){
 if(!f)return;const b=f.beneficios||{},installed=INSTALLATIONS.filter(([k])=>isInstalled(b,k));
 if($('#groupProfileSummary'))$('#groupProfileSummary').innerHTML=`<div><span>STATUS</span><b class="${f.status==='ATIVA'?'online':''}">${f.status==='ATIVA'?'OCUPADO':'VAGO'}</b></div><div><span>OCUPANTE ATUAL</span><b>${esc(f.faccao||'—')}</b></div><div><span>QG / LOCAL</span><b>${esc(f.qg||'SEM LOCAL')}</b></div><div><span>INSTALAÇÕES</span><b>${installed.length}</b></div>`;
 const hs=historico.filter(h=>h.group===f.group).slice(0,6),box=$('#groupHistoryPreview');if(!box)return;
 box.innerHTML=hs.length?hs.map(h=>`<div class="group-history-item"><i></i><div><b>${esc(historyTitle(h))}</b><span>${esc(formatHistoryDate(h))}${h.usuario?' • '+esc(h.usuario):''}</span></div></div>`).join(''):'<div class="delivery-no-change">Ainda não há eventos registrados para este Group.</div>';
}
$('#historySearch')?.addEventListener('input',renderHistory);$('#historyType')?.addEventListener('change',renderHistory);
const _openFacV51=openFac;openFac=function(id){_openFacV51(id);renderGroupProfileMemory(faccoes.find(x=>x.id===id))};
const _loadFaccoesV51=loadFaccoes;loadFaccoes=async function(){await _loadFaccoesV51();await loadHistory();await loadOrganizations()};

// ===== HIGH OS V5.2 · PERFIL PADRÃO DE ENTREGA POR GROUP =====

// ===== HIGH OS V5.4 · ALVESINHO OPERACIONAL =====
function alvesNorm(v=''){return String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
function alvesFindGroup(text=''){
 const n=alvesNorm(text);return faccoes.find(f=>n.includes(alvesNorm(f.group)))||faccoes.find(f=>n.includes(alvesNorm(f.qg||''))&&String(f.qg||'').length>2)||null;
}
function alvesFindOrg(text=''){
 const n=alvesNorm(text);return organizacoes.find(o=>n.includes(alvesNorm(o.nome)))||faccoes.map(f=>({nome:f.faccao,groupAtual:f.group,segmentoAtual:f.segmento,qgAtual:f.qg,lider:f.lider,status:f.status==='ATIVA'?'ATIVA':'SEM_GROUP'})).find(o=>o.nome&&n.includes(alvesNorm(o.nome)))||null;
}
function alvesInstalledLines(f){
 const b=f?.beneficios||{};const lines=[];
 INSTALLATIONS.forEach(([k,n])=>{if(isInstalled(b,k))lines.push(`${n}: ${installedValue(b,k)||'SIM'}`)});
 if(b.garagemVipBlip||b.garagemVipSpawn)lines.push(`Garagem VIP: Blip ${b.garagemVipBlip||'—'} | Spawn ${b.garagemVipSpawn||'—'}`);
 if(b.garagemPublicaBlip||b.garagemPublicaSpawn)lines.push(`Garagem Pública: Blip ${b.garagemPublicaBlip||'—'} | Spawn ${b.garagemPublicaSpawn||'—'}`);
 if(b.helipontoBlip||b.helipontoSpawn)lines.push(`Heliponto: Blip ${b.helipontoBlip||'—'} | Spawn ${b.helipontoSpawn||'—'}`);
 return [...new Set(lines)];
}
function alvesLastHistory(group,limit=5){return historico.filter(h=>alvesNorm(h.group)===alvesNorm(group)).slice(0,limit)}
function alvesDateFromDelivery(d){return d?.dataEntrega||(()=>{try{return d?.createdAt?.toDate?.().toLocaleDateString('pt-BR')||''}catch{return''}})()||'—'}
function alvesAnswer(question=''){
 const q=alvesNorm(question),g=alvesFindGroup(question),o=alvesFindOrg(question);
 if(!q)return {text:'Digite uma pergunta sobre a base operacional.'};

 if(q.includes('resumo')&&(q.includes('operacional')||q.includes('geral'))){
  const occupied=faccoes.filter(f=>f.status==='ATIVA').length,vagos=faccoes.length-occupied,ativas=organizacoes.filter(x=>x.status==='ATIVA').length,sem=organizacoes.filter(x=>x.status==='SEM_GROUP').length,del=entregas.filter(x=>x.status==='ATIVA').length;
  return {text:`Resumo operacional atual:\n• ${faccoes.length} Groups cadastrados: ${occupied} ocupados e ${vagos} vagos.\n• ${organizacoes.length} facções cadastradas: ${ativas} ativas e ${sem} sem Group.\n• ${del} entregas ativas registradas.\n• ${historico.length} eventos no histórico.`,refs:['Groups/QGs','Facções','Entregas','Histórico']};
 }
 if((q.includes('group')||q.includes('groups'))&&(q.includes('vago')||q.includes('livre'))){
  const list=faccoes.filter(f=>f.status!=='ATIVA');return {text:list.length?`Groups vagos (${list.length}):\n${list.map(f=>`• ${f.group} — ${f.qg||'sem QG informado'} (${f.segmento||'OUTROS'})`).join('\n')}`:'Não há Groups vagos cadastrados.',refs:['Groups/QGs']};
 }
 if(q.includes('facc')&&(q.includes('sem group')||q.includes('sem qg')||q.includes('sem local'))){
  const list=organizacoes.filter(x=>x.status==='SEM_GROUP'||!x.groupAtual);return {text:list.length?`Facções sem Group (${list.length}):\n${list.map(x=>`• ${x.nome}${x.lider?' — líder: '+x.lider:''}`).join('\n')}`:'Não há facções sem Group cadastradas.',refs:['Facções']};
 }
 if((q.includes('ultima')||q.includes('recent'))&&q.includes('entrega')){
  const list=entregas.slice(0,6);return {text:list.length?`Últimas entregas registradas:\n${list.map(d=>`• ${d.group} → ${d.faccao||'—'} | ${alvesDateFromDelivery(d)} | ${d.status||'—'}`).join('\n')}`:'Ainda não há entregas registradas.',refs:['Entregas']};
 }
 if(g&&(q.includes('quem ocupa')||q.includes('ocupante')||q.includes('qual fac')||q.includes('faccao'))){
  return {text:g.status==='ATIVA'&&g.faccao?`${g.group} está ocupado por ${g.faccao}.${g.lider?` Líder cadastrado: ${g.lider}.`:''}${g.qg?` QG/local: ${g.qg}.`:''}`:`${g.group} está vago no momento.${g.qg?` Local cadastrado: ${g.qg}.`:''}`,refs:[g.group,'Groups/QGs']};
 }
 if(g&&(q.includes('instalad')||q.includes('estrutura')||q.includes('beneficio')||q.includes('tem no')||q.includes('possui')||q.startsWith('o que'))){
  const lines=alvesInstalledLines(g);return {text:`${g.group} — ${g.qg||'QG sem nome'}\nStatus: ${g.status==='ATIVA'?'ocupado por '+(g.faccao||'—'):'vago'}\n${lines.length?'Estrutura/setagens cadastradas:\n'+lines.map(x=>'• '+x).join('\n'):'Nenhuma instalação/setagem foi cadastrada nesse Group ainda.'}`,refs:[g.group,'Perfil Técnico']};
 }
 if((g||o)&&q.includes('radio')){
  const target=g||faccoes.find(f=>alvesNorm(f.faccao)===alvesNorm(o?.nome));const radio=target?.beneficios?.radio||'';
  return {text:target?(radio?`O rádio cadastrado para ${target.faccao||target.group} no ${target.group} é ${radio}.`:`${target.group}${target.faccao?' / '+target.faccao:''} não possui número de rádio cadastrado no Perfil Técnico.`):`Encontrei a facção ${o?.nome||''}, mas ela não está vinculada a um Group com rádio cadastrado.`,refs:[target?.group||o?.nome,'Perfil Técnico']};
 }
 if(g&&(q.includes('histor')||q.includes('mudanc')||q.includes('alterac'))){
  const hs=alvesLastHistory(g.group,6);return {text:hs.length?`Histórico recente de ${g.group}:\n${hs.map(h=>`• ${formatHistoryDate(h)} — ${historyTitle(h)}${h.usuario?' — '+h.usuario:''}`).join('\n')}`:`Ainda não há eventos no histórico de ${g.group}.`,refs:[g.group,'Histórico']};
 }
 if(g&&q.includes('solicit')){
  const ds=entregas.filter(d=>d.group===g.group&&Array.isArray(d.solicitacoesGeradas)&&d.solicitacoesGeradas.length).slice(0,3);const reqs=ds.flatMap(d=>d.solicitacoesGeradas.map(r=>({d,r}))).slice(0,8);
  return {text:reqs.length?`Solicitações recentes geradas para ${g.group}:\n${reqs.map(x=>`• ${x.r.titulo||x.r.tipo||'Solicitação'} — entrega ${x.d.faccao||'—'}`).join('\n')}`:`Não encontrei solicitações geradas em entregas do ${g.group}. A Biblioteca de Solicitações continua disponível para modelos manuais.`,refs:[g.group,'Entregas','Biblioteca de Solicitações']};
 }
 if(g&&q.includes('entrega')){
  const ds=entregas.filter(d=>d.group===g.group).slice(0,5);return {text:ds.length?`Entregas registradas para ${g.group}:\n${ds.map(d=>`• ${alvesDateFromDelivery(d)} — ${d.faccao||'—'} — ${d.status||'—'}${d.lider?' — líder: '+d.lider:''}`).join('\n')}`:`Não há entregas registradas para ${g.group}.`,refs:[g.group,'Entregas']};
 }
 if(o){
  const target=faccoes.find(f=>alvesNorm(f.faccao)===alvesNorm(o.nome));return {text:`${o.nome}\nStatus: ${o.status||'—'}\nGroup atual: ${o.groupAtual||target?.group||'SEM GROUP'}\nSegmento: ${o.segmentoAtual||target?.segmento||'—'}\nQG: ${o.qgAtual||target?.qg||'—'}\nLíder: ${o.lider||target?.lider||'—'}${o.contato?`\nContato: ${o.contato}`:''}`,refs:[o.nome,'Facções']};
 }
 if(g){return {text:`${g.group} — ${g.qg||'QG sem nome'}\nSegmento: ${g.segmento||'—'}\nStatus: ${g.status==='ATIVA'?'OCUPADO':'VAGO'}\nFacção atual: ${g.faccao||'—'}\nLíder: ${g.lider||'—'}\nInstalações/setagens cadastradas: ${installedCount(g)}.`,refs:[g.group,'Groups/QGs']};}
 return {text:'Não encontrei um Group ou facção correspondente na base para responder com segurança. Tente informar o Group (ex.: Armas02) ou o nome exato da facção.',refs:['Base High OS']};
}
function alvesAddMessage(role,text,refs=[]){
 const box=$('#alvesMessages');if(!box)return;const div=document.createElement('div');div.className=`alves-msg ${role}`;div.innerHTML=`<div class="alves-bubble"><b>${role==='user'?'VOCÊ':'ALVESINHO'}</b><p>${esc(text)}</p>${refs?.length?`<div class="alves-ref">${refs.filter(Boolean).map(x=>`<span>${esc(x)}</span>`).join('')}</div>`:''}</div>`;box.appendChild(div);box.scrollTop=box.scrollHeight;
}
function askAlvesinho(q){if(!q?.trim())return;alvesAddMessage('user',q);const a=alvesAnswer(q);setTimeout(()=>alvesAddMessage('bot',a.text,a.refs||[]),60)}
$('#alvesForm')?.addEventListener('submit',e=>{e.preventDefault();const input=$('#alvesInput'),q=input.value;input.value='';askAlvesinho(q)});
document.querySelectorAll('#alvesQuick [data-q]').forEach(b=>b.addEventListener('click',()=>askAlvesinho(b.dataset.q)));

// ===== HIGH OS V5.8 · PARSER DA PLANILHA OFICIAL + GOOGLE SHEETS SOMENTE LEITURA =====
let metricas=[],metricasCache=[],metricPeriodKey='',metricDateStart='',metricDateEnd='',metricSourceConfig={url:'',sheet:'',autoSync:true},metricSourceState={status:'SEM FONTE',lastSync:null,count:0,activeCount:0,error:''},sheetsAccessToken='',mercadoCatalogo=[],mercadoStatus='CARREGANDO';
const metricCol=collection(db,'highos','data','metricas');
const metricConfigDoc=doc(db,'highos','metricas_config');
const MARKET_CATALOG_URL='https://alvesjardimitalo-oss.github.io/high-mercado-negro/data/catalogo.json';
const SHEETS_SCOPE='https://www.googleapis.com/auth/spreadsheets.readonly';

function metricDateValue(m){
 const raw=String(m?.data||m?.date||'').trim();
 const br=raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);if(br){let y=+br[3];if(y<100)y+=2000;return new Date(y,+br[2]-1,+br[1])}
 const d=new Date(raw);return isNaN(d)?new Date(0):d;
}
function normalizeMetricSlotKey(v=''){
 const x=String(v??'').trim().toUpperCase().replace(/\s+/g,'');
 let m=x.match(/^(\d{1,2})(?::(\d{2}))?H?$/);if(!m)return '';let h=+m[1],min=m[2]===undefined?0:+m[2];if(h>23||min>59)return '';return min===0?`${String(h).padStart(2,'0')}H`:`${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
}
function metricSlotMinutes(k=''){const x=String(k).toUpperCase();let m=x.match(/^(\d{1,2})H$/);if(m)return +m[1]*60;m=x.match(/^(\d{1,2}):(\d{2})$/);return m?+m[1]*60 + +m[2]:9999}
function metricSlots(m){
 const src=m?.slots||{},out={};Object.entries(src).forEach(([k,v])=>{const nk=normalizeMetricSlotKey(k);if(nk&&Number.isFinite(Number(v)))out[nk]=Number(v)});
 [['14H',m?.['14H']??m?.h14],['16H',m?.['16H']??m?.h16],['21H',m?.['21H']??m?.h21],['23H',m?.['23H']??m?.h23]].forEach(([k,v])=>{if(!(k in out)&&v!==undefined&&v!==null&&v!=='')out[k]=Number(v)||0});
 return Object.fromEntries(Object.entries(out).sort((a,b)=>metricSlotMinutes(a[0])-metricSlotMinutes(b[0])));
}
function metricSlotKeys(rows=activeMetricRows()){return [...new Set(rows.flatMap(r=>Object.keys(metricSlots(r))))].sort((a,b)=>metricSlotMinutes(a)-metricSlotMinutes(b))}

function metricMonthKey(m){
 const d=metricDateValue(m);if(!d||d.getTime()===0)return '';return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}
function currentMetricMonthKey(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
function metricPeriodLabel(key=''){
 const m=String(key).match(/^(\d{4})-(\d{2})$/);if(!m)return key||'—';const d=new Date(+m[1],+m[2]-1,1);return d.toLocaleDateString('pt-BR',{month:'long',year:'numeric'}).replace(/^./,c=>c.toUpperCase());
}
function parseIsoMetricDate(v=''){const m=String(v).match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?new Date(+m[1],+m[2]-1,+m[3]):null}
function metricGroupOccupied(group){return faccoes.some(f=>alvesNorm(f.group)===alvesNorm(group)&&f.status==='ATIVA'&&String(f.faccao||'').trim())}
function activeMetricRows(){
 const occupied=m=>metricGroupOccupied(m.group||m.organizacao||m.faccao);
 if(metricDateStart||metricDateEnd){const a=parseIsoMetricDate(metricDateStart),b=parseIsoMetricDate(metricDateEnd);return metricas.filter(m=>{const d=metricDateValue(m);return occupied(m)&&(!a||d>=a)&&(!b||d<=new Date(b.getFullYear(),b.getMonth(),b.getDate(),23,59,59))})}
 const key=metricPeriodKey||currentMetricMonthKey();return metricas.filter(m=>occupied(m)&&metricMonthKey(m)===key)
}
function metricActivePeriodLabel(){if(metricDateStart||metricDateEnd){const f=x=>{const d=parseIsoMetricDate(x);return d?d.toLocaleDateString('pt-BR'):'…'};return `${f(metricDateStart)} a ${f(metricDateEnd)}`}return metricPeriodLabel(metricPeriodKey)}
function syncMetricDateInputs(){const a=$('#metricDateStart'),b=$('#metricDateEnd');if(a)a.value=metricDateStart;if(b)b.value=metricDateEnd}

function refreshMetricPeriodOptions(){
 const el=$('#metricPeriod');if(!el)return;const current=currentMetricMonthKey();const keys=[...new Set(metricas.map(metricMonthKey).filter(Boolean))].sort().reverse();if(!keys.includes(current))keys.unshift(current);if(!metricPeriodKey)metricPeriodKey=current;if(!keys.includes(metricPeriodKey))metricPeriodKey=current;
 el.innerHTML=keys.map(k=>`<option value="${esc(k)}"${k===metricPeriodKey?' selected':''}>${esc(metricPeriodLabel(k))}${k===current?' • ATUAL':''}</option>`).join('');
}
function metricGroupRecords(group){return activeMetricRows().filter(m=>alvesNorm(m.group||m.organizacao||m.faccao)===alvesNorm(group)).sort((a,b)=>metricDateValue(a)-metricDateValue(b))}
function metricPredominanceRange(values=[],width=5){
 const vals=values.map(Number).filter(Number.isFinite);if(!vals.length)return {label:'—',start:null,end:null,count:0,share:0,mid:0};
 const min=Math.floor(Math.min(...vals)),max=Math.ceil(Math.max(...vals));let best=null;
 for(let start=min;start<=max;start++){const end=start+width-1,count=vals.filter(v=>v>=start&&v<=end).length,inside=vals.filter(v=>v>=start&&v<=end),avgInside=inside.length?inside.reduce((a,b)=>a+b,0)/inside.length:0;const cand={start,end,count,avgInside};if(!best||count>best.count||(count===best.count&&avgInside>best.avgInside))best=cand}
 return {label:`${best.start}–${best.end}`,start:best.start,end:best.end,count:best.count,share:best.count/vals.length*100,mid:(best.start+best.end)/2};
}
function metricAnalysis(group){
 const rows=metricGroupRecords(group);if(!rows.length)return null;const vals=[],win={},dailyPeaks=[],hourValues={};let peak={value:-1,hour:'—',date:'—'};
 rows.forEach(r=>{const entries=Object.entries(metricSlots(r)).filter(([,v])=>Number.isFinite(Number(v)));entries.forEach(([h,v0])=>{const v=Number(v0);vals.push(v);if(!hourValues[h])hourValues[h]=[];hourValues[h].push(v);if(!(h in win))win[h]=0;if(v>peak.value)peak={value:v,hour:h,date:r.data||r.date||'—'}});if(entries.length){const mx=Math.max(...entries.map(x=>Number(x[1])));dailyPeaks.push(mx);entries.filter(x=>Number(x[1])===mx&&mx>0).forEach(x=>win[x[0]]++)}});
 const avg=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0;const predHour=Object.entries(win).sort((a,b)=>b[1]-a[1])[0];const predominance=metricPredominanceRange(vals);const nightVals=Object.entries(hourValues).filter(([h])=>metricSlotMinutes(h)>=21*60).flatMap(([,v])=>v);const nightPredominance=metricPredominanceRange(nightVals);const hourAvg=Object.fromEntries(Object.entries(hourValues).map(([h,v])=>[h,v.length?v.reduce((a,b)=>a+b,0)/v.length:0]));const strongestHour=Object.entries(hourAvg).sort((a,b)=>b[1]-a[1])[0]||['—',0];const dailyPeakAvg=dailyPeaks.length?dailyPeaks.reduce((a,b)=>a+b,0)/dailyPeaks.length:0;
 return {rows,avg,peak,predominant:predHour&&predHour[1]?predHour[0]:'—',predCount:predHour?.[1]||0,predominance,nightPredominance,dailyPeakAvg,hourAvg,strongestHour:strongestHour[0],strongestHourAvg:strongestHour[1]};
}

function extractSpreadsheetId(value=''){
 const v=String(value||'').trim();if(!v)return '';
 const m=v.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);if(m)return m[1];
 return /^[a-zA-Z0-9-_]{20,}$/.test(v)?v:'';
}
function a1SheetName(name=''){return `'${String(name).replace(/'/g,"''")}'`}
function normalizeMetricDate(v){
 const x=String(v??'').trim();if(!x)return '';
 let m=x.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);if(m){let y=+m[3];if(y<100)y+=2000;return `${String(+m[1]).padStart(2,'0')}/${String(+m[2]).padStart(2,'0')}/${y}`}
 m=x.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);if(m)return `${String(+m[3]).padStart(2,'0')}/${String(+m[2]).padStart(2,'0')}/${m[1]}`;
 return '';
}
function parseMetricNumber(v){if(v===null||v===undefined||String(v).trim()==='')return null;const n=Number(String(v).replace(/\s/g,'').replace(',','.'));return Number.isFinite(n)?n:null}
function metricSlotLabel(v){return normalizeMetricSlotKey(v)}
function metricGroupLabel(v){
 const raw=String(v??'').trim();if(!raw)return '';
 const n=alvesNorm(raw).replace(/\s+/g,'');
 const known=(faccoes||[]).find(f=>alvesNorm(f.group).replace(/\s+/g,'')===n);if(known)return known.group;
 const compact=raw.replace(/\s+/g,'');
 if(/^(ARMAS|MUNI[CÇ][AÃ]O|MUNICAO|LAVAGEM|DROGAS|DESMANCHE|CONTRABANDO|ESTELIONATARIOS|ILEGALMEDIC|ILEGALMECHANIC)0*\d+$/i.test(compact))return compact.replace(/^MUNI[CÇ][AÃ]O/i,'Municao');
 if(/^(VANILLA|MANICOMIO)$/i.test(compact))return compact;
 return '';
}
function parseMetricSheet(values=[]){
 if(!Array.isArray(values)||!values.length)return [];
 // A aba oficial pode conter vários blocos mensais (junho, julho, agosto, setembro...)
 // na mesma página. Cada bloco tem sua própria linha de datas + linha 14H/16H/21H/23H.
 // O parser antigo escolhia apenas um cabeçalho e acabava reaproveitando as datas de um mês antigo.
 const scanLimit=Math.min(values.length,600);
 const headerIndexes=[];
 for(let i=0;i<scanLimit;i++){
  const labels=(values[i]||[]).map(metricSlotLabel).filter(Boolean);
  const distinct=new Set(labels);
  // Exige os quatro horários e ao menos duas sequências para não confundir linhas auxiliares.
  if(['14H','16H','21H','23H'].every(h=>distinct.has(h))&&labels.length>=8)headerIndexes.push(i);
 }
 if(!headerIndexes.length)return [];

 function nearestDateRow(headerIndex){
  let best=-1,bestScore=-1;
  // O cabeçalho de datas normalmente fica imediatamente acima, mas há títulos/linhas vazias.
  for(let i=Math.max(0,headerIndex-12);i<headerIndex;i++){
   const dates=(values[i]||[]).map(normalizeMetricDate).filter(Boolean);
   if(!dates.length)continue;
   // Prioriza mais datas e proximidade do cabeçalho.
   const score=dates.length*1000-(headerIndex-i);
   if(score>bestScore){bestScore=score;best=i}
  }
  return best;
 }

 function buildColumnDateMap(header,dateRow){
  const orderedDates=(dateRow||[]).map(normalizeMetricDate).filter(Boolean);
  if(!orderedDates.length)return {};
  const map={};let dayIndex=-1,lastSlot='';
  for(let c=0;c<header.length;c++){
   const h=metricSlotLabel(header[c]);if(!h)continue;
   // Cada novo 14H inicia um novo dia. Se o bloco começar desalinhado, inicia no primeiro horário.
   if(h==='14H'||dayIndex<0||(['16H','21H','23H'].indexOf(h)<=['16H','21H','23H'].indexOf(lastSlot)&&lastSlot))dayIndex++;
   if(dayIndex>=0&&dayIndex<orderedDates.length)map[c]=orderedDates[dayIndex];
   lastSlot=h;
  }
  return map;
 }

 const out=[];const seenKeys=new Set();
 for(let b=0;b<headerIndexes.length;b++){
  const headerIndex=headerIndexes[b];
  const nextHeader=headerIndexes[b+1]??values.length;
  const dateRowIndex=nearestDateRow(headerIndex);if(dateRowIndex<0)continue;
  const header=values[headerIndex]||[],dateRow=values[dateRowIndex]||[];
  const dateByCol=buildColumnDateMap(header,dateRow);
  if(!Object.keys(dateByCol).length)continue;

  for(let r=headerIndex+1;r<nextHeader;r++){
   const row=values[r]||[];let group='';
   for(const cell of row.slice(0,20)){group=metricGroupLabel(cell);if(group)break}
   if(!group)continue;
   const byDate={};
   for(let c=0;c<header.length;c++){
    const h=metricSlotLabel(header[c]);if(!h)continue;
    const d=dateByCol[c];if(!d)continue;
    const num=parseMetricNumber(row[c]);if(num===null)continue;
    if(!byDate[d])byDate[d]={group,data:d,slots:{},seen:new Set()};
    byDate[d].slots[h]=num;byDate[d].seen.add(h);
   }
   Object.values(byDate).forEach(x=>{
    if(!x.seen.size)return;
    const key=`${alvesNorm(x.group)}|${x.data}`;
    if(seenKeys.has(key))return;
    seenKeys.add(key);delete x.seen;out.push(x);
   });
  }
 }
 return out;
}
async function authorizeSheets(){
 if(sheetsAccessToken)return sheetsAccessToken;if(!currentUser)throw new Error('Entre no High OS antes de conectar a planilha.');
 sheetsProvider.setCustomParameters({prompt:'consent',login_hint:currentUser.email||''});
 const before=(currentUser.email||'').toLowerCase();const result=await signInWithPopup(auth,sheetsProvider);const after=(result.user?.email||'').toLowerCase();
 if(before&&after&&before!==after)throw new Error('Autorize com a mesma conta Google usada no High OS.');
 const credential=GoogleAuthProvider.credentialFromResult(result);const token=credential?.accessToken;if(!token)throw new Error('O Google não retornou autorização para leitura da planilha.');sheetsAccessToken=token;return token;
}
async function sheetsFetch(url,token){
 const r=await fetch(url,{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});let payload={};try{payload=await r.json()}catch(e){}
 if(!r.ok){const msg=payload?.error?.message||`Google Sheets API: HTTP ${r.status}`;if(r.status===401)sheetsAccessToken='';throw new Error(msg)}return payload;
}
async function getSheetTitles(spreadsheetId,token){
 const url=`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=sheets.properties(title,index)`;const p=await sheetsFetch(url,token);return (p.sheets||[]).sort((a,b)=>(a.properties?.index||0)-(b.properties?.index||0)).map(x=>x.properties?.title).filter(Boolean);
}
async function readMetricSheet(spreadsheetId,sheet,token){
 const range=`${a1SheetName(sheet)}!A1:ZZ300`;const url=`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE`;const p=await sheetsFetch(url,token);return parseMetricSheet(p.values||[]);
}
async function readMetricsDirect({authorize=false,urlOverride='',sheetOverride=''}={}){
 const source=urlOverride||metricSourceConfig.url,id=extractSpreadsheetId(source);if(!id)throw new Error('Informe um link ou ID válido do Google Sheets.');
 let token=sheetsAccessToken;if(!token&&authorize)token=await authorizeSheets();if(!token)throw new Error('AUTORIZAÇÃO NECESSÁRIA');
 const requested=(sheetOverride||metricSourceConfig.sheet||'').trim();if(requested){const rows=await readMetricSheet(id,requested,token);if(!rows.length)throw new Error(`A aba “${requested}” foi lida, mas o formato de métricas não foi reconhecido.`);return {rows,sheet:requested}}
 const titles=await getSheetTitles(id,token);let best={rows:[],sheet:''};for(const title of titles){try{const rows=await readMetricSheet(id,title,token);if(rows.length>best.rows.length)best={rows,sheet:title}}catch(e){}}
 if(!best.rows.length)throw new Error('Nenhuma aba com o padrão 14H / 16H / 21H / 23H foi encontrada.');return best;
}
async function loadMetricSourceConfig(){
 try{const s=await getDoc(metricConfigDoc);if(s.exists())metricSourceConfig={...metricSourceConfig,...s.data()}}catch(e){}renderMetricSourceStatus();
}
function metricTsToDate(v){
 if(!v)return null;if(v?.toDate)return v.toDate();if(v?.seconds)return new Date(v.seconds*1000);const d=new Date(v);return isNaN(d)?null:d;
}
function renderMetricSourceStatus(){
 const el=$('#metricSourceStatus');if(!el)return;const has=metricSourceConfig.mode==='GOOGLE_APPS_SCRIPT_FREE'||!!extractSpreadsheetId(metricSourceConfig.url),srv=metricSourceConfig.serverSync||{};const serverState=String(srv.status||'').toUpperCase();const localState=metricSourceState.status;const online=serverState==='ONLINE'||localState==='ONLINE';const failed=serverState==='ERRO'||localState==='ERRO';el.classList.toggle('online',online);el.classList.toggle('error',failed);
 const last=metricTsToDate(srv.lastSuccessAt)||metricTsToDate(srv.lastRunAt)||(metricSourceState.lastSync?new Date(metricSourceState.lastSync):null);const when=last?last.toLocaleString('pt-BR'):'—';let desc='Informe o link da planilha oficial';
 if(has)desc=metricSourceConfig.autoSync===false?'Fonte configurada • sincronização automática pausada':'Apps Script permanente • sincronização automática 14:05, 16:05, 21:05 e 23:05 • sem Blaze';
 if(online)desc=`Base sincronizada • ${Number(srv.rows??metricSourceState.count??metricas.length)||0} registros históricos${srv.sheet?' • aba '+srv.sheet:''}`;
 if(failed)desc=srv.error||metricSourceState.error||'Falha na sincronização automática';
 el.innerHTML=`<div><span class="metric-source-dot"></span><div><b>${has?'GOOGLE SHEETS • APPS SCRIPT GRATUITO':'FONTE NÃO CONFIGURADA'}</b><small>${esc(desc)}</small></div></div><span>${has?`Última sincronização: ${esc(when)}<br>AGENDA • 14:05 · 16:05 · 21:05 · 23:05`:'CONFIGURAR'}</span>`;
}
async function fetchMetricsFromSource({persist=false,quiet=false,authorize=true}={}){
 if(!extractSpreadsheetId(metricSourceConfig.url)){if(!quiet)alert('Configure primeiro o link da planilha em Fonte.');metricSourceState={status:'SEM FONTE',lastSync:null,count:0,activeCount:0,error:''};renderMetricSourceStatus();return false}
 metricSourceState={...metricSourceState,status:'SINCRONIZANDO',error:''};renderMetricSourceStatus();
 try{const result=await readMetricsDirect({authorize});const rows=result.rows.map(metricSnapshot);metricas=rows;metricPeriodKey=currentMetricMonthKey();metricSourceState={status:'ONLINE',lastSync:Date.now(),count:rows.length,activeCount:activeMetricRows().length,error:'',sheet:result.sheet};renderMetricSourceStatus();refreshMetricPeriodOptions();renderMetrics();if(persist)await persistMetricRows(rows,result.sheet);if(!quiet)alert(`${rows.length} registro(s) históricos lidos da aba ${result.sheet}. Exibindo ${activeMetricRows().length} registro(s) de ${metricPeriodLabel(metricPeriodKey)}. A planilha não foi alterada.`);return true
 }catch(e){metricas=metricasCache.slice();if(e.message==='AUTORIZAÇÃO NECESSÁRIA'){metricSourceState={...metricSourceState,status:'AGUARDANDO',error:''};renderMetricSourceStatus();return false}metricSourceState={...metricSourceState,status:'ERRO',error:e.message};renderMetricSourceStatus();renderMetrics();if(!quiet)alert('Erro ao sincronizar métricas: '+e.message);return false}
}
async function persistMetricRows(rows,sheet=''){
 const chunks=[];for(let i=0;i<rows.length;i+=400)chunks.push(rows.slice(i,i+400));for(const chunk of chunks){const batch=writeBatch(db);chunk.forEach(r=>{r=metricSnapshot(r);const id=(r.group+'_'+r.data).replace(/[^a-zA-Z0-9_-]/g,'_');batch.set(doc(db,'highos','data','metricas',id),{...r,source:'GOOGLE_SHEETS_READONLY',sourceSheet:sheet||metricSourceConfig.sheet||'',updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true})});await batch.commit()}
 await addDoc(histCol,{sessionId:currentSessionId||'',tipo:'SINCRONIZACAO_METRICAS',descricao:`${rows.length} registro(s) lidos em modo somente leitura da planilha oficial${sheet?' • aba '+sheet:''}`,usuario:currentUser.email,data:serverTimestamp()});metricasCache=rows.slice();
}
async function loadMetrics(){
 try{const qs=await getDocs(metricCol);metricasCache=qs.docs.map(d=>({id:d.id,...d.data()}));metricas=metricasCache.slice();metricPeriodKey=currentMetricMonthKey()}catch(e){metricasCache=[];metricas=[];metricPeriodKey=currentMetricMonthKey()}
 await loadMetricSourceConfig();refreshMetricPeriodOptions();renderMetrics();renderMetricSourceStatus();
}
function metricIdentity(group,row=null){
 const f=faccoes.find(x=>alvesNorm(x.group)===alvesNorm(group))||SEED.find(x=>alvesNorm(x.group)===alvesNorm(group))||{};
 return {group:group||f.group||'',faccao:row?.faccaoSnapshot||row?.faccao||f.faccao||'',qg:row?.qgSnapshot||f.qg||'',segmento:row?.segmentoSnapshot||f.segmento||'',lider:row?.liderSnapshot||f.lider||''};
}
function metricSnapshot(row={}){
 const id=metricIdentity(row.group||row.organizacao||row.faccao,row);
 return {...row,faccaoSnapshot:id.faccao,qgSnapshot:id.qg,segmentoSnapshot:id.segmento,liderSnapshot:id.lider,snapshotVersion:'V8.4'};
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
  const f=faccoes.find(x=>alvesNorm(String(x.group||'')).replace(/\s+/g,'')===alvesNorm(group).replace(/\s+/g,''))||ident;
  const a=metricAnalysis(group);
  return a?{f:{...f,group:String(f.group||group).trim(),faccao:f.faccao||metricIdentity(group,a.rows[0]).faccao,segmento:f.segmento||metricIdentity(group,a.rows[0]).segmento,qg:f.qg||metricIdentity(group,a.rows[0]).qg},a}:null;
 }).filter(Boolean).sort((x,y)=>y.a.avg-x.a.avg);
}
function metricDateLabel(row){const d=metricDateValue(row);return d&&d.getTime()?d.toLocaleDateString('pt-BR'):(row?.data||row?.date||'—')}
function metricDayAverage(row){const v=Object.values(metricSlots(row));return v.length?v.reduce((a,b)=>a+b,0)/v.length:0}
function metricPeriodRange(rows=[]){const dates=rows.map(metricDateValue).filter(d=>d&&d.getTime()).sort((a,b)=>a-b);if(!dates.length)return '—';return `${dates[0].toLocaleDateString('pt-BR')} a ${dates.at(-1).toLocaleDateString('pt-BR')}`}
function metricModeValue(values=[]){const counts=new Map();values.forEach(v=>counts.set(v,(counts.get(v)||0)+1));return [...counts.entries()].sort((a,b)=>b[1]-a[1]||b[0]-a[0])[0]?.[0]??'—'}
function metricSortRows(rows=[],mode='peak'){
 const out=[...rows];const name=x=>alvesNorm(`${x.f?.faccao||''} ${x.f?.group||''}`),seg=x=>alvesNorm(x.f?.segmento||'OUTROS');
 return out.sort((a,b)=>{if(mode==='peak')return b.a.peak.value-a.a.peak.value||b.a.avg-a.a.avg;if(mode==='predominance')return (b.a.predominance?.mid||0)-(a.a.predominance?.mid||0)||b.a.predominance?.share-a.a.predominance?.share;if(mode==='dailyPeakAvg')return b.a.dailyPeakAvg-a.a.dailyPeakAvg;if(mode==='avg')return b.a.avg-a.a.avg;if(mode==='segment')return seg(a).localeCompare(seg(b),'pt-BR')||name(a).localeCompare(name(b),'pt-BR');if(mode==='name')return name(a).localeCompare(name(b),'pt-BR');return b.a.avg-a.a.avg})
}
function metricCurrentScope(){return $('#metricScopeSelect')?.value||''}

function metricSelectedGroup(){return $('#metricFactionSelect')?.value||metricSummaryRows()[0]?.f?.group||''}
function syncMetricSelectors(){
 const rows=metricSummaryRows();const options=rows.map(x=>`<option value="${esc(x.f.group)}">${esc(x.f.faccao||x.f.group)} • ${esc(x.f.group)}${x.f.segmento?' • '+esc(x.f.segmento):''}</option>`).join('');
 const fs=$('#metricFactionSelect'),rg=$('#metricReportGroup'),scope=$('#metricScopeSelect');const keepF=fs?.value,keepR=rg?.value,keepScope=scope?.value;
 if(scope){scope.innerHTML='<option value="">GERAL • TODAS AS FACÇÕES</option>'+options;if(keepScope&&rows.some(x=>x.f.group===keepScope))scope.value=keepScope}
 if(fs){fs.innerHTML=options||'<option value="">SEM DADOS</option>';if(keepF&&rows.some(x=>x.f.group===keepF))fs.value=keepF}
 if(rg){const seg=$('#metricReportSegment')?.value||'';const filtered=rows.filter(x=>!seg||x.f.segmento===seg);rg.innerHTML=filtered.map(x=>`<option value="${esc(x.f.group)}">${esc(x.f.group)}${x.f.faccao?' • '+esc(x.f.faccao):''}</option>`).join('')||'<option value="">SEM DADOS</option>';if(keepR&&filtered.some(x=>x.f.group===keepR))rg.value=keepR}
 const rp=$('#metricReportPeriod');if(rp&&$('#metricPeriod')){const selected=rp.value||metricPeriodKey;rp.innerHTML=$('#metricPeriod').innerHTML;if([...rp.options].some(o=>o.value===selected))rp.value=selected}
}
function renderMetricFactionDetail(group=metricSelectedGroup()){
 const sum=$('#metricFactionSummary'),table=$('#metricFactionTable');if(!sum||!table)return;
 if(!group){sum.innerHTML='';table.innerHTML='<div class="placeholder"><h3>SEM DADOS</h3></div>';return}
 const a=metricAnalysis(group);if(!a){sum.innerHTML='';table.innerHTML='<div class="placeholder"><h3>SEM MÉTRICAS PARA ESTE GROUP</h3></div>';return}
 const id=metricIdentity(group,a.rows[0]);const keys=metricSlotKeys(a.rows),expected=a.rows.length*keys.length,filled=a.rows.reduce((n,r)=>n+Object.values(metricSlots(r)).filter(v=>Number.isFinite(v)).length,0);
 sum.innerHTML=`<article><span>FACÇÃO</span><b>${esc(id.faccao||'—')}</b><small>${esc(group)} • ${esc(id.segmento||'—')}</small></article><article><span>PICO</span><b>${a.peak.value}</b><small>${esc(a.peak.hour)} • ${esc(a.peak.date)}</small></article><article class="metric-predominance-card"><span>PREDOMINÂNCIA</span><b>${esc(a.predominance.label)}</b><small>${a.predominance.share.toFixed(0)}% das medições nessa faixa</small></article><article><span>MÉDIA DIÁRIA DE PICO</span><b>${a.dailyPeakAvg.toFixed(1)}</b><small>média do maior contingente de cada dia</small></article><article><span>MÉDIA GERAL</span><b>${a.avg.toFixed(1)}</b><small>todos os horários do período</small></article><article><span>MELHOR HORÁRIO</span><b>${esc(a.strongestHour)}</b><small>média ${a.strongestHourAvg.toFixed(1)} • noite ${esc(a.nightPredominance.label)}</small></article>`;
 table.innerHTML=`<div class="metric-date-table-title"><div><b>HISTÓRICO DIÁRIO</b><span>${esc(id.faccao||group)} • ${esc(metricActivePeriodLabel())} • ${filled}/${expected} coletas</span></div></div><div class="metric-table-scroll"><table class="metric-date-table"><thead><tr><th>DATA</th>${keys.map(h=>`<th>${esc(h)}</th>`).join('')}<th>PICO DO DIA</th><th>MÉDIA DO DIA</th></tr></thead><tbody>${a.rows.map(r=>{const sl=metricSlots(r),vals=Object.values(sl).filter(Number.isFinite),pk=vals.length?Math.max(...vals):'—';return `<tr><td><b>${esc(metricDateLabel(r))}</b></td>${keys.map(h=>`<td>${sl[h]??'—'}</td>`).join('')}<td><b>${pk}</b></td><td>${metricDayAverage(r).toFixed(1)}</td></tr>`}).join('')}</tbody></table></div>`;
}
function metricReportData(group,period=metricPeriodKey){
 const prev=metricPeriodKey;metricPeriodKey=period||prev;const a=metricAnalysis(group);metricPeriodKey=prev;if(!a)return null;const id=metricIdentity(group,a.rows[0]);const vals=a.rows.flatMap(r=>Object.values(metricSlots(r)));return {group,id,a,low:vals.length?Math.min(...vals):0,mode:metricModeValue(vals),range:metricPeriodRange(a.rows),period:period||prev};
}
function buildMetricReportHtml(data,printMode=false){
 if(!data)return '<div class="placeholder"><h3>SEM DADOS PARA O RELATÓRIO</h3></div>';const {group,id,a,low,mode,range,period}=data;
 return `<article class="monthly-report${printMode?' print-report':''}"><header><div><span>HIGH ROLEPLAY • CENTRAL DE MÉTRICAS</span><h2>RELATÓRIO MENSAL DE DESEMPENHO</h2><p>${esc(metricPeriodLabel(period))} • período ${esc(range)}</p></div><div class="report-badge">RH</div></header><section class="report-ident"><div><span>FACÇÃO</span><b>${esc(id.faccao||'—')}</b></div><div><span>GROUP</span><b>${esc(group)}</b></div><div><span>SEGMENTO</span><b>${esc(id.segmento||'—')}</b></div><div><span>QG</span><b>${esc(id.qg||'—')}</b></div><div><span>LÍDER</span><b>${esc(id.lider||'—')}</b></div></section><section class="report-kpis"><div><span>PICO</span><b>${a.peak.value}</b><small>${esc(a.peak.hour)} • ${esc(a.peak.date)}</small></div><div><span>PREDOMINÂNCIA</span><b>${esc(a.predominance.label)}</b><small>${a.predominance.share.toFixed(0)}% das medições</small></div><div><span>MÉDIA DIÁRIA DE PICO</span><b>${a.dailyPeakAvg.toFixed(1)}</b></div><div><span>MÉDIA GERAL</span><b>${a.avg.toFixed(1)}</b></div><div><span>MELHOR HORÁRIO</span><b>${esc(a.strongestHour)}</b><small>média ${a.strongestHourAvg.toFixed(1)}</small></div></section><section><h3>REGISTROS DIÁRIOS</h3><table><thead><tr><th>Data</th><th>14H</th><th>16H</th><th>21H</th><th>23H</th><th>Média</th></tr></thead><tbody>${a.rows.map(r=>{const sl=metricSlots(r);return `<tr><td>${esc(metricDateLabel(r))}</td><td>${sl['14H']??'—'}</td><td>${sl['16H']??'—'}</td><td>${sl['21H']??'—'}</td><td>${sl['23H']??'—'}</td><td>${metricDayAverage(r).toFixed(2)}</td></tr>`}).join('')}</tbody></table></section><footer>Gerado pelo High OS • ${new Date().toLocaleString('pt-BR')}</footer></article>`;
}
function renderMetricReport(){
 const group=$('#metricReportGroup')?.value||'',period=$('#metricReportPeriod')?.value||metricPeriodKey;const data=metricReportData(group,period);$('#metricReportPreview').innerHTML=buildMetricReportHtml(data);return data;
}
function printMetricReport(){
 const data=renderMetricReport();if(!data)return alert('Selecione uma facção com dados nesta competência.');const w=window.open('','_blank','width=1050,height=760');if(!w)return alert('O navegador bloqueou a janela de impressão.');w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Relatório ${esc(data.group)} - ${esc(metricPeriodLabel(data.period))}</title><style>body{font-family:Arial,sans-serif;color:#17131b;margin:32px}header{display:flex;justify-content:space-between;border-bottom:3px solid #6f25a7;padding-bottom:16px}header span,.report-ident span,.report-kpis span{font-size:10px;text-transform:uppercase;color:#716978}h2{margin:5px 0}.report-badge{font-size:24px;font-weight:900}.report-ident,.report-kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin:20px 0}.report-ident div,.report-kpis div{border:1px solid #ddd;border-radius:8px;padding:10px}.report-ident b,.report-kpis b{display:block;margin-top:5px}.report-kpis b{font-size:22px}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #ddd;padding:8px;text-align:center}th{background:#f2edf6}footer{margin-top:20px;font-size:10px;color:#777}@media print{body{margin:12mm}.no-print{display:none}}</style></head><body>${buildMetricReportHtml(data,true)}<script>window.onload=()=>window.print()<\/script></body></html>`);w.document.close();
}
function downloadMetricCsv(){
 const data=renderMetricReport();if(!data)return alert('Selecione uma facção com dados nesta competência.');const lines=[['Data','14H','16H','21H','23H','Media'],...data.a.rows.map(r=>{const s=metricSlots(r);return [metricDateLabel(r),s['14H'],s['16H'],s['21H'],s['23H'],metricDayAverage(r).toFixed(2).replace('.',',')]})];const csv='\ufeff'+lines.map(row=>row.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(';')).join('\r\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`metricas_${slug(data.group)}_${data.period}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}

function metricGroupKey(row){return alvesNorm(String(row?.group||row?.organizacao||row?.faccao||'')).replace(/\s+/g,'')}
function metricTimeMinutes(h){const m=String(h||'').toUpperCase().match(/(\d{1,2})(?::?(\d{2}))?/);return m?(+m[1]*60+(+m[2]||0)):9999}
function metricTimeline(rows=[]){
 const map=new Map();
 rows.forEach(r=>{const d=metricDateValue(r);if(!d||!d.getTime())return;const day=d.toISOString().slice(0,10);Object.entries(metricSlots(r)).forEach(([hour,val])=>{val=Number(val);if(!Number.isFinite(val))return;const key=day+'|'+hour;const cur=map.get(key)||{day,date:new Date(d),hour,total:0,count:0};cur.total+=val;cur.count++;map.set(key,cur)})});
 return [...map.values()].sort((a,b)=>a.date-b.date||metricTimeMinutes(a.hour)-metricTimeMinutes(b.hour));
}
function metricCalendarRange31(daily=[]){
 let start=null,end=null;
 if(metricDateStart||metricDateEnd){
  start=parseIsoMetricDate(metricDateStart)||daily[0]?.date||null;
  end=parseIsoMetricDate(metricDateEnd)||daily.at(-1)?.date||start;
 }else{
  const m=String(metricPeriodKey||currentMetricMonthKey()).match(/^(\d{4})-(\d{2})$/);
  if(m){start=new Date(+m[1],+m[2]-1,1);end=new Date(+m[1],+m[2],0)}
 }
 if(!start&&daily.length)start=new Date(daily[0].date);
 if(!end&&daily.length)end=new Date(daily.at(-1).date);
 if(!start||!end)return [];
 start=new Date(start.getFullYear(),start.getMonth(),start.getDate());
 end=new Date(end.getFullYear(),end.getMonth(),end.getDate());
 const by=new Map(daily.map(d=>[`${d.date.getFullYear()}-${String(d.date.getMonth()+1).padStart(2,'0')}-${String(d.date.getDate()).padStart(2,'0')}`,d]));
 const out=[];
 for(let d=new Date(start);d<=end&&out.length<31;d.setDate(d.getDate()+1)){
  const dd=new Date(d),key=`${dd.getFullYear()}-${String(dd.getMonth()+1).padStart(2,'0')}-${String(dd.getDate()).padStart(2,'0')}`;
  out.push({date:dd,data:by.get(key)||null});
 }
 // Em competência mensal, preserva sempre 31 posições para manter a leitura visual estável.
 if(!(metricDateStart||metricDateEnd)){
  while(out.length<31){
   const dd=new Date(start.getFullYear(),start.getMonth(),out.length+1);
   if(dd.getMonth()!==start.getMonth())out.push({date:null,data:null});else out.push({date:dd,data:by.get(`${dd.getFullYear()}-${String(dd.getMonth()+1).padStart(2,'0')}-${String(dd.getDate()).padStart(2,'0')}`)||null});
  }
 }
 return out;
}
function metricDailyBars(daily=[]){
 const cols=metricCalendarRange31(daily);if(!cols.length)return '<div class="metric-empty-chart">Sem dados suficientes para montar o gráfico.</div>';
 const values=cols.map(c=>c.data?.avg||0),max=Math.max(1,...values);
 return `<div class="metric-month-bars" role="img" aria-label="Contingente diário do período">${cols.map(c=>{
  if(!c.date)return `<div class="metric-month-col metric-month-empty"><div class="metric-month-value">—</div><div class="metric-month-track"><i style="height:0%"></i></div><b>—</b><span>—</span></div>`;
  const d=c.data,v=d?.avg||0,pct=d?Math.max(4,Math.min(100,v/max*100)):0,week=c.date.toLocaleDateString('pt-BR',{weekday:'short'}).replace('.','').toUpperCase(),day=String(c.date.getDate()).padStart(2,'0'),count=d?.vals?.length||0,tip=d?`${c.date.toLocaleDateString('pt-BR')} • ${count<4?'PARCIAL • ':''}${count}/4 coletas • média ${v.toFixed(1)} • pico ${d.peak.total} às ${d.peak.hour}`:`${c.date.toLocaleDateString('pt-BR')} • sem coleta`;
  return `<div class="metric-month-col${d?'':' metric-month-no-data'}" title="${esc(tip)}"><div class="metric-month-value">${d?v.toFixed(0)+(count<4?' P':''):'—'}</div><div class="metric-month-track"><i style="height:${pct}%"></i></div><b>${day}</b><span>${week}</span></div>`;
 }).join('')}</div>`;
}
function metricDailySummary(points=[]){
 const days=new Map();points.forEach(p=>{const a=days.get(p.day)||{date:p.date,vals:[],peak:p};a.vals.push(p.total);if(p.total>a.peak.total)a.peak=p;days.set(p.day,a)});
 return [...days.values()].map(d=>({date:d.date,vals:d.vals,avg:d.vals.reduce((a,b)=>a+b,0)/d.vals.length,peak:d.peak}));
}
function metricSegmentSummary(active=[]){
 const by=new Map();active.forEach(r=>{const id=metricIdentity(r.group||r.organizacao||r.faccao,r),seg=id.segmento||'OUTROS';if(!by.has(seg))by.set(seg,[]);by.get(seg).push(r)});
 return [...by.entries()].map(([segmento,rs])=>{const pts=metricTimeline(rs),vals=pts.map(p=>p.total);return {segmento,avg:vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0,peak:vals.length?Math.max(...vals):0}}).sort((a,b)=>b.avg-a.avg);
}

function metricScopeTitle(rows=[],seg=''){
 const scope=metricCurrentScope();if(scope){const x=rows.find(r=>r.f.group===scope)||metricSummaryRows().find(r=>r.f.group===scope);return x?`${x.f.faccao||x.f.group} • ${x.f.group}`:scope}
 return seg?`${seg} • GERAL`:'GERAL ILEGAL';
}
function metricAggregateDays(raw=[]){
 const by=new Map();raw.forEach(r=>{const d=metricDateValue(r);if(!d||!d.getTime())return;const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;if(!by.has(key))by.set(key,{key,date:new Date(d.getFullYear(),d.getMonth(),d.getDate()),slots:{},groups:{}});const x=by.get(key),g=String(r.group||r.organizacao||r.faccao||'');const sl=metricSlots(r);x.groups[g]=sl;Object.entries(sl).forEach(([h,v])=>{if(Number.isFinite(Number(v)))x.slots[h]=(x.slots[h]||0)+Number(v)})});return [...by.values()].sort((a,b)=>a.date-b.date)
}
function metricWeekBounds(date=new Date()){const d=new Date(date.getFullYear(),date.getMonth(),date.getDate()),dow=(d.getDay()+6)%7;const start=new Date(d);start.setDate(d.getDate()-dow);const end=new Date(start);end.setDate(start.getDate()+6);return {start,end}}
function metricFmtDay(d){return d.toLocaleDateString('pt-BR',{weekday:'short'}).replace('.','').toUpperCase()+` ${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`}
function metricDailyCard(day,title){const hours=['14H','16H','21H','23H'],collected=hours.filter(h=>Number.isFinite(day?.slots?.[h])),vals=collected.map(h=>day.slots[h]),peak=vals.length?Math.max(...vals):null,avg=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null,pending=4-collected.length,status=!day||!collected.length?'SEM COLETA':pending?`PARCIAL • ${collected.length}/4 COLETAS • AGUARDANDO ${pending}`:'4/4 COLETAS • DIA COMPLETO';return `<section class="metric-daily-card"><header><div><span>${esc(title)}</span><h3>${day?esc(day.date.toLocaleDateString('pt-BR')):'SEM COLETA'}</h3><em class="metric-partial-status ${pending?'partial':'complete'}">${status}</em></div><div><small>PICO</small><b>${peak??'—'}</b></div><div><small>MÉDIA PARCIAL</small><b>${avg===null?'—':avg.toFixed(1)}</b></div></header><div class="metric-hour-grid">${hours.map(h=>`<div class="metric-hour-cell ${day&&Number.isFinite(day.slots[h])?'collected':'waiting'}"><span>${h.replace('H',':00')}</span><b>${day&&Number.isFinite(day.slots[h])?day.slots[h]:'—'}</b><small>${day&&Number.isFinite(day.slots[h])?'ONLINE':'AGUARDANDO COLETA'}</small></div>`).join('')}</div></section>`}
function metricWeekSvg(days=[]){const hours=['14H','16H','21H','23H'],all=days.flatMap(d=>hours.map(h=>d.slots[h]).filter(Number.isFinite)),max=Math.max(1,...all);const W=920,H=250,pad=38,step=days.length>1?(W-pad*2)/(days.length-1):0;const y=v=>H-pad-(v/max)*(H-pad*2);const lines=hours.map((h,idx)=>{const pts=days.map((d,i)=>Number.isFinite(d.slots[h])?`${pad+i*step},${y(d.slots[h]).toFixed(1)}`:null);let segs=[],cur=[];pts.forEach(p=>{if(p)cur.push(p);else if(cur.length){segs.push(cur);cur=[]}});if(cur.length)segs.push(cur);return `<g class="metric-line line-${idx}">${segs.map(s=>s.length>1?`<polyline points="${s.join(' ')}"/>`:'' ).join('')}${days.map((d,i)=>Number.isFinite(d.slots[h])?`<circle cx="${pad+i*step}" cy="${y(d.slots[h]).toFixed(1)}" r="4"><title>${metricFmtDay(d.date)} • ${h} • ${d.slots[h]} online</title></circle>`:'').join('')}</g>`}).join('');return `<svg class="metric-week-svg" viewBox="0 0 ${W} ${H}" role="img">${[0,.25,.5,.75,1].map(t=>`<line x1="${pad}" x2="${W-pad}" y1="${y(max*t)}" y2="${y(max*t)}" class="metric-grid-line"/><text x="4" y="${y(max*t)+4}" class="metric-axis-text">${Math.round(max*t)}</text>`).join('')}${lines}</svg>`}
function renderMetricIntelligence(rows=[],raw=[],seg=''){
 const daily=$('#metricDailyIntel'),weekly=$('#metricWeeklyIntel');if(!daily||!weekly)return;const days=metricAggregateDays(raw),title=metricScopeTitle(rows,seg),today=new Date(),todayKey=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`,todayDay=days.find(d=>d.key===todayKey)||{key:todayKey,date:new Date(today.getFullYear(),today.getMonth(),today.getDate()),slots:{},groups:{}};daily.innerHTML=metricDailyCard(todayDay,title);
 const wb=metricWeekBounds(today);const week=[];for(let i=0;i<7;i++){const d=new Date(wb.start);d.setDate(wb.start.getDate()+i);const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;week.push(days.find(x=>x.key===k)||{key:k,date:d,slots:{},groups:{}})};const hours=['14H','16H','21H','23H'];weekly.innerHTML=`<section class="metric-week-card"><header><div><span>SEMANA • ${esc(title)}</span><h3>${wb.start.toLocaleDateString('pt-BR')} — ${wb.end.toLocaleDateString('pt-BR')}</h3></div><div class="metric-week-legend">${hours.map((h,i)=>`<span class="l-${i}"><i></i>${h}</span>`).join('')}</div></header>${metricWeekSvg(week)}<div class="metric-week-days">${week.map(d=>`<button type="button" data-metric-day="${d.key}"><b>${metricFmtDay(d.date)}</b><small>${hours.map(h=>Number.isFinite(d.slots[h])?`${h} ${d.slots[h]}`:`${h} —`).join(' • ')}</small></button>`).join('')}</div></section>`;weekly.querySelectorAll('[data-metric-day]').forEach(b=>b.onclick=()=>{metricDateStart=b.dataset.metricDay;metricDateEnd=b.dataset.metricDay;syncMetricDateInputs();renderMetrics()})
}
function metricDailyReportText(){const seg=$('#metricSegment')?.value||'',scope=metricCurrentScope(),rows=metricSummaryRows().filter(x=>(!seg||x.f.segmento===seg)&&(!scope||x.f.group===scope)),keys=new Set(rows.map(x=>alvesNorm(x.f.group))),raw=activeMetricRows().filter(r=>keys.has(alvesNorm(r.group||r.organizacao||r.faccao))),days=metricAggregateDays(raw),day=days.at(-1);if(!day)return 'Sem métricas para o recorte atual.';const hours=['14H','16H','21H','23H'];let txt=`HIGH OS • RELATÓRIO DIÁRIO\n${metricScopeTitle(rows,seg)}\n${day.date.toLocaleDateString('pt-BR')}\n\n`;hours.forEach(h=>txt+=`${h.replace('H',':00')} - ${Number.isFinite(day.slots[h])?day.slots[h]+' ONLINE':'NÃO COLETADO'}\n`);const ranking=Object.entries(day.groups).map(([g,slots])=>({g,total:hours.reduce((s,h)=>s+(Number.isFinite(slots[h])?slots[h]:0),0),latest:[...hours].reverse().find(h=>Number.isFinite(slots[h]))})).sort((a,b)=>b.total-a.total);txt+='\nFACÇÕES / GROUPS\n'+ranking.map(x=>`${x.g} - ${x.latest?day.groups[x.g][x.latest]+' ('+x.latest+')':'—'}`).join('\n');return txt}
function printMetricDailyReport(){const text=metricDailyReportText();const w=window.open('','_blank','width=850,height=720');if(!w)return alert('Pop-up bloqueado.');w.document.write(`<pre style="font:14px/1.55 Arial;padding:28px;white-space:pre-wrap">${esc(text)}</pre><script>window.onload=()=>window.print()<\/script>`);w.document.close()}

function renderMetricExecutiveVisuals(rows,visibleRaw,seg){
 const box=$('#metricVisuals');if(!box)return;const pts=metricTimeline(visibleRaw),daily=metricDailySummary(pts),segs=metricSegmentSummary(activeMetricRows()),peak=pts.reduce((a,p)=>!a||p.total>a.total?p:a,null),avg=pts.length?pts.reduce((a,p)=>a+p.total,0)/pts.length:0;
 const maxSeg=Math.max(1,...segs.map(x=>x.avg));
 box.innerHTML=`<section class="metric-exec-chart metric-chart-card"><div class="metric-chart-head"><div><b>CONTINGENTE ${seg?'DO SEGMENTO '+esc(seg):'GERAL DO ILEGAL'}</b><span>MÉDIA DIÁRIA DO PERÍODO • 31 COLUNAS • ALTURA PROPORCIONAL AO CONTINGENTE</span></div><div class="metric-chart-mini"><strong>${avg.toFixed(1)}</strong><small>MÉDIA</small><strong>${peak?peak.total:'—'}</strong><small>PICO${peak?' • '+esc(peak.hour):''}</small></div></div>${metricDailyBars(daily)}<div class="metric-chart-hint">Cada coluna representa um dia. Passe o mouse para ver média, pico e horário do pico.</div></section>
 <section class="metric-chart-card metric-segment-card"><div class="metric-chart-head"><b>CONTINGENTE POR SEGMENTO</b><span>MÉDIA CONSOLIDADA DO PERÍODO</span></div><div class="metric-segment-bars">${segs.map(x=>`<div class="metric-segment-row"><span>${esc(x.segmento)}</span><div><i style="width:${Math.max(3,x.avg/maxSeg*100)}%"></i></div><b>${x.avg.toFixed(1)}</b><small>pico ${x.peak}</small></div>`).join('')}</div></section>
 <section class="metric-chart-card"><div class="metric-chart-head"><b>LEITURA DO RECORTE</b><span>${esc(metricActivePeriodLabel())}</span></div><div class="metric-quick-grid"><div><span>COLETAS</span><b>${pts.length}</b></div><div><span>DIAS</span><b>${daily.length}</b></div><div><span>GROUPS</span><b>${rows.length}</b></div><div><span>PICO GERAL</span><b>${peak?peak.total:'—'}</b><small>${peak?peak.date.toLocaleDateString('pt-BR')+' • '+peak.hour:'—'}</small></div></div></section>`;
}
function metricSortLabel(mode='peak'){return {peak:'PICO',predominance:'PREDOMINÂNCIA',dailyPeakAvg:'MÉDIA DIÁRIA DE PICO',avg:'MÉDIA GERAL',segment:'SEGMENTO',name:'FACÇÃO / GROUP'}[mode]||'PICO'}
function metricMainSortValue(x,mode='peak'){
 if(mode==='peak')return String(x.a.peak.value);if(mode==='predominance')return x.a.predominance.label;if(mode==='dailyPeakAvg')return x.a.dailyPeakAvg.toFixed(1);if(mode==='avg')return x.a.avg.toFixed(1);if(mode==='segment')return x.f.segmento||'—';if(mode==='name')return x.f.faccao||x.f.group;return String(x.a.peak.value)
}
function renderMetricQuickRanking(rows=[],mode='peak'){
 const box=$('#metricQuickRanking');if(!box)return;if(!rows.length){box.innerHTML='';return}const label=metricSortLabel(mode);
 box.innerHTML=`<div class="metric-quick-ranking-head"><b>CLASSIFICAÇÃO • ${esc(label)}</b><span>Clique em uma facção para abrir a análise individual</span></div><div class="metric-quick-ranking-list">${rows.map((x,i)=>`<button class="metric-quick-row" data-metric-group="${esc(x.f.group)}"><strong>#${i+1}</strong><div><b>${esc(x.f.faccao||x.f.group)}</b><small>${esc(x.f.group)} • ${esc(x.f.segmento||'—')}</small></div><span class="metric-main-value">${esc(metricMainSortValue(x,mode))}</span><span class="metric-hide-mobile">Pico <b>${x.a.peak.value}</b></span><span class="metric-hide-mobile">Pred. <b>${esc(x.a.predominance.label)}</b></span></button>`).join('')}</div>`;
}
function renderMetrics(err=null){
 const box=$('#metricRanking');if(err instanceof Event)err=null;
 const q=alvesNorm($('#metricSearch')?.value||''),seg=$('#metricSegment')?.value||'';
 const scope=metricCurrentScope(),sortMode=$('#metricSortMode')?.value||'peak';let rows=metricSummaryRows().filter(x=>(!seg||x.f.segmento===seg)&&(!scope||x.f.group===scope)&&(!q||alvesNorm([x.f.group,x.f.faccao,x.f.qg].join(' ')).includes(q)));rows=metricSortRows(rows,sortMode);
 const active=activeMetricRows(),groupsWith=new Set(active.map(m=>alvesNorm(m.group||m.organizacao||m.faccao))).size;
 const groupKeys=new Set(rows.map(x=>alvesNorm(x.f.group))),visibleRaw=active.filter(m=>groupKeys.has(alvesNorm(m.group||m.organizacao||m.faccao)));
 const slotTotals=Object.fromEntries(metricSlotKeys(visibleRaw).map(h=>[h,[]]));visibleRaw.forEach(r=>{const sl=metricSlots(r);Object.entries(sl).forEach(([h,v])=>{if(!slotTotals[h])slotTotals[h]=[];slotTotals[h].push(v)})});
 const hourAvgs=Object.fromEntries(Object.entries(slotTotals).map(([h,a])=>[h,a.length?a.reduce((x,y)=>x+y,0)/a.length:0]));
 const allValues=visibleRaw.flatMap(r=>Object.values(metricSlots(r))),overall=allValues.length?allValues.reduce((a,b)=>a+b,0)/allValues.length:0;
 const top=rows[0]||null,peak=rows.reduce((best,x)=>!best||x.a.peak.value>best.a.peak.value?x:best,null);const pred=Object.entries(hourAvgs).sort((a,b)=>b[1]-a[1])[0]||['—',0];
 const selected=scope?rows[0]:null;const generalPred=metricPredominanceRange(allValues),dailyPeaksAll=visibleRaw.map(r=>{const v=Object.values(metricSlots(r)).filter(Number.isFinite);return v.length?Math.max(...v):null}).filter(Number.isFinite),dailyPeakOverall=dailyPeaksAll.length?dailyPeaksAll.reduce((a,b)=>a+b,0)/dailyPeaksAll.length:0;if($('#metricOverview'))$('#metricOverview').innerHTML=selected?`<article class="metric-hero-kpi"><span>FACÇÃO / GROUP</span><b>${esc(selected.f.faccao||selected.f.group)}</b><small>${esc(selected.f.group)} • ${esc(selected.f.segmento||'—')}</small></article><article class="metric-hero-kpi"><span>PICO</span><b>${selected.a.peak.value}</b><small>${esc(selected.a.peak.hour)} • ${esc(selected.a.peak.date)}</small></article><article class="metric-hero-kpi metric-predominance-card"><span>PREDOMINÂNCIA</span><b>${esc(selected.a.predominance.label)}</b><small>${selected.a.predominance.share.toFixed(0)}% das medições</small></article><article class="metric-hero-kpi"><span>MÉDIA DIÁRIA DE PICO</span><b>${selected.a.dailyPeakAvg.toFixed(1)}</b><small>média geral ${selected.a.avg.toFixed(1)} • melhor ${esc(selected.a.strongestHour)}</small></article>`:`<article class="metric-hero-kpi"><span>VISÃO GERAL</span><b>${rows.length}</b><small>facções / Groups no recorte</small></article><article class="metric-hero-kpi"><span>MAIOR PICO</span><b>${peak?peak.a.peak.value:'—'}</b><small>${peak?`${esc(peak.f.group)} • ${esc(peak.a.peak.hour)}`:'sem dados'}</small></article><article class="metric-hero-kpi metric-predominance-card"><span>PREDOMINÂNCIA GERAL</span><b>${esc(generalPred.label)}</b><small>${generalPred.share.toFixed(0)}% das medições</small></article><article class="metric-hero-kpi"><span>MÉDIA DIÁRIA DE PICO</span><b>${dailyPeakOverall.toFixed(1)}</b><small>média geral ${overall.toFixed(1)} • horário forte ${esc(pred[0])}</small></article>`;
 $('#metricStats').innerHTML=`<span><b>${esc(metricActivePeriodLabel())}</b> COMPETÊNCIA</span><span><b>${esc(metricPeriodRange(active))}</b> PERÍODO</span><span><b>${active.length}</b> DIAS / REGISTROS</span><span><b>${groupsWith}</b> GROUPS COM DADOS</span><span><b>${rows.length}</b> EXIBIDOS</span>${seg?`<span>SEGMENTO <b>${esc(seg)}</b></span>`:''}`;
 const maxHour=Math.max(1,...Object.values(hourAvgs)),top5=rows.slice(0,5),maxTop=Math.max(1,...top5.map(x=>x.a.avg));
 const advanced=rows.map(x=>({...x,adv:metricAdvancedStats(x.f.group)})).filter(x=>x.adv);
 const rising=[...advanced].filter(x=>x.adv.trend>0).sort((a,b)=>b.adv.trend-a.adv.trend).slice(0,4);
 const falling=[...advanced].filter(x=>x.adv.trend<0).sort((a,b)=>a.adv.trend-b.adv.trend).slice(0,4);
 const attention=[...advanced].filter(x=>x.adv.alerts.length).sort((a,b)=>a.adv.trend-b.adv.trend).slice(0,5);
 const movement=(list,empty)=>list.length?list.map(x=>`<div class="metric-move-row"><div><b>${esc(x.f.faccao||x.f.group)}</b><small>${esc(x.f.group)} • média ${x.a.avg.toFixed(1)}</small></div><strong>${x.adv.trend>=0?'+':''}${x.adv.trend.toFixed(0)}%</strong></div>`).join(''):`<div class="muted">${empty}</div>`;
 renderMetricIntelligence(rows,visibleRaw,seg);
 renderMetricExecutiveVisuals(rows,visibleRaw,seg);
 if(err){
  if($('#metricOverview'))$('#metricOverview').innerHTML=`<div class="placeholder"><h3>ERRO AO CARREGAR</h3><p>${esc(err.message||String(err))}</p></div>`;
  if($('#metricStats'))$('#metricStats').innerHTML='';
  if($('#metricVisuals'))$('#metricVisuals').innerHTML='';if($('#metricQuickRanking'))$('#metricQuickRanking').innerHTML='';
  return
 }
 if(!rows.length){
  if($('#metricOverview'))$('#metricOverview').innerHTML=`<div class="placeholder"><b>▥</b><h3>SEM MÉTRICAS EM ${esc(metricPeriodLabel(metricPeriodKey).toUpperCase())}</h3><p>Não há dados para os filtros atuais. O High OS não mistura competências.</p></div>`;
  if($('#metricStats'))$('#metricStats').innerHTML='';
  if($('#metricVisuals'))$('#metricVisuals').innerHTML='';if($('#metricQuickRanking'))$('#metricQuickRanking').innerHTML='';
  syncMetricSelectors();renderMetricFactionDetail();if($('#metricViewRanking')?.classList.contains('active'))renderMetricAdvancedRanking();return
 }
 // V8.4: a classificação rápida também fica na Visão Geral e respeita o critério escolhido.
 if(box)box.innerHTML='';
 renderMetricQuickRanking(rows,sortMode);
 syncMetricSelectors();renderMetricFactionDetail();if($('#metricViewRanking')?.classList.contains('active'))renderMetricAdvancedRanking();if($('#metricViewComparatives')?.classList.contains('active')){syncMetricCompareSelectors();renderMetricComparison()}
}
function metricAdvancedStats(group){
 const a=metricAnalysis(group);if(!a)return null;const dayAvgs=a.rows.map(metricDayAverage),slots=Object.fromEntries(metricSlotKeys(a.rows).map(h=>[h,[]]));a.rows.forEach(r=>{const x=metricSlots(r);Object.keys(x).forEach(h=>{if(!slots[h])slots[h]=[];slots[h].push(Number(x[h])||0)})});
 const hourAvg=Object.fromEntries(Object.entries(slots).map(([h,v])=>[h,v.length?v.reduce((x,y)=>x+y,0)/v.length:0]));
 const threshold=a.avg*.8,regularDays=dayAvgs.filter(v=>v>=threshold).length,regularity=dayAvgs.length?regularDays/dayAvgs.length*100:0;
 const recent=dayAvgs.slice(-5),prior=dayAvgs.slice(-10,-5),av=v=>v.length?v.reduce((x,y)=>x+y,0)/v.length:0;const recentAvg=av(recent),priorAvg=av(prior);const trend=priorAvg?((recentAvg-priorAvg)/priorAvg*100):0;
 const alerts=[];if(prior.length>=3&&trend<=-20)alerts.push(`⚠ Queda de ${Math.abs(trend).toFixed(0)}% na média dos últimos dias.`);if(prior.length>=3&&trend>=15)alerts.push(`▲ Crescimento de ${trend.toFixed(0)}% na média dos últimos dias.`);
 const weak=Object.entries(hourAvg).sort((x,y)=>x[1]-y[1])[0],strong=Object.entries(hourAvg).sort((x,y)=>y[1]-x[1])[0];if(weak&&strong&&strong[1]>0&&weak[1]<strong[1]*.7)alerts.push(`⚠ ${weak[0]} está ${((1-weak[1]/strong[1])*100).toFixed(0)}% abaixo do horário mais forte (${strong[0]}).`);
 return {...a,hourAvg,regularity,trend,recentAvg,priorAvg,alerts};
}
function renderMetricAdvancedRanking(){
 const box=$('#metricAdvancedRanking');if(!box)return;const mode=$('#metricRankingMode')?.value||'peak',seg=$('#metricSegment')?.value||'',scope=metricCurrentScope();let rows=metricSummaryRows().filter(x=>(!seg||x.f.segmento===seg)&&(!scope||x.f.group===scope)).map(x=>({...x,x:metricAdvancedStats(x.f.group)})).filter(x=>x.x);
 rows=metricSortRows(rows.map(r=>({...r,a:r.x})),mode).map(r=>({...r,x:r.a}));if(mode==='regularity')rows.sort((a,b)=>b.x.regularity-a.x.regularity);
 const label={peak:'PICO',predominance:'PREDOMINÂNCIA',dailyPeakAvg:'MÉDIA PICO/DIA',avg:'MÉDIA GERAL',segment:'SEGMENTO',name:'FACÇÃO / GROUP',regularity:'REGULARIDADE'}[mode]||'CLASSIFICAÇÃO';
 box.innerHTML=rows.length?`<div class="rh-ranking-row"><b>#</b><b>FACÇÃO / GROUP</b><span>${label}</span><span class="rh-extra">PICO</span><span class="rh-extra">PREDOM.</span><span class="rh-extra">MÉDIA PICO/DIA</span></div>${rows.map((r,i)=>{const main=mode==='peak'?r.x.peak.value:mode==='predominance'?r.x.predominance.label:mode==='dailyPeakAvg'?r.x.dailyPeakAvg.toFixed(1):mode==='avg'?r.x.avg.toFixed(1):mode==='segment'?r.f.segmento||'—':mode==='name'?r.f.faccao||r.f.group:r.x.regularity.toFixed(0)+'%';return `<div class="rh-ranking-row"><b>${i+1}</b><div><strong>${esc(r.f.faccao||r.f.group)}</strong><small style="display:block">${esc(r.f.group)} • ${esc(r.f.segmento||'—')}</small></div><span><b>${esc(main)}</b></span><span class="rh-extra">${r.x.peak.value}</span><span class="rh-extra metric-rank-pred"><b>${esc(r.x.predominance.label)}</b><small>${r.x.predominance.share.toFixed(0)}%</small></span><span class="rh-extra">${r.x.dailyPeakAvg.toFixed(1)}</span></div>`}).join('')}`:'<div class="placeholder"><h3>SEM DADOS</h3></div>';
}
function syncMetricCompareSelectors(){const rows=metricSummaryRows(),opts=rows.map(x=>`<option value="${esc(x.f.group)}">${esc(x.f.faccao||x.f.group)} • ${esc(x.f.group)}</option>`).join('');const a=$('#metricCompareA'),b=$('#metricCompareB');if(a&&!a.options.length)a.innerHTML=opts;if(b&&!b.options.length){b.innerHTML=opts;if(b.options.length>1)b.selectedIndex=1}}
function renderMetricComparison(){
 const ga=$('#metricCompareA')?.value,gb=$('#metricCompareB')?.value,box=$('#metricCompareResult');if(!box||!ga||!gb)return;const a=metricAdvancedStats(ga),b=metricAdvancedStats(gb);if(!a||!b){box.innerHTML='<div class="placeholder"><h3>SEM DADOS PARA COMPARAR</h3></div>';return}const ia=metricIdentity(ga,a.rows[0]),ib=metricIdentity(gb,b.rows[0]);
 const rows=[['Média mensal',a.avg.toFixed(2),b.avg.toFixed(2)],['Pico',a.peak.value,b.peak.value],['Regularidade',a.regularity.toFixed(0)+'%',b.regularity.toFixed(0)+'%'],['Tendência últimos dias',(a.trend>=0?'+':'')+a.trend.toFixed(0)+'%',(b.trend>=0?'+':'')+b.trend.toFixed(0)+'%'],...['14H','16H','21H','23H'].map(h=>['Média '+h,a.hourAvg[h].toFixed(2),b.hourAvg[h].toFixed(2)])];
 box.innerHTML=`<div class="rh-grid"><div class="rh-card"><span>FACÇÃO A</span><b>${esc(ia.faccao||ga)}</b><small>${esc(ga)}</small></div><div class="rh-card"><span>FACÇÃO B</span><b>${esc(ib.faccao||gb)}</b><small>${esc(gb)}</small></div><div class="rh-card"><span>DIFERENÇA DE MÉDIA</span><b>${Math.abs(a.avg-b.avg).toFixed(2)}</b><small>${a.avg>=b.avg?esc(ia.faccao||ga):esc(ib.faccao||gb)} à frente</small></div><div class="rh-card"><span>COMPETÊNCIA</span><b>${esc(metricActivePeriodLabel())}</b></div></div><table class="rh-compare-table"><thead><tr><th>INDICADOR</th><th>${esc(ia.faccao||ga)}</th><th>${esc(ib.faccao||gb)}</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r[0]}</td><td><b>${r[1]}</b></td><td><b>${r[2]}</b></td></tr>`).join('')}</tbody></table>`;
}
function renderRhFactionInsights(group){const sum=$('#metricFactionSummary');if(!sum||!group)return;const x=metricAdvancedStats(group);if(!x)return;const extra=document.createElement('div');extra.className='rh-insights';extra.innerHTML=`<div class="rh-grid"><div class="rh-card"><span>PREDOMINÂNCIA GERAL</span><b>${esc(x.predominance.label)}</b><small>${x.predominance.share.toFixed(0)}% das medições</small></div><div class="rh-card"><span>PREDOMINÂNCIA NOTURNA</span><b>${esc(x.nightPredominance.label)}</b><small>21H em diante</small></div>${Object.entries(x.hourAvg).map(([h,v])=>`<div class="rh-card"><span>MÉDIA ${h}</span><b>${v.toFixed(1)}</b></div>`).join('')}<div class="rh-card"><span>REGULARIDADE</span><b>${x.regularity.toFixed(0)}%</b><small>dias ≥ 80% da média geral</small></div><div class="rh-card"><span>TENDÊNCIA</span><b>${x.trend>=0?'+':''}${x.trend.toFixed(0)}%</b><small>últimos 5 dias vs. 5 anteriores</small></div></div>${x.alerts.length?`<div>${x.alerts.map(a=>`<div class="rh-alert">${esc(a)}</div>`).join('')}</div>`:'<div class="rh-alert">Sem alertas estatísticos relevantes no período.</div>'}`;sum.after(extra)}

const _renderMetricFactionDetailBase=renderMetricFactionDetail;
renderMetricFactionDetail=function(group=metricSelectedGroup()){document.querySelector('.rh-insights')?.remove();_renderMetricFactionDetailBase(group);renderRhFactionInsights(group)};
function switchMetricCenterView(view='overview'){
 document.querySelectorAll('.metric-center-tab').forEach(b=>b.classList.toggle('active',b.dataset.metricView===view));document.querySelectorAll('.metric-center-view').forEach(v=>v.classList.toggle('active',v.id===`metricView${view[0].toUpperCase()+view.slice(1)}`));if(view==='faction')renderMetricFactionDetail();if(view==='ranking')renderMetricAdvancedRanking();if(view==='comparatives'){syncMetricCompareSelectors();renderMetricComparison()}if(view==='reports')syncMetricSelectors();
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
$('#metricReportSegment')?.addEventListener('change',syncMetricSelectors);$('#metricReportPreviewBtn')?.addEventListener('click',renderMetricReport);$('#metricReportPrintBtn')?.addEventListener('click',printMetricReport);$('#metricReportCsvBtn')?.addEventListener('click',downloadMetricCsv);

function parseMetricImport(text=''){
 const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);if(!lines.length)return [];
 const split=x=>x.includes('\t')?x.split('\t').map(v=>v.trim()):x.split(';').map(v=>v.trim());
 const first=split(lines[0]),headerIsNamed=alvesNorm(first[0])==='group'&&alvesNorm(first[1])==='data';let slots=[];let start=0;
 if(headerIsNamed){slots=first.slice(2).map(normalizeMetricSlotKey);start=1}
 else if(first.length>=6){slots=['14H','16H','21H','23H']}
 const out=[];
 for(let i=start;i<lines.length;i++){const p=split(lines[i]);if(p.length<4)continue;const group=p[0],data=normalizeMetricDate(p[1])||p[1];if(!group||!data)continue;
  if(headerIsNamed||p.length>4){const use=headerIsNamed?slots:(p.length===6?['14H','16H','21H','23H']:p.slice(2,-1).map(normalizeMetricSlotKey));const obj={};use.forEach((h,j)=>{if(!h)return;const n=parseMetricNumber(p[j+2]);if(n!==null)obj[h]=n});if(Object.keys(obj).length)out.push({group,data,slots:obj})}
  else{const h=normalizeMetricSlotKey(p[2]),n=parseMetricNumber(p[3]);if(h&&n!==null)out.push({group,data,slots:{[h]:n}})}
 }
 const merged=new Map();out.forEach(r=>{const k=alvesNorm(r.group).replace(/\s+/g,'')+'|'+r.data;if(!merged.has(k))merged.set(k,{group:r.group,data:r.data,slots:{}});Object.assign(merged.get(k).slots,r.slots)});return [...merged.values()];
}
async function saveMetricImport(){
 const rows=parseMetricImport($('#metricImportText')?.value||'');if(!rows.length){alert('Nenhuma linha válida. Use um cabeçalho como: Group;Data;18:00;18:30;19:00;...');return}
 try{const batch=writeBatch(db);rows.forEach(r=>{const existing=metricas.find(x=>alvesNorm(x.group||'')===alvesNorm(r.group)&&normalizeMetricDate(x.data||x.date)===normalizeMetricDate(r.data));r={...r,slots:{...metricSlots(existing||{}),...r.slots}};r=metricSnapshot(r);const id=(r.group+'_'+r.data).replace(/[^a-zA-Z0-9_-]/g,'_');batch.set(doc(db,'highos','data','metricas',id),{...r,updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true})});await batch.commit();await addDoc(histCol,{sessionId:currentSessionId||'',tipo:'IMPORTACAO_METRICAS',descricao:`${rows.length} registro(s) importado(s) com horários flexíveis`,usuario:currentUser.email,data:serverTimestamp()});$('#metricImportModal')?.classList.add('hidden');$('#metricImportText').value='';await loadMetrics();alert(`${rows.length} registro(s) importado(s). Os horários adicionais foram preservados.`)}catch(e){alert('Erro ao importar métricas: '+e.message)}
}

$('#metricSearch')?.addEventListener('input',()=>renderMetrics());$('#metricPeriod')?.addEventListener('change',e=>{metricDateStart='';metricDateEnd='';syncMetricDateInputs();metricPeriodKey=e.target.value||currentMetricMonthKey();renderMetrics();syncMetricSelectors()});
$('#metricApplyRange')?.addEventListener('click',()=>{metricDateStart=$('#metricDateStart')?.value||'';metricDateEnd=$('#metricDateEnd')?.value||'';if(metricDateStart&&metricDateEnd&&metricDateStart>metricDateEnd)return alert('A data inicial não pode ser maior que a data final.');renderMetrics();syncMetricSelectors();renderMetricFactionDetail();});
document.querySelectorAll('.metric-period-shortcuts button').forEach(btn=>btn.addEventListener('click',()=>{const now=new Date();let a=new Date(now.getFullYear(),now.getMonth(),now.getDate()),b=new Date(a);if(btn.dataset.currentMonth)a=new Date(now.getFullYear(),now.getMonth(),1);else a.setDate(a.getDate()-(Number(btn.dataset.days)||1)+1);const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;metricDateStart=iso(a);metricDateEnd=iso(b);syncMetricDateInputs();renderMetrics();syncMetricSelectors();renderMetricFactionDetail()}));$('#metricSegment')?.addEventListener('change',()=>{renderMetrics();if($('#metricViewRanking')?.classList.contains('active'))renderMetricAdvancedRanking()});$('#metricReportPeriod')?.addEventListener('change',()=>{});$('#openMetricImportBtn')?.addEventListener('click',()=>$('#metricImportModal')?.classList.remove('hidden'));$('#metricImportClose')?.addEventListener('click',()=>$('#metricImportModal')?.classList.add('hidden'));$('#metricImportModal')?.addEventListener('click',e=>{if(e.target.id==='metricImportModal')e.currentTarget.classList.add('hidden')});$('#metricImportSave')?.addEventListener('click',saveMetricImport);

function openMetricSource(){
 const out=$('#metricSourceTestResult');
 if($('#metricSourceUrl'))$('#metricSourceUrl').value=metricSourceConfig.url||'';
 if($('#metricSourceSheet'))$('#metricSourceSheet').value=metricSourceConfig.sheet||'';
 if($('#metricAutoSync')){$('#metricAutoSync').checked=true;$('#metricAutoSync').disabled=true}
 if(out)out.innerHTML='<b>SINCRONIZAÇÃO GRATUITA VIA GOOGLE APPS SCRIPT</b><br>A planilha envia as métricas automaticamente ao Firestore às 14:05, 16:05, 21:05 e 23:05. Não usa Cloud Functions nem plano Blaze.';
 $('#metricSourceModal')?.classList.remove('hidden');
}
async function testMetricSource(){
 const out=$('#metricSourceTestResult');if(out)out.textContent='Atualizando os dados já sincronizados no Firestore...';
 try{await loadMetrics();if(out)out.innerHTML=`<b>CENTRAL ONLINE</b> • ${metricas.length} registro(s) históricos disponíveis no Firestore.`}catch(e){if(out)out.textContent='Falha: '+e.message}
}
async function refreshMetricServerConfig(){
 try{const snap=await getDoc(metricConfigDoc);if(snap.exists())metricSourceConfig={...metricSourceConfig,...snap.data()};renderMetricSourceStatus()}catch(e){}
}
async function requestServerMetricSync({quiet=false}={}){
 const btn=$('#syncMetricBtn'),old=btn?.textContent;if(btn){btn.disabled=true;btn.textContent='ATUALIZANDO...'}
 try{await refreshMetricServerConfig();await loadMetrics();if(!quiet)alert(`Central atualizada. ${metricas.length} registro(s) carregado(s) do Firestore. A sincronização da planilha é automática pelo Apps Script.`);return true}catch(e){if(!quiet)alert('Erro ao atualizar a Central: '+(e.message||e));return false}finally{if(btn){btn.disabled=false;btn.textContent=old||'ATUALIZAR CENTRAL'}}
}
async function saveMetricSource(){
 const cfg={url:$('#metricSourceUrl')?.value?.trim()||metricSourceConfig.url||'',sheet:$('#metricSourceSheet')?.value?.trim()||metricSourceConfig.sheet||'',autoSync:true,mode:'GOOGLE_APPS_SCRIPT_FREE',schedule:'14:05,16:05,21:05,23:05',timeZone:'America/Sao_Paulo',updatedAt:serverTimestamp(),updatedBy:currentUser.email};
 try{await setDoc(metricConfigDoc,cfg,{merge:true});metricSourceConfig={...metricSourceConfig,...cfg};$('#metricSourceModal')?.classList.add('hidden');renderMetricSourceStatus();alert('Fonte registrada. A sincronização automática é executada pelo Apps Script da planilha, sem Cloud Functions e sem Blaze.')}catch(e){alert('Erro ao salvar a fonte: '+e.message)}
}
$('#metricSourceBtn')?.addEventListener('click',openMetricSource);$('#metricSourceClose')?.addEventListener('click',()=>$('#metricSourceModal')?.classList.add('hidden'));$('#metricSourceModal')?.addEventListener('click',e=>{if(e.target.id==='metricSourceModal')e.currentTarget.classList.add('hidden')});$('#metricSourceTest')?.addEventListener('click',testMetricSource);$('#metricSourceSave')?.addEventListener('click',saveMetricSource);$('#syncMetricBtn')?.addEventListener('click',()=>requestServerMetricSync({quiet:false}));

function marketFlatten(node,path='',out=[]){
 if(Array.isArray(node)){node.forEach((v,i)=>marketFlatten(v,path,out));return out}
 if(!node||typeof node!=='object')return out;const name=node.nome||node.item||node.produto||node.name||node.ITEM||node.NOME||node.PRODUTO;
 if(name){out.push({...node,__name:String(name),__path:path})}
 Object.entries(node).forEach(([k,v])=>{if(v&&typeof v==='object')marketFlatten(v,path?path+' / '+k:k,out)});return out;
}
function marketPriceFields(x){
 const pick=(...ks)=>{for(const k of ks)if(x[k]!==undefined&&x[k]!==null&&String(x[k]).trim()!=='')return x[k];return ''};
 return {pista:pick('pista','preco_pista','precoPista','sell','sell_min','venda','VALOR PISTA','PISTA'),parceria:pick('parceria','preco_parceria','precoParceria','buy','buy_min','compra','VALOR PARCERIA','PARCERIA'),categoria:pick('categoria','category','CATEGORIA')||x.__path||''};
}
async function loadMarketCatalog(){
 mercadoStatus='CARREGANDO';renderMarket();try{const r=await fetch(MARKET_CATALOG_URL,{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);const json=await r.json();mercadoCatalogo=marketFlatten(json).filter((x,i,a)=>a.findIndex(y=>alvesNorm(y.__name)===alvesNorm(x.__name))===i);mercadoStatus='ONLINE';renderMarket()}catch(e){mercadoCatalogo=[];mercadoStatus='INDISPONÍVEL';renderMarket(e)}
}
function fmtMoneyMaybe(v){if(v===''||v==null)return '—';if(typeof v==='number')return '$'+v.toLocaleString('pt-BR');const n=Number(String(v).replace(/[^0-9,.-]/g,'').replace('.','').replace(',','.'));return Number.isFinite(n)&&n?('$'+n.toLocaleString('pt-BR')):String(v)}
function marketFind(question=''){const n=alvesNorm(question);return mercadoCatalogo.filter(x=>n.includes(alvesNorm(x.__name))||alvesNorm(x.__name).includes(n)).sort((a,b)=>b.__name.length-a.__name.length)[0]||null}
function renderMarket(err){
 const st=$('#marketStatus'),box=$('#marketResults'),cnt=$('#marketCount');if(!st||!box)return;st.innerHTML=mercadoStatus==='ONLINE'?`<span class="online">● CATÁLOGO ONLINE</span>`:(mercadoStatus==='CARREGANDO'?'Carregando catálogo público...':`<span class="danger">● CATÁLOGO INDISPONÍVEL</span>${err?' • '+esc(err.message):''}`);if(cnt)cnt.textContent=mercadoStatus==='ONLINE'?String(mercadoCatalogo.length):'—';
 const q=alvesNorm($('#marketSearch')?.value||'');const list=(q?mercadoCatalogo.filter(x=>alvesNorm([x.__name,x.__path].join(' ')).includes(q)):mercadoCatalogo.slice(0,8)).slice(0,20);box.innerHTML=list.map(x=>{const p=marketPriceFields(x);return `<div class="market-item"><div><b>${esc(x.__name)}</b><small>${esc(p.categoria||'Mercado Negro')}</small></div><span>Pista <b>${esc(fmtMoneyMaybe(p.pista))}</b><br>Parceria <b>${esc(fmtMoneyMaybe(p.parceria))}</b></span></div>`}).join('')||'<div class="delivery-no-change">Nenhum item encontrado.</div>';
}
$('#marketSearch')?.addEventListener('input',renderMarket);

const _alvesAnswerV54=alvesAnswer;
alvesAnswer=function(question=''){
 const q=alvesNorm(question),g=alvesFindGroup(question),o=alvesFindOrg(question);const metricTarget=g?.group||o?.groupAtual||faccoes.find(f=>o&&alvesNorm(f.faccao)===alvesNorm(o.nome))?.group;
 if(metricTarget&&(q.includes('media')||q.includes('pico')||q.includes('predomin')||q.includes('metrica'))){const a=metricAnalysis(metricTarget);if(!a)return {text:`Não encontrei métricas cadastradas para ${metricTarget}.`,refs:['Métricas',metricTarget]};let parts=[`${metricTarget} — ${metricPeriodLabel(metricPeriodKey)} — ${a.rows.length} dia(s) com métricas.`,`Média dos quatro horários: ${a.avg.toFixed(1)}.` ,`Pico: ${a.peak.value} às ${a.peak.hour} em ${a.peak.date}.`,`Horário predominante: ${a.predominant}.`];return {text:parts.join('\n'),refs:['Métricas',metricTarget]}}
 if(q.includes('abaixo da media')||q.includes('ranking')||q.includes('melhor media')){const rows=metricSummaryRows();if(rows.length)return {text:`Ranking de ${metricPeriodLabel(metricPeriodKey)} por média:\n${rows.slice(0,10).map((x,i)=>`${i+1}. ${x.f.group}${x.f.faccao?' — '+x.f.faccao:''}: ${x.a.avg.toFixed(1)}`).join('\n')}`,refs:['Métricas']}}
 if(q.includes('quanto custa')||q.includes('preco')||q.includes('pista')||q.includes('parceria')){const item=marketFind(question);if(item){const p=marketPriceFields(item);return {text:`${item.__name}\nPreço de pista: ${fmtMoneyMaybe(p.pista)}\nPreço de parceria: ${fmtMoneyMaybe(p.parceria)}${p.categoria?'\nCategoria: '+p.categoria:''}`,refs:['Mercado Negro']}}if(mercadoStatus!=='ONLINE')return {text:'O catálogo público do Mercado Negro não está disponível neste momento, então não vou estimar o preço.',refs:['Mercado Negro']}}
 return _alvesAnswerV54(question);
};



// ===== HIGH OS V6.5 · CDS CONFIRMADAS / GROUPS REMOVIDOS · 07/09/2026 =====
const GROUP_PROFILE_SOURCE={"Armas01":{"LOCAL":"Favela da Barragem","PRODUTO":"Armas","INICIAR ROTA":"1264.48,-179.11,106.39,19.85","CRAFT":"1267.72,-186.22,105.97,195.6","BARBEARIA":"","BAU":"1272.3,-181.79,101.0,209.77","LOJA DE ROUPAS":"","GARAGEM VIP FAC":"1300.19,-272.83,99.7,51.03 / 1298.18,-269.26,99.36,127.56","GARAGEM PUBLICA":"1285.68,-250.29,99.7,153.08 / 1288.0,-255.85,99.36,130.4","GARAGEM DELUXE":"","SHOP DELUXE":""},"Armas02":{"LOCAL":"Favela do MegaMal","PRODUTO":"Armas","INICIAR ROTA":"2584.82,3491.02,65.82,345.83","CRAFT":"2583.34,3489.61,65.82,87.88","BARBEARIA":"2648.6,3363.12,56.92,317.49","BAU":"2585.78,3485.36,65.82,124.73","LOJA DE ROUPAS":"2646.4,3357.91,56.92,357.17","GARAGEM VIP FAC":"2706.2,3385.18,58.82,340.16","GARAGEM PUBLICA":"2634.39,3370.33,56.87,314.65","GARAGEM DELUXE":"","SHOP DELUXE":"2548.08,3350.56,53.41,172.92"},"Armas03":{"LOCAL":"Favela da DP","PRODUTO":"Armas","INICIAR ROTA":"2287.76,-627.52,90.37,62.37","CRAFT":"2292.19,-624.81,90.37,343.0","BARBEARIA":"2457.5,-537.94,78.64,76.54","BAU":"2290.21,-629.61,90.37,136.07","LOJA DE ROUPAS":"2464.12,-535.34,78.64,127.56","GARAGEM VIP FAC":"2332.5,-614.04,96.5,286.3","GARAGEM PUBLICA":"2345.79,-609.89,96.57,102.05","GARAGEM DELUXE":"","SHOP DELUXE":"2447.74,-586.65,79.67,235.28"},"Armas04":{"LOCAL":"Favela da Praia 2","PRODUTO":"Armas","INICIAR ROTA":"-2404.99,-167.64,36.5,79.38","CRAFT":"-2483.78,-239.67,23.56,260.79","BARBEARIA":"-2428.14,-266.43,16.68,62.37","BAU":"-2486.09,-239.16,23.56,62.37","LOJA DE ROUPAS":"-2420.76,-266.25,16.68,113.39","GARAGEM VIP FAC":"-2395.47,-180.94,38.5,150.24","GARAGEM PUBLICA":"-2384.67,-194.25,39.56,334.49 / -2383.23,-191.85,39.48,68.04","GARAGEM DELUXE":"","SHOP DELUXE":"-2410.57,-293.44,16.75,229.61"},"Armas05":{"LOCAL":"Favela do Dino","PRODUTO":"Armas","INICIAR ROTA":"2561.79,2437.52,55.47,110.56","CRAFT":"2561.94,2437.71,55.47,323.15","BARBEARIA":"2503.28,2490.61,42.07,96.38","BAU":"2564.27,2435.75,55.47,155.91","LOJA DE ROUPAS":"2547.14,2417.11,53.85,334.49","GARAGEM VIP FAC":"2503.89,2471.52,52.23,116.23 / 2501.68,2471.86,52.12,19.85","GARAGEM PUBLICA":"2846.76,4741.39,55.35,34.02\t/ 2510.42,2450.05,51.46,206.93","GARAGEM DELUXE":"","SHOP DELUXE":""},"Armas06":{"LOCAL":"Favela do Zancudo","PRODUTO":"Armas06","INICIAR ROTA":"-2120.96,2482.66,10.03,133.23","CRAFT":"-2124.3,2478.9,10.03,195.6","BARBEARIA":"-2252.65,2457.93,15.62,107.72","BAU":"-2124.05,2484.81,10.03,297.64","LOJA DE ROUPAS":"-2248.43,2463.33,15.62,192.76","GARAGEM VIP FAC":"","GARAGEM PUBLICA":"-2223.74,2453.89,15.6,204.1 / -2224.76,2456.39,15.35,104.89","SHOP DELUXE":""},"Armas07":{"LOCAL":"","PRODUTO":"","INICIAR ROTA":"","CRAFT":"","BARBEARIA":"","BAU":"","LOJA DE ROUPAS":"","GARAGEM VIP FAC":"","GARAGEM PUBLICA":"","GARAGEM DELUXE":"","SHOP DELUXE":""},"Armas08":{"LOCAL":"Favela do Cemitério Norte","PRODUTO":"Armas","INICIAR ROTA":"60.64,2602.08,87.1,303.31","CRAFT":"61.57,2605.42,90.2,25.52","BARBEARIA":"","BAU":"62.42,2604.93,86.91,192.76","LOJA DE ROUPAS":"","GARAGEM PUBLICA":"-31.7,2673.96,76.48,93.55 / -33.75,2677.72,76.25,11.34","GARAGEM DELUXE":"","SHOP DELUXE":""},"Armas09":{"LOCAL":"Favela da Indústria, Sul","PRODUTO":"IlegalMechanic","INICIAR ROTA":"2640.33,1789.71,33.62,102.05","CRAFT":"2642.02,1781.15,33.62,187.09","BARBEARIA":"2657.95,1811.29,36.97,82.21","BAU":"2639.29,1784.0,41.1,172.92","LOJA DE ROUPAS":"2654.02,1812.91,36.97,184.26","GARAGEM VIP FAC":"-21.3,2584.61,91.16,96.38 / -23.15,2589.95,90.92,5.67","GARAGEM PUBLICA":"2639.48,1811.7,36.97,133.23 / 2636.38,1815.26,36.73,187.09","GARAGEM DELUXE":"2622.48,1808.18,36.92,198.43 / 2616.08,1804.09,36.46,85.04","SHOP DELUXE":"2640.37,1784.28,37.76"},"Armas10":{"LOCAL":"Favela da Cachoeira","PRODUTO":"Armas","INICIAR ROTA":"-1431.37,2306.54,30.82,187.09","CRAFT":"-1432.37,2309.31,30.82,90.71","BARBEARIA":"-1480.8,2283.59,30.72,257.96","BAU":"-1428.47,2308.29,30.82,291.97","LOJA DE ROUPAS":"-1414.47,2255.7,30.75,62.37","GARAGEM VIP FAC":"2688.94,1807.72,36.97,212.6 / 2684.77,1804.78,36.72,107.72","GARAGEM PUBLICA":"-1422.0,2267.5,30.67,155.91 / -1419.5,2267.27,30.45,345.83","GARAGEM DELUXE":"","SHOP DELUXE":"-1427.1,2271.31,30.95,172.92"},"Municao01":{"LOCAL":"Favela do Helipa","PRODUTO":"Municao","INICIAR ROTA":"1550.5,-728.82,111.51,204.1","CRAFT":"1547.48,-712.73,111.51,5.67","BARBEARIA":"1300.95,-781.39,79.04,221.11","BAU":"1538.87,-712.2,111.51,0.0","LOJA DE ROUPAS":"1294.03,-779.3,79.04,280.63","GARAGEM VIP FAC":"1355.24,-697.71,78.89,249.45","GARAGEM PUBLICA":"1388.29,-749.64,66.96,28.35 / 1379.99,-747.32,66.03,51.03","SHOP DELUXE":"1538.76,-723.59,111.51,14.18","ACADEMIA":""},"Municao02":{"LOCAL":"Favela do OBS 1","PRODUTO":"Municao","INICIAR ROTA":"-779.26,985.57,249.23,195.6","CRAFT":"-770.0,986.37,249.23,201.26","BARBEARIA":"-765.17,993.8,249.23,306.15","BAU":"-772.61,985.43,249.23,195.6","LOJA DE ROUPAS":"-760.24,993.57,249.23,150.24","GARAGEM VIP FAC":"-841.97,979.67,250.81,274.97 / -839.98,981.83,250.56,274.97","GARAGEM PUBLICA":"-833.8,969.79,250.81,39.69 / -833.88,972.49,250.14,8.51","GARAGEM DELUXE":"","SHOP DELUXE":"-771.07,935.66,240.28,303.31","ACADEMIA":""},"Municao03":{"LOCAL":"Favela de Sandy Shores, Alto","PRODUTO":"Municao","INICIAR ROTA":"2204.62,4682.23,37.68,232.45","CRAFT":"2200.62,4684.16,37.68,161.58","BARBEARIA":"2268.82,4607.25,37.59,70.87","BAU":"2203.59,4688.95,37.68,340.16","LOJA DE ROUPAS":"2159.7,4685.54,37.59,170.08","GARAGEM VIP FAC":"s","GARAGEM PUBLICA":"2193.62,4616.84,39.38,141.74","GARAGEM DELUXE":"","SHOP DELUXE":"2190.44,4669.46,37.54,138.9","ACADEMIA":""},"Municao04":{"LOCAL":"Favela do Petróleo, Sul","PRODUTO":"Municao","INICIAR ROTA":"1367.56,-2433.89,62.18,337.33","CRAFT":"1372.79,-2435.76,62.18,334.49","BARBEARIA":"1459.26,-2402.88,67.43,320.32","BAU":"1364.8,-2439.95,62.18,70.87","LOJA DE ROUPAS":"1371.31,-2435.59,58.32,136.07 / 1319.74,-2483.81,51.83,325.99","GARAGEM VIP FAC":"1386.0,-2499.9,52.82,206.93 / 1384.77,-2511.32,51.37,155.91","GARAGEM PUBLICA":"1389.18,-2509.62,51.98,93.55 / 1390.54,-2496.84,53.08,345.83","GARAGEM DELUXE":"1389.08,-2486.87,53.87,141.74 / 1392.64,-2488.64,53.11,348.67","SHOP DELUXE":"1385.25,-2378.29,68.36,252.29","ACADEMIA":""},"Municao05":{"LOCAL":"","PRODUTO":"QG da Plantação","INICIAR ROTA":"2047.86,5095.36,58.32,2.84","CRAFT":"2052.14,5126.33,53.89,130.4","BARBEARIA":"2069.89,5123.6,58.32,39.69","BAU":"2028.02,5095.71,58.32,124.73","LOJA DE ROUPAS":"2053.85,5121.14,58.35,303.31","GARAGEM VIP FAC":"2022.78,5137.13,52.99,317.49 / 2026.65,5133.26,52.99,130.4","GARAGEM PUBLICA":"2027.73,5141.33,52.99,130.4 / 2031.41,5137.24,52.99,130.4","GARAGEM DELUXE":"2096.62,5101.39,53.94,42.52 / 2087.23,5103.49,53.77,36.86","SHOP DELUXE":"2033.10,5088.68,58.44","ACADEMIA":""},"Municao06":{"LOCAL":"2476.25,4976.52,71.16,96.38","PRODUTO":"QG da Mansão Queimada","INICIAR ROTA":"2431.55,4972.79,42.34,31.19","CRAFT":"2435.99,4968.48,42.34,325.99","BARBEARIA":"2443.43,4976.83,51.56,314.65","BAU":"","LOJA DE ROUPAS":"2454.45,4976.54,51.56,136.07","GARAGEM VIP FAC":"2463.58,4949.11,45.29,5.67","GARAGEM PUBLICA":"","GARAGEM DELUXE":"2459.6,4960.17,43.99,343.0 / 2462.0,4958.6,45.12,150.24","SHOP DELUXE":"2443.18,4970.88,51.56,161.58","ACADEMIA":""},"Municao07":{"COORDENADA":"-1896.6,2015.73,171.3,351.5","LOCAL":"Vinhedo","PRODUTO":"Municao","INICIAR ROTA":"-1942.14,2048.95,132.25,164.41","CRAFT":"","BARBEARIA":"","BAU":"-1937.7,2040.68,140.83","LOJA DE ROUPAS":"","GARAGEM VIP FAC":"-1925.88,2035.26,140.83,286.3 / -1921.87,2037.21,140.73,260.79","GARAGEM PUBLICA":"-1921.04,2059.93,140.83,243.78 / -1917.63,2058.18,140.73,243.78","GARAGEM DELUXE":""},"Municao08":{"COORDENADA":"-1777.93,5.13,119.47,161.58","LOCAL":"Favela do Cemitério, Sul","PRODUTO":"Munição","INICIAR ROTA":"-1768.66,-118.06,95.4,311.82","CRAFT":"","BARBEARIA":"","BAU":"-1771.63,-117.69,95.4,42.52","LOJA DE ROUPAS":"","GARAGEM VIP FAC":"","GARAGEM PUBLICA":"-1750.31,-118.12,85.66,164.41 / -1756.5,-116.51,85.41,45.36","SHOP DELUXE":"-1777.02,6.2,85.71,235.28","ACADEMIA":""},"Municao09":{"COORDENADA":"","LOCAL":"QG dos Vagos","PRODUTO":"Munição","INICIAR ROTA":"320.79,-2058.35,24.03,323.15","CRAFT":"","BARBEARIA":"","BAU":"314.84,-2049.11,20.98,53.86","LOJA DE ROUPAS":"","GARAGEM VIP FAC":"313.21,-2035.34,20.73,325.99 / 317.48,-2030.66,20.62,323.15","GARAGEM PUBLICA":"320.99,-2041.22,20.78,325.99 / 324.85,-2038.76,20.69,323.15","SHOP DELUXE":"322.09,-2050.02,20.98,306.15","ACADEMIA":""},"Municao10":{"COORDENADA":"2184.19,85.47,261.91,164.41","LOCAL":"Favela da Boa Vista, Sul","PRODUTO":"Munição","CRAFT":"2249.79,51.97,251.42,68.04","BARBEARIA":"","BAU":"","LOJA DE ROUPAS":"2228.56,88.91,241.56,340.16","GARAGEM VIP FAC":"","GARAGEM PUBLICA":"2179.75,70.55,227.22,172.92 / 2177.03,72.47,227.15,130.4","GARAGEM DELUXE":"","SHOP DELUXE":"2218.22,109.56,235.26,238.12","ACADEMIA":""},"Drogas01":{"LOCAL":"657.75,-174.98,69.86,59.53","PRODUTO":"Favela do Campinho","INICIAR ROTA":"709.82,-225.13,71.65,153.08","CRAFT":"710.31,-224.03,71.65,334.49","BARBEARIA":"709.89,-223.81,71.65,155.91","BAU":"707.57,-221.92,71.65,343.0","LOJA DE ROUPAS":"721.89,-191.4,69.37,243.78","GARAGEM VIP FAC":"619.18,-92.62,74.93,79.38","GARAGEM PUBLICA":"719.91,-213.37,68.49,345.83 / 719.97,-210.54,68.24,56.7","GARAGEM DELUXE":"723.24,-205.81,68.49,153.08 / 721.06,-207.58,68.24,59.53","SHOP DELUXE":""},"Drogas02":{"LOCAL":"-1682.63,931.86,180.38,334.49","PRODUTO":"Favela do Asilo","INICIAR ROTA":"-1764.55,952.9,188.9,136.07","CRAFT":"-1762.31,954.81,188.9,229.61","BARBEARIA":"-1643.8,930.12,177.58,161.58","BAU":"-1763.18,958.83,188.9,246.62","LOJA DE ROUPAS":"-1639.81,945.88,177.56,76.54","GARAGEM VIP FAC":"-1644.81,937.1,177.58,201.26","GARAGEM PUBLICA":"-1669.83,992.43,177.61,249.45 / -1668.32,990.68,177.38,153.08","GARAGEM DELUXE":"-1670.38,934.22,177.63,136.07 / -1673.44,932.39,177.39,229.61","SHOP DELUXE":""},"Drogas03":{"LOCAL":"1367.25,-1381.16,108.73,257.96","PRODUTO":"Favela do Esgoto","INICIAR ROTA":"1430.23,-1414.87,84.37,280.63","CRAFT":"1427.54,-1415.26,84.37,8.51","BARBEARIA":"1283.57,-1333.09,47.92,187.09","BAU":"1424.85,-1418.62,84.37,22.68","LOJA DE ROUPAS":"1280.64,-1327.29,47.92,266.46","GARAGEM VIP FAC":"1295.6,-1330.47,47.6,323.15 / 1298.84,-1330.61,47.38,0.0","GARAGEM DELUXE":"1353.17,-1435.42,71.38,82.21 / 1351.1,-1434.02,71.12,357.17","GARAGEM PUBLICA":"1343.79,-1380.5,71.38,269.3 / 1347.0,-1380.58,71.12,0.0","SHOP DELUXE":""},"Drogas04":{"LOCAL":"482.33,208.67,100.73,82.21","PRODUTO":"QG Gang 1","INICIAR ROTA":"482.33,208.67,100.73,82.21","CRAFT":"470.13,205.06,100.73,354.34","BARBEARIA":"485.31,192.23,100.73,164.41","BAU":"472.67,197.5,100.73,164.41","LOJA DE ROUPAS":"473.06,186.7,100.73,297.64","GARAGEM VIP FAC":"473.52,186.59,100.73,325.99","GARAGEM PUBLICA":"509.06,225.12,104.74,147.41 / 514.46,226.33,104.74,345.83","GARAGEM DELUXE":"528.22,249.87,103.1,351.5 / 528.8,252.23,102.97,252.29","SHOP DELUXE":""},"Drogas05":{"LOCAL":"-1570.68,-298.16,88.78,337.33","PRODUTO":"QG Gang 2(mapa removido)","INICIAR ROTA":"-1565.57,-264.05,44.26,22.68","CRAFT":"-1578.25,-262.83,44.26,343.0","BARBEARIA":"-1571.2,-252.76,43.89,76.54","BAU":"-1578.55,-270.92,44.26,136.07","LOJA DE ROUPAS":"-1578.81,-270.88,43.79,153.08","GARAGEM VIP FAC":"1580.84,-281.09,44.26,300.48","GARAGEM PUBLICA":"-1566.89,-252.61,48.46,51.03","GARAGEM DELUXE":"-1575.38,-234.43,49.76,59.53 / -1576.35,-238.15,49.45,243.78","SHOP DELUXE":""},"Drogas06":{"LOCAL":"Clube de Festas, Açougue","PRODUTO":"Drogas","INICIAR ROTA":"1003.52,-2367.53,-4.52,189.93","CRAFT":"1010.48,-2372.96,-4.55,280.63","BARBEARIA":"1005.37,-2365.64,-4.55,221.11","BAU":"1001.11,-2365.92,-4.55,90.71","LOJA DE ROUPAS":"1004.46,-2373.0,-4.55,323.15","GARAGEM VIP FAC":"","GARAGEM PUBLICA":"1024.74,-2349.74,31.24,175.75 / 1018.94,-2351.77,31.24,187.09","GARAGEM DELUXE":"","SHOP DELUXE":""},"Drogas07":{"LOCAL":"Residência Clinton","PRODUTO":"","INICIAR ROTA":"-9.29,-1441.26,31.1,215.44","CRAFT":"-9.08,-1433.34,30.85","BARBEARIA":"-17.93,-1436.92,31.1,272.13","BAU":"-17.41,-1430.43,30.89","LOJA DE ROUPAS":"-17.98,-1439.36,31.1,235.28","GARAGEM VIP FAC":"-21.12,-1432.83,30.65,90.71 / -24.29,-1437.13,30.65,175.75","GARAGEM PUBLICA":"-13.3,-1454.7,30.46,187.09 / -12.59,-1458.68,30.5,93.55","GARAGEM DELUXE":"-28.68,-1455.62,30.97,192.76 / -27.63,-1460.43,30.92,90.71","SHOP DELUXE":"-9.86,-1428.56,31.18"},"Drogas08":{"LOCAL":"Favela da Praia 3","PRODUTO":"Drogas","INICIAR ROTA":"-2902.94,1485.7,71.12,153.08","CRAFT":"-2899.09,1488.07,71.12,255.12","BARBEARIA":"-2888.92,1367.41,76.26,19.85","BAU":"-2902.65,1492.9,71.12,340.16","LOJA DE ROUPAS":"-2843.63,1419.7,96.99,73.71","GARAGEM VIP FAC":"","GARAGEM PUBLICA":"","GARAGEM DELUXE":"","SHOP DELUXE":""},"Drogas09":{"LOCAL":"Favela da Praia 1","PRODUTO":"Drogas","INICIAR ROTA":"-1137.86,-1764.65,4.48,215.44","CRAFT":"-1139.78,-1763.02,4.48,215.44","BARBEARIA":"-1127.14,-1752.72,4.48,300.48","BAU":"-1137.37,-1761.03,4.48,226.78","LOJA DE ROUPAS":"-1124.34,-1750.41,4.48,31.19","GARAGEM VIP FAC":"-1191.48,-1790.99,4.26,269.3 / -1188.75,-1793.3,4.01,343.0","GARAGEM PUBLICA":"","GARAGEM DELUXE":"","SHOP DELUXE":""},"Drogas10":{"LOCAL":"Favela de Paleto, Norte","PRODUTO":"DROGAS","INICIAR ROTA":"1772.1,6474.44,60.04,240.95","CRAFT":"1767.62,6478.2,60.04,56.7","BARBEARIA":"1759.67,6466.96,59.77,272.13","BAU":"1770.48,6472.01,60.04,249.45","LOJA DE ROUPAS":"1756.12,6466.74,59.77,317.49","GARAGEM VIP FAC":"1744.07,6496.36,59.78,147.41 / 1741.94,6494.63,59.55,51.03","GARAGEM DELUXE":"","SHOP DELUXE":"1696.08,6529.43,52.13,48.19"},"Drogas11":{"LOCAL":"Posto, Porto","PRODUTO":"Drogas","INICIAR ROTA":"-59.76,-2517.63,7.30","CRAFT":"-55.92,-2519.98,7.23","BARBEARIA":"-55.09,-2503.67,6.15,56.7","BAU":"-52.39,-2525.34,7.51","LOJA DE ROUPAS":"-61.99,-2504.17,6.0,56.7","GARAGEM VIP FAC":"-103.79,-2509.85,5.39,240.95 / -105.71,-2513.14,5.43,232.45","GARAGEM PUBLICA":"1742.47,6487.88,59.78,331.66 / 1742.77,6490.59,59.56,62.37","GARAGEM DELUXE":"","SHOP DELUXE":""},"Lavagem01":{"LOCAL":"Club 77","PRODUTO":"Lavagem","INICIAR ROTA":"209.95,-3175.18,8.21,181.42","CRAFT":"242.5,-3143.78,3.32,124.73","BARBEARIA":"239.56,-3151.23,-0.19,181.42","BAU":"248.55,-3144.14,3.40","LOJA DE ROUPAS":"252.76,-3150.9,-0.2,87.88","GARAGEM VIP FAC":"194.48,-3158.92,5.78,93.55","GARAGEM PUBLICA":"160.19,-3180.44,5.98,235.28/164.02,-3182.84,5.91,266.46","BAR":"247.17,-3162.36,-0.15","SHOP DELUXE":"244.12,-3157.52,-0.27","ACADEMIA":""},"Lavagem02":{"LOCAL":"FAZENDA, SUL","PRODUTO":"LAVAGEM","INICIAR ROTA":"1466.47,1119.43,119.13,0.0","CRAFT":"1471.03,1118.18,119.13,0.0","BARBEARIA":"1403.24,1138.17,117.53,184.26","BAU":"","LOJA DE ROUPAS":"1404.22,1146.07,117.53,107.72","GARAGEM VIP FAC":"1372.26,1151.31,113.75,90.71 / 1368.33,1150.45,113.75,195.6","GARAGEM DELUXE":"1374.97,1131.93,114.16,317.49 / 1370.97,1130.95,113.89,138.9","SHOP DELUXE":""},"Lavagem03":{"LOCAL":"FAVELA DA PLACA","PRODUTO":"LAVAGEM","INICIAR ROTA":"768.49,441.9,149.73,215.44","CRAFT":"765.18,445.32,149.73,34.02","BARBEARIA":"764.5,396.1,139.68,153.08","BAU":"767.48,443.1,146.37,144.57","LOJA DE ROUPAS":"765.43,402.19,139.68,192.76","GARAGEM VIP FAC":"828.36,424.15,139.63,331.66","GARAGEM DELUXE":"","SHOP DELUXE":""},"Lavagem04":{"LOCAL":"FAVELA DO OBS 2","PRODUTO":"LAVAGEM","INICIAR ROTA":"-480.22,1613.99,369.58,0.0","CRAFT":"-482.76,1606.59,369.58,195.6","BARBEARIA":"-304.33,1599.18,347.27,102.05","BAU":"-479.65,1609.97,369.58,192.76","LOJA DE ROUPAS":"-298.58,1603.26,347.27,138.9","GARAGEM VIP FAC":"","GARAGEM DELUXE":"","SHOP DELUXE":""},"Lavagem05":{"LOCAL":"Mansão Playboy","PRODUTO":"Lavagem","INICIAR ROTA":"-1540.36,81.20,56.58","CRAFT":"-1511.86,109.48,46.86","BARBEARIA":"-1545.0,99.0,60.96,314.65","BAU":"-1509.97,117.46,47.15","LOJA DE ROUPAS":"-1535.6,106.92,60.96,130.4","GARAGEM VIP FAC":"","GARAGEM DELUXE":""},"Lavagem06":{"LOCAL":"QG do China (MAPA REMOVIDO)","PRODUTO":"Lavagem","INICIAR ROTA":"-881.18,-1462.64,7.46","CRAFT":"-892.03,-1444.94,7.53,209.77","BARBEARIA":"-895.49,-1467.9,7.53,113.39","BAU":"-867.42,-1458.02,7.53,291.97","LOJA DE ROUPAS":"","GARAGEM VIP FAC":"","GARAGEM PUBLICA":"","SHOP DELUXE":"-902.60,-1455.85,7.44"},"Lavagem07":{"COORDENADA":"Favela do Sapao","LOCAL":"LAVAGEM07","PRODUTO":"","INICIAR ROTA":"1876.33,1511.54,112.98,357.17","CRAFT":"1885.17,1504.95,113.06,269.3","BARBEARIA":"1797.51,1356.97,126.93,175.75","BAU":"1886.08,1509.38,112.98,246.62","LOJA DE ROUPAS":"","GARAGEM DELUXE":"1860.3,1466.5,113.16,0.0"},"Lavagem08":{"LOCAL":"QG Gang 4(MAPA REMOVIDO","PRODUTO":"Lavagem08","INICIAR ROTA":"-1129.31,-1584.40,0.24","CRAFT":"-1123.6,-1562.83,0.42,297.64","BARBEARIA":"-1134.11,-1564.1,0.42,303.31","BAU":"-1127.24,-1576.06,0.42,303.31","LOJA DE ROUPAS":"-1121.56,-1566.9,0.42,76.54","GARAGEM VIP FAC":"-1138.97,-1545.38,4.35,127.56 / -1140.6,-1546.48,4.38,36.86","GARAGEM PUBLICA":"-1162.28,-1552.97,4.35,308.98 / -1158.29,-1550.28,4.3,308.98","GARAGEM DELUXE":"","SHOP DELUXE":"-1140.83,-1589.01,0.52"},"Lavagem09":{"LOCAL":"Galaxy","PRODUTO":"Lavagem","INICIAR ROTA":"400.75,242.64,92.05,158.75","CRAFT":"406.28,244.24,92.05,263.63","BARBEARIA":"","BAU":"391.84,250.44,92.05,79.38","LOJA DE ROUPAS":"380.99,272.5,91.19,73.71","GARAGEM VIP FAC":"","BAR":"351.80,286.03,91.22"},"Desmanche01":{"LOCAL":"QG Gang 3","PRODUTO":"Desmanche","INICIAR ROTA":"-1332.84,-1238.37,1.4,317.49","CRAFT":"-1325.19,-1246.69,0.59,34.02","BARBEARIA":"-1334.04,-1258.29,0.59,136.07","BAU":"-1337.69,-1245.67,0.59,104.89","LOJA DE ROUPAS":"-1345.79,-1252.23,0.59,257.96","GARAGEM VIP FAC":"-1298.72,-1250.86,4.45,107.72 / -1303.08,-1253.4,4.36,221.11","GARAGEM PUBLICA":"-1306.33,-1240.29,4.84,133.23 / -1309.84,-1242.13,4.73,204.1","GARAGEM DELUXE":"","SHOP DELUXE":""},"Desmanche02":{"LOCAL":"Tequi-la-la","PRODUTO":"Desmanche","INICIAR ROTA":"-572.99,286.48,79.18,184.26","CRAFT":"-568.52,292.05,79.18,167.25","BARBEARIA":"-561.91,289.98,85.38,178.59","BAU":"-572.8,292.22,79.18,25.52","LOJA DE ROUPAS":"-552.76,278.47,82.18,59.53","GARAGEM VIP FAC":"-569.89,323.5,84.48,0.0 / -572.76,324.7,84.54,184.26","GARAGEM PUBLICA":"-552.03,310.63,83.17,354.34 / -546.87,308.18,83.02,175.75","GARAGEM DELUXE":"","BAR":"-561.28,286.65,82.25 / -563.87,286.07,85.48"},"Desmanche04":{"LOCAL":"The Lost","PRODUTO":"Desmanche04","INICIAR ROTA":"961.56,-107.1,74.34,25.52","CRAFT":"971.5, -98.4, 74.3","BARBEARIA":"974.39,-99.78,78.08,311.82","BAU":"957.8, -110.9, 74.3","LOJA DE ROUPAS":"974.4, -99.7, 78.1","GARAGEM VIP FAC":"950.0, -129.3, 74.4","GARAGEM PUBLICA":"959.1, -121.4, 75.0","GARAGEM DELUXE":"","SHOP DELUXE":"998.22,-108.19,73.97,314.65"},"Desmanche05":{"LOCAL":"Roogers","PRODUTO":"","INICIAR ROTA":"-616.13,-1621.95,32.88","CRAFT":"-612.49,-1624.81,32.80","BARBEARIA":"-589.7,-1618.08,33.01,172.92 / 490.22,-1306.8,29.27,195.6","BAU":"-619.84,-1617.82,33.01,357.17","LOJA DE ROUPAS":"-594.88,-1618.53,33.01,269.3","GARAGEM VIP FAC":"-610.65,-1600.65,26.74,82.21 / -610.2,-1597.7,26.74,79.38","GARAGEM PUBLICA":"-609.36,-1591.97,26.74,87.88 / -610.6,-1594.24,26.74,82.21","GARAGEM DELUXE":"-588.75,-1583.67,26.74,82.21 / -590.55,-1587.77,26.74,90.71","SHOP DELUXE":"-623.7,-1617.59,33.01,11.34"},"Desmanche06":{"LOCAL":"Hayes Auto","PRODUTO":"","INICIAR ROTA":"t/","CRAFT":"","BARBEARIA":"474.0,-1321.5,29.22,198.43","BAU":"479.42,-1326.83,29.2,113.39","LOJA DE ROUPAS":"482.19,-1303.27,29.25,218.27","GARAGEM VIP FAC":"484.36,-1338.85,29.28,289.14 / 485.78,-1333.83,29.3,306.15","GARAGEM PUBLICA":"504.6,-1336.41,29.32,195.6 / 499.79,-1337.28,29.32,34.02","GARAGEM DELUXE":"492.64,-1356.22,29.34,90.71 / 488.4,-1362.14,29.25,192.76","SHOP DELUXE":"478.44,-1334.72,29.23,141.74"},"IlegalMedic01":{"LOCAL":"QG Gang 5","PRODUTO":"IlegalMedic","INICIAR ROTA":"544.32,-1756.77,25.34,65.2","CRAFT":"540.27,-1766.22,25.34,150.24","BARBEARIA":"553.57,-1783.34,25.34,144.57","BAU":"541.8,-1776.8,25.34,56.7","LOJA DE ROUPAS":"547.28,-1789.54,25.34,161.58","GARAGEM VIP FAC":"569.71,-1800.96,29.17,348.67 / 567.43,-1799.82,29.18,348.67","GARAGEM PUBLICA":"564.15,-1754.86,29.17,340.16 / 564.15,-1754.86,29.17,343.0","GARAGEM DELUXE":"","SHOP DELUXE":""},"Contrabando02":{"LOCAL":"Lester","PRODUTO":"","INICIAR ROTA":"1272.07,-1711.17,54.59","CRAFT":"1272.58,-1716.33,54.42","BARBEARIA":"1273.69,-1708.15,54.76,119.06","BAU":"1268.32,-1710.62,55.26","LOJA DE ROUPAS":"1276.17,-1714.44,54.76,48.19","GARAGEM VIP FAC":"1273.14,-1733.26,51.85,221.11 / 1272.55,-1736.37,51.63,113.39","GARAGEM PUBLICA":"1282.54,-1728.36,52.72,218.27 / 1286.06,-1732.69,52.86,297.64","GARAGEM DELUXE":"","SHOP EXCLUSIVO":"1270.48,-1730.46,54.85"}};
const GROUP_BASE_CORRECTIONS={"Armas01":{"cds":"1286.34,-266.43,99.7,303.31","state":"OK"},"Armas02":{"cds":"2696.23,3400.29,58.82,90.71","state":"OK"},"Armas03":{"cds":"2355.39,-605.06,96.58,257.96","state":"OK"},"Armas04":{"cds":"-2390.91,-198.43,39.65,269.3","state":"OK"},"Armas05":{"cds":"2561.79,2437.52,55.47,110.56","state":"OK"},"Armas06":{"cds":"-2120.96,2482.66,10.03,133.23","state":"OK"},"Armas07":{"cds":"-113.73,-12.34,70.52,133.23","state":"SEM_CRAFT"},"Armas08":{"state":"REMOVIDO"},"Armas09":{"cds":"2640.33,1789.71,33.62,102.05","state":"OK"},"Armas10":{"cds":"-1431.37,2306.54,30.82,187.09","state":"OK"},"Municao01":{"cds":"1550.5,-728.82,111.51,204.1","state":"OK"},"Municao02":{"cds":"-779.26,985.57,249.23,195.6","state":"OK"},"Municao03":{"cds":"-130.69,3220.77,73.72,255.12","state":"OK"},"Municao04":{"cds":"1367.56,-2433.89,62.18,337.33","state":"OK"},"Municao05":{"cds":"2047.86,5095.36,58.32,2.84","state":"OK"},"Municao06":{"cds":"2473.01,4959.72,44.89,51.03","state":"OK"},"Municao07":{"cds":"-1896.6,2015.73,171.3,351.5","state":"OK"},"Municao08":{"cds":"-1771.7,-117.8,95.4","state":"OK"},"Municao09":{"cds":"320.79,-2058.35,24.03,323.15","state":"OK"},"Municao10":{"cds":"-3694.8,3790.2,5.1","state":"OK"},"Lavagem01":{"cds":"241.5,-3144.2,3.3","state":"OK"},"Lavagem02":{"cds":"1466.47,1119.43,119.13,0.0","state":"OK"},"Lavagem03":{"cds":"768.49,441.9,149.73,215.44","state":"OK"},"Lavagem04":{"cds":"-482.6,1606.5,369.6","state":"OK"},"Lavagem05":{"cds":"-1511.9,109.5,46.9","state":"OK"},"Lavagem07":{"cds":"1876.33,1511.54,112.98,357.17","state":"OK"},"Lavagem08":{"state":"REMOVIDO"},"Lavagem09":{"cds":"342.68,293.21,118.13,354.34","state":"OK"},"Desmanche01":{"cds":"-1332.84,-1238.37,1.4,317.49","state":"OK"},"Desmanche02":{"cds":"-572.99,286.48,79.18,184.26","state":"OK"},"Desmanche03":{"cds":"-1376.69,-621.82,35.89,31.19","state":"OK"},"Desmanche04":{"cds":"983.12,-126.47,74.05,320.32","state":"OK"},"Desmanche05":{"cds":"-616.13,-1621.95,32.88","state":"OK"},"Desmanche06":{"cds":"471.44,-1311.00,29.26","state":"OK"},"Desmanche07":{"cds":"2201.62,4689.18,37.68,68.04","state":"OK"},"Vanilla":{"cds":"92.59,-1290.91,29.25","state":"OK"},"IlegalMedic01":{"cds":"227.44,-1388.25,32.45,36.86","state":"OK"},"IlegalMechanic":{"cds":"-205.6,-1310.29,31.29,223.94","state":"OK"},"Manicomio":{"cds":"3899.68,4877.41,12.7,93.55","state":"OK"},"Drogas01":{"cds":"657.75,-174.98,69.86,59.53","state":"OK"},"Drogas02":{"cds":"-1682.63,931.86,180.38,334.49","state":"OK"},"Drogas03":{"cds":"1367.25,-1381.16,108.73,257.96","state":"OK"}};
const GROUP_PROFILE_SOURCE_VERSION='07/09/2026 · CDS conferidas';
function profileCoordLike(v=''){return /^\s*[{]?\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+/.test(String(v||''))}
function splitCoordPair(v=''){const s=String(v||'').replace(/\t/g,' ').trim();if(!s)return ['',''];const parts=s.split(/\s*\/\s*/).map(x=>x.trim()).filter(Boolean);return [parts[0]||'',parts[1]||'']}
function cleanProfileValue(v=''){return String(v||'').replace(/<br\s*\/?\s*>/gi,'').trim()}
function sourceToGroupPatch(f,src){
 const oldB={...(f?.beneficios||{})}, oldT=mergedTechProfile(f||{}), b={...oldB}, t=clonePlain(oldT)||{}, correction=GROUP_BASE_CORRECTIONS[f?.group]||{};
 const local=cleanProfileValue(src.LOCAL), product=cleanProfileValue(src.PRODUTO), craft=cleanProfileValue(src.CRAFT), routeStart=cleanProfileValue(src['INICIAR ROTA']);
 const [vipBlip,vipSpawn]=splitCoordPair(src['GARAGEM VIP FAC']),[pubBlip,pubSpawn]=splitCoordPair(src['GARAGEM PUBLICA']);
 if(cleanProfileValue(src.BARBEARIA))b.barbearia=cleanProfileValue(src.BARBEARIA);
 if(cleanProfileValue(src.BAU))b.bau=cleanProfileValue(src.BAU);
 if(cleanProfileValue(src['LOJA DE ROUPAS']))b.lojaRoupas=cleanProfileValue(src['LOJA DE ROUPAS']);
 if(vipBlip){b.garagemVipBlip=vipBlip;b.garagemVip=true} if(vipSpawn)b.garagemVipSpawn=vipSpawn;
 if(pubBlip){b.garagemPublicaBlip=pubBlip;b.garagemPublica=true} if(pubSpawn)b.garagemPublicaSpawn=pubSpawn;
 if(cleanProfileValue(src['SHOP EXCLUSIVO']))b.shopExclusivo=cleanProfileValue(src['SHOP EXCLUSIVO']);
 if(craft)b.craft=craft;if(routeStart)b.rotaExclusiva=true;
 t.craft=t.craft||{receitas:[]};if(craft)t.craft.cds=craft;
 t.rota=t.rota||{};if(routeStart)t.rota.inicio=routeStart;
 t.estruturaExtra={...(t.estruturaExtra||{}),coordenadaBase:cleanProfileValue(src.COORDENADA||''),garagemDeluxe:cleanProfileValue(src['GARAGEM DELUXE']||''),shopDeluxe:cleanProfileValue(src['SHOP DELUXE']||''),academia:cleanProfileValue(src.ACADEMIA||''),bar:cleanProfileValue(src.BAR||''),fontePerfil:GROUP_PROFILE_SOURCE_VERSION};
 if(correction.state==='SEM_CRAFT'){b.craft='';t.craft={...(t.craft||{}),cds:'',ativo:false,receitas:[]};}
 if(correction.state==='REMOVIDO'){t.estruturaExtra={...(t.estruturaExtra||{}),removido:true};}
 const patch={beneficios:b,perfilTecnico:t,perfilFonte:{...src,versao:GROUP_PROFILE_SOURCE_VERSION},perfilBase:{cds:correction.cds||f?.cds||'',situacao:correction.state||'BASE',fonte:'Conferência manual 07/09/2026'}};
 if(correction.cds)patch.cds=correction.cds;
 if(correction.state==='REMOVIDO'){patch.removido=true;patch.status='INATIVA';patch.observacoes=[f?.observacoes,'Group removido da cidade em 07/09/2026.'].filter(Boolean).join(' | ');}
 if(correction.state!=='REMOVIDO'&&f?.removido){patch.removido=false;}
 if(local&&!profileCoordLike(local)&&!/^N\/?A$/i.test(local))patch.qg=local;
 if(product&&/^(armas\d*|muni[cç][aã]o|drogas|lavagem|desmanche|ilegalmedic)$/i.test(product))patch.produto=product;
 return patch;
}
async function updateOfficialGroupProfiles(){
 if(String(currentProfile?.role||'').toUpperCase()!=='ADMIN')return alert('Apenas ADMIN pode atualizar os perfis dos Groups.');
 const keys=[...new Set([...Object.keys(GROUP_PROFILE_SOURCE),...Object.keys(GROUP_BASE_CORRECTIONS)])];const entries=keys.map(k=>[k,GROUP_PROFILE_SOURCE[k]||{}]);if(!entries.length)return alert('Nenhum perfil oficial carregado.');
 if(!confirm(`Atualizar ${entries.length} perfis técnicos com a base oficial de ${GROUP_PROFILE_SOURCE_VERSION}?\n\nA ocupação atual, líderes, status, histórico e receitas personalizadas serão preservados.`))return;
 try{let updated=0,missing=0;const batch=writeBatch(db);for(const [sourceGroup,src] of entries){const f=(faccoes||[]).find(x=>alvesNorm(x.group).replace(/\s+/g,'')===alvesNorm(sourceGroup).replace(/\s+/g,''));if(!f){missing++;continue}const patch=sourceToGroupPatch(f,src);batch.set(doc(db,'highos','data','faccoes',f.group),{...patch,updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true});updated++;}await batch.commit();await addDoc(histCol,{sessionId:currentSessionId||'',tipo:'ATUALIZACAO_PERFIS',descricao:`Perfis técnicos oficiais atualizados: ${updated} Group(s) · fonte ${GROUP_PROFILE_SOURCE_VERSION}`,usuario:currentUser.email,data:serverTimestamp()});await loadFaccoes();alert(`Perfis atualizados com sucesso.\n\nAtualizados: ${updated}\nSem Group correspondente na base atual: ${missing}\n\nFacções/ocupações existentes foram preservadas.`);}catch(e){alert('Erro ao atualizar perfis: '+e.message)}
}

// ===== HIGH OS V6.3 · PERFIL TÉCNICO INTEGRADO AO GROUP =====
// Craft não é uma página: receitas, farm e rota fazem parte do patrimônio permanente do Group/QG.
const ITEM_IMG_BASE='assets/itens/';
const ITEM_META={
 pistolbody:{nome:'Corpo de Pistola',imagem:'pistolbody.png'}, smgbody:{nome:'Corpo de Sub',imagem:'smgbody.png'}, riflebody:{nome:'Corpo de Rifle',imagem:'riflebody.png'},
 sheetmetal:{nome:'Chapa de Metal',imagem:'sheetmetal.png'}, dollar:{nome:'Dólar',imagem:'dollar.png'}, elastic:{nome:'Elástico',imagem:'elastic.png'}, rubber:{nome:'Borracha',imagem:'rubber.png'}, techtrash:{nome:'Lixo Eletrônico',imagem:'techtrash.png'},
 ziplock:{nome:'Ziplock',imagem:'ziplock.png'}, weedbud:{nome:'Bud de Maconha',imagem:'weedbud.png'}, kunk:{nome:'Kunk',imagem:'weedbud.png'}, projectile:{nome:'Projétil',imagem:'projectile.png'}, gunpowder:{nome:'Frasco de Pólvora',imagem:'gunpowder.png'},
 plastic:{nome:'Plástico',imagem:'plastic.png'}, explosives:{nome:'Explosivos',imagem:'explosives.png'}, misturaquimica:{nome:'Mistura Química',imagem:'misturaquimica.png'}, electroniccomponents:{nome:'Componentes Eletrônicos',imagem:'electroniccomponents.png'},
 washbleach:{nome:'Alvejante',imagem:'washbleach.png'}, alcohol:{nome:'Álcool',imagem:'alcohol.png'}, acetone:{nome:'Acetona',imagem:'acetone.png'}, sulfuric:{nome:'Ácido Sulfúrico',imagem:'sulfuric.png'}, acid:{nome:'Ácido',imagem:'acid.png'},
 tarp:{nome:'Lona',imagem:'tarp.png'}, fibrasin:{nome:'Fibra Sintética',imagem:'fibrasin.png'}, syringe:{nome:'Seringa',imagem:'syringe.png'}, saline:{nome:'Soro Fisiológico',imagem:'saline.png'}, paper:{nome:'Papel',imagem:'paper.png'},
 woodlog:{nome:'Tora de Madeira',imagem:'woodlog.png'}
};
const ARMAS_STANDARD_RECIPES=[
 {id:'ak74n',nome:'AK-74N',spawn:'WEAPON_ASSAULTRIFLE',imagem:'ak74n.png',nivel:5,max:10,insumos:[['riflebody',35],['sheetmetal',30],['dollar',70000]]},
 {id:'ak102',nome:'AK-102',spawn:'WEAPON_ASSAULTRIFLE_MK2',imagem:'ak102.png',nivel:5,max:10,insumos:[['riflebody',40],['sheetmetal',34],['dollar',46000]]},
 {id:'sigsauer556',nome:'Sig Sauer 556',spawn:'WEAPON_SPECIALCARBINE_MK2',imagem:'sigsauer556.png',nivel:5,max:10,insumos:[['riflebody',47],['sheetmetal',33],['dollar',70000]]},
 {id:'t54',nome:'T54',spawn:'WEAPON_PISTOL_MK2',imagem:'t54.png',nivel:5,max:10,insumos:[['pistolbody',22],['sheetmetal',12],['dollar',8500]]},
 {id:'f2000',nome:'F2000',spawn:'WEAPON_ASSAULTSMG',imagem:'WEAPON_ASSAULTSMG.png',nivel:5,max:10,insumos:[['smgbody',30],['sheetmetal',24],['dollar',31000]]},
 {id:'deagle',nome:'Deagle',spawn:'WEAPON_PISTOL50',imagem:'WEAPON_PISTOL50.png',nivel:5,max:10,insumos:[['pistolbody',16],['sheetmetal',13],['dollar',18000]]},
 {id:'m1922',nome:'M1922',spawn:'WEAPON_VINTAGEPISTOL',imagem:'WEAPON_VINTAGEPISTOL.png',nivel:5,max:10,insumos:[['pistolbody',11],['sheetmetal',9],['dollar',12000]]},
 {id:'tec9',nome:'Tec-9',spawn:'WEAPON_MACHINEPISTOL',imagem:'WEAPON_MACHINEPISTOL.png',nivel:5,max:10,insumos:[['smgbody',25],['sheetmetal',19],['dollar',26000]]},
 {id:'fnfal',nome:'FN L1A1 / FN FAL',spawn:'WEAPON_FNFAL',imagem:'WEAPON_FNFAL.png',nivel:5,max:10,insumos:[['riflebody',38],['sheetmetal',31],['dollar',70000]]}
].map(r=>({...r,origem:'PADRÃO DO SEGMENTO'}));
const MUNICAO_STANDARD_RECIPES=[
 {id:'ammo-pistol',nome:'Caixa de Munição de Pistola',spawn:'caixa_m_pistola',imagem:'caixa_m_pistola.png',insumos:[['projectile',12],['gunpowder',10]]},
 {id:'ammo-smg',nome:'Caixa de Munição de SMG',spawn:'caixa_m_smg',imagem:'caixa_m_smg.png',insumos:[['projectile',18],['gunpowder',17]]},
 {id:'ammo-rifle',nome:'Caixa de Munição de Rifle',spawn:'caixa_m_rifle',imagem:'caixa_m_rifle.png',insumos:[['projectile',31],['gunpowder',24]]},
 {id:'c4',nome:'C4',spawn:'c4',imagem:'c4.png',insumos:[['explosives',25],['plastic',10]]}
].map(r=>({...r,origem:'PADRÃO DO SEGMENTO'}));
const LAVAGEM_STANDARD_RECIPES=[
 {id:'pendrive1',nome:'Pendrive 1',spawn:'pendrive1',imagem:'pendrive1.png',insumos:[['electroniccomponents',12],['rubber',8]]},
 {id:'pendrive2',nome:'Pendrive 2',spawn:'pendrive2',imagem:'pendrive2.png',insumos:[['electroniccomponents',14],['rubber',10]]},
 {id:'pendrive3',nome:'Pendrive 3',spawn:'pendrive3',imagem:'pendrive3.png',insumos:[['electroniccomponents',19],['rubber',15]]},
 {id:'pendrive4',nome:'Pendrive 4',spawn:'pendrive4',imagem:'pendrive4.png',insumos:[['electroniccomponents',27],['rubber',23]]},
 {id:'pendrive5',nome:'Pendrive 5',spawn:'pendrive5',imagem:'pendrive5.png',insumos:[['electroniccomponents',40],['rubber',30]]},
 {id:'handcuff',nome:'Algema',spawn:'handcuff',imagem:'handcuff.png',insumos:[['sheetmetal',3]]},
 {id:'lavagem',nome:'Máquina de Lavagem',spawn:'lavagem',imagem:'lavagem.png',insumos:[['plastic',70],['electroniccomponents',50]]}
].map(r=>({...r,origem:'PADRÃO DO SEGMENTO'}));
const DESMANCHE_STANDARD_RECIPES=[
 {id:'blocksignal',nome:'Bloqueador de Sinal',spawn:'blocksignal',imagem:'blocksignal.png',insumos:[['techtrash',12],['elastic',10]]},
 {id:'lockpick',nome:'Gazua',spawn:'lockpick',imagem:'lockpick.png',insumos:[['elastic',14],['rubber',8]]},
 {id:'lockpickplus',nome:'Gazua ++',spawn:'lockpickplus',imagem:'lockpickplus.png',insumos:[['elastic',18],['rubber',13]]},
 {id:'card-illegible',nome:'Cartão Ilegível',spawn:'cardillegible',imagem:'cardillegible.png',insumos:[['elastic',7],['techtrash',8]]},
 {id:'dismantleplus',nome:'Desmanche ++',spawn:'dismantleplus',imagem:'dismantleplus.png',insumos:[['elastic',14],['techtrash',15]],bloqueado:true}
].map(r=>({...r,origem:'PADRÃO DO SEGMENTO'}));
const MEDIC_STANDARD_RECIPES=[
 {id:'adrenalineclandestine',nome:'Adrenalina Clandestina',spawn:'adrenalineclandestine',imagem:'adrenalina.png',insumos:[['syringe',12],['saline',10]]},
 {id:'infectedbandage',nome:'Bandagem Infectada',spawn:'infectedbandage',imagem:'infectedbandage.png',insumos:[['saline',20]]},
 {id:'adrenalineclandestineplus',nome:'Adrenalina Clandestina +',spawn:'adrenalineclandestineplus',imagem:'adrenalineclandestineplus.png',insumos:[['syringe',15],['saline',15]],bloqueado:true}
].map(r=>({...r,origem:'PADRÃO DO SEGMENTO'}));
const MECHANIC_STANDARD_RECIPES=[
 {id:'notebook',nome:'Notebook',spawn:'notebook',imagem:'notebook.png',insumos:[['techtrash',5],['plastic',5]]},
 {id:'racesticketplus',nome:'Ticket de Corrida +',spawn:'racesticketplus',imagem:'racesticketplus.png',insumos:[['paper',10]],bloqueado:true}
].map(r=>({...r,origem:'PADRÃO DO SEGMENTO'}));
const CONTRABANDO_STANDARD_RECIPES=[
 {id:'attachbox',nome:'Caixa de Attachments',spawn:'attachbox',imagem:'attachbox.png',insumos:[['woodlog',3],['sheetmetal',4]]},
 {id:'pager',nome:'Pager',spawn:'pager',imagem:'pager.png',insumos:[['plastic',6],['techtrash',4]]}
].map(r=>({...r,origem:'PADRÃO DO SEGMENTO'}));
const DRUG_COMMON_RECIPES=[
 {id:'hood',nome:'Capuz',spawn:'hood',imagem:'hood.png',insumos:[['tarp',5]]},
 {id:'ballisticplate',nome:'Placa Balística',spawn:'ballisticplate',imagem:'ballisticplate.png',insumos:[['tarp',12],['fibrasin',13]]}
].map(r=>({...r,origem:'PADRÃO DO SEGMENTO'}));
const DRUG_GROUP_RECIPES={
 Drogas01:[{id:'packdrug1',nome:'Pacote Selado de Metadona',spawn:'packdrug1',imagem:'packdrug1.png',insumos:[['alcohol',25],['ziplock',50]]}],
 Drogas03:[{id:'packdrug2',nome:'Pacote Selado de Heroína',spawn:'packdrug2',imagem:'packdrug2.png',insumos:[['acetone',25],['ziplock',50]]}],
 Drogas06:[{id:'packdrug3',nome:'Pacote Selado de Anfetamina',spawn:'packdrug3',imagem:'packdrug3.png',insumos:[['sulfuric',25],['ziplock',50]]}],
 Drogas09:[{id:'packdrug4',nome:'Pacote Selado de Crack',spawn:'packdrug4',imagem:'packdrug4.png',insumos:[['acid',25],['ziplock',50]]}]
};
Object.values(DRUG_GROUP_RECIPES).forEach(list=>list.forEach(r=>r.origem='PADRÃO DO GROUP'));
const GROUP_EXTRA_RECIPES={
 Armas01:[{id:'extra-packdrug8',nome:'Pacote Selado de Cannabis',spawn:'packdrug8',imagem:'packdrug1.png',nivel:4,max:10,origem:'ADQUIRIDO EM LOJA',disponibilidade:'TODAS AS FACÇÕES',insumos:[['kunk',25],['ziplock',50]]}],
 Municao10:[{id:'extra-t54',nome:'T54',spawn:'WEAPON_PISTOL_MK2',imagem:'t54.png',nivel:5,max:10,origem:'CRAFT ADQUIRIDO',insumos:[['pistolbody',22],['sheetmetal',12],['dollar',8500]]}],
 Lavagem02:[{id:'extra-paradise-glock',nome:'Paradise Glock',spawn:'WEAPON_PARADISE_GLOCK',imagem:'glock.png',origem:'CRAFT EXTRA DO GROUP',insumos:[['pistolbody',20],['sheetmetal',21],['dollar',35000]]}],
 Manicomio:[
  {id:'extra-paradise-glock',nome:'Paradise Glock',spawn:'WEAPON_PARADISE_GLOCK',imagem:'glock.png',origem:'CRAFT EXTRA DO GROUP',insumos:[['pistolbody',20],['sheetmetal',21],['dollar',35000]]},
  {id:'extra-lockpickplus',nome:'Gazua ++',spawn:'lockpickplus',imagem:'lockpickplus.png',origem:'CRAFT EXTRA DO GROUP',insumos:[['elastic',17],['rubber',13]]},
  {id:'extra-hood',nome:'Capuz',spawn:'hood',imagem:'hood.png',origem:'CRAFT EXTRA DO GROUP',insumos:[['tarp',5]]}
 ]
};
function segmentKey(v=''){return alvesNorm(String(v)).replace(/[^a-z0-9]/g,'')}
function standardRecipesForGroup(f={}){
 if(f.semCraft||GROUP_BASE_CORRECTIONS?.[f.group]?.state==='SEM_CRAFT')return [];
 const k=segmentKey(f.segmento),g=String(f.group||'');let base=[];
 if(k==='armas')base=ARMAS_STANDARD_RECIPES;
 else if(k==='municao')base=MUNICAO_STANDARD_RECIPES;
 else if(k==='lavagem')base=LAVAGEM_STANDARD_RECIPES;
 else if(k==='desmanche')base=DESMANCHE_STANDARD_RECIPES;
 else if(k==='hospitalilegal'||k==='ilegalmedic')base=MEDIC_STANDARD_RECIPES;
 else if(k==='mecanicaillegal'||k==='ilegalmechanic')base=MECHANIC_STANDARD_RECIPES;
 else if(k==='contrabando')base=CONTRABANDO_STANDARD_RECIPES;
 else if(k==='drogas')base=[...DRUG_COMMON_RECIPES,...(DRUG_GROUP_RECIPES[g]||[])];
 if(g==='Manicomio')base=[...DRUG_COMMON_RECIPES];
 return [...base,...(GROUP_EXTRA_RECIPES[g]||[])].map(recipeNormalize);
}
function mergeRecipeLists(base=[],saved=[]){
 const out=[],idx=new Map();
 [...base,...saved].forEach(raw=>{const r=recipeNormalize(raw),key=String(r.spawn||r.id||r.nome).toLowerCase();if(!key)return;if(idx.has(key))out[idx.get(key)]={...out[idx.get(key)],...r,insumos:(r.insumos?.length?r.insumos:out[idx.get(key)].insumos)};else{idx.set(key,out.length);out.push(r)}});return out;
}
let techDraft={craft:{cds:'',nome:'',receitas:[]},farm:{cds:'',itens:[]},rota:{nome:'',inicio:'',pontos:''},estruturaExtra:{}};
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
 'm1922':'WEAPON_VINTAGEPISTOL.png','pistola m1922':'WEAPON_VINTAGEPISTOL.png',
 't54':'t54.png','pistola t54':'t54.png',
 'deagle':'WEAPON_PISTOL50.png','desert eagle':'WEAPON_PISTOL50.png','pistola desert eagle':'WEAPON_PISTOL50.png',
 'tec-9':'WEAPON_MACHINEPISTOL.png','tec9':'WEAPON_MACHINEPISTOL.png',
 'f2000':'WEAPON_ASSAULTSMG.png','f2000 - mtar.':'WEAPON_ASSAULTSMG.png','f2000 - mtar':'WEAPON_ASSAULTSMG.png',
 'fn l1a1 / fn fal':'WEAPON_FNFAL.png','fn l1a1':'WEAPON_FNFAL.png','fn fal':'WEAPON_FNFAL.png','fal':'WEAPON_FNFAL.png','fall':'WEAPON_FNFAL.png',
 'sig sauer 556':'sigsauer556.png','g3 - sig sauer':'sigsauer556.png',
 'ak-102':'ak102.png','ak102':'ak102.png',
 'ak-74n':'ak74n.png','ak74n':'ak74n.png'
};
function canonicalProductImage(spawn='',nome='',imagem=''){
 const sp=String(spawn||'').trim().toLowerCase();
 if(PRODUCT_IMAGE_BY_SPAWN[sp])return PRODUCT_IMAGE_BY_SPAWN[sp];
 const nm=alvesNorm(String(nome||'')).trim();
 if(PRODUCT_IMAGE_BY_NAME[nm])return PRODUCT_IMAGE_BY_NAME[nm];
 return String(imagem||'').trim()||String(spawn||'').trim()+'.png';
}
function itemImg(spawn='',imagem='',nome=''){const f=canonicalProductImage(spawn,nome,imagem);return ITEM_IMG_BASE+encodeURIComponent(f).replace(/%2F/gi,'/')}
function recipeNormalize(r={}){return {id:r.id||('r_'+Math.random().toString(36).slice(2,9)),nome:r.nome||'',spawn:r.spawn||'',imagem:canonicalProductImage(r.spawn,r.nome,r.imagem),nivel:r.nivel||'',max:r.max||'',origem:r.origem||'EXTRA DO GROUP',disponibilidade:r.disponibilidade||'',insumos:(r.insumos||[]).map(x=>Array.isArray(x)?{spawn:x[0],qtd:x[1],nome:ITEM_META[x[0]]?.nome||x[0],imagem:ITEM_META[x[0]]?.imagem||''}:{spawn:x.spawn||'',qtd:x.qtd??'',nome:x.nome||ITEM_META[x.spawn]?.nome||x.spawn||'',imagem:x.imagem||ITEM_META[x.spawn]?.imagem||''})};}
const NON_ROUTE_CRAFT_ITEMS=new Set(['dollar','money','cash','dirtymoney','black_money']);
function farmItemsFromCraft(receitas=[]){
 const map=new Map();
 (receitas||[]).forEach(r=>(r.insumos||[]).forEach(x=>{
  const spawn=String(x.spawn||'').trim();if(!spawn||NON_ROUTE_CRAFT_ITEMS.has(spawn.toLowerCase()))return;
  const key=spawn.toLowerCase(),cur=map.get(key)||{nome:x.nome||ITEM_META[spawn]?.nome||spawn,spawn,imagem:x.imagem||ITEM_META[spawn]?.imagem||'',origem:'CRAFT',receitas:[],quantidades:[]};
  if(r.nome&&!cur.receitas.includes(r.nome))cur.receitas.push(r.nome);if(x.qtd!==''&&x.qtd!=null&&!cur.quantidades.includes(String(x.qtd)))cur.quantidades.push(String(x.qtd));map.set(key,cur);
 }));
 return [...map.values()].map(x=>({...x,qtd:'',detalhe:`Usado em ${x.receitas.length} receita(s)${x.quantidades.length?' • necessidade: x'+x.quantidades.join('/x'):''}`}));
}
function syncFarmWithCraft(profile=techDraft){
 if(!profile?.craft||!profile?.farm)return profile;
 const auto=farmItemsFromCraft(profile.craft.receitas||[]),manual=(profile.farm.itens||[]).filter(x=>String(x.origem||'').toUpperCase()!=='CRAFT');
 const autoKeys=new Set(auto.map(x=>String(x.spawn||'').toLowerCase()));
 profile.farm.itens=[...auto,...manual.filter(x=>!autoKeys.has(String(x.spawn||'').toLowerCase()))];
 return profile;
}
function defaultTechProfile(f={}){
 const b=f.beneficios||{},base=standardRecipesForGroup(f);
 const names={armas:'Armas de Pequeno, Médio e Grande Calibre',municao:'Munições e Explosivos',lavagem:'Lavagem / Pendrives',desmanche:'Desmanche',drogas:'Drogas',hospitalilegal:'Hospital Ilegal',ilegalmedic:'Hospital Ilegal',mecanicaillegal:'Mecânica Ilegal',ilegalmechanic:'Mecânica Ilegal',contrabando:'Contrabando'};
 const out={craft:{cds:b.craft||'',nome:names[segmentKey(f.segmento)]||'',receitas:base},farm:{cds:b.farm||'',itens:[]},rota:{nome:b.rotaExclusiva?`RotaExclusiva${f.group||''}`:'',inicio:'',pontos:b.rotaBlips||''},estruturaExtra:{}};return syncFarmWithCraft(out);
}
function mergedTechProfile(f={}){
 const d=defaultTechProfile(f),p=clonePlain(f.perfilTecnico||{})||{};
 const semCraft=!!(f.semCraft||GROUP_BASE_CORRECTIONS?.[f.group]?.state==='SEM_CRAFT'||p?.craft?.ativo===false);
 const saved=Array.isArray(p?.craft?.receitas)?p.craft.receitas:[];
 const receitas=semCraft?[]:mergeRecipeLists(d.craft.receitas,saved);
 const out={craft:{cds:p?.craft?.cds??d.craft.cds,nome:p?.craft?.nome??d.craft.nome,ativo:!semCraft,receitas},farm:{cds:p?.farm?.cds??d.farm.cds,itens:Array.isArray(p?.farm?.itens)?p.farm.itens.map(x=>({...x})):[]},rota:{nome:p?.rota?.nome??d.rota.nome,inicio:p?.rota?.inicio??d.rota.inicio,pontos:p?.rota?.pontos??d.rota.pontos,origem:p?.rota?.origem||''},estruturaExtra:{...(d.estruturaExtra||{}),...(p?.estruturaExtra||{})}};return syncFarmWithCraft(out);
}
function renderTechProfile(f){
 techDraft=mergedTechProfile(f);$('#fTechCraftCds').value=techDraft.craft.cds||'';$('#fTechCraftNome').value=techDraft.craft.nome||'';$('#fTechFarmCds').value=techDraft.farm.cds||'';$('#fTechRouteName').value=techDraft.rota.nome||'';$('#fTechRouteStart').value=techDraft.rota.inicio||'';$('#fTechRoutePoints').value=techDraft.rota.pontos||'';renderCraftRecipes();renderFarmItems();renderRouteOverview();renderStructureSnapshot(f);renderConnectedRequests();
}
function getTechProfileFromForm(){
 if(!techDraft)techDraft={craft:{receitas:[]},farm:{itens:[]},rota:{}};
 techDraft.craft.cds=$('#fTechCraftCds')?.value.trim()||'';techDraft.craft.nome=$('#fTechCraftNome')?.value.trim()||'';techDraft.farm.cds=$('#fTechFarmCds')?.value.trim()||'';techDraft.rota.nome=$('#fTechRouteName')?.value.trim()||'';techDraft.rota.inicio=$('#fTechRouteStart')?.value.trim()||'';techDraft.rota.pontos=$('#fTechRoutePoints')?.value.trim()||'';
 // manter compatibilidade com campos legados da estrutura
 if($('#fCraft'))$('#fCraft').value=techDraft.craft.cds;if($('#fFarm'))$('#fFarm').value=techDraft.farm.cds;if($('#fRotaBlips'))$('#fRotaBlips').value=techDraft.rota.pontos;techDraft.rota.nome=$('#fRotaExclusiva')?.checked?`RotaExclusiva${$('#fGroup')?.value||''}`:'';
 syncFarmWithCraft(techDraft);renderFarmItems();return clonePlain(techDraft);
}
function recipeCard(r,i){const ins=(r.insumos||[]).map((x,j)=>`<div class="tech-ingredient"><img src="${esc(itemImg(x.spawn,x.imagem))}" onerror="this.style.opacity=.18"><div><b>${esc(x.nome||x.spawn||'Item')}</b><span>${esc(x.spawn||'—')} • x${esc(x.qtd)}</span></div><button type="button" class="tech-remove admin-only" data-remove-ing="${i}:${j}" title="Remover">×</button></div>`).join('');return `<article class="tech-recipe-card"><div class="tech-recipe-art"><img src="${esc(itemImg(r.spawn,r.imagem,r.nome))}" onerror="this.style.opacity=.18"></div><div class="tech-recipe-body"><div class="tech-recipe-title"><div><b>${esc(r.nome||'Receita')}</b><span>${esc(r.spawn||'SEM SPAWN')}</span></div><em>${esc(r.origem||'GROUP')}</em></div><div class="tech-recipe-kpis"><span>NÍVEL <b>${esc(r.nivel||'—')}</b></span><span>MÁX. <b>${esc(r.max||'—')}</b></span><span>INSUMOS <b>${r.insumos?.length||0}</b></span></div><div class="tech-ingredients">${ins||'<small class="muted">Sem insumos cadastrados.</small>'}</div><div class="tech-recipe-actions"><button type="button" class="mini-btn" data-edit-recipe="${i}">ABRIR RECEITA</button><button type="button" class="mini-btn danger admin-only" data-remove-recipe="${i}">REMOVER DO GROUP</button></div></div></article>`}
function renderCraftRecipes(){const box=$('#groupCraftRecipes');if(!box)return;const rs=techDraft?.craft?.receitas||[];$('#techCraftSummary').textContent=`${rs.length} receita(s) vinculada(s) a este Group`;box.innerHTML=rs.length?rs.map(recipeCard).join(''):'<div class="delivery-no-change">Nenhuma receita vinculada a este Group.</div>';box.querySelectorAll('[data-remove-recipe]').forEach(b=>b.onclick=()=>{techDraft.craft.receitas.splice(+b.dataset.removeRecipe,1);syncFarmWithCraft();renderCraftRecipes();renderFarmItems();updateDeliveryPreview();renderConnectedRequests()});box.querySelectorAll('[data-edit-recipe]').forEach(b=>b.onclick=()=>editRecipe(+b.dataset.editRecipe));box.querySelectorAll('[data-remove-ing]').forEach(b=>b.onclick=()=>{const [ri,ii]=b.dataset.removeIng.split(':').map(Number);techDraft.craft.receitas[ri].insumos.splice(ii,1);syncFarmWithCraft();renderCraftRecipes();renderFarmItems();updateDeliveryPreview();renderConnectedRequests()});}
function ingredientEditorRow(x={},i=0){const sp=String(x.spawn||'');return `<div class="ingredient-editor-row" data-ing-row="${i}"><div class="ingredient-editor-art"><img src="${esc(itemImg(sp,x.imagem,x.nome))}" onerror="this.style.opacity=.18"></div><label>Item<input data-ing-name value="${esc(x.nome||ITEM_META[sp]?.nome||sp)}" placeholder="Nome do insumo"></label><label>Spawn<input data-ing-spawn value="${esc(sp)}" placeholder="spawn_do_item"></label><label>Quantidade<input data-ing-qty value="${esc(x.qtd||'')}" placeholder="Ex.: 22"></label><button type="button" class="tech-remove ingredient-remove" data-ing-remove title="Remover insumo">×</button></div>`}
function renderIngredientEditor(items=[]){const box=$('#recipeIngredientRows');if(!box)return;box.innerHTML=items.length?items.map(ingredientEditorRow).join(''):'<div class="route-empty"><b>SEM INSUMOS</b><span>Adicione os itens necessários para esta receita.</span></div>';box.querySelectorAll('[data-ing-remove]').forEach((b,i)=>b.onclick=()=>{const rows=readIngredientEditor();rows.splice(i,1);renderIngredientEditor(rows)});box.querySelectorAll('[data-ing-spawn]').forEach(inp=>inp.onchange=()=>{const row=inp.closest('[data-ing-row]'),sp=inp.value.trim(),name=row?.querySelector('[data-ing-name]'),img=row?.querySelector('img');if(name&&!name.value.trim())name.value=ITEM_META[sp]?.nome||sp;if(img)img.src=itemImg(sp,ITEM_META[sp]?.imagem||'',name?.value||sp)})}
function readIngredientEditor(){return [...document.querySelectorAll('#recipeIngredientRows [data-ing-row]')].map(row=>{const sp=row.querySelector('[data-ing-spawn]')?.value.trim()||'';return {spawn:sp,nome:row.querySelector('[data-ing-name]')?.value.trim()||ITEM_META[sp]?.nome||sp,qtd:row.querySelector('[data-ing-qty]')?.value.trim()||'',imagem:ITEM_META[sp]?.imagem||''}}).filter(x=>x.spawn||x.nome)}
function closeRecipeEditor(){ $('#recipeEditorModal')?.classList.add('hidden') }
function editRecipe(i){const r=techDraft?.craft?.receitas?.[i];if(!r)return;$('#recipeEditorIndex').value=String(i);$('#recipeEditorName').value=r.nome||'';$('#recipeEditorSpawn').value=r.spawn||'';$('#recipeEditorLevel').value=r.nivel||'';$('#recipeEditorMax').value=r.max||'';if($('#recipeEditorOrigin'))$('#recipeEditorOrigin').value=r.origem||'EXTRA DO GROUP';$('#recipeEditorTitle').textContent=r.nome||'RECEITA DO GROUP';$('#recipeEditorImage').src=itemImg(r.spawn,r.imagem,r.nome);renderIngredientEditor(r.insumos||[]);$('#recipeEditorModal').classList.remove('hidden')}
function addRecipe(){const r=recipeNormalize({origem:'EXTRA DO GROUP'});techDraft.craft.receitas.push(r);editRecipe(techDraft.craft.receitas.length-1)}
function farmItemCard(x,i){const auto=String(x.origem||'').toUpperCase()==='CRAFT';return `<div class="tech-farm-item route-item-card"><div class="route-item-art"><img src="${esc(itemImg(x.spawn,x.imagem))}" onerror="this.style.opacity=.18"></div><div class="route-item-copy"><b>${esc(x.nome||x.spawn||'Item')}</b><span>${esc(x.spawn||'—')}</span><small>${auto?'VINCULADO AO CRAFT':esc(x.qtd||x.detalhe||'ITEM MANUAL')}</small></div><div class="route-item-actions"><button type="button" class="mini-btn" data-edit-farm="${i}">VER ITEM</button>${auto?'':`<button type="button" class="tech-remove admin-only" data-remove-farm="${i}">×</button>`}</div></div>`}
function renderFarmItems(){const box=$('#groupFarmItems');if(!box)return;const xs=techDraft?.farm?.itens||[];box.innerHTML=xs.length?xs.map(farmItemCard).join(''):'<div class="route-empty"><b>NENHUM ITEM VINCULADO</b><span>Cadastre receitas no Craft para os insumos aparecerem automaticamente aqui.</span></div>';box.querySelectorAll('[data-remove-farm]').forEach(b=>b.onclick=()=>{techDraft.farm.itens.splice(+b.dataset.removeFarm,1);renderFarmItems();renderConnectedRequests();updateDeliveryPreview()});box.querySelectorAll('[data-edit-farm]').forEach(b=>b.onclick=()=>editFarmItem(+b.dataset.editFarm));}
function closeFarmEditor(){ $('#farmEditorModal')?.classList.add('hidden') }
function editFarmItem(i){const x=techDraft?.farm?.itens?.[i];if(!x)return;const auto=String(x.origem||'').toUpperCase()==='CRAFT';$('#farmEditorIndex').value=String(i);$('#farmEditorName').value=x.nome||'';$('#farmEditorSpawn').value=x.spawn||'';$('#farmEditorQty').value=x.qtd||x.detalhe||'';$('#farmEditorTitle').textContent=x.nome||'ITEM DO FARM';$('#farmEditorImage').src=itemImg(x.spawn,x.imagem,x.nome);$('#farmEditorName').disabled=auto;$('#farmEditorSpawn').disabled=auto;$('#farmEditorQty').disabled=auto;$('#farmEditorSave').classList.toggle('hidden',auto);$('#farmEditorHelp').textContent=auto?'Este item é gerado automaticamente pelos insumos do Craft. Para alterá-lo, edite a receita de origem.':'Edite os dados do item manual da rota.';const info=$('#farmLinkedInfo');if(auto){info.classList.remove('hidden');info.innerHTML=`<span>VÍNCULO AUTOMÁTICO</span><b>CRAFT → FARM</b><p>${esc(x.detalhe||'Este insumo é necessário em uma ou mais receitas do Group.')}</p>`}else info.classList.add('hidden');$('#farmEditorModal').classList.remove('hidden')}
function addFarmItem(){techDraft.farm.itens.push({nome:'',spawn:'',qtd:'',imagem:'',origem:'MANUAL'});editFarmItem(techDraft.farm.itens.length-1)}
function routePointList(raw=''){
 const txt=String(raw||'').trim();if(!txt)return [];
 let pts=txt.split(/\r?\n|·/).map(x=>x.trim()).filter(Boolean);
 if(pts.length<=1){const found=txt.match(/\{?\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?(?:\s*,\s*-?\d+(?:\.\d+)?)?\s*\}?/g);if(found?.length)pts=found.map(x=>x.trim())}
 return pts;
}
function setRouteExclusive(value){
 const cb=$('#fRotaExclusiva');if(!cb)return;cb.checked=!!value;
 if(techDraft?.rota)techDraft.rota.nome=cb.checked?`RotaExclusiva${$('#fGroup')?.value||''}`:'';
 renderRouteOverview();updateDeliveryPreview();renderConnectedRequests();
}
function renderRouteOverview(){
 const exclusive=!!$('#fRotaExclusiva')?.checked,pts=routePointList(techDraft?.rota?.pontos||$('#fTechRoutePoints')?.value||''),start=techDraft?.rota?.inicio||$('#fTechRouteStart')?.value||'';
 $('#routeTypeLabel')&&( $('#routeTypeLabel').textContent=exclusive?'ROTA EXCLUSIVA':'ROTA PADRÃO');
 $('#routeTypeHelp')&&( $('#routeTypeHelp').textContent=exclusive?'Este Group possui uma rota própria de farm.':'Utiliza a rota padrão do segmento.');
 $('#routePointCount')&&( $('#routePointCount').textContent=exclusive?String(pts.length):'—');
 $('#routePointHint')&&( $('#routePointHint').textContent=exclusive?(pts.length?`${pts.length} coordenada(s) cadastrada(s).`:'Ainda sem CDS cadastradas.'):'Não se aplica à rota padrão.');
 $('#routeStartDisplay')&&( $('#routeStartDisplay').textContent=start||'—');
 document.querySelectorAll('[data-route-exclusive]').forEach(b=>b.classList.toggle('active',String(+exclusive)===b.dataset.routeExclusive));
 const ex=$('#exclusiveRouteBox');if(ex)ex.classList.toggle('hidden',!exclusive);
 $('#exclusiveRouteSummary')&&( $('#exclusiveRouteSummary').textContent=`${pts.length} CDS cadastrada${pts.length===1?'':'s'}`);
 const list=$('#routePointsList');if(list)list.innerHTML=pts.length?pts.map((pt,i)=>`<div class="route-point-row"><span>${String(i+1).padStart(2,'0')}</span><code>${esc(pt)}</code></div>`).join(''):'<div class="route-empty"><b>SEM CDS</b><span>Adicione as coordenadas da rota exclusiva no editor abaixo.</span></div>';
}
function toggleRoutePoints(){const drawer=$('#routePointsDrawer'),btn=$('#routePointsToggleBtn');if(!drawer||!btn)return;const willOpen=drawer.classList.contains('hidden');drawer.classList.toggle('hidden',!willOpen);btn.textContent=willOpen?'OCULTAR CDS DA ROTA':'VER CDS DA ROTA';}
function renderStructureSnapshot(f=currentFactionFromForm()){const b=f?.beneficios||getFormBenefits(),t=techDraft||mergedTechProfile(f),items=[];const add=(n,v)=>{if(v)items.push([n,v])};add('Craft',t.craft?.cds||b.craft);add('Farm / Início',t.rota?.inicio||t.farm?.cds||b.farm);add('Tipo da Rota',b.rotaExclusiva?`Exclusiva • ${routePointList(t.rota?.pontos||b.rotaBlips).length} CDS`:'Padrão');add('Garagem Pública',[b.garagemPublicaBlip,b.garagemPublicaSpawn].filter(Boolean).join(' / '));add('Garagem VIP',[b.garagemVipBlip,b.garagemVipSpawn].filter(Boolean).join(' / '));add('Heliponto',[b.helipontoBlip,b.helipontoSpawn].filter(Boolean).join(' / '));add('Rádio',b.radio);add('Baú',b.bau);add('Loja de Roupas',b.lojaRoupas);add('Barbearia',b.barbearia);add('Tatuagem',b.tatuagem);add('Shop Exclusivo',b.shopExclusivo);add('Arena',b.arena);add('Telão',b.telaoCds||b.telaoNome);Object.entries(t.estruturaExtra||{}).forEach(([k,v])=>{if(v&&k!=='fontePerfil')add(({coordenadaBase:'Coordenada Base',garagemDeluxe:'Garagem Deluxe',shopDeluxe:'Shop Deluxe',academia:'Academia',bar:'Bar'}[k]||k),v)});const box=$('#groupStructureSnapshot');if(box)box.innerHTML=items.length?items.map(([n,v])=>`<div class="structure-chip"><span>${esc(n)}</span><b>${esc(v)}</b></div>`).join(''):'<div class="delivery-no-change">Nenhuma estrutura técnica cadastrada.</div>';}
function techChanged(oldF,newF){return JSON.stringify(mergedTechProfile(oldF))!==JSON.stringify(newF.perfilTecnico||mergedTechProfile(newF))}
function techAutoRequests(f=currentFactionFromForm()){
 const old=faccoes.find(x=>x.group===f.group)||{},now=f.perfilTecnico||getTechProfileFromForm(),oldT=mergedTechProfile(old),out=[];
 if(JSON.stringify(oldT.craft)!==JSON.stringify(now.craft)){
  const lines=['Assunto: Atualização do Craft do Group','','Solicitação:','',`- Atualizar o Craft do Group ${f.group};`,now.craft.cds?`- CDS do Craft: ${fmtCds(now.craft.cds)}`:'','', '- Produtos / receitas:'];
  (now.craft.receitas||[]).forEach(r=>{lines.push(`- ${r.nome}${r.spawn?` (${r.spawn})`:''}${r.nivel?` | Nível ${r.nivel}`:''}${r.max?` | Máx. ${r.max}`:''}`);lines.push(`  Receita: ${(r.insumos||[]).map(x=>`${x.nome||x.spawn} x${x.qtd}`).join(' + ')||'Sem insumos cadastrados'}`)});lines.push('',`- Permissão: ${f.group}.`);out.push({tipo:'ITENS',titulo:'Atualização de Craft / Receitas',texto:lines.filter((x,i)=>x!==''||lines[i-1]!=='').join('\n')});
 }
 if(JSON.stringify(oldT.farm)!==JSON.stringify(now.farm)||JSON.stringify(oldT.rota)!==JSON.stringify(now.rota)){
  const pts=String(now.rota?.pontos||'').split(/\r?\n|·/).map(x=>x.trim()).filter(Boolean),routeStart=String(now.rota?.inicio||'').trim(),items=(now.farm?.itens||[]).map(x=>`- ${x.nome||x.spawn}${x.spawn?` (${x.spawn})`:''}${x.qtd?` — ${x.qtd}`:''}${x.detalhe?` — ${x.detalhe}`:''}`);
  out.push({tipo:'ROTA_FARM',titulo:'Farm / Rota do Group',texto:['Assunto: Ativação / atualização de rota de farm exclusiva','','Solicitação:','',`- Group: ${f.group}`,now.farm?.cds?`- Farm: ${fmtCds(now.farm.cds)}`:'',now.rota?.nome?`- Rota: ${now.rota.nome}`:'',routeStart?`- Início da rota: ${fmtCds(routeStart)}`:'','',...(items.length?['- Itens do Farm:',...items,'']:[]),'- Blips da rota:',...(pts.length?pts:['{ CDS },'])].filter(Boolean).join('\n')});
 }
 return out;
}
const _autoDeliveryRequestsV62=autoDeliveryRequests;autoDeliveryRequests=function(f=currentFactionFromForm()){return [..._autoDeliveryRequestsV62(f),...techAutoRequests(f)]};
const _updateDeliveryPreviewV62=updateDeliveryPreview;updateDeliveryPreview=function(){getTechProfileFromForm();_updateDeliveryPreviewV62();try{renderStructureSnapshot(currentFactionFromForm());renderConnectedRequests()}catch{}};
function requestFingerprint(r={}){return `${String(r.group||'').toUpperCase()}|${String(r.tipo||'').toUpperCase()}|${String(r.texto||'').replace(/\s+/g,' ').trim().toLowerCase()}`}
async function archiveTechnicalRequest(r,f={},origem='ALTERACAO_GROUP'){
 const group=f.group||r.group||'',texto=r.texto||'',tipo=r.tipo||'GERAL';if(!group||!texto)return null;
 const fp=requestFingerprint({group,tipo,texto}),dup=requestRecords.find(x=>x.status==='PENDENTE'&&x.fingerprint===fp);if(dup)return dup;
 const payload={isModelo:false,status:'PENDENTE',tipo,group,faccao:f.faccao||'',assunto:r.titulo||r.assunto||requestTypeName(tipo),titulo:r.titulo||'',texto,origem,solicitadoPor:currentUser?.email||'',createdAt:serverTimestamp(),createdAtText:new Date().toISOString(),createdBy:currentUser?.email||'',fingerprint:fp};
 const ref=await addDoc(reqCol,payload),item={id:ref.id,...clonePlain(payload),createdAt:null};requestRecords.unshift(item);return item;
}
function fmtRequestWhen(r={}){const d=r.createdAtText?new Date(r.createdAtText):null;return d&&!isNaN(d)?d.toLocaleString('pt-BR'):'—'}
async function copyArchivedRequest(id,btn){const r=requestRecords.find(x=>x.id===id);if(!r?.texto)return;try{await navigator.clipboard.writeText(r.texto);const o=btn.textContent;btn.textContent='COPIADO ✓';setTimeout(()=>btn.textContent=o,1200)}catch{}}
function renderConnectedRequests(){
 const box=$('#groupConnectedRequests');if(!box)return;const f=currentFactionFromForm(),group=f?.group||$('#fGroup')?.value||'';let pending=[];try{pending=autoDeliveryRequests(f)}catch{}
 const archived=requestRecords.filter(x=>x.group===group).slice(0,60);
 const pendingHtml=pending.length?`<div class="request-archive-section"><div class="request-archive-head"><b>DEMANDAS GERADAS PELAS ALTERAÇÕES ATUAIS</b><span>${pending.length} pendente(s) de salvar</span></div>${pending.map((r,i)=>`<article class="delivery-request-card request-live"><div><b>${i+1}. ${esc(r.titulo)}</b><span>${esc(r.tipo)}</span></div><pre>${esc(r.texto)}</pre></article>`).join('')}</div>`:'<div class="delivery-no-change">Nenhuma nova demanda pelas alterações atuais.</div>';
 const archiveHtml=archived.length?`<div class="request-archive-section"><div class="request-archive-head"><b>ARQUIVO DE SOLICITAÇÕES DO GROUP</b><span>${archived.length} registro(s)</span></div>${archived.map(r=>`<article class="delivery-request-card archived-request"><div><b>${esc(r.assunto||r.titulo||requestTypeName(r.tipo))}</b><span class="req-status s-${String(r.status||'PENDENTE').toLowerCase()}">${esc(r.status||'PENDENTE')}</span></div><div class="request-audit-meta">${esc(fmtRequestWhen(r))} • ${esc(r.solicitadoPor||r.createdBy||'—')} • ${esc(r.origem||'—')}</div><pre>${esc(r.texto||'')}</pre><button type="button" class="mini-btn copy-archived-request" data-request-id="${esc(r.id)}">COPIAR</button></article>`).join('')}</div>`:'<div class="delivery-no-change">Este Group ainda não possui solicitações arquivadas.</div>';
 box.innerHTML=pendingHtml+archiveHtml;box.querySelectorAll('.copy-archived-request').forEach(b=>b.onclick=()=>copyArchivedRequest(b.dataset.requestId,b));
}
$('#addCraftRecipeBtn')?.addEventListener('click',addRecipe);$('#addFarmItemBtn')?.addEventListener('click',addFarmItem);$('#routePointsToggleBtn')?.addEventListener('click',toggleRoutePoints);document.querySelectorAll('[data-route-exclusive]').forEach(b=>b.addEventListener('click',()=>setRouteExclusive(b.dataset.routeExclusive==='1')));$('#fRotaExclusiva')?.addEventListener('change',renderRouteOverview);
['fTechCraftCds','fTechCraftNome','fTechFarmCds','fTechRouteName','fTechRouteStart','fTechRoutePoints'].forEach(id=>$('#'+id)?.addEventListener('input',()=>{getTechProfileFromForm();renderRouteOverview();renderConnectedRequests();renderStructureSnapshot(currentFactionFromForm());}));
document.querySelectorAll('.tech-tab').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.tech-tab').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.tech-panel').forEach(p=>p.classList.toggle('active',p.dataset.techPanel===b.dataset.techTab));if(b.dataset.techTab==='farm')renderRouteOverview();if(b.dataset.techTab==='estrutura')renderStructureSnapshot(currentFactionFromForm());if(b.dataset.techTab==='solicitacoes')renderConnectedRequests()}));

// Alvesinho usa o mesmo perfil do Group — sem base paralela.
const _alvesAnswerV63Base=alvesAnswer;alvesAnswer=function(question=''){
 const q=alvesNorm(question),g=alvesFindGroup(question);if(g){const t=mergedTechProfile(g);
  if(q.includes('craft')||q.includes('fabric')||q.includes('receita')){const rs=t.craft?.receitas||[];const hit=rs.find(r=>q.includes(alvesNorm(r.nome))||q.includes(alvesNorm(r.spawn)));if(hit)return {text:`${hit.nome}${hit.spawn?' ('+hit.spawn+')':''}\n${hit.nivel?'Nível: '+hit.nivel+' • ':''}${hit.max?'Máx.: '+hit.max:''}\nReceita / insumos:\n${(hit.insumos||[]).map(x=>`• ${x.nome||x.spawn} x${x.qtd}`).join('\n')||'• Sem insumos cadastrados'}`,refs:[g.group,'Perfil Técnico','Craft']};return {text:rs.length?`Craft de ${g.group} (${rs.length} receita(s)):\n${rs.map(r=>`• ${r.nome}${r.spawn?' ('+r.spawn+')':''}`).join('\n')}`:`${g.group} não possui receitas de Craft cadastradas.`,refs:[g.group,'Perfil Técnico','Craft']};}
  if((q.includes('farm')||q.includes('insumo'))&&!q.includes('receita')){const xs=t.farm?.itens||[];return {text:xs.length?`Farm / Insumos de ${g.group}:\n${xs.map(x=>`• ${x.nome||x.spawn}${x.spawn?' ('+x.spawn+')':''}${x.qtd?' — '+x.qtd:''}${x.detalhe?' — '+x.detalhe:''}`).join('\n')}`:`Nenhum insumo de Craft está disponível na rota de ${g.group}.`,refs:[g.group,'Perfil Técnico','Farm']};}
  if(q.includes('rota')){const xs=t.farm?.itens||[],exclusive=!!g.beneficios?.rotaExclusiva,pts=routePointList(t.rota?.pontos||g.beneficios?.rotaBlips||'');return {text:`Rota de ${g.group}:\nTipo: ${exclusive?'EXCLUSIVA':'PADRÃO'}\n${t.rota?.inicio?`Início: ${t.rota.inicio}\n`:''}${exclusive?`CDS da rota exclusiva: ${pts.length} ponto(s) cadastrado(s).\n`:''}Itens coletados para o Craft:\n${xs.length?xs.map(x=>`• ${x.nome||x.spawn}${x.spawn?' ('+x.spawn+')':''}`).join('\n'):'• Nenhum insumo de Craft vinculado.'}`,refs:[g.group,'Perfil Técnico','Rota','Craft']};}
 }
 return _alvesAnswerV63Base(question);
};

// HIGH OS V6.4 · ação de atualização da base técnica
$('#updateProfilesBtn')?.addEventListener('click',updateOfficialGroupProfiles);

// HIGH OS V6.6 · Farm/Rota sincronizados automaticamente com os insumos do Craft.

// HIGH OS V6.7 · Perfil do Group em página + Rota Padrão/Exclusiva organizada.

// HIGH OS V6.9 · Fluxo correto: Perfil → comparação → Solicitação. Exceção: Rota Exclusiva, em que a Solicitação com CDS do takefarm alimenta o Perfil Técnico.

// HIGH OS V7.2 · Perfil Operacional completo do Group/QG
const OPERATIONAL_PROFILE_VERSION='07/09/2026 · Perfil Operacional V7.2';
const OP_KNOWN_EXTRAS={
 Armas02:{telao:{ativo:true,tipo:'Hall',modelo:'paradise_telao01a',postit:'2685.14,3386.41,61.70',cds:'2684.81,3386.92,58.82,164.41',permissao:'Armas02',sons:['2662.59,3397.22,58.82,286.3','2691.1,3386.87,60.57,331.66','2720.27,3419.87,59.08,107.72','2654.06,3417.68,57.71,187.09']}},
 Desmanche07:{lojaFac:{cds:'2189.12,4670.27,37.54,325.99'},barbearia:{cds:'2268.74,4607.04,37.59,59.53'},tatuagem:{cds:'2288.37,4562.1,37.66,323.15'},roupas:{cds:'2273.21,4608.11,37.59,130.4'},garagens:[{tipo:'PUBLICA',blip:'2193.82,4616.75,39.38,147.41',spawn:'2192.91,4609.84,38.75,325.99'},{tipo:'PUBLICA_2',blip:'2196.19,4617.57,39.38,136.07',spawn:'2194.11,4610.75,39.38,136.07'},{tipo:'SERVICO',blip:'2222.68,4612.5,37.54,345.83',spawn:'2227.86,4612.09,37.31,56.7'}],helipontos:[{blip:'2199.82,4614.74,39.38,133.23',spawn:'2194.11,4610.75,39.38,136.07'}]},
 Municao10:{telao:{ativo:false,tipo:'',modelo:'',postit:'',cds:'',permissao:'Municao10',sons:[]}}
};
function opPair(v=''){const parts=String(v||'').replace(/\t/g,' ').split(/\s*\/\s*/).map(x=>x.trim()).filter(Boolean);return {blip:parts[0]||'',spawn:parts[1]||''}}
function opBlank(){return {localizacao:{nome:'',cdsPrincipal:''},lojaFac:{cds:''},bar:{cds:''},barbearia:{cds:''},tatuagem:{cds:''},roupas:{cds:''},uniforme:{local:'',arquivo:''},arena:{cds:''},garagens:[],helipontos:[],blindados:{vagas:'',blip:'',spawn:'',veiculos:''},telao:{ativo:false,tipo:'',modelo:'',postit:'',cds:'',permissao:'',sons:['','','','']}}}
function opMerge(a={},b={}){const out={...opBlank(),...clonePlain(a||{}),...clonePlain(b||{})};['localizacao','lojaFac','bar','barbearia','tatuagem','roupas','uniforme','arena','blindados','telao'].forEach(k=>out[k]={...(opBlank()[k]||{}),...(a?.[k]||{}),...(b?.[k]||{})});out.garagens=Array.isArray(b?.garagens)&&b.garagens.length?clonePlain(b.garagens):Array.isArray(a?.garagens)?clonePlain(a.garagens):[];out.helipontos=Array.isArray(b?.helipontos)&&b.helipontos.length?clonePlain(b.helipontos):Array.isArray(a?.helipontos)?clonePlain(a.helipontos):[];out.telao.sons=[...(b?.telao?.sons?.length?b.telao.sons:(a?.telao?.sons||[])),'','','',''].slice(0,4);return out}
function operationalFromExisting(f={}){
 const o=opBlank(),b=f.beneficios||{},src=f.perfilFonte||GROUP_PROFILE_SOURCE?.[f.group]||{},corr=GROUP_BASE_CORRECTIONS?.[f.group]||{};
 o.localizacao.nome=f.qg||cleanProfileValue(src.LOCAL||'');o.localizacao.cdsPrincipal=corr.cds||f.perfilBase?.cds||f.cds||cleanProfileValue(src.COORDENADA||'');
 o.barbearia.cds=b.barbearia||cleanProfileValue(src.BARBEARIA||'');o.tatuagem.cds=b.tatuagem||cleanProfileValue(src.TATUAGEM||'');o.roupas.cds=b.lojaRoupas||cleanProfileValue(src['LOJA DE ROUPAS']||'');o.lojaFac.cds=b.shopExclusivo||cleanProfileValue(src['SHOP EXCLUSIVO']||src['SHOP DELUXE']||'');o.bar.cds=cleanProfileValue(f.perfilTecnico?.estruturaExtra?.bar||src.BAR||'');o.arena.cds=b.arena||cleanProfileValue(src.ARENA||'');
 const pub=opPair(cleanProfileValue(src['GARAGEM PUBLICA']||'')),vip=opPair(cleanProfileValue(src['GARAGEM VIP FAC']||'')),deluxe=opPair(cleanProfileValue(src['GARAGEM DELUXE']||''));
 if(b.garagemPublicaBlip||pub.blip)o.garagens.push({tipo:'PUBLICA',blip:b.garagemPublicaBlip||pub.blip,spawn:b.garagemPublicaSpawn||pub.spawn,veiculos:'',vagas:''});
 if(b.garagemVipBlip||vip.blip)o.garagens.push({tipo:'FACCAO',blip:b.garagemVipBlip||vip.blip,spawn:b.garagemVipSpawn||vip.spawn,veiculos:b.garagemVipVeiculos||'',vagas:''});
 if(deluxe.blip)o.garagens.push({tipo:'SERVICO',blip:deluxe.blip,spawn:deluxe.spawn,veiculos:'',vagas:''});
 if(b.helipontoBlip||b.helipontoSpawn)o.helipontos=[{blip:b.helipontoBlip||'',spawn:b.helipontoSpawn||''}];
 o.telao={ativo:!!b.telao,tipo:b.telao?'Hall':'',modelo:b.telaoNome||'',postit:b.telaoPostit||'',cds:b.telaoCds||'',permissao:f.group||'',sons:Array.isArray(b.telaoSons)?b.telaoSons:['','','','']};
 return opMerge(o,OP_KNOWN_EXTRAS[f.group]||{});
}
const _mergedTechProfileV71=mergedTechProfile;mergedTechProfile=function(f={}){const out=_mergedTechProfileV71(f);out.operacional=opMerge(operationalFromExisting(f),f.perfilTecnico?.operacional||out.operacional||{});return out};
function opGet(id){return $('#'+id)?.value?.trim?.()||''}
function operationalFromForm(){
 const garages=[
  {tipo:'PUBLICA',blip:opGet('fOpPub1Blip'),spawn:opGet('fOpPub1Spawn'),veiculos:'',vagas:''},
  {tipo:'PUBLICA_2',blip:opGet('fOpPub2Blip'),spawn:opGet('fOpPub2Spawn'),veiculos:'',vagas:''},
  {tipo:'FACCAO',blip:opGet('fOpVipBlip'),spawn:opGet('fOpVipSpawn'),veiculos:opGet('fOpVipVehicles'),vagas:''},
  {tipo:'SERVICO',blip:opGet('fOpServiceBlip'),spawn:opGet('fOpServiceSpawn'),veiculos:opGet('fOpServiceVehicles'),vagas:''}
 ].filter(x=>x.blip||x.spawn||x.veiculos);
 return {localizacao:{nome:opGet('fOpQGName'),cdsPrincipal:opGet('fOpMainCds')},lojaFac:{cds:opGet('fOpLojaFac')},bar:{cds:opGet('fOpBar')},barbearia:{cds:opGet('fOpBarbearia')},tatuagem:{cds:opGet('fOpTatuagem')},roupas:{cds:opGet('fOpRoupas')},uniforme:{local:opGet('fOpUniformeLocal'),arquivo:opGet('fOpUniformeArquivo')},arena:{cds:opGet('fOpArena')},garagens:garages,helipontos:(opGet('fOpHeliBlip')||opGet('fOpHeliSpawn'))?[{blip:opGet('fOpHeliBlip'),spawn:opGet('fOpHeliSpawn')}]:[],blindados:{vagas:opGet('fOpArmoredSlots'),blip:opGet('fOpArmoredBlip'),spawn:opGet('fOpArmoredSpawn'),veiculos:opGet('fOpArmoredVehicles')},telao:{ativo:!!(opGet('fOpTelaoModelo')||opGet('fOpTelaoPostit')||opGet('fOpTelaoCds')),tipo:opGet('fOpTelaoTipo'),modelo:opGet('fOpTelaoModelo'),postit:opGet('fOpTelaoPostit'),cds:opGet('fOpTelaoCds'),permissao:opGet('fOpTelaoPermissao'),sons:[1,2,3,4].map(i=>opGet('fOpTelaoSom'+i))}};
}
function setOpVal(id,v){const el=$('#'+id);if(el)el.value=v||''}
function renderOperationalProfile(f={}){
 const o=mergedTechProfile(f).operacional||opBlank(),g=(type)=>o.garagens?.find(x=>x.tipo===type)||{},h=o.helipontos?.[0]||{},sons=[...(o.telao?.sons||[]),'','','',''];
 setOpVal('fOpQGName',o.localizacao?.nome);setOpVal('fOpMainCds',o.localizacao?.cdsPrincipal);setOpVal('fOpLojaFac',o.lojaFac?.cds);setOpVal('fOpBar',o.bar?.cds);setOpVal('fOpBarbearia',o.barbearia?.cds);setOpVal('fOpTatuagem',o.tatuagem?.cds);setOpVal('fOpRoupas',o.roupas?.cds);setOpVal('fOpUniformeLocal',o.uniforme?.local);setOpVal('fOpUniformeArquivo',o.uniforme?.arquivo);setOpVal('fOpArena',o.arena?.cds);
 [['Pub1','PUBLICA'],['Pub2','PUBLICA_2'],['Vip','FACCAO'],['Service','SERVICO']].forEach(([p,t])=>{const x=g(t);setOpVal('fOp'+p+'Blip',x.blip);setOpVal('fOp'+p+'Spawn',x.spawn);if(p==='Vip'||p==='Service')setOpVal('fOp'+p+'Vehicles',x.veiculos)});
 setOpVal('fOpHeliBlip',h.blip);setOpVal('fOpHeliSpawn',h.spawn);setOpVal('fOpArmoredSlots',o.blindados?.vagas);setOpVal('fOpArmoredBlip',o.blindados?.blip);setOpVal('fOpArmoredSpawn',o.blindados?.spawn);setOpVal('fOpArmoredVehicles',o.blindados?.veiculos);setOpVal('fOpTelaoTipo',o.telao?.tipo);setOpVal('fOpTelaoModelo',o.telao?.modelo);setOpVal('fOpTelaoPostit',o.telao?.postit);setOpVal('fOpTelaoCds',o.telao?.cds);setOpVal('fOpTelaoPermissao',o.telao?.permissao||f.group);[1,2,3,4].forEach(i=>setOpVal('fOpTelaoSom'+i,sons[i-1]));
}
const _getTechProfileFromFormV71=getTechProfileFromForm;getTechProfileFromForm=function(){const out=_getTechProfileFromFormV71();if($('#fOpQGName'))out.operacional=operationalFromForm();techDraft=out;return out};
const _renderTechProfileV71=renderTechProfile;renderTechProfile=function(f){_renderTechProfileV71(f);renderOperationalProfile(f)};
const _sourceToGroupPatchV71=sourceToGroupPatch;sourceToGroupPatch=function(f,src){const patch=_sourceToGroupPatchV71(f,src),holder={...f,...patch,perfilTecnico:{...(f.perfilTecnico||{}),...(patch.perfilTecnico||{})},perfilFonte:{...src,versao:OPERATIONAL_PROFILE_VERSION}};/* INICIAR ROTA é o blip inicial do farm e não significa Rota Exclusiva. */if(patch.beneficios&&!(f?.beneficios?.rotaExclusiva)){patch.beneficios.rotaExclusiva=false;patch.beneficios.rotaBlips=f?.beneficios?.rotaBlips||'';if(holder.beneficios){holder.beneficios.rotaExclusiva=false;holder.beneficios.rotaBlips=f?.beneficios?.rotaBlips||''}}holder.perfilTecnico.operacional=opMerge(operationalFromExisting(holder),f.perfilTecnico?.operacional||{});patch.perfilTecnico=holder.perfilTecnico;patch.perfilFonte={...src,versao:OPERATIONAL_PROFILE_VERSION};return patch};

// Sincroniza os campos do Perfil Operacional com os campos legados usados pelo gerador de solicitações.
function syncOperationalLegacy(){
 if(!$('#fOpQGName'))return;const o=operationalFromForm(),pub=o.garagens.find(x=>x.tipo==='PUBLICA')||{},vip=o.garagens.find(x=>x.tipo==='FACCAO')||{},heli=o.helipontos[0]||{};
 setOpVal('fQG',o.localizacao.nome);setOpVal('fCds',o.localizacao.cdsPrincipal);setOpVal('fBarbearia',o.barbearia.cds);setOpVal('fTatuagem',o.tatuagem.cds);setOpVal('fLojaRoupas',o.roupas.cds);setOpVal('fArena',o.arena.cds);setOpVal('fShopExclusivo',o.lojaFac.cds);setOpVal('fGaragemPublicaBlip',pub.blip);setOpVal('fGaragemPublicaSpawn',pub.spawn);setOpVal('fGaragemVipBlip',vip.blip);setOpVal('fGaragemVipSpawn',vip.spawn);setOpVal('fGaragemVipVeiculos',vip.veiculos);setOpVal('fHelipontoBlip',heli.blip);setOpVal('fHelipontoSpawn',heli.spawn);setOpVal('fTelaoNome',o.telao.modelo);setOpVal('fTelaoPostit',o.telao.postit);setOpVal('fTelaoCds',o.telao.cds);if($('#fTelao'))$('#fTelao').checked=!!o.telao.ativo;if($('#fGaragemPublica'))$('#fGaragemPublica').checked=!!(pub.blip||pub.spawn);if($('#fHeliponto'))$('#fHeliponto').checked=!!(heli.blip||heli.spawn);
}
const OP_INPUT_IDS=['fOpQGName','fOpMainCds','fOpLojaFac','fOpBar','fOpBarbearia','fOpTatuagem','fOpRoupas','fOpUniformeLocal','fOpUniformeArquivo','fOpArena','fOpPub1Blip','fOpPub1Spawn','fOpPub2Blip','fOpPub2Spawn','fOpVipBlip','fOpVipSpawn','fOpVipVehicles','fOpServiceBlip','fOpServiceSpawn','fOpServiceVehicles','fOpHeliBlip','fOpHeliSpawn','fOpArmoredSlots','fOpArmoredBlip','fOpArmoredSpawn','fOpArmoredVehicles','fOpTelaoTipo','fOpTelaoModelo','fOpTelaoPostit','fOpTelaoCds','fOpTelaoPermissao','fOpTelaoSom1','fOpTelaoSom2','fOpTelaoSom3','fOpTelaoSom4'];
OP_INPUT_IDS.forEach(id=>$('#'+id)?.addEventListener('input',()=>{syncOperationalLegacy();getTechProfileFromForm();try{renderConnectedRequests();renderStructureSnapshot(currentFactionFromForm());updateDeliveryPreview()}catch{}}));
$('#fOpTelaoTipo')?.addEventListener('change',()=>{syncOperationalLegacy();getTechProfileFromForm();try{renderConnectedRequests();updateDeliveryPreview()}catch{}});

// Perfil operacional também passa a responder no Alvesinho.
const _alvesAnswerV71=alvesAnswer;alvesAnswer=function(question=''){const q=alvesNorm(question),g=alvesFindGroup(question);if(g){const o=mergedTechProfile(g).operacional||opBlank();if(q.includes('garagem')){const xs=o.garagens||[];return {text:xs.length?`Garagens de ${g.group}:\n${xs.map(x=>`• ${x.tipo}: Blip ${x.blip||'—'} | Spawn ${x.spawn||'—'}${x.veiculos?' | Veículos '+x.veiculos:''}`).join('\n')}`:`${g.group} não possui garagem cadastrada.`,refs:[g.group,'Perfil Operacional','Garagens']};}if(q.includes('telao')||q.includes('telão')){const t=o.telao||{};return {text:t.ativo?`Telão de ${g.group}:\n• Tipo: ${t.tipo||'—'}\n• Modelo: ${t.modelo||'—'}\n• Post-it: ${t.postit||'—'}\n• CDS: ${t.cds||'—'}\n• Sons: ${(t.sons||[]).filter(Boolean).length} ponto(s)\n${(t.sons||[]).filter(Boolean).map((x,i)=>`  Som ${i+1}: ${x}`).join('\n')}`:`${g.group} não possui telão cadastrado.`,refs:[g.group,'Perfil Operacional','Telão']};}if(q.includes('mapa')||q.includes('localizacao')||q.includes('localização')||q.includes('qg')){return {text:`${g.group} — ${o.localizacao?.nome||g.qg||'QG sem nome'}\nCDS principal do mapa: ${o.localizacao?.cdsPrincipal||g.cds||'—'}`,refs:[g.group,'Perfil Operacional','Mapa']};}}
 return _alvesAnswerV71(question)};

console.info('HIGH OS DEV V7.2 · Perfil Operacional carregado');

// HIGH OS V7.5 · Benefícios e Setagens realmente isolados em página própria.
let groupBenefitsHome=null;
function ensureBenefitsHome(){
 const box=$('#groupBenefitsSettings');
 if(box&&!groupBenefitsHome)groupBenefitsHome={parent:box.parentElement,next:box.nextSibling};
 return box;
}
function openGroupSettingsPage(){
 const box=ensureBenefitsHome(),mount=$('#groupSettingsMount');
 if(!box||!mount)return;
 mount.appendChild(box);box.open=true;box.classList.add('settings-active');
 const raw=faccoes.find(x=>x.group===$('#fGroup')?.value)||{};const g=resolveGroupIdentity(raw);
 $('#groupSettingsTitle').textContent=`${g.group||$('#fGroup')?.value||'GROUP'} · BENEFÍCIOS E SETAGENS`;
 $('#groupSettingsSubtitle').textContent=[g.qg||'QG sem nome',g.faccao?`Ocupante: ${g.faccao}`:'Group vago'].join(' • ');
 activateAppPage('group-settings');
}
function closeGroupSettingsPage(){
 const box=ensureBenefitsHome();
 if(box){box.classList.remove('settings-active');box.open=false;}
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
 const put=(id,val)=>{const el=$('#'+id);if(el)el.textContent=val||'—'};
 put('groupOverviewSegment',f.segmento||'OUTROS');
 put('groupOverviewGroup',f.group||'GROUP');
 put('groupOverviewQG',f.qg||'QG sem nome');
 put('groupOverviewProduct',f.produto||'—');
 put('groupOverviewLeader',f.lider||'—');
 put('groupOverviewStaff',f.staff||'—');
 put('groupOverviewCds',f.cds||'—');
 const s=$('#groupProfileSummary');
 if(s)s.innerHTML=`<div><span>STATUS</span><b class="${f.status==='ATIVA'?'online':''}">${f.status==='ATIVA'?'OCUPADO':'VAGO'}</b></div><div><span>OCUPANTE</span><b>${esc(f.faccao||'—')}</b></div><div><span>QG / LOCAL</span><b>${esc(f.qg||'SEM LOCAL')}</b></div><div><span>ESTRUTURAS</span><b>${installed.length}</b></div>`;
 const d=$('#groupIdentityDetails');if(d)d.open=false;
}
$('#editGroupIdentityBtn')?.addEventListener('click',()=>{const d=$('#groupIdentityDetails');if(!d)return;d.open=true;setTimeout(()=>d.scrollIntoView({behavior:'smooth',block:'start'}),30)});
const _openFacV74=openFac;openFac=function(id){_openFacV74(id);const raw=faccoes.find(x=>x.id===id);renderGroupOverview(resolveGroupIdentity(raw||{}))};
['fStatus','fFaccao','fQG','fProduto','fLider','fStaff','fCds'].forEach(id=>$('#'+id)?.addEventListener('input',()=>{
 const current=faccoes.find(x=>x.group===$('#fGroup')?.value)||{};
 renderGroupOverview({...current,status:$('#fStatus')?.value||current.status,faccao:$('#fFaccao')?.value.trim()||'',qg:$('#fQG')?.value.trim()||'',produto:$('#fProduto')?.value.trim()||'',lider:$('#fLider')?.value.trim()||'',staff:$('#fStaff')?.value.trim()||'',cds:$('#fCds')?.value.trim()||''});
 const d=$('#groupIdentityDetails');if(d)d.open=true;
}));
console.info('HIGH OS DEV V7.4 · Perfil clean carregado');

console.info('HIGH OS DEV V7.5 · Perfil clean + setagens isoladas + liderança restaurada');
console.info('HIGH OS V8.4 · Métricas objetivas carregadas');
console.info('HIGH OS V8.12 · Filtros visuais por segmento + ativas/inativas carregados');


// ===== HIGH OS · TRANSFERÊNCIA DE PAINEL, TROCA DE QG E ADMINISTRAÇÃO =====
let movementMode = '';
let movementSourceGroup = '';

const OCCUPANT_FIELDS = ['faccao','lider','staff','dataEntrega','status','observacoes'];
const PHYSICAL_FIELDS = ['qg','cds','beneficios','perfilEntrega','perfilTecnico','produto','anuncio','semCraft','removido'];

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
    ? 'Move a ocupação, líder e facção para outro Group. A estrutura física do QG de destino é preservada. Se o destino estiver ocupado, as ocupações são trocadas.'
    : 'Troca o patrimônio físico dos dois QGs sem trocar as facções ou os Groups.';
  $('#movementReason').value = '';
  show($('#movementModal'));
  movementPreview();
}

function movementPreview(){
  const src = faccoes.find(x => x.group === movementSourceGroup);
  const dst = faccoes.find(x => x.group === $('#movementDestination')?.value);
  if(!src || !dst) return;

  $('#movementPreview').innerHTML = movementMode === 'TRANSFER_PANEL'
    ? `<b>PRÉVIA</b><span>${esc(src.faccao || 'VAGO')} : ${esc(src.group)} → ${esc(dst.group)}</span>${dst.faccao ? `<span>${esc(dst.faccao)} : ${esc(dst.group)} → ${esc(src.group)}</span>` : ''}`
    : `<b>PRÉVIA DO LOCAL</b><span>${esc(src.group)}: ${esc(src.qg || 'SEM LOCAL')} → ${esc(dst.qg || 'SEM LOCAL')}</span><span>${esc(dst.group)}: ${esc(dst.qg || 'SEM LOCAL')} → ${esc(src.qg || 'SEM LOCAL')}</span>`;
}

$('#transferPanelBtn')?.addEventListener('click', () => movementOpen('TRANSFER_PANEL'));
$('#swapQGBtn')?.addEventListener('click', () => movementOpen('SWAP_QG'));
$('#movementDestination')?.addEventListener('change', movementPreview);
$('#movementClose')?.addEventListener('click', () => $('#movementModal')?.classList.add('hidden'));
$('#movementCancel')?.addEventListener('click', () => $('#movementModal')?.classList.add('hidden'));

$('#movementConfirm')?.addEventListener('click', async () => {
  if(!isAdmin()) return;
  const src = faccoes.find(x => x.group === movementSourceGroup);
  const dst = faccoes.find(x => x.group === $('#movementDestination')?.value);
  const reason = $('#movementReason')?.value.trim() || '';
  if(!src || !dst) return;
  if(!reason) return alert('Informe o motivo da operação.');
  if(!confirm(`Confirmar operação entre ${src.group} e ${dst.group}? Esta ação será registrada no histórico.`)) return;

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
    batch.set(doc(db,'highos','data','faccoes',src.group), a);
    batch.set(doc(db,'highos','data','faccoes',dst.group), b);
    await batch.commit();
    await syncGroupsToOfficialSheet([a,b],{quiet:true});

    await addDoc(histCol, {
      tipo: movementMode === 'TRANSFER_PANEL' ? 'TRANSFERENCIA_PAINEL' : 'TROCA_QG',
      group: src.group,
      groupDestino: dst.group,
      faccao: src.faccao || '',
      qg: src.qg || '',
      motivo: reason,
      antes: {origem: cleanSnapshot(src), destino: cleanSnapshot(dst)},
      depois: {origem: cleanSnapshot(a), destino: cleanSnapshot(b)},
      usuario: currentUser.email,
      data: serverTimestamp()
    });

    for(const rec of [a,b]){
      if(rec.faccao){
        await setDoc(doc(db,'highos','data','organizacoes',orgKey(rec.faccao)), {
          nome: rec.faccao,
          status: 'ATIVA',
          groupAtual: rec.group,
          segmentoAtual: rec.segmento || '',
          qgAtual: rec.qg || '',
          lider: rec.lider || '',
          updatedAt: serverTimestamp(),
          updatedBy: currentUser.email
        }, {merge:true});
      }
    }

    $('#movementModal')?.classList.add('hidden');
    closeGroupProfilePage();
    await loadFaccoes();
    alert('Operação concluída e registrada no histórico.');
  }catch(e){
    alert('Falha na operação: ' + e.message);
  }
});

async function wipeCollection(name){
  const c = collection(db,'highos','data',name);
  const qs = await getDocs(c);
  for(let i=0;i<qs.docs.length;i+=400){
    const batch = writeBatch(db);
    qs.docs.slice(i,i+400).forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
  return qs.size;
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
    for(const c of ['faccoes','organizacoes','solicitacoes','entregas','metricas']) total += await wipeCollection(c);
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
let facSheetAccessToken='',facSheetTitle='',facSheetRowMap=new Map(),facSheetPendingDiffs=[],facSheetBusy=false;
const FAC_SHEET_FIELDS=[
 ['numero','nº'],['cds','CDS'],['anuncio','Anúncio Discord ?'],['qg','Nome QG ou Favela'],['group','Group'],['produto','Produto'],['faccao','Facção'],['status','STATUS'],['lider','Líder'],['staff','Staff Responsável'],['dataEntrega','Data Entrega'],['observacoes','Observações']
];
function facSheetNorm(v=''){return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'').toLowerCase()}
function facSheetStatus(v=''){const x=String(v||'').trim().toUpperCase();return x==='ATIVA'||x==='ATIVO'?'ATIVA':'INATIVA'}
function facSheetClean(v){return String(v??'').trim()}
function facSheetComparable(field,v){if(field==='status')return facSheetStatus(v);if(field==='numero')return String(Number(v||0)||'');return facSheetClean(v)}
function facSheetRowFromGroup(f={}){return [f.numero??'',f.cds||'',f.anuncio||'',f.qg||'',f.group||'',f.produto||'',f.faccao||'',f.status==='ATIVA'?'Ativa':'Inativa',f.lider||'',f.staff||'',f.dataEntrega||'',f.observacoes||'']}
function facSheetPatchFromRow(row=[]){return {numero:Number(row[0]||0)||'',cds:facSheetClean(row[1]),anuncio:facSheetClean(row[2]),qg:facSheetClean(row[3]),group:facSheetClean(row[4]),produto:facSheetClean(row[5]),faccao:facSheetClean(row[6]),status:facSheetStatus(row[7] || (row[6]?'ATIVA':'INATIVA')),lider:facSheetClean(row[8]),staff:facSheetClean(row[9]),dataEntrega:facSheetClean(row[10]),observacoes:facSheetClean(row[11])}}
function facSheetRenderStatus(status='offline',text=''){
 const badge=$('#facSheetSyncBadge'),desc=$('#facSheetStatusText');if(badge){badge.className='sheet-sync-badge '+status;badge.textContent=status==='online'?'CONECTADO':status==='busy'?'SINCRONIZANDO':status==='warn'?'PENDENTE':'DESCONECTADO'}if(desc&&text)desc.textContent=text;
}
function facSheetSetLastCheck(){const el=$('#facSheetLastCheck');if(el)el.textContent=new Date().toLocaleString('pt-BR')}
async function facSheetAuthorize(){
 if(facSheetAccessToken)return facSheetAccessToken;if(!currentUser)throw new Error('Entre no High OS antes de conectar a planilha.');
 facSheetProvider.setCustomParameters({prompt:'consent',login_hint:currentUser.email||''});
 const result=await signInWithPopup(auth,facSheetProvider),cred=GoogleAuthProvider.credentialFromResult(result),token=cred?.accessToken;
 if(!token)throw new Error('O Google não retornou autorização de edição da planilha.');facSheetAccessToken=token;facSheetRenderStatus('online','Google Sheets conectado. Alterações feitas no High OS serão enviadas automaticamente.');await facSheetResolveTitle(token);return token;
}
async function facSheetFetch(url,{method='GET',body=null,token=''}={}){
 token=token||facSheetAccessToken;if(!token)throw new Error('PLANILHA_NAO_CONECTADA');const opt={method,headers:{Authorization:`Bearer ${token}`}};if(body!==null){opt.headers['Content-Type']='application/json';opt.body=JSON.stringify(body)}
 const r=await fetch(url,opt);const p=await r.json().catch(()=>({}));if(!r.ok){if(r.status===401||r.status===403)facSheetAccessToken='';throw new Error(p?.error?.message||`Google Sheets HTTP ${r.status}`)}return p;
}
async function facSheetResolveTitle(token=''){
 if(facSheetTitle)return facSheetTitle;const u=`https://sheets.googleapis.com/v4/spreadsheets/${FAC_SHEET_SPREADSHEET_ID}?fields=sheets.properties(sheetId,title,index)`;const p=await facSheetFetch(u,{token});const hit=(p.sheets||[]).find(x=>Number(x.properties?.sheetId)===FAC_SHEET_GID);if(!hit)throw new Error(`Não encontrei a aba gid ${FAC_SHEET_GID} na planilha.`);facSheetTitle=hit.properties.title;const el=$('#facSheetName');if(el)el.textContent=`${facSheetTitle} • gid ${FAC_SHEET_GID}`;return facSheetTitle;
}
async function facSheetReadAll({authorize=false}={}){
 const token=authorize?await facSheetAuthorize():facSheetAccessToken;if(!token)throw new Error('PLANILHA_NAO_CONECTADA');const title=await facSheetResolveTitle(token),range=`'${String(title).replace(/'/g,"''")}'!A1:L300`,u=`https://sheets.googleapis.com/v4/spreadsheets/${FAC_SHEET_SPREADSHEET_ID}/values/${encodeURIComponent(range)}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE`;const p=await facSheetFetch(u,{token}),values=p.values||[];facSheetRowMap=new Map();const records=[];
 values.forEach((row,i)=>{const patch=facSheetPatchFromRow(row);if(!patch.group)return;const key=facSheetNorm(patch.group);facSheetRowMap.set(key,i+1);records.push({rowNumber:i+1,row,patch,key})});return records;
}
function facSheetDiffForRecord(record){
 const current=faccoes.find(f=>facSheetNorm(f.group)===record.key);if(!current)return null;const patch={...record.patch,group:current.group};const changes=[];for(const [field,label] of FAC_SHEET_FIELDS){if(field==='group')continue;const a=facSheetComparable(field,current[field]),b=facSheetComparable(field,patch[field]);if(a!==b)changes.push({field,label,before:current[field]??'',after:patch[field]??''})}return changes.length?{current,patch,rowNumber:record.rowNumber,changes}:null;
}
async function facSheetCheckForChanges(){
 if(facSheetBusy)return;facSheetBusy=true;facSheetRenderStatus('busy','Comparando a planilha com a base atual do High OS...');const btn=$('#facSheetCheckBtn');if(btn)btn.disabled=true;
 try{const rows=await facSheetReadAll({authorize:!facSheetAccessToken});facSheetPendingDiffs=rows.map(facSheetDiffForRecord).filter(Boolean);facSheetSetLastCheck();if(!facSheetPendingDiffs.length){facSheetRenderStatus('online','Planilha e High OS estão iguais nos campos sincronizados.');return alert('Nenhuma diferença encontrada entre a planilha e o High OS.')}renderFacSheetDiffModal();facSheetRenderStatus('warn',`${facSheetPendingDiffs.length} Group(s) possuem alterações aguardando sua confirmação.`)}catch(e){facSheetRenderStatus('offline',e.message==='PLANILHA_NAO_CONECTADA'?'Conecte o Google Sheets para verificar alterações.':'Erro: '+e.message);if(e.message!=='PLANILHA_NAO_CONECTADA')alert('Erro ao ler a planilha: '+e.message)}finally{facSheetBusy=false;if(btn)btn.disabled=false}
}
function renderFacSheetDiffModal(){
 const sum=$('#facSheetDiffSummary'),list=$('#facSheetDiffList');if(sum)sum.innerHTML=`<b>${facSheetPendingDiffs.length}</b><span>GROUP(S) COM DIFERENÇAS</span><small>${facSheetPendingDiffs.reduce((n,x)=>n+x.changes.length,0)} campo(s) serão alterados somente após a confirmação.</small>`;if(list)list.innerHTML=facSheetPendingDiffs.map(d=>`<article class="sheet-diff-card"><header><div><span>LINHA ${d.rowNumber}</span><h3>${esc(d.current.group)}</h3></div><b>${d.changes.length} ALTERAÇÃO(ÕES)</b></header><div>${d.changes.map(c=>`<div class="sheet-diff-row"><span>${esc(c.label)}</span><del>${esc(c.before||'—')}</del><i>→</i><ins>${esc(c.after||'—')}</ins></div>`).join('')}</div></article>`).join('');$('#facSheetDiffModal')?.classList.remove('hidden');
}
async function facSheetApplyConfirmed(){
 if(!facSheetPendingDiffs.length)return $('#facSheetDiffModal')?.classList.add('hidden');if(!confirm(`Confirmar ${facSheetPendingDiffs.length} atualização(ões) da planilha no High OS?`))return;const btn=$('#facSheetDiffConfirm');if(btn){btn.disabled=true;btn.textContent='ATUALIZANDO...'}
 try{const batch=writeBatch(db);for(const d of facSheetPendingDiffs){const next={...d.current,...d.patch,group:d.current.group,updatedAt:serverTimestamp(),updatedBy:currentUser.email,syncSource:'GOOGLE_SHEETS'};batch.set(doc(db,'highos','data','faccoes',d.current.group),next,{merge:true})}await batch.commit();for(const d of facSheetPendingDiffs){const oldName=String(d.current.faccao||'').trim(),newName=String(d.patch.faccao||'').trim();if(oldName&&facSheetNorm(oldName)!==facSheetNorm(newName)){await setDoc(doc(db,'highos','data','organizacoes',orgKey(oldName)),{nome:oldName,status:'SEM_GROUP',groupAtual:'',segmentoAtual:'',qgAtual:'',updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true})}if(newName){await setDoc(doc(db,'highos','data','organizacoes',orgKey(newName)),{nome:newName,status:d.patch.status==='ATIVA'?'ATIVA':'SEM_GROUP',groupAtual:d.patch.status==='ATIVA'?d.current.group:'',segmentoAtual:d.patch.status==='ATIVA'?(d.current.segmento||''):'',qgAtual:d.patch.status==='ATIVA'?(d.patch.qg||d.current.qg||''):'',lider:d.patch.lider||'',updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true})}}await addDoc(histCol,{sessionId:currentSessionId||'',tipo:'SYNC_PLANILHA_FACCOES_IMPORT',descricao:`${facSheetPendingDiffs.length} Group(s) atualizados após confirmação da planilha oficial`,grupos:facSheetPendingDiffs.map(x=>x.current.group),usuario:currentUser.email,data:serverTimestamp()});facSheetPendingDiffs=[];$('#facSheetDiffModal')?.classList.add('hidden');await loadFaccoes();facSheetRenderStatus('online','Alterações da planilha confirmadas e aplicadas ao High OS.');alert('High OS atualizado com os dados confirmados da planilha.')}catch(e){alert('Erro ao aplicar alterações: '+e.message)}finally{if(btn){btn.disabled=false;btn.textContent='CONFIRMAR E ATUALIZAR HIGH OS'}}
}
async function syncGroupsToOfficialSheet(groups=[],{quiet=false,forceAuthorize=false}={}){
 const clean=groups.filter(Boolean);if(!clean.length)return true;let token=facSheetAccessToken;if(!token&&forceAuthorize)token=await facSheetAuthorize();if(!token){facSheetRenderStatus('warn','High OS salvo. Conecte o Google Sheets para enviar as alterações pendentes à planilha.');return false}
 try{facSheetRenderStatus('busy',`Enviando ${clean.length} Group(s) para a planilha...`);if(!facSheetRowMap.size)await facSheetReadAll();const title=await facSheetResolveTitle(token);for(const f of clean){const key=facSheetNorm(f.group),row=facSheetRowMap.get(key),values=[facSheetRowFromGroup(f)];if(row){const range=`'${String(title).replace(/'/g,"''")}'!A${row}:L${row}`,u=`https://sheets.googleapis.com/v4/spreadsheets/${FAC_SHEET_SPREADSHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;await facSheetFetch(u,{method:'PUT',body:{range,majorDimension:'ROWS',values},token})}else{const range=`'${String(title).replace(/'/g,"''")}'!A:L`,u=`https://sheets.googleapis.com/v4/spreadsheets/${FAC_SHEET_SPREADSHEET_ID}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;await facSheetFetch(u,{method:'POST',body:{range,majorDimension:'ROWS',values},token});facSheetRowMap.clear()}}
 facSheetSetLastCheck();facSheetRenderStatus('online',`${clean.length} Group(s) sincronizado(s) com a planilha.`);return true}catch(e){facSheetRenderStatus('warn','High OS foi salvo, mas a planilha não recebeu a atualização: '+e.message);if(!quiet)alert('High OS salvo, mas houve erro ao atualizar a planilha: '+e.message);return false}
}
async function facSheetPushAll(){
 if(!isAdmin())return;const btn=$('#facSheetPushAllBtn');if(btn){btn.disabled=true;btn.textContent='ENVIANDO...'}try{if(!facSheetAccessToken)await facSheetAuthorize();if(!confirm(`Enviar os ${faccoes.length} Groups atuais do High OS para a planilha oficial?\n\nLinhas existentes serão atualizadas pelo Group e Groups ausentes serão adicionados.`))return;const ok=await syncGroupsToOfficialSheet(faccoes,{forceAuthorize:true});if(ok){await addDoc(histCol,{sessionId:currentSessionId||'',tipo:'SYNC_PLANILHA_FACCOES_EXPORT',descricao:`Base High OS enviada manualmente para a planilha oficial: ${faccoes.length} Group(s)`,usuario:currentUser.email,data:serverTimestamp()});alert('Planilha atualizada com a base atual do High OS.')}}catch(e){alert('Erro ao enviar a base: '+e.message)}finally{if(btn){btn.disabled=false;btn.textContent='ENVIAR HIGH OS → PLANILHA'}}
}
$('#facSheetConnectBtn')?.addEventListener('click',async()=>{try{await facSheetAuthorize();await facSheetReadAll();facSheetSetLastCheck();alert('Google Sheets conectado com permissão de edição. A sincronização automática do High OS → planilha está ativa nesta sessão.')}catch(e){facSheetRenderStatus('offline','Falha ao conectar: '+e.message);alert('Não foi possível conectar a planilha: '+e.message)}});
$('#facSheetCheckBtn')?.addEventListener('click',facSheetCheckForChanges);
$('#facSheetPushAllBtn')?.addEventListener('click',facSheetPushAll);
$('#facSheetDiffClose')?.addEventListener('click',()=>$('#facSheetDiffModal')?.classList.add('hidden'));
$('#facSheetDiffCancel')?.addEventListener('click',()=>$('#facSheetDiffModal')?.classList.add('hidden'));
$('#facSheetDiffConfirm')?.addEventListener('click',facSheetApplyConfirmed);
console.info('HIGH OS V8.0 · Sincronização bidirecional com Documento das Facções pronta');

// ===== HIGH OS V7.8 · CENTRAL DE COMANDO + PERFIL DE FACÇÃO EM PÁGINA =====
function showOrganizationProfilePage(o={},current=null){
 const card=$('#orgModal .org-modal-card')||$('.org-modal-card');
 const mount=$('#orgProfilePageMount');
 if(card&&mount&&card.parentElement!==mount){mount.appendChild(card);card.classList.add('org-profile-page-card')}
 $('#orgProfilePageTitle').textContent=o.nome||'NOVA FACÇÃO';
 $('#orgProfilePageSubtitle').textContent=current?[`${current.group||'—'} • ${current.qg||'QG sem local'}`,current.lider?`Líder: ${current.lider}`:'Liderança não cadastrada'].join(' • '):'Organização sem Group atual • histórico e cadastro preservados';
 const st=$('#orgProfilePageStatus');if(st)st.innerHTML=`<span class="status-chip ${current?'ativa':'inativa'}">${current?'OCUPANDO GROUP':(o.status||'SEM GROUP').replace('_',' ')}</span>`;
 activateAppPage('org-profile');
}
function closeOrganizationProfilePage(){activateAppPage('organizacoes')}
$('#orgProfileBack')?.addEventListener('click',closeOrganizationProfilePage);

function startOfWeekMonday(d=new Date()){
 const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());const day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);x.setHours(0,0,0,0);return x;
}
function isoDay(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function weeklyContingentAlerts(){
 const now=new Date(),curStart=startOfWeekMonday(now),prevStart=new Date(curStart);prevStart.setDate(prevStart.getDate()-7);const prevEnd=new Date(curStart.getTime()-1);
 const currentRows=metricasCache.filter(r=>{const d=metricDateValue(r);return d&&d>=curStart&&d<=now});
 const previousRows=metricasCache.filter(r=>{const d=metricDateValue(r);return d&&d>=prevStart&&d<=prevEnd});
 const cfg=dashboardConfig||DEFAULT_DASHBOARD_CONFIG,weekKey=isoDay(curStart),out=[];
 faccoes.filter(f=>f.status==='ATIVA'&&String(f.faccao||'').trim()).forEach(f=>{
  const same=r=>alvesNorm(r.group||r.organizacao||r.faccao)===alvesNorm(f.group),cur=currentRows.filter(same),prev=previousRows.filter(same);if(!cur.length||!prev.length)return;
  const prevMap=new Map();prev.forEach(r=>{const d=metricDateValue(r),wd=(d.getDay()+6)%7;Object.entries(metricSlots(r)).forEach(([h,v])=>{v=Number(v);if(Number.isFinite(v))prevMap.set(`${wd}|${h}`,v)})});
  const pairs=[];cur.forEach(r=>{const d=metricDateValue(r),wd=(d.getDay()+6)%7;Object.entries(metricSlots(r)).forEach(([h,v])=>{v=Number(v);const pv=prevMap.get(`${wd}|${h}`);if(Number.isFinite(v)&&Number.isFinite(pv))pairs.push([v,pv])})});
  if(pairs.length<cfg.minComparacoes)return;const currentAvg=pairs.reduce((a,x)=>a+x[0],0)/pairs.length,previousAvg=pairs.reduce((a,x)=>a+x[1],0)/pairs.length;if(previousAvg<=0)return;
  const drop=(previousAvg-currentAvg)/previousAvg*100;if(drop<cfg.quedaAtencaoPct)return;const level=drop>=cfg.quedaCriticaPct?'CRÍTICO':'ATENÇÃO',state=findDashboardAlertState(f.group,weekKey)?.status||'PENDENTE';
  out.push({group:f.group,faccao:f.faccao,segmento:f.segmento,currentAvg,previousAvg,drop,level,state,pairs:pairs.length,weekKey,currentStart:curStart,previousStart:prevStart});
 });return out.sort((a,b)=>(a.state==='CONCLUIDO')-(b.state==='CONCLUIDO')||b.drop-a.drop);
}
function vacantMetricAnomalies(){
 const cutoff=new Date();cutoff.setDate(cutoff.getDate()-7);const by=new Map();metricasCache.forEach(r=>{const g=String(r.group||r.organizacao||r.faccao||'').trim(),d=metricDateValue(r);if(!g||!d||d<cutoff||metricGroupOccupied(g))return;const vals=Object.values(metricSlots(r)).map(Number).filter(Number.isFinite),mx=vals.length?Math.max(...vals):0;if(mx<=0)return;const cur=by.get(alvesNorm(g));if(!cur||d>cur.date)by.set(alvesNorm(g),{group:g,date:d,value:mx,row:r})});
 return [...by.values()].map(x=>{const f=faccoes.find(z=>alvesNorm(z.group)===alvesNorm(x.group));const lastDelivery=historico.filter(h=>h.tipo==='ENTREGA_GROUP'&&alvesNorm(h.group)===alvesNorm(x.group)).sort((a,b)=>historyMillis(b)-historyMillis(a))[0];return {...x,qg:f?.qg||'',staff:f?.staff||'',hasExtract:!!lastDelivery};}).sort((a,b)=>b.date-a.date);
}
function dashboardGo(page){activateAppPage(page)}
function openMetricForGroup(group){
 activateAppPage('metricas');const cur=startOfWeekMonday(new Date());metricDateStart=isoDay(cur);metricDateEnd=isoDay(new Date());syncMetricDateInputs();renderMetrics();if($('#metricScopeSelect'))$('#metricScopeSelect').value=group;if($('#metricFactionSelect'))$('#metricFactionSelect').value=group;switchMetricCenterView('faction');renderMetricFactionDetail(group);
}
function renderCommandDashboard(){
 const box=$('#commandDashboard');if(!box)return;
 const active=faccoes.filter(f=>f.status==='ATIVA'&&f.faccao),vacant=faccoes.filter(f=>f.status!=='ATIVA'||!f.faccao),weekly=weeklyContingentAlerts(),openAlerts=weekly.filter(x=>x.state!=='CONCLUIDO'),critical=openAlerts.filter(x=>x.level==='CRÍTICO').length;
 const pending=solicitacoes.filter(x=>String(x.status||'').toUpperCase()==='PENDENTE').length,health=dashboardHealth(weekly),anomalies=vacantMetricAnomalies();
 const segs={};faccoes.forEach(f=>{const k=f.segmento||'OUTROS';if(!segs[k])segs[k]={all:0,on:0};segs[k].all++;if(f.status==='ATIVA'&&f.faccao)segs[k].on++});
 const movements=historico.slice(0,6),rec30=historico.filter(h=>historyFamily(h.tipo)==='RECOLHIMENTO').length,ent30=historico.filter(h=>historyFamily(h.tipo)==='ENTREGA').length;
 const bars=Object.entries(segs).map(([k,v])=>`<div class="dash-seg-row"><span>${esc(k)}</span><div><i style="width:${v.all?Math.max(3,v.on/v.all*100):0}%"></i></div><b>${v.on}/${v.all}</b></div>`).join('');
 const attention=weekly.length?weekly.map(x=>`<article class="dash-week-alert ${x.level==='CRÍTICO'?'critical':''} ${x.state==='CONCLUIDO'?'done':''}"><button type="button" class="dash-alert-main" data-alert-group="${esc(x.group)}"><i></i><span><b>${esc(x.faccao)} • ${esc(x.group)}</b><small>${x.level} • queda ${x.drop.toFixed(1)}% • semana atual ${x.currentAvg.toFixed(1)} vs anterior ${x.previousAvg.toFixed(1)} • ${x.pairs} coletas comparáveis</small></span><strong>${x.state==='CONCLUIDO'?'CONCLUÍDO':x.level}</strong></button><div class="dash-alert-actions"><button type="button" title="Marcar como concluído" data-alert-state="CONCLUIDO" data-group="${esc(x.group)}" data-week="${esc(x.weekKey)}">✓</button><button type="button" title="Marcar como pendente" data-alert-state="PENDENTE" data-group="${esc(x.group)}" data-week="${esc(x.weekKey)}">✕</button></div></article>`).join(''):'<div class="dash-empty good-text">Nenhuma queda semanal relevante entre as facções ocupadas.</div>';
 const anomalyHtml=anomalies.length?anomalies.map(x=>`<button class="dash-anomaly-row" data-anomaly-group="${esc(x.group)}"><span><b>⚠ ${esc(x.group)} SEM OCUPAÇÃO COM MÉTRICA ${x.value}</b><small>${esc(x.qg||'QG')} • ${x.date.toLocaleString('pt-BR')} • ${x.hasExtract?'há histórico de entrega, mas o Group está vago':'não consta extrato de entrega/assunção compatível'}</small><em>Confirme a ocupação. Se não houve assunção, peça ao staff/player que estiver neste Group para sair ou remova-o.</em></span><strong>VER →</strong></button>`).join(''):'<div class="dash-empty good-text">Nenhuma presença indevida detectada em Groups vagos nos últimos 7 dias.</div>';
 const activity=movements.map(h=>`<div class="dash-activity-row"><i></i><div><b>${esc(historyTitle(h))}</b><span>${esc([h.group,h.faccao].filter(Boolean).join(' • ')||h.descricao||'Operação administrativa')}</span><small>${esc(formatHistoryDate(h))}${h.usuario?' • '+esc(h.usuario):''}</small></div></div>`).join('')||'<div class="dash-empty">Nenhuma movimentação registrada.</div>';
 box.innerHTML=`<div class="dash-kpis"><button data-go="organizacoes"><span>FACÇÕES ATIVAS</span><b>${active.length}</b><small>somente ocupadas</small></button><button data-go="faccoes"><span>QGs VAGOS</span><b>${vacant.length}</b><small>fora de métricas globais</small></button><button data-go="metricas" class="${openAlerts.length?'warn':''}"><span>ALERTAS SEMANAIS</span><b>${openAlerts.length}</b><small>${critical?critical+' crítico(s)':'comparação com semana anterior'}</small></button><button data-go="solicitacoes"><span>SOLICITAÇÕES</span><b>${pending||solicitacoes.length}</b><small>${pending?'pendentes':'modelos cadastrados'}</small></button><article class="health ${health.toLowerCase()}"><span>SAÚDE DO ILEGAL</span><b>${health}</b><small>${openAlerts.length?openAlerts.length+' alerta(s) pendente(s)':'sem alertas pendentes'}</small></article></div>
 <div class="dash-grid"><section class="dash-panel dash-wide"><header><div><span>COMPARAÇÃO SEMANAL</span><h3>ALERTAS OBJETIVOS DE CONTINGENTE</h3></div><button data-go="metricas">ABRIR CENTRAL →</button></header><p class="dash-rule-note">A semana atual é comparada com os mesmos dias e horários da semana anterior. Facções sem ocupação nunca geram alerta.</p><div class="dash-week-alerts">${attention}</div></section>
 <section class="dash-panel"><header><div><span>PATRIMÔNIO</span><h3>OCUPAÇÃO POR SEGMENTO</h3></div><button data-go="faccoes">VER QGs →</button></header><div class="dash-segments">${bars}</div></section>
 <section class="dash-panel dash-wide"><header><div><span>VALIDAÇÃO AUTOMÁTICA</span><h3>INCONSISTÊNCIAS • GROUP VAGO COM PLAYER</h3></div></header><div class="dash-anomalies">${anomalyHtml}</div></section>
 <section class="dash-panel"><header><div><span>30 DIAS / HISTÓRICO</span><h3>MOVIMENTAÇÃO DE FACÇÕES</h3></div><button data-go="entregas">VER ENTREGAS →</button></header><div class="dash-move-kpis"><div><b>${ent30}</b><span>ENTREGAS</span></div><div><b>${rec30}</b><span>RECOLHIMENTOS</span></div><div><b>${historico.length}</b><span>EVENTOS</span></div></div></section>
 <section class="dash-panel dash-wide"><header><div><span>AUDITORIA</span><h3>ATIVIDADE RECENTE</h3></div><button data-go="historico">ABRIR HISTÓRICO →</button></header><div class="dash-activity">${activity}</div></section></div>`;
 box.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>dashboardGo(b.dataset.go));box.querySelectorAll('[data-alert-group]').forEach(b=>b.onclick=()=>openMetricForGroup(b.dataset.alertGroup));box.querySelectorAll('[data-alert-state]').forEach(b=>b.onclick=e=>{e.stopPropagation();setDashboardAlertState(b.dataset.group,b.dataset.week,b.dataset.alertState)});box.querySelectorAll('[data-anomaly-group]').forEach(b=>b.onclick=()=>{activateAppPage('faccoes');const f=faccoes.find(x=>alvesNorm(x.group)===alvesNorm(b.dataset.anomalyGroup));if(f)openFac(f.id)});
}
const _loadMetricsV78=loadMetrics;loadMetrics=async function(){await _loadMetricsV78();renderCommandDashboard()};
const _renderHistoryV78=renderHistory;renderHistory=function(){_renderHistoryV78();renderCommandDashboard()};
const _renderOrganizationsV78=renderOrganizations;renderOrganizations=function(){_renderOrganizationsV78();renderCommandDashboard()};
console.info('HIGH OS V8.23 · Alertas semanais + métricas ocupadas + Chat + Spotify');

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
 const oldFarm=new Map(((oldProfile?.farm?.itens)||[]).map(x=>[farmItemKey(x),x]));
 let farmNew=((newProfile?.farm?.itens)||[]).filter(x=>!oldFarm.has(farmItemKey(x)));
 if(!farmNew.length)farmNew=(recipe?.insumos||[]).map(x=>({spawn:x.spawn,nome:x.nome||ITEM_META[x.spawn]?.nome||x.spawn,qtd:x.qtd}));
 if(isLaundryMachineRecipe(recipe) && !farmNew.some(x=>farmItemKey(x)==='washbleach'||/alvejante/i.test(x.nome||''))){
   farmNew.push({spawn:'washbleach',nome:'Alvejante'});
 }
 const seen=new Set(),farmNames=[];
 farmNew.forEach(x=>{const k=farmItemKey(x);if(!k||seen.has(k))return;seen.add(k);farmNames.push(x.nome||ITEM_META[x.spawn]?.nome||x.spawn)});
 const farmLine=farmNames.length?farmNames.join(', '):'Informar itens do farm';
 const L=[
  'Assunto:','',
  `- Adição do produto "${product}" no Group "${group}";`,'',
  'Solicitação:','',
  `- Adicionar o produto "${product}" ao craft do group "${group}";`,'',
  `- Receita do Craft: ${recipeLine};`,'',
  `- Adicionar os itens abaixo no farm do group "${group}";`,'',
  `- ${farmLine};`,'',
 ];
 if(isLaundryMachineRecipe(recipe)){
   L.push(`- Obs: O Group referido abaixo terá permissão para fabricar a "${product}" e apenas o "Lider e o Sublider" desse group poderão utilizar a mesma para realizar lavagem, as configurações e restrições do item seguem padrão.`,'');
 }else if(String(recipe?.origem||'').toUpperCase()==='ADQUIRIDO EM LOJA'){
   L.push(`- Obs: Craft adquirido em loja para o Group "${group}". A receita deverá ser adicionada somente a este Group, mantendo as configurações e restrições padrão do item.`,'');
 }
 L.push(`- Permissão "${group}".`);
 return {texto:L.join('\n'),farmItens:farmNames};
}
function openCraftRequestModal(group,recipe,requestData){
 const modal=$('#craftRequestModal'),ta=$('#craftRequestText'),sum=$('#craftRequestSummary');
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
 const t=$('#craftRequestText')?.value||'';if(!t)return;const b=$('#copyCraftRequestBtn'),old=b?.textContent||'COPIAR SOLICITAÇÃO';
 try{await navigator.clipboard.writeText(t);if(b)b.textContent='COPIADO ✓'}catch(e){const ta=$('#craftRequestText');ta?.select();document.execCommand('copy');if(b)b.textContent='COPIADO ✓'}
 setTimeout(()=>{if(b)b.textContent=old},1400);
});

// HIGH OS V8.7 — persistência forte de Craft/Farm.
// Salva diretamente no documento do Group e relê o Firestore para impedir que
// um rascunho antigo da tela sobrescreva receitas recém-cadastradas.
async function persistCurrentTechProfile(group, {reload=true}={}){
 if(!group)throw new Error('Group não identificado.');
 const ref=doc(db,'highos','data','faccoes',group);
 const perfilTecnico=getTechProfileFromForm();
 await setDoc(ref,{perfilTecnico,updatedAt:serverTimestamp(),updatedBy:currentUser?.email||''},{merge:true});
 const local=faccoes.find(x=>x.group===group);
 if(local)local.perfilTecnico=clonePlain(perfilTecnico);
 if(reload){
   const snap=await getDoc(ref);
   if(snap.exists()){
     const fresh={id:snap.id,...snap.data()};
     const pos=faccoes.findIndex(x=>x.group===group);
     if(pos>=0)faccoes[pos]={...faccoes[pos],...fresh};
     techDraft=mergedTechProfile(faccoes[pos>=0?pos:faccoes.findIndex(x=>x.group===group)]||fresh);
   }
 }
 return clonePlain(perfilTecnico);
}

// HIGH OS V7.9 — editores visuais de Receita e Farm (sem prompt do navegador)
$('#recipeEditorClose')?.addEventListener('click',closeRecipeEditor);
$('#recipeEditorCancel')?.addEventListener('click',()=>{const i=+($('#recipeEditorIndex')?.value||-1),r=techDraft?.craft?.receitas?.[i];if(r&&!r.nome&&!r.spawn){techDraft.craft.receitas.splice(i,1);renderCraftRecipes();renderFarmItems()}closeRecipeEditor()});
$('#recipeAddIngredient')?.addEventListener('click',()=>{const items=readIngredientEditor();items.push({spawn:'',nome:'',qtd:'',imagem:''});renderIngredientEditor(items)});
$('#recipeEditorSpawn')?.addEventListener('input',e=>{$('#recipeEditorImage').src=itemImg(e.target.value.trim(),ITEM_META[e.target.value.trim()]?.imagem||'',$('#recipeEditorName')?.value||'')});
$('#recipeEditorForm')?.addEventListener('submit',async e=>{
 e.preventDefault();
 const i=Number($('#recipeEditorIndex')?.value);
 const r=Number.isInteger(i)?techDraft?.craft?.receitas?.[i]:null;
 if(!r)return alert('Não foi possível localizar esta receita. Feche e abra o Craft novamente.');
 const nome=$('#recipeEditorName').value.trim(),spawn=$('#recipeEditorSpawn').value.trim(),insumos=readIngredientEditor();
 if(!nome||!spawn)return alert('Informe o nome e o spawn do produto.');
 if(!insumos.length)return alert('Adicione pelo menos um insumo à receita antes de salvar.');
 r.nome=nome;r.spawn=spawn;r.nivel=$('#recipeEditorLevel').value.trim();r.max=$('#recipeEditorMax').value.trim();r.origem=$('#recipeEditorOrigin')?.value||r.origem||'EXTRA DO GROUP';r.disponibilidade=r.origem==='ADQUIRIDO EM LOJA'?'TODAS AS FACÇÕES':(r.disponibilidade||'');r.insumos=insumos;r.imagem=ITEM_META[r.spawn]?.imagem||r.imagem||'';r.origem=r.origem||'EXTRA DO GROUP';
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
   let generatedRequest=null,requestRef=null;
   if(shouldGenerate){
     generatedRequest=buildCraftRequestText(group,r,perfilTecnico,oldPerfil);
     const craftPayload={isModelo:false,status:'PENDENTE',tipo:'CRAFT_ITEM',group,faccao:local?.faccao||'',assunto:`Adição do produto ${nome} no Group ${group}`,texto:generatedRequest.texto,receita:clonePlain(r),farmItens:generatedRequest.farmItens,origem:'CRAFT_DO_GROUP',solicitadoPor:currentUser?.email||'',createdAt:serverTimestamp(),createdAtText:new Date().toISOString(),createdBy:currentUser?.email||'',fingerprint:requestFingerprint({group,tipo:'CRAFT_ITEM',texto:generatedRequest.texto})};const dup=requestRecords.find(x=>x.status==='PENDENTE'&&x.fingerprint===craftPayload.fingerprint);if(dup){requestRef={id:dup.id}}else{requestRef=await addDoc(reqCol,craftPayload);requestRecords.unshift({id:requestRef.id,...clonePlain(craftPayload),createdAt:null})};
   }
   await addDoc(histCol,{sessionId:currentSessionId||'',tipo:'CRAFT_RECEITA',group,faccao:local?.faccao||'',descricao:`Receita ${nome} (${spawn}) salva no Craft do Group${generatedRequest?' • solicitação gerada':''}`,receita:clonePlain(r),solicitacaoId:requestRef?.id||'',solicitacaoTexto:generatedRequest?.texto||'',alteracao:oldRecipe?'EDICAO':'ADICAO',usuario:currentUser?.email||'',data:serverTimestamp()});
   if(btn)btn.textContent=generatedRequest?'SALVO + SOLICITAÇÃO ✓':'SALVO ✓';
   setTimeout(()=>{closeRecipeEditor();if(generatedRequest)openCraftRequestModal(group,r,generatedRequest)},250);
 }catch(err){
   if(btn){btn.disabled=false;btn.textContent='SALVAR RECEITA'}
   alert('Erro ao salvar a receita: '+(err?.message||err));
 }
});
$('#farmEditorClose')?.addEventListener('click',closeFarmEditor);
$('#farmEditorCancel')?.addEventListener('click',()=>{const i=+($('#farmEditorIndex')?.value||-1),x=techDraft?.farm?.itens?.[i];if(x&&String(x.origem||'').toUpperCase()!=='CRAFT'&&!x.nome&&!x.spawn){techDraft.farm.itens.splice(i,1);renderFarmItems()}closeFarmEditor()});
$('#farmEditorSpawn')?.addEventListener('input',e=>{$('#farmEditorImage').src=itemImg(e.target.value.trim(),ITEM_META[e.target.value.trim()]?.imagem||'',$('#farmEditorName')?.value||'')});
$('#farmEditorForm')?.addEventListener('submit',e=>{e.preventDefault();const i=+($('#farmEditorIndex')?.value||-1),x=techDraft?.farm?.itens?.[i];if(!x||String(x.origem||'').toUpperCase()==='CRAFT')return closeFarmEditor();x.nome=$('#farmEditorName').value.trim();x.spawn=$('#farmEditorSpawn').value.trim();x.qtd=$('#farmEditorQty').value.trim();x.imagem=ITEM_META[x.spawn]?.imagem||x.imagem||'';renderFarmItems();renderConnectedRequests();updateDeliveryPreview();closeFarmEditor()});


// HIGH OS V8.1 · FACÇÕES DISPONÍVEIS + ANÚNCIOS DISCORD
function availableAnnouncementText(f){
 const min=Math.max(1,Number(f.contingenteMin||15));
 const max=Math.max(min,Number(f.contingenteMax||28));
 const local=[f.qg||'SEM LOCAL',f.group||''].filter(Boolean).join(' - ');
 const linhas=[
  '# 🔥 OPORTUNIDADE DE ASSUMIR FACÇÃO','',
  `🏴 Segmento: ${f.segmento||'OUTROS'}`,'',
  `📍 Local: ${local}`,'',
  `👥 Contingente mínimo: ${min} a ${max} membros`,'',
  '🎁 Benefícios iniciais:','- VIP Facção por 2 semanas','- $1.000.000 em dinheiro sujo','- Estrutura inicial da organização','',
  '📋 Como participar:','- Abra um ticket no suporte do Ilegal','- Mencione esta postagem no ticket','- Informe o nome da sua tropa e a quantidade de membros','- Aguarde o atendimento de um responsável do Ilegal','',
  '🚨 A facção será liberada mediante análise de contingente, organização e disponibilidade.','',
  '🏆 Reúna sua tropa e venha disputar seu espaço no Ilegal da High.'
 ];
 if(f.imagemAnuncio)linhas.push('',String(f.imagemAnuncio).trim());
 return linhas.join('\n');
}

async function saveAvailableImageLink(group,input,button){
 const f=faccoes.find(x=>x.group===group);if(!f||!currentUser)return;
 const url=String(input?.value||'').trim();
 if(url&&!/^https?:\/\//i.test(url)){alert('Informe um link válido começando com http:// ou https://');return}
 const old=f.imagemAnuncio||'';
 if(url===old){if(button){const t=button.textContent;button.textContent='JÁ SALVO';setTimeout(()=>button.textContent=t,900)}return}
 try{
  if(button){button.disabled=true;button.textContent='SALVANDO...'}
  await setDoc(doc(db,'highos','data','faccoes',group),{imagemAnuncio:url,updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true});
  await addDoc(histCol,{sessionId:currentSessionId||'',tipo:'IMAGEM_ANUNCIO_DISCORD',group,antes:{imagemAnuncio:old},depois:{imagemAnuncio:url},descricao:url?'Link da imagem do anúncio cadastrado/alterado':'Link da imagem do anúncio removido',usuario:currentUser.email,data:serverTimestamp()});
  await loadFaccoes();
 }catch(e){alert('Erro ao salvar link da imagem: '+e.message);if(button){button.disabled=false;button.textContent='SALVAR LINK'}}
}
async function saveAvailableContingent(group,card,button){
 const f=faccoes.find(x=>x.group===group);if(!f||!currentUser)return;
 const min=Math.max(1,Number(card?.querySelector('.available-cont-min')?.value||15));
 const rawMax=Number(card?.querySelector('.available-cont-max')?.value||28);
 const max=Math.max(min,rawMax||28);
 const antes={contingenteMin:Number(f.contingenteMin||15),contingenteMax:Number(f.contingenteMax||28)};
 try{
  if(button){button.disabled=true;button.textContent='SALVANDO...'}
  await setDoc(doc(db,'highos','data','faccoes',group),{contingenteMin:min,contingenteMax:max,updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true});
  await addDoc(histCol,{sessionId:currentSessionId||'',tipo:'CONTINGENTE_ANUNCIO',group,antes,depois:{contingenteMin:min,contingenteMax:max},descricao:`Contingente do anúncio alterado para ${min} a ${max} membros`,usuario:currentUser.email,data:serverTimestamp()});
  await loadFaccoes();
 }catch(e){alert('Erro ao salvar contingente: '+e.message);if(button){button.disabled=false;button.textContent='SALVAR CONTINGENTE'}}
}
function availableDiscordState(f){
 const meta=f?.anuncioDiscordStatus||{};
 if(meta.postado===true)return 'POSTADO';
 if(meta.postado===false&&(meta.confirmado===true||meta.naoPostadoEm||meta.desmarcadoEm))return 'NAO_POSTADO';
 return 'NAO_INFORMADO';
}
function availablePosted(f){return availableDiscordState(f)==='POSTADO'}
function renderAvailableFaccoes(){
 const box=$('#availableList');if(!box)return;renderAvailableSegmentCards();
 const q=($('#availableSearch')?.value||'').toLowerCase(),seg=$('#availableSegment')?.value||'',dc=$('#availableDiscord')?.value||'';
 const all=faccoes.filter(f=>f.status!=='ATIVA'||!String(f.faccao||'').trim());
 const list=all.filter(f=>(!seg||segmentKey(f.segmento)===segmentKey(seg))&&(!q||[f.group,f.qg,f.produto,f.segmento].join(' ').toLowerCase().includes(q))&&(!dc||availableDiscordState(f)===dc));
 const posted=all.filter(f=>availableDiscordState(f)==='POSTADO').length,notPosted=all.filter(f=>availableDiscordState(f)==='NAO_POSTADO').length,unknown=all.filter(f=>availableDiscordState(f)==='NAO_INFORMADO').length;
 if($('#availableStats'))$('#availableStats').innerHTML=`<span><b>${all.length}</b> LIVRES</span><span><b>${unknown}</b> NÃO INFORMADO</span><span><b>${notPosted}</b> NÃO POSTADAS</span><span><b>${posted}</b> POSTADAS</span><span><b>${list.length}</b> EXIBIDAS</span>`;
 if(!list.length){box.innerHTML='<div class="placeholder"><b>◈</b><h3>NENHUMA FACÇÃO DISPONÍVEL NESTE FILTRO</h3><p>Ajuste os filtros ou aguarde um Group ficar vago.</p></div>';return}
 box.innerHTML=list.map(f=>{const dcState=availableDiscordState(f),posted=dcState==='POSTADO',meta=f.anuncioDiscordStatus||{},text=availableAnnouncementText(f),stateLabel=dcState==='POSTADO'?'POSTADO':dcState==='NAO_POSTADO'?'NÃO POSTADO':'RESPONDER STATUS';return `<article class="available-card" data-group="${esc(f.group)}">
   <div class="available-card-head"><div><span>${esc(f.segmento||'OUTROS')}</span><h3>${esc(f.group)}</h3></div><span class="discord-state ${posted?'posted':dcState==='NAO_POSTADO'?'not-posted':'pending'}">${stateLabel}</span></div>
   <div class="available-qg">${esc(f.qg||'SEM LOCAL')}</div>
   <div class="available-product">${esc(f.produto||'Produto não informado')}</div>
   <div class="available-contingent-editor"><span>CONTINGENTE DO ANÚNCIO</span><div class="available-contingent-row"><label>MÍNIMO<input class="available-cont-min" type="number" min="1" max="100" value="${Number(f.contingenteMin||15)}"></label><label>MÁXIMO<input class="available-cont-max" type="number" min="1" max="100" value="${Number(f.contingenteMax||28)}"></label><button class="mini-btn available-save-contingent" data-group="${esc(f.group)}">SALVAR CONTINGENTE</button></div></div>
   <div class="available-image-editor ${f.imagemAnuncio?'':'missing'}"><label><span>LINK DA IMAGEM PARA O DISCORD</span><div class="available-image-input-row"><input class="available-image-input" data-group="${esc(f.group)}" value="${esc(f.imagemAnuncio||'')}" placeholder="Cole aqui o link direto da imagem..."><button class="mini-btn available-save-image" data-group="${esc(f.group)}">SALVAR LINK</button></div><small>${f.imagemAnuncio?'O link será incluído automaticamente no texto do anúncio.':'Cadastre o link aqui; não precisa abrir o perfil do Group.'}</small></label></div>
   ${posted?`<div class="available-posted-meta">Publicado por <b>${esc(meta.responsavel||meta.postadoPor||'—')}</b>${meta.dataHora?` • ${esc(meta.dataHora)}`:''}</div>`:''}
   <div class="available-actions"><button class="btn-primary compact available-generate" data-group="${esc(f.group)}">GERAR ANÚNCIO</button><button class="mini-btn available-copy-text" data-group="${esc(f.group)}">COPIAR ANÚNCIO + IMAGEM</button><button class="mini-btn available-copy-image" data-group="${esc(f.group)}" ${f.imagemAnuncio?'':'disabled'}>COPIAR SÓ O LINK</button><button class="mini-btn available-set-posted ${posted?'posted':''}" data-group="${esc(f.group)}">✓ POSTADO NO HIGH FACS LIVRES</button><button class="mini-btn available-set-not-posted ${dcState==='NAO_POSTADO'?'not-posted':''}" data-group="${esc(f.group)}">✕ NÃO POSTADO</button></div>
   <textarea class="available-preview hidden" data-preview="${esc(f.group)}">${esc(text)}</textarea>
  </article>`}).join('');
 box.querySelectorAll('.available-generate').forEach(b=>b.onclick=()=>{const card=b.closest('.available-card'),ta=card?.querySelector('.available-preview');if(!ta)return;ta.classList.toggle('hidden');b.textContent=ta.classList.contains('hidden')?'GERAR ANÚNCIO':'OCULTAR PRÉVIA'});
 box.querySelectorAll('.available-save-contingent').forEach(b=>b.onclick=()=>saveAvailableContingent(b.dataset.group,b.closest('.available-card'),b));
 box.querySelectorAll('.available-save-image').forEach(b=>b.onclick=()=>{const input=b.closest('.available-image-editor')?.querySelector('.available-image-input');saveAvailableImageLink(b.dataset.group,input,b)});
 box.querySelectorAll('.available-image-input').forEach(i=>i.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();const b=i.closest('.available-image-editor')?.querySelector('.available-save-image');if(b)saveAvailableImageLink(i.dataset.group,i,b)}}));
 box.querySelectorAll('.available-copy-text').forEach(b=>b.onclick=()=>{const f=faccoes.find(x=>x.group===b.dataset.group);if(f)copyText(availableAnnouncementText(f),b)});
 box.querySelectorAll('.available-copy-image').forEach(b=>b.onclick=()=>{const f=faccoes.find(x=>x.group===b.dataset.group);if(f?.imagemAnuncio)copyText(f.imagemAnuncio,b)});
 box.querySelectorAll('.available-set-posted').forEach(b=>b.onclick=()=>setAvailableDiscordState(b.dataset.group,true));
 box.querySelectorAll('.available-set-not-posted').forEach(b=>b.onclick=()=>setAvailableDiscordState(b.dataset.group,false));
}
async function setAvailableDiscordState(group,postado){
 const f=faccoes.find(x=>x.group===group);if(!f)return;
 if(f.status==='ATIVA'&&String(f.faccao||'').trim())return alert('Este Group está ocupado e não faz parte das facções livres.');
 const now=new Date(),label=postado?'POSTADO':'NÃO POSTADO';
 if(!confirm(`Confirmar ${group} como ${label} no Discord HIGH FACS LIVRES?`))return;
 const status=postado
  ?{confirmado:true,postado:true,dataHora:now.toLocaleString('pt-BR'),postadoEm:now.toISOString(),responsavel:currentProfile?.name||currentUser?.displayName||currentUser.email,postadoPor:currentUser.email,texto:availableAnnouncementText(f),imagemUrl:f.imagemAnuncio||''}
  :{confirmado:true,postado:false,dataHora:now.toLocaleString('pt-BR'),naoPostadoEm:now.toISOString(),responsavel:currentProfile?.name||currentUser?.displayName||currentUser.email,confirmadoPor:currentUser.email};
 try{await setDoc(doc(db,'highos','data','faccoes',group),{anuncioDiscordStatus:status,status:'INATIVA',updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true});await addDoc(histCol,{sessionId:currentSessionId||'',tipo:postado?'ANUNCIO_DISCORD_POSTADO':'ANUNCIO_DISCORD_NAO_POSTADO',group,qg:f.qg||'',segmento:f.segmento||'',descricao:`${group} confirmado como ${label} no HIGH FACS LIVRES`,texto:postado?availableAnnouncementText(f):'',imagemUrl:f.imagemAnuncio||'',usuario:currentUser.email,data:serverTimestamp()});await loadFaccoes()}catch(e){alert('Erro ao atualizar status do anúncio: '+e.message)}
}
async function toggleAvailablePosted(group){const f=faccoes.find(x=>x.group===group);return setAvailableDiscordState(group,!availablePosted(f))}

function freeFaccoesForReport(type='TODAS'){
 const rows=faccoes.filter(f=>!f.removido&&(f.status!=='ATIVA'||!String(f.faccao||'').trim()));
 return type==='TODAS'?rows:rows.filter(f=>availableDiscordState(f)===type);
}
function freeFacReportText(type='TODAS'){
 const rows=freeFaccoesForReport(type),now=new Date().toLocaleString('pt-BR');
 const title=type==='POSTADO'?'POSTADAS':type==='NAO_POSTADO'?'NÃO POSTADAS':type==='NAO_INFORMADO'?'SEM STATUS INFORMADO':'TODAS AS LIVRES';
 return [`RELATÓRIO DE FACÇÕES LIVRES — ${title}`,`Gerado em: ${now}`,`Total: ${rows.length}`,'',...rows.map((f,i)=>`${i+1}. ${f.group} | ${f.segmento||'OUTROS'} | ${f.qg||'SEM LOCAL'} | ${availableDiscordState(f)==='POSTADO'?'POSTADO':availableDiscordState(f)==='NAO_POSTADO'?'NÃO POSTADO':'NÃO INFORMADO'}${f.anuncioDiscordStatus?.dataHora?' | '+f.anuncioDiscordStatus.dataHora:''}`)].join('\n');
}
function downloadFreeFacCsv(type='TODAS'){
 const rows=freeFaccoesForReport(type),head=['Group','Segmento','QG','Produto','Status Discord','Data/Hora','Responsável','Link imagem'];
 const data=[head,...rows.map(f=>{const m=f.anuncioDiscordStatus||{};return [f.group,f.segmento||'',f.qg||'',f.produto||'',availableDiscordState(f)==='POSTADO'?'POSTADO':availableDiscordState(f)==='NAO_POSTADO'?'NÃO POSTADO':'NÃO INFORMADO',m.dataHora||'',m.responsavel||m.postadoPor||m.confirmadoPor||'',f.imagemAnuncio||'']})];
 const csv='\ufeff'+data.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(';')).join('\r\n'),blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`faccoes_livres_${String(type).toLowerCase()}_${new Date().toISOString().slice(0,10)}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function showFreeFacReport(){
 const type=$('#availableReportType')?.value||'TODAS',rows=freeFaccoesForReport(type),existing=$('#freeFacReportModal');if(existing)existing.remove();
 const modal=document.createElement('div');modal.id='freeFacReportModal';modal.className='modal';modal.innerHTML=`<div class="modal-box free-report-box"><div class="modal-head"><div><div class="eyebrow">RELATÓRIO • HIGH FACS LIVRES</div><h3>${type==='TODAS'?'TODAS AS FACÇÕES LIVRES':type==='POSTADO'?'FACÇÕES LIVRES POSTADAS':type==='NAO_POSTADO'?'FACÇÕES LIVRES NÃO POSTADAS':'FACÇÕES LIVRES SEM STATUS'}</h3></div><button type="button" class="modal-x">×</button></div><div class="free-report-summary"><b>${rows.length}</b><span>registro(s)</span><small>Gerado em ${new Date().toLocaleString('pt-BR')}</small></div><div class="free-report-table-wrap"><table class="free-report-table"><thead><tr><th>GROUP</th><th>SEGMENTO</th><th>QG</th><th>DISCORD</th><th>DATA / RESPONSÁVEL</th></tr></thead><tbody>${rows.map(f=>{const m=f.anuncioDiscordStatus||{},st=availableDiscordState(f);return `<tr><td><b>${esc(f.group)}</b></td><td>${esc(f.segmento||'—')}</td><td>${esc(f.qg||'SEM LOCAL')}</td><td><span class="discord-state ${st==='POSTADO'?'posted':st==='NAO_POSTADO'?'not-posted':'pending'}">${st==='POSTADO'?'POSTADO':st==='NAO_POSTADO'?'NÃO POSTADO':'NÃO INFORMADO'}</span></td><td>${esc(m.dataHora||'—')}<br><small>${esc(m.responsavel||m.postadoPor||m.confirmadoPor||'—')}</small></td></tr>`}).join('')||'<tr><td colspan="5">Nenhum registro neste filtro.</td></tr>'}</tbody></table></div><div class="modal-actions"><button type="button" class="mini-btn free-report-copy">COPIAR RELATÓRIO</button><button type="button" class="mini-btn free-report-csv">BAIXAR CSV</button><button type="button" class="btn-primary compact free-report-print">IMPRIMIR / PDF</button></div></div>`;document.body.appendChild(modal);modal.querySelector('.modal-x').onclick=()=>modal.remove();modal.querySelector('.free-report-copy').onclick=e=>copyText(freeFacReportText(type),e.currentTarget);modal.querySelector('.free-report-csv').onclick=()=>downloadFreeFacCsv(type);modal.querySelector('.free-report-print').onclick=()=>window.print();
}
['availableSearch','availableSegment','availableDiscord'].forEach(id=>$('#'+id)?.addEventListener(id==='availableSearch'?'input':'change',renderAvailableFaccoes));
$('#availableReportBtn')?.addEventListener('click',showFreeFacReport);

console.info('HIGH OS V8.7 · Persistência de Craft/Farm corrigida');

console.info('HIGH OS V8.8 · Correção Perfil Operacional/garagens + persistência de Craft carregada');


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
 const canonicalCurrent=segments.find(x=>segmentKey(x)===segmentKey(current))||'';sel.value=canonicalCurrent;
 box.innerHTML=`<button type="button" class="segment-visual-card ${!sel.value?'active':''}" data-segment=""><span class="segment-icon">◈</span><span class="segment-copy"><strong>TODOS</strong><small>Todos os segmentos</small></span><b>${rows.length}</b></button>${segments.map(x=>segmentCardMarkup(x,counts[x]||0,segmentKey(sel.value)===segmentKey(x))).join('')}`;
 box.querySelectorAll('.segment-visual-card').forEach(btn=>btn.onclick=()=>{sel.value=btn.dataset.segment||'';onChange()});
}
renderFacSegmentChips=function(all=[]){renderVisualSegmentFilter({rows:(all||[]).filter(f=>!f.removido),field:'segmento',selectId:'facSegment',boxId:'facSegmentChips',onChange:renderFaccoes})};
renderOrgSegmentChips=function(all=[]){renderVisualSegmentFilter({rows:(all||[]).map(o=>({...o,__segmento:orgSegmentValue(o)})),field:'__segmento',selectId:'orgSegment',boxId:'orgSegmentChips',onChange:renderOrganizations})};
function renderAvailableSegmentCards(){
 const rows=faccoes.filter(f=>!f.removido&&(f.status!=='ATIVA'||!String(f.faccao||'').trim()));
 renderVisualSegmentFilter({rows,field:'segmento',selectId:'availableSegment',boxId:'availableSegmentChips',onChange:renderAvailableFaccoes});
}
function activityButtons(boxId,selectId,items,onChange){
 const box=$('#'+boxId),sel=$('#'+selectId);if(!box||!sel)return;
 const active=sel.value||'';box.innerHTML=items.map(([value,label,icon])=>`<button type="button" class="${active===value?'active':''}" data-value="${value}">${icon} ${label}</button>`).join('');
 box.querySelectorAll('button').forEach(b=>b.onclick=()=>{sel.value=b.dataset.value||'';onChange()});
}
function renderFacActivityButtons(){activityButtons('facStatusButtons','facStatus',[['','AMBOS','◉'],['ATIVA','OCUPADOS','●'],['INATIVA','VAGOS','○']],renderFaccoes)}
function renderOrgActivityButtons(){activityButtons('orgStatusButtons','orgStatus',[['','AMBAS','◉'],['ACTIVE','ATIVAS','●'],['INATIVA','INATIVAS','○']],renderOrganizations)}


// HIGH OS V8.13 · GERENCIAMENTO DE SEGMENTOS
function segmentUsage(name){const key=segmentKey(name);return {groups:faccoes.filter(f=>segmentKey(f.segmento)===key).length,orgs:derivedOrganizations().filter(o=>segmentKey(orgSegmentValue(o))===key).length}}
function refreshSegmentAssignEntities(){
 const type=$('#segmentAssignType')?.value||'GROUP',el=$('#segmentAssignEntity');if(!el)return;
 const rows=type==='GROUP'?faccoes.filter(f=>!f.removido).map(f=>({v:f.group,t:`${f.group} • ${f.qg||'SEM LOCAL'} • ${f.segmento||'—'}`})):derivedOrganizations().map(o=>({v:o.nome,t:`${o.nome} • ${orgSegmentValue(o)||'SEM SEGMENTO'}`}));
 el.innerHTML=rows.sort((a,b)=>a.t.localeCompare(b.t)).map(x=>`<option value="${esc(x.v)}">${esc(x.t)}</option>`).join('');
}
function renderSegmentAdmin(){
 syncSegmentSelects();refreshSegmentAssignEntities();const box=$('#segmentAdminList');if(!box)return;
 box.innerHTML=segmentDefs().map(seg=>{const u=segmentUsage(seg.nome),others=segmentNames().filter(x=>segmentKey(x)!==segmentKey(seg.nome));return `<article class="segment-admin-item"><div class="segment-admin-symbol">${esc(seg.icone||'◇')}</div><div class="segment-admin-copy"><b>${esc(seg.nome)}</b><span>${esc(seg.descricao||'')}</span><small>${u.groups} Group(s) • ${u.orgs} facção(ões)</small></div><select class="segment-delete-target" data-seg="${esc(seg.nome)}"><option value="">TRANSFERIR PARA...</option>${others.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}</select><button type="button" class="mini-btn segment-rename" data-seg="${esc(seg.nome)}">EDITAR</button><button type="button" class="btn-danger compact segment-delete" data-seg="${esc(seg.nome)}">APAGAR</button></article>`}).join('');
 box.querySelectorAll('.segment-delete').forEach(b=>b.onclick=()=>deleteSegment(b.dataset.seg,b.closest('.segment-admin-item')?.querySelector('.segment-delete-target')?.value||''));
 box.querySelectorAll('.segment-rename').forEach(b=>b.onclick=()=>beginEditSegment(b.dataset.seg));
}
async function saveSegmentRegistry(){await setDoc(segmentConfigDoc,{items:segmentDefs(),updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true});syncSegmentSelects();renderSegmentAdmin();renderFaccoes();renderOrganizations();renderAvailableFaccoes();if(typeof renderMetrics==='function')renderMetrics()}
let editingSegmentName='';
function beginEditSegment(name){const item=segmentDefs().find(x=>segmentKey(x.nome)===segmentKey(name));if(!item)return;editingSegmentName=item.nome;$('#segmentNewName').value=item.nome;$('#segmentNewIcon').value=item.icone||'◇';$('#segmentNewDesc').value=item.descricao||item.nome;const b=$('#segmentCreateBtn');if(b)b.textContent='SALVAR ALTERAÇÃO';$('#segmentNewName')?.focus()}
async function createSegment(){
 const nome=cleanSegmentName($('#segmentNewName')?.value),icone=$('#segmentNewIcon')?.value.trim()||'◇',descricao=$('#segmentNewDesc')?.value.trim()||nome;if(!nome)return alert('Informe o nome do segmento.');
 const oldName=editingSegmentName;
 if(!oldName&&segmentNames().some(x=>segmentKey(x)===segmentKey(nome)))return alert('Este segmento já existe.');
 if(oldName&&segmentKey(nome)!==segmentKey(oldName)&&segmentNames().some(x=>segmentKey(x)===segmentKey(nome)))return alert('Já existe um segmento com esse nome.');
 try{
  if(oldName){const item=segmentDefs().find(x=>segmentKey(x.nome)===segmentKey(oldName));const batch=writeBatch(db);faccoes.filter(f=>segmentKey(f.segmento)===segmentKey(oldName)).forEach(f=>batch.set(doc(db,'highos','data','faccoes',f.group),{segmento:nome,updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true}));organizacoes.filter(o=>segmentKey(orgSegmentValue(o))===segmentKey(oldName)).forEach(o=>batch.set(doc(db,'highos','data','organizacoes',o.id||orgKey(o.nome)),{segmentoAtual:nome,segmentoVinculado:nome,updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true}));await batch.commit();Object.assign(item,{nome,icone,descricao});await addDoc(histCol,{sessionId:currentSessionId||'',tipo:'SEGMENTO_EDITADO',segmento:nome,descricao:`Segmento ${oldName} alterado para ${nome}`,usuario:currentUser.email,data:serverTimestamp()});
  }else{segmentos.push({nome,icone,descricao});await addDoc(histCol,{sessionId:currentSessionId||'',tipo:'SEGMENTO_CRIADO',segmento:nome,descricao:`Segmento ${nome} criado`,usuario:currentUser.email,data:serverTimestamp()})}
  editingSegmentName='';$('#segmentNewName').value='';$('#segmentNewIcon').value='';$('#segmentNewDesc').value='';if($('#segmentCreateBtn'))$('#segmentCreateBtn').textContent='CRIAR SEGMENTO';await saveSegmentRegistry();await loadFaccoes();
 }catch(e){alert('Erro ao salvar segmento: '+e.message)}
}
async function assignSegment(){
 const type=$('#segmentAssignType')?.value||'GROUP',entity=$('#segmentAssignEntity')?.value,target=$('#segmentAssignTarget')?.value;if(!entity||!target)return alert('Selecione o cadastro e o segmento.');try{if(type==='GROUP'){const f=faccoes.find(x=>x.group===entity);if(!f)return;await setDoc(doc(db,'highos','data','faccoes',f.group),{segmento:target,updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true});if(f.faccao)await setDoc(doc(db,'highos','data','organizacoes',orgKey(f.faccao)),{segmentoAtual:target,segmentoVinculado:target,updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true})}else{const o=derivedOrganizations().find(x=>x.nome===entity);if(!o)return;await setDoc(doc(db,'highos','data','organizacoes',o.id||orgKey(o.nome)),{segmentoVinculado:target,segmentoAtual:o.groupAtual?o.segmentoAtual||target:target,updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true})}await addDoc(histCol,{sessionId:currentSessionId||'',tipo:'SEGMENTO_VINCULO',descricao:`${type==='GROUP'?'Group':'Facção'} ${entity} vinculado(a) ao segmento ${target}`,segmento:target,usuario:currentUser.email,data:serverTimestamp()});await loadFaccoes();renderSegmentAdmin()}catch(e){alert('Erro ao vincular segmento: '+e.message)}
}
async function deleteSegment(name,replacement){
 const u=segmentUsage(name);if((u.groups||u.orgs)&&!replacement)return alert(`O segmento ${name} está em uso por ${u.groups} Group(s) e ${u.orgs} facção(ões). Escolha "TRANSFERIR PARA..." antes de apagar.`);if(!confirm(`Apagar o segmento ${name}?${replacement?`\n\nTodos os vínculos serão transferidos para ${replacement}.`:''}`))return;
 try{if(replacement){const batch=writeBatch(db);faccoes.filter(f=>segmentKey(f.segmento)===segmentKey(name)).forEach(f=>batch.set(doc(db,'highos','data','faccoes',f.group),{segmento:replacement,updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true}));organizacoes.filter(o=>segmentKey(orgSegmentValue(o))===segmentKey(name)).forEach(o=>batch.set(doc(db,'highos','data','organizacoes',o.id||orgKey(o.nome)),{segmentoAtual:replacement,segmentoVinculado:replacement,updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true}));await batch.commit()}segmentos=segmentDefs().filter(x=>segmentKey(x.nome)!==segmentKey(name));await saveSegmentRegistry();await addDoc(histCol,{sessionId:currentSessionId||'',tipo:'SEGMENTO_APAGADO',segmento:name,descricao:`Segmento ${name} apagado${replacement?` e vínculos movidos para ${replacement}`:''}`,usuario:currentUser.email,data:serverTimestamp()});await loadFaccoes()}catch(e){alert('Erro ao apagar segmento: '+e.message)}
}
async function applyCoreSegmentMap(){
 const rules={Manicomio:'DROGAS',Contrabando01:'CONTRABANDO',Contrabando02:'CONTRABANDO',IlegalMedic1:'APOIO',IlegalMedic2:'APOIO',IlegalMecanic01:'APOIO'};const needs=faccoes.filter(f=>rules[f.group]&&segmentKey(f.segmento)!==segmentKey(rules[f.group]));if(!needs.length)return;try{const batch=writeBatch(db);needs.forEach(f=>{const seg=rules[f.group];batch.set(doc(db,'highos','data','faccoes',f.group),{segmento:seg,updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true});if(f.faccao)batch.set(doc(db,'highos','data','organizacoes',orgKey(f.faccao)),{segmentoAtual:seg,segmentoVinculado:seg,updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true})});await batch.commit();faccoes=faccoes.map(f=>rules[f.group]?{...f,segmento:rules[f.group]}:f);await addDoc(histCol,{sessionId:currentSessionId||'',tipo:'SEGMENTOS_PADRAO_V813',descricao:'Correção estrutural: Manicomio=DROGAS, Contrabando=CONTRABANDO, IlegalMedic/IlegalMecanic=APOIO',usuario:currentUser.email,data:serverTimestamp()})}catch(e){console.warn('Falha na correção dos segmentos padrão',e)}
}
$('#segmentCreateBtn')?.addEventListener('click',createSegment);$('#segmentAssignType')?.addEventListener('change',refreshSegmentAssignEntities);$('#segmentAssignBtn')?.addEventListener('click',assignSegment);
const _loadFaccoesV813=loadFaccoes;loadFaccoes=async function(){await _loadFaccoesV813();if(String(currentProfile?.role||'').toUpperCase()==='ADMIN'){await applyCoreSegmentMap();renderFaccoes();renderOrganizations();renderAvailableFaccoes();renderSegmentAdmin();renderAdminGroupManager()}};

console.info('HIGH OS V8.13 · Segmentos gerenciáveis + filtros visuais carregados');

console.info('HIGH OS V8.14 · Solicitações bidirecionais + arquivo por Group carregado');



// ===== HIGH OS V8.24 · ADMINISTRAÇÃO MESTRE DE GROUPS =====
function adminGroupStatus(f={}){return f.status==='ATIVA'&&String(f.faccao||'').trim()?'ATIVA':'INATIVA'}
function renderAdminGroupManager(){
 const box=$('#adminGroupList'),stats=$('#adminGroupStats');if(!box)return;
 const q=String($('#adminGroupSearch')?.value||'').trim().toLowerCase(),status=$('#adminGroupStatus')?.value||'';
 const rows=faccoes.filter(f=>!f.removido).filter(f=>{const st=adminGroupStatus(f);if(status&&st!==status)return false;const hay=[f.group,f.qg,f.segmento,f.faccao,f.produto,f.staff,f.lider].join(' ').toLowerCase();return !q||hay.includes(q)});
 const occupied=faccoes.filter(f=>!f.removido&&adminGroupStatus(f)==='ATIVA').length,total=faccoes.filter(f=>!f.removido).length;
 if(stats)stats.innerHTML=`<article><span>TOTAL</span><b>${total}</b><small>Groups cadastrados</small></article><article><span>OCUPADOS</span><b>${occupied}</b><small>com facção ativa</small></article><article><span>VAGOS</span><b>${total-occupied}</b><small>sem ocupação</small></article><article><span>EXIBIDOS</span><b>${rows.length}</b><small>filtro atual</small></article>`;
 box.innerHTML=rows.length?rows.map(f=>`<article class="admin-group-row" data-group="${esc(f.group)}"><div class="admin-group-identity"><b>${esc(f.group||'—')}</b><span>${esc(f.qg||'SEM QG')}</span><small>${esc(f.segmento||'OUTROS')} • ${adminGroupStatus(f)==='ATIVA'?'OCUPADO':'VAGO'}</small></div><div class="admin-group-link"><span>VÍNCULO ATUAL</span><b>${esc(f.faccao||'SEM FACÇÃO')}</b><small>${esc(f.lider||f.staff||'—')}</small></div><div class="admin-group-product"><span>PRODUTO / OPERAÇÃO</span><b>${esc(f.produto||'—')}</b></div><div class="admin-group-actions"><button type="button" class="mini-btn admin-group-full-edit" data-id="${esc(f.id||f.group)}">EDITAR COMPLETO</button><button type="button" class="mini-btn admin-group-rename" data-group="${esc(f.group)}">RENOMEAR</button></div></article>`).join(''):'<div class="dash-empty">Nenhum Group encontrado com esse filtro.</div>';
 box.querySelectorAll('.admin-group-full-edit').forEach(b=>b.onclick=()=>{const f=faccoes.find(x=>(x.id||x.group)===b.dataset.id);if(!f)return;activateAppPage('faccoes');openFac(f.id||f.group)});
 box.querySelectorAll('.admin-group-rename').forEach(b=>b.onclick=()=>renameAdminGroup(b.dataset.group));
}
async function renameAdminGroup(oldGroup){
 if(!isAdmin())return;const current=faccoes.find(f=>alvesNorm(f.group)===alvesNorm(oldGroup));if(!current)return alert('Group não encontrado.');
 const nextRaw=prompt(`Novo nome para ${current.group}:`,current.group);if(nextRaw===null)return;const next=String(nextRaw||'').trim();if(!next||next===current.group)return;if(faccoes.some(f=>alvesNorm(f.group)===alvesNorm(next)))return alert('Já existe um Group com esse nome.');
 if(!confirm(`Renomear o Group ${current.group} para ${next}?\n\nO vínculo da facção ocupante será atualizado. O histórico antigo será preservado.`))return;
 try{
  const before=clonePlain(current),payload={...current,group:next,groupOriginal:current.groupOriginal||current.group,updatedAt:serverTimestamp(),updatedBy:currentUser.email};delete payload.id;
  await setDoc(doc(db,'highos','data','faccoes',next),payload,{merge:false});await deleteDoc(doc(db,'highos','data','faccoes',current.id||current.group));
  const linked=organizacoes.filter(o=>alvesNorm(o.groupAtual)===alvesNorm(current.group));for(const o of linked){await setDoc(doc(db,'highos','data','organizacoes',o.id||orgKey(o.nome)),{groupAtual:next,updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true})}
  await addDoc(histCol,{sessionId:currentSessionId||'',tipo:'RENOMEAR_GROUP',group:next,groupAnterior:current.group,faccao:current.faccao||'',descricao:`Group ${current.group} renomeado para ${next}`,antes:before,depois:{...clonePlain(payload),group:next},usuario:currentUser.email,data:serverTimestamp()});
  await loadFaccoes();await loadOrganizations();renderAdminGroupManager();alert(`Group renomeado para ${next}.`);
 }catch(e){alert('Erro ao renomear Group: '+e.message)}
}
$('#adminGroupSearch')?.addEventListener('input',renderAdminGroupManager);$('#adminGroupStatus')?.addEventListener('change',renderAdminGroupManager);

// ===== HIGH OS V8.18 · ADMINISTRAÇÃO ORGANIZADA =====
function openAdminTab(tab='acessos'){document.querySelectorAll('[data-admin-tab]').forEach(b=>b.classList.toggle('active',b.dataset.adminTab===tab));document.querySelectorAll('[data-admin-panel]').forEach(p=>p.classList.toggle('active',p.dataset.adminPanel===tab));if(tab==='auditoria'&&isAdmin())loadUserAudit();if(tab==='groups'&&isAdmin())renderAdminGroupManager()}
document.querySelectorAll('[data-admin-tab]').forEach(b=>b.addEventListener('click',()=>openAdminTab(b.dataset.adminTab)));
$('#dashCfgSave')?.addEventListener('click',saveDashboardConfig);
['dashCfgAtencao','dashCfgCritico','dashCfgMinComparacoes'].forEach(id=>$('#'+id)?.addEventListener('input',()=>{const raw={quedaAtencaoPct:Number($('#dashCfgAtencao')?.value)||15,quedaCriticaPct:Number($('#dashCfgCritico')?.value)||30,minComparacoes:Number($('#dashCfgMinComparacoes')?.value)||4};const old=dashboardConfig;dashboardConfig=sanitizeDashboardConfig(raw);renderDashboardConfigAdmin();dashboardConfig=old;}));
$('#adminOpenUsersBtn')?.addEventListener('click',()=>activateAppPage('usuarios'));

console.info('HIGH OS V8.20 · Facções livres: status obrigatório Discord + relatórios + status ativo por ocupação');

// HIGH OS V8.20 · status da facção é determinado pela ocupação do Group.
async function normalizeOccupationStatusV820(){
 const changes=[];
 faccoes.forEach(f=>{const active=!!String(f.faccao||'').trim(),wanted=active?'ATIVA':'INATIVA';if(f.status!==wanted)changes.push({f,wanted})});
 if(!changes.length)return;
 faccoes=faccoes.map(f=>{const hit=changes.find(x=>x.f.group===f.group);return hit?{...f,status:hit.wanted}:f});
 if(isAdmin()){
  try{const batch=writeBatch(db);changes.forEach(({f,wanted})=>batch.set(doc(db,'highos','data','faccoes',f.group),{status:wanted,updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true}));await batch.commit();await addDoc(histCol,{sessionId:currentSessionId||'',tipo:'STATUS_OCUPACAO_NORMALIZADO',descricao:`${changes.length} Group(s) tiveram o status ajustado automaticamente pela ocupação`,grupos:changes.map(x=>x.f.group),usuario:currentUser.email,data:serverTimestamp()})}catch(e){console.warn('Falha ao normalizar status por ocupação',e)}
 }
 renderFaccoes();renderAvailableFaccoes();renderOrganizations();
}
const _loadFaccoesV820=loadFaccoes;
loadFaccoes=async function(){await _loadFaccoesV820();await normalizeOccupationStatusV820()};


// ===== HIGH OS V8.26 · COMUNICAÇÃO FLUTUANTE + SPOTIFY CONNECT =====
function spotifyEmbedUrl(value=''){const v=String(value||'').trim();if(!v)return '';const m=v.match(/open\.spotify\.com\/(?:intl-[^/]+\/)?(track|playlist|album|artist|episode|show)\/([A-Za-z0-9]+)/i);return m?`https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator`:''}
function spotifyRedirectUri(){return `${location.origin}${location.pathname}`}
async function loadSpotifyConfig(){try{const s=await getDoc(spotifyConfigDoc);spotifyConfig=s.exists()?{...spotifyConfig,...s.data()}:spotifyConfig}catch(e){console.warn('Spotify config',e)}renderSpotify();await spotifyHandleCallback();await spotifyRestoreSession()}
function renderSpotify(){const box=$('#spotifyPlayer'),input=$('#spotifyUrl'),cid=$('#spotifyClientId'),redir=$('#spotifyRedirectUri');if(input&&!input.matches(':focus'))input.value=spotifyConfig.url||'';if(cid&&!cid.matches(':focus'))cid.value=spotifyConfig.clientId||'';if(redir)redir.value=spotifyRedirectUri();if(box){const src=spotifyEmbedUrl(spotifyConfig.url);box.innerHTML=src?`<iframe src="${esc(src)}" width="100%" height="352" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title="Spotify Player"></iframe>`:'<div class="spotify-empty"><b>♫</b><h3>SEM LINK PÚBLICO</h3><p>O Spotify Connect real funciona pelo player no topo. Este bloco é apenas um fallback para links públicos.</p></div>'}renderSpotifyAuthUI()}
async function saveSpotifyConfig(){if(!canEditModule('spotify'))return permissionDeniedMessage('spotify',true);const url=$('#spotifyUrl')?.value.trim()||'';if(url&&!spotifyEmbedUrl(url))return alert('Informe um link válido do open.spotify.com.');const before={...spotifyConfig};try{spotifyConfig={...spotifyConfig,url};await setDoc(spotifyConfigDoc,{url,updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true});await addDoc(histCol,{sessionId:currentSessionId||'',tipo:'SPOTIFY_CONFIG',descricao:'Link público Spotify atualizado',antes:before,depois:{url},usuario:currentUser.email,data:serverTimestamp()});renderSpotify()}catch(e){spotifyConfig=before;alert('Erro ao salvar Spotify: '+e.message)}}
async function saveSpotifyClient(){if(!isAdmin())return;const clientId=$('#spotifyClientId')?.value.trim()||'';if(clientId&&clientId.length<10)return alert('Client ID inválido.');spotifyConfig={...spotifyConfig,clientId};await setDoc(spotifyConfigDoc,{clientId,redirectUri:spotifyRedirectUri(),updatedAt:serverTimestamp(),updatedBy:currentUser.email},{merge:true});renderSpotify();alert('Client ID salvo. Cadastre a Redirect URI exibida no painel do Spotify exatamente como está.')}
function base64url(bytes){return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
async function spotifyLogin(){if(!spotifyConfig.clientId)return alert('O ADMIN precisa configurar o Client ID do aplicativo Spotify.');const verifier=base64url(crypto.getRandomValues(new Uint8Array(64))),digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier)),challenge=base64url(digest);sessionStorage.setItem('highos_spotify_verifier',verifier);sessionStorage.setItem('highos_spotify_state',crypto.randomUUID());const state=sessionStorage.getItem('highos_spotify_state');const scopes=['streaming','user-read-email','user-read-private','user-read-playback-state','user-modify-playback-state','playlist-read-private'].join(' ');const q=new URLSearchParams({client_id:spotifyConfig.clientId,response_type:'code',redirect_uri:spotifyRedirectUri(),scope:scopes,code_challenge_method:'S256',code_challenge:challenge,state});location.href='https://accounts.spotify.com/authorize?'+q}
async function spotifyHandleCallback(){const q=new URLSearchParams(location.search),code=q.get('code'),state=q.get('state');if(!code)return;const verifier=sessionStorage.getItem('highos_spotify_verifier'),expected=sessionStorage.getItem('highos_spotify_state');history.replaceState({},'',spotifyRedirectUri());if(!verifier||!expected||state!==expected)return alert('Não foi possível validar o retorno do Spotify. Tente conectar novamente.');try{const body=new URLSearchParams({client_id:spotifyConfig.clientId,grant_type:'authorization_code',code,redirect_uri:spotifyRedirectUri(),code_verifier:verifier});const r=await fetch('https://accounts.spotify.com/api/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body});const t=await r.json();if(!r.ok)throw new Error(t.error_description||t.error||'Falha OAuth');localStorage.setItem('highos_spotify_token',JSON.stringify({...t,expires_at:Date.now()+t.expires_in*1000}));sessionStorage.removeItem('highos_spotify_verifier');sessionStorage.removeItem('highos_spotify_state');await spotifyRestoreSession()}catch(e){alert('Erro ao conectar Spotify: '+e.message)}}
async function spotifyRefreshToken(s){if(!s?.refresh_token||!spotifyConfig.clientId)return null;const body=new URLSearchParams({client_id:spotifyConfig.clientId,grant_type:'refresh_token',refresh_token:s.refresh_token});const r=await fetch('https://accounts.spotify.com/api/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body});const t=await r.json();if(!r.ok)return null;const n={...s,...t,refresh_token:t.refresh_token||s.refresh_token,expires_at:Date.now()+t.expires_in*1000};localStorage.setItem('highos_spotify_token',JSON.stringify(n));return n}
async function spotifyRestoreSession(){let s;try{s=JSON.parse(localStorage.getItem('highos_spotify_token')||'null')}catch{}if(!s)return renderSpotifyAuthUI();if(Date.now()>Number(s.expires_at||0)-60000)s=await spotifyRefreshToken(s);if(!s)return renderSpotifyAuthUI();spotifyAccessToken=s.access_token;spotifyTokenExpiry=s.expires_at;await spotifyLoadProfile();spotifyLoadSDK();renderSpotifyAuthUI()}
async function spotifyApi(path,opts={}){if(!spotifyAccessToken)throw new Error('Conecte sua conta Spotify.');const r=await fetch('https://api.spotify.com/v1'+path,{...opts,headers:{Authorization:'Bearer '+spotifyAccessToken,'Content-Type':'application/json',...(opts.headers||{})}});if(r.status===204)return null;const j=await r.json().catch(()=>null);if(!r.ok)throw new Error(j?.error?.message||`Spotify ${r.status}`);return j}
async function spotifyLoadProfile(){try{const me=await spotifyApi('/me');const n=$('#spotifyAccountName');if(n)n.textContent=me.display_name||me.email||'Spotify conectado';const s=$('#spotifyRealStatus');if(s)s.textContent=`Conectado como ${me.display_name||me.email}. O player no topo usa esta conta.`}catch(e){console.warn(e)}}
function spotifyLoadSDK(){if(window.Spotify){spotifyCreatePlayer();return}if(document.querySelector('script[data-highos-spotify-sdk]'))return;window.onSpotifyWebPlaybackSDKReady=spotifyCreatePlayer;const s=document.createElement('script');s.src='https://sdk.scdn.co/spotify-player.js';s.dataset.highosSpotifySdk='1';document.head.appendChild(s)}
function spotifyCreatePlayer(){if(!window.Spotify||!spotifyAccessToken||spotifyPlayer)return;spotifyPlayer=new Spotify.Player({name:'High OS',getOAuthToken:cb=>cb(spotifyAccessToken),volume:.45});spotifyPlayer.addListener('ready',async({device_id})=>{spotifyDeviceId=device_id;renderSpotifyAuthUI();try{await spotifyApi('/me/player',{method:'PUT',body:JSON.stringify({device_ids:[device_id],play:false})})}catch(e){console.warn('Transfer playback',e)}});spotifyPlayer.addListener('player_state_changed',state=>{if(!state)return;const t=state.track_window?.current_track;const title=$('#spotifyNowTitle'),artist=$('#spotifyNowArtist');if(title)title.textContent=t?.name||'Spotify';if(artist)artist.textContent=t?.artists?.map(a=>a.name).join(', ')||'High OS';const g=$('#spotifyPlayGlyph');if(g)g.textContent=state.paused?'▶':'❚❚'});spotifyPlayer.addListener('authentication_error',({message})=>console.warn(message));spotifyPlayer.addListener('account_error',({message})=>{const s=$('#spotifyRealStatus');if(s)s.textContent='Spotify informou restrição de conta/Playback: '+message});spotifyPlayer.connect()}
function renderSpotifyAuthUI(){const dock=$('#spotifyTopDock');if(dock)dock.classList.toggle('hidden',!currentUser||!canViewModule('spotify'));const a=$('#spotifyDockAuth');if(a)a.innerHTML=spotifyAccessToken?`<span class="spotify-connected">● CONECTADO${spotifyDeviceId?' • PLAYER PRONTO':''}</span>`:`<button type="button" id="spotifyDockLoginNow">CONECTAR CONTA SPOTIFY</button>`;$('#spotifyDockLoginNow')?.addEventListener('click',spotifyLogin);const b=$('#spotifyLoginBtn');if(b){b.textContent=spotifyAccessToken?'RECONECTAR SPOTIFY':'CONECTAR SPOTIFY';b.onclick=spotifyLogin}}
async function spotifySearch(){const q=$('#spotifySearchInput')?.value.trim();if(!q)return;const box=$('#spotifySearchResults');if(box)box.innerHTML='<small>Buscando...</small>';try{const x=await spotifyApi('/search?type=track&limit=8&q='+encodeURIComponent(q));const items=x?.tracks?.items||[];if(box)box.innerHTML=items.map(t=>`<button type="button" data-spotify-uri="${esc(t.uri)}"><img src="${esc(t.album?.images?.at(-1)?.url||'')}" alt=""><span><b>${esc(t.name)}</b><small>${esc(t.artists?.map(a=>a.name).join(', ')||'')}</small></span>▶</button>`).join('')||'<small>Nenhuma faixa encontrada.</small>';box?.querySelectorAll('[data-spotify-uri]').forEach(b=>b.onclick=()=>spotifyPlayUri(b.dataset.spotifyUri))}catch(e){if(box)box.innerHTML=`<small>${esc(e.message)}</small>`}}
async function spotifyPlayUri(uri){if(!spotifyDeviceId)return alert('Player ainda não está pronto. Aguarde alguns segundos após conectar.');try{await spotifyApi('/me/player/play?device_id='+encodeURIComponent(spotifyDeviceId),{method:'PUT',body:JSON.stringify({uris:[uri]})})}catch(e){alert(e.message)}}

function chatTime(v){const d=v?.toDate?v.toDate():v?.seconds?new Date(v.seconds*1000):v?.createdAtText?new Date(v.createdAtText):null;return d&&!isNaN(d)?d.toLocaleString('pt-BR'):'agora'}
function hmInitials(v=''){const parts=String(v||'H').trim().split(/\s+/).filter(Boolean);return (parts[0]?.[0]||'H')+(parts.length>1?(parts.at(-1)?.[0]||''):'')}
function hmUser(email=''){return usuarios.find(u=>String(u.email||'').toLowerCase()===String(email||'').toLowerCase())||null}
function hmUserName(u){return u?.name||u?.nome||u?.displayName||u?.email||'Usuário'}
function hmUserRole(u){return u?.cargo||u?.role||'MEMBRO'}
function chatAttachmentHtml(m){const a=m.anexo;if(!a)return '';if(String(a.type||'').startsWith('image/'))return `<a class="chat-attachment image ${String(a.type||'')==='image/gif'?'gif':''}" href="${esc(a.dataUrl)}" target="_blank"><img src="${esc(a.dataUrl)}" alt="${esc(a.name||'imagem')}"><span>${String(a.type||'')==='image/gif'?'GIF • ':''}${esc(a.name||'imagem')}</span></a>`;return `<a class="chat-attachment file" href="${esc(a.dataUrl)}" download="${esc(a.name||'arquivo')}">📎 ${esc(a.name||'arquivo')} <small>${Math.round((a.size||0)/1024)} KB</small></a>`}
function chatStickerHtml(m){return m.sticker?`<div class="hm-sticker" title="Figurinha">${esc(m.sticker)}</div>`:''}
function chatMeetingHtml(m){if(!m.reuniao?.url)return '';const mine=String(m.email||'').toLowerCase()===String(currentUser?.email||'').toLowerCase();return `<div class="chat-call-card"><div class="chat-call-icon">☎</div><div class="chat-call-info"><b>${mine?'Você iniciou uma chamada':`${esc(m.nome||'Usuário')} iniciou uma chamada`}</b><small>Áudio • vídeo • tela • arquivos</small></div><button type="button" class="chat-meeting-invite" data-meeting-url="${esc(m.reuniao.url)}" data-room="${esc(m.reuniao.room||'Sala')}" data-meeting-title="${esc('Chamada com '+(mine?(hmUserName(hmUser(chatRecipientEmail))||'usuário'):(m.nome||'usuário')))}">${mine?'ENTRAR':'ATENDER'}</button></div>`}
function chatConversationId(a='',b=''){return [String(a).toLowerCase(),String(b).toLowerCase()].sort().join('::')}
function populateChatRecipients(){const sel=$('#chatRecipientSelect');if(!sel||!currentUser)return;const me=(currentUser.email||'').toLowerCase(),keep=chatRecipientEmail||sel.value;const list=usuarios.filter(u=>String(u.email||'').toLowerCase()!==me&&u.active!==false);sel.innerHTML='<option value="">Selecione um usuário</option>'+list.map(u=>`<option value="${esc(u.email)}">${esc(hmUserName(u))} • ${esc(hmUserRole(u))}</option>`).join('');if(keep&&list.some(u=>String(u.email||'').toLowerCase()===String(keep).toLowerCase())){sel.value=keep;chatRecipientEmail=keep}renderHmContacts()}
function privateChatItems(items=[]){if(!chatRecipientEmail||!currentUser)return [];const cid=chatConversationId(currentUser.email,chatRecipientEmail);return items.filter(m=>m.conversationId===cid||(m.recipientEmail&&chatConversationId(m.email,m.recipientEmail)===cid))}
function hmLastMessageFor(email){const cid=chatConversationId(currentUser?.email||'',email);return [...chatItems].reverse().find(m=>m.conversationId===cid||(m.recipientEmail&&chatConversationId(m.email,m.recipientEmail)===cid))}
function renderHmContacts(){const box=$('#hmContactList');if(!box||!currentUser)return;const q=String($('#hmContactSearch')?.value||'').trim().toLowerCase(),me=String(currentUser.email||'').toLowerCase();const list=usuarios.filter(u=>u.active!==false&&String(u.email||'').toLowerCase()!==me).filter(u=>`${hmUserName(u)} ${hmUserRole(u)} ${u.email||''}`.toLowerCase().includes(q)).sort((a,b)=>hmUserName(a).localeCompare(hmUserName(b),'pt-BR'));box.innerHTML=list.length?list.map(u=>{const active=String(u.email||'').toLowerCase()===String(chatRecipientEmail||'').toLowerCase(),last=hmLastMessageFor(u.email);const preview=last?(last.texto||last.sticker||last.anexo?.name||(last.reuniao?'Chamada':'Mensagem')):'Clique para conversar';return `<button type="button" class="hm-contact ${active?'active':''}" data-hm-email="${esc(u.email||'')}"><span class="hm-contact-avatar">${u.photoURL?`<img src="${esc(u.photoURL)}" alt="">`:esc(hmInitials(hmUserName(u)))}</span><span class="hm-contact-copy"><b>${esc(hmUserName(u))}</b><small><i>${esc(hmUserRole(u))}</i> • ${esc(String(preview).slice(0,42))}</small></span><span class="hm-contact-state" title="Usuário cadastrado">●</span></button>`}).join(''):'<div class="chat-empty">Nenhum usuário cadastrado encontrado.</div>';box.querySelectorAll('[data-hm-email]').forEach(b=>b.onclick=()=>selectChatRecipient(b.dataset.hmEmail))}
function selectChatRecipient(email){chatRecipientEmail=email||'';const sel=$('#chatRecipientSelect');if(sel)sel.value=chatRecipientEmail;renderChatMessages(chatItems);toggleHmPicker(false);setTimeout(()=>$('#floatingChatInput')?.focus(),30)}
function renderChatMessages(items=[]){chatItems=items;populateChatRecipients();const me=(currentUser?.email||'').toLowerCase(),visible=privateChatItems(items),target=hmUser(chatRecipientEmail),title=$('#teamChatTitle'),presence=$('#teamChatPresence'),av=$('#hmActiveAvatar');if(title)title.textContent=target?hmUserName(target):'Selecione uma conversa';if(presence)presence.textContent=target?`${hmUserRole(target)} • mensagens disponíveis mesmo offline`:'Usuários cadastrados aparecem mesmo offline';if(av){av.innerHTML=target?.photoURL?`<img src="${esc(target.photoURL)}" alt="">`:esc(hmInitials(target?hmUserName(target):'High'));}const body=!chatRecipientEmail?'<div class="chat-empty hm-empty"><b>Mensagens diretas</b><span>Selecione um membro da equipe. A conversa fica salva mesmo quando ele estiver offline.</span></div>':visible.length?visible.map(m=>`<article class="chat-message ${String(m.email||'').toLowerCase()===me?'mine':''}"><div class="chat-message-avatar">${m.photoURL?`<img src="${esc(m.photoURL)}" alt="">`:esc(hmInitials(m.nome||m.email))}</div><div class="chat-message-bubble"><header><b>${esc(m.nome||m.email||'Usuário')}</b><small>${esc(m.cargo||'')} • ${esc(chatTime(m.createdAt||m))}</small></header>${m.texto?`<p>${esc(m.texto)}</p>`:''}${chatStickerHtml(m)}${chatAttachmentHtml(m)}${chatMeetingHtml(m)}${isAdmin()?`<button type="button" class="chat-delete" data-chat-delete="${esc(m.id)}" title="Excluir mensagem">×</button>`:''}</div></article>`).join(''):'<div class="chat-empty hm-empty"><b>Nenhuma mensagem ainda</b><span>Envie texto, emoji, GIF, figurinha, foto ou arquivo.</span></div>';['#chatMessages','#floatingChatMessages'].forEach(sel=>{const b=$(sel);if(!b)return;b.innerHTML=body;b.scrollTop=b.scrollHeight;b.querySelectorAll('[data-chat-delete]').forEach(x=>x.onclick=()=>deleteChatMessage(x.dataset.chatDelete));b.querySelectorAll('[data-meeting-url]').forEach(x=>x.onclick=()=>openTeamMeeting(x.dataset.meetingUrl,x.dataset.room,'',x.dataset.meetingTitle||'HIGH CALL'))});renderHmContacts()}
function startChat(){if(chatUnsubscribe||!currentUser||!canViewModule('chat'))return;$('#teamChatLauncher')?.classList.remove('hidden');try{chatUnsubscribe=onSnapshot(chatCol,qs=>{const items=qs.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>{const ta=a.createdAt?.seconds||new Date(a.createdAtText||0).getTime()/1000,tb=b.createdAt?.seconds||new Date(b.createdAtText||0).getTime()/1000;return ta-tb}).slice(-300);renderChatMessages(items);if(activeMeetingRoom)renderTeamCallFiles()},e=>{const box=$('#floatingChatMessages');if(box)box.innerHTML=`<div class="chat-empty">Não foi possível carregar o chat: ${esc(e.message)}</div>`})}catch(e){console.warn(e)}}
async function sendChatMessage(inputSelector='#floatingChatInput',extra={}){if(!canEditModule('chat'))return permissionDeniedMessage('chat',true);if(!chatRecipientEmail)return alert('Selecione com quem deseja conversar.');const input=$(inputSelector),texto=input?.value.trim()||'';if(!texto&&!chatPendingAttachment&&!extra.sticker)return;if(texto.length>1000)return alert('Mensagem muito longa. Limite: 1000 caracteres.');try{await addDoc(chatCol,{texto,sticker:extra.sticker||'',anexo:chatPendingAttachment||null,recipientEmail:chatRecipientEmail,conversationId:chatConversationId(currentUser.email,chatRecipientEmail),email:currentUser.email||'',nome:currentProfile?.name||currentUser.displayName||currentUser.email,cargo:currentProfile?.cargo||currentProfile?.role||'',photoURL:currentProfile?.photoURL||currentUser.photoURL||'',sessionId:currentSessionId||'',createdAt:serverTimestamp(),createdAtText:new Date().toISOString()});if(input)input.value='';chatPendingAttachment=null;renderChatAttachmentPreview();toggleHmPicker(false)}catch(e){alert('Erro ao enviar mensagem: '+e.message)}}
async function deleteChatMessage(id){if(!isAdmin())return;try{await deleteDoc(doc(db,'highos','data','chat_mensagens',id));await addDoc(histCol,{sessionId:currentSessionId||'',tipo:'CHAT_EXCLUSAO',descricao:'Mensagem removida do chat interno',usuario:currentUser.email,data:serverTimestamp()})}catch(e){alert('Erro ao excluir mensagem: '+e.message)}}
function toggleFloatingChat(force){const p=$('#teamChatFloat');if(!p)return;const show=force===undefined?p.classList.contains('hidden'):!!force;p.classList.toggle('hidden',!show);if(show){renderHmContacts();setTimeout(()=>$('#floatingChatInput')?.focus(),50)}}
function renderChatAttachmentPreview(){const p=$('#chatAttachmentPreview');if(!p)return;if(!chatPendingAttachment){p.classList.add('hidden');p.innerHTML='';return}p.classList.remove('hidden');p.innerHTML=`<span>📎 ${esc(chatPendingAttachment.name)} • ${Math.round(chatPendingAttachment.size/1024)} KB</span><button type="button" id="chatAttachmentClear">×</button>`;$('#chatAttachmentClear').onclick=()=>{chatPendingAttachment=null;renderChatAttachmentPreview()}}
async function prepareChatAttachment(file){if(!file)return;if(file.size>600*1024)return alert('Para manter o chat rápido e dentro do limite do Firestore, o anexo pode ter no máximo 600 KB.');const dataUrl=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)});chatPendingAttachment={name:file.name,type:file.type||'application/octet-stream',size:file.size,dataUrl};renderChatAttachmentPreview()}
function hmDisplayName(){const n=currentProfile?.name||currentUser?.displayName||currentUser?.email||'Usuário',r=currentProfile?.cargo||currentProfile?.role||'MEMBRO';return `${n} • ${r}`}
const HIGH_CALL_HOST='meet.ffmuc.net';
function jitsiUrl(room){const display=encodeURIComponent(hmDisplayName());return `https://${HIGH_CALL_HOST}/${room}#userInfo.displayName=${display}&config.prejoinConfig.enabled=false&config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=true&config.disableDeepLinking=true&config.enableWelcomePage=false&config.enableLobby=false`}

async function startTeamMeeting(mode='video'){if(!canEditModule('chat'))return permissionDeniedMessage('chat',true);if(!chatRecipientEmail)return alert('Selecione o usuário que deseja chamar.');const room=`high-os-dm-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,url=`https://${HIGH_CALL_HOST}/${room}`;try{await addDoc(chatCol,{texto:'',reuniao:{room,url,status:'calling',mode},recipientEmail:chatRecipientEmail,conversationId:chatConversationId(currentUser.email,chatRecipientEmail),email:currentUser.email||'',nome:currentProfile?.name||currentUser.displayName||currentUser.email,cargo:currentProfile?.cargo||currentProfile?.role||'',photoURL:currentProfile?.photoURL||currentUser.photoURL||'',createdAt:serverTimestamp(),createdAtText:new Date().toISOString()});const target=hmUser(chatRecipientEmail);openTeamMeeting(url,room,'',`Chamada • ${target?hmUserName(target):'Equipe'}`,mode==='audio')}catch(e){alert('Não foi possível iniciar a chamada: '+e.message)}}
const HM_VOICE_CHANNELS={ilegal1:{name:'Equipe do Ilegal 1',room:'high-os-equipe-ilegal-1'},ilegal2:{name:'Equipe do Ilegal 2',room:'high-os-equipe-ilegal-2'}};
function joinTeamVoiceChannel(id){if(!canViewModule('chat'))return permissionDeniedMessage('chat');const c=HM_VOICE_CHANNELS[id];if(!c)return;openTeamMeeting(`https://${HIGH_CALL_HOST}/${c.room}`,c.room,id,c.name,false)}
function renderTeamCallFiles(){const box=$('#teamCallFiles');if(!box)return;let rows=[];if(activeMeetingChannel)rows=chatItems.filter(m=>m.callFile&&m.callChannel===activeMeetingChannel&&m.reuniao?.room===activeMeetingRoom);else rows=privateChatItems(chatItems).filter(m=>m.callFile&&m.reuniao?.room===activeMeetingRoom);box.innerHTML=rows.length?rows.map(m=>`<a class="team-call-file-item" href="${esc(m.callFile.dataUrl)}" ${String(m.callFile.type||'').startsWith('image/')?'target="_blank"':`download="${esc(m.callFile.name||'arquivo')}"`}><span class="team-call-file-type">${String(m.callFile.type||'').startsWith('image/')?'▧':'⇩'}</span><span><b>${esc(m.callFile.name||'arquivo')}</b><small>${esc(m.nome||m.email||'Usuário')} • ${esc(m.cargo||'')} • ${Math.round((m.callFile.size||0)/1024)} KB</small></span></a>`).join(''):'<div class="chat-empty">Nenhum item compartilhado nesta chamada.</div>'}
function renderTeamCallFilePreview(){const p=$('#teamCallFilePreview');if(!p)return;if(!teamCallPendingFile){p.classList.add('hidden');p.innerHTML='';return}p.classList.remove('hidden');p.innerHTML=`<span>📎 ${esc(teamCallPendingFile.name)} • ${Math.round(teamCallPendingFile.size/1024)} KB</span><button type="button" id="teamCallFileClear">×</button>`;$('#teamCallFileClear').onclick=()=>{teamCallPendingFile=null;renderTeamCallFilePreview()}}
async function sendTeamCallFile(file){if(!file||!activeMeetingRoom)return;if(!activeMeetingChannel&&!chatRecipientEmail)return alert('Não foi possível identificar a conversa desta call.');if(file.size>600*1024)return alert('Arquivo muito grande. Limite atual: 600 KB.');const dataUrl=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)});teamCallPendingFile={name:file.name,type:file.type||'application/octet-stream',size:file.size,dataUrl};renderTeamCallFilePreview();try{const payload={texto:'',callFile:teamCallPendingFile,reuniao:{room:activeMeetingRoom,url:activeMeetingUrl},callChannel:activeMeetingChannel||'',email:currentUser.email||'',nome:currentProfile?.name||currentUser.displayName||currentUser.email,cargo:currentProfile?.cargo||currentProfile?.role||'',photoURL:currentProfile?.photoURL||currentUser.photoURL||'',createdAt:serverTimestamp(),createdAtText:new Date().toISOString()};if(!activeMeetingChannel){payload.recipientEmail=chatRecipientEmail;payload.conversationId=chatConversationId(currentUser.email,chatRecipientEmail)}await addDoc(chatCol,payload);teamCallPendingFile=null;renderTeamCallFilePreview()}catch(e){alert('Erro ao compartilhar arquivo: '+e.message)}}
function openTeamMeeting(url,room='Sala High OS',channel='',title='HIGH CALL',audioOnly=false){const o=$('#teamMeetingOverlay'),f=$('#teamMeetingFrame');if(!o||!f)return;activeMeetingRoom=room;activeMeetingUrl=url;activeMeetingChannel=channel||'';const ttl=$('#teamMeetingTitle');if(ttl)ttl.textContent=title;$('#teamMeetingRoomLabel').textContent=channel?'Canal de equipe • várias pessoas • voz • vídeo • tela • arquivos':'Chamada direta • voz • vídeo • tela • arquivos';const finalUrl=jitsiUrl(room)+(audioOnly?'&config.startWithVideoMuted=true':'');f.src=finalUrl;o.classList.remove('hidden');renderTeamCallFiles()}
function closeTeamMeeting(){const o=$('#teamMeetingOverlay'),f=$('#teamMeetingFrame');if(f)f.src='about:blank';o?.classList.add('hidden');activeMeetingRoom='';activeMeetingUrl='';activeMeetingChannel='';teamCallPendingFile=null;renderTeamCallFilePreview()}
function toggleHmPicker(force,type='emoji'){const p=$('#hmPicker');if(!p)return;const show=force===undefined?p.classList.contains('hidden'):!!force;if(!show){p.classList.add('hidden');p.innerHTML='';return}const emojis=['👍','✅','🔥','👀','📌','🚨','😂','💜','👏','🤝','🎯','💡','⚡','🫡','😎','🥳'];const stickers=['🔥','💜','🚨','✅','👑','🎯','🫡','😂','🤝','⚡','📢','🏆'];if(type==='emoji')p.innerHTML=`<div class="hm-picker-title">EMOJIS</div><div class="hm-picker-grid">${emojis.map(x=>`<button type="button" data-hm-emoji="${x}">${x}</button>`).join('')}</div>`;else p.innerHTML=`<div class="hm-picker-title">FIGURINHAS</div><div class="hm-sticker-grid">${stickers.map(x=>`<button type="button" data-hm-sticker="${x}">${x}</button>`).join('')}</div>`;p.classList.remove('hidden');p.querySelectorAll('[data-hm-emoji]').forEach(b=>b.onclick=()=>{const i=$('#floatingChatInput');if(i){i.value+=b.dataset.hmEmoji;i.focus()}toggleHmPicker(false)});p.querySelectorAll('[data-hm-sticker]').forEach(b=>b.onclick=()=>sendChatMessage('#floatingChatInput',{sticker:b.dataset.hmSticker}))}

$('#spotifySaveBtn')?.addEventListener('click',saveSpotifyConfig);$('#spotifySaveClientBtn')?.addEventListener('click',saveSpotifyClient);$('#spotifyLoginBtn')?.addEventListener('click',spotifyLogin);$('#spotifySearchBtn')?.addEventListener('click',spotifySearch);$('#spotifySearchInput')?.addEventListener('keydown',e=>{if(e.key==='Enter')spotifySearch()});$('#spotifyPlayBtn')?.addEventListener('click',()=>spotifyPlayer?.togglePlay());$('#spotifyPrevBtn')?.addEventListener('click',()=>spotifyPlayer?.previousTrack());$('#spotifyNextBtn')?.addEventListener('click',()=>spotifyPlayer?.nextTrack());$('#spotifyDockMain')?.addEventListener('click',e=>{if(e.target.closest('#spotifyPlayGlyph'))spotifyPlayer?.togglePlay()});
$('#chatRecipientSelect')?.addEventListener('change',e=>selectChatRecipient(e.target.value));$('#chatVideoCallBtn')?.addEventListener('click',()=>startTeamMeeting('video'));$('#chatAudioCallBtn')?.addEventListener('click',()=>startTeamMeeting('audio'));$('#teamChatLauncher')?.addEventListener('click',()=>toggleFloatingChat());$('#chatFloatMin')?.addEventListener('click',()=>toggleFloatingChat(false));$('#chatPageOpenFloat')?.addEventListener('click',()=>toggleFloatingChat(true));$('#floatingChatSendBtn')?.addEventListener('click',()=>sendChatMessage('#floatingChatInput'));$('#floatingChatInput')?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendChatMessage('#floatingChatInput')}});$('#chatAttachInput')?.addEventListener('change',e=>{prepareChatAttachment(e.target.files?.[0]);e.target.value=''});$('#teamMeetingClose')?.addEventListener('click',closeTeamMeeting);$('#teamCallFileInput')?.addEventListener('change',e=>{sendTeamCallFile(e.target.files?.[0]);e.target.value=''});$('#hmContactSearch')?.addEventListener('input',renderHmContacts);$('#hmNewDmBtn')?.addEventListener('click',()=>{$('#hmContactSearch')?.focus()});$('#hmEmojiBtn')?.addEventListener('click',()=>toggleHmPicker(true,'emoji'));$('#hmStickerBtn')?.addEventListener('click',()=>toggleHmPicker(true,'sticker'));$('#hmGifBtn')?.addEventListener('click',()=>$('#hmGifInput')?.click());$('#hmGifInput')?.addEventListener('change',async e=>{const f=e.target.files?.[0];if(f){await prepareChatAttachment(f);await sendChatMessage('#floatingChatInput')}e.target.value=''});document.querySelectorAll('[data-voice-channel]').forEach(b=>b.addEventListener('click',()=>joinTeamVoiceChannel(b.dataset.voiceChannel)));

$('#metricDailyReportBtn')?.addEventListener('click',printMetricDailyReport);$('#metricTodayBtn')?.addEventListener('click',()=>{const d=new Date(),iso=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;metricDateStart=iso;metricDateEnd=iso;syncMetricDateInputs();renderMetrics()});$('#metricWeekBtn')?.addEventListener('click',()=>{const b=metricWeekBounds(new Date()),iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;metricDateStart=iso(b.start);metricDateEnd=iso(b.end);syncMetricDateInputs();renderMetrics()});

console.info('HIGH OS V8.29 · High Call sem espera de anfitrião + canais imediatos');
