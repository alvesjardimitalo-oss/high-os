import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const code=readFileSync(new URL('../assets/modules/blips-sheet-sync.js',import.meta.url),'utf8');
const {syncBlipsCoordinates,valuesFor}=await import('data:text/javascript,'+encodeURIComponent(code));

function fakeSheet(){
 const rows=Array.from({length:10},()=>[]);
 rows[0][4]='ARMAS';
 rows[1][5]='GROUP';rows[1][6]='Armas01';
 rows[2][5]='GARAGEM PUBLICA';rows[2][6]='BLIP: 10,10,10\nSPAWN: 11,11,11';
 rows[3][5]='GARAGEM DELUXE';
 rows[4][5]='BLINDADOS';
 rows[5][5]='FARM';
 rows[6][5]='TRUE';
 return rows;
}
function group(){
 return {group:'Armas01',segmento:'Armas',perfilTecnico:{
  operacional:{
   garagens:[{tipo:'PUBLICA',blip:'20,20,20',spawn:'21,21,21'},
             {tipo:'DELUXE',blip:'30,30,30',spawn:'31,31,31'}],
   blindados:[{blip:'40,40,40',spawn:'41,41,41'}]
  },farm:{cds:'42,42,42'}
 }};
}
async function withSheet(rows,work){
 const previous=globalThis.fetch;
 const batches=[];
 globalThis.fetch=async (url,opt={})=>{
  if(url.includes(':batchUpdate')){
   batches.push(JSON.parse(opt.body));
   return {ok:true,json:async()=>({replies:[]})};
  }
  if(url.includes('/values/'))return {ok:true,json:async()=>({values:rows})};
  return {ok:true,json:async()=>({sheets:[{properties:{
   sheetId:2037219913,title:'BLIPS COORDENADAS',gridProperties:{rowCount:300}
  }}]})};
 };
 try{return await work(batches)}
 finally{globalThis.fetch=previous}
}
function writes(batches){
 return batches.flatMap(b=>b.requests).filter(x=>x.updateCells).map(x=>({
  row:x.updateCells.start.rowIndex,col:x.updateCells.start.columnIndex,
  value:x.updateCells.rows[0].values[0].userEnteredValue.stringValue
 }));
}
test('Garagens, blindados e farm são serializados sem perder os spawns',()=>{
 const v=valuesFor(group());
 assert.match(v.GARAGEMPUBLICA,/BLIP: 20,20,20\nSPAWN: 21,21,21/);
 assert.match(v.GARAGEMDELUXE,/BLIP: 30,30,30\nSPAWN: 31,31,31/);
 assert.match(v.BLINDADOS,/BLIP: 40,40,40\nSPAWN: 41,41,41/);
 assert.equal(v.FARM,'42,42,42');
 assert.equal(v.INICIARFARM,v.FARM);
 assert.equal(Object.hasOwn(v,'ROTAEXCLUSIVA'),false);
 assert.equal(Object.hasOwn(v,'VIPORG'),false);
 assert.equal(Object.hasOwn(v,'CAPACIDADEBAU'),false);
});
test('Entrega não substitui garagem instalada; novas CDS entram',async()=>{
 await withSheet(fakeSheet(),async batches=>{
  await syncBlipsCoordinates({token:'mock',groups:[group()]});
  const cells=writes(batches);
  assert.equal(cells.some(x=>x.row===2 && x.col===6),false);
  assert.equal(cells.find(x=>x.row===3 && x.col===6)?.value,'BLIP: 30,30,30\nSPAWN: 31,31,31');
  assert.equal(cells.find(x=>x.row===4 && x.col===6)?.value,'BLIP: 40,40,40\nSPAWN: 41,41,41');
 });
});
test('Alteração explícita substitui apenas o campo selecionado',async()=>{
 await withSheet(fakeSheet(),async batches=>{
  await syncBlipsCoordinates({token:'mock',groups:[group()],overwriteFieldsByGroup:{
   Armas01:['GARAGEMPUBLICA']
  }});
  const cells=writes(batches);
  assert.equal(cells.find(x=>x.row===2 && x.col===6)?.value,'BLIP: 20,20,20\nSPAWN: 21,21,21');
  assert.equal(cells.some(x=>x.row===2 && x.col===7),false);
 });
});
test('Remoção explícita permite limpar coordenada; sem ação explícita preserva',async()=>{
 await withSheet(fakeSheet(),async batches=>{
  const g=group();g.perfilTecnico.operacional.garagens=[];
  await syncBlipsCoordinates({token:'mock',groups:[g],overwriteFieldsByGroup:{
   Armas01:['GARAGEMPUBLICA']
  }});
  assert.equal(writes(batches).find(x=>x.row===2 && x.col===6)?.value,'');
 });
});
test('Group existente no setor errado é sinalizado, sem criar cópia',async()=>{
 const rows=fakeSheet();rows[0][4]='MUNIÇÃO';
 await withSheet(rows,async batches=>{
  const result=await syncBlipsCoordinates({token:'mock',groups:[group()]});
  assert.equal(result.created,0);
  assert.equal(result.categoryMismatches.length,1);
  assert.equal(result.categoryMismatches[0].group,'Armas01');
 });
});

test('Prefixo canônico do Group prevalece sobre segmento inconsistente (Mecânica)',async()=>{
 const rows=fakeSheet();
 rows[0][4]='DROGAS';
 rows[1][6]='IlegalMechanic02';
 await withSheet(rows,async batches=>{
  const g={group:'IlegalMechanic02',segmento:'Drogas',perfilTecnico:{operacional:{}}};
  const result=await syncBlipsCoordinates({token:'mock',groups:[g]});
  assert.equal(result.created,0);
  assert.deepEqual(result.categoryMismatches,[{group:'IlegalMechanic02',actual:'DROGAS',expected:'MECANICAILEGAL'}]);
  assert.equal(batches.length,0);
 });
});

test('Group de Munição não assume categoria Armas por segmento antigo',async()=>{
 const rows=fakeSheet();
 rows[1][6]='Municao10';
 await withSheet(rows,async batches=>{
  const g={group:'Municao10',segmento:'Armas',perfilTecnico:{operacional:{}}};
  const result=await syncBlipsCoordinates({token:'mock',groups:[g]});
  assert.equal(result.created,0);
  assert.deepEqual(result.categoryMismatches,[{group:'Municao10',actual:'ARMAS',expected:'MUNICAO'}]);
  assert.equal(batches.length,0);
 });
});

test('Alteração explícita bloqueia campo histórico dividido em várias células',async()=>{
 const rows=fakeSheet();
 rows[2][7]='Outra coordenada técnica';
 await withSheet(rows,async batches=>{
  await assert.rejects(
   syncBlipsCoordinates({token:'mock',groups:[group()],overwriteFieldsByGroup:{Armas01:['GARAGEMPUBLICA']}}),
   /possui 2 células preenchidas/
  );
  assert.equal(batches.length,0,'falha deve ocorrer antes de qualquer batchUpdate');
 });
});

test('Mecânica Ilegal e Hospital Ilegal permanecem separados de Apoio',async()=>{
 for(const [group,segment,expected] of [
  ['IlegalMechanic01','Mecânica Ilegal','MECANICAILEGAL'],
  ['IlegalMechanic02','Mecânica Ilegal','MECANICAILEGAL'],
  ['IlegalMedic01','Hospital Ilegal','HOSPITALILEGAL'],
  ['IlegalMedic2','Hospital Ilegal','HOSPITALILEGAL']
 ]){
  const rows=fakeSheet();rows[0][4]='APOIO';rows[1][6]=group;
  await withSheet(rows,async batches=>{
   const result=await syncBlipsCoordinates({token:'mock',groups:[{group,segmento:segment}]});
   assert.deepEqual(result.categoryMismatches,[{group,actual:'APOIO',expected}]);
   assert.equal(result.created,0);
   assert.equal(batches.length,0);
  });
 }
});
