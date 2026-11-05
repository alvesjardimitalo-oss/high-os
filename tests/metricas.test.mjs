import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

async function browserModule(name){
 let src=readFileSync(new URL('../assets/modules/'+name,import.meta.url),'utf8');
 if(name==='metricas-motor.js'){
  const dep=readFileSync(new URL('../assets/modules/ocupacao.js',import.meta.url),'utf8');
  src=src.replace("from './ocupacao.js'","from 'data:text/javascript,"+encodeURIComponent(dep).replaceAll("'","%27")+"'");
 }
 return import('data:text/javascript,'+encodeURIComponent(src));
}
const parser=await browserModule('metricas-parser.js');
const motor=await browserModule('metricas-motor.js');

test('Datas inválidas não entram nas métricas',()=>{
 assert.equal(parser.normalizeMetricDate('31/02/2026'),'');
 assert.equal(parser.normalizeMetricDate('2026-02-30'),'');
 assert.equal(parser.normalizeMetricDate('2024-02-29'),'29/02/2024');
 assert.equal(parser.normalizeMetricDate('29/02/2025'),'');
 assert.equal(parser.normalizeMetricSlotKey('23H'),'23H');
 assert.equal(parser.normalizeMetricSlotKey('25H'),'');
});

test('Parser também encontra blocos mensais depois da linha 600',()=>{
 parser.definirGroupsConhecidos([{group:'Armas01'}]);
 const values=Array.from({length:650},()=>[]);
 for(let day=1;day<=7;day++){
  const idx=(day-1)*4;
  values[610][idx]=String(day).padStart(2,'0')+'/10/2026';
  values[611][idx]='14H';
  values[611][idx+1]='16H';
  values[611][idx+2]='21H';
  values[611][idx+3]='23H';
  values[612][idx]=1;
  values[612][idx+1]=3;
 }
 values[612][1]='Armas01';
 const rows=parser.parseMetricSheet(values);
 assert.ok(rows.length>0);
 assert.ok(rows.some(r=>r.group==='Armas01' && r.data==='01/10/2026'));
});

test('Linha do tempo preserva ocupantes de períodos distintos',()=>{
 const tl=motor.montarLinhaDoTempo({
  faccoes:[{group:'Armas01',faccao:'Nova',status:'ATIVA',dataEntrega:'2026-10-15'}],
  entregas:[
   {group:'Armas01',faccao:'Antiga',dataEntrega:'2026-10-01',status:'RECOLHIDA',recolhimento:{createdAtText:'2026-10-14T20:00:00'}},
   {group:'Armas01',faccao:'Nova',dataEntrega:'2026-10-15',status:'ATIVA'}
  ]
 });
 assert.equal(tl.ocupanteEm('Armas01',new Date('2026-10-12T14:00:00').getTime()),'Antiga');
 assert.equal(tl.ocupanteEm('Armas01',new Date('2026-10-16T14:00:00').getTime()),'Nova');
});
