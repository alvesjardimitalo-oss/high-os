// HIGH OS — base de dados das facções (Firebase) — funções puras.
// O Firebase guarda as abas da planilha de facções linha a linha:
//   hos/planilha                 → { cabecalhos: { cadastro: [...], ... }, importadoEm, exportadoEm }
//   hos/planilha/{aba}/{linha}   → { ordem, valores: { 'NOME DA FACÇÃO': '...', ... } }
// O sistema é a fonte dos dados; a planilha só recebe uma cópia quando o ADMIN manda.
// Nada aqui depende do navegador nem do Firebase: dá para testar no Node.

/** Abas da planilha de facções: nome na planilha e coluna que identifica a linha. */
export const ABAS = {
  cadastro: { titulo: 'Cadastro de Facções', rotulo: 'Cadastro', chave: 'GROUP' },
  conferencia: { titulo: 'Conferencia Basica', rotulo: 'Conferência', chave: 'GROUP' },
  groups: { titulo: 'Base de Groups', rotulo: 'Base de Groups', chave: 'GROUP' },
  vips: { titulo: 'Catálogo de VIPs', rotulo: 'Catálogo de VIPs', chave: 'PRODUTO' },
  historico: { titulo: 'Histórico de aquisições', rotulo: 'Histórico', chave: null },
};
export const CHAVES_ABAS = Object.keys(ABAS);

/** Colunas que na planilha são fórmula: o sistema calcula, ninguém digita. */
export const DERIVADAS = {
  cadastro: ['SEGMENTO', 'QG / LOCALIZAÇÃO', 'STATUS'],
  conferencia: ['SEGMENTO', 'QG / LOCALIZAÇÃO', 'NOME DO VIP', 'FORMA DE AQUISIÇÃO'],
};

/** Colunas da ORG no cadastro (o resto da linha é do Group). */
export const COLUNAS_ORG = ['ASSUMIDO', 'NOME DA FACÇÃO', 'ID DO LÍDER', 'TELEFONE DO LÍDER', 'ID DO SUBLÍDER', 'TELEFONE DO SUBLÍDER'];

const limpa = (v) => String(v ?? '').replace(/\s+/g, ' ').trim();
export const normCol = (v) => limpa(v).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const igual = (a, b) => normCol(a) === normCol(b);

/** Valor de uma coluna na linha, achando a coluna pelo nome (sem ligar para acento/maiúscula). */
export function valor(linha, coluna) {
  const v = linha?.valores || {};
  if (coluna in v) return v[coluna] ?? '';
  const k = Object.keys(v).find((c) => igual(c, coluna));
  return k ? v[k] ?? '' : '';
}
/** Nome exato da coluna no cabeçalho (ou o próprio nome, se não existir). */
export const colunaReal = (cabecalho, coluna) => (cabecalho || []).find((c) => igual(c, coluna)) || coluna;

/** id de documento a partir do valor da chave ("ARMAS01", "ORG ULTRA"). */
export function idDe(texto) {
  const s = normCol(texto).replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
  return s || '';
}
export const idNovo = () => 'n-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/* ---------------- Planilha ⇄ Firebase ---------------- */

/** Matriz da planilha (1ª linha = cabeçalho) → aba do Firebase. Linhas vazias saem. */
export function daMatriz(matriz = [], aba) {
  const [cab = [], ...resto] = matriz;
  const cabecalho = cab.map(limpa);
  while (cabecalho.length && !cabecalho[cabecalho.length - 1]) cabecalho.pop();
  const chave = ABAS[aba]?.chave;
  const iChave = chave ? cabecalho.findIndex((c) => igual(c, chave)) : -1;
  const usados = new Set();
  const linhas = [];
  resto.forEach((l, i) => {
    if (!l || !l.some((c) => limpa(c))) return;
    const valores = Object.fromEntries(cabecalho.map((c, k) => [c, String(l[k] ?? '').trim()]).filter(([c]) => c));
    let id = iChave >= 0 ? idDe(l[iChave]) : '';
    if (!id || usados.has(id)) id = 'L' + String(i + 2).padStart(4, '0');
    usados.add(id);
    linhas.push({ id, ordem: i + 2, valores });
  });
  return { cabecalho, linhas };
}

/** Aba do Firebase → matriz no formato da planilha (para as telas e para exportar). */
export function paraMatriz(aba) {
  if (!aba) return [];
  const cab = aba.cabecalho || [];
  return [cab, ...[...(aba.linhas || [])].sort((a, b) => a.ordem - b.ordem).map((l) => cab.map((c) => String(valor(l, c) ?? '')))];
}

/* ---------------- Campos calculados (as fórmulas da planilha) ---------------- */

/** Recalcula as colunas que são fórmula na planilha. Não altera o original. */
export function derivar(abas) {
  const out = Object.fromEntries(Object.entries(abas || {}).map(([k, a]) => [k, { ...a, linhas: (a.linhas || []).map((l) => ({ ...l, valores: { ...l.valores } })) }]));
  const baseGroups = new Map((out.groups?.linhas || []).map((l) => [normCol(valor(l, 'GROUP')), l]));
  const poeDoGroup = (aba) => {
    const cab = aba.cabecalho || [];
    for (const l of aba.linhas) {
      const g = baseGroups.get(normCol(valor(l, 'GROUP')));
      if (!g) continue;
      l.valores[colunaReal(cab, 'SEGMENTO')] = valor(g, 'SEGMENTO');
      l.valores[colunaReal(cab, 'QG / LOCALIZAÇÃO')] = valor(g, 'QG / LOCALIZAÇÃO');
    }
  };
  if (out.cadastro) {
    poeDoGroup(out.cadastro);
    const cab = out.cadastro.cabecalho || [];
    for (const l of out.cadastro.linhas) {
      const cheios = COLUNAS_ORG.slice(1).filter((c) => limpa(valor(l, c))).length;
      l.valores[colunaReal(cab, 'STATUS')] = igual(valor(l, 'ASSUMIDO'), 'SIM') ? (cheios === 5 ? 'COMPLETO' : 'PENDENTE') : 'DISPONÍVEL';
    }
  }
  if (out.conferencia) {
    poeDoGroup(out.conferencia);
    const cab = out.conferencia.cabecalho || [];
    const cad = new Map((out.cadastro?.linhas || []).map((l) => [normCol(valor(l, 'GROUP')), l]));
    for (const l of out.conferencia.linhas) {
      const c = cad.get(normCol(valor(l, 'GROUP')));
      const vips = [1, 2, 3, 4].map((n) => ({ nome: limpa(c ? valor(c, 'VIP ' + n) : ''), aq: limpa(c ? valor(c, 'AQUISIÇÃO ' + n) : '') }));
      l.valores[colunaReal(cab, 'NOME DO VIP')] = vips.filter((v) => v.nome).map((v) => v.nome).join('\n');
      l.valores[colunaReal(cab, 'FORMA DE AQUISIÇÃO')] = vips.filter((v) => v.nome && !igual(v.nome, 'SEM VIP')).map((v) => v.aq || 'A DEFINIR').join('\n');
    }
  }
  return out;
}

/** Abas (já derivadas) no formato que o montarBase de dados.js recebe. */
export const brutoDasAbas = (abas) => Object.fromEntries(CHAVES_ABAS.map((k) => [k, paraMatriz(abas?.[k])]));

/* ---------------- Entrega e recolhimento ---------------- */

const linhaDoGroup = (abas, group) => (abas?.cadastro?.linhas || []).find((l) => igual(valor(l, 'GROUP'), group));
const assumida = (l) => igual(valor(l, 'ASSUMIDO'), 'SIM') && !!limpa(valor(l, 'NOME DA FACÇÃO'));

/** Recolhimento: limpa só as colunas da org. Group, QG, VIPs e benefícios ficam. */
export function planoRecolhimento(abas, group) {
  const l = linhaDoGroup(abas, group);
  if (!l) return null;
  const cab = abas.cadastro.cabecalho || [];
  const valores = Object.fromEntries(COLUNAS_ORG.map((c) => [colunaReal(cab, c), c === 'ASSUMIDO' ? 'NÃO' : '']));
  return {
    id: l.id, group: valor(l, 'GROUP'), faccao: valor(l, 'NOME DA FACÇÃO'), jaLivre: !assumida(l),
    antes: Object.fromEntries(Object.keys(valores).map((c) => [c, valor(l, c)])), valores,
  };
}

/**
 * Entrega: o Group passa para a facção. Bloqueia facção que já ocupa outro Group
 * (regra: uma facção, um Group). Group ocupado por outra facção = troca de ocupante.
 */
export function planoEntrega(abas, { group, faccao, lider = '' }) {
  const l = linhaDoGroup(abas, group);
  if (!l) return { erro: `O ${group} não existe no cadastro.` };
  if (!limpa(faccao)) return { erro: 'Informe o nome da facção.' };
  const outro = (abas.cadastro.linhas || []).find((x) => x !== l && assumida(x) && igual(valor(x, 'NOME DA FACÇÃO'), faccao));
  if (outro) return { erro: `A facção ${limpa(faccao)} já ocupa o ${valor(outro, 'GROUP')}. Recolha de lá antes de entregar este.` };
  const cab = abas.cadastro.cabecalho || [];
  const mesma = assumida(l) && igual(valor(l, 'NOME DA FACÇÃO'), faccao);
  const troca = assumida(l) && !mesma ? valor(l, 'NOME DA FACÇÃO') : '';
  const valores = { [colunaReal(cab, 'ASSUMIDO')]: 'SIM', [colunaReal(cab, 'NOME DA FACÇÃO')]: limpa(faccao) };
  if (limpa(lider) || !mesma) valores[colunaReal(cab, 'ID DO LÍDER')] = limpa(lider);
  if (!mesma) for (const c of ['TELEFONE DO LÍDER', 'ID DO SUBLÍDER', 'TELEFONE DO SUBLÍDER']) valores[colunaReal(cab, c)] = '';
  return {
    id: l.id, group: valor(l, 'GROUP'), troca, mesma,
    antes: Object.fromEntries(Object.keys(valores).map((c) => [c, valor(l, c)])), valores,
  };
}

/* ---------------- Exportar para a planilha ---------------- */

/** Número da coluna (0 = A) → letra(s) da planilha. */
export function letraColuna(i) {
  let s = '';
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

/** Copia a fórmula de uma linha para outra, mexendo só nas referências relativas daquela linha (B2 → B7; $A$2 fica). */
export function moverFormula(formula, deLinha, paraLinha) {
  return String(formula).replace(/(?<![A-Za-z0-9_$])(\$?[A-Z]{1,3})(\d+)(?![\d(!])/g, (m, col, lin) => (Number(lin) === deLinha ? col + paraLinha : m));
}

/**
 * O que escrever na planilha para uma aba.
 * grade: o que a planilha tem hoje — { cabecalho: [...], linhas: [[{ formula, cheio }...], ...] } (a partir da linha 2).
 * Colunas que são fórmula na planilha recebem a fórmula de volta (refeita nas linhas que perderam);
 * as outras recebem os valores do sistema. Colunas são casadas pelo nome do cabeçalho.
 */
export function planoExportacao(chaveAba, aba, grade) {
  const titulo = ABAS[chaveAba].titulo;
  const ref = `'${titulo.replace(/'/g, "''")}'`;
  const linhas = [...(aba?.linhas || [])].sort((a, b) => a.ordem - b.ordem);
  const n = linhas.length;
  const ocupadas = (grade.linhas || []).reduce((u, l, i) => (l.some((c) => c?.cheio) ? i + 1 : u), 0);
  const ate = Math.max(n, ocupadas);
  const dados = [], semPlanilha = [], formulas = [];
  for (const col of aba?.cabecalho || []) {
    const k = (grade.cabecalho || []).findIndex((c) => igual(c, col));
    if (k < 0) { semPlanilha.push(col); continue; }
    const L = letraColuna(k);
    const celulas = (grade.linhas || []).map((l) => l[k]).filter(Boolean);
    const comFormula = celulas.map((c, i) => ({ c, i })).filter((x) => x.c.formula);
    const ehFormula = comFormula.length > 0 && comFormula.length >= celulas.filter((c) => c.cheio && !c.formula).length;
    const vals = [];
    for (let i = 0; i < ate; i++) {
      if (i >= n) { vals.push(['']); continue; }
      if (ehFormula) { const t = (grade.linhas.findIndex((l) => l[k]?.formula)); vals.push([moverFormula(grade.linhas[t][k].formula, t + 2, i + 2)]); continue; }
      const v = String(valor(linhas[i], col) ?? '');
      vals.push([/^TRUE$/i.test(v) ? true : /^FALSE$/i.test(v) ? false : v]);
    }
    if (ehFormula) formulas.push(col);
    if (vals.length) dados.push({ range: `${ref}!${L}2:${L}${ate + 1}`, values: vals });
  }
  return { dados, linhas: n, limpas: Math.max(0, ocupadas - n), semPlanilha, formulas };
}
