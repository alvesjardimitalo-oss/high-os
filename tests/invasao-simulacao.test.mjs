import test from 'node:test';
import assert from 'node:assert/strict';
import {LOOT_TABLES} from '../assets/modules/roubos-loot-data.js';
import {STOLEN_ITEMS_SNAPSHOT} from '../assets/modules/economia-npc-seed.js';
import {houseSearchParts,invasionExpectation,simulateInvasions,makeLootPrices} from '../assets/modules/roubos-loot-core.js';
const prices=makeLootPrices(STOLEN_ITEMS_SNAPSHOT);
test('casas usam 1 a 5 locais e composição explícita, sem pedir sorteios manuais',()=>{
 for(let n=1;n<=5;n++){
  const result=invasionExpectation(houseSearchParts(LOOT_TABLES,n,0),prices,{lockpickUnit:100});
  assert.equal(result.locations,n);assert.ok(Math.abs(result.emptyChance-Math.pow(.225,n))<1e-12);
  const one=invasionExpectation(houseSearchParts(LOOT_TABLES,1,0),prices,{lockpickUnit:100});assert.ok(Math.abs(result.units-one.units*n)<1e-10);
 }
 assert.throws(()=>houseSearchParts(LOOT_TABLES,101,0));assert.throws(()=>houseSearchParts(LOOT_TABLES,2,3));
});
test('cofres e armários têm portas de render independentes aplicadas uma vez',()=>{
 const result=invasionExpectation(houseSearchParts(LOOT_TABLES,3,1),prices,{lockpickUnit:100});
 assert.ok(Math.abs(result.emptyChance-.325*.225*.225)<1e-12);
 assert.ok(Math.abs(result.rewardedPoints-(.675+2*.775))<1e-12);
 const cash=result.items.find(x=>x.codigo==='dirtydollar');assert.ok(Math.abs(cash.probability-.675*225/455)<1e-12);
});
test('entradas repetidas contribuem para quantidade e chance total do item',()=>{
 const result=invasionExpectation(houseSearchParts(LOOT_TABLES,5,0),prices,{lockpickUnit:100});
 const toothpaste=result.items.find(x=>x.codigo==='toothpaste');
 assert.ok(Math.abs(toothpaste.expectedQty-5*.775*70/979*2.5)<1e-12);
 assert.ok(Math.abs(toothpaste.probability-(1-Math.pow(1-.775*70/979,5)))<1e-12);
});
test('itens sem preço entram na quantidade, mas não viram receita completa',()=>{
 const result=invasionExpectation(houseSearchParts(LOOT_TABLES,5,0),prices,{lockpickUnit:100});
 assert.ok(result.units>0);assert.ok(result.unknownUnits>0);assert.ok(Number.isFinite(result.knownProfit));assert.equal(result.profit,null);
});
test('lucro por uso desconta uma gazua por uso, sem confundir dinheiro com itens',()=>{
 const table={chance:1,items:[{nome:'SSD',codigo:'ssd',peso:1,min:2,max:2}]};
 const p=new Map([['SSD',1000]]);const result=invasionExpectation([{table,count:1}],p,{lockpickUnit:100,uses:2,tax:.3});
 assert.equal(result.units,2);assert.equal(result.profit,1200);assert.equal(result.perUseProfit,600);
 const money={chance:1,items:[{nome:'Dinheiro',codigo:'dirtydollar',peso:1,min:100,max:100}]};
 const cash=invasionExpectation([{table:money,count:1}],new Map(),{lockpickUnit:10});assert.equal(cash.units,0);assert.equal(cash.directDirty,100);assert.equal(cash.profit,60);
});
test('Monte Carlo de 50 mil invasões converge para média exata e chance de vazio',()=>{
 const parts=houseSearchParts(LOOT_TABLES,5,1),result=simulateInvasions(parts,prices,{trials:50000,seed:123,lockpickUnit:100});
 assert.ok(Math.abs(result.meanUnits-result.expected.units)<.15);assert.ok(Math.abs(result.emptyRate-result.expected.emptyChance)<.005);
 assert.ok(result.unitsP10<=result.unitsP50&&result.unitsP50<=result.unitsP90);assert.equal(result.samples.length,8);
 assert.deepEqual(simulateInvasions(parts,prices,{trials:30,seed:123}),simulateInvasions(parts,prices,{trials:30,seed:123}));
});
test('porta-malas sorteia seu próprio pool e faixa, separado de casas',()=>{
 const result=simulateInvasions([{table:LOOT_TABLES.portamalas,count:1,chance:1}],prices,{trials:1000,seed:2,lockpickUnit:0});
 assert.equal(result.expected.locations,1);assert.equal(result.emptyRate,0);
 const cash=LOOT_TABLES.portamalas.items.find(x=>x.codigo==='dirtydollar');assert.equal(cash.min,10000);assert.equal(cash.max,15000);
 const zero=simulateInvasions([{table:LOOT_TABLES.armario,count:5,chance:0}],prices,{lockpickUnit:100});assert.equal(zero.meanUnits,0);assert.equal(zero.emptyRate,1);assert.equal(zero.expected.profit,-100);
});

test('teste observado permite 15 locais e compara até 100 sem alterar chances',()=>{
 for(const total of [15,20,100]){
  const r=invasionExpectation(houseSearchParts(LOOT_TABLES,total,0),prices,{lockpickUnit:100});
  assert.equal(r.locations,total);assert.ok(Math.abs(r.rewardedPoints-total*.775)<1e-10);
 }
});
