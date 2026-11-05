// Planeja uma atualização conservadora na ABA EXISTENTE de ações da planilha.
// Não realiza rede nem modifica dados. A folha original calcula os prêmios
// a partir de BUFF e NERF; nunca sobrescrevemos as fórmulas da premiação.
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase().replace(/\s+/g,' ');
const num=v=>{
 if(typeof v==='number')return Number.isFinite(v)?v:null;
 if(v==null)return null;
 const raw=String(v).trim().replace(/[R$\s]/g,'');
 if(!raw)return null;
 const normalized=raw.includes(',')?raw.replace(/\./g,'').replace(',','.'):raw;
 const value=Number(normalized);
 return Number.isFinite(value)?value:null;
};
const str=v=>String(v??'');
export function planApprovedActionSheetUpdate(rows,name,officialMin,proposedMin,{officialMax=null,proposedMax=null}={}){
 const wanted=norm(name);
 if(!wanted||!Array.isArray(rows))throw Error('Dados ou nome de ação inválidos.');
 const candidates=[];
 for(let row=0;row<rows.length;row++){
  for(let col=0;col<(rows[row]||[]).length-1;col++){
   if(norm(rows[row]?.[col])==='ACOES'&&norm(rows[row]?.[col+1])===wanted){
    candidates.push({row,col});
   }
  }
 }
 if(candidates.length!==1)throw Error(candidates.length?'Esta ação aparece mais de uma vez na planilha. Revise os cadastros antes de atualizar.':'Ação não encontrada na aba VALORES AÇÃO BLIPADA.');
 const {row,col}=candidates[0];
 const match=label=>{
  const candidates=[];
  for(let k=row+1;k<Math.min(rows.length,row+17);k++)if(norm(rows[k]?.[col])===label)candidates.push(k);
  if(candidates.length!==1)throw Error('Campo '+label+' ausente ou duplicado para '+name+'.');
  return candidates[0];
 };
 const minRow=match('PREMIO MINIMO (SUJO)'),maxRow=match('PREMIO MAXIMO (SUJO)'),buffRow=match('BUFF'),nerfRow=match('NERF');
 const min=num(rows[minRow]?.[col+1]),max=num(rows[maxRow]?.[col+1]),buff=num(rows[buffRow]?.[col+1]),nerf=num(rows[nerfRow]?.[col+1]);
 if(min===null||max===null||max<min||buff===null||nerf===null)throw Error('Prêmios mínimo/máximo, BUFF ou NERF sem valores coerentes.');
 if(!Number.isFinite(Number(officialMin))||Math.abs(min-Number(officialMin))>1.01)
  throw Error('O prêmio atual da planilha diverge do Mercado Negro. Sincronize os valores oficiais antes de aprovar qualquer ajuste.');
 if(officialMax!==null&&(!Number.isFinite(Number(officialMax))||Math.abs(max-Number(officialMax))>1.01))
  throw Error('O prêmio máximo da planilha diverge do catálogo/valor exibido. Atualize os valores antes de aprovar.');
 const newMin=Number(proposedMin);
 if(!Number.isFinite(newMin)||newMin<0||newMin>1000000000)throw Error('Premiação proposta inválida ou fora do limite de segurança.');
 const newMax=proposedMax===null?Math.ceil(newMin*max/min):Number(proposedMax);
 if(!Number.isFinite(newMax)||newMax<newMin||newMax>1000000000)throw Error('Prêmio máximo recomendado inválido ou fora do limite.');
 const delta=Math.round(newMin-min);
 if(delta===0)throw Error('O prêmio proposto não muda o valor atual.');
 const adjustment=Math.round(buff-nerf)+delta;
 const nextBuff=Math.max(0,adjustment),nextNerf=Math.max(0,-adjustment);
 return {
  name,sheetId:1276582880,
  sheetName:'VALORES AÇÃO BLIPADA',
  previousMin:min,previousMax:max,proposedMin:newMin,proposedMax:newMax,delta,
  oldBuff:buff,oldNerf:nerf,nextBuff,nextNerf,
  min:{rowIndex:minRow,columnIndex:col+1},max:{rowIndex:maxRow,columnIndex:col+1},
  buff:{rowIndex:buffRow,columnIndex:col+1},
  nerf:{rowIndex:nerfRow,columnIndex:col+1}
 };
}

/** Extrai os prêmios correntes da aba existente sem editar nenhuma fórmula.
 * Os valores refletidos pelo Google Sheets têm prioridade sobre o JSON
 * público após um ajuste de BUFF/NERF confirmado.
 */
export function extractPublishedActionPrizes(rows){
 if(!Array.isArray(rows))throw Error('Resposta da planilha inválida.');
 const output=[],seen=new Set();
 for(let r=0;r<rows.length;r++){
  const line=rows[r]||[];
  for(let c=0;c<line.length-1;c++){
   if(norm(line[c])!=='ACOES')continue;
   const name=str(line[c+1]).trim(),id=norm(name);
   if(!id||seen.has(id))continue;
   const fields={};
   for(let y=r+1;y<Math.min(rows.length,r+18);y++){
    const label=norm(rows[y]?.[c]);
    if(label==='ACOES')break;
    const val=num(rows[y]?.[c+1]);
    if(label==='PREMIO MINIMO (SUJO)')fields.min=val;
    if(label==='PREMIO MAXIMO (SUJO)')fields.max=val;
    if(label==='BUFF')fields.buff=val;
    if(label==='NERF')fields.nerf=val;
   }
   // Somente linhas completas são utilizáveis; nunca substituir
   // um prêmio real por zero ou inferir o máximo de uma fórmula.
   if(fields.min!==null&&Number.isFinite(fields.min)&&fields.max!==null&&
     Number.isFinite(fields.max)&&fields.max>=fields.min){
    output.push({name,...fields});seen.add(id);
   }
  }
 }
 return output;
}
