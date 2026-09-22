#!/usr/bin/env node
/* =====================================================================
   HIGH OS · verificação de cobertura das regras do Firestore (V12.5)
   ---------------------------------------------------------------------
   O firestore.rules termina com um "tudo que não foi previsto fica
   fechado". Isso é correto, mas tem um efeito colateral: se o código
   passa a gravar numa coleção nova e ninguém lembra de criar a regra,
   a gravação é recusada com permission-denied — em silêncio, só para
   quem usa.

   Foi exatamente o que aconteceu com `evidencias_recolhimento`: o
   recolhimento COM print abortava inteiro.

   Este script lê todos os caminhos do Firestore usados no código e
   confere se cada um tem um `match` correspondente no firestore.rules.
   Roda sozinho no GitHub Actions a cada commit.

     node tools/verificar-regras.mjs
   ===================================================================== */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const raiz = new URL('..', import.meta.url).pathname;
const regras = readFileSync(join(raiz, 'firestore.rules'), 'utf8');

const arquivos = ['assets/app.js', 'assets/mission-planner.js',
  ...readdirSync(join(raiz, 'assets/modules')).filter(f => f.endsWith('.js')).map(f => 'assets/modules/' + f)];

// pega collection(db,'a','b','c') e doc(db,'a','b','c',...) com segmentos literais
const re = /\b(?:collection|doc)\(\s*db\s*,((?:\s*'[^']+'\s*,?)+)/g;
const caminhos = new Map();
for (const arq of arquivos) {
  const src = readFileSync(join(raiz, arq), 'utf8');
  for (const m of src.matchAll(re)) {
    const segs = [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]);
    // highos/data/<colecao>  |  highos/data/config/<doc>  |  users  |  highos/<doc>
    let chave;
    if (segs[0] === 'highos' && segs[1] === 'data' && segs[2] === 'config' && segs[3]) chave = `highos/data/config/${segs[3]}`;
    else if (segs[0] === 'highos' && segs[1] === 'data' && segs[2]) chave = `highos/data/${segs[2]}`;
    else if (segs[0] === 'highos' && segs[1]) chave = `highos/${segs[1]}`;
    else chave = segs[0];
    // caminho montado em tempo de execução (ex.: collection(db,'highos','data',name)): não dá para conferir aqui
    if (chave === 'highos/data') continue;
    if (!caminhos.has(chave)) caminhos.set(chave, arq);
  }
}

const temConfigCuringa = /match\s+\/highos\/data\/config\/\{[a-z]+\}/i.test(regras);
const faltando = [];
for (const [chave, arq] of [...caminhos].sort()) {
  const partes = chave.split('/');
  let ok;
  if (chave.startsWith('highos/data/config/')) {
    ok = regras.includes(`/${chave} `) || regras.includes(`/${chave}{`) || temConfigCuringa;
  } else if (partes.length === 3 || partes.length === 1) {
    // coleção: precisa de match /<caminho>/{algo}
    ok = new RegExp(`match\\s+/${chave.replace(/\//g, '\\/')}/\\{`).test(regras);
  } else {
    // documento isolado (ex.: highos/metricas_config)
    ok = new RegExp(`match\\s+/${chave.replace(/\//g, '\\/')}\\s*\\{`).test(regras);
  }
  console.log(`${ok ? '  ok ' : '  ✗  '} ${chave.padEnd(40)} ${ok ? '' : '(usado em ' + arq + ')'}`);
  if (!ok) faltando.push(chave);
}

if (faltando.length) {
  console.log(`\nREPROVADO — ${faltando.length} caminho(s) sem regra no firestore.rules.`);
  console.log('Sem regra, o catch-all recusa leitura e gravação com permission-denied.\n');
  process.exit(1);
}
console.log(`\nAPROVADO — ${caminhos.size} caminhos, todos com regra.\n`);
