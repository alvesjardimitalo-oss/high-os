/**
 * Planejador econômico High OS — cálculo puro.
 * Premiações atuais já incorporam buff/nerf histórico; nunca somar de novo.
 * Os valores são exclusivamente da economia fictícia de FiveM / High RP.
 */
export const ACOES_SOURCE = 'https://alvesjardimitalo-oss.github.io/high-mercado-negro/data/acoes-blipadas.json';
export const CATALOGO_SOURCE = 'https://alvesjardimitalo-oss.github.io/high-mercado-negro/data/catalogo.json';
export const PHOTO_ROOT = 'https://alvesjardimitalo-oss.github.io/high-mercado-negro/assets/itens/';
export const norm = text => String(text ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase();
const alias = Object.freeze({
 'ARMA PISTOLA':'PISTOLA T54',
 'ARMA SUB':'UZI',
 'ARMA FUZIL':'FAL',
 'MUNICAO PISTOLA (X100)':'PISTOLA 100X',
 'MUNICAO SUB (X200)':'SMG 200X',
 'MUNICAO FUZIL (X250)':'FUZIL 250X',
 'GAZUA ++':'LOCKPICK ++','GAZUA+':'LOCKPICK ++','GAZUA':'LOCKPICK'
});
export const DEFAULT_WASH = .3;
export const DEFAULT_AMMO_USE = .25;
export const categoryOf=(name,explicit)=>{
 if(['arma','municao','colete','acesso','consumivel'].includes(explicit))return explicit;
 const n=norm(name);
 if(n.startsWith('MUNICAO '))return 'municao';
 if(n.startsWith('COLETE'))return 'colete';
 if(n.startsWith('ARMA '))return 'arma';
 if(n.startsWith('PENDRIVE'))return 'acesso';
 return 'consumivel';
};
const clamp=(value,min,max,defaultValue)=>Math.max(min,Math.min(max,numeric(value)??defaultValue));
const cents=x=>Math.round(x*100)/100;
export function numeric(v){
 if(v==null||typeof v==='boolean'||String(v).trim()==='')return null;
 const n=Number(v);
 return Number.isFinite(n)?n:null;
}
export function getRules(action,location=null){
 const rules=location?.regras_confronto?.length?location.regras_confronto:action?.regras_confronto||[];
 return rules.map(r=>({invasores:numeric(r.invasores),policiais:numeric(r.policiais),refens:numeric(r.refens)}))
 .filter(r=>Number.isInteger(r.invasores)&&r.invasores>0).sort((a,b)=>a.invasores-b.invasores);
}
export const availableTeams=(action,location)=>[...new Set(getRules(action,location).map(r=>r.invasores))];
export const defaultTeam=(action,location)=>availableTeams(action,location).at(-1)??Math.max(1,...(action?.itens||[]).map(i=>Number(i.quantidade)||0));
export function priceOf(name,catalog,mode='pista'){
 const lookup=alias[norm(name)]||name;
 if(norm(name)==='ARMA BRANCA')
  return {name,unit:mode==='pista'?975:null,source:'Planilha VALORES AÇÃO BLIPADA • preço de pista',missing:mode!=='pista'};
 const item=(catalog?.itens||[]).find(x=>norm(x.item)===norm(lookup)&&x.status==='ativo')
 ||(catalog?.itens||[]).find(x=>norm(x.item)===norm(lookup));
 // Itens desativados não podem subsidiar propostas de alteração de prêmios.
 // Mostrar seu último preço como atual ocultaria um insumo indisponível.
 const listedInactive=!!item&&item.status!=='ativo';
 const unit=listedInactive?null:numeric(item?.[mode]);
 return {name:item?.item||lookup,unit,
  source:listedInactive?'Item inativo no Mercado Negro':item?'Mercado Negro':'Não encontrado no catálogo',
  missing:unit===null,listedInactive};
}
function qtyFor(item,team,mode){
 const official=Math.max(0,Number(item?.quantidade)||0);
 if(mode!=='por-jogador'||/^PENDRIVE/i.test(norm(item?.nome)))return official;
 return team;
}
export function kitFor(action,catalog,{team,priceMode='pista',kitMode='por-jogador',quantities={},prices={},priceShift=0,ammoUse=DEFAULT_AMMO_USE,accessConsumed=true}={}){
 const nPlayers=Number(team)||defaultTeam(action);
 const shift=clamp(priceShift,-.9,3,0);
 const ammunitionUsed=clamp(ammoUse,0,1,DEFAULT_AMMO_USE);
 const lines=(action?.itens||[]).map((item,i)=>{
  const q=numeric(quantities[i]);
  const qty=q===null?qtyFor(item,nPlayers,kitMode):Math.max(0,Math.floor(q));
  const p=priceOf(item.nome,catalog,priceMode);
  const override=numeric(prices[i]);
  const stored=numeric(item.preco_unitario);
  const baseUnit=override!==null?Math.max(0,override):stored!==null?Math.max(0,stored):p.unit;
  const unit=baseUnit===null?null:cents(baseUnit*(1+shift));
  const category=categoryOf(item.nome,item.categoria_item);
  const amount=unit===null?null:cents(qty*unit);
  // A munição é reposta em pacotes completos (x100, x200, x250).
  // É uma hipótese de compra; a taxa consumida pode ser ajustada.
  const replacementQty=category==='arma'||(category==='acesso'&&!accessConsumed)?0:category==='municao'?Math.min(qty,Math.ceil(qty*ammunitionUsed)):qty;
  const winCost=unit===null?null:cents(replacementQty*unit);
  return {index:i,name:item.nome,qty,officialQty:Number(item.quantidade)||0,
   category,unit,baseUnit,total:amount,missing:unit===null,
   source:override!==null?'Preço simulado':stored!==null?'Preço fixo do cadastro':p.source,
   reference:p.name,replacementQty,winCost,
   retainedValue:amount===null||winCost===null?null:cents(amount-winCost)};
 });
 const missing=lines.filter(i=>i.missing).map(i=>i.name);
 const total=missing.length?null:cents(lines.reduce((sum,l)=>sum+l.total,0));
 const winCost=missing.length?null:cents(lines.reduce((sum,l)=>sum+l.winCost,0));
 const official=numeric(action?.custo);
 const weapons=missing.length?null:cents(lines.filter(i=>i.category==='arma').reduce((s,l)=>s+l.total,0));
 const ammoReplacement=missing.length?null:cents(lines.filter(i=>i.category==='municao').reduce((s,l)=>s+l.winCost,0));
 const armors=missing.length?null:cents(lines.filter(i=>i.category==='colete').reduce((s,l)=>s+l.winCost,0));
 const access=missing.length?null:cents(lines.filter(i=>i.category==='acesso').reduce((s,l)=>s+l.winCost,0));
 const retained=total===null||winCost===null?null:cents(total-winCost);
 return {lines,missing,total,official,comparison:total===null||official===null?null:cents(total-official),
  // Capital para entrar na ação é diferente do gasto real após uma vitória.
  winCost,lossCost:total,retained,weapons,ammoReplacement,armors,access,
  priceShift:shift,ammoUse:ammunitionUsed,accessConsumed:!!accessConsumed,
  effectiveCost:winCost,
  baselineMismatch:kitMode==='oficial'&&priceMode==='pista'&&shift===0&&Object.keys(prices).length===0&&Object.keys(quantities).length===0&&total!==null&&official!==null&&Math.abs(total-official)>1};
}
export function calculateAction(action,catalog,opts={}){
 const location=opts.location||null;
 const allowed=availableTeams(action,location);
 const team=Number(opts.team)||defaultTeam(action,location);
 const rule=getRules(action,location).find(r=>r.invasores===team)||null;
 const teamValid=allowed.includes(team);
 const tax=clamp(opts.tax,0,.99,DEFAULT_WASH);
 const targetPerPlayer=Math.max(0,numeric(opts.targetPerPlayer)??20000);
 const targetROI=Math.max(0,numeric(opts.roi)??.25);
 const tolerance=Math.max(0,numeric(opts.tolerance)??.25);
 const kit=kitFor(action,catalog,{...opts,team});
 const cost=kit.winCost;
 const variableHouse=action?.tipo_acao==='casas'&&numeric(action?.premio_min)===0&&numeric(action?.premio_max)===0;
 const min=variableHouse?null:numeric(action?.premio_min),max=variableHouse?null:numeric(action?.premio_max);
 const netMin=min===null||cost===null?null:cents(min*(1-tax)-cost);
 const netMax=max===null||cost===null?null:cents(max*(1-tax)-cost);
 // Na derrota: sem prêmio, perde o kit completo. Na vitória: repõe
 // consumíveis e guarda armas e munições não gastas.
 const loss=kit.total===null?null:-kit.total;
 const firstRunNetMin=min===null||kit.total===null?null:cents(min*(1-tax)-kit.total);
 const firstRunNetMax=max===null||kit.total===null?null:cents(max*(1-tax)-kit.total);
 const perPlayer=netMin===null?null:cents(netMin/team);
 // ROI alvo usa o capital que precisa estar em risco, não apenas as reposições.
 const targetProfit=kit.total===null?null:Math.max(targetPerPlayer*team,kit.total*targetROI); // Indicador legada; não dispara buff
 const payoutNeeded=targetProfit===null||cost===null?null:Math.ceil((cost+targetProfit)/(1-tax));
 const currentSpread=min>0&&max!==null?Math.max(0,max/min-1):.15;
 const payoutMax=payoutNeeded===null?null:Math.ceil(payoutNeeded*(1+currentSpread));
 const delta=payoutNeeded===null||min===null?null:payoutNeeded-min;
 const status=action?.status==='inativo'?'INATIVA':!teamValid?'EQUIPE INVÁLIDA':
   kit.missing.length?'INSUMO SEM PREÇO':kit.baselineMismatch?'REVISAR CUSTO':
   netMin===null?'SEM PREMIAÇÃO':
   netMin<0?'PREJUÍZO NA VITÓRIA':'MANTER';
 const proposedNet=payoutNeeded===null||cost===null?null:cents(payoutNeeded*(1-tax)-cost);
 return {name:action?.nome,status,team,teamValid,allowed,rule,kit,tax,targetROI,targetPerPlayer,
  targetProfit,min,max,netMin,netMax,loss,firstRunNetMin,firstRunNetMax,perPlayer,
  roi:netMin===null||!kit.total?null:netMin/kit.total,
  payoutNeeded,payoutMax,delta,proposedNet,proposedPerPlayer:proposedNet===null?null:cents(proposedNet/team),
  buffIncluded:Number(action?.buff)||0,nerfIncluded:Number(action?.nerf)||0,
  payoutAdjustable:status==='BUFF'||status==='NERF'||status==='MANTER'};
}
export const photoUrl=(image)=>{
 if(!/^[\w.\-]+\.(?:webp|png|jpe?g)$/i.test(String(image||'')))return '';
 return PHOTO_ROOT+encodeURIComponent(image);
};
