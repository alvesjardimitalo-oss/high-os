const {setGlobalOptions} = require('firebase-functions/v2');
const {onSchedule} = require('firebase-functions/v2/scheduler');
const {onCall, HttpsError} = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const {google} = require('googleapis');

admin.initializeApp();
const db = admin.firestore();
const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'high-os';
const SERVICE_ACCOUNT = `${PROJECT_ID}@appspot.gserviceaccount.com`;

setGlobalOptions({
  region: 'southamerica-east1',
  memory: '512MiB',
  timeoutSeconds: 120,
  serviceAccount: SERVICE_ACCOUNT,
});

const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly';
const CONFIG_PATH = 'highos/metricas_config';
const METRIC_COLLECTION = 'highos/data/metricas';
const GROUP_COLLECTION = 'highos/data/faccoes';
const DELIVERY_COLLECTION = 'highos/data/entregas';
const HISTORY_COLLECTION = 'highos/data/historico';
const SCHEDULE = '5 14,16,21,23 * * *';
const TIME_ZONE = 'America/Sao_Paulo';

function norm(v='') {
  return String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
}
function extractSpreadsheetId(value='') {
  const v=String(value||'').trim();
  const m=v.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if(m) return m[1];
  return /^[a-zA-Z0-9-_]{20,}$/.test(v) ? v : '';
}
function normalizeMetricDate(v) {
  const x=String(v??'').trim(); if(!x) return '';
  let m=x.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if(m){let y=+m[3];if(y<100)y+=2000;return `${String(+m[1]).padStart(2,'0')}/${String(+m[2]).padStart(2,'0')}/${y}`;}
  m=x.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if(m)return `${String(+m[3]).padStart(2,'0')}/${String(+m[2]).padStart(2,'0')}/${m[1]}`;
  return '';
}
function metricDate(v='') {
  const s=normalizeMetricDate(v); const m=s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? new Date(+m[3],+m[2]-1,+m[1],12,0,0) : null;
}
function parseMetricNumber(v){
  if(v===null||v===undefined||String(v).trim()==='')return null;
  const n=Number(String(v).replace(/\s/g,'').replace(',','.'));
  return Number.isFinite(n)?n:null;
}
function metricSlotLabel(v){
  const x=String(v??'').trim().toUpperCase().replace(/\s+/g,'');
  const m=x.match(/^(14|16|21|23)(?:H|:00)?$/); return m?`${m[1]}H`:'';
}
function canonicalGroup(v, knownGroups){
  const raw=String(v??'').trim(); if(!raw)return '';
  const compact=norm(raw).replace(/\s+/g,'');
  if(knownGroups.has(compact))return knownGroups.get(compact);
  const c=raw.replace(/\s+/g,'');
  if(/^(ARMAS|MUNI[CÇ][AÃ]O|MUNICAO|LAVAGEM|DROGAS|DESMANCHE|CONTRABANDO|ESTELIONATARIOS|ILEGALMEDIC|ILEGALMECHANIC)0*\d+$/i.test(c))return c.replace(/^MUNI[CÇ][AÃ]O/i,'Municao');
  if(/^(VANILLA|MANICOMIO)$/i.test(c))return c;
  return '';
}
function parseMetricSheet(values=[], knownGroups=new Map()){
  if(!Array.isArray(values)||!values.length)return [];
  const scanLimit=Math.min(values.length,600), headerIndexes=[];
  for(let i=0;i<scanLimit;i++){
    const labels=(values[i]||[]).map(metricSlotLabel).filter(Boolean), distinct=new Set(labels);
    if(['14H','16H','21H','23H'].every(h=>distinct.has(h))&&labels.length>=8)headerIndexes.push(i);
  }
  if(!headerIndexes.length)return [];
  const nearestDateRow=(headerIndex)=>{
    let best=-1,bestScore=-1;
    for(let i=Math.max(0,headerIndex-12);i<headerIndex;i++){
      const dates=(values[i]||[]).map(normalizeMetricDate).filter(Boolean); if(!dates.length)continue;
      const score=dates.length*1000-(headerIndex-i); if(score>bestScore){bestScore=score;best=i;}
    }
    return best;
  };
  const buildColumnDateMap=(header,dateRow)=>{
    const orderedDates=(dateRow||[]).map(normalizeMetricDate).filter(Boolean); if(!orderedDates.length)return {};
    const map={}; let dayIndex=-1,lastSlot='';
    for(let c=0;c<header.length;c++){
      const h=metricSlotLabel(header[c]); if(!h)continue;
      if(h==='14H'||dayIndex<0||(['16H','21H','23H'].indexOf(h)<=['16H','21H','23H'].indexOf(lastSlot)&&lastSlot))dayIndex++;
      if(dayIndex>=0&&dayIndex<orderedDates.length)map[c]=orderedDates[dayIndex]; lastSlot=h;
    }
    return map;
  };
  const out=[],seenKeys=new Set();
  for(let b=0;b<headerIndexes.length;b++){
    const headerIndex=headerIndexes[b], nextHeader=headerIndexes[b+1]??values.length, dateRowIndex=nearestDateRow(headerIndex); if(dateRowIndex<0)continue;
    const header=values[headerIndex]||[], dateByCol=buildColumnDateMap(header,values[dateRowIndex]||[]); if(!Object.keys(dateByCol).length)continue;
    for(let r=headerIndex+1;r<nextHeader;r++){
      const row=values[r]||[]; let group='';
      for(const cell of row.slice(0,20)){group=canonicalGroup(cell,knownGroups);if(group)break;}
      if(!group)continue;
      const byDate={};
      for(let c=0;c<header.length;c++){
        const h=metricSlotLabel(header[c]); if(!h)continue; const d=dateByCol[c]; if(!d)continue;
        const num=parseMetricNumber(row[c]); if(num===null)continue;
        if(!byDate[d])byDate[d]={group,data:d,slots:{'14H':0,'16H':0,'21H':0,'23H':0},seen:new Set()};
        byDate[d].slots[h]=num; byDate[d].seen.add(h);
      }
      Object.values(byDate).forEach(x=>{
        if(!x.seen.size)return; const key=`${norm(x.group)}|${x.data}`; if(seenKeys.has(key))return;
        seenKeys.add(key); delete x.seen; out.push(x);
      });
    }
  }
  return out;
}
function a1SheetName(name=''){return `'${String(name).replace(/'/g,"''")}'`;}
async function loadSheetRows(spreadsheetId, requestedSheet, knownGroups){
  const auth = new google.auth.GoogleAuth({scopes:[SHEETS_SCOPE]});
  const sheets = google.sheets({version:'v4',auth});
  const readOne=async(title)=>{
    const res=await sheets.spreadsheets.values.get({spreadsheetId,range:`${a1SheetName(title)}!A1:ZZ300`,majorDimension:'ROWS',valueRenderOption:'FORMATTED_VALUE'});
    return parseMetricSheet(res.data.values||[],knownGroups);
  };
  if(requestedSheet){
    const rows=await readOne(requestedSheet); if(!rows.length)throw new Error(`A aba “${requestedSheet}” foi lida, mas o padrão de métricas não foi reconhecido.`);
    return {rows,sheet:requestedSheet};
  }
  const meta=await sheets.spreadsheets.get({spreadsheetId,fields:'sheets.properties(title,index)'});
  const titles=(meta.data.sheets||[]).sort((a,b)=>(a.properties?.index||0)-(b.properties?.index||0)).map(x=>x.properties?.title).filter(Boolean);
  let best={rows:[],sheet:''};
  for(const title of titles){try{const rows=await readOne(title);if(rows.length>best.rows.length)best={rows,sheet:title};}catch(e){}}
  if(!best.rows.length)throw new Error('Nenhuma aba com o padrão 14H / 16H / 21H / 23H foi encontrada.');
  return best;
}
function parseDeliveryDate(v){
  if(!v)return null;
  if(v?.toDate)return v.toDate();
  const d=metricDate(v); if(d)return d;
  const x=new Date(v); return isNaN(x)?null:x;
}
async function loadIdentityContext(){
  const [groupsSnap, deliveriesSnap]=await Promise.all([db.collection(GROUP_COLLECTION).get(),db.collection(DELIVERY_COLLECTION).get()]);
  const groups=new Map(),knownGroups=new Map();
  groupsSnap.forEach(doc=>{const g={id:doc.id,...doc.data()};const key=norm(g.group||doc.id).replace(/\s+/g,'');knownGroups.set(key,g.group||doc.id);groups.set(norm(g.group||doc.id),g);});
  const timeline=new Map();
  deliveriesSnap.forEach(doc=>{const d=doc.data(),group=d.group;if(!group)return;const when=parseDeliveryDate(d.dataEntrega)||parseDeliveryDate(d.createdAt);if(!when)return;const key=norm(group);if(!timeline.has(key))timeline.set(key,[]);timeline.get(key).push({when,faccao:d.faccao||'',lider:d.lider||'',segmento:d.segmento||'',qg:d.qg||''});});
  timeline.forEach(arr=>arr.sort((a,b)=>a.when-b.when));
  return {groups,knownGroups,timeline};
}
function identityFor(group,data,ctx,existing={}){
  if(existing.faccaoSnapshot||existing.qgSnapshot||existing.segmentoSnapshot||existing.liderSnapshot){
    return {faccao:existing.faccaoSnapshot||'',qg:existing.qgSnapshot||'',segmento:existing.segmentoSnapshot||'',lider:existing.liderSnapshot||''};
  }
  const date=metricDate(data), arr=ctx.timeline.get(norm(group))||[]; let occ=null;
  if(date)for(const x of arr){if(x.when<=date)occ=x;else break;}
  const g=ctx.groups.get(norm(group))||{};
  return {faccao:occ?.faccao||g.faccao||'',qg:occ?.qg||g.qg||'',segmento:occ?.segmento||g.segmento||'',lider:occ?.lider||g.lider||''};
}
function sameSlots(a={},b={}){return ['14H','16H','21H','23H'].every(h=>Number(a?.[h]||0)===Number(b?.[h]||0));}
function metricDocId(row){return `${row.group}_${row.data}`.replace(/[^a-zA-Z0-9_-]/g,'_');}
function currentMonthKey(){const d=new Date(new Date().toLocaleString('en-US',{timeZone:TIME_ZONE}));return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;}
function rowMonthKey(row){const d=metricDate(row.data);return d?`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`:'';}

async function performSync({force=false,actor='SYSTEM_METRIC_SYNC'}={}){
  const configRef=db.doc(CONFIG_PATH), configSnap=await configRef.get();
  if(!configSnap.exists)throw new Error('Fonte de métricas não configurada no High OS.');
  const cfg=configSnap.data()||{};
  if(cfg.autoSync===false&&!force)return {skipped:true,reason:'AUTO_SYNC_DISABLED'};
  const spreadsheetId=extractSpreadsheetId(cfg.url||cfg.spreadsheetId||'');
  if(!spreadsheetId)throw new Error('Link/ID da planilha oficial inválido.');
  const started=admin.firestore.Timestamp.now();
  await configRef.set({serverSync:{status:'SINCRONIZANDO',lastRunAt:started,schedule:SCHEDULE,timeZone:TIME_ZONE,serviceAccount:SERVICE_ACCOUNT,error:''}}, {merge:true});
  try{
    const ctx=await loadIdentityContext();
    const {rows,sheet}=await loadSheetRows(spreadsheetId,String(cfg.sheet||'').trim(),ctx.knownGroups);
    const metricSnap=await db.collection(METRIC_COLLECTION).get(); const existing=new Map(); metricSnap.forEach(d=>existing.set(d.id,d.data()));
    const writes=[];
    for(const row of rows){
      const id=metricDocId(row), old=existing.get(id)||{}, ident=identityFor(row.group,row.data,ctx,old);
      const next={...row,faccaoSnapshot:ident.faccao,qgSnapshot:ident.qg,segmentoSnapshot:ident.segmento,liderSnapshot:ident.lider,snapshotVersion:'V7.8',source:'GOOGLE_SHEETS_SERVER_READONLY',sourceSheet:sheet,updatedBy:actor};
      const unchanged=sameSlots(old.slots,next.slots)&&old.data===next.data&&old.group===next.group&&old.faccaoSnapshot===next.faccaoSnapshot&&old.qgSnapshot===next.qgSnapshot&&old.segmentoSnapshot===next.segmentoSnapshot&&old.liderSnapshot===next.liderSnapshot&&old.sourceSheet===sheet;
      if(!unchanged)writes.push({id,next});
    }
    for(let i=0;i<writes.length;i+=400){const batch=db.batch();for(const w of writes.slice(i,i+400)){batch.set(db.collection(METRIC_COLLECTION).doc(w.id),{...w.next,updatedAt:admin.firestore.FieldValue.serverTimestamp()},{merge:true});}await batch.commit();}
    const now=admin.firestore.FieldValue.serverTimestamp(),activeRows=rows.filter(r=>rowMonthKey(r)===currentMonthKey()).length;
    await configRef.set({mode:'GOOGLE_SHEETS_SERVER_READONLY',serverSync:{status:'ONLINE',lastRunAt:started,lastSuccessAt:now,rows:rows.length,changed:writes.length,activeRows,sheet,schedule:SCHEDULE,timeZone:TIME_ZONE,serviceAccount:SERVICE_ACCOUNT,error:''}}, {merge:true});
    await db.collection(HISTORY_COLLECTION).add({tipo:'SINCRONIZACAO_METRICAS_AUTOMATICA',descricao:`${rows.length} registro(s) lidos da planilha oficial • ${writes.length} alterado(s) • aba ${sheet}`,usuario:actor,origem:'FIREBASE_SCHEDULER',data:admin.firestore.FieldValue.serverTimestamp()});
    return {rows:rows.length,changed:writes.length,activeRows,sheet};
  }catch(err){
    await configRef.set({serverSync:{status:'ERRO',lastRunAt:started,error:String(err.message||err).slice(0,800),schedule:SCHEDULE,timeZone:TIME_ZONE,serviceAccount:SERVICE_ACCOUNT}}, {merge:true});
    throw err;
  }
}

exports.syncMetricsScheduled = onSchedule({schedule:SCHEDULE,timeZone:TIME_ZONE}, async()=>{
  const result=await performSync({force:false,actor:'SYSTEM_METRIC_SYNC'});
  console.log('Metric sync scheduled:',result);
});

exports.syncMetricsNow = onCall(async(request)=>{
  if(!request.auth)throw new HttpsError('unauthenticated','Entre no High OS.');
  const email=String(request.auth.token.email||'').toLowerCase();
  const userSnap=await db.doc(`users/${email}`).get();
  const profile=userSnap.exists?userSnap.data():{};
  if(profile.active!==true||String(profile.role||'').toUpperCase()!=='ADMIN')throw new HttpsError('permission-denied','Somente ADMIN pode forçar a sincronização.');
  try{return await performSync({force:true,actor:email});}catch(err){throw new HttpsError('internal',String(err.message||err));}
});
