/* High OS - conferencia das versoes de cache.
 *
 * Por que existe: um arquivo alterado cujo ?v= nao sobe continua sendo
 * servido do cache do navegador. Isso ja custou duas rodadas em um
 * mesmo dia - a correcao estava no ar e a tela seguia quebrada, e
 * depois um botao novo simplesmente nao apareceu.
 *
 * Ao contrario de um detector por heuristica, aqui nao ha adivinhacao:
 * o git diz exatamente quais arquivos mudaram, e o index.html e os
 * imports dizem exatamente que versao cada um pede. Comparar as duas
 * listas ou acusa de verdade, ou nao acusa.
 *
 *   node tools/versoes.mjs origin/main
 */
import {execSync} from 'child_process';
import fs from 'fs';

const base = process.argv[2] || 'origin/main';

let mudados = [];
try {
  mudados = execSync(`git diff --name-only ${base}...HEAD`, {encoding: 'utf8'})
    .split('\n').map(s => s.trim()).filter(Boolean);
} catch (e) {
  console.error(`Não consegui comparar com "${base}": ${e.message.split('\n')[0]}`);
  process.exit(2);
}

const alvos = mudados.filter(f => /^assets\/.+\.(js|css)$/.test(f));
if (!alvos.length) {
  console.log('Nenhum arquivo de assets mudou; nada a conferir.');
  process.exit(0);
}

const html = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('assets/app.js', 'utf8');
const antes = f => { try { return execSync(`git show ${base}:${f}`, {encoding: 'utf8'}) } catch (e) { return '' } };
const htmlAntigo = antes('index.html');
const appAntigo = antes('assets/app.js');
const escapar = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function pedidosDe(arquivo) {
  const nome = arquivo.replace(/^assets\//, '');
  const achados = [];
  for (const [onde, txt] of [['index.html', html], ['app.js (import)', app]]) {
    const re = new RegExp(escapar(nome) + '\\?v=([\\w.-]+)', 'g');
    let m; while ((m = re.exec(txt))) achados.push({onde, versao: m[1]});
  }
  return achados;
}

const problemas = [];
for (const f of alvos) {
  const nome = f.replace(/^assets\//, '');
  const pedidos = pedidosDe(f);

  if (!pedidos.length) {
    /* Carregado sem ?v= nenhum: quem decide quando rebuscar e o navegador. */
    if (html.includes(nome) || app.includes(nome)) problemas.push({f, tipo: 'sem-versao'});
    continue;
  }
  /* Versao parada = a mesma string aparecia no arquivo antigo. */
  const parada = pedidos.find(p => {
    const txt = p.onde === 'index.html' ? htmlAntigo : appAntigo;
    return txt.includes(nome + '?v=' + p.versao);
  });
  if (parada) problemas.push({f, tipo: 'versao-parada', ...parada});
}

if (!problemas.length) {
  console.log(`\x1b[32m${alvos.length} arquivo(s) de assets mudaram e todos tiveram a versão de cache atualizada.\x1b[0m`);
  process.exit(0);
}

console.log('\x1b[31mArquivos alterados cujo cache não foi invalidado:\x1b[0m\n');
for (const p of problemas) {
  console.log(`  ${p.f}`);
  if (p.tipo === 'sem-versao') {
    console.log('    é carregado sem ?v= — o navegador decide sozinho quando buscar de novo.\n');
  } else {
    console.log(`    mudou, mas ${p.onde} continua pedindo ?v=${p.versao}.`);
    console.log('    Quem já abriu o painel vai continuar recebendo a versão antiga.\n');
  }
}
console.log('\x1b[31mREPROVADO.\x1b[0m Suba a versão no index.html (ou no import dentro do app.js) antes de publicar.\n');
process.exit(1);
