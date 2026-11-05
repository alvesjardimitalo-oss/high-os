import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cleanRegistry,applyRegistryMutation,cleanActionEntry,blankAction}
 from '../assets/modules/acoes-cadastro.js';
import {npcStats,houseLootScenario} from '../assets/modules/acoes-npc-core.js';

const items=[
 {nome:'Relógio',codigo:'watch',precoSujo:1500,quantidadeNpc:12},
 {nome:'Celular',codigo:'phone',precoSujo:2200,quantidadeNpc:3}
];
test('cadastros NPC mantêm duas lojas sem apagar ações existentes',()=>{
 const first=applyRegistryMutation(null,{kind:'npc-save',entry:{market:'CASAS',items}},[]);
 const second=applyRegistryMutation(first,{kind:'npc-save',entry:{market:'ARMAS_QUEBRADAS',
  items:[{nome:'Pistola quebrada',codigo:'pistola_quebrada',precoSujo:5000,quantidadeNpc:7}]}},[]);
 assert.equal(second.revision,2);
 assert.equal(second.npcMarkets.CASAS.items.length,2);
 assert.equal(second.npcMarkets.ARMAS_QUEBRADAS.items.length,1);
 assert.equal(second.npcMarkets.CASAS.history.length,1);
 assert.ok(second.npcMarkets.CASAS.updatedAt);
 assert.equal(cleanRegistry(second).npcMarkets.ARMAS_QUEBRADAS.items[0].quantidadeNpc,7);
});
test('cada atualização mantém fotografia anterior para conferência',()=>{
 const a=applyRegistryMutation(null,{kind:'npc-save',entry:{market:'CASAS',items}},[]);
 const b=applyRegistryMutation(a,{kind:'npc-save',entry:{market:'CASAS',
  items:items.map(x=>({...x,quantidadeNpc:x.quantidadeNpc+1}))}},[]);
 assert.equal(b.npcMarkets.CASAS.history.length,2);
 assert.equal(b.npcMarkets.CASAS.history[0].items[0].quantidadeNpc,12);
 assert.equal(b.npcMarkets.CASAS.history[1].items[0].quantidadeNpc,13);
});
test('bloqueia cadastro NPC com valores negativos, duplicados ou quantidade fracionária',()=>{
 assert.throws(()=>applyRegistryMutation(null,{kind:'npc-save',entry:{market:'CASAS',
  items:[{nome:'X',codigo:'x',precoSujo:-1,quantidadeNpc:0}]}},[]));
 assert.throws(()=>applyRegistryMutation(null,{kind:'npc-save',entry:{market:'CASAS',
  items:[items[0],items[0]]}},[]),/repetidos/);
 assert.throws(()=>applyRegistryMutation(null,{kind:'npc-save',entry:{market:'CASAS',
  items:[{nome:'X',codigo:'x',precoSujo:100,quantidadeNpc:1.5}]}},[]));
});
test('quantidade não informada não é interpretada como zero vendido',()=>{
 const stats=npcStats([...items,{nome:'Outro item',precoSujo:400,quantidadeNpc:null}]);
 assert.equal(stats.registered,3);
 assert.equal(stats.observed,2);
 assert.equal(stats.units,15);
 assert.equal(stats.grossDirty,24600);
 assert.equal(stats.ranked[0].nome,'Relógio');
});
test('soma itens de casa vendidos ao NPC e desconta gazua ++ e lavagem',()=>{
 const scenario=houseLootScenario(items,[1,2],{lockpickUnit:9500,lockpickQuantity:1,tax:.3});
 assert.equal(scenario.grossDirty,5900);
 assert.equal(scenario.netAfterWash,4130);
 assert.equal(scenario.investment,9500);
 assert.equal(scenario.profit,-5370);
 assert.equal(scenario.breakEvenDirty,13572);
});
test('permite casa com recompensa variável sem preço fictício',()=>{
 const a=cleanActionEntry({...blankAction(),nome:'Roubo de Casa',tipo_acao:'casas',
  premio_min:'',premio_max:'',itens:[{nome:'GAZUA ++',quantidade:1,categoria_item:'consumivel'}]});
 assert.equal(a.premio_min,0);
 assert.equal(a.premio_max,0);
 assert.equal(a.itens[0].nome,'GAZUA ++');
});
test('interface dos NPCs preserva subpágina e cadastro administrativo',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../assets/modules/acoes-workspace.js',import.meta.url),'utf8');
 const app=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
 for(const id of ['apNpcRows','apNpcSave','apNpcMarket','apNpcScenario','apNpcLootSummary','apNpcStats'])
  assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/data-economy-area="quebrados"/);
 assert.match(html,/data-economy-area="roubados"/);
 assert.match(html,/data-ap-subpage="npc"/);
 assert.match(ui,/createNpcWorkbench/);
 assert.match(app,/npc-save/);
});

