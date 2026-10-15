/* =====================================================================
   HIGH OS · OCUPAÇÃO DOS GROUPS — REGRA ÚNICA (V14)
   ---------------------------------------------------------------------
   Antes existiam três leituras diferentes de "ocupado":
     - Organizações: bastava ter nome de facção;
     - Dashboard / métricas / Discord: status ATIVA + facção;
     - outras telas: só status ATIVA.
   Um Group editado à mão (facção preenchida com status INATIVA, ou o
   contrário) aparecia assumido numa tela e vago em outra.

   Agora toda tela pergunta para cá. Situações:
     ASSUMIDA    status ATIVA e facção preenchida
     DISPONIVEL  sem facção, status não ATIVA, com QG/favela cadastrado
     SEM_QG      sem facção e sem QG/favela (não pode ser entregue)
     REVISAR     dados contraditórios: precisa de correção antes de
                 entrar em qualquer contagem ou de ser entregue

   Funções puras: não acessam Firestore nem DOM.
   ===================================================================== */

const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

export function temFaccao(f = {}) { return !!String(f.faccao || '').trim(); }

export function temQG(f = {}) {
  const q = String(f.qg || f.nomeQG || f.nomeLocal || '').trim();
  return !!q && !/^(sem\s*(qg|local)|-|—|n\/a|nulo)$/i.test(q);
}

export function situacaoGroup(f = {}) {
  const fac = temFaccao(f), ativa = f.status === 'ATIVA';
  if (fac && ativa) return 'ASSUMIDA';
  if (fac !== ativa) return 'REVISAR';
  return temQG(f) ? 'DISPONIVEL' : 'SEM_QG';
}

export const SITUACOES = {
  ASSUMIDA:   { label: 'ASSUMIDA',     curto: 'assumidas',   classe: 'assumed' },
  DISPONIVEL: { label: 'DISPONÍVEL',   curto: 'disponíveis', classe: 'available' },
  SEM_QG:     { label: 'SEM QG',       curto: 'sem QG',      classe: 'unavailable' },
  REVISAR:    { label: 'REVISAR',      curto: 'a revisar',   classe: 'review' }
};

export function ocupado(f) { return situacaoGroup(f) === 'ASSUMIDA'; }

export function groupsOperacionais(lista = []) { return lista.filter(f => f && !f.removido); }

/** Outro Group ocupado pela mesma facção (nome comparado sem acento/espaço). */
export function faccaoOcupandoOutro(nome, lista = [], exceto = '') {
  const k = norm(nome); if (!k) return null;
  return groupsOperacionais(lista).find(f => f.group !== exceto && temFaccao(f) && norm(f.faccao) === k) || null;
}

function msDe(v) {
  if (!v) return NaN;
  if (typeof v.toMillis === 'function') return v.toMillis();
  if (typeof v.seconds === 'number') return v.seconds * 1000;
  const t = Date.parse(v); return t;
}

/** Desde quando o Group está livre (recolhimento ou reset do anúncio). */
export function vagoDesdeMs(f = {}) {
  const c = [f.ultimoRecolhimento?.createdAtText, f.anuncioDiscordStatus?.resetEm].map(msDe).filter(Number.isFinite);
  return c.length ? Math.max(...c) : NaN;
}
export function diasVago(f = {}, agora = Date.now()) {
  const t = vagoDesdeMs(f); return Number.isFinite(t) ? Math.max(0, Math.floor((agora - t) / 86400000)) : null;
}

/** Hoje no formato usado nas entregas (dd/mm/aaaa). */
export function hojeBR(d = new Date()) {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/* ---------------------------------------------------------------
   Inconsistências para a tela de revisão. Cada uma traz as ações
   possíveis; nenhuma é aplicada sem o administrador escolher.
   --------------------------------------------------------------- */
export function inconsistencias(lista = [], entregas = []) {
  const out = [], gs = groupsOperacionais(lista);
  gs.forEach(f => {
    const fac = temFaccao(f), ativa = f.status === 'ATIVA';
    if (fac && !ativa) out.push({
      id: `fac-sem-ativa:${f.group}`, group: f.group, nivel: 'alto', tipo: 'FACCAO_SEM_ATIVA',
      titulo: `${f.group}: facção "${f.faccao}" preenchida, mas status ${f.status || 'vazio'}`,
      detalhe: 'Organizações mostrava como assumida; Dashboard, métricas e Discord como vago.',
      acoes: [
        { id: 'marcar-assumida', label: `MANTER ${String(f.faccao).toUpperCase()} (status ATIVA)`, patch: { status: 'ATIVA' } },
        { id: 'liberar', label: 'LIBERAR O GROUP', patch: 'LIBERAR' }
      ]
    });
    if (!fac && ativa) out.push({
      id: `ativa-sem-fac:${f.group}`, group: f.group, nivel: 'alto', tipo: 'ATIVA_SEM_FACCAO',
      titulo: `${f.group}: status ATIVA sem facção`,
      detalhe: 'Contava como ocupado em algumas telas sem ter ocupante.',
      acoes: [{ id: 'marcar-vago', label: 'MARCAR COMO VAGO', patch: { status: 'INATIVA' } }]
    });
    if (fac && ativa && !temQG(f)) out.push({
      id: `assumida-sem-qg:${f.group}`, group: f.group, nivel: 'medio', tipo: 'ASSUMIDA_SEM_QG',
      titulo: `${f.group}: assumida por ${f.faccao} sem QG/favela cadastrado`,
      detalhe: 'Cadastre o QG no perfil do Group.', acoes: [{ id: 'abrir', label: 'ABRIR PERFIL', patch: 'ABRIR' }]
    });
    if (fac && ativa && (!String(f.lider || '').trim() || !String(f.dataEntrega || '').trim())) out.push({
      id: `assumida-incompleta:${f.group}`, group: f.group, nivel: 'baixo', tipo: 'ASSUMIDA_INCOMPLETA',
      titulo: `${f.group}: assumida sem ${[!String(f.lider || '').trim() && 'líder', !String(f.dataEntrega || '').trim() && 'data de entrega'].filter(Boolean).join(' e ')}`,
      detalhe: 'Complete no perfil do Group.', acoes: [{ id: 'abrir', label: 'ABRIR PERFIL', patch: 'ABRIR' }]
    });
  });
  /* mesma facção em mais de um Group */
  const porFac = new Map();
  gs.filter(f => temFaccao(f)).forEach(f => { const k = norm(f.faccao); porFac.set(k, [...(porFac.get(k) || []), f]); });
  porFac.forEach(arr => {
    if (arr.length > 1) out.push({
      id: `dup:${norm(arr[0].faccao)}`, group: arr[0].group, nivel: 'alto', tipo: 'FACCAO_DUPLICADA',
      titulo: `${arr[0].faccao} aparece em ${arr.length} Groups: ${arr.map(f => f.group).join(', ')}`,
      detalhe: 'Uma facção só pode ocupar um Group. Recolha ou corrija os demais.',
      acoes: arr.map(f => ({ id: 'abrir', label: `ABRIR ${f.group}`, patch: 'ABRIR', group: f.group }))
    });
  });
  /* entrega marcada como ATIVA de quem não ocupa mais o Group */
  (entregas || []).filter(d => d.status === 'ATIVA').forEach(d => {
    const g = gs.find(f => f.group === d.group);
    if (!g || !temFaccao(g) || norm(g.faccao) !== norm(d.faccao)) out.push({
      id: `entrega-orfa:${d.id}`, group: d.group, nivel: 'medio', tipo: 'ENTREGA_ORFA', entregaId: d.id,
      titulo: `Entrega de ${d.faccao || '—'} em ${d.group} ainda consta como ATIVA`,
      detalhe: g && temFaccao(g) ? `O Group hoje está com ${g.faccao}.` : 'O Group hoje está vago.',
      acoes: [
        ...(g && !temFaccao(g) && temQG(g) && d.faccao && !gs.some(x => x.group !== g.group && temFaccao(x) && norm(x.faccao) === norm(d.faccao)) ? [{ id: 'restaurar', label: `RESTAURAR ${String(d.faccao).toUpperCase()} NO GROUP`, patch: { status: 'ATIVA', faccao: d.faccao, lider: d.lider || '', staff: d.staff || '', dataEntrega: d.dataEntrega || '' } }] : []),
        { id: 'fechar-entrega', label: 'MARCAR ENTREGA COMO RECOLHIDA', patch: 'FECHAR_ENTREGA' }
      ]
    });
  });
  const ordem = { alto: 0, medio: 1, baixo: 2 };
  return out.sort((a, b) => ordem[a.nivel] - ordem[b.nivel] || String(a.group).localeCompare(String(b.group)));
}

/** Campos que voltam ao estado "vago" ao liberar/recolher um Group. */
export const CAMPOS_VAGO = { status: 'INATIVA', faccao: '', lider: '', staff: '', dataEntrega: '', ocupacaoAtual: null };
