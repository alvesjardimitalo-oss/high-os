import {actualHouseRun} from './roubos-loot-core.js?v=1';
/**
 * HIGH OS • cadastro interno de ações.
 * Mantém a fonte pública do Mercado Negro intacta. Ações cadastradas e
 * ajustes internos são sobrepostos no planejador e identificados como tais.
 */
export const normalizeActionName=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toUpperCase();
const finite=value=>value!==''&&value!==null&&Number.isFinite(Number(value))?Number(value):null;
export function blankAction(){
 return {nome:'',tipo_acao:'blipada',status:'ativo',premio_min:0,premio_max:0,
  cooldown_segundos:0,regras_confronto:[{invasores:1,policiais:0,refens:0}],
  itens:[],locais:[]};
}
export function cleanActionEntry(input,{oldName='',published=[],managed=[]}={}){
 const nome=String(input?.nome??'').trim().replace(/\s+/g,' ');
 if(nome.length<3||nome.length>100)throw Error('Informe um nome entre 3 e 100 caracteres.');
 const key=normalizeActionName(nome),oldKey=normalizeActionName(oldName);
 const occupied=[...published,...managed].find(a=>normalizeActionName(a.nome)===key);
 if(occupied&&key!==oldKey)throw Error('Já existe outra ação com este nome.');
 const tipo_acao=['blipada','atm','registradora','casas','outros'].includes(input.tipo_acao)?input.tipo_acao:'blipada';
 const variable=tipo_acao==='casas';
 const min=finite(input.premio_min)??(variable?0:null),max=finite(input.premio_max)??(variable?0:null);
 if(min===null||min<0||(!variable&&min<=0)||max===null||max<min||max>1e12)
  throw Error('Informe prêmios mínimo e máximo válidos. Em roubos de casas, 0/0 representa receita variável do NPC.');
 const status=String(input.status)==='inativo'?'inativo':'ativo';
 const rules=(Array.isArray(input.regras_confronto)?input.regras_confronto:[]).map(row=>({
  invasores:finite(row.invasores),policiais:finite(row.policiais),refens:finite(row.refens)??0
 }));
 if(!rules.length||rules.length>20||rules.some(r=>!Number.isInteger(r.invasores)||r.invasores<1||r.invasores>100||
   !Number.isInteger(r.policiais)||r.policiais<0||r.policiais>100||
   !Number.isInteger(r.refens)||r.refens<0||r.refens>100))
  throw Error('Informe de 1 a 20 equipes com quantidades válidas de invasores e policiais.');
 if(new Set(rules.map(r=>r.invasores)).size!==rules.length)
  throw Error('As equipes não podem repetir a quantidade de invasores.');
 const itens=(Array.isArray(input.itens)?input.itens:[]).map(row=>({
  nome:String(row.nome??'').trim(),quantidade:finite(row.quantidade),
  categoria_item:['arma','municao','colete','acesso','consumivel'].includes(row.categoria_item)?row.categoria_item:null,
  preco_unitario:finite(row.preco_unitario)
 }));
 if(itens.length>60||itens.some(it=>!it.nome||it.nome.length>100||
  !Number.isInteger(it.quantidade)||it.quantidade<1||it.quantidade>10000||
  it.preco_unitario!==null&&(it.preco_unitario<0||it.preco_unitario>1e12)))
  throw Error('Cadastre até 60 itens com quantidades e preços válidos. O kit vazio é permitido para ações sem insumos.');
 const cooldown=finite(input.cooldown_segundos)??0;
 if(cooldown<0||cooldown>86400||!Number.isInteger(cooldown))
  throw Error('Tempo de espera inválido.');
 return {...input,nome,tipo_acao,status,premio_min:min,premio_max:max,cooldown_segundos:cooldown,
  itens,regras_confronto:rules,
  locais:Array.isArray(input.locais)?input.locais.slice(0,50):[]};
}
export const NPC_MARKET_KEYS=Object.freeze(['CASAS','ARMAS_QUEBRADAS']);
const emptyMarket=()=>({items:[],history:[],updatedAt:null});
export function cleanRegistry(raw){
 const data=raw&&typeof raw==='object'?raw:{};
 const entries=data.entries&&typeof data.entries==='object'&&!Array.isArray(data.entries)?data.entries:{};
 const hidden=data.hidden&&typeof data.hidden==='object'&&!Array.isArray(data.hidden)?data.hidden:{};
 const old=data.npcMarkets&&typeof data.npcMarkets==='object'?data.npcMarkets:{};
 const npcMarkets=Object.fromEntries(NPC_MARKET_KEYS.map(key=>{
  const v=old[key]&&typeof old[key]==='object'?old[key]:emptyMarket();
  return [key,{items:Array.isArray(v.items)?v.items.slice(0,150):[],
   history:Array.isArray(v.history)?v.history.slice(-60):[],
   updatedAt:typeof v.updatedAt==='string'?v.updatedAt:null}];
 }));
 const houseRuns=(Array.isArray(data.houseRuns)?data.houseRuns:[]).slice(-50).flatMap(row=>{
  try{if(!row?.id||!Number.isFinite(Date.parse(row.at)))return [];
   return [{...actualHouseRun(row.items,row),id:String(row.id).slice(0,100),at:row.at}];
  }catch{return [];}
 });
 return {revision:Math.max(0,Number(data.revision)||0),entries:{...entries},hidden:{...hidden},npcMarkets,houseRuns};
}
export function cleanNpcProducts(products){
 if(!Array.isArray(products)||products.length>150)throw Error('Cadastre até 150 itens por NPC.');
 const prepared=products.map(row=>{
  const nome=String(row?.nome||'').trim().replace(/\\s+/g,' ');
  const codigo=String(row?.codigo||'').trim().replace(/\\s+/g,' ');
  const precoSujo=finite(row?.precoSujo);
  const quantidadeNpc=finite(row?.quantidadeNpc);
  if(!nome||nome.length>100||codigo.length>100||precoSujo===null||
    precoSujo<0||precoSujo>1e10||
    quantidadeNpc!==null&&(!Number.isInteger(quantidadeNpc)||quantidadeNpc<0||quantidadeNpc>1e9))
   throw Error('Informe nome, preço em dinheiro sujo e quantidade inteira não negativa (ou em branco).');
  return {nome,codigo,precoSujo,quantidadeNpc};
 });
 const identities=prepared.map(x=>normalizeActionName(x.codigo||x.nome));
 if(new Set(identities).size!==identities.length)throw Error('Há itens repetidos no cadastro do NPC.');
 return prepared;
}
export function mergeActionRegistry(official,raw){
 const registry=cleanRegistry(raw),byKey=new Map();
 for(const a of Array.isArray(official)?official:[]){
  const key=normalizeActionName(a.nome);
  if(key&&!registry.hidden[key])byKey.set(key,{...a,origemCadastro:'OFICIAL'});
 }
 for(const [key,a] of Object.entries(registry.entries)){
  const target=normalizeActionName(a?.nome||key);
  if(!target||registry.hidden[target])continue;
  const officialEntry=(official||[]).some(x=>normalizeActionName(x.nome)===target);
  byKey.set(target,{...a,origemCadastro:officialEntry?'AJUSTE INTERNO':'PERSONALIZADA'});
 }
 return [...byKey.values()].sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));
}
export function applyRegistryMutation(raw,{kind,entry,name,oldName},official=[]){
 const current=cleanRegistry(raw),entries={...current.entries},hidden={...current.hidden};
 const npcMarkets={...current.npcMarkets};
 let houseRuns=[...current.houseRuns];
 const officialNames=new Set((official||[]).map(a=>normalizeActionName(a.nome)));
 const key=normalizeActionName(name||oldName||entry?.nome);
 if(kind==='save'){
  const prepared=cleanActionEntry(entry,{oldName,managed:Object.values(entries),published:official});
  const nextKey=normalizeActionName(prepared.nome);
  const previousKey=normalizeActionName(oldName);
  if(previousKey&&previousKey!==nextKey){
   if(officialNames.has(previousKey))throw Error('O nome de uma ação oficial não pode ser modificado; crie outra ação.');
   delete entries[previousKey];
  }
  entries[nextKey]=prepared;
  delete hidden[nextKey];
 }else if(kind==='house-run-save'){
  const result=actualHouseRun(entry?.items,entry||{});
  const now=new Date().toISOString();
  houseRuns=[...houseRuns,{...result,id:now+'-'+(current.revision+1),at:now}].slice(-50);
 }else if(kind==='npc-save'){
  const market=String(entry?.market||'').toUpperCase();
  if(!NPC_MARKET_KEYS.includes(market))throw Error('Comprador NPC não reconhecido.');
  const products=cleanNpcProducts(entry?.items);
  const oldMarket=npcMarkets[market]||emptyMarket();
  const now=new Date().toISOString();
  npcMarkets[market]={items:products,updatedAt:now,history:[
   ...(oldMarket.history||[]),
   {at:now,items:products.map(x=>({codigo:x.codigo,nome:x.nome,precoSujo:x.precoSujo,quantidadeNpc:x.quantidadeNpc}))}
  ].slice(-60)};
 }else if(kind==='archive'){
  if(!key||!officialNames.has(key))throw Error('Somente uma ação oficial pode ser arquivada.');
  hidden[key]=true;
 }else if(kind==='restore'){
  if(!hidden[key])throw Error('Esta ação não está arquivada.');
  delete hidden[key];
 }else if(kind==='delete'){
  if(!entries[key])throw Error('O cadastro interno não foi encontrado.');
  delete entries[key];delete hidden[key];
 }else throw Error('Operação de cadastro inválida.');
 return {...current,revision:current.revision+1,entries,hidden,npcMarkets,houseRuns};
}

