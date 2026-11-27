// HIGH OS — leitura das planilhas.
// Funções puras: recebem as linhas que a API do Google Sheets devolve
// (matriz de strings) e montam os objetos que as telas usam. Nada aqui
// depende do navegador: dá para testar no Node. A única escrita do sistema
// (limpar a org no recolhimento) só é PLANEJADA aqui — quem grava é o nuvem.js.

/** Planilhas oficiais. O High OS lê tudo e só escreve uma coisa: no recolhimento,
 *  limpa as colunas da org na linha do Group (ver planoRecolhimento). */
export const PLANILHAS = {
  faccoes: { id: '1MBVzWMFrAzIhYlT7-ZgWZEAoJLjPn3JeZdmHyRcZf2A', nome: 'HIGH · Documento das facções do Ilegal' },
};

/** Faixas lidas de cada planilha (uma chamada batchGet por planilha). */
export const FAIXAS = {
  faccoes: {
    cadastro: "'Cadastro de Facções'!A1:Z200",
    conferencia: "'Conferencia Basica'!A1:Z200",
    groups: "'Base de Groups'!A1:E200",
    vips: "'Catálogo de VIPs'!A1:E100",
    historico: "'Histórico de aquisições'!A1:K1000",
  },
};

export const SEGMENTOS = ['ARMAS', 'MUNIÇÃO', 'LAVAGEM', 'DESMANCHE', 'DROGAS', 'MECÂNICA ILEGAL', 'HOSPITAL ILEGAL'];

const limpa = (v) => String(v ?? '').replace(/\s+/g, ' ').trim();
const norm = (v) => limpa(v).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const vazioOuPendente = (v) => !limpa(v) || /^A CADASTRAR$/i.test(limpa(v));

/** Transforma a matriz em objetos usando a primeira linha como cabeçalho. */
export function tabela(linhas = []) {
  const [cab = [], ...resto] = linhas;
  const chaves = cab.map((c) => norm(c));
  return resto
    .filter((l) => l.some((c) => limpa(c)))
    .map((l) => Object.fromEntries(chaves.map((k, i) => [k, limpa(l[i])])));
}

/** "R$ 1.234,50" → 1234.5 ; vazio ou texto → null */
export function valorBR(v) {
  const s = limpa(v).replace(/R\$\s*/i, '');
  if (!/\d/.test(s) || /[a-z]/i.test(s.replace(/kg$/i, ''))) return null;
  const n = Number(s.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

/* ---------------- Facções (Cadastro + Base de Groups) ---------------- */

/** Uma facção por Group, com VIPs, benefícios e situação. */
export function faccoesDoCadastro(linhas) {
  return tabela(linhas).filter((r) => r.GROUP).map((r) => {
    const assumido = norm(r.ASSUMIDO) === 'SIM' && !!r['NOME DA FACCAO'];
    const vips = [1, 2, 3, 4]
      .map((n) => ({ nome: r['VIP ' + n], aquisicao: r['AQUISICAO ' + n] }))
      .filter((v) => v.nome && norm(v.nome) !== 'SEM VIP');
    return {
      group: r.GROUP,
      segmento: r.SEGMENTO,
      qg: r['QG / LOCALIZACAO'],
      assumido,
      faccao: assumido ? r['NOME DA FACCAO'] : '',
      lider: vazioOuPendente(r['ID DO LIDER']) ? '' : r['ID DO LIDER'],
      telLider: vazioOuPendente(r['TELEFONE DO LIDER']) ? '' : r['TELEFONE DO LIDER'],
      sublider: vazioOuPendente(r['ID DO SUBLIDER']) ? '' : r['ID DO SUBLIDER'],
      telSublider: vazioOuPendente(r['TELEFONE DO SUBLIDER']) ? '' : r['TELEFONE DO SUBLIDER'],
      status: r.STATUS || (assumido ? '' : 'DISPONÍVEL'),
      completo: norm(r.STATUS) === 'COMPLETO',
      garagemVip: r['GARAGEM VIP'],
      vips,
      porMeta: vips.some((v) => norm(v.aquisicao) === 'POR META'),
      condicaoVip: r['CONDICAO DO VIP'],
      beneficios: {
        radio: r['RADIO EXCLUSIVA'], chat: r['CHAT DE FACCAO'], uniforme: r.UNIFORME,
        rota: r['ROTA EXCLUSIVA'], salario: r['SALARIO / 40 MIN'], bau: r['BAU (KG)'],
      },
    };
  });
}

/** Resumo de ocupação geral e por segmento (o "Painel Geral" da planilha, recalculado). */
export function ocupacao(faccoes) {
  const porSeg = new Map(SEGMENTOS.map((s) => [s, { segmento: s, groups: 0, assumidos: 0, completos: 0 }]));
  for (const f of faccoes) {
    const k = SEGMENTOS.find((s) => norm(s) === norm(f.segmento)) || f.segmento || 'OUTROS';
    if (!porSeg.has(k)) porSeg.set(k, { segmento: k, groups: 0, assumidos: 0, completos: 0 });
    const s = porSeg.get(k);
    s.groups++; if (f.assumido) s.assumidos++; if (f.assumido && f.completo) s.completos++;
  }
  const segmentos = [...porSeg.values()].filter((s) => s.groups).map((s) => ({
    ...s, disponiveis: s.groups - s.assumidos, ocupacao: s.groups ? s.assumidos / s.groups : 0,
  }));
  const total = faccoes.length, assumidos = faccoes.filter((f) => f.assumido).length;
  return {
    total, assumidos, disponiveis: total - assumidos,
    pendentes: faccoes.filter((f) => f.assumido && !f.completo).length,
    porMeta: faccoes.filter((f) => f.assumido && f.porMeta).length,
    ocupacao: total ? assumidos / total : 0,
    segmentos,
  };
}

/* ---------------- Recolhimento: limpar a org na planilha ----------------
   Só as colunas da ORG. As do Group (segmento, group, QG) e os VIPs/benefícios
   ficam como estão — mesmo padrão das linhas já recolhidas (ex.: MUNICAO06). */
export const COLUNAS_ORG = [
  ['ASSUMIDO', 'NÃO'],
  ['NOME DA FACÇÃO', ''],
  ['ID DO LÍDER', ''],
  ['TELEFONE DO LÍDER', ''],
  ['ID DO SUBLÍDER', ''],
  ['TELEFONE DO SUBLÍDER', ''],
  ['STATUS', 'DISPONÍVEL'],
];

/** Número da coluna (0 = A) → letra(s) da planilha. */
export function letraColuna(i) {
  let s = '';
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

/**
 * Acha a linha do Group no Cadastro e diz quais células limpar.
 * Colunas achadas pelo nome do cabeçalho (não pela posição), então mover coluna não quebra.
 * Devolve null se o Group não existir; lança erro se faltar coluna da org.
 */
export function planoRecolhimento(linhas = [], group) {
  const [cab = []] = linhas;
  const idx = (nome) => cab.findIndex((c) => norm(c) === norm(nome));
  const iGroup = idx('GROUP');
  if (iGroup < 0) throw new Error('A aba Cadastro de Facções está sem a coluna GROUP.');
  const faltam = COLUNAS_ORG.filter(([nome]) => idx(nome) < 0).map(([nome]) => nome);
  if (faltam.length) throw new Error('A aba Cadastro de Facções está sem a(s) coluna(s): ' + faltam.join(', ') + '.');
  const r = linhas.findIndex((l, i) => i > 0 && norm(l?.[iGroup]) === norm(group));
  if (r < 0) return null;
  const linha = linhas[r];
  const iNome = idx('NOME DA FACÇÃO');
  return {
    linha: r + 1, // linha real da planilha (o cabeçalho é a linha 1)
    group: limpa(linha[iGroup]),
    faccaoNaPlanilha: limpa(linha[iNome]),
    jaLivre: norm(linha[idx('ASSUMIDO')]) !== 'SIM' && !limpa(linha[iNome]),
    celulas: COLUNAS_ORG.map(([nome, valor]) => ({ coluna: nome, a1: letraColuna(idx(nome)) + (r + 1), antes: limpa(linha[idx(nome)]), valor })),
  };
}

/* ---------------- Conferência básica ---------------- */

const CONFERE = ['Conferido', 'Craft', 'Farm', 'Baú', 'Garagem pública', 'Garagem VIP', 'Rota exclusiva', 'Rádio', 'Chat', 'Uniforme', 'Salário', 'Upgrade do baú'];

/** Por Group: cada item verificado (true/false/null) e as CDS anotadas. */
export function conferencias(linhas) {
  const [cab = []] = linhas;
  const idx = (nome) => cab.findIndex((c) => norm(c) === norm(nome));
  const iGroup = idx('GROUP');
  const mapa = new Map();
  for (const l of linhas.slice(1)) {
    const group = limpa(l[iGroup]);
    if (!group) continue;
    const itens = CONFERE.map((nome) => {
      const i = idx(nome);
      const v = norm(l[i]);
      return { nome, ok: v === 'TRUE' ? true : v === 'FALSE' ? false : null };
    }).filter((x) => idx(x.nome) >= 0);
    const cds = cab.map((c, i) => [limpa(c), limpa(l[i])]).filter(([c, v]) => /^CDS/i.test(c) && v)
      .map(([c, v]) => ({ campo: c.replace(/^CDS\s*·\s*/i, ''), valor: v }));
    const pend = limpa(l[idx('Pendência')]);
    mapa.set(group, { group, itens, cds, pendencia: pend });
  }
  return mapa;
}

/* ---------------- VIPs e histórico ---------------- */

export function catalogoVips(linhas) {
  return tabela(linhas).filter((r) => r.PRODUTO && norm(r.PRODUTO) !== 'SEM VIP').map((r) => ({
    produto: r.PRODUTO, idLoja: r['ID NA LOJA'], preco: r['PRECO NA LOJA'], valor: valorBR(r['PRECO NA LOJA']),
    beneficios: r.BENEFICIOS, prazo: r['PRAZO OU ATIVACAO'],
  }));
}

export function historicoAquisicoes(linhas) {
  return tabela(linhas).filter((r) => r.GROUP).map((r) => ({
    group: r.GROUP, faccao: r['FACCAO NA AQUISICAO'], data: r['DATA DA AQUISICAO'], item: r['VIP OU ITEM'],
    aquisicao: r.AQUISICAO, evento: r.EVENTO, obs: r['CONDICAO / OBSERVACAO'], valor: r['VALOR PAGO (R$)'],
    validade: r['VALIDADE ATE'], ticket: r['TICKET / COMPROVANTE'], responsavel: r.RESPONSAVEL,
  }));
}

/* ---------------- Mercado Negro (economia) ----------------
   Fonte: data/catalogo.json do site do Mercado Negro (mesmo domínio do High OS),
   publicado a partir da planilha "Tabela Mercado Negro". */
export const CATALOGO_MN = 'https://alvesjardimitalo-oss.github.io/high-mercado-negro/data/catalogo.json';
export const IMAGENS_MN = 'https://alvesjardimitalo-oss.github.io/high-mercado-negro/assets/itens/';

export function mercadoNegro(json) {
  const itens = Array.isArray(json?.itens) ? json.itens : [];
  const porCat = new Map();
  for (const i of itens) {
    const cat = limpa(i.categoria) || 'OUTROS';
    if (!porCat.has(cat)) porCat.set(cat, []);
    porCat.get(cat).push({
      nome: limpa(i.item), parceria: Number.isFinite(+i.parceria) && i.parceria !== '' && i.parceria != null ? +i.parceria : null,
      pista: Number.isFinite(+i.pista) && i.pista !== '' && i.pista != null ? +i.pista : null,
      status: norm(i.status || 'ativo').toLowerCase(), destaque: !!i.destaque, obs: limpa(i.observacao || i.obs),
      imagem: limpa(i.imagem), ordem: Number(i.ordem) || 0,
    });
  }
  const regras = (json?.regras?.lavagem || []).filter((r) => r.ativo !== false).map((r) => limpa(r.texto ? `${r.titulo}: ${r.texto}` : r.titulo));
  const blocos = [...porCat.entries()].map(([categoria, l]) => ({
    categoria, itens: l.sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome)),
    regras: norm(categoria) === 'LAVAGEM' ? regras : [],
  }));
  return { blocos, atualizadoEm: json?.meta?.atualizado_em || '', publicadoPor: json?.meta?.publicado_por || '', aviso: json?.meta?.aviso || '' };
}

/** Junta tudo numa base só, pronta para as telas. */
export function montarBase({ faccoes: f = {}, mercado = null }) {
  const lista = faccoesDoCadastro(f.cadastro || []);
  const conf = conferencias(f.conferencia || []);
  const hist = historicoAquisicoes(f.historico || []);
  for (const x of lista) {
    x.conferencia = conf.get(x.group) || null;
    x.historico = hist.filter((h) => h.group === x.group);
  }
  return {
    faccoes: lista,
    ocupacao: ocupacao(lista),
    vips: catalogoVips(f.vips || []),
    historico: hist,
    mercado: mercadoNegro(mercado),
  };
}
