/** High OS Dev • inteligência auditável das ações FiveM.
 * O catálogo só publica UM prêmio por ação: escala por equipe é HIPÓTESE,
 * jamais um dado oficial. O risco requer estimativa explícita do gestor.
 */
import {calculateAction,defaultTeam,availableTeams,norm,numeric} from './acoes-core.js?v=5';
const round=v=>Math.round(v*100)/100;
export const DEFAULT_MANAGER_WIN_CHANCE=.4;
export function recommendedMaximum(currentMin,currentMax,recommendedMin){
 const min=numeric(currentMin),max=numeric(currentMax),next=numeric(recommendedMin);
 return min===null||max===null||next===null||min<=0||max<min||next<0?null:
  Math.ceil(next*(max/min));
}
const clamp=(v,min,max,fallback)=>{const n=numeric(v);return Math.max(min,Math.min(max,n===null?fallback:n));};
export function makePriceReference(catalog,createdAt=new Date().toISOString()){
 return {version:1,createdAt,items:(catalog?.itens||[]).map(i=>({
  item:String(i.item||''),status:String(i.status||''),
  pista:numeric(i.pista),parceria:numeric(i.parceria)
 })).filter(i=>i.item).sort((a,b)=>norm(a.item).localeCompare(norm(b.item)))};
}
export function referenceCatalog(reference){
 return {itens:Array.isArray(reference?.items)?reference.items:[]};
}
export function assessPriceChanges(actions,catalog,reference,{tax=.3,ammoUse=.25,accessConsumed=true}={}){
 if(!Array.isArray(reference?.items)||!reference.items.length)return {available:false,changes:[],changed:0,up:0,down:0};
 const previous=referenceCatalog(reference),changes=[];
 for(const a of actions||[]){
  if(a.status==='inativo')continue;
  const settings={team:defaultTeam(a),kitMode:'oficial',priceMode:'pista',tax,ammoUse,accessConsumed};
  const past=calculateAction(a,previous,settings),current=calculateAction(a,catalog,settings);
  if(!past.teamValid||!current.teamValid||past.kit.total===null||current.kit.total===null)continue;
  const difference=round(current.kit.total-past.kit.total);
  if(Math.abs(difference)<.01)continue;
  const detail=current.kit.lines.map((item,index)=>{
   const former=past.kit.lines[index];
   return {name:item.name,old:former.unit,new:item.unit,
    delta:item.unit===null||former.unit===null?null:round(item.unit-former.unit)};
  }).filter(item=>item.delta!==null&&Math.abs(item.delta)>.01);
  changes.push({name:a.nome,oldCost:past.kit.total,newCost:current.kit.total,difference,
   percent:past.kit.total>0?difference/past.kit.total:null,
   oldProfitPerMember:past.perPlayer,newProfitPerMember:current.perPlayer,
   deltaPerMember:past.perPlayer===null||current.perPlayer===null?null:round(current.perPlayer-past.perPlayer),
   team:settings.team,items:detail});
 }
 changes.sort((a,b)=>Math.abs(b.difference)-Math.abs(a.difference)||a.name.localeCompare(b.name));
 return {available:true,referenceDate:reference.createdAt,changes,changed:changes.length,
  up:changes.filter(x=>x.difference>0).length,down:changes.filter(x=>x.difference<0).length};
}
/** Prêmios oficiais são a referência APROVADA. Não existe preço-alvo por
 * probabilidade de vitória, quantidade de policiais, ROI ou lucro presumido.
 * Uma sugestão nasce EXCLUSIVAMENTE de uma variação no custo do kit.
 * O cooldown e o tempo são exibidos, mas nunca multiplicam recompensas.
 */
export function analyzeDecision(action,catalog,{
 team=defaultTeam(action),teamPayout='publicado',referenceTeam=defaultTeam(action),
 reference=null,tax=.3,...kitOptions
}={}){
 const rawMin=numeric(action?.premio_min),rawMax=numeric(action?.premio_max);
 const allowed=availableTeams(action);
 const teamN=Math.floor(Number(team))||defaultTeam(action);
 const refTeam=Number(referenceTeam)||defaultTeam(action);
 const modeled=teamPayout==='proporcional'&&refTeam>0&&allowed.includes(teamN);
 const multiplier=modeled?teamN/refTeam:1;
 const working={...action,
  premio_min:rawMin===null?null:round(rawMin*multiplier),
  premio_max:rawMax===null?null:round(rawMax*multiplier)};
 const calcOpts={...kitOptions,team:teamN,kitMode:kitOptions.kitMode||'oficial',
  priceMode:kitOptions.priceMode||'pista',tax};
 const p=calculateAction(working,catalog,calcOpts);
 const valid=p.teamValid&&action?.status!=='inativo'&&!p.kit.missing.length&&
  p.kit.total!==null&&p.min!==null&&p.min>0&&p.max!==null&&p.max>=p.min;
 const isSimulation=(Number.isFinite(Number(calcOpts.priceShift))&&Number(calcOpts.priceShift)!==0)||
  Object.keys(calcOpts.prices||{}).length>0;
 const oldCatalog=isSimulation?catalog:Array.isArray(reference?.items)&&reference.items.length?referenceCatalog(reference):null;
 const previous=oldCatalog?calculateAction(working,oldCatalog,{
  ...calcOpts,priceShift:0,prices:{}
 }):null;
 const hasComparison=!!previous&&!previous.kit.missing.length&&
  previous.kit.total!==null&&previous.kit.winCost!==null&&p.kit.winCost!==null;
 const deltaCapital=hasComparison?round(p.kit.total-previous.kit.total):null;
 const deltaReplacement=hasComparison?round(p.kit.winCost-previous.kit.winCost):null;
 // Somente a despesa de insumos usados/reposição justifica propor ajuste de
 // prêmio. Alta isolada do preço da arma eleva capital, NÃO custo da vitória.
 const deltaNet=deltaReplacement===null?null:Math.ceil(deltaReplacement/(1-p.tax));
 const significant=deltaNet!==null&&Math.abs(deltaNet)>1;
 const proposed=valid&&significant?Math.max(1,Math.round(p.min+deltaNet)):p.min;
 const direction=!valid?'PENDENTE':!significant?'MANTER':
  deltaNet>0?'CONSIDERAR BUFF':'CONSIDERAR REDUÇÃO';
 const recommendedMin=valid?proposed:null;
 const recommendedMax=valid?Math.max(recommendedMin,Math.round(p.max+(recommendedMin-p.min))):null; // Compensar mesma despesa nas duas pontas, sem inflar amplitude.
 const recommendedDelta=recommendedMin===null?null:round(recommendedMin-p.min);
 const recommendedPercent=recommendedDelta===null||p.min<=0?null:recommendedDelta/p.min;
 const recommendedProfit=recommendedMin===null||p.kit.winCost===null?null:
  round(recommendedMin*(1-p.tax)-p.kit.winCost);
 const recommendedPerMember=recommendedProfit===null?null:round(recommendedProfit/teamN);
 const remarks=[];
 if(!hasComparison)remarks.push('Sem referência de preços salva, preservar os prêmios aprovados. Grave uma referência após o balanceamento para medir alterações futuras.');
 if(hasComparison&&!significant&&deltaCapital!==0)remarks.push('A variação do capital inicial não afetou os insumos consumidos/repostos; não implica buff ou redução.');
 if(significant)remarks.push('Comparação de custo de reposição: '+(deltaReplacement>=0?'+':'')+deltaReplacement.toLocaleString('pt-BR')+
  ' limpos. Variação convertida para dinheiro sujo após '+Math.round(p.tax*100)+'% de lavagem. A gestão decide se aplica.');
 if(isSimulation)remarks.push('Simulação de preço hipotética: não alterar prêmio oficial até confirmar os preços reais.');
 if(modeled)remarks.push('Premiação proporcional à equipe é simulação não oficial.');
 remarks.push('Invasores, policiais, requisitos e cooldown são restrições operacionais. Chance de vitória NÃO é usada para calcular a premiação.');
 if(!valid)remarks.push('Dados incompletos: não sugerir valores.');
 return {calc:p,team:teamN,modeled,multiplier,officialMin:rawMin,officialMax:rawMax,
  winChance:null,wait:null,duration:null,totalMinutes:null,hourly:null,expected:null,
  breakEven:null,target:null,suggested:recommendedMin,delta:recommendedDelta,direction,remarks,valid,
  recommendedMin,recommendedMax,recommendedDelta,recommendedPercent,recommendedProfit,
  recommendedPerMember,recommendedExpected:null,riskBreakEvenMin:null,payoutForWinTarget:null,
  winTargetGap:null,riskGap:null,maxBuffStep:null,maxNerfStep:null,riskNeedsReview:false,
  hasComparison,referenceDate:reference?.createdAt||null,isSimulation,deltaCapital,deltaReplacement,
  eligibleForSheet:valid&&!modeled&&!kitOptions.priceShift&&
   !Object.keys(kitOptions.quantities||{}).length&&!Object.keys(kitOptions.prices||{}).length};
}
export function applySheetPrizeOverrides(actions,prices){
 const map=new Map((prices||[]).map(p=>[norm(p.name),p]));
 return (actions||[]).map(a=>{
  const p=map.get(norm(a.nome));
  if(!p||!Number.isFinite(p.min)||!Number.isFinite(p.max))return a;
  return {...a,premio_min:p.min,premio_max:p.max,
   buff:Number.isFinite(p.buff)?p.buff:a.buff,
   nerf:Number.isFinite(p.nerf)?p.nerf:a.nerf,
   premioFonte:'Google Sheets'};
 });
}
