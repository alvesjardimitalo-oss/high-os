#!/usr/bin/env node
/**
 * HIGH OS · Verificação de integridade
 * ---------------------------------------------------------------
 * Rode ANTES de publicar qualquer alteração:
 *
 *     node tools/verificar-integridade.mjs
 *
 * Compara o código atual com a última versão conhecida boa e
 * denuncia funções que sumiram — foi assim que loadStore,
 * mergeOfficialPresets e as cinco funções do Google Sheets
 * desapareceram sem ninguém perceber.
 *
 * Para gravar a referência depois de uma versão validada:
 *
 *     node tools/verificar-integridade.mjs --salvar
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REFERENCIA = path.join(raiz, 'tools', 'referencia-funcoes.json');
const ARQUIVOS = ['assets/app.js', 'assets/mission-planner.js', 'assets/ui-kit.js'];

const vermelho = t => `\x1b[31m${t}\x1b[0m`;
const verde = t => `\x1b[32m${t}\x1b[0m`;
const amarelo = t => `\x1b[33m${t}\x1b[0m`;

function funcoesDe(codigo) {
  const nomes = new Set();
  for (const m of codigo.matchAll(/(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g)) nomes.add(m[1]);
  for (const m of codigo.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function|\([^)]*\)\s*=>)/g)) nomes.add(m[1]);
  return nomes;
}

async function checarSintaxe(arquivo, codigo) {
  // app.js é módulo ES; os outros são scripts clássicos
  try {
    if (codigo.includes('import ')) {
      const tmp = path.join(raiz, '.verificar.mjs');
      fs.writeFileSync(tmp, codigo);
      const { execSync } = await import('node:child_process');
      execSync(`node --check ${tmp}`, { stdio: 'pipe' });
      fs.unlinkSync(tmp);
    } else {
      new Function(codigo);
    }
    return null;
  } catch (e) {
    return e.message.split('\n')[0];
  }
}

const atual = {};
let erros = 0, avisos = 0;

console.log('\nHIGH OS · verificação de integridade\n');

for (const rel of ARQUIVOS) {
  const abs = path.join(raiz, rel);
  if (!fs.existsSync(abs)) { console.log(vermelho(`FALTA  ${rel}`)); erros++; continue; }
  const codigo = fs.readFileSync(abs, 'utf8');
  atual[rel] = [...funcoesDe(codigo)].sort();

  const linhas = codigo.split('\n');
  const maior = Math.max(...linhas.map(l => l.length));
  console.log(`${rel}: ${linhas.length} linhas, ${atual[rel].length} funções, maior linha ${maior} caracteres`);
  if (maior > 5000) { console.log(amarelo(`  aviso: linha de ${maior} caracteres torna o diff ilegível no GitHub`)); avisos++; }
}

if (process.argv.includes('--salvar')) {
  fs.writeFileSync(REFERENCIA, JSON.stringify(atual, null, 2));
  console.log(verde('\nReferência salva. Use esta versão como base de comparação.\n'));
  process.exit(0);
}

if (!fs.existsSync(REFERENCIA)) {
  console.log(amarelo('\nNenhuma referência gravada ainda. Rode com --salvar numa versão que você sabe que funciona.\n'));
  process.exit(0);
}

const referencia = JSON.parse(fs.readFileSync(REFERENCIA, 'utf8'));
console.log('');
for (const rel of ARQUIVOS) {
  const antes = new Set(referencia[rel] || []);
  const agora = new Set(atual[rel] || []);
  const sumiram = [...antes].filter(f => !agora.has(f));
  const novas = [...agora].filter(f => !antes.has(f));
  if (sumiram.length) {
    console.log(vermelho(`${rel}: ${sumiram.length} função(ões) SUMIRAM`));
    sumiram.forEach(f => console.log(vermelho(`  - ${f}`)));
    erros += sumiram.length;
  }
  if (novas.length) console.log(`${rel}: ${novas.length} função(ões) nova(s): ${novas.join(', ')}`);
}

console.log('');
if (erros) {
  console.log(vermelho(`REPROVADO — ${erros} problema(s). Não publique antes de resolver.\n`));
  process.exit(1);
}
console.log(verde(`APROVADO${avisos ? ` (com ${avisos} aviso)` : ''} — pode publicar.\n`));
