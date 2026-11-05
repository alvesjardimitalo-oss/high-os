/** Economia Ilegal • console de balanceamento compacto. Simulacoes nao persistem premiacoes. */
import {calculateAction,defaultTeam,priceOf} from './acoes-core.js?v=5';
import {analyzeDecision} from './acoes-inteligencia.js?v=6';
import {LOOT_TABLES} from './roubos-loot-data.js?v=1';
import {makeLootPrices,houseSearchParts,invasionExpectation,lootKey} from './roubos-loot-core.js?v=3';
import {STOLEN_ITEMS_SNAPSHOT} from './economia-npc-seed.js?v=2';

export function createSimpleEconomyPanel({root,getActions,getCatalog,getRegistry,getReference,onAreaChange,onOpenAction,onOpenHouse,onOpenNpc,onNewAction}){
 const nav=root.querySelector('.ap-economy-navigation');
 if(!nav)return {selectArea(){},refresh(){}};
 const panel=document.createElement('div');
 panel.className='ap-simple-control';
 panel.id='apSimpleControl';
 nav.after(panel);

 const escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const money=x=>Number.isFinite(x)?new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(x):'A confirmar';
 const integer=x=>new Intl.NumberFormat('pt-BR').format(x);
 const num=x=>x===''||x===null||x===undefined?null:Number.isFinite(Number(x))?Number(x):null;
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const state={area:'atm',activity:'atm:preset-c4',delta:0,tax:30,item:'',durability:6,locations:15,safes:0,view:null};
 const examples=[
  {id:'preset-c4',label:'ATM — C4',type:'atm',min:28000,max:34000,explosive:'C4'},
  {id:'preset-c4pp',label:'ATM — C4++',type:'atm',min:40000,max:48000,explosive:'C4 ++'},
  {id:'preset-registradora',label:'Caixinha / registradora',type:'registradora',min:22500,max:26250,explosive:''}
 ];
 const areaFor=id=>id.startsWith('casas:')?'roubados':id.startsWith('atm:')?'atm':id.startsWith('registradora:')?'registradora':'acoes';
 const availableActions=()=>getActions()||[];
 function activities(){
  const groups=[
   {label:'ATM',values:examples.filter(x=>x.type==='atm').map(x=>({id:'atm:'+x.id,label:x.label}))},
   {label:'Registradora',values:examples.filter(x=>x.type==='registradora').map(x=>({id:'registradora:'+x.id,label:x.label}))},
   {label:'Casas',values:[{id:'casas:loot',label:'Roubo de casas • itens vendidos ao NPC'}]},
   {label:'Ações blipadas',values:[]}
  ];
  availableActions().filter(a=>a.status!=='inativo').forEach((a,i)=>{
   const group=a.tipo_acao==='atm'?groups[0]:a.tipo_acao==='registradora'?groups[1]:a.tipo_acao==='casas'?groups[2]:groups[3];
   if(a.tipo_acao==='casas')return;
   const prefix=a.tipo_acao==='atm'?'atm':a.tipo_acao==='registradora'?'registradora':'blipada';
   group.values.push({id:prefix+':'+encodeURIComponent(a.nome),label:a.nome+(prefix==='blipada'?'':' • cadastrado')});
  });
  return groups;
 }
 function lookup(){
  const all=availableActions(),p=state.activity.split(':')[0],rest=state.activity.slice(p.length+1);
  if(p==='casas')return {type:'casas'};
  const example=examples.find(x=>x.id===rest);
  if(example)return {type:example.type,example};
  const a=all.find(x=>x.nome===decodeURIComponent(rest));
  return a?{type:p,action:a}:null;
 }
 function defaultActivity(area){
  if(area==='roubados')return 'casas:loot';
  if(area==='atm')return 'atm:preset-c4';
  if(area==='registradora')return 'registradora:preset-registradora';
  const first=availableActions().find(a=>a.status!=='inativo'&&!['atm','registradora','casas'].includes(a.tipo_acao));
  return first?'blipada:'+encodeURIComponent(first.nome):'blipada:none';
 }
 function houseItems(){
  const v=getRegistry()?.npcMarkets?.CASAS;
  return v?.updatedAt||v?.items?.length?v.items:STOLEN_ITEMS_SNAPSHOT;
 }
 function chosenHouseItem(){
  const items=houseItems().filter(x=>num(x.precoSujo)!==null&&num(x.precoSujo)>=0);
  const selected=items.find(x=>(x.codigo||x.nome)===state.item)||items[0];
  if(selected)state.item=selected.codigo||selected.nome;
  return {items,selected};
 }
 function fieldSelect(name,options,value){
  return '<label class="ap-eco-field"><span>'+escape(name)+'</span><select data-eco-field="'+escape(value)+'">'+options.map(x=>
   '<option value="'+escape(x[0])+'"'+(String(x[0])===String(state[value])?' selected':'')+'>'+escape(x[1])+'</option>').join('')+'</select></label>';
 }
 function otherSettings(){
  if(state.area!=='roubados')return '<details class="ap-eco-advanced"><summary>Configuração do cálculo</summary><label>Taxa de lavagem (%) <input type="number" data-eco-field="tax" value="'+state.tax+'" min="0" max="99" step="1"></label></details>';
  const {items}=chosenHouseItem();
  return '<div class="ap-eco-house-item">'+fieldSelect('Item vendido ao NPC',items.map(x=>[x.codigo||x.nome,x.nome+' • '+money(Number(x.precoSujo))]),'item')+'</div>'+
   '<details class="ap-eco-advanced"><summary>Configurar gazua, cômodos e lavagem</summary><div class="ap-eco-advanced-grid">'+[
    ['durability','Invasões por gazua ++',1,100],
    ['locations','Locais vasculhados',1,100],
    ['safes','Quantidade de cofres',0,100],
    ['tax','Taxa de lavagem (%)',0,99]
   ].map(([key,label,min,max])=>'<label>'+label+'<input type="number" data-eco-field="'+key+'" min="'+min+'" max="'+max+'" value="'+state[key]+'"></label>').join('')+'</div></details>';
 }
 function calc(){
  const record=lookup(),tax=state.tax/100;
  if(!record)return {missing:'Nenhuma atividade cadastrada para simular.'};
  if(record.type==='casas'){
   const {selected}=chosenHouseItem();
   if(!selected)return {missing:'Cadastre itens e preços no NPC de itens roubados.'};
   const prices=makeLootPrices(houseItems()),proposed=new Map(prices);
   const currentPrice=Number(selected.precoSujo),nextPrice=Math.max(0,currentPrice+state.delta);
   if(selected.codigo)proposed.set(lootKey(selected.codigo),nextPrice);
   if(selected.nome)proposed.set(lootKey(selected.nome),nextPrice);
   const unit=priceOf('LOCKPICK ++',getCatalog(),'pista').unit;
   const cost=unit===null?null:unit/state.durability;
   try{
    const parts=houseSearchParts(LOOT_TABLES,state.locations,state.safes);
    const base=invasionExpectation(parts,prices,{lockpickUnit:cost,tax});
    const next=invasionExpectation(parts,proposed,{lockpickUnit:cost,tax});
    return {type:'casas',name:'Roubo de casas',current:base.knownGrossDirty,after:next.knownGrossDirty,
     profitCurrent:base.knownProfit,profitAfter:next.knownProfit,
     cost,priceCurrent:currentPrice,priceAfter:nextPrice,units:Number(selected.quantidadeNpc),
     unitsKnown:num(selected.quantidadeNpc)!==null,allPriced:base.allPriced&&next.allPriced,
     selectedName:selected.nome,explanation:'Valores médios de loot conhecido, não um pagamento fixo por residência.'};
   }catch(e){return {missing:String(e?.message||e)};}
  }
  let min,max,cost,loss=null,initial=null,action=null,source='';
  if(record.action){
   action=record.action;
   const r=calculateAction(action,getCatalog(),{team:defaultTeam(action),kitMode:'oficial',priceMode:'pista',tax});
   min=r.min;max=r.max;cost=r.kit.winCost;loss=r.loss;initial=r.kit.total;
   source='Cadastro da atividade e Mercado Negro';
  }else{
   const p=record.example;min=p.min;max=p.max;
   cost=p.explosive?priceOf(p.explosive,getCatalog(),'pista').unit:0;
   source=p.type==='registradora'?'Exemplo de referência • custo obrigatório não confirmado (R$ 0 apenas nesta simulação)':'Exemplo de referência • não confirmado no Suricato';
  }
  if(!Number.isFinite(min)||!Number.isFinite(max))return {missing:'Faltam valores mínimo e máximo cadastrados.'};
  const proposedMin=Math.max(1,min+state.delta),proposedMax=Math.max(proposedMin,max+state.delta);
  const profit=x=>cost===null?null:x*(1-tax)-cost;
  let recommendation=null;
  if(action){
   const res=analyzeDecision(action,getCatalog(),{team:defaultTeam(action),kitMode:'oficial',priceMode:'pista',tax,reference:getReference?.()});
   if(res.valid)recommendation=res;
  }
  return {type:record.type,name:action?.nome||record.example?.label||'Ação',source,action,
   min,max,proposedMin,proposedMax,cost,loss,initial,
   profitMin:profit(min),profitMax:profit(max),profitProposedMin:profit(proposedMin),profitProposedMax:profit(proposedMax),recommendation};
 }
 function resultCards(d){
  if(d.missing)return '<p class="ap-hint">'+escape(d.missing)+'</p>';
  if(d.type==='casas'){
   return '<div class="ap-eco-compare"><div class="ap-eco-compare-card"><span>Valores atuais</span><strong>'+money(d.current)+'</strong><small>Lucro médio conhecido: '+money(d.profitCurrent)+'</small></div>'+
    '<div class="ap-eco-compare-card"><span>Valores simulados</span><strong>'+money(d.after)+'</strong><small>Lucro médio conhecido: '+money(d.profitAfter)+'</small></div></div>'+
    '<p class="ap-eco-context">Item: '+escape(d.selectedName)+' • Preço atual '+money(d.priceCurrent)+' → '+money(d.priceAfter)+' • Gazua por casa '+money(d.cost)+
    (d.unitsKnown?' • Itens comprados pelo NPC: '+integer(d.units):'')+'</p>'+
    (!d.allPriced?'<p class="ap-hint">Existem itens sem preço cadastrado. Este é o lucro parcial conhecido.</p>':'');
  }
  const pair=(a,b)=>money(a)+' – '+money(b);
  return '<div class="ap-eco-compare"><div class="ap-eco-compare-card"><span>Valores atuais</span><strong>'+pair(d.min,d.max)+'</strong><small>Lucro: '+pair(d.profitMin,d.profitMax)+'</small></div>'+
   '<div class="ap-eco-compare-card"><span>Valores simulados</span><strong>'+pair(d.proposedMin,d.proposedMax)+'</strong><small>Lucro: '+pair(d.profitProposedMin,d.profitProposedMax)+'</small></div></div>'+
   '<p class="ap-eco-context">Custo '+(d.type==='blipada'?'de reposição na vitória':'da tentativa')+': '+money(d.cost)+
   (d.initial===null?'':' • Capital para iniciar: '+money(d.initial))+
   (d.loss===null?'':' • Prejuízo na derrota: '+money(d.loss))+
   ' • '+escape(d.source)+'.</p>'+
   (d.recommendation?'<p class="ap-eco-context"><b>Recomendação High OS:</b> '+money(d.recommendation.recommendedMin)+' a '+money(d.recommendation.recommendedMax)+
    ' sujos ('+escape(d.recommendation.direction)+')'+(!d.recommendation.hasComparison?' • sem referência de custo alterado, manter valores atuais':'')+'.</p>':'');
 }
 function caption(d){
  return d.type==='casas'?'A régua altera o preço pago pelo NPC ao item selecionado.':
   'A régua altera igualmente o pagamento mínimo e o máximo, em dinheiro sujo.';
 }
 function adjustText(){
  return (state.delta>0?'+':'')+money(state.delta);
 }
 function progress(){
  return ((state.delta+10000)/20000*100).toFixed(2)+'%';
 }
 function render(){
  const groups=activities(),opts=groups.map(g=>'<optgroup label="'+escape(g.label)+'">'+g.values.map(a=>
   '<option value="'+escape(a.id)+'"'+(a.id===state.activity?' selected':'')+'>'+escape(a.label)+'</option>').join('')+'</optgroup>').join('');
  const d=calc();
  state.view=d;
  panel.hidden=!['roubados','atm','registradora','acoes'].includes(state.area);
  if(panel.hidden)return;
  panel.innerHTML='<div class="ap-eco-kicker">CONTROLE DE BUFF E NERF</div>'+
   '<label class="ap-eco-select"><span>Atividade para simular</span><select data-eco-field="activity">'+opts+'</select></label>'+
   otherSettings()+
   '<div class="ap-eco-slider-header"><label for="apEcoSlider">Ajuste do pagamento (dinheiro sujo)</label>'+
   '<strong id="apEcoAmount" class="'+(state.delta<0?'is-nerf':state.delta>0?'is-buff':'')+'">'+escape(adjustText())+'</strong></div>'+
   '<input id="apEcoSlider" class="ap-eco-slider" type="range" min="-10000" max="10000" step="500" value="'+state.delta+
   '" style="--eco-progress:'+progress()+'" aria-label="Régua de buff e nerf">'+
   '<div class="ap-eco-range-labels"><span>Nerf −R$ 10 mil</span><span>Buff +R$ 10 mil</span></div>'+
   '<div id="apEcoResults" aria-live="polite">'+resultCards(d)+'</div>'+
   '<div class="ap-eco-footer"><span>Simulação ilustrativa; não altera o servidor.</span>'+
   '<button type="button" class="ap-eco-copy" data-eco-open="copy"'+(d.missing?' disabled':'')+'>'+
   '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>Copiar ajuste</button></div>'+
   '<p class="ap-eco-info">'+escape(caption(d))+'</p>'+
   '<div class="ap-eco-secondary">'+(d.type==='casas'?
     '<button type="button" class="ap-button" data-eco-open="npc">Editar preços do NPC</button>'+
     '<button type="button" class="ap-button" data-eco-open="house">Consultar loot da casa</button>':
     '<button type="button" class="ap-button" data-eco-open="'+(d.action?'action':'new')+'">'+(d.action?'Ver perfil e proposta':'Cadastrar valores oficiais')+'</button>'+
     (d.type==='blipada'?'<button type="button" class="ap-button" data-eco-open="ranking">Rankings e alertas</button>':''))+
   '</div>';
 }
 function updateSlider(){
  const label=panel.querySelector('#apEcoAmount'),slider=panel.querySelector('#apEcoSlider');
  if(label){label.textContent=adjustText();label.className=state.delta<0?'is-nerf':state.delta>0?'is-buff':'';}
  if(slider){slider.value=state.delta;slider.style.setProperty('--eco-progress',progress());}
  const d=calc();state.view=d;
  const target=panel.querySelector('#apEcoResults');if(target)target.innerHTML=resultCards(d);
  const copy=panel.querySelector('[data-eco-open="copy"]');if(copy)copy.disabled=!!d.missing;
 }
 function chooseActivity(next){
  if(!next)return;
  state.activity=next;state.delta=0;
  const area=areaFor(next);
  state.area=area;
  onAreaChange?.(area);
  render();
 }
 function changeField(key,value){
  if(key==='activity'){chooseActivity(value);return;}
  if(key==='item'){state.item=value;state.delta=0;render();return;}
  if(!['tax','durability','locations','safes'].includes(key))return;
  const max=key==='tax'?99:100,min=key==='safes'?0:1;
  const n=Number(value);if(!Number.isFinite(n)||value==='')return;
  state[key]=clamp(Math.floor(n),min,max);
  if(state.safes>state.locations)state.safes=state.locations;
  render();
 }
 function copyText(d){
  const lines=['HIGH OS DEV • SIMULAÇÃO DE BUFF / NERF','Atividade: '+d.name,
   'Alteração em dinheiro sujo: '+adjustText()];
  if(d.type==='casas')lines.push('Item do NPC: '+d.selectedName,
   'Preço unitário atual: '+money(d.priceCurrent),'Preço unitário simulado: '+money(d.priceAfter),
   'Receita média atual: '+money(d.current),'Receita média simulada: '+money(d.after),
   'Lucro médio conhecido atual: '+money(d.profitCurrent),'Lucro médio conhecido simulado: '+money(d.profitAfter));
  else lines.push('Pagamento atual: '+money(d.min)+' a '+money(d.max),
   'Pagamento simulado: '+money(d.proposedMin)+' a '+money(d.proposedMax),
   'Lucro atual: '+money(d.profitMin)+' a '+money(d.profitMax),
   'Lucro simulado: '+money(d.profitProposedMin)+' a '+money(d.profitProposedMax));
  lines.push('Somente simulação. Não altera o servidor.');
  return lines.join('\n');
 }
 panel.addEventListener('input',ev=>{
  const input=ev.target;
  if(input.id==='apEcoSlider'){state.delta=clamp(Number(input.value)||0,-10000,10000);updateSlider();return;}
  const key=input.dataset.ecoField;if(!key||input.tagName==='SELECT')return;
  if(input.value!==''&&input.validity.valid)changeField(key,input.value);
 });
 panel.addEventListener('change',ev=>{
  const input=ev.target,key=input.dataset.ecoField;
  if(key==='activity'||key==='item')changeField(key,input.value);
  else if(key)changeField(key,input.value);
 });
 panel.addEventListener('click',async ev=>{
  const btn=ev.target.closest('[data-eco-open]');if(!btn)return;
  const kind=btn.dataset.ecoOpen,d=state.view;
  if(kind==='copy'&&!d?.missing){
   try{await navigator.clipboard.writeText(copyText(d));btn.textContent='Copiado!';}
   catch(e){btn.textContent='Não foi possível copiar';}
   return;
  }
  if(kind==='npc')onOpenNpc?.();
  if(kind==='house')onOpenHouse?.();
  if(kind==='new')onNewAction?.(state.area);
  if(kind==='ranking')root.querySelector('[data-ap-nav="ranking"]')?.click();
  if(kind==='action'&&d?.action)onOpenAction?.(d.action.nome,state.delta?{min:d.proposedMin,max:d.proposedMax,adjusted:true}:null);
 });
 return {selectArea(area){
  if(area!==state.area){state.area=area;state.activity=defaultActivity(area);state.delta=0;}
  render();
 },refresh:render};
}
