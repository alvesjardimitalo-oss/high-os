// HIGH OS — coletor de métricas: funções puras que transformam as respostas da API
// do metricas.highrp.net nos documentos gravados no Firestore. Sem rede, sem Firebase.

/** Dia (YYYY-MM-DD) e hora (HH) em Brasília. O Brasil não tem horário de verão desde 2019: UTC-3 fixo. */
export function diaHoraBR(ms) {
  const iso = new Date(Number(ms) - 3 * 3600 * 1000).toISOString();
  return { dia: iso.slice(0, 10), hora: iso.slice(11, 13) };
}

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const horas = (ms) => Math.round((num(ms) / 3600000) * 10) / 10;

/** Resumo por organização de um overview (semana, hoje…). */
function porOrganizacao(ov) {
  return (ov?.byOrganization || []).map((o) => ({
    org: String(o.organization || o.label || ''),
    membros: num(o.members),
    ativos: num(o.activeMembers),
    onlineAgora: num(o.onlineNow),
    pico: num(o.peakOnline),
    horasOnline: horas(o.onlineMs),
  })).filter((o) => o.org);
}

function resumoPeriodo(ov) {
  if (!ov) return null;
  return {
    de: ov.period?.from || '',
    ate: ov.period?.to || '',
    rotulo: ov.period?.label || '',
    total: {
      membros: num(ov.totals?.members),
      ativos: num(ov.totals?.activeMembers),
      onlineAgora: num(ov.totals?.onlineNow),
      pico: num(ov.totals?.peakOnline),
      horasOnline: horas(ov.totals?.onlineMs),
    },
    anterior: { pico: num(ov.previous?.peakOnline), ativos: num(ov.previous?.activeMembers), horasOnline: horas(ov.previous?.onlineMs) },
    serie: (ov.daily || []).map((d) => ({ chave: String(d.key || ''), rotulo: String(d.label || ''), parcial: !!d.partial, pico: num(d.peakOnline), horasOnline: horas(d.onlineMs) })),
    organizacoes: porOrganizacao(ov),
  };
}

/** Documento hos/metricas: o retrato mais recente, que a tela de Métricas abre primeiro. */
export function montarAtual({ semana, hoje, mes, catalogo, lidoEm }) {
  return {
    lidoEm,
    acompanhandoDesde: num(semana?.trackingSince || hoje?.trackingSince) || null,
    hoje: resumoPeriodo(hoje),
    semana: resumoPeriodo(semana),
    mes: resumoPeriodo(mes),
    catalogo: (catalogo?.groups || []).map((g) => ({
      group: String(g.group || g.name || ''),
      familia: String(g.family || ''),
      vip: !!g.vip,
      membros: num(g.total),
      online: num(g.online),
    })).filter((g) => g.group),
  };
}

const DIA_MS = 86400000;
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);

/** Semanas (segunda a domingo, horário de Brasília) desde o início do acompanhamento até agora. */
export function semanasDesde(desdeMs, agoraMs) {
  const meiaNoiteBR = (ms) => { const { dia } = diaHoraBR(ms); return Date.parse(dia + 'T00:00:00Z'); };
  const segunda = (ms) => { const d = meiaNoiteBR(ms); return d - ((new Date(d).getUTCDay() + 6) % 7) * DIA_MS; };
  const hoje = iso(meiaNoiteBR(agoraMs));
  const out = [];
  for (let s = segunda(desdeMs); s <= segunda(agoraMs); s += 7 * DIA_MS) {
    const ate = iso(s + 6 * DIA_MS);
    out.push({ de: iso(s), ate, parcial: ate >= hoje });
  }
  return out;
}

/**
 * Overview de uma semana fechada (ou em andamento) → documento hos/metricas/semanas/{segunda}.
 * mediaOnline = jogadores simultâneos em média (tempo online ÷ duração da semana): mede
 * presença real, coisa que o pico sozinho não mostra.
 */
export function montarSemana(ov, { de, ate, parcial }, lidoMs) {
  const inicio = num(ov?.period?.startAt);
  const fim = Math.min(num(ov?.period?.endAt) || lidoMs, lidoMs);
  const duracao = Math.max(fim - inicio, 3600000);
  const media = (ms) => Math.round((num(ms) / duracao) * 10) / 10;
  const serie = (ov?.daily || []).map((d) => ({ dia: String(d.key || ''), pico: num(d.peakOnline), horasOnline: horas(d.onlineMs), parcial: !!d.partial }));
  const topo = serie.reduce((m, d) => (d.pico > (m?.pico ?? -1) ? d : m), null);
  const organizacoes = {};
  for (const o of ov?.byOrganization || []) {
    const org = String(o.organization || o.label || '');
    if (!org) continue;
    organizacoes[org] = { pico: num(o.peakOnline), ativos: num(o.activeMembers), membros: num(o.members), horasOnline: horas(o.onlineMs), mediaOnline: media(o.onlineMs) };
  }
  return {
    de, ate, parcial: !!parcial,
    // Semana que começou antes do site passar a medir: números baixos não são queda real.
    inicioAcompanhamento: num(ov?.trackingSince) > inicio,
    global: {
      pico: num(ov?.totals?.peakOnline), diaDoPico: topo?.dia || '',
      ativos: num(ov?.totals?.activeMembers), membros: num(ov?.totals?.members),
      horasOnline: horas(ov?.totals?.onlineMs), mediaOnline: media(ov?.totals?.onlineMs),
    },
    dias: serie,
    organizacoes,
  };
}

/**
 * Presença por dia e por hora de cada organização → um documento por dia
 * (hos/metricas/dias/{YYYY-MM-DD}). Gravado com merge, então cada execução só
 * acrescenta ou corrige horas: o histórico fica no Firestore mesmo que o site apague.
 * presencas: { [org]: { dia: <presence grouping=day>, hora: <presence grouping=hour> } }
 */
export function montarDias(presencas) {
  const dias = {};
  const slot = (dia, org) => {
    dias[dia] ??= { dia, organizacoes: {} };
    return (dias[dia].organizacoes[org] ??= {});
  };
  for (const [org, p] of Object.entries(presencas || {})) {
    for (const b of p?.dia?.buckets || []) {
      if (!num(b.peak) && !num(b.avg)) continue;
      const { dia } = diaHoraBR(b.startAt);
      Object.assign(slot(dia, org), { media: num(b.avg), pico: num(b.peak), parcial: !!b.partial });
    }
    for (const b of p?.hora?.buckets || []) {
      const { dia, hora } = diaHoraBR(b.startAt);
      const s = slot(dia, org);
      (s.horas ??= {})[hora] = { media: num(b.avg), pico: num(b.peak), parcial: !!b.partial };
    }
  }
  return dias;
}
