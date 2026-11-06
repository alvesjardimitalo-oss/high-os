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
/* A season de um registro e o seasonId dele, nao o nome do Group.
   Enquanto a separacao era por nome, duas seasons nao podiam ter um
   Armas01 cada - eram o mesmo registro aos olhos do filtro.
   Registros antigos, de antes do seasonId, continuam entrando pelo
   nome: e o unico sinal que eles tem. */
export function filtrarPorSeason(lista=[]){
 if(!season.carregada)return lista;
 /* Um registro antigo sem seasonId so entra pelo nome se nenhum
    registro desta season ja usa esse nome - senao o Armas01 da
    season passada apareceria ao lado do Armas01 desta. */
 const daSeason=new Set(lista
  .filter(f=>String(f.seasonId||'').trim()===String(season.id||''))
  .map(f=>norm(f.group)));
 return lista.filter(f=>{
  const sid=String(f.seasonId||'').trim();
  if(sid)return sid===String(season.id||'');
  const nm=norm(f.group);
  return season.groups.has(nm)&&!daSeason.has(nm);
 });
}
/* Chave de armazenamento do Group. O nome e so o rotulo; quem separa
   e a season. Registro antigo sem season mantem a chave antiga para
   nao virar um registro novo e orfao. */
export function chaveFaccao(group='',seasonId=''){
 const g=String(group||'').trim().toLowerCase();
 const s=String(seasonId||'').trim().toLowerCase();
 /* Mesmo formato que o bot usa (src/season.js). Os dois tem que compor a
    chave igual, senao o painel grava num registro e le de outro. */
 return s?`${s}::${g}`:g;
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

/* =====================================================================
   V13 · ESCRITA — o Firebase e o banco
   ---------------------------------------------------------------------
   A planilha semeia a season e serve de espelho para a equipe alimentar
   quando quiser, mas quem manda e o que esta gravado aqui. Entao o
   painel precisa poder gravar, nao so ler.

   Todas as gravacoes passam por transacao: a season inteira mora em UM
   documento, entao duas pessoas editando QGs diferentes ao mesmo tempo
   se sobrescreveriam sem isso. A transacao le, aplica e grava de uma
   vez; se outro gravou no meio, o Firestore repete sozinho.

   Custo: 1 leitura + 1 escrita por alteracao, independente de quantos
   QGs a season tenha.
   ===================================================================== */

export async function salvarQg(fns,chave,mudancas,usuario=''){
 const {db,doc,runTransaction,serverTimestamp}=fns;
 if(!season.id)throw new Error('Nenhuma season ativa.');
 const ref=doc(db,'highos','data','seasons',season.id);
 let novoQg=null;

 await runTransaction(db,async tx=>{
  const snap=await tx.get(ref);
  if(!snap.exists())throw new Error('A season sumiu do banco.');
  const d=snap.data();
  const qgs=Array.isArray(d.qgs)?[...d.qgs]:[];
  const i=qgs.findIndex(q=>q.chave===chave);
  if(i<0)throw new Error(`QG "${chave}" não existe nesta season.`);
  novoQg={...qgs[i],...mudancas};
  novoQg.vinculado=!!String(novoQg.group||'').trim();
  novoQg.cds=novoQg.cds||{};
  qgs[i]=novoQg;
  tx.set(ref,{...d,qgs,versao:Number(d.versao||1)+1,
   atualizadaEm:serverTimestamp(),atualizadaPor:usuario},{merge:false});
 });

 /* O espelho local guarda por versao; depois de gravar ele esta velho.
    Limpamos para a proxima leitura vir do banco. */
 try{localStorage.removeItem(CHAVE_PACOTE+season.id)}catch(e){}
 aplicarLocal(chave,novoQg);
 return novoQg;
}

/* Atualiza o estado em memoria sem reler o Firestore. */
function aplicarLocal(chave,novoQg){
 const i=season.qgs.findIndex(q=>q.chave===chave);
 if(i>=0)season.qgs[i]=novoQg;
 season.versao++;
 season.groups=new Set(season.qgs.map(q=>String(q.group||'')
  .normalize('NFD').replace(/[̀-ͯ]/g,'').trim().toUpperCase()).filter(Boolean));
}

export async function vincularGroup(fns,chave,group,usuario=''){
 const g=String(group||'').trim();
 if(!g)throw new Error('Informe o nome do Group.');
 const jaUsado=season.qgs.find(q=>q.chave!==chave&&
  String(q.group||'').trim().toUpperCase()===g.toUpperCase());
 if(jaUsado)throw new Error(`O Group "${g}" já está no QG "${jaUsado.local||jaUsado.chave}".`);
 return salvarQg(fns,chave,{group:g},usuario);
}

export async function desvincularGroup(fns,chave,usuario=''){
 return salvarQg(fns,chave,{group:''},usuario);
}
