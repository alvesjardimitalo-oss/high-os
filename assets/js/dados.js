// HIGH OS — leitura das planilhas (SOMENTE LEITURA).
// Funções puras: recebem as linhas que a API do Google Sheets devolve
// (matriz de strings) e montam os objetos que as telas usam. Nada aqui
// grava em planilha, e nada depende do navegador: dá para testar no Node.

/** As duas planilhas oficiais. O High OS só lê; quem edita é a staff, direto nelas. */
export const PLANILHAS = {
  faccoes: { id: '1MBVzWMFrAzIhYlT7-ZgWZEAoJLjPn3JeZdmHyRcZf2A', nome: 'HIGH · Documento das facções do Ilegal' },
  ilegal: { id: '1zs-LNN1XS8t9cYwHe4_6TMxRDIy6yS-cLv66Rx_K9C4', nome: 'Ilegal · High Season 3' },
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
  ilegal: {
    economia: "'ECONOMIA ILEGAL'!S13:BB120",
    sync: "'LOG SYNC ILEGAL'!A1:H12",
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

/* ---------------- Economia ilegal (tabela de valores) ----------------
   Na planilha os valores ficam em blocos lado a lado, de 4 colunas
   (item · parceria · pista · espaço), a partir da coluna S. Linha 2 do
   recorte = título do bloco; linha 3 = cabeçalho; daí para baixo, itens.
   Linhas de regra ("50% do cliente…") viram observação do bloco. */
export function economia(linhas) {
  const titulos = linhas[1] || [], cab = linhas[2] || [];
  const largura = Math.max(...linhas.map((l) => l.length), 0);
  const blocos = [];
  for (let c = 0; c < largura; c += 4) {
    const titulo = limpa(titulos[c]).replace(/\s*\(VALORES\)\s*/i, '').trim() || limpa(cab[c]) || limpa((linhas[0] || [])[c + 1]) || limpa((linhas[0] || [])[c]);
    if (!titulo) continue;
    const itens = [], regras = [];
    for (const l of linhas.slice(3)) {
      const nome = limpa(l[c]);
      if (!nome) continue;
      const parceria = valorBR(l[c + 1]), pista = valorBR(l[c + 2]);
      if (/%/.test(nome) && parceria == null && pista == null) { regras.push(nome + (limpa(l[c + 1]) ? ' · ' + limpa(l[c + 1]) : '') + (limpa(l[c + 2]) ? ' · ' + limpa(l[c + 2]) : '')); continue; }
      if (/%/.test(limpa(l[c + 1]))) { regras.push([nome, limpa(l[c + 1]), limpa(l[c + 2])].filter(Boolean).join(' · ')); continue; }
      itens.push({ nome, parceria, pista });
    }
    if (itens.length || regras.length) blocos.push({ categoria: titulo, itens, regras });
  }
  return blocos;
}

/** Última sincronização da economia (aba LOG SYNC ILEGAL). */
export function logSync(linhas) {
  const v = (rotulo) => limpa((linhas.find((l) => norm(l[0]) === norm(rotulo)) || [])[1]);
  return { inicio: v('INÍCIO'), fim: v('FIM'), atualizacoes: v('ATUALIZAÇÕES'), inativos: v('INATIVOS') };
}

/** Junta tudo numa base só, pronta para as telas. */
export function montarBase({ faccoes: f = {}, ilegal: i = {} }) {
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
    economia: economia(i.economia || []),
    sync: logSync(i.sync || []),
  };
}
