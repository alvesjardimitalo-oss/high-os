import test from 'node:test';
import assert from 'node:assert/strict';
import {LOOT_TABLES} from '../assets/modules/roubos-loot-data.js';
import {STOLEN_ITEMS_SNAPSHOT} from '../assets/modules/economia-npc-seed.js';
import {makeLootPrices,weightedLoot,robberyProjection,actualHouseRun,houseRunMetrics} from '../assets/modules/roubos-loot-core.js';
import {applyRegistryMutation,cleanRegistry} from '../assets/modules/acoes-cadastro.js';
test('sete imagens preservam 129 entradas, pesos, quantidades e repetições',()=>{
 for(const [key,[count,pool,chance]] of Object.entries({cofre:[11,455,.675],armario:[36,979,.775],npc:[41,1528,1],portamalas:[41,1498,null]})){
  const table=LOOT_TABLES[key];assert.equal(table.items.length,count);assert.equal(table.items.reduce((s,x)=>s+x.peso,0),pool);assert.equal(table.chance,chance);
  assert.ok(table.items.every(x=>x.min>0&&x.max>=x.min&&Number.isInteger(x.peso)&&x.peso>0));
 }
 assert.equal(LOOT_TABLES.npc.drawsPerRobbery,1);
 assert.equal(LOOT_TABLES.armario.items.filter(x=>x.codigo==='toothpaste').length,2);
 assert.equal(LOOT_TABLES.armario.items.filter(x=>x.codigo==='hood').length,2);
 assert.equal(LOOT_TABLES.npc.items.filter(x=>x.codigo==='misturaquimica').length,2);
});
test('peso/pool e chance de render são aplicados uma única vez',()=>{
 const prices=new Map([['A',100]]),table={chance:.5,items:[{nome:'A',codigo:'a',peso:3,min:2,max:4},{nome:'Dinheiro',codigo:'dirtydollar',peso:1,min:100,max:200}]};
 const result=weightedLoot(table,prices);assert.equal(result.low,87.5);assert.equal(result.high,175);assert.equal(result.midpoint,131.25);
 assert.equal(robberyProjection([{table,draws:2}],prices,{investment:50,tax:.2}).profit,160);
});
test('falta de preço, sorteios ou chance bloqueia lucro total',()=>{
 const p=makeLootPrices(STOLEN_ITEMS_SNAPSHOT),result=weightedLoot(LOOT_TABLES.cofre,p);
 assert.equal(result.complete,false);assert.ok(result.coverage<1);assert.equal(result.rows.find(x=>x.codigo==='dirtydollar').unit,1);
 assert.equal(result.rows.find(x=>x.codigo==='goldnecklace').unit,null);
 assert.equal(robberyProjection([{table:LOOT_TABLES.cofre,draws:1}],p,{investment:100}).profit,null);
 assert.equal(robberyProjection([{table:LOOT_TABLES.cofre,draws:''}],p,{investment:100}).missingSetup,true);
 assert.equal(robberyProjection([{table:LOOT_TABLES.portamalas,draws:1}],p,{investment:0}).missingSetup,true);
 assert.equal(robberyProjection([{table:LOOT_TABLES.cofre,draws:0},{table:LOOT_TABLES.armario,draws:0}],p,{investment:100}).profit,-100);
});
test('compras acumuladas e preço de armas quebradas não viram rendimento da casa',()=>{
 const p=makeLootPrices(STOLEN_ITEMS_SNAPSHOT),changed=makeLootPrices(STOLEN_ITEMS_SNAPSHOT.map(x=>({...x,quantidadeNpc:99999999})));
 assert.equal(weightedLoot(LOOT_TABLES.armario,p).midpoint,weightedLoot(LOOT_TABLES.armario,changed).midpoint);
 assert.equal(weightedLoot(LOOT_TABLES.npc,p).rows.find(x=>x.codigo==='WEAPON_PISTOL_MK2').unit,null);
});
test('receita direta e venda descontam lavagem e gazua apenas uma vez',()=>{
 const entry={label:'Casa 1',items:[{nome:'SSD',codigo:'ssddrive',quantidade:2,precoSujo:400}],directDirty:200,lockpickUnit:100,lockpickQuantity:1,tax:.3,minutes:10,profit:999999};
 const result=actualHouseRun(entry.items,entry);assert.equal(result.itemDirty,800);assert.equal(result.grossDirty,1000);assert.equal(result.profit,600);
 assert.throws(()=>actualHouseRun([{nome:'Sem preço',quantidade:1,precoSujo:null}],{lockpickUnit:100}),/preço/);
 assert.throws(()=>actualHouseRun([],{lockpickUnit:null}),/Confira/);
 const first=applyRegistryMutation(null,{kind:'house-run-save',entry});assert.equal(first.houseRuns[0].profit,600);
 const second=applyRegistryMutation(first,{kind:'npc-save',entry:{market:'CASAS',items:[{nome:'SSD',codigo:'ssddrive',precoSujo:9999,quantidadeNpc:0}]}});
 assert.equal(cleanRegistry(second).houseRuns[0].profit,600);assert.ok(second.houseRuns[0].at);assert.ok(second.houseRuns[0].id);
});
test('média inclui fracassos e rendimento horário só usa tentativas cronometradas',()=>{
 const good=actualHouseRun([],{directDirty:1000,lockpickUnit:100,minutes:10}),failed=actualHouseRun([],{lockpickUnit:100,outcome:'fracasso'});
 const metrics=houseRunMetrics([good,failed]);assert.equal(metrics.count,2);assert.equal(metrics.average,250);assert.equal(metrics.hourly,3600);
});
test('histórico mantém as últimas 50 tentativas',()=>{
 let registry=null;for(let i=0;i<55;i++)registry=applyRegistryMutation(registry,{kind:'house-run-save',entry:{label:'Casa '+i,items:[],lockpickUnit:100}});
 assert.equal(registry.houseRuns.length,50);assert.equal(registry.houseRuns[0].label,'Casa 5');assert.equal(registry.houseRuns.at(-1).label,'Casa 54');
});
