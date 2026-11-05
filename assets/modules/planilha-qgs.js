/* High OS V13 - leitura dos QGs da planilha BLIPS COORDENADAS.
   O parser e guiado por rotulo, nunca por posicao: a planilha muda de
   season para season (linhas novas, ordem diferente, cartoes em outras
   colunas) e um parser posicional quebraria em silencio na virada.
   Regra: achou uma celula escrita GROUP, ali comeca um cartao de QG;
   dali para baixo, cada rotulo conhecido vira um campo.

   RESTRICAO DA PLANILHA: a estrutura da aba esta congelada - nao se
   cria linha nova. O painel trabalha com as linhas que ja existem; se
   um beneficio nao tem linha, ele simplesmente nao vem da planilha e
   e preenchido no cadastro do painel. Por isso o leitor nunca exige um
   rotulo: campo ausente e ausencia de dado, nunca erro. */

export const ROTULOS_QG = {
 'GROUP':'group',
 'LOCAL':'local',
 'PRODUTO':'produto',
 'SETOR':'setor',

 'INICIAR FARM':'farm',
 'INICIAR ROTA':'farm',
 'FARM':'farm',
 'CRAFT':'craft',

 'BARBEARIA':'barbearia',
 'BAU':'bau',
 'LOJA DE ROUPAS':'lojaRoupas',
 'TATUAGEM':'tatuagem',

 'GARAGEM VIP - BLIP':'garagemVipBlip',
 'GARAGEM VIP - SPAWN':'garagemVipSpawn',
 'GARAGEM VIP FAC':'garagemVipBlip',
 'GARAGEM VIP ORG':'garagemVipBlip',

 'GARAGEM PUBLICA - BLIP':'garagemPublicaBlip',
 'GARAGEM PUBLICA - SPAWN':'garagemPublicaSpawn',
 'GARAGEM PUBLICA':'garagemPublicaBlip',

 'HELIPONTO - BLIP':'helipontoBlip',
 'HELIPONTO - SPAWN':'helipontoSpawn',
 'HELIPONTO':'helipontoBlip',

 'GARAGEM BLINDADOS - BLIP':'garagemBlindadosBlip',
 'GARAGEM BLINDADOS - SPAWN':'garagemBlindadosSpawn',
 'GARAGEM BLINDADO - BLIP':'garagemBlindadosBlip',
 'GARAGEM BLINDADO - SPAWN':'garagemBlindadosSpawn',

 'GARAGEM DELUXE':'garagemDeluxe',
 'SHOP DELUXE':'shopDeluxe',
 'SHOP EXCLUSIVO':'shopExclusivo',
 'ACADEMIA':'academia',
 'ATM':'atm',
 'ARENA':'arena',
 'TELAO':'telaoCds',
 'BAR':'bar'
};

/* Rotulos que o painel ja sabe tratar como coordenada. Serve para
   avisar quando a celula tem texto solto no lugar de cds. */
export const CAMPOS_COORDENADA = new Set([
 'farm','craft','barbearia','bau','lojaRoupas','tatuagem',
 'garagemVipBlip','garagemVipSpawn','garagemPublicaBlip','garagemPublicaSpawn',
 'helipontoBlip','helipontoSpawn','garagemBlindadosBlip','garagemBlindadosSpawn',
 'garagemDeluxe','shopDeluxe','shopExclusivo','academia','atm','arena','telaoCds','bar'
]);

export function normRotulo(v=''){
 return String(v==null?'':v)
  .normalize('NFD').replace(/[̀-ͯ]/g,'')
  .replace(/\s+/g,' ')
  .replace(/\s*[-–—]\s*/g,' - ')
  .trim().toUpperCase()
  .replace(/[:.]+$/,'')
  .trim();
}

/* CSV do Google: aspas duplas escapadas por duplicacao, quebra de linha
   permitida dentro do campo. Lexer de um passo, sem regex. */
export function parseCsvGrid(texto='',sep=','){
 const linhas=[]; let linha=[], campo='', aspas=false;
 const t=String(texto||'').replace(/^﻿/,'');
 for(let i=0;i<t.length;i++){
  const c=t[i];
  if(aspas){
   if(c==='"'){ if(t[i+1]==='"'){campo+='"';i++} else aspas=false }
   else campo+=c;
   continue;
  }
  if(c==='"'){aspas=true;continue}
  if(c===sep){linha.push(campo);campo='';continue}
  if(c==='\n'){linha.push(campo);linhas.push(linha);linha=[];campo='';continue}
  if(c==='\r')continue;
  campo+=c;
 }
 if(campo.length||linha.length){linha.push(campo);linhas.push(linha)}
 return linhas;
}

/* Colar direto da planilha (Ctrl+A / Ctrl+C) entrega TAB, nao virgula.
   Aceitamos os dois para quem nao quer publicar a planilha na web. */
export function parseGrade(texto=''){
 const amostra=String(texto||'').split('\n').slice(0,40).join('\n');
 const tabs=(amostra.match(/\t/g)||[]).length;
 const virgulas=(amostra.match(/,/g)||[]).length;
 return parseCsvGrid(texto,tabs>virgulas?'\t':',');
}

const vazio=v=>String(v==null?'':v).trim()==='';

/* Celula mesclada: o valor aparece so no canto superior esquerdo da
   mesclagem, entao o valor do rotulo pode estar algumas colunas a frente. */
function valorAposRotulo(grade,r,c,alcance=6){
 for(let k=1;k<=alcance;k++){
  const v=grade[r]?.[c+k];
  if(!vazio(v))return String(v).trim();
 }
 return '';
}

export function pareceCoordenada(v=''){
 const t=String(v||'').trim();
 if(!t)return false;
 return t.split(/[\/;]/).some(p=>/^\s*-?\d+(\.\d+)?\s*(,\s*-?\d+(\.\d+)?\s*){2,3}$/.test(p));
}

/* Cabecalho de secao: na planilha o nome do setor/produto fica numa
   celula solta acima do bloco de cartoes. Pegamos o texto mais proximo
   acima, na mesma faixa de colunas, que nao seja rotulo conhecido. */
function secaoAcima(grade,r,c){
 for(let i=r-1;i>=0&&i>=r-12;i--){
  for(let j=Math.max(0,c-4);j<=c+2;j++){
   const v=grade[i]?.[j];
   if(vazio(v))continue;
   const n=normRotulo(v);
   if(ROTULOS_QG[n])continue;
   if(/^\d+([.,]\d+)?$/.test(String(v).trim()))continue;
   if(/^(TRUE|FALSE|COMPLETO|INCOMPLETO|OK|W|X)$/.test(n))continue;
   if(pareceCoordenada(v))continue;
   if(n.length<2||n.length>40)continue;
   return String(v).trim();
  }
 }
 return '';
}

/* Um cartao vai do GROUP ate o proximo GROUP da mesma coluna, ou ate
   acabarem os rotulos conhecidos. Paramos depois de 4 linhas seguidas
   sem rotulo para nao invadir o bloco de baixo. */
export function parseQgCards(grade=[]){
 const cards=[];
 const alturaMax=60;
 for(let r=0;r<grade.length;r++){
  const linha=grade[r]||[];
  for(let c=0;c<linha.length;c++){
   if(normRotulo(linha[c])!=='GROUP')continue;

   const card={
    linha:r+1, coluna:c+1,
    secao:secaoAcima(grade,r,c),
    campos:{}, avisos:[], rotulosDesconhecidos:[]
   };
   let secos=0;
   for(let i=r;i<grade.length&&i<r+alturaMax;i++){
    const bruto=grade[i]?.[c];
    if(vazio(bruto)){ if(++secos>=4)break; continue }
    const n=normRotulo(bruto);
    if(i>r&&n==='GROUP')break;
    const chave=ROTULOS_QG[n];
    if(!chave){
     if(++secos>=4)break;
     if(n.length>1&&n.length<=40&&!/^(TRUE|FALSE|COMPLETO|INCOMPLETO)$/.test(n))card.rotulosDesconhecidos.push(String(bruto).trim());
     continue;
    }
    secos=0;
    const valor=valorAposRotulo(grade,i,c);
    if(!valor)continue;
    /* rotulo repetido no mesmo cartao (ex.: duas garagens publicas):
       guardamos o segundo em campo numerado para nao perder o dado. */
    if(card.campos[chave]!==undefined&&card.campos[chave]!==valor){
     let k=2; while(card.campos[chave+k]!==undefined)k++;
     card.campos[chave+k]=valor;
    } else card.campos[chave]=valor;
   }

   if(!Object.keys(card.campos).length)continue;
   validarCard(card);
   cards.push(card);
  }
 }
 /* O nome do setor fica numa celula solta a esquerda do primeiro cartao
    da faixa. Os demais cartoes da mesma faixa herdam esse nome. */
 const porFaixa=new Map();
 for(const c of cards)if(c.secao&&!porFaixa.has(c.linha))porFaixa.set(c.linha,c.secao);
 for(const c of cards)if(!c.secao)c.secao=porFaixa.get(c.linha)||'';
 return cards;
}

function validarCard(card){
 const f=card.campos;
 if(!f.group)card.avisos.push('GROUP em branco - QG ainda nao vinculado.');
 if(f.local&&pareceCoordenada(f.local))card.avisos.push('LOCAL tem coordenada no lugar do nome do local.');
 if(f.produto&&pareceCoordenada(f.produto))card.avisos.push('PRODUTO tem coordenada no lugar do nome do produto.');
 if(!f.local)card.avisos.push('Sem LOCAL: fica dificil identificar o QG na revisao.');
 for(const [k,v] of Object.entries(f)){
  const base=k.replace(/\d+$/,'');
  if(CAMPOS_COORDENADA.has(base)&&v&&!pareceCoordenada(v))card.avisos.push(`${k}: "${String(v).slice(0,40)}" nao parece coordenada.`);
 }
}

/* Chave estavel do QG dentro da season. Usamos o local, que e o que
   sobrevive quando o GROUP ainda nao foi vinculado; se nem local tem,
   caimos para a posicao na planilha. */
export function chaveQg(card){
 const f=card.campos||{};
 const base=f.group||f.local||`L${card.linha}C${card.coluna}`;
 return String(base).normalize('NFD').replace(/[̀-ͯ]/g,'')
  .toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,60);
}

/* Transforma cartoes em registros gravaveis, ja deduplicados por chave. */
export function montarQgs(cards=[]){
 const mapa=new Map();
 for(const card of cards){
  const chave=chaveQg(card);
  const f=card.campos;
  const reg={
   chave,
   group:(f.group||'').trim(),
   local:(f.local||'').trim(),
   produto:(f.produto||'').trim(),
   setor:(f.setor||card.secao||'').trim(),
   vinculado:!!(f.group||'').trim(),
   origem:{linha:card.linha,coluna:card.coluna},
   avisos:card.avisos,
   cds:{}
  };
  for(const [k,v] of Object.entries(f)){
   if(['group','local','produto','setor'].includes(k))continue;
   if(v)reg.cds[k]=String(v).trim();
  }
  if(mapa.has(chave)){
   const ja=mapa.get(chave);
   ja.duplicado=(ja.duplicado||1)+1;
   reg.chave=chave+'_'+ja.duplicado;
  }
  mapa.set(reg.chave,reg);
 }
 return [...mapa.values()];
}

/* Inventario das linhas que a aba oferece hoje. Como nao se pode criar
   linha nova, esta e a lista do que da para puxar da planilha - o resto
   so existe se for preenchido no cadastro do painel. */
export function inventarioLinhas(cards=[]){
 const presentes={}, desconhecidos={};
 for(const card of cards){
  for(const k of Object.keys(card.campos||{})){
   const base=k.replace(/\d+$/,'');
   presentes[base]=(presentes[base]||0)+1;
  }
  for(const r of card.rotulosDesconhecidos||[])desconhecidos[r]=(desconhecidos[r]||0)+1;
 }
 const conhecidos=[...new Set(Object.values(ROTULOS_QG))];
 return {
  disponiveis:Object.entries(presentes).sort((a,b)=>b[1]-a[1]).map(([campo,qtd])=>({campo,qtd})),
  semLinha:conhecidos.filter(c=>!presentes[c]).sort(),
  rotulosNaoMapeados:Object.entries(desconhecidos).sort((a,b)=>b[1]-a[1]).map(([rotulo,qtd])=>({rotulo,qtd})),
  cartoes:cards.length
 };
}

export function resumoImportacao(qgs=[]){
 return {
  total:qgs.length,
  vinculados:qgs.filter(q=>q.vinculado).length,
  semGroup:qgs.filter(q=>!q.vinculado).length,
  comAviso:qgs.filter(q=>q.avisos?.length).length,
  setores:[...new Set(qgs.map(q=>q.setor).filter(Boolean))].sort(),
  bytes:JSON.stringify(qgs).length
 };
}
