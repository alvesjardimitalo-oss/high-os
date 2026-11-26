// node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import { diaHoraBR, montarAtual, montarDias } from '../coletor/montar.mjs';

const MEIA_NOITE_BR_23_11 = Date.UTC(2026, 10, 23, 3); // 23/11/2026 00:00 em Brasília

test('dia e hora ficam no fuso de Brasília', () => {
  assert.deepEqual(diaHoraBR(MEIA_NOITE_BR_23_11), { dia: '2026-11-23', hora: '00' });
  assert.deepEqual(diaHoraBR(MEIA_NOITE_BR_23_11 - 1), { dia: '2026-11-22', hora: '23' });
});

test('overview vira resumo por organização em horas', () => {
  const ov = {
    trackingSince: 1794668335298,
    period: { from: '2026-11-23', to: '2026-11-26', label: '23/11 — 26/11' },
    totals: { members: 551, activeMembers: 366, onlineNow: 8, peakOnline: 188, onlineMs: 36e6 },
    previous: { peakOnline: 176, activeMembers: 415, onlineMs: 72e6 },
    daily: [{ key: '2026-11-26', label: '26/11', partial: true, peakOnline: 188, onlineMs: 18e5 }],
    byOrganization: [{ organization: 'Lavagem01', members: 94, activeMembers: 66, onlineNow: 2, peakOnline: 29, onlineMs: 2420705869 }, { label: '' }],
  };
  const a = montarAtual({ semana: ov, hoje: null, mes: ov, catalogo: { groups: [{ group: 'Armas01', family: 'Armas', vip: true, total: 2, online: 0 }] }, lidoEm: 'x' });
  assert.equal(a.acompanhandoDesde, 1794668335298);
  assert.equal(a.hoje, null);
  assert.equal(a.semana.total.horasOnline, 10);
  assert.equal(a.semana.anterior.horasOnline, 20);
  assert.deepEqual(a.semana.serie[0], { chave: '2026-11-26', rotulo: '26/11', parcial: true, pico: 188, horasOnline: 0.5 });
  assert.equal(a.semana.organizacoes.length, 1, 'organização sem nome é descartada');
  assert.deepEqual(a.semana.organizacoes[0], { org: 'Lavagem01', membros: 94, ativos: 66, onlineAgora: 2, pico: 29, horasOnline: 672.4 });
  assert.deepEqual(a.catalogo, [{ group: 'Armas01', familia: 'Armas', vip: true, membros: 2, online: 0 }]);
});

test('presença vira um documento por dia, com as horas dentro', () => {
  const h = 3600000;
  const dias = montarDias({
    Lavagem01: {
      dia: { buckets: [
        { startAt: MEIA_NOITE_BR_23_11, avg: '5.6', peak: 29, partial: false },
        { startAt: MEIA_NOITE_BR_23_11 - 24 * h, avg: 0, peak: 0 },
      ] },
      hora: { buckets: [
        { startAt: MEIA_NOITE_BR_23_11 + 21 * h, avg: 9.5, peak: 28 },
        { startAt: MEIA_NOITE_BR_23_11 + 24 * h, avg: 1, peak: 2, partial: true },
      ] },
    },
    Armas05: { dia: { buckets: [{ startAt: MEIA_NOITE_BR_23_11, avg: 11.9, peak: 27 }] }, hora: null },
  });
  assert.deepEqual(Object.keys(dias).sort(), ['2026-11-23', '2026-11-24'], 'dia zerado não cria documento');
  assert.deepEqual(dias['2026-11-23'].organizacoes.Lavagem01, { media: 5.6, pico: 29, parcial: false, horas: { 21: { media: 9.5, pico: 28, parcial: false } } });
  assert.deepEqual(dias['2026-11-23'].organizacoes.Armas05, { media: 11.9, pico: 27, parcial: false });
  assert.deepEqual(dias['2026-11-24'].organizacoes.Lavagem01.horas['00'], { media: 1, pico: 2, parcial: true });
});
