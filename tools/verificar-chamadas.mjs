#!/usr/bin/env node
/* =====================================================================
   HIGH OS · chamadas para funções que não existem (V12.6)
   ---------------------------------------------------------------------
   O verificar-integridade.mjs pega função que SUMIU em relação à
   referência. Este aqui pega o caso inverso: código que CHAMA uma função
   que nunca foi definida.

   Esse erro não aparece ao carregar a página. Só estoura quando aquela
   linha roda, às vezes numa situação rara. Foi o caso do `historyMillis`:
   ele só era chamado quando um Group tinha duas entregas no histórico, e
   derrubava o fim do recolhimento com "historyMillis is not defined".

     node tools/verificar-chamadas.mjs
   ===================================================================== */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const raiz = new URL('..', import.meta.url).pathname;
const arquivos = ['assets/app.js', 'assets/mission-planner.js', 'assets/ui-kit.js',
  ...readdirSync(join(raiz, 'assets/modules')).filter(f => f.endsWith('.js')).map(f => 'assets/modules/' + f)];

/* Troca strings, templates, comentários e regex por espaços, preservando o
   código dentro de ${ } dos templates. */
function soCodigo(src) {
  let out = '', i = 0, ultimo = '';
  const pilha = [];               // profundidade de chaves dentro de ${ }
  const antesDeRegex = /[(,=:[!&|?{};+\-*%<>~^]$/;
  while (i < src.length) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') { while (i < src.length && src[i] !== '\n') { out += ' '; i++; } continue; }
    if (c === '/' && d === '*') { const f = src.indexOf('*/', i + 2); const fim = f < 0 ? src.length : f + 2; out += src.slice(i, fim).replace(/[^\n]/g, ' '); i = fim; continue; }
    if (c === '"' || c === "'") {
      let j = i + 1; while (j < src.length && src[j] !== c && src[j] !== '\n') { if (src[j] === '\\') j++; j++; }
      out += ' '.repeat(j + 1 - i); i = j + 1; ultimo = 'x'; continue;
    }
    if (c === '`' || (c === '}' && pilha.length && pilha[pilha.length - 1] === 0)) {
      if (c === '}') pilha.pop();
      let j = i + 1;
      while (j < src.length) {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === '`') break;
        if (src[j] === '$' && src[j + 1] === '{') break;
        j++;
      }
      out += src.slice(i, j).replace(/[^\n]/g, ' ');
      if (src[j] === '$') { out += '  '; pilha.push(0); i = j + 2; ultimo = '{'; continue; }
      out += ' '; i = j + 1; ultimo = 'x'; continue;
    }
    if (c === '/' && (antesDeRegex.test(ultimo) || /\b(return|typeof|case|in|of)$/.test(out.trimEnd()))) {
      let j = i + 1, classe = false;
      while (j < src.length && src[j] !== '\n') {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === '[') classe = true; else if (src[j] === ']') classe = false;
        else if (src[j] === '/' && !classe) break;
        j++;
      }
      j++; while (/[a-z]/i.test(src[j] || '')) j++;
      out += ' '.repeat(j - i); i = j; ultimo = 'x'; continue;
    }
    if (pilha.length) { if (c === '{') pilha[pilha.length - 1]++; else if (c === '}') pilha[pilha.length - 1]--; }
    out += c; if (!/\s/.test(c)) ultimo = c; i++;
  }
  return out;
}

const NATIVOS = new Set(`if for while switch catch function return typeof new await async import export super this void delete throw
Object Array String Number Boolean Math JSON Date Promise Set Map WeakMap WeakSet RegExp Error TypeError parseInt parseFloat isNaN isFinite
setTimeout clearTimeout setInterval clearInterval requestAnimationFrame cancelAnimationFrame requestIdleCallback alert confirm prompt fetch
encodeURIComponent decodeURIComponent encodeURI decodeURI structuredClone Symbol Intl URL URLSearchParams Blob File FileReader Image Audio atob btoa
getComputedStyle queueMicrotask CustomEvent Event KeyboardEvent MutationObserver IntersectionObserver ResizeObserver RTCPeerConnection
RTCSessionDescription RTCIceCandidate MediaStream MediaRecorder AbortController TextEncoder TextDecoder Notification BigInt Proxy Reflect
Uint8Array ArrayBuffer DataView Float32Array Int16Array AudioContext webkitAudioContext OffscreenCanvas matchMedia open close print
html2canvas require Worker Headers Response Request FormData scrollTo`.split(/\s+/));

const codigo = Object.fromEntries(arquivos.map(a => [a, soCodigo(readFileSync(join(raiz, a), 'utf8'))]));

const definidos = new Set();
const bruto = Object.fromEntries(arquivos.map(a => [a, readFileSync(join(raiz, a), 'utf8')]));
for (const [arq, c] of Object.entries(codigo)) {
  for (const m of c.matchAll(/function\s*\*?\s*([A-Za-z_$][\w$]*)/g)) definidos.add(m[1]);
  for (const m of c.matchAll(/\b(?:const|let|var)\s+([^;=]+?)\s*=/g)) for (const n of m[1].matchAll(/[A-Za-z_$][\w$]*/g)) definidos.add(n[0]);
  for (const m of c.matchAll(/(?:^|[,;{(\s])([A-Za-z_$][\w$]*)\s*=(?![=>])/gm)) definidos.add(m[1]);
  for (const m of c.matchAll(/window\.([A-Za-z_$][\w$]*)\s*=/g)) definidos.add(m[1]);
  for (const m of c.matchAll(/function\s*[\w$]*\s*\(([^()]*)\)/g)) for (const n of m[1].matchAll(/[A-Za-z_$][\w$]*/g)) definidos.add(n[0]);
  for (const m of c.matchAll(/\(([^()]*)\)\s*=>/g)) for (const n of m[1].matchAll(/[A-Za-z_$][\w$]*/g)) definidos.add(n[0]);
  for (const m of c.matchAll(/([A-Za-z_$][\w$]*)\s*=>/g)) definidos.add(m[1]);
  for (const m of c.matchAll(/catch\s*\(\s*([A-Za-z_$][\w$]*)/g)) definidos.add(m[1]);
  // imports (inclusive "x as y")
  for (const m of bruto[arq].matchAll(/import\s*\{([^}]*)\}/g)) for (const p of m[1].split(',')) { const n = p.trim().split(/\s+as\s+/).pop(); if (n) definidos.add(n); }
  for (const m of bruto[arq].matchAll(/import\s+([A-Za-z_$][\w$]*)\s+from/g)) definidos.add(m[1]);
}

const problemas = [];
for (const [arq, c] of Object.entries(codigo)) {
  const linhas = c.split('\n');
  linhas.forEach((l, i) => {
    for (const m of l.matchAll(/(?<![\w$.])([A-Za-z_$][\w$]*)\s*\(/g)) {
      const n = m[1];
      if (NATIVOS.has(n) || definidos.has(n)) continue;
      // método abreviado de objeto: nome(...){  — é definição, não chamada
      const resto = c.slice(c.split('\n').slice(0, i).join('\n').length + (i ? 1 : 0) + m.index);
      let p = resto.indexOf('('), prof = 0, k = p;
      for (; k < resto.length; k++) { if (resto[k] === '(') prof++; else if (resto[k] === ')' && --prof === 0) break; }
      if (/^\s*\{/.test(resto.slice(k + 1))) continue;
      problemas.push({ n, arq, linha: i + 1 });
    }
  });
}

if (problemas.length) {
  console.log('\nHIGH OS · chamadas sem definição\n');
  for (const p of problemas) console.log(`  ✗  ${p.n.padEnd(28)} ${p.arq}:${p.linha}`);
  console.log(`\nREPROVADO — ${problemas.length} chamada(s) para função que não existe em nenhum arquivo.\n`);
  process.exit(1);
}
console.log('\nAPROVADO — toda função chamada existe.\n');
