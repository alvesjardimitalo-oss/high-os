// node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import { relatorioSemana, porSegmento, acompanhamento, csvSemana } from '../assets/js/metricas.js';
import { semanasDesde, montarSemana } from '../coletor/montar.mjs';

const org = (pico, ativos, membros, mediaOnline, horasOnline = 70) => ({ pico, ativos, membros, mediaOnline, horasOnline });
const SEMANAS = [
  { de: '2026-11-23', ate: '2026-11-29', parcial: true, global: { pico: 188, ativos: 366, membros: 551, mediaOnline: 54.4, horasOnline: 4000 },
    organizacoes: { Lavagem01: org(29, 66, 94, 9.1), Armas05: org(20, 30, 61, 6), Drogas01: org(0, 0, 10, 0) } },
  { de: '2026-11-16', ate: '2026-11-22', global: { pico: 191, ativos: 497, membros: 551, mediaOnline: 45.7, horasOnline: 7600 },
    organizacoes: { Lavagem01: org(29, 80, 94, 7), Armas05: org(27, 40, 61, 5), Drogas01: org(3, 2, 10, 0.2) } },
];
const DIAS = [
  { dia: '2026-11-23', organizacoes: { Lavagem01: { pico: 20, horas: { 21: { pico: 18 }, 23: { pico: 10 } } }, Armas05: { pico: 0 } } },
  { dia: '2026-11-24', organizacoes: { Lavagem01: { pico: 29, horas: { 21: { pico: 24 } } }, Armas05: { pico: 20 } } },
  { dia: '2026-11-22', organizacoes: { Lavagem01: { pico: 99 } } }, // fora da semana
];

test('relatório da semana compara com a anterior e ranqueia por pico', () => {
  const r = relatorioSemana(SEMANAS, DIAS, '2026-11-23', (o) => o.replace(/\d+$/, ''));
  assert.equal(r.anterior.de, '2026-11-16');
  assert.equal(r.global.deltaPico, -3);
  assert.ok(Math.abs(r.global.deltaMedia - (54.4 / 45.7 - 1)) < 1e-9);
  assert.equal(r.global.orgsComPresenca, 2);
  const l = r.organizacoes.find((o) => o.org === 'Lavagem01');
  assert.equal(l.posicao, 1); assert.equal(l.posicaoAnt, 1);
  assert.equal(l.mediaPicoDiario, 24.5, 'dia fora da semana não entra');
  assert.equal(l.diaDoPico, '2026-11-24');
  assert.equal(l.diasComPresenca, 2);
  assert.deepEqual(l.horarios, { 14: null, 16: null, 21: 21, 23: 10 });
  assert.equal(l.horasPorAtivo, 1.1);
  const a = r.organizacoes.find((o) => o.org === 'Armas05');
  assert.equal(a.deltaPico, -7); assert.equal(a.diasComPresenca, 1); assert.equal(a.segmento, 'Armas');
  assert.deepEqual(r.destaques.quedas.map((o) => o.org), ['Armas05', 'Drogas01']);
  assert.deepEqual(r.destaques.semPresenca, ['Drogas01']);
  assert.deepEqual(r.destaques.baixaAtividade.map((o) => o.org), ['Drogas01'], 'Drogas01: 0 de 10 ativos');
});

test('semana sem anterior e semana desconhecida caem na mais recente', () => {
  const r = relatorioSemana(SEMANAS, [], 'xxxx');
  assert.equal(r.semana.de, '2026-11-23');
  assert.equal(relatorioSemana(SEMANAS, [], '2026-11-16').anterior, null);
  assert.equal(relatorioSemana([], [], 'x'), null);
});

test('semana de início do acompanhamento não serve de comparação', () => {
  const inicio = { ...SEMANAS[1], de: '2026-11-09', ate: '2026-11-15', inicioAcompanhamento: true };
  const r = relatorioSemana([SEMANAS[1], inicio], [], '2026-11-16');
  assert.equal(r.anterior, null);
  assert.equal(r.global.deltaPico, null);
  assert.equal(r.organizacoes[0].posicaoAnt, null);
});

test('taxa de atividade não passa de 100%', () => {
  const s = [{ de: 'a', ate: 'b', global: { pico: 1, ativos: 30, membros: 20 }, organizacoes: { X: org(5, 25, 23, 1) } }];
  const r = relatorioSemana(s, [], 'a');
  assert.equal(r.organizacoes[0].taxaAtividade, 1);
  assert.equal(r.global.taxaAtividade, 1);
});

test('segmentos somam presença e mostram a melhor organização', () => {
  const r = relatorioSemana(SEMANAS, [], '2026-11-23', (o) => o.replace(/\d+$/, ''));
  const s = porSegmento(r.organizacoes);
  assert.equal(s[0].segmento, 'Lavagem');
  assert.deepEqual(s.find((x) => x.segmento === 'Armas').melhor, { org: 'Armas05', pico: 20 });
});

test('acompanhamento coloca as semanas em ordem e uma linha por organização', () => {
  const a = acompanhamento(SEMANAS);
  assert.deepEqual(a.semanas.map((s) => s.de), ['2026-11-16', '2026-11-23']);
  assert.deepEqual(a.linhas.find((l) => l.org === 'Armas05').valores.map((v) => v.pico), [27, 20]);
});

test('CSV abre no Excel em português', () => {
  const csv = csvSemana(relatorioSemana(SEMANAS, DIAS, '2026-11-23'), (o) => (o === 'Lavagem01' ? 'Os "Lava"' : ''));
  const [cab, l1] = csv.split('\r\n');
  assert.ok(cab.startsWith('"Posição";"Group"'));
  assert.ok(l1.includes('"Os ""Lava"""'));
  assert.ok(l1.includes('"9,1"'));
});

test('semanas vão de segunda a domingo em Brasília', () => {
  const s = semanasDesde(Date.parse('2026-11-14T14:58:55Z'), Date.parse('2026-11-26T12:00:00Z'));
  assert.deepEqual(s, [
    { de: '2026-11-09', ate: '2026-11-15', parcial: false },
    { de: '2026-11-16', ate: '2026-11-22', parcial: false },
    { de: '2026-11-23', ate: '2026-11-29', parcial: true },
  ]);
  // domingo 23:30 em Brasília ainda é a mesma semana
  assert.equal(semanasDesde(Date.parse('2026-11-23T02:30:00Z'), Date.parse('2026-11-23T02:30:00Z'))[0].de, '2026-11-16');
});

test('ficha semanal calcula média simultânea e dia do pico', () => {
  const ini = Date.parse('2026-11-16T03:00:00Z'), fim = ini + 7 * 86400000 - 1;
  const ov = { trackingSince: ini - 1, period: { startAt: ini, endAt: fim },
    totals: { peakOnline: 191, activeMembers: 497, members: 551, onlineMs: 7 * 86400000 * 45 },
    daily: [{ key: '2026-11-18', peakOnline: 148 }, { key: '2026-11-19', peakOnline: 191 }],
    byOrganization: [{ organization: 'Lavagem01', peakOnline: 29, activeMembers: 80, members: 94, onlineMs: 7 * 86400000 * 6.5 }] };
  const s = montarSemana(ov, { de: '2026-11-16', ate: '2026-11-22', parcial: false }, fim + 1e9);
  assert.equal(s.global.mediaOnline, 45);
  assert.equal(s.global.diaDoPico, '2026-11-19');
  assert.equal(s.inicioAcompanhamento, false);
  assert.equal(s.organizacoes.Lavagem01.mediaOnline, 6.5);
  assert.equal(montarSemana({ ...ov, trackingSince: ini + 5 }, { de: 'a', ate: 'b' }, fim).inicioAcompanhamento, true);
});
