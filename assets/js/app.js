// HIGH OS — Central do Ilegal. Inicialização, login e navegação.
import * as nuvem from './nuvem.js';
import { montarBase } from './dados.js';
import { derivar, brutoDasAbas } from './base.js';
import { esc, $, $$, toast, ICONES } from './ui.js';
import * as telas from './telas.js';
import { telaPlanejador, prepararNuvemPlanejador } from './planejador.js';

export const estado = { usuario: null, perfil: null, base: null, abas: null, meta: null, mercado: null, erro: '', carregado: false };
const raiz = $('#raiz');

const MENU = [
  { rota: 'painel', icone: 'painel', texto: 'Painel' },
  { rota: 'faccoes', icone: 'faccoes', texto: 'Facções' },
  { rota: 'conferencia', icone: 'conferencia', texto: 'Conferência' },
  { rota: 'vips', icone: 'vips', texto: 'Catálogo VIP' },
  { rota: 'economia', icone: 'economia', texto: 'Economia' },
  { rota: 'avisos', icone: 'avisos', texto: 'Entregas e recolhimentos' },
  { rota: 'planejador', icone: 'planejador', texto: 'Planejador de missões' },
  { rota: 'metricas', icone: 'metricas', texto: 'Métricas' },
  { rota: 'config', icone: 'config', texto: 'Configurações', admin: true },
];
const TITULOS = Object.fromEntries(MENU.map((m) => [m.rota, m.texto]));

/* ---------------- Login ---------------- */
function telaLogin(msg = '') {
  raiz.innerHTML = `<div class="login">
    <section class="login-arte">
      <div class="login-marca"><img src="assets/high_logo.png" alt="">HIGH OS</div>
      <div><h1>Central do <em>Ilegal</em>.</h1><p>Facções, groups, VIPs, economia, entregas e o planejador de missões num lugar só.</p></div>
      <span class="fraco">High Roleplay · Season 3</span>
    </section>
    <section class="login-caixa"><div class="login-cartao">
      <h2>Entrar</h2>
      <p class="muted">Use a conta Google cadastrada na staff. Os dados ficam no High OS; a planilha recebe uma cópia quando o administrador manda.</p>
      ${msg ? `<div class="aviso erro" style="margin-top:14px">${esc(msg)}</div>` : ''}
      <button class="btn" id="entrar">Entrar com Google</button>
      <p class="nota">Acesso restrito. Peça ao administrador para cadastrar o seu e-mail.</p>
    </div></section></div>`;
  $('#entrar').onclick = async (e) => {
    e.currentTarget.disabled = true;
    try { await nuvem.entrar(); } catch (err) { if (!/popup-closed|cancelled/.test(err?.code || '')) toast('Não foi possível entrar: ' + (err.message || err), 'erro'); e.currentTarget.disabled = false; }
  };
}

/* ---------------- Base (Firebase, em tempo real) ---------------- */
let pararBase = null;
window.__hosEstado = estado; // usado pelo editor de linhas das telas
document.addEventListener('hos:redesenhar', () => setTimeout(redesenharSePuder, 0));
function remontar() {
  if (!estado.abas) return;
  estado.base = montarBase({ faccoes: brutoDasAbas(estado.abas), mercado: estado.mercado });
}
/* Telas com formulário aberto não são redesenhadas sozinhas (perderia o que está sendo digitado). */
const TELAS_COM_FORMULARIO = new Set(['avisos', 'config', 'planejador', 'metricas']);
function redesenharSePuder() {
  if (document.querySelector('.fundo-modal')) return;
  const rota = (location.hash.replace(/^#\/?/, '') || 'painel').split(/[/?]/)[0];
  if (!TELAS_COM_FORMULARIO.has(rota)) rotear();
}
function ligarBase() {
  if (pararBase) pararBase();
  pararBase = nuvem.ouvirBase(({ meta, abas }) => {
    const primeira = !estado.carregado;
    estado.meta = meta; estado.abas = derivar(abas); estado.erro = ''; estado.carregado = true;
    remontar();
    if (primeira) rotear(); else redesenharSePuder();
  }, (err) => { estado.erro = err.message || String(err); estado.carregado = true; rotear(); });
  nuvem.lerMercadoNegro().then((m) => { estado.mercado = m; remontar(); if (estado.carregado) redesenharSePuder(); });
}

/** Aviso quando a base ainda não foi importada ou não pôde ser lida. */
export function avisoBase() {
  if (estado.erro) return `<div class="aviso erro"><div><b>Não consegui ler a base do Firebase.</b><div class="muted">${esc(estado.erro)}</div></div></div>`;
  if (estado.carregado && !estado.abas?.cadastro?.linhas?.length) return `<div class="aviso alerta"><div><b>A base das facções está vazia.</b><div class="muted">${estado.perfil?.admin ? 'Importe a planilha em Configurações → Base das facções.' : 'Peça ao administrador para importar a planilha.'}</div></div>${estado.perfil?.admin ? '<div class="acoes"><a class="btn peq" href="#/config">Importar</a></div>' : ''}</div>`;
  return '';
}

/* ---------------- Estrutura ---------------- */
function montarApp() {
  const p = estado.perfil;
  const itens = MENU.filter((m) => !m.admin || p.admin);
  raiz.innerHTML = `<div class="app">
    <nav class="trilho" aria-label="Menu">
      <img class="logo" src="assets/high_logo.png" alt="High OS">
      ${itens.map((m) => `<a href="#/${m.rota}" data-rota="${m.rota}" aria-label="${esc(m.texto)}">${ICONES[m.icone]}<span class="dica-nav">${esc(m.texto)}</span></a>`).join('')}
      <a href="#" class="fim" id="sair" aria-label="Sair">${ICONES.sair}<span class="dica-nav">Sair</span></a>
    </nav>
    <div class="conteudo">
      <header class="topo">
        <div class="local" id="local"></div><div class="espaco"></div>
        <div class="eu"><span class="avatar">${esc((p.nome || '?')[0].toUpperCase())}</span><div><b>${esc(p.nome)}</b><small>${esc(p.admin ? 'Administrador' : p.staff ? 'Staff' : 'Consulta')}</small></div></div>
      </header>
      <main id="tela" tabindex="-1"></main>
    </div></div>`;
  $('#sair').onclick = async (e) => { e.preventDefault(); await nuvem.sair(); };
}

/* ---------------- Rotas ---------------- */
let saida = null;
export async function rotear() {
  if (!estado.perfil) return;
  const [caminho, qs] = (location.hash.replace(/^#\/?/, '') || 'painel').split('?');
  const [rota, ...resto] = caminho.split('/');
  const params = new URLSearchParams(qs || '');
  if (saida) { try { saida(); } catch { /* ok */ } saida = null; }
  const el = $('#tela');
  $$('.trilho a[data-rota]').forEach((a) => a.classList.toggle('ativo', a.dataset.rota === (rota === 'faccao' ? 'faccoes' : rota)));
  $('#local').innerHTML = `<small>High OS · Central do Ilegal</small>${esc(rota === 'faccao' ? 'Ficha da facção' : TITULOS[rota] || 'Painel')}`;
  const ctx = { el, estado, params, aoSair: (f) => { saida = f; } };
  try {
    if (rota === 'faccao') telas.ficha(ctx, decodeURIComponent(resto.join('/')));
    else if (rota === 'planejador') await telaPlanejador(ctx);
    else if (rota === 'config' && estado.perfil.admin) await telas.config(ctx);
    else (telas[rota] || telas.painel)(ctx);
  } catch (err) {
    console.error(err);
    el.innerHTML = `<div class="aviso erro">Erro ao abrir a tela: ${esc(err.message || err)}</div>`;
  }
  el.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', rotear);

/* ---------------- Início ---------------- */
nuvem.aoMudarLogin(async (usuario) => {
  estado.usuario = usuario;
  if (!usuario) { if (pararBase) { pararBase(); pararBase = null; } estado.perfil = null; estado.carregado = false; estado.abas = null; estado.base = null; telaLogin(); return; }
  const p = await nuvem.perfil(usuario.email);
  if (!p) { await nuvem.sair(); telaLogin(`A conta ${usuario.email} não está cadastrada ou está desativada no High OS.`); return; }
  estado.perfil = p;
  prepararNuvemPlanejador(estado);
  montarApp();
  $('#tela').innerHTML = '<div class="boot" style="min-height:50vh"><img src="assets/high_logo.png" alt="" width="48" height="48"><span>Carregando a base…</span></div>';
  ligarBase();
});
