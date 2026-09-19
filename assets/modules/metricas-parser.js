/* =====================================================================
   HIGH OS · MODULO DE LEITURA DE METRICAS
   ---------------------------------------------------------------------
   Primeiro corte da modularizacao do app.js. Aqui ficam apenas funcoes
   PURAS: leem os argumentos e devolvem um valor, sem escrever em
   nenhum estado global. Foi o criterio para escolher o que sairia
   primeiro - e o que torna o corte verificavel.

   A unica dependencia externa e a lista de Groups conhecidos, usada
   para reconhecer nomes na planilha. Em vez de importar o estado do
   app, o modulo recebe a lista por injecao (definirGroupsConhecidos),
   chamada quando as faccoes terminam de carregar.
   ===================================================================== */

import { alvesNorm } from './formatadores.js';

let groupsConhecidos = [];

/** Injeta a lista de Groups usada para reconhecer nomes na planilha. */
export function definirGroupsConhecidos(lista = []) {
  groupsConhecidos = Array.isArray(lista) ? lista : [];
}

export function normalizeMetricDate(v){
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

export function parseMetricNumber(v){if(v===null||v===undefined||String(v).trim()==='')return null;
const n=Number(String(v).replace(/\s/g,'').replace(',','.'));
return Number.isFinite(n)?n:null}

export function normalizeMetricSlotKey(v=''){
 const x=String(v??'').trim().toUpperCase().replace(/\s+/g,'');

 let m=x.match(/^(\d{1,2})(?::(\d{2}))?H?$/);
if(!m)return '';
let h=+m[1],
min=m[2]===undefined?0:+m[2];
if(h>23||min>59)return '';
return min===0?`${String(h).padStart(2,'0')}H`:`${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`;

}

export function metricSlotLabel(v){return normalizeMetricSlotKey(v)}

export function metricGroupLabel(v){
 const raw=String(v??'').trim();
if(!raw)return '';

 const n=alvesNorm(raw).replace(/\s+/g,'');

 const known=groupsConhecidos.find(f=>alvesNorm(f.group).replace(/\s+/g,'')===n);
if(known)return known.group;

 const compact=raw.replace(/\s+/g,'');

 if(/^(ARMAS|MUNI[CÇ][AÃ]O|MUNICAO|LAVAGEM|DROGAS|DESMANCHE|CONTRABANDO|ESTELIONATARIOS|ILEGALMEDIC|ILEGALMECHANIC)0*\d+$/i.test(compact))return compact.replace(/^MUNI[CÇ][AÃ]O/i,'Municao');

 if(/^(VANILLA|MANICOMIO)$/i.test(compact))return compact;

 return '';

}

export function parseMetricSheet(values=[]){
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

export function parseCsvRows(text=''){
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
