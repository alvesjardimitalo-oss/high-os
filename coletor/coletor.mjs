// HIGH OS — coletor de métricas (roda no computador do administrador).
//
//   npm run login    abre o Edge para entrar com o Discord no metricas.highrp.net (uma vez)
//   npm run coletar  lê as métricas com essa sessão e grava no Firestore (o agendador chama este)
//
// A API do site só aceita chamadas vindas do próprio metricas.highrp.net, com o cookie da
// sessão do Discord. Por isso o coletor abre o site num Edge com perfil próprio (pasta
// "perfil/") e faz as leituras de dentro da página. Só leitura: nenhum POST na API.
import { chromium } from 'playwright-core';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { montarAtual, montarDias, montarSemana, semanasDesde } from './montar.mjs';

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

const AQUI = dirname(fileURLToPath(import.meta.url));
const PERFIL = join(AQUI, 'perfil');
const CHAVE = join(AQUI, 'chave-servico.json');
const SITE = 'https://metricas.highrp.net/';
const API = 'https://apidash.highrp.net/api/s/default/';
const modo = process.argv[2] || 'coletar';

const log = (...a) => console.log(new Date().toLocaleString('pt-BR'), '·', ...a);

async function abrirNavegador(visivel) {
  return chromium.launchPersistentContext(PERFIL, { channel: 'msedge', headless: !visivel, viewport: { width: 1280, height: 860 } });
}

/** GET na API de dentro da página (mesma origem do site, cookie da sessão vai junto). */
async function lerApi(page, caminho) {
  const r = await page.evaluate(async (url) => {
    const resp = await fetch(url, { credentials: 'include', cache: 'no-store' });
    return { status: resp.status, corpo: resp.ok ? await resp.json() : null };
  }, API + caminho);
  if (r.status === 401 || r.status === 403) throw new SessaoExpirada();
  if (r.status !== 200 || !r.corpo?.success) throw new Error(`API ${caminho}: HTTP ${r.status}`);
  return r.corpo.data;
}
class SessaoExpirada extends Error {
  constructor() { super('A sessão do Discord no site de métricas expirou. Rode "npm run login" no computador do coletor.'); }
}

async function login() {
  const ctx = await abrirNavegador(true);
  const page = ctx.pages()[0] || await ctx.newPage();
  await page.goto(SITE);
  log('Entre com o Discord na janela do Edge. Ela fecha sozinha quando o login terminar.');
  for (let i = 0; i < 300; i++) {
    const ok = await page.evaluate(async () => {
      try { return location.hostname === 'metricas.highrp.net' && (await fetch('https://apidash.highrp.net/api/auth/me', { credentials: 'include' })).ok; } catch { return false; }
    }).catch(() => false);
    if (ok) { log('Login confirmado. Sessão guardada em coletor/perfil.'); await ctx.close(); return; }
    await page.waitForTimeout(2000);
  }
  await ctx.close();
  throw new Error('O login não foi concluído em 10 minutos.');
}

/** Executa tarefas com no máximo N ao mesmo tempo, para não martelar a API. */
async function emLotes(itens, n, fn) {
  const saida = new Array(itens.length);
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < itens.length) { const k = i++; saida[k] = await fn(itens[k]); }
  }));
  return saida;
}

/** Lê tudo do site e devolve os documentos prontos para o Firestore. */
async function lerSite() {
  const ctx = await abrirNavegador(false);
  try {
    const page = ctx.pages()[0] || await ctx.newPage();
    await page.goto(SITE, { waitUntil: 'domcontentloaded' });
    const lidoEm = new Date().toISOString();
    const [semana, hoje, mes, catalogo, orgs] = await Promise.all([
      lerApi(page, 'ilegal/overview?preset=week'),
      lerApi(page, 'ilegal/overview?preset=today'),
      lerApi(page, 'ilegal/overview?preset=month'),
      lerApi(page, 'ilegal/catalog'),
      lerApi(page, 'ilegal/organizations'),
    ]);
    const ids = (orgs || []).map((o) => o.id).filter(Boolean);
    const pres = await emLotes(ids, 4, async (org) => {
      const q = 'ilegal/presence?organization=' + encodeURIComponent(org);
      const [dia, hora] = await Promise.all([lerApi(page, q + '&grouping=day'), lerApi(page, q + '&grouping=hour')]);
      return [org, { dia, hora }];
    });
    // Uma ficha por semana (segunda a domingo) desde o início do acompanhamento.
    // Semanas fechadas não mudam, mas regravar é barato e corrige atrasos do site.
    const agora = Date.parse(lidoEm);
    const semanas = {};
    for (const s of semanasDesde(num(semana?.trackingSince) || agora, agora)) {
      const ov = await lerApi(page, `ilegal/overview?preset=custom&from=${s.de}&to=${s.ate}`);
      semanas[s.de] = montarSemana(ov, s, agora);
    }
    return { atual: montarAtual({ semana, hoje, mes, catalogo, lidoEm }), dias: montarDias(Object.fromEntries(pres)), semanas, orgs: ids.length };
  } finally {
    await ctx.close();
  }
}

/** Lê o site sem gravar nada: confere se a sessão e a leitura estão funcionando. */
async function testar() {
  const { atual, dias, semanas, orgs } = await lerSite();
  for (const s of Object.values(semanas)) log(`Semana ${s.de} a ${s.ate}${s.parcial ? ' (em andamento)' : ''} · pico global ${s.global.pico} em ${s.global.diaDoPico} · média simultânea ${s.global.mediaOnline} · ${Object.keys(s.organizacoes).length} organizações`);
  const top = [...atual.semana.organizacoes].sort((a, b) => b.pico - a.pico).slice(0, 5).map((o) => `${o.org} (pico ${o.pico})`).join(', ');
  log(`Leitura OK, nada gravado · ${orgs} organizações · ${Object.keys(dias).length} dias · pico da semana ${atual.semana.total.pico} · maiores: ${top}`);
}

async function coletar() {
  if (!existsSync(CHAVE)) throw new Error('Falta coletor/chave-servico.json (veja coletor/LEIAME.md).');
  initializeApp({ credential: cert(JSON.parse(readFileSync(CHAVE, 'utf8'))) });
  const db = getFirestore();
  const refAtual = db.doc('hos/metricas');

  try {
    const { atual, dias, semanas, orgs } = await lerSite();
    const lote = db.batch();
    lote.set(refAtual, { ...atual, coletor: { status: 'ok', em: FieldValue.serverTimestamp(), erro: '' } });
    for (const [dia, doc] of Object.entries(dias)) lote.set(db.doc(`hos/metricas/dias/${dia}`), doc, { merge: true });
    for (const [de, doc] of Object.entries(semanas)) lote.set(db.doc(`hos/metricas/semanas/${de}`), doc);
    await lote.commit();
    log(`OK · ${orgs} organizações · ${Object.keys(dias).length} dias · ${Object.keys(semanas).length} semanas gravados.`);
  } catch (e) {
    // A tela de Métricas mostra este aviso, assim ninguém confia em número parado.
    await refAtual.set({ coletor: { status: e instanceof SessaoExpirada ? 'sessao' : 'erro', em: FieldValue.serverTimestamp(), erro: String(e.message || e).slice(0, 300) } }, { merge: true }).catch(() => {});
    throw e;
  }
}

try {
  if (modo === 'login') await login();
  else if (modo === 'testar') await testar();
  else await coletar();
} catch (e) {
  log('ERRO ·', e.message || e);
  process.exitCode = 1;
}
