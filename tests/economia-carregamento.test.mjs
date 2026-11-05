import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createActionWorkspace} from '../assets/modules/acoes-workspace.js';

test('cliques internos não são confundidos com o atributo de estado do painel',()=>{
 const handlers={};const root={dataset:{},querySelector:()=>null,querySelectorAll:()=>[],addEventListener:(kind,handler)=>{(handlers[kind]??=[]).push(handler);},dispatchEvent(){return true},scrollIntoView(){}};
 createActionWorkspace({root,getActions:()=>[],getPublished:()=>[],getSelected:()=>'',getCatalog:()=>null,select(){},refresh(){}});
 const target={closest(selector){if(selector==='[data-economy-area]')return root;if(selector==='[data-ap-nav]')return {dataset:{apNav:'catalog'}};return null;}};
 handlers.click[0]({target});assert.equal(root.dataset.apSection,'catalog');
 const merchant={closest(selector){if(selector==='[data-economy-area]')return root;if(selector==='#apHouseMerchant')return {};return null;}};
 handlers.click[0]({target:merchant});assert.equal(root.dataset.apSection,'npc');
});

test('falha no Mercado Negro preserva os módulos e carrega cadastro independente',async()=>{
 const source=readFileSync(new URL('../assets/modules/acoes-planejador-ui.js',import.meta.url),'utf8');
 const calls=[];const originalFetch=globalThis.fetch,originalDocument=globalThis.document;
 let markup='<painel-com-casas-e-loot>',message='';
 const root={get innerHTML(){return markup;},set innerHTML(value){markup=value;},querySelector:()=>({addEventListener(){}})};
 const status={get innerHTML(){return message;},set innerHTML(value){message=value;}};
 globalThis.document={getElementById:id=>id==='actionEconomyPlanner'?root:id==='apSource'?status:null};
 globalThis.fetch=async()=>{calls.push('market');return {ok:false,status:503};};
 globalThis.__economiaLoadCalls=calls;
 const stub='export function createActionWorkspace(){return {async load(){globalThis.__economiaLoadCalls.push("registry")},paint(){globalThis.__economiaLoadCalls.push("paint")}}}';
 const compiled=source.replace(/from '(\.\/[^']+)'/g,(_,path)=>'from '+JSON.stringify(path.startsWith('./acoes-workspace.js')?'data:text/javascript,'+encodeURIComponent(stub):new URL('../assets/modules/'+path.slice(2),import.meta.url).href));
 try{const mod=await import('data:text/javascript,'+encodeURIComponent(compiled));await mod.mountActionPlanner();assert.equal(markup,'<painel-com-casas-e-loot>');assert.match(message,/continuam disponíveis/);assert.equal(calls[0],'registry');assert.ok(calls.includes('paint'));}
 finally{globalThis.fetch=originalFetch;globalThis.document=originalDocument;delete globalThis.__economiaLoadCalls;}
});


test('navegação separa ações, roubos e comerciantes',()=>{
 const handlers={};const root={dataset:{},querySelector:()=>null,querySelectorAll:()=>[],addEventListener:(kind,handler)=>{(handlers[kind]??=[]).push(handler);},dispatchEvent(){return true},scrollIntoView(){}};
 createActionWorkspace({root,getActions:()=>[],getPublished:()=>[],getSelected:()=>'',getCatalog:()=>null,select(){},refresh(){}});
 const click=area=>handlers.click[0]({target:{closest:selector=>selector==='button[data-economy-area]'?{dataset:{economyArea:area}}:null}});
 click('acoes');assert.equal(root.dataset.apSection,'overview');assert.equal(root.dataset.economyArea,'acoes');
 click('roubados');assert.equal(root.dataset.apSection,'loot');
 click('quebrados');assert.equal(root.dataset.apSection,'npc');
 click('acoes');assert.equal(root.dataset.apSection,'overview');
});
