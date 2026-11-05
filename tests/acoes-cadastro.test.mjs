import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {blankAction,cleanActionEntry,cleanRegistry,mergeActionRegistry,applyRegistryMutation}
 from '../assets/modules/acoes-cadastro.js';

const official=[
 {nome:'LOJA MODELO',status:'ativo',premio_min:300000,premio_max:360000,
  itens:[{nome:'ARMA PISTOLA',quantidade:2}],
  regras_confronto:[{invasores:2,policiais:4,refens:0}]},
 {nome:'BANCO MODELO',status:'ativo',premio_min:900000,premio_max:1035000,
  itens:[{nome:'COLETE',quantidade:3}],
  regras_confronto:[{invasores:3,policiais:6,refens:0}]}
];
const created={...blankAction(),nome:'AÇÃO NOVA',premio_min:500000,premio_max:575000,
 itens:[{nome:'COLETE',quantidade:2}],regras_confronto:[{invasores:2,policiais:4,refens:1}]};

test('cadastro cria ação sem modificar o catálogo oficial',()=>{
 const r=applyRegistryMutation(null,{kind:'save',entry:created},official);
 const visible=mergeActionRegistry(official,r);
 assert.equal(r.revision,1);
 assert.equal(visible.length,3);
 assert.equal(visible.find(a=>a.nome==='AÇÃO NOVA').origemCadastro,'PERSONALIZADA');
 assert.equal(visible.find(a=>a.nome==='LOJA MODELO').premio_min,300000);
 assert.equal(official.length,2);
});
test('edição interna de ação oficial preserva fonte e bloqueia mudança de nome',()=>{
 const change={...official[0],premio_min:320000,premio_max:384000};
 const r=applyRegistryMutation(null,{kind:'save',entry:change,oldName:'LOJA MODELO'},official);
 const local=mergeActionRegistry(official,r).find(a=>a.nome==='LOJA MODELO');
 assert.equal(local.premio_min,320000);
 assert.equal(local.origemCadastro,'AJUSTE INTERNO');
 assert.equal(official[0].premio_min,300000);
 assert.throws(()=>applyRegistryMutation(r,{kind:'save',entry:{...change,nome:'NOVO NOME'},oldName:'LOJA MODELO'},official),/nome de uma ação oficial/);
});
test('arquivar oficial esconde apenas internamente, restaurar recupera',()=>{
 const hidden=applyRegistryMutation(null,{kind:'archive',name:'LOJA MODELO'},official);
 assert.equal(mergeActionRegistry(official,hidden).length,1);
 const restored=applyRegistryMutation(hidden,{kind:'restore',name:'LOJA MODELO'},official);
 assert.equal(mergeActionRegistry(official,restored).length,2);
 assert.equal(restored.revision,2);
});
test('excluir cadastro interno não apaga original nem cria registros órfãos',()=>{
 const modified=applyRegistryMutation(null,{
  kind:'save',entry:{...official[0],premio_min:350000,premio_max:420000},oldName:'LOJA MODELO'
 },official);
 const erased=applyRegistryMutation(modified,{kind:'delete',name:'LOJA MODELO'},official);
 assert.equal(mergeActionRegistry(official,erased).find(a=>a.nome==='LOJA MODELO').premio_min,300000);
 assert.equal(erased.revision,2);
});
test('dados inválidos e nomes duplicados nunca entram na gestão',()=>{
 assert.throws(()=>cleanActionEntry({...created,premio_min:600000,premio_max:400000}),/prêmios/);
 assert.throws(()=>cleanActionEntry({...created,nome:'BANCO MODELO'},{published:official}),/Já existe/);
 assert.throws(()=>cleanActionEntry({...created,regras_confronto:[{invasores:2,policiais:4},{invasores:2,policiais:5}]}),/repetir/);
 assert.deepEqual(cleanActionEntry({...created,tipo_acao:'registradora',itens:[]}).itens,[]);
 assert.deepEqual(cleanRegistry(null).npcMarkets.CASAS.items,[]);
 assert.deepEqual(cleanRegistry(null).npcMarkets.ARMAS_QUEBRADAS.items,[]);
});
test('planejador usa subpáginas e formulário com controles reais',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const css=readFileSync(new URL('../assets/acoes-planejador.css',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../assets/modules/acoes-planejador-ui.js',import.meta.url),'utf8');
 const workspace=readFileSync(new URL('../assets/modules/acoes-workspace.js',import.meta.url),'utf8');
 const app=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
 for(const tab of ['overview','catalog','ranking','prices'])
  assert.match(html,new RegExp('data-ap-nav="'+tab+'"'));
 for(const tab of ['resumo','custos','cenario','sugestao'])
  assert.match(html,new RegExp('data-ap-profile="'+tab+'"'));
 for(const id of ['apNewAction','apActionForm','apSaveEntry','apDeleteAction','apArchiveBox','apCatalogMore','apManageShowAll','apEntryType'])
  assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/acoes-planejador\.css\?v=\d+/);
 assert.match(app,/acoes-planejador-ui\.js\?v=\d+/);
 assert.match(ui,/createActionWorkspace/);
 assert.match(workspace,/onMutateRegistry/);
 assert.match(workspace,/showModal\(\)/);
 assert.match(css,/data-ap-section="profile"/);
 assert.match(css,/data-ap-profile-tab="sugestao"/);
});

test('ATM aceita explosivo consumível com preço do mercado ou customizado',()=>{
 const d=cleanActionEntry({...created,tipo_acao:'atm',
  itens:[{nome:'C4 ++',quantidade:2,categoria_item:'consumivel',preco_unitario:16000}],
  cooldown_segundos:1800,
  regras_confronto:[{invasores:1,policiais:2,refens:0}]});
 assert.equal(d.tipo_acao,'atm');
 assert.equal(d.itens[0].preco_unitario,16000);
 assert.equal(d.itens[0].categoria_item,'consumivel');
 assert.equal(d.cooldown_segundos,1800);
 assert.equal(d.regras_confronto[0].policiais,2);
});
test('registradora sem kit permite mínimo e máximo independentes',()=>{
 const d=cleanActionEntry({...created,nome:'FURTO REGISTRADORA',tipo_acao:'registradora',
  premio_min:5000,premio_max:9000,itens:[]});
 assert.equal(d.premio_min,5000);
 assert.equal(d.premio_max,9000);
 assert.deepEqual(d.itens,[]);
});

