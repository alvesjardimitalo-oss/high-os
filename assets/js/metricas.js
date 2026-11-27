// HIGH OS — relatórios de métricas (funções puras, sem DOM e sem Firebase).
// Entrada: as fichas semanais (hos/metricas/semanas) e os dias (hos/metricas/dias)
// que o coletor grava. Saída: o que a tela de Métricas desenha.

export const HORARIOS = ['14', '16', '21', '23'];
const r1 = (v) => Math.round(v * 10) / 10;
const media = (l) => (l.length ? l.reduce((a, b) => a + b, 0) / l.length : null);
const delta = (agora, antes) => (antes == null || agora == null ? null : agora - antes);
const deltaPct = (agora, antes) => (!antes || agora == null ? null : (agora - antes) / antes);

/** Semanas em ordem cronológica (a mais antiga primeiro). */
export const ordenarSemanas = (semanas) => [...(semanas || [])].sort((a, b) => a.de.localeCompare(b.de));

/** Média e pico das horas de RH (14/16/21/23h) e dos picos diários, por organização, dentro da semana. */
function diasDaSemana(dias, de, ate) {
  const porOrg = {};
  for (const d of dias || []) {
    if (d.dia < de || d.dia > ate) continue;
    for (const [org, o] of Object.entries(d.organizacoes || {})) {
      const x = (porOrg[org] ??= { picos: [], diaDoPico: '', picoDia: -1, horas: Object.fromEntries(HORARIOS.map((h) => [h, []])) });
      if (o.pico != null) {
        x.picos.push(o.pico);
        if (o.pico > x.picoDia) { x.picoDia = o.pico; x.diaDoPico = d.dia; }
      }
      for (const h of HORARIOS) if (o.horas?.[h]) x.horas[h].push(o.horas[h].pico);
    }
  }
  return porOrg;
}

/**
 * Relatório de uma semana: global, cada organização com comparação à semana anterior,
 * ranking e destaques. segmentoDe(org) diz o segmento (vem da planilha).
 */
export function relatorioSemana(semanas, dias, de, segmentoDe = () => '') {
  const lista = ordenarSemanas(semanas);
  const i = lista.findIndex((s) => s.de === de);
  const sem = lista[i >= 0 ? i : lista.length - 1];
  if (!sem) return null;
  // Semana de início do acompanhamento é parcial: comparar com ela inventa crescimento.
  const antBruta = lista[lista.indexOf(sem) - 1] || null;
  const ant = antBruta && !antBruta.inicioAcompanhamento ? antBruta : null;
  const detalhe = diasDaSemana(dias, sem.de, sem.ate);

  const posicoes = (s) => Object.fromEntries(Object.entries(s?.organizacoes || {}).sort((a, b) => b[1].pico - a[1].pico || b[1].mediaOnline - a[1].mediaOnline).map(([o], k) => [o, k + 1]));
  const posAgora = posicoes(sem), posAntes = posicoes(ant);

  const orgs = Object.entries(sem.organizacoes || {}).map(([org, o]) => {
    const a = ant?.organizacoes?.[org];
    const d = detalhe[org];
    const diasCom = d ? d.picos.filter((p) => p > 0).length : null;
    return {
      org, segmento: segmentoDe(org) || '',
      pico: o.pico, picoAnt: a?.pico ?? null, deltaPico: delta(o.pico, a?.pico),
      mediaOnline: o.mediaOnline, mediaOnlineAnt: a?.mediaOnline ?? null, deltaMedia: deltaPct(o.mediaOnline, a?.mediaOnline),
      ativos: o.ativos, ativosAnt: a?.ativos ?? null, membros: o.membros,
      // ativos conta quem saiu durante a semana; membros é o elenco atual, então limita em 100%.
      taxaAtividade: o.membros ? Math.min(1, o.ativos / o.membros) : null,
      horasOnline: o.horasOnline, horasPorAtivo: o.ativos ? r1(o.horasOnline / o.ativos) : null,
      mediaPicoDiario: d?.picos.length ? r1(media(d.picos)) : null,
      diaDoPico: d?.diaDoPico || '', diasComPresenca: diasCom, diasMedidos: d?.picos.length || 0,
      horarios: Object.fromEntries(HORARIOS.map((h) => [h, d?.horas[h].length ? r1(media(d.horas[h])) : null])),
      posicao: posAgora[org], posicaoAnt: posAntes[org] ?? null,
    };
  });

  const comAnterior = orgs.filter((o) => o.deltaPico != null);
  return {
    semana: sem, anterior: ant,
    global: {
      ...sem.global,
      deltaPico: delta(sem.global.pico, ant?.global.pico),
      deltaMedia: deltaPct(sem.global.mediaOnline, ant?.global.mediaOnline),
      deltaAtivos: deltaPct(sem.global.ativos, ant?.global.ativos),
      taxaAtividade: sem.global.membros ? Math.min(1, sem.global.ativos / sem.global.membros) : null,
      orgsComPresenca: orgs.filter((o) => o.pico > 0).length,
    },
    organizacoes: orgs,
    destaques: {
      altas: comAnterior.filter((o) => o.deltaPico > 0).sort((a, b) => b.deltaPico - a.deltaPico).slice(0, 5),
      quedas: comAnterior.filter((o) => o.deltaPico < 0).sort((a, b) => a.deltaPico - b.deltaPico).slice(0, 5),
      semPresenca: orgs.filter((o) => !o.pico).map((o) => o.org).sort(),
      baixaAtividade: orgs.filter((o) => o.membros >= 5 && o.taxaAtividade != null && o.taxaAtividade < 0.4).sort((a, b) => a.taxaAtividade - b.taxaAtividade),
    },
  };
}

/** Soma por segmento: membros ativos e presença simultânea somam; o pico mostra a melhor organização. */
export function porSegmento(orgs) {
  const seg = {};
  for (const o of orgs) {
    const s = (seg[o.segmento || 'Outros'] ??= { segmento: o.segmento || 'Outros', organizacoes: 0, ativos: 0, membros: 0, mediaOnline: 0, melhor: null });
    s.organizacoes++; s.ativos += o.ativos; s.membros += o.membros; s.mediaOnline = r1(s.mediaOnline + o.mediaOnline);
    if (!s.melhor || o.pico > s.melhor.pico) s.melhor = { org: o.org, pico: o.pico };
  }
  return Object.values(seg).sort((a, b) => b.mediaOnline - a.mediaOnline);
}

/** Acompanhamento: o pico de cada organização em cada semana, para ver a tendência. */
export function acompanhamento(semanas) {
  const lista = ordenarSemanas(semanas);
  const orgs = [...new Set(lista.flatMap((s) => Object.keys(s.organizacoes || {})))];
  return {
    semanas: lista.map((s) => ({ de: s.de, ate: s.ate, parcial: s.parcial, inicio: !!s.inicioAcompanhamento, global: s.global })),
    linhas: orgs.map((org) => ({ org, valores: lista.map((s) => s.organizacoes?.[org] || null) })),
  };
}

/** CSV do relatório da semana (separador ; para abrir direto no Excel em português). */
export function csvSemana(rel, nomeDe = () => '') {
  const n = (v) => (v == null ? '' : typeof v === 'number' ? String(v).replace('.', ',') : String(v));
  const cab = ['Posição', 'Group', 'Facção', 'Segmento', 'Pico', 'Pico sem. anterior', 'Variação pico', 'Média simultânea', 'Média diária de pico', 'Membros ativos', 'Membros', 'Taxa de atividade %', 'Horas online', 'Horas por ativo', 'Dias com presença', 'Dia do pico', ...HORARIOS.map((h) => `Pico médio ${h}h`)];
  const linhas = [...rel.organizacoes].sort((a, b) => a.posicao - b.posicao).map((o) => [o.posicao, o.org, nomeDe(o.org), o.segmento, o.pico, o.picoAnt, o.deltaPico, o.mediaOnline, o.mediaPicoDiario, o.ativos, o.membros, o.taxaAtividade == null ? '' : Math.round(o.taxaAtividade * 100), o.horasOnline, o.horasPorAtivo, o.diasComPresenca, o.diaDoPico, ...HORARIOS.map((h) => o.horarios[h])]);
  return [cab, ...linhas].map((l) => l.map((v) => `"${n(v).replace(/"/g, '""')}"`).join(';')).join('\r\n');
}

/**
 * Atividade de um Group para a ficha da facção: a linha dele no relatório da semana
 * mais recente (com comparação), o pico dia a dia e o pico semana a semana.
 * A API grava "Lavagem01" e a planilha "LAVAGEM01": a busca ignora maiúsculas.
 * Devolve null se o coletor nunca viu esse Group.
 */
export function atividadeDoGroup(semanas, dias, group, { nDias = 14, nSemanas = 8 } = {}) {
  const alvo = String(group || '').trim().toLowerCase();
  const chave = (obj) => Object.keys(obj || {}).find((k) => k.toLowerCase() === alvo);
  const lista = ordenarSemanas(semanas);
  if (!lista.some((s) => chave(s.organizacoes))) return null;
  const ultima = lista[lista.length - 1];
  const rel = relatorioSemana(lista, dias, ultima.de);
  const org = rel.organizacoes.find((o) => o.org.toLowerCase() === alvo) || null;
  const serieDias = [...(dias || [])].sort((a, b) => a.dia.localeCompare(b.dia)).slice(-nDias).map((d) => {
    const o = d.organizacoes?.[chave(d.organizacoes)];
    return { dia: d.dia, pico: o?.pico ?? 0, parcial: !!d.parcial };
  });
  const serieSemanas = lista.slice(-nSemanas).map((s) => {
    const o = s.organizacoes?.[chave(s.organizacoes)];
    return { de: s.de, ate: s.ate, parcial: !!s.parcial, inicio: !!s.inicioAcompanhamento, pico: o?.pico ?? 0, mediaOnline: o?.mediaOnline ?? 0, ativos: o?.ativos ?? 0 };
  });
  return { semana: rel.semana, anterior: rel.anterior, org, totalOrgs: rel.organizacoes.length, serieDias, serieSemanas };
}
