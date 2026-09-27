const BOLETIM_LIMITE_DISCORD=1900;

export function boletimDataBR(d){
 return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
}

export function boletimParseData(txt){
 const m=String(txt||'').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
 return m?new Date(Number(m[3]),Number(m[2])-1,Number(m[1]),12,0,0):null;
}

export function boletimVariacao(atual,anterior){
 if(!anterior)return atual?Infinity:0;
 return ((atual-anterior)/anterior)*100;
}

export function boletimPct(v){
 if(v===Infinity)return 'novo';
 const sinal=v>=0?'+':'';
 return `${sinal}${v.toFixed(0)}%`;
}

export function boletimPartes(texto){
 const linhas=texto.split('\n'),partes=[];
 let atual='';
 for(const l of linhas){
  if((atual+l+'\n').length>BOLETIM_LIMITE_DISCORD&&atual){partes.push(atual.trimEnd());atual=''}
  atual+=l+'\n';
 }
 if(atual.trim())partes.push(atual.trimEnd());
 return partes.length>1
  ? partes.map((p,i)=>`${p}\n\n_(parte ${i+1} de ${partes.length})_`)
  : partes;
}
