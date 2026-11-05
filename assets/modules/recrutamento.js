/* High OS V13 - meta de recrutamento das organizacoes.
   A planilha entrega UM EVENTO POR LINHA: cada recrutamento feito.
   Do log da para tirar qualquer agregado; do agregado nunca se volta
   ao detalhe - por isso o contrato com o dev e no nivel do evento.

   No Firestore nao guardamos evento por evento: isso estouraria a cota
   e o limite do documento. Guardamos um RESUMO por mes, com contagem
   por dia, histograma por hora e os recrutadores que mais puxaram.
   O detalhe fino continua na planilha, que e de graca e e a fonte. */

const SEM_ACENTO=v=>String(v==null?'':v).normalize('NFD').replace(/[̀-ͯ]/g,'');
export const normCol=v=>SEM_ACENTO(v).replace(/\s+/g,' ').trim().toUpperCase().replace(/[:.]+$/,'');

/* Sinonimos aceitos para cada coluna. O dev pode escrever o cabecalho
   do jeito dele que o leitor continua achando - o que nao pode e o
   significado mudar. */
export const COLUNAS={
 group:['GROUP','GRUPO','ORGANIZACAO','ORGANIZACAO/GROUP','ORG'],
 data:['DATA','DIA','DATA DO REC','DATA REC'],
 hora:['HORA','HORARIO','HORA DO REC'],
 recrutado:['ID RECRUTADO','RECRUTADO','ID','PASSAPORTE','ID DO RECRUTADO','MEMBRO'],
 recrutador:['RECRUTADOR','QUEM RECRUTOU','ID RECRUTADOR','RESPONSAVEL']
};

/* Datas da cidade vem em dd/mm/aaaa; aceitamos tambem aaaa-mm-dd para
   o caso de o dev exportar no padrao do banco. Devolve aaaa-mm-dd. */
export function normData(v=''){
 const t=String(v==null?'':v).trim();
 if(!t)return '';
 let m=t.match(/^(\d{4})-(\d{2})-(\d{2})/);
 if(m)return `${m[1]}-${m[2]}-${m[3]}`;
 m=t.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
 if(!m)return '';
 const d=m[1].padStart(2,'0'), mes=m[2].padStart(2,'0');
 let ano=m[3];
 if(ano.length===2)ano='20'+ano;
 return `${ano}-${mes}-${d}`;
}

export function normHora(v=''){
 const m=String(v==null?'':v).trim().match(/^(\d{1,2})[:h](\d{2})/i);
 if(!m)return '';
 const h=Math.min(23,Number(m[1]));
 return String(h).padStart(2,'0')+':'+m[2];
}

/* Segunda como primeiro dia: a meta das orgs e fechada por semana
   cheia, e a cidade conta a semana comecando na segunda. */
export function chaveSemana(iso=''){
 if(!iso)return '';
 const d=new Date(iso+'T12:00:00');
 if(isNaN(d))return '';
 const dow=(d.getDay()+6)%7;
 d.setDate(d.getDate()-dow);
 return d.toISOString().slice(0,10);
}
export function rotuloSemana(chave=''){
 if(!chave)return '';
 const a=new Date(chave+'T12:00:00'), b=new Date(a);
 b.setDate(b.getDate()+6);
 const br=x=>x.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});
 return `${br(a)} a ${br(b)}`;
}

/* ---------- leitura do log ---------- */
/* Acha o cabecalho procurando a linha que tem GROUP e DATA juntos:
   assim o dev pode por titulo, logo ou linhas em branco em cima sem
   quebrar a leitura. */
export function acharCabecalho(grade=[]){
 for(let r=0;r<Math.min(grade.length,40);r++){
  const linha=(grade[r]||[]).map(normCol);
  const achou={};
  for(const [campo,nomes] of Object.entries(COLUNAS)){
   const i=linha.findIndex(c=>c&&nomes.includes(c));
   if(i>=0)achou[campo]=i;
  }
  if(achou.group!==undefined&&achou.data!==undefined)return {linha:r,mapa:achou};
 }
 return null;
}

export function parseRecLog(grade=[]){
 const cab=acharCabecalho(grade);
 if(!cab)return {eventos:[],problemas:['Não achei o cabeçalho. A planilha precisa de uma linha com as colunas GROUP e DATA.'],colunas:null};

 const {mapa}=cab;
 const eventos=[], problemas=[], vistos=new Set();
 let semData=0, semGroup=0;

 for(let r=cab.linha+1;r<grade.length;r++){
  const linha=grade[r]||[];
  const cru=i=>i===undefined?'':String(linha[i]==null?'':linha[i]).trim();

  const group=cru(mapa.group).toUpperCase();
  const data=normData(cru(mapa.data));
  if(!group&&!data)continue;
  if(!group){semGroup++;continue}
  if(!data){semData++;continue}

  const ev={
   group,
   data,
   hora:normHora(cru(mapa.hora)),
   recrutado:cru(mapa.recrutado),
   recrutador:cru(mapa.recrutador),
   linha:r+1
  };
  /* Planilha de bot costuma repetir linha em reprocessamento. */
  const digital=[ev.group,ev.data,ev.hora,ev.recrutado].join('|');
  if(ev.recrutado&&vistos.has(digital)){continue}
  if(ev.recrutado)vistos.add(digital);
  eventos.push(ev);
 }

 if(semGroup)problemas.push(`${semGroup} linha(s) sem GROUP foram ignoradas.`);
 if(semData)problemas.push(`${semData} linha(s) com data ilegível foram ignoradas.`);
 if(!eventos.length)problemas.push('Achei o cabeçalho mas nenhuma linha de recrutamento válida.');

 return {eventos,problemas,colunas:Object.keys(mapa)};
}

/* ---------- resumo que vai para o Firestore ---------- */
/* Compacto de proposito: contagem por dia, histograma de 24 horas e os
   recrutadores que mais puxaram. Responde "dia forte", "horario forte"
   e "quem puxa" sem guardar evento por evento. */
export const TOPO_RECRUTADORES=15;

export function resumirMes(eventos=[],mes=''){
 const alvo=mes||(eventos[0]?.data||'').slice(0,7);
 const groups={};
 let fora=0;

 for(const ev of eventos){
  if(alvo&&ev.data.slice(0,7)!==alvo){fora++;continue}
  const g=groups[ev.group]||(groups[ev.group]={total:0,dias:{},horas:{},recrutadores:{}});
  g.total++;
  g.dias[ev.data]=(g.dias[ev.data]||0)+1;
  if(ev.hora){const h=ev.hora.slice(0,2);g.horas[h]=(g.horas[h]||0)+1}
  if(ev.recrutador)g.recrutadores[ev.recrutador]=(g.recrutadores[ev.recrutador]||0)+1;
 }

 for(const g of Object.values(groups)){
  const topo=Object.entries(g.recrutadores).sort((a,b)=>b[1]-a[1]).slice(0,TOPO_RECRUTADORES);
  g.recrutadores=Object.fromEntries(topo);
 }

 return {
  mes:alvo,
  groups,
  total:Object.values(groups).reduce((s,g)=>s+g.total,0),
  qtdGroups:Object.keys(groups).length,
  foraDoMes:fora,
  geradoEm:new Date().toISOString()
 };
}

/* ---------- meta x realizado ---------- */
/* A meta mora no cadastro da faccao, nao na planilha: ela e negociada
   na entrega e muda no atendimento, sem depender de quem edita a
   planilha. Formatos aceitos:
     {quantidade:3, periodo:'SEMANA'}
     {quantidade:1, periodo:'DIA', dias:['SEX','SAB']}  */
export const DIAS_SIGLA=['DOM','SEG','TER','QUA','QUI','SEX','SAB'];

export function normalizarMeta(meta){
 if(meta==null||meta==='')return null;
 if(typeof meta==='object'&&meta.quantidade!=null){
  return {
   quantidade:Number(meta.quantidade)||0,
   periodo:String(meta.periodo||'SEMANA').toUpperCase()==='DIA'?'DIA':'SEMANA',
   dias:Array.isArray(meta.dias)?meta.dias.map(d=>normCol(d).slice(0,3)):[]
  };
 }
 /* "3 rec por semana" digitado a mao no atendimento. */
 const t=SEM_ACENTO(String(meta)).toUpperCase();
 const n=Number((t.match(/(\d+)/)||[])[1]||0);
 if(!n)return null;
 const dias=DIAS_SIGLA.filter(d=>t.includes(d));
 if(dias.length)return {quantidade:n,periodo:'DIA',dias};
 return {quantidade:n,periodo:/\bDIA\b|DIARI/.test(t)?'DIA':'SEMANA',dias:[]};
}

/* Quantos recs a org fez na semana, e se bateu o combinado. */
export function avaliarSemana(resumoGroup,semanaChave,meta){
 const m=normalizarMeta(meta);
 const dias=resumoGroup?.dias||{};
 const naSemana=Object.entries(dias).filter(([iso])=>chaveSemana(iso)===semanaChave);
 const feito=naSemana.reduce((s,[,n])=>s+n,0);

 if(!m)return {feito,meta:null,status:'SEM_META',alvo:0,falta:0,semana:semanaChave};

 let alvo=m.quantidade;
 if(m.periodo==='DIA'){
  /* meta diaria: o alvo da semana e a quantidade vezes os dias
     combinados (ou os 7 dias, quando nenhum dia foi fixado). */
  alvo=m.quantidade*(m.dias.length||7);
 }
 const falta=Math.max(0,alvo-feito);
 let status='ABAIXO';
 if(feito>=alvo)status='BATEU';
 else if(alvo&&feito>=alvo*0.7)status='PERTO';
 if(!feito)status='ZERADO';

 return {feito,meta:m,alvo,falta,status,semana:semanaChave,
  percentual:alvo?Math.round(feito/alvo*100):0};
}

/* Fecha a semana de todas as orgs de uma vez, para o relatorio. */
export function fecharSemana(resumo,metasPorGroup={},semanaChave){
 const linhas=[];
 for(const [group,g] of Object.entries(resumo?.groups||{})){
  linhas.push({group,...avaliarSemana(g,semanaChave,metasPorGroup[group])});
 }
 /* Pior primeiro: o relatorio existe para achar quem precisa de acao. */
 const ordem={ZERADO:0,ABAIXO:1,PERTO:2,BATEU:3,SEM_META:4};
 linhas.sort((a,b)=>(ordem[a.status]-ordem[b.status])||(a.percentual-b.percentual));
 return linhas;
}

export function horaForte(resumoGroup){
 const e=Object.entries(resumoGroup?.horas||{}).sort((a,b)=>b[1]-a[1])[0];
 return e?{hora:e[0]+'H',quantidade:e[1]}:null;
}
export function diaForte(resumoGroup){
 const e=Object.entries(resumoGroup?.dias||{}).sort((a,b)=>b[1]-a[1])[0];
 return e?{data:e[0],quantidade:e[1]}:null;
}
