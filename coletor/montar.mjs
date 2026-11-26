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
