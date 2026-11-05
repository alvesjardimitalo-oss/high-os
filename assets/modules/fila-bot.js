/* High OS V13 - fila de atualizacoes para o bot.
   ---------------------------------------------------------------------
   O bot e uma API HTTP que roda no PC de casa, exposta por Tailscale.
   Com a maquina desligada o painel entrava em contingencia e RECUSAVA
   qualquer gravacao - decisao consciente de quem escreveu, para nunca
   fingir que salvou. O preco era nao poder trabalhar fora de casa.

   Esta fila troca "recusar" por "guardar para depois", sem fingir nada:
   a alteracao fica gravada no Firestore com status PENDENTE, a pessoa
   ve quantas estao na fila, e quando o PC volta as operacoes sao
   reenviadas ao bot NA ORDEM em que foram feitas.

   Custo de leitura, que e o ponto que motivou isso:
   - no login le UM documento (o contador). Se nao ha pendencia, para
     ali: nao toca na colecao.
   - so quando ha pendencia e que a colecao e consultada, e mesmo assim
     filtrada por status, nunca inteira.

   O contador e atualizado no MESMO lote da operacao, entao ele nunca
   diverge da fila - ou os dois gravam, ou nenhum. */

export const DOC_STATUS=['highos','fila_bot_status'];
export const COL_FILA=['highos','data','fila_bot'];

export const PENDENTE='PENDENTE';
export const ENVIADO='ENVIADO';
export const ERRO='ERRO';

/* Metodos que mudam estado. Leitura nunca entra na fila: ler offline
   devolve o cache, nao faz sentido reexecutar depois. */
const MUTACOES=new Set(['POST','PUT','PATCH','DELETE']);
export const mutacao=metodo=>MUTACOES.has(String(metodo||'GET').toUpperCase());

/* fns: {db, doc, collection, getDoc, getDocs, setDoc, serverTimestamp,
         writeBatch, query, where, orderBy, limit} vindos do app, para
   este modulo nao abrir conexao propria com o Firebase. */

/* ---------- contador ---------- */
export async function lerStatusFila(fns){
 const {db,doc,getDoc}=fns;
 try{
  const snap=await getDoc(doc(db,...DOC_STATUS));
  const d=snap.exists()?snap.data():{};
  return {
   pendentes:Number(d.pendentes||0),
   ultimoEm:d.ultimoEm||null,
   ultimaDrenagem:d.ultimaDrenagem||null
  };
 }catch(e){
  /* Sem o contador nao da para afirmar que a fila esta vazia. Dizemos
     "nao sei" em vez de "zero", para a interface nao prometer o que
     nao checou. */
  return {pendentes:null,erro:e?.message||String(e)};
 }
}

/* ---------- enfileirar ---------- */
export async function enfileirar(fns,{caminho,metodo,corpo,resumo,usuario}){
 const {db,doc,collection,setDoc,serverTimestamp,writeBatch}=fns;
 if(!caminho)throw new Error('Fila: operação sem caminho da API.');
 const ref=doc(collection(db,...COL_FILA));
 const lote=writeBatch(db);
 lote.set(ref,{
  caminho,
  metodo:String(metodo||'PUT').toUpperCase(),
  corpo:corpo??null,
  resumo:String(resumo||caminho),
  status:PENDENTE,
  tentativas:0,
  erro:'',
  criadoEm:serverTimestamp(),
  criadoPor:usuario||'',
  /* Ordem local: serverTimestamp so existe depois do commit, e a
     drenagem precisa ordenar sem esperar o servidor responder. */
  ordem:Date.now()
 });
 lote.set(doc(db,...DOC_STATUS),{
  pendentes:await proximoContador(fns,+1),
  ultimoEm:serverTimestamp(),
  ultimoPor:usuario||''
 },{merge:true});
 await lote.commit();
 return ref.id;
}

/* O contador e recalculado a partir do valor atual lido; nao usamos
   increment() para o numero nunca ficar negativo se algo se perder no
   caminho - um contador errado para baixo esconderia pendencia. */
async function proximoContador(fns,delta){
 const atual=await lerStatusFila(fns);
 const base=Number.isFinite(atual.pendentes)?atual.pendentes:0;
 return Math.max(0,base+delta);
}

/* ---------- leitura da fila ---------- */
export async function listarPendentes(fns,max=200){
 const {db,collection,getDocs,query,where,orderBy,limit}=fns;
 const q=query(collection(db,...COL_FILA),where('status','==',PENDENTE),orderBy('ordem'),limit(max));
 const qs=await getDocs(q);
 return qs.docs.map(d=>({id:d.id,...d.data()}));
}

/* ---------- drenagem ---------- */
/* Reenvia as operacoes NA ORDEM, uma de cada vez. Paralelizar aqui
   seria trocar a ordem dos fatos: duas edicoes do mesmo Group chegariam
   invertidas e a mais antiga venceria.

   Na primeira falha a drenagem PARA. Continuar depois de um erro
   aplicaria operacoes fora de ordem sobre um estado que ja divergiu. */
export async function drenar(fns,executar,{aoProgredir}={}){
 const {db,doc,setDoc,serverTimestamp}=fns;
 const pendentes=await listarPendentes(fns);
 const relatorio={total:pendentes.length,enviados:0,falhou:null,parouEm:null};

 for(const item of pendentes){
  try{
   await executar(item);
   await setDoc(doc(db,...COL_FILA,item.id),{
    status:ENVIADO,enviadoEm:serverTimestamp(),erro:''
   },{merge:true});
   relatorio.enviados++;
   aoProgredir?.(relatorio.enviados,relatorio.total,item);
  }catch(e){
   await setDoc(doc(db,...COL_FILA,item.id),{
    status:ERRO,
    erro:String(e?.message||e),
    tentativas:Number(item.tentativas||0)+1,
    tentadoEm:serverTimestamp()
   },{merge:true});
   relatorio.falhou=String(e?.message||e);
   relatorio.parouEm=item;
   break;
  }
 }

 await setDoc(doc(db,...DOC_STATUS),{
  pendentes:Math.max(0,relatorio.total-relatorio.enviados),
  ultimaDrenagem:serverTimestamp()
 },{merge:true});

 return relatorio;
}

/* Um item marcado ERRO nao volta sozinho para a fila: alguem precisa
   olhar o que aconteceu antes de reenviar. */
export async function reenfileirar(fns,id){
 const {db,doc,setDoc,serverTimestamp}=fns;
 await setDoc(doc(db,...COL_FILA,id),{status:PENDENTE,erro:'',reenfileiradoEm:serverTimestamp()},{merge:true});
 const n=await proximoContador(fns,+1);
 await setDoc(doc(db,...DOC_STATUS),{pendentes:n},{merge:true});
}

export async function descartar(fns,id){
 const {db,doc,setDoc,serverTimestamp}=fns;
 await setDoc(doc(db,...COL_FILA,id),{status:'DESCARTADO',descartadoEm:serverTimestamp()},{merge:true});
 const n=await proximoContador(fns,-1);
 await setDoc(doc(db,...DOC_STATUS),{pendentes:n},{merge:true});
}

/* Descricao curta para a pessoa reconhecer a operacao na lista, sem
   precisar abrir o corpo do pedido. */
export function resumirOperacao(caminho='',metodo='',corpo=null){
 const m=String(metodo||'').toUpperCase();
 let alvo=decodeURIComponent(String(caminho).split('?')[0]);
 const fac=alvo.match(/^\/v1\/factions\/(.+)$/);
 if(fac)return `${m==='DELETE'?'Remover':'Salvar'} facção ${fac[1]}`;
 const st=alvo.match(/^\/v1\/store\/([^/]+)(?:\/(.+))?$/);
 if(st)return `${m==='DELETE'?'Remover':'Salvar'} ${st[1]}${st[2]?' · '+st[2]:''}`;
 return `${m} ${alvo}`;
}
