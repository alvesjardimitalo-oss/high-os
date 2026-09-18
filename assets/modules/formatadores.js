/* =====================================================================
   HIGH OS · FORMATADORES
   ---------------------------------------------------------------------
   Segundo corte da modularizacao. Mesmo criterio do primeiro: apenas
   funcoes puras, que leem os argumentos e devolvem um valor.

   O `esc` sozinho aparece 537 vezes no app.js - e a funcao que protege
   todo o HTML gerado contra injecao. Ter isso num modulo proprio,
   pequeno e testavel, vale mais do que a economia de linhas.
   ===================================================================== */

export const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;',
'<':'&lt;',
'>':'&gt;',
'"':'&quot;',
"'":'&#39;'}[m]));

export function alvesNorm(v=''){return String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}

export function fmtDuration(ms=0){ms=Math.max(0,Number(ms)||0);
const total=Math.floor(ms/1000),
h=Math.floor(total/3600),
m=Math.floor((total%3600)/60),
sec=total%60;
return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`}

export function fmtDateMs(ms){return ms?new Date(ms).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'}):'—'}

export function fmtMoneyMaybe(v){if(v===''||v==null)return '—';
if(typeof v==='number')return '$'+v.toLocaleString('pt-BR');
const n=Number(String(v).replace(/[^0-9,.-]/g,'').replace('.','').replace(',','.'));
return Number.isFinite(n)&&n?('$'+n.toLocaleString('pt-BR')):String(v)}
