// node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import { daMatriz, paraMatriz, derivar, brutoDasAbas, planoRecolhimento, planoEntrega, moverFormula, planoExportacao, letraColuna, valor } from '../assets/js/base.js';
import { montarBase } from '../assets/js/dados.js';

const CAB = ['SEGMENTO','GROUP','QG / LOCALIZAÇÃO','ASSUMIDO','NOME DA FACÇÃO','ID DO LÍDER','TELEFONE DO LÍDER','ID DO SUBLÍDER','TELEFONE DO SUBLÍDER','STATUS','GARAGEM VIP','VIP 1','AQUISIÇÃO 1','VIP 2','AQUISIÇÃO 2','VIP 3','AQUISIÇÃO 3','VIP 4','AQUISIÇÃO 4','CONDIÇÃO DO VIP','RÁDIO EXCLUSIVA','CHAT DE FACÇÃO','UNIFORME','ROTA EXCLUSIVA','SALÁRIO / 40 MIN','BAÚ (KG)'];
const abas = () => derivar({
  cadastro: daMatriz([CAB,
    ['ARMAS','ARMAS01','FAVELA A','SIM','EGITO','1165 - WES','914-884','A CADASTRAR','A CADASTRAR','COMPLETO','ATIVA','ORG HIGH','POR META'],
    ['ARMAS','ARMAS02','FAVELA B','SIM','BALLACK','1119 - BOBBY','973','','','DISPONÍVEL','ATIVA','SEM VIP'],
    ['ARMAS','ARMAS03','FAVELA C','NÃO'],
    [],
  ], 'cadastro'),
  conferencia: daMatriz([['SEGMENTO','GROUP','QG / LOCALIZAÇÃO','NOME DO VIP','FORMA DE AQUISIÇÃO','Conferido','Craft'],
    ['', 'ARMAS01', '', 'velho', 'velho', 'TRUE', 'FALSE']], 'conferencia'),
  groups: daMatriz([['GROUP','SEGMENTO','QG / LOCALIZAÇÃO','GARAGEM VIP'], ['ARMAS01','ARMAS','FAVELA DA BARRAGEM','ATIVA'], ['ARMAS02','ARMAS','FAVELA DO ASILO','ATIVA'], ['ARMAS03','ARMAS','FAVELA DO MINERADOR','ATIVA']], 'groups'),
  vips: daMatriz([['Produto','ID na loja','Preço na loja'], ['SEM VIP'], ['ORG HIGH','1','R$ 10,00']], 'vips'),
  historico: daMatriz([['Group','Facção na aquisição','VIP ou item'], ['ARMAS01','EGITO','ORG HIGH'], ['ARMAS01','EGITO','ORG HIGH']], 'historico'),
});

test('planilha vira linhas com id pela chave e volta igual', () => {
  const a = daMatriz([['GROUP', 'X'], ['ARMAS01', '1'], [], ['ARMAS01', '2'], ['', '3']], 'cadastro');
  assert.deepEqual(a.linhas.map((l) => l.id), ['ARMAS01', 'L0004', 'L0005'], 'chave repetida ou vazia vira id pela linha');
  assert.deepEqual(a.linhas.map((l) => l.ordem), [2, 4, 5]);
  assert.deepEqual(paraMatriz(a), [['GROUP', 'X'], ['ARMAS01', '1'], ['ARMAS01', '2'], ['', '3']]);
  assert.equal(abas().historico.linhas.length, 2);
});

test('campos calculados repetem as fórmulas da planilha', () => {
  const a = abas();
  const l = (g) => a.cadastro.linhas.find((x) => valor(x, 'GROUP') === g);
  assert.equal(valor(l('ARMAS01'), 'QG / LOCALIZAÇÃO'), 'FAVELA DA BARRAGEM', 'QG vem da Base de Groups');
  assert.equal(valor(l('ARMAS01'), 'STATUS'), 'COMPLETO', '"A CADASTRAR" conta como preenchido (COUNTA)');
  assert.equal(valor(l('ARMAS02'), 'STATUS'), 'PENDENTE', 'DISPONÍVEL digitado por cima é corrigido');
  assert.equal(valor(l('ARMAS03'), 'STATUS'), 'DISPONÍVEL');
  const c = a.conferencia.linhas[0];
  assert.equal(valor(c, 'NOME DO VIP'), 'ORG HIGH'); assert.equal(valor(c, 'FORMA DE AQUISIÇÃO'), 'POR META');
  assert.equal(valor(c, 'SEGMENTO'), 'ARMAS');
  const b = montarBase({ faccoes: brutoDasAbas(a) });
  assert.equal(b.faccoes.find((f) => f.group === 'ARMAS02').completo, false);
  assert.equal(b.ocupacao.assumidos, 2);
  assert.equal(b.faccoes[0].conferencia.itens[0].ok, true);
});

test('recolhimento limpa só a org', () => {
  const p = planoRecolhimento(abas(), 'armas02');
  assert.equal(p.id, 'ARMAS02'); assert.equal(p.jaLivre, false); assert.equal(p.faccao, 'BALLACK');
  assert.deepEqual(p.valores, { ASSUMIDO: 'NÃO', 'NOME DA FACÇÃO': '', 'ID DO LÍDER': '', 'TELEFONE DO LÍDER': '', 'ID DO SUBLÍDER': '', 'TELEFONE DO SUBLÍDER': '' });
  assert.equal(p.antes['NOME DA FACÇÃO'], 'BALLACK');
  assert.equal(planoRecolhimento(abas(), 'ARMAS03').jaLivre, true);
  assert.equal(planoRecolhimento(abas(), 'X'), null);
});

test('entrega: uma facção, um group; troca de ocupante avisada', () => {
  assert.match(planoEntrega(abas(), { group: 'ARMAS03', faccao: 'egito' }).erro, /já ocupa o ARMAS01/);
  const livre = planoEntrega(abas(), { group: 'ARMAS03', faccao: 'TALIBÃ', lider: '934 - GRAZI' });
  assert.equal(livre.troca, ''); assert.equal(livre.valores.ASSUMIDO, 'SIM'); assert.equal(livre.valores['ID DO LÍDER'], '934 - GRAZI');
  const troca = planoEntrega(abas(), { group: 'ARMAS02', faccao: 'TALIBÃ' });
  assert.equal(troca.troca, 'BALLACK'); assert.equal(troca.valores['TELEFONE DO LÍDER'], '');
  const mesma = planoEntrega(abas(), { group: 'ARMAS02', faccao: 'Ballack' });
  assert.equal(mesma.mesma, true); assert.equal('TELEFONE DO LÍDER' in mesma.valores, false, 'reenviar aviso não apaga dados');
  assert.match(planoEntrega(abas(), { group: 'ARMAS03', faccao: ' ' }).erro, /nome da facção/);
});

test('fórmula copiada para outra linha mexe só nas referências relativas', () => {
  const f = `=IF(D2="SIM";IF(COUNTA(E2:I2)=5;"COMPLETO";"PENDENTE");"DISPONÍVEL")`;
  assert.equal(moverFormula(f, 2, 7), `=IF(D7="SIM";IF(COUNTA(E7:I7)=5;"COMPLETO";"PENDENTE");"DISPONÍVEL")`);
  assert.equal(moverFormula(`=IFERROR(VLOOKUP(B2;'Base de Groups'!$A$2:$C$35;2;FALSE);"x")`, 2, 9), `=IFERROR(VLOOKUP(B9;'Base de Groups'!$A$2:$C$35;2;FALSE);"x")`);
  assert.equal(moverFormula(`=VLOOKUP($B2;'Cadastro de Facções'!$B$2:$S;11;FALSE)&CHAR(10)`, 2, 3), `=VLOOKUP($B3;'Cadastro de Facções'!$B$2:$S;11;FALSE)&CHAR(10)`);
  assert.equal(letraColuna(25), 'Z'); assert.equal(letraColuna(26), 'AA');
});

test('exportação: fórmulas voltam, valores do sistema, sobras limpas', () => {
  const a = abas();
  const F = (r) => ({ formula: `=IF(D${r}="SIM";"x";"DISPONÍVEL")`, cheio: true });
  const V = { formula: '', cheio: true };
  const grade = {
    cabecalho: ['SEGMENTO', 'GROUP', 'QG / LOCALIZAÇÃO', 'ASSUMIDO', 'NOME DA FACÇÃO', 'STATUS'],
    linhas: [
      [F(2), V, F(2), V, V, F(2)],
      [F(3), V, F(3), V, V, { formula: '', cheio: true }], // STATUS perdeu a fórmula
      [F(4), V, F(4), V, V, F(4)],
      [F(5), V, F(5), V, V, F(5)], // linha que não existe mais no sistema
    ],
  };
  const p = planoExportacao('cadastro', a.cadastro, grade);
  const col = (L) => p.dados.find((d) => d.range.includes(`!${L}2:`));
  assert.equal(col('B').range, "'Cadastro de Facções'!B2:B5");
  assert.deepEqual(col('B').values.map((v) => v[0]), ['ARMAS01', 'ARMAS02', 'ARMAS03', '']);
  assert.deepEqual(col('F').values.map((v) => v[0]).slice(0, 3), ['=IF(D2="SIM";"x";"DISPONÍVEL")', '=IF(D3="SIM";"x";"DISPONÍVEL")', '=IF(D4="SIM";"x";"DISPONÍVEL")'], 'fórmula refeita na linha 3');
  assert.deepEqual(p.formulas, ['SEGMENTO', 'QG / LOCALIZAÇÃO', 'STATUS']);
  assert.equal(p.limpas, 1);
  assert.ok(p.semPlanilha.includes('ID DO LÍDER'), 'coluna que a planilha não tem fica de fora e é avisada');
  const conf = planoExportacao('conferencia', a.conferencia, { cabecalho: ['GROUP', 'Conferido'], linhas: [[V, V]] });
  assert.deepEqual(conf.dados[1].values, [[true]], 'TRUE vira caixa marcada');
});
