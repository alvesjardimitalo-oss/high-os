import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const moduleFrom=async name=>import('data:text/javascript,'+encodeURIComponent(readFileSync(new URL('../assets/modules/'+name,import.meta.url),'utf8')));
const {BROKEN_ITEMS_SNAPSHOT:items,STOLEN_ITEMS_SNAPSHOT:stolen}=await moduleFrom('economia-npc-seed.js');
const {npcStats,houseLootScenario}=await moduleFrom('acoes-npc-core.js');
import {cleanNpcProducts} from '../assets/modules/acoes-cadastro.js';
test('imagens dos quebrados preservam 28 preços, 2778 compras e 1125628 DS',()=>{
 assert.equal(items.length,28);assert.deepEqual(cleanNpcProducts(items),items);
 const result=npcStats(items);assert.equal(result.observed,28);assert.equal(result.units,2778);assert.equal(result.grossDirty,1125628);
 assert.equal(items.find(x=>x.nome==='T54').precoSujo,952);
 assert.equal(items.find(x=>x.nome==='Explosivo C4').quantidadeNpc,721);
});
test('ranking por geração de dinheiro sujo destaca T54 sem misturar preço do kit',()=>{
 const ranked=npcStats(items).ranked.sort((a,b)=>b.price*b.stock-a.price*a.stock);
 assert.equal(ranked[0].nome,'T54');assert.equal(ranked[0].price*ranked[0].stock,305592);
});
test('venda de itens roubados desconta lavagem e gazua uma única vez',()=>{
 const result=houseLootScenario([{precoSujo:1000}],[2],{lockpickUnit:1000,lockpickQuantity:1,tax:.3});
 assert.equal(result.grossDirty,2000);assert.equal(result.profit,400);
});
test('Economia Ilegal oferece áreas independentes e preserva as subpáginas de ações',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 for(const area of ['acoes','quebrados','roubados','lootnpc','portamalas','comerciante'])assert.match(html,new RegExp('data-economy-area="'+area+'"'));
 assert.match(html,/Economia Ilegal/);assert.match(html,/QUANTIDADE JÁ COMPRADA/);
 for(const page of ['overview','workspace','ranking','prices','npc'])assert.match(html,new RegExp('data-ap-subpage="'+page+'"'));
});

test('itens roubados preservam 15 preços e 73218 compras das imagens',()=>{
 assert.equal(stolen.length,15);assert.deepEqual(cleanNpcProducts(stolen),stolen);
 const result=npcStats(stolen);assert.equal(result.observed,15);
 assert.equal(result.units,73218);assert.equal(result.grossDirty,22991575);
 assert.equal(stolen.find(x=>x.nome==='Cola').quantidadeNpc,13607);
 assert.equal(stolen.find(x=>x.nome==='Televisão').quantidadeNpc,0);
 assert.equal(stolen.find(x=>x.nome==='Memória RAM').precoSujo,450);
});
test('simulação da casa usa quantidades encontradas sem usar compras acumuladas',()=>{
 const quantities=stolen.map(x=>x.nome==='Unidade SSD'?2:x.nome==='Aliança'?1:0);
 const result=houseLootScenario(stolen,quantities,{lockpickUnit:500,lockpickQuantity:1,tax:.3});
 assert.equal(result.units,3);assert.equal(result.grossDirty,1100);assert.equal(result.profit,270);
});
