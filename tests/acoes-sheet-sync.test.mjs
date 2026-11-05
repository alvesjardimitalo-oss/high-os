import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../assets/modules/acoes-sheet-sync.js',import.meta.url),'utf8');
const {planApprovedActionSheetUpdate}=await import('data:text/javascript,'+encodeURIComponent(src));
function template(two=false){
 const data=Array.from({length:65},()=>Array.from({length:20},()=>null));
 function add(start,col,name,prize,buff){
  data[start][col]='AÇÕES';data[start][col+1]=name;
  data[start+8][col]='PRÊMIO MINIMO (SUJO)';data[start+8][col+1]=prize;
  data[start+9][col]='PRÊMIO MAXIMO (SUJO)';data[start+9][col+1]=prize*1.15;
  data[start+11][col]='BUFF';data[start+11][col+1]=buff;
  data[start+12][col]='NERF';data[start+12][col+1]=0;
 }
 add(15,5,'LOJA DE DEPARTAMENTO',438571.428571,55000);
 if(two)add(34,5,'LOJA DE DEPARTAMENTO',438571.428571,55000);
 return data;
}
test('Altera apenas BUFF/NERF previstos, preservando fórmulas do prêmio',()=>{
 const p=planApprovedActionSheetUpdate(template(),'LOJA DE DEPARTAMENTO',438571,497858);
 assert.equal(p.buff.rowIndex,26);assert.equal(p.buff.columnIndex,6);
 assert.equal(p.nerf.rowIndex,27);
 assert.equal(p.oldBuff,55000);assert.equal(p.nextBuff,114287);
 assert.equal(p.nextNerf,0);assert.equal(p.delta,59287);
 assert.ok(p.previousMax>p.previousMin);
 assert.equal(p.proposedMax,Math.ceil(p.proposedMin*(p.previousMax/p.previousMin)));
 assert.equal(p.max.rowIndex,24);
});
test('Nerf reduz primeiro buff acumulado em vez de duplicar o nerf',()=>{
 const p=planApprovedActionSheetUpdate(template(),'LOJA DE DEPARTAMENTO',438571,400000);
 assert.equal(p.nextBuff,16429);
 assert.equal(p.nextNerf,0);
 const deep=planApprovedActionSheetUpdate(template(),'LOJA DE DEPARTAMENTO',438571,300000);
 assert.equal(deep.nextBuff,0);
 assert.equal(deep.nextNerf,83571);
});
test('Divergência com Mercado Negro bloqueia escrita',()=>{
 assert.throws(()=>planApprovedActionSheetUpdate(template(),'LOJA DE DEPARTAMENTO',350000,497858),/diverge/);
});
test('Cadastro duplicado da mesma ação bloqueia escrita',()=>{
 assert.throws(()=>planApprovedActionSheetUpdate(template(true),'LOJA DE DEPARTAMENTO',438571,497858),/mais de uma vez/);
});
test('Ação não encontrada e novo prêmio inválido não alteram células',()=>{
 assert.throws(()=>planApprovedActionSheetUpdate(template(),'FAKE',438571,497858),/não encontrada/);
 assert.throws(()=>planApprovedActionSheetUpdate(template(),'LOJA DE DEPARTAMENTO',438571,-1),/inválida/);
});
test('Somente a aba original recebe aprovação; novo módulo não cria abas',()=>{
 const app=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
 assert.match(app,/syncApprovedActionPayout/);
 assert.match(app,/VALORES AÇÃO BLIPADA/);
 assert.match(app,/updateCells/);
 assert.match(app,/canEditModule\('economia'\)/);
 const h=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(h,/id="apApprove"/);
});

test('Valida valor máximo atual e previsto, bloqueia divergências antes de escrever',()=>{
 const rows=template();
 const expectedMax=438571.428571*1.15;
 const result=planApprovedActionSheetUpdate(rows,'LOJA DE DEPARTAMENTO',438571,497858,
  {officialMax:expectedMax,proposedMax:572537});
 assert.equal(result.proposedMin,497858);
 assert.equal(result.proposedMax,572537);
 assert.equal(result.previousMax,expectedMax);
 assert.throws(()=>planApprovedActionSheetUpdate(rows,'LOJA DE DEPARTAMENTO',438571,497858,
  {officialMax:400000,proposedMax:572537}),/máximo.*diverge/);
 assert.throws(()=>planApprovedActionSheetUpdate(rows,'LOJA DE DEPARTAMENTO',438571,497858,
  {officialMax:expectedMax,proposedMax:497857}),/máximo recomendado inválido/);
});
test('Aprovação lê ambos os prêmios e preserva as fórmulas do máximo',()=>{
 const app=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
 assert.match(app,/planApprovedActionSheetUpdate\(first\.values\|\|\[\],name,officialMin,value,/);
 assert.match(app,/officialMax,proposedMax/);
 assert.match(app,/checked\.previousMax/);
 assert.match(app,/calculatedMaximum/);
 assert.match(app,/verifiedMaximum/);
 assert.match(app,/premioMaxConfirmado/);
 assert.doesNotMatch(app,/updateCells:\{start:\{sheetId:checked\.sheetId,rowIndex:checked\.max\.rowIndex/);
});
