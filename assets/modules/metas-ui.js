/* High OS V13 - metas de recrutamento por organizacao.
   ---------------------------------------------------------------------
   A meta e negociada na entrega, caso a caso, e muda durante o
   atendimento - por isso ela mora no painel, no cadastro do Group, e
   nao na planilha. A planilha do dev vai trazer o REALIZADO; o alvo
   e combinado aqui.

   Duas formas de combinar, porque a cidade usa as duas:
     SEMANA - "3 rec por semana", sem dizer em que dia.
     DIA    - "1 rec por dia, sexta e sabado". O alvo da semana vira a
              quantidade vezes os dias combinados.

   A tela mostra o alvo semanal calculado ao lado do que foi digitado,
   para ninguem combinar 1 por dia em sete dias achando que pediu 1.
*/

import {normalizarMeta,DIAS_SIGLA} from './recrutamento.js?v=13.0.0';

export {DIAS_SIGLA};

/* Alvo da semana a partir da meta, que e o numero que importa na
   cobranca - uma meta diaria em dois dias nao e a mesma coisa que uma
   meta semanal de dois. */
export function alvoSemanal(meta){
 const m=normalizarMeta(meta);
 if(!m)return 0;
 return m.periodo==='DIA' ? m.quantidade*(m.dias.length||7) : m.quantidade;
}

export function descreverMeta(meta){
 const m=normalizarMeta(meta);
 if(!m)return 'sem meta combinada';
 if(m.periodo==='SEMANA')return `${m.quantidade} por semana`;
 const dias=m.dias.length?m.dias.join(', '):'todos os dias';
 return `${m.quantidade} por dia em ${dias} — ${alvoSemanal(m)} na semana`;
}

export function resumoMetas(lista=[]){
 const com=lista.filter(f=>normalizarMeta(f.metaRec));
 return {
  total:lista.length,
  comMeta:com.length,
  semMeta:lista.length-com.length,
  alvoTotal:com.reduce((s,f)=>s+alvoSemanal(f.metaRec),0)
 };
}

export function metasHtml({lista=[],season,esc,podeEditar,filtro={}}){
 if(!season?.carregada){
  return `<div class="placeholder"><b>◆</b><h3>NENHUMA SEASON ATIVA</h3>
   <p>Escolha uma season no topo para definir as metas dela.</p></div>`;
 }
 if(!lista.length){
  return `<div class="placeholder"><b>◆</b><h3>A ${esc(season.nome)} AINDA NÃO TEM GROUP</h3>
   <p>A meta é combinada com a organização que ocupa um Group. Defina os Groups em <b>QGs da Season</b> e eles aparecem aqui.</p></div>`;
 }

 const r=resumoMetas(lista);
 const segs=[...new Set(lista.map(f=>f.segmento||'SEM SEGMENTO'))].sort();
 const fSeg=filtro.segmento||'';
 const vis=fSeg?lista.filter(f=>(f.segmento||'SEM SEGMENTO')===fSeg):lista;

 return `
 <div class="cat-resumo">
  <div><b>${r.total}</b><span>GROUPS</span></div>
  <div><b>${r.comMeta}</b><span>COM META</span></div>
  ${r.semMeta?`<div class="erro"><b>${r.semMeta}</b><span>SEM META</span></div>`:''}
  <div><b>${r.alvoTotal}</b><span>REC/SEMANA NO TOTAL</span></div>
 </div>

 <div class="metas-barra">
  <select id="metaSegmento">
   <option value="">TODOS OS SEGMENTOS</option>
   ${segs.map(s=>`<option value="${esc(s)}"${s===fSeg?' selected':''}>${esc(s)}</option>`).join('')}
  </select>
  ${podeEditar&&fSeg?`<button type="button" class="mini-btn" data-meta-lote="${esc(fSeg)}">APLICAR A TODO O SEGMENTO</button>`:''}
 </div>

 <div class="metas-lista">
  ${vis.map(f=>linhaMeta(f,esc,podeEditar)).join('')}
 </div>`;
}

function linhaMeta(f,esc,podeEditar){
 const m=normalizarMeta(f.metaRec);
 const per=m?.periodo||'SEMANA';
 const ocupada=String(f.faccao||'').trim();
 return `<article class="meta-linha${m?'':' sem'}" data-meta-group="${esc(f.group)}">
  <div class="meta-id">
   <b>${esc(f.group)}</b>
   <span>${esc(f.qg||'sem QG')}${f.segmento?' · '+esc(f.segmento):''}</span>
   <small>${ocupada?esc(ocupada):'<i>sem facção — meta vale quando alguém assumir</i>'}</small>
  </div>

  <div class="meta-campos">
   <label><span>QTD</span>
    <input type="number" min="0" data-meta="quantidade" value="${esc(m?.quantidade??'')}" ${podeEditar?'':'disabled'}></label>
   <label><span>POR</span>
    <select data-meta="periodo" ${podeEditar?'':'disabled'}>
     <option value="SEMANA"${per==='SEMANA'?' selected':''}>semana</option>
     <option value="DIA"${per==='DIA'?' selected':''}>dia</option>
    </select></label>
   <div class="meta-dias" ${per==='DIA'?'':'hidden'}>
    ${DIAS_SIGLA.map(d=>`<label class="dia"><input type="checkbox" data-meta-dia="${d}" ${m?.dias?.includes(d)?'checked':''} ${podeEditar?'':'disabled'}><span>${d}</span></label>`).join('')}
   </div>
  </div>

  <div class="meta-saida">
   <b data-meta-alvo>${m?alvoSemanal(m):'—'}</b>
   <span>rec/semana</span>
   <small data-meta-texto>${esc(descreverMeta(f.metaRec))}</small>
  </div>

  ${podeEditar?`<button type="button" class="mini-btn primaria" data-meta-salvar="${esc(f.group)}">SALVAR</button>`:''}
 </article>`;
}

/* Le uma linha da tela de volta para o formato gravado. */
export function lerLinha(raiz){
 const q=Number(raiz.querySelector('[data-meta="quantidade"]')?.value)||0;
 const periodo=raiz.querySelector('[data-meta="periodo"]')?.value||'SEMANA';
 const dias=[...raiz.querySelectorAll('[data-meta-dia]:checked')].map(x=>x.dataset.metaDia);
 if(!q)return null;                  // zero ou vazio = sem meta combinada
 return {quantidade:q,periodo,dias:periodo==='DIA'?dias:[]};
}
