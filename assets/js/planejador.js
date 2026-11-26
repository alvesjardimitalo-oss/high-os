// HIGH OS — Planejador de missões.
// O mapa e o editor são o módulo mission-planner.js (mantido). Aqui ficam:
//  - a ponte window.HighOSMissionCloud, que o módulo usa para ler/gravar zonas no Firebase;
//  - a montagem da tela, numa área que NÃO é destruída ao trocar de tela (o Leaflet
//    fica preso aos elementos onde nasceu).
import * as nuvem from './nuvem.js';
import { $ } from './ui.js';

let carregando = null, ultimaLeitura = null, ultimaEm = 0;
const evento = (detail) => window.dispatchEvent(new CustomEvent('highos:mission-cloud', { detail }));

export function prepararNuvemPlanejador(estado) {
  window.HighOSMissionCloud = {
    version: 2,
    canEdit: () => !!estado.perfil?.staff,
    user: () => estado.usuario?.email || '',
    /* Facções com Group ocupado (meta de spawns) e QGs (spawn não pode cair dentro). */
    faccoesAtivas: () => (estado.base?.faccoes || []).filter((f) => f.assumido).map((f) => ({ group: f.group, faccao: f.faccao, segmento: f.segmento })),
    qgs: () => [],
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
  ['assets/vendor/leaflet/leaflet.css', 'assets/mission-planner.css?v=12.18.0', 'assets/mission-planner-nav.css?v=12.8.0', 'assets/planejador-v15.css?v=15.0.0', 'assets/css/planejador-tema.css?v=1.0.0'].forEach(estilo);
  const html = await fetch('assets/planejador.html?v=1.0.0').then((r) => { if (!r.ok) throw new Error('planejador.html HTTP ' + r.status); return r.text(); });
  const area = document.createElement('div');
  area.id = 'area-planejador'; area.hidden = true; area.innerHTML = html;
  $('#tela').after(area);
  if (!window.L) await script('assets/vendor/leaflet/leaflet.js');
  window.HighCarregarHtml2canvas = () => (window.html2canvas ? Promise.resolve() : script('assets/vendor/html2canvas.min.js'));
  await script('assets/modules/eventos-painel.js?v=12.17.0');
  await script('assets/mission-planner.js?v=12.18.3');
  await script('assets/mission-planner-nav.js?v=12.8.1');
}

export async function telaPlanejador({ el, aoSair }) {
  el.innerHTML = '<div class="boot" style="min-height:40vh"><span>Abrindo o mapa…</span></div>';
  try { await (carregando ||= carregar().catch((e) => { carregando = null; throw e; })); }
  catch (err) { el.innerHTML = `<div class="aviso erro">Não consegui abrir o planejador: ${err.message}</div>`; return; }
  const area = $('#area-planejador');
  el.hidden = true; area.hidden = false;
  document.body.classList.add('no-planejador');
  setTimeout(() => window.HighMissionPlanner?.activate?.(), 60);
  aoSair(() => { area.hidden = true; el.hidden = false; document.body.classList.remove('no-planejador'); });
}
