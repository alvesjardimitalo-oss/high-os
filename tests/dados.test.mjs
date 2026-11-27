// node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import { faccoesDoCadastro, ocupacao, conferencias, catalogoVips, mercadoNegro, valorBR, montarBase } from '../assets/js/dados.js';

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

test('mercado negro: agrupa por categoria, ordena e traz regras da lavagem', () => {
  const m = mercadoNegro({
    meta: { atualizado_em: '2026-11-18T21:19:03-03:00' },
    itens: [
      { categoria: 'ARMAS', item: 'AK-102', parceria: 180000, pista: 189000, status: 'ativo', ordem: 2, imagem: 'ak102.png' },
      { categoria: 'ARMAS', item: 'UZI', parceria: '', pista: null, status: 'inativo', ordem: 1 },
      { categoria: 'LAVAGEM', item: 'PENDRIVE 1', parceria: 9000, pista: 9810, status: 'ativo' },
    ],
    regras: { lavagem: [{ titulo: 'Lavagem de dinheiro sujo', texto: '10% da máquina | 15% da lavagem | 75% do cliente', ativo: true }, { titulo: 'Secagem', ativo: false }] },
  });
  assert.deepEqual(m.blocos.map((b) => b.categoria), ['ARMAS', 'LAVAGEM']);
  assert.deepEqual(m.blocos[0].itens.map((i) => i.nome), ['UZI', 'AK-102']);
  assert.equal(m.blocos[0].itens[0].parceria, null, 'valor vazio vira "a definir"');
  assert.equal(m.blocos[0].itens[0].status, 'inativo');
  assert.equal(m.blocos[1].regras.length, 1, 'só regras ativas');
  assert.equal(m.atualizadoEm, '2026-11-18T21:19:03-03:00');
  assert.deepEqual(mercadoNegro(null).blocos, [], 'sem catálogo não quebra');
});

test('montarBase liga conferência e histórico ao Group', () => {
  const b = montarBase({ faccoes: { cadastro: CADASTRO, historico: [['Group','VIP ou item'],['ARMAS01','ORG HIGH']] } });
  assert.equal(b.faccoes[0].historico.length, 1);
  assert.equal(b.faccoes[1].historico.length, 0);
});

test('recolhimento: limpa só as colunas da org na linha do Group', async () => {
  const { planoRecolhimento, letraColuna } = await import('../assets/js/dados.js');
  assert.equal(letraColuna(0), 'A'); assert.equal(letraColuna(9), 'J'); assert.equal(letraColuna(26), 'AA');
  const p = planoRecolhimento(CADASTRO, 'armas02');
  assert.equal(p.linha, 3, 'cabeçalho é a linha 1');
  assert.equal(p.faccaoNaPlanilha, 'BETA');
  assert.equal(p.jaLivre, false);
  assert.deepEqual(p.celulas.map((c) => c.a1), ['D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3']);
  assert.deepEqual(p.celulas.map((c) => c.valor), ['NÃO', '', '', '', '', '', 'DISPONÍVEL']);
  assert.ok(!p.celulas.some((c) => /GROUP|SEGMENTO|QG|VIP|ROTA/.test(c.coluna)), 'não mexe no Group, QG, VIPs nem benefícios');
  assert.equal(planoRecolhimento(CADASTRO, 'MUNICAO01').jaLivre, true);
  assert.equal(planoRecolhimento(CADASTRO, 'NAOEXISTE'), null);
  assert.throws(() => planoRecolhimento([['GROUP', 'ASSUMIDO'], ['X', 'SIM']], 'X'), /sem a\(s\) coluna/);
});
