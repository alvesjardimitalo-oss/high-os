// HIGH OS — utilitários de interface.
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const moeda = (v) => (v == null ? '—' : 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
export const pct = (v) => Math.round((Number(v) || 0) * 100) + '%';
/** "MECÂNICA ILEGAL" → "MECANICA-ILEGAL" (classe de cor do segmento). */
export const classeSeg = (s) => 'seg-' + String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z]+/g, '-').replace(/^-|-$/g, '');
export const norm = (v) => String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export function toast(msg, tipo = '') {
  const t = document.createElement('div');
  t.className = 'toast ' + tipo;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), tipo === 'erro' ? 6000 : 3500);
}

export function modal({ titulo, corpo, acoes = '' }) {
  const f = document.createElement('div');
  f.className = 'fundo-modal';
  f.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><h2>${esc(titulo)}</h2>${corpo}<div class="rodape">${acoes || '<button class="btn sec" data-fechar>Fechar</button>'}</div></div>`;
  const fechar = () => f.remove();
  f.addEventListener('click', (e) => { if (e.target === f || e.target.closest('[data-fechar]')) fechar(); });
  document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { fechar(); document.removeEventListener('keydown', esc); } });
  document.body.appendChild(f);
  return { el: f, fechar };
}

export function confirmar(msg, { ok = 'Confirmar', perigo = false } = {}) {
  return new Promise((res) => {
    const m = modal({ titulo: 'Confirmar', corpo: `<p class="muted">${esc(msg)}</p>`, acoes: `<button class="btn fantasma" data-nao>Cancelar</button><button class="btn ${perigo ? 'perigo' : ''}" data-sim>${esc(ok)}</button>` });
    m.el.querySelector('[data-sim]').onclick = () => { m.fechar(); res(true); };
    m.el.querySelector('[data-nao]').onclick = () => { m.fechar(); res(false); };
  });
}

export async function copiar(texto) {
  try { await navigator.clipboard.writeText(texto); toast('Copiado.'); }
  catch { toast('Não consegui copiar automaticamente.', 'erro'); }
}

const P = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
export const ICONES = {
  painel: P('<rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/>'),
  faccoes: P('<path d="M12 3 4 7v5c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V7l-8-4Z"/><path d="m9 12 2 2 4-4"/>'),
  conferencia: P('<path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/>'),
  vips: P('<path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7L12 3Z"/>'),
  economia: P('<path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'),
  avisos: P('<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1Z"/><path d="M16 8a5 5 0 0 1 0 8M19 5a9 9 0 0 1 0 14"/>'),
  planejador: P('<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"/><path d="M9 3v15M15 6v15"/>'),
  metricas: P('<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-6"/>'),
  config: P('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>'),
  sair: P('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>'),
};
