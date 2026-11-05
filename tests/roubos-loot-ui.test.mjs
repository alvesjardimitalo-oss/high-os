import test from 'node:test';
import assert from 'node:assert/strict';
import {createHouseWorkbench} from '../assets/modules/roubos-loot-ui.js';
import {applyRegistryMutation,cleanRegistry} from '../assets/modules/acoes-cadastro.js';
// Small DOM fixture for the event-driven workbench; no external browser dependency.
class Element {
 constructor(attrs={}){this.attrs=attrs;this.id=attrs.id||'';this.value=attrs.value||'';this.dataset={};this.disabled=false;this.textContent='';this.html='';
  for(const [key,value] of Object.entries(attrs))if(key.startsWith('data-'))this.dataset[key.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=value;
 }
 set innerHTML(value){this.html=value;}get innerHTML(){return this.html;}
 setAttribute(key,value){this.attrs[key]=value;}removeAttribute(key){delete this.attrs[key];}
 closest(selector){return selector.startsWith('#')?this.id===selector.slice(1)?this:null:selector.startsWith('[data-')&&selector.slice(1,-1) in this.attrs?this:null;}
}
class Host extends Element {
 constructor(){super();this.nodes=[];this.events={};}
 set innerHTML(value){this.html=value;this.nodes=[...value.matchAll(/<[a-z][^>]*>/g)].map(([tag])=>new Element(Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(x=>[x[1],x[2]]))));}
 get innerHTML(){return this.html;}
 querySelector(selector){return this.nodes.find(x=>x.id===selector.slice(1))||null;}
 querySelectorAll(selector){return this.nodes.filter(x=>selector.slice(1,-1) in x.attrs);}
 addEventListener(type,handler){this.events[type]=handler;}
 input(id,value){const node=this.querySelector('#'+id);node.value=value;return this.events.input({target:node});}
 click(selector){const node=selector.startsWith('#')?this.querySelector(selector):this.nodes.find(x=>x.dataset[selector.split('=')[0]]===selector.split('=')[1]);assert.ok(node,selector);return this.events.click({target:node});}
}
test('fluxo da casa calcula, bloqueia preço ausente, registra e mantém resultado congelado',async()=>{
 const host=new Host();let registry=cleanRegistry();
 createHouseWorkbench({root:{querySelector:()=>host},getRegistry:()=>registry,getCatalog:()=>({itens:[{item:'LOCKPICK ++',status:'ativo',pista:100}]}),canEdit:()=>true,onSave:async entry=>{registry=applyRegistryMutation(registry,{kind:'house-run-save',entry});}});
 assert.equal(host.dataset.hlStage,'projecao');assert.match(host.querySelector('#hlProjection').innerHTML,/Itens físicos por invasão/);
 host.input('hl-locations','5');assert.match(host.querySelector('#hlProjection').innerHTML,/Casa simulada: 5/);assert.match(host.querySelector('#hlProjection').innerHTML,/Comparação por número de locais/);
 await host.click('hlStageNav=registro');assert.equal(host.dataset.hlStage,'registro');
 const qty=host.nodes.find(x=>x.dataset.hlQuantity==='ssddrive');qty.value='2';host.events.input({target:qty});host.input('hl-direct','200');
 assert.match(host.querySelector('#hlActual').innerHTML,/683/);
 const price=host.nodes.find(x=>x.dataset.hlPrice==='ssddrive');price.value='';host.events.input({target:price});await host.click('#hlSave');assert.equal(registry.houseRuns.length,0);assert.match(host.querySelector('#hlMessage').textContent,/preço/);
 price.value='400';host.events.input({target:price});await host.click('#hlSave');assert.equal(registry.houseRuns.length,1);assert.ok(Math.abs(registry.houseRuns[0].profit-(700-100/6))<1e-9);assert.equal(host.dataset.hlStage,'historico');
 await host.click('hlMode=npc');assert.equal(host.dataset.hlStage,'projecao');assert.match(host.querySelector('#hlTables').innerHTML,/1.528|1528/);
 await host.click('hlMode=portamalas');assert.match(host.querySelector('#hlProjection').innerHTML,/Itens físicos por invasão/);
 await host.click('hlMode=casas');assert.match(host.querySelector('#hlHistory').innerHTML,/683/);
});
