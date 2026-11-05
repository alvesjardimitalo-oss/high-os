/* High OS V13 - tela do catalogo de craft e rota.
   A receita e cadastrada aqui; a rota NAO se digita, ela aparece ao
   lado, derivada dos insumos. Quem edita ve na hora o que a faccao vai
   ter que colher. */

import {listaDeItens,nomeDoItem} from './itens-conhecidos.js?v=13.0.0';
import {ORIGENS,rotaDaReceita,rotaDoSegmento,conferirCatalogo,receitasDisponiveis,resumoCatalogo} from './catalogo-craft.js?v=13.1.0';

export function catalogoHtml({catalogo,segmentoAtivo,esc,podeEditar}){
 const segs=Object.keys(catalogo?.segmentos||{}).sort();
 const r=resumoCatalogo(catalogo);
 const conf=conferirCatalogo(catalogo);

 if(!segs.length){
  return `<div class="placeholder"><b>◆</b><h3>NENHUMA RECEITA AINDA</h3>
   <p>As receitas são cadastradas no QG, junto das coordenadas — abra <b>QGs da Season</b>, escolha uma favela e clique em CRAFT.<br>Esta tela mostra o panorama da temporada conforme elas forem entrando.</p></div>`;
 }

 const ativo=segs.includes(segmentoAtivo)?segmentoAtivo:segs[0];
 const receitas=catalogo.segmentos[ativo]?.receitas||[];
 const rota=rotaDoSegmento(ativo,catalogo);

 return `
 <div class="cat-resumo">
  <div><b>${r.segmentos}</b><span>SEGMENTOS</span></div>
  <div><b>${r.receitas}</b><span>RECEITAS</span></div>
  <div><b>${r.insumos}</b><span>INSUMOS</span></div>
  ${conf.erros.length?`<div class="erro"><b>${conf.erros.length}</b><span>PROBLEMAS</span></div>`:''}
 </div>

 ${conf.erros.length?`<div class="cat-alerta">
   <b>Receitas que não fecham</b>
   <ul>${conf.erros.slice(0,6).map(e=>`<li>${esc(e)}</li>`).join('')}</ul>
   ${conf.erros.length>6?`<small>e mais ${conf.erros.length-6}.</small>`:''}
  </div>`:''}

 <div class="cat-abas">
  ${segs.map(s=>`<button type="button" class="${s===ativo?'on':''}" data-cat-seg="${esc(s)}">
    ${esc(s)} <i>${(catalogo.segmentos[s]?.receitas||[]).length}</i></button>`).join('')}
  ${podeEditar?'<button type="button" class="novo" data-cat-novo-seg>+ SEGMENTO</button>':''}
 </div>

 <div class="cat-layout">
  <section>
   <div class="cat-cab">
    <h3>Receitas de ${esc(ativo)}</h3>
    ${podeEditar?`<button type="button" class="mini-btn primaria" data-cat-nova="${esc(ativo)}">NOVA RECEITA</button>`:''}
   </div>
   ${receitas.length?`<div class="cat-receitas">${receitas.map(x=>cartaoReceita(x,catalogo,esc,podeEditar)).join('')}</div>`
    :`<div class="placeholder peq"><h3>SEM RECEITAS</h3><p>Este segmento ainda não tem nada cadastrado.</p></div>`}
  </section>

  <aside class="cat-rota">
   <h3>Rota do segmento</h3>
   <p>O que a facção de ${esc(ativo)} precisa colher para dar conta de todas as receitas. Sai dos insumos — não se digita.</p>
   ${rota.length?`<ul>${rota.map(i=>`<li${i.semReceita?' class="alerta"':''}>
      <b>${esc(i.spawn)}</b>
      <span>${i.qtd?'×'+formatar(i.qtd):''}${i.receitas>1?` · ${i.receitas} receitas`:''}</span>
      ${i.semReceita?'<small>marcado como craft, sem receita cadastrada</small>':''}
     </li>`).join('')}</ul>`
    :'<p class="vazio">Nada a colher: todas as receitas usam só valor, ou não há insumo cadastrado.</p>'}
  </aside>
 </div>`;
}

function formatar(n){
 const v=Number(n)||0;
 return v>=1000?v.toLocaleString('pt-BR'):String(v);
}

function cartaoReceita(r,catalogo,esc,podeEditar){
 const rota=rotaDaReceita(r,catalogo);
 return `<article class="cat-receita" data-receita="${esc(r.id)}">
  <header>
   <div>
    <h4>${esc(r.nome||'(sem nome)')}</h4>
    <span>${esc(r.spawn||'sem spawn')}${r.nivel!==''&&r.nivel?` · nível ${r.nivel}`:''}${r.max!==''&&r.max?` · máx ${r.max}`:''}</span>
   </div>
   ${podeEditar?`<button type="button" class="mini-btn" data-cat-editar="${esc(r.id)}">EDITAR</button>`:''}
  </header>
  <div class="cat-insumos">
   ${r.insumos.map(i=>`<span class="ins ${i.origem.toLowerCase()}" title="${esc(ORIGENS[i.origem]?.ajuda||'')}">
     ${esc(i.spawn)} <b>×${formatar(i.qtd)}</b><i>${esc(ORIGENS[i.origem]?.label||i.origem)}</i></span>`).join('')||'<span class="vazio">sem insumos</span>'}
  </div>
  ${rota.length?`<small class="cat-colher">Colher: ${rota.map(x=>`${esc(x.spawn)} ×${formatar(x.qtd)}`).join(' · ')}</small>`:''}
 </article>`;
}

/* ---------- editor ---------- */
export function editorReceitaHtml(r,catalogo,esc,itensExtra=[]){
 const outras=receitasDisponiveis(catalogo,r.id);
 const itens=listaDeItens(itensExtra);
 return `<div class="cat-editor">
  <datalist id="catItens">${itens.map(i=>`<option value="${esc(i.spawn)}">${esc(i.nome&&i.nome!==i.spawn?i.nome:'')}</option>`).join('')}</datalist>
  <div class="cat-editor-topo">
   <label><span>PRODUTO FINAL</span><input data-r="nome" value="${esc(r.nome||'')}" placeholder="AK-74N"></label>
   <label><span>ITEM FABRICADO (SPAWN)</span><input data-r="spawn" list="catItens" value="${esc(r.spawn||'')}" placeholder="caixa_m_pistola" autocomplete="off"><small class="cat-nome-item">${esc(nomeDoItem(r.spawn)||'')}</small></label>
   <label><span>NÍVEL</span><input data-r="nivel" value="${esc(r.nivel??'')}" placeholder="5"></label>
   <label><span>MÁXIMO</span><input data-r="max" value="${esc(r.max??'')}" placeholder="10"></label>
  </div>

  <div class="cat-ins-cab">
   <h4>Insumos</h4>
   <button type="button" class="mini-btn" data-ins-add>+ INSUMO</button>
  </div>
  <p class="cat-ajuda">De onde vem cada insumo decide a rota. <b>Farm</b> entra na rota. <b>Craft</b> não entra: a rota puxa os insumos da receita dele. <b>Valor</b> fica fora.</p>
  <div class="cat-ins-lista" data-ins-lista>
   ${(r.insumos||[]).map((i,n)=>linhaInsumo(i,n,outras,esc)).join('')}
  </div>
  <template data-ins-modelo>${linhaInsumo({spawn:'',qtd:'',origem:'FARM',receitaId:''},0,outras,esc)}</template>

  <div class="cat-previa" data-previa></div>
 </div>`;
}

export function linhaInsumo(i,n,outras,esc){
 return `<div class="cat-ins-linha">
  <label><span>ITEM</span><input data-i="spawn" list="catItens" value="${esc(i.spawn||'')}" placeholder="gunpowder" autocomplete="off"><small class="cat-nome-item">${esc(nomeDoItem(i.spawn)||'')}</small></label>
  <label><span>QTD</span><input data-i="qtd" value="${esc(i.qtd??'')}" placeholder="35"></label>
  <label><span>DE ONDE VEM</span>
   <select data-i="origem">
    ${Object.entries(ORIGENS).map(([k,v])=>`<option value="${k}"${i.origem===k?' selected':''}>${esc(v.label)}</option>`).join('')}
   </select></label>
  <label class="cat-ins-receita"><span>RECEITA DE ORIGEM</span>
   <select data-i="receitaId">
    <option value="">— pelo spawn —</option>
    ${outras.map(o=>`<option value="${esc(o.id)}"${i.receitaId===o.id?' selected':''}>${esc(o.nome)} · ${esc(o.segmento)}</option>`).join('')}
   </select></label>
  <button type="button" class="mini-btn remover" data-ins-remover title="Remover insumo">×</button>
 </div>`;
}

export function lerEditorReceita(raiz,base={}){
 const out={...base,insumos:[]};
 raiz.querySelectorAll('[data-r]').forEach(el=>{
  const k=el.dataset.r;
  out[k]=['nivel','max'].includes(k)?(el.value.trim()===''?'':Number(el.value)||0):el.value.trim();
 });
 raiz.querySelectorAll('.cat-ins-linha').forEach(l=>{
  const g=s=>l.querySelector(`[data-i="${s}"]`)?.value?.trim()||'';
  const spawn=g('spawn');
  if(!spawn)return;
  out.insumos.push({spawn,qtd:Number(g('qtd'))||0,origem:g('origem')||'FARM',receitaId:g('receitaId')});
 });
 return out;
}

/* Previa da rota dentro do editor, para quem edita ver o efeito do que
   acabou de marcar sem precisar salvar. */
export function previaRota(receita,catalogo,esc){
 const rota=rotaDaReceita(receita,catalogo);
 if(!rota.length)return '<p class="cat-ajuda">Nada a colher com os insumos atuais.</p>';
 return `<h4>O que entra na rota</h4><div class="cat-previa-itens">${
  rota.map(i=>`<span${i.semReceita?' class="alerta"':''}>${esc(i.spawn)} <b>×${formatar(i.qtd)}</b></span>`).join('')
 }</div>${rota.some(i=>i.semReceita)?'<p class="cat-ajuda alerta">Em laranja: marcado como craft mas sem receita cadastrada — por ora entra na rota como item colhível.</p>':''}`;
}
