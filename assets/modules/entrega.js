/* =====================================================================
   HIGH OS · ENTREGA DE GROUP (V14) — refeita do zero
   ---------------------------------------------------------------------
   Fluxo em 4 etapas: Group → Facção → Benefícios → Revisão.
   Travas:
     - Group SEM QG ou com dados a REVISAR não pode ser entregue;
     - facção que já ocupa outro Group é bloqueada;
     - Group ocupado só como TROCA: motivo, justificativa e confirmação.
       A troca grava o recolhimento da facção anterior (histórico
       RECOLHIMENTO) e depois a entrega (ENTREGA_GROUP), no mesmo
       formato de sempre, para o bot anunciar os dois no Discord.
   Gravação: as escritas que definem quem ocupa o Group vão num único
   lote (tudo ou nada). Coleções e campos são os mesmos da versão
   anterior: entregas, faccoes, organizacoes, historico.
   ===================================================================== */
import { situacaoGroup, SITUACOES, temFaccao, faccaoOcupandoOutro, hojeBR, groupsOperacionais } from './ocupacao.js';

const MOTIVOS_TROCA = [
  ['TROCA_OCUPANTE', 'Troca de ocupante'],
  ['BAIXO_CONTINGENTE', 'Baixo contingente'],
  ['ABANDONO', 'Abandono / inatividade'],
  ['ACORDO', 'Acordo entre as facções'],
  ['OUTRO', 'Outro motivo']
];
const SEM_VALOR_NO_EXTRATO = ['vipOrg', 'chatFaccao', 'rotaExclusiva', 'telao', 'garagemPublica', 'heliponto'];

/* ---------- textos (funções puras) ---------- */
export function extratoEntrega(f, d, ativos, INSTALLATIONS, installedValue) {
  const b = f.beneficios || {};
  const L = ['ENTREGA DE ORGANIZAÇÃO — HIGH ILEGAL', '',
    `Group: ${f.group}`, `QG / Local: ${f.qg || '—'}`, `Segmento: ${f.segmento || '—'}`,
    `Facção: ${d.faccao || '{FACÇÃO}'}`, `Líder: ${d.lider || '{LÍDER}'}`,
    `Staff responsável: ${d.staff || '{STAFF}'}`, `Data: ${d.dataEntrega || '{DATA}'}`];
  if (d.plano) L.push(`Plano / Pacote: ${d.plano}`);
  if (d.troca) L.push('', `TROCA DE OCUPANTE: sai ${d.troca.faccaoAnterior} • motivo: ${d.troca.motivoLabel}`);
  L.push('', 'BENEFÍCIOS / SETAGENS ENTREGUES:');
  if (!ativos.length) L.push('- Nenhum benefício selecionado');
  else ativos.forEach(k => { const n = INSTALLATIONS.find(x => x[0] === k)?.[1] || k; const v = installedValue(b, k); L.push(`- ${n}${v && !SEM_VALOR_NO_EXTRATO.includes(k) ? `: ${v}` : ''}`); });
  if (d.personalizacoes) L.push('', 'PERSONALIZAÇÕES / ALTERAÇÕES:', d.personalizacoes);
  return L.join('\n');
}

export function solicitacoesEntrega(f, ativos, notas, fmtCds) {
  const b = f.beneficios || {}, has = k => ativos.includes(k), R = [], add = (tipo, titulo, texto) => R.push({ tipo, titulo, texto });
  const vipKeys = ['vipOrg', 'chatFaccao', 'radio', 'salario', 'garagemVip', 'lojaRoupas', 'barbearia', 'tatuagem', 'shopExclusivo', 'bau', 'farm', 'craft', 'arena'];
  if (ativos.some(k => vipKeys.includes(k))) {
    const L = ['Assunto: Ativação de benefícios de uma organização e alguns blips', '', 'Solicitação:', '', '- Ativação de benefícios de uma organização e alguns blips', `- Group: ${f.group}`];
    if (has('salario') && b.salario) L.push('', `- Ativar salário de ${b.salario} (A cada ${b.salarioMinutos || 40} minutos)`);
    if (has('radio') && b.radio) L.push('', `- Ativar Rádio exclusiva: ${b.radio}`);
    if (has('chatFaccao')) L.push('', '- Chat Facção.');
    if (has('garagemVip')) { L.push('', '- Ativar Garagem VIP:', `- Blip: ${fmtCds(b.garagemVipBlip)}`, `- Spawn: ${fmtCds(b.garagemVipSpawn)}`); if (b.garagemVipVeiculos) L.push(`- Veículos: ${b.garagemVipVeiculos}`); }
    [['lojaRoupas', 'Loja de roupas'], ['barbearia', 'Barbearia'], ['tatuagem', 'Tatuagem'], ['shopExclusivo', 'Shop Exclusivo'], ['bau', 'Baú'], ['farm', 'Farm'], ['craft', 'Craft'], ['arena', 'Arena']]
      .forEach(([k, n]) => { if (has(k) && b[k]) L.push('', `- ${n}: ${fmtCds(b[k])}`); });
    add('BENEFICIOS', 'VIP Org / Benefícios e Setagens', L.join('\n'));
  }
  if (has('rotaExclusiva')) {
    const pts = (b.rotaBlips || '').split(/\r?\n/).filter(Boolean);
    add('ROTA_FARM', 'Rota de Farm Exclusiva', ['Assunto: Ativação de rota de farm exclusiva', '', 'Solicitação:', '', '- Ativação de rota de farm exclusiva', `- Group: ${f.group}`, '', '- Blips da rota nova:', '', ...(pts.length ? pts : ['{ CDS },'])].join('\n'));
  }
  if (has('telao')) add('TELAO', 'Telão da Organização', ['Assunto: Ativação de Telão Hall em uma Organização Ilegal', '', 'Solicitação:', '', '- Ativação de Telão Hall em uma Organização Ilegal.', '', `- Group: ${f.group}`, `- Telão usado: ${b.telaoNome || '{modelo_do_telao}'}`, '', `- Local/Coordenadas postit: ${fmtCds(b.telaoPostit)}`, `- Local/Coordenadas cds: ${fmtCds(b.telaoCds)}`].join('\n'));
  if (has('garagemPublica')) add('GARAGEM', 'Garagem Pública', ['Assunto:', '', '- Solicitaçao de Garagem Publica;', '', 'Solicitaçao:', '', '- Adicione uma garagem publica na CDS abaixo:', '', `* Blip: ${fmtCds(b.garagemPublicaBlip)}`, `* Spawn: ${fmtCds(b.garagemPublicaSpawn)}`, '', `- Permissao : ${f.group}`].join('\n'));
  if (has('heliponto')) { const L = ['Assunto: Adição de Heliponto', '', 'Solicitação:', '- Adicione um Heliponto na cds abaixo;', `- ${fmtCds(b.helipontoBlip)}`]; if (b.helipontoSpawn) L.push(`- Spawn: ${fmtCds(b.helipontoSpawn)}`); L.push('', `- Group: ${f.group}.`); add('HELIPONTO', 'Heliponto', L.join('\n')); }
  if (notas) add('GERAL', 'Personalização / Alteração estrutural', ['Assunto: Alteração / personalização de estrutura do QG', '', 'Solicitação:', '', `- Group: ${f.group}`, '', notas].join('\n'));
  return R;
}

/* ---------- componente ---------- */
export function criarEntrega(deps) {
  const { esc } = deps;
  const S = { step: 1, group: '', busca: '', seg: '', dados: {}, ativos: null, troca: null, salvando: false, feito: null };
  let modal = null;

  const grupos = () => groupsOperacionais(deps.estado.faccoes);
  const atual = () => grupos().find(f => f.group === S.group) || null;
  const user = () => deps.user();

  function abrir(group = '') {
    const u = user();
    S.step = group ? 2 : 1; S.group = ''; S.busca = ''; S.seg = ''; S.ativos = null; S.troca = null; S.salvando = false; S.feito = null;
    S.dados = { faccao: '', lider: '', staff: u.nome || '', dataEntrega: hojeBR(), plano: '', personalizacoes: '' };
    if (group) escolherGroup(group, true);
    if (!modal) { modal = document.createElement('div'); modal.id = 'entregaV2'; modal.className = 'ev2-back'; document.body.appendChild(modal);
      modal.addEventListener('click', e => { if (e.target === modal && !S.salvando) fechar(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal && !modal.hidden && !S.salvando) fechar(); }); }
    modal.hidden = false; document.body.classList.add('ev2-open'); render();
  }
  function fechar() { if (modal) modal.hidden = true; document.body.classList.remove('ev2-open'); }

  function escolherGroup(g, silencioso = false) {
    const f = grupos().find(x => x.group === g); if (!f) return;
    const st = situacaoGroup(f);
    if (st === 'SEM_QG' || st === 'REVISAR') { if (!silencioso) deps.alert(st === 'SEM_QG' ? 'Cadastre o QG/favela do Group antes de entregar.' : 'Os dados deste Group estão contraditórios. Corrija em REVISAR OCUPAÇÃO antes de entregar.'); S.group = ''; S.step = 1; return; }
    S.group = g;
    const p = f.perfilEntrega || {}, inst = deps.INSTALLATIONS.filter(([k]) => deps.isInstalled(f.beneficios || {}, k)).map(([k]) => k);
    const pad = new Set(p.beneficiosPadrao || []);
    S.ativos = pad.size ? inst.filter(k => pad.has(k)) : inst;
    if (p.planoPadrao && !S.dados.plano) S.dados.plano = p.planoPadrao;
    if (p.observacao && !S.dados.personalizacoes) S.dados.personalizacoes = p.observacao;
    S.troca = st === 'ASSUMIDA' ? { faccaoAnterior: f.faccao, liderAnterior: f.lider || '', motivo: 'TROCA_OCUPANTE', justificativa: '', confirmado: false } : null;
    if (!silencioso) { S.step = 2; render(); }
  }

  /* validações por etapa — devolve lista de erros */
  function erros(step = S.step) {
    const e = [], f = atual(), d = S.dados;
    if (step >= 1 && !f) e.push('Escolha o Group.');
    if (step >= 2 && f) {
      if (!d.faccao.trim()) e.push('Informe a facção que vai assumir.');
      const outro = faccaoOcupandoOutro(d.faccao, deps.estado.faccoes, f.group);
      if (outro) e.push(`${d.faccao.trim()} já ocupa o ${outro.group}${outro.qg ? ` (${outro.qg})` : ''}. Uma facção só pode ter um Group: recolha o ${outro.group} antes.`);
      if (!d.lider.trim()) e.push('Informe o líder.');
      if (!d.staff.trim()) e.push('Informe o staff responsável.');
      if (!/^\d{2}\/\d{2}\/(\d{2}|\d{4})$/.test(d.dataEntrega.trim())) e.push('Data no formato dd/mm/aaaa.');
      if (S.troca && d.faccao.trim() && d.faccao.trim().toLowerCase() === String(S.troca.faccaoAnterior).trim().toLowerCase()) e.push(`${d.faccao.trim()} já é a ocupante deste Group.`);
      if (S.troca && !S.troca.justificativa.trim()) e.push('Explique a troca de ocupante.');
      if (S.troca && !S.troca.confirmado) e.push('Confirme a troca de ocupante.');
    }
    return e;
  }

  function payloadDados() {
    const f = atual(), d = S.dados, m = MOTIVOS_TROCA.find(x => x[0] === S.troca?.motivo);
    return { ...Object.fromEntries(Object.entries(d).map(([k, v]) => [k, String(v || '').trim()])), troca: S.troca ? { ...S.troca, motivoLabel: m?.[1] || 'Troca de ocupante' } : null, f };
  }

  /* ---------- telas ---------- */
  function render() {
    if (!modal) return;
    const f = atual(), passos = ['GROUP', 'FACÇÃO', 'BENEFÍCIOS', 'REVISÃO'];
    const head = `<div class="ev2-head"><div><span class="ev2-kick">${S.troca ? 'TROCA DE OCUPANTE' : 'NOVA OCUPAÇÃO'}</span><h2>ENTREGA DE GROUP</h2>${f ? `<small>${esc(f.group)} • ${esc(f.qg || 'SEM LOCAL')} • ${esc(f.segmento || '—')}</small>` : '<small>Escolha o Group que será entregue</small>'}</div><button type="button" class="ev2-x" data-ev2="fechar" aria-label="Fechar">×</button></div>
      ${S.feito ? '' : `<ol class="ev2-steps">${passos.map((p, i) => `<li class="${S.step === i + 1 ? 'on' : S.step > i + 1 ? 'ok' : ''}"><button type="button" data-ev2-step="${i + 1}" ${i + 1 > S.step && erros(i).length ? 'disabled' : ''}><b>${S.step > i + 1 ? '✓' : i + 1}</b>${p}</button></li>`).join('')}</ol>`}`;
    const corpo = S.feito ? telaFeito() : S.step === 1 ? tela1() : S.step === 2 ? tela2(f) : S.step === 3 ? tela3(f) : tela4(f);
    modal.innerHTML = `<div class="ev2-card" role="dialog" aria-modal="true">${head}<div class="ev2-body">${corpo}</div>${S.feito ? '' : rodape()}</div>`;
    bind();
  }
  function rodape() {
    const e = erros(), last = S.step === 4;
    return `<div class="ev2-foot">${S.step > 1 ? '<button type="button" data-ev2="voltar">← VOLTAR</button>' : '<span></span>'}
      ${S.step >= 2 && e.length ? `<span class="ev2-err">${esc(e[0])}${e.length > 1 ? ` <i>+${e.length - 1}</i>` : ''}</span>` : '<span></span>'}
      ${S.step === 1 ? '' : last ? `<button type="button" class="ev2-primary" data-ev2="salvar" ${e.length || S.salvando ? 'disabled' : ''}>${S.salvando ? 'GRAVANDO…' : S.troca ? 'CONFIRMAR TROCA E ENTREGA' : 'CONFIRMAR ENTREGA'}</button>` : `<button type="button" class="ev2-primary" data-ev2="avancar" ${e.length ? 'disabled' : ''}>CONTINUAR →</button>`}</div>`;
  }
  function tela1() {
    const todos = grupos().map(f => ({ f, st: situacaoGroup(f) }));
    const segs = [...new Set(todos.map(o => o.f.segmento || 'OUTROS'))].sort();
    const q = S.busca.toLowerCase();
    const ordem = { DISPONIVEL: 0, ASSUMIDA: 1, REVISAR: 2, SEM_QG: 3 };
    const lista = todos.filter(o => (!S.seg || (o.f.segmento || 'OUTROS') === S.seg) && (!q || [o.f.group, o.f.qg, o.f.faccao, o.f.segmento].join(' ').toLowerCase().includes(q)))
      .sort((a, b) => ordem[a.st] - ordem[b.st] || String(a.f.group).localeCompare(String(b.f.group), 'pt-BR', { numeric: true }));
    const cont = s => todos.filter(o => o.st === s).length;
    return `<div class="ev2-tools"><input type="search" id="ev2Busca" placeholder="Buscar Group, QG, facção…" value="${esc(S.busca)}" autocomplete="off">
        <div class="ev2-chips"><button type="button" data-ev2-seg="" class="${!S.seg ? 'on' : ''}">TODOS</button>${segs.map(s => `<button type="button" data-ev2-seg="${esc(s)}" class="${S.seg === s ? 'on' : ''}">${esc(s)}</button>`).join('')}</div></div>
      <div class="ev2-legend"><span class="available">${cont('DISPONIVEL')} disponíveis</span><span class="assumed">${cont('ASSUMIDA')} assumidas (troca)</span><span class="unavailable">${cont('SEM_QG')} sem QG</span>${cont('REVISAR') ? `<span class="review">${cont('REVISAR')} a revisar</span>` : ''}</div>
      <div class="ev2-groups">${lista.map(({ f, st }) => { const bloq = st === 'SEM_QG' || st === 'REVISAR'; return `<button type="button" class="ev2-g ${SITUACOES[st].classe}" data-ev2-group="${esc(f.group)}" ${bloq ? 'disabled' : ''}>
          <span class="ev2-g-top"><b>${esc(f.group)}</b><em>${SITUACOES[st].label}</em></span>
          <small>${esc(f.qg || 'SEM LOCAL')} • ${esc(f.segmento || 'OUTROS')}</small>
          <small class="ev2-g-sub">${st === 'ASSUMIDA' ? `Ocupado por <b>${esc(f.faccao)}</b> — entrega vira troca` : st === 'SEM_QG' ? 'Cadastre o QG para liberar' : st === 'REVISAR' ? 'Dados contraditórios — revise antes' : 'Pronto para entrega'}</small></button>`; }).join('') || '<div class="ev2-empty">Nenhum Group encontrado.</div>'}</div>`;
  }
  function tela2(f) {
    const d = S.dados, orgs = (deps.derivedOrganizations?.() || []).map(o => o.nome).filter(Boolean);
    const outro = d.faccao.trim() ? faccaoOcupandoOutro(d.faccao, deps.estado.faccoes, f.group) : null;
    const troca = S.troca ? `<section class="ev2-troca"><b>⚠ ESTE GROUP ESTÁ OCUPADO POR ${esc(S.troca.faccaoAnterior).toUpperCase()}</b>
        <p>Ao confirmar, ${esc(S.troca.faccaoAnterior)} é recolhida (registro e anúncio de recolhimento) e a nova facção assume.</p>
        <div class="ev2-grid"><label>MOTIVO DA TROCA<select data-ev2-troca="motivo">${MOTIVOS_TROCA.map(([k, n]) => `<option value="${k}" ${S.troca.motivo === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <label class="wide">JUSTIFICATIVA *<input data-ev2-troca="justificativa" value="${esc(S.troca.justificativa)}" placeholder="Ex.: contingente abaixo do mínimo nas últimas 2 semanas"></label></div>
        <label class="ev2-check"><input type="checkbox" data-ev2-troca="confirmado" ${S.troca.confirmado ? 'checked' : ''}> Confirmo: <b>${esc(S.troca.faccaoAnterior)}</b> sai e <b>${esc(d.faccao || 'a nova facção')}</b> assume o ${esc(f.group)}.</label></section>` : '';
    return `${troca}<div class="ev2-grid">
        <label class="wide">FACÇÃO QUE VAI ASSUMIR *<input data-ev2-d="faccao" list="ev2Orgs" value="${esc(d.faccao)}" placeholder="Nome da facção" autocomplete="off"><datalist id="ev2Orgs">${orgs.map(n => `<option value="${esc(n)}">`).join('')}</datalist></label>
        ${outro ? `<div class="ev2-block wide">✕ ${esc(d.faccao)} já ocupa o <b>${esc(outro.group)}</b>${outro.qg ? ` (${esc(outro.qg)})` : ''}. Uma facção só pode ter um Group — recolha o ${esc(outro.group)} antes.</div>` : ''}
        <label>LÍDER *<input data-ev2-d="lider" value="${esc(d.lider)}" placeholder="ID — Nome"></label>
        <label>STAFF RESPONSÁVEL *<input data-ev2-d="staff" value="${esc(d.staff)}"></label>
        <label>DATA DA ENTREGA *<input data-ev2-d="dataEntrega" value="${esc(d.dataEntrega)}" placeholder="dd/mm/aaaa" inputmode="numeric"></label>
        <label>PLANO / PACOTE<input data-ev2-d="plano" value="${esc(d.plano)}" placeholder="opcional"></label></div>`;
  }
  function tela3(f) {
    const b = f.beneficios || {}, inst = deps.INSTALLATIONS.filter(([k]) => deps.isInstalled(b, k));
    return `<p class="ev2-help">Estrutura instalada no ${esc(f.group)}. Marque o que será ativado para a nova facção.</p>
      ${inst.length ? `<div class="ev2-tools-row"><button type="button" data-ev2="todos">MARCAR TODOS</button><button type="button" data-ev2="nenhum">DESMARCAR</button><span>${S.ativos.length}/${inst.length} selecionados</span></div>
      <div class="ev2-benef">${inst.map(([k, n]) => `<label class="${S.ativos.includes(k) ? 'on' : ''}"><input type="checkbox" data-ev2-b="${k}" ${S.ativos.includes(k) ? 'checked' : ''}><span><b>${esc(n)}</b><small>${esc(deps.installedValue(b, k))}</small></span></label>`).join('')}</div>` : '<div class="ev2-empty">Este Group não tem estrutura instalada cadastrada.</div>'}
      <label class="ev2-full">PERSONALIZAÇÕES / ALTERAÇÕES<textarea data-ev2-d="personalizacoes" rows="3" placeholder="Opcional — vira uma solicitação à parte">${esc(S.dados.personalizacoes)}</textarea></label>`;
  }
  function tela4(f) {
    const pd = payloadDados(), ex = extratoEntrega(f, pd, S.ativos, deps.INSTALLATIONS, deps.installedValue), rs = solicitacoesEntrega(f, S.ativos, pd.personalizacoes, deps.fmtCds);
    S._preview = { ex, rs };
    const linha = (k, v) => `<div><span>${k}</span><b>${esc(v || '—')}</b></div>`;
    return `<div class="ev2-resumo">${linha('GROUP', f.group)}${linha('QG', f.qg)}${linha('SEGMENTO', f.segmento)}${linha('FACÇÃO', pd.faccao)}${linha('LÍDER', pd.lider)}${linha('STAFF', pd.staff)}${linha('DATA', pd.dataEntrega)}${linha('BENEFÍCIOS', `${S.ativos.length} ativados`)}</div>
      ${pd.troca ? `<div class="ev2-troca mini"><b>TROCA:</b> ${esc(pd.troca.faccaoAnterior)} sai (${esc(pd.troca.motivoLabel)}) • ${esc(pd.troca.justificativa)}</div>` : ''}
      <div class="ev2-out"><header><b>EXTRATO DA ENTREGA</b><button type="button" data-ev2-copy="ex">COPIAR</button></header><pre>${esc(ex)}</pre></div>
      ${rs.length ? `<div class="ev2-out"><header><b>SOLICITAÇÕES GERADAS (${rs.length})</b><button type="button" data-ev2-copy="all">COPIAR TODAS</button></header>${rs.map((r, i) => `<details><summary>${i + 1}. ${esc(r.titulo)}<button type="button" data-ev2-copy="r${i}">COPIAR</button></summary><pre>${esc(r.texto)}</pre></details>`).join('')}</div>` : ''}
      <p class="ev2-help">Ao confirmar: ocupação gravada de uma vez${pd.troca ? ', recolhimento da anterior registrado' : ''}, planilha oficial e cadastro da organização atualizados, e o bot posta o anúncio no Discord.</p>`;
  }
  function telaFeito() {
    const r = S.feito;
    return `<div class="ev2-done"><b>✓ ${esc(r.group)} ENTREGUE PARA ${esc(r.faccao).toUpperCase()}</b>${r.troca ? `<p>${esc(r.troca)} recolhida (troca de ocupante).</p>` : ''}
      ${r.pendencias.length ? `<p class="ev2-err">Ocupação gravada, mas não foi possível atualizar: ${esc(r.pendencias.join(' e '))}. Refaça essa parte quando puder.</p>` : '<p>Ocupação, histórico, planilha e organização atualizados.</p>'}
      <div class="ev2-done-actions"><button type="button" data-ev2-copy="ex">COPIAR EXTRATO</button>${r.rs.length ? '<button type="button" data-ev2-copy="all">COPIAR SOLICITAÇÕES</button>' : ''}<button type="button" class="ev2-primary" data-ev2="fechar">CONCLUIR</button></div></div>`;
  }

  function bind() {
    const $$ = s => [...modal.querySelectorAll(s)];
    $$('[data-ev2="fechar"]').forEach(b => b.onclick = () => { if (!S.salvando) fechar(); });
    $$('[data-ev2="voltar"]').forEach(b => b.onclick = () => { S.step = Math.max(1, S.step - 1); render(); });
    $$('[data-ev2="avancar"]').forEach(b => b.onclick = () => { if (!erros().length) { S.step++; render(); } });
    $$('[data-ev2-step]').forEach(b => b.onclick = () => { const n = Number(b.dataset.ev2Step); if (n < S.step || !erros(n - 1).length) { S.step = n; render(); } });
    $$('[data-ev2-group]').forEach(b => b.onclick = () => escolherGroup(b.dataset.ev2Group));
    $$('[data-ev2-seg]').forEach(b => b.onclick = () => { S.seg = b.dataset.ev2Seg; render(); });
    const busca = modal.querySelector('#ev2Busca');
    if (busca) { busca.oninput = () => { S.busca = busca.value; const pos = busca.selectionStart; render(); const nb = modal.querySelector('#ev2Busca'); nb?.focus(); try { nb.setSelectionRange(pos, pos); } catch (e) { } }; if (S.step === 1 && !S._focou) { busca.focus(); } }
    /* campos: atualizam estado sem redesenhar a tela inteira (não perde o foco) */
    $$('[data-ev2-d]').forEach(i => i.oninput = () => { S.dados[i.dataset.ev2D] = i.value; refreshFoot(); });
    /* redesenho adiado: redesenhar dentro do change/blur derrubava o nó em foco */
    $$('[data-ev2-d="faccao"]').forEach(i => i.onchange = () => { S.dados.faccao = i.value; setTimeout(render, 0); });
    $$('[data-ev2-troca]').forEach(i => { const k = i.dataset.ev2Troca; const fn = () => { S.troca[k] = i.type === 'checkbox' ? i.checked : i.value; refreshFoot(); }; i.oninput = fn; i.onchange = fn; });
    $$('[data-ev2-b]').forEach(i => i.onchange = () => { const k = i.dataset.ev2B; S.ativos = i.checked ? [...new Set([...S.ativos, k])] : S.ativos.filter(x => x !== k); render(); });
    $$('[data-ev2="todos"]').forEach(b => b.onclick = () => { const f = atual(); S.ativos = deps.INSTALLATIONS.filter(([k]) => deps.isInstalled(f.beneficios || {}, k)).map(([k]) => k); render(); });
    $$('[data-ev2="nenhum"]').forEach(b => b.onclick = () => { S.ativos = []; render(); });
    $$('[data-ev2-copy]').forEach(b => b.onclick = async e => {
      e.preventDefault(); e.stopPropagation();
      const src = S.feito || S._preview || {}, k = b.dataset.ev2Copy, ex = src.ex, rs = src.rs || [];
      const txt = k === 'ex' ? ex : k === 'all' ? rs.map((r, i) => `${i + 1}. ${r.titulo}\n\n${r.texto}`).join('\n\n━━━━━━━━━━━━\n\n') : rs[Number(k.slice(1))]?.texto;
      try { await navigator.clipboard.writeText(txt || ''); const o = b.textContent; b.textContent = 'COPIADO ✓'; setTimeout(() => b.textContent = o, 1200); } catch (err) { deps.alert('Não foi possível copiar automaticamente.'); }
    });
    $$('[data-ev2="salvar"]').forEach(b => b.onclick = salvar);
  }
  function refreshFoot() { const foot = modal.querySelector('.ev2-foot'); if (!foot) return; const tmp = document.createElement('div'); tmp.innerHTML = rodape(); foot.replaceWith(tmp.firstElementChild); bind(); }

  /* ---------- gravação ---------- */
  async function salvar() {
    if (S.salvando || erros().length) return;
    const f = atual(), u = user(), pd = payloadDados(), { fs, db } = deps;
    /* revalida com os dados mais recentes carregados */
    const st = situacaoGroup(f);
    if (st !== 'DISPONIVEL' && st !== 'ASSUMIDA') return deps.alert('A situação deste Group mudou. Feche e abra a entrega de novo.');
    if (st === 'ASSUMIDA' && !pd.troca) return deps.alert('Este Group foi ocupado enquanto você preenchia. Reabra a entrega para fazer como troca.');
    S.salvando = true; render();
    const ex = extratoEntrega(f, pd, S.ativos, deps.INSTALLATIONS, deps.installedValue), rs = solicitacoesEntrega(f, S.ativos, pd.personalizacoes, deps.fmtCds);
    const agora = new Date(), hora = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;
    const recolhimento = pd.troca ? { motivo: pd.troca.motivo, motivoLabel: pd.troca.motivoLabel, responsavel: pd.staff, data: pd.dataEntrega, hora, justificativa: pd.troca.justificativa, baixoContingente: null, extrato: `RECOLHIMENTO POR TROCA DE OCUPANTE\nGroup: ${f.group}\nSai: ${pd.troca.faccaoAnterior}\nEntra: ${pd.faccao}\nMotivo: ${pd.troca.motivoLabel}\nJustificativa: ${pd.troca.justificativa}`, createdAtText: agora.toISOString(), createdBy: u.email, troca: true } : null;
    const payload = { group: f.group, qg: f.qg || '', segmento: f.segmento || '', faccao: pd.faccao, lider: pd.lider, staff: pd.staff, dataEntrega: pd.dataEntrega, plano: pd.plano, beneficiosAtivos: S.ativos, personalizacoes: pd.personalizacoes, solicitacoesGeradas: rs, extrato: ex, status: 'ATIVA', createdAt: fs.serverTimestamp(), createdAtText: agora.toISOString(), createdBy: u.email };
    if (pd.troca) payload.trocaDe = { faccao: pd.troca.faccaoAnterior, motivo: pd.troca.motivo, justificativa: pd.troca.justificativa };
    try {
      const lote = fs.writeBatch(db);
      deps.estado.entregas.filter(x => x.group === f.group && x.status === 'ATIVA').forEach(d => lote.set(fs.doc(db, 'highos', 'data', 'entregas', d.id), { status: 'RECOLHIDA', recolhidaEm: fs.serverTimestamp(), recolhidaPor: u.email, ...(recolhimento ? { recolhimento } : {}) }, { merge: true }));
      lote.set(fs.doc(deps.deliveryCol), payload);
      const grupo = { ...f, status: 'ATIVA', faccao: pd.faccao, lider: pd.lider, staff: pd.staff, dataEntrega: pd.dataEntrega,
        ocupacaoAtual: { faccao: pd.faccao, lider: pd.lider, staff: pd.staff, dataEntrega: pd.dataEntrega, plano: pd.plano, beneficiosAtivos: S.ativos },
        updatedAt: fs.serverTimestamp(), updatedBy: u.email };
      if (recolhimento) grupo.ultimoRecolhimento = { ...recolhimento, possuiEvidencia: false };
      lote.set(fs.doc(db, 'highos', 'data', 'faccoes', f.group), grupo);
      if (pd.troca) lote.set(fs.doc(db, 'highos', 'data', 'organizacoes', deps.orgKey(pd.troca.faccaoAnterior)), { status: 'SEM_GROUP', groupAtual: '', segmentoAtual: f.segmento || '', segmentoVinculado: f.segmento || '', qgAtual: '', ultimoRecolhimento: recolhimento, updatedAt: fs.serverTimestamp(), updatedBy: u.email }, { merge: true });
      await lote.commit();
      /* consequências: se falharem, a ocupação continua válida */
      const pend = [];
      if (pd.troca) { try { await fs.addDoc(deps.histCol, { sessionId: u.sessionId || '', tipo: 'RECOLHIMENTO', group: f.group, faccao: pd.troca.faccaoAnterior, qg: f.qg || '', motivo: pd.troca.motivo, motivoLabel: pd.troca.motivoLabel, responsavel: pd.staff, dataRecolhimento: pd.dataEntrega, horaRecolhimento: hora, justificativa: pd.troca.justificativa, baixoContingente: null, evidenciaId: '', extratoRecolhimento: recolhimento.extrato, troca: true, novaFaccao: pd.faccao, usuario: u.email, data: fs.serverTimestamp() }); } catch (e) { pend.push('histórico do recolhimento'); } }
      try { await fs.addDoc(deps.histCol, { sessionId: u.sessionId || '', tipo: 'ENTREGA_GROUP', group: f.group, faccao: pd.faccao, solicitacoesGeradas: rs, extrato: ex, ...(pd.troca ? { trocaDe: pd.troca.faccaoAnterior } : {}), usuario: u.email, data: fs.serverTimestamp() }); } catch (e) { pend.push('histórico da entrega'); }
      try { await deps.syncSheet([grupo]); } catch (e) { pend.push('planilha oficial'); }
      try { await deps.upsertOrg(payload, f); } catch (e) { pend.push('cadastro da organização'); }
      S.feito = { group: f.group, faccao: pd.faccao, troca: pd.troca?.faccaoAnterior || '', pendencias: pend, ex, rs };
      S.salvando = false; render();
      try { await deps.recarregar(); } catch (e) { }
    } catch (err) {
      S.salvando = false; render();
      deps.alert('Erro ao concluir a entrega (nada foi alterado): ' + err.message);
    }
  }

  return { abrir, fechar };
}
