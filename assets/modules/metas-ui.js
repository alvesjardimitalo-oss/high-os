/* High OS V13 - tela das metas de recrutamento.
   ---------------------------------------------------------------------
   A meta e o que a organizacao se compromete a entregar em troca do
   beneficio ("Vip Org Ultra caso bater a meta"). Ela e negociada no
   atendimento, caso a caso, e muda - por isso mora no painel e nao na
   planilha: quem edita a planilha nao e quem faz o acordo.

   A tela e uma lista editavel de propósito. Definir meta e trabalho de
   lote: na virada de season sao dezenas de Groups de uma vez, e abrir
   um modal por organizacao transformaria dez minutos em uma hora. */

import {normalizarMeta,DIAS_SIGLA,avaliarSemana,chaveSemana,rotuloSemana} from './recrutamento.js?v=13.0.0';

export const PERIODOS=[
 ['SEMANA','por semana'],
 ['DIA','por dia']
];

export function metaDoGroup(f={}){
 return normalizarMeta(f.metaRec ?? f.meta_rec ?? '');
}

export function textoMeta(m){
 if(!m)return '';
 if(m.periodo==='DIA'){
  return m.dias?.length
   ? `${m.quantidade} por dia · ${m.dias.join(', ')}`
   : `${m.quantidade} por dia`;
 }
 return `${m.quantidade} por semana`;
}

/* Alvo semanal equivalente, para comparar metas de formatos diferentes
   lado a lado sem a pessoa ter que fazer a conta de cabeca. */
export function alvoSemanal(m){
 if(!m)return 0;
 return m.periodo==='DIA' ? m.quantidade*(m.dias?.length||7) : m.quantidade;
}

export function resumoMetas(groups=[]){
 const com=groups.filter(f=>metaDoGroup(f));
 return {
  total:groups.length,
  comMeta:com.length,
  semMeta:groups.length-com.length,
  alvoTotal:com.reduce((s,f)=>s+alvoSemanal(metaDoGroup(f)),0)
 };
}

export function metasHtml({groups=[],esc,podeEditar,filtro={},resumoRec=null}){
 if(!groups.length){
  return `<div class="placeholder"><b>◆</b><h3>NENHUM GROUP NESTA SEASON</h3>
   <p>A meta é definida por organização. Defina os Groups em <b>QGs da Season</b> e eles aparecem aqui.</p></div>`;
 }
 const r=resumoMetas(groups);
 const busca=String(filtro.busca||'').toLowerCase();
 const soSem=!!filtro.soSemMeta;
 const semana=chaveSemana(new Date().toISOString().slice(0,10));

 const lista=groups.filter(f=>{
  if(soSem&&metaDoGroup(f))return false;
  if(busca&&!`${f.group} ${f.faccao||''} ${f.qg||''} ${f.segmento||''}`.toLowerCase().includes(busca))return false;
  return true;
 });

 return `
 <div class="meta-resumo">
  <div><b>${r.total}</b><span>ORGANIZAÇÕES</span></div>
  <div><b class="ok">${r.comMeta}</b><span>COM META</span></div>
  <div${r.semMeta?' class="alerta"':''}><b>${r.semMeta}</b><span>SEM META</span></div>
  <div><b>${r.alvoTotal}</b><span>RECS/SEMANA COMBINADOS</span></div>
 </div>

 ${resumoRec?'':`<div class="meta-aviso">
   <b>Ainda não há registro de recrutamento</b>
   As metas podem ser definidas agora. O realizado aparece quando a planilha de recrutamento estiver no ar — uma linha por rec, com Group, data e hora.
  </div>`}

 <div class="meta-filtros">
  <input id="metaBusca" placeholder="Buscar Group, facção, favela ou segmento..." value="${esc(filtro.busca||'')}">
  <label class="meta-check"><input type="checkbox" id="metaSoSem"${soSem?' checked':''}> só sem meta</label>
 </div>

 ${lista.length?`<div class="meta-lista">
   <div class="meta-cab">
    <span>ORGANIZAÇÃO</span><span>QUANTIDADE</span><span>PERÍODO</span><span>DIAS</span><span>EQUIVALE A</span><span></span>
   </div>
   ${lista.map(f=>linhaMeta(f,esc,podeEditar,semana,resumoRec)).join('')}
  </div>`:`<div class="placeholder peq"><h3>NADA NESSE FILTRO</h3></div>`}`;
}

function linhaMeta(f,esc,podeEditar,semana,resumoRec){
 const m=metaDoGroup(f);
 const alvo=alvoSemanal(m);
 const ocupada=String(f.faccao||'').trim();
 const feito=resumoRec?avaliarSemana(resumoRec.groups?.[String(f.group).toUpperCase()],semana,f.metaRec):null;

 return `<div class="meta-linha${m?'':' sem'}" data-meta-group="${esc(f.group)}">
  <div class="meta-org">
   <b>${esc(f.group)}</b>
   <small>${ocupada?esc(ocupada):'<i>sem facção</i>'}${f.qg?' · '+esc(f.qg):''}</small>
  </div>
  <label><input type="number" min="0" step="1" data-m="quantidade" value="${m?m.quantidade:''}" placeholder="0" ${podeEditar?'':'disabled'}></label>
  <label><select data-m="periodo" ${podeEditar?'':'disabled'}>
    ${PERIODOS.map(([k,v])=>`<option value="${k}"${m?.periodo===k?' selected':''}>${esc(v)}</option>`).join('')}
   </select></label>
  <div class="meta-dias" data-dias${m?.periodo==='DIA'?'':' hidden'}>
   ${DIAS_SIGLA.map(d=>`<button type="button" class="${m?.dias?.includes(d)?'on':''}" data-dia="${d}" ${podeEditar?'':'disabled'}>${d[0]}${d[1].toLowerCase()}</button>`).join('')}
  </div>
  <div class="meta-alvo">${alvo?`<b>${alvo}</b> rec/semana`:'<i>sem meta</i>'}
   ${feito&&feito.meta?`<small class="s-${feito.status.toLowerCase()}">${feito.feito} feitos · ${feito.percentual}%</small>`:''}
  </div>
  <div class="meta-acao">
   ${podeEditar?`<button type="button" class="mini-btn" data-salvar-meta="${esc(f.group)}">SALVAR</button>`:''}
  </div>
 </div>`;
}

/* Le uma linha de volta para o formato que o modulo de recrutamento
   entende. Quantidade zerada ou vazia significa SEM META, nao meta de
   zero: combinar zero recrutamento nao e um acordo. */
export function lerLinha(raiz){
 const q=Number(raiz.querySelector('[data-m="quantidade"]')?.value||0);
 if(!q)return null;
 const periodo=raiz.querySelector('[data-m="periodo"]')?.value||'SEMANA';
 const dias=periodo==='DIA'
  ? [...raiz.querySelectorAll('[data-dia].on')].map(b=>b.dataset.dia)
  : [];
 return {quantidade:q,periodo,dias};
}
