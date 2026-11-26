// node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import { faccoesDoCadastro, ocupacao, conferencias, catalogoVips, economia, valorBR, montarBase, logSync } from '../assets/js/dados.js';

const CAB = ['SEGMENTO','GROUP','QG / LOCALIZAÇÃO','ASSUMIDO','NOME DA FACÇÃO','ID DO LÍDER','TELEFONE DO LÍDER','ID DO SUBLÍDER','TELEFONE DO SUBLÍDER','STATUS','GARAGEM VIP','VIP 1','AQUISIÇÃO 1','VIP 2','AQUISIÇÃO 2','VIP 3','AQUISIÇÃO 3','VIP 4','AQUISIÇÃO 4','CONDIÇÃO DO VIP','RÁDIO EXCLUSIVA','CHAT DE FACÇÃO','UNIFORME','ROTA EXCLUSIVA','SALÁRIO / 40 MIN','BAÚ (KG)'];
const CADASTRO = [CAB,
  ['ARMAS','ARMAS01','FAVELA A','SIM','ALFA','10 - LIDER A','111','A CADASTRAR','A CADASTRAR','COMPLETO','ATIVA','ORG HIGH','POR META'],
  ['ARMAS','ARMAS02','FAVELA B','SIM','BETA','11 - LIDER B','222','','','','ATIVA','ORG HIGH','POR LOJA','FARM AFK','POR LOJA'],
  ['MUNIÇÃO','MUNICAO01','FAVELA C','NÃO','','','','','','DISPONÍVEL','ATIVA','VIP ORG ULTRA FULL','POR META'],
  ['HOSPITAL ILEGAL','ILEGALMEDIC01','NECROTÉRIO','NÃO'],
  [],
];

test('cadastro vira facções com VIPs e situação', () => {
  const f = faccoesDoCadastro(CADASTRO);
  assert.equal(f.length, 4);
  assert.equal(f[0].faccao, 'ALFA');
  assert.equal(f[0].sublider, '', '"A CADASTRAR" vira vazio');
  assert.equal(f[0].porMeta, true);
  assert.deepEqual(f[1].vips.map((v) => v.nome), ['ORG HIGH', 'FARM AFK']);
  assert.equal(f[2].assumido, false);
  assert.equal(f[2].faccao, '', 'Group livre não mostra facção');
  assert.equal(f[3].status, 'DISPONÍVEL');
});

test('ocupação geral e por segmento', () => {
  const o = ocupacao(faccoesDoCadastro(CADASTRO));
  assert.equal(o.total, 4); assert.equal(o.assumidos, 2); assert.equal(o.disponiveis, 2);
  assert.equal(o.pendentes, 1, 'assumido sem STATUS completo fica pendente');
  const armas = o.segmentos.find((s) => s.segmento === 'ARMAS');
  assert.equal(armas.ocupacao, 1);
  assert.equal(o.segmentos.find((s) => s.segmento === 'MUNIÇÃO').disponiveis, 1);
});

test('conferência: TRUE/FALSE/vazio e CDS anotadas', () => {
  const m = conferencias([
    ['SEGMENTO','GROUP','QG','NOME DO VIP','FORMA','Conferido','Craft','CDS · craft','Farm','Rota exclusiva','Pendência'],
    ['ARMAS','ARMAS01','X','ORG','META','TRUE','TRUE','1.0, 2.0, 3.0','FALSE','','falta rota'],
  ]);
  const c = m.get('ARMAS01');
  assert.deepEqual(c.itens.map((i) => i.ok), [true, true, false, null]);
  assert.deepEqual(c.cds, [{ campo: 'craft', valor: '1.0, 2.0, 3.0' }]);
  assert.equal(c.pendencia, 'falta rota');
});

test('valores em reais', () => {
  assert.equal(valorBR(' R$  180.000,00 '), 180000);
  assert.equal(valorBR('R$ 150,00'), 150);
  assert.equal(valorBR(''), null);
  assert.equal(valorBR('NÃO POSSUI'), null);
});

test('catálogo de VIPs ignora "SEM VIP"', () => {
  const v = catalogoVips([['Produto','ID na loja','Preço na loja','Benefícios','Prazo ou ativação'], ['SEM VIP'], ['ORG PLUS','1','R$ 299,00','chat','24 h']]);
  assert.equal(v.length, 1); assert.equal(v[0].valor, 299);
});

test('economia: blocos lado a lado e regras de porcentagem', () => {
  const e = economia([
    ['ARMAS','','','','MUNIÇÃO'],
    ['ARMAMENTO (VALORES)','','','','MUNIÇÃO (VALORES)'],
    ['ARMAS','VALOR PARCERIA','VALOR PISTA ','','MUNIÇÃO','VALOR PARCERIA','VALOR PISTA'],
    ['AK-102',' R$  180.000,00 ',' R$  189.000,00 ','','PISTOLA 100X','R$ 5.000,00','R$ 5.450,00'],
    ['UZI','','','','50% DO CLIENTE E 50% DO DESMANCHE.'],
  ]);
  assert.deepEqual(e.map((b) => b.categoria), ['ARMAMENTO', 'MUNIÇÃO']);
  assert.deepEqual(e[0].itens[0], { nome: 'AK-102', parceria: 180000, pista: 189000 });
  assert.equal(e[0].itens[1].parceria, null, 'item sem valor continua listado');
  assert.equal(e[1].regras[0], '50% DO CLIENTE E 50% DO DESMANCHE.');
});

test('log de sincronização', () => {
  assert.equal(logSync([['INÍCIO','26/11/2026 07:58'],['INATIVOS','49']]).inativos, '49');
});

test('montarBase liga conferência e histórico ao Group', () => {
  const b = montarBase({ faccoes: { cadastro: CADASTRO, historico: [['Group','VIP ou item'],['ARMAS01','ORG HIGH']] } });
  assert.equal(b.faccoes[0].historico.length, 1);
  assert.equal(b.faccoes[1].historico.length, 0);
});
