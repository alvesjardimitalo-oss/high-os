import {priceOf,calculateAction} from './acoes-core.js?v=5';
import {LOOT_TABLES} from './roubos-loot-data.js?v=1';
import {makeLootPrices,invasionExpectation,houseSearchParts} from './roubos-loot-core.js?v=3';
import {BROKEN_ITEMS_SNAPSHOT,STOLEN_ITEMS_SNAPSHOT} from './economia-npc-seed.js?v=2';

export function createEconomyVisual({root,getRegistry,getCatalog,getActions}){
 const navigation=root.querySelector('.ap-economy-navigation');if(!navigation)return {refresh(){},selectArea(){}};
 const host=navigation.ownerDocument.createElement('section');host.className='ap-panel ap-economy-lab';
 navigation.after(host);
 let area='acoes';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const money=x=>Number.isFinite(x)?x.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}):'Preço pendente';
 const s={mode:'acoes',shift:0,life:6,points:15,tax:30,success:100,repair:0,scrap:0,cards:2,runs:3,action:'',volume:100};
 const field=(label,key,min,max,step=1)=>'<label class="ap-field">'+label+'<input type="number" data-ev="'+key+'" value="'+s[key]+'" min="'+min+'" max="'+max+'" step="'+step+'"></label>';
 const market=(key,fallback)=>{const m=getRegistry()?.npcMarkets?.[key];return m?.updatedAt||m?.items?.length?m.items:fallback;};
 function render(){
 const titles={acoes:'Quanto sobra em uma ação?',roubados:'Quanto sobra em uma casa?',portamalas:'Quanto sobra no roubo de veículo?',quebrados:'Quanto o NPC vai pagar?'};
 const choose=s.mode==='acoes'?'<label class="ap-field">Escolha a ação<select data-ev="action">'+getActions().map(a=>'<option value="'+esc(a.nome)+'" '+(s.action===a.nome?'selected':'')+'>'+esc(a.nome)+'</option>').join('')+'</select></label>':'';
 const advanced=(s.mode==='casas'||s.mode==='veiculo'?field('Quantos roubos a gazua dura?','life',1,100)+field('Quantos locais serão vasculhados?','points',1,100):'')+
 (s.mode==='quebrados'?field('Quantas unidades de cada item serão vendidas?','volume',0,100000):field('Taxa da lavagem (%)','tax',0,99))+
 (s.mode==='corridas'?field('Quantos cartões?','cards',0,100)+field('Corridas por cartão','runs',1,100):'')+
 (s.mode==='corridas'||s.mode==='veiculo'?field('Chance de terminar sem perder (%)','success',0,100)+field('Gasto médio com reparos e perdas','repair',0,10000000):'')+
 (s.mode==='veiculo'?field('Quanto o desmanche paga? • sujo','scrap',0,10000000):'');
 host.innerHTML='<h3>'+ (s.mode==='corridas'?'Quanto os cartões podem render?':titles[area])+'</h3><p class="ap-sub">Veja o resultado de uma tentativa e teste uma mudança.</p>'+
 (area==='roubados'?'<nav class="ap-navigation" aria-label="Processos econômicos">'+[['casas','Dinheiro do roubo'],['corridas','Cartões de corrida']].map(([k,v])=>'<button type="button" data-ev-mode="'+k+'" '+(s.mode===k?'aria-current="page"':'')+'>'+v+'</button>').join('')+'</nav>':'')+
 '<div class="ap-filter-row">'+choose+(s.mode!=='corridas'?field(s.mode==='acoes'?'Aumentar ou diminuir o prêmio (%)':'Aumentar ou diminuir o pagamento do NPC (%)','shift',-100,500):'')+'</div>'+
 (s.mode!=='corridas'?'<p class="ap-row-muted">Use 0 para manter, 20 para aumentar 20% ou -20 para reduzir 20%.</p>':'')+
 '<div data-ev-result aria-live="polite"></div><details class="ap-simple-details"><summary>Ajustar os dados da conta</summary><div class="ap-filter-row">'+advanced+'</div></details><p class="ap-row-muted">Esta é uma simulação. Para valer na cidade, a mudança precisa ser aplicada no sistema responsável.</p>';
 summarize();
 }
 function summarize(){
 let rows=[],note='',detail='';const factor=1+Number(s.shift)/100,wash=1-Number(s.tax)/100;
 const add=(label,a,b)=>rows.push([label,a,b]);
 if(s.mode==='casas'||s.mode==='veiculo'){
 const house=s.mode==='casas',unit=priceOf(house?'LOCKPICK ++':'LOCKPICK',getCatalog(),'pista').unit,cost=unit===null?null:unit/Number(s.life);
 const prices=makeLootPrices(market('CASAS',STOLEN_ITEMS_SNAPSHOT));
 const parts=house?houseSearchParts(LOOT_TABLES,Number(s.points),0):[{table:LOOT_TABLES.portamalas,count:Number(s.points),chance:1}];
 const e=invasionExpectation(parts,prices),chance=house?1:Number(s.success)/100;
 const base=(e.knownGrossDirty+(house?0:Number(s.scrap)))*chance,proposed=(e.directDirty+e.pricedDirty*factor+(house?0:Number(s.scrap)))*chance;
 add('Custo da ferramenta por tentativa',cost,cost);add('Venda ao NPC • média suja',e.pricedDirty*chance,e.pricedDirty*factor*chance);add('Receita imediata conhecida • suja',base,proposed);add('Lucro conhecido após lavagem',cost===null?null:base*wash-cost-(house?0:Number(s.repair)),cost===null?null:proposed*wash-cost-(house?0:Number(s.repair)));
 note='Custo = preço atual de pista ÷ usos estimados. '+(house?'Gazua ++: estimativa informada de 4 a 10 invasões. Cada local deste cenário é um armário; cofres e probabilidades detalhadas ficam na projeção abaixo.':'Gazua comum: estimativa informada de 2 a 3 usos. Uma abertura cobra a ferramenta uma vez, mesmo somando porta-malas e desmanche. Chance de conclusão aplica-se à recuperação de ambos; reparos são custo médio por tentativa. O loot é condicionado ao sorteio, pois a chance externa não foi informada.');
 detail='Receita parcial: carteiras, cartões e demais itens sem preço ficam fora do dinheiro imediato. Potenciais futuros não são somados ao lucro. Algemas e cordas duram 3 dias, conforme relato; sem valor de uso definido.';
 }else if(s.mode==='quebrados'){
 const items=market('ARMAS_QUEBRADAS',BROKEN_ITEMS_SNAPSHOT);
 const known=items.filter(x=>x.precoSujo!==''&&x.precoSujo!=null&&Number.isFinite(Number(x.precoSujo))),base=known.reduce((a,x)=>a+Number(x.precoSujo)*Number(s.volume),0);
 add('Pagamento para o volume futuro • sujo',base,base*factor);
 note='O volume informado é aplicado a cada item com preço conhecido. Os contadores acumulados não representam vendas futuras e não são recalculados como pagamentos históricos.';
 detail='<div class="ap-table-scroll"><table class="ap-management-table"><thead><tr><th>Item</th><th>Já comprado</th><th>Preço atual</th><th>Preço proposto</th><th>Diferença por unidade</th></tr></thead><tbody>'+known.map(x=>'<tr><td>'+esc(x.nome)+'</td><td>'+esc(x.quantidadeNpc??'Pendente')+'</td><td>'+money(Number(x.precoSujo))+'</td><td>'+money(Number(x.precoSujo)*factor)+'</td><td>'+money(Number(x.precoSujo)*(factor-1))+'</td></tr>').join('')+'</tbody></table></div>';
 }else if(s.mode==='acoes'){
 const a=getActions().find(x=>x.nome===s.action)||getActions()[0];
 if(a){const r=calculateAction(a,getCatalog(),{tax:Number(s.tax)/100}),p=calculateAction({...a,premio_min:Number(a.premio_min)*factor,premio_max:Number(a.premio_max)*factor},getCatalog(),{tax:Number(s.tax)/100});
 add('Investimento no kit',r.kit.total,p.kit.total);add('Recompensa mínima • suja',r.min,p.min);add('Recompensa máxima • suja',r.max,p.max);add('Lucro na vitória • prêmio mínimo',r.netMin,p.netMin);add('Lucro na vitória • prêmio máximo',r.netMax,p.netMax);add('Resultado na derrota',r.loss,p.loss);
 const avg=r.min===null||r.max===null?null:(r.min+r.max)/2,pavg=p.min===null||p.max===null?null:(p.min+p.max)/2;
 add('Resultado esperado • vitória em 40%',avg===null||r.kit.winCost===null||r.loss===null?null:.4*(avg*wash-r.kit.winCost)+.6*r.loss,pavg===null||p.kit.winCost===null||p.loss===null?null:.4*(pavg*wash-p.kit.winCost)+.6*p.loss);
 note='Equipe padrão da ação; preços de pista e reposição do planejador. A estimativa de 40% de vitória usa o ponto médio do prêmio e perda do kit completo na derrota. Ela informa o risco e não altera automaticamente a sugestão de prêmio.';
 }else note='Aguardando o carregamento das ações. As outras simulações continuam disponíveis.';
 }else{
 const count=Number(s.cards)*Number(s.runs),chance=Number(s.success)/100,repair=Number(s.repair)*count;
 add('Potencial bruto mínimo • sujo',count*13000,count*13000*chance);add('Potencial bruto máximo • sujo',count*26000,count*26000*chance);add('Retorno mínimo após lavagem e custos',count*13000*wash-repair,count*13000*chance*wash-repair);add('Retorno máximo após lavagem e custos',count*26000*wash-repair,count*26000*chance*wash-repair);
 note='Atual = concluir todas as corridas. Proposto = chance de conclusão informada. Pagamento de R$ 13 mil a R$ 26 mil sujos, cerca de 3 corridas por cartão. Custos adicionais são médios por tentativa; inclua reparos e perdas esperadas do veículo. Potencial futuro, separado da receita do roubo.';
 }
 const card=(label,value)=>'<div class="ap-kpi"><small>'+esc(label)+'</small><strong>'+esc(money(value))+'</strong></div>';
 let selected=[];
 if(s.mode==='casas'||s.mode==='veiculo')selected=[['Você gasta por roubo',rows[0]?.[1]],['Você recebe • sujo',rows[2]?.[1]],['Sobra após lavagem • valor conhecido',rows[3]?.[1]]];
 else if(s.mode==='acoes')selected=[['Você precisa para montar o kit',rows[0]?.[1]],['Recebe se vencer • mínimo sujo',rows[1]?.[1]],['Sobra se vencer • prêmio mínimo',rows[3]?.[1]]];
 else if(s.mode==='quebrados')selected=[['NPC paga hoje • volume informado',rows[0]?.[1]],['NPC pagaria com a mudança',rows[0]?.[2]]];
 else selected=[['Pode render no mínimo • sujo',rows[0]?.[2]],['Pode render no máximo • sujo',rows[1]?.[2]]];
 const impactRow=s.mode==='acoes'?rows[3]:s.mode==='quebrados'?rows[0]:s.mode==='corridas'?rows[2]:rows[3];
 const delta=impactRow&&Number.isFinite(impactRow[1])&&Number.isFinite(impactRow[2])?impactRow[2]-impactRow[1]:null;
 const impact=s.mode==='corridas'?'Cartão não é dinheiro recebido: depende de completar as corridas.':delta===null?'Faltam preços para terminar esta conta.':delta===0?'Sem mudança no resultado.':delta>0?'Com essa mudança, o resultado passa de '+money(impactRow[1])+' para '+money(impactRow[2])+' — '+money(delta)+' a mais.':'Com essa mudança, o resultado passa de '+money(impactRow[1])+' para '+money(impactRow[2])+' — '+money(-delta)+' a menos.';
 const basis=s.mode==='casas'?'Conta para '+s.points+' armários, com uma gazua durando '+s.life+' invasões. Só inclui dinheiro e itens com preço conhecido.':s.mode==='veiculo'?'Conta para '+s.points+' sorteio(s), com a gazua durando '+s.life+' usos. O desmanche só entra se você informar o pagamento.':s.mode==='quebrados'?'Exemplo com '+s.volume+' vendas futuras de cada item. Não altera o que já foi pago.':s.mode==='acoes'?'Lucro na vitória desconta a lavagem e o que precisa repor. Na derrota, o kit pode ser perdido.':'Cada cartão permite cerca de 3 corridas de R$ 13 mil a R$ 26 mil sujos.';
 host.querySelector('[data-ev-result]').innerHTML='<div class="ap-management-kpis ap-simple-kpis">'+selected.map(([l,v])=>card(l,v)).join('')+'</div><p class="ap-simple-answer">'+esc(impact)+'</p><p class="ap-row-muted">'+esc(basis)+'</p><details class="ap-simple-details"><summary>Ver a conta completa</summary><div class="ap-table-scroll"><table class="ap-management-table"><thead><tr><th>O que estamos calculando</th><th>Hoje</th><th>Com a mudança</th></tr></thead><tbody>'+rows.map(([l,a,b])=>'<tr><td>'+esc(l)+'</td><td>'+money(a)+'</td><td>'+money(b)+'</td></tr>').join('')+'</tbody></table></div><p>'+esc(note)+'</p>'+(detail.startsWith('<')?detail:'<p>'+esc(detail)+'</p>')+'</details>';

 }
 host.addEventListener('click',e=>{const b=e.target.closest('[data-ev-mode]');if(!b)return;s.mode=b.dataset.evMode;s.shift=0;s.life=s.mode==='veiculo'?3:6;s.points=s.mode==='veiculo'?1:15;render();});
 host.addEventListener('input',e=>{const key=e.target.dataset.ev;if(!key)return;if(key==='action')s[key]=e.target.value;else{if(e.target.value===''||!e.target.validity.valid)return;s[key]=Number(e.target.value);}summarize();});
 render();return {refresh:render,selectArea(next){
  const mode={acoes:'acoes',roubados:'casas',portamalas:'veiculo',quebrados:'quebrados'}[next];
  host.hidden=!mode;if(!mode)return;
  if(area!==next){area=next;s.mode=mode;s.shift=0;s.life=next==='portamalas'?3:6;s.points=next==='portamalas'?1:15;}
  const selector=next==='acoes'?'[data-ap-subpage="overview"]':next==='quebrados'?'[data-ap-subpage="npc"]':'[data-ap-subpage="loot"]';
  const panel=root.querySelector(selector);if(panel){const heading=panel.querySelector('.ap-heading');if(heading)heading.after(host);else panel.prepend(host);}render();
 }};
}
