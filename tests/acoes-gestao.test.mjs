import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../assets/modules/'+name,import.meta.url),'utf8');
const coreUrl='data:text/javascript,'+encodeURIComponent(read('acoes-core.js'));
const intelligenceUrl='data:text/javascript,'+encodeURIComponent(
 read('acoes-inteligencia.js').replace("from './acoes-core.js?v=5'",'from '+JSON.stringify(coreUrl)));
const managementSource=read('acoes-gestao.js')
 .replace("from './acoes-core.js?v=5'",'from '+JSON.stringify(coreUrl))
 .replace("from './acoes-inteligencia.js?v=6'",'from '+JSON.stringify(intelligenceUrl));
const {buildManagementBoard,filterManagementEntries}=
 await import('data:text/javascript,'+encodeURIComponent(managementSource));
const {makePriceReference}=await import(intelligenceUrl);
const cat={itens:[
 {item:'C4',pista:9000,parceria:7000,status:'ativo'},
 {item:'COLETE',pista:13000,parceria:10000,status:'ativo'},
 {item:'PISTOLA T54',pista:38000,parceria:30000,status:'ativo'}
]};
const a={nome:'ATM',tipo_acao:'atm',status:'ativo',premio_min:18000,premio_max:25000,
 cooldown_segundos:1800,regras_confronto:[{invasores:1,policiais:0}],
 itens:[{nome:'C4',quantidade:1,categoria_item:'consumivel'}]};
test('gestão preserva prêmio de ATM e mostra cooldown',()=>{
 const b=buildManagementBoard([a],cat);
 assert.equal(b.stats.active,1);
 assert.equal(b.entries[0].status,'MANTER');
 assert.equal(b.entries[0].cooldownMinutes,30);
 assert.equal(b.entries[0].netMin,3600);
 assert.equal(b.entries[0].expected,null);
});
test('chance de vitória não gera alertas e nunca define ranking de revisão',()=>{
 const low=buildManagementBoard([a],cat,{winChance:.01});
 const high=buildManagementBoard([a],cat,{winChance:.99});
 assert.equal(low.entries[0].status,high.entries[0].status);
 assert.equal(low.entries[0].priority,high.entries[0].priority);
 assert.equal(low.entries[0].expected,null);
 assert.equal(high.entries[0].expected,null);
});
test('aumento do explosivo identifica impacto de custo consumido',()=>{
 const ref=makePriceReference(cat);
 const newer={itens:cat.itens.map(i=>i.item==='C4'?{...i,pista:11000}:i)};
 const b=buildManagementBoard([a],newer,{reference:ref});
 assert.equal(b.stats.impactoPrecos,1);
 assert.equal(b.entries[0].change.difference,2000);
 assert.equal(b.entries[0].change.deltaPerMember,-2000);
 assert.equal(b.entries[0].status,'IMPACTADA POR PREÇOS');
});
test('queda de preço não aciona nerf automático',()=>{
 const ref=makePriceReference(cat);
 const cheaper={itens:cat.itens.map(i=>i.item==='C4'?{...i,pista:7000}:i)};
 const b=buildManagementBoard([a],cheaper,{reference:ref});
 assert.equal(b.entries[0].change.difference,-2000);
 assert.equal(b.entries[0].status,'MONITORAR ECONOMIA');
 assert.equal(a.premio_min,18000);
});
test('registradora sem itens tem custo zero válido',()=>{
 const reg={...a,nome:'REGISTRADORA',tipo_acao:'registradora',itens:[]};
 const b=buildManagementBoard([reg],cat);
 assert.equal(b.entries[0].valid,true);
 assert.equal(b.entries[0].capital,0);
 assert.equal(b.entries[0].status,'MANTER');
});
test('filtragem ainda oferece ações afetadas e pendentes',()=>{
 const other={...a,nome:'SEM PREÇO',itens:[{nome:'DESCONHECIDO',quantidade:1}]};
 const report=buildManagementBoard([a,other],cat);
 assert.equal(filterManagementEntries(report.entries,{filter:'PENDENTES'}).length,1);
 assert.equal(filterManagementEntries(report.entries,{query:'atm'}).length,1);
});
test('HTML mantém subpáginas e identidade do High OS',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const css=readFileSync(new URL('../assets/acoes-planejador.css',import.meta.url),'utf8');
 for(const tab of ['overview','catalog','ranking','prices'])
  assert.match(html,new RegExp('data-ap-nav="'+tab+'"'));
 assert.match(css,/#page-planejador-acoes \.ap-root\{/);
 assert.match(html,/assets\/app\.js\?v=\d+(\.\d+)*/);
});

