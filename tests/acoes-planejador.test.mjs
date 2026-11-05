import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const coreText=readFileSync(new URL('../assets/modules/acoes-core.js',import.meta.url),'utf8');
const {calculateAction,kitFor,priceOf,defaultTeam,availableTeams,photoUrl,categoryOf}=
 await import('data:text/javascript,'+encodeURIComponent(coreText));
const products={itens:[
 {item:'PISTOLA T54',pista:38000,parceria:30000,status:'ativo'},
 {item:'PISTOLA 100X',pista:13500,parceria:10000,status:'ativo'},
 {item:'COLETE',pista:13000,parceria:10000,status:'ativo'},
 {item:'PENDRIVE 2',pista:10500,parceria:7500,status:'ativo'},
 {item:'UZI',pista:47000,parceria:42000,status:'ativo'},
 {item:'SMG 200X',pista:18000,parceria:15000,status:'ativo'}
]};
const store={nome:'LOJA DE DEPARTAMENTO',status:'ativo',custo:268500,premio_min:438571,premio_max:504357,buff:55000,
 itens:[{nome:'ARMA PISTOLA',quantidade:4},{nome:'MUNIÇÃO PISTOLA (x100)',quantidade:4},
 {nome:'COLETE',quantidade:4},{nome:'PENDRIVE 2',quantidade:1}],
 regras_confronto:[{invasores:3,policiais:4,refens:1},{invasores:4,policiais:5,refens:1}]};
test('categoriza armas e munição separadamente de colete e pendrive',()=>{
 assert.deepEqual(store.itens.map(i=>categoryOf(i.nome)),['arma','municao','colete','acesso']);
});
test('Capital inicial é integral, mas vitória conserva armas e munição não gasta',()=>{
 const k=kitFor(store,products,{team:4,kitMode:'oficial'});
 assert.equal(k.total,268500);
 assert.equal(k.winCost,76000);
 assert.equal(k.lossCost,268500);
 assert.equal(k.retained,192500);
 assert.equal(k.weapons,152000);
 assert.equal(k.ammoReplacement,13500);
 assert.equal(k.armors,52000);
 assert.equal(k.access,10500);
 assert.deepEqual(k.lines.map(i=>i.total),[152000,54000,52000,10500]);
 assert.deepEqual(k.lines.map(i=>i.winCost),[0,13500,52000,10500]);
 assert.deepEqual(k.lines.map(i=>i.replacementQty),[0,1,4,1]);
 assert.equal(k.comparison,0);
});
test('Vitória paga reposição; derrota não recebe prêmio e perde tudo',()=>{
 const p=calculateAction(store,products,{team:4,targetPerPlayer:20000,roi:.25});
 assert.ok(Math.abs(p.netMin-230999.7)<.01);
 assert.ok(Math.abs(p.netMax-277049.9)<.01);
 assert.ok(Math.abs(p.firstRunNetMin-38499.7)<.01);
 assert.equal(p.loss,-268500);
 assert.equal(p.kit.retained,192500);
 assert.equal(p.buffIncluded,55000);
 assert.equal(p.rule.policiais,5);
 assert.equal(p.status,'MANTER'); // Metas isoladas não justificam nerf sem variação de custos.
 assert.equal(p.payoutNeeded,222858);
});
test('Com três invasores, três kits e só um pendrive',()=>{
 const k=kitFor(store,products,{team:3,kitMode:'por-jogador'});
 assert.deepEqual(k.lines.map(x=>x.qty),[3,3,3,1]);
 assert.equal(k.total,204000);
 assert.equal(k.winCost,63000);
 assert.equal(k.ammoReplacement,13500);
 assert.equal(k.armors,39000);
 const p=calculateAction(store,products,{team:3});
 assert.equal(p.loss,-204000);
 assert.equal(p.rule.policiais,4);
 assert.equal(p.payoutNeeded,175715);
});
test('Kit cadastrado mantém quantidade original, mesmo com equipe menor',()=>{
 const k=kitFor(store,products,{team:3,kitMode:'oficial'});
 assert.deepEqual(k.lines.map(x=>x.qty),[4,4,4,1]);
 assert.equal(k.total,268500);
});
test('Consumo de munição é em pacotes inteiros, sem falsa precisão',()=>{
 const low=kitFor(store,products,{team:4,ammoUse:0});
 const half=kitFor(store,products,{team:4,ammoUse:.5});
 const all=kitFor(store,products,{team:4,ammoUse:1});
 assert.equal(low.ammoReplacement,0);
 assert.equal(half.ammoReplacement,27000);
 assert.equal(all.ammoReplacement,54000);
 assert.equal(half.winCost,89500);
 assert.equal(all.winCost,116500);
 assert.equal(kitFor(store,products,{team:3,ammoUse:.25}).lines[1].replacementQty,1);
});
test('Pendrive pode ser configurado como reutilizável sem afetar o prejuízo na derrota',()=>{
 const normal=calculateAction(store,products,{team:4,accessConsumed:true});
 const reusable=calculateAction(store,products,{team:4,accessConsumed:false});
 assert.equal(normal.kit.access,10500);
 assert.equal(reusable.kit.access,0);
 assert.equal(reusable.kit.winCost,65500);
 assert.equal(reusable.kit.total,268500);
 assert.equal(reusable.loss,-268500);
 assert.equal(reusable.kit.lines[3].retainedValue,10500);
 assert.equal(reusable.netMin-normal.netMin,10500);
});
test('Colete e pendrive são repostos a cada vitória, não apenas na derrota',()=>{
 const p=kitFor(store,products,{team:4,ammoUse:0});
 assert.equal(p.armors,52000);
 assert.equal(p.access,10500);
 assert.equal(p.lines[2].retainedValue,0);
 assert.equal(p.lines[3].retainedValue,0);
});
test('Alta e queda nos insumos alteram capital, lucro e prejuízo',()=>{
 const baseline=calculateAction(store,products,{team:4});
 const rise=calculateAction(store,products,{team:4,priceShift:.1});
 const fall=calculateAction(store,products,{team:4,priceShift:-.1});
 assert.equal(rise.kit.total,295350);
 assert.equal(rise.kit.winCost,83600);
 assert.equal(rise.loss,-295350);
 assert.equal(fall.kit.total,241650);
 assert.equal(fall.kit.winCost,68400);
 assert.ok(rise.netMin<baseline.netMin);
 assert.ok(fall.netMin>baseline.netMin);
 assert.equal(rise.kit.lines[0].unit,41800);
});
test('Preço manual é base sobre a qual incide alteração percentual',()=>{
 const p=kitFor(store,products,{team:4,prices:{0:40000},priceShift:.1});
 assert.equal(p.lines[0].baseUnit,40000);
 assert.equal(p.lines[0].unit,44000);
 assert.equal(p.weapons,176000);
});
test('Preço de parceria altera investimento e reposição sem utilizar preço de pista',()=>{
 const q=priceOf('MUNIÇÃO PISTOLA (x100)',products,'parceria');
 assert.equal(q.unit,10000);
 const k=kitFor(store,products,{team:4,priceMode:'parceria'});
 assert.equal(k.total,207500);
 assert.equal(k.winCost,57500);
 assert.equal(k.baselineMismatch,false);
});
test('Variações simuladas não são classificadas como divergência do custo oficial',()=>{
 const k=kitFor(store,products,{team:4,kitMode:'oficial',priceShift:.1});
 assert.equal(k.baselineMismatch,false);
 assert.notEqual(k.comparison,0);
});
test('Metas simuladas usam reposição e ROI, mas preservam prêmio oficial',()=>{
 const p=calculateAction(store,products,{team:4,roi:.25,targetPerPlayer:20000});
 assert.equal(p.targetProfit,80000);
 assert.equal(p.payoutNeeded,222858);
 const higher=calculateAction(store,products,{team:4,targetPerPlayer:70000,roi:0});
 assert.equal(higher.status,'MANTER');
 assert.ok(higher.payoutNeeded>p.payoutNeeded);
});
test('Preço ausente bloqueia sugestão e jamais vira zero',()=>{
 const unknown={...store,itens:[...store.itens,{nome:'PENDRIVE CLANDESTINO 3',quantidade:1}]};
 const p=calculateAction(unknown,products,{team:4});
 assert.equal(p.kit.total,null);
 assert.equal(p.kit.winCost,null);
 assert.equal(p.loss,null);
 assert.equal(p.status,'INSUMO SEM PREÇO');
 assert.equal(p.payoutAdjustable,false);
});
test('Item inativo do catálogo não é usado para justificar buff ou nerf',()=>{
 const inactive={itens:products.itens.map(x=>x.item==='COLETE'?{...x,status:'inativo'}:x)};
 assert.equal(priceOf('COLETE',inactive,'pista').listedInactive,true);
 const p=calculateAction(store,inactive,{team:4});
 assert.equal(p.kit.total,null);
 assert.ok(p.kit.missing.includes('COLETE'));
 assert.equal(p.payoutAdjustable,false);
});
test('Regra de equipe valida invasores e policiais, sem inventar tamanhos',()=>{
 assert.deepEqual(availableTeams(store),[3,4]);
 assert.equal(defaultTeam(store),4);
 assert.equal(calculateAction(store,products,{team:10}).status,'EQUIPE INVÁLIDA');
});
test('Fotos aceitam apenas nomes locais seguros',()=>{
 assert.match(photoUrl('loja_departamento.webp'),/loja_departamento\.webp$/);
 assert.equal(photoUrl('../private.png'),'');
});
test('Nova página mantém permissões, listagem, controles e dois resultados explícitos',()=>{
 const app=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../assets/modules/acoes-planejador-ui.js',import.meta.url),'utf8');
 assert.match(app,/'planejador-acoes':'economia'/);
 assert.match(app,/if\(page==='planejador-acoes'\)import\('\.\/modules\/acoes-planejador-ui\.js/);
 for(const id of ['apActionList','apQuickMetrics','apOutcome','apScenarios','apPriceShift','apAmmoUse','apAccessMode','apWinCostTotal','apApprove']){
  assert.ok(html.includes('id="'+id+'"'),id);
 }
 assert.doesNotMatch(html,/id="apReuse"/);
 assert.match(ui,/kitMode:'oficial'/);
 assert.match(ui,/Armas mantidas|Kit conservado/);
 assert.match(ui,/d\.eligibleForSheet/);
 assert.match(ui,/prejuízo|Prejuízo/i);
});
test('A aprovação revalida a planilha e protege fórmulas/aba original',()=>{
 const app=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
 const fn=app.slice(app.indexOf('async function syncApprovedActionPayout('),app.indexOf('function activateAppPage(',app.indexOf('async function syncApprovedActionPayout(')));
 assert.match(fn,/sheets\.properties\(sheetId,title\)/);
 assert.match(fn,/Number\(sheetEntry\.properties\.sheetId\)!==candidate\.sheetId/);
 assert.match(fn,/latestFormulas=await facSheetFetch/);
 assert.match(fn,/BUFF\/NERF recebeu uma fórmula durante a confirmação/);
 assert.ok(fn.indexOf('latestFormulas=await')<fn.indexOf("root+':batchUpdate'"));
});

