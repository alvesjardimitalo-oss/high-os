/* =====================================================================
   HIGH OS · DASHBOARD — OCUPAÇÃO E FACÇÕES DISPONÍVEIS (V14)
   ---------------------------------------------------------------------
   Refeito do zero sobre a regra única de modules/ocupacao.js.
   - Painel "Ocupação do Ilegal": assumidas, disponíveis, sem QG, a
     revisar, e a ocupação por segmento.
   - Painel "Facções disponíveis": o que pode ser entregue agora, há
     quanto tempo está vago, status do anúncio no Discord e as ações
     (copiar anúncio, marcar postado, assumir).
   - Revisão de ocupação: Groups com dados contraditórios, com as
     correções possíveis — nada é corrigido sem o administrador escolher.
   ===================================================================== */
import { situacaoGroup, SITUACOES, groupsOperacionais, diasVago, inconsistencias, CAMPOS_VAGO } from './ocupacao.js';

const ui = { seg: '', todas: false };

export function painelOcupacaoHtml(deps) {
  const { esc } = deps, gs = groupsOperacionais(deps.estado.faccoes).map(f => ({ f, st: situacaoGroup(f) }));
  const c = s => gs.filter(o => o.st === s).length, inc = inconsistencias(deps.estado.faccoes, deps.estado.entregas);
  const segs = {};
  gs.forEach(({ f, st }) => { const k = f.segmento || 'OUTROS'; segs[k] = segs[k] || { all: 0, on: 0, livre: 0 }; segs[k].all++; if (st === 'ASSUMIDA') segs[k].on++; if (st === 'DISPONIVEL') segs[k].livre++; });
  const total = gs.length || 1;
  const kpi = (s, n, sub) => `<button type="button" class="po-kpi ${SITUACOES[s].classe}" data-po-filtro="${s}"><b>${n}</b><span>${SITUACOES[s].curto}</span>${sub ? `<small>${sub}</small>` : ''}</button>`;
  const barra = `<div class="po-stack" title="Distribuição dos ${gs.length} Groups">${['ASSUMIDA', 'DISPONIVEL', 'SEM_QG', 'REVISAR'].map(s => c(s) ? `<i class="${SITUACOES[s].classe}" style="width:${c(s) / total * 100}%"></i>` : '').join('')}</div>`;
  const segRows = Object.entries(segs).sort((a, b) => b[1].all - a[1].all).map(([k, v]) => `<div class="po-seg"><span>${esc(k)}</span><div><i style="width:${v.all ? v.on / v.all * 100 : 0}%"></i><u style="width:${v.all ? v.livre / v.all * 100 : 0}%"></u></div><b>${v.on}/${v.all}</b><em>${v.livre ? `${v.livre} livre${v.livre > 1 ? 's' : ''}` : ''}</em></div>`).join('');
  return `<section class="dash-panel po-panel"><header><div><span>REGRA ÚNICA DE OCUPAÇÃO</span><h3>OCUPAÇÃO DO ILEGAL</h3></div><button data-go="faccoes">VER ORGANIZAÇÕES →</button></header>
    <div class="po-kpis">${kpi('ASSUMIDA', c('ASSUMIDA'))}${kpi('DISPONIVEL', c('DISPONIVEL'), 'prontas p/ entregar')}${kpi('SEM_QG', c('SEM_QG'), 'cadastrar QG')}${c('REVISAR') || inc.length ? `<button type="button" class="po-kpi review" data-po-revisar><b>${inc.length}</b><span>a revisar</span><small>dados contraditórios</small></button>` : ''}</div>
    ${barra}<div class="po-segs"><div class="po-seg-legend"><span><i class="on"></i>assumidos</span><span><i class="free"></i>disponíveis</span></div>${segRows}</div></section>`;
}

export function painelDisponiveisHtml(deps) {
  const { esc } = deps;
  const livres = groupsOperacionais(deps.estado.faccoes).filter(f => situacaoGroup(f) === 'DISPONIVEL').map(f => ({ f, dias: diasVago(f), dc: deps.discordState(f) }));
  const segs = [...new Set(livres.map(o => o.f.segmento || 'OUTROS'))].sort();
  if (ui.seg && !segs.includes(ui.seg)) ui.seg = '';
  const lista = livres.filter(o => !ui.seg || (o.f.segmento || 'OUTROS') === ui.seg)
    .sort((a, b) => (b.dias ?? -1) - (a.dias ?? -1) || String(a.f.group).localeCompare(String(b.f.group), 'pt-BR', { numeric: true }));
  const naoPost = livres.filter(o => o.dc !== 'POSTADO').length;
  const vis = ui.todas ? lista : lista.slice(0, 8);
  const dcTag = s => s === 'POSTADO' ? '<em class="ok">POSTADO</em>' : s === 'NAO_POSTADO' ? '<em class="warn">NÃO POSTADO</em>' : '<em>SEM ANÚNCIO</em>';
  const dias = d => d === null ? '<small>vago</small>' : d === 0 ? '<small class="new">vago hoje</small>' : `<small class="${d >= 7 ? 'old' : ''}">vago há ${d} dia${d > 1 ? 's' : ''}</small>`;
  return `<section class="dash-panel dash-wide pd-panel"><header><div><span>PRONTAS PARA ENTREGA</span><h3>FACÇÕES DISPONÍVEIS <i class="pd-count">${livres.length}</i></h3></div><button type="button" data-po-nova>+ NOVA ENTREGA</button></header>
    ${livres.length ? `<div class="pd-bar"><div class="pd-chips"><button type="button" data-pd-seg="" class="${!ui.seg ? 'on' : ''}">TODOS <b>${livres.length}</b></button>${segs.map(s => `<button type="button" data-pd-seg="${esc(s)}" class="${ui.seg === s ? 'on' : ''}">${esc(s)} <b>${livres.filter(o => (o.f.segmento || 'OUTROS') === s).length}</b></button>`).join('')}</div>${naoPost ? `<span class="pd-hint">${naoPost} sem anúncio postado no Discord</span>` : '<span class="pd-hint ok">todas anunciadas</span>'}</div>
    <div class="pd-list">${vis.map(({ f, dias: d, dc }) => `<article class="pd-row"><div class="pd-id"><b>${esc(f.group)}</b><span>${esc(f.segmento || 'OUTROS')}</span></div><div class="pd-qg"><b>${esc(f.qg || '—')}</b>${dias(d)}</div><div class="pd-dc">${dcTag(dc)}</div>
      <div class="pd-act"><button type="button" data-pd-copy="${esc(f.group)}" title="Copiar texto do anúncio">ANÚNCIO</button><button type="button" data-pd-post="${esc(f.group)}" data-v="${dc === 'POSTADO' ? '0' : '1'}">${dc === 'POSTADO' ? 'DESMARCAR' : 'MARCAR POSTADO'}</button><button type="button" class="pd-go" data-pd-entregar="${esc(f.group)}">ASSUMIR →</button></div></article>`).join('') || '<div class="pd-empty">Nenhuma neste segmento.</div>'}</div>
    ${lista.length > 8 ? `<button type="button" class="pd-more" data-pd-todas>${ui.todas ? 'MOSTRAR MENOS' : `VER TODAS (${lista.length})`}</button>` : ''}`
    : '<div class="pd-empty">Nenhum Group disponível no momento. Groups recolhidos aparecem aqui na hora.</div>'}</section>`;
}

export function ligarPaineis(box, deps, rerender) {
  const q = s => [...box.querySelectorAll(s)];
  q('[data-pd-seg]').forEach(b => b.onclick = () => { ui.seg = b.dataset.pdSeg; rerender(); });
  q('[data-pd-todas]').forEach(b => b.onclick = () => { ui.todas = !ui.todas; rerender(); });
  q('[data-pd-entregar]').forEach(b => b.onclick = () => deps.abrirEntrega(b.dataset.pdEntregar));
  q('[data-po-nova]').forEach(b => b.onclick = () => deps.abrirEntrega(''));
  q('[data-pd-copy]').forEach(b => b.onclick = async () => { const f = deps.estado.faccoes.find(x => x.group === b.dataset.pdCopy); try { await navigator.clipboard.writeText(deps.anuncioTexto(f)); b.textContent = 'COPIADO ✓'; setTimeout(() => b.textContent = 'ANÚNCIO', 1200); } catch (e) { deps.alert('Não foi possível copiar.'); } });
  q('[data-pd-post]').forEach(b => b.onclick = async () => { b.disabled = true; try { await deps.marcarPostado(b.dataset.pdPost, b.dataset.v === '1'); } finally { rerender(); } });
  q('[data-po-revisar]').forEach(b => b.onclick = () => abrirRevisao(deps));
  q('[data-po-filtro]').forEach(b => b.onclick = () => deps.abrirOrganizacoes(b.dataset.poFiltro));
}

/* ---------- revisão de ocupação ---------- */
export function abrirRevisao(deps) {
  const { esc } = deps;
  let m = document.getElementById('poRevisao');
  if (!m) { m = document.createElement('div'); m.id = 'poRevisao'; m.className = 'ev2-back'; document.body.appendChild(m); m.addEventListener('click', e => { if (e.target === m) m.hidden = true; }); }
  m.hidden = false;
  const draw = () => {
    const lista = inconsistencias(deps.estado.faccoes, deps.estado.entregas);
    /* sem ambiguidade = só existe uma correção possível */
    const seguras = lista.filter(i => (i.tipo === 'ATIVA_SEM_FACCAO' || i.tipo === 'ENTREGA_ORFA') && i.acoes.length === 1);
    m.innerHTML = `<div class="ev2-card po-rev"><div class="ev2-head"><div><span class="ev2-kick">REGRA ÚNICA DE OCUPAÇÃO</span><h2>REVISAR OCUPAÇÃO</h2><small>${lista.length ? `${lista.length} caso${lista.length > 1 ? 's' : ''} com dados contraditórios ou incompletos` : 'Nenhum problema encontrado'}</small></div><button type="button" class="ev2-x" data-po-x>×</button></div>
      <div class="ev2-body">${lista.length ? `${seguras.length ? `<div class="po-safe"><span>${seguras.length} correç${seguras.length > 1 ? 'ões' : 'ão'} sem ambiguidade (status ATIVA sem facção, entrega antiga ainda ativa)</span><button type="button" class="ev2-primary" data-po-seguras>APLICAR ${seguras.length}</button></div>` : ''}
        ${lista.map((i, n) => `<article class="po-item ${i.nivel}"><div><b>${esc(i.titulo)}</b><small>${esc(i.detalhe)}</small></div><div class="po-acts">${i.acoes.map((a, k) => `<button type="button" data-po-acao="${n}:${k}" class="${k === 0 && a.patch !== 'ABRIR' ? 'ev2-primary' : ''}">${esc(a.label)}</button>`).join('')}</div></article>`).join('')}`
        : '<div class="ev2-done"><b>✓ Ocupação consistente</b><p>Todas as telas estão lendo a mesma situação para cada Group.</p></div>'}</div></div>`;
    m.querySelector('[data-po-x]').onclick = () => { m.hidden = true; };
    m.querySelectorAll('[data-po-acao]').forEach(b => b.onclick = async () => {
      const [n, k] = b.dataset.poAcao.split(':').map(Number), item = lista[n], acao = item?.acoes[k]; if (!acao) return;
      if (acao.patch === 'ABRIR') { m.hidden = true; deps.abrirGroup(acao.group || item.group); return; }
      if (acao.patch === 'LIBERAR' && !confirm(`Liberar o ${item.group}? A facção registrada sai do Group e ele fica disponível.\n\n(Correção de cadastro: não gera anúncio de recolhimento. Para um recolhimento real use RECOLHER no perfil.)`)) return;
      b.disabled = true;
      try { await aplicar(deps, item, acao); await deps.recarregar(); } catch (e) { deps.alert('Não foi possível corrigir: ' + e.message); }
      draw();
    });
    m.querySelector('[data-po-seguras]')?.addEventListener('click', async e => {
      e.target.disabled = true;
      try { for (const i of seguras) await aplicar(deps, i, i.acoes[0]); await deps.recarregar(); } catch (err) { deps.alert('Parte das correções falhou: ' + err.message); }
      draw();
    });
  };
  draw();
}

async function aplicar(deps, item, acao) {
  const { fs, db } = deps, u = deps.user();
  if (acao.patch === 'FECHAR_ENTREGA') {
    await fs.setDoc(fs.doc(db, 'highos', 'data', 'entregas', item.entregaId), { status: 'RECOLHIDA', recolhidaEm: fs.serverTimestamp(), recolhidaPor: u.email, correcaoOcupacao: true }, { merge: true });
    const d = deps.estado.entregas.find(x => x.id === item.entregaId); if (d) d.status = 'RECOLHIDA';
  } else {
    const f = deps.estado.faccoes.find(x => x.group === item.group); if (!f) return;
    const patch = acao.patch === 'LIBERAR' ? { ...CAMPOS_VAGO } : { ...acao.patch };
    await fs.setDoc(fs.doc(db, 'highos', 'data', 'faccoes', item.group), { ...patch, updatedAt: fs.serverTimestamp(), updatedBy: u.email }, { merge: true });
    if (acao.patch === 'LIBERAR') for (const d of deps.estado.entregas.filter(x => x.group === item.group && x.status === 'ATIVA'))
      { await fs.setDoc(fs.doc(db, 'highos', 'data', 'entregas', d.id), { status: 'RECOLHIDA', recolhidaEm: fs.serverTimestamp(), recolhidaPor: u.email, correcaoOcupacao: true }, { merge: true }); d.status = 'RECOLHIDA'; }
    Object.assign(f, patch);
  }
  await fs.addDoc(deps.histCol, { sessionId: u.sessionId || '', tipo: 'CORRECAO_OCUPACAO', group: item.group, problema: item.tipo, acao: acao.id, descricao: item.titulo, usuario: u.email, data: fs.serverTimestamp() });
}
