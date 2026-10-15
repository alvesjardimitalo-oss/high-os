/* =====================================================================
   HIGH OS · MOTOR DE MÉTRICAS (V14.1)
   ---------------------------------------------------------------------
   Regra de negócio: a métrica pertence à FACÇÃO que ocupava o Group no
   momento da coleta, não ao Group.
     - Imperial assumiu o Armas01 dia 10 → dias 1–9 são da facção anterior;
     - facção transferida Drogas03 → Armas03 em 23/09 → o histórico dela
       segue junto e aparece no Group atual;
     - coleta em Group vago vira anomalia (não entra em relatório).

   Linha do tempo de ocupação, por Group, montada com:
     1. entregas (data da entrega → recolhimento);
     2. transferências de painel (histórico TRANSFERENCIA_PAINEL);
     3. situação atual do Group (data de entrega do cadastro) para
        ocupações anteriores ao registro de entregas no sistema.
   Antes do primeiro evento conhecido o Group fica "sem ocupante
   identificado" — exceto quando ele está assumido hoje e não há data
   nenhuma: aí vale a facção atual (o cadastro incompleto aparece em
   Revisar ocupação).

   Funções puras; o app injeta leitores de data/slot.
   ===================================================================== */
import { ocupado, temFaccao } from './ocupacao.js';

export const SLOTS_PADRAO = ['14H', '16H', '21H', '23H'];
const SLOT_FIELDS = ['14H', '16H', '21H', '23H', 'h14', 'h16', 'h21', 'h23'];

export const chave = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

export function msDe(v) {
  if (v === null || v === undefined || v === '') return NaN;
  if (typeof v?.toMillis === 'function') return v.toMillis();
  if (typeof v?.seconds === 'number') return v.seconds * 1000;
  if (v instanceof Date) return v.getTime();
  const br = String(v).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?$/);
  if (br) { let y = +br[3]; if (y < 100) y += 2000; return new Date(y, +br[2] - 1, +br[1], +(br[4] || 0), +(br[5] || 0)).getTime(); }
  const t = Date.parse(v); return t;
}
const slotMin = h => { const m = String(h).toUpperCase().match(/^(\d{1,2})(?::(\d{2}))?H?$/); return m ? (+m[1]) * 60 + (+(m[2] || 0)) : 0; };

/* ---------- linha do tempo ---------- */
export function montarLinhaDoTempo({ faccoes = [], entregas = [], transferencias = [] } = {}) {
  const ev = new Map(), nomes = new Map();
  const push = (group, t, faccao, fonte) => {
    if (!group || !Number.isFinite(t)) return;
    const k = chave(group); if (!ev.has(k)) ev.set(k, []);
    ev.get(k).push({ t, faccao: faccao ? String(faccao).trim() : null, fonte });
    if (faccao) nomes.set(chave(faccao), String(faccao).trim());
  };
  entregas.forEach(d => {
    const ini = [msDe(d.dataEntrega), msDe(d.createdAtText), msDe(d.createdAt)].find(Number.isFinite);
    if (!Number.isFinite(ini)) return;
    push(d.group, ini, d.faccao, 'entrega');
    if (d.status && d.status !== 'ATIVA') {
      const fim = [msDe(d.recolhidaEm), msDe(d.recolhimento?.createdAtText), msDe(d.recolhimento?.data)].find(Number.isFinite);
      if (Number.isFinite(fim)) push(d.group, Math.max(fim, ini + 1), null, 'recolhimento');
    }
  });
  transferencias.forEach(h => {
    const t = [msDe(h.data), msDe(h.createdAtText)].find(Number.isFinite); if (!Number.isFinite(t)) return;
    push(h.group, t, h.depois?.origem?.faccao || null, 'transferencia');
    push(h.groupDestino, t, h.depois?.destino?.faccao || null, 'transferencia');
  });
  ev.forEach(l => l.sort((a, b) => a.t - b.t || (a.faccao === null) - (b.faccao === null)));
  /* situação atual: o último ocupante conhecido precisa bater com o cadastro */
  faccoes.filter(f => f && !f.removido).forEach(f => {
    const k = chave(f.group), l = ev.get(k) || [], ult = l[l.length - 1];
    if (ocupado(f)) {
      if (!ult || chave(ult.faccao) !== chave(f.faccao)) {
        const t0 = msDe(f.dataEntrega);
        if (Number.isFinite(t0)) push(f.group, ult ? Math.max(t0, ult.t + 1) : t0, f.faccao, 'cadastro');
        else if (!ult) push(f.group, -8640000000000000, f.faccao, 'cadastro-sem-data');
        else push(f.group, ult.t + 1, f.faccao, 'cadastro');
      }
    } else if (!ult) {
      /* vago hoje e sem nenhum registro: tratado como vago, para continuar
         detectando "Group vago com player" como antes */
      push(f.group, -8640000000000000, null, 'cadastro-vago');
    } else if (ult && ult.faccao) {
      const t1 = [msDe(f.ultimoRecolhimento?.createdAtText), msDe(f.anuncioDiscordStatus?.resetEm), msDe(f.updatedAt)].find(Number.isFinite);
      if (Number.isFinite(t1) && t1 > ult.t) push(f.group, t1, null, 'cadastro');
    }
  });
  ev.forEach(l => l.sort((a, b) => a.t - b.t));
  return {
    eventos: ev,
    nome: k => nomes.get(chave(k)) || k,
    /** facção no instante t · null = Group vago · undefined = sem ocupante identificado (antes do 1º registro) */
    ocupanteEm(group, t) {
      const l = ev.get(chave(group)); if (!l || !l.length) return undefined;
      let atual; for (const e of l) { if (e.t <= t) atual = e.faccao; else break; }
      return atual;
    }
  };
}

/* ---------- atribuição das leituras ---------- */
/**
 * rows: linhas brutas (planilha/espelho); cada linha = 1 Group × 1 dia.
 * Devolve linhas derivadas, uma por (facção × dia), já no Group ATUAL da
 * facção. Facção que não ocupa nada hoje vai para "EX:<facção>" (fica
 * fora das visões operacionais). Slots em Group vago vão para semOcupante.
 */
export function atribuirLinhas(rows = [], tl, { faccoes = [], dataDe, slotsDe }) {
  const grupoAtual = new Map();
  faccoes.filter(f => f && !f.removido && ocupado(f)).forEach(f => grupoAtual.set(chave(f.faccao), f));
  const saida = new Map(), semOcupante = [];
  rows.forEach(r => {
    const g = String(r.group || r.organizacao || r.faccao || '').trim(); if (!g) return;
    const d = dataDe(r); if (!d || !d.getTime || !d.getTime()) return;
    const base = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const slots = slotsDe(r), porOcup = new Map();
    Object.entries(slots).forEach(([h, v]) => {
      const occ = tl.ocupanteEm(g, base + slotMin(h) * 60000);
      if (occ === undefined) return; /* antes do primeiro registro: não conta para ninguém */
      const k = occ ? chave(occ) : '';
      if (!porOcup.has(k)) porOcup.set(k, { occ, slots: {} });
      porOcup.get(k).slots[h] = v;
    });
    porOcup.forEach(({ occ, slots: s }) => {
      if (!occ) { semOcupante.push({ ...r, group: g, slots: s }); return; }
      const atual = grupoAtual.get(chave(occ));
      /* facção que saiu: linha própria "Group • Facção" (nunca se mistura com a atual) */
      const destino = atual ? atual.group : `${g} • ${occ}`;
      const id = `${chave(destino)}|${base}`;
      const limpo = { ...r }; SLOT_FIELDS.forEach(k => { delete limpo[k]; });
      const prev = saida.get(id);
      if (prev) { Object.assign(prev.slots, s); if (chave(g) !== chave(prev.groupOrigem) && !prev.gruposOrigem.includes(g)) prev.gruposOrigem.push(g); return; }
      saida.set(id, {
        ...limpo, group: destino, organizacao: undefined, slots: { ...s },
        faccaoSnapshot: atual ? atual.faccao : occ, qgSnapshot: atual ? (atual.qg || '') : (r.qgSnapshot || ''), segmentoSnapshot: atual ? (atual.segmento || '') : (r.segmentoSnapshot || ''),
        groupOrigem: g, gruposOrigem: [g], __atribuido: true, __exFaccao: !atual
      });
    });
  });
  return { linhas: [...saida.values()], semOcupante };
}

/* ---------- coleta parcial ---------- */
/**
 * Situação das coletas de um dia: quantas faltaram (já passou o horário)
 * e quantas ainda vão acontecer (hoje, horário futuro).
 */
export function coletaDoDia(slots = {}, dia, agora = new Date(), esperados = SLOTS_PADRAO) {
  const base = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate()).getTime();
  const tem = new Set(Object.keys(slots).filter(k => Number.isFinite(Number(slots[k]))));
  let faltam = 0, aguardando = 0;
  esperados.forEach(h => { if (tem.has(h)) return; if (base + slotMin(h) * 60000 > agora.getTime()) aguardando++; else faltam++; });
  return { feitas: esperados.filter(h => tem.has(h)).length, esperadas: esperados.length, faltam, aguardando, parcial: faltam + aguardando > 0 && tem.size > 0 };
}
export function rotuloColeta(c) {
  if (!c || !c.parcial) return '';
  if (c.aguardando) return `parcial — aguardando +${c.aguardando} coleta${c.aguardando > 1 ? 's' : ''}`;
  return `parcial — ${c.faltam} coleta${c.faltam > 1 ? 's' : ''} sem registro`;
}
