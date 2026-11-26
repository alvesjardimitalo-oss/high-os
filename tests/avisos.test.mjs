import test from 'node:test';
import assert from 'node:assert/strict';
import { avisoEntrega, avisoRecolhimento, corpoWebhook, webhookValida, beneficiosDaFaccao } from '../assets/js/avisos.js';

test('entrega: campos vazios viram marcadores e benefícios em maiúsculas', () => {
  const a = avisoEntrega({ group: 'ARMAS04', beneficios: ['Garagem VIP', ' '] });
  assert.match(a.embed.description, /Group: ARMAS04/);
  assert.match(a.embed.description, /Facção: \[Nome da facção aqui\]/);
  assert.match(a.embed.description, /GARAGEM VIP/);
  assert.equal(a.embed.color, 0x8d35ff);
});

test('recolhimento: status final padrão e corpo da webhook', () => {
  const a = avisoRecolhimento({ group: 'LAVAGEM01', faccao: 'VIPERS' });
  assert.match(a.embed.description, /Status final: Facção vazia\./);
  const c = corpoWebhook(a);
  assert.equal(c.embeds.length, 1);
  assert.equal(c.username, 'Ilegal High - Bot Central');
});

test('só aceita endereço oficial de webhook', () => {
  assert.ok(webhookValida('https://discord.com/api/webhooks/123/abc-DEF_1'));
  assert.ok(!webhookValida('https://evil.example/api/webhooks/123/abc'));
  assert.ok(!webhookValida(''));
});

test('benefícios do cadastro ignoram "NÃO POSSUI"', () => {
  const f = { vips: [{ nome: 'ORG HIGH' }], garagemVip: 'ATIVA', beneficios: { radio: 'NÃO POSSUI', salario: 'R$ 1.200', bau: '2.000 kg' } };
  assert.deepEqual(beneficiosDaFaccao(f), ['ORG HIGH', 'Garagem VIP', 'Salário: R$ 1.200 / 40 min', 'Baú: 2.000 kg']);
});
