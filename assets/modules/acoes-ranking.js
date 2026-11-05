/**
 * Ranking comparável das ações blipadas (economia fictícia High RP).
 * Sempre usa preço publicado de pista, quantidades oficiais do cadastro
 * e maior equipe permitida — nunca os ajustes temporários de uma simulação.
 *
 * São cenários condicionais à VITÓRIA. Não representam retorno esperado
 * nem incluem tempo, risco de derrota ou chance de vitória não observada.
 */
import {calculateAction,defaultTeam} from './acoes-core.js?v=5';

export const RANKING_MODES=Object.freeze([
 {id:'lucro-total',title:'Maiores lucros',label:'Lucro mínimo total ao vencer',field:'netMin',desc:true,unit:'money'},
 {id:'lucro-membro',title:'Lucro por membro',label:'Lucro mínimo por invasor',field:'perPlayer',desc:true,unit:'money'},
 {id:'rentabilidade',title:'Mais rentáveis',label:'Lucro mínimo / capital investido',field:'roi',desc:true,unit:'percent'},
 {id:'investimento',title:'Maiores investimentos',label:'Capital necessário para entrar',field:'capital',desc:true,unit:'money'},
 {id:'menos-rentaveis',title:'Menos rentáveis',label:'Menor lucro / capital investido',field:'roi',desc:false,unit:'percent'},
 {id:'menor-lucro',title:'Menores lucros',label:'Menor lucro mínimo ao vencer',field:'netMin',desc:false,unit:'money'},
 {id:'primeira-vitoria',title:'Primeira vitória',label:'Saldo em caixa na 1ª vitória após comprar o kit',field:'firstRunNetMin',desc:true,unit:'money'}
]);

export function rankingMetrics(action,catalog,{tax=.3,ammoUse=.25,accessConsumed=true}={}){
 const team=defaultTeam(action);
 const p=calculateAction(action,catalog,{team,kitMode:'oficial',priceMode:'pista',
  priceShift:0,quantities:{},prices:{},tax,ammoUse,accessConsumed});
 const valid=action?.status!=='inativo'&&p.teamValid&&p.kit.missing.length===0&&
  Number.isFinite(p.min)&&Number.isFinite(p.max)&&
  Number.isFinite(p.kit.total)&&p.kit.total>0&&
  Number.isFinite(p.netMin)&&Number.isFinite(p.perPlayer)&&Number.isFinite(p.roi);
 return {
  action,calc:p,valid,
  reason:action?.status==='inativo'?'inativa':!p.teamValid?'equipe sem regra válida':
   p.kit.missing.length?'insumo sem preço: '+p.kit.missing.join(', '):
   !Number.isFinite(p.min)||!Number.isFinite(p.max)?'premiação ausente':
   !Number.isFinite(p.kit.total)||p.kit.total<=0?'capital indisponível':'dados incompletos',
  fields:{netMin:p.netMin,perPlayer:p.perPlayer,roi:p.roi,capital:p.kit.total,firstRunNetMin:p.firstRunNetMin}
 };
}
export function buildActionRankings(actions,catalog,options={}){
 const all=(Array.isArray(actions)?actions:[]).map(a=>rankingMetrics(a,catalog,options));
 const included=all.filter(a=>a.valid);
 const excluded=all.filter(a=>!a.valid);
 const rankings=Object.fromEntries(RANKING_MODES.map(mode=>{
  const sorted=[...included].sort((a,b)=>{
   const difference=(a.fields[mode.field]-b.fields[mode.field])*(mode.desc?-1:1);
   return difference||a.action.nome.localeCompare(b.action.nome,'pt-BR');
  });
  return [mode.id,sorted.map((entry,i)=>({...entry,position:i+1,value:entry.fields[mode.field]}))];
 }));
 return {included,excluded,total:all.length,rankings};
}
