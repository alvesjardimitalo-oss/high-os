// HIGH OS — Planejador de missões.
// O mapa e o editor são o módulo mission-planner.js (mantido). Aqui ficam:
//  - a ponte window.HighOSMissionCloud, que o módulo usa para ler/gravar zonas no Firebase;
//  - a montagem da tela, numa área que NÃO é destruída ao trocar de tela (o Leaflet
//    fica preso aos elementos onde nasceu).
import * as nuvem from './nuvem.js';
import { $ } from './ui.js';

let carregando = null, ultimaLeitura = null, ultimaEm = 0;

/* Memória de CDS: alturas reais já validadas no jogo, de qualquer zona (mesmo apagada).
   O módulo do planejador lê com cdsMemoria() e grava com gravarCds(). */
let memoriaCds = [], memoriaLida = null;

/* Perímetros das facções (QG e pontos afastados), vindos do site de métricas pelo coletor. */
let qgsFaccoes = [], qgsLidos = null;
function carregarQgs(estado) {
  qgsLidos ||= nuvem.lerQgs().then((d) => {
    const nome = new Map((estado.base?.faccoes || []).map((f) => [String(f.group || '').toUpperCase(), f.faccao || '']));
    qgsFaccoes = (d?.qgs || []).filter((q) => Number.isFinite(+q.x) && Number.isFinite(+q.y)).map((q) => {
      const fac = nome.get(String(q.group).toUpperCase());
      return { x: +q.x, y: +q.y, raio: +q.raio || 150, group: q.group, tipo: q.tipo, qg: `${q.tipo === 'qg' ? 'QG' : q.tipo === 'garage' ? 'Garagem' : q.tipo === 'route' ? 'Rota' : 'Ponto'} ${q.group}${fac ? ' · ' + fac : ''}` };
    });
    window.dispatchEvent(new CustomEvent('highos:qgs', { detail: { total: qgsFaccoes.length } }));
  }).catch((e) => { qgsLidos = null; console.warn('[planejador] perímetros das facções', e); });
  return qgsLidos;
}
const celulaCds = (x, y) => `c_${Math.round(x / 5)}_${Math.round(y / 5)}`;
const cdsValida = (o) => [o?.x, o?.y, o?.z].every((v) => Number.isFinite(Number(v))) && Number(o.x) !== 0 && Number(o.y) !== 0 && Number(o.z) > -50 && Number(o.z) < 1500;
function carregarMemoriaCds() {
  memoriaLida ||= nuvem.lerMemoriaCds().then((l) => {
    memoriaCds = l.filter(cdsValida).map((o) => ({ id: o.id, x: +o.x, y: +o.y, z: +o.z }));
    window.dispatchEvent(new CustomEvent('highos:cds-memoria', { detail: { total: memoriaCds.length } }));
  }).catch((e) => { memoriaLida = null; console.warn('[planejador] memória de CDS', e); });
  return memoriaLida;
}
async function gravarMemoria(lista, estado) {
  if (!estado.perfil?.staff) return { ok: false, gravados: 0 };
  await carregarMemoriaCds();
  const porId = new Map(memoriaCds.map((o) => [o.id, o]));
  const novos = new Map();
  for (const o of lista || []) {
    if (!cdsValida(o)) continue;
    const it = { id: celulaCds(+o.x, +o.y), x: Math.round(+o.x * 100) / 100, y: Math.round(+o.y * 100) / 100, z: Math.round(+o.z * 100) / 100, origem: o.origem || 'cds' };
    const ja = porId.get(it.id);
    if (ja && Math.abs(ja.z - it.z) < 0.5) continue; // mesma altura já guardada
    novos.set(it.id, it);
  }
  if (!novos.size) return { ok: true, gravados: 0 };
  try {
    await nuvem.gravarMemoriaCds([...novos.values()]);
    novos.forEach((it) => porId.set(it.id, { id: it.id, x: it.x, y: it.y, z: it.z }));
    memoriaCds = [...porId.values()];
    window.dispatchEvent(new CustomEvent('highos:cds-memoria', { detail: { total: memoriaCds.length, gravados: novos.size } }));
    return { ok: true, gravados: novos.size };
  } catch (e) { console.warn('[planejador] gravar memória de CDS', e); return { ok: false, gravados: 0, erro: e.message }; }
}
const evento = (detail) => window.dispatchEvent(new CustomEvent('highos:mission-cloud', { detail }));

let estadoPlanejador = {};
export function prepararNuvemPlanejador(estado) {
  estadoPlanejador = estado;
  window.HighOSMissionCloud = {
    version: 2,
    canEdit: () => !!estado.perfil?.staff,
    user: () => estado.usuario?.email || '',
    /* Facções com Group ocupado (meta de spawns) e QGs (spawn não pode cair dentro). */
    faccoesAtivas: () => (estado.base?.faccoes || []).filter((f) => f.assumido).map((f) => ({ group: f.group, faccao: f.faccao, segmento: f.segmento })),
    qgs: () => qgsFaccoes,
    pull: async ({ force = false } = {}) => {
      if (!force && ultimaLeitura && Date.now() - ultimaEm < 20000) return ultimaLeitura;
      try {
        const entries = await nuvem.zonasDoPlanejador();
        ultimaLeitura = { entries, legacy: false, pulledAt: new Date().toISOString() }; ultimaEm = Date.now();
        return ultimaLeitura;
      } catch (err) { console.warn('[planejador] leitura', err); return null; }
    },
    ensureMigrated: async () => ({ ok: true, migrated: false }),
    saveZones: (itens) => gravar(itens, false, estado),
    deleteZones: (itens) => gravar(itens, true, estado),
    cdsMemoria: () => memoriaCds,
    gravarCds: (lista) => gravarMemoria(lista, estado),
  };
}

async function gravar(itens = [], excluir, estado) {
  if (!estado.perfil?.staff) return { ok: false, permission: true, results: [] };
  const results = []; evento({ state: 'sync' });
  try { for (const it of itens) results.push(await nuvem.gravarZona(it.zona, it.baseRev, excluir)); }
  catch (err) { evento({ state: 'local', error: { message: err.message } }); return { ok: false, error: { message: err.message }, results }; }
  ultimaEm = 0;
  const ok = results.every((r) => r.ok);
  evento({ state: ok ? 'ok' : 'local', updatedAtText: new Date().toISOString(), updatedBy: estado.usuario?.email || '' });
  return { ok, results };
}

const script = (src) => new Promise((ok, erro) => {
  const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => erro(new Error('falha ao carregar ' + src)); document.body.appendChild(s);
});
const estilo = (href) => { if (document.querySelector(`link[href="${href}"]`)) return; const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); };

async function carregar() {
  if (window.HighMissionPlanner) return;
  carregarMemoriaCds();
  carregarQgs(estadoPlanejador);
  ['assets/vendor/leaflet/leaflet.css', 'assets/mission-planner.css?v=12.18.0', 'assets/mission-planner-nav.css?v=12.8.0', 'assets/planejador-v15.css?v=15.0.0', 'assets/css/planejador-tema.css?v=1.2.0'].forEach(estilo);
  const html = await fetch('assets/planejador.html?v=1.0.0').then((r) => { if (!r.ok) throw new Error('planejador.html HTTP ' + r.status); return r.text(); });
  const area = document.createElement('div');
  area.id = 'area-planejador'; area.hidden = true; area.innerHTML = html;
  $('#tela').after(area);
  if (!window.L) await script('assets/vendor/leaflet/leaflet.js');
  window.HighCarregarHtml2canvas = () => (window.html2canvas ? Promise.resolve() : script('assets/vendor/html2canvas.min.js'));
  await script('assets/modules/eventos-painel.js?v=12.17.0');
  await script('assets/mission-planner.js?v=13.1.0');
  await script('assets/mission-planner-nav.js?v=12.8.1');
}

/* ---------- Distribuição do editor (o CSS fica em assets/css/planejador-tema.css) ---------- */
const CHAVE_RECOLHIDOS = 'hos.planejador.recolhidos';
const CHAVE_LATERAL = 'hos.planejador.semLateral';
// Na primeira vez, os blocos longos e opcionais já começam fechados.
const FECHADOS_PADRAO = ['CDS da zona — polígono', 'Importação em lote'];
const lerJson = (k, padrao) => { try { return JSON.parse(localStorage.getItem(k) ?? 'null') ?? padrao; } catch { return padrao; } };
const gravarJson = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sem armazenamento */ } };
const tituloCartao = (h3) => h3.textContent.trim().replace(/\s+/g, ' ').toLowerCase();
/** Leaflet só recalcula o tamanho do mapa num resize da janela. */
const avisarMapa = () => requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));

function ajustarAltura(area) {
  const topo = document.querySelector('.topo');
  area.style.setProperty('--mp-altura', `${window.innerHeight - (topo?.getBoundingClientRect().height || 0)}px`);
}

function prepararRecolhiveis(pagina) {
  const lado = pagina.querySelector('.mission-planner-side');
  if (!lado) return;
  const fechados = new Set(lerJson(CHAVE_RECOLHIDOS, FECHADOS_PADRAO.map((t) => t.toLowerCase())));
  const marcar = () => lado.querySelectorAll('.mp-card > h3:not([data-recolhe])').forEach((h3) => {
    h3.dataset.recolhe = '1';
    h3.title = 'Abrir ou recolher';
    h3.parentElement.classList.toggle('mp-fechado', fechados.has(tituloCartao(h3)));
  });
  marcar();
  new MutationObserver(marcar).observe(lado, { childList: true, subtree: true });
  lado.addEventListener('click', (e) => {
    const h3 = e.target.closest('.mp-card > h3[data-recolhe]');
    if (!h3) return;
    const fechou = h3.parentElement.classList.toggle('mp-fechado');
    const t = tituloCartao(h3);
    if (fechou) fechados.add(t); else fechados.delete(t);
    gravarJson(CHAVE_RECOLHIDOS, [...fechados]);
  });
}

function prepararBotaoLateral(pagina) {
  const mapa = pagina.querySelector('.mission-planner-mapwrap');
  if (!mapa || mapa.querySelector('.mp-alterna-lateral')) return;
  const bt = document.createElement('button');
  bt.type = 'button'; bt.className = 'mp-alterna-lateral';
  const aplicar = (sem) => {
    pagina.classList.toggle('mp-sem-lateral', sem);
    bt.textContent = sem ? '› Mostrar painel' : '‹ Mapa inteiro';
    bt.title = sem ? 'Mostrar o painel lateral' : 'Esconder o painel lateral e usar o mapa na largura toda';
    avisarMapa();
  };
  bt.onclick = () => { const sem = !pagina.classList.contains('mp-sem-lateral'); gravarJson(CHAVE_LATERAL, sem); aplicar(sem); };
  mapa.appendChild(bt);
  aplicar(!!lerJson(CHAVE_LATERAL, false));
}

let distribuicaoPronta = false;
function prepararDistribuicao(area) {
  ajustarAltura(area);
  if (distribuicaoPronta) return;
  const pagina = area.querySelector('#page-planejador');
  if (!pagina) return;
  distribuicaoPronta = true;
  prepararRecolhiveis(pagina);
  prepararBotaoLateral(pagina);
  window.addEventListener('resize', () => ajustarAltura(area));
}

export async function telaPlanejador({ el, aoSair }) {
  el.innerHTML = '<div class="boot" style="min-height:40vh"><span>Abrindo o mapa…</span></div>';
  try { await (carregando ||= carregar().catch((e) => { carregando = null; throw e; })); }
  catch (err) { el.innerHTML = `<div class="aviso erro">Não consegui abrir o planejador: ${err.message}</div>`; return; }
  const area = $('#area-planejador');
  el.hidden = true; area.hidden = false;
  document.body.classList.add('no-planejador');
  prepararDistribuicao(area);
  setTimeout(() => { window.HighMissionPlanner?.activate?.(); avisarMapa(); }, 60);
  aoSair(() => { area.hidden = true; el.hidden = false; document.body.classList.remove('no-planejador'); });
}
