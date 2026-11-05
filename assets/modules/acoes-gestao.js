/**
 * HIGH OS • Centro de Gestão das Ações Blipadas.
 * Indicadores de cenário, não dados observados de vitórias no RP.
 * Nenhuma função efetua gravação, aprova buffs/nerfs ou altera premiações.
 */
import {calculateAction,defaultTeam,norm,numeric} from './acoes-core.js?v=5';
import {assessPriceChanges} from './acoes-inteligencia.js?v=6';

const round=v=>Math.round(v*100)/100;
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const clamp=(value,min,max,fallback)=>{
 const n=numeric(value);return Math.max(min,Math.min(max,n===null?fallback:n));
};
const byName=(a,b)=>a.nome.localeCompare(b.nome,'pt-BR');
const median=values=>{
 if(!values.length)return null;
 const v=[...values].sort((a,b)=>a-b),mid=Math.floor(v.length/2);
 return round(v.length%2?v[mid]:(v[mid-1]+v[mid])/2);
};

/** Visão única para triagem. A escolha de buff/nerf continua HUMANA.
 * Ações são comparadas usando maior equipe, kit oficial, preço de pista e prêmio mínimo.
 * Variações históricas são calculadas a partir da referência compartilhada, se existir.
 */
export function buildManagementBoard(actions,catalog,{
 tax=.3,ammoUse=.25,accessConsumed=true,targetPerPlayer=20000,roi=.25,reference=null,
 winChance=null,policeWaitMinutes=null,estimatedActionMinutes=null
}={}){
 const cleanActions=Array.isArray(actions)?actions:[];
 const opts={tax:clamp(tax,0,.99,.3),ammoUse:clamp(ammoUse,0,1,.25),accessConsumed:!!accessConsumed};
 const goalMember=Math.max(0,numeric(targetPerPlayer)??20000);
 const goalRoi=Math.max(0,numeric(roi)??.25);
 const chance=null; // Regras policiais e risco não definem pagamento.
 const wait=policeWaitMinutes===null||policeWaitMinutes===''?null:clamp(policeWaitMinutes,0,600,0);
 const duration=estimatedActionMinutes===null||estimatedActionMinutes===''?null:clamp(estimatedActionMinutes,0,600,0);
 const changes=assessPriceChanges(cleanActions,catalog,reference,opts);
 const changeMap=new Map(changes.changes.map(c=>[norm(c.name),c]));
 const entries=cleanActions.map(action=>{
  const team=defaultTeam(action);
  const calc=calculateAction(action,catalog,{...opts,team,priceMode:'pista',kitMode:'oficial',
   quantities:{},prices:{},priceShift:0,targetPerPlayer:goalMember,roi:goalRoi});
  const active=action.status!=='inativo';
  const variable=action.tipo_acao==='casas'&&action.premio_min===0&&action.premio_max===0;
  const valid=calc.teamValid&&!calc.kit.missing.length&&finite(calc.min)&&finite(calc.max)&&
   finite(calc.kit.total)&&calc.kit.total>=0&&finite(calc.netMin);
  const change=changeMap.get(norm(action.nome))||null;
  const reason=[];
  let status='MANTER',priority=0;
  const expected=null; // Probabilidade de vitória nunca afeta revisão ou classificação.
  const cycleMinutes=null;
  const expectedMemberHour=null;
  const target=null; // Lucro-alvo arbitrário não é critério de buff.
  const gap=null;
  if(!active){status='INATIVA';priority=-1;}
  else if(variable){
   status='RECEITA VARIÁVEL';priority=0;reason.push('Receita calculada na subpágina Compradores NPC, conforme itens obtidos em cada casa');
  }
  else if(!valid){
   status='DADOS PENDENTES';priority=5;
   if(!calc.teamValid)reason.push('Falta regra válida de invasores');
   if(calc.kit.missing.length)reason.push('Sem preço: '+calc.kit.missing.join(', '));
   if(!finite(calc.min)||!finite(calc.max))reason.push('Premiação não informada');
   if(!finite(calc.kit.total)||calc.kit.total<0)reason.push('Kit sem capital calculável');
  }else{
   if(calc.netMin<0){status='PREJUÍZO NA VITÓRIA';priority=5;reason.push('Lucro mínimo após lavagem e reposições negativo');}
   if(calc.kit.baselineMismatch){
    reason.push('Custo oficial da ação difere do kit a preços atuais');
    priority=Math.max(priority,3);
    if(status==='MANTER')status='CONFERIR CUSTOS';
   }
   if(change){
    reason.push('Capital '+(change.difference>0?'subiu ':'caiu ')+Math.abs(Math.round(change.difference)).toLocaleString('pt-BR')+' desde a referência');
    if(change.deltaPerMember!==null&&change.deltaPerMember<-.01){
     reason.push('Reposição mais cara reduziu o lucro por invasor');
     priority=Math.max(priority,4);
     if(status!=='PREJUÍZO NA VITÓRIA')status='IMPACTADA POR PREÇOS';
    }else if(change.difference>0){
     reason.push('Mais capital imobilizado, mesmo sem queda comprovada do lucro na vitória');
     priority=Math.max(priority,2);
     if(status==='MANTER'||status==='CONFERIR CUSTOS')status='CONFERIR INVESTIMENTO';
    }else if(change.difference<0){
     reason.push('Insumos mais baratos; redução do prêmio não é automática');
     priority=Math.max(priority,1);
     if(status==='MANTER')status='MONITORAR ECONOMIA';
    }
   }
   if(status==='MANTER')reason.push('Prêmio aprovado mantido; nenhuma revisão comprovada por preços');
  }
  return {nome:String(action.nome||''),action,calc,active,valid,variable,team,status,priority,reason,change,
   expected,expectedMemberHour,cycleMinutes,
   target,gap,netMin:calc.netMin,perPlayer:calc.perPlayer,roi:calc.roi,
   capital:calc.kit.total,winCost:calc.kit.winCost,loss:calc.loss,
   cooldownMinutes:finite(numeric(action.cooldown_segundos))?Math.round(Number(action.cooldown_segundos)/60):null};
 }).sort((a,b)=>b.priority-a.priority||(a.gap!==null&&b.gap!==null?b.gap-a.gap:0)||byName(a,b));
 const active=entries.filter(x=>x.active);
 const valid=active.filter(x=>x.valid);
 const capitals=valid.map(x=>x.capital);
 const perPlayer=valid.map(x=>x.perPlayer);
 const stats={
  total:entries.length,active:active.length,inactive:entries.length-active.length,
  valid:valid.length,pendentes:active.filter(x=>!x.valid&&!x.variable).length,
  revisao:active.filter(x=>x.priority>=3).length,
  impactoPrecos:active.filter(x=>!!x.change).length,
  emPrejuizo:valid.filter(x=>x.netMin<0).length,
  capitalMediano:median(capitals),lucroMedianoMembro:median(perPlayer),
  maiorInvestimento:capitals.length?Math.max(...capitals):null,
  lucroNegativo:valid.filter(x=>x.perPlayer<0).length,
  perdaEsperada:valid.filter(x=>x.expected!==null&&x.expected<0).length
 };
 return {entries,stats,changes,hasReference:changes.available,scenario:{chance,wait,duration},
  conditions:'Prêmios aprovados mantidos; mudanças de custo são comparadas apenas com a referência salva. Equipes, policiais e cooldown são requisitos operacionais, não multiplicadores da premiação.'};
}

export function filterManagementEntries(entries,{filter='TODAS',sort='PRIORIDADE',query=''}={}){
 const q=norm(query);
 const list=(Array.isArray(entries)?entries:[]).filter(x=>{
  if(q&&!norm(x.nome).includes(q))return false;
  if(filter==='PENDENTES')return x.active&&!x.valid&&!x.variable;
  if(filter==='REVISAR')return x.active&&x.priority>=3;
  if(filter==='IMPACTADAS')return x.active&&!!x.change;
  if(filter==='PREJUIZO')return x.active&&x.valid&&x.netMin<0;
  if(filter==='ESTAVEIS')return x.active&&x.valid&&x.priority<3;
  return true;
 });
 const sortable={
  'LUCRO_MEMBRO':x=>x.perPlayer,'LUCRO_TOTAL':x=>x.netMin,
  'CAPITAL':x=>x.capital,'ROI':x=>x.roi,
  'RESULTADO_ESPERADO':x=>x.expected,'LUCRO_HORA':x=>x.expectedMemberHour
 };
 if(sort==='PRIORIDADE')return list.sort((a,b)=>b.priority-a.priority||
  (a.gap!==null&&b.gap!==null?b.gap-a.gap:0)||byName(a,b));
 const getter=sortable[sort]||sortable.LUCRO_MEMBRO;
 return list.sort((a,b)=>{
  const x=getter(a),y=getter(b);
  if(!finite(x))return finite(y)?1:byName(a,b);
  if(!finite(y))return -1;
  return y-x||byName(a,b);
 });
}
