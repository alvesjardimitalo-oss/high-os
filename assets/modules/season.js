/* High OS V13 - season ativa.
   A cidade virou de season e a planilha de blips e coordenadas passou a
   ser a lista oficial: na Season 3 o painel mostra apenas os QGs que
   estao na aba. Os Groups da season anterior continuam gravados, so
   ficam fora de vista enquanto a season ativa for outra.

   Custo de leitura: 1 documento no indice (minusculo) e 1 do pacote da
   season, e so quando a versao mudar - o pacote fica espelhado no
   navegador entre as sessoes. */

export const DOC_INDICE=['highos','season_atual'];
export const CHAVE_ESCOLHA='highos_season_escolhida';
export const CHAVE_PACOTE='highos_season_pacote_';

export const season={
 id:'',
 nome:'',
 versao:0,
 qgs:[],
 groups:new Set(),
 carregada:false,
 indice:[]
};

const norm=v=>String(v==null?'':v).normalize('NFD').replace(/[̀-ͯ]/g,'').trim().toUpperCase();

export function seasonEscolhida(){
 try{return localStorage.getItem(CHAVE_ESCOLHA)||''}catch(e){return ''}
}
export function guardarEscolha(id){
 try{localStorage.setItem(CHAVE_ESCOLHA,String(id||''))}catch(e){}
}
export function esquecerEscolha(){
 try{localStorage.removeItem(CHAVE_ESCOLHA)}catch(e){}
}

/* ---------- espelho local do pacote ---------- */
function lerEspelho(id,versao){
 try{
  const raw=localStorage.getItem(CHAVE_PACOTE+id);
  if(!raw)return null;
  const d=JSON.parse(raw);
  if(Number(d?.versao)!==Number(versao))return null;
  return Array.isArray(d?.qgs)?d.qgs:null;
 }catch(e){return null}
}
function gravarEspelho(id,versao,qgs){
 try{localStorage.setItem(CHAVE_PACOTE+id,JSON.stringify({versao,qgs}))}catch(e){}
}

/* ---------- leitura ---------- */
/* fns: {getDoc, doc, db} vindos do app, para este modulo nao importar
   o Firebase por conta propria e nao duplicar a conexao. */
export async function lerIndice({getDoc,doc,db}){
 try{
  const snap=await getDoc(doc(db,...DOC_INDICE));
  const d=snap.exists()?snap.data():{};
  season.indice=Array.isArray(d.lista)&&d.lista.length
   ? d.lista
   : (d.id?[{id:d.id,nome:d.nome||d.id,total:d.total||0,versao:d.versao||1,semGroup:d.semGroup||0}]:[]);
  return {lista:season.indice,ativa:d.ativa||d.id||''};
 }catch(e){
  season.indice=[];
  return {lista:[],ativa:'',erro:e?.message||String(e)};
 }
}

export async function carregarSeason(id,{getDoc,doc,db}){
 const meta=season.indice.find(s=>s.id===id)||{id,nome:id,versao:0};
 const espelho=lerEspelho(id,meta.versao);
 if(espelho){
  aplicar(id,meta,espelho);
  return {qgs:espelho,origem:'espelho',leituras:0};
 }
 const snap=await getDoc(doc(db,'highos','data','seasons',id));
 if(!snap.exists())throw new Error(`A season "${id}" ainda não foi importada. Rode tools/importador-planilha.html.`);
 const d=snap.data();
 const qgs=Array.isArray(d.qgs)?d.qgs:[];
 gravarEspelho(id,d.versao||meta.versao||1,qgs);
 aplicar(id,{...meta,nome:d.nome||meta.nome,versao:d.versao||1},qgs);
 return {qgs,origem:'firestore',leituras:1};
}

function aplicar(id,meta,qgs){
 season.id=id;
 season.nome=meta.nome||id;
 season.versao=Number(meta.versao||0);
 season.qgs=qgs;
 season.groups=new Set(qgs.map(q=>norm(q.group)).filter(Boolean));
 season.carregada=true;
}

/* ---------- filtro ---------- */
/* Sem season carregada, nao escondemos nada: um filtro silencioso que
   some com tudo seria pior que nao filtrar. */
export function noElenco(group=''){
 if(!season.carregada)return true;
 return season.groups.has(norm(group));
}
export function filtrarPorSeason(lista=[]){
 if(!season.carregada)return lista;
 return lista.filter(f=>season.groups.has(norm(f.group)));
}

/* QGs da planilha que ainda nao tem Group vinculado: a fila de trabalho
   da virada de season. */
export function qgsSemVinculo(){
 return season.qgs.filter(q=>!q.vinculado);
}
/* Groups cadastrados no painel que nao estao na planilha da season:
   ou sobraram da season anterior, ou a planilha esqueceu deles. */
export function foraDaPlanilha(lista=[]){
 if(!season.carregada)return [];
 return lista.filter(f=>f.group&&!season.groups.has(norm(f.group)));
}

export function resumoSeason(listaFaccoes=[]){
 return {
  id:season.id,
  nome:season.nome,
  versao:season.versao,
  qgs:season.qgs.length,
  vinculados:season.qgs.filter(q=>q.vinculado).length,
  semVinculo:qgsSemVinculo().length,
  noPainel:filtrarPorSeason(listaFaccoes).length,
  foraDaPlanilha:foraDaPlanilha(listaFaccoes).length
 };
}
