/** Cálculo de loot do High RP. Não usa preço de compra nem preço de item quebrado como receita de item íntegro. */
const number=v=>v===''||v===null||v===undefined?null:Number.isFinite(Number(v))?Number(v):null;
export const lootKey=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase();
export function makeLootPrices(merchant=[]){
 const prices=new Map();
 for(const row of merchant){const value=number(row.precoSujo);if(value===null||value<0)continue;
  if(row.codigo)prices.set(lootKey(row.codigo),value);if(row.nome)prices.set(lootKey(row.nome),value);
 }
 return prices;
}
export function lootPrice(row,prices){
 if(row.codigo==='dirtydollar')return 1;
 return prices.get(lootKey(row.codigo))??prices.get(lootKey(row.nome))??null;
}
export function weightedLoot(table,prices,{chance=table.chance}={}){
 const pool=table.items.reduce((sum,x)=>sum+x.peso,0);
 if(!(pool>0))throw Error('Pool de loot inválido.');
 const gate=number(chance);if(gate!==null&&(gate<0||gate>1))throw Error('Chance inválida.');
 let low=0,high=0,unpricedWeight=0;
 const rows=table.items.map((row,index)=>{
  const probability=row.peso/pool,unit=lootPrice(row,prices);
  if(unit===null)unpricedWeight+=row.peso;else{low+=probability*row.min*unit;high+=probability*row.max*unit;}
  return {...row,index,probability,unit,expectedProbability:gate===null?null:probability*gate};
 });
 return {pool,rows,coverage:1-unpricedWeight/pool,complete:unpricedWeight===0||gate===0,conditionalLow:low,conditionalHigh:high,
  chance:gate,low:gate===null?null:low*gate,high:gate===null?null:high*gate,
  midpoint:gate===null?null:(low+high)*gate/2};
}
export function robberyProjection(parts,prices,{investment=null,tax=.3}={}){
 let low=0,high=0,complete=true,missingSetup=false;
 for(const part of parts){const draws=number(part.draws);
  if(draws===null||!Number.isInteger(draws)||draws<0||draws>1000){missingSetup=true;continue;}
  if(draws===0)continue;
  const result=weightedLoot(part.table,prices,{chance:part.chance??part.table.chance});
  if(result.chance===null){missingSetup=true;continue;}
  low+=draws*result.low;high+=draws*result.high;complete&&=result.complete;
 }
 const cost=number(investment),wash=number(tax);
 if(wash===null||wash<0||wash>=1)throw Error('Taxa de lavagem inválida.');
 const valid=!missingSetup&&complete&&cost!==null&&cost>=0;
 return {low,high,midpoint:(low+high)/2,complete,missingSetup,
  profit:valid?(low+high)/2*(1-wash)-cost:null,
  netLow:valid?low*(1-wash)-cost:null,netHigh:valid?high*(1-wash)-cost:null};
}
export function actualHouseRun(items,{directDirty=0,lockpickUnit=null,lockpickQuantity=1,tax=.3,minutes=null,label='Casa',outcome='concluido'}={}){
 const direct=number(directDirty),unit=number(lockpickUnit),qty=number(lockpickQuantity),wash=number(tax),duration=number(minutes);
 if(direct===null||direct<0||direct>1e10||unit===null||unit<0||unit>1e10||!Number.isInteger(qty)||qty<0||qty>100||wash===null||wash<0||wash>=1||duration!==null&&(duration<=0||duration>1440))throw Error('Confira dinheiro, gazuas, lavagem e duração.');
 if(!Array.isArray(items)||items.length>40)throw Error('Até 40 itens por roubo.');
 const products=items.map(x=>({nome:String(x.nome||'').trim().slice(0,100),codigo:String(x.codigo||'').slice(0,100),quantidade:number(x.quantidade),precoSujo:number(x.precoSujo)}));
 if(products.some(x=>!x.nome||!Number.isInteger(x.quantidade)||x.quantidade<1||x.quantidade>100000||x.precoSujo===null||x.precoSujo<0||x.precoSujo>1e10))throw Error('Todo item encontrado precisa de quantidade e preço de venda definidos.');
 const itemDirty=products.reduce((s,x)=>s+x.quantidade*x.precoSujo,0),grossDirty=direct+itemDirty,investment=unit*qty;
 return {label:String(label||'Casa').trim().slice(0,100),outcome:outcome==='fracasso'?'fracasso':'concluido',items:products,directDirty:direct,lockpickUnit:unit,lockpickQuantity:qty,tax:wash,minutes:duration,
  itemDirty,grossDirty,investment,netAfterWash:grossDirty*(1-wash),profit:grossDirty*(1-wash)-investment};
}
export function houseRunMetrics(runs=[]){
 const count=runs.length,totalProfit=runs.reduce((s,x)=>s+x.profit,0);
 const timed=runs.filter(x=>Number.isFinite(x.minutes)&&x.minutes>0),minutes=timed.reduce((s,x)=>s+x.minutes,0);
 return {count,totalProfit,average:count?totalProfit/count:null,
  hourly:minutes?timed.reduce((s,x)=>s+x.profit,0)*60/minutes:null,
  grossDirty:runs.reduce((s,x)=>s+x.grossDirty,0)};
}

/** One search point: render gate -> one weighted entry -> integer quantity. */
function prepareInvasion(parts,prices){
 if(!Array.isArray(parts)||!parts.length)throw Error('Informe os locais da invasão.');
 return parts.map(part=>{
  const count=number(part.count),chance=number(part.chance??part.table.chance);
  if(!Number.isInteger(count)||count<0||count>100||chance===null||chance<0||chance>1)throw Error('Locais ou chance inválidos.');
  const pool=part.table.items.reduce((sum,row)=>sum+row.peso,0);
  if(!(pool>0))throw Error('Pool inválido.');
  let cumulative=0;
  return {count,chance,pool,rows:part.table.items.map(row=>({...row,unit:lootPrice(row,prices),cumulative:cumulative+=row.peso}))};
 });
}
export function invasionExpectation(parts,prices,{lockpickUnit=null,uses=1,tax=.3}={}){
 const configured=prepareInvasion(parts,prices),unit=number(lockpickUnit),usage=number(uses),wash=number(tax);
 if(!Number.isInteger(usage)||usage<1||usage>100||wash===null||wash<0||wash>=1||unit!==null&&unit<0)throw Error('Confira usos, custo e lavagem.');
 let units=0,directDirty=0,pricedDirty=0,unknownUnits=0,emptyChance=1,allPriced=true,rewardedPoints=0;
 const items=new Map();
 for(const part of configured){
  emptyChance*=Math.pow(1-part.chance,part.count);rewardedPoints+=part.count*part.chance;
  const grouped=new Map();
  for(const row of part.rows){
   const conditional=row.peso/part.pool,eventChance=conditional*part.chance,qty=(row.min+row.max)/2;
   const expectedQty=part.count*eventChance*qty;
   if(row.codigo==='dirtydollar')directDirty+=expectedQty;
   else{units+=expectedQty;if(row.unit===null){unknownUnits+=expectedQty;if(expectedQty>0)allPriced=false;}else pricedDirty+=expectedQty*row.unit;}
   const key=row.codigo||row.nome;
   const group=grouped.get(key)||{...row,expectedQty:0,probability:0};group.expectedQty+=expectedQty;group.probability+=eventChance;grouped.set(key,group);
  }
  for(const [key,row] of grouped){const current=items.get(key)||{nome:row.nome,codigo:row.codigo,unit:row.unit,expectedQty:0,absentProbability:1};current.expectedQty+=row.expectedQty;current.absentProbability*=Math.pow(1-row.probability,part.count);items.set(key,current);}
 }
 const knownGrossDirty=directDirty+pricedDirty,investment=unit===null?null:unit*usage;
 const knownProfit=investment===null?null:knownGrossDirty*(1-wash)-investment;
 return {locations:configured.reduce((sum,x)=>sum+x.count,0),units,directDirty,pricedDirty,knownGrossDirty,unknownUnits,allPriced,emptyChance,rewardedPoints,investment,knownProfit,
  profit:allPriced?knownProfit:null,perUseKnownProfit:knownProfit===null?null:knownProfit/usage,
  perUseProfit:allPriced&&knownProfit!==null?knownProfit/usage:null,
  items:[...items.values()].map(x=>({...x,probability:1-x.absentProbability})).sort((a,b)=>b.expectedQty-a.expectedQty)};
}
export function simulateInvasions(parts,prices,{trials=10000,seed=42,lockpickUnit=null,uses=1,tax=.3}={}){
 if(!Number.isInteger(trials)||trials<1||trials>50000)throw Error('Quantidade de simulações inválida.');
 const prepared=prepareInvasion(parts,prices),expected=invasionExpectation(parts,prices,{lockpickUnit,uses,tax});
 let randomState=Number(seed)>>>0;
 const random=()=>{randomState=(Math.imul(1664525,randomState)+1013904223)>>>0;return randomState/4294967296;};
 const quantities=[],revenues=[];let totalUnits=0,totalKnownDirty=0,empty=0;const samples=[];
 for(let trial=0;trial<trials;trial++){
  let units=0,knownDirty=0,directDirty=0,rewards=0;const inventory=new Map();let unknown=false;
  for(const part of prepared)for(let point=0;point<part.count;point++){
   if(random()>=part.chance)continue;
   const weight=random()*part.pool,row=part.rows.find(x=>weight<x.cumulative);
   const quantity=row.min+Math.floor(random()*(row.max-row.min+1));rewards++;
   if(row.codigo==='dirtydollar'){directDirty+=quantity;knownDirty+=quantity;}
   else{units+=quantity;if(row.unit===null)unknown=true;else knownDirty+=quantity*row.unit;}
   const key=row.codigo||row.nome,old=inventory.get(key)||{nome:row.nome,codigo:row.codigo,quantidade:0};old.quantidade+=quantity;inventory.set(key,old);
  }
  totalUnits+=units;totalKnownDirty+=knownDirty;if(rewards===0)empty++;
  quantities.push(units);revenues.push(knownDirty);
  if(trial<8)samples.push({units,directDirty,knownDirty,unknown,items:[...inventory.values()],profit:expected.investment===null||unknown?null:knownDirty*(1-tax)-expected.investment});
 }
 quantities.sort((a,b)=>a-b);revenues.sort((a,b)=>a-b);
 const quantile=(arr,p)=>arr[Math.floor((arr.length-1)*p)];
 return {trials,expected,meanUnits:totalUnits/trials,meanKnownDirty:totalKnownDirty/trials,emptyRate:empty/trials,
  unitsP10:quantile(quantities,.1),unitsP50:quantile(quantities,.5),unitsP90:quantile(quantities,.9),
  knownDirtyP10:quantile(revenues,.1),knownDirtyP90:quantile(revenues,.9),samples};
}
export function houseSearchParts(tables,locations=1,safes=0){
 const total=number(locations),cofres=number(safes);
 if(!Number.isInteger(total)||total<1||total>100||!Number.isInteger(cofres)||cofres<0||cofres>total)throw Error('A casa deve ter de 1 a 100 locais, com cofres entre zero e o total de locais.');
 return [{table:tables.cofre,count:cofres},{table:tables.armario,count:total-cofres}];
}
