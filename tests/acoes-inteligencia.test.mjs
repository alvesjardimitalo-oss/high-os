import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=name=>readFileSync(new URL('../assets/modules/'+name,import.meta.url),'utf8');
const coreSource=read('acoes-core.js');
const coreUrl='data:text/javascript,'+encodeURIComponent(coreSource);
const core=await import(coreUrl);
const intelligenceSource=read('acoes-inteligencia.js')
 .replace("from './acoes-core.js?v=5'",'from '+JSON.stringify(coreUrl));
const intel=await import('data:text/javascript,'+encodeURIComponent(intelligenceSource));
const {makePriceReference,assessPriceChanges,analyzeDecision}=intel;
const catalog={itens:[
 {item:'C4',pista:9000,parceria:7000,status:'ativo'},
 {item:'C4 ++',pista:16000,parceria:12000,status:'ativo'},
 {item:'PISTOLA T54',pista:38000,parceria:30000,status:'ativo'},
 {item:'COLETE',pista:13000,parceria:10000,status:'ativo'}
]};
const atm={nome:'ROUBO DE ATM',tipo_acao:'atm',status:'ativo',
 premio_min:18000,premio_max:25000,cooldown_segundos:1800,
 regras_confronto:[{invasores:1,policiais:0,refens:0}],
 itens:[{nome:'C4',quantidade:1,categoria_item:'consumivel'}]};

test('preserva prêmios sem variação documentada de preços',()=>{
 const a=analyzeDecision(atm,catalog,{team:1});
 assert.equal(a.valid,true);
 assert.equal(a.direction,'MANTER');
 assert.equal(a.recommendedMin,18000);
 assert.equal(a.recommendedMax,25000);
 assert.equal(a.deltaReplacement,null);
});
test('chance de vitória e metas arbitrárias não mudam o pagamento',()=>{
 const a=analyzeDecision(atm,catalog,{team:1,winChance:.01,targetPerPlayer:1000000,roi:200});
 const b=analyzeDecision(atm,catalog,{team:1,winChance:.99,targetPerPlayer:0,roi:0});
 assert.equal(a.recommendedMin,b.recommendedMin);
 assert.equal(a.recommendedMax,b.recommendedMax);
 assert.equal(a.direction,'MANTER');
 assert.equal(a.winChance,null);
});
test('alta real de insumo consumido gera compensação exata após lavagem',()=>{
 const reference=makePriceReference(catalog,'2026-10-10T00:00:00Z');
 const newer={itens:catalog.itens.map(i=>i.item==='C4'?{...i,pista:11000}:i)};
 const d=analyzeDecision(atm,newer,{reference});
 assert.equal(d.deltaCapital,2000);
 assert.equal(d.deltaReplacement,2000);
 assert.equal(d.recommendedMin,20858);
 assert.equal(d.direction,'CONSIDERAR BUFF');
 assert.ok(d.recommendedMax>d.recommendedMin);
});
test('queda de insumo informa revisão de redução mas não altera valores oficiais',()=>{
 const reference=makePriceReference(catalog);
 const lowered={itens:catalog.itens.map(i=>i.item==='C4'?{...i,pista:7000}:i)};
 const d=analyzeDecision(atm,lowered,{reference});
 assert.equal(d.direction,'CONSIDERAR REDUÇÃO');
 assert.equal(d.recommendedMin,15143);
 assert.equal(atm.premio_min,18000);
});
test('alta isolada de arma reutilizável aumenta capital mas não gera buff',()=>{
 const armed={...atm,premio_min:150000,premio_max:170000,
 itens:[{nome:'PISTOLA T54',quantidade:1,categoria_item:'arma'}]};
 const reference=makePriceReference(catalog);
 const newer={itens:catalog.itens.map(i=>i.item==='PISTOLA T54'?{...i,pista:45000}:i)};
 const d=analyzeDecision(armed,newer,{reference});
 assert.equal(d.deltaCapital,7000);
 assert.equal(d.deltaReplacement,0);
 assert.equal(d.direction,'MANTER');
 assert.equal(d.recommendedMin,150000);
});
test('simulação de preço não pode publicar alteração da premiação',()=>{
 const d=analyzeDecision(atm,catalog,{priceShift:.25});
 assert.equal(d.isSimulation,true);
 assert.equal(d.eligibleForSheet,false);
 assert.equal(d.deltaReplacement,2250);
});
test('C4 e C4 ++ mostram diferença de custo e lucro na mesma ação',()=>{
 const c4=core.calculateAction(atm,catalog,{kitMode:'oficial'});
 const plus=core.calculateAction({...atm,itens:[{nome:'C4 ++',quantidade:1,categoria_item:'consumivel'}]},catalog,{kitMode:'oficial'});
 assert.equal(c4.kit.total,9000);
 assert.equal(plus.kit.total,16000);
 assert.equal(c4.netMin,3600);
 assert.equal(plus.netMin,-3400);
 assert.equal(Math.ceil(c4.kit.total/.7),12858);
 assert.equal(Math.ceil(plus.kit.total/.7),22858);
});
test('catálogo inválido bloqueia qualquer sugestão',()=>{
 const d=analyzeDecision(atm,{itens:[]});
 assert.equal(d.valid,false);
 assert.equal(d.direction,'PENDENTE');
 assert.equal(d.recommendedMin,null);
});
test('alertas diferenciam investimento inicial de reposição',()=>{
 const ref=makePriceReference(catalog);
 const newer={itens:catalog.itens.map(i=>i.item==='C4'?{...i,pista:11000}:i)};
 const changes=assessPriceChanges([atm],newer,ref);
 assert.equal(changes.changed,1);
 assert.equal(changes.changes[0].difference,2000);
 assert.equal(changes.changes[0].deltaPerMember,-2000);
});
test('tela oferece mínimo e máximo editáveis para Suricato e comparação ATM',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const ui=read('acoes-planejador-ui.js');
 const app=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
 for(const id of ['apEntryType','apManual','apManualMax','apExplosiveComparison','apCopySuricato']){
  assert.ok(html.includes('id="'+id+'"'),id);
 }
 assert.match(ui,/copySuricato/);
 assert.match(ui,/renderExplosiveComparison/);
 assert.match(app,/acoes-planejador-ui\.js\?v=\d+/);
});

