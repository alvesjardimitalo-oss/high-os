import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const src=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
const start=src.indexOf('function manualRequestMutation(');
const end=src.indexOf('async function copyRequestText()',start);
assert.ok(start>=0 && end>start);
const section=src.slice(start,end);
const manualRequestMutation=Function(
 'mergedTechProfile','clonePlain','opBlank','getDetailValue','samePlain',
 'return ('+section.trim()+');'
)(
 f=>structuredClone(f.perfilTecnico||{operacional:{garagens:[],helipontos:[]}}),
 x=>structuredClone(x),
 ()=>({garagens:[],helipontos:[]}),
 (label,detail)=>{
  const v=String(detail).split('\n').find(line=>line.toLowerCase().startsWith(label.toLowerCase()+':'));
  return v?v.slice(label.length+1).trim():'';
 },
 (a,b)=>JSON.stringify(a)===JSON.stringify(b)
);

const group=()=>({group:'Armas01',beneficios:{garagemVip:true},perfilTecnico:{operacional:{
 garagens:[
  {tipo:'PUBLICA',blip:'1,2,3,4',spawn:'5,6,7,8'},
  {tipo:'FACCAO',blip:'21,22,23,24',spawn:'25,26,27,28',veiculos:'vipcar'}
 ],
 helipontos:[{blip:'30,31,32,33',spawn:'34,35,36,37'}]
}}});

test('Adicionar garagem não apaga outra garagem pública',()=>{
 const g=group();
 const m=manualRequestMutation('GARAGEM','Blip: 10,11,12,13\nSpawn: 14,15,16,17',g);
 assert.equal(m.changed,true);
 assert.equal(m.perfilTecnico.operacional.garagens.filter(x=>x.tipo==='PUBLICA').length,2);
 assert.equal(g.perfilTecnico.operacional.garagens.length,2,'estado original não é alterado');
});
test('Atualizar spawn mantém veículos setados na garagem VIP',()=>{
 const m=manualRequestMutation('GARAGEM_VIP','Blip: 21,22,23,24\nSpawn: 26,27,28,29',group());
 const vip=m.perfilTecnico.operacional.garagens.filter(x=>x.tipo==='FACCAO');
 assert.equal(vip.length,1);
 assert.equal(vip[0].veiculos,'vipcar');
 assert.equal(vip[0].spawn,'26,27,28,29');
});
test('Modelo com CDS fictícia não altera o Group',()=>{
 for(const text of ['Blip: {x,y,z,h}\nSpawn: {x,y,z,h}',
   'Blip: \nSpawn: ','Blip: {coord}\nSpawn: {spawn}']){
  const m=manualRequestMutation('GARAGEM',text,group());
  assert.equal(m.changed,false);
  assert.equal(m.perfilTecnico.operacional.garagens.length,2);
 }
});
test('Heliponto novo não substitui o antigo',()=>{
 const m=manualRequestMutation('HELIPONTO','Blip: 40,41,42,43\nSpawn: 44,45,46,47',group());
 assert.equal(m.changed,true);
 assert.equal(m.perfilTecnico.operacional.helipontos.length,2);
});
test('Blindado incompleto não apaga garagem existente',()=>{
 const g=group();g.perfilTecnico.operacional.blindados={blip:'40,41,42,43',spawn:'44,45,46,47',vagas:'8'};
 const m=manualRequestMutation('GARAGEM_BLINDADOS','Blip: {x,y,z,h}\nSpawn da garagem: ',g);
 assert.equal(m.changed,false);
 assert.equal(m.perfilTecnico.operacional.blindados.vagas,'8');
});
test('Rota salva benefícios corretos e Group junto com histórico',()=>{
 const a=src.indexOf('async function applyRouteRequestToProfile()');
 const b=src.indexOf('let requestModelSaveInFlight=',a);
 const text=src.slice(a,b);
 assert.match(text,/beneficios:benefits/);
 assert.match(text,/await routeBatch\.commit\(\)/);
 assert.match(text,/routeBatch\.set\(doc\(histCol\)/);
 assert.doesNotMatch(text,/await setDoc\(doc\(db,'highos','data','faccoes',group\)/);
});
test('Aplicar solicitação de garagem também atualiza a planilha',()=>{
 const a=src.indexOf('async function copyRequestText()');
 const b=src.indexOf('function slug(',a);
 const text=src.slice(a,b);
 assert.match(text,/syncBlipsGroups\(\[currentGroup\]/);
 assert.match(text,/blipsChangedFieldsByGroup\(\[previousGroup\],\[currentGroup\]\)/);
});
