import {BROKEN_ITEMS_SNAPSHOT,STOLEN_ITEMS_SNAPSHOT} from './economia-npc-seed.js?v=2';
import {npcStats,houseLootScenario} from './acoes-npc-core.js?v=2';
import {priceOf} from './acoes-core.js?v=5';

export function createNpcWorkbench({root,getRegistry,getCatalog,canEdit,onSave,onMarketChange=null}){
 const $=id=>root.querySelector('#'+id);
 const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));
 const money=n=>Number.isFinite(n)?new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(n):'A informar';
 const n=v=>v===''||v===null||v===undefined?null:Number.isFinite(Number(v))?Number(v):null;
 const keys={CASAS:'Comerciante de Itens Roubados',ARMAS_QUEBRADAS:'Comerciante de Itens Quebrados'};
 let market='CASAS',draft=[],loot=[],saving=false,priceMode='pista';
 const drafts=new Map();
 const persisted=()=>getRegistry()?.npcMarkets?.[market]||{items:[],history:[]};
 function hydrate(){
  const saved=persisted();
  draft=(drafts.get(market) || (saved.updatedAt||saved.items?.length?saved.items:market==='ARMAS_QUEBRADAS'?BROKEN_ITEMS_SNAPSHOT:STOLEN_ITEMS_SNAPSHOT)).map(x=>({...x}));
  loot=draft.map(()=>0);
  render();
 }
 const elRows=()=>[...root.querySelectorAll('.ap-npc-row')];
 function collect(){
  for(const row of elRows()){
   const index=Number(row.dataset.npcIndex);
   if(!draft[index])continue;
   const val=field=>row.querySelector('[data-npc-field="'+field+'"]')?.value??'';
   draft[index]={nome:val('nome'),codigo:val('codigo'),
    precoSujo:val('precoSujo'),quantidadeNpc:val('quantidadeNpc')};
   loot[index]=Math.max(0,Number(row.querySelector('[data-npc-loot]')?.value)||0);
  }
  drafts.set(market,draft.map(x=>({...x})));
 }
 function rowsHtml(){
  return draft.map((it,i)=>
   '<tr class="ap-npc-row" data-npc-index="'+i+'">'+
   '<td><input class="ap-table-input" data-npc-field="nome" maxlength="100" value="'+safe(it.nome)+'" placeholder="Nome do item"></td>'+
   '<td><input class="ap-table-input" data-npc-field="codigo" maxlength="100" value="'+safe(it.codigo||'')+'" placeholder="Código (opcional)"></td>'+
   '<td><input class="ap-table-input" type="number" min="0" step="1" data-npc-field="precoSujo" value="'+safe(it.precoSujo??'')+'" placeholder="R$ sujo"></td>'+
   '<td><input class="ap-table-input" type="number" min="0" step="1" data-npc-field="quantidadeNpc" value="'+safe(it.quantidadeNpc??'')+'" placeholder="Desconhecido"></td>'+
   '<td class="ap-npc-total" data-npc-total>'+safe(n(it.quantidadeNpc)===null||n(it.precoSujo)===null?'A informar':money(n(it.quantidadeNpc)*n(it.precoSujo)))+'</td>'+
   (market==='CASAS'?'<td><input class="ap-table-input" type="number" min="0" max="100000" step="1" data-npc-loot value="'+safe(loot[i]||0)+'" aria-label="Quantidade desse item encontrada na casa"></td>':'<td>—</td>')+
   '<td><button type="button" class="ap-button ap-danger" data-npc-remove="'+i+'" '+(canEdit()?'':'disabled')+' title="Remover item do cadastro">✕</button></td></tr>'
  ).join('');
 }
 function render(){
  const table=$('apNpcRows'),status=$('apNpcStatus');
  if(!table)return;
  if($('apNpcMarket'))$('apNpcMarket').value=market;
  if($('apNpcHeading'))$('apNpcHeading').textContent=keys[market];
  if($('apNpcSave'))$('apNpcSave').disabled=!canEdit()||saving;
  if($('apNpcAdd'))$('apNpcAdd').disabled=!canEdit();
  table.innerHTML=rowsHtml()||
   '<tr><td colspan="7" class="ap-row-muted">Nenhum item cadastrado neste NPC. As fotos com os preços poderão ser transcritas para esta tabela.</td></tr>';
  if(status)status.textContent='Última atualização registrada: '+(persisted().updatedAt?
   new Date(persisted().updatedAt).toLocaleString('pt-BR'):'imagens de 22/10/2026')+
   (!persisted().updatedAt?' • Base: '+(market==='ARMAS_QUEBRADAS'?28:15)+' itens transcritos das imagens de 22/10/2026. Atualização manual.':' • Contador acumulado de itens já comprados. Atualização manual.');
  const count=persisted().history?.length||0;
  if($('apNpcHistory'))$('apNpcHistory').textContent='Snapshots anteriores salvos: '+count+
   '. Cada registro preserva preços e quantidades. Se o contador diminuir, começa uma nova base de comparação; o dinheiro anteriormente pago não é apagado da cidade.';
  summarize();
 }
 function summarize(){
  const metrics=$('apNpcStats'),scenario=$('apNpcScenario');
  if(!metrics)return;
  const stats=npcStats(draft);
  const rows=[...stats.ranked].sort((a,b)=>b.stock*b.price-a.stock*a.price).slice(0,10);
  for(const row of elRows()){const it=draft[Number(row.dataset.npcIndex)];const total=row.querySelector('[data-npc-total]');if(total&&it)total.textContent=n(it.quantidadeNpc)===null||n(it.precoSujo)===null?'A informar':money(n(it.quantidadeNpc)*n(it.precoSujo));}
  metrics.innerHTML='<div class="ap-management-kpis">'+[
   
   ['Itens já comprados',stats.observed?stats.units:'A informar'],
   ['Valor dessas compras aos preços de hoje',stats.observed?money(stats.grossDirty):'A informar']
  ].map(([label,value])=>'<div class="ap-kpi"><small>'+safe(label)+'</small><strong>'+safe(value)+'</strong></div>').join('')+'</div>'+
  '<details class="ap-simple-details"><summary>Ver os itens mais vendidos</summary><div class="ap-table-scroll"><table class="ap-management-table"><thead><tr><th>MAIOR GERAÇÃO DE DINHEIRO SUJO</th><th>QUANTIDADE</th><th>PAGAMENTO UNITÁRIO</th><th>TOTAL AOS PREÇOS ATUAIS (SUJO)</th></tr></thead><tbody>'+
  (rows.length?rows.map(x=>'<tr><td>'+safe(x.nome)+'</td><td>'+safe(x.stock)+'</td><td>'+safe(money(x.price))+'</td><td>'+safe(money(x.stock*x.price))+'</td></tr>').join(''):
   '<tr><td colspan="4">Informe as quantidades mostradas pelo NPC para gerar o ranking.</td></tr>')+
  '</tbody></table></div></details>';
  if(!scenario)return;
  scenario.hidden=market!=='CASAS';
  if(market!=='CASAS')return;
  const catalog=getCatalog();
  const unit=priceOf('LOCKPICK ++',catalog,priceMode).unit;
  const qty=Math.max(0,Number($('apNpcLockpickQty')?.value??1)||0);
  const tax=Math.max(0,Math.min(99,Number($('apNpcWash')?.value??30)))/100;
  const arr=draft.map(x=>({precoSujo:x.precoSujo}));
  let result=null,error='';
  try{result=houseLootScenario(arr,loot,{lockpickUnit:unit,lockpickQuantity:qty,tax});}
  catch(e){error=String(e?.message||e);}
  const summary=$('apNpcLootSummary');if(!summary)return;
  summary.innerHTML=error?'<p class="ap-hint warn">'+safe(error)+'</p>':
   '<div class="ap-management-kpis">'+[
    ['Produtos encontrados',result.units],['Venda ao NPC (sujo)',money(result.grossDirty)],
    ['Receita após lavagem',money(result.netAfterWash)],['Investimento em gazua ++',money(result.investment)],
    ['Lucro ou prejuízo da casa',money(result.profit)]
   ].map(([label,value])=>'<div class="ap-kpi"><small>'+safe(label)+'</small><strong>'+safe(value)+'</strong></div>').join('')+'</div>'+
   '<p class="ap-row-muted">Ponto de equilíbrio do kit: '+money(result.breakEvenDirty)+
   ' em vendas sujas. A simulação utiliza o preço de '+safe(priceMode)+' de LOCKPICK ++ (gazua ++), '+
   'sem estimar quantos itens aparecem na casa. Informe quantidades na coluna “Encontrados nesta casa”.</p>';
 }
 function showMessage(message,warning=false){
  const node=$('apNpcMessage');if(!node)return;
  node.textContent=message;node.hidden=!message;node.className='ap-hint'+(warning?' warn':'');
 }
 root.addEventListener('change',e=>{
  if(e.target.id==='apNpcMarket'){
   selectMarket(e.target.value);return;
  }
  if(e.target.id==='apNpcPriceMode'){priceMode=e.target.value==='parceria'?'parceria':'pista';summarize();}
  if(['apNpcLockpickQty','apNpcWash'].includes(e.target.id))summarize();
 });
 root.addEventListener('input',e=>{
  if(e.target.closest('.ap-npc-row')){collect();summarize();}
  if(['apNpcLockpickQty','apNpcWash'].includes(e.target.id))summarize();
 });
 root.addEventListener('click',async e=>{
  if(e.target.closest('#apNpcAdd')){
   if(!canEdit())return;collect();
   draft.push({nome:'',codigo:'',precoSujo:'',quantidadeNpc:null});loot.push(0);render();return;
  }
  const rem=e.target.closest('[data-npc-remove]');
  if(rem){if(!canEdit())return;collect();const i=Number(rem.dataset.npcRemove);
   draft.splice(i,1);loot.splice(i,1);render();return;}
  if(e.target.closest('#apNpcReset')){
   drafts.delete(market);hydrate();showMessage('Rascunho descartado. Cadastro do último salvamento restaurado.');return;
  }
  if(e.target.closest('#apNpcSave')){
   if(!canEdit()||saving)return;collect();saving=true;
   const btn=$('apNpcSave');btn.disabled=true;
   try{
    // Registro consistente via revisão transacional, compartilhado com os demais cadastros.
    const savedMarket=market;
    await onSave({market:savedMarket,items:draft.map(x=>({...x}))});
    drafts.delete(savedMarket);hydrate();showMessage('Preços em dinheiro sujo e quantidades compradas salvos. Os preços oficiais do mercado não foram modificados.');
   }catch(err){showMessage('Não foi possível salvar: '+(err?.message||err),true);}
   finally{saving=false;btn.disabled=!canEdit();}
  }
 });
 hydrate();
 function selectMarket(next){
  collect();market=next in keys?next:'CASAS';hydrate();showMessage('');onMarketChange?.();
 }
 return {refresh(){drafts.clear();hydrate();},selectMarket,market:()=>market};
}

