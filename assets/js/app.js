// HIGH OS — Central do Ilegal. Inicialização, login e navegação.
import * as nuvem from './nuvem.js';
import { montarBase } from './dados.js';
import { esc, $, $$, toast, ICONES } from './ui.js';
import * as telas from './telas.js';
import { telaPlanejador, prepararNuvemPlanejador } from './planejador.js';

export const estado = { usuario: null, perfil: null, base: null, lidoEm: null, erro: '', semAcesso: false };
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
      <div><h1>Central do <em>Ilegal</em>.</h1><p>Facções, groups, VIPs, economia, entregas e o planejador de missões num lugar só — lido direto das planilhas oficiais, sem mexer nelas.</p></div>
      <span class="fraco">High Roleplay · Season 3</span>
    </section>
    <section class="login-caixa"><div class="login-cartao">
      <h2>Entrar</h2>
      <p class="muted">Use a conta Google cadastrada na staff. O Google vai pedir permissão para <b>ver</b> as planilhas do Ilegal — o High OS não consegue alterá-las.</p>
      ${msg ? `<div class="aviso erro" style="margin-top:14px">${esc(msg)}</div>` : ''}
      <button class="btn" id="entrar">Entrar com Google</button>
      <p class="nota">Acesso restrito. Peça ao administrador para cadastrar o seu e-mail.</p>
    </div></section></div>`;
  $('#entrar').onclick = async (e) => {
    e.currentTarget.disabled = true;
    try { await nuvem.entrar(); } catch (err) { if (!/popup-closed|cancelled/.test(err?.code || '')) toast('Não foi possível entrar: ' + (err.message || err), 'erro'); e.currentTarget.disabled = false; }
  };
}

/* ---------------- Planilhas ---------------- */
export async function carregarPlanilhas({ silencioso = false } = {}) {
  try {
    const bruto = await nuvem.lerPlanilhas();
    estado.base = montarBase(bruto); estado.lidoEm = bruto.lidoEm; estado.erro = ''; estado.semAcesso = false;
    if (!silencioso) toast('Planilhas atualizadas.');
  } catch (err) {
    estado.semAcesso = err instanceof nuvem.SemAcessoPlanilha;
    estado.erro = err.message || String(err);
    const cache = nuvem.ultimaLeitura();
    if (!estado.base && cache) { estado.base = montarBase(cache); estado.lidoEm = cache.lidoEm; }
  }
  desenharChip();
}
function desenharChip() {
  const c = $('#chip-sync'); if (!c) return;
  const min = estado.lidoEm ? Math.round((Date.now() - new Date(estado.lidoEm)) / 60000) : null;
  c.className = 'chip-sync' + (estado.erro ? (estado.base ? ' velho' : ' erro') : min > 15 ? ' velho' : '');
  c.innerHTML = `<i></i>${estado.erro && !estado.base ? 'Planilhas sem acesso' : min == null ? 'Lendo planilhas…' : 'Planilhas · ' + (min < 1 ? 'agora' : 'há ' + min + ' min')}`;
  c.title = estado.erro || 'Clique para ler as planilhas de novo';
}

/** Aviso padrão quando a leitura falhou: renovar acesso ou mostrar o motivo. */
export function avisoPlanilha() {
  if (!estado.erro) return '';
  return `<div class="aviso ${estado.base ? 'alerta' : 'erro'}"><div><b>${estado.semAcesso ? 'O acesso às planilhas expirou.' : 'Não consegui ler as planilhas.'}</b><div class="muted">${esc(estado.semAcesso ? 'O Google libera a leitura por 1 hora. Renove para ver os dados atuais.' : estado.erro)}${estado.base ? ' Mostrando a última leitura deste computador.' : ''}</div></div>
    <div class="acoes"><button class="btn peq" data-reconectar>${estado.semAcesso ? 'Renovar acesso' : 'Tentar de novo'}</button></div></div>`;
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
        <button class="chip-sync" id="chip-sync" type="button"></button>
        <div class="eu"><span class="avatar">${esc((p.nome || '?')[0].toUpperCase())}</span><div><b>${esc(p.nome)}</b><small>${esc(p.admin ? 'Administrador' : p.staff ? 'Staff' : 'Consulta')}</small></div></div>
      </header>
      <main id="tela" tabindex="-1"></main>
    </div></div>`;
  $('#sair').onclick = async (e) => { e.preventDefault(); await nuvem.sair(); };
  $('#chip-sync').onclick = recarregar;
  desenharChip();
}

async function recarregar() {
  if (estado.semAcesso) {
    try { await nuvem.reconectarPlanilhas(); } catch (err) { if (!/popup-closed|cancelled/.test(err?.code || '')) toast(err.message || String(err), 'erro'); return; }
  }
  $('#chip-sync').innerHTML = '<i></i>Lendo planilhas…';
  await carregarPlanilhas();
  rotear();
}
document.addEventListener('click', (e) => { if (e.target.closest('[data-reconectar]')) { e.preventDefault(); recarregar(); } });

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
  if (!usuario) { estado.perfil = null; telaLogin(); return; }
  const p = await nuvem.perfil(usuario.email);
  if (!p) { await nuvem.sair(); telaLogin(`A conta ${usuario.email} não está cadastrada ou está desativada no High OS.`); return; }
  estado.perfil = p;
  prepararNuvemPlanejador(estado);
  const cache = nuvem.ultimaLeitura();
  if (cache) { estado.base = montarBase(cache); estado.lidoEm = cache.lidoEm; }
  montarApp();
  if (!estado.base) $('#tela').innerHTML = '<div class="boot" style="min-height:50vh"><img src="assets/high_logo.png" alt="" width="48" height="48"><span>Lendo as planilhas…</span></div>';
  else rotear();
  await carregarPlanilhas({ silencioso: true });
  rotear();
  // Mantém a leitura em dia sem ninguém precisar clicar.
  setInterval(() => { if (!document.hidden && nuvem.temAcessoPlanilhas()) carregarPlanilhas({ silencioso: true }).then(() => { if (/^(#\/?(painel)?)?$/.test(location.hash)) rotear(); }); }, 5 * 60 * 1000);
});
