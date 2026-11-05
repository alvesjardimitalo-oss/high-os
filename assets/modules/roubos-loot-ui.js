import {LOOT_TABLES} from './roubos-loot-data.js?v=1';
import {STOLEN_ITEMS_SNAPSHOT} from './economia-npc-seed.js?v=2';
import {makeLootPrices,lootPrice,weightedLoot,invasionExpectation,simulateInvasions,houseSearchParts,actualHouseRun,houseRunMetrics,lootKey} from './roubos-loot-core.js?v=3';
import {priceOf} from './acoes-core.js?v=5';

export function createHouseWorkbench({root,getRegistry,getCatalog,canEdit,onSave}){
 const host=root.querySelector('#apHouseWorkbench');if(!host)return {refresh(){},selectMode(){},mode:()=>null};
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const money=v=>Number.isFinite(v)?new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(v):'Pendente';
 const pct=v=>new Intl.NumberFormat('pt-BR',{style:'percent',maximumFractionDigits:2}).format(v);
 const state={mode:'casas',stage:'projecao',locations:15,safes:0,durability:6,seed:42,unit:'',qty:1,tax:30,direct:0,minutes:'',label:'',outcome:'concluido',extra:0};
 const found=new Map(),overrides=new Map();let busy=false;
 const $=id=>host.querySelector('#'+id);
 const merchant=()=>{const saved=getRegistry()?.npcMarkets?.CASAS;return saved?.updatedAt||saved?.items?.length?saved.items:STOLEN_ITEMS_SNAPSHOT;};
 const sources=()=>state.mode==='casas'?[LOOT_TABLES.cofre,LOOT_TABLES.armario]:[state.mode==='npc'?LOOT_TABLES.npc:LOOT_TABLES.portamalas];
 const houseItems=()=>[...new Map([...LOOT_TABLES.cofre.items,...LOOT_TABLES.armario.items].filter(x=>x.codigo!=='dirtydollar').map(x=>[x.codigo,x])).values()];
 function prices(){const result=makeLootPrices(merchant());for(const [key,value] of overrides){const row=houseItems().find(x=>x.codigo===key);result.delete(lootKey(key));if(row)result.delete(lootKey(row.nome));if(value!==''&&Number.isFinite(Number(value))&&Number(value)>=0)result.set(lootKey(key),Number(value));}return result;}
 const fullCost=()=>state.unit===''?priceOf('LOCKPICK ++',getCatalog(),'pista').unit:Number(state.unit);
 const costUnit=()=>{const value=fullCost(),life=Number(state.durability);if(!Number.isInteger(life)||life<1||life>100)return null;return value===null?null:value/life;};
 const field=(label,id,value,extra='')=>'<label class="ap-field">'+label+'<input id="'+id+'" value="'+esc(value)+'" '+extra+'></label>';
 const kpis=rows=>'<div class="ap-management-kpis">'+rows.map(([label,value])=>'<div class="ap-kpi"><small>'+esc(label)+'</small><strong>'+esc(value)+'</strong></div>').join('')+'</div>';
 function render(){
  const p=prices(),items=houseItems();host.dataset.hlStage=state.stage;
  host.innerHTML='<nav class="ap-navigation" aria-label="Atividade de roubo">'+[['casas','Roubo de Casas'],['npc','Loot de NPC'],['portamalas','Porta-malas']].map(([key,label])=>'<button type="button" data-hl-mode="'+key+'" '+(state.mode===key?'aria-current="page"':'')+'>'+label+'</button>').join('')+'</nav>'+
   '<nav class="ap-navigation" aria-label="Seções do rendimento">'+[['projecao','Projeção'],...(state.mode==='casas'?[['registro','Registrar tentativa'],['historico','Resultados por casa']]:[]),['config','Configuração de loot']].map(([key,label])=>'<button type="button" data-hl-stage-nav="'+key+'" '+(state.stage===key?'aria-current="page"':'')+'>'+label+'</button>').join('')+'</nav>'+
   '<h3>'+({casas:'Quanto rende um roubo de casa?',npc:'Loot de NPC • assalto a mão armada',portamalas:'Loot de porta-malas'})[state.mode]+'</h3>'+
   '<p class="ap-sub">'+(state.mode==='casas'?'Entrada com gazua ++ → busca em cofres e armários → venda dos itens → lavagem → lucro por casa.':'Atividade cadastrada separadamente das casas; o loot de NPC não é a tabela do comerciante.')+'</p>'+
   '<div class="ap-filter-row ap-hl-parameters">'+(state.mode==='casas'?field('Locais para vasculhar na casa (1 a 100)','hl-locations',state.locations,'type="number" min="1" max="100" step="1"')+field('Desses locais, quantos são cofres?','hl-safes',state.safes,'type="number" min="0" max="'+state.locations+'" step="1"')+field('Preço da gazua ++ • pista','hl-unit',state.unit,'type="number" min="0" step="0.01" placeholder="'+esc(money(fullCost()))+'"')+field('Invasões por gazua ++ • estimativa de 4 a 10','hl-durability',state.durability,'type="number" min="1" max="100" step="1"')+field('Usos da ferramenta nesta invasão','hl-qty',state.qty,'type="number" min="1" max="100" step="1"'):
    (state.mode==='npc'?'<p class="ap-hint">1 sorteio de loot por NPC, conforme configuração.</p>':'<p class="ap-hint">Porta-malas: 1 sorteio ponderado próprio. O resultado é por sorteio; eventual falha externa do roubo não aparece nas imagens.</p>')+field('Custo da tentativa','hl-extra',state.extra,'type="number" min="0" step="0.01"'))+
    field('Lavagem (%)','hl-tax',state.tax,'type="number" min="0" max="99" step="0.1"')+'</div>'+
   '<div id="hlProjection" data-hl-stage="projecao" aria-live="polite"></div>'+
   (state.mode==='casas'?'<div data-hl-stage="registro"><p class="ap-hint">Custo da ferramenta dividido pela durabilidade estimada; o registro congela esse custo proporcional. Cada local aplica sua chance de render loot e, se render, sorteia uma entrada e sua quantidade.</p><h3>Registrar uma tentativa de roubo de casa</h3><p class="ap-sub">Preencha os itens efetivamente recuperados. O dinheiro direto é separado da venda ao comerciante. Preços informados aqui são usados nesta análise; o preço oficial do NPC permanece no cadastro da etapa final.</p><div class="ap-filter-row">'+field('Casa / identificação','hl-label',state.label,'maxlength="100" placeholder="Ex.: Casa 01"')+field('Dinheiro sujo encontrado diretamente','hl-direct',state.direct,'type="number" min="0" step="1"')+field('Tempo total (minutos)','hl-minutes',state.minutes,'type="number" min="0.1" max="1440" step="0.1" placeholder="Opcional"')+'<label class="ap-field">Resultado<select id="hl-outcome"><option value="concluido" '+(state.outcome==='concluido'?'selected':'')+'>Concluído</option><option value="fracasso" '+(state.outcome==='fracasso'?'selected':'')+'>Fracasso / perda</option></select></label></div><div class="ap-table-scroll"><table class="ap-management-table"><thead><tr><th>LOOT DA CASA</th><th>QUANTIDADE RECUPERADA</th><th>PREÇO DE VENDA UNITÁRIO • SUJO</th></tr></thead><tbody>'+items.map(x=>{const value=overrides.has(x.codigo)?overrides.get(x.codigo):lootPrice(x,p);return '<tr><td>'+esc(x.nome)+'<small class="ap-row-muted"> '+esc(x.codigo)+'</small></td><td><input class="ap-table-input" type="number" min="0" max="100000" step="1" data-hl-quantity="'+esc(x.codigo)+'" value="'+esc(found.get(x.codigo)||0)+'" aria-label="Quantidade de '+esc(x.nome)+'"></td><td><input class="ap-table-input" type="number" min="0" step="0.01" data-hl-price="'+esc(x.codigo)+'" value="'+esc(value??'')+'" placeholder="Preço não cadastrado" aria-label="Preço de '+esc(x.nome)+'"></td></tr>';}).join('')+'</tbody></table></div><div id="hlActual" aria-live="polite"></div><div class="ap-actions"><button type="button" class="ap-button primary" id="hlSave" '+(!canEdit()||busy?'disabled':'')+'>Registrar tentativa e resultado</button></div></div><div id="hlHistory" data-hl-stage="historico"></div><p id="hlMessage" class="ap-row-muted"></p>':'')+
   '<details class="ap-loot-catalog" data-hl-stage="config" open><summary>Configuração cadastrada de loot • '+sources().reduce((n,x)=>n+x.items.length,0)+' entradas</summary><div id="hlTables"></div></details>';
  summarize();
 }
 function actual(){
  for(const value of found.values())if(value===''||!Number.isInteger(Number(value))||Number(value)<0||Number(value)>100000)throw Error('Informe quantidades inteiras entre 0 e 100.000.');
  const p=prices();const items=houseItems().filter(x=>Number(found.get(x.codigo))>0).map(x=>({...x,quantidade:Number(found.get(x.codigo)),precoSujo:lootPrice(x,p)}));
  return actualHouseRun(items,{directDirty:state.direct,lockpickUnit:costUnit(),lockpickQuantity:state.qty,tax:Number(state.tax)/100,minutes:state.minutes,label:state.label,outcome:state.outcome});
 }
 function summarize(){
  const p=prices(),sourcesNow=sources();
  const unit=costUnit(),uses=state.mode==='casas'?Number(state.qty):1;
  try{
   const parts=state.mode==='casas'?houseSearchParts(LOOT_TABLES,state.locations,state.safes):[{table:sourcesNow[0],count:1,chance:sourcesNow[0].chance??1}];
   const cost=state.mode==='casas'?unit:Number(state.extra),tax=Number(state.tax)/100;
   const simulation=simulateInvasions(parts,p,{lockpickUnit:cost,uses,tax,trials:10000,seed:state.seed}),expected=simulation.expected;
   const decimal=value=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2}).format(value);
   const partial=expected.allPriced?'':' • parcela com preço conhecido';
   let html=kpis([['Você gasta por tentativa',money(expected.investment)],['Você recebe • sujo conhecido',money(expected.knownGrossDirty)],['Sobra após lavagem • valor conhecido',money(expected.knownProfit)]]);
   html+='<p class="ap-hint">'+(expected.allPriced?'Este é o resultado médio de uma tentativa.':'Esta conta é parcial: itens sem preço e usos futuros ainda não entram no dinheiro recebido.')+'</p><details class="ap-simple-details"><summary>Ver quantidades, chances e exemplos</summary>'+kpis([['Itens físicos por invasão • média',decimal(expected.units)],['Locais com recompensa • média',decimal(expected.rewardedPoints)],['Chance de não render nenhuma recompensa',pct(expected.emptyChance)]]);

   html+='<p class="ap-hint">'+(state.mode==='casas'?'Casa simulada: '+state.locations+' local(is), sendo '+state.safes+' cofre(s) e '+(Number(state.locations)-Number(state.safes))+' armário(s). Cada armário tem 77,5% de chance de render loot e cada cofre, 67,5%.':'Atividade calculada com seu próprio pool, sem utilizar o loot das casas.')+'</p>';
   if(!expected.allPriced)html+='<p class="ap-hint warn">Todos os itens entram na quantidade simulada. Ainda faltam preços de venda para '+decimal(expected.unknownUnits)+' unidade(s) esperada(s). Receita e lucro acima incluem apenas os valores conhecidos; o lucro completo depende dos preços ainda não informados.</p>';
   html+='<div class="ap-actions"><button type="button" class="ap-button primary" id="hlResim">Simular novamente 10.000 invasões</button></div><h4>Variação observada em '+simulation.trials.toLocaleString('pt-BR')+' simulações</h4>'+kpis([['Itens físicos • percentil 10',simulation.unitsP10],['Itens físicos • mediana',simulation.unitsP50],['Itens físicos • percentil 90',simulation.unitsP90],['Tentativas sem recompensa',pct(simulation.emptyRate)]])+'<p class="ap-row-muted">Uma entrada por local que render loot. A quantidade é sorteada como inteiro uniforme dentro da faixa cadastrada; buscas independentes. Dinheiro direto fica separado da contagem de itens físicos. Médias e percentis não são garantias de prêmio.</p>';
   if(state.mode==='casas'){
    html+='<h4>Comparação por número de locais</h4><p class="ap-row-muted">Mantém até '+state.safes+' cofre(s); os demais locais são armários. Sem presumir que os cinco tamanhos de casa sejam igualmente frequentes.</p><div class="ap-table-scroll"><table class="ap-management-table"><thead><tr><th>LOCAIS</th><th>COFRES / ARMÁRIOS</th><th>ITENS FÍSICOS • MÉDIA</th><th>SEM RECOMPENSA</th><th>RECEITA SUJA'+partial.toUpperCase()+'</th><th>LUCRO / USO'+partial.toUpperCase()+'</th></tr></thead><tbody>';
    for(const total of [...new Set([1,5,10,15,20,Number(state.locations)])].sort((a,b)=>a-b)){
     const safes=Math.min(Number(state.safes),total),r=invasionExpectation(houseSearchParts(LOOT_TABLES,total,safes),p,{lockpickUnit:unit,uses,tax});
     html+='<tr><td>'+total+'</td><td>'+safes+' / '+(total-safes)+'</td><td>'+decimal(r.units)+'</td><td>'+pct(r.emptyChance)+'</td><td>'+money(r.knownGrossDirty)+'</td><td>'+money(r.perUseKnownProfit)+'</td></tr>';
    }
    html+='</tbody></table></div>';
   }
   html+='<details><summary>Exemplos de invasões sorteadas</summary><div class="ap-table-scroll"><table class="ap-management-table"><thead><tr><th>INVASÃO</th><th>RECOMPENSAS OBTIDAS</th><th>ITENS FÍSICOS</th><th>RECEITA SUJA CONHECIDA</th></tr></thead><tbody>'+simulation.samples.map((sample,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(sample.items.map(x=>x.nome+' ×'+x.quantidade).join(', ')||'Nenhuma recompensa')+'</td><td>'+sample.units+'</td><td>'+money(sample.knownDirty)+(sample.unknown?' + itens sem preço':'')+'</td></tr>').join('')+'</tbody></table></div></details>';
   html+='<details><summary>Quantidade e chance de cada item por invasão</summary><div class="ap-table-scroll"><table class="ap-management-table"><thead><tr><th>ITEM</th><th>QUANTIDADE MÉDIA</th><th>CHANCE DE OBTER AO MENOS UMA VEZ</th></tr></thead><tbody>'+expected.items.filter(x=>x.expectedQty>0).map(x=>'<tr><td>'+esc(x.nome)+'</td><td>'+decimal(x.expectedQty)+'</td><td>'+pct(x.probability)+'</td></tr>').join('')+'</tbody></table></div></details>';
   $('hlProjection').innerHTML=html+'</details>';
  }catch(e){$('hlProjection').textContent=e.message;}
  $('hlTables').innerHTML=sourcesNow.map(table=>{const result=weightedLoot(table,p);return '<h4>'+esc(table.nome)+' • '+table.items.length+' entradas • pool '+result.pool+'</h4><p class="ap-row-muted">'+(table.chance===null?'Chance de render: não informada':('Chance de render: '+pct(table.chance)))+' • Preços conhecidos: '+pct(result.coverage)+' do peso do pool. Entradas repetidas preservadas.</p><div class="ap-table-scroll"><table class="ap-management-table"><thead><tr><th>ITEM / CÓDIGO</th><th>PESO</th><th>CHANCE NO SORTEIO</th><th>QUANTIDADE</th><th>VENDA UNITÁRIA (SUJO)</th></tr></thead><tbody>'+result.rows.map(x=>'<tr><td>'+esc(x.nome)+' <small>'+esc(x.codigo)+'</small></td><td>'+x.peso+'</td><td>'+pct(x.probability)+'</td><td>'+x.min+'–'+x.max+'</td><td>'+money(x.unit)+'</td></tr>').join('')+'</tbody></table></div>';}).join('');
  if(state.mode!=='casas')return;
  try{const result=actual();$('hlActual').innerHTML=kpis([['Dinheiro direto + venda dos itens',money(result.grossDirty)],['Receita após lavagem',money(result.netAfterWash)],['Custo proporcional da ferramenta',money(result.investment)],['Lucro / prejuízo desta casa',money(result.profit)]]);}
  catch(e){$('hlActual').textContent=e.message;}
  const runs=getRegistry()?.houseRuns||[],stats=houseRunMetrics(runs);
  $('hlHistory').innerHTML='<h3>Rendimento observado por casa</h3>'+kpis([['Tentativas registradas',stats.count],['Lucro médio por tentativa',money(stats.average)],['Lucro por hora • tentativas cronometradas',money(stats.hourly)],['Dinheiro sujo das tentativas',money(stats.grossDirty)]])+'<p class="ap-row-muted">Histórico das últimas 50 tentativas. Inclui fracassos e custos. Preços e resultados são congelados por registro, sem recalcular vendas antigas por preços novos.</p><div class="ap-table-scroll"><table class="ap-management-table"><thead><tr><th>REGISTRO</th><th>RESULTADO</th><th>RECEITA SUJA</th><th>CUSTO</th><th>LUCRO</th></tr></thead><tbody>'+runs.slice().reverse().map(x=>'<tr><td>'+esc(x.label)+'<small> '+esc(new Date(x.at).toLocaleString('pt-BR'))+'</small></td><td>'+esc(x.outcome)+'</td><td>'+money(x.grossDirty)+'</td><td>'+money(x.investment)+'</td><td>'+money(x.profit)+'</td></tr>').join('')+'</tbody></table></div>';
 }
 host.addEventListener('input',e=>{
  const target=e.target;
  if(target.dataset.hlQuantity)found.set(target.dataset.hlQuantity,target.value);
  else if(target.dataset.hlPrice)overrides.set(target.dataset.hlPrice,target.value);
  else if(target.id?.startsWith('hl-'))state[target.id.slice(3)]=target.value;
  if(target.id==='hl-locations'&&Number(state.safes)>Number(state.locations)){state.safes=Number(state.locations);if($('hl-safes'))$('hl-safes').value=state.safes;}
  if($('hl-safes'))$('hl-safes').max=state.locations;
  summarize();
 });
 host.addEventListener('change',e=>{if(e.target.id==='hl-outcome'){state.outcome=e.target.value;summarize();}});
 host.addEventListener('click',async e=>{
  if(e.target.closest('#hlResim')){state.seed=(Number(state.seed)+1)>>>0;summarize();return;}
  const stage=e.target.closest('[data-hl-stage-nav]');if(stage){state.stage=stage.dataset.hlStageNav;host.dataset.hlStage=state.stage;host.querySelectorAll('[data-hl-stage-nav]').forEach(button=>{if(button===stage)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});return;}
  const mode=e.target.closest('[data-hl-mode]');if(mode){state.mode=mode.dataset.hlMode;state.stage='projecao';render();return;}
  if(!e.target.closest('#hlSave')||busy||!canEdit())return;
  busy=true;const button=$('hlSave');button.disabled=true;
  try{const entry=actual();await onSave(entry);found.clear();state.direct=0;state.label='';state.minutes='';state.stage='historico';render();if($('hlMessage'))$('hlMessage').textContent='Tentativa registrada com receita, custo, preços e lucro preservados.';}
  catch(err){if($('hlMessage'))$('hlMessage').textContent='Não foi possível registrar: '+err.message;}
  finally{busy=false;if($('hlSave'))$('hlSave').disabled=!canEdit();}
 });
 render();return {refresh:render,mode:()=>state.mode,selectMode(mode){if(!['casas','npc','portamalas'].includes(mode))return;state.mode=mode;state.stage='projecao';render();}};
}
