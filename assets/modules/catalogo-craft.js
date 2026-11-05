/* High OS V13 - catalogo de craft e rota por segmento.
   ---------------------------------------------------------------------
   Ate aqui as receitas padrao moravam DENTRO do app.js, como constantes
   (ARMAS_STANDARD_RECIPES e companhia). Funcionavam, mas mudar uma
   quantidade exigia editar JavaScript e publicar - o que trava a equipe
   e concentra em quem mexe no codigo.

   Agora o catalogo mora no Firebase e e editavel no painel. As
   constantes viram a SEMENTE da primeira carga, entao nada quebra na
   virada e nenhuma receita se perde.

   A rota continua saindo da receita, nao sendo digitada: os insumos do
   craft sao o que a faccao precisa farmar. A novidade e que cada insumo
   diz DE ONDE vem, porque nem todo insumo se farma:

     FARM    - colhido na rota. E o padrao.
     CRAFT   - fabricado em outra receita. A rota puxa os insumos
               daquela receita, nao o item em si.
     VALOR   - dinheiro ou algo que nao se colhe. Fica fora da rota.

   Sem isso, um item intermediario entraria na rota como se fosse
   colhivel, e a faccao sairia procurando no mapa uma coisa que so
   existe na bancada. */

export const ORIGENS={
 FARM: {label:'Farm',  ajuda:'Colhido na rota'},
 CRAFT:{label:'Craft', ajuda:'Fabricado em outra receita'},
 VALOR:{label:'Valor', ajuda:'Dinheiro ou item não colhível'}
};

/* Nomes que sempre foram tratados como valor no codigo antigo. Viram
   padrao na migracao para ninguem precisar remarcar um por um. */
const VALOR_CONHECIDO=new Set(['dollar','money','cash','dirtymoney','black_money','dinheiro']);

export const DOC_CATALOGO=['highos','data','config','catalogo_craft'];

const txt=v=>String(v==null?'':v).trim();
const norm=v=>txt(v).normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase();

/* Aceita o formato antigo ([spawn, qtd]) e o novo ({spawn,qtd,origem}).
   A migracao nao reescreve dado salvo: le os dois. */
export function normalizarInsumo(x){
 if(Array.isArray(x)){
  const spawn=txt(x[0]);
  return {spawn,qtd:Number(x[1])||0,
   origem:VALOR_CONHECIDO.has(spawn.toLowerCase())?'VALOR':'FARM',receitaId:''};
 }
 const spawn=txt(x?.spawn);
 let origem=norm(x?.origem);
 if(!ORIGENS[origem])origem=VALOR_CONHECIDO.has(spawn.toLowerCase())?'VALOR':'FARM';
 return {spawn,qtd:Number(x?.qtd)||0,origem,receitaId:txt(x?.receitaId)};
}

export function normalizarReceita(r={}){
 return {
  id:txt(r.id)||('r_'+Math.random().toString(36).slice(2,9)),
  nome:txt(r.nome),
  spawn:txt(r.spawn),
  imagem:txt(r.imagem),
  nivel:r.nivel==null||r.nivel===''?'':Number(r.nivel)||0,
  max:r.max==null||r.max===''?'':Number(r.max)||0,
  insumos:(Array.isArray(r.insumos)?r.insumos:[]).map(normalizarInsumo).filter(i=>i.spawn)
 };
}

export function normalizarCatalogo(d={}){
 const segs={};
 for(const [nome,bloco] of Object.entries(d?.segmentos||{})){
  segs[nome]={
   receitas:(Array.isArray(bloco?.receitas)?bloco.receitas:[]).map(normalizarReceita)
  };
 }
 return {versao:Number(d?.versao||0),segmentos:segs};
}

/* ---------- semeadura ---------- */
/* Monta o catalogo inicial a partir das constantes que estao no codigo,
   para a primeira carga ja vir com tudo que a cidade usa hoje. */
export function semearCatalogo(porSegmento={}){
 const segmentos={};
 for(const [seg,receitas] of Object.entries(porSegmento)){
  segmentos[seg]={receitas:(receitas||[]).map(normalizarReceita)};
 }
 return {versao:1,segmentos};
}

/* ---------- rota ---------- */
/* A rota e o que a faccao precisa COLHER. Um insumo CRAFT nao entra:
   entra o que a receita dele pede. O limite de profundidade evita que
   duas receitas apontando uma para a outra travem a tela. */
export function rotaDaReceita(receita,catalogo,{profundidade=4}={}){
 const todas=[];
 for(const bloco of Object.values(catalogo?.segmentos||{}))todas.push(...(bloco.receitas||[]));
 const porId=new Map(todas.map(r=>[r.id,r]));
 const porSpawn=new Map(todas.map(r=>[r.spawn.toLowerCase(),r]));

 const saida=new Map();
 const visitados=new Set();

 function andar(r,fator,nivel){
  if(!r||nivel>profundidade)return;
  if(visitados.has(r.id))return;          // ciclo: para e segue
  visitados.add(r.id);
  for(const ins of r.insumos||[]){
   if(ins.origem==='VALOR')continue;
   if(ins.origem==='CRAFT'){
    const sub=porId.get(ins.receitaId)||porSpawn.get(ins.spawn.toLowerCase());
    if(sub){andar(sub,fator*(ins.qtd||1),nivel+1);continue}
    /* Marcado como craft mas sem receita cadastrada: cai para farm e
       avisa, em vez de sumir da rota em silencio. */
    juntar(ins,fator,true);
    continue;
   }
   juntar(ins,fator,false);
  }
  visitados.delete(r.id);
 }

 function juntar(ins,fator,semReceita){
  const k=ins.spawn.toLowerCase();
  const cur=saida.get(k)||{spawn:ins.spawn,qtd:0,semReceita:false};
  cur.qtd+=(ins.qtd||0)*fator;
  if(semReceita)cur.semReceita=true;
  saida.set(k,cur);
 }

 andar(receita,1,0);
 return [...saida.values()].sort((a,b)=>b.qtd-a.qtd);
}

/* Rota consolidada de um segmento inteiro: o que a faccao daquele eixo
   precisa colher para dar conta de todas as receitas. */
export function rotaDoSegmento(segmento,catalogo){
 const receitas=catalogo?.segmentos?.[segmento]?.receitas||[];
 const soma=new Map();
 for(const r of receitas){
  for(const it of rotaDaReceita(r,catalogo)){
   const cur=soma.get(it.spawn.toLowerCase())||{spawn:it.spawn,qtd:0,receitas:0,semReceita:false};
   cur.qtd+=it.qtd; cur.receitas++;
   if(it.semReceita)cur.semReceita=true;
   soma.set(it.spawn.toLowerCase(),cur);
  }
 }
 return [...soma.values()].sort((a,b)=>b.receitas-a.receitas||b.qtd-a.qtd);
}

/* ---------- conferencia ---------- */
/* Problemas que travam a entrega, separados dos que so incomodam. */
export function conferirCatalogo(catalogo){
 const erros=[],avisos=[];
 const vistos=new Map();

 for(const [seg,bloco] of Object.entries(catalogo?.segmentos||{})){
  for(const r of bloco.receitas||[]){
   const onde=`${seg} · ${r.nome||r.id}`;
   if(!r.nome)erros.push(`${onde}: receita sem nome.`);
   if(!r.spawn)erros.push(`${onde}: sem spawn do produto final.`);
   if(!r.insumos.length)erros.push(`${onde}: nenhum insumo cadastrado.`);
   if(r.spawn){
    const ja=vistos.get(r.spawn.toLowerCase());
    if(ja)avisos.push(`${onde}: mesmo spawn de "${ja}".`);
    else vistos.set(r.spawn.toLowerCase(),onde);
   }
   for(const i of r.insumos){
    if(!i.qtd)avisos.push(`${onde}: "${i.spawn}" sem quantidade.`);
    if(i.origem==='CRAFT'&&!i.receitaId&&!temReceitaComSpawn(catalogo,i.spawn))
     erros.push(`${onde}: "${i.spawn}" está marcado como Craft mas não existe receita para ele.`);
   }
  }
 }
 return {erros,avisos,ok:!erros.length};
}

function temReceitaComSpawn(catalogo,spawn){
 const alvo=txt(spawn).toLowerCase();
 return Object.values(catalogo?.segmentos||{})
  .some(b=>(b.receitas||[]).some(r=>r.spawn.toLowerCase()===alvo));
}

/* Lista de receitas de outros segmentos, para escolher a origem de um
   insumo marcado como Craft. */
export function receitasDisponiveis(catalogo,exceto=''){
 const out=[];
 for(const [seg,bloco] of Object.entries(catalogo?.segmentos||{})){
  for(const r of bloco.receitas||[]){
   if(r.id===exceto)continue;
   out.push({id:r.id,nome:r.nome||r.spawn,spawn:r.spawn,segmento:seg});
  }
 }
 return out.sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));
}

export function resumoCatalogo(catalogo){
 const segs=Object.entries(catalogo?.segmentos||{});
 return {
  segmentos:segs.length,
  receitas:segs.reduce((s,[,b])=>s+(b.receitas||[]).length,0),
  insumos:segs.reduce((s,[,b])=>s+(b.receitas||[]).reduce((t,r)=>t+r.insumos.length,0),0),
  semReceita:segs.filter(([,b])=>!(b.receitas||[]).length).map(([n])=>n)
 };
}
