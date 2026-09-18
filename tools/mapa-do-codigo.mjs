#!/usr/bin/env node
/**
 * HIGH OS · MAPA DO CÓDIGO
 * ---------------------------------------------------------------
 * Lê os arquivos do projeto e gera dois resultados:
 *
 *   1. INDICE-DO-CODIGO.md — todas as funções agrupadas por
 *      categoria, com linha, quem chama e o que chama.
 *   2. um relatório no terminal com o que dá para remover sem
 *      quebrar nada (funções que ninguém chama).
 *
 * Uso:
 *   node tools/mapa-do-codigo.mjs            relatório no terminal
 *   node tools/mapa-do-codigo.mjs --md       grava o índice
 *   node tools/mapa-do-codigo.mjs nomeDaFn   impacto de uma função
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARQUIVOS = ['assets/app.js', 'assets/mission-planner.js', 'assets/ui-kit.js']
  .concat(fs.existsSync(path.join(raiz, 'assets/modules'))
    ? fs.readdirSync(path.join(raiz, 'assets/modules')).filter(f => f.endsWith('.js')).map(f => 'assets/modules/' + f)
    : []);

/* ---------------------------------------------------------------
   CATEGORIAS
   A ordem importa: a primeira regra que casar define a categoria.
   Baseadas no vocabulário real do projeto, não em convenção genérica.
--------------------------------------------------------------- */
const CATEGORIAS = [
  ['Autenticação e sessão',      /^(login|logout|carregarCadastro|startOrResume|closeCurrent|touchSession|reservarSessao|startSession|renderSession|sessionStorageKey|sessionStartMs|makeSessionId|esperar)/i],
  ['Permissões',                 /^(isAdmin|canView|canEdit|permission|effectivePermissions|defaultPermissions|mutationButton|metricOnly)/i],
  ['Resiliência e cache',        /^(getDocsCached|cache|packCache|unpackCache|comoSnapshot|entrarModoLocal|sairModoLocal|mostrarFaixa|statBump|isQuotaError|enterQuotaMode)/i],
  ['Métricas · leitura',         /^(loadMetric|readMetric|refreshMetricServer|recoverMetrics|runMetricAuto|startMetricAuto|stopMetricAuto|podeSincronizar|metricTimeout|sheetsFetch|authorizeSheets|getSheetTitles|lerEspelho|aplicarLinhas)/i],
  ['Métricas · gravação',        /^(persistMetric|salvarEspelho|metricRowsPendentes|agruparPorMes|assinaturaMes|compactar|expandir|metricMesDe)/i],
  ['Métricas · apresentação',    /^(renderMetric|switchMetricCenter|metricSummary|metricCurrent|metricSlots|metricRowKey|activeMetricRows|refreshMetricPeriod|currentMetricMonth|applyMetricSnapshot|metricDaily|metricSource|renderSaude)/i],
  ['Boletim semanal',            /^boletim/i],
  ['Groups e facções',           /^(loadFaccoes|renderFaccoes|showGroupProfile|loadOrganizations|orgHistory|loadDeliveries|fac|group|org|delivery|transfer|recolh)/i],
  ['Solicitações',               /^(loadRequests|renderRequest|request|solicit)/i],
  ['Histórico e auditoria',      /^(loadHistory|renderHistory|buscarHistorico|historyDate|loadUserAudit|renderUserAudit|sessionActions)/i],
  ['Dashboard',                  /^(renderDashboard|loadDashboard|dashboard|alerta|alert[A-Z])/i],
  ['Chat e chamadas',            /^(startChat|subscribeChat|renderChat|chat|call|hm[A-Z]|team|meeting)/i],
  ['Planejador de missões',      /^(mission|mp[A-Z]|planner|boletimPlan|pullMissions|pushMissions)/i],
  ['Busca global',               /^busca/i],
  ['Economia · mercado negro',   /^(loadMarket|renderMarket|market|mercado)/i],
  ['Alvesinho',                  /^(alves|askAlves)/i],
  ['Spotify',                    /^spotify/i],
  ['Administração',              /^(admin|wipeCollection|seed|importar|exportar|sync)/i],
  ['Formatação e utilidades',    /^(esc|fmt|normalize|parse|slug|num|copyText|show|toggle|activateAppPage|\$)/i]
];

function categoriaDe(nome, secao) {
  // a seção declarada no próprio arquivo tem prioridade: é a organização
  // que o projeto já tem, e ela reflete a história real do código
  if (secao) return secao;
  for (const [rotulo, re] of CATEGORIAS) if (re.test(nome)) return rotulo;
  return 'Sem categoria';
}

/** Lê os banners de seção do arquivo e devolve [{linha, titulo}]. */
function secoesDe(codigo) {
  const out = [];
  codigo.split('\n').forEach((l, i) => {
    let m = l.match(/^\/\/\s*=+\s*HIGH OS[^·=]*·\s*(.+?)\s*=+\s*$/);
    if (!m) m = l.match(/^\s{2,}HIGH OS V[\d.]+\s*[-·]\s*(.+?)\s*$/);
    if (m) out.push({ linha: i + 1, titulo: m[1].trim().replace(/\s*=+$/, '') });
  });
  return out;
}
function secaoNaLinha(secoes, linha) {
  let atual = null;
  for (const s of secoes) { if (s.linha <= linha) atual = s.titulo; else break; }
  return atual;
}

/* ---------------------------------------------------------------
   EXTRAÇÃO
--------------------------------------------------------------- */
const funcoes = new Map();   // nome -> {arquivo, linha, fim, corpo}

for (const rel of ARQUIVOS) {
  const abs = path.join(raiz, rel);
  if (!fs.existsSync(abs)) continue;
  const codigo = fs.readFileSync(abs, 'utf8');
  const secoes = secoesDe(codigo);

  /* funcoes declaradas como const em arrow: const esc = v => ... */
  const reArrow = /(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/g;
  let ma;
  while ((ma = reArrow.exec(codigo))) {
    const nome = ma[1];
    if (funcoes.has(nome)) continue;
    const inicio = codigo.slice(0, ma.index).split('\n').length;
    // arrow termina no ; de nivel zero
    let d = 0, fim = ma.index;
    for (let j = reArrow.lastIndex; j < codigo.length; j++) {
      const c = codigo[j];
      if ('([{'.includes(c)) d++;
      else if (')]}'.includes(c)) d--;
      else if (c === ';' && d <= 0) { fim = j; break; }
    }
    const corpo = codigo.slice(ma.index, fim + 1);
    const fimLinha = codigo.slice(0, fim).split('\n').length;
    funcoes.set(nome, {
      arquivo: rel, linha: inicio, fim: fimLinha, corpo,
      linhas: Math.max(1, fimLinha - inicio + 1),
      secao: secaoNaLinha(secoes, inicio), interna: false, tipo: 'arrow'
    });
  }

  const re = /(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g;
  let m;
  while ((m = re.exec(codigo))) {
    const nome = m[1];
    const inicio = codigo.slice(0, m.index).split('\n').length;
    // acha o fim contando chaves a partir do corpo
    let k = codigo.indexOf('{', re.lastIndex - 1), d = 0, fim = k;
    if (k < 0) continue;
    for (let j = k; j < codigo.length; j++) {
      if (codigo[j] === '{') d++;
      else if (codigo[j] === '}') { d--; if (d === 0) { fim = j; break; } }
    }
    const corpo = codigo.slice(k, fim + 1);
    const fimLinha = codigo.slice(0, fim).split('\n').length;
    funcoes.set(nome, {
      arquivo: rel, linha: inicio, fim: fimLinha, corpo,
      linhas: fimLinha - inicio + 1,
      secao: secaoNaLinha(secoes, inicio),
      interna: false
    });
  }
}

/* funcoes declaradas dentro de outra sao internas: nao sao pontos de entrada */
for (const [nome, info] of funcoes) {
  for (const [outro, i2] of funcoes) {
    if (outro !== nome && i2.arquivo === info.arquivo && i2.linha < info.linha && i2.fim > info.fim) {
      info.interna = true; info.dono = outro; break;
    }
  }
}

/* grafo de chamadas: quem chama quem */
const nomes = [...funcoes.keys()];
for (const [nome, info] of funcoes) {
  info.chama = new Set();
  for (const outro of nomes) {
    if (outro === nome) continue;
    // qualquer mencao conta: chamada direta, callback (setTimeout(fn,0)),
    // atribuicao a listener. Superestimar dependencia e melhor do que dizer
    // "pode remover" para algo que ainda e usado.
    if (new RegExp('(?<![\\w$])(?<!(?<!\\.)\\.)' + outro.replace(/\$/g, '\\$') + '(?![\\w$])').test(info.corpo)) {
      info.chama.add(outro);
    }
  }
}
for (const [nome, info] of funcoes) {
  info.chamadaPor = new Set();
  for (const [outro, i2] of funcoes) if (i2.chama.has(nome)) info.chamadaPor.add(outro);
}

/* Muita coisa e chamada de CODIGO DE TOPO (listeners, onAuthStateChanged),
   nao de dentro de outra funcao. Sem contar isso, o relatorio acusava
   startOrResumeSession como orfa - falso positivo grave. */
for (const rel of ARQUIVOS) {
  const abs = path.join(raiz, rel);
  if (!fs.existsSync(abs)) continue;
  let codigo = fs.readFileSync(abs, 'utf8');
  // remove o corpo de cada funcao: sobra o codigo de topo
  const corpos = [...funcoes.values()].filter(f => f.arquivo === rel && !f.interna)
    .sort((a, b) => b.linha - a.linha);
  let linhas = codigo.split('\n');
  for (const f of corpos) linhas.splice(f.linha - 1, f.fim - f.linha + 1);
  const topo = linhas.join('\n');
  for (const [nome, info] of funcoes) {
    if (new RegExp('(?<![\\w$])(?<!(?<!\\.)\\.)' + nome.replace(/\$/g, '\\$') + '(?![\\w$])').test(topo)) {
      info.chamadaPor.add('(código de topo)');
    }
  }
}

/* usada em HTML (onclick, listeners por id) ou só internamente */
const html = fs.existsSync(path.join(raiz, 'index.html'))
  ? fs.readFileSync(path.join(raiz, 'index.html'), 'utf8') : '';

/* ---------------------------------------------------------------
   RELATÓRIOS
--------------------------------------------------------------- */
const arg = process.argv[2];

if (arg && !arg.startsWith('--')) {
  const info = funcoes.get(arg);
  if (!info) { console.log(`\nFunção "${arg}" não encontrada.\n`); process.exit(1); }
  console.log(`\n${arg}  ·  ${categoriaDe(arg, info.secao)}`);
  console.log(`${info.arquivo}, linhas ${info.linha}–${info.fim} (${info.linhas} linhas)\n`);
  console.log(`CHAMADA POR (${info.chamadaPor.size}):`);
  console.log(info.chamadaPor.size ? '  ' + [...info.chamadaPor].join(', ') : '  ninguém — pode ser removida sem afetar outras funções');
  console.log(`\nCHAMA (${info.chama.size}):`);
  console.log(info.chama.size ? '  ' + [...info.chama].join(', ') : '  nada');
  const soAqui = [...info.chama].filter(f => funcoes.get(f)?.chamadaPor.size === 1);
  if (soAqui.length) {
    console.log(`\nFICARIAM ÓRFÃS se esta sair (só ela chama):`);
    console.log('  ' + soAqui.join(', '));
  }
  console.log('');
  process.exit(0);
}

const porCategoria = new Map();
for (const [nome, info] of funcoes) {
  const c = categoriaDe(nome, info.secao);
  if (!porCategoria.has(c)) porCategoria.set(c, []);
  porCategoria.get(c).push({ nome, ...info });
}
const ordenadas = [...porCategoria.entries()].sort((a, b) => b[1].length - a[1].length);

console.log(`\nHIGH OS · MAPA DO CÓDIGO\n`);
console.log(`${funcoes.size} funções em ${ARQUIVOS.length} arquivos, ${porCategoria.size} categorias\n`);
for (const [cat, fns] of ordenadas) {
  const linhas = fns.reduce((n, f) => n + f.linhas, 0);
  console.log(`  ${String(fns.length).padStart(3)} funções · ${String(linhas).padStart(5)} linhas · ${cat}`);
}

const orfas = [...funcoes.entries()]
  .filter(([n, i]) => i.chamadaPor.size === 0 && !i.interna && !html.includes(n) && !/^(login|logout|boot|init)/.test(n));
console.log(`\nSEM NENHUM CHAMADOR (${orfas.length}) — candidatas a remoção:`);
for (const [n, i] of orfas.slice(0, 25)) {
  console.log(`  ${n.padEnd(28)} ${categoriaDe(n, i.secao).padEnd(26)} ${i.arquivo}:${i.linha} (${i.linhas} linhas)`);
}
if (orfas.length > 25) console.log(`  ... e outras ${orfas.length - 25}`);

if (process.argv.includes('--md')) {
  const L = [];
  L.push('# High OS · Índice do código\n');
  L.push('Gerado por `node tools/mapa-do-codigo.mjs --md`. Não edite à mão.\n');
  L.push(`${funcoes.size} funções, ${porCategoria.size} categorias.\n`);
  L.push('Para ver o impacto de remover uma função:\n');
  L.push('```\nnode tools/mapa-do-codigo.mjs nomeDaFuncao\n```\n');
  for (const [cat, fns] of [...porCategoria.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    L.push(`\n## ${cat}\n`);
    L.push('| Função | Arquivo:linha | Linhas | Chamada por | Chama |');
    L.push('|---|---|---|---|---|');
    for (const f of fns.sort((a, b) => a.nome.localeCompare(b.nome))) {
      const por = f.chamadaPor.size ? f.chamadaPor.size : '**ninguém**';
      L.push(`| \`${f.nome}\` | ${f.arquivo}:${f.linha} | ${f.linhas} | ${por} | ${f.chama.size} |`);
    }
  }
  fs.writeFileSync(path.join(raiz, 'INDICE-DO-CODIGO.md'), L.join('\n') + '\n');
  console.log('\nINDICE-DO-CODIGO.md gravado.');
}
console.log('');
