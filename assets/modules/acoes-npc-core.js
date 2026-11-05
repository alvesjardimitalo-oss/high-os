/** High OS Dev — NPCs compradores (economia fictícia High RP).
 * Quantidades são fotografias de estoque do NPC, não comprovam
 * vendas acumuladas caso o servidor limpe ou reutilize o inventário.
 */
const amount=v=>v===null||v===undefined||v===''?null:Number.isFinite(Number(v))?Number(v):null;
export function npcStats(items=[]){
 const data=(Array.isArray(items)?items:[]).map(x=>({
  ...x,price:amount(x.precoSujo),stock:amount(x.quantidadeNpc)
 }));
 const observed=data.filter(x=>x.stock!==null&&x.stock>=0&&Number.isInteger(x.stock)&&
  x.price!==null&&x.price>=0);
 const sorted=[...observed].sort((a,b)=>b.stock-a.stock||b.stock*b.price-a.stock*a.price||
  String(a.nome).localeCompare(String(b.nome),'pt-BR'));
 const count=observed.reduce((s,x)=>s+x.stock,0);
 const gross=observed.reduce((s,x)=>s+x.stock*x.price,0);
 return {registered:data.length,observed:observed.length,units:count,
  grossDirty:gross,ranked:sorted};
}
export function houseLootScenario(items=[],quantities=[],{lockpickUnit=null,lockpickQuantity=1,tax=.3}={}){
 if(!Array.isArray(items)||!Array.isArray(quantities))throw Error('Itens e quantidades inválidos.');
 let grossDirty=0,units=0;
 for(let i=0;i<items.length;i++){
  const n=amount(quantities[i])??0;
  if(!Number.isInteger(n)||n<0||n>100000)throw Error('Informe quantidades inteiras e positivas.');
  if(n===0)continue;
  const price=amount(items[i]?.precoSujo);
  if(price===null||price<0)throw Error('Há um item selecionado sem preço definido.');
  units+=n;grossDirty+=n*price;
 }
 const costUnit=amount(lockpickUnit),qty=amount(lockpickQuantity);
 const validCost=costUnit!==null&&costUnit>=0&&Number.isInteger(qty)&&qty>=0;
 const wash=Number.isFinite(Number(tax))?Math.max(0,Math.min(.99,Number(tax))):.3;
 const clean=grossDirty*(1-wash);
 const investment=validCost?costUnit*qty:null;
 return {units,grossDirty,netAfterWash:clean,investment,
  profit:investment===null?null:clean-investment,
  breakEvenDirty:investment===null?null:Math.ceil(investment/(1-wash))};
}
